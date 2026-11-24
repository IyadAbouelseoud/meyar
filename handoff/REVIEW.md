# Handoff — REVIEW Final review and fix pass (prompts/REVIEW-opus-5.5.md, FINAL version ba3549d)

Status: DONE (review pass complete; open items are team-owned or separate tasks, listed below)
Branch: review/final-2026-11-24 (from origin/main 9784cfb). Not pushed, no PR yet.

## Done
- [x] Part A: every task audited (docs/review-evidence/audit-*.md; A1–A8 checked in-session). Cross-cutting checks 1–18 are in docs/REVIEW.md section 4.
- [x] Part B: mobile 47/150 → 150/150, targets ≥48 px, axe 68/68 clean, images placed, offline fixed, Lighthouse before/after recorded.
- [x] Part C: docs/report-verification.md (items 1–36). Repo corrections applied, except team-owned files (AGENTS.md, the A5 table; requests filed).
- [x] Tests: passport 57, cds 44, kit 32, engine 39, mobile 150/150, tokens 62/62.
- [x] docs/REVIEW.md written; the previous review archived as docs/REVIEW-C6-C7-C9-2026-11-24.md.

## Next step (for the team)
1. Build D1–D5 and E1–E3 (prompts/D*.md, E*.md): they block submission.
2. Re-upload the whole passport/dist to Netlify (docs/REVIEW.md section 7).
3. Team-owned items: the AGENTS.md:49/52 wording, and the A5 SLCO1B1 Tier 2 request in docs/requests.md.
4. Optional: convert the remaining 216 after-screenshot PNGs (scratchpad to_webp.py). The conversion was stopped when the machine ran low on memory.

## Key findings so far (details in docs/review-evidence)
- BLOCKS: D1–D5 and E1–E3 are not built (no poster PDF, architecture diagram, demo MP4, brief, checklist or pitch). The mandatory "no patient data" line is missing on the Passport, cds, kit and poster. The Passport sw.js does not precache JS, CSS or fonts, so scan.html is blank offline.
- JUDGE: /compare card is hand-written (compare.js:37-41,72,371) and has 11 hard-coded hex colours; 0/128 CPIC rows have human sign-off; provenance wording conflicts (AGENTS.md:49, README.md:93,100 vs the table); card footer shows "CPIC PharmCAT 3.4.0" as the guideline version; "CYP2D6 · VCF" label on a not-assessed gene; Doctor tab lacks the Meyar Scale; stale 360 B QR size (the app issues 480 B); handoff hashes invalid for B4, B5, C5 and F1–F6; README run snippet fails on a clean clone.

## Do not
- Do not stop the other `meyar` compose project's containers (the auto-mode classifier denied it). Test this branch's cds in-process; HAPI on 8080 is shared.
