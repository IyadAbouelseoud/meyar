# kit/ — chain-of-custody saliva kit software (F3)

Research prototype, not for clinical use. Demo data only (kit `MYR-DEMO-0001`, pseudonymous patient `demo-001`, invented places and roles, every record `mock: true`).

What it does:

1. **Kit ID and labels.** The tube label is a Code 128 barcode and the mailer carries a QR code (`MEYAR-KIT:<kitId>`). Both are drawn in the browser by `web/barcode128.js` and `web/qr.js` (no dependencies). Neither label carries a name or a result.
2. **Six scan events, in order:** issued, collected, sealed, shipped, received at lab, genotyped. Each one is stored as a FHIR R4 `Provenance` that targets the kit's `Specimen` (`Specimen/MYR-DEMO-0001`) in the local HAPI server. Arabic labels travel in the standard FHIR translation extension.
3. **Hash chain.** `hash = SHA-256(prevHash + canonicalJSON(event))`, and the first `prevHash` is 64 zeros. Verify recomputes every link and names the first broken one. Verify reads the chain back from the Provenance resources' own elements, so editing a Provenance in HAPI breaks verify. There is no hidden copy for verify to fall back on. A broken chain cannot be extended.
4. **Hand-off to the engine.** On "genotyped", and only when the chain verifies and the origin is germline, the kit writes `<patientId>.origin.json` (`{"sampleOrigin":"germline"}`, which `engine/origin_guard.py` (A6) reads) and `<patientId>.kit-handoff.json`. The second file holds the kit ID, the Specimen, the VCF path, the chain head hash and the mock flag.
5. **Timeline screen.** Arabic first, with an English toggle. Clinician voice on the paper theme, built only from `design/`.

The chain is tamper-evident, not tamper-proof. Anyone who can rewrite every record can rebuild the whole chain. Signing each event and anchoring the head hash outside the store are future deployment steps. No specimen stability, temperature or transit-time number is claimed anywhere.

## Run

```bash
docker compose up -d hapi          # local HAPI on 8080 (optional: without it the kit uses its local ledger only)
cd kit && npm start                # http://localhost:5174  (KIT_PORT to change; FHIR_BASE to point elsewhere)
```

Scan with a USB barcode scanner (it types the code, then Enter) or type `MYR-DEMO-0001`, then press "Record". The demo controls edit event 4 without re-sealing it (Verify then shows "Chain broken here"), restore the original, or start the kit again.

Hand-off goes to `kit/out/engine-handoff/` by default. To write straight into the engine's input folder, run `ENGINE_IN_DIR=engine/data/in npm start`. The VCF itself comes from A1 (`python engine/gen_vcf.py --all` writes `engine/data/in/demo-001.vcf`).

## API

| Method | Path | |
|---|---|---|
| GET | `/api/kits/:id` | kit, events, next event, FHIR status, hand-off |
| GET | `/api/kits/:id/chain?source=fhir\|ledger` | raw chain (FHIR by default when HAPI is up) |
| GET | `/api/kits/:id/verify?source=` | server-side verify |
| POST | `/api/kits/:id/scan` | `{code, place?, actor?, time?}`, records the next event |
| POST | `/api/kits/:id/tamper` · `/restore` · `/reset` | demo only |

## Test

```bash
cd kit && npm test                 # 32 tests (reproduced 2026-11-24); the HAPI test skips with "NOT A FULL PASS" if HAPI is down
```

The tests cover these cases:
- Six scans make a valid chain.
- Editing any one of the six events fails verify at exactly that event.
- A one-second timestamp change is caught.
- Re-hashing an edited event is caught at the next link.
- Deleting or reordering events is caught.
- An out-of-order scan, a scan of the wrong kit and a seventh event are all refused.
- Provenance round-trips to the same record.
- An edit made inside FHIR is caught.
- The engine's `origin_guard.require_germline_origin` accepts the hand-off.
- A live HAPI round trip works.

The tests use their own kit ID (`MYR-TEST-0001`), so they never touch the demo kit.

Independent barcode check (dev time only, not an app dependency). Two third-party readers, zbar and OpenCV, decode both labels:

```bash
node kit/tools/export_codes.mjs codes.json
uv run --no-project --python 3.12 --with pyzbar --with opencv-python-headless --with pillow --with numpy python -I kit/tools/decode_check.py codes.json
```

Screenshots at 375 and 1440 px, in Arabic and English, are in `docs/screenshots/`. There is one intact and one tampered screenshot at 1440 px.

## Standards implemented

Code 128 (ISO/IEC 15417), QR Code (ISO/IEC 18004, byte mode, level M), FHIR R4 `Specimen` and `Provenance`, and SHA-256 (FIPS 180-4) via WebCrypto. Regulatory steps (SFDA, PDPL) are future deployment steps.
