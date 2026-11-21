#!/usr/bin/env python3
"""Unit tests for the A6 germline-only guard (engine/origin_guard.py)."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from engine import load_fhir, origin_guard


class TestOriginGuard(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self._tmp.name)
        self.in_dir = self.tmp_path / "in"
        self.out_dir = self.tmp_path / "out"
        self.in_dir.mkdir()
        self.out_dir.mkdir()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _write_origin(self, patient_id: str, payload: object) -> Path:
        path = self.in_dir / f"{patient_id}.origin.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return path

    def _write_minimal_phenotype(self, patient_id: str) -> Path:
        pheno_path = self.out_dir / f"{patient_id}.phenotype.json"
        pheno_data = {
            "source": "CPIC",
            "version": "2022-11",
            "geneReports": {
                "CPIC": {
                    "CYP2C19": {
                        "phenotypeSource": "CPIC",
                        "version": "2022-11",
                        "sourceDiplotypes": [
                            {
                                "label": "*2/*2",
                                "phenotypes": ["Poor Metabolizer"],
                            }
                        ],
                    }
                }
            },
        }
        pheno_path.write_text(json.dumps(pheno_data), encoding="utf-8")
        return pheno_path

    def test_somatic_sample_is_rejected_and_writes_nothing_to_fhir(self) -> None:
        self._write_origin("tumour-001", {"sampleOrigin": "somatic"})
        pheno_path = self._write_minimal_phenotype("tumour-001")

        with mock.patch.object(load_fhir, "fhir_put") as mock_fhir_put:
            with self.assertRaises(origin_guard.NonGermlineSampleError) as ctx:
                origin_guard.guarded_process_patient(
                    pheno_path=pheno_path,
                    in_dir=self.in_dir,
                    out_dir=self.out_dir,
                    dry_run=False,
                )

            self.assertIn("somatic", str(ctx.exception))
            mock_fhir_put.assert_not_called()
            self.assertFalse((self.out_dir / "tumour-001.contract.json").exists())

    def test_missing_origin_file_is_rejected(self) -> None:
        pheno_path = self._write_minimal_phenotype("missing-001")

        with mock.patch.object(load_fhir, "fhir_put") as mock_fhir_put:
            with self.assertRaises(origin_guard.NonGermlineSampleError) as ctx:
                origin_guard.guarded_process_patient(
                    pheno_path=pheno_path,
                    in_dir=self.in_dir,
                    out_dir=self.out_dir,
                    dry_run=False,
                )

            self.assertIn("missing origin file", str(ctx.exception))
            mock_fhir_put.assert_not_called()

    def test_missing_or_invalid_sample_origin_values_are_rejected(self) -> None:
        for idx, payload in enumerate(
            [
                {},
                {"sampleOrigin": None},
                {"sampleOrigin": ""},
                {"sampleOrigin": "tumor"},
                ["germline"],
            ]
        ):
            pid = f"bad-{idx}"
            self._write_origin(pid, payload)
            with self.assertRaises(origin_guard.NonGermlineSampleError):
                origin_guard.require_germline_origin(pid, in_dir=self.in_dir)

    def test_malformed_origin_json_is_rejected(self) -> None:
        bad_path = self.in_dir / "corrupt-001.origin.json"
        bad_path.write_text("{not valid json", encoding="utf-8")
        with self.assertRaises(origin_guard.NonGermlineSampleError):
            origin_guard.require_germline_origin("corrupt-001", in_dir=self.in_dir)

    def test_germline_sample_is_accepted_and_tagged(self) -> None:
        self._write_origin("germ-001", {"sampleOrigin": "germline"})
        pheno_path = self._write_minimal_phenotype("germ-001")

        with mock.patch.object(load_fhir, "fhir_put", return_value={}) as mock_fhir_put:
            contract_path, obs_count = origin_guard.guarded_process_patient(
                pheno_path=pheno_path,
                in_dir=self.in_dir,
                out_dir=self.out_dir,
                dry_run=False,
            )

        self.assertEqual(obs_count, 1)
        # 1 Patient + 1 Observation
        self.assertEqual(mock_fhir_put.call_count, 2)
        obs_sent = mock_fhir_put.call_args_list[1].args[1]
        self.assertTrue(origin_guard.has_germline_source_class(obs_sent))

        contract = json.loads(contract_path.read_text(encoding="utf-8"))
        self.assertEqual(contract.get("sampleOrigin"), "germline")
        origin_guard.verify_contract_germline(contract)

    def test_tag_contract_and_ensure_observation_germline(self) -> None:
        contract = origin_guard.tag_contract_germline({"patientId": "x", "genes": []})
        self.assertEqual(contract["sampleOrigin"], "germline")

        obs_without_origin = {"resourceType": "Observation", "id": "obs-1", "component": []}
        tagged_obs = origin_guard.ensure_observation_germline(obs_without_origin)
        self.assertTrue(origin_guard.has_germline_source_class(tagged_obs))

    def test_demo_cohort_origin_and_contracts_are_germline(self) -> None:
        real_in = REPO_ROOT / "engine" / "data" / "in"
        real_out = REPO_ROOT / "engine" / "data" / "out"
        for i in range(1, 7):
            pid = f"demo-00{i}"
            self.assertEqual(
                origin_guard.require_germline_origin(pid, in_dir=real_in),
                "germline",
            )
            contract_path = real_out / f"{pid}.contract.json"
            self.assertTrue(contract_path.exists(), f"Missing {contract_path}")
            contract = json.loads(contract_path.read_text(encoding="utf-8"))
            origin_guard.verify_contract_germline(contract, source=contract_path.name)


if __name__ == "__main__":
    unittest.main()
