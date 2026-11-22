import{c as re,s as W,d as $,f as ie,a as H,g as oe,P as ce,b as k,e as le,C as S,n as de,i as pe,h as ue,j as me,k as ge,l as Y,m as ve,r as fe,o as he}from"./index-BxkjblCB.js";const be=re.rows||[],$e=W.rows||[];function z(e){var c,i;const a=(c=e.coverage)==null?void 0:c.saudiDataTier,n=$e.find(m=>m.gene===e.gene),r=a??(n?n.saudiDataTier:2),o=((i=e.coverage)==null?void 0:i.saudiDataNote)||(n==null?void 0:n.saudiDataNote)||(r===2?"Tier 2: no published Saudi frequency (Goljan et al. 2022)":"");return{tier:r,note:o,coverageStatement:W._coverageStatement}}function ye(e){const a=(e.recommendation||"").toLowerCase();return Array.isArray(e.alternatives)&&e.alternatives.length>0||/\b(avoid|contraindicated|alternative|do not use)\b/.test(a)?"stop":/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(a)?"ask":"none"}function C(e){var c,i,m;if(((c=e.callability)==null?void 0:c.method)==="not-assessed")return[];const a=e.effectivePhenotype||e.phenotype;if(!a||/indeterminate|not assessed/i.test(a))return[];const n=(i=e.phenoconversion)!=null&&i.applied&&((m=e.phenoconversion)==null?void 0:m.adjustedActivityScore)!=null?String(e.phenoconversion.adjustedActivityScore.toFixed(1)):null,r=be.filter(l=>l.gene===e.gene&&l.phenotype===a),o=new Map;for(const l of r){const p=o.get(l.drug);p?(n&&l.activityScore===n||p.population&&/pediatric/i.test(p.population)&&!/pediatric/i.test(l.population||"")||l.population==="general"&&p.population!=="general"||l.population==="CVI ACS PCI"&&p.population!=="general")&&o.set(l.drug,l):o.set(l.drug,l)}return Array.from(o.values()).map(l=>({drug:l.drug,rxnorm:l.rxnorm,status:ye(l),implication:l.implication,recommendation:l.recommendation,classification:l.classification,alternatives:Array.isArray(l.alternatives)?l.alternatives.map(p=>typeof p=="string"?p:p==null?void 0:p.drug).filter(Boolean):[],guideline:l.guideline||null}))}function qe(e,a){const n=String(e||"").toLowerCase();return a.some(r=>{var o;return((o=r.phenoconversion)==null?void 0:o.applied)&&Array.isArray(r.phenoconversion.cause)&&r.phenoconversion.cause.some(c=>c.toLowerCase()===n)})}function J(e,a="ar"){if(!Array.isArray(e)||e.length===0)return null;const n=r=>String((r==null?void 0:r.lang)||"").toLowerCase().replace("_","-");return a==="ar"?e.find(r=>n(r)==="ar-sa"||n(r).startsWith("ar-sa-"))||null:e.find(r=>n(r)==="en-us"||n(r)==="en-gb")||e.find(r=>n(r).startsWith("en-"))||e.find(r=>n(r)==="en")||null}function T(e="ar",a=typeof window<"u"?window.speechSynthesis:null){return!a||typeof a.getVoices!="function"?!1:J(a.getVoices(),e)!==null}function U({gene:e,plainSentence:a,phenoconversionLine:n,drugs:r=[],lang:o="ar"}){const c=[];e!=null&&e.gene&&c.push(e.gene),a&&c.push(a),n&&c.push(n);for(const i of r)i.label&&i.statusLabel&&c.push(o==="ar"?`${i.label}: ${i.statusLabel}`:`${i.label}: ${i.statusLabel}`);return c.join(". ")}function s(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function K(e){return e==="stop"?"i-stop":e==="ask"?"i-ask":"i-none"}function x(e,a){return e==="stop"?a.statusStop:e==="ask"?a.statusAsk:a.statusNone}function we(e,a){const n=["demo-001","demo-002","demo-006"];return`
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${s(a.proto)}</span>
        <span class="m-mock">${s(a.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        ${e.caregiverMode?"":`
          <div class="m-seg" role="group" aria-label="${s(a.patientLabel)}">
            ${n.map(r=>`
              <button type="button" data-action="patient" data-patient="${r}" aria-pressed="${e.patientId===r}">
                <span class="m-data">${r}</span>
              </button>
            `).join("")}
          </div>
        `}
        <label class="m-switch">
          <input type="checkbox" data-action="elder" ${e.elder?"checked":""} aria-label="${s(a.elderOff)}">
          <span>${s(a.elderOff)}</span>
        </label>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${s(a.langToggle)}
        </button>
      </div>
    </header>
    ${e.caregiverMode?`
      <div class="m-caregiver-bar" role="status" data-testid="caregiver-banner">
        <div class="m-caregiver-bar__info">
          <span class="m-status m-status--info">
            <svg aria-hidden="true"><use href="#i-info"/></svg>
            <span>${s(a.caregiverBadge)}</span>
          </span>
          <p class="m-sec-sub">${s(a.caregiverNote)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="caregiver-toggle">
          ${s(a.caregiverExitBtn)}
        </button>
      </div>
    `:""}
  `}function Pe(e){return`
    <section class="m-cover" aria-labelledby="cover-title">
      <div>
        <span class="m-eyebrow m-cover__kicker">${s(e.brand)} · <span class="m-data">${s(e.brandEn)}</span></span>
        <h1 class="m-cover__title" id="cover-title">${s(e.passportTitle)}</h1>
        <p class="m-cover__sub">${s(e.coverSub)}</p>
      </div>
      <button type="button" class="m-btn m-cover__cta" data-action="tab" data-tab="doctor">
        <svg aria-hidden="true"><use href="#i-qr"/></svg>
        <span>${s(e.showDoctorBtn)}</span>
      </button>
      <div class="m-qatt m-qatt--thin" aria-hidden="true"></div>
    </section>
  `}function O(e,a,n,r){const o=n.speakingIndex===a;return n.speechAvailable?`
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${a}" data-speak="${s(e)}" aria-pressed="${o}">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${s(o?r.stopReading:r.readAloud)}</span>
      </button>
    `:`
    <span class="m-speak-tooltip" title="${s(r.readAloudUnavailable)}" data-tooltip="${s(r.readAloudUnavailable)}" tabindex="0" role="note" aria-label="${s(r.readAloudUnavailable)}">
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${a}" hidden aria-hidden="true" tabindex="-1">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${s(r.readAloud)}</span>
      </button>
      <svg aria-hidden="true"><use href="#i-info"/></svg>
      <span>${s(r.readAloudUnavailableShort)}</span>
    </span>
  `}function _e(e,a,n,r,o){var I,L,M,D,B,R,N,j,V;const c=((I=e.callability)==null?void 0:I.method)==="not-assessed",i=z(e),m=e.effectivePhenotype||e.phenotype,l=`gene-h-${a}`,p=`
    <span class="m-tier" title="${s(i.note)}">
      <span class="m-tier__n">${ie(i.tier,n)}</span>
      <span>${s(r.tierLabel(i.tier))}</span>
    </span>
  `;if(c){const d=U({gene:e,plainSentence:`${r.notAssessedTitle}. ${r.notAssessedBody}`,lang:n});return`
      <article class="m-gene" aria-labelledby="${l}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${s(e.gene)} · VCF</span>
          <div class="m-gene__actions">
            ${p}
            ${O(d,a,o,r)}
          </div>
        </div>
        <p class="m-gene__plain" id="${l}">${s(r.notAssessedTitle)}</p>
        ${H(e,n,oe(e,n))}
        <p class="m-coverage__line">${s(r.notAssessedBody)}</p>
      </article>
    `}const h=((L=ce[n])==null?void 0:L[m])||m||"",w=C(e),q=w.filter(d=>d.status==="stop"||d.status==="ask"),b=q.length>0?q:w.slice(0,3),P=(M=e.phenoconversion)!=null&&M.applied?r.phenoconversionLine(((D=k[n])==null?void 0:D[e.phenotype])||e.phenotype,((B=k[n])==null?void 0:B[e.effectivePhenotype])||e.effectivePhenotype,(e.phenoconversion.cause||[]).map(d=>$(d,n)).join(", ")).replace(/<[^>]+>/g,""):"",_=(R=e.phenoconversion)!=null&&R.applied?`<p class="m-gene__because">${r.phenoconversionLine(s(((N=k[n])==null?void 0:N[e.phenotype])||e.phenotype),s(((j=k[n])==null?void 0:j[e.effectivePhenotype])||e.effectivePhenotype),s((e.phenoconversion.cause||[]).map(d=>$(d,n)).join(", ")))}</p>`:"",g=b.length>0?`<div class="m-gene__drugs">
        ${b.map(d=>{var G;const se=d.alternatives.length>0?`<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${s(r.betterMatch)} <strong>${s(d.alternatives.map(te=>$(te,n)).join(" / "))}</strong> — ${s(r.askYourDoctor)} (${s(((G=d.guideline)==null?void 0:G.pub)||"CPIC")})</span>
              </div>`:"";return`
            <div class="m-drugrow">
              <span class="m-drugrow__name">${s($(d.drug,n))}</span>
              <span class="m-status m-status--${d.status}">
                <svg aria-hidden="true"><use href="#${K(d.status)}"/></svg>
                <span>${s(x(d.status,r))}</span>
              </span>
            </div>
            ${se}
          `}).join("")}
      </div>`:"",f=e.coverage||{},ae=f.definingPositionsTotal>0?`<div class="m-coverage">
        ${le(f)}
        <p class="m-coverage__line">${r.coverageLine(f.definingPositionsAssayed,f.definingPositionsTotal,f.untestedLocalAlleles)}</p>
      </div>`:((V=e.callability)==null?void 0:V.method)==="outside-call"?`<p class="m-coverage__line">${s(r.outsideCallNote)}</p>`:"",ne=U({gene:e,plainSentence:h,phenoconversionLine:P,drugs:b.map(d=>({label:$(d.drug,n),statusLabel:x(d.status,r)})),lang:n});return`
    <article class="m-gene" aria-labelledby="${l}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${s(e.gene)}${e.diplotype?` · ${s(e.diplotype)}`:""}</span>
        <div class="m-gene__actions">
          ${p}
          ${O(ne,a,o,r)}
        </div>
      </div>
      <p class="m-gene__plain" id="${l}">${s(h)}</p>
      ${H(e,n)}
      ${_}
      ${g}
      ${ae}
    </article>
  `}function ke(e,a,n,r){return`
    ${Pe(n)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${s(n.myGenesTitle)}</h2>
        <p class="m-sec-sub">${s(n.myGenesSub)}</p>
      </div>
      ${(e.genes||[]).map((o,c)=>_e(o,c,a,n,r)).join("")}
    </section>
  `}function Se(e,a,n){const r=e.currentMedications||[],o=e.genes||[];return`
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${s(n.myMedsTitle)}</h2>
        <p class="m-sec-sub">${s(n.myMedsSub)}</p>
      </div>
      ${r.length===0?`<div class="m-empty">${s(n.noMeds)}</div>`:`<div class="m-medlist">
            ${r.map(c=>{const i=qe(c.name,o),m=c.source==="hospital-record"?n.sourceHospital:n.sourcePatient;return`
                <div>
                  <div>
                    <b>${s($(c.name,a))}</b>
                    ${c.mock?`<span class="m-mock">${s(n.demo)}</span>`:""}
                    <br>
                    <small>${s(m)}</small>
                  </div>
                  <span class="m-status ${i?"m-status--info":"m-status--none"}">
                    <svg aria-hidden="true"><use href="#${i?"i-info":"i-none"}"/></svg>
                    <span>${s(i?n.changesGene:n.noGeneImpact)}</span>
                  </span>
                </div>
              `}).join("")}
          </div>`}
    </section>
  `}function xe(e,a){const n=e.qrResult,r=!!(e.devMode&&e.qrPlaintext);return`
    <section class="m-qr-card" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${s(a.qrTitle)}</h3>
          <p class="m-sec-sub">${s(a.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${s(r?a.qrPlainBadge:a.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${n?n.svg:`<p class="m-sec-sub">${s(a.qrPinPrompt)}</p>`}
      </div>
      ${e.caregiverMode?'<div class="m-qr-controls">':`
      <div class="m-qr-controls">
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-input">${s(a.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${s(e.qrPin)}" data-action="qr-pin">
        </div>
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-confirm">${s(a.qrPinConfirmLabel)}</label>
          <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${s(e.qrPinConfirm)}" data-action="qr-pin-confirm">
        </div>
      </div>
      <div class="m-qr-emergency">
        <label class="m-switch"><input type="checkbox" role="switch" data-action="qr-emergency-toggle" ${e.qrEmergencyOn?"checked":""}><span>${s(a.qrEmergencyToggle)}</span></label>
        ${e.qrEmergencyOn?`
          <div class="m-field">
            <label for="qr-emergency-input">${s(a.qrEmergencyLabel)}</label>
            <input id="qr-emergency-input" class="m-input" type="text" maxlength="120" value="${s(e.qrEmergency)}" data-action="qr-emergency">
            <p class="m-qr-honesty">${s(a.qrEmergencyHint)}</p>
          </div>`:""}
      </div>
      ${e.qrPinError?`<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${s(e.qrPinError)}</span></div>`:""}
      <div class="m-qr-controls">
        <button type="button" class="m-btn" data-action="issue-card">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${s(e.qrIssued>0?a.qrReissueBtn:a.qrIssueBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--secondary" data-action="decode-qr" ${n?"":"disabled"}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${s(a.qrVerifyBtn)}</span>
        </button>`}
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${s(a.openScannerBtn)}</span>
        </a>
        ${e.caregiverMode?"":`
          <button type="button" class="m-btn m-btn--secondary" data-action="caregiver-toggle">
            ${s(a.caregiverOpenBtn)}
          </button>
          <button type="button" class="m-btn m-btn--quiet" data-action="caregiver-copy">
            ${s(e.caregiverCopied?a.caregiverCopied:a.caregiverCopyBtn)}
          </button>
        `}
        ${!e.caregiverMode&&e.devMode?`
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${e.qrPlaintext}">
            ${s(a.qrPlaintextToggle)}
          </button>
        `:""}
      </div>
      ${e.devMode&&n?`
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${n.rawBytes} B → deflate ${n.compressedBytes} B → envelope ${n.envelopeBytes} B · ${n.modules}×${n.modules} · EC ${n.errorCorrectionLevel}</p>
      `:""}
      <p class="m-qr-honesty" data-testid="qr-brute-honesty">${s(a.qrPinBrute)}</p>
      ${e.qrIssued>0?`<p class="m-qr-honesty">${s(a.qrReissueNote)}</p>`:""}
      ${e.qrDecodeError?`<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${s(a.qrDecodedFail)}</span></div>`:""}
      ${e.qrDecoded?`
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${s(a.qrDecodedOk)}</strong>
          <pre class="m-data">${s(JSON.stringify(e.qrDecoded,null,2))}</pre>
        </div>
      `:""}
    </section>
  `}function Ee(e,a,n,r){const o=e.genes||[],c=e.currentMedications||[];return`
    <section class="m-stack" aria-labelledby="doc-heading">
      <div>
        <h2 class="m-sec-title" id="doc-heading">${s(n.doctorTitle)}</h2>
        <p class="m-sec-sub">${s(n.doctorSub)}</p>
      </div>
      ${xe(r,n)}
      <div class="m-doctor-sheet m-chartpaper">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${s(n.doctorPatientId)}</small>
            <span class="m-data">${s(e.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${s(n.doctorOrigin)}</small>
            <span>${s(n.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${s(n.myMedsTitle)}</small>
            <span>${c.length?c.map(i=>s(i.name)).join(", "):"—"}</span>
          </div>
        </div>
        ${o.map(i=>{var q,b,P,_;const m=((q=i.callability)==null?void 0:q.method)==="not-assessed",l=z(i),p=C(i).filter(g=>g.status!=="none"),h=i.coverage||{},w=m?((b=i.callability)==null?void 0:b.reason)||n.notAssessedBody:h.definingPositionsTotal>0?`${h.definingPositionsAssayed}/${h.definingPositionsTotal} positions; untested: ${(h.untestedLocalAlleles||[]).join(", ")||"none"}`:((P=i.callability)==null?void 0:P.source)||"Outside call";return`
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${s(i.gene)}${i.diplotype?` · ${s(i.diplotype)}`:" · Not assessed"}</strong>
                <span class="m-tier"><span class="m-tier__n">T${l.tier}</span> ${s(i.guidelineVersion||"")}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${s(n.doctorColGenetic)}:</strong> ${s(i.phenotype||"Not assessed")}</div>
                <div><strong>${s(n.doctorColEffective)}:</strong> ${s(i.effectivePhenotype||i.phenotype||"Not assessed")}${(_=i.phenoconversion)!=null&&_.applied?` (${s((i.phenoconversion.cause||[]).join(", "))}; ${s(i.phenoconversion.method||"")})`:""}</div>
                <div><strong>${s(n.doctorColCoverage)}:</strong> ${s(w)}</div>
              </div>
              ${p.length>0?`<div class="m-gene__drugs">
                    ${p.map(g=>{var f;return`
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${s(g.drug)}</span>
                        <span class="m-status m-status--${g.status}">
                          <svg aria-hidden="true"><use href="#${K(g.status)}"/></svg>
                          <span>${s(x(g.status,n))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${s(g.recommendation)}${g.alternatives.length?` <strong>${s(n.betterMatch)} ${s(g.alternatives.join(", "))}</strong>`:""} <span class="m-data">(${s(((f=g.guideline)==null?void 0:f.pub)||"CPIC")})</span></p>
                    `}).join("")}
                  </div>`:`<p class="m-coverage__line">${s(m?n.notAssessedBody:n.doctorNoDrugs)}</p>`}
            </div>
          `}).join("")}
        <p class="m-doctor-foot">${s(n.doctorFooter)}</p>
      </div>
    </section>
  `}function Ce(e,a){return`
    <nav class="m-tabs m-tabs--fixed" aria-label="Passport navigation">
      ${[{id:"genes",icon:"i-genes",label:a.tabGenes},{id:"meds",icon:"i-pill",label:a.tabMeds},{id:"doctor",icon:"i-qr",label:a.tabDoctor}].map(r=>`
        <button type="button" data-action="tab" data-tab="${r.id}" aria-current="${e===r.id?"page":"false"}">
          <svg aria-hidden="true"><use href="#${r.icon}"/></svg>
          <span>${s(r.label)}</span>
        </button>
      `).join("")}
    </nav>
  `}function Te(e,a){const n=S[a.lang]||S.ar;let r="";a.error?r=`<div class="m-empty">${s(a.error)}</div>`:a.contract?a.tab==="meds"?r=Se(a.contract,a.lang,n):a.tab==="doctor"?r=Ee(a.contract,a.lang,n,a):r=ke(a.contract,a.lang,n,a):r='<div class="m-empty">...</div>',e.innerHTML=`
    <div class="m-app">
      ${we(a,n)}
      <main id="main-content">${r}</main>
    </div>
    ${Ce(a.tab,n)}
  `}const y=document.getElementById("app"),v=new URLSearchParams(window.location.search);function X(e){try{return window.localStorage.getItem(e)}catch{return null}}function Z(e,a){try{window.localStorage.setItem(e,a)}catch{}}const F=v.get("lang")==="en"?"en":v.get("lang")==="ar"?"ar":X("meyar:lang")==="en"?"en":"ar",Ae=v.has("elder")?v.get("elder")==="on":X("meyar:elder")==="on",t={lang:F,elder:Ae,caregiverMode:v.get("mode")==="caregiver",caregiverCopied:!1,tab:["genes","meds","doctor"].includes(v.get("tab"))?v.get("tab"):"genes",patientId:v.get("patient")||"demo-001",devMode:v.get("dev")==="1",speechAvailable:T(F),speakingIndex:null,qrPin:"",qrPinConfirm:"",qrPinError:"",qrEmergencyOn:!1,qrEmergency:"",qrIssued:0,qrPlaintext:!1,qrResult:null,qrDecoded:null,qrDecodeError:!1,contract:null,error:null};function E(){try{const e=new URL(window.location.href);t.caregiverMode?e.searchParams.set("mode","caregiver"):e.searchParams.delete("mode"),e.searchParams.set("patient",t.patientId),e.searchParams.set("lang",t.lang),e.searchParams.set("elder",t.elder?"on":"off"),window.history.replaceState(null,"",e.toString())}catch{}}function Ie(){const e=new URL(window.location.href);return e.searchParams.set("patient",t.patientId),e.searchParams.set("mode","caregiver"),e.searchParams.set("lang",t.lang),e.searchParams.set("elder",t.elder?"on":"off"),e.toString()}let Q=0;async function A(){if(!t.contract){t.qrResult=null;return}const e=t.devMode&&t.qrPlaintext;if(!e&&!Y(t.qrPin)){t.qrResult=null;return}const a=++Q,n=await ve(t.contract,{pin:t.qrPin,plaintext:e,getDrugsFn:C,emergency:t.qrEmergencyOn?t.qrEmergency:""});if(a!==Q)return;const r=fe(n.qrText,{ariaLabel:"Meyar Medication Passport encrypted QR"});t.qrResult={...n,...r},t.qrIssued+=1,u()}async function ee(e){t.patientId=e,t.error=null,t.qrResult=null,t.qrDecoded=null,t.qrDecodeError=!1;try{const a=await fetch(`/demo/${encodeURIComponent(e)}.contract.json`);if(!a.ok)throw new Error(`HTTP ${a.status}`);t.contract=await a.json()}catch{t.contract=null,t.error=t.lang==="ar"?`تعذّر تحميل الملف التجريبي (${e}).`:`Could not load demo profile (${e}).`}u(),A()}function u(){t.speechAvailable=T(t.lang),ue(t.lang),me(t.elder),Te(y,t),ge(y)}y.addEventListener("change",e=>{const a=e.target.closest('input[data-action="elder"]');a&&(t.elder=!!a.checked,Z("meyar:elder",t.elder?"on":"off"),E(),u())});y.addEventListener("input",e=>{if(t.caregiverMode)return;const a=e.target;if(a.dataset.action==="qr-pin"||a.dataset.action==="qr-pin-confirm"){const n=de(a.value).replace(/[^0-9]/g,"").slice(0,6);n!==a.value&&(a.value=n),a.dataset.action==="qr-pin"?t.qrPin=n:t.qrPinConfirm=n}else a.dataset.action==="qr-emergency"&&(t.qrEmergency=a.value)});y.addEventListener("change",e=>{e.target.dataset.action==="qr-emergency-toggle"&&(t.qrEmergencyOn=e.target.checked,u())});async function Le(){const e=S[t.lang]||S.ar;t.qrDecoded=null,t.qrDecodeError=!1,Y(t.qrPin)?t.qrPin!==t.qrPinConfirm?t.qrPinError=e.qrPinErrMatch:(t.qrPinError="",await A()):t.qrPinError=e.qrPinErrSix,u()}y.addEventListener("click",async e=>{var r;const a=e.target.closest("[data-action]");if(!a)return;const n=a.dataset.action;if(n==="lang")t.lang=t.lang==="ar"?"en":"ar",Z("meyar:lang",t.lang),"speechSynthesis"in window&&window.speechSynthesis.cancel(),t.speakingIndex=null,E(),u();else if(n==="tab")t.tab=a.dataset.tab,t.caregiverCopied=!1,u(),window.scrollTo({top:0});else if(n==="patient"&&!t.caregiverMode)ee(a.dataset.patient);else if(n==="caregiver-toggle")t.caregiverMode=!t.caregiverMode,t.caregiverCopied=!1,E(),u();else if(n==="caregiver-copy"){const o=Ie();try{(r=navigator.clipboard)!=null&&r.writeText&&await navigator.clipboard.writeText(o),t.caregiverCopied=!0}catch{t.caregiverCopied=!1}u()}else if(n==="toggle-plaintext"&&!t.caregiverMode)t.qrPlaintext=!t.qrPlaintext,t.qrDecoded=null,t.qrDecodeError=!1,A();else if(n==="decode-qr"&&t.qrResult){t.qrDecodeError=!1;try{t.qrDecoded=await he(t.qrResult.qrText,{pin:t.qrPin,allowPlaintext:t.devMode})}catch{t.qrDecoded=null,t.qrDecodeError=!0}u()}else if(n==="issue-card")Le();else if(n==="speak"&&"speechSynthesis"in window){const o=Number(a.dataset.geneIndex);if(t.speakingIndex===o){window.speechSynthesis.cancel(),t.speakingIndex=null,u();return}window.speechSynthesis.cancel();const c=J(window.speechSynthesis.getVoices(),t.lang);if(!c){t.speechAvailable=!1,t.speakingIndex=null,u();return}const i=new SpeechSynthesisUtterance(a.dataset.speak||"");i.voice=c,i.lang=c.lang,t.speakingIndex=o,i.onend=()=>{t.speakingIndex===o&&(t.speakingIndex=null,u())},i.onerror=()=>{t.speakingIndex===o&&(t.speakingIndex=null,u())},window.speechSynthesis.speak(i),u()}});"speechSynthesis"in window&&typeof window.speechSynthesis.addEventListener=="function"&&window.speechSynthesis.addEventListener("voiceschanged",()=>{const e=T(t.lang);e!==t.speechAvailable&&(t.speechAvailable=e,u())});pe();"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});ee(t.patientId);
