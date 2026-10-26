#!/usr/bin/env python3
"""Regenerate js/patterns.js from the design CSV.

Usage:  python3 build_patterns.py ["OH Study design - Pattern organization.csv"]
Re-run this whenever the CSV changes; nothing else needs editing.

The CSV holds one or more side-by-side tables, each starting at a header
cell that begins with "Group" ("Group 1", "Group 2", ...). Each table is
one study: table 1 -> study 1, table 2 -> study 2. A pattern that appears
in several tables with the same bags (the shared practice) is kept once
and tagged with every study it belongs to.
"""
import csv, json, re, sys, os

CSV = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "OH Study design - Pattern organization.csv")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "js", "patterns.js")

def num(x):
    x = (x or "").strip()
    return int(x) if x.isdigit() else None

rows = list(csv.reader(open(CSV, newline="", encoding="utf-8-sig")))
header = [h.strip() for h in rows[0]]
starts = [i for i, h in enumerate(header) if h.startswith("Group")]
if not starts:
    sys.exit("No 'Group' header found in %s" % CSV)
ends = starts[1:] + [len(header)]

patterns, by_id, warnings = [], {}, []

for study, (lo, hi) in enumerate(zip(starts, ends), start=1):
    cols = {header[i]: i for i in range(hi - 1, lo - 1, -1) if header[i]}
    cols["Group"] = lo
    get = lambda r, k: (r[cols[k]] if k in cols and cols[k] < len(r) else "").strip()
    group = ""
    for r in rows[1:]:
        if get(r, "Group"):
            group = get(r, "Group")
        name = get(r, "Pattern")
        if not name:
            continue
        bags = [get(r, "Bag%d" % i).upper() for i in range(1, 5)]
        if not all(bags):
            warnings.append("study %d, %s: missing one or more bags" % (study, name))
            continue
        pid = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        if pid in by_id:
            prev = by_id[pid]
            if prev["bags"] != bags:
                sys.exit("Pattern id %r appears twice with different bags "
                         "(studies %s and %d) - rename one in the CSV."
                         % (pid, prev["studies"], study))
            prev["studies"].append(study)
            continue
        bad = sorted({c for b in bags for c in b if c not in "ABCD"})
        if bad:
            warnings.append("%s: bag contains non-ABCD character(s) %s" % (name, bad))
        p = {
            "id": pid,
            "studies": [study],
            "group": group,
            "name": name,
            "bags": bags,
            "valid": not bad,
            "note": get(r, "Note"),
            "n_evidence_bag1": num(get(r, "# of evid supporting learning in B1")),
            "n_critical_later": num(get(r, "# of critical pred trials in later bags")),
            "n_elements_in_pred": num(get(r, "# of elts to be included in pred")),
        }
        patterns.append(p)
        by_id[pid] = p

with open(OUT, "w") as f:
    f.write("// GENERATED FILE - do not edit by hand.\n")
    f.write("// Source: %s\n" % os.path.basename(CSV))
    f.write("// Regenerate with: python3 build_patterns.py\n")
    f.write("const PATTERNS = %s;\n" % json.dumps(patterns, indent=2))

print("wrote %s  (%d patterns)" % (OUT, len(patterns)))
for s in range(1, len(starts) + 1):
    mine = [p for p in patterns if s in p["studies"]]
    print("  study %d: %d patterns, %d draws  (%s)" % (
        s, len(mine), sum(len(b) for p in mine for b in p["bags"]),
        ", ".join(p["id"] for p in mine)))
for w in warnings:
    print("  WARNING:", w)
