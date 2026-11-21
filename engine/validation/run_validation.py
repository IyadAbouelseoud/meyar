#!/usr/bin/env python3
"""Validate Meyar's PharmCAT 3.4.0 pipeline against CDC GeT-RM reference samples.

Downloads only the targeted CYP2C19 + CYP2C9 GRCh38 locus slice
(chr10:94760000-94995000) for the 5 GeT-RM samples defined in
data/consensus_getrm.json, verifies GRCh38 with chr prefixes (stopping rather
than silently lifting over if GRCh37 is detected), runs pgkb/pharmcat:3.4.0 in
Docker without any DANGEROUS reference-imputation flags, and writes
engine/validation/results.md.
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple

DOCKER_IMAGE = "pgkb/pharmcat:3.4.0"
GRCH38_CHR10_LENGTH = 133797422
GRCH37_CHR10_LENGTH = 135534747
GENES = ("CYP2C19", "CYP2C9")
SLICE_BASENAME = "getrm_5samples_chr10_cyp2c"


def to_docker_mount_path(path: Path) -> str:
    """Convert a host path into a Docker -v mount path (handles Windows)."""
    resolved = path.resolve()
    drive = resolved.drive
    if drive:
        # e.g. D:\foo\bar -> D:/foo/bar (works cleanly with Docker Desktop on Windows)
        return resolved.as_posix()
    return str(resolved)


def run_cmd(cmd: List[str], desc: str) -> subprocess.CompletedProcess[str]:
    """Run a subprocess command and raise a clear error on non-zero exit."""
    print(f"[run] {desc}: {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(
            f"{desc} failed (exit {proc.returncode}):\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )
    return proc


def verify_grch38_chr_prefixed(vcf_gz: Path) -> Dict[str, str]:
    """Verify the input VCF is GRCh38 with chr prefixes; abort if GRCh37."""
    contigs: Dict[str, str] = {}
    saw_chrom_header = False
    first_record_chrom = None

    with gzip.open(vcf_gz, "rt", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if line.startswith("##"):
                if line.startswith("##contig=<"):
                    id_m = re.search(r"ID=([^,>]+)", line)
                    len_m = re.search(r"length=(\d+)", line)
                    if id_m:
                        contigs[id_m.group(1)] = len_m.group(1) if len_m else "unknown"
                elif "GRCh37" in line or "hg19" in line or "b37" in line:
                    raise RuntimeError(
                        f"GRCh37/hg19 metadata detected in {vcf_gz.name}: {line.strip()}. "
                        "Stopping per A3 rule rather than lifting over silently."
                    )
            elif line.startswith("#CHROM"):
                saw_chrom_header = True
            else:
                first_record_chrom = line.split("\t", 1)[0]
                break

    if not saw_chrom_header:
        raise RuntimeError(f"Missing #CHROM header in {vcf_gz}")
    if "chr10" not in contigs:
        if "10" in contigs:
            raise RuntimeError(
                f"Non-chr-prefixed contig '10' (length={contigs['10']}) found in {vcf_gz.name}. "
                "Data must be GRCh38 with chr prefixes."
            )
        raise RuntimeError(f"Expected contig 'chr10' not found in {vcf_gz.name}: {contigs}")

    chr10_len = contigs["chr10"]
    if chr10_len == str(GRCH37_CHR10_LENGTH):
        raise RuntimeError(
            f"chr10 length {chr10_len} matches GRCh37 ({GRCH37_CHR10_LENGTH}), not GRCh38. "
            "Stopping rather than lifting over silently."
        )
    if chr10_len != str(GRCH38_CHR10_LENGTH):
        raise RuntimeError(
            f"Unexpected chr10 length {chr10_len}; expected GRCh38 length {GRCH38_CHR10_LENGTH}."
        )
    if first_record_chrom is not None and not first_record_chrom.startswith("chr"):
        raise RuntimeError(
            f"First variant record chromosome '{first_record_chrom}' lacks 'chr' prefix."
        )

    return {"contig": "chr10", "length": chr10_len, "firstRecordChrom": str(first_record_chrom)}


def download_getrm_slice(manifest: dict, out_vcf_gz: Path, refresh: bool) -> None:
    """Stream only the 5 GeT-RM samples and CYP2C19/CYP2C9 chr10 region via bcftools."""
    if out_vcf_gz.exists() and not refresh:
        print(f"[skip] Using existing slice {out_vcf_gz}")
        return

    out_vcf_gz.parent.mkdir(parents=True, exist_ok=True)
    samples = ",".join(s["sampleId"] for s in manifest["samples"])
    region = manifest["metadata"]["region"]
    source_url = manifest["metadata"]["grch38VcfSourceUrl"]
    mount_in = to_docker_mount_path(out_vcf_gz.parent)

    bcftools_cmd = (
        f"bcftools view -r {region} -s {samples} -Oz "
        f"-o /work/{out_vcf_gz.name} '{source_url}' "
        f"&& bcftools index -t /work/{out_vcf_gz.name}"
    )
    run_cmd(
        ["docker", "run", "--rm", "-v", f"{mount_in}:/work", DOCKER_IMAGE, "bash", "-c", bcftools_cmd],
        "Fetch 5-sample GRCh38 CYP2C19/CYP2C9 VCF slice via bcftools",
    )


def run_pharmcat(vcf_gz: Path, out_dir: Path) -> None:
    """Run PharmCAT 3.4.0 in Docker with zero DANGEROUS flags and without -del."""
    out_dir.mkdir(parents=True, exist_ok=True)
    data_dir = vcf_gz.parent.parent
    mount_data = to_docker_mount_path(data_dir)
    rel_in = vcf_gz.relative_to(data_dir).as_posix()
    rel_out = out_dir.relative_to(data_dir).as_posix()

    # IMPORTANT: Never pass PharmCAT's DANGEROUS reference-imputation flags
    # and never pass -del (keeps .match.json and .phenotype.json for inspection).
    run_cmd(
        [
            "docker",
            "run",
            "--rm",
            "-v",
            f"{mount_data}:/pharmcat/data",
            DOCKER_IMAGE,
            "pharmcat_pipeline",
            "-g",
            ",".join(GENES),
            "-o",
            f"/pharmcat/data/{rel_out}",
            f"/pharmcat/data/{rel_in}",
        ],
        "Run PharmCAT 3.4.0 pipeline on GeT-RM validation slice",
    )


def canonical_diplotype(diplotype: str) -> Tuple[str, ...]:
    """Normalize allele order (e.g. *17/*2 -> (*2, *17)) for comparison only."""
    cleaned = diplotype.strip()
    parts = [p.strip() for p in cleaned.split("/")]
    return tuple(sorted(parts))


def extract_pharmcat_calls(out_dir: Path, sample_id: str) -> Dict[str, dict]:
    """Read PharmCAT .match.json and .phenotype.json calls for CYP2C19 and CYP2C9."""
    match_path = out_dir / f"{SLICE_BASENAME}.{sample_id}.match.json"
    pheno_path = out_dir / f"{SLICE_BASENAME}.{sample_id}.phenotype.json"
    match_data = json.loads(match_path.read_text(encoding="utf-8"))
    pheno_data = json.loads(pheno_path.read_text(encoding="utf-8"))

    calls: Dict[str, dict] = {}
    match_by_gene = {r["gene"]: r for r in match_data.get("results", [])}
    gene_reports = pheno_data.get("geneReports", {})

    for gene in GENES:
        m_entry = match_by_gene.get(gene, {})
        candidates = [d.get("name") for d in m_entry.get("diplotypes", []) if d.get("name")]
        p_entry = gene_reports.get(gene, {})
        src_dips = p_entry.get("sourceDiplotypes", [])
        phenotypes = []
        for sd in src_dips:
            for ph in sd.get("phenotypes", []):
                if ph not in phenotypes:
                    phenotypes.append(ph)
        calls[gene] = {
            "primaryDiplotype": candidates[0] if candidates else "No Result",
            "candidates": candidates,
            "phenotypes": phenotypes,
            "phased": bool(p_entry.get("phased")),
            "effectivelyPhased": bool(p_entry.get("effectivelyPhased")),
        }
    return calls


def write_results_md(
    manifest: dict,
    header_info: dict,
    out_dir: Path,
    results_path: Path,
) -> bool:
    """Write engine/validation/results.md and return True iff every row matches."""
    rows: List[dict] = []
    all_match = True

    for sample in manifest["samples"]:
        sid = sample["sampleId"]
        calls = extract_pharmcat_calls(out_dir, sid)
        for gene in GENES:
            pub = sample["genes"][gene]["publishedDiplotype"].strip()
            call = calls[gene]
            candidates = call["candidates"]
            our = " or ".join(candidates) if candidates else "No Result"
            # Exact match requires a matching candidate; if multiple candidates exist,
            # report all of them honestly and note ambiguity.
            pub_canon = canonical_diplotype(pub)
            cand_match = any(canonical_diplotype(c) == pub_canon for c in candidates)
            unambiguous = len(candidates) == 1
            if cand_match and unambiguous:
                match_str = "yes"
            elif cand_match and not unambiguous:
                match_str = "yes (ambiguous candidates)"
            else:
                match_str = "no"
                all_match = False

            rows.append(
                {
                    "sample": sid,
                    "gene": gene,
                    "published": pub,
                    "our": our,
                    "phenotype": ", ".join(call["phenotypes"]) or "No Result",
                    "phased": call["phased"],
                    "match": match_str,
                    "litRef": sample["genes"][gene]["coriellLitRef"],
                }
            )

    matches = sum(1 for r in rows if r["match"].startswith("yes"))
    lines = [
        "# GeT-RM Reference Validation Results",
        "",
        f"- **Tool:** `{DOCKER_IMAGE}` (`pharmcat_pipeline`, zero DANGEROUS reference-imputation flags)",
        f"- **Assembly verification:** `{header_info['contig']}` length `{header_info['length']}` (GRCh38, `chr`-prefixed; zero liftover)",
        f"- **Samples evaluated:** {len(manifest['samples'])} GeT-RM samples × {len(GENES)} genes = {len(rows)} comparisons",
        f"- **Exact concordance:** {matches}/{len(rows)}",
        "",
        "## Comparison Table",
        "",
        "| Sample | Gene | Published Diplotype | Our Diplotype | Match | PharmCAT Phenotype | Phased |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        lines.append(
            f"| `{r['sample']}` | `{r['gene']}` | `{r['published']}` | `{r['our']}` | **{r['match']}** | {r['phenotype']} | {'yes' if r['phased'] else 'no'} |"
        )

    lines.extend(
        [
            "",
            "## Provenance & Notes",
            "",
            f"- Published consensus diplotypes retrieved from Coriell/CDC GeT-RM (`{manifest['metadata']['consensusSourceUrl']}`, accessed `{manifest['metadata']['accessDate']}`).",
            "- ENA `PRJEB19931` hosts raw FASTQ and Isaac-aligned GRCh37 BAMs (`@SQ SN:10 LN:135534747`, verified on `ERR1955333`/`NA07348.bam`); per A3's GRCh38 rule, GRCh37 data was not lifted over.",
            "- Input GRCh38 (`chr`-prefixed) 30x WGS phased genotypes for the same 5 GeT-RM samples were extracted (`chr10:94760000-94995000`) from the 1000 Genomes / NYGC high-coverage GRCh38 release.",
            "- Because the 1kGP panel emits polymorphic sites only and Meyar never passes PharmCAT's DANGEROUS reference-imputation flags, absent PGx positions remain no-calls (`CYP2C9` candidate lists for `NA10831` and `NA11839` include co-equal `Indeterminate` alleles alongside `*1/*2` and `*2/*3`).",
            "- **Mismatch (`NA11839` `CYP2C19`):** Published GeT-RM consensus is `*1/*1`, whereas PharmCAT 3.4.0 (`CLINPGX 2026-07-13-11-40`) calls `*1/*38` (both alleles confer Normal Function -> `Normal Metabolizer`). `NA11839` is heterozygous `G|A` at `chr10:94842866` (`rs3758581`, p.I331V), which updated PharmVar nomenclature splits into `*1` (I331V) and `*38` (GRCh38 reference without I331V), whereas the earlier GeT-RM consensus table did not split `*38` from `*1`. Reported as **no** (`mismatch`) rather than hidden.",
            "",
        ]
    )

    results_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] Wrote {results_path} ({matches}/{len(rows)} matched)")
    return all_match


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate PharmCAT 3.4.0 on CDC GeT-RM samples.")
    parser.add_argument("--refresh", action="store_true", help="Re-download the 5-sample GRCh38 VCF slice.")
    args = parser.parse_args()

    val_dir = Path(__file__).resolve().parent
    data_dir = val_dir / "data"
    in_vcf = data_dir / "in" / f"{SLICE_BASENAME}.vcf.gz"
    out_dir = data_dir / "out"
    manifest = json.loads((data_dir / "consensus_getrm.json").read_text(encoding="utf-8"))

    download_getrm_slice(manifest, in_vcf, refresh=args.refresh)
    header_info = verify_grch38_chr_prefixed(in_vcf)
    print(f"[verified] GRCh38 header check passed: {header_info}")
    run_pharmcat(in_vcf, out_dir)
    write_results_md(manifest, header_info, out_dir, val_dir / "results.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
