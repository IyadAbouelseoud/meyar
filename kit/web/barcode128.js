// Code 128 (code set B) encoder, SVG output, no dependencies. Tube label (F3).
// Symbology: ISO/IEC 15417. Each symbol is 6 bar/space widths summing to 11 modules;
// the stop symbol is 7 widths summing to 13. Check symbol = (start + Σ value·position) mod 103.

export const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
export const START_B = 104;
export const STOP = 106;

/** Symbol values for text in code set B (printable ASCII 32–126 only). */
export function encodeValues(text) {
  const values = [START_B];
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    if (c < 32 || c > 126) throw new Error(`Code 128 set B cannot encode ${JSON.stringify(ch)}.`);
    values.push(c - 32);
  }
  const check = values.reduce((sum, v, i) => sum + v * (i === 0 ? 1 : i), 0) % 103;
  return [...values, check, STOP];
}

/** Alternating bar/space module widths, starting with a bar. */
export function encodeWidths(text) {
  return encodeValues(text).flatMap((v) => [...PATTERNS[v]].map(Number));
}

/**
 * SVG string. `quiet` is the quiet zone in modules on each side (the standard asks for
 * at least 10). Colours come from CSS (`currentColor` bars on a transparent ground) so the
 * caller decides the ground; print it dark on light.
 */
export function code128SVG(text, { module = 2, height = 64, quiet = 10, title } = {}) {
  const widths = encodeWidths(text);
  const total = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  let x = quiet;
  const bars = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}"/>`);
    x += w;
  });
  const label = title ?? `Code 128 barcode: ${text}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="kit-code128" viewBox="0 0 ${total} ${height}" width="${total * module}" height="${height}" preserveAspectRatio="none" role="img" aria-label="${escapeAttr(label)}" fill="currentColor" shape-rendering="crispEdges">${bars.join('')}</svg>`;
}

function escapeAttr(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
