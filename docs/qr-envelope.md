# QR envelope (C8)

The QR holds an encrypted envelope, never plaintext and never a URL. Code: `passport/src/qr.js` (crypto), `passport/src/pinguard.js` (PIN rules, rate limit). Tests: `cd passport && npm test`.

## Format (v1)

The QR text is compact JSON, UTF-8, no whitespace:

```
{"v":1,"s":"<salt>","n":"<nonce>","c":"<ciphertext>"}
{"v":1,"s":"<salt>","n":"<nonce>","c":"<ciphertext>","e":"<emergency line>"}   ← only if the patient opted in
```

| Field | Type | Content |
|---|---|---|
| `v` | number | Envelope version, `1`. Readers reject any other value (`0` is C2's plaintext dev mode, accepted only with `?dev=1`). |
| `s` | base64url, no padding | PBKDF2 salt, 16 random bytes, new for every card (`crypto.getRandomValues`). |
| `n` | base64url, no padding | AES-GCM nonce (IV), 12 random bytes, new for every card. |
| `c` | base64url, no padding | AES-GCM-256 ciphertext with its 16-byte authentication tag appended (WebCrypto layout). |
| `e` | string, ≤ 120 characters, optional | The patient's own emergency line, in clear. Absent by default. |

Readers reject an envelope with any other field, a wrong salt or nonce length, or a ciphertext no longer than the tag, before deriving a key.

## Crypto (WebCrypto only, no library)

- **Key:** PBKDF2-SHA256, **600,000 iterations** (OWASP Password Storage Cheat Sheet, `docs/sources.md`), from the UTF-8 bytes of the 6-digit PIN and the salt → AES-GCM 256-bit key, non-extractable.
- **PIN:** exactly six ASCII digits (`^[0-9]{6}$`). Arabic-Indic digits typed on an Arabic keyboard are normalised to ASCII first. No default PIN exists; the patient chooses it.
- **Cipher:** AES-GCM, 12-byte nonce, 128-bit tag.
- **Additional authenticated data:** the UTF-8 string `meyar-e:` followed by the emergency line (or nothing). Editing, adding or removing `e` on a copied card makes decryption fail, so a forged emergency line cannot sit next to genuine results.
- **Plaintext before encryption:** `deflate-raw` (native `CompressionStream`) of C2's compact payload JSON: per gene the symbol, diplotype, genetic and acting-like phenotype, callability method, coverage summary, Saudi data tier, guideline version and recommendation keys, plus current medicine names. **No name, no patient ID, no ID number, no raw genome, no URL.**
- Measured for demo-001 (`npm test` prints it): raw 325 B → deflate 204 B → envelope 360 B, QR error correction M.

## What a scanner shows

1. **Before the PIN:** only the holder line, "Meyar Medication Passport — ask the card holder for the PIN", plus the emergency line if the patient chose one. No gene, result or medicine. A test checks this (`scanning without the PIN shows only the holder line`). A generic phone camera app shows the raw JSON: random-looking base64url only.
2. **After the right PIN:** decrypted on the device, offline, rendered as clinician cards (C3).
3. **Wrong PIN:** an error, the pad is cleared. After repeated misses the pad locks with a growing wait and a live countdown.

## Limits, stated honestly

- **A 6-digit PIN can be brute-forced offline.** Anyone who copies the QR text can try all one million PINs on their own hardware; PBKDF2 makes each guess slower but does not stop this. The PIN stops casual scanning (a stranger who finds the phone or card), not a determined attacker.
- **The rate limit is cosmetic.** It lives in our scanner page and slows only someone tapping on that screen. It is expected UX, not a security control.
- **Damage is limited by design:** the payload holds phenotypes and recommendation keys, never the genome, and no identity.
- **Reissue:** making a new card draws a new salt and nonce, with a new PIN. **Old cards cannot be revoked**: they keep opening with their old PIN. That is the cost of working offline; the patient destroys old cards.
- **Emergency line:** optional, off by default, written by the patient, readable by anyone. Clinicians with system access read the full record from the hospital FHIR store, not from the card.
- **Future deployment step:** PDPL review of what the card may carry, and a hardware-backed or longer secret if the threat model needs more than casual-scan protection.
