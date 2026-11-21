# GeT-RM Reference Validation (`engine/validation/`)

Validates Meyar's `pgkb/pharmcat:3.4.0` pipeline against published CDC/Coriell GeT-RM consensus diplotypes for **5 reference samples** covering both `CYP2C19` and `CYP2C9`.

## Selected GeT-RM Samples (accessed `2026-11-21`)

| Sample ID | Population | ENA `PRJEB19931` Run | GeT-RM `CYP2C19` | GeT-RM `CYP2C9` |
|---|---|---|---|---|
| `NA07348` | CEPH/Utah Pedigree 1345 | `ERR1955333` | `*2/*17` | `*1/*1` |
| `NA10831` | CEPH/Utah Pedigree 1424 | `ERR1955335` | `*1/*17` | `*1/*2` |
| `NA11839` | CEPH/Utah Pedigree 1349 | `ERR1955340` | `*1/*1` | `*2/*3` |
| `NA18564` | Han Chinese in Beijing, China | `ERR1955358` | `*2/*3` | `*1/*1` |
| `NA19122` | Yoruba in Ibadan, Nigeria | `ERR1955375` | `*2/*35` | `*1/*11` |

## Sources & GRCh38 Assembly Verification

1. **Published GeT-RM consensus genotypes** (accessed `2026-11-21`):
   - Coriell Institute / CDC GeT-RM PGx Search: `https://www.coriell.org/GetRM/PGxSearch`
   - Underlying endpoints queried: `https://www.coriell.org/GeTRM/PGxSearch` (`Gene_Id=8` for `CYP2C19`, `Gene_Id=7` for `CYP2C9`) and `https://www.coriell.org/GeTRM/getStarAlleleSamplesByGene`
   - Stored in [`data/consensus_getrm.json`](data/consensus_getrm.json) (includes `https://pubmed.ncbi.nlm.nih.gov/35134542/` for updated 2022 GeT-RM calls on `NA11839` `CYP2C9` and `NA19122` `CYP2C19`).

2. **ENA `PRJEB19931` raw cohort check** (accessed `2026-11-21`):
   - Source URL: `https://www.ebi.ac.uk/ena/browser/view/PRJEB19931` (70 GeT-RM WGS samples).
   - Header inspection of `http://ftp.sra.ebi.ac.uk/vol1/run/ERR195/ERR1955333/NA07348.bam` showed Isaac alignment against Ensembl **GRCh37** (`@SQ SN:10 LN:135534747`, no `chr` prefixes) and raw FASTQ/BAM only (no VCFs).
   - Per A3's rule ("Data must be GRCh38 with chr prefixes; if the source is GRCh37, stop and report rather than lifting over silently"), we did **not** lift over `PRJEB19931` GRCh37 BAMs.

3. **GRCh38 (`chr`-prefixed) 30x WGS genotypes downloaded** (accessed `2026-11-21`):
   - Source URL: `https://ftp.1000genomes.ebi.ac.uk/vol1/ftp/data_collections/1000G_2504_high_coverage/working/20220422_3202_phased_SNV_INDEL_SV/1kGP_high_coverage_Illumina.chr10.filtered.SNV_INDEL_SV_phased_panel.vcf.gz`
   - Only the 5 target samples and the `CYP2C19` + `CYP2C9` locus (`chr10:94760000-94995000`) are streamed via `bcftools view` into `data/in/getrm_5samples_chr10_cyp2c.vcf.gz`.
   - `run_validation.py` verifies `##contig=<ID=chr10,length=133797422>` and `chr`-prefixed records before invoking PharmCAT, and aborts if GRCh37 (`length=135534747` or unprefixed contigs) is ever encountered.

## How to Run

Requires Docker (`pgkb/pharmcat:3.4.0`) and Python 3.12+:

```bash
python engine/validation/run_validation.py
```

Pass `--refresh` to re-stream the 5-sample GRCh38 VCF slice from IGSR/1000 Genomes. Outputs (`.match.json`, `.phenotype.json`, `.report.html`, `.missing_pgx_var.vcf`) are written under `engine/validation/data/out/` (gitignored), and the comparison table is written to [`results.md`](results.md).

## PharmCAT Safety Checks

- Zero DANGEROUS reference-imputation flags (absent positions remain no-calls).
- `-del` is not passed, preserving `.match.json` and `.phenotype.json` for auditable candidate and phenotype extraction.
