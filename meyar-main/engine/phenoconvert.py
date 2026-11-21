#!/usr/bin/env python3
"""A7 phenoconversion step: shift effective phenotypes from current medicines.

Reads a Meyar patient data contract JSON (produced after A4/A5/A8, outside
PharmCAT), joins ``currentMedications[]`` against ``tables/cyp_inhibitors.json``
(FDA Table of Substrates, Inhibitors and Inducers), and writes
``effectivePhenotype`` and ``phenoconversion`` per gene without ever modifying
the genetic ``phenotype``.

Rules:
- CYP2D6: compute genetic activity score from CPIC CYP2D6 allele-function
  values, multiply by 0.5 for a moderate inhibitor or 0 for a strong inhibitor
  (Thomas et al., CPT Pharmacometrics Syst Pharmacol 2020;9(12):678-685,
  doi:10.1002/psp4.12563), taking the strongest inhibitor if multiple apply, and
  map the adjusted score back to phenotype using CPIC consensus thresholds
  (Caudle et al., Clin Transl Sci 2020;13(1):116-124, doi:10.1111/cts.12692).
- Other genes (e.g. CYP2C19): never compute an activity score; flag
  ``applied: true`` with ``inhibitorStrength`` and ``cause`` while keeping
  ``effectivePhenotype`` equal to the genetic ``phenotype``.
- Unknown drugs (not in ``tables/cyp_inhibitors.json``) are ignored and logged.
- Weak inhibitors do not trigger phenoconversion (per schema enum
  ``["strong", "moderate", null]`` and Thomas et al. 2020).
"""

from __future__ import annotations

import argparse
import copy
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

logger = logging.getLogger("meyar.phenoconvert")

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INHIBITORS_PATH = REPO_ROOT / "tables" / "cyp_inhibitors.json"
DEFAULT_MOCK_MEDS_PATH = REPO_ROOT / "tables" / "mock_current_meds.json"
DEFAULT_OUT_DIR = REPO_ROOT / "engine" / "data" / "out"

THOMAS_METHOD = "Thomas et al. 2020"
NON_SCORED_METHOD = "FDA clinical inhibitor table (no score)"
UNSCORABLE_PHENOTYPES = {"No Result", "Indeterminate", "Unknown", ""}
STRENGTH_RANK = {"moderate": 1, "strong": 2}
ALLOWED_MED_SOURCES = {"hospital-record", "patient-entered"}

# CPIC CYP2D6 Allele Functionality Reference Table numeric activity values.
# Source: CPIC database https://api.cpicpgx.org/v1/allele?genesymbol=eq.CYP2D6
# (accessed 2026-11-22). Alleles with "Uncertain function" / "Unknown function"
# ("n/a") are intentionally omitted so they evaluate to None.
CYP2D6_ALLELE_ACTIVITY_VALUES: Dict[str, float] = {
    "*1": 1.0,
    "*1x2": 2.0,
    "*2": 1.0,
    "*2x2": 2.0,
    "*3": 0.0,
    "*3x2": 0.0,
    "*4": 0.0,
    "*4x2": 0.0,
    "*4x≥3": 0.0,
    "*5": 0.0,
    "*6": 0.0,
    "*6x2": 0.0,
    "*7": 0.0,
    "*8": 0.0,
    "*9": 0.25,
    "*9x2": 0.5,
    "*10": 0.25,
    "*10x2": 0.5,
    "*11": 0.0,
    "*12": 0.0,
    "*13": 0.0,
    "*13+*1": 1.0,
    "*13+*1x2": 2.0,
    "*13+*2": 1.0,
    "*13+*68x2+*4": 0.0,
    "*14": 0.5,
    "*15": 0.0,
    "*17": 0.5,
    "*17x2": 1.0,
    "*18": 0.0,
    "*19": 0.0,
    "*20": 0.0,
    "*21": 0.0,
    "*27": 1.0,
    "*27x2": 2.0,
    "*29": 0.5,
    "*29x2": 1.0,
    "*31": 0.0,
    "*32": 0.25,
    "*33": 1.0,
    "*34": 1.0,
    "*35": 1.0,
    "*35x2": 2.0,
    "*36": 0.0,
    "*36+*10": 0.25,
    "*36+*10x2": 0.5,
    "*36x2": 0.0,
    "*36x2+*10": 0.25,
    "*36x2+*10x2": 0.5,
    "*38": 0.0,
    "*39": 1.0,
    "*40": 0.0,
    "*41": 0.25,
    "*41x2": 0.5,
    "*41x3": 0.75,
    "*42": 0.0,
    "*44": 0.0,
    "*45": 1.0,
    "*45x2": 2.0,
    "*46": 1.0,
    "*47": 0.0,
    "*48": 1.0,
    "*49": 0.5,
    "*50": 0.5,
    "*51": 0.0,
    "*52": 0.25,
    "*53": 1.0,
    "*54": 0.5,
    "*55": 0.5,
    "*56": 0.0,
    "*59": 0.5,
    "*60": 0.0,
    "*62": 0.0,
    "*68": 0.0,
    "*68+*2": 1.0,
    "*68+*4": 0.0,
    "*69": 0.0,
    "*81": 0.0,
    "*91": 0.25,
    "*92": 0.0,
    "*96": 0.0,
    "*99": 0.0,
    "*100": 0.0,
    "*101": 0.0,
    "*109": 0.25,
    "*114": 0.0,
    "*119": 0.25,
    "*120": 0.0,
    "*124": 0.0,
    "*129": 0.0,
    "*132": 0.25,
    "*143": 0.0,
    "*144": 0.0,
    "*156": 0.0,
    "*161": 0.0,
}

_COPY_RE = re.compile(r"^(\*\d+)x(\d+)$")


class InhibitorIndex:
    """Lookup index over ``tables/cyp_inhibitors.json``."""

    def __init__(self, rows: Sequence[Mapping[str, Any]]) -> None:
        self.by_enzyme_drug: Dict[Tuple[str, str], str] = {}
        self.known_drugs: set[str] = set()
        for row in rows:
            drug = str(row.get("drug", "")).strip()
            enzyme = str(row.get("enzyme", "")).strip().upper()
            strength = str(row.get("strength", "")).strip().lower()
            if not drug or not enzyme or strength not in {"strong", "moderate", "weak"}:
                raise ValueError(f"Invalid inhibitor row: {row!r}")
            key = drug.lower()
            self.known_drugs.add(key)
            self.by_enzyme_drug[(enzyme, key)] = strength

    def contains_drug(self, drug_name: str) -> bool:
        return drug_name.strip().lower() in self.known_drugs

    def get_strength(self, enzyme: str, drug_name: str) -> Optional[str]:
        return self.by_enzyme_drug.get((enzyme.strip().upper(), drug_name.strip().lower()))


def load_inhibitors(path: Path = DEFAULT_INHIBITORS_PATH) -> InhibitorIndex:
    """Load FDA inhibitor rows from ``tables/cyp_inhibitors.json``."""
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = data.get("rows")
    if not isinstance(rows, list):
        raise ValueError(f"Expected 'rows' list in {path}")
    return InhibitorIndex(rows)


def load_mock_meds(path: Path = DEFAULT_MOCK_MEDS_PATH) -> Dict[str, List[Dict[str, Any]]]:
    """Load mock current-medication lists keyed by ``patientId``."""
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = data.get("rows")
    if not isinstance(rows, list):
        raise ValueError(f"Expected 'rows' list in {path}")
    meds_by_patient: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        pid = str(row.get("patientId", "")).strip()
        if not pid:
            continue
        if "medications" in row and isinstance(row["medications"], list):
            meds_by_patient[pid] = [normalize_med_item(m) for m in row["medications"]]
        elif "name" in row:
            meds_by_patient.setdefault(pid, []).append(normalize_med_item(row))
    return meds_by_patient


def normalize_med_item(item: Mapping[str, Any]) -> Dict[str, Any]:
    """Normalize a ``currentMedications[]`` item to match data-contract.schema.json."""
    name = str(item.get("name", "")).strip()
    source = str(item.get("source", "hospital-record")).strip()
    if source not in ALLOWED_MED_SOURCES:
        raise ValueError(f"Invalid medication source {source!r} for {name!r}")
    out: Dict[str, Any] = {
        "name": name,
        "source": source,
        "mock": bool(item.get("mock", True)),
    }
    if item.get("rxnorm") is not None:
        out["rxnorm"] = str(item["rxnorm"])
    return out


def parse_cyp2d6_allele_score(allele: str) -> Optional[float]:
    """Return CPIC activity value for a CYP2D6 allele, or None if unquantifiable."""
    cleaned = allele.strip()
    if not cleaned or cleaned in {"Unknown", "No Result"}:
        return None
    if cleaned in CYP2D6_ALLELE_ACTIVITY_VALUES:
        return CYP2D6_ALLELE_ACTIVITY_VALUES[cleaned]
    match = _COPY_RE.match(cleaned)
    if match:
        base, copies_str = match.groups()
        base_score = CYP2D6_ALLELE_ACTIVITY_VALUES.get(base)
        if base_score is not None:
            return round(base_score * int(copies_str), 6)
    return None


def compute_cyp2d6_activity_score(diplotype: str) -> Optional[float]:
    """Compute CYP2D6 genetic activity score from a diplotype like ``*1/*1``."""
    parts = [p.strip() for p in diplotype.split("/")]
    if len(parts) != 2:
        return None
    s1 = parse_cyp2d6_allele_score(parts[0])
    s2 = parse_cyp2d6_allele_score(parts[1])
    if s1 is None or s2 is None:
        return None
    return round(s1 + s2, 6)


def activity_score_to_phenotype(score: float) -> str:
    """Map CYP2D6 activity score to CPIC consensus phenotype (Caudle et al. 2020)."""
    if score < 0:
        raise ValueError(f"CYP2D6 activity score cannot be negative: {score}")
    if score == 0.0:
        return "Poor Metabolizer"
    if score < 1.25:
        return "Intermediate Metabolizer"
    if score <= 2.25:
        return "Normal Metabolizer"
    return "Ultrarapid Metabolizer"


def _collect_gene_inhibitors(
    gene: str,
    medications: Sequence[Mapping[str, Any]],
    inhibitors: InhibitorIndex,
) -> Tuple[List[str], Optional[str]]:
    """Return ``(cause_names, strongest_strength)`` for strong/moderate inhibitors."""
    causes: List[str] = []
    seen_lower: set[str] = set()
    strongest: Optional[str] = None

    for med in medications:
        med_name = str(med.get("name", "")).strip()
        if not med_name:
            continue
        strength = inhibitors.get_strength(gene, med_name)
        if strength is None:
            continue
        if strength == "weak":
            logger.info(
                "Weak %s inhibitor %r does not trigger phenoconversion",
                gene,
                med_name,
            )
            continue
        if strongest is None or STRENGTH_RANK[strength] > STRENGTH_RANK[strongest]:
            strongest = strength
        if med_name.lower() not in seen_lower:
            seen_lower.add(med_name.lower())
            causes.append(med_name)

    return causes, strongest


def _log_unknown_medications(
    medications: Sequence[Mapping[str, Any]],
    inhibitors: InhibitorIndex,
) -> None:
    """Log any medication not present in ``tables/cyp_inhibitors.json``."""
    for med in medications:
        med_name = str(med.get("name", "")).strip()
        if med_name and not inhibitors.contains_drug(med_name):
            logger.info(
                "Ignoring unknown medication %r (not listed in cyp_inhibitors.json)",
                med_name,
            )


def _phenoconvert_cyp2d6(
    gene_entry: Mapping[str, Any],
    causes: List[str],
    strongest: Optional[str],
) -> Tuple[str, Dict[str, Any]]:
    """Compute CYP2D6 effectivePhenotype and phenoconversion payload."""
    genetic_phenotype = str(gene_entry["phenotype"])
    genetic_as = compute_cyp2d6_activity_score(str(gene_entry.get("diplotype", "")))

    if genetic_as is None or genetic_phenotype in UNSCORABLE_PHENOTYPES:
        if strongest is not None:
            logger.info(
                "CYP2D6 diplotype %r (%s) has no computable activity score; "
                "not applying phenoconversion from %s",
                gene_entry.get("diplotype"),
                genetic_phenotype,
                causes,
            )
        return genetic_phenotype, {
            "applied": False,
            "cause": [],
            "inhibitorStrength": None,
            "geneticActivityScore": None,
            "adjustedActivityScore": None,
            "method": THOMAS_METHOD,
        }

    if strongest is None:
        return genetic_phenotype, {
            "applied": False,
            "cause": [],
            "inhibitorStrength": None,
            "geneticActivityScore": genetic_as,
            "adjustedActivityScore": genetic_as,
            "method": THOMAS_METHOD,
        }

    factor = 0.0 if strongest == "strong" else 0.5
    adjusted_as = round(genetic_as * factor, 6)
    effective_phenotype = activity_score_to_phenotype(adjusted_as)
    return effective_phenotype, {
        "applied": True,
        "cause": causes,
        "inhibitorStrength": strongest,
        "geneticActivityScore": genetic_as,
        "adjustedActivityScore": adjusted_as,
        "method": THOMAS_METHOD,
    }


def _phenoconvert_other_gene(
    gene_entry: Mapping[str, Any],
    causes: List[str],
    strongest: Optional[str],
) -> Tuple[str, Dict[str, Any]]:
    """Flag non-CYP2D6 genes without computing an activity score."""
    genetic_phenotype = str(gene_entry["phenotype"])
    if strongest is not None and genetic_phenotype not in UNSCORABLE_PHENOTYPES:
        return genetic_phenotype, {
            "applied": True,
            "cause": causes,
            "inhibitorStrength": strongest,
            "geneticActivityScore": None,
            "adjustedActivityScore": None,
            "method": NON_SCORED_METHOD,
        }
    return genetic_phenotype, {
        "applied": False,
        "cause": [],
        "inhibitorStrength": None,
        "geneticActivityScore": None,
        "adjustedActivityScore": None,
    }


def phenoconvert_contract(
    contract: Mapping[str, Any],
    inhibitors: InhibitorIndex,
    meds_override: Optional[Sequence[Mapping[str, Any]]] = None,
) -> Dict[str, Any]:
    """Return a new contract with ``effectivePhenotype`` and ``phenoconversion``.

    Never mutates or overwrites the genetic ``phenotype`` on any gene entry.
    """
    if contract.get("sampleOrigin") != "germline":
        raise ValueError(
            f"Refusing non-germline contract for {contract.get('patientId')!r}: "
            f"sampleOrigin={contract.get('sampleOrigin')!r}"
        )

    out: Dict[str, Any] = copy.deepcopy(dict(contract))
    if meds_override is not None:
        meds = [normalize_med_item(m) for m in meds_override]
        out["currentMedications"] = meds
    elif "currentMedications" in out and isinstance(out["currentMedications"], list):
        meds = [normalize_med_item(m) for m in out["currentMedications"]]
        out["currentMedications"] = meds
    else:
        meds = []

    _log_unknown_medications(meds, inhibitors)

    new_genes: List[Dict[str, Any]] = []
    for gene_entry in out.get("genes", []):
        g = dict(gene_entry)
        gene_symbol = str(g["gene"])
        causes, strongest = _collect_gene_inhibitors(gene_symbol, meds, inhibitors)

        if gene_symbol == "CYP2D6":
            effective, phenoconv = _phenoconvert_cyp2d6(g, causes, strongest)
        else:
            effective, phenoconv = _phenoconvert_other_gene(g, causes, strongest)

        g["effectivePhenotype"] = effective
        g["phenoconversion"] = phenoconv
        new_genes.append(g)

    out["genes"] = new_genes
    return out


def process_contract_file(
    contract_path: Path,
    inhibitors: InhibitorIndex,
    meds_by_patient: Mapping[str, List[Dict[str, Any]]],
    output_path: Optional[Path] = None,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Load, phenoconvert, and optionally write a contract JSON file."""
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    patient_id = str(contract.get("patientId", "")).strip()
    meds_override: Optional[List[Dict[str, Any]]] = None
    if "currentMedications" not in contract and patient_id in meds_by_patient:
        meds_override = meds_by_patient[patient_id]

    updated = phenoconvert_contract(contract, inhibitors, meds_override=meds_override)
    if not dry_run:
        target = output_path or contract_path
        target.write_text(
            json.dumps(updated, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )
    return updated


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Apply A7 phenoconversion to Meyar data-contract JSON files."
    )
    target_group = parser.add_mutually_exclusive_group(required=True)
    target_group.add_argument(
        "--contract",
        type=Path,
        help="Path to a single *.contract.json file.",
    )
    target_group.add_argument(
        "--all",
        action="store_true",
        help="Process all *.contract.json files in --out-dir.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Directory containing *.contract.json files (for --all).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output path (only valid with --contract).",
    )
    parser.add_argument(
        "--inhibitors",
        type=Path,
        default=DEFAULT_INHIBITORS_PATH,
        help="Path to tables/cyp_inhibitors.json.",
    )
    parser.add_argument(
        "--meds",
        type=Path,
        default=DEFAULT_MOCK_MEDS_PATH,
        help="Path to tables/mock_current_meds.json.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute phenoconversion and print summary without writing files.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable INFO logging (shows ignored/unknown drugs).",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(levelname)s %(name)s: %(message)s",
    )

    if args.output is not None and not args.contract:
        parser.error("--output can only be used with --contract")

    inhibitors = load_inhibitors(args.inhibitors)
    meds_by_patient = load_mock_meds(args.meds) if args.meds.exists() else {}

    paths: List[Path]
    if args.contract:
        paths = [args.contract]
    else:
        paths = sorted(args.out_dir.glob("*.contract.json"))
        if not paths:
            print(f"No *.contract.json files found in {args.out_dir}", file=sys.stderr)
            return 1

    for path in paths:
        updated = process_contract_file(
            path,
            inhibitors=inhibitors,
            meds_by_patient=meds_by_patient,
            output_path=args.output,
            dry_run=args.dry_run,
        )
        applied_genes = [
            f"{g['gene']}: {g['phenotype']} -> {g['effectivePhenotype']} ({','.join(g['phenoconversion']['cause'])})"
            for g in updated["genes"]
            if g.get("phenoconversion", {}).get("applied")
        ]
        summary = "; ".join(applied_genes) if applied_genes else "no phenoconversion applied"
        print(f"{updated['patientId']}: {summary}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
