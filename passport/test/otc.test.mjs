import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { lookupOtcProduct, matchOtcProduct, normalizeSearchText } from '../src/otc.js';
import { renderOtcResultHtml } from '../src/render.js';
import { COPY } from '../src/i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo001Path = path.resolve(__dirname, '../public/demo/demo-001.contract.json');
const demo002Path = path.resolve(__dirname, '../public/demo/demo-002.contract.json');
const demo006Path = path.resolve(__dirname, '../public/demo/demo-006.contract.json');

test('C6: demo-001 (CYP2C19 PM) typing omeprazole returns Ask the pharmacist', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  for (const q of ['omeprazole', 'Losec', 'أوميبرازول', 'اوميبرازول', 'omeprazol']) {
    const res = lookupOtcProduct(q, demo001);
    assert.equal(res.status, 'ask', `expected ask for "${q}"`);
    assert.equal(res.product.id, 'omeprazole');
  }

  const enHtml = renderOtcResultHtml('omeprazole', demo001, 'en');
  assert.match(enHtml, /m-answer--ask/);
  assert.match(enHtml, /Ask the pharmacist before buying/);
  assert.doesNotMatch(enHtml, /\bsafe\b/i);

  const arHtml = renderOtcResultHtml('أوميبرازول', demo001, 'ar');
  assert.match(arHtml, /m-answer--ask/);
  assert.match(arHtml, /اسأل الصيدلي قبل الشراء/);
});

test('C6: demo-001 typing paracetamol returns No gene guidance with normal label advice', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  for (const q of ['paracetamol', 'Panadol', 'بنادول', 'باراسيتامول', 'فيفادول', 'acetaminophen']) {
    const res = lookupOtcProduct(q, demo001);
    assert.equal(res.status, 'none', `expected none for "${q}"`);
  }

  const enHtml = renderOtcResultHtml('paracetamol', demo001, 'en');
  assert.match(enHtml, /m-answer--none/);
  assert.match(enHtml, /No gene guidance for your profile/);
  assert.match(enHtml, /Normal label advice still applies/);
  assert.doesNotMatch(enHtml, /\bsafe\b/i);

  const arHtml = renderOtcResultHtml('باراسيتامول', demo001, 'ar');
  assert.match(arHtml, /m-answer--none/);
  assert.match(arHtml, /لا توجد توصية جينية لملفك/);
  assert.match(arHtml, /تعليمات العلبة المعتادة ما زالت تنطبق/);
});

test('C6 + A8: demo-001 (CYP2D6 not-assessed) checking codeine product returns ask without reassurance', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const res = lookupOtcProduct('Solpadeine', demo001);
  assert.equal(res.status, 'ask');
  assert.equal(res.details.some((d) => d.reasonType === 'not-assessed'), true);

  const enHtml = renderOtcResultHtml('Solpadeine', demo001, 'en');
  assert.match(enHtml, /m-answer--ask/);
  assert.match(enHtml, /copy number not assessed by this test/i);
});

test('C6 + A7: demo-002 (CYP2D6 phenoconverted to PM via paroxetine) checking codeine product returns stop and shows both phenotypes', async () => {
  const demo002 = JSON.parse(await fs.readFile(demo002Path, 'utf8'));
  const res = lookupOtcProduct('سولبادين', demo002);
  assert.equal(res.status, 'stop');

  const enHtml = renderOtcResultHtml('Solpadeine', demo002, 'en');
  assert.match(enHtml, /m-answer--stop/);
  assert.match(enHtml, /Do not take without your doctor/);
  assert.match(enHtml, /Genetic result:.*Acting like:/);
  assert.match(enHtml, /m-better/);

  const arHtml = renderOtcResultHtml('سولبادين', demo002, 'ar');
  assert.match(arHtml, /m-answer--stop/);
  assert.match(arHtml, /لا تتناوله دون طبيبك/);
  assert.match(arHtml, /النتيجة الوراثية:.*يعمل الآن مثل:/);
});

test('C6 + A7: demo-006 (CYP2D6 UM -> NM via duloxetine) uses effectivePhenotype and still displays genetic result', async () => {
  const demo006 = JSON.parse(await fs.readFile(demo006Path, 'utf8'));
  const res = lookupOtcProduct('codeine', demo006);
  assert.equal(res.status, 'none');
  const enHtml = renderOtcResultHtml('codeine', demo006, 'en');
  assert.match(enHtml, /Genetic result:.*Very fast.*Acting like:.*Normal/s);
});

test('C6: unknown product returns Not in our list — ask the pharmacist', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  for (const q of ['unknown-xyz-drug', 'دواء غير معروف']) {
    const res = lookupOtcProduct(q, demo001);
    assert.equal(res.status, 'unknown');
  }

  const enHtml = renderOtcResultHtml('unknown-xyz-drug', demo001, 'en');
  assert.match(enHtml, /m-answer--ask/);
  assert.match(enHtml, /Not in our list — ask the pharmacist/);

  const arHtml = renderOtcResultHtml('دواء غير معروف', demo001, 'ar');
  assert.match(arHtml, /غير موجود في قائمتنا — اسأل الصيدلي/);
});

test('C6: fuzzy matcher normalizes Arabic variants and minor English/Arabic typos', () => {
  assert.equal(normalizeSearchText('الأوميبرازول'), 'اوميبرازول');
  assert.equal(matchOtcProduct('ibuprufen')?.product.id, 'ibuprofen');
  assert.equal(matchOtcProduct('paracetmol')?.product.id, 'paracetamol');
  assert.equal(matchOtcProduct('بندول')?.product.id, 'panadol');
  assert.equal(matchOtcProduct('ايبوبروفين')?.product.id, 'ibuprofen');
  assert.equal(matchOtcProduct('zzz999qqq'), null);
});

test('C6: patient OTC copy never uses the word safe', () => {
  for (const lang of ['en', 'ar']) {
    const t = COPY[lang];
    const strings = [
      t.otcTitle,
      t.otcSub,
      t.otcNoGuidelineBody,
      t.otcNotFoundTitle,
      t.statusNone,
      t.statusAsk,
      t.statusStop,
    ].join(' ');
    assert.doesNotMatch(strings, /\bsafe\b/i);
    assert.doesNotMatch(strings, /آمن/);
  }
});

test('C6 C9-hook: listed strong/moderate inhibitor against current medicine flags ask', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const res = lookupOtcProduct('paroxetine', demo001, {
    products: [{
      id: 'paroxetine',
      brandEn: 'Paroxetine',
      brandAr: 'باروكسيتين',
      aliasesEn: ['paroxetine'],
      aliasesAr: ['باروكسيتين'],
      ingredients: ['paroxetine'],
      mock: true,
    }],
    currentMedications: [{ name: 'codeine', source: 'patient-entered', mock: true }],
  });
  assert.equal(res.status, 'ask');
  assert.equal(res.inhibitorHits.length, 1);
  assert.equal(res.inhibitorHits[0].enzyme, 'CYP2D6');
});
