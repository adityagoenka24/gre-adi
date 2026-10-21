# Gold-standard practice-set spec (GRE Quant Pro)

You are producing ONE patch JSON for ONE subtopic. It is the single source of truth:
the markdown practice sheet AND the portal question bank are both generated from it.

## The job

1. Read the subtopic's lecture capsule (markdown) to learn the method vocabulary, the
   named traps, and the worked examples ALREADY in the capsule.
2. Read the subtopic's bank JSON (all questions).
3. **Curate exactly 30 questions** from the existing bank — 5 easy, 8 medium, 12 hard,
   5 extreme_hard — keeping each question's ORIGINAL `id`.
4. **Upgrade every one of the 30 to gold standard** (rules below).
5. Write the patch JSON.

## Selection rules

- Pick for coverage, not convenience: every major concept in the capsule's "Must-Know
  Rules" should appear at least once; every named trap in the capsule's traps section
  should be the trap of at least one question.
- No two questions may test the same idea the same way. Drop near-duplicates.
- Do NOT select a question that duplicates a worked example or challenge problem already
  solved inside the capsule — the student has seen it.
- Aim across the 30 for roughly: MCQ 12, quantitative_comparison 6, numeric_entry 7,
  multiple_answer 5. Keep each question's existing `type` unless there is a strong reason.
- If a difficulty level does not have 
  enough usable questions in the bank, author NEW ones with the next free sequential IDs
  (e.g. if the file ends at WRD-RAT-048, new ones are WRD-RAT-049, WRD-RAT-050) and set
  `"is_new": true` on them. Only do this to fill a genuine gap.
- Difficulty labels must be honest. `extreme_hard` = needs an insight or a genuinely long
  multi-step chain (GRE 167-170), not just messy arithmetic. If a bank question labelled
  extreme_hard is really a medium, either rewrite it harder (same id, same story, harder
  ask) or pick a different one.

## Upgrade rules — what "gold standard" means

**Stem**
- Tight, unambiguous, GRE-flavoured. No wasted words. Precise quantifiers
  ("how many integer values", not "how many values").
- State any condition the answer depends on (e.g. "x > 0", "P > 0"). A QC question whose
  answer flips on an unstated sign is a defect.
- Numeric entry stems end with "Enter your answer as a number." (add units if needed).
- Multiple-answer stems end with "Select all that apply."

**Options**
- MCQ / multiple_answer: exactly 5, format `"A. text"` … `"E. text"`.
- QC: exactly the standard four, verbatim:
  `["A. Column A is greater", "B. Column B is greater", "C. The two quantities are equal", "D. The relationship cannot be determined from the information given"]`
- numeric_entry: `"options": null`.
- Every distractor must be the output of a specific, nameable student error. No filler
  numbers. If you cannot say which mistake produces a distractor, replace it.

**Explanation**
- Multi-line, one step per line, written as `Step 1 — …`, `Step 2 — …` where the solution
  is procedural. Show every calculation; never skip arithmetic.
- Finish with a check line where a check is cheap ("Check: 20% of 300 = 60, and
  300 - 60 = 240. Correct.").
- Where the capsule teaches a faster route (multiplier chain, alligation, picking 100,
  invariant), name it and show it.
- For multiple_answer, evaluate EVERY option A–E and mark TRUE/FALSE.
- Plain text math only — no LaTeX, no KaTeX, no unicode math symbols. Use `*` for explicit
  multiplication and juxtaposition otherwise; never a bare `x` meaning "times" in any set
  where `x` is a variable. Use `^` for powers, `/` for division, `sqrt(...)`, `<=` `>=`. Use `\n` for line breaks.
  Avoid characters that are not plain ASCII except the em dash used in "Step 1 —".

**Trap**
- Names the concrete wrong reasoning AND, where possible, the exact wrong number it
  produces and which option that is. 1-3 sentences.
- Never generic. "Students may make errors" is a failure.

**Other fields**
- `estimated_time_seconds`: easy 35-60, medium 60-90, hard 80-110, extreme_hard 100-130.
- `tags`: 2-3 lowercase hyphenated concept tags.

## Verification — non-negotiable

Recompute every answer key from scratch, independently of the bank's stored answer. The
existing bank has known defects (wrong keys, explanations that contradict the key). If
your recomputation disagrees with the stored answer, YOUR recomputation wins — fix the
key. Where arithmetic is heavy, verify with a Python one-liner in bash.

Set `"review_flag": true` on any question you are not fully confident about, and list
those ids in your final message.

## Output file

Write exactly this shape to the path you were given:

```json
{
  "set": {
    "subtopic_id": "...",
    "topic": "...",
    "subtopic": "...",
    "capsule": "<section-folder>/<capsule-file>.md",
    "bank_files": ["<topic_dir>/<file>.json"],
    "practice_path": "<section-folder>/<capsule-basename>-practice.md",
    "one_liner": "one sentence — the thesis of the topic, borrowed from the capsule"
  },
  "questions": [ ... 30 objects ... ]
}
```

Question object fields, in this order, nothing extra except the optional
`is_new` / `review_flag` flags:
`id, difficulty, type, question, options, answer, explanation, trap, estimated_time_seconds, tags`

`answer` is a string for mcq/qc/numeric_entry, an array of letters for multiple_answer.

Order the `questions` array easy → medium → hard → extreme_hard.

## Reference exemplar

`/home/claude/gre/patches/ARI-PCT.json` is the finished Percentages set. Match its depth
and tone exactly. Read it before you start writing.

## Do NOT

- Do not write any markdown. The practice sheet is generated from your JSON by a script.
- Do not include teacher notes, classroom instructions, or "ask the class…" language
  anywhere. The audience is one student working alone with one tutor.
- Do not modify any file under /mnt/user-data/uploads (read-only).

---

## Addendum — lessons from the first four sets (read this)

An adversarial verifier found ~50 defects in the first batch. Do not repeat them:

1. **Degenerate multiple_answer.** A select-all question whose answer is all five options, or
   only one option, is broken. The answer array must have 2-4 letters. If the bank question you
   picked is degenerate, rewrite an option so it is genuinely false (or genuinely true).
2. **Traps must land on a listed option.** Compute the number the described mistake produces. If
   that number is not among A-E, either change an option to it or describe a different mistake.
   A trap naming a value nobody can select is useless.
3. **No filler distractors.** Every wrong option must be the output of a nameable error. If you
   cannot name it, replace the option.
4. **QC stems must state the conditions the answer depends on.** If the relationship flips when a
   variable is negative, zero, or outside a range, either constrain it in the stem or the key is D.
   Check every QC for this. Also check the reverse: do not key D when the columns actually resolve.
5. **Exclusivity in "mixture"/"group" stems.** "The ratio of water to juice is 2:3" does not say the
   mixture is only water and juice. If your solution treats the parts as summing to the whole, the
   stem must say "consists only of".
6. **Difficulty must be honest.** If a bank question labelled hard is one subtraction, do not
   relabel it (the 5/8/12/5 split must hold) - STRENGTHEN it: same id, same story, harder ask, then
   recompute the key and rebuild the options.
7. **Explanations must match the stem after any rewrite.** A leftover sentence from the earlier
   version is a defect. Re-read the whole object once you have finished editing it.
8. **Recompute every key in python.** The stored bank answers are not trustworthy; several were
   wrong. Your own computation wins.

## Addendum — GEOMETRY ONLY (added 2026-09-26, read before building any GEO set)

1. **No degree glyph.** The bank writes `34°`; that is non-ASCII and `validate.py` rejects it.
   Write "34 degrees" in stems, options, explanations and traps. The capsules already do this — zero
   degree glyphs across all 14 of them. Same for pi: write `pi`, never the symbol.
2. **`figure_description` and `svg` are real fields on geometry bank questions and must be
   preserved.** `sync_bank.py` now carries both through a sync (it did not before 2026-09-26) and
   never drops one the bank already holds. If a curated question has a `figure_description`, keep it
   in the patch verbatim unless the rewrite changes the figure; if it has an `svg`, do not touch it.
   A question whose stem you rewrote so the figure no longer matches must have its
   `figure_description` rewritten to match, or the portal shows one problem and the sheet another.
3. **Prefer questions that stand without a picture.** The practice sheet is plain markdown with no
   images: a `figure_description` renders as an italic "Figure: ..." line, which is a description, not
   a diagram. So favour questions whose stem states every measurement in words, and when a figure is
   genuinely load-bearing make the description complete enough to draw from — every labelled point,
   every marked equality, every right angle, and what is NOT stated (most GRE geometry traps live in
   "the figure is not drawn to scale").
4. **Never infer a measurement from a figure.** If the answer depends on something only a picture
   shows, the question is broken for this sheet. State it in the stem.
5. **Geometry's two multi-file sheets**, per the capsules' own headers: `01-lines-angles` draws on
   `GEO-LNA` + `GEO-PLT`, and `14-solids-surface-area-volume` draws on `GEO-SAV` + `GEO-3DG` +
   `GEO-CSH`. Questions keep their own ids and sync writes each back to whichever file holds it, as
   the Algebra systems sheet and the Translating sheet already do.
6. **Check the triangle inequality and every derived length for existence.** A geometry stem can be
   internally impossible in ways an algebra stem cannot: sides 3-4-9, an inscribed circle larger than
   its triangle, a cone whose slant height is shorter than its height, an obtuse "right" triangle.
   Re-derive every length, angle and volume numerically before accepting a question.
7. **Exact vs decimal.** Keep radicals and pi exact in options (`6*sqrt(3)`, `18*pi`) unless the stem
   says "approximately". Mixing an exact key with decimal distractors makes the key findable without
   solving.
