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
| `GET` | `/dashboard` | Live clinician alert log and counts dashboard (`data-theme="instrument"`). |
| `GET` | `/dashboard/data` | JSON summary of `cds/data/alerts.jsonl` (`?range=today|week`). |
| `POST` | `/alerts/action` | Logs prescriber response (`accepted`, `pharmacist`, `dismissed`) to `cds/data/alerts.jsonl`. |

## Phenotype resolution order

1. **CDS Hooks prefetch** (`prefetch.pgxObservations`: genotype `Observation`s, LOINC `84413-4`, FHIR R4 Genomics Reporting IG).
2. **Local HAPI FHIR** (`FHIR_BASE`, default `http://hapi:8080/fhir` inside Docker Compose or `http://localhost:8080/fhir` locally; never contacts public `hapi.fhir.org`), with a bounded timeout (`FHIR_TIMEOUT_MS`, default `400` ms) so responses stay under 1 s. The request's `fhirServer` is deliberately not used.
3. **Contract JSON fallback**: `engine/data/out/<patientId>.contract.json` (`/data/contracts` in Compose), then `docs/fixtures/<patientId>.contract.json`. Compose mounts `docs/fixtures` at `/data/fixtures`, so this works on a fresh checkout both inside and outside Docker.

When FHIR answers, the contract still supplies A5 coverage, A7 phenoconversion and A8 callability for each gene.

Clinical safety rules enforced on every request:
- **A6 germline-only gate:** refuses non-germline contracts (`sampleOrigin !== "germline"`) and non-germline FHIR Observations (`LOINC 48002-0 !== LA6683-2`) with `422`.
- **A8 structural-variation gate:** genes in `tables/sv_genes.json` (`CYP2D6`) with `not-assessed` / no outside call never return a phenotype; the card says `"copy number not assessed by this test — no result reported"`. An outside-call result names its (mock) caller on the card.
- **No silent gaps:** a gene a drug's CPIC rows need, with `No Result` or no record, gets an `info` card saying the order was not checked — never silence that reads as normal.
- **A7 phenoconversion:** lookups use `effectivePhenotype` when `phenoconversion.applied === true`; the card always shows both results, and also quotes the genetic phenotype's CPIC row ("applies if <drug> is stopped") so an inhibitor never hides a genetic risk.
- **Lookup only (B1):** every recommendation and alternative comes verbatim from `tables/cpic_recommendations.json`.
- **Backward sweep (B3):** on the first `order-sign` for a patient, active `MedicationStatement`s (`prefetch.currentMedications` → local HAPI FHIR → contract `currentMedications`) are checked for affected drugs already taken (e.g., statins with `SLCO1B1` Decreased Function).
- **One-tap pharmacist escalation & oncology note (B3):** actionable cards include a `Send to pharmacist` FHIR `Task` suggestion, and oncology PGx cards print `Germline result — tumour profiling is separate.`

## Card rules

- `indicator` is decided from the table, not keywords: `info` when CPIC says "No recommendation", the phenotype is Normal, or the row's text matches the Normal row for the same drug and indication; `warning` otherwise. Never `critical`.
- **Indication-stratified drugs (clopidogrel):** the CPIC population comes from the order's `reasonCode` (stroke/TIA → NVI; stable CAD/PAD → CVI non-ACS non-PCI; ACS/PCI/MI → CVI ACS PCI). With no indication, the ACS/PCI row is shown **marked as assumed**, the other indications' rows are listed verbatim, and only alternatives CPIC names under every indication are offered — so prasugrel (contraindicated after stroke/TIA) is never one click away for an unknown indication.
- Suggestions are created only for named drugs in a row's `alternatives`; a drug-class alternative ("non-tramadol opioid") is shown as text, never as an orderable `create` action. When suggestions exist the card carries `selectionBehavior: "at-most-one"` (CDS Hooks 2.0: MUST be provided with suggestions).
- Every card ends with `Demo data · Advises, does not prescribe. <guidelineVersion> · Research prototype — not for clinical use.`

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

Future deployment step (not a blocker for the mock-data demo): CDS Hooks JWT authentication of the calling EHR, and any SFDA / PDPL / NPHIES requirements, are not implemented in this prototype.
