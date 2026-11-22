import{s as j,c as U,d as P,f as Y,a as M,P as O,b as B,e as W,C as I,i as J,g as z,h as K,j as X,k as Z,r as ee,l as se}from"./i18n-CQWYEntg.js";const ne=U.rows||[],te=j.rows||[];function N(e){var c,i;const t=(c=e.coverage)==null?void 0:c.saudiDataTier,s=te.find(p=>p.gene===e.gene),a=t??(s?s.saudiDataTier:2),d=((i=e.coverage)==null?void 0:i.saudiDataNote)||(s==null?void 0:s.saudiDataNote)||(a===2?"Tier 2: no published Saudi frequency (Goljan et al. 2022)":"");return{tier:a,note:d,coverageStatement:j._coverageStatement}}function ae(e){const t=(e.recommendation||"").toLowerCase();return Array.isArray(e.alternatives)&&e.alternatives.length>0||/\b(avoid|contraindicated|alternative|do not use)\b/.test(t)?"stop":/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(t)?"ask":"none"}function T(e){var c,i,p;if(((c=e.callability)==null?void 0:c.method)==="not-assessed")return[];const t=e.effectivePhenotype||e.phenotype;if(!t||/indeterminate|not assessed/i.test(t))return[];const s=(i=e.phenoconversion)!=null&&i.applied&&((p=e.phenoconversion)==null?void 0:p.adjustedActivityScore)!=null?String(e.phenoconversion.adjustedActivityScore.toFixed(1)):null,a=ne.filter(r=>r.gene===e.gene&&r.phenotype===t),d=new Map;for(const r of a){const l=d.get(r.drug);l?(s&&r.activityScore===s||l.population&&/pediatric/i.test(l.population)&&!/pediatric/i.test(r.population||"")||r.population==="general"&&l.population!=="general"||r.population==="CVI ACS PCI"&&l.population!=="general")&&d.set(r.drug,r):d.set(r.drug,r)}return Array.from(d.values()).map(r=>({drug:r.drug,rxnorm:r.rxnorm,status:ae(r),implication:r.implication,recommendation:r.recommendation,classification:r.classification,alternatives:Array.isArray(r.alternatives)?r.alternatives.map(l=>typeof l=="string"?l:l==null?void 0:l.drug).filter(Boolean):[],guideline:r.guideline||null}))}function oe(e,t){const s=String(e||"").toLowerCase();return t.some(a=>{var d;return((d=a.phenoconversion)==null?void 0:d.applied)&&Array.isArray(a.phenoconversion.cause)&&a.phenoconversion.cause.some(c=>c.toLowerCase()===s)})}function n(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function G(e){return e==="stop"?"i-stop":e==="ask"?"i-ask":"i-none"}function H(e,t){return e==="stop"?t.statusStop:e==="ask"?t.statusAsk:t.statusNone}function ie(e,t){const s=["demo-001","demo-002","demo-006"];return`
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${n(t.proto)}</span>
        <span class="m-mock">${n(t.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        <div class="m-seg" role="group" aria-label="${n(t.patientLabel)}">
          ${s.map(a=>`
            <button type="button" data-action="patient" data-patient="${a}" aria-pressed="${e.patientId===a}">
              <span class="m-data">${a}</span>
            </button>
          `).join("")}
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="elder" aria-pressed="${e.elder}">
          ${n(e.elder?t.elderOn:t.elderOff)}
        </button>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${n(t.langToggle)}
        </button>
      </div>
    </header>
  `}function re(e){return`
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
  `}function ce(e,t,s,a){var D,k,A,C,x,E;const d=((D=e.callability)==null?void 0:D.method)==="not-assessed",c=N(e),i=e.effectivePhenotype||e.phenotype,p=`gene-h-${t}`,r=`
    <span class="m-tier" title="${n(c.note)}">
      <span class="m-tier__n">${Y(c.tier,s)}</span>
      <span>${n(a.tierLabel(c.tier))}</span>
    </span>
  `;if(d)return`
      <article class="m-gene" aria-labelledby="${p}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${n(e.gene)} · VCF</span>
          ${r}
        </div>
        <p class="m-gene__plain" id="${p}">${n(a.notAssessedTitle)}</p>
        ${M(e,s)}
        <p class="m-coverage__line">${n(a.notAssessedBody)}</p>
      </article>
    `;const l=((k=O[s])==null?void 0:k[i])||i||"",g=T(e),f=g.filter(m=>m.status==="stop"||m.status==="ask"),b=f.length>0?f:g.slice(0,3),y=(A=e.phenoconversion)!=null&&A.applied?`<p class="m-gene__because">${a.phenoconversionLine(n(((C=B[s])==null?void 0:C[e.phenotype])||e.phenotype),n(((x=B[s])==null?void 0:x[e.effectivePhenotype])||e.effectivePhenotype),n((e.phenoconversion.cause||[]).map(m=>P(m,s)).join(", ")))}</p>`:"",q=b.length>0?`<div class="m-gene__drugs">
        ${b.map(m=>{var L;const V=m.alternatives.length>0?`<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${n(a.betterMatch)} <strong>${n(m.alternatives.map(Q=>P(Q,s)).join(" / "))}</strong> — ${n(a.askYourDoctor)} (${n(((L=m.guideline)==null?void 0:L.pub)||"CPIC")})</span>
              </div>`:"";return`
            <div class="m-drugrow">
              <span class="m-drugrow__name">${n(P(m.drug,s))}</span>
              <span class="m-status m-status--${m.status}">
                <svg aria-hidden="true"><use href="#${G(m.status)}"/></svg>
                <span>${n(H(m.status,a))}</span>
              </span>
            </div>
            ${V}
          `}).join("")}
      </div>`:"",v=e.coverage||{},u=v.definingPositionsTotal>0?`<div class="m-coverage">
        ${W(v)}
        <p class="m-coverage__line">${a.coverageLine(v.definingPositionsAssayed,v.definingPositionsTotal,v.untestedLocalAlleles)}</p>
      </div>`:((E=e.callability)==null?void 0:E.method)==="outside-call"?`<p class="m-coverage__line">${n(a.outsideCallNote)}</p>`:"",_=`${e.gene}. ${l}`;return`
    <article class="m-gene" aria-labelledby="${p}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${n(e.gene)}${e.diplotype?` · ${n(e.diplotype)}`:""}</span>
        <div class="m-gene__actions">
          ${r}
          <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-speak="${n(_)}">
            <svg aria-hidden="true"><use href="#i-speak"/></svg>
            <span>${n(a.readAloud)}</span>
          </button>
        </div>
      </div>
      <p class="m-gene__plain" id="${p}">${n(l)}</p>
      ${M(e,s)}
      ${y}
      ${q}
      ${u}
    </article>
  `}function de(e,t,s){return`
    ${re(s)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${n(s.myGenesTitle)}</h2>
        <p class="m-sec-sub">${n(s.myGenesSub)}</p>
      </div>
      ${(e.genes||[]).map((a,d)=>ce(a,d,t,s)).join("")}
    </section>
  `}function le(e,t,s){const a=e.currentMedications||[],d=e.genes||[];return`
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${n(s.myMedsTitle)}</h2>
        <p class="m-sec-sub">${n(s.myMedsSub)}</p>
      </div>
      ${a.length===0?`<div class="m-empty">${n(s.noMeds)}</div>`:`<div class="m-medlist">
            ${a.map(c=>{const i=oe(c.name,d),p=c.source==="hospital-record"?s.sourceHospital:s.sourcePatient;return`
                <div>
                  <div>
                    <b>${n(P(c.name,t))}</b>
                    ${c.mock?`<span class="m-mock">${n(s.demo)}</span>`:""}
                    <br>
                    <small>${n(p)}</small>
                  </div>
                  <span class="m-status ${i?"m-status--info":"m-status--none"}">
                    <svg aria-hidden="true"><use href="#${i?"i-info":"i-none"}"/></svg>
                    <span>${n(i?s.changesGene:s.noGeneImpact)}</span>
                  </span>
                </div>
              `}).join("")}
          </div>`}
    </section>
  `}function pe(e,t){const s=e.qrResult,a=!!(e.devMode&&e.qrPlaintext);return`
    <section class="m-qr-card" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${n(t.qrTitle)}</h3>
          <p class="m-sec-sub">${n(t.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${n(a?t.qrPlainBadge:t.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${s?s.svg:`<p class="m-sec-sub">${n(t.qrGenerating)}</p>`}
      </div>
      <div class="m-qr-controls">
        <div class="m-qr-pin-field">
          <label for="qr-pin-input">${n(t.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-qr-pin-input m-data" type="text" inputmode="numeric" maxlength="6" value="${n(e.qrPin)}" data-action="qr-pin">
        </div>
        <button type="button" class="m-btn" data-action="decode-qr" ${s?"":"disabled"}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${n(t.qrVerifyBtn)}</span>
        </button>
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${n(t.openScannerBtn)}</span>
        </a>
        ${e.devMode?`
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${e.qrPlaintext}">
            ${n(t.qrPlaintextToggle)}
          </button>
        `:""}
      </div>
      ${e.devMode&&s?`
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${s.rawBytes} B → deflate ${s.compressedBytes} B → envelope ${s.envelopeBytes} B · ${s.modules}×${s.modules} · EC ${s.errorCorrectionLevel}</p>
      `:""}
      <p class="m-qr-honesty">${n(t.qrPinHonesty)}</p>
      ${e.qrDecodeError?`<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${n(t.qrDecodedFail)}</span></div>`:""}
      ${e.qrDecoded?`
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${n(t.qrDecodedOk)}</strong>
          <pre class="m-data">${n(JSON.stringify(e.qrDecoded,null,2))}</pre>
        </div>
      `:""}
    </section>
  `}function ue(e,t,s,a){const d=e.genes||[],c=e.currentMedications||[];return`
    <section class="m-stack" aria-labelledby="doc-heading">
      <div>
        <h2 class="m-sec-title" id="doc-heading">${n(s.doctorTitle)}</h2>
        <p class="m-sec-sub">${n(s.doctorSub)}</p>
      </div>
      ${pe(a,s)}
      <div class="m-doctor-sheet m-chartpaper">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${n(s.doctorPatientId)}</small>
            <span class="m-data">${n(e.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${n(s.doctorOrigin)}</small>
            <span>${n(s.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${n(s.myMedsTitle)}</small>
            <span>${c.length?c.map(i=>n(i.name)).join(", "):"—"}</span>
          </div>
        </div>
        ${d.map(i=>{var b,y,q,v;const p=((b=i.callability)==null?void 0:b.method)==="not-assessed",r=N(i),l=T(i).filter(u=>u.status!=="none"),g=i.coverage||{},f=p?((y=i.callability)==null?void 0:y.reason)||s.notAssessedBody:g.definingPositionsTotal>0?`${g.definingPositionsAssayed}/${g.definingPositionsTotal} positions; untested: ${(g.untestedLocalAlleles||[]).join(", ")||"none"}`:((q=i.callability)==null?void 0:q.source)||"Outside call";return`
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${n(i.gene)}${i.diplotype?` · ${n(i.diplotype)}`:" · Not assessed"}</strong>
                <span class="m-tier"><span class="m-tier__n">T${r.tier}</span> ${n(i.guidelineVersion||"")}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${n(s.doctorColGenetic)}:</strong> ${n(i.phenotype||"Not assessed")}</div>
                <div><strong>${n(s.doctorColEffective)}:</strong> ${n(i.effectivePhenotype||i.phenotype||"Not assessed")}${(v=i.phenoconversion)!=null&&v.applied?` (${n((i.phenoconversion.cause||[]).join(", "))}; ${n(i.phenoconversion.method||"")})`:""}</div>
                <div><strong>${n(s.doctorColCoverage)}:</strong> ${n(f)}</div>
              </div>
              ${l.length>0?`<div class="m-gene__drugs">
                    ${l.map(u=>{var _;return`
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${n(u.drug)}</span>
                        <span class="m-status m-status--${u.status}">
                          <svg aria-hidden="true"><use href="#${G(u.status)}"/></svg>
                          <span>${n(H(u.status,s))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${n(u.recommendation)}${u.alternatives.length?` <strong>${n(s.betterMatch)} ${n(u.alternatives.join(", "))}</strong>`:""} <span class="m-data">(${n(((_=u.guideline)==null?void 0:_.pub)||"CPIC")})</span></p>
                    `}).join("")}
                  </div>`:`<p class="m-coverage__line">${n(p?s.notAssessedBody:s.doctorNoDrugs)}</p>`}
            </div>
          `}).join("")}
        <p class="m-doctor-foot">${n(s.doctorFooter)}</p>
      </div>
    </section>
  `}function me(e,t){return`
    <nav class="m-tabs m-tabs--fixed" aria-label="Passport navigation">
      ${[{id:"genes",icon:"i-genes",label:t.tabGenes},{id:"meds",icon:"i-pill",label:t.tabMeds},{id:"doctor",icon:"i-qr",label:t.tabDoctor}].map(a=>`
        <button type="button" data-action="tab" data-tab="${a.id}" aria-current="${e===a.id?"page":"false"}">
          <svg aria-hidden="true"><use href="#${a.icon}"/></svg>
          <span>${n(a.label)}</span>
        </button>
      `).join("")}
    </nav>
  `}function ve(e,t){const s=I[t.lang]||I.ar;let a="";t.error?a=`<div class="m-empty">${n(t.error)}</div>`:t.contract?t.tab==="meds"?a=le(t.contract,t.lang,s):t.tab==="doctor"?a=ue(t.contract,t.lang,s,t):a=de(t.contract,t.lang,s):a='<div class="m-empty">...</div>',e.innerHTML=`
    <div class="m-app">
      ${ie(t,s)}
      <main id="main-content">${a}</main>
    </div>
    ${me(t.tab,s)}
  `}const w=document.getElementById("app"),$=new URLSearchParams(window.location.search),o={lang:$.get("lang")==="en"?"en":"ar",elder:$.get("elder")==="on",tab:["genes","meds","doctor"].includes($.get("tab"))?$.get("tab"):"genes",patientId:$.get("patient")||"demo-001",devMode:$.get("dev")==="1",qrPin:"123456",qrPlaintext:!1,qrResult:null,qrDecoded:null,qrDecodeError:!1,contract:null,error:null};let R=0;async function S(){if(!o.contract){o.qrResult=null;return}const e=++R,t=o.qrPin&&o.qrPin.length>=4?o.qrPin:"123456",s=await Z(o.contract,{pin:t,plaintext:o.devMode&&o.qrPlaintext,getDrugsFn:T});if(e!==R)return;const a=ee(s.qrText,{ariaLabel:`${o.contract.patientId} offline QR`});o.qrResult={...s,...a},h()}async function F(e){o.patientId=e,o.error=null,o.qrResult=null,o.qrDecoded=null,o.qrDecodeError=!1;try{const t=await fetch(`/demo/${encodeURIComponent(e)}.contract.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);o.contract=await t.json()}catch{o.contract=null,o.error=o.lang==="ar"?`تعذّر تحميل الملف التجريبي (${e}).`:`Could not load demo profile (${e}).`}h(),S()}function h(){z(o.lang),K(o.elder),ve(w,o),X(w)}w.addEventListener("input",e=>{const t=e.target.closest('[data-action="qr-pin"]');t&&(o.qrPin=t.value,o.qrDecoded=null,o.qrDecodeError=!1,o.qrPin.length>=4&&S())});w.addEventListener("click",async e=>{const t=e.target.closest("[data-action]");if(!t)return;const s=t.dataset.action;if(s==="lang")o.lang=o.lang==="ar"?"en":"ar",h();else if(s==="elder")o.elder=!o.elder,h();else if(s==="tab")o.tab=t.dataset.tab,h(),window.scrollTo({top:0});else if(s==="patient")F(t.dataset.patient);else if(s==="toggle-plaintext")o.qrPlaintext=!o.qrPlaintext,o.qrDecoded=null,o.qrDecodeError=!1,S();else if(s==="decode-qr"&&o.qrResult){o.qrDecodeError=!1;try{o.qrDecoded=await se(o.qrResult.qrText,{pin:o.qrPin})}catch{o.qrDecoded=null,o.qrDecodeError=!0}h()}else if(s==="speak"&&"speechSynthesis"in window){window.speechSynthesis.cancel();const a=new SpeechSynthesisUtterance(t.dataset.speak);a.lang=o.lang==="ar"?"ar-SA":"en-US",window.speechSynthesis.speak(a)}});J();"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});F(o.patientId);
