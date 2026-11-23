# hardware/blender — F1 hero renders

Three labelled stills of Meyar's hardware tiers, built entirely from code so anyone can rebuild them.

| Render | Tier | Baked-in label |
|---|---|---|
| `renders/meyar-t1-saliva-kit.png` | T1 saliva kit: tube, Code 128 label, funnel, specimen bag, mailer | Kit design — software working |
| `renders/meyar-t3-single-gene-cathlab-unit-concept.png` | T3 single-gene (CYP2C19) cath-lab unit | Concept render — not built |
| `renders/meyar-t4-multi-gene-reader-concept.png` | T4 multi-gene reader, CYP2D6 shown as not assessed | Concept render — not built |

Why each feature looks the way it does, with sources: [`DESIGN-PLAN.md`](DESIGN-PLAN.md).

## Rebuild (Windows, from the repo root)

```powershell
uv run --no-project python hardware/blender/art/make_art.py          # printed surfaces + captions (needs Edge or Chrome)
foreach ($h in "t1","t3","t4") { & "D:\blender.exe" --background --factory-startup --python hardware/blender/build_renders.py -- --hero $h --samples 128 }
uv run --no-project python hardware/blender/compose.py               # bakes the labels onto renders/*.png
```

Any Blender 5.x works (built and tested on 5.3.0); point the command at your own `blender.exe`. Add `--pct 40 --samples 24` for a quick preview, or `--no-render` to only rebuild a `.blend`.

## Files

- `art/make_art.py` — every printed surface (tube label, mailer lid/side/end, cartridge label, device screens, caption strips) as HTML in the Meyar fonts and token colours, rasterised by headless Edge/Chrome so Arabic is shaped correctly. Contains its own Code 128 (set B) encoder.
- `art/out/*.png` — the generated artwork, kept so the `.blend` files can be opened without rebuilding.
- `build_renders.py` — builds one scene per hero (studio sweep, three area lights, Cycles, AgX), saves `meyar_<hero>.blend` with textures packed, and renders `raw/<hero>.png` (git-ignored).
- `compose.py` — alpha-composites the caption strip onto each raw render.

## Honesty rules this folder follows

- All data on the props is mock: kit ID `MYR-DEMO-0001`, "Demo data" chips, a mock lab address.
- No number appears on any render apart from the mock kit ID and step indices. No times, prices, accuracy or capacity.
- T3 and T4 screens say "Concept · not built" and show no results. T4 lists gene slots only, with CYP2D6 hatched as "Not assessed — copy number" (AGENTS.md §8b).
- No real company's logo or product shape. T3 avoids the box-plus-laptop layout of the cleared CYP2C19 devices; the tube shows no buffer-release mechanism (patented, see DESIGN-PLAN.md).
- Arabic strings are drafts for the C4 native-speaker review.

## F2 — animation for the video's what's-next segment

`renders/meyar-f2-kit-turntable-t3-exploded.mp4`: 1920 × 1080, 30 fps, H.264, 13.5 s (405 frames).

| Time | Shot | Label on every frame |
|---|---|---|
| 0–6.5 s | T1 saliva kit turntable: one full turn, slight push-in | Kit design — software working |
| 6–13.5 s (0.5 s cross-fade) | T3 cath-lab unit exploded view: shell lifts, screen layers separate, concept internals rise, cartridge slides out, then six callouts fade in | Concept render — not built |

`renders/meyar-f2-contact-sheet.jpg` shows six frames for review where the MP4 does not preview.

### Rebuild (Windows, from the repo root)

```powershell
foreach ($s in "t1","t3") { & "D:\blender.exe" --background --factory-startup --python hardware/blender/build_animation.py -- --shot $s }
uv run --no-project python hardware/blender/art/make_video_art.py      # captions + callouts (needs Edge or Chrome)
uv run --no-project python hardware/blender/encode_video.py            # needs ffmpeg/ffprobe on PATH
```

EEVEE renders about 9 s a frame on an Intel Arc laptop GPU, so both shots take about an hour. Frames go to `frames/` (git-ignored); a stopped render resumes where it left off. `--step 28 --pct 50` renders a quick contact set to `anim/test_<shot>/`, `--engine cycles` switches engine, `--no-render` only saves `meyar_anim_<shot>.blend`.

### Files

- `build_animation.py` — imports the F1 builders from `build_renders.py`, re-lays the kit around the mailer for the turntable, adds generic T3 internals (tray, board, reader module, scanner) hidden inside the shell, bakes the explode and camera moves per frame (decelerate-only easing), and writes `anim/t3_anchors.json` (callout anchor positions on the final frame).
- `art/make_video_art.py` — 1920 × 1080 caption overlays and one PNG per callout, via `make_art.py`.
- `encode_video.py` — overlays, staggered callout fades, cross-fade, libx264 CRF 18, then checks codec, size, frame rate, frame count and the 50 MB limit with ffprobe.

### Honesty rules for the clip

- T3's internals are illustrative shapes, not a design: the reader module callout says "chemistry not chosen", and the caption says "Internals are illustrative". No size, time, price or accuracy appears.
- The callouts state only design intent from `DESIGN-PLAN.md` (built-in screen, keyed cartridge, wristband-to-cartridge scanner, sealed button and shell). None claims a clinical benefit.
- The T1 label "Kit design — software working" is the label the F1 prompt set (the chain-of-custody software is F3); the physical kit itself is a design. Callout Arabic is a draft for the C4 review.

## F3 render — the chain-of-custody software on the T1 kit

| Render | What the phone shows | Label on the image |
|---|---|---|
| `renders/meyar-f3-intact-kit-software.png` | Kit `MYR-DEMO-0001`, events 4–6 and "Chain intact … (FHIR)" | Kit design — software working |
| `renders/meyar-f3-tampered-kit-software.png` | The same kit after event 4 was edited without re-sealing: "Chain broken here" | Kit design — software working |

The phone screen is a **real capture of the running F3 software** (`kit/`), with Verify reading the chain back from the local HAPI. It is not a drawing. The phone and the stand are generic, unbranded props, and the physical kit is a design. Only T1 appears; nothing is placed on T3 or T4. The kit ID on the phone is the same one printed on the mailer barcode.

### Rebuild (Windows, from the repo root)

```powershell
docker compose up -d hapi
cd kit; npm start                                    # leave running; kit MYR-DEMO-0001 must have its six events
uv run --no-project --python 3.12 --with playwright python hardware/blender/art/make_f3_art.py   # captures + captions (needs Edge)
foreach ($v in "intact","tampered") { & "D:\blender.exe" --background --factory-startup --python hardware/blender/build_f3_render.py -- --variant $v --samples 128 }
```

`make_f3_art.py` uses the kit's own demo control to edit event 4 for the tampered capture, then restores it and checks that the chain verifies again. `build_f3_render.py` reuses `build_t1()` from `build_renders.py`, adds the phone and stand, renders in Cycles at 3000 × 2000, and bakes on the caption strip.

## F3 video — the six scans live on the T1 kit

`renders/meyar-f3-kit-scans-live.mp4`: 1920 × 1080, 30 fps, H.264, 15 s (450 frames). `renders/meyar-f3-video-contact-sheet.jpg` shows one frame every 2 s.

| Time | What moves | What the phone shows (a real capture after that scan) | Callout (Arabic first) |
|---|---|---|---|
| 0–4 s | Kit at rest, then the funnel docks on the tube and the sample fills | Scans 1 → 2 recorded | ١ صُرفت العُدّة · ٢ جُمعت العيّنة |
| 4–7 s | The funnel goes back, the cap twists on | Scan 3 | ٣ خُتمت الأنبوبة |
| 7–11 s | The tube goes into the mailer, the mailer leaves and comes back | Scans 4 → 5 | ٤ شُحنت · ٥ استلمها المختبر |
| 12–13 s | — | Scan 6, chain intact (FHIR) | ٦ اكتمل التنميط · سُلِّم للمحرّك |
| 13.3–15 s | — | Scan 4 edited after the fact: "Chain broken here" | ! السلسلة مكسورة هنا |

"Kit design — software working" and the honesty note stay on screen for the whole clip. The phone screens come from the kit's own API: the art script resets the demo kit, records each scan, captures the screen after each one, then edits and restores scan 4.

```powershell
uv run --no-project --python 3.12 --with playwright python hardware/blender/art/make_f3_video_art.py   # kit app + HAPI running
& "D:\blender.exe" --background --factory-startup --python hardware/blender/build_f3_video.py         # frames/f3 (EEVEE)
uv run --no-project python hardware/blender/encode_f3_video.py                                       # MP4 + contact sheet
```

## F3 video v2 — paced chain-of-custody demo (replaces the 15 s cut for presentations)

`renders/meyar-f3-kit-chain-of-custody.mp4`: 1920 × 1080, 30 fps, H.264, 57 s (1,710 frames). `renders/meyar-f3-video2-contact-sheet.jpg` shows one frame every 4 s.

- **Wide opening:** arrow callouts name the phone, tube, funnel, bag and mailer.
- **Phone close-up:** scan 1 is saved as a FHIR record.
- **Tube close-up:** the funnel docks and the sample fills, then the funnel goes back and the cap twists shut. A live phone inset shows the real screen after scans 2 and 3.
- **Packing:** the mailer lid opens, the capped tube is laid in the leak-proof bag on its absorbent pad, the bag goes into the mailer and the lid closes. Nothing disappears.
- **Shipped, then received:** the mailer leaves frame and comes back.
- **Phone close-ups:** the chain verifies from FHIR, then scan 4 is edited later and verify flags it.
- **End card.**

The callouts are pinned to 3D anchors that are projected on their hold frames (`anim/f3v2_anchors.json`). Arabic comes first; the Arabic is a draft for the C4 review.

```powershell
& "D:\blender.exe" --background --factory-startup --python hardware/blender/build_f3_video2.py -- --no-render      # scene + anchors
uv run --no-project --python 3.12 --with playwright python hardware/blender/art/make_f3_video2_art.py                # overlays (after make_f3_video_art.py)
& "D:\blender.exe" --background --factory-startup --python hardware/blender/build_f3_video2.py                       # frames/f3v2_hd (EEVEE, ~2.5 h)
uv run --no-project python hardware/blender/encode_f3_video2.py
```
