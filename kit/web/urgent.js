// F6 urgent branch (T3, roadmap). Shows that a T3 result would use the same order-sign path.
// No device is simulated: the phenotype is the demo-001 result already in the store.
import { initMotion, setLang } from '/design/meyar.js';
import { esc, icon, langFromURL, applyLang, mdToHTML } from '/web/common.js';

let lang = langFromURL();
let result = null;
const T = {
  ar: {
    eyebrow: 'شاشة الطبيب · المسار العاجل', title: 'نتيجة عاجلة قبل القسطرة', mock: 'بيانات تجريبية',
    proto: 'نموذج بحثي أولي — ليس للاستخدام السريري.', chip: 'خارطة طريق — تصوّر مُجسَّم، غير مصنوع',
    t3Title: 'المستوى T3: وحدة جين واحد (CYP2C19) في غرفة القسطرة',
    renderCap: 'تصوّر مُجسَّم (F1) — ليس جهازاً. لا يوجد جهاز T3 في هذا المشروع.',
    t3Body: 'لو أرسل جهاز معتمد لجين واحد نتيجة CYP2C19، فستدخل المسار نفسه الذي تستخدمه العُدّة والمختبر. تُظهر هذه الشاشة ذلك المسار بنتيجة demo-001 الموجودة مسبقاً في المخزن؛ لا تُحاكى أي نتيجة جهاز.',
    path: ['مصدر النمط الجيني (T3 — خارطة طريق)', 'بوابة السلالة الجرثومية فقط (A6)', 'مخزن FHIR المحلي', 'بطاقة order-sign غير مقاطِعة (B2/B3)'],
    t3Honest: 'الجدوى: Genomadix Cube (FDA 510(k) K220026) وتجربة RAPID GENE (Roberts وآخرون، Lancet 2012). تجربة TAILOR-PCI (JAMA 2020) لم تُظهر نتيجة ذات دلالة إحصائية في نقطتها الأولية؛ لا ندّعي فائدة على النتائج. التفاصيل: docs/roadmap-cathlab.md',
    orderTitle: 'طلب دواء', drug: 'كلوبيدوقريل ٧٥ ملغ', indication: 'متلازمة شريانية حادة، قسطرة', sign: 'وقّع الطلب (order-sign)',
    signNote: 'يُرسل الطلب نفسه الذي يرسله run_e2e.sh إلى خدمة CDS على المنفذ 3000.',
    cdsErr: 'خدمة CDS غير متاحة', footer: 'مِعيار · نموذج بحثي أولي، ليس للاستخدام السريري · بيانات تجريبية فقط · T3 وT4 غير مصنوعين',
    advises: 'تنصح ولا تصف', src: 'المصدر',
  },
  en: {
    eyebrow: 'Prescriber screen · urgent path', title: 'Urgent result before PCI', mock: 'Demo data',
    proto: 'Research prototype — not for clinical use.', chip: 'Roadmap — concept render, not built',
    t3Title: 'Tier T3: single-gene (CYP2C19) unit in the cath lab',
    renderCap: 'Concept render (F1) — not a device. No T3 hardware exists in this project.',
    t3Body: 'If a cleared single-gene device sent a CYP2C19 call, it would enter the same path the kit and the lab use. This screen shows that path with the demo-001 result already in the store; no device result is simulated.',
    path: ['Genotype source (T3 — roadmap)', 'Germline-only gate (A6)', 'Local FHIR store', 'Non-interruptive order-sign card (B2/B3)'],
    t3Honest: 'Feasibility: Genomadix Cube (FDA 510(k) K220026) and RAPID GENE (Roberts et al., Lancet 2012). TAILOR-PCI (JAMA 2020) did not show a statistically significant primary-endpoint result; we claim no outcome benefit. Details: docs/roadmap-cathlab.md',
    orderTitle: 'Medication order', drug: 'Clopidogrel 75 mg', indication: 'Acute coronary syndrome, PCI', sign: 'Sign the order (order-sign)',
    signNote: 'Sends the same request run_e2e.sh sends to the CDS service on port 3000.',
    cdsErr: 'CDS service not reachable', footer: 'Meyar · research prototype, not for clinical use · demo data only · T3 and T4 are not built',
    advises: 'Advises, does not prescribe', src: 'Source',
  },
};

function cardHTML(c) {
  const ind = c.indicator === 'warning' ? 'warning' : 'info';
  return `<article class="m-cds" lang="en" dir="ltr">
    <div class="m-cds__bar"><span class="m-cds__indicator m-cds__indicator--${ind}">${icon(ind === 'warning' ? 'i-ask' : 'i-info')}${esc(c.indicator)}</span><span class="m-mock">Demo data</span></div>
    <div class="m-cds__body">
      <p class="m-cds__summary">${esc(c.summary)}</p>
      <div class="f6-detail">${mdToHTML(c.detail)}</div>
      ${(c.suggestions || []).length ? `<div class="f6-actions">${c.suggestions.map((s) => `<button class="m-btn m-btn--secondary" type="button">${esc(s.label)}</button>`).join('')}</div>` : ''}
      <p class="f6-note">${(c.links || []).map((l) => `<a href="${esc(l.url)}" rel="noopener" target="_blank">${esc(l.label)}</a>`).join(' · ')}</p>
    </div></article>`;
}

function render() {
  setLang(lang); applyLang(lang, T);
  const L = T[lang];
  document.getElementById('render').alt = L.renderCap;
  document.getElementById('path').innerHTML = L.path.map((p, i) => `<li class="${i === 0 ? 'is-roadmap' : ''}"><span class="m-data">${i + 1}</span> ${esc(p)}</li>`).join('');
  const box = document.getElementById('cards');
  if (!result) { box.innerHTML = ''; return; }
  box.innerHTML = result.ok
    ? result.cards.map(cardHTML).join('')
    : `<span class="m-status m-status--stop">${icon('i-stop')}${esc(L.cdsErr)}: ${esc(result.error)}</span>`;
}

document.getElementById('sign').addEventListener('click', async () => {
  result = await (await fetch('/api/urgent/card', { method: 'POST' })).json();
  render();
});
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; render(); }));
initMotion();
render();
if (new URLSearchParams(location.search).get('sign') === '1') document.getElementById('sign').click();
