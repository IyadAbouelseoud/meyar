#!/usr/bin/env bash
# Run the whole Meyar engine chain, in order, from a clean checkout.
# The engine tests read the outputs this writes (engine/data/out/, engine/validation/data/),
# which are gitignored, so run this before `python -m pytest engine/tests`.
#
#   bash engine/run_pipeline.sh            # FHIR step as dry-run (no HAPI needed)
#   FHIR=1 bash engine/run_pipeline.sh     # also PUT to local HAPI (docker compose up -d hapi)
#   PYTHON="uv run --no-project --python 3.12 --with jsonschema python" bash engine/run_pipeline.sh
#
# Order: A1 VCFs -> A2 PharmCAT 3.4.0 (with A8 outside calls) -> A3 GeT-RM validation
#        -> A4/A6 FHIR + contract -> A5 coverage -> A8 SV gate -> A7 phenoconversion.
# No PharmCAT flag labelled DANGEROUS is used anywhere in this chain.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

PY=${PYTHON:-python}

step() { echo; echo "=== $* ==="; }

step "A1: generate synthetic GRCh38 VCFs"
$PY engine/gen_vcf.py --all

step "A2/A8: PharmCAT 3.4.0 (outside-call files passed with -po)"
bash engine/run_pharmcat.sh

step "A3: GeT-RM reference validation"
$PY engine/validation/run_validation.py

step "A4/A6: FHIR phenotype store + contract.json"
if [ "${FHIR:-0}" = "1" ]; then
  $PY engine/load_fhir.py --all
else
  $PY engine/load_fhir.py --all --dry-run
fi

step "A5: coverage and Saudi data tiers"
$PY engine/coverage.py --all

step "A8: structural-variant gate"
$PY engine/sv_gate.py --all

step "A7: phenoconversion"
$PY engine/phenoconvert.py --all

echo
echo "Pipeline done. Now run: $PY -m pytest engine/tests"
