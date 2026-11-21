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
- The T1 label "Kit design — software working" is the label the F1 prompt set; it becomes true only once F3 (chain-of-custody software) ships. Callout Arabic is a draft for the C4 review.
