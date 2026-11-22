// F6 gates on top of the F3 custody chain:
//   lab QC      after "received"  — pass, or fail → "Recollect" (no result is ever issued for that tube)
//   review      after "genotyped" — a pharmacist (mock user) marks the result reviewed
//   release     after review      — only now may the result reach the patient's Passport
// Each gate record is bound to the custody chain head it was made against (chainHead), so a gate
// cannot be carried over to a chain that was edited afterwards.
// Research prototype — not for clinical use. Mock users and places only.

import fs from 'node:fs';
import path from 'node:path';
import { verifyChain } from './chain.js';
import { fhirId } from './fhir.js';
import { DEFAULT_DATA_DIR } from './store.js';

export const QC_FAIL_REASONS = {
  'insufficient-dna': { ar: 'كمية الحمض النووي غير كافية', en: 'Not enough DNA in the sample' },
  'label-mismatch': { ar: 'الملصق لا يطابق السجل', en: 'Label does not match the record' },
  'tube-leaked': { ar: 'الأنبوبة مسرّبة أو غير مختومة', en: 'Tube leaked or was not sealed' },
};

export const MOCK_PEOPLE = {
  qc: { role: 'lab-qc', ar: 'فني ضبط الجودة (تجريبي)', en: 'QC technician (demo)' },
  review: { role: 'pharmacist', ar: 'الصيدلي السريري (تجريبي)', en: 'Clinical pharmacist (demo)' },
  release: { role: 'pharmacist', ar: 'الصيدلي السريري (تجريبي)', en: 'Clinical pharmacist (demo)' },
};

export const MOCK_PLACES = {
  qc: { ar: 'مختبر التنميط — تجريبي', en: 'Genotyping lab — demo' },
  review: { ar: 'صيدلية المستشفى — تجريبي', en: 'Hospital pharmacy — demo' },
  release: { ar: 'صيدلية المستشفى — تجريبي', en: 'Hospital pharmacy — demo' },
};

export class GateStore {
  constructor(dir = process.env.KIT_DATA_DIR || DEFAULT_DATA_DIR) { this.dir = dir; }
  file(kitId) { return path.join(this.dir, `${fhirId(kitId)}.gates.json`); }
  read(kitId) {
    const f = this.file(kitId);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  }
  write(kitId, gates) {
    fs.mkdirSync(this.dir, { recursive: true });
    fs.writeFileSync(this.file(kitId), JSON.stringify(gates, null, 2) + '\n');
  }
  remove(kitId) { fs.rmSync(this.file(kitId), { force: true }); }
}

const has = (chain, type) => chain.some((e) => e.type === type);

function gateError(message) { return Object.assign(new Error(message), { status: 409 }); }

async function requireIntact(chain) {
  const v = await verifyChain(chain);
  if (!v.ok) throw gateError(`Chain broken at event ${v.brokenAt + 1}; no gate can be recorded.`);
  return v.head;
}

/** Lab QC. result: "pass" | "fail". A fail needs a reason from QC_FAIL_REASONS. */
export async function recordQc(chain, gates, { result, reason, time } = {}) {
  if (!has(chain, 'received')) throw gateError('QC happens after the lab receives the sample.');
  if (has(chain, 'genotyped')) throw gateError('QC is already settled: the sample was genotyped.');
  if (gates.qc) throw gateError(`QC is already recorded (${gates.qc.result}).`);
  if (result !== 'pass' && result !== 'fail') throw gateError('QC result must be "pass" or "fail".');
  if (result === 'fail' && !QC_FAIL_REASONS[reason]) throw gateError(`QC fail needs a reason: ${Object.keys(QC_FAIL_REASONS).join(', ')}.`);
  const chainHead = await requireIntact(chain);
  return { ...gates, qc: { result, reason: result === 'fail' ? reason : null, time: time || new Date().toISOString(), actor: MOCK_PEOPLE.qc, place: MOCK_PLACES.qc, chainHead, mock: true } };
}

/** The genotyped scan is allowed only when QC passed. A failed tube never gets a result. */
export function assertMayGenotype(gates) {
  if (!gates.qc) throw gateError('Record lab QC before "Genotyped".');
  if (gates.qc.result !== 'pass') throw gateError('This tube failed QC: recollect a new sample. No result is issued for this tube.');
}

export async function recordReview(chain, gates, { time } = {}) {
  if (gates.qc?.result !== 'pass') throw gateError('Nothing to review: QC did not pass.');
  if (!has(chain, 'genotyped')) throw gateError('Nothing to review yet: the sample is not genotyped.');
  if (gates.review) throw gateError('Already reviewed.');
  const chainHead = await requireIntact(chain);
  return { ...gates, review: { time: time || new Date().toISOString(), actor: MOCK_PEOPLE.review, place: MOCK_PLACES.review, chainHead, mock: true } };
}

export async function recordRelease(chain, gates, { time } = {}) {
  if (!gates.review) throw gateError('A pharmacist must mark the result reviewed before it reaches the Passport.');
  if (gates.release) throw gateError('Already released to the Passport.');
  const chainHead = await requireIntact(chain);
  if (chainHead !== gates.review.chainHead) throw gateError('The chain changed after review; review again.');
  return { ...gates, release: { time: time || new Date().toISOString(), actor: MOCK_PEOPLE.release, place: MOCK_PLACES.release, chainHead, mock: true } };
}

/** May this kit's result be shown in the Passport? Only after review + release on an intact chain. */
export async function mayReachPassport(chain, gates) {
  if (!gates.release || !gates.review || gates.qc?.result !== 'pass') return false;
  const v = await verifyChain(chain);
  return v.ok && v.head === gates.release.chainHead;
}

export const PATIENT_STEPS = ['registered', 'received', 'processing', 'reviewed', 'passport'];

/**
 * Patient-facing status. Never carries a genotype, phenotype or drug: only where the kit is.
 * Returns { steps: [{key, state: done|current|todo|stopped}], recollect: bool }.
 */
export async function patientStatus(chain, gates) {
  const v = await verifyChain(chain);
  const recollect = gates.qc?.result === 'fail';
  const reached = {
    registered: has(chain, 'issued'),
    received: has(chain, 'received'),
    processing: gates.qc?.result === 'pass',
    reviewed: Boolean(gates.review),
    passport: await mayReachPassport(chain, gates),
  };
  let currentSet = false;
  const steps = PATIENT_STEPS.map((key) => {
    if (reached[key]) return { key, state: 'done' };
    if (recollect && !currentSet) { currentSet = true; return { key, state: 'stopped' }; }
    if (!currentSet) { currentSet = true; return { key, state: 'current' }; }
    return { key, state: 'todo' };
  });
  return { steps, recollect, chainOk: v.ok, mock: true };
}
