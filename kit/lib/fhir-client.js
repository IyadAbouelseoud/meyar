// Minimal client for the LOCAL HAPI FHIR server (docker compose service `hapi`, port 8080).
// Never the public hapi.fhir.org server (AGENTS.md §4).

import { buildSpecimen, toProvenance, chainFromBundle, fhirId } from './fhir.js';

export const DEFAULT_FHIR_BASE = 'http://localhost:8080/fhir';

export function fhirBase() {
  return (process.env.FHIR_BASE || DEFAULT_FHIR_BASE).replace(/\/+$/, '');
}

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { Accept: 'application/fhir+json', 'Cache-Control': 'no-cache', // HAPI reuses cached searches otherwise
       ...(body ? { 'Content-Type': 'application/fhir+json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`FHIR ${method} ${url} failed (${res.status}): ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export async function fhirAvailable(base = fhirBase()) {
  try { await call('GET', `${base}/metadata?_summary=true`); return true; } catch { return false; }
}

/** PUT the Specimen and every Provenance (idempotent: ids are derived from kit ID and seq). */
export async function syncChain(chain, kit, base = fhirBase()) {
  const specimen = buildSpecimen(chain, kit);
  await call('PUT', `${base}/Specimen/${specimen.id}`, specimen);
  for (const rec of chain) {
    const prov = toProvenance(rec);
    await call('PUT', `${base}/Provenance/${prov.id}`, prov);
  }
  return { specimen: `Specimen/${specimen.id}`, provenance: chain.length };
}

export async function putProvenance(rec, base = fhirBase()) {
  const prov = toProvenance(rec);
  return call('PUT', `${base}/Provenance/${prov.id}`, prov);
}

/** Read the chain back from HAPI: every Provenance that targets this kit's Specimen. */
export async function readChain(kitId, base = fhirBase()) {
  const bundle = await call('GET', `${base}/Provenance?target=Specimen/${fhirId(kitId)}&_count=100`);
  return chainFromBundle(bundle);
}

export async function deleteKit(kitId, base = fhirBase()) {
  const chain = await readChain(kitId, base).catch(() => []);
  for (const rec of chain) await call('DELETE', `${base}/Provenance/${fhirId(rec.kitId)}-${rec.seq}`).catch(() => {});
  await call('DELETE', `${base}/Specimen/${fhirId(kitId)}`).catch(() => {});
}
