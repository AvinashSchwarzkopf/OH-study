#!/usr/bin/env python3
"""Regenerate js/patterns.js from the design CSV.

Usage:  python3 build_patterns.py ["../OH Study design - Current version.csv"]
Re-run this whenever the CSV changes; nothing else needs editing.
"""
import csv, json, re, sys, os

CSV = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(__file__), "..", "OH Study design - Current version.csv")
OUT = os.path.join(os.path.dirname(__file__), "js", "patterns.js")

def num(x):
    x = (x or "").strip()
    return int(x) if x.isdigit() else None

rows = list(csv.DictReader(open(CSV, newline="")))
group, patterns, warnings = "", [], []

for r in rows:
    if (r.get("Group") or "").strip():
        group = r["Group"].strip()
    name = (r.get("Pattern") or "").strip()
    if not name:
        continue
    bags = [(r.get("Bag%d" % i) or "").strip().upper() for i in range(1, 5)]
    if not all(bags):
        warnings.append("%s: missing one or more bags" % name)
        continue
    bad = sorted({c for b in bags for c in b if c not in "ABCD"})
    if bad:
        warnings.append("%s: bag contains non-ABCD character(s) %s" % (name, bad))
    patterns.append({
        "id": re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_"),
        "group": group,
        "name": name,
        "bags": bags,
        "valid": not bad,
        "note": (r.get("Note") or "").strip(),
        "n_evidence_bag1": num(r.get("# of evid supporting learning in B1")),
        "n_critical_later": num(r.get("# of critical pred trials in later bags")),
        "n_elements_in_pred": num(r.get("# of elts to be included in pred")),
    })

with open(OUT, "w") as f:
    f.write("// GENERATED FILE - do not edit by hand.\n")
    f.write("// Source: %s\n" % os.path.basename(CSV))
    f.write("// Regenerate with: python3 build_patterns.py\n")
    f.write("const PATTERNS = %s;\n" % json.dumps(patterns, indent=2))

print("wrote %s  (%d patterns, %d draws)" % (
    OUT, len(patterns), sum(len(b) for p in patterns for b in p["bags"])))
for w in warnings:
    print("  WARNING:", w)
