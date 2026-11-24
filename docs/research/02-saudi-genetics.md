# Saudi population genetics (what the coverage flag is for)

The differentiator: **a panel designed for Europeans does not test variants common in Saudis, and untested positions are assumed reference, so the patient is reported a normal metaboliser when they are not.** That is a mechanism for a wrong clinical answer, not a preference. A5 computes, per gene per patient: which CPIC/PharmVar defining positions were assayed, which locally common non-normal-function alleles were not, and a summed Saudi-frequency "uninformative Normal Metaboliser risk".

Supporting evidence: 26 of 37 imported markers had MAF = 0 in a Saudi cohort (n=95; Front Pharmacol 2025;16:1559399). PharmCAT refuses to assume missing positions are reference (and is labelled research-only partly for it) while array products effectively do. The KFSHRC paper never discusses variants outside array coverage; its stated fix is "We are upgrading our genotyping kit".

## Frequency table (cite the row, never a rounded retelling)
| Finding | Saudi / Arab | Comparator |
|---|---|---|
| SLCO1B1 actionable phenotype (statin myopathy) | 47.6% — highest in the CPIC database | ~29% Europeans/East Asians/Americans; 32.4% Qatar |
| SLCO1B1 action rate in practice (KFSHRC n=512) | 41.4%, its highest gene | — |
| CYP2D6 duplications | up to 10.4% | 1.97% European |
| CYP2D6 *41 | 18.4% | 9.24% |
| CYP2D6 poor metabolisers | 3.39% Arab | 6.47% European |
| CYP2C19*17 | 25.9% | — |
| CYP3A5 non-expressers | 77.8% | — |
| DPYD c.257C>T | ~1 in 333 Saudis | ≥52× rarer in Europeans |
| CYP2C9*2 | 0.136 | higher than regional reference |
| Carriers of ≥1 actionable variant | 99.2% of the 1,928 Saudis genotyped with the PGx panel (Goljan et al. 2022; not of all 11,889) | 99.5% Qataris, 99.99% Estonians |

Sources: Arab PGx systematic review (295 studies / 94,346 participants, Saudi = 38 studies), SHGP, Front Pharmacol 2025;16:1559399, KFSHRC paper above.

## G6PD
Second among all pharmacogenes by number of affected drugs (29) in CPIC/DPWG/PharmGKB. The 25% figure is **Al-Ahsa, Eastern Province** (48,889 children, 33.8% of males) — not Aseer; no published Aseer figure exists. G6PD screening is usually an enzyme activity assay, PharmCAT consumes VCFs only, CPIC requires activity measurement for variable/indeterminate phenotypes, X-linked mosaicism means heterozygous females can test either way, and activity reads falsely normal during or shortly after haemolysis. So a one-off G6PD result is not a durable phenotype: show it as a flag, never as a settled phenotype.

See `04-dont-claim.md` before using any of this.
