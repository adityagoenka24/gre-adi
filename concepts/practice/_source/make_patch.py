#!/usr/bin/env python3
"""Build a practice patch from an order file: verbatim copies of bank questions.

Usage: make_patch.py <order.json> [--write]

order.json = {"set": {...the set block...}, "ids": ["GEO-CIR-012", ...]}

The bank is the source of truth, so every question is copied byte-for-byte from
pro/bank (svg, chart, table_data and figure_description included). Refuses to
write if an id is missing, duplicated, ambiguous, or already shipped in another
practice set.
"""
import json, os, sys, glob, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BANK = os.path.join(ROOT, "pro", "bank")
ORDER = ["easy", "medium", "hard", "extreme_hard"]
T = {"mcq": "MCQ", "quantitative_comparison": "QC",
     "numeric_entry": "NE", "multiple_answer": "SA"}


def main(order_path, write=False):
    order = json.load(open(order_path))
    s, ids = order["set"], order["ids"]
    code = s["subtopic_id"]
    errs, warns = [], []

    if len(ids) != len(set(ids)):
        dup = [i for i, n in collections.Counter(ids).items() if n > 1]
        errs.append("repeated ids in the order: " + ", ".join(dup))

    pool = {}
    for bf in s["bank_files"]:
        for q in json.load(open(os.path.join(BANK, bf)))["questions"]:
            pool.setdefault(q["id"], []).append((bf, q))

    used = {}
    for f in glob.glob(os.path.join(HERE, "*.json")):
        other = os.path.basename(f)[:-5]
        if other == code:
            continue
        try:
            d = json.load(open(f))
        except Exception:
            continue
        for q in d.get("questions", []):
            used[q["id"]] = other

    picked = []
    for qid in ids:
        if qid not in pool:
            errs.append("{}: not in {}".format(qid, ", ".join(s["bank_files"])))
            continue
        if qid in used:
            errs.append("{}: already shipped in {}".format(qid, used[qid]))
            continue
        picked.append(json.loads(json.dumps(pool[qid][0][1])))

    for q in picked:
        if q.get("figure_description") and not q.get("svg"):
            warns.append("{}: figure_description with no drawn figure".format(q["id"]))
        for f in ("explanation", "trap", "answer"):
            if not q.get(f):
                errs.append("{}: empty {}".format(q["id"], f))

    picked.sort(key=lambda q: (ORDER.index(q["difficulty"]), q["id"]))
    dif = collections.Counter(q["difficulty"] for q in picked)
    typ = collections.Counter(T.get(q["type"], "?") for q in picked)
    ex = sum(1 for q in picked if q.get("svg") or q.get("chart") or q.get("table_data"))

    print("{}  {} questions".format(code, len(picked)))
    print("  difficulty " + " / ".join("{} {}".format(k, dif[k]) for k in ORDER if dif[k]))
    print("  types      " + " / ".join("{} {}".format(k, v) for k, v in sorted(typ.items())))
    print("  exhibits   {}".format(ex))
    for w in warns:
        print("  WARN " + w)
    for e in errs:
        print("  ERROR " + e)
    if errs:
        return 1
    if write:
        out = os.path.join(HERE, code + ".json")
        with open(out, "w") as f:
            json.dump({"set": s, "questions": picked}, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("  wrote", out)
    else:
        print("  (dry run — pass --write)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], "--write" in sys.argv))
