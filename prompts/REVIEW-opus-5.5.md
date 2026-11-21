# Full review — Meyar repo

**Paste into:** Claude Code, model Opus 5.5, opened on the `meyar` repo after the build tasks are merged. Run it again before the 25 Nov submission.

---

<role>You are a senior reviewer combining three lenses: clinical pharmacogenomics accuracy, software correctness, and hackathon-submission readiness. You report; you do not rewrite the project.</role>

<context>
## Context (carry forward — locked decisions, do not change)
- Product: Meyar (مِعيار), "The right dose, the first time" (الجرعة الصحيحة من أول مرة). KKU Health Innovation Hackathon, track Predictive Healthcare, deadline 25 Nov 2026. Team of 3. Research prototype, not for clinical use; synthetic and GeT-RM reference data only, no patient data.
- Architecture: genotype source (lab, regional array, chain-of-custody saliva kit) → germline-only gate (A6) → PharmCAT 3.4.0 in Docker, batch, once → FHIR phenotype store (HAPI, Genomics Reporting IG) → A5 coverage flag (separate arithmetic step, NEVER inside PharmCAT) → two outputs: CDS Hooks 2.0.1 order-sign card (non-interruptive, with backward sweep) and the Arabic Medication Passport (offline, PIN-encrypted QR that encodes the payload itself, not a URL).
- Repo `meyar/`: engine/, cds/, passport/, kit/, hardware/, tables/ (shared, ONE OWNER PER FILE), docs/, prompts/. Ports are fixed: HAPI 8080, CDS service 3000, CDS Hooks sandbox 8081, passport 5173. Pinned: pgkb/pharmcat:3.4.0, hapiproject/hapi:v8.12.0-2, bcftools 1.24, Node 22 LTS, Python 3.12.
- Do NOT install: Java (PharmCAT runs in Docker), Kubernetes, any database server, React Native.

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

Tasks that should exist, each with its prompt in prompts/<ID>.md: A1, A2, A3, A4, A5, A6, B1, B2, B3, B4, B5, C1, C2, C3, C4, C5, C6, C7, C8, D1, D2, D3, D4, D5, E1, E2, E3, F1, F2, F3, F4, F5.
</context>

<task>
Audit the whole repository against the build prompts in prompts/ and the context above. For each task ID, read its prompt's "Done when" list and check each box with real evidence: run the command, run the tests, start `docker compose up -d`, curl the endpoints, open the passport. Then run these cross-cutting checks:
1. Data contract: every contract.json and every reader/writer matches docs/data-contract.schema.json.
2. Killed claims: grep code, UI strings, docs and poster text for every item in the "Never say" list.
3. Numbers: every number in UI strings, docs/ and poster text has a row in docs/sources.md with a citation.
4. A5 integrity: no code path changes a diplotype from population frequency; all candidates are shown.
5. Safety: dosing comes only from tables/cpic_recommendations.json; no LLM call produces advice; no DANGEROUS PharmCAT flag.
6. A6: somatic input is rejected; every Observation carries genomic source class germline.
7. C8: crypto parameters match docs/qr-envelope.md; wrong PIN fails; README states the offline brute-force limit honestly.
8. Hardware: every render and video frame of hardware carries its status label; nothing not built is shown as built.
9. Ports and versions match the README exactly.
10. Mandatory lines present: "Research prototype — not for clinical use." and "Runs on synthetic and GeT-RM reference data; no patient data was used."
</task>

<constraints>
- Only read and run. Do not edit files, commit, push or open PRs unless I ask after reading the report.
- Ground every finding in a file path and line, or a command and its output. If you could not check something, say so and why.
- Do not report style preferences as defects.
</constraints>

<output_format>
Write docs/REVIEW.md with:
1. Verdict in one line: ready / ready with fixes / not ready.
2. Table: task ID, status (pass / fail / not built / could not check), evidence.
3. Findings ranked by severity (blocks submission / wrong in front of a judge / minor), each with path:line, what is wrong, and the smallest fix.
4. Cross-cutting checks 1–10, each pass or fail with evidence.
Then print the verdict and the top five findings in the terminal.
</output_format>

Stop after writing docs/REVIEW.md. If the stack will not start after two attempts, stop and report the error instead of debugging it.
