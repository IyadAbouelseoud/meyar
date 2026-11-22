// Plain-language Arabic (default) and English copy for Meyar Medication Passport.
// Rules:
// - Never use the word "safe" or a tick icon on the patient side.
// - Never invent numbers; any number shown comes from the contract or a cited table.
// - Genotype symbols, star alleles, and activity scores stay in .m-data (LTR).

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function formatNum(n, lang) {
  const s = String(n);
  if (lang !== 'ar') return s;
  return s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

export const DRUG_NAMES = {
  clopidogrel: { ar: 'كلوبيدوجريل', en: 'clopidogrel' },
  prasugrel: { ar: 'براسوغريل', en: 'prasugrel' },
  ticagrelor: { ar: 'تيكاجريلور', en: 'ticagrelor' },
  codeine: { ar: 'كودايين', en: 'codeine' },
  tramadol: { ar: 'ترامادول', en: 'tramadol' },
  omeprazole: { ar: 'أوميبرازول', en: 'omeprazole' },
  lansoprazole: { ar: 'لانسوبرازول', en: 'lansoprazole' },
  pantoprazole: { ar: 'بانتوبرازول', en: 'pantoprazole' },
  simvastatin: { ar: 'سيمفاستاتين', en: 'simvastatin' },
  atorvastatin: { ar: 'أتورفاستاتين', en: 'atorvastatin' },
  ibuprofen: { ar: 'إيبوبروفين', en: 'ibuprofen' },
  celecoxib: { ar: 'سيليكوكسيب', en: 'celecoxib' },
  meloxicam: { ar: 'ميلوكسيكام', en: 'meloxicam' },
  piroxicam: { ar: 'بيروكسيكام', en: 'piroxicam' },
  paroxetine: { ar: 'باروكسيتين', en: 'paroxetine' },
  duloxetine: { ar: 'دولوكسيتين', en: 'duloxetine' },
  fluvoxamine: { ar: 'فلوفوكسامين', en: 'fluvoxamine' },
  metformin: { ar: 'ميتفورمين', en: 'metformin' },
  'non-opioid analgesic': { ar: 'مسكّن غير أفيوني', en: 'non-opioid analgesic' },
};

export function drugLabel(name, lang) {
  const key = String(name || '').toLowerCase();
  const entry = DRUG_NAMES[key];
  if (!entry) return name;
  return lang === 'ar' ? entry.ar : `${entry.en}`;
}

export const PHENOTYPE_PLAIN = {
  ar: {
    'Poor Metabolizer': 'جسمك يعالج هذه الأدوية ببطء',
    'Intermediate Metabolizer': 'جسمك يعالج هذه الأدوية أبطأ قليلاً من المعتاد',
    'Normal Metabolizer': 'جسمك يعالج هذه الأدوية بالمعدل المعتاد',
    'Rapid Metabolizer': 'جسمك يعالج هذه الأدوية أسرع قليلاً من المعتاد',
    'Ultrarapid Metabolizer': 'جسمك يعالج هذه الأدوية بسرعة عالية',
  },
  en: {
    'Poor Metabolizer': 'Your body processes these medicines slowly',
    'Intermediate Metabolizer': 'Your body processes these medicines a bit slowly',
    'Normal Metabolizer': 'Your body processes these medicines at the usual pace',
    'Rapid Metabolizer': 'Your body processes these medicines a bit fast',
    'Ultrarapid Metabolizer': 'Your body processes these medicines very fast',
  },
};

export const PHENOTYPE_SHORT = {
  ar: {
    'Poor Metabolizer': 'بطيء',
    'Intermediate Metabolizer': 'أبطأ قليلاً',
    'Normal Metabolizer': 'طبيعي',
    'Rapid Metabolizer': 'أسرع قليلاً',
    'Ultrarapid Metabolizer': 'سريع جداً',
  },
  en: {
    'Poor Metabolizer': 'Slow',
    'Intermediate Metabolizer': 'A bit slow',
    'Normal Metabolizer': 'Normal',
    'Rapid Metabolizer': 'A bit fast',
    'Ultrarapid Metabolizer': 'Very fast',
  },
};

export const COPY = {
  ar: {
    brand: 'مِعيار',
    brandEn: 'Meyar',
    passportTitle: 'جواز الدواء',
    coverSub: 'نتائج جيناتك مع الأدوية، تعمل دون إنترنت.',
    showDoctorBtn: 'اعرضه على الطبيب أو الصيدلي',
    proto: 'نموذج بحثي — ليس للاستخدام السريري',
    demo: 'بيانات تجريبية',
    langToggle: 'English',
    elderOn: 'خط مكبّر: يعمل',
    elderOff: 'خط مكبّر',
    patientLabel: 'ملف العرض:',
    tabGenes: 'جيناتي',
    tabMeds: 'أدويتي',
    tabDoctor: 'عرض الطبيب',
    myGenesTitle: 'نتائج جيناتك',
    myGenesSub: 'النتائج الجينية تُظهر كيف يتعامل جسمك مع بعض الأدوية.',
    myMedsTitle: 'أدويتي الحالية',
    myMedsSub: 'بعض الأدوية التي تتناولها الآن قد تغيّر طريقة عمل جيناتك مؤقتاً.',
    noMeds: 'لا توجد أدوية مسجلة في هذا الملف التجريبي.',
    sourceHospital: 'من سجل المستشفى',
    sourcePatient: 'أضافه المريض',
    changesGene: 'يغيّر عمل جين',
    noGeneImpact: 'لا يغيّر عمل الجينات المفحوصة',
    statusStop: 'لا تتناوله دون طبيبك',
    statusAsk: 'اسأل الصيدلي قبل الشراء',
    statusNone: 'لا توجد توصية جينية لملفك',
    betterMatch: 'أنسب لجيناتك:',
    askYourDoctor: 'اسأل طبيبك',
    tierLabel: (n) => (n === 1 ? 'بيانات سعودية منشورة' : n === 0 ? 'تغيّر بنيوي' : 'لا توجد بيانات سعودية منشورة'),
    coverageLine: (assayed, total, untested) => {
      const base = `فحصنا <strong>${formatNum(assayed, 'ar')} من ${formatNum(total, 'ar')}</strong> موضعاً تعريفياً.`;
      if (!untested || untested.length === 0) return base;
      const list = untested.map((a) => `<span class="m-data">${a}</span>`).join('، ');
      return `${base} لم نفحص ${list}.`;
    },
    notAssessedTitle: 'لم يُفحص هذا الجين بعد',
    notAssessedBody: 'عدد النسخ البنيوية غير مفحوص في هذا الاختبار — لا توجد نتيجة معروضة. هذا ليس اطمئناناً.',
    phenoconversionLine: (genetic, acting, causes) =>
      `النتيجة الجينية: ${genetic} · يتصرف الآن مثل: ${acting} بسبب <b>${causes}</b>`,
    readAloud: 'اقرأ لي',
    stopReading: 'إيقاف',
    doctorTitle: 'ملخص للطبيب أو الصيدلي',
    doctorSub: 'اعرض هذه الشاشة على أي طبيب أو صيدلي قبل وصف دواء جديد.',
    doctorPatientId: 'المعرّف التجريبي',
    doctorOrigin: 'نوع العيّنة',
    doctorOriginGermline: 'وراثية (Germline)',
    doctorColGene: 'الجين والنمط',
    doctorColGenetic: 'النتيجة الجينية',
    doctorColEffective: 'الحالة الفعلية (A7)',
    doctorColCoverage: 'التغطية (A5 / A8)',
    doctorNoDrugs: 'لا توجد توصيات دوائية مفعّلة لهذا الجين في الجدول الحالي.',
    doctorFooter: 'ينصح ولا يصف الدواء · التوصيات من جدول CPIC المعتمد في مِعيار فقط.',
    outsideCallNote: 'نتيجة محاكاة خارجية (تجريبية) لتقدير عدد النسخ.',
    qrTitle: 'رمز الاستجابة السريعة (يعمل دون إنترنت)',
    qrSub: 'يحمل ملخص جيناتك مضغوطاً ومشفّراً برقم سري — وليس رابطاً لموقع.',
    qrPinLabel: 'الرقم السري (تجريبي)',
    qrPinHonesty: 'يمنع الرقم السري المسح العابر فقط؛ يمكن تجربة التخمين إذا نُسخ الرمز.',
    qrVerifyBtn: 'فك التشفير محلياً (دون إنترنت)',
    qrDecodedOk: 'تم فك التشفير محلياً دون اتصال:',
    qrDecodedFail: 'تعذّر فك التشفير بالرقم السري المدخل.',
    qrPlaintextToggle: 'وضع النص الصريح (للمطورين فقط)',
    qrEncryptedBadge: 'مشفّر (C8)',
    qrPlainBadge: 'نص صريح (تطوير)',
    qrGenerating: 'جارٍ توليد الرمز…',
    openScannerBtn: 'فتح قارئ البطاقة (للطاقم الطبي)',
  },
  en: {
    brand: 'Meyar',
    brandEn: 'مِعيار',
    passportTitle: 'Medication Passport',
    coverSub: 'Your gene–medicine results, ready offline.',
    showDoctorBtn: 'Show a doctor or pharmacist',
    proto: 'Research prototype — not for clinical use',
    demo: 'Demo data',
    langToggle: 'العربية',
    elderOn: 'Elder mode: On',
    elderOff: 'Elder mode',
    patientLabel: 'Demo profile:',
    tabGenes: 'My genes',
    tabMeds: 'My medicines',
    tabDoctor: 'Doctor view',
    myGenesTitle: 'Your gene results',
    myGenesSub: 'These results show how your body handles certain medicines.',
    myMedsTitle: 'My current medicines',
    myMedsSub: 'Medicines you already take can temporarily shift how a gene acts.',
    noMeds: 'No current medicines recorded in this demo profile.',
    sourceHospital: 'From hospital record',
    sourcePatient: 'Patient-entered',
    changesGene: 'Shifts gene activity',
    noGeneImpact: 'No shift on tested genes',
    statusStop: 'Do not take without your doctor',
    statusAsk: 'Ask the pharmacist before buying',
    statusNone: 'No gene guidance for your profile',
    betterMatch: 'Better matched for your genes:',
    askYourDoctor: 'ask your doctor',
    tierLabel: (n) => (n === 1 ? 'Published Saudi data' : n === 0 ? 'Structural gene' : 'No published Saudi data'),
    coverageLine: (assayed, total, untested) => {
      const base = `Assay covered <strong>${assayed} of ${total}</strong> defining positions.`;
      if (!untested || untested.length === 0) return base;
      const list = untested.map((a) => `<span class="m-data">${a}</span>`).join(', ');
      return `${base} Did not test ${list}.`;
    },
    notAssessedTitle: 'Not assessed — no result reported',
    notAssessedBody: 'Copy number not assessed by this test — no result reported. This is not a reassurance.',
    phenoconversionLine: (genetic, acting, causes) =>
      `Genetic result: ${genetic} · Acting like: ${acting} because of <b>${causes}</b>`,
    readAloud: 'Read aloud',
    stopReading: 'Stop',
    doctorTitle: 'Summary for doctor or pharmacist',
    doctorSub: 'Show this screen to any prescriber or pharmacist before starting a new medicine.',
    doctorPatientId: 'Demo ID',
    doctorOrigin: 'Sample origin',
    doctorOriginGermline: 'Germline',
    doctorColGene: 'Gene & diplotype',
    doctorColGenetic: 'Genetic result',
    doctorColEffective: 'Effective today (A7)',
    doctorColCoverage: 'Coverage (A5 / A8)',
    doctorNoDrugs: 'No drug guidance rows matched for this gene in the current table.',
    doctorFooter: 'Advises, does not prescribe · Recommendations looked up from CPIC table only.',
    outsideCallNote: 'Mock outside-call result for copy-number demonstration.',
    qrTitle: 'Offline QR passport',
    qrSub: 'Carries your compressed gene summary encrypted with a PIN — never a URL.',
    qrPinLabel: 'Demo PIN',
    qrPinHonesty: 'The PIN stops casual scanning only; a copied QR can be brute-forced offline.',
    qrVerifyBtn: 'Verify offline decode',
    qrDecodedOk: 'Decoded locally with no network:',
    qrDecodedFail: 'Could not decode with this PIN.',
    qrPlaintextToggle: 'Plaintext mode (dev only)',
    qrEncryptedBadge: 'Encrypted (C8)',
    qrPlainBadge: 'Plaintext (dev)',
    qrGenerating: 'Generating QR…',
    openScannerBtn: 'Open scan-side reader',
  },
};
