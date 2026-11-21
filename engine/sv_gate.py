#!/usr/bin/env python3
"""A8 — Structural-variant gate and outside-call ingestion.

Enforces the Meyar structural-variation safety rule:
  - For every gene in `tables/sv_genes.json` (`callableFromVcf: false`), Meyar
    NEVER emits a phenotype derived from a VCF.
  - If PharmCAT processed an outside-call file (`engine/data/in/<patientId>.outside.tsv`,
    passed with `-po` so `callSource == "OUTSIDE"`), the outside-call result is
    retained with `callability = {"method": "outside-call", "svAssessed": true, "source": ...}`.
  - Otherwise, `diplotype` and `phenotype` are set to `None` (`null`), `candidates`
    to `[]`, and `callability = {"method": "not-assessed", "svAssessed": false, ...}`
    with the quoted justification from `tables/sv_genes.json`.

Runs as a separate post-PharmCAT step (alongside A5 `coverage.py`), never inside
PharmCAT and never falling back to a VCF-derived call.
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN_DIR = REPO_ROOT / "engine" / "data" / "in"
DEFAULT_OUT_DIR = REPO_ROOT / "engine" / "data" / "out"
DEFAULT_SV_GENES_PATH = REPO_ROOT / "tables" / "sv_genes.json"
DEFAULT_SCHEMA_PATH = REPO_ROOT / "docs" / "data-contract.schema.json"

DEFAULT_REASON = (
    "PharmCAT documentation: 'we do NOT recommend calling CYP2D6 from VCF' because of "
    "'the large influence of structural variation (SV) and copy number variation (CNV) "
    "on inferring CYP2D6 phenotype'."
)
DEFAULT_REQUIRED_INPUT = "WGS BAM/CRAM with a CNV-aware caller, or a lab report"


@dataclass(frozen=True)
class OutsideCallFile:
    """Parsed PharmCAT outside-call TSV file with header metadata."""

    path: Optional[Path]
    mock: bool
    source: Optional[str]
    calls: Dict[str, Dict[str, Optional[str]]]


def load_sv_genes(path: Path = DEFAULT_SV_GENES_PATH) -> Dict[str, Dict[str, Any]]:
    """Load non-VCF-callable structural-variation genes from `tables/sv_genes.json`."""
    data = json.loads(path.read_text(encoding="utf-8"))
    by_gene: Dict[str, Dict[str, Any]] = {}
    for row in data.get("rows", []):
        gene = str(row.get("gene", "")).strip()
        if gene and not row.get("callableFromVcf", True):
            by_gene[gene] = row
    return by_gene


def parse_outside_calls(outside_path: Path) -> OutsideCallFile:
    """Parse `<patientId>.outside.tsv` in PharmCAT's 4-field tab-separated format.

    PharmCAT outside-call positional fields:
      1. HGNC gene symbol
      2. diplotype or single allele
      3. phenotype or other gene result (optional)
      4. activity score (optional)
    """
    if not outside_path.exists():
        return OutsideCallFile(path=None, mock=False, source=None, calls={})

    mock = False
    source: Optional[str] = None
    calls: Dict[str, Dict[str, Optional[str]]] = {}

    for raw_line in outside_path.read_text(encoding="utf-8").splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            comment = stripped.lstrip("#").strip()
            lower = comment.lower()
            if lower.startswith("mock:"):
                mock = comment.split(":", 1)[1].strip().lower() == "true"
            elif lower.startswith("source:"):
                source = comment.split(":", 1)[1].strip() or None
            elif lower.startswith("caller:") and source is None:
                source = comment.split(":", 1)[1].strip() or None
            continue

        fields = raw_line.rstrip("\r\n").split("\t")
        if len(fields) < 2 or len(fields) > 4:
            raise ValueError(
                f"Invalid PharmCAT outside-call line in {outside_path}: {raw_line!r} "
                "(expected 2 to 4 tab-separated fields)"
            )
        gene = fields[0].strip()
        diplotype = fields[1].strip()
        if not gene or not diplotype:
            raise ValueError(
                f"Missing gene or diplotype in {outside_path}: {raw_line!r}"
            )
        phenotype = fields[2].strip() if len(fields) >= 3 and fields[2].strip() else None
        activity_score = (
            fields[3].strip() if len(fields) >= 4 and fields[3].strip() else None
        )
        calls[gene] = {
            "gene": gene,
            "diplotype": diplotype,
            "phenotype": phenotype,
            "activityScore": activity_score,
        }

    return OutsideCallFile(path=outside_path, mock=mock, source=source, calls=calls)


def extract_phenotyper_reports(pheno_data: Optional[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Index PharmCAT `.phenotype.json` `geneReports` by HGNC gene symbol."""
    if not pheno_data:
        return {}
    gene_reports = pheno_data.get("geneReports", {})
    if not isinstance(gene_reports, dict):
        return {}

    if "CPIC" in gene_reports or "DPWG" in gene_reports:
        merged: Dict[str, Dict[str, Any]] = {}
        for source_key in ("DPWG", "CPIC"):
            sub = gene_reports.get(source_key)
            if isinstance(sub, dict):
                for gene, report in sub.items():
                    if isinstance(report, dict):
                        merged[str(gene)] = report
        return merged

    return {
        str(gene): report
        for gene, report in gene_reports.items()
        if isinstance(report, dict)
    }


def build_not_assessed_callability(sv_row: Dict[str, Any]) -> Dict[str, Any]:
    """Build the `not-assessed` callability payload from `tables/sv_genes.json`."""
    return {
        "method": "not-assessed",
        "svAssessed": False,
        "reason": str(sv_row.get("justification") or DEFAULT_REASON),
        "requiredInput": str(sv_row.get("requiredInput") or DEFAULT_REQUIRED_INPUT),
    }


def gate_gene_entry(
    gene_entry: Dict[str, Any],
    sv_genes: Dict[str, Dict[str, Any]],
    pheno_reports: Dict[str, Dict[str, Any]],
    outside_file: Optional[OutsideCallFile],
) -> Dict[str, Any]:
    """Apply the A8 structural-variant gate to a single contract gene entry."""
    gated = copy.deepcopy(gene_entry)
    gene = str(gated.get("gene", "")).strip()
    report = pheno_reports.get(gene)
    call_source = str((report or {}).get("callSource") or "").strip().upper()
    outside_call = outside_file.calls.get(gene) if outside_file else None
    outside_source = (
        outside_file.source
        if outside_file and outside_file.source
        else "PharmCAT outside-call TSV"
    )

    if gene in sv_genes:
        # Accept an SV gene call ONLY when an outside-call TSV provided it and
        # (if PharmCAT phenotyper output is available) PharmCAT confirmed callSource == "OUTSIDE".
        pharmcat_confirmed_outside = (report is None) or (call_source == "OUTSIDE")
        if outside_call is not None and pharmcat_confirmed_outside:
            if not gated.get("diplotype"):
                gated["diplotype"] = outside_call["diplotype"]
            if not gated.get("candidates"):
                gated["candidates"] = [str(gated["diplotype"])]
            if not gated.get("phenotype") and outside_call.get("phenotype"):
                gated["phenotype"] = outside_call["phenotype"]
            gated["callability"] = {
                "method": "outside-call",
                "svAssessed": True,
                "source": outside_source,
            }
            return gated

        # Never fall back to any VCF-derived diplotype or phenotype for an SV gene.
        gated["diplotype"] = None
        gated["phenotype"] = None
        gated["candidates"] = []
        gated["callability"] = build_not_assessed_callability(sv_genes[gene])
        return gated

    if call_source == "OUTSIDE" and outside_call is not None:
        gated["callability"] = {
            "method": "outside-call",
            "svAssessed": False,
            "source": outside_source,
        }
        return gated

    gated["callability"] = {
        "method": "vcf",
        "svAssessed": False,
    }
    return gated


def apply_sv_gate(
    contract_data: Dict[str, Any],
    sv_genes: Dict[str, Dict[str, Any]],
    pheno_data: Optional[Dict[str, Any]] = None,
    outside_file: Optional[OutsideCallFile] = None,
) -> Dict[str, Any]:
    """Return a copy of `contract_data` with A8 `callability` and SV gating applied."""
    updated = copy.deepcopy(contract_data)
    pheno_reports = extract_phenotyper_reports(pheno_data)
    updated["genes"] = [
        gate_gene_entry(gene_entry, sv_genes, pheno_reports, outside_file)
        for gene_entry in updated.get("genes", [])
    ]
    return updated


def validate_contract_schema(
    contract_data: Dict[str, Any],
    schema_path: Path = DEFAULT_SCHEMA_PATH,
) -> None:
    """Validate a contract dict against `docs/data-contract.schema.json`."""
    import jsonschema

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    jsonschema.validate(instance=contract_data, schema=schema)


def process_patient(
    patient_id: str,
    in_dir: Path,
    out_dir: Path,
    sv_genes: Dict[str, Dict[str, Any]],
    validate: bool = True,
) -> Dict[str, Any]:
    """Apply the A8 structural-variant gate to `<patientId>.contract.json`."""
    contract_path = out_dir / f"{patient_id}.contract.json"
    if not contract_path.exists():
        raise FileNotFoundError(f"Missing contract file: {contract_path}")

    contract_data = json.loads(contract_path.read_text(encoding="utf-8"))

    pheno_path = out_dir / f"{patient_id}.phenotype.json"
    pheno_data = (
        json.loads(pheno_path.read_text(encoding="utf-8"))
        if pheno_path.exists()
        else None
    )

    outside_path = in_dir / f"{patient_id}.outside.tsv"
    outside_file = parse_outside_calls(outside_path)

    gated = apply_sv_gate(
        contract_data=contract_data,
        sv_genes=sv_genes,
        pheno_data=pheno_data,
        outside_file=outside_file,
    )
    if validate:
        validate_contract_schema(gated)

    contract_path.write_text(
        json.dumps(gated, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )

    sv_summary = {
        g["gene"]: {
            "method": g["callability"]["method"],
            "svAssessed": g["callability"]["svAssessed"],
            "diplotype": g["diplotype"],
            "phenotype": g["phenotype"],
        }
        for g in gated.get("genes", [])
        if g.get("gene") in sv_genes
    }
    return {
        "patientId": patient_id,
        "contractUpdated": str(contract_path),
        "svGenes": sv_summary,
    }


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Apply the A8 structural-variant gate and outside-call metadata to contract.json."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--all",
        action="store_true",
        help="Process all *.contract.json files in --out-dir.",
    )
    group.add_argument(
        "--patient",
        type=str,
        help="Process a single patientId (e.g. demo-001 or demo-006).",
    )
    parser.add_argument(
        "--in-dir",
        type=Path,
        default=DEFAULT_IN_DIR,
        help="Directory containing <patientId>.outside.tsv files.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Directory containing .phenotype.json and .contract.json files.",
    )
    parser.add_argument(
        "--sv-table",
        type=Path,
        default=DEFAULT_SV_GENES_PATH,
        help="Path to tables/sv_genes.json.",
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="Skip jsonschema validation.",
    )
    args = parser.parse_args(argv)

    sv_genes = load_sv_genes(args.sv_table)

    if args.patient:
        patient_ids = [args.patient]
    else:
        patient_ids = sorted(
            p.name.removesuffix(".contract.json")
            for p in args.out_dir.glob("*.contract.json")
        )
        if not patient_ids:
            print(f"No *.contract.json files found in {args.out_dir}", file=sys.stderr)
            return 1

    for pid in patient_ids:
        summary = process_patient(
            patient_id=pid,
            in_dir=args.in_dir,
            out_dir=args.out_dir,
            sv_genes=sv_genes,
            validate=not args.no_validate,
        )
        print(f"[ok] {pid}: {summary['svGenes']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
