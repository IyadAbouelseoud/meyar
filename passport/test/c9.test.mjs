import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyPhenoconversion,
  canonicalDrugName,
  computeCyp2d6ActivityScore,
  activityScoreToCyp2d6Phenotype,
} from '../src/phenoconvert.js';
import { getDrugsForGene, isMedCausingShift } from '../src/lookup.js';
import { lookupOtcProduct } from '../src/otc.js';
import { renderApp, renderOtcResultHtml, renderPharmacistView } from '../src/render.js';
import { encodeQrEnvelope, decodeQrEnvelope, renderQrSvg } from '../src/qr.js';
import { COPY } from '../src/i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo001Path = path.resolve(__dirname, '../public/demo/demo-001.contract.json');
const demo002Path = path.resolve(__dirname, '../public/demo/demo-002.contract.json');
const demo006Path = path.resolve(__dirname, '../public/demo/demo-006.contract.json');

test('C9: demo-002 Passport gene card shows act like: slow, because of paroxetine and better match', async () => {
  const demo002 = JSON.parse(await fs.readFile(demo002Path, 'utf8'));
  const effective = applyPhenoconversion(demo002, []);
  const rootEn = { innerHTML: '' };
  renderApp(rootEn, { lang: 'en', elder: false, tab: 'genes', contract: demo002, effectiveContract: effective });
  assert.match(rootEn.innerHTML, /Your genes: normal · Right now you act like: slow, because of <b>paroxetine<\/b>/);
  assert.match(rootEn.innerHTML, /Tell your doctor before starting .*codeine/);
  assert.match(rootEn.innerHTML, /m-better/);
  assert.match(rootEn.innerHTML, /non-tramadol opioid<\/strong> — ask your doctor/);

  const rootAr = { innerHTML: '' };
  renderApp(rootAr, { lang: 'ar', elder: false, tab: 'genes', contract: demo002, effectiveContract: effective });
  assert.match(rootAr.innerHTML, /جيناتك: طبيعي · تعمل الآن مثل: بطيء، بسبب <b>باروكسيتين<\/b>/);
  assert.match(rootAr.innerHTML, /أخبر طبيبك قبل البدء بـ .*كودايين/);
  assert.match(rootAr.innerHTML, /m-better/);
});

test('C9: adding paroxetine (EN or AR) as patient-entered for CYP2D6 normal patient shifts gene card offline', async () => {
  const baseNormal = {
    patientId: 'demo-normal-2d6',
    sampleOrigin: 'germline',
    currentMedications: [],
    genes: [
      {
        gene: 'CYP2D6',
        diplotype: '*1/*1',
        phenotype: 'Normal Metabolizer',
        candidates: ['*1/*1'],
        coverage: {
          definingPositionsAssayed: 0,
          definingPositionsTotal: 0,
          untestedLocalAlleles: [],
          uninformativeNormalRisk: null,
          saudiDataTier: 0,
        },
        guidelineVersion: 'CPIC 2021',
        callability: { method: 'outside-call', svAssessed: true, source: 'Mock caller' },
      },
    ],
  };

  // Before adding paroxetine: normal metabolizer, no shift
  const before = applyPhenoconversion(baseNormal, []);
  assert.equal(before.genes[0].phenotype, 'Normal Metabolizer');
  assert.equal(before.genes[0].effectivePhenotype, 'Normal Metabolizer');
  assert.equal(before.genes[0].phenoconversion.applied, false);
  assert.equal(lookupOtcProduct('Solpadeine', before).status, 'none');

  // After adding Arabic "باروكسيتين" as patient-entered: shifts to Poor Metabolizer offline
  const after = applyPhenoconversion(baseNormal, [
    { name: 'باروكسيتين', source: 'patient-entered', mock: true },
  ]);
  assert.equal(after.genes[0].phenotype, 'Normal Metabolizer'); // never overwritten
  assert.equal(after.genes[0].effectivePhenotype, 'Poor Metabolizer');
  assert.equal(after.genes[0].phenoconversion.applied, true);
  assert.equal(after.genes[0].phenoconversion.geneticActivityScore, 2.0);
  assert.equal(after.genes[0].phenoconversion.adjustedActivityScore, 0.0);
  assert.equal(after.currentMedications[0].source, 'patient-entered');
  assert.equal(after.currentMedications[0].mock, true);
  assert.equal(isMedCausingShift('باروكسيتين', after.genes), true);

  // Gene card HTML reflects shift immediately
  const root = { innerHTML: '' };
  renderApp(root, { lang: 'en', elder: false, tab: 'genes', contract: baseNormal, effectiveContract: after });
  assert.match(root.innerHTML, /act like: slow, because of <b>paroxetine<\/b>/);
  assert.match(root.innerHTML, /m-scale is-converted/);

  // OTC check for Solpadeine now returns stop ("Do not take without your doctor"), never safe
  const otcHtml = renderOtcResultHtml('Solpadeine', after, 'en');
  assert.match(otcHtml, /m-answer--stop/);
  assert.match(otcHtml, /Do not take without your doctor/);
  assert.doesNotMatch(otcHtml, /\bsafe\b/i);
});

test('C9: A8 not-assessed CYP2D6 and non-CYP2D6 CYP2C19 follow AGENTS.md rules', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const shifted = applyPhenoconversion(demo001, [
    { name: 'paroxetine', source: 'patient-entered', mock: true },
    { name: 'fluvoxamine', source: 'patient-entered', mock: true },
  ]);

  // CYP2D6 is not-assessed -> never phenoconverted or guessed
  const cyp2d6 = shifted.genes.find((g) => g.gene === 'CYP2D6');
  assert.equal(cyp2d6.phenotype, null);
  assert.equal(cyp2d6.effectivePhenotype, undefined);
  assert.equal(cyp2d6.phenoconversion.applied, false);

  // CYP2C19 + fluvoxamine -> flagged without computing a score or altering phenotype
  const cyp2c19 = shifted.genes.find((g) => g.gene === 'CYP2C19');
  assert.equal(cyp2c19.phenotype, 'Poor Metabolizer');
  assert.equal(cyp2c19.effectivePhenotype, 'Poor Metabolizer');
  assert.equal(cyp2c19.phenoconversion.applied, true);
  assert.equal(cyp2c19.phenoconversion.geneticActivityScore, null);
  assert.equal(cyp2c19.phenoconversion.adjustedActivityScore, null);

  const root = { innerHTML: '' };
  renderApp(root, { lang: 'en', elder: false, tab: 'genes', contract: demo001, effectiveContract: shifted });
  assert.match(root.innerHTML, /May be affected by <b>fluvoxamine<\/b>/);
});

test('C9: OTC check renders inhibitor hit explanation when queried drug inhibits current medicine enzyme', async () => {
  const demo002 = JSON.parse(await fs.readFile(demo002Path, 'utf8'));
  const contractWithCodeine = {
    ...demo002,
    currentMedications: [{ name: 'كودايين', source: 'patient-entered', mock: true }],
  };
  const customProducts = [{
    id: 'paroxetine',
    brandEn: 'Paroxetine',
    brandAr: 'باروكسيتين',
    aliasesEn: ['paroxetine'],
    aliasesAr: ['باروكسيتين'],
    ingredients: ['paroxetine'],
    mock: true,
  }];

  const res = lookupOtcProduct('paroxetine', contractWithCodeine, { products: customProducts });
  assert.equal(res.status, 'ask');
  assert.equal(res.inhibitorHits.length, 1);
  assert.equal(res.inhibitorHits[0].enzyme, 'CYP2D6');
  assert.deepEqual(res.inhibitorHits[0].affectedMedications, ['كودايين']);

  const enHtml = renderOtcResultHtml('paroxetine', contractWithCodeine, 'en', { products: customProducts });
  assert.match(enHtml, /m-answer--ask/);
  assert.match(enHtml, /Ask the pharmacist before buying/);
  assert.match(enHtml, /strong.*CYP2D6.*inhibitor/i);
  assert.doesNotMatch(enHtml, /\bsafe\b/i);

  const arHtml = renderOtcResultHtml('باروكسيتين', contractWithCodeine, 'ar', { products: customProducts });
  assert.match(arHtml, /m-answer--ask/);
  assert.match(arHtml, /اسأل الصيدلي قبل الشراء/);
  assert.match(arHtml, /مثبّط/);

  assert.equal(canonicalDrugName('كودايين'), 'codeine');
  assert.equal(computeCyp2d6ActivityScore('*1/*41'), 1.25);
  assert.equal(activityScoreToCyp2d6Phenotype(1.25), 'Normal Metabolizer');
  assert.equal(activityScoreToCyp2d6Phenotype(0.625), 'Intermediate Metabolizer');
});

test('C9: Pharmacist view renders dual-marker Meyar Scale, current meds, better matches, and QR', async () => {
  const demo006 = JSON.parse(await fs.readFile(demo006Path, 'utf8'));
  const enc = await encodeQrEnvelope(demo006, { pin: '482916', getDrugsFn: getDrugsForGene });
  const qr = { ...enc, ...renderQrSvg(enc.qrText) };

  for (const lang of ['en', 'ar']) {
    const html = renderPharmacistView(demo006, lang, COPY[lang], { qrResult: qr });
    assert.match(html, /data-testid="pharmacist-view"/);
    assert.match(html, /m-scale is-converted/);
    assert.match(html, /data-testid="pharmacist-qr-box"/);
    assert.match(html, /duloxetine|دولوكسيتين/);
    assert.doesNotMatch(html, /\bsafe\b/i);
    assert.doesNotMatch(html, /آمن/);
  }
});

test('C9: QR payload with currentMedications and effectivePhenotype stays compact under EC M limit', async () => {
  const demo006 = JSON.parse(await fs.readFile(demo006Path, 'utf8'));
  const withExtra = applyPhenoconversion(demo006, [
    { name: 'paroxetine', source: 'patient-entered', mock: true },
  ]);
  const enc = await encodeQrEnvelope(withExtra, { pin: '482916', getDrugsFn: getDrugsForGene });
  const svg = renderQrSvg(enc.qrText);

  assert.equal(enc.payload.g.find((g) => g.gene === 'CYP2D6')?.eff, 'Poor Metabolizer');
  assert.ok(enc.payload.meds.some((m) => m.n === 'paroxetine'));
  // C2/C8 compact size budget: encrypted envelope well below QR EC-M capacity (2,331 B) and <= 1,200 B
  assert.ok(enc.envelopeBytes < 1200, `Expected compact envelope < 1200 B, got ${enc.envelopeBytes}`);
  assert.ok(svg.modules <= 105, `Expected scannable QR modules <= 105, got ${svg.modules}`);
  console.log(`demo-006+paroxetine QR metrics: raw=${enc.rawBytes}B, compressed=${enc.compressedBytes}B, envelope=${enc.envelopeBytes}B, modules=${svg.modules}, EC=${enc.errorCorrectionLevel}`);

  const decoded = await decodeQrEnvelope(enc.qrText, { pin: '482916' });
  assert.deepEqual(decoded, enc.payload);
});
