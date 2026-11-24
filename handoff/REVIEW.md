# Handoff — REVIEW Final review and fix pass (prompts/REVIEW-opus-5.5.md, FINAL version ba3549d)

Status: IN PROGRESS
Last updated: 2026-11-24 by Claude Code (Opus 5.5)
Branch: review/final-2026-11-24 (from origin/main 9784cfb) · Last commit: see `git log -1`

## Plan

**Goal:** Every Done-when box and cross-cutting check 1–18 proven or fixed. Every page passes on mobile with a regression test. The image library is placed. The 36 research-report items each get a verdict. One PR.

**Execution:** native, in this session. Read-only sweeps (per-task Done-when evidence, primary-source verification for Part C) go to parallel subagents, which write to the scratchpad. Fixes, commits and the report stay in the main session.

### Global constraints (from AGENTS.md and the prompt)
- Locked: clinical logic, `tables/*`, data contract, C8 crypto parameters. Change one only for a proven defect against the spec, and call the change out at the top of docs/REVIEW.md.
- Visual work happens inside `design/` tokens. No new fonts or colours. Reem Kufi is banned.
- Never push to main. Commit each logical fix separately. Open one PR.
- No invented number or source. If a primary source cannot be opened, the verdict is DROPPED or STILL UNVERIFIED.

### Tasks
1. **Baseline:** run every test suite (passport, cds, kit, engine pytest), `docker compose up -d`, curl discovery and order-sign, `bash engine/run_pipeline.sh`. Record exact counts.
2. **Part A sweep:** check the Done-when lists for A1–A8, B1–B6, C1–C9, D1–D5, E1–E3 and F1–F6 (subagents, read and run only), then run cross-cutting checks 1–18.
3. **Known issue 5:** the demo contracts in docs/fixtures (only 001, 002 and 006 are committed). Confirm, then fix or document.
4. **Part B, mobile:** a Playwright screenshot matrix (before), the overflow, tap-target and font-size audit, and the spacing-token sweep. Add `@media` to cds and kit. Add the regression test `tests/mobile/`. Screenshots after the fixes. Lighthouse before and after.
5. **Images:** run `build_webp.py --check`. Place IMG-15, 02, 06 and 14 on the Passport, 04 and 11 on the kit, 05 on the clinician side, and 07/01 as section imagery. Use `<picture>` with srcset, set width and height, label each one, add them to the sw.js precache, and rebuild dist.
6. **Part C:** write `docs/report-verification.md` with items 1–36 (subagent research, plus tests run in this repo).
7. **Fixes found in steps 2–6:** TDD for code (failing test first), plus doc corrections.
8. **Report:** archive the old docs/REVIEW.md to docs/REVIEW-C6-C7-C9-2026-11-24.md and write the new one with sections 1–8. Then request a code review of the full diff, push the branch and open the PR.

### Review focus
- RTL plus a 320 px width with long Latin genotype or citation strings: overflow.
- Elder mode at 320 px: tap targets of 48 px or more, and no horizontal scroll.
- PIN entry with the on-screen keyboard: `inputmode=numeric`, and the field stays in view.
- Offline Passport after adding images: the sw precache includes them and nothing 404s.
- Not-assessed CYP2D6 next to an image or empty state: the image is never inside clinical content.

## Done (each with the proof command)
- [x] Plan written

## In progress
- Task 1 baseline

## Next step (start here)
1. Task 1 baseline (see Plan)

## Commands to verify current state
```
npm --prefix passport test; npm --prefix cds test; npm --prefix kit test; docker compose up -d; curl localhost:3000/cds-services
```

## Decisions made / open questions
- The user chose the new FINAL fix-pass prompt from origin/main over the older read-only local copy (AskUserQuestion, 2026-11-24).
- The untracked local `cds/data/alerts.jsonl` (23 lines, from the b6 checkout) was backed up to the session scratchpad before switching branches.

## Do not
- Do not deploy to Netlify (the report lists the files to re-upload).
