// F6: make the demo-001 Passport QR with the C8 envelope (passport/src/qr.js, read-only reuse),
// measure it, and make a tampered copy with exactly one changed ciphertext byte.
// Run from the repo root:  node --import ./passport/test/register-alias.mjs docs/demo/make_qr.mjs
// Writes docs/demo/out/{demo-001,demo-001-tampered}.qr.{txt,svg} and qr-meta.json.
// Research prototype — not for clinical use. Demo data; the PIN below is a demo PIN printed in SCRIPT.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from '../../passport/node_modules/qrcode/lib/index.js';
import { encodeQrEnvelope, decodeQrEnvelope, renderQrSvg, toBase64Url, fromBase64Url } from '../../passport/src/qr.js';
import { getDrugsForGene } from '../../passport/src/lookup.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(HERE, 'out');
export const DEMO_PIN = '482916';

const contract = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'fixtures', 'demo-001.contract.json'), 'utf8'));
const enc = await encodeQrEnvelope(contract, { pin: DEMO_PIN, getDrugsFn: getDrugsForGene });

// Tamper: flip one bit in one ciphertext byte (the middle one). Everything else is untouched.
const env = JSON.parse(enc.qrText);
const c = fromBase64Url(env.c);
const tamperedByte = Math.floor(c.length / 2);
c[tamperedByte] ^= 0x01;
const tampered = JSON.stringify({ ...env, c: toBase64Url(c) });

// Self-check before anything is written: the real one opens, the tampered one must not.
const back = await decodeQrEnvelope(enc.qrText, { pin: DEMO_PIN });
if (!back || !Array.isArray(back.g ?? back.genes ?? [1])) throw new Error('round trip failed');
let rejected = false;
try { await decodeQrEnvelope(tampered, { pin: DEMO_PIN }); } catch { rejected = true; }
if (!rejected) throw new Error('tampered QR was accepted — stop');

fs.mkdirSync(OUT, { recursive: true });
const meta = {};
for (const [name, text] of [['demo-001', enc.qrText], ['demo-001-tampered', tampered]]) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  fs.writeFileSync(path.join(OUT, `${name}.qr.txt`), text);
  fs.writeFileSync(path.join(OUT, `${name}.qr.svg`), renderQrSvg(text, { ariaLabel: `Meyar Passport QR (${name}, demo data)` }).svg);
  meta[name] = { bytes: Buffer.byteLength(text, 'utf8'), qrVersion: qr.version, modules: qr.modules.size, errorCorrectionLevel: 'M' };
}
meta['demo-001'].payloadJsonBytes = enc.rawBytes;
meta['demo-001'].compressedBytes = enc.compressedBytes;
meta['demo-001-tampered'].changedCiphertextByte = tamperedByte;
meta.mock = true;
meta.note = 'Demo data. Measured by docs/demo/make_qr.mjs with the qrcode package passport/ already uses.';
fs.writeFileSync(path.join(OUT, 'qr-meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.log(`QR demo-001: ${meta['demo-001'].bytes} bytes, QR version ${meta['demo-001'].qrVersion} (${meta['demo-001'].modules}x${meta['demo-001'].modules} modules), EC level M, encrypted`);
console.log(`QR tampered: byte ${tamperedByte} of the ciphertext changed; decrypt with the right PIN fails (checked)`);
