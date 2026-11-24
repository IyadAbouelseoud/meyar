# Prompt · the 4 pre-recording fixes (P0-1 to P0-4)

Paste everything below the line into Claude Code (or Antigravity) opened on the `meyar` repo, on a fresh branch off `main`.

---

You are working on the Meyar repo (KKU Health Innovation Hackathon, research prototype, mock data only). Read `AGENTS.md` in full first; it overrides anything below. Then read `docs/demo-video/01-master-plan.md` section 2 for context. Deadline is tomorrow, so keep the change small, safe and well-tested. Skip the long implementation-plan approval step: post a 5-line plan, then build.

**Goal:** make the clinician screens fully Arabic and demo-ready for the video recording. Do exactly these four fixes and nothing else.

## Fix 1 · Arabic CDS card on `/preview?lang=ar` and on the kit's `/urgent?lang=ar`

Today the page chrome is Arabic, but the card body is English. The card title, the field labels (Order, Genetic, Acting like, Clinical implication, CPIC indication, Better matched…), the indicator text (WARNING / INFO · BACKWARD SWEEP), the Meyar Scale stop labels and pins (Ultrarapid … Poor, "Genetic", "Acting like"), the drug names in the orders table ("Codeine 30 MG Oral Tablet") and the alternative buttons are all English. `cds/lib/preview.js` builds its UI by regex-parsing the English markdown in `card.detail` (lines ~742–880). `kit/web/urgent.js` prints `card.summary` and `card.detail` directly.

Do it this way:
1. In `cds/lib/cards.js`, add a structured CDS Hooks 2.0 `extension` object to every card, e.g. `extension: { "meyar": { gene, diplotype, phenotype, effectivePhenotype, phenoconversion, drug, indicator, cpicQuote, cpicQuoteIfStopped, implication, cpicIndication, alternatives, alternativeClass, coverage, callability, guidelineVersion, citation, backwardSweep, affectedDrugs } }`. Fill it from the same data the English text already uses. **Leave `summary` and `detail` byte-for-byte unchanged** so CDS Hooks clients and existing tests keep working.
2. In `preview.js` (and in `urgent.js`, served by the kit), when `lang=ar`, render the card from `extension.meyar` with Arabic labels. English mode stays as it is today.
3. Arabic vocabulary: reuse `passport/src/i18n/ar.json`. Scale stops come from `scale.metabolizer` (بطيء · أبطأ قليلاً · طبيعي · أسرع قليلاً · سريع جداً). Phenotype words come from `phenotypeShort`. Drug names come from `drugs`. Pins: «جيناته» for the hollow ring, «الآن» for the needle. Indicator: «تحذير» / «للعلم · مراجعة الأدوية الحالية». Card title pattern: «CYP2D6 سريع جداً، يعمل الآن كطبيعي (دولوكسيتين): كودايين». Orders table: drug name in Arabic + strength, e.g. «كودايين ٣٠ ملغ أقراص».
4. **The CPIC recommendation text stays verbatim English** (lookup-only rule, AGENTS.md §7: no machine translation of guidance). Show it in its own quote block headed «نص CPIC الحرفي», with `dir="ltr"` and `lang="en"`. The "applies if <drug> is stopped" line gets an Arabic heading: «إذا أُوقف دولوكسيتين، تنطبق النتيجة الوراثية:», with the CPIC text verbatim beneath it.
5. Gene names, star alleles, activity-score maths (e.g. `3.0 × 0.5 = 1.5`) and citations go inside LTR isolates (`<bdi>` or `dir="ltr"` spans) so `*1/*2x2` never flips.
6. Footer in Arabic: «بيانات تجريبية · ينصح ولا يصف الدواء · نموذج بحثي — ليس للاستخدام السريري».

## Fix 2 · Patient banner on `/preview`

Add a mock patient banner above the orders table, design-system styled (`design/` tokens and components only, IBM Plex Sans Arabic, chart-paper theme). Fields:
- الاسم: «مريض تجريبي ٠٠٦» (pseudonym, never a real-sounding name)
- العمر: ٥٨
- نوع العيّنة: وراثية (germline)
- معرّف العُدّة: `MYR-DEMO-0006`
- تاريخ النتيجة: Hijri (Umm al-Qura) + Gregorian, the same way `cds/lib/dashboard.js` already does
- a «بيانات تجريبية» chip

The banner values come from the selected scenario, so each scenario defines its own banner. Use matching mock values for demo-001/002 (ages within 45–64, kit IDs `MYR-DEMO-0001`/`MYR-DEMO-0002`). Mark every value `mock: true`. Add the English equivalents for `lang=en`.

## Fix 3 · Scenario 5: demo-006 codeine with duloxetine

Add a fifth scenario to `/preview`: «٥. demo-006 · كودايين (مع دولوكسيتين)» / "5. demo-006 · Codeine (on duloxetine)". The current medication is duloxetine (patient-entered, active). The new order is codeine 30 mg, signing now. Build its prefetch the same way the other scenarios do, from `docs/fixtures/demo-006.contract.json` (CYP2D6 `*1/*2x2` Ultrarapid via mock outside call, acting like Normal because of duloxetine, moderate inhibitor, `3.0 × 0.5 = 1.5`).

The backend already handles this case. A POST to `/cds-services/meyar-pgx` for demo-006 + codeine returns "CYP2D6 Ultrarapid Metabolizer, acting like Normal Metabolizer (duloxetine): codeine" plus the "applies if duloxetine is stopped: Avoid codeine…" row. Don't change backend logic. Make this scenario the **default selected** one when the page loads, because the video opens on it.

## Fix 4 · Remove unverified figures from `/compare`

`cds/lib/compare.js` line ~12 (and its English twin) states University of Florida "20% followed" and UK PROGRESS "90% acted". The project's research validation flags both as **unverified**. Remove the numbers. Replace the sentence with a sourced-free framing, e.g. «تُظهر الدراسات أن التنبيهات المقاطِعة تُرهق الأطباء؛ لذلك بطاقة مِعيار جانبية ولا تقاطع.» / "Interruptive alerts are known to cause alert fatigue, so Meyar's card sits beside the order and never blocks it." Add no other number. Grep the whole repo (`cds/`, `kit/`, `passport/`, `docs/demo/`) for "20%", "90%", "PROGRESS" and "UF" in user-facing strings, and remove any other user-facing occurrence you find. List what you removed in your summary.

## Rules

- Scope lock: `cds/lib/cards.js`, `cds/lib/preview.js`, `cds/lib/compare.js`, `cds/test/`, `kit/web/urgent.js`, `kit/test/` if needed, `CHANGES.md`, `handoff/DEMO-FIXES.md`. Touch nothing else. Do not change the data contract, any `tables/` file, ports or dependencies.
- Never invent clinical text. Every Arabic string is a UI label. Guidance stays verbatim CPIC.
- The patient side is not in scope. Don't touch `passport/`.
- Add tests in `cds/test/cds.test.js`: (a) `summary`/`detail` unchanged for an existing case; (b) `extension.meyar` present with the right fields for demo-006 codeine; (c) `/preview?lang=ar` HTML contains «نص CPIC الحرفي» and no "Ultrarapid" in the scale labels; (d) compare page contains no "20%" or "90%". Run `cd cds && npm test` and `cd kit && npm test`. Both must pass.
- Verify visually: Playwright screenshots of `/preview?lang=ar` (scenario 5 after signing, and scenario 1 after signing), `/preview?lang=en` scenario 5, and kit `/urgent?lang=ar`, at 1440 px and 375 px. Save them in `docs/screenshots/demo-fixes/`. Look at each one. Any English left inside an Arabic card, except the CPIC quote, gene/allele names and citations, is a failure.
- Run `node design/build-tokens.mjs` and check `design/ANTI-SLOP.md` (fewer than two ticks).
- Commit per fix: `DEMO-FIX-1: …` through `DEMO-FIX-4: …`, keeping `handoff/DEMO-FIXES.md` updated per AGENTS.md §3. Push the branch and open a PR titled "Demo fixes: Arabic CDS card, patient banner, demo-006 scenario, remove unverified compare figures".
- Finish with a summary: what changed per fix, test output, screenshot paths, and anything you could not do.
