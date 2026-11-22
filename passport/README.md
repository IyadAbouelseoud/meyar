# passport/

Arabic-first Medication Passport (Vite, port 5173): screen, PIN-encrypted offline QR, scanner, OTC quick-check, print card, elder mode. Tasks C1–C8.

## Offline QR (C2)

- **Prior art:** Medication Safety Code encodes a URL resolved against a server; Meyar encodes the payload itself.
- **Payload:** Compact contract summary (`patientId`, `sampleOrigin`, `genes[]` with diplotype, phenotype/effectivePhenotype, callability, coverage summary, guideline version, and CPIC recommendation keys). No raw genome, no patient name, no URL.
- **Compression & Envelope:** `deflate-raw` + `base64url`, wrapped by default in the C8 WebCrypto envelope (`{ v: 1, s, n, c }`, PBKDF2-SHA256 600,000 iterations + AES-GCM-256). Plaintext mode (`{ v: 0, p }`) is available only behind `?dev=1`.
- **QR rendering:** SVG with `shape-rendering="crispEdges"`, `#14201B` ink on `#FFFFFF`, Error Correction `M`, and a 4-module quiet zone.
- **Demo byte sizes (`demo-001`):** raw 341 B → deflate-raw 213 B → C8 envelope 372 B (77×77 modules, EC M).

## Run & Test

```bash
node --test test/qr.test.mjs
npm run dev
npm run build
```

Build prompts: see `prompts/`.
