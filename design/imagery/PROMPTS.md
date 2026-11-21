# Meyar image library · Nano Banana (Gemini) prompts

Fifteen photographs that give the showcase, the doctor page, the poster and the pitch deck a real, local feel. The look is editorial, unlike stock photography: Aseer light and materials, hands and objects instead of smiling models, no hospital-blue clichés, no DNA helices, no glowing holograms.

These images are illustrative. The site footer and the poster say they are AI-generated, and they never stand in for a real patient, a real result or a real clinic.

## Status

All 15 rendered and converted on 21 Nov 2026 (`img-NN.webp`, `-640`, `-1920`, plus `manifest.json`). To replace one, drop the new render into `raw/` with the same ID and run the script again.

## How to use

1. Open Gemini (the image model, "Nano Banana"). Paste the **Series style** paragraph first, then the prompt for one image. Generate at the aspect ratio given (Gemini accepts 1:1, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 16:9, 9:16, 21:9).
2. **Keep the series consistent.** After you have one image you love (start with IMG-15 or IMG-06), attach it to every later prompt and add: *"Match the colour grade, light and grain of the attached image. Do not copy its objects."*
3. If a render has text, a logo, a brand name, a recognisable face in close-up or a wrong-looking hand, ask: *"Same image, remove all text and logos"* or *"Same image, fix the hands"*. Nano Banana edits in place well.
4. Save the best take as PNG named by its ID (for example `img-15.png`) into `design/imagery/raw/`.
5. Run `python3 design/imagery/build_webp.py`. It crops to the slot's ratio, strips metadata and writes `img-15.webp` (1280 px), `img-15-640.webp`, `img-15-1920.webp` and `manifest.json`. The showcase picks the file up automatically; until it exists, the slot shows a designed placeholder.

Commit the `.webp` files and `manifest.json`. Leave `raw/` out of commits if the PNGs are large.

## Series style (paste before every prompt)

> Editorial documentary photograph for a Saudi health technology product from the Aseer region. Natural, quiet and real, shot on a full-frame camera with a 50 mm or 85 mm lens at f/2.8, soft directional window daylight, gentle shadows, fine film grain. Colour palette held to deep juniper green, warm saffron, terracotta, whitewashed lime plaster, brass and undyed linen; low saturation, rich midtones, no teal-and-orange grade. Real textures: plaster, stone, wood, paper. Medicines are plain and unbranded. No text, letters, numbers, logos or watermarks anywhere in the image. No faces in close-up; people are seen from behind, in profile at a distance, or only as hands. Modest Saudi dress where people appear. No glowing effects, no holograms, no DNA helix, no stethoscope cliché.

## The prompts

### IMG-15 · Hero still life · 4:5
**Slot:** showcase hero (`hero__photo`), poster top half.
**Alt (EN):** A single capsule resting on the pan of a brass balance.
**Alt (AR):** كبسولة واحدة على كفّة ميزان نحاسي.
> A close still life of an antique brass pharmacist's balance on a whitewashed lime-plaster ledge. On the left pan rests one plain white-and-juniper-green capsule; the right pan holds a single small brass weight, and the beam sits perfectly level. Low morning sun comes from the right through an unseen window and throws a long soft shadow of the balance across the plaster. Behind, out of focus, a strip of a hand-painted Al-Qatt Al-Asiri wall in saffron, terracotta and green. Shallow depth of field, 85 mm lens, the capsule pin sharp. Leave calm empty plaster in the upper third.
**Avoid:** pills spilling, multiple capsules, a scale with numbers or a digital display, gold glitter.

### IMG-02 · Reading the Passport at home · 16:10
**Slot:** Passport section header.
**Alt (EN):** An older woman reads her phone by a window in a whitewashed home.
**Alt (AR):** سيدة كبيرة في السن تقرأ هاتفها قرب نافذة في بيت مطليّ بالجير.
> An older Saudi woman in a dark abaya and a soft patterned scarf sits on a low floor cushion beside a deep window in a whitewashed stone house in Abha. She is seen from behind and slightly to the side, her face turned away toward the window, holding a phone in both hands at reading distance; the screen faces her and is not visible to us. A small brass tray with a glass of tea sits on the sill. Morning light falls across her hands and the plaster wall, the window frame painted juniper green. 50 mm lens, eye level, calm and dignified.
**Avoid:** visible phone screen, smiling-at-camera pose, hospital setting, Western living room.

### IMG-06 · The card on the majlis table · 3:2
**Slot:** printable card section; poster.
**Alt (EN):** The printed Meyar card on a majlis table beside a dallah and dates.
**Alt (AR):** بطاقة مِعيار المطبوعة على طاولة المجلس بجانب دلّة وتمر.
> Overhead three-quarter view of a low carved wooden majlis table. On it lie a brass dallah coffee pot, two small handleless cups, a shallow dish of dates, and a credit-card-sized card printed on heavy cream-green paper with a plain juniper band and a blank square where a code would be; the card face carries no readable text. A hand with a silver ring is just setting the card down at the edge of the frame. Soft afternoon window light, warm shadows, woven Sadu cushion edge in the corner. 50 mm lens at f/4 so the card and dallah are both sharp.
**Avoid:** legible text or fake QR, a plastic credit card, a laptop, bright flash.
**Note:** keep the card face blank; the real card design is composited on top later if needed.

### IMG-05 · Clinician at the order screen · 16:10
**Slot:** prescriber section header; doctor web page.
**Alt (EN):** A clinician's hands beside a tablet at a consulting desk.
**Alt (AR):** يدا طبيب بجانب جهاز لوحي على مكتب العيادة.
> A clinician's hands resting on a pale wooden consulting desk, one hand holding a fountain pen above a paper prescription pad, the other beside a tablet lying flat with a blank dark screen. White coat sleeve cuffs, a simple watch. Behind, softly out of focus, a clinic window with juniper-green shutters and a potted plant. Side daylight, clean and quiet, a slightly high angle. 50 mm lens at f/2.8, focus on the pen tip.
**Avoid:** stethoscope draped on the desk, a face, any legible writing on the pad, blue hospital light.

### IMG-04 · Chain-of-custody kit · 4:3
**Slot:** saliva kit section.
**Alt (EN):** Saliva collection tube and sealed mailer on a stone surface.
**Alt (AR):** أنبوب جمع اللعاب وظرف مختوم على سطح حجري.
> A still life on a slab of grey Aseer granite: a clear saliva collection tube with a juniper-green screw cap, a blank white barcode-style label with no readable characters, lying beside a small sealed kraft-paper mailer closed with a terracotta tamper-evident sticker. A pair of nitrile gloves folded neatly at the edge. Cool soft daylight from above left, crisp shadows. 85 mm macro-style framing at f/5.6, everything sharp.
**Avoid:** liquid splashes, blood, biohazard symbols, readable barcodes, brand names.

### IMG-07 · Aseer juniper at dawn · 21:9
**Slot:** footer band; poster bottom edge; deck section dividers.
**Alt (EN):** Juniper forest on the Aseer escarpment at dawn.
**Alt (AR):** غابة العرعر على جبال عسير عند الفجر.
> A wide panorama of the Aseer escarpment near Abha at dawn: layered ridges of dark juniper forest fading into blue-green mist in the valleys, the first saffron light touching the highest ridge on the right. A tiny stone watchtower on a far hill gives scale. Telephoto compression, 135 mm, calm and spacious, the lower third dark enough for light text to sit on it.
**Avoid:** cars, roads, cable cars, modern buildings, a dramatic orange sky.

### IMG-01 · Mountain village at first light · 16:9
**Slot:** doctor web page header background; deck cover.
**Alt (EN):** Terraced mountain village in Aseer at first light.
**Alt (AR):** قرية جبلية مدرّجة في عسير مع أول الضوء.
> Terraced stone-and-mud houses of a traditional Aseer village climbing a steep hillside, with whitewashed window frames and slate layers on the walls, juniper trees between the terraces. Early morning, soft low light from the left, long shadows, thin mist below. Shot from across the valley with a 70 mm lens. Leave a calm area of sky in the upper left for a headline.
**Avoid:** people, tourist signs, satellite dishes, oversaturated colour.

### IMG-03 · Handing over the medicine · 4:3
**Slot:** patient journey strip; poster "how it works".
**Alt (EN):** A pharmacist's hands pass a paper bag of medicine across a counter.
**Alt (AR):** يدا صيدلي تناولان كيس دواء عبر المنضدة.
> Close view across a pale stone pharmacy counter: a pharmacist's hands in a white coat pass a folded plain kraft paper bag to an older man's hands with prayer beads looped on his wrist. Only hands and forearms in frame. Behind, soft-focus shelves of plain white medicine boxes. Warm window light from the side, shallow depth of field, 50 mm lens, focus on the meeting hands.
**Avoid:** faces, brand names on boxes or bag, cash, a card machine.

### IMG-14 · Showing the card at the pharmacy · 4:3
**Slot:** Passport "show a doctor or pharmacist" step; poster.
**Alt (EN):** A hand holds the printed card to a scanner at a pharmacy counter.
**Alt (AR):** يد تقرّب البطاقة المطبوعة من الماسح في الصيدلية.
> An older woman's hand, with a simple gold bangle and the cuff of a dark abaya, holds a credit-card-sized cream-green card with a blank square code area toward a small handheld scanner held by a pharmacist's gloved hand. Pale stone counter, soft-focus shelves behind, warm side light. Macro-leaning 85 mm framing at f/2.8, the card edge sharp.
**Avoid:** visible laser beam, readable text or real QR, a phone screen, faces.

### IMG-10 · Family help · 4:5
**Slot:** elder mode explanation; About section.
**Alt (EN):** A young man helps his grandfather with a phone, seen from behind.
**Alt (AR):** شاب يساعد جدّه في استخدام الهاتف، يظهران من الخلف.
> Seen from behind and slightly above, a young Saudi man in a white thobe kneels beside his grandfather, who sits in a wooden chair wearing a thobe, a shemagh and a brown bisht over his shoulders. The young man points gently at a phone the grandfather holds; the screen is turned away from the camera. A whitewashed room, a deep window with green shutters, late afternoon light. 50 mm lens, warm and unposed.
**Avoid:** faces toward camera, a hospital bed, tears or distress, a visible screen.

### IMG-11 · Lab, done carefully · 3:2
**Slot:** "how a result is made" (lookup-only CPIC, GeT-RM reference data); deck.
**Alt (EN):** A gloved hand loads a sample plate in a clinical laboratory.
**Alt (AR):** يد بقفاز تضع صفيحة عيّنات في مختبر سريري.
> A gloved hand places a 96-well sample plate into the tray of a plain benchtop instrument with no visible branding. Cool white bench, a rack of capped tubes with juniper-green caps in soft focus, a window letting in daylight on the left so it feels humane rather than sterile. 85 mm lens at f/2.8, focus on the plate edge.
**Avoid:** coloured liquids, glowing screens, DNA graphics, a face mask close-up, brand names.

### IMG-12 · Corridor in daylight · 16:9
**Slot:** doctor web page background band; deck "the problem" slide.
**Alt (EN):** A daylit hospital corridor with soft motion blur.
**Alt (AR):** ممرّ مستشفى في ضوء النهار مع ضبابية حركة خفيفة.
> A long hospital corridor with tall windows along one side and a pale terrazzo floor, patterned light falling across it. Two figures in white coats walk away from the camera, softly blurred by a slow shutter. A juniper plant in a terracotta pot by a window. Calm, slightly desaturated, 35 mm lens at eye level, plenty of empty floor in the foreground.
**Avoid:** patients in beds, emergency signs, blue fluorescent light, any readable signage.

### IMG-13 · Pharmacy shelves · 16:9
**Slot:** dashboard empty state; deck background.
**Alt (EN):** Pharmacy shelves of plain medicine boxes in soft focus.
**Alt (AR):** رفوف صيدلية لعلب دواء بسيطة خارج التركيز.
> Rows of pharmacy shelves holding plain white and pale green medicine boxes with no printing, shot at a shallow angle so they fall away into soft bokeh. One shelf edge in sharp focus at the lower left. Warm window light, gentle saffron highlights on the shelf lips. 85 mm lens at f/1.8.
**Avoid:** brand names, price tags, text of any kind, cluttered colour.

### IMG-08 · Al-Qatt detail · 1:1
**Slot:** poster texture; social square; deck accent.
**Alt (EN):** Close detail of hand-painted Al-Qatt Al-Asiri wall patterns.
**Alt (AR):** تفاصيل قريبة لنقوش القطّ العسيري المرسومة باليد.
> A flat, frontal close-up of a hand-painted Al-Qatt Al-Asiri interior wall: bold bands of triangles, zigzags and stepped lozenges in saffron yellow, terracotta red, juniper green and black on white lime plaster, with visible brush marks and slight cracks in the plaster. Even soft light, no shadows, square framing, perfectly straight so it can be tiled.
**Avoid:** people, furniture, perspective distortion, modern paint sheen.

### IMG-09 · The measure · 1:1
**Slot:** "Meyar means a standard measure" story block; About; social square.
**Alt (EN):** A set of old brass apothecary weights on linen.
**Alt (AR):** مجموعة أوزان صيدلانية نحاسية قديمة على قماش الكتان.
> A nested set of old brass apothecary cup weights, one lifted out and set beside the stack, on a piece of undyed linen over a juniper-green painted wooden board. Soft overhead window light, gentle shadow, a warm brass glow without glare. Top-down at a slight angle, 100 mm macro lens at f/5.6.
**Avoid:** engraved numbers in focus, coins, gold bars, sparkle.

## Not to make

Smiling doctor portraits, handshakes, people pointing at holographic screens, blue gradients with DNA, robots, brain or heart glow graphics, a stethoscope on a keyboard, any image that implies a real patient's result. These are the stock patterns that make health products look generated.
