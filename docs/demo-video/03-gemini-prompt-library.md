# Meyar demo video · Gemini image prompt library

Ten new images, and only where nothing we already own will do. Everything else in the video is a Blender render, a real screen recording, or a motion graphic. Two of the ten are optional.

## Before you generate

**Reuse first.** These already exist in the repo (`design/imagery/`, 1920 px WebP) and are used in the video as they are:

| Existing | Used in | Why it's enough |
|---|---|---|
| IMG-15 brass balance + capsule | S6 recap and end-card background (blurred) | Already our hero still |
| IMG-11 gloved hand loads a 96-well plate | S2a, Phase 1 | Exactly the beat. It's 3:2, so crop it to 16:9 in Photo Craft, or use G-03 below if the crop loses the plate |
| IMG-13 pharmacy shelves | S4 OTC-check beat, behind the phone | Unbranded shelves |
| IMG-14 card shown at a pharmacy | S4 pharmacist beat | Hands-only, already on-palette |
| IMG-02 older woman reading her phone | S4 chapter opener | Calm, dignified, screen not visible |

**What's banned in every image** (from `design/imagery/PROMPTS.md` "Not to make"): smiling doctor portraits, handshakes, people pointing at holograms, blue gradients with DNA helices, robots, glowing organs, a stethoscope on a keyboard, any readable brand, any image that implies a real patient's result.

**Honesty rule for the edit:** every AI image carries a small `صورة توضيحية` tag in its corner when it's on screen (see master plan, label rules). These pictures set the scene; they never stand in for our product, our lab, or a real result.

## How to run each prompt

1. Open Gemini image generation ("Nano Banana"). Paste the **Series style** block, then one prompt.
2. Generate at the aspect ratio given. Make 4 takes and keep the best one.
3. **Keep the series consistent.** Once you have one image you love, attach it to every later prompt and add: *"Match the colour grade, light and grain of the attached image. Do not copy its objects."* Our existing IMG-11 is a good anchor for the lab set.
4. If a take has text, a logo, a face in close-up, or a strange hand: *"Same image, remove all text and logos"* or *"Same image, fix the hands so each has five fingers in a natural grip"*.
5. Save as PNG named by ID (`G-01.png` and so on) into `demo-video/images/raw/` and hand it over. Photo Craft finishing happens next (bottom of this file).

## Series style (paste before every prompt)

> Editorial documentary photograph for a Saudi health technology product from the Aseer region. Natural, quiet and real, shot on a full-frame camera with a 50 mm or 85 mm lens at f/2.8, soft directional window daylight, gentle shadows, fine film grain. Colour palette held to deep juniper green, warm saffron, terracotta, whitewashed lime plaster, brass and undyed linen; low saturation, rich midtones, no teal-and-orange grade. Real textures: plaster, stone, wood, paper. Medicines are plain and unbranded. No text, letters, numbers, logos or watermarks anywhere in the image. No faces in close-up; people are seen from behind, in profile at a distance, or only as hands. Modest Saudi dress where people appear. No glowing effects, no holograms, no DNA helix, no stethoscope cliché.

For the lab images (G-02, G-03, G-04) add this line after the series style:

> Clinical laboratory version: clean white benches and pale grey surfaces, daylight from a side window, cool but humane, still low saturation. Gloves are nitrile in a muted grey-blue. Instruments are plain and generic with no visible branding, no screens showing data.

---

## The prompts

### G-01 · The ordinary prescription · 16:9 · S0 hook, first frame
**This is the first thing the judges see, so it has to be strong at frame 1.** It will hold for about 6 seconds with a slow push in.
> Overhead three-quarter view of a dentist's consultation desk made of pale oak against a whitewashed plaster wall. On the desk: a small plain white medicine box with no printing at all, a blank prescription slip half tucked under it, a capped pen, and a folded pair of reading glasses. A juniper-green ceramic cup of Arabic coffee sits at the edge of frame, slightly out of focus. Low late-morning sun from the left throws long soft shadows across the paper. 50 mm lens at f/2.8, focus on the box edge. Calm, ordinary, nothing dramatic. Leave clean empty plaster in the upper third for a title.
**Avoid:** any writing on the slip or box, pill blisters spilling, dental tools, a phone, a laptop.

### G-02 · Central lab, establishing · 16:9 · S2a opener
> A wide view of a small, modern clinical genetics laboratory in Saudi Arabia, seen from the doorway. Long white benches, a biosafety cabinet with its sash half open, racks of capped sample tubes with juniper-green caps, a centrifuge and a plain benchtop instrument with no branding. Tall windows along the left wall let in soft daylight onto a pale terrazzo floor. One technician in a white coat and hijab works at the far bench, seen from behind and small in frame. 35 mm lens at eye level, deep focus, calm and orderly, slightly desaturated.
**Avoid:** blue LED lighting, glowing screens, DNA graphics, hazard signs with text, a face toward camera.

### G-03 · DNA extraction, hands · 16:9 · S2a Phase 1
> Close-up of gloved hands at a white lab bench: one hand holds a single-channel pipette drawing clear liquid from a saliva collection tube with a juniper-green screw cap; the other steadies a small rack of identical tubes. Each tube carries a plain white label with a printed black barcode pattern but no readable characters. Daylight from the left, soft shadows, shallow depth of field, focus on the pipette tip entering the tube. 85 mm lens at f/2.8.
**Avoid:** coloured liquids, bubbles, gel images, readable characters on labels, a face.
**Note:** if Gemini prints fake text on the labels, ask for "barcode stripes only, no characters". The barcode is decoration here; the real, scannable Code 128 lives on the Blender box.

### G-04 · The plate meets the instrument · 16:9 · S2a Phase 1 (only if the IMG-11 crop fails)
> A gloved hand slides a 96-well sample plate into the open tray of a plain white benchtop genotyping instrument with no visible branding or screen. The plate's wells hold tiny clear droplets. A rack of capped tubes with juniper-green caps sits in soft focus behind. Window daylight from the left so the scene feels humane rather than sterile. 85 mm lens at f/2.8, focus on the plate edge, horizontal 16:9 framing with the plate at the right third.
**Avoid:** coloured liquids, glowing displays, robotic arms, DNA graphics, brand names.

### G-05 · Doctor's desk, screen off · 16:9 · S3b establishing (screen replacement)
**Purpose:** one 3-second shot before we cut into the browser window. Effect Craft corner-pins our real screen recording onto this monitor, then pushes into it.
> A hospital doctor's desk by a tall window in daylight: a slim modern computer monitor facing the camera at a slight angle, its screen completely plain flat mid-grey with no reflections and no content, a keyboard, a closed paper chart, a small juniper plant in a terracotta pot. A white coat hangs on the chair back. Nobody in frame. 35 mm lens, eye level, soft daylight, calm, low saturation. The monitor screen must be a clean, evenly lit, flat rectangle with sharp corners.
**Avoid:** anything on the screen, a stethoscope, readable papers, brand logos on the monitor.

### G-06 · Hand and phone, screen off · 9:16 · S4 establishing (screen replacement)
**Purpose:** one 3-second shot that opens the Passport chapter; our real phone recording is corner-pinned onto it before we cut to the clean phone frame.
> An older Saudi man's hand, with a simple silver ring, holds a modern smartphone upright in front of a whitewashed plaster wall with a hand-painted Al-Qatt Al-Asiri band in saffron, terracotta and green softly out of focus behind. The thobe sleeve is white. The phone screen is a completely plain flat mid-grey rectangle with no content, no notch graphics and no reflections. Morning window light from the right. 50 mm lens at f/2.8, focus on the phone edges. Vertical 9:16 framing, phone filling the middle third.
**Avoid:** a visible face, any content or logo on the phone, an Apple-style camera bump that reads as a specific brand, extra fingers.

### G-07 · Cath lab, dim · 16:9 · S5 backdrop behind T3 (optional)
**Purpose:** a heavily blurred backdrop that says "this would live in a cath lab". It sits behind the T3 render at 30–40% opacity with heavy blur, never sharp.
> A cardiac catheterisation lab in low, dim light: a patient table with a crisp white sheet and nobody on it, a large ceiling-mounted C-arm, monitors switched off and dark, cool ambient light with a single warm practical lamp. Wide 24 mm lens, eye level, soft focus throughout. Quiet, empty, no people.
**Avoid:** readable screens, blood, patients, staff, emergency drama, logos on equipment.

### G-08 · Handheld scanner, design reference · 4:3 · Blender modelling reference only (never on screen)
**Purpose:** gives whoever models the scanner in Blender a shape to aim at. It's a reference, not footage.
> Product design reference photograph of a generic handheld barcode scanner on a seamless pale grey-green studio background: a pistol-grip body in matte warm white polymer with a juniper-green trigger and a thin juniper-green accent band around the scan window, a dark tinted scan window at the front, smooth large radii, no visible screws, no buttons other than the trigger. Shown in three-quarter view from the front left, soft studio light, gentle contact shadow. Clean industrial design, medical-grade feel.
**Avoid:** any brand name or logo, cables tangled across the frame, a red laser beam (we add that in Blender), a screen on the scanner.

### G-09 · Kit handed over at a clinic counter · 16:9 · S1 (optional, only if S1 runs short of visual variety)
> A clinic reception counter of pale stone in an Aseer primary care centre. A nurse's gloved hands slide a closed juniper-green kit box with a white end panel across the counter toward a patient's hands in a white thobe sleeve. Only hands and forearms are in frame. Daylight from a window behind, soft shadows. 50 mm lens at f/2.8, focus on the box.
**Avoid:** any printing or logo on the box (our real box is the Blender one), faces, queue tickets with numbers.

### G-10 · Plaster texture plate · 16:9 · end card and chapter cards background
> A straight-on, evenly lit photograph of a whitewashed lime-plaster wall with subtle hand-trowelled texture and very faint warm variation, no objects, no shadows, no cracks, no stains. Flat front light, 50 mm lens, everything in focus. Pure texture for use as a background.
**Avoid:** any pattern, painting, writing, damage or vignette.

---

## Photo Craft finishing (do this to every image before it goes into the edit)

The goal is "looks photographed", not "looks generated". Work in this order, one pass per image, about 5 minutes each.

1. **Hunt the tells.** Zoom to 200% and check: fingers (count them), fingernails, ring and sleeve edges, label "barcodes" that turned into fake letters, pipette tips that melt into tubes, symmetric repeating tube racks, impossible reflections. Fix with healing/clone, or regenerate.
2. **Kill every character.** Any glyph-like mark anywhere gets healed out. A judge reading Arabic or English gibberish on a lab label is the fastest way to "this is AI".
3. **Unify the grade.** Apply one shared look to all ten: lift blacks very slightly, pull saturation down about 10%, nudge midtones toward juniper (not teal). Save it as `meyar-grade.cube` with Photo Craft's LUT export and reuse it in Film Craft on the Blender and screen footage too, so all three sources sit in one world.
4. **Add real grain.** Same fine grain on every image (monochromatic, small size). AI images are too clean. Grain is the cheapest realism there is.
5. **Soften the "too perfect" focus.** A touch of lens vignetting and very slight chromatic softness toward the edges.
6. **Screen-replacement plates (G-05, G-06):** make sure the screen rectangle is clean and flat. Put four guide points exactly on the screen corners in a separate layer and export them as a PNG overlay, so Effect Craft's corner-pin lands perfectly.
7. **Export:** 3840 × 2160 PNG for 16:9 plates (2160 × 3840 for G-06), so the Ken Burns push in the edit never goes soft. Name them `G-01_final.png` and so on, into `demo-video/images/final/`.
