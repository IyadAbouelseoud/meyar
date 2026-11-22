// Hand-off to the engine on "genotyped" (F3).
// Writes the two files the engine reads for a sample:
//   <outDir>/<patientId>.origin.json       {"sampleOrigin": "germline"}  (read by engine/origin_guard.py, A6)
//   <outDir>/<patientId>.kit-handoff.json  kit ID, Specimen, VCF path, chain head, mock flag
// Default outDir is kit/out/engine-handoff/ (inside F3's scope lock). Set
// ENGINE_IN_DIR=engine/data/in to write straight into the engine's input folder.
// Only a chain that verifies is handed off. Only germline samples are handed off.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyChain } from './chain.js';
import { fhirId } from './fhir.js';

const KIT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(KIT_DIR, '..');
export const DEFAULT_HANDOFF_DIR = path.join(KIT_DIR, 'out', 'engine-handoff');

export function handoffDir() {
  const env = process.env.ENGINE_IN_DIR;
  return env ? path.resolve(REPO_ROOT, env) : DEFAULT_HANDOFF_DIR;
}

export async function writeEngineHandoff(chain, outDir = handoffDir()) {
  const v = await verifyChain(chain);
  if (!v.ok) throw new Error(`Chain broken at event ${v.brokenAt + 1}; nothing handed to the engine.`);
  const last = chain[chain.length - 1];
  if (!last || last.type !== 'genotyped') throw new Error('Hand-off happens only on the "genotyped" event.');
  const { vcfPath, sampleOrigin } = last.details ?? {};
  if (sampleOrigin !== 'germline') throw new Error(`Refusing hand-off: sampleOrigin is ${JSON.stringify(sampleOrigin)}, only "germline" is accepted (A6).`);
  if (!vcfPath) throw new Error('Refusing hand-off: the genotyped event has no VCF path.');

  const patientId = last.patientId;
  fs.mkdirSync(outDir, { recursive: true });
  const originPath = path.join(outDir, `${patientId}.origin.json`);
  const manifestPath = path.join(outDir, `${patientId}.kit-handoff.json`);
  const vcfAbs = path.resolve(REPO_ROOT, vcfPath);
  const manifest = {
    patientId,
    kitId: last.kitId,
    specimen: `Specimen/${fhirId(last.kitId)}`,
    vcfPath,
    vcfPresent: fs.existsSync(vcfAbs),
    originFile: path.relative(REPO_ROOT, originPath).split(path.sep).join('/'),
    sampleOrigin,
    chainHead: v.head,
    chainLength: chain.length,
    genotypedAt: last.time,
    mock: true,
    note: 'Research prototype — not for clinical use. Demo data.',
  };
  fs.writeFileSync(originPath, JSON.stringify({ sampleOrigin: 'germline' }, null, 2) + '\n');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return { originPath, manifestPath, manifest };
}
