# Changes

Each build task appends a section `## <task id>`.

## DS — Design system (21 Nov 2026)
Files: `design/` (tokens.json, build-tokens.mjs, tokens.css, meyar.css, meyar.js, fonts/, README.md, ANTI-SLOP.md, showcase/), `AGENTS.md` §11, `prompts/` (Design system section in B3–B6, C1–C9, D1, D2, F3, F4; check 18 in REVIEW), `README.md`, `prompts/README.md`, `docker-compose.yml` (read-only `./design` mount for cds), `docs/sources.md` (CDS Hooks summary length row).
Round 2 (21 Nov 2026): Reem Kufi removed and banned; display face is now Alexandria. Dashboard rebuilt on `design/charts.js` (area, gauge, bars, rings, minibars) with a live feed, Hijri date and new data tokens. `.m-photo` image slots plus `design/imagery/` (Nano Banana prompt library, `build_webp.py`). B4 dashboard spec updated.
Run: `node design/build-tokens.mjs` (contrast check, 62/62 pass); open `design/showcase/index.html` through any local server.
Data contract unchanged. No new runtime dependency.

## A1 — Synthetic VCF generator (21 Nov 2026)
Files: `engine/gen_vcf.py`, `engine/data/in/demo-001`..`demo-006` (`.vcf` and `.origin.json`), `engine/data/in/demo-006.outside.tsv` (`# mock: true`), `engine/README.md`, `handoff/A1.md`.
Notes: Coordinates and REF/ALT alleles extracted directly from `pgkb/pharmcat:3.4.0` (`CLINPGX 2026-07-13-11-40`). `demo-006.vcf` deliberately omits 5 defining positions (3 `CYP2C19`, 2 `CYP2C9`) for A5 coverage testing; `CYP2D6 *1/*2x2` duplication is emitted via `demo-006.outside.tsv` (`# mock: true`). `DPYD c.257C>T` is absent from PharmCAT 3.4.0's bundled `DPYD_translation.json`, so `demo-005` uses PharmCAT 3.4.0's `c.1905+1G>A (*2A)` and documents the gap.
Run: `python engine/gen_vcf.py --all`; validate with `bcftools view -h` (1.24 via `pgkb/pharmcat:3.4.0`).
Data contract unchanged. No new runtime dependency.

## A2 — Run PharmCAT 3.4.0 end to end (21 Nov 2026)
Files: `engine/run_pharmcat.sh`, `handoff/A2.md`, plus generated `engine/data/out/demo-001`..`demo-006` (`.match.json`, `.phenotype.json`, `.report.html`, gitignored per `.gitignore`).
Notes: Wraps `pgkb/pharmcat:3.4.0` `pharmcat_pipeline -o /pharmcat/data/out` across `engine/data/in/*.vcf` with zero DANGEROUS reference-imputation flags and without `-del` so `.match.json` (A5) and `.phenotype.json` (A4) are preserved alongside `.report.html`. Handles Windows Git Bash (`MSYS_NO_PATHCONV=1` + `cygpath -m`) as well as Linux/macOS.
Run: `bash engine/run_pharmcat.sh` (requires `engine/data/in/*.vcf` from A1 and Docker).
Data contract unchanged. No new runtime dependency.

## B1 — CPIC recommendation table (21 Nov 2026)
Files: `tables/cpic_recommendations.json` (128 rows), `tables/cpic_recommendations.schema.json`, `tables/tools/build_cpic_table.py`, `tables/tools/cpic_extract.json`, `docs/cpic-signoff.md`, `docs/sources.md` (rows), `handoff/B1.md`.
Notes: Text copied verbatim from the CPIC database; alternatives only where the CPIC text names them. Model cross-check only: a human must work through `docs/cpic-signoff.md`.
Run: `python3 tables/tools/build_cpic_table.py` (rebuilds the table and the checklist).
Data contract unchanged. No new runtime dependency.

## A3 — Validate against GeT-RM reference samples (21 Nov 2026)
Files: `engine/validation/run_validation.py`, `engine/validation/README.md`, `engine/validation/results.md`, `engine/validation/data/consensus_getrm.json`, `engine/validation/.gitignore`, `engine/validation/data/out/.gitkeep`, `handoff/A3.md`.
Notes: Checked ENA `PRJEB19931` (`ERR1955333`/`NA07348.bam`: Isaac-aligned GRCh37, no `chr` prefixes; not lifted over per A3 rule). Streamed only the `chr10:94760000-94995000` (`CYP2C19` + `CYP2C9`) slice for 5 GeT-RM samples (`NA07348`, `NA10831`, `NA11839`, `NA18564`, `NA19122`) from the 1000 Genomes / NYGC 30x GRCh38 phased panel (`chr10` length `133797422`) and ran `pgkb/pharmcat:3.4.0` with zero DANGEROUS reference-imputation flags. Concordance: 9/10 exact or co-equal candidate matches (`NA10831` `CYP2C9` and `NA11839` `CYP2C9` retain `Indeterminate` candidate ties due to absent polymorphic-panel sites remaining no-calls); 1 mismatch reported transparently (`NA11839` `CYP2C19`: published `*1/*1` vs PharmCAT `*1/*38` due to PharmVar's `*1`/`*38` split at `rs3758581` `chr10:94842866`, both Normal Metabolizer).
Run: `python engine/validation/run_validation.py` (requires Docker `pgkb/pharmcat:3.4.0` and Python 3.12+).
Data contract unchanged. No new runtime dependency.

## F1 — Blender static renders (21 Nov 2026)
Files: `hardware/blender/` (`build_renders.py`, `compose.py`, `art/make_art.py`, `art/out/*.png`, `meyar_t1.blend`, `meyar_t3.blend`, `meyar_t4.blend`, `renders/meyar-t1-saliva-kit.png`, `renders/meyar-t3-single-gene-cathlab-unit-concept.png`, `renders/meyar-t4-multi-gene-reader-concept.png`, `DESIGN-PLAN.md`, `README.md`, `.gitignore`), `handoff/F1.md`.
Notes: Three 3000 × 2000 Cycles stills with labels baked in ("Kit design — software working" for T1, "Concept render — not built" for T3 and T4). All props carry mock data (kit ID MYR-DEMO-0001). T4 shows CYP2D6 hatched as "Not assessed — copy number" and no results. DESIGN-PLAN.md holds the sourced form/materials/cost/usability research; its numbers still need `docs/sources.md` rows before any slide use.
Run: `uv run --no-project python hardware/blender/art/make_art.py`, then `blender --background --factory-startup --python hardware/blender/build_renders.py -- --hero t1|t3|t4`, then `blender --background --factory-startup --python hardware/blender/compose.py` (see `hardware/blender/README.md`).
Data contract unchanged. No new runtime dependency.

## A4 — Phenotype store in FHIR (22 Nov 2026)
Files: `engine/load_fhir.py`, `handoff/A4.md`, plus generated `engine/data/out/demo-001`..`demo-006.contract.json` (gitignored per `.gitignore`).
Notes: Reads PharmCAT 3.4.0 `.phenotype.json` (and optional `.match.json` + `.origin.json` germline check), idempotently `PUT`s pseudonymous `Patient/<patientId>` and one HL7 Genomics Reporting IG `Observation/<patientId>-<gene>` per gene (23 genes/patient, including `LOINC 48002-0` = `LA6683-2` germline, `LOINC 48018-6`, `LOINC 53037-8`, and guideline version) to local HAPI FHIR (`hapiproject/hapi:v8.12.0-2` on `http://localhost:8080/fhir`), and writes `engine/data/out/<patientId>.contract.json` validated against `docs/data-contract.schema.json` (with neutral pre-A5 `coverage` placeholders).
Run: `docker compose up -d hapi && python engine/load_fhir.py --all`.
Data contract unchanged. No new runtime dependency.

## A6 — Germline-only guard (22 Nov 2026)
Files: `engine/origin_guard.py`, `engine/tests/test_origin.py`, `handoff/A6.md`.
Notes: Enforces that `engine/data/in/<patientId>.origin.json` exists and has `sampleOrigin == "germline"` before any FHIR write or contract emission (`NonGermlineSampleError`, zero FHIR writes on rejection), tags/verifies top-level `sampleOrigin: "germline"` on `contract.json`, and sets/verifies `LOINC 48002-0` (`LA6683-2`, `germline`) on FHIR `Observation` resources. Rationale: CPIC/DPWG guidelines are for inherited genotypes; a tumour VCF can show loss of heterozygosity and look like a different diplotype.
Run: `python -m unittest discover -s engine/tests -p "test_origin.py" -v` and `python engine/origin_guard.py --all --check-contracts`.
Data contract unchanged. No new runtime dependency.

## A5 — Coverage and interpretability flag (22 Nov 2026)
Files: `engine/coverage.py`, `engine/tests/test_coverage.py`, `tables/saudi_frequencies.json`, `docs/data-contract.schema.json`, `handoff/A5.md`.
Notes: Pure arithmetic over PharmCAT 3.4.0 `.match.json` and `tables/saudi_frequencies.json`; never re-picks or modifies `diplotype`, `phenotype`, or `candidates`. Tier 1 covers 8 genes (82 alleles) verbatim from Goljan et al., *PLoS ONE* 2022;17(1):e0263137 Table 1 (`n = 11,889`; uses `84.5%` from Table 1 for `CYP3A5*3` and omits the discordant rare-variant count). Tier 2 genes (e.g., `SLCO1B1`) return `uninformativeNormalRisk: null` with `"No published Saudi frequency for this gene"`. Tier 0 (`CYP2D6`, owned by A8) receives no A5 score (`null`). Populates `coverage` on `engine/data/out/demo-001`..`demo-006.contract.json` (`demo-006`: `CYP2C9` `86/88`, `['*2', '*3']`, risk `0.187`; `CYP2C19` `32/35`, `['*3', '*4A']`, risk `0.001`).
Run: `python engine/coverage.py --all` and `python -m pytest engine/tests/test_coverage.py`.
Data contract updated (approved): `coverage` in `docs/data-contract.schema.json` adds `saudiDataTier` (`0 | 1 | 2`) and `saudiDataNote`, and permits `null` for `uninformativeNormalRisk`. Dev test dependency installed: `pytest`.

## A8 — Structural-variant gate and outside-call path (22 Nov 2026)
Files: `engine/sv_gate.py`, `engine/run_pharmcat.sh`, `engine/tests/test_sv_gate.py`, `engine/data/in/demo-002.outside.tsv`, `engine/data/in/demo-006.outside.tsv`, `tables/sv_genes.json`, `docs/structural-variants.md`, `docs/data-contract.schema.json`, `docs/data-contract.md`, `docs/fixtures/demo-001.contract.json`, `docs/fixtures/demo-002.contract.json`, `docs/fixtures/demo-006.contract.json`, `docs/requests.md`, `handoff/A8.md`.
Notes: Enforces that genes in `tables/sv_genes.json` (`CYP2D6`, `callableFromVcf: false`) never emit a VCF-derived phenotype. `engine/run_pharmcat.sh` passes `<patientId>.outside.tsv` via `pharmcat.jar -phenotyper -reporter -pi ... -po ...` when present (`demo-002` `*1/*1` Normal Metabolizer; `demo-006` `*1/*2x2` Ultrarapid Metabolizer, both marked `# mock: true` with pretend caller and version). Patients without an outside call (`demo-001`, `demo-003`–`demo-005`) yield `diplotype: null`, `phenotype: null`, `candidates: []`, and `callability.method: "not-assessed"` with quoted PharmCAT justification and `requiredInput`. Display rule for B3/B6 and C1/C9 recorded in `docs/requests.md`.
Run: `bash engine/run_pharmcat.sh && python engine/load_fhir.py --all --dry-run && python engine/coverage.py --all && python engine/sv_gate.py --all && python -m pytest engine/tests/test_sv_gate.py engine/tests/test_coverage.py -v`.
Data contract updated (approved): `docs/data-contract.schema.json` adds per-gene `callability` (`method`: `"vcf" | "outside-call" | "not-assessed"`, `svAssessed`, `reason`, `requiredInput`, `source`), permits `null` for `diplotype` and `phenotype`, and allows empty `candidates: []` when `not-assessed`. No new runtime dependency.


## A7 — Phenoconversion (22 Nov 2026)
Files: `tables/cyp_inhibitors.json` (30 rows: 21 CYP2D6 + 9 CYP2C19 clinical inhibitors from FDA Table of Substrates, Inhibitors and Inducers / FDA Clinical Inhibitors table, accessed 2026-11-22), `tables/mock_current_meds.json` (`demo-001`..`demo-005`, every row `"mock": true`), `engine/phenoconvert.py`, `engine/tests/test_phenoconvert.py`, `docs/fixtures/demo-002.contract.json`, `docs/sources.md` (appended CPIC CYP2D6 allele-function, Caudle et al. 2020 threshold, and FDA table rows), `handoff/A7.md`.
Notes: Joins `currentMedications[]` against `tables/cyp_inhibitors.json` after A4/A5/A8 and outside PharmCAT without ever overwriting genetic `phenotype`. CYP2D6 computes genetic activity score from CPIC allele values, applies Thomas et al. 2020 multipliers (`×0.5` moderate, `×0` strong, strongest inhibitor wins), and maps back via CPIC consensus thresholds; non-CYP2D6 genes (e.g. CYP2C19) are flagged (`applied: true`, `inhibitorStrength`, `cause`) without computing a score; unknown drugs are ignored and logged.
Run: `python -m pytest engine/tests/test_phenoconvert.py` (or `python -m unittest discover -s engine/tests -v`) and `python engine/phenoconvert.py --contract docs/fixtures/demo-002.contract.json --dry-run -v`.
Data contract unchanged (`docs/data-contract.schema.json` already defines `currentMedications`, `effectivePhenotype`, and `phenoconversion`). No new runtime dependency (Python 3.12 stdlib only).

## F2 — Blender animation (22 Nov 2026)
Files: `hardware/blender/` (`build_animation.py`, `encode_video.py`, `art/make_video_art.py`, `art/out/vcap_*.png`, `art/out/vcall_*.png`, `anim/t3_anchors.json`, `meyar_anim_t1.blend`, `meyar_anim_t3.blend`, `renders/meyar-f2-kit-turntable-t3-exploded.mp4`, `renders/meyar-f2-contact-sheet.jpg`, `README.md`, `.gitignore`), `handoff/F2.md`.
Notes: A 13.5 s clip (1920 × 1080, 30 fps, H.264, 3.4 MB) for the video's what's-next segment. It has a T1 kit turntable, labelled "Kit design — software working", then a cross-fade to the T3 exploded view, labelled "Concept render — not built", with six design-intent callouts. Each label is baked into its own shot's frames, so a label is on screen for the whole clip. T3's internals are illustrative only, and no number appears apart from the mock kit ID. Reuses the F1 builders. Rendered in EEVEE.
Run: `blender --background --factory-startup --python hardware/blender/build_animation.py -- --shot t1|t3`, then `uv run --no-project python hardware/blender/art/make_video_art.py`, then `uv run --no-project python hardware/blender/encode_video.py` (needs ffmpeg on PATH). See `hardware/blender/README.md`.
Data contract unchanged. No new repo dependency (ffmpeg is a machine tool).

## Review round 1 fixes — A5/A7/A8 (22 Nov 2026)
Files: `engine/coverage.py`, `engine/tests/test_coverage.py`, `tables/mock_current_meds.json`, `docs/fixtures/demo-006.contract.json`, `engine/tests/test_phenoconvert.py`, `engine/gen_vcf.py`, `engine/run_pipeline.sh` (new), `engine/tests/conftest.py` (new), `engine/README.md`.
Notes: Closes findings 3–5 of `docs/REVIEW.md` (findings 1–2 were fixed in PR #11).
- (3, A5) A Tier 1 gene with no defining position assayed now gets `uninformativeNormalRisk: null` with "No defining position assayed for this gene; no score", never `0.0` (VKORC1 showed 0.0 with 0/1 assayed). CYP3A5 0/7 also becomes `null`, but its untested local alleles are still listed. When an untested position has no Goljan Table 1 row, the note says the score is a lower bound and names the rsid.
- (4, A7) The moderate-inhibitor demo moved from demo-004 (CYP2D6 not assessed, so duloxetine could not show) to demo-006: mock outside call `*1/*2x2`, AS 3.0 × 0.5 = 1.5, genetic Ultrarapid → acting like Normal, cause duloxetine (patient-entered). demo-004 now has no current medicines, and the design showcase's "demo-004 CYP2D6 not assessed" example still holds. The fixture's A7 fields were generated by `phenoconvert.py`.
- (5, A1/tests) `gen_vcf.py` no longer overwrites a committed `*.outside.tsv` (A8-owned) and its seed matches A8's header (`v0.1-demo`). `engine/run_pipeline.sh` runs the whole chain in order. Tests that need gitignored outputs report SKIPPED under a "NOT A FULL PASS" banner instead of a bare `FileNotFoundError`.
Run: `bash engine/run_pipeline.sh && python -m pytest engine/tests`.
Data contract unchanged. No new runtime dependency.

## B2 — CDS Hooks order-sign service (22 Nov 2026)
Files: `cds/server.js`, `cds/lib/cpic.js`, `cds/lib/phenotypes.js`, `cds/lib/cards.js`, `cds/test/cds.test.js`, `cds/package.json`, `cds/README.md`, `handoff/B2.md`.
Notes: Zero-dependency Node 22 LTS CDS Hooks 2.0.1 service on port `3000` exposing `GET /cds-services` (`meyar-pgx` on `order-sign`, `meyar-pgx-select` on `order-select`; rejects deprecated `medication-prescribe`), `POST /cds-services/meyar-pgx`, `POST /cds-services/meyar-pgx-select`, `GET /health`, `OPTIONS` CORS for `sandbox.cds-hooks.org` / local `8081`, and read-only `/design/*`. Resolves phenotypes in priority order: CDS Hooks `prefetch.pgxObservations` → local HAPI FHIR (`FHIR_BASE`, bounded timeout, never public `hapi.fhir.org`) → `engine/data/out/*.contract.json` (and `docs/fixtures/*.contract.json` fallback), enforcing A6 germline-only guard, A8 SV-gene not-assessed safety, A7 phenoconversion dual-phenotype display, and strict verbatim CPIC lookup from `tables/cpic_recommendations.json`.
Run: `docker compose up -d --build hapi cds` (or `cd cds && node server.js`), test with `cd cds && node --test test/*.test.js`, verify `curl http://localhost:3000/cds-services` and `POST http://localhost:3000/cds-services/meyar-pgx` (`demo-001` clopidogrel returns a `CYP2C19 Poor Metabolizer` card via HAPI in about 0.1 s, and via contract fallback with HAPI stopped in about 0.42 s).
Review fixes (`prompts/REVIEW-opus-5.5.md` applied to B2, 22 Nov 2026), files `cds/lib/cards.js`, `cds/lib/cpic.js`, `cds/lib/phenotypes.js`, `cds/server.js`, `cds/test/cds.test.js`, `cds/README.md`, `docs/requests.md`, `handoff/B2.md`:
- Clopidogrel with no indication on the order no longer silently uses the ACS/PCI row and offers prasugrel (contraindicated after stroke/TIA, per the table's own CPIC comment). The row is marked assumed, the other indications' rows are listed verbatim, and only alternatives valid under every indication are offered. "Ischemic heart disease" no longer maps to the neurovascular row.
- Cards with suggestions now carry `selectionBehavior: "at-most-one"` (CDS Hooks 2.0 MUST). Suggestions carry `subject`. Drug-class alternatives are text only, not fake `create` orders.
- `indicator` is derived from the table (CYP2C9 Poor Metabolizer celecoxib/ibuprofen was `info`; it is now `warning`).
- A7: the genetic-phenotype row is also quoted ("applies if <drug> is stopped"), so demo-006's duloxetine-masked Ultrarapid result is not hidden.
- A5 Tier 1/2 `saudiDataNote` is always printed. Outside-call cards name the (mock) caller. Every card carries a "Demo data" label. Gene with `No Result` → explicit not-checked card.
- A malformed `%` URI no longer crashes the process (unhandled rejection). Oversized bodies get a clean 413. Codes without the RxNorm system are not read as RxCUIs. Combination products check every table drug. Prefetch is limited to code-filtered genotype Observations.
- 26/26 tests pass (Node 22.23.3 in the compose image; Node 24 on host).
- Request for a `/data/fixtures` compose mount logged in `docs/requests.md`.
Data contract unchanged. No new runtime dependency.

## B3 — Non-interruptive prescriber card (22 Nov 2026)
Files: `cds/lib/cpic.js`, `cds/lib/phenotypes.js`, `cds/lib/cards.js`, `cds/server.js`, `cds/test/cds.test.js`, `cds/README.md`, `handoff/B3.md`.
Notes: Enforces `design/README.md` §7 card JSON grammar (`summary` < 140 chars, `indicator` `warning` | `info`, `**Genetic:**` / `**Acting like:**`, verbatim CPIC quote, guaranteed A5 coverage line, `_Advises, does not prescribe. <guidelineVersion>._`, `source.label` `"Meyar (research prototype)"`). Adds one-tap `Send to pharmacist` FHIR `Task` suggestion, oncology `"Germline result — tumour profiling is separate."` notice, and first-`order-sign` backward sweep over active `MedicationStatement`s (`prefetch.currentMedications` → local HAPI FHIR → contract `currentMedications`) returning cards for affected current drugs (e.g. `SLCO1B1` Decreased Function on `simvastatin`).
Run: `node design/build-tokens.mjs` (62/62 contrast pairs pass), `cd cds && node --test test/cds.test.js` (18/18 pass), `docker compose up -d --build hapi cds`.
Data contract unchanged. No new runtime dependency.


## C1 — Arabic-first patient screen (Medication Passport)
- **Files added/changed:**
  - `passport/package.json`, `passport/vite.config.js`, `passport/index.html`
  - `passport/src/main.js`, `passport/src/render.js`, `passport/src/lookup.js`, `passport/src/i18n.js`, `passport/src/app.css`
  - `passport/public/demo/demo-001.contract.json`, `demo-002.contract.json`, `demo-006.contract.json`
  - `handoff/C1.md` (`Status: DONE`)
- **How to run:**
  - `node design/build-tokens.mjs`
  - `cd passport && npm install && npm run dev` (serves on `http://localhost:5173`)
  - On Windows PowerShell if `npm.ps1` is restricted, use `npm.cmd`.
- **Notes:** Built strictly from `design/` (`@design` Vite alias); reads `tables/cpic_recommendations.json` and `tables/saudi_frequencies.json` read-only. Data contract unchanged. No new runtime dependency (`vite` devDependency only).
