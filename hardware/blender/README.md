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
