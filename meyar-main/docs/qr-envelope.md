# QR envelope (C8)

The QR holds an encrypted envelope, never plaintext and never a URL.

```
{"v":1,"s":"<salt, base64url, 16 bytes>","n":"<nonce, base64url, 12 bytes>","c":"<AES-GCM ciphertext, base64url>"}
```

- Key: PBKDF2-SHA256, 600,000 iterations (OWASP Password Storage Cheat Sheet), from the patient's 6-digit PIN and the per-card salt. AES-GCM 256.
- Plaintext before encryption: compressed compact contract (genes, phenotype, recommendation key, coverage summary, guideline version). No name, no ID number, no raw genome.
- Limit, stated honestly: a 6-digit PIN can be brute-forced offline by anyone who copies the QR. This stops casual scanning, not a determined attacker.
- Reissue: new salt and PIN. Old cards cannot be revoked; that is the cost of working offline.
- Emergency: optional single unencrypted line chosen by the patient, off by default. Clinicians with system access read the hospital FHIR store.
