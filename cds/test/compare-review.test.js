// REVIEW (final pass): the B5 comparison card must show what the live service would show — the CPIC
// recommendation verbatim from tables/cpic_recommendations.json, alternatives only for the indication whose
// row names them, and colours only from design tokens.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCompareHtml } from '../lib/compare.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const table = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'tables', 'cpic_recommendations.json'), 'utf8'));
const row = table.rows.find((r) => r.drug === 'clopidogrel' && r.gene === 'CYP2C19' && r.phenotype === 'Poor Metabolizer' && r.population === 'CVI ACS PCI');

test('the table has the clopidogrel ACS/PCI poor-metaboliser row the card quotes', () => {
  assert.ok(row, 'row exists');
  assert.ok(row.alternatives.some((a) => a.drug === 'prasugrel'));
});

for (const lang of ['en', 'ar']) {
  test(`compare card quotes the CPIC row verbatim and names its indication (${lang})`, () => {
    const html = renderCompareHtml({ lang });
    assert.ok(html.includes(row.recommendation), 'verbatim recommendation');
    assert.match(html, lang === 'en' ? /ACS\/PCI/ : /ACS\/PCI/, 'indication shown, since prasugrel applies only to it');
  });
}

test('compare page uses design tokens, not hard-coded colours', () => {
  const src = fs.readFileSync(path.join(here, '..', 'lib', 'compare.js'), 'utf8');
  assert.deepEqual(src.match(/#[0-9a-fA-F]{3,8}\b(?![\w-])|rgb\(/g) || [], []);
});
