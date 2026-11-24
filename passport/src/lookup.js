import cpicTable from '@tables/cpic_recommendations.json';
import saudiFreqs from '@tables/saudi_frequencies.json';
import { canonicalDrugName } from './phenoconvert.js';

const cpicRows = cpicTable.rows || [];
const freqRows = saudiFreqs.rows || [];

/**
 * Look up Saudi data tier (T0 / T1 / T2) from the contract or tables/saudi_frequencies.json.
 */
export function getTierInfo(geneObj) {
  const covTier = geneObj.coverage?.saudiDataTier;
  const freqEntry = freqRows.find((r) => r.gene === geneObj.gene);
  const tier = covTier !== undefined && covTier !== null
    ? covTier
    : (freqEntry ? freqEntry.saudiDataTier : 2);
  const note = geneObj.coverage?.saudiDataNote
    || freqEntry?.saudiDataNote
    || (tier === 2 ? 'Tier 2: no published Saudi frequency (Goljan et al. 2022)' : '');
  return {
    tier,
    note,
    coverageStatement: saudiFreqs._coverageStatement || '',
  };
}

export function classifyRow(row) {
  const rec = (row.recommendation || '').toLowerCase();
  const hasAlts = Array.isArray(row.alternatives) && row.alternatives.length > 0;
  if (hasAlts || /\b(avoid|contraindicated|alternative|do not use)\b/.test(rec)) {
    return 'stop';
  }
  if (/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(rec)) {
    return 'ask';
  }
  return 'none';
}

/**
 * Pick the best matching CPIC row from an array of rows for the same drug + gene + phenotype.
 */
export function pickBestCpicRow(matching, geneObj) {
  const rawScore = geneObj?.phenoconversion?.applied ? geneObj?.phenoconversion?.adjustedActivityScore : null;
  const targetScores = rawScore != null ? new Set([String(rawScore), rawScore.toFixed(1)]) : null;

  let best = null;
  for (const row of matching) {
    if (!best) {
      best = row;
    } else if (
      (targetScores && targetScores.has(String(row.activityScore)))
      || (best.population && /pediatric/i.test(best.population) && !/pediatric/i.test(row.population || ''))
      || (row.population === 'general' && best.population !== 'general')
      || (row.population === 'CVI ACS PCI' && best.population !== 'general')
    ) {
      best = row;
    }
  }
  return best;
}

/**
 * Look up CPIC recommendations for a gene using its effectivePhenotype (if present) or phenotype.
 * Returns [] if the gene is not-assessed or has no phenotype. Never invents recommendations.
 */
export function getDrugsForGene(geneObj) {
  if (geneObj.callability?.method === 'not-assessed') return [];
  const activePhenotype = geneObj.effectivePhenotype || geneObj.phenotype;
  if (!activePhenotype || /indeterminate|not assessed/i.test(activePhenotype)) return [];

  const matching = cpicRows.filter(
    (r) => r.gene === geneObj.gene && r.phenotype === activePhenotype
  );

  // Group by drug and pick best row per drug using shared helper.
  const byDrugRows = new Map();
  for (const row of matching) {
    if (!byDrugRows.has(row.drug)) byDrugRows.set(row.drug, []);
    byDrugRows.get(row.drug).push(row);
  }

  return Array.from(byDrugRows.values()).map((rows) => {
    const row = pickBestCpicRow(rows, geneObj);
    return {
      drug: row.drug,
      rxnorm: row.rxnorm,
      status: classifyRow(row),
      implication: row.implication,
      recommendation: row.recommendation,
      classification: row.classification,
      alternatives: Array.isArray(row.alternatives)
        ? row.alternatives.map((a) => (typeof a === 'string' ? a : (a?.drug || a?.drugClass))).filter(Boolean)
        : [],
      guideline: row.guideline || null,
    };
  });
}

/**
 * Check whether a current medication is named as a phenoconversion cause in any gene.
 */
export function isMedCausingShift(medName, genes) {
  const canon = canonicalDrugName(medName);
  return genes.some(
    (g) => g.phenoconversion?.applied
      && Array.isArray(g.phenoconversion.cause)
      && g.phenoconversion.cause.some((c) => canonicalDrugName(c) === canon)
  );
}

/**
 * Return the list of genes affected by a current medication.
 */
export function getShiftedGenesForMed(medName, genes) {
  const canon = canonicalDrugName(medName);
  return genes
    .filter(
      (g) => g.phenoconversion?.applied
        && Array.isArray(g.phenoconversion.cause)
        && g.phenoconversion.cause.some((c) => canonicalDrugName(c) === canon)
    )
    .map((g) => g.gene);
}

/**
 * Split the genes a current medication affects into scored (CYP2D6 activity
 * score shifted, Thomas et al. 2020) and flagged-only (non-CYP2D6, no score).
 */
export function getMedGeneEffects(medName, genes) {
  const canon = canonicalDrugName(medName);
  const scored = [];
  const flagged = [];
  for (const g of genes) {
    const pc = g.phenoconversion;
    if (!pc?.applied || !Array.isArray(pc.cause)) continue;
    if (!pc.cause.some((c) => canonicalDrugName(c) === canon)) continue;
    (pc.adjustedActivityScore != null ? scored : flagged).push(g.gene);
  }
  return { scored, flagged };
}
