# Research-report verification (Part C, items 1–36)

Final review pass, 24 Nov 2026, branch `review/final-2026-11-24`. Every item in `prompts/REVIEW-opus-5.5.md` Part C is checked here, so the paper (`Meyar research report (MLA).docx`, Appendix A) can be finished from this file alone.

## How to use this file
- Each row gives the claim, a **verdict**, the evidence (an exact quote with page, table and URL/DOI, or a command and its output), a **ready-to-paste replacement sentence**, and the **MLA 9 Works Cited** entry.
- Verdicts:
  - **VERIFIED**: the primary source was opened and quoted.
  - **CORRECTED**: the claim was wrong, and the true value and its source are given.
  - **TESTED**: the claim was checked by running code in this repo.
  - **DROPPED**: the claim cannot be verified, so remove it from the paper.
  - **STILL UNVERIFIED**: the primary source could not be opened, so do not print the claim as fact.
- A secondary summary (news, blog, aggregator or AI summary) never counts as verification.
- MLA entries marked `[confirm first name]` used initials only. Check the journal page before printing.

## Verdict counts

| Section | VERIFIED | CORRECTED | TESTED | DROPPED | STILL UNVERIFIED | Counted by |
|---|---|---|---|---|---|---|
| C1 clinical evidence (items 1–11) | 7 | 2 | 1 | 1 | 0 | main claim of each item (sub-claims carry their own verdicts in the rows) |
| C2 Saudi genetics and burden (items 12–20) | 6 (12, 13, 14, 15, 18, 19) | 2 (17, 20) + parts of 13 and 16 | 1 (13-TEST: 82/82 frequency rows match Goljan Table 1) | parts of 16 ("50% Riyadh polypharmacy", ISPOR US$61bn) | parts of 14, 16 and 17 | item, with item 16 MIXED |
| C3/C4 technology, regulation, hardware, hackathon (items 21–36) | 26 | 9 | 13 | 1 (+30d recommended) | 8 | rows, including sub-items |

Still unverified, so do not print as fact:
- the Coriell `*1/*1` listing for NA11839
- GeT-RM "363 samples / 34 genes" and its usage terms
- the Groningen and commercial passport examples
- NICE DG59 prices
- the array and OneOme prices
- a team record of the 21 Nov "device cut" decision
- an official KKU hackathon page or rubric
- the PDPL Implementing Regulations
- Saudi PCI counts and Aseer diabetes/CVD prevalence
- the Saudi Genome Program running total
- the array untested-position mechanism (keep it labelled "mechanism hypothesis")

## Already applied in this branch
The repo corrections each section lists were made in this branch, except the team-owned items:
- `AGENTS.md`: Thomas attribution, CPIC/DPWG provenance.
- `tables/saudi_frequencies.json`: SLCO1B1 Tier 2 statement, Tier 2 `doi`/`n` fields. Filed in `docs/requests.md`.
- `prompts/*.md` data-contract blocks.

See `docs/REVIEW.md` section 3 for the commits.

---

## C1. Clinical evidence claims (items 1–11)

Checked 24 Nov 2026. The repo was only read, never edited. Every verdict comes from a primary source opened in this session: the full-text PDF or PMC/Europe PMC full text, the NCBI PubMed E-utilities record, the CPIC database API (api.cpicpgx.org), the ClinPGx API (api.clinpgx.org), fda.gov, or the ISRCTN XML API. No news item, blog, aggregator or AI search summary is used as evidence. Where the primary source could not be opened, the verdict is STILL UNVERIFIED or DROPPED.

Verdict counts (main claim of each item): VERIFIED 7 (items 1, 2, 3, 4, 6, 9, 11) · CORRECTED 2 (items 7, 10) · TESTED 1 (item 8) · DROPPED 1 (item 5). Several items also contain sub-claims with their own verdicts; these are listed in the rows.

A note on first names in MLA entries: a first name appears only where it was read in the full text (PDF, PMC or JATS XML). Where only PubMed initials were available, the initials are kept and marked [confirm first name]. Fill these in from the journal page before printing.

---

### Table

| # | Claim (as repo/prompt states it) | Verdict | Evidence (exact quote · page/table · URL/DOI) | Ready-to-paste replacement sentence | Works Cited (MLA 9) |
|---|---|---|---|---|---|
| 1a | PREPARE: OR 0.70 actionable subgroup 21.0% vs 27.7% (CI 0.54–0.91); whole cohort 21.5% vs 28.6% (CI 0.61–0.79); which analysis is primary | **VERIFIED** | Full text read (Leiden repository publisher PDF, hdl.handle.net/1887/3720765). Summary, p. 347: "In patients with an actionable test result for the index drug (n=1558), a clinically relevant adverse drug reaction occurred in 152 (21·0%) of 725 patients in the study group and 231 (27·7%) of 833 patients in the control group (odds ratio [OR] 0·70 [95% CI 0·54–0·91]; p=0·0075), whereas for all patients, the incidence was 628 (21·5%) of 2923 patients in the study group and 934 (28·6%) of 3270 patients in the control group (OR 0·70 [95% CI 0·61–0·79]; p <0·0001)." Primary analysis (p. 347 and Statistical analysis, p. 350): "The primary analysis was done using a gatekeeping analysis, in which outcomes in people with an actionable drug–gene interaction in the study group versus the control group were compared, and only if the difference was statistically significant was an analysis done that included all of the patients in the study." So the **actionable-subgroup comparison is the primary (first gatekeeper)** and the all-patient analysis is the second gatekeeper. PMID 36739136; doi:10.1016/S0140-6736(22)01841-4. | "In PREPARE, the primary (gatekeeping) analysis of patients with an actionable result found clinically relevant adverse drug reactions in 21.0% of the genotype-guided group versus 27.7% of controls (OR 0.70, 95% CI 0.54–0.91), which is about 30% lower odds. The second-step analysis of all patients gave 21.5% versus 28.6% (OR 0.70, 95% CI 0.61–0.79) (Swen et al. 347)." | Swen, Jesse J., et al. "A 12-Gene Pharmacogenetic Panel to Prevent Adverse Drug Reactions: An Open-Label, Multicentre, Controlled, Cluster-Randomised Crossover Implementation Study." *The Lancet*, vol. 401, no. 10374, 2023, pp. 347–56, https://doi.org/10.1016/S0140-6736(22)01841-4. (First author is Swen; van der Wouden is second.) |
| 1b | "raw ~24%" ADR figure | **DROPPED** | Not present anywhere in the full text. The reported incidences are 21.0/27.7% and 21.5/28.6%. The pooled crude rate across both arms would be (628+934)/(2923+3270) = 25.2%. This is my own arithmetic and is not a reported figure, so it must not be cited either. | Delete the sentence that contains "~24%". | — |
| 1c | Open-label; self-reported outcomes as a limitation | **VERIFIED** | Title and Methods, p. 347: "open-label". p. 350: "Because of the nature of the study design, patients, and investigators were not masked to treatment." p. 355 (limitations): "We used patient-reported adverse drug reactions, collected during scheduled interviews with research nurses, that were not objectified by use of laboratory tests or physical examinations." Mitigation, same page: causality was assessed with a validated tool and re-checked by masked Lareb assessors in a random 10% sample (p. 350). | "PREPARE was open-label (patients and investigators were not masked), and its outcome relied on patient-reported adverse reactions collected by interview rather than laboratory or clinical confirmation (Swen et al. 350, 355)." | as 1a |
| 1d | Panel changed during the study | **VERIFIED** | p. 349: "by design the panel was not static and changes to the variant panel were allowed during the study and several changes occurred to represent a real-world situation." p. 354: "The gene panel, list of eligible drugs, and recommendations were not static and changes that resulted from updates of the DPWG guidelines were allowed… including the removal of oxycodone… and changes to the actionability of phenotypes for voriconazole, escitalopram, clomipramine, CYP2B6, and DPYD." The authors present this as a challenge of the real-world design, not under the heading "limitations". | "By design, the PREPARE gene panel and its recommendations changed during the study as DPWG guidelines were updated (Swen et al. 349, 354)." | as 1a |
| 1e | "10–20× more patients" needed | **VERIFIED** | p. 354: "We estimated that a truly pre-emptive study to investigate a genotyping strategy using a pharmacogenetic panel would require at least a 10–20 times larger sample size compared with our study, as many patients would not start an index drug within the timeframe of the study." | "The authors estimated that a truly pre-emptive panel trial would need a sample at least 10–20 times larger, so PREPARE enrolled patients at their first prescription of an index drug instead (Swen et al. 354)." | as 1a |
| 1f | Published critical correspondence | **VERIFIED** (bibliographic record, PubMed E-utilities). The letter texts were not opened, so their arguments are not quoted. | *Lancet* 2023 Jun 3;401(10391): Rogers A, Mackenzie IS, MacDonald TM, Doney ASF, "The PREPARE study: benefits of pharmacogenetic testing are unclear", p. 1850, doi:10.1016/S0140-6736(23)00853-X, PMID 37270236. Curtis D, same title, pp. 1850–51, doi:10.1016/S0140-6736(23)00854-1, PMID 37270235. Van der Linden L, same title, p. 1851, doi:10.1016/S0140-6736(23)00855-3, PMID 37270237. Swen JJ, Manson LEN, Böhringer S, Pirmohamed M, Guchelaar HJ, "…Authors' reply", pp. 1851–52, doi:10.1016/S0140-6736(23)00852-8, PMID 37270238. | "Three letters in *The Lancet* questioned whether PREPARE's benefit came from testing itself, and the authors replied (Rogers et al.; Curtis; Van der Linden; Swen et al., "Authors' Reply")." Do not paraphrase their arguments until the letters have been read. | Rogers, A., et al. [confirm first names] "The PREPARE Study: Benefits of Pharmacogenetic Testing Are Unclear." *The Lancet*, vol. 401, no. 10391, 2023, p. 1850, https://doi.org/10.1016/S0140-6736(23)00853-X. Add similar entries for Curtis (pp. 1850–51), Van der Linden (p. 1851) and the authors' reply (pp. 1851–52) with the DOIs above. |
| 1g | Whether PREPARE used a Safety-Code QR card | **VERIFIED: yes** | p. 350: "All patients received a Medication Safety Code card that included a quick response code (also known as a QR code) that stored the patient's encoded pharmacogenetic test results and led to a website that provided the relevant DPWG recommendations once the code was read with a standard smartphone or other device (see appendix p 13)… In the control group, patients received… a plastic card indicating their participation in the PREPARE study (in place of a Medication Safety Code card)." Margin note, same page: "For more on the Medication Safety Code initiative see https://safety-code.org/". | "In PREPARE, every intervention patient carried a Medication Safety Code card whose QR code encoded their pharmacogenetic results and opened a website with the DPWG recommendations (Swen et al. 350)." | as 1a |
| 2 | TAILOR-PCI: primary result not significant; post hoc first-3-months HR ≈0.21 and CI | **VERIFIED** | PMC7448831 full text, *JAMA* 2020;324(8):761–771, doi:10.1001/jama.2020.12443, PMID 32840598. Abstract: "The primary end point occurred in 35 of 903 CYP2C19 LOF carriers (4.0%) in the genotype-guided therapy group and 54 of 946 (5.9%) in the conventional therapy group at 12 months (hazard ratio [HR], 0.66 [95% CI, 0.43-1.02]; P = .06)." Results, "Post Hoc Analysis of the Primary Outcome": "a post hoc analysis was performed that demonstrated an estimated HR… of 0.21 (95% CI, 0.08-0.54; P = .001) at 0 to 3 months' follow-up, 0.78 (95% CI, 0.38-1.61; P = .50) at 3 to 6 months' follow-up, and 1.44 (95% CI, 0.69-3.03; P = .33) at 6 to 12 months' follow-up." Methods: "The time segments were not prespecified." | "TAILOR-PCI did not meet its primary endpoint: among CYP2C19 loss-of-function carriers, the 12-month composite occurred in 4.0% with genotype-guided therapy versus 5.9% with clopidogrel (HR 0.66, 95% CI 0.43–1.02; P = .06). A post hoc analysis with time windows that were not prespecified suggested an early effect in the first 3 months (HR 0.21, 95% CI 0.08–0.54), which is hypothesis-generating only (Pereira et al.)." | Pereira, Naveen L., et al. "Effect of Genotype-Guided Oral P2Y12 Inhibitor Selection vs Conventional Clopidogrel Therapy on Ischemic Outcomes After Percutaneous Coronary Intervention: The TAILOR-PCI Randomized Clinical Trial." *JAMA*, vol. 324, no. 8, 2020, pp. 761–71, https://doi.org/10.1001/jama.2020.12443. |
| 3 | RAPID GENE, *Lancet* 2012;379:1705–11 + DOI | **VERIFIED** (PubMed record; no free full text in PMC) | PMID 22464343: "Point-of-care genetic testing for personalisation of antiplatelet treatment (RAPID GENE): a prospective, randomised, proof-of-concept trial." Roberts JD, Wells GA, Le May MR, … So DY. *Lancet* 2012 May 5;379(9827):1705-11. doi:10.1016/S0140-6736(12)60161-5. | "RAPID GENE showed that point-of-care CYP2C19 genotyping was feasible in patients undergoing PCI (Roberts et al.)." This was a proof-of-concept trial. Do not attach outcome numbers unless they are read from the full text. | Roberts, J. D. [confirm first name], et al. "Point-of-Care Genetic Testing for Personalisation of Antiplatelet Treatment (RAPID GENE): A Prospective, Randomised, Proof-of-Concept Trial." *The Lancet*, vol. 379, no. 9827, 2012, pp. 1705–11, https://doi.org/10.1016/S0140-6736(12)60161-5. |
| 4 | UF Health interruptive alerts: 63% accepted, 47% concordance, "20% followed (79/392)"; add author list | **VERIFIED** | Lemke LK, Cicali EJ, Williams R, Nguyen KA, Cavallari LH, Wiisanen K. *Clin Pharmacol Ther* 2023;114(6):1350–1357, doi:10.1002/cpt.3051, PMID 37716912, PMC10726431 (full text read). Abstract: "818 alerts included for analysis of alert response, 557 alerts included in acceptance rate calculations, and 392 alerts with sufficient information to assess clinical response. The overall acceptance rate was 63%. The alert response and clinical response were congruent for 47% of alerts." Results, "Clinical Response Congruence": "The clinical response followed the PGx-based recommendation(s) made in each CDS alerts 20% of the time (79/392)." Methods: "interruptive PGx alerts that fired at UF Health between August 20, 2020 and May 16, 2022." **Caveat:** 63% has denominator 557 and 20% has denominator 392, so the two are different subsets. | "At UF Health, interruptive pharmacogenetic alerts (August 2020–May 2022) were accepted 63% of the time (of 557 alerts with an accept or override response), yet in the 392 alerts with a documented clinical action the prescriber followed the recommendation only 20% of the time (79/392), and alert response matched clinical action in just 47% (Lemke et al.)." | Lemke, Lauren K., et al. "Clinician Response to Pharmacogenetic Clinical Decision Support Alerts." *Clinical Pharmacology & Therapeutics*, vol. 114, no. 6, 2023, pp. 1350–57, https://doi.org/10.1002/cpt.3051. |
| 5 | UK PROGRESS: "90% of healthcare professionals acted"; non-interruptive, pharmacist-mediated; aggregator 500 participants / 20 sites / 95% | **DROPPED** (90%, 95%, 500, ">1,325 patients", "results 2 Oct 2026" are all unverified). Study existence, design and number of sites are **VERIFIED**. | No peer-reviewed outcome paper was found on PubMed (searched 24 Nov 2026). ISRCTN15390784 registry XML (doi:10.1186/ISRCTN15390784, last updated 2026-04-08): title "Pharmacogenetics Roll Out – Gauging Response to Service", target enrolment 1450, recruitment 2023-06-19 to 2025-12-31, overall end 2026-07-31, no results posted. The only peer-reviewed PROGRESS paper is a qualitative process evaluation: Brunton L, Newman W, McDermott J, Wilson P, *Implement Sci Commun* 2026;7(1):149, doi:10.1186/s43058-026-01005-x, PMID 42363301, PMC13471391. It says "10 early adopter sites across the Northwest of England, from June 2023… a further 11 sites (phase 2 sites), from February 2025" (21 sites in all), and that the PROGRESSRx tool "integrates genetic results into existing clinical decision support systems, to provide real-time prescribing advice". It reports **no** 90% or 95% figure and does not describe the alerts as "non-interruptive". Many local PIs were pharmacists, but "pharmacist-mediated" is not stated as the model. | "In England, the PROGRESS study (ISRCTN15390784) is testing pharmacogenetic-guided prescribing in 21 general practices. Its outcome results were not yet published in a peer-reviewed source as of 24 Nov 2026 (Brunton et al.)." Remove "90% acted on" and "non-interruptive and pharmacist-mediated". | Brunton, L. [confirm first name], et al. "Implementing Pharmacogenetic-Guided Prescribing in General Practice: A Qualitative Process Evaluation." *Implementation Science Communications*, vol. 7, no. 1, 2026, article 149, https://doi.org/10.1186/s43058-026-01005-x. Optionally add the ISRCTN registry entry: "Study to Assess the Rollout of a Genetic-Guided Prescribing Service in UK General Practice (PROGRESS)." *ISRCTN Registry*, ISRCTN15390784, https://doi.org/10.1186/ISRCTN15390784. Accessed 24 Nov. 2026. |
| 6a | St Jude: 92% adherence to interruptive PGx alerts; low adherence in inpatients/residents | **VERIFIED** | Nguyen JQ, Crews KR, Moore BT, Kornegay NM, Baker DK, Hasan M, Campbell PK, Dean SM, Relling MV, Hoffman JM, Haidar CE. *J Am Med Inform Assoc* 2022;30(1):132–138, doi:10.1093/jamia/ocac187, PMID 36228116, PMC9748527 (full text read). Results: "Clinicians adhered to pharmacogenomically guided recommendations provided in 4392 out of the 4783 alerts (92%)." Table 2: outpatient 3945/4065 (97%) vs **inpatient 447/718 (62%)**. Medical resident **10/23 (43%)**, attending 94%, fellow 90%, NP/PA 90%. Also: alerts recommending a change in pharmacotherapy had 64% adherence (639/1003), and CYP2D6–ondansetron 48%. Discussion: "Due to the transient rotation of medical residents at St. Jude, they are not exposed to pharmacogenomic educational topics." | "At St. Jude, clinicians followed 92% of 4,783 interruptive pharmacogenomic alerts (Nguyen et al.). Adherence was lower for inpatient alerts (62%), for medical residents (43%, n = 23), and when the alert asked for an actual change of therapy (64%)." | Nguyen, Jenny Q., et al. "Clinician Adherence to Pharmacogenomics Prescribing Recommendations in Clinical Decision Support Alerts." *Journal of the American Medical Informatics Association*, vol. 30, no. 1, 2023, pp. 132–38, https://doi.org/10.1093/jamia/ocac187. (The issue is dated 2023; PubMed gives the e-date 13 Dec 2022.) |
| 6b | University of Chicago OR 26.2 | **VERIFIED** (with a correction to the framing) | O'Donnell PH et al. *Clin Pharmacol Ther* 2017;102(5):859–869, doi:10.1002/cpt.709, PMID 28398598, PMC5636653 (full text read). Abstract: "medications with high pharmacogenomic risk were changed significantly more often than prescription drugs lacking pharmacogenomic information (odds ratio (OR) = 26.2 (9.0-75.3), P < 0.0001)." The CDS was a "traffic light" tool that providers consulted ("when physicians consulted the CDS tool"). It was **not** an interruptive alert, so do not count it as interruptive-alert evidence. 2,279 outpatient encounters. | "At the University of Chicago, when prescribers consulted a traffic-light pharmacogenomic decision-support tool, high-risk medications were changed far more often than drugs without pharmacogenomic information (OR 26.2, 95% CI 9.0–75.3; 2,279 outpatient encounters) (O'Donnell et al.)." | O'Donnell, Peter H., et al. "Pharmacogenomics-Based Point-of-Care Clinical Decision Support Significantly Alters Drug Prescribing." *Clinical Pharmacology & Therapeutics*, vol. 102, no. 5, 2017, pp. 859–69, https://doi.org/10.1002/cpt.709. |
| 6c | eMERGE and Genomics England alert figures | eMERGE **VERIFIED**. Genomics England: **none found** (no figure may be stated). | Herr TM, Peterson JF, Rasmussen LV, Caraballo PJ, Peissig PL, Starren JB. *J Am Med Inform Assoc* 2019;26(2):143–148, doi:10.1093/jamia/ocy156, PMID 30590574, PMC6339514 (full text; erratum 26(5):490, doi:10.1093/jamia/ocz017). Results: "Six sites participated in the alert-level analysis and submitted 294 active, post-test alert instances… Overall, 62% of alerts were accepted and 26% overridden. Clinically, 42% were followed and 43% not followed." I found no primary Genomics England PGx-alert response figure in this session. Web search hit its usage limit, so this was not searched exhaustively. | "In a six-site eMERGE pilot of 294 post-test pharmacogenomic alerts, 62% were accepted but only 42% were clinically followed (Herr et al.)." For Genomics England: "We found no published alert-response figure from Genomics England." | Herr, Timothy M., et al. "Pharmacogenomic Clinical Decision Support Design and Multi-Site Process Outcomes Analysis in the eMERGE Network." *Journal of the American Medical Informatics Association*, vol. 26, no. 2, 2019, pp. 143–48, https://doi.org/10.1093/jamia/ocy156. |
| 7a | Mayo RIGHT 10K (Wang et al. 2022): 54% acceptance of 61 semi-urgent recommendations; what "6,620 alerts" is | **CORRECTED** (the repo conflates two different numbers) | Wang L et al. *Genet Med* 2022;24(5):1062–1072, doi:10.1016/j.gim.2022.01.022, PMID 35331649, PMC9272414 (full text). Discussion: "Semi-urgent eConsults were sent for 61 patients. The drugs involved were clopidogrel for 41 of the 61 patients (67%)… Providers for those patients accepted 54% of the pharmacists' semi-urgent eConsult recommendations… a total of 2782 clinically actionable eConsults were sent out." Table 1 legend: "Between March 2015 and December 2018 these alerts fired a total of 6620 times." So 6,620 is the total number of EHR drug–gene alert firings (some of which were reactive "order a test" alerts). **54% is the acceptance of pharmacist eConsults, not of alerts.** No alert-acceptance rate is given. | "In the Mayo–Baylor RIGHT 10K study, Mayo's drug–gene EHR alerts fired 6,620 times between March 2015 and December 2018. Separately, pharmacists sent semi-urgent eConsults for 61 patients, and prescribers accepted 54% of those recommendations (Wang et al.)." | Wang, Liewei, et al. "Implementation of Preemptive DNA Sequence-Based Pharmacogenomics Testing across a Large Academic Medical Center: The Mayo-Baylor RIGHT 10K Study." *Genetics in Medicine*, vol. 24, no. 5, 2022, pp. 1062–72, https://doi.org/10.1016/j.gim.2022.01.022. |
| 7b | Vanderbilt PREDICT figures | **VERIFIED** (abstract only, PubMed). The report's own PREDICT numbers are not in the repo, so each must be matched to this text. | Pulley JM, Denny JC, Peterson JF, et al. *Clin Pharmacol Ther* 2012;92(1):87–95, doi:10.1038/clpt.2011.371, PMID 22588608. Abstract: "In one year, approximately 3,000 patients, most of whom were scheduled for cardiac catheterization, were genotyped on a multiplexed platform that included genotyping for CYP2C19 variants…" | "In its first year, Vanderbilt's PREDICT program genotyped about 3,000 patients, most of them scheduled for cardiac catheterization, and fired point-of-care decision support when clopidogrel was prescribed for a CYP2C19 variant carrier (Pulley et al.)." Any other PREDICT number in the report: drop it unless it matches this. | Pulley, J. M. [confirm first name], et al. "Operational Implementation of Prospective Genotyping for Personalized Medicine: The Design of the Vanderbilt PREDICT Project." *Clinical Pharmacology & Therapeutics*, vol. 92, no. 1, 2012, pp. 87–95, https://doi.org/10.1038/clpt.2011.371. |
| 7c | St Jude PG4KDS figures | **VERIFIED** (abstract, PubMed; PMC4056586 exists) | Hoffman JM, Haidar CE, Wilkinson MR, et al. *Am J Med Genet C Semin Med Genet* 2014;166C(1):45–55, doi:10.1002/ajmg.c.31391, PMID 24619595. Abstract: "Through August 2013, 1,559 patients have been enrolled, and four gene tests have been released… TPMT, CYP2D6, SLCO1B1, and CYP2C19… coupled to 12 high-risk drugs. Of the 1,016 patients with genotype test results available, 78% of them had at least one high-risk (i.e., actionable) genotype result… 55 interruptive clinical decision support (CDS) alerts were developed." Later status (Nguyen et al. 2023, Methods): "As of November 2021, 14 genes and 66 drugs… have been implemented as part of the… PG4KDS protocol." | "By August 2013, St. Jude's PG4KDS protocol had enrolled 1,559 patients, and 78% of the 1,016 with results carried at least one actionable genotype (Hoffman et al.). By November 2021 it covered 14 genes and 66 drugs (Nguyen et al.)." | Hoffman, J. M. [confirm first name], et al. "PG4KDS: A Model for the Clinical Implementation of Pre-Emptive Pharmacogenetics." *American Journal of Medical Genetics Part C: Seminars in Medical Genetics*, vol. 166C, no. 1, 2014, pp. 45–55, https://doi.org/10.1002/ajmg.c.31391. |
| 8a | CPIC clopidogrel guideline volume 112 + DOI | **VERIFIED** | PubMed 35034351: Lee CR, Luzum JA, Sangkuhl K, … Shuldiner AR. "Clinical Pharmacogenetics Implementation Consortium Guideline for CYP2C19 Genotype and Clopidogrel Therapy: 2022 Update." *Clin Pharmacol Ther* 2022 Nov;112(5):959-967. doi:10.1002/cpt.2526. | (citation only) | Lee, C. R. [confirm first name], et al. "Clinical Pharmacogenetics Implementation Consortium Guideline for CYP2C19 Genotype and Clopidogrel Therapy: 2022 Update." *Clinical Pharmacology & Therapeutics*, vol. 112, no. 5, 2022, pp. 959–67, https://doi.org/10.1002/cpt.2526. |
| 8b | Lima et al. 2021;109(6) PPI guideline | **VERIFIED** (print 2021; e-pub 2020) | PubMed 32770672: *Clin Pharmacol Ther* 2021 Jun;109(6):1417-1423, doi:10.1002/cpt.2015. The CPIC API lists the publication year as 2020 (e-pub). | (citation only; use 2021 in MLA) | Lima, J. J. [confirm first name], et al. "Clinical Pharmacogenetics Implementation Consortium (CPIC) Guideline for CYP2C19 and Proton Pump Inhibitor Dosing." *Clinical Pharmacology & Therapeutics*, vol. 109, no. 6, 2021, pp. 1417–23, https://doi.org/10.1002/cpt.2015. |
| 8c | Has any guideline used been superseded as of Nov 2026? | **VERIFIED: none superseded** | CPIC database API, `api.cpicpgx.org/v1/guideline?select=name,url,version,publication(...)`, read 24 Nov 2026. Latest publication per guideline: clopidogrel 2022 (PMID 35034351); PPIs 2020/21 (32770672); opioids 2021 (33387367); NSAIDs 2020 (32189324); statins 2022 (35152405); G6PD 2022/23 (36049896); DPYD 2017/18 (29152729). No newer publication is attached to any of these. CPIC `change_log` (types RECOMMENDATION/GUIDELINE, since 2022-01-01) shows only in-place edits: 2023-10-20 clopidogrel "took out 'standard dose (75 mg/day)' for PM and likely PM recommendations (CVI) to match publication pdf text"; 2023-05-10 codeine and tramadol "changed AS ≥4.5 to ≥3.75 and 3.5 to 2.75 … due to changes in the CYP2D6 allele function assignment"; 2022-02-01 simvastatin; 2025-08-21 opioid and statin "Removed redundant links to outdated supplemental files". The ClinPGx guideline pages are a JavaScript app and could not be rendered, so the CPIC API (the database behind them) was used instead. | "All CPIC guidelines used (clopidogrel 2022, PPIs 2021, opioids 2021, NSAIDs 2020, statins 2022, G6PD 2023, DPYD 2018) were the current CPIC versions when checked on 24 Nov 2026." | Add the other guideline entries: Crews, K. R., et al., *CPT* vol. 110, no. 4, 2021, pp. 888–96, https://doi.org/10.1002/cpt.2149. Theken, K. N., et al., vol. 108, no. 2, 2020, pp. 191–200, https://doi.org/10.1002/cpt.1830. Cooper-DeHoff, R. M., et al., vol. 111, no. 5, 2022, pp. 1007–21, https://doi.org/10.1002/cpt.2557. Amstutz, U., et al., vol. 103, no. 2, 2018, pp. 210–16, https://doi.org/10.1002/cpt.911. [confirm first names] |
| 8d | CYP2D6 activity-score → phenotype thresholds used by A7 (Caudle 2020) | **TESTED: code matches CPIC/DPWG consensus** | Caudle KE et al. *Clin Transl Sci* 2020;13(1):116–124, doi:10.1111/cts.12692, PMID 31647186, PMC6951851 (full text). **Table 3**, "Consensus contiguous definition (AS)": UM "> 2.25"; NM "1.25 ≤ x ≤ 2.25"; IM "0 < x < 1.25"; PM "0". Code: `engine/phenoconvert.py:250-258`, `passport/src/phenoconvert.js:218-222` and `cds/lib/phenoconvert.js:141-145` all use `==0 → PM; <1.25 → IM; <=2.25 → NM; else UM`. Test run at the boundaries 0, 0.25, 0.5, 1.0, 1.125, 1.25, 1.5, 2.0, 2.25, 2.5, 3.0 gave identical output in Python and JS: 0 PM · 0.25–1.125 IM · 1.25–2.25 NM · 2.5, 3.0 UM. Matches Table 3. (Commands: `python -I -c "from phenoconvert import activity_score_to_phenotype…"` in engine/; JS function extracted and run with node.) **Defect found:** `docs/sources.md:38` writes the IM range as "IM: >0 to 1.0", which is wrong. | "Meyar maps CYP2D6 activity scores to phenotype with the CPIC/DPWG consensus ranges: poor metaboliser 0, intermediate >0 to <1.25, normal 1.25–2.25, ultrarapid >2.25 (Caudle et al., Table 3)." | Caudle, Kelly E., et al. "Standardizing CYP2D6 Genotype to Phenotype Translation: Consensus Recommendations from the Clinical Pharmacogenetics Implementation Consortium and Dutch Pharmacogenetics Working Group." *Clinical and Translational Science*, vol. 13, no. 1, 2020, pp. 116–24, https://doi.org/10.1111/cts.12692. |
| 8e | CPIC term-standardisation paper | **VERIFIED** | PubMed 27441996: Caudle KE, Dunnenberger HM, Freimuth RR, Peterson JF, Burlison JD, Whirl-Carrillo M, Scott SA, Rehm HL, Williams MS, Klein TE, Relling MV, Hoffman JM. *Genet Med* 2017 Feb;19(2):215-223, doi:10.1038/gim.2016.87. Caudle 2020 cites it as "the CPIC term standardization project, which determined that five phenotype groups are sufficient". | "Phenotype labels follow CPIC's standardized terms (Caudle et al., 'Standardizing Terms')." | Caudle, Kelly E., et al. "Standardizing Terms for Clinical Pharmacogenetic Test Results: Consensus Terms from the Clinical Pharmacogenetics Implementation Consortium (CPIC)." *Genetics in Medicine*, vol. 19, no. 2, 2017, pp. 215–23, https://doi.org/10.1038/gim.2016.87. |
| 9 | CPIC G6PD update: volume, pages, authors, DOI of the published version; co-trimoxazole low-to-no risk | **VERIFIED** | PubMed 36049896 / PMC10281211 (author manuscript; full text read): Gammal RS, Pirmohamed M, Somogyi AA, Morris SA, Formea CM, Elchynski AL, Oshikoya KA, McLeod HL, Haidar CE, Whirl-Carrillo M, Klein TE, Caudle KE, Relling MV. "Expanded Clinical Pharmacogenetics Implementation Consortium Guideline for Medication Use in the Context of G6PD Genotype." *Clin Pharmacol Ther* 2023 May;113(5):973–985 (e-pub 24 Sep 2022), doi:10.1002/cpt.2735. Text, section "Sulfamethoxazole (low-to-no risk drug)": "Sulfamethoxazole is considered in the low-to-no risk category because the evidence linking it to AHA is weak…"; "As a low-to-no risk medication, it is recommended to use sulfamethoxazole normally without regard to G6PD status (Table 5), although the strength of the recommendation is 'optional'." The CPIC API for drug RxNorm:10831 "sulfamethoxazole / trimethoprim" gives: Deficient, "No reason to avoid based on G6PD status at standard doses", classification Optional, implication "Low-to-no risk of acute hemolytic anemia". (The "Deficient with CNSHA" row says to use it cautiously with close monitoring.) | "In CPIC's expanded G6PD guideline, sulfamethoxazole (co-trimoxazole) is a low-to-no-risk drug that can be used at standard doses without regard to G6PD status (optional recommendation), except in G6PD deficiency with chronic non-spherocytic haemolytic anaemia, where it should be used with caution (Gammal et al.)." | Gammal, Roseann S., et al. "Expanded Clinical Pharmacogenetics Implementation Consortium Guideline for Medication Use in the Context of G6PD Genotype." *Clinical Pharmacology & Therapeutics*, vol. 113, no. 5, 2023, pp. 973–85, https://doi.org/10.1002/cpt.2735. |
| 10a | Thomas et al. 2020 is a metoprolol PK/PD study; ×0.5/×0 described accurately, not a "validated algorithm" | **CORRECTED** (wording) | Thomas CD, Mosley SA, Kim S, … Cavallari LH. "Examination of Metoprolol Pharmacokinetics and Pharmacodynamics Across CYP2D6 Genotype-Derived Activity Scores." *CPT Pharmacometrics Syst Pharmacol* 2020;9(12):678–685, doi:10.1002/psp4.12563, PMID 33067866, PMC7762806 (JATS full text). Introduction: "Then, if applicable, the AS is multiplied by a factor of 0.5 or 0 to account for phenoconversion with use of a moderate or strong CYP2D6 inhibitor, respectively." This is cited to ref 2 (Crews et al., CPIC codeine 2014 update, *Clin Pharmacol Ther* 95:376–382) and ref 3 (Gaedigk et al., *Clin Pharmacol Ther* 2008;83:234–242). Methods: "The AS method was used to assign CYP2D6 metabolizer phenotype from genotype data and use of CYP2D6 inhibitors." The paper **applies** the convention and does not test or validate the multipliers. Its findings concern metoprolol clearance and heart rate across AS groups (37 PK participants). | "Following the convention described by Thomas et al. (who cite CPIC and Gaedigk et al.), Meyar multiplies the CYP2D6 activity score by 0.5 for a moderate inhibitor and by 0 for a strong inhibitor. This is a published rule of thumb applied in a metoprolol study, not a validated phenoconversion algorithm." | Thomas, Cameron D., et al. "Examination of Metoprolol Pharmacokinetics and Pharmacodynamics across CYP2D6 Genotype-Derived Activity Scores." *CPT: Pharmacometrics & Systems Pharmacology*, vol. 9, no. 12, 2020, pp. 678–85, https://doi.org/10.1002/psp4.12563. |
| 10b | "bupropion strong CYP2D6 inhibitor" quote | **VERIFIED** (reproduced verbatim) | Thomas et al., Results (first paragraph): "One participant in the PK study with the CYP2D6 *1/*1 diplotype was taking bupropion, a strong CYP2D6 inhibitor that phenoconverts the CYP2D6 AS to 0." It is cited to ref 29 (Kim KM et al., *Eur J Clin Pharmacol* 2012;68:1483–1491). The primary regulatory source agrees: FDA "For Healthcare Professionals" page, clinical inhibitors table, row "bupropion 2 \| 2D6 strong inhibitor". | "Bupropion is classed by the FDA as a strong CYP2D6 inhibitor (FDA, 'Examples of Drugs')." Cite the FDA page for the classification, and Thomas et al. only for the quote. | (FDA entry, see 10c) |
| 10c | Split the two FDA table pages and their dates in docs/sources.md | **VERIFIED: two pages with different dates** | (1) "Drug Development and Drug Interactions \| Table of Substrates, Inhibitors and Inducers", https://www.fda.gov/drugs/drug-interactions-labeling/drug-development-and-drug-interactions-table-substrates-inhibitors-and-inducers. Page footer "Content current as of: 06/05/2023" (5 Jun 2023). It holds the *index* inhibitors and the definition "Strong and moderate inhibitors are drugs that increase the AUC of sensitive index substrates of a given metabolic pathway ≥5-fold and ≥2- to <5-fold, respectively." (2) "For Healthcare Professionals \| FDA's Examples of Drugs that Interact with CYP Enzymes and Transporter Systems", https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems. Footer "Content current as of: 05/29/2026" (29 May 2026). Every row of `tables/cyp_inhibitors.json` (e.g. lines 9–10, bupropion) cites page (2). | "Inhibitor strength comes from the FDA clinical-inhibitor examples page (content current as of 29 May 2026), using FDA's definitions of strong (≥5-fold AUC increase) and moderate (≥2- to <5-fold) inhibitors from its Table of Substrates, Inhibitors and Inducers (content current as of 5 Jun 2023)." | United States, Food and Drug Administration. "For Healthcare Professionals: FDA's Examples of Drugs That Interact with CYP Enzymes and Transporter Systems." *FDA*, 29 May 2026, www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems. Accessed 24 Nov. 2026. — United States, Food and Drug Administration. "Drug Development and Drug Interactions: Table of Substrates, Inhibitors and Inducers." *FDA*, 5 June 2023, www.fda.gov/drugs/drug-interactions-labeling/drug-development-and-drug-interactions-table-substrates-inhibitors-and-inducers. Accessed 24 Nov. 2026. |
| 11 | Sickle-cell trait: no CPIC or DPWG HBB guideline | **VERIFIED: none found** | ClinPGx API (covers CPIC, DPWG and other guideline sources): `https://api.clinpgx.org/v1/data/guidelineAnnotation?relatedGenes.symbol=HBB&view=min` returned `{"status":"fail","data":{"errors":[{"message":"No results matching criteria."}]}}`. Positive control with the same query for CYP2C19 returned DPWG and CPIC annotations. The CPIC API guideline list (`api.cpicpgx.org/v1/guideline?select=name,genes`) has no guideline with gene HBB. Checked 24 Nov 2026. | "We found no CPIC or DPWG guideline for HBB or sickle-cell trait (ClinPGx and CPIC databases checked 24 Nov 2026), so Meyar does not treat sickle-cell trait as a pharmacogenetic result." | ClinPGx. "Guideline Annotations: HBB." *ClinPGx*, Stanford University, api.clinpgx.org. Accessed 24 Nov. 2026. (Or cite in text only, with no Works Cited entry.) |

---

### Repo statements that are wrong or need changing (file:line)

None of these files were edited. They are listed for the fix pass.

| File:line | What it says | Problem | Fix |
|---|---|---|---|
| `docs/sources.md:5` | "UF interruptive alerts: 63% accepted, 20% followed \| see EN detail doc" | Secondary pointer; no primary citation | Source: Lemke LK et al., Clin Pharmacol Ther 2023;114(6):1350–1357, doi:10.1002/cpt.3051 (63% of 557; 20% = 79/392; 47% congruent) |
| `docs/sources.md:6` | "UK PROGRESS non-interruptive: 90% acted on" | Not verifiable from a primary source | Delete the row, or replace it with "PROGRESS (ISRCTN15390784), 21 GP sites, outcomes unpublished as of 24 Nov 2026" |
| `docs/sources.md:12` | "RAPID GENE … Roberts et al., Lancet 2012" | Incomplete | Lancet 2012;379(9827):1705–11, doi:10.1016/S0140-6736(12)60161-5 |
| `docs/sources.md:13` | "TAILOR-PCI … Pereira et al., JAMA 2020" | Incomplete | JAMA 2020;324(8):761–771, doi:10.1001/jama.2020.12443; HR 0.66 (0.43–1.02), P=.06 |
| `docs/sources.md:19` | ×0.5/×0 attributed to Thomas et al. 2020 as the source | Thomas applies the convention and cites Crews 2014 / Gaedigk 2008; it does not validate it | Add: "convention as described in Thomas et al. (Introduction), who cite CPIC (Crews 2014) and Gaedigk 2008; not a validated algorithm" |
| `docs/sources.md:20` | FDA "Table of Substrates, Inhibitors and Inducers", no date | Wrong page for the rows, and no date | Split into two rows: Table page (content current 2023-06-05; strong/moderate definitions) and HCP examples page (content current 2026-05-29; the actual row source) |
| `docs/sources.md:34` | "Lima JJ et al., Clin Pharmacol Ther 2020" | The print citation is 2021 | "Clin Pharmacol Ther 2021;109(6):1417–1423 (e-pub 2020)" |
| `docs/sources.md:38` | "IM: >0 to 1.0" | Wrong. Caudle Table 3 gives IM as 0 < AS < 1.25; the code is correct | "IM: >0 to <1.25" |
| `docs/sources.md:39` | HCP page "linked from FDA Table…, content current as of 2026-05-29" | The date belongs only to the HCP page; the Table page is 2023-06-05 | Keep 2026-05-29 for the HCP page and add the separate Table row (see :20) |
| `docs/sources.md:43` | PREPARE "figures as reported by GenomeWeb and News-Medical" | Secondary sources | Replace with the primary citation: Swen JJ et al., Lancet 2023;401(10374):347–356, doi:10.1016/S0140-6736(22)01841-4, Summary p. 347 |
| `docs/cpic-signoff.md:107` | "Lima JJ et al., Clin Pharmacol Ther 2020" | Print year | 2021;109(6):1417–1423 |
| `docs/research/01-why-this-product.md:9` | "Mayo RIGHT 10K: 6,620 firings, 54% provider acceptance" | Conflation: 54% is acceptance of 61 semi-urgent pharmacist eConsults, not of the 6,620 alerts (Mar 2015–Dec 2018) | Use the sentence in row 7a |
| `docs/research/01-why-this-product.md:10` | PROGRESS "results 2 Oct 2026, >1,325 … 21 sites … 90% … ~1 in 4 had a medicine changed" | Only "21 sites" is verified (Brunton 2026); the rest is unverified | Use the sentence in row 5 |
| `docs/research/01-why-this-product.md:16` | Safety-Code "link to U-PGx/PREPARE is **not verified** — never assert it" | Now verified: PREPARE p. 350 says all intervention patients got a Medication Safety Code card with QR and points to safety-code.org | "PREPARE gave every intervention patient a Medication Safety Code QR card (Swen et al. 2023, p. 350)" |
| `docs/research/04-dont-claim.md:12` | "Never assert a link between safety-code.org and U-PGx/PREPARE" | Same as above | Delete, or reword to the verified sentence in row 1g |
| `docs/research/04-dont-claim.md:5` | "There is no CPIC guideline for HBB" | Correct but incomplete | Add "or DPWG (ClinPGx checked 24 Nov 2026)" |
| `cds/lib/compare.js:9` (EN) and `:12` (AR) | "…UK PROGRESS, non-interruptive and pharmacist-mediated — 90% acted on." | PROGRESS 90% and its description are unverified | Remove the PROGRESS clause; keep the UF clause and add the denominators (row 4) |
| `cds/test/cds.test.js:1160`, `:1169` | Asserts the same caption and '90%' | Test pins the unverified number | Update together with compare.js |
| `design/showcase/index.html:441` (grep; prompt line 437 nearby) | Same caption | Same | Same (design/ is owned by the design team, so file a request) |
| `prompts/B5.md:62` | Same caption, "exactly" | Same | Update the prompt text |
| `AGENTS.md:52` | ×0.5/×0 "— Thomas et al., …" | Same attribution nuance as sources.md:19 (team-owned file) | Team to add "convention described in" |
| `docs/demo/SCRIPT.md:33` | "do not use the PREPARE, UF, PROGRESS … percentages flagged as unverified" | PREPARE and UF are now verified; PROGRESS is not | Allow PREPARE (row 1a) and UF (row 4) wording; keep the PROGRESS ban |

Checked and found correct: `docs/poster/build_f4.py:55,59` and the four `docs/poster/f4-*.svg` files ("about 30% lower odds … 21.0% vs 27.7%", footnote "Swen JJ et al., Lancet 2023;401:347–356"). These match row 1a. Nothing was found in `passport/src/i18n` that states any of these claims.

---

### Not done / limits
- Web search hit its usage limit partway through. After that, all lookups went directly to primary endpoints (NCBI E-utilities, PMC, Europe PMC, CPIC API, ClinPGx API, FDA, ISRCTN API). Genomics England (6c) was not searched exhaustively.
- PREPARE correspondence (1f): only the bibliographic records were read, not the letter texts.
- RAPID GENE (3), PREDICT (7b), PG4KDS (7c): abstract and PubMed record only. No outcome numbers beyond the abstracts are verified.
- ClinPGx web pages need JavaScript and were not rendered. Instead, the ClinPGx REST API and the CPIC database API were used.
- First names marked [confirm first name] were not seen in a full text in this session.


---

## C2. Saudi genetics and burden (items 12–20)

Verified 24 Nov 2026. Rules applied: only primary sources (publisher/PMC full text via the Europe PMC
REST full-text XML service, official government pages, the 1000 Genomes/IGSR data files, and the tools'
own repositories/docs). No secondary summary was accepted as verification. Where a primary source
could not be opened, the verdict is STILL UNVERIFIED or DROPPED.

Note on access: `pmc.ncbi.nlm.nih.gov` served a reCAPTCHA page and `mdpi.com` / `vision2030.gov.sa`
returned 403, so PMC-deposited full texts were read as JATS XML from
`https://www.ebi.ac.uk/europepmc/webservices/rest/<PMCID>/fullTextXML` (the publisher-deposited
article XML itself, not a summary). Each item below names the exact file/table read.

### Summary

| # | Claim | Verdict |
|---|---|---|
| 12 | KFSHRC (Bakheet et al. 2025): phase-ambiguity → "indeterminate"; "upgrading our genotyping kit"; no indeterminate count | VERIFIED |
| 13 | Goljan et al. 2022: six (1.1%) vs four (0.67%) rare variants; CYP3A5\*3 84.7 vs 84.5; CYP2C19\*3, DPYD HapB3, rs1801159; companion SLCO1B1 paper; Works Cited | VERIFIED + CORRECTED (rs1801159 not in the paper) |
| 13-TEST | Every frequency row in `tables/saudi_frequencies.json` matches Goljan Table 1 | TESTED — 82/82 rows, 0 mismatches |
| 14 | Alshabeeb et al. 2025: 38 vs 37 variants; Axiom PMDA (not PharmacoScan); "26 of 37"; n=95; untested-position mechanism | VERIFIED (mechanism sub-claim STILL UNVERIFIED) |
| 15 | Alshabeeb et al. 2022: 31.3% = 561,150 / 1,790,910, exposure records not prevalence | VERIFIED |
| 16 | Burden figures: statin/clopidogrel volumes, PCI counts, Aseer diabetes/CVD, polypharmacy, ADR cost, Aseer stroke 57.64 | MIXED — see rows 16a–16g |
| 17 | Gulf context: Emirati Genome Program and Saudi Genome Program counts; Qatar preprint | CORRECTED / STILL UNVERIFIED |
| 18 | G6PD 25% is Al-Ahsa; no published Aseer figure; Saudi premarital screening excludes G6PD | VERIFIED |
| 19 | 1000 Genomes contains no Saudi or Gulf population | VERIFIED |
| 20 | Other star-allele callers and population frequency | CORRECTED (PAnno does use frequency) |

---

### Item 12 — KFSHRC / Bakheet et al. 2025

**Claim.** The KFSHRC pilot reported phase-ambiguous results as "indeterminate", says it is upgrading
its genotyping kit, and gives no count or percentage of indeterminate results.

**Verdict.** VERIFIED.

**Evidence.** Bakheet et al., *Genetics in Medicine Open* 3 (2025), article 103426, Discussion
("Limitations and lessons learned"), read as publisher JATS XML of PMC12166389
(`https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12166389/fullTextXML`; DOI
10.1016/j.gimo.2025.103426; PMID 40519746). Verbatim:

> "One significant challenge involved our genotyping kit, which occasionally returned multiple
> potential outcomes because of phase ambiguity. In such instances, patients' phenotype/genotype
> results were reported as indeterminate. We are upgrading our genotyping kit to address this issue in
> preparation for the next phase."

No count or percentage of indeterminate results appears anywhere in the article. The paper's own
categorisation folds them into one bucket, which is why no count exists:

> "We categorized the phenotypes/genotypes into normal results (genotypes conferring a normal
> metabolizer status) and results with altered gene function (genotypes conferring all other
> metabolizer statuses including ultrarapid, rapid, intermediate, poor, and indeterminate
> metabolizers)."

Other primary facts from the same text, for the paper: cohort of 512 cardiology and neurology
patients; genotyping by "the PharmacoScan microarray-based test"; "97.5% of all patients have at least
1 gene with altered function"; service launched September 2023; six genes tested; SLCO1B1–statins had
the highest action rate, "212, 41.4" (Table 2).

**Replacement sentence.** A tertiary-care pilot at King Faisal Specialist Hospital and Research Centre
reported that its genotyping kit "occasionally returned multiple potential outcomes because of phase
ambiguity", that such results "were reported as indeterminate", and that the centre is "upgrading our
genotyping kit to address this issue"; the paper reports no count of indeterminate results, so no rate
can be quoted (Bakheet et al. 103426).

**MLA 9 Works Cited fix.**
Bakheet, Dana, et al. "Pharmacogenomic Testing Implementation: Tertiary Care Center Experience and
Results of a Pilot of 512 Patients." *Genetics in Medicine Open*, vol. 3, 2025, article 103426,
https://doi.org/10.1016/j.gimo.2025.103426.

---

### Item 13 — Goljan et al. 2022 and the companion SLCO1B1 paper

**Claims and verdicts (all read from the publisher JATS XML of PMC8797234,
`https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8797234/fullTextXML`; PLOS ONE 17(1):e0263137,
DOI 10.1371/journal.pone.0263137, PMID 35089958).**

**(a) six (1.1%) vs four (0.67%) rare Saudi-specific variants — VERIFIED as a genuine internal
disagreement; do not print either figure as "the" count.**
Abstract: "among the 8 pharmacogenes studied, we detected six rare variants with an aggregated
frequency of 1.1%, that among several other ethnicities, were uniquely found in Saudi population."
Results: "Of all 62 previously reported, predicted to be pathogenic (based on a two-fold scoring) rare
variants (MAF<1%), four (1 stop-gain, 2 frameshift and 2 missense variants) with an aggregated
frequency of 0.67% were uniquely observed in Saudi individuals when compared with other populations".
The repo's decision to omit the figure is correct.

**(b) CYP3A5\*3 84.7% vs 84.5% — VERIFIED.** Table 1 row: `*3 | rs776746 | Splicing defect | Inactive
| 84.5`. Results text: "A splice site variant (rs7767746) that is the core allele for CYP3A5 *3 was
present in 84.7% of the population." (The text also mis-types the rsID as rs7767746; Table 1 and the
Limitations both give rs776746.)

**(c) CYP2C19\*3 — VERIFIED at 0.1%.** Table 1: `*3 | rs4986893 | Stop-gain (W212X) | Inactive | 0.1`.

**(d) DPYD HapB3 — VERIFIED at 0.5%.** Table 1: `1236G>A (HapB3) | rs56038477 | Synonymous (E412 =) |
Decreased function | 0.5`.

**(e) DPYD rs1801159 — CORRECTED: the variant is not in the paper.** rs1801159 (DPYD\*5) appears
nowhere in Goljan et al. 2022; Table 1's DPYD rows are \*1, 2846A>T (rs67376798), \*2A (rs3918290),
\*8 (rs1801266), 557A>G (rs115232898), 2279C>T (rs112766203.1), 1475C>T (rs72549304), 868A>G
(rs146356975) and 1236G>A/HapB3 (rs56038477). Any Saudi frequency for rs1801159 attributed to this
paper must be removed. `tables/saudi_frequencies.json` correctly does not contain it.

**(f) Companion Human Genomics 2024 SLCO1B1 paper (\*15 24.7%, 47.6% actionable) and its authors —
VERIFIED** (publisher JATS XML of PMC10962151; DOI 10.1186/s40246-024-00594-9; PMID 38523294).
Abstract: "we observed six alleles [*15 (24.7%) followed by *20 (8.04%), *14 (5.86%), *5 (3.84%), *31
(0.21%) and *9 (0.03%)] predicted to be clinically actionable." Results: "Predicted actionable
phenotypes (poor function: 9.5% and decreased function: 38.1%) were observed in 47.6% of the Saudi
population" and "higher than seen in another Middle East population from Qatar (47.61% versus 32.37%
respectively) … thus far, the highest observed in the CPIC database". Authors, in order: Ewa Goljan,
Mohammed Abouelhoda, Asma Tahir, Mohamed ElKalioby, Brian Meyer, Dorota Monies.

**(g) Title and first names in Works Cited for the 2022 paper — VERIFIED.** Title: "Identification of
pharmacogenetic variants from large scale next generation sequencing data in the Saudi population."
Authors, in order: Ewa Goljan, Mohammed Abouelhoda, Mohamed M. ElKalioby, Amjad Jabaan, Nada Alghithi,
Brian F. Meyer, Dorota Monies. Cohort, verbatim from Methods: "The dataset used for mining of
pharmacogenomic variants comprised 9,961 exomes and 1,928 PGx custom gene panels … sequenced by the
Saudi Human Genome Program (SHGP) between 2015 and 2019". Data statement: "Data cannot be shared
publicly because of National policy." CYP2D6 exclusion, verbatim: "Structural changes and copy number
variations which may be relevant are not reliably identified by whole exome or gene panel sequencing.
Thus, we were not able to call star alleles with whole gene deletions, duplications or hybrids that are
common in the assignment of CYP2D6 alleles. Accordingly, we did not include CYP2D6 in our analysis."

#### Item 13 — TEST: `tables/saudi_frequencies.json` vs Goljan Table 1, value by value

Method: Table 1 ("Gene | Allele | Core variant | Variant type | Functional Status | Allele Frequency,
SA (%)") was parsed from the article's JATS `<table-wrap id="pone.0263137.t001">` (the published HTML
table, not the figure image), giving 82 data rows. The 82 allele rows in
`tables/saudi_frequencies.json` were compared row by row on allele name, core variant, variant type,
functional status and reported frequency (whitespace-insensitive; `0` and `0.0` treated as equal).

**Result: 82 table rows, 82 repo rows, same order, 0 mismatches.** Gene-by-gene row counts match too:
CYP2C9 22, CYP2C19 20, CYP3A5 6, CYP4F2 2, VKORC1 9, DPYD 9, TPMT 11, NUDT15 3 — 82 in total, matching
the paper's "We analyzed frequencies of 82 haplotypes distributed across 8 pharmacogenes" and
"collectively identified 82 such star alleles".

**Mismatch list: none.** (The repo faithfully reproduces Table 1's own typography, including
`Missense(R124W)` for \*39, `Missense (T130M))` for \*44 and `rs112766203.1` for DPYD 2279C>T; these
are the paper's strings, not repo errors. The repo uses Table 1's 84.5% for CYP3A5\*3 and records the
84.7% text discrepancy in `_cautions`, which is the documented rule.)

**Replacement sentence.** Every Tier 1 allele frequency in Meyar's Saudi table is taken verbatim from
Table 1 of Goljan et al.; a row-by-row comparison of all 82 alleles against the published table found
no discrepancy in allele name, core variant, variant type, functional status or frequency, and where
the paper contradicts itself — CYP3A5\*3 at 84.5% in Table 1 against 84.7% in the Results text, and six
rare Saudi-specific variants at 1.1% in the abstract against four at 0.67% in the Results — the table
value is used and the conflict is recorded rather than resolved.

**MLA 9 Works Cited fix.**
Goljan, Ewa, et al. "Identification of Pharmacogenetic Variants from Large Scale Next Generation
Sequencing Data in the Saudi Population." *PLOS ONE*, vol. 17, no. 1, 2022, article e0263137,
https://doi.org/10.1371/journal.pone.0263137.

Goljan, Ewa, et al. "Large-Scale Next Generation Sequencing Based Analysis of *SLCO1B1*
Pharmacogenetics Variants in the Saudi Population." *Human Genomics*, vol. 18, 2024, article 30,
https://doi.org/10.1186/s40246-024-00594-9.

---

### Item 14 — Alshabeeb et al. 2025

**Claim.** 38 vs 37 variants; the platform is the Axiom Precision Medicine Diversity Array (not
PharmacoScan); "26 of 37 zero-frequency variants"; n = 95; and the array/PharmCAT VCF
untested-position mechanism.

**Verdict.** VERIFIED for the first four; the untested-position mechanism is STILL UNVERIFIED and must
stay labelled "mechanism hypothesis".

**Evidence.** Publisher JATS XML of PMC12078325 (*Frontiers in Pharmacology* 16 (2025), article
1559399; DOI 10.3389/fphar.2025.1559399; PMID 40376268). Abstract, verbatim: "DNA samples from 95
unrelated healthy Saudi participants were genotyped using the Affymetrix Axiom Precision Medicine
Diversity Array. Thirty-eight variants in 15 pharmacogenes were analyzed based on their clinical
relevance and lack of previous reporting in Saudi populations. … Twenty-six of the 37 tested markers
were undetected in the cohort." Results, verbatim: "Of the 37 tested markers, 26 were found to be not
inherited by the examined participants." Methods: "The samples were genotyped using the 10x Affymetrix
Axiom™ Precision Medicine Diversity Array (PMDA) Plus Kit designed by Thermo Fisher Scientific, United
States, (catalog number 951961)." So 38 vs 37 is the paper's own inconsistency (38 selected for
analysis, results reported for 37 tested markers), not a reporting error downstream. PharmacoScan is
the platform of the *other* Saudi paper (Bakheet et al. 2025, item 12) and must not be attributed here.

On untested positions, the paper's only statement is about detection limits, not VCF representation:
"three key limitations emerged: 1) its coverage is limited to pre-designed probes (fails to detect
novel variants), 2) covers <5% of regulatory regions, and 3) unable to detect structural variants
larger than 50 kilobases (kb)". It says nothing about how an array export represents an untested
position in a VCF, so that step of the argument has no source in this paper.

**Replacement sentence.** In a cohort of 95 unrelated healthy Saudis genotyped on the Affymetrix Axiom
Precision Medicine Diversity Array, 38 variants across 15 pharmacogenes were selected for analysis and
26 of the 37 tested markers were undetected, which shows how much of a European-derived marker list
can be uninformative in a Saudi sample; how an array's untested positions are then represented in an
exported VCF is a mechanism we state as a hypothesis, since the paper reports only that the array's
"coverage is limited to pre-designed probes" (Alshabeeb et al. 1559399).

**MLA 9 Works Cited fix.**
Alshabeeb, Mohammad A., et al. "Unveiling the Heritability of Selected Unexplored Pharmacogenetic
Markers in the Saudi Population." *Frontiers in Pharmacology*, vol. 16, 2025, article 1559399,
https://doi.org/10.3389/fphar.2025.1559399.

---

### Item 15 — Alshabeeb et al. 2022 (31.3%)

**Claim.** The 31.3% figure has the denominator 561,150 / 1,790,910 and is a share of exposure records,
not a prevalence.

**Verdict.** VERIFIED.

**Evidence.** Publisher JATS XML of PMC9508627 (*Saudi Pharmaceutical Journal* 30, no. 8 (2022),
pp. 1181–1192; DOI 10.1016/j.jsps.2022.06.013; PMID 36164570). Table 2 ("Number of patients on various
PGx drugs prescribed at MNGHA medical canters during 2015–2021") total row, verbatim:
"Total (%) 379,395 (21.14) 521,948 (29.14) 561,150 (31.33) 328,417 (18.34) 958,500 (53.52) 832,410
(46.48) 1,790,910 (100)". The 1,790,910 is the sum of per-drug patient counts across 78 drugs, i.e.
drug-exposure records with patients counted once per drug, not unique patients. The prose confirms the
unit: "Subgrouping of the patients into various age groups indicated a higher consumption of PGx drugs
by patients aged ≥45–64 years, then the younger adults (≥25-44 years); 31.3% and 29.1%, respectively."
Unique-patient figures in the same paper are different quantities: "The screened patients were
1,483,905. Patients on PGx drugs accounted for 46.7% (n = 693,077 patients)." A third denominator
appears in the gene table — "Total prescribed items 2,126,973" — so the paper carries two different
exposure totals and the 31.3% belongs to the 1,790,910 one.

**Replacement sentence.** In a seven-year record review at Ministry of National Guard Health Affairs
facilities, 693,077 of 1,483,905 screened patients (46.7%) were prescribed at least one of 78
pharmacogenetic drugs, and patients aged 45–64 accounted for 561,150 of 1,790,910 drug-exposure records
(31.3%) — a share of exposure records, counted once per patient per drug, not a population prevalence
(Alshabeeb et al. 1181–92).

**MLA 9 Works Cited fix.**
Alshabeeb, Mohammad A., Mesnad Alyabsi, and Bien Paras. "Prevalence of Exposure to Pharmacogenetic
Drugs by the Saudis Treated at the Health Care Centers of the Ministry of National Guard." *Saudi
Pharmaceutical Journal*, vol. 30, no. 8, 2022, pp. 1181–92,
https://doi.org/10.1016/j.jsps.2022.06.013.

---

### Item 16 — Burden figures

#### 16a. Saudi statin and clopidogrel volumes — CORRECTED (a primary Saudi figure exists; use it)

**Evidence.** Alshabeeb et al. 2022, Table 2 (same XML as item 15), per-drug total patient columns,
verbatim: atorvastatin "137,957 (7.70)"; clopidogrel "30,037 (1.68)"; simvastatin "25,185 (1.41)";
warfarin "8,272 (0.46)"; aspirin "121,699 (6.80)". Gene table: "SLCO1B1 Atorvastatin, Rosuvastatin,
Simvastatin 3 195,651 9.20" and "CES1 Clopidogrel 1 30,037 1.41".

**Replacement sentence.** Within one Saudi health system over 2015–2021, 137,957 patients were
prescribed atorvastatin, 25,185 simvastatin and 30,037 clopidogrel, so the statin and antiplatelet
exposure that pharmacogenomics acts on is already counted in the hundreds of thousands at a single
provider (Alshabeeb et al. 1181–92).

**MLA 9.** As item 15.

#### 16b. Annual Saudi PCI counts — STILL UNVERIFIED

No primary national registry page or report giving an annual PCI volume for Saudi Arabia could be
opened. The Saudi Arabian Cardiac Interventional Society / ACC CathPCI partnership announcements
describe pilot participation only and publish no volumes. **Do not state a national PCI count.**
Replacement sentence: "No national annual figure for percutaneous coronary interventions in Saudi
Arabia was found in a primary registry source as of 24 Nov 2026; the paper therefore gives no PCI
volume."

#### 16c. Aseer diabetes / CVD prevalence — STILL UNVERIFIED

No population-based Aseer-specific diabetes or cardiovascular prevalence estimate was obtainable from a
primary source. **Drop any Aseer diabetes or CVD prevalence number.** Replacement sentence: "We found
no published population-based diabetes or cardiovascular prevalence figure specific to the Aseer
region, which is itself part of the gap this work addresses."

#### 16d. Older-adult polypharmacy, incl. "50% Riyadh polypharmacy" — DROPPED

No primary study reporting ~50% polypharmacy among older adults in Riyadh was found; the figures that
do exist use different definitions (four or more vs five or more medicines) and different settings, so
they are not interchangeable. **Remove the "50% Riyadh polypharmacy" claim entirely**, per the project's
own killed-claims rule. Replacement sentence: "We make no polypharmacy prevalence claim: the Saudi
studies we could open use incompatible definitions and settings, so no single figure is defensible."

#### 16e. Saudi ADR cost and the "ISPOR US$61bn" figure — DROPPED, and the attribution is wrong

**Evidence.** The figure traces to a conference abstract, not a peer-reviewed paper, and it is about
Saudi Arabia, not the United States: Alomi YA, Al-Shaibani AS, Alfaisal G, Alasmi NM, "Cost Analysis of
Drug-Related Problems in Saudi Arabia, Patient and Health Care Professional's Perspective", ISPOR
Europe 2017 (Glasgow), code PHP101, published in *Value in Health* 20, no. 9 (Oct 2017),
https://www.ispor.org/heor-resources/presentations-database/presentation/ispor-20th-annual-european-congress/cost-analysis-of-drug-related-probelms-in-saudi-arabia-patient-and-health-care-professionals-perspective.
Verbatim: "The total estimated cost of drug-related problems was (60,996,726,906.27 USD) annually in
Saudi Arabia", from a four-month electronic questionnaire "distributed through social media" with 201
respondents, alongside per-year averages of "(63,728.53 USD)" for health care providers and
"(888,433.24 USD)" for the public.

**Verdict.** DROPPED. The number is a conference-abstract extrapolation from 201 self-selected online
respondents, and calling it a US figure is a misattribution. Replacement sentence: "We give no monetary
estimate of the adverse-drug-reaction burden: the only Saudi figure we could trace is a 2017 conference
abstract extrapolated from 201 self-selected online respondents, which cannot carry a cost claim."
(`docs/research/04-dont-claim.md:11` already states this correctly.)

#### 16f. Aseer stroke 57.64 per 100,000 — VERIFIED, with the qualifier the report must keep

**Evidence.** Publisher JATS XML of PMC5858284 (*International Journal of Environmental Research and
Public Health* 15, no. 2 (2018), article 215; DOI 10.3390/ijerph15020215; PMID 29373563). Abstract,
verbatim: "All first-stroke patients admitted to all hospitals in the Aseer region over a one-year
period (January through December 2016) were included. … The present study included 1249 first-time
stroke patients and calculated an overall minimal incidence rate of hospitalized first-time stroke of
57.64 per 100,000 persons per year (95% CI: 57.57–57.70)." Results: "Taking into consideration the last
reported Aseer region population of 2,166,983 [9], this figure gave us an overall minimal incidence
rate of hospitalized first-time stroke of 57.64 per 100,000 person per year". Table 1 total row:
"776/1,184,460 65.52 (65.1–66.0) * 473/982,523 48.14 (48.04–48.24) * 1249/2,166,983 57.64
(57.57–57.70)".

**Replacement sentence.** A one-year review of every hospital in the Aseer region recorded 1,249
first-ever strokes in a population of 2,166,983, a minimal hospitalised first-stroke incidence of 57.64
per 100,000 persons per year (95% CI 57.57–57.70) — a hospitalised-case floor, not a community
incidence rate (Alhazzani et al. 215).

**MLA 9 Works Cited fix.**
Alhazzani, Adel A., et al. "Study of Stroke Incidence in the Aseer Region, Southwestern Saudi Arabia."
*International Journal of Environmental Research and Public Health*, vol. 15, no. 2, 2018, article 215,
https://doi.org/10.3390/ijerph15020215.

#### 16g. Repo correction that falls out of 16f

`docs/research/04-dont-claim.md:20` says the figure comes from "a single 2016 study with no stated
sample size". The study is a 2018 publication of 2016 admissions and it states its sample size
(n = 1,249) and denominator (2,166,983). The sentence should say instead: "Aseer's 57.64/100,000 is a
hospitalised first-stroke rate from one region-wide year (n = 1,249; Alhazzani et al. 2018), so it is a
floor, not a community incidence — do not headline it."

---

### Item 17 — Gulf context

**(a) Emirati Genome Program count — CORRECTED to an official figure with its date.**
Primary government source: Abu Dhabi Media Office, "Khaled bin Mohamed bin Zayed chairs Emirates
Genome Council meeting", 14 March 2025
(`https://www.mediaoffice.abudhabi/en/crown-prince-news/khaled-bin-mohamed-bin-zayed-chairs-emirates-genome-council-meeting-march-2025/`),
which states the programme "has collected more than 700,000 genetic samples from citizens across the
nation" towards "the overall target of 1 million", and "has completed the collection of 100,000 samples
from participants from different nationalities". An earlier release from the same office (23 June 2023)
states "To date, the EGP has analysed data of more than 440,000 citizens". Samples collected and
genomes analysed are different quantities and must not be merged; press totals of 750,000–800,000+ are
media reports and were not used.

**Replacement sentence.** The Emirati Genome Programme had collected more than 700,000 genetic samples
from citizens against a one-million target as of March 2025, with a further 100,000 samples from
residents of other nationalities (Abu Dhabi Media Office).

**MLA 9.** Abu Dhabi Media Office. "Khaled bin Mohamed bin Zayed Chairs Emirates Genome Council Meeting
and Approves Framework for Advancing Personalised and Preventive Medicine." *Abu Dhabi Media Office*,
14 Mar. 2025,
www.mediaoffice.abudhabi/en/crown-prince-news/khaled-bin-mohamed-bin-zayed-chairs-emirates-genome-council-meeting-march-2025/.

**(b) Saudi Genome Program count — STILL UNVERIFIED.**
The Vision 2030 project page returned HTTP 403 and no KACST or Saudi Genome Program page giving a
sequenced-genome count could be opened; the figures in circulation (a 100,000-genome target, ~56,000
sequenced as of April 2022) come from third-party tables and news reports. **State no Saudi Genome
Program total.** Replacement sentence: "We quote no running total for the Saudi Genome Program, because
no official page stating one could be opened; what is citable is the Saudi Human Genome Program cohort
actually published — 9,961 exomes and 1,928 pharmacogenomic panels, 11,889 unrelated Saudi nationals
sequenced between 2015 and 2019 (Goljan et al. e0263137)."

**(c) Qatar — the comparator is published; cite the journal article, never a preprint.**
The Qatar population pharmacogenomics study exists in final published form: Jithesh PV et al., "A
population study of clinically actionable genetic variation affecting drug response from the Middle
East", *npj Genomic Medicine* 7 (2022), article 10, DOI 10.1038/s41525-022-00281-5, PMID 35169154
(confirmed in the Europe PMC bibliographic record and cited as reference 22 by the peer-reviewed
Goljan 2024 SLCO1B1 paper). Any medRxiv preprint citation for Qatar figures should be replaced by this
article, or the figure dropped if it is not in it. Note the Qatar statin comparator used in item 13 is
reported by Goljan et al. 2024 as "47.61% versus 32.37%".

**MLA 9.** Jithesh, Puthen V., et al. "A Population Study of Clinically Actionable Genetic Variation
Affecting Drug Response from the Middle East." *npj Genomic Medicine*, vol. 7, 2022, article 10,
https://doi.org/10.1038/s41525-022-00281-5.

---

### Item 18 — G6PD

**(a) The 25% figure is Al-Ahsa (hospitalised children, Eastern Province) — VERIFIED.**
Publisher JATS XML of PMC7704170 (*Cureus* 12, no. 10 (2020), article e11235; DOI
10.7759/cureus.11235; PMID 33269163). Abstract, verbatim: "This is a 10-year retrospective study of
children who were screened for G6PD deficiency during their hospitalization between January 2008 to
December 2017. … A total of 48,889 patients were screened which included 27,634 (56.5%) males and
21,255 (43.5%) females with a mean age of 1.93 + 3.98 years. The overall prevalence of G6PD deficiency
was 25%, whereas it was 33.8% in the male subset and 13.2% in the female subset." All author
affiliations are Al-Ahsa (Maternity and Children Hospital and the Hereditary Blood Diseases Center), and
the title places it in "Eastern Saudi Arabia". The newborn subset was 18.8% (n = 25,628). The repo
statement at `docs/research/02-saudi-genetics.md:24` ("48,889 children, 33.8% of males") is accurate.

**(b) No published Aseer G6PD figure — VERIFIED as "none found".**
No Aseer-specific G6PD prevalence study surfaced in searching, and the Albagshi paper's own comparators
are Jizan, the Eastern Province and Riyadh. Keep the negative phrasing with a date.

**(c) Saudi premarital screening does not include G6PD — VERIFIED from the MoH page.**
Ministry of Health (Saudi Arabia), "Premarital Screening",
`https://www.moh.gov.sa/en/HealthAwareness/EducationalContent/PublicHealth/Pages/PremaritalScreening.aspx`
(opened 24 Nov 2026), names only "genetic blood diseases" — "sickle-cell anemia (SCA) and Thalassemia"
— and infectious diseases "hepatitis B, C and HIV". G6PD is not mentioned anywhere on the page. One
caveat to respect: the page introduces the list with "such as", so the honest claim is that the MoH page
names these conditions and does not mention G6PD, not that the ministry has published an exhaustive
list. The further repo claim at `docs/research/04-dont-claim.md:4` that "G6PD appears only in the
separate non-Saudi-spouse panel" was NOT verified from any MoH page and should be dropped or marked
unverified.

**Replacement sentence.** The 25% G6PD-deficiency figure often quoted for the south is not an Aseer
figure: it comes from 48,889 children screened during hospitalisation in Al-Ahsa, Eastern Province,
between 2008 and 2017, where overall deficiency was 25% (33.8% of males, 13.2% of females), and no
published Aseer figure was found as of 24 Nov 2026; the Ministry of Health's premarital screening page
names sickle-cell anaemia, thalassaemia, hepatitis B, hepatitis C and HIV and does not mention G6PD, so
premarital screening cannot be treated as a source of G6PD status (Albagshi et al. e11235; Saudi
Arabia, Ministry of Health).

**MLA 9 Works Cited fix.**
Albagshi, Muneer H., et al. "Prevalence of Glucose-6-Phosphate Dehydrogenase Deficiency Among Children
in Eastern Saudi Arabia." *Cureus*, vol. 12, no. 10, 2020, article e11235,
https://doi.org/10.7759/cureus.11235.

Saudi Arabia, Ministry of Health. "Premarital Screening." *Ministry of Health*, 24 Nov. 2026,
www.moh.gov.sa/en/HealthAwareness/EducationalContent/PublicHealth/Pages/PremaritalScreening.aspx.

---

### Item 19 — 1000 Genomes contains no Saudi or Gulf population

**Verdict.** VERIFIED.

**Evidence.** The 1000 Genomes Project phase 3 sample panel, downloaded from the project's own data
release on the IGSR/EBI FTP site:
`https://ftp.1000genomes.ebi.ac.uk/vol1/ftp/release/20130502/integrated_call_samples_v3.20130502.ALL.panel`
(opened 24 Nov 2026). It lists 2,504 samples in exactly 26 populations across five superpopulations:
AFR — ACB, ASW, ESN, GWD, LWK, MSL, YRI; AMR — CLM, MXL, PEL, PUR; EAS — CDX, CHB, CHS, JPT, KHV; EUR —
CEU, FIN, GBR, IBS, TSI; SAS — BEB, GIH, ITU, PJL, STU. No Saudi, Gulf, Arab or Middle Eastern
population appears, and there is no Middle Eastern superpopulation.

**Replacement sentence.** The 1000 Genomes Project's phase 3 panel covers 2,504 individuals in 26
populations grouped into African, American, East Asian, European and South Asian superpopulations, with
no Saudi, Gulf or other Middle Eastern population among them, so a frequency taken from it is never a
Saudi frequency (1000 Genomes Project Consortium).

**MLA 9 Works Cited fix.**
1000 Genomes Project Consortium. "Integrated Call Samples, Phase 3 Release 20130502." *International
Genome Sample Resource*, EMBL-EBI, 24 Nov. 2026,
ftp.1000genomes.ebi.ac.uk/vol1/ftp/release/20130502/integrated_call_samples_v3.20130502.ALL.panel.

---

### Item 20 — Other star-allele callers and population frequency

**Claim under test (as written at `docs/research/04-dont-claim.md:8`): "Star-allele callers do not
generally use population allele frequency to resolve ambiguous diplotypes … Aldy 4, Cyrius and
Astrolabe do not either."**

**Verdict.** CORRECTED — true for Aldy, Cyrius, Astrolabe and PyPGx/Stargazer, but **false for PAnno**,
which uses population frequency by design. The word "generally" must stay, and PAnno must be named as
the exception.

**Evidence, tool by tool (all from each tool's own repository or documentation).**

- **Aldy 4** — `https://raw.githubusercontent.com/0xTCG/aldy/master/README.rst`. Aldy reports multiple
  optimal solutions instead of choosing one: "By default, Aldy only reports solutions with the maximum
  confidence"; the sample output shows "#Solution 1: \*1.001, \*4, \*4.021" and "#Solution 2: \*4, \*4,
  \*139.001"; and it exposes a setting whose description is "Warning level when multiple optimal
  solutions are found. … If set to 2, Aldy will also warn if multiple optimal major star-allele
  solutions are found." No population allele frequency appears in the documentation. VERIFIED.
- **Cyrius** — `https://raw.githubusercontent.com/Illumina/Cyrius/master/README.md`. Verbatim:
  "`More_than_one_possible_genotype`: In rare cases, Cyrius reports two possible genotypes for which it
  cannot distinguish one from the other. These are different sets of star alleles that result in the
  same set of variants that cannot be phased with short reads, e.g. \*1/\*46 and \*43/\*45. The two
  possible genotypes are reported together, separated by a semicolon." It reports the ambiguity rather
  than resolving it by frequency. VERIFIED.
- **Astrolabe (published as Constellation)** — Twist et al., *npj Genomic Medicine* 1 (2016), article
  15007, `https://www.nature.com/articles/npjgenmed20157`. Verbatim: "A probabilistic scoring system
  was developed to determine the most likely diplotype match to the WGS-derived .vcf file (V t) of a
  test sample, t, based on prior computation of all theoretical haplotypes and corresponding functional
  alleles (as defined by the Human P450 Nomenclature Committee)" and "The output is the most likely
  diplotype for that sample." The score is a variant-match score over theoretical haplotypes, not a
  population frequency — but note that, unlike Aldy and Cyrius, Astrolabe emits a single most-likely
  diplotype rather than all candidates. VERIFIED, with that nuance. No public user documentation exists
  (distribution is registration-gated via Children's Mercy), so the method paper is the only primary
  source.
- **PyPGx (the maintained successor to Stargazer, same author)** —
  `https://raw.githubusercontent.com/sbslee/pypgx/master/README.rst` and the `sort_alleles` docstring in
  `pypgx/api/core.py`. PyPGx lists every candidate star allele per haplotype and ranks them by a
  documented, frequency-free priority: "alleles are sorted by the following order: 1. allele function
  (e.g. 'No Function' > 'Normal Function'), 2. number of core variants …, 3. number of core variants
  that impact protein coding …, and 4. reference allele status". It also surfaces phasing uncertainty in
  an `AlternativePhase` column: "List of star alleles that could be missed due to potentially incorrect
  statistical phasing." One honest qualification: its phasing step is statistical —
  "estimate-phase-beagle  Estimate haplotype phase of observed variants with the Beagle program" — and
  Beagle phases against a population reference haplotype panel, so population haplotype data enters the
  phasing, even though no diplotype is ever chosen by allele frequency. VERIFIED with that
  qualification.
- **PAnno** — `https://raw.githubusercontent.com/PreMedKB/PAnno/main/README.md`, verbatim: "A ranking
  model dedicated to inferring diplotypes, developed based on the **allele (haplotype) definition** and
  **population frequency**, was introduced in PAnno." This is explicit frequency-based diplotype
  inference. CORRECTION required: PAnno is a counter-example and must not be grouped with the others.

**Replacement sentence.** Star-allele callers do not generally break diplotype ties by population
frequency: Aldy reports every maximum-confidence solution and warns "if multiple optimal major
star-allele solutions are found", Cyrius reports the alternatives together — "In rare cases, Cyrius
reports two possible genotypes for which it cannot distinguish one from the other … reported together,
separated by a semicolon" — Astrolabe scores a sample against all theoretical haplotypes to pick "the
most likely diplotype match", and PyPGx ranks candidates by allele function and core-variant count
while flagging alternative phases; the clear exception is PAnno, whose own documentation describes "a
ranking model dedicated to inferring diplotypes, developed based on the allele (haplotype) definition
and population frequency", which is exactly the silent frequency-based selection Meyar refuses to ship.

**MLA 9 Works Cited fix.**
Twist, Greyson P., et al. "Constellation: A Tool for Rapid, Automated Phenotype Assignment of a Highly
Polymorphic Pharmacogene, *CYP2D6*, from Whole-Genome Sequences." *npj Genomic Medicine*, vol. 1, 2016,
article 15007, https://doi.org/10.1038/npjgenmed.2015.7.

*Aldy: Allelic Decomposition and Exact Genotyping of Highly Polymorphic and Structurally Variant
Genes*. GitHub, 24 Nov. 2026, github.com/0xTCG/aldy. README.rst.

Illumina. *Cyrius: WGS-Based CYP2D6 Genotyper*. GitHub, 24 Nov. 2026, github.com/Illumina/Cyrius.
README.md.

*PyPGx*. GitHub, 24 Nov. 2026, github.com/sbslee/pypgx. README.rst and `pypgx/api/core.py`.

*PAnno*. GitHub, 24 Nov. 2026, github.com/PreMedKB/PAnno. README.md.

(The Aldy, PyPGx and PAnno entries are deliberately title-first: this verification read each
repository's documentation, and I did not open a source that establishes the personal author names, so
none are asserted here. If the paper's Works Cited prefers the corresponding journal articles, those
must be opened and cited in their place.)

---

### Repo statements that state one of these claims wrongly

Scope grepped: `docs/`, `tables/`, `passport/src/i18n`, `docs/poster`.

| File:line | What it says | Why it is wrong | Fix |
|---|---|---|---|
| `tables/saudi_frequencies.json:4` (`_coverageStatement`) | "Genes without published Saudi allele frequencies (Tier 2, such as SLCO1B1) return null risk" | A published Saudi SLCO1B1 frequency set exists, from the same group and cohort: Goljan et al., *Human Genomics* 18 (2024), article 30, reports \*15 at 24.7%, \*20 8.04%, \*14 5.86%, \*5 3.84%, \*31 0.21%, \*9 0.03% and 47.6% actionable phenotypes. SLCO1B1 is the one gene that must not be the Tier 2 example. | Replace the parenthetical with a gene that genuinely has no published Saudi frequency, and either promote SLCO1B1 to Tier 1 citing the 2024 paper or state explicitly that a Saudi SLCO1B1 frequency exists but is out of scope for this prototype's table. |
| `docs/saudi-data-confidence.md:21` | "Print 'No published Saudi frequency for this gene' and return a null score" in a section whose Tier 2 example elsewhere is SLCO1B1 | Same defect: the doc's Tier 2 framing is used for SLCO1B1 at `tables/saudi_frequencies.json:4`, while `docs/research/02-saudi-genetics.md:10` already cites the Saudi SLCO1B1 47.6% figure — the repo contradicts itself. | Name the Saudi SLCO1B1 paper in the Tier 1 list or add a line stating why it is not loaded, so the two documents agree. |
| `docs/research/02-saudi-genetics.md:19` | "Carriers of ≥1 actionable variant \| 99.2% of 11,889 Saudis (SHGP, 8 genes)" | Wrong denominator. Goljan et al. 2022 Results: "Of the 1928 Saudi individuals (genotyped using the PGx gene panel), 99.2% carry at least one actionable PGx allele, with a maximum of 5 detected in 1.1% of the population." The 99.2% is of the 1,928 panel subset, not of 11,889. | "99.2% of the 1,928 panel-genotyped Saudis (SHGP, 8 genes)". |
| `docs/research/04-dont-claim.md:20` | "Aseer's 57.64/100,000 stroke incidence is a single 2016 study with no stated sample size." | The study states its sample size and denominator — "1249/2,166,983 57.64 (57.57–57.70)" (Table 1) — and was published in 2018 on 2016 admissions; what the figure actually lacks is community coverage, since it is a "minimal incidence rate of hospitalized first-time stroke". | "Aseer's 57.64/100,000 (95% CI 57.57–57.70) is a hospitalised first-stroke rate from one region-wide year, n = 1,249 of 2,166,983 (Alhazzani et al. 2018) — a floor, not community incidence. Not a headline." |
| `docs/research/04-dont-claim.md:4` | "G6PD appears only in the separate non-Saudi-spouse panel" | Not verifiable from any MoH page opened; the MoH premarital screening page does not mention G6PD at all, in any panel, and introduces its list with "such as". | Keep the verified part ("It screens sickle cell, thalassaemia, HBV, HCV, HIV; the MoH premarital screening page does not mention G6PD, checked 24 Nov 2026") and delete the non-Saudi-spouse-panel assertion until a primary page supports it. |
| `docs/sources.md:7` | "Ages 45–64 peak exposure band, 31.3% \| see EN detail doc, 'Burden and target population'" | The source column points at an internal document, not a citation, which breaks the project's own rule that every number has a citable row. The primary source is now verified. | "Alshabeeb MA, Alyabsi M, Paras B. Saudi Pharm J 2022;30(8):1181–1192, doi:10.1016/j.jsps.2022.06.013, Table 2 (561,150 of 1,790,910 drug-exposure records, MNGHA 2015–2021)". The same fix pattern applies to `docs/sources.md:5`, `:6` and `:8`, which also cite only "EN detail doc"; `:8` ("26 of 37 … zero frequency") should cite Front Pharmacol 2025;16:1559399, doi:10.3389/fphar.2025.1559399. |
| `docs/sources.md:43` | PREPARE row cites "figures as reported by GenomeWeb and News-Medical (Feb 2023)" | Secondary aggregators, not the Lancet paper; outside C2's scope (it is C1 item 1) but it is the same defect class and is flagged here for completeness. | Cite Swen JJ et al., Lancet 2023;401:347–356 directly once C1 verification lands. |

No wrong statement of items 12–20 was found in `passport/src/i18n` or `docs/poster`: neither carries
any of these figures. `docs/research/02-saudi-genetics.md:5` ("26 of 37 imported markers had MAF = 0 …
n=95") and `:24` ("48,889 children, 33.8% of males") are accurate against the primary sources, as is
`tables/saudi_frequencies.json:7` on the 84.5%/84.7% discrepancy.


---

## C3–C4. Technology, standards, regulation, hardware, hackathon (items 21–36)

Run on 24 Nov 2026, Claude Code (Opus 5.5). The repo `D:\meyar-main\meyar-main` was on branch `review/final-2026-11-24` (HEAD 271a97c) and was only read: no edits, no commits. I re-read `docs/sources.md`, `engine/validation/results.md`, `docs/qr-envelope.md`, `docs/structural-variants.md`, `docs/cpic-signoff.md` and `tables/*.json` at that HEAD. None of them changed between `9784cfb` (main) and HEAD.
The probe scripts are in this scratchpad: `cards_probe.mjs`, `qr_probe.mjs`, `latency_probe.mjs`. Downloaded primary sources are in `web/`.
Host: Node v24.18.0 (the pin is Node 22 LTS; the cds Dockerfile uses node:22-alpine) and Docker 29.6.2. The compose stack (HAPI 8080, CDS 3000) was already running, started by another process.

Verdicts: VERIFIED = I opened the primary source and quote it. CORRECTED = the true value from a primary source. TESTED = I ran it in this repo. DROPPED = cannot be verified, so remove it. STILL UNVERIFIED = the primary source was not reachable.

---

### Table

| # | Claim | Verdict | Evidence (quote + URL, or command + output) | Ready-to-paste sentence for the paper | MLA 9 Works Cited fix |
|---|---|---|---|---|---|
| 21a | `pgkb/pharmcat:3.4.0` exists on Docker Hub | VERIFIED + TESTED | `curl https://hub.docker.com/v2/repositories/pgkb/pharmcat/tags/3.4.0` → `"name":"3.4.0"`, `"last_updated":"2026-07-14T02:36:22Z"`, amd64 + arm64 images. The tag list gives 3.4.0 index digest `sha256:bc498d55…0e5319`, the same digest as `latest`. `docker image inspect pgkb/pharmcat:3.4.0` → `sha256:bc498d55c33094002bd7e14221a6b3fcd7243a587675369bc1a5ecf6ac0e5319 2026-07-14T01:29:42Z [pgkb/pharmcat@sha256:bc498d55…]`. The local image matches the Hub digest, so no pull was needed. | "Meyar runs PharmCAT 3.4.0 from the official Docker image `pgkb/pharmcat:3.4.0` (published 14 July 2026; digest sha256:bc498d55…), command-line only, in batch." | "pgkb/pharmcat." *Docker Hub*, tag 3.4.0, 14 July 2026, hub.docker.com/r/pgkb/pharmcat. Accessed 24 Nov. 2026. |
| 21b | PharmCAT is "research-only partly because of no-call behaviour" | CORRECTED | The Disclaimers page says: "The user recognizes that PharmCAT is a research tool and that they are using PharmCAT at their own risk." Separately: "PharmCAT does not assume any reference calls for positions missing from the submitted VCF file; all missing queried positions are not considered in the allele determination process." The page states both facts but never links them as cause and effect. https://pharmcat.clinpgx.org/Disclaimers/ | "PharmCAT describes itself as 'a research tool', and its disclaimers state that it 'does not assume any reference calls for positions missing from the submitted VCF file'; missing positions 'might alter the assigned genotype and subsequent phenotype prediction'." | "Disclaimers and Other Information." *PharmCAT*, Stanford U and U of Pennsylvania, pharmcat.clinpgx.org/Disclaimers/. Accessed 24 Nov. 2026. |
| 21c | bcftools 1.24 recommended | VERIFIED | Setup page: "bcftools >= v1.18 (1.24 recommended) htslib >= v1.18 (for bgzip, 1.24 recommended)". https://pharmcat.clinpgx.org/using/Setup-PharmCAT/ | "PharmCAT requires bcftools 1.18 or later and recommends 1.24, the version Meyar pins." | "Setup PharmCAT." *PharmCAT*, pharmcat.clinpgx.org/using/Setup-PharmCAT/. Accessed 24 Nov. 2026. |
| 21d | Flags documented as DANGEROUS, and the repo never uses them | VERIFIED + TESTED | Running-PharmCAT-Pipeline and VCF-Preprocessor pages list exactly three flags. `-0, --missing-to-ref`: "Assume genotypes at absent or unspecified PGx sites are "0/0". DANGEROUS!" `--absent-to-ref`: "Assume genotypes at absent PGx sites are "0/0". DANGEROUS!" `--unspecified-to-ref`: "Assume unspecified genotypes ("./.") as "0/0" when every sample is "./.". DANGEROUS!" A related non-default mode, `-research` (Research-Mode page: "not intended for use outside a research context"), is not labelled DANGEROUS. Repo grep: `grep -rnE "(-0\|--missing-to-ref\|--absent-to-ref\|--unspecified-to-ref\|-research)" engine/*.sh engine/*.py engine/validation/*.py docker-compose.yml cds/*.js` → only false positives (`${FHIR:-0}`, LOINC `48002-0`). The actual PharmCAT calls are `engine/run_pharmcat.sh:38-65` (`pharmcat_pipeline [-matcher] -o …`; `pharmcat.jar -phenotyper -reporter -pi … -po … -bf … -reporterHtml`) and `run_validation.py:146-157` (`pharmcat_pipeline -g CYP2C19,CYP2C9 -o …`). None of them carries a DANGEROUS flag or `-research`. Guard test: `engine/tests/test_sv_gate.py:228-232`. | "PharmCAT documents three preprocessor flags (`--missing-to-ref`/`-0`, `--absent-to-ref`, `--unspecified-to-ref`) as 'DANGEROUS!' because they turn untested positions into reference calls; Meyar never passes any of them, nor the `-research` mode." | "Running PharmCAT Pipeline." *PharmCAT*, pharmcat.clinpgx.org/using/Running-PharmCAT-Pipeline/. Accessed 24 Nov. 2026. |
| 21e | StellarPGx statement | VERIFIED | Calling-CYP2D6 page: "For demonstration purposes, we are using StellarPGx, which supports calling CYP2D6 with structural variants and CNV from whole genome sequencing (WGS) CRAM/BAM files" and "Please note we are not affiliated with the StellarPGx team and offer no guarantees about its performance." The quotes at `docs/structural-variants.md:15,19,23,27,57,61,65` match the live pages word for word, including "the large influence of structural variation (SV) and copy number variation (CNV) on inferring CYP2D6 phenotype". | "PharmCAT does not recommend calling CYP2D6 from VCF and names StellarPGx, run on whole-genome CRAM/BAM, for demonstration only; Meyar does not run StellarPGx." | "Calling CYP2D6." *PharmCAT*, pharmcat.clinpgx.org/using/Calling-CYP2D6/. Accessed 24 Nov. 2026. |
| 21f | "as arbitrary as sorting them alphabetically" | VERIFIED | NamedAlleleMatcher 101: "They are assigned scores not because one is better than another, but so that we can consistently pick one over another when necessary since we are only reporting those with the highest score by default. It is as arbitrary as sorting them alphabetically and defaulting to the first one." https://pharmcat.clinpgx.org/methods/NamedAlleleMatcher-101/ | "PharmCAT's own documentation says its tie-break between equally scored diplotypes 'is as arbitrary as sorting them alphabetically and defaulting to the first one', so Meyar shows every candidate." | "NamedAlleleMatcher 101." *PharmCAT*, pharmcat.clinpgx.org/methods/NamedAlleleMatcher-101/. Accessed 24 Nov. 2026. |
| 21g | Pinned demo patients labelled as pinned | TESTED | `head -3 engine/data/in/demo-002.outside.tsv demo-006.outside.tsv` → `# mock: true` / `# source: Mock CNV-aware caller v0.1-demo (StellarPGx-compatible synthetic demo; not run in prototype)` / `CYP2D6 *1/*1` (resp. `*1/*2x2`). | "Demo CYP2D6 results are pinned through PharmCAT's outside-call file and are labelled mock; no VCF was hand-edited." | — |
| 22a | A3 concordance "Exact concordance: 9/10" | TESTED → CORRECTED | I parsed the fresh outputs `engine/validation/data/out/*.match.json`, written 24 Nov 14:37 by the other process; `results.md` was regenerated at the same time and is byte-identical in git. Result: NA07348 2C19 `*2/*17` [1 candidate]; NA07348 2C9 `*1/*1` [1]; NA10831 2C19 `*1/*17` [1]; **NA10831 2C9 `*1/*2`, `*1/*92` [2 tied, score 18]**; **NA11839 2C19 `*1/*38` [1] vs published `*1/*1` → mismatch**; **NA11839 2C9 `*2/*3`, `*2/*18`, `*2/*68`, `*3/*92`, `*18/*92`, `*68/*92` [6 tied, score 2]**; NA18564 2C19 `*2/*3`; NA18564 2C9 `*1/*1`; NA19122 2C19 `*2/*35`; NA19122 2C9 `*1/*11`. **7 unambiguous exact, 2 published diplotype among tied candidates, 1 mismatch.** The breakdown 7/2/1 is confirmed. The label is generated by `run_validation.py:237,244`, which counts every "yes…" row as "Exact". | "Against CDC GeT-RM consensus for 5 samples × 2 genes, PharmCAT 3.4.0 returned the published diplotype as the single call in 7 of 10 comparisons, among tied candidates in 2 (CYP2C9 in NA10831 and NA11839, where untested positions stay no-calls), and a different call in 1 (NA11839 CYP2C19 `*1/*38` vs `*1/*1`, both Normal Metabolizer, explained by later nomenclature)." | — |
| 22b | NA11839 explanation (PharmVar `*1`/`*38` split) | VERIFIED (via CPIC database and GeT-RM paper; PharmVar API needs a key) | PharmVar API → `401 "API Key is invalid or missing"`. CPIC allele definitions: `api.cpicpgx.org/v1/allele_definition?genesymbol=eq.CYP2C19&name=in.(*1,*38)` → `*1 matchesreferencesequence:false`, `*38 matchesreferencesequence:true`. Location `rs3758581` `g.94842866A>G p.I331V`: `*38`=A, `*1`=G. Gaedigk et al. 2022 (PMC9069873): "CYP2C19∗38 is an allele that was designated by PharmVar while this investigation was underway. This allele was called by the tools as CYP2C19∗1, but unlike CYP2C19∗1, CYP2C19∗38 lacks NM_000769.1:c.991A>G, p.Ile331Val, (rs3758581)." Repo VCF: NA11839 at chr10:94842866 = `1\|0` (G\|A). | "NA11839 is heterozygous at rs3758581 (p.I331V); since PharmVar designated CYP2C19*38 (the reference-sequence allele lacking I331V), this genotype is `*1/*38`, which the earlier GeT-RM consensus reported as `*1/*1` (Gaedigk et al. 2022)." | Gaedigk, Andrea, et al. "CYP2C8, CYP2C9, and CYP2C19 Characterization Using Next-Generation Sequencing and Haplotype Analysis: A GeT-RM Collaborative Project." *The Journal of Molecular Diagnostics*, vol. 24, no. 4, 2022, pp. 337–50, https://doi.org/10.1016/j.jmoldx.2021.12.011. |
| 22c | Coriell lists NA11839 CYP2C19 `*1/*1` | STILL UNVERIFIED | The Coriell GeT-RM PGxSearch is a JavaScript application and returned no data to curl. The NA11839 sample page (`coriell.org/0/Sections/Search/Sample_Detail.aspx?Ref=NA11839`) lists only the CYP2C9*3 remark ("heterozygous for an A>C change at nucleotide 1061 … (CYP2C9*3)") and the publications. The value `*1/*1` stands only on the repo's `engine/validation/data/consensus_getrm.json`, which records an access date of 2026-11-21. | Keep: "GeT-RM consensus (Coriell GeT-RM search, accessed 21 Nov 2026) lists NA11839 CYP2C19 as `*1/*1`." Re-open in a browser before submission. | Coriell Institute for Medical Research. "GeT-RM PGx Search." *Coriell*, www.coriell.org/GetRM/PGxSearch. Accessed 21 Nov. 2026. |
| 22d | 1000 Genomes NYGC dataset row in sources | VERIFIED | File in use (from `consensus_getrm.json`): `ftp.1000genomes.ebi.ac.uk/…/20220422_3202_phased_SNV_INDEL_SV/1kGP_high_coverage_Illumina.chr10.filtered.SNV_INDEL_SV_phased_panel.vcf.gz` → HTTP 200, Last-Modified 25 Apr 2022. Paper (PubMed 36055201): Byrska-Bishop M et al., "High-coverage whole-genome sequencing of the expanded 1000 Genomes Project cohort including 602 trios", Cell 2022;185(18):3426-3440.e19, doi:10.1016/j.cell.2022.08.004. | "GRCh38 input genotypes came from the 1000 Genomes Project high-coverage (30×) phased panel produced by the New York Genome Center (Byrska-Bishop et al. 2022)." | Byrska-Bishop, Marta, et al. "High-Coverage Whole-Genome Sequencing of the Expanded 1000 Genomes Project Cohort Including 602 Trios." *Cell*, vol. 185, no. 18, 2022, pp. 3426–40.e19, https://doi.org/10.1016/j.cell.2022.08.004. |
| 22e | "70 of 137 samples" at ENA | CORRECTED (reword) | ENA filereport `PRJEB19931` (read_run) → **70 runs, 70 distinct samples**, all WGS HiSeq X Ten. Study title "Polaris HiSeq X PGx Cohort". The description says "selected NHGRI and NIGMS samples … previously … characterized by the Genetic Testing Reference Materials Coordination Program (GeT-RM)". It does not say "of 137". 137 is the sample count in the title of Pratt et al. 2016. I did not check that all 70 are among those 137. | "ENA study PRJEB19931 (Polaris HiSeq X PGx Cohort) holds 30× WGS for 70 GeT-RM-characterised Coriell samples; Pratt et al. (2016) characterised 137 GeT-RM reference DNAs for 28 pharmacogenes." | European Nucleotide Archive. "Polaris HiSeq X PGx Cohort." Study PRJEB19931, EMBL-EBI, www.ebi.ac.uk/ena/browser/view/PRJEB19931. Accessed 24 Nov. 2026. |
| 22f | Pratt et al. 2016 citation | VERIFIED | PubMed 26621101: Pratt VM, Everts RE, Aggarwal P, Beyer BN, Broeckel U, Epstein-Baak R, Hujsak P, Kornreich R, Liao J, Lorier R, Scott SA, Smith CH, Toji LH, Turner A, Kalman LV. J Mol Diagn 2016;18(1):109-23; doi:10.1016/j.jmoldx.2015.08.005; PMC4695224. The Coriell NA11839 page also cites it. | — | Pratt, Victoria M., et al. "Characterization of 137 Genomic DNA Reference Materials for 28 Pharmacogenetic Genes: A GeT-RM Collaborative Project." *The Journal of Molecular Diagnostics*, vol. 18, no. 1, 2016, pp. 109–23, https://doi.org/10.1016/j.jmoldx.2015.08.005. |
| 22g | Coriell/CDC usage terms; "GeT-RM 363 samples, 34 genes" (`sources.md:9`) | STILL UNVERIFIED | I did not open them. The CDC and Coriell pages were not reached by script (cdc.gov returned 403 to curl). | Remove "363 samples, 34 genes" unless a team member opens the CDC GeT-RM page and records the quote. | — |
| 23a | 2.0 → 2.0.1 changes; newer version? | VERIFIED | Changes page: "CDS Hooks 2.0.1 is an errata release which makes no substantive changes from the CDS Hooks 2.0.0 release, but rather changes the publication's look & feel by moving from a bespoke, project-specific publishing mechanism to the typical HL7 FHIR IG Publisher infrastructure." https://cds-hooks.hl7.org/changes.html. `package-list.json`: 2.0.1 "STU2 Release - Technical Correction 1", date 2025-03-12, `"current": true`; 2.0 dated 2022-08-23. A newer **ballot** exists: "3.0.0-ballot", "R3 Normative Ballot", 2025-12-15, path cds-hooks.hl7.org/2026Jan. It is not a published release. | "Meyar targets CDS Hooks 2.0.1 (HL7 STU 2, technical correction published 12 March 2025, the current published version; it makes no substantive changes from 2.0). A 3.0.0 normative ballot (December 2025) is not yet a release." | HL7 International. *CDS Hooks Specification*. Version 2.0.1, STU 2, 12 Mar. 2025, cds-hooks.hl7.org. Accessed 24 Nov. 2026. |
| 23b | Hook maturity labels | VERIFIED | The hook library v1.0.1 (STU1, generated 2025-03-12) navigation reads: "order-select (4) order-sign (5) patient-view (5) … medication-prescribe (deprecated) order-review (deprecated)". https://cds-hooks.hl7.org/hooks/ | "Meyar uses the `order-sign` hook (maturity 5 in the HL7 CDS Hooks Library 1.0.1); `order-select` (maturity 4) is also offered; `medication-prescribe` is deprecated and not used." | HL7 International. *CDS Hooks Library*. Version 1.0.1, STU 1, 12 Mar. 2025, cds-hooks.hl7.org/hooks/. Accessed 24 Nov. 2026. |
| 23c | `medication-prescribe` mentions | TESTED | `grep -rn medication-prescribe` (excluding prompts/) → only guards and "deprecated" statements: `cds/server.js:56` (`DEPRECATED_HOOK`, rejected with 400), `cds/test/cds.test.js:288,592-596`, `cds/README.md:11`, `AGENTS.md:28`, `docs/research/05-tech-constraints.md:10`, CHANGES/handoffs. No service advertises it. | — | — |
| 23d | Card summary <140 chars; indicator ∈ info/warning/critical | VERIFIED + TESTED | Spec 2.0.1, Card: "summary REQUIRED string One-sentence, <140-character summary message"; "indicator REQUIRED … Allowed values, in order of increasing urgency, are: info, warning, critical." Code: `cds/lib/cards.js:10` `MAX_SUMMARY_LENGTH = 139`, truncates with "…" (`:15-19`); `selectIndicator` (`:57-70`) returns only `info`/`warning` ("Never `critical`", `:56`). `npm test` in cds → **39 pass, 0 fail**. Probe `node cards_probe.mjs` (every fixture patient × all 12 CPIC drugs, order-sign) → `{"cards":36,"maxSummaryLength":139,"indicators":{"info":28,"warning":8}}`. Minor finding: the 139-char case is truncated mid-word ("…tramadol — Greatly reduced O-desmethyltramadol (active metabolite) f…"). | "Every card summary is under 140 characters (longest observed: 139) and the indicator is only `info` or `warning`, never `critical`, matching the CDS Hooks 2.0.1 card rules." | (same as 23a) |
| 23e | Public HAPI snapshot never cited | TESTED | `grep -rn hapi.fhir.org` → only guards (`cds/lib/phenotypes.js:49-54`, test `cds.test.js:617`, `kit/lib/fhir-client.js:2`) and "never depend on" rules. No version of the public server is cited. | — | — |
| 23f | Genes 2026 paper authorship; exact NPHIES sentence | VERIFIED | Crossref 10.3390/genes17091115 and Europe PMC (PMID 42793009, PMC13606155): "A Strategic Implementation Framework for Integrating Pharmacogenomics (PGx) into Personalized Healthcare in Saudi Arabia", Genes 17(9), published 14 Sep 2026. Authors: Kholud R. Alrubaie; Raghad A. Alzaylaee; Latifah A. Alayyaf; Farjah H. Algahtani; Shaker A. Alomary; Abdullah M. Assiri; Mariam M. AlEissa. Alrubaie is first and AlEissa last. The exact sentence (full text via Europe PMC): "NPHIES currently provides health information and financial interoperability functions; its implementation guide does not provide the additional clinical genomic interoperability required for PGx [39]." Ref 39 is the NPHIES "Healthcare Financial Services Implementation Guide, Edition 1, Version 1.0.0", 2025. | "Alrubaie et al. (2026) note that 'NPHIES currently provides health information and financial interoperability functions; its implementation guide does not provide the additional clinical genomic interoperability required for PGx.'" | Alrubaie, Kholud R., et al. "A Strategic Implementation Framework for Integrating Pharmacogenomics (PGx) into Personalized Healthcare in Saudi Arabia." *Genes*, vol. 17, no. 9, 2026, article 1115, https://doi.org/10.3390/genes17091115. |
| 24a | QR payload size, version, ECC | TESTED → CORRECTED | `node --import ./test/register-alias.mjs qr_probe.mjs` (repo `passport/src/qr.js` + `lookup.getDrugsForGene`, the same call `main.js:143-147` makes; PIN 482910). demo-001: raw 540 B → deflate 294 B → **envelope 480 B, QR version 17 (85×85), EC M**. demo-002: 462 → 277 → **457 B, v17, M**. demo-006: 800 → 350 → **554 B, v18 (89×89), M**. `npm --prefix passport test` (41 pass) prints `demo-006+paroxetine … envelope=652B, modules=97, EC=M` (version 20) and `demo-001 … raw=325B, compressed=204B, envelope=360B, modules=73`. That 360 B figure comes from `qr.test.mjs:41`, which encodes **without** `getDrugsFn` (no recommendation keys), so it is not what the app issues. Capacity check (DENSO WAVE table, binary, level M): v17 = 504 B, v18 = 560 B, v20 = 666 B, so all fit. | "On the demo profiles the encrypted QR holds 457–554 bytes (QR version 17–18, error-correction level M); with four current medicines it reaches 652 bytes (version 20)." | — |
| 24b | Module size at printed 28 mm | TESTED | `design/meyar.css:440` sets the SVG (viewBox includes the 4-module quiet zone, `qr.js:298-305`) to 28 mm. v17: 28/93 = **0.301 mm/module**; v18: 28/97 = **0.289 mm**; v20: 28/105 = **0.267 mm**. | "Printed at 28 mm, one QR module is about 0.30 mm (0.27 mm with four medicines)." | — |
| 24c | Decode from raster | TESTED (simulated) | Nearest-neighbour raster of the module grid at 28 mm, decoded with repo `jsqr`, then `decodeQrEnvelope` with the PIN. demo-001/002: 150 dpi no-decode, 200 no-decode, **300 decoded+decrypted, 600 decoded+decrypted**. demo-006: 150 ok, 200 no-decode, 300 ok, 600 ok. Below 300 dpi the result depends on how the grid aligns with the pixels. Decode on screen at each mobile viewport: not run by me (Part B harness). **Physical print and phone scanning: untested.** | "The 28 mm card QR decoded and decrypted from simulated 300 and 600 dpi rasters for every demo profile; physical print-and-phone scanning is untested." | — |
| 24d | QR v40 capacity 2,953 B (L) / 1,273 B (H) | VERIFIED (from the inventor's table; ISO/IEC 18004 is paywalled) | DENSO WAVE "Information capacity and versions of QR Code", version 31-40 table, row "40 177x177", Binary column: L **2,953**, M 2,331, Q 1,663, H **1,273**. https://www.qrcode.com/en/about/version.html (data from `/en/about/versionPage/versionPage31_40.html`). | "A version-40 QR code holds at most 2,953 bytes at error-correction level L and 1,273 bytes at level H (DENSO WAVE)." | DENSO WAVE. "Information Capacity and Versions of QR Code." *QRcode.com*, www.qrcode.com/en/about/version.html. Accessed 24 Nov. 2026. |
| 24e | ID-1 85.60 × 53.98 mm; reconcile 85.68 × 54.02 mm PDF | VERIFIED (via ICAO, which quotes ISO/IEC 7810:2019; iso.org returned 403) | ICAO Doc 9303 Part 5 (8th ed., 2021), §2.1: "The nominal dimensions shall be those specified in ISO/IEC 7810: 2019 for the ID-1 type card: 85.60 mm (3.370 in) wide by 53.98 mm (2.125 in) high". Code uses `@page meyar-id1 { size: 85.60mm 53.98mm }` (handoff/C7.md:32). The C7 handoff records the Chrome `printToPDF` page as 85.68 × 54.02 mm (+0.08/+0.04 mm). That is the print engine's rounding, not the CSS value. I did not re-measure the PDF. | "The card is laid out at the ISO/IEC 7810 ID-1 size, 85.60 × 53.98 mm; Chrome's PDF output measured 85.68 × 54.02 mm owing to print-engine rounding." | International Civil Aviation Organization. *Machine Readable Travel Documents, Part 5: Specifications for TD1 Size Machine Readable Official Travel Documents*. Doc 9303, 8th ed., ICAO, 2021. (Cite ISO/IEC 7810:2019 itself only if the team opens it.) |
| 24f | LOINC 48002-0 and germline answer | VERIFIED (LOINC content via the NLM and HL7 terminology services; loinc.org returned 403) | NLM Clinical Tables LOINC API: `48002-0` = "Genomic source class [Type]", answer list **LL378-1** "MG_2_Genetic variant source", first answer **LA6683-2 "Germline"** (also LA6684-0 Somatic, LA10429-1 Fetal, …). tx.fhir.org `$lookup LA6683-2` → display "Germline", LOINC version **2.83**, inactive false. Repo: `engine/origin_guard.py:33` (`48002-0`), `:153` (`LA6683-2`). | "Each Observation carries LOINC 48002-0 'Genomic source class [Type]' with answer LA6683-2 'Germline' (LOINC 2.83)." | Regenstrief Institute. "48002-0: Genomic Source Class [Type]." *LOINC*, version 2.83, loinc.org/48002-0/. Accessed 24 Nov. 2026. |
| 24g | AES-GCM nonce length (NIST SP 800-38D) | VERIFIED | SP 800-38D (Dworkin, Nov 2007) §5.2.1.1 (PDF p. 16): "For IVs, it is recommended that implementations restrict support to the length of 96 bits, to promote interoperability, efficiency, and simplicity of design." §5.2.1.2: tag "t may be any one of the following five values: 128, 120, 112, 104, or 96." The repo uses a 12-byte (96-bit) random nonce and a 128-bit tag (`qr.js:8-9`, `docs/qr-envelope.md:18-19,28`). §8.3 limits the RBG-based construction to ≤ 2^32 invocations per key; each card has its own salt and key, so this is not a concern. | "The QR is encrypted with AES-256-GCM using a random 96-bit nonce and a 128-bit tag, the IV length NIST SP 800-38D recommends." | Dworkin, Morris. *Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC*. NIST Special Publication 800-38D, National Institute of Standards and Technology, Nov. 2007, https://doi.org/10.6028/NIST.SP.800-38D. |
| 24h | OWASP PBKDF2-HMAC-SHA256 600,000 | VERIFIED (context caveat) | OWASP Password Storage Cheat Sheet: "PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)"; "If FIPS-140 compliance is required, use PBKDF2 with a work factor of 600,000 or more and set with an internal hash function of HMAC-SHA-256." This is guidance for password **storage**. Applied to a 6-digit PIN (10^6 guesses) it slows offline brute force but does not prevent it. `docs/qr-envelope.md:41` already says this. | "The key is derived with PBKDF2-HMAC-SHA256 at 600,000 iterations (the OWASP password-storage recommendation); with a six-digit PIN this slows but does not stop offline guessing, so the PIN stops casual scanning only." | OWASP Foundation. "Password Storage Cheat Sheet." *OWASP Cheat Sheet Series*, cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html. Accessed 24 Nov. 2026. |
| 25 | Latency ~0.1 s (HAPI) and ~0.42 s (contract fallback) | TESTED (reproduced, with a correction to the cause) | Source of the claim: `CHANGES.md:90`, `handoff/B2.md:13,25`. `node latency_probe.mjs` runs an in-process `createCdsServer` (Node 24, Windows host, live local HAPI v8.12.0-2) for demo-001 clopidogrel order-sign, 11 calls each, first call shown separately. **HAPI live**: source `hapi`, first 297 ms, **median 78 ms** (min 65, max 95). **Fallback with HAPI refusing connections**: source `contract-out`, median 16 ms. **Fallback with HAPI host unresponsive (timeout)**: source `contract-out`, **median 422 ms** (min 415, max 434). That equals the 400 ms default `FHIR_TIMEOUT_MS` (`cds/server.js:686`) plus processing. So "~0.42 s" is the timeout path, not fallback in general. | "On a laptop, an order-sign request returned its card in about 0.08 s with the local FHIR store up (first call about 0.3 s); if the store does not answer, the service waits its 400 ms timeout and answers from the stored contract in about 0.42 s." | — |
| 26a | A7 sources row "97 scored alleles"; code holds 95 | TESTED → CORRECTED | CPIC API `allele?genesymbol=eq.CYP2D6` (accessed 24 Nov 2026) → 208 alleles. 97 have an activity value: 0.0 ×48, 1.0 ×16, 0.5 ×13, 0.25 ×11, 2.0 ×6, ≥3.0 ×2, **0.75 ×1**. The other 86 are `n/a` and 25 are null. `engine/phenoconvert.py:53ff` `CYP2D6_ALLELE_ACTIVITY_VALUES` has **95** entries, exactly the 97 minus `*1x≥3` and `*2x≥3` (non-numeric "≥3.0"). Values match CPIC 1:1 (0 mismatches). Explicit copy numbers (e.g. `*1x3`) are computed as base × copies by `_COPY_RE` (`:227-231`). The sources row also omits the 0.75 value. CDS mirror `cds/lib/phenoconvert.js` also has 95 rows, and the test "CDS CYP2D6 activity table mirrors engine/phenoconvert.py exactly" passes. | "Meyar's CYP2D6 activity table holds the 95 alleles with a numeric CPIC activity value (0, 0.25, 0.5, 0.75, 1.0 or 2.0); the two '≥3.0' entries (*1x≥3, *2x≥3) are not scored, and explicit copy numbers such as *1x3 are scored as copies × the allele value." | CPIC. "CYP2D6 Allele Functionality." *CPIC Database API*, api.cpicpgx.org/v1/allele?genesymbol=eq.CYP2D6. Accessed 24 Nov. 2026. |
| 26b | `docs/structural-variants.md:7` "roughly a quarter of commonly prescribed medicines" | DROPPED | `docs/sources.md` has no row for it and the file cites no source for it. I did not open a primary source for any "≈25%" figure, so I did not invent one. | "CYP2D6 metabolises many commonly prescribed medicines, including codeine, tramadol and several antidepressants." (No figure.) | — |
| 26c | Tier 2 rows citing Goljan as if measured | CORRECTED (reword) | `tables/saudi_frequencies.json` rows 9–24 (16 Tier 2 genes: SLCO1B1, ABCG2, CACNA1S, CFTR, CYP2B6, CYP3A4, F2, F5, G6PD, HLA-A, HLA-B, IFNL3, MT-RNR1, NAT2, RYR1, UGT1A1; JSON lines 1856–2051) each carry `"doi": "10.1371/journal.pone.0263137", "n": 11889` in `source`. That reads as if Goljan measured these genes. Their `study` text says "Not covered in Goljan et al." Also, "No published Saudi frequency" is risky for SLCO1B1 and G6PD: item 13 cites a Human Genomics 2024 Saudi SLCO1B1 paper (not verified here) and Saudi G6PD figures exist (Al-Ahsa). | "For genes outside Goljan et al.'s Table 1, Meyar integrates no Saudi per-allele frequency and returns no score; it does not borrow non-Saudi figures." | — |
| 27a | SFDA "requires local validation" | CORRECTED | MDS-G010 ("Guidance on Artificial Intelligence (AI) and Machine Learning (ML) technologies based Medical Devices", v1.0, 29/11/2022, MDS-G-010-V1/230103), PDF p. 12: "The manufacturer should locally validate the AI/ML-based medical devices that developed and approved in other jurisdictions." https://www.sfda.gov.sa/sites/default/files/2023-01/MDS-G010ML.pdf | "SFDA's AI/ML guidance (MDS-G010) states that the manufacturer 'should locally validate' AI/ML medical devices developed and approved in other jurisdictions." | Saudi Food and Drug Authority. *Guidance on Artificial Intelligence (AI) and Machine Learning (ML) Technologies Based Medical Devices*. MDS-G010, version 1.0, 29 Nov. 2022, www.sfda.gov.sa/sites/default/files/2023-01/MDS-G010ML.pdf. |
| 27b | MDS-REQ 9 cover identifier vs footer | VERIFIED (mismatch confirmed) | English "Translated Copy" `MDS-REQ 9_En_V2.pdf`: cover "Version Number: 2.0 / Version Date: 15/01/2025 / MDS-REQ-009-V2.0/250105", but every page footer reads **"MDS-REQ-002-V5/240611"** (a template leftover from MDS-REQ 2). The Arabic original `MDS-REQ9A.pdf` gives date 2025/1/5 and footer `MDS-REQ-009-V2.0/250105`. So the English cover date (15/01) also disagrees with the identifier (250105). | "SFDA, Requirements for Licensing Medical Device Establishments (MDS-REQ 9), version 2.0 (MDS-REQ-009-V2.0/250105, January 2025); the English translated copy's page footer carries a different identifier (MDS-REQ-002-V5/240611)." | Saudi Food and Drug Authority. *Requirements for Licensing Medical Device Establishments*. MDS-REQ 9, version 2.0, Jan. 2025, translated copy, www.sfda.gov.sa/sites/default/files/2025-03/MDS-REQ%209_En_V2.pdf. |
| 27c | Exemption is from the Ministry of Industry licence only | VERIFIED | MDS-REQ 9 EN, p. 8, "B. Specific Requirements … 1. Local Manufacturers – Specific Requirements 1. A valid industrial license from the Ministry of Industry and Mineral Resources in the event of construction or production … This does not apply to the activity of (developing software and medical applications)." Items 2–4 still apply, including "Pledge to obtain a marketing authorization certificate (MDMA)". | "Software developers are exempt only from the Ministry of Industry industrial-licence requirement (MDS-REQ 9); establishment licensing and marketing authorisation (MDMA) still apply." | (as 27b) |
| 27d | MDS-REQ 1 and MDS-G38 retrieved | VERIFIED (retrieved) | MDS-REQ 1 "Requirements for Medical Devices Marketing Authorization", v6.0, 19/12/2021 (MDS-REQ-001-V6/211219): https://www.sfda.gov.sa/sites/default/files/2021-12/REQ1En.pdf. MDS-G38 "Guidance to Pre-Market Cybersecurity of Medical Devices", v1.0, 18/6/2019: https://sfda.gov.sa/sites/default/files/2019-10/MDS-G38.pdf. Also MDS-G027 "Guidance on Digital Health Products" v1.0, 11/8/2025 (lists MDS-G38 as related). I did not check whether newer versions of REQ 1 exist. | "Future deployment step: SFDA marketing authorisation (MDS-REQ 1) and pre-market cybersecurity guidance (MDS-G38), plus the 2025 digital-health guidance (MDS-G027)." | Saudi Food and Drug Authority. *Requirements for Medical Devices Marketing Authorization*. MDS-REQ 1, version 6.0, 19 Dec. 2021. — *Guidance to Pre-Market Cybersecurity of Medical Devices*. MDS-G38, version 1.0, 18 June 2019. |
| 27e | Genetic-test IVD rules | VERIFIED | MDS-REQ 1 v6, IVD classification, p. 79, "Rule 3 Devices are classified as class C if they are intended: … f) to be used as companion diagnostics; … i) for human genetic testing;". | "Under SFDA's IVD classification (MDS-REQ 1, Rule 3), devices intended for human genetic testing or as companion diagnostics are Class C." | (as 27d) |
| 28 | PDPL "amended 2023 (M/148)"; article numbers; "sensitive" in legitimate-interest sentence | VERIFIED (law); Implementing Regulations STILL UNVERIFIED | Official BOE text (laws.boe.gov.sa …/b7cfae89-828e-4994-b167-adaa00e37188/1): issued by Royal Decree (م/19) 1443/2/9 AH (16/09/2021); amendments "بموجب المرسوم الملكي رقم (م/148) وتاريخ 1444/9/5هـ". Amended Art. 1(11) defines sensitive data to include "البيانات الوراثية" (genetic data) and "البيانات الصحية". Art. 6(4), added by M/148: "عندما تكون المعالجة ضرورية لتحقيق مصالح مشروعة لجهة التحكم، ما لم يخل ذلك بحقوق صاحب البيانات الشخصية أو يتعارض مع مصالحه **ولم تكن تلك البيانات بيانات حساسة**". The same exclusion appears in Art. 10(7) and Art. 15(6). So the word "sensitive" belongs in the sentence: legitimate interest cannot be used for genetic data. | "Saudi Arabia's Personal Data Protection Law (Royal Decree M/19, 1443 AH; amended by Royal Decree M/148, 5/9/1444 AH) classes genetic and health data as sensitive (Art. 1), and its legitimate-interest basis (Art. 6(4)) excludes sensitive data; PDPL review is a future deployment step." | Saudi Arabia. *Personal Data Protection Law*. Royal Decree No. M/19, 9/2/1443 AH, amended by Royal Decree No. M/148, 5/9/1444 AH. *Bureau of Experts at the Council of Ministers*, laws.boe.gov.sa/BoeLaws/Laws/LawDetails/b7cfae89-828e-4994-b167-adaa00e37188/1. Accessed 24 Nov. 2026. |
| 29a | FDA product code NTI; prior art | VERIFIED | openFDA (FDA data, last updated 2026-11-09). Classification NTI = "Drug Metabolizing Enzyme Genotyping Systems", class 2, 21 CFR 862.3360. `device/510k.json?search=product_code:NTI` → **11 clearances**: DEN040011 and K043576 Roche AmpliChip CYP450 (2004/2005), K051824 Invader UGT1A1, K093420/K130189/K170492 xTAG CYP2D6, K101683 Infiniti CYP2C19, K120466 Verigene CYP2C19, K123891 Spartan RX CYP2C19, K131565 xTAG CYP2C19, **K220026 Genomadix Cube CYP2C19 (2023-03-21)**. Note: AmpliChip CYP450 is a two-gene (CYP2D6 + CYP2C19) **laboratory** microarray. The claim must therefore stay "no cleared multi-gene **point-of-care** device found". The search covered product code NTI only. | "An FDA 510(k) search of product code NTI (drug-metabolising-enzyme genotyping systems, checked 24 Nov 2026) found 11 clearances, all laboratory tests or single-gene systems; we found no cleared multi-gene point-of-care PGx device." | U.S. Food and Drug Administration. "Product Code NTI: Drug Metabolizing Enzyme Genotyping Systems." *510(k) Premarket Notification Database*, www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm. Accessed 24 Nov. 2026. |
| 29b | Genomadix Cube K220026 wording | VERIFIED | openFDA: K220026, Genomadix, Inc., "Genomadix Cube CYP2C19 System", NTI, received 2022-01-05, decision **2023-03-21**, Substantially Equivalent. 510(k) summary PDF (https://www.accessdata.fda.gov/cdrh_docs/pdf22/K220026.pdf): "…specifically *2, *3, and *17 alleles. This test is not intended to be used to predict drug response or non-response." | "The Genomadix Cube CYP2C19 System (FDA 510(k) K220026, cleared 21 March 2023) detects CYP2C19 *2, *3 and *17 and 'is not intended to be used to predict drug response or non-response.'" | U.S. Food and Drug Administration. *510(k) Summary K220026: Genomadix Cube CYP2C19 System*. 21 Mar. 2023, www.accessdata.fda.gov/cdrh_docs/pdf22/K220026.pdf. |
| 29c | safety-code.org QR contents | VERIFIED | safety-code.org (Medical University of Vienna): "After scanning the QR code with a standard smartphone, you are led to a website that displays drug dosing recommendations"; "all PGx data are inside the QR code of your pocket card or lab report"; "No other sensitive health data (e.g. current medication or diseases) are captured"; "The MSC system is a research prototype." So the MSC QR carries PGx data **plus a link to a website**, not encrypted. Meyar's QR is encrypted and carries no URL. | "The Medication Safety Code (Medical University of Vienna), a research prototype, prints PGx results in a QR code that opens a website of dosing recommendations; Meyar's QR is instead PIN-encrypted, holds no URL and is read offline." | Medical University of Vienna. "Medication Safety Code System." *Medication Safety Code Initiative*, safety-code.org. Accessed 24 Nov. 2026. |
| 29d | Groningen / commercial passport examples | STILL UNVERIFIED | Not opened in this run. | Remove, or keep only after a primary page is opened. | — |
| 30a | NICE DG59 prices (UK, ex-VAT) | STILL UNVERIFIED | nice.org.uk returned 403 to curl and to WebFetch. The figures (`sources.md:42`, `docs/demo/SCRIPT.md:31`) were not re-opened. Rule still holds: never convert to SAR. | Keep only after a team member opens DG59 in a browser: "NICE DG59 (2024) lists … (UK prices, excluding VAT)." | National Institute for Health and Care Excellence. *CYP2C19 Genotype Testing to Guide Clopidogrel Use after Ischaemic Stroke or Transient Ischaemic Attack*. Diagnostics Guidance DG59, 2024, www.nice.org.uk/guidance/dg59 (title to be confirmed on opening). |
| 30b | Saliva stability (BMC 2012) | CORRECTED (scope) | Nunes AP et al., BMC Med Res Methodol 2012;12:65: "Saliva samples were collected with an Oragene™ DNA Self-Collection Kit from 4,110 subjects aged 14–15 years … Quantitative and qualitative evaluations were carried out in 20% of the samples"; "a storage period of 8 months at room temperature did not reduce the quality of the DNA obtained." https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/1471-2288-12-65 | "In a Brazilian cohort study (4,110 Oragene saliva kits, quality assessed in a 20% subsample), 8 months at room temperature did not reduce DNA quality (Nunes et al. 2012)." | Nunes, Ana P., et al. "Quality of DNA Extracted from Saliva Samples Collected with the Oragene™ DNA Self-Collection Kit." *BMC Medical Research Methodology*, vol. 12, 2012, article 65, https://doi.org/10.1186/1471-2288-12-65. |
| 30c | Barcode benefit (OR 4.39) | VERIFIED | CDC LMBP summary (review completed February 2012): "patient-specimen identification errors are: Approximately 4.4 times as likely from manual entry systems than from barcoding systems (mean odds ratio of 4.39; 95% CI: 3.06 – 6.32)." https://www.cdc.gov/labbestpractices/pdfs/cdc_barcodingsummary.pdf | "A CDC Laboratory Medicine Best Practices meta-analysis found patient-specimen identification errors about 4.4 times as likely with manual entry as with barcoding (OR 4.39; 95% CI 3.06–6.32)." | Centers for Disease Control and Prevention. *Effective Practices for Reducing Patient Specimen and Laboratory Testing Identification Errors in Diverse Hospital Settings*. Laboratory Medicine Best Practices, 2012, www.cdc.gov/labbestpractices/pdfs/cdc_barcodingsummary.pdf. |
| 30d | Array cost, OneOme price, DESIGN-PLAN shipping/temperature | STILL UNVERIFIED → DROP | Not opened. `hardware/blender/DESIGN-PLAN.md:37` itself says the PAXgene figure "comes from a search snippet that was not opened". | Drop the array cost and OneOme price; keep DESIGN-PLAN temperature claims out of the paper. | — |
| 31a | F3 kit code merged to main; tests | TESTED | `git ls-tree -r --name-only origin/main kit` lists `kit/lib/*.js`, `kit/test/*.test.mjs`, `kit/server.js` etc.; F3 commits 2190d9c…3a6f5b7 are on origin/main. `npm --prefix kit test` → **tests 32, pass 32, fail 0, skipped 0**. | "The F3 chain-of-custody kit software is built and merged; its 32 automated tests pass." | — |
| 31b | T3/T4 renders labelled | TESTED | I viewed `hardware/blender/renders/meyar-t3-single-gene-cathlab-unit-concept.png` and `…t4-multi-gene-reader-concept.png`. Both carry a baked-in chip **"Concept render — not built"**, plus "Concept · not built" on the device screen. The T3 caption says "Not built, not validated. Research prototype — not for clinical use." | "Tiers T3 and T4 appear only as labelled concept renders ('Concept render — not built')." | — |
| 31c | Team decision on 21 Nov "device cut" vs later renders | STILL UNVERIFIED | `grep -rn -i "device cut\|cut the device\|physical device"` finds only AGENTS.md:61 ("The physical device is not built…") and prompt text. No recorded decision in CHANGES.md or docs. | The team must record a one-line decision in CHANGES.md (e.g. "21 Nov: no device will be built; T3/T4 kept as labelled concept renders"). | — |
| 32 | Official KKU Health Innovation Hackathon page, rubric, poster spec | STILL UNVERIFIED | A web search found no KKU page for a 2026 "Health Innovation Hackathon" with a "Predictive Healthcare" track. The KKU news pages opened (kku.edu.sa/en/news/104289, /105281) are other hackathons (Innovation Hackathon in Education 2024; Maida Mahdi Nadher hackathon 2024). No rubric or poster spec was found. **Flag:** the submission form's track field must read exactly "Predictive Healthcare". | Name the event only as the organisers do in their invitation or email; cite that, not a web page. | — |
| 33 | Clinical sign-off count | TESTED | `python -c` over `tables/cpic_recommendations.json` → 128 rows; `verification.humanSignOff`: **null ×128**; `vsCpicDatabase`: "copied-verbatim" ×128. `docs/cpic-signoff.md`: 128 `| ☐ |` boxes, 0 ticked. **0/128 clinician sign-off.** Provenance conflict confirmed: the table says `_generated: "python3 tables/tools/build_cpic_table.py"`, CPIC database only, `_scope` "Not included: … DPWG". But `AGENTS.md:49` says "hand-built from CPIC/DPWG", and `README.md:93,100` say "CPIC/DPWG tables" / "CPIC/DPWG row". The 169-row table appears only in `docs/REVIEW-A5-A7-A8-2026-11-22.md:85` as an unmerged branch; it is not cited elsewhere. | "Recommendation rows (128) are copied verbatim from the CPIC database by script and model cross-checked against it; they have not been clinician-reviewed (0 of 128 signed off). DPWG content is not included." | Clinical Pharmacogenetics Implementation Consortium. *CPIC Database API*, api.cpicpgx.org/v1/recommendation. Accessed 21 Nov. 2026. |
| 34 | Patient-side evidence | VERIFIED (absence) | `passport/src/i18n/ar.json` `_meta`: `"reviewStatus": "Pending native-speaker review by team (BUNYAN / Renad / Dua)", "reviewedBy": null, "reviewedAt": null`. No usability or elder-legibility study exists in the repo. Generated images are labelled: "AI-generated illustration" appears in `passport/src/imagery.js`, `kit/web/index.html`, `kit/web/tracker.html` and `cds/lib/preview.js` (branch commits f1eb4a2, 271a97c). | "Limitations: no usability, elder-legibility or native-Arabic review of the Passport has yet been done; the Arabic text awaits native-speaker review, and illustrations are AI-generated and labelled as such." | — |
| 35 | Stale docs | TESTED | (1) `07-synthesis-and-verdict-v1.md` is **not in the repo** (`find` → none; `docs/research/` has 01–05 + README). It lives in the team's project files, so mark it deprecated there. (2) README run snippet `README.md:81` uses `/pharmcat/data/in/demo-001.vcf`, but `.gitignore` excludes `engine/data/in/*.vcf` and the generator now writes `demo-00N.vcf.bgz`. It fails on a clean clone. (3) README layout `README.md:49` says "engine/ PharmCAT wrapper, A5, A6" and omits A7/A8, `docs/demo`, `docs/review-evidence`, `tests/`. (4) Review row count: 128 rows, 0 signed (item 33); `handoff/REVIEW.md:22` already lists it. (5) Contract shape in task context: 36 of 38 `prompts/*.md` embed the old contract JSON without `currentMedications`, `callability`, `saudiDataTier`, `effectivePhenotype`/`phenoconversion` (grep: `grep -L currentMedications $(grep -l '"uninformativeNormalRisk": 0.04' prompts/*.md)`). Also stale: `docs/qr-envelope.md:31` and `passport/README.md:11` (360 B, see 24a), `CHANGES.md:31` and `engine/validation/results.md:6` (9/10 "exact"). | — | — |
| 36 | Review coverage of B1, B2, B3, C1, hardware | VERIFIED (in repo) | On the branch, `docs/review-evidence/audit-B.md` (B1–B6, cds 39/39), `audit-C.md` (C1–C9) and `audit-DEF.md` (F1–F6, kit 32/32) exist. Counts of mentions: audit-B B1×9, B2×6, B3×11; audit-C C1×5; audit-DEF F1×7 … F6×12. `docs/REVIEW.md` is still the C6/C7/C9 review and has not yet been replaced. | "All tasks, including B1–B3, C1 and the hardware tasks F1–F6, were independently reviewed in the final pass (24 Nov 2026)." Use only after docs/REVIEW.md is replaced. | — |

**Counts (rows):** VERIFIED 26 (with sub-items, some also TESTED); CORRECTED 9; TESTED 13; DROPPED 1 (26b) plus 30d recommended drop; STILL UNVERIFIED 8 (22c, 22g, 29d, 30a, 30d, 31c, 32, PDPL implementing regulations).

---

### Repo file:line that are wrong because of these findings (smallest fix)

1. `engine/validation/run_validation.py:237,244` generates `results.md:6` "**Exact concordance:** 9/10". Fix: count `unambiguous` separately and emit `- **Concordance:** 9/10 (7 unambiguous exact, 2 published diplotype among tied candidates, 1 mismatch)`. Then regenerate `engine/validation/results.md:6`. Editing results.md alone would be reverted by the next run.
2. `CHANGES.md:31` "Concordance: 9/10 exact or co-equal candidate matches". Fix: append "(7 unambiguous, 2 tied, 1 mismatch)".
3. `docs/sources.md:9` "GeT-RM: 363 samples, 34 genes; 70 raw at ENA PRJEB19931". Fix: "ENA PRJEB19931 (Polaris HiSeq X PGx Cohort): 70 WGS runs of GeT-RM-characterised samples | ENA PRJEB19931 file report (accessed 24 Nov 2026); Pratt et al., J Mol Diagn 2016;18(1):109-23". Drop "363 samples, 34 genes" until sourced. Same fix at `docs/research/05-tech-constraints.md:11`.
4. `docs/sources.md` is missing rows. Add: (a) "GRCh38 validation genotypes: 1000 Genomes high-coverage phased panel (NYGC) | Byrska-Bishop M et al., Cell 2022;185(18):3426-3440.e19, doi:10.1016/j.cell.2022.08.004"; (b) "CYP2C19*38 = reference allele lacking rs3758581 (I331V) | Gaedigk A et al., J Mol Diagn 2022;24(4):337-350, doi:10.1016/j.jmoldx.2021.12.011; CPIC allele_definition API"; (c) "AES-GCM 96-bit IV | NIST SP 800-38D §5.2.1.1"; (d) "QR capacity | DENSO WAVE version table".
5. `docs/sources.md:37` "(97 scored star alleles … activity values 0.0 / 0.25 / 0.5 / 1.0 / 2.0 / ≥3.0)". Fix: "(97 CPIC alleles with an activity value; values 0.0 / 0.25 / 0.5 / 0.75 / 1.0 / 2.0 / ≥3.0; Meyar stores the 95 numeric ones — `*1x≥3` and `*2x≥3` are unscored)".
6. `docs/sources.md:29` "CDS Hooks 2.0 specification". Fix: "CDS Hooks 2.0.1 specification (STU 2, 2025-03-12), 'Card Attributes', cds-hooks.hl7.org".
7. `docs/sources.md:40` "(4,110 kits)". Fix: "(4,110 kits; quality assessed in a 20% subsample)".
8. `docs/sources.md:46` "No cleared multi-gene point-of-care PGx device found as of Nov 2026 | NHS GeNotes; Meyar research report…". Fix the source: "FDA 510(k) database, product code NTI (11 clearances; checked 24 Nov 2026)".
9. `docs/sources.md:18` "Genomic source class | LOINC 48002-0". Fix: "LOINC 48002-0 'Genomic source class [Type]', answer list LL378-1, LA6683-2 'Germline' (LOINC 2.83)".
10. `docs/structural-variants.md:7` ", which handles roughly a quarter of commonly prescribed medicines," is unsourced. Fix: delete the clause, or replace it with ", which metabolises many commonly prescribed medicines,".
11. `docs/qr-envelope.md:31` "raw 325 B → deflate 204 B → envelope 360 B". Fix: "As issued by the app (with recommendation keys): demo-001 raw 540 B → deflate 294 B → envelope 480 B, QR version 17, EC M; demo-006 554 B (v18); with four medicines up to 652 B (v20)." Same at `passport/README.md:11`. Optionally make `passport/test/qr.test.mjs:41` pass `getDrugsFn: getDrugsForGene` so the printed metric matches the app.
12. `docs/research/05-tech-constraints.md:20` "MDS-G010 (AI/ML) requires … local validation". Fix: "MDS-G010 states the manufacturer 'should locally validate' AI/ML devices approved elsewhere". Also add "(English copy footer mislabelled MDS-REQ-002)" after "MDS-REQ 9" if cited.
13. `AGENTS.md:49` "hand-built from CPIC/DPWG", `README.md:93` "CPIC/DPWG tables", `README.md:100` "CPIC/DPWG row". Fix: "copied by script (`tables/tools/build_cpic_table.py`) from the CPIC database; DPWG not included". AGENTS.md is team-owned, so the team must change it.
14. `README.md:81` run snippet. Fix: precede it with `python engine/gen_vcf.py --all` and use `bash engine/run_pipeline.sh`, or point at `/pharmcat/data/in/demo-001.vcf.bgz`.
15. `README.md:49` layout. Fix: "engine/ PharmCAT wrapper, A5–A8 (coverage, germline gate, phenoconversion, SV gate)". Add `tests/` and `docs/review-evidence/` lines.
16. `tables/saudi_frequencies.json` (Tier 2 rows, `source` objects near lines 1856–2051). Fix (owner A5): drop `"doi"` and `"n": 11889` from Tier 2 `source` objects, or rename the fields to `"checkedAgainst"`, so they do not read as measured. Re-check the SLCO1B1 and G6PD "No published Saudi frequency" note against C2 item 13/18 results.
17. `cds/lib/cards.js:15-19` truncates the summary mid-word (139-char case "…metabolite) f…"). Minor fix: cut at the last space before 138 characters.
18. `CHANGES.md:90` and `handoff/B2.md:13` "contract fallback with HAPI stopped in about 0.42 s". Fix: "about 0.42 s when HAPI does not answer (400 ms timeout); immediate (<0.02 s) when the connection is refused".
19. `prompts/*.md` (36 files) "Data contract" block lacks `currentMedications`, `callability`, `saudiDataTier`, `effectivePhenotype`, `phenoconversion`. Fix: point to `docs/data-contract.schema.json` instead of embedding JSON, or update the block.
20. Team record missing: no CHANGES.md entry resolving the 21 Nov "device cut" vs the later renders. Add one line.

