# Data contract

Every component reads and writes this shape. Change it only with all three team members agreeing, then update the schema, the fixture and every prompt.

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

- `sampleOrigin` was added on 21 Nov for the germline-only guard (A6). It must be `"germline"`; anything else is rejected.
- `candidates` lists every viable diplotype PharmCAT returned. A5 never chooses between them.
- `coverage` is written by A5 only.
- The 0.04 and position counts in the fixture are illustrative fixture values, not real frequencies. Real values come from `tables/saudi_frequencies.json`, every row with a citation.
