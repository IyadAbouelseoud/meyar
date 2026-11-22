"""F3 video artwork: one real phone capture of kit/web after each scan, plus 1920x1080 label overlays.

Needs the kit app running (docker compose up -d hapi; cd kit && npm start). It resets the demo kit,
records the six demo scans one at a time through the kit's own API, captures the phone screen after
each one, captures the tampered state, then restores. Run from the repo root:
  uv run --no-project --python 3.12 --with playwright python hardware/blender/art/make_f3_video_art.py

Out (art/out/): f3v_screen_1..6.png, f3v_screen_7.png (tampered), f3v_cap.png (whole-clip label),
f3v_lab_1..7.png (one callout per beat). Arabic first; Arabic strings are drafts for the C4 review.
"""
import asyncio, json, sys, pathlib, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import make_f3_art as M  # noqa: E402  (installs the Playwright page() for captions)
make_art = M.make_art
C = make_art.C

KIT, KIT_ID = M.KIT, M.KIT_ID
TIMES = ["2026-11-15T08:30:00+03:00", "2026-11-16T09:10:00+03:00", "2026-11-16T09:14:00+03:00",
         "2026-11-16T13:00:00+03:00", "2026-11-17T10:20:00+03:00", "2026-11-19T15:45:00+03:00"]


def post(path, body=None):
    req = urllib.request.Request(f"{KIT}/api/kits/{KIT_ID}/{path}", data=json.dumps(body or {}).encode(),
                                 method="POST", headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


async def capture(pg, idx, final):
    await pg.goto(f"{KIT}/?lang=ar&animate=0")
    await pg.wait_for_selector("#verify-result .m-status")
    await pg.wait_for_timeout(600)
    if final:   # chain end and the Verify result
        js = """() => { const r = document.getElementById('verify-result').getBoundingClientRect();
                 window.scrollTo(0, window.scrollY + r.bottom - innerHeight + 36); }"""
    else:       # the newest recorded event sits low on screen, earlier ones above it
        js = f"""() => {{ const li = document.querySelectorAll('#chain li')[{idx - 1}].getBoundingClientRect();
                 window.scrollTo(0, Math.max(0, window.scrollY + li.bottom - innerHeight * 0.62)); }}"""
    await pg.evaluate(js)
    await pg.wait_for_timeout(250)
    await pg.screenshot(path=str(make_art.OUT / f"f3v_screen_{idx}.png"))
    print("captured", idx)


async def captures():
    from playwright.async_api import async_playwright
    post("reset")
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="msedge")
        pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=3, reduced_motion="reduce")
        for i, t in enumerate(TIMES, 1):
            post("scan", {"code": KIT_ID if i % 2 else f"MEYAR-KIT:{KIT_ID}", "time": t})
            await capture(pg, i, final=(i == 6))
        post("tamper", {"seq": 4})
        try:
            await capture(pg, 7, final=True)
        finally:
            post("restore")
        await b.close()
    v = json.loads(urllib.request.urlopen(f"{KIT}/api/kits/{KIT_ID}/verify?source=fhir", timeout=30).read())
    assert v["ok"] and v["complete"], v


BEATS = [  # (n, Arabic, English, detail, tone)
    ("١", "صُرفت العُدّة", "Kit issued", "Scan 1 → FHIR Provenance on Specimen/MYR-DEMO-0001", "brand"),
    ("٢", "جُمعت العيّنة", "Sample collected", "Scan 2 · hashed to scan 1 (SHA-256)", "brand"),
    ("٣", "خُتمت الأنبوبة", "Tube sealed", "Scan 3 · hashed to scan 2", "brand"),
    ("٤", "شُحنت", "Shipped", "Scan 4 · hashed to scan 3", "brand"),
    ("٥", "استلمها المختبر", "Received at lab", "Scan 5 · hashed to scan 4", "brand"),
    ("٦", "اكتمل التنميط · سُلِّم للمحرّك", "Genotyped — file handed to the engine",
     "Germline origin + VCF path written · chain verified from FHIR", "brand"),
    ("!", "السلسلة مكسورة هنا", "Chain broken here",
     "Scan 4 edited after the fact → verify flags the broken link", "stop"),
]


def overlays():
    W, H = 1920, 1080
    make_art.page("f3v_cap", W, H, f"""
<div style="width:{W}px;height:{H}px;position:relative">
  <div style="position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:16px;color:{C['juniper.900']}">
    <span style="font-size:40px;display:flex;color:{C['juniper.700']}">{make_art.MARK}</span>
    <span class="disp" style="font-weight:800;font-size:46px;line-height:1">مِعيار</span>
    <span style="font-family:'Mono';font-size:19px;letter-spacing:.18em;color:{C['ink.2']}">MEYAR</span>
  </div>
  <div style="position:absolute;left:64px;bottom:56px">
    <div style="display:inline-flex;padding:11px 20px;border-radius:6px;background:{C['ink.1']};color:{C['paper.0']};font-family:'PlexL';font-weight:600;font-size:32px">Kit design — software working</div>
    <div style="font-family:'PlexL';font-size:21px;color:{C['ink.2']};margin-top:12px;max-width:1000px">Phone screen: real captures of the F3 kit software after each scan. Generic phone prop; the physical kit is a design. Demo data, kit ID is mock.</div>
  </div>
</div>""")
    for i, (n, ar, en, detail, tone) in enumerate(BEATS, 1):
        fg = C["madder.800"] if tone == "stop" else C["juniper.700"]
        make_art.page(f"f3v_lab_{i}", W, H, f"""
<div style="width:{W}px;height:{H}px;position:relative">
  <div style="position:absolute;right:64px;top:56px;max-width:1100px;background:{C['paper.0']};border-radius:6px;padding:22px 30px;border:1px solid {C['ink.line']};display:grid;gap:6px;text-align:right">
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:18px">
      <span class="disp" style="direction:rtl;font-weight:800;font-size:50px;color:{C['ink.1']};line-height:1.25">{ar}</span>
      <span style="display:grid;place-items:center;width:56px;height:56px;border-radius:6px;background:{fg};color:{C['paper.0']};font-family:'Readex';font-weight:700;font-size:32px">{n}</span>
    </div>
    <div style="font-family:'AlexandriaL';font-weight:300;font-size:30px;color:{C['ink.1']}">{en}</div>
    <div style="font-family:'PlexL';font-size:20px;color:{C['ink.2']}">{detail}</div>
  </div>
</div>""")


if __name__ == "__main__":
    if "--overlays-only" not in sys.argv:
        asyncio.run(captures())
    overlays()
