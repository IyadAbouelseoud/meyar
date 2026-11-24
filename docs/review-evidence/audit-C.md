# Audit C — Passport tasks C1–C9 (read-only)

Repo `D:\meyar-main\meyar-main`, branch `review/final-2026-11-24` (HEAD 061eff6). I made no changes to the repo. I served `passport/dist` as committed, with `python -m http.server 5181`. A rebuild to the scratchpad `distbuild/` gave byte-identical asset names (`index-CZIgqkko.js`, `main-FkHSdRjF.js`, `scan-CYNbqTc0.js`, `index-3gEZf81e.css`), so dist matches src.
Tools: Playwright 1.65.1 (npx cache) driving `ms-playwright/chromium-1248/chrome-win64/chrome.exe`, and axe-core **4.14.0** from the local npx cache, not 4.10.2. The scripts are in the scratchpad (`func.cjs`, `offline.cjs`, `axe.cjs`, `qrmeasure.mjs`, `genqr.mjs`), with raw results in `func-results.json` and `axe-results.json`. The PDFs are `id1.pdf` and `a6.pdf`.

Global results:
- `npm --prefix passport test`: **41 pass / 0 fail** (3.1 s).
- `node design/build-tokens.mjs --check`: **62/62 contrast pairs pass**.

## Per-task Done-when

Boxes shared by every task (design/ANTI-SLOP, unsourced numbers, handoff, CHANGES):
| Box | Result | Evidence |
|---|---|---|
| Built from design/, no hard-coded colours/fonts | **fail (minor)** | Only three hex literals exist outside design/: `passport/src/qr.js:312` (`#FFFFFF`, `#14201B` in the QR SVG) and `qr.js:295` (comment). Every `font-family` in app.css uses `var(--m-font-*)`. No rgb()/hsl(). `style="` in src only sets `var(--...)`. |
| `node design/build-tokens.mjs` passes | pass | 62/62 pairs |
| ANTI-SLOP < 2 ticks, screenshots 375/1440 ar/en | could not check | This is a judgement call; it belongs to the later screenshot pass. |
| No DANGEROUS flag / no model dosing | pass | The passport has no LLM call. Every recommendation is a lookup in `tables/cpic_recommendations.json` (`lookup.js:66-97`). |
| handoff Status DONE + real last commit | **partial** | See the handoff table below. |
| CHANGES.md `## C<n>` entry | pass | Exactly one entry each for C1–C9. |

Handoffs (`git cat-file -t`):
| Task | Status | "Last commit" field | Real? | Latest commit touching the handoff |
|---|---|---|---|---|
| C1 | DONE | "none (no .git in workspace)" | no hash | 9eda524 |
| C2 | DONE | "pending" | no hash | 13d86e9 |
| C3 | DONE | "pending" | no hash | d4d8276 |
| C4 | DONE | 78f75ac | commit ✔ | — |
| C5 | DONE | c208daa | **fatal: Not a valid object name** | 3d9af11 |
| C6 | DONE | dda97bd | commit ✔ | — |
| C7 | DONE | "see `git log -1`" | no hash | 8b2d8d4 |
| C8 | DONE | "see `git log -1`" | no hash | bbc859a |
| C9 | DONE | 7edf010 | commit ✔ | — |

### C1 — patient screen
| Box | Result | Evidence |
|---|---|---|
| Runs on 5173, renders demo-001 ar RTL + en | pass on 5181 (dist), not on 5173 | demo-001 renders in ar and en with 2 gene cards. I did not run the dev server, to avoid colliding with 5173. `package.json` dev = `vite --port 5173 --strictPort`. |

### C2 — offline QR
| Box | Result | Evidence |
|---|---|---|
| QR for demo-001 decodes to the payload with the network disabled | pass | With `context.setOffline(true)` I issued a card with PIN 123456 on the doctor tab. jsQR read the on-screen SVG at 600 px as `{"v":1,"s":"zME8…","n":"zIFy…","c":"…"}`, i.e. JSON with no URL. "Verify" then showed `qr-decoded-output`. |
| QR encodes the payload, not a URL | pass | The QR text is the envelope JSON. `qrmeasure.mjs` shows `containsURL=false` for the QR text and for the decrypted payload. Payload keys are `v,o,g[,meds]`; gene keys are `gene,dip,phen,call,cov,gv,rec[,eff,pc]`. No name and no patientId. |
| Byte size reported, EC M | pass, but **the documented numbers are stale** | See the QR metrics table below. The docs give the demo-001 envelope as 360 B. That is the test run without `getDrugsFn`; the app actually issues **480 B**. |

**Measured QR metrics.** These use exactly what the app encodes: `applyPhenoconversion` plus `getDrugsForGene`, EC M, byte mode. Version = (modules − 17)/4. The 4-module quiet zone is not counted in "modules".
| Contract | raw | deflate | envelope | modules | QR version | EC | module @ 28 mm (incl. QZ) |
|---|---|---|---|---|---|---|---|
| demo-001 | 540 B | 294 B | 480 B | 85 | **17** | M | 0.301 mm |
| demo-001 + 120-char emergency line | 540 | 294 | 607 | 93 | 19 | M | 0.277 |
| demo-001 at MAX_CURRENT_MEDS = 4 + emergency | 828 | 387 | 731 | 105 | 22 | M | 0.248 |
| demo-002 | 462 | 277 | 457 | 85 | **17** | M | 0.301 |
| demo-002 + emergency | 462 | 277 | 584 | 93 | 19 | M | 0.277 |
| demo-002 at 4 meds + emergency | 596 | 307 | 624 | 93 | 19 | M | 0.277 |
| demo-006 | 800 | 350 | 554 | 89 | **18** | M | 0.289 |
| demo-006 + emergency | 800 | 350 | 681 | 101 | 21 | M | 0.257 |
| demo-006 at 4 meds + emergency | 1192 | 450 | 815 | 109 | **23** (worst case) | M | 0.239 |

No other demo contracts exist in the passport (see the cross-cutting section).

### C3 — scanner
| Box | Result | Evidence |
|---|---|---|
| Second device in airplane mode: scan demo-001 card + PIN shows the recommendation | pass (simulated); physical: could not check | Offline in scan.html, after pasting the envelope and entering 123456, demo-002 rendered `.m-cds` ("Genetic: Normal Metabolizer · Acting like: Poor Metabolizer because of paroxetine… codeine: Avoid codeine use…") and demo-001 rendered 2 cards. The image-upload path also works: an on-screen QR screenshot at DPR 2 or 3 gives the holder view, then the PIN gives 2 cards. At **DPR 1** (261 px, about 2.5 px/module) both jsQR and the upload fail. I could not test the camera in headless mode. **Offline caveat:** scan.html does **not** load offline unless it was opened once online after the service worker took control (finding F2). |
| Wrong PIN fails | pass | "Could not decrypt with this PIN — ask the patient and try again." After 3 misses: "Too many wrong PINs. Wait 29 s…". |
| `#e=<b64url>` fragment intake | pass | The holder view is shown and the hash is cleared (`location.hash === ""`). |
| v0 plaintext refused without `?dev=1` | pass | "Scanned text is not a valid Meyar QR envelope." |

### C4 — i18n
| Box | Result | Evidence |
|---|---|---|
| Every UI string comes from ar.json/en.json | **fail** | Hard-coded strings that show up in Arabic mode: `render.js:524` ("positions; untested", "none"), `render.js:525` ("Outside call"), `render.js:529,533,534` ("Not assessed"), `main.js:185-187` (inline ar/en load error), `render.js:708` (aria "Passport navigation"), `scan-render.js:91` (aria "… of 6 digits entered") and `:93` ("PIN keypad"), `scan-render.js:120-123,167-169` ("Not assessed — no result reported", "because of"), `scan-render.js:174` (the A8 blockquote sentence in English). |

### C5 — elder / a11y
| Box | Result | Evidence |
|---|---|---|
| axe: zero serious violations | pass | axe 4.14.0 with tags wcag2a/2aa/21a/21aa/22aa at 375×812 found **0 violations in all 40 runs** (20 views × ar/en; list below). Horizontal overflow was 0 in every run. "Incomplete" results (needs review) were not inspected. |
| 200% zoom at 375 loses no content | could not check | Not driven. |

### C6 — OTC
| Box | Result | Evidence |
|---|---|---|
| demo-001: omeprazole → Ask the pharmacist | pass | `data-otc-status="ask"`, "Based on CYP2C19 (Slow)… Lima JJ et al. 2020 (CPIC)". Arabic أوميبرازول and the typo "omeprazol" also return ask. |
| demo-001: paracetamol → No gene guidance | pass | status none: "No CPIC gene guideline applies… Normal label advice still applies." |
| Unknown product | pass | "xyzzy" returns "Not in our list — ask the pharmacist". |
| Works with network off | pass | The OTC lookup is bundled (`otc.js` plus imported tables) and makes no fetch. The offline page load itself depends on F2. |
| Never "safe" | pass | A regex `\bsafe(ly\|ty)?\b` over innerText of 54 view/lang/patient combinations found 0 hits. Arabic آمن: 0. |

### C7 — print card
| Box | Result | Evidence |
|---|---|---|
| CSS ID-1 85.60×53.98 mm | pass | `app.css:849-850` has `@page meyar-id1 { size: 85.60mm 53.98mm }` and `:908-909` has `inline-size: 85.60mm; block-size: 53.98mm`. Under print media the card box measured 85.60×53.98 mm and the QR 28.00 mm. On screen at 375 px it is scaled to 77.04×48.58 mm, which is expected. |
| Printed to PDF measures 85.60×53.98 | **partial** | Chromium `page.pdf(preferCSSPageSize)` gives MediaBox 242.88×153.12 pt = **85.68×54.02 mm** (one page), from Chromium's px rounding. This matches the C7 handoff's note. The A6 fold-out PDF is 298.08×420 pt = 105.16×148.17 mm. |
| QR scans from paper | could not check (physical) | Raster proxy: the 28 mm print QR rasterised at 300 dpi (334 px) and 600 dpi (669 px) decoded with jsQR for demo-006 (89 modules) and for the large variant (97 modules). |
| Card face content | pass | The face carries the wordmark, "Ask the holder for the PIN", the prototype line, the QR and the MRZ `MEYAR<<PGX<ENV<V1<<ISSUED<20261124`. No name or ID. |

### C8 — PIN envelope
| Box | Result | Evidence |
|---|---|---|
| Crypto equals docs/qr-envelope.md | pass | `qr.js:6-9` sets PBKDF2 600000, salt 16 B, nonce 12 B, tag 16 B. Lines 143-153 use PBKDF2/SHA-256 into AES-GCM 256, non-extractable. AAD is `meyar-e:`+line (164). The PIN rule is `^[0-9]{6}$` (`pinguard.js:14`) with Arabic-Indic digits normalised (`:17-22`). Envelope fields are restricted to v,s,n,c,e (`qr.js:192-204`). |
| Unit test: right PIN decrypts, wrong PIN fails | pass | Tests pass. Independently, `qrmeasure.mjs` shows a wrong PIN rejected with `OperationError` for all 9 variants. |
| Scan without PIN shows only the holder line | pass | Before the PIN, `innerHTML` does not match /CYP2C19\|CYP2D6\|Poor\|clopidogrel/. Only the holder line, the opted-in emergency line and the honesty line are shown. |
| Honest brute-force statement | pass in README, scan.html and docs; **weaker in the passport** | README.md:19 and qr-envelope.md "Limits" say it plainly. scan.html (en.json:258) shows "The PIN stops casual scanning only; a copied QR can be brute-forced offline." The passport PIN card (en.json:221) shows "A 6-digit PIN can be guessed on another device if the QR is copied…", without "stops casual scanning only". README.md:19 claims "The same sentence sits under the PIN pad in both apps", which is false. |

### C9 — meds and pharmacist
| Box | Result | Evidence |
|---|---|---|
| demo-002 shows "act like: slow, because of paroxetine" | pass | en: "Your genes: normal · Right now you act like: slow, because of paroxetine. Tell your doctor before starting tramadol, codeine." ar: "جيناتك: طبيعي · تعمل الآن مثل: بطيء، بسبب باروكسيتين." The scale has `is-converted` with data-g=2 (Normal) and data-a=0 (Slow). |
| Adding paroxetine for a CYP2D6-normal patient changes the card offline | pass | I injected demo-002 with no meds and no phenoconversion, then went offline and added paroxetine on the meds tab. The card changed from "usual pace… codeine: No gene guidance" to "act like: slow, because of paroxetine… codeine: Do not take without your doctor". localStorage `meyar:meds:demo-002` = `[{"name":"paroxetine","source":"patient-entered","mock":true}]`. On demo-006 (UM + duloxetine) adding paroxetine gave "act like: slow, because of duloxetine, paroxetine". |
| OTC codeine product on demo-002 → stop or ask, never safe | pass | Solpadeine, "Codeine" and كودايين all return `stop` and show both phenotypes. |
| Pharmacist screen at 375 and 1440, ar and en | 375: pass; 1440: could not check | `?view=pharmacist` at 375 shows genetic and acting phenotypes, meds and the QR after the PIN. axe found 0 issues and there is no overflow. I did not run 1440. |
| Meds cap | pass | After 4 meds: "Your card holds up to 4 medicines…" (`data-testid="meds-full"`). |

## Cross-cutting checks requested

- **A7 (passport):** pass. See C9. Scan result for demo-002: "Acting like: Poor Metabolizer (because of paroxetine)".
- **A8:** pass on the gene card and the pharmacist view. In the demo-001 CYP2D6 card:
  - The scale has class `is-unassessed`, with data-g and data-a empty.
  - Both `.m-scale__genetic` and `.m-scale__acting` are `display:none`.
  - All 5 segments use `repeating-linear-gradient(135deg…)`, i.e. hatched.
  - There are 0 `aria-current` labels.
  - The void label reads "Not assessed — no result reported".
  - The body reads "Copy number not assessed by this test — no result reported. This is not a reassurance."
  - No "Normal" appears anywhere in the card.
  - **Defects:** the card header reads "CYP2D6 · VCF" (F4). The Arabic body drops "not a reassurance" (F10).
- **Meyar Scale on every phenotype:**
  - Genes view: scales equal gene cards (2/1/3 for demo-001/002/006).
  - Pharmacist view: same (2/1/3).
  - **Doctor tab (`?tab=doctor`): 0 scales for 2/1/3 phenotype rows.** This fails (F5).
- **Patient side, "safe" and "switch":**
  - "safe": 0 hits.
  - "switch": the only hit is caregiver mode, "profile switching… locked" (`en.json:184`), which is about the UI, not medicines.
  - Every `.m-better` text ends "— ask your doctor" / "— اسأل طبيبك".
  - All alternatives shown (prasugrel / ticagrelor, non-codeine opioid, non-tramadol opioid) are in the table's `alternatives` set {aspirin, ketorolac, naproxen, sulindac, alternative statin, non-codeine opioid, prasugrel, ticagrelor, ticlopidine, non-tramadol opioid, rosuvastatin}. The doctor tab prints "Better matched for your genes: prasugrel, ticagrelor" without "ask your doctor" (`render.js:547`).
- **A6 in the browser:** pass in the passport. With demo-001 injected as `sampleOrigin:"somatic"`, the page shows "This profile is not from an inherited (germline) sample, so the Passport cannot show it." (ar equivalent) and 0 gene cards. The scanner also rejects it, but through the wrong path (F6).
- **Mandatory lines** (54 view×lang×patient combinations):
  - "Research prototype — not for clinical use" is present in all of them, but **without the final period** in all of them.
  - "Runs on synthetic and GeT-RM reference data; no patient data was used." is **absent in all 54**. It is not in `passport/src`, `index.html`, `scan.html` or the dist bundles (grep "GeT-RM" = 0). It exists only in the root README.md:7.
  - The "Demo data" / بيانات تجريبية label is present in all 54.
- **sw.js:** see F2.
  - The precache list (`public/sw.js:2-9`, identical in dist) holds only `/`, `/index.html`, `/scan.html` and the 3 demo JSON files. There are **no hashed JS, CSS or font assets** (19 in dist/assets).
  - Test 1: visit index.html, then go offline. index re-renders (assets came from the browser HTTP cache, not the SW cache). **scan.html renders nothing** because `scan-CYNbqTc0.js` was never cached.
  - Test 2: visit index, then scan, then index, then go offline. Both pages work and the offline decrypt gives 2 cards.
- **Demo contracts:**
  - `docs/fixtures/`, `passport/public/demo/` and `passport/dist/demo/` each hold only 001, 002 and 006, byte-identical across the three. This confirms the known issue.
  - `engine/data/out/demo-00{1..6}.contract.json` exist locally but are **untracked** (`git ls-files` lists only the 9 fixture copies). They differ from the fixtures: the fixtures are trimmed subsets. For example, the engine's demo-002 also has CYP2C19, CYP2C9 and SLCO1B1 Normal plus several Indeterminate genes, while the fixture has CYP2D6 only.
  - The patient switcher is hard-coded to 3 IDs (`render.js:37`). `?patient=demo-003` gives "Could not load demo profile (demo-003)."
  - The contracts carry no top-level `"mock": true`. Only `currentMedications[]` items do.
- **@media in passport/src/app.css: 3** (lines 379 `min-width:760px`, 757 `screen and max-width:420px`, 859 `print`). Hard-coded hex: see C1 table (qr.js only).

## Views and states (for the later screenshot pass)

Base URL: `http://<host>/index.html`.

Query parameters (read once at load, `main.js:57-77`):

| Param | Values / effect |
|---|---|
| `patient` | `demo-001` (default), `demo-002`, `demo-006` |
| `lang` | `ar` (default) or `en`. Falls back to localStorage `meyar:lang`. |
| `elder` | `on` / `off`. Falls back to localStorage `meyar:elder`. |
| `tab` | `genes` (default), `meds`, `otc`, `doctor` |
| `view=pharmacist` or `tab=pharmacist` | pharmacist view |
| `mode=caregiver` | caregiver mode |
| `q=<text>` | pre-fills OTC |
| `dev=1` | dev mode |

localStorage keys:
- `meyar:lang` (`ar` / `en`)
- `meyar:elder` (`on` / `off`)
- `meyar:meds:<patientId>`: JSON array of `{name,source:"patient-entered",mock:true}`

The service worker is `/sw.js`, cache `meyar-passport-offline-v2`.

index.html:
1. **Genes (cover + gene cards):** `?patient=demo-00X`. Tab button `[data-action="tab"][data-tab="genes"]`.
   - demo-001 shows the CYP2C19 PM card and the CYP2D6 not-assessed (hatched) card.
   - demo-002 shows CYP2D6 phenoconverted.
   - demo-006 shows CYP2C19, CYP2C9 and CYP2D6 (UM → NM via duloxetine).
   - Read-aloud is either a button or the "unavailable" tooltip, depending on the voices installed.
2. **Meds:** `&tab=meds`.
   - Empty-list state: demo-001 has no currentMedications.
   - Rows: demo-002 (hospital-record paroxetine) and demo-006 (patient-entered duloxetine).
   - Add: type in `#med-add-input`, then submit `#med-add-form button[type=submit]`, or use the quick-pick `[data-action="med-pick"][data-med="paroxetine|duloxetine|fluvoxamine|codeine"]`.
   - Remove: `[data-action="remove-med"]`, shown only for locally added meds.
   - Meds-full state: 4 meds, then one more add, gives `[data-testid="meds-full"]`.
3. **OTC:** `&tab=otc`.
   - Idle: no `q`.
   - Results (`#otc-result [data-otc-status]`):

     | `q` | Patient | Result |
     |---|---|---|
     | `omeprazole` | demo-001 | ask |
     | `paracetamol` | any | none |
     | `Solpadeine` | demo-002 | stop |
     | `Solpadeine` | demo-001 | ask (not-assessed) |
     | `Solpadeine` | demo-006 | none |
     | `xyzzy` | any | unknown |
     | `omeprazol` | any | fuzzy note |

   - Example chips: `[data-action="otc-pick"]`. Clear: `[data-action="otc-clear"]`.
4. **Doctor / QR + print:** `&tab=doctor`.
   - No-PIN state: the QR box shows the prompt and print shows `[data-testid="print-requires-pin"]`.
   - PIN error: fill `#qr-pin-input` and `#qr-pin-confirm` with different values (mismatch) or with fewer than 6 digits, then click `[data-action="issue-card"]`. A `role=alert` appears.
   - Issued: matching 6 digits, then issue. You get the QR SVG in `[data-testid="qr-svg-box"]`, the reissue note, and the print section with an ID-1 preview and an A6 fold-out (`.m-print-sheet--id1/--a6`).
   - Verified: `[data-action="decode-qr"]` gives `[data-testid="qr-decoded-output"]`.
   - Verify fail: change `#qr-pin-input` after issuing, then decode-qr, which shows "Could not decode with this PIN."
   - Emergency line: `[data-action="qr-emergency-toggle"]` (checkbox), then `#qr-emergency-input`.
   - Dev: `&dev=1` adds `[data-testid="qr-metrics"]` and `[data-action="toggle-plaintext"]`.
   - Print modes: `[data-action="print-id1|print-a6|print-both"]` call window.print. To emulate, set `document.body.dataset.print = document.documentElement.dataset.print = 'id1'|'a6'|'both'` and use `emulateMedia({media:'print'})`.
5. **Pharmacist:** `&view=pharmacist`, or `[data-action="open-pharmacist"]` (on the genes, meds and doctor tabs). It has no tab bar.
   - Without a QR it shows inline PIN fields and an issue button.
   - With a QR it shows `[data-testid="pharmacist-qr-box"]`.
   - Close: `[data-action="close-pharmacist"]`.
6. **Caregiver:** `&mode=caregiver`, or `[data-action="caregiver-toggle"]` on the doctor tab. It shows `[data-testid="caregiver-banner"]`, hides the patient switcher, PIN fields and meds add, and has an exit button. `[data-action="caregiver-copy"]` gives the "copied" label (needs clipboard permission).
7. **Elder mode:** `&elder=on`, or the checkbox `input[data-action="elder"]`. It applies to every view.
8. **Errors:**
   - Unknown patient: `?patient=demo-003` shows "Could not load demo profile".
   - Non-germline: only reachable by injection (route demo JSON with `sampleOrigin:"somatic"`).
   - Loading placeholder `...` shows before the fetch resolves.
9. **Offline:** visit online once, then go offline and reload (see F2).

scan.html (`?lang=`, `?elder=`, `?dev=1`; same lang/elder localStorage keys):
1. **Scan step** (default). Camera via `[data-action="start-cam"]` gives the live `<video>`; `[data-action="stop-cam"]` stops it. A camera error shows if getUserMedia is denied or missing (in headless it hung, so I did not reach it). Upload is `input[data-action="scan-file"]`. Paste: open `.m-scan-paste summary`, fill `#scan-paste-input`, click `[data-action="load-pasted"]`. Invalid input (garbage, or v0 without dev) gives `role=alert` "not a valid Meyar QR envelope".
2. **PIN step / holder view** (`[data-testid="holder-view"]`): reached by a valid v1 envelope via paste, upload or `scan.html#e=<base64url of the QR text>`.
   - Shows the emergency line when the envelope has `e` (scratchpad `qrtexts.json` key `demo-001-emerg`).
   - Keypad `[data-action="pin-digit"][data-digit="0-9"]`, `pin-clear`, `pin-back`, or the physical keys 0-9 / Backspace / Enter.
   - Wrong PIN: `role=alert`. Locked (3 misses): `[data-testid="pin-locked"]` with a countdown.
   - `[data-action="reset-scan"]` returns to the scan step.
3. **Result step** (`.m-cds` cards): right PIN 123456 with the scratchpad `qrtexts.json` envelopes. demo-001 gives 2 cards (including the A8 not-assessed one), demo-002 gives 1 (phenoconverted), demo-006 gives 3.
4. Dev plaintext v0 result: `?dev=1` plus a `{"v":0,"p":…}` envelope, which goes straight to the result.

axe-checked views (all 0 violations, ar and en, 375 px):
- index: genes 001/002/006, genes 002 elder, meds 002, otc idle/ask/stop/unknown, doctor no-PIN/issued+print/decoded, pharmacist no-QR/QR, caregiver, error demo-003
- scan: step, pin+emergency, pin wrong, result 002

## Findings

### Blocks submission
- **F1. The "Runs on synthetic and GeT-RM reference data; no patient data was used." line is missing from the Passport and the scanner.** The prototype line also lacks its final period.
  - Where: `passport/src/i18n/en.json:99,239` and `ar.json:104,244` (the `proto` key is the only honesty line); rendered at `render.js:41`, `scan-render.js:16`.
  - Evidence: 0 of 54 views contain it; grep "GeT-RM" in passport/src and dist = 0.
  - Smallest fix: add a `dataLine` key (en plus an Arabic translation) and render it next to `.m-proto` in both top bars. Add "." to `proto`.
- **F2. Offline is not guaranteed: the SW precaches no JS, CSS or font assets.**
  - Where: `passport/public/sw.js:2-9`.
  - Evidence: after visiting index.html only, scan.html offline renders blank because `scan-CYNbqTc0.js` was never fetched. index offline worked only through the HTTP cache. The first-load assets are fetched before the SW controls the page, so they never enter the SW cache.
  - Why it blocks: this undermines C3 ("second device in airplane mode") and the "offline" claim.
  - Smallest fix: precache the built asset list, either generated at build time (vite plugin that writes the `dist/assets` names into sw.js) or by having the install handler fetch the two HTML files and `cache.addAll` their `<script src>`, `<link href>` and font URLs.

### Wrong in front of a judge
- **F3. The documented QR size does not match what the app issues.**
  - Where: `docs/qr-envelope.md:31` and `passport/README.md:11` say demo-001 is "325 → 204 → 360 B". The test measures the payload without `getDrugsFn` (`test/qr.test.mjs:41`).
  - Actual: the app issues 540 → 294 → **480 B, QR version 17, EC M**. The worst case (demo-006, 4 meds, 120-char emergency line) is 815 B, v23, 0.239 mm modules at 28 mm.
  - Smallest fix: replace the line with the table above, or measure in the test with `getDrugsFn: getDrugsForGene` after `applyPhenoconversion`.
- **F4. The not-assessed CYP2D6 header reads "CYP2D6 · VCF".**
  - Where: `render.js:141` and `render.js:781`.
  - Why it matters: it implies a VCF-derived call for a gene that A8 says is never called from VCF.
  - Smallest fix: show the gene name alone, or append `t.notAssessedTitle`.
- **F5. The doctor tab draws phenotypes without the Meyar Scale.**
  - Where: `render.js:516-554`. Measured 0 scales for 2/1/3 phenotype rows.
  - Rule broken: AGENTS §11, "The Meyar Scale is the one way a phenotype is drawn".
  - Smallest fix: add `${scaleHTML(g, lang, getScaleLabels(g, lang))}` to each `.m-doctor-row`.
- **F6. The scanner reports a somatic payload as "wrong PIN" and charges a limiter attempt.**
  - Where: `scan.js:222-236`. `buildCdsCardsFromPayload` throws A6 inside the same try as decrypt.
  - Evidence: a somatic payload with the correct PIN shows "Could not decrypt with this PIN".
  - Smallest fix: split the try blocks. On an A6 error show a dedicated "not a germline sample" message and call `recordSuccess`.
- **F7. The passport's PIN honesty sentence omits "stops casual scanning only".**
  - Where: `en.json:221` / `ar.json:226`. README.md:19 claims the same sentence appears in both apps, which is false.
  - Smallest fix: reuse the scanner's `pinHonesty` text (`en.json:258` / `ar.json:263`) under the passport PIN fields.
- **F8. Hard-coded English in Arabic mode (C4 box fails).**
  - Where: `render.js:524-534` (doctor tab: "positions; untested", "Outside call", "Not assessed"), `scan-render.js:120-123,167-174` (clinician cards: "Not assessed — no result reported", "because of", the A8 blockquote), `main.js:185-187` (inline error), and the aria labels at `render.js:708`, `scan-render.js:91,93`.
  - Smallest fix: move these strings into ar.json/en.json.
- **F9. Handoff "Last commit" fields are not real hashes for 6 of 9 tasks.**
  - Where: `handoff/C1.md`, `C2.md`, `C3.md`, `C7.md`, `C8.md` hold none / pending / "see git log -1". `handoff/C5.md` names `c208daa`, which does not exist.
  - Smallest fix: write the real hashes (C1 9eda524, C2 13d86e9, C3 d4d8276, C5 3d9af11, C7 8b2d8d4, C8 bbc859a, or later ones).
- **F10. The demo contracts are trimmed fixtures, and only 001, 002 and 006 exist.**
  - Where: `docs/fixtures`, `passport/public/demo`, `render.js:37` and `sw.js:6-8` all hold 3 patients. The engine outputs for 001–006 are untracked, and their gene lists differ from the fixtures.
  - Also: contracts lack top-level `"mock": true` (AGENTS §2).
  - Smallest fix: document that the fixtures are curated subsets and that 003–005 are omitted. Alternatively, commit the trimmed 003–005 and add them to the switcher and the SW list.

### Minor
- **F11.** The Arabic not-assessed body drops "This is not a reassurance" (`ar.json:182`, compare `en.json:177`). Add «وهذا ليس تطميناً».
- **F12.** The QR SVG ink and paper colours are hex literals (`qr.js:312`). Take them from tokens, or document that they are fixed for scan contrast.
- **F13.** Typing "Codeine" in the OTC box matches "Solpadeine (paracetamol + codeine)" before the "Codeine" product (`otc.js` match order). The status is still correct (stop).
- **F14.** The doctor-tab alternatives omit "ask your doctor" (`render.js:547`). This view is shown to clinicians, but it sits inside the patient app.
- **F15.** The PDF of the ID-1 card is 85.68×54.02 mm against 85.60×53.98 mm in CSS (Chromium px rounding). Say this in the C7 evidence instead of claiming an exact PDF size.
- **F16.** An on-screen QR at DPR 1 (261 px box, about 2.5 px/module) does not decode from a screenshot. DPR 2 and 3 decode. This is a risk only for low-DPI desktop demos.
- **F17.** Only 3 `@media` rules in `passport/src/app.css` (379, 757, 859). No horizontal overflow was found at 375 in any of the 40 runs.

## Not checked
- ANTI-SLOP scoring, 1440 px layout, 200% zoom and real-device screenshots (left for the later screenshot pass).
- Physical print scanning and the real camera.
- The 5173 dev server (not started, on purpose).
- axe "incomplete" items, such as colour contrast over the grain background.
