# Build prompt library

One self-contained prompt per task. Each carries the locked context, the data contract, the verified facts and the don't-say list, so it works pasted into a fresh Google Antigravity session with no other context.

Every prompt keeps a live `handoff/<TASK>.md` and stops safely near limits (see AGENTS.md section 3). To resume a stopped task, paste the same prompt again. The demo runs on mock data, so unverified regulations never block a task.

Every UI and print prompt (B3–B6, C1–C9, D1, D2, F3, F4) now carries a **Design system** section pointing at [design/README.md](../design/README.md) and a Done-when box for the anti-slop checklist. Open `design/showcase/index.html` before building any screen.

How to use: open the `meyar` repo in Antigravity, start a new agent session, paste one prompt, approve its Implementation Plan, let it build, check its "Done when" boxes. One task per session. When all tasks are in, run [REVIEW-opus-5.5.md](REVIEW-opus-5.5.md) in Claude Code on Opus 5.5.

| Task | Title | Workstream | Hours | Depends on |
|---|---|---|---|---|
| [A1](A1.md) | Synthetic VCF generator | A | 4 | 0.5 repo |
| [A2](A2.md) | Run PharmCAT 3.4.0 end to end | A | 2 | A1 |
| [A3](A3.md) | Validate against GeT-RM reference samples | A | 3 | A2 |
| [A4](A4.md) | Phenotype store in FHIR | A | 3 | A2 |
| [A5](A5.md) | Coverage and interpretability flag (the differentiator) | A | 4 | A4 |
| [A6](A6.md) | Germline-only guard | A | 1.5 | A4 |
| [A8](A8.md) | Structural-variant gate and outside-call path (CYP2D6) | A | 4 | A2, A4, A5 |
| [B1](B1.md) | CPIC/DPWG recommendation table | B | 4 | none |
| [B2](B2.md) | CDS Hooks order-sign service | B | 4 | A4 |
| [B3](B3.md) | Non-interruptive prescriber card | B | 3 | B2 |
| [B4](B4.md) | Alert log and counts dashboard | B | 2 | B3 |
| [A7](A7.md) | Phenoconversion: current medicines shift the effective phenotype | A | 3 | A4, A5, B1 |
| [B5](B5.md) | Side-by-side alert comparison screen | B | 1 | B3 |
| [B6](B6.md) | Prescriber card: better-matched alternatives and current-medicine effects | B | 3 | B1, B3, A7 |
| [C1](C1.md) | Arabic-first patient screen | C | 4 | A4 |
| [C2](C2.md) | Offline QR encoder | C | 3 | C1 |
| [C3](C3.md) | Scan-side reader | C | 2 | C2 |
| [C4](C4.md) | Elderly-legible card text | C | 2 | C1 |
| [C5](C5.md) | Elder accessibility mode | C | 3 | C1, C4 |
| [C6](C6.md) | OTC quick-check search | C | 3 | B1, C1 |
| [C7](C7.md) | Printable QR card | C | 2 | C2, C8 |
| [C8](C8.md) | PIN-protected QR payload | C | 3 | C2 |
| [C9](C9.md) | Patient app: current medicines, better matches, pharmacy check | C | 3 | C1, C6, A7, B6 |
| [D1](D1.md) | Poster | D | 5 | 0.2 |
| [D2](D2.md) | Architecture diagram | D | 2 | A4, B2 |
| [D3](D3.md) | Demo video | D | 3 | A, B, C done |
| [D4](D4.md) | Brief Description field | D | 1 | 0.2 |
| [D5](D5.md) | Submit the form | D | 1 | all |
| [E1](E1.md) | Four-minute pitch script | E | 2 | A–C |
| [E2](E2.md) | Clinical Q&A answers | E | 3 | 0.4 |
| [E3](E3.md) | Rehearsal plan | E | 2 | E1 |
| [F1](F1.md) | Blender static renders | F | 4 | 0.2 |
| [F2](F2.md) | Blender animation | F | 4 | F1 |
| [F3](F3.md) | Chain-of-custody saliva kit software | F | 6 | A4 |
| [F4](F4.md) | Hardware tier panel | F | 1.5 | F1 |
| [F5](F5.md) | Cath-lab roadmap note | F | 0.5 | F1 |
| [REVIEW](REVIEW-opus-5.5.md) | Full review on Opus 5.5 | all | — | everything |

Agentic warning: these prompts are for agents with real system access. Check the scope lock and stop conditions in each before pasting.
