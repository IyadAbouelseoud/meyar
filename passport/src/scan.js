import '@design/fonts/fonts.css';
import '@design/tokens.css';
import '@design/meyar.css';
import './app.css';

import jsQR from 'jsqr';
import cpicTable from '@tables/cpic_recommendations.json';
import saudiFreqs from '@tables/saudi_frequencies.json';
import { initMotion, calibrate, setLang, setElder } from '@design/meyar.js';
import { decodeQrEnvelope, holderView } from './qr.js';
import { createPinLimiter, PIN_LENGTH } from './pinguard.js';
import { buildCdsCardsFromPayload } from './scan-lookup.js';
import { renderScanApp, SCAN_COPY } from './scan-render.js';

const root = document.getElementById('scan-app');
const params = new URLSearchParams(window.location.search);

const state = {
  lang: params.get('lang') === 'en' ? 'en' : 'ar',
  elder: params.get('elder') === 'on',
  step: 'scan', // 'scan' | 'pin' | 'result'
  cameraActive: false,
  scanError: '',
  pasteDraft: '',
  rawQrText: '',
  holder: null, // what may be shown before the PIN (holder line + optional emergency line)
  pin: '',
  pinError: '',
  lockMs: 0,
  decrypting: false,
  decoded: null,
  cards: [],
};
const devMode = params.get('dev') === '1';

// Cosmetic wrong-PIN limit (C8): slows tapping on this screen only; a copied QR can be
// attacked offline. One limiter per page session, never persisted, never stores the PIN.
const limiter = createPinLimiter();
let lockTimer = null;
function startLockCountdown() {
  clearInterval(lockTimer);
  state.lockMs = limiter.remainingMs();
  if (state.lockMs <= 0) return;
  lockTimer = setInterval(() => {
    state.lockMs = limiter.remainingMs();
    if (state.lockMs <= 0) clearInterval(lockTimer);
    update();
  }, 1000);
}

let mediaStream = null;
let rafId = null;
let scanCanvas = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function stopCamera() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((tr) => tr.stop());
    mediaStream = null;
  }
  state.cameraActive = false;
}

function update() {
  setLang(state.lang);
  setElder(state.elder);
  renderScanApp(root, state);
  calibrate(root);
}

async function handleScannedText(text) {
  const t = SCAN_COPY[state.lang] || SCAN_COPY.ar;
  let envelope;
  try {
    envelope = JSON.parse(String(text || '').trim());
  } catch {
    state.scanError = t.qrInvalid;
    update();
    return;
  }
  // Plaintext (v:0) cards exist only behind C2's dev flag; production readers refuse them.
  if (!envelope || (envelope.v !== 1 && !(devMode && envelope.v === 0))) {
    state.scanError = t.qrInvalid;
    update();
    return;
  }

  let holder = null;
  if (envelope.v === 1) {
    try {
      holder = holderView(envelope);
    } catch {
      state.scanError = t.qrInvalid;
      update();
      return;
    }
  }

  stopCamera();
  state.scanError = '';
  state.rawQrText = JSON.stringify(envelope);
  state.holder = holder;

  if (envelope.v === 0) {
    try {
      const payload = await decodeQrEnvelope(state.rawQrText, { allowPlaintext: true });
      state.decoded = payload;
      state.cards = buildCdsCardsFromPayload(payload, {
        cpicRows: cpicTable.rows || [],
        freqRows: saudiFreqs.rows || [],
      });
      state.step = 'result';
    } catch {
      state.scanError = t.qrInvalid;
    }
    update();
    return;
  }

  state.pin = '';
  state.pinError = '';
  state.step = 'pin';
  update();
}

async function decodeImageSource(source, width, height) {
  if ('BarcodeDetector' in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(source);
      if (codes && codes.length > 0 && codes[0].rawValue) {
        return codes[0].rawValue;
      }
    } catch {
      // Fall back to jsQR below
    }
  }
  if (!scanCanvas) scanCanvas = document.createElement('canvas');
  scanCanvas.width = width;
  scanCanvas.height = height;
  const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const res = jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
  return res ? res.data : null;
}

async function startCamera() {
  const t = SCAN_COPY[state.lang] || SCAN_COPY.ar;
  state.scanError = '';
  if (!navigator.mediaDevices?.getUserMedia) {
    state.scanError = t.camError;
    update();
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    state.cameraActive = true;
    update();
    const video = document.getElementById('scan-video');
    video.srcObject = mediaStream;
    await video.play();

    const tick = async () => {
      if (!state.cameraActive || !mediaStream) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const found = await decodeImageSource(video, video.videoWidth, video.videoHeight);
        if (found) {
          await handleScannedText(found);
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  } catch {
    stopCamera();
    state.scanError = t.camError;
    update();
  }
}

async function submitPin() {
  const t = SCAN_COPY[state.lang] || SCAN_COPY.ar;
  if (state.pin.length !== PIN_LENGTH || state.decrypting || !limiter.canTry()) return;
  state.decrypting = true;
  state.pinError = '';
  update();

  try {
    const payload = await decodeQrEnvelope(state.rawQrText, { pin: state.pin });
    state.decoded = payload;
    state.cards = buildCdsCardsFromPayload(payload, {
      cpicRows: cpicTable.rows || [],
      freqRows: saudiFreqs.rows || [],
    });
    state.step = 'result';
    state.pin = '';
    limiter.recordSuccess();
  } catch {
    state.pinError = t.pinError;
    state.pin = '';
    limiter.recordFailure();
    startLockCountdown();
  } finally {
    state.decrypting = false;
    update();
  }
}

root.addEventListener('change', async (e) => {
  const fileInput = e.target.closest('[data-action="scan-file"]');
  if (!fileInput || !fileInput.files?.[0]) return;
  const t = SCAN_COPY[state.lang] || SCAN_COPY.ar;
  try {
    const bitmap = await createImageBitmap(fileInput.files[0]);
    const found = await decodeImageSource(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    if (found) {
      await handleScannedText(found);
    } else {
      state.scanError = t.qrInvalid;
      update();
    }
  } catch {
    state.scanError = t.qrInvalid;
    update();
  }
});

root.addEventListener('input', (e) => {
  if (e.target.id === 'scan-paste-input') {
    state.pasteDraft = e.target.value;
  }
});

root.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'lang') {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    update();
  } else if (action === 'elder') {
    state.elder = !state.elder;
    update();
  } else if (action === 'start-cam') {
    startCamera();
  } else if (action === 'stop-cam') {
    stopCamera();
    update();
  } else if (action === 'load-pasted') {
    const area = document.getElementById('scan-paste-input');
    handleScannedText(area ? area.value : state.pasteDraft);
  } else if (action === 'pin-digit') {
    if (state.pin.length < PIN_LENGTH && limiter.canTry()) {
      state.pin += btn.dataset.digit;
      state.pinError = '';
      update();
    }
  } else if (action === 'pin-back') {
    state.pin = state.pin.slice(0, -1);
    state.pinError = '';
    update();
  } else if (action === 'pin-clear') {
    state.pin = '';
    state.pinError = '';
    update();
  } else if (action === 'decrypt') {
    submitPin();
  } else if (action === 'reset-scan') {
    stopCamera();
    state.step = 'scan';
    state.rawQrText = '';
    state.holder = null;
    state.pin = '';
    state.pinError = '';
    state.decoded = null;
    state.cards = [];
    state.scanError = '';
    update();
  }
});

window.addEventListener('keydown', (e) => {
  if (state.step !== 'pin') return;
  if (/^[0-9]$/.test(e.key) && state.pin.length < PIN_LENGTH && limiter.canTry()) {
    state.pin += e.key;
    state.pinError = '';
    update();
  } else if (e.key === 'Backspace') {
    state.pin = state.pin.slice(0, -1);
    state.pinError = '';
    update();
  } else if (e.key === 'Enter' && state.pin.length === PIN_LENGTH) {
    submitPin();
  }
});

initMotion();
update();
