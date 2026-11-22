// Server-rendered HTML for GET /compare (B5 — Side-by-side alert comparison screen).
// Built strictly from design/ (fonts, tokens, meyar.css, meyar.js).
// Ground: data-theme="paper" data-voice="clinician" (.m-chartpaper).
// Left: deliberately generic grey interruptive modal (counter-example).
// Right: Meyar's non-interruptive .m-cds card as in design/showcase/index.html.
// Caption: exact verbatim UF + UK PROGRESS numbers, no other numbers added.

export const COMPARISON_CAPTION_EN =
  'University of Florida interruptive alerts — 63% accepted but only 20% of recommendations followed. UK PROGRESS, non-interruptive and pharmacist-mediated — 90% acted on.';

export const COMPARISON_CAPTION_AR =
  'تنبيهات جامعة فلوريدا المقاطِعة — قُبل 63% منها لكن لم يُتَّبع سوى 20% من التوصيات. برنامج UK PROGRESS، غير مقاطِع وبوساطة الصيدلي — تم التصرف بناءً على 90% منها.';

const COPY = {
  en: {
    title: 'Meyar — Alert comparison',
    heading: 'Why the card does not interrupt',
    subtitle: 'Side-by-side comparison on the clinician order screen: an interruptive modal versus Meyar’s non-interruptive side-rail card.',
    demo: 'Demo data',
    proto: 'Research prototype — not for clinical use',
    navDash: 'Alert log',
    leftLabel: 'Counter-example · Interruptive',
    modalHeader: 'DRUG–GENE ALERT',
    modalBody: 'CYP2C19 result on file. Review before continuing.',
    modalReason: 'Override reason (required):',
    modalSelect: 'Select reason…',
    modalOverride: 'Override and continue',
    leftCaption: 'Interruptive modal of the kind others build. It stops the order until dismissed.',
    rightLabel: 'Meyar · Non-interruptive',
    cdsIndicator: 'warning',
    cdsSummary: 'CYP2C19 poor metaboliser. Clopidogrel likely less effective; prasugrel or ticagrelor are better matched.',
    dtGenotype: 'Genotype',
    dtGenetic: 'Genetic',
    ddGenetic: 'Poor metaboliser',
    dtActing: 'Acting like',
    ddActing: 'Poor metaboliser (no shift)',
    recQuote: 'Avoid standard-dose clopidogrel if possible. Use prasugrel or ticagrelor at standard dose if no contraindication.',
    recCite: 'CPIC CYP2C19–clopidogrel, 2022 update (Lee et al., Clin Pharmacol Ther 2022).',
    covLine: 'Assay covered <strong>9 of 11</strong> defining positions; did not test <span class="m-data">*35</span>.',
    tierLabel: 'Saudi frequency published',
    btnPrasugrel: 'Better matched for this patient’s genes: prasugrel',
    btnTicagrelor: 'Better matched: ticagrelor',
    btnPharm: 'Send to pharmacist',
    footNote: 'Advises, does not prescribe',
    footLink: 'CPIC guideline',
    rightCaption: COMPARISON_CAPTION_EN,
  },
  ar: {
    title: 'مِعيار — مقارنة التنبيهات',
    heading: 'لماذا لا تقاطع البطاقة الطبيب',
    subtitle: 'مقارنة جنباً إلى جنب في شاشة وصف الدواء: نافذة منبثقة مقاطِعة مقابل بطاقة مِعيار الجانبية غير المقاطِعة.',
    demo: 'بيانات تجريبية',
    proto: 'نموذج بحثي — ليس للاستخدام السريري',
    navDash: 'سجل التنبيهات',
    leftLabel: 'مثال مضاد · تنبيه مقاطِع',
    modalHeader: 'تنبيه دواء–جين',
    modalBody: 'توجد نتيجة CYP2C19 في الملف. راجعها قبل المتابعة.',
    modalReason: 'سبب التجاوز (إلزامي):',
    modalSelect: 'اختر السبب…',
    modalOverride: 'تجاوز ومتابعة',
    leftCaption: 'نافذة مقاطِعة من النوع الشائع. توقف الطلب حتى يتم إغلاقها.',
    rightLabel: 'مِعيار · غير مقاطِع',
    cdsIndicator: 'تحذير',
    cdsSummary: 'مستقلِب بطيء لإنزيم CYP2C19. فعالية كلوبيدوقريل أقل غالباً؛ براسوغريل أو تيكاقريلور أنسب.',
    dtGenotype: 'النمط الجيني',
    dtGenetic: 'النتيجة الجينية',
    ddGenetic: 'مستقلِب بطيء',
    dtActing: 'يتصرف كـ',
    ddActing: 'مستقلِب بطيء (دون تغيّر)',
    recQuote: 'تجنّب الجرعة المعتادة من كلوبيدوقريل إن أمكن. استخدم براسوغريل أو تيكاقريلور بالجرعة المعتادة إذا لم يوجد مانع.',
    recCite: 'إرشادات CPIC لـ CYP2C19–كلوبيدوقريل، تحديث 2022 (Lee et al., Clin Pharmacol Ther 2022).',
    covLine: 'غطّى الفحص <strong>9 من 11</strong> موضعاً محدِّداً؛ لم يفحص <span class="m-data">*35</span>.',
    tierLabel: 'تواتر سعودي منشور',
    btnPrasugrel: 'أنسب لجينات هذا المريض: براسوغريل',
    btnTicagrelor: 'أنسب: تيكاقريلور',
    btnPharm: 'إرسال إلى الصيدلي',
    footNote: 'ينصح ولا يصف الدواء',
    footLink: 'إرشاد CPIC',
    rightCaption: COMPARISON_CAPTION_AR,
  },
};

export function renderCompareHtml({ lang = 'en' } = {}) {
  const initialLang = lang === 'ar' ? 'ar' : 'en';
  const dir = initialLang === 'ar' ? 'rtl' : 'ltr';
  const c = COPY[initialLang];
  const copyJson = JSON.stringify(COPY).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="${initialLang}" dir="${dir}" data-theme="paper" data-voice="clinician" data-elder="off">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${c.title}</title>
<link rel="stylesheet" href="/design/fonts/fonts.css">
<link rel="stylesheet" href="/design/tokens.css">
<link rel="stylesheet" href="/design/meyar.css">
<style>
  .cmp-wrap {
    max-inline-size: 1200px;
    margin-inline: auto;
    padding: var(--m-space-5) var(--m-space-4) var(--m-space-7);
    display: grid;
    gap: var(--m-space-5);
    box-sizing: border-box;
  }
  .cmp-wrap > * {
    min-inline-size: 0;
  }
  .cmp-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--m-space-3);
    padding-block-end: var(--m-space-4);
    border-block-end: 1px solid var(--m-line);
  }
  .cmp-head__brand {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--m-space-3);
  }
  .cmp-head__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--m-space-2);
  }
  .cmp-nav-link {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--m-target);
    padding-inline: var(--m-space-3);
    border-radius: var(--m-radius-control);
    border: 1px solid var(--m-line-strong);
    background: var(--m-surface);
    color: var(--m-brand-strong);
    font-size: var(--m-size-sm);
    font-weight: 600;
    text-decoration: none;
  }
  .cmp-nav-link:hover {
    background: var(--m-sunken);
  }
  .cmp-seg button {
    min-block-size: var(--m-target);
  }
  .cmp-intro {
    display: grid;
    gap: var(--m-space-2);
  }
  .cmp-intro h1 {
    font-size: var(--m-size-xl);
    font-weight: 700;
    color: var(--m-text);
  }
  .cmp-intro p {
    font-size: var(--m-size-sm);
    color: var(--m-text2);
    max-inline-size: 68ch;
  }
  .cmp-grid {
    display: grid;
    gap: var(--m-space-5);
    grid-template-columns: 1fr;
    align-items: start;
  }
  @media (min-width: 900px) {
    .cmp-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .cmp-pane {
    margin: 0;
    display: grid;
    gap: var(--m-space-3);
    min-inline-size: 0;
  }
  .cmp-pane > * {
    min-inline-size: 0;
  }
  .cmp-pane__label {
    font-family: var(--m-font-clinician);
    font-size: var(--m-size-xs);
    font-weight: 600;
    color: var(--m-text2);
    letter-spacing: .04em;
  }
  [lang="ar"] .cmp-pane__label {
    letter-spacing: 0;
  }
  /* Deliberately generic grey interruptive modal (counter-example) */
  .cmp-modal {
    border-radius: var(--m-radius-card);
    background: #d4d7d5;
    border: 1px solid #b8bdb9;
    padding: var(--m-space-4);
    display: grid;
    place-items: center;
    min-block-size: 320px;
    min-inline-size: 0;
  }
  @media (min-width: 480px) {
    .cmp-modal {
      padding: var(--m-space-5);
    }
  }
  .cmp-modal__box {
    background: #f5f5f5;
    color: #1f2421;
    border: 1px solid #9ea4a0;
    border-radius: 4px;
    inline-size: 100%;
    max-inline-size: 360px;
    overflow: hidden;
    box-shadow: 0 10px 28px rgb(0 0 0 / .22);
  }
  .cmp-modal__box header {
    background: #525754;
    color: #ffffff;
    padding: 12px 14px;
    font-weight: 700;
    font-size: var(--m-size-sm);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cmp-modal__box header svg {
    inline-size: 16px;
    block-size: 16px;
    flex: none;
  }
  .cmp-modal__body {
    padding: 16px 14px;
    font-size: var(--m-size-sm);
    display: grid;
    gap: 10px;
  }
  .cmp-modal__btn {
    font: inherit;
    min-block-size: var(--m-target);
    padding: 10px 12px;
    border: 1px solid #8a908c;
    background: #e3e5e4;
    color: #1f2421;
    border-radius: 2px;
    text-align: start;
    cursor: pointer;
  }
  .cmp-modal__btn--confirm {
    background: #d0d4d2;
    font-weight: 600;
    text-align: center;
  }
  .cmp-mini {
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow-x: auto;
  }
  .cmp-mini .m-scale {
    padding-block-start: 30px;
  }
  .cmp-mini .m-scale__track {
    block-size: 10px;
  }
  .cmp-mini .m-scale__genetic::after {
    inset-block-start: 26px;
    inline-size: 18px;
    block-size: 18px;
  }
  .cmp-mini .m-scale__acting::before {
    inset-block-start: 12px;
    block-size: 32px;
  }
  .m-cds {
    min-inline-size: 0;
    max-inline-size: 100%;
  }
  .m-cds__bar {
    flex-wrap: wrap;
    gap: var(--m-space-2);
  }
  [lang="ar"] .m-cds__indicator {
    letter-spacing: 0;
  }
  .m-cds__body > * {
    min-inline-size: 0;
  }
  .m-cds__suggest {
    min-inline-size: 0;
  }
  .m-cds__suggest .m-btn {
    min-block-size: var(--m-target);
    white-space: normal;
    text-align: start;
    inline-size: 100%;
    max-inline-size: 100%;
    height: auto;
    padding-block: var(--m-space-2);
  }
  .cmp-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--m-space-2);
    padding-block-start: var(--m-space-4);
    border-block-start: 1px solid var(--m-line);
    font-size: var(--m-size-xs);
    color: var(--m-text2);
  }
</style>
</head>
<body class="m-body m-chartpaper">

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-mark" viewBox="0 0 24 24"><path d="M3 21v-5M7.5 21v-8M12 21V9M16.5 21v-8M21 21v-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 1.8 14.3 4.6 12 7.4 9.7 4.6z" fill="currentColor"/></symbol>
  <symbol id="i-ask" viewBox="0 0 24 24"><path d="M12 3 22 20.5H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.25" fill="currentColor"/></symbol>
  <symbol id="i-match" viewBox="0 0 24 24"><path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.3 12.2 2.6 2.6 4.9-5.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path d="M3 11.5 21 3l-6.5 18-3-7.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
</svg>

<main class="cmp-wrap">
  <header class="cmp-head">
    <div class="cmp-head__brand">
      <a class="m-wordmark" href="/compare">
        <svg class="m-wordmark__tick" aria-hidden="true"><use href="#i-mark"/></svg>
        <span class="m-wordmark__ar" lang="ar">مِعيار</span>
        <span class="m-wordmark__en">Meyar</span>
      </a>
      <span class="m-mock" data-t="demo">${c.demo}</span>
    </div>
    <div class="cmp-head__controls">
      <a class="cmp-nav-link" href="/dashboard" data-t="navDash">${c.navDash}</a>
      <div class="m-seg cmp-seg" role="group" aria-label="Language">
        <button type="button" data-lang-btn="en" aria-pressed="${initialLang === 'en' ? 'true' : 'false'}">EN</button>
        <button type="button" data-lang-btn="ar" aria-pressed="${initialLang === 'ar' ? 'true' : 'false'}">عربي</button>
      </div>
    </div>
  </header>

  <section class="cmp-intro">
    <h1 data-t="heading">${c.heading}</h1>
    <p data-t="subtitle">${c.subtitle}</p>
  </section>

  <section class="cmp-grid" aria-label="Alert comparison">
    <figure class="cmp-pane">
      <span class="cmp-pane__label" data-t="leftLabel">${c.leftLabel}</span>
      <div class="cmp-modal" aria-label="Example of an interruptive alert">
        <div class="cmp-modal__box">
          <header><svg aria-hidden="true"><use href="#i-ask"/></svg><span data-t="modalHeader">${c.modalHeader}</span></header>
          <div class="cmp-modal__body">
            <span data-t="modalBody">${c.modalBody}</span>
            <span data-t="modalReason">${c.modalReason}</span>
            <button class="cmp-modal__btn" type="button" data-t="modalSelect">${c.modalSelect}</button>
            <button class="cmp-modal__btn cmp-modal__btn--confirm" type="button" data-t="modalOverride">${c.modalOverride}</button>
          </div>
        </div>
      </div>
      <figcaption class="m-caption" data-t="leftCaption">${c.leftCaption}</figcaption>
    </figure>

    <figure class="cmp-pane">
      <span class="cmp-pane__label" data-t="rightLabel">${c.rightLabel}</span>
      <article class="m-cds">
        <div class="m-cds__bar">
          <span class="m-cds__indicator m-cds__indicator--warning"><svg aria-hidden="true"><use href="#i-ask"/></svg><span data-t="cdsIndicator">${c.cdsIndicator}</span></span>
          <span><span class="m-data">CPIC 2022-11</span> · <span class="m-mock" data-t="demo">${c.demo}</span></span>
        </div>
        <div class="m-cds__body">
          <p class="m-cds__summary" data-t="cdsSummary">${c.cdsSummary}</p>
          <dl class="m-cds__pheno">
            <dt data-t="dtGenotype">${c.dtGenotype}</dt><dd class="m-data">CYP2C19 *2/*2</dd>
            <dt data-t="dtGenetic">${c.dtGenetic}</dt><dd data-t="ddGenetic">${c.ddGenetic}</dd>
            <dt data-t="dtActing">${c.dtActing}</dt><dd data-t="ddActing">${c.ddActing}</dd>
          </dl>
          <div class="cmp-mini" id="cmp-scale"></div>
          <blockquote class="m-cds__rec">
            <span data-t="recQuote">${c.recQuote}</span>
            <cite data-t="recCite">${c.recCite}</cite>
          </blockquote>
          <div class="m-coverage">
            <div id="cmp-comb"></div>
            <p class="m-coverage__line">
              <span data-t-html="covLine">${c.covLine}</span>
              <span class="m-tier"><span class="m-tier__n">T1</span> <span data-t="tierLabel">${c.tierLabel}</span></span>
            </p>
          </div>
          <div class="m-cds__suggest">
            <button class="m-btn" type="button"><svg aria-hidden="true"><use href="#i-match"/></svg><span data-t="btnPrasugrel">${c.btnPrasugrel}</span></button>
            <button class="m-btn m-btn--secondary" type="button"><svg aria-hidden="true"><use href="#i-match"/></svg><span data-t="btnTicagrelor">${c.btnTicagrelor}</span></button>
            <button class="m-btn m-btn--quiet" type="button"><svg aria-hidden="true"><use href="#i-send"/></svg><span data-t="btnPharm">${c.btnPharm}</span></button>
          </div>
        </div>
        <div class="m-cds__foot">
          <span data-t="footNote">${c.footNote}</span>
          <a href="https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/" style="color:var(--m-brand)" data-t="footLink">${c.footLink}</a>
        </div>
      </article>
      <figcaption class="m-caption" data-t="rightCaption">${c.rightCaption}</figcaption>
    </figure>
  </section>

  <footer class="cmp-foot">
    <span class="m-proto" data-t="proto">${c.proto}</span>
  </footer>
</main>

<script type="module">
  import { scaleHTML, combHTML, calibrate, initMotion, setLang } from '/design/meyar.js';

  const COPY = ${copyJson};
  const GENE = {
    gene: 'CYP2C19',
    diplotype: '*2/*2',
    phenotype: 'Poor Metabolizer',
    coverage: { definingPositionsAssayed: 9, definingPositionsTotal: 11, untestedLocalAlleles: ['*35'] },
  };

  function renderInstrument() {
    const scaleHost = document.getElementById('cmp-scale');
    const combHost = document.getElementById('cmp-comb');
    if (scaleHost) {
      scaleHost.innerHTML = scaleHTML(GENE, 'clinician');
      calibrate(scaleHost);
    }
    if (combHost) {
      combHost.innerHTML = combHTML(GENE.coverage);
    }
  }

  function applyLang(lang) {
    const target = lang === 'ar' ? 'ar' : 'en';
    const c = COPY[target];
    setLang(target);
    document.title = c.title;
    document.querySelectorAll('[data-t]').forEach((el) => {
      const key = el.dataset.t;
      if (c[key] !== undefined) el.textContent = c[key];
    });
    document.querySelectorAll('[data-t-html]').forEach((el) => {
      const key = el.dataset.tHtml;
      if (c[key] !== undefined) el.innerHTML = c[key];
    });
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.langBtn === target ? 'true' : 'false');
    });
  }

  initMotion();
  renderInstrument();

  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.dataset.langBtn));
  });
</script>
</body>
</html>`;
}
