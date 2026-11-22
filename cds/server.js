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
  matchDrugInTable,
  lookupCpicRow,
} from './lib/cpic.js';
import {
  resolvePatientProfile,
  resolveFhirBase,
  resolveContractsDir,
  resolveFixturesDir,
  NonGermlineSampleError,
} from './lib/phenotypes.js';
import { buildCpicCard, buildNotAssessedSvCard } from './lib/cards.js';

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const DEPRECATED_HOOK = 'medication-prescribe';

export const DISCOVERY_DOCUMENT = {
  services: [
    {
      hook: 'order-sign',
      id: 'meyar-pgx',
      title: 'Meyar Pharmacogenomics Order-Sign Advisory',
      description:
        'Checks ordered medications against stored germline pharmacogenomic phenotypes (FHIR Genomics Reporting IG / Meyar contract) and CPIC guidelines at order sign. Research prototype — not for clinical use.',
      prefetch: {
        patient: 'Patient/{{context.patientId}}',
        pgxObservations: 'Observation?subject=Patient/{{context.patientId}}&_count=100',
        currentMedications: 'MedicationStatement?subject=Patient/{{context.patientId}}&status=active',
      },
    },
    {
      hook: 'order-select',
      id: 'meyar-pgx-select',
      title: 'Meyar Pharmacogenomics Order-Select Advisory',
      description:
        'Early pharmacogenomic check when a medication order is selected (order-select). Research prototype — not for clinical use.',
      prefetch: {
        patient: 'Patient/{{context.patientId}}',
        pgxObservations: 'Observation?subject=Patient/{{context.patientId}}&_count=100',
        currentMedications: 'MedicationStatement?subject=Patient/{{context.patientId}}&status=active',
      },
    },
  ],
};

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
    'Access-Control-Expose-Headers': 'X-Meyar-Latency-Ms, X-Meyar-Phenotype-Source',
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        const err = new Error('Request body exceeds limit');
        err.statusCode = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
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
  const relPath = decodeURIComponent(reqPath.slice('/design/'.length));
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

  if (!profile || draftMeds.length === 0) {
    return {
      cards: [],
      phenotypeSource: profile?.source || 'none',
    };
  }

  const geneMap = new Map();
  for (const g of profile.genes || []) {
    if (g?.gene) geneMap.set(String(g.gene).toUpperCase(), g);
  }

  const cards = [];
  const seenCardKeys = new Set();

  for (const med of draftMeds) {
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

      seenCardKeys.add(dedupeKey);
      cards.push(
        buildCpicCard({
          geneRecord,
          row,
          drugDisplay: med.display,
        })
      );
    }
  }

  return {
    cards,
    phenotypeSource: profile.source,
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
  const fhirTimeoutMs = options.fhirTimeoutMs ?? Number(process.env.FHIR_TIMEOUT_MS || 400);
  const fetchImpl = options.fetchImpl || fetch;

  const deps = {
    tables,
    fhirBase,
    contractsDir,
    fixturesDir,
    fhirTimeoutMs,
    fetchImpl,
  };

  return http.createServer(async (req, res) => {
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
  });
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
