# cds/ — Meyar CDS Hooks 2.0.1 Service

> Research prototype — not for clinical use. Runs on synthetic and GeT-RM reference data; no patient data was used.

Node 22 LTS (stdlib only, zero external runtime dependencies) CDS Hooks 2.0.1 service listening on port **3000**.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/cds-services` | CDS Hooks 2.0.1 discovery (`meyar-pgx` on `order-sign`; `meyar-pgx-select` on `order-select`). Never uses deprecated `medication-prescribe`. |
| `POST` | `/cds-services/meyar-pgx` | Evaluates `order-sign` `draftOrders` against stored germline phenotypes and `tables/cpic_recommendations.json`. |
| `POST` | `/cds-services/meyar-pgx-select` | Evaluates `order-select` selected draft orders. |
| `GET` | `/health` | Health and loaded table summary. |
| `GET` | `/design/*` | Read-only static serving of `design/` (for B4/B5 surfaces). |

## Phenotype resolution order

1. **CDS Hooks prefetch** (`prefetch.pgxObservations` FHIR R4 Genomics Reporting IG `Observation` Bundle).
2. **Local HAPI FHIR** (`FHIR_BASE`, default `http://hapi:8080/fhir` inside Docker Compose or `http://localhost:8080/fhir` locally; never contacts public `hapi.fhir.org`), with a bounded timeout (`FHIR_TIMEOUT_MS`, default `400` ms) so responses stay under 1 s.
3. **Contract JSON fallback**: `engine/data/out/<patientId>.contract.json` (`/data/contracts` in Compose), falling back to `docs/fixtures/<patientId>.contract.json` on a fresh checkout.

Clinical safety rules enforced on every request:
- **A6 germline-only gate:** refuses non-germline contracts (`sampleOrigin !== "germline"`) and non-germline FHIR Observations (`LOINC 48002-0 !== LA6683-2`).
- **A8 structural-variation gate:** genes in `tables/sv_genes.json` (`CYP2D6`) with `not-assessed` / no outside call never return a Normal phenotype; they return `"copy number not assessed by this test — no result reported"`.
- **A7 phenoconversion:** lookups use `effectivePhenotype` when `phenoconversion.applied === true`, while always displaying both genetic and effective phenotypes.
- **Lookup only (B1):** every recommendation and alternative comes verbatim from `tables/cpic_recommendations.json`.
- **Backward sweep (B3):** on the first `order-sign` for a patient, active `MedicationStatement`s (`prefetch.currentMedications` → local HAPI FHIR → contract `currentMedications`) are checked for affected drugs already taken (e.g., statins with `SLCO1B1` Decreased Function).
- **One-tap pharmacist escalation & oncology note (B3):** actionable cards include a `Send to pharmacist` FHIR `Task` suggestion, and oncology PGx cards print `Germline result — tumour profiling is separate.`

## Run locally (Node 22 LTS)

```bash
cd cds
npm start
# in another terminal:
curl -s http://localhost:3000/cds-services
```

## Run tests

```bash
cd cds
npm test
```

## Run with Docker Compose

```bash
docker compose up -d --build hapi cds
curl -s http://localhost:3000/cds-services
```

## CDS Hooks Sandbox

Point [sandbox.cds-hooks.org](https://sandbox.cds-hooks.org) (or a local sandbox on port `8081`) at:

```text
http://localhost:3000/cds-services
```

CORS headers (`Access-Control-Allow-Origin: *`, `GET, POST, OPTIONS`) are enabled on all endpoints.
