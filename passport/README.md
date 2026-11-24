# passport/

Arabic-first Medication Passport (Vite, port 5173): screen, PIN-encrypted offline QR, scanner, OTC quick-check, print card, elder mode. Tasks C1–C8.

## Offline QR (C2)

- **Prior art:** Medication Safety Code encodes a URL resolved against a server; Meyar encodes the payload itself.
- **Payload:** Compact contract summary (`sampleOrigin`, `genes[]` with diplotype, phenotype/effectivePhenotype, callability, coverage summary, guideline version, and CPIC recommendation keys). No raw genome, no patient name, no patient ID (removed in C8), no URL.
- **Compression & Envelope:** `deflate-raw` + `base64url`, wrapped by default in the C8 WebCrypto envelope (`{ v: 1, s, n, c }`, PBKDF2-SHA256 600,000 iterations + AES-GCM-256). Plaintext mode (`{ v: 0, p }`) is available only behind `?dev=1`, on both the issuing and the scanning side.
- **QR rendering:** SVG with `shape-rendering="crispEdges"`, `#14201B` ink on `#FFFFFF`, Error Correction `M`, and a 4-module quiet zone.
- **Demo byte sizes (`demo-001`, after C8 removed the ID):** raw 325 B → deflate-raw 204 B → C8 envelope 360 B (EC M) for the contract alone; 480 B (QR version 17) as the app issues it with medicine rows. `npm test` prints the current figures.

## PIN-protected QR (C8)

Spec: `docs/qr-envelope.md`. Code: `src/qr.js`, `src/pinguard.js`. Tests: `test/envelope.test.mjs`.

- **The patient chooses the PIN**, exactly 6 digits, typed twice (Doctor tab → "Make my card"). There is no default PIN. It is held in memory only, never stored, logged or sent.
- **Before the PIN, a scanner shows only the holder line** ("Meyar Medication Passport — ask the card holder for the PIN") and, if the patient turned it on, their emergency line. Nothing clinical.
- **Honest limit: a 6-digit PIN can be brute-forced offline by someone who copies the QR.** This stops casual scanning (a stranger who finds the phone or the card), not a determined attacker. Damage is limited because the payload holds phenotypes, never the genome, and no identity. The same sentence sits under the PIN pad in both apps.
- **Wrong-PIN rate limit** in the scanner: after repeated misses the pad locks with a growing wait and a countdown. It is cosmetic: it slows tapping on this screen only, not an offline attack on a copied QR.
- **Reissue:** "Make a new card" draws a fresh salt and nonce with the new PIN. **Old cards cannot be revoked** (offline trade-off) and still open with their old PIN; the patient destroys them.
- **Emergency line:** optional, **off by default**, one line written by the patient, readable without the PIN by anyone. It is bound into the AES-GCM authentication data, so a copied card with an edited line fails to decrypt. The full record for clinicians is the hospital FHIR store.
- **Future deployment step:** PDPL review of what the card may carry. Not a blocker for this mock-data prototype.

## Run & Test

```bash
npm install
npm test          # C2 + C3 + C8 unit tests (node --test, WebCrypto built in)
npm run dev       # http://localhost:5173  (scanner: /scan.html)
npm run build
```

