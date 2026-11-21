# Meyar design system

Every screen, card, dashboard, printed card and poster panel in Meyar is built from this folder. If a build prompt and this file disagree on how something looks, this file wins. If this file and `AGENTS.md` disagree on what may be shown, `AGENTS.md` wins.

**See it live:** open `design/showcase/index.html` through any local server (for example `npx vite design` or `python3 -m http.server` from the repo root, then `/design/showcase/`). It renders the Passport, the printed card, the prescriber card, the alert dashboard and the kit timeline from these files.

| File | What it is |
|---|---|
| `tokens.json` | Single source of truth: colour, type, size, space, radius, motion, elder overrides, contrast pairs |
| `build-tokens.mjs` | Builds `tokens.css` from `tokens.json` and checks every contrast pair (exit 1 on failure). No dependencies |
| `tokens.css` | Generated CSS custom properties. Never edit by hand |
| `meyar.css` | Component styles. Vanilla CSS, logical properties, RTL by default |
| `meyar.js` | ES module helpers: the scale, the coverage comb, motion switch, count-up, language and elder mode |
| `fonts/` | Self-hosted Readex Pro, IBM Plex Sans Arabic, Alexandria, IBM Plex Mono (OFL), Arabic + Latin subsets |
| `ANTI-SLOP.md` | What generic AI-made UI looks like, and what Meyar does instead. Pre-merge checklist |
| `showcase/` | Living reference of every surface |

## 1. The idea

**Meyar (مِعيار) means "the standard measure".** So the product looks like a measuring instrument, not a wellness app. The signature element is **the Meyar Scale**: five stops from slow to fast, a hollow ring for the genetic result and a solid needle for how the body acts today after the medicines it already takes (A7). The rule "always show both, never hide the genetic result" is literally drawn.

Three grounds, one per audience, so anyone can tell which surface they are on at a glance:

| Ground | Theme | Used for | Voice (font) |
|---|---|---|---|
| Security paper (pale green tint, like passport paper) with a faint grain | `paper` | Passport (C1–C9), printed card (C7) | Patient: Readex Pro |
| Chart paper (5 mm-style grid) | `paper` + `.m-chartpaper` | Prescriber page, scan-side reader (C3), B5 comparison | Clinician: IBM Plex Sans Arabic |
| Instrument black (warm kohl, never pure black) | `instrument` | Alert log dashboard (B4), any live monitor | Clinician |

**Regional signature.** The brand ornament is an **Al-Qatt Al-Asiri band**, after the painted wall bands of Aseer, the region King Khalid University is in. It appears on the passport cover, the bottom of the printed card, the poster frame and the footer. It never appears inside clinical content, next to a result, or in the dashboard. Juniper green (Aseer's juniper forests) is the brand colour; saffron is ornament only.

**Ranking when goals conflict:** clinical clarity, then accessibility, then honesty labels, then character. A beautiful element that slows a pharmacist or an older patient is removed.

## 2. How to use it in each app

**Passport (Vite, port 5173).** Import the design folder directly, never copy it (copies drift):

```js
// passport/vite.config.js
import { defineConfig } from 'vite';
export default defineConfig({
  server: { port: 5173, fs: { allow: ['..'] } },
  resolve: { alias: { '@design': new URL('../design', import.meta.url).pathname } },
});
```
```js
// passport/src/main.js
import '@design/fonts/fonts.css';
import '@design/tokens.css';
import '@design/meyar.css';
import { scaleHTML, combHTML, calibrate, initMotion, setLang, setElder } from '@design/meyar.js';
```
`<html lang="ar" dir="rtl" data-theme="paper" data-elder="off">`, `<body class="m-body m-grain">`. Call `initMotion()` once at start-up. Fonts are bundled, so the app renders correctly with the network off (C3).

**CDS service (port 3000).** `docker-compose.yml` mounts `./design` read-only at `/data/design`. Serve it at `/design/*` with `node:fs` (no new dependency) and link the same three CSS files from `/dashboard` (B4) and the comparison page (B5). Use `<html data-theme="instrument" data-voice="clinician">` for the dashboard.

**Kit (F3).** Same import pattern as the Passport, `paper` theme, clinician voice for staff screens.

**Poster and diagram (D1, D2, F4).** Use the primitive hex values from `tokens.json`, the same four families and the Qatt band as the poster frame. Clinical colour meanings (stop, ask, none, scale) keep their meaning in print.

## 3. Colour

Every colour is a token. Components use semantic tokens (`--m-stop`), never primitives (`--m-p-madder-800`), except the cover, the Qatt band and print.

| Semantic token | Meaning | Rule |
|---|---|---|
| `--m-brand` | Juniper. Primary actions, links, brand | One primary button per screen |
| `--m-ornament` | Saffron | Ornament and the cover only. Never a status, never text on paper |
| `--m-stop` / `--m-stop-tint` | "Do not take without your doctor" | Always with the octagon icon and the words |
| `--m-ask` / `--m-ask-tint` | "Ask the pharmacist before buying", CDS `warning` | Always with the triangle icon and the words |
| `--m-none` / `--m-none-tint` | "No gene guidance for your profile" | Dashed outline + dashed-circle icon. Never green, never a tick |
| `--m-info` | Information, CDS `info` | Circle-i icon |
| `--m-better` | "Better matched for your genes" | Diamond-check icon. Only where a CPIC row names an alternative |
| `--m-scale-slow2 … --m-scale-fast2` | The five scale stops | Diverging: lapis for slow, stone for normal, terracotta for fast. Both ends are coloured because both ends matter (AGENTS.md §7) |
| `--m-mock-badge(-text)` | "Demo data" label | On every screen that shows mock data |

**There is no green "safe" colour and no tick icon on the patient side.** The design makes the banned word impossible to imply.

**Contrast is checked, not eyeballed.** `node design/build-tokens.mjs` computes the WCAG 2.2 contrast ratio of 31 declared text/background pairs in both themes (62 checks) and refuses to write `tokens.css` if any pair is under 4.5:1 for text or 3:1 for non-text marks (SC 1.4.3, 1.4.11). Current result: 62/62 pass. If you add a pair to a component, add it to `contrastPairs` in `tokens.json` first.

## 4. Typography

| Role | Token | Family | Where |
|---|---|---|---|
| Patient | `--m-font-patient` | Readex Pro (Arabic + Latin in one family) | Passport, fold-out, printed card |
| Clinician | `--m-font-clinician` | IBM Plex Sans Arabic | Prescriber card, dashboard, tables, kit staff screens |
| Display | `--m-font-display` | Alexandria (variable 100–900) | Headlines, the word مِعيار, the cover title, big dashboard numbers. Use the extremes: 800 for Arabic headlines, 200 for the English line under them. Never body, never clinical text. Reem Kufi is banned for this project (owner decision, 21 Nov 2026) |
| Data | `--m-font-data` | IBM Plex Mono | Gene symbols, star alleles, activity scores, codes, timestamps. Never prose |

Scale (rem, 1rem = 16px): xs 0.8125 · sm 0.9375 · **md 1.125 (patient body minimum, 18px)** · lg 1.375 · xl 1.75 · 2xl 2.375 · 3xl 3.25 · 4xl 4.75. Elder mode multiplies the whole scale by 1.3.

Arabic rules:
- Arabic line-height 1.75 (1.9 in elder mode). Latin UI 1.45.
- Never letter-space Arabic and never set it in uppercase-style tracking; `.m-eyebrow` switches to plain weight in `[lang="ar"]` automatically.
- Wrap genotype data in `.m-data`. It sets `direction: ltr; unicode-bidi: isolate`, so `*2/*2` and `2.0 → 0.0` never reorder inside an Arabic sentence.
- Digits: Arabic patient text uses Arabic-Indic digits (٩ من ١١). Genotype data stays in Latin digits inside `.m-data`. The PIN pad shows both forms on every key (٣ above 3).
- The patient app does not use English loanwords where an Arabic word exists (C4). Every patient-facing Arabic string in this folder and the showcase is a **draft** for the C4 native-speaker review.

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--m-ease-settle` | `cubic-bezier(0.2, 0, 0, 1)` | Default. A needle coming to rest |
| `--m-dur-tap` | 110ms | Button press, toggle |
| `--m-dur-state` | 220ms | State change, comb teeth |
| `--m-dur-reveal` | 420ms | Scale segments rising, new feed row |
| `--m-dur-sweep` | 900ms | **The one orchestrated moment per screen:** the scale calibrates and the needle travels from the genetic ring to the acting position |

Rules:
1. Motion is opt-in. `initMotion()` adds `.m-motion` to `<html>` only when the user has not asked for reduced motion and elder mode is off. No JS, no animation.
2. One orchestrated moment per screen. On a gene card it is the calibration; on the dashboard it is the bar fill and count-up of real logged counts. Nothing else animates on load.
3. Never overshoot. No spring, bounce or elastic easing anywhere.
4. Animate only `transform`, `opacity` and registered custom properties. Never `transition: all`, never width/height/margin.
5. No looping motion. The dashboard's live dot does not pulse; new rows arrive once.
6. `countTo()` is for logged counts only, never for a sourced statistic or a rate.

## 6. Components

All class names start with `m-`. Markup examples live in `showcase/index.html`.

**Meyar Scale** `.m-scale` (built by `scaleHTML(gene, lang)`, animated by `calibrate()`)
- Reads `phenotype`, `effectivePhenotype` and `callability` from the contract. Never computes a phenotype itself.
- Ring = genetic. Needle = acting. The dashed bracket and both flags appear only when they differ.
- `callability.method === "not-assessed"` or an indeterminate result: hatched track, no ring, no needle, the words "Not assessed — no result reported". The scale never shows a default "Normal".
- `lang`: `'ar'` and `'en'` use patient words (Slow, A bit slow, Normal…); `'clinician'` uses CPIC terms (Poor, Intermediate…).
- Direction follows reading direction: slow sits at the start (right in Arabic, left in English).
- Binary genes (HLA-B and similar) use `.m-binary`, never the scale.

**Coverage comb** `.m-comb` (`combHTML(coverage)`) — one tooth per defining position, solid if assayed, hollow if not. Always followed by the A5 sentence ("Assay covered 9 of 11 defining positions; did not test *35"). Gaps are drawn at the end because the contract does not say which positions were missed.

**Saudi data tier** `.m-tier` — `T1` published Saudi frequency, `T2` none published (null score), `T0` structural gene (A8). Text from `_coverageStatement`, never a global claim.

**Status** `.m-status--stop|ask|none|info|better` — shape + word + colour, always all three. `.m-answer--*` is the large full-width version for the OTC check (C6). Three answers only on the patient side.

**Better match** `.m-better` — "Better matched for your genes: <drug> — ask your doctor". Only when the CPIC row has an `alternatives` entry. The patient app never says "switch".

**Gene card** `.m-gene` — gene symbol in `.m-data`, one plain-language sentence (`.m-gene__plain`), the scale, the "because of <drug>" line, then drug rows with statuses, then the comb and tier. Read-aloud button (C5) sits in the header.

**Passport cover** `.m-cover` — juniper, Alexandria 800 title, saffron call-to-action ("Show a doctor or pharmacist"), Qatt band at the bottom. Home screen only.

**PIN** `.m-pin` + `.m-pin-dots` — 64px keys in elder mode, both digit forms, honesty line under the pad.

**Controls** `.m-btn` (primary, `--secondary`, `--quiet`), `.m-switch`, `.m-seg`, `.m-input`. Minimum target 48px (`--m-target`), 64px in elder mode.

**Prescriber card** `.m-cds` — bar (indicator chip + guideline version + Demo data), summary, Genetic / Acting like list, mini scale, guideline quote with citation, comb, suggestion buttons, foot ("Advises, does not prescribe" + guideline link). Lives in a side rail, never a modal.

**Dashboard (instrument theme)** `.m-dash` 12-column grid of `.m-tile` (radius 20, spans `--3` to `--12`). Pieces: `.m-kpi` + `.m-delta` + `.m-minibars` for the KPI row; `.m-live` pulsing chip; `.m-seg` range switch (Today / 7 days); `.m-feed` live alert feed with `.m-mono` drug monogram and `.is-new` arrival; `.m-watch` phenoconversion watch (fixtures only); `.m-heat` gene coverage (no numbers, hatched SV for CYP2D6). Charts come from `design/charts.js` (dependency-free SVG, theme colours from `--m-data`, `--m-data2`, `--m-data3`):

| Function | Use |
| --- | --- |
| `area(el, {series:[{x,y}], label, unit})` | Cards over time. Clip reveal, crosshair, tooltip, arrow keys, rests on the peak |
| `gauge(el, {value, max, label, ticks})` | Share of a whole (for example cards acted on). 220° segmented arc, number counts up |
| `bars(el, {data:[{x,y}], label})` | Cards by drug. Active bar shows a value pill, hover and focus move it |
| `rings(el, {parts:[{label,value,color}], centre, centreLabel})` | Response mix (accepted, switched, overridden) |
| `minibars(el, values)` | Sparkline inside a KPI tile |
| `tween(node, to, ms)` | Count-up; instant when motion is off |

Every tile states its source (`cds/data/alerts.jsonl`) and carries Demo data while the log is synthetic. A gauge or ring is a share of this log, never a national rate, and says so.

**Photo slot** `.m-photo[data-img="img-NN"]` with `--ar` aspect ratio. Loads `design/imagery/img-NN.webp`; while the file is missing it shows a designed placeholder with the ID, so layouts never break. Images are illustrative and the footer says they are AI-generated. Prompts and the conversion script live in `design/imagery/`.

**Government-platform alignment.** Clinician surfaces follow the Saudi Digital Government Authority Platforms Code where it overlaps: IBM Plex Sans Arabic, RTL first, Hijri (Umm al-Qura) date beside the Gregorian one, clear focus rings. Meyar keeps its own juniper and saffron, so it reads as a Saudi product without imitating a government brand.

**Chain** `.m-chain` — F3 timeline, a node per event, broken links switch to the stop colour **and** a "!" node.

**Print** `.m-id1` (85.60 × 53.98 mm, ISO/IEC 7810 ID-1) and `.m-a6` (105 × 148 mm). Face: wordmark, "Ask the holder for the PIN", prototype line, QR, a passport-style strip holding only envelope version and issue date. No name, no ID, no result on the face.

**Honesty labels** `.m-mock` ("Demo data" / "بيانات تجريبية") and `.m-proto` ("Research prototype — not for clinical use"). Always visible, never decorative.

## 7. The CDS Hooks card in the sandbox

The public sandbox renders cards itself, so our CSS does not reach it. Write the card JSON to read well as plain Markdown:
- `summary`: one sentence under 140 characters (CDS Hooks spec), pattern `<GENE> <phenotype>: <drug> <effect>`.
- `indicator`: `warning` or `info`. Never `critical` for an alternative (B6).
- `detail` (Markdown): `**Genetic:** X · **Acting like:** Y because of Z`, the guideline line as a `>` quote, the A5 sentence, then `_Advises, does not prescribe. <guidelineVersion>._`
- `source.label`: "Meyar (research prototype)". `suggestions[].label`: "Better matched for this patient's genes: <drug>". `links[]`: the CPIC guideline.
- The styled `.m-cds` render is for our own pages (B5, the demo video, the poster).

## 8. Copy

- Patient voice: short sentences, second person, no genetics jargon ("slow", not "poor metaboliser"). Clinician voice: CPIC terms, exact.
- Buttons say what happens ("Show a doctor or pharmacist", "Send to pharmacist"), never "OK", "Submit" or "Learn more".
- Errors say what went wrong and what to do ("Not in our list — ask the pharmacist").
- Never "safe". Never a number without a row in `docs/sources.md`.

## 9. Verify before you call a UI done

1. `node design/build-tokens.mjs` → all contrast pairs pass.
2. Screenshots at 375 px and 1440 px, Arabic RTL and English, elder mode on and off (AGENTS.md §10.4). No horizontal scroll at 375 px.
3. axe-core with the WCAG 2.2 AA tags returns no violations (the showcase returns none).
4. Keyboard only: every control reachable, focus ring visible on every ground.
5. `prefers-reduced-motion: reduce` and elder mode both stop the calibration sweep.
6. Print the ID-1 card at 100% scale and scan it with two phones (C7).
7. Run every screen against `design/ANTI-SLOP.md`.

## 10. Sources

- WCAG 2.2 SC 1.4.3, 1.4.4, 1.4.11, 2.5.8 (W3C). Already in `docs/sources.md`.
- ISO/IEC 7810 ID-1 size. Already in `docs/sources.md`.
- CDS Hooks 2.0 specification, card attributes (summary under 140 characters, indicator values), cds-hooks.hl7.org.
- Anthropic, "Improving frontend design through skills" (2025), on the generic "AI slop" look. See `ANTI-SLOP.md` for the full list of sources.
