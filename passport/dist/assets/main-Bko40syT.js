import{c as U,s as N,d as w,f as Y,a as L,P as W,b as M,e as z,C as B,n as J,i as K,g as X,h as Z,j as ee,k as j,l as se,r as ne,m as ae}from"./i18n-jVz95QYq.js";const te=U.rows||[],re=N.rows||[];function H(e){var c,i;const s=(c=e.coverage)==null?void 0:c.saudiDataTier,a=re.find(p=>p.gene===e.gene),r=s??(a?a.saudiDataTier:2),l=((i=e.coverage)==null?void 0:i.saudiDataNote)||(a==null?void 0:a.saudiDataNote)||(r===2?"Tier 2: no published Saudi frequency (Goljan et al. 2022)":"");return{tier:r,note:l,coverageStatement:N._coverageStatement}}function ie(e){const s=(e.recommendation||"").toLowerCase();return Array.isArray(e.alternatives)&&e.alternatives.length>0||/\b(avoid|contraindicated|alternative|do not use)\b/.test(s)?"stop":/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(s)?"ask":"none"}function E(e){var c,i,p;if(((c=e.callability)==null?void 0:c.method)==="not-assessed")return[];const s=e.effectivePhenotype||e.phenotype;if(!s||/indeterminate|not assessed/i.test(s))return[];const a=(i=e.phenoconversion)!=null&&i.applied&&((p=e.phenoconversion)==null?void 0:p.adjustedActivityScore)!=null?String(e.phenoconversion.adjustedActivityScore.toFixed(1)):null,r=te.filter(o=>o.gene===e.gene&&o.phenotype===s),l=new Map;for(const o of r){const d=l.get(o.drug);d?(a&&o.activityScore===a||d.population&&/pediatric/i.test(d.population)&&!/pediatric/i.test(o.population||"")||o.population==="general"&&d.population!=="general"||o.population==="CVI ACS PCI"&&d.population!=="general")&&l.set(o.drug,o):l.set(o.drug,o)}return Array.from(l.values()).map(o=>({drug:o.drug,rxnorm:o.rxnorm,status:ie(o),implication:o.implication,recommendation:o.recommendation,classification:o.classification,alternatives:Array.isArray(o.alternatives)?o.alternatives.map(d=>typeof d=="string"?d:d==null?void 0:d.drug).filter(Boolean):[],guideline:o.guideline||null}))}function oe(e,s){const a=String(e||"").toLowerCase();return s.some(r=>{var l;return((l=r.phenoconversion)==null?void 0:l.applied)&&Array.isArray(r.phenoconversion.cause)&&r.phenoconversion.cause.some(c=>c.toLowerCase()===a)})}function n(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function G(e){return e==="stop"?"i-stop":e==="ask"?"i-ask":"i-none"}function O(e,s){return e==="stop"?s.statusStop:e==="ask"?s.statusAsk:s.statusNone}function ce(e,s){const a=["demo-001","demo-002","demo-006"];return`
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${n(s.proto)}</span>
        <span class="m-mock">${n(s.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        <div class="m-seg" role="group" aria-label="${n(s.patientLabel)}">
          ${a.map(r=>`
            <button type="button" data-action="patient" data-patient="${r}" aria-pressed="${e.patientId===r}">
              <span class="m-data">${r}</span>
            </button>
          `).join("")}
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="elder" aria-pressed="${e.elder}">
          ${n(e.elder?s.elderOn:s.elderOff)}
        </button>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${n(s.langToggle)}
        </button>
      </div>
    </header>
  `}function le(e){return`
    <section class="m-cover" aria-labelledby="cover-title">
      <div>
        <span class="m-eyebrow m-cover__kicker">${n(e.brand)} · <span class="m-data">${n(e.brandEn)}</span></span>
        <h1 class="m-cover__title" id="cover-title">${n(e.passportTitle)}</h1>
        <p class="m-cover__sub">${n(e.coverSub)}</p>
      </div>
      <button type="button" class="m-btn m-cover__cta" data-action="tab" data-tab="doctor">
        <svg aria-hidden="true"><use href="#i-qr"/></svg>
        <span>${n(e.showDoctorBtn)}</span>
      </button>
      <div class="m-qatt m-qatt--thin" aria-hidden="true"></div>
    </section>
  `}function de(e,s,a,r){var k,S,C,D,x,A;const l=((k=e.callability)==null?void 0:k.method)==="not-assessed",c=H(e),i=e.effectivePhenotype||e.phenotype,p=`gene-h-${s}`,o=`
    <span class="m-tier" title="${n(c.note)}">
      <span class="m-tier__n">${Y(c.tier,a)}</span>
      <span>${n(r.tierLabel(c.tier))}</span>
    </span>
  `;if(l)return`
      <article class="m-gene" aria-labelledby="${p}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${n(e.gene)} · VCF</span>
          ${o}
        </div>
        <p class="m-gene__plain" id="${p}">${n(r.notAssessedTitle)}</p>
        ${L(e,a)}
        <p class="m-coverage__line">${n(r.notAssessedBody)}</p>
      </article>
    `;const d=((S=W[a])==null?void 0:S[i])||i||"",$=E(e),q=$.filter(m=>m.status==="stop"||m.status==="ask"),h=q.length>0?q:$.slice(0,3),y=(C=e.phenoconversion)!=null&&C.applied?`<p class="m-gene__because">${r.phenoconversionLine(n(((D=M[a])==null?void 0:D[e.phenotype])||e.phenotype),n(((x=M[a])==null?void 0:x[e.effectivePhenotype])||e.effectivePhenotype),n((e.phenoconversion.cause||[]).map(m=>w(m,a)).join(", ")))}</p>`:"",_=h.length>0?`<div class="m-gene__drugs">
        ${h.map(m=>{var I;const F=m.alternatives.length>0?`<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${n(r.betterMatch)} <strong>${n(m.alternatives.map(Q=>w(Q,a)).join(" / "))}</strong> — ${n(r.askYourDoctor)} (${n(((I=m.guideline)==null?void 0:I.pub)||"CPIC")})</span>
              </div>`:"";return`
            <div class="m-drugrow">
              <span class="m-drugrow__name">${n(w(m.drug,a))}</span>
              <span class="m-status m-status--${m.status}">
                <svg aria-hidden="true"><use href="#${G(m.status)}"/></svg>
                <span>${n(O(m.status,r))}</span>
              </span>
            </div>
            ${F}
          `}).join("")}
      </div>`:"",v=e.coverage||{},u=v.definingPositionsTotal>0?`<div class="m-coverage">
        ${z(v)}
        <p class="m-coverage__line">${r.coverageLine(v.definingPositionsAssayed,v.definingPositionsTotal,v.untestedLocalAlleles)}</p>
      </div>`:((A=e.callability)==null?void 0:A.method)==="outside-call"?`<p class="m-coverage__line">${n(r.outsideCallNote)}</p>`:"",P=`${e.gene}. ${d}`;return`
    <article class="m-gene" aria-labelledby="${p}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${n(e.gene)}${e.diplotype?` · ${n(e.diplotype)}`:""}</span>
        <div class="m-gene__actions">
          ${o}
          <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-speak="${n(P)}">
            <svg aria-hidden="true"><use href="#i-speak"/></svg>
            <span>${n(r.readAloud)}</span>
          </button>
        </div>
      </div>
      <p class="m-gene__plain" id="${p}">${n(d)}</p>
      ${L(e,a)}
      ${y}
      ${_}
      ${u}
    </article>
  `}function pe(e,s,a){return`
    ${le(a)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${n(a.myGenesTitle)}</h2>
        <p class="m-sec-sub">${n(a.myGenesSub)}</p>
      </div>
      ${(e.genes||[]).map((r,l)=>de(r,l,s,a)).join("")}
    </section>
  `}function ue(e,s,a){const r=e.currentMedications||[],l=e.genes||[];return`
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${n(a.myMedsTitle)}</h2>
        <p class="m-sec-sub">${n(a.myMedsSub)}</p>
      </div>
      ${r.length===0?`<div class="m-empty">${n(a.noMeds)}</div>`:`<div class="m-medlist">
            ${r.map(c=>{const i=oe(c.name,l),p=c.source==="hospital-record"?a.sourceHospital:a.sourcePatient;return`
                <div>
                  <div>
                    <b>${n(w(c.name,s))}</b>
                    ${c.mock?`<span class="m-mock">${n(a.demo)}</span>`:""}
                    <br>
                    <small>${n(p)}</small>
                  </div>
                  <span class="m-status ${i?"m-status--info":"m-status--none"}">
                    <svg aria-hidden="true"><use href="#${i?"i-info":"i-none"}"/></svg>
                    <span>${n(i?a.changesGene:a.noGeneImpact)}</span>
                  </span>
                </div>
              `}).join("")}
          </div>`}
    </section>
  `}function me(e,s){const a=e.qrResult,r=!!(e.devMode&&e.qrPlaintext);return`
    <section class="m-qr-card" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${n(s.qrTitle)}</h3>
          <p class="m-sec-sub">${n(s.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${n(r?s.qrPlainBadge:s.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${a?a.svg:`<p class="m-sec-sub">${n(s.qrPinPrompt)}</p>`}
      </div>
      <div class="m-qr-controls">
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-input">${n(s.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${n(e.qrPin)}" data-action="qr-pin">
        </div>
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-confirm">${n(s.qrPinConfirmLabel)}</label>
          <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${n(e.qrPinConfirm)}" data-action="qr-pin-confirm">
        </div>
      </div>
      <div class="m-qr-emergency">
        <label class="m-switch"><input type="checkbox" role="switch" data-action="qr-emergency-toggle" ${e.qrEmergencyOn?"checked":""}><span>${n(s.qrEmergencyToggle)}</span></label>
        ${e.qrEmergencyOn?`
          <div class="m-field">
            <label for="qr-emergency-input">${n(s.qrEmergencyLabel)}</label>
            <input id="qr-emergency-input" class="m-input" type="text" maxlength="120" value="${n(e.qrEmergency)}" data-action="qr-emergency">
            <p class="m-qr-honesty">${n(s.qrEmergencyHint)}</p>
          </div>`:""}
      </div>
      ${e.qrPinError?`<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${n(e.qrPinError)}</span></div>`:""}
      <div class="m-qr-controls">
        <button type="button" class="m-btn" data-action="issue-card">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${n(e.qrIssued>0?s.qrReissueBtn:s.qrIssueBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--secondary" data-action="decode-qr" ${a?"":"disabled"}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${n(s.qrVerifyBtn)}</span>
        </button>
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${n(s.openScannerBtn)}</span>
        </a>
        ${e.devMode?`
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${e.qrPlaintext}">
            ${n(s.qrPlaintextToggle)}
          </button>
        `:""}
      </div>
      ${e.devMode&&a?`
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${a.rawBytes} B → deflate ${a.compressedBytes} B → envelope ${a.envelopeBytes} B · ${a.modules}×${a.modules} · EC ${a.errorCorrectionLevel}</p>
      `:""}
      <p class="m-qr-honesty" data-testid="qr-brute-honesty">${n(s.qrPinBrute)}</p>
      ${e.qrIssued>0?`<p class="m-qr-honesty">${n(s.qrReissueNote)}</p>`:""}
      ${e.qrDecodeError?`<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${n(s.qrDecodedFail)}</span></div>`:""}
      ${e.qrDecoded?`
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${n(s.qrDecodedOk)}</strong>
          <pre class="m-data">${n(JSON.stringify(e.qrDecoded,null,2))}</pre>
        </div>
      `:""}
    </section>
  `}function ve(e,s,a,r){const l=e.genes||[],c=e.currentMedications||[];return`
    <section class="m-stack" aria-labelledby="doc-heading">
      <div>
        <h2 class="m-sec-title" id="doc-heading">${n(a.doctorTitle)}</h2>
        <p class="m-sec-sub">${n(a.doctorSub)}</p>
      </div>
      ${me(r,a)}
      <div class="m-doctor-sheet m-chartpaper">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${n(a.doctorPatientId)}</small>
            <span class="m-data">${n(e.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${n(a.doctorOrigin)}</small>
            <span>${n(a.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${n(a.myMedsTitle)}</small>
            <span>${c.length?c.map(i=>n(i.name)).join(", "):"—"}</span>
          </div>
        </div>
        ${l.map(i=>{var h,y,_,v;const p=((h=i.callability)==null?void 0:h.method)==="not-assessed",o=H(i),d=E(i).filter(u=>u.status!=="none"),$=i.coverage||{},q=p?((y=i.callability)==null?void 0:y.reason)||a.notAssessedBody:$.definingPositionsTotal>0?`${$.definingPositionsAssayed}/${$.definingPositionsTotal} positions; untested: ${($.untestedLocalAlleles||[]).join(", ")||"none"}`:((_=i.callability)==null?void 0:_.source)||"Outside call";return`
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${n(i.gene)}${i.diplotype?` · ${n(i.diplotype)}`:" · Not assessed"}</strong>
                <span class="m-tier"><span class="m-tier__n">T${o.tier}</span> ${n(i.guidelineVersion||"")}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${n(a.doctorColGenetic)}:</strong> ${n(i.phenotype||"Not assessed")}</div>
                <div><strong>${n(a.doctorColEffective)}:</strong> ${n(i.effectivePhenotype||i.phenotype||"Not assessed")}${(v=i.phenoconversion)!=null&&v.applied?` (${n((i.phenoconversion.cause||[]).join(", "))}; ${n(i.phenoconversion.method||"")})`:""}</div>
                <div><strong>${n(a.doctorColCoverage)}:</strong> ${n(q)}</div>
              </div>
              ${d.length>0?`<div class="m-gene__drugs">
                    ${d.map(u=>{var P;return`
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${n(u.drug)}</span>
                        <span class="m-status m-status--${u.status}">
                          <svg aria-hidden="true"><use href="#${G(u.status)}"/></svg>
                          <span>${n(O(u.status,a))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${n(u.recommendation)}${u.alternatives.length?` <strong>${n(a.betterMatch)} ${n(u.alternatives.join(", "))}</strong>`:""} <span class="m-data">(${n(((P=u.guideline)==null?void 0:P.pub)||"CPIC")})</span></p>
                    `}).join("")}
                  </div>`:`<p class="m-coverage__line">${n(p?a.notAssessedBody:a.doctorNoDrugs)}</p>`}
            </div>
          `}).join("")}
        <p class="m-doctor-foot">${n(a.doctorFooter)}</p>
      </div>
    </section>
  `}function ge(e,s){return`
    <nav class="m-tabs m-tabs--fixed" aria-label="Passport navigation">
      ${[{id:"genes",icon:"i-genes",label:s.tabGenes},{id:"meds",icon:"i-pill",label:s.tabMeds},{id:"doctor",icon:"i-qr",label:s.tabDoctor}].map(r=>`
        <button type="button" data-action="tab" data-tab="${r.id}" aria-current="${e===r.id?"page":"false"}">
          <svg aria-hidden="true"><use href="#${r.icon}"/></svg>
          <span>${n(r.label)}</span>
        </button>
      `).join("")}
    </nav>
  `}function $e(e,s){const a=B[s.lang]||B.ar;let r="";s.error?r=`<div class="m-empty">${n(s.error)}</div>`:s.contract?s.tab==="meds"?r=ue(s.contract,s.lang,a):s.tab==="doctor"?r=ve(s.contract,s.lang,a,s):r=pe(s.contract,s.lang,a):r='<div class="m-empty">...</div>',e.innerHTML=`
    <div class="m-app">
      ${ce(s,a)}
      <main id="main-content">${r}</main>
    </div>
    ${ge(s.tab,a)}
  `}const b=document.getElementById("app"),f=new URLSearchParams(window.location.search),t={lang:f.get("lang")==="en"?"en":"ar",elder:f.get("elder")==="on",tab:["genes","meds","doctor"].includes(f.get("tab"))?f.get("tab"):"genes",patientId:f.get("patient")||"demo-001",devMode:f.get("dev")==="1",qrPin:"",qrPinConfirm:"",qrPinError:"",qrEmergencyOn:!1,qrEmergency:"",qrIssued:0,qrPlaintext:!1,qrResult:null,qrDecoded:null,qrDecodeError:!1,contract:null,error:null};let R=0;async function T(){if(!t.contract){t.qrResult=null;return}const e=t.devMode&&t.qrPlaintext;if(!e&&!j(t.qrPin)){t.qrResult=null;return}const s=++R,a=await se(t.contract,{pin:t.qrPin,plaintext:e,getDrugsFn:E,emergency:t.qrEmergencyOn?t.qrEmergency:""});if(s!==R)return;const r=ne(a.qrText,{ariaLabel:"Meyar Medication Passport encrypted QR"});t.qrResult={...a,...r},t.qrIssued+=1,g()}async function V(e){t.patientId=e,t.error=null,t.qrResult=null,t.qrDecoded=null,t.qrDecodeError=!1;try{const s=await fetch(`/demo/${encodeURIComponent(e)}.contract.json`);if(!s.ok)throw new Error(`HTTP ${s.status}`);t.contract=await s.json()}catch{t.contract=null,t.error=t.lang==="ar"?`تعذّر تحميل الملف التجريبي (${e}).`:`Could not load demo profile (${e}).`}g(),T()}function g(){X(t.lang),Z(t.elder),$e(b,t),ee(b)}b.addEventListener("input",e=>{const s=e.target;if(s.dataset.action==="qr-pin"||s.dataset.action==="qr-pin-confirm"){const a=J(s.value).replace(/[^0-9]/g,"").slice(0,6);a!==s.value&&(s.value=a),s.dataset.action==="qr-pin"?t.qrPin=a:t.qrPinConfirm=a}else s.dataset.action==="qr-emergency"&&(t.qrEmergency=s.value)});b.addEventListener("change",e=>{e.target.dataset.action==="qr-emergency-toggle"&&(t.qrEmergencyOn=e.target.checked,g())});async function fe(){const e=t.lang==="ar";t.qrDecoded=null,t.qrDecodeError=!1,j(t.qrPin)?t.qrPin!==t.qrPinConfirm?t.qrPinError=e?"الرقمان غير متطابقين. اكتبه مرة أخرى.":"The two PINs do not match. Type it again.":(t.qrPinError="",await T()):t.qrPinError=e?"الرقم السري ٦ أرقام بالضبط.":"The PIN must be exactly 6 digits.",g()}b.addEventListener("click",async e=>{const s=e.target.closest("[data-action]");if(!s)return;const a=s.dataset.action;if(a==="lang")t.lang=t.lang==="ar"?"en":"ar",g();else if(a==="elder")t.elder=!t.elder,g();else if(a==="tab")t.tab=s.dataset.tab,g(),window.scrollTo({top:0});else if(a==="patient")V(s.dataset.patient);else if(a==="toggle-plaintext")t.qrPlaintext=!t.qrPlaintext,t.qrDecoded=null,t.qrDecodeError=!1,T();else if(a==="decode-qr"&&t.qrResult){t.qrDecodeError=!1;try{t.qrDecoded=await ae(t.qrResult.qrText,{pin:t.qrPin,allowPlaintext:t.devMode})}catch{t.qrDecoded=null,t.qrDecodeError=!0}g()}else if(a==="issue-card")fe();else if(a==="speak"&&"speechSynthesis"in window){window.speechSynthesis.cancel();const r=new SpeechSynthesisUtterance(s.dataset.speak);r.lang=t.lang==="ar"?"ar-SA":"en-US",window.speechSynthesis.speak(r)}});K();"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});V(t.patientId);
