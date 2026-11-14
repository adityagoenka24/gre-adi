#!/usr/bin/env python3
"""Publish the scheduled event — a full mock, a sectional, or a topic test.

Replaces hand-editing events/config/current.json. Run it as often as you like:
weekly, daily, twice a day. Nothing in here assumes Sunday.

    python3 events/publish_event.py --list
    python3 events/publish_event.py --list sectional
    python3 events/publish_event.py --list topic

    # a full mock (two timed sections, one adaptive form served flat)
    python3 events/publish_event.py --type mock --mock 3

    # a sectional set — 12 questions at real GRE pace
    python3 events/publish_event.py --type sectional --set percentages_set1

    # a topic test — pick how many and how long
    python3 events/publish_event.py --type topic --topic arithmetic --file percentages \
            --count 10 --difficulty medium,hard

Every run writes events/config/current.json (what the site serves) and an archived
dated copy next to it, which is both a permalink target and how --list knows what
you have already used.

Add --dry-run to validate and print without writing anything.
"""

import argparse
import datetime as dt
import json
import pathlib
import random
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOCKS = ROOT / "pro" / "mocks"
BANK = ROOT / "pro" / "bank"
CONFIG = ROOT / "events" / "config"
CURRENT = CONFIG / "current.json"

# event_type values. NOTE: coach.html hides the bare strings 'sectional',
# 'full_mock' and 'team_battle' from the Events tab, so these must NOT collide
# with those — an event typed 'sectional' would silently never appear for you.
TYPE_EVENT = {"mock": "full_mock_event", "sectional": "sectional_event", "topic": "topic_event"}

SECONDS_PER_Q = 105          # real GRE pace, 1:45
ARCHIVE_RE = re.compile(r"^event_(\d{4}-\d{2}-\d{2})_([a-z0-9_-]+)\.json$")
TOPIC_DIRS = ["arithmetic", "algebra", "geometry", "coordinate_geometry",
              "number_properties", "statistics", "word_problems",
              "data_interpretation", "mixed"]


def fail(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def load(path):
    try:
        return json.loads(path.read_text())
    except Exception as e:
        fail(f"could not read {path.relative_to(ROOT)}: {e}")


def questions_of(doc):
    """Bank files are {meta, questions}; a few legacy ones are a bare list."""
    if isinstance(doc, list):
        return doc
    return doc.get("questions") or []


def next_date(weekday=6, today=None):
    """Next occurrence of `weekday` strictly after today (6 = Sunday)."""
    today = today or dt.date.today()
    return today + dt.timedelta(days=(weekday - today.weekday()) % 7 or 7)


def archived():
    out = {}
    for p in sorted(CONFIG.glob("event_*.json")):
        m = ARCHIVE_RE.match(p.name)
        if m:
            out.setdefault(m.group(2), []).append(m.group(1))
    # Older naming from the first version of this script.
    for p in sorted(CONFIG.glob("sunday_*.json")):
        m = re.match(r"^sunday_(\d{4}-\d{2}-\d{2})_mock(\d+)\.json$", p.name)
        if m:
            out.setdefault(f"mock{m.group(2)}", []).append(m.group(1))
    return out


# ── listing ──────────────────────────────────────────────────────────────────

def live_slug():
    try:
        cur = json.loads(CURRENT.read_text())
        return cur.get("source_slug"), str(cur.get("starts_at", ""))[:10]
    except Exception:
        return None, ""


def list_mocks(used, cur_slug, cur_date):
    print("\nFULL MOCKS  --type mock --mock N")
    print(f"  {'paper':<12} {'access':<7} {'Q':>3}  {'sections':<11} {'forms':<18} used")
    for p in sorted(MOCKS.glob("mock_*.json")):
        n = int(re.search(r"mock_(\d+)", p.name).group(1))
        d = load(p)
        meta, secs = d.get("meta", {}), d.get("sections", [])
        forms = ",".join((secs[1].get("forms") or {}).keys()) if len(secs) > 1 else "—"
        counts = "+".join(str(len(s.get("questions", []))) for s in secs)
        slug = f"mock{n:02d}"
        mark = ", ".join(used.get(slug, [])) or "—"
        if slug == cur_slug:
            mark += f"  << LIVE, {cur_date}"
        print(f"  {p.name:<12} {meta.get('access','?'):<7} {meta.get('total_questions','?'):>3}"
              f"  {counts:<11} {forms:<18} {mark}")


def list_sectionals(used, cur_slug, cur_date):
    print("\nSECTIONAL SETS  --type sectional --set NAME")
    d = BANK / "sectional"
    if not d.exists():
        print("  (none)")
        return
    for p in sorted(d.glob("*.json")):
        name = p.stem
        qs = questions_of(load(p))
        meta = (load(p).get("meta") or {}) if not isinstance(load(p), list) else {}
        slug = f"sec_{name}"
        mark = ", ".join(used.get(slug, [])) or "—"
        if slug == cur_slug:
            mark += f"  << LIVE, {cur_date}"
        print(f"  {name:<34} {len(qs):>3} Q   {str(meta.get('topic',''))[:28]:<28} {mark}")


def list_topics(used, cur_slug, cur_date):
    print("\nTOPIC FILES  --type topic --topic DIR --file NAME")
    for d in TOPIC_DIRS:
        dirp = BANK / d
        if not dirp.exists():
            continue
        print(f"  {d}/")
        for p in sorted(dirp.glob("*.json")):
            qs = questions_of(load(p))
            diffs = {}
            for q in qs:
                diffs[q.get("difficulty", "?")] = diffs.get(q.get("difficulty", "?"), 0) + 1
            mix = " ".join(f"{k[:4]}:{v}" for k, v in sorted(diffs.items()))
            slug = f"top_{d}_{p.stem}".replace(" ", "_")
            mark = ", ".join(used.get(slug, [])) or ""
            if slug == cur_slug:
                mark += f"  << LIVE, {cur_date}"
            print(f"    {p.stem:<34} {len(qs):>4} Q   {mix:<42} {mark}")


def cmd_list(which):
    used = archived()
    cur_slug, cur_date = live_slug()
    if which in (None, "all", "mock"):
        list_mocks(used, cur_slug, cur_date)
    if which in (None, "all", "sectional"):
        list_sectionals(used, cur_slug, cur_date)
    if which in (None, "all", "topic"):
        list_topics(used, cur_slug, cur_date)
    print("\nAnything already used can be reused, but returning students will")
    print("recognise it — prefer something unused.\n")


# ── builders: each returns (questions, sections, slug, subject) ──────────────

def build_mock(a):
    path = MOCKS / f"mock_{a.mock:02d}.json"
    if not path.exists():
        fail(f"{path.name} not found. Try --list mock")
    paper = load(path)
    meta, secs = paper.get("meta", {}), paper.get("sections", [])
    if len(secs) != 2:
        fail(f"expected 2 sections in {path.name}, found {len(secs)}")

    s1 = secs[0].get("questions") or []
    forms = secs[1].get("forms") or {}
    if forms:
        if a.form not in forms:
            fail(f"form '{a.form}' not in {path.name}; available: {', '.join(forms)}")
        s2, form_used = forms[a.form], a.form
    else:
        s2, form_used = (secs[1].get("questions") or []), None
        print(f"note: {path.name} has no adaptive forms; using its plain Section 2.")

    questions = []
    for src, idx in ((s1, 0), (s2, 1)):
        for q in src:
            q = dict(q)
            q["section"] = idx
            questions.append(q)

    sections = [
        {"name": "Section 1", "question_count": len(s1),
         "time_limit_seconds": secs[0].get("time_limit_seconds")},
        {"name": "Section 2", "question_count": len(s2),
         "time_limit_seconds": secs[1].get("time_limit_seconds")},
    ]
    source = {"paper_source": f"../pro/mocks/mock_{a.mock:02d}.json", "section_2_form": form_used}
    return questions, sections, f"mock{a.mock:02d}", meta.get("title") or f"Mock Test {a.mock}", source


def build_sectional(a):
    path = BANK / "sectional" / f"{a.set}.json"
    if not path.exists():
        fail(f"sectional set '{a.set}' not found. Try --list sectional")
    doc = load(path)
    meta = doc.get("meta", {}) if isinstance(doc, dict) else {}
    qs = pick(questions_of(doc), a)
    minutes = a.minutes or round(len(qs) * SECONDS_PER_Q / 60)
    questions = [dict(q, section=0) for q in qs]
    sections = [{"name": "Section 1", "question_count": len(qs),
                 "time_limit_seconds": minutes * 60}]
    subject = f"{meta.get('topic', a.set)} — {meta.get('subtopic', 'Sectional')}".strip(" —")
    return questions, sections, f"sec_{a.set}", subject, {"paper_source": f"../pro/bank/sectional/{a.set}.json"}


def build_topic(a):
    path = BANK / a.topic / f"{a.file}.json"
    if not path.exists():
        fail(f"topic file '{a.topic}/{a.file}.json' not found. Try --list topic")
    doc = load(path)
    meta = doc.get("meta", {}) if isinstance(doc, dict) else {}
    qs = pick(questions_of(doc), a)
    minutes = a.minutes or round(len(qs) * SECONDS_PER_Q / 60)
    questions = [dict(q, section=0) for q in qs]
    sections = [{"name": "Section 1", "question_count": len(qs),
                 "time_limit_seconds": minutes * 60}]
    subject = meta.get("subtopic") or a.file.replace("_", " ").title()
    slug = f"top_{a.topic}_{a.file}".replace(" ", "_")
    return questions, sections, slug, subject, {"paper_source": f"../pro/bank/{a.topic}/{a.file}.json"}


def pick(pool, a):
    """Filter by difficulty, then take --count, deterministically via --seed so a
    rerun of the same command republishes the identical paper."""
    if not pool:
        fail("that file holds no questions")
    if a.difficulty:
        want = {d.strip().lower() for d in a.difficulty.split(",") if d.strip()}
        filtered = [q for q in pool if str(q.get("difficulty", "")).lower() in want]
        if not filtered:
            have = sorted({str(q.get("difficulty", "?")) for q in pool})
            fail(f"no questions match difficulty {sorted(want)}; file has: {', '.join(have)}")
        pool = filtered
    if a.count and a.count < len(pool):
        rng = random.Random(a.seed if a.seed is not None else 0)
        pool = sorted(rng.sample(pool, a.count), key=lambda q: str(q.get("id", "")))
    elif a.count and a.count > len(pool):
        print(f"note: asked for {a.count} questions, file only has {len(pool)}; using all of them.")
    return list(pool)


# ── assemble, validate, write ────────────────────────────────────────────────

def assemble(a, questions, sections, slug, subject, source, when):
    total_time = sum(s["time_limit_seconds"] or 0 for s in sections)
    kind = {"mock": "Full Mock", "sectional": "Sectional", "topic": "Topic Test"}[a.type]
    default_label = f"{kind}: {subject} — {when:%-d %B}"
    sectioned = len(sections) > 1

    instructions = (
        "This is a full-length mock with two timed sections. Each section has its own clock "
        "and locks when you end it or time runs out, so you cannot return to it. No feedback "
        "is shown during the test. Your score, timing, weak areas, and trap review appear "
        "instantly after you submit Section 2."
        if sectioned else
        f"{len(questions)} questions in {total_time // 60} minutes, at real GRE pace. One clock "
        "for the whole set, and it locks when you end it or time runs out. No feedback is shown "
        "during the test. Your score, timing, weak areas, and trap review appear instantly "
        "after you submit."
    )

    return {
        "event_id": f"{slug}_{when:%Y_%m_%d}",
        "event_name": a.label or default_label,
        "event_type": TYPE_EVENT[a.type],
        "event_kind": a.type,                 # plain word for the landing page
        "event_subject": subject,             # what it is about, for the card
        "source_slug": slug,                  # what --list matches on
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "starts_at": f"{when:%Y-%m-%d}T{a.time}:00+05:30",
        "recurring_label": a.recurring,
        "timer_seconds": total_time,
        "question_count": len(questions),
        "sections": sections,
        "shuffle_questions_for_students": not sectioned,
        "allow_navigation": True,
        "show_feedback_during_test": False,
        "instructions": instructions,
        "source_filters": dict({
            "bank_source": "../pro/bank/",
            "topic": kind,
            "subtopic": subject,
            "difficulties": sorted({q.get("difficulty") for q in questions if q.get("difficulty")}),
            "types": sorted({q.get("type") for q in questions if q.get("type")}),
        }, **source),
        "questions": questions,
    }


def validate(cfg):
    """Each check here exists because getting it wrong ships a broken paper to
    someone sitting a timed test."""
    problems, notes = [], []
    qs = cfg["questions"]
    if not qs:
        problems.append("no questions")

    ids = [q.get("id") for q in qs]
    if any(not i for i in ids):
        problems.append("a question has no id")
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        problems.append(f"duplicate ids: {', '.join(sorted(dupes)[:5])}")

    for q in qs:
        qid = q.get("id", "?")
        if q.get("answer") in (None, "", []):
            problems.append(f"{qid}: no answer key")
        if not q.get("question"):
            problems.append(f"{qid}: empty stem")
        if q.get("type") in ("mcq", "quantitative_comparison", "multiple_answer") and not q.get("options"):
            problems.append(f"{qid}: {q.get('type')} with no options")

    for i, s in enumerate(cfg["sections"]):
        if not s["time_limit_seconds"]:
            problems.append(f"{s['name']}: no time limit")
        actual = sum(1 for q in qs if q.get("section") == i)
        if actual != s["question_count"]:
            problems.append(f"{s['name']}: declares {s['question_count']} but holds {actual}")

    per_q = cfg["timer_seconds"] / max(len(qs), 1)
    if per_q < 60:
        notes.append(f"{per_q:.0f}s per question — tighter than real GRE pace (~105s)")
    elif per_q > 180:
        notes.append(f"{per_q:.0f}s per question — looser than real GRE pace (~105s)")

    for field, label in (("explanation", "no explanation"), ("trap", "no named trap")):
        missing = [q.get("id") for q in qs if not q.get(field)]
        if missing:
            notes.append(f"{len(missing)} with {label}: {', '.join(str(m) for m in missing[:3])}")

    when = dt.datetime.fromisoformat(cfg["starts_at"])
    if when < dt.datetime.now(when.tzinfo):
        notes.append("starts_at is in the past — the card will say 'open now' straight away")
    return problems, notes


def main():
    ap = argparse.ArgumentParser(description="Publish the scheduled GRE Quant Pro event.")
    ap.add_argument("--list", nargs="?", const="all", choices=["all", "mock", "sectional", "topic"],
                    help="show what is available to publish")
    ap.add_argument("--type", choices=["mock", "sectional", "topic"], help="what kind of test")
    ap.add_argument("--mock", type=int, help="[mock] paper number, e.g. 3")
    ap.add_argument("--form", default="medium", choices=["easy", "medium", "hard"],
                    help="[mock] which Section 2 form to serve (default medium)")
    ap.add_argument("--set", help="[sectional] set name, e.g. percentages_set1")
    ap.add_argument("--topic", help="[topic] bank folder, e.g. arithmetic")
    ap.add_argument("--file", help="[topic] file in that folder, e.g. percentages")
    ap.add_argument("--count", type=int, help="[sectional/topic] how many questions")
    ap.add_argument("--difficulty", help="[sectional/topic] comma list, e.g. medium,hard")
    ap.add_argument("--minutes", type=int, help="[sectional/topic] clock; default is real GRE pace")
    ap.add_argument("--seed", type=int, help="[sectional/topic] make the random pick reproducible")
    ap.add_argument("--date", help="sitting date YYYY-MM-DD (default: next Sunday)")
    ap.add_argument("--today", action="store_true", help="sitting is today")
    ap.add_argument("--time", default="10:00", help="start time HH:MM IST (default 10:00)")
    ap.add_argument("--label", help="override the student-facing event name")
    ap.add_argument("--recurring", default="Every Sunday, 10:00 AM IST",
                    help="the cadence line shown under the date; pass '' for none")
    ap.add_argument("--dry-run", action="store_true", help="validate and report, write nothing")
    a = ap.parse_args()

    if a.list:
        cmd_list(a.list)
        return
    if not a.type:
        fail("--type is required (mock | sectional | topic), or use --list")
    if not re.fullmatch(r"\d{2}:\d{2}", a.time):
        fail("--time must look like 10:00")

    if a.type == "mock":
        if not a.mock:
            fail("--type mock needs --mock N")
        builder = build_mock
    elif a.type == "sectional":
        if not a.set:
            fail("--type sectional needs --set NAME")
        builder = build_sectional
    else:
        if not (a.topic and a.file):
            fail("--type topic needs --topic DIR --file NAME")
        builder = build_topic

    when = dt.date.today() if a.today else (dt.date.fromisoformat(a.date) if a.date else next_date())
    questions, sections, slug, subject, source = builder(a)
    cfg = assemble(a, questions, sections, slug, subject, source, when)
    problems, notes = validate(cfg)

    shown = dt.datetime.fromisoformat(cfg["starts_at"])
    print(f"  kind       {a.type}")
    print(f"  source     {source['paper_source']}")
    print(f"  name       {cfg['event_name']}")
    print(f"  sitting    {shown:%A, %-d %B %Y at %-I:%M %p} IST")
    print(f"  sections   " + " + ".join(
        f"{s['question_count']}Q/{(s['time_limit_seconds'] or 0)//60}min" for s in cfg["sections"]))
    if a.type == "mock":
        print(f"  section 2  {source['section_2_form'] or 'plain (no forms)'} form")
    if a.difficulty:
        print(f"  difficulty {a.difficulty}")
    print(f"  questions  {cfg['question_count']}")
    for n in notes:
        print(f"  note       {n}")

    if problems:
        print()
        for p in problems:
            print(f"  BLOCKED    {p}", file=sys.stderr)
        fail(f"{len(problems)} problem(s) — nothing written")

    if a.dry_run:
        print("\n  dry run — nothing written")
        return

    archive = CONFIG / f"event_{when:%Y-%m-%d}_{slug}.json"
    body = json.dumps(cfg, indent=2, ensure_ascii=False) + "\n"
    CURRENT.write_text(body)
    archive.write_text(body)
    print(f"\n  wrote      {CURRENT.relative_to(ROOT)}")
    print(f"  archived   {archive.relative_to(ROOT)}")
    print(f"\n  Commit and push. Share this link:")
    print(f"    https://grequantpro.com/events/mock_test.html")
    print(f"  Permanent link to THIS paper, after it is replaced:")
    print(f"    https://grequantpro.com/events/mock_test.html?config=config/{archive.name}")
    print(f"\n  Results land in Coach View → Events, under '{cfg['event_name']}'.")


if __name__ == "__main__":
    main()
