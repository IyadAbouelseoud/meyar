# Review — B6 (PR #16, branch `b6-prescriber-alternatives`, head d6d8784)

Reviewed against `prompts/REVIEW-opus-5.5.md`, `prompts/B6.md` and `AGENTS.md`. Read and run only; nothing changed in the PR.

**Verdict: ready with fixes** (one card shows wrong numbers, and one Done-when box is still unproven).

## Done-when boxes

| Box | Status | Evidence |
|---|---|---|
| Built from `design/`, tokens pass, ANTI-SLOP < 2 | pass (partial) | `node design/build-tokens.mjs` → 62/62. `cds/lib/preview.js` has no hex, rgb or literal font-family; radius, motion and font all come from `var(--m-*)`. The screenshots were not attached to the PR; the handoff only reports headless measurements. |
| Sandbox on 8081: demo-001 clopidogrel → prasugrel + ticagrelor + CPIC link | **not proven** | `handoff/B6.md` says: "No separate sandbox server is running on port 8081". This was only checked on :3000. |
| demo-002 codeine → "Acting like: Poor Metabolizer because of paroxetine" | pass | Test suite, plus the live :3000 curl recorded in the handoff |
| Paroxetine order for a patient on codeine → backward-sweep card | pass | `cds/server.js:546-620`, test "ordering…" passes |
| Drug with no CPIC alternative → no suggestion | pass | Test "a drug with no CPIC alternative…" passes |
| No unsourced number, no DANGEROUS flag, no LLM dosing | pass (one issue) | The CYP2D6 activity table and thresholds are cited in `docs/sources.md:36-37`, and Thomas 2020 in `:18`. No LLM calls. See F1 for a number shown wrongly. |
| `handoff/B6.md` Status: DONE, committed | pass (nit) | Status is DONE, but the line still reads "Last commit: pending" |
| `CHANGES.md ## B6` | pass | In the diff |

`node --test cds/test/cds.test.js` → **37/37 pass**.

## Findings (most severe first)

### F1 — Wrong in front of a judge: activity scores are rounded to 1 decimal place
`cds/lib/cards.js` (new `buildInhibitorBackwardSweepCard`, the "Activity score:" line) uses `.toFixed(1)`. CPIC CYP2D6 scores come in steps of 0.25, so:
- `*1/*41` with AS 1.25 is printed as **"1.3"**
- a moderate inhibitor gives 1.25 × 0.5 = 0.625, printed as **"0.6"**

`node -e "(1.25).toFixed(1)"` → `1.3`. A clinical pharmacist will see that 1.3 is not a valid CYP2D6 activity score.
**Fix:** print the raw value (`String(x)`) or use `toFixed(2)`.

### F2 — Safety gap (likely; needs a quick test): an inhibitor and a substrate in the same order set
The inhibitor sweep only checks `currentMedsResult.medications` (`cds/server.js:~563`). Draft-order cards are built earlier and add `drug|gene` to `seenCardKeys`. Take a patient with no current inhibitor, and sign **codeine + paroxetine together** in one `draftOrders` bundle:
- the codeine card uses the genetic phenotype (Normal), and
- the sweep never re-checks codeine, because the drug is a draft order, not a current med, and its key has already been seen.

So the card shows "Normal" guidance while a strong CYP2D6 inhibitor is being signed in the same order. I did not run this case.
**Fix:** run the same `matchDrugsInTable` + before/after `lookupCpic` check over the other draft meds as well as current meds. Then add a test for it.

### F3 — Done-when box not proven: CDS Hooks sandbox on 8081
The prompt requires the sandbox on 8081. The handoff admits it was skipped.
**Fix:** start the sandbox (8081 → service :3000), run the demo-001 clopidogrel order, and save a screenshot to the PR or handoff.

### F4 — Minor: the strong-inhibitor sweep for non-CYP2D6 genes flags every substrate with a recommendation
`cds/server.js` (`recChanged` when `!sim.scored`) flags any substrate whose row classification is not "No recommendation". The prompt says "substrates whose recommendation now changes". For non-scored genes we cannot know whether it changes. AGENTS.md §7 ("may be affected by <drug>", no score) is respected, and the card copy says "may be affected / review", so this is acceptable. A one-line note in `cds/README.md` would stop a reviewer reading it as over-alerting.

### F5 — Minor: the CYP2D6 activity table now exists twice
`cds/lib/phenoconvert.js:12-108` is a hand-copied mirror of the table in `engine/phenoconvert.py`. If one is edited and not the other, card and Passport will disagree.
**Fix:** add a test that loads both and compares them, or generate the JS copy from the engine (or a shared JSON).

### F6 — Minor: the preview lacks the A8 source line for CYP2D6
In `cds/lib/preview.js:193-200, 244-251`, scenarios 2 and 3 have a CYP2D6 `geneProfile` with no `callability` (outside-call, mock caller). AGENTS.md §8b expects a CYP2D6 result to show that it came from a mock outside call. The live card does print it when `callability.source` exists (`cards.js`), but the preview's prefetch Observation (`makeObs`) gets no source.
**Fix:** add `callability: { method: 'outside-call', source: '<mock caller> (mock)' }` to those fixtures.

### F7 — Nit
- Scenario 3 shows `phenoconversion.applied: true` before the paroxetine is signed. Label it "after signing" so a judge does not read it as the patient's current state.
- `handoff/B6.md`: "Last commit: pending" should read d6d8784.

## Cross-cutting checks that apply to this PR
| # | Check | Result |
|---|---|---|
| 2 | Killed claims | pass: none in the diff (G6PD, sickle, frequency tie-break, "safe") |
| 4 | A5 integrity | pass: no diplotype re-picking in new code |
| 5 | Safety | pass: alternatives come only from `row.alternatives` via `selectAlternatives`; no LLM; no PharmCAT flags touched |
| 10 | Mandatory lines | pass: `preview.js:14-15` has "Demo data" and "Research prototype — not for clinical use" |
| 11 | AGENTS.md | §4 indicator is `info` (non-interruptive) ✔; §5 scope lock ✔ (only cds/, handoff, CHANGES); §7 ×0 / ×0.5 exact, strongest inhibitor wins (`phenoconvert.js:187-189`), genetic phenotype never overwritten ✔; §8b sweep skips not-assessed SV genes (`phenoconvert.js:157`) ✔; §10.4 screenshots not attached ✖ |
| 13 | A7 | pass, except F1 (display) and F2 (draft-order co-signing) |
| 14 | Alternatives | pass: label "Better matched for this patient's genes: <drug>", `type: 'create'`, never critical (`cards.js:56,237-241`) |
| 18 | Design system | pass for hex and font; axe-core was not run (see below) |

## Not checked (session limit)
- axe-core WCAG 2.2 AA on `/preview` (EN and AR)
- A live run of the F2 co-signing case
- Sandbox 8081 (not running in this environment)
- A line-by-line read of the full 989 lines of `preview.js` (only grep checks and the scenario fixtures were reviewed)
