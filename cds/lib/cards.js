// CDS Hooks 2.0.1 card builder.
// Follows design/README.md §7 (summary < 140 chars, non-interruptive indicator,
// Markdown detail with Genetic / Acting like, verbatim CPIC recommendation quote,
// A5 coverage sentence, honesty line, and table-only alternatives).

import crypto from 'node:crypto';

const MAX_SUMMARY_LENGTH = 139; // CDS Hooks 2.0 specification: summary under 140 characters.

const ACTIONABLE_PHENOTYPE_RE =
  /\b(poor|intermediate|ultrarapid|rapid|decreased|possible decreased)\b/i;

function truncateSummary(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_SUMMARY_LENGTH) return clean;
  return `${clean.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`;
}

/**
 * Determine non-interruptive CDS Hooks 2.0.1 indicator (`warning` or `info`).
 * Never returns `critical` alone for alternatives (AGENTS.md §4, design/README.md §7).
 */
export function selectIndicator(row, effectivePhenotype) {
  const rec = String(row?.recommendation || '').toLowerCase();
  const pheno = String(effectivePhenotype || row?.phenotype || '');
  const isNoRec = String(row?.classification || '').toLowerCase() === 'no recommendation';
  if (isNoRec) return 'info';

  if (
    /\b(avoid|alternative|limit dose|50%|25%|reduce|consider an alternative)\b/.test(rec) ||
    (ACTIONABLE_PHENOTYPE_RE.test(pheno) && !/\b(standard dose|recommended starting dose|desired starting dose)\b/.test(rec))
  ) {
    return 'warning';
  }
  return 'info';
}

/**
 * Build the A5 coverage sentence when coverage metadata is available.
 */
export function formatCoverageLine(coverage) {
  if (!coverage || typeof coverage !== 'object') return null;

  const assayed = Number(coverage.definingPositionsAssayed || 0);
  const total = Number(coverage.definingPositionsTotal || 0);
  const untested = Array.isArray(coverage.untestedLocalAlleles)
    ? coverage.untestedLocalAlleles
    : [];

  if (total > 0) {
    const base = `Assay covered ${assayed} of ${total} defining positions`;
    if (untested.length > 0) {
      return `${base}; did not test ${untested.join(', ')}.`;
    }
    return `${base}.`;
  }

  if (coverage.saudiDataNote) {
    return String(coverage.saudiDataNote);
  }
  return null;
}

/**
 * Build a CDS Hooks 2.0.1 card for an unassessed structural-variation gene (A8).
 * Never reports a normal phenotype or reassurance (AGENTS.md §8b, docs/requests.md).
 */
export function buildNotAssessedSvCard({ geneRecord, svRow, drugDisplay }) {
  const gene = geneRecord?.gene || svRow?.gene || 'CYP2D6';
  const summary = truncateSummary(
    `${gene}: copy number not assessed by this test — no result reported`
  );

  const reason = geneRecord?.callability?.reason || svRow?.justification || '';
  const requiredInput = geneRecord?.callability?.requiredInput || svRow?.requiredInput || '';

  const lines = [
    `**${gene} (${drugDisplay}):** copy number not assessed by this test — no result reported.`,
  ];
  if (reason) lines.push(`> ${reason}`);
  if (requiredInput) lines.push(`Required input: ${requiredInput}.`);
  lines.push('_Advises, does not prescribe. Research prototype — not for clinical use._');

  return {
    uuid: crypto.randomUUID(),
    summary,
    indicator: 'info',
    detail: lines.join('\n\n'),
    source: {
      label: 'Meyar (research prototype)',
    },
  };
}

/**
 * Build CDS Hooks 2.0.1 suggestions ONLY from `row.alternatives` in
 * `tables/cpic_recommendations.json`. Never invented or ranked.
 */
function buildSuggestions(row) {
  const alts = Array.isArray(row?.alternatives) ? row.alternatives : [];
  if (alts.length === 0) return [];

  const suggestions = [];
  for (const alt of alts) {
    const targetName = alt.drug || alt.drugClass;
    if (!targetName) continue;

    const coding = alt.rxnorm
      ? [
          {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: String(alt.rxnorm),
            display: targetName,
          },
        ]
      : [];

    const suggestion = {
      label: `Better matched for this patient's genes: ${targetName}`,
      uuid: crypto.randomUUID(),
      actions: [
        {
          type: 'create',
          description: alt.condition
            ? `${targetName} (${alt.condition})`
            : `Consider ${targetName} per CPIC guideline`,
          resource: {
            resourceType: 'MedicationRequest',
            status: 'draft',
            intent: 'order',
            medicationCodeableConcept: {
              ...(coding.length > 0 ? { coding } : {}),
              text: targetName,
            },
          },
        },
      ],
    };
    suggestions.push(suggestion);
  }
  return suggestions;
}

/**
 * Build a CDS Hooks 2.0.1 card from a matched CPIC table row and patient gene record.
 */
export function buildCpicCard({ geneRecord, row, drugDisplay }) {
  const gene = geneRecord.gene;
  const geneticPhenotype = geneRecord.phenotype;
  const phenoApplied = Boolean(geneRecord.phenoconversion?.applied);
  const effectivePhenotype =
    phenoApplied && geneRecord.effectivePhenotype
      ? geneRecord.effectivePhenotype
      : geneticPhenotype;
  const causes = Array.isArray(geneRecord.phenoconversion?.cause)
    ? geneRecord.phenoconversion.cause
    : [];

  const shortEffect = row.implication && row.implication !== 'n/a'
    ? row.implication.split(';')[0].trim()
    : row.recommendation.split('.')[0].trim();

  const summary = truncateSummary(
    phenoApplied && effectivePhenotype !== geneticPhenotype
      ? `${gene} ${effectivePhenotype} (from ${causes.join(', ')}): ${row.drug} — ${shortEffect}`
      : `${gene} ${effectivePhenotype}: ${row.drug} — ${shortEffect}`
  );

  const indicator = selectIndicator(row, effectivePhenotype);

  let statusLine;
  if (phenoApplied && causes.length > 0 && effectivePhenotype !== geneticPhenotype) {
    statusLine = `**Genetic:** ${gene} ${geneRecord.diplotype || 'unknown'} (${geneticPhenotype}) · **Acting like:** ${effectivePhenotype} because of ${causes.join(', ')}`;
  } else if (phenoApplied && causes.length > 0) {
    statusLine = `**Genetic:** ${gene} ${geneRecord.diplotype || 'unknown'} (${geneticPhenotype}) · **Note:** may be affected by ${causes.join(', ')}`;
  } else {
    statusLine = `**Genetic:** ${gene} ${geneRecord.diplotype || 'unknown'} (${geneticPhenotype})`;
  }

  const detailParts = [statusLine];

  if (Array.isArray(geneRecord.candidates) && geneRecord.candidates.length > 1) {
    detailParts.push(`Candidate diplotypes: ${geneRecord.candidates.join(', ')}`);
  }

  detailParts.push(`> ${row.recommendation}`);

  if (row.implication && row.implication !== 'n/a') {
    detailParts.push(`**Clinical implication:** ${row.implication}`);
  }

  if (row.population && row.population !== 'general') {
    detailParts.push(`**CPIC indication:** ${row.population} (${row.classification})`);
  }

  const coverageLine = formatCoverageLine(geneRecord.coverage);
  if (coverageLine) {
    detailParts.push(coverageLine);
  }

  const guidelineLabel =
    row.guideline?.pub
      ? `CPIC: ${row.guideline.name} (${row.guideline.pub})`
      : geneRecord.guidelineVersion || 'CPIC';

  detailParts.push(
    `_Advises, does not prescribe. ${geneRecord.guidelineVersion || guidelineLabel} · Research prototype — not for clinical use._`
  );

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
    card.links = [
      {
        label: guidelineLabel,
        url: row.guideline.url,
        type: 'absolute',
      },
    ];
  }

  const suggestions = buildSuggestions(row);
  if (suggestions.length > 0) {
    card.suggestions = suggestions;
  }

  // Keep drugDisplay referenced in card detail if caller passed a brand/strength string.
  if (drugDisplay && drugDisplay.toLowerCase() !== row.drug.toLowerCase()) {
    card.detail = `**Order:** ${drugDisplay}\n\n${card.detail}`;
  }

  return card;
}
