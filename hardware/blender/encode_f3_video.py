"""Encode the F3 video: frames/f3 + the whole-clip label + one callout per beat -> MP4.

Run from the repo root: uv run --no-project python hardware/blender/encode_f3_video.py  (needs ffmpeg/ffprobe)
Out: renders/meyar-f3-kit-scans-live.mp4 (1920x1080, 30 fps, H.264) and renders/meyar-f3-video-contact-sheet.jpg
"""
import json, pathlib, subprocess

HERE = pathlib.Path(__file__).resolve().parent
ART = HERE / "art" / "out"
FR = HERE / "frames" / "f3"
OUT = HERE / "renders" / "meyar-f3-kit-scans-live.mp4"
SHEET = HERE / "renders" / "meyar-f3-video-contact-sheet.jpg"
FPS, N = 30, 450
FADE = 0.3
# callout k shows from its screen swap (build_f3_video.SWAPS) until the next one
SWAPS = [1, 120, 200, 285, 330, 360, 400]
WINDOWS = [((s - 1) / FPS + (0.25 if k else 0.4), ((SWAPS[k + 1] - 1) / FPS - 0.05) if k < 6 else N / FPS)
           for k, s in enumerate(SWAPS)]

frames = sorted(FR.glob("f_*.png"))
assert len(frames) == N, f"{len(frames)} frames in {FR}, expected {N}"

cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(FR / "f_%04d.png"),
       "-loop", "1", "-framerate", str(FPS), "-t", str(N / FPS), "-i", str(ART / "f3v_cap.png")]
for k in range(7):
    cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(N / FPS), "-i", str(ART / f"f3v_lab_{k + 1}.png")]
chain = ["[1:v]format=rgba,fade=in:st=0.2:d=0.5:alpha=1[cap]", "[0:v][cap]overlay=0:0[b0]"]
for k, (a, b) in enumerate(WINDOWS):
    out_fade = f",fade=out:st={b - FADE:.3f}:d={FADE}:alpha=1" if k < 6 else ""
    chain.append(f"[{k + 2}:v]format=rgba,fade=in:st={a:.3f}:d={FADE}:alpha=1{out_fade}[l{k}]")
    chain.append(f"[b{k}][l{k}]overlay=0:0[b{k + 1}]")
chain.append("[b7]format=yuv420p[v]")
cmd += ["-filter_complex", ";".join(chain), "-map", "[v]", "-r", str(FPS), "-frames:v", str(N),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", str(OUT)]
subprocess.run(cmd, check=True)

probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                                   "stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt",
                                   "-show_entries", "format=duration,size", "-of", "json", str(OUT)],
                                  capture_output=True, text=True, check=True).stdout)
s, f = probe["streams"][0], probe["format"]
assert (s["codec_name"], s["width"], s["height"], s["r_frame_rate"], int(s["nb_read_frames"])) == ("h264", 1920, 1080, "30/1", N), s
assert int(f["size"]) < 50 * 1024 * 1024
print(f"h264 1920x1080 30 fps frames={s['nb_read_frames']} duration={float(f['duration']):.2f}s size={int(f['size']) / 1e6:.1f} MB")

# contact sheet: one frame every 2 s (8 frames)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(OUT), "-vf", "fps=0.5,scale=640:-1,tile=4x2:padding=6:color=white",
                "-frames:v", "1", str(SHEET)], check=True)
print("wrote", OUT.name, SHEET.name)
