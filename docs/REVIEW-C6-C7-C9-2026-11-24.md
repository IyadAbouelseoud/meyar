# Review — C6 (PR #18), C7 (PR #19), C9 (PR #20) and the C9 merge conflicts

Run: 2026-11-24, Claude Code, Opus 5.5, `prompts/REVIEW-opus-5.5.md`, scoped at the user's request to C6, C7 and C9. Other tasks were not re-audited in this run. The previous review (A5/A7/A8) is kept at `docs/REVIEW-A5-A7-A8-2026-11-22.md`.

The user asked for C9 to be merged into `main` after resolving its conflicts, so this run departs from the prompt's "read and run only" rule in two commits, both listed in section 5.

## 1. Verdict
**Ready with fixes. Merged.** C6 and C7 were already on `main`. C9 (PR #20) conflicted with C7 in `CHANGES.md`, `passport/src/app.css`, `passport/src/render.js` and the hashed `passport/dist` bundle. Every conflict was resolved by keeping both sides. Every Done-when box for C6, C7 and C9 is proven on the merged tree. One Arabic display bug was fixed (flipped parentheses on the better-match citation), and a sources row was added for the A6 size. The remaining findings are minor.

## 2. Task table

| Task | Status | Evidence |
|---|---|---|
| C6 | pass | Headless Chromium on `vite preview :5173`, network set offline after load. demo-001 `omeprazole` → `ask` ("Ask the pharmacist before buying"). `paracetamol` → `none` plus "Normal label advice still applies". `zzqxv` → "Not in our list — ask the pharmacist". The Arabic `بنادول`, the typo `omeprazol` and the Arabic `أوميبرازول` all match. `tables/otc_products.json`: 16 rows, all `"mock": true`, each with a `source`. |
| C7 | pass | The card face (ar) shows the wordmark, "Ask the holder for the PIN", the prototype line, the QR, the MRZ strip (version and date) and the Qatt band. No patient ID and no phenotype text. The QR is rendered at 28.0 mm. The QR decodes with jsQR from a 600 dpi raster of the card for demo-001 (93-module viewBox, 0.301 mm/module) and demo-002 (93, 0.301). It also decoded at 300 dpi in every trial with up to 4 medicines. Below 300 dpi the simulated results varied with how the QR grid lined up with the pixels, so they are not used as evidence (see finding 3). The `@page` mm sizes are covered by `print.test.mjs`. C7's handoff records the PDF page size as 85.68 × 54.02 mm. This run did not re-measure the PDF (see "Not checked"). |
| C9 | pass | EN demo-002 gene card: "Your genes: normal · Right now you act like: slow, because of paroxetine. Tell your doctor before starting tramadol, codeine." The AR gene card shows the equivalent line ("…بسبب باروكسيتين…"). Offline, adding `paroxetine` on demo-006 (CYP2D6 UM, already NM via duloxetine) changes the card to "act like: slow". It is stored as `{"source":"patient-entered","mock":true}`. Typing the Arabic `فلوكسيتين` resolves to fluoxetine. OTC `Solpadeine` and `codeine` on demo-002 → `stop` ("Do not take without your doctor"). The pharmacist view was checked at 375 and 1440 px, in ar and en, with elder mode on and off. |

`npm --prefix passport test` on merged `main`: **38 pass, 0 fail**. `node design/build-tokens.mjs --check`: **62/62** contrast pairs pass.

## 3. Findings (ranked)

### Wrong in front of a judge
1. **Fixed: Arabic better-match citation rendered with flipped parentheses.** In `passport/src/render.js:192` (gene card) and `:811` (pharmacist view), the citation was not isolated as LTR, so `(Crews KR et al., Clin Pharmacol Ther 2021)` showed as `…طبيبك (Crews KR … (2021`. The OTC view (`:584`) already wrapped it in `dir="ltr"`. Fixed in `116ecac` and re-checked with a screenshot.

### Minor
2. **Fixed: A6 size had no sources row.** The `printA6Caption` string in `passport/src/i18n/en.json:227` and `ar.json:232` shows "105 × 148 mm", but `docs/sources.md` had no matching row. Added "A6 sheet 105 × 148 mm | ISO 216" in `116ecac`.
3. **Fixed (follow-up): the QR payload had no cap on current medicines.** `passport/src/qr.js:116` adds every current medicine to the payload, so the QR gets denser with each one. In a 300 dpi raster trial (3 runs per count, 2 patients), the card decoded every time with up to 4 medicines, was mixed at 5 and mostly failed at 6. Fix: `MAX_CURRENT_MEDS = 4` in `qr.js`. Adding a 5th medicine is refused with a message telling the patient to tell the pharmacist about the rest. Physical paper scanning is still untested.
4. **Fixed (follow-up): the medicine row said "Shifts gene activity" for non-CYP2D6 genes.** Adding fluoxetine lists "CYP2C19, CYP2D6 · Shifts gene activity". For CYP2C19 the engine only flags the interaction and does not score it, and the gene card correctly says "May be affected by". Fix: the new helper `getMedGeneEffects` (`lookup.js`) splits scored genes from flagged ones. The row now reads "CYP2D6 · may affect CYP2C19". A medicine that only flags a gene gets "May affect gene activity".
5. **Fixed (follow-up): non-germline input was passed through silently in the browser.** `passport/src/phenoconvert.js:263` returns the contract unchanged when `sampleOrigin !== 'germline'`, while `engine/phenoconvert.py` raises an error. The engine's A6 gate stops such contracts upstream, so this is defence in depth only. Fix: `applyPhenoconversion` now throws, as the engine does. `main.js` refuses to load a non-germline profile and shows a bilingual message instead.
6. **Fixed (follow-up): the C9 handoff "Last commit" was stale.** `handoff/C9.md:5` says `130fcd8`, but the branch head was `7edf010`. This is cosmetic.
7. **Fixed (follow-up): `/favicon.ico` returned 404.** It shows as one console error on the first page load. The passport had no favicon. `index.html` and `scan.html` now declare an empty icon, so the browser makes no request.

## 4. Cross-cutting checks (scoped to the C6/C7/C9 surface)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Data contract | pass | `currentMedications` items are written as `{name, source ∈ {hospital-record, patient-entered}, mock}` (`phenoconvert.js` `mergeCurrentMedications`). That matches the schema, which allows `name`, `rxnorm`, `source` and `mock` with `additionalProperties: false`. Every handoff says the contract was not changed. |
| 2 | Killed claims | pass | No match in the C6/C7/C9 diffs for frequency tie-breaks, Indeterminate as phase, G6PD, sickle cell or co-trimoxazole. In the UI, "safe" appears only in the ar.json authoring note and "switch" only in the caregiver note. |
| 3 | Numbers | pass after fix | 85.60 × 53.98 mm → ISO/IEC 7810 row. 105 × 148 mm → ISO 216 row (added). Thomas 2020 multipliers and Caudle 2020 thresholds are cited. |
| 4 | A5 integrity | pass | The C9 code never re-picks a diplotype. All CPIC lookups key on `effectivePhenotype` or `phenotype`. |
| 5 | Safety | pass | Recommendations and alternatives come only from `tables/cpic_recommendations.json` (`lookup.js`, `otc.js`). No network or LLM call. No PharmCAT flags are touched. |
| 6 | A6 | pass (minor 5) | The gate runs upstream. In the browser, non-germline input is passed through rather than rejected. |
| 7 | C8 crypto | pass | The C2/C8 round-trip tests pass, including the wrong-PIN failure. The offline brute-force honesty line is shown (`qr-brute-honesty`). |
| 8 | Hardware | n/a | Not touched by these tasks. |
| 9 | Ports | pass | Passport preview is pinned to `5173 --strictPort` (`passport/package.json`). |
| 10 | Mandatory lines | pass | "Research prototype — not for clinical use" is in the header and on the ID-1 face. "Demo data" is labelled on every screen. |
| 11 | AGENTS.md / scope locks | pass | C6 touched only `passport/`, `tables/otc_products.json`, its handoff and CHANGES. C7 and C9 touched only `passport/`, their handoffs and CHANGES. |
| 12 | Handoffs | pass | `handoff/C6.md`, `C7.md` and `C9.md` all have `Status: DONE`. `CHANGES.md` has `## C6`, `## C7` and `## C9`. |
| 13 | A7 phenoconversion | pass | The browser port's CYP2D6 activity table equals `engine/phenoconvert.py` (95/95 alleles identical, scripted diff). It uses the same ×0.5 / ×0 factors and Caudle thresholds. `phenotype` is never overwritten. Non-CYP2D6 genes are flagged with no score. demo-002 shows "normal → slow because of paroxetine" on the card and in the pharmacist view. |
| 14 | Alternatives | pass | All 88 `alternatives` entries in the CPIC table have `quotedFrom`, and every row with alternatives has a `guideline`. The UI shows them only from those rows (including `drugClass`, such as "non-tramadol opioid"), always followed by "ask your doctor". None is generated or ranked. |
| 15 | A8 SV | pass | demo-001 CYP2D6 `not-assessed`: OTC codeine → `ask`, never reassurance (test). The browser port also treats any `sv_genes` gene without an outside call as not assessed. |
| 16 | A5 tiers | not re-checked | Out of scope. C9 only reads `saudiDataTier`. |
| 17 | Mock data | pass | OTC rows and patient-entered medicines have `"mock": true`. The "Demo data" chip is on every screen. |
| 18 | Design system | pass | `build-tokens` reports 62/62. No hard-coded colours or font families in `passport/src` except the QR SVG ink and white, which C2 specifies. axe-core (wcag2a/aa, 21a/aa, 22aa) found **0 violations** on genes, meds, OTC, doctor, pharmacist and pharmacist-elder screens, at 375 and 1440 px in ar and en (24 runs). Horizontal overflow is 0 everywhere. `dir=rtl` is set for ar. ANTI-SLOP: the new CSS has no gradients, bounce, `transition: all` or side stripes. The pharmacist sheet nests tinted `.m-better` boxes inside the gene panel, which is at most 1 tick. No screen reaches 2 ticks. |

## 5. Edits made in this run (user-requested merge)
- `52f1b80` — merges `origin/c9-meds-pharmacist` (PR #20) into `main`, resolving conflicts only:
  - `CHANGES.md`: keeps both `## C7` and `## C9`.
  - `passport/src/app.css`: keeps both the C7 print block and the C9 medlist/pharmacist block.
  - `passport/src/render.js`: the doctor header keeps C9's Show-to-pharmacist button and C7's `m-doctor-head m-noprint` classes, so the button stays off the printout.
  - `passport/dist`: rebuilt from the merged source.
- `116ecac` — the review fixes for findings 1 and 2 (render.js `dir="ltr"` on 2 lines, one row in `docs/sources.md`, dist rebuilt).

## 6. Follow-up (same day, user-requested)
Minor findings 3–7 are fixed in a follow-up commit. `npm --prefix passport test` gives 41 pass, 0 fail, including the new `passport/test/review-fixes.test.mjs` (3 tests). In the browser check, the fluoxetine row reads "CYP2D6 · may affect CYP2C19", the 5th medicine is refused with the list-full message, and the page made no failing HTTP request.

## Not checked
- Physical print and phone scan of the ID-1 card. The decode tests used a rasterised card, not paper, and simulated results below 300 dpi were unstable.
- Re-measuring the PDF page size in this run. C7's handoff records 85.68 × 54.02 mm, and the `@page` size is covered by the unit test.
- `docker compose` stack, CDS service and engine tests. Not touched by C6, C7 or C9.
