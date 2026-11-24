/**
 * Meyar Medication Passport i18n loader (C4).
 * All UI strings come from passport/src/i18n/ar.json and en.json.
 * Review status: Pending native-speaker review by team (BUNYAN / Renad / Dua).
 */

import ar from './ar.json';
import en from './en.json';
import { scaleKind } from '@design/meyar.js';

const LOCALES = { ar, en };
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function formatNum(n, lang) {
  const s = String(n);
  if (lang !== 'ar') return s;
  return s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

export function drugLabel(name, lang) {
  const key = String(name || '').toLowerCase();
  const dict = (LOCALES[lang] || ar).drugs || {};
  return dict[key] || name;
}

export function getScaleLabels(gene, lang = 'ar') {
  const loc = LOCALES[lang] || ar;
  const kind = scaleKind(gene?.phenotype || '');
  return loc.scale?.[kind] || ar.scale.metabolizer;
}

export const PHENOTYPE_PLAIN = {
  ar: ar.phenotypePlain,
  en: en.phenotypePlain,
};

export const PHENOTYPE_SHORT = {
  ar: ar.phenotypeShort,
  en: en.phenotypeShort,
};

function buildCopy(lang) {
  const loc = LOCALES[lang] || ar;
  const c = loc.copy;
  const sep = lang === 'ar' ? '، ' : ', ';
  return {
    ...c,
    tierLabel: (n) => (n === 1 ? c.tierLabel1 : n === 0 ? c.tierLabel0 : c.tierLabel2),
    coverageLine: (assayed, total, untested) => {
      const base = fill(c.coverageBase, {
        assayed: formatNum(assayed, lang),
        total: formatNum(total, lang),
      });
      if (!untested || untested.length === 0) return base;
      const list = untested.map((a) => `<span class="m-data">${a}</span>`).join(sep);
      return base + fill(c.coverageUntested, { untested: list });
    },
    phenoconversionLine: (genetic, acting, causes) =>
      fill(c.phenoconversionLine, { genetic, acting, causes }),
    genePhenoconversionLine: (genetic, acting, causes) =>
      fill(c.genePhenoconversionLine, { genetic, acting, causes }),
    geneTellDoctorBefore: (drugs) =>
      fill(c.geneTellDoctorBefore, { drugs }),
    geneMayBeAffected: (genetic, causes) =>
      fill(c.geneMayBeAffected, { genetic, causes }),
    medsShiftsGenes: (genes) =>
      fill(c.medsShiftsGenes, { genes }),
    otcInhibitorHitBody: (ingredient, strength, gene, meds) =>
      fill(c.otcInhibitorHitBody, { ingredient, strength, gene, meds }),
    otcNoGuidelineBody: c.otcNoGuidelineBody,
    otcNormalGuidelineBody: (gene, phenotype) =>
      fill(c.otcNormalGuidelineBody, { gene, phenotype }),
    otcAskGuidelineBody: (gene, phenotype) =>
      fill(c.otcAskGuidelineBody, { gene, phenotype }),
    otcStopGuidelineBody: (gene, phenotype) =>
      fill(c.otcStopGuidelineBody, { gene, phenotype }),
    otcNotAssessedBody: (gene) => fill(c.otcNotAssessedBody, { gene }),
    otcMissingGeneBody: (gene) => fill(c.otcMissingGeneBody, { gene }),
    otcNotFoundBody: (query) => fill(c.otcNotFoundBody, { query }),
  };
}

function buildScanCopy(lang) {
  const loc = LOCALES[lang] || ar;
  const c = loc.copy;
  const s = loc.scan;
  const sep = lang === 'ar' ? '، ' : ', ';
  return {
    ...s,
    // C8: wrong-PIN lockout countdown (seconds in the reader's digits).
    pinLocked: (secs) => fill(s.pinLocked, { s: formatNum(secs, lang) }),
    covAssayed: (assayed, total, untested) => {
      const base = fill(c.coverageBase, {
        assayed: formatNum(assayed, lang),
        total: formatNum(total, lang),
      });
      if (!untested || untested.length === 0) return base;
      const list = untested.map((a) => `<span class="m-data">${a}</span>`).join(sep);
      return base + fill(c.coverageUntested, { untested: list });
    },
  };
}

export const COPY = {
  ar: buildCopy('ar'),
  en: buildCopy('en'),
};

export const SCAN_COPY = {
  ar: buildScanCopy('ar'),
  en: buildScanCopy('en'),
};
