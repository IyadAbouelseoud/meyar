#!/usr/bin/env python3
"""Unit tests for A7 phenoconversion (engine/phenoconvert.py)."""

from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path
from typing import Any, Dict

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from engine import phenoconvert

SCHEMA_PATH = REPO_ROOT / "docs" / "data-contract.schema.json"
INHIBITORS_PATH = REPO_ROOT / "tables" / "cyp_inhibitors.json"
MOCK_MEDS_PATH = REPO_ROOT / "tables" / "mock_current_meds.json"
FIXTURE_001_PATH = REPO_ROOT / "docs" / "fixtures" / "demo-001.contract.json"
FIXTURE_002_PATH = REPO_ROOT / "docs" / "fixtures" / "demo-002.contract.json"
FIXTURE_006_PATH = REPO_ROOT / "docs" / "fixtures" / "demo-006.contract.json"


def _validate_against_contract_schema(doc: Dict[str, Any], schema: Dict[str, Any]) -> None:
    """Validate a Meyar data-contract dict strictly against docs/data-contract.schema.json."""
    assert isinstance(doc, dict), "Contract root must be an object"
    required_top = set(schema["required"])
    assert required_top.issubset(doc.keys()), f"Missing top keys: {required_top - doc.keys()}"
    allowed_top = set(schema["properties"].keys())
    assert set(doc.keys()).issubset(allowed_top), f"Extra top keys: {set(doc.keys()) - allowed_top}"
    assert isinstance(doc["patientId"], str)
    assert doc["sampleOrigin"] == "germline"

    if "currentMedications" in doc:
        meds_schema = schema["properties"]["currentMedications"]["items"]
        allowed_med = set(meds_schema["properties"].keys())
        req_med = set(meds_schema["required"])
        assert isinstance(doc["currentMedications"], list)
        for med in doc["currentMedications"]:
            assert isinstance(med, dict)
            assert req_med.issubset(med.keys()), f"Missing med keys: {req_med - med.keys()}"
            assert set(med.keys()).issubset(allowed_med), f"Extra med keys: {set(med.keys()) - allowed_med}"
            assert isinstance(med["name"], str)
            assert med["source"] in meds_schema["properties"]["source"]["enum"]
            assert isinstance(med["mock"], bool)
            if "rxnorm" in med:
                assert isinstance(med["rxnorm"], str)

    gene_schema = schema["properties"]["genes"]["items"]
    req_gene = set(gene_schema["required"])
    allowed_gene = set(gene_schema["properties"].keys())
    cov_schema = gene_schema["properties"]["coverage"]
    req_cov = set(cov_schema["required"])
    allowed_cov = set(cov_schema["properties"].keys())
    pc_schema = gene_schema["properties"]["phenoconversion"]
    req_pc = set(pc_schema["required"])
    allowed_pc = set(pc_schema["properties"].keys())

    assert isinstance(doc["genes"], list)
    for g in doc["genes"]:
        assert isinstance(g, dict)
        assert req_gene.issubset(g.keys()), f"Missing gene keys: {req_gene - g.keys()}"
        assert set(g.keys()).issubset(allowed_gene), f"Extra gene keys: {set(g.keys()) - allowed_gene}"
        assert isinstance(g["gene"], str)
        # A8: an SV gene that is not assessed carries diplotype/phenotype null and no candidates.
        not_assessed = (g.get("callability") or {}).get("method") == "not-assessed"
        assert g["diplotype"] is None or isinstance(g["diplotype"], str)
        assert g["phenotype"] is None or isinstance(g["phenotype"], str)
        assert isinstance(g["candidates"], list) and (not_assessed or len(g["candidates"]) >= 1)
        assert all(isinstance(c, str) for c in g["candidates"])
        assert isinstance(g["guidelineVersion"], str)

        cov = g["coverage"]
        assert isinstance(cov, dict)
        assert req_cov.issubset(cov.keys())
        assert set(cov.keys()).issubset(allowed_cov)
        assert isinstance(cov["definingPositionsAssayed"], int) and cov["definingPositionsAssayed"] >= 0
        assert isinstance(cov["definingPositionsTotal"], int) and cov["definingPositionsTotal"] >= 0
        assert isinstance(cov["untestedLocalAlleles"], list)
        # A5: Tier 0/2 genes carry a null score.
        risk = cov["uninformativeNormalRisk"]
        assert risk is None or (isinstance(risk, (int, float)) and 0 <= risk <= 1)

        if "effectivePhenotype" in g:
            assert isinstance(g["effectivePhenotype"], str)
        if "phenoconversion" in g:
            pc = g["phenoconversion"]
            assert isinstance(pc, dict)
            assert req_pc.issubset(pc.keys())
            assert set(pc.keys()).issubset(allowed_pc)
            assert isinstance(pc["applied"], bool)
            if "cause" in pc:
                assert isinstance(pc["cause"], list) and all(isinstance(x, str) for x in pc["cause"])
            if "inhibitorStrength" in pc:
                assert pc["inhibitorStrength"] in pc_schema["properties"]["inhibitorStrength"]["enum"]
            if "geneticActivityScore" in pc:
                assert pc["geneticActivityScore"] is None or isinstance(pc["geneticActivityScore"], (int, float))
            if "adjustedActivityScore" in pc:
                assert pc["adjustedActivityScore"] is None or isinstance(pc["adjustedActivityScore"], (int, float))
            if "method" in pc:
                assert isinstance(pc["method"], str)


def _sample_contract(
    patient_id: str = "test-001",
    gene: str = "CYP2D6",
    diplotype: str = "*1/*1",
    phenotype: str = "Normal Metabolizer",
    meds: list | None = None,
) -> Dict[str, Any]:
    contract: Dict[str, Any] = {
        "patientId": patient_id,
        "sampleOrigin": "germline",
        "genes": [
            {
                "gene": gene,
                "diplotype": diplotype,
                "phenotype": phenotype,
                "candidates": [diplotype],
                "coverage": {
                    "definingPositionsAssayed": 0,
                    "definingPositionsTotal": 0,
                    "untestedLocalAlleles": [],
                    "uninformativeNormalRisk": 0.0,
                },
                "guidelineVersion": "CPIC 2021",
            }
        ],
    }
    if meds is not None:
        contract["currentMedications"] = meds
    return contract


class TestPhenoconvert(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.inhibitors = phenoconvert.load_inhibitors(INHIBITORS_PATH)
        cls.mock_meds = phenoconvert.load_mock_meds(MOCK_MEDS_PATH)
        cls.schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    def test_no_meds_applied_false(self) -> None:
        contract = _sample_contract(meds=[])
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        self.assertEqual(g["phenotype"], "Normal Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Normal Metabolizer")
        self.assertFalse(g["phenoconversion"]["applied"])
        self.assertEqual(g["phenoconversion"]["cause"], [])
        self.assertIsNone(g["phenoconversion"]["inhibitorStrength"])
        self.assertEqual(g["phenoconversion"]["geneticActivityScore"], 2.0)
        self.assertEqual(g["phenoconversion"]["adjustedActivityScore"], 2.0)
        _validate_against_contract_schema(result, self.schema)

    def test_paroxetine_plus_cyp2d6_1_1_becomes_poor_metabolizer(self) -> None:
        contract = _sample_contract(
            patient_id="demo-002",
            meds=[{"name": "paroxetine", "source": "hospital-record", "mock": True}],
        )
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        # Genetic phenotype must never be overwritten.
        self.assertEqual(g["phenotype"], "Normal Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Poor Metabolizer")
        self.assertEqual(
            g["phenoconversion"],
            {
                "applied": True,
                "cause": ["paroxetine"],
                "inhibitorStrength": "strong",
                "geneticActivityScore": 2.0,
                "adjustedActivityScore": 0.0,
                "method": "Thomas et al. 2020",
            },
        )
        _validate_against_contract_schema(result, self.schema)

    def test_moderate_inhibitor_halves_activity_score(self) -> None:
        # *1/*1 (AS 2.0) * 0.5 = 1.0 -> Intermediate Metabolizer
        contract = _sample_contract(
            meds=[{"name": "duloxetine", "source": "patient-entered", "mock": True}],
        )
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        self.assertEqual(g["phenotype"], "Normal Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Intermediate Metabolizer")
        self.assertTrue(g["phenoconversion"]["applied"])
        self.assertEqual(g["phenoconversion"]["inhibitorStrength"], "moderate")
        self.assertEqual(g["phenoconversion"]["cause"], ["duloxetine"])
        self.assertEqual(g["phenoconversion"]["geneticActivityScore"], 2.0)
        self.assertEqual(g["phenoconversion"]["adjustedActivityScore"], 1.0)
        _validate_against_contract_schema(result, self.schema)

        # *1/*2x2 (AS 3.0, UM) * 0.5 = 1.5 -> Normal Metabolizer
        um_contract = _sample_contract(
            diplotype="*1/*2x2",
            phenotype="Ultrarapid Metabolizer",
            meds=[{"name": "mirabegron", "source": "hospital-record", "mock": True}],
        )
        um_result = phenoconvert.phenoconvert_contract(um_contract, self.inhibitors)
        um_g = um_result["genes"][0]
        self.assertEqual(um_g["phenotype"], "Ultrarapid Metabolizer")
        self.assertEqual(um_g["effectivePhenotype"], "Normal Metabolizer")
        self.assertEqual(um_g["phenoconversion"]["geneticActivityScore"], 3.0)
        self.assertEqual(um_g["phenoconversion"]["adjustedActivityScore"], 1.5)
        _validate_against_contract_schema(um_result, self.schema)

    def test_strongest_inhibitor_wins_when_multiple_present(self) -> None:
        contract = _sample_contract(
            meds=[
                {"name": "duloxetine", "source": "hospital-record", "mock": True},
                {"name": "paroxetine", "source": "hospital-record", "mock": True},
            ]
        )
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        self.assertEqual(g["phenotype"], "Normal Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Poor Metabolizer")
        self.assertEqual(g["phenoconversion"]["inhibitorStrength"], "strong")
        self.assertEqual(g["phenoconversion"]["adjustedActivityScore"], 0.0)
        self.assertEqual(g["phenoconversion"]["cause"], ["duloxetine", "paroxetine"])
        _validate_against_contract_schema(result, self.schema)

    def test_unknown_drug_ignored_and_logged(self) -> None:
        contract = _sample_contract(
            meds=[{"name": "metformin", "source": "hospital-record", "mock": True}],
        )
        with self.assertLogs("meyar.phenoconvert", level="INFO") as cm:
            result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        self.assertTrue(
            any("Ignoring unknown medication" in msg and "metformin" in msg for msg in cm.output)
        )
        g = result["genes"][0]
        self.assertFalse(g["phenoconversion"]["applied"])
        self.assertEqual(g["effectivePhenotype"], "Normal Metabolizer")
        _validate_against_contract_schema(result, self.schema)

    def test_weak_inhibitor_does_not_phenoconvert(self) -> None:
        contract = _sample_contract(
            meds=[{"name": "sertraline", "source": "hospital-record", "mock": True}],
        )
        with self.assertLogs("meyar.phenoconvert", level="INFO") as cm:
            result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        self.assertTrue(any("Weak CYP2D6 inhibitor" in msg for msg in cm.output))
        g = result["genes"][0]
        self.assertFalse(g["phenoconversion"]["applied"])
        self.assertEqual(g["effectivePhenotype"], "Normal Metabolizer")
        _validate_against_contract_schema(result, self.schema)

    def test_other_gene_cyp2c19_flagged_without_score(self) -> None:
        contract = _sample_contract(
            patient_id="demo-003",
            gene="CYP2C19",
            diplotype="*1/*17",
            phenotype="Rapid Metabolizer",
            meds=[{"name": "Fluvoxamine", "source": "hospital-record", "mock": True}],
        )
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        self.assertEqual(g["phenotype"], "Rapid Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Rapid Metabolizer")
        self.assertTrue(g["phenoconversion"]["applied"])
        self.assertEqual(g["phenoconversion"]["inhibitorStrength"], "strong")
        self.assertEqual(g["phenoconversion"]["cause"], ["Fluvoxamine"])
        self.assertIsNone(g["phenoconversion"]["geneticActivityScore"])
        self.assertIsNone(g["phenoconversion"]["adjustedActivityScore"])
        _validate_against_contract_schema(result, self.schema)

    def test_unscorable_cyp2d6_not_fabricated(self) -> None:
        contract = _sample_contract(
            diplotype="Unknown/Unknown",
            phenotype="No Result",
            meds=[{"name": "paroxetine", "source": "hospital-record", "mock": True}],
        )
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        self.assertEqual(g["phenotype"], "No Result")
        self.assertEqual(g["effectivePhenotype"], "No Result")
        self.assertFalse(g["phenoconversion"]["applied"])
        self.assertIsNone(g["phenoconversion"]["geneticActivityScore"])
        self.assertIsNone(g["phenoconversion"]["adjustedActivityScore"])
        _validate_against_contract_schema(result, self.schema)

    def test_not_assessed_sv_gene_gets_no_effective_phenotype(self) -> None:
        # A8 not-assessed CYP2D6: phenotype/diplotype null. A strong inhibitor must not
        # produce an effective phenotype, and never the literal string "None".
        contract = _sample_contract(
            meds=[{"name": "paroxetine", "source": "hospital-record", "mock": True}],
        )
        g0 = contract["genes"][0]
        g0["diplotype"] = None
        g0["phenotype"] = None
        g0["candidates"] = []
        g0["callability"] = {"method": "not-assessed", "svAssessed": False, "reason": "test"}
        result = phenoconvert.phenoconvert_contract(contract, self.inhibitors)
        g = result["genes"][0]
        self.assertIsNone(g["phenotype"])
        self.assertNotIn("effectivePhenotype", g)
        self.assertFalse(g["phenoconversion"]["applied"])
        self.assertIsNone(g["phenoconversion"]["geneticActivityScore"])

    def test_non_germline_contract_rejected(self) -> None:
        contract = _sample_contract()
        contract["sampleOrigin"] = "somatic"
        with self.assertRaises(ValueError):
            phenoconvert.phenoconvert_contract(contract, self.inhibitors)

    def test_inhibitor_table_rows_have_fda_source_and_accessed_date(self) -> None:
        data = json.loads(INHIBITORS_PATH.read_text(encoding="utf-8"))
        self.assertEqual(data["_owner"], "A7")
        self.assertGreater(len(data["rows"]), 0)
        for row in data["rows"]:
            self.assertIn(row["enzyme"], {"CYP2D6", "CYP2C19"})
            self.assertIn(row["strength"], {"strong", "moderate", "weak"})
            self.assertTrue(str(row["source"]).startswith("https://www.fda.gov/"))
            self.assertRegex(str(row["accessed"]), r"^\d{4}-\d{2}-\d{2}$")

    def test_mock_current_meds_demo_001_to_006_all_mock_true(self) -> None:
        data = json.loads(MOCK_MEDS_PATH.read_text(encoding="utf-8"))
        self.assertEqual(data["_owner"], "A7")
        pids = {r["patientId"] for r in data["rows"]}
        self.assertTrue({f"demo-00{i}" for i in range(1, 7)}.issubset(pids))
        for row in data["rows"]:
            self.assertIs(row["mock"], True)
            for med in row["medications"]:
                self.assertIs(med["mock"], True)
                self.assertIn(med["source"], {"hospital-record", "patient-entered"})
        self.assertEqual([m["name"] for m in self.mock_meds["demo-002"]], ["paroxetine"])
        # Review finding 4: the moderate-inhibitor case sits on a patient whose CYP2D6 is
        # actually assessed (demo-006 outside call), not on a not-assessed patient.
        self.assertEqual([m["name"] for m in self.mock_meds["demo-006"]], ["duloxetine"])
        self.assertEqual(self.mock_meds["demo-004"], [])

    def test_demo_006_ultrarapid_on_moderate_inhibitor_acts_normal(self) -> None:
        fixture_006 = json.loads(FIXTURE_006_PATH.read_text(encoding="utf-8"))
        base = {
            "patientId": fixture_006["patientId"],
            "sampleOrigin": fixture_006["sampleOrigin"],
            "genes": [
                {k: v for k, v in g.items() if k not in {"effectivePhenotype", "phenoconversion"}}
                for g in fixture_006["genes"]
            ],
        }
        out = phenoconvert.phenoconvert_contract(
            base, self.inhibitors, meds_override=self.mock_meds["demo-006"]
        )
        self.assertEqual(out, fixture_006)
        g = next(x for x in out["genes"] if x["gene"] == "CYP2D6")
        self.assertEqual(g["diplotype"], "*1/*2x2")
        self.assertEqual(g["phenotype"], "Ultrarapid Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Normal Metabolizer")
        self.assertEqual(
            g["phenoconversion"],
            {
                "applied": True,
                "cause": ["duloxetine"],
                "inhibitorStrength": "moderate",
                "geneticActivityScore": 3.0,
                "adjustedActivityScore": 1.5,
                "method": "Thomas et al. 2020",
            },
        )
        _validate_against_contract_schema(out, self.schema)

    def test_demo_002_fixture_matches_engine_and_schema(self) -> None:
        fixture_002 = json.loads(FIXTURE_002_PATH.read_text(encoding="utf-8"))
        _validate_against_contract_schema(fixture_002, self.schema)
        recomputed = phenoconvert.phenoconvert_contract(
            {
                "patientId": fixture_002["patientId"],
                "sampleOrigin": fixture_002["sampleOrigin"],
                "genes": [
                    {
                        k: v
                        for k, v in fixture_002["genes"][0].items()
                        if k not in {"effectivePhenotype", "phenoconversion"}
                    }
                ],
            },
            self.inhibitors,
            meds_override=self.mock_meds["demo-002"],
        )
        self.assertEqual(recomputed, fixture_002)
        g = recomputed["genes"][0]
        self.assertEqual(g["phenotype"], "Normal Metabolizer")
        self.assertEqual(g["effectivePhenotype"], "Poor Metabolizer")
        self.assertEqual(g["phenoconversion"]["cause"], ["paroxetine"])

        # Also verify demo-001 fixture passes after phenoconversion
        fixture_001 = json.loads(FIXTURE_001_PATH.read_text(encoding="utf-8"))
        out_001 = phenoconvert.phenoconvert_contract(
            fixture_001,
            self.inhibitors,
            meds_override=self.mock_meds["demo-001"],
        )
        _validate_against_contract_schema(out_001, self.schema)
        self.assertFalse(out_001["genes"][0]["phenoconversion"]["applied"])


if __name__ == "__main__":
    unittest.main()
