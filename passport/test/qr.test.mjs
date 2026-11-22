import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCompactPayload,
  encodeQrEnvelope,
  decodeQrEnvelope,
  renderQrSvg,
} from '../src/qr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo001Path = path.resolve(__dirname, '../public/demo/demo-001.contract.json');

test('C2: demo-001 compact payload has no URL, no raw genome, no name', async () => {
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const payload = buildCompactPayload(contract, (g) => {
    if (g.gene === 'CYP2C19' && g.phenotype === 'Poor Metabolizer') {
      return [{ drug: 'clopidogrel', rxnorm: '32968', status: 'stop', alternatives: ['prasugrel', 'ticagrelor'] }];
    }
    return [];
  });

  assert.equal(payload.id, 'demo-001');
  assert.equal(payload.o, 'germline');
  assert.equal(payload.g.length, 2);
  assert.equal(payload.g[0].gene, 'CYP2C19');
  assert.equal(payload.g[0].phen, 'Poor Metabolizer');
  assert.equal(payload.g[0].rec[0].d, 'clopidogrel');
  assert.equal(payload.g[1].gene, 'CYP2D6');
  assert.equal(payload.g[1].call.m, 'not-assessed');

  const serialized = JSON.stringify(payload);
  assert.equal(/https?:\/\//i.test(serialized), false);
});

test('C2: demo-001 encrypted envelope round-trips with right PIN and fails with wrong PIN', async () => {
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const encoded = await encodeQrEnvelope(contract, { pin: '123456' });

  assert.equal(encoded.encrypted, true);
  assert.equal(encoded.envelope.v, 1);
  assert.equal(encoded.errorCorrectionLevel, 'M');
  assert.ok(encoded.compressedBytes < encoded.rawBytes, 'deflate should compress JSON');

  const decoded = await decodeQrEnvelope(encoded.qrText, { pin: '123456' });
  assert.deepEqual(decoded, encoded.payload);

  await assert.rejects(() => decodeQrEnvelope(encoded.qrText, { pin: '999999' }));

  const qr = renderQrSvg(encoded.qrText);
  assert.ok(qr.svg.includes('shape-rendering="crispEdges"'));
  assert.ok(qr.svg.includes('fill="#14201B"'));
  assert.ok(qr.svg.includes('fill="#FFFFFF"'));
  assert.ok(qr.quietZone >= 4);

  console.log(
    `demo-001 QR metrics: raw=${encoded.rawBytes}B, compressed=${encoded.compressedBytes}B, envelope=${encoded.envelopeBytes}B, modules=${qr.modules}, EC=${qr.errorCorrectionLevel}`
  );
});

test('C2: dev plaintext mode round-trips without PIN when explicitly enabled', async () => {
  const contract = JSON.parse(await fs.readFile(demo001Path, 'utf8'));
  const encoded = await encodeQrEnvelope(contract, { plaintext: true });
  assert.equal(encoded.encrypted, false);
  assert.equal(encoded.envelope.v, 0);
  const decoded = await decodeQrEnvelope(encoded.qrText);
  assert.deepEqual(decoded, encoded.payload);
});
