# Independent decode check of the kit barcodes with two third-party readers (zbar, OpenCV).
# Dev-time verification only, not an app dependency. Run:
#   node tools/export_codes.mjs codes.json
#   uv run --no-project --python 3.12 --with pyzbar --with opencv-python-headless --with pillow --with numpy python -I tools/decode_check.py codes.json
import json, sys, numpy as np
from PIL import Image
d = json.load(open(sys.argv[1]))
from pyzbar import pyzbar
import cv2
ok = True
for text, m in d['qr'].items():
    a = np.array(m, dtype=np.uint8)
    a = np.pad(a, 4)
    img = ((1 - a) * 255).astype(np.uint8)
    img = np.kron(img, np.ones((10, 10), dtype=np.uint8))
    z = [r.data.decode() for r in pyzbar.decode(Image.fromarray(img))]
    cv, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(img, cv2.COLOR_GRAY2BGR))
    print('QR v%d' % ((len(m) - 17) // 4), 'zbar:', z == [text], 'opencv:', cv == text)
    ok &= z == [text] and cv == text
w = d['c128']; row = []
row += [255] * 20
for i, x in enumerate(w): row += [0 if i % 2 == 0 else 255] * x
row += [255] * 20
row = np.repeat(np.array(row, dtype=np.uint8), 3)
img = np.tile(row, (80, 1))
z = [(r.type, r.data.decode()) for r in pyzbar.decode(Image.fromarray(img))]
print('Code128 zbar:', z); ok &= z == [('CODE128', d['c128Text'])]
print('ALL OK' if ok else 'FAIL')
