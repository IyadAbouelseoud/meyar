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
