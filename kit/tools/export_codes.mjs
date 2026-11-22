// Writes the module matrices of the kit's barcodes to JSON for an independent decode check
// (tools/decode_check.py). Usage: node tools/export_codes.mjs out.json
import fs from 'node:fs';
import { qrMatrix } from '../web/qr.js';
import { encodeWidths } from '../web/barcode128.js';
import { DEMO_KIT_ID } from '../lib/demo.js';
const texts = [`MEYAR-KIT:${DEMO_KIT_ID}`, 'x', 'https://example.org/a-longer-string-to-force-version-five-or-more-12345678901234567890'];
const out = { c128Text: DEMO_KIT_ID, c128: encodeWidths(DEMO_KIT_ID), qr: Object.fromEntries(texts.map((t) => [t, qrMatrix(t).map((r) => r.map(Number))])) };
fs.writeFileSync(process.argv[2] || 'codes.json', JSON.stringify(out));
