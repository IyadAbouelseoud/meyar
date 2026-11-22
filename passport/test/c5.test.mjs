import test from 'node:test';
import assert from 'node:assert/strict';
import { selectVoiceForLang, hasSpeechVoice, buildGeneSpeakText } from '../src/speech.js';

test('C5: selectVoiceForLang requires ar-SA in Arabic mode and returns null when absent', () => {
  const noArabicSa = [
    { lang: 'en-US', name: 'English US' },
    { lang: 'ar-EG', name: 'Arabic Egypt' },
  ];
  assert.equal(selectVoiceForLang(noArabicSa, 'ar'), null);
  assert.equal(hasSpeechVoice('ar', { getVoices: () => noArabicSa }), false);

  const withSaudi = [...noArabicSa, { lang: 'ar-SA', name: 'Maged' }];
  assert.equal(selectVoiceForLang(withSaudi, 'ar')?.lang, 'ar-SA');
  assert.equal(hasSpeechVoice('ar', { getVoices: () => withSaudi }), true);
});

test('C5: selectVoiceForLang handles English voices and missing speechSynthesis', () => {
  const voices = [{ lang: 'en-GB', name: 'British' }];
  assert.equal(selectVoiceForLang(voices, 'en')?.lang, 'en-GB');
  assert.equal(hasSpeechVoice('ar', null), false);
});

test('C5: buildGeneSpeakText combines gene, plain sentence, phenoconversion, and drugs', () => {
  const text = buildGeneSpeakText({
    gene: { gene: 'CYP2D6' },
    plainSentence: 'جسمك يعالج هذا الدواء ببطء.',
    phenoconversionLine: 'النتيجة الوراثية: طبيعي · يعمل الآن مثل: بطيء بسبب باروكسيتين',
    drugs: [{ label: 'كودايين', statusLabel: 'لا تتناوله دون طبيبك' }],
    lang: 'ar',
  });
  assert.match(text, /CYP2D6/);
  assert.match(text, /كودايين: لا تتناوله دون طبيبك/);
});
