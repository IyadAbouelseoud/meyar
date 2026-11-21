# Clinical logic the code must implement

Everything here is a **lookup** from `tables/cpic_recommendations.json` (owner B1), one row per gene × phenotype × drug, each with a source. No model generates dosing, alternatives or safety answers.

## 1. Both ends of the scale
A gene result can make a drug riskier *or* make another drug the better match. Rows must cover poor, intermediate, normal, rapid and ultrarapid, not just the harmful end. Examples the guidelines name explicitly:
- **CYP2C19 + clopidogrel** — poor and intermediate metabolisers: reduced activation, higher event risk; CPIC names **prasugrel or ticagrelor** if there is no contraindication (CPIC CYP2C19/clopidogrel 2022 update, Lee CR et al., Clin Pharmacol Ther 2022). Context for the pitch: RAPID GENE (Roberts et al., Lancet 2012) proved point-of-care genotyping in PCI; TAILOR-PCI (JAMA 2020) missed its primary endpoint — cite that ourselves.
- **CYP2D6 + codeine/tramadol** — poor metabolisers get little analgesia, ultrarapid metabolisers risk toxicity; CPIC says avoid and use an alternative that is not tramadol (CPIC CYP2D6/opioids, Crews KR et al., Clin Pharmacol Ther 2021).
- **SLCO1B1 + statins** — our highest-yield Saudi gene (47.6% actionable); rows should carry the alternative statin or dose cap the guideline states.

Rule: `alternatives: [{drug, rxnorm, condition, source}]` is filled **only** where the guideline text names an alternative, empty otherwise. Never rank, never invent, never generate. UI label: "Better matched for your genes" (patient) / "Better matched for this patient's genes" (prescriber), always with the guideline link, and on the patient side always "ask your doctor".

## 2. Current medicines change the result (phenoconversion)
A patient with a normal-metaboliser genotype who already takes a strong inhibitor behaves like a poor metaboliser. Canonical example: **paroxetine (a CYP2D6 inhibitor) + codeine** — the genotype says normal, the patient gets little analgesia like a poor metaboliser.

Method (A7), the only arithmetic allowed:
1. Genetic activity score from the diplotype (CPIC CYP2D6 allele-function table).
2. Multiply by **0.5 for a moderate** and **0 for a strong** CYP2D6 inhibitor — Thomas CD et al., *CPT Pharmacometrics Syst Pharmacol* 2020;9(12):678–685, doi:10.1002/psp4.12563 ("the AS is multiplied by a factor of 0.5 or 0 to account for phenoconversion with use of a moderate or strong CYP2D6 inhibitor, respectively"). Bupropion is called in that paper "a strong CYP2D6 inhibitor that phenoconverts the CYP2D6 AS to 0".
3. Map the adjusted score back to a phenotype with the CPIC thresholds. Take the strongest inhibitor if several.
4. Inhibitor strength comes **only** from `tables/cyp_inhibitors.json`, rows copied from the FDA "Table of Substrates, Inhibitors and Inducers" (fda.gov), with an access date per row. If a drug is not classified there, it is not used.
5. Genes other than CYP2D6: never compute a score. Flag "may be affected by <drug>" and leave the phenotype unchanged.

Never overwrite the genetic phenotype. Every surface shows both: "Genetic result: Normal metaboliser · Acting like: Poor metaboliser because of paroxetine". A UF Health precision-medicine page confirms the clinical point in plain terms: strong and moderate CYP2D6 inhibitors (it lists bupropion, fluoxetine, paroxetine, quinidine, terbinafine, cinacalcet, duloxetine, mirabegron, abiraterone, lorcaserin) "can lead to phenoconversion" — but it does not say which are strong, so classification comes from the FDA table only.

## 3. Where the current-medicine list comes from
- Prescriber side: the patient's existing orders (mock FHIR records in the demo). B6 also runs a **backward sweep** — when the drug being signed is itself an inhibitor, re-check the medicines the patient already takes.
- Patient side (C9): the same list, plus medicines the patient types in themselves (`"source": "patient-entered"`), so the pharmacy-counter check works with no clinician present. The OTC check uses the effective phenotype and still gives only three answers; never "safe".

## 4. Out of scope
General drug–drug interaction checking (the free NLM/RxNav interaction API was discontinued ~2 Jan 2024). Only the gene-mediated inhibitor effect above is in scope. Tumour (somatic) results are never interpreted (A6).
