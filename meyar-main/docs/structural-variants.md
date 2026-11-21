# Structural variation: the genes a DNA test can mis-read

*Status: decided 21 Nov 2026. Task A8 implements it. Every quote below is verbatim from the cited source.*

## The problem, in plain terms

A genotyping array or an exome reads single letters of DNA. Some pharmacogenes are not defined by single letters. CYP2D6, which handles roughly a quarter of commonly prescribed medicines, can be present in two copies, three copies, deleted entirely, or fused with its neighbouring pseudogene CYP2D7 into a hybrid. A test that reads only single letters cannot see any of that, so a patient with an extra working copy, who clears a drug too fast for a standard dose to work, looks exactly like an ordinary patient.

This is the same failure as the one Meyar was built around, one level up. A5 catches the positions a panel never tested. A8 catches the whole class of change no VCF can carry.

## What the tools themselves say

PharmCAT, the interpretation engine Meyar runs, is explicit. From its documentation page "Calling CYP2D6":

> we **do NOT recommend calling CYP2D6 from VCF**

because of

> the large influence of structural variation (SV) and copy number variation (CNV) on inferring CYP2D6 phenotype

and, the sentence that matters most for patient safety:

> missing the copy number of a normal or decreased function allele can misrepresent a normal metabolizer (NM)

Its matcher component says the same thing mechanically ("NamedAlleleMatcher 101"):

> The `Named Allele Matcher` does not currently support structural variants, including gene copy number. If structural variants are detected in the VCF data, it will be ignored and a warning will be issued.

The hard cases it names are the CYP2D6/CYP2D7 hybrids `*13` and `*68` and the whole-gene deletion `*5`.

## This is not a tool quirk

The largest published Saudi pharmacogenomic study hit the same wall and dropped the gene. Goljan et al. analysed 11,889 unrelated Saudi nationals and wrote:

> we were not able to call star alleles with whole gene deletions, duplications or hybrids that are common in the assignment of CYP2D6 alleles. Accordingly, we did not include CYP2D6 in our analysis.

and, generally:

> Structural changes and copy number variations which may be relevant are not reliably identified by whole exome or gene panel sequencing.

So the gap is real, it is current, and it is Saudi. A Saudi hospital buying a panel today has no CYP2D6 answer and may not know it.

## What Meyar does

1. `tables/sv_genes.json` lists every gene whose result depends on structural variation, each row carrying the quoted justification. CYP2D6 is in it; per PharmCAT it is also the only gene with gene duplications defined.
2. For those genes Meyar **never reports a phenotype derived from a VCF**. There is no fallback to a normal-function call.
3. The result may arrive instead through PharmCAT's outside-call file, a tab-separated file from a caller that can see copy number, which "will trump the VCF data".
4. If no such result exists, the gene is reported as **not assessed**, with the reason, on both the prescriber card and the patient Passport: *"CYP2D6: copy number not assessed by this test — no result reported."* Never a reassurance.
5. Every gene result in the data contract carries a `callability` object recording which of those three paths it took and whether structural variation was assessed.

## What is built and what is roadmap

Built: the gate, the outside-call path, the contract field, and the honest screen text. The demo's CYP2D6 results come from **mock outside-call files**, each marked `mock: true` and naming a pretend caller.

Roadmap, labelled as such: running a copy-number-aware caller ourselves. PharmCAT names one for demonstration purposes:

> For demonstration purposes, we are using StellarPGx, which supports calling CYP2D6 with structural variants and CNV from whole genome sequencing (WGS) CRAM/BAM files

while adding that it is

> not affiliated with the StellarPGx team and offer no guarantees about its performance

and that it

> strongly discourage[s] using whole-exome sequencing or low coverage whole-genome sequencing data to call CYP2D6.

We do not run it in this prototype, and we do not claim to.

## Why this belongs in the hardware tiers too

The saliva-kit tier (T1) posts a sample to a central laboratory precisely because that laboratory can run the deeper test. The honest version of the roadmap is therefore: the kit removes the collection barrier, and the laboratory's assay decides whether CYP2D6 can be answered at all. A single-gene rapid unit (T3) answers one gene and must never be presented as answering CYP2D6 copy number.

## Sources

- PharmCAT documentation, "Calling CYP2D6", "NamedAlleleMatcher 101", "Outside Call Format" — pharmcat.clinpgx.org, accessed 21 November 2026.
- Goljan E, Abouelhoda M, ElKalioby MM, Jabaan A, Alghithi N, Meyer BF, Monies D. "Identification of pharmacogenetic variants from large scale next generation sequencing data in the Saudi population." PLoS ONE 2022;17(1):e0263137. doi:10.1371/journal.pone.0263137.
