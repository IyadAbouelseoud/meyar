// SHA-256 hash chain for kit scan events (F3). Runs in Node 22 and the browser
// (WebCrypto `crypto.subtle`), so the server and the timeline screen verify the same way.
//
//   hash_n = SHA-256( prevHash_n + canonicalJSON(event_n) ),  prevHash_0 = 64 zeros
//
// `event_n` is the event body without its own `hash` / `prevHash` fields.
// Tamper-evident, not tamper-proof: whoever can rewrite every record can rebuild the
// whole chain. Signing events and anchoring the head hash outside the store is a
// future deployment step. Research prototype — not for clinical use.

import { EVENT_TYPES } from './events.js';

export const GENESIS = '0'.repeat(64);
const HASH_FIELDS = new Set(['hash', 'prevHash']);

/** Deterministic JSON: object keys sorted, no whitespace. Arrays keep their order. */
export function canonicalJSON(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(',')}}`;
}

/** The part of an event record that is hashed. */
export function eventBody(record) {
  const body = {};
  for (const [k, v] of Object.entries(record)) if (!HASH_FIELDS.has(k)) body[k] = v;
  return body;
}

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashEvent(prevHash, record) {
  return sha256Hex(prevHash + canonicalJSON(eventBody(record)));
}

/**
 * Append a new event to a chain. Refuses an event out of order, a different kit,
 * or a chain that no longer verifies (never extend a broken chain).
 */
export async function appendEvent(chain, event) {
  const check = await verifyChain(chain);
  if (!check.ok) throw new Error(`Chain broken at event ${check.brokenAt + 1}; refusing to append.`);
  const expected = EVENT_TYPES[chain.length];
  if (!expected) throw new Error('Chain is complete: all six events are recorded.');
  if (event.type !== expected) throw new Error(`Next event must be "${expected}", got "${event.type}".`);
  if (chain.length && event.kitId !== chain[0].kitId) throw new Error('Event belongs to a different kit.');
  const record = { ...eventBody(event), seq: chain.length + 1 };
  const prevHash = chain.length ? chain[chain.length - 1].hash : GENESIS;
  return [...chain, { ...record, prevHash, hash: await hashEvent(prevHash, record) }];
}

/**
 * Verify every link. Returns { ok, brokenAt (0-based index or -1), head, results[] }.
 * A link breaks when its stored prevHash does not match the previous stored hash,
 * when its stored hash does not match the recomputed hash, or when seq / type are
 * out of order. Every event after the first break is also marked broken, because
 * nothing after it can be trusted.
 */
export async function verifyChain(chain) {
  const results = [];
  let brokenAt = -1;
  let expectedPrev = GENESIS;
  for (let i = 0; i < chain.length; i += 1) {
    const rec = chain[i];
    const recomputed = await hashEvent(rec.prevHash ?? '', rec);
    const reasons = [];
    if (rec.prevHash !== expectedPrev) reasons.push('prev-hash-mismatch');
    if (rec.hash !== recomputed) reasons.push('content-changed');
    if (rec.seq !== i + 1) reasons.push('sequence-gap');
    if (rec.type !== EVENT_TYPES[i]) reasons.push('out-of-order');
    if (i > 0 && rec.kitId !== chain[0].kitId) reasons.push('different-kit');
    if (reasons.length && brokenAt === -1) brokenAt = i;
    results.push({
      seq: i + 1,
      type: rec.type,
      ok: brokenAt === -1,
      reasons,
      storedHash: rec.hash,
      recomputedHash: recomputed,
    });
    expectedPrev = rec.hash;
  }
  return {
    ok: brokenAt === -1,
    brokenAt,
    head: chain.length ? chain[chain.length - 1].hash : GENESIS,
    complete: chain.length === EVENT_TYPES.length,
    results,
  };
}
