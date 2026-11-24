import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodeQrEnvelope, decodeQrEnvelope } from '../src/qr.js';
import { buildCdsCardsFromPayload } from '../src/scan-lookup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo001Path = path.resolve(__dirname, '../public/demo/demo-001.contract.json');
const demo006Path = path.resolve(__dirname, '../public/demo/demo-006.contract.json');
const cpicPath = path.resolve(__dirname, '../../tables/cpic_recommendations.json');
const freqPath = path.resolve(__dirname, '../../tables/saudi_frequencies.json');

test('C3: demo-001 decrypts with PIN and builds clinician .m-cds cards with CYP2D6 not-assessed safety', async () => {
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const cpic = JSON.parse(await fs.readFile(cpicPath, 'utf8'));
  const freq = JSON.parse(await fs.readFile(freqPath, 'utf8'));

  const encoded = await encodeQrEnvelope(contract, {
    pin: '123456',
    getDrugsFn: (g) => {
      if (g.gene === 'CYP2C19' && g.phenotype === 'Poor Metabolizer') {
        return [{ drug: 'clopidogrel', rxnorm: '32968', status: 'stop', alternatives: ['prasugrel', 'ticagrelor'] }];
      }
      return [];
    },
  });

  const decoded = await decodeQrEnvelope(encoded.qrText, { pin: '123456' });
  const cards = buildCdsCardsFromPayload(decoded, {
    cpicRows: cpic.rows,
    freqRows: freq.rows,
  });

  assert.equal(cards.length, 2);

  const cyp2c19 = cards.find((c) => c.gene === 'CYP2C19');
  assert.ok(cyp2c19);
  assert.equal(cyp2c19.indicator, 'warning');
  assert.equal(cyp2c19.drugs[0].drug, 'clopidogrel');
  assert.ok(cyp2c19.drugs[0].alternatives.includes('prasugrel'));
  assert.ok(cyp2c19.drugs[0].alternatives.includes('ticagrelor'));

  const cyp2d6 = cards.find((c) => c.gene === 'CYP2D6');
  assert.ok(cyp2d6);
  assert.equal(cyp2d6.notAssessed, true);
  assert.equal(cyp2d6.drugs.length, 0);
  assert.match(cyp2d6.summary, /not assessed/i);
});

test('C3: demo-006 preserves A7 phenoconversion dual-phenotype display after decrypt', async () => {
  const contract = JSON.parse(await fs.readFile(demo006Path, 'utf8'));
  const cpic = JSON.parse(await fs.readFile(cpicPath, 'utf8'));
  const freq = JSON.parse(await fs.readFile(freqPath, 'utf8'));

  const encoded = await encodeQrEnvelope(contract, { pin: '654321' });
  const decoded = await decodeQrEnvelope(encoded.qrText, { pin: '654321' });
  const cards = buildCdsCardsFromPayload(decoded, {
    cpicRows: cpic.rows,
    freqRows: freq.rows,
  });

  const cyp2d6 = cards.find((c) => c.gene === 'CYP2D6');
  assert.ok(cyp2d6);
  assert.equal(cyp2d6.phenoconverted, true);
  assert.equal(cyp2d6.geneticPhenotype, 'Ultrarapid Metabolizer');
  assert.equal(cyp2d6.effectivePhenotype, 'Normal Metabolizer');
  assert.deepEqual(cyp2d6.cause, ['duloxetine']);
});

test('REVIEW: a non-germline card opened with the right PIN is reported as such, not as a wrong PIN', async () => {
  const { openScannedCard } = await import('../src/scan-lookup.js');
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const cpic = JSON.parse(await fs.readFile(cpicPath, 'utf8'));
  const tables = { cpicRows: cpic.rows, freqRows: [] };

  const good = await encodeQrEnvelope(contract, { pin: '123456' });
  assert.equal((await openScannedCard(good.qrText, '000000', tables)).error, 'pin');
  const ok = await openScannedCard(good.qrText, '123456', tables);
  assert.equal(ok.error, undefined);
  assert.ok(ok.cards.length > 0);

  const somatic = await encodeQrEnvelope({ ...contract, sampleOrigin: 'somatic' }, { pin: '123456' });
  assert.equal((await openScannedCard(somatic.qrText, '123456', tables)).error, 'not-germline');
});

test('REVIEW code review #4: a decrypted but malformed card is reported as invalid, never thrown', async () => {
  const { openScannedCard } = await import('../src/scan-lookup.js');
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const bad = await encodeQrEnvelope({ ...contract, genes: [{ gene: 'CYP2D6', diplotype: null, phenotype: 42 }] }, { pin: '123456' });
  const r = await openScannedCard(bad.qrText, '123456', { cpicRows: null, freqRows: null });
  assert.equal(r.error, 'invalid');
});
