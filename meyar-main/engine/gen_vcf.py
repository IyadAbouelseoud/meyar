#!/usr/bin/env python3
"""Synthetic GRCh38 (chr-prefixed) VCF generator for Meyar demo patients.

Every defining position, rsID, REF, ALT, and star-allele variant mapping is
extracted directly from PharmCAT 3.4.0's bundled allele definition files
(/pharmcat/pharmcat_positions.vcf and *_translation.json inside pharmcat.jar,
CLINPGX 2026-07-13-11-40). No coordinates are typed from memory.

CYP2D6 copy number cannot be represented in a plain SNP/INDEL VCF for PharmCAT;
the CYP2D6 duplication case (demo-006) is emitted as a mock PharmCAT
outside-call file (<patientId>.outside.tsv) instead.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple

CONTIG_ORDER = {"chr1": 1, "chr10": 10, "chr12": 12}

CONTIG_HEADERS = [
    '##contig=<ID=chr1,assembly=GRCh38.p14,species="Homo sapiens">',
    '##contig=<ID=chr10,assembly=GRCh38.p14,species="Homo sapiens">',
    '##contig=<ID=chr12,assembly=GRCh38.p14,species="Homo sapiens">',
]

# Authoritative GRCh38 defining positions extracted from pgkb/pharmcat:3.4.0
# (/pharmcat/pharmcat_positions.vcf) for DPYD (83), CYP2C19 (35), CYP2C9 (88),
# and SLCO1B1 (35) -> 241 positions total.
# Tuple format: (chrom, pos, rsid, ref, alt, info)
PHARMCAT_POSITIONS: List[Tuple[str, int, str, str, str, str]] = [
    # DPYD (chr1, 83 positions)
    ("chr1", 97078987, "rs114096998", "G", "T", "PX=DPYD"),
    ("chr1", 97078993, "rs148799944", "C", "G", "PX=DPYD"),
    ("chr1", 97079005, "rs140114515", "C", "T", "PX=DPYD"),
    ("chr1", 97079071, "rs1801268", "C", "A", "PX=DPYD"),
    ("chr1", 97079076, "rs139459586", "A", "C", "PX=DPYD"),
    ("chr1", 97079077, "rs202144771", "G", "A", "PX=DPYD"),
    ("chr1", 97079121, "rs72547601", "T", "C", "PX=DPYD"),
    ("chr1", 97079133, "rs72547602", "T", "A", "PX=DPYD"),
    ("chr1", 97079139, "rs145529148", "T", "C", "PX=DPYD"),
    ("chr1", 97082365, "rs141044036", "T", "C", "PX=DPYD"),
    ("chr1", 97082391, "rs67376798", "T", "A", "PX=DPYD"),
    ("chr1", 97098598, "rs1801267", "C", "T", "PX=DPYD"),
    ("chr1", 97098599, "rs147545709", "G", "A", "PX=DPYD"),
    ("chr1", 97098616, "rs55674432", "C", "A", "PX=DPYD"),
    ("chr1", 97098632, "rs201035051", "T", "G", "PX=DPYD"),
    ("chr1", 97193109, "rs60139309", "T", "C", "PX=DPYD"),
    ("chr1", 97193209, "rs200687447", "C", "T", "PX=DPYD"),
    ("chr1", 97234958, "rs199634007", "G", "T", "PX=DPYD"),
    ("chr1", 97234991, "rs56005131", "G", "T", "PX=DPYD"),
    ("chr1", 97305279, "rs112766203", "G", "A", "PX=DPYD"),
    ("chr1", 97305363, "rs60511679", "A", "C", "PX=DPYD"),
    ("chr1", 97305364, "rs1801160", "C", "T", "PX=DPYD"),
    ("chr1", 97305372, "rs146529561", "G", "A", "PX=DPYD"),
    ("chr1", 97306195, "rs145548112", "C", "T", "PX=DPYD"),
    ("chr1", 97373598, "rs137999090", "C", "T", "PX=DPYD"),
    ("chr1", 97373629, "rs138545885", "C", "A", "PX=DPYD"),
    ("chr1", 97382461, "rs55971861", "T", "G", "PX=DPYD"),
    ("chr1", 97450058, "rs3918290", "C", "T", "PX=DPYD"),
    ("chr1", 97450059, "rs3918289", "G", "C", "PX=DPYD"),
    ("chr1", 97450065, "rs72549303", "TG", "T", "PX=DPYD"),
    ("chr1", 97450068, "rs17376848", "A", "G", "PX=DPYD"),
    ("chr1", 97450168, "rs147601618", "A", "G", "PX=DPYD"),
    ("chr1", 97450187, "rs145773863", "C", "T", "PX=DPYD"),
    ("chr1", 97450189, "rs138616379", "C", "T", "PX=DPYD"),
    ("chr1", 97450190, "rs59086055", "G", "A", "PX=DPYD"),
    ("chr1", 97515784, "rs201615754", "C", "A", "PX=DPYD"),
    ("chr1", 97515787, "rs55886062", "A", "C", "PX=DPYD"),
    ("chr1", 97515839, "rs1801159", "T", "C", "PX=DPYD"),
    ("chr1", 97515851, "rs142619737", "C", "T", "PX=DPYD"),
    ("chr1", 97515865, "rs1801158", "C", "T", "PX=DPYD"),
    ("chr1", 97515889, "rs190951787", "G", "C", "PX=DPYD"),
    ("chr1", 97515923, "rs148994843", "C", "T", "PX=DPYD"),
    ("chr1", 97549565, "rs138391898", "C", "T", "PX=DPYD"),
    ("chr1", 97549600, "rs111858276", "T", "C", "PX=DPYD"),
    ("chr1", 97549609, "rs72549304", "G", "A", "PX=DPYD"),
    ("chr1", 97549681, "rs199549923", "G", "T", "PX=DPYD"),
    ("chr1", 97549713, "rs57918000", "G", "A", "PX=DPYD"),
    ("chr1", 97549726, "rs144395748", "G", "C", "PX=DPYD"),
    ("chr1", 97549735, "rs72975710", "G", "A", "PX=DPYD"),
    ("chr1", 97573785, "rs186169810", "A", "C", "PX=DPYD"),
    ("chr1", 97573805, "rs142512579", "C", "T", "PX=DPYD"),
    ("chr1", 97573821, "rs764666241", "C", "A", "PX=DPYD"),
    ("chr1", 97573839, "rs200064537", "A", "T", "PX=DPYD"),
    ("chr1", 97573863, "rs56038477", "C", "T", "PX=DPYD"),
    ("chr1", 97573881, "rs61622928", "C", "T", "PX=DPYD"),
    ("chr1", 97573918, "rs143815742", "C", "A", "PX=DPYD"),
    ("chr1", 97573919, "rs140602333", "G", "A", "PX=DPYD"),
    ("chr1", 97573943, "rs78060119", "C", "A", "PX=DPYD"),
    ("chr1", 97579893, "rs75017182", "G", "C", "PX=DPYD"),
    ("chr1", 97593238, "rs72549305", "T", "C", "PX=DPYD"),
    ("chr1", 97593289, "rs143154602", "G", "A", "PX=DPYD"),
    ("chr1", 97593322, "rs183385770", "C", "T", "PX=DPYD"),
    ("chr1", 97593343, "rs72549306", "C", "A", "PX=DPYD"),
    ("chr1", 97593379, "rs201018345", "C", "T", "PX=DPYD"),
    ("chr1", 97595083, "rs145112791", "G", "A", "PX=DPYD"),
    ("chr1", 97595088, "rs150437414", "A", "G", "PX=DPYD"),
    ("chr1", 97595149, "rs146356975", "T", "C", "PX=DPYD"),
    ("chr1", 97679170, "rs45589337", "T", "C", "PX=DPYD"),
    ("chr1", 97691776, "rs1801266", "G", "A", "PX=DPYD"),
    ("chr1", 97699399, "rs72549307", "T", "C", "PX=DPYD"),
    ("chr1", 97699430, "rs72549308", "T", "G", "PX=DPYD"),
    ("chr1", 97699474, "rs115232898", "T", "C", "PX=DPYD"),
    ("chr1", 97699506, "rs6670886", "C", "T", "PX=DPYD"),
    ("chr1", 97699533, "rs139834141", "C", "T", "PX=DPYD"),
    ("chr1", 97699535, "rs2297595", "T", "C", "PX=DPYD"),
    ("chr1", 97721542, "rs200562975", "T", "C", "PX=DPYD"),
    ("chr1", 97721650, "rs141462178", "T", "C", "PX=DPYD"),
    ("chr1", 97740400, "rs150385342", "C", "T", "PX=DPYD"),
    ("chr1", 97740410, "rs72549309", "GATGA", "G", "PX=DPYD"),
    ("chr1", 97883329, "rs1801265", "A", "G", "PX=DPYD"),
    ("chr1", 97883352, "rs80081766", "C", "T", "PX=DPYD"),
    ("chr1", 97883353, "rs72549310", "G", "A", "PX=DPYD"),
    ("chr1", 97883368, "rs150036960", "G", "C", "PX=DPYD"),
    # CYP2C19 (chr10, 35 positions)
    ("chr10", 94761900, "rs12248560", "C", "T", "PX=CYP2C19"),
    ("chr10", 94762706, "rs28399504", "A", "G", "PX=CYP2C19"),
    ("chr10", 94762712, "rs367543002", "C", "T", "PX=CYP2C19"),
    ("chr10", 94762715, "rs367543003", "T", "C", "PX=CYP2C19"),
    ("chr10", 94762755, "rs55752064", "T", "C", "PX=CYP2C19"),
    ("chr10", 94762760, "rs17882687", "A", "C", "PX=CYP2C19"),
    ("chr10", 94762788, "rs1564656981", "A", "T", "PX=CYP2C19"),
    ("chr10", 94762856, "rs1564657013", "A", "G", "PX=CYP2C19"),
    ("chr10", 94775106, "rs145328984", "C", "T", "PX=CYP2C19"),
    ("chr10", 94775121, "rs1564660997", "C", "T", "PX=CYP2C19"),
    ("chr10", 94775160, "rs118203756", "G", "C", "PX=CYP2C19"),
    ("chr10", 94775185, "rs1288601658", "A", "G", "PX=CYP2C19"),
    ("chr10", 94775367, "rs12769205", "A", "G", "PX=CYP2C19"),
    ("chr10", 94775416, "rs41291556", "T", "C", "PX=CYP2C19"),
    ("chr10", 94775423, "rs17885179", "A", "C", "PX=CYP2C19"),
    ("chr10", 94775453, "rs72552267", "G", "A", "PX=CYP2C19"),
    ("chr10", 94775489, "rs17884712", "G", "A", "PX=CYP2C19"),
    ("chr10", 94775507, "rs58973490", "G", "A", "PX=CYP2C19"),
    ("chr10", 94780544, "rs57700608", "A", "G", "PX=CYP2C19"),
    ("chr10", 94780574, "rs140278421", "G", "C", "PX=CYP2C19"),
    ("chr10", 94780579, "rs370803989", "G", "A", "PX=CYP2C19"),
    ("chr10", 94780653, "rs4986893", "G", "A", "PX=CYP2C19"),
    ("chr10", 94781858, "rs6413438", "C", "T", "PX=CYP2C19"),
    ("chr10", 94781859, "rs4244285", "G", "A", "PX=CYP2C19"),
    ("chr10", 94781944, "rs375781227", "G", "A", "PX=CYP2C19"),
    ("chr10", 94781999, "rs72558186", "T", "A", "PX=CYP2C19"),
    ("chr10", 94842861, "rs138142612", "G", "A", "PX=CYP2C19"),
    ("chr10", 94842866, "rs3758581", "A", "G", "PX=CYP2C19"),
    ("chr10", 94842879, "rs118203757", "G", "A", "PX=CYP2C19"),
    ("chr10", 94842995, "rs113934938", "G", "A", "PX=CYP2C19"),
    ("chr10", 94849995, "rs17879685", "C", "T", "PX=CYP2C19"),
    ("chr10", 94852738, "rs56337013", "C", "T", "PX=CYP2C19"),
    ("chr10", 94852765, "rs192154563", "C", "T", "PX=CYP2C19"),
    ("chr10", 94852785, "rs118203759", "C", "G", "PX=CYP2C19"),
    ("chr10", 94852914, "rs55640102", "A", "C", "PX=CYP2C19"),
    # CYP2C9 (chr10, 88 positions)
    ("chr10", 94938683, "rs114071557", "A", "G", "PX=CYP2C9"),
    ("chr10", 94938719, ".", "T", "G", "PX=CYP2C9"),
    ("chr10", 94938737, "rs67807361", "C", "A", "PX=CYP2C9"),
    ("chr10", 94938771, "rs142240658", "C", "T", "PX=CYP2C9"),
    ("chr10", 94938788, ".", "C", "T", "PX=CYP2C9"),
    ("chr10", 94938800, "rs1364419386", "G", "A", "PX=CYP2C9"),
    ("chr10", 94938803, "rs2031308986", "A", "G", "PX=CYP2C9"),
    ("chr10", 94938828, "rs564813580", "A", "G", "PX=CYP2C9"),
    ("chr10", 94941897, "rs371055887", "G", "C", "PX=CYP2C9"),
    ("chr10", 94941915, "rs1216169538", "G", "A", "PX=CYP2C9"),
    ("chr10", 94941958, "rs72558187", "T", "C", "PX=CYP2C9"),
    ("chr10", 94941975, "rs2493006942", "G", "A", "PX=CYP2C9"),
    ("chr10", 94941976, "rs761033063", "G", "C", "PX=CYP2C9"),
    ("chr10", 94941982, "rs762239445", "G", "T", "PX=CYP2C9"),
    ("chr10", 94942018, ".", "T", "C", "PX=CYP2C9"),
    ("chr10", 94942203, "rs771237265", "A", "C", "PX=CYP2C9"),
    ("chr10", 94942205, "rs1304490498", "CAATGGAAAGA", "C", "PX=CYP2C9"),
    ("chr10", 94942216, "rs774607211", "A", "G", "PX=CYP2C9"),
    ("chr10", 94942226, ".", "G", "T", "PX=CYP2C9"),
    ("chr10", 94942230, "rs767576260", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942231, "rs12414460", "G", "A", "PX=CYP2C9"),
    ("chr10", 94942233, "rs375805362", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942234, "rs72558189", "G", "A,T", "PX=CYP2C9"),
    ("chr10", 94942240, "rs530507053", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942243, "rs1375956433", "T", "G", "PX=CYP2C9"),
    ("chr10", 94942249, "rs200965026", "C", "G,T", "PX=CYP2C9"),
    ("chr10", 94942254, "rs199523631", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942255, "rs200183364", "G", "A", "PX=CYP2C9"),
    ("chr10", 94942290, "rs1799853", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942291, "rs141489852", "G", "A", "PX=CYP2C9"),
    ("chr10", 94942305, "rs754487195", "G", "A", "PX=CYP2C9"),
    ("chr10", 94942306, "rs1289704600", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942308, "rs17847037", "C", "T", "PX=CYP2C9"),
    ("chr10", 94942309, "rs7900194", "G", "A,T", "PX=CYP2C9"),
    ("chr10", 94947782, "rs72558190", "C", "A", "PX=CYP2C9"),
    ("chr10", 94947785, "rs774550549", "C", "T", "PX=CYP2C9"),
    ("chr10", 94947817, "rs199539783", "C", "G", "PX=CYP2C9"),
    ("chr10", 94947869, "rs2492587526", "A", "G", "PX=CYP2C9"),
    ("chr10", 94947907, ".", "A", "C", "PX=CYP2C9"),
    ("chr10", 94947917, "rs1326630788", "T", "C", "PX=CYP2C9"),
    ("chr10", 94947938, "rs2031531005", "A", "T", "PX=CYP2C9"),
    ("chr10", 94947939, "rs370100007", "G", "T", "PX=CYP2C9"),
    ("chr10", 94949129, ".", "A", "G", "PX=CYP2C9"),
    ("chr10", 94949144, "rs2492591692", "C", "T", "PX=CYP2C9"),
    ("chr10", 94949145, "rs772782449", "C", "T", "PX=CYP2C9"),
    ("chr10", 94949161, ".", "AT", "A", "PX=CYP2C9"),
    ("chr10", 94949184, "rs369745682", "T", "C", "PX=CYP2C9"),
    ("chr10", 94949189, "rs1295294399", "A", "C", "PX=CYP2C9"),
    ("chr10", 94949217, "rs2256871", "A", "G", "PX=CYP2C9"),
    ("chr10", 94949278, "rs996190254", "G", "A", "PX=CYP2C9"),
    ("chr10", 94949280, "rs9332130", "A", "G", "PX=CYP2C9"),
    ("chr10", 94949281, "rs9332131", "GA", "G", "PX=CYP2C9"),
    ("chr10", 94972119, "rs182132442", "C", "A", "PX=CYP2C9"),
    ("chr10", 94972123, ".", "C", "G", "PX=CYP2C9"),
    ("chr10", 94972134, "rs2492634549", "A", "G", "PX=CYP2C9"),
    ("chr10", 94972179, "rs72558192", "A", "G", "PX=CYP2C9"),
    ("chr10", 94972180, "rs988617574", "C", "G", "PX=CYP2C9"),
    ("chr10", 94972183, ".", "A", "T", "PX=CYP2C9"),
    ("chr10", 94972194, "rs546318684", "A", "C", "PX=CYP2C9"),
    ("chr10", 94972233, "rs1237225311", "C", "T", "PX=CYP2C9"),
    ("chr10", 94981199, ".", "G", "T", "PX=CYP2C9"),
    ("chr10", 94981201, "rs57505750", "T", "C", "PX=CYP2C9"),
    ("chr10", 94981224, "rs28371685", "C", "T", "PX=CYP2C9"),
    ("chr10", 94981225, "rs367826293", "G", "A", "PX=CYP2C9"),
    ("chr10", 94981230, "rs1274535931", "C", "A", "PX=CYP2C9"),
    ("chr10", 94981250, "rs750820937", "C", "A,G", "PX=CYP2C9"),
    ("chr10", 94981258, "rs1297714792", "C", "T", "PX=CYP2C9"),
    ("chr10", 94981281, "rs749060448", "G", "A", "PX=CYP2C9"),
    ("chr10", 94981296, "rs1057910", "A", "C", "PX=CYP2C9"),
    ("chr10", 94981297, "rs56165452", "T", "C", "PX=CYP2C9"),
    ("chr10", 94981301, "rs28371686", "C", "G", "PX=CYP2C9"),
    ("chr10", 94981302, "rs1250577724", "C", "A", "PX=CYP2C9"),
    ("chr10", 94981305, "rs578144976", "C", "G", "PX=CYP2C9"),
    ("chr10", 94981365, "rs2492650213", "C", "T", "PX=CYP2C9"),
    ("chr10", 94981371, "rs542577750", "G", "A", "PX=CYP2C9"),
    ("chr10", 94986042, "rs764211126", "A", "G", "PX=CYP2C9"),
    ("chr10", 94986073, "rs72558193", "A", "C", "PX=CYP2C9"),
    ("chr10", 94986136, "rs1254213342", "A", "C", "PX=CYP2C9"),
    ("chr10", 94986174, "rs1441296358", "G", "C", "PX=CYP2C9"),
    ("chr10", 94988852, "rs776908257", "C", "T", "PX=CYP2C9"),
    ("chr10", 94988855, "rs2492662738", "A", "T", "PX=CYP2C9"),
    ("chr10", 94988880, "rs2492662839", "G", "T", "PX=CYP2C9"),
    ("chr10", 94988917, "rs769942899", "G", "C", "PX=CYP2C9"),
    ("chr10", 94988925, "rs202201137", "A", "G", "PX=CYP2C9"),
    ("chr10", 94988955, "rs767284820", "T", "C", "PX=CYP2C9"),
    ("chr10", 94988984, "rs781583846", "G", "A", "PX=CYP2C9"),
    ("chr10", 94989020, "rs9332239", "C", "T", "PX=CYP2C9"),
    ("chr10", 94989023, "rs868182778", "G", "T", "PX=CYP2C9"),
    # SLCO1B1 (chr12, 35 positions)
    ("chr12", 21141575, "rs185905373", "A", "T", "PX=SLCO1B1"),
    ("chr12", 21172675, "rs556524705", "G", "C", "PX=SLCO1B1"),
    ("chr12", 21172734, "rs139257324", "C", "T", "PX=SLCO1B1"),
    ("chr12", 21172735, "rs61760182", "G", "A", "PX=SLCO1B1"),
    ("chr12", 21172776, "rs373327528", "G", "A", "PX=SLCO1B1"),
    ("chr12", 21172782, "rs56101265", "T", "C", "PX=SLCO1B1"),
    ("chr12", 21176804, "rs2306283", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21176868, "rs2306282", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21176871, "rs145144129", "G", "C", "PX=SLCO1B1"),
    ("chr12", 21176879, "rs11045819", "C", "A", "PX=SLCO1B1"),
    ("chr12", 21176898, "rs77271279", "G", "T", "PX=SLCO1B1"),
    ("chr12", 21178612, "rs141467543", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21178615, "rs4149056", "T", "C", "PX=SLCO1B1"),
    ("chr12", 21178653, "rs200331427", "C", "G", "PX=SLCO1B1"),
    ("chr12", 21178926, "rs201722521", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21178957, "rs79135870", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21196951, "rs11045852", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21196975, "rs183501729", "C", "T", "PX=SLCO1B1"),
    ("chr12", 21196976, "rs11045853", "G", "A", "PX=SLCO1B1"),
    ("chr12", 21200544, "rs72559747", "C", "G", "PX=SLCO1B1"),
    ("chr12", 21200595, "rs55901008", "T", "C", "PX=SLCO1B1"),
    ("chr12", 21200673, "rs756393362", "G", "A", "PX=SLCO1B1"),
    ("chr12", 21202553, "rs1228465562", "T", "G", "PX=SLCO1B1"),
    ("chr12", 21202555, "rs59113707", "C", "G", "PX=SLCO1B1"),
    ("chr12", 21202664, "rs142965323", "G", "A", "PX=SLCO1B1"),
    ("chr12", 21205921, "rs72559748", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21205999, "rs59502379", "G", "C", "PX=SLCO1B1"),
    ("chr12", 21206031, "rs74064213", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21222355, "rs71581941", "C", "T", "PX=SLCO1B1"),
    ("chr12", 21224840, "rs200994482", "G", "A", "PX=SLCO1B1"),
    ("chr12", 21239042, "rs34671512", "A", "C", "PX=SLCO1B1"),
    ("chr12", 21239077, "rs56199088", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21239113, "rs55737008", "A", "G", "PX=SLCO1B1"),
    ("chr12", 21239145, "rs200995543", "C", "T", "PX=SLCO1B1"),
    ("chr12", 21239158, "rs140790673", "C", "T", "PX=SLCO1B1"),
]

# Single-haplotype non-reference ALT allele index sets extracted from PharmCAT 3.4.0.
# All other defining positions for the gene are 0 (GRCh38 reference).
HAPLOTYPE_VARIANTS: Dict[str, Dict[str, Dict[Tuple[str, int], int]]] = {
    "CYP2C19": {
        "*1": {("chr10", 94842866): 1},
        "*2": {("chr10", 94775367): 1, ("chr10", 94781859): 1, ("chr10", 94842866): 1},
        "*17": {("chr10", 94761900): 1, ("chr10", 94842866): 1},
    },
    "CYP2C9": {
        "*1": {},
        "*2": {("chr10", 94942290): 1},
        "*3": {("chr10", 94981296): 1},
    },
    "SLCO1B1": {
        "*1": {},
        "*5": {("chr12", 21178615): 1},
    },
    "DPYD": {
        "Reference": {},
        "c.1905+1G>A (*2A)": {("chr1", 97450058): 1},
    },
}

# Positions deliberately omitted from demo-006.vcf so A5 sees a real coverage gap:
#   - CYP2C19: rs28399504 (*4), rs17882687 (*15/*35), rs4986893 (*3)
#   - CYP2C9:  rs1799853 (*2), rs1057910 (*3)
DEMO_006_OMITTED: Set[Tuple[str, int]] = {
    ("chr10", 94762706),
    ("chr10", 94762760),
    ("chr10", 94780653),
    ("chr10", 94942290),
    ("chr10", 94981296),
}

DEMO_PATIENTS: Dict[str, Dict[str, object]] = {
    "demo-001": {
        "diplotypes": {
            "CYP2C19": ("*2", "*2"),
            "CYP2C9": ("*1", "*1"),
            "SLCO1B1": ("*1", "*1"),
            "DPYD": ("Reference", "Reference"),
        },
        "omitted": set(),
    },
    "demo-002": {
        "diplotypes": {
            "CYP2C19": ("*1", "*1"),
            "CYP2C9": ("*1", "*1"),
            "SLCO1B1": ("*1", "*1"),
            "DPYD": ("Reference", "Reference"),
        },
        "omitted": set(),
    },
    "demo-003": {
        "diplotypes": {
            "CYP2C19": ("*1", "*17"),
            "CYP2C9": ("*1", "*1"),
            "SLCO1B1": ("*1", "*5"),
            "DPYD": ("Reference", "Reference"),
        },
        "omitted": set(),
    },
    "demo-004": {
        "diplotypes": {
            "CYP2C19": ("*17", "*17"),
            "CYP2C9": ("*1", "*2"),
            "SLCO1B1": ("*1", "*1"),
            "DPYD": ("Reference", "Reference"),
        },
        "omitted": set(),
    },
    "demo-005": {
        "diplotypes": {
            "CYP2C19": ("*1", "*1"),
            "CYP2C9": ("*2", "*3"),
            "SLCO1B1": ("*1", "*1"),
            "DPYD": ("Reference", "c.1905+1G>A (*2A)"),
        },
        "omitted": set(),
    },
    "demo-006": {
        "diplotypes": {
            "CYP2C19": ("*1", "*1"),
            "CYP2C9": ("*1", "*1"),
            "SLCO1B1": ("*1", "*1"),
            "DPYD": ("Reference", "Reference"),
        },
        "omitted": DEMO_006_OMITTED,
        "outside_calls": [
            "# mock: true",
            "# source: Mock CNV-aware caller (StellarPGx-compatible synthetic demo; not run in prototype)",
            "CYP2D6\t*1/*2x2",
        ],
    },
}


def build_allele_map(diplotypes: Dict[str, Tuple[str, str]]) -> Dict[Tuple[str, int], str]:
    """Compute phased genotype strings (e.g. '0|1') keyed by (chrom, pos)."""
    gt_by_pos: Dict[Tuple[str, int], str] = {}
    for gene, (hap1, hap2) in diplotypes.items():
        map1 = HAPLOTYPE_VARIANTS[gene][hap1]
        map2 = HAPLOTYPE_VARIANTS[gene][hap2]
        for pos_key in set(map1) | set(map2):
            gt_by_pos[pos_key] = f"{map1.get(pos_key, 0)}|{map2.get(pos_key, 0)}"
    return gt_by_pos


def write_patient_files(patient_id: str, out_dir: Path) -> List[Path]:
    """Write <patientId>.vcf, <patientId>.origin.json, and optional .outside.tsv."""
    spec = DEMO_PATIENTS[patient_id]
    diplotypes: Dict[str, Tuple[str, str]] = spec["diplotypes"]  # type: ignore[assignment]
    omitted: Set[Tuple[str, int]] = spec["omitted"]  # type: ignore[assignment]
    gt_by_pos = build_allele_map(diplotypes)

    out_dir.mkdir(parents=True, exist_ok=True)
    written: List[Path] = []

    vcf_path = out_dir / f"{patient_id}.vcf"
    header_lines = [
        "##fileformat=VCFv4.2",
        "##source=Meyar synthetic VCF generator (PharmCAT 3.4.0 / CLINPGX 2026-07-13-11-40 GRCh38 definitions)",
        "##reference=GRCh38.p14",
        *CONTIG_HEADERS,
        '##FILTER=<ID=PASS,Description="All filters passed">',
        '##INFO=<ID=PX,Number=.,Type=String,Description="Gene">',
        '##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">',
        "\t".join(["#CHROM", "POS", "ID", "REF", "ALT", "QUAL", "FILTER", "INFO", "FORMAT", patient_id]),
    ]

    records = sorted(
        (row for row in PHARMCAT_POSITIONS if (row[0], row[1]) not in omitted),
        key=lambda r: (CONTIG_ORDER[r[0]], r[1]),
    )
    body_lines = [
        "\t".join([chrom, str(pos), rsid, ref, alt, ".", "PASS", info, "GT", gt_by_pos.get((chrom, pos), "0|0")])
        for chrom, pos, rsid, ref, alt, info in records
    ]
    vcf_path.write_text("\n".join(header_lines + body_lines) + "\n", encoding="utf-8", newline="\n")
    written.append(vcf_path)

    origin_path = out_dir / f"{patient_id}.origin.json"
    origin_path.write_text(json.dumps({"sampleOrigin": "germline"}, indent=2) + "\n", encoding="utf-8", newline="\n")
    written.append(origin_path)

    outside_calls = spec.get("outside_calls")
    if outside_calls:
        outside_path = out_dir / f"{patient_id}.outside.tsv"
        outside_path.write_text("\n".join(outside_calls) + "\n", encoding="utf-8", newline="\n")  # type: ignore[arg-type]
        written.append(outside_path)

    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate synthetic GRCh38 VCFs for Meyar demo patients.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Generate files for demo-001 through demo-006.")
    group.add_argument("--patient", nargs="+", choices=sorted(DEMO_PATIENTS), help="Generate files for specific patient IDs.")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "data" / "in",
        help="Output directory (default: engine/data/in).",
    )
    args = parser.parse_args()

    patients = sorted(DEMO_PATIENTS) if args.all else args.patient
    for pid in patients:
        paths = write_patient_files(pid, args.out_dir)
        print(f"{pid}: wrote {', '.join(p.name for p in paths)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
