# How much Saudi data stands behind the A5 score

*Decided 21 Nov 2026, at the team's request to be sure the confidence claim holds.*

A5's score is arithmetic over two tables. It is only as trustworthy as the Saudi frequency table underneath it, so each gene is tiered and the tier is printed with the result.

## Tier 1 — a published Saudi frequency exists

Use it and cite it per row, with the study, the sample size and the table number. The anchor source:

> Goljan E, Abouelhoda M, ElKalioby MM, Jabaan A, Alghithi N, Meyer BF, Monies D. "Identification of pharmacogenetic variants from large scale next generation sequencing data in the Saudi population." PLoS ONE 2022;17(1):e0263137. doi:10.1371/journal.pone.0263137.

- **11,889 unrelated Saudi nationals**: 9,961 exomes and 1,928 custom pharmacogenomic panels, sequenced by the Saudi Human Genome Program between 2015 and 2019.
- Per-allele frequencies are published in its Table 1 ("Frequencies and functional status of pharmacogenetic alleles in Saudi population").
- Genes covered: **CYP2C9, CYP2C19, CYP3A5, CYP4F2, VKORC1, DPYD, TPMT, NUDT15**.

That is a strong base, and it is the sentence to use when a judge asks whether the Saudi layer is real. It is also a limited base: eight genes, not all of pharmacogenomics.

## Tier 2 — no published Saudi frequency for this gene

Print "No published Saudi frequency for this gene" and return a null score. **Never substitute a global, European or neighbouring-Gulf frequency as if it were Saudi.** A regional figure may appear only as a clearly labelled comparison, outside the score. Saying "we do not know this one yet" is the whole point of the product; faking it would destroy the argument it rests on.

## Tier 0 — the gene depends on structural variation

CYP2D6 gets no A5 score at all. A8 owns it. The honest reason to cite is that the same 11,889-person study excluded CYP2D6 because deletions, duplications and hybrids could not be called. See [structural-variants.md](structural-variants.md).

## Two cautions when citing that paper

- Its raw data is not public: "Data cannot be shared publicly because of National policy." Cite the published Table 1 values; do not imply access to the dataset.
- It disagrees with itself in places: CYP3A5\*3 appears as 84.5% in Table 1 and 84.7% in the text, and the abstract and results give different rare-variant counts. Quote Table 1 and say which you used, or leave the figure out.

## Where to get more

Honest options, in order of how quickly they could happen:

1. Cite more published Saudi and Gulf studies gene by gene, each as its own row with its own n. Several exist for individual genes; each must be read before it is cited.
2. Request access to the Saudi Human Genome Program data through the route the paper names (King Faisal Specialist Hospital and Research Centre institutional data access committee). That is a post-hackathon path, not a four-day one.
3. State the gap as a finding. "There is no published Aseer figure" and "there is no published Saudi CYP2D6 structural-variant frequency" are results, not weaknesses, and they are exactly what a local validation study would fix. Put them on the poster as the next step.

Never close a gap with a borrowed number.
