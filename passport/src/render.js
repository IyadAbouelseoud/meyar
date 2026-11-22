import { scaleHTML, combHTML } from '@design/meyar.js';
import { COPY, PHENOTYPE_PLAIN, PHENOTYPE_SHORT, drugLabel, formatNum } from './i18n.js';
import { getDrugsForGene, getTierInfo, isMedCausingShift } from './lookup.js';

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
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${esc(t.proto)}</span>
        <span class="m-mock">${esc(t.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        <div class="m-seg" role="group" aria-label="${esc(t.patientLabel)}">
          ${patients.map((id) => `
            <button type="button" data-action="patient" data-patient="${id}" aria-pressed="${state.patientId === id}">
              <span class="m-data">${id}</span>
            </button>
          `).join('')}
        </div>
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

function renderGeneCard(gene, index, lang, t) {
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
    return `
      <article class="m-gene" aria-labelledby="${headingId}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${esc(gene.gene)} · VCF</span>
          ${tierBadge}
        </div>
        <p class="m-gene__plain" id="${headingId}">${esc(t.notAssessedTitle)}</p>
        ${scaleHTML(gene, lang)}
        <p class="m-coverage__line">${esc(t.notAssessedBody)}</p>
      </article>
    `;
  }

  const plainSentence = PHENOTYPE_PLAIN[lang]?.[activePhenotype] || activePhenotype || '';
  const drugs = getDrugsForGene(gene);
  const actionable = drugs.filter((d) => d.status === 'stop' || d.status === 'ask');
  const shownDrugs = actionable.length > 0 ? actionable : drugs.slice(0, 3);

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

  const speakText = `${gene.gene}. ${plainSentence}`;

  return `
    <article class="m-gene" aria-labelledby="${headingId}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${esc(gene.gene)}${gene.diplotype ? ` · ${esc(gene.diplotype)}` : ''}</span>
        <div class="m-gene__actions">
          ${tierBadge}
          <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-speak="${esc(speakText)}">
            <svg aria-hidden="true"><use href="#i-speak"/></svg>
            <span>${esc(t.readAloud)}</span>
          </button>
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

function renderGenesView(contract, lang, t) {
  return `
    ${renderCover(t)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${esc(t.myGenesTitle)}</h2>
        <p class="m-sec-sub">${esc(t.myGenesSub)}</p>
      </div>
      ${(contract.genes || []).map((g, i) => renderGeneCard(g, i, lang, t)).join('')}
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
    <section class="m-qr-card" aria-labelledby="qr-heading">
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
        ${qr ? qr.svg : `<p class="m-sec-sub">${esc(t.qrGenerating)}</p>`}
      </div>
      <div class="m-qr-controls">
        <div class="m-qr-pin-field">
          <label for="qr-pin-input">${esc(t.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-qr-pin-input m-data" type="text" inputmode="numeric" maxlength="6" value="${esc(state.qrPin)}" data-action="qr-pin">
        </div>
        <button type="button" class="m-btn" data-action="decode-qr" ${qr ? '' : 'disabled'}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${esc(t.qrVerifyBtn)}</span>
        </button>
        ${state.devMode ? `
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${state.qrPlaintext}">
            ${esc(t.qrPlaintextToggle)}
          </button>
        ` : ''}
      </div>
      ${state.devMode && qr ? `
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${qr.rawBytes} B → deflate ${qr.compressedBytes} B → envelope ${qr.envelopeBytes} B · ${qr.modules}×${qr.modules} · EC ${qr.errorCorrectionLevel}</p>
      ` : ''}
      <p class="m-qr-honesty">${esc(t.qrPinHonesty)}</p>
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

function renderDoctorView(contract, lang, t, state) {
  const genes = contract.genes || [];
  const meds = contract.currentMedications || [];
  return `
    <section class="m-stack" aria-labelledby="doc-heading">
      <div>
        <h2 class="m-sec-title" id="doc-heading">${esc(t.doctorTitle)}</h2>
        <p class="m-sec-sub">${esc(t.doctorSub)}</p>
      </div>
      ${renderQrCard(state, t)}
      <div class="m-doctor-sheet m-chartpaper">
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

function renderTabs(activeTab, t) {
  const tabs = [
    { id: 'genes', icon: 'i-genes', label: t.tabGenes },
    { id: 'meds', icon: 'i-pill', label: t.tabMeds },
    { id: 'doctor', icon: 'i-qr', label: t.tabDoctor },
  ];
  return `
    <nav class="m-tabs m-tabs--fixed" aria-label="Passport navigation">
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
  } else if (state.tab === 'doctor') {
    body = renderDoctorView(state.contract, state.lang, t, state);
  } else {
    body = renderGenesView(state.contract, state.lang, t);
  }

  root.innerHTML = `
    <div class="m-app">
      ${renderTopbar(state, t)}
      <main id="main-content">${body}</main>
    </div>
    ${renderTabs(state.tab, t)}
  `;
}
