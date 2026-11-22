import '@design/fonts/fonts.css';
import '@design/tokens.css';
import '@design/meyar.css';
import './app.css';

import { initMotion, calibrate, setLang, setElder } from '@design/meyar.js';
import { getDrugsForGene } from './lookup.js';
import { encodeQrEnvelope, decodeQrEnvelope, renderQrSvg } from './qr.js';
import { renderApp } from './render.js';

const root = document.getElementById('app');

const params = new URLSearchParams(window.location.search);

const state = {
  lang: params.get('lang') === 'en' ? 'en' : 'ar',
  elder: params.get('elder') === 'on',
  tab: ['genes', 'meds', 'doctor'].includes(params.get('tab')) ? params.get('tab') : 'genes',
  patientId: params.get('patient') || 'demo-001',
  devMode: params.get('dev') === '1',
  qrPin: '123456',
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
  const seq = ++qrSeq;
  const pin = state.qrPin && state.qrPin.length >= 4 ? state.qrPin : '123456';
  const encoded = await encodeQrEnvelope(state.contract, {
    pin,
    plaintext: state.devMode && state.qrPlaintext,
    getDrugsFn: getDrugsForGene,
  });
  if (seq !== qrSeq) return;
  const svgInfo = renderQrSvg(encoded.qrText, {
    ariaLabel: `${state.contract.patientId} offline QR`,
  });
  state.qrResult = { ...encoded, ...svgInfo };
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

root.addEventListener('input', (e) => {
  const input = e.target.closest('[data-action="qr-pin"]');
  if (!input) return;
  state.qrPin = input.value;
  state.qrDecoded = null;
  state.qrDecodeError = false;
  if (state.qrPin.length >= 4) {
    refreshQr();
  }
});

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
      state.qrDecoded = await decodeQrEnvelope(state.qrResult.qrText, { pin: state.qrPin });
    } catch {
      state.qrDecoded = null;
      state.qrDecodeError = true;
    }
    update();
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
