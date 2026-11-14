#!/usr/bin/env python3
"""ETS hard-rule + wording-contract gate over practice patches. finalgate.py [CODE ...]"""
import json, glob, os, re, sys, collections

QC_OPTS = ["A. Quantity A is greater.", "B. Quantity B is greater.",
           "C. The two quantities are equal.",
           "D. The relationship cannot be determined from the information given."]
BRITISH = r"\b(centre|centred|metres?|litres?|kilometres?|centimetres?|millimetres?|colour|labelled|travelled|modelling|neighbour|behaviour|favourite|programme|grey|defence|licence|catalogue|judgement|ageing|whilst|amongst|minimise|maximise|analyse|factorisation|organise|realise|recognise|normalise|utilise|specialise)\b"
IMPER = r"^\s*(Simplify|Expand|Factor|Solve|Find|Determine|Evaluate|Compute|Convert|Express)\b[^?]*?:"
SHOUTY = r"\b(TRUE|FALSE|MUST|COULD|ALWAYS|NEVER|BOTH|ALL|ONLY|EXACTLY|LARGEST|SMALLEST|NEGATIVE|POSITIVE|LESS THAN|AT LEAST)\b"
ENTRY = r"(Enter|Type|Give|Write) your answer as a (number|decimal|whole number)\b|Type your answer"
SA_OK = r"(Indicate all such [a-z ]+\.|Select all that apply\.)(\s*Note:.*)?\s*$"

def num(s):
    s = s.strip()
    m = re.fullmatch(r"(-?)\$?([0-9][0-9,]*\.?[0-9]*)%?", s)
    return float(m.group(1) + m.group(2).replace(",", "")) if m else None

def main(focus):
    errs = collections.defaultdict(list)
    n = 0
    for f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "*.json"))):
        code = os.path.basename(f)[:-5]
        if focus and code not in focus:
            continue
        try: d = json.load(open(f))
        except Exception: continue
        if "questions" not in d: continue
        for q in d["questions"]:
            n += 1
            i, t, o, a = q["id"], q["type"], q.get("options"), q.get("answer")
            body = q.get("question", "")
            if t == "quantitative_comparison":
                if o != QC_OPTS: errs["QC option set not ETS-verbatim"].append(i)
                if a not in list("ABCD"): errs["QC answer not A-D"].append(i)
                if "Quantity A:" not in body or "Quantity B:" not in body:
                    errs["QC missing a Quantity line"].append(i)
                if re.search(r"Column [AB]", body): errs["pre-2011 Column wording"].append(i)
            elif t == "numeric_entry":
                if o is not None: errs["numeric entry carries options"].append(i)
            elif t == "mcq":
                if not o or len(o) != 5: errs["MCQ not 5 options"].append(i)
                if a not in list("ABCDE"): errs["MCQ answer not A-E"].append(i)
            elif t == "multiple_answer":
                if not o or not (3 <= len(o) <= 8): errs["select-all option count"].append(i)
                if not isinstance(a, list) or not (2 <= len(a) <= len(o or []) - 1):
                    errs["select-all answer count"].append(i)
                if not re.search(SA_OK, body.strip()):
                    errs["select-all directive not canonical"].append(i)
            if o and t in ("mcq", "multiple_answer"):
                vals = [num(re.sub(r"^[A-E]\.\s*", "", x)) for x in o]
                if all(v is not None for v in vals):
                    if vals != sorted(vals): errs["numeric options not ascending"].append(i)
                    if len(set(vals)) != len(vals): errs["two options equal in value"].append(i)
            blob = " ".join([body, q.get("explanation", ""), q.get("trap", "")] + (o or []))
            if re.search(BRITISH, blob, re.I): errs["British spelling"].append(i)
            if re.search(ENTRY, body): errs["redundant entry instruction"].append(i)
            if re.search(IMPER, body): errs["imperative stem"].append(i)
            for m in re.findall(SHOUTY, blob):
                errs["shouty caps"].append(i + " (" + m + ")"); break
    print("checked %d questions across %d sheets" % (n, len(focus) if focus else 0))
    if not errs:
        print("0 findings")
    for k in sorted(errs, key=lambda x: -len(errs[x])):
        v = errs[k]
        print("  %-36s %3d   %s" % (k, len(v), ", ".join(v[:6]) + (" ..." if len(v) > 6 else "")))

if __name__ == "__main__":
    main(set(sys.argv[1:]))
