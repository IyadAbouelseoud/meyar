#!/usr/bin/env python3
"""A5 — Coverage and interpretability flag (separate arithmetic step after PharmCAT).

Computes per-gene, per-patient assay coverage metrics from PharmCAT 3.4.0
`.match.json` outputs and `tables/saudi_frequencies.json`:
  - definingPositionsAssayed / definingPositionsTotal
  - untestedLocalAlleles (non-normal-function Saudi alleles missed by the assay)
  - uninformativeNormalRisk (summed Saudi frequency of untested Tier 1 alleles, or null)
  - saudiDataTier (1 = Goljan et al. 2022 Table 1, 2 = no Saudi freq, 0 = SV/A8)
  - saudiDataNote

A5 is pure arithmetic over two tables. It NEVER re-picks, ranks, or changes any
diplotype, phenotype, or candidates list.
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT_DIR = REPO_ROOT / "engine" / "data" / "out"
DEFAULT_SAUDI_FREQ_PATH = REPO_ROOT / "tables" / "saudi_frequencies.json"
DEFAULT_SV_GENES_PATH = REPO_ROOT / "tables" / "sv_genes.json"
DEFAULT_SCHEMA_PATH = REPO_ROOT / "docs" / "data-contract.schema.json"

TIER2_NOTE = "No published Saudi frequency for this gene"
NOT_ASSAYED_NOTE = "No defining position assayed for this gene; no score"
DEFAULT_TIER0_NOTE = (
    "No A5 score (Tier 0): structural-variation gene owned by A8; excluded from "
    "Goljan et al. 2022 (doi:10.1371/journal.pone.0263137) because deletions, "
    "duplications and hybrids could not be called."
)


def load_saudi_frequencies(path: Path = DEFAULT_SAUDI_FREQ_PATH) -> Dict[str, Dict[str, Any]]:
    """Load `tables/saudi_frequencies.json` indexed by HGNC gene symbol."""
    data = json.loads(path.read_text(encoding="utf-8"))
    by_gene: Dict[str, Dict[str, Any]] = {}
    for row in data.get("rows", []):
        gene = str(row.get("gene", "")).strip()
        if gene:
            by_gene[gene] = row
    return by_gene


def load_sv_genes(path: Path = DEFAULT_SV_GENES_PATH) -> Set[str]:
    """Load structural-variation gene symbols from `tables/sv_genes.json`."""
    if not path.exists():
        return {"CYP2D6"}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        str(row["gene"]).strip()
        for row in data.get("rows", [])
        if row.get("gene") and not row.get("callableFromVcf", True)
    }


def extract_match_gene_index(match_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Index PharmCAT `.match.json` `results[]` entries by gene symbol."""
    by_gene: Dict[str, Dict[str, Any]] = {}
    for result in match_data.get("results", []):
        gene = result.get("gene")
        if gene:
            by_gene[str(gene)] = result
    return by_gene


def _normalize_rsid(raw: Any) -> str:
    """Strip version suffix (e.g. 'rs112766203.1' -> 'rs112766203')."""
    return str(raw or "").strip().split(".")[0]


def _is_observed_in_saudi_cohort(allele_entry: Dict[str, Any]) -> bool:
    """Return True if the allele was observed (>0 or <0.1%) in Goljan et al. 2022."""
    reported = allele_entry.get("reportedFrequencyPct")
    if isinstance(reported, str):
        return reported.strip() not in ("", "0", "0.0")
    if isinstance(reported, (int, float)):
        return reported > 0
    freq = allele_entry.get("frequency")
    return freq is not None and freq > 0


def compute_gene_coverage(
    gene: str,
    match_result: Optional[Dict[str, Any]],
    freq_table: Dict[str, Dict[str, Any]],
    sv_genes: Optional[Set[str]] = None,
) -> Dict[str, Any]:
    """Compute the A5 `coverage` object for a single gene."""
    sv_set = sv_genes if sv_genes is not None else {"CYP2D6"}
    row = freq_table.get(gene)
    tier = row.get("saudiDataTier") if row is not None else 2

    if gene in sv_set or tier == 0:
        note = str(row.get("saudiDataNote")) if row and row.get("saudiDataNote") else DEFAULT_TIER0_NOTE
        return {
            "definingPositionsAssayed": 0,
            "definingPositionsTotal": 0,
            "untestedLocalAlleles": [],
            "uninformativeNormalRisk": None,
            "saudiDataTier": 0,
            "saudiDataNote": note,
        }

    variants = (match_result or {}).get("variants") or []
    missing_positions = ((match_result or {}).get("matchData") or {}).get("missingPositions") or []
    assayed = len(variants)
    total = assayed + len(missing_positions)

    if row is None or tier == 2:
        return {
            "definingPositionsAssayed": assayed,
            "definingPositionsTotal": total,
            "untestedLocalAlleles": [],
            "uninformativeNormalRisk": None,
            "saudiDataTier": 2,
            "saudiDataNote": TIER2_NOTE,
        }

    missing_rsids = {
        _normalize_rsid(mp.get("rsid"))
        for mp in missing_positions
        if mp.get("rsid")
    }
    uncallable_names = {
        str(h).strip()
        for h in ((match_result or {}).get("uncallableHaplotypes") or [])
        if h
    }

    untested_alleles: List[str] = []
    below_threshold_alleles: List[str] = []
    risk_sum = 0.0

    for allele_entry in row.get("alleles", []):
        if not allele_entry.get("isNonNormalFunction"):
            continue
        if not _is_observed_in_saudi_cohort(allele_entry):
            continue

        core_rsids = {
            _normalize_rsid(rs)
            for rs in (allele_entry.get("coreVariantRsids") or [])
            if rs
        }
        allele_name = str(allele_entry.get("allele", "")).strip()
        if not allele_name:
            continue

        is_untested = bool(core_rsids & missing_rsids) or (allele_name in uncallable_names)
        if not is_untested:
            continue

        untested_alleles.append(allele_name)
        freq = allele_entry.get("frequency")
        if freq is not None:
            risk_sum += float(freq)
        else:
            below_threshold_alleles.append(allele_name)

    note = str(row.get("saudiDataNote") or "Tier 1: Goljan et al. 2022 Table 1 (n=11,889)")

    if assayed == 0:
        # Nothing was tested, so there is no genotype result for a score to qualify.
        # Never report 0.0 here: that would read as reassurance for an untested gene.
        return {
            "definingPositionsAssayed": 0,
            "definingPositionsTotal": total,
            "untestedLocalAlleles": untested_alleles,
            "uninformativeNormalRisk": None,
            "saudiDataTier": 1,
            "saudiDataNote": f"{NOT_ASSAYED_NOTE}; {note}",
        }

    risk = min(1.0, round(risk_sum, 6))
    if below_threshold_alleles:
        note = f"{note}; <0.1% allele(s) not summed numerically: {', '.join(below_threshold_alleles)}"

    table_rsids = {
        _normalize_rsid(rs)
        for allele_entry in row.get("alleles", [])
        for rs in (allele_entry.get("coreVariantRsids") or [])
        if rs
    }
    unmatched_missing = sorted(rs for rs in missing_rsids if rs and rs not in table_rsids)
    if unmatched_missing:
        note = (
            f"{note}; score is a lower bound: untested position(s) with no Saudi "
            f"Table 1 row: {', '.join(unmatched_missing)}"
        )

    return {
        "definingPositionsAssayed": assayed,
        "definingPositionsTotal": total,
        "untestedLocalAlleles": untested_alleles,
        "uninformativeNormalRisk": risk,
        "saudiDataTier": 1,
        "saudiDataNote": note,
    }


def compute_match_coverage(
    match_data: Dict[str, Any],
    freq_table: Dict[str, Dict[str, Any]],
    sv_genes: Optional[Set[str]] = None,
    genes: Optional[Iterable[str]] = None,
) -> Dict[str, Dict[str, Any]]:
    """Compute coverage dicts keyed by gene for a PharmCAT `.match.json` payload."""
    match_by_gene = extract_match_gene_index(match_data)
    target_genes = list(genes) if genes is not None else sorted(match_by_gene.keys())
    return {
        gene: compute_gene_coverage(gene, match_by_gene.get(gene), freq_table, sv_genes)
        for gene in target_genes
    }


def enrich_contract(
    contract_data: Dict[str, Any],
    match_data: Dict[str, Any],
    freq_table: Dict[str, Dict[str, Any]],
    sv_genes: Optional[Set[str]] = None,
) -> Dict[str, Any]:
    """Return a copy of `contract_data` with A5 `coverage` populated for every gene.

    Preserves `diplotype`, `phenotype`, `candidates`, and all other fields untouched.
    """
    updated = copy.deepcopy(contract_data)
    match_by_gene = extract_match_gene_index(match_data)
    for gene_entry in updated.get("genes", []):
        gene = str(gene_entry.get("gene", "")).strip()
        if not gene:
            continue
        gene_entry["coverage"] = compute_gene_coverage(
            gene=gene,
            match_result=match_by_gene.get(gene),
            freq_table=freq_table,
            sv_genes=sv_genes,
        )
    return updated


def validate_contract_schema(contract_data: Dict[str, Any], schema_path: Path = DEFAULT_SCHEMA_PATH) -> None:
    """Validate a contract dict against `docs/data-contract.schema.json` if jsonschema is installed."""
    import jsonschema  # optional runtime check

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    jsonschema.validate(instance=contract_data, schema=schema)


def process_patient(
    patient_id: str,
    out_dir: Path,
    freq_table: Dict[str, Dict[str, Any]],
    sv_genes: Set[str],
    validate: bool = True,
) -> Dict[str, Any]:
    """Compute coverage for `<patientId>.match.json` and update `<patientId>.contract.json` if present."""
    match_path = out_dir / f"{patient_id}.match.json"
    if not match_path.exists():
        raise FileNotFoundError(f"Missing match file: {match_path}")
    match_data = json.loads(match_path.read_text(encoding="utf-8"))

    contract_path = out_dir / f"{patient_id}.contract.json"
    if contract_path.exists():
        contract_data = json.loads(contract_path.read_text(encoding="utf-8"))
        enriched = enrich_contract(contract_data, match_data, freq_table, sv_genes)
        if validate:
            validate_contract_schema(enriched)
        contract_path.write_text(json.dumps(enriched, indent=2) + "\n", encoding="utf-8", newline="\n")
        return {
            "patientId": patient_id,
            "contractUpdated": str(contract_path),
            "genes": {g["gene"]: g["coverage"] for g in enriched.get("genes", [])},
        }

    return {
        "patientId": patient_id,
        "contractUpdated": None,
        "genes": compute_match_coverage(match_data, freq_table, sv_genes),
    }


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Compute A5 Saudi coverage metrics from PharmCAT .match.json outputs."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Process all *.match.json files in --out-dir.")
    group.add_argument("--patient", type=str, help="Process a single patientId (e.g. demo-006).")
    group.add_argument("--match", type=Path, help="Inspect a single PharmCAT .match.json file and print JSON.")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="Directory with PharmCAT outputs.")
    parser.add_argument("--freq-table", type=Path, default=DEFAULT_SAUDI_FREQ_PATH, help="Saudi frequency JSON path.")
    parser.add_argument("--sv-table", type=Path, default=DEFAULT_SV_GENES_PATH, help="SV genes JSON path.")
    parser.add_argument("--no-validate", action="store_true", help="Skip jsonschema validation.")
    args = parser.parse_args(argv)

    freq_table = load_saudi_frequencies(args.freq_table)
    sv_genes = load_sv_genes(args.sv_table)

    if args.match:
        match_data = json.loads(args.match.read_text(encoding="utf-8"))
        cov = compute_match_coverage(match_data, freq_table, sv_genes)
        print(json.dumps(cov, indent=2))
        return 0

    if args.patient:
        patient_ids = [args.patient]
    else:
        patient_ids = sorted(p.name.removesuffix(".match.json") for p in args.out_dir.glob("*.match.json"))
        if not patient_ids:
            print(f"No *.match.json files found in {args.out_dir}", file=sys.stderr)
            return 1

    for pid in patient_ids:
        summary = process_patient(pid, args.out_dir, freq_table, sv_genes, validate=not args.no_validate)
        tier1 = {
            g: c["uninformativeNormalRisk"]
            for g, c in summary["genes"].items()
            if c["saudiDataTier"] == 1 and (c["untestedLocalAlleles"] or c["definingPositionsAssayed"] > 0)
        }
        status = f"updated {summary['contractUpdated']}" if summary["contractUpdated"] else "match-only"
        print(f"[ok] {pid}: {status}; assayed/tier1-risk={tier1}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
