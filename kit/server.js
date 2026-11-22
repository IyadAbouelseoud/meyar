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
//   POST /api/kits/:id/qc               F6 {result:"pass"|"fail", reason?} lab QC after "received"
//   POST /api/kits/:id/review           F6 pharmacist (mock) marks the result reviewed
//   POST /api/kits/:id/release          F6 result may now reach the Passport
//   GET  /api/kits/:id/status           F6 patient tracker status (no genotype, no drug)
//   POST /api/urgent/card               F6 T3 roadmap screen: same order-sign call to the CDS service
//   GET  /tracker · /urgent · /reader/  F6 patient tracker, T3 screen, offline second-device reader
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
import { GateStore, recordQc, recordReview, recordRelease, assertMayGenotype, patientStatus, mayReachPassport } from './lib/gates.js';

const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DESIGN_DIR = path.join(REPO_ROOT, 'design');
const MAX_BODY_BYTES = 64 * 1024; // engineering limit, not a clinical number

// Registered kits. The demo has one; a real deployment would issue these from a kit register.
// F6: MYR-DEMO-0002 is the same patient's first tube, which the lab rejects at QC (failed-QC branch).
export const FAILED_QC_KIT_ID = 'MYR-DEMO-0002';
const DEMO_KITS = {
  [DEMO_KIT_ID]: { kitId: DEMO_KIT_ID, patientId: DEMO_PATIENT_ID },
  [FAILED_QC_KIT_ID]: { kitId: FAILED_QC_KIT_ID, patientId: DEMO_PATIENT_ID },
};
const DEMO_DIR = path.join(REPO_ROOT, 'docs', 'demo');
const CDS_URL = process.env.CDS_URL || 'http://localhost:3000';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8',
};

/** Accepts the tube's Code 128 text or the mailer QR text. */
export function parseScannedCode(code) {
  const s = String(code ?? '').trim();
  const m = /^MEYAR-KIT:(.+)$/.exec(s);
  return m ? m[1] : s;
}

export function createKitServer({ ledger = new Ledger(), gateStore = new GateStore(ledger.dir), useFhir = true, kits = DEMO_KITS } = {}) {
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
      handoff: readHandoff(manifest, kit.kitId),
      gates: gateStore.read(kit.kitId),
      passportReleased: await mayReachPassport(chain, gateStore.read(kit.kitId)),
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
    if (type === 'genotyped') assertMayGenotype(gateStore.read(kit.kitId)); // F6: failed-QC tube never gets a result
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

  async function qc(kit, body) {
    const gates = await recordQc(ledger.read(kit.kitId), gateStore.read(kit.kitId), body);
    gateStore.write(kit.kitId, gates);
    return { qc: gates.qc };
  }
  async function review(kit, body) {
    const gates = await recordReview(ledger.read(kit.kitId), gateStore.read(kit.kitId), body);
    gateStore.write(kit.kitId, gates);
    return { review: gates.review };
  }
  async function release(kit, body) {
    const gates = await recordRelease(ledger.read(kit.kitId), gateStore.read(kit.kitId), body);
    gateStore.write(kit.kitId, gates);
    return { release: gates.release };
  }

  async function reset(kit) {
    gateStore.remove(kit.kitId);
    ledger.remove(kit.kitId);
    backups.delete(kit.kitId);
    if (await fhirUp()) await deleteKit(kit.kitId);
    // Two kits can share a patient (F6 recollection): only remove a hand-off this kit wrote.
    const manifest = path.join(handoffDir(), `${kit.patientId}.kit-handoff.json`);
    if (readHandoff(manifest, kit.kitId)) {
      fs.rmSync(manifest, { force: true });
      // origin.json is removed only from the kit's own hand-off folder, never from engine/data/in.
      if (!process.env.ENGINE_IN_DIR) fs.rmSync(path.join(handoffDir(), `${kit.patientId}.origin.json`), { force: true });
    }
    return { reset: true };
  }

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'POST' && url.pathname === '/api/urgent/card') return sendJSON(res, 200, await urgentCard());
      const m = /^\/api\/kits\/([^/]+)(?:\/([a-z]+))?$/.exec(url.pathname);
      if (m) {
        const kit = KITS[decodeURIComponent(m[1])];
        if (!kit) return sendJSON(res, 404, { error: `Unknown kit ${decodeURIComponent(m[1])}.` });
        const action = m[2] ?? '';
        const source = url.searchParams.get('source') || undefined;
        if (req.method === 'GET' && action === '') return sendJSON(res, 200, await kitState(kit));
        if (req.method === 'GET' && action === 'chain') return sendJSON(res, 200, await loadChain(kit.kitId, source));
        if (req.method === 'GET' && action === 'status') {
          return sendJSON(res, 200, { kitId: kit.kitId, ...(await patientStatus(ledger.read(kit.kitId), gateStore.read(kit.kitId))) });
        }
        if (req.method === 'GET' && action === 'verify') {
          const { source: used, chain } = await loadChain(kit.kitId, source);
          return sendJSON(res, 200, { source: used, ...(await verifyChain(chain)) });
        }
        if (req.method === 'POST') {
          const body = await readBody(req);
          const handlers = { scan, tamper, restore, reset, qc, review, release };
          if (handlers[action]) return sendJSON(res, 200, await handlers[action](kit, body));
        }
        return sendJSON(res, 405, { error: 'Method not allowed.' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return sendJSON(res, 405, { error: 'Method not allowed.' });
      if (url.pathname === '/' || url.pathname === '/index.html') return sendFile(res, path.join(KIT_DIR, 'web', 'index.html'));
      if (url.pathname === '/tracker') return sendFile(res, path.join(KIT_DIR, 'web', 'tracker.html'));
      if (url.pathname === '/urgent') return sendFile(res, path.join(KIT_DIR, 'web', 'urgent.html'));
      if (url.pathname === '/reader') { res.writeHead(301, { Location: '/reader/' }); return res.end(); }
      if (url.pathname === '/reader/') return sendFile(res, path.join(DEMO_DIR, 'reader', 'index.html'));
      // The reader's service worker must sit at /reader/ to control that scope.
      if (url.pathname === '/reader/sw.js') return sendFile(res, path.join(DEMO_DIR, 'reader', 'sw.js'), { 'Service-Worker-Allowed': '/' });
      if (url.pathname === '/vendor/jsQR.js') return sendFile(res, path.join(REPO_ROOT, 'passport', 'node_modules', 'jsqr', 'dist', 'jsQR.js'));
      if (url.pathname === '/health') return sendJSON(res, 200, { ok: true });
      // F6: the reader reuses passport/src read-only (decrypt + PIN rules); nothing in passport/ is changed.
      const roots = [['/design/', DESIGN_DIR], ['/web/', path.join(KIT_DIR, 'web')], ['/lib/', path.join(KIT_DIR, 'lib')],
        ['/reader/', path.join(DEMO_DIR, 'reader')], ['/demo-out/', path.join(DEMO_DIR, 'out')], ['/passport-src/', path.join(REPO_ROOT, 'passport', 'src')]];
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

// T3 roadmap screen: post the same clopidogrel order-sign the T1/T2 path uses to the CDS service
// (B2/B3, unchanged). The phenotype comes from the demo-001 store; nothing here simulates a device.
export function clopidogrelOrderSign(patientId = DEMO_PATIENT_ID) {
  return {
    hook: 'order-sign',
    hookInstance: 'f6-demo-0000-0000-0000-000000000001',
    context: {
      userId: 'Practitioner/demo-clinician',
      patientId,
      draftOrders: { resourceType: 'Bundle', type: 'collection', entry: [{ resource: {
        resourceType: 'MedicationRequest', id: 'f6-clopidogrel', status: 'draft', intent: 'order',
        subject: { reference: `Patient/${patientId}` },
        medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '32968', display: 'Clopidogrel 75 MG Oral Tablet' }], text: 'Clopidogrel 75 MG Oral Tablet' },
        reasonCode: [{ text: 'Acute coronary syndrome, PCI' }],
      } }] },
    },
  };
}

async function urgentCard() {
  try {
    const r = await fetch(`${CDS_URL}/cds-services/meyar-pgx`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clopidogrelOrderSign()), signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { ok: false, error: `CDS service answered ${r.status}` };
    return { ok: true, ...(await r.json()) };
  } catch (e) {
    return { ok: false, error: `CDS service not reachable at ${CDS_URL} (${e.message}). Run: docker compose up -d` };
  }
}

function readHandoff(manifest, kitId = null) {
  if (!fs.existsSync(manifest)) return null;
  const h = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  if (kitId && h.kitId !== kitId) return null;
  return { ...h, vcfPresent: fs.existsSync(path.resolve(REPO_ROOT, h.vcfPath)) }; // checked now, not at hand-off time
}

function httpError(status, message) { return Object.assign(new Error(message), { status }); }

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sendFile(res, file, extra = {}) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return sendJSON(res, 404, { error: 'Not found.' });
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...extra });
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
