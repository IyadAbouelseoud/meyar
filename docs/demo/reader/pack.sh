#!/usr/bin/env bash
# Packs the offline reader as a static site for HTTPS hosting (e.g. Netlify drag-and-drop):
# docs/demo/out/reader-site/{reader,design,passport-src,vendor,demo-out}. Open https://<site>/reader/
set -euo pipefail
cd "$(dirname "$0")/../../.."
OUT=docs/demo/out/reader-site; rm -rf "$OUT"; mkdir -p "$OUT/vendor" "$OUT/passport-src"
cp -r docs/demo/reader "$OUT/reader"; rm -f "$OUT/reader/pack.sh"
cp -r design "$OUT/design"
cp passport/src/qr.js passport/src/pinguard.js "$OUT/passport-src/"
cp passport/node_modules/jsqr/dist/jsQR.js "$OUT/vendor/"
mkdir -p "$OUT/demo-out"; cp docs/demo/out/*.qr.svg "$OUT/demo-out/"
echo "Packed $OUT — upload the folder, open /reader/"
