// CPIC recommendation table loader, medication extraction, and exact lookup.
// Every dosing recommendation and alternative comes verbatim from
// tables/cpic_recommendations.json (owner B1). No model-generated dosing.

import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolve the tables directory: container mount `/data/tables` first,
 * then `<repo>/tables` relative to `cds/lib/`.
 */
export function resolveTablesDir(overrideDir) {
  if (overrideDir) return overrideDir;
  if (process.env.TABLES_DIR) return process.env.TABLES_DIR;
  if (fs.existsSync('/data/tables/cpic_recommendations.json')) {
    return '/data/tables';
  }
  return path.resolve(import.meta.dirname, '..', '..', 'tables');
}

/**
 * Load and index `tables/cpic_recommendations.json` and `tables/sv_genes.json`.
 */
export function loadClinicalTables(tablesDir = resolveTablesDir()) {
  const cpicPath = path.join(tablesDir, 'cpic_recommendations.json');
  const svPath = path.join(tablesDir, 'sv_genes.json');

  const cpicRaw = JSON.parse(fs.readFileSync(cpicPath, 'utf8'));
  const rows = Array.isArray(cpicRaw.rows) ? cpicRaw.rows : [];

  const byDrug = new Map();
  const rxnormToDrug = new Map();
  const drugGenes = new Map();

  for (const row of rows) {
    const drug = String(row.drug || '').trim().toLowerCase();
    const gene = String(row.gene || '').trim().toUpperCase();
    if (!drug || !gene) continue;

    if (!byDrug.has(drug)) byDrug.set(drug, []);
    byDrug.get(drug).push(row);

    if (row.rxnorm) {
      rxnormToDrug.set(String(row.rxnorm).trim(), drug);
    }

    if (!drugGenes.has(drug)) drugGenes.set(drug, new Set());
    drugGenes.get(drug).add(gene);
  }

  const svGenes = new Map();
  if (fs.existsSync(svPath)) {
    const svRaw = JSON.parse(fs.readFileSync(svPath, 'utf8'));
    for (const row of svRaw.rows || []) {
      const gene = String(row.gene || '').trim().toUpperCase();
      if (gene && row.callableFromVcf === false) {
        svGenes.set(gene, row);
      }
    }
  }

  return {
    tablesDir,
    rows,
    byDrug,
    rxnormToDrug,
    drugGenes,
    knownDrugs: [...byDrug.keys()],
    svGenes,
  };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match a MedicationRequest (or medication text/codings) to a drug name in
 * `tables/cpic_recommendations.json`.
 */
export function matchDrugInTable(medInfo, tables) {
  for (const code of medInfo.rxnormCodes || []) {
    const hit = tables.rxnormToDrug.get(String(code).trim());
    if (hit) return hit;
  }

  const haystack = [medInfo.display, ...(medInfo.texts || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!haystack) return null;

  for (const drug of tables.knownDrugs) {
    const pattern = new RegExp(`\\b${escapeRegExp(drug)}\\b`, 'i');
    if (pattern.test(haystack)) {
      return drug;
    }
  }
  return null;
}

/**
 * Extract medication details from a FHIR R4 MedicationRequest resource.
 */
export function extractMedicationFromRequest(medReq) {
  if (!medReq || medReq.resourceType !== 'MedicationRequest') return null;

  let concept = medReq.medicationCodeableConcept;
  if (!concept && medReq.medicationReference?.reference && Array.isArray(medReq.contained)) {
    const refId = medReq.medicationReference.reference.replace(/^#/, '');
    const contained = medReq.contained.find(
      (r) => r && r.resourceType === 'Medication' && r.id === refId
    );
    if (contained?.code) concept = contained.code;
  }

  const rxnormCodes = [];
  const texts = [];
  let display = '';

  if (concept) {
    if (concept.text) {
      texts.push(String(concept.text));
      display = String(concept.text);
    }
    for (const coding of concept.coding || []) {
      if (coding.display) {
        texts.push(String(coding.display));
        if (!display) display = String(coding.display);
      }
      const sys = String(coding.system || '').toLowerCase();
      if (coding.code && (sys.includes('rxnorm') || sys === '')) {
        rxnormCodes.push(String(coding.code));
      }
    }
  }

  const reasonTexts = [];
  for (const rc of medReq.reasonCode || []) {
    if (rc?.text) reasonTexts.push(String(rc.text));
    for (const c of rc?.coding || []) {
      if (c?.display) reasonTexts.push(String(c.display));
      if (c?.code) reasonTexts.push(String(c.code));
    }
  }

  return {
    orderId: medReq.id || null,
    display: display || rxnormCodes[0] || 'Unknown medication',
    rxnormCodes,
    texts,
    reasonText: reasonTexts.join(' ').toLowerCase(),
  };
}

/**
 * Extract draft MedicationRequests from CDS Hooks `context.draftOrders`
 * (optionally filtered by `context.selections` for `order-select`).
 */
export function extractDraftMedications(context) {
  const bundle = context?.draftOrders;
  if (!bundle || typeof bundle !== 'object') return [];

  const entries = Array.isArray(bundle.entry) ? bundle.entry : [];
  const selections = Array.isArray(context?.selections) && context.selections.length > 0
    ? new Set(context.selections.map((s) => String(s).trim()))
    : null;

  const meds = [];
  for (const entry of entries) {
    const res = entry?.resource;
    if (!res || res.resourceType !== 'MedicationRequest') continue;

    if (selections) {
      const ref = res.id ? `MedicationRequest/${res.id}` : null;
      const fullUrl = entry.fullUrl || null;
      const selected =
        (ref && selections.has(ref)) ||
        (res.id && selections.has(String(res.id))) ||
        (fullUrl && selections.has(fullUrl));
      if (!selected) continue;
    }

    const parsed = extractMedicationFromRequest(res);
    if (parsed) meds.push(parsed);
  }
  return meds;
}

/**
 * Infer CPIC population when a drug has indication-stratified rows (e.g. clopidogrel).
 */
function choosePopulation(candidates, reasonText = '') {
  const populations = [...new Set(candidates.map((r) => r.population))];
  if (populations.length <= 1) return populations[0] || 'general';

  const r = String(reasonText || '').toLowerCase();
  if (populations.includes('NVI') && /\b(stroke|tia|neurovascular|ischemic|carotid|nvi)\b/.test(r)) {
    return 'NVI';
  }
  if (
    populations.includes('CVI non-ACS non-PCI') &&
    /\b(non-acs|non-pci|pad|peripheral arterial|stable coronary)\b/.test(r)
  ) {
    return 'CVI non-ACS non-PCI';
  }
  if (populations.includes('CVI ACS PCI')) {
    return 'CVI ACS PCI';
  }
  if (populations.includes('general')) {
    return 'general';
  }
  return populations[0];
}

function normalizeScore(score) {
  if (score === null || score === undefined || score === '' || score === '-' || score === 'n/a') {
    return null;
  }
  const num = Number(score);
  return Number.isFinite(num) ? num : null;
}

/**
 * Look up the matching CPIC recommendation row for (drug, gene, phenotype).
 * Returns null if no exact CPIC row exists. Never invents recommendations.
 */
export function lookupCpicRow(tables, { drug, gene, phenotype, activityScore = null, reasonText = '' }) {
  if (!drug || !gene || !phenotype) return null;

  const drugRows = tables.byDrug.get(String(drug).toLowerCase());
  if (!drugRows || drugRows.length === 0) return null;

  const targetGene = String(gene).toUpperCase();
  const targetPheno = String(phenotype).trim().toLowerCase();

  const matching = drugRows.filter(
    (r) =>
      String(r.gene).toUpperCase() === targetGene &&
      String(r.phenotype).trim().toLowerCase() === targetPheno
  );

  if (matching.length === 0) return null;

  const pop = choosePopulation(matching, reasonText);
  const popRows = matching.filter((r) => r.population === pop);
  const pool = popRows.length > 0 ? popRows : matching;

  if (pool.length === 1) return pool[0];

  // Match activity score when available (e.g., CYP2D6 phenoconversion adjustedActivityScore).
  const targetScore = normalizeScore(activityScore);
  if (targetScore !== null) {
    const exactScore = pool.find((r) => normalizeScore(r.activityScore) === targetScore);
    if (exactScore) return exactScore;

    // Nearest numeric score within the same phenotype bucket (e.g. >=3.0 mapped to 3.0).
    let best = null;
    let bestDiff = Infinity;
    for (const r of pool) {
      const s = normalizeScore(r.activityScore);
      if (s === null) continue;
      const diff = Math.abs(s - targetScore);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = r;
      }
    }
    if (best) return best;
  }

  return pool[0];
}
