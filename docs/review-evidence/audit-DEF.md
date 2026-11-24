# Audit D/E/F: Meyar, branch review/final-2026-11-24 (HEAD 061eff6), 2026-11-24

I made no changes to the repo. `node design/build-tokens.mjs` rewrote `design/tokens.css` with identical bytes, so `git status` shows no diff there. The working tree already had uncommitted changes before this audit, and they are not mine: `engine/data/in/demo-00{1..6}.origin.json` are modified and `engine/data/in/*.vcf.bgz(.csi)` are untracked. HAPI (8080) and CDS (3000) containers were already up. The host runs Node v24.18.0, not the pinned 22.

## Commands run
- `npm --prefix kit test` gave **32 tests, 32 pass, 0 fail, 0 skipped**, including the HAPI integration test (HAPI was up).
- `node design/build-tokens.mjs` gave 62/62 contrast pairs pass and wrote `design/tokens.css` with no diff (exit 0).
- `node design/build-tokens.mjs --check` gave 62/62 pass (exit 0).
- `uv run --no-project --python 3.12 --with pillow python design/imagery/build_webp.py --check` printed only "No renders in design/imagery/raw" (`raw/` is empty). **This command does not check the WebP files at all.** My own decode script (`scratchpad/webpcheck.py`) is the evidence used below.
- I used ffprobe/ffmpeg to sample frames from all 3 MP4s and tiled them for inspection: `scratchpad/f2tile_01.jpg`, `f3tile.jpg`, `f3btile.jpg`, `f3end.png`.

---

## Per-task Done-when

### D1 Poster: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| design palette/fonts/Qatt; ANTI-SLOP <2 | not built | No poster PDF anywhere (`find -iname "*poster*.pdf"` returns nothing). `docs/poster/` holds only the F4 tier panel. |
| PDF <10 MB | not built | no PDF |
| numbers traceable | not built | — |
| no unsourced number / DANGEROUS / dosing | not built | — |
| handoff/D1.md DONE | fail | no `handoff/D1.md` |
| CHANGES `## D1` | fail | no entry (`grep "^## D" CHANGES.md` finds nothing) |

### D2 Architecture diagram: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| design system | not built | — |
| SVG+PNG in docs/poster matching README flow | not built | no `*architect*` file; `docs/poster/` holds only f4-* files |
| no unsourced number… | not built | — |
| handoff/D2.md | fail | missing |
| CHANGES `## D2` | fail | missing |

### D3 Demo video: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| MP4 <100 MB | not built | The only MP4s are the F2/F3 hardware clips in `hardware/blender/renders/`. There is no full demo video. `docs/demo/SCRIPT.md` is a script only. |
| no unsourced number… | not built | — |
| handoff/D3.md | fail | missing |
| CHANGES `## D3` | fail | missing |

### D4 Brief Description: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| docs/brief-description.md AR+EN | not built | `ls docs/brief-description.md`: no such file |
| no unsourced number… | not built | — |
| handoff/D4.md | fail | missing |
| CHANGES `## D4` | fail | missing |

### D5 Submit form: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| docs/submission-checklist.md ticked | not built | no such file |
| others | fail | no handoff, no CHANGES entry |

### E1 Pitch script: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| docs/pitch/script-ar.md + script-en.md <4:00 | not built | `docs/pitch/` does not exist |
| others | fail | no `handoff/E1.md`, no CHANGES entry |

### E2 Clinical Q&A: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| docs/pitch/qa.md | not built | no `docs/pitch/`. `docs/demo/SCRIPT.md:31` has a small Q&A table, but that is not the deliverable. |
| others | fail | no handoff, no CHANGES entry |

### E3 Rehearsal plan: NOT BUILT
| Box | Result | Evidence |
|---|---|---|
| docs/pitch/rehearsal.md with both run times | not built | missing |
| others | fail | no handoff, no CHANGES entry |

### F1 Blender static renders
| Box | Result | Evidence |
|---|---|---|
| renders/*.png, three, each labelled | pass | Inspected by eye. `meyar-t1-saliva-kit.png` reads "Kit design — software working" (the caption says the physical kit is a design). `meyar-t3-single-gene-cathlab-unit-concept.png` and `meyar-t4-multi-gene-reader-concept.png` both read **"Concept render — not built"**, and the T3/T4 device screens also say "Concept · not built". T4 shows CYP2D6 as "Not assessed — copy number". There are 2 extra PNGs (`meyar-f3-intact/tampered-kit-software.png`), both labelled "Kit design — software working". |
| no unsourced number / DANGEROUS / dosing | pass | The renders contain no numbers beyond the mock kit ID MYR-DEMO-0001. |
| handoff/F1.md DONE | pass (status) / **fail (hash)** | `Status: DONE`. "Last commit: see `git log -1`" is not a hash. The last commit touching the file is 4b2bedd. |
| CHANGES `## F1` | pass | CHANGES.md:35 |

### F2 Blender animation
| Box | Result | Evidence |
|---|---|---|
| renders/*.mp4 <50 MB | pass | f2 turntable: 3.4 MB, 13.5 s. f3 chain-of-custody: 12.2 MB, 57 s. f3 scans-live: 2.8 MB, 15 s. |
| every frame labelled | pass with 2 minor notes | Frames tiled at 2 fps (f2), 1/3 fps (f3 57 s) and 1 fps (f3 15 s). Every product frame has its chip. **(a)** In the f2 crossfade around 5.5–6.0 s, the "Kit design — software working" and "Concept render — not built" chips overlap and neither is readable while the T3 device fades in (frame 12 of `meyar-f2-contact-sheet.jpg`). **(b)** The f3 57 s end card (around 56.5 s) has no status chip; it shows a faded phone with the text "research prototype, demo data". |
| no unsourced number… | pass | — |
| handoff/F2.md DONE | pass / **fail (hash)** | "Last commit: see `git log -1`". Real last commit is 2b2bf81. |
| CHANGES `## F2` | pass | CHANGES.md:72 |

### F3 Chain-of-custody kit software (merged: yes)
| Box | Result | Evidence |
|---|---|---|
| built from design/, build-tokens passes, ANTI-SLOP <2, 375/1440 AR/EN screenshots | pass (1 minor) | build-tokens: 62/62 pass. `kit/docs/screenshots/kit-{ar,en}-{375,1440}.png` plus the tampered variants exist. The only hard-coded colour is `kit/web/f6.css:70` `.m-body{background:#fff}` (print only). |
| six events give a valid chain; an edit makes verify fail | pass | Kit tests pass, including "API: six scans, verify, tamper fails verify, restore passes" and "editing a Provenance element in FHIR breaks verify". Note: the prompt says kit "K-0001", the code uses `MYR-DEMO-0001`. |
| no unsourced number… | pass | — |
| handoff/F3.md DONE | pass / **fail (hash)** | "Last commit: see `git log`". The handoff still says "27 pass" (line 48). |
| CHANGES `## F3` | pass | CHANGES.md:102. The "F3 video — six scans live" section is duplicated (CHANGES.md:119 and :219). |

- **Merged:** `git merge-base --is-ancestor 3a6f5b7 origin/main` is true, and so is the same check for F6 commit d015190.
- **Pages** (`kit/web/`):
  - `index.html` (timeline, served at `/`)
  - `tracker.html` (`/tracker`)
  - `urgent.html` (`/urgent`, T3)
  - `card.html` (`/card`)
  - The offline reader `docs/demo/reader/index.html` is served by the kit at `/reader/`.
- **Serve:** `cd kit && npm start` serves on **port 5174** (`KIT_PORT`; `kit/server.js:287`). It needs `docker compose up -d hapi` for FHIR; without it, it falls back to the local ledger.

### F4 Hardware tier panel
| Box | Result | Evidence |
|---|---|---|
| design palette/fonts/Qatt; ANTI-SLOP <2 | pass (no recorded evidence) | Inspected the PNG: Qatt band top and bottom; fonts are Alexandria, Plex Arabic and Plex Mono, embedded through `@font-face`. My ANTI-SLOP count is about 1 tick: the 4 identical "software spine" blocks. `handoff/F4.md` records no build-tokens or ANTI-SLOP evidence. |
| SVG+PNG in docs/poster | pass | `f4-tier-panel-{poster,slide}{,-ar}.{svg,png}`; poster 3200×4000, slide 1920×1080 |
| no unsourced number… | pass | All 7 footnoted figures have rows in `docs/sources.md` (see the poster section below). |
| handoff/F4.md DONE | pass / **fail (hash)** | It has no "Last commit" line. Real last commit is 632e6bd. |
| CHANGES `## F4` | pass | CHANGES.md:127. The header has no date, unlike the other entries. |

### F5 Cath-lab roadmap note
| Box | Result | Evidence |
|---|---|---|
| docs/roadmap-cathlab.md | pass | Has the "Concept render — not built" label, the T3 render, K220026, RAPID GENE, TAILOR-PCI marked as not significant, and SFDA described as a "future deployment step". |
| no unsourced number… | pass | Every figure maps to rows in sources.md (lines 12–13, K220026, "about 1 hour"). |
| handoff/F5.md DONE | pass / **fail (hash)** | No commit line. Real last commit is f5008b9. |
| CHANGES `## F5` | pass | CHANGES.md:215 |

### F6 End-to-end staircase demo
| Box | Result | Evidence |
|---|---|---|
| run_e2e.sh on clean compose prints custody, card, QR size | could not check | Not run because it executes `docker compose up -d --build` and resets the kit ledgers, which this read-only audit avoids. The handoff claims it was run (F6.md:20). `docs/demo/out/qr-meta.json` exists. |
| airplane-mode scan on a second device + tampered rejection | partial | Only a Playwright offline context was used, not a real second device (F6.md:21, :29). Screenshots exist: `reader-offline-*`, plus `reader-tampered-rejected-ar-375.png` and `-en-1440.png` (only 2 of the 4 viewport/language combinations). |
| failed-QC branch issues no result | pass | kit test "failed QC: … no result, no hand-off, never reaches Passport" passes |
| T3 roadmap label; T4 nowhere working | pass | `docs/demo/screenshots/urgent-t3-en-1440.png` shows "Roadmap — concept render, not built" and the footer "T3 and T4 are not built". T4 appears only in the renders, the poster and docs, always as a concept. |
| design palette/fonts; ANTI-SLOP; 375/1440 AR/EN | pass | 28 screenshots in `docs/demo/screenshots/`; build-tokens 62/62 |
| no unsourced number; mock + Demo data label | pass | The urgent screen shows "Demo data" chips. |
| handoff DONE + CHANGES | pass / **fail (hash)** | No commit line, and the branch note "F3 PR 13 not yet on main" is stale. CHANGES.md:223 |

---

## Hardware labelling (F1/F2/hardware)
- All 5 PNGs carry their chip. T3 and T4 read "Concept render — not built" both on the chip and on the device screen. T1 reads "Kit design — software working", with a caption saying the physical kit is a design and not manufactured.
- Videos: every product frame I sampled carries its chip. Exceptions are the f2 crossfade (overlapping chips, about 0.5 s) and the f3 57 s end card (no chip).
- TAILOR-PCI is cited in:
  - `docs/sources.md:13`
  - `docs/roadmap-cathlab.md:9,12`
  - `kit/web/urgent.js:16,29`, shown on the T3 screen
  - `docs/demo/SCRIPT.md:20`
  - `docs/research/03,04`
- TAILOR-PCI is **not** cited in `hardware/README.md`, `hardware/blender/README.md`, the T3 render caption or the F4 panel. Minor: AGENTS §8 says "cite ourselves", and the panel's T3 card could carry it.

## F4 poster / panel text
- **No Saudi-data sentence exists** in any f4 SVG, and no D1 poster exists. The only Saudi line is "In Saudi Arabia: KFSHRC, 1,500+ patients tested" (fn 5).
- `_coverageStatement` (tables/saudi_frequencies.json) reads: "Saudi allele frequencies for Tier 1 genes (CYP2C9, …, NUDT15) come directly from Goljan et al. (PLoS ONE 2022;17(1):e0263137, Table 1), representing 11,889 unrelated Saudi nationals (9,961 exomes and 1,928 PGx panels) sequenced in the Saudi Human Genome Program (2015-2019). Genes without published Saudi allele frequencies (Tier 2, such as SLCO1B1) return null…".
  - The figure 2015-2019 has no sources.md row. The Goljan row covers 11,889, 9,961 and 1,928 but not the years.
- **Mandatory lines on the panel:**
  - It reads "Research prototype, not for clinical use." with a comma. The exact em-dash line is absent.
  - "Runs on synthetic and GeT-RM reference data; no patient data was used." is **absent** from all 4 SVGs.
- **Numbers and their sources.md rows:**
  - 8 months, 4,110, 4.4×, OR 4.39, £44–£139, £100–£125, 12-gene, 7 days, 6,944, 7 European countries, 1,500+, about 1 hour, 21.0%, 27.7%, 30%: each has a row.
  - "No cleared multi-gene device" has a row (cited to a Meyar research note).
  - **No number in the panel lacks a row.**
- PREPARE wording: the panel says "30% lower odds", while the review prompt's approved wording is "about 30% lower odds" (minor).

## design/imagery
Every image decodes in all three sizes; there are no missing files. Sizes are width × height.

| ID | base | -640 | -1920 | Intended slot (PROMPTS.md) | Subject | Referenced in repo |
|---|---|---|---|---|---|---|
| img-01 | 1280×720 | 640×360 | 1920×1080 | doctor web page header bg; deck cover | terraced Aseer village at first light | none |
| img-02 | 1280×800 | 640×400 | 1920×1200 | Passport section header | older woman reading phone by window | showcase/index.html:203 |
| img-03 | 1280×960 | 640×480 | 1920×1440 | patient journey strip; poster "how it works" | pharmacist hands pass medicine bag | none |
| img-04 | 1280×960 | 640×480 | 1920×1440 | saliva kit section | saliva tube + sealed mailer on granite | showcase:492 |
| img-05 | 1280×800 | 640×400 | 1920×1200 | prescriber section header; doctor web page | clinician hands, tablet, pen | showcase:359 |
| img-06 | 1280×853 | 640×427 | 1920×1280 | printable card section; poster | card on majlis table, dallah, dates | showcase:347 |
| img-07 | 1280×427 | 640×213 | 1920×640 | footer band; poster bottom; deck dividers | Aseer juniper escarpment at dawn | showcase:557 |
| img-08 | 1280×1280 | 640×640 | 1920×1920 | poster texture; social square; deck accent | Al-Qatt Al-Asiri wall detail | none |
| img-09 | 1280×1280 | 640×640 | 1920×1920 | "Meyar = standard measure" block; About; social | brass apothecary weights on linen | none |
| img-10 | 1280×1600 | 640×800 | **1792×2240** | elder mode explanation; About | grandson helps grandfather with phone | none |
| img-11 | 1280×853 | 640×427 | 1920×1280 | "how a result is made"; deck | gloved hand loads 96-well plate | none |
| img-12 | 1280×720 | 640×360 | 1920×1080 | doctor page background band; deck "problem" | daylit hospital corridor | none |
| img-13 | 1280×720 | 640×360 | 1920×1080 | dashboard empty state; deck bg | pharmacy shelves, soft focus | none |
| img-14 | 1280×960 | 640×480 | 1920×1440 | Passport "show a doctor/pharmacist" step; poster | card held to pharmacy scanner | none |
| img-15 | 1280×1600 | 640×800 | **1792×2240** | showcase hero; poster top half | capsule on brass balance | showcase:180 |

- img-10 and img-15 are named "-1920" but are 1792 px wide. The manifest agrees with the files, but the filename does not match the width.
- Repo-wide grep for `img-NN|IMG-NN` outside `design/imagery/` finds only `design/showcase/index.html` (6 images), plus mentions in `prompts/REVIEW-opus-5.5.md` and `handoff/REVIEW.md`. Passport, kit, cds and the poster use none.

## design/ANTI-SLOP.md: pre-merge checklist
A screen fails at 2 ticks or more and needs a redesign at 3 or more. The 11 checklist items:
1. A font other than the four Meyar families appears.
2. A purple, indigo or neon colour, a gradient on text, or a glow appears.
3. Three or more sibling blocks are identical in size, icon and structure.
4. A status is shown by colour alone, or the patient side shows a tick or the word "safe".
5. Something animates on load other than the one orchestrated moment, or anything bounces.
6. A number appears without a docs/sources.md row or a Demo data label.
7. A modal interrupts the prescriber.
8. Arabic text is letter-spaced, or genotype data reorders inside Arabic (missing `.m-data`).
9. A tap target is under 48 px.
10. A button says OK, Submit, Learn more or Click here.
11. A hard-coded colour appears in a component instead of a token.

## Killed-claims grep
I grepped code, docs, UI strings, the poster SVGs and the `passport/dist` bundle. All hits are correct negations or rule text. **There are 0 violations.**

| Claim | Hits | Verdict |
|---|---|---|
| frequency tie-break / re-pick | AGENTS.md:44,54,60; README.md:44; engine/coverage.py:12; engine/tests/test_coverage.py:235; cds/test/cds.test.js:170,580; docs/research/04-dont-claim.md:8; CHANGES.md:55; handoff/A5.md:34; old REVIEW docs | all negations |
| "Indeterminate" = phase ambiguity | AGENTS.md:54; docs/research/04-dont-claim.md:9 (KFSHRC's own usage, stated correctly) | negations. The passport bundle uses Indeterminate only as a CPIC phenotype key. |
| G6PD premarital | AGENTS.md:59; docs/research/04-dont-claim.md:4,10 | negations. No G6PD in any UI except PharmCAT output (`engine/data/out`). |
| sickle cell actionable | AGENTS.md:59; docs/research/04-dont-claim.md:5 | negation |
| co-trimoxazole high risk | AGENTS.md:59; docs/research/04-dont-claim.md:6 | negation ("low-to-no risk") |
| 25% G6PD = Aseer | AGENTS.md:59; docs/research/02-saudi-genetics.md:24; 04-dont-claim.md:7 | correct ("Al-Ahsa, not Aseer"). Note: 02:24 cites 48,889 children / 33.8% / 29 drugs, which may lack sources.md rows (out of scope for this sweep). |
| "safe" on patient side | passport/src/i18n/ar.json:9 (authoring note), passport/src/otc.js:147 (comment), kit/web/tracker.js:1 (comment) | negations. Arabic «سليمة» appears only in kit/web/app.js:24,28 (clinician side, "chain intact"). |
| medication-prescribe | AGENTS.md:28; cds/README.md:11; cds/server.js:56 (reject guard); cds/test/cds.test.js:288,592,596; docs/research/05:10; CHANGES.md:89; handoff B2/B3/B5/B6 | all prohibitions or guards |

`docs/research/07-synthesis-and-verdict-v1.md` **does not exist in the repo**, so there is nothing to mark deprecated here. It lives only in the team's project files.

## Mandatory lines
| Deliverable | L1 "Research prototype — not for clinical use." | L2 "Runs on synthetic and GeT-RM reference data; no patient data was used." |
|---|---|---|
| README.md | yes (line 7) | yes (line 7) |
| cds/README.md | yes | yes |
| design/showcase/index.html | yes | yes |
| passport UI (src/i18n/en.json:99,235,239) | yes, without the final period | **no** |
| cds pages (lib/preview.js:15, dashboard.js:289, compare.js:20, cards.js) | yes, without the final period | **no** |
| kit web (app/card/tracker/urgent.js) + kit/README | yes | **no** |
| docs/demo reader + SCRIPT | yes | **no** |
| F4 poster/panel SVG | comma variant only | **no** |
| hardware renders | yes on T3 (caption); T1/T4 use "concept"/"design" wording | no |
| docs/roadmap-cathlab.md | comma variant | no |
| D1 poster, slides/deck, passport doc | not built | not built |

## Ports and versions vs README table
- The README table matches AGENTS §4 and the code: HAPI 8080 (`docker-compose.yml:5`), CDS 3000 (`docker-compose.yml:11`, `cds/Dockerfile` uses `node:22-alpine`), sandbox 8081 (comment only, `docker-compose.yml:24`), passport 5173 (`passport/package.json:7,9`, `vite.config:9`). Pinned PharmCAT 3.4.0, HAPI v8.12.0-2 and bcftools 1.24 have no conflicting mentions.
- **Mismatches:**
  1. **Kit port 5174** is not in the README table or AGENTS §4. Locations: `kit/server.js:2,287`, `kit/README.md:19`, `docs/demo/run_e2e.sh:8`, `docs/demo/README.md:5,8`, `docs/demo/SCRIPT.md:6-9`, `CHANGES.md:105`, `hardware/blender/art/make_f3_art.py:5,21`. `handoff/F3.md:67` itself calls it "new".
  2. Node 24 on the host: `CHANGES.md:98` and this audit (v24.18.0). The pin is 22.
  3. Python 3.11 was used in `docs/REVIEW-A3-2026-11-21.md:41`; the pin is 3.12.
  4. `localhost:9876` in `handoff/F1.md:33` and `F2.md:26` (a temporary preview server; harmless).

## docs/* checks
- **SFDA/PDPL/NPHIES:** nothing treats them as a blocker or as approved.
  - Correct "future deployment step" framing in `cds/README.md:83`, `kit/README.md:67`, `passport/README.md:23`, `docs/qr-envelope.md:46`, `docs/roadmap-cathlab.md:9` and `docs/demo/SCRIPT.md:31`.
  - `docs/research/05-tech-constraints.md:20` says MDS-G010 "requires … local validation". Review item 27 wants "should". This is minor and not a blocker.
- **README run snippet** (`README.md:75-77`):
  - `docker run … /pharmcat/data/in/demo-001.vcf` fails on a clean clone. The `.vcf` is not committed (`git ls-files engine/data/in` shows only origin/outside files); it is created by `python engine/gen_vcf.py --all`.
  - The snippet also bypasses the A6/A8 gates and the outside-call path that `engine/run_pipeline.sh` / `run_pharmcat.sh:36-56` use.
- **README layout:**
  - "docs/ … poster, pitch": **`docs/pitch/` does not exist**.
  - Every other listed dir exists. `docs/demo/`, `docs/screenshots/` and `CHANGES.md` are unlisted (fine).
  - The architecture box says "Medication Passport [C1–C8]", but C9 exists.

## Test counts quoted in docs
Reproduced counts: passport 41, cds 39, kit 32.

| Count | Where | Refers to | Verdict |
|---|---|---|---|
| 26/26 | CHANGES.md:98; handoff/B2.md:13 | cds (B2) | stale vs 39 |
| 14 | handoff/B2.md:21 | cds | stale |
| 18/18 | CHANGES.md:116; handoff/B3.md:14 | cds (B3) | stale |
| 31 | CHANGES.md:173; handoff/B4.md:14 | cds (B4) | stale |
| 32 | handoff/B5.md:11 | cds (B5) | stale |
| 37 | CHANGES.md:233; handoff/B6.md:14; docs/REVIEW-B6-PR16.md:20 | cds | stale |
| 39 | CHANGES.md:236; handoff/B6.md:37 | cds | **matches** |
| 16/16 | CHANGES.md:204; handoff/C8.md:9 | passport | stale |
| 28/28 | CHANGES.md:249; handoff/C6.md:13 | passport | stale |
| 32 | CHANGES.md:261; handoff/C7.md:10 | passport | stale |
| 34/34 | handoff/C9.md:9 | passport | stale |
| 38 | docs/REVIEW.md:18 | passport | stale |
| 41 | docs/REVIEW.md:65 | passport | **matches** |
| 3/3, 5/5, 5/5, 8/8, 11 | CHANGES.md:166,184,196,150,203; handoff/C2-C5 | passport subsets | per-task subsets |
| 27 | **kit/README.md:39**; handoff/F3.md:48 | kit | stale vs 32 |
| 31 pass + 1 skipped | handoff/F6.md:15 | kit | stale |
| 32 | CHANGES.md:212 (B5 cds), CHANGES.md:227 (kit) | kit / cds | kit matches; the cds 32 is stale |
| 34 / 37 passed | docs/REVIEW-A5-A7-A8:14,16,51 | engine pytest | not reproduced here |
| 7, 12, 14, 19 | handoff/A5:14, A7:15-16, A8:15, A6:11 | engine | not reproduced here |

## Handoffs D/E/F
- D1–D5 and E1–E3: no handoff files.
- F1–F6 are all `Status: DONE`, but **none records a real commit hash**. F1–F3 say "Last commit: see git log" and F4–F6 have no commit field. The actual last commits are F1 4b2bedd, F2 2b2bf81, F3 62eb010, F4 632e6bd, F5 f5008b9 and F6 1d520c7, all on this branch.

---

## Findings (ranked)

### Blocks submission
1. **D1–D5 and E1–E3 are NOT BUILT.** There is no handoff, CHANGES entry or deliverable for any of them.
   - Missing: poster PDF, architecture SVG/PNG, demo MP4, `docs/brief-description.md`, `docs/submission-checklist.md`, and `docs/pitch/{script-ar,script-en,qa,rehearsal}.md`.
   - Fix: build at least D1 (poster PDF), D3 (video), D4 (brief) and D5 (submission checklist) before the 25 Nov deadline. E1–E3 are needed for the pitch.

### Wrong in front of a judge
2. **The second mandatory line is missing from every judge-facing UI**: Passport (`passport/src/i18n/en.json:99`), cds pages (`cds/lib/preview.js:15`, `dashboard.js:289`, `compare.js:20`), kit pages and the F4 panel (`docs/poster/build_f4.py:56`). Fix: append "Runs on synthetic and GeT-RM reference data; no patient data was used." next to each existing L1 string. The panel also needs the exact em-dash form of L1.
3. **The poster has no Saudi-data sentence matching `_coverageStatement`**, because D1 is not built. When D1 is built, quote `tables/saudi_frequencies.json` `_coverageStatement` verbatim. Also add a sources row for its "2015-2019", or remove that figure.
4. **`README.md:77` run snippet fails on a clean clone** (`demo-001.vcf` is not committed) and skips the A6/A8 gates. Fix: replace it with `python engine/gen_vcf.py --all && bash engine/run_pipeline.sh`.
5. **Image library unused outside the showcase.** 9 of 15 images (01, 03, 08–14) appear nowhere, and passport, kit, cds and poster use none. `build_webp.py --check` gives no evidence because `raw/` is empty, so it never checks the WebP files. Fix: place them per PROMPTS.md slots (see the table) and make `--check` verify the outputs.
6. **`README.md:65` layout lists "pitch" under docs/**, but `docs/pitch/` does not exist. The README architecture also says Passport [C1–C8], though C9 exists. Fix: edit the README.
7. **Kit port 5174 is not in the pinned port table** (README:57-65, AGENTS §4), even though the demo script depends on it. Fix: add a "Kit service | Node 22 | 5174" row to the README. Changing AGENTS is a team decision.

### Minor
8. No F handoff has a real "Last commit" hash (handoff/F1.md:5, F2.md:5, F3.md:5; F4–F6 have none). F6.md:4 still says F3 is "not yet on main". Fix: write the real hashes listed above.
9. Stale test counts: kit/README.md:39 says "27 tests" (actual 32), and handoff/F3.md:48 and F6.md:15 are also stale. The cds and passport counts in CHANGES/handoffs/REVIEW are listed in the table above. Fix: quote only the reproduced counts (passport 41, cds 39, kit 32).
10. In the F2 video crossfade (about 5.5–6.0 s), the T1 and T3 chips overlap and the T3 device appears with no readable label. The F3 57 s end card has no status chip. Fix: hard-cut the chip at the crossfade midpoint, and add "Kit design — software working" to the end card.
11. TAILOR-PCI is not cited on the F4 panel's T3 card or in the hardware READMEs. Fix: add the footnote row that already exists in sources.md.
12. The F4 panel says "30% lower odds". Review guidance is "about 30% lower odds". Fix: change `build_f4.py` and rebuild.
13. `handoff/F4.md` has no build-tokens or ANTI-SLOP evidence, and the CHANGES `## F4` header has no date. CHANGES.md:119 and :219 duplicate the "F3 video — six scans live" section.
14. `kit/web/f6.css:70` has a hard-coded `#fff` (print only). Use the paper token.
15. img-10 and img-15 "-1920" files are 1792 px wide. Rename them or note this in the manifest.
16. F6's airplane-mode scan was a Playwright offline context, not a second device. The tampered-rejection screenshots exist only for ar-375 and en-1440. Fix: record a phone clip, or state the limitation in the handoff.
17. F3 prompt says kit "K-0001"; the code uses "MYR-DEMO-0001". Note this in the handoff.
18. `docs/research/05-tech-constraints.md:20` "requires local validation" should be "should" (Part C item 27).
19. Host Node is 24 (CHANGES.md:98 and this audit) against the pin of 22. Python 3.11 is noted in docs/REVIEW-A3:41.
