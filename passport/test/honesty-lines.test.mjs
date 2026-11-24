// REVIEW (final pass), cross-cutting check 10: both mandatory lines on every Passport screen, in both languages.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderApp } from '../src/render.js';
import { renderScanApp } from '../src/scan-render.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const demo001 = JSON.parse(fs.readFileSync(path.join(here, '..', 'public', 'demo', 'demo-001.contract.json'), 'utf8'));

const EN_PROTO = 'Research prototype — not for clinical use.';
const EN_DATA = 'Runs on synthetic and GeT-RM reference data; no patient data was used.';

test('a not-assessed gene is never labelled as a VCF call (A8)', async () => {
  const { renderPharmacistView } = await import('../src/render.js');
  const { COPY } = await import('../src/i18n.js');
  const root = { innerHTML: '' };
  renderApp(root, { lang: 'en', elder: false, tab: 'genes', contract: demo001, effectiveContract: demo001, localMeds: [] });
  const pharm = renderPharmacistView(demo001, 'en', COPY.en, {});
  for (const html of [root.innerHTML, pharm]) assert.doesNotMatch(html, /CYP2D6\s*·\s*VCF/);
});

for (const lang of ['en', 'ar']) {
  test(`passport shows both honesty lines (${lang})`, () => {
    for (const tab of ['genes', 'meds', 'otc', 'doctor']) {
      const root = { innerHTML: '' };
      renderApp(root, { lang, elder: false, tab, contract: demo001, effectiveContract: demo001, localMeds: [] });
      if (lang === 'en') {
        assert.ok(root.innerHTML.includes(EN_PROTO), `${tab}: prototype line`);
        assert.ok(root.innerHTML.includes(EN_DATA), `${tab}: data line`);
      } else {
        assert.match(root.innerHTML, /data-testid="honesty-data"/, `${tab}: data line`);
      }
    }
  });

  test(`scan reader shows both honesty lines (${lang})`, () => {
    const root = { innerHTML: '' };
    renderScanApp(root, { lang, elder: false });
    if (lang === 'en') {
      assert.ok(root.innerHTML.includes(EN_PROTO));
      assert.ok(root.innerHTML.includes(EN_DATA));
    } else {
      assert.match(root.innerHTML, /data-testid="honesty-data"/);
    }
  });
}

test('the QR card states the PIN limit honestly (AGENTS.md section 8)', () => {
  const root = { innerHTML: '' };
  renderApp(root, { lang: 'en', elder: false, tab: 'doctor', contract: demo001, effectiveContract: demo001, localMeds: [] });
  const m = root.innerHTML.match(/data-testid="qr-brute-honesty">([^<]*)</);
  assert.ok(m, 'honesty paragraph present');
  assert.match(m[1], /stops casual scanning only/);
  assert.match(m[1], /brute-forced offline/);
});
