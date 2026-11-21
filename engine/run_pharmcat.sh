#!/usr/bin/env bash
# Run PharmCAT 3.4.0 end to end over all VCF inputs in engine/data/in/*.vcf.
# Absent positions remain no-calls (PharmCAT default; no reference-imputation flags).
# When <patientId>.outside.tsv exists, passes it to PharmCAT via -po so outside
# structural-variant calls override the matcher.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
IN_DIR="$DATA_DIR/in"
OUT_DIR="$DATA_DIR/out"

mkdir -p "$OUT_DIR"

if command -v cygpath >/dev/null 2>&1; then
  # Prevent MSYS2/Git Bash from rewriting container paths like /pharmcat/data.
  export MSYS_NO_PATHCONV=1
  MOUNT_DATA_DIR="$(cygpath -m "$DATA_DIR")"
else
  MOUNT_DATA_DIR="$DATA_DIR"
fi

shopt -s nullglob
vcf_files=("$IN_DIR"/*.vcf)

if [ "${#vcf_files[@]}" -eq 0 ]; then
  echo "Error: no .vcf files found in $IN_DIR" >&2
  exit 1
fi

for vcf_path in "${vcf_files[@]}"; do
  vcf_name="$(basename "$vcf_path")"
  patient_id="${vcf_name%.vcf}"
  outside_tsv="$IN_DIR/${patient_id}.outside.tsv"

  if [ -f "$outside_tsv" ]; then
    echo "=== Running PharmCAT 3.4.0 on $vcf_name (outside-call: ${patient_id}.outside.tsv) ==="
    docker run --rm \
      -v "$MOUNT_DATA_DIR:/pharmcat/data" \
      pgkb/pharmcat:3.4.0 \
      pharmcat_pipeline \
      -matcher \
      -o /pharmcat/data/out \
      "/pharmcat/data/in/$vcf_name"

    docker run --rm \
      -v "$MOUNT_DATA_DIR:/pharmcat/data" \
      pgkb/pharmcat:3.4.0 \
      java -jar /pharmcat/pharmcat.jar \
      -phenotyper \
      -reporter \
      -pi "/pharmcat/data/out/${patient_id}.match.json" \
      -po "/pharmcat/data/in/${patient_id}.outside.tsv" \
      -o /pharmcat/data/out \
      -bf "${patient_id}" \
      -reporterHtml
  else
    echo "=== Running PharmCAT 3.4.0 on $vcf_name ==="
    docker run --rm \
      -v "$MOUNT_DATA_DIR:/pharmcat/data" \
      pgkb/pharmcat:3.4.0 \
      pharmcat_pipeline \
      -o /pharmcat/data/out \
      "/pharmcat/data/in/$vcf_name"
  fi
done
