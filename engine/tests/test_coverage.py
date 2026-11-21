"""Unit tests for A5 (`engine/coverage.py` and `tables/saudi_frequencies.json`)."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict

import jsonschema

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from engine.coverage import (  # noqa: E402
    TIER2_NOTE,
    compute_gene_coverage,
    compute_match_coverage,
    enrich_contract,
    extract_match_gene_index,
    load_saudi_frequencies,
    load_sv_genes,
)

SAUDI_FREQ_PATH = REPO_ROOT / "tables" / "saudi_frequencies.json"
SV_GENES_PATH = REPO_ROOT / "tables" / "sv_genes.json"
SCHEMA_PATH = REPO_ROOT / "docs" / "data-contract.schema.json"
OUT_DIR = REPO_ROOT / "engine" / "data" / "out"
GETRM_NA10831_MATCH = (
    REPO_ROOT
    / "engine"
    / "validation"
    / "data"
    / "out"
    / "getrm_5samples_chr10_cyp2c.NA10831.match.json"
)


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def test_saudi_frequencies_table_integrity_and_citations() -> None:
    raw = _load_json(SAUDI_FREQ_PATH)
    stmt = raw.get("_coverageStatement", "")
    tier1_expected = {
        "CYP2C9",
        "CYP2C19",
        "CYP3A5",
        "CYP4F2",
        "VKORC1",
        "DPYD",
        "TPMT",
        "NUDT15",
    }
    for gene in tier1_expected:
        assert gene in stmt
    assert "11,889" in stmt

    rows = raw.get("rows", [])
    assert len(rows) >= 10
    tier1_genes_seen = set()
    total_tier1_alleles = 0

    for row in rows:
        tier = row.get("saudiDataTier")
        assert tier in (0, 1, 2)
        src = row.get("source", {})
        assert "n" in src and src["n"] == 11889
        assert "table" in src and str(src["table"]).strip() != ""
        assert "doi" in src and src["doi"] == "10.1371/journal.pone.0263137"

        if tier == 1:
            tier1_genes_seen.add(row["gene"])
            assert src["table"] == "Table 1"
            assert len(row["alleles"]) > 0
            for allele in row["alleles"]:
                total_tier1_alleles += 1
                assert allele.get("saudiDataTier") == 1
                asrc = allele.get("source", {})
                assert asrc.get("n") == 11889
                assert asrc.get("table") == "Table 1"
                if row["gene"] == "CYP3A5" and allele["allele"] == "*3":
                    # Goljan et al. 2022 Table 1 reports 84.5% (vs 84.7% in text)
                    assert allele["reportedFrequencyPct"] == 84.5
                    assert allele["frequency"] == 0.845
                    assert "84.7%" in asrc.get("note", "")
        elif tier == 2:
            assert row["alleles"] == []
            assert row["saudiDataNote"] == TIER2_NOTE
        elif tier == 0:
            assert row["gene"] == "CYP2D6"
            assert row["alleles"] == []

    assert tier1_genes_seen == tier1_expected
    assert total_tier1_alleles == 82


def test_demo_006_incomplete_vcf_hand_computed() -> None:
    """Patient 1 (demo-006): deliberately incomplete VCF from A1."""
    freq_table = load_saudi_frequencies(SAUDI_FREQ_PATH)
    sv_genes = load_sv_genes(SV_GENES_PATH)
    match_data = _load_json(OUT_DIR / "demo-006.match.json")
    cov = compute_match_coverage(match_data, freq_table, sv_genes)

    # CYP2C9: missing rs1799853 (*2, 13.4%) and rs1057910 (*3, 5.3%)
    # Hand-computed: 86/88 assayed; risk = 0.134 + 0.053 = 0.187
    assert cov["CYP2C9"]["definingPositionsAssayed"] == 86
    assert cov["CYP2C9"]["definingPositionsTotal"] == 88
    assert cov["CYP2C9"]["untestedLocalAlleles"] == ["*2", "*3"]
    assert cov["CYP2C9"]["uninformativeNormalRisk"] == 0.187
    assert cov["CYP2C9"]["saudiDataTier"] == 1

    # CYP2C19: missing rs28399504 (*4A, <0.1%), rs17882687 (*15, Normal -> excluded), rs4986893 (*3, 0.1%)
    # Hand-computed: 32/35 assayed; risk = 0.001 (*3); *4A (<0.1%) listed & noted without invented midpoint
    assert cov["CYP2C19"]["definingPositionsAssayed"] == 32
    assert cov["CYP2C19"]["definingPositionsTotal"] == 35
    assert cov["CYP2C19"]["untestedLocalAlleles"] == ["*3", "*4A"]
    assert cov["CYP2C19"]["uninformativeNormalRisk"] == 0.001
    assert cov["CYP2C19"]["saudiDataTier"] == 1
    assert "*4A" in cov["CYP2C19"]["saudiDataNote"]

    # DPYD: complete 83/83 -> risk 0.0
    assert cov["DPYD"]["definingPositionsAssayed"] == 83
    assert cov["DPYD"]["definingPositionsTotal"] == 83
    assert cov["DPYD"]["untestedLocalAlleles"] == []
    assert cov["DPYD"]["uninformativeNormalRisk"] == 0.0
    assert cov["DPYD"]["saudiDataTier"] == 1

    # CYP3A5: 0/7 assayed -> *3 (0.845) + *6 (0.024) + *7 (0.004) = 0.873; *8 (<0.1%) noted
    assert cov["CYP3A5"]["definingPositionsAssayed"] == 0
    assert cov["CYP3A5"]["definingPositionsTotal"] == 7
    assert cov["CYP3A5"]["untestedLocalAlleles"] == ["*3", "*6", "*7", "*8"]
    assert cov["CYP3A5"]["uninformativeNormalRisk"] == 0.873
    assert cov["CYP3A5"]["saudiDataTier"] == 1

    # SLCO1B1: Tier 2 (no published Saudi frequency -> null)
    assert cov["SLCO1B1"]["definingPositionsAssayed"] == 35
    assert cov["SLCO1B1"]["definingPositionsTotal"] == 35
    assert cov["SLCO1B1"]["untestedLocalAlleles"] == []
    assert cov["SLCO1B1"]["uninformativeNormalRisk"] is None
    assert cov["SLCO1B1"]["saudiDataTier"] == 2
    assert cov["SLCO1B1"]["saudiDataNote"] == "No published Saudi frequency for this gene"


def test_demo_001_complete_vcf_hand_computed() -> None:
    """Patient 2 (demo-001): complete 241-position VCF from A1."""
    freq_table = load_saudi_frequencies(SAUDI_FREQ_PATH)
    sv_genes = load_sv_genes(SV_GENES_PATH)
    match_data = _load_json(OUT_DIR / "demo-001.match.json")
    cov = compute_match_coverage(match_data, freq_table, sv_genes)

    assert cov["CYP2C19"]["definingPositionsAssayed"] == 35
    assert cov["CYP2C19"]["definingPositionsTotal"] == 35
    assert cov["CYP2C19"]["untestedLocalAlleles"] == []
    assert cov["CYP2C19"]["uninformativeNormalRisk"] == 0.0

    assert cov["CYP2C9"]["definingPositionsAssayed"] == 88
    assert cov["CYP2C9"]["definingPositionsTotal"] == 88
    assert cov["CYP2C9"]["untestedLocalAlleles"] == []
    assert cov["CYP2C9"]["uninformativeNormalRisk"] == 0.0

    assert cov["DPYD"]["definingPositionsAssayed"] == 83
    assert cov["DPYD"]["definingPositionsTotal"] == 83
    assert cov["DPYD"]["untestedLocalAlleles"] == []
    assert cov["DPYD"]["uninformativeNormalRisk"] == 0.0

    assert cov["SLCO1B1"]["saudiDataTier"] == 2
    assert cov["SLCO1B1"]["uninformativeNormalRisk"] is None
    assert cov["SLCO1B1"]["saudiDataNote"] == TIER2_NOTE


def test_tier2_gene_returns_null_risk_and_note() -> None:
    freq_table = load_saudi_frequencies(SAUDI_FREQ_PATH)
    sv_genes = load_sv_genes(SV_GENES_PATH)

    cov_slco = compute_gene_coverage("SLCO1B1", {"variants": [{}, {}], "matchData": {"missingPositions": []}}, freq_table, sv_genes)
    assert cov_slco["saudiDataTier"] == 2
    assert cov_slco["uninformativeNormalRisk"] is None
    assert cov_slco["saudiDataNote"] == "No published Saudi frequency for this gene"
    assert cov_slco["definingPositionsAssayed"] == 2
    assert cov_slco["definingPositionsTotal"] == 2

    cov_unknown = compute_gene_coverage("UNLISTED_GENE", None, freq_table, sv_genes)
    assert cov_unknown["saudiDataTier"] == 2
    assert cov_unknown["uninformativeNormalRisk"] is None
    assert cov_unknown["saudiDataNote"] == "No published Saudi frequency for this gene"


def test_cyp2d6_tier0_gets_no_a5_score() -> None:
    freq_table = load_saudi_frequencies(SAUDI_FREQ_PATH)
    sv_genes = load_sv_genes(SV_GENES_PATH)
    cov = compute_gene_coverage("CYP2D6", None, freq_table, sv_genes)

    assert cov["saudiDataTier"] == 0
    assert cov["uninformativeNormalRisk"] is None
    assert cov["definingPositionsAssayed"] == 0
    assert cov["definingPositionsTotal"] == 0
    assert cov["untestedLocalAlleles"] == []
    assert "A8" in cov["saudiDataNote"]
    assert "structural" in cov["saudiDataNote"].lower()


def test_never_repicks_diplotype_or_candidates_getrm_tie() -> None:
    """A5 must never alter diplotype, phenotype, or candidates on tied GeT-RM calls."""
    freq_table = load_saudi_frequencies(SAUDI_FREQ_PATH)
    sv_genes = load_sv_genes(SV_GENES_PATH)
    match_data = _load_json(GETRM_NA10831_MATCH)
    by_gene = extract_match_gene_index(match_data)

    tied_candidates = [d["name"] for d in by_gene["CYP2C9"]["diplotypes"]]
    assert tied_candidates == ["*1/*2", "*1/*92"]

    synthetic_contract = {
        "patientId": "NA10831",
        "sampleOrigin": "germline",
        "genes": [
            {
                "gene": "CYP2C9",
                "diplotype": "*1/*2",
                "phenotype": "Indeterminate",
                "candidates": ["*1/*2", "*1/*92"],
                "coverage": {
                    "definingPositionsAssayed": 0,
                    "definingPositionsTotal": 0,
                    "untestedLocalAlleles": [],
                    "uninformativeNormalRisk": 0.0,
                },
                "guidelineVersion": "CPIC",
            }
        ],
    }
    enriched = enrich_contract(synthetic_contract, match_data, freq_table, sv_genes)
    gene_out = enriched["genes"][0]

    assert gene_out["diplotype"] == "*1/*2"
    assert gene_out["phenotype"] == "Indeterminate"
    assert gene_out["candidates"] == ["*1/*2", "*1/*92"]
    assert gene_out["coverage"]["definingPositionsAssayed"] == 17
    assert gene_out["coverage"]["definingPositionsTotal"] == 88
    assert gene_out["coverage"]["saudiDataTier"] == 1


def test_demo_contracts_have_coverage_and_validate_schema() -> None:
    schema = _load_json(SCHEMA_PATH)
    freq_table = load_saudi_frequencies(SAUDI_FREQ_PATH)
    sv_genes = load_sv_genes(SV_GENES_PATH)

    for idx in range(1, 7):
        pid = f"demo-00{idx}"
        contract = _load_json(OUT_DIR / f"{pid}.contract.json")
        match_data = _load_json(OUT_DIR / f"{pid}.match.json")
        # Re-enrich in memory to verify idempotency and non-mutation of diplotype/candidates
        enriched = enrich_contract(contract, match_data, freq_table, sv_genes)
        jsonschema.validate(instance=enriched, schema=schema)
        jsonschema.validate(instance=contract, schema=schema)
        assert len(contract["genes"]) == 23
        for g_orig, g_enr in zip(contract["genes"], enriched["genes"]):
            assert g_orig["diplotype"] == g_enr["diplotype"]
            assert g_orig["phenotype"] == g_enr["phenotype"]
            assert g_orig["candidates"] == g_enr["candidates"]
            assert "coverage" in g_orig
            assert "saudiDataTier" in g_orig["coverage"]
            assert "saudiDataNote" in g_orig["coverage"]
