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
Files: `tables/cpic_recommendations.json` (169 rows, 18 drugs), `tables/cpic_recommendations.schema.json`, `handoff/B1.md`.
Notes: Text copied verbatim from the CPIC API (`api.cpicpgx.org/v1/recommendation`): clopidogrel 2022, PPIs 2020, NSAIDs 2020, opioids (codeine, tramadol) 2021, statins 2022. Rows keyed by phenotype per gene plus indication (`population`); `alternatives` filled only where the row text names one (`kind: drug` vs `kind: class`). Open gaps are listed in `_gaps`: warfarin (algorithm-based, no verbatim machine-readable source) and DPWG (not retrieved), so the table is CPIC-only.
Run: `uv run --with jsonschema python -c "import json;from jsonschema import Draft202012Validator as V;V(json.load(open('tables/cpic_recommendations.schema.json'))).validate(json.load(open('tables/cpic_recommendations.json',encoding='utf8')))"` (no output = valid).
Data contract unchanged. No new runtime dependency.
