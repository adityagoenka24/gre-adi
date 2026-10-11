# GRE Quant Pro — ETS-fidelity audit and remediation

**Work done:** 2026-10-06 → 2026-10-11 · **State:** complete, zero defects on every mechanical
check, uncommitted in the working tree.

This document is written to be picked up cold by someone (or some session) with no memory of the
work. Start at **Current state**, then **How the bank is put together** before touching anything,
then **Still open** for what to do next.

---

## Addendum — 2026-10-11 continuation (read this first)

A second session picked this up. The original work was **already committed and on `main`** as
`a94e1bf` ("questions upgrade"), so "uncommitted in the working tree" below is out of date. Several
claims of "zero defects" turned out to be narrower than stated; what the second session found and did:

**Found and fixed**

1. **QC questions rendered blank in four pages (regression from step 1).** `gre_practice_logger_free.html`,
   `pro/gre_practice_logger_pro.html`, `previous.html` and `events/events_common.js` parsed QC stems
   by looking for lines starting `Column A:` / `Column B:`. After the Column→Quantity rewrite they
   found nothing and showed "—" for both quantities. Parsers now accept either wording (same approach
   as `parseQC` in `full_mock.html`, which already did), build the intro from every non-quantity
   line, and label the columns "Quantity A/B". **Verified by `node --check` on every inline script
   and a unit test of the parsing logic — not yet by a browser run; do a visual check of one QC
   question in each page.**
2. **420 `SEC-*` questions had stale topic-side copies.** Each exists in a sectional set *and* in a
   topic file plus its mixed bag. Only the sectional copy received `ets_*` fields and fixes, so the
   copies the practice loggers actually serve carried no `ets_score`, and 27 differed in content
   (for example `SEC-AL-084`'s topic copy still had a "cannot be determined" option). All copies now
   match their sectional copy (866 instances rewritten, `origin`/`origin_set` kept per copy). **Zero
   IDs now have disagreeing copies** — the original "zero copies disagree" held only for
   claude-gen IDs.
3. **22 more flattened mixed-graph exhibits (`DAT-MXG-001…028`).** Step 7 rebuilt only the ones that
   carried an `ets_exhibit_fix`; the rest were still a single "pie" mixing months with categories
   (the data was already lost that way in the original upload, so figures come from the
   explanations). Stem-complete questions had the junk chart removed; the others were rebuilt as
   chart + `table_data` (the `DAT-MXG-022` pattern; second exhibit's stem header now says "Table —").
   Medium-confidence rebuilds (`008`, `013`, `016`, `025`) used an array value for one or two
   *unused* bars; each is recorded in its `ets_exhibit_fix.source`.
4. **24 questions still carried `ets_key_disputed`** (the handoff said none). All re-solved: every key
   held, so the flags were stale and are cleared with an `ets_key_resolved` record. Only content
   change: `ALG-INQ-036` option D now reads "for all such x and y".
5. **Open item 4 settled:** `DAT-MGS-014`'s stem no longer says to round 82/6 (key 73 stands);
   `DAT-LIN-025` now says readings are "taken every 2 hours" (typo fixed).
6. **Open item 6 done:** 172 numeric MCQs with out-of-order options reordered ascending, answer
   letter and in-text letter references recomputed together (`ets_option_order` records the old
   order). Each checked that the correct option's *text* is unchanged. 0 remain.
7. **Open item 3 settled** in `ETS_RUBRIC.md` §1.4 (equal-valued option is a defect unless the stem
   demands a form). It is a default — Adi can overrule.

**Not done / newly found**

- **Free logger and `previous.html` render no charts or tables.** They have no `q.chart` /
  `table_data` handling (only the pro logger does), so the free bank's 83 chart questions and 10
  `table_data` questions (`DAT-TBL-008…040`: "The table below shows…") show only the stem. Pre-existing,
  not caused by the audit; queued as a separate task.
- Independent copies of some questions live outside the banks and were **not** touched, so they can
  differ from the bank where an option reorder applied: `events/config/*.json` (frozen event
  snapshots — leave them) and static `learn/practice/*.html` + `learn/pro-body/*.html` pages.
  Each is internally consistent.
- **Pro bank exposure confirmed, deliberately left open (Adi, 2026-10-11).** `https://grequantpro.com/pro/bank/index.json` is publicly readable, and the repo is public so the files are also on github.com and in git history. Adi chose to defer; the plan is to move the admin/pro data behind Cloudflare KV once there is traction. Note the admin page cannot detect copying, since static JSON never passes through the Worker. Cheapest future fix: serve pro files from the existing Worker (email + fingerprint + access tier checks) out of KV, remove `pro/bank`, `mocks/` and `events/config/` from the repo, and purge history. The `gre-question-gen` skill is also stale (still writes Column A/B and 'Column A is greater'); update it to Quantity A/B per `ETS_RUBRIC.md`.
- Open items 1 (re-score), 2 (URL exposure — `grequantpro.com` is unreachable from the sandbox;
  `cloudflare/worker.js` is an auth API and contains no static-asset handling), 5 (the
  `gre-question-gen` skill lives outside this repo) and 7 (48 withdrawn) remain open.
- 19 numeric MCQs were hand-checked for letter references before reordering; the two real ones
  (`MIX-GEN-008`, `NUM-DIV-018`) were edited by hand.

---

## Current state

Every Claude-generated question in both banks was independently re-solved, scored for ETS fidelity,
and repaired. **4,920 live questions** (48 flagged withdrawn), and a sweep of all student-facing
fields now returns **zero defects** on every check built during this work:

QC wording and option sets · MCQ option count, answer range, duplicate text, banned options ·
numeric-entry items carrying options · select-alls that are all-correct, under-two-correct, or have
duplicate options · chart label/data length mismatches, sentence labels, duplicate labels ·
pipe-garbage tables · invalid difficulty values · missing explanations.

Every copy of every question agrees across both banks. Both indexes match their files exactly. No
unparseable JSON anywhere.

| | Before | After |
|---|---|---|
| easy | 22.4% | **28.0%** |
| medium | 38.3% | **44.4%** |
| hard | 28.5% | **23.3%** |
| extreme_hard | 10.8% | **4.2%** |

Types: 2,149 MCQ · 1,103 numeric entry · 1,085 QC · 583 select-all.

**One caveat on "zero defects":** it means zero on every *mechanically checkable* rule and every
defect this audit identified. The `ets_score` values stored in the bank are the **original** audit's
and now understate quality — 361 questions are known to have been fixed since they were scored. A
re-score pass is how you'd measure the improvement rather than infer it.

---

## How the bank is put together

Get this wrong and you will either waste half your budget or silently corrupt data.

**There are exactly two sources.** `bank/` (free) and `pro/bank/` (pro). Nothing else in the repo is
a question source — the former root `statistics/` and `number_properties/` folders were stale upload
leftovers and are now in the archive.

**`*_mixed_bag.json` files are roll-ups of their subtopic files, not new questions.** 4,877 of the
pro bank's apparent duplicates are one question appearing in both its subtopic file and its topic's
mixed bag. **Always dedupe before auditing and propagate every fix to all copies**, or you pay 2.2x
and risk fixing one copy while the other goes stale. Deduping took this job from 8,920 questions to
4,934 unique ones.

**The free bank is nearly a subset of pro** — 1,515 of its 1,556 unique stems are also in pro. Fixes
must land in both.

**Match by question-text hash *or* by ID, but know which is stale.** Text hashes break once a pass
rewrites stems (this happened: a later pass built from a pre-fix snapshot and would have reverted 34
already-applied fixes). Within claude-gen, IDs are consistent and every copy of an ID agrees, so ID
matching is safe there. Note 12 pairs of *different* IDs share identical question text — a
pre-existing duplication, not something this work introduced.

**Math notation is NOT a defect.** `gre-math.js` converts plain-text math to typeset math via KaTeX
and already normalises both conventions at display time — its own comment at line 191 says
`"x <= 5" → "x ≤ 5"` is half the point of the pass. `x^2` and `x²`, `sqrt(5)` and `√(5)`, `<=` and
`≤` all render identically. Do not "fix" this; an earlier plan to rewrite ~14,000 instances was
dropped, and the planned `a*b → a × b` substitution would have broken the renderer's fraction
grammar, which has no `×` in its operand pattern.

**Both indexes are correct and internally consistent.** `bank/index.json` references 24 files
totalling exactly its claimed 970; `pro/bank/index.json` references 95 files totalling exactly
10,362. The sectional sets are **deliberately** excluded from `pro/bank/index.json` —
`pro/bank/sectional/index.json` says so: *"Deliberately separate from bank/index.json, which the
practice loggers read."* The free sectional catalogue uses a `file_pattern` plus a per-topic `free`
count rather than listing filenames, which is why a filename grep finds no references to the four
`bank/sectional/*_set1.json` files. **Those four are the free sample sets. Do not delete them.**

**Fields this audit added to each question:**

| Field | Meaning |
|---|---|
| `ets_score` | 1–5 ETS fidelity from the original audit (now understates quality) |
| `ets_tags` | machine-readable reason tags |
| `ets_note` | the auditor's note, where one was given |
| `ets_key_disputed` | the key was disputed — should now be absent everywhere |
| `ets_withdrawn` + `ets_withdraw_reason` | do not serve; the loggers filter on this |
| `ets_triage`, `ets_dup_fix`, `ets_exhibit_fix`, `ets_difficulty_recal`, `ets_rewrite`, `ets_option_fix`, `ets_key_resolved`, `ets_lastmile` | per-pass provenance |

**`ets_*` fields are not student-facing.** Exclude them from any defect scan — they quote the
original defects, so scanning them produces false positives (this bit once: four "Column A" hits
turned out to be auditors *describing* the defect).

---

## What was changed

Roughly in order, with the reason each mattered.

**1. Column A/B → Quantity A/B.** The real GRE has used "Quantity A / Quantity B" since the 2011
revision; "Column A" is pre-2011 GRE and old GMAT phrasing. This was the largest single defect in
the bank — and the KMF 1804 imports got it right, which is exactly why they felt closer to ETS.
**2,818 QC questions** now carry ETS's verbatim four choices; Column A/B gone from 5,721 text fields.

**2. Audit verdicts written in.** 4,934 unique questions re-solved **blind** — the question files
were split from their answer keys so no auditor could see a key before committing to an answer.
Scores and tags propagated to all 11,114 instances across both banks.

**3. 10 pro-only files pruned from the free bank** (1,176 questions). All were 100% duplicated in
pro, several carrying pro's space-separated filenames (`ratios proportions.json` alongside the free
tier's `ratios_proportions.json`). Verified before deleting that the free logger can only load what
`bank/index.json` lists, that no HTML or JS references any of the 10, and after deleting that all
1,176 survive in pro.

**4. Key disputes triaged.** 111 disputes, each re-solved from scratch by an independent reviewer
blind to both prior answers. **Only 4 of 111 were the first auditor's error.** 24 keys were genuinely
wrong, 72 questions were broken, 11 stems ambiguous. Ten had explanations that *refuted their own
keys* — `COG-PLT-024`'s said "Both A and B are valid"; `GEO-LNA-018`'s concluded "cannot be
determined"; `WRD-PCT-043`'s ended "Corrected answer: A, B, C, D" while the answer field said
A, B, C.

**5. Withdrawn questions actually unserved.** `ets_withdrawn` was inert — no code read it. The filter
now sits at the single point where each page first reads a `questions` array, in
`gre_practice_logger_free.html`, `pro/gre_practice_logger_pro.html`, `previous.html`,
`sectional.html`, `pro/sectional.html`, `full_mock.html` and `pro/full_mock.html`.

**6. Duplicate-option questions repaired.** A symbolic sweep of every option set found questions with
two or more mathematically identical options — `ALG-FAC-008` had four of five options equal,
`ALG-EXP-007` had **all five**. 34 fatal plus 22 duplicate-distractor cases, all resolved. Two were
correctly left alone: `ARI-P10-005` is a scientific-notation *form* question where equal values are
the point, and `ALG-FAC-037`'s equal-valued option is incompletely factored, which is a fair
distractor for a "factor completely" stem.

**7. 89 corrupted exhibits rebuilt.** A faulty parser had mis-split label/value pairs, dragged stem
sentences into axis labels, pushed years into data arrays, flattened two series into one, and mangled
pipe-delimited tables. `DAT-BAR-036` plotted four cities all at `2010.0`. **The real data was in the
stems all along**, so this was reconstruction, not invention — `DAT-BAR-005`'s stem reads
"Driver 1: 80 km | Driver 2: 120 km…" while its labels were `["Driver 1", "km\nDriver 2", …]`, split
one position late. `DAT-MGS` collapsed from 29 problems into **8 shared data sets**, each rebuilt once.
Every rebuild re-solves to its stated answer, and an anti-invention check traced every number back to
the original stem or explanation.

**8. Difficulty recalibrated.** 1,049 flagged, **889 changed, 160 flags overruled**. Batched by
subtopic with calibration anchors — questions in the same subtopic whose labels the auditors had
*accepted* — so labels were set relative to real neighbours. Every subtopic moved downward, which was
checked rather than accepted: among the 17 that went `extreme_hard → easy` are *"A triangle has sides
of length 7, 24, and 25. What is its area?"* and a QC item whose given condition `|a| > |c|` **is**
the comparison asked. The bank was inflating difficulty.

**9. 654 weak questions revised.** The queue was 1,015 scoring 1–2, but **361 scored low only because
of defects since fixed**, so they were re-scored rather than rewritten. Of the real 654: 552 revised,
52 needed no change, 22 withdrawn.

**10. The last 91 malformed questions.** The ones every earlier pass had to skip, because repairing
them *requires changing the answer*: 34 select-alls where every option was true, 37 MCQs carrying
"cannot be determined" / "none of the above" / "both A and C", 20 select-alls with a single correct
answer. 11 converted type; where the banned option *was* the keyed answer, the stem was tightened
instead.

---

## Still open

1. **Re-score the bank.** `ets_score` predates the repairs and understates quality. This is the
   cheapest way to quantify what the work achieved, and the only item on this list that is purely
   measurement.
2. **Is static JSON under `/pro/bank/` reachable by URL?** `pro/bank/` is tracked in git on a static
   GitHub Pages deploy at `grequantpro.com`. `robots.txt` disallows `/pro/` and `/bank/`, but that
   only asks crawlers politely — it is not access control. Whether the Cloudflare Worker intercepts
   static JSON under those paths has **not** been verified. If it does not, all 10,782 pro questions
   are one guessed URL away. Adi has parked this deliberately; it is the biggest open risk.
3. **Settle one convention:** is a *correctly-valued but not-fully-simplified* option a legitimate
   distractor? Reviewers split on it — one replaced such options in `ALG-EXP-007`, `ALG-FAC-008` and
   `ARI-P10-012`, another kept the same pattern in `ALG-FAC-037` on the grounds that "factor
   completely" makes the unsimplified form wrong. Both defensible. It shapes future generation, so
   decide it once and record it in `ETS_RUBRIC.md`.
4. **Two editorial contradictions** left as-is because they need a product decision:
   `DAT-MGS-014`'s stem says to round 82 ÷ 6 to the nearest whole number (giving 71%) while its key
   says 73, which only follows from the unrounded value — one of the two has to go. And
   `DAT-LIN-025`'s stem says "hourly readings" while its explanation requires 2-hour spacing.
5. **Wire `ETS_RUBRIC.md` into the `gre-question-gen` skill** so new questions are born to the
   standard rather than audited into it.
6. **Options not in ascending order.** Several passes declined to reorder numeric options because
   doing so moves the correct letter and they were forbidden from touching `answer`. A dedicated pass
   could sweep these — reorder and recompute the letter together.
7. **48 withdrawn questions** remain in the bank, flagged and filtered. Rewrite or delete them when
   convenient; nothing breaks either way.

---

## Working on this safely

**Backups.** `_ets_audit_archive_2026-10/backups/` holds ten tarballs of `bank/` and `pro/bank/`,
one taken immediately before each change, in order. To undo any stage, extract the tarball from
*before* it. `README.md` in that folder maps each one.

**The archive is gitignored on purpose.** It contains ten full copies of the bank plus every
intermediate dump (~53 MB). Committing it would publish the entire pro bank several times over,
permanently, in git history. `.gitignore` excludes `_ets_audit_archive_*/`, bank backup tarballs,
payload and change-log JSON, and `.DS_Store`.

**Gotchas that cost real time here:**

- **Sequence matters.** The audit pilot scored 44 of 100 questions at 2, driven almost entirely by
  defects that were about to be fixed globally. Apply mechanical fixes *first*, regenerate inputs,
  *then* audit — otherwise the scores measure the wrong thing.
- **Replacing an option set moves the correct letter.** This is the single most dangerous operation
  in this codebase and it bit twice. Agents returned corrected option lists with `new_answer` null;
  applying them as-is would have pointed `GEO-SCF-014`'s key at `2:7` instead of `4:7`, turning a
  flawed question into a wrong one. Always recompute the letter by locating the originally-correct
  option in the new list, and evaluate symbolically when text matching fails — `1 − π/4` becomes
  `(4 − π)/4`, `8/√3` becomes `8√3/3`, `3(√3+1)/2` becomes `3/(√3−1)`.
- **Mechanical beats agents for anything decidable.** Symbolic sweeps found 114 duplicate-option and
  degenerate select-all questions in minutes with complete coverage; agents had been finding them one
  at a time and would have missed most.
- **Verify tooling output, don't trust it.** A failed `rm` short-circuited an `&&` chain, so a
  regeneration silently never ran and a stale archive got staged. Caught only by asserting on the
  regenerated content. Separately, a `node --check` run reported two files broken when the checker
  was feeding them their JSON-LD block as JavaScript.
- **Check an assumption before reporting it as a defect.** The "stale index" was not stale, the "45%
  duplicate questions" were mixed-bag roll-ups working as designed, the "ASCII notation
  inconsistency" is handled by the renderer, and a `year_as_data` flag turned out to be a commission
  chart whose dollar values fell in the 1990–2035 range.
- **Give every parallel agent its own scratch directory.** Agents clobbered each other's helper files
  in a shared scratchpad, and one re-ran another's script and overwrote a verdicts file.
- **Make agents save every few items.** Two session rate limits killed waves of agents mid-flight and
  cost almost nothing, because completed work was already on disk.
- **Sonnet was right for bulk passes, Opus for adversarial ones.** This matches what the KMF 1804
  import found. Key triage, option-letter resolution and distractor design went to Opus; audit,
  difficulty and wording passes to Sonnet.

**Artefacts.** `ETS_RUBRIC.md` at the repo root is the reusable standard, derived from ETS's published
math conventions, the paper-delivered practice book and the ETS quant content page — use it for
generation, not just audit. The archive holds `verdicts/` (all 4,934 per-question verdicts, the
auditor brief, validator scripts), `payloads_and_logs/` (every change applied, with what it
replaced), `html_pre_patch/` (the 7 pages before the withdrawn filter), `removed_from_free/`,
`stale_root_banks/` and `working_data/`.

---

## Ready to push

Working tree: **207 changed paths, ~20 MB**, nothing committed yet.

- **165 modified** — bank JSONs across both banks, plus exactly the 7 patched HTML pages
- **39 deleted** — 10 pro-only files pruned from the free bank, 24 stale root-bank files, 5
  `.DS_Store` files untracked
- **3 new** — `.gitignore`, `ETS_RUBRIC.md`, `HANDOFF_ETS_AUDIT_2026-10-06.md`

Verified immediately before handing over: 4,920 live questions, zero copies disagreeing, free index
970/970, pro index 10,362/10,362, the four free sectional sets matching the catalogue's promise, no
unparseable JSON, and the `ets_withdrawn` filter present in all 7 serving pages.
