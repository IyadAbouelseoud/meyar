// FHIR R4 mapping for the kit (F3): one Specimen per kit, one Provenance per scan event.
//
// The hash covers what FHIR shows. `fromProvenance()` rebuilds the event body only from
// the Provenance's own elements (activity, occurredDateTime, location, agent, extensions),
// so editing any of those in HAPI makes verify fail. There is no hidden copy of the
// event that verify could fall back on.
// Research prototype — not for clinical use.

import { EVENT_LABELS } from './events.js';

export const KIT_SYSTEM = 'urn:meyar:kit';
export const PATIENT_SYSTEM = 'urn:meyar:patient'; // same system engine/load_fhir.py (A4) uses
export const EVENT_SYSTEM = 'urn:meyar:kit-event';
export const CHAIN_EXT = 'urn:meyar:fhir:StructureDefinition/kit-chain';
export const DETAILS_EXT = 'urn:meyar:fhir:StructureDefinition/kit-details';
export const TRANSLATION_EXT = 'http://hl7.org/fhir/StructureDefinition/translation';
export const PARTICIPANT_SYSTEM = 'http://terminology.hl7.org/CodeSystem/provenance-participant-type';
export const MOCK_TAG = { system: 'urn:meyar:tag', code: 'mock', display: 'Demo data' };
const PROTOTYPE_NOTE = 'Research prototype — not for clinical use. Demo data.';

/** FHIR-safe id ([A-Za-z0-9-.]{1,64}), same rule as engine/load_fhir.py. */
export function fhirId(raw) {
  return (String(raw).trim().replace(/[^A-Za-z0-9\-.]/g, '-').slice(0, 64)) || 'unknown';
}

const arTranslation = (text) => ({
  extension: [{
    url: TRANSLATION_EXT,
    extension: [{ url: 'lang', valueCode: 'ar' }, { url: 'content', valueString: text }],
  }],
});

const readAr = (primitiveExt) => {
  const tr = primitiveExt?.extension?.find((e) => e.url === TRANSLATION_EXT);
  if (!tr) return undefined;
  const lang = tr.extension.find((e) => e.url === 'lang')?.valueCode;
  return lang === 'ar' ? tr.extension.find((e) => e.url === 'content')?.valueString : undefined;
};

const subExt = (ext, url) => ext?.extension?.find((e) => e.url === url);

/** Specimen for a kit, reflecting the events recorded so far. */
export function buildSpecimen(chain, { kitId, patientId }) {
  const byType = Object.fromEntries(chain.map((e) => [e.type, e]));
  const specimen = {
    resourceType: 'Specimen',
    id: fhirId(kitId),
    meta: { tag: [MOCK_TAG] },
    identifier: [{ system: KIT_SYSTEM, value: kitId }],
    status: 'available',
    type: { text: 'Saliva' },
    subject: { identifier: { system: PATIENT_SYSTEM, value: patientId } },
    note: [{ text: PROTOTYPE_NOTE }],
  };
  if (byType.collected) specimen.collection = { collectedDateTime: byType.collected.time };
  if (byType.received) specimen.receivedTime = byType.received.time;
  return specimen;
}

/** One Provenance per hashed event record. */
export function toProvenance(rec) {
  const specimenRef = `Specimen/${fhirId(rec.kitId)}`;
  const chainExt = {
    url: CHAIN_EXT,
    extension: [
      { url: 'seq', valueInteger: rec.seq },
      { url: 'prevHash', valueString: rec.prevHash },
      { url: 'hash', valueString: rec.hash },
      { url: 'kitId', valueString: rec.kitId },
      { url: 'patientId', valueString: rec.patientId },
      { url: 'actorRole', valueString: rec.actor.role },
      { url: 'algorithm', valueString: 'SHA-256(prevHash + canonicalJSON(event))' },
    ],
  };
  const extension = [chainExt];
  if (rec.details) {
    extension.push({
      url: DETAILS_EXT,
      extension: Object.keys(rec.details).sort().map((k) => ({ url: k, valueString: String(rec.details[k]) })),
    });
  }
  return {
    resourceType: 'Provenance',
    id: `${fhirId(rec.kitId)}-${rec.seq}`,
    meta: { tag: rec.mock ? [MOCK_TAG] : [] },
    extension,
    target: [{ reference: specimenRef }],
    occurredDateTime: rec.time,
    recorded: rec.time,
    location: { display: rec.place.en, _display: arTranslation(rec.place.ar) },
    activity: { coding: [{ system: EVENT_SYSTEM, code: rec.type, display: EVENT_LABELS[rec.type]?.en ?? rec.type }] },
    agent: [{
      type: { coding: [{ system: PARTICIPANT_SYSTEM, code: 'performer' }] },
      who: { display: rec.actor.en, _display: arTranslation(rec.actor.ar) },
    }],
  };
}

/** Rebuild the hashed event record from a Provenance (inverse of toProvenance). */
export function fromProvenance(prov) {
  const chain = prov.extension?.find((e) => e.url === CHAIN_EXT);
  const details = prov.extension?.find((e) => e.url === DETAILS_EXT);
  const rec = {
    kitId: subExt(chain, 'kitId')?.valueString,
    patientId: subExt(chain, 'patientId')?.valueString,
    type: prov.activity?.coding?.find((c) => c.system === EVENT_SYSTEM)?.code,
    time: prov.occurredDateTime,
    place: { ar: readAr(prov.location?._display), en: prov.location?.display },
    actor: {
      role: subExt(chain, 'actorRole')?.valueString,
      ar: readAr(prov.agent?.[0]?.who?._display),
      en: prov.agent?.[0]?.who?.display,
    },
    mock: Boolean(prov.meta?.tag?.some((t) => t.system === MOCK_TAG.system && t.code === MOCK_TAG.code)),
    seq: subExt(chain, 'seq')?.valueInteger,
    prevHash: subExt(chain, 'prevHash')?.valueString,
    hash: subExt(chain, 'hash')?.valueString,
  };
  if (details) rec.details = Object.fromEntries(details.extension.map((e) => [e.url, e.valueString]));
  return rec;
}

/** Event records from a Provenance search Bundle, ordered by chain seq. */
export function chainFromBundle(bundle) {
  return (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r) => r?.resourceType === 'Provenance')
    .map(fromProvenance)
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}
