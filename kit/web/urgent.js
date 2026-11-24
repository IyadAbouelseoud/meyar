// F6 urgent branch (T3, roadmap). Shows that a T3 result would use the same order-sign path.
// No device is simulated: the phenotype is the demo-001 result already in the store.
import { initMotion, setLang, scaleHTML, scaleIndex, scaleKind, combHTML, calibrate } from '/design/meyar.js';
import { esc, icon, langFromURL, applyLang, mdToHTML } from '/web/common.js';

let lang = langFromURL();
let result = null;
// DEMO-FIX-1: Arabic card vocabulary, read-only from passport/src/i18n/ar.json (served at /passport-src/).
let AR = null;
const arReady = fetch('/passport-src/i18n/ar.json')
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => { if (j && j.scale && j.phenotypeShort && j.drugs) AR = j; })
  .catch(() => {});

// Styles for the Arabic card's CPIC quote block (design tokens only).
document.head.insertAdjacentHTML('beforeend', `<style>
  .mx-line { font-size: var(--m-size-sm); color: var(--m-text); }
  .mx-cpic { display: grid; gap: var(--m-space-1); }
  .mx-cpic__h { font-size: var(--m-size-xs); font-weight: 700; color: var(--m-text2); }
  .mx-cpic .m-cds__rec { text-align: left; }
  .mx-others { margin: 0; padding-inline-start: var(--m-space-4); font-size: var(--m-size-xs); color: var(--m-text2); }
  .m-cds .prv-mini { min-inline-size: 0; overflow-x: auto; }
  .m-cds .m-coverage { grid-template-columns: minmax(0, 1fr); }
  .m-cds .m-comb { max-inline-size: 100%; overflow: hidden; }
  .m-cds bdi { overflow-wrap: anywhere; }
</style>`);

// Same renderer as renderCardAr in cds/lib/preview.js (kept identical; the kit cannot import cds/).
function renderCardAr(card, ctx) {
  // Arabic CDS card from card.extension.meyar (DEMO-FIX-1). UI labels only: every CPIC
  // text is shown verbatim in English inside an LTR quote (AGENTS.md §7, lookup only).
  const { AR, esc, scaleHTML, scaleIndex, scaleKind, combHTML } = ctx;
  const idx = ctx.idx ?? 0;
  const m = (card && card.extension && card.extension.meyar) || {};
  const num = (n) => new Intl.NumberFormat('ar-SA').format(n);
  const ltr = (s) => `<bdi dir="ltr">${esc(s)}</bdi>`;
  const en = (s) => `<span dir="ltr" lang="en">${esc(s)}</span>`;
  const drugAr = (d) => {
    if (!d) return '';
    const k = String(d).trim().toLowerCase();
    return AR.drugs && AR.drugs[k] ? esc(AR.drugs[k]) : ltr(d);
  };
  const listAr = (arr) => (arr || []).map(drugAr).join('، ');
  const phenoAr = (p) => {
    if (!p) return 'لا توجد نتيجة';
    if (AR.phenotypeShort && AR.phenotypeShort[p]) return esc(AR.phenotypeShort[p]);
    const i = scaleIndex(p);
    const labels = AR.scale && AR.scale[scaleKind(p)];
    return i != null && labels && labels[i] && labels[i] !== '—' ? esc(labels[i]) : ltr(p);
  };
  const orderAr = (display) => {
    const s = String(display || '').trim();
    const mm = /^([A-Za-z][A-Za-z -]*?)\s+([\d.]+)\s*MG\s+Oral\s+Tablet$/i.exec(s);
    if (mm) return `${drugAr(mm[1])} ${num(Number(mm[2]))} ملغ أقراص`;
    if (AR.drugs && AR.drugs[s.toLowerCase()]) return drugAr(s);
    return ltr(s);
  };
  const classAr = (c) =>
    ({ strong: 'قوية', moderate: 'متوسطة', optional: 'اختيارية', 'no recommendation': 'لا توصية' })[
      String(c || '').trim().toLowerCase()
    ] || ltr(c || '');
  const strengthAr = (s) => ({ strong: 'قوي', moderate: 'متوسط' })[s] || ltr(s || '');
  const score = (n) => {
    const v = Number(n);
    return Number.isInteger(v) ? v.toFixed(1) : String(Math.round(v * 1e6) / 1e6);
  };
  const citeText = (c) => (c ? [c.pub, c.name ? `CPIC: ${c.name}` : null].filter(Boolean).join(' · ') : '');
  const cpicBlock = (quote, citation, heading = 'نص CPIC الحرفي') =>
    quote
      ? `<div class="mx-cpic"><p class="mx-cpic__h">${heading}</p><blockquote class="m-cds__rec" dir="ltr" lang="en">${esc(quote)}${
          citation && citeText(citation) ? `<cite>${esc(citeText(citation))}</cite>` : ''
        }</blockquote></div>`
      : '';
  const altNames = (alts) => (alts || []).map((a) => drugAr(a.drug || a.drugClass)).filter(Boolean);
  const altBlock = (alts, cpicQuote, filtered) => {
    const names = altNames(alts);
    const parts = [];
    if (names.length > 0) {
      parts.push(`<p class="mx-line"><strong>أنسب لجينات هذا المريض:</strong> ${names.join('، ')}</p>`);
      const quotes = [...new Set((alts || []).map((a) => a.quotedFrom).filter((q) => q && q !== cpicQuote))];
      for (const q of quotes) parts.push(cpicBlock(q, null));
      if (filtered) {
        parts.push('<p class="mx-line">تُعرض فقط البدائل التي تذكرها CPIC لهذا النمط في كل الاستطبابات، لأن الطلب لا يذكر استطباباً.</p>');
      }
    } else if (filtered) {
      parts.push('<p class="mx-line"><strong>أنسب لجينات هذا المريض:</strong> لا بديل معروض — تذكر CPIC بدائل مختلفة لاستطبابات مختلفة، والطلب لا يذكر استطباباً.</p>');
    }
    return parts.join('');
  };

  const gene = m.gene || '';
  const isSweep = Boolean(m.backwardSweep);
  const kind = m.kind || 'cpic';
  const pc = m.phenoconversion || null;
  const causes = (pc && pc.cause) || [];
  const converted = Boolean(m.converted);
  const indicator = card.indicator === 'warning' ? 'warning' : 'info';
  const indWord = (indicator === 'warning' ? 'تحذير' : 'للعلم') + (isSweep ? ' · مراجعة الأدوية الحالية' : '');
  const sweepPrefix = isSweep ? 'مراجعة الأدوية الحالية — ' : '';

  // Title
  let title;
  if (kind === 'not-assessed') {
    title = `${sweepPrefix}${ltr(gene)}: لم يُفحص عدد النسخ في هذا الاختبار — لا توجد نتيجة`;
  } else if (kind === 'no-result') {
    title = `${ltr(gene)}: لا توجد نتيجة من هذا الفحص — لم يُراجَع ${drugAr(m.drug)} وفق إرشاد ${ltr(gene)}`;
  } else if (kind === 'inhibitor-sweep') {
    const affected = listAr((m.affectedDrugs || []).map((a) => a.drug));
    title = converted
      ? `${sweepPrefix}${ltr(gene)} ${phenoAr(m.phenotype)}، يعمل الآن ك${phenoAr(m.effectivePhenotype)} (${drugAr(m.drug)}): يؤثر في ${affected}`
      : `${sweepPrefix}${ltr(gene)} قد يتأثر بـ${drugAr(m.drug)}: راجِع ${affected}`;
  } else {
    title = converted
      ? `${sweepPrefix}${ltr(gene)} ${phenoAr(m.phenotype)}، يعمل الآن ك${phenoAr(m.effectivePhenotype)} (${listAr(causes)}): ${drugAr(m.drug)}`
      : `${sweepPrefix}${ltr(gene)} ${phenoAr(m.phenotype)}: ${drugAr(m.drug)}`;
  }

  const body = [];
  body.push(`<p class="m-cds__summary">${title}</p>`);

  if (kind === 'not-assessed') {
    if (isSweep || m.orderDisplay) {
      body.push(`<p class="mx-line"><strong>${isSweep ? 'دواء حالي (مراجعة الأدوية الحالية):' : 'الطلب:'}</strong> ${orderAr(m.orderDisplay)}</p>`);
    }
    body.push(`<p class="mx-line">عدد نسخ الجين ${ltr(gene)} لم يُفحص في هذا الاختبار — لا توجد نتيجة معروضة. هذه ليست نتيجة طبيعية.</p>`);
    body.push(`<div class="prv-mini">${scaleHTML({ phenotype: null, callability: { method: 'not-assessed' } }, 'ar', AR.scale.metabolizer, 'patient')}</div>`);
    if (m.callability && m.callability.reason) body.push(cpicBlock(m.callability.reason, null, 'السبب — نص المصدر الحرفي'));
  } else if (kind === 'no-result') {
    body.push(`<p class="mx-line"><strong>الطلب:</strong> ${orderAr(m.orderDisplay)}</p>`);
    body.push(`<p class="mx-line">لا توجد نتيجة ${ltr(gene)} في ملف هذا المريض، لذلك لم يُراجَع هذا الطلب وفق إرشاد CPIC الخاص بـ${ltr(gene)}. هذه ليست نتيجة طبيعية.</p>`);
  } else {
    if (kind === 'inhibitor-sweep') {
      body.push(`<p class="mx-line"><strong>الطلب (مثبط ${strengthAr(pc && pc.inhibitorStrength)} لـ ${ltr(gene)}):</strong> ${orderAr(m.orderDisplay)}</p>`);
    } else if (isSweep) {
      body.push(`<p class="mx-line"><strong>دواء حالي (مراجعة الأدوية الحالية):</strong> ${orderAr(m.orderDisplay)}</p>`);
    } else if (m.orderDisplay) {
      body.push(`<p class="mx-line"><strong>الطلب:</strong> ${orderAr(m.orderDisplay)}</p>`);
    }

    const acting = converted
      ? `${phenoAr(m.effectivePhenotype)} بسبب ${listAr(causes)}`
      : pc && pc.applied && causes.length > 0
        ? `${phenoAr(m.phenotype)} · قد يتأثر بـ${listAr(causes)}`
        : `${phenoAr(m.phenotype)} (دون تغيّر)`;
    body.push(`<dl class="m-cds__pheno">
      <dt>النمط الجيني</dt><dd class="m-data">${ltr(`${gene} ${m.diplotype || ''}`.trim())}</dd>
      <dt>النتيجة الوراثية (جيناته)</dt><dd>${phenoAr(m.phenotype)}</dd>
      <dt>يعمل الآن كـ</dt><dd>${acting}</dd>
    </dl>`);
    const scaleGene = {
      phenotype: m.phenotype,
      effectivePhenotype: converted ? m.effectivePhenotype : m.phenotype,
      callability: m.callability || undefined,
    };
    const labels = AR.scale[scaleKind(m.phenotype || '')] || AR.scale.metabolizer;
    body.push(`<div class="prv-mini">${scaleHTML(scaleGene, 'ar', labels, 'patient').replace(/جيناتك/g, 'جيناته')}</div>`);

    if (pc && pc.applied && pc.geneticActivityScore != null && pc.factor != null && pc.adjustedActivityScore != null) {
      body.push(`<p class="m-coverage__line">درجة النشاط: <span class="m-data" dir="ltr">${esc(`${score(pc.geneticActivityScore)} × ${pc.factor} = ${score(pc.adjustedActivityScore)}`)}</span> (مثبط ${strengthAr(pc.inhibitorStrength)}، جدول FDA؛ ${ltr(pc.method || 'Thomas et al. 2020')})</p>`);
    }
    if (m.callability && m.callability.method === 'outside-call') {
      const caller = m.callability.source ? String(m.callability.source).split(' (')[0] : '';
      body.push(`<p class="mx-line">نتيجة ${ltr(gene)} من استدعاء خارجي تجريبي لتقدير عدد النسخ${caller ? `: ${ltr(caller)}` : ''}.</p>`);
    }
    if (Array.isArray(m.candidates) && m.candidates.length > 1) {
      body.push(`<p class="mx-line">الأنماط الثنائية المرشّحة: ${ltr(m.candidates.join(', '))}</p>`);
    }

    if (kind === 'inhibitor-sweep') {
      for (const a of m.affectedDrugs || []) {
        body.push(`<p class="mx-line"><strong>${a.coSigned ? `موقَّع ضمن هذا الطلب (أُعيد فحصه مع ${drugAr(m.drug)}):` : 'دواء حالي (مراجعة الأدوية الحالية):'}</strong> ${orderAr(a.drugDisplay || a.drug)}</p>`);
        body.push(cpicBlock(a.cpicQuote, a.citation));
        if (a.germlineOncologyNote) body.push('<p class="mx-line">نتيجة وراثية (germline) — تحليل الورم منفصل.</p>');
        body.push(altBlock(a.alternatives, a.cpicQuote, false));
      }
    } else {
      body.push(cpicBlock(m.cpicQuote, m.citation));
      if (m.cpicClassification) body.push(`<p class="mx-line">قوة التوصية في CPIC: ${classAr(m.cpicClassification)}</p>`);
      if (m.germlineOncologyNote) body.push('<p class="mx-line">نتيجة وراثية (germline) — تحليل الورم منفصل.</p>');
      if (m.implication) body.push(cpicBlock(m.implication, null, 'الأثر السريري — نص CPIC الحرفي'));
      if (m.cpicIndication) {
        const ci = m.cpicIndication;
        let line = `<p class="mx-line"><strong>استطباب CPIC:</strong> ${ltr(ci.population)} (${classAr(ci.classification)})`;
        if (ci.assumed) line += ' — مُفترَض؛ الطلب لا يذكر استطباباً. توصية CPIC لهذا النمط في الاستطبابات الأخرى:';
        line += '</p>';
        body.push(line);
        if (ci.assumed && (ci.otherPopulations || []).length > 0) {
          body.push(`<ul class="mx-others">${ci.otherPopulations
            .map((o) => `<li>${ltr(o.population)} (${classAr(o.classification)}): ${en(o.recommendation)}</li>`)
            .join('')}</ul>`);
        }
      }
      if (m.cpicQuoteIfStopped) {
        body.push(cpicBlock(m.cpicQuoteIfStopped.recommendation, null, `إذا أُوقف ${listAr(m.cpicQuoteIfStopped.stoppedDrugs)}، تنطبق النتيجة الوراثية:`));
      }
      body.push(altBlock(m.alternatives, m.cpicQuote, Boolean(m.alternativesFilteredForIndication)));
    }
  }

  // Coverage (A5) and Saudi data tier
  const cov = m.coverage || {};
  const tier = cov.saudiDataTier;
  const covParts = [];
  if (Number(cov.definingPositionsTotal) > 0) {
    const untested = Array.isArray(cov.untestedLocalAlleles) ? cov.untestedLocalAlleles : [];
    covParts.push(`غطّى الفحص ${num(cov.definingPositionsAssayed || 0)} من ${num(cov.definingPositionsTotal)} موضعاً محدِّداً${untested.length ? `؛ لم يفحص ${ltr(untested.join(', '))}` : ''}.`);
  }
  if (tier === 0) covParts.push('لا توجد درجة A5 (المستوى 0): جين تغيّر بنيوي يتولاه A8.');
  else if (tier === 1) covParts.push(`بيانات سعودية: تواتر سعودي منشور${/Goljan/.test(cov.saudiDataNote || '') ? ` ${ltr('(Goljan et al., PLoS ONE 2022, Table 1)')}` : ''}.`);
  else if (tier === 2) covParts.push('بيانات سعودية: لا يوجد تواتر سعودي منشور.');
  const tierWord = tier === 1 ? 'تواتر سعودي منشور' : tier === 0 ? 'جين تغيّر بنيوي (A8)' : tier === 2 ? 'لا يوجد تواتر سعودي منشور' : '';
  const comb = combHTML(cov);
  if (covParts.length > 0 || comb) {
    body.push(`<div class="m-coverage">${comb}<p class="m-coverage__line">${covParts.join(' ')}${
      tierWord ? ` <span class="m-tier"><span class="m-tier__n">T${tier}</span> <span>${tierWord}</span></span>` : ''
    }</p></div>`);
  }

  // Suggestions: alternatives as orderable drafts, then pharmacist
  const suggestions = Array.isArray(card.suggestions) ? card.suggestions : [];
  const altSugs = suggestions.filter((s) => (s.actions || []).some((a) => a.resource && a.resource.resourceType === 'MedicationRequest'));
  const pharm = suggestions.find((s) => s.label === 'Send to pharmacist');
  if (altSugs.length > 0 || pharm) {
    body.push(`<div class="m-cds__suggest">${altSugs
      .map((s, i) => {
        const drug = (s.actions[0].resource.medicationCodeableConcept || {}).text || '';
        return `<button class="m-btn ${i > 0 ? 'm-btn--secondary' : ''}" type="button" data-alt-drug="${esc(drug)}" data-card-idx="${idx}"><svg aria-hidden="true"><use href="#i-match"/></svg><span>أنسب لجينات هذا المريض: ${drugAr(drug)}</span></button>`;
      })
      .join('')}${pharm ? `<button class="m-btn m-btn--quiet" type="button" data-pharm="1" data-card-idx="${idx}"><svg aria-hidden="true"><use href="#i-send"/></svg><span>إرسال إلى الصيدلي</span></button>` : ''}</div>`);
  }

  const link = Array.isArray(card.links) ? card.links[0] : null;
  return `<article class="m-cds" lang="ar" dir="rtl" data-card-idx="${idx}" data-render="extension">
    <div class="m-cds__bar">
      <span class="m-cds__indicator m-cds__indicator--${indicator}"><svg aria-hidden="true"><use href="${indicator === 'warning' ? '#i-ask' : '#i-info'}"/></svg><span>${indWord}</span></span>
      <span><span class="m-mock">بيانات تجريبية</span></span>
    </div>
    <div class="m-cds__body">${body.join('\n')}</div>
    <div class="m-cds__foot">
      <span>بيانات تجريبية · ينصح ولا يصف الدواء · نموذج بحثي — ليس للاستخدام السريري</span>
      ${link ? `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--m-brand)">إرشاد CPIC</a>` : ''}
    </div>
  </article>`;
}
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
    cdsErr: 'خدمة CDS غير متاحة', footer: 'مِعيار · نموذج بحثي أولي، ليس للاستخدام السريري · بيانات تجريبية فقط · T3 وT4 غير مصنوعين · يعمل على بيانات اصطناعية وبيانات GeT-RM المرجعية؛ لم تُستخدم أي بيانات لمرضى.',
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
    cdsErr: 'CDS service not reachable', footer: 'Meyar · research prototype, not for clinical use · demo data only · T3 and T4 are not built · Runs on synthetic and GeT-RM reference data; no patient data was used.',
    advises: 'Advises, does not prescribe', src: 'Source',
  },
};

function cardHTML(c, idx = 0) {
  if (lang === 'ar' && AR && c.extension && c.extension.meyar) {
    return renderCardAr(c, { AR, esc, scaleHTML, scaleIndex, scaleKind, combHTML, idx }).replace(/#i-match/g, '#i-better');
  }
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
    ? result.cards.map((c, i) => cardHTML(c, i)).join('')
    : `<span class="m-status m-status--stop">${icon('i-stop')}${esc(L.cdsErr)}: ${esc(result.error)}</span>`;
  calibrate(box);
}

document.getElementById('sign').addEventListener('click', async () => {
  result = await (await fetch('/api/urgent/card', { method: 'POST' })).json();
  await arReady;
  render();
});
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; render(); }));
initMotion();
render();
if (new URLSearchParams(location.search).get('sign') === '1') document.getElementById('sign').click();
