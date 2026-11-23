"""F3 render: the working chain-of-custody software on a phone, beside the T1 saliva kit.

Reuses the F1 T1 scene (build_renders.build_t1) and adds a generic, unbranded phone on a plain
desk stand. The phone screen is a real capture of kit/web (art/make_f3_art.py), not a drawing.

Run (from the repo root, after art/make_f3_art.py):
  D:\\blender.exe --background --factory-startup --python hardware/blender/build_f3_render.py -- --variant intact
  D:\\blender.exe --background --factory-startup --python hardware/blender/build_f3_render.py -- --variant tampered
Options: --samples N (default 160), --pct P (preview size), --no-render.

Writes meyar_f3_<variant>.blend, raw/f3_<variant>.png and, with the caption strip baked on,
renders/meyar-f3-<variant>-kit-software.png (3000 x 2000). Label: "Kit design — software working"
(T1 only; nothing here is placed on T3 or T4). Every dimension is a modelling choice, not a spec.
"""
import sys, math, pathlib
import bpy
import numpy as np
from mathutils import Vector, Matrix

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_renders as F1  # noqa: E402  (argv parsing there reads --samples/--pct/--no-render)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
VARIANT = argv[argv.index("--variant") + 1] if "--variant" in argv else "intact"
assert VARIANT in ("intact", "tampered")

PHONE_W, PHONE_H, PHONE_T = 0.0716, 0.1505, 0.0078
SCREEN_W, SCREEN_H = 0.0660, 0.1430          # 390:844 capture aspect (0.462)
LEAN = math.radians(24)                      # leans back from vertical on the stand
CAM = Vector((0.27, -0.58, 0.31))
TARGET = Vector((-0.085, -0.03, 0.045))
P = Vector((-0.165, -0.150, 0.0))            # stand position on the floor


def screen_material(image, strength=1.0, gloss=0.04):
    """A lit display: the capture as pure emission, plus a faint glass reflection.
    A lit (Principled) surface would add the studio's diffuse and specular light on top
    and wash the text out."""
    m = bpy.data.materials.new("Phone screen — capture of kit/web")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(F1.ART / image))
    tex.interpolation = "Cubic"
    tex.extension = "CLIP"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = strength
    glass = nt.nodes.new("ShaderNodeBsdfGlossy")
    glass.inputs["Roughness"].default_value = 0.05
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = gloss
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs[0], mix.inputs[1])
    nt.links.new(glass.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


def phone_and_stand():
    u = Vector((0, math.sin(LEAN), math.cos(LEAN)))      # phone long axis (up the stand)
    n = Vector((0, -math.cos(LEAN), math.sin(LEAN)))     # screen normal (toward the camera)
    rig = F1.link(bpy.data.objects.new("F3 phone rig", None))
    d = CAM - P
    rig.rotation_euler = (0, 0, math.atan2(d.x, -d.y))
    rig.location = P

    stand_m = F1.mat("Stand (generic prop)", "#C9CFCA", rough=0.55)
    base = F1.box("Stand base", (0.085, 0.078, 0.004), stand_m, loc=(0, 0.024, 0.002), bevel_w=0.0012, seg=3)
    lip = F1.box("Stand lip", (0.085, 0.004, 0.012), stand_m, loc=(0, -0.0125, 0.006), bevel_w=0.001, seg=3)
    top = Vector((0, 0.004, 0)) + u * 0.095
    wedge = F1.prism("Stand back", [(0.0, 0.004), (0.062, 0.004), (top.y, top.z)], 0.06, stand_m, bevel_w=0.001, seg=3)
    for ob in (base, lip, wedge):
        ob.parent = rig

    body_m = F1.mat("Phone body (generic prop)", F1.HEX["ink.1"], rough=0.32, metal=0.4, coat=0.6)
    body = F1.panel("Phone body", PHONE_W, PHONE_H, body_m, r=0.009, thickness=PHONE_T)
    F1.bevel(body, 0.0012, 3)
    screen_m = screen_material(f"f3_screen_{VARIANT}.png")
    screen = F1.panel("Phone screen", SCREEN_W, SCREEN_H, screen_m, r=0.006)
    centre = Vector((0, 0.0045, 0.004)) + u * (PHONE_H / 2) + n * PHONE_T
    m = Matrix((Vector((1, 0, 0)), u, n)).transposed().to_4x4()
    for ob, off in ((body, 0.0), (screen, 0.0003)):
        mm = m.copy()
        mm.translation = centre + n * off
        ob.parent = rig
        ob.matrix_basis = mm
    return rig


def compose(raw_png, caption_png, out_png):
    def load(path):
        img = bpy.data.images.load(str(path))
        img.colorspace_settings.name = "Non-Color"
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        return (w, h), px.reshape(h, w, 4)
    (w, h), raw = load(raw_png)
    size, cap = load(caption_png)
    assert (w, h) == size == (3000, 2000), f"sizes {w}x{h} vs {size}"
    a = cap[..., 3:4]
    raw[..., :3] = cap[..., :3] * a + raw[..., :3] * (1 - a)
    raw[..., 3] = 1.0
    res = bpy.data.images.new("out", w, h, alpha=False)
    res.colorspace_settings.name = "Non-Color"
    res.pixels.foreach_set(raw.ravel())
    res.filepath_raw = str(out_png)
    res.file_format = "PNG"
    res.save()
    print("wrote", out_png)


if __name__ == "__main__":
    F1.reset()
    F1.build_t1()
    # Re-frame the F1 camera a little wider and lower-left to make room for the phone.
    bpy.data.objects.remove(bpy.data.objects["Camera"])
    F1.camera(tuple(CAM), tuple(TARGET), lens=50, fstop=11, focus=(CAM - (P + Vector((0, 0, 0.07)))).length)  # phone in focus
    phone_and_stand()
    blend = HERE / f"meyar_f3_{VARIANT}.blend"
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    print("saved", blend)
    if F1.DO_RENDER:
        raw = F1.RAW / f"f3_{VARIANT}.png"
        bpy.context.scene.render.filepath = str(raw)
        bpy.ops.render.render(write_still=True)
        print("rendered", raw)
        if F1.PCT == 100:
            out = HERE / "renders" / f"meyar-f3-{VARIANT}-kit-software.png"
            compose(raw, F1.ART / f"caption_f3_{VARIANT}.png", out)
