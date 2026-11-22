// F6: lab QC (fail → Recollect, no result), pharmacist review gate, release, patient status, T3 card path.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

import { createKitServer, clopidogrelOrderSign } from '../server.js';
import { Ledger } from '../lib/store.js';

const OK = 'MYR-TEST-0101';
const BAD = 'MYR-TEST-0102';
const KITS = { [OK]: { kitId: OK, patientId: 'test-ok' }, [BAD]: { kitId: BAD, patientId: 'test-bad' } };

async function start() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f6-gates-'));
  process.env.ENGINE_IN_DIR = path.relative(process.cwd(), path.join(dir, 'handoff'));
  const server = createKitServer({ ledger: new Ledger(dir), useFhir: false, kits: KITS });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const api = async (method, p, body) => {
    const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };
  return { server, api, dir };
}

const scan = (api, kit) => api('POST', `/api/kits/${kit}/scan`, { code: kit });
async function scanTo(api, kit, n) { for (let i = 0; i < n; i += 1) assert.equal((await scan(api, kit)).status, 200); }

test('failed QC: timeline says Recollect, "genotyped" is refused, no result, no hand-off, never reaches Passport', async (t) => {
  const { server, api } = await start(); t.after(() => server.close());
  assert.equal((await api('POST', `/api/kits/${BAD}/qc`, { result: 'fail', reason: 'insufficient-dna' })).status, 409, 'QC before receipt refused');
  await scanTo(api, BAD, 5);
  assert.equal((await api('POST', `/api/kits/${BAD}/qc`, { result: 'fail' })).status, 409, 'fail needs a reason');
  const qc = await api('POST', `/api/kits/${BAD}/qc`, { result: 'fail', reason: 'insufficient-dna' });
  assert.equal(qc.status, 200);
  assert.equal((await api('POST', `/api/kits/${BAD}/qc`, { result: 'pass' })).status, 409, 'QC cannot be overwritten');
  const g = await scan(api, BAD);
  assert.equal(g.status, 409); assert.match(g.body.error, /recollect/i);
  assert.equal((await api('POST', `/api/kits/${BAD}/review`)).status, 409);
  assert.equal((await api('POST', `/api/kits/${BAD}/release`)).status, 409);
  const st = await api('GET', `/api/kits/${BAD}`);
  assert.equal(st.body.events.length, 5); assert.equal(st.body.handoff, null); assert.equal(st.body.passportReleased, false);
  const ps = await api('GET', `/api/kits/${BAD}/status`);
  assert.equal(ps.body.recollect, true);
  assert.deepEqual(ps.body.steps.map((s) => s.state), ['done', 'done', 'stopped', 'todo', 'todo']);
});

test('review gate: no release before review, release after, patient status walks all five steps', async (t) => {
  const { server, api } = await start(); t.after(() => server.close());
  const states = async () => (await api('GET', `/api/kits/${OK}/status`)).body.steps.map((s) => s.state);
  await scanTo(api, OK, 1);
  assert.deepEqual(await states(), ['done', 'current', 'todo', 'todo', 'todo']);
  await scanTo(api, OK, 4);
  assert.equal((await scan(api, OK)).status, 409, 'genotyped needs QC first');
  assert.equal((await api('POST', `/api/kits/${OK}/qc`, { result: 'pass' })).status, 200);
  assert.deepEqual(await states(), ['done', 'done', 'done', 'current', 'todo']);
  assert.equal((await api('POST', `/api/kits/${OK}/review`)).status, 409, 'review before genotyped refused');
  await scanTo(api, OK, 1);
  assert.equal((await api('POST', `/api/kits/${OK}/release`)).status, 409, 'release before review refused');
  assert.equal((await api('GET', `/api/kits/${OK}`)).body.passportReleased, false);
  const rv = await api('POST', `/api/kits/${OK}/review`);
  assert.equal(rv.status, 200); assert.equal(rv.body.review.actor.role, 'pharmacist'); assert.equal(rv.body.review.mock, true);
  assert.deepEqual(await states(), ['done', 'done', 'done', 'done', 'current']);
  assert.equal((await api('POST', `/api/kits/${OK}/release`)).status, 200);
  assert.deepEqual(await states(), ['done', 'done', 'done', 'done', 'done']);
  assert.equal((await api('GET', `/api/kits/${OK}`)).body.passportReleased, true);
});

test('an edit after release takes the result back out of the Passport', async (t) => {
  const { server, api } = await start(); t.after(() => server.close());
  await scanTo(api, OK, 5); await api('POST', `/api/kits/${OK}/qc`, { result: 'pass' }); await scanTo(api, OK, 1);
  await api('POST', `/api/kits/${OK}/review`); await api('POST', `/api/kits/${OK}/release`);
  await api('POST', `/api/kits/${OK}/tamper`, { seq: 4 });
  assert.equal((await api('GET', `/api/kits/${OK}`)).body.passportReleased, false);
  const st = (await api('GET', `/api/kits/${OK}/status`)).body;
  assert.equal(st.chainOk, false); assert.equal(st.steps[4].state, 'current');
});

test('patient status carries no genotype, phenotype or drug', async (t) => {
  const { server, api } = await start(); t.after(() => server.close());
  await scanTo(api, OK, 5);
  const text = JSON.stringify((await api('GET', `/api/kits/${OK}/status`)).body);
  assert.doesNotMatch(text, /CYP|\*2|metaboli|clopidogrel|safe/i);
});

test('T3 urgent screen posts the same clopidogrel order-sign to the CDS service', async (t) => {
  let received = null;
  const cds = http.createServer((req, res) => {
    let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { received = { url: req.url, body: JSON.parse(b) }; res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ cards: [{ summary: 'stub' }] })); });
  });
  await new Promise((r) => cds.listen(0, r)); t.after(() => cds.close());
  process.env.CDS_URL = `http://localhost:${cds.address().port}`;
  const mod = await import(`../server.js?cds=${Date.now()}`);
  const server = mod.createKitServer({ ledger: new Ledger(fs.mkdtempSync(path.join(os.tmpdir(), 'f6-u-'))), useFhir: false });
  await new Promise((r) => server.listen(0, r)); t.after(() => server.close());
  const r = await (await fetch(`http://localhost:${server.address().port}/api/urgent/card`, { method: 'POST' })).json();
  assert.equal(r.ok, true); assert.equal(r.cards[0].summary, 'stub');
  assert.equal(received.url, '/cds-services/meyar-pgx');
  assert.equal(received.body.hook, 'order-sign');
  assert.deepEqual(received.body, clopidogrelOrderSign());
  delete process.env.CDS_URL;
});
