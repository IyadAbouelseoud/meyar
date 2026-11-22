"""F3 render artwork: real screen captures of the running F3 kit software, plus caption strips.

Needs the kit app running with the demo kit complete:
  docker compose up -d hapi
  cd kit && npm start                      # http://localhost:5174, kit MYR-DEMO-0001 with six events
Run (from the repo root):
  uv run --no-project --python 3.12 --with playwright python hardware/blender/art/make_f3_art.py

Out: art/out/f3_screen_intact.png, art/out/f3_screen_tampered.png (1170 x 2532, phone-sized
captures of kit/web at 390 x 844 CSS px, 3x), art/out/caption_f3_intact.png, caption_f3_tampered.png.

The screens are captured from the software, not drawn: what the phone shows is what kit/ renders.
The tampered capture uses the kit's own demo control (edit event 4 without re-sealing), then restores.
"""
import asyncio, json, sys, pathlib, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import make_art  # noqa: E402  (fonts, tokens, caption(), page())

KIT = "http://localhost:5174"
KIT_ID = make_art.KIT_ID


def page_playwright(name, w, h, body, css=""):
    """Same HTML as make_art.page(), rasterised with Playwright (transparent background).
    Edge's --screenshot CLI silently writes nothing while another Edge instance holds the profile."""
    from playwright.sync_api import sync_playwright
    html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{make_art.BASE_CSS}{css}</style></head>"
            f"<body style='width:{w}px;height:{h}px;overflow:hidden;margin:0;background:transparent'>{body}</body></html>")
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge")
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        pg.set_content(html)
        pg.wait_for_timeout(500)
        out = make_art.OUT / f"{name}.png"
        pg.screenshot(path=str(out), omit_background=True)
        b.close()
    assert out.exists(), f"{out} was not written"
    print("wrote", out.name)


make_art.page = page_playwright


def post(path):
    req = urllib.request.Request(f"{KIT}/api/kits/{KIT_ID}/{path}", data=b"{}", method="POST",
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())


def get(path=""):
    return json.loads(urllib.request.urlopen(f"{KIT}/api/kits/{KIT_ID}{path}", timeout=20).read())


async def capture(name):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="msedge")
        pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=3, reduced_motion="reduce")
        await pg.goto(f"{KIT}/?lang=ar&animate=0")
        await pg.wait_for_selector("#verify-result .m-status")
        await pg.wait_for_timeout(800)
        # Scroll so the chain's lower events and the Verify result fill the phone screen.
        await pg.evaluate("""() => { const r = document.getElementById('verify-result').getBoundingClientRect();
            window.scrollTo(0, window.scrollY + r.bottom - innerHeight + 36); }""")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(make_art.OUT / f"f3_screen_{name}.png"))
        await b.close()
    print("captured", name)


def main():
    state = get()
    assert len(state["events"]) == 6, "Run the six demo scans first (kit/README.md)."
    assert get("/verify?source=fhir")["ok"], "Demo chain must verify from FHIR before capture."
    asyncio.run(capture("intact"))
    post("tamper")
    try:
        assert not get("/verify?source=fhir")["ok"]
        asyncio.run(capture("tampered"))
    finally:
        post("restore")
    assert get("/verify?source=fhir")["ok"]

    note_common = ("The phone screen is a real capture of the working F3 software (kit/): six scans stored as "
                   "FHIR Provenance on the kit's Specimen, SHA-256 hash-chained. The phone is a generic prop; "
                   "the physical kit is a design. Demo data: kit ID is mock.")
    make_art.caption("f3_intact", "Kit design — software working", "سلسلة حفظ العيّنة",
                     "T1 · Saliva kit, chain of custody verified", note_common)
    make_art.caption("f3_tampered", "Kit design — software working", "السلسلة مكسورة هنا",
                     "T1 · Edited scan caught by verify",
                     "Same software after event 4 was edited without re-sealing: verify flags the broken link. "
                     "The chain is tamper-evident, not tamper-proof. The phone is a generic prop; the physical kit "
                     "is a design. Demo data.")


if __name__ == "__main__":
    main()
