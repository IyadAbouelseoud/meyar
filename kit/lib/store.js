// Local ledger: kit/data/<kitId>.jsonl, one hashed event per line (gitignored).
// Works with HAPI offline; the server mirrors it to HAPI when HAPI is up.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fhirId } from './fhir.js';

const KIT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_DATA_DIR = path.join(KIT_DIR, 'data');

export class Ledger {
  constructor(dir = process.env.KIT_DATA_DIR || DEFAULT_DATA_DIR) { this.dir = dir; }

  file(kitId) { return path.join(this.dir, `${fhirId(kitId)}.jsonl`); }

  read(kitId) {
    const f = this.file(kitId);
    if (!fs.existsSync(f)) return [];
    return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  }

  write(kitId, chain) {
    fs.mkdirSync(this.dir, { recursive: true });
    fs.writeFileSync(this.file(kitId), chain.map((e) => JSON.stringify(e)).join('\n') + (chain.length ? '\n' : ''));
  }

  remove(kitId) { fs.rmSync(this.file(kitId), { force: true }); }
}
