# docs/demo — F6 end-to-end staircase demo

Research prototype — not for clinical use. Demo data only.

- `run_e2e.sh` — one command: `docker compose up` (HAPI 8080, CDS 3000), kit service (5174), failed-QC branch, custody chain, lab QC, pharmacist review, release, clopidogrel order-sign card, Passport QR size and version.
- `SCRIPT.md` — 3-minute run order, the airplane-mode scan, five judge questions.
- `make_qr.mjs` — demo-001 C8 QR (demo PIN 482916) plus a one-byte tampered copy, into `out/`.
- `reader/` — second-device offline reader, served at `http://localhost:5174/reader/`; `reader/pack.sh` packs it for HTTPS hosting (Netlify).
- `screenshots/` — 375 and 1440 px, Arabic and English: reader with the network off, tampered QR rejected, tracker, recollect, T3 screen, kit timelines, printed card.

Kit pages (served by `kit/server.js`): `/` timeline with QC and pharmacist gates, `/tracker` patient status strip, `/urgent` T3 roadmap screen, `/card` interim printed card (until C7).
