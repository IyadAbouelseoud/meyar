// F6 printed fallback, linked from the tracker. Interim print view of the C8 QR on the design
// system's ID-1 face (.m-id1) until C7 ships passport's own printable card. No name, ID or result on the face.
import { setLang } from '/design/meyar.js';
import { esc, langFromURL, applyLang } from '/web/common.js';

const KIT = new URLSearchParams(location.search).get('kit') || 'MYR-DEMO-0001';
let lang = langFromURL();
const T = {
  ar: { eyebrow: 'للمريض', title: 'بطاقتك المطبوعة', mock: 'بيانات تجريبية', proto: 'نموذج بحثي أولي — ليس للاستخدام السريري.',
    cardTitle: 'بطاقة بحجم البطاقة البنكية', print: 'اطبع البطاقة', notReleased: 'لا توجد بطاقة بعد: تصل النتيجة إلى جوازك بعد مراجعة الصيدلي.',
    interim: 'عرض طباعة مؤقت لمهمة F6. البطاقة المطبوعة الكاملة هي مهمة C7 في جواز الدواء.', footer: 'مِعيار · نموذج بحثي أولي، ليس للاستخدام السريري · بيانات تجريبية فقط' },
  en: { eyebrow: 'For the patient', title: 'Your printed card', mock: 'Demo data', proto: 'Research prototype — not for clinical use.',
    cardTitle: 'Bank-card size card', print: 'Print the card', notReleased: 'No card yet: the result reaches your Passport after a pharmacist reviews it.',
    interim: 'Interim print view for F6. The full printable card is task C7 in the Passport.', footer: 'Meyar · research prototype, not for clinical use · demo data only' },
};

async function render() {
  setLang(lang); applyLang(lang, T);
  const kit = await (await fetch(`/api/kits/${encodeURIComponent(KIT)}`)).json();
  const box = document.getElementById('card');
  document.getElementById('print').disabled = !kit.passportReleased;
  if (!kit.passportReleased) { box.innerHTML = `<p>${esc(T[lang].notReleased)}</p>`; return; }
  const issued = (kit.gates.release.time || '').slice(0, 10).replace(/-/g, '');
  box.innerHTML = `<div class="f6-cardwrap"><div class="m-id1" dir="rtl" lang="ar">
    <div class="m-id1__left">
      <span class="m-id1__brand">مِعيار</span>
      <span class="f6-id1-sub">جواز الدواء</span>
      <span class="m-id1__pin">اطلب الرمز من صاحب البطاقة<br><span class="f6-id1-en" dir="ltr">Ask the holder for the PIN</span></span>
      <span class="m-id1__proto">نموذج بحثي — ليس للاستخدام السريري · بيانات تجريبية<br><span dir="ltr">Research prototype — not for clinical use · Demo data</span></span>
    </div>
    <div class="m-id1__qr"><img src="/demo-out/demo-001.qr.svg" alt="Meyar Passport QR, C8 encrypted envelope (demo data)"></div>
    <div class="m-id1__mrz">MEYAR&lt;&lt;PGX&lt;ENV&lt;V1&lt;&lt;ISSUED&lt;${esc(issued)}&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
    <div class="m-qatt" aria-hidden="true"></div>
  </div></div>`;
}
document.getElementById('print').addEventListener('click', () => window.print());
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; render(); }));
await render();
