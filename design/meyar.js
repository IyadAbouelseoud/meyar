// Meyar design-system helpers · design/meyar.js
// Plain ES module, no dependencies. Reads the data contract shape (docs/data-contract.md).
// It renders only what the contract says. It never infers, ranks or invents a result.

// ---- Phenotype → scale position -------------------------------------------------
// Five stops, slow → fast. Metaboliser genes and function genes share the scale;
// binary genes (HLA-*) do not use it (render .m-binary instead).
// UI labels are DRAFT plain-language strings for C4's native-speaker review.
export const SCALE = {
  // clinician: CPIC terms (prescriber card, dashboard). en/ar: patient words (Passport).
  metabolizer: {
    clinician: ['Poor', 'Intermediate', 'Normal', 'Rapid', 'Ultrarapid'],
    en: ['Slow', 'A bit slow', 'Normal', 'A bit fast', 'Very fast'],
    ar: ['بطيء', 'أبطأ قليلاً', 'طبيعي', 'أسرع قليلاً', 'سريع جداً'],
  },
  function: {
    clinician: ['Poor function', 'Decreased', 'Normal', 'Increased', '—'],
    en: ['Weak', 'Weaker', 'Normal', 'Stronger', '—'],
    ar: ['ضعيف', 'أضعف قليلاً', 'طبيعي', 'أقوى', '—'],
  },
};
const IDX = [
  [/ultrarapid/i, 4], [/rapid/i, 3], [/normal/i, 2], [/intermediate/i, 1], [/poor/i, 0],
  [/increased function/i, 3], [/decreased function/i, 1], [/poor function/i, 0], [/normal function/i, 2],
];
export function scaleIndex(phenotype) {
  if (!phenotype) return null;
  if (/indeterminate|not assessed|no result|n\/a/i.test(phenotype)) return null; // never guessed
  for (const [re, i] of IDX) if (re.test(phenotype)) return i;
  return null;
}
export function scaleKind(phenotype = '') { return /function/i.test(phenotype) ? 'function' : 'metabolizer'; }

// ---- Scale markup ----------------------------------------------------------------
// labels (optional): five final strings from passport/src/i18n (C4 owns the wording).
export function scaleHTML(gene, lang = 'ar', labelsOverride = null) {
  const notAssessed = gene.callability?.method === 'not-assessed';
  const g = notAssessed ? null : scaleIndex(gene.phenotype);
  const eff = gene.effectivePhenotype ?? gene.phenotype;
  const a = notAssessed ? null : scaleIndex(eff);
  const kind = scaleKind(gene.phenotype);
  const labels = labelsOverride ?? SCALE[kind][lang] ?? SCALE[kind].en;
  const converted = g != null && a != null && g !== a;
  const unassessed = g == null || a == null;
  const t = lang === 'ar'
    ? { genetic: 'جيناتك', acting: 'الآن', none: 'لم يُفحص — لا توجد نتيجة' }
    : { genetic: 'Genetic', acting: 'Acting like', none: 'Not assessed — no result reported' };
  const cls = ['m-scale', converted && 'is-converted', unassessed && 'is-unassessed'].filter(Boolean).join(' ');
  const aria = unassessed ? t.none
    : converted ? `${t.genetic}: ${labels[g]}. ${t.acting}: ${labels[a]}.`
    : `${t.genetic}: ${labels[g]}.`;
  return `<div class="${cls}" style="--m-g:${g ?? 2};--m-a:${a ?? 2}" role="img" aria-label="${aria}" data-g="${g ?? ''}" data-a="${a ?? ''}">
  <span class="m-scale__void">${t.none}</span>
  <span class="m-scale__genetic"><span class="m-scale__flag">${t.genetic}</span></span>
  <span class="m-scale__shift"></span>
  <span class="m-scale__acting"><span class="m-scale__flag">${converted ? t.acting : t.genetic}</span></span>
  <div class="m-scale__track">${'<i class="m-scale__seg"></i>'.repeat(5)}</div>
  <span class="m-scale__ticks" aria-hidden="true"></span>
  <div class="m-scale__labels" aria-hidden="true">${labels.map((l, i) => `<span${i === a && !unassessed ? ' aria-current="true"' : ''}>${l}</span>`).join('')}</div>
</div>`;
}

// Calibrate once: needle starts on the genetic result and settles on the acting result.
export function calibrate(root = document) {
  root.querySelectorAll('.m-scale').forEach((el) => {
    if (el.dataset.calibrated) return;
    el.dataset.calibrated = '1';
    const a = el.style.getPropertyValue('--m-a');
    const g = el.style.getPropertyValue('--m-g');
    el.classList.add('is-calibrating');
    el.style.setProperty('--m-a', g);
    const conv = el.classList.contains('is-converted');
    if (conv) el.classList.remove('is-converted');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.setProperty('--m-a', a);
      if (conv) el.classList.add('is-converted');
    }));
  });
}

// ---- Coverage comb (A5) ----------------------------------------------------------
// Draws exactly definingPositionsTotal teeth. Which positions were missed is not in
// the contract, so gaps are drawn at the end and the sentence names the alleles.
export function combHTML(cov) {
  if (!cov || !cov.definingPositionsTotal) return '';
  const n = cov.definingPositionsTotal, k = cov.definingPositionsAssayed;
  let s = '';
  for (let i = 0; i < n; i++) s += `<i style="--i:${i}"${i >= k ? ' class="is-gap"' : ''}></i>`;
  return `<div class="m-comb is-drawing" role="img" aria-label="${k} of ${n}">${s}</div>`;
}

// ---- Motion switch ----------------------------------------------------------------
// Motion is opt-in: the .m-motion class is added only when the user allows motion and
// elder mode is off. No JS → no animation → nothing breaks.
export function initMotion() {
  const html = document.documentElement;
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const set = () => html.classList.toggle('m-motion', !mq.matches && html.dataset.elder !== 'on');
  set(); mq.addEventListener?.('change', set);
  new MutationObserver(set).observe(html, { attributes: true, attributeFilter: ['data-elder'] });
}

// ---- Counts (B4) ------------------------------------------------------------------
// Counts up to a real logged number. Never use on a sourced statistic or a rate.
export function countTo(el, value, ms = 900) {
  const html = document.documentElement;
  if (!html.classList.contains('m-motion')) { el.textContent = value.toLocaleString(el.lang || undefined); return; }
  const start = performance.now(), from = Number(el.dataset.v || 0);
  el.dataset.v = value;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / ms), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (value - from) * e).toLocaleString(el.lang || undefined);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---- Language and elder mode -----------------------------------------------------
export function setLang(lang) {
  const html = document.documentElement;
  html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
export function setElder(on) { document.documentElement.dataset.elder = on ? 'on' : 'off'; }
