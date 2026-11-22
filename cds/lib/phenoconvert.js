// A7 phenoconversion simulator for CDS Hooks order-sign inhibitor backward sweep.
// Mirrors engine/phenoconvert.py:
// - CYP2D6: CPIC allele activity values, Thomas et al. 2020 multipliers
//   (x0.5 moderate, x0 strong), Caudle et al. 2020 phenotype thresholds.
// - Other CYP genes: never compute an activity score; flag "may be affected by <drug>".
// - A8 gate: never compute or assume a phenotype for an unassessed SV gene.

const UNSCORABLE_PHENOTYPES = new Set(['no result', 'indeterminate', 'unknown', '']);

// CPIC CYP2D6 Allele Functionality Reference Table numeric activity values
// (https://api.cpicpgx.org/v1/allele?genesymbol=eq.CYP2D6, cited in docs/sources.md).
const CYP2D6_ALLELE_ACTIVITY_VALUES = new Map([
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

/**
 * Simulate the A7 phenoconversion effect of ordering an inhibitor (`strong` or `moderate`)
 * on a patient's gene record. Returns null if the gene is unassessed/unscorable or
 * the inhibitor has no applicable effect.
 */
export function simulateInhibitorShift({ geneRecord, inhibitorDrug, enzyme, strength, svRow }) {
  if (!geneRecord || geneRecord.phenotype === null || geneRecord.phenotype === undefined) {
    return null;
  }
  if (svRow && geneRecord.callability?.method === 'not-assessed') {
    return null;
  }
  const geneticPhenotype = String(geneRecord.phenotype).trim();
  if (UNSCORABLE_PHENOTYPES.has(geneticPhenotype.toLowerCase())) {
    return null;
  }

  const normEnzyme = String(enzyme || '').trim().toUpperCase();
  const normStrength = String(strength || '').trim().toLowerCase();
  if (normStrength !== 'strong' && normStrength !== 'moderate') {
    return null;
  }

  const pc = geneRecord.phenoconversion || {};
  const priorApplied = Boolean(pc.applied);
  const priorPhenotype =
    priorApplied && geneRecord.effectivePhenotype ? geneRecord.effectivePhenotype : geneticPhenotype;

  if (normEnzyme === 'CYP2D6') {
    const geneticAS = Number.isFinite(Number(pc.geneticActivityScore))
      ? Number(pc.geneticActivityScore)
      : computeCyp2d6ActivityScore(geneRecord.diplotype);
    if (geneticAS === null) return null;

    const priorAS =
      priorApplied && Number.isFinite(Number(pc.adjustedActivityScore))
        ? Number(pc.adjustedActivityScore)
        : geneticAS;

    const factor = normStrength === 'strong' ? 0 : 0.5;
    // Strongest inhibitor wins: never weaken an already stronger active inhibitor.
    const nextAS = Math.min(priorAS, Math.round(geneticAS * factor * 1e6) / 1e6);
    const newPhenotype = activityScoreToCyp2d6Phenotype(nextAS);

    return {
      scored: true,
      enzyme: normEnzyme,
      inhibitorDrug,
      strength: normStrength,
      geneticPhenotype,
      priorPhenotype,
      newPhenotype,
      geneticActivityScore: geneticAS,
      priorActivityScore: priorAS,
      adjustedActivityScore: nextAS,
      factor,
      method: 'Thomas et al. 2020',
      changed: newPhenotype !== priorPhenotype,
    };
  }

  // Non-CYP2D6 genes: never compute an activity score; flag if not already flagged for this drug.
  const existingCauses = Array.isArray(pc.cause)
    ? pc.cause.map((c) => String(c).toLowerCase())
    : [];
  const alreadyFlagged = existingCauses.includes(String(inhibitorDrug).toLowerCase());

  return {
    scored: false,
    enzyme: normEnzyme,
    inhibitorDrug,
    strength: normStrength,
    geneticPhenotype,
    priorPhenotype,
    newPhenotype: priorPhenotype,
    method: 'FDA clinical inhibitor table (no score)',
    changed: false,
    flagged: !alreadyFlagged,
  };
}
