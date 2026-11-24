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
| A6 sheet 105 × 148 mm | ISO 216 |
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
| CYP2D6 allele functionality reference table (97 scored star alleles and copy-number alleles, activity values 0.0 / 0.25 / 0.5 / 1.0 / 2.0 / ≥3.0) | CPIC database, `https://api.cpicpgx.org/v1/allele?genesymbol=eq.CYP2D6&select=name,clinicalfunctionalstatus,activityvalue` (accessed 2026-11-22) |
| CYP2D6 consensus activity-score-to-phenotype thresholds (PM: 0; IM: >0 to 1.0; NM: 1.25 to 2.25; UM: >2.25) | Caudle KE et al., *Clin Transl Sci* 2020;13(1):116–124, PMID 31647186, doi:10.1111/cts.12692 |
| FDA clinical inhibitor examples for CYP2D6 (21 rows) and CYP2C19 (9 rows) in `tables/cyp_inhibitors.json` | FDA, "For Healthcare Professionals: FDA's Examples of Drugs that Interact with CYP Enzymes and Transporter Systems" (linked from FDA Table of Substrates, Inhibitors and Inducers, `fda.gov`, content current as of 2026-05-29, accessed 2026-11-22) |
| Saliva DNA: no loss of quantity or quality after 8 months at room temperature (4,110 kits) | BMC Med Res Methodol 2012;12:65, doi:10.1186/1471-2288-12-65 (F4 research note, accessed 22 Nov 2026) |
| Manual specimen labelling gives 4.4× more ID errors than barcoding (OR 4.39, 95% CI 3.06–6.32) | CDC Laboratory Medicine Best Practices, barcoding systematic review, cdc.gov/labbestpractices/pdfs/cdc_barcodingsummary.pdf |
| Lab CYP2C19 test £44–£139 per test depending on batch size; point-of-care kits £100 (Genedrive) and £125 (Genomadix Cube), ex-VAT | UK NICE DG59 (2024), "The diagnostic tests", nice.org.uk/guidance/DG59 |
| PREPARE: 12-gene panel, 6,944 patients, 7 European countries, results within 7 days; clinically relevant ADRs 21.0% vs 27.7% in patients with an actionable result, reported as 30% lower odds | Swen JJ et al., Lancet 2023;401:347–356; figures as reported by GenomeWeb and News-Medical (Feb 2023). Do not say "30% fewer ADRs" |
| KFSHRC pharmacogenetic analysis for over 1,500 patients (Oct 2024) | KFSHRC news release, kfshrc.edu.sa/en/news/2024/10 |
| Point-of-care CYP2C19 *2/*3/*17 result in about 1 hour | Genomadix Cube FDA clearance release (newswire.ca, 2023); NICE DG59 |
| No cleared multi-gene point-of-care PGx device found as of Nov 2026 | NHS GeNotes; Meyar research report "PGx testing staircase evidence" (project library, 22 Nov 2026). Say "none found", not "none exists" if challenged |
