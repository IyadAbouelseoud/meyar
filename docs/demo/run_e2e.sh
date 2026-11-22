#!/usr/bin/env bash
# F6 end-to-end staircase demo: custody → lab QC → pharmacist review → alert at order-sign → Passport QR.
# Run from the repo root on a clean checkout:   bash docs/demo/run_e2e.sh
# Needs Docker (HAPI 8080 + CDS 3000 via docker compose), Node 22, and passport deps (npm ci in passport/).
# Research prototype — not for clinical use. Demo data only; every record is "mock": true.
set -euo pipefail
cd "$(dirname "$0")/../.."
KIT_PORT="${KIT_PORT:-5174}"; CDS="${CDS_URL:-http://localhost:3000}"; KIT="http://localhost:${KIT_PORT}"
export KIT_DATA_DIR="${KIT_DATA_DIR:-$PWD/kit/data}"
say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
post() { curl -sf -X POST -H 'Content-Type: application/json' "$1" -d "${2:-{\}}"; }
json() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(($1)(j))})"; }

say "1. Services: docker compose up (HAPI 8080, CDS 3000)"
docker compose up -d --build hapi cds >/dev/null
for i in $(seq 1 90); do curl -sf "$CDS/health" >/dev/null && curl -sf http://localhost:8080/fhir/metadata >/dev/null && break; sleep 2; done
curl -sf "$CDS/health" >/dev/null || { echo "CDS not up on 3000"; exit 1; }
echo "HAPI and CDS are up."
[ -d passport/node_modules ] || (cd passport && npm ci --silent)

say "2. Kit service on $KIT"
if ! curl -sf "$KIT/health" >/dev/null; then
  (cd kit && KIT_PORT="$KIT_PORT" nohup node server.js < /dev/null > "${TMPDIR:-/tmp}/meyar-kit.log" 2>&1 &)
  for i in $(seq 1 30); do curl -sf "$KIT/health" >/dev/null && break; sleep 1; done
fi
for k in MYR-DEMO-0001 MYR-DEMO-0002; do post "$KIT/api/kits/$k/reset" >/dev/null; done

say "3. Failed-QC branch: first tube MYR-DEMO-0002"
for i in 1 2 3 4 5; do post "$KIT/api/kits/MYR-DEMO-0002/scan" '{"code":"MYR-DEMO-0002"}' >/dev/null; done
post "$KIT/api/kits/MYR-DEMO-0002/qc" '{"result":"fail","reason":"insufficient-dna"}' >/dev/null
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' "$KIT/api/kits/MYR-DEMO-0002/scan" -d '{"code":"MYR-DEMO-0002"}')
echo "QC: FAIL (insufficient DNA) → Recollect. Genotyped scan answered HTTP $code (refused)."
curl -sf "$KIT/api/kits/MYR-DEMO-0002" | json 'j=>`Result issued for this tube: ${j.handoff ? "YES (BUG)" : "none"} · in Passport: ${j.passportReleased}`'

say "4. Custody chain: recollected tube MYR-DEMO-0001"
for i in 1 2 3 4 5; do post "$KIT/api/kits/MYR-DEMO-0001/scan" '{"code":"MYR-DEMO-0001"}' >/dev/null; done
post "$KIT/api/kits/MYR-DEMO-0001/qc" '{"result":"pass"}' >/dev/null
post "$KIT/api/kits/MYR-DEMO-0001/scan" '{"code":"MEYAR-KIT:MYR-DEMO-0001"}' >/dev/null
post "$KIT/api/kits/MYR-DEMO-0001/review" >/dev/null
post "$KIT/api/kits/MYR-DEMO-0001/release" >/dev/null
curl -sf "$KIT/api/kits/MYR-DEMO-0001" | json 'j=>[...j.events.map(e=>`  ${e.time}  ${e.type.padEnd(10)} ${e.place.en} · ${e.actor.en}  #${e.hash.slice(0,12)}`),
  `  ${j.gates.qc.time}  lab QC     ${j.gates.qc.result}`, `  ${j.gates.review.time}  reviewed   ${j.gates.review.actor.en}`,
  `  ${j.gates.release.time}  released   to the Passport: ${j.passportReleased}`, `  FHIR (HAPI): ${j.fhir.available ? "Provenance on Specimen/MYR-DEMO-0001" : "not reachable, local ledger"}`].join("\n")'
curl -sf "$KIT/api/kits/MYR-DEMO-0001/verify" | json 'j=>`Chain verify (${j.source}): ${j.ok ? "intact" : "BROKEN at event " + (j.brokenAt+1)}`'
curl -sf "$KIT/api/kits/MYR-DEMO-0001/status" | json 'j=>"Patient tracker: " + j.steps.map(s=>`${s.key}=${s.state}`).join(" → ")'

say "5. Alert on time: clopidogrel order-sign for demo-001 → CDS $CDS"
node --input-type=module -e "
import { clopidogrelOrderSign } from './kit/server.js';
const t0 = Date.now();
const r = await fetch('$CDS/cds-services/meyar-pgx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clopidogrelOrderSign()) });
const j = await r.json(); const ms = Date.now() - t0;
for (const c of j.cards || []) { console.log('['+c.indicator+'] '+c.summary); console.log(c.detail.split('\n').filter(Boolean).map(l=>'  '+l).join('\n')); console.log('  suggestions: '+(c.suggestions||[]).map(s=>s.label).join(' | ')); }
console.log('HTTP '+r.status+' in '+ms+' ms (measured on this machine)');
"

say "6. Passport QR (C8 envelope) for demo-001"
node --import ./passport/test/register-alias.mjs docs/demo/make_qr.mjs
echo "Scan it offline: $KIT/reader/  (demo PIN 482916). Tracker: $KIT/tracker?kit=MYR-DEMO-0001  T3: $KIT/urgent"
