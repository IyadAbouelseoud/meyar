import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { createKitServer, parseScannedCode } from '../server.js';
import { Ledger } from '../lib/store.js';
import { verifyChain } from '../lib/chain.js';
import { fhirAvailable, readChain, deleteKit } from '../lib/fhir-client.js';
import { REPO_ROOT } from '../lib/handoff.js';
import { DEMO_KIT_ID as DEMO } from '../lib/demo.js';

// Tests use their own kit ID so they never touch the demo kit MYR-DEMO-0001 in HAPI.
const DEMO_KIT_ID = 'MYR-TEST-0001';
const KITS = { [DEMO_KIT_ID]: { kitId: DEMO_KIT_ID, patientId: 'demo-001' } };

function tmp(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

async function start(opts) {
  const server = createKitServer(opts);
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const api = async (method, p, body) => {
    const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };
  return { server, api, base };
}

async function scanAll(api) {
  const out = [];
  for (let i = 0; i < 6; i += 1) {
    const code = i % 2 ? `MEYAR-KIT:${DEMO_KIT_ID}` : DEMO_KIT_ID; // alternate tube barcode and mailer QR
    if (i === 5) { // F6: lab QC must pass before "genotyped"
      const qc = await api('POST', `/api/kits/${DEMO_KIT_ID}/qc`, { result: 'pass' });
      assert.equal(qc.status, 200, JSON.stringify(qc.body));
    }
    const r = await api('POST', `/api/kits/${DEMO_KIT_ID}/scan`, { code });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    out.push(r.body);
  }
  return out;
}

test('scanned code: tube Code 128 text and mailer QR text both resolve to the kit ID', () => {
  assert.equal(parseScannedCode(DEMO), DEMO);
  assert.equal(parseScannedCode(` MEYAR-KIT:${DEMO}\n`), DEMO);
});

test('API: six scans, verify, tamper fails verify, restore passes, hand-off written (ledger only)', async (t) => {
  const handoff = tmp('meyar-handoff-');
  process.env.ENGINE_IN_DIR = handoff;
  t.after(() => { delete process.env.ENGINE_IN_DIR; });
  const { server, api } = await start({ ledger: new Ledger(tmp('meyar-ledger-')), useFhir: false, kits: KITS });
  t.after(() => server.close());

  const wrong = await api('POST', `/api/kits/${DEMO_KIT_ID}/scan`, { code: 'MYR-DEMO-9999' });
  assert.equal(wrong.status, 409);
  const unknown = await api('GET', '/api/kits/MYR-DEMO-9999');
  assert.equal(unknown.status, 404);

  const results = await scanAll(api);
  assert.deepEqual(results.map((r) => r.recorded.type), ['issued', 'collected', 'sealed', 'shipped', 'received', 'genotyped']);
  const seventh = await api('POST', `/api/kits/${DEMO_KIT_ID}/scan`, { code: DEMO_KIT_ID });
  assert.equal(seventh.status, 409);

  let v = await api('GET', `/api/kits/${DEMO_KIT_ID}/verify`);
  assert.equal(v.body.ok, true);
  assert.equal(v.body.complete, true);

  assert.equal(results[5].handoff.sampleOrigin, 'germline');
  assert.equal(results[5].handoff.vcfPath, 'engine/data/in/demo-001.vcf');
  assert.equal(results[5].handoff.chainHead, v.body.head);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(handoff, 'demo-001.origin.json'), 'utf8')), { sampleOrigin: 'germline' });

  await api('POST', `/api/kits/${DEMO_KIT_ID}/tamper`, { seq: 4 });
  v = await api('GET', `/api/kits/${DEMO_KIT_ID}/verify`);
  assert.equal(v.body.ok, false);
  assert.equal(v.body.brokenAt, 3);

  await api('POST', `/api/kits/${DEMO_KIT_ID}/restore`);
  v = await api('GET', `/api/kits/${DEMO_KIT_ID}/verify`);
  assert.equal(v.body.ok, true);
});

test('static: timeline page and design files are served; no path escape', async (t) => {
  const { server, base } = await start({ ledger: new Ledger(tmp('meyar-ledger-')), useFhir: false, kits: KITS });
  t.after(() => server.close());
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/design/tokens.css')).status, 200);
  assert.equal((await fetch(base + '/lib/chain.js')).status, 200);
  assert.notEqual((await fetch(base + '/design/..%2f..%2fAGENTS.md')).status, 200);
});

test('engine accepts the hand-off: engine/origin_guard.py require_germline_origin passes', async (t) => {
  const handoff = tmp('meyar-handoff-');
  process.env.ENGINE_IN_DIR = handoff;
  t.after(() => { delete process.env.ENGINE_IN_DIR; });
  const { server, api } = await start({ ledger: new Ledger(tmp('meyar-ledger-')), useFhir: false, kits: KITS });
  t.after(() => server.close());
  await scanAll(api);
  const code = `import sys; sys.path.insert(0, r'${path.join(REPO_ROOT, 'engine')}'); from pathlib import Path; import origin_guard as g; print(g.require_germline_origin('demo-001', Path(r'${handoff}')))`;
  const tries = [['uv', ['run', '--no-project', '--python', '3.12', 'python', '-c', code]], ['python3', ['-c', code]], ['python', ['-c', code]]];
  let r;
  for (const [cmd, args] of tries) { r = spawnSync(cmd, args, { encoding: 'utf8' }); if (r.status === 0) break; }
  if (r.status !== 0) { t.skip(`No Python 3.12 to run engine/origin_guard.py: ${r.stderr || r.error}`); return; }
  assert.match(r.stdout.trim(), /germline/);
});

test('HAPI integration: six Provenance on the kit Specimen, verify from FHIR, FHIR edit caught', async (t) => {
  if (!(await fhirAvailable())) { t.skip('NOT A FULL PASS: local HAPI is not running (docker compose up -d hapi).'); return; }
  process.env.ENGINE_IN_DIR = tmp('meyar-handoff-');
  t.after(() => { delete process.env.ENGINE_IN_DIR; });
  await deleteKit(DEMO_KIT_ID);
  const { server, api } = await start({ ledger: new Ledger(tmp('meyar-ledger-')), useFhir: true, kits: KITS });
  t.after(async () => { server.close(); await deleteKit(DEMO_KIT_ID); });

  await scanAll(api);
  const chain = await readChain(DEMO_KIT_ID);
  assert.equal(chain.length, 6);
  assert.equal((await verifyChain(chain)).ok, true);
  let v = await api('GET', `/api/kits/${DEMO_KIT_ID}/verify?source=fhir`);
  assert.equal(v.body.source, 'fhir');
  assert.equal(v.body.ok, true);

  await api('POST', `/api/kits/${DEMO_KIT_ID}/tamper`, { seq: 2 });
  v = await api('GET', `/api/kits/${DEMO_KIT_ID}/verify?source=fhir`);
  assert.equal(v.body.ok, false);
  assert.equal(v.body.brokenAt, 1);
  await api('POST', `/api/kits/${DEMO_KIT_ID}/restore`);
  v = await api('GET', `/api/kits/${DEMO_KIT_ID}/verify?source=fhir`);
  assert.equal(v.body.ok, true);
});
