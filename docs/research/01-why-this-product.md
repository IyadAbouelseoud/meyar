# Why this product (the one-paragraph case)

**The genotyping is not the bottleneck; the last mile is.** KFSHRC's programme (Bakheet et al., Genetics in Medicine Open 2025;3:103426, n=512, six genes) achieved 100% CAP concordance and then entered results into Cerner **manually** and notified clinicians **by email**; the paper itself says the system "lacks integrated notification features." A Saudi MoH framework paper (Genes 17(9):1115, 14 Sep 2026) states no national PGx infrastructure exists and NPHIES's implementation guide does not cover the clinical genomic interoperability PGx needs. Qatar HMC and the UAE Emirati Genome Programme document no individual return route. In Thailand a patient died of toxic epidermal necrolysis while a known HLA-B*15:02 result sat unused.

So Meyar builds the last mile: genotype in, prescribing decision at the moment of prescribing, plus a patient-held Arabic passport that carries the result to any clinic with no such system.

## Why the card is non-interruptive (design evidence)
- University of Florida Health interruptive PGx alerts (Aug 2020–May 2022): 63% accepted, but the recommendation was actually followed in only **20%** (79/392).
- Mayo RIGHT 10K: drug–gene EHR alerts fired 6,620 times (Mar 2015–Dec 2018); separately, prescribers accepted 54% of pharmacists' semi-urgent eConsult recommendations for 61 patients (Wang et al., Genet Med 2022); Mayo deliberately alerted to recommend a *test*, to avoid fatigue.
- NHS England PROGRESS (ISRCTN15390784) is testing pharmacogenetic-guided prescribing in 21 general practices; its outcome results were not published in a peer-reviewed source as of 24 Nov 2026 (Brunton et al., Implement Sci Commun 2026). Earlier "90% acted on" and "1 in 4 changed" figures could not be sourced: DROPPED.

Conclusion the team defends on stage: interruptive pop-ups fail; non-interruptive, pharmacist-mediated delivery works. Showing restraint is the design decision — so the UI must make the restraint visible (B4, B5).

## The gap we claim
- No product was found anywhere combining medication management with pharmacogenomics **for patients**.
- Medication Safety Code (safety-code.org): QR payload doubles as a URL and carries no identifiers; PREPARE gave every intervention patient a Medication Safety Code QR card (Swen et al., Lancet 2023, p. 350; verified 24 Nov 2026). Meyar's QR encodes the payload itself, works with no server.
- PharMe (Mount Sinai + Hasso Plattner, research phase, 17 genes, 159 drugs, on-device CPIC matching, SUS 82.86/28 testers). Its authors name its own gaps, which are our feature list: medications loaded once and never updated, **no current-medication/interaction logic**, English only, untested in older adults and low health literacy, annotations not shareable between institutions.
- Commercial PGx is clinician-facing and institution-locked (OneOme RightMed US$349, Genomind At-Home US$599; Genelex/YouScript inside Epic). EHR-embedded PGx exists, but not in Saudi Arabia, not Saudi-calibrated, not portable between institutions.

## Economics (quote only with these caveats)
- PREPARE/U-PGx (Lancet 2023), 6,944 patients, 7 countries: clinically relevant ADRs 21.5% vs 28.6%, OR 0.70 (0.61–0.79), p<0.0001.
- Cost-utility (eClinicalMedicine 2025): €124 assumed panel cost, ICER €12,020/QALY.
- Caveat: a PLOS ONE umbrella review (16 Jun 2026) of 17 reviews/211 evaluations found 71.1% cost-effective but only 25 of 211 assessed **panels**, and says panel cost-effectiveness "remains unclear"; the Middle East is absent. That absence is itself an argument for doing this here.

## Who to enrol (the wedge)
46.7% of 1,483,905 Saudi patients (MNG-HA 2015–2021) were prescribed ≥1 of 78 formulary pharmacogenetic drugs; peak exposure band is **45–64 (31.3%)**, not 65+. Architecture is hospital-wide (a panel is panel-priced, so extra departments cost nothing); enrolment is a narrow cardiometabolic + polypharmacy wedge so there is one measurable claim.
