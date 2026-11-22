/**
 * Speech synthesis helpers for Meyar Medication Passport (C5).
 * Checks for an ar-SA voice (or English voice in EN mode) before enabling read-aloud.
 */

export function selectVoiceForLang(voices, lang = 'ar') {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const norm = (v) => String(v?.lang || '').toLowerCase().replace('_', '-');

  if (lang === 'ar') {
    // Prefer exact ar-SA; do not fall back to unrelated languages.
    return voices.find((v) => norm(v) === 'ar-sa' || norm(v).startsWith('ar-sa-')) || null;
  }

  return (
    voices.find((v) => norm(v) === 'en-us' || norm(v) === 'en-gb') ||
    voices.find((v) => norm(v).startsWith('en-')) ||
    voices.find((v) => norm(v) === 'en') ||
    null
  );
}

export function hasSpeechVoice(lang = 'ar', synth = typeof window !== 'undefined' ? window.speechSynthesis : null) {
  if (!synth || typeof synth.getVoices !== 'function') return false;
  return selectVoiceForLang(synth.getVoices(), lang) !== null;
}

export function buildGeneSpeakText({ gene, plainSentence, phenoconversionLine, drugs = [], lang = 'ar' }) {
  const parts = [];
  if (gene?.gene) parts.push(gene.gene);
  if (plainSentence) parts.push(plainSentence);
  if (phenoconversionLine) parts.push(phenoconversionLine);
  for (const d of drugs) {
    if (d.label && d.statusLabel) {
      parts.push(lang === 'ar' ? `${d.label}: ${d.statusLabel}` : `${d.label}: ${d.statusLabel}`);
    }
  }
  return parts.join('. ');
}
