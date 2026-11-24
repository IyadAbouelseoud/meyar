# Handoff — DEMO-FIXES Pre-recording fixes P0-1 to P0-4

Status: IN PROGRESS
Last updated: 2026-11-24 by Claude Code (Opus 5.5)
Branch: demo-fixes · Last commit: see `git log -1`

Scope lock: `cds/lib/cards.js`, `cds/lib/preview.js`, `cds/lib/compare.js`, `cds/test/`, `kit/web/urgent.js`, `kit/test/`, `CHANGES.md`, `handoff/DEMO-FIXES.md` (+ `docs/screenshots/demo-fixes/`).

## Done (each with the proof command)
- [x] DEMO-FIX-4: remove UF / PROGRESS figures from `/compare` — `cd cds && npm test` → 45 pass
- [ ] DEMO-FIX-1: `extension.meyar` on every card + Arabic card rendering on `/preview` and kit `/urgent`
- [ ] DEMO-FIX-2: mock patient banner on `/preview`
- [ ] DEMO-FIX-3: scenario 5 demo-006 codeine on duloxetine (default)
- [ ] Screenshots, design checks, PR

## In progress
- nothing

## Next step (start here)
1. DEMO-FIX-1

## Commands to verify current state
```
cd cds && npm test
cd kit && npm test
node design/build-tokens.mjs
```

## Decisions made / open questions
- Order: Fix 4 first (smallest), then 1, 2, 3.

## Do not
- Do not change `summary` / `detail` text of any card. Do not translate CPIC text.
