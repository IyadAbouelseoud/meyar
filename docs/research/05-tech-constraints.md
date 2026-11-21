# Technical and regulatory constraints

## PharmCAT 3.4.0 (MPL-2.0)
CLI only, no REST API. Needs GRCh38 with `chr` prefixes. Treats absent allele-defining positions as **no-calls, not reference**; the flags that change this are labelled DANGEROUS in its docs and must never be used. Pin demo results with its outside-call file, never hand-edited VCFs. Run it in Docker, in batch, once. A5 (coverage) and A7 (phenoconversion) are separate steps **after** PharmCAT, never inside it.
Alternatives considered: StellarPGx (MIT) is short-read WGS only; Aldy is 99.5–99.9% accurate *excluding* additional alleles, ambiguous phasing and hybrids, and its authors hold a patent.

## Data and interoperability
- Publish as HL7 FHIR **Genomics Reporting IG** resources in the local HAPI container (`hapiproject/hapi:v8.12.0-2`, port 8080). Never depend on public hapi.fhir.org (regularly purged).
- Genomic source class germline = LOINC **48002-0** (A6 gate).
- CDS Hooks **2.0.1**, hook `order-sign` (maturity 5); `order-select` (4) acceptable; `medication-prescribe` is deprecated. Sandbox on 8081.
- Validation data: CDC **GeT-RM** (363 samples, 34 genes; 70 raw at ENA PRJEB19931).

## Hardware reality (Section F)
- The only established near-patient PGx device in the regulatory record is the **Genomadix Cube** (FDA 510(k) K220026): CYP2C19 *2/*3/*17 only, buccal swab, ~1 hour, 99% correct calls versus sequencing after second-pass testing. Predicate Spartan Rx (K123891, 2012).
- **No multi-gene near-patient PGx system exists anywhere.** The closest research precedent is probe-enhanced LAMP (Theranostics 2019;9:3723) genotyping **two** variants from crudely treated saliva in ~1 hour. No published example of multiplexed LAMP genotyping of ≥10 SNPs, and optimal reaction temperature varies per SNP.
- No sourced cost exists for LAMP/CRISPR/microfluidic genotyping or any cartridge part. Any number is labelled the team's own estimate.
- Therefore: T1 chain-of-custody saliva kit (F3, working software) and T2 central lab (exists) are real; T3 single-gene cath-lab unit is roadmap; T4 multi-gene reader is a concept render. Every render carries its label.

## Regulatory (future deployment, never a blocker for the demo)
SFDA MDS-G008 classifies IVDs A–D; software Rule 11's Class D example is literally "software selecting cytostatic drug doses". MDS-G010 (AI/ML) requires multi-centre demographically matched data and local validation even of devices approved elsewhere. MDS-REQ 9 confirms the Ministry of Industry industrial licence is explicitly not applicable to software development. PDPL governs genetic data.
**Because the demo runs on mock data and processes no patient data, none of this stops a build task.** Name it as a future deployment step. A real pilot route exists to name on stage: the Seha Virtual Hospital Innovation Empowerment Center Sandbox (242 hospitals, 597k annual capacity, 18-entity scientific committee).

## Demo robustness
Venue wifi fails: everything must run offline on the laptop, and a pre-recorded screen capture of the full demo sits on disk (D3).
