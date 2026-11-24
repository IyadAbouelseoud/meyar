// F6 second-device reader: scans a C8 Passport QR with this device's camera (or an image),
// measures it, and opens it locally with the holder's PIN. No network is used after the page
// loads: decoding is jsQR, decryption is WebCrypto through passport/src/qr.js (read-only reuse).
// Research prototype — not for clinical use. Demo data only.
import { decodeQrEnvelope, holderView } from '../passport-src/qr.js';
import { isValidPin, normalizeDigits } from '../passport-src/pinguard.js';
import { scaleHTML, setLang, initMotion } from '../design/meyar.js';

const T = {
  ar: {
    eyebrow: 'مستشفى آخر · جهاز ثانٍ', title: 'قارئ جواز الدواء', mock: 'بيانات تجريبية',
    proto: 'نموذج بحثي أولي — ليس للاستخدام السريري. يعمل دون اتصال: لا يُرسل شيء من البطاقة إلى أي خادم.',
    netOn: 'الشبكة: متصلة', netOff: 'الشبكة: مقطوعة — القراءة محلية',
    scanTitle: 'امسح بطاقة المريض', scanIntro: 'وجّه الكاميرا إلى رمز QR على جواز المريض أو بطاقته المطبوعة. يُقرأ الرمز ويُفتح على هذا الجهاز فقط.',
    camera: 'افتح الكاميرا', image: 'اختر صورة للرمز', demoOk: 'بطاقة العرض (demo-001)', demoBad: 'بطاقة معدّلة (بايت واحد)',
    mBytes: 'حجم الرمز المقروء', mVersion: 'إصدار QR', mDecoder: 'فُكّ بواسطة', bytes: (n) => `${n} بايت`,
    holder: 'جواز دواء مِعيار (الإصدار ١). اطلب الرمز السري من صاحب البطاقة.', emergency: 'سطر الطوارئ الذي اختاره المريض',
    pinLabel: 'الرمز السري من صاحب البطاقة (٦ أرقام)', open: 'افتح البطاقة',
    pinHonest: 'الرمز يمنع القراءة العابرة فقط: يمكن تخمينه دون اتصال من نسخة منسوخة من الرمز.',
    resultTitle: 'النتيجة', resultEmpty: 'لا شيء بعد. امسح بطاقة ثم أدخل الرمز السري.',
    rejectTitle: 'رُفضت البطاقة — لا يُعرض منها شيء',
    rejectGcm: 'فشل فحص السلامة (AES-GCM): تغيّر الرمز بعد إصداره، أو الرمز السري غير صحيح.',
    rejectShape: (m) => `بنية الرمز غير صالحة: ${m}`, rejectNotMeyar: 'هذا الرمز ليس جواز دواء مِعيار.',
    rejectPin: 'أدخل ٦ أرقام.', noQr: 'لم يُعثر على رمز QR في الصورة.', camErr: 'تعذّر فتح الكاميرا على هذا الجهاز. اختر صورة للرمز بدلاً من ذلك.',
    origin: 'منشأ العيّنة', genetic: 'النتيجة الجينية', acting: 'يعمل الآن مثل', because: (d) => `بسبب ${d}`,
    notAssessed: 'لم يُقيَّم عدد النسخ في هذا الفحص — لا توجد نتيجة',
    stop: 'لا يُوصف دون مراجعة', ask: 'راجع الدليل قبل الوصف', better: (a) => `أنسب لجيناته وفق CPIC: ${a}`,
    coverage: (a, t, u) => `غطّى الفحص ${a} من ${t} موضعاً محدِّداً${u ? `؛ لم يفحص ${u}` : ''}`,
    meds: 'أدوية حالية (من البطاقة)', footer: 'مِعيار · نموذج بحثي أولي، ليس للاستخدام السريري · بيانات تجريبية فقط · CPIC: البحث في الجداول فقط، لا يولّد أي نموذج لغوي جرعات · يعمل على بيانات اصطناعية وبيانات GeT-RM المرجعية؛ لم تُستخدم أي بيانات لمرضى.',
  },
  en: {
    eyebrow: 'Another hospital · second device', title: 'Medication Passport reader', mock: 'Demo data',
    proto: 'Research prototype — not for clinical use. Works offline: nothing from the card is sent to any server.',
    netOn: 'Network: on', netOff: 'Network: off — reading locally',
    scanTitle: "Scan the patient's card", scanIntro: "Point the camera at the QR on the patient's Passport or printed card. It is read and opened on this device only.",
    camera: 'Open the camera', image: 'Choose a QR image', demoOk: 'Demo card (demo-001)', demoBad: 'Tampered card (one byte)',
    mBytes: 'Measured QR size', mVersion: 'QR version', mDecoder: 'Decoded by', bytes: (n) => `${n} bytes`,
    holder: 'Meyar Medication Passport (envelope v1). Ask the holder for the PIN.', emergency: "Patient's chosen emergency line",
    pinLabel: "Holder's PIN (6 digits)", open: 'Open the card',
    pinHonest: 'The PIN stops casual scanning only: a copied QR can be brute-forced offline.',
    resultTitle: 'Result', resultEmpty: 'Nothing yet. Scan a card, then enter the PIN.',
    rejectTitle: 'Card rejected — nothing from it is shown',
    rejectGcm: 'Integrity check failed (AES-GCM): the QR was changed after it was issued, or the PIN is wrong.',
    rejectShape: (m) => `QR structure is invalid: ${m}`, rejectNotMeyar: 'This QR is not a Meyar Medication Passport.',
    rejectPin: 'Enter 6 digits.', noQr: 'No QR code found in that image.', camErr: 'Could not open the camera on this device. Choose a QR image instead.',
    origin: 'Sample origin', genetic: 'Genetic result', acting: 'Acting like', because: (d) => `because of ${d}`,
    notAssessed: 'copy number not assessed by this test — no result reported',
    stop: 'Do not prescribe without review', ask: 'Check the guideline before prescribing', better: (a) => `Better matched for these genes (CPIC): ${a}`,
    coverage: (a, t, u) => `Assay covered ${a} of ${t} defining positions${u ? `; did not test ${u}` : ''}`,
    meds: 'Current medicines (from the card)', footer: 'Meyar · research prototype, not for clinical use · demo data only · CPIC lookup only, no model-generated dosing · Runs on synthetic and GeT-RM reference data; no patient data was used.',
  },
};

const params = new URLSearchParams(location.search);
let lang = params.get('lang') === 'en' ? 'en' : 'ar';
const t = (k) => T[lang][k];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-GB').format(n);
const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const $ = (id) => document.getElementById(id);

let scanned = null; // { text, version, bytes }
let opened = null;  // decoded payload
let rejection = null;

function applyStatic() {
  setLang(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  renderNet(); renderScan(); renderResult();
}

function renderNet() {
  $('net').innerHTML = navigator.onLine
    ? `<span class="m-status m-status--info">${icon('i-info')}${esc(t('netOn'))}</span>`
    : `<span class="m-status m-status--none">${icon('i-none')}${esc(t('netOff'))}</span>`;
}

function renderScan() {
  $('measure').hidden = !scanned;
  $('pin-form').hidden = !scanned;
  if (!scanned) { $('holder').innerHTML = ''; return; }
  $('m-bytes').textContent = t('bytes')(scanned.bytes);
  $('m-version').textContent = scanned.version ? String(scanned.version) : '—';
  let hv = null;
  try { hv = holderView(scanned.text); } catch { /* shown as a rejection on open */ }
  $('holder').innerHTML = hv
    ? `<span class="m-status m-status--info">${icon('i-lock')}${esc(t('holder'))}</span>${hv.emergency ? `<p><b>${esc(t('emergency'))}:</b> ${esc(hv.emergency)}</p>` : ''}`
    : '';
}

function geneHTML(g) {
  const gene = { gene: g.gene, phenotype: g.phen, effectivePhenotype: g.eff ?? g.phen, callability: { method: g.call?.m } };
  const head = `<div class="rd-gene__head"><h3 class="m-data">${esc(g.gene)}</h3>${g.dip ? `<span class="m-data">${esc(g.dip)}</span>` : ''}<span class="rd-note m-data">${esc(g.gv)}</span></div>`;
  if (g.call?.m === 'not-assessed' || !g.phen) {
    return `<article class="rd-gene">${head}<span class="m-status m-status--none">${icon('i-none')}${esc(t('notAssessed'))}</span>${scaleHTML(gene, 'clinician')}</article>`;
  }
  const ph = `<p class="rd-gene__ph">${esc(t('genetic'))}: <b>${esc(g.phen)}</b>${g.eff ? ` · ${esc(t('acting'))}: <b>${esc(g.eff)}</b>${g.pc?.cause?.length ? ` ${esc(t('because')(g.pc.cause.join(', ')))}` : ''}` : ''}</p>`;
  const recs = (g.rec || []).map((r) => `<li><b>${esc(r.d)}</b><span class="m-status m-status--${r.s === 'stop' ? 'stop' : 'ask'}">${icon(r.s === 'stop' ? 'i-stop' : 'i-ask')}${esc(t(r.s === 'stop' ? 'stop' : 'ask'))}</span>${r.alts?.length ? `<span class="m-status m-status--better">${icon('i-better')}${esc(t('better')(r.alts.join(', ')))}</span>` : ''}</li>`).join('');
  const cov = g.cov?.t ? `<p class="rd-note">${esc(t('coverage')(num(g.cov.a), num(g.cov.t), (g.cov.u || []).join(', ')))}</p>` : '';
  return `<article class="rd-gene">${head}${ph}${scaleHTML(gene, 'clinician')}${recs ? `<ul class="rd-recs">${recs}</ul>` : ''}${cov}</article>`;
}

function renderResult() {
  const box = $('result');
  const title = `<h2 id="res-h">${esc(t('resultTitle'))}</h2>`;
  if (rejection) {
    box.innerHTML = `${title}<div class="rd-reject" role="alert"><span class="m-status m-status--stop">${icon('i-stop')}${esc(t('rejectTitle'))}</span><p>${esc(rejection)}</p></div>`;
    return;
  }
  if (!opened) { box.innerHTML = `${title}<p class="rd-note">${esc(t('resultEmpty'))}</p>`; return; }
  const meds = opened.meds?.length ? `<p class="rd-note"><b>${esc(t('meds'))}:</b> ${opened.meds.map((m) => esc(m.n)).join(', ')}</p>` : '';
  box.innerHTML = `${title}<p class="rd-note">${esc(t('origin'))}: <span class="m-data">${esc(opened.o)}</span> · <span class="m-mock">${esc(t('mock'))}</span></p>${opened.g.map(geneHTML).join('')}${meds}`;
}

function accept(text, version) {
  scanned = { text, version, bytes: new TextEncoder().encode(text).length };
  opened = null; rejection = null;
  try { const env = JSON.parse(text); if (env?.v !== 1) throw new Error(); } catch { rejection = t('rejectNotMeyar'); }
  renderScan(); renderResult();
  if (!rejection) $('pin').focus();
}

function decodeCanvas(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  return window.jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
}

async function decodeImageURL(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const scale = Math.max(1, Math.ceil(800 / Math.max(img.naturalWidth, 1)));
  const w = img.naturalWidth * scale; const h = img.naturalHeight * scale;
  const c = $('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const r = decodeCanvas(ctx, w, h);
  if (!r) { rejection = t('noQr'); scanned = null; renderScan(); renderResult(); return; }
  accept(r.data, r.version);
}

let stream = null;
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch { rejection = t('camErr'); renderResult(); return; }
  const v = $('video'); v.srcObject = stream; v.hidden = false; await v.play();
  const c = $('canvas'); const ctx = c.getContext('2d', { willReadFrequently: true });
  const tick = () => {
    if (!stream) return;
    if (v.videoWidth) {
      c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v, 0, 0);
      const r = decodeCanvas(ctx, c.width, c.height);
      if (r) { stopCamera(); accept(r.data, r.version); return; }
    }
    requestAnimationFrame(tick);
  };
  tick();
}
function stopCamera() { stream?.getTracks().forEach((tr) => tr.stop()); stream = null; $('video').hidden = true; }

$('camera').addEventListener('click', startCamera);
$('file').addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) decodeImageURL(URL.createObjectURL(f)); });
$('demo-ok').addEventListener('click', () => decodeImageURL('../demo-out/demo-001.qr.svg'));
$('demo-bad').addEventListener('click', () => decodeImageURL('../demo-out/demo-001-tampered.qr.svg'));
$('pin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = normalizeDigits($('pin').value.trim());
  if (!isValidPin(pin)) { rejection = t('rejectPin'); opened = null; renderResult(); return; }
  try {
    opened = await decodeQrEnvelope(scanned.text, { pin });
    rejection = null;
  } catch (err) {
    opened = null;
    rejection = /Invalid encrypted QR envelope: (.*)/.test(err.message) ? t('rejectShape')(RegExp.$1)
      : err.name === 'OperationError' ? t('rejectGcm') : `${t('rejectGcm')} (${err.message})`;
  }
  renderResult();
});
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; applyStatic(); }));
addEventListener('online', renderNet); addEventListener('offline', renderNet);

if ('serviceWorker' in navigator && isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});
initMotion();
applyStatic();
