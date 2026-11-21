"""F1 — Meyar hardware hero renders, built entirely from code so they are reproducible.

Run one hero (headless):
  blender --background --factory-startup --python hardware/blender/build_renders.py -- --hero t1
  (t1 = saliva kit, t3 = single-gene cath-lab unit concept, t4 = multi-gene reader concept)
Options: --samples N (default 160)   --no-render (build and save the .blend only)

Writes hardware/blender/meyar_<hero>.blend and hardware/blender/raw/<hero>.png (3000 x 2000).
compose.py then bakes the status label onto the final hardware/blender/renders/*.png.

Every dimension here is a modelling choice for a concept render, not a specification
or a sourced fact. Colours are the primitives in design/tokens.json.
"""
import bpy, bmesh, math, json, sys, pathlib
from mathutils import Vector

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[1]
ART = HERE / "art" / "out"
RAW = HERE / "raw"
RAW.mkdir(exist_ok=True)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
HERO = argv[argv.index("--hero") + 1] if "--hero" in argv else "t1"
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 160
DO_RENDER = "--no-render" not in argv
PCT = int(argv[argv.index("--pct") + 1]) if "--pct" in argv else 100

_tok = json.loads((REPO / "design" / "tokens.json").read_text(encoding="utf-8"))["primitive"]["color"]
HEX = {f"{g}.{k}": v["$value"] for g, d in _tok.items() for k, v in d.items() if isinstance(v, dict)}


def lin(hexstr):
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


# ---------------------------------------------------------------- scene reset
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.render.engine = "CYCLES"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 3000, 2000
    sc.render.resolution_percentage = PCT
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast" if "AgX - Medium High Contrast" in [
        i.identifier for i in sc.view_settings.bl_rna.properties["look"].enum_items] else "None"
    # GPU if available (oneAPI on Intel Arc), otherwise CPU
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for backend in ("ONEAPI", "OPTIX", "CUDA", "HIP", "METAL"):
            try:
                prefs.compute_device_type = backend
                prefs.get_devices()
                devs = [d for d in prefs.devices if d.type == backend]
                if devs:
                    for d in prefs.devices:
                        d.use = d.type == backend
                    sc.cycles.device = "GPU"
                    print("Cycles device:", backend, [d.name for d in devs])
                    break
            except TypeError:
                continue
    except Exception as e:  # noqa: BLE001
        print("GPU setup skipped:", e)
    world = bpy.data.worlds.new("Studio")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = lin("#DDE3DE")
    bg.inputs[1].default_value = 0.12
    return sc


# ---------------------------------------------------------------- materials
def mat(name, color, rough=0.45, metal=0.0, transmission=0.0, ior=1.49, coat=0.0, alpha=1.0, image=None,
        emission=0.0, sss=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = lin(color) if isinstance(color, str) else color
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    p.inputs["IOR"].default_value = ior
    p.inputs["Transmission Weight"].default_value = transmission
    p.inputs["Coat Weight"].default_value = coat
    p.inputs["Alpha"].default_value = alpha
    if sss:
        p.inputs["Subsurface Weight"].default_value = sss
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(ART / image))
        tex.interpolation = "Cubic"
        tex.extension = "CLIP"
        nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
        if emission:
            nt.links.new(tex.outputs["Color"], p.inputs["Emission Color"])
            p.inputs["Emission Strength"].default_value = emission
    elif emission:
        p.inputs["Emission Color"].default_value = lin(color)
        p.inputs["Emission Strength"].default_value = emission
    return m


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_obj(name, bm, material=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    if material:
        ob.data.materials.append(material)
    return link(ob)


def bevel(ob, width, segments=6, angle=35):
    m = ob.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    m.harden_normals = True
    return m


# ---------------------------------------------------------------- geometry helpers
def lathe(name, profile, segments=96, material=None, ribs=None, arc=(0.0, 2 * math.pi), cap_ends=False):
    """Revolve a (radius, z) profile around Z. ribs=(ring_indices, count, depth) cuts grip ribs.
    UVs: u runs around the arc, v runs along the profile (0..1 by z)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    a0, a1 = arc
    full = abs((a1 - a0) - 2 * math.pi) < 1e-6
    nseg = segments
    cols = nseg if full else nseg + 1
    zs = [p[1] for p in profile]
    zmin, zmax = min(zs), max(zs)
    grid = []
    for j in range(cols):
        t = j / nseg
        a = a0 + (a1 - a0) * t
        col = []
        for i, (r, z) in enumerate(profile):
            rr = r
            if ribs and i in ribs[0]:
                if (j * ribs[1] // nseg) % 2 == 0 and (j * 2 * ribs[1] // nseg) % 2 == 0:
                    rr = r - ribs[2]
            col.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z)))
        grid.append(col)
    for j in range(nseg):
        j2 = (j + 1) % cols if full else j + 1
        for i in range(len(profile) - 1):
            f = bm.faces.new((grid[j][i], grid[j2][i], grid[j2][i + 1], grid[j][i + 1]))
            for loop, (jj, ii) in zip(f.loops, ((j, i), (j + 1, i), (j + 1, i + 1), (j, i + 1))):
                loop[uv].uv = (jj / nseg, (profile[ii][1] - zmin) / max(zmax - zmin, 1e-9))
    if cap_ends:
        for i in (0, len(profile) - 1):
            if profile[i][0] > 1e-6:
                bm.faces.new([grid[j][i] for j in range(cols)] if i else [grid[j][i] for j in reversed(range(cols))])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.normal_update()
    return mesh_obj(name, bm, material)


def box(name, size, material=None, loc=(0, 0, 0), bevel_w=0.0, seg=6):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    ob = mesh_obj(name, bm, material, smooth=bool(bevel_w))
    ob.location = loc
    if bevel_w:
        bevel(ob, bevel_w, seg)
    return ob


def prism(name, pts_yz, width, material=None, bevel_w=0.0, seg=8):
    """Extrude a side profile (y, z) along X, centred on x=0."""
    bm = bmesh.new()
    left = [bm.verts.new((-width / 2, y, z)) for y, z in pts_yz]
    right = [bm.verts.new((width / 2, y, z)) for y, z in pts_yz]
    n = len(pts_yz)
    bm.faces.new(list(reversed(left)))
    bm.faces.new(right)
    for i in range(n):
        bm.faces.new((left[i], left[(i + 1) % n], right[(i + 1) % n], right[i]))
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_obj(name, bm, material, smooth=bool(bevel_w))
    if bevel_w:
        bevel(ob, bevel_w, seg)
    return ob


def rounded_rect_pts(w, h, r, seg=8):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180),
                       (w / 2 - r, -h / 2 + r, 270)):
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def panel(name, w, h, material, r=0.0, thickness=0.0):
    """Flat (optionally rounded) rectangle in XY with 0..1 UVs, facing +Z."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    pts = rounded_rect_pts(w, h, r) if r > 0 else [(w / 2, h / 2), (-w / 2, h / 2), (-w / 2, -h / 2), (w / 2, -h / 2)]
    vs = [bm.verts.new((x, y, 0)) for x, y in pts]
    f = bm.faces.new(list(reversed(vs)) if r <= 0 else vs)
    f.normal_update()
    if f.normal.z < 0:
        f.normal_flip()
    for loop in f.loops:
        loop[uv].uv = (loop.vert.co.x / w + 0.5, loop.vert.co.y / h + 0.5)
    if thickness:
        ext = bmesh.ops.extrude_face_region(bm, geom=[f])
        bmesh.ops.translate(bm, vec=(0, 0, -thickness),
                            verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, material, smooth=False)


def place_on_plane(ob, origin, normal, up_hint=Vector((0, 0, 1)), offset=0.0006):
    """Orient a +Z-facing panel so its normal is `normal`, centred at `origin`."""
    n = Vector(normal).normalized()
    x = up_hint.cross(n)
    if x.length < 1e-6:
        x = Vector((1, 0, 0))
    x.normalize()
    y = n.cross(x)
    from mathutils import Matrix
    m = Matrix((x, y, n)).transposed().to_4x4()
    m.translation = Vector(origin) + n * offset
    ob.matrix_world = m
    return ob


# ---------------------------------------------------------------- studio
def studio(floor_hex="#E1E9E2", size=3.0):
    """Seamless sweep: floor curving up into a back wall."""
    bm = bmesh.new()
    prof = []
    R = 0.45
    for k in range(13):  # curve from floor (y=0.3) to wall
        a = math.radians(90 * k / 12)
        prof.append((0.35 + R * math.sin(a), R - R * math.cos(a)))
    pts = [(-size, 0.0)] + prof + [(0.35 + R, 2.0)]
    rows = []
    for x in (-size, size):
        rows.append([bm.verts.new((x, y, z)) for y, z in pts])
    for i in range(len(pts) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    bm.normal_update()
    ob = mesh_obj("Sweep", bm, mat("Sweep", floor_hex, rough=0.8))
    return ob


def area_light(name, loc, target, size, power, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "RECTANGLE"
    ld.size, ld.size_y = size, size * 0.7
    ld.energy = power
    ld.color = color
    ob = link(bpy.data.objects.new(name, ld))
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return ob


def lights(scale=1.0):
    area_light("Key", (-0.55, -0.55, 0.75), (0, 0, 0.03), 0.9, 22 * scale, (1.0, 0.98, 0.95))
    area_light("Fill", (0.7, -0.45, 0.35), (0, 0, 0.03), 1.2, 7 * scale, (0.95, 0.98, 1.0))
    area_light("Rim", (0.15, 0.7, 0.6), (0, 0, 0.03), 0.6, 12 * scale)


def camera(loc, target, lens=70, fstop=None, focus=None):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = lens
    cd.sensor_width = 36
    ob = link(bpy.data.objects.new("Camera", cd))
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        cd.dof.focus_distance = focus or d.length
    bpy.context.scene.camera = ob
    return ob


# ================================================================ T1 saliva kit
def build_t1():
    pp_clear = mat("PP clear", "#F4F7F5", rough=0.18, transmission=0.92, ior=1.49)
    pp_milky = mat("PP translucent", "#EEF3EF", rough=0.35, transmission=0.75, ior=1.49)
    liquid = mat("Sample + buffer (mock)", "#E9EEDF", rough=0.05, transmission=0.85, ior=1.34)
    cap_m = mat("Cap PP juniper", HEX["juniper.700"], rough=0.38, coat=0.2)
    label_m = mat("Tube label film", None or "#FFFFFF", rough=0.32, image="tube_label.png")
    ink = mat("Fill line ink", HEX["ink.1"], rough=0.5)

    # --- tube: profile (r, z) in metres; rounded bottom, open top lip, outer thread band
    r = 0.0085
    prof = [(0.0001, 0.0), (0.0035, 0.0006), (0.0062, 0.0022), (0.0078, 0.0048), (r, 0.009), (r, 0.074),
            (r + 0.0004, 0.0745), (r + 0.0004, 0.080), (r - 0.0008, 0.0805), (r - 0.0008, 0.010)]
    tube = lathe("Tube", prof, 96, pp_clear)
    sol = tube.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness = 0.0007
    liq = lathe("Liquid", [(0.0001, 0.0009), (0.0033, 0.0013), (0.0058, 0.0028), (0.0074, 0.0052),
                           (r - 0.0009, 0.0092), (r - 0.0009, 0.040), (0.0001, 0.040)], 64, liquid, cap_ends=True)
    # printed fill line ring (generic feature, no volume value printed)
    ring = lathe("Fill line", [(r + 0.00005, 0.0462), (r + 0.00005, 0.0470)], 96, ink)
    # label: wraps ~200 degrees, long edge of the artwork runs along the tube axis
    lab_arc = (math.radians(-100 - 90), math.radians(100 - 90))
    lab = lathe("Tube label", [(r + 0.00012, 0.0125), (r + 0.00012, 0.0705)], 96, label_m, arc=lab_arc)
    # rotate UVs: artwork x -> tube axis (v), artwork y -> around (u)
    me = lab.data
    uvl = me.uv_layers.active.data
    for li in range(len(uvl)):
        u, v = uvl[li].uv
        uvl[li].uv = (v, u)
    # --- cap with grip ribs
    cap_prof = [(r + 0.0002, 0.0745), (r + 0.0016, 0.0745), (r + 0.0019, 0.0752), (r + 0.0019, 0.0925),
                (r + 0.0012, 0.0935), (0.0001, 0.0938)]
    cap = lathe("Cap", cap_prof, 144, cap_m, ribs=([2, 3], 36, 0.0004))
    for ob in (tube, liq, ring, lab, cap):
        ob.location = (0.125, -0.045, 0)

    # --- funnel lying on the floor
    fprof = [(0.0076, 0.0), (0.0076, 0.008), (0.0082, 0.009), (0.0082, 0.013), (0.009, 0.016),
             (0.019, 0.040), (0.0205, 0.041), (0.0205, 0.0425)]
    fun = lathe("Funnel", fprof, 96, pp_milky)
    fs = fun.modifiers.new("Solidify", "SOLIDIFY")
    fs.thickness = 0.0006
    fun.rotation_euler = (math.radians(90), 0, math.radians(122))
    fun.location = (-0.03, -0.085, 0.0207)

    # --- specimen bag with absorbent pad (secondary packaging, generic)
    film = mat("Bag film", "#F6F8F6", rough=0.22, transmission=0.9, ior=1.45)
    bag = panel("Specimen bag", 0.105, 0.15, film, r=0.006)
    bag.location = (-0.005, 0.03, 0.0012)
    bag.rotation_euler = (0, 0, math.radians(-14))
    bag.modifiers.new("Solidify", "SOLIDIFY").thickness = 0.0003
    bag.location.z = 0.0028
    pad = panel("Absorbent pad", 0.07, 0.11, mat("Absorbent pad", "#FAFAF7", rough=0.95), r=0.004)
    pad.modifiers.new("Solidify", "SOLIDIFY").thickness = 0.0012
    pad.location = (-0.004, 0.026, 0.0012)
    pad.rotation_euler = (0, 0, math.radians(-14))
    zip_ = box("Bag seal", (0.105, 0.004, 0.0008), mat("Seal", HEX["juniper.500"], rough=0.4),
               loc=(0, 0, 0.0014))
    zip_.parent = bag
    zip_.location = (0, 0.062, 0.0004)

    # --- mailer box
    W, D, H = 0.22, 0.15, 0.06
    board = mat("Mailer board", HEX["juniper.900"], rough=0.7)
    mailer = box("Mailer", (W, D, H), board, loc=(-0.095, 0.125, H / 2), bevel_w=0.0015, seg=3)
    mailer.rotation_euler = (0, 0, math.radians(-22))
    lid = panel("Mailer lid art", W - 0.004, D - 0.004, mat("Lid print", "#FFFFFF", rough=0.6, image="mailer_lid.png"))
    lid.parent = mailer
    lid.location = (0, 0, H / 2 + 0.0004)
    front = panel("Mailer front art", W - 0.008, (W - 0.008) * 620 / 2400,
                  mat("Front print", "#FFFFFF", rough=0.6, image="mailer_front.png"))
    front.parent = mailer
    front.rotation_euler = (math.radians(90), 0, 0)
    front.location = (0, -D / 2 - 0.0004, 0)
    end = panel("Mailer end label", 0.13, 0.13 * 600 / 1400, mat("End label", "#FFFFFF", rough=0.5, image="mailer_end.png"))
    end.parent = mailer
    end.rotation_euler = (math.radians(90), 0, math.radians(90))
    end.location = (W / 2 + 0.0004, 0, 0)

    studio()
    lights()
    camera((0.30, -0.47, 0.27), (0.0, 0.02, 0.0), lens=56, fstop=11, focus=0.55)


# ================================================================ T3 single-gene cath-lab unit (concept)
def build_t3():
    shell = mat("Enclosure PC/ABS", HEX["paper.0"], rough=0.42, coat=0.1)
    base_m = mat("Base", HEX["kohl.800"], rough=0.55)
    accent = mat("Juniper band", HEX["juniper.700"], rough=0.35, coat=0.3)
    glass = mat("Cover glass", "#FFFFFF", rough=0.02, transmission=1.0, ior=1.5)
    screen = mat("Screen", "#000000", rough=0.2, image="screen_t3.png", emission=1.4)
    slot_m = mat("Slot", HEX["kohl.950"], rough=0.6)
    cart_m = mat("Cartridge body", HEX["juniper.500"], rough=0.4)
    cart_lab = mat("Cartridge label", "#FFFFFF", rough=0.5, image="cartridge_label.png")
    led = mat("Status light", HEX["juniper.300"], emission=6.0)

    Wd = 0.26
    prof = [(-0.11, 0.008), (-0.11, 0.062), (0.095, 0.118), (0.095, 0.008)]
    body = prism("T3 body", prof, Wd, shell, bevel_w=0.012, seg=10)
    plinth = box("T3 plinth", (Wd - 0.012, 0.195, 0.010), base_m, loc=(0, -0.008, 0.005), bevel_w=0.003)
    band = box("T3 band", (Wd + 0.001, 0.004, 0.01), accent, loc=(0, -0.1102, 0.022), bevel_w=0.0015)
    band.scale = (1.0, 1.0, 1.0)
    # sloped top face: screen
    p0, p1 = Vector((0, -0.11, 0.062)), Vector((0, 0.095, 0.118))
    slope = (p1 - p0).normalized()
    nrm = Vector((0, -slope.z, slope.y)).normalized()
    centre = p0.lerp(p1, 0.52) + Vector((0.035, 0, 0))
    bezel = panel("T3 bezel", 0.150, 0.098, mat("Bezel", HEX["kohl.900"], rough=0.3), r=0.008)
    place_on_plane(bezel, centre, nrm, up_hint=Vector((0, 1, 0)).cross(Vector((1, 0, 0))) * -1, offset=0.0005)
    place_on_plane(bezel, centre, nrm, offset=0.0005)
    scr = panel("T3 screen", 0.138, 0.138 * 720 / 1200, screen, r=0.003)
    place_on_plane(scr, centre, nrm, offset=0.0009)
    gl = panel("T3 glass", 0.150, 0.098, glass, r=0.008)
    place_on_plane(gl, centre, nrm, offset=0.0013)
    for ob in (bezel, scr, gl):  # artwork upright when read from the front
        ob.rotation_euler.rotate_axis("Z", math.radians(180))
        ob.rotation_euler.rotate_axis("Z", math.radians(180))
    # front cartridge slot (left), keyed single-direction insertion
    slot = box("T3 slot", (0.072, 0.004, 0.011), slot_m, loc=(-0.06, -0.1115, 0.040), bevel_w=0.002)
    cart = box("CYP2C19 cartridge", (0.064, 0.085, 0.0075), cart_m, loc=(-0.06, -0.135, 0.040), bevel_w=0.0025)
    clab = panel("Cartridge label", 0.054, 0.054 * 500 / 900, cart_lab)
    clab.parent = cart
    clab.location = (0, -0.012, 0.0038 + 0.0003)
    clab.rotation_euler = (0, 0, 0)
    # status light strip above slot
    ledo = box("Status light", (0.03, 0.002, 0.0025), led, loc=(-0.06, -0.1105, 0.054), bevel_w=0.0008)
    # cleanable single sealed button (membrane), right of front face
    btn = lathe("Sealed button", [(0.0001, 0.0024), (0.007, 0.0024), (0.0085, 0.0012), (0.009, 0.0)], 64,
                mat("Button membrane", HEX["juniper.700"], rough=0.5))
    btn.rotation_euler = (math.radians(90), 0, 0)
    btn.location = (0.075, -0.1103, 0.038)
    studio()
    lights(1.1)
    camera((0.36, -0.62, 0.36), (0.0, -0.02, 0.03), lens=50, fstop=8, focus=0.78)


# ================================================================ T4 multi-gene reader (concept)
def build_t4():
    shell = mat("Enclosure PC/ABS", HEX["paper.0"], rough=0.42, coat=0.1)
    base_m = mat("Base", HEX["kohl.800"], rough=0.55)
    accent = mat("Juniper", HEX["juniper.900"], rough=0.35, coat=0.3)
    glass = mat("Lid window", "#FFFFFF", rough=0.03, transmission=1.0, ior=1.5)
    smoke = mat("Tinted lid", "#E1E9E2", rough=0.03, transmission=1.0, ior=1.02)
    screen = mat("Screen", "#000000", rough=0.2, image="screen_t4.png", emission=2.2)
    disc_m = mat("Disc cartridge", "#EEF3EF", rough=0.25, transmission=0.6, ior=1.05)
    hub_m = mat("Hub", HEX["kohl.700"], rough=0.4)

    W, D, H = 0.36, 0.25, 0.07
    body = box("T4 body", (W, D, H), shell, loc=(0, 0, H / 2 + 0.008), bevel_w=0.016, seg=10)
    plinth = box("T4 plinth", (W - 0.016, D - 0.016, 0.010), base_m, loc=(0, 0, 0.005), bevel_w=0.003)
    # juniper deck panel on the left with a round smoked lid over a disc cartridge
    deck = panel("Deck", 0.18, 0.20, accent, r=0.02)
    deck.location = (-0.075, 0.0, H + 0.008 + 0.0004)
    lid = lathe("Disc lid", [(0.0001, 0.0075), (0.064, 0.0075), (0.068, 0.006), (0.069, 0.0)], 128, smoke)
    lid.location = (-0.075, 0.0, H + 0.0085)
    lid.modifiers.new("Solidify", "SOLIDIFY").thickness = 0.0015
    disc = lathe("Disc cartridge", [(0.0001, 0.0), (0.058, 0.0), (0.058, 0.002), (0.0001, 0.002)], 128, disc_m,
                 cap_ends=True)
    disc.location = (-0.075, 0.0, H + 0.009)
    hub = lathe("Hub", [(0.0001, 0.0045), (0.01, 0.0045), (0.011, 0.0)], 48, hub_m)
    hub.location = (-0.075, 0.0, H + 0.009)
    # radial reaction chambers (a concept, not a stated multiplex level)
    tints = [HEX["juniper.300"], HEX["lapis.300"], HEX["juniper.300"], HEX["terracotta.300"],
             HEX["juniper.300"], HEX["lapis.300"], HEX["stone.300"], HEX["juniper.300"]]
    for k, t in enumerate(tints):
        a = 2 * math.pi * k / len(tints)
        ch = lathe(f"Chamber {k}", [(0.0001, 0.0024), (0.0065, 0.0024), (0.0065, 0.0004), (0.0001, 0.0004)], 32,
                   mat(f"Chamber tint {k}", t, rough=0.1, transmission=0.6, ior=1.4), cap_ends=True)
        ch.location = (-0.075 + 0.042 * math.cos(a), 0.042 * math.sin(a), H + 0.009)
        chan = box(f"Channel {k}", (0.022, 0.0016, 0.0006), mat(f"Channel {k}", HEX["juniper.500"], rough=0.3),
                   loc=(-0.075 + 0.022 * math.cos(a), 0.022 * math.sin(a), H + 0.0113))
        chan.rotation_euler = (0, 0, a)
    # sloped console on the right with the screen
    prof = [(-0.11, 0.0), (-0.11, 0.022), (0.10, 0.072), (0.10, 0.0)]
    con = prism("Console", prof, 0.17, shell, bevel_w=0.01, seg=8)
    con.location = (0.095, 0.0, H + 0.002)
    p0, p1 = Vector((0.095, -0.11, H + 0.002 + 0.022)), Vector((0.095, 0.10, H + 0.002 + 0.072))
    s = (p1 - p0).normalized()
    nrm = Vector((0, -s.z, s.y)).normalized()
    c = p0.lerp(p1, 0.5)
    bez = panel("T4 bezel", 0.158, 0.112, mat("Bezel", HEX["kohl.900"], rough=0.3), r=0.008)
    place_on_plane(bez, c, nrm, offset=0.0005)
    scr = panel("T4 screen", 0.148, 0.148 * 1000 / 1600, screen, r=0.003)
    place_on_plane(scr, c, nrm, offset=0.0009)
    scr.scale = (1.0, 1.0, 1.0)
    gl = panel("T4 glass", 0.158, 0.112, glass, r=0.008)
    place_on_plane(gl, c, nrm, offset=0.0013)
    studio()
    lights(1.15)
    camera((0.44, -0.70, 0.50), (0.0, -0.02, 0.03), lens=50, fstop=8, focus=0.95)


BUILDERS = {"t1": build_t1, "t3": build_t3, "t4": build_t4}

if __name__ == "__main__":
    reset()
    BUILDERS[HERO]()
    blend = HERE / f"meyar_{HERO}.blend"
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    print("saved", blend)
    if DO_RENDER:
        bpy.context.scene.render.filepath = str(RAW / f"{HERO}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", RAW / f"{HERO}.png")
