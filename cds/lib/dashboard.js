// Server-rendered HTML for GET /dashboard (B4).
// Built strictly from design/ (fonts, tokens, meyar.css, meyar.js, charts.js).
// No hard-coded colours, fonts, or radii; no external chart libraries.
// Research prototype — synthetic/mock data only.

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_WATCH_FIXTURES = [
  {
    label: 'demo-002 · CYP2D6 *1/*1',
    note: 'paroxetine · strong',
    gene: {
      gene: 'CYP2D6',
      phenotype: 'Normal Metabolizer',
      effectivePhenotype: 'Poor Metabolizer',
      callability: { method: 'outside-call' },
    },
  },
  {
    label: 'demo-001 · CYP2C19 *2/*2',
    note: 'no current inhibitor',
    gene: {
      gene: 'CYP2C19',
      phenotype: 'Poor Metabolizer',
      effectivePhenotype: 'Poor Metabolizer',
      callability: { method: 'vcf' },
    },
  },
  {
    label: 'demo-004 · CYP2D6 from VCF',
    note: 'not assessed (A8)',
    gene: {
      gene: 'CYP2D6',
      phenotype: null,
      effectivePhenotype: null,
      callability: { method: 'not-assessed' },
    },
  },
];

const DEFAULT_COVERAGE_PATIENTS = [
  {
    patientId: 'demo-001',
    cells: [
      { gene: 'CYP2C19', ratio: 1.0, sv: false },
      { gene: 'CYP2C9', ratio: 0.9, sv: false },
      { gene: 'VKORC1', ratio: 1.0, sv: false },
      { gene: 'SLCO1B1', ratio: 0.85, sv: false },
      { gene: 'DPYD', ratio: 0.8, sv: false },
      { gene: 'CYP2D6', ratio: null, sv: true },
    ],
  },
  {
    patientId: 'demo-002',
    cells: [
      { gene: 'CYP2C19', ratio: 0.95, sv: false },
      { gene: 'CYP2C9', ratio: 0.9, sv: false },
      { gene: 'VKORC1', ratio: 1.0, sv: false },
      { gene: 'SLCO1B1', ratio: 0.9, sv: false },
      { gene: 'DPYD', ratio: 0.85, sv: false },
      { gene: 'CYP2D6', ratio: null, sv: true },
    ],
  },
  {
    patientId: 'demo-006',
    cells: [
      { gene: 'CYP2C19', ratio: 32 / 35, sv: false },
      { gene: 'CYP2C9', ratio: 86 / 88, sv: false },
      { gene: 'VKORC1', ratio: 0.5, sv: false },
      { gene: 'SLCO1B1', ratio: 0.8, sv: false },
      { gene: 'DPYD', ratio: 0.75, sv: false },
      { gene: 'CYP2D6', ratio: null, sv: true },
    ],
  },
];

export function loadWatchFixtures(fixturesDir) {
  if (!fixturesDir || !fs.existsSync(fixturesDir)) return DEFAULT_WATCH_FIXTURES;
  const rows = [];
  const specs = [
    { file: 'demo-002.contract.json', gene: 'CYP2D6' },
    { file: 'demo-001.contract.json', gene: 'CYP2C19' },
  ];
  for (const spec of specs) {
    const p = path.join(fixturesDir, spec.file);
    if (!fs.existsSync(p)) continue;
    try {
      const contract = JSON.parse(fs.readFileSync(p, 'utf8'));
      const g = (contract.genes || []).find((x) => x.gene === spec.gene);
      if (!g) continue;
      const cause =
        g.phenoconversion?.applied && Array.isArray(g.phenoconversion.cause) && g.phenoconversion.cause.length > 0
          ? `${g.phenoconversion.cause.join(', ')} · ${g.phenoconversion.inhibitorStrength || 'inhibitor'}`
          : 'no current inhibitor';
      rows.push({
        label: `${contract.patientId} · ${g.gene} ${g.diplotype || ''}`.trim(),
        note: cause,
        gene: {
          gene: g.gene,
          phenotype: g.phenotype,
          effectivePhenotype: g.effectivePhenotype ?? g.phenotype,
          callability: g.callability || { method: 'vcf' },
        },
      });
    } catch {
      // Fallback below if fixture cannot be parsed.
    }
  }
  rows.push(DEFAULT_WATCH_FIXTURES[2]);
  return rows.length >= 2 ? rows : DEFAULT_WATCH_FIXTURES;
}

export function loadCoverageGrid(fixturesDir) {
  const genes = ['CYP2C19', 'CYP2C9', 'VKORC1', 'SLCO1B1', 'DPYD', 'CYP2D6'];
  if (!fixturesDir || !fs.existsSync(fixturesDir)) {
    return { genes, patients: DEFAULT_COVERAGE_PATIENTS };
  }
  const files = ['demo-001.contract.json', 'demo-002.contract.json', 'demo-006.contract.json'];
  const patients = [];
  for (const file of files) {
    const p = path.join(fixturesDir, file);
    if (!fs.existsSync(p)) continue;
    try {
      const contract = JSON.parse(fs.readFileSync(p, 'utf8'));
      const byGene = new Map((contract.genes || []).map((g) => [g.gene, g]));
      patients.push({
        patientId: contract.patientId,
        cells: genes.map((gene) => {
          if (gene === 'CYP2D6') return { gene, ratio: null, sv: true };
          const g = byGene.get(gene);
          const assayed = Number(g?.coverage?.definingPositionsAssayed || 0);
          const total = Number(g?.coverage?.definingPositionsTotal || 0);
          // No coverage data for this gene: show "no data", never an invented shade (REVIEW).
          if (!(total > 0)) return { gene, ratio: null, sv: false, noData: true };
          const ratio = Math.max(0.2, Math.min(1, assayed / total));
          return { gene, ratio, sv: false };
        }),
      });
    } catch {
      // Ignore unparseable fixture
    }
  }
  return {
    genes,
    patients: patients.length > 0 ? patients : DEFAULT_COVERAGE_PATIENTS,
  };
}

export function renderDashboardHtml({ initialSummary, watchFixtures, coverageGrid }) {
  const bootstrapJson = JSON.stringify({
    summary: initialSummary,
    watchFixtures,
    coverageGrid,
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en" dir="ltr" data-theme="instrument" data-voice="clinician" data-elder="off">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:,">
<title>Meyar · Alert log</title>
<link rel="stylesheet" href="/design/fonts/fonts.css">
<link rel="stylesheet" href="/design/tokens.css">
<link rel="stylesheet" href="/design/meyar.css">
<style>
:root { --gut: max(16px, env(safe-area-inset-left, 0px)); --gut-r: max(16px, env(safe-area-inset-right, 0px)); --wrap: 1240px; }
body.m-body { background: var(--m-bg); color: var(--m-text); margin: 0; overflow-x: hidden; }
.in { box-sizing: border-box; inline-size: 100%; max-inline-size: var(--wrap); margin-inline: auto; padding-block: var(--m-space-6); padding-left: var(--gut); padding-right: var(--gut-r); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--m-space-6); }
.dash-top { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--m-space-4); flex-wrap: wrap; }
.dash-top > * { min-width: 0; max-inline-size: 100%; }
.sec-head { display: grid; gap: var(--m-space-2); max-inline-size: 68ch; min-width: 0; }
.sec-head h1 { margin: 0; font-family: var(--m-font-display); font-weight: 300; font-size: var(--m-size-2xl); letter-spacing: -.02em; color: var(--m-text); line-height: 1.15; }
.sec-head p { margin: 0; color: var(--m-text2); font-size: var(--m-size-sm); }
.sec-ar { font-family: var(--m-font-display); font-weight: 700; font-size: var(--m-size-xl); line-height: 1.2; color: var(--m-brand); inline-size: fit-content; }
.dash-ctl { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: center; justify-content: flex-start; min-width: 0; }
@media (min-width: 900px) { .dash-ctl { justify-content: flex-end; } }
.dash-date { display: grid; text-align: start; font-size: var(--m-size-xs); color: var(--m-text2); line-height: 1.4; }
@media (min-width: 900px) { .dash-date { text-align: end; } }
.m-tile { min-width: 0; grid-template-columns: minmax(0, 1fr); }
.dash-nav { display: flex; align-items: center; justify-content: space-between; gap: var(--m-space-3); flex-wrap: wrap; }
.m-seg { min-block-size: var(--m-target); }
.m-seg button { min-block-size: var(--m-target); }
.m-seg button[aria-pressed="true"] { background: var(--m-data); color: var(--m-on-brand); box-shadow: none; }
.dash-lang { min-block-size: var(--m-target); padding-inline: 14px; border-radius: var(--m-radius-pill); border: 1px solid var(--m-line); background: var(--m-surface); color: var(--m-text); font: inherit; font-size: var(--m-size-xs); font-weight: 600; cursor: pointer; }
.dash-lang:hover { border-color: var(--m-line-strong); }
.m-areabox { position: relative; min-block-size: 190px; }
.m-gaugebox { display: grid; place-items: center; gap: 4px; }
.dash-rings { display: grid; gap: var(--m-space-4); }
.dash-note { margin: 0; font-size: var(--m-size-xs); color: var(--m-text3); text-align: center; }
.dash-empty { padding: var(--m-space-4); border-radius: var(--m-radius-chip); background: var(--m-sunken); color: var(--m-text2); font-size: var(--m-size-sm); text-align: center; }
.dash-heat-wrap { overflow-x: auto; max-inline-size: 100%; }
.m-heat__hdr { font-size: var(--m-size-xs); text-align: center; overflow: hidden; text-overflow: ellipsis; }
.dash-foot { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--m-space-3); padding-block-start: var(--m-space-4); border-block-start: 1px solid var(--m-line); font-size: var(--m-size-xs); color: var(--m-text3); }
</style>
</head>
<body class="m-body">

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-stop" viewBox="0 0 24 24"><path d="M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 12h9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
  <symbol id="i-ask" viewBox="0 0 24 24"><path d="M12 3 22 20.5H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.25" fill="currentColor"/></symbol>
  <symbol id="i-none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3.2 2.6"/><path d="M8.5 12h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.25" fill="currentColor"/></symbol>
  <symbol id="i-match" viewBox="0 0 24 24"><path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.3 12.2 2.6 2.6 4.9-5.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-mark" viewBox="0 0 24 24"><path d="M3 21v-5M7.5 21v-8M12 21V9M16.5 21v-8M21 21v-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 1.8 14.3 4.6 12 7.4 9.7 4.6z" fill="currentColor"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path d="M3 11.5 21 3l-6.5 18-3-7.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
</svg>

<main class="in">
  <div class="dash-nav">
    <a class="m-wordmark" href="/dashboard" aria-label="Meyar">
      <svg class="m-wordmark__tick" aria-hidden="true"><use href="#i-mark"/></svg>
      <span class="m-wordmark__ar" lang="ar">مِعيار</span>
      <span class="m-wordmark__en">Meyar</span>
    </a>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button type="button" class="dash-lang" id="lang-toggle" aria-label="Switch language to Arabic">العربية</button>
    </div>
  </div>

  <header class="dash-top">
    <div class="sec-head">
      <span class="sec-ar" lang="ar" dir="rtl" id="t-sec-ar">سجل التنبيهات</span>
      <h1 id="t-title">Alert log</h1>
      <p id="t-framing">No published national adverse-drug-reaction rate exists for Saudi Arabia. This log is a first measurement instrument: it counts what prescribers did with each card, and never shows an invented rate.</p>
    </div>
    <div class="dash-ctl">
      <div class="dash-date"><span id="hijri" lang="ar" dir="rtl"></span><span id="greg"></span></div>
      <div class="m-seg" role="group" aria-label="Time range">
        <button type="button" data-range="today" aria-pressed="true" id="btn-today">Today</button>
        <button type="button" data-range="week" aria-pressed="false" id="btn-week">7 days</button>
      </div>
      <span class="m-live"><i></i><span id="t-live">Live · cds/data/alerts.jsonl</span></span>
      <span class="m-mock" id="t-mock">Demo log · synthetic sessions</span>
    </div>
  </header>

  <section class="m-dash" aria-label="Alert log metrics">
    <div class="m-tile m-tile--3">
      <div class="m-tile__head"><span class="m-tile__title" id="t-k1">Cards fired</span><span class="m-tile__meta" id="t-k1m">order-sign</span></div>
      <div class="m-kpi"><div class="m-kpi__row"><span class="m-kpi__num" id="k-fired" data-v="0">0</span><span class="m-delta" id="d-fired"></span></div><div id="s-fired"></div></div>
    </div>
    <div class="m-tile m-tile--3">
      <div class="m-tile__head"><span class="m-tile__title" id="t-k2">Accepted</span><span class="m-tile__meta" id="t-k2m">better match</span></div>
      <div class="m-kpi"><div class="m-kpi__row"><span class="m-kpi__num" id="k-acc" data-v="0">0</span><span class="m-delta" id="d-acc"></span></div><div id="s-acc"></div></div>
    </div>
    <div class="m-tile m-tile--3">
      <div class="m-tile__head"><span class="m-tile__title" id="t-k3">Phenoconversion flags</span><span class="m-tile__meta">A7</span></div>
      <div class="m-kpi"><div class="m-kpi__row"><span class="m-kpi__num" id="k-pc" data-v="0">0</span><span class="m-delta" id="d-pc"></span></div><div id="s-pc"></div></div>
    </div>
    <div class="m-tile m-tile--3">
      <div class="m-tile__head"><span class="m-tile__title" id="t-k4">Backward-sweep cards</span><span class="m-tile__meta" id="t-k4m">existing orders re-checked</span></div>
      <div class="m-kpi"><div class="m-kpi__row"><span class="m-kpi__num" id="k-sw" data-v="0">0</span><span class="m-delta" id="d-sw"></span></div><div id="s-sw"></div></div>
    </div>

    <div class="m-tile m-tile--8">
      <div class="m-tile__head"><span class="m-tile__title" id="t-area">Cards fired over time</span><span class="m-tile__meta" id="area-meta">per hour · hover or use arrow keys</span></div>
      <div class="m-areabox" id="area"></div>
    </div>
    <div class="m-tile m-tile--4">
      <div class="m-tile__head"><span class="m-tile__title" id="t-gauge">Acted on</span><span class="m-tile__meta" id="t-gaugem">accepted or sent to pharmacist</span></div>
      <div class="m-gaugebox" id="gauge"></div>
      <p class="dash-note" id="t-gaugenote">Share of cards in this log. Not a national rate.</p>
    </div>

    <div class="m-tile m-tile--4">
      <div class="m-tile__head"><span class="m-tile__title" id="t-bars">Cards by drug</span><span class="m-tile__meta" id="t-barsm">count</span></div>
      <div id="bars"></div>
    </div>
    <div class="m-tile m-tile--4">
      <div class="m-tile__head"><span class="m-tile__title" id="t-rings">Response mix</span><span class="m-tile__meta" id="t-ringsm">prescriber action</span></div>
      <div id="rings" class="dash-rings"></div>
    </div>
    <div class="m-tile m-tile--4">
      <div class="m-tile__head"><span class="m-tile__title" id="t-watch">Phenoconversion watch</span><span class="m-tile__meta" id="t-watchm">A7 · fixtures</span></div>
      <div class="m-watch" id="watch"></div>
    </div>

    <div class="m-tile m-tile--7">
      <div class="m-tile__head"><span class="m-tile__title" id="t-feed">Live feed</span><span class="m-tile__meta" id="t-feedm">newest first</span></div>
      <div class="m-feed" id="feed" aria-live="polite" tabindex="0" aria-label="Live alert feed"></div>
    </div>
    <div class="m-tile m-tile--5">
      <div class="m-tile__head"><span class="m-tile__title" id="t-heat">Coverage by patient</span><span class="m-tile__meta" id="t-heatm">A5 · darker = more positions tested</span></div>
      <div class="dash-heat-wrap"><div class="m-heat" id="heat"></div></div>
      <p class="dash-note" id="t-heatnote">Hatched: CYP2D6 not called from VCF (A8). Shading is demo data.</p>
    </div>
  </section>

  <footer class="dash-foot">
    <span class="m-proto" id="t-proto">Research prototype — not for clinical use. Runs on synthetic and GeT-RM reference data; no patient data was used.</span>
    <span id="t-source">Source: cds/data/alerts.jsonl · Demo data only</span>
  </footer>
</main>

<script id="bootstrap" type="application/json">${bootstrapJson}</script>
<script type="module">
import { scaleHTML, calibrate, initMotion } from '/design/meyar.js';
import { area, gauge, bars, rings, minibars, tween } from '/design/charts.js';

initMotion();

const I18N = {
  en: {
    title: 'Alert log',
    framing: 'No published national adverse-drug-reaction rate exists for Saudi Arabia. This log is a first measurement instrument: it counts what prescribers did with each card, and never shows an invented rate.',
    today: 'Today',
    week: '7 days',
    live: 'Live · cds/data/alerts.jsonl',
    mock: 'Demo log · synthetic sessions',
    k1: 'Cards fired',
    k1m: 'order-sign',
    k2: 'Accepted',
    k2m: 'better match',
    k3: 'Phenoconversion flags',
    k4: 'Backward-sweep cards',
    k4m: 'existing orders re-checked',
    area: 'Cards fired over time',
    areaToday: 'per hour · hover or use arrow keys',
    areaWeek: 'per day · hover or use arrow keys',
    gauge: 'Acted on',
    gaugem: 'accepted or sent to pharmacist',
    gaugenote: 'Share of cards in this log. Not a national rate.',
    bars: 'Cards by drug',
    barsm: 'count',
    rings: 'Response mix',
    ringsm: 'prescriber action',
    watch: 'Phenoconversion watch',
    watchm: 'A7 · fixtures',
    feed: 'Live feed',
    feedm: 'newest first',
    heat: 'Coverage by patient',
    heatm: 'A5 · darker = more positions tested',
    heatnote: 'Hatched: CYP2D6 not called from VCF (A8). Shading is demo data.',
    proto: 'Research prototype — not for clinical use. Runs on synthetic and GeT-RM reference data; no patient data was used.',
    source: 'Source: cds/data/alerts.jsonl · Demo data only',
    vsToday: 'vs yesterday',
    vsWeek: 'vs prev 7d',
    emptyFeed: 'No alerts logged yet in this window. Fire a CDS Hooks request to record live entries.',
    emptyBars: 'No drug alerts logged in this window.',
    cardsLabel: 'cards',
    actedLabel: 'Acted on',
    langBtn: 'العربية',
    langAria: 'Switch language to Arabic',
    actions: {
      fired: ['info', 'Card fired', 'info'],
      accepted: ['match', 'Better match accepted', 'info'],
      pharmacist: ['send', 'Sent to pharmacist', 'ask'],
      dismissed: ['none', 'Dismissed', 'none'],
    },
  },
  ar: {
    title: 'سجل التنبيهات',
    framing: 'لا يوجد معدل وطني منشور للتفاعلات الدوائية الضارة في المملكة العربية السعودية. هذا السجل أداة قياس أولى: يُحصي استجابة الواصفين لكل بطاقة دون أي معدل مُفترض.',
    today: 'اليوم',
    week: '٧ أيام',
    live: 'مباشر · cds/data/alerts.jsonl',
    mock: 'سجل تجريبي · جلسات محاكاة',
    k1: 'البطاقات المُرسلة',
    k1m: 'order-sign',
    k2: 'المقبولة',
    k2m: 'البديل الأنسب',
    k3: 'تنبيهات التحوّل الظاهري',
    k4: 'بطاقات المراجعة الرجعية',
    k4m: 'مراجعة الوصفات السابقة',
    area: 'البطاقات المُرسلة عبر الزمن',
    areaToday: 'في الساعة · مرّر أو استخدم الأسهم',
    areaWeek: 'في اليوم · مرّر أو استخدم الأسهم',
    gauge: 'نسبة التفاعل',
    gaugem: 'مقبول أو مُرسل للصيدلي',
    gaugenote: 'حصة من البطاقات في هذا السجل وليست معدلاً وطنياً.',
    bars: 'البطاقات حسب الدواء',
    barsm: 'العدد',
    rings: 'توزيع الاستجابات',
    ringsm: 'إجراء الواصف',
    watch: 'مراقبة التحوّل الظاهري',
    watchm: 'A7 · بيانات مرجعية',
    feed: 'التدفق المباشر',
    feedm: 'الأحدث أولاً',
    heat: 'التغطية حسب المريض',
    heatm: 'A5 · الأغمق = مواقع فحص أكثر',
    heatnote: 'المُظلل بخطوط: CYP2D6 لم يُقرأ من VCF (A8). التظليل بيانات تجريبية.',
    proto: 'نموذج بحثي — غير مخصص للاستخدام السريري. يعمل على بيانات اصطناعية وبيانات GeT-RM المرجعية؛ لم تُستخدم أي بيانات لمرضى.',
    source: 'المصدر: cds/data/alerts.jsonl · بيانات تجريبية فقط',
    vsToday: 'مقارنة بالأمس',
    vsWeek: 'مقارنة بـ ٧ أيام سابقة',
    emptyFeed: 'لا توجد تنبيهات مسجلة في هذه الفترة بعد. أرسل طلب CDS Hooks لتسجيل تنبيه.',
    emptyBars: 'لا توجد تنبيهات أدوية مسجلة في هذه الفترة.',
    cardsLabel: 'بطاقة',
    actedLabel: 'نسبة التفاعل',
    langBtn: 'English',
    langAria: 'Switch language to English',
    actions: {
      fired: ['info', 'بطاقة مُرسلة', 'info'],
      accepted: ['match', 'قُبل البديل الأنسب', 'info'],
      pharmacist: ['send', 'أُرسل للصيدلي', 'ask'],
      dismissed: ['none', 'تم التجاهل', 'none'],
    },
  },
};

const bootstrap = JSON.parse(document.getElementById('bootstrap').textContent);
const urlLang = new URLSearchParams(location.search).get('lang');
let state = {
  lang: urlLang === 'ar' ? 'ar' : 'en',
  range: 'today',
  summary: bootstrap.summary,
  seenKeys: new Set((bootstrap.summary.feed || []).map((e) => e.time + '|' + e.cardId + '|' + e.action)),
};

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateDates() {
  const now = new Date();
  try {
    document.getElementById('hijri').textContent = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  } catch { /* calendar unsupported */ }
  document.getElementById('greg').textContent = new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-SA' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
}

function applyLabels() {
  const t = I18N[state.lang];
  const html = document.documentElement;
  html.lang = state.lang;
  html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

  document.getElementById('t-sec-ar').hidden = state.lang === 'ar';
  document.getElementById('t-title').textContent = t.title;
  document.getElementById('t-framing').textContent = t.framing;
  document.getElementById('btn-today').textContent = t.today;
  document.getElementById('btn-week').textContent = t.week;
  document.getElementById('t-live').textContent = t.live;
  document.getElementById('t-mock').textContent = t.mock;
  document.getElementById('t-k1').textContent = t.k1;
  document.getElementById('t-k1m').textContent = t.k1m;
  document.getElementById('t-k2').textContent = t.k2;
  document.getElementById('t-k2m').textContent = t.k2m;
  document.getElementById('t-k3').textContent = t.k3;
  document.getElementById('t-k4').textContent = t.k4;
  document.getElementById('t-k4m').textContent = t.k4m;
  document.getElementById('t-area').textContent = t.area;
  document.getElementById('area-meta').textContent = state.range === 'week' ? t.areaWeek : t.areaToday;
  document.getElementById('t-gauge').textContent = t.gauge;
  document.getElementById('t-gaugem').textContent = t.gaugem;
  document.getElementById('t-gaugenote').textContent = t.gaugenote;
  document.getElementById('t-bars').textContent = t.bars;
  document.getElementById('t-barsm').textContent = t.barsm;
  document.getElementById('t-rings').textContent = t.rings;
  document.getElementById('t-ringsm').textContent = t.ringsm;
  document.getElementById('t-watch').textContent = t.watch;
  document.getElementById('t-watchm').textContent = t.watchm;
  document.getElementById('t-feed').textContent = t.feed;
  document.getElementById('t-feedm').textContent = t.feedm;
  document.getElementById('t-heat').textContent = t.heat;
  document.getElementById('t-heatm').textContent = t.heatm;
  document.getElementById('t-heatnote').textContent = t.heatnote;
  document.getElementById('t-proto').textContent = t.proto;
  document.getElementById('t-source').textContent = t.source;

  const langBtn = document.getElementById('lang-toggle');
  langBtn.textContent = t.langBtn;
  langBtn.setAttribute('aria-label', t.langAria);
  updateDates();
}

function setDelta(el, curr, prev) {
  const t = I18N[state.lang];
  const vs = state.range === 'week' ? t.vsWeek : t.vsToday;
  if (!prev && !curr) {
    el.textContent = '0 ' + vs;
    el.className = 'm-delta m-delta--flat';
    return;
  }
  if (!prev) {
    el.textContent = '+' + curr + ' ' + vs;
    el.className = 'm-delta';
    return;
  }
  const d = Math.round(((curr - prev) / prev) * 100);
  el.textContent = (d > 0 ? '▲ +' : d < 0 ? '▼ −' : '') + Math.abs(d) + '% ' + vs;
  el.className = 'm-delta' + (d === 0 ? ' m-delta--flat' : d < 0 ? ' m-delta--down' : '');
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  return d.toLocaleTimeString(state.lang === 'ar' ? 'ar-SA' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderSummary(summary, markNew = false) {
  const t = I18N[state.lang];
  const c = summary.counts;
  const p = summary.prevCounts;
  const series = summary.series || [];

  tween(document.getElementById('k-fired'), c.fired);
  setDelta(document.getElementById('d-fired'), c.fired, p.fired);
  minibars(document.getElementById('s-fired'), series.map((s) => s.y));

  tween(document.getElementById('k-acc'), c.accepted);
  setDelta(document.getElementById('d-acc'), c.accepted, p.accepted);
  minibars(document.getElementById('s-acc'), series.map((s) => s.accepted));

  tween(document.getElementById('k-pc'), c.phenoconversion);
  setDelta(document.getElementById('d-pc'), c.phenoconversion, p.phenoconversion);
  minibars(document.getElementById('s-pc'), series.map((s) => s.phenoconversion));

  tween(document.getElementById('k-sw'), c.switched);
  setDelta(document.getElementById('d-sw'), c.switched, p.switched);
  minibars(document.getElementById('s-sw'), series.map((s) => s.switched));

  area(document.getElementById('area'), {
    series: series.map((s) => ({ x: s.x, y: s.y })),
    label: t.area,
    unit: ' ' + t.cardsLabel,
  });

  gauge(document.getElementById('gauge'), {
    value: summary.actedOn.value,
    max: summary.actedOn.max,
    label: t.actedLabel,
    lang: state.lang,
  });

  const barsEl = document.getElementById('bars');
  if (summary.byDrug.length === 0) {
    barsEl.innerHTML = '<div class="dash-empty">' + esc(t.emptyBars) + '</div>';
  } else {
    bars(barsEl, {
      data: summary.byDrug.slice(0, 6).map((d) => ({ x: d.drug.slice(0, 8), y: d.count })),
      label: t.bars,
    });
  }

  rings(document.getElementById('rings'), {
    centre: c.fired,
    centreLabel: t.cardsLabel,
    parts: [
      { label: t.actions.accepted[1], value: c.accepted, color: 'var(--m-data)' },
      { label: t.actions.pharmacist[1], value: c.pharmacist, color: 'var(--m-data2)' },
      { label: t.actions.dismissed[1], value: c.dismissed, color: 'var(--m-text3)' },
    ],
  });

  const feedEl = document.getElementById('feed');
  const feed = summary.feed || [];
  if (feed.length === 0) {
    feedEl.innerHTML = '<div class="dash-empty">' + esc(t.emptyFeed) + '</div>';
  } else {
    feedEl.innerHTML = feed
      .map((e) => {
        const key = e.time + '|' + e.cardId + '|' + e.action;
        const isNew = markNew && !state.seenKeys.has(key);
        state.seenKeys.add(key);
        const act = t.actions[e.action] || t.actions.fired;
        const mono = esc(String(e.patientPseudonym || 'P').slice(0, 4).toUpperCase());
        return '<div class="m-feed__row' + (isNew ? ' is-new' : '') + '">' +
          '<span class="m-mono">' + mono + '</span>' +
          '<span class="m-feed__what">' +
          '<span><b>' + esc(e.drug) + '</b> · <span class="m-data" style="color:var(--m-text2)">' + esc(e.gene) + '</span>' + (e.backwardSweep ? ' · sweep' : '') + '</span>' +
          '<small>' + esc(formatTime(e.time)) + ' · <span class="m-data">' + esc(e.patientPseudonym) + '</span> · ' + esc(e.phenotype) + '</small>' +
          '</span>' +
          '<span class="m-status m-status--' + act[2] + '"><svg aria-hidden="true"><use href="#i-' + act[0] + '"/></svg>' + esc(act[1]) + '</span>' +
          '</div>';
      })
      .join('');
  }
}

function renderStaticFixtures() {
  document.getElementById('watch').innerHTML = bootstrap.watchFixtures
    .map((row) => '<div class="m-watch__row"><header><span class="m-data">' + esc(row.label) + '</span><span>' + esc(row.note) + '</span></header>' + scaleHTML(row.gene, 'clinician') + '</div>')
    .join('');
  calibrate(document.getElementById('watch'));

  const g = bootstrap.coverageGrid;
  document.getElementById('heat').innerHTML =
    '<div class="m-heat__row" style="--n:' + g.genes.length + '"><span></span>' +
    g.genes.map((gene) => '<span class="m-heat__hdr">' + esc(gene) + '</span>').join('') +
    '</div>' +
    g.patients
      .map((pt) => '<div class="m-heat__row" style="--n:' + g.genes.length + '"><span>' + esc(pt.patientId) + '</span>' +
        pt.cells.map((cell) => cell.sv
          ? '<span class="m-heat__cell is-na" title="Not called from VCF (A8)">SV</span>'
          : cell.noData
          ? '<span class="m-heat__cell is-na" title="No coverage data in this contract">—</span>'
          : '<span class="m-heat__cell" style="--v:' + Number(cell.ratio).toFixed(2) + '" title="Demo coverage shading"></span>'
        ).join('') + '</div>')
      .join('');
}

async function refresh(markNew = true) {
  try {
    const res = await fetch('/dashboard/data?range=' + encodeURIComponent(state.range));
    if (!res.ok) return;
    const next = await res.json();
    state.summary = next;
    renderSummary(state.summary, markNew);
  } catch {
    // Keep last rendered state if offline or server restarting.
  }
}

document.querySelectorAll('[data-range]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.range = btn.dataset.range;
    document.querySelectorAll('[data-range]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
    applyLabels();
    refresh(false);
  });
});

document.getElementById('lang-toggle').addEventListener('click', () => {
  state.lang = state.lang === 'en' ? 'ar' : 'en';
  applyLabels();
  renderSummary(state.summary, false);
});

applyLabels();
renderStaticFixtures();
renderSummary(state.summary, false);

setInterval(() => {
  if (!document.hidden) refresh(true);
}, 3000);
</script>
</body>
</html>`;
}
