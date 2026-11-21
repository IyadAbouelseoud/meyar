"""F1 artwork: builds every printed surface (tube label, mailer panels, instruction card,
device screens, caption strips) as HTML with the Meyar fonts and tokens, then rasterises
them with headless Edge/Chrome so Arabic is shaped correctly. Blender only maps the PNGs.

Run:  python hardware/blender/art/make_art.py
Out:  hardware/blender/art/out/*.png

All data on these surfaces is mock (kit ID MYR-DEMO-0001). No number appears that is not
either the mock kit ID or a step index. Arabic strings are drafts for the C4 review.
"""
import base64, json, os, subprocess, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)
TOK = json.loads((REPO / "design" / "tokens.json").read_text(encoding="utf-8"))["primitive"]["color"]
C = {f"{g}.{k}": v["$value"] for g, d in TOK.items() for k, v in d.items() if isinstance(v, dict)}

KIT_ID = "MYR-DEMO-0001"   # mock kit ID, never a real person

BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]

def font_face(family, file, weight):
    b = base64.b64encode((REPO / "design" / "fonts" / file).read_bytes()).decode()
    return f"@font-face{{font-family:'{family}';font-weight:{weight};src:url(data:font/woff2;base64,{b}) format('woff2');}}"

FONTS = "\n".join([
    font_face("Alexandria", "Alexandria-100-900-arabic.woff2", "100 900"),
    font_face("AlexandriaL", "Alexandria-100-900-latin.woff2", "100 900"),
    font_face("Readex", "ReadexPro-160-700-arabic.woff2", "160 700"),
    font_face("ReadexL", "ReadexPro-160-700-latin.woff2", "160 700"),
    font_face("Plex", "IBMPlexSansArabic-500-arabic.woff2", "500"),
    font_face("Plex", "IBMPlexSansArabic-600-arabic.woff2", "600"),
    font_face("PlexL", "IBMPlexSansArabic-500-latin.woff2", "500"),
    font_face("PlexL", "IBMPlexSansArabic-600-latin.woff2", "600"),
    font_face("Mono", "IBMPlexMono-500-latin.woff2", "500"),
    font_face("Mono", "IBMPlexMono-600-latin.woff2", "600"),
])

# ---------- Code 128 (set B), drawn as SVG ----------
C128 = ("212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 "
        "112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 "
        "311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 "
        "112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 "
        "313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 "
        "314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 "
        "122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 "
        "124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 "
        "114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112").split()
assert len(C128) == 107 and all(sum(map(int, p)) == 11 for p in C128[:-1])

def code128b(text):
    vals = [104] + [ord(ch) - 32 for ch in text]
    check = (vals[0] + sum(v * i for i, v in enumerate(vals[1:], 1))) % 103
    pats = [C128[v] for v in vals] + [C128[check], C128[106]]
    return "".join(pats)

def barcode_svg(text, height, quiet=10, ink=C["ink.1"]):
    widths = code128b(text)
    x, rects = quiet, []
    for i, w in enumerate(widths):
        w = int(w)
        if i % 2 == 0:
            rects.append(f'<rect x="{x}" y="0" width="{w}" height="{height}"/>')
        x += w
    total = x + quiet
    return (f'<svg viewBox="0 0 {total} {height}" preserveAspectRatio="none" '
            f'style="width:100%;height:100%;display:block" fill="{ink}">{"".join(rects)}</svg>')

MARK = ('<svg viewBox="0 0 24 24" style="width:1em;height:1em"><path d="M3 21v-5M7.5 21v-8M12 21V9M16.5 21v-8M21 21v-5" '
        'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
        '<path d="M12 1.8 14.3 4.6 12 7.4 9.7 4.6z" fill="currentColor"/></svg>')

def qatt(h):
    # Al-Qatt Al-Asiri band, same tile as design/meyar.css .m-qatt
    tile = ("<svg xmlns='http://www.w3.org/2000/svg' width='24' height='30' viewBox='0 0 24 30'>"
            "<rect width='24' height='30' fill='#E2A21B'/><path d='M0 2h24L12 15z' fill='#B3372C' stroke='#17160F' stroke-width='1'/>"
            "<path d='M-12 28 0 15l12 13zM12 28l12-13 12 13z' fill='#1C7A6D' stroke='#17160F' stroke-width='1'/>"
            "<rect width='24' height='2.2' fill='#17160F'/><rect y='27.8' width='24' height='2.2' fill='#17160F'/></svg>")
    uri = "data:image/svg+xml;base64," + base64.b64encode(tile.encode()).decode()
    return f'<div style="height:{h}px;background:url({uri}) repeat-x 0 0/auto 100%"></div>'

BASE_CSS = f"""
{FONTS}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:transparent}}
.ar{{font-family:'Readex','ReadexL';direction:rtl}}
.disp{{font-family:'Alexandria','AlexandriaL'}}
.cl{{font-family:'Plex','PlexL'}}
.mono{{font-family:'Mono';direction:ltr;unicode-bidi:isolate}}
.demo{{display:inline-block;font-family:'PlexL';font-weight:600;font-size:.8em;padding:.15em .6em;border-radius:4px;
       background:{C['saffron.100']};color:{C['saffron.700']};border:1px solid {C['saffron.700']}}}
"""

def page(name, w, h, body, css=""):
    html = f"<!doctype html><html><head><meta charset='utf-8'><style>{BASE_CSS}{css}</style></head><body style='width:{w}px;height:{h}px;overflow:hidden'>{body}</body></html>"
    p = OUT / f"{name}.html"
    p.write_text(html, encoding="utf-8")
    exe = next(b for b in BROWSERS if os.path.exists(b))
    png = OUT / f"{name}.png"
    subprocess.run([exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--default-background-color=00000000", f"--window-size={w},{h}",
                    f"--screenshot={png}", p.as_uri()], check=True, capture_output=True, timeout=120)
    p.unlink()
    print("wrote", png.name)

# ---------- 1. Tube label (wraps the tube; long edge runs along the tube axis) ----------
def tube_label():
    w, h = 1600, 700
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['paper.0']};position:relative;color:{C['ink.1']};padding:48px 60px;display:grid;grid-template-columns:1fr 1fr;gap:56px">
  <div style="display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:22px;color:{C['juniper.700']}">
      <span style="font-size:84px;display:flex">{MARK}</span>
      <span class="disp" style="font-weight:800;font-size:96px;line-height:1">مِعيار</span>
      <span class="mono" style="font-size:34px;letter-spacing:.18em;color:{C['ink.2']}">MEYAR</span>
    </div>
    <div class="ar" style="font-size:54px;font-weight:600;line-height:1.5">عيّنة لعاب<br><span style="font-family:'ReadexL';font-weight:400;font-size:40px;direction:ltr;display:block;text-align:left">Saliva sample · germline</span></div>
    <div><span class="demo" style="font-size:34px">Demo data</span></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px;justify-content:center">
    <div style="height:330px;background:#fff;padding:0 6px">{barcode_svg(KIT_ID, 100)}</div>
    <div class="mono" style="font-size:58px;font-weight:600;text-align:center;letter-spacing:.06em">{KIT_ID}</div>
    <div class="cl" style="font-size:30px;color:{C['ink.2']};display:flex;justify-content:space-between;border-top:2px solid {C['ink.line']};padding-top:14px">
      <span style="font-family:'PlexL'">Collected ____ / ____</span><span style="direction:rtl">تاريخ الجمع</span></div>
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0">{qatt(34)}</div>
</div>"""
    page("tube_label", w, h, body)

# ---------- 2. Mailer lid (top face) ----------
def mailer_lid():
    w, h = 2000, 1400
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['juniper.900']};position:relative;color:{C['saffron.300']};padding:120px 140px">
  <div style="display:flex;align-items:center;gap:40px;direction:rtl">
    <span class="disp" style="font-weight:800;font-size:250px;line-height:1">مِعيار</span>
    <span style="font-size:170px;display:flex;color:{C['saffron.500']}">{MARK}</span>
  </div>
  <div class="disp" style="direction:rtl;font-weight:800;font-size:110px;margin-top:60px;color:{C['paper.1']}">عُدّة جمع اللعاب</div>
  <div style="font-family:'AlexandriaL';font-weight:200;font-size:76px;margin-top:10px;color:{C['juniper.100']};text-align:right">Saliva collection kit</div>
  <div class="cl" style="position:absolute;left:140px;bottom:150px;font-family:'PlexL';font-size:38px;color:{C['juniper.100']}">Research prototype — not for clinical use</div>
  <div style="position:absolute;left:0;right:0;bottom:0">{qatt(90)}</div>
</div>"""
    page("mailer_lid", w, h, body)

# ---------- 3. Mailer front (long side): four numbered pictogram steps, Arabic first ----------
STEPS = [
    ("لا تأكل ولا تشرب قبل الجمع", "Do not eat or drink first",
     '<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="6"/><path d="M26 74 74 26" stroke="currentColor" stroke-width="6"/><path d="M40 34v18M50 34v18M60 34v18M50 52v16" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'),
    ("ابصق في القمع حتى الخط", "Spit to the fill line",
     '<path d="M30 20h40l-12 26v36H42V46z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="M38 60h24" stroke="currentColor" stroke-width="6"/>'),
    ("أغلق الغطاء بإحكام", "Close the cap firmly",
     '<rect x="34" y="40" width="32" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="6"/><rect x="30" y="18" width="40" height="16" rx="3" fill="currentColor"/><path d="M20 26a30 30 0 0 1 10-12M80 26a30 30 0 0 0-10-12" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'),
    ("ضعه في الكيس وأرسله", "Bag it and post it",
     '<rect x="18" y="36" width="64" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="6"/><path d="M18 40l32 22 32-22" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>'),
]
AR_DIG = "٠١٢٣٤٥٦٧٨٩"

def mailer_front():
    w, h = 2400, 620
    cells = "".join(f"""
  <div style="display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center">
    <div style="display:flex;align-items:center;gap:22px">
      <span class="disp" style="font-weight:800;font-size:92px;color:{C['juniper.700']}">{AR_DIG[i+1]}</span>
      <svg viewBox="0 0 100 100" style="width:170px;height:170px;color:{C['ink.1']}">{svg}</svg>
    </div>
    <div class="ar" style="font-size:52px;font-weight:600;line-height:1.4">{ar}</div>
    <div style="font-family:'ReadexL';font-size:34px;color:{C['ink.2']}">{en}</div>
  </div>""" for i, (ar, en, svg) in enumerate(STEPS))
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['paper.1']};padding:60px 80px;color:{C['ink.1']};display:grid;grid-template-columns:repeat(4,1fr);gap:40px;direction:rtl;position:relative">
{cells}
  <div style="position:absolute;left:0;right:0;top:0;height:16px;background:{C['juniper.900']}"></div>
</div>"""
    page("mailer_front", w, h, body)

# ---------- 4. Mailer end panel: return label with barcode ----------
def mailer_end(marking_html):
    w, h = 1400, 600
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['paper.0']};padding:56px 64px;color:{C['ink.1']};display:grid;grid-template-rows:auto 1fr auto;gap:26px">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span class="demo" style="font-size:30px">Demo data</span>
    <span class="ar" style="font-size:44px;font-weight:600">إلى: مختبر مِعيار التجريبي</span>
  </div>
  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:center">
    <div><div style="height:210px">{barcode_svg(KIT_ID, 100)}</div>
      <div class="mono" style="font-size:46px;font-weight:600;text-align:center;margin-top:10px">{KIT_ID}</div></div>
    <div>{marking_html}</div>
  </div>
  <div style="font-family:'PlexL';font-size:28px;color:{C['ink.2']}">Mock address for the demo · Research prototype — not for clinical use</div>
</div>"""
    page("mailer_end", w, h, body)

# ---------- 5. Device screens ----------
def screen_t3():
    w, h = 1200, 720
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['kohl.900']};color:{C['bone.1']};padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span class="mono" style="font-size:54px;font-weight:600;color:{C['juniper.300']}">CYP2C19</span>
    <span style="font-family:'PlexL';font-size:30px;padding:6px 16px;border:2px solid {C['bone.3']};border-radius:6px;color:{C['bone.2']}">Concept · not built</span>
  </div>
  <div>
    <div class="cl" style="direction:rtl;font-size:76px;font-weight:600">أدخل الخرطوشة</div>
    <div style="font-family:'PlexL';font-size:48px;color:{C['bone.2']};margin-top:6px">Insert cartridge</div>
  </div>
  <div style="display:flex;gap:16px;align-items:center">
    <svg viewBox="0 0 24 24" style="width:54px;height:54px"><path d="M12 3v14M6 11l6 6 6-6" stroke="{C['juniper.300']}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="mono" style="font-size:36px;color:{C['bone.2']}">{KIT_ID}</span>
  </div>
</div>"""
    page("screen_t3", w, h, body)

def screen_t4():
    # Gene list on the concept reader. CYP2D6 is drawn hatched as "not assessed" because
    # copy number cannot be read by a SNP reader (AGENTS.md 8b). No results are shown.
    hatch = f"repeating-linear-gradient(45deg,{C['bone.3']} 0 6px,transparent 6px 14px)"
    rows = [("CYP2C19", "Panel slot", None), ("CYP2C9", "Panel slot", None), ("VKORC1", "Panel slot", None),
            ("SLCO1B1", "Panel slot", None), ("CYP2D6", "Not assessed — copy number", hatch)]
    rowhtml = "".join(f"""
    <div style="display:grid;grid-template-columns:260px 1fr 420px;align-items:center;gap:28px;padding:20px 0;border-bottom:2px solid {C['kohl.700']}">
      <span class="mono" style="font-size:44px;font-weight:600;color:{C['bone.1']}">{g}</span>
      <div style="height:28px;border-radius:14px;border:2px {'dashed' if hb else 'solid'} {C['bone.3']};background:{hb or 'transparent'}"></div>
      <span style="font-family:'PlexL';font-size:32px;color:{C['bone.2']};text-align:right">{s}</span>
    </div>""" for g, s, hb in rows)
    w, h = 1600, 1000
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['kohl.900']};padding:60px 70px;color:{C['bone.1']}">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px">
    <span class="cl" style="font-family:'PlexL';font-size:46px;font-weight:600">Multi-gene panel · concept</span>
    <span style="font-family:'PlexL';font-size:30px;padding:6px 16px;border:2px solid {C['bone.3']};border-radius:6px;color:{C['bone.2']}">Concept · not built</span>
  </div>
  {rowhtml}
</div>"""
    page("screen_t4", w, h, body)

# ---------- 6. Caption strips baked onto the final PNGs ----------
def caption(name, status, title_ar, title_en, note):
    w, h = 3000, 2000
    body = f"""
<div style="width:{w}px;height:{h}px;position:relative">
  <div style="position:absolute;left:110px;top:100px;display:flex;align-items:center;gap:26px;color:{C['juniper.900']}">
    <span style="font-size:64px;display:flex;color:{C['juniper.700']}">{MARK}</span>
    <span class="disp" style="font-weight:800;font-size:74px;line-height:1">مِعيار</span>
    <span style="font-family:'Mono';font-size:30px;letter-spacing:.18em;color:{C['ink.2']}">MEYAR</span>
  </div>
  <div style="position:absolute;left:110px;right:110px;bottom:96px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <div style="display:inline-flex;align-items:center;gap:18px;padding:18px 30px;border-radius:6px;background:{C['ink.1']};color:{C['paper.0']};font-family:'PlexL';font-weight:600;font-size:52px">{status}</div>
      <div style="font-family:'PlexL';font-size:34px;color:{C['ink.2']};margin-top:22px;max-width:1500px">{note}</div>
    </div>
    <div style="text-align:right">
      <div class="disp" style="direction:rtl;font-weight:800;font-size:92px;color:{C['ink.1']};line-height:1.2">{title_ar}</div>
      <div style="font-family:'AlexandriaL';font-weight:200;font-size:58px;color:{C['ink.2']}">{title_en}</div>
    </div>
  </div>
</div>"""
    page(f"caption_{name}", w, h, body)


# ---------- 7. Cartridge label (T3) ----------
def cartridge_label():
    w, h = 900, 500
    body = f"""
<div style="width:{w}px;height:{h}px;background:{C['paper.0']};padding:36px 44px;color:{C['ink.1']};display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span class="mono" style="font-size:64px;font-weight:600;color:{C['juniper.700']}">CYP2C19</span>
    <svg viewBox="0 0 24 24" style="width:70px;height:70px"><path d="M4 12h14M12 6l6 6-6 6" stroke="{C['ink.1']}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div style="height:150px">{barcode_svg(KIT_ID, 100)}</div>
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span class="mono" style="font-size:36px">{KIT_ID}</span><span class="demo" style="font-size:26px">Concept · not built</span>
  </div>
</div>"""
    page("cartridge_label", w, h, body)


if __name__ == "__main__":
    marking = sys.argv[1] if len(sys.argv) > 1 else ""
    tube_label(); mailer_lid(); mailer_front()
    # Outer marking for a non-infectious specimen under the WHO transport guidance (exempt human
    # specimen). Whether a Saudi domestic post route accepts it is unconfirmed: see DESIGN-PLAN.md.
    mailer_end(marking or f"""<div style="border:6px solid {C['ink.1']};padding:22px 26px;text-align:center">
      <div style="font-family:'PlexL';font-weight:600;font-size:46px;line-height:1.15">Exempt human specimen</div>
      <div class="ar" style="font-size:40px;font-weight:600;margin-top:8px">عيّنة بشرية مستثناة</div></div>""")
    screen_t3(); screen_t4(); cartridge_label()
    caption("t1", "Kit design — software working", "عُدّة جمع اللعاب", "T1 · Saliva collection kit",
            "Tube, barcode label and mailer. The chain-of-custody software (F3) is working; the physical kit is a design. Demo data: kit ID is mock.")
    caption("t3", "Concept render — not built", "وحدة جين واحد", "T3 · Single-gene cath-lab unit",
            "Roadmap concept for CYP2C19 near the cath lab. Not built, not validated. Research prototype — not for clinical use.")
    caption("t4", "Concept render — not built", "قارئ متعدد الجينات", "T4 · Multi-gene reader",
            "Concept only: we found no cleared multi-gene near-patient PGx device. It could not read CYP2D6 copy number, so CYP2D6 is shown as not assessed.")
