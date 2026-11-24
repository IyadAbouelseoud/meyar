# F6 demo script — the staircase as one system (3 minutes)

Research prototype — not for clinical use. Everything on screen is demo data (`"mock": true`, "Demo data" label). Numbers in the answers below come only from `docs/sources.md`; the QR size and version are measured live by `make_qr.mjs`.

## Before you start (5 minutes, once)
1. `bash docs/demo/run_e2e.sh` — starts HAPI (8080) and CDS (3000) with `docker compose`, the kit service (5174), resets both demo kits, then plays the whole path once and prints custody events, the CDS card and the QR byte size and version. Run it again to reset.
2. Laptop tabs (English or add `?lang=ar`): `http://localhost:5174/?kit=MYR-DEMO-0002`, `http://localhost:5174/?kit=MYR-DEMO-0001`, `http://localhost:5174/tracker?kit=MYR-DEMO-0001`, `http://localhost:5174/urgent`.
3. **Second device ("another hospital").** The reader needs a secure context (HTTPS or localhost) for the camera and WebCrypto. Either (a) a phone with Chrome USB port-forwarding of `localhost:5174`, opening `http://localhost:5174/reader/`, or (b) the Netlify copy: `bash docs/demo/reader/pack.sh` builds `docs/demo/out/reader-site/`, drag it into Netlify, open `https://<site>/reader/`. Open it once with the network on so it caches, then switch the phone to **airplane mode**. The header shows "Network: off — reading locally".
4. Show the Passport QR on the laptop: `http://localhost:5174/card?kit=MYR-DEMO-0001` (or the Passport app on 5173). Demo PIN: **482916**.

## Run order

| Time | Click | Say |
|---|---|---|
| 0:00–0:25 | Kit `MYR-DEMO-0002` timeline | "Every hand-off of the saliva tube is a barcode scan, hash-chained and stored as FHIR Provenance. This first tube failed lab QC: the timeline says Recollect, and the system refuses to ever issue a result for it." |
| 0:25–0:55 | Kit `MYR-DEMO-0001` timeline, then **Verify the chain** | "The recollected tube: collection, dispatch, lab receipt, QC pass, genotyped. Then a gate: a pharmacist marks it reviewed. Only then is it released to the Passport." Optional: **Edit event 4 without re-sealing** → "Chain broken here"; **Restore**. |
| 0:55–1:15 | Tracker tab | "The patient sees only where the kit is, Arabic first: registered, received, processing, reviewed, in your Passport. Never a result, never the word safe. No smartphone? Print my card." |
| 1:15–1:45 | Terminal output of `run_e2e.sh` step 5, or `/urgent` → **Sign the order** | "A doctor signs clopidogrel. At order-sign the CDS Hooks service answers with a non-interruptive card: CYP2C19 poor metaboliser, the CPIC line verbatim, prasugrel or ticagrelor as better matched. It advises; it does not block." |
| 1:45–2:25 | Phone in airplane mode: **Open the camera**, point at the card, enter 482916 | "Another hospital, no network. The QR carries the encrypted result itself, not a link. Read here: its measured size and QR version. Decrypted on this phone." Then **Tampered card (one byte)** → "One changed byte: rejected, nothing shown." |
| 2:25–2:50 | `/urgent` | "Urgent case before PCI: a cleared single-gene cath-lab unit would feed the same path. That tier is roadmap, concept render, not built, and TAILOR-PCI did not show a significant primary-endpoint result, so we claim feasibility only." |
| 2:50–3:00 | — | "One system, every tier labelled for what it is." |

## The five judge questions

| Question | One-line answer |
|---|---|
| Is this new? A QR card already exists (U-PGx Medication Safety Code). | That card opens a website and needs a network; ours carries the encrypted phenotypes in the QR itself and opens offline, as you just saw in airplane mode. |
| Does offline really work? | Yes: the reader decoded and decrypted the card on a phone in airplane mode, and showed the QR's measured byte size and version on screen. |
| Who trusts a card from another hospital? | The card is AES-GCM sealed under the patient's PIN, so a changed byte is rejected; the PIN only stops casual scanning, and a copied QR can be brute-forced offline, which we say on screen. |
| What happens on a failed sample? | The lab marks QC failed, the timeline and the patient both see "Recollect", and that tube can never issue a result. |
| Who pays? | For scale: UK NICE DG59 (2024) lists a lab CYP2C19 test at £44–£139 per test depending on batch size, and point-of-care kits at £100 (Genedrive) and £125 (Genomadix Cube), ex-VAT; Saudi pricing and payer (NPHIES) are a future deployment step. |

Do not quote any other figure. PREPARE ("about 30% lower odds", 21.0% vs 27.7%) and UF Health (63% accepted, 20% followed) are now verified against the papers (docs/sources.md). Do not use the PROGRESS "90%" figure (unsourced) or any GeT-RM percentage.
