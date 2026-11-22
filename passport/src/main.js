import '@design/fonts/fonts.css';
import '@design/tokens.css';
import '@design/meyar.css';
import './app.css';

import { initMotion, calibrate, setLang, setElder } from '@design/meyar.js';
import { getDrugsForGene } from './lookup.js';
import { encodeQrEnvelope, decodeQrEnvelope, renderQrSvg } from './qr.js';
import { isValidPin, normalizeDigits } from './pinguard.js';
import { renderApp } from './render.js';
import { COPY } from './i18n.js';

const root = document.getElementById('app');

const params = new URLSearchParams(window.location.search);

const state = {
  lang: params.get('lang') === 'en' ? 'en' : 'ar',
  elder: params.get('elder') === 'on',
  tab: ['genes', 'meds', 'doctor'].includes(params.get('tab')) ? params.get('tab') : 'genes',
  patientId: params.get('patient') || 'demo-001',
  devMode: params.get('dev') === '1',
  // C8: no default PIN. Held in memory only, never stored or logged.
  qrPin: '',
  qrPinConfirm: '',
  qrPinError: '',
  qrEmergencyOn: false, // off by default
  qrEmergency: '',
  qrIssued: 0, // cards made this session (a new one = reissue)
  qrPlaintext: false,
  qrResult: null,
  qrDecoded: null,
  qrDecodeError: false,
  contract: null,
  error: null,
};

let qrSeq = 0;

async function refreshQr() {
  if (!state.contract) {
    state.qrResult = null;
    return;
  }
  const plaintext = state.devMode && state.qrPlaintext;
  if (!plaintext && !isValidPin(state.qrPin)) {
    state.qrResult = null;
    return;
  }
  const seq = ++qrSeq;
  // Every encode draws a fresh salt and nonce: a new card, never an edit of the old one.
  const encoded = await encodeQrEnvelope(state.contract, {
    pin: state.qrPin,
    plaintext,
    getDrugsFn: getDrugsForGene,
    emergency: state.qrEmergencyOn ? state.qrEmergency : '',
  });
  if (seq !== qrSeq) return;
  const svgInfo = renderQrSvg(encoded.qrText, {
    ariaLabel: 'Meyar Medication Passport encrypted QR',
  });
  state.qrResult = { ...encoded, ...svgInfo };
  state.qrIssued += 1;
  update();
}

async function loadPatient(patientId) {
  state.patientId = patientId;
  state.error = null;
  state.qrResult = null;
  state.qrDecoded = null;
  state.qrDecodeError = false;
  try {
    const res = await fetch(`/demo/${encodeURIComponent(patientId)}.contract.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.contract = await res.json();
  } catch (err) {
    state.contract = null;
    state.error = state.lang === 'ar'
      ? `تعذّر تحميل الملف التجريبي (${patientId}).`
      : `Could not load demo profile (${patientId}).`;
  }
  update();
  refreshQr();
}

function update() {
  setLang(state.lang);
  setElder(state.elder);
  renderApp(root, state);
  calibrate(root);
}

// Inputs only update state (no re-render while typing, so focus stays put).
root.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.action === 'qr-pin' || el.dataset.action === 'qr-pin-confirm') {
    const clean = normalizeDigits(el.value).replace(/[^0-9]/g, '').slice(0, 6);
    if (clean !== el.value) el.value = clean;
    if (el.dataset.action === 'qr-pin') state.qrPin = clean; else state.qrPinConfirm = clean;
  } else if (el.dataset.action === 'qr-emergency') {
    state.qrEmergency = el.value;
  }
});

root.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'qr-emergency-toggle') {
    state.qrEmergencyOn = e.target.checked;
    update();
  }
});

async function issueCard() {
  const t = COPY[state.lang] || COPY.ar;
  state.qrDecoded = null;
  state.qrDecodeError = false;
  if (!isValidPin(state.qrPin)) {
    state.qrPinError = t.qrPinErrSix;
  } else if (state.qrPin !== state.qrPinConfirm) {
    state.qrPinError = t.qrPinErrMatch;
  } else {
    state.qrPinError = '';
    await refreshQr();
  }
  update();
}

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'lang') {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    update();
  } else if (action === 'elder') {
    state.elder = !state.elder;
    update();
  } else if (action === 'tab') {
    state.tab = btn.dataset.tab;
    update();
    window.scrollTo({ top: 0 });
  } else if (action === 'patient') {
    loadPatient(btn.dataset.patient);
  } else if (action === 'toggle-plaintext') {
    state.qrPlaintext = !state.qrPlaintext;
    state.qrDecoded = null;
    state.qrDecodeError = false;
    refreshQr();
  } else if (action === 'decode-qr' && state.qrResult) {
    state.qrDecodeError = false;
    try {
      state.qrDecoded = await decodeQrEnvelope(state.qrResult.qrText, { pin: state.qrPin, allowPlaintext: state.devMode });
    } catch {
      state.qrDecoded = null;
      state.qrDecodeError = true;
    }
    update();
  } else if (action === 'issue-card') {
    issueCard();
  } else if (action === 'speak' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(btn.dataset.speak);
    utter.lang = state.lang === 'ar' ? 'ar-SA' : 'en-US';
    window.speechSynthesis.speak(utter);
  }
});

initMotion();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
loadPatient(state.patientId);
