import{c as ne,s as ae,C as I,d as A,P as S,f as ge,a as V,g as he,b as fe,e as ye,n as ve,i as be,h as we,j as $e,k as Pe,l as te,m as Ce,r as qe,o as ke}from"./index-B662f09C.js";const ze=ne.rows||[],xe=ae.rows||[];function re(e){var o,i;const n=(o=e.coverage)==null?void 0:o.saudiDataTier,s=xe.find(l=>l.gene===e.gene),t=n??(s?s.saudiDataTier:2),c=((i=e.coverage)==null?void 0:i.saudiDataNote)||(s==null?void 0:s.saudiDataNote)||(t===2?"Tier 2: no published Saudi frequency (Goljan et al. 2022)":"");return{tier:t,note:c,coverageStatement:ae._coverageStatement}}function oe(e){const n=(e.recommendation||"").toLowerCase();return Array.isArray(e.alternatives)&&e.alternatives.length>0||/\b(avoid|contraindicated|alternative|do not use)\b/.test(n)?"stop":/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(n)?"ask":"none"}function ie(e,n){var o,i;const s=(o=n==null?void 0:n.phenoconversion)!=null&&o.applied?(i=n==null?void 0:n.phenoconversion)==null?void 0:i.adjustedActivityScore:null,t=s!=null?new Set([String(s),s.toFixed(1)]):null;let c=null;for(const l of e)c?(t&&t.has(String(l.activityScore))||c.population&&/pediatric/i.test(c.population)&&!/pediatric/i.test(l.population||"")||l.population==="general"&&c.population!=="general"||l.population==="CVI ACS PCI"&&c.population!=="general")&&(c=l):c=l;return c}function G(e){var c;if(((c=e.callability)==null?void 0:c.method)==="not-assessed")return[];const n=e.effectivePhenotype||e.phenotype;if(!n||/indeterminate|not assessed/i.test(n))return[];const s=ze.filter(o=>o.gene===e.gene&&o.phenotype===n),t=new Map;for(const o of s)t.has(o.drug)||t.set(o.drug,[]),t.get(o.drug).push(o);return Array.from(t.values()).map(o=>{const i=ie(o,e);return{drug:i.drug,rxnorm:i.rxnorm,status:oe(i),implication:i.implication,recommendation:i.recommendation,classification:i.classification,alternatives:Array.isArray(i.alternatives)?i.alternatives.map(l=>typeof l=="string"?l:l==null?void 0:l.drug).filter(Boolean):[],guideline:i.guideline||null}})}function _e(e,n){const s=String(e||"").toLowerCase();return n.some(t=>{var c;return((c=t.phenoconversion)==null?void 0:c.applied)&&Array.isArray(t.phenoconversion.cause)&&t.phenoconversion.cause.some(o=>o.toLowerCase()===s)})}const Ee=[{id:"paracetamol",brandEn:"Paracetamol",brandAr:"باراسيتامول",aliasesEn:["paracetamol","acetaminophen","apap"],aliasesAr:["باراسيتامول","اسيتامينوفين","أسيتامينوفين"],ingredients:["paracetamol"],otc:!0,source:"WHO INN / standard generic active ingredient (no CPIC gene-drug guideline)",mock:!0},{id:"panadol",brandEn:"Panadol",brandAr:"بنادول",aliasesEn:["panadol","panadol advance","panadol extra"],aliasesAr:["بنادول","بانادول","بنادول أدفانس","بنادول إكسترا"],ingredients:["paracetamol"],otc:!0,source:"Mock OTC catalog entry; standard paracetamol brand composition",mock:!0},{id:"fevadol",brandEn:"Fevadol",brandAr:"فيفادول",aliasesEn:["fevadol"],aliasesAr:["فيفادول","فيڤادول"],ingredients:["paracetamol"],otc:!0,source:"Mock OTC catalog entry; standard paracetamol brand composition",mock:!0},{id:"adol",brandEn:"Adol",brandAr:"أدول",aliasesEn:["adol","tylenol"],aliasesAr:["أدول","ادول","تايلينول"],ingredients:["paracetamol"],otc:!0,source:"Mock OTC catalog entry; standard paracetamol brand composition",mock:!0},{id:"panadol-night",brandEn:"Panadol Night",brandAr:"بنادول نايت",aliasesEn:["panadol night","diphenhydramine"],aliasesAr:["بنادول نايت","بانادول نايت","ديفينهيدرامين"],ingredients:["paracetamol","diphenhydramine"],otc:!0,source:"Mock OTC catalog entry; paracetamol + diphenhydramine (no CPIC guideline)",mock:!0},{id:"omeprazole",brandEn:"Omeprazole",brandAr:"أوميبرازول",aliasesEn:["omeprazole","losec","risek","gasec","omez"],aliasesAr:["أوميبرازول","اوميبرازول","لوسيك","ريسيك","جاسيك","أوميز"],ingredients:["omeprazole"],otc:!0,source:"CPIC CYP2C19/PPI guideline drug (Lima JJ et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"lansoprazole",brandEn:"Lansoprazole",brandAr:"لانسوبرازول",aliasesEn:["lansoprazole","lanzor","takepron"],aliasesAr:["لانسوبرازول","لانزور"],ingredients:["lansoprazole"],otc:!0,source:"CPIC CYP2C19/PPI guideline drug (Lima JJ et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"pantoprazole",brandEn:"Pantoprazole",brandAr:"بانتوبرازول",aliasesEn:["pantoprazole","controloc","pantozol"],aliasesAr:["بانتوبرازول","كونترولوك","بانتوزول"],ingredients:["pantoprazole"],otc:!0,source:"CPIC CYP2C19/PPI guideline drug (Lima JJ et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"ibuprofen",brandEn:"Ibuprofen",brandAr:"إيبوبروفين",aliasesEn:["ibuprofen","brufen","advil","nurofen","sapofen"],aliasesAr:["إيبوبروفين","ايبوبروفين","بروفين","أدفيل","ادفيل","نوروفين","سابوفين"],ingredients:["ibuprofen"],otc:!0,source:"CPIC CYP2C9/NSAIDs guideline drug (Theken KN et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"solpadeine",brandEn:"Solpadeine (paracetamol + codeine)",brandAr:"سولبادين (باراسيتامول + كودايين)",aliasesEn:["solpadeine","solpadol"],aliasesAr:["سولبادين","سولبادول"],ingredients:["paracetamol","codeine"],otc:!0,source:"CPIC CYP2D6/Opioids guideline drug codeine (Crews KR et al., Clin Pharmacol Ther 2021); mock combination product entry",mock:!0},{id:"panadeine",brandEn:"Panadeine (paracetamol + codeine)",brandAr:"بنادين (باراسيتامول + كودايين)",aliasesEn:["panadeine","co-codamol","cocodamol"],aliasesAr:["بنادين","بانادين","كو-كودامول"],ingredients:["paracetamol","codeine"],otc:!0,source:"CPIC CYP2D6/Opioids guideline drug codeine (Crews KR et al., Clin Pharmacol Ther 2021); mock combination product entry",mock:!0},{id:"codeine",brandEn:"Codeine",brandAr:"كودايين",aliasesEn:["codeine"],aliasesAr:["كودايين","كودين"],ingredients:["codeine"],otc:!1,source:"CPIC CYP2D6/Opioids guideline drug (Crews KR et al., Clin Pharmacol Ther 2021)",mock:!0},{id:"cetirizine",brandEn:"Zyrtec (Cetirizine)",brandAr:"زيرتك (سيتريزين)",aliasesEn:["zyrtec","cetirizine","artiz"],aliasesAr:["زيرتك","سيتريزين","أرتيز"],ingredients:["cetirizine"],otc:!0,source:"Mock OTC catalog entry; standard cetirizine brand composition (no CPIC guideline)",mock:!0},{id:"loratadine",brandEn:"Claritine (Loratadine)",brandAr:"كلاريتين (لوراتادين)",aliasesEn:["claritine","claritin","loratadine","lorinase"],aliasesAr:["كلاريتين","لوراتادين","لورينيز"],ingredients:["loratadine"],otc:!0,source:"Mock OTC catalog entry; standard loratadine brand composition (no CPIC guideline)",mock:!0},{id:"aspirin",brandEn:"Aspirin",brandAr:"أسبرين",aliasesEn:["aspirin","acetylsalicylic acid","jusprin"],aliasesAr:["أسبرين","اسبرين","جوسبرين"],ingredients:["aspirin"],otc:!0,source:"Mock OTC catalog entry; WHO INN acetylsalicylic acid (no CPIC gene-drug guideline row)",mock:!0},{id:"naproxen",brandEn:"Naproxen",brandAr:"نابروكسين",aliasesEn:["naproxen","aleve","proxen","naprosyn"],aliasesAr:["نابروكسين","بروكسين","نابروسين"],ingredients:["naproxen"],otc:!0,source:"Mock OTC catalog entry; WHO INN naproxen (no CPIC gene-drug guideline row)",mock:!0}],Te={rows:Ee},Ae=[{drug:"bupropion",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluoxetine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"paroxetine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"quinidine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"terbinafine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"abiraterone",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cinacalcet",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"duloxetine",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"lorcaserin",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"mirabegron",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"rolapitant",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"amiodarone",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"celecoxib",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cimetidine",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"clobazam",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cobicistat",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"escitalopram",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluvoxamine",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"labetalol",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"sertraline",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"vemurafenib",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluconazole",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluoxetine",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluvoxamine",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"ticlopidine",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cenobamate",enzyme:"CYP2C19",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"felbamate",enzyme:"CYP2C19",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"voriconazole",enzyme:"CYP2C19",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"omeprazole",enzyme:"CYP2C19",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"pirtobrutinib",enzyme:"CYP2C19",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"}],Se={rows:Ae},ce=Te.rows||[],Ie=ne.rows||[],Le=Se.rows||[],W={none:0,ask:1,stop:2};function le(e){let n=String(e||"").trim().toLowerCase();return n?(n=n.replace(/[\u064B-\u065F\u0670\u0640]/g,""),n=n.replace(/[أإآٱ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ڤ/g,"ف"),n=n.replace(/[^\p{L}\p{N}]+/gu," ").trim(),n=n.split(/\s+/).map(s=>s.startsWith("ال")&&s.length>=4?s.slice(2):s).join(" "),n):""}function J(e,n){if(e===n)return 0;const s=e.length,t=n.length;if(s===0)return t;if(t===0)return s;let c=Array.from({length:t+1},(o,i)=>i);for(let o=1;o<=s;o+=1){const i=[o];for(let l=1;l<=t;l+=1){const u=e[o-1]===n[l-1]?0:1;i[l]=Math.min(c[l]+1,i[l-1]+1,c[l-1]+u)}c=i}return c[t]}function K(e){return e<=3?0:e<=5?1:2}function De(e){const n=[e.brandEn,e.brandAr,...e.aliasesEn||[],...e.aliasesAr||[],...e.ingredients||[]].filter(Boolean),s=new Set,t=[];for(const c of n){const o=le(c);o&&!s.has(o)&&(s.add(o),t.push(o))}return t}function Me(e,n=ce){const s=le(e);if(!s)return null;let t=null;for(const c of n){const o=De(c);for(const i of o){let l=null;if(i===s)l={product:c,matchType:"exact",score:0};else if(s.length>=3&&(i.startsWith(s)||i.split(" ").some(u=>u.startsWith(s))))l={product:c,matchType:"prefix",score:.5+(i.length-s.length)*.01};else if(s.length>=4){const u=J(s,i),y=K(Math.max(s.length,i.length));if(u<=y)l={product:c,matchType:"fuzzy",score:u+1};else for(const m of i.split(" ")){if(m.length<4)continue;const w=J(s,m),d=K(Math.max(s.length,m.length));if(w<=d){const h=w+1.2;(!l||h<l.score)&&(l={product:c,matchType:"fuzzy",score:h})}}}l&&(!t||l.score<t.score)&&(t=l)}}return t}function Be(e,n,s={}){var b,z,N,R,D;const t=String(e||"").trim();if(!t)return null;const c=s.products||ce,o=s.cpicRows||Ie,i=s.inhibitors||Le,l=s.currentMedications||(n==null?void 0:n.currentMedications)||[],u=Me(t,c);if(!u)return{status:"unknown",query:t,product:null,matchType:null,details:[],inhibitorHits:[]};const{product:y,matchType:m}=u,w=(n==null?void 0:n.genes)||[],d=[],h=[];let $="none";const v=P=>{(W[P]??0)>(W[$]??0)&&($=P)};for(const P of y.ingredients||[]){const M=String(P).toLowerCase(),_=o.filter(C=>String(C.drug||"").toLowerCase()===M);if(_.length===0)d.push({ingredient:P,gene:null,status:"none",reasonType:"no-cpic-guideline",recommendation:null,alternatives:[],guideline:null});else{const C=[...new Set(_.map(q=>q.gene))];for(const q of C){const g=w.find(k=>k.gene===q);if(!g){v("ask"),d.push({ingredient:P,gene:q,status:"ask",reasonType:"gene-not-in-profile",recommendation:null,alternatives:[],guideline:((b=_[0])==null?void 0:b.guideline)||null});continue}if(((z=g.callability)==null?void 0:z.method)==="not-assessed"){v("ask"),d.push({ingredient:P,gene:q,status:"ask",reasonType:"not-assessed",callability:g.callability,recommendation:null,alternatives:[],guideline:((N=_[0])==null?void 0:N.guideline)||null});continue}const x=g.effectivePhenotype||g.phenotype;if(!x||/indeterminate|not assessed/i.test(x)){v("ask"),d.push({ingredient:P,gene:q,status:"ask",reasonType:"indeterminate",geneticPhenotype:g.phenotype||null,effectivePhenotype:x||null,recommendation:null,alternatives:[],guideline:((R=_[0])==null?void 0:R.guideline)||null});continue}const p=_.filter(k=>k.phenotype===x),E=ie(p,g);if(!E){v("ask"),d.push({ingredient:P,gene:q,status:"ask",reasonType:"no-phenotype-row",geneticPhenotype:g.phenotype,effectivePhenotype:x,phenoconversion:g.phenoconversion||null,recommendation:null,alternatives:[],guideline:((D=_[0])==null?void 0:D.guideline)||null});continue}const Y=oe(E);v(Y),d.push({ingredient:P,gene:q,status:Y,reasonType:"cpic-match",geneticPhenotype:g.phenotype,effectivePhenotype:x,phenoconversion:g.phenoconversion||null,implication:E.implication,recommendation:E.recommendation,classification:E.classification,alternatives:Array.isArray(E.alternatives)?E.alternatives.map(k=>typeof k=="string"?k:(k==null?void 0:k.drug)||(k==null?void 0:k.drugClass)).filter(Boolean):[],guideline:E.guideline||null})}}const B=i.filter(C=>String(C.drug||"").toLowerCase()===M&&(C.strength==="strong"||C.strength==="moderate"));if(B.length>0&&l.length>0)for(const C of B){const q=l.filter(g=>{const x=String(g.name||"").toLowerCase();return o.some(p=>String(p.drug||"").toLowerCase()===x&&p.gene===C.enzyme)});q.length>0&&(v("ask"),h.push({ingredient:P,enzyme:C.enzyme,strength:C.strength,affectedMedications:q.map(g=>g.name)}))}}return{status:$,query:t,product:y,matchType:m,details:d,inhibitorHits:h}}function de(e,n="ar"){if(!Array.isArray(e)||e.length===0)return null;const s=t=>String((t==null?void 0:t.lang)||"").toLowerCase().replace("_","-");return n==="ar"?e.find(t=>s(t)==="ar-sa"||s(t).startsWith("ar-sa-"))||null:e.find(t=>s(t)==="en-us"||s(t)==="en-gb")||e.find(t=>s(t).startsWith("en-"))||e.find(t=>s(t)==="en")||null}function U(e="ar",n=typeof window<"u"?window.speechSynthesis:null){return!n||typeof n.getVoices!="function"?!1:de(n.getVoices(),e)!==null}function Z({gene:e,plainSentence:n,phenoconversionLine:s,drugs:t=[],lang:c="ar"}){const o=[];e!=null&&e.gene&&o.push(e.gene),n&&o.push(n),s&&o.push(s);for(const i of t)i.label&&i.statusLabel&&o.push(c==="ar"?`${i.label}: ${i.statusLabel}`:`${i.label}: ${i.statusLabel}`);return o.join(". ")}function a(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function j(e){return e==="stop"?"i-stop":e==="ask"?"i-ask":"i-none"}function O(e,n){return e==="stop"?n.statusStop:e==="ask"?n.statusAsk:n.statusNone}function Ye(e,n){const s=["demo-001","demo-002","demo-006"];return`
    <header class="m-topbar">
      <div class="m-topbar__honesty">
        <span class="m-proto">${a(n.proto)}</span>
        <span class="m-mock">${a(n.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        ${e.caregiverMode?"":`
          <div class="m-seg" role="group" aria-label="${a(n.patientLabel)}">
            ${s.map(t=>`
              <button type="button" data-action="patient" data-patient="${t}" aria-pressed="${e.patientId===t}">
                <span class="m-data">${t}</span>
              </button>
            `).join("")}
          </div>
        `}
        <label class="m-switch">
          <input type="checkbox" data-action="elder" ${e.elder?"checked":""} aria-label="${a(n.elderOff)}">
          <span>${a(n.elderOff)}</span>
        </label>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${a(n.langToggle)}
        </button>
      </div>
    </header>
    ${e.caregiverMode?`
      <div class="m-caregiver-bar" role="status" data-testid="caregiver-banner">
        <div class="m-caregiver-bar__info">
          <span class="m-status m-status--info">
            <svg aria-hidden="true"><use href="#i-info"/></svg>
            <span>${a(n.caregiverBadge)}</span>
          </span>
          <p class="m-sec-sub">${a(n.caregiverNote)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="caregiver-toggle">
          ${a(n.caregiverExitBtn)}
        </button>
      </div>
    `:""}
  `}function Ne(e){return`
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
  `}function X(e,n,s,t){const c=s.speakingIndex===n;return s.speechAvailable?`
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${n}" data-speak="${a(e)}" aria-pressed="${c}">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${a(c?t.stopReading:t.readAloud)}</span>
      </button>
    `:`
    <span class="m-speak-tooltip" title="${a(t.readAloudUnavailable)}" data-tooltip="${a(t.readAloudUnavailable)}" tabindex="0" role="note" aria-label="${a(t.readAloudUnavailable)}">
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${n}" hidden aria-hidden="true" tabindex="-1">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${a(t.readAloud)}</span>
      </button>
      <svg aria-hidden="true"><use href="#i-info"/></svg>
      <span>${a(t.readAloudUnavailableShort)}</span>
    </span>
  `}function Re(e,n,s,t,c){var D,P,M,_,B,C,q,g,x;const o=((D=e.callability)==null?void 0:D.method)==="not-assessed",i=re(e),l=e.effectivePhenotype||e.phenotype,u=`gene-h-${n}`,y=`
    <span class="m-tier" title="${a(i.note)}">
      <span class="m-tier__n">${ge(i.tier,s)}</span>
      <span>${a(t.tierLabel(i.tier))}</span>
    </span>
  `;if(o){const p=Z({gene:e,plainSentence:`${t.notAssessedTitle}. ${t.notAssessedBody}`,lang:s});return`
      <article class="m-gene" aria-labelledby="${u}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${a(e.gene)} · VCF</span>
          <div class="m-gene__actions">
            ${y}
            ${X(p,n,c,t)}
          </div>
        </div>
        <p class="m-gene__plain" id="${u}">${a(t.notAssessedTitle)}</p>
        ${V(e,s,he(e,s))}
        <p class="m-coverage__line">${a(t.notAssessedBody)}</p>
      </article>
    `}const m=((P=fe[s])==null?void 0:P[l])||l||"",w=G(e),d=w.filter(p=>p.status==="stop"||p.status==="ask"),h=d.length>0?d:w.slice(0,3),$=(M=e.phenoconversion)!=null&&M.applied?t.phenoconversionLine(((_=S[s])==null?void 0:_[e.phenotype])||e.phenotype,((B=S[s])==null?void 0:B[e.effectivePhenotype])||e.effectivePhenotype,(e.phenoconversion.cause||[]).map(p=>A(p,s)).join(", ")).replace(/<[^>]+>/g,""):"",v=(C=e.phenoconversion)!=null&&C.applied?`<p class="m-gene__because">${t.phenoconversionLine(a(((q=S[s])==null?void 0:q[e.phenotype])||e.phenotype),a(((g=S[s])==null?void 0:g[e.effectivePhenotype])||e.effectivePhenotype),a((e.phenoconversion.cause||[]).map(p=>A(p,s)).join(", ")))}</p>`:"",b=h.length>0?`<div class="m-gene__drugs">
        ${h.map(p=>{var Y;const E=p.alternatives.length>0?`<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${a(t.betterMatch)} <strong>${a(p.alternatives.map(k=>A(k,s)).join(" / "))}</strong> — ${a(t.askYourDoctor)} (${a(((Y=p.guideline)==null?void 0:Y.pub)||"CPIC")})</span>
              </div>`:"";return`
            <div class="m-drugrow">
              <span class="m-drugrow__name">${a(A(p.drug,s))}</span>
              <span class="m-status m-status--${p.status}">
                <svg aria-hidden="true"><use href="#${j(p.status)}"/></svg>
                <span>${a(O(p.status,t))}</span>
              </span>
            </div>
            ${E}
          `}).join("")}
      </div>`:"",z=e.coverage||{},N=z.definingPositionsTotal>0?`<div class="m-coverage">
        ${ye(z)}
        <p class="m-coverage__line">${t.coverageLine(z.definingPositionsAssayed,z.definingPositionsTotal,z.untestedLocalAlleles)}</p>
      </div>`:((x=e.callability)==null?void 0:x.method)==="outside-call"?`<p class="m-coverage__line">${a(t.outsideCallNote)}</p>`:"",R=Z({gene:e,plainSentence:m,phenoconversionLine:$,drugs:h.map(p=>({label:A(p.drug,s),statusLabel:O(p.status,t)})),lang:s});return`
    <article class="m-gene" aria-labelledby="${u}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${a(e.gene)}${e.diplotype?` · ${a(e.diplotype)}`:""}</span>
        <div class="m-gene__actions">
          ${y}
          ${X(R,n,c,t)}
        </div>
      </div>
      <p class="m-gene__plain" id="${u}">${a(m)}</p>
      ${V(e,s)}
      ${v}
      ${b}
      ${N}
    </article>
  `}function Oe(e,n,s,t){return`
    ${Ne(s)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${a(s.myGenesTitle)}</h2>
        <p class="m-sec-sub">${a(s.myGenesSub)}</p>
      </div>
      ${(e.genes||[]).map((c,o)=>Re(c,o,n,s,t)).join("")}
    </section>
  `}function He(e,n,s){const t=e.currentMedications||[],c=e.genes||[];return`
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${a(s.myMedsTitle)}</h2>
        <p class="m-sec-sub">${a(s.myMedsSub)}</p>
      </div>
      ${t.length===0?`<div class="m-empty">${a(s.noMeds)}</div>`:`<div class="m-medlist">
            ${t.map(o=>{const i=_e(o.name,c),l=o.source==="hospital-record"?s.sourceHospital:s.sourcePatient;return`
                <div>
                  <div>
                    <b>${a(A(o.name,n))}</b>
                    ${o.mock?`<span class="m-mock">${a(s.demo)}</span>`:""}
                    <br>
                    <small>${a(l)}</small>
                  </div>
                  <span class="m-status ${i?"m-status--info":"m-status--none"}">
                    <svg aria-hidden="true"><use href="#${i?"i-info":"i-none"}"/></svg>
                    <span>${a(i?s.changesGene:s.noGeneImpact)}</span>
                  </span>
                </div>
              `}).join("")}
          </div>`}
    </section>
  `}function Fe(e,n){const s=e.qrResult,t=!!(e.devMode&&e.qrPlaintext);return`
    <section class="m-qr-card" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${a(n.qrTitle)}</h3>
          <p class="m-sec-sub">${a(n.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${a(t?n.qrPlainBadge:n.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${s?s.svg:`<p class="m-sec-sub">${a(n.qrPinPrompt)}</p>`}
      </div>
      ${e.caregiverMode?'<div class="m-qr-controls">':`
      <div class="m-qr-controls">
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-input">${a(n.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${a(e.qrPin)}" data-action="qr-pin">
        </div>
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-confirm">${a(n.qrPinConfirmLabel)}</label>
          <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${a(e.qrPinConfirm)}" data-action="qr-pin-confirm">
        </div>
      </div>
      <div class="m-qr-emergency">
        <label class="m-switch"><input type="checkbox" role="switch" data-action="qr-emergency-toggle" ${e.qrEmergencyOn?"checked":""}><span>${a(n.qrEmergencyToggle)}</span></label>
        ${e.qrEmergencyOn?`
          <div class="m-field">
            <label for="qr-emergency-input">${a(n.qrEmergencyLabel)}</label>
            <input id="qr-emergency-input" class="m-input" type="text" maxlength="120" value="${a(e.qrEmergency)}" data-action="qr-emergency">
            <p class="m-qr-honesty">${a(n.qrEmergencyHint)}</p>
          </div>`:""}
      </div>
      ${e.qrPinError?`<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${a(e.qrPinError)}</span></div>`:""}
      <div class="m-qr-controls">
        <button type="button" class="m-btn" data-action="issue-card">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${a(e.qrIssued>0?n.qrReissueBtn:n.qrIssueBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--secondary" data-action="decode-qr" ${s?"":"disabled"}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${a(n.qrVerifyBtn)}</span>
        </button>`}
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${a(n.openScannerBtn)}</span>
        </a>
        ${e.caregiverMode?"":`
          <button type="button" class="m-btn m-btn--secondary" data-action="caregiver-toggle">
            ${a(n.caregiverOpenBtn)}
          </button>
          <button type="button" class="m-btn m-btn--quiet" data-action="caregiver-copy">
            ${a(e.caregiverCopied?n.caregiverCopied:n.caregiverCopyBtn)}
          </button>
        `}
        ${!e.caregiverMode&&e.devMode?`
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${e.qrPlaintext}">
            ${a(n.qrPlaintextToggle)}
          </button>
        `:""}
      </div>
      ${e.devMode&&s?`
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${s.rawBytes} B → deflate ${s.compressedBytes} B → envelope ${s.envelopeBytes} B · ${s.modules}×${s.modules} · EC ${s.errorCorrectionLevel}</p>
      `:""}
      <p class="m-qr-honesty" data-testid="qr-brute-honesty">${a(n.qrPinBrute)}</p>
      ${e.qrIssued>0?`<p class="m-qr-honesty">${a(n.qrReissueNote)}</p>`:""}
      ${e.qrDecodeError?`<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${a(n.qrDecodedFail)}</span></div>`:""}
      ${e.qrDecoded?`
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${a(n.qrDecodedOk)}</strong>
          <pre class="m-data">${a(JSON.stringify(e.qrDecoded,null,2))}</pre>
        </div>
      `:""}
    </section>
  `}function Ge(e,n,s,t){const c=e.genes||[],o=e.currentMedications||[];return`
    <section class="m-stack" aria-labelledby="doc-heading">
      <div>
        <h2 class="m-sec-title" id="doc-heading">${a(s.doctorTitle)}</h2>
        <p class="m-sec-sub">${a(s.doctorSub)}</p>
      </div>
      ${Fe(t,s)}
      <div class="m-doctor-sheet m-chartpaper">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${a(s.doctorPatientId)}</small>
            <span class="m-data">${a(e.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${a(s.doctorOrigin)}</small>
            <span>${a(s.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${a(s.myMedsTitle)}</small>
            <span>${o.length?o.map(i=>a(i.name)).join(", "):"—"}</span>
          </div>
        </div>
        ${c.map(i=>{var d,h,$,v;const l=((d=i.callability)==null?void 0:d.method)==="not-assessed",u=re(i),y=G(i).filter(b=>b.status!=="none"),m=i.coverage||{},w=l?((h=i.callability)==null?void 0:h.reason)||s.notAssessedBody:m.definingPositionsTotal>0?`${m.definingPositionsAssayed}/${m.definingPositionsTotal} positions; untested: ${(m.untestedLocalAlleles||[]).join(", ")||"none"}`:(($=i.callability)==null?void 0:$.source)||"Outside call";return`
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${a(i.gene)}${i.diplotype?` · ${a(i.diplotype)}`:" · Not assessed"}</strong>
                <span class="m-tier"><span class="m-tier__n">T${u.tier}</span> ${a(i.guidelineVersion||"")}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${a(s.doctorColGenetic)}:</strong> ${a(i.phenotype||"Not assessed")}</div>
                <div><strong>${a(s.doctorColEffective)}:</strong> ${a(i.effectivePhenotype||i.phenotype||"Not assessed")}${(v=i.phenoconversion)!=null&&v.applied?` (${a((i.phenoconversion.cause||[]).join(", "))}; ${a(i.phenoconversion.method||"")})`:""}</div>
                <div><strong>${a(s.doctorColCoverage)}:</strong> ${a(w)}</div>
              </div>
              ${y.length>0?`<div class="m-gene__drugs">
                    ${y.map(b=>{var z;return`
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${a(b.drug)}</span>
                        <span class="m-status m-status--${b.status}">
                          <svg aria-hidden="true"><use href="#${j(b.status)}"/></svg>
                          <span>${a(O(b.status,s))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${a(b.recommendation)}${b.alternatives.length?` <strong>${a(s.betterMatch)} ${a(b.alternatives.join(", "))}</strong>`:""} <span class="m-data">(${a(((z=b.guideline)==null?void 0:z.pub)||"CPIC")})</span></p>
                    `}).join("")}
                  </div>`:`<p class="m-coverage__line">${a(l?s.notAssessedBody:s.doctorNoDrugs)}</p>`}
            </div>
          `}).join("")}
        <p class="m-doctor-foot">${a(s.doctorFooter)}</p>
      </div>
    </section>
  `}function Ue(e,n,s){var m,w,d,h,$;const t=e.gene?`<span class="m-data">${a(e.gene)}</span>`:"";if(e.reasonType==="no-cpic-guideline")return`<p class="m-answer__body">${a(s.otcNoGuidelineBody)}</p>`;if(e.reasonType==="not-assessed")return`<p class="m-answer__body">${s.otcNotAssessedBody(t)}</p>`;if(e.reasonType==="gene-not-in-profile")return`<p class="m-answer__body">${s.otcMissingGeneBody(t)}</p>`;const c=e.effectivePhenotype||"Indeterminate",o=((m=S[n])==null?void 0:m[c])||c;let i="";e.status==="stop"?i=s.otcStopGuidelineBody(t,a(o)):e.status==="ask"?i=s.otcAskGuidelineBody(t,a(o)):i=s.otcNormalGuidelineBody(t,a(o));const l=(w=e.phenoconversion)!=null&&w.applied?`<p class="m-gene__because">${s.phenoconversionLine(a(((d=S[n])==null?void 0:d[e.geneticPhenotype])||e.geneticPhenotype),a(o),a((e.phenoconversion.cause||[]).map(v=>A(v,n)).join(", ")))}</p>`:"",u=((h=e.alternatives)==null?void 0:h.length)>0?`<div class="m-better">
        <svg aria-hidden="true"><use href="#i-match"/></svg>
        <span>${a(s.betterMatch)} <strong>${a(e.alternatives.map(v=>A(v,n)).join(" / "))}</strong> — ${a(s.askYourDoctor)} <span dir="ltr">(${a((($=e.guideline)==null?void 0:$.pub)||"CPIC")})</span></span>
      </div>`:"",y=e.guideline?`<p class="m-coverage__line">${a(e.guideline.name)} · ${a(e.guideline.pub)} (CPIC)</p>`:"";return`<p class="m-answer__body">${i}</p>${l}${u}${y}`}function H(e,n,s){const t=I[s]||I.ar,c=String(e||"").trim();if(!c)return`<div class="m-empty">${a(t.otcIdle)}</div>`;const o=Be(c,n);if(!o||o.status==="unknown")return`
      <div class="m-answer m-answer--ask" data-testid="otc-answer" data-otc-status="unknown">
        <p class="m-answer__title">
          <svg aria-hidden="true"><use href="#i-ask"/></svg>
          <span>${a(t.otcNotFoundTitle)}</span>
        </p>
        <p class="m-answer__body">${a(t.otcNotFoundBody(c))}</p>
      </div>
    `;const i=s==="ar"?"، ":", ",l=s==="ar"?o.product.brandAr:o.product.brandEn,u=(o.product.ingredients||[]).map(d=>A(d,s)).join(i),y=[...o.details].sort((d,h)=>{const $={stop:2,ask:1,none:0};return($[h.status]??0)-($[d.status]??0)}),m=y.filter(d=>d.status===o.status),w=m.length>0?m:y.slice(0,1);return`
    <div class="m-answer m-answer--${o.status}" data-testid="otc-answer" data-otc-status="${o.status}">
      <p class="m-answer__title">
        <svg aria-hidden="true"><use href="#${j(o.status)}"/></svg>
        <span>${a(O(o.status,t))}</span>
      </p>
      <p class="m-otc-match">
        <strong>${a(t.otcMatchedLabel)}</strong> ${a(l)}
        <span class="m-mock">${a(t.demo)}</span>
        · <span>${a(t.otcIngredientLabel)} ${a(u)}</span>
        ${o.matchType==="fuzzy"?`<span class="m-otc-fuzzy">(${a(t.otcFuzzyNote)})</span>`:""}
      </p>
      ${w.map(d=>Ue(d,s,t)).join("")}
    </div>
  `}function je(e,n,s,t){const c=n==="ar"?["أوميبرازول","باراسيتامول","إيبوبروفين","سولبادين"]:["omeprazole","paracetamol","ibuprofen","Solpadeine"];return`
    <section class="m-stack" aria-labelledby="otc-heading">
      <div>
        <h2 class="m-sec-title" id="otc-heading">${a(s.otcTitle)}</h2>
        <p class="m-sec-sub">${a(s.otcSub)}</p>
      </div>
      <div class="m-panel m-otc-box">
        <div class="m-field">
          <label for="otc-input">${a(s.otcLabel)}</label>
          <div class="m-otc-inputrow">
            <input id="otc-input" class="m-input" type="search" autocomplete="off" placeholder="${a(s.otcPlaceholder)}" value="${a(t.otcQuery)}" data-action="otc-query">
            <button type="button" class="m-btn m-btn--secondary" data-action="otc-clear">${a(s.otcClearBtn)}</button>
          </div>
        </div>
        <div class="m-otc-examples" role="group" aria-label="${a(s.otcExamplesLabel)}">
          <span class="m-otc-examples__label">${a(s.otcExamplesLabel)}</span>
          ${c.map(o=>`
            <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="otc-pick" data-query="${a(o)}">${a(o)}</button>
          `).join("")}
        </div>
      </div>
      <div id="otc-result" role="status" aria-live="polite">
        ${H(t.otcQuery,e,n)}
      </div>
      <p class="m-coverage__line">${a(s.otcOfflineNote)}</p>
    </section>
  `}function Qe(e,n){return`
    <nav class="m-tabs m-tabs--fixed" aria-label="Passport navigation">
      ${[{id:"genes",icon:"i-genes",label:n.tabGenes},{id:"meds",icon:"i-pill",label:n.tabMeds},{id:"otc",icon:"i-search",label:n.tabOtc},{id:"doctor",icon:"i-qr",label:n.tabDoctor}].map(t=>`
        <button type="button" data-action="tab" data-tab="${t.id}" aria-current="${e===t.id?"page":"false"}">
          <svg aria-hidden="true"><use href="#${t.icon}"/></svg>
          <span>${a(t.label)}</span>
        </button>
      `).join("")}
    </nav>
  `}function Ve(e,n){const s=I[n.lang]||I.ar;let t="";n.error?t=`<div class="m-empty">${a(n.error)}</div>`:n.contract?n.tab==="meds"?t=He(n.contract,n.lang,s):n.tab==="otc"?t=je(n.contract,n.lang,s,n):n.tab==="doctor"?t=Ge(n.contract,n.lang,s,n):t=Oe(n.contract,n.lang,s,n):t='<div class="m-empty">...</div>',e.innerHTML=`
    <div class="m-app">
      ${Ye(n,s)}
      <main id="main-content">${t}</main>
    </div>
    ${Qe(n.tab,s)}
  `}const L=document.getElementById("app"),T=new URLSearchParams(window.location.search);function pe(e){try{return window.localStorage.getItem(e)}catch{return null}}function ue(e,n){try{window.localStorage.setItem(e,n)}catch{}}const ee=T.get("lang")==="en"?"en":T.get("lang")==="ar"?"ar":pe("meyar:lang")==="en"?"en":"ar",We=T.has("elder")?T.get("elder")==="on":pe("meyar:elder")==="on",r={lang:ee,elder:We,caregiverMode:T.get("mode")==="caregiver",caregiverCopied:!1,tab:["genes","meds","otc","doctor"].includes(T.get("tab"))?T.get("tab"):"genes",otcQuery:T.get("q")||"",patientId:T.get("patient")||"demo-001",devMode:T.get("dev")==="1",speechAvailable:U(ee),speakingIndex:null,qrPin:"",qrPinConfirm:"",qrPinError:"",qrEmergencyOn:!1,qrEmergency:"",qrIssued:0,qrPlaintext:!1,qrResult:null,qrDecoded:null,qrDecodeError:!1,contract:null,error:null};function F(){try{const e=new URL(window.location.href);r.caregiverMode?e.searchParams.set("mode","caregiver"):e.searchParams.delete("mode"),e.searchParams.set("patient",r.patientId),e.searchParams.set("lang",r.lang),e.searchParams.set("elder",r.elder?"on":"off"),window.history.replaceState(null,"",e.toString())}catch{}}function Je(){const e=new URL(window.location.href);return e.searchParams.set("patient",r.patientId),e.searchParams.set("mode","caregiver"),e.searchParams.set("lang",r.lang),e.searchParams.set("elder",r.elder?"on":"off"),e.toString()}let se=0;async function Q(){if(!r.contract){r.qrResult=null;return}const e=r.devMode&&r.qrPlaintext;if(!e&&!te(r.qrPin)){r.qrResult=null;return}const n=++se,s=await Ce(r.contract,{pin:r.qrPin,plaintext:e,getDrugsFn:G,emergency:r.qrEmergencyOn?r.qrEmergency:""});if(n!==se)return;const t=qe(s.qrText,{ariaLabel:"Meyar Medication Passport encrypted QR"});r.qrResult={...s,...t},r.qrIssued+=1,f()}async function me(e){r.patientId=e,r.error=null,r.qrResult=null,r.qrDecoded=null,r.qrDecodeError=!1;try{const n=await fetch(`/demo/${encodeURIComponent(e)}.contract.json`);if(!n.ok)throw new Error(`HTTP ${n.status}`);r.contract=await n.json()}catch{r.contract=null,r.error=r.lang==="ar"?`تعذّر تحميل الملف التجريبي (${e}).`:`Could not load demo profile (${e}).`}f(),Q()}function f(){r.speechAvailable=U(r.lang),we(r.lang),$e(r.elder),Ve(L,r),Pe(L)}L.addEventListener("change",e=>{const n=e.target.closest('input[data-action="elder"]');n&&(r.elder=!!n.checked,ue("meyar:elder",r.elder?"on":"off"),F(),f())});L.addEventListener("input",e=>{const n=e.target;if(n.dataset.action==="otc-query"){r.otcQuery=n.value;const s=document.getElementById("otc-result");s&&(s.innerHTML=H(r.otcQuery,r.contract,r.lang));return}if(!r.caregiverMode)if(n.dataset.action==="qr-pin"||n.dataset.action==="qr-pin-confirm"){const s=ve(n.value).replace(/[^0-9]/g,"").slice(0,6);s!==n.value&&(n.value=s),n.dataset.action==="qr-pin"?r.qrPin=s:r.qrPinConfirm=s}else n.dataset.action==="qr-emergency"&&(r.qrEmergency=n.value)});L.addEventListener("change",e=>{e.target.dataset.action==="qr-emergency-toggle"&&(r.qrEmergencyOn=e.target.checked,f())});async function Ke(){const e=I[r.lang]||I.ar;r.qrDecoded=null,r.qrDecodeError=!1,te(r.qrPin)?r.qrPin!==r.qrPinConfirm?r.qrPinError=e.qrPinErrMatch:(r.qrPinError="",await Q()):r.qrPinError=e.qrPinErrSix,f()}L.addEventListener("click",async e=>{var t;const n=e.target.closest("[data-action]");if(!n)return;const s=n.dataset.action;if(s==="lang")r.lang=r.lang==="ar"?"en":"ar",ue("meyar:lang",r.lang),"speechSynthesis"in window&&window.speechSynthesis.cancel(),r.speakingIndex=null,F(),f();else if(s==="otc-pick"){r.otcQuery=n.dataset.query||"";const c=document.getElementById("otc-input"),o=document.getElementById("otc-result");c&&(c.value=r.otcQuery),o&&(o.innerHTML=H(r.otcQuery,r.contract,r.lang)),c==null||c.focus()}else if(s==="otc-clear"){r.otcQuery="";const c=document.getElementById("otc-input"),o=document.getElementById("otc-result");c&&(c.value=""),o&&(o.innerHTML=H("",r.contract,r.lang)),c==null||c.focus()}else if(s==="tab")r.tab=n.dataset.tab,r.caregiverCopied=!1,f(),window.scrollTo({top:0});else if(s==="patient"&&!r.caregiverMode)me(n.dataset.patient);else if(s==="caregiver-toggle")r.caregiverMode=!r.caregiverMode,r.caregiverCopied=!1,F(),f();else if(s==="caregiver-copy"){const c=Je();try{(t=navigator.clipboard)!=null&&t.writeText&&await navigator.clipboard.writeText(c),r.caregiverCopied=!0}catch{r.caregiverCopied=!1}f()}else if(s==="toggle-plaintext"&&!r.caregiverMode)r.qrPlaintext=!r.qrPlaintext,r.qrDecoded=null,r.qrDecodeError=!1,Q();else if(s==="decode-qr"&&r.qrResult){r.qrDecodeError=!1;try{r.qrDecoded=await ke(r.qrResult.qrText,{pin:r.qrPin,allowPlaintext:r.devMode})}catch{r.qrDecoded=null,r.qrDecodeError=!0}f()}else if(s==="issue-card")Ke();else if(s==="speak"&&"speechSynthesis"in window){const c=Number(n.dataset.geneIndex);if(r.speakingIndex===c){window.speechSynthesis.cancel(),r.speakingIndex=null,f();return}window.speechSynthesis.cancel();const o=de(window.speechSynthesis.getVoices(),r.lang);if(!o){r.speechAvailable=!1,r.speakingIndex=null,f();return}const i=new SpeechSynthesisUtterance(n.dataset.speak||"");i.voice=o,i.lang=o.lang,r.speakingIndex=c,i.onend=()=>{r.speakingIndex===c&&(r.speakingIndex=null,f())},i.onerror=()=>{r.speakingIndex===c&&(r.speakingIndex=null,f())},window.speechSynthesis.speak(i),f()}});"speechSynthesis"in window&&typeof window.speechSynthesis.addEventListener=="function"&&window.speechSynthesis.addEventListener("voiceschanged",()=>{const e=U(r.lang);e!==r.speechAvailable&&(r.speechAvailable=e,f())});be();"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});me(r.patientId);
