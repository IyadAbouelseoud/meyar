import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyPhenoconversion } from '../src/phenoconvert.js';
import { getMedGeneEffects } from '../src/lookup.js';
import { MAX_CURRENT_MEDS } from '../src/qr.js';
import { COPY } from '../src/i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = async (id) => JSON.parse(await fs.readFile(path.resolve(__dirname, `../public/demo/${id}.contract.json`), 'utf8'));

test('review: fluoxetine shifts CYP2D6 (scored) but only flags CYP2C19 (no score)', async () => {
  const c = applyPhenoconversion(await load('demo-006'), [{ name: 'fluoxetine' }]);
  const fx = getMedGeneEffects('fluoxetine', c.genes);
  assert.deepEqual(fx.scored, ['CYP2D6']);
  assert.deepEqual(fx.flagged, ['CYP2C19']);
});

test('review: browser phenoconversion refuses non-germline input like the engine (A6)', async () => {
  const c = { ...(await load('demo-002')), sampleOrigin: 'somatic' };
  assert.throws(() => applyPhenoconversion(c, []), /non-germline/);
});

test('review: medicine cap and its copy exist in both languages', () => {
  assert.ok(Number.isInteger(MAX_CURRENT_MEDS) && MAX_CURRENT_MEDS > 0);
  for (const lang of ['ar', 'en']) {
    for (const k of ['mayAffectGene', 'mayAffectPrefix', 'medsListFull', 'profileNotGermline']) {
      assert.ok(COPY[lang][k], `${lang}.${k}`);
    }
    assert.doesNotMatch(COPY[lang].medsListFull, /\bsafe\b|آمن/i);
  }
});
