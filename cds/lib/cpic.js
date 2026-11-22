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
 * Match a MedicationRequest (or medication text/codings) to every drug name in
 * `tables/cpic_recommendations.json` it contains. A combination product
 * (e.g. "acetaminophen and codeine") can name more than one table drug.
 */
export function matchDrugsInTable(medInfo, tables) {
  const hits = new Set();

  for (const code of medInfo.rxnormCodes || []) {
    const hit = tables.rxnormToDrug.get(String(code).trim());
    if (hit) hits.add(hit);
  }

  const haystack = [medInfo.display, ...(medInfo.texts || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack) {
    for (const drug of tables.knownDrugs) {
      const pattern = new RegExp(`\\b${escapeRegExp(drug)}\\b`, 'i');
      if (pattern.test(haystack)) hits.add(drug);
    }
  }
  return [...hits];
}

/** First table drug named by the order, or null (kept for callers that need one). */
export function matchDrugInTable(medInfo, tables) {
  return matchDrugsInTable(medInfo, tables)[0] ?? null;
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
      // Only codes that declare the RxNorm system are treated as RxCUIs; a bare
      // local code must never be mistaken for one.
      const sys = String(coding.system || '').toLowerCase();
      if (coding.code && sys.includes('rxnorm')) {
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

// Indication keywords for CPIC's indication-stratified clopidogrel rows
// (Lee et al. 2022: CVI ACS/PCI, CVI non-ACS non-PCI, NVI). Neurovascular is
// tested first because "carotid stenting" must not read as a coronary stent, and
// non-ACS before ACS because "non-ACS" contains "ACS". A bare "ischemic" is NOT a
// neurovascular keyword: "ischemic heart disease" is cardiovascular.
const INDICATION_PATTERNS = [
  [
    'NVI',
    /\b(stroke|tia|transient ischa?emic attack|neurovascular|cerebrovascular|carotid|intracranial|nvi)\b/,
  ],
  [
    'CVI non-ACS non-PCI',
    /\b(non[- ]acs|non[- ]pci|peripheral arter(y|ial) disease|pad|stable coronary|stable angina|stable cad)\b/,
  ],
  [
    'CVI ACS PCI',
    /\b(acs|acute coronary syndrome|pci|percutaneous coronary intervention|coronary stent|stemi|nstemi|myocardial infarction)\b/,
  ],
];

// Row shown when a stratified drug's order states no indication: CPIC's
// primary (ACS/PCI) table. The card marks it as assumed and lists the others.
const DEFAULT_STRATIFIED_POPULATION = 'CVI ACS PCI';

/**
 * Infer the CPIC population from the order's reason text.
 * Returns `{ population, inferred }`; `inferred` is false when the drug is
 * indication-stratified and the order did not say which indication applies.
 */
export function resolvePopulation(populations, reasonText = '') {
  const unique = [...new Set(populations)];
  if (unique.length <= 1) return { population: unique[0] || 'general', inferred: true };

  const r = String(reasonText || '').toLowerCase();
  for (const [population, pattern] of INDICATION_PATTERNS) {
    if (unique.includes(population) && pattern.test(r)) {
      return { population, inferred: true };
    }
  }

  if (unique.includes(DEFAULT_STRATIFIED_POPULATION)) {
    return { population: DEFAULT_STRATIFIED_POPULATION, inferred: false };
  }
  if (unique.includes('general')) return { population: 'general', inferred: true };
  return { population: unique[0], inferred: false };
}

function normalizeScore(score) {
  if (score === null || score === undefined || score === '' || score === '-' || score === 'n/a') {
    return null;
  }
  const num = Number(score);
  return Number.isFinite(num) ? num : null;
}

/**
 * Within one phenotype + population, pick the row for an activity score
 * (e.g. CYP2D6 phenoconversion adjustedActivityScore). Rows in a pool share a
 * phenotype, so a nearest-score pick never crosses a phenotype boundary.
 */
function pickByActivityScore(pool, activityScore) {
  if (pool.length <= 1) return pool[0] ?? null;

  const targetScore = normalizeScore(activityScore);
  if (targetScore !== null) {
    const exactScore = pool.find((r) => normalizeScore(r.activityScore) === targetScore);
    if (exactScore) return exactScore;

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

function rowsFor(tables, drug, gene, phenotype) {
  const drugRows = tables.byDrug.get(String(drug).toLowerCase()) || [];
  const targetGene = String(gene).toUpperCase();
  const targetPheno = String(phenotype).trim().toLowerCase();
  return drugRows.filter(
    (r) =>
      String(r.gene).toUpperCase() === targetGene &&
      String(r.phenotype).trim().toLowerCase() === targetPheno
  );
}

/**
 * Look up the CPIC row for (drug, gene, phenotype) and the context the card needs.
 * Returns null if no CPIC row exists. Never invents recommendations.
 *
 * `{ row, indicationInferred, otherPopulationRows, normalRecommendation }`:
 * - `indicationInferred` false: the drug is indication-stratified and the order
 *   did not state the indication, so `row` is the default population's row.
 * - `otherPopulationRows`: this phenotype's row in every other population, so an
 *   assumed indication is never shown without the alternatives' wording.
 * - `normalRecommendation`: the Normal-phenotype row's text for the same drug,
 *   gene and population (used to tell "same as normal" from "act on this").
 */
export function lookupCpic(tables, { drug, gene, phenotype, activityScore = null, reasonText = '' }) {
  if (!drug || !gene || !phenotype) return null;

  const matching = rowsFor(tables, drug, gene, phenotype);
  if (matching.length === 0) return null;

  const { population, inferred } = resolvePopulation(
    matching.map((r) => r.population),
    reasonText
  );
  const popRows = matching.filter((r) => r.population === population);
  const row = pickByActivityScore(popRows.length > 0 ? popRows : matching, activityScore);

  const otherPopulations = [...new Set(matching.map((r) => r.population))].filter(
    (p) => p !== row.population
  );
  const otherPopulationRows = otherPopulations.map((p) =>
    pickByActivityScore(
      matching.filter((r) => r.population === p),
      activityScore
    )
  );

  const normalRows = (tables.byDrug.get(String(drug).toLowerCase()) || []).filter(
    (r) =>
      String(r.gene).toUpperCase() === String(gene).toUpperCase() &&
      r.population === row.population &&
      /^normal (metabolizer|function)$/i.test(String(r.phenotype).trim())
  );

  return {
    row,
    indicationInferred: inferred,
    otherPopulationRows,
    normalRecommendation: normalRows.length > 0 ? normalRows[0].recommendation : null,
  };
}

/**
 * Back-compatible single-row lookup.
 */
export function lookupCpicRow(tables, query) {
  return lookupCpic(tables, query)?.row ?? null;
}
