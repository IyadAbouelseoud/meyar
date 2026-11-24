# Handoff — REVIEW Final review and fix pass (prompts/REVIEW-opus-5.5.md, FINAL version ba3549d)

Status: IN PROGRESS (stopped at the usage limit, 2026-11-24)
Branch: review/final-2026-11-24 (from origin/main 9784cfb). Not pushed, no PR yet.

## Done
- [x] Baseline counts reproduced: passport 41/41, cds 39/39, kit 32/32, engine pytest 37 passed (after `FHIR=1 PYTHON="uv run --no-project --python 3.12 --with jsonschema --with pytest python" bash engine/run_pipeline.sh`, exit 0)
- [x] Read-only audits: docs/review-evidence/audit-B.md, audit-C.md, audit-DEF.md (complete). Part C research files verify-*.md are partial, where present.
- [x] Mobile harness: tests/mobile (pages.mjs, run.mjs; `npm --prefix tests/mobile test`). Before: 47/150 phone states pass; full matrix 262/500 + kit 32/80 + reader 8/20. Before screenshots are in docs/screenshots/final-review/before (243 MB, NOT committed: convert to webp or a subset before committing)
- [x] Fixes made (not yet re-verified): design/meyar.css (.m-seg button to the full target size, a.m-wordmark target, .m-tile__btn coarse pointer, .m-cds__foot a target), design/charts.js (tooltip clamped to its host), passport/src/app.css (safe-area insets, tab label wrap at 320 px, 16 px scan textarea), an empty favicon on kit, reader, showcase and cds pages

## Next step (start here)
1. Showcase: make `.hero nav a` at least 44 px (design/showcase/index.html:34), and fix the `.phone__bar` overflow at 320 px in ar
2. Fix the blockers from audit-C: add the mandatory line "Runs on synthetic and GeT-RM reference data; no patient data was used." to the Passport (render.js:41, scan-render.js:16, i18n), cds pages, kit pages and the F4 panel; precache dist/assets in passport/public/sw.js
3. `npm --prefix passport run build`, then `npm --prefix tests/mobile test` until it passes, then the after-shots (`npm --prefix tests/mobile run shots`)
4. Images (known issue 1), the wrong-in-front-of-judge items in the audit files, Lighthouse
5. Resume Part C: the research agents were stopped. Re-run items 1–36, then docs/report-verification.md
6. Archive docs/REVIEW.md to docs/REVIEW-C6-C7-C9-2026-11-24.md, write the new report, run a code review, push the branch, open one PR

## Key findings so far (details in docs/review-evidence)
- BLOCKS: D1–D5 and E1–E3 are not built (no poster PDF, architecture diagram, demo MP4, brief, checklist or pitch). The mandatory "no patient data" line is missing on the Passport, cds, kit and poster. The Passport sw.js does not precache JS, CSS or fonts, so scan.html is blank offline.
- JUDGE: /compare card is hand-written (compare.js:37-41,72,371) and has 11 hard-coded hex colours; 0/128 CPIC rows have human sign-off; provenance wording conflicts (AGENTS.md:49, README.md:93,100 vs the table); card footer shows "CPIC PharmCAT 3.4.0" as the guideline version; "CYP2D6 · VCF" label on a not-assessed gene; Doctor tab lacks the Meyar Scale; stale 360 B QR size (the app issues 480 B); handoff hashes invalid for B4, B5, C5 and F1–F6; README run snippet fails on a clean clone.

## Do not
- Do not stop the other `meyar` compose project's containers (the auto-mode classifier denied it). Test this branch's cds in-process; HAPI on 8080 is shared.
