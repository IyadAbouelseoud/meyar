# FINAL review pass — Meyar repo (build complete)

**Paste into:** Claude Code, model Opus 5.5, opened on the `meyar` repo with every build task merged. This is the LAST pass before the 25 Nov 2026 submission. Unlike earlier runs, this pass FIXES what it finds (see constraints). Use high effort.

---

<role>You are a senior reviewer and finisher combining five lenses: clinical pharmacogenomics accuracy, software correctness, mobile-first front-end and visual polish, evidence verification for the research report, and hackathon-submission readiness. The build is finished. Find every remaining defect, fix it, prove the fix, and leave a verified evidence trail the team can use to finalise the research paper.</role>

<context>
## Context (carry forward — locked decisions, do not change)
- Product: Meyar (مِعيار), "The right dose, the first time" (الجرعة الصحيحة من أول مرة). KKU Health Innovation Hackathon, track Predictive Healthcare, deadline 25 Nov 2026. Team of 3. Research prototype, not for clinical use; synthetic and GeT-RM reference data only, no patient data.
- Architecture: genotype source (lab, regional array, chain-of-custody saliva kit) → germline-only gate (A6) → PharmCAT 3.4.0 in Docker, batch, once → FHIR phenotype store (HAPI, Genomics Reporting IG) → A5 coverage flag (separate arithmetic step, NEVER inside PharmCAT) → two outputs: CDS Hooks 2.0.1 order-sign card (non-interruptive, with backward sweep) and the Arabic Medication Passport (offline, PIN-encrypted QR that encodes the payload itself, not a URL).
- Repo `meyar/`: engine/, cds/, passport/, kit/, hardware/, tables/ (shared, ONE OWNER PER FILE), docs/, prompts/. Ports are fixed: HAPI 8080, CDS service 3000, CDS Hooks sandbox 8081, passport 5173. Pinned: pgkb/pharmcat:3.4.0, hapiproject/hapi:v8.12.0-2, bcftools 1.24, Node 22 LTS, Python 3.12.
- Do NOT install: Java (PharmCAT runs in Docker), Kubernetes, any database server, React Native.
- Read `AGENTS.md` first; it holds every settled rule and wins over this prompt. Background research digest: `docs/research/README.md`.
- MOCK DATA: the demo and presentation run on mock data only (synthetic patients, GeT-RM samples, mock medicine and current-medication lists, each `"mock": true`). Unverified regulations (SFDA, PDPL, NPHIES) are NOT blockers: note them as a future deployment step and keep building. Mock data never licenses an invented sourced number.
- New features (locked): A7 phenoconversion — current medicines that inhibit CYP2D6 shift the effective phenotype (activity score ×0.5 moderate, ×0 strong; inhibitor strength only from tables/cyp_inhibitors.json); B6/C9 better-matched alternatives — shown only when the CPIC row in tables/cpic_recommendations.json names one, never generated. Both the genetic and the effective phenotype are always shown.

## Data contract (every component reads and writes exactly this shape; schema in docs/data-contract.schema.json)
```json
{
  "patientId": "demo-001",
  "sampleOrigin": "germline",
  "genes": [
    {
      "gene": "CYP2C19",
      "diplotype": "*2/*2",
      "phenotype": "Poor Metabolizer",
      "candidates": [
        "*2/*2"
      ],
      "coverage": {
        "definingPositionsAssayed": 9,
        "definingPositionsTotal": 11,
        "untestedLocalAlleles": [
          "*35"
        ],
        "uninformativeNormalRisk": 0.04
      },
      "guidelineVersion": "CPIC 2022-11"
    }
  ]
}
```

## Verified facts you may rely on
- PharmCAT 3.4.0 (MPL-2.0) is CLI-only, no REST API. Needs GRCh38 with chr prefixes. It treats absent allele-defining positions as no-calls, not reference; the flags that change this are labelled DANGEROUS in its docs and MUST NEVER be used. To pin demo results use its outside-call file, never hand-edited VCFs.
- CDS Hooks 2.0.1: use order-sign (maturity 5); order-select (4) acceptable; medication-prescribe is deprecated.
- Never depend on the public hapi.fhir.org server (regularly purged); use the local container.
- Dosing and recommendations are LOOKED UP from tables/cpic_recommendations.json (hand-built from CPIC/DPWG). A language model never generates dosing.

## Never say or code (killed claims)
- Star-allele callers do not generally use population frequency to resolve ambiguous diplotypes; PharmCAT calls its tie-break "as arbitrary as sorting alphabetically". A5 never re-picks a diplotype from frequency; show all candidates.
- CPIC "Indeterminate" means uncertain allele function, not phase ambiguity.
- Saudi premarital screening does not collect G6PD. Sickle cell trait is not PGx-actionable. Co-trimoxazole is low-to-no risk in the 2022 G6PD update. The 25% G6PD figure is Al-Ahsa, not Aseer.
- No unsourced number in code comments, UI text or docs. If a number has no citation in docs/sources.md, leave it out and flag it.

Tasks that should exist, each with its prompt in prompts/<ID>.md: A1–A8, B1–B6, C1–C9, D1–D5, E1–E3, F1–F6. Confirm the real list with `ls prompts/` and audit every file found.

The research report (`Meyar research report (MLA).docx`, Appendix A) and its validation are in the team's project files, not the repo; Part C below already lists every open item from them.
</context>

<skills>
## Mandatory skills — use them, do not improvise around them
These plugins are installed. Invoke the named skills with the Skill tool at the stated moment. If a skill name differs slightly in your install, run `/help` or list skills and use the closest match; if one is truly missing, say so in the report and continue.

**superpowers** (process discipline, whole run):
- `superpowers:using-superpowers` first, before anything else.
- `superpowers:writing-plans` to turn this prompt into a written plan in `handoff/REVIEW.md` before you touch code; `superpowers:executing-plans` to work through it in batches.
- `superpowers:systematic-debugging` for every bug: reproduce, find root cause, then fix. No guess-fixes.
- `superpowers:test-driven-development` for every code fix: write or extend the failing test first.
- `superpowers:verification-before-completion` before marking ANY item pass or fixed: evidence (command output, screenshot path) or it is not done.
- `superpowers:requesting-code-review` / `superpowers:receiving-code-review` once all fixes are in, on the full diff.
- `superpowers:dispatching-parallel-agents` is allowed for independent read-only sweeps (e.g. claim verification vs. UI screenshots) only.

**frontend-design** and **impeccable** (every visual change):
- Before any CSS, layout, spacing or image change, load `frontend-design` and the impeccable skills (use its audit/critique skill to score each screen, then its polish/normalise/adapt skills to fix; use its responsive/adapt guidance for mobile). Their judgement works INSIDE `design/` (tokens, Meyar Scale, fonts, Al-Qatt band, ANTI-SLOP.md); they never replace the design system or introduce new fonts or colours. Reem Kufi is banned forever.
- Record, per screen, the impeccable score before and after in the report.
</skills>

<known_issues>
## Issues already found in a pre-scan (24 Nov) — confirm each, then fix
1. **Image library barely used.** All 15 Gemini (Nano Banana) photos exist in `design/imagery/` as `img-01..15` in `.webp`, `-640.webp`, `-1920.webp` with prompts in `design/imagery/PROMPTS.md`. The only page that references them is `design/showcase/index.html` (img-02, 04, 05, 06, 07, 15). `passport/`, `kit/web/`, `cds/` and the poster use none. Required: (a) every one of the 15 images is present, decodes, and has all three sizes (re-run `python3 design/imagery/build_webp.py --check` or equivalent; list any missing); (b) place the images where PROMPTS.md intends them across the Passport (landing / about / empty states / onboarding), kit web pages, the clinician/demo pages, the showcase and poster; at minimum IMG-15 hero, IMG-02, IMG-06, IMG-14 on the Passport, IMG-04 and IMG-11 on the kit, IMG-05 on the clinician side, IMG-07/IMG-01 as section imagery; (c) use `<picture>`/`srcset` with the 640 and 1920 variants, explicit `width`/`height` or `aspect-ratio` (no layout shift), `loading="lazy"` below the fold, meaningful bilingual `alt` text; (d) images must be bundled for offline use in the Passport (check the service worker `sw.js` precache) and copied into `passport/dist`; (e) every generated image carries the small label "AI-generated illustration" (EN) / "صورة توضيحية مولَّدة" (AR) where shown, and is never inside clinical content (AGENTS.md §11); (f) no image ever shows a fake phenotype, dose or patient data.
2. **cds/ has zero `@media` rules**; passport/src/app.css has only 3, kit 5. Responsive coverage is thin; treat every page as broken on mobile until proven otherwise.
3. **Spacing / padding / layout bugs reported by the user during testing.** The user saw inconsistent spacing, cramped or missing padding and misaligned blocks. Find them all: any padding/margin/gap not drawn from the `design/tokens.css` spacing scale, hard-coded px spacing, elements touching screen edges, uneven card gutters, inconsistent vertical rhythm between sections, buttons with uneven inner padding, text touching borders, double margins, collapsed margins in RTL, icons misaligned with text baselines, and broken alignment when switching ar↔en. Grep `passport/src/app.css`, `kit/web/*.css`, `design/meyar.css` and inline `style=` for raw px/rem spacing and replace with tokens.
4. **Report is stale vs. the code.** The research report says the QR encoder, PIN encryption, printable card and F3 kit are "specified only / on a branch". `docs/REVIEW.md` (24 Nov) shows C7/C8 built and decoding. Re-verify the current truth and record it for the report (see Part C).
5. `docs/demo/`, `docs/fixtures/`: Appendix A item 36 says only three of six demo contracts are committed (passport/dist/demo has 001, 002, 006). Confirm and fix or document.
</known_issues>

<task>
Work in three parts, in order. Each part ends with its section in the report.

## Part A — Functional audit (keep everything from the earlier review)
For each task ID, read its prompt's "Done when" list and check each box with real evidence: run the command, run the tests, start `docker compose up -d`, curl the endpoints, open the passport. Then run cross-cutting checks 1–18:
1. Data contract: every contract.json and every reader/writer matches docs/data-contract.schema.json.
2. Killed claims: grep code, UI strings, docs and poster text for every item in the "Never say" list.
3. Numbers: every number in UI strings, docs/ and poster text has a row in docs/sources.md with a citation.
4. A5 integrity: no code path changes a diplotype from population frequency; all candidates are shown.
5. Safety: dosing comes only from tables/cpic_recommendations.json; no LLM call produces advice; no DANGEROUS PharmCAT flag.
6. A6: somatic input is rejected (engine AND browser); every Observation carries genomic source class germline.
7. C8: crypto parameters match docs/qr-envelope.md; wrong PIN fails; README states the offline brute-force limit honestly ("stops casual scanning only").
8. Hardware: every render and video frame of hardware carries its status label; nothing not built is shown as built.
9. Ports and versions match the README exactly.
10. Mandatory lines present: "Research prototype — not for clinical use." and "Runs on synthetic and GeT-RM reference data; no patient data was used."
11. AGENTS.md sections 2–11 hold in code and docs; list each violated rule with evidence.
12. Handoffs: every built task has `handoff/<TASK>.md` with Status: DONE and a matching commit (check "Last commit" hashes are real).
13. A7 phenoconversion: `phenotype` never overwritten; CYP2D6 ×0.5 / ×0 exactly; every inhibitor row cites the FDA table; non-CYP2D6 genes flagged, never scored; demo-002 shows Normal → acting Poor (paroxetine) on card and Passport.
14. Alternatives (B6/C9): every alternative traces to an `alternatives` entry with a source; none generated or ranked; patient side says "ask your doctor", never "switch".
15. A8 structural variation: no VCF-derived phenotype for any gene in tables/sv_genes.json; CYP2D6 without outside call shows "not assessed"; mock outside-call files marked mock; docs/structural-variants.md quotes PharmCAT verbatim.
16. A5 Saudi data tiers: every frequency row has tier + citation with n and table number; Tier 2 genes return null with the "no published Saudi frequency" line; no non-Saudi frequency in the score; poster sentence matches `_coverageStatement`.
17. Mock data: every mock record `"mock": true`, UI shows "Demo data", no doc treats an unverified regulation as a blocker or approved.
18. Design system: `node design/build-tokens.mjs --check` passes; no hard-coded hex or font-family outside design/; Meyar Scale for every phenotype, hatched no-marker for not-assessed; axe-core WCAG 2.2 AA on every page; ANTI-SLOP.md score per screen.
Also: run every test suite (`npm --prefix passport test`, cds tests, engine pytest, kit tests) and `bash engine/run_pipeline.sh` on the Docker host so the previously skipped engine tests become real passes. Record exact counts; reconcile the conflicting counts in docs (26, 18, 30, 34, 37 appear) so only reproduced counts remain.

## Part B — Mobile-first visual and layout pass (HIGHEST PRIORITY for the user)
Judges will open the live Netlify Passport (https://stupendous-mooncake-4ac3dc.netlify.app) and the repo on their phones first. Mobile must be flawless everywhere, not "acceptable".

Pages in scope: Passport `index.html` and `scan.html` (every view: gene cards, medicines, OTC quick-check, pharmacist view, PIN entry, print/card preview, elder mode, errors, offline), kit `index/card/tracker/urgent.html`, any cds/ demo page or CDS Hooks card rendering, the B4 dashboard, `design/showcase/`, poster SVG/PNGs.

1. Use Playwright (pre-installed Chromium) to screenshot every page and state at these viewports: **320×568, 360×740, 375×667, 390×844, 412×915, 430×932** (phones, portrait), **844×390 landscape**, 768×1024, 1024×1366, 1440×900. Both `dir="rtl"` (ar) and `dir="ltr"` (en). Elder mode on and off. Also Chrome device emulation for "iPhone SE", "iPhone 14 Pro", "Pixel 7", "Galaxy S9+". Save under `docs/screenshots/final-review/<page>/<viewport>-<lang>-<state>.png` as before/after pairs.
2. Fail any screen with: horizontal scroll at any width (`document.documentElement.scrollWidth > innerWidth`, assert in a test); text clipped or overflowing; tap targets under 44×44 CSS px (48 in elder mode, C5); body text under 16px on mobile; content under notches or home indicator (use `env(safe-area-inset-*)`, viewport-fit=cover is already set on the Passport); `100vh` traps (use `100dvh`/`svh`); sticky headers covering content or anchors; modals that do not scroll or cannot be closed on a short screen; inputs that trigger iOS zoom (font-size < 16px); wrong `inputmode` for the PIN (`numeric`) and search; keyboard covering the active field; tables or genotype strings (IBM Plex Mono) that overflow instead of wrapping or scrolling inside their own container; the Meyar Scale labels colliding at 320px; QR too small or cropped on screen; Arabic and English mixed strings with broken bidi (wrap Latin citations, genotypes `*2/*2`, doses and numbers in `dir="ltr"`/`<bdi>`); images stretched, pixelated or causing layout shift (CLS > 0.1); missing or wrong `<meta name="viewport">` on any HTML page.
3. Spacing and padding: apply the known_issues #3 sweep to every page. One spacing scale, one gutter (≥16px on phones), consistent card padding, consistent section rhythm, mirrored correctly in RTL (use logical properties `margin-inline`, `padding-block`, `inset-inline` instead of left/right).
4. Add real `@media`/container queries where missing (cds and kit first). Mobile-first: base styles for 320px, enhance upward.
5. Add an automated regression test (`passport/test/mobile.spec` or a Playwright script under `tests/mobile/`) that loads each page at 320, 375 and 430 widths in ar and en and asserts: no horizontal overflow, no element wider than the viewport, every button/link ≥44px, no console errors, all images loaded. It must pass at the end.
6. Lighthouse mobile (Chromium at `/opt/pw-browsers/chromium`, `--headless --no-sandbox`) on the Passport: record Performance, Accessibility, Best Practices, SEO before and after. Accessibility must be 100; fix anything below 90 elsewhere.
7. Rebuild `passport/dist`, confirm it is what Netlify should serve, and write in the report the exact files that must be re-uploaded to Netlify (the live site is a static snapshot; do not deploy yourself).

## Part C — Evidence verification for the research report
The paper `Meyar research report (MLA).docx` (copy in the project files; its Appendix A lists 36 open items) cannot be finalised until each item below is either VERIFIED (primary source opened, exact quote + page/table + URL/DOI recorded), CORRECTED (the true value with its source), TESTED (run in this repo, with command and output), or DROPPED (cannot be verified; the report must remove it). Use web search and fetch primary sources (PubMed, PMC, journal pages, DOI resolver, CPIC/ClinPGx with a JavaScript-capable browser, FDA, SFDA, SDAIA, HL7). Never accept a secondary summary as verification. Write results to `docs/report-verification.md` as a table: item #, claim, verdict, evidence, exact replacement sentence for the paper.

### C1. Clinical evidence claims
1. **PREPARE (Swen et al., Lancet 2023;401:347–56).** Read the full text. Settle which analysis is primary; confirm OR 0.70 with CIs for actionable subgroup (21.0% vs 27.7%, CI 0.54–0.91) and whole cohort (21.5% vs 28.6%, CI 0.61–0.79). The "raw ~24%" figure: find it or kill it. Confirm open-label and self-reported-outcome limitations, the panel-change-during-study limitation, the "10–20× more patients" claim, the published critical correspondence, and whether PREPARE used a Safety-Code QR card. Approved wording until verified: "about 30% lower odds", never "30% fewer ADRs". First author is Swen, not van der Wouden.
2. **TAILOR-PCI (JAMA 2020).** Confirm primary result not significant; the post hoc first-3-months HR ≈0.21 and its CI from the JAMA full text, or drop it.
3. **RAPID GENE (Lancet 2012).** Verify volume 379, pages 1705–11 and DOI.
4. **UF Health "20% followed (79/392)"** — find a primary source or drop. Verify 63% accepted and 47% concordance; add the missing author list.
5. **PROGRESS "90% of healthcare professionals acted"** — find the peer-reviewed paper or registry entry; reconcile with the aggregator's 500 participants / 20 sites / 95% and the "non-interruptive pharmacist-mediated" description. Otherwise drop.
6. **Alert claims.** Verify St Jude 92% adherence to interruptive PGx alerts (and low adherence in inpatients/residents); University of Chicago OR 26.2; find sourced eMERGE and Genomics England figures or state none.
7. **Mayo RIGHT 10K (Wang et al. 2022).** Confirm 54% acceptance of 61 semi-urgent recommendations; determine what the 6,620 alerts figure refers to. Verify Vanderbilt PREDICT and St Jude PG4KDS figures from primary papers.
8. **CPIC citations.** Clopidogrel guideline volume 112 + DOI; Lima et al. 2021;109(6) PPI guideline; check on clinpgx.org whether any guideline used (clopidogrel, PPI, codeine/CYP2D6, NSAID/CYP2C9 Theken 2020, G6PD, statins/SLCO1B1, DPYD) has been superseded as of Nov 2026; verify the CYP2D6 activity-score → phenotype thresholds A7 uses against Caudle et al.'s table (TEST: compare to the code constants); verify the CPIC term-standardisation paper.
9. **CPIC G6PD update.** Volume, pages, authors, DOI of the published version (the PDF read was an "in author review" draft). Confirm co-trimoxazole low-to-no risk wording.
10. **Thomas et al. 2020** is a metoprolol PK/PD study: confirm the ×0.5/×0 factors are described accurately (not a "validated algorithm"); reproduce or drop the "bupropion strong CYP2D6 inhibitor" quote; split the two FDA table pages and their dates (2023 vs 29 May 2026) in docs/sources.md.
11. **Sickle-cell trait**: check clinpgx.org with a JS browser for any CPIC/DPWG HBB guideline; wording stays "no CPIC or DPWG guideline found (checked <date>)".

### C2. Saudi genetics and burden
12. **KFSHRC (Bakheet et al., Genet Med Open 2025;3:103426).** Re-open full text; confirm verbatim the phase-ambiguity "indeterminate" passage, "We are upgrading our genotyping kit", and absence of an indeterminate count. Never print a percentage.
13. **Goljan et al.** Resolve six (1.1%) vs four (0.67%) rare Saudi-specific variants; CYP3A5*3 84.7% vs 84.5% (read Table 1 image); CYP2C19*3, DPYD HapB3 and rs1801159 values; the companion Human Genomics 2024 SLCO1B1 paper (*15 24.7%, 47.6% actionable) and its authors; confirm title and first names in Works Cited. Then TEST that `tables/` A5 frequency rows match the verified values exactly.
14. **Alshabeeb et al. 2025.** 38 vs 37 variants; confirm Axiom Precision Medicine Diversity Array (not PharmacoScan); confirm "26 of 37 zero-frequency variants" and n=95; find how array/PharmCAT VCF export represents untested positions, or keep it labelled "mechanism hypothesis".
15. **Alshabeeb et al. 2022 (31.3%).** Verify the denominator 561,150 / 1,790,910 against the paper; it is a share of exposure records, not prevalence; reconcile per-drug percentages or quote as reported.
16. **Burden figures.** Search once more for Saudi statin/clopidogrel volumes, annual PCI counts, Aseer diabetes/CVD prevalence, older-adult polypharmacy, Saudi ADR cost. Kill "50% Riyadh polypharmacy" and ISPOR US$61bn unless primary-verified. Aseer stroke 57.64/100,000: find the primary study or demote.
17. **Gulf context.** Verify Emirati Genome Program and Saudi Genome Program counts from primary pages; the Qatar medRxiv preprint stays uncited unless published.
18. **G6PD 25% is Al-Ahsa** (hospitalised children, Eastern Province); confirm no published Aseer figure; confirm Saudi premarital screening does not include G6PD for Saudi nationals (MoH page).
19. **1000 Genomes** contains no Saudi or Gulf population: verify against the IGSR population list.
20. Other star-allele callers (Aldy 4, Cyrius, Astrolabe, PyPGx/Stargazer, PAnno): re-fetch their docs and confirm or correct each statement about frequency use.

### C3. Technology and standards (verify AND test in this repo)
21. **PharmCAT 3.4.0**: confirm `pgkb/pharmcat:3.4.0` exists on Docker Hub (TEST: `docker pull`); read the Disclaimers page re "research-only partly because of no-call behaviour"; confirm "bcftools 1.24 recommended", the flags documented as dangerous, StellarPGx statement; quote "as arbitrary as sorting them alphabetically" verbatim with URL. Pinned demo patients labelled as pinned.
22. **A3 concordance (GeT-RM).** Fix `engine/validation/results.md` from "Exact concordance: 9/10" to 7 unambiguous, 2 tied-candidate, 1 mismatch (re-run to confirm). Check the NA11839 explanation (PharmVar *1/*38 split) on PharmVar; note Coriell lists *1/*1. Add the 1000 Genomes NYGC dataset row to sources. Trace "70 of 137 samples" to an ENA run list or reword; check Coriell/CDC usage terms; verify Pratt et al. 2016 citation.
23. **CDS Hooks / HL7.** What changed 2.0 → 2.0.1 and whether a newer version exists; maturity labels are from hook-library v1.0.1; remove any remaining `medication-prescribe` mention; TEST the card summary is <140 chars and indicator values are info/warning/critical; never cite the public HAPI snapshot version. Correct Genes 2026 paper authorship (Alrubaie lead, AlEissa last) and the exact NPHIES sentence.
24. **QR / C7 / C8.** TEST and record: actual payload size in bytes for each demo contract, QR version and error-correction level used, module size at printed 28 mm, decode success on screen at each mobile viewport and from a 300/600 dpi raster, and — if a phone and printer are available, else say "untested" — physical print scanning. Verify QR v40 capacities (2,953 B at L, 1,273 B at H) from ISO/IEC 18004 or a reliable primary; ISO/IEC 7810 ID-1 dimensions (85.60 × 53.98 mm) and reconcile with the 85.68 × 54.02 mm PDF in the C7 handoff; LOINC 48002-0 label and the germline answer code on loinc.org; NIST SP 800-38D for AES-GCM nonce length; OWASP PBKDF2-HMAC-SHA256 600,000 iterations. Keep "stops casual scanning only".
25. **Latency claims** (~0.1 s, ~0.42 s): reproduce with a timed benchmark or drop.
26. **A7 sources row** says 97 scored alleles, code holds 95: count and fix. **docs/structural-variants.md line 7** unsourced "roughly a quarter of commonly prescribed medicines": source or delete. Tier 2 rows citing Goljan as if measured: reword.

### C4. Regulatory, market, hardware, hackathon
27. **SFDA**: "requires local validation" → "should"; resolve MDS-REQ 9 cover-identifier vs footer mismatch; confirm the exemption is from the Ministry of Industry licence only; retrieve MDS-REQ 1 and MDS-G38 cybersecurity guidance; search for genetic-test IVD rules. Quote from the PDFs, not fetch summaries.
28. **PDPL**: confirm "amended 2023 (M/148)" from a primary source; open the law and Implementing Regulations and check article numbers; check the word "sensitive" in the legitimate-interest sentence.
29. **Prior art / FDA NTI**: query the FDA 510(k) database directly for product code NTI; confirm Genomadix Cube CYP2C19 K220026 (21 Mar 2023) wording "not intended to be used to predict drug response"; keep "none found as of <date>". Check safety-code.org QR contents and the Groningen / commercial passport examples.
30. **Costs**: NICE figures are UK ex-VAT, never converted to SAR; saliva stability, barcode benefit, array cost, OneOme price: verify or drop. DESIGN-PLAN shipping/temperature figures: source or drop.
31. **Hardware**: confirm F3 kit code is merged to main (TEST: run its tests); T3/T4 renders all carry "Concept render, not built"; record the team decision resolving the 21 Nov "device cut" vs later renders conflict.
32. **Hackathon**: confirm the official event name/page for the KKU Health Innovation Hackathon and whether a judging rubric or poster spec exists; flag that the submission form field must read "Predictive Healthcare".
33. **Clinical sign-off**: count rows in tables/cpic_recommendations.json with human sign-off (was 0/128). If still 0, every doc must say "model cross-check against the CPIC database, not clinician-reviewed". Resolve the table-provenance conflict (hand-built CPIC+DPWG vs CPIC-only script); the 169-row branch table must not be cited.
34. **Patient-side evidence**: no usability, elder-legibility or native-Arabic review exists — list as limitation; do not claim one. Generated images must be labelled (ties to known_issues #1).
35. **Stale docs**: `07-synthesis-and-verdict-v1.md` (premarital/G6PD/sickle claims) marked deprecated; README run snippet (VCF only exists after the generator runs); README layout entries; the review row count; handoff context file contract shape.
36. **Review coverage**: B1, B2, B3, C1 and hardware tasks previously had no independent review; this run covers them in Part A.
</task>

<constraints>
- This is a fix pass. Work on a branch `review/final-<date>`, commit each logical fix separately with a clear message, and open ONE pull request at the end. Never push to main.
- Locked decisions in <context> and AGENTS.md are not up for change. Do not alter clinical logic, dosing tables, the data contract or crypto parameters except to fix a proven defect against the spec, and call out any such change at the top of the report.
- Every visual change goes through frontend-design + impeccable inside `design/`; no new fonts, colours or libraries without saying why.
- Ground every finding in path:line or command + output. "Pass" without evidence is a failure of this review.
- Never invent a number or a source. If a primary source cannot be opened, the verdict is DROPPED or STILL UNVERIFIED, never VERIFIED.
- If the stack will not start after two attempts, record the error and continue with the parts that do not need it.
</constraints>

<output_format>
1. `docs/REVIEW.md` (replace; move the previous one to `docs/REVIEW-C6-C7-C9-2026-11-24.md`):
   1. Verdict in one line: ready / ready with fixes / not ready.
   2. Task table: ID, status, evidence.
   3. Findings by severity (blocks submission / wrong in front of a judge / minor), each path:line, what was wrong, fix commit.
   4. Cross-cutting checks 1–18 with evidence.
   5. Mobile matrix: page × viewport × lang, pass/fail, screenshot links; Lighthouse before/after; impeccable scores before/after.
   6. Image library: table of img-01..15, sizes present, where used, alt text, label.
   7. Netlify re-upload list.
   8. Not checked, and why.
2. `docs/report-verification.md`: the Part C table, every item 1–36, with a ready-to-paste replacement sentence and Works Cited fix for each, so the paper can be finalised directly from it.
3. Terminal: verdict, top five findings, counts of VERIFIED / CORRECTED / TESTED / DROPPED / STILL UNVERIFIED, and the PR link.
</output_format>

If your context or usage limit approaches before you finish, commit what you have, write the "Not yet checked" list into docs/REVIEW.md, save `handoff/REVIEW.md` with the exact next step, reply `HANDOFF SAVED`, and stop.
