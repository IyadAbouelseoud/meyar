import { PHENOTYPE_PLAIN, PHENOTYPE_SHORT, drugLabel } from './i18n.js';
import { getDrugsForGene } from './lookup.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a Date as YYYYMMDD in local/UTC calendar digits (ASCII, for MRZ strip).
 */
export function formatIssueDateStamp(date = new Date()) {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Passport-style strip along the bottom of the ID-1 card.
 * Holds ONLY the envelope version (V1) and issue date — never a name, ID, or result.
 */
export function buildMrzLine(date = new Date()) {
  const stamp = formatIssueDateStamp(date);
  return `MEYAR<<PGX<ENV<V1<<ISSUED<${stamp}<<<<<<<`;
}

/**
 * Render the ISO/IEC 7810 ID-1 card (85.60 x 53.98 mm).
 * Carries wordmark, bilingual PIN instruction, research-prototype notice,
 * C8 encrypted QR, envelope-version/date strip, and Al-Qatt band.
 * Never carries patient name, ID number, or clinical results.
 */
export function renderId1CardHtml({ qrSvg, lang = 'ar', t, date = new Date() }) {
  const mrz = buildMrzLine(date);
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const brandLine = isAr
    ? `<span class="m-id1__brand">${esc(t.brand)}</span><span class="m-id1__sub">${esc(t.passportTitle)}</span>`
    : `<span class="m-id1__brand">${esc(t.brand)} <span class="m-id1__brand-pair" dir="rtl">${esc(t.brandEn)}</span></span><span class="m-id1__sub">${esc(t.passportTitle)}</span>`;

  const pinBlock = isAr
    ? `${esc(t.id1PinAr)}<br><span class="m-id1__pin-pair" dir="ltr">${esc(t.id1PinEn)}</span>`
    : `${esc(t.id1PinEn)}<br><span class="m-id1__pin-pair" dir="rtl">${esc(t.id1PinAr)}</span>`;

  const protoBlock = isAr
    ? `${esc(t.id1ProtoAr)}<br><span dir="ltr">${esc(t.id1ProtoEn)}</span>`
    : `${esc(t.id1ProtoEn)}<br><span dir="rtl">${esc(t.id1ProtoAr)}</span>`;

  return `
    <div class="m-id1" dir="${dir}" lang="${esc(lang)}" data-testid="id1-card">
      <div class="m-id1__left">
        ${brandLine}
        <span class="m-id1__pin">${pinBlock}</span>
        <span class="m-id1__proto">${protoBlock}</span>
      </div>
      <div class="m-id1__qr">${qrSvg}</div>
      <div class="m-id1__mrz" dir="ltr">${esc(mrz)}</div>
      <div class="m-qatt" aria-hidden="true"></div>
    </div>
  `;
}

/**
 * Build concise C4 plain-language gene entries for the A6 elder fold-out.
 * Lookup-only via getDrugsForGene(); A8 not-assessed genes always show the honest notice.
 */
export function buildFoldoutEntries(contract, lang = 'ar', t) {
  const sep = lang === 'ar' ? '، ' : ', ';
  return (contract?.genes || []).map((gene) => {
    const notAssessed = gene.callability?.method === 'not-assessed';
    if (notAssessed) {
      return {
        gene: gene.gene,
        notAssessed: true,
        plainLine: `${t.notAssessedTitle} — ${t.notAssessedBody}`,
        phenoconversionLine: '',
        stopItems: [],
        askItems: [],
      };
    }

    const activePhenotype = gene.effectivePhenotype || gene.phenotype;
    const plainLine = PHENOTYPE_PLAIN[lang]?.[activePhenotype] || activePhenotype || '';

    const phenoconversionLine = gene.phenoconversion?.applied
      ? t.phenoconversionLine(
          esc(PHENOTYPE_SHORT[lang]?.[gene.phenotype] || gene.phenotype),
          esc(PHENOTYPE_SHORT[lang]?.[gene.effectivePhenotype] || gene.effectivePhenotype),
          esc((gene.phenoconversion.cause || []).map((c) => drugLabel(c, lang)).join(sep))
        )
      : '';

    const drugs = getDrugsForGene(gene);
    const stopItems = drugs
      .filter((d) => d.status === 'stop')
      .map((d) => ({
        drug: drugLabel(d.drug, lang),
        alternatives: d.alternatives.map((a) => drugLabel(a, lang)),
      }));
    const askItems = drugs
      .filter((d) => d.status === 'ask')
      .map((d) => drugLabel(d.drug, lang));

    return {
      gene: gene.gene,
      notAssessed: false,
      plainLine,
      phenoconversionLine,
      stopItems,
      askItems,
    };
  });
}

/**
 * Render the large-type A6 elder fold-out (105 x 148 mm) carrying C4 plain-language lines.
 */
export function renderA6FoldoutHtml({ contract, lang = 'ar', t }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const sep = lang === 'ar' ? '، ' : ', ';
  const entries = buildFoldoutEntries(contract, lang, t);

  const entriesHtml = entries.map((entry) => {
    const stopHtml = entry.stopItems.length > 0
      ? `<p class="m-a6__line m-a6__line--stop">
          <svg aria-hidden="true"><use href="#i-stop"/></svg>
          <span><strong>${esc(t.statusStop)}:</strong> ${entry.stopItems.map((item) => {
            const altText = item.alternatives.length
              ? ` (${esc(t.betterMatch)} ${esc(item.alternatives.join(' / '))})`
              : '';
            return `${esc(item.drug)}${altText}`;
          }).join(sep)}</span>
        </p>`
      : '';

    const askHtml = entry.askItems.length > 0
      ? `<p class="m-a6__line m-a6__line--ask">
          <svg aria-hidden="true"><use href="#i-ask"/></svg>
          <span><strong>${esc(t.statusAsk)}:</strong> ${esc(entry.askItems.join(sep))}</span>
        </p>`
      : '';

    return `
      <div class="m-a6__gene">
        <p class="m-a6__summary">
          <strong class="m-data">${esc(entry.gene)}</strong>: ${esc(entry.plainLine)}
        </p>
        ${entry.phenoconversionLine ? `<p class="m-a6__shift">${entry.phenoconversionLine}</p>` : ''}
        ${stopHtml}
        ${askHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="m-a6" dir="${dir}" lang="${esc(lang)}" data-testid="a6-foldout">
      <div class="m-a6__head">
        <p class="m-a6__title">${esc(t.passportTitle)}</p>
        <span class="m-a6__brand">${esc(t.brand)}</span>
      </div>
      <hr class="m-rule m-a6__rule">
      <div class="m-a6__body">
        ${entriesHtml}
      </div>
      <p class="m-a6__reminder">${esc(t.foldoutReminder)}</p>
      <p class="m-a6__foot">${esc(t.proto)} · ${esc(t.demo)}</p>
    </div>
  `;
}
