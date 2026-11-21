# engine/

PharmCAT wrapper, A5 coverage flag, A6 germline guard, A7 phenoconversion, A8 structural-variant gate. `engine/data/` is mounted into the PharmCAT container. Tasks A1–A8.

Build prompts: see `prompts/`.

## A1 — Synthetic GRCh38 VCF generator (`engine/gen_vcf.py`)

Generates GRCh38 (`chr`-prefixed) VCFv4.2 inputs and `.origin.json` germline tags for `demo-001`..`demo-006` without patient data. Every locus (`CHROM`, `POS`, `ID`, `REF`, `ALT`, `PX`) and haplotype allele mapping is extracted directly from `pgkb/pharmcat:3.4.0` (`/pharmcat/pharmcat_positions.vcf` and `*_translation.json` inside `pharmcat.jar`, source `CLINPGX 2026-07-13-11-40`).

### Run & validate

```bash
python engine/gen_vcf.py --all
```

Validate headers and records with `bcftools 1.24` (inside `pgkb/pharmcat:3.4.0` if not installed on the host):

```bash
docker run --rm -v "$PWD/engine/data/in:/in:ro" pgkb/pharmcat:3.4.0 bash -c 'for f in /in/*.vcf; do bcftools view -h "$f" >/dev/null && echo "OK $f"; done'
```

### Generated demo cohort (`engine/data/in/`)

All patients emit `<patientId>.origin.json` containing `{"sampleOrigin": "germline"}` (read by the A6 germline guard) and cover 241 PharmCAT 3.4.0 defining positions across `DPYD` (83), `CYP2C19` (35), `CYP2C9` (88), and `SLCO1B1` (35), except `demo-006` which is deliberately incomplete (236 positions).

| Patient ID | Intended Diplotypes (VCF) | Special / Outside-Call File | Notes |
|---|---|---|---|
| `demo-001` | `CYP2C19 *2/*2`, `CYP2C9 *1/*1`, `SLCO1B1 *1/*1`, `DPYD Reference/Reference` | — | Complete VCF (241/241 positions). Matches `docs/fixtures/demo-001.contract.json` (`CYP2C19` Poor Metabolizer). |
| `demo-002` | `CYP2C19 *1/*1`, `CYP2C9 *1/*1`, `SLCO1B1 *1/*1`, `DPYD Reference/Reference` | — | Complete VCF (241/241 positions). Pairs with A7/A8 mock `CYP2D6 *1/*1` outside-call for paroxetine phenoconversion. |
| `demo-003` | `CYP2C19 *1/*17`, `SLCO1B1 *1/*5` (`rs4149056` `T>C`), `CYP2C9 *1/*1`, `DPYD Reference/Reference` | — | Complete VCF (241/241 positions). Covers `CYP2C19 *1/*17` and `SLCO1B1` decreased-function `rs4149056` C allele. |
| `demo-004` | `CYP2C19 *17/*17`, `CYP2C9 *1/*2` (`rs1799853` `C>T`), `SLCO1B1 *1/*1`, `DPYD Reference/Reference` | — | Complete VCF (241/241 positions). Covers `CYP2C19 *17/*17` and `CYP2C9 *1/*2`. |
| `demo-005` | `CYP2C9 *2/*3` (phased trans: `1\|0` at `rs1799853`, `0\|1` at `rs1057910`), `DPYD Reference / c.1905+1G>A (*2A)` (`rs3918290` `C>T`), `CYP2C19 *1/*1`, `SLCO1B1 *1/*1` | — | Complete VCF (241/241 positions). See `DPYD c.257C>T` note below. |
| `demo-006` | `CYP2C19 *1/*1` (32/35 positions), `CYP2C9 *1/*1` (86/88 positions), `SLCO1B1 *1/*1` (35/35), `DPYD Reference/Reference` (83/83) | `demo-006.outside.tsv` (`# mock: true`, `CYP2D6\t*1/*2x2`) | Deliberately incomplete VCF (236/241 positions) for A5 coverage gap + mock `CYP2D6` duplication outside-call. |

### Deliberately missing positions in `demo-006.vcf` (for A5 coverage testing)

Absent positions are left out of the VCF rather than imputed as reference (PharmCAT treats absent positions as no-calls; the PharmCAT flags labelled DANGEROUS in its docs are NEVER used):

- **CYP2C19 (3 of 35 positions omitted; 32 assayed):**
  - `chr10:94762706` (`rs28399504`, `A>G`) — defines `*4`
  - `chr10:94762760` (`rs17882687`, `A>C`) — defines `*15` / `*35`
  - `chr10:94780653` (`rs4986893`, `G>A`) — defines `*3`
- **CYP2C9 (2 of 88 positions omitted; 86 assayed):**
  - `chr10:94942290` (`rs1799853`, `C>T`) — defines `*2`
  - `chr10:94981296` (`rs1057910`, `A>C`) — defines `*3`

### Why CYP2D6 copy number uses `demo-006.outside.tsv`

Plain SNP/INDEL VCFs cannot represent `CYP2D6` whole-gene duplications, deletions (`*5`), or `CYP2D6/CYP2D7` hybrids (`*13`, `*68`). PharmCAT's own documentation states that its `NamedAlleleMatcher` does not support structural variants or gene copy number and recommends not calling `CYP2D6` from VCF. Accordingly, `demo-006`'s duplication (`CYP2D6\t*1/*2x2`) is provided in `engine/data/in/demo-006.outside.tsv` (tagged `# mock: true`) for PharmCAT's outside-call file option (`-po` / `--phenotyper-outside-call-file`).

### Note on `DPYD c.257C>T` vs PharmCAT 3.4.0 definitions

`DPYD c.257C>T` (see `docs/research/02-saudi-genetics.md`) is **not** present in PharmCAT 3.4.0's bundled `DPYD_translation.json` (`CLINPGX 2026-07-13-11-40`, 83 defining variants) or `/pharmcat/pharmcat_positions.vcf`. Because all A1 coordinates and REF/ALT alleles must come strictly from PharmCAT 3.4.0's bundled allele definition files (never typed from memory), `demo-005.vcf` instead carries the PharmCAT 3.4.0-defined actionable variant `DPYD c.1905+1G>A (*2A)` (`chr1:97450058`, `rs3918290`, `C>T`), and records `DPYD c.257C>T` as absent from PharmCAT 3.4.0's default panel.
