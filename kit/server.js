// Meyar kit service (F3): chain-of-custody saliva kit, timeline screen and scan API.
// Node 22, no dependencies. Port 5174 (KIT_PORT). FHIR: local HAPI only (FHIR_BASE).
//
//   GET  /                              timeline screen (Arabic first)
//   GET  /design/*                      design system, read-only from ../design
//   GET  /api/kits/:id                  kit, events, next event, FHIR status, hand-off
//   GET  /api/kits/:id/chain?source=    raw chain from "fhir" (default when HAPI is up) or "ledger"
//   GET  /api/kits/:id/verify?source=   server-side verify of the same chain
//   POST /api/kits/:id/scan             {code, place?, actor?, time?} record the next event
//   POST /api/kits/:id/tamper           {seq} demo only: edit one stored event, keep its hash
//   POST /api/kits/:id/restore          demo only: undo the edit
//   POST /api/kits/:id/reset            demo only: clear the kit (ledger, FHIR, hand-off)
//
// Research prototype — not for clinical use. Demo data only.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { appendEvent, verifyChain } from './lib/chain.js';
import { nextEventType, EVENT_TYPES } from './lib/events.js';
import { DEMO_KIT_ID, DEMO_PATIENT_ID, DEMO_SCANS, toEvent } from './lib/demo.js';
import { Ledger } from './lib/store.js';
import { fhirAvailable, syncChain, readChain, putProvenance, deleteKit, fhirBase } from './lib/fhir-client.js';
import { writeEngineHandoff, handoffDir, REPO_ROOT } from './lib/handoff.js';

const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DESIGN_DIR = path.join(REPO_ROOT, 'design');
const MAX_BODY_BYTES = 64 * 1024; // engineering limit, not a clinical number

// Registered kits. The demo has one; a real deployment would issue these from a kit register.
const DEMO_KITS = { [DEMO_KIT_ID]: { kitId: DEMO_KIT_ID, patientId: DEMO_PATIENT_ID } };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png',
};

/** Accepts the tube's Code 128 text or the mailer QR text. */
export function parseScannedCode(code) {
  const s = String(code ?? '').trim();
  const m = /^MEYAR-KIT:(.+)$/.exec(s);
  return m ? m[1] : s;
}

export function createKitServer({ ledger = new Ledger(), useFhir = true, kits = DEMO_KITS } = {}) {
  const KITS = kits;
  const backups = new Map();

  async function fhirUp() { return useFhir && fhirAvailable(); }

  async function loadChain(kitId, source) {
    if (source === 'ledger') return { source: 'ledger', chain: ledger.read(kitId) };
    if (source === 'fhir' || (source == null && (await fhirUp()))) {
      return { source: 'fhir', chain: await readChain(kitId) };
    }
    return { source: 'ledger', chain: ledger.read(kitId) };
  }

  async function kitState(kit) {
    const chain = ledger.read(kit.kitId);
    const fhir = await fhirUp();
    const next = nextEventType(chain);
    const nextDefaults = next ? DEMO_SCANS[EVENT_TYPES.indexOf(next)] : null;
    const manifest = path.join(handoffDir(), `${kit.patientId}.kit-handoff.json`);
    return {
      kit,
      events: chain,
      next,
      nextDefaults,
      fhir: { available: fhir, base: fhir ? fhirBase() : null },
      tampered: backups.has(kit.kitId),
      handoff: readHandoff(manifest),
      mock: true,
    };
  }

  async function scan(kit, body) {
    const scanned = parseScannedCode(body.code);
    if (scanned !== kit.kitId) throw httpError(409, `Scanned code "${scanned}" is not kit ${kit.kitId}.`);
    const chain = ledger.read(kit.kitId);
    const type = nextEventType(chain);
    if (!type) throw httpError(409, 'All six events are already recorded for this kit.');
    if (body.type && body.type !== type) throw httpError(409, `Next event must be "${type}", got "${body.type}".`);
    const defaults = DEMO_SCANS[EVENT_TYPES.indexOf(type)];
    const event = toEvent(kit.kitId, kit.patientId, {
      ...defaults,
      time: body.time || new Date().toISOString(),
      place: body.place?.en ? { ar: body.place.ar || body.place.en, en: body.place.en } : defaults.place,
      actor: body.actor?.en ? { role: defaults.actor.role, ar: body.actor.ar || body.actor.en, en: body.actor.en } : defaults.actor,
    });
    let updated;
    try { updated = await appendEvent(chain, event); } catch (e) { throw httpError(409, e.message); }
    ledger.write(kit.kitId, updated);
    const result = { recorded: updated[updated.length - 1], fhir: null, handoff: null };
    if (await fhirUp()) result.fhir = await syncChain(updated, kit);
    if (type === 'genotyped') result.handoff = (await writeEngineHandoff(updated)).manifest;
    return result;
  }

  async function tamper(kit, body) {
    const chain = ledger.read(kit.kitId);
    const seq = Number(body.seq) || Math.min(4, chain.length);
    const i = seq - 1;
    if (!chain[i]) throw httpError(409, `No event ${seq} to edit.`);
    if (!backups.has(kit.kitId)) backups.set(kit.kitId, structuredClone(chain));
    // Someone changes where the sample was, after the fact, without re-sealing the chain.
    chain[i] = { ...chain[i], place: { ar: 'مستودع غير مسجَّل', en: 'Unlisted depot' } };
    ledger.write(kit.kitId, chain);
    if (await fhirUp()) await putProvenance(chain[i]);
    return { edited: seq };
  }

  async function restore(kit) {
    const original = backups.get(kit.kitId);
    if (!original) return { restored: false };
    ledger.write(kit.kitId, original);
    backups.delete(kit.kitId);
    if (await fhirUp()) await syncChain(original, kit);
    return { restored: true };
  }

  async function reset(kit) {
    ledger.remove(kit.kitId);
    backups.delete(kit.kitId);
    if (await fhirUp()) await deleteKit(kit.kitId);
    for (const f of [`${kit.patientId}.kit-handoff.json`]) fs.rmSync(path.join(handoffDir(), f), { force: true });
    // origin.json is removed only from the kit's own hand-off folder, never from engine/data/in.
    if (!process.env.ENGINE_IN_DIR) fs.rmSync(path.join(handoffDir(), `${kit.patientId}.origin.json`), { force: true });
    return { reset: true };
  }

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const m = /^\/api\/kits\/([^/]+)(?:\/([a-z]+))?$/.exec(url.pathname);
      if (m) {
        const kit = KITS[decodeURIComponent(m[1])];
        if (!kit) return sendJSON(res, 404, { error: `Unknown kit ${decodeURIComponent(m[1])}.` });
        const action = m[2] ?? '';
        const source = url.searchParams.get('source') || undefined;
        if (req.method === 'GET' && action === '') return sendJSON(res, 200, await kitState(kit));
        if (req.method === 'GET' && action === 'chain') return sendJSON(res, 200, await loadChain(kit.kitId, source));
        if (req.method === 'GET' && action === 'verify') {
          const { source: used, chain } = await loadChain(kit.kitId, source);
          return sendJSON(res, 200, { source: used, ...(await verifyChain(chain)) });
        }
        if (req.method === 'POST') {
          const body = await readBody(req);
          const handlers = { scan, tamper, restore, reset };
          if (handlers[action]) return sendJSON(res, 200, await handlers[action](kit, body));
        }
        return sendJSON(res, 405, { error: 'Method not allowed.' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return sendJSON(res, 405, { error: 'Method not allowed.' });
      if (url.pathname === '/' || url.pathname === '/index.html') return sendFile(res, path.join(KIT_DIR, 'web', 'index.html'));
      if (url.pathname === '/health') return sendJSON(res, 200, { ok: true });
      const roots = [['/design/', DESIGN_DIR], ['/web/', path.join(KIT_DIR, 'web')], ['/lib/', path.join(KIT_DIR, 'lib')]];
      for (const [prefix, root] of roots) {
        if (url.pathname.startsWith(prefix)) {
          const file = path.resolve(root, '.' + decodeURIComponent(url.pathname.slice(prefix.length - 1)));
          if (!file.startsWith(root + path.sep)) return sendJSON(res, 403, { error: 'Forbidden.' });
          return sendFile(res, file);
        }
      }
      return sendJSON(res, 404, { error: 'Not found.' });
    } catch (err) {
      sendJSON(res, err.status || 500, { error: err.message });
    }
  });
}

function readHandoff(manifest) {
  if (!fs.existsSync(manifest)) return null;
  const h = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  return { ...h, vcfPresent: fs.existsSync(path.resolve(REPO_ROOT, h.vcfPath)) }; // checked now, not at hand-off time
}

function httpError(status, message) { return Object.assign(new Error(message), { status }); }

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sendFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return sendJSON(res, 404, { error: 'Not found.' });
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY_BYTES) { reject(httpError(413, 'Body too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(httpError(400, 'Body is not JSON.')); } });
    req.on('error', reject);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.KIT_PORT) || 5174;
  const ledger = new Ledger();
  // Bring HAPI in line with the local ledger on start (HAPI may have been restarted or cleared).
  if (await fhirAvailable()) {
    for (const kit of Object.values(DEMO_KITS)) {
      const chain = ledger.read(kit.kitId);
      if (chain.length) await syncChain(chain, kit).catch((e) => console.error(e.message));
    }
  }
  createKitServer({ ledger }).listen(port, () => {
    console.log(`Meyar kit (F3, research prototype) on http://localhost:${port}  FHIR ${fhirBase()}  hand-off ${handoffDir()}`);
  });
}
