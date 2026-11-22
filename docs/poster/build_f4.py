#!/usr/bin/env python3
"""F4 hardware tier panel: builds the poster panel and the video slide as standalone SVG.

Run from the repo root:  python3 docs/poster/build_f4.py   (then: node docs/poster/render_png.cjs)
Every number printed here has a row in docs/sources.md (footnote numbers map to FOOTNOTES below).
Colours are the primitive hex values from design/tokens.json; fonts are the bundled OFL files in design/fonts/.
"""
import base64, io, pathlib
from xml.sax.saxutils import escape as esc
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "poster"
FONTS = ROOT / "design" / "fonts"
RENDERS = ROOT / "hardware" / "blender" / "renders"

# design/tokens.json primitives
C = dict(paper0="#F9FBF7", paper1="#EDF2EC", paper2="#E1E9E2", paper3="#D1DCD3",
         ink1="#14201B", ink2="#3C4A43", ink3="#56645D", line="#BCCABF", lineStrong="#738478",
         jun950="#06302B", jun900="#0A3D37", jun700="#115A51", jun500="#1C7A6D", jun100="#DCEDE8",
         saf500="#E2A21B", mad600="#B3372C", amb800="#7A4300", amb100="#FBE7CD",
         none="#3C4A43", noneTint="#E1E9E2", info="#115A51", infoTint="#DCEDE8", kohl="#17160F")

def font_face(family, file, weight):
    b = base64.b64encode((FONTS / file).read_bytes()).decode()
    return f"@font-face{{font-family:'{family}';font-weight:{weight};src:url(data:font/woff2;base64,{b}) format('woff2');}}"

FONT_CSS = "".join([
    font_face("Alexandria", "Alexandria-100-900-latin.woff2", "100 900"),
    font_face("Alexandria", "Alexandria-100-900-arabic.woff2", "100 900"),
    font_face("Plex Arabic", "IBMPlexSansArabic-400-latin.woff2", 400),
    font_face("Plex Arabic", "IBMPlexSansArabic-400-arabic.woff2", 400),
    font_face("Plex Arabic", "IBMPlexSansArabic-600-latin.woff2", 600),
    font_face("Plex Arabic", "IBMPlexSansArabic-600-arabic.woff2", 600),
    font_face("Plex Mono", "IBMPlexMono-500-latin.woff2", 500),
])

def render_b64(name):
    im = Image.open(RENDERS / name).convert("RGB").crop((560, 120, 2740, 1660))
    im.thumbnail((900, 900))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=78)
    return base64.b64encode(buf.getvalue()).decode()

IMG = {
    "T1": render_b64("meyar-t1-saliva-kit.png"),
    "T3": render_b64("meyar-t3-single-gene-cathlab-unit-concept.png"),
    "T4": render_b64("meyar-t4-multi-gene-reader-concept.png"),
}

FOOTNOTES = [
    "Saliva DNA stability: BMC Med Res Methodol 2012;12:65 (4,110 kits).",
    "Barcoding vs manual labelling: CDC Laboratory Medicine Best Practices, barcoding systematic review (OR 4.39).",
    "UK NICE DG59 (2024), CYP2C19 genotype testing, test costs ex-VAT.",
    "PREPARE: Swen JJ et al., Lancet 2023;401:347–356 (12-gene panel, 6,944 patients, 7 European countries).",
    "KFSHRC news release, Oct 2024: pharmacogenetic analysis for over 1,500 patients.",
    "Genomadix Cube CYP2C19 System, FDA 510(k) K220026; manufacturer release, 2023.",
    "No cleared multi-gene point-of-care PGx device found: Meyar research note, Nov 2026 (docs/sources.md).",
]

# Each tier: id, name, status chip (style, text), honesty label, facts [(text, footnote)], image key
TIERS = [
    dict(id="T1", name="Chain-of-custody saliva kit", sub="Any clinic collects. No phlebotomy, no cold chain.",
         chip=("info", "Kit design — software working"), label=None,
         facts=[("Saliva DNA held 8 months at room temperature with no loss", 1),
                ("Barcodes cut ID errors: manual labels give 4.4× more", 2)], img="T1"),
    dict(id="T2", name="Central-lab genotyping", sub="Batched panel, read once, kept for life.",
         chip=("info", "Exists today"), label=None,
         facts=[("Lab CYP2C19 test £44–£139, cheaper in bigger batches", 3),
                ("12-gene panel back to the prescriber within 7 days", 4),
                ("In Saudi Arabia: KFSHRC, 1,500+ patients tested", 5)], img=None),
    dict(id="T3", name="Single-gene cath-lab unit", sub="For the urgent case: before the first clopidogrel dose.",
         chip=("ask", "Roadmap"), label="Concept render — not built",
         facts=[("Point-of-care CYP2C19 *2/*3/*17 in about 1 hour exists commercially", 6),
                ("Kit £100–£125 per test, so the lab stays the default", 3)], img="T3"),
    dict(id="T4", name="Multi-gene reader", sub="Several genes at the bedside. Never CYP2D6 (copy number).",
         chip=("none", "Concept only"), label="Concept render — not built",
         facts=[("No cleared multi-gene point-of-care PGx device exists yet", 7)], img="T4"),
]

SPINE = [
    ("Custody", "Every tube barcoded and scanned at collection, dispatch, lab and result"),
    ("Alert on time", "Result reaches the prescriber at order-sign, not in a PDF"),
    ("Scan anywhere", "Passport QR carries the result itself; any hospital reads it offline"),
    ("Patient tracks", "Patient sees sample received, processing, result ready"),
]

def chip(x, y, style, text, size):
    fg, bg, dash = {"info": (C["info"], C["infoTint"], ""), "ask": (C["amb800"], C["amb100"], ""),
                    "none": (C["none"], C["noneTint"], ' stroke-dasharray="6 4"')}[style]
    w = len(text) * size * 0.56 + size * 2.6
    h = size * 2.1
    shape = {"info": f'<circle cx="{x+size*1.05}" cy="{y+h/2}" r="{size*0.38}" fill="{fg}"/>',
             "ask": f'<path d="M{x+size*1.05} {y+h/2-size*0.45} l{size*0.45} {size*0.78} h{-size*0.9}z" fill="{fg}"/>',
             "none": f'<circle cx="{x+size*1.05}" cy="{y+h/2}" r="{size*0.36}" fill="none" stroke="{fg}" stroke-width="2"/>'}[style]
    return (f'<g><rect x="{x}" y="{y}" width="{w:.0f}" height="{h:.0f}" rx="{h/2:.0f}" fill="{bg}" stroke="{fg}" stroke-width="1.5"{dash}/>'
            f'{shape}<text x="{x+size*1.85:.0f}" y="{y+h/2+size*0.36:.0f}" font-family="Plex Arabic" font-weight="600" font-size="{size}" fill="{fg}">{esc(text)}</text></g>')

def wrap(text, n):
    out, line = [], ""
    for w in text.split():
        if len(line) + len(w) + 1 > n and line:
            out.append(line); line = w
        else:
            line = f"{line} {w}".strip()
    return out + [line]

def qatt(y, w, h):
    s = h / 30
    tile = (f'<pattern id="qatt" width="{24*s}" height="{h}" patternUnits="userSpaceOnUse">'
            f'<g transform="scale({s})"><rect width="24" height="30" fill="{C["saf500"]}"/>'
            f'<path d="M0 2h24L12 15z" fill="{C["mad600"]}" stroke="{C["kohl"]}"/>'
            f'<path d="M-12 28 0 15l12 13zM12 28l12-13 12 13z" fill="{C["jun500"]}" stroke="{C["kohl"]}"/>'
            f'<rect width="24" height="2.2" fill="{C["kohl"]}"/><rect y="27.8" width="24" height="2.2" fill="{C["kohl"]}"/></g></pattern>')
    return tile, f'<rect x="0" y="{y}" width="{w}" height="{h}" fill="url(#qatt)" aria-hidden="true"/>'

def build(W, H, k, title_lines, video=False):
    """k scales type. Stairs occupy a band; spine below; footnotes at bottom."""
    pad = 64 * k
    tile, band = qatt(0, W, 30 * k)
    _, band2 = qatt(H - 30 * k, W, 30 * k)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t">',
         f'<title id="t">Meyar testing staircase: four tiers, each labelled with its true status</title>',
         f'<defs><style>{FONT_CSS}</style>{tile}'
         f'<pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="{C["paper1"]}"/><line x1="0" y1="0" x2="0" y2="12" stroke="{C["line"]}" stroke-width="3"/></pattern>'
         f'</defs><rect width="{W}" height="{H}" fill="{C["paper1"]}"/>', band, band2]
    # header
    y = 30 * k + pad * 0.9
    o.append(f'<text x="{pad}" y="{y}" font-family="Plex Mono" font-weight="500" font-size="{15*k}" letter-spacing="{3*k}" fill="{C["jun700"]}">MEYAR · F SERIES · TESTING FOR EVERY HOSPITAL</text>')
    o.append(f'<text x="{W-pad}" y="{y+6*k}" text-anchor="end" font-family="Alexandria" font-weight="800" font-size="{34*k}" fill="{C["jun900"]}">مِعيار</text>')
    for i, line in enumerate(title_lines):
        o.append(f'<text x="{pad}" y="{y + (62 + i*58)*k}" font-family="Alexandria" font-weight="{300 if i==0 else 700}" font-size="{52*k}" fill="{C["ink1"]}">{esc(line)}</text>')
    y += (62 + (len(title_lines)-1)*58) * k
    o.append(f'<text x="{pad}" y="{y + 44*k}" font-family="Plex Arabic" font-weight="400" font-size="{22*k}" fill="{C["ink2"]}">سُلَّم الفحص: من العيّنة إلى الوصفة الصحيحة</text>')
    top = y + 80 * k

    # staircase geometry
    spine_h = 210 * k
    foot_h = (100 if video else 150) * k
    base = H - 30 * k - pad * 0.6 - foot_h - spine_h - 30 * k
    colw = (W - 2 * pad) / 4
    rise = (base - top) * 0.1
    for i, t in enumerate(TIERS):
        x0 = pad + i * colw
        tread = base - (base - top) * 0.58 - i * rise  # top of step i
        style = t["chip"][0]
        # step block: built tiers solid, roadmap outlined, concept hatched + dashed
        if style == "info":
            o.append(f'<rect x="{x0}" y="{tread}" width="{colw}" height="{base-tread}" fill="{C["paper0"]}" stroke="{C["jun700"]}" stroke-width="{2*k}"/>')
            o.append(f'<rect x="{x0}" y="{tread}" width="{colw}" height="{8*k}" fill="{C["jun700"]}"/>')
        elif style == "ask":
            o.append(f'<rect x="{x0}" y="{tread}" width="{colw}" height="{base-tread}" fill="{C["paper0"]}" stroke="{C["amb800"]}" stroke-width="{2*k}"/>')
            o.append(f'<rect x="{x0}" y="{tread}" width="{colw}" height="{8*k}" fill="{C["amb800"]}"/>')
        else:
            o.append(f'<rect x="{x0}" y="{tread}" width="{colw}" height="{base-tread}" fill="url(#hatch)" stroke="{C["none"]}" stroke-width="{2*k}" stroke-dasharray="{10*k} {7*k}"/>')
        # render or lab glyph standing on the tread
        ih = min(rise * 2.3, colw * 0.66)
        iw = ih * 1.415
        if t["img"]:
            ix = x0 + (colw - iw) / 2
            op = "1" if style != "none" else "0.92"
            o.append(f'<image x="{ix:.0f}" y="{tread-ih-6*k:.0f}" width="{iw:.0f}" height="{ih:.0f}" opacity="{op}" href="data:image/jpeg;base64,{IMG[t["img"]]}"/>')
            if t["label"]:
                lw = len(t["label"]) * 8.4 * k + 22 * k
                o.append(f'<rect x="{ix:.0f}" y="{tread-6*k-30*k:.0f}" width="{lw:.0f}" height="{24*k:.0f}" fill="{C["kohl"]}"/>'
                         f'<text x="{ix+11*k:.0f}" y="{tread-6*k-13*k:.0f}" font-family="Plex Arabic" font-weight="600" font-size="{15*k}" fill="{C["paper0"]}">{esc(t["label"])}</text>')
        else:  # T2: a 96-well plate drawn in line, no stock icon
            px, py, pw, ph = x0 + colw*0.16, tread - ih*0.78, colw*0.68, ih*0.62
            o.append(f'<rect x="{px:.0f}" y="{py:.0f}" width="{pw:.0f}" height="{ph:.0f}" rx="{10*k}" fill="{C["paper0"]}" stroke="{C["jun700"]}" stroke-width="{2*k}"/>')
            for r in range(8):
                for c in range(12):
                    cx = px + pw*0.07 + c*(pw*0.86/11); cy = py + ph*0.12 + r*(ph*0.76/7)
                    filled = (r*12+c) % 5 != 3
                    o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{min(pw,ph)*0.032:.1f}" fill="{C["jun500"] if filled else "none"}" stroke="{C["jun700"]}" stroke-width="1"/>')
        # text inside the step
        tx = x0 + 22 * k
        ty = tread + 50 * k
        o.append(f'<text x="{tx}" y="{ty}" font-family="Alexandria" font-weight="200" font-size="{40*k}" fill="{C["ink3"]}">{t["id"]}</text>')
        o.append(chip(tx, ty + 14*k, style, t["chip"][1], 15*k))
        ty += 86 * k
        for ln in wrap(t["name"], int(20 / (k/k))):
            o.append(f'<text x="{tx}" y="{ty}" font-family="Alexandria" font-weight="700" font-size="{24*k}" fill="{C["ink1"]}">{esc(ln)}</text>'); ty += 30*k
        for ln in wrap(t["sub"], 34):
            o.append(f'<text x="{tx}" y="{ty}" font-family="Plex Arabic" font-weight="400" font-size="{16*k}" fill="{C["ink2"]}">{esc(ln)}</text>'); ty += 22*k
        ty += 10 * k
        for text, fn in t["facts"]:
            o.append(f'<line x1="{tx}" y1="{ty-12*k}" x2="{tx+18*k}" y2="{ty-12*k}" stroke="{C["lineStrong"]}" stroke-width="{2*k}"/>')
            lines = wrap(text, 32)
            for j, ln in enumerate(lines):
                sup = f'<tspan font-family="Plex Mono" font-size="{11*k}" dy="{-6*k}"> {fn}</tspan>' if j == len(lines)-1 else ""
                o.append(f'<text x="{tx+26*k}" y="{ty}" font-family="Plex Arabic" font-weight="600" font-size="{16*k}" fill="{C["ink1"]}">{esc(ln)}{sup}</text>'); ty += 22*k
            ty += 8 * k
    o.append(f'<line x1="{pad}" y1="{base}" x2="{W-pad}" y2="{base}" stroke="{C["ink1"]}" stroke-width="{3*k}"/>')

    # spine: the software that runs on every step
    sy = base + 30 * k
    o.append(f'<rect x="{pad}" y="{sy}" width="{W-2*pad}" height="{spine_h-20*k}" rx="{10*k}" fill="{C["jun900"]}"/>')
    o.append(f'<text x="{pad+24*k}" y="{sy+36*k}" font-family="Alexandria" font-weight="700" font-size="{22*k}" fill="{C["paper0"]}">One software spine on every step</text>')
    o.append(f'<text x="{W-pad-24*k}" y="{sy+36*k}" text-anchor="end" font-family="Plex Mono" font-weight="500" font-size="{13*k}" fill="{C["jun100"]}">SOFTWARE PROTOTYPE · DEMO ON MOCK DATA</text>')
    sw = (W - 2 * pad - 48 * k) / 4
    for i, (h, d) in enumerate(SPINE):
        x = pad + 24 * k + i * sw
        o.append(f'<text x="{x}" y="{sy+80*k}" font-family="Plex Mono" font-weight="500" font-size="{13*k}" fill="{C["saf500"]}">{i+1:02d}</text>')
        o.append(f'<text x="{x+30*k}" y="{sy+80*k}" font-family="Alexandria" font-weight="600" font-size="{19*k}" fill="{C["paper0"]}">{esc(h)}</text>')
        for j, ln in enumerate(wrap(d, 34)):
            o.append(f'<text x="{x}" y="{sy+108*k+j*21*k}" font-family="Plex Arabic" font-weight="400" font-size="{15*k}" fill="{C["jun100"]}">{esc(ln)}</text>')
        if i < 3:
            ax = x + sw - 18 * k
            o.append(f'<path d="M{ax-14*k} {sy+74*k} h{14*k} m{-6*k} {-6*k} l{6*k} {6*k} l{-6*k} {6*k}" fill="none" stroke="{C["saf500"]}" stroke-width="{2*k}"/>')

    # outcome line + footnotes
    fy = sy + spine_h + 12 * k
    o.append(f'<text x="{pad}" y="{fy}" font-family="Plex Arabic" font-weight="600" font-size="{17*k}" fill="{C["ink1"]}">Why it matters: in PREPARE, patients with an actionable result had 30% lower odds of clinically relevant side effects (21.0% vs 27.7%).<tspan font-family="Plex Mono" font-size="{11*k}" dy="{-6*k}"> 4</tspan></text>')
    fy += 28 * k
    cols = 2
    for i, f in enumerate(FOOTNOTES):
        cx = pad + (i % cols) * (W - 2*pad) / cols
        cy = fy + (i // cols) * 19 * k
        o.append(f'<text x="{cx}" y="{cy}" font-family="Plex Arabic" font-weight="400" font-size="{12*k}" fill="{C["ink3"]}"><tspan font-family="Plex Mono">{i+1}</tspan>  {esc(f)}</text>')
    o.append(f'<text x="{W-pad}" y="{H-30*k-14*k}" text-anchor="end" font-family="Plex Arabic" font-weight="400" font-size="{12*k}" fill="{C["ink3"]}">Research prototype, not for clinical use. T3 and T4 renders are concepts: not built, not validated.</text>')
    o.append("</svg>")
    return "\n".join(o)

if __name__ == "__main__":
    (OUT / "f4-tier-panel-poster.svg").write_text(build(1600, 2000, 1.18, ["Four ways to test,", "one standard of care"]), encoding="utf-8")
    (OUT / "f4-tier-panel-slide.svg").write_text(build(1920, 1080, 0.86, ["Four ways to test, one standard of care"], video=True), encoding="utf-8")
    print("wrote", *(p.name for p in OUT.glob("f4-*.svg")))
