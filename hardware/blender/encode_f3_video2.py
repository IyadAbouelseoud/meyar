"""Encode F3 video v2: frames/f3v2_hd + label, beat labels, live inset, arrow callouts, end card -> MP4.

Run from the repo root: uv run --no-project python hardware/blender/encode_f3_video2.py   (needs ffmpeg/ffprobe)
Out: renders/meyar-f3-kit-chain-of-custody.mp4 (1920x1080, 30 fps, H.264) + renders/meyar-f3-video2-contact-sheet.jpg
"""
import json, pathlib, subprocess

HERE = pathlib.Path(__file__).resolve().parent
ART, FR = HERE / "art" / "out", HERE / "frames" / "f3v2_hd"
OUT = HERE / "renders" / "meyar-f3-kit-chain-of-custody.mp4"
SHEET = HERE / "renders" / "meyar-f3-video2-contact-sheet.jpg"
FPS, N, FADE = 30, 1710, 0.3
STATES = [1, 540, 690, 1110, 1265, 1320, 1445]      # same as build_f3_video2.py

LAYERS = [("f3v_cap.png", 10, 1635)]
for k in range(7):
    LAYERS.append((f"f3w_beat_{k + 1}.png", 20 if k == 0 else STATES[k] + 6,
                   (STATES[k + 1] - 1) if k < 6 else 1630))
LAYERS += [("f3w_inset_1.png", 345, 539), ("f3w_inset_2.png", 540, 689), ("f3w_inset_3.png", 690, 740)]
LAYERS += [(f"f3w_co_{key}.png", a, b) for key, a, b in [
    ("phone", 40, 146), ("tube", 55, 146), ("funnel", 70, 146), ("bag", 85, 146), ("mailer", 100, 146),
    ("phone_scan1", 215, 326), ("funnel_dock", 470, 556), ("cap_on", 686, 738), ("bag_tube", 915, 976),
    ("pad", 925, 976), ("mailer_closed", 1086, 1116), ("phone_verify", 1335, 1440), ("phone_tamper", 1455, 1556)]]
LAYERS.append(("f3w_end.png", 1640, N + 30))

frames = sorted(FR.glob("f_*.png"))
assert len(frames) == N, f"{len(frames)} frames in {FR}, expected {N}"
cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(FR / "f_%04d.png")]
chain, last = [], "0:v"
for i, (png, a, b) in enumerate(LAYERS, 1):
    cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{N / FPS:.3f}", "-i", str(ART / png)]
    st, en = (a - 1) / FPS, (b - 1) / FPS
    fade_out = f",fade=out:st={en - FADE:.3f}:d={FADE}:alpha=1" if b <= N else ""
    chain.append(f"[{i}:v]format=rgba,fade=in:st={st:.3f}:d={FADE}:alpha=1{fade_out}[o{i}]")
    chain.append(f"[{last}][o{i}]overlay=0:0:shortest=1[v{i}]")
    last = f"v{i}"
chain.append(f"[{last}]format=yuv420p[v]")
cmd += ["-filter_complex", ";".join(chain), "-map", "[v]", "-r", str(FPS), "-frames:v", str(N),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", str(OUT)]
subprocess.run(cmd, check=True)

probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                                   "stream=codec_name,width,height,r_frame_rate,nb_read_frames", "-show_entries",
                                   "format=duration,size", "-of", "json", str(OUT)], capture_output=True, text=True, check=True).stdout)
s, f = probe["streams"][0], probe["format"]
assert (s["codec_name"], s["width"], s["height"], s["r_frame_rate"], int(s["nb_read_frames"])) == ("h264", 1920, 1080, "30/1", N), s
assert int(f["size"]) < 50 * 1024 * 1024
print(f"h264 1920x1080 30 fps frames={s['nb_read_frames']} duration={float(f['duration']):.2f}s size={int(f['size']) / 1e6:.1f} MB")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT), "-vf", "fps=1/4,scale=480:-1,tile=5x3:padding=4:color=white",
                "-frames:v", "1", str(SHEET)], check=True)
print("wrote", OUT.name, SHEET.name)
