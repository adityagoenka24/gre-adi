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


---

## Addendum 2026-10-19 — re-score finished, scores written back

**Items 1, 3, 4 (settled earlier):** the two editorial decisions are already in `ETS_RUBRIC.md` §1.4 and §1.9 and the user confirmed them again. 21 further non-ascending numeric MCQs were reordered on 2026-10-17 (key letter, trap and explanation letter references remapped, sympy-verified, all copies synced; log in `_ets_audit_archive_2026-10/step3_option_order/sweep_2026-10-17_applied.json`). Only `ARI-P10-005` is left unordered, deliberately. The `gre-question-gen` skill proposal was submitted for the user to save; `references/gre-scope.md` (lines 78, 91, 121) and `references/trap-patterns.md` (lines 157, 166) still carry stale Column A/B and select-all wording.

**Item 2 — re-score (measurement only):**
- 4,920 live non-KMF non-withdrawn questions re-scored blind by Sonnet (verdicts in `_ets_audit_archive_2026-10/rescore_2026-10-12/verdicts_new/`). The 21 reordered IDs were re-scored again on their post-reorder text (`bcm01.json`) and that result is the one written back.
- Written to every copy by ID (10,749 copies, 158 files): `ets_score`, `ets_tags`, `ets_note` (new note only; stale old note removed) and `ets_rescore {date, prev_score, prev_tags, prev_note, agree_with_key}`. No question content changed (verified against `bank_backup_2026-10-19_pre_rescore_writeback.tar.gz`: zero non-`ets_` differences; all copies of each ID agree).
- Score distribution old -> new: 1: 211 -> 20, 2: 780 -> 354, 3: 1797 -> 2125, 4: 2054 -> 2413, 5: 78 -> 8.
- 10 disagreements with the key plus 2 explanation/stem problems went to Opus adversarial triage: `rescore_2026-10-12/triage_report.md`. Nothing was changed in the bank. Summary:
  - Key wrong, explanation right (fix the key): ARI-FRC-040 (A->D), WRD-MST-023 (C->A; trap "(D)" should be E), GEO-LNA-048 (24.2->25), STA-OVL-033 (C,D,E -> B,C,D,E).
  - Stem omits where P is (key C right after a stem fix): GEO-LNA-055, GEO-PLT-026.
  - Two correct options in an MCQ (replace one): ALG-EXP-028, COG-PPL-010.
  - Unsolvable/ambiguous stems: DAT-RCD-034 (options read "Statement A-E"; restore or withdraw), GEO-LNA-050, WRD-MIX-043.
  - Explanation/trap only: STA-DDI-020.
  The outcome of each is also recorded in that question's `ets_note`.

**Still open:** repairs for the 12 triaged questions (needs user go-ahead, each key change to be sympy-verified and propagated to all copies); item 5 (48 withdrawn instances / 26 IDs: rewrite or delete — user decision); sweep of numeric select-all option order (not required by rubric §1.4 — user decision); item 6 (static `/pro/bank/` JSON exposure — only when the user says so). Nothing has been committed or pushed.


---

## Addendum 2 — 2026-10-19 (later the same day): everything the user delegated is done

The user handed over decision-making ("I give you the control. Decide, and then continue."). Decisions and results:

**1. The 12 triaged questions were repaired** (all copies by ID; every key re-derived with sympy/numeric constructions, then re-scored blind and all 12 keys confirmed). Scripts and logs: `_ets_audit_archive_2026-10/triage_repair_2026-10-19/` (backup before: `backups/bank_backup_2026-10-19_pre_triage_repair.tar.gz`).
- Key fixed: ARI-FRC-040 (A->D), WRD-MST-023 (C->A; trap letter D->E), GEO-LNA-048 (24.2->25), STA-OVL-033 ([C,D,E]->[B,C,D,E]).
- Stem fixed so the existing key holds: GEO-LNA-055 and GEO-PLT-026 (position of P stated).
- Option replaced (two correct options): ALG-EXP-028 (D), COG-PPL-010 (B).
- Rebuilt: DAT-RCD-034 (five statements restored, stale chart removed), GEO-LNA-050 (options B/C by position), WRD-MIX-043 (stem asks which ratio "could" be used; new explanation and trap), STA-DDI-020 (Y's SD 15->7 so the ranges can go either way; key B->D; examples added to the explanation).

**2. Option-order sweep extended** to select-all, ratio and coordinate-pair questions (keys remapped, sympy-checked): ALG-LN2-058 ([A,D]->[A,E]), GEO-SAV-046 (B->D), SEC-CG-021 ([A,B,C]->[B,C,D]), NUM-GCL-042 (A->B), COG-MID-027 (B->C), ARI-P10-005 (A/B swapped, key C unchanged). Decision recorded: coordinate-pair options need not be sorted (COG-PLT-002/009 left as is); equal-valued options are allowed when the stem demands a form. The detector now finds zero unordered numeric MCQs (ARI-P10-005 is non-decreasing, so even that exception is gone).

**3. Withdrawn questions (item 5):** decision = keep the 26 unsalvageable IDs hidden in place (not deleted, not mass-rewritten): deleting touches meta totals, practice sheets and indexes for no student-visible gain. One was rewritten because a live practice sheet showed it: ARI-SEQ-057 (off-syllabus infinite series -> new on-syllabus recursive-sequence select-all, key A,C,E; bank + `learn/practice/sequences-series.html` + `learn/pro-body/practice-sequences-series.html` updated). Four more questions that the blind re-score put at 1 for unambiguous reasons were newly withdrawn: ALG-LN2-041, GEO-QDL-056, GEO-TRI-045, GEO-TRI-050. Withdrawn IDs are now 29 (26 - 1 + 4).

**4. Event configs refreshed.** `events/config/{current,mock_001,mock_002}.json` embed frozen question copies; 48 of 67 had drifted from the bank (some with old answer keys). They were re-synced by ID from the bank (content fields only; topic/subtopic/review_flag kept) and the withdrawn trig question MIX-GEN-067 in the live "Mixed Bag" event was replaced by MIX-GEN-070 (hard MCQ, in-syllabus, score 3). Log: `triage_repair_2026-10-19/events_sync_log.json`. Backup of events/ and learn/: `backups/events_learn_backup_2026-10-19.tar.gz`.

**5. Final score distribution** (4,917 live non-KMF non-withdrawn): 1: 5, 2: 345, 3: 2135, 4: 2424, 5: 8. Verified: 19 question IDs changed content (all intended), zero ID-set changes, KMF untouched, all copies agree (excluding origin fields), JSON format round-trips, structural checks clean except known withdrawn/KMF items.

**Left for the owner (not decided on his behalf):**
- Five live questions score 1 for "off-syllabus infinite series / limit" (ARI-EXP-079, ARI-SEQ-037, 041, 046, 048). Four of them (079, 041, 046, 048) sit on curated practice sheets, so they were left live. If infinite geometric series is out of scope, withdraw them and swap them out of `learn/practice/{exponents-roots,sequences-series}.html` and the matching `learn/pro-body/practice-*.html`.
- The `learn/practice/*.html` and `learn/pro-body/practice-*.html` sheets are static snapshots from September. 14 of them show options in the old order (self-consistent but not ascending) and some questions whose bank text has since changed (e.g. NUM-ABS-029). Regenerating them needs the old `concepts/practice/_source` build pipeline, which is not in this repo.
- The gre-question-gen skill proposal still needs to be saved by the user; `references/gre-scope.md` (lines 78, 91, 121) and `references/trap-patterns.md` (lines 157, 166) still carry old Column A/B and select-all wording.
- Item 6 (static `/pro/bank/` JSON reachable by URL) is untouched, as instructed. `events/config/current.json` also serves pro-mixed questions on the free site; confirm that is intended.
- Nothing has been committed or pushed.


---

## Addendum 3 — 2026-10-19 (afternoon): owner's answers applied

- **Skill:** confirmed saved (the synced `gre-question-gen/SKILL.md` carries the ETS rubric, Quantity A/B, ascending-options and precedence rules). `references/gre-scope.md` (lines 78, 91, 121) and `references/trap-patterns.md` (lines 157, 166) still have old Column A/B / select-all wording; the new SKILL.md says `ETS_RUBRIC.md` outranks them.
- **Off-syllabus infinite-series questions removed from service** (withdrawn in every copy, reversible via `ets_withdrawn`): ARI-EXP-079, ARI-SEQ-037, ARI-SEQ-041, ARI-SEQ-046, ARI-SEQ-048. Practice sheets were deliberately skipped (owner's call), so `learn/practice/{exponents-roots,sequences-series}.html` and the matching `learn/pro-body/` pages still contain ARI-EXP-079, ARI-SEQ-041/046/048. Withdrawn IDs are now 34.
- **Free site no longer serves pro-only questions in events.** All 30 questions in `events/config/current.json` were pro-only (MIX-GEN-*), and 7 each in `mock_001.json` / `mock_002.json` were pro-only (ARI-PCT-0xx / ARI-FRC-0xx that no longer exist in `bank/`). `current.json` was rebuilt from the free bank (`bank/`, no sectional sets, score >= 4, no tags, no exhibits; 14 medium / 12 hard / 4 extreme_hard, 17 topics) and `source_filters.bank_source` is now `../bank/`; the 14 pro-only mock questions were replaced with free ones of the same type and difficulty. Verified: every question in all three configs exists in `bank/`, none is withdrawn, content equals the free-bank copy, no duplicates. Script: `_ets_audit_archive_2026-10/triage_repair_2026-10-19/events_free.py`. Backup: `backups/bank_backup_2026-10-19_pre_withdraw5.tar.gz` (includes `events/`).
- Note: `current.json` still carries `event_id: "mock_001"`, the same id as `mock_001.json`, so analytics for the two events share an id; left unchanged.


---

## Addendum 4 — 2026-10-19 (evening): item 6, Pro data no longer served as static files

**Finding (confirmed live, logged out):** every file under `/pro/bank/` (132 files, 10,362 questions) and `/pro/mocks/mock_01–10.json` downloaded with no login, from `grequantpro.com/pro/...` and from `raw.githubusercontent.com/adityagoenka24/gre-adi/main/pro/...`. The repo is public. The lock screens in `pro-gate.js` and the practice logger only hide the page; the data was never behind them.

**Fix (code done, NOT yet deployed, nothing committed):** Pro JSON is served only by the Worker. `POST /pro-data` takes `{email, fingerprint, path}`, checks the student exactly as `/validate` does (known, not revoked, fingerprint already registered; it never registers a device), checks the plan (`bank/sectional/*` → sectional, `mocks/*` → mocks, other `bank/*` → practice), then streams the file from KV key `data:<path>`. Errors: 400 bad request, 401 not a current student on this device, 403 plan lacks the feature, 404 file not uploaded.

Changed files: `cloudflare/worker.js` (new route + handler), `pro/pro-gate.js` (adds `window.greProFetch`), `pro/gre_practice_logger_pro.html` (own `greProFetch`; 2 fetches), `pro/sectional.html` (2), `pro/full_mock.html` (1), `events/event_builder.html` (removed the "Pro bank" source), `.gitignore` (`pro/bank/`, `pro/mocks/`). Tested: 28 Worker cases against a fake KV (wrong device, revoked, wrong plan, `..` and key-injection paths, missing file, spaces in names) all pass; edited pages pass a syntax check; no static fetch of Pro data remains.

**Upload file:** `_ets_audit_archive_2026-10/pro_data_fix_2026-10-19/kv_payload.json` (142 keys, 18.9 MB, built from the current working tree, so it includes today's audit changes; `kv_manifest.json` beside it has bytes + sha256). Rebuild after any later edit to `pro/bank` or `pro/mocks`: `python3 _ets_audit_archive_2026-10/pro_data_fix_2026-10-19/build_payload.py`, then upload again.

**Order matters** (the live Worker currently answers `/pro-data` with 404; pushing the pages first breaks Pro):
1. **Deploy the Worker** the way you normally do (paste `cloudflare/worker.js` into the dashboard editor and deploy). Do not `wrangler deploy` from `cloudflare/`: `wrangler.toml` holds a placeholder KV id. Existing endpoints are unchanged.
2. **Upload the data** (namespace id: dashboard → KV → `GRE_AUTH`):
   `npx wrangler kv bulk put _ets_audit_archive_2026-10/pro_data_fix_2026-10-19/kv_payload.json --namespace-id <GRE_AUTH id> --remote`
   (older wrangler 3.x: `kv:bulk put`, drop `--remote`).
3. **Check it** while logged in to Pro on grequantpro.com, in the browser console:
   `const a=JSON.parse(localStorage.gre_pro_auth);(await fetch('https://gre-auth.goenka-aditya-kol.workers.dev/pro-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a.email,fingerprint:a.fingerprint,path:'bank/index.json'})})).status` → expect 200.
4. **Commit and push** the code, and stop publishing the data: `git rm -r --cached pro/bank pro/mocks` (keeps your local files), then commit everything and push.
5. **Re-test after Pages redeploys:** `https://grequantpro.com/pro/bank/index.json` and the same path on raw.githubusercontent.com should both be 404; then open the practice logger, a sectional set and mock 3 while logged in. Browsers with a cached old page (10 min) may show "Bank unavailable" until refreshed.

**Not done / owner's decisions:**
- **Git history still contains the Pro bank** (public repo, created 2026-04-29, 0 forks). Removing it means rewriting history (`git filter-repo --invert-paths --path pro/bank --path pro/mocks`, force-push, and asking GitHub support to purge cached commit views). Anyone who already cloned keeps their copy.
- **`learn/pro-body/*.html` (75 lesson bodies, 25 of them practice sheets) is a documented soft gate** (see the comment at the top of `learn/gate.js`): the pages are fetchable by URL. Same fix pattern would work; not touched, since this item was about `/pro/bank/`.
- **A student with valid access can still script the new route** and pull their plan's files. Per-student rate limits would be the next layer.
