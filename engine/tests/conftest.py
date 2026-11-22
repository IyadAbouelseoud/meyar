"""Shared pytest setup for engine tests.

Some tests read pipeline outputs that are gitignored (engine/data/out/, engine/validation/data/).
On a clean checkout those files do not exist yet. Instead of a bare FileNotFoundError, such a
test is reported as SKIPPED with the command to run, and the session prints a loud reminder,
so a clean-checkout run is never mistaken for a full pass.
"""

from __future__ import annotations

from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATED_DIRS = (
    REPO_ROOT / "engine" / "data" / "out",
    REPO_ROOT / "engine" / "validation" / "data",
)
RUN_HINT = "pipeline outputs missing: run `bash engine/run_pipeline.sh` first"

_skipped_for_outputs: list[str] = []


def _is_generated(path: object) -> bool:
    if not path:
        return False
    try:
        resolved = Path(str(path)).resolve()
    except OSError:
        return False
    return any(d == resolved or d in resolved.parents for d in GENERATED_DIRS)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_call(item: pytest.Item):
    outcome = yield
    excinfo = outcome.excinfo
    if excinfo and issubclass(excinfo[0], FileNotFoundError) and _is_generated(excinfo[1].filename):
        _skipped_for_outputs.append(item.nodeid)
        outcome.force_exception(pytest.skip.Exception(f"{RUN_HINT} ({excinfo[1].filename})"))


def pytest_terminal_summary(terminalreporter) -> None:
    if _skipped_for_outputs:
        terminalreporter.section("NOT A FULL PASS", sep="!", red=True, bold=True)
        terminalreporter.write_line(
            f"{len(_skipped_for_outputs)} test(s) skipped because {RUN_HINT}:", red=True
        )
        for nodeid in _skipped_for_outputs:
            terminalreporter.write_line(f"  {nodeid}")
