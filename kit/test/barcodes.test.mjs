import test from 'node:test';
import assert from 'node:assert/strict';

import { PATTERNS, encodeValues, encodeWidths, code128SVG, START_B, STOP } from '../web/barcode128.js';
import { qrMatrix, qrSVG, chooseVersion } from '../web/qr.js';
import { DEMO_KIT_ID } from '../lib/demo.js';

test('Code 128 table: 106 symbols of 11 modules, stop of 13, all distinct', () => {
  assert.equal(PATTERNS.length, 107);
  PATTERNS.slice(0, 106).forEach((p, i) => assert.equal([...p].reduce((a, b) => a + Number(b), 0), 11, `symbol ${i}`));
  assert.equal([...PATTERNS[STOP]].reduce((a, b) => a + Number(b), 0), 13);
  assert.equal(new Set(PATTERNS).size, 107);
  // Parity rule of the symbology: the three bars of each symbol sum to an even number of modules.
  PATTERNS.slice(0, 106).forEach((p, i) => assert.equal((Number(p[0]) + Number(p[2]) + Number(p[4])) % 2, 0, `bar parity ${i}`));
});

test('Code 128 B for the kit ID: start B, values, mod-103 check, stop; decodes back', () => {
  const v = encodeValues(DEMO_KIT_ID);
  assert.equal(v[0], START_B);
  assert.equal(v[v.length - 1], STOP);
  const data = v.slice(1, -2);
  assert.equal(String.fromCharCode(...data.map((x) => x + 32)), DEMO_KIT_ID);
  const check = (START_B + data.reduce((s, x, i) => s + x * (i + 1), 0)) % 103;
  assert.equal(v[v.length - 2], check);
  // Independent decode from the widths stream.
  const widths = encodeWidths(DEMO_KIT_ID);
  const symbols = [];
  for (let i = 0; i < widths.length - 7; i += 6) symbols.push(PATTERNS.indexOf(widths.slice(i, i + 6).join('')));
  assert.equal(widths.slice(-7).join(''), PATTERNS[STOP]);
  assert.deepEqual(symbols, v.slice(0, -1));
  assert.throws(() => encodeValues('é'), /cannot encode/);
});

test('Code 128 SVG carries an accessible label and only currentColor', () => {
  const svg = code128SVG(DEMO_KIT_ID);
  assert.match(svg, /aria-label="Code 128 barcode: MYR-DEMO-0001"/);
  assert.doesNotMatch(svg, /#[0-9a-f]{3,6}/i);
});

test('QR for the mailer: version 2, 25×25 modules, finder patterns in three corners', () => {
  const text = `MEYAR-KIT:${DEMO_KIT_ID}`;
  assert.equal(chooseVersion(text.length), 2);
  const m = qrMatrix(text);
  assert.equal(m.length, 25);
  const finderOK = (x0, y0) => {
    for (let dy = 0; dy < 7; dy += 1) for (let dx = 0; dx < 7; dx += 1) {
      const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      if (m[y0 + dy][x0 + dx] !== (d !== 2)) return false;
    }
    return true;
  };
  assert.ok(finderOK(0, 0) && finderOK(18, 0) && finderOK(0, 18));
  assert.equal(m[25 - 8][8], true, 'dark module');
  for (let i = 8; i < 17; i += 1) assert.equal(m[6][i], i % 2 === 0, 'timing row');
  assert.match(qrSVG(text), /aria-label="QR code: MEYAR-KIT:MYR-DEMO-0001"/);
});
