// F6 patient tracker: where my kit is. Patient voice, Arabic first. Never a result, never "safe".
import { initMotion, setLang } from '/design/meyar.js';
import { esc, icon, langFromURL, applyLang, fmtNum } from '/web/common.js';

const params = new URLSearchParams(location.search);
const KIT = params.get('kit') || 'MYR-DEMO-0001';
const PASSPORT_URL = params.get('passport') || 'http://localhost:5173/';
let lang = langFromURL();

const T = {
  ar: {
    eyebrow: 'للمريض', title: 'أين وصلت عيّنتك', mock: 'بيانات تجريبية',
    proto: 'نموذج بحثي أولي — ليس للاستخدام السريري. هذه الصفحة تُظهر مكان العيّنة فقط، لا نتيجتك.',
    kitLabel: 'رقم العُدّة',
    steps: { registered: 'سُجّلت العُدّة', received: 'وصلت العيّنة إلى المختبر', processing: 'قيد الفحص', reviewed: 'راجعها الصيدلي', passport: 'النتيجة في جوازك' },
    state: { done: 'تمّ', current: 'الآن', todo: 'لاحقاً', stopped: 'توقّف' },
    now: {
      registered: 'عُدّتك مسجّلة باسم مستعار. ضع اللعاب في الأنبوبة كما في الورقة، ثم أرسلها.',
      received: 'وصلت عيّنتك. المختبر يتأكد أنها صالحة للفحص.',
      processing: 'المختبر يفحص عيّنتك الآن.',
      reviewed: 'صيدلي يراجع النتيجة قبل أن تصل إليك.',
      passport: 'نتيجتك في جواز الدواء. اعرضها على طبيبك أو الصيدلي قبل أي دواء جديد.',
    },
    lead: (n) => `الخطوة ${fmtNum(n, 'ar')} من ${fmtNum(5, 'ar')}`, leadDone: 'اكتملت الخطوات الخمس', leadStop: 'نحتاج عيّنة جديدة',
    recollect: 'لم تكن هذه العيّنة صالحة للفحص، ولن تصدر منها أي نتيجة. سيتواصل معك الفريق لعُدّة جديدة.',
    reason: { 'insufficient-dna': 'السبب: كمية اللعاب لم تكن كافية.', 'label-mismatch': 'السبب: الملصق لا يطابق السجل.', 'tube-leaked': 'السبب: الأنبوبة لم تكن مغلقة جيداً.' },
    broken: 'نراجع سجل العيّنة. ستعود النتيجة إلى جوازك بعد المراجعة.',
    nextTitle: 'ماذا يمكنك أن تفعل', openPassport: 'افتح جواز الدواء', printCard: 'اطبع بطاقتي', notYet: 'ستظهر هنا بعد أن يراجع الصيدلي نتيجتك.',
    newKit: 'افتح العُدّة الجديدة', printNote: 'لا تملك هاتفاً ذكياً؟ اطبع البطاقة واحملها معك؛ عليها رمز QR يقرؤه الصيدلي بعد أن تعطيه رقمك السري.',
    footer: 'مِعيار · نموذج بحثي أولي، ليس للاستخدام السريري · بيانات تجريبية فقط',
  },
  en: {
    eyebrow: 'For the patient', title: 'Where your sample is', mock: 'Demo data',
    proto: 'Research prototype — not for clinical use. This page shows where your sample is, never your result.',
    kitLabel: 'Kit',
    steps: { registered: 'Kit registered', received: 'Sample received', processing: 'Processing', reviewed: 'Reviewed', passport: 'Result in your Passport' },
    state: { done: 'Done', current: 'Now', todo: 'Later', stopped: 'Stopped' },
    now: {
      registered: 'Your kit is registered under a pseudonym. Put saliva in the tube as the leaflet shows, then send it.',
      received: 'Your sample arrived. The lab is checking that it can be tested.',
      processing: 'The lab is testing your sample now.',
      reviewed: 'A pharmacist checks the result before it reaches you.',
      passport: 'Your result is in your Medication Passport. Show it to your doctor or pharmacist before any new medicine.',
    },
    lead: (n) => `Step ${n} of 5`, leadDone: 'All five steps done', leadStop: 'We need a new sample',
    recollect: 'This sample could not be tested, and no result will ever come from it. The team will contact you about a new kit.',
    reason: { 'insufficient-dna': 'Reason: there was not enough saliva.', 'label-mismatch': 'Reason: the label did not match the record.', 'tube-leaked': 'Reason: the tube was not closed well.' },
    broken: 'We are checking the sample record. The result returns to your Passport after the check.',
    nextTitle: 'What you can do', openPassport: 'Open my Medication Passport', printCard: 'Print my card', notYet: 'These appear once a pharmacist has reviewed your result.',
    newKit: 'Open the new kit', printNote: 'No smartphone? Print the card and carry it. Its QR is read by the pharmacist after you give them your PIN.',
    footer: 'Meyar · research prototype, not for clinical use · demo data only',
  },
};

let status = null; let kit = null;

function render() {
  setLang(lang); applyLang(lang, T);
  const L = T[lang];
  document.getElementById('kit').textContent = KIT;
  const steps = status.steps;
  const doneCount = steps.filter((s) => s.state === 'done').length;
  const cur = steps.find((s) => s.state === 'current' || s.state === 'stopped');
  const lead = document.getElementById('strip-h');
  lead.textContent = status.recollect ? L.leadStop : cur ? L.lead(doneCount + 1) : L.leadDone;
  document.getElementById('strip').innerHTML = steps.map((s, i) => `
    <li class="f6-step is-${s.state}" ${s.state === 'current' || s.state === 'stopped' ? 'aria-current="step"' : ''}>
      <span class="f6-step__node" aria-hidden="true">${s.state === 'stopped' ? icon('i-stop') : fmtNum(i + 1, lang)}</span>
      <span class="f6-step__label">${esc(L.steps[s.key])}</span>
      <span class="f6-step__state">${esc(L.state[s.state])}</span>
    </li>`).join('');
  const now = document.getElementById('now');
  if (status.recollect) {
    now.innerHTML = `<div class="m-answer m-answer--stop f6-answer">${icon('i-stop')}<div><b>${esc(L.leadStop)}</b><p>${esc(L.recollect)}</p><p>${esc(L.reason[kit.gates?.qc?.reason] || '')}</p></div></div>`;
  } else if (!status.chainOk) {
    now.innerHTML = `<div class="m-answer m-answer--ask f6-answer">${icon('i-ask')}<div><p>${esc(L.broken)}</p></div></div>`;
  } else {
    const key = cur?.key ?? 'passport';
    now.innerHTML = `<p class="f6-now">${esc(L.now[key])}</p>`;
  }
  const released = kit.passportReleased;
  const q = new URLSearchParams({ kit: KIT, lang });
  document.getElementById('actions').innerHTML = status.recollect
    ? `<a class="m-btn" href="/tracker?${new URLSearchParams({ kit: 'MYR-DEMO-0001', lang })}">${esc(L.newKit)}</a>`
    : released
      ? `<a class="m-btn" href="${esc(PASSPORT_URL)}?lang=${lang}">${esc(L.openPassport)}</a><a class="m-btn m-btn--secondary" href="/card?${q}">${esc(L.printCard)}</a>`
      : `<p class="f6-note">${esc(L.notYet)}</p>`;
}

async function load() {
  const [s, k] = await Promise.all([fetch(`/api/kits/${encodeURIComponent(KIT)}/status`), fetch(`/api/kits/${encodeURIComponent(KIT)}`)]);
  status = await s.json(); kit = await k.json();
  render();
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; render(); }));
initMotion();
await load();
setInterval(load, 4000); // the tracker follows the lab live during the demo
