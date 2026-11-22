// C8 - PIN-protected QR envelope. Run: npm test (node --test, WebCrypto built into Node).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  encodeQrEnvelope, decodeQrEnvelope, encryptEnvelope, decryptEnvelope,
  holderView, assertEnvelopeV1, fromBase64Url, toBase64Url,
  PBKDF2_ITERATIONS, SALT_BYTES, NONCE_BYTES,
} from '../src/qr.js';
import { isValidPin, normalizeDigits, createPinLimiter } from '../src/pinguard.js';
import { renderScanApp } from '../src/scan-render.js';
import { SCAN_COPY } from '../src/i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(await fs.readFile(path.resolve(__dirname, '../public/demo/demo-001.contract.json'), 'utf8'));
const PIN = '482916';

test('C8: parameters match the spec (PBKDF2 600,000, 16-byte salt, 12-byte nonce)', () => {
  assert.equal(PBKDF2_ITERATIONS, 600000);
  assert.equal(SALT_BYTES, 16);
  assert.equal(NONCE_BYTES, 12);
});

test('C8: encrypt then decrypt with the right PIN returns the payload; wrong PIN fails', async () => {
  const enc = await encodeQrEnvelope(contract, { pin: PIN });
  assert.deepEqual(Object.keys(enc.envelope).sort(), ['c', 'n', 's', 'v']);
  assert.equal(enc.envelope.v, 1);
  assert.equal(fromBase64Url(enc.envelope.s).length, 16);
  assert.equal(fromBase64Url(enc.envelope.n).length, 12);
  assert.match(enc.qrText, /^\{"v":1,"s":"[A-Za-z0-9_-]+","n":"[A-Za-z0-9_-]+","c":"[A-Za-z0-9_-]+"\}$/);

  const decoded = await decodeQrEnvelope(enc.qrText, { pin: PIN });
  assert.deepEqual(decoded, enc.payload);

  await assert.rejects(() => decodeQrEnvelope(enc.qrText, { pin: '482917' }));
  await assert.rejects(() => decodeQrEnvelope(enc.qrText, { pin: '000000' }));
});

test('C8: ciphertext reveals nothing in clear and the payload holds no identity', async () => {
  const enc = await encodeQrEnvelope(contract, { pin: PIN });
  for (const word of ['CYP2C19', 'CYP2D6', 'Poor', '*2/*2', 'demo-001', 'germline']) {
    assert.equal(enc.qrText.includes(word), false, `QR text leaks "${word}"`);
  }
  assert.equal('id' in enc.payload, false);
  assert.equal(JSON.stringify(enc.payload).includes('demo-001'), false);
});

test('C8: reissue: same data and PIN twice gives a new salt, nonce and ciphertext', async () => {
  const a = await encodeQrEnvelope(contract, { pin: PIN });
  const b = await encodeQrEnvelope(contract, { pin: PIN });
  assert.notEqual(a.envelope.s, b.envelope.s);
  assert.notEqual(a.envelope.n, b.envelope.n);
  assert.notEqual(a.envelope.c, b.envelope.c);
  // New PIN makes a new card; the old card still opens with its old PIN (cannot be revoked offline).
  const c = await encodeQrEnvelope(contract, { pin: '730154' });
  await assert.rejects(() => decodeQrEnvelope(c.qrText, { pin: PIN }));
  assert.deepEqual(await decodeQrEnvelope(a.qrText, { pin: PIN }), a.payload);
});

test('C8: tampering with ciphertext, salt or nonce fails authentication', async () => {
  const env = (await encodeQrEnvelope(contract, { pin: PIN })).envelope;
  const flip = (b64) => { const x = fromBase64Url(b64); x[0] ^= 1; return toBase64Url(x); };
  for (const k of ['c', 's', 'n']) {
    await assert.rejects(() => decryptEnvelope({ ...env, [k]: flip(env[k]) }, PIN), `tampered ${k}`);
  }
});

test('C8: malformed envelopes are rejected before key derivation', () => {
  const ok = { v: 1, s: toBase64Url(new Uint8Array(16)), n: toBase64Url(new Uint8Array(12)), c: toBase64Url(new Uint8Array(40)) };
  assert.doesNotThrow(() => assertEnvelopeV1(ok));
  assert.throws(() => assertEnvelopeV1({ ...ok, v: 2 }));
  assert.throws(() => assertEnvelopeV1({ ...ok, s: toBase64Url(new Uint8Array(8)) }));
  assert.throws(() => assertEnvelopeV1({ ...ok, n: toBase64Url(new Uint8Array(16)) }));
  assert.throws(() => assertEnvelopeV1({ ...ok, c: toBase64Url(new Uint8Array(16)) }));
  assert.throws(() => assertEnvelopeV1({ ...ok, url: 'x' }));
});

test('C8: PIN must be exactly six digits; Arabic-Indic digits normalise', async () => {
  for (const bad of ['', '12345', '1234567', 'abcdef', '12 456', null, 123456]) {
    assert.equal(isValidPin(bad), false, String(bad));
  }
  assert.equal(isValidPin('012345'), true);
  assert.equal(normalizeDigits('٤٨٢٩١٦'), PIN); // Arabic-Indic
  assert.equal(normalizeDigits('۴۸۲۹۱۶'), PIN); // Eastern Arabic-Indic
  await assert.rejects(() => encryptEnvelope(new Uint8Array([1]), '1234'));
  await assert.rejects(() => encodeQrEnvelope(contract, {}), /6 digits/);
});

test('C8: emergency line is off by default, readable before the PIN, and tamper-bound', async () => {
  const off = await encodeQrEnvelope(contract, { pin: PIN });
  assert.equal('e' in off.envelope, false);
  assert.deepEqual(holderView(off.qrText), { kind: 'meyar-passport', v: 1, emergency: null });

  const line = 'Takes clopidogrel (demo)';
  const on = await encodeQrEnvelope(contract, { pin: PIN, emergency: line });
  assert.equal(holderView(on.qrText).emergency, line);
  assert.deepEqual(await decodeQrEnvelope(on.qrText, { pin: PIN }), on.payload);
  await assert.rejects(() => decryptEnvelope({ ...on.envelope, e: 'Forged line' }, PIN));
  await assert.rejects(() => decryptEnvelope({ ...on.envelope, e: undefined }, PIN));
});

test('C8: plaintext envelopes decode only when the reader allows dev mode', async () => {
  const plain = await encodeQrEnvelope(contract, { plaintext: true });
  await assert.rejects(() => decodeQrEnvelope(plain.qrText), /dev mode/);
  assert.deepEqual(await decodeQrEnvelope(plain.qrText, { allowPlaintext: true }), plain.payload);
});

test('C8: wrong-PIN rate limit locks after repeated misses and resets on success', () => {
  let t = 0;
  const lim = createPinLimiter({ now: () => t });
  assert.equal(lim.canTry(), true);
  lim.recordFailure(); lim.recordFailure();
  assert.equal(lim.canTry(), true);
  const wait1 = lim.recordFailure();
  assert.ok(wait1 > 0 && !lim.canTry());
  t += wait1;
  assert.equal(lim.canTry(), true);
  const wait2 = lim.recordFailure();
  assert.ok(wait2 > wait1, 'wait grows');
  lim.recordSuccess();
  assert.equal(lim.canTry(), true);
  assert.equal(lim.failures, 0);
});

test('C8: scanning without the PIN shows only the holder line (no clinical content in the DOM)', async () => {
  const line = 'Allergic to penicillin (demo)';
  const enc = await encodeQrEnvelope(contract, { pin: PIN, emergency: line });
  for (const lang of ['ar', 'en']) {
    const root = { innerHTML: '' };
    renderScanApp(root, {
      lang, elder: false, step: 'pin', cameraActive: false, scanError: '', pasteDraft: '',
      rawQrText: enc.qrText, holder: holderView(enc.qrText), pin: '', pinError: '',
      lockMs: 0, decrypting: false, decoded: null, cards: [],
    });
    const html = root.innerHTML;
    assert.ok(html.includes(SCAN_COPY[lang].holderLine), `${lang}: holder line shown`);
    assert.ok(html.includes(line), `${lang}: patient-chosen emergency line shown`);
    for (const word of ['CYP2C19', 'CYP2D6', 'Poor', 'Metabolizer', '*2/*2', 'clopidogrel', 'demo-001']) {
      assert.equal(html.includes(word), false, `${lang}: pre-PIN view leaks "${word}"`);
    }
  }
});
