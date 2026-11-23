// Server-rendered HTML for GET /preview (B6 — Interactive Prescriber Card Preview).
// Built strictly from design/ (fonts, tokens, meyar.css, meyar.js).
// Ground: data-theme="paper" data-voice="clinician" (.m-chartpaper).
// Evaluates live scenarios against POST /cds-services/meyar-pgx and renders
// Meyar's non-interruptive .m-cds side-rail cards with scaleHTML(gene, 'clinician'),
// combHTML(coverage), Genetic / Acting like list, and .m-btn alternatives.

const COPY = {
  en: {
    title: 'Meyar — Prescriber card preview',
    heading: 'Prescriber order-sign card',
    subtitle:
      'Non-interruptive CDS Hooks 2.0.1 side-rail preview wired to POST /cds-services/meyar-pgx. Shows genetic and acting-like phenotypes, current-medicine effects, and CPIC-named better-matched alternatives.',
    demo: 'Demo data',
    proto: 'Research prototype — not for clinical use',
    navDash: 'Alert log',
    navCmp: 'Alert comparison',
    scenariosLabel: 'Clinical order-sign scenarios',
    ordersTitle: 'Draft & active orders',
    thMed: 'Medication',
    thRole: 'Context',
    thStatus: 'Status',
    signBtn: 'Sign order (non-interruptive)',
    railTitle: 'Meyar decision support',
    railMode: 'Non-interruptive · order-sign',
    loading: 'Evaluating against CPIC tables…',
    noCards: 'No pharmacogenomic advisory triggered for this order.',
    dtGenotype: 'Genotype',
    dtGenetic: 'Genetic',
    dtActing: 'Acting like',
    noShift: '(no shift)',
    becauseOf: 'because of',
    mayAffect: 'may be affected by',
    tier1: 'Saudi frequency published',
    tier2: 'No published Saudi frequency',
    tier0: 'Structural gene (A8)',
    betterPrefix: "Better matched for this patient's genes: ",
    sendPharm: 'Send to pharmacist',
    footNote: 'Advises, does not prescribe',
    footLink: 'CPIC guideline',
    jsonSummary: 'Live CDS Hooks 2.0.1 JSON response (POST /cds-services/meyar-pgx)',
    actionAccepted: 'Draft order updated to',
    actionPharm: 'Sent advisory to pharmacist for review.',
    sc1Label: '1. demo-001 · Clopidogrel (ACS/PCI)',
    sc2Label: '2. demo-002 · Codeine (on paroxetine)',
    sc3Label: '3. Paroxetine order · Patient on codeine (effect after signing)',
    sc4Label: '4. Pantoprazole · No CPIC alternative',
  },
  ar: {
    title: 'مِعيار — معاينة بطاقة الطبيب',
    heading: 'بطاقة الطبيب عند توقيع الوصفة',
    subtitle:
      'معاينة جانبية غير مقاطِعة متصلة بخدمة CDS Hooks 2.0.1 تعرض النمط الجيني والنمط الفعلي وتأثير الأدوية الحالية والبدائل الأنسب المنصوص عليها في إرشادات CPIC.',
    demo: 'بيانات تجريبية',
    proto: 'نموذج بحثي — ليس للاستخدام السريري',
    navDash: 'سجل التنبيهات',
    navCmp: 'مقارنة التنبيهات',
    scenariosLabel: 'سيناريوهات توقيع الوصفة',
    ordersTitle: 'الطلبات الحالية والجديدة',
    thMed: 'الدواء',
    thRole: 'السياق',
    thStatus: 'الحالة',
    signBtn: 'توقيع الطلب (دون مقاطعة)',
    railTitle: 'دعم القرار الدوائي — مِعيار',
    railMode: 'غير مقاطِع · order-sign',
    loading: 'جارٍ التقييم وفق جداول CPIC…',
    noCards: 'لا يوجد تنبيه دوائي جيني لهذا الطلب.',
    dtGenotype: 'النمط الجيني',
    dtGenetic: 'النتيجة الجينية',
    dtActing: 'يتصرف كـ',
    noShift: '(دون تغيّر)',
    becauseOf: 'بسبب',
    mayAffect: 'قد يتأثر بـ',
    tier1: 'تواتر سعودي منشور',
    tier2: 'لا يوجد تواتر سعودي منشور',
    tier0: 'جين تغيّر بنيوي (A8)',
    betterPrefix: 'أنسب لجينات هذا المريض: ',
    sendPharm: 'إرسال إلى الصيدلي',
    footNote: 'ينصح ولا يصف الدواء',
    footLink: 'إرشاد CPIC',
    jsonSummary: 'استجابة CDS Hooks 2.0.1 الفعلية (POST /cds-services/meyar-pgx)',
    actionAccepted: 'تم تحديث مسودة الطلب إلى',
    actionPharm: 'تم إرسال التنبيه إلى الصيدلي للمراجعة.',
    sc1Label: '١. demo-001 · كلوبيدوقريل (ACS/PCI)',
    sc2Label: '٢. demo-002 · كودايين (مع باروكسيتين)',
    sc3Label: '٣. طلب باروكسيتين · مريض يتناول كودايين (الأثر بعد التوقيع)',
    sc4Label: '٤. بانتوبرازول · دون بديل في CPIC',
  },
};

function makeObs({ patientId, gene, diplotype, phenotype, guidelineVersion }) {
  return {
    resourceType: 'Observation',
    id: `${patientId}-${gene.toLowerCase()}`,
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '84413-4', display: 'Genotype display name' }],
      text: `${gene} genotype and phenotype`,
    },
    subject: { reference: `Patient/${patientId}` },
    valueCodeableConcept: { text: diplotype },
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
        valueCodeableConcept: { text: gene },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: '48002-0', display: 'Genomic source class [Type]' }] },
        valueCodeableConcept: {
          coding: [{ system: 'http://loinc.org', code: 'LA6683-2', display: 'Germline' }],
          text: 'germline',
        },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: '53037-8', display: 'Genetic variation clinical significance [Imp]' }] },
        valueCodeableConcept: { text: phenotype },
      },
      {
        code: { text: 'Guideline version' },
        valueString: guidelineVersion,
      },
    ],
  };
}

export function buildPreviewScenarios() {
  return [
    {
      id: 'demo-001-clopidogrel',
      labelKey: 'sc1Label',
      patientId: 'demo-001',
      drug: 'clopidogrel',
      orders: [
        { name: 'Clopidogrel 75 MG Oral Tablet', context: 'ACS / PCI', status: 'Signing now', pending: true },
        { name: 'Aspirin 81 MG Oral Tablet', context: 'Active medication', status: 'Active', pending: false },
      ],
      geneProfile: {
        gene: 'CYP2C19',
        diplotype: '*2/*2',
        phenotype: 'Poor Metabolizer',
        effectivePhenotype: 'Poor Metabolizer',
        coverage: {
          definingPositionsAssayed: 9,
          definingPositionsTotal: 11,
          untestedLocalAlleles: ['*35'],
          saudiDataTier: 1,
        },
      },
      hookBody: {
        hook: 'order-sign',
        hookInstance: 'b6-preview-001',
        context: {
          userId: 'Practitioner/demo-clinician',
          patientId: 'demo-001',
          draftOrders: {
            resourceType: 'Bundle',
            type: 'collection',
            entry: [
              {
                resource: {
                  resourceType: 'MedicationRequest',
                  id: 'medrx-b6-1',
                  status: 'draft',
                  intent: 'order',
                  subject: { reference: 'Patient/demo-001' },
                  reasonCode: [{ text: 'Acute coronary syndrome, PCI' }],
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '32968',
                        display: 'Clopidogrel 75 MG Oral Tablet',
                      },
                    ],
                    text: 'Clopidogrel 75 MG Oral Tablet',
                  },
                },
              },
            ],
          },
        },
      },
    },
    {
      id: 'demo-002-codeine',
      labelKey: 'sc2Label',
      patientId: 'demo-002',
      drug: 'codeine',
      orders: [
        { name: 'Codeine 30 MG Oral Tablet', context: 'New analgesic order', status: 'Signing now', pending: true },
        { name: 'Paroxetine 20 MG Oral Tablet', context: 'Hospital record (CYP2D6 strong inhibitor)', status: 'Active', pending: false },
      ],
      geneProfile: {
        gene: 'CYP2D6',
        diplotype: '*1/*1',
        phenotype: 'Normal Metabolizer',
        effectivePhenotype: 'Poor Metabolizer',
        phenoconversion: { applied: true, cause: ['paroxetine'] },
        coverage: { definingPositionsAssayed: 0, definingPositionsTotal: 0, saudiDataTier: 0 },
      },
      hookBody: {
        hook: 'order-sign',
        hookInstance: 'b6-preview-002',
        context: {
          userId: 'Practitioner/demo-clinician',
          patientId: 'demo-002',
          draftOrders: {
            resourceType: 'Bundle',
            type: 'collection',
            entry: [
              {
                resource: {
                  resourceType: 'MedicationRequest',
                  id: 'medrx-b6-2',
                  status: 'draft',
                  intent: 'order',
                  subject: { reference: 'Patient/demo-002' },
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '2670',
                        display: 'Codeine 30 MG Oral Tablet',
                      },
                    ],
                    text: 'Codeine 30 MG Oral Tablet',
                  },
                },
              },
            ],
          },
        },
      },
    },
    {
      id: 'paroxetine-backward-sweep',
      labelKey: 'sc3Label',
      patientId: 'demo-002-sweep',
      drug: 'paroxetine',
      orders: [
        { name: 'Paroxetine 20 MG Oral Tablet', context: 'Strong CYP2D6 inhibitor', status: 'Signing now', pending: true },
        { name: 'Codeine 30 MG Oral Tablet', context: 'Existing active order', status: 'Active', pending: false },
      ],
      geneProfile: {
        gene: 'CYP2D6',
        diplotype: '*1/*1',
        phenotype: 'Normal Metabolizer',
        effectivePhenotype: 'Poor Metabolizer',
        phenoconversion: { applied: true, cause: ['paroxetine'] },
        coverage: { definingPositionsAssayed: 0, definingPositionsTotal: 0, saudiDataTier: 0 },
      },
      hookBody: {
        hook: 'order-sign',
        hookInstance: 'b6-preview-003',
        context: {
          userId: 'Practitioner/demo-clinician',
          patientId: 'demo-002-sweep',
          draftOrders: {
            resourceType: 'Bundle',
            type: 'collection',
            entry: [
              {
                resource: {
                  resourceType: 'MedicationRequest',
                  id: 'medrx-b6-3',
                  status: 'draft',
                  intent: 'order',
                  subject: { reference: 'Patient/demo-002-sweep' },
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '32937',
                        display: 'Paroxetine 20 MG Oral Tablet',
                      },
                    ],
                    text: 'Paroxetine 20 MG Oral Tablet',
                  },
                },
              },
            ],
          },
        },
        prefetch: {
          pgxObservations: {
            resourceType: 'Bundle',
            type: 'searchset',
            entry: [
              {
                resource: makeObs({
                  patientId: 'demo-002-sweep',
                  gene: 'CYP2D6',
                  diplotype: '*1/*1',
                  phenotype: 'Normal Metabolizer',
                  guidelineVersion: 'CPIC 2021',
                }),
              },
            ],
          },
          currentMedications: {
            resourceType: 'Bundle',
            type: 'searchset',
            entry: [
              {
                resource: {
                  resourceType: 'MedicationStatement',
                  id: 'stmt-codeine-1',
                  status: 'active',
                  subject: { reference: 'Patient/demo-002-sweep' },
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '2670',
                        display: 'Codeine 30 MG Oral Tablet',
                      },
                    ],
                    text: 'Codeine 30 MG Oral Tablet',
                  },
                },
              },
            ],
          },
        },
      },
    },
    {
      id: 'pantoprazole-no-alt',
      labelKey: 'sc4Label',
      patientId: 'demo-cyp2c19-um',
      drug: 'pantoprazole',
      orders: [
        { name: 'Pantoprazole 40 MG Oral Tablet', context: 'PPI dose adjustment (no CPIC alternative)', status: 'Signing now', pending: true },
      ],
      geneProfile: {
        gene: 'CYP2C19',
        diplotype: '*17/*17',
        phenotype: 'Ultrarapid Metabolizer',
        effectivePhenotype: 'Ultrarapid Metabolizer',
        coverage: {
          definingPositionsAssayed: 35,
          definingPositionsTotal: 35,
          untestedLocalAlleles: [],
          saudiDataTier: 1,
        },
      },
      hookBody: {
        hook: 'order-sign',
        hookInstance: 'b6-preview-004',
        context: {
          userId: 'Practitioner/demo-clinician',
          patientId: 'demo-cyp2c19-um',
          draftOrders: {
            resourceType: 'Bundle',
            type: 'collection',
            entry: [
              {
                resource: {
                  resourceType: 'MedicationRequest',
                  id: 'medrx-b6-4',
                  status: 'draft',
                  intent: 'order',
                  subject: { reference: 'Patient/demo-cyp2c19-um' },
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '40790',
                        display: 'Pantoprazole 40 MG Oral Tablet',
                      },
                    ],
                    text: 'Pantoprazole 40 MG Oral Tablet',
                  },
                },
              },
            ],
          },
        },
        prefetch: {
          pgxObservations: {
            resourceType: 'Bundle',
            type: 'searchset',
            entry: [
              {
                resource: makeObs({
                  patientId: 'demo-cyp2c19-um',
                  gene: 'CYP2C19',
                  diplotype: '*17/*17',
                  phenotype: 'Ultrarapid Metabolizer',
                  guidelineVersion: 'CPIC 2020-08',
                }),
              },
            ],
          },
        },
      },
    },
  ];
}

export function renderPreviewHtml({ lang = 'en' } = {}) {
  const initialLang = lang === 'ar' ? 'ar' : 'en';
  const dir = initialLang === 'ar' ? 'rtl' : 'ltr';
  const c = COPY[initialLang];
  const copyJson = JSON.stringify(COPY).replace(/</g, '\\u003c');
  const scenariosJson = JSON.stringify(buildPreviewScenarios()).replace(/</g, '\\u003c');

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
  .prv-wrap {
    max-inline-size: 1240px;
    margin-inline: auto;
    padding: var(--m-space-5) var(--m-space-4) var(--m-space-7);
    display: grid;
    gap: var(--m-space-5);
    box-sizing: border-box;
  }
  .prv-wrap > * { min-inline-size: 0; }
  .prv-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--m-space-3);
    padding-block-end: var(--m-space-4);
    border-block-end: 1px solid var(--m-line);
  }
  .prv-head__brand {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--m-space-3);
  }
  .prv-head__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--m-space-2);
  }
  .prv-nav-link {
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
  .prv-nav-link:hover { background: var(--m-sunken); }
  .prv-seg button { min-block-size: var(--m-target); }
  .prv-intro { display: grid; gap: var(--m-space-2); }
  .prv-intro h1 {
    font-size: var(--m-size-xl);
    font-weight: 700;
    color: var(--m-text);
  }
  .prv-intro p {
    font-size: var(--m-size-sm);
    color: var(--m-text2);
    max-inline-size: 72ch;
  }
  .prv-scenarios {
    display: flex;
    flex-wrap: wrap;
    gap: var(--m-space-2);
  }
  .prv-sc-btn {
    min-block-size: var(--m-target);
    padding: var(--m-space-2) var(--m-space-3);
    border-radius: var(--m-radius-control);
    border: 1px solid var(--m-line-strong);
    background: var(--m-surface);
    color: var(--m-text);
    font-family: var(--m-font-clinician);
    font-size: var(--m-size-sm);
    font-weight: 600;
    text-align: start;
    cursor: pointer;
    transition: background var(--m-dur-tap) var(--m-ease-settle), border-color var(--m-dur-tap) var(--m-ease-settle);
  }
  .prv-sc-btn[aria-pressed="true"] {
    background: var(--m-brand);
    border-color: var(--m-brand);
    color: var(--m-on-brand);
  }
  .prv-layout {
    display: grid;
    gap: var(--m-space-5);
    grid-template-columns: 1fr;
    align-items: start;
  }
  @media (min-width: 960px) {
    .prv-layout {
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    }
  }
  .prv-ehr {
    background: var(--m-surface);
    border: 1px solid var(--m-line);
    border-radius: var(--m-radius-card);
    overflow: hidden;
    min-inline-size: 0;
  }
  .prv-ehr__head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--m-space-2);
    padding: var(--m-space-3) var(--m-space-4);
    background: var(--m-sunken);
    border-block-end: 1px solid var(--m-line);
    font-size: var(--m-size-sm);
  }
  .prv-table-wrap { overflow-x: auto; }
  .prv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--m-size-sm);
  }
  .prv-table th, .prv-table td {
    padding: var(--m-space-3) var(--m-space-4);
    text-align: start;
    border-block-end: 1px solid var(--m-line);
  }
  .prv-table th {
    font-size: var(--m-size-xs);
    color: var(--m-text2);
    font-weight: 600;
  }
  .prv-table tr.is-pending td {
    background: var(--m-ask-tint);
    color: var(--m-text);
  }
  .prv-ehr__actions {
    padding: var(--m-space-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--m-space-3);
  }
  .prv-ehr__actions .m-btn { min-block-size: var(--m-target); }
  .prv-action-note {
    font-size: var(--m-size-sm);
    color: var(--m-brand-strong);
    font-weight: 600;
  }
  .prv-rail {
    display: grid;
    gap: var(--m-space-3);
    min-inline-size: 0;
  }
  .prv-rail__label {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--m-space-2);
    font-size: var(--m-size-xs);
    font-weight: 600;
    color: var(--m-text2);
  }
  .prv-mini {
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow-x: auto;
  }
  .prv-mini .m-scale { padding-block-start: 30px; }
  .prv-mini .m-scale__track { block-size: 10px; }
  .prv-mini .m-scale__genetic::after {
    inset-block-start: 26px;
    inline-size: 18px;
    block-size: 18px;
  }
  .prv-mini .m-scale__acting::before {
    inset-block-start: 12px;
    block-size: 32px;
  }
  .m-cds { min-inline-size: 0; max-inline-size: 100%; }
  .m-cds__bar { flex-wrap: wrap; gap: var(--m-space-2); }
  [lang="ar"] .m-cds__indicator { letter-spacing: 0; }
  .m-cds__body > * { min-inline-size: 0; }
  .m-cds__suggest { min-inline-size: 0; }
  .m-cds__suggest .m-btn {
    min-block-size: var(--m-target);
    white-space: normal;
    text-align: start;
    inline-size: 100%;
    max-inline-size: 100%;
    height: auto;
    padding-block: var(--m-space-2);
  }
  .prv-json {
    background: var(--m-surface);
    border: 1px solid var(--m-line);
    border-radius: var(--m-radius-control);
    padding: var(--m-space-3) var(--m-space-4);
    font-size: var(--m-size-sm);
  }
  .prv-json summary {
    cursor: pointer;
    font-weight: 600;
    min-block-size: var(--m-target);
    display: flex;
    align-items: center;
  }
  .prv-json pre {
    margin-block-start: var(--m-space-3);
    padding: var(--m-space-3);
    background: var(--m-sunken);
    border-radius: var(--m-radius-hair);
    overflow-x: auto;
    font-family: var(--m-font-data);
    font-size: var(--m-size-xs);
    direction: ltr;
    text-align: start;
  }
  .prv-foot {
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
  <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10.5v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7.4" r="1.2" fill="currentColor"/></symbol>
  <symbol id="i-match" viewBox="0 0 24 24"><path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.3 12.2 2.6 2.6 4.9-5.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path d="M3 11.5 21 3l-6.5 18-3-7.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
</svg>

<main class="prv-wrap">
  <header class="prv-head">
    <div class="prv-head__brand">
      <a class="m-wordmark" href="/preview">
        <svg class="m-wordmark__tick" aria-hidden="true"><use href="#i-mark"/></svg>
        <span class="m-wordmark__ar" lang="ar">مِعيار</span>
        <span class="m-wordmark__en">Meyar</span>
      </a>
      <span class="m-mock" data-t="demo">${c.demo}</span>
    </div>
    <div class="prv-head__controls">
      <a class="prv-nav-link" href="/dashboard" data-t="navDash">${c.navDash}</a>
      <a class="prv-nav-link" href="/compare" data-t="navCmp">${c.navCmp}</a>
      <div class="m-seg prv-seg" role="group" aria-label="Language">
        <button type="button" data-lang-btn="en" aria-pressed="${initialLang === 'en' ? 'true' : 'false'}">EN</button>
        <button type="button" data-lang-btn="ar" aria-pressed="${initialLang === 'ar' ? 'true' : 'false'}">عربي</button>
      </div>
    </div>
  </header>

  <section class="prv-intro">
    <h1 data-t="heading">${c.heading}</h1>
    <p data-t="subtitle">${c.subtitle}</p>
  </section>

  <section aria-label="${c.scenariosLabel}">
    <div class="prv-scenarios" id="scenario-list" role="group" aria-label="${c.scenariosLabel}"></div>
  </section>

  <section class="prv-layout">
    <div class="prv-ehr">
      <header class="prv-ehr__head">
        <span><strong data-t="ordersTitle">${c.ordersTitle}</strong> · <span class="m-data" id="patient-label">demo-001</span></span>
        <span class="m-mock" data-t="demo">${c.demo}</span>
      </header>
      <div class="prv-table-wrap">
        <table class="prv-table">
          <thead>
            <tr>
              <th data-t="thMed">${c.thMed}</th>
              <th data-t="thRole">${c.thRole}</th>
              <th data-t="thStatus">${c.thStatus}</th>
            </tr>
          </thead>
          <tbody id="orders-body"></tbody>
        </table>
      </div>
      <div class="prv-ehr__actions">
        <button class="m-btn" type="button" id="sign-btn" data-t="signBtn">${c.signBtn}</button>
        <span class="prv-action-note" id="action-note" role="status"></span>
      </div>
    </div>

    <aside class="prv-rail" aria-label="Meyar CDS Hooks rail">
      <div class="prv-rail__label">
        <span data-t="railTitle">${c.railTitle}</span>
        <span class="m-data" id="rail-meta">CDS Hooks 2.0.1 · order-sign</span>
      </div>
      <div id="cards-host"></div>
    </aside>
  </section>

  <details class="prv-json">
    <summary data-t="jsonSummary">${c.jsonSummary}</summary>
    <pre id="json-pre">{}</pre>
  </details>

  <footer class="prv-foot">
    <span class="m-proto" data-t="proto">${c.proto}</span>
    <span class="m-data">POST /cds-services/meyar-pgx</span>
  </footer>
</main>

<script type="module">
  import { scaleHTML, combHTML, calibrate, initMotion, setLang } from '/design/meyar.js';

  const COPY = ${copyJson};
  const SCENARIOS = ${scenariosJson};
  let currentLang = ${JSON.stringify(initialLang)};
  let currentScenario = SCENARIOS[0];
  let lastResponse = null;

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function extractQuoteLines(detail) {
    return String(detail || '')
      .split(/\\r?\\n/)
      .filter((line) => line.startsWith('> '))
      .map((line) => line.slice(2));
  }

  function extractCoverageLine(detail) {
    const lines = String(detail || '').split(/\\n\\n/);
    return lines.find((l) => /^Assay covered|^Saudi data:|^No A5 score/.test(l)) || '';
  }

  function extractActingDetail(detail) {
    const m = /\\*\\*Acting like:\\*\\*\\s*([^\\n]+)/.exec(String(detail || ''));
    return m ? m[1].trim() : null;
  }

  function extractNoteDetail(detail) {
    const m = /\\*\\*Note:\\*\\*\\s*([^\\n]+)/.exec(String(detail || ''));
    return m ? m[1].trim() : null;
  }

  function extractAltLine(detail) {
    const m = /\\*\\*Better matched for this patient's genes:\\*\\*\\s*([^\\n]+)/.exec(String(detail || ''));
    return m ? m[1].trim() : null;
  }

  function extractMathLine(detail) {
    const lines = String(detail || '').split(/\\n\\n/);
    return lines.find((l) => /^Activity score:/.test(l)) || '';
  }

  function extractCoverageNumbers(covText, fallbackCov) {
    const m = /Assay covered\\s+(\\d+)\\s+of\\s+(\\d+)\\s+defining positions/i.exec(String(covText || ''));
    if (m) {
      return {
        definingPositionsAssayed: Number(m[1]),
        definingPositionsTotal: Number(m[2]),
      };
    }
    return fallbackCov;
  }

  function formatMathHtml(mathText) {
    const str = String(mathText || '');
    const m = /^(Activity score:\\s*)([0-9.]+\\s*×\\s*[0-9.]+\\s*=\\s*[0-9.]+)(.*)$/i.exec(str);
    if (!m) return esc(str);
    return \`\${esc(m[1])}<span class="m-data">\${esc(m[2])}</span>\${esc(m[3])}\`;
  }

  function renderScenarioButtons() {
    const c = COPY[currentLang];
    const host = document.getElementById('scenario-list');
    host.innerHTML = SCENARIOS.map((sc) => {
      const active = sc.id === currentScenario.id;
      return \`<button type="button" class="prv-sc-btn" data-sc="\${esc(sc.id)}" aria-pressed="\${active ? 'true' : 'false'}">\${esc(c[sc.labelKey])}</button>\`;
    }).join('');
    host.querySelectorAll('[data-sc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const found = SCENARIOS.find((s) => s.id === btn.dataset.sc);
        if (found) loadScenario(found);
      });
    });
  }

  // Arabic labels for the order-table context and status columns (drug names stay as ordered).
  const ORDER_AR = {
    'ACS / PCI': 'متلازمة الشريان التاجي الحادة / قسطرة تاجية',
    'Active medication': 'دواء حالي',
    'New analgesic order': 'طلب مسكّن جديد',
    'Hospital record (CYP2D6 strong inhibitor)': 'سجل المستشفى (مثبط قوي لـ CYP2D6)',
    'Strong CYP2D6 inhibitor': 'مثبط قوي لـ CYP2D6',
    'Existing active order': 'طلب حالي نشط',
    'PPI dose adjustment (no CPIC alternative)': 'تعديل جرعة مثبط مضخة البروتون (لا بديل في CPIC)',
    'Signing now': 'قيد التوقيع',
    'Active': 'نشط',
    'Selected': 'مُختار',
  };
  const trOrder = (s) => (currentLang === 'ar' && ORDER_AR[s]) || s;

  function renderOrdersTable() {
    document.getElementById('patient-label').textContent = currentScenario.patientId;
    const tbody = document.getElementById('orders-body');
    tbody.innerHTML = currentScenario.orders
      .map(
        (o) => \`<tr class="\${o.pending ? 'is-pending' : ''}"><td><strong>\${esc(o.name)}</strong></td><td>\${esc(trOrder(o.context))}</td><td>\${esc(trOrder(o.status))}</td></tr>\`
      )
      .join('');
  }

  async function postAlertAction(card, action, drugName) {
    try {
      await fetch('/alerts/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.uuid,
          patientPseudonym: currentScenario.patientId,
          drug: drugName || currentScenario.drug,
          gene: currentScenario.geneProfile.gene,
          phenotype: currentScenario.geneProfile.effectivePhenotype || currentScenario.geneProfile.phenotype,
          action,
          backwardSweep: /backward sweep/i.test(card.summary),
          phenoconversionApplied: Boolean(currentScenario.geneProfile.phenoconversion?.applied),
        }),
      });
    } catch {
      // Non-blocking audit log action.
    }
  }

  function renderCards(data) {
    const c = COPY[currentLang];
    const host = document.getElementById('cards-host');
    const jsonPre = document.getElementById('json-pre');
    jsonPre.textContent = JSON.stringify(data, null, 2);

    const cards = Array.isArray(data?.cards) ? data.cards : [];
    if (cards.length === 0) {
      host.innerHTML = \`<div class="m-panel" style="padding:var(--m-space-4)"><p>\${esc(c.noCards)}</p></div>\`;
      return;
    }

    const gp = currentScenario.geneProfile;
    const scaleMarkup = scaleHTML(gp, 'clinician');

    host.innerHTML = cards
      .map((card, idx) => {
        const isWarn = card.indicator === 'warning';
        const isSweep = /backward sweep/i.test(card.summary);
        const indClass = isWarn ? 'm-cds__indicator--warning' : 'm-cds__indicator--info';
        const indIcon = isWarn ? '#i-ask' : '#i-info';
        const indWord = isSweep ? \`\${card.indicator} · backward sweep\` : card.indicator;

        const actingText = extractActingDetail(card.detail);
        const noteText = extractNoteDetail(card.detail);
        const quotes = extractQuoteLines(card.detail);
        const covText = extractCoverageLine(card.detail);
        const combMarkup = combHTML(extractCoverageNumbers(covText, gp.coverage));
        const mathText = extractMathLine(card.detail);
        const altLine = extractAltLine(card.detail);
        const tierNum = gp.coverage?.saudiDataTier ?? 1;
        const tierWord = tierNum === 1 ? c.tier1 : tierNum === 0 ? c.tier0 : c.tier2;

        const actingValue = actingText
          ? actingText
          : noteText
            ? noteText
            : \`\${gp.effectivePhenotype || gp.phenotype} \${c.noShift}\`;

        const suggestions = Array.isArray(card.suggestions) ? card.suggestions : [];
        const altSuggestions = suggestions.filter((s) =>
          (s.actions || []).some((a) => a.resource?.resourceType === 'MedicationRequest')
        );
        const pharmSuggestion = suggestions.find((s) => s.label === 'Send to pharmacist');
        const link = Array.isArray(card.links) ? card.links[0] : null;

        return \`<article class="m-cds" data-card-idx="\${idx}">
          <div class="m-cds__bar">
            <span class="m-cds__indicator \${indClass}"><svg aria-hidden="true"><use href="\${indIcon}"/></svg><span>\${esc(indWord)}</span></span>
            <span><span class="m-mock">\${esc(c.demo)}</span></span>
          </div>
          <div class="m-cds__body">
            <p class="m-cds__summary" dir="auto">\${esc(card.summary)}</p>
            <dl class="m-cds__pheno">
              <dt>\${esc(c.dtGenotype)}</dt><dd class="m-data">\${esc(gp.gene)} \${esc(gp.diplotype)}</dd>
              <dt>\${esc(c.dtGenetic)}</dt><dd>\${esc(gp.phenotype)}</dd>
              <dt>\${esc(c.dtActing)}</dt><dd>\${esc(actingValue)}</dd>
            </dl>
            <div class="prv-mini">\${scaleMarkup}</div>
            \${mathText ? \`<p class="m-coverage__line" dir="auto">\${formatMathHtml(mathText)}</p>\` : ''}
            \${quotes.length > 0 ? \`<blockquote class="m-cds__rec" dir="ltr">\${esc(quotes[0])}\${link ? \`<cite>\${esc(link.label)}</cite>\` : ''}</blockquote>\` : ''}
            \${altLine && altSuggestions.length === 0 ? \`<p style="font-size:var(--m-size-sm)"><strong>\${esc(c.betterPrefix)}</strong><span dir="auto">\${esc(altLine)}</span></p>\` : ''}
            \${covText || combMarkup ? \`<div class="m-coverage">\${combMarkup}<p class="m-coverage__line"><span dir="auto">\${esc(covText)}</span> <span class="m-tier"><span class="m-tier__n">T\${tierNum}</span> <span>\${esc(tierWord)}</span></span></p></div>\` : ''}
            \${suggestions.length > 0 ? \`<div class="m-cds__suggest">
              \${altSuggestions.map((s, sIdx) => {
                const drugLabel = s.actions?.[0]?.resource?.medicationCodeableConcept?.text || s.label;
                return \`<button class="m-btn \${sIdx > 0 ? 'm-btn--secondary' : ''}" type="button" data-alt-drug="\${esc(drugLabel)}" data-card-idx="\${idx}"><svg aria-hidden="true"><use href="#i-match"/></svg><span>\${esc(s.label)}</span></button>\`;
              }).join('')}
              \${pharmSuggestion ? \`<button class="m-btn m-btn--quiet" type="button" data-pharm="1" data-card-idx="\${idx}"><svg aria-hidden="true"><use href="#i-send"/></svg><span>\${esc(c.sendPharm)}</span></button>\` : ''}
            </div>\` : ''}
          </div>
          <div class="m-cds__foot">
            <span>\${esc(c.footNote)}</span>
            \${link ? \`<a href="\${esc(link.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--m-brand)">\${esc(c.footLink)}</a>\` : ''}
          </div>
        </article>\`;
      })
      .join('');

    calibrate(host);

    host.querySelectorAll('[data-alt-drug]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const drugName = btn.dataset.altDrug;
        const card = cards[Number(btn.dataset.cardIdx)];
        document.getElementById('action-note').textContent = \`\${c.actionAccepted} \${drugName}.\`;
        if (currentScenario.orders[0]) {
          currentScenario.orders[0].name = drugName;
          currentScenario.orders[0].status = 'Selected';
          renderOrdersTable();
        }
        postAlertAction(card, 'accepted', drugName);
      });
    });

    host.querySelectorAll('[data-pharm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = cards[Number(btn.dataset.cardIdx)];
        document.getElementById('action-note').textContent = c.actionPharm;
        postAlertAction(card, 'pharmacist', currentScenario.drug);
      });
    });
  }

  async function loadScenario(scenario) {
    currentScenario = scenario;
    document.getElementById('action-note').textContent = '';
    renderScenarioButtons();
    renderOrdersTable();

    const c = COPY[currentLang];
    document.getElementById('cards-host').innerHTML =
      \`<div class="m-panel" style="padding:var(--m-space-4)"><p>\${esc(c.loading)}</p></div>\`;

    const resp = await fetch('/cds-services/meyar-pgx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario.hookBody),
    });
    const sweepHeader = resp.headers.get('x-meyar-backward-sweep');
    document.getElementById('rail-meta').textContent =
      \`CDS Hooks 2.0.1 · backwardSweep=\${sweepHeader || 'false'}\`;
    lastResponse = await resp.json();
    renderCards(lastResponse);
  }

  function applyLang(lang) {
    currentLang = lang === 'ar' ? 'ar' : 'en';
    const c = COPY[currentLang];
    setLang(currentLang);
    document.title = c.title;
    document.querySelectorAll('[data-t]').forEach((el) => {
      const key = el.dataset.t;
      if (c[key] !== undefined) el.textContent = c[key];
    });
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.langBtn === currentLang ? 'true' : 'false');
    });
    renderScenarioButtons();
    if (lastResponse) renderCards(lastResponse);
  }

  initMotion();
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.dataset.langBtn));
  });
  document.getElementById('sign-btn').addEventListener('click', () => loadScenario(currentScenario));
  loadScenario(currentScenario);
</script>
</body>
</html>`;
}
