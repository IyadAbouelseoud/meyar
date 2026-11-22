import '@design/fonts/fonts.css';
import '@design/tokens.css';
import '@design/meyar.css';
import './app.css';

import { initMotion, calibrate, setLang, setElder } from '@design/meyar.js';
import { renderApp } from './render.js';

const root = document.getElementById('app');

const params = new URLSearchParams(window.location.search);

const state = {
  lang: params.get('lang') === 'en' ? 'en' : 'ar',
  elder: params.get('elder') === 'on',
  tab: ['genes', 'meds', 'doctor'].includes(params.get('tab')) ? params.get('tab') : 'genes',
  patientId: params.get('patient') || 'demo-001',
  contract: null,
  error: null,
};

async function loadPatient(patientId) {
  state.patientId = patientId;
  state.error = null;
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
}

function update() {
  setLang(state.lang);
  setElder(state.elder);
  renderApp(root, state);
  calibrate(root);
}

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
  } else if (action === 'tab') {
    state.tab = btn.dataset.tab;
    update();
    window.scrollTo({ top: 0 });
  } else if (action === 'patient') {
    loadPatient(btn.dataset.patient);
  } else if (action === 'speak' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(btn.dataset.speak);
    utter.lang = state.lang === 'ar' ? 'ar-SA' : 'en-US';
    window.speechSynthesis.speak(utter);
  }
});

initMotion();
loadPatient(state.patientId);
