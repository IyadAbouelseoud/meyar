# Requests to table owners

Write here instead of editing a table you do not own.

## A8 — Data contract extension (`callability`) and display rules (22 Nov 2026)

- **Contract change (approved, recorded in `CHANGES.md` under `## A8`):**
  - `docs/data-contract.schema.json` now allows `diplotype` and `phenotype` to be `string | null` and `candidates` to be `[]` when a structural-variation gene is not assessed.
  - Every gene entry carries `callability`:
    - `{ "method": "vcf", "svAssessed": false }` for non-SV genes called from VCF.
    - `{ "method": "outside-call", "svAssessed": true, "source": "<header source>" }` for SV genes ingested via PharmCAT `-po`.
    - `{ "method": "not-assessed", "svAssessed": false, "reason": "<quoted PharmCAT justification>", "requiredInput": "WGS BAM/CRAM with a CNV-aware caller, or a lab report" }` when no outside call exists for a gene in `tables/sv_genes.json` (with `diplotype: null`, `phenotype: null`, `candidates: []`).
- **Display rule for B3 / B6 (CDS Hooks cards & clinician view) and C1 / C9 (Medication Passport):**
  - When `callability.method === "not-assessed"` (or `phenotype === null` for a gene in `tables/sv_genes.json`), display:
    **"CYP2D6: copy number not assessed by this test — no result reported"** (or `<gene>: copy number not assessed by this test — no result reported`), with `callability.reason` and `callability.requiredInput` available in details.
  - **Never** show a normal result, **never** show a reassurance, and on the Meyar Scale render the hatched no-marker state (`AGENTS.md` §11).
- **Note for A4 (`engine/load_fhir.py`):**
  - When writing FHIR `Observation` resources for a gene whose `callability.method === "not-assessed"`, avoid emitting a `"No Result"` or `"Normal Metabolizer"` clinical interpretation that could be misread as assessed; or invoke `engine/sv_gate.py` before/alongside `load_fhir.py`.

## B2 — mount the contract fixtures into the `cds` container (22 Nov 2026)

- **To:** whoever owns `docker-compose.yml` (team decision; B2's scope lock is `cds/` only).
- **Ask:** add `- ./docs/fixtures:/data/fixtures:ro` to the `cds` service `volumes`.
- **Why:** `cds/lib/phenotypes.js` falls back to `docs/fixtures/<patientId>.contract.json` when `engine/data/out/` has no contract (fresh checkout, pipeline not run). Outside Docker that path resolves on its own; inside the container `docs/` is not in the build context, so the service now looks for `/data/fixtures` and finds nothing until this mount exists. Without it, a fresh-checkout `docker compose up` with an empty HAPI returns no cards.
- **Until then:** run `bash engine/run_pipeline.sh` first (fills `engine/data/out/`, already mounted at `/data/contracts`).
