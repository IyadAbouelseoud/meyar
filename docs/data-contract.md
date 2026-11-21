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
      "guidelineVersion": "CPIC 2022-11",
      "callability": {
        "method": "vcf",
        "svAssessed": false
      }
    },
    {
      "gene": "CYP2D6",
      "diplotype": null,
      "phenotype": null,
      "candidates": [],
      "coverage": {
        "definingPositionsAssayed": 0,
        "definingPositionsTotal": 0,
        "untestedLocalAlleles": [],
        "uninformativeNormalRisk": null,
        "saudiDataTier": 0,
        "saudiDataNote": "No A5 score (Tier 0): structural-variation gene owned by A8; excluded from Goljan et al. 2022 because deletions, duplications and hybrids could not be called."
      },
      "guidelineVersion": "CPIC PharmCAT 3.4.0",
      "callability": {
        "method": "not-assessed",
        "svAssessed": false,
        "reason": "PharmCAT documentation: 'we do NOT recommend calling CYP2D6 from VCF' because of 'the large influence of structural variation (SV) and copy number variation (CNV) on inferring CYP2D6 phenotype'; 'CYP2D6 UMs cannot be called using only SNPs and INDELs in a VCF file'; and 'missing the copy number of a normal or decreased function allele can misrepresent a normal metabolizer (NM)'.",
        "requiredInput": "WGS BAM/CRAM with a CNV-aware caller, or a lab report"
      }
    }
  ]
}
```

- `sampleOrigin` was added on 21 Nov for the germline-only guard (A6). It must be `"germline"`; anything else is rejected.
- `candidates` lists every viable diplotype PharmCAT returned (or `[]` when `callability.method` is `"not-assessed"`). A5 never chooses between them.
- `coverage` is written by A5 only (`saudiDataTier`: `0 | 1 | 2`, `saudiDataNote`, and `uninformativeNormalRisk: number | null`).
- `callability` is written by A8 (`engine/sv_gate.py`):
  - `method`: `"vcf"` (VCF-called non-SV gene, `svAssessed: false`), `"outside-call"` (from PharmCAT `-po` outside-call file, `svAssessed: true` for SV genes, `source` copied from the `.outside.tsv` header comment), or `"not-assessed"` (gene in `tables/sv_genes.json` with no outside call, `svAssessed: false`, `reason` quoted from `tables/sv_genes.json`, `requiredInput`, and both `diplotype` and `phenotype` set to `null`).
- The 0.04 and position counts in the `CYP2C19` fixture are illustrative fixture values, not real frequencies. Real values come from `tables/saudi_frequencies.json`, every row with a citation.
