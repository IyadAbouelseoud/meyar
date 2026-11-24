/**
 * Browser-side A7 phenoconversion lookup for Medication Passport (C9).
 * Ports engine/phenoconvert.py with zero network calls:
 * - CYP2D6: CPIC allele activity values, Thomas et al. 2020 multipliers
 *   (x0.5 moderate, x0 strong), Caudle et al. 2020 consensus thresholds.
 * - Other CYP genes: never compute an activity score; flag applied: true
 *   ("may be affected by <drug>") while leaving effectivePhenotype unchanged.
 * - A8 SV gate: genes in tables/sv_genes.json with not-assessed / null
 *   phenotype are never phenoconverted or guessed.
 */

import inhibitorsTable from '@tables/cyp_inhibitors.json';
import svTable from '@tables/sv_genes.json';
import arLocale from './i18n/ar.json';

const THOMAS_METHOD = 'Thomas et al. 2020';
const NON_SCORED_METHOD = 'FDA clinical inhibitor table (no score)';
const UNSCORABLE_PHENOTYPES = new Set(['no result', 'indeterminate', 'unknown', '']);
const STRENGTH_RANK = { moderate: 1, strong: 2 };

// CPIC CYP2D6 Allele Functionality Reference Table numeric activity values
// (https://api.cpicpgx.org/v1/allele?genesymbol=eq.CYP2D6, cited in docs/sources.md).
export const CYP2D6_ALLELE_ACTIVITY_VALUES = new Map([
  ['*1', 1.0],
  ['*1x2', 2.0],
  ['*2', 1.0],
  ['*2x2', 2.0],
  ['*3', 0.0],
  ['*3x2', 0.0],
  ['*4', 0.0],
  ['*4x2', 0.0],
  ['*4x≥3', 0.0],
  ['*5', 0.0],
  ['*6', 0.0],
  ['*6x2', 0.0],
  ['*7', 0.0],
  ['*8', 0.0],
  ['*9', 0.25],
  ['*9x2', 0.5],
  ['*10', 0.25],
  ['*10x2', 0.5],
  ['*11', 0.0],
  ['*12', 0.0],
  ['*13', 0.0],
  ['*13+*1', 1.0],
  ['*13+*1x2', 2.0],
  ['*13+*2', 1.0],
  ['*13+*68x2+*4', 0.0],
  ['*14', 0.5],
  ['*15', 0.0],
  ['*17', 0.5],
  ['*17x2', 1.0],
  ['*18', 0.0],
  ['*19', 0.0],
  ['*20', 0.0],
  ['*21', 0.0],
  ['*27', 1.0],
  ['*27x2', 2.0],
  ['*29', 0.5],
  ['*29x2', 1.0],
  ['*31', 0.0],
  ['*32', 0.25],
  ['*33', 1.0],
  ['*34', 1.0],
  ['*35', 1.0],
  ['*35x2', 2.0],
  ['*36', 0.0],
  ['*36+*10', 0.25],
  ['*36+*10x2', 0.5],
  ['*36x2', 0.0],
  ['*36x2+*10', 0.25],
  ['*36x2+*10x2', 0.5],
  ['*38', 0.0],
  ['*39', 1.0],
  ['*40', 0.0],
  ['*41', 0.25],
  ['*41x2', 0.5],
  ['*41x3', 0.75],
  ['*42', 0.0],
  ['*44', 0.0],
  ['*45', 1.0],
  ['*45x2', 2.0],
  ['*46', 1.0],
  ['*47', 0.0],
  ['*48', 1.0],
  ['*49', 0.5],
  ['*50', 0.5],
  ['*51', 0.0],
  ['*52', 0.25],
  ['*53', 1.0],
  ['*54', 0.5],
  ['*55', 0.5],
  ['*56', 0.0],
  ['*59', 0.5],
  ['*60', 0.0],
  ['*62', 0.0],
  ['*68', 0.0],
  ['*68+*2', 1.0],
  ['*68+*4', 0.0],
  ['*69', 0.0],
  ['*81', 0.0],
  ['*91', 0.25],
  ['*92', 0.0],
  ['*96', 0.0],
  ['*99', 0.0],
  ['*100', 0.0],
  ['*101', 0.0],
  ['*109', 0.25],
  ['*114', 0.0],
  ['*119', 0.25],
  ['*120', 0.0],
  ['*124', 0.0],
  ['*129', 0.0],
  ['*132', 0.25],
  ['*143', 0.0],
  ['*144', 0.0],
  ['*156', 0.0],
  ['*161', 0.0],
]);

const COPY_RE = /^(\*\d+)x(\d+)$/;

function normArabicToken(raw) {
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  s = s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ڤ/g, 'ف')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.startsWith('ال') && s.length >= 4) s = s.slice(2);
  return s;
}

const AR_TO_EN_DRUGS = (() => {
  const map = new Map();
  for (const [enName, arName] of Object.entries(arLocale.drugs || {})) {
    map.set(normArabicToken(arName), enName.toLowerCase());
  }
  const extra = [
    ['فلوكستين', 'fluoxetine'],
    ['فلوكسيتين', 'fluoxetine'],
    ['بوبروبيون', 'bupropion'],
    ['كوينيدين', 'quinidine'],
    ['تيربينافين', 'terbinafine'],
    ['أبيراتيرون', 'abiraterone'],
    ['سيناكالسيت', 'cinacalcet'],
    ['ميرابيغرون', 'mirabegron'],
    ['رولابيتانت', 'rolapitant'],
    ['لوركاسيرين', 'lorcaserin'],
    ['فلوكونازول', 'fluconazole'],
    ['فوريكونازول', 'voriconazole'],
    ['تيكلوبيدين', 'ticlopidine'],
    ['سينوبامات', 'cenobamate'],
    ['فيلبامات', 'felbamate'],
    ['أميودارون', 'amiodarone'],
    ['سيميتيدين', 'cimetidine'],
    ['اسيتالوبرام', 'escitalopram'],
    ['إسيتالوبرام', 'escitalopram'],
    ['سيرترالين', 'sertraline'],
    ['لابيتالول', 'labetalol'],
    ['كودين', 'codeine'],
  ];
  for (const [arName, enName] of extra) {
    map.set(normArabicToken(arName), enName);
  }
  return map;
})();

/**
 * Normalize an English or Arabic medicine name to a canonical lowercase English INN when known.
 */
export function canonicalDrugName(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  const arNorm = normArabicToken(trimmed);
  if (AR_TO_EN_DRUGS.has(arNorm)) {
    return AR_TO_EN_DRUGS.get(arNorm);
  }
  return lower;
}

export function parseCyp2d6AlleleScore(allele) {
  const cleaned = String(allele || '').trim();
  if (!cleaned || cleaned === 'Unknown' || cleaned === 'No Result') return null;
  if (CYP2D6_ALLELE_ACTIVITY_VALUES.has(cleaned)) {
    return CYP2D6_ALLELE_ACTIVITY_VALUES.get(cleaned);
  }
  const match = COPY_RE.exec(cleaned);
  if (match) {
    const baseScore = CYP2D6_ALLELE_ACTIVITY_VALUES.get(match[1]);
    if (baseScore !== undefined) {
      return Math.round(baseScore * Number(match[2]) * 1e6) / 1e6;
    }
  }
  return null;
}

export function computeCyp2d6ActivityScore(diplotype) {
  const parts = String(diplotype || '')
    .split('/')
    .map((p) => p.trim());
  if (parts.length !== 2) return null;
  const s1 = parseCyp2d6AlleleScore(parts[0]);
  const s2 = parseCyp2d6AlleleScore(parts[1]);
  if (s1 === null || s2 === null) return null;
  return Math.round((s1 + s2) * 1e6) / 1e6;
}

/** Map CYP2D6 activity score to CPIC consensus phenotype (Caudle et al. 2020). */
export function activityScoreToCyp2d6Phenotype(score) {
  if (score < 0) throw new Error(`CYP2D6 activity score cannot be negative: ${score}`);
  if (score === 0) return 'Poor Metabolizer';
  if (score < 1.25) return 'Intermediate Metabolizer';
  if (score <= 2.25) return 'Normal Metabolizer';
  return 'Ultrarapid Metabolizer';
}

function buildInhibitorIndex(rows = inhibitorsTable.rows || []) {
  const byEnzymeDrug = new Map();
  for (const row of rows) {
    const enzyme = String(row.enzyme || '').trim().toUpperCase();
    const drug = String(row.drug || '').trim().toLowerCase();
    const strength = String(row.strength || '').trim().toLowerCase();
    if (!enzyme || !drug) continue;
    byEnzymeDrug.set(`${enzyme}|${drug}`, strength);
  }
  return byEnzymeDrug;
}

const DEFAULT_INHIBITOR_INDEX = buildInhibitorIndex();
const DEFAULT_SV_GENES = new Set(
  (svTable.rows || [])
    .filter((r) => r.callableFromVcf === false)
    .map((r) => String(r.gene || '').trim().toUpperCase())
);

function collectGeneInhibitors(geneSymbol, medications, inhibitorIndex) {
  const enzyme = String(geneSymbol || '').trim().toUpperCase();
  const causes = [];
  const seen = new Set();
  let strongest = null;

  for (const med of medications) {
    const canon = canonicalDrugName(med?.name);
    if (!canon) continue;
    const strength = inhibitorIndex.get(`${enzyme}|${canon}`);
    if (!strength || (strength !== 'strong' && strength !== 'moderate')) {
      continue;
    }
    if (!strongest || STRENGTH_RANK[strength] > STRENGTH_RANK[strongest]) {
      strongest = strength;
    }
    if (!seen.has(canon)) {
      seen.add(canon);
      causes.push(canon);
    }
  }
  return { causes, strongest };
}

/**
 * Merge base contract medications with patient-entered medications (no duplicates).
 */
export function mergeCurrentMedications(baseMeds = [], extraMeds = []) {
  const merged = [];
  const seen = new Set();

  for (const item of baseMeds || []) {
    const name = String(item?.name || '').trim();
    if (!name) continue;
    const key = canonicalDrugName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      name: key,
      ...(item.rxnorm ? { rxnorm: String(item.rxnorm) } : {}),
      source: item.source === 'patient-entered' ? 'patient-entered' : 'hospital-record',
      mock: item.mock !== undefined ? Boolean(item.mock) : true,
    });
  }

  for (const item of extraMeds || []) {
    const rawName = typeof item === 'string' ? item : item?.name;
    const trimmed = String(rawName || '').trim();
    if (!trimmed) continue;
    const key = canonicalDrugName(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      name: key,
      ...(item?.rxnorm ? { rxnorm: String(item.rxnorm) } : {}),
      source: 'patient-entered',
      mock: true,
    });
  }

  return merged;
}

/**
 * Re-run A7 phenoconversion in the browser on a contract + optional extra medications.
 * Returns a fresh contract copy; never mutates the input contract or genetic phenotype.
 */
export function applyPhenoconversion(contract, extraMedications = [], options = {}) {
  if (!contract || contract.sampleOrigin !== 'germline') {
    // Mirrors engine/phenoconvert.py: refuse anything that is not germline (A6).
    throw new Error(`Refusing non-germline contract: sampleOrigin=${contract?.sampleOrigin}`);
  }

  const inhibitorIndex = options.inhibitorRows
    ? buildInhibitorIndex(options.inhibitorRows)
    : DEFAULT_INHIBITOR_INDEX;
  const svGenes = options.svGenes || DEFAULT_SV_GENES;

  const currentMedications = mergeCurrentMedications(
    contract.currentMedications || [],
    extraMedications
  );

  const genes = (contract.genes || []).map((geneEntry) => {
    const g = { ...geneEntry };
    const geneSymbol = String(g.gene || '').trim();
    const isSvUnassessed = g.callability?.method === 'not-assessed'
      || g.phenotype === null
      || g.phenotype === undefined
      || (svGenes.has(geneSymbol.toUpperCase()) && g.callability?.method !== 'outside-call');

    if (isSvUnassessed) {
      delete g.effectivePhenotype;
      g.phenoconversion = {
        applied: false,
        cause: [],
        inhibitorStrength: null,
        geneticActivityScore: null,
        adjustedActivityScore: null,
      };
      return g;
    }

    const geneticPhenotype = String(g.phenotype).trim();
    const { causes, strongest } = collectGeneInhibitors(geneSymbol, currentMedications, inhibitorIndex);

    if (geneSymbol.toUpperCase() === 'CYP2D6') {
      const geneticAS = computeCyp2d6ActivityScore(g.diplotype)
        ?? (Number.isFinite(Number(g.phenoconversion?.geneticActivityScore))
          ? Number(g.phenoconversion.geneticActivityScore)
          : null);

      if (geneticAS === null || UNSCORABLE_PHENOTYPES.has(geneticPhenotype.toLowerCase())) {
        g.effectivePhenotype = geneticPhenotype;
        g.phenoconversion = {
          applied: false,
          cause: [],
          inhibitorStrength: null,
          geneticActivityScore: null,
          adjustedActivityScore: null,
          method: THOMAS_METHOD,
        };
        return g;
      }

      if (!strongest) {
        g.effectivePhenotype = geneticPhenotype;
        g.phenoconversion = {
          applied: false,
          cause: [],
          inhibitorStrength: null,
          geneticActivityScore: geneticAS,
          adjustedActivityScore: geneticAS,
          method: THOMAS_METHOD,
        };
        return g;
      }

      const factor = strongest === 'strong' ? 0 : 0.5;
      const adjustedAS = Math.round(geneticAS * factor * 1e6) / 1e6;
      g.effectivePhenotype = activityScoreToCyp2d6Phenotype(adjustedAS);
      g.phenoconversion = {
        applied: true,
        cause: causes,
        inhibitorStrength: strongest,
        geneticActivityScore: geneticAS,
        adjustedActivityScore: adjustedAS,
        method: THOMAS_METHOD,
      };
      return g;
    }

    // Non-CYP2D6 genes: never compute an activity score; flag if strong/moderate inhibitor present.
    g.effectivePhenotype = geneticPhenotype;
    if (strongest && !UNSCORABLE_PHENOTYPES.has(geneticPhenotype.toLowerCase())) {
      g.phenoconversion = {
        applied: true,
        cause: causes,
        inhibitorStrength: strongest,
        geneticActivityScore: null,
        adjustedActivityScore: null,
        method: NON_SCORED_METHOD,
      };
    } else {
      g.phenoconversion = {
        applied: false,
        cause: [],
        inhibitorStrength: null,
        geneticActivityScore: null,
        adjustedActivityScore: null,
      };
    }
    return g;
  });

  return {
    ...contract,
    currentMedications,
    genes,
  };
}
