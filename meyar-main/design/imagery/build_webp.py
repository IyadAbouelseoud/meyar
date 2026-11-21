#!/usr/bin/env python3
"""Convert Nano Banana renders in design/imagery/raw/ into web-ready WebP files.

Drop each render into raw/ named by its ID (img-02.png, img-15.jpg ...). Run:
    python3 design/imagery/build_webp.py
For each ID it centre-crops to the slot's aspect ratio, strips all metadata,
and writes <id>.webp (1280 px wide), <id>-640.webp and <id>-1920.webp,
then rewrites manifest.json. Needs Pillow only.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
WIDTHS = {"-640": 640, "": 1280, "-1920": 1920}
QUALITY = 80

# ID -> (aspect ratio w, h, alt EN). Must match PROMPTS.md.
SLOTS = {
    "img-01": (16, 9, "Terraced mountain village in Aseer at first light"),
    "img-02": (16, 10, "An older woman reads her phone by a window in a whitewashed home"),
    "img-03": (4, 3, "A pharmacist's hands pass a paper bag of medicine across a counter"),
    "img-04": (4, 3, "Saliva collection tube and sealed mailer on a stone surface"),
    "img-05": (16, 10, "A clinician's hands beside a tablet at a consulting desk"),
    "img-06": (3, 2, "The printed Meyar card on a majlis table beside a dallah and dates"),
    "img-07": (21, 7, "Juniper forest on the Aseer escarpment at dawn"),
    "img-08": (1, 1, "Close detail of hand-painted Al-Qatt Al-Asiri wall patterns"),
    "img-09": (1, 1, "A set of old brass apothecary weights on linen"),
    "img-10": (4, 5, "A young man helps his grandfather with a phone, seen from behind"),
    "img-11": (3, 2, "A gloved hand loads a sample plate in a clinical laboratory"),
    "img-12": (16, 9, "A daylit hospital corridor with soft motion blur"),
    "img-13": (16, 9, "Pharmacy shelves of plain medicine boxes in soft focus"),
    "img-14": (4, 3, "A hand holds the printed card to a scanner at a pharmacy counter"),
    "img-15": (4, 5, "A single capsule resting on the pan of a brass balance"),
}


def crop_to(im, w, h):
    target = w / h
    iw, ih = im.size
    if iw / ih > target:
        nw = round(ih * target)
        left = (iw - nw) // 2
        return im.crop((left, 0, left + nw, ih))
    nh = round(iw / target)
    top = (ih - nh) // 2
    return im.crop((0, top, iw, top + nh))


def main():
    manifest = {}
    found = sorted(p for p in RAW.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    if not found:
        print("No renders in", RAW)
    for src in found:
        key = src.stem.lower()
        if key not in SLOTS:
            print(f"skip {src.name}: not an ID in PROMPTS.md", file=sys.stderr)
            continue
        w, h, alt = SLOTS[key]
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        im = crop_to(im, w, h)
        out = {}
        for suffix, width in WIDTHS.items():
            width = min(width, im.width)
            size = (width, round(width * h / w))
            dst = HERE / f"{key}{suffix}.webp"
            im.resize(size, Image.LANCZOS).save(dst, "WEBP", quality=QUALITY, method=6)  # no exif/icc passed: metadata stripped
            out[dst.name] = {"width": size[0], "bytes": dst.stat().st_size}
        manifest[key] = {"ratio": f"{w}/{h}", "alt": alt, "sizes": out, "source": src.name}
        print(f"{key}: " + ", ".join(f"{n} {v['width']}px {v['bytes'] // 1024} KB" for n, v in out.items()))
    old = json.loads((HERE / "manifest.json").read_text()) if (HERE / "manifest.json").exists() else {}
    old.update(manifest)
    (HERE / "manifest.json").write_text(json.dumps(old, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
