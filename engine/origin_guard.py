#!/usr/bin/env python3
"""Germline-only sample origin guard for the Meyar PGx engine (Task A6).

Clinical rationale:
    CPIC/DPWG guidelines are for inherited genotypes; a tumour VCF can show
    loss of heterozygosity and look like a different diplotype.

Responsibilities:
    1. Read ``engine/data/in/<patientId>.origin.json`` and refuse any sample
       whose ``sampleOrigin`` is missing or not ``"germline"``.
    2. Ensure ``sampleOrigin: "germline"`` is set at the top level of every
       ``contract.json``.
    3. Ensure every FHIR ``Observation`` carries the genomic source class
       component (``LOINC 48002-0``, answer ``germline`` / ``LA6683-2``).
    4. Guard FHIR loading so rejected samples write nothing to FHIR.
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN_DIR = REPO_ROOT / "engine" / "data" / "in"
DEFAULT_OUT_DIR = REPO_ROOT / "engine" / "data" / "out"

GERMLINE_ORIGIN = "germline"
LOINC_SYSTEM = "http://loinc.org"
LOINC_GENOMIC_SOURCE_CLASS = "48002-0"
LOINC_GERMLINE_CODE = "LA6683-2"


class NonGermlineSampleError(ValueError):
    """Raised when a sample is missing origin metadata or is not germline."""


def require_germline_origin(
    patient_id: str,
    in_dir: Path = DEFAULT_IN_DIR,
) -> str:
    """Validate ``<in_dir>/<patientId>.origin.json`` and require ``sampleOrigin == 'germline'``.

    CPIC/DPWG guidelines are for inherited genotypes; a tumour VCF can show
    loss of heterozygosity and look like a different diplotype.
    """
    origin_path = in_dir / f"{patient_id}.origin.json"
    if not origin_path.exists():
        raise NonGermlineSampleError(
            f"Refusing sample for {patient_id!r}: missing origin file {origin_path}. "
            "Only samples explicitly marked sampleOrigin='germline' are permitted."
        )

    try:
        raw = origin_path.read_text(encoding="utf-8")
        data = json.loads(raw)
    except (OSError, json.JSONDecodeError) as exc:
        raise NonGermlineSampleError(
            f"Refusing sample for {patient_id!r}: unreadable or invalid JSON in {origin_path}: {exc}"
        ) from exc

    if not isinstance(data, dict):
        raise NonGermlineSampleError(
            f"Refusing sample for {patient_id!r}: {origin_path} must contain a JSON object."
        )

    origin = data.get("sampleOrigin")
    if origin != GERMLINE_ORIGIN:
        raise NonGermlineSampleError(
            f"Refusing non-germline sample for {patient_id!r}: "
            f"expected sampleOrigin='germline', got {origin!r} in {origin_path}."
        )

    return GERMLINE_ORIGIN


def tag_contract_germline(contract: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of ``contract`` with top-level ``sampleOrigin: 'germline'``."""
    tagged = copy.deepcopy(contract)
    tagged["sampleOrigin"] = GERMLINE_ORIGIN
    return tagged


def verify_contract_germline(contract: Dict[str, Any], source: str = "contract") -> None:
    """Raise ``NonGermlineSampleError`` if ``contract`` lacks ``sampleOrigin == 'germline'``."""
    origin = contract.get("sampleOrigin")
    if origin != GERMLINE_ORIGIN:
        raise NonGermlineSampleError(
            f"Invalid {source}: top-level sampleOrigin must be 'germline', got {origin!r}."
        )


def build_germline_source_component() -> Dict[str, Any]:
    """Build the HL7 Genomics Reporting IG component for LOINC 48002-0 = germline."""
    return {
        "code": {
            "coding": [
                {
                    "system": LOINC_SYSTEM,
                    "code": LOINC_GENOMIC_SOURCE_CLASS,
                    "display": "Genomic source class [Type]",
                }
            ]
        },
        "valueCodeableConcept": {
            "coding": [
                {
                    "system": LOINC_SYSTEM,
                    "code": LOINC_GERMLINE_CODE,
                    "display": "Germline",
                }
            ],
            "text": GERMLINE_ORIGIN,
        },
    }


def _is_source_class_component(component: Dict[str, Any]) -> bool:
    codings = component.get("code", {}).get("coding", [])
    return any(
        isinstance(c, dict) and c.get("code") == LOINC_GENOMIC_SOURCE_CLASS
        for c in codings
    )


def ensure_observation_germline(observation: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of a FHIR ``Observation`` tagged with LOINC 48002-0 = germline."""
    obs = copy.deepcopy(observation)
    components = list(obs.get("component") or [])
    germline_comp = build_germline_source_component()

    replaced = False
    updated_components: List[Dict[str, Any]] = []
    for comp in components:
        if isinstance(comp, dict) and _is_source_class_component(comp):
            if not replaced:
                updated_components.append(germline_comp)
                replaced = True
        else:
            updated_components.append(comp)

    if not replaced:
        updated_components.append(germline_comp)

    obs["component"] = updated_components
    return obs


def has_germline_source_class(observation: Dict[str, Any]) -> bool:
    """Return True iff the Observation carries LOINC 48002-0 with answer germline (LA6683-2)."""
    for comp in observation.get("component") or []:
        if not isinstance(comp, dict) or not _is_source_class_component(comp):
            continue
        val = comp.get("valueCodeableConcept", {})
        codings = val.get("coding", [])
        has_code = any(
            isinstance(c, dict) and c.get("code") == LOINC_GERMLINE_CODE
            for c in codings
        )
        has_text = str(val.get("text", "")).strip().lower() == GERMLINE_ORIGIN
        if has_code and has_text:
            return True
    return False


def guarded_process_patient(
    pheno_path: Path,
    in_dir: Path = DEFAULT_IN_DIR,
    out_dir: Path = DEFAULT_OUT_DIR,
    fhir_base: str = "http://localhost:8080/fhir",
    dry_run: bool = False,
) -> Tuple[Path, int]:
    """Enforce the strict A6 germline gate before running ``load_fhir.process_patient``.

    If ``<in_dir>/<patientId>.origin.json`` is missing or not ``"germline"``,
    raises ``NonGermlineSampleError`` immediately and writes nothing to FHIR.
    """
    patient_id = pheno_path.name.removesuffix(".phenotype.json")
    require_germline_origin(patient_id, in_dir=in_dir)

    from engine import load_fhir  # local import to avoid circularity at module load

    return load_fhir.process_patient(
        pheno_path=pheno_path,
        in_dir=in_dir,
        out_dir=out_dir,
        fhir_base=fhir_base,
        dry_run=dry_run,
    )


def discover_patient_ids(in_dir: Path, patient_id: Optional[str]) -> List[str]:
    """Return list of patient IDs from ``<patientId>.origin.json`` files."""
    if patient_id:
        return [patient_id]
    return sorted(
        p.name.removesuffix(".origin.json") for p in in_dir.glob("*.origin.json")
    )


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verify germline-only sample origin and contract tags (A6)."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Check all *.origin.json files")
    group.add_argument("--patient", type=str, help="Check a single patientId")
    parser.add_argument("--in-dir", type=Path, default=DEFAULT_IN_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument(
        "--check-contracts",
        action="store_true",
        help="Also verify sampleOrigin='germline' on matching *.contract.json files",
    )
    args = parser.parse_args(argv)

    patient_ids = discover_patient_ids(args.in_dir, None if args.all else args.patient)
    if not patient_ids:
        print(f"No *.origin.json files found in {args.in_dir}", file=sys.stderr)
        return 1

    try:
        for pid in patient_ids:
            require_germline_origin(pid, in_dir=args.in_dir)
            if args.check_contracts:
                contract_path = args.out_dir / f"{pid}.contract.json"
                if not contract_path.exists():
                    raise NonGermlineSampleError(
                        f"Missing contract file for {pid!r}: {contract_path}"
                    )
                contract_data = json.loads(contract_path.read_text(encoding="utf-8"))
                verify_contract_germline(contract_data, source=str(contract_path))
            print(f"[ok] {pid}: sampleOrigin=germline")
    except NonGermlineSampleError as exc:
        print(f"[REJECTED] {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
