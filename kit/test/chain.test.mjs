import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { appendEvent, verifyChain, canonicalJSON, GENESIS, hashEvent } from '../lib/chain.js';
import { EVENT_TYPES } from '../lib/events.js';
import { DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS, toEvent } from '../lib/demo.js';

async function demoChain() {
  let chain = [];
  for (const scan of DEMO_SCANS) chain = await appendEvent(chain, toEvent(DEMO_KIT_ID, DEMO_PATIENT_ID, scan));
  return chain;
}

test('six scans for MYR-DEMO-0001 produce a valid, complete chain', async () => {
  const chain = await demoChain();
  assert.equal(chain.length, 6);
  assert.deepEqual(chain.map((e) => e.type), EVENT_TYPES);
  const v = await verifyChain(chain);
  assert.equal(v.ok, true);
  assert.equal(v.complete, true);
  assert.equal(v.brokenAt, -1);
  assert.equal(chain[0].prevHash, GENESIS);
  for (let i = 1; i < chain.length; i += 1) assert.equal(chain[i].prevHash, chain[i - 1].hash);
});

test('hash is SHA-256 of prevHash + canonical event JSON (checked with node:crypto)', async () => {
  const chain = await demoChain();
  for (const rec of chain) {
    const { hash, prevHash, ...body } = rec;
    const expected = createHash('sha256').update(prevHash + canonicalJSON(body)).digest('hex');
    assert.equal(hash, expected);
  }
});

test('canonical JSON ignores key order', () => {
  assert.equal(canonicalJSON({ b: 1, a: { d: 2, c: [3, { f: 1, e: 0 }] } }), canonicalJSON({ a: { c: [3, { e: 0, f: 1 }], d: 2 }, b: 1 }));
});

for (let i = 0; i < 6; i += 1) {
  test(`editing event ${i + 1} (${EVENT_TYPES[i]}) makes verify fail exactly there`, async () => {
    const chain = await demoChain();
    chain[i] = { ...chain[i], place: { ar: 'مكان آخر', en: 'Somewhere else' } };
    const v = await verifyChain(chain);
    assert.equal(v.ok, false);
    assert.equal(v.brokenAt, i);
    assert.ok(v.results[i].reasons.includes('content-changed'));
    assert.ok(v.results.slice(0, i).every((r) => r.ok));
    assert.ok(v.results.slice(i).every((r) => !r.ok));
  });
}

test('changing a timestamp by one second is caught', async () => {
  const chain = await demoChain();
  chain[3] = { ...chain[3], time: '2026-11-16T13:00:01+03:00' };
  assert.equal((await verifyChain(chain)).brokenAt, 3);
});

test('re-hashing an edited event still breaks the next link', async () => {
  const chain = await demoChain();
  const edited = { ...chain[2], actor: { role: 'x', ar: 'س', en: 'X' } };
  edited.hash = await hashEvent(edited.prevHash, edited);
  chain[2] = edited;
  const v = await verifyChain(chain);
  assert.equal(v.brokenAt, 3);
  assert.ok(v.results[3].reasons.includes('prev-hash-mismatch'));
});

test('deleting or reordering events is caught', async () => {
  const chain = await demoChain();
  const deleted = [...chain.slice(0, 2), ...chain.slice(3)];
  assert.equal((await verifyChain(deleted)).brokenAt, 2);
  const swapped = [chain[0], chain[2], chain[1], ...chain.slice(3)];
  assert.equal((await verifyChain(swapped)).brokenAt, 1);
});

test('out-of-order scan, wrong kit and a seventh event are refused', async () => {
  const first = await appendEvent([], toEvent(DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS[0]));
  await assert.rejects(appendEvent(first, toEvent(DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS[2])), /Next event must be "collected"/);
  await assert.rejects(appendEvent(first, toEvent('MYR-DEMO-0002', DEMO_PATIENT_ID, DEMO_SCANS[1])), /different kit/);
  const full = await demoChain();
  await assert.rejects(appendEvent(full, toEvent(DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS[5])), /complete/);
});

test('a broken chain cannot be extended', async () => {
  const chain = (await demoChain()).slice(0, 3);
  chain[1] = { ...chain[1], time: '2026-11-16T09:11:00+03:00' };
  await assert.rejects(appendEvent(chain, toEvent(DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS[3])), /Chain broken at event 2/);
});
