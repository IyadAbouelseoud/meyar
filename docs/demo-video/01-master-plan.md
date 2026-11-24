# Meyar demo video · master plan

**Status:** plan only, written 24 Nov 2026. Nothing here has been produced yet.
**Companion files:** `02-voiceover-script-ar.md` (what you say), `03-gemini-prompt-library.md` (the 10 new images).
**For the execution thread:** attach this folder, the finished Gemini images and the voice recordings. Work top to bottom: section 2 (fix the app) → section 9 (record screens) → sections 10–12 (build shots) → section 13 (assemble) → section 16 (QA).

---

## 1. The short version

- **Runtime 5:54**, in 7 scenes: hook, kit, central lab (Phase 1 and Phase 2), scan and the doctor's screen, Passport on a phone, T3 and T4 concepts side by side, logo and motto.
- **One mock patient carries the whole story:** `demo-006`, a 58-year-old on duloxetine who is prescribed codeine. His CYP2D6 is `*1/*2x2`: two copies of the gene, so genetically an **ultrarapid** metaboliser. Duloxetine (a moderate CYP2D6 inhibitor) makes him **act like a normal** metaboliser right now. That is exactly what Meyar's scale draws: hollow ring for the genes, needle for "acting like". I ran the real CDS service for this patient and order. It returns that card today, word for word (section 2).
- **The hard gene is CYP2D6.** The lab chapter shows why: deletions, duplications and CYP2D6/2D7 hybrids that a letter-by-letter read cannot see. It also shows Meyar's rule: never infer CYP2D6 from a VCF. Use a copy-number result, or say "not assessed". The largest Saudi study (Goljan 2022, 11,889 people) dropped CYP2D6 for exactly this reason. That is our hook.
- **What "Phase 1 / Phase 2" means here.** The poster has no Phase 1/2 labels, so I took the most faithful reading of our pipeline: **Phase 1 = read the letters** (array → VCF → PharmCAT → A5 coverage). **Phase 2 = count the copies** (CYP2D6 structural variation → A8 gate → outside-call result). If you meant something else, only scene S2 changes.
- **Four things in the app must be fixed before recording**, or the video breaks the "all screens in Arabic" rule. The doctor's card renders in English today even on `?lang=ar`. I checked this with a real screenshot. Fix list and evidence are in section 2.
- **Deadline reality:** submission is 25 Nov. Section 3 has an hour-by-hour plan across the three of you, plus a cut list and a minimum version you can still ship if things go wrong.

---

## 2. Fix the app before recording (found by running it)

I ran the CDS service and the Passport locally and screenshotted them in Arabic at 1440 px and 390 px.

| # | Problem found | Evidence | Fix | Time | Must? |
|---|---|---|---|---|---|
| **P0-1** | The doctor's card body is **English** inside the Arabic page: title ("Backward sweep — CYP2D6 Normal Metabolizer…"), scale labels (Ultrarapid … Poor, Genetic, Acting like), "WARNING / INFO", drug names in the orders table ("Paroxetine 20 MG Oral Tablet"), alternative text. Same on `/urgent` in the kit service. | `/preview?lang=ar` after signing; `docs/demo/screenshots/urgent-t3-ar-1440.png` | Arabic labels for every card field, indicator and scale stop. Reuse the Passport's `scale.metabolizer` words (بطيء … سريع جداً) and `drugs` map from `passport/src/i18n/ar.json`. **Keep the CPIC recommendation verbatim in English** inside a block titled «نص CPIC الحرفي». The lookup-only rule (AGENTS.md §7) means no machine translation of guidance. | 1.5–2 h | Yes |
| **P0-2** | The clinician page has **no patient banner**, only `demo-006` in the orders header. You asked for patient info. | `cds/lib/preview.js` line 684 | Add a mock banner above the orders: pseudonym «مريض تجريبي ٠٠٦», العمر ٥٨, نوع العيّنة: وراثية (germline), معرّف العُدّة MYR-DEMO-0006, تاريخ النتيجة (Hijri + Gregorian, like the dashboard), «بيانات تجريبية» chip. All `mock: true`. | 45 min | Yes |
| **P0-3** | No preview scenario for the hero patient. Scenarios are demo-001, demo-002, demo-002-sweep, pantoprazole. | `cds/lib/preview.js` lines 84–87 | Add scenario 5 «demo-006 · كودايين (مع دولوكسيتين)». The backend already handles it. My test POST for demo-006 + codeine returned: *"CYP2D6 Ultrarapid Metabolizer, acting like Normal Metabolizer (duloxetine): codeine"* with the UM row "applies if duloxetine is stopped: Avoid codeine use because of potential for serious toxicity…" and the mock outside-call source line. | 45 min | Yes |
| **P0-4** | The `/compare` page states UF "20% followed" and PROGRESS "90% acted". Both are flagged **unverified** in the research report. | `cds/lib/compare.js` line 12 | Don't film `/compare`, or delete that sentence first. The plan doesn't use it. | 0 | Yes (just avoid) |
| P1-5 | Kit service maps only MYR-DEMO-0001/0002 (demo-001). The hero box says MYR-DEMO-0006. | `kit/lib/demo.js` line 4 | Either map MYR-DEMO-0006 → demo-006 so the tracker shot (S4.9) shows the hero's ID, or crop the ID out of that shot. | 30 min | Nice |
| P1-6 | "اقرأ لي" shows «الصوت غير متاح» without an Arabic (Saudi) voice on the device. | Passport screenshot at 390 px | Install Google TTS Arabic on the Android phone you record with (or Arabic voice on iPhone), then test. If it still fails, cut beat S4.3's tap. | 10 min | Nice |
| P1-7 | **Effect Craft can't see our brand fonts.** It only has Simplified/Traditional Arabic and Arabic Typesetting. | `effectcraft list_fonts` for Plex, Readex, Alexandria returned 0 families | Install TTFs from Google Fonts (all OFL): Alexandria, IBM Plex Sans Arabic, Readex Pro, IBM Plex Mono. Then rescan fonts in Effect Craft. **Never Reem Kufi.** | 10 min | Yes |
| P1-8 | Netlify Passport is a static snapshot. | memory / deploy guide | If P0 changes touch `passport/`, rebuild and re-upload `passport/dist` before the phone recording. | 10 min | If changed |

**Not a bug, but you should know:** the Passport has no chat with a pharmacist, so the video won't fake one. "Asking the pharmacist" is shown through what really exists. «عرض الصيدلي» is a big-type pharmacist screen with an encrypted QR. «اسأل الصيدلي قبل الشراء» is one of the three OTC answers. «إرسال إلى الصيدلي» is a one-tap escalation on the doctor's card.

**Not a bug, but a rule you're overriding on purpose:** `hardware/blender/DESIGN-PLAN.md` says no device render shows a genotype result. You asked for live software on the T3/T4 screens. The plan does it with a persistent label: «الشاشة: برنامج مِعيار الحقيقي ببيانات تجريبية — ليست نتيجة من الجهاز». T4 still shows CYP2D6 hatched as not assessed, as that plan requires.

---

## 3. Schedule to the deadline (Riyadh time)

It's now about 22:15 on Tue 24 Nov. Confirm the form's closing hour tomorrow. This plan aims to **upload by 18:00 on Wed 25 Nov**, leaving buffer for the upload itself.

| When | BUNYAN | Renad | Dua |
|---|---|---|---|
| Tonight 22:30–00:30 | Record the voiceover (45 min, checklist in `02`). Then the Effect Craft Arabic smoke test (section 12.0, 15 min). Install fonts (P1-7). | P0-1, P0-2, P0-3 with Claude Code on a branch, merged. Then P1-5. | Generate G-01…G-06 + G-08 in Gemini (G-07, G-09, G-10 only if time). |
| 00:30–02:00 | Rough-cut the VO in Film Craft to lock timing (section 13.1). | Screen recordings R-01…R-14, doctor side (section 9). | Photo Craft finishing on the images (`03`, bottom). |
| Wed 08:00–11:00 | Effect Craft: E2 chapter bar, E5 CYP2D6 locus, E6 A8 gate (the most important graphics). | Phone recordings R-15…R-24 (section 9.3). | Blender B1 kit + B2 packing + B4 scanner; queue renders. |
| 11:00–14:00 | Effect Craft: E1, E3, E4, E7 window, E8 phone, E9 device labels, E10 end card. | Blender B5 T3/T4 screen textures from R-25/R-26; render. | Assemble the label PNG set if the Effect Craft smoke test failed (section 12.0 fallback). |
| 14:00–16:30 | Film Craft assembly, music, SFX, grade, captions. | QA pass 1 (section 16). | QA pass 1, fix list. |
| 16:30–17:30 | Fixes, export A (link) and B (≤95 MB file). | Upload A to YouTube Unlisted, add chapters. | Watch the exported file end to end on a laptop and a phone. |
| 17:30–18:00 | Submit: link in the demo field, file B attached, form field = **Predictive Healthcare**. | | |

### Cut list, in order (cut from the top when behind)
1. G-07 cath-lab backdrop, G-09 counter shot, G-10 texture (use flat paper colour).
2. S3.4 monitor establishing shot (G-05); start directly in the browser window.
3. S4.1 hand-and-phone establishing shot (G-06); start directly in the phone frame.
4. S3.15 dashboard beat (cut the VO line marked قابل للحذف).
5. B2 packing animation: use the existing F2 turntable clip + a still of the closed box instead.
6. S4.8 triptych (elder mode, caregiver, print): keep one of the three.
7. S5 exploded animations: use the existing stills (`meyar-t3-…concept.png`, `meyar-t4-…concept.png`) with labels, screens composited flat.

**Never cut:** the hook, the CYP2D6 Phase 2 animation and the A8 gate, the demo-006 card with ring and needle, the airplane-mode QR scan, every honesty label, the end card.

### Minimum version (if Blender or Effect Craft fails badly)
Voiceover + real screen recordings + the existing renders and F2/F3 clips + Film Craft's own title tool for labels. About 4:30, still complete. Sections 2 and 9 alone already make this possible.

---

## 4. Why people watch to the end: the rules this video follows

The judges are not a MOOC audience. They're obliged to watch, but they're tired, comparing many entries, and possibly watching muted on a laptop. Each rule below is tied to evidence and to a specific choice in the storyboard.

| Principle | Evidence | Applied as |
|---|---|---|
| **First seconds decide the impression.** People form stable judgements of a teacher from 30-second silent clips. | Ambady & Rosenthal, *J Pers Soc Psychol* 1993;64(3):431–441 | Frame 1 is a designed image (G-01), not black and not a logo. The first 26 s carry the problem, the stakes and the promise. |
| **Open a question, pay it off later** (curiosity gap). | Loewenstein, *Psychol Bull* 1994;116(1):75–98 | Hook: "a gene most tests can't read". Paid off at 2:12 (the gate). Second loop at 3:08: "what if he stops duloxetine?", paid off at 3:14. |
| **One person beats statistics.** | Small, Loewenstein & Slovic, *OBHDP* 2007;102(2):143–153 | One mock persona, "58, on duloxetine, codeine from the dentist". Every chapter follows him. Labelled «مريض افتراضي». |
| **Short segments and visible structure.** Median viewing time capped at about 6 minutes whatever the length. | Guo, Kim & Rubin, L@S 2014 (6.9 M sessions) | Runtime 5:54. A 5-part chapter bar is always visible, so viewers know where they are and how much is left. YouTube chapters are in the description. |
| **Engagement drops after 5 minutes.** | Wistia, *Optimal video length* (13 M videos, Jul 2025) | No scene is longer than 76 s. A visible payoff arrives at least every 45 s: gate, card, airplane scan, devices, logo. |
| **Signal the structure** (d = 0.70, 26/28 tests). **Segment** (d = 0.67). | Mayer, *Research-Based Principles for Designing Multimedia Instruction* (APA 2023) | Chapter bar, phase badges «المرحلة ١ / ٢», one highlight at a time, zooms that isolate the thing being said. |
| **Pre-train key terms** (d = 0.78). | Mayer 2023 | "Gene", "copy", "slow / normal / fast" are introduced in the hook and S2a before the hard CYP2D6 part. |
| **Words and pictures at the same moment** (temporal contiguity, d = 1.31). | Mayer 2023 | The edit is cut to the voice. The picture lands on the word. Voice is recorded first. |
| **Labels next to the thing** (spatial contiguity, d = 0.82). | Mayer 2023 | Callouts with leader lines, never a legend in a corner. |
| **Cut the decoration** (coherence, d = 0.86). | Mayer 2023 | No stock DNA, no particle swooshes, music low and sparse, one motion at a time. |
| **Don't print the narration on screen** (redundancy, d = 0.10, small but consistent). | Mayer 2023 | Labels are 2–6 keywords, never the sentence being spoken. Full Arabic captions ship as a separate SRT (on YouTube, off in the file), so a muted judge can turn them on. |
| **Conversational, human voice** (personalization d = 1.00; voice d = 0.74). Informal recordings drew about 2× engagement. | Mayer 2023; Guo 2014 | BUNYAN's own Saudi white-dialect voice, not TTS, not فصحى. |
| **Peaks and the ending carry the memory** (peak-end rule). | Kahneman, Fredrickson, Schreiber & Redelmeier, *Psychol Sci* 1993;4(6):401–405 | Planned peaks: 2:12 the gate closes on the VCF; 2:58 the ring and needle split; 4:21 the airplane-mode scan; 5:16 T4 says "not assessed". The end card holds in silence after the motto. |
| **Boundaries make memories.** | Zacks & Swallow, *Curr Dir Psychol Sci* 2007;16(2):80–84 | Every chapter opens with the same visual boundary (chapter bar tick + 0.4 s paper wipe). |
| **Fluent equals credible.** | Reber & Schwarz, *Conscious Cogn* 1999;8(3):338–342 | One type system, high contrast, consistent motion, honest labels. Polish reads as competence to clinician judges. |
| **Speak at your natural pace, not slower.** Engagement rose with speaking rate (mean 156 wpm in English). | Guo 2014 | Script checked at 1.8–2.2 Arabic words per second per scene (section 17). |
| **Muted viewing.** Reading speed for Arabic subtitles: up to 20 characters/s, 42 per line. | Netflix Arabic Timed Text Style Guide | Every label is held at least 1.0 s + 1 s per 14 characters (slower than subtitles, because the eye is also on the picture). Captions in the SRT follow Netflix limits. |

Sources I read in full this session: Guo 2014, the Mayer 2023 chapter, the Wistia article, the Netflix Arabic guide. The others are standard, widely cited papers that I didn't re-open today. Check their DOIs before quoting them anywhere public.

---

## 5. Format and technical spec

| Item | Spec |
|---|---|
| Master timeline | 1920 × 1080, 30 fps, Rec.709 SDR, 48 kHz stereo |
| Screen capture | OBS, 1920 × 1080, 60 fps, CQP 16–18 (60 fps gives smooth zoom resampling; delivered at 30). Chrome in app mode, no browser chrome (we draw our own window frame). |
| Crisp zooms | **Never zoom a recording digitally past 1.25×.** For close-ups, record a separate take at browser zoom 175% framed on that area, then cut or morph from the wide take. Text stays razor sharp. |
| Phone | Real phone screen recording (1080 × 2400 or similar), Passport from Netlify over HTTPS (camera and WebCrypto need it). Airplane mode is then real. |
| Stills | Gemini plates finished at 3840 × 2160 so a 10% push-in never softens. |
| Blender | 1920 × 1080, 30 fps, EEVEE, AgX view transform, PNG sequences, RGBA where composited. |
| Loudness | Voice peaks around −6 dBFS before mastering. Music ducked to roughly 18 dB under the voice. Final **−14 LUFS integrated, −1 dBTP** (Film Craft export has `loudnessLufs`). |
| Export A, link | H.264 High, 1080p30, VBR 2-pass, 12 Mbps (~530 MB). Upload as **YouTube Unlisted**. Put this link in the form's demo field: it plays everywhere, judges can use chapters and Arabic CC. |
| Export B, attached file | The form allows 100 MB per file. Budget 95 MB over 354 s = 2,147 kbps total. Minus 128 kbps AAC gives **video 1,950 kbps**, H.264 High, VBR 2-pass, 1080p30. H.264 rather than HEVC, because some judges' browsers won't play HEVC. Check the final size before uploading. |
| Captions | Arabic SRT via Film Craft `captions.export` (from the script, timed to the VO), ≤ 42 characters per line, ≤ 2 lines, ≤ 20 characters/s. Optional English SRT for non-Arabic judges. |
| YouTube chapters | In the description: `0:00 الافتتاح` · `0:26 العُدّة` · `1:12 المختبر المركزي` · `2:28 شاشة الطبيب` · `3:41 جواز الدواء` · `4:48 تصوّرات الأجهزة` · `5:31 الختام` (each ≥ 10 s, first at 0:00, as YouTube requires). |
| Frame 1 | G-01 with the persona chip already visible. This is the thumbnail most players show before play. |

---

## 6. Visual language

**Colours** (from `design/tokens.css`): juniper `#115A51` brand, deep juniper `#0A3D37` for title grounds, juniper tint `#DCEDE8`, saffron `#E2A21B` ornament only (chapter bar tick, Al-Qatt band, end card; never on clinical content), stop `#8E1F18`, ask `#7A4300`. Paper ground for motion graphics is the design system's paper token, the same green-tinted paper as the Passport.

**Type:** Alexandria 800 for scene titles and the wordmark moment. IBM Plex Sans Arabic for every label (clinical voice). Readex Pro only inside the phone chapter callouts (patient voice). IBM Plex Mono for gene names, star alleles, VCF lines and kit IDs. Sizes at 1080p: titles 56 px, label title 30 px/600, label subline 22 px/400, chips 20 px, mono 24 px. **Nothing under 20 px**, because judges may watch at 720p.

**Numerals:** Arabic-Indic digits in Arabic sentences (٥٨، ٣٢ من ٣٥), matching the Passport. Western digits only inside gene and allele notation (`*1/*2x2`), kit IDs and citations.

**Bidi:** never type a Latin run inside an Arabic text layer. Gene names, alleles and IDs are separate mono layers placed beside the Arabic, or wrapped with U+2066…U+2069 isolates. `*1/*2x2` must never render as `2x2*/1*`.

**Motion:** decelerate only (ease-out), nothing bounces, one moving focus at a time (design rule §11). Forward progress moves **right to left** (Arabic reading direction): the box travels leftward to the lab, the chapter bar fills leftward, recap tiles sweep leftward.

**Browser window** (adapted from your reference, not copied): window 1600 × 900 at 100% (83% of frame width), centred, 14 px corner radius, soft two-layer shadow (0 2 6 / 0 24 60 at 12% juniper-black), on paper ground. Top bar 44 px with three muted dots on the **left** and a URL pill in the centre showing the real address (`localhost:3000/preview?lang=ar`) with a lock-free neutral icon. The address is honest, and it tells technical judges this runs locally. When zooming, the window frame scales with the content; callouts sit **outside** the window edge on paper, with leader lines into it.

**Phone frame:** generic, not an iPhone or Galaxy silhouette. Rounded rectangle, 44 px radius, 14 px matte dark bezel, small centred punch-hole, no logo, no buttons drawn. Height 900 px in a 1080 frame, so screen content shows at about 0.83× of a 1080-wide recording. Tilt at most 6° in the establishing moment only, then flat for every interaction (readability beats drama).

**Honesty chips** (bottom-left, 20 px, dark chip with light text, same style as the existing renders):
- «تصميم العُدّة — البرنامج يعمل» on every kit shot
- «صورة توضيحية» on every Gemini image
- «تصوّر — لم يُصنع» on every T3/T4 shot
- «بيانات تجريبية» on every app recording
- «رسم مبسّط» on the CYP2D6 locus diagram

---

## 7. Label and no-overlap rules

1. **Safe area:** 96 px left and right, 64 px top and bottom (5% / 6%). Nothing important outside it.
2. **Fixed zones:**
   - top strip y 40–96: chapter bar only
   - bottom strip y 980–1040: honesty chip (left) and source chip (right) only
   - right column x 1340–1824: callouts that refer to the right half of the subject (read first in Arabic)
   - left column x 96–580: callouts for the left half
   - centre x 600–1320: the subject. Labels never sit here unless the subject is off-centre.
3. **At most 3 callouts on screen at once.** Bring the 4th in only after the 1st leaves.
4. **Callouts stay in their column.** Only the leader line travels to the anchor. A leader line is horizontal first, has at most one elbow, starts at a 6 px dot on the anchor, and **never crosses another leader line, another label, or the subject's outline**.
5. **Vertical spacing** between stacked callouts is at least 24 px. A callout is at most 2 lines: title ≤ 28 characters, subline ≤ 42.
6. **Reading time:** a label stays fully visible for at least **1.0 s + characters ÷ 14**. A 28-character title needs 3 s. Section 17 checks every label in this plan against its shot.
7. **Entry and exit:** labels enter one at a time, 250 ms apart, 300 ms ease-out fade and 12 px slide toward their anchor. They exit together in 200 ms **before** the subject moves through their zone or the camera moves.
8. **Moving 3D subjects:** Blender exports per-frame screen positions of every anchor to JSON (as `hardware/blender/anim/t3_anchors.json` already does). Effect Craft reads them for the leader lines. Label boxes don't follow. If an anchor moves more than 40 px during a label's life, hold the camera still for that label instead.
9. **UI recordings:** no label ever covers app content being discussed. When something needs pointing at, dim the rest of the window to 40% (one mask) and put the callout outside the window frame.
10. **Split screen (S5):** a 2 px saffron-free neutral gutter at x = 960. Right-device labels live only in the right column, left-device labels only in the left column. Nothing crosses the gutter. The right device is explained first, then the left. They are never animated at the same time.
11. **Overlap check before export:** render a contact sheet of every 10th frame for every labelled shot and look for any touching boxes or crossing lines. This is QA item Q7.

---

## 8. Shot-by-shot storyboard

Columns: **Shot**, **Time**, **Picture**, **On-screen labels** (exact Arabic in «»), **Tool / source**. The VO for each scene is in `02`. Picture cuts land on the bold words there.

### S0 · Hook · 0:00–0:26

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 0.1 | 0:00–0:06 | G-01 desk with the plain codeine box. Slow push 100→106%. | «مريض افتراضي · ٥٨ سنة» (chip, bottom-right, from frame 1) | Gemini G-01 → Photo Craft → Film Craft |
| 0.2 | 0:06–0:10 | Same plate, blur rises to 12 px, one line of kinetic type fades in centre. | «وصفة عادية» | Effect Craft E1 |
| 0.3 | 0:10–0:16 | Deep-juniper ground. `CYP2D6` in IBM Plex Mono builds letter by letter (60 ms per glyph). Under it, a hatched Meyar Scale with no marker. | «جين يصعب قراءته» | Effect Craft E1 |
| 0.4 | 0:16–0:21 | A paper "citation card" slides up from the bottom: author, year, n, one quoted English fragment in small mono. | «أكبر دراسة سعودية: ١١٬٨٨٩ شخصاً» · «استُبعد CYP2D6 من التحليل» · source chip «Goljan et al., PLoS ONE 2022» | Effect Craft E1 |
| 0.5 | 0:21–0:26 | Flash-forward triptych, 1 s each, sweeping leftward: kit box, the card's ring and needle, the phone. Then the wordmark مِعيار appears centre, and the 5-part chapter bar draws in at the top. | Chapter bar, 5 segments: «العُدّة» «المختبر» «الطبيب» «الجواز» «المستقبل» (read as one bar, not timed as labels) | Effect Craft E1 + E2, stills from B1/R-06/R-16 |

### S1 · Kit · 0:26–1:12

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 1.1 | 0:26–0:32 | Blender: closed kit box on the seamless studio, lid lifts. Chapter bar segment 1 fills. | «تصميم العُدّة — البرنامج يعمل» (chip) | Blender B1 |
| 1.2 | 0:32–0:46 | Parts float up and separate (exploded), slow 8° orbit. Wave A labels on the right column, wave B on the left. | Wave A: «أنبوب بغطاء محكم» · «قمع لجمع اللعاب» · «ملصق باركود Code 128» — Wave B: «كيس محكم ووسادة ماصّة» · «علبة الإرسال» | Blender B1 + anchors → Effect Craft E3 |
| 1.3 | 0:46–0:54 | Macro on the tube label, then the box end panel. A thin line links the two barcodes. `MYR-DEMO-0006` in mono beside each. | «نفس الرقم من الجمع إلى النتيجة» · stat: «الملصق اليدوي: أخطاء تعريف أكثر ≈ ٤٫٤ مرة» · source chip «CDC LMBP, barcoding review» | Blender B1 + Effect Craft E3 |
| 1.4 | 0:54–1:03 | Custody chain motion graphic: five nodes appear right to left. Node 3 flashes stop red for 1.5 s with the break label, then restores. | Nodes: «صُرفت العُدّة» · «جُمعت العيّنة» · «خُتمت الأنبوبة» · «شُحنت» · «استُلمت في المختبر» — break: «تعديل بعد الحدث يكسر السلسلة» | Effect Craft E3 (mirrors the real F3 kit behaviour) |
| 1.5 | 1:03–1:12 | Blender packing: tube into bag, bag into box, lid closes, box slides out of frame leftward. | stat: «يحفظ الحمض النووي ٨ أشهر» · «في حرارة الغرفة، بلا تبريد» · source chip «BMC Med Res Methodol 2012» | Blender B2 |

### S2a · Central lab, Phase 1 · 1:12–1:44

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 2.1 | 1:12–1:16 | Minimal route: dotted line from a clinic icon (right) to a lab icon (left), box icon travels along it. Chapter segment 2. | «إلى المختبر المركزي — موجود اليوم» | Effect Craft E4 |
| 2.2 | 1:16–1:20 | G-02 lab establishing, slow push. Phase badge top-right under the chapter bar. | «المرحلة ١ · قراءة الحروف» · «صورة توضيحية» (chip) | Gemini G-02 |
| 2.3 | 1:20–1:25 | G-03 hands, pipette into tube. | «استخلاص الحمض النووي» | Gemini G-03 |
| 2.4 | 1:25–1:31 | IMG-11 (or G-04) plate going in, match-cut to the poster's 96-well plate icon whose dots light up row by row. | «آلاف المواقع في قراءة واحدة» | Repo IMG-11 + Effect Craft E4 |
| 2.5 | 1:31–1:36 | Dots morph into 4 lines of real VCF text (mono, 24 px), copied from the engine's output for demo-006 rather than typed by hand. | «ملف VCF · مقتطف» | Effect Craft E4, text from `engine/` output |
| 2.6 | 1:36–1:44 | Lines flow into a box labelled PharmCAT. Out come two gene chips (CYP2C19 *1/*1, CYP2C9 *1/*1) on Meyar Scales. Then the A5 coverage comb on CYP2C19: 32 filled teeth of 35. | «PharmCAT 3.4.0 · مفتوح المصدر» · «فحصنا ٣٢ من ٣٥ موضعاً» · «لم نفحص *3 و*4A» | Effect Craft E4, numbers from `docs/fixtures/demo-006.contract.json` |

### S2b · Central lab, Phase 2 (the hard gene) · 1:44–2:28

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 2.7 | 1:44–1:48 | Phase badge swaps. A long chromosome bar zooms into one region. | «المرحلة ٢ · عدّ النسخ» | Effect Craft E5 |
| 2.8 | 1:48–1:52 | Locus schematic: a juniper block `CYP2D6` beside a grey look-alike block `CYP2D7`. | «CYP2D7: شبيه لا يعمل» · «رسم مبسّط» (chip) | Effect Craft E5 |
| 2.9 | 1:52–2:04 | Four rows build, 3 s each, top to bottom. Each row: Arabic label right, allele mono left, blocks in the middle. Row 1 one block. Row 2 a dashed empty slot. Row 3 two juniper blocks in tandem. Row 4 a block half grey, half juniper. | «نسخة واحدة» `*1` · «حذف: لا نسخة» `*5` · «تضاعف: نسختان» `*2x2` · «هجين مع CYP2D7: لا يعمل» `*13` | Effect Craft E5. **Check the schematic against PharmVar's CYP2D6 structural-variant figure** (Nofziger et al., PharmVar GeneFocus CYP2D6, *Clin Pharmacol Ther* 2020) before animating. |
| 2.10 | 2:04–2:12 | The trap: two columns, `*1/*1` and `*1/*2x2`. Under each, an identical strip of SNP dots. An "=" sign drops between them. Music drops out for 1 s (pattern interrupt). | «نفس الحروف · عدد نسخ مختلف» | Effect Craft E5 |
| 2.11 | 2:12–2:22 | **Peak 1.** The A8 gate. Three lanes enter from the right. Lane 1, VCF, hits a closed gate. Lane 2, a copy-number result, passes and becomes a result chip. Lane 3, no copy-number result, becomes a hatched scale. | Lane 1: «لا نستنتج CYP2D6 من VCF» · Lane 2: «سريع جداً · نشاط ٣٫٠» · Lane 3: «لم يُفحص — لا نتيجة» · source chip «PharmCAT docs: Calling CYP2D6» | Effect Craft E6 |
| 2.12 | 2:22–2:28 | Honesty card in the bottom third while the Blender box slides back in from the left (heading home, so moving rightward). | «نتيجة عدّ النسخ هنا: تجريبية» · «المسار نفسه: حقيقي في الكود» | Effect Craft E6 + Blender B3 |

### S3 · Scan and the doctor's screen · 2:28–3:41

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 3.1 | 2:28–2:32 | Blender: box on a bench, the handheld scanner enters frame and aims at the box barcode. | — | Blender B4 |
| 3.2 | 2:32–2:35 | Laser line sweeps the Code 128, the scanner's LED turns green, beep. | «MYR-DEMO-0006 ← demo-006» | Blender B4 + Effect Craft |
| 3.3 | 2:35–2:36 | Match cut: the laser line stretches across the frame and becomes the browser's loading bar. | — | Effect Craft E7 |
| 3.4 | 2:36–2:39 | G-05 desk, the real page corner-pinned on the monitor, push in until it becomes the window. | «صورة توضيحية» (chip, first 2 s only) | Gemini G-05 + R-01 + E7 |
| 3.5 | 2:39–2:43 | Full window at 100%, page settled on scenario 5. Chapter segment 3. | «بيانات تجريبية» (chip) | R-01 in E7 window |
| 3.6 | 2:43–2:49 | Close-up take (175%) of the patient banner. | «بيانات المريض» | R-02 |
| 3.7 | 2:49–2:55 | Close-up of the orders table: duloxetine (current), codeine (signing now). | «أدويته الحالية» · «الطلب الجديد» | R-03 |
| 3.8 | 2:55–2:58 | Wide again. Enlarged cursor moves to «توقيع الطلب (دون مقاطعة)», click ripple, card slides into the rail. | — | R-04 |
| 3.9 | 2:58–3:08 | **Peak 2.** Close-up of the Meyar Scale. Hollow ring at fast, needle at normal. A dim mask isolates the scale. Small formula appears outside the window. | «الحلقة: جيناته» · «المؤشر: الآن، بسبب دولوكسيتين» · «٣٫٠ × ٠٫٥ = ١٫٥» · source chip «Thomas et al. 2020» | R-05 + E7 callouts |
| 3.10 | 3:08–3:14 | Close-up of the second quote block (UM row, "applies if duloxetine is stopped"). | «لو أُوقف الدولوكسيتين» · «نص CPIC الحرفي» | R-06 |
| 3.11 | 3:14–3:18 | Close-up of the callability line and the footer. | «مصدر CYP2D6: نتيجة عدّ نسخ تجريبية» · «ينصح ولا يصف الدواء» | R-07 |
| 3.12 | 3:18–3:26 | Scenario 1 (demo-001, clopidogrel). Close-up of the alternative buttons, click «براسوغريل», toast. A5 comb "9 من 11" is visible on the card. | «البديل الأنسب بضغطة» | R-08, R-09 |
| 3.13 | 3:26–3:29 | Click «إرسال إلى الصيدلي», toast. | «إلى الصيدلي بضغطة» | R-10 |
| 3.14 | 3:29–3:35 | Scenario 3 (paroxetine order, patient already on codeine). Backward-sweep card, ring at normal, needle at poor, "2 × 0 = 0". | «يراجع الأدوية الحالية» | R-11 |
| 3.15 | 3:35–3:41 | Dashboard (dark instrument theme), wide then a slow push on the KPI row. | «سجل البطاقات · تجريبي» | R-12, R-13 |

### S4 · Medication Passport on the phone · 3:41–4:48

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 4.1 | 3:41–3:44 | G-06 hand and phone, real recording corner-pinned, push to the clean phone frame on paper. Chapter segment 4. | «صورة توضيحية» (chip, first 2 s) | Gemini G-06 + R-15 + E8 |
| 4.2 | 3:44–3:49 | Passport cover, profile demo-006. | «جواز الدواء · يعمل دون إنترنت» | R-15 in E8 |
| 4.3 | 3:49–3:57 | «جيناتي»: CYP2D6 card, plain-language line, ring and needle. Tap «اقرأ لي». The VO pauses for 2 s and the app's own Arabic voice is heard. | «كلام بسيط، بالعربي» | R-16 |
| 4.4 | 3:57–4:05 | «أدويتي»: type تيربينافين, tap إضافة. The needle slides to slow. | «يُعاد الحساب على الجوال» · «٣٫٠ × ٠ = ٠» | R-17 |
| 4.5 | 4:05–4:15 | «افحص دواء»: type بنادول → no gene guidance. Clear, type سولبادين → «لا تتناوله دون طبيبك». IMG-13 shelves blurred behind the phone. | «ثلاث إجابات فقط» · «لا يقول «آمن» أبداً» | R-18, R-19 + IMG-13 |
| 4.6 | 4:15–4:21 | «اعرض للصيدلي»: big type, current meds, enter the demo PIN, encrypted QR appears. IMG-14 blurred behind. | «عرض الصيدلي» · «رمز مشفّر برقم سري» | R-20 + IMG-14 |
| 4.7 | 4:21–4:31 | **Peak 3.** Two phones side by side. Right: the QR. Left: the reader with the airplane icon visible in the status bar, scans, «تم فك التشفير محلياً دون اتصال». Then the one-byte-tampered card is rejected. | «وضع الطيران» · «الرمز يحمل النتيجة، ليس رابطاً» · «تغيير بايت واحد = رفض» | R-21, R-22 |
| 4.8 | 4:31–4:40 | Triptych, 3 s each: elder mode on, caregiver view, ID-1 print preview. | «خط مكبّر» · «عرض المرافق» · «بطاقة مطبوعة» | R-23 |
| 4.9 | 4:40–4:48 | Kit tracker at phone width: received → processing → in your Passport. | «تتبّع العيّنة» | R-24 (kit `/tracker?lang=ar`) |

### S5 · T3 and T4, concepts side by side · 4:48–5:31

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 5.1 | 4:48–4:52 | Paper title card. Chapter segment 5. Dashed chip, large. | «تصوّرات للمستقبل» · «تصوّر — لم يُصنع» | Effect Craft E9 |
| 5.2 | 4:52–5:04 | Split. **Right: T3** assembles, then explodes (reuse F2 exploded animation). Screen texture = live `/urgent?lang=ar` (R-25). Labels in the right column only, max 3 at a time, two waves. | Wave A: «شاشة مدمجة بلا حاسوب» · «خرطوشة تدخل باتجاه واحد» · «ماسح يربط السوار بالخرطوشة» — Wave B: «وحدة القراءة: مفهوم، لم تُحدَّد الكيمياء» · «هيكل أملس سهل التعقيم» · source chip «جهاز جين واحد قائم: FDA K220026» | Blender B5 (`meyar_t3.blend`) + E9 |
| 5.3 | 5:04–5:16 | **Left: T4** explodes. Screen texture = Passport «عرض الطبيب» for demo-001 at device aspect (R-26), with CYP2D6 hatched. Labels in the left column only. | Wave A: «قرص بحجرة لكل متغيّر» · «غطاء ومحرّك دوران: مفهوم» · «شاشة خانات الجينات» — Wave B: «CYP2D6: لم يُفحص — عدد النسخ» · «مواد مرشّحة: Tritan أو Makrolon» · «الشاشة: برنامج مِعيار ببيانات تجريبية» | Blender B5 (`meyar_t4.blend`) + E9 |
| 5.4 | 5:16–5:25 | **Peak 4.** Both reassemble side by side, screens live. The T4 CYP2D6 hatched slot pulses once, and a 1 s miniature of the S2b gate flashes beside it (callback). | «عدّ النسخ مكانه المختبر» | Blender B5 + E9 |
| 5.5 | 5:25–5:31 | Full-width disclaimer card on paper. | «T3 وT4 تصوّرات: لم تُصنع ولم يُتحقق منها» · «لا ادعاء عن التكلفة» · «لا جهاز معتمد متعدد الجينات عند السرير بعد» | Effect Craft E9 |

### S6 · Close · 5:31–5:54

| Shot | Time | Picture | On-screen labels | Tool / source |
|---|---|---|---|---|
| 6.1 | 5:31–5:37 | Four tiles sweep in leftward: kit, lab, card, phone. | «من العيّنة إلى الوصفة الصحيحة» | Effect Craft E10 |
| 6.2 | 5:37–5:45 | Deep-juniper ground. The Al-Qatt band wipes across the bottom. Wordmark مِعيار builds, motto beneath. Hold 3 s of silence after the VO ends. | «مِعيار» · «الجرعة الصحيحة من أول مرة» | Effect Craft E10 |
| 6.3 | 5:45–5:54 | End card, held 9 s so judges can pause and scan. Team, university, hackathon, repo URL, live Passport URL with a plain-URL QR code, honesty line. | «هاكاثون الابتكار الصحي · جامعة الملك خالد» · «نموذج بحثي · بيانات تجريبية» · «الصور التوضيحية مولّدة بالذكاء الاصطناعي» + team names, `github.com/IyadAbouelseoud/meyar`, the Netlify URL | Effect Craft E10. Team: write the Arabic spelling of your three names yourselves; I won't guess them. |

---

## 9. Screen recording plan

### 9.1 Setup (once)

1. Pull `main` after the P0 fixes are merged.
2. Doctor side: `cd cds && npm start` (port 3000). I confirmed that without HAPI it falls back to `docs/fixtures/*.contract.json` and returns the demo-006 card. For the full stack use `bash docs/demo/run_e2e.sh` (needs Docker).
3. Kit side (for `/urgent` and `/tracker`): `cd kit && npm install && node server.js` (port 5174).
4. Passport for the T4 screen texture: `cd passport && npm install && npm run dev` (port 5173).
5. Chrome, fresh profile, no extensions, launched as `chrome --app="http://localhost:3000/preview?lang=ar" --window-size=1920,1080 --force-device-scale-factor=1`. App mode gives a chrome-less page. We draw the window frame ourselves.
6. Windows: pointer size 3, pointer trails off, notifications off (Focus Assist), taskbar auto-hide.
7. OBS: canvas 1920 × 1080, window capture of the Chrome app window, 60 fps, CQP 16–18, MKV (remux to MP4 after).
8. **Seed the dashboard:** before R-12, sign each scenario 2–3 times so the counters aren't zero. It's a mock log, which is honest, and labelled.
9. Reset between takes: reload the page. To reset the alert log, delete `cds/data/alerts.jsonl` and restart.

### 9.2 Doctor-side takes (1920 × 1080)

| Take | URL / state | Action | Zoom | Length |
|---|---|---|---|---|
| R-01 | `/preview?lang=ar`, scenario 5 | Idle, then slow scroll to show the banner, orders and rail | 100% | 15 s |
| R-02 | same | Hold on the patient banner | 175% | 8 s |
| R-03 | same | Hold on the orders table | 175% | 8 s |
| R-04 | same | Move to sign, click, card appears | 100% | 8 s |
| R-05 | after signing | Hold on the Meyar Scale | 200% | 12 s |
| R-06 | same | Hold on the "if duloxetine is stopped" quote | 175% | 8 s |
| R-07 | same | Hold on callability + footer | 175% | 6 s |
| R-08 | scenario 1 | Sign, card appears | 100% | 8 s |
| R-09 | scenario 1 | Click «براسوغريل», toast | 175% | 8 s |
| R-10 | scenario 1 | Click «إرسال إلى الصيدلي», toast | 175% | 6 s |
| R-11 | scenario 3 | Sign, backward-sweep card | 100% then 175% | 12 s |
| R-12 | `/dashboard?lang=ar` | Idle, hover the area chart once | 100% | 10 s |
| R-13 | same | Hold on the KPI row | 150% | 6 s |

### 9.3 Phone takes (real phone, Netlify HTTPS)

Open the Netlify Passport, choose demo-006, set Arabic. Use the phone's built-in screen recorder. Turn on "show touches" (Android developer options) so taps show. Clear notifications, use do-not-disturb, set the clock to show a neutral time.

| Take | Screen | Action | Length |
|---|---|---|---|
| R-15 | Cover | Idle 3 s, tap into the app | 6 s |
| R-16 | جيناتي | Scroll to CYP2D6, tap «اقرأ لي», let it read 3 s | 12 s |
| R-17 | أدويتي | Type تيربينافين, tap إضافة, return to جيناتي and show the needle moved | 15 s |
| R-18 | افحص دواء | Type بنادول, pause on the result | 8 s |
| R-19 | افحص دواء | Clear, type سولبادين, pause on the result | 8 s |
| R-20 | اعرض للصيدلي | Open, enter demo PIN 482916 twice, QR appears | 15 s |
| R-21 | Second phone, reader (`/scan.html`), **airplane mode on**, status bar visible | Scan R-20's QR from the first phone, enter PIN, decrypted | 15 s |
| R-22 | Reader | Scan the tampered QR (`docs/demo/out/demo-001-tampered.qr.svg`, shown on the laptop), rejected | 8 s |
| R-23 | Settings | Toggle «خط مكبّر»; open caregiver view; open print preview | 15 s |
| R-24 | Kit `/tracker?lang=ar&kit=…` at phone width | Idle on the status strip | 6 s |

Note: R-22 uses demo-001's tampered QR because that's the one the repo generates. The reader's result screen shows no patient data when it rejects, so the mismatch with demo-006 isn't visible. Say nothing about whose card it is.

### 9.4 Device screen textures (for Blender)

| Take | Source | Size | Notes |
|---|---|---|---|
| R-25 | kit `/urgent?lang=ar`, card area only | Record at the T3 screen's aspect (crop in OBS) | After P0-1, so the card is Arabic |
| R-26 | Passport «عرض الطبيب», profile **demo-001** | Record at the T4 screen's aspect | demo-001 has CYP2D6 not assessed, which is what T4 must show |

Export both as PNG sequences at the screen texture's pixel size. In Blender, use an Image Sequence texture on an emission shader (strength around 1.2), so the screen reads as lit, not pasted on.

---

## 10. Blender tasks

All files are in `hardware/blender/`. Keep the existing studio: seamless pale ground, same 50 mm camera language as F1/F2, AgX, EEVEE, 1920 × 1080, 30 fps. Every render gets its honesty label in the edit, not baked in, so labels follow the rules in section 7.

| ID | What | Start from | Output | Notes |
|---|---|---|---|---|
| B1 | Kit hero, lid open, exploded parts, macro on the barcodes | `meyar_t1.blend` | `B1_*.png` sequences + `B1_anchors.json` | Replace the barcode texture with **MYR-DEMO-0006**, generated with `kit/web/barcode128.js` so it's a real Code 128. Verify it by scanning a printed or on-screen render with any phone barcode app before using it. |
| B2 | Packing: tube into bag, bag into box, lid closes, box exits leftward | `meyar_anim_t1.blend` | `B2_*.png` | 9 s. If behind, cut (section 3). |
| B3 | Box re-enters from the left, settles on a bench | B2 scene | `B3_*.png` | 3 s |
| B4 | **New:** generic handheld scanner. Aim, laser sweep, green LED, 4 s | New object; G-08 is the shape reference | `B4_*.png` + anchors | Warm-white body, juniper trigger and band, dark scan window, no brand. Laser = thin emissive plane with a soft glow, red (it's a real scanner's colour, not a status colour). |
| B5 | T3 and T4 assemble → explode → reassemble, screens showing R-25/R-26 | `meyar_t3.blend`, `meyar_anim_t3.blend`, `meyar_t4.blend` | `B5_T3_*.png`, `B5_T4_*.png` + anchors | Render each device on its own transparent background, then place them side by side in the edit. That keeps the gutter clean. T4 has no exploded animation yet: separate the disc, lid, screen and shell vertically, 1.5 s. |
| B6 | Optional: phone prop with R-16 as a video texture | `meyar_f3_video2.blend` (generic phone prop) | 2 s hero | Only if time. The 2D phone frame (E8) is clearer anyway. |

---

## 11. Photo Craft tasks

1. Finish all Gemini images (procedure at the bottom of `03`) and export `meyar-grade.cube`.
2. Crop IMG-11 to 16:9. If the plate is lost, use G-04.
3. Make clean 16:9 crops of IMG-13 and IMG-14 for the phone backgrounds, blurred 20 px and darkened 15% so the phone stays the subject.
4. Export the box print artwork with the new barcode for B1, if the barcode lives in a texture image rather than a generated material.

---

## 12. Effect Craft compositions

### 12.0 Smoke test first (15 minutes, tonight)

Effect Craft 0.25.1 reports itself as alpha (about 45% ready for real work, GPU effects off). Before building anything:
1. Install the four font families (P1-7) and rescan fonts.
2. New 1920 × 1080 comp. Text layer «مِعيار — الجرعة الصحيحة من أول مرة» in Alexandria 800, and a second layer «فحصنا ٣٢ من ٣٥ موضعاً» in IBM Plex Sans Arabic.
3. Render one frame. Check: letters join, words run right to left, the kasra under مِ sits correctly, digits are Arabic-Indic, nothing is reversed.
4. Add `*1/*2x2` as a separate IBM Plex Mono layer and render again.

**If any check fails:** don't fight it. Build every Arabic label as HTML/CSS with the repo's `design/` tokens, render each one to a transparent PNG with Playwright (`omitBackground: true`) at 2×, and use Effect Craft only to animate those PNGs (position, opacity, masks, leader lines). Browsers shape Arabic perfectly. This is also the fallback if Effect Craft is too slow to render.

### 12.1 Compositions

| ID | Comp | Used in | Key details |
|---|---|---|---|
| E1 | Hook titles and the citation card | S0 | Kinetic type, letter build for `CYP2D6`, hatched scale |
| E2 | Chapter bar (template) | Whole video | 5 segments, fills right to left, saffron tick on the active segment, 0.4 s paper wipe at each chapter boundary |
| E3 | Kit labels and the custody chain | S1 | Reads `B1_anchors.json` for leader lines |
| E4 | Route, plate, VCF, PharmCAT, A5 comb | S2a | Comb = 35 teeth, 32 filled |
| E5 | CYP2D6 locus and four variants, the "same letters" trap | S2b | The most important graphic in the video. Give it the most care. |
| E6 | A8 gate with three lanes, honesty card | S2b | Gate closes with a single decelerating move, no shake |
| E7 | Browser window frame, loading-bar match cut, zoom morphs, dim masks, cursor highlight, callouts | S3 | Window spec in section 6 |
| E8 | Phone frame, tap ripples, two-phone split, callouts | S4 | Phone spec in section 6 |
| E9 | Device split screen, labels, title and disclaimer cards | S5 | Gutter rule, section 7 |
| E10 | Recap tiles, logo build with the Al-Qatt band, end card with QR | S6 | QR encodes only the plain Netlify URL |
| E11 | Chips library: honesty, source, persona, phase | Everywhere | One style, bottom zones only |

Render each comp to ProRes 4444 (with alpha) or a PNG sequence, and assemble in Film Craft. Keep Effect Craft out of the final export path.

---

## 13. Film Craft assembly and export

1. **Lock the voice first.** Import the best VO takes, cut them to the scene timecodes, and leave the breathing pauses in. This edit is the clock everything else follows.
2. **Tracks:** V1 backgrounds and plates · V2 screen recordings and Blender · V3 Effect Craft graphics · V4 labels and chips · A1 voice · A2 app sounds (read-aloud, scanner beep, UI clicks) · A3 SFX · A4 music.
3. **Grade:** apply `meyar-grade.cube` to the Gemini plates and the Blender renders only. **Never grade the screen recordings.** UI colours must stay exactly as the app draws them.
4. **Music:** one calm, minimal track, about 90–100 BPM, from a source whose licence allows this use (YouTube Audio Library, or Pixabay Music with its licence saved in `demo-video/audio/LICENSES.md`). The brief requires respecting IP. Duck under the voice. Drop to silence for 1 s at 2:04 ("متطابقين"). Lift slightly at 2:12, 2:58 and 4:21. Fade out under the end card, with the last 3 s of the logo in silence.
5. **SFX:** scanner beep, two or three soft UI clicks, a paper whoosh at chapter wipes. That's all.
6. **Captions:** build the Arabic caption track from `02`, export SRT. Don't burn it into exports A or B.
7. **Export A and B** with the settings in section 5. Use `loudnessLufs: -14`.

---

## 14. Asset manifest

| Asset | Status | Path |
|---|---|---|
| T1 kit still | Reuse | `/mnt/project-files/meyar-t1-saliva-kit.png`, `hardware/blender/renders/` |
| F2 turntable + T3 exploded clip | Reuse (S5, fallback S1) | `/mnt/project-files/meyar-f2-kit-turntable-t3-exploded.mp4` |
| F3 chain-of-custody clips | Reference only (they show MYR-DEMO-0001 on the phone) | `/mnt/project-files/meyar-f3-*.mp4` |
| T3, T4 concept stills | Reuse (fallback S5) | `/mnt/project-files/meyar-t3-…png`, `meyar-t4-…png` |
| Poster tier panel, AR | Reference for the S2 plate icon and S5 wording | `/mnt/project-files/f4-tier-panel-poster-ar.png` |
| Repo images IMG-11, 13, 14, 15 | Reuse | `design/imagery/img-NN-1920.webp` |
| Gemini G-01…G-10 | New | `demo-video/images/final/` |
| Blender B1–B6 | New | `demo-video/renders/` |
| Screen takes R-01…R-26 | New | `demo-video/recordings/` |
| Voice | New | `demo-video/audio/vo/` |
| Wordmark | Reuse | from `design/` (the wordmark used in the app header) |

---

## 15. Honesty and claims checklist

Every claim on screen or in the voice must pass this list. It comes from `AGENTS.md` §8 and the research-report validation.

- [ ] Every number has a row in `docs/sources.md`: 11,889 / CYP2D6 excluded (Goljan 2022), ≈4.4× ID errors (CDC LMBP, OR 4.39), 8 months at room temperature (BMC 2012), K220026 (FDA), activity ×0.5 / ×0 (Thomas 2020), CPIC thresholds (Caudle 2020).
- [ ] **Not used anywhere:** PREPARE "24%", UF "20%", PROGRESS "90%", GeT-RM "9/10", and no "a quarter of all medicines" for CYP2D6 (no source row).
- [ ] No cost, price or "cheaper/more available" claim for T3 or T4.
- [ ] T3/T4 always carry «تصوّر — لم يُصنع». T4 never answers CYP2D6.
- [ ] The CN result is called a test (mock) result on screen (2.12) and in the voice.
- [ ] The kit is "designed, software working", never "manufactured".
- [ ] The patient side never shows "safe", a tick, or green as a verdict.
- [ ] CPIC text is quoted verbatim. Nothing in the video suggests AI writes doses.
- [ ] Germline only. If cancer comes up, it's "tumour profiling is separate".
- [ ] AI images are tagged «صورة توضيحية», and the end card says they're AI-generated.
- [ ] The `/compare` page is not in the video.

---

## 16. QA before upload

| # | Check | How |
|---|---|---|
| Q1 | Arabic shaping and direction in every label | Step through every label at 100% |
| Q2 | No English UI text on any app screen except CPIC verbatim quotes, gene/allele names, URLs | Scrub S3–S5 |
| Q3 | Reading time | Every label meets 1.0 s + chars ÷ 14 (section 17 table) |
| Q4 | Muted test | Watch the whole video muted with Arabic captions on. Does the story survive? |
| Q5 | Small-screen test | Watch the export on a phone. Is every label readable? |
| Q6 | 720p test | Set YouTube to 720p. Is the 20 px text still legible? |
| Q7 | Overlap | Contact sheet of every 10th frame for labelled shots: no touching boxes, no crossing lines |
| Q8 | Honesty | Section 15 ticked by someone who didn't edit it (Renad or Dua) |
| Q9 | Loudness | −14 LUFS ±1, true peak ≤ −1 dBTP, voice always clearly above the music |
| Q10 | File B size | ≤ 95 MB, plays in Chrome and in the Windows default player |
| Q11 | First frame | Thumbnail shows G-01 with the persona chip, not black |
| Q12 | A fresh viewer | Someone outside the team watches once. Ask: "What does Meyar do, and what was the hard gene?" If they can't answer both, fix the part they missed. |

---

## 17. Automated checks run on this plan

I ran these checks with scripts on the files themselves, not by eye:

- **Voice pace per scene** (from `02`): no scene above 2.2 words/s (the scan beat and the close are deliberately sparse), about 650 words in 5:54 overall. S0 was first written at 2.91 words/s. I trimmed it and moved the cut to 0:26.
- **Label reading time vs shot length:** the table below the scripts' output shows each shot's total required label time against its duration. Any shot marked over budget must hold its labels across the next shot or lose a label.
- **Banned-claims scan:** all three files searched for PREPARE, 24%, 20%, 90%, 9/10, a quarter, cheaper, cost reduction, and "آمن" used as a verdict.

(Results are appended in section 18 by the check script.)

---

## 18. Check results

Run on 24 Nov 2026 against the final files.

### Voice pace (02-voiceover-script-ar.md)
```
S0      26s   54w 2.08 w/s  الافتتاح
S1      46s   94w 2.04 w/s  العُدّة
S2      76s    0w 0.00 w/s  المختبر المركزي
S2a     32s   63w 1.97 w/s  المرحلة الأولى: قراءة الحروف
S2b     44s   96w 2.18 w/s  المرحلة الثانية: عدّ النسخ
S3      73s    0w 0.00 w/s  المسح وشاشة الطبيب
S3a      8s    5w 0.62 w/s  المسح
S3b     42s   73w 1.74 w/s  الطبيب يوقّع الوصفة
S3c     23s   43w 1.87 w/s  البدائل، الصيدلي، الأدوية الحالية، السجل
S4      67s  123w 1.84 w/s  جواز الدواء على الجوال
S5      43s   76w 1.77 w/s  الأجهزة: تصوّرات
S6      23s   26w 1.13 w/s  الختام
TOTAL 653 words 354 s 1.84 w/s
```

### Label reading time vs shot length (this file, section 8)
Rule: each wave of up to 3 labels needs 1.0 s + longest label's characters ÷ 14, plus 0.25 s per extra label. Chips aren't timed.
```
0.1     6s need  0.0s  labels=0 chips=1 
0.2     4s need  1.7s  labels=1 chips=0 
0.3     6s need  2.1s  labels=1 chips=0 
0.4     5s need  3.5s  labels=2 chips=1 
0.5     5s need  3.8s  labels=5 chips=0 
1.1     6s need  0.0s  labels=0 chips=1 
1.2    14s need  5.7s  labels=5 chips=0 
1.3     8s need  4.2s  labels=2 chips=1 
1.4     9s need  6.0s  labels=6 chips=0 
1.5     9s need  3.1s  labels=2 chips=1 
2.1     4s need  3.4s  labels=1 chips=0 
2.2     4s need  2.7s  labels=1 chips=1 
2.3     5s need  2.4s  labels=1 chips=0 
2.4     6s need  2.9s  labels=1 chips=0 
2.5     5s need  2.1s  labels=1 chips=0 
2.6     8s need  3.6s  labels=3 chips=0 
2.7     4s need  2.5s  labels=1 chips=0 
2.8     4s need  2.4s  labels=1 chips=1 
2.9    12s need  5.1s  labels=4 chips=0 
2.10    8s need  2.9s  labels=1 chips=0 
2.11   10s need  3.1s  labels=3 chips=1 
2.12    6s need  3.2s  labels=2 chips=0 
3.1     4s need  0.0s  labels=0 chips=0 
3.2     3s need  2.7s  labels=1 chips=0 
3.3     1s need  0.0s  labels=0 chips=0 
3.4     3s need  0.0s  labels=0 chips=1 
3.5     4s need  0.0s  labels=0 chips=1 
3.6     6s need  1.9s  labels=1 chips=0 
3.7     6s need  2.2s  labels=2 chips=0 
3.8     3s need  0.0s  labels=0 chips=0 
3.9    10s need  3.6s  labels=3 chips=1 
3.10    6s need  2.8s  labels=2 chips=0 
3.11    4s need  3.7s  labels=2 chips=0 
3.12    8s need  2.4s  labels=1 chips=0 
3.13    3s need  2.2s  labels=1 chips=0 
3.14    6s need  2.5s  labels=1 chips=0 
3.15    6s need  2.5s  labels=1 chips=0 
4.1     3s need  0.0s  labels=0 chips=1 
4.2     5s need  3.1s  labels=1 chips=0 
4.3     8s need  2.3s  labels=1 chips=0 
4.4     8s need  2.9s  labels=2 chips=0 
4.5    10s need  2.3s  labels=2 chips=0 
4.6     6s need  2.5s  labels=2 chips=0 
4.7    10s need  3.6s  labels=3 chips=0 
4.8     9s need  2.4s  labels=3 chips=0 
4.9     8s need  1.9s  labels=1 chips=0 
5.1     4s need  2.4s  labels=2 chips=0 
5.2    12s need  7.5s  labels=5 chips=1 
5.3    12s need  7.4s  labels=6 chips=0 
5.4     9s need  2.6s  labels=1 chips=0 
5.5     6s need  4.5s  labels=3 chips=0 
6.1     6s need  3.1s  labels=1 chips=0 
6.2     8s need  3.0s  labels=2 chips=0 
6.3     9s need  4.4s  labels=3 chips=0 
shots over budget: 0  shots with >42-char label: 0
```

First run found 1 shot over budget (5.5) and 4 labels over 42 characters. All were fixed: 5.5 now runs 6 s, and the long labels were split or shortened. The output above is the re-run.

### Banned-claims scan
Searched all three files for PREPARE, 24%, 20%, 90%, 9/10, quarter/ربع, cheaper/أرخص, cost/تكلفة, آمن, Reem Kufi. Every hit is either inside a "never use" list, the honesty disclaimer «لا ادعاء عن التكلفة», the app's own refusal to say «آمن», or a false match (أربعة, three-quarter view). No live claim found.

### Live app checks
- `POST /cds-services/meyar-pgx` with demo-006 + codeine returned the UM → acting-NM card with the duloxetine line and the 'applies if duloxetine is stopped: avoid codeine' row (CDS run locally on Node 22, fixture fallback, no HAPI).
- `/preview?lang=ar` screenshot: page chrome Arabic, card body English → P0-1.
- `/dashboard?lang=ar` screenshot: fully Arabic.
- Passport `dist` at 390 px, `?lang=ar`: fully Arabic; tabs جيناتي · أدويتي · افحص دواء · عرض الطبيب; profiles demo-001/002/006; read-aloud unavailable without an ar-SA voice → P1-6.
- `tables/otc_products.json` contains بنادول and سولبادين (paracetamol + codeine); `tables/cyp_inhibitors.json` lists terbinafine as a strong CYP2D6 inhibitor and duloxetine as moderate.
- Effect Craft 0.25.1: alpha, GPU off, brand fonts not installed → section 12.0 and P1-7. Film Craft export supports VBR 2-pass, `loudnessLufs` and SRT/VTT caption sidecars.

### Not verified (for you to check)
- The CYP2D6 locus schematic against PharmVar's structural-variant figure (shot 2.9).
- The six psychology papers I didn't re-open today (Ambady 1993, Loewenstein 1994, Small 2007, Kahneman 1993, Zacks 2007, Reber 1999): check DOIs before citing them publicly. They only steer the edit; none appears on screen.
- The Code 128 for MYR-DEMO-0006 scans correctly (B1).
- The form's closing hour on 25 Nov.
