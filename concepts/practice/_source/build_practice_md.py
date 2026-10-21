#!/usr/bin/env python3
"""Build a level-wise practice markdown file from a patch JSON.

One source of truth: the patch JSON holds the gold-standard questions that are
written into the question bank. The markdown practice sheet is generated from
the same objects, so the .md and the portal JSON can never drift.
"""
import json, sys, os, re

LEVELS = [
    ("easy", "Level 1 · Easy", "warm-up — these must be automatic"),
    ("medium", "Level 2 · Medium", "two or three steps, one planted trap each"),
    ("hard", "Level 3 · Hard", "where 162+ is won or lost"),
    ("extreme_hard", "Level 4 · Extreme", "165+ — expect to need the insight, not the grind"),
]

TYPE_LABEL = {
    "mcq": "MCQ",
    "quantitative_comparison": "QC",
    "numeric_entry": "Numeric Entry",
    "multiple_answer": "Select all that apply",
}

QC_KEY = """> **Quantitative Comparison — the four choices are always the same, so they are not reprinted:**
> **(A)** Column A is greater · **(B)** Column B is greater · **(C)** The two quantities are equal · **(D)** The relationship cannot be determined from the information given
"""


def fmt_answer(q):
    a = q["answer"]
    return ", ".join(a) if isinstance(a, list) else str(a)


def render_stem(q):
    """Question text as markdown; QC gets its columns on their own lines."""
    text = q["question"]
    if q["type"] == "quantitative_comparison":
        intro, cols = [], []
        for p in text.split("\n"):
            p = p.strip()
            if not p:
                continue
            if p.startswith("Column A") or p.startswith("Column B"):
                head, body = p.split(":", 1)
                cols.append("> **{}:**  {}".format(head.strip(), body.strip()))
            else:
                intro.append(p)
        block = "\n".join(cols)
        return ("\n\n".join(intro) + "\n\n" + block) if intro else block
    return "\n\n".join(l.strip() for l in text.split("\n") if l.strip())


def render_options(q):
    if q["type"] == "quantitative_comparison":
        return ""
    if not q.get("options"):
        return "*Numeric entry — write the number.*"
    lines = []
    for o in q["options"]:
        m = re.match(r"^([A-E])\.\s*(.*)$", o.strip(), re.S)
        if m:
            lines.append("**({})** {}".format(m.group(1), m.group(2).strip()))
        else:
            lines.append(o)
    return "  \n".join(lines)


def render_explanation(text):
    return "\n".join(l.strip() for l in text.split("\n") if l.strip())


def build(patch_path, out_path):
    with open(patch_path) as f:
        data = json.load(f)
    s = data["set"]
    qs = data["questions"]

    by_level = {k: [q for q in qs if q["difficulty"] == k] for k, _, _ in LEVELS}
    counts = " · ".join(
        "{} {}".format(title.split("· ")[1], len(by_level[key]))
        for key, title, _ in LEVELS if by_level[key]
    )

    # global numbering in level order
    ordered = []
    for key, _, _ in LEVELS:
        ordered.extend(by_level[key])
    num = {q["id"]: i + 1 for i, q in enumerate(ordered)}

    cap_link = os.path.relpath(
        os.path.join("concepts", s["capsule"]),
        os.path.dirname(os.path.join("concepts", "practice", s["practice_path"])),
    )

    L = []
    L.append("# {} — Practice Set".format(s["subtopic"]))
    L.append("")
    L.append("**Bank code:** `{}` · **Section:** {} · **{} questions** — {}".format(
        s["subtopic_id"], s["topic"], len(qs), counts))
    L.append("")
    L.append("**Lecture capsule:** [{}]({})".format(os.path.basename(s["capsule"]), cap_link))
    L.append("")
    L.append("> {}".format(s["one_liner"]))
    L.append("")
    L.append("Every question below is live in the question bank under the ID shown — the sheet and the portal are the same questions. Attempt a level with the clock running, then check Part C.")
    L.append("")
    L.append("---")
    L.append("")
    L.append("## Part A — Questions")
    L.append("")
    if any(q["type"] == "quantitative_comparison" for q in qs):
        L.append(QC_KEY)
        L.append("")

    for key, title, blurb in LEVELS:
        group = by_level[key]
        if not group:
            continue
        total_time = sum(q["estimated_time_seconds"] for q in group)
        L.append("### {} — {} questions · ~{} min".format(title, len(group), round(total_time / 60)))
        L.append("")
        L.append("*{}*".format(blurb))
        L.append("")
        for q in group:
            L.append("**Q{}** · `{}` · {} · {}s".format(
                num[q["id"]], q["id"], TYPE_LABEL[q["type"]], q["estimated_time_seconds"]))
            L.append("")
            L.append(render_stem(q))
            L.append("")
            if q.get("figure_description"):
                L.append("*Figure: {}*".format(q["figure_description"].strip().rstrip(".") + "."))
                L.append("")
            opts = render_options(q)
            if opts:
                L.append(opts)
                L.append("")
        L.append("---")
        L.append("")

    L.append("## Part B — Answer Key")
    L.append("")
    L.append("| Q | ID | Level | Type | Answer |")
    L.append("|---|---|---|---|---|")
    for q in ordered:
        L.append("| {} | `{}` | {} | {} | **{}** |".format(
            num[q["id"]], q["id"], q["difficulty"].replace("_", " "),
            TYPE_LABEL[q["type"]], fmt_answer(q)))
    L.append("")
    L.append("---")
    L.append("")

    L.append("## Part C — Worked Solutions")
    L.append("")
    for q in ordered:
        L.append("### Q{} · `{}` — Answer: {}".format(num[q["id"]], q["id"], fmt_answer(q)))
        L.append("")
        L.append(render_explanation(q["explanation"]))
        L.append("")
        L.append("**Trap.** {}".format(q["trap"]))
        L.append("")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        f.write("\n".join(L).rstrip() + "\n")
    print("wrote", out_path, len(qs), "questions")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
