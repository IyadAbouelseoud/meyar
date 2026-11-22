// F6 shared bits for the tracker, urgent and card pages.
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
export function langFromURL() { return new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ar'; }
export function applyLang(lang, T) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach((el) => { const v = T[lang][el.dataset.t]; if (typeof v === 'string') el.textContent = v; });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}
export function fmtNum(n, lang) { return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-GB').format(n); }
// Minimal Markdown for CDS card detail (bold, italics, quotes, paragraphs). Escapes first.
export function mdToHTML(md) {
  return String(md || '').split(/\n{2,}/).map((block) => {
    let h = esc(block).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<i>$2</i>');
    if (/^&gt; /.test(h)) return `<blockquote>${h.replace(/^&gt; /gm, '')}</blockquote>`;
    return `<p>${h.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
