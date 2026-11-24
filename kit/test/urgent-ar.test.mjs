// DEMO-FIX-1: the kit's /urgent page renders Arabic CDS cards with a copy of
// renderCardAr from cds/lib/preview.js (the kit cannot import cds/). Keep them identical.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');

function extract(raw) {
  const src = raw.replace(/\r\n/g, '\n');
  const start = src.indexOf('function renderCardAr(');
  assert.ok(start >= 0, 'renderCardAr present');
  const end = src.indexOf('\n}\n', start);
  return src.slice(start, end + 2).replace(/\r\n/g, '\n');
}

test('urgent.js renders Arabic cards with the same renderCardAr as /preview', () => {
  const urgent = fs.readFileSync(path.join(repo, 'kit', 'web', 'urgent.js'), 'utf8');
  const preview = fs.readFileSync(path.join(repo, 'cds', 'lib', 'preview.js'), 'utf8');
  assert.equal(extract(urgent), extract(preview));
});

test('urgent.js reads Arabic vocabulary from the passport i18n file, read-only', () => {
  const urgent = fs.readFileSync(path.join(repo, 'kit', 'web', 'urgent.js'), 'utf8');
  assert.match(urgent, /fetch\('\/passport-src\/i18n\/ar\.json'\)/);
  assert.match(urgent, /lang === 'ar' && AR && c\.extension && c\.extension\.meyar/);
});
