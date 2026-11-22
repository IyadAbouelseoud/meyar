import { scaleHTML, combHTML } from '@design/meyar.js';
import { formatNum } from './i18n.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const SCAN_COPY = {
  ar: {
    proto: 'نموذج بحثي — ليس للاستخدام السريري',
    demo: 'بيانات تجريبية',
    langToggle: 'English',
    elderOn: 'خط مكبّر: يعمل',
    elderOff: 'خط مكبّر',
    backToPassport: 'جواز المريض',
    title: 'قارئ بطاقة مِعيار (دون إنترنت)',
    subtitle: 'امسح رمز الاستجابة السريعة من بطاقة المريض، ثم أدخل الرقم السري لفك التشفير محلياً.',
    startCam: 'بدء المسح بالكاميرا',
    stopCam: 'إيقاف الكاميرا',
    uploadImg: 'مسح صورة رمز QR',
    pasteSummary: 'إدخال نص الرمز يدوياً (للاختبار)',
    pasteLabel: 'نص مغلّف QR (JSON)',
    pasteBtn: 'متابعة',
    camReady: 'وجّه الكاميرا نحو رمز QR الخاص بالمريض.',
    camError: 'تعذّر فتح الكاميرا — يمكنك مسح صورة أو لصق نص الرمز أدناه.',
    qrInvalid: 'الرمز المقروء ليس بصيغة مِعيار (JSON).',
    pinTitle: 'أدخل الرقم السري للمريض',
    pinSub: 'تتم عملية فك التشفير محلياً على هذا الجهاز دون أي اتصال بالشبكة.',
    pinHonesty: 'يمنع الرقم السري المسح العابر فقط؛ يمكن تجربة التخمين إذا نُسخ الرمز.',
    decryptBtn: 'فك التشفير وعرض التوصية',
    decryptBusy: 'جارٍ فك التشفير محلياً…',
    pinError: 'تعذّر فك التشفير — تحقق من الرقم السري وحاول مرة أخرى.',
    rescanBtn: 'مسح بطاقة أخرى',
    patientLabel: 'المعرّف التجريبي',
    originLabel: 'نوع العيّنة',
    medsLabel: 'الأدوية الحالية',
    noMeds: 'لا توجد أدوية مسجلة',
    genotype: 'النمط الجيني',
    genetic: 'النتيجة الجينية',
    actingLike: 'الحالة الفعلية (A7)',
    noShift: 'لا يوجد تحوّل دوائي',
    betterMatch: 'أنسب لجينات هذا المريض:',
    sendPharm: 'إرسال للصيدلي',
    advisesFoot: 'ينصح ولا يصف الدواء',
    cpicLink: 'دليل CPIC',
    outsideCallFoot: 'نتيجة محاكاة خارجية (تجريبية) لتقدير عدد النسخ',
    notAssessedFoot: 'عدد النسخ غير مفحوص — لا توجد نتيجة معروضة',
    covAssayed: (a, t, u) => {
      const base = `فحصنا <strong>${formatNum(a, 'ar')} من ${formatNum(t, 'ar')}</strong> موضعاً تعريفياً.`;
      if (!u || u.length === 0) return base;
      return `${base} لم نفحص ${u.map((x) => `<span class="m-data">${esc(x)}</span>`).join('، ')}.`;
    },
    clearKey: 'مسح',
    backKey: 'حذف',
  },
  en: {
    proto: 'Research prototype — not for clinical use',
    demo: 'Demo data',
    langToggle: 'العربية',
    elderOn: 'Elder mode: On',
    elderOff: 'Elder mode',
    backToPassport: 'Patient passport',
    title: 'Meyar scan-side reader (offline)',
    subtitle: 'Scan the patient QR card with the camera, then enter their PIN to decrypt locally.',
    startCam: 'Start camera scan',
    stopCam: 'Stop camera',
    uploadImg: 'Scan QR from image',
    pasteSummary: 'Paste QR payload (offline test)',
    pasteLabel: 'QR envelope JSON',
    pasteBtn: 'Load QR payload',
    camReady: 'Point the camera at the patient QR card.',
    camError: 'Camera unavailable — scan an image file or paste the QR payload below.',
    qrInvalid: 'Scanned text is not a valid Meyar QR envelope.',
    pinTitle: 'Enter patient PIN',
    pinSub: 'Decryption runs locally on this device with zero network calls.',
    pinHonesty: 'The PIN stops casual scanning only; a copied QR can be brute-forced offline.',
    decryptBtn: 'Decrypt card',
    decryptBusy: 'Decrypting locally…',
    pinError: 'Could not decrypt with this PIN — ask the patient and try again.',
    rescanBtn: 'Scan another card',
    patientLabel: 'Demo ID',
    originLabel: 'Sample origin',
    medsLabel: 'Current medicines',
    noMeds: 'None recorded',
    genotype: 'Genotype',
    genetic: 'Genetic',
    actingLike: 'Acting like',
    noShift: 'no shift',
    betterMatch: "Better matched for this patient's genes:",
    sendPharm: 'Send to pharmacist',
    advisesFoot: 'Advises, does not prescribe',
    cpicLink: 'CPIC guideline',
    outsideCallFoot: 'CYP2D6 from outside call (mock caller)',
    notAssessedFoot: 'Copy number not assessed — no result reported',
    covAssayed: (a, t, u) => {
      const base = `Assay covered <strong>${a} of ${t}</strong> defining positions.`;
      if (!u || u.length === 0) return base;
      return `${base} Did not test ${u.map((x) => `<span class="m-data">${esc(x)}</span>`).join(', ')}.`;
    },
    clearKey: 'Clear',
    backKey: 'Del',
  },
};

function renderTopbar(state, t) {
  return `
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${esc(t.proto)}</span>
        <span class="m-mock">${esc(t.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        <a class="m-btn m-btn--quiet m-ctrl-btn" href="/index.html?tab=doctor">${esc(t.backToPassport)}</a>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="elder" aria-pressed="${state.elder}">
          ${esc(state.elder ? t.elderOn : t.elderOff)}
        </button>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${esc(t.langToggle)}
        </button>
      </div>
    </header>
  `;
}

function renderScannerStep(state, t) {
  return `
    <section class="m-panel m-scan-panel" aria-labelledby="scan-step-heading">
      <div class="m-scan-panel__head">
        <h2 class="m-sec-title" id="scan-step-heading">${esc(t.title)}</h2>
        <p class="m-sec-sub">${esc(t.subtitle)}</p>
      </div>
      <div class="m-scan-viewport" data-active="${state.cameraActive}">
        <video id="scan-video" playsinline muted ${state.cameraActive ? '' : 'hidden'}></video>
        ${!state.cameraActive ? `<div class="m-scan-placeholder"><svg aria-hidden="true"><use href="#i-qr"/></svg><span>${esc(t.camReady)}</span></div>` : ''}
      </div>
      <div class="m-scan-actions">
        ${state.cameraActive
          ? `<button type="button" class="m-btn m-btn--secondary" data-action="stop-cam">${esc(t.stopCam)}</button>`
          : `<button type="button" class="m-btn" data-action="start-cam"><svg aria-hidden="true"><use href="#i-camera"/></svg><span>${esc(t.startCam)}</span></button>`
        }
        <label class="m-btn m-btn--secondary m-scan-upload">
          <input type="file" accept="image/*" data-action="scan-file" hidden>
          <span>${esc(t.uploadImg)}</span>
        </label>
      </div>
      ${state.scanError ? `<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${esc(state.scanError)}</span></div>` : ''}
      <details class="m-scan-paste">
        <summary>${esc(t.pasteSummary)}</summary>
        <div class="m-scan-paste__body">
          <label for="scan-paste-input">${esc(t.pasteLabel)}</label>
          <textarea id="scan-paste-input" class="m-data m-scan-textarea" rows="3" placeholder='{"v":1,"s":"...","n":"...","c":"..."}'>${esc(state.pasteDraft)}</textarea>
          <button type="button" class="m-btn m-btn--secondary" data-action="load-pasted">${esc(t.pasteBtn)}</button>
        </div>
      </details>
    </section>
  `;
}

function renderPinStep(state, t) {
  const maxLen = 6;
  const len = state.pin.length;
  const dots = Array.from({ length: maxLen }, (_, i) => `<i${i < len ? ' class="is-on"' : ''}></i>`).join('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return `
    <section class="m-panel m-scan-panel m-scan-pin-panel" aria-labelledby="pin-heading">
      <div>
        <h2 class="m-sec-title" id="pin-heading">${esc(t.pinTitle)}</h2>
        <p class="m-sec-sub">${esc(t.pinSub)}</p>
      </div>
      <div class="m-pin-dots" role="img" aria-label="${len} of ${maxLen} digits entered" data-testid="pin-dots">
        ${dots}
      </div>
      <div class="m-pin" role="group" aria-label="PIN keypad">
        ${keys.map((d) => `
          <button type="button" data-action="pin-digit" data-digit="${d}">
            <b>${AR_DIGITS[Number(d)]}</b>
            <small>${d}</small>
          </button>
        `).join('')}
        <button type="button" data-action="pin-clear" aria-label="${esc(t.clearKey)}">
          <small>${esc(t.clearKey)}</small>
        </button>
        <button type="button" data-action="pin-digit" data-digit="0">
          <b>${AR_DIGITS[0]}</b>
          <small>0</small>
        </button>
        <button type="button" data-action="pin-back" aria-label="${esc(t.backKey)}">
          <small>${esc(t.backKey)}</small>
        </button>
      </div>
      <div class="m-scan-actions">
        <button type="button" class="m-btn" data-action="decrypt" ${len >= 4 && !state.decrypting ? '' : 'disabled'}>
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${esc(state.decrypting ? t.decryptBusy : t.decryptBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--quiet" data-action="reset-scan">
          ${esc(t.rescanBtn)}
        </button>
      </div>
      ${state.pinError ? `<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${esc(state.pinError)}</span></div>` : ''}
      <p class="m-qr-honesty" data-testid="pin-honesty">${esc(t.pinHonesty)}</p>
    </section>
  `;
}

function renderCdsCard(card, t, lang) {
  const indIcon = card.indicator === 'warning' ? 'i-ask' : 'i-info';
  const actingDisplay = card.notAssessed
    ? 'Not assessed — no result reported'
    : card.phenoconverted
      ? `${card.effectivePhenotype} (because of ${card.cause.join(', ')})`
      : `${card.effectivePhenotype} (${t.noShift})`;

  const cov = card.contractGene.coverage || {};
  const coverageBlock = cov.definingPositionsTotal > 0
    ? `<div class="m-coverage">
        ${combHTML(cov)}
        <p class="m-coverage__line">${t.covAssayed(cov.definingPositionsAssayed, cov.definingPositionsTotal, cov.untestedLocalAlleles)} <span class="m-tier"><span class="m-tier__n">T${card.saudiTier}</span> ${esc(card.saudiNote)}</span></p>
      </div>`
    : `<p class="m-coverage__line"><span class="m-tier"><span class="m-tier__n">T${card.saudiTier}</span> ${esc(card.saudiNote)}</span></p>`;

  const leadDrug = card.drugs[0] || null;
  const allAlts = Array.from(new Set(card.drugs.flatMap((d) => d.alternatives || [])));
  const guidelineUrl = leadDrug?.guideline?.url || null;

  const footRight = card.notAssessed
    ? `<span>${esc(t.notAssessedFoot)}</span>`
    : card.outsideCall
      ? `<span>${esc(t.outsideCallFoot)}</span>`
      : guidelineUrl
        ? `<a href="${esc(guidelineUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--m-brand)">${esc(t.cpicLink)}</a>`
        : `<span>${esc(card.guidelineVersion)}</span>`;

  return `
    <article class="m-cds" data-gene="${esc(card.gene)}">
      <div class="m-cds__bar">
        <span class="m-cds__indicator m-cds__indicator--${card.indicator}">
          <svg aria-hidden="true"><use href="#${indIcon}"/></svg>
          <span>${esc(card.indicator)}</span>
        </span>
        <span>${esc(card.guidelineVersion || 'A8')} · <span class="m-mock">${esc(t.demo)}</span></span>
      </div>
      <div class="m-cds__body">
        <p class="m-cds__summary">${esc(card.summary)}</p>
        <dl class="m-cds__pheno">
          <dt>${esc(t.genotype)}</dt>
          <dd class="m-data">${esc(card.gene)}${card.diplotype ? ` ${esc(card.diplotype)}` : ' · Not assessed'}</dd>
          <dt>${esc(t.genetic)}</dt>
          <dd>${esc(card.geneticPhenotype || 'Not assessed — no result reported')}</dd>
          <dt>${esc(t.actingLike)}</dt>
          <dd>${esc(actingDisplay)}</dd>
        </dl>
        ${scaleHTML(card.contractGene, 'clinician')}
        ${card.notAssessed
          ? `<blockquote class="m-cds__rec">Copy number not assessed by this test — no result reported. An outside call from a CNV-aware caller is required.<cite>Meyar A8 structural-variant gate</cite></blockquote>`
          : card.drugs.map((d) => `
              <blockquote class="m-cds__rec">
                <strong>${esc(d.drug)}</strong>: ${esc(d.recommendation)}
                <cite>${esc(d.guideline?.pub || card.guidelineVersion || 'CPIC')}</cite>
              </blockquote>
            `).join('')
        }
        ${coverageBlock}
        ${allAlts.length > 0 ? `
          <div class="m-cds__suggest">
            ${allAlts.map((alt, i) => `
              <div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${esc(t.betterMatch)} <strong>${esc(alt)}</strong></span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="m-cds__foot">
        <span>${esc(t.advisesFoot)}</span>
        ${footRight}
      </div>
    </article>
  `;
}

function renderResultStep(state, t) {
  const payload = state.decoded;
  const meds = payload.meds || [];
  return `
    <section class="m-stack" aria-labelledby="result-heading">
      <div class="m-panel m-scan-meta">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${esc(t.patientLabel)}</small>
            <span class="m-data" id="result-heading">${esc(payload.id)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${esc(t.originLabel)}</small>
            <span class="m-data">${esc(payload.o)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${esc(t.medsLabel)}</small>
            <span>${meds.length ? meds.map((m) => esc(m.n)).join(', ') : esc(t.noMeds)}</span>
          </div>
        </div>
        <button type="button" class="m-btn m-btn--secondary" data-action="reset-scan">${esc(t.rescanBtn)}</button>
      </div>
      ${state.cards.map((card) => renderCdsCard(card, t, state.lang)).join('')}
    </section>
  `;
}

export function renderScanApp(root, state) {
  const t = SCAN_COPY[state.lang] || SCAN_COPY.ar;
  let body;
  if (state.step === 'result' && state.decoded) {
    body = renderResultStep(state, t);
  } else if (state.step === 'pin') {
    body = renderPinStep(state, t);
  } else {
    body = renderScannerStep(state, t);
  }

  root.innerHTML = `
    <div class="m-app">
      ${renderTopbar(state, t)}
      <main id="main-content">${body}</main>
    </div>
  `;
}

export { SCAN_COPY };
