"""Bake the status label and caption onto each raw Blender render.

Runs inside Blender (uses its bundled numpy, no extra dependency):
  blender --background --factory-startup --python hardware/blender/compose.py
In:  hardware/blender/raw/<hero>.png  +  hardware/blender/art/out/caption_<hero>.png
Out: hardware/blender/renders/meyar-<hero>-<name>.png  (3000 x 2000)
"""
import pathlib
import bpy
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "renders"
OUT.mkdir(exist_ok=True)
NAMES = {"t1": "saliva-kit", "t3": "single-gene-cathlab-unit-concept", "t4": "multi-gene-reader-concept"}


def load(path):
    img = bpy.data.images.load(str(path))
    img.colorspace_settings.name = "Non-Color"  # treat stored bytes as-is: no colour transform on the way through
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    return img, px.reshape(h, w, 4)


for hero, name in NAMES.items():
    raw_img, raw = load(HERE / "raw" / f"{hero}.png")
    assert tuple(raw_img.size) == (3000, 2000), f"{hero}: render is {tuple(raw_img.size)}, expected 3000x2000"
    cap_img, cap = load(HERE / "art" / "out" / f"caption_{hero}.png")
    assert tuple(cap_img.size) == tuple(raw_img.size)
    a = cap[..., 3:4]
    out = raw.copy()
    out[..., :3] = cap[..., :3] * a + raw[..., :3] * (1 - a)
    out[..., 3] = 1.0
    res = bpy.data.images.new(f"out_{hero}", 3000, 2000, alpha=False)
    res.colorspace_settings.name = "Non-Color"
    res.pixels.foreach_set(out.ravel())
    path = OUT / f"meyar-{hero}-{name}.png"
    res.filepath_raw = str(path)
    res.file_format = "PNG"
    res.save()
    print("wrote", path)
