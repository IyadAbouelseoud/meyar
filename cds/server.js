// Meyar CDS Hooks 2.0.1 service (port 3000, Node 22 LTS).
// Exposes:
//   GET  /cds-services                 -> CDS Hooks 2.0.1 discovery document
//   POST /cds-services/meyar-pgx       -> order-sign hook (maturity 5)
//   POST /cds-services/meyar-pgx-select -> order-select hook (maturity 4)
//   GET  /health                       -> service health check
//   GET  /design/*                     -> read-only design system static assets
//
// Research prototype — not for clinical use.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  loadClinicalTables,
  extractDraftMedications,
  matchDrugsInTable,
  matchInhibitorsInTable,
  lookupCpic,
} from './lib/cpic.js';
import { simulateInhibitorShift } from './lib/phenoconvert.js';
import {
  resolvePatientProfile,
  resolveCurrentMedications,
  resolveFhirBase,
  resolveContractsDir,
  resolveFixturesDir,
  NonGermlineSampleError,
  PGX_OBSERVATION_QUERY,
} from './lib/phenotypes.js';
import {
  buildCpicCard,
  buildNotAssessedSvCard,
  buildNoResultCard,
  buildInhibitorBackwardSweepCard,
} from './lib/cards.js';
import {
  resolveAlertsLogPath,
  appendAlertEvents,
  readAlertEvents,
  summarizeAlerts,
  VALID_ACTIONS,
} from './lib/alertLog.js';
import {
  loadWatchFixtures,
  loadCoverageGrid,
  renderDashboardHtml,
} from './lib/dashboard.js';
import { renderCompareHtml } from './lib/compare.js';
import { renderPreviewHtml } from './lib/preview.js';

// Request-size guard (engineering limit, not a clinical number).
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const DEPRECATED_HOOK = 'medication-prescribe';

const PREFETCH = {
  pgxObservations: `Observation?subject=Patient/{{context.patientId}}&${PGX_OBSERVATION_QUERY}`,
  currentMedications: 'MedicationStatement?subject=Patient/{{context.patientId}}&status=active',
};

export const DISCOVERY_DOCUMENT = {
  services: [
    {
      hook: 'order-sign',
      id: 'meyar-pgx',
      title: 'Meyar Pharmacogenomics Order-Sign Advisory',
      description:
        'Checks ordered medications against stored germline pharmacogenomic phenotypes (FHIR Genomics Reporting IG / Meyar contract) and CPIC guidelines at order sign. Research prototype — not for clinical use.',
      prefetch: PREFETCH,
    },
    {
      hook: 'order-select',
      id: 'meyar-pgx-select',
      title: 'Meyar Pharmacogenomics Order-Select Advisory',
      description:
        'Early pharmacogenomic check when a medication order is selected (order-select). Research prototype — not for clinical use.',
      prefetch: PREFETCH,
    },
  ],
};

// PharmCAT / contract values that mean "no usable call" for a gene.
const NO_RESULT_PHENOTYPES = new Set(['no result', 'not called', 'unknown', '']);

function hasUsablePhenotype(geneRecord) {
  if (!geneRecord || geneRecord.phenotype === null || geneRecord.phenotype === undefined) {
    return false;
  }
  return !NO_RESULT_PHENOTYPES.has(String(geneRecord.phenotype).trim().toLowerCase());
}

const SERVICE_HOOK_MAP = new Map([
  ['meyar-pgx', 'order-sign'],
  ['meyar-pgx-select', 'order-select'],
]);

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers':
      'X-Meyar-Latency-Ms, X-Meyar-Phenotype-Source, X-Meyar-Backward-Sweep',
  };
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...corsHeaders(),
    ...extraHeaders,
  });
  res.end(body);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
    ...corsHeaders(),
  });
  res.end(html);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let tooLarge = false;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        // Keep draining so the client still receives a clean 413 response.
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (tooLarge) {
        const err = new Error('Request body exceeds limit');
        err.statusCode = 413;
        reject(err);
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw.trim()) {
          const err = new Error('Request body is required');
          err.statusCode = 400;
          reject(err);
          return;
        }
        resolve(JSON.parse(raw));
      } catch {
        const err = new Error('Invalid JSON request body');
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function resolveDesignDir(overrideDir) {
  if (overrideDir) return overrideDir;
  if (process.env.DESIGN_DIR) return process.env.DESIGN_DIR;
  if (fs.existsSync('/data/design')) return '/data/design';
  return path.resolve(import.meta.dirname, '..', 'design');
}

function serveStaticDesign(reqPath, res, designDir) {
  let relPath;
  try {
    relPath = decodeURIComponent(reqPath.slice('/design/'.length));
  } catch {
    res.writeHead(400, corsHeaders());
    res.end('Bad Request');
    return;
  }
  const resolvedRoot = path.resolve(designDir);
  const fullPath = path.resolve(resolvedRoot, relPath);

  // Prevent directory traversal outside the read-only design directory.
  if (!fullPath.startsWith(resolvedRoot + path.sep) && fullPath !== resolvedRoot) {
    res.writeHead(403, corsHeaders());
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    res.writeHead(404, corsHeaders());
    res.end('Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES.get(ext) || 'application/octet-stream';
  const data = fs.readFileSync(fullPath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': data.length,
    'Cache-Control': 'public, max-age=300',
    ...corsHeaders(),
  });
  res.end(data);
}

function evaluateMedications(meds, geneMap, deps, seenCardKeys, { isBackwardSweep = false } = {}) {
  const cards = [];

  for (const med of meds) {
    const drug = matchDrugInTable(med, deps.tables);
    if (!drug) continue;

    const genesForDrug = deps.tables.drugGenes.get(drug);
    if (!genesForDrug) continue;

    for (const geneSymbol of genesForDrug) {
      const dedupeKey = `${drug}|${geneSymbol}`;
      if (seenCardKeys.has(dedupeKey)) continue;

      const geneRecord = geneMap.get(geneSymbol);
      const svRow = deps.tables.svGenes.get(geneSymbol);

      // A8 structural-variation gate: never report a VCF-derived or Normal phenotype
      // for an unassessed SV gene.
      if (
        svRow &&
        (!geneRecord ||
          geneRecord.callability?.method === 'not-assessed' ||
          geneRecord.phenotype === null ||
          String(geneRecord.phenotype || '').toLowerCase() === 'no result')
      ) {
        if (isBackwardSweep) continue;
        seenCardKeys.add(dedupeKey);
        cards.push(
          buildNotAssessedSvCard({
            geneRecord,
            svRow,
            drugDisplay: med.display,
          })
        );
        continue;
      }

      if (!geneRecord || !geneRecord.phenotype) continue;

      const phenoApplied = Boolean(geneRecord.phenoconversion?.applied);
      const lookupPhenotype =
        phenoApplied && geneRecord.effectivePhenotype
          ? geneRecord.effectivePhenotype
          : geneRecord.phenotype;

      const activityScore = phenoApplied
        ? geneRecord.phenoconversion?.adjustedActivityScore ?? null
        : geneRecord.phenoconversion?.geneticActivityScore ?? null;

      const row = lookupCpicRow(deps.tables, {
        drug,
        gene: geneSymbol,
        phenotype: lookupPhenotype,
        activityScore,
        reasonText: med.reasonText,
      });

      if (!row) continue;

      // Backward sweep returns cards only for affected drugs the patient already takes.
      if (isBackwardSweep) {
        const indicator = selectIndicator(row, lookupPhenotype);
        if (indicator !== 'warning' && !phenoApplied) continue;
      }

      seenCardKeys.add(dedupeKey);
      cards.push(
        buildCpicCard({
          geneRecord,
          row,
          drugDisplay: med.display,
          isBackwardSweep,
        })
      );
    }
  }

  return cards;
}

/**
 * One card for (drug, gene), or null when CPIC has no row for the phenotype.
 */
function buildCardForGene({ drug, geneSymbol, geneRecord, med, patientId, tables, isBackwardSweep = false }) {
  const svRow = tables.svGenes.get(geneSymbol);

  // A8 structural-variation gate: an SV gene without an outside call is
  // "not assessed", never a VCF-derived or normal result.
  if (
    svRow &&
    (!geneRecord ||
      geneRecord.callability?.method === 'not-assessed' ||
      !hasUsablePhenotype(geneRecord))
  ) {
    if (isBackwardSweep) return null;
    return buildNotAssessedSvCard({ geneRecord, svRow, drugDisplay: med.display });
  }

  // A gene this drug's CPIC rows need, with no usable result: say so, never stay silent.
  if (!hasUsablePhenotype(geneRecord)) {
    if (isBackwardSweep) return null;
    return buildNoResultCard({
      gene: geneSymbol,
      geneRecord,
      drug,
      drugDisplay: med.display,
    });
  }

  const pc = geneRecord.phenoconversion || {};
  const phenoApplied = Boolean(pc.applied);
  const lookupPhenotype =
    phenoApplied && geneRecord.effectivePhenotype
      ? geneRecord.effectivePhenotype
      : geneRecord.phenotype;
  const activityScore = phenoApplied
    ? pc.adjustedActivityScore ?? null
    : pc.geneticActivityScore ?? null;

  const match = lookupCpic(tables, {
    drug,
    gene: geneSymbol,
    phenotype: lookupPhenotype,
    activityScore,
    reasonText: med.reasonText,
  });
  if (!match) return null;

  // A7: when current medicines changed the phenotype, also look up the genetic
  // row so the card never hides what applies if the inhibitor is stopped.
  const geneticMatch =
    lookupPhenotype !== geneRecord.phenotype
      ? lookupCpic(tables, {
          drug,
          gene: geneSymbol,
          phenotype: geneRecord.phenotype,
          activityScore: pc.geneticActivityScore ?? null,
          reasonText: med.reasonText,
        })
      : null;

  const card = buildCpicCard({
    geneRecord,
    match,
    geneticMatch,
    drugDisplay: med.display,
    patientId,
    isBackwardSweep,
  });

  if (isBackwardSweep && card.indicator !== 'warning' && !phenoApplied) {
    return null;
  }

  return card;
}

/**
 * Evaluate a CDS Hooks 2.0.1 request against stored patient phenotypes and CPIC tables.
 */
export async function handleHookRequest(serviceId, body, deps) {
  const expectedHook = SERVICE_HOOK_MAP.get(serviceId);
  if (!expectedHook) {
    const err = new Error(`Unknown CDS service: ${serviceId}`);
    err.statusCode = 404;
    throw err;
  }

  if (!body || typeof body !== 'object') {
    const err = new Error('CDS Hooks request payload must be a JSON object');
    err.statusCode = 400;
    throw err;
  }

  if (body.hook === DEPRECATED_HOOK) {
    const err = new Error(
      `Hook "${DEPRECATED_HOOK}" is deprecated in CDS Hooks 2.0.1; use "${expectedHook}" instead.`
    );
    err.statusCode = 400;
    throw err;
  }

  if (body.hook && body.hook !== expectedHook) {
    const err = new Error(
      `Service "${serviceId}" handles "${expectedHook}", received "${body.hook}".`
    );
    err.statusCode = 400;
    throw err;
  }

  if (!body.hookInstance || typeof body.hookInstance !== 'string') {
    const err = new Error('Missing required CDS Hooks field: hookInstance');
    err.statusCode = 400;
    throw err;
  }

  const context = body.context;
  if (!context || typeof context !== 'object' || !context.patientId) {
    const err = new Error('Missing required CDS Hooks field: context.patientId');
    err.statusCode = 400;
    throw err;
  }

  const patientId = String(context.patientId).replace(/^Patient\//i, '').trim();
  const draftMeds = extractDraftMedications(context);

  const profile = await resolvePatientProfile(patientId, {
    prefetch: body.prefetch || null,
    fhirBase: deps.fhirBase,
    fhirTimeoutMs: deps.fhirTimeoutMs,
    contractsDir: deps.contractsDir,
    fixturesDir: deps.fixturesDir,
    svGenes: deps.tables.svGenes,
    fetchImpl: deps.fetchImpl,
  });

  const orderedStrongInhibitors = [];
  if (expectedHook === 'order-sign') {
    const seenInhKeys = new Set();
    for (const med of draftMeds) {
      for (const inh of matchInhibitorsInTable(med, deps.tables)) {
        if (inh.strength !== 'strong') continue;
        const k = `${inh.drug}|${inh.enzyme}`;
        if (seenInhKeys.has(k)) continue;
        seenInhKeys.add(k);
        orderedStrongInhibitors.push({ ...inh, medDisplay: med.display });
      }
    }
  }

  const shouldRunFirstSweep =
    expectedHook === 'order-sign' &&
    Boolean(profile) &&
    deps.sweptPatients &&
    !deps.sweptPatients.has(patientId);
  const shouldRunInhibitorSweep =
    expectedHook === 'order-sign' &&
    Boolean(profile) &&
    orderedStrongInhibitors.length > 0;
  const shouldRunBackwardSweep = shouldRunFirstSweep || shouldRunInhibitorSweep;

  if (!profile || (draftMeds.length === 0 && !shouldRunBackwardSweep)) {
    return {
      cards: [],
      phenotypeSource: profile?.source || 'none',
      backwardSweepRan: false,
    };
  }

  const geneMap = new Map();
  for (const g of profile.genes || []) {
    if (g?.gene) geneMap.set(String(g.gene).toUpperCase(), g);
  }

  const seenCardKeys = new Set();
  const cards = [];
  const logEntries = [];

  const recordCard = (card, { drug, geneSymbol, geneRecord, isBackwardSweep, phenoconversionOverride = null }) => {
    cards.push(card);
    const phenoApplied = phenoconversionOverride !== null
      ? Boolean(phenoconversionOverride)
      : Boolean(geneRecord?.phenoconversion?.applied);
    const effective =
      phenoApplied && geneRecord?.effectivePhenotype
        ? geneRecord.effectivePhenotype
        : geneRecord?.phenotype || 'Not assessed';
    logEntries.push({
      time: new Date().toISOString(),
      patientPseudonym: patientId,
      drug,
      gene: geneSymbol,
      phenotype: effective,
      cardId: card.uuid,
      action: 'fired',
      backwardSweep: Boolean(isBackwardSweep),
      phenoconversionApplied: phenoApplied,
      mock: true,
    });
  };

  for (const med of draftMeds) {
    for (const drug of matchDrugsInTable(med, deps.tables)) {
      const genesForDrug = deps.tables.drugGenes.get(drug);
      if (!genesForDrug) continue;

      for (const geneSymbol of genesForDrug) {
        const dedupeKey = `${drug}|${geneSymbol}`;
        if (seenCardKeys.has(dedupeKey)) continue;
        seenCardKeys.add(dedupeKey);

        const geneRecord = geneMap.get(geneSymbol);
        const card = buildCardForGene({
          drug,
          geneSymbol,
          geneRecord,
          med,
          patientId,
          tables: deps.tables,
          isBackwardSweep: false,
        });
        if (card) recordCard(card, { drug, geneSymbol, geneRecord, isBackwardSweep: false });
      }
    }
  }

  if (shouldRunBackwardSweep) {
    if (shouldRunFirstSweep) deps.sweptPatients.add(patientId);
    const currentMedsResult = await resolveCurrentMedications(patientId, {
      prefetch: body.prefetch || null,
      fhirBase: deps.fhirBase,
      fhirTimeoutMs: deps.fhirTimeoutMs,
      contractCurrentMedications: profile.currentMedications || [],
      fetchImpl: deps.fetchImpl,
    });

    // B6: When a draft order is a strong inhibitor (tables/cyp_inhibitors.json),
    // simulate A7 phenoconversion and emit one info card per (inhibitor, enzyme)
    // listing existing substrates whose CPIC recommendation now changes.
    for (const inh of orderedStrongInhibitors) {
      const geneRecord = geneMap.get(inh.enzyme);
      const svRow = deps.tables.svGenes.get(inh.enzyme);
      const sim = simulateInhibitorShift({
        geneRecord,
        inhibitorDrug: inh.drug,
        enzyme: inh.enzyme,
        strength: inh.strength,
        svRow,
      });
      if (!sim || (!sim.changed && !sim.flagged)) continue;

      const affectedSubstrates = [];
      for (const med of currentMedsResult.medications) {
        for (const drug of matchDrugsInTable(med, deps.tables)) {
          const genesForDrug = deps.tables.drugGenes.get(drug);
          if (!genesForDrug || !genesForDrug.has(inh.enzyme)) continue;

          const dedupeKey = `${drug}|${inh.enzyme}`;
          if (seenCardKeys.has(dedupeKey)) continue;

          const beforeMatch = lookupCpic(deps.tables, {
            drug,
            gene: inh.enzyme,
            phenotype: sim.priorPhenotype,
            activityScore: sim.priorActivityScore ?? null,
            reasonText: med.reasonText,
          });
          const afterMatch = lookupCpic(deps.tables, {
            drug,
            gene: inh.enzyme,
            phenotype: sim.newPhenotype,
            activityScore: sim.adjustedActivityScore ?? null,
            reasonText: med.reasonText,
          });
          if (!afterMatch) continue;

          const recChanged = sim.scored
            ? !beforeMatch ||
              beforeMatch.row.recommendation !== afterMatch.row.recommendation ||
              beforeMatch.row.classification !== afterMatch.row.classification
            : String(afterMatch.row.classification || '').trim().toLowerCase() !== 'no recommendation';

          if (!recChanged) continue;
          seenCardKeys.add(dedupeKey);
          affectedSubstrates.push({
            drug,
            drugDisplay: med.display,
            beforeMatch,
            afterMatch,
          });
        }
      }

      if (affectedSubstrates.length > 0) {
        const card = buildInhibitorBackwardSweepCard({
          inhibitorDisplay: inh.medDisplay,
          inhibitorDrug: inh.drug,
          enzyme: inh.enzyme,
          strength: inh.strength,
          geneRecord,
          simulation: sim,
          affectedSubstrates,
        });
        recordCard(card, {
          drug: affectedSubstrates.map((s) => s.drug).join(', '),
          geneSymbol: inh.enzyme,
          geneRecord: { ...geneRecord, effectivePhenotype: sim.newPhenotype },
          isBackwardSweep: true,
          phenoconversionOverride: true,
        });
      }
    }

    if (shouldRunFirstSweep) {
      for (const med of currentMedsResult.medications) {
        for (const drug of matchDrugsInTable(med, deps.tables)) {
          const genesForDrug = deps.tables.drugGenes.get(drug);
          if (!genesForDrug) continue;

          for (const geneSymbol of genesForDrug) {
            const dedupeKey = `${drug}|${geneSymbol}`;
            if (seenCardKeys.has(dedupeKey)) continue;
            seenCardKeys.add(dedupeKey);

            const geneRecord = geneMap.get(geneSymbol);
            const card = buildCardForGene({
              drug,
              geneSymbol,
              geneRecord,
              med,
              patientId,
              tables: deps.tables,
              isBackwardSweep: true,
            });
            if (card) recordCard(card, { drug, geneSymbol, geneRecord, isBackwardSweep: true });
          }
        }
      }
    }
  }

  if (deps.alertsLogPath && logEntries.length > 0) {
    appendAlertEvents(deps.alertsLogPath, logEntries);
  }

  return {
    cards,
    phenotypeSource: profile.source,
    backwardSweepRan: shouldRunBackwardSweep,
  };
}

/**
 * Create a configured Node HTTP server implementing Meyar's CDS Hooks 2.0.1 service.
 */
export function createCdsServer(options = {}) {
  const tables = options.tables || loadClinicalTables(options.tablesDir);
  const fhirBase = resolveFhirBase(options.fhirBase);
  const contractsDir = resolveContractsDir(options.contractsDir);
  const fixturesDir = resolveFixturesDir(options.fixturesDir);
  const designDir = resolveDesignDir(options.designDir);
  const alertsLogPath = resolveAlertsLogPath(options.alertsLogPath);
  const fhirTimeoutMs = options.fhirTimeoutMs ?? Number(process.env.FHIR_TIMEOUT_MS || 400);
  const fetchImpl = options.fetchImpl || fetch;

  const deps = {
    tables,
    fhirBase,
    contractsDir,
    fixturesDir,
    alertsLogPath,
    fhirTimeoutMs,
    fetchImpl,
    sweptPatients: new Set(),
  };

  return http.createServer(async (req, res) => {
    // An exception escaping an async request handler is an unhandled rejection,
    // which terminates Node; every request error becomes a 500 instead.
    try {
      await routeRequest(req, res);
    } catch (err) {
      if (!res.headersSent) {
        sendJson(res, 500, { error: err?.message || 'Internal server error' });
      } else {
        res.destroy();
      }
    }
  });

  async function routeRequest(req, res) {
    const startNs = process.hrtime.bigint();
    const url = new URL(req.url || '/', 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      res.end();
      return;
    }

    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'meyar-cds',
        fhirBase,
        cpicRows: tables.rows.length,
        drugsSupported: tables.knownDrugs,
      });
    }

    if (req.method === 'GET' && pathname === '/cds-services') {
      return sendJson(res, 200, DISCOVERY_DOCUMENT);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/design/')) {
      return serveStaticDesign(url.pathname, res, designDir);
    }

    if (req.method === 'GET' && pathname === '/dashboard/data') {
      const range = url.searchParams.get('range') === 'week' ? 'week' : 'today';
      const summary = summarizeAlerts(readAlertEvents(alertsLogPath), { range });
      return sendJson(res, 200, summary);
    }

    if (req.method === 'GET' && pathname === '/compare') {
      const lang = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
      return sendHtml(res, renderCompareHtml({ lang }));
    }

    if (req.method === 'GET' && pathname === '/preview') {
      const lang = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
      return sendHtml(res, renderPreviewHtml({ lang }));
    }

    if (req.method === 'GET' && pathname === '/dashboard') {
      const range = url.searchParams.get('range') === 'week' ? 'week' : 'today';
      const initialSummary = summarizeAlerts(readAlertEvents(alertsLogPath), { range });
      const html = renderDashboardHtml({
        initialSummary,
        watchFixtures: loadWatchFixtures(fixturesDir),
        coverageGrid: loadCoverageGrid(fixturesDir),
      });
      return sendHtml(res, html);
    }

    if (req.method === 'POST' && pathname === '/alerts/action') {
      try {
        const body = await readJsonBody(req);
        const action = String(body?.action || '').trim().toLowerCase();
        if (!VALID_ACTIONS.has(action)) {
          return sendJson(res, 400, {
            error: `Invalid action "${body?.action}"; expected one of: ${[...VALID_ACTIONS].join(', ')}`,
          });
        }
        const event = {
          time: new Date().toISOString(),
          patientPseudonym: String(body?.patientPseudonym || 'demo-001').trim(),
          drug: String(body?.drug || 'Unknown').trim(),
          gene: String(body?.gene || 'Unknown').trim(),
          phenotype: String(body?.phenotype || 'Unknown').trim(),
          cardId: String(body?.cardId || '').trim() || 'manual',
          action,
          backwardSweep: Boolean(body?.backwardSweep),
          phenoconversionApplied: Boolean(body?.phenoconversionApplied),
          mock: true,
        };
        appendAlertEvents(alertsLogPath, [event]);
        return sendJson(res, 201, { ok: true, event });
      } catch (err) {
        return sendJson(res, Number(err?.statusCode) || 500, {
          error: err?.message || 'Internal server error',
        });
      }
    }

    if (req.method === 'POST' && pathname.startsWith('/cds-services/')) {
      const serviceId = pathname.slice('/cds-services/'.length);
      try {
        const body = await readJsonBody(req);
        const result = await handleHookRequest(serviceId, body, deps);
        const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;

        return sendJson(
          res,
          200,
          { cards: result.cards },
          {
            'X-Meyar-Latency-Ms': elapsedMs.toFixed(2),
            'X-Meyar-Phenotype-Source': result.phenotypeSource,
            'X-Meyar-Backward-Sweep': String(Boolean(result.backwardSweepRan)),
          }
        );
      } catch (err) {
        const status = err instanceof NonGermlineSampleError
          ? 422
          : Number(err?.statusCode) || 500;
        return sendJson(res, status, {
          error: err?.message || 'Internal server error',
        });
      }
    }

    return sendJson(res, 404, { error: 'Not Found' });
  }
}

// Start the server when run directly (`node server.js` or `node cds/server.js`).
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const server = createCdsServer();
  server.listen(port, host, () => {
    console.log(
      `meyar-cds (CDS Hooks 2.0.1) listening on http://${host}:${port} (FHIR_BASE=${resolveFhirBase()})`
    );
  });
}
