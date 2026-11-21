# Do not claim (read before writing any string, doc or poster line)

## Killed outright — never say, write or code
1. Saudi mandatory premarital screening does **not** collect G6PD. It screens sickle cell, thalassaemia, HBV, HCV, HIV; G6PD appears only in the separate non-Saudi-spouse panel. The 1.87 million figure is sickle/thalassaemia screens. Two advisors in the project's own council round amplified this error without checking — it is the single most likely way to lose a clinical judge.
2. **Sickle cell trait is not pharmacogenetically actionable.** There is no CPIC guideline for HBB; trait is a carrier state, not a drug-response phenotype.
3. Co-trimoxazole is **low-to-no risk** in the 2022 G6PD update.
4. The 25% G6PD figure is **Al-Ahsa**, not Aseer.
5. **Star-allele callers do not generally use population allele frequency to resolve ambiguous diplotypes.** PharmCAT's docs call its tie-breaking "as arbitrary as sorting them alphabetically" and it reports all viable calls; Aldy 4, Cyrius and Astrolabe do not either. Never ship silent frequency-based diplotype selection: it swaps a visible uncertainty for an invisible guess. Show all candidates.
6. **CPIC "Indeterminate" means alleles of uncertain function, not phase ambiguity.** Conflating the two in front of a clinical pharmacist destroys credibility. (KFSHRC's "indeterminate" was genuine phase ambiguity; they publish no count.)
7. "The data already exists" — a premarital-screening cohort captures people at marriage age from ~2004 on, so most of a 45–64 cohort was never screened. And reading a national registry needs the same ministry and ethics route as obtaining genotypes.
8. Do **not** use the ISPOR 2017 ~USD 61 bn/year drug-related-problem figure (extrapolated from 201 self-selected social-media respondents).
9. Never assert a link between safety-code.org and U-PGx/PREPARE.
10. Never claim a targeted SNP panel is non-identifying. Say only: uninformative about disease risk, stores no sequence.
11. A language model never generates dosing. JMIR 2025;27:e73486 documented GPT-4o (93.5%) and Gemini-1.5-Pro (92.7%) *classifying* 385 guideline recommendations while **inventing dose adjustments** for a guideline that specifies no treatment change.

## Unverified — do not state as fact
- No PGx test price in any Saudi laboratory could be sourced. No price in the pitch as fact.
- Whether PGx is covered by the Council of Health Insurance Essential Benefit Package is unconfirmed; do not assert exclusion. Published statement: reimbursement pathways "not yet well defined".
- No Saudi cost of ADRs or medication errors exists. The only verified Saudi ADR-admission study (Qassim 2018) reports 0.8% of 4,739 ward admissions and contradicts itself (0.08%). Frame as a **measurement gap**, not low risk. UK benchmark for contrast: Pirmohamed BMJ 2004, 6.5% of 18,820 admissions, £466m/yr.
- Aseer's 57.64/100,000 stroke incidence is a single 2016 study with no stated sample size. Not a headline.
- PIM prevalence: use **43.6–80%** (not the 19–80% in one abstract). Largest recent Saudi studies cluster 56–66%; global benchmark 36.7%.
- Which EHR systems the Saudi clusters run is unconfirmed (Cerner is confirmed at KFSHRC only).
- No judging rubric or poster spec was published for this hackathon.

## Honesty labels that must stay
- "Research prototype — not for clinical use." and "Runs on synthetic and GeT-RM reference data; no patient data was used."
- Hardware tiers T3/T4: "Concept render — not built". Cite TAILOR-PCI (Pereira et al., JAMA 2020, primary endpoint not significant) ourselves before a judge does.
- The PIN-encrypted QR stops casual scanning only; a copied QR can be brute-forced offline. Emergency access is the hospital record.
