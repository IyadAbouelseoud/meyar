import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COPY } from '../src/i18n.js';
import { encodeQrEnvelope, renderQrSvg } from '../src/qr.js';
import {
  buildMrzLine,
  renderId1CardHtml,
  renderA6FoldoutHtml,
  buildFoldoutEntries,
} from '../src/print.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo001Path = path.resolve(__dirname, '../public/demo/demo-001.contract.json');
const demo002Path = path.resolve(__dirname, '../public/demo/demo-002.contract.json');
const demo006Path = path.resolve(__dirname, '../public/demo/demo-006.contract.json');
const appCssPath = path.resolve(__dirname, '../src/app.css');

test('C7: ID-1 card carries wordmark, PIN prompt, prototype notice, QR, MRZ (version+date only), and Qatt band — zero name/ID/results', async () => {
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const encoded = await encodeQrEnvelope(contract, { pin: '482910' });
  const qr = renderQrSvg(encoded.qrText);
  const fixedDate = new Date(2026, 10, 23);

  for (const lang of ['ar', 'en']) {
    const html = renderId1CardHtml({
      qrSvg: qr.svg,
      lang,
      t: COPY[lang],
      date: fixedDate,
    });
    assert.match(html, /class="m-id1"/);
    assert.match(html, /class="m-id1__qr"/);
    assert.match(html, /<svg /);
    assert.match(html, /class="m-qatt"/);
    assert.match(html, /MEYAR&lt;&lt;PGX&lt;ENV&lt;V1&lt;&lt;ISSUED&lt;20261123&lt;&lt;&lt;&lt;&lt;&lt;&lt;/);
    assert.match(html, /Ask the holder for the PIN/);
    assert.match(html, /اطلب الرمز من صاحب البطاقة/);
    assert.match(html, /Research prototype/);
    assert.match(html, /نموذج بحثي/);

    // Must never carry patient ID, gene symbol, diplotype, or phenotype on card face
    assert.equal(html.includes('demo-001'), false);
    assert.equal(html.includes('CYP2C19'), false);
    assert.equal(html.includes('CYP2D6'), false);
    assert.equal(html.includes('Poor Metabolizer'), false);
    assert.equal(html.includes('*2/*2'), false);
  }
});

test('C7: MRZ strip encodes only envelope version V1 and issue date YYYYMMDD', () => {
  const line = buildMrzLine(new Date(2026, 10, 23));
  assert.equal(line, 'MEYAR<<PGX<ENV<V1<<ISSUED<20261123<<<<<<<');
});

test('C7: A6 elder fold-out renders C4 plain-Arabic & English lines, A8 not-assessed honesty, A7 phenoconversion, and never says safe', async () => {
  const demo001 = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const demo002 = JSON.parse(await fs.readFile(demo002Path, 'utf8'));
  const demo006 = JSON.parse(await fs.readFile(demo006Path, 'utf8'));

  const html001Ar = renderA6FoldoutHtml({ contract: demo001, lang: 'ar', t: COPY.ar });
  assert.match(html001Ar, /class="m-a6"/);
  assert.match(html001Ar, /CYP2C19/);
  assert.match(html001Ar, /كلوبيدوجريل/);
  assert.match(html001Ar, /براسوغريل/);
  assert.match(html001Ar, /CYP2D6/);
  assert.match(html001Ar, /لم يُفحص هذا الجين بعد/);
  assert.equal(/\bsafe\b/i.test(html001Ar), false);
  assert.equal(html001Ar.includes('آمن'), false);

  const html002Ar = renderA6FoldoutHtml({ contract: demo002, lang: 'ar', t: COPY.ar });
  assert.match(html002Ar, /باروكسيتين/);
  assert.match(html002Ar, /كودايين/);

  const entries006 = buildFoldoutEntries(demo006, 'en', COPY.en);
  const cyp2d6 = entries006.find((e) => e.gene === 'CYP2D6');
  assert.ok(cyp2d6);
  assert.match(cyp2d6.phenoconversionLine, /Very fast/);
  assert.match(cyp2d6.phenoconversionLine, /Normal/);
  assert.match(cyp2d6.phenoconversionLine, /duloxetine/);
});

test('C7: passport/src/app.css defines exact @page mm sizes and uses zero hard-coded hex/rgb or font families', async () => {
  const css = await fs.readFile(appCssPath, 'utf8');
  assert.match(css, /@page\s+meyar-id1\s*\{[^}]*size:\s*85\.60mm\s+53\.98mm/s);
  assert.match(css, /@page\s+meyar-a6\s*\{[^}]*size:\s*105mm\s+148mm/s);
  assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(css), false, 'no hard-coded hex colours in app.css');
  assert.equal(/\brgba?\s*\(/.test(css), false, 'no hard-coded rgb/rgba colours in app.css');
  assert.equal(/font-family:(?!\s*var\(--m-font-)/.test(css), false, 'font-family must use design tokens');
});
