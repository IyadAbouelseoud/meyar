"""F3 video: the six chain-of-custody scans acted out on the T1 kit, with the phone showing the
real kit software after each scan, then the tampered state. 1920x1080, 30 fps, 450 frames (15 s).

Beats (frames):   1 issued 1–60 · 2 collected 61–150 (funnel docks, sample fills) · 3 sealed 151–210
(funnel away, cap twists on) · 4 shipped 211–300 (tube into the mailer, mailer moves off) ·
5 received 301–345 (mailer back) · 6 genotyped 346–390 · 7 tampered 391–450.
The phone screen swaps to the capture of the state after each scan (art/make_f3_video_art.py).

Run from the repo root (after make_f3_video_art.py):
  D:\\blender.exe --background --factory-startup --python hardware/blender/build_f3_video.py
Options: --samples N (EEVEE, default 32), --pct P, --step N (contact set), --no-render.
Frames: frames/f3/f_####.png (resumable). Then: uv run --no-project python hardware/blender/encode_f3_video.py
All motion is decelerate-only (ease-out cubic). Every dimension is a modelling choice, not a spec.
"""
import sys, math, pathlib
import bpy
from mathutils import Vector

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
import build_renders as F1          # noqa: E402
import build_f3_render as S         # noqa: E402  (phone, stand, screen material, camera framing)
import build_animation as A         # noqa: E402  (EEVEE setup and fixes from F2)

def arg(name, default=None, cast=str):
    return cast(argv[argv.index(name) + 1]) if name in argv else default

FRAMES, FPS = 450, 30
SAMPLES = arg("--samples", 32, int)
PCT = arg("--pct", 100, int)
STEP = arg("--step", 0, int)
OUT = HERE / "frames" / "f3"
SWAPS = [1, 120, 200, 285, 330, 360, 400]   # frame where screen state k (1..7) appears


def ease(f, start, dur):
    return A.ease_out((f - start) / dur)


def lerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def build():
    F1.reset()
    F1.build_t1()
    bpy.data.objects.remove(bpy.data.objects["Camera"])
    sc = bpy.context.scene
    rig = S.phone_and_stand()

    # one screen plane per state, shown in turn
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
        start, end = SWAPS[k - 1], (SWAPS[k] if k < 7 else FRAMES + 1)
        for f, hide in ((1, True), (start, False), (end, True)):
            if f > FRAMES:
                continue
            ob.hide_render = hide if not (k == 1 and f == 1) else False
            ob.keyframe_insert("hide_render", frame=f)
            ob.hide_viewport = ob.hide_render
            ob.keyframe_insert("hide_viewport", frame=f)

    # --- the tube assembly moves as one
    tube_parts = [bpy.data.objects[n] for n in ("Tube", "Liquid", "Fill line", "Tube label")]
    tube_home = Vector((0.125, -0.045, 0.0))
    tube = F1.link(bpy.data.objects.new("Tube group", None))
    tube.location = tube_home
    for ob in tube_parts:
        ob.parent = tube
        ob.location = (0, 0, 0)
    liquid = bpy.data.objects["Liquid"]
    cap = bpy.data.objects["Cap"]
    funnel = bpy.data.objects["Funnel"]
    mailer = bpy.data.objects["Mailer"]
    tube_label_top = 0.0805

    funnel_rest = (Vector(funnel.location), tuple(funnel.rotation_euler))
    funnel_dock = Vector((tube_home.x, tube_home.y, tube_label_top - 0.0015))
    cap_rest = Vector((0.175, -0.005, -0.0745))           # standing on the floor beside the tube
    mailer_home = Vector(mailer.location)
    mailer_away = mailer_home + Vector((-0.02, 0.11, 0))
    mailer_xy = Vector((mailer_home.x, mailer_home.y, 0))

    def funnel_at(f):
        lo, rot0 = funnel_rest
        up = (lo, rot0)
        if f < 66:
            return up
        if f < 106:     # rise, swing upright, dock on the tube
            t = ease(f, 66, 40)
            p = lerp(lo, funnel_dock, t)
            p.z += math.sin(math.pi * min(1, (f - 66) / 40)) * 0.05
            return p, (rot0[0] * (1 - t), 0, rot0[2])
        if f < 152:
            return funnel_dock, (0, 0, rot0[2])
        t = ease(f, 152, 28)   # back to the floor
        p = lerp(funnel_dock, lo, t)
        p.z += math.sin(math.pi * min(1, (f - 152) / 28)) * 0.04
        return p, (rot0[0] * t, 0, rot0[2])

    def cap_at(f):
        if f < 168:
            return cap_rest, (0, 0, 0)
        t = ease(f, 168, 34)
        target = tube_home.copy()
        p = lerp(cap_rest, target, t)
        p.z += math.sin(math.pi * min(1, (f - 168) / 34)) * 0.06
        return p, (0, 0, -math.radians(540) * t)

    def tube_at(f):
        if f < 214:
            return tube_home, None
        if f < 250:     # lift and carry over the mailer
            t = ease(f, 214, 36)
            p = lerp(tube_home, mailer_xy + Vector((0, 0, 0.075)), t)
            p.z += math.sin(math.pi * min(1, (f - 214) / 36)) * 0.05
            return p, None
        t = ease(f, 250, 22)   # lower into the mailer
        return mailer_xy + Vector((0, 0, 0.075 - 0.13 * t)), None

    def mailer_at(f):
        if f < 268:
            return mailer_home, None
        if f < 302:
            return lerp(mailer_home, mailer_away, ease(f, 268, 30)), None
        return lerp(mailer_away, mailer_home, ease(f, 302, 30)), None

    frames = range(1, FRAMES + 1)
    A.bake(funnel, frames, funnel_at)
    A.bake(tube, frames, tube_at)
    A.bake(mailer, frames, mailer_at)
    # cap follows the tube once it is on
    def cap_world(f):
        if f < 214:
            return cap_at(f)
        loc, _ = tube_at(f)
        return loc, (0, 0, -math.radians(540))
    A.bake(cap, frames, cap_world)
    for f in frames:   # sample fills while the funnel is docked
        liquid.scale = (1, 1, max(0.04, ease(f, 100, 40)))
        liquid.keyframe_insert("scale", frame=f)
    # tube and cap disappear once inside the box
    for ob in tube_parts + [cap]:
        for f, hide in ((1, False), (270, True)):
            ob.hide_render = hide
            ob.keyframe_insert("hide_render", frame=f)
    # the rig and stand follow the mailer? no: they stay. Linear keys everywhere.
    for ob in bpy.data.objects:
        ad = ob.animation_data
        if ad and ad.action:
            for fc in getattr(ad.action, "fcurves", []):
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR" if fc.data_path != "hide_render" else "CONSTANT"

    # camera: the still's framing with a slow decelerating push-in
    target = S.TARGET + Vector((0.03, 0.0, 0.01))   # a little right of the still, for 16:9
    cam = F1.camera(tuple(S.CAM), tuple(target), lens=36)
    cam.data.dof.use_dof = False
    for f in frames:
        t = ease(f, 1, FRAMES)
        cam.location = S.CAM.lerp(target, 0.08 * t)
        cam.keyframe_insert("location", frame=f)

    A.ENGINE, A.SAMPLES, A.PCT, A.FPS, A.FRAMES = "eevee", SAMPLES, PCT, FPS, FRAMES
    A.setup(sc)
    sc.render.use_motion_blur = False
    # milky funnel plastic: blended alpha under EEVEE (raytraced transmission renders it grey metal)
    m = bpy.data.materials["PP translucent"]
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Transmission Weight"].default_value = 0.0
    p.inputs["Alpha"].default_value = 0.55
    m.surface_render_method = "BLENDED"
    sc.render.filepath = str(OUT / "f_")
    return sc


if __name__ == "__main__":
    sc = build()
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "meyar_f3_video.blend"), compress=True)
    if "--no-render" in argv:
        sys.exit(0)
    if STEP:
        test = HERE / "anim" / "test_f3"
        test.mkdir(parents=True, exist_ok=True)
        for f in range(1, FRAMES + 1, STEP):
            sc.frame_set(f)
            sc.render.filepath = str(test / f"f_{f:04d}.png")
            bpy.ops.render.render(write_still=True)
    else:
        OUT.mkdir(parents=True, exist_ok=True)
        bpy.ops.render.render(animation=True)
