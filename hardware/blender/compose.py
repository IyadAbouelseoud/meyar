"""Bake the status label and caption onto each raw Blender render.

Run after build_renders.py:  uv run --no-project python hardware/blender/compose.py
In:  hardware/blender/raw/<hero>.png  +  hardware/blender/art/out/caption_<hero>.png
Out: hardware/blender/renders/meyar-<hero>-<name>.png  (3000 x 2000)
"""
import pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "renders"
OUT.mkdir(exist_ok=True)
NAMES = {"t1": "saliva-kit", "t3": "single-gene-cathlab-unit-concept", "t4": "multi-gene-reader-concept"}

for hero, name in NAMES.items():
    raw = Image.open(HERE / "raw" / f"{hero}.png").convert("RGBA")
    assert raw.size == (3000, 2000), f"{hero}: render is {raw.size}, expected 3000x2000"
    cap = Image.open(HERE / "art" / "out" / f"caption_{hero}.png").convert("RGBA")
    assert cap.size == raw.size
    out = Image.alpha_composite(raw, cap).convert("RGB")
    path = OUT / f"meyar-{hero}-{name}.png"
    out.save(path, optimize=True)
    print("wrote", path.relative_to(HERE.parents[1]))
