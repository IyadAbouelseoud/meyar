# Handoff — DEMO-FIXES Pre-recording fixes P0-1 to P0-4

Status: DONE
Last updated: 2026-11-24 by Claude Code (Opus 5.5)
Branch: demo-fixes · Last commit: see `git log -1`

Scope lock: `cds/lib/cards.js`, `cds/lib/preview.js`, `cds/lib/compare.js`, `cds/test/`, `kit/web/urgent.js`, `kit/test/`, `CHANGES.md`, `handoff/DEMO-FIXES.md` (+ `docs/screenshots/demo-fixes/`).

## Done (each with the proof command)
- [x] DEMO-FIX-4: remove UF / PROGRESS figures from `/compare` — `cd cds && npm test` → 45 pass
- [x] DEMO-FIX-1: `extension.meyar` on every card + Arabic card rendering on `/preview` and kit `/urgent` — `cd cds && npm test` → 50 pass; `cd kit && npm test` → 34 pass
- [x] DEMO-FIX-2: mock patient banner on `/preview` — `cd cds && npm test` → 51 pass
- [x] DEMO-FIX-3: scenario 5 demo-006 codeine on duloxetine (default) — `cd cds && npm test` → 52 pass
- [x] Screenshots (8, in docs/screenshots/demo-fixes/: no stray English in Arabic cards, no horizontal overflow, no console errors at 1440/375), `node design/build-tokens.mjs` → 62/62, ANTI-SLOP → 0 ticks; PR opened

## In progress
- nothing

## Next step (start here)
1. Nothing. Team review of the PR. Optional: map MYR-DEMO-0006 in kit/lib/demo.js (P1-5, out of this scope).

## Commands to verify current state
```
cd cds && npm test
cd kit && npm test
node design/build-tokens.mjs
```

## Decisions made / open questions
- Order: Fix 4 first (smallest), then 1, 2, 3.
- renderCardAr lives in cds/lib/preview.js and is copied verbatim into kit/web/urgent.js (kit cannot import cds/; scope lock forbids a shared file). kit/test/urgent-ar.test.mjs fails if the copies drift.
- Arabic vocab: preview reads passport/src/i18n/ar.json at render time; the CDS Docker image does not mount passport/, so a minimal fallback copy (scale, phenotypeShort, demo drugs) is embedded. Kit fetches /passport-src/i18n/ar.json.

- /compare: docs/sources.md row 5 now lists the UF figures as verified (2026-11-24); they were removed anyway at the team's request. docs/demo/SCRIPT.md line 33 still mentions them (presenter note, outside this scope lock).
- Screenshots ran against branch servers on ports 3100/5175 because the Docker stack was holding 3000 and another kit process was holding 5174. Rebuild the cds container (`docker compose up -d --build cds`) before recording.

## Files changed
- cds/lib/cards.js, cds/lib/preview.js, cds/lib/compare.js, cds/test/cds.test.js, kit/web/urgent.js, kit/test/urgent-ar.test.mjs, CHANGES.md, handoff/DEMO-FIXES.md, docs/screenshots/demo-fixes/*.png

## Do not
- Do not change `summary` / `detail` text of any card. Do not translate CPIC text.
