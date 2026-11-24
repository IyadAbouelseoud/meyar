import { decodeQrEnvelope } from './qr.js';
/**
 * Pure CPIC/A5/A8/A7 card builder from a decrypted C2/C3 QR payload.
 * Never invents dosing or alternatives; every recommendation comes from tables/cpic_recommendations.json.
 */

export function payloadGeneToContractShape(g) {
  return {
    gene: g.gene,
    diplotype: g.dip ?? null,
    phenotype: g.phen ?? null,
    effectivePhenotype: g.eff ?? g.phen ?? null,
    phenoconversion: g.pc?.cause
      ? {
          applied: true,
          cause: g.pc.cause,
          inhibitorStrength: g.pc.str ?? null,
        }
      : { applied: false },
    callability: {
      method: g.call?.m || 'vcf',
      svAssessed: Boolean(g.call?.sv),
    },
    coverage: {
      definingPositionsAssayed: g.cov?.a ?? 0,
      definingPositionsTotal: g.cov?.t ?? 0,
      untestedLocalAlleles: g.cov?.u || [],
      saudiDataTier: g.cov?.tier ?? null,
    },
    guidelineVersion: g.gv || '',
  };
}

function classifyRecommendation(row) {
  const rec = (row.recommendation || '').toLowerCase();
  const hasAlts = Array.isArray(row.alternatives) && row.alternatives.length > 0;
  if (hasAlts || /\b(avoid|contraindicated|alternative|do not use|reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(rec)) {
    return 'warning';
  }
  return 'info';
}

function pickCpicRow(matching, drugName, rxnorm) {
  const lower = String(drugName || '').toLowerCase();
  const byDrug = matching.filter(
    (r) => String(r.drug || '').toLowerCase() === lower || (rxnorm && String(r.rxnorm) === String(rxnorm))
  );
  if (byDrug.length === 0) return null;
  return (
    byDrug.find((r) => r.population === 'general')
    || byDrug.find((r) => r.population === 'CVI ACS PCI')
    || byDrug.find((r) => !/pediatric/i.test(r.population || ''))
    || byDrug[0]
  );
}

/**
 * Build .m-cds card view-models from a decoded QR payload.
 */
export function buildCdsCardsFromPayload(payload, { cpicRows = [], freqRows = [] } = {}) {
  if (!payload || payload.o !== 'germline') {
    throw new Error('Non-germline sample rejected (A6)');
  }

  return (payload.g || []).map((g) => {
    const contractGene = payloadGeneToContractShape(g);
    const freqEntry = freqRows.find((r) => r.gene === g.gene);
    const saudiTier = g.cov?.tier ?? freqEntry?.saudiDataTier ?? 2;
    const saudiNote = freqEntry?.saudiDataNote
      || (saudiTier === 0
        ? 'Tier 0: structural-variation gene (A8)'
        : saudiTier === 2
          ? 'Tier 2: no published Saudi frequency (Goljan et al. 2022)'
          : 'Tier 1: Saudi frequency published (Goljan et al. 2022)');

    const notAssessed = g.call?.m === 'not-assessed';
    if (notAssessed) {
      return {
        gene: g.gene,
        diplotype: null,
        geneticPhenotype: null,
        effectivePhenotype: null,
        phenoconverted: false,
        cause: [],
        notAssessed: true,
        outsideCall: false,
        indicator: 'info',
        summary: `${g.gene}: copy number not assessed by this test — no result reported.`,
        drugs: [],
        saudiTier,
        saudiNote,
        guidelineVersion: g.gv || '',
        contractGene,
      };
    }

    const activePhenotype = g.eff || g.phen;
    const matching = cpicRows.filter(
      (r) => r.gene === g.gene && r.phenotype === activePhenotype
    );

    const targetDrugs = Array.isArray(g.rec) && g.rec.length > 0
      ? g.rec
      : [];

    const drugs = [];
    for (const item of targetDrugs) {
      const row = pickCpicRow(matching, item.d, item.rx);
      if (row) {
        drugs.push({
          drug: row.drug,
          rxnorm: row.rxnorm,
          indicator: classifyRecommendation(row),
          implication: row.implication,
          recommendation: row.recommendation,
          classification: row.classification,
          alternatives: Array.isArray(row.alternatives)
            ? row.alternatives.map((a) => (typeof a === 'string' ? a : a?.drug)).filter(Boolean)
            : [],
          guideline: row.guideline || null,
        });
      }
    }

    // If QR had no rec[] list (e.g. a non-actionable or normal gene), check if any actionable rows exist
    if (drugs.length === 0 && targetDrugs.length === 0) {
      const seen = new Set();
      for (const row of matching) {
        if (seen.has(row.drug)) continue;
        const ind = classifyRecommendation(row);
        if (ind === 'warning') {
          seen.add(row.drug);
          drugs.push({
            drug: row.drug,
            rxnorm: row.rxnorm,
            indicator: ind,
            implication: row.implication,
            recommendation: row.recommendation,
            classification: row.classification,
            alternatives: Array.isArray(row.alternatives)
              ? row.alternatives.map((a) => (typeof a === 'string' ? a : a?.drug)).filter(Boolean)
              : [],
            guideline: row.guideline || null,
          });
        }
      }
    }

    const hasWarning = drugs.some((d) => d.indicator === 'warning');
    const indicator = hasWarning ? 'warning' : 'info';
    const phenoconverted = Boolean(g.pc?.cause && g.eff && g.eff !== g.phen);

    let summary;
    if (phenoconverted) {
      summary = `${g.gene} Genetic: ${g.phen} · Acting like: ${g.eff} because of ${(g.pc.cause || []).join(', ')}.`;
    } else if (drugs.length > 0) {
      const lead = drugs[0];
      const altText = lead.alternatives.length > 0
        ? ` Alternatives: ${lead.alternatives.join(', ')}.`
        : '';
      summary = `${g.gene} ${activePhenotype}: ${lead.drug} — ${lead.implication || lead.recommendation}.${altText}`;
    } else {
      summary = `${g.gene} ${activePhenotype}: no actionable drug alerts in the current table.`;
    }
    if (summary.length > 138) {
      summary = `${summary.slice(0, 137).trimEnd()}…`;
    }

    return {
      gene: g.gene,
      diplotype: g.dip,
      geneticPhenotype: g.phen,
      effectivePhenotype: activePhenotype,
      phenoconverted,
      cause: g.pc?.cause || [],
      inhibitorStrength: g.pc?.str || null,
      notAssessed: false,
      outsideCall: g.call?.m === 'outside-call',
      indicator,
      summary,
      drugs,
      saudiTier,
      saudiNote,
      guidelineVersion: g.gv || '',
      contractGene,
    };
  });
}

/**
 * Decrypt a scanned card and build its cards, keeping the two failure kinds apart (REVIEW, A6):
 * a wrong PIN counts against the lock-out; a card that decrypts but is not germline is refused with its
 * own message and never costs the holder a PIN attempt.
 * @returns {Promise<{payload?: object, cards?: object[], error?: 'pin'|'not-germline'}>}
 */
export async function openScannedCard(rawQrText, pin, tables) {
  let payload;
  try {
    payload = await decodeQrEnvelope(rawQrText, { pin });
  } catch {
    return { error: 'pin' };
  }
  if (!payload || payload.o !== 'germline') return { error: 'not-germline' };
  return { payload, cards: buildCdsCardsFromPayload(payload, tables) };
}
