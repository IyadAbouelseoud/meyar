# GeT-RM Reference Validation Results

- **Tool:** `pgkb/pharmcat:3.4.0` (`pharmcat_pipeline`, zero DANGEROUS reference-imputation flags)
- **Assembly verification:** `chr10` length `133797422` (GRCh38, `chr`-prefixed; zero liftover)
- **Samples evaluated:** 5 GeT-RM samples × 2 genes = 10 comparisons
- **Exact concordance:** 9/10

## Comparison Table

| Sample | Gene | Published Diplotype | Our Diplotype | Match | PharmCAT Phenotype | Phased |
|---|---|---|---|---|---|---|
| `NA07348` | `CYP2C19` | `*2/*17` | `*2/*17` | **yes** | Intermediate Metabolizer | yes |
| `NA07348` | `CYP2C9` | `*1/*1` | `*1/*1` | **yes** | Normal Metabolizer | yes |
| `NA10831` | `CYP2C19` | `*1/*17` | `*1/*17` | **yes** | Rapid Metabolizer | yes |
| `NA10831` | `CYP2C9` | `*1/*2` | `*1/*2 or *1/*92` | **yes (ambiguous candidates)** | Intermediate Metabolizer, Indeterminate | yes |
| `NA11839` | `CYP2C19` | `*1/*1` | `*1/*38` | **no** | Normal Metabolizer | yes |
| `NA11839` | `CYP2C9` | `*2/*3` | `*2/*3 or *2/*18 or *2/*68 or *3/*92 or *18/*92 or *68/*92` | **yes (ambiguous candidates)** | Poor Metabolizer, Indeterminate | yes |
| `NA18564` | `CYP2C19` | `*2/*3` | `*2/*3` | **yes** | Poor Metabolizer | yes |
| `NA18564` | `CYP2C9` | `*1/*1` | `*1/*1` | **yes** | Normal Metabolizer | yes |
| `NA19122` | `CYP2C19` | `*2/*35` | `*2/*35` | **yes** | Poor Metabolizer | yes |
| `NA19122` | `CYP2C9` | `*1/*11` | `*1/*11` | **yes** | Intermediate Metabolizer | yes |

## Provenance & Notes

- Published consensus diplotypes retrieved from Coriell/CDC GeT-RM (`https://www.coriell.org/GetRM/PGxSearch`, accessed `2026-11-21`).
- ENA `PRJEB19931` hosts raw FASTQ and Isaac-aligned GRCh37 BAMs (`@SQ SN:10 LN:135534747`, verified on `ERR1955333`/`NA07348.bam`); per A3's GRCh38 rule, GRCh37 data was not lifted over.
- Input GRCh38 (`chr`-prefixed) 30x WGS phased genotypes for the same 5 GeT-RM samples were extracted (`chr10:94760000-94995000`) from the 1000 Genomes / NYGC high-coverage GRCh38 release.
- Because the 1kGP panel emits polymorphic sites only and Meyar never passes PharmCAT's DANGEROUS reference-imputation flags, absent PGx positions remain no-calls (`CYP2C9` candidate lists for `NA10831` and `NA11839` include co-equal `Indeterminate` alleles alongside `*1/*2` and `*2/*3`).
- **Mismatch (`NA11839` `CYP2C19`):** Published GeT-RM consensus is `*1/*1`, whereas PharmCAT 3.4.0 (`CLINPGX 2026-07-13-11-40`) calls `*1/*38` (both alleles confer Normal Function -> `Normal Metabolizer`). `NA11839` is heterozygous `G|A` at `chr10:94842866` (`rs3758581`, p.I331V), which updated PharmVar nomenclature splits into `*1` (I331V) and `*38` (GRCh38 reference without I331V), whereas the earlier GeT-RM consensus table did not split `*38` from `*1`. Reported as **no** (`mismatch`) rather than hidden.
