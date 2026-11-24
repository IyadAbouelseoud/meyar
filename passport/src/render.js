import { scaleHTML, combHTML } from '@design/meyar.js';
import { COPY, PHENOTYPE_PLAIN, PHENOTYPE_SHORT, drugLabel, formatNum, getScaleLabels } from './i18n.js';
import { getDrugsForGene, getTierInfo, isMedCausingShift } from './lookup.js';
import { lookupOtcProduct } from './otc.js';
import { renderId1CardHtml, renderA6FoldoutHtml } from './print.js';
import { buildGeneSpeakText } from './speech.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusIcon(status) {
  if (status === 'stop') return 'i-stop';
  if (status === 'ask') return 'i-ask';
  return 'i-none';
}

function statusText(status, t) {
  if (status === 'stop') return t.statusStop;
  if (status === 'ask') return t.statusAsk;
  return t.statusNone;
}

function renderTopbar(state, t) {
  const patients = ['demo-001', 'demo-002', 'demo-006'];
  return `
    <header class="m-topbar m-noprint">
      <div class="m-topbar__honesty">
        <span class="m-proto">${esc(t.proto)}</span>
        <span class="m-mock">${esc(t.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        ${state.caregiverMode ? '' : `
          <div class="m-seg" role="group" aria-label="${esc(t.patientLabel)}">
            ${patients.map((id) => `
              <button type="button" data-action="patient" data-patient="${id}" aria-pressed="${state.patientId === id}">
                <span class="m-data">${id}</span>
              </button>
            `).join('')}
          </div>
        `}
        <label class="m-switch">
          <input type="checkbox" data-action="elder" ${state.elder ? 'checked' : ''} aria-label="${esc(t.elderOff)}">
          <span>${esc(t.elderOff)}</span>
        </label>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${esc(t.langToggle)}
        </button>
      </div>
    </header>
    ${state.caregiverMode ? `
      <div class="m-caregiver-bar m-noprint" role="status" data-testid="caregiver-banner">
        <div class="m-caregiver-bar__info">
          <span class="m-status m-status--info">
            <svg aria-hidden="true"><use href="#i-info"/></svg>
            <span>${esc(t.caregiverBadge)}</span>
          </span>
          <p class="m-sec-sub">${esc(t.caregiverNote)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="caregiver-toggle">
          ${esc(t.caregiverExitBtn)}
        </button>
      </div>
    ` : ''}
  `;
}

function renderCover(t) {
  return `
    <section class="m-cover" aria-labelledby="cover-title">
      <div>
        <span class="m-eyebrow m-cover__kicker">${esc(t.brand)} · <span class="m-data">${esc(t.brandEn)}</span></span>
        <h1 class="m-cover__title" id="cover-title">${esc(t.passportTitle)}</h1>
        <p class="m-cover__sub">${esc(t.coverSub)}</p>
      </div>
      <button type="button" class="m-btn m-cover__cta" data-action="tab" data-tab="doctor">
        <svg aria-hidden="true"><use href="#i-qr"/></svg>
        <span>${esc(t.showDoctorBtn)}</span>
      </button>
      <div class="m-qatt m-qatt--thin" aria-hidden="true"></div>
    </section>
  `;
}

function renderSpeakControl(speakText, index, state, t) {
  const isSpeaking = state.speakingIndex === index;
  if (state.speechAvailable) {
    return `
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${index}" data-speak="${esc(speakText)}" aria-pressed="${isSpeaking}">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${esc(isSpeaking ? t.stopReading : t.readAloud)}</span>
      </button>
    `;
  }
  return `
    <span class="m-speak-tooltip" title="${esc(t.readAloudUnavailable)}" data-tooltip="${esc(t.readAloudUnavailable)}" tabindex="0" role="note" aria-label="${esc(t.readAloudUnavailable)}">
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${index}" hidden aria-hidden="true" tabindex="-1">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${esc(t.readAloud)}</span>
      </button>
      <svg aria-hidden="true"><use href="#i-info"/></svg>
      <span>${esc(t.readAloudUnavailableShort)}</span>
    </span>
  `;
}

function renderGeneCard(gene, index, lang, t, state) {
  const notAssessed = gene.callability?.method === 'not-assessed';
  const tierInfo = getTierInfo(gene);
  const activePhenotype = gene.effectivePhenotype || gene.phenotype;
  const headingId = `gene-h-${index}`;

  const tierBadge = `
    <span class="m-tier" title="${esc(tierInfo.note)}">
      <span class="m-tier__n">${formatNum(tierInfo.tier, lang)}</span>
      <span>${esc(t.tierLabel(tierInfo.tier))}</span>
    </span>
  `;

  if (notAssessed) {
    const naSpeakText = buildGeneSpeakText({
      gene,
      plainSentence: `${t.notAssessedTitle}. ${t.notAssessedBody}`,
      lang,
    });
    return `
      <article class="m-gene" aria-labelledby="${headingId}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${esc(gene.gene)} · VCF</span>
          <div class="m-gene__actions">
            ${tierBadge}
            ${renderSpeakControl(naSpeakText, index, state, t)}
          </div>
        </div>
        <p class="m-gene__plain" id="${headingId}">${esc(t.notAssessedTitle)}</p>
        ${scaleHTML(gene, lang, getScaleLabels(gene, lang))}
        <p class="m-coverage__line">${esc(t.notAssessedBody)}</p>
      </article>
    `;
  }

  const plainSentence = PHENOTYPE_PLAIN[lang]?.[activePhenotype] || activePhenotype || '';
  const drugs = getDrugsForGene(gene);
  const actionable = drugs.filter((d) => d.status === 'stop' || d.status === 'ask');
  const shownDrugs = actionable.length > 0 ? actionable : drugs.slice(0, 3);

  const becausePlain = gene.phenoconversion?.applied
    ? t.phenoconversionLine(
        PHENOTYPE_SHORT[lang]?.[gene.phenotype] || gene.phenotype,
        PHENOTYPE_SHORT[lang]?.[gene.effectivePhenotype] || gene.effectivePhenotype,
        (gene.phenoconversion.cause || []).map((c) => drugLabel(c, lang)).join(', ')
      ).replace(/<[^>]+>/g, '')
    : '';

  const becauseHtml = gene.phenoconversion?.applied
    ? `<p class="m-gene__because">${t.phenoconversionLine(
        esc(PHENOTYPE_SHORT[lang]?.[gene.phenotype] || gene.phenotype),
        esc(PHENOTYPE_SHORT[lang]?.[gene.effectivePhenotype] || gene.effectivePhenotype),
        esc((gene.phenoconversion.cause || []).map((c) => drugLabel(c, lang)).join(', '))
      )}</p>`
    : '';

  const drugsHtml = shownDrugs.length > 0
    ? `<div class="m-gene__drugs">
        ${shownDrugs.map((d) => {
          const alts = d.alternatives.length > 0
            ? `<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${esc(t.betterMatch)} <strong>${esc(d.alternatives.map((a) => drugLabel(a, lang)).join(' / '))}</strong> — ${esc(t.askYourDoctor)} (${esc(d.guideline?.pub || 'CPIC')})</span>
              </div>`
            : '';
          return `
            <div class="m-drugrow">
              <span class="m-drugrow__name">${esc(drugLabel(d.drug, lang))}</span>
              <span class="m-status m-status--${d.status}">
                <svg aria-hidden="true"><use href="#${statusIcon(d.status)}"/></svg>
                <span>${esc(statusText(d.status, t))}</span>
              </span>
            </div>
            ${alts}
          `;
        }).join('')}
      </div>`
    : '';

  const cov = gene.coverage || {};
  const coverageHtml = cov.definingPositionsTotal > 0
    ? `<div class="m-coverage">
        ${combHTML(cov)}
        <p class="m-coverage__line">${t.coverageLine(cov.definingPositionsAssayed, cov.definingPositionsTotal, cov.untestedLocalAlleles)}</p>
      </div>`
    : (gene.callability?.method === 'outside-call'
        ? `<p class="m-coverage__line">${esc(t.outsideCallNote)}</p>`
        : '');

  const speakText = buildGeneSpeakText({
    gene,
    plainSentence,
    phenoconversionLine: becausePlain,
    drugs: shownDrugs.map((d) => ({
      label: drugLabel(d.drug, lang),
      statusLabel: statusText(d.status, t),
    })),
    lang,
  });

  return `
    <article class="m-gene" aria-labelledby="${headingId}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${esc(gene.gene)}${gene.diplotype ? ` · ${esc(gene.diplotype)}` : ''}</span>
        <div class="m-gene__actions">
          ${tierBadge}
          ${renderSpeakControl(speakText, index, state, t)}
        </div>
      </div>
      <p class="m-gene__plain" id="${headingId}">${esc(plainSentence)}</p>
      ${scaleHTML(gene, lang)}
      ${becauseHtml}
      ${drugsHtml}
      ${coverageHtml}
    </article>
  `;
}

function renderGenesView(contract, lang, t, state) {
  return `
    ${renderCover(t)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${esc(t.myGenesTitle)}</h2>
        <p class="m-sec-sub">${esc(t.myGenesSub)}</p>
      </div>
      ${(contract.genes || []).map((g, i) => renderGeneCard(g, i, lang, t, state)).join('')}
    </section>
  `;
}

function renderMedsView(contract, lang, t) {
  const meds = contract.currentMedications || [];
  const genes = contract.genes || [];
  return `
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${esc(t.myMedsTitle)}</h2>
        <p class="m-sec-sub">${esc(t.myMedsSub)}</p>
      </div>
      ${meds.length === 0
        ? `<div class="m-empty">${esc(t.noMeds)}</div>`
        : `<div class="m-medlist">
            ${meds.map((m) => {
              const shifts = isMedCausingShift(m.name, genes);
              const srcText = m.source === 'hospital-record' ? t.sourceHospital : t.sourcePatient;
              return `
                <div>
                  <div>
                    <b>${esc(drugLabel(m.name, lang))}</b>
                    ${m.mock ? `<span class="m-mock">${esc(t.demo)}</span>` : ''}
                    <br>
                    <small>${esc(srcText)}</small>
                  </div>
                  <span class="m-status ${shifts ? 'm-status--info' : 'm-status--none'}">
                    <svg aria-hidden="true"><use href="#${shifts ? 'i-info' : 'i-none'}"/></svg>
                    <span>${esc(shifts ? t.changesGene : t.noGeneImpact)}</span>
                  </span>
                </div>
              `;
            }).join('')}
          </div>`
      }
    </section>
  `;
}

function renderQrCard(state, t) {
  const qr = state.qrResult;
  const isPlain = Boolean(state.devMode && state.qrPlaintext);
  return `
    <section class="m-qr-card m-noprint" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${esc(t.qrTitle)}</h3>
          <p class="m-sec-sub">${esc(t.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${esc(isPlain ? t.qrPlainBadge : t.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${qr ? qr.svg : `<p class="m-sec-sub">${esc(t.qrPinPrompt)}</p>`}
      </div>
      ${state.caregiverMode ? '<div class="m-qr-controls">' : `
      <div class="m-qr-controls">
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-input">${esc(t.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${esc(state.qrPin)}" data-action="qr-pin">
        </div>
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-confirm">${esc(t.qrPinConfirmLabel)}</label>
          <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${esc(state.qrPinConfirm)}" data-action="qr-pin-confirm">
        </div>
      </div>
      <div class="m-qr-emergency">
        <label class="m-switch"><input type="checkbox" role="switch" data-action="qr-emergency-toggle" ${state.qrEmergencyOn ? 'checked' : ''}><span>${esc(t.qrEmergencyToggle)}</span></label>
        ${state.qrEmergencyOn ? `
          <div class="m-field">
            <label for="qr-emergency-input">${esc(t.qrEmergencyLabel)}</label>
            <input id="qr-emergency-input" class="m-input" type="text" maxlength="120" value="${esc(state.qrEmergency)}" data-action="qr-emergency">
            <p class="m-qr-honesty">${esc(t.qrEmergencyHint)}</p>
          </div>` : ''}
      </div>
      ${state.qrPinError ? `<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${esc(state.qrPinError)}</span></div>` : ''}
      <div class="m-qr-controls">
        <button type="button" class="m-btn${qr && qr.encrypted ? ' m-btn--secondary' : ''}" data-action="issue-card">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${esc(state.qrIssued > 0 ? t.qrReissueBtn : t.qrIssueBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--secondary" data-action="decode-qr" ${qr ? '' : 'disabled'}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${esc(t.qrVerifyBtn)}</span>
        </button>`}
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${esc(t.openScannerBtn)}</span>
        </a>
        ${!state.caregiverMode ? `
          <button type="button" class="m-btn m-btn--secondary" data-action="caregiver-toggle">
            ${esc(t.caregiverOpenBtn)}
          </button>
          <button type="button" class="m-btn m-btn--quiet" data-action="caregiver-copy">
            ${esc(state.caregiverCopied ? t.caregiverCopied : t.caregiverCopyBtn)}
          </button>
        ` : ''}
        ${!state.caregiverMode && state.devMode ? `
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${state.qrPlaintext}">
            ${esc(t.qrPlaintextToggle)}
          </button>
        ` : ''}
      </div>
      ${state.devMode && qr ? `
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${qr.rawBytes} B → deflate ${qr.compressedBytes} B → envelope ${qr.envelopeBytes} B · ${qr.modules}×${qr.modules} · EC ${qr.errorCorrectionLevel}</p>
      ` : ''}
      <p class="m-qr-honesty" data-testid="qr-brute-honesty">${esc(t.qrPinBrute)}</p>
      ${state.qrIssued > 0 ? `<p class="m-qr-honesty">${esc(t.qrReissueNote)}</p>` : ''}
      ${state.qrDecodeError ? `<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${esc(t.qrDecodedFail)}</span></div>` : ''}
      ${state.qrDecoded ? `
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${esc(t.qrDecodedOk)}</strong>
          <pre class="m-data">${esc(JSON.stringify(state.qrDecoded, null, 2))}</pre>
        </div>
      ` : ''}
    </section>
  `;
}

function renderPrintSection(contract, state, t) {
  const qr = state.qrResult;
  const ready = Boolean(qr && qr.encrypted);
  return `
    <section class="m-print-panel" aria-labelledby="print-heading" data-testid="print-section">
      <div class="m-print-panel__head m-noprint">
        <h3 class="m-qr-card__title" id="print-heading">${esc(t.printTitle)}</h3>
        <p class="m-sec-sub">${esc(t.printSub)}</p>
      </div>
      ${ready ? `
        <div class="m-print-controls m-noprint">
          <button type="button" class="m-btn" data-action="print-id1">${esc(t.printId1Btn)}</button>
          <button type="button" class="m-btn m-btn--secondary" data-action="print-a6">${esc(t.printA6Btn)}</button>
          <button type="button" class="m-btn m-btn--secondary" data-action="print-both">${esc(t.printBothBtn)}</button>
        </div>
        <div class="m-print-sheets">
          <figure class="m-print-sheet m-print-sheet--id1">
            ${renderId1CardHtml({ qrSvg: qr.svg, lang: state.lang, t })}
            <figcaption class="m-print-caption m-noprint">${esc(t.printId1Caption)}</figcaption>
          </figure>
          <figure class="m-print-sheet m-print-sheet--a6">
            ${renderA6FoldoutHtml({ contract, lang: state.lang, t })}
            <figcaption class="m-print-caption m-noprint">${esc(t.printA6Caption)}</figcaption>
          </figure>
        </div>
      ` : `
        <div class="m-empty m-noprint" data-testid="print-requires-pin">${esc(t.printRequiresPin)}</div>
      `}
    </section>
  `;
}

function renderDoctorView(contract, lang, t, state) {
  const genes = contract.genes || [];
  const meds = contract.currentMedications || [];
  return `
    <section class="m-stack" aria-labelledby="doc-heading">
      <div class="m-doctor-head m-noprint">
        <h2 class="m-sec-title" id="doc-heading">${esc(t.doctorTitle)}</h2>
        <p class="m-sec-sub">${esc(t.doctorSub)}</p>
      </div>
      ${renderQrCard(state, t)}
      ${renderPrintSection(contract, state, t)}
      <div class="m-doctor-sheet m-chartpaper m-noprint">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${esc(t.doctorPatientId)}</small>
            <span class="m-data">${esc(contract.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${esc(t.doctorOrigin)}</small>
            <span>${esc(t.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${esc(t.myMedsTitle)}</small>
            <span>${meds.length ? meds.map((m) => esc(m.name)).join(', ') : '—'}</span>
          </div>
        </div>
        ${genes.map((g) => {
          const notAssessed = g.callability?.method === 'not-assessed';
          const tierInfo = getTierInfo(g);
          const drugs = getDrugsForGene(g).filter((d) => d.status !== 'none');
          const cov = g.coverage || {};
          const covSummary = notAssessed
            ? (g.callability?.reason || t.notAssessedBody)
            : (cov.definingPositionsTotal > 0
                ? `${cov.definingPositionsAssayed}/${cov.definingPositionsTotal} positions; untested: ${(cov.untestedLocalAlleles || []).join(', ') || 'none'}`
                : (g.callability?.source || 'Outside call'));
          return `
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${esc(g.gene)}${g.diplotype ? ` · ${esc(g.diplotype)}` : ' · Not assessed'}</strong>
                <span class="m-tier"><span class="m-tier__n">T${tierInfo.tier}</span> ${esc(g.guidelineVersion || '')}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${esc(t.doctorColGenetic)}:</strong> ${esc(g.phenotype || 'Not assessed')}</div>
                <div><strong>${esc(t.doctorColEffective)}:</strong> ${esc(g.effectivePhenotype || g.phenotype || 'Not assessed')}${g.phenoconversion?.applied ? ` (${esc((g.phenoconversion.cause || []).join(', '))}; ${esc(g.phenoconversion.method || '')})` : ''}</div>
                <div><strong>${esc(t.doctorColCoverage)}:</strong> ${esc(covSummary)}</div>
              </div>
              ${drugs.length > 0
                ? `<div class="m-gene__drugs">
                    ${drugs.map((d) => `
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${esc(d.drug)}</span>
                        <span class="m-status m-status--${d.status}">
                          <svg aria-hidden="true"><use href="#${statusIcon(d.status)}"/></svg>
                          <span>${esc(statusText(d.status, t))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${esc(d.recommendation)}${d.alternatives.length ? ` <strong>${esc(t.betterMatch)} ${esc(d.alternatives.join(', '))}</strong>` : ''} <span class="m-data">(${esc(d.guideline?.pub || 'CPIC')})</span></p>
                    `).join('')}
                  </div>`
                : `<p class="m-coverage__line">${esc(notAssessed ? t.notAssessedBody : t.doctorNoDrugs)}</p>`
              }
            </div>
          `;
        }).join('')}
        <p class="m-doctor-foot">${esc(t.doctorFooter)}</p>
      </div>
    </section>
  `;
}

function renderOtcDetailLine(detail, lang, t) {
  const geneHtml = detail.gene ? `<span class="m-data">${esc(detail.gene)}</span>` : '';
  if (detail.reasonType === 'no-cpic-guideline') {
    return `<p class="m-answer__body">${esc(t.otcNoGuidelineBody)}</p>`;
  }
  if (detail.reasonType === 'not-assessed') {
    return `<p class="m-answer__body">${t.otcNotAssessedBody(geneHtml)}</p>`;
  }
  if (detail.reasonType === 'gene-not-in-profile') {
    return `<p class="m-answer__body">${t.otcMissingGeneBody(geneHtml)}</p>`;
  }
  const activePhen = detail.effectivePhenotype || 'Indeterminate';
  const phenLabel = PHENOTYPE_SHORT[lang]?.[activePhen] || activePhen;
  let mainLine = '';
  if (detail.status === 'stop') {
    mainLine = t.otcStopGuidelineBody(geneHtml, esc(phenLabel));
  } else if (detail.status === 'ask') {
    mainLine = t.otcAskGuidelineBody(geneHtml, esc(phenLabel));
  } else {
    mainLine = t.otcNormalGuidelineBody(geneHtml, esc(phenLabel));
  }

  const phenoShift = detail.phenoconversion?.applied
    ? `<p class="m-gene__because">${t.phenoconversionLine(
        esc(PHENOTYPE_SHORT[lang]?.[detail.geneticPhenotype] || detail.geneticPhenotype),
        esc(phenLabel),
        esc((detail.phenoconversion.cause || []).map((c) => drugLabel(c, lang)).join(', '))
      )}</p>`
    : '';

  const altsHtml = detail.alternatives?.length > 0
    ? `<div class="m-better">
        <svg aria-hidden="true"><use href="#i-match"/></svg>
        <span>${esc(t.betterMatch)} <strong>${esc(detail.alternatives.map((a) => drugLabel(a, lang)).join(' / '))}</strong> — ${esc(t.askYourDoctor)} <span dir="ltr">(${esc(detail.guideline?.pub || 'CPIC')})</span></span>
      </div>`
    : '';

  const sourceLine = detail.guideline
    ? `<p class="m-coverage__line">${esc(detail.guideline.name)} · ${esc(detail.guideline.pub)} (CPIC)</p>`
    : '';

  return `<p class="m-answer__body">${mainLine}</p>${phenoShift}${altsHtml}${sourceLine}`;
}

export function renderOtcResultHtml(query, contract, lang) {
  const t = COPY[lang] || COPY.ar;
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return `<div class="m-empty">${esc(t.otcIdle)}</div>`;
  }

  const res = lookupOtcProduct(trimmed, contract);
  if (!res || res.status === 'unknown') {
    return `
      <div class="m-answer m-answer--ask" data-testid="otc-answer" data-otc-status="unknown">
        <p class="m-answer__title">
          <svg aria-hidden="true"><use href="#i-ask"/></svg>
          <span>${esc(t.otcNotFoundTitle)}</span>
        </p>
        <p class="m-answer__body">${esc(t.otcNotFoundBody(trimmed))}</p>
      </div>
    `;
  }

  const sep = lang === 'ar' ? '، ' : ', ';
  const brandName = lang === 'ar' ? res.product.brandAr : res.product.brandEn;
  const ingList = (res.product.ingredients || []).map((i) => drugLabel(i, lang)).join(sep);

  // Deduplicate detail lines if multiple genes aren't present; show actionable details first.
  const sortedDetails = [...res.details].sort((a, b) => {
    const rank = { stop: 2, ask: 1, none: 0 };
    return (rank[b.status] ?? 0) - (rank[a.status] ?? 0);
  });
  const primaryDetails = sortedDetails.filter((d) => d.status === res.status);
  const shownDetails = primaryDetails.length > 0 ? primaryDetails : sortedDetails.slice(0, 1);

  return `
    <div class="m-answer m-answer--${res.status}" data-testid="otc-answer" data-otc-status="${res.status}">
      <p class="m-answer__title">
        <svg aria-hidden="true"><use href="#${statusIcon(res.status)}"/></svg>
        <span>${esc(statusText(res.status, t))}</span>
      </p>
      <p class="m-otc-match">
        <strong>${esc(t.otcMatchedLabel)}</strong> ${esc(brandName)}
        <span class="m-mock">${esc(t.demo)}</span>
        · <span>${esc(t.otcIngredientLabel)} ${esc(ingList)}</span>
        ${res.matchType === 'fuzzy' ? `<span class="m-otc-fuzzy">(${esc(t.otcFuzzyNote)})</span>` : ''}
      </p>
      ${shownDetails.map((d) => renderOtcDetailLine(d, lang, t)).join('')}
    </div>
  `;
}

function renderOtcView(contract, lang, t, state) {
  const examples = lang === 'ar'
    ? ['أوميبرازول', 'باراسيتامول', 'إيبوبروفين', 'سولبادين']
    : ['omeprazole', 'paracetamol', 'ibuprofen', 'Solpadeine'];

  return `
    <section class="m-stack" aria-labelledby="otc-heading">
      <div>
        <h2 class="m-sec-title" id="otc-heading">${esc(t.otcTitle)}</h2>
        <p class="m-sec-sub">${esc(t.otcSub)}</p>
      </div>
      <div class="m-panel m-otc-box">
        <div class="m-field">
          <label for="otc-input">${esc(t.otcLabel)}</label>
          <div class="m-otc-inputrow">
            <input id="otc-input" class="m-input" type="search" autocomplete="off" placeholder="${esc(t.otcPlaceholder)}" value="${esc(state.otcQuery)}" data-action="otc-query">
            <button type="button" class="m-btn m-btn--secondary" data-action="otc-clear">${esc(t.otcClearBtn)}</button>
          </div>
        </div>
        <div class="m-otc-examples" role="group" aria-label="${esc(t.otcExamplesLabel)}">
          <span class="m-otc-examples__label">${esc(t.otcExamplesLabel)}</span>
          ${examples.map((name) => `
            <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="otc-pick" data-query="${esc(name)}">${esc(name)}</button>
          `).join('')}
        </div>
      </div>
      <div id="otc-result" role="status" aria-live="polite">
        ${renderOtcResultHtml(state.otcQuery, contract, lang)}
      </div>
      <p class="m-coverage__line">${esc(t.otcOfflineNote)}</p>
    </section>
  `;
}

function renderTabs(activeTab, t) {
  const tabs = [
    { id: 'genes', icon: 'i-genes', label: t.tabGenes },
    { id: 'meds', icon: 'i-pill', label: t.tabMeds },
    { id: 'otc', icon: 'i-search', label: t.tabOtc },
    { id: 'doctor', icon: 'i-qr', label: t.tabDoctor },
  ];
  return `
    <nav class="m-tabs m-tabs--fixed m-noprint" aria-label="Passport navigation">
      ${tabs.map((tab) => `
        <button type="button" data-action="tab" data-tab="${tab.id}" aria-current="${activeTab === tab.id ? 'page' : 'false'}">
          <svg aria-hidden="true"><use href="#${tab.icon}"/></svg>
          <span>${esc(tab.label)}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

export function renderApp(root, state) {
  const t = COPY[state.lang] || COPY.ar;
  let body = '';
  if (state.error) {
    body = `<div class="m-empty">${esc(state.error)}</div>`;
  } else if (!state.contract) {
    body = `<div class="m-empty">...</div>`;
  } else if (state.tab === 'meds') {
    body = renderMedsView(state.contract, state.lang, t);
  } else if (state.tab === 'otc') {
    body = renderOtcView(state.contract, state.lang, t, state);
  } else if (state.tab === 'doctor') {
    body = renderDoctorView(state.contract, state.lang, t, state);
  } else {
    body = renderGenesView(state.contract, state.lang, t, state);
  }

  root.innerHTML = `
    <div class="m-app">
      ${renderTopbar(state, t)}
      <main id="main-content">${body}</main>
    </div>
    ${renderTabs(state.tab, t)}
  `;
}
