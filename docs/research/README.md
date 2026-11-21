# Research digest for builders

Everything an agent needs from the project's research library, condensed. Full notes live outside the repo (`/mnt/project-files/pgx-research/`, ~450 KB); do not paste them into a prompt. Rules in `../../AGENTS.md` win over anything here.

Files:
- `01-why-this-product.md` — the problem, the evidence for the design, the gap we claim.
- `02-saudi-genetics.md` — the population numbers that justify the coverage flag.
- `03-clinical-logic.md` — gene–drug pairs, alternatives, phenoconversion: what the code must implement.
- `04-dont-claim.md` — killed and unverified claims (read before writing any UI string, doc or poster line).
- `05-tech-constraints.md` — PharmCAT, FHIR, CDS Hooks, hardware and regulatory limits.

Rule of use: a number only goes into code, UI, docs or the poster if it has a row in `../sources.md`. The demo runs on mock data, so an unverified regulation is never a blocker.
