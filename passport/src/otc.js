import otcTable from '@tables/otc_products.json';
import cpicTable from '@tables/cpic_recommendations.json';
import inhibitorsTable from '@tables/cyp_inhibitors.json';
import { classifyRow, pickBestCpicRow } from './lookup.js';

const DEFAULT_PRODUCTS = otcTable.rows || [];
const DEFAULT_CPIC_ROWS = cpicTable.rows || [];
const DEFAULT_INHIBITORS = inhibitorsTable.rows || [];

const STATUS_RANK = {
  none: 0,
  ask: 1,
  stop: 2,
};

/**
 * Normalize Arabic and English medicine queries for deterministic offline matching.
 * Strips Arabic diacritics, unifies alif/hamza/ta-marbuta/alif-maqsura, removes optional
 * leading definite article ("ال"), lowercases Latin, and collapses punctuation/spaces.
 */
export function normalizeSearchText(raw) {
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  // Remove Arabic harakat/tashkeel and tatweel
  s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  // Normalize Arabic letter variants
  s = s
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ڤ/g, 'ف');
  // Collapse punctuation to spaces and normalize whitespace
  s = s.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  // Strip leading Arabic definite article "ال" on tokens of length >= 4
  s = s
    .split(/\s+/)
    .map((tok) => (tok.startsWith('ال') && tok.length >= 4 ? tok.slice(2) : tok))
    .join(' ');
  return s;
}

/**
 * Compute Levenshtein edit distance between two normalized strings.
 */
function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const curr = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    prev = curr;
  }
  return prev[n];
}

function maxAllowedEdits(len) {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  return 2;
}

function candidateTermsForProduct(product) {
  const rawTerms = [
    product.brandEn,
    product.brandAr,
    ...(product.aliasesEn || []),
    ...(product.aliasesAr || []),
    ...(product.ingredients || []),
  ].filter(Boolean);
  const seen = new Set();
  const normalized = [];
  for (const term of rawTerms) {
    const norm = normalizeSearchText(term);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      normalized.push(norm);
    }
  }
  return normalized;
}

/**
 * Fuzzy-match a user query against the mock OTC product catalog (Arabic and English).
 * Returns { product, matchType, score } or null if no sufficiently close match exists.
 */
export function matchOtcProduct(query, products = DEFAULT_PRODUCTS) {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return null;

  let best = null;

  for (const product of products) {
    const terms = candidateTermsForProduct(product);
    for (const term of terms) {
      let candidate = null;
      if (term === normQuery) {
        candidate = { product, matchType: 'exact', score: 0 };
      } else if (normQuery.length >= 3 && (term.startsWith(normQuery) || term.split(' ').some((w) => w.startsWith(normQuery)))) {
        candidate = { product, matchType: 'prefix', score: 0.5 + (term.length - normQuery.length) * 0.01 };
      } else if (normQuery.length >= 4) {
        const dist = editDistance(normQuery, term);
        const cap = maxAllowedEdits(Math.max(normQuery.length, term.length));
        if (dist <= cap) {
          candidate = { product, matchType: 'fuzzy', score: dist + 1 };
        } else {
          // Also check individual words of multi-word product aliases
          for (const word of term.split(' ')) {
            if (word.length < 4) continue;
            const wDist = editDistance(normQuery, word);
            const wCap = maxAllowedEdits(Math.max(normQuery.length, word.length));
            if (wDist <= wCap) {
              const score = wDist + 1.2;
              if (!candidate || score < candidate.score) {
                candidate = { product, matchType: 'fuzzy', score };
              }
            }
          }
        }
      }

      if (candidate && (!best || candidate.score < best.score)) {
        best = candidate;
      }
    }
  }

  return best;
}

/**
 * Single reusable OTC quick-check lookup (C6, designed for C9 reuse).
 * Lookup only: product -> active ingredient(s) -> CPIC recommendations x effectivePhenotype.
 * Never calls an LLM and never returns "safe".
 *
 * Returns:
 * - null when query is blank
 * - { status: 'unknown', ... } when not in tables/otc_products.json
 * - { status: 'none' | 'ask' | 'stop', product, matchType, details, inhibitorHits }
 */
export function lookupOtcProduct(query, contract, options = {}) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return null;

  const products = options.products || DEFAULT_PRODUCTS;
  const cpicRows = options.cpicRows || DEFAULT_CPIC_ROWS;
  const inhibitors = options.inhibitors || DEFAULT_INHIBITORS;
  const currentMedications = options.currentMedications || contract?.currentMedications || [];

  const matched = matchOtcProduct(trimmed, products);
  if (!matched) {
    return {
      status: 'unknown',
      query: trimmed,
      product: null,
      matchType: null,
      details: [],
      inhibitorHits: [],
    };
  }

  const { product, matchType } = matched;
  const genes = contract?.genes || [];
  const details = [];
  const inhibitorHits = [];
  let worstStatus = 'none';

  const bumpStatus = (next) => {
    if ((STATUS_RANK[next] ?? 0) > (STATUS_RANK[worstStatus] ?? 0)) {
      worstStatus = next;
    }
  };

  for (const ing of product.ingredients || []) {
    const ingLower = String(ing).toLowerCase();
    const drugRows = cpicRows.filter((r) => String(r.drug || '').toLowerCase() === ingLower);

    if (drugRows.length === 0) {
      details.push({
        ingredient: ing,
        gene: null,
        status: 'none',
        reasonType: 'no-cpic-guideline',
        recommendation: null,
        alternatives: [],
        guideline: null,
      });
    } else {
      const geneNames = [...new Set(drugRows.map((r) => r.gene))];
      for (const geneName of geneNames) {
        const geneObj = genes.find((g) => g.gene === geneName);
        if (!geneObj) {
          bumpStatus('ask');
          details.push({
            ingredient: ing,
            gene: geneName,
            status: 'ask',
            reasonType: 'gene-not-in-profile',
            recommendation: null,
            alternatives: [],
            guideline: drugRows[0]?.guideline || null,
          });
          continue;
        }

        if (geneObj.callability?.method === 'not-assessed') {
          bumpStatus('ask');
          details.push({
            ingredient: ing,
            gene: geneName,
            status: 'ask',
            reasonType: 'not-assessed',
            callability: geneObj.callability,
            recommendation: null,
            alternatives: [],
            guideline: drugRows[0]?.guideline || null,
          });
          continue;
        }

        const activePhenotype = geneObj.effectivePhenotype || geneObj.phenotype;
        if (!activePhenotype || /indeterminate|not assessed/i.test(activePhenotype)) {
          bumpStatus('ask');
          details.push({
            ingredient: ing,
            gene: geneName,
            status: 'ask',
            reasonType: 'indeterminate',
            geneticPhenotype: geneObj.phenotype || null,
            effectivePhenotype: activePhenotype || null,
            recommendation: null,
            alternatives: [],
            guideline: drugRows[0]?.guideline || null,
          });
          continue;
        }

        const phenRows = drugRows.filter((r) => r.phenotype === activePhenotype);
        const row = pickBestCpicRow(phenRows, geneObj);
        if (!row) {
          bumpStatus('ask');
          details.push({
            ingredient: ing,
            gene: geneName,
            status: 'ask',
            reasonType: 'no-phenotype-row',
            geneticPhenotype: geneObj.phenotype,
            effectivePhenotype: activePhenotype,
            phenoconversion: geneObj.phenoconversion || null,
            recommendation: null,
            alternatives: [],
            guideline: drugRows[0]?.guideline || null,
          });
          continue;
        }

        const rowStatus = classifyRow(row);
        bumpStatus(rowStatus);
        details.push({
          ingredient: ing,
          gene: geneName,
          status: rowStatus,
          reasonType: 'cpic-match',
          geneticPhenotype: geneObj.phenotype,
          effectivePhenotype: activePhenotype,
          phenoconversion: geneObj.phenoconversion || null,
          implication: row.implication,
          recommendation: row.recommendation,
          classification: row.classification,
          alternatives: Array.isArray(row.alternatives)
            ? row.alternatives.map((a) => (typeof a === 'string' ? a : (a?.drug || a?.drugClass))).filter(Boolean)
            : [],
          guideline: row.guideline || null,
        });
      }
    }

    // Hook for C9: check if the queried OTC ingredient is itself a listed strong/moderate inhibitor
    // of a gene affecting the patient's current medicines.
    const strongMod = inhibitors.filter(
      (inh) => String(inh.drug || '').toLowerCase() === ingLower
        && (inh.strength === 'strong' || inh.strength === 'moderate')
    );
    if (strongMod.length > 0 && currentMedications.length > 0) {
      for (const inh of strongMod) {
        const affectedCurrent = currentMedications.filter((med) => {
          const medName = String(med.name || '').toLowerCase();
          return cpicRows.some(
            (r) => String(r.drug || '').toLowerCase() === medName && r.gene === inh.enzyme
          );
        });
        if (affectedCurrent.length > 0) {
          bumpStatus('ask');
          inhibitorHits.push({
            ingredient: ing,
            enzyme: inh.enzyme,
            strength: inh.strength,
            affectedMedications: affectedCurrent.map((m) => m.name),
          });
        }
      }
    }
  }

  return {
    status: worstStatus,
    query: trimmed,
    product,
    matchType,
    details,
    inhibitorHits,
  };
}
