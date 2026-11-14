#!/usr/bin/env python3
"""Propose live-bank replacements for practice questions the bank no longer holds.

For each orphan: same subtopic file, same difficulty, same type, not already used in
any sheet, and the lowest word-overlap against the questions that sheet already ships
(so a replacement never lands as a twin). KMF / sectional strata win ties at hard.
"""
import json, glob, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
STOP = set("the a an of in on at to for is are was were be and or if then what which "
           "following that this with has have does do not its it by each from so as".split())

def toks(t):
    return set(w for w in re.sub(r"[^a-z0-9/() -]", " ", t.lower()).split()
               if w not in STOP and len(w) > 2)

def strat(i):
    return 0 if ("-KMF" in i or i.startswith("SEC-")) else 1

def main(write=False):
    bank_by_file, live = {}, set()
    for f in glob.glob(os.path.join(ROOT, "pro", "bank", "*", "*.json")) + \
             glob.glob(os.path.join(ROOT, "bank", "*", "*.json")):
        if os.path.basename(f) == "index.json":
            continue
        rel = "/".join(f.split(os.sep)[-2:])
        for q in json.load(open(f, encoding="utf-8"))["questions"]:
            live.add(q["id"])
            bank_by_file.setdefault(rel, {}).setdefault(q["id"], q)
    used = {}
    patches = {}
    for sf in sorted(glob.glob(os.path.join(HERE, "*.json"))):
        code = os.path.basename(sf)[:-5]
        try: d = json.load(open(sf, encoding="utf-8"))
        except Exception: continue
        if "questions" not in d: continue
        patches[code] = d
        for q in d["questions"]:
            used[q["id"]] = code

    total = 0
    for code, d in patches.items():
        files = d["set"]["bank_files"]
        pool = {}
        for bf in files:
            pool.update(bank_by_file.get(bf, {}))
        keep_toks = [toks(q["question"]) for q in d["questions"] if q["id"] in live]
        changed = False
        for idx, q in enumerate(d["questions"]):
            if q["id"] in live:
                continue
            cands = [c for c in pool.values()
                     if c["id"] not in used
                     and c.get("difficulty") == q.get("difficulty")
                     and c.get("type") == q.get("type")
                     and not (c.get("figure_description") and not c.get("svg"))]
            if not cands:
                cands = [c for c in pool.values()
                         if c["id"] not in used and c.get("difficulty") == q.get("difficulty")]
            if not cands and q.get("difficulty") == "extreme_hard":
                # the 2026-11-10 recalibration emptied this tier on purpose: the old sheets
                # were built to a 5-extreme quota that manufactured difficulty. Drop to a
                # real hard item rather than invent an extreme one.
                for t in (q.get("type"), None):
                    cands = [c for c in pool.values()
                             if c["id"] not in used and c.get("difficulty") == "hard"
                             and (t is None or c.get("type") == t)
                             and not (c.get("figure_description") and not c.get("svg"))]
                    if cands:
                        break
            if not cands:
                print("  %-9s %-18s NO REPLACEMENT AVAILABLE" % (code, q["id"]))
                continue
            def score(c):
                ct = toks(c["question"])
                worst = max((len(ct & k) / len(ct | k) if (ct | k) else 0) for k in keep_toks) if keep_toks else 0
                return (round(worst, 2), strat(c["id"]) if q.get("difficulty") in ("hard", "extreme_hard") else 0)
            best = sorted(cands, key=score)[0]
            print("  %-9s %-18s -> %-18s %-6s %-22s %s" % (
                code, q["id"], best["id"], q.get("difficulty", "")[:6],
                q.get("type", "")[:22], " ".join(best["question"].split())[:62]))
            d["questions"][idx] = json.loads(json.dumps(best))
            used[best["id"]] = code
            keep_toks.append(toks(best["question"]))
            changed = True
            total += 1
        if changed and write:
            ORDER = ["easy", "medium", "hard", "extreme_hard"]
            d["questions"].sort(key=lambda x: (ORDER.index(x["difficulty"]), x["id"]))
            with open(os.path.join(HERE, code + ".json"), "w", encoding="utf-8") as fh:
                json.dump(d, fh, indent=2, ensure_ascii=False); fh.write("\n")
    print("\n%d orphans replaced%s" % (total, "" if write else "  (dry run - pass --write)"))

if __name__ == "__main__":
    main("--write" in sys.argv)
