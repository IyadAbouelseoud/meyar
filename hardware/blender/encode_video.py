"""F2 — composite the overlays onto the rendered frames and encode the MP4 (ffmpeg on PATH).

Run from the repo root after both shots are rendered and the overlays are built:
  python hardware/blender/encode_video.py
In:  frames/t1/f_0001..0195.png, frames/t3/f_0001..0225.png (build_animation.py)
     art/out/vcap_t1.png, vcap_t3.png, vcall_*.png (art/make_video_art.py)
Out: renders/meyar-f2-kit-turntable-t3-exploded.mp4   (1920 x 1080, 30 fps, H.264, yuv420p, BT.709)
     renders/meyar-f2-contact-sheet.jpg               (six frames, for reviewing the clip on GitHub)

Each shot's label is composited onto that shot's own frames before the cross-fade, so the label
is on screen for the whole clip and no T3 frame is ever shown without "Concept render — not built".
"""
import json, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
ART = HERE / "art" / "out"
OUT = HERE / "renders" / "meyar-f2-kit-turntable-t3-exploded.mp4"
SHEET = HERE / "renders" / "meyar-f2-contact-sheet.jpg"
FPS = 30
N1, N2, XF = 195, 225, 15                 # frames in shot A, shot B, cross-fade
D1, D2 = N1 / FPS, N2 / FPS
CALLOUT_START = 4.8                      # s into shot B (camera settles at frame 150 = 5.0 s)
CALLOUT_STEP, CALLOUT_FADE = 0.22, 0.4
ORDER = ["screen", "shell", "reader", "button", "scanner", "cartridge"]
MAX_MB = 50

for shot, n in (("t1", N1), ("t3", N2)):
    missing = [i for i in range(1, n + 1) if not (HERE / "frames" / shot / f"f_{i:04d}.png").exists()
               or (HERE / "frames" / shot / f"f_{i:04d}.png").stat().st_size == 0]
    if missing:
        sys.exit(f"{shot}: {len(missing)} frames missing or empty (first {missing[0]}); render them first")

inputs = ["-framerate", str(FPS), "-i", str(HERE / "frames" / "t1" / "f_%04d.png"),
          "-framerate", str(FPS), "-i", str(HERE / "frames" / "t3" / "f_%04d.png"),
          "-loop", "1", "-framerate", str(FPS), "-t", f"{D1}", "-i", str(ART / "vcap_t1.png"),
          "-loop", "1", "-framerate", str(FPS), "-t", f"{D2}", "-i", str(ART / "vcap_t3.png")]
for part in ORDER:
    inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{D2}", "-i", str(ART / f"vcall_{part}.png")]

f = ["[0:v][2:v]overlay=format=auto,format=rgb24,setsar=1[s1]",
     "[1:v][3:v]overlay=format=auto[b0]"]
prev = "b0"
for k, part in enumerate(ORDER):
    st = CALLOUT_START + k * CALLOUT_STEP
    f.append(f"[{4 + k}:v]format=rgba,fade=t=in:st={st:.2f}:d={CALLOUT_FADE}:alpha=1[c{k}]")
    f.append(f"[{prev}][c{k}]overlay=format=auto[b{k + 1}]")
    prev = f"b{k + 1}"
f.append(f"[{prev}]format=rgb24,setsar=1[s2]")
f.append(f"[s1][s2]xfade=transition=fade:duration={XF / FPS:.4f}:offset={(N1 - XF) / FPS:.4f},"
         "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]")

cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(f), "-map", "[v]",
       "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
       "-r", str(FPS), "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
       "-movflags", "+faststart", str(OUT)]
subprocess.run(cmd, check=True)

probe = json.loads(subprocess.run(
    ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
     "stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt:format=duration,size",
     "-of", "json", str(OUT)], check=True, capture_output=True, text=True).stdout)
st, fm = probe["streams"][0], probe["format"]
mb = int(fm["size"]) / 1e6
print(f"wrote {OUT.name}: {st['codec_name']} {st['width']}x{st['height']} {st['r_frame_rate']} fps "
      f"{st['pix_fmt']} frames={st['nb_read_frames']} duration={float(fm['duration']):.2f}s size={mb:.1f} MB")
assert st["codec_name"] == "h264" and (st["width"], st["height"]) == (1920, 1080)
assert st["r_frame_rate"] == f"{FPS}/1" and int(st["nb_read_frames"]) == N1 + N2 - XF
assert mb < MAX_MB, f"{mb:.1f} MB is over {MAX_MB} MB"

# contact sheet: two from the turntable, the cross-fade, three from the exploded view
times = [0.5, 3.5, (N1 - XF / 2) / FPS, 8.0, 10.2, 13.2]
sel = "+".join(f"eq(n\\,{round(t * FPS)})" for t in times)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT), "-vf",
                f"select='{sel}',scale=640:-1,tile=3x2", "-frames:v", "1", "-q:v", "3", str(SHEET)], check=True)
print("wrote", SHEET.name)
