"""F3 video v2 overlays (1920x1080, transparent): beat labels, arrow callouts pinned to the projected
3D anchors (anim/f3v2_anchors.json from build_f3_video2.py), a live phone inset, and the end card.
Arabic first; Arabic strings are drafts for the C4 review. No number other than scan indices.

Run from the repo root (after make_f3_video_art.py and build_f3_video2.py --no-render):
  uv run --no-project --python 3.12 --with playwright python hardware/blender/art/make_f3_video2_art.py
"""
import json, sys, base64, pathlib

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import make_f3_art as M  # noqa: E402  (Playwright page())
make_art = M.make_art
C, OUT = make_art.C, make_art.OUT
W, H = 1920, 1080
AN = json.loads((HERE.parent / "anim" / "f3v2_anchors.json").read_text())

BEATS = [("١", "صُرفت العُدّة", "Kit issued"), ("٢", "جُمعت العيّنة", "Sample collected"),
         ("٣", "خُتمت الأنبوبة", "Tube sealed"), ("٤", "شُحنت", "Shipped"),
         ("٥", "استلمها المختبر", "Received at lab"), ("٦", "اكتمل التنميط · سُلِّم للمحرّك", "Genotyped · file handed to the engine"),
         ("!", "السلسلة مكسورة هنا", "Chain broken here")]

# key: (Arabic, English, direction of the label from the anchor (dx, dy), tone)
CALLOUTS = {
    "phone": ("الهاتف: برنامج العُدّة يعمل", "Phone running the kit software (real screen)", (60, -250), "brand"),
    "tube": ("أنبوبة الجمع · ملصق Code 128", "Collection tube · Code 128 label", (-80, 170), "brand"),
    "funnel": ("القمع", "Funnel", (-300, 150), "brand"),
    "bag": ("كيس عيّنات محكم + وسادة ماصّة", "Leak-proof bag + absorbent pad", (-60, 230), "brand"),
    "mailer": ("صندوق الإرسال · ملصق وQR", "Mailer · return label and QR", (120, -230), "brand"),
    "phone_scan1": ("كل مسح يُحفظ كسجل FHIR", "Each scan is saved as a FHIR Provenance record", (230, -120), "brand"),
    "funnel_dock": ("اللعاب يدخل عبر القمع", "Saliva goes in through the funnel", (230, 80), "brand"),
    "cap_on": ("الغطاء يُغلق بإحكام", "Cap twisted shut", (-480, -60), "brand"),
    "bag_tube": ("الأنبوبة داخل الكيس المحكم", "Capped tube sealed in the bag", (330, -260), "brand"),
    "pad": ("وسادة لامتصاص أي تسرّب", "Pad to absorb leaks", (180, 150), "brand"),
    "mailer_closed": ("أُغلق الصندوق وجاهز للشحن", "Mailer closed, ready to ship", (-430, -150), "brand"),
    "phone_verify": ("السلسلة سليمة · تحقّقنا من FHIR", "Chain intact, verified from FHIR", (300, -60), "brand"),
    "phone_tamper": ("عُدّل المسح ٤ لاحقاً فكُشف", "Scan 4 edited later → verify flags it", (300, -20), "stop"),
}


def tone(t):
    return C["madder.800"] if t == "stop" else C["juniper.700"]


def callout(key):
    ar, en, (dx, dy), t = CALLOUTS[key]
    ax, ay = AN[key]
    bw, bh = 560, 112
    lx, ly = ax + dx, ay + dy                      # end of the leader line
    bx = min(max(lx - (bw if dx < 0 else 0), 24), W - bw - 24)
    by = min(max(ly - bh / 2, 24), H - bh - 150)
    ex = bx + (bw if dx < 0 else 0)
    ey = by + bh / 2
    col = tone(t)
    svg = (f'<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">'
           f'<line x1="{ax}" y1="{ay}" x2="{ex}" y2="{ey}" stroke="{col}" stroke-width="3"/>'
           f'<circle cx="{ax}" cy="{ay}" r="9" fill="{C["paper.0"]}" stroke="{col}" stroke-width="4"/>'
           f'<circle cx="{ax}" cy="{ay}" r="3" fill="{col}"/></svg>')
    box = (f'<div style="position:absolute;left:{bx}px;top:{by}px;width:{bw}px;min-height:{bh}px;box-sizing:border-box;'
           f'background:{C["paper.0"]};border:2px solid {col};border-radius:6px;padding:12px 20px;text-align:right">'
           f'<div class="disp" style="direction:rtl;font-weight:800;font-size:31px;line-height:1.3;color:{C["ink.1"]}">{ar}</div>'
           f'<div style="font-family:\'PlexL\';font-weight:500;font-size:20px;color:{C["ink.2"]}">{en}</div></div>')
    make_art.page(f"f3w_co_{key}", W, H, f'<div style="width:{W}px;height:{H}px;position:relative">{svg}{box}</div>')


def beat(i, n, ar, en):
    col = tone("stop" if n == "!" else "brand")
    make_art.page(f"f3w_beat_{i}", W, H, f"""
<div style="width:{W}px;height:{H}px;position:relative">
  <div style="position:absolute;left:64px;top:128px;display:flex;align-items:center;gap:16px;background:{C['paper.0']};
       border:1px solid {C['ink.line']};border-radius:6px;padding:12px 22px 12px 14px">
    <span style="display:grid;place-items:center;width:54px;height:54px;border-radius:6px;background:{col};color:{C['paper.0']};font-family:'Readex';font-weight:700;font-size:30px">{n}</span>
    <span style="display:grid">
      <span class="disp" style="direction:rtl;font-weight:800;font-size:38px;line-height:1.25;color:{C['ink.1']}">{ar}</span>
      <span style="font-family:'AlexandriaL';font-weight:300;font-size:22px;color:{C['ink.1']}">{en}</span>
    </span>
  </div>
</div>""")


def inset(k):
    b64 = base64.b64encode((OUT / f"f3v_screen_{k}.png").read_bytes()).decode()
    make_art.page(f"f3w_inset_{k}", W, H, f"""
<div style="width:{W}px;height:{H}px;position:relative">
  <div style="position:absolute;left:64px;top:250px;width:236px;padding:9px;background:{C['ink.1']};border-radius:26px">
    <img src="data:image/png;base64,{b64}" style="display:block;width:218px;border-radius:16px">
  </div>
  <div style="position:absolute;left:64px;top:742px;width:254px;text-align:center;font-family:'PlexL';font-size:18px;color:{C['ink.2']}">
    <span class="ar" style="font-family:'Plex';font-weight:600">شاشة الهاتف الآن</span> · phone screen, live capture</div>
</div>""")


def end_card():
    make_art.page("f3w_end", W, H, f"""
<div style="width:{W}px;height:{H}px;position:relative">
  <div style="position:absolute;left:50%;top:300px;transform:translateX(-50%);background:{C['paper.0']};border:1px solid {C['ink.line']};
       border-radius:6px;padding:34px 56px;text-align:center">
    <div class="disp" style="direction:rtl;font-weight:800;font-size:64px;line-height:1.3;color:{C['juniper.900']}">ستّ مسحات · سلسلة واحدة يمكن التحقق منها</div>
    <div style="font-family:'AlexandriaL';font-weight:200;font-size:40px;color:{C['ink.1']}">Six scans, one verifiable chain of custody</div>
    <div style="font-family:'PlexL';font-size:22px;color:{C['ink.2']};margin-top:14px">FHIR Specimen + Provenance · SHA-256 hash chain · edits are detected, not prevented · research prototype, demo data</div>
  </div>
</div>""")


if __name__ == "__main__":
    for i, (n, ar, en) in enumerate(BEATS, 1):
        beat(i, n, ar, en)
    for k in range(1, 6):
        inset(k)
    for key in CALLOUTS:
        callout(key)
    end_card()
