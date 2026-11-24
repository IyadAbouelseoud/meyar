# Audit B — B1–B6 (read-only), branch review/final-2026-11-24 @ 061eff6

Method: `npm --prefix cds test` → **39 pass / 0 fail** (Node v24.18.0 on host; the pin is Node 22 LTS). The branch server ran as `PORT=3100 ALERTS_LOG_PATH=<scratchpad>/alerts-3100.jsonl node cds/server.js`. It was stopped at the end, and the repo's `cds/data/alerts.jsonl` was not touched.
Env vars that set paths (cds): `TABLES_DIR` (cpic.js:14, default `tables/`), `CONTRACTS_DIR` (phenotypes.js:31, default `engine/data/out`), `FIXTURES_DIR` (phenotypes.js:38, default `docs/fixtures`), `FHIR_BASE` (phenotypes.js:44, default `http://localhost:8080/fhir`), `FHIR_TIMEOUT_MS` (server.js:686, default 400), `DESIGN_DIR` (server.js:188), `ALERTS_LOG_PATH` (alertLog.js:12).
Requests were built with a scratchpad script that uses the same body shape as `cds/test/cds.test.js` makeOrderSignBody. Phenotype source header = `hapi` for all calls on :3100. Container :3000 returned the same cards (it reports `fhirBase http://hapi:8080/fhir`, 128 rows).
`git status` before and after: identical apart from files another process created (`tests/`, `docs/screenshots/final-review*`). The auditor wrote nothing in the repo.

## Pages served by cds (for the mobile pass)
| URL path | What | Notes |
|---|---|---|
| `/dashboard` (`?lang=ar` client-side toggle; `?range=week`) | B4 alert log, instrument theme | lang read in JS (dashboard.js:401), server ignores it |
| `/dashboard/data?range=today\|week` | JSON for dashboard | |
| `/compare` and `/compare?lang=ar` | B5 side-by-side | server-side lang (server.js:749) |
| `/preview` and `/preview?lang=ar` | B6 styled `.m-cds` card preview, 4 scenarios, live POST to `/cds-services/meyar-pgx` | |
| `/design/*` (e.g. `/design/showcase/index.html`) | read-only design files | |
| `/cds-services`, `/health` | JSON | |
Coordinator note: kit routes are `/`, `/card`, `/tracker`, `/urgent`. They are not served by cds.
All 3 HTML pages have `<meta name="viewport" content="width=device-width, initial-scale=1">` (compare.js:93, dashboard.js:159, preview.js:412).

## B1 — CPIC recommendation table
| Done-when box | Result | Evidence |
|---|---|---|
| Table validates against schema | PASS | `jsonschema.Draft202012Validator(schema).iter_errors(table)` → `errors 0` |
| Every row has a URL that resolves | PASS (partial) | 128/128 rows have `guideline.url`. 5 distinct URLs (clinpgx PA166251441/443/454/464, PA166264281), all `curl -L` → 200. These are JS SPA pages, so the content was not checked |
| No unsourced number / DANGEROUS flag / model dosing | PASS w/ caveat | Every row has `source.cpicRecommendationId` + api URL + `verification.vsCpicDatabase:"copied-verbatim"`. All 54 rows with alternatives carry `quotedFrom`, and each `quotedFrom` string is found in that row's recommendation/comments (0 misses) |
| handoff/B1.md Status DONE, committed | PASS (partial) | B1.md:3 `Status: DONE (model cross-check only…)`. No "Last commit" hash is given. Commits ac91afe..e60e874 exist |
| CHANGES.md `## B1` entry | PASS | CHANGES.md:23 |
Extra checks: **128 rows**. 12 drugs: clopidogrel 24, codeine 22, tramadol 22, omeprazole/lansoprazole/pantoprazole 8 each, simvastatin/atorvastatin/4 NSAIDs 6 each. Warfarin and esomeprazole are missing, although prompt B1 requires them (`_scope` explains why). **Human sign-off: 0/128.** All rows have `verification.humanSignOff:null`, and docs/cpic-signoff.md has 128 `☐` and 0 ticked. **Provenance conflict:** the table and the sign-off file say "copied verbatim from CPIC database, built by `tables/tools/build_cpic_table.py`, DPWG not included" (`_note`, `_generated`, `_scope`; cpic-signoff.md:173; sources.md:30; CHANGES.md:25). Three places still say "hand-built from CPIC/DPWG" or "CPIC/DPWG tables": AGENTS.md:49, README.md:93, README.md:100. The handoff/B1.md title says "CPIC/DPWG". Schema: alternatives use `{drug, drugClass, rxnorm, condition, quotedFrom}`, not the `{…, source}` that prompt B1 specifies. Provenance comes from the row's `source`.

## B2 — CDS Hooks order-sign service
| Done-when box | Result | Evidence |
|---|---|---|
| `GET /cds-services` returns valid discovery | PASS | :3100 → `{"services":[{hook:"order-sign",id:"meyar-pgx",…prefetch},{hook:"order-select",id:"meyar-pgx-select"}]}`. :3000 is the same |
| demo-001 clopidogrel → card with CYP2C19 Poor Metabolizer in < 1 s | PASS (one outlier) | :3100 `HTTP 200 wall=248ms` → summary "CYP2C19 Poor Metabolizer: clopidogrel — Significantly reduced…". 4 repeats were 175–203 ms. :3000 first call `wall=1006ms lat=904ms src=contract-out` (cold/HAPI timeout path), then 130–361 ms |
| No unsourced number / DANGEROUS / model dosing | PASS | No LLM or network advice (see cross-checks) |
| handoff/B2.md DONE, committed | PARTIAL | B2.md:3 DONE. B2.md:5 has "Last commit: see `git log -1 b2-cds-service`", which is not a hash |
| CHANGES.md `## B2` | PASS | CHANGES.md:87 |
order-select also works: `/cds-services/meyar-pgx-select` returns the same card for demo-001 clopidogrel.

## B3 — Non-interruptive prescriber card
| Done-when box | Result | Evidence |
|---|---|---|
| Card JSON follows design §7 (summary <140, indicator, detail grammar, source label) | PASS | Every live card had summaryLen ≤ 139 (cards.js:10 `MAX_SUMMARY_LENGTH=139`). Indicators seen: info/warning only. `source.label:"Meyar (research prototype)"`. Detail has **Genetic** · **Acting like**, a quoted guideline line, the A5 line and the `_…Advises, does not prescribe…_` footer |
| Sandbox shows demo-001 clopidogrel card with the A5 line | COULD NOT CHECK live | :8081 is not running (`curl localhost:8081` → 000). The committed screenshot docs/screenshots/b6/sandbox-demo-001-clopidogrel.jpg shows the card at public sandbox → :3000, but the A5 line is not visible in it. The live :3100 card contains "Assay covered 35 of 35 defining positions. Saudi data: Tier 1: Goljan…" |
| Backward sweep card for patient already on a statin with SLCO1B1 decreased function | PASS (via prefetch) | demo-003 (SLCO1B1 *1/*5 Decreased) ordering omeprazole with `prefetch.currentMedications` = simvastatin 40 mg → 2nd card `warning` "Backward sweep — SLCO1B1 Decreased Function: simvastatin — …". No committed demo patient is actually on a statin (demo-003 meds = fluvoxamine), so the stock demo cannot show this without prefetch |
| No unsourced number / DANGEROUS / model dosing | PASS (cds service) | see cross-checks. /compare is a separate issue (B5) |
| handoff/B3.md DONE, committed | PARTIAL | B3.md:5 `Last commit: 1fc9342` exists, but it is "B3: initialize branch and handoff", not the final B3 commit (2399633) |
| CHANGES.md `## B3` | PASS | CHANGES.md:113 |
Oncology line and Send-to-pharmacist: covered by tests ("B3: oncology drug card prints…", "B3: includes one-tap Send to pharmacist…" pass). Every card offered a "Send to pharmacist" suggestion.

## B4 — Alert log and counts dashboard
| Done-when box | Result | Evidence |
|---|---|---|
| Built from design/ (no hard-coded colours/fonts); build-tokens passes; ANTI-SLOP < 2; screenshots 375/1440 AR+EN attached | PARTIAL | dashboard.js has 0 hex values. font-family only through `var(--m-font-display)` (dashboard.js:171,173). `node design/build-tokens.mjs --check` → "62/62 contrast pairs pass", exit 0. **No B4 screenshots are committed** (docs/screenshots has only `b6/`). ANTI-SLOP is self-reported "0 ticks" in B4.md:16 and could not be re-checked. Headless Chrome on Windows cannot render narrower than ~500 px, so 375 px is deferred to the mobile pass |
| Firing three hooks → three log lines, dashboard shows them | PASS | Test "firing three hooks writes three log lines…" passes. Live: 21 POSTs to :3100 → `alerts-3100.jsonl` grew to 21 lines; `/dashboard/data` `totalLogged:16` at the time of the call; dashboard screenshot shows "Cards fired 21" |
| No unsourced number | PASS w/ issue | see Findings: "Switched" KPI and coverage-grid shading |
| handoff/B4.md DONE, committed | **FAIL** | B4.md:5 `Last commit: b14822c` → `git cat-file -t b14822c` → "fatal: Not a valid object name". The real commit is 8551599 |
| CHANGES.md `## B4` | PASS (stale count) | CHANGES.md:170. Line 173 says "31 pass, 0 fail"; the reproduced count is 39 |

## B5 — Side-by-side comparison
| Done-when box | Result | Evidence |
|---|---|---|
| Built from design/ (no hard-coded colours) … | **FAIL** | 11 hard-coded hex colours in compare.js:197,198,211,212,213,221,222,245,246,247,253 plus `rgb(0 0 0 / .22)` at :218 (the grey counter-example modal). No B5 screenshots are committed |
| GET /compare renders both panes at 1440 and 375 | PASS at 1440; 375 COULD NOT CHECK | `/compare` 200, 17,506 B (EN) / 18,217 B (AR). Headless 1440×1000 screenshot shows both panes side by side. 375 needs device emulation (mobile pass) |
| No unsourced number | **FAIL** | The caption's 63% / 20% / 90% (compare.js:9,12) trace only to sources.md:5–6 "see EN detail doc", which is not a citation. REVIEW Part C items 4–5 list them as unverified |
| handoff/B5.md DONE, committed | **FAIL** | B5.md:5 `Last commit: e63f2c9` → not a valid object. The real commit is 7f52180 |
| CHANGES.md `## B5` | PASS | CHANGES.md:209 |

## B6 — Alternatives and current-medicine effects
| Done-when box | Result | Evidence |
|---|---|---|
| Built from design/; build-tokens; ANTI-SLOP; screenshots | PARTIAL | preview.js has no hex values; build-tokens passes. Screenshots exist: docs/screenshots/b6/preview-1440-ar.jpg, preview-1440-en-demo-002.jpg, preview-375-en-ar.jpg, sandbox-demo-001-clopidogrel.jpg |
| Sandbox 8081: demo-001 clopidogrel shows prasugrel AND ticagrelor + CPIC link | PARTIAL | The sandbox screenshot (public sandbox → :3000, not 8081) shows ticagrelor only, because the sandbox sends no indication. Live :3100 with `reasonCode "Acute coronary syndrome, PCI"` → suggestions `[prasugrel, ticagrelor, Send to pharmacist]` + link `CPIC … https://www.clinpgx.org/guideline/PA166251443`. With no indication → ticagrelor only (by design, README "Indication-stratified") |
| demo-002 codeine shows "Acting like: Poor Metabolizer because of paroxetine" | PASS | :3100 detail `**Genetic:** CYP2D6 *1/*1 (Normal Metabolizer) · **Acting like:** Poor Metabolizer because of paroxetine`, plus "Genetic result (Normal Metabolizer) applies if paroxetine is stopped". The same from :3000 |
| Paroxetine order for a patient on codeine → backward-sweep card | PASS | demo-006 + prefetch current meds codeine, tramadol, ordering paroxetine → one `info` card "Backward sweep — CYP2D6 Ultrarapid Metabolizer, acting like Poor Metabolizer (paroxetine): affects codeine, tramadol", with "Activity score: 3 × 0 = 0". demo-001 (CYP2D6 not-assessed) with the same order → 0 cards (no fabricated shift) |
| A drug with no CPIC alternative shows no suggestion | PASS | demo-001 pantoprazole → suggestions `["Send to pharmacist"]` only. demo-002 omeprazole → `[]` |
| No unsourced number / model dosing or alternatives | PASS (service) | see cross-checks |
| handoff/B6.md DONE, committed | PARTIAL | B6.md:3 DONE. "Last commit: see git log -1 (review fixes on top of d6d8784)": d6d8784 is a real commit. B6.md "Next step" still says to run the sandbox and axe, which are already ticked at lines 33–34 |
| CHANGES.md `## B6` | PASS | CHANGES.md:230 |

## Cross-cutting verifications
- **Summary < 140:** cards.js:10,15–18 truncate to 139 characters with "…". Observed lengths were 62–139. Three CYP2D6 summaries are cut mid-word ("…leading to diminished a…").
- **Indicator ∈ {info, warning, critical}:** only info and warning are emitted (cards.js:58–69, :154, :189, :547). `critical` never appears.
- **Hook is order-sign:** server.js:66. `git grep medication-prescribe` → only deprecation notes in prompts, docs and handoffs, plus the reject guard at server.js:56,405 and tests :288,:592. It is never used as a hook.
- **Non-interruptive:** no `overrideReasons` anywhere in cds and no critical indicator.
- **Backward sweep present:** server.js:461–663 (first-sign sweep + strong-inhibitor sweep), proven live above.
- **A7 `phenotype` never overwritten:** grep finds no `.phenotype =` assignment in cds. Lookups use a local `lookupPhenotype` (server.js:342–356). The card always prints the genetic result plus "applies if <drug> is stopped".
- **B6 alternatives trace to the table:** every live suggestion (prasugrel, ticagrelor, ticlopidine) and text alternative ("non-tramadol opioid", "non-codeine opioid", "alternative statin") matched an `alternatives[]` entry with `quotedFrom` in that row. Order is the table order, with no ranking. A class alternative is shown as text, never as a `create` action. **Exception: /compare hard-codes alternatives (see F2).**
- **A8:** demo-001 codeine and demo-003 tramadol → `info` "CYP2D6: copy number not assessed by this test — no result reported", with detail "This is not a normal result" and the PharmCAT quote.
- **Dosing only from the table; no LLM or network advice:** `git grep -iE "openai|anthropic|gemini-|gpt-[0-9]|ollama|langchain|chat/completions"` (excluding prompts and research) → only design citation text. The only cds network calls are `fetchImpl` to local FHIR (phenotypes.js:320,420) and same-origin page fetches.
- **Hex / font-family in cds outside design/:** 11 hex + 1 rgb, all in compare.js (above). font-family is token-only (compare.js:185, dashboard.js:171,173, preview.js:486,624).
- **@media in cds:** **5** in total: compare.js:170,205; dashboard.js:175,177; preview.js:504. server.js, cards.js and the other files have 0. Known issue #2 ("zero") is now outdated.
- **Mandatory line "Runs on synthetic and GeT-RM reference data; no patient data was used.":** absent from /dashboard, /compare and /preview (only cds/README.md:3). "Research prototype — not for clinical use" is present on all three.
- **Handoff hashes:** B3 1fc9342 is valid but is the init commit. B4 b14822c and B5 e63f2c9 are INVALID. B1 has no hash. B2 and B6 give no hash.

## Findings (ranked)

### Blocks submission
None found in the cds service logic. The service, A7, A8 and backward-sweep behaviour all verified live.

### Wrong in front of a judge
1. **F1 — /compare card is hand-written and contradicts the table and the live service.**
   - compare.js:37 `recQuote: 'Avoid standard-dose clopidogrel if possible…'`. CPIC (table row) says "Avoid clopidogrel if possible…". This is paraphrased guideline text, which breaks AGENTS §7 "lookup only, verbatim".
   - compare.js:39/72 shows "9 of 11 … *35" while the real demo-001 is "35 of 35".
   - compare.js:41 offers a one-click **prasugrel** with no indication. The live service deliberately withholds prasugrel when the indication is unknown, because of the stroke/TIA contraindication.
   - compare.js:371 shows "CPIC 2022-11", which is not a CPIC version.
   - Smallest fix: build the right pane from `buildCpicCard` output for demo-001 with `reasonCode` ACS/PCI (as /preview scenario 1 does), or copy the table row verbatim, and add "ACS/PCI" to the context.
2. **F2 — /compare caption numbers are unsourced.** compare.js:9,12 (63% / 20% / 90%) → sources.md:5–6 cite only "see EN detail doc". Fix: add primary citations to sources.md (UF/PROGRESS papers) or drop the numbers. The prompt-mandated wording does not override AGENTS §8.
3. **F3 — B5 hard-codes colours** (compare.js:197–253, 11 hex + rgb at :218), which fails its Done-when box. Fix: use `--m-sunken` / `--m-line-strong` / `--m-text*` / `--m-surface` tokens for the grey modal.
4. **F4 — Table provenance conflict.** AGENTS.md:49, README.md:93 and README.md:100 say "hand-built from CPIC/DPWG". The table is CPIC-only and script-generated (cpic_recommendations.json `_generated`, `_scope` "Not included: … DPWG"), and has **0/128 human sign-off**. Fix: change the README lines to "copied verbatim from the CPIC database (script `tables/tools/build_cpic_table.py`); model cross-check, not clinician-reviewed; DPWG not included". AGENTS.md belongs to the team, so raise it in requests.
5. **F5 — "Guideline version" stamp is the engine version, not the guideline version.** cards.js:134,407 use `geneRecord.guidelineVersion` = "CPIC PharmCAT 3.4.0" (all 23 genes in engine contracts), so every card footer reads "…does not prescribe. CPIC PharmCAT 3.4.0". Fix: stamp `row.guideline.pub` / `cpicDbVersion` (e.g. "CPIC 2022 (Lee et al.), CPIC DB v72").
6. **F6 — Dashboard "Switched" KPI counts backward-sweep cards, not switches.** alertLog.js:112 `if (ev.backwardSweep) switched++`, with label dashboard.js:250 "Switched · backward sweep". Live log: 2 "switched" with 0 accepted. Fix: rename the tile "Backward-sweep cards", or count `action==='accepted'` for an alternative suggestion.
7. **F7 — B4/B5 handoff "Last commit" hashes do not exist** (B4.md:5 b14822c, B5.md:5 e63f2c9). B3.md:5 points to the init commit. Fix: set them to 8551599, 7f52180 and 2399633.
8. **F8 — Coverage heat grid invents shading.** dashboard.js:131 gives a gene missing from the fixture `ratio 0.25`, with a floor of 0.2. docs/fixtures/demo-001 has only CYP2C19 and CYP2D6, so CYP2C9 / VKORC1 / SLCO1B1 / DPYD show a "25% tested" shade with no data. DEFAULT_COVERAGE_PATIENTS (dashboard.js:42–76) are invented ratios. Fix: render missing genes as "no data" (hatched or empty), not 0.25.

### Minor
9. Dead code: server.js:230–309 `evaluateMedications` calls `matchDrugInTable`, `lookupCpicRow` and `selectIndicator`, which are not imported in server.js. It is never called, so there is no runtime error. Fix: delete it.
10. B3 statin backward-sweep demo needs prefetch. No committed demo patient is on a statin (demo-003 SLCO1B1 Decreased takes fluvoxamine). Fix: add simvastatin to demo-003 `currentMedications` (A7 owner).
11. Summaries are truncated mid-word for CYP2D6 phenoconversion (cards.js:15–18), e.g. "…leading to diminished a…". Fix: truncate at a word boundary, or put the action ("Avoid codeine") before the implication.
12. dashboard.js:31 watch row label "demo-004 · CYP2D6 from VCF" next to "not assessed (A8)" reads as if CYP2D6 was called from VCF. Fix: "demo-004 · CYP2D6 not called from VCF".
13. The mandatory "Runs on synthetic and GeT-RM reference data; no patient data was used." line is missing from the /dashboard, /compare and /preview footers.
14. The B1 alternative schema uses `quotedFrom` rather than the `source` the prompt asks for. Clopidogrel NVI/ticagrelor alternatives have `rxnorm:null`, so `create` suggestions carry text only.
15. CHANGES.md:173 says "31 pass". The reproduced count is 39/39.
16. The host runs Node v24.18.0, not the pinned Node 22 LTS. Tests pass on 24, not re-run on 22.
17. B6.md "Next step" lists sandbox and axe as to-do, although they are ticked above.

## Not checked, and why
- CDS Hooks sandbox on 8081: not running.
- ANTI-SLOP tick counts and axe: these need a visual or browser pass.
- 375 px rendering: headless Chrome on Windows clamps the window to about 500 px. Use device emulation in the mobile pass.
- Content of the clinpgx guideline pages: JS SPA; only HTTP 200 was confirmed.
