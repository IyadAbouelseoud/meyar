// CDS Hooks 2.0.1 card builder.
// Follows design/README.md §7 (summary < 140 chars, non-interruptive indicator,
// Markdown detail with Genetic / Acting like, verbatim CPIC recommendation quote,
// A5 coverage sentence, honesty line, and table-only alternatives).

import crypto from 'node:crypto';
import { isOncologyDrug } from './cpic.js';

// CDS Hooks 2.0 Card.summary: "One-sentence, <140-character summary message".
const MAX_SUMMARY_LENGTH = 139;

const FOOTER_SUFFIX = 'Research prototype — not for clinical use.';
const DEMO_LABEL = 'Demo data';

function truncateSummary(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_SUMMARY_LENGTH) return clean;
  return `${clean.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`;
}

function footer(guidelineVersion) {
  const version = guidelineVersion ? ` ${guidelineVersion} ·` : '';
  return `_${DEMO_LABEL} · Advises, does not prescribe.${version} ${FOOTER_SUFFIX}_`;
}

// Markdown blockquote that keeps every line of a multi-line CPIC text inside the quote.
function quote(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => `> ${line}`.trimEnd())
    .join('\n');
}

function isNoRecommendation(row) {
  return (
    String(row?.classification || '').trim().toLowerCase() === 'no recommendation' ||
    String(row?.recommendation || '').trim().toLowerCase() === 'no recommendation'
  );
}

function isNormalPhenotype(phenotype) {
  return /^normal (metabolizer|function)$/i.test(String(phenotype || '').trim());
}

function normalizeRecommendation(text, drug) {
  let t = String(text || '').toLowerCase();
  if (drug) t = t.split(String(drug).toLowerCase()).join(' ');
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * Non-interruptive CDS Hooks indicator, decided from the table rather than keywords:
 * - `info` when CPIC gives "No recommendation", the phenotype is Normal, or the
 *   row's recommendation is the same as the Normal row's for this drug and indication;
 * - `warning` otherwise (a dose change, avoid, or a named alternative).
 * Never `critical` (design/README.md §7: never critical for an alternative).
 */
export function selectIndicator(row, normalRecommendation = null) {
  if (!row || isNoRecommendation(row)) return 'info';
  if (Array.isArray(row.alternatives) && row.alternatives.length > 0) return 'warning';
  if (isNormalPhenotype(row.phenotype)) return 'info';
  if (
    normalRecommendation &&
    normalizeRecommendation(row.recommendation, row.drug) ===
      normalizeRecommendation(normalRecommendation, row.drug)
  ) {
    return 'info';
  }
  return 'warning';
}

/**
 * The A5 coverage sentence plus the A5 Saudi-data note (Tier 1 citation, or the
 * Tier 2 "No published Saudi frequency" line, which AGENTS.md §8c requires).
 */
export function formatCoverageLine(coverage) {
  if (!coverage || typeof coverage !== 'object') return null;

  const assayed = Number(coverage.definingPositionsAssayed || 0);
  const total = Number(coverage.definingPositionsTotal || 0);
  const untested = Array.isArray(coverage.untestedLocalAlleles)
    ? coverage.untestedLocalAlleles
    : [];

  const parts = [];
  if (total > 0) {
    const base = `Assay covered ${assayed} of ${total} defining positions`;
    parts.push(untested.length > 0 ? `${base}; did not test ${untested.join(', ')}.` : `${base}.`);
  }
  if (coverage.saudiDataNote) {
    parts.push(`Saudi data: ${String(coverage.saudiDataNote).trim()}`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Build a one-tap CDS Hooks 2.0.1 suggestion to send the PGx advisory to a pharmacist.
 */
function buildPharmacistSuggestion({ gene, effectivePhenotype, drugName, guidelineName, guidelineVersion }) {
  return {
    label: 'Send to pharmacist',
    uuid: crypto.randomUUID(),
    actions: [
      {
        type: 'create',
        description: `Send ${gene} (${effectivePhenotype}) / ${drugName} advisory to pharmacist for review`,
        resource: {
          resourceType: 'Task',
          status: 'requested',
          intent: 'order',
          code: {
            text: 'Pharmacist pharmacogenomics review',
          },
          description: `${gene} ${effectivePhenotype} with ${drugName}. ${guidelineName || 'CPIC guideline'} (${guidelineVersion}).`,
        },
      },
    ],
  };
}

/**
 * Card for an unassessed structural-variation gene (A8).
 * Never reports a normal phenotype or reassurance (AGENTS.md §8b).
 */
export function buildNotAssessedSvCard({ geneRecord, svRow, drugDisplay, isBackwardSweep = false }) {
  const gene = geneRecord?.gene || svRow?.gene || 'CYP2D6';
  const prefix = isBackwardSweep ? 'Backward sweep — ' : '';
  const summary = truncateSummary(
    `${prefix}${gene}: copy number not assessed by this test — no result reported`
  );

  const reason = geneRecord?.callability?.reason || svRow?.justification || '';
  const requiredInput = geneRecord?.callability?.requiredInput || svRow?.requiredInput || '';
  const guidelineVersion = geneRecord?.guidelineVersion || 'CPIC PharmCAT 3.4.0';

  const lines = [];
  if (isBackwardSweep) {
    lines.push(`**Existing medication (backward sweep):** ${drugDisplay}`);
  }
  lines.push(
    `**${gene} (${drugDisplay}):** copy number not assessed by this test — no result reported. This is not a normal result.`
  );
  if (reason) lines.push(quote(reason));
  if (requiredInput) lines.push(`Required input: ${requiredInput}.`);
  lines.push(
    formatCoverageLine(geneRecord?.coverage) ||
      'No A5 score (Tier 0): structural-variation gene; copy number not assessed.'
  );
  lines.push(footer(guidelineVersion));

  return {
    uuid: crypto.randomUUID(),
    summary,
    indicator: 'info',
    detail: lines.join('\n\n'),
    source: { label: 'Meyar (research prototype)' },
    suggestions: [
      buildPharmacistSuggestion({
        gene,
        effectivePhenotype: 'copy number not assessed',
        drugName: drugDisplay,
        guidelineName: 'A8 structural-variation gate',
        guidelineVersion,
      }),
    ],
    selectionBehavior: 'at-most-one',
  };
}

/**
 * Card for a non-SV gene that the drug's CPIC rows need but the patient's
 * profile has no usable result for ("No Result" or not tested). Silence would
 * read as "nothing to worry about", so the card says the order was not checked.
 */
export function buildNoResultCard({ gene, geneRecord, drug, drugDisplay }) {
  const summary = truncateSummary(
    `${gene}: no result from this test — ${drug} not checked against ${gene} guidance`
  );
  const lines = [
    `**${gene} (${drugDisplay}):** no ${gene} result is on file for this patient, so this order was not checked against CPIC ${gene} guidance. This is not a normal result.`,
  ];
  const coverageLine = formatCoverageLine(geneRecord?.coverage);
  if (coverageLine) lines.push(coverageLine);
  lines.push(footer(geneRecord?.guidelineVersion));

  return {
    uuid: crypto.randomUUID(),
    summary,
    indicator: 'info',
    detail: lines.join('\n\n'),
    source: { label: 'Meyar (research prototype)' },
  };
}

function alternativeName(alt) {
  return alt?.drug || alt?.drugClass || null;
}

/**
 * Alternatives to show: the row's own `alternatives` (tables/cpic_recommendations.json).
 * When the indication was assumed, only alternatives CPIC names for this phenotype
 * under EVERY indication are kept (e.g. clopidogrel PM: ticagrelor — prasugrel is
 * contraindicated after stroke/TIA, so it is not offered when the indication is unknown).
 * Never invented, never ranked.
 */
function selectAlternatives(row, { indicationInferred = true, otherPopulationRows = [] } = {}) {
  const own = Array.isArray(row?.alternatives) ? row.alternatives : [];
  if (indicationInferred || otherPopulationRows.length === 0) return own;

  const namesPerOther = otherPopulationRows.map(
    (r) => new Set((r?.alternatives || []).map(alternativeName).filter(Boolean))
  );
  return own.filter((alt) => namesPerOther.every((names) => names.has(alternativeName(alt))));
}

/**
 * CDS Hooks suggestions, one per named drug alternative. A drug-class
 * alternative ("non-tramadol opioid", "alternative statin") is not an orderable
 * product, so it is shown in the detail text only, never as a create action.
 */
function buildSuggestions(alternatives, patientId) {
  const suggestions = [];
  for (const alt of alternatives) {
    if (!alt?.drug) continue;

    const coding = alt.rxnorm
      ? [
          {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: String(alt.rxnorm),
            display: alt.drug,
          },
        ]
      : [];

    suggestions.push({
      label: `Better matched for this patient's genes: ${alt.drug}`,
      uuid: crypto.randomUUID(),
      actions: [
        {
          type: 'create',
          description: alt.condition
            ? `Draft an order for ${alt.drug} (${alt.condition})`
            : `Draft an order for ${alt.drug}`,
          resource: {
            resourceType: 'MedicationRequest',
            status: 'draft',
            intent: 'order',
            ...(patientId ? { subject: { reference: `Patient/${patientId}` } } : {}),
            medicationCodeableConcept: {
              ...(coding.length > 0 ? { coding } : {}),
              text: alt.drug,
            },
          },
        },
      ],
    });
  }
  return suggestions;
}

function formatAlternativesText(alternatives, filteredForIndication = false) {
  if (alternatives.length === 0) {
    return filteredForIndication
      ? "**Better matched for this patient's genes:** none offered — CPIC names different alternatives for different indications and the order states no indication."
      : null;
  }
  const names = alternatives.map(alternativeName).filter(Boolean);
  const conditions = [...new Set(alternatives.map((a) => a.condition).filter(Boolean))];
  const quotes = [...new Set(alternatives.map((a) => a.quotedFrom).filter(Boolean))];

  const lines = [
    `**Better matched for this patient's genes:** ${names.join(', ')}${
      conditions.length > 0 ? ` (${conditions.join('; ')})` : ''
    }`,
  ];
  for (const q of quotes) lines.push(quote(`CPIC: "${q}"`));
  if (filteredForIndication) {
    lines.push(
      'Only alternatives CPIC names for this phenotype under every indication are offered, because the order states no indication.'
    );
  }
  return lines.join('\n\n');
}

/**
 * Build a CDS Hooks 2.0.1 card from a matched CPIC lookup and the patient's gene record.
 *
 * @param {object} args
 * @param {object} args.geneRecord   contract gene record (genetic + A7 effective phenotype)
 * @param {object} args.match        result of lookupCpic() for the phenotype acted on
 * @param {object} [args.geneticMatch] lookupCpic() for the genetic phenotype, when A7
 *                                   changed the phenotype (shown so the genetic risk is never hidden)
 * @param {string} args.drugDisplay  order text
 * @param {string} [args.patientId]
 */
export function buildCpicCard({
  geneRecord,
  match,
  geneticMatch = null,
  drugDisplay,
  patientId,
  isBackwardSweep = false,
}) {
  const { row } = match;
  const gene = geneRecord.gene;
  const geneticPhenotype = geneRecord.phenotype;
  const phenoApplied = Boolean(geneRecord.phenoconversion?.applied);
  const effectivePhenotype =
    phenoApplied && geneRecord.effectivePhenotype
      ? geneRecord.effectivePhenotype
      : geneticPhenotype;
  const converted = phenoApplied && effectivePhenotype !== geneticPhenotype;
  const causes = Array.isArray(geneRecord.phenoconversion?.cause)
    ? geneRecord.phenoconversion.cause
    : [];

  const shortEffect =
    row.implication && row.implication !== 'n/a'
      ? row.implication.split(';')[0].trim()
      : row.recommendation.split('.')[0].trim();

  const sweepPrefix = isBackwardSweep ? 'Backward sweep — ' : '';
  const summary = truncateSummary(
    converted
      ? `${sweepPrefix}${gene} ${geneticPhenotype}, acting like ${effectivePhenotype} (${causes.join(', ')}): ${row.drug} — ${shortEffect}`
      : `${sweepPrefix}${gene} ${effectivePhenotype}: ${row.drug} — ${shortEffect}`
  );

  let indicator = selectIndicator(row, match.normalRecommendation);
  if (converted && geneticMatch?.row) {
    // The genetic result applies again if the inhibitor is stopped; never let a
    // phenoconverted "normal" hide an actionable genetic result.
    if (selectIndicator(geneticMatch.row, geneticMatch.normalRecommendation) === 'warning') {
      indicator = 'warning';
    }
  }

  const diplotype = geneRecord.diplotype || 'unknown';
  let statusLine;
  if (converted && causes.length > 0) {
    statusLine = `**Genetic:** ${gene} ${diplotype} (${geneticPhenotype}) · **Acting like:** ${effectivePhenotype} because of ${causes.join(', ')}`;
  } else if (phenoApplied && causes.length > 0) {
    statusLine = `**Genetic:** ${gene} ${diplotype} (${geneticPhenotype}) · **Note:** may be affected by ${causes.join(', ')}`;
  } else {
    statusLine = `**Genetic:** ${gene} ${diplotype} (${geneticPhenotype})`;
  }

  const detailParts = [];
  if (isBackwardSweep) {
    detailParts.push(`**Existing medication (backward sweep):** ${drugDisplay || row.drug}`);
  } else if (drugDisplay && drugDisplay.toLowerCase() !== row.drug.toLowerCase()) {
    detailParts.push(`**Order:** ${drugDisplay}`);
  }
  detailParts.push(statusLine);

  if (geneRecord.callability?.method === 'outside-call' && geneRecord.callability?.source) {
    detailParts.push(`${gene} result from outside call: ${geneRecord.callability.source}.`);
  }

  if (Array.isArray(geneRecord.candidates) && geneRecord.candidates.length > 1) {
    detailParts.push(`Candidate diplotypes: ${geneRecord.candidates.join(', ')}`);
  }

  detailParts.push(quote(row.recommendation));

  if (isOncologyDrug(row.drug, gene)) {
    detailParts.push('Germline result — tumour profiling is separate.');
  }

  if (row.implication && row.implication !== 'n/a') {
    detailParts.push(`**Clinical implication:** ${row.implication}`);
  }

  if (row.population && row.population !== 'general') {
    if (match.indicationInferred) {
      detailParts.push(`**CPIC indication:** ${row.population} (${row.classification})`);
    } else {
      const others = (match.otherPopulationRows || [])
        .map((r) => `- ${r.population} (${r.classification}): ${r.recommendation}`)
        .join('\n');
      detailParts.push(
        `**CPIC indication:** ${row.population} (${row.classification}) — assumed; the order states no indication. CPIC's recommendation for this phenotype in the other indications:\n${others}`
      );
    }
  }

  if (converted && geneticMatch?.row && geneticMatch.row.recommendation !== row.recommendation) {
    detailParts.push(
      `**Genetic result (${geneticPhenotype}) applies if ${causes.join(', ')} is stopped:**\n\n${quote(geneticMatch.row.recommendation)}`
    );
  }

  const alternatives = selectAlternatives(row, match);
  const ownCount = Array.isArray(row.alternatives) ? row.alternatives.length : 0;
  const altText = formatAlternativesText(alternatives, alternatives.length < ownCount);
  if (altText) detailParts.push(altText);

  const coverageLine =
    formatCoverageLine(geneRecord.coverage) ||
    'Assay coverage metadata not provided in prefetch.';
  detailParts.push(coverageLine);

  const guidelineLabel = row.guideline?.pub
    ? `CPIC: ${row.guideline.name} (${row.guideline.pub})`
    : 'CPIC guideline';
  const guidelineVersion = geneRecord.guidelineVersion || guidelineLabel;

  detailParts.push(footer(guidelineVersion));

  const card = {
    uuid: crypto.randomUUID(),
    summary,
    indicator,
    detail: detailParts.join('\n\n'),
    source: {
      label: 'Meyar (research prototype)',
      ...(row.guideline?.url ? { url: row.guideline.url } : {}),
    },
  };

  if (row.guideline?.url) {
    card.links = [{ label: guidelineLabel, url: row.guideline.url, type: 'absolute' }];
  }

  const suggestions = buildSuggestions(alternatives, patientId);
  if (indicator === 'warning' || isBackwardSweep || isOncologyDrug(row.drug, gene)) {
    suggestions.push(
      buildPharmacistSuggestion({
        gene,
        effectivePhenotype,
        drugName: row.drug,
        guidelineName: row.guideline?.name,
        guidelineVersion,
      })
    );
  }
  if (suggestions.length > 0) {
    card.suggestions = suggestions;
    // CDS Hooks 2.0: "If suggestions are present, selectionBehavior MUST also be provided."
    card.selectionBehavior = 'at-most-one';
  }

  return card;
}

// CPIC CYP2D6 activity values step in quarters (0.25), so never round to one decimal:
// print the exact value (1.25 stays "1.25", 0.625 stays "0.625").
function formatActivityScore(score) {
  return String(Math.round(Number(score) * 1e6) / 1e6);
}

/**
 * One non-interruptive `info` backward-sweep card emitted when a signed order is a
 * strong inhibitor from `tables/cyp_inhibitors.json` and shifts the recommendation
 * for one or more of the patient's existing active medications (B6 / A7).
 */
export function buildInhibitorBackwardSweepCard({
  inhibitorDisplay,
  inhibitorDrug,
  enzyme,
  strength,
  geneRecord,
  simulation,
  affectedSubstrates,
}) {
  const diplotype = geneRecord.diplotype || 'unknown';
  const affectedNames = affectedSubstrates.map((s) => s.drug).join(', ');
  const summary = truncateSummary(
    simulation.scored
      ? `Backward sweep — ${enzyme} ${simulation.geneticPhenotype}, acting like ${simulation.newPhenotype} (${inhibitorDrug}): affects ${affectedNames}`
      : `Backward sweep — ${enzyme} may be affected by ${inhibitorDrug}: review ${affectedNames}`
  );

  const detailParts = [
    `**Order (${strength} ${enzyme} inhibitor):** ${inhibitorDisplay || inhibitorDrug}`,
  ];

  if (simulation.scored) {
    detailParts.push(
      `**Genetic:** ${enzyme} ${diplotype} (${simulation.geneticPhenotype}) · **Acting like:** ${simulation.newPhenotype} because of ${inhibitorDrug}`
    );
    detailParts.push(
      `Activity score: ${formatActivityScore(simulation.geneticActivityScore)} × ${simulation.factor} = ${formatActivityScore(simulation.adjustedActivityScore)} (${strength} inhibitor, FDA table; ${simulation.method}).`
    );
  } else {
    detailParts.push(
      `**Genetic:** ${enzyme} ${diplotype} (${simulation.geneticPhenotype}) · **Note:** may be affected by ${inhibitorDrug} (${strength} ${enzyme} inhibitor, FDA table)`
    );
  }

  if (geneRecord.callability?.method === 'outside-call') {
    detailParts.push(
      geneRecord.callability.source
        ? `${enzyme} result from outside call: ${geneRecord.callability.source}.`
        : `${enzyme} result from outside call (caller not named in the record sent).`
    );
  }

  const linksByUrl = new Map();
  let firstGuideline = null;

  for (const sub of affectedSubstrates) {
    const row = sub.afterMatch.row;
    const label =
      sub.drugDisplay && sub.drugDisplay.toLowerCase() !== sub.drug.toLowerCase()
        ? `${sub.drug} (${sub.drugDisplay})`
        : sub.drugDisplay || sub.drug;
    detailParts.push(
      sub.coSigned
        ? `**Co-signed in this order (re-checked with ${inhibitorDrug}):** ${label}`
        : `**Existing medication (backward sweep):** ${label}`
    );
    detailParts.push(quote(row.recommendation));

    if (isOncologyDrug(row.drug, enzyme)) {
      detailParts.push('Germline result — tumour profiling is separate.');
    }

    const alts = selectAlternatives(row, sub.afterMatch);
    const ownCount = Array.isArray(row.alternatives) ? row.alternatives.length : 0;
    const altText = formatAlternativesText(alts, alts.length < ownCount);
    if (altText) detailParts.push(altText);

    if (row.guideline?.url && !linksByUrl.has(row.guideline.url)) {
      const gLabel = row.guideline?.pub
        ? `CPIC: ${row.guideline.name} (${row.guideline.pub})`
        : 'CPIC guideline';
      linksByUrl.set(row.guideline.url, { label: gLabel, url: row.guideline.url, type: 'absolute' });
      if (!firstGuideline) firstGuideline = row.guideline;
    }
  }

  const coverageLine =
    formatCoverageLine(geneRecord.coverage) || 'Assay coverage metadata not provided in prefetch.';
  detailParts.push(coverageLine);

  const guidelineVersion =
    geneRecord.guidelineVersion ||
    (firstGuideline?.pub ? `CPIC: ${firstGuideline.name} (${firstGuideline.pub})` : 'CPIC guideline');
  detailParts.push(footer(guidelineVersion));

  const links = [...linksByUrl.values()];
  const card = {
    uuid: crypto.randomUUID(),
    summary,
    indicator: 'info',
    detail: detailParts.join('\n\n'),
    source: {
      label: 'Meyar (research prototype)',
      ...(links[0]?.url ? { url: links[0].url } : {}),
    },
    ...(links.length > 0 ? { links } : {}),
    suggestions: [
      buildPharmacistSuggestion({
        gene: enzyme,
        effectivePhenotype: simulation.newPhenotype,
        drugName: `${affectedNames} (with ${inhibitorDrug})`,
        guidelineName: firstGuideline?.name,
        guidelineVersion,
      }),
    ],
    selectionBehavior: 'at-most-one',
  };

  return card;
}
