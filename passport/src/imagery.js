// Image library on the Passport (REVIEW, known issue 1). Files are copies of design/imagery/*.webp in
// public/imagery/, so the build precaches them for offline use (vite.config.js, meyar-precache-sw).
// Rules (AGENTS.md section 11): an image is never inside clinical content, never shows a phenotype, dose or
// patient data, and always carries the "AI-generated illustration" label.

export const IMAGES = {
  'img-02': { w: 1280, h: 800, big: 1920, alt: {
    en: 'An older woman reads her phone by a window in a whitewashed home',
    ar: 'امرأة مسنّة تقرأ هاتفها بجانب نافذة في بيت مطليّ بالأبيض',
  } },
  'img-06': { w: 1280, h: 853, big: 1920, alt: {
    en: 'The printed Meyar card on a majlis table beside a dallah and dates',
    ar: 'بطاقة مِعيار المطبوعة على طاولة مجلس بجانب دلّة وتمر',
  } },
  'img-14': { w: 1280, h: 960, big: 1920, alt: {
    en: 'A hand holds the printed card to a scanner at a pharmacy counter',
    ar: 'يد تُقرّب البطاقة المطبوعة من ماسح عند منضدة الصيدلية',
  } },
  'img-15': { w: 1280, h: 1600, big: 1792, alt: {
    en: 'A single capsule resting on the pan of a brass balance',
    ar: 'كبسولة واحدة على كفّة ميزان نحاسي',
  } },
};

export const AI_LABEL = { en: 'AI-generated illustration', ar: 'صورة توضيحية مولَّدة' };

/**
 * A decorative-but-described figure with the AI label.
 * @param {string} id      key of IMAGES
 * @param {'ar'|'en'} lang
 * @param {{ eager?: boolean, sizes?: string, className?: string }} [opts]
 */
export function renderFigure(id, lang, { eager = false, sizes = '(min-width: 760px) 728px, 100vw', className = '' } = {}) {
  const img = IMAGES[id];
  if (!img) return '';
  const l = lang === 'en' ? 'en' : 'ar';
  const base = `/imagery/${id}`;
  return `
    <figure class="m-figure ${className}" data-image="${id}">
      <picture>
        <img src="${base}.webp"
          srcset="${base}-640.webp 640w, ${base}.webp ${img.w}w, ${base}-1920.webp ${img.big}w"
          sizes="${sizes}" width="${img.w}" height="${img.h}"
          alt="${img.alt[l]}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
      </picture>
      <figcaption class="m-figure__label">${AI_LABEL[l]}</figcaption>
    </figure>`;
}
