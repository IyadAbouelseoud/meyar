import '@design/fonts/fonts.css';
import '@design/tokens.css';
import '@design/meyar.css';
import './app.css';

import { initMotion, calibrate, setLang, setElder } from '@design/meyar.js';
import { getDrugsForGene } from './lookup.js';
import { applyPhenoconversion, canonicalDrugName } from './phenoconvert.js';
import { encodeQrEnvelope, decodeQrEnvelope, renderQrSvg } from './qr.js';
import { isValidPin, normalizeDigits } from './pinguard.js';
import { renderApp, renderOtcResultHtml } from './render.js';
import { COPY } from './i18n.js';
import { hasSpeechVoice, selectVoiceForLang } from './speech.js';

const root = document.getElementById('app');
const params = new URLSearchParams(window.location.search);

function readPref(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function readLocalMeds(patientId) {
  const raw = readPref(`meyar:meds:${patientId}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
        .filter((m) => m && typeof m.name === 'string' && m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          source: 'patient-entered',
          mock: true,
        }))
      : [];
  } catch {
    return [];
  }
}

function writeLocalMeds(patientId, meds) {
  writePref(`meyar:meds:${patientId}`, JSON.stringify(meds));
}

const initialLang = params.get('lang') === 'en'
  ? 'en'
  : params.get('lang') === 'ar'
    ? 'ar'
    : (readPref('meyar:lang') === 'en' ? 'en' : 'ar');

const initialElder = params.has('elder')
  ? params.get('elder') === 'on'
  : readPref('meyar:elder') === 'on';

const state = {
  lang: initialLang,
  elder: initialElder,
  caregiverMode: params.get('mode') === 'caregiver',
  caregiverCopied: false,
  tab: ['genes', 'meds', 'otc', 'doctor'].includes(params.get('tab')) ? params.get('tab') : 'genes',
  pharmacistView: params.get('view') === 'pharmacist' || params.get('tab') === 'pharmacist',
  otcQuery: params.get('q') || '',
  medDraft: '',
  patientId: params.get('patient') || 'demo-001',
  devMode: params.get('dev') === '1',
  speechAvailable: hasSpeechVoice(initialLang),
  speakingIndex: null,
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
  localMeds: [],
  effectiveContract: null,
  error: null,
};

function recomputeEffectiveContract() {
  state.effectiveContract = state.contract
    ? applyPhenoconversion(state.contract, state.localMeds)
    : null;
}

function syncUrlMode() {
  try {
    const url = new URL(window.location.href);
    if (state.caregiverMode) url.searchParams.set('mode', 'caregiver');
    else url.searchParams.delete('mode');
    if (state.pharmacistView) url.searchParams.set('view', 'pharmacist');
    else url.searchParams.delete('view');
    url.searchParams.set('patient', state.patientId);
    url.searchParams.set('lang', state.lang);
    url.searchParams.set('elder', state.elder ? 'on' : 'off');
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Ignore history errors
  }
}

function buildCaregiverUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('patient', state.patientId);
  url.searchParams.set('mode', 'caregiver');
  url.searchParams.set('lang', state.lang);
  url.searchParams.set('elder', state.elder ? 'on' : 'off');
  return url.toString();
}

let qrSeq = 0;

async function refreshQr() {
  const activeContract = state.effectiveContract || state.contract;
  if (!activeContract) {
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
  const encoded = await encodeQrEnvelope(activeContract, {
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
    state.localMeds = readLocalMeds(patientId);
    recomputeEffectiveContract();
  } catch (err) {
    state.contract = null;
    state.localMeds = [];
    state.effectiveContract = null;
    state.error = state.lang === 'ar'
      ? `تعذّر تحميل الملف التجريبي (${patientId}).`
      : `Could not load demo profile (${patientId}).`;
  }
  update();
  refreshQr();
}

function addPatientMedication(rawName) {
  if (state.caregiverMode || !state.contract) return;
  const trimmed = String(rawName || '').trim();
  if (!trimmed) return;
  const canon = canonicalDrugName(trimmed);
  const existing = (state.effectiveContract?.currentMedications || [])
    .some((m) => canonicalDrugName(m.name) === canon);
  if (!existing) {
    state.localMeds = [
      ...state.localMeds,
      { name: canon, source: 'patient-entered', mock: true },
    ];
    writeLocalMeds(state.patientId, state.localMeds);
    recomputeEffectiveContract();
  }
  state.medDraft = '';
  update();
  refreshQr();
}

function removePatientMedication(medName) {
  if (state.caregiverMode || !state.contract) return;
  const canon = canonicalDrugName(medName);
  state.localMeds = state.localMeds.filter((m) => canonicalDrugName(m.name) !== canon);
  writeLocalMeds(state.patientId, state.localMeds);
  recomputeEffectiveContract();
  update();
  refreshQr();
}

function update() {
  state.speechAvailable = hasSpeechVoice(state.lang);
  setLang(state.lang);
  setElder(state.elder);
  renderApp(root, state);
  calibrate(root);
}

root.addEventListener('change', (e) => {
  const elderInput = e.target.closest('input[data-action="elder"]');
  if (!elderInput) return;
  state.elder = Boolean(elderInput.checked);
  writePref('meyar:elder', state.elder ? 'on' : 'off');
  syncUrlMode();
  update();
});

// Inputs only update state (no re-render while typing, so focus stays put).
root.addEventListener('input', (e) => {
  const el = e.target;
  const activeContract = state.effectiveContract || state.contract;
  if (el.dataset.action === 'otc-query') {
    state.otcQuery = el.value;
    const out = document.getElementById('otc-result');
    if (out) out.innerHTML = renderOtcResultHtml(state.otcQuery, activeContract, state.lang);
    return;
  }
  if (el.dataset.action === 'med-draft') {
    state.medDraft = el.value;
    return;
  }
  if (state.caregiverMode) return;
  if (el.dataset.action === 'qr-pin' || el.dataset.action === 'qr-pin-confirm') {
    const clean = normalizeDigits(el.value).replace(/[^0-9]/g, '').slice(0, 6);
    if (clean !== el.value) el.value = clean;
    if (el.dataset.action === 'qr-pin') state.qrPin = clean; else state.qrPinConfirm = clean;
  } else if (el.dataset.action === 'qr-emergency') {
    state.qrEmergency = el.value;
  }
});

root.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-action="add-med-form"]');
  if (!form) return;
  e.preventDefault();
  const input = document.getElementById('med-add-input');
  addPatientMedication(input ? input.value : state.medDraft);
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
    writePref('meyar:lang', state.lang);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.speakingIndex = null;
    syncUrlMode();
    update();
  } else if (action === 'otc-pick') {
    const activeContract = state.effectiveContract || state.contract;
    state.otcQuery = btn.dataset.query || '';
    const input = document.getElementById('otc-input');
    const out = document.getElementById('otc-result');
    if (input) input.value = state.otcQuery;
    if (out) out.innerHTML = renderOtcResultHtml(state.otcQuery, activeContract, state.lang);
    input?.focus();
  } else if (action === 'otc-clear') {
    const activeContract = state.effectiveContract || state.contract;
    state.otcQuery = '';
    const input = document.getElementById('otc-input');
    const out = document.getElementById('otc-result');
    if (input) input.value = '';
    if (out) out.innerHTML = renderOtcResultHtml('', activeContract, state.lang);
    input?.focus();
  } else if (action === 'med-pick') {
    addPatientMedication(btn.dataset.med || '');
  } else if (action === 'remove-med') {
    removePatientMedication(btn.dataset.med || '');
  } else if (action === 'open-pharmacist') {
    state.pharmacistView = true;
    syncUrlMode();
    update();
    window.scrollTo({ top: 0 });
  } else if (action === 'close-pharmacist') {
    state.pharmacistView = false;
    syncUrlMode();
    update();
    window.scrollTo({ top: 0 });
  } else if (action === 'tab') {
    state.pharmacistView = false;
    state.tab = btn.dataset.tab;
    state.caregiverCopied = false;
    syncUrlMode();
    update();
    window.scrollTo({ top: 0 });
  } else if (action === 'patient' && !state.caregiverMode) {
    loadPatient(btn.dataset.patient);
  } else if (action === 'caregiver-toggle') {
    state.caregiverMode = !state.caregiverMode;
    state.caregiverCopied = false;
    syncUrlMode();
    update();
  } else if (action === 'caregiver-copy') {
    const shareUrl = buildCaregiverUrl();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      state.caregiverCopied = true;
    } catch {
      state.caregiverCopied = false;
    }
    update();
  } else if (action === 'toggle-plaintext' && !state.caregiverMode) {
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
  } else if (action === 'print-id1' || action === 'print-a6' || action === 'print-both') {
    if (!state.qrResult || !state.qrResult.encrypted) return;
    const mode = action === 'print-id1' ? 'id1' : action === 'print-a6' ? 'a6' : 'both';
    document.body.dataset.print = mode;
    document.documentElement.dataset.print = mode;
    window.print();
  } else if (action === 'speak' && 'speechSynthesis' in window) {
    const idx = Number(btn.dataset.geneIndex);
    if (state.speakingIndex === idx) {
      window.speechSynthesis.cancel();
      state.speakingIndex = null;
      update();
      return;
    }
    window.speechSynthesis.cancel();
    const voice = selectVoiceForLang(window.speechSynthesis.getVoices(), state.lang);
    if (!voice) {
      state.speechAvailable = false;
      state.speakingIndex = null;
      update();
      return;
    }
    const utter = new SpeechSynthesisUtterance(btn.dataset.speak || '');
    utter.voice = voice;
    utter.lang = voice.lang;
    state.speakingIndex = idx;
    utter.onend = () => {
      if (state.speakingIndex === idx) {
        state.speakingIndex = null;
        update();
      }
    };
    utter.onerror = () => {
      if (state.speakingIndex === idx) {
        state.speakingIndex = null;
        update();
      }
    };
    window.speechSynthesis.speak(utter);
    update();
  }
});

if ('speechSynthesis' in window && typeof window.speechSynthesis.addEventListener === 'function') {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    const available = hasSpeechVoice(state.lang);
    if (available !== state.speechAvailable) {
      state.speechAvailable = available;
      update();
    }
  });
}

initMotion();
window.addEventListener('afterprint', () => {
  delete document.body.dataset.print;
  delete document.documentElement.dataset.print;
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
loadPatient(state.patientId);
