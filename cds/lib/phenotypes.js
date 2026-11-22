// Phenotype resolver: Prefetch -> Local HAPI FHIR -> Contract JSON fallback.
// Enforces A6 (germline-only gate) and A8 (structural-variation gene safety).
// Never calls public hapi.fhir.org (AGENTS.md §4).

import fs from 'node:fs';
import path from 'node:path';
import { extractCurrentMedicationsFromBundle } from './cpic.js';

const LOINC_GENE = '48018-6';
const LOINC_GENOMIC_SOURCE_CLASS = '48002-0';
const LOINC_CLINICAL_SIGNIFICANCE = '53037-8';
const LOINC_GERMLINE_CODE = 'LA6683-2';

const SAFE_PATIENT_ID = /^[A-Za-z0-9._-]+$/;

// FHIR search for Meyar genotype Observations (LOINC 84413-4 "Genotype display
// name", as written by engine/load_fhir.py). Filtering by code keeps unrelated
// Observations (vitals, labs) from crowding PGx results out of the first page.
export const PGX_OBSERVATION_QUERY = 'code=http://loinc.org%7C84413-4&_count=100';

export class NonGermlineSampleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonGermlineSampleError';
    this.statusCode = 422;
  }
}

export function resolveContractsDir(overrideDir) {
  if (overrideDir) return overrideDir;
  if (process.env.CONTRACTS_DIR) return process.env.CONTRACTS_DIR;
  if (fs.existsSync('/data/contracts')) return '/data/contracts';
  return path.resolve(import.meta.dirname, '..', '..', 'engine', 'data', 'out');
}

export function resolveFixturesDir(overrideDir) {
  if (overrideDir) return overrideDir;
  if (process.env.FIXTURES_DIR) return process.env.FIXTURES_DIR;
  if (fs.existsSync('/data/fixtures')) return '/data/fixtures';
  return path.resolve(import.meta.dirname, '..', '..', 'docs', 'fixtures');
}

export function resolveFhirBase(overrideBase) {
  const base = overrideBase ?? process.env.FHIR_BASE ?? 'http://localhost:8080/fhir';
  return String(base).replace(/\/+$/, '');
}

/**
 * Guard against ever contacting the public hapi.fhir.org server (AGENTS.md §4).
 */
export function isForbiddenPublicFhir(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.toLowerCase().endsWith('hapi.fhir.org');
  } catch {
    return false;
  }
}

function findComponent(observation, loincCode) {
  const comps = Array.isArray(observation?.component) ? observation.component : [];
  return comps.find((c) =>
    (c?.code?.coding || []).some((coding) => coding?.code === loincCode)
  );
}

function isGermlineObservation(observation) {
  const sourceComp = findComponent(observation, LOINC_GENOMIC_SOURCE_CLASS);
  if (!sourceComp) return { ok: false, reason: 'missing-source-class' };

  const vcc = sourceComp.valueCodeableConcept || {};
  const codings = Array.isArray(vcc.coding) ? vcc.coding : [];
  const hasGermlineCode = codings.some(
    (c) =>
      String(c?.code || '').toUpperCase() === LOINC_GERMLINE_CODE ||
      String(c?.display || '').trim().toLowerCase() === 'germline'
  );
  const textIsGermline = String(vcc.text || '').trim().toLowerCase() === 'germline';

  if (hasGermlineCode || textIsGermline) {
    return { ok: true, isSomatic: false };
  }
  return {
    ok: false,
    isSomatic: true,
    value: vcc.text || codings[0]?.display || codings[0]?.code || 'non-germline',
  };
}

/**
 * Parse a FHIR R4 Genomics Reporting IG Observation (as written by engine/load_fhir.py)
 * into a Meyar per-gene record.
 */
export function parseFhirObservation(observation, svGenes = new Map()) {
  if (!observation || observation.resourceType !== 'Observation') return null;

  const geneComp = findComponent(observation, LOINC_GENE);
  const gene = String(geneComp?.valueCodeableConcept?.text || '').trim();
  if (!gene) return null;

  // A6 germline-only guard: never interpret non-germline observations.
  const germlineCheck = isGermlineObservation(observation);
  if (!germlineCheck.ok) {
    if (germlineCheck.isSomatic) {
      throw new NonGermlineSampleError(
        `Refusing non-germline FHIR Observation for ${gene}: genomic source class is "${germlineCheck.value}" (germline required).`
      );
    }
    return null;
  }

  const phenoComp = findComponent(observation, LOINC_CLINICAL_SIGNIFICANCE);
  const rawPhenotype = phenoComp?.valueCodeableConcept?.text
    ? String(phenoComp.valueCodeableConcept.text).trim()
    : null;
  const rawDiplotype = observation.valueCodeableConcept?.text
    ? String(observation.valueCodeableConcept.text).trim()
    : null;

  const guidelineComp = (observation.component || []).find(
    (c) => String(c?.code?.text || '').trim().toLowerCase() === 'guideline version'
  );
  const guidelineVersion = guidelineComp?.valueString
    ? String(guidelineComp.valueString).trim()
    : 'CPIC PharmCAT 3.4.0';

  let candidates = [];
  for (const note of observation.note || []) {
    const text = String(note?.text || '');
    if (text.startsWith('Candidate diplotypes:')) {
      candidates = text
        .slice('Candidate diplotypes:'.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (candidates.length === 0 && rawDiplotype) {
    candidates = [rawDiplotype];
  }

  const geneUpper = gene.toUpperCase();
  const svRow = svGenes.get(geneUpper);

  // A8 structural-variation safety: never treat an unassessed SV gene as callable from VCF.
  // PharmCAT 3.4.0 does not call CYP2D6 from a VCF (engine/run_pharmcat.sh passes no
  // research flag), so an SV-gene phenotype in the FHIR store can only have come from
  // an outside-call file (-po). When a contract exists, mergeWithContract() lets the
  // A8 contract record win, including its named (mock) caller.
  if (
    svRow &&
    (!rawPhenotype ||
      rawPhenotype.toLowerCase() === 'no result' ||
      rawDiplotype === 'Unknown/Unknown')
  ) {
    return {
      gene,
      diplotype: null,
      phenotype: null,
      candidates: [],
      coverage: {
        definingPositionsAssayed: 0,
        definingPositionsTotal: 0,
        untestedLocalAlleles: [],
        uninformativeNormalRisk: null,
        saudiDataTier: 0,
      },
      guidelineVersion,
      callability: {
        method: 'not-assessed',
        svAssessed: false,
        reason: svRow.justification,
        requiredInput: svRow.requiredInput,
      },
    };
  }

  return {
    gene,
    diplotype: rawDiplotype,
    phenotype: rawPhenotype,
    candidates,
    coverage: {
      definingPositionsAssayed: 0,
      definingPositionsTotal: 0,
      untestedLocalAlleles: [],
      uninformativeNormalRisk: null,
    },
    guidelineVersion,
    callability: svRow
      ? { method: 'outside-call', svAssessed: true }
      : { method: 'vcf', svAssessed: false },
  };
}

/**
 * Parse a FHIR Bundle of Observations (from prefetch or HAPI search response).
 */
export function parseFhirObservationBundle(bundle, svGenes = new Map()) {
  if (!bundle || typeof bundle !== 'object') return [];
  const resources =
    bundle.resourceType === 'Bundle' && Array.isArray(bundle.entry)
      ? bundle.entry.map((e) => e?.resource).filter(Boolean)
      : bundle.resourceType === 'Observation'
        ? [bundle]
        : [];

  const genes = [];
  for (const res of resources) {
    const parsed = parseFhirObservation(res, svGenes);
    if (parsed) genes.push(parsed);
  }
  return genes;
}

/**
 * Read a local `<patientId>.contract.json` from `contractsDir` or `fixturesDir`.
 * Enforces A6 germline check (`sampleOrigin === "germline"`).
 */
export function readContractFile(patientId, { contractsDir, fixturesDir } = {}) {
  if (!patientId || !SAFE_PATIENT_ID.test(patientId)) return null;

  const dirs = [resolveContractsDir(contractsDir), resolveFixturesDir(fixturesDir)];
  for (const dir of dirs) {
    if (!dir) continue;
    const candidatePath = path.join(dir, `${patientId}.contract.json`);
    if (!fs.existsSync(candidatePath)) continue;

    const contract = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    if (contract.sampleOrigin !== 'germline') {
      throw new NonGermlineSampleError(
        `Refusing non-germline contract for ${patientId}: sampleOrigin="${contract.sampleOrigin}" (germline required).`
      );
    }
    return {
      contract,
      path: candidatePath,
      source: dir === resolveContractsDir(contractsDir) ? 'contract-out' : 'contract-fixture',
    };
  }
  return null;
}

/**
 * Merge HAPI/prefetch Observation genes with enriched contract metadata
 * (A5 coverage, A7 phenoconversion/effectivePhenotype, A8 callability) without
 * replacing valid FHIR phenotypes.
 */
function mergeWithContract(fhirGenes, contractRecord, svGenes) {
  if (!contractRecord?.contract) {
    return {
      genes: fhirGenes,
      currentMedications: [],
    };
  }

  const contract = contractRecord.contract;
  const contractByGene = new Map();
  for (const g of contract.genes || []) {
    if (g?.gene) contractByGene.set(String(g.gene).toUpperCase(), g);
  }

  const merged = [];
  const seen = new Set();

  for (const fg of fhirGenes) {
    const key = String(fg.gene).toUpperCase();
    seen.add(key);
    const cg = contractByGene.get(key);
    if (!cg) {
      merged.push(fg);
      continue;
    }

    // If A8 marked this SV gene not-assessed in the contract, respect A8 and never emit a VCF phenotype.
    if (svGenes.has(key) && cg.callability?.method === 'not-assessed') {
      merged.push({ ...cg });
      continue;
    }

    merged.push({
      ...fg,
      candidates:
        Array.isArray(cg.candidates) && cg.candidates.length > fg.candidates.length
          ? cg.candidates
          : fg.candidates,
      coverage: cg.coverage || fg.coverage,
      callability: cg.callability || fg.callability,
      effectivePhenotype: cg.effectivePhenotype ?? fg.effectivePhenotype,
      phenoconversion: cg.phenoconversion ?? fg.phenoconversion,
      guidelineVersion: cg.guidelineVersion || fg.guidelineVersion,
    });
  }

  // Include contract genes not returned by FHIR (e.g., A8 not-assessed SV genes).
  for (const [key, cg] of contractByGene.entries()) {
    if (!seen.has(key)) merged.push(cg);
  }

  return {
    genes: merged,
    currentMedications: Array.isArray(contract.currentMedications)
      ? contract.currentMedications
      : [],
  };
}

/**
 * Fetch Observations for `patientId` from local HAPI FHIR with a bounded timeout.
 */
async function fetchFromHapi(patientId, { fhirBase, fhirTimeoutMs = 400, fetchImpl = fetch } = {}) {
  const base = resolveFhirBase(fhirBase);
  if (!base || isForbiddenPublicFhir(base)) return null;

  const url = `${base}/Observation?subject=Patient/${encodeURIComponent(patientId)}&${PGX_OBSERVATION_QUERY}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fhirTimeoutMs);

  try {
    const resp = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/fhir+json, application/json' },
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a patient's germline PGx profile in priority order:
 * 1. CDS Hooks `prefetch.pgxObservations`
 * 2. Local HAPI FHIR (`FHIR_BASE`)
 * 3. Fallback to `engine/data/out/<patientId>.contract.json` (or `docs/fixtures/<patientId>.contract.json`)
 */
export async function resolvePatientProfile(
  patientId,
  {
    prefetch = null,
    fhirBase,
    fhirTimeoutMs = 400,
    contractsDir,
    fixturesDir,
    svGenes = new Map(),
    fetchImpl = fetch,
  } = {}
) {
  if (!patientId) return null;

  // Read local contract once if available (used for fallback or metadata enrichment).
  const contractRecord = readContractFile(patientId, { contractsDir, fixturesDir });

  // Priority 1: Prefetch observations provided by EHR / CDS Hooks sandbox.
  if (prefetch?.pgxObservations) {
    const prefetchGenes = parseFhirObservationBundle(prefetch.pgxObservations, svGenes);
    if (prefetchGenes.length > 0) {
      const merged = mergeWithContract(prefetchGenes, contractRecord, svGenes);
      return {
        patientId,
        sampleOrigin: 'germline',
        source: 'prefetch',
        genes: merged.genes,
        currentMedications: merged.currentMedications,
      };
    }
  }

  // Priority 2: Local HAPI FHIR store (never public hapi.fhir.org).
  const hapiBundle = await fetchFromHapi(patientId, { fhirBase, fhirTimeoutMs, fetchImpl });
  if (hapiBundle) {
    const hapiGenes = parseFhirObservationBundle(hapiBundle, svGenes);
    if (hapiGenes.length > 0) {
      const merged = mergeWithContract(hapiGenes, contractRecord, svGenes);
      return {
        patientId,
        sampleOrigin: 'germline',
        source: 'hapi',
        genes: merged.genes,
        currentMedications: merged.currentMedications,
      };
    }
  }

  // Priority 3: Local contract JSON fallback.
  if (contractRecord?.contract) {
    const contract = contractRecord.contract;
    return {
      patientId: contract.patientId || patientId,
      sampleOrigin: contract.sampleOrigin,
      source: contractRecord.source,
      genes: Array.isArray(contract.genes) ? contract.genes : [],
      currentMedications: Array.isArray(contract.currentMedications)
        ? contract.currentMedications
        : [],
    };
  }

  return null;
}

/**
 * Fetch active MedicationStatements for `patientId` from local HAPI FHIR.
 */
async function fetchCurrentMedicationsFromHapi(
  patientId,
  { fhirBase, fhirTimeoutMs = 400, fetchImpl = fetch } = {}
) {
  const base = resolveFhirBase(fhirBase);
  if (!base || isForbiddenPublicFhir(base)) return null;

  const url = `${base}/MedicationStatement?subject=Patient/${encodeURIComponent(patientId)}&status=active&_count=100`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fhirTimeoutMs);

  try {
    const resp = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/fhir+json, application/json' },
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve active current medications for backward sweep in priority order:
 * 1. CDS Hooks `prefetch.currentMedications` (FHIR MedicationStatement Bundle)
 * 2. Local HAPI FHIR (`MedicationStatement?subject=Patient/<id>&status=active`)
 * 3. Contract `currentMedications[]`
 */
export async function resolveCurrentMedications(
  patientId,
  {
    prefetch = null,
    fhirBase,
    fhirTimeoutMs = 400,
    contractCurrentMedications = [],
    fetchImpl = fetch,
  } = {}
) {
  if (prefetch?.currentMedications) {
    const prefetchMeds = extractCurrentMedicationsFromBundle(prefetch.currentMedications);
    if (prefetchMeds.length > 0) {
      return { medications: prefetchMeds, source: 'prefetch' };
    }
  }

  const hapiBundle = await fetchCurrentMedicationsFromHapi(patientId, {
    fhirBase,
    fhirTimeoutMs,
    fetchImpl,
  });
  if (hapiBundle) {
    const hapiMeds = extractCurrentMedicationsFromBundle(hapiBundle);
    if (hapiMeds.length > 0) {
      return { medications: hapiMeds, source: 'hapi' };
    }
  }

  const fallbackMeds = (Array.isArray(contractCurrentMedications) ? contractCurrentMedications : [])
    .filter((m) => m && (m.name || m.rxnorm))
    .map((m) => ({
      statementId: null,
      display: String(m.name || m.rxnorm),
      rxnormCodes: m.rxnorm ? [String(m.rxnorm)] : [],
      texts: m.name ? [String(m.name)] : [],
      reasonText: '',
    }));

  return {
    medications: fallbackMeds,
    source: fallbackMeds.length > 0 ? 'contract' : 'none',
  };
}
