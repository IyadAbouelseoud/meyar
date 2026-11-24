import { scaleHTML, combHTML } from '@design/meyar.js';
import { COPY, PHENOTYPE_PLAIN, PHENOTYPE_SHORT, drugLabel, formatNum, getScaleLabels } from './i18n.js';
import { getDrugsForGene, getMedGeneEffects, getTierInfo } from './lookup.js';
import { canonicalDrugName } from './phenoconvert.js';
import { lookupOtcProduct } from './otc.js';
import { renderId1CardHtml, renderA6FoldoutHtml } from './print.js';
import { buildGeneSpeakText } from './speech.js';

function medGeneNote(fx, t) {
  const parts = [];
  if (fx.scored.length) parts.push(`<span class="m-data">${esc(fx.scored.join(', '))}</span>`);
  if (fx.flagged.length) parts.push(`${esc(t.mayAffectPrefix)} <span class="m-data">${esc(fx.flagged.join(', '))}</span>`);
  return parts.join(' · ');
}

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

  const sep = lang === 'ar' ? '، ' : ', ';
  const shortWord = (p) => {
    const w = PHENOTYPE_SHORT[lang]?.[p] || p || '';
    return lang === 'en' ? w.toLowerCase() : w;
  };
  const causesLabel = (gene.phenoconversion?.cause || []).map((c) => drugLabel(c, lang)).join(sep);
  const shiftedPhenotype = Boolean(
    gene.phenoconversion?.applied
    && gene.effectivePhenotype
    && gene.effectivePhenotype !== gene.phenotype
  );

  let becauseHtml = '';
  let becausePlain = '';
  if (gene.phenoconversion?.applied && shiftedPhenotype) {
    const tellDoc = actionable.length > 0
      ? ` ${esc(t.geneTellDoctorBefore(actionable.map((d) => drugLabel(d.drug, lang)).join(sep)))}`
      : '';
    const lineHtml = `${t.genePhenoconversionLine(
      esc(shortWord(gene.phenotype)),
      esc(shortWord(gene.effectivePhenotype)),
      esc(causesLabel)
    )}${tellDoc}`;
    becauseHtml = `<p class="m-gene__because">${lineHtml}</p>`;
    becausePlain = lineHtml.replace(/<[^>]+>/g, '');
  } else if (gene.phenoconversion?.applied) {
    const lineHtml = t.geneMayBeAffected(
      esc(shortWord(gene.phenotype)),
      esc(causesLabel)
    );
    becauseHtml = `<p class="m-gene__because">${lineHtml}</p>`;
    becausePlain = lineHtml.replace(/<[^>]+>/g, '');
  }

  const drugsHtml = shownDrugs.length > 0
    ? `<div class="m-gene__drugs">
        ${shownDrugs.map((d) => {
          const alts = d.alternatives.length > 0
            ? `<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${esc(t.betterMatch)} <strong>${esc(d.alternatives.map((a) => drugLabel(a, lang)).join(' / '))}</strong> — ${esc(t.askYourDoctor)} <span dir="ltr">(${esc(d.guideline?.pub || 'CPIC')})</span></span>
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
      ${scaleHTML(gene, lang, getScaleLabels(gene, lang))}
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
      <div class="m-sec-headrow">
        <div>
          <h2 class="m-sec-title" id="genes-heading">${esc(t.myGenesTitle)}</h2>
          <p class="m-sec-sub">${esc(t.myGenesSub)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="open-pharmacist">
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${esc(t.showPharmacistBtn)}</span>
        </button>
      </div>
      ${(contract.genes || []).map((g, i) => renderGeneCard(g, i, lang, t, state)).join('')}
    </section>
  `;
}

function renderMedsView(contract, lang, t, state = {}) {
  const meds = contract.currentMedications || [];
  const genes = contract.genes || [];
  const localNames = new Set((state.localMeds || []).map((m) => canonicalDrugName(m.name)));
  const quickExamples = lang === 'ar'
    ? [
        { name: 'paroxetine', label: 'باروكسيتين' },
        { name: 'duloxetine', label: 'دولوكسيتين' },
        { name: 'fluvoxamine', label: 'فلوفوكسامين' },
        { name: 'codeine', label: 'كودايين' },
      ]
    : [
        { name: 'paroxetine', label: 'paroxetine' },
        { name: 'duloxetine', label: 'duloxetine' },
        { name: 'fluvoxamine', label: 'fluvoxamine' },
        { name: 'codeine', label: 'codeine' },
      ];
  const suggestionPool = [
    'paroxetine', 'fluoxetine', 'bupropion', 'duloxetine', 'fluvoxamine',
    'fluconazole', 'voriconazole', 'omeprazole', 'codeine', 'tramadol', 'clopidogrel',
  ];

  return `
    <section class="m-stack" aria-labelledby="meds-heading">
      <div class="m-sec-headrow">
        <div>
          <h2 class="m-sec-title" id="meds-heading">${esc(t.myMedsTitle)}</h2>
          <p class="m-sec-sub">${esc(t.myMedsSub)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="open-pharmacist">
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${esc(t.showPharmacistBtn)}</span>
        </button>
      </div>
      <div class="m-medlist" data-testid="med-list">
        ${meds.length === 0
          ? `<div class="m-medlist__empty">${esc(t.noMeds)}</div>`
          : meds.map((m) => {
              const fx = getMedGeneEffects(m.name, genes);
              const shifts = fx.scored.length > 0;
              const flaggedOnly = !shifts && fx.flagged.length > 0;
              const geneNote = medGeneNote(fx, t);
              const srcText = m.source === 'hospital-record' ? t.sourceHospital : t.sourcePatient;
              const canRemove = !state.caregiverMode && localNames.has(canonicalDrugName(m.name));
              return `
                <div class="m-medlist__row" data-testid="med-row">
                  <div class="m-medlist__info">
                    <b>${esc(drugLabel(m.name, lang))}</b>
                    ${m.mock ? `<span class="m-mock">${esc(t.demo)}</span>` : ''}
                    <br>
                    <small>${esc(srcText)}${geneNote ? ` · ${geneNote}` : ''}</small>
                  </div>
                  <div class="m-medlist__actions">
                    <span class="m-status ${shifts || flaggedOnly ? 'm-status--info' : 'm-status--none'}">
                      <svg aria-hidden="true"><use href="#${shifts || flaggedOnly ? 'i-info' : 'i-none'}"/></svg>
                      <span>${esc(shifts ? t.changesGene : flaggedOnly ? t.mayAffectGene : t.noGeneImpact)}</span>
                    </span>
                    ${canRemove ? `
                      <button type="button" class="m-btn m-btn--quiet m-ctrl-btn" data-action="remove-med" data-med="${esc(m.name)}">
                        ${esc(t.medsRemoveBtn)}
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')
        }
        ${state.caregiverMode ? '' : `
          <form class="m-medlist__add" id="med-add-form" data-action="add-med-form">
            <div class="m-medlist__addhead">
              <b>${esc(t.medsAddTitle)}</b>
              <small>${esc(t.medsAddSub)}</small>
            </div>
            ${state.medsFull ? `<p class="m-coverage__line" role="status" data-testid="meds-full">${esc(t.medsListFull)}</p>` : ''}
            <div class="m-field">
              <label for="med-add-input">${esc(t.medsInputLabel)}</label>
              <div class="m-otc-inputrow">
                <input id="med-add-input" class="m-input" type="text" autocomplete="off" list="med-suggestions" placeholder="${esc(t.medsInputPlaceholder)}" value="${esc(state.medDraft || '')}" data-action="med-draft">
                <button type="submit" class="m-btn m-btn--secondary">${esc(t.medsAddBtn)}</button>
              </div>
              <datalist id="med-suggestions">
                ${suggestionPool.map((d) => `<option value="${esc(d)}"></option>`).join('')}
              </datalist>
            </div>
            <div class="m-otc-examples" role="group" aria-label="${esc(t.medsQuickExamples)}">
              <span class="m-otc-examples__label">${esc(t.medsQuickExamples)}</span>
              ${quickExamples.map((ex) => `
                <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="med-pick" data-med="${esc(ex.name)}">${esc(ex.label)}</button>
              `).join('')}
            </div>
          </form>
        `}
      </div>
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
      <div class="m-sec-headrow m-doctor-head m-noprint">
        <div>
          <h2 class="m-sec-title" id="doc-heading">${esc(t.doctorTitle)}</h2>
          <p class="m-sec-sub">${esc(t.doctorSub)}</p>
        </div>
        <button type="button" class="m-btn m-ctrl-btn" data-action="open-pharmacist">
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${esc(t.showPharmacistBtn)}</span>
        </button>
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

export function renderOtcResultHtml(query, contract, lang, options = {}) {
  const t = COPY[lang] || COPY.ar;
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return `<div class="m-empty">${esc(t.otcIdle)}</div>`;
  }

  const res = lookupOtcProduct(trimmed, contract, options);
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

  const inhibitorLines = (res.inhibitorHits || []).map((hit) => {
    const strengthWord = hit.strength === 'strong' ? t.strengthStrong : t.strengthModerate;
    const medNames = (hit.affectedMedications || []).map((m) => drugLabel(m, lang)).join(sep);
    return `<p class="m-answer__body">${t.otcInhibitorHitBody(
      esc(drugLabel(hit.ingredient, lang)),
      esc(strengthWord),
      `<span class="m-data">${esc(hit.enzyme)}</span>`,
      esc(medNames)
    )}</p>`;
  }).join('');

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
      ${inhibitorLines}
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

export function renderPharmacistView(contract, lang, t, state = {}) {
  const genes = contract.genes || [];
  const meds = contract.currentMedications || [];
  const qr = state.qrResult;
  const sep = lang === 'ar' ? '، ' : ', ';

  return `
    <section class="m-pharmacist-sheet" aria-labelledby="pharm-heading" data-testid="pharmacist-view">
      <div class="m-pharmacist-head">
        <div>
          <h1 class="m-pharmacist-title" id="pharm-heading">${esc(t.pharmacistTitle)}</h1>
          <p class="m-pharmacist-sub">${esc(t.pharmacistSub)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary" data-action="close-pharmacist">
          ${esc(t.pharmacistBackBtn)}
        </button>
      </div>

      <div class="m-pharmacist-block">
        <h2 class="m-pharmacist-h2">${esc(t.pharmacistMedsTitle)}</h2>
        ${meds.length === 0
          ? `<div class="m-empty">${esc(t.noMeds)}</div>`
          : `<div class="m-medlist">
              ${meds.map((m) => {
                const fx = getMedGeneEffects(m.name, genes);
                const shifts = fx.scored.length > 0;
                const flaggedOnly = !shifts && fx.flagged.length > 0;
                const geneNote = medGeneNote(fx, t);
                const srcText = m.source === 'hospital-record' ? t.sourceHospital : t.sourcePatient;
                return `
                  <div class="m-medlist__row">
                    <div class="m-medlist__info">
                      <b>${esc(drugLabel(m.name, lang))}</b>
                      ${m.mock ? `<span class="m-mock">${esc(t.demo)}</span>` : ''}
                      <br>
                      <small>${esc(srcText)}${geneNote ? ` · ${geneNote}` : ''}</small>
                    </div>
                    <span class="m-status ${shifts || flaggedOnly ? 'm-status--info' : 'm-status--none'}">
                      <svg aria-hidden="true"><use href="#${shifts || flaggedOnly ? 'i-info' : 'i-none'}"/></svg>
                      <span>${esc(shifts ? t.changesGene : flaggedOnly ? t.mayAffectGene : t.noGeneImpact)}</span>
                    </span>
                  </div>
                `;
              }).join('')}
            </div>`
        }
      </div>

      <div class="m-pharmacist-block">
        <p class="m-pharmacist-legend">${esc(t.pharmacistScaleLegend)}</p>
        ${genes.map((g) => {
          const notAssessed = g.callability?.method === 'not-assessed';
          const tierInfo = getTierInfo(g);
          const drugs = getDrugsForGene(g).filter((d) => d.status !== 'none');
          const geneticShort = PHENOTYPE_SHORT[lang]?.[g.phenotype] || g.phenotype;
          const activePhenotype = g.effectivePhenotype || g.phenotype;
          const actingShort = PHENOTYPE_SHORT[lang]?.[activePhenotype] || activePhenotype;
          const causesLabel = (g.phenoconversion?.cause || []).map((c) => drugLabel(c, lang)).join(sep);

          return `
            <article class="m-pharmacist-gene">
              <div class="m-gene__head">
                <span class="m-pharmacist-gene__name m-data">${esc(g.gene)}${g.diplotype ? ` · ${esc(g.diplotype)}` : ' · VCF'}</span>
                <span class="m-tier" title="${esc(tierInfo.note)}">
                  <span class="m-tier__n">${formatNum(tierInfo.tier, lang)}</span>
                  <span>${esc(t.tierLabel(tierInfo.tier))}</span>
                </span>
              </div>
              ${notAssessed
                ? `
                  <p class="m-pharmacist-pheno">${esc(t.notAssessedTitle)}</p>
                  ${scaleHTML(g, lang, getScaleLabels(g, lang))}
                  <p class="m-pharmacist-note">${esc(t.notAssessedBody)}</p>
                `
                : `
                  <div class="m-pharmacist-phenos">
                    <p class="m-pharmacist-pheno">
                      <strong>${esc(t.pharmacistGenetic)}</strong>
                      <span>${esc(geneticShort)}</span>
                      <span class="m-data m-pharmacist-cpic">(${esc(g.phenotype)})</span>
                    </p>
                    <p class="m-pharmacist-pheno">
                      <strong>${esc(t.pharmacistActing)}</strong>
                      <span>${esc(actingShort)}</span>
                      ${g.phenoconversion?.applied
                        ? `<span>(${esc(causesLabel)})</span>`
                        : `<span class="m-pharmacist-note">(${esc(t.pharmacistNoShift)})</span>`
                      }
                    </p>
                  </div>
                  ${scaleHTML(g, lang, getScaleLabels(g, lang))}
                  ${drugs.length > 0
                    ? `<div class="m-gene__drugs">
                        ${drugs.map((d) => `
                          <div class="m-drugrow">
                            <span class="m-drugrow__name">${esc(drugLabel(d.drug, lang))}</span>
                            <span class="m-status m-status--${d.status}">
                              <svg aria-hidden="true"><use href="#${statusIcon(d.status)}"/></svg>
                              <span>${esc(statusText(d.status, t))}</span>
                            </span>
                          </div>
                          ${d.alternatives.length > 0
                            ? `<div class="m-better">
                                <svg aria-hidden="true"><use href="#i-match"/></svg>
                                <span>${esc(t.betterMatch)} <strong>${esc(d.alternatives.map((a) => drugLabel(a, lang)).join(' / '))}</strong> — ${esc(t.askYourDoctor)} <span dir="ltr">(${esc(d.guideline?.pub || 'CPIC')})</span></span>
                              </div>`
                            : ''
                          }
                        `).join('')}
                      </div>`
                    : ''
                  }
                `
              }
            </article>
          `;
        }).join('')}
      </div>

      <div class="m-pharmacist-qr">
        <div class="m-qr-card__head">
          <h2 class="m-pharmacist-h2">${esc(t.pharmacistQrTitle)}</h2>
          <span class="m-status m-status--info">
            <svg aria-hidden="true"><use href="#i-lock"/></svg>
            <span>${esc(state.devMode && state.qrPlaintext ? t.qrPlainBadge : t.qrEncryptedBadge)}</span>
          </span>
        </div>
        ${qr
          ? `<div class="m-qr-box" data-testid="pharmacist-qr-box">${qr.svg}</div>`
          : `<p class="m-pharmacist-note">${esc(t.pharmacistQrNeedPin)}</p>
             ${state.caregiverMode ? '' : `
               <div class="m-qr-controls">
                 <div class="m-qr-pin-field m-field">
                   <label for="qr-pin-input">${esc(t.qrPinLabel)}</label>
                   <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${esc(state.qrPin || '')}" data-action="qr-pin">
                 </div>
                 <div class="m-qr-pin-field m-field">
                   <label for="qr-pin-confirm">${esc(t.qrPinConfirmLabel)}</label>
                   <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${esc(state.qrPinConfirm || '')}" data-action="qr-pin-confirm">
                 </div>
                 <button type="button" class="m-btn" data-action="issue-card">
                   <svg aria-hidden="true"><use href="#i-lock"/></svg>
                   <span>${esc(t.qrIssueBtn)}</span>
                 </button>
               </div>
               ${state.qrPinError ? `<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${esc(state.qrPinError)}</span></div>` : ''}
             `}`
        }
        <div class="m-pharmacist-qr__foot">
          <a class="m-btn m-btn--secondary" href="/scan.html">${esc(t.openScannerBtn)}</a>
          <p class="m-qr-honesty">${esc(t.qrPinBrute)}</p>
        </div>
      </div>

      <p class="m-doctor-foot">${esc(t.doctorFooter)}</p>
    </section>
  `;
}

export function renderApp(root, state) {
  const t = COPY[state.lang] || COPY.ar;
  const activeContract = state.effectiveContract || state.contract;
  let body = '';
  if (state.error) {
    body = `<div class="m-empty">${esc(state.error)}</div>`;
  } else if (!activeContract) {
    body = `<div class="m-empty">...</div>`;
  } else if (state.pharmacistView) {
    body = renderPharmacistView(activeContract, state.lang, t, state);
  } else if (state.tab === 'meds') {
    body = renderMedsView(activeContract, state.lang, t, state);
  } else if (state.tab === 'otc') {
    body = renderOtcView(activeContract, state.lang, t, state);
  } else if (state.tab === 'doctor') {
    body = renderDoctorView(activeContract, state.lang, t, state);
  } else {
    body = renderGenesView(activeContract, state.lang, t, state);
  }

  root.innerHTML = `
    <div class="m-app">
      ${renderTopbar(state, t)}
      <main id="main-content">${body}</main>
    </div>
    ${state.pharmacistView ? '' : renderTabs(state.tab, t)}
  `;
}
