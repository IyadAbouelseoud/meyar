"""F3 video v2: the six chain-of-custody scans acted out on the T1 kit, paced for a presentation.

57 s, 1920x1080, 30 fps (1710 frames). Real packing: the mailer is a hollow box with a hinged lid;
the capped tube is laid in the leak-proof bag on its absorbent pad, the bag goes into the mailer and the
lid closes. Nothing disappears. The camera moves between four stations (wide, phone, tube, packing)
and holds while things happen; callouts are pinned to 3D anchors projected on hold frames
(anim/f3v2_anchors.json, used by art/make_f3_video2_art.py). The phone screens are the real kit/web
captures from art/make_f3_video_art.py.

Run from the repo root:
  D:\\blender.exe --background --factory-startup --python hardware/blender/build_f3_video2.py -- --no-render
  (then art/make_f3_video2_art.py, then render:)
  D:\\blender.exe --background --factory-startup --python hardware/blender/build_f3_video2.py
Options: --samples N (EEVEE, default 24), --pct P, --step N (contact set to anim/test_f3v2/).
Motion is decelerate-only (ease-out cubic). Every dimension is a modelling choice, not a spec.
"""
import sys, math, json, pathlib
import bpy
from mathutils import Vector, Matrix, Quaternion
from bpy_extras.object_utils import world_to_camera_view

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
import build_renders as F1          # noqa: E402
import build_f3_render as S         # noqa: E402
import build_animation as A         # noqa: E402


def arg(name, default=None, cast=str):
    return cast(argv[argv.index(name) + 1]) if name in argv else default


FPS, N = 30, 1710
SAMPLES, PCT, STEP = arg("--samples", 24, int), arg("--pct", 100, int), arg("--step", 0, int)
OUT = HERE / "frames" / "f3v2_hd"
ANCHORS = HERE / "anim" / "f3v2_anchors.json"

# phone screen state k from frame STATES[k-1]
STATES = [1, 540, 690, 1110, 1265, 1320, 1445]


def e(f, s, d):
    return A.ease_out((f - s) / d)


def smooth(f, s, d):            # camera moves: gentle start, long decelerating stop, no overshoot
    t = min(max((f - s) / d, 0.0), 1.0)
    return 1 - (1 - t) ** 3 if t > 0 else 0.0


def M(loc, q):
    return Matrix.LocRotScale(Vector(loc), q, None)


def blend(m0, m1, t, arc=0.0):
    l0, q0, _ = m0.decompose()
    l1, q1, _ = m1.decompose()
    loc = l0.lerp(l1, t)
    loc.z += math.sin(math.pi * t) * arc
    return M(loc, q0.slerp(q1, t))


def bake_matrix(ob, fn, frames):
    ob.rotation_mode = "QUATERNION"
    for f in frames:
        loc, q, _ = fn(f).decompose()
        ob.location, ob.rotation_quaternion = loc, q
        ob.keyframe_insert("location", frame=f)
        ob.keyframe_insert("rotation_quaternion", frame=f)


def hollow_mailer():
    """Replace the solid F1 mailer with a tray + hinged lid, keeping its printed panels."""
    W, D, H, t = 0.22, 0.15, 0.06, 0.003
    mailer = bpy.data.objects["Mailer"]
    board = mailer.data.materials[0]
    inner = F1.mat("Mailer inside", "#E8EBE6", rough=0.85)
    mailer.hide_render = True
    mailer.hide_viewport = True
    parts = [("Tray bottom", (W, D, t), (0, 0, -H / 2 + t / 2)),
             ("Tray front", (W, t, H), (0, -D / 2 + t / 2, 0)), ("Tray back", (W, t, H), (0, D / 2 - t / 2, 0)),
             ("Tray left", (t, D, H), (-W / 2 + t / 2, 0, 0)), ("Tray right", (t, D, H), (W / 2 - t / 2, 0, 0))]
    for name, size, loc in parts:
        ob = F1.box(name, size, board, loc=loc)
        ob.data.materials.append(inner)
        ob.parent = mailer
    liner = F1.box("Tray liner", (W - 2 * t - 0.001, D - 2 * t - 0.001, 0.0006), inner, loc=(0, 0, -H / 2 + t + 0.0003))
    liner.parent = mailer
    hinge = F1.link(bpy.data.objects.new("Lid hinge", None))
    hinge.parent = mailer
    hinge.location = (0, D / 2, H / 2)
    lid = F1.box("Lid", (W, D, t), board, loc=(0, -D / 2, t / 2), bevel_w=0.0008, seg=2)
    lid.parent = hinge
    art = bpy.data.objects["Mailer lid art"]
    art.parent = hinge
    art.location = (0, -D / 2, t + 0.0004)
    return mailer, hinge, (W, D, H, t)


def build():
    F1.reset()
    F1.build_t1()
    bpy.data.objects.remove(bpy.data.objects["Camera"])
    sc = bpy.context.scene
    S.phone_and_stand()
    base = bpy.data.objects["Phone screen"]
    screens = []
    for k in range(1, 8):
        ob = base.copy()
        ob.data = base.data.copy()
        ob.data.materials.clear()
        ob.data.materials.append(S.screen_material(f"f3v_screen_{k}.png"))
        ob.name = f"Phone screen state {k}"
        F1.link(ob)
        screens.append(ob)
    bpy.data.objects.remove(base)
    for k, ob in enumerate(screens, 1):
        start, end = STATES[k - 1], (STATES[k] if k < 7 else N + 1)
        keys = {1: k != 1, start: False}
        if end <= N:
            keys[end] = True
        for f, hide in sorted(keys.items()):
            ob.hide_render = hide
            ob.keyframe_insert("hide_render", frame=f)
    bpy.context.view_layer.update()
    scr = screens[0].matrix_world
    phone_c, phone_n = scr.translation.copy(), Vector(scr.col[2][:3]).normalized()

    mailer, hinge, (W, D, H, t) = hollow_mailer()
    tube_parts = [bpy.data.objects[n] for n in ("Tube", "Liquid", "Fill line", "Tube label")]
    tube = F1.link(bpy.data.objects.new("Tube group", None))
    for ob in tube_parts:
        ob.parent = tube
        ob.location = (0, 0, 0)
    liquid, cap, funnel = (bpy.data.objects[n] for n in ("Liquid", "Cap", "Funnel"))
    bag, pad = bpy.data.objects["Specimen bag"], bpy.data.objects["Absorbent pad"]
    bpy.context.view_layer.update()

    I = Quaternion()
    tube_home = M((0.125, -0.045, 0.0), I)
    funnel_rest = funnel.matrix_world.copy()
    funnel_dock = M((0.125, -0.045, 0.079), Quaternion((0, 0, 1), funnel.rotation_euler.z))
    cap_rest = M((0.172, 0.0, -0.0745), I)
    twist = Quaternion((0, 0, 1), -math.radians(540))
    pad_off = bag.matrix_world.inverted() @ pad.matrix_world
    # lay the bag out on open floor in front of the mailer (in F1 it sits half under it)
    bag_rest = M((0.055, -0.125, 0.0028), Quaternion((0, 0, 1), math.radians(8)))
    mailer_home = mailer.matrix_world.copy()
    mailer_away = Matrix.Translation(Vector((-0.42, 0.30, 0))) @ mailer_home
    tube_in_bag = M((0, -0.047, 0.0108), Quaternion((1, 0, 0), -math.radians(90)))    # lying on the pad
    bag_in_mailer = M((0, 0, -H / 2 + t + 0.0009), Quaternion((0, 0, 1), math.radians(90)))

    def mailer_at(f):
        if f < 1115:
            return mailer_home
        if f < 1180:
            return blend(mailer_home, mailer_away, e(f, 1115, 60))
        if f < 1195:
            return mailer_away
        return blend(mailer_away, mailer_home, e(f, 1195, 62))

    def bag_at(f):
        if f < 980:
            return bag_rest
        packed = mailer_at(f) @ bag_in_mailer
        if f < 1046:
            return blend(bag_rest, packed, e(f, 980, 64), arc=0.11)
        return packed

    def tube_at(f):
        if f < 850:
            return tube_home
        inbag = bag_at(f) @ tube_in_bag
        if f < 912:
            return blend(tube_home, inbag, e(f, 850, 60), arc=0.08)
        return inbag

    def cap_at(f):
        if f < 615:
            return cap_rest
        on = tube_at(f) @ M((0, 0, 0), twist)
        if f < 676:
            t_ = e(f, 615, 60)
            m = blend(cap_rest, tube_home, t_, arc=0.07)
            loc, q, _ = m.decompose()
            return M(loc, I.slerp(twist, t_))
        return on

    def funnel_at(f):
        if f < 400:
            return funnel_rest
        if f < 462:
            return blend(funnel_rest, funnel_dock, e(f, 400, 60), arc=0.05)
        if f < 560:
            return funnel_dock
        return blend(funnel_dock, funnel_rest, e(f, 560, 50), arc=0.04)

    frames = range(1, N + 1)
    for ob, fn in ((mailer, mailer_at), (bag, bag_at), (tube, tube_at), (cap, cap_at), (funnel, funnel_at),
                   (pad, lambda f: bag_at(f) @ pad_off)):
        bake_matrix(ob, fn, frames)
    for f in frames:
        liquid.scale = (1, 1, max(0.04, e(f, 465, 65)))
        liquid.keyframe_insert("scale", frame=f)
        a = -math.radians(112) * (e(f, 800, 50) if f < 1050 else 1 - e(f, 1050, 52))
        hinge.rotation_euler = (a, 0, 0)
        hinge.keyframe_insert("rotation_euler", frame=f)

    # ---- camera stations (location, target, lens)
    side = Quaternion((0, 0, 1), math.radians(14))
    p_dir = (side @ phone_n).normalized()
    ST = {
        "W": (S.CAM, S.TARGET + Vector((0.03, 0.0, 0.01)), 36),
        "P": (phone_c + p_dir * 0.50 + Vector((0, 0, 0.03)), phone_c, 50),
        "K": (Vector((0.07, -0.05, 0.035)) + Vector((0.33, -0.80, 0.50)).normalized() * 0.40,
              Vector((0.07, -0.05, 0.035)), 40),
        "M": (Vector((0.0, -0.02, 0.02)) + Vector((0.28, -0.70, 0.80)).normalized() * 0.66,
              Vector((0.0, -0.02, 0.02)), 36),
    }
    plan = [(1, "W"), (150, "W", "P", 60), (330, "P", "K", 70), (740, "K", "M", 60), (1275, "M", "P", 50),
            (1560, "P", "W", 70)]

    def cam_at(f):
        cur = ST["W"]
        for step in plan[1:]:
            s, a, b, d = step
            if f >= s:
                t_ = smooth(f, s, d)
                la, ta, fa = ST[a]
                lb, tb, fb = ST[b]
                cur = (la.lerp(lb, t_), ta.lerp(tb, t_), fa + (fb - fa) * t_)
        loc, tgt, lens = cur
        if f < 150:   # slow push on the opening wide
            loc = loc.lerp(tgt, 0.06 * e(f, 1, 150))
        if 1630 <= f:
            loc = loc.lerp(tgt, -0.04 * e(f, 1630, 80))
        return loc, tgt, lens

    cam = F1.camera(tuple(ST["W"][0]), tuple(ST["W"][1]), lens=36)
    cam.rotation_mode = "QUATERNION"
    for f in frames:
        loc, tgt, lens = cam_at(f)
        cam.location = loc
        cam.rotation_quaternion = (tgt - loc).to_track_quat("-Z", "Y")
        cam.data.lens = lens
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
        cam.data.keyframe_insert("lens", frame=f)

    A.ENGINE, A.SAMPLES, A.PCT, A.FPS, A.FRAMES = "eevee", SAMPLES, PCT, FPS, N
    A.setup(sc)
    sc.render.use_motion_blur = False
    m = bpy.data.materials["PP translucent"]
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Transmission Weight"].default_value = 0.0
    p.inputs["Alpha"].default_value = 0.55
    m.surface_render_method = "BLENDED"
    film = bpy.data.materials["Bag film"].node_tree.nodes["Principled BSDF"]
    film.inputs["Alpha"].default_value = 0.55   # read as a bag on camera
    film.inputs["Base Color"].default_value = F1.lin("#D3E3D8")
    padm = bpy.data.materials["Absorbent pad"].node_tree.nodes["Principled BSDF"]
    padm.inputs["Base Color"].default_value = F1.lin("#F6F1E4")
    sc.render.filepath = str(OUT / "f_")

    # ---- callout anchors: (id, frame to project, object, local offset)
    specs = [("phone", 60, screens[0], (0, 0.03, 0)), ("tube", 60, tube, (0.009, 0, 0.045)),
             ("funnel", 60, funnel, (0, 0, 0.03)), ("bag", 60, bag, (0.03, -0.04, 0)),
             ("mailer", 60, mailer, (0.08, -0.02, H / 2)), ("phone_scan1", 260, screens[0], (0, -0.02, 0)),
             ("funnel_dock", 500, funnel, (0.0, 0, 0.03)), ("cap_on", 700, cap, (0, 0, 0.088)),
             ("bag_tube", 940, tube, (0, 0, 0.05)), ("pad", 940, pad, (0.02, 0.03, 0)),
             ("mailer_closed", 1105, mailer, (0.0, 0.0, H / 2)), ("phone_verify", 1380, screens[0], (0, -0.045, 0)),
             ("phone_tamper", 1500, screens[0], (0, 0.03, 0))]
    out = {}
    for key, f, ob, off in specs:
        sc.frame_set(f)
        bpy.context.view_layer.update()
        w = ob.matrix_world @ Vector(off)
        v = world_to_camera_view(sc, sc.camera, w)
        out[key] = [round(v.x * 1920, 1), round((1 - v.y) * 1080, 1)]
    ANCHORS.parent.mkdir(exist_ok=True)
    ANCHORS.write_text(json.dumps(out, indent=1))
    print("anchors", out)
    return sc


if __name__ == "__main__":
    sc = build()
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "meyar_f3_video2.blend"), compress=True)
    if "--no-render" in argv:
        sys.exit(0)
    if STEP:
        test = HERE / "anim" / "test_f3v2"
        test.mkdir(parents=True, exist_ok=True)
        for f in range(1, N + 1, STEP):
            sc.frame_set(f)
            sc.render.filepath = str(test / f"f_{f:04d}.png")
            bpy.ops.render.render(write_still=True)
    else:
        OUT.mkdir(parents=True, exist_ok=True)
        bpy.ops.render.render(animation=True)
