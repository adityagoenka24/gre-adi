#!/usr/bin/env python3
"""Compact inventory of a bank file, for choosing a practice set's 30 questions.

Usage: propose.py <topic/file.json> [more...]      (paths relative to pro/bank)

Prints one line per question: id, difficulty, type, exhibit flag, stratum and a
stem snippet. Marks every question already shipped in another practice patch, so
a sheet never reprints a question the student met in a neighbouring set.
"""
import json, os, sys, glob, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BANK = os.path.join(ROOT, "pro", "bank")
T = {"mcq": "MCQ", "quantitative_comparison": "QC",
     "numeric_entry": "NE", "multiple_answer": "SA"}
ORDER = ["easy", "medium", "hard", "extreme_hard"]


def shipped():
    """id -> patch code, for every question already in a practice set."""
    used = {}
    for f in glob.glob(os.path.join(HERE, "*.json")):
        code = os.path.basename(f)[:-5]
        try:
            d = json.load(open(f))
        except Exception:
            continue
        for q in d.get("questions", []):
            used[q["id"]] = code
    return used


def stratum(q):
    i = q["id"]
    if "-KMF2-" in i:
        return "kmf2"
    if "-KMF-" in i:
        return "kmf "
    if i.startswith("SEC-"):
        return "sec "
    return "gen "


def main(paths):
    used = shipped()
    for rel in paths:
        path = os.path.join(BANK, rel)
        d = json.load(open(path))
        qs = d["questions"]
        meta = d.get("meta", {})
        print("=" * 100)
        print("{}  {}  n={}".format(meta.get("subtopic_id", "?"), rel, len(qs)))
        free = [q for q in qs if q["id"] not in used]
        print("already in another sheet: {} · available: {}".format(len(qs) - len(free), len(free)))
        for lvl in ORDER:
            grp = [q for q in qs if q.get("difficulty") == lvl]
            if not grp:
                continue
            navail = sum(1 for q in grp if q["id"] not in used)
            print("-- {} ({} total, {} available) --".format(lvl, len(grp), navail))
            for q in grp:
                ex = "FIG" if q.get("svg") else ("fd!" if q.get("figure_description") else
                     ("CHT" if q.get("chart") else ("TBL" if q.get("table_data") else "   ")))
                mark = "x" if q["id"] in used else " "
                stem = " ".join(q["question"].split())[:88]
                tags = ",".join(q.get("tags", [])[:2])
                print(" {} {:22s} {:3s} {} {} {:22s} {}".format(
                    mark, q["id"], T.get(q["type"], q["type"]), ex, stratum(q), tags[:22], stem))
        tc = collections.Counter(T.get(q["type"], "?") for q in free)
        print("available type mix:", dict(tc))


if __name__ == "__main__":
    main(sys.argv[1:])
