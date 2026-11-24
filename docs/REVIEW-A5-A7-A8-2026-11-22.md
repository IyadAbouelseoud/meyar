# Review — A5 (PR #9), A8 (PR #10), A7 (PR #11), plus PR #8 conflicts

Run: 2026-11-22, Claude Code, Opus 5.5, `prompts/REVIEW-opus-5.5.md`, scoped at the user's request to tasks A5, A8 and A7. Other tasks were not re-audited in this run. The previous A3 review is kept at `docs/REVIEW-A3-2026-11-21.md`.

The user asked for these PRs to be merged once verified, so this run departs from the prompt's "read and run only" rule in five places: one fix commit on A7, conflict-only merge commits on PRs #9, #10, #11 and #8, and the three merges. Every edit is listed in section 5.

## 1. Verdict
**Ready with fixes. Merged.** All Done-when boxes for A5, A8 and A7 are proven. The PRs passed on their own branches but broke when combined: A7 wrote the string `"None"` for A8 not-assessed genes, and its test rejected A5/A8 nullable fields. That was fixed (commit `124a32b`) before merging. The remaining findings are minor or "wrong in front of a judge", and none blocks submission.

## 2. Task table

| Task | Status | Evidence |
|---|---|---|
| A5 | pass | Fresh run on merged `main` (`be1a8cd`): `gen_vcf.py --all` → `run_pharmcat.sh` (6 patients) → `load_fhir.py --all --dry-run` → `coverage.py --all`; `pytest engine/tests` → **34 passed**. demo-006: CYP2C9 86/88, `['*2','*3']`, risk 0.187; CYP2C19 32/35, risk 0.001. |
| A8 | pass | `sv_gate.py --all`: demo-001/003/004/005 CYP2D6 `not-assessed`, diplotype/phenotype `null`; demo-002 `outside-call` `*1/*1` NM; demo-006 `outside-call` `*1/*2x2` **Ultrarapid**. `test_sv_gate.py` passes. |
| A7 | pass (after fix) | `phenoconvert.py --all`: demo-002 `CYP2D6: Normal Metabolizer -> Poor Metabolizer (paroxetine)`; demo-003 CYP2C19 flagged (fluvoxamine), no score. 20/20 A7 tests and 34/34 integrated tests pass. |
| Others | could not check | Out of scope for this run. |

### A5 "Done when"
- [x] `pytest engine/tests/test_coverage.py` passes (it needs the pipeline outputs first; see finding 6).
- [x] Every gene in every demo contract has a `coverage` object, and all 9 contracts and fixtures validate against `docs/data-contract.schema.json` (jsonschema).
- [x] No code path changes a diplotype from frequency. `coverage.py:196-218` (`enrich_contract`) writes only `gene_entry["coverage"]`. The test `test_never_repicks_diplotype_or_candidates_getrm_tie` passes.
- [x] All 23 rows in `tables/saudi_frequencies.json` carry `saudiDataTier` and a `source` with `n` and `table`. Tier 1 is the 8 Goljan genes only, and no non-Saudi figure appears (checked with a script).
- [x] Tier 2 returns `null` with "No published Saudi frequency for this gene" (`coverage.py:115-123`, tested). CYP2D6 is Tier 0 with `null` (`coverage.py:99-108`, tested).
- [x] `_cautions` records the CYP3A5*3 84.5% (Table 1) vs 84.7% (text) choice and leaves out the rare-variant count.
- [x] Handoff DONE; `## A5` in CHANGES.md.

### A8 "Done when"
- [x] VCF-only patient → `not-assessed`, `phenotype: null` (test plus live run).
- [x] Mock outside call → `outside-call`, `svAssessed: true`, Ultrarapid from `*1/*2x2` (demo-006). PharmCAT confirms `callSource: OUTSIDE`.
- [x] `grep -rn "Normal Metabolizer" engine/` finds only a test assertion (`test_sv_gate.py:165`, demo-002 outside call) and A3 validation prose. No code path assigns it to an SV gene.
- [x] Both `.outside.tsv` files carry `# mock: true` and `# source: Mock CNV-aware caller v0.1-demo …`.
- [x] No DANGEROUS flag. `run_pharmcat.sh` uses `pharmcat_pipeline -matcher`, then `pharmcat.jar -phenotyper -reporter -pi … -po …`, and the tests assert the flags are absent.
- [x] `docs/structural-variants.md` quotes PharmCAT and Goljan verbatim and says plainly that no CNV-aware caller is run. The display rule for B3/B6/C1/C9 is in `docs/requests.md:13-15`.

### A7 "Done when"
- [x] A7 tests pass: 19 originally, 20 with the new regression test.
- [x] demo-002: `phenotype` Normal Metabolizer stays unchanged; `effectivePhenotype` Poor Metabolizer, cause paroxetine, `×0`, method "Thomas et al. 2020".
- [x] All 30 inhibitor rows have an fda.gov source and `accessed: 2026-11-22`. **Checked against the live FDA page** (content current as of 05/29/2026): every strength matches, cimetidine included.
- [x] `CYP2D6_ALLELE_ACTIVITY_VALUES` (95 entries) were **checked against the live CPIC API** (`api.cpicpgx.org/v1/allele?genesymbol=eq.CYP2D6`) with 0 mismatches. The thresholds (PM 0; IM <1.25; NM ≤2.25; UM >2.25) match Caudle 2020.
- [x] Outputs validate against the schema. No LLM call (grep for openai/anthropic/llm/gpt returns nothing).
- [x] Handoff DONE; `## A7` in CHANGES.md; 3 rows appended to `docs/sources.md`.

## 3. Findings (ranked)

### Blocks submission — fixed in this run
1. **`engine/phenoconvert.py:314,364` (before the fix): A8 not-assessed genes got `effectivePhenotype: "None"`.** `str(None)` turned the null genetic phenotype into the literal word "None". On integrated `main` this hit CYP2D6 for demo-001/003/004/005, so the card and the Passport would have printed "Acting like: None". **Fixed in `124a32b`**: a gene with `phenotype: null` gets no `effectivePhenotype` and `applied: false`. No contract change was needed, because the field is optional. Regression test: `test_not_assessed_sv_gene_gets_no_effective_phenotype`.
2. **`engine/tests/test_phenoconvert.py:66-79`: the hand-written schema check assumed pre-A5/A8 types** (non-null `uninformativeNormalRisk`, string `phenotype`, non-empty `candidates`). It failed once A5 and A8 were merged. **Fixed in `124a32b`**: it now accepts the nullable fields the schema allows.

### Wrong in front of a judge
> **Update 2026-11-22: findings 3, 4, 5 and 6 are FIXED on `main` in `cb478a2`.** A clean checkout running `bash engine/run_pipeline.sh` then `pytest engine/tests` gives **37 passed, 0 skipped**. VCF-derived VKORC1 and CYP3A5 (0 assayed) now get a `null` score. demo-006: Ultrarapid → acting like Normal (duloxetine, 3.0 × 0.5 = 1.5). `gen_vcf.py` keeps the A8 outside-call file. Tests that need pipeline outputs skip under a "NOT A FULL PASS" banner. Findings 7–9 remain open (minor).

3. **`engine/coverage.py:155` with `tables/saudi_frequencies.json` (VKORC1): 0 of 1 positions assayed, yet `uninformativeNormalRisk: 0.0`.** The PharmCAT VKORC1 position is rs9923231, and no Goljan Table 1 row lists that rsid, so nothing counts as untested. A "0" score for a gene that was never tested reads as reassurance. **Smallest fix:** in `compute_gene_coverage`, return `uninformativeNormalRisk: null` with the note "No defining position assayed" when `assayed == 0`, or when a missing position matches no table rsid.
4. **demo-004 takes duloxetine (moderate CYP2D6 inhibitor), but its CYP2D6 is not assessed**, so the demo never shows the ×0.5 path and the inhibitor is silently dropped (only logged). **Smallest fix:** give demo-004 a mock CYP2D6 outside call (e.g. `*1/*1`, which becomes IM), or move duloxetine to demo-006 (UM `*1/*2x2`, AS 3.0, which becomes 1.5 NM). Optionally show "may be affected by duloxetine" on not-assessed genes.

### Minor
5. **`engine/gen_vcf.py:426-429` (A1) overwrites the committed `engine/data/in/demo-006.outside.tsv`** and drops the caller version (`v0.1-demo`) that A8 requires. **Fix:** A1 should skip writing `.outside.tsv` when the file exists, or A8 should own its content (request via `docs/requests.md`).
6. **The engine tests depend on gitignored outputs** (`engine/data/out/*`, `engine/validation/data/*`). On a clean checkout, 4 A5 tests and 4 A8 tests fail with `FileNotFoundError` until the pipeline is run. **Fix:** document the order (`gen_vcf → run_pharmcat.sh → run_validation.py → load_fhir --dry-run → coverage → sv_gate → phenoconvert → pytest`) in `engine/README.md`, or skip with a clear reason when outputs are missing.
7. **`docs/sources.md` (A7 row) says "97 scored star alleles"** while `phenoconvert.py` holds 95. CPIC's `*1x≥3` and `*2x≥3` are missing, so `*1≥3` outside calls get no score (a safe failure). **Fix:** add the two entries and parse `≥N`, or change the row to 95.
8. **Pre-existing, not from these PRs: `docs/structural-variants.md:7` says "roughly a quarter of commonly prescribed medicines"** with no row in `docs/sources.md`. **Fix:** cite it or remove it.
9. **Tier 2 rows cite Goljan with `n: 11889` and `table: "Not in Table 1"`.** That is technically compliant, but it reads as if the study measured these genes. **Fix:** label the field `checkedAgainst` rather than `source`.

## 4. Cross-cutting checks (only those touching A5/A7/A8)

| # | Check | Result |
|---|---|---|
| 1 | Data contract | **pass**: 3 fixtures and 6 generated contracts validate on merged `main` |
| 2 | Killed claims | **pass**: grep of all three PR diffs finds only negative guards (DANGEROUS-flag tests) |
| 3 | Numbers sourced | **pass with notes**: findings 7, 8 |
| 4 | A5 integrity | **pass** |
| 5 | Safety (lookup only, no LLM, no DANGEROUS flag) | **pass** |
| 6 | A6 germline | not re-checked (A6 tests pass in the 34); phenoconvert also refuses non-germline (`phenoconvert.py:392`) |
| 13 | A7 phenoconversion | **pass** (after fix): genetic `phenotype` never overwritten; ×0.5/×0; FDA-cited rows; CYP2C19 flagged, never scored; demo-002 Normal → Poor (engine only; card/Passport not built yet) |
| 15 | A8 structural variation | **pass**: engine side; card/Passport display rule handed to B3/B6/C1/C9 in `docs/requests.md` |
| 16 | A5 Saudi tiers | **pass**: `_coverageStatement` present; poster not checked (not built) |
| 17 | Mock data | **pass**: all mock meds and outside-calls are marked mock |
| 7–12, 14, 18 | — | could not check: out of scope for this run, or the components (cds/, passport/, poster) are not in these PRs |

## 5. What this run changed
- `124a32b` on `a7/phenoconversion`: the A7 fix (findings 1–2).
- Merge commits bringing `origin/main` into `a5-coverage-flag`, `a8-sv-gate`, `a7/phenoconversion` and `claude/f2-blender-animation`. The conflicts were `CHANGES.md` (all sections kept, in merge order) and `docs/fixtures/demo-002.contract.json` (kept A8's `callability` and A7's `guidelineVersion: "CPIC 2021"`).
- Merged: PR #9 → `78e786e`, PR #10 (retargeted to `main`) → `823d2c0`, PR #11 → `be1a8cd`.
- PR #8 (F2): conflict resolved by this run; merged afterwards by the repo owner → `342e598`.
- `cb478a2` on `main`: fixes for findings 3–6 (see the update note in section 3).
- B1: a second, unmerged local B1 attempt (169 rows, different schema, no per-row source) conflicted with the merged B1 (`e60e874`, 128 rows). The owner chose to keep `main`'s version; the local attempt is preserved on branch `b1-local-attempt` and was not merged.
