"""F2 overlay artwork for the 1920 x 1080 animation, in the Meyar fonts and token colours.

Reuses make_art.py (fonts, tokens, headless Edge/Chrome rasteriser) so Arabic is shaped correctly.
Run after build_animation.py --shot t3 (it writes anim/t3_anchors.json):
  python hardware/blender/art/make_video_art.py
Out (hardware/blender/art/out/):
  vcap_t1.png, vcap_t3.png      full-frame caption per shot: wordmark, status label, note, title
  vcall_<part>.png              one full-frame transparent PNG per T3 callout (faded in one by one)

No number appears on any overlay. Callout claims are the design rationale in DESIGN-PLAN.md; the
internals are labelled as concept. Arabic strings are drafts for the C4 native-speaker review.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import make_art as A  # noqa: E402

C, MARK, page = A.C, A.MARK, A.page
W, H = 1920, 1080
ANCHORS = HERE.parent / "anim" / "t3_anchors.json"


def caption(name, status, title_ar, title_en, note):
    body = f"""
<div style="width:{W}px;height:{H}px;position:relative">
  <div style="position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:16px;color:{C['juniper.900']}">
    <span style="font-size:40px;display:flex;color:{C['juniper.700']}">{MARK}</span>
    <span class="disp" style="font-weight:800;font-size:48px;line-height:1">مِعيار</span>
    <span style="font-family:'Mono';font-size:19px;letter-spacing:.18em;color:{C['ink.2']}">MEYAR</span>
  </div>
  <div style="position:absolute;left:72px;right:72px;bottom:58px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <div style="display:inline-flex;align-items:center;padding:11px 20px;border-radius:5px;background:{C['ink.1']};color:{C['paper.0']};font-family:'PlexL';font-weight:600;font-size:34px">{status}</div>
      <div style="font-family:'PlexL';font-size:22px;color:{C['ink.2']};margin-top:14px;max-width:960px;line-height:1.4">{note}</div>
    </div>
    <div style="text-align:right">
      <div class="disp" style="direction:rtl;font-weight:800;font-size:60px;color:{C['ink.1']};line-height:1.2">{title_ar}</div>
      <div style="font-family:'AlexandriaL';font-weight:200;font-size:37px;color:{C['ink.2']}">{title_en}</div>
    </div>
  </div>
</div>"""
    page(name, W, H, body)


# part -> (side, label y, English, Arabic draft)
CALLOUTS = {
    "screen":    ("R", 150, "Screen built in — no separate laptop", "شاشة مدمجة — بلا حاسوب منفصل"),
    "shell":     ("R", 300, "Smooth sealed shell, easy to wipe clean", "هيكل أملس محكم، سهل التنظيف"),
    "button":    ("R", 470, "One sealed button", "زر واحد محكم الإغلاق"),
    "reader":    ("L", 420, "Reader module — concept, chemistry not chosen", "وحدة القراءة — مفهوم، لم تُحدَّد الكيمياء"),
    "scanner":   ("L", 560, "Scanner binds the wristband to the cartridge", "ماسح يربط سوار المريض بالخرطوشة"),
    "cartridge": ("L", 700, "Keyed CYP2C19 cartridge, fits one way only", "خرطوشة CYP2C19 — تدخل باتجاه واحد"),
}
LEFT_EDGE, RIGHT_EDGE = 640, 1330   # where the leader line meets the label block


def callout(part, ax, ay, side, ly, en, ar):
    edge = LEFT_EDGE if side == "L" else RIGHT_EDGE
    ink = C["ink.1"]
    line = (f'<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">'
            f'<line x1="{ax}" y1="{ay}" x2="{edge}" y2="{ly}" stroke="{ink}" stroke-width="2"/>'
            f'<circle cx="{ax}" cy="{ay}" r="7" fill="{C["paper.0"]}" stroke="{ink}" stroke-width="3"/>'
            f'<circle cx="{edge}" cy="{ly}" r="3.5" fill="{ink}"/></svg>')
    if side == "L":
        box = f"right:{W - edge + 14}px;text-align:right"
    else:
        box = f"left:{edge + 14}px;text-align:left"
    text = (f'<div style="position:absolute;{box};top:{ly - 30}px;white-space:nowrap">'
            f'<div style="font-family:\'PlexL\';font-weight:600;font-size:24px;color:{ink};line-height:1.25">{en}</div>'
            f'<div class="ar" style="font-size:21px;font-weight:500;color:{C["ink.2"]};line-height:1.5">{ar}</div></div>')
    page(f"vcall_{part}", W, H, f'<div style="width:{W}px;height:{H}px;position:relative">{line}{text}</div>')


if __name__ == "__main__":
    caption("vcap_t1", "Kit design — software working", "عُدّة جمع اللعاب", "T1 · Saliva collection kit",
            "Tube, barcode label and mailer. The physical kit is a design, not manufactured. Demo data: the kit ID is mock.")
    caption("vcap_t3", "Concept render — not built", "وحدة جين واحد", "T3 · Single-gene cath-lab unit",
            "Roadmap concept for CYP2C19 near the cath lab. Internals are illustrative. Not built, not validated. "
            "Research prototype — not for clinical use.")
    anchors = json.loads(ANCHORS.read_text(encoding="utf-8"))["anchors"]
    for part, (side, ly, en, ar) in CALLOUTS.items():
        ax, ay = anchors[part]
        callout(part, ax, ay, side, ly, en, ar)
