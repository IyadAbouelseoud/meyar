import{c as te,s as ae,P as re,a as I,d as A,C as D,f as fe,b as W,g as ve,e as ye,n as be,i as $e,h as we,j as Pe,k as Ce,l as ie,m as qe,r as _e,o as ke}from"./index-Cxy6rBWi.js";const ze=te.rows||[],Ae=ae.rows||[];function oe(s){var o,c;const n=(o=s.coverage)==null?void 0:o.saudiDataTier,e=Ae.find(d=>d.gene===s.gene),a=n??(e?e.saudiDataTier:2),i=((c=s.coverage)==null?void 0:c.saudiDataNote)||(e==null?void 0:e.saudiDataNote)||(a===2?"Tier 2: no published Saudi frequency (Goljan et al. 2022)":"");return{tier:a,note:i,coverageStatement:ae._coverageStatement}}function ce(s){const n=(s.recommendation||"").toLowerCase();return Array.isArray(s.alternatives)&&s.alternatives.length>0||/\b(avoid|contraindicated|alternative|do not use)\b/.test(n)?"stop":/\b(reduce|adjust|lower|caution|monitor|consider|50%|25%)\b/.test(n)?"ask":"none"}function de(s,n){var o,c;const e=(o=n==null?void 0:n.phenoconversion)!=null&&o.applied?(c=n==null?void 0:n.phenoconversion)==null?void 0:c.adjustedActivityScore:null,a=e!=null?new Set([String(e),e.toFixed(1)]):null;let i=null;for(const d of s)i?(a&&a.has(String(d.activityScore))||i.population&&/pediatric/i.test(i.population)&&!/pediatric/i.test(d.population||"")||d.population==="general"&&i.population!=="general"||d.population==="CVI ACS PCI"&&i.population!=="general")&&(i=d):i=d;return i}function F(s){var i;if(((i=s.callability)==null?void 0:i.method)==="not-assessed")return[];const n=s.effectivePhenotype||s.phenotype;if(!n||/indeterminate|not assessed/i.test(n))return[];const e=ze.filter(o=>o.gene===s.gene&&o.phenotype===n),a=new Map;for(const o of e)a.has(o.drug)||a.set(o.drug,[]),a.get(o.drug).push(o);return Array.from(a.values()).map(o=>{const c=de(o,s);return{drug:c.drug,rxnorm:c.rxnorm,status:ce(c),implication:c.implication,recommendation:c.recommendation,classification:c.classification,alternatives:Array.isArray(c.alternatives)?c.alternatives.map(d=>typeof d=="string"?d:d==null?void 0:d.drug).filter(Boolean):[],guideline:c.guideline||null}})}function Ee(s,n){const e=String(s||"").toLowerCase();return n.some(a=>{var i;return((i=a.phenoconversion)==null?void 0:i.applied)&&Array.isArray(a.phenoconversion.cause)&&a.phenoconversion.cause.some(o=>o.toLowerCase()===e)})}const xe=[{id:"paracetamol",brandEn:"Paracetamol",brandAr:"باراسيتامول",aliasesEn:["paracetamol","acetaminophen","apap"],aliasesAr:["باراسيتامول","اسيتامينوفين","أسيتامينوفين"],ingredients:["paracetamol"],otc:!0,source:"WHO INN / standard generic active ingredient (no CPIC gene-drug guideline)",mock:!0},{id:"panadol",brandEn:"Panadol",brandAr:"بنادول",aliasesEn:["panadol","panadol advance","panadol extra"],aliasesAr:["بنادول","بانادول","بنادول أدفانس","بنادول إكسترا"],ingredients:["paracetamol"],otc:!0,source:"Mock OTC catalog entry; standard paracetamol brand composition",mock:!0},{id:"fevadol",brandEn:"Fevadol",brandAr:"فيفادول",aliasesEn:["fevadol"],aliasesAr:["فيفادول","فيڤادول"],ingredients:["paracetamol"],otc:!0,source:"Mock OTC catalog entry; standard paracetamol brand composition",mock:!0},{id:"adol",brandEn:"Adol",brandAr:"أدول",aliasesEn:["adol","tylenol"],aliasesAr:["أدول","ادول","تايلينول"],ingredients:["paracetamol"],otc:!0,source:"Mock OTC catalog entry; standard paracetamol brand composition",mock:!0},{id:"panadol-night",brandEn:"Panadol Night",brandAr:"بنادول نايت",aliasesEn:["panadol night","diphenhydramine"],aliasesAr:["بنادول نايت","بانادول نايت","ديفينهيدرامين"],ingredients:["paracetamol","diphenhydramine"],otc:!0,source:"Mock OTC catalog entry; paracetamol + diphenhydramine (no CPIC guideline)",mock:!0},{id:"omeprazole",brandEn:"Omeprazole",brandAr:"أوميبرازول",aliasesEn:["omeprazole","losec","risek","gasec","omez"],aliasesAr:["أوميبرازول","اوميبرازول","لوسيك","ريسيك","جاسيك","أوميز"],ingredients:["omeprazole"],otc:!0,source:"CPIC CYP2C19/PPI guideline drug (Lima JJ et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"lansoprazole",brandEn:"Lansoprazole",brandAr:"لانسوبرازول",aliasesEn:["lansoprazole","lanzor","takepron"],aliasesAr:["لانسوبرازول","لانزور"],ingredients:["lansoprazole"],otc:!0,source:"CPIC CYP2C19/PPI guideline drug (Lima JJ et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"pantoprazole",brandEn:"Pantoprazole",brandAr:"بانتوبرازول",aliasesEn:["pantoprazole","controloc","pantozol"],aliasesAr:["بانتوبرازول","كونترولوك","بانتوزول"],ingredients:["pantoprazole"],otc:!0,source:"CPIC CYP2C19/PPI guideline drug (Lima JJ et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"ibuprofen",brandEn:"Ibuprofen",brandAr:"إيبوبروفين",aliasesEn:["ibuprofen","brufen","advil","nurofen","sapofen"],aliasesAr:["إيبوبروفين","ايبوبروفين","بروفين","أدفيل","ادفيل","نوروفين","سابوفين"],ingredients:["ibuprofen"],otc:!0,source:"CPIC CYP2C9/NSAIDs guideline drug (Theken KN et al., Clin Pharmacol Ther 2020); mock brand aliases",mock:!0},{id:"solpadeine",brandEn:"Solpadeine (paracetamol + codeine)",brandAr:"سولبادين (باراسيتامول + كودايين)",aliasesEn:["solpadeine","solpadol"],aliasesAr:["سولبادين","سولبادول"],ingredients:["paracetamol","codeine"],otc:!0,source:"CPIC CYP2D6/Opioids guideline drug codeine (Crews KR et al., Clin Pharmacol Ther 2021); mock combination product entry",mock:!0},{id:"panadeine",brandEn:"Panadeine (paracetamol + codeine)",brandAr:"بنادين (باراسيتامول + كودايين)",aliasesEn:["panadeine","co-codamol","cocodamol"],aliasesAr:["بنادين","بانادين","كو-كودامول"],ingredients:["paracetamol","codeine"],otc:!0,source:"CPIC CYP2D6/Opioids guideline drug codeine (Crews KR et al., Clin Pharmacol Ther 2021); mock combination product entry",mock:!0},{id:"codeine",brandEn:"Codeine",brandAr:"كودايين",aliasesEn:["codeine"],aliasesAr:["كودايين","كودين"],ingredients:["codeine"],otc:!1,source:"CPIC CYP2D6/Opioids guideline drug (Crews KR et al., Clin Pharmacol Ther 2021)",mock:!0},{id:"cetirizine",brandEn:"Zyrtec (Cetirizine)",brandAr:"زيرتك (سيتريزين)",aliasesEn:["zyrtec","cetirizine","artiz"],aliasesAr:["زيرتك","سيتريزين","أرتيز"],ingredients:["cetirizine"],otc:!0,source:"Mock OTC catalog entry; standard cetirizine brand composition (no CPIC guideline)",mock:!0},{id:"loratadine",brandEn:"Claritine (Loratadine)",brandAr:"كلاريتين (لوراتادين)",aliasesEn:["claritine","claritin","loratadine","lorinase"],aliasesAr:["كلاريتين","لوراتادين","لورينيز"],ingredients:["loratadine"],otc:!0,source:"Mock OTC catalog entry; standard loratadine brand composition (no CPIC guideline)",mock:!0},{id:"aspirin",brandEn:"Aspirin",brandAr:"أسبرين",aliasesEn:["aspirin","acetylsalicylic acid","jusprin"],aliasesAr:["أسبرين","اسبرين","جوسبرين"],ingredients:["aspirin"],otc:!0,source:"Mock OTC catalog entry; WHO INN acetylsalicylic acid (no CPIC gene-drug guideline row)",mock:!0},{id:"naproxen",brandEn:"Naproxen",brandAr:"نابروكسين",aliasesEn:["naproxen","aleve","proxen","naprosyn"],aliasesAr:["نابروكسين","بروكسين","نابروسين"],ingredients:["naproxen"],otc:!0,source:"Mock OTC catalog entry; WHO INN naproxen (no CPIC gene-drug guideline row)",mock:!0}],Te={rows:xe},Se=[{drug:"bupropion",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluoxetine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"paroxetine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"quinidine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"terbinafine",enzyme:"CYP2D6",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"abiraterone",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cinacalcet",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"duloxetine",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"lorcaserin",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"mirabegron",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"rolapitant",enzyme:"CYP2D6",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"amiodarone",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"celecoxib",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cimetidine",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"clobazam",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cobicistat",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"escitalopram",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluvoxamine",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"labetalol",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"sertraline",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"vemurafenib",enzyme:"CYP2D6",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluconazole",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluoxetine",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"fluvoxamine",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"ticlopidine",enzyme:"CYP2C19",strength:"strong",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"cenobamate",enzyme:"CYP2C19",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"felbamate",enzyme:"CYP2C19",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"voriconazole",enzyme:"CYP2C19",strength:"moderate",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"omeprazole",enzyme:"CYP2C19",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"},{drug:"pirtobrutinib",enzyme:"CYP2C19",strength:"weak",source:"https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems",accessed:"2026-11-22"}],Ie={rows:Se},le=Te.rows||[],Le=te.rows||[],De=Ie.rows||[],J={none:0,ask:1,stop:2};function pe(s){let n=String(s||"").trim().toLowerCase();return n?(n=n.replace(/[\u064B-\u065F\u0670\u0640]/g,""),n=n.replace(/[أإآٱ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ڤ/g,"ف"),n=n.replace(/[^\p{L}\p{N}]+/gu," ").trim(),n=n.split(/\s+/).map(e=>e.startsWith("ال")&&e.length>=4?e.slice(2):e).join(" "),n):""}function K(s,n){if(s===n)return 0;const e=s.length,a=n.length;if(e===0)return a;if(a===0)return e;let i=Array.from({length:a+1},(o,c)=>c);for(let o=1;o<=e;o+=1){const c=[o];for(let d=1;d<=a;d+=1){const u=s[o-1]===n[d-1]?0:1;c[d]=Math.min(i[d]+1,c[d-1]+1,i[d-1]+u)}i=c}return i[a]}function X(s){return s<=3?0:s<=5?1:2}function Me(s){const n=[s.brandEn,s.brandAr,...s.aliasesEn||[],...s.aliasesAr||[],...s.ingredients||[]].filter(Boolean),e=new Set,a=[];for(const i of n){const o=pe(i);o&&!e.has(o)&&(e.add(o),a.push(o))}return a}function Be(s,n=le){const e=pe(s);if(!e)return null;let a=null;for(const i of n){const o=Me(i);for(const c of o){let d=null;if(c===e)d={product:i,matchType:"exact",score:0};else if(e.length>=3&&(c.startsWith(e)||c.split(" ").some(u=>u.startsWith(e))))d={product:i,matchType:"prefix",score:.5+(c.length-e.length)*.01};else if(e.length>=4){const u=K(e,c),h=X(Math.max(e.length,c.length));if(u<=h)d={product:i,matchType:"fuzzy",score:u+1};else for(const m of c.split(" ")){if(m.length<4)continue;const y=K(e,m),p=X(Math.max(e.length,m.length));if(y<=p){const v=y+1.2;(!d||v<d.score)&&(d={product:i,matchType:"fuzzy",score:v})}}}d&&(!a||d.score<a.score)&&(a=d)}}return a}function Ye(s,n,e={}){var $,f,L,H,B;const a=String(s||"").trim();if(!a)return null;const i=e.products||le,o=e.cpicRows||Le,c=e.inhibitors||De,d=e.currentMedications||(n==null?void 0:n.currentMedications)||[],u=Be(a,i);if(!u)return{status:"unknown",query:a,product:null,matchType:null,details:[],inhibitorHits:[]};const{product:h,matchType:m}=u,y=(n==null?void 0:n.genes)||[],p=[],v=[];let P="none";const b=q=>{(J[q]??0)>(J[P]??0)&&(P=q)};for(const q of h.ingredients||[]){const Y=String(q).toLowerCase(),x=o.filter(_=>String(_.drug||"").toLowerCase()===Y);if(x.length===0)p.push({ingredient:q,gene:null,status:"none",reasonType:"no-cpic-guideline",recommendation:null,alternatives:[],guideline:null});else{const _=[...new Set(x.map(k=>k.gene))];for(const k of _){const w=y.find(z=>z.gene===k);if(!w){b("ask"),p.push({ingredient:q,gene:k,status:"ask",reasonType:"gene-not-in-profile",recommendation:null,alternatives:[],guideline:(($=x[0])==null?void 0:$.guideline)||null});continue}if(((f=w.callability)==null?void 0:f.method)==="not-assessed"){b("ask"),p.push({ingredient:q,gene:k,status:"ask",reasonType:"not-assessed",callability:w.callability,recommendation:null,alternatives:[],guideline:((L=x[0])==null?void 0:L.guideline)||null});continue}const E=w.effectivePhenotype||w.phenotype;if(!E||/indeterminate|not assessed/i.test(E)){b("ask"),p.push({ingredient:q,gene:k,status:"ask",reasonType:"indeterminate",geneticPhenotype:w.phenotype||null,effectivePhenotype:E||null,recommendation:null,alternatives:[],guideline:((H=x[0])==null?void 0:H.guideline)||null});continue}const g=x.filter(z=>z.phenotype===E),T=de(g,w);if(!T){b("ask"),p.push({ingredient:q,gene:k,status:"ask",reasonType:"no-phenotype-row",geneticPhenotype:w.phenotype,effectivePhenotype:E,phenoconversion:w.phenoconversion||null,recommendation:null,alternatives:[],guideline:((B=x[0])==null?void 0:B.guideline)||null});continue}const R=ce(T);b(R),p.push({ingredient:q,gene:k,status:R,reasonType:"cpic-match",geneticPhenotype:w.phenotype,effectivePhenotype:E,phenoconversion:w.phenoconversion||null,implication:T.implication,recommendation:T.recommendation,classification:T.classification,alternatives:Array.isArray(T.alternatives)?T.alternatives.map(z=>typeof z=="string"?z:(z==null?void 0:z.drug)||(z==null?void 0:z.drugClass)).filter(Boolean):[],guideline:T.guideline||null})}}const N=c.filter(_=>String(_.drug||"").toLowerCase()===Y&&(_.strength==="strong"||_.strength==="moderate"));if(N.length>0&&d.length>0)for(const _ of N){const k=d.filter(w=>{const E=String(w.name||"").toLowerCase();return o.some(g=>String(g.drug||"").toLowerCase()===E&&g.gene===_.enzyme)});k.length>0&&(b("ask"),v.push({ingredient:q,enzyme:_.enzyme,strength:_.strength,affectedMedications:k.map(w=>w.name)}))}}return{status:P,query:a,product:h,matchType:m,details:p,inhibitorHits:v}}function l(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Ne(s=new Date){const n=String(s.getFullYear()).padStart(4,"0"),e=String(s.getMonth()+1).padStart(2,"0"),a=String(s.getDate()).padStart(2,"0");return`${n}${e}${a}`}function Re(s=new Date){return`MEYAR<<PGX<ENV<V1<<ISSUED<${Ne(s)}<<<<<<<`}function He({qrSvg:s,lang:n="ar",t:e,date:a=new Date}){const i=Re(a),o=n==="ar",c=o?"rtl":"ltr",d=o?`<span class="m-id1__brand">${l(e.brand)}</span><span class="m-id1__sub">${l(e.passportTitle)}</span>`:`<span class="m-id1__brand">${l(e.brand)} <span class="m-id1__brand-pair" dir="rtl">${l(e.brandEn)}</span></span><span class="m-id1__sub">${l(e.passportTitle)}</span>`,u=o?`${l(e.id1PinAr)}<br><span class="m-id1__pin-pair" dir="ltr">${l(e.id1PinEn)}</span>`:`${l(e.id1PinEn)}<br><span class="m-id1__pin-pair" dir="rtl">${l(e.id1PinAr)}</span>`,h=o?`${l(e.id1ProtoAr)}<br><span dir="ltr">${l(e.id1ProtoEn)}</span>`:`${l(e.id1ProtoEn)}<br><span dir="rtl">${l(e.id1ProtoAr)}</span>`;return`
    <div class="m-id1" dir="${c}" lang="${l(n)}" data-testid="id1-card">
      <div class="m-id1__left">
        ${d}
        <span class="m-id1__pin">${u}</span>
        <span class="m-id1__proto">${h}</span>
      </div>
      <div class="m-id1__qr">${s}</div>
      <div class="m-id1__mrz" dir="ltr">${l(i)}</div>
      <div class="m-qatt" aria-hidden="true"></div>
    </div>
  `}function Oe(s,n="ar",e){const a=n==="ar"?"، ":", ";return((s==null?void 0:s.genes)||[]).map(i=>{var p,v,P,b,$;if(((p=i.callability)==null?void 0:p.method)==="not-assessed")return{gene:i.gene,notAssessed:!0,plainLine:`${e.notAssessedTitle} — ${e.notAssessedBody}`,phenoconversionLine:"",stopItems:[],askItems:[]};const c=i.effectivePhenotype||i.phenotype,d=((v=re[n])==null?void 0:v[c])||c||"",u=(P=i.phenoconversion)!=null&&P.applied?e.phenoconversionLine(l(((b=I[n])==null?void 0:b[i.phenotype])||i.phenotype),l((($=I[n])==null?void 0:$[i.effectivePhenotype])||i.effectivePhenotype),l((i.phenoconversion.cause||[]).map(f=>A(f,n)).join(a))):"",h=F(i),m=h.filter(f=>f.status==="stop").map(f=>({drug:A(f.drug,n),alternatives:f.alternatives.map(L=>A(L,n))})),y=h.filter(f=>f.status==="ask").map(f=>A(f.drug,n));return{gene:i.gene,notAssessed:!1,plainLine:d,phenoconversionLine:u,stopItems:m,askItems:y}})}function je({contract:s,lang:n="ar",t:e}){const a=n==="ar"?"rtl":"ltr",i=n==="ar"?"، ":", ",c=Oe(s,n,e).map(d=>{const u=d.stopItems.length>0?`<p class="m-a6__line m-a6__line--stop">
          <svg aria-hidden="true"><use href="#i-stop"/></svg>
          <span><strong>${l(e.statusStop)}:</strong> ${d.stopItems.map(m=>{const y=m.alternatives.length?` (${l(e.betterMatch)} ${l(m.alternatives.join(" / "))})`:"";return`${l(m.drug)}${y}`}).join(i)}</span>
        </p>`:"",h=d.askItems.length>0?`<p class="m-a6__line m-a6__line--ask">
          <svg aria-hidden="true"><use href="#i-ask"/></svg>
          <span><strong>${l(e.statusAsk)}:</strong> ${l(d.askItems.join(i))}</span>
        </p>`:"";return`
      <div class="m-a6__gene">
        <p class="m-a6__summary">
          <strong class="m-data">${l(d.gene)}</strong>: ${l(d.plainLine)}
        </p>
        ${d.phenoconversionLine?`<p class="m-a6__shift">${d.phenoconversionLine}</p>`:""}
        ${u}
        ${h}
      </div>
    `}).join("");return`
    <div class="m-a6" dir="${a}" lang="${l(n)}" data-testid="a6-foldout">
      <div class="m-a6__head">
        <p class="m-a6__title">${l(e.passportTitle)}</p>
        <span class="m-a6__brand">${l(e.brand)}</span>
      </div>
      <hr class="m-rule m-a6__rule">
      <div class="m-a6__body">
        ${c}
      </div>
      <p class="m-a6__reminder">${l(e.foldoutReminder)}</p>
      <p class="m-a6__foot">${l(e.proto)} · ${l(e.demo)}</p>
    </div>
  `}function ue(s,n="ar"){if(!Array.isArray(s)||s.length===0)return null;const e=a=>String((a==null?void 0:a.lang)||"").toLowerCase().replace("_","-");return n==="ar"?s.find(a=>e(a)==="ar-sa"||e(a).startsWith("ar-sa-"))||null:s.find(a=>e(a)==="en-us"||e(a)==="en-gb")||s.find(a=>e(a).startsWith("en-"))||s.find(a=>e(a)==="en")||null}function U(s="ar",n=typeof window<"u"?window.speechSynthesis:null){return!n||typeof n.getVoices!="function"?!1:ue(n.getVoices(),s)!==null}function Z({gene:s,plainSentence:n,phenoconversionLine:e,drugs:a=[],lang:i="ar"}){const o=[];s!=null&&s.gene&&o.push(s.gene),n&&o.push(n),e&&o.push(e);for(const c of a)c.label&&c.statusLabel&&o.push(i==="ar"?`${c.label}: ${c.statusLabel}`:`${c.label}: ${c.statusLabel}`);return o.join(". ")}function t(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Q(s){return s==="stop"?"i-stop":s==="ask"?"i-ask":"i-none"}function O(s,n){return s==="stop"?n.statusStop:s==="ask"?n.statusAsk:n.statusNone}function Fe(s,n){const e=["demo-001","demo-002","demo-006"];return`
    <header class="m-topbar m-noprint">
      <div class="m-topbar__honesty">
        <span class="m-proto">${t(n.proto)}</span>
        <span class="m-mock">${t(n.demo)}</span>
      </div>
      <div class="m-topbar__controls">
        ${s.caregiverMode?"":`
          <div class="m-seg" role="group" aria-label="${t(n.patientLabel)}">
            ${e.map(a=>`
              <button type="button" data-action="patient" data-patient="${a}" aria-pressed="${s.patientId===a}">
                <span class="m-data">${a}</span>
              </button>
            `).join("")}
          </div>
        `}
        <label class="m-switch">
          <input type="checkbox" data-action="elder" ${s.elder?"checked":""} aria-label="${t(n.elderOff)}">
          <span>${t(n.elderOff)}</span>
        </label>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="lang">
          ${t(n.langToggle)}
        </button>
      </div>
    </header>
    ${s.caregiverMode?`
      <div class="m-caregiver-bar m-noprint" role="status" data-testid="caregiver-banner">
        <div class="m-caregiver-bar__info">
          <span class="m-status m-status--info">
            <svg aria-hidden="true"><use href="#i-info"/></svg>
            <span>${t(n.caregiverBadge)}</span>
          </span>
          <p class="m-sec-sub">${t(n.caregiverNote)}</p>
        </div>
        <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="caregiver-toggle">
          ${t(n.caregiverExitBtn)}
        </button>
      </div>
    `:""}
  `}function Ge(s){return`
    <section class="m-cover" aria-labelledby="cover-title">
      <div>
        <span class="m-eyebrow m-cover__kicker">${t(s.brand)} · <span class="m-data">${t(s.brandEn)}</span></span>
        <h1 class="m-cover__title" id="cover-title">${t(s.passportTitle)}</h1>
        <p class="m-cover__sub">${t(s.coverSub)}</p>
      </div>
      <button type="button" class="m-btn m-cover__cta" data-action="tab" data-tab="doctor">
        <svg aria-hidden="true"><use href="#i-qr"/></svg>
        <span>${t(s.showDoctorBtn)}</span>
      </button>
      <div class="m-qatt m-qatt--thin" aria-hidden="true"></div>
    </section>
  `}function ee(s,n,e,a){const i=e.speakingIndex===n;return e.speechAvailable?`
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${n}" data-speak="${t(s)}" aria-pressed="${i}">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${t(i?a.stopReading:a.readAloud)}</span>
      </button>
    `:`
    <span class="m-speak-tooltip" title="${t(a.readAloudUnavailable)}" data-tooltip="${t(a.readAloudUnavailable)}" tabindex="0" role="note" aria-label="${t(a.readAloudUnavailable)}">
      <button type="button" class="m-btn m-btn--quiet" data-action="speak" data-gene-index="${n}" hidden aria-hidden="true" tabindex="-1">
        <svg aria-hidden="true"><use href="#i-speak"/></svg>
        <span>${t(a.readAloud)}</span>
      </button>
      <svg aria-hidden="true"><use href="#i-info"/></svg>
      <span>${t(a.readAloudUnavailableShort)}</span>
    </span>
  `}function Ue(s,n,e,a,i){var B,q,Y,x,N,_,k,w,E;const o=((B=s.callability)==null?void 0:B.method)==="not-assessed",c=oe(s),d=s.effectivePhenotype||s.phenotype,u=`gene-h-${n}`,h=`
    <span class="m-tier" title="${t(c.note)}">
      <span class="m-tier__n">${fe(c.tier,e)}</span>
      <span>${t(a.tierLabel(c.tier))}</span>
    </span>
  `;if(o){const g=Z({gene:s,plainSentence:`${a.notAssessedTitle}. ${a.notAssessedBody}`,lang:e});return`
      <article class="m-gene" aria-labelledby="${u}">
        <div class="m-gene__head">
          <span class="m-gene__name m-data">${t(s.gene)} · VCF</span>
          <div class="m-gene__actions">
            ${h}
            ${ee(g,n,i,a)}
          </div>
        </div>
        <p class="m-gene__plain" id="${u}">${t(a.notAssessedTitle)}</p>
        ${W(s,e,ve(s,e))}
        <p class="m-coverage__line">${t(a.notAssessedBody)}</p>
      </article>
    `}const m=((q=re[e])==null?void 0:q[d])||d||"",y=F(s),p=y.filter(g=>g.status==="stop"||g.status==="ask"),v=p.length>0?p:y.slice(0,3),P=(Y=s.phenoconversion)!=null&&Y.applied?a.phenoconversionLine(((x=I[e])==null?void 0:x[s.phenotype])||s.phenotype,((N=I[e])==null?void 0:N[s.effectivePhenotype])||s.effectivePhenotype,(s.phenoconversion.cause||[]).map(g=>A(g,e)).join(", ")).replace(/<[^>]+>/g,""):"",b=(_=s.phenoconversion)!=null&&_.applied?`<p class="m-gene__because">${a.phenoconversionLine(t(((k=I[e])==null?void 0:k[s.phenotype])||s.phenotype),t(((w=I[e])==null?void 0:w[s.effectivePhenotype])||s.effectivePhenotype),t((s.phenoconversion.cause||[]).map(g=>A(g,e)).join(", ")))}</p>`:"",$=v.length>0?`<div class="m-gene__drugs">
        ${v.map(g=>{var R;const T=g.alternatives.length>0?`<div class="m-better">
                <svg aria-hidden="true"><use href="#i-match"/></svg>
                <span>${t(a.betterMatch)} <strong>${t(g.alternatives.map(z=>A(z,e)).join(" / "))}</strong> — ${t(a.askYourDoctor)} (${t(((R=g.guideline)==null?void 0:R.pub)||"CPIC")})</span>
              </div>`:"";return`
            <div class="m-drugrow">
              <span class="m-drugrow__name">${t(A(g.drug,e))}</span>
              <span class="m-status m-status--${g.status}">
                <svg aria-hidden="true"><use href="#${Q(g.status)}"/></svg>
                <span>${t(O(g.status,a))}</span>
              </span>
            </div>
            ${T}
          `}).join("")}
      </div>`:"",f=s.coverage||{},L=f.definingPositionsTotal>0?`<div class="m-coverage">
        ${ye(f)}
        <p class="m-coverage__line">${a.coverageLine(f.definingPositionsAssayed,f.definingPositionsTotal,f.untestedLocalAlleles)}</p>
      </div>`:((E=s.callability)==null?void 0:E.method)==="outside-call"?`<p class="m-coverage__line">${t(a.outsideCallNote)}</p>`:"",H=Z({gene:s,plainSentence:m,phenoconversionLine:P,drugs:v.map(g=>({label:A(g.drug,e),statusLabel:O(g.status,a)})),lang:e});return`
    <article class="m-gene" aria-labelledby="${u}">
      <div class="m-gene__head">
        <span class="m-gene__name m-data">${t(s.gene)}${s.diplotype?` · ${t(s.diplotype)}`:""}</span>
        <div class="m-gene__actions">
          ${h}
          ${ee(H,n,i,a)}
        </div>
      </div>
      <p class="m-gene__plain" id="${u}">${t(m)}</p>
      ${W(s,e)}
      ${b}
      ${$}
      ${L}
    </article>
  `}function Qe(s,n,e,a){return`
    ${Ge(e)}
    <section class="m-stack" aria-labelledby="genes-heading">
      <div>
        <h2 class="m-sec-title" id="genes-heading">${t(e.myGenesTitle)}</h2>
        <p class="m-sec-sub">${t(e.myGenesSub)}</p>
      </div>
      ${(s.genes||[]).map((i,o)=>Ue(i,o,n,e,a)).join("")}
    </section>
  `}function Ve(s,n,e){const a=s.currentMedications||[],i=s.genes||[];return`
    <section class="m-stack" aria-labelledby="meds-heading">
      <div>
        <h2 class="m-sec-title" id="meds-heading">${t(e.myMedsTitle)}</h2>
        <p class="m-sec-sub">${t(e.myMedsSub)}</p>
      </div>
      ${a.length===0?`<div class="m-empty">${t(e.noMeds)}</div>`:`<div class="m-medlist">
            ${a.map(o=>{const c=Ee(o.name,i),d=o.source==="hospital-record"?e.sourceHospital:e.sourcePatient;return`
                <div>
                  <div>
                    <b>${t(A(o.name,n))}</b>
                    ${o.mock?`<span class="m-mock">${t(e.demo)}</span>`:""}
                    <br>
                    <small>${t(d)}</small>
                  </div>
                  <span class="m-status ${c?"m-status--info":"m-status--none"}">
                    <svg aria-hidden="true"><use href="#${c?"i-info":"i-none"}"/></svg>
                    <span>${t(c?e.changesGene:e.noGeneImpact)}</span>
                  </span>
                </div>
              `}).join("")}
          </div>`}
    </section>
  `}function We(s,n){const e=s.qrResult,a=!!(s.devMode&&s.qrPlaintext);return`
    <section class="m-qr-card m-noprint" aria-labelledby="qr-heading">
      <div class="m-qr-card__head">
        <div>
          <h3 class="m-qr-card__title" id="qr-heading">${t(n.qrTitle)}</h3>
          <p class="m-sec-sub">${t(n.qrSub)}</p>
        </div>
        <span class="m-status m-status--info">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${t(a?n.qrPlainBadge:n.qrEncryptedBadge)}</span>
        </span>
      </div>
      <div class="m-qr-box" data-testid="qr-svg-box">
        ${e?e.svg:`<p class="m-sec-sub">${t(n.qrPinPrompt)}</p>`}
      </div>
      ${s.caregiverMode?'<div class="m-qr-controls">':`
      <div class="m-qr-controls">
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-input">${t(n.qrPinLabel)}</label>
          <input id="qr-pin-input" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${t(s.qrPin)}" data-action="qr-pin">
        </div>
        <div class="m-qr-pin-field m-field">
          <label for="qr-pin-confirm">${t(n.qrPinConfirmLabel)}</label>
          <input id="qr-pin-confirm" class="m-input m-qr-pin-input m-data" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" value="${t(s.qrPinConfirm)}" data-action="qr-pin-confirm">
        </div>
      </div>
      <div class="m-qr-emergency">
        <label class="m-switch"><input type="checkbox" role="switch" data-action="qr-emergency-toggle" ${s.qrEmergencyOn?"checked":""}><span>${t(n.qrEmergencyToggle)}</span></label>
        ${s.qrEmergencyOn?`
          <div class="m-field">
            <label for="qr-emergency-input">${t(n.qrEmergencyLabel)}</label>
            <input id="qr-emergency-input" class="m-input" type="text" maxlength="120" value="${t(s.qrEmergency)}" data-action="qr-emergency">
            <p class="m-qr-honesty">${t(n.qrEmergencyHint)}</p>
          </div>`:""}
      </div>
      ${s.qrPinError?`<div class="m-status m-status--stop" role="alert"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${t(s.qrPinError)}</span></div>`:""}
      <div class="m-qr-controls">
        <button type="button" class="m-btn${e&&e.encrypted?" m-btn--secondary":""}" data-action="issue-card">
          <svg aria-hidden="true"><use href="#i-lock"/></svg>
          <span>${t(s.qrIssued>0?n.qrReissueBtn:n.qrIssueBtn)}</span>
        </button>
        <button type="button" class="m-btn m-btn--secondary" data-action="decode-qr" ${e?"":"disabled"}>
          <svg aria-hidden="true"><use href="#i-qr"/></svg>
          <span>${t(n.qrVerifyBtn)}</span>
        </button>`}
        <a class="m-btn m-btn--secondary" href="/scan.html">
          <span>${t(n.openScannerBtn)}</span>
        </a>
        ${s.caregiverMode?"":`
          <button type="button" class="m-btn m-btn--secondary" data-action="caregiver-toggle">
            ${t(n.caregiverOpenBtn)}
          </button>
          <button type="button" class="m-btn m-btn--quiet" data-action="caregiver-copy">
            ${t(s.caregiverCopied?n.caregiverCopied:n.caregiverCopyBtn)}
          </button>
        `}
        ${!s.caregiverMode&&s.devMode?`
          <button type="button" class="m-btn m-btn--secondary" data-action="toggle-plaintext" aria-pressed="${s.qrPlaintext}">
            ${t(n.qrPlaintextToggle)}
          </button>
        `:""}
      </div>
      ${s.devMode&&e?`
        <p class="m-data m-qr-honesty" data-testid="qr-metrics">raw ${e.rawBytes} B → deflate ${e.compressedBytes} B → envelope ${e.envelopeBytes} B · ${e.modules}×${e.modules} · EC ${e.errorCorrectionLevel}</p>
      `:""}
      <p class="m-qr-honesty" data-testid="qr-brute-honesty">${t(n.qrPinBrute)}</p>
      ${s.qrIssued>0?`<p class="m-qr-honesty">${t(n.qrReissueNote)}</p>`:""}
      ${s.qrDecodeError?`<div class="m-status m-status--stop"><svg aria-hidden="true"><use href="#i-stop"/></svg><span>${t(n.qrDecodedFail)}</span></div>`:""}
      ${s.qrDecoded?`
        <div class="m-qr-decoded" data-testid="qr-decoded-output">
          <strong>${t(n.qrDecodedOk)}</strong>
          <pre class="m-data">${t(JSON.stringify(s.qrDecoded,null,2))}</pre>
        </div>
      `:""}
    </section>
  `}function Je(s,n,e){const a=n.qrResult,i=!!(a&&a.encrypted);return`
    <section class="m-print-panel" aria-labelledby="print-heading" data-testid="print-section">
      <div class="m-print-panel__head m-noprint">
        <h3 class="m-qr-card__title" id="print-heading">${t(e.printTitle)}</h3>
        <p class="m-sec-sub">${t(e.printSub)}</p>
      </div>
      ${i?`
        <div class="m-print-controls m-noprint">
          <button type="button" class="m-btn" data-action="print-id1">${t(e.printId1Btn)}</button>
          <button type="button" class="m-btn m-btn--secondary" data-action="print-a6">${t(e.printA6Btn)}</button>
          <button type="button" class="m-btn m-btn--secondary" data-action="print-both">${t(e.printBothBtn)}</button>
        </div>
        <div class="m-print-sheets">
          <figure class="m-print-sheet m-print-sheet--id1">
            ${He({qrSvg:a.svg,lang:n.lang,t:e})}
            <figcaption class="m-print-caption m-noprint">${t(e.printId1Caption)}</figcaption>
          </figure>
          <figure class="m-print-sheet m-print-sheet--a6">
            ${je({contract:s,lang:n.lang,t:e})}
            <figcaption class="m-print-caption m-noprint">${t(e.printA6Caption)}</figcaption>
          </figure>
        </div>
      `:`
        <div class="m-empty m-noprint" data-testid="print-requires-pin">${t(e.printRequiresPin)}</div>
      `}
    </section>
  `}function Ke(s,n,e,a){const i=s.genes||[],o=s.currentMedications||[];return`
    <section class="m-stack" aria-labelledby="doc-heading">
      <div class="m-doctor-head m-noprint">
        <h2 class="m-sec-title" id="doc-heading">${t(e.doctorTitle)}</h2>
        <p class="m-sec-sub">${t(e.doctorSub)}</p>
      </div>
      ${We(a,e)}
      ${Je(s,a,e)}
      <div class="m-doctor-sheet m-chartpaper m-noprint">
        <div class="m-doctor-meta">
          <div class="m-doctor-meta__item">
            <small>${t(e.doctorPatientId)}</small>
            <span class="m-data">${t(s.patientId)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${t(e.doctorOrigin)}</small>
            <span>${t(e.doctorOriginGermline)}</span>
          </div>
          <div class="m-doctor-meta__item">
            <small>${t(e.myMedsTitle)}</small>
            <span>${o.length?o.map(c=>t(c.name)).join(", "):"—"}</span>
          </div>
        </div>
        ${i.map(c=>{var p,v,P,b;const d=((p=c.callability)==null?void 0:p.method)==="not-assessed",u=oe(c),h=F(c).filter($=>$.status!=="none"),m=c.coverage||{},y=d?((v=c.callability)==null?void 0:v.reason)||e.notAssessedBody:m.definingPositionsTotal>0?`${m.definingPositionsAssayed}/${m.definingPositionsTotal} positions; untested: ${(m.untestedLocalAlleles||[]).join(", ")||"none"}`:((P=c.callability)==null?void 0:P.source)||"Outside call";return`
            <div class="m-doctor-row">
              <div class="m-doctor-row__head">
                <strong class="m-data">${t(c.gene)}${c.diplotype?` · ${t(c.diplotype)}`:" · Not assessed"}</strong>
                <span class="m-tier"><span class="m-tier__n">T${u.tier}</span> ${t(c.guidelineVersion||"")}</span>
              </div>
              <div class="m-doctor-row__grid">
                <div><strong>${t(e.doctorColGenetic)}:</strong> ${t(c.phenotype||"Not assessed")}</div>
                <div><strong>${t(e.doctorColEffective)}:</strong> ${t(c.effectivePhenotype||c.phenotype||"Not assessed")}${(b=c.phenoconversion)!=null&&b.applied?` (${t((c.phenoconversion.cause||[]).join(", "))}; ${t(c.phenoconversion.method||"")})`:""}</div>
                <div><strong>${t(e.doctorColCoverage)}:</strong> ${t(y)}</div>
              </div>
              ${h.length>0?`<div class="m-gene__drugs">
                    ${h.map($=>{var f;return`
                      <div class="m-drugrow">
                        <span class="m-drugrow__name">${t($.drug)}</span>
                        <span class="m-status m-status--${$.status}">
                          <svg aria-hidden="true"><use href="#${Q($.status)}"/></svg>
                          <span>${t(O($.status,e))}</span>
                        </span>
                      </div>
                      <p class="m-coverage__line">${t($.recommendation)}${$.alternatives.length?` <strong>${t(e.betterMatch)} ${t($.alternatives.join(", "))}</strong>`:""} <span class="m-data">(${t(((f=$.guideline)==null?void 0:f.pub)||"CPIC")})</span></p>
                    `}).join("")}
                  </div>`:`<p class="m-coverage__line">${t(d?e.notAssessedBody:e.doctorNoDrugs)}</p>`}
            </div>
          `}).join("")}
        <p class="m-doctor-foot">${t(e.doctorFooter)}</p>
      </div>
    </section>
  `}function Xe(s,n,e){var m,y,p,v,P;const a=s.gene?`<span class="m-data">${t(s.gene)}</span>`:"";if(s.reasonType==="no-cpic-guideline")return`<p class="m-answer__body">${t(e.otcNoGuidelineBody)}</p>`;if(s.reasonType==="not-assessed")return`<p class="m-answer__body">${e.otcNotAssessedBody(a)}</p>`;if(s.reasonType==="gene-not-in-profile")return`<p class="m-answer__body">${e.otcMissingGeneBody(a)}</p>`;const i=s.effectivePhenotype||"Indeterminate",o=((m=I[n])==null?void 0:m[i])||i;let c="";s.status==="stop"?c=e.otcStopGuidelineBody(a,t(o)):s.status==="ask"?c=e.otcAskGuidelineBody(a,t(o)):c=e.otcNormalGuidelineBody(a,t(o));const d=(y=s.phenoconversion)!=null&&y.applied?`<p class="m-gene__because">${e.phenoconversionLine(t(((p=I[n])==null?void 0:p[s.geneticPhenotype])||s.geneticPhenotype),t(o),t((s.phenoconversion.cause||[]).map(b=>A(b,n)).join(", ")))}</p>`:"",u=((v=s.alternatives)==null?void 0:v.length)>0?`<div class="m-better">
        <svg aria-hidden="true"><use href="#i-match"/></svg>
        <span>${t(e.betterMatch)} <strong>${t(s.alternatives.map(b=>A(b,n)).join(" / "))}</strong> — ${t(e.askYourDoctor)} <span dir="ltr">(${t(((P=s.guideline)==null?void 0:P.pub)||"CPIC")})</span></span>
      </div>`:"",h=s.guideline?`<p class="m-coverage__line">${t(s.guideline.name)} · ${t(s.guideline.pub)} (CPIC)</p>`:"";return`<p class="m-answer__body">${c}</p>${d}${u}${h}`}function j(s,n,e){const a=D[e]||D.ar,i=String(s||"").trim();if(!i)return`<div class="m-empty">${t(a.otcIdle)}</div>`;const o=Ye(i,n);if(!o||o.status==="unknown")return`
      <div class="m-answer m-answer--ask" data-testid="otc-answer" data-otc-status="unknown">
        <p class="m-answer__title">
          <svg aria-hidden="true"><use href="#i-ask"/></svg>
          <span>${t(a.otcNotFoundTitle)}</span>
        </p>
        <p class="m-answer__body">${t(a.otcNotFoundBody(i))}</p>
      </div>
    `;const c=e==="ar"?"، ":", ",d=e==="ar"?o.product.brandAr:o.product.brandEn,u=(o.product.ingredients||[]).map(p=>A(p,e)).join(c),h=[...o.details].sort((p,v)=>{const P={stop:2,ask:1,none:0};return(P[v.status]??0)-(P[p.status]??0)}),m=h.filter(p=>p.status===o.status),y=m.length>0?m:h.slice(0,1);return`
    <div class="m-answer m-answer--${o.status}" data-testid="otc-answer" data-otc-status="${o.status}">
      <p class="m-answer__title">
        <svg aria-hidden="true"><use href="#${Q(o.status)}"/></svg>
        <span>${t(O(o.status,a))}</span>
      </p>
      <p class="m-otc-match">
        <strong>${t(a.otcMatchedLabel)}</strong> ${t(d)}
        <span class="m-mock">${t(a.demo)}</span>
        · <span>${t(a.otcIngredientLabel)} ${t(u)}</span>
        ${o.matchType==="fuzzy"?`<span class="m-otc-fuzzy">(${t(a.otcFuzzyNote)})</span>`:""}
      </p>
      ${y.map(p=>Xe(p,e,a)).join("")}
    </div>
  `}function Ze(s,n,e,a){const i=n==="ar"?["أوميبرازول","باراسيتامول","إيبوبروفين","سولبادين"]:["omeprazole","paracetamol","ibuprofen","Solpadeine"];return`
    <section class="m-stack" aria-labelledby="otc-heading">
      <div>
        <h2 class="m-sec-title" id="otc-heading">${t(e.otcTitle)}</h2>
        <p class="m-sec-sub">${t(e.otcSub)}</p>
      </div>
      <div class="m-panel m-otc-box">
        <div class="m-field">
          <label for="otc-input">${t(e.otcLabel)}</label>
          <div class="m-otc-inputrow">
            <input id="otc-input" class="m-input" type="search" autocomplete="off" placeholder="${t(e.otcPlaceholder)}" value="${t(a.otcQuery)}" data-action="otc-query">
            <button type="button" class="m-btn m-btn--secondary" data-action="otc-clear">${t(e.otcClearBtn)}</button>
          </div>
        </div>
        <div class="m-otc-examples" role="group" aria-label="${t(e.otcExamplesLabel)}">
          <span class="m-otc-examples__label">${t(e.otcExamplesLabel)}</span>
          ${i.map(o=>`
            <button type="button" class="m-btn m-btn--secondary m-ctrl-btn" data-action="otc-pick" data-query="${t(o)}">${t(o)}</button>
          `).join("")}
        </div>
      </div>
      <div id="otc-result" role="status" aria-live="polite">
        ${j(a.otcQuery,s,n)}
      </div>
      <p class="m-coverage__line">${t(e.otcOfflineNote)}</p>
    </section>
  `}function es(s,n){return`
    <nav class="m-tabs m-tabs--fixed m-noprint" aria-label="Passport navigation">
      ${[{id:"genes",icon:"i-genes",label:n.tabGenes},{id:"meds",icon:"i-pill",label:n.tabMeds},{id:"otc",icon:"i-search",label:n.tabOtc},{id:"doctor",icon:"i-qr",label:n.tabDoctor}].map(a=>`
        <button type="button" data-action="tab" data-tab="${a.id}" aria-current="${s===a.id?"page":"false"}">
          <svg aria-hidden="true"><use href="#${a.icon}"/></svg>
          <span>${t(a.label)}</span>
        </button>
      `).join("")}
    </nav>
  `}function ss(s,n){const e=D[n.lang]||D.ar;let a="";n.error?a=`<div class="m-empty">${t(n.error)}</div>`:n.contract?n.tab==="meds"?a=Ve(n.contract,n.lang,e):n.tab==="otc"?a=Ze(n.contract,n.lang,e,n):n.tab==="doctor"?a=Ke(n.contract,n.lang,e,n):a=Qe(n.contract,n.lang,e,n):a='<div class="m-empty">...</div>',s.innerHTML=`
    <div class="m-app">
      ${Fe(n,e)}
      <main id="main-content">${a}</main>
    </div>
    ${es(n.tab,e)}
  `}const M=document.getElementById("app"),S=new URLSearchParams(window.location.search);function me(s){try{return window.localStorage.getItem(s)}catch{return null}}function ge(s,n){try{window.localStorage.setItem(s,n)}catch{}}const se=S.get("lang")==="en"?"en":S.get("lang")==="ar"?"ar":me("meyar:lang")==="en"?"en":"ar",ns=S.has("elder")?S.get("elder")==="on":me("meyar:elder")==="on",r={lang:se,elder:ns,caregiverMode:S.get("mode")==="caregiver",caregiverCopied:!1,tab:["genes","meds","otc","doctor"].includes(S.get("tab"))?S.get("tab"):"genes",otcQuery:S.get("q")||"",patientId:S.get("patient")||"demo-001",devMode:S.get("dev")==="1",speechAvailable:U(se),speakingIndex:null,qrPin:"",qrPinConfirm:"",qrPinError:"",qrEmergencyOn:!1,qrEmergency:"",qrIssued:0,qrPlaintext:!1,qrResult:null,qrDecoded:null,qrDecodeError:!1,contract:null,error:null};function G(){try{const s=new URL(window.location.href);r.caregiverMode?s.searchParams.set("mode","caregiver"):s.searchParams.delete("mode"),s.searchParams.set("patient",r.patientId),s.searchParams.set("lang",r.lang),s.searchParams.set("elder",r.elder?"on":"off"),window.history.replaceState(null,"",s.toString())}catch{}}function ts(){const s=new URL(window.location.href);return s.searchParams.set("patient",r.patientId),s.searchParams.set("mode","caregiver"),s.searchParams.set("lang",r.lang),s.searchParams.set("elder",r.elder?"on":"off"),s.toString()}let ne=0;async function V(){if(!r.contract){r.qrResult=null;return}const s=r.devMode&&r.qrPlaintext;if(!s&&!ie(r.qrPin)){r.qrResult=null;return}const n=++ne,e=await qe(r.contract,{pin:r.qrPin,plaintext:s,getDrugsFn:F,emergency:r.qrEmergencyOn?r.qrEmergency:""});if(n!==ne)return;const a=_e(e.qrText,{ariaLabel:"Meyar Medication Passport encrypted QR"});r.qrResult={...e,...a},r.qrIssued+=1,C()}async function he(s){r.patientId=s,r.error=null,r.qrResult=null,r.qrDecoded=null,r.qrDecodeError=!1;try{const n=await fetch(`/demo/${encodeURIComponent(s)}.contract.json`);if(!n.ok)throw new Error(`HTTP ${n.status}`);r.contract=await n.json()}catch{r.contract=null,r.error=r.lang==="ar"?`تعذّر تحميل الملف التجريبي (${s}).`:`Could not load demo profile (${s}).`}C(),V()}function C(){r.speechAvailable=U(r.lang),we(r.lang),Pe(r.elder),ss(M,r),Ce(M)}M.addEventListener("change",s=>{const n=s.target.closest('input[data-action="elder"]');n&&(r.elder=!!n.checked,ge("meyar:elder",r.elder?"on":"off"),G(),C())});M.addEventListener("input",s=>{const n=s.target;if(n.dataset.action==="otc-query"){r.otcQuery=n.value;const e=document.getElementById("otc-result");e&&(e.innerHTML=j(r.otcQuery,r.contract,r.lang));return}if(!r.caregiverMode)if(n.dataset.action==="qr-pin"||n.dataset.action==="qr-pin-confirm"){const e=be(n.value).replace(/[^0-9]/g,"").slice(0,6);e!==n.value&&(n.value=e),n.dataset.action==="qr-pin"?r.qrPin=e:r.qrPinConfirm=e}else n.dataset.action==="qr-emergency"&&(r.qrEmergency=n.value)});M.addEventListener("change",s=>{s.target.dataset.action==="qr-emergency-toggle"&&(r.qrEmergencyOn=s.target.checked,C())});async function as(){const s=D[r.lang]||D.ar;r.qrDecoded=null,r.qrDecodeError=!1,ie(r.qrPin)?r.qrPin!==r.qrPinConfirm?r.qrPinError=s.qrPinErrMatch:(r.qrPinError="",await V()):r.qrPinError=s.qrPinErrSix,C()}M.addEventListener("click",async s=>{var a;const n=s.target.closest("[data-action]");if(!n)return;const e=n.dataset.action;if(e==="lang")r.lang=r.lang==="ar"?"en":"ar",ge("meyar:lang",r.lang),"speechSynthesis"in window&&window.speechSynthesis.cancel(),r.speakingIndex=null,G(),C();else if(e==="otc-pick"){r.otcQuery=n.dataset.query||"";const i=document.getElementById("otc-input"),o=document.getElementById("otc-result");i&&(i.value=r.otcQuery),o&&(o.innerHTML=j(r.otcQuery,r.contract,r.lang)),i==null||i.focus()}else if(e==="otc-clear"){r.otcQuery="";const i=document.getElementById("otc-input"),o=document.getElementById("otc-result");i&&(i.value=""),o&&(o.innerHTML=j("",r.contract,r.lang)),i==null||i.focus()}else if(e==="tab")r.tab=n.dataset.tab,r.caregiverCopied=!1,C(),window.scrollTo({top:0});else if(e==="patient"&&!r.caregiverMode)he(n.dataset.patient);else if(e==="caregiver-toggle")r.caregiverMode=!r.caregiverMode,r.caregiverCopied=!1,G(),C();else if(e==="caregiver-copy"){const i=ts();try{(a=navigator.clipboard)!=null&&a.writeText&&await navigator.clipboard.writeText(i),r.caregiverCopied=!0}catch{r.caregiverCopied=!1}C()}else if(e==="toggle-plaintext"&&!r.caregiverMode)r.qrPlaintext=!r.qrPlaintext,r.qrDecoded=null,r.qrDecodeError=!1,V();else if(e==="decode-qr"&&r.qrResult){r.qrDecodeError=!1;try{r.qrDecoded=await ke(r.qrResult.qrText,{pin:r.qrPin,allowPlaintext:r.devMode})}catch{r.qrDecoded=null,r.qrDecodeError=!0}C()}else if(e==="issue-card")as();else if(e==="print-id1"||e==="print-a6"||e==="print-both"){if(!r.qrResult||!r.qrResult.encrypted)return;const i=e==="print-id1"?"id1":e==="print-a6"?"a6":"both";document.body.dataset.print=i,document.documentElement.dataset.print=i,window.print()}else if(e==="speak"&&"speechSynthesis"in window){const i=Number(n.dataset.geneIndex);if(r.speakingIndex===i){window.speechSynthesis.cancel(),r.speakingIndex=null,C();return}window.speechSynthesis.cancel();const o=ue(window.speechSynthesis.getVoices(),r.lang);if(!o){r.speechAvailable=!1,r.speakingIndex=null,C();return}const c=new SpeechSynthesisUtterance(n.dataset.speak||"");c.voice=o,c.lang=o.lang,r.speakingIndex=i,c.onend=()=>{r.speakingIndex===i&&(r.speakingIndex=null,C())},c.onerror=()=>{r.speakingIndex===i&&(r.speakingIndex=null,C())},window.speechSynthesis.speak(c),C()}});"speechSynthesis"in window&&typeof window.speechSynthesis.addEventListener=="function"&&window.speechSynthesis.addEventListener("voiceschanged",()=>{const s=U(r.lang);s!==r.speechAvailable&&(r.speechAvailable=s,C())});$e();window.addEventListener("afterprint",()=>{delete document.body.dataset.print,delete document.documentElement.dataset.print});"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});he(r.patientId);
