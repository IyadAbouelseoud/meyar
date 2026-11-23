// Kit timeline screen (F3). Arabic first, English toggle. Verify runs here, in the browser,
// with the same chain module the server uses (/lib/chain.js).
import { initMotion, setLang } from '/design/meyar.js';
import { verifyChain } from '/lib/chain.js';
import { EVENT_TYPES, EVENT_LABELS } from '/lib/events.js';
import { DEMO_KIT_ID } from '/lib/demo.js';
import { code128SVG } from '/web/barcode128.js';
import { qrSVG } from '/web/qr.js';

const params = new URLSearchParams(location.search);
const KIT = params.get('kit') || DEMO_KIT_ID;

const T = {
  ar: {
    eyebrow: 'شاشة الموظفين · عُدّة اللعاب', title: 'سلسلة حفظ العيّنة', mock: 'بيانات تجريبية',
    proto: 'نموذج بحثي أولي — ليس للاستخدام السريري. لا نذكر أي حدود لثبات العيّنة أو مدة النقل.',
    kitLabel: 'رقم العُدّة', patientLabel: 'المريض (اسم مستعار)', specimenLabel: 'في FHIR',
    verify: 'تحقّق من السلسلة', srcFhir: 'من FHIR', srcLedger: 'من السجل المحلي', ledgerShort: 'السجل المحلي', srcAria: 'مصدر السلسلة',
    honest: 'كل حدث مربوط بالذي قبله ببصمة SHA-256. السلسلة تكشف التعديل ولا تمنعه: من يستطيع إعادة كتابة كل السجلات يستطيع إعادة بنائها. التوقيع وتثبيت البصمة الأخيرة خارج الخادم خطوة نشر مستقبلية.',
    scanTitle: 'مسح العُدّة', scanLabel: 'الرمز الممسوح', scanHint: 'قارئ الباركود يكتب الرمز ثم Enter. يُقبل ملصق الأنبوبة أو رمز QR على الظرف.',
    placeLabel: 'المكان', actorLabel: 'القائم بالمسح', record: (e) => `سجّل: ${e}`, nextIs: (e) => `الحدث التالي: <b>${e}</b>`,
    complete: 'سُجّلت الأحداث الستة.', labelsTitle: 'الملصقات', tubeLabel: 'ملصق الأنبوبة · Code 128', mailerLabel: 'ظرف الإرسال · QR',
    labelsNote: 'تُرسم في المتصفح. لا يحمل أيٌّ منهما اسماً أو نتيجة، فقط رقم العُدّة.',
    handoffTitle: 'التسليم إلى المحرّك', handoffNone: 'يُكتب عند حدث «اكتمل التنميط الجيني»، وفقط إذا كانت السلسلة سليمة.',
    hOrigin: 'ملف المنشأ', hVcf: 'مسار VCF', hHead: 'البصمة الأخيرة للسلسلة', hVcfMissing: '(الملف غير موجود بعد — شغّل engine/gen_vcf.py)',
    demoTitle: 'أدوات العرض التجريبي', tamper: 'عدّل الحدث ٤ بلا إعادة ختم', restore: 'استرجع الأصل', reset: 'ابدأ العُدّة من جديد',
    progress: (n) => `${fmtNum(n)} من ${fmtNum(6)} أحداث مسجّلة`,
    intact: (n, src) => `السلسلة سليمة: تحقّقنا من ${fmtNum(n)} روابط (${src})`,
    broken: (i, src) => `السلسلة مكسورة عند الحدث ${fmtNum(i)} (${src})`, brokenHere: 'السلسلة مكسورة هنا',
    empty: 'لا أحداث بعد. امسح العُدّة لتسجيل «صُرفت العُدّة».', pending: 'لم يُسجَّل بعد',
    hash: 'البصمة', prev: 'السابقة', at: 'في', by: 'بواسطة', fhirOff: 'خادم FHIR المحلي غير متاح؛ السجل المحلي فقط.',
    reasons: { 'content-changed': 'تغيّر المحتوى بعد الختم', 'prev-hash-mismatch': 'لا يطابق بصمة الحدث السابق', 'sequence-gap': 'خلل في الترتيب', 'out-of-order': 'حدث خارج ترتيبه', 'different-kit': 'عُدّة مختلفة' },
    footer: 'مِعيار · نموذج بحثي أولي، ليس للاستخدام السريري · بيانات تجريبية فقط · الأحداث محفوظة كـ FHIR Provenance على Specimen في خادم HAPI المحلي',
    chainAria: 'الجدول الزمني لسلسلة حفظ العيّنة',
    gQc: 'ضبط الجودة في المختبر', gQcPass: 'اجتازت العيّنة ضبط الجودة', gQcFail: 'رُفضت العيّنة في ضبط الجودة',
    gRecollect: 'أعد جمع عيّنة جديدة — لن تصدر أي نتيجة لهذه الأنبوبة',
    gReview: 'مراجعة الصيدلي', gReviewDone: 'راجع الصيدلي النتيجة', gRelease: 'إرسال النتيجة إلى الجواز', gReleaseDone: 'النتيجة في جواز الدواء',
    gGateNote: 'بوابة: لا تصل النتيجة إلى الجواز قبل مراجعة الصيدلي.', gWaiting: 'بانتظار', gBound: 'مرتبطة بالبصمة',
    gateTitle: 'بوابات المختبر والصيدلي', qcPass: 'ضبط الجودة: ناجح', qcFail: 'ضبط الجودة: رفض (حمض نووي غير كافٍ)',
    doReview: 'الصيدلي: علّم النتيجة كمراجَعة', doRelease: 'أرسل النتيجة إلى الجواز',
    navTitle: 'شاشات العرض', navTracker: 'متابعة المريض', navUrgent: 'المسار العاجل (T3، خارطة طريق)', navReader: 'قارئ الجهاز الثاني (دون اتصال)',
    navOther: (k) => `افتح العُدّة ${k}`, kitFirst: 'الأنبوبة الأولى (رُفضت في ضبط الجودة)', kitSecond: 'الأنبوبة المعادة',
  },
  en: {
    eyebrow: 'Staff screen · saliva kit', title: 'Specimen chain of custody', mock: 'Demo data',
    proto: 'Research prototype — not for clinical use. No specimen stability or transit limits are claimed.',
    kitLabel: 'Kit ID', patientLabel: 'Patient (pseudonym)', specimenLabel: 'FHIR',
    verify: 'Verify the chain', srcFhir: 'From FHIR', srcLedger: 'From local ledger', ledgerShort: 'local ledger', srcAria: 'Chain source',
    honest: 'Each event is linked to the one before by a SHA-256 hash. The chain makes an edit visible; it does not stop one: whoever can rewrite every record can rebuild the chain. Signing events and anchoring the head hash outside the server is a future deployment step.',
    scanTitle: 'Scan the kit', scanLabel: 'Scanned code', scanHint: 'A barcode scanner types the code and Enter. The tube label or the mailer QR are both accepted.',
    placeLabel: 'Place', actorLabel: 'Scanned by', record: (e) => `Record: ${e}`, nextIs: (e) => `Next event: <b>${e}</b>`,
    complete: 'All six events are recorded.', labelsTitle: 'Labels', tubeLabel: 'Tube label · Code 128', mailerLabel: 'Mailer · QR',
    labelsNote: 'Drawn in the browser. Neither carries a name or a result, only the kit ID.',
    handoffTitle: 'Hand-off to the engine', handoffNone: 'Written on the "Genotyped" event, and only if the chain verifies.',
    hOrigin: 'Origin file', hVcf: 'VCF path', hHead: 'Chain head hash', hVcfMissing: '(file not present yet — run engine/gen_vcf.py)',
    demoTitle: 'Demo controls', tamper: 'Edit event 4 without re-sealing', restore: 'Restore the original', reset: 'Start the kit again',
    progress: (n) => `${n} of 6 events recorded`,
    intact: (n, src) => `Chain intact: ${n} links verified (${src})`,
    broken: (i, src) => `Chain broken at event ${i} (${src})`, brokenHere: 'Chain broken here',
    empty: 'No events yet. Scan the kit to record "Kit issued".', pending: 'Not recorded yet',
    hash: 'hash', prev: 'prev', at: 'at', by: 'by', fhirOff: 'Local FHIR server not reachable; local ledger only.',
    reasons: { 'content-changed': 'content changed after sealing', 'prev-hash-mismatch': 'does not match the previous hash', 'sequence-gap': 'sequence gap', 'out-of-order': 'event out of order', 'different-kit': 'different kit' },
    footer: 'Meyar · research prototype, not for clinical use · demo data only · events stored as FHIR Provenance on a Specimen in the local HAPI server',
    chainAria: 'Specimen chain-of-custody timeline',
    gQc: 'Lab quality check', gQcPass: 'Sample passed lab QC', gQcFail: 'Sample rejected at lab QC',
    gRecollect: 'Recollect a new sample — no result will ever be issued for this tube',
    gReview: 'Pharmacist review', gReviewDone: 'Pharmacist reviewed the result', gRelease: 'Release to the Passport', gReleaseDone: 'Result in the Medication Passport',
    gGateNote: 'Gate: the result cannot reach the Passport before a pharmacist reviews it.', gWaiting: 'Waiting', gBound: 'bound to chain head',
    gateTitle: 'Lab and pharmacist gates', qcPass: 'Lab QC: pass', qcFail: 'Lab QC: reject (not enough DNA)',
    doReview: 'Pharmacist: mark reviewed', doRelease: 'Release to the Passport',
    navTitle: 'Demo screens', navTracker: 'Patient tracker', navUrgent: 'Urgent path (T3, roadmap)', navReader: 'Second-device reader (offline)',
    navOther: (k) => `Open kit ${k}`, kitFirst: 'First tube (rejected at QC)', kitSecond: 'Recollected tube',
  },
};

let lang = params.get('lang') === 'en' ? 'en' : 'ar';
let source = params.get('source') || null;
let state = null;
let lastVerify = null;

function fmtNum(n) { return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-GB').format(n); }
const t = (k) => T[lang][k];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fmtTime(iso) {
  const d = new Date(iso);
  const tz = 'Asia/Riyadh';
  const greg = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const hijri = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-GB-u-ca-islamic-umalqura', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  return `<span class="m-data">${esc(greg)}</span> · <span>${esc(hijri)}</span>`;
}

async function api(method, path, body) {
  const res = await fetch(`/api/kits/${encodeURIComponent(KIT)}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json;
}

function applyStatic() {
  setLang(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.getElementById('source-seg').setAttribute('aria-label', t('srcAria'));
  document.getElementById('chain').setAttribute('aria-label', t('chainAria'));
  document.getElementById('code').placeholder = KIT;
}

function renderLabels() {
  document.getElementById('c128').innerHTML = code128SVG(KIT, { title: `${t('tubeLabel')}: ${KIT}` });
  document.getElementById('c128-text').textContent = KIT;
  const qrText = `MEYAR-KIT:${KIT}`;
  document.getElementById('qr').innerHTML = qrSVG(qrText, { title: `${t('mailerLabel')}: ${qrText}` });
  document.getElementById('qr-text').textContent = qrText;
}

function renderChain() {
  const events = lastVerify?.events ?? state.events;
  const v = lastVerify?.result;
  const rows = EVENT_TYPES.map((type, i) => {
    const ev = events[i];
    const label = EVENT_LABELS[type][lang];
    if (!ev) {
      return `<li class="is-pending" style="--i:${i}"><span class="m-chain__node" aria-hidden="true">${i + 1}</span><div class="kit-ev"><div class="kit-ev__top"><span class="kit-ev__title">${esc(label)}</span><span class="kit-ev__time">${esc(t('pending'))}</span></div></div></li>`;
    }
    const r = v?.results[i];
    const broken = r && !r.ok;
    const firstBreak = v && v.brokenAt === i;
    const reasons = firstBreak ? r.reasons.map((x) => t('reasons')[x] || x).join(' · ') : '';
    return `<li class="${broken ? 'is-broken' : ''}" style="--i:${i}">
      <span class="m-chain__node" aria-hidden="true">${broken ? '!' : i + 1}</span>
      <div class="kit-ev">
        <div class="kit-ev__top"><span class="kit-ev__title">${esc(label)}</span><span class="kit-ev__time">${fmtTime(ev.time)}</span></div>
        <p class="kit-ev__meta">${esc(t('at'))} ${esc(ev.place?.[lang])} · ${esc(t('by'))} ${esc(ev.actor?.[lang])}</p>
        ${firstBreak ? `<span class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg>${esc(t('brokenHere'))}${reasons ? ` — ${esc(reasons)}` : ''}</span>` : ''}
        <div class="kit-ev__links"><span class="m-chain__hash" title="${esc(ev.hash)}"><span class="kit-hashlabel">${esc(t('hash'))}</span> <span class="m-data">${esc(ev.hash?.slice(0, 16))}…</span> · <span class="kit-hashlabel">${esc(t('prev'))}</span> <span class="m-data">${esc(ev.prevHash?.slice(0, 16))}…</span></span></div>
      </div></li>`;
  });
  const g = state.gates || {};
  const at = (x) => `<p class="kit-ev__meta">${esc(t('at'))} ${esc(x.place?.[lang])} · ${esc(t('by'))} ${esc(x.actor?.[lang])} · <span class="kit-hashlabel">${esc(t('gBound'))}</span> <span class="m-data">${esc(x.chainHead?.slice(0, 12))}…</span></p>`;
  const gate = (cls, node, title, time, body) => `<li class="kit-gate ${cls}"><span class="m-chain__node" aria-hidden="true">${node}</span><div class="kit-ev"><div class="kit-ev__top"><span class="kit-ev__title">${esc(title)}</span><span class="kit-ev__time">${time}</span></div>${body}</div></li>`;
  const qcRow = g.qc
    ? (g.qc.result === 'pass'
      ? gate('', 'QC', t('gQcPass'), fmtTime(g.qc.time), at(g.qc))
      : gate('is-broken', '!', t('gQcFail'), fmtTime(g.qc.time), `${at(g.qc)}<span class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg>${esc(t('gRecollect'))}</span>`))
    : gate('is-pending', 'QC', t('gQc'), esc(t('pending')), '');
  const reviewRow = g.review
    ? gate('', 'Rx', t('gReviewDone'), fmtTime(g.review.time), at(g.review))
    : gate('is-pending', 'Rx', t('gReview'), esc(t('pending')), `<p class="kit-note">${esc(t('gGateNote'))}</p>`);
  const releaseRow = g.release
    ? gate(state.passportReleased ? '' : 'is-broken', state.passportReleased ? '→' : '!', t('gReleaseDone'), fmtTime(g.release.time), at(g.release))
    : gate('is-pending', '→', t('gRelease'), esc(t('pending')), '');
  rows.splice(5, 0, qcRow); // after "received"
  if (!(g.qc && g.qc.result === 'fail')) rows.push(reviewRow, releaseRow);
  else rows.splice(6); // failed tube: nothing after QC, no "genotyped", no result
  const chain = document.getElementById('chain');
  chain.innerHTML = rows.join('');
  document.getElementById('progress').textContent = t('progress')(state.events.length);
}

function renderGates() {
  const g = state.gates || {};
  const n = state.events.length;
  document.getElementById('qc-pass').disabled = !(n === 5 && !g.qc);
  document.getElementById('qc-fail').disabled = !(n === 5 && !g.qc);
  document.getElementById('do-review').disabled = !(n === 6 && g.qc?.result === 'pass' && !g.review);
  document.getElementById('do-release').disabled = !(g.review && !g.release);
  const other = KIT === 'MYR-DEMO-0002' ? 'MYR-DEMO-0001' : 'MYR-DEMO-0002';
  const q = (extra) => `?${new URLSearchParams({ kit: KIT, lang, ...extra })}`;
  document.getElementById('nav').innerHTML = `
    <a class="m-btn m-btn--secondary" href="/tracker${q({})}">${esc(t('navTracker'))}</a>
    <a class="m-btn m-btn--quiet" href="/urgent?lang=${lang}">${esc(t('navUrgent'))}</a>
    <a class="m-btn m-btn--quiet" href="/reader/?lang=${lang}">${esc(t('navReader'))}</a>
    <a class="m-btn m-btn--quiet" href="/${q({ kit: other })}">${esc(t('navOther')(other))}</a>`;
  document.getElementById('kit-role').textContent = KIT === 'MYR-DEMO-0002' ? t('kitFirst') : t('kitSecond');
}

function renderVerify() {
  const box = document.getElementById('verify-result');
  if (!lastVerify) { box.innerHTML = state.fhir.available ? '' : `<span class="m-status m-status--info"><svg aria-hidden="true"><use href="#i-info"/></svg>${esc(t('fhirOff'))}</span>`; return; }
  const { result, source: used } = lastVerify;
  const src = used === 'fhir' ? 'FHIR' : t('ledgerShort');
  if (!result.results.length) { box.innerHTML = `<span class="m-status m-status--none"><svg aria-hidden="true"><use href="#i-none"/></svg>${esc(t('empty'))}</span>`; return; }
  box.innerHTML = result.ok
    ? `<span class="m-status m-status--info"><svg aria-hidden="true"><use href="#i-lock"/></svg>${esc(t('intact')(result.results.length, src))}</span> <span class="m-chain__hash"><span class="kit-hashlabel">${esc(t('hHead'))}:</span> <span class="m-data">${esc(result.head.slice(0, 32))}…</span></span>`
    : `<span class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg>${esc(t('broken')(result.brokenAt + 1, src))}</span>`;
}

function renderScan() {
  const failed = state.gates?.qc?.result === 'fail'; // F6: a rejected tube takes no more scans
  const next = failed ? null : state.next;
  const nextLabel = next ? EVENT_LABELS[next][lang] : null;
  document.getElementById('next').innerHTML = failed ? esc(t('gRecollect')) : next ? t('nextIs')(esc(nextLabel)) : esc(t('complete'));
  document.getElementById('record-label').textContent = next ? t('record')(nextLabel) : (failed ? t('gRecollect') : t('complete'));
  document.getElementById('record').disabled = !next;
  document.getElementById('scan-form').hidden = !next;
  const d = state.nextDefaults;
  document.getElementById('place').value = d ? d.place[lang] : '';
  document.getElementById('actor').value = d ? d.actor[lang] : '';
  document.getElementById('specimen-ref').textContent = `Specimen/${KIT}`;
  document.getElementById('kit-id').textContent = KIT;
  document.getElementById('patient-id').textContent = state.kit.patientId;
}

function renderHandoff() {
  const h = state.handoff;
  const box = document.getElementById('handoff');
  if (!h) { box.innerHTML = `<p class="kit-note">${esc(t('handoffNone'))}</p>`; return; }
  box.innerHTML = `<dl class="kit-handoff">
    <div><dt>${esc(t('hOrigin'))}</dt><dd class="m-data">${esc(h.originFile)} · sampleOrigin: ${esc(h.sampleOrigin)}</dd></div>
    <div><dt>${esc(t('hVcf'))}</dt><dd class="m-data">${esc(h.vcfPath)}</dd>${h.vcfPresent ? '' : `<dd class="kit-note">${esc(t('hVcfMissing'))}</dd>`}</div>
    <div><dt>${esc(t('hHead'))}</dt><dd class="m-data">${esc(h.chainHead)}</dd></div></dl>`;
}

function render() {
  applyStatic();
  renderLabels();
  renderChain();
  renderVerify();
  renderScan();
  renderHandoff();
  renderGates();
  const src = source || (state.fhir.available ? 'fhir' : 'ledger');
  document.querySelectorAll('[data-source]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.source === src));
    b.disabled = b.dataset.source === 'fhir' && !state.fhir.available;
  });
}

async function refresh() { state = await api('GET', ''); render(); }

async function runVerify({ animate = true } = {}) {
  const { source: used, chain } = await api('GET', `/chain${source ? `?source=${source}` : ''}`);
  lastVerify = { source: used, events: chain, result: await verifyChain(chain) };
  render();
  if (animate) {
    const el = document.getElementById('chain');
    el.classList.remove('is-verifying'); void el.offsetWidth; el.classList.add('is-verifying');
  }
}

function showError(msg) {
  document.getElementById('scan-error').innerHTML = msg ? `<span class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg>${esc(msg)}</span>` : '';
}

document.getElementById('scan-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const code = document.getElementById('code').value || KIT;
  const place = document.getElementById('place').value;
  const actor = document.getElementById('actor').value;
  const d = state.nextDefaults;
  const body = { code, type: state.next };
  // Keep the bilingual demo labels when staff did not change them.
  if (d && place !== d.place[lang]) body.place = { [lang]: place, en: lang === 'en' ? place : place };
  if (d && actor !== d.actor[lang]) body.actor = { [lang]: actor, en: lang === 'en' ? actor : actor };
  try {
    await api('POST', '/scan', body);
    document.getElementById('code').value = '';
    lastVerify = null;
    await refresh();
    await runVerify({ animate: false });
  } catch (err) { showError(err.message); }
});

document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; render(); }));
document.querySelectorAll('[data-source]').forEach((b) => b.addEventListener('click', async () => { source = b.dataset.source; await runVerify(); }));
document.getElementById('verify').addEventListener('click', () => runVerify());
document.getElementById('tamper').addEventListener('click', async () => { await api('POST', '/tamper', { seq: 4 }).catch((e) => showError(e.message)); await refresh(); await runVerify(); });
document.getElementById('restore').addEventListener('click', async () => { await api('POST', '/restore'); await refresh(); await runVerify(); });
const gateAction = (id, path, body) => document.getElementById(id).addEventListener('click', async () => {
  showError('');
  try { await api('POST', path, body); } catch (e) { showError(e.message); }
  await refresh();
});
gateAction('qc-pass', '/qc', { result: 'pass' });
gateAction('qc-fail', '/qc', { result: 'fail', reason: 'insufficient-dna' });
gateAction('do-review', '/review');
gateAction('do-release', '/release');
document.getElementById('reset').addEventListener('click', async () => { await api('POST', '/reset'); lastVerify = null; await refresh(); });

initMotion();
await refresh();
if (state.events.length) await runVerify({ animate: params.get('animate') !== '0' });
document.getElementById('code').focus({ preventScroll: true });
