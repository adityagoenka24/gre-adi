# WRD-AGE.json — adversarial verification report

Set: Age Problems (Word Problems), 30 questions
Source: `concepts/practice/_source/WRD-AGE.json`
Method: every one of the 30 items re-solved from scratch in Python (sympy / `fractions.Fraction`)
before the stored `answer` or `explanation` was read. Option-collapse, notation, tier-honesty,
time/tag/schema and age-plausibility checks run programmatically afterwards.
Verifier is read-only; nothing in the set was edited.

## 0. Headline

- **All 30 stored answer keys are correct.** My independent computation agrees with every one,
  including all 12 MCQs, all 6 QCs, all 7 numeric entries and all 5 select-alls. No wrong-key defect.
- No option collapse anywhere (all pairwise option comparisons distinct in text and in value).
- Notation is clean: ASCII only apart from the em dash, every em dash is in `Step n —`, no bare `x`
  used as a multiplication sign, step numbering contiguous in all 30 explanations.
- Schema: field order exact, 12 MCQ / 6 QC / 7 NE / 5 MA, 5 easy / 8 medium / 12 hard / 5 extreme_hard,
  every `estimated_time_seconds` inside its tier band, every tag 2-3 lowercase-hyphenated, QC option
  blocks verbatim, numeric stems end "Enter your answer as a number.", select-all stems end
  "Select all that apply.", no `review_flag` set anywhere.
- Every explanation derives its key with no arithmetic slip; I re-checked every number quoted inside
  every trap paragraph as well (e.g. 027's b=7/Carlos=21, 034's j=40, 040's 33+9+17+1=60,
  042's t=10.5, 043's t=11 and t=14 all reproduce exactly as claimed).
- No redundant-condition defects remain **except WRD-AGE-039** (see D1), which is the exact defect
  class the ten rewrites were commissioned to remove — 039 was not on the rewrite list and still has it.
- The residual problem in this set is **tier honesty**: six hard/extreme_hard items reduce to a single
  linear equation in a single unknown. Details in D3-D8.

## 1. Defects

### D1 — WRD-AGE-039 (extreme_hard, numeric_entry): a stated condition is redundant. Key is right; the item is a one-condition problem wearing two.
**What is wrong.** The ask is "How old is Jordan?". With S = Priya + Mei, the two remaining sentences give
`S + (S/2 + 5) = 65`, so `S = 40` and `J = 25` — *whatever the split of S*. "Priya is 4 times as old as
Mei" is never used. Verified: P/M = 32/8, 30/10 and 20/20 all give total 65 and Jordan 25.
The stored explanation solves for m as though it mattered, which hides the redundancy.
**My computed value.** Jordan = 25 (agrees with the key), but reachable without the 4:1 sentence.
**Severity.** should-fix (blocking by the SPEC addendum's own standard: this is trap class 8).
**Minimal fix — needs strengthening in place (tier and type are fixed).** Keep all three given sentences
and change only the ask to one that consumes all of them:

> "... How many years from now will Priya be exactly 3 times as old as Mei will be then?
> Enter your answer as a number."

**Verified myself:** total 65 and Jordan = avg + 5 force S = 40; with P = 4M that gives M = 8, P = 32,
J = 25 (32 + 8 + 25 = 65; avg(32,8) = 20, 20 + 5 = 25). Then 32 + t = 3(8 + t) → t = 4; at t = 4,
Priya 36 and Mei 12, and 36 = 3*12. **New answer: 4.** All three sentences are now load-bearing and the
item is a three-stage solve. Trap text must be rebuilt (the "answering 32 / answering 20" lines no longer apply;
the live errors become freezing Mei — 32 + t = 24 → negative — and answering 12, Mei's age at that moment).

### D2 — WRD-AGE-029 (hard, numeric_entry): the derived ages are biologically absurd.
**What is wrong.** N = 0.6M with N + 15 = 0.75(M + 15) forces mother = 25 and Nina = 15 — a 10-year
mother/daughter gap. The stem says "her mother". This is the "absurd ages" defect class.
**My computed values.** mother 25, Nina 15, t = 25, sum 90 (key 90 is arithmetically correct).
**Severity.** should-fix.
**Minimal fix (same id, same shape, three percentages changed).**

> "Nina's present age is 20 percent of her mother's present age. Fifteen years from now, Nina's age
> will be 40 percent of her mother's age. What will the sum of their two ages be at the moment when
> Nina's age is 50 percent of her mother's age? Enter your answer as a number."

**Verified myself:** 0.2M + 15 = 0.4(M + 15) → M = 45, N = 9 (gap 36 — plausible). Check: today 9/45 = 20%;
in 15 years 24/60 = 40%. Then 9 + t = 0.5(45 + t) → t = 27, ages 36 and 72, **sum 108**; 36/72 = 50% and the
gap is still 36. The capsule's fast route survives: at 50% the gap is one part of two, so mother 72, Nina 36.
Trap update: the single-sided-shift error (0.2M + 15 = 0.4M) now gives M = 75, and the "answer the wrong
quantity" numbers become 27 (the years) and 36 (Nina's age then).

### D3 — WRD-AGE-015 (medium, multiple_answer): two distractors are filler, and the trap admits it.
**What is wrong.** Correct ages are Ben 20, Ana 40, Carlos 30, so C (38) and E (52) are the two false options.
The explanation's own words for E: the described mis-translation "gives b = 16 ... and Carlos = 42", then
asks the reader to believe a student "reaches for the nearest listed large number". 42 is not 52. The
fallback derivation (90 split 2:1:1 as 45:22.5:22.5) does not produce 52 either. C (38) is then defended
only as "90 - 52", i.e. derived from the other filler number. This violates addendum rules 2 and 3.
**Severity.** should-fix (cosmetic in effect — the key is unaffected — but it is exactly the banned pattern).
**Minimal fix.** Replace the two false options with the outputs of two real errors: `C. 32` and `E. 50`.
**Verified myself:** reversing the direction of "Ana is twice as old as Ben" (Ben = 2*Ana) gives
5a + 10 = 90, a = 16, so Ben = 32 → option C. Attaching "twice" to Carlos (Ana = 2*Carlos) gives
4b + 30 = 90, b = 15, Ana = 50 → option E; the same 50 comes from reading "Carlos is 10 years *younger*
than Ben" (4b - 10 = 90, b = 25, Ana = 50). Neither 32 nor 50 is a true age, so the key stays **A, B, D**,
the options stay ascending (20, 30, 32, 40, 50) and no two options collapse.

### D4 — WRD-AGE-027 (hard, mcq): rewritten item still solves in one equation with one unknown.
**What is wrong.** After the two substitutions the whole item is `(3m - 5) + (m - 5) + m = 35`. One equation,
one unknown, answer read straight off. The rewrite did fix the redundancy (both sentences are needed) but
not the tier. Difficulty inflation.
**My computed values.** Mei 9, Carlos 27, Jordan 14 → key E (27) confirmed correct.
**Severity.** should-fix. **Needs strengthening in place** (id, type, tier and — as it happens — key letter can all be kept).
**Minimal fix.** Keep both sentences and the 35, and replace the final ask:

> "... What will the sum of their three ages be at the moment when Carlos's age equals the sum of Mei's
> and Jordan's ages at that time?"

with options `A. 35  B. 50  C. 54  D. 56  E. 62`, key **E**.
**Verified myself:** m = 9 → Carlos 27, Mei 9, Jordan 14, present sum 50. Then 27 + t = (9 + t) + (14 + t)
→ t = 4; ages 31, 13, 18, and 13 + 18 = 31 ✓; sum = 62 = 50 + 3*4 ✓. Distractors are all nameable:
A = the past sum handed to you in the stem (wrong moment); B = the present sum (shift forgotten);
C = 50 + t instead of 50 + 3t; D = freezing Carlos (27 = 23 + 2t → t = 2, then 50 + 3*2 = 56).
No two options collapse; key letter E is preserved so the distribution is unchanged.

### D5 — WRD-AGE-037 (extreme_hard, numeric_entry): rewritten item still solves in one equation; the finish is a one-liner.
**What is wrong.** `(2b - 5) + (b - 5) + b + (b + 5) = 65` is one equation in one unknown, and the stored
explanation's own "faster route" reduces the entire finish to "Divya is 4 years younger forever, so 36".
For GRE 167-170 this is a medium dressed as extreme_hard. The rewrite's new ask does make Ana and Divya
load-bearing, so the redundancy fix landed; the tier did not.
**My computed values.** Beto 14, Ana 28, Carlos 19, Divya 24 → 36. Key 36 confirmed correct.
**Severity.** should-fix. **Needs strengthening in place.**
**Minimal fix.** Same cast, same past-sum 65, same ask — but make the extraction a genuine 2x2 system by
replacing "Ana is twice as old as Beto" with a second time-shifted condition:

> "Carlos is 5 years older than Beto and Divya is 10 years older than Beto. Five years ago the sum of all
> four of their ages was 65, and five years from now Ana will be exactly twice as old as Beto will be then.
> How old will Divya be when Ana is 40? Enter your answer as a number."

**Verified myself:** a + 3b = 70 (from the past sum) and a + 5 = 2(b + 5) → a = 31, b = 13, Carlos 18,
Divya 23. Check past sum: 26 + 8 + 13 + 18 = 65 ✓; in 5 years Ana 36 = 2*18 ✓. Ana reaches 40 in 9 years,
Divya is then 23 + 9 = **32** (new answer). Two unknowns, two equations, then the invariant-gap finish.

### D6 — WRD-AGE-043 (extreme_hard, mcq, newly authored): tier-inflated, and a near-repeat of 042's idea.
**What is wrong.** Two problems. (a) After the trivial sum-and-difference step it is one linear equation,
`46 + 2t = 3(8 + t)` — no harder than 042, which is labelled one tier lower. (b) 042 and 043 are both
"a two-person sum grows by 2 per year; set it equal to 3 times a single person's age", the same idea
tested the same way, which the selection rules forbid. Both are new authored items, so the collision was avoidable.
**My computed values.** Deepa 27, Esha 19, Farah 8, t = 22 → key C confirmed correct.
**Severity.** should-fix. **Needs strengthening in place.**
**Minimal fix.** Keep the three given sentences and change the ask so the growth rate is 3 per year (which
also separates it from 042):

> "... In how many years will the sum of all three of their ages be exactly 5 times Farah's age at that time?"

with options `A. 2  B. 4  C. 7  D. 15  E. 75`, key **C** (unchanged letter).
**Verified myself:** present total 27 + 19 + 8 = 54, growing 3/yr; 54 + 3t = 5(8 + t) → t = 7. Check: in
7 years 34 + 26 + 15 = 75 and 5*15 = 75 ✓. Distractors: A = 2 from counting only Deepa and Esha in the
"sum of all three" (46 + 2t = 5(8 + t) → t = 2); B = 4 from crediting the three-age sum with only 1 year
per year (54 + t = 5(8 + t) → t = 3.5, rounded up — the same rounding error 042's trap names);
D = Farah's age at that moment; E = the sum at that moment. No collapse; ascending; key letter preserved.

### D7 — WRD-AGE-028 (hard, quantitative_comparison): both ages given numerically, so it is one equation.
**What is wrong.** 48 and 24 are handed over; the item is `48 + t = (5/4)(24 + t)`. Single equation,
single unknown, labelled hard.
**My computed value.** t = 72; 72 > 24 → key A confirmed correct.
**Severity.** should-fix (lower priority than D4-D6). **Needs strengthening in place.**
**Minimal fix.** Replace the two numeric givens with a relation the student must unpack first:
"Priya is currently twice as old as Sasha, and the sum of their present ages is 72."
**Verified myself:** P = 2S and P + S = 72 → S = 24, P = 48, so the rest of the item and the key are
untouched (t = 72 > 24, key A), while the solve becomes two stages. Explanation Step 1 needs one new line;
the trap's "24 is both Sasha's present age and the invariant difference" line still holds.

### D8 — WRD-AGE-031 (hard, quantitative_comparison): one equation, and the same idea as WRD-AGE-011 (medium).
**What is wrong.** 031 is `3b + 12 = 2(b + 12)`. 011 is `3s - 6 = 5(s - 6)` — the identical
"k times now, m times after a shift, one unknown" template, labelled medium. Same idea tested the same way,
one tier apart.
**My computed values.** Beto 12, Ana 36; 36 < 40 → key B confirmed correct.
**Severity.** should-fix (lowest of the tier defects). **Needs strengthening in place.**
**Minimal fix.** Change the second condition to an aggregate one, which both adds a step and breaks the
template collision with 011:
"Twelve years from now, the sum of their two ages will be exactly 3 times Beto's age at that time."
**Verified myself:** (3b + 12) + (b + 12) = 3(b + 12) → 4b + 24 = 3b + 36 → b = 12, Ana = 36, so Quantity A
is still 36 < 40 and the key stays **B**. Check: in 12 years 48 + 24 = 72 = 3*24 ✓.

### Cosmetic note (no fix required)
- **WRD-AGE-035** stem: "Both ages are positive whole numbers of years" does not say *which* moment's ages.
  It makes no difference here (present = past + 6, so wholeness transfers either way) and the answer is D
  under both readings, so this is not a defect. If you ever touch the stem, "Six years ago both ages were
  positive whole numbers of years" is tighter.

## 2. Answer-key distribution (as stored)

| Type | A | B | C | D | E |
|---|---|---|---|---|---|
| MCQ (12) | 2 (004, 011) | 2 (002, 030) | 3 (001, 023, 043) | 3 (034, 041, 042) | 2 (027, 040) |
| QC (6) | 2 (025, 028) | 2 (031, 038) | 1 (009) | 1 (035) | — |

Select-all keys: 015 = ABD, 020 = BCD, 026 = ACD, 032 = CDE, 036 = CDE.

Assessment: **passes all five distribution targets.** MCQ is 2-3 per letter with D correct 3 times and
E correct twice. Select-all keys are not clustered on {A,B,C} — two are {C,D,E}, and A/B/E all appear.
Two MA keys are identical sets ({C,D,E} twice), which is legal but slightly patterned; 032 and 036 are
adjacent in the file, so if anything is reordered, separate them. All of my proposed fixes above preserve
the existing key letters, except D1 and D5 (numeric entry — no letter) and D2 (numeric entry).

## 3. The ten in-place rewrites, assessed one by one

The brief for each was: the ask made its own conditions redundant, or it was a one-equation item labelled hard.

| id | redundancy fixed? | earns its tier? | new defect introduced? | verdict |
|---|---|---|---|---|
| 027 | Yes — C = 3M is needed for the answer, J = M + 5 is needed for the past sum | **No** — one equation, one unknown | No | **Partial** — see D4 |
| 029 | Yes — both percent conditions are needed to pin M and N, and the third moment needs both | Yes — two-unknown system plus a third moment | **Yes** — mother 25 / daughter 15 | **Partial** — see D2 |
| 030 | Yes — sum, difference and the Yuki halving are all load-bearing | Yes (just) — sum-and-difference, then a halving, then a shift equation | No | **Pass** |
| 032 | Yes — the 24-year gap and the "positive whole number of years ago" clause both do work; the parametric answer t = s - 8 is the point of the item | Yes — genuinely parametric, and option B (t = 0) is a real boundary trap | No | **Pass** — best item in the set |
| 033 | Yes — both stage relations needed | Yes — two-stage age chain, 10/22/34/46 | No | **Pass** |
| 034 | Yes — both percent translations and the shift are needed to reach Jordan | Borderline — one equation in j, but two percent translations in opposite directions first, and the answer is a third person. I would leave it at hard | No | **Pass** (borderline) |
| 035 | N/A (QC indeterminacy item) | Yes — the insight is that one ratio at one moment is one equation in two unknowns | No | **Pass** — see §4 |
| 036 | Yes — both inequalities are needed; p = 4 fails only the second and p = 2 fails only the second, so neither condition is idle | Yes — two strict inequalities plus a boundary case | No | **Pass** |
| 037 | Yes — Ana and Divya are both needed by the new ask, Carlos and Beto by the sum | **No** — one equation, one unknown, and a one-line finish | No | **Partial** — see D5 |
| 040 | Yes — two independent pairs, all four relations needed | Yes — two 2x2 systems plus an aggregate, honestly extreme_hard | No | **Pass** |

Also checked across the whole set for the same two failure modes: no other item has a redundant stated
condition **except 039** (D1), and the only other tier-inflated items are 028 (D7), 043 (D6) and 031 (D8).

### The three authored questions (041, 042, 043) — full scrutiny
- **WRD-AGE-041** (hard, mcq, key D). Independent solve: 2(N - 8) = 3(O - 8) and 4(N + 8) = 5(O + 8)
  → O = 24, N = **32**. Check: 24/16 = 3/2 eight years ago; 40/32 = 5/4 eight years from now; gap 8 at all
  three moments. Two conditions, two unknowns, both needed. All four distractors verified to be real error
  outputs: B = 20 from treating the two moments as 8 years apart instead of 16 (I confirmed
  (3k + 8)/(2k + 8) = 5/4 → k = 4 → 20); C = 24 = Omar now = Nadia 8 years ago = applying the 3:2 ratio to
  the present ages with gap 8; E = 40 = Nadia in 8 years; A = 16 = Omar 8 years ago. No collapse, ASCII clean,
  ages all positive and plausible, no family role asserted so the 8-year gap is fine. **Pass, nothing to change.**
- **WRD-AGE-042** (hard, mcq, key D). Independent solve: 2018 ages 43 and 11; 54 + 2t = 3(11 + t) → t = 21 →
  **2039**. Check: Ines 64, Theo 32, sum 96 = 3*32, gap still 32. Both 2018 conditions needed. Distractors all
  reproduce: C = 2029 from 54 + t = 33 + 3t → t = 10.5 rounded to 11; B = 2023 from solving
  43 + t = 3(11 + t) (Ines = 3*Theo instead of sum = 3*Theo) → t = 5; A = 1997 from subtracting 21;
  E = 2040 from the off-by-one. Ines 32 years older than her son is plausible; the target year is in the
  future relative to today, so the phrasing "will be" is safe. **Pass, nothing to change.**
- **WRD-AGE-043** (extreme_hard, mcq, key C). Key confirmed (t = 22, verified 90 = 3*30), explanation and all
  four distractors verified sound (A: 46 + t = 24 + 3t → 11; B: 38 + 2t = 24 + 3t → 14; D and E are the
  wrong-quantity answers). But tier-inflated and a near-repeat of 042 — **see D6**. It is the only one of the
  three authored items that needs work, and the work is the ask, not the arithmetic.

## 4. WRD-AGE-035 — indeterminacy confirmed

Stem: six years ago Sasha : Marcus = 2 : 3, ages positive whole numbers. Quantity A = Sasha now, Quantity B = 20.

Independent parametrisation: six years ago Sasha = 2k, Marcus = 3k with k a positive integer (k must be an
integer for both ages to be whole), so Sasha now = 2k + 6, unbounded. Two concrete valid scenarios with
**opposite orderings**:

- k = 1: six years ago Sasha 2, Marcus 3 (2/3 ✓, both positive whole numbers). Today Sasha **8**, Marcus 9.
  8 < 20 → **Quantity B greater**.
- k = 10: six years ago Sasha 20, Marcus 30 (20/30 = 2/3 ✓). Today Sasha **26**, Marcus 36.
  26 > 20 → **Quantity A greater**.

(And k = 7 gives Sasha exactly 20 — equality is also attainable, which the stored trap paragraph correctly
names as the source of the C mis-key.) Every scenario satisfies every stated condition, no age is negative,
fractional or absurd, and nobody is unborn six years ago. **Key D is honest. No defect.**

## 5. Passed with nothing to change (22 ids)

WRD-AGE-001, 002, 004, 007, 009, 011, 013, 020, 023, 024, 025, 026, 030, 032, 033, 034, 035, 036, 038,
040, 041, 042

(011 and 031 share a template; the change recommended in D8 is filed against 031, not 011, so 011 passes.)

## 6. Ids with findings

- should-fix, redundancy: **039** (D1)
- should-fix, absurd ages: **029** (D2)
- should-fix, filler distractors: **015** (D3)
- should-fix, tier inflation (needs strengthening in place): **027** (D4), **037** (D5), **043** (D6),
  **028** (D7), **031** (D8)
- blocking: none. No wrong key, no collapsed option, no broken select-all, no notation violation.
