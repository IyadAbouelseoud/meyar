import { scaleHTML, combHTML, SCALE, scaleKind } from '@design/meyar.js';

// Clinician side: CPIC terms, in the page language (same labels as the cds prescriber pages).
const CLIN_AR = {
  metabolizer: ['مستقلِب بطيء', 'متوسط', 'طبيعي', 'سريع', 'فائق السرعة'],
  function: ['وظيفة ضعيفة', 'منخفضة', 'طبيعية', 'مرتفعة', '—'],
};
const clinScale = (g, lang) => scaleHTML(g, lang, lang === 'ar' ? CLIN_AR[scaleKind(g.phenotype)] : SCALE[scaleKind(g.phenotype)].clinician);
import { formatNum, SCAN_COPY } from './i18n.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTopbar(state, t) {
  return `
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${esc(t.proto)}</span>
        <span class="m-proto" data-testid="honesty-data">${esc(t.noPatientData)}</span>
        <span class="m-mock">${esc(t.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        <a class="m-btn m-btn--quiet m-ctrl-btn" href="/index.html?tab=doctor">${esc(t.backToPassport)}</a>
        <label class="m-switch">
          <input type="checkbox" data-action="elder" ${state.elder ? 'checked' : ''} aria-label="${esc(t.elderOff)}">
          <span>${esc(t.elderOff)}</span>
        </label>
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

  const locked = (state.lockMs || 0) > 0;
  const lockSecs = Math.ceil((state.lockMs || 0) / 1000);
  const emergency = state.holder?.emergency;

  return `
    <section class="m-panel m-scan-panel m-scan-pin-panel" aria-labelledby="pin-heading">
      <div class="m-holder" data-testid="holder-view">
        <p class="m-holder__line"><svg aria-hidden="true"><use href="#i-lock"/></svg><span>${esc(t.holderLine)}</span></p>
        ${emergency
          ? `<p class="m-holder__emergency"><span class="m-holder__label">${esc(t.emergencyLabel)}</span> <bdi>${esc(emergency)}</bdi></p>`
          : ''}
        <p class="m-sec-sub">${esc(t.holderNote)}</p>
      </div>
      <div>
        <h2 class="m-sec-title" id="pin-heading">${esc(t.pinTitle)}</h2>
        <p class="m-sec-sub">${esc(t.pinSub)}</p>
      </div>
      <div class="m-pin-dots" role="img" aria-label="${esc(t.pinDotsAria.replace('{n}', formatNum(len, state.lang)).replace('{max}', formatNum(maxLen, state.lang)))}" data-testid="pin-dots">
        ${dots}
      </div>
      <div class="m-pin" role="group" aria-label="${esc(t.pinKeypadAria)}"${locked ? ' aria-disabled="true"' : ''}>
        ${keys.map((d) => `
          <button type="button" data-action="pin-digit" data-digit="${d}">
            <b>${formatNum(d, 'ar')}</b>
            <small>${d}</small>
          </button>
        `).join('')}
        <button type="button" data-action="pin-clear" aria-label="${esc(t.clearKey)}">
          <small>${esc(t.clearKey)}</small>
        </button>
        <button type="button" data-action="pin-digit" data-digit="0">
          <b>${formatNum(0, 'ar')}</b>
          <small>0</small>
        </button>
        <button type="button" data-action="pin-back" aria-label="${esc(t.backKey)}">
          <small>${esc(t.backKey)}</small>
        </button>
      </div>
      <div class="m-scan-actions">
        <button type="button" class="m-btn" data-action="decrypt" ${len === maxLen && !state.decrypting && !locked ? '' : 'disabled'}>
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${esc(state.decrypting ? t.decryptBusy : t.decryptBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--quiet" data-action="reset-scan">
          ${esc(t.rescanBtn)}
        </button>
      </div>
      ${locked
        ? `<div class="m-status m-status--ask" role="status" data-testid="pin-locked"><svg aria-hidden="true"><use href="#i-ask"/></svg><span>${esc(t.pinLocked(lockSecs))}</span></div>`
        : (state.pinError ? `<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${esc(state.pinError)}</span></div>` : '')}
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
          <dd class="m-data">${esc(card.gene)}${card.diplotype ? ` ${esc(card.diplotype)}` : ` · ${esc(t.notAssessedShort)}`}</dd>
          <dt>${esc(t.genetic)}</dt>
          <dd>${esc(card.geneticPhenotype || t.notAssessedNoResult)}</dd>
          <dt>${esc(t.actingLike)}</dt>
          <dd>${esc(actingDisplay)}</dd>
        </dl>
        ${clinScale(card.contractGene, lang)}
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
            <span id="result-heading">${esc(t.patientNoId)}</span>
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
