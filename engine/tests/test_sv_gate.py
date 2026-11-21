"""Unit and integration tests for A8 (`engine/sv_gate.py`, `tables/sv_genes.json`,
`engine/data/in/*.outside.tsv`, and `engine/run_pharmcat.sh`).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict

import jsonschema

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from engine.sv_gate import (  # noqa: E402
    apply_sv_gate,
    load_sv_genes,
    parse_outside_calls,
)

SV_GENES_PATH = REPO_ROOT / "tables" / "sv_genes.json"
SCHEMA_PATH = REPO_ROOT / "docs" / "data-contract.schema.json"
IN_DIR = REPO_ROOT / "engine" / "data" / "in"
OUT_DIR = REPO_ROOT / "engine" / "data" / "out"
FIXTURES_DIR = REPO_ROOT / "docs" / "fixtures"
RUN_PHARMCAT_PATH = REPO_ROOT / "engine" / "run_pharmcat.sh"


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _gene_by_name(contract: Dict[str, Any], gene: str) -> Dict[str, Any]:
    for entry in contract.get("genes", []):
        if entry.get("gene") == gene:
            return entry
    raise KeyError(f"{gene} not found in contract for {contract.get('patientId')}")


def test_sv_genes_table_has_required_fields_and_quotes() -> None:
    raw = _load_json(SV_GENES_PATH)
    assert raw.get("_owner") == "A8"
    sv_genes = load_sv_genes(SV_GENES_PATH)
    assert "CYP2D6" in sv_genes

    cyp2d6 = sv_genes["CYP2D6"]
    assert cyp2d6["callableFromVcf"] is False
    classes_joined = " ".join(cyp2d6["structuralClasses"]).lower()
    assert "duplication" in classes_joined
    assert "deletion" in classes_joined
    assert "hybrid" in classes_joined
    assert "we do NOT recommend calling CYP2D6 from VCF" in cyp2d6["justification"]
    assert "missing the copy number" in cyp2d6["justification"]
    assert "Goljan et al." in cyp2d6["independentConfirmation"]
    assert cyp2d6["requiredInput"]


def test_vcf_only_patient_yields_not_assessed_with_null_phenotype() -> None:
    sv_genes = load_sv_genes(SV_GENES_PATH)

    # Real demo-001 (no outside-call TSV)
    contract_001 = _load_json(OUT_DIR / "demo-001.contract.json")
    pheno_001 = _load_json(OUT_DIR / "demo-001.phenotype.json")
    gated_001 = apply_sv_gate(contract_001, sv_genes, pheno_001, outside_file=None)
    cyp2d6_001 = _gene_by_name(gated_001, "CYP2D6")

    assert cyp2d6_001["diplotype"] is None
    assert cyp2d6_001["phenotype"] is None
    assert cyp2d6_001["candidates"] == []
    assert cyp2d6_001["callability"]["method"] == "not-assessed"
    assert cyp2d6_001["callability"]["svAssessed"] is False
    assert "do NOT recommend calling CYP2D6 from VCF" in cyp2d6_001["callability"]["reason"]
    assert cyp2d6_001["callability"]["requiredInput"]

    # Non-SV gene stays VCF-called
    cyp2c19_001 = _gene_by_name(gated_001, "CYP2C19")
    assert cyp2c19_001["callability"] == {"method": "vcf", "svAssessed": False}

    # Adversarial VCF-only input where PharmCAT matcher tried to call CYP2D6 from SNPs:
    # gate must strip diplotype/phenotype and never fall back to the VCF call.
    adversarial_contract = {
        "patientId": "vcf-only-test",
        "sampleOrigin": "germline",
        "genes": [
            {
                "gene": "CYP2D6",
                "diplotype": "*1/*1",
                "phenotype": "Normal " + "Metabolizer",
                "candidates": ["*1/*1"],
                "coverage": {
                    "definingPositionsAssayed": 0,
                    "definingPositionsTotal": 0,
                    "untestedLocalAlleles": [],
                    "uninformativeNormalRisk": None,
                    "saudiDataTier": 0,
                },
                "guidelineVersion": "CPIC PharmCAT 3.4.0",
            }
        ],
    }
    adversarial_pheno = {
        "geneReports": {
            "CYP2D6": {
                "callSource": "MATCHER",
            }
        }
    }
    gated_adv = apply_sv_gate(adversarial_contract, sv_genes, adversarial_pheno, outside_file=None)
    cyp2d6_adv = _gene_by_name(gated_adv, "CYP2D6")
    assert cyp2d6_adv["diplotype"] is None
    assert cyp2d6_adv["phenotype"] is None
    assert cyp2d6_adv["candidates"] == []
    assert cyp2d6_adv["callability"]["method"] == "not-assessed"
    assert cyp2d6_adv["callability"]["svAssessed"] is False

    # Even if an outside TSV exists, if PharmCAT phenotype JSON says MATCHER (not OUTSIDE),
    # the gate still refuses the VCF-derived call.
    outside_006 = parse_outside_calls(IN_DIR / "demo-006.outside.tsv")
    gated_mismatch = apply_sv_gate(adversarial_contract, sv_genes, adversarial_pheno, outside_006)
    assert _gene_by_name(gated_mismatch, "CYP2D6")["callability"]["method"] == "not-assessed"
    assert _gene_by_name(gated_mismatch, "CYP2D6")["phenotype"] is None


def test_outside_call_ultrarapid_duplication_demo_006() -> None:
    sv_genes = load_sv_genes(SV_GENES_PATH)
    contract_006 = _load_json(OUT_DIR / "demo-006.contract.json")
    pheno_006 = _load_json(OUT_DIR / "demo-006.phenotype.json")
    outside_006 = parse_outside_calls(IN_DIR / "demo-006.outside.tsv")

    assert pheno_006["geneReports"]["CYP2D6"]["callSource"] == "OUTSIDE"
    assert outside_006.mock is True
    assert outside_006.source is not None

    gated = apply_sv_gate(contract_006, sv_genes, pheno_006, outside_006)
    cyp2d6 = _gene_by_name(gated, "CYP2D6")

    assert cyp2d6["diplotype"] == "*1/*2x2"
    assert cyp2d6["phenotype"] == "Ultrarapid Metabolizer"
    assert cyp2d6["candidates"] == ["*1/*2x2"]
    assert cyp2d6["callability"] == {
        "method": "outside-call",
        "svAssessed": True,
        "source": outside_006.source,
    }


def test_outside_call_normal_demo_002() -> None:
    sv_genes = load_sv_genes(SV_GENES_PATH)
    contract_002 = _load_json(OUT_DIR / "demo-002.contract.json")
    pheno_002 = _load_json(OUT_DIR / "demo-002.phenotype.json")
    outside_002 = parse_outside_calls(IN_DIR / "demo-002.outside.tsv")

    assert pheno_002["geneReports"]["CYP2D6"]["callSource"] == "OUTSIDE"
    assert outside_002.mock is True
    assert outside_002.source is not None

    gated = apply_sv_gate(contract_002, sv_genes, pheno_002, outside_002)
    cyp2d6 = _gene_by_name(gated, "CYP2D6")

    assert cyp2d6["diplotype"] == "*1/*1"
    assert cyp2d6["phenotype"] == "Normal Metabolizer"
    assert cyp2d6["callability"] == {
        "method": "outside-call",
        "svAssessed": True,
        "source": outside_002.source,
    }


def test_all_mock_outside_call_files_marked_and_named() -> None:
    outside_files = sorted(IN_DIR.glob("*.outside.tsv"))
    assert len(outside_files) >= 2

    duplication_seen = False
    for path in outside_files:
        parsed = parse_outside_calls(path)
        assert parsed.mock is True, f"{path.name} must contain '# mock: true'"
        assert parsed.source, f"{path.name} must contain '# source: <caller and version>'"
        assert re.search(r"v?\d+\.\d+", parsed.source), (
            f"{path.name} source header should include a caller version: {parsed.source!r}"
        )
        assert "CYP2D6" in parsed.calls
        if "x2" in (parsed.calls["CYP2D6"]["diplotype"] or "") or "x3" in (
            parsed.calls["CYP2D6"]["diplotype"] or ""
        ):
            duplication_seen = True

    assert duplication_seen, "At least one mock outside-call file must carry a duplication"

    # At least one demo patient must have NO outside-call file so 'not-assessed' is exercised.
    vcf_patients = {p.stem for p in IN_DIR.glob("demo-*.origin.json")}
    # stem of demo-001.origin.json is demo-001.origin -> strip .origin
    patient_ids = {p.name.removesuffix(".origin.json") for p in IN_DIR.glob("demo-*.origin.json")}
    outside_ids = {p.name.removesuffix(".outside.tsv") for p in outside_files}
    assert len(patient_ids - outside_ids) >= 1


def test_all_demo_contracts_and_fixtures_validate_schema_and_callability() -> None:
    schema = _load_json(SCHEMA_PATH)

    for idx in range(1, 7):
        pid = f"demo-00{idx}"
        contract = _load_json(OUT_DIR / f"{pid}.contract.json")
        jsonschema.validate(instance=contract, schema=schema)
        for gene_entry in contract["genes"]:
            assert "callability" in gene_entry
            if gene_entry["gene"] == "CYP2D6":
                if pid in ("demo-002", "demo-006"):
                    assert gene_entry["callability"]["method"] == "outside-call"
                    assert gene_entry["callability"]["svAssessed"] is True
                else:
                    assert gene_entry["callability"]["method"] == "not-assessed"
                    assert gene_entry["callability"]["svAssessed"] is False
                    assert gene_entry["phenotype"] is None
                    assert gene_entry["diplotype"] is None
                    assert gene_entry["candidates"] == []

    for fixture_path in sorted(FIXTURES_DIR.glob("*.contract.json")):
        fixture = _load_json(fixture_path)
        jsonschema.validate(instance=fixture, schema=schema)
        for gene_entry in fixture["genes"]:
            assert "callability" in gene_entry


def test_no_dangerous_pharmcat_flags_in_run_pharmcat() -> None:
    script_text = RUN_PHARMCAT_PATH.read_text(encoding="utf-8")
    assert "-po" in script_text
    for dangerous in ("--missing-to-ref", "--absent-to-ref", "--unspecified-to-ref", " -0"):
        assert dangerous not in script_text
