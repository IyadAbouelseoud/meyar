#!/usr/bin/env python3
"""Load PharmCAT 3.4.0 phenotypes into local HAPI FHIR (Genomics Reporting IG)
and emit Meyar data-contract JSON files.

Reads:
  - engine/data/out/<patientId>.phenotype.json (required)
  - engine/data/out/<patientId>.match.json (optional, for all candidate diplotypes)
  - engine/data/in/<patientId>.origin.json (optional, enforces germline-only gate)

Writes:
  - FHIR R4 Patient + one Observation per gene to http://localhost:8080/fhir
  - engine/data/out/<patientId>.contract.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN_DIR = REPO_ROOT / "engine" / "data" / "in"
DEFAULT_OUT_DIR = REPO_ROOT / "engine" / "data" / "out"
DEFAULT_FHIR_BASE = "http://localhost:8080/fhir"

GENOTYPE_PROFILE_URL = (
    "http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/genotype"
)


def sanitize_fhir_id(raw: str) -> str:
    """Return a FHIR-safe id ([A-Za-z0-9\\-\\.]{1,64})."""
    cleaned = re.sub(r"[^A-Za-z0-9\-.]", "-", raw.strip())
    return cleaned[:64] or "unknown"


def check_germline_origin(patient_id: str, in_dir: Path) -> str:
    """Verify <patientId>.origin.json is germline if present."""
    origin_path = in_dir / f"{patient_id}.origin.json"
    if not origin_path.exists():
        return "germline"
    data = json.loads(origin_path.read_text(encoding="utf-8"))
    origin = data.get("sampleOrigin")
    if origin != "germline":
        raise ValueError(
            f"Refusing non-germline sample for {patient_id}: sampleOrigin={origin!r}"
        )
    return "germline"


def extract_gene_reports(pheno_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Extract per-gene report dicts from PharmCAT 3.4.0 .phenotype.json."""
    gene_reports = pheno_data.get("geneReports", {})
    if not isinstance(gene_reports, dict):
        return {}

    # PharmCAT 3.4.0 may nest under source keys ("CPIC", "DPWG") or map gene -> report directly.
    if "CPIC" in gene_reports or "DPWG" in gene_reports:
        merged: Dict[str, Dict[str, Any]] = {}
        for source_key in ("DPWG", "CPIC"):
            sub = gene_reports.get(source_key)
            if isinstance(sub, dict):
                for gene, report in sub.items():
                    if isinstance(report, dict):
                        merged[gene] = report
        return merged

    return {
        gene: report
        for gene, report in gene_reports.items()
        if isinstance(report, dict)
    }


def extract_diplotype_label(entry: Dict[str, Any]) -> str:
    """Build a diplotype string from a PharmCAT sourceDiplotypes/recommendationDiplotypes item."""
    if entry.get("label"):
        return str(entry["label"]).strip()
    a1 = entry.get("allele1", {})
    a2 = entry.get("allele2", {})
    n1 = a1.get("name") if isinstance(a1, dict) else a1
    n2 = a2.get("name") if isinstance(a2, dict) else a2
    if n1 and n2:
        return f"{n1}/{n2}"
    if n1:
        return str(n1)
    return "Unknown/Unknown"


def extract_match_candidates(match_path: Path) -> Dict[str, List[str]]:
    """Read all viable candidate diplotypes per gene from PharmCAT .match.json."""
    if not match_path.exists():
        return {}
    match_data = json.loads(match_path.read_text(encoding="utf-8"))
    candidates_by_gene: Dict[str, List[str]] = {}
    for res in match_data.get("results", []):
        gene = res.get("gene")
        if not gene:
            continue
        names: List[str] = []
        for dip in res.get("diplotypes", []):
            name = dip.get("name")
            if name and name not in names:
                names.append(str(name))
        if names:
            candidates_by_gene[gene] = names
    return candidates_by_gene


def extract_guideline_version(pheno_data: Dict[str, Any], report: Dict[str, Any]) -> str:
    """Extract guideline/source version string from PharmCAT .phenotype.json."""
    source = str(report.get("phenotypeSource") or pheno_data.get("source") or "CPIC").strip()
    version = str(
        report.get("version")
        or pheno_data.get("version")
        or pheno_data.get("phenotypeVersion")
        or "PharmCAT 3.4.0"
    ).strip()
    if version.startswith(source):
        return version
    return f"{source} {version}".strip()


def parse_phenotype_file(
    pheno_path: Path,
    in_dir: Path,
) -> Tuple[str, List[Dict[str, Any]]]:
    """Parse a PharmCAT .phenotype.json into (patient_id, gene_records)."""
    patient_id = pheno_path.name.removesuffix(".phenotype.json")
    check_germline_origin(patient_id, in_dir)

    pheno_data = json.loads(pheno_path.read_text(encoding="utf-8"))
    match_path = pheno_path.with_name(f"{patient_id}.match.json")
    match_candidates = extract_match_candidates(match_path)
    gene_reports = extract_gene_reports(pheno_data)

    genes: List[Dict[str, Any]] = []
    for gene, report in sorted(gene_reports.items()):
        src_dips = report.get("sourceDiplotypes", []) or []
        rec_dips = report.get("recommendationDiplotypes", []) or []
        dip_entries = src_dips if src_dips else rec_dips

        candidates: List[str] = list(match_candidates.get(gene, []))
        phenotypes: List[str] = []
        for entry in dip_entries:
            label = extract_diplotype_label(entry)
            if label and label not in candidates:
                candidates.append(label)
            for ph in entry.get("phenotypes", []) or []:
                ph_str = str(ph).strip()
                if ph_str and ph_str not in phenotypes:
                    phenotypes.append(ph_str)

        if not candidates:
            candidates = ["No Result"]

        primary_diplotype = candidates[0]
        phenotype = phenotypes[0] if phenotypes else "Indeterminate"
        guideline_version = extract_guideline_version(pheno_data, report)

        genes.append(
            {
                "gene": gene,
                "diplotype": primary_diplotype,
                "phenotype": phenotype,
                "candidates": candidates,
                # Neutral pre-A5 placeholder so contract.json validates against
                # docs/data-contract.schema.json; A5 (engine/coverage.py) owns real values.
                "coverage": {
                    "definingPositionsAssayed": 0,
                    "definingPositionsTotal": 0,
                    "untestedLocalAlleles": [],
                    "uninformativeNormalRisk": 0.0,
                },
                "guidelineVersion": guideline_version,
            }
        )

    return patient_id, genes


def build_fhir_patient(patient_id: str) -> Dict[str, Any]:
    """Build a pseudonymous FHIR R4 Patient resource."""
    fhir_id = sanitize_fhir_id(patient_id)
    return {
        "resourceType": "Patient",
        "id": fhir_id,
        "identifier": [
            {
                "system": "urn:meyar:patient",
                "value": patient_id,
            }
        ],
    }


def build_fhir_observation(patient_id: str, gene_entry: Dict[str, Any]) -> Dict[str, Any]:
    """Build a FHIR R4 Observation following the HL7 Genomics Reporting IG."""
    fhir_patient_id = sanitize_fhir_id(patient_id)
    gene = gene_entry["gene"]
    obs_id = sanitize_fhir_id(f"{fhir_patient_id}-{gene.lower()}")

    obs: Dict[str, Any] = {
        "resourceType": "Observation",
        "id": obs_id,
        "meta": {
            "profile": [GENOTYPE_PROFILE_URL],
        },
        "status": "final",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "laboratory",
                        "display": "Laboratory",
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "84413-4",
                    "display": "Genotype display name",
                }
            ],
            "text": f"{gene} genotype and phenotype",
        },
        "subject": {
            "reference": f"Patient/{fhir_patient_id}",
        },
        "valueCodeableConcept": {
            "text": gene_entry["diplotype"],
        },
        "component": [
            {
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "48018-6",
                            "display": "Gene studied [ID]",
                        }
                    ]
                },
                "valueCodeableConcept": {
                    "text": gene,
                },
            },
            {
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "48002-0",
                            "display": "Genomic source class [Type]",
                        }
                    ]
                },
                "valueCodeableConcept": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "LA6683-2",
                            "display": "Germline",
                        }
                    ],
                    "text": "germline",
                },
            },
            {
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "53037-8",
                            "display": "Genetic variation clinical significance [Imp]",
                        }
                    ],
                    "text": "Metabolizer phenotype",
                },
                "valueCodeableConcept": {
                    "text": gene_entry["phenotype"],
                },
            },
            {
                "code": {
                    "text": "Guideline version",
                },
                "valueString": gene_entry["guidelineVersion"],
            },
        ],
    }

    if len(gene_entry["candidates"]) > 1:
        obs["note"] = [
            {
                "text": "Candidate diplotypes: " + ", ".join(gene_entry["candidates"]),
            }
        ]

    return obs


def fhir_put(fhir_base: str, resource: Dict[str, Any]) -> Dict[str, Any]:
    """Idempotently PUT a FHIR resource to the local HAPI server."""
    base = fhir_base.rstrip("/")
    rtype = resource["resourceType"]
    rid = resource["id"]
    url = f"{base}/{rtype}/{rid}"
    payload = json.dumps(resource).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PUT",
        headers={
            "Content-Type": "application/fhir+json",
            "Accept": "application/fhir+json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"FHIR PUT {url} failed ({exc.code}): {err_body}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Cannot reach HAPI FHIR server at {base}: {exc.reason}"
        ) from exc


def write_contract(
    patient_id: str,
    genes: List[Dict[str, Any]],
    out_dir: Path,
) -> Path:
    """Write <patientId>.contract.json in the exact Meyar data-contract shape."""
    contract = {
        "patientId": patient_id,
        "sampleOrigin": "germline",
        "genes": genes,
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    contract_path = out_dir / f"{patient_id}.contract.json"
    contract_path.write_text(
        json.dumps(contract, indent=2) + "\n",
        encoding="utf-8",
    )
    return contract_path


def process_patient(
    pheno_path: Path,
    in_dir: Path,
    out_dir: Path,
    fhir_base: str,
    dry_run: bool = False,
) -> Tuple[Path, int]:
    """Load one patient's PharmCAT phenotype into FHIR and write contract.json."""
    patient_id, genes = parse_phenotype_file(pheno_path, in_dir)
    patient_res = build_fhir_patient(patient_id)
    observations = [build_fhir_observation(patient_id, g) for g in genes]

    if not dry_run:
        fhir_put(fhir_base, patient_res)
        for obs in observations:
            fhir_put(fhir_base, obs)

    contract_path = write_contract(patient_id, genes, out_dir)
    return contract_path, len(observations)


def discover_phenotype_files(out_dir: Path, patient_id: Optional[str]) -> List[Path]:
    """Locate PharmCAT .phenotype.json files to process."""
    if patient_id:
        candidate = out_dir / f"{patient_id}.phenotype.json"
        if not candidate.exists():
            raise FileNotFoundError(f"Missing phenotype file: {candidate}")
        return [candidate]
    return sorted(out_dir.glob("*.phenotype.json"))


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Load PharmCAT .phenotype.json into local HAPI FHIR and emit contract.json."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--all",
        action="store_true",
        help="Process all *.phenotype.json files in engine/data/out/",
    )
    group.add_argument(
        "--patient",
        type=str,
        help="Process a single patientId (e.g. demo-001)",
    )
    parser.add_argument(
        "--in-dir",
        type=Path,
        default=DEFAULT_IN_DIR,
        help="Directory containing <patientId>.origin.json files",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Directory containing PharmCAT .phenotype.json and output .contract.json",
    )
    parser.add_argument(
        "--fhir-base",
        type=str,
        default=DEFAULT_FHIR_BASE,
        help="Local HAPI FHIR base URL (default: http://localhost:8080/fhir)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Write contract.json without calling the HAPI FHIR server",
    )
    args = parser.parse_args(argv)

    files = discover_phenotype_files(args.out_dir, None if args.all else args.patient)
    if not files:
        print(f"No *.phenotype.json files found in {args.out_dir}", file=sys.stderr)
        return 1

    for pheno_path in files:
        contract_path, obs_count = process_patient(
            pheno_path=pheno_path,
            in_dir=args.in_dir,
            out_dir=args.out_dir,
            fhir_base=args.fhir_base,
            dry_run=args.dry_run,
        )
        mode = "dry-run" if args.dry_run else args.fhir_base
        print(f"[ok] {pheno_path.name} -> {obs_count} Observations ({mode}), {contract_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
