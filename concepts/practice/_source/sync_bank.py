#!/usr/bin/env python3
"""Write the gold-standard practice questions back into every copy of the bank.

Run from the workspace root (the folder containing gre-pro/ and gre-free/).

For each patch in concepts/practice/_source/*.json:
  - every question is written BY ID into every bank JSON that already contains
    that ID (core subtopic files in all three trees, plus the *_mixed_bag.json
    static copies)
  - questions marked "is_new" are APPENDED to the core subtopic file (and its
    mixed bag) in each tree that has that file
  - meta.total_questions and meta.distribution are recomputed for any file touched
  - index.json in each tree is refreshed to match

Idempotent: running it twice changes nothing the second time.
"""
import json, os, glob, sys, collections

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
SOURCE_DIR = os.path.join(ROOT, "concepts", "practice", "_source")
TREES = ["gre-pro/bank", "gre-free/bank", "gre-free/pro/bank"]
SCHEMA = ["id", "difficulty", "type", "question", "options", "answer",
          "explanation", "trap", "estimated_time_seconds", "tags"]
# Presentation fields some banks carry (geometry). Not part of the 30-question
# contract, but they must survive a sync: the portal renders them.
CARRY = ["figure_description", "svg"]


def clean(q):
    """Strip build-only flags; emit fields in schema order, then carry-overs."""
    out = {}
    for f in SCHEMA:
        if f == "options":
            out[f] = q.get("options")
        else:
            out[f] = q[f]
    for f in CARRY:
        if q.get(f) is not None:
            out[f] = q[f]
    return out


def load(path):
    with open(path) as f:
        return json.load(f)


def save(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def bank_files(tree):
    d = os.path.join(ROOT, tree)
    if not os.path.isdir(d):
        return []
    out = []
    for p in glob.glob(os.path.join(d, "*", "*.json")):
        if os.sep + "kmf" + os.sep in p:
            continue           # unfinished, unserved import - leave alone
        out.append(p)
    return sorted(out)


def refresh_meta(data):
    qs = data.get("questions", [])
    meta = data.setdefault("meta", {})
    meta["total_questions"] = len(qs)
    if "distribution" in meta:
        c = collections.Counter(q.get("difficulty") for q in qs)
        meta["distribution"] = {k: c.get(k, 0) for k in
                                ("easy", "medium", "hard", "extreme_hard")}


def main():
    patches = sorted(glob.glob(os.path.join(SOURCE_DIR, "*.json")))
    if not patches:
        sys.exit("no patch files found in " + SOURCE_DIR)

    updates, new_by_code = {}, collections.defaultdict(list)
    for p in patches:
        d = load(p)
        code = d["set"]["subtopic_id"]
        for q in d["questions"]:
            updates[q["id"]] = clean(q)
            if q.get("is_new"):
                new_by_code[code].append(clean(q))

    print("patches: {}  questions: {}  new: {}".format(
        len(patches), len(updates), sum(len(v) for v in new_by_code.values())))

    touched = collections.Counter()
    files_changed = []

    for tree in TREES:
        for path in bank_files(tree):
            try:
                data = load(path)
            except Exception as e:
                print("  SKIP (unreadable):", path, e)
                continue
            qs = data.get("questions")
            if not isinstance(qs, list):
                continue

            present = {q.get("id") for q in qs}
            changed = False

            # 1. replace by id
            for i, q in enumerate(qs):
                qid = q.get("id")
                if qid in updates:
                    repl = dict(updates[qid])
                    # never drop a presentation field the bank already holds
                    for f in CARRY:
                        if f not in repl and q.get(f) is not None:
                            repl[f] = q[f]
                else:
                    continue
                if qs[i] != repl:
                    qs[i] = repl
                    touched[qid] += 1
                    changed = True

            # 2. append genuinely new questions to files that already hold
            #    that subtopic's ids
            code = (data.get("meta") or {}).get("subtopic_id")
            candidates = new_by_code.get(code, [])
            if not candidates:
                for c, items in new_by_code.items():
                    if any(pid.startswith(c + "-") for pid in present):
                        candidates = items
                        break
            for nq in candidates:
                if nq["id"] not in present:
                    qs.append(dict(nq))
                    present.add(nq["id"])
                    changed = True
                    print("  + appended {} -> {}".format(nq["id"], path[len(ROOT) + 1:]))

            if changed:
                qs.sort(key=lambda q: str(q.get("id")))
                refresh_meta(data)
                save(path, data)
                files_changed.append(path[len(ROOT) + 1:])

    # 3. refresh index.json in each tree
    for tree in TREES:
        idx_path = os.path.join(ROOT, tree, "index.json")
        if not os.path.isfile(idx_path):
            continue
        idx = load(idx_path)
        total = 0
        for topic, subs in idx.get("topics", {}).items():
            for name, entry in subs.items():
                fp = os.path.join(ROOT, tree, entry["file"])
                if not os.path.isfile(fp):
                    total += entry.get("count", 0)
                    continue
                data = load(fp)
                qs = data.get("questions", [])
                entry["count"] = len(qs)
                c = collections.Counter(q.get("difficulty") for q in qs)
                entry["distribution"] = {k: c.get(k, 0) for k in
                                         ("easy", "medium", "hard", "extreme_hard")}
                total += len(qs)
        idx["total_questions"] = total
        save(idx_path, idx)
        print("  index refreshed:", tree, "->", total, "questions")

    print("\nfiles changed: {}".format(len(files_changed)))
    for f in files_changed:
        print("  " + f)
    missing = [qid for qid in updates if touched[qid] == 0]
    if missing:
        print("\nWARNING - these ids were not found in any bank file (or were already identical):")
        for m in sorted(missing):
            print("  " + m)


if __name__ == "__main__":
    main()
