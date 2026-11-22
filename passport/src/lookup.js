import cpicTable from '@tables/cpic_recommendations.json';
import saudiFreqs from '@tables/saudi_frequencies.json';

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

function classifyRow(row) {
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
 * Look up CPIC recommendations for a gene using its effectivePhenotype (if present) or phenotype.
 * Returns [] if the gene is not-assessed or has no phenotype. Never invents recommendations.
 */
export function getDrugsForGene(geneObj) {
  if (geneObj.callability?.method === 'not-assessed') return [];
  const activePhenotype = geneObj.effectivePhenotype || geneObj.phenotype;
  if (!activePhenotype || /indeterminate|not assessed/i.test(activePhenotype)) return [];

  const targetScore = geneObj.phenoconversion?.applied && geneObj.phenoconversion?.adjustedActivityScore != null
    ? String(geneObj.phenoconversion.adjustedActivityScore.toFixed(1))
    : null;

  const matching = cpicRows.filter(
    (r) => r.gene === geneObj.gene && r.phenotype === activePhenotype
  );

  // Deduplicate by drug; prefer non-pediatric rows, general/CVI ACS PCI, and matching adjustedActivityScore.
  const byDrug = new Map();
  for (const row of matching) {
    const existing = byDrug.get(row.drug);
    if (!existing) {
      byDrug.set(row.drug, row);
    } else if (
      (targetScore && row.activityScore === targetScore)
      || (existing.population && /pediatric/i.test(existing.population) && !/pediatric/i.test(row.population || ''))
      || (row.population === 'general' && existing.population !== 'general')
      || (row.population === 'CVI ACS PCI' && existing.population !== 'general')
    ) {
      byDrug.set(row.drug, row);
    }
  }

  return Array.from(byDrug.values()).map((row) => ({
    drug: row.drug,
    rxnorm: row.rxnorm,
    status: classifyRow(row),
    implication: row.implication,
    recommendation: row.recommendation,
    classification: row.classification,
    alternatives: Array.isArray(row.alternatives)
      ? row.alternatives.map((a) => (typeof a === 'string' ? a : a?.drug)).filter(Boolean)
      : [],
    guideline: row.guideline || null,
  }));
}

/**
 * Check whether a current medication is named as a phenoconversion cause in any gene.
 */
export function isMedCausingShift(medName, genes) {
  const lower = String(medName || '').toLowerCase();
  return genes.some(
    (g) => g.phenoconversion?.applied
      && Array.isArray(g.phenoconversion.cause)
      && g.phenoconversion.cause.some((c) => c.toLowerCase() === lower)
  );
}
