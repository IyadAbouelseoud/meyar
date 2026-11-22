import{c as U,s as N,d as w,f as Y,a as I,g as W,P as z,b as B,e as J,C as E,n as K,i as X,h as Z,j as ee,k as se,l as j,m as ne,r as ae,o as te}from"./index-CTMklNwm.js";const re=U.rows||[],ie=N.rows||[];function H(e){var c,i;const s=(c=e.coverage)==null?void 0:c.saudiDataTier,n=ie.find(p=>p.gene===e.gene),r=s??(n?n.saudiDataTier:2),l=((i=e.coverage)==null?void 0:i.saudiDataNote)||(n==null?void 0:n.saudiDataNote)||(r===2?"Tier 2: no published Saudi frequency (Goljan et al. 2022)":"");return{tier:r,note:l,coverageStatement:N._coverageStatement}}function oe(e){const s=(e.recommendation||"").toLowerCase();return Array.isArray(e.alternatives)&&e.alternatives.length>0||/\b(avoid|contraindicated|alternative|do not use)\b/.test(s)?"stop":/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(s)?"ask":"none"}function T(e){var c,i,p;if(((c=e.callability)==null?void 0:c.method)==="not-assessed")return[];const s=e.effectivePhenotype||e.phenotype;if(!s||/indeterminate|not assessed/i.test(s))return[];const n=(i=e.phenoconversion)!=null&&i.applied&&((p=e.phenoconversion)==null?void 0:p.adjustedActivityScore)!=null?String(e.phenoconversion.adjustedActivityScore.toFixed(1)):null,r=re.filter(o=>o.gene===e.gene&&o.phenotype===s),l=new Map;for(const o of r){const d=l.get(o.drug);d?(n&&o.activityScore===n||d.population&&/pediatric/i.test(d.population)&&!/pediatric/i.test(o.population||"")||o.population==="general"&&d.population!=="general"||o.population==="CVI ACS PCI"&&d.population!=="general")&&l.set(o.drug,o):l.set(o.drug,o)}return Array.from(l.values()).map(o=>({drug:o.drug,rxnorm:o.rxnorm,status:oe(o),implication:o.implication,recommendation:o.recommendation,classification:o.classification,alternatives:Array.isArray(o.alternatives)?o.alternatives.map(d=>typeof d=="string"?d:d==null?void 0:d.drug).filter(Boolean):[],guideline:o.guideline||null}))}function ce(e,s){const n=String(e||"").toLowerCase();return s.some(r=>{var l;return((l=r.phenoconversion)==null?void 0:l.applied)&&Array.isArray(r.phenoconversion.cause)&&r.phenoconversion.cause.some(c=>c.toLowerCase()===n)})}function a(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function G(e){return e==="stop"?"i-stop":e==="ask"?"i-ask":"i-none"}function O(e,s){return e==="stop"?s.statusStop:e==="ask"?s.statusAsk:s.statusNone}function le(e,s){const n=["demo-001","demo-002","demo-006"];return`
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${a(s.proto)}</span>
        <span class="m-mock">${a(s.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        <div class="m-seg" role="group" aria-label="${a(s.patientLabel)}">
          ${n.map(r=>`
            <button type="button" data-action="patient" data-patient="${r}" aria-pressed="${e.patientId===r}">
              <span class="m-data">${r}</span>
            </button>
          `).join("")}
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="elder" aria-pressed="${e.elder}">
          ${a(e.elder?s.elderOn:s.elderOff)}
        </button>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${a(s.langToggle)}
        </button>
      </div>
    </header>
  `}function de(e){return`
    <section class="m-cover" aria-labelledby="cover-title">
      <div>
        <span class="m-eyebrow m-cover__kicker">${a(e.brand)} · <span class="m-data">${a(e.brandEn)}</span></span>
        <h1 class="m-cover__title" id="cover-title">${a(e.passportTitle)}</h1>
        <p class="m-cover__sub">${a(e.coverSub)}</p>
      </div>
      <button type="button" class="m-btn m-cover__cta" data-action="tab" data-tab="doctor">
        <svg aria-hidden="true"><use href="#i-qr"/></svg>
        <span>${a(e.showDoctorBtn)}</span>
      </button>
      <div class="m-qatt m-qatt--thin" aria-hidden="true"></div>
    </section>
  `}function pe(e,s,n,r){var k,C,D,x,A,L;const l=((k=e.callability)==null?void 0:k.method)==="not-assessed",c=H(e),i=e.effectivePhenotype||e.phenotype,p=`gene-h-${s}`,o=`
    <span class="m-tier" title="${a(c.note)}">
      <span class="m-tier__n">${Y(c.tier,n)}</span>
      <span>${a(r.tierLabel(c.tier))}</span>
    </span>
  `;if(l)return`
      <article class="m-gene" aria-labelledby="${p}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${a(e.gene)} · VCF</span>
          ${o}
        </div>
        <p class="m-gene__plain" id="${p}">${a(r.notAssessedTitle)}</p>
        ${I(e,n,W(e,n))}
        <p class="m-coverage__line">${a(r.notAssessedBody)}</p>
      </article>
    `;const d=((C=z[n])==null?void 0:C[i])||i||"",$=T(e),q=$.filter(m=>m.status==="stop"||m.status==="ask"),b=q.length>0?q:$.slice(0,3),y=(D=e.phenoconversion)!=null&&D.applied?`<p class="m-gene__because">${r.phenoconversionLine(a(((x=B[n])==null?void 0:x[e.phenotype])||e.phenotype),a(((A=B[n])==null?void 0:A[e.effectivePhenotype])||e.effectivePhenotype),a((e.phenoconversion.cause||[]).map(m=>w(m,n)).join(", ")))}</p>`:"",_=b.length>0?`<div class="m-gene__drugs">
        ${b.map(m=>{var M;const F=m.alternatives.length>0?`<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${a(r.betterMatch)} <strong>${a(m.alternatives.map(Q=>w(Q,n)).join(" / "))}</strong> — ${a(r.askYourDoctor)} (${a(((M=m.guideline)==null?void 0:M.pub)||"CPIC")})</span>
              </div>`:"";return`
            <div class="m-drugrow">
              <span class="m-drugrow__name">${a(w(m.drug,n))}</span>
              <span class="m-status m-status--${m.status}">
                <svg aria-hidden="true"><use href="#${G(m.status)}"/></svg>
                <span>${a(O(m.status,r))}</span>
              </span>
            </div>
            ${F}
          `}).join("")}
      </div>`:"",v=e.coverage||{},u=v.definingPositionsTotal>0?`<div class="m-coverage">
        ${J(v)}
        <p class="m-coverage__line">${r.coverageLine(v.definingPositionsAssayed,v.definingPositionsTotal,v.untestedLocalAlleles)}</p>
      </div>`:((L=e.callability)==null?void 0:L.method)==="outside-call"?`<p class="m-coverage__line">${a(r.outsideCallNote)}</p>`:"",P=`${e.gene}. ${d}`;return`
    <article class="m-gene" aria-labelledby="${p}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${a(e.gene)}${e.diplotype?` · ${a(e.diplotype)}`:""}</span>
        <div class="m-gene__actions">
          ${o}
          <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-speak="${a(P)}">
            <svg aria-hidden="true"><use href="#i-speak"/></svg>
            <span>${a(r.readAloud)}</span>
          </button>
        </div>
      </div>
      <p class="m-gene__plain" id="${p}">${a(d)}</p>
      ${I(e,n)}
      ${y}
      ${_}
      ${u}
    </article>
  `}function ue(e,s,n){return`
    ${de(n)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${a(n.myGenesTitle)}</h2>
        <p class="m-sec-sub">${a(n.myGenesSub)}</p>
      </div>
      ${(e.genes||[]).map((r,l)=>pe(r,l,s,n)).join("")}
    </section>
  `}function me(e,s,n){const r=e.currentMedications||[],l=e.genes||[];return`
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${a(n.myMedsTitle)}</h2>
        <p class="m-sec-sub">${a(n.myMedsSub)}</p>
      </div>
      ${r.length===0?`<div class="m-empty">${a(n.noMeds)}</div>`:`<div class="m-medlist">
            ${r.map(c=>{const i=ce(c.name,l),p=c.source==="hospital-record"?n.sourceHospital:n.sourcePatient;return`
                <div>
                  <div>
                    <b>${a(w(c.name,s))}</b>
                    ${c.mock?`<span class="m-mock">${a(n.demo)}</span>`:""}
                    <br>
                    <small>${a(p)}</small>
                  </div>
                  <span class="m-status ${i?"m-status--info":"m-status--none"}">
                    <svg aria-hidden="true"><use href="#${i?"i-info":"i-none"}"/></svg>
                    <span>${a(i?n.changesGene:n.noGeneImpact)}</span>
                  </span>
                </div>
              `}).join("")}
          </div>`}
    </section>
  `}function ve(e,s){const n=e.qrResult,r=!!(e.devMode&&e.qrPlaintext);return`
    <section class="m-qr-card" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${a(s.qrTitle)}</h3>
          <p class="m-sec-sub">${a(s.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${a(r?s.qrPlainBadge:s.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${n?n.svg:`<p class="m-sec-sub">${a(s.qrPinPrompt)}</p>`}
      </div>
      <div class="m-qr-controls">
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-input">${a(s.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${a(e.qrPin)}" data-action="qr-pin">
        </div>
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-confirm">${a(s.qrPinConfirmLabel)}</label>
          <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${a(e.qrPinConfirm)}" data-action="qr-pin-confirm">
        </div>
      </div>
      <div class="m-qr-emergency">
        <label class="m-switch"><input type="checkbox" role="switch" data-action="qr-emergency-toggle" ${e.qrEmergencyOn?"checked":""}><span>${a(s.qrEmergencyToggle)}</span></label>
        ${e.qrEmergencyOn?`
          <div class="m-field">
            <label for="qr-emergency-input">${a(s.qrEmergencyLabel)}</label>
            <input id="qr-emergency-input" class="m-input" type="text" maxlength="120" value="${a(e.qrEmergency)}" data-action="qr-emergency">
            <p class="m-qr-honesty">${a(s.qrEmergencyHint)}</p>
          </div>`:""}
      </div>
      ${e.qrPinError?`<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${a(e.qrPinError)}</span></div>`:""}
      <div class="m-qr-controls">
        <button type="button" class="m-btn" data-action="issue-card">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${a(e.qrIssued>0?s.qrReissueBtn:s.qrIssueBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--secondary" data-action="decode-qr" ${n?"":"disabled"}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${a(s.qrVerifyBtn)}</span>
        </button>
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${a(s.openScannerBtn)}</span>
        </a>
        ${e.devMode?`
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${e.qrPlaintext}">
            ${a(s.qrPlaintextToggle)}
          </button>
        `:""}
      </div>
      ${e.devMode&&n?`
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${n.rawBytes} B → deflate ${n.compressedBytes} B → envelope ${n.envelopeBytes} B · ${n.modules}×${n.modules} · EC ${n.errorCorrectionLevel}</p>
      `:""}
      <p class="m-qr-honesty" data-testid="qr-brute-honesty">${a(s.qrPinBrute)}</p>
      ${e.qrIssued>0?`<p class="m-qr-honesty">${a(s.qrReissueNote)}</p>`:""}
      ${e.qrDecodeError?`<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${a(s.qrDecodedFail)}</span></div>`:""}
      ${e.qrDecoded?`
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${a(s.qrDecodedOk)}</strong>
          <pre class="m-data">${a(JSON.stringify(e.qrDecoded,null,2))}</pre>
        </div>
      `:""}
    </section>
  `}function ge(e,s,n,r){const l=e.genes||[],c=e.currentMedications||[];return`
    <section class="m-stack" aria-labelledby="doc-heading">
      <div>
        <h2 class="m-sec-title" id="doc-heading">${a(n.doctorTitle)}</h2>
        <p class="m-sec-sub">${a(n.doctorSub)}</p>
      </div>
      ${ve(r,n)}
      <div class="m-doctor-sheet m-chartpaper">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${a(n.doctorPatientId)}</small>
            <span class="m-data">${a(e.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${a(n.doctorOrigin)}</small>
            <span>${a(n.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${a(n.myMedsTitle)}</small>
            <span>${c.length?c.map(i=>a(i.name)).join(", "):"—"}</span>
          </div>
        </div>
        ${l.map(i=>{var b,y,_,v;const p=((b=i.callability)==null?void 0:b.method)==="not-assessed",o=H(i),d=T(i).filter(u=>u.status!=="none"),$=i.coverage||{},q=p?((y=i.callability)==null?void 0:y.reason)||n.notAssessedBody:$.definingPositionsTotal>0?`${$.definingPositionsAssayed}/${$.definingPositionsTotal} positions; untested: ${($.untestedLocalAlleles||[]).join(", ")||"none"}`:((_=i.callability)==null?void 0:_.source)||"Outside call";return`
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${a(i.gene)}${i.diplotype?` · ${a(i.diplotype)}`:" · Not assessed"}</strong>
                <span class="m-tier"><span class="m-tier__n">T${o.tier}</span> ${a(i.guidelineVersion||"")}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${a(n.doctorColGenetic)}:</strong> ${a(i.phenotype||"Not assessed")}</div>
                <div><strong>${a(n.doctorColEffective)}:</strong> ${a(i.effectivePhenotype||i.phenotype||"Not assessed")}${(v=i.phenoconversion)!=null&&v.applied?` (${a((i.phenoconversion.cause||[]).join(", "))}; ${a(i.phenoconversion.method||"")})`:""}</div>
                <div><strong>${a(n.doctorColCoverage)}:</strong> ${a(q)}</div>
              </div>
              ${d.length>0?`<div class="m-gene__drugs">
                    ${d.map(u=>{var P;return`
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${a(u.drug)}</span>
                        <span class="m-status m-status--${u.status}">
                          <svg aria-hidden="true"><use href="#${G(u.status)}"/></svg>
                          <span>${a(O(u.status,n))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${a(u.recommendation)}${u.alternatives.length?` <strong>${a(n.betterMatch)} ${a(u.alternatives.join(", "))}</strong>`:""} <span class="m-data">(${a(((P=u.guideline)==null?void 0:P.pub)||"CPIC")})</span></p>
                    `}).join("")}
                  </div>`:`<p class="m-coverage__line">${a(p?n.notAssessedBody:n.doctorNoDrugs)}</p>`}
            </div>
          `}).join("")}
        <p class="m-doctor-foot">${a(n.doctorFooter)}</p>
      </div>
    </section>
  `}function $e(e,s){return`
    <nav class="m-tabs m-tabs--fixed" aria-label="Passport navigation">
      ${[{id:"genes",icon:"i-genes",label:s.tabGenes},{id:"meds",icon:"i-pill",label:s.tabMeds},{id:"doctor",icon:"i-qr",label:s.tabDoctor}].map(r=>`
        <button type="button" data-action="tab" data-tab="${r.id}" aria-current="${e===r.id?"page":"false"}">
          <svg aria-hidden="true"><use href="#${r.icon}"/></svg>
          <span>${a(r.label)}</span>
        </button>
      `).join("")}
    </nav>
  `}function fe(e,s){const n=E[s.lang]||E.ar;let r="";s.error?r=`<div class="m-empty">${a(s.error)}</div>`:s.contract?s.tab==="meds"?r=me(s.contract,s.lang,n):s.tab==="doctor"?r=ge(s.contract,s.lang,n,s):r=ue(s.contract,s.lang,n):r='<div class="m-empty">...</div>',e.innerHTML=`
    <div class="m-app">
      ${le(s,n)}
      <main id="main-content">${r}</main>
    </div>
    ${$e(s.tab,n)}
  `}const h=document.getElementById("app"),f=new URLSearchParams(window.location.search),t={lang:f.get("lang")==="en"?"en":"ar",elder:f.get("elder")==="on",tab:["genes","meds","doctor"].includes(f.get("tab"))?f.get("tab"):"genes",patientId:f.get("patient")||"demo-001",devMode:f.get("dev")==="1",qrPin:"",qrPinConfirm:"",qrPinError:"",qrEmergencyOn:!1,qrEmergency:"",qrIssued:0,qrPlaintext:!1,qrResult:null,qrDecoded:null,qrDecodeError:!1,contract:null,error:null};let R=0;async function S(){if(!t.contract){t.qrResult=null;return}const e=t.devMode&&t.qrPlaintext;if(!e&&!j(t.qrPin)){t.qrResult=null;return}const s=++R,n=await ne(t.contract,{pin:t.qrPin,plaintext:e,getDrugsFn:T,emergency:t.qrEmergencyOn?t.qrEmergency:""});if(s!==R)return;const r=ae(n.qrText,{ariaLabel:"Meyar Medication Passport encrypted QR"});t.qrResult={...n,...r},t.qrIssued+=1,g()}async function V(e){t.patientId=e,t.error=null,t.qrResult=null,t.qrDecoded=null,t.qrDecodeError=!1;try{const s=await fetch(`/demo/${encodeURIComponent(e)}.contract.json`);if(!s.ok)throw new Error(`HTTP ${s.status}`);t.contract=await s.json()}catch{t.contract=null,t.error=t.lang==="ar"?`تعذّر تحميل الملف التجريبي (${e}).`:`Could not load demo profile (${e}).`}g(),S()}function g(){Z(t.lang),ee(t.elder),fe(h,t),se(h)}h.addEventListener("input",e=>{const s=e.target;if(s.dataset.action==="qr-pin"||s.dataset.action==="qr-pin-confirm"){const n=K(s.value).replace(/[^0-9]/g,"").slice(0,6);n!==s.value&&(s.value=n),s.dataset.action==="qr-pin"?t.qrPin=n:t.qrPinConfirm=n}else s.dataset.action==="qr-emergency"&&(t.qrEmergency=s.value)});h.addEventListener("change",e=>{e.target.dataset.action==="qr-emergency-toggle"&&(t.qrEmergencyOn=e.target.checked,g())});async function be(){const e=E[t.lang]||E.ar;t.qrDecoded=null,t.qrDecodeError=!1,j(t.qrPin)?t.qrPin!==t.qrPinConfirm?t.qrPinError=e.qrPinErrMatch:(t.qrPinError="",await S()):t.qrPinError=e.qrPinErrSix,g()}h.addEventListener("click",async e=>{const s=e.target.closest("[data-action]");if(!s)return;const n=s.dataset.action;if(n==="lang")t.lang=t.lang==="ar"?"en":"ar",g();else if(n==="elder")t.elder=!t.elder,g();else if(n==="tab")t.tab=s.dataset.tab,g(),window.scrollTo({top:0});else if(n==="patient")V(s.dataset.patient);else if(n==="toggle-plaintext")t.qrPlaintext=!t.qrPlaintext,t.qrDecoded=null,t.qrDecodeError=!1,S();else if(n==="decode-qr"&&t.qrResult){t.qrDecodeError=!1;try{t.qrDecoded=await te(t.qrResult.qrText,{pin:t.qrPin,allowPlaintext:t.devMode})}catch{t.qrDecoded=null,t.qrDecodeError=!0}g()}else if(n==="issue-card")be();else if(n==="speak"&&"speechSynthesis"in window){window.speechSynthesis.cancel();const r=new SpeechSynthesisUtterance(s.dataset.speak);r.lang=t.lang==="ar"?"ar-SA":"en-US",window.speechSynthesis.speak(r)}});X();"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});V(t.patientId);
