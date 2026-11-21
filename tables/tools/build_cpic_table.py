#!/usr/bin/env python3
"""Build tables/cpic_recommendations.json from a CPIC-database extract.

Input  : tables/tools/cpic_extract.json (verbatim dump of api.cpicpgx.org /v1/recommendation
         for the drugs listed below, dictionary-compressed, see its _meta).
Rule   : no clinical text is written or paraphrased here. Text comes from the extract only.
         `alternatives` are filled ONLY where the CPIC text itself names the alternative.
Run    : python3 tables/tools/build_cpic_table.py
"""
import json, os, re, sys, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
ex = json.load(open(os.path.join(HERE, "cpic_extract.json"), encoding="utf-8"))
D = ex["dict"]
ACCESSED = "2026-11-21"
API = "https://api.cpicpgx.org/v1/recommendation?drugid=eq.RxNorm:{rx}"

GUIDELINES = {
    100411: dict(name="CYP2C19 and Clopidogrel", pub="Lee CR et al., Clin Pharmacol Ther 2022 (2022 update)", pmid="35034351", doi="10.1002/cpt.2526", url="https://www.clinpgx.org/guideline/PA166251443", cpicDbVersion=72),
    100416: dict(name="CYP2D6, OPRM1, COMT, and Opioids", pub="Crews KR et al., Clin Pharmacol Ther 2021", pmid="33387367", doi="10.1002/cpt.2149", url="https://www.clinpgx.org/guideline/PA166251454", cpicDbVersion=73),
    100426: dict(name="SLCO1B1, ABCG2, CYP2C9, and Statins", pub="Cooper-DeHoff RM et al., Clin Pharmacol Ther 2022", pmid="35152405", doi="10.1002/cpt.2557", url="https://www.clinpgx.org/guideline/PA166264281", cpicDbVersion=73),
    110058: dict(name="CYP2C9 and NSAIDs", pub="Theken KN et al., Clin Pharmacol Ther 2020", pmid="32189324", doi="10.1002/cpt.1830", url="https://www.clinpgx.org/guideline/PA166251464", cpicDbVersion=70),
    110076: dict(name="CYP2C19 and Proton Pump Inhibitors", pub="Lima JJ et al., Clin Pharmacol Ther 2020", pmid="32770672", doi="10.1002/cpt.2015", url="https://www.clinpgx.org/guideline/PA166251441", cpicDbVersion=69),
}

# RxNorm ids for named alternatives come from the CPIC drug table (extract _meta.altRxnorm); null if CPIC has none.
ALT_RX = ex["_meta"].get("altRxnorm", {})

def alts(drug, rec, com, pop):
    """Return alternatives named by the CPIC text. Each is traceable to a quoted phrase."""
    out = []
    text = (rec or "") + " " + (com or "")
    def add(name, cond, quote, cls=None):
        out.append({"drug": name, "drugClass": cls, "rxnorm": ALT_RX.get(name), "condition": cond, "quotedFrom": quote})
    if drug == "clopidogrel" and "prasugrel or ticagrelor" in rec:
        for n in ("prasugrel", "ticagrelor"):
            add(n, "standard dose, if no contraindication", "Use prasugrel or ticagrelor at standard dose if no contraindication.")
    if drug == "clopidogrel" and pop == "NVI" and "alternative P2Y12 inhibitor" in rec:
        for n in ("ticagrelor", "ticlopidine"):
            add(n, "standard dose, if clinically indicated and no contraindication; CPIC: prasugrel is contraindicated in patients with a history of stroke or TIA", "Alternative P2Y12 inhibitors not impacted by CYP2C19 genetic variants include ticagrelor and ticlopidine.")
    for phrase, cls in (("non-tramadol opioid", "non-tramadol opioid"), ("non-codeine opioid", "non-codeine opioid")):
        if phrase in rec:
            add(None, "CPIC names a class, not a specific drug; condition is in the quoted CPIC text", rec, cls)
    if "include aspirin, ketorolac, naproxen and sulindac" in (com or ""):
        for n in ("aspirin", "ketorolac", "naproxen", "sulindac"):
            add(n, "CPIC lists it as not primarily metabolized by CYP2C9; selection depends on patient goals and toxicity risk", "Alternative therapies not primarily metabolized by CYP2C9 include aspirin, ketorolac, naproxen and sulindac.")
    if drug in ("simvastatin", "atorvastatin") and "alternative statin" in rec:
        add(None, "depending on the desired potency; CPIC points to Figure 1 of PMID 35152405", "Prescribe an alternative statin depending on the desired potency (see Figure 1 of PMID: 35152405 for recommendations for alternative statins).", "alternative statin")
    if drug == "atorvastatin" and "consider rosuvastatin" in rec:
        add("rosuvastatin", "if dose >20mg is needed for desired efficacy", "If dose >20mg is needed for desired efficacy, consider rosuvastatin or combination therapy")
    return out

rows = []
for (cid, drug, rx, gl, pop_i, ph, asc, imp_i, rec_i, cls_i, com_i, alt, allele) in ex["R"]:
    gene, phen = ph.split("=", 1)
    ascj = json.loads(asc)
    pop = D[pop_i]
    rec, cls = D[rec_i], D[cls_i]
    com = D[com_i] if com_i >= 0 else None
    imp = json.loads(D[imp_i]).get(gene)
    g = GUIDELINES[gl]
    key = "|".join([drug, gene, phen, ascj.get(gene, "-"), pop])
    rows.append({
        "key": key, "drug": drug, "rxnorm": rx, "gene": gene, "phenotype": phen,
        "activityScore": ascj.get(gene), "population": pop,
        "implication": imp, "recommendation": rec, "classification": cls, "comments": com,
        "alternatives": alts(drug, rec, com, pop),
        "guideline": {"cpicGuidelineId": gl, **g},
        "source": {"cpicRecommendationId": cid, "api": API.format(rx=rx), "accessed": ACCESSED},
        "verification": {"vsCpicDatabase": "copied-verbatim", "humanSignOff": None},
        "mock": False,
    })

assert len({r["key"] for r in rows}) == len(rows), "duplicate keys"
out = {
    "_owner": "B1",
    "_note": "Only the owner edits this file. Every row needs a source. Text is copied verbatim from the CPIC database; a model never writes or paraphrases it. Model cross-check only: see docs/cpic-signoff.md for the human sign-off list.",
    "_generated": "python3 tables/tools/build_cpic_table.py",
    "_scope": "Drugs: clopidogrel, simvastatin, atorvastatin, codeine, tramadol, omeprazole, lansoprazole, pantoprazole, ibuprofen, celecoxib, meloxicam, piroxicam. Not included: warfarin (CPIC gives an algorithm, not phenotype rows), esomeprazole and rabeprazole (no rows in CPIC database), rosuvastatin/pravastatin/fluvastatin/lovastatin/pitavastatin, DPWG.",
    "rows": rows,
}
with open(os.path.join(HERE, "..", "cpic_recommendations.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1); f.write("\n")
print(len(rows), "rows;", sum(1 for r in rows if r["alternatives"]), "with alternatives")

# ---- human sign-off checklist, generated from the same data ----
lines = ["# CPIC table sign-off checklist (human review)", "",
"**Status of this file: MODEL CROSS-CHECK ONLY. A language model cannot vouch for clinical data.** Renad or a pharmacist must confirm before this table is described as verified. Dr. Tahani Almeleebia (KKU Clinical Pharmacy) is the named expert contact.", "",
"What was checked (21 Nov 2026): every row's text is copied verbatim from the CPIC database (`api.cpicpgx.org`, the machine-readable release CPIC publishes with each guideline); the copy was hash-checked end to end; guideline names, publications and PMIDs were taken from the same database; the clopidogrel guideline page on ClinPGx was opened to confirm it is the 2022 update (PMID 35034351). **Not done:** reading each row against the guideline paper itself (the paper full text could not be fetched by tooling). That is the step a human must do.", "",
"How to sign off: open the guideline link, find the drug's recommendation table, compare the row, then tick the box and initial it. Rows are grouped by guideline.", ""]
byg = {}
for r in rows:
    byg.setdefault(r["guideline"]["cpicGuidelineId"], []).append(r)
for gid, rs in byg.items():
    g = GUIDELINES[gid]
    lines += [f"## {g['name']} — {g['pub']}", f"Guideline page: {g['url']} · PMID {g['pmid']} · doi:{g['doi']} · CPIC DB version {g['cpicDbVersion']}", "",
              "| ✓ | Drug | Gene | Phenotype (activity score) | Population | CPIC rec id | Classification | Alternatives named | Initials |", "|---|---|---|---|---|---|---|---|---|"]
    for r in rs:
        a = ", ".join(x["drug"] or x["drugClass"] for x in r["alternatives"]) or "none"
        ascv = f" ({r['activityScore']})" if r["activityScore"] not in (None, "n/a") else ""
        lines.append(f"| ☐ | {r['drug']} | {r['gene']} | {r['phenotype']}{ascv} | {r['population']} | {r['source']['cpicRecommendationId']} | {r['classification']} | {a} | |")
    lines.append("")
lines += ["## Items a human should look at first", "",
"1. **Clopidogrel, neurovascular (NVI) rows:** alternatives (ticagrelor, ticlopidine) come from CPIC's comment text, and the same text says prasugrel is contraindicated after stroke/TIA. Confirm the card never offers prasugrel for NVI.",
"2. **NSAID rows (IM 1.0, PM):** aspirin, ketorolac, naproxen and sulindac are listed in a comment as \"not primarily metabolized by CYP2C9\". They are CPIC examples, not a ranked preference. Decide whether C9 should show them.",
"3. **Codeine/tramadol alternatives are classes, not drugs** (\"non-tramadol opioid\", \"non-codeine opioid\"). The UI must show the class wording, never pick a drug.",
"4. **Clopidogrel 'No recommendation' rows (non-ACS/non-PCI, several phenotypes)** are real CPIC content, not gaps in this table. The UI must say 'no guideline recommendation', not 'normal'.",
"5. **Not in this table:** warfarin (CPIC gives a dosing algorithm, not phenotype rows), esomeprazole and rabeprazole (no rows in the CPIC database), other statins, DPWG. Do not show recommendations for them.",
"6. The CPIC database flag `alternatedrugavailable` is false on every row even where the text names alternatives, so alternatives here are read from the text, not from that flag."]
open(os.path.join(HERE, "..", "..", "docs", "cpic-signoff.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
