# Sources — every number in the project must have a row here

| Claim / number | Source |
|---|---|
| UF interruptive alerts: 63% accepted, 20% followed | see EN detail doc, "The alert-fatigue evidence" |
| UK PROGRESS non-interruptive: 90% acted on | see EN detail doc, "The alert-fatigue evidence" |
| Ages 45–64 peak exposure band, 31.3% | see EN detail doc, "Burden and target population" |
| 26 of 37 listed variants zero frequency in a Saudi sample | see EN detail doc, "Saudi population genetics" |
| GeT-RM: 363 samples, 34 genes; 70 raw at ENA PRJEB19931 | CDC GeT-RM; ENA PRJEB19931 |
| Genomadix Cube, FDA 510(k) K220026, CYP2C19 *2/*3/*17 | FDA 510(k) database |
| KFSHRC programme | Bakheet et al., Genetics in Medicine Open 3:103426 (2025), doi:10.1016/j.gimo.2025.103426 |
| RAPID GENE point-of-care CYP2C19 in PCI | Roberts et al., Lancet 2012 |
| TAILOR-PCI primary endpoint not significant | Pereira et al., JAMA 2020 |
| PBKDF2-SHA256 600,000 iterations | OWASP Password Storage Cheat Sheet |
| ID-1 card 85.60 × 53.98 mm | ISO/IEC 7810 |
| WCAG 2.2 SC 1.4.3, 1.4.4, 2.5.8 | W3C WCAG 2.2 |
| Genomic source class | LOINC 48002-0 |
| CYP2D6 phenoconversion: activity score ×0.5 moderate inhibitor, ×0 strong inhibitor | Thomas CD et al., CPT Pharmacometrics Syst Pharmacol 2020;9(12):678–685, doi:10.1002/psp4.12563 |
| CYP inhibitor strength classes (strong/moderate/weak) | FDA, "Drug Development and Drug Interactions: Table of Substrates, Inhibitors and Inducers", fda.gov (cite access date per row in tables/cyp_inhibitors.json) |
| Clopidogrel alternatives for CYP2C19 PM/IM (prasugrel or ticagrelor) | CPIC guideline for CYP2C19 and clopidogrel, 2022 update (Lee CR et al., Clin Pharmacol Ther 2022) |
| Codeine: avoid in CYP2D6 PM and UM, use non-tramadol alternative | CPIC guideline for CYP2D6, OPRM1, COMT and opioids (Crews KR et al., Clin Pharmacol Ther 2021) |
| PharmCAT does not recommend calling CYP2D6 from VCF; matcher ignores structural variants | PharmCAT documentation, "Calling CYP2D6" and "NamedAlleleMatcher 101", pharmcat.clinpgx.org (accessed 21 Nov 2026) |
| StellarPGx calls CYP2D6 SV/CNV from WGS CRAM/BAM; PharmCAT uses it only for demonstration | PharmCAT documentation, "Calling CYP2D6", pharmcat.clinpgx.org (accessed 21 Nov 2026) |
| Outside-call file format: tab-separated gene, diplotype, phenotype, activity score; overrides the matcher | PharmCAT documentation, "Outside Call Format", pharmcat.clinpgx.org (accessed 21 Nov 2026) |
| Saudi per-allele PGx frequencies, 11,889 unrelated Saudi nationals (9,961 exomes + 1,928 panels), 8 CPIC genes, Table 1 | Goljan E, Abouelhoda M, ElKalioby MM, Jabaan A, Alghithi N, Meyer BF, Monies D. PLoS ONE 2022;17(1):e0263137, doi:10.1371/journal.pone.0263137 |
| CYP2D6 excluded from that Saudi study because deletions, duplications and hybrids could not be called | Goljan et al. 2022, same paper (quote in tables/sv_genes.json) |
| Exome and panel sequencing do not reliably identify structural changes and copy number variation | Goljan et al. 2022, limitations section |
| CDS Hooks card summary under 140 characters; indicator values info / warning / critical | CDS Hooks 2.0 specification, "Card Attributes", cds-hooks.hl7.org |
| CPIC recommendation rows (128; clopidogrel, simvastatin, atorvastatin, codeine, tramadol, omeprazole, lansoprazole, pantoprazole, ibuprofen, celecoxib, meloxicam, piroxicam): phenotype, implication, recommendation text, classification, comments | CPIC database, `https://api.cpicpgx.org/v1/recommendation?drugid=eq.RxNorm:<id>` (accessed 21 Nov 2026); per-row id in `tables/cpic_recommendations.json` `source.cpicRecommendationId`. Model cross-check only, see `docs/cpic-signoff.md` |
| Clopidogrel rows | CPIC guideline for CYP2C19 and clopidogrel, 2022 update; Lee CR et al., Clin Pharmacol Ther 2022, PMID 35034351, doi:10.1002/cpt.2526; https://www.clinpgx.org/guideline/PA166251443 (page opened 21 Nov 2026, confirms 2022 update) |
| Codeine and tramadol rows | CPIC guideline for CYP2D6, OPRM1, COMT and opioids; Crews KR et al., Clin Pharmacol Ther 2021, PMID 33387367, doi:10.1002/cpt.2149; https://www.clinpgx.org/guideline/PA166251454 |
| Simvastatin and atorvastatin rows | CPIC guideline for SLCO1B1, ABCG2, CYP2C9 and statins; Cooper-DeHoff RM et al., Clin Pharmacol Ther 2022, PMID 35152405, doi:10.1002/cpt.2557; https://www.clinpgx.org/guideline/PA166264281 |
| Omeprazole, lansoprazole, pantoprazole rows | CPIC guideline for CYP2C19 and proton pump inhibitors; Lima JJ et al., Clin Pharmacol Ther 2020, PMID 32770672, doi:10.1002/cpt.2015; https://www.clinpgx.org/guideline/PA166251441 |
| Ibuprofen, celecoxib, meloxicam, piroxicam rows | CPIC guideline for CYP2C9 and NSAIDs; Theken KN et al., Clin Pharmacol Ther 2020, PMID 32189324, doi:10.1002/cpt.1830; https://www.clinpgx.org/guideline/PA166251464 |
| Named alternatives (prasugrel, ticagrelor, ticlopidine, aspirin, ketorolac, naproxen, sulindac, rosuvastatin; opioid and statin classes) | Quoted from the CPIC text of the same row (`alternatives[].quotedFrom`); RxNorm ids only where the CPIC drug table has them (aspirin 1191, naproxen 7258, rosuvastatin 301542), otherwise null |
