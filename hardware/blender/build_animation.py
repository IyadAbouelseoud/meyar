"""F2 — Meyar hardware animation: T1 kit turntable + T3 cath-lab unit exploded view.

Reuses the F1 models in build_renders.py (no copies), then adds motion, 16:9 cameras and,
for T3, generic concept internals that are revealed when the shell lifts.

Run one shot (headless, from the repo root):
  blender --background --factory-startup --python hardware/blender/build_animation.py -- --shot t1
  blender --background --factory-startup --python hardware/blender/build_animation.py -- --shot t3
Options:
  --engine eevee|cycles   (default eevee)      --samples N   (render samples)
  --pct N                 resolution percentage for quick previews
  --still F               render only frame F to anim/test_<shot>_<F>.png
  --no-render             only build and save meyar_anim_<shot>.blend

Writes hardware/blender/meyar_anim_<shot>.blend, frames to hardware/blender/frames/<shot>/ (git-ignored;
existing frames are skipped, so a stopped render resumes), and for t3 anim/t3_anchors.json, the
screen position of each callout anchor on the final (static) frame, used by art/make_video_art.py.

Every dimension and offset here is a modelling choice for a concept animation, not a specification
or a sourced fact. Nothing in this file is shown as a number on screen.
"""
import bpy, math, json, sys, pathlib
from mathutils import Vector

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_renders as B  # noqa: E402  (F1 builders; its own argv parsing ignores our flags)
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None, cast=str):
    return cast(argv[argv.index(name) + 1]) if name in argv else default


SHOT = arg("--shot", "t1")
ENGINE = arg("--engine", "eevee")
SAMPLES = arg("--samples", None, int)
PCT = arg("--pct", 100, int)
STILL = arg("--still", None, int)
DO_RENDER = "--no-render" not in argv
FPS = 30
FRAMES = {"t1": 195, "t3": 225}[SHOT]
END = arg("--end", None, int)  # render only frames 1..END (timing tests)
STEP = arg("--step", None, int)  # contact sheet: every STEP-th frame to anim/test_<shot>/

ANIM = HERE / "anim"
ANIM.mkdir(exist_ok=True)
FRAMES_DIR = HERE / "frames" / SHOT


# ---------------------------------------------------------------- easing (decelerate only, nothing bounces)
def ease_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3


def ramp(f, start, dur):
    return ease_out((f - start) / dur)


def bake(ob, frames, fn):
    """Key location/rotation for every frame from fn(frame) -> (loc, rot_or_None). Linear keys, so the
    saved .blend plays exactly what was rendered."""
    for f in frames:
        loc, rot = fn(f)
        ob.location = loc
        ob.keyframe_insert("location", frame=f)
        if rot is not None:
            ob.rotation_euler = rot
            ob.keyframe_insert("rotation_euler", frame=f)


# ---------------------------------------------------------------- scene setup for video
def setup(sc):
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.render.resolution_percentage = PCT
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, FRAMES
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.use_overwrite = False
    sc.render.use_placeholder = True
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    if ENGINE == "cycles":
        sc.render.engine = "CYCLES"
        sc.cycles.samples = SAMPLES or 48
        sc.cycles.use_adaptive_sampling = True
        sc.cycles.use_denoising = True
        sc.render.use_persistent_data = True
    else:
        sc.render.engine = "BLENDER_EEVEE"
        ee = sc.eevee
        ee.taa_render_samples = SAMPLES or 64
        for prop, val in (("use_raytracing", True), ("use_shadows", True), ("use_gtao", True),
                          ("ray_tracing_method", "SCREEN"), ("use_volumetric_shadows", False)):
            if hasattr(ee, prop):
                try:
                    setattr(ee, prop, val)
                except (TypeError, ValueError):
                    pass
        if hasattr(ee, "ray_tracing_options"):
            ee.ray_tracing_options.resolution_scale = "1"
            ee.ray_tracing_options.use_denoise = True
        # thin films and cover glass: blended alpha instead of raytraced transmission (EEVEE renders
        # them grey, and refraction hid the T3 screen artwork under its cover glass)
        for name, alpha in (("Bag film", 0.28), ("Cover glass", 0.08)):
            film = bpy.data.materials.get(name)
            if film:
                p = film.node_tree.nodes["Principled BSDF"]
                p.inputs["Transmission Weight"].default_value = 0.0
                p.inputs["Alpha"].default_value = alpha
                p.inputs["Roughness"].default_value = 0.08
                film.surface_render_method = "BLENDED"
        # transmissive plastics: let EEVEE raytrace refraction instead of rendering them opaque
        for m in bpy.data.materials:
            if not m.use_nodes:
                continue
            p = m.node_tree.nodes.get("Principled BSDF")
            if p and p.inputs["Transmission Weight"].default_value > 0:
                if hasattr(m, "surface_render_method"):
                    m.surface_render_method = "DITHERED"
                if hasattr(m, "use_raytrace_refraction"):
                    m.use_raytrace_refraction = True
                if hasattr(m, "use_screen_refraction"):
                    m.use_screen_refraction = True


def empty(name, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.02
    e.location = loc
    return B.link(e)


def make_camera(lens=50, fstop=11):
    cd = bpy.data.cameras.new("VideoCam")
    cd.lens = lens
    cd.sensor_width = 36
    cd.sensor_fit = "HORIZONTAL"
    cam = B.link(bpy.data.objects.new("VideoCam", cd))
    target = empty("CamTarget")
    tr = cam.constraints.new("TRACK_TO")
    tr.target = target
    tr.track_axis = "TRACK_NEGATIVE_Z"
    tr.up_axis = "UP_Y"
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = fstop
    cd.dof.focus_object = target
    bpy.context.scene.camera = cam
    return cam, target


def orbit(target, az_deg, el_deg, dist):
    az, el = math.radians(az_deg), math.radians(el_deg)
    t = Vector(target)
    return t + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * dist


def drop_f1_camera():
    for ob in [o for o in bpy.data.objects if o.type == "CAMERA" and o.name == "Camera"]:
        bpy.data.objects.remove(ob, do_unlink=True)


def widen_studio(push_back=0.25):
    """Move the sweep back so nothing on the turntable or in the explode ever touches the curve."""
    sw = bpy.data.objects["Sweep"]
    sw.location.y += push_back
    sw.scale.x = 2.0
    return sw


# ================================================================ shot A: T1 turntable
def shot_t1():
    sc = B.reset()
    B.build_t1()
    drop_f1_camera()
    widen_studio(0.25)
    # Re-arrange the F1 still-life around the mailer so the turntable stays centred (layout only;
    # the models are F1's). Mailer at the centre, bag in front, tube and funnel either side.
    ob = bpy.data.objects
    ob["Mailer"].location = (0.0, 0.045, ob["Mailer"].location.z)
    for n in ("Tube", "Liquid", "Fill line", "Tube label", "Cap"):
        ob[n].location = (0.155, -0.115, 0.0)
    ob["Funnel"].location = (-0.165, -0.105, 0.0207)
    ob["Funnel"].rotation_euler = (math.radians(90), 0, math.radians(200))
    for n, z in (("Specimen bag", 0.0028), ("Absorbent pad", 0.0012)):
        ob[n].location = (0.0, -0.14, z)
        ob[n].rotation_euler = (0, 0, math.radians(84))
    kit = [o for o in sc.objects if o.type == "MESH" and o.name != "Sweep" and o.parent is None]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in kit for c in o.bound_box]
    cx, cy = ob["Mailer"].location.x, ob["Mailer"].location.y   # spin about the mailer, the hero object
    pivot = empty("Turntable", (cx, cy, 0))
    bpy.context.view_layer.update()
    for o in kit:
        mw = o.matrix_world.copy()
        o.parent = pivot
        o.matrix_parent_inverse = pivot.matrix_world.inverted()
        o.matrix_world = mw
    radius = max(math.hypot(p.x - cx, p.y - cy) for p in pts)
    print(f"turntable centre ({cx:.3f},{cy:.3f}) radius {radius:.3f}")

    # one full turn over the shot, constant speed (a turntable), keyed per frame
    bake(pivot, range(1, FRAMES + 1),
         lambda f: ((cx, cy, 0), (0, 0, 2 * math.pi * (f - 1) / FRAMES)))
    cam, target = make_camera(lens=50, fstop=32)
    cam.data.dof.use_dof = False   # keep the whole kit sharp as it turns
    tgt = Vector((cx, cy, 0.0))
    bake(target, [1], lambda f: (tgt, None))
    # gentle push-in that decelerates to rest
    bake(cam, range(1, FRAMES + 1),
         lambda f: (orbit(tgt, 28, 30, 0.92 - 0.08 * ramp(f, 1, FRAMES)), None))
    setup(sc)
    return sc


# ================================================================ shot B: T3 exploded view
EXPLODE_START = 36
EXPLODE_DUR = 66
HOLD_FROM = 150   # camera at rest from here; callouts fade in over the hold


def shot_t3():
    sc = B.reset()
    B.build_t3()
    drop_f1_camera()
    widen_studio(0.3)
    H = B.HEX
    ob = bpy.data.objects

    # ---- concept internals, hidden inside the solid shell until it lifts (generic shapes, no spec)
    tray_m = B.mat("Chassis tray", H["stone.300"], rough=0.5, metal=0.3)
    pcb_m = B.mat("Main board", H["kohl.850"], rough=0.45)
    chip_m = B.mat("Board parts", H["kohl.700"], rough=0.35, metal=0.2)
    pad_m = B.mat("Board contacts", H["stone.600"], rough=0.3, metal=0.8)
    mod_m = B.mat("Reader module", H["paper.2"], rough=0.4)
    mod_dark = B.mat("Reader throat", H["kohl.950"], rough=0.6)
    acc_m = B.mat("Reader accent", H["juniper.700"], rough=0.35, coat=0.3)
    scan_win = B.mat("Scanner window", H["lapis.300"], rough=0.05, emission=0.0)

    tray = B.box("Chassis tray", (0.232, 0.178, 0.004), tray_m, loc=(0, -0.008, 0.0125), bevel_w=0.0015)
    board = B.box("Main board", (0.196, 0.13, 0.0016), pcb_m, loc=(0.012, 0.004, 0.0175), bevel_w=0.0005)
    parts = [board]
    for i, (x, y, sx, sy, sz) in enumerate([(0.06, 0.03, 0.026, 0.026, 0.004), (0.02, 0.04, 0.014, 0.014, 0.003),
                                            (0.075, -0.02, 0.018, 0.010, 0.006), (0.035, -0.03, 0.03, 0.008, 0.008),
                                            (-0.02, 0.05, 0.012, 0.03, 0.003), (0.09, 0.05, 0.01, 0.01, 0.003)]):
        c = B.box(f"Board part {i}", (sx, sy, sz), chip_m if i % 2 == 0 else pad_m,
                  loc=(x, y, 0.0183 + sz / 2), bevel_w=0.0006)
        parts.append(c)
    reader = B.box("Reader module", (0.092, 0.105, 0.03), mod_m, loc=(-0.06, -0.054, 0.040), bevel_w=0.004)
    throat = B.box("Reader throat", (0.07, 0.006, 0.010), mod_dark, loc=(-0.06, -0.1055, 0.040), bevel_w=0.0015)
    stripe = B.box("Reader accent", (0.0925, 0.06, 0.004), acc_m, loc=(-0.06, -0.06, 0.0552), bevel_w=0.001)
    scanner = B.box("Scanner", (0.024, 0.026, 0.014), mod_dark, loc=(-0.0, -0.092, 0.040), bevel_w=0.002)
    lens = B.box("Scanner window", (0.016, 0.0015, 0.006), scan_win, loc=(-0.0, -0.1055, 0.040), bevel_w=0.0005)
    reader_grp = [reader, throat, stripe, scanner, lens]

    shell_grp = [ob["T3 body"], ob["T3 band"], ob["T3 slot"], ob["Status light"], ob["Sealed button"]]
    screen_layers = [ob["T3 bezel"], ob["T3 screen"], ob["T3 glass"]]
    cart = ob["CYP2C19 cartridge"]   # its label is parented to it

    # screen normal (same construction as build_t3)
    p0, p1 = Vector((0, -0.11, 0.062)), Vector((0, 0.095, 0.118))
    s = (p1 - p0).normalized()
    nrm = Vector((0, -s.z, s.y)).normalized()

    SHELL_UP = 0.20
    plan = []  # (objects, start frame, final offset vector)
    plan.append((shell_grp, EXPLODE_START, Vector((0, 0, SHELL_UP))))
    for k, layer in enumerate(screen_layers):
        plan.append(([layer], EXPLODE_START, Vector((0, 0, SHELL_UP)) + nrm * (0.026 + 0.02 * k)))
    plan.append((reader_grp, EXPLODE_START + 14, Vector((0, 0, 0.115))))
    plan.append((parts, EXPLODE_START + 20, Vector((0, 0, 0.062))))
    plan.append(([tray], EXPLODE_START + 24, Vector((0, 0, 0.03))))
    plan.append(([cart], EXPLODE_START + 10, Vector((0, -0.075, 0.115))))
    # the button separates forward from the shell so the sealed membrane reads as its own part
    btn = ob["Sealed button"]
    shell_grp.remove(btn)
    plan.append(([btn], EXPLODE_START + 6, Vector((0, -0.035, SHELL_UP))))

    for objs, start, off in plan:
        for o in objs:
            base = o.location.copy()
            bake(o, range(1, FRAMES + 1), lambda f, base=base, start=start, off=off:
                 (base + off * ramp(f, start, EXPLODE_DUR), None))

    # ---- camera: slow orbit + rise while the parts separate, decelerating to rest at HOLD_FROM
    cam, target = make_camera(lens=50, fstop=13)
    t0, t1 = Vector((0.0, -0.035, 0.045)), Vector((0.0, -0.05, 0.14))
    bake(target, range(1, FRAMES + 1), lambda f: (t0.lerp(t1, ramp(f, EXPLODE_START - 10, HOLD_FROM - EXPLODE_START + 10)), None))

    def cam_at(f):
        a = ramp(f, 1, HOLD_FROM - 1)
        u = ramp(f, EXPLODE_START - 10, HOLD_FROM - EXPLODE_START + 10)
        tgt = t0.lerp(t1, u)
        return orbit(tgt, 34 - 10 * a, 24 + 5 * u, 0.80 + 0.55 * u), None
    bake(cam, range(1, FRAMES + 1), cam_at)
    setup(sc)

    # ---- callout anchors on the final frame (camera static from HOLD_FROM)
    sc.frame_set(FRAMES)
    bpy.context.view_layer.update()

    def centre(o, local=(0, 0, 0)):
        return o.matrix_world @ Vector(local)

    anchors = {
        "screen": centre(ob["T3 glass"]),
        "cartridge": centre(cart, (0.0, -0.02, 0.0045)),
        "scanner": centre(scanner, (0, -0.012, 0.007)),
        "reader": centre(stripe, (0.02, 0.0, 0.002)),
        "button": centre(btn, (0, 0, 0)),
        "shell": centre(ob["T3 body"], (0.13, -0.03, 0.06)),   # right flank of the shell
    }
    out = {}
    for k, w in anchors.items():
        v = world_to_camera_view(sc, sc.camera, w)
        out[k] = [round(v.x * 1920, 1), round((1 - v.y) * 1080, 1)]
    (ANIM / "t3_anchors.json").write_text(json.dumps({"frame": FRAMES, "size": [1920, 1080], "anchors": out},
                                                     indent=2), encoding="utf-8")
    print("anchors", out)
    return sc


if __name__ == "__main__":
    sc = {"t1": shot_t1, "t3": shot_t3}[SHOT]()
    sc.frame_set(1)
    blend = HERE / f"meyar_anim_{SHOT}.blend"
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    print("saved", blend)
    if STILL is not None:
        sc.frame_set(STILL)
        sc.render.filepath = str(ANIM / f"test_{SHOT}_{ENGINE}_{STILL}.png")
        sc.render.use_overwrite = True
        import time
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"rendered still {sc.render.filepath} in {time.time() - t:.1f}s")
    elif STEP:
        d = ANIM / f"test_{SHOT}"
        d.mkdir(exist_ok=True)
        sc.render.use_overwrite = True
        sc.render.use_placeholder = False
        sc.frame_step = STEP
        sc.render.filepath = str(d / "f_####")
        bpy.ops.render.render(animation=True)
    elif DO_RENDER:
        FRAMES_DIR.mkdir(parents=True, exist_ok=True)
        sc.render.filepath = str(FRAMES_DIR / "f_####")
        if END:
            sc.frame_end = END
        bpy.ops.render.render(animation=True)
        print("rendered", FRAMES, "frames to", FRAMES_DIR)
