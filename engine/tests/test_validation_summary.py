#!/usr/bin/env python3
"""REVIEW (final pass): A3 must report exact, tied-candidate and mismatch counts separately.

A published diplotype that is only one of several tied PharmCAT candidates is not an exact call,
so it must never be counted into "exact concordance".
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "validation"))

from run_validation import summarize_concordance  # noqa: E402


def test_tied_candidates_are_not_exact():
    rows = [{"match": "yes"}] * 7 + [{"match": "yes (ambiguous candidates)"}] * 2 + [{"match": "no"}]
    s = summarize_concordance(rows)
    assert s == {"total": 10, "exact": 7, "tied": 2, "mismatch": 1}


def test_summary_line_names_all_three_counts():
    from run_validation import concordance_line

    line = concordance_line({"total": 10, "exact": 7, "tied": 2, "mismatch": 1})
    assert "7/10" in line and "2/10" in line and "1/10" in line
    assert "9/10" not in line
