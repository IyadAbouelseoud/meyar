# Final review and fix pass — Meyar (24 Nov 2026)

Run with Claude Code (Opus 5.5) on `prompts/REVIEW-opus-5.5.md`, the FINAL fix-pass version (commit `ba3549d`). The branch is `review/final-2026-11-24`, cut from `origin/main` `9784cfb`. Every fix is a separate commit (section 3). The previous review is archived at `docs/REVIEW-C6-C7-C9-2026-11-24.md`. The evidence files are `docs/review-evidence/audit-B.md`, `audit-C.md` and `audit-DEF.md` (per-task Done-when tables), plus `docs/report-verification.md` (Part C).

**Changes to locked areas:** none to clinical logic, dosing tables, the data contract or crypto parameters. Two behaviour changes fix defects against the spec:
- **A6, scanner.** A card that decrypts but is not germline is now refused with its own message. Before, it was reported as a wrong PIN and counted toward the lock-out (`8053c0b`).
- **B5 `/compare`.** The illustrative card now quotes the CPIC table row verbatim and states the ACS/PCI indication. Its prasugrel alternative only applies to that indication (`d63b8e9`).

Two tables are owned by other tasks, so their problems are filed in `docs/requests.md`, not edited (A5 `saudi_frequencies.json`, see finding 6). `AGENTS.md` is team-owned and was not edited (finding 7).

## 1. Verdict
**Not ready.** Two things block submission:
1. **D1–D5 and E1–E3 are not built.** There is no poster PDF, architecture diagram, demo MP4, brief description, submission checklist or pitch folder.
2. **The live Netlify Passport is the old snapshot.** It must be re-uploaded from the new `passport/dist` (section 7).

Everything built (A1–A8, B1–B6, C1–C9, F1–F6) now passes its Done-when boxes and cross-cutting checks 1–18, with the exceptions in section 3.

## 2. Task table

Reproduced counts this run: passport **60/60**, cds **45/45**, kit **32/32**, engine pytest **39 passed, 0 skipped**. The engine count follows `FHIR=1 bash engine/run_pipeline.sh`, which exited 0. Mobile regression **150/150** at phone widths, and the full review matrix **500/500** (it was 294/500). axe **68/68** page states with 0 violations. Contrast **62/62** pairs pass. These replace every older count in the docs (26, 18, 30, 31, 34, 37, 38, 41, 57).

| Task | Status | Evidence |
|---|---|---|
| A1 | pass | `gen_vcf.py --all` wrote demo-001..006 (now `.vcf.bgz` + `.csi`). In the container, bcftools 1.24 read every file (241/241/241/241/241/236 records). |
| A2 | pass | 18 outputs (report, phenotype, match × 6). The demo-001 report shows CYP2C19 `*2/*2`. DANGEROUS-flag grep finds only the test that asserts their absence (`engine/tests/test_sv_gate.py:231`). |
| A3 | pass after fix | Re-run on GeT-RM: **7/10 exact, 2/10 published diplotype among tied candidates, 1/10 mismatch**. The generator used to print "Exact concordance 9/10"; fixed with tests (`61d1c1f`). |
| A4 | pass | HAPI `Observation?subject=Patient/demo-001` total **23**, one per gene. All 12 contracts (engine out, fixtures, passport demo) validate against `docs/data-contract.schema.json`. |
| A5 | pass (+ request) | `test_coverage.py` passes. Every gene has `coverage`. All 82 allele rows match Goljan 2022 Table 1 value by value, 0 mismatches (Part C item 13). Tier 2 → null and Tier 0 CYP2D6 are tested. Open request: SLCO1B1 Tier 2 wording (finding 6). |
| A6 | pass after fix | Somatic test passes. All contracts are `germline`. Browser: the Passport refuses non-germline, and the scanner now does too, without a PIN penalty (`8053c0b`, test in `passport/test/scan.test.mjs`). |
| A7 | pass | demo-002 CYP2D6 Normal Metabolizer → effective Poor Metabolizer, cause `["paroxetine"]`. 30 inhibitor rows, all with an FDA source and date. ×0.5/×0 and the Caudle thresholds match in Python, cds JS and Passport JS (Part C item 8). |
| A8 | pass | demo-001 CYP2D6 `callability.method = not-assessed`, phenotype `null`. The card prints "copy number not assessed by this test — no result reported". The Passport and scanner show a hatched scale with no marker. The VCF label on not-assessed genes was removed (`5d791a7`). |
| B1 | pass, with caveat | 128 rows, every one with a source. **0/128 clinician sign-off.** The table is copied verbatim from the CPIC database by script, DPWG not included. README fixed; `AGENTS.md:49` still says "hand-built from CPIC/DPWG" (finding 7). |
| B2 | pass | Discovery: order-sign + order-select. Summaries ≤139 characters, now cut at a word boundary (`ac3dc17`). Indicators are info/warning only. `medication-prescribe` appears only as rejected/deprecated. No LLM or network advice call. |
| B3 | pass | Non-interruptive card. The backward sweep fires once per patient. The pharmacist Task suggestion works. Germline line on oncology drugs. |
| B4 | pass after fix | The "Switched" tile counted backward-sweep cards, not drug switches; renamed. Genes with no data showed an invented 25% shade; now "no data" (`75e166a`). Handoff hash fixed. |
| B5 | pass after fix | Paraphrased CPIC text, prasugrel without its indication, 11 hard-coded colours and the unsourced PROGRESS "90%" caption are all fixed (`d63b8e9`, `d3d8441`). |
| B6 | pass | Every alternative traces to an `alternatives[].quotedFrom` in its table row. None is generated or ranked. Scale labels are now in the page language (`d63b8e9`). |
| C1 | pass after fix | Both mandatory lines are on every screen (`5d791a7`). Image hero (`f1eb4a2`). Offline works (`8600af7`). |
| C2 | pass | Crypto matches `docs/qr-envelope.md`: PBKDF2-SHA256, 600,000 iterations, 16-byte salt, 12-byte nonce, AES-GCM-256, 6-digit PIN. The QR carries the payload, not a URL. As issued: demo-001 480 B (v17), demo-002 457 B (v17), demo-006 554 B (v18). Worst case 815 B (v23). |
| C3 | pass after fix | The scanner decrypts offline with the right PIN. A wrong PIN fails and locks after 3. Non-germline is refused separately. ARIA and scale labels are now in the page language (`2a9fe27`). |
| C4 | pass after fix | Hard-coded English in Arabic mode is moved to the i18n files (doctor tab `0ce980b`, scanner `2a9fe27`). Native-speaker review is still pending (`reviewedBy: null`). |
| C5 | pass | Elder mode at 320–430 px passes the mobile test. Every target is ≥48 px. |
| C6 | pass | OTC answers are covered by tests. Rows have `mock: true` and a source. |
| C7 | pass | ID-1 CSS is 85.60 × 53.98 mm, QR 28 mm. The QR decodes from 300 and 600 dpi rasters. Chromium's PDF measures 85.68 × 54.02 mm (print-engine rounding). |
| C8 | pass after fix | A wrong PIN fails. The QR card now carries the mandated "The PIN stops casual scanning only; a copied QR can be brute-forced offline." (`8053c0b`). |
| C9 | pass after fix | demo-002 reads "normal → slow, because of paroxetine". The doctor tab now draws every gene with the Meyar Scale (`0ce980b`). |
| D1–D5 | **not built** | No handoff, no CHANGES entry, no deliverable (`audit-DEF.md:16-56`). |
| E1–E3 | **not built** | No `docs/pitch/` (`audit-DEF.md:57-73`). |
| F1 | pass | The T1 render reads "Kit design — software working". T3/T4 read "Concept render — not built" on the chip and the screen. |
| F2 | pass, minor | The MP4s are labelled. At the 5.5–6.0 s crossfade the T1 and T3 chips overlap; the 57 s end card has no chip (finding 12). |
| F3 | pass | On main. Kit tests 32/32. |
| F4 | pass after fix | The panel now carries both mandatory lines and "about 30% lower odds" (`86f8f91`). |
| F5 | pass | Roadmap note labelled. |
| F6 | partial | The end-to-end script was not run (it resets the kit ledgers). The offline scan used a browser offline context, not a second device. |

## 3. Findings by severity

### Blocks submission
1. **D1–D5 and E1–E3 are not built.** These are separate tasks with their own prompts, and some need people (rehearsal times, submitting the form). This pass did not start them (AGENTS §10.5). The next action: run `prompts/D1.md` through `prompts/E3.md`.
2. **Fixed: `scan.html` was blank offline.** `passport/public/sw.js` precached only the HTML and demo JSON. Now a Vite plugin writes every built file into the precache list and a build-hash cache name (`8600af7`, `passport/test/offline.test.mjs`). Proven in a browser: after one visit to `index.html`, offline `scan.html` renders with 37 cached entries and its fonts.
3. **Fixed: the mandatory line "Runs on synthetic and GeT-RM reference data; no patient data was used." was missing** from the Passport, scanner, kit, reader, cds pages and F4 panel (`5d791a7`, `86f8f91`, test `passport/test/honesty-lines.test.mjs`).
4. **Fixed: mobile.** Before, 47 of 150 phone states passed. Problems: 42 px segmented buttons, a 30 px wordmark link, 19 px CPIC links, the "Doctor view" tab overflowing at 320 px in English, a 13 px scanner textarea (iOS zoom), a dashboard tooltip off-screen, and the showcase phone frame at 309 px in a 288 px column. No page used `env(safe-area-inset-*)`, although the Passport sets `viewport-fit=cover`. Now **150/150** at 320/375/430, ar/en, elder on/off, and every target is ≥48 px (`7fbaaad`, `b2a3483`, `64a4543`).

### Wrong in front of a judge
5. **Fixed: B5 `/compare` card** (`d63b8e9`, `d3d8441`).
   - It paraphrased CPIC: "Avoid standard-dose clopidogrel…" against the table's "Avoid clopidogrel if possible…".
   - It offered prasugrel without the ACS/PCI indication its row needs.
   - It used 11 hard-coded colours.
   - Its caption carried the PROGRESS "90% acted on", which has no primary source (Part C item 5: DROPPED).
6. **Open (A5 owner): SLCO1B1 is called a "no published Saudi frequency" gene** (`tables/saudi_frequencies.json` `_coverageStatement`).
   - Goljan et al., *Hum Genomics* 2024;18:30, publishes Saudi SLCO1B1 frequencies (`*15` 24.7%), and `docs/research/02-saudi-genetics.md` cites that paper.
   - The 16 Tier 2 rows carry Goljan's DOI and `n: 11889`, which reads as if Goljan measured those genes.
   - Filed in `docs/requests.md`. It is not edited here, because it changes the A5 tier and score.
7. **Open (team): `AGENTS.md:49` says the table is "hand-built from CPIC/DPWG".** It is a script copy of the CPIC database, DPWG not included, with 0/128 clinician sign-off. `AGENTS.md:52` should also say "the convention described in Thomas et al. 2020, who cite CPIC (Crews 2014) and Gaedigk 2008". README fixed (`e4f7f55`). Every doc and the paper must say "model cross-check against the CPIC database, not clinician-reviewed".
8. **Fixed: numbers in docs that the primary sources contradict** (Part C, `d3d8441`, `b88cf7b`, `e243303`):
   - Mayo "6,620 firings, 54% acceptance" mixed two different numbers.
   - The CYP2D6 IM threshold read ">0 to 1.0"; it is <1.25, and the code was already right.
   - "99.2% of 11,889" is 99.2% of 1,928.
   - The Aseer stroke caveat needed "hospitalised".
   - "Roughly a quarter of medicines" had no source and is removed.
   - GeT-RM "363 samples, 34 genes" had no source and is removed.
   - SFDA "requires" is "should".
   - Lima 2021, not 2020.
   - The FDA page dates were split into the two pages they belong to.
   - The QR size was given as 360 B; it is 480 B as issued.
9. **Fixed: the doctor tab drew phenotypes without the Meyar Scale** (AGENTS §11), and the doctor tab and scanner showed English in Arabic mode (`0ce980b`, `2a9fe27`). Prescriber scales on `/compare`, `/preview` and the scanner printed English labels on Arabic pages, because `'clinician'` was passed as the language (`d63b8e9`; this closes the B6 request).
10. **Fixed: handoff "Last commit" fields.** Missing, "pending" or non-existent hashes in A1–C8 and F1–F6, for example B4 `b14822c` and C5 `c208daa`. All now point to real commits (`45eae77`).
11. **Fixed: the README run snippet failed on a clean clone,** because the VCF is generated and git-ignored. It also skipped the A6 and A8 gates. It now runs `engine/run_pipeline.sh`. The kit port 5174 row, the B2–B6 and C1–C9 ranges and the provenance are corrected (`e4f7f55`).

### Independent code review of this branch (superpowers:requesting-code-review)
A fresh reviewer read the full diff (`9784cfb..64a4543`) and called it "Ready to merge: With fixes". It found no critical issues. Every important and minor item was handled:
- **#1, fixed: `truncateSummary` stripped a trailing "s" from the last word.** The regex had `s` where `s` was meant, so "Metabolizers" became "Metabolizer". Fixed, with a regression test (`a38567a`).
- **#2, fixed: the committed `passport/dist` was stale against the source.** It is rebuilt. Netlify serves this folder, so always rebuild before uploading.
- **#3, fixed: a failed precache could wipe offline mode.** The install now caches the pages, code, fonts and demo data all-or-nothing: if one fails, the install fails and the previous worker keeps its cache. Illustrations are cached best-effort, and `skipWaiting` runs only after success. Both behaviours are tested against the real `dist/sw.js` with fake caches.
- **#4, fixed: a decrypted but malformed card threw in the scanner.** It now gets its own message and costs no PIN attempt.
- **#5, #6, #7, fixed: Arabic on the clinician side.** The scanner's A8 line was English. The clinician scale showed patient wording ("جيناتك") in Arabic. The helper was copied three times. Now there is one `clinicianScaleHTML` in `design/meyar.js`.
- **#8, fixed: `_headers`.** Images, `/` and the HTML revalidate, and the README now has a deploy note.
- **#9, #10, left: minor labels** in `run_validation.py` and `CHANGES.md`. No effect on the current data.

### Minor
12. **Open: F2 video.** At the 5.5–6.0 s crossfade the T1 and T3 status chips overlap and neither is readable. The F3 end card at 57 s has no chip. Smallest fix: hard-cut the chip at the crossfade midpoint and add "Kit design — software working" to the end card, then re-render (`hardware/blender`).
13. **Open (A4): the card footer shows "CPIC PharmCAT 3.4.0" as the guideline version.** The B3 spec prints the contract's `guidelineVersion`, and A4 writes that value for every gene. The card's link names the guideline it quotes. Changing what A4 writes is a contract decision.
14. **Open: only 3 of the 6 demo contracts ship** in `docs/fixtures` and `passport/public/demo` (001, 002, 006), and they are trimmed hand fixtures. Their CYP2C19 coverage (9/11, `*35`) is the canonical contract example, while the engine output for demo-001 is 35/35. All 12 contracts are schema-valid and germline. Smallest fix: label the fixtures "illustrative coverage" in `docs/fixtures/README`, or regenerate them from `engine/data/out` (an A4/C1 decision).
15. **Fixed:**
    - The dashboard tile label and the no-data cells (`75e166a`).
    - Card summaries cut mid-word (`ac3dc17`).
    - TAILOR-PCI is now cited in `hardware/README.md`.
    - `#fff` in `kit/web/f6.css` is replaced with a token (`fab2ee8`).
    - SEO meta descriptions were missing (`775d0a5`).
    - `.vcf.bgz` was not git-ignored (`c7745cc`).
16. **Open:**
    - 36 of 38 prompts embed the old data-contract JSON. They should point at `docs/data-contract.schema.json`.
    - There is no recorded team decision on the 21 Nov "device cut" versus the later renders. Add one line to CHANGES.md.

## 4. Cross-cutting checks 1–18

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Data contract | pass | 12/12 contracts validate (jsonschema). `currentMedications` items are written as `{name, source, mock}`. |
| 2 | Killed claims | pass | Every hit in code, docs, UI and poster is a correct negation or a guard (`audit-DEF.md`). "safe" and "switch" never appear on the patient side. |
| 3 | Numbers | pass after fix | Every UI and poster number has a `docs/sources.md` row. "See EN detail doc" rows were replaced with primary citations. PROGRESS 90%, "quarter of medicines" and GeT-RM 363/34 were removed. |
| 4 | A5 integrity | pass | No code path re-picks a diplotype. All candidates are shown, and A3 reports ties as ties. |
| 5 | Safety | pass | Recommendations and alternatives come only from `tables/cpic_recommendations.json`. No LLM call. No DANGEROUS flag. |
| 6 | A6 | pass after fix | Engine, Passport and scanner all refuse non-germline. All Observations and contracts are germline. |
| 7 | C8 | pass after fix | Parameters match the spec. A wrong PIN fails. "Stops casual scanning only" is on the QR card and the scanner. |
| 8 | Hardware | pass, minor | Every render is labelled. F2 crossfade overlap (finding 12). TAILOR-PCI cited. |
| 9 | Ports/versions | pass after fix | 8080/3000/8081/5173 as pinned. Kit 5174 was in use but undocumented; README row added. The host runs Node 24.18, not the pinned 22. The pin is unchanged; noted. |
| 10 | Mandatory lines | pass after fix | Both lines on every page in both languages, and on the F4 panel. |
| 11 | AGENTS 2–11 | pass except finding 7 | §7 provenance wording (team-owned). Everything else holds. |
| 12 | Handoffs | pass after fix | Every built task's handoff is `Status: DONE` with a real hash. D/E have none (not built). |
| 13 | A7 | pass | `phenotype` is never overwritten. ×0.5/×0 exactly. 30 FDA-cited inhibitor rows. Non-CYP2D6 genes are flagged, never scored. demo-002 shows Normal → Poor because of paroxetine on the card, Passport, pharmacist view and scanner. |
| 14 | Alternatives | pass after fix | Every alternative traces to `quotedFrom`. The patient side says "ask your doctor". `/compare` now states its indication. |
| 15 | A8 | pass | No VCF-derived phenotype for `sv_genes`. "Not assessed" on the card, Passport and scanner. Mock outside-call files are marked mock and name their caller. `docs/structural-variants.md` quotes PharmCAT and says we do not run a CNV-aware caller. |
| 16 | A5 tiers | pass, with request | 82/82 Tier 1 rows match Table 1 with n and table number. Tier 2 returns null. CYP2D6 has no score. The SLCO1B1 statement is factually outdated (finding 6). The poster's Saudi line (KFSHRC 1,500+) is not the `_coverageStatement` sentence; the poster does not quote it. |
| 17 | Mock data | pass | Mock rows are `mock: true`. Every screen shows "Demo data". No doc treats SFDA, PDPL or NPHIES as a blocker or as approved. |
| 18 | Design system | pass | `node design/build-tokens.mjs --check`: 62/62. No hard-coded hex in passport/cds/kit outside `design/` except the QR ink, which C2 specifies. Meyar Scale on every phenotype, hatched for not-assessed. axe WCAG 2.2 AA: 0 violations on 68 page states. ANTI-SLOP scores in section 5. |

## 5. Mobile matrix, Lighthouse, design scores

**Mobile matrix** (tests/mobile, Chromium emulation with touch and mobile viewport). Each cell gives passing states (ar + en, and elder on/off on the Passport) **before → after**. A state passes with no horizontal scroll, no element wider than the viewport, every tap target ≥48 px (before was measured at 44 px; elder 48), inputs ≥16 px, the viewport meta present, no console or page error, and every image loaded. Totals: before **294/500**, after **500/500**. Screenshots: `docs/screenshots/final-review/{before,after}/<page>/<viewport>-<lang>-<state>.webp` (WebP q60, ≤1200 px wide; converted from PNG to keep the repo small). Per-state results: `before/results.json` and `after/results.json`.

| Page | 320x568 | 360x740 | 375x667 | 390x844 | 412x915 | 430x932 | 844x390 | 768x1024 | 1024x1366 | 1440x900 |
|---|---|---|---|---|---|---|---|---|---|---|
| passport-genes-001 | **1/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-genes-002 | **1/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-meds-002 | **1/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-otc-001 | **1/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-doctor-001 | **1/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-pharmacist-002 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-caregiver-001 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| passport-scan | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | **2/4** → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 | 4/4 → 4/4 |
| kit-index | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| kit-card | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| kit-tracker | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| kit-urgent | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| cds-preview | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| cds-compare | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| cds-dashboard | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **1/2** → 2/2 | 2/2 → 2/2 |
| design-showcase | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |
| demo-reader | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | **0/2** → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 | 2/2 → 2/2 |


**Lighthouse mobile, Passport** (Chromium 156; served gzip-compressed like Netlify; "before" is `origin/main`'s committed `passport/dist`):

| Page | Perf | A11y | Best practices | SEO | LCP |
|---|---|---|---|---|---|
| index, before | 96 | 100 | 100 | 90 | 2.3 s |
| index, after | 96 | 100 | 100 | **100** | **2.0 s** |
| scan, before | 96 | 100 | 100 | 90 | 2.3 s |
| scan, after | **99** | 100 | 100 | **100** | **1.6 s** |

Without compression (a plain static server), performance is 65–81 for both builds, because about 365 KiB of text goes uncompressed. Netlify compresses by default. The new `passport/public/_headers` caches the hashed `/assets/*` for a year.

**Impeccable detector** (`impeccable detect`, before → after per changed UI file): `design/meyar.css` 0w/1a → 0w/1a (the chart-paper grid, a deliberate system texture). `passport/src/app.css` 0 → 0. `kit/web/index.html` 1 → 1. `kit/web/f6.css` 3 → 3: tracker timeline rail and roadmap list markers, semantic and not cards. `design/showcase/index.html` 27w/2a → 27w/2a: static estimates over a dark hero; axe on the rendered page finds 0 contrast violations. The pass introduced no new detector finding.

**ANTI-SLOP** (11-item checklist, ticks per screen; fail at 2):

| Screen | Ticks | Note |
|---|---|---|
| Passport genes / meds / OTC / doctor / pharmacist / caregiver | 0 | Four Meyar fonts; status is shape + word + colour; targets ≥48 px; numbers sourced or Demo data |
| Scanner (scan.html) | 0 | |
| Kit index / card / tracker / urgent | 0 | The tracker rail is a stepper, not a card stripe |
| cds preview | 0 | |
| cds compare | 1 | Item 7: a modal interrupts the prescriber. It is the deliberate "others build this" counter-example, now `inert` and captioned |
| cds dashboard | 0 | |
| Design showcase | 1 | Same counter-example modal |

## 6. Image library

Every image decodes in all three sizes (`audit-DEF.md`). `img-10` and `img-15` "-1920" are 1792 px wide; the srcset declares `1792w`. Every placed image uses srcset, intrinsic width/height (CLS ≤0.014), lazy loading below the fold, bilingual alt text and the label "AI-generated illustration / صورة توضيحية مولَّدة". None is inside clinical content (test `passport/test/imagery.test.mjs`). The Passport copies are precached for offline use.

| Image | Subject | Used on |
|---|---|---|
| img-01 | Aseer terraced village | kit tracker |
| img-02 | older woman reading phone | Passport "My medicines"; showcase |
| img-03 | pharmacist passes medicine bag | none (intended for the poster "how it works", task D1) |
| img-04 | saliva tube + mailer | kit index (labels); showcase |
| img-05 | clinician hands, tablet | cds `/preview`; showcase |
| img-06 | card on majlis table | Passport printable-card section; showcase |
| img-07 | juniper escarpment | showcase footer band |
| img-08 | Al-Qatt wall detail | none (poster texture, D1) |
| img-09 | brass weights | none (About block; no About page exists) |
| img-10 | grandson helps grandfather | none (elder-mode explainer; candidate for C5 onboarding) |
| img-11 | gloved hand, 96-well plate | kit index (hand-off to the engine) |
| img-12 | hospital corridor | none (deck "problem" slide, E1) |
| img-13 | pharmacy shelves | none (dashboard empty state; the demo log is never empty) |
| img-14 | card at pharmacy scanner | Passport doctor tab |
| img-15 | capsule on brass balance | Passport cover hero (preloaded); showcase hero |

The poster (F4/D1) uses no photos. D1 is not built, and the F4 panel shows hardware renders only.

## 7. Netlify re-upload list

The live site (https://stupendous-mooncake-4ac3dc.netlify.app) is a static snapshot. Re-upload the **whole** `passport/dist/` folder from this branch, replacing everything:
- `index.html`, `scan.html`, `sw.js`, `_headers`
- `assets/*` (hashed JS, CSS and fonts; the old hashes must go)
- `imagery/*` (12 files: img-02, -06, -14, -15 × 3 sizes)
- `demo/*` (3 contracts)

`sw.js` now uses a build-hash cache name, so returning visitors drop the old cache automatically. This pass did not deploy.

## 8. Not checked, and why
- **Physical QR print and phone scan.** No printer or phone in this session. Raster proxies at 300 and 600 dpi decode.
- **Real iOS Safari and real devices.** Chromium emulation only (touch, mobile viewport, DPR 2). Safari keyboard behaviour and safe areas are covered by CSS, not observed.
- **CDS Hooks sandbox on 8081.** Not running.
- **F6 `run_e2e.sh`.** Not run: it rebuilds the containers and resets the kit ledgers. The other compose project (`meyar`, ports 8080/3000) was left running. This branch's CDS was tested in-process and through its test suite.
- **200% zoom (C5).** Not driven.
- **Part C items still unverified** (list in `docs/report-verification.md`): Coriell `*1/*1`, GeT-RM 363/34, NICE prices, array/OneOme prices, KKU page/rubric, PDPL Implementing Regulations, Saudi PCI counts, Aseer diabetes/CVD prevalence, Saudi Genome Program total.
