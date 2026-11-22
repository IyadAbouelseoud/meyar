import test from 'node:test';
import assert from 'node:assert/strict';

import { appendEvent, verifyChain } from '../lib/chain.js';
import { toProvenance, fromProvenance, buildSpecimen, chainFromBundle, KIT_SYSTEM, PATIENT_SYSTEM } from '../lib/fhir.js';
import { DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS, toEvent } from '../lib/demo.js';

async function demoChain() {
  let chain = [];
  for (const scan of DEMO_SCANS) chain = await appendEvent(chain, toEvent(DEMO_KIT_ID, DEMO_PATIENT_ID, scan));
  return chain;
}

test('each event becomes a Provenance targeting the kit Specimen', async () => {
  const chain = await demoChain();
  const provs = chain.map(toProvenance);
  assert.deepEqual(provs.map((p) => p.id), [1, 2, 3, 4, 5, 6].map((n) => `MYR-DEMO-0001-${n}`));
  for (const [i, p] of provs.entries()) {
    assert.equal(p.resourceType, 'Provenance');
    assert.deepEqual(p.target, [{ reference: 'Specimen/MYR-DEMO-0001' }]);
    assert.equal(p.occurredDateTime, chain[i].time);
    assert.equal(p.recorded, chain[i].time);
    assert.equal(p.activity.coding[0].code, chain[i].type);
    assert.equal(p.location.display, chain[i].place.en);
    assert.equal(p.agent[0].who.display, chain[i].actor.en);
    assert.equal(p.meta.tag[0].code, 'mock');
  }
});

test('Provenance round-trips to the identical hashed record', async () => {
  const chain = await demoChain();
  for (const rec of chain) assert.deepEqual(fromProvenance(JSON.parse(JSON.stringify(toProvenance(rec)))), rec);
  const bundle = { entry: [...chain].reverse().map((r) => ({ resource: toProvenance(r) })) };
  const back = chainFromBundle(bundle);
  assert.equal((await verifyChain(back)).ok, true);
});

test('editing a Provenance element in FHIR breaks verify', async () => {
  const chain = await demoChain();
  const provs = chain.map(toProvenance);
  provs[3].location.display = 'Unknown depot';
  const back = chainFromBundle({ entry: provs.map((resource) => ({ resource })) });
  const v = await verifyChain(back);
  assert.equal(v.ok, false);
  assert.equal(v.brokenAt, 3);
});

test('Specimen carries kit identifier, pseudonymous subject, collection and received times', async () => {
  const chain = await demoChain();
  const s = buildSpecimen(chain, { kitId: DEMO_KIT_ID, patientId: DEMO_PATIENT_ID });
  assert.equal(s.id, 'MYR-DEMO-0001');
  assert.deepEqual(s.identifier, [{ system: KIT_SYSTEM, value: DEMO_KIT_ID }]);
  assert.deepEqual(s.subject, { identifier: { system: PATIENT_SYSTEM, value: DEMO_PATIENT_ID } });
  assert.equal(s.collection.collectedDateTime, chain[1].time);
  assert.equal(s.receivedTime, chain[4].time);
  const early = buildSpecimen(chain.slice(0, 1), { kitId: DEMO_KIT_ID, patientId: DEMO_PATIENT_ID });
  assert.equal(early.collection, undefined);
  assert.equal(early.receivedTime, undefined);
});
