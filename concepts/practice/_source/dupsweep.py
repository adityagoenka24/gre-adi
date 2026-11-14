#!/usr/bin/env python3
"""Near-duplicate sweep across every shipped practice sheet.

Word-overlap on a reduced token stream, numbers KEPT (they are what makes two
math stems the same question). Short stems collapse to a handful of tokens, so
a minimum token count is enforced — without it unrelated one-line stems score
1.00 and the sweep is useless.

Usage: dupsweep.py [CODE ...]      (no args = sweep everything against everything)
"""
import json, glob, os, re, sys, itertools

STOP = set("the a an of in on at to for is are was were be been and or if then what which "
           "following that this with has have does do not its it by each from so as".split())
MINTOK = 6
THRESH = 0.55


def toks(text):
    s = re.sub(r"[^a-z0-9/().\- ]", " ", text.lower())
    out = set()
    for w in s.split():
        w = w.strip(".-")
        if not w or w in STOP or (len(w) < 3 and not any(c.isdigit() for c in w)):
            continue
        out.add(w)
    return out


def main(focus):
    items = []
    for f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "*.json"))):
        code = os.path.basename(f)[:-5]
        try:
            d = json.load(open(f))
        except Exception:
            continue
        for q in d.get("questions", []):
            items.append((code, q["id"], toks(q.get("question", "")), q.get("question", "")))
    print("questions across all shipped sheets:", len(items))
    hits = []
    for (c1, i1, t1, s1), (c2, i2, t2, s2) in itertools.combinations(items, 2):
        if i1 == i2:
            continue
        if focus and c1 not in focus and c2 not in focus:
            continue
        if len(t1) < MINTOK or len(t2) < MINTOK:
            continue
        j = len(t1 & t2) / len(t1 | t2)
        if j >= THRESH:
            hits.append((j, c1, i1, c2, i2, s1, s2))
    hits.sort(reverse=True)
    print("pairs scoring >= %.2f : %d  (read every one; the number is a prompt, not a verdict)"
          % (THRESH, len(hits)))
    for j, c1, i1, c2, i2, s1, s2 in hits[:20]:
        same = " [SAME SHEET]" if c1 == c2 else ""
        print("\n %.2f  %s/%s  vs  %s/%s%s" % (j, c1, i1, c2, i2, same))
        print("    A: " + " ".join(s1.split())[:150])
        print("    B: " + " ".join(s2.split())[:150])


if __name__ == "__main__":
    main(set(sys.argv[1:]))
