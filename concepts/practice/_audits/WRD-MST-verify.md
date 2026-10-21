# WRD-MST adversarial verification — Translating Word Problems (30 questions)

Read-only audit of `concepts/practice/_source/WRD-MST.json`.
Method: all 30 keys re-derived from scratch in sympy / `fractions.Fraction` BEFORE reading
the stored key or explanation. Option-collapse run pairwise on all 17 MCQ/select-all items.
Notation, option-format, time-band and tag checks run programmatically over the whole file.

## Headline

**No wrong answer key.** All 30 stored keys match my independent computation exactly.
Mechanical checks are clean: zero option collapses, zero non-ASCII characters other than
the em dash, every em dash confined to `Step n —`, all six QC option blocks verbatim, all
numeric_entry `options: null` with the "Enter your answer as a number." closer, all five
select-all items non-degenerate (2-3 correct), all times inside band, all tags well-formed.
Exclusivity ("only", "nothing else", "no member belongs to more than one") is stated in
every group/mixture-shaped stem — the addendum-#5 defect class is absent.

The residual defects are **difficulty inflation** (4 items) and **template repetition**
(2 pairs), plus one arithmetic slip inside a trap, plus a structural finding: this sheet
carries three age problems while a dedicated Ages sheet already exists.

---

## 1. Defects

### D1 — ALG-WPM-004, difficulty inflation. Severity: should-fix (strengthen in place)
Labelled `hard`, but the item is "which equation models d?" with no solving at all —
`d = 60t + 45`. It is a pure one-line translation, strictly easier than ALG-WPM-005 which
sits at `easy`. Tier is FIXED, so this must be strengthened, not relabelled.

Minimal fix — same id, same story, same `mcq` type, key still **E** so the letter
distribution is untouched. Keep the stem's first two sentences, then ask:
"Which of the following equations must be solved to find the time t, in hours, at which the
car is 5 times as far from the town as it was when the timer started?"
Options: A. `60t = 225`; B. `60t + 45 = 5 * 60`; C. `5(60t + 45) = 45`;
D. `60t + 45 = 45 + 5`; E. `60t + 45 = 225`.
**Verified**: 5 * 45 = 225, and 60t + 45 = 225 gives t = 3, so E is the model and it is the
only option satisfied at t = 3. Named errors: A drops the head start; B scales the speed
instead of the distance; C multiplies the wrong side; D reads "5 times" as "5 more".

### D2 — WRD-MST-053, difficulty inflation. Severity: should-fix (strengthen in place)
Labelled `hard`, but it is one equation in one unknown, `(3/4)n + 30 = n + 3`. The only
real difficulty is the answer-asked twist (end, not start).

Minimal fix — same id, same story, key placed at **D** to preserve the distribution:
"Mira had a collection of coins. She gave away one quarter of them, then gave away one
third of what remained, then bought 30 more, and ended with 6 more coins than she had at
the start. How many coins did she have at the end?"
**Verified in Python**: start 48 → 36 after the quarter → 24 after the third → 54 after the
purchase, and 54 = 48 + 6. Every intermediate is a whole number of coins (this is why the
numbers are 48 / one-third / 30 / "6 more" and not the obvious variants — I tested
"3 more" and "36 more", both of which force half a coin).
Distractors, all real quantities from the story: 24, 36, 48 (start), 54 (key at D), 78.

### D3 — WRD-MST-055, difficulty inflation + template repetition. Severity: should-fix
Labelled `hard`, but it is one equation in one unknown, `x + (3x - 12) = 96`. Worse, it is
the same "one part is three times the other, given the total" template as **ALG-WPM-015**,
which sits at `medium` in this same set — the -12 is the only new content.

Minimal fix — same id, same story, key still **A** (Column A greater):
"Three shelves hold 114 books in total. The upper shelf holds 12 fewer books than three
times the number of books on the lower shelf, and the middle shelf holds half as many books
as the lower shelf. / Column A: The number of books on the upper shelf / Column B: 66"
**Verified in Python**: 4.5l = 126 → lower 28, middle 14, upper 72; 28 + 14 + 72 = 114 and
72 = 3(28) - 12. Column A = 72 > 66 → A. Three quantities and a fractional coefficient, so
it is no longer a clone of ALG-WPM-015, and the existing trap (putting the 12 inside the
parentheses) still fires.

### D4 — WRD-MST-058, difficulty inflation. Severity: should-fix (strengthen in place)
Labelled `extreme_hard`, but it is a textbook 2x2 linear system in small integers
(`n + 6 = 3m`, `n = 2m + 12`) solved in one substitution. That is honest `hard`, not
GRE 167-170. Tier is fixed, so strengthen.

Minimal fix — same id, same story, same type, key placed at **D**:
make the second hypothetical move both counts: "If instead 6 more manuals were placed on
the shelf **and 6 novels were removed**, it would then hold twice as many novels as
manuals."
**Verified in Python**: n + 6 = 3m and n - 6 = 2(m + 6) give m = 24, n = 66;
66 + 6 = 72 = 3(24), and 66 - 6 = 60 = 2(24 + 6). Answer 66, placed at D.
Distractors: 24 (manuals), 30 (manuals after the shift), 60, 66 (key), 72.

### D5 — ALG-WPM-046, arithmetic slip inside the trap. Severity: cosmetic
The trap says the mis-translation `2(B - 50)` "would give 4B - 100 = 1550". It gives
**4B + 100 = 1550** — the +200 from Alex's share dominates the -100. My value: B = 362.5.
The trap's conclusion (a non-integer share) survives, only the printed equation is wrong.
Fix: replace "4B - 100 = 1550" with "4B + 100 = 1550, so B = 362.50".

### D6 — ALG-WPM-020, unnamed distractor arithmetic. Severity: cosmetic
The trap says option D, 15, "comes from dividing 380 by 25 alone". 380/25 = 15.2, not 15.
Fix: say "380/25 = 15.2, truncated to 15" or re-describe D as 20 - 5.

### D7 — ALG-WPM-012 / ALG-WPM-022 test the same idea the same way. Severity: cosmetic
Both are "sum of k consecutive same-parity integers, report one named term": 012 (easy,
even, smaller) and 022 (medium, odd, second-largest). SPEC says no two questions may test
the same idea the same way. They differ only in parity, count and which term is asked.
Not worth a rebuild on its own; if a slot is ever needed, 012 is the one to swap.

### D8 — ALG-WPM-020 / ALG-WPM-034 share the count-plus-value 2x2 template. Severity: cosmetic
Coins (20 items, $3.80) and products (200 items, $2,625) are the same two-equation
count/value skeleton with the same "answer the other variable" twist. ALG-WPM-021 is a
third count/value item, though its select-all Diophantine framing makes it genuinely
different. Acceptable as coverage, worth knowing.

### D9 — three age problems in a sheet whose Ages counterpart already exists. Severity: should-fix (structural)
**ALG-WPM-008**, **ALG-WPM-018** and **WRD-MST-040** are age problems.
`_source/WRD-AGE.json` (→ `04-word-problems/07-age-problems-practice.md`) is a built,
separate subtopic sheet of 31 age questions, and **WRD-AGE-031** ("Ana is currently 3 times
as old as Beto. Twelve years from now, Ana will be exactly twice as old...") is the same
two-condition age system as WRD-MST-040, while **WRD-AGE-011** is the same shape as
ALG-WPM-018. No id is duplicated across sheets (I grepped: 040 and 008 appear only in
WRD-MST.json), so nothing is broken — but this is exactly the "belongs to an
already-shipped subtopic sheet" rule the build agent used to reject 47 bank questions,
applied inconsistently to the sheet's own contents. See the 040 adjudication below.

### D10 — WRD-MST-040 trap ends vaguely. Severity: cosmetic
"...can land anywhere" names no number and no option. SPEC requires the trap to name the
wrong value and its option. The second half of the trap does this correctly (m = 55 → A).
Fix: cut the "can land anywhere" clause, or state that forcing s = 12 gives m = 34 (still
below 45, so the forced-integer student reaches B for the wrong reason) and that forcing
s = 13 via the second condition gives m = 36.

### Non-defects checked and cleared
- **QC decidability**: 008 = C, 023 = C, 055 = A, 059 = B, 040 = B all resolve under the
  stated conditions; **052 is genuinely D** — Column A - Column B = m - 6, and m > 4 admits
  m = 5 (B), m = 6 (equal) and m = 7 (A). Neither a false D nor a missed D anywhere.
- **Select-all robustness**: 051 (A,C,E), 021 (B,C,D), 044 (A,C), 057 (A,B,E), 061 (B,C,D).
  Each has 2-3 correct options; each hinges on a condition actually stated in the stem
  (integer counts, "at least one of each", s < m < L, the revenue range), so no plausible
  alternative reading changes the set.
- **Trap landing**: every distractor I checked resolves to a listed option — 001 C = 20 via
  L = 2(s+7); 040 A via m = 55; 055 B via 3(x-12); 061 A via "7 times" = 25n = 225 and
  E via 7n + 7 = 245 and via 7n - 21 = 217; 050 A/C/D/E all reproduced exactly.
- **ALG-WPM-050 as rewritten in this patch is correct and is a genuine repair** of the live
  bank item (see section 5). W = 60p, new drain 5p, n = 12; p cancels because it appears in
  both phases. Key B confirmed.

---

## 2. Answer-key distribution

**12 MCQ** — target 2-3 per letter, D and E correct at least twice:

| Letter | Count | Ids |
|---|---|---|
| A | 3 | ALG-WPM-005, ALG-WPM-020, WRD-MST-054 |
| B | 2 | ALG-WPM-012, ALG-WPM-050 |
| C | 3 | ALG-WPM-016, ALG-WPM-022, ALG-WPM-034 |
| D | 2 | WRD-MST-053, WRD-MST-058 |
| E | 2 | ALG-WPM-004, ALG-WPM-001 |

**On target.** 2-3 per letter, D twice, E twice. All four strengthening proposals above
preserve their key letters deliberately, so the table survives them.

**6 quantitative_comparison**: A 1 (055), B 2 (040, 059), C 2 (008, 023), D 1 (052).
Healthy; no over-keying of D (the usual failure) and no C-clustering.

**5 multiple_answer**: {A,C,E}, {B,C,D}, {A,C}, {A,B,E}, {B,C,D}.
Per-letter correctness counts: A 3, B 3, C 4, D 2, E 2. **Not clustered on {A,B,C}** — D and
E each appear in two keys, and only one key (044) is a pure {A,B,C} subset.

---

## 3. WRD-MST-040 adjudication — the son aged 12.5

**Computation, independent**: m - 5 = 4(s - 5) and m + 10 = 2(s + 10) give
2s = 25, so s = 12.5 and m = 35. Column A = 35 < 45. **Key B is correct.**

**Verdict: acceptable, not an authoring error. Keep it.** Three reasons.

1. **The half-year is never the answer.** The question asks for the man's age, which is
   exactly 35 — an integer. The 12.5 is an intermediate the student passes through. A
   numeric-entry item ending "How old is the son?" → 12.5 would read as an authoring
   slip; a QC on an integer quantity does not.
2. **Age in years is a continuous measure, not a count.** The capsule's own trap list says
   "Assuming the answer must be a whole number. People and tickets must be; money and time
   need not be." A *number of people* must be an integer; a *duration* need not. This item
   is the capsule's trap made testable, which is a legitimate design intent.
3. **The system is consistent and the check verifies cleanly**: 5 years ago 30 and 7.5, and
   30 = 4(7.5); in 10 years 45 and 22.5, and 45 = 2(22.5). No hidden contradiction, and the
   forced-integer escape really is closed — I confirmed neither s = 12 nor s = 13 satisfies
   both conditions.

**Two caveats Adi should act on.**
- Real GRE age items conventionally resolve to whole years, so the hook is slightly
  off-convention even though it is not wrong. Keep it, but make the trap text carry the
  lesson explicitly — it currently half-does this and then trails off into "can land
  anywhere" (defect D10). Tightening D10 is what converts this from "odd" to "instructive".
- The **stronger** objection to this item is not the 12.5 at all — it is D9. This is an age
  problem in the *Translation* sheet while a 31-question Ages sheet owns that template.

**If Adi would rather have no age problems in this sheet**, here is a verified drop-in
replacement that keeps the same pedagogical hook (a non-integer answer is legal), the same
`hard` / `quantitative_comparison` slot, and the same key letter **B**:

> Two numbers have a sum of 31, and the larger is 4 more than three times the smaller.
> Column A: The smaller number
> Column B: 7

**Verified in sympy**: s + (3s + 4) = 31 → 4s = 27 → smaller = 6.75, larger = 24.25, sum
31. Column A = 6.75 < 7, so **B**, and it is decidable with no unstated condition. The
"4 more than three times" order trap fires (reading it as 4 - 3s or 3(s + 4) both break),
and a student who insists the numbers are integers gets stuck and guesses.
**Honest caveat on my own proposal**: it is in the same family as ALG-WPM-001 ("the larger
is 7 more than twice the smaller"), which is already in this set. 001's second condition is
an average and it asks for the sum, so it is not a duplicate — but it is adjacent, and
that is the price of dropping 040. My primary recommendation remains **keep 040**.

---

## 4. Spot-check — were the 47 rejections from `word_problems/multi_step_problems.json` correct?

I read the full stem of nine rejected ids (six required). **The claim holds.** Every one is
squarely a different, already-shipped subtopic. Shipped sheets confirmed present in
`04-word-problems/`: 02-distance-speed-time, 03-work-and-rate, 04-mixtures,
05-simple-compound-interest, 06-profit-loss-discount, 08-percentage-word-problems,
09-ratio-word-problems, plus 07-age-problems built from `_source/WRD-AGE.json`.

| Id | Content | Belongs to | Rejection |
|---|---|---|---|
| WRD-MST-006 | salt:water 1:4, add 10 g salt, new ratio | 04-mixtures | correct |
| WRD-MST-016 | +20% then -15%, reverse to Year 1 | 08-percentage-word-problems | correct |
| WRD-MST-017 | two pipes, one turned off mid-fill (QC) | 03-work-and-rate | correct |
| WRD-MST-021 | round trip 75/50 mph, average speed (QC) | 02-distance-speed-time | correct |
| WRD-MST-025 | compound 10% 2yr vs simple 21% (QC) | 05-simple-compound-interest | correct |
| WRD-MST-041 | tea/coffee mix at $4/kg, 33 1/3% profit | 04-mixtures + 06-profit-loss | correct |
| WRD-MST-008 | Maria 3x daughter, 2x in 8 years | **07-age-problems** | correct |
| WRD-MST-015 | siblings 2:3:5, oldest 15 more | **07-age-problems** / 09-ratio | correct |
| WRD-MST-013 | 40% more than 50, then 25% less | 08-percentage-word-problems | correct |

**Conclusion: `word_problems/multi_step_problems.json` is essentially redundant for the
WRD-MST sheet.** It is not a "multi-step translation" bank at all — it is a grab-bag of
one question each from seven subtopics that now have their own dedicated banks and sheets.
Only WRD-MST-040 survived, and by the rule above even that belongs in Ages. The 11 authored
WRD-MST-05x/06x ids are what actually populate this subtopic.

**Two live defects I noticed in that file while spot-checking** (out of scope, but Adi
should know since these questions ship in the portal bank):
- **WRD-MST-013** is a degenerate select-all — stored key is `["A"]`, a single option. This
  is addendum-defect #1, live in both bank copies.
- **WRD-MST-043** has an unedited authoring artifact in its stem: *"It amounts to $11,025
  after 2 years and $12,000 (approximately) — actually it amounts to $11,576.25 after 3
  years."* The author's self-correction was shipped verbatim. Also violates ASCII-only.
- **WRD-MST-041** contains the non-ASCII glyph `⅓` ("33⅓%").

---

## 5. The three claimed bank defects in `algebra/word_problem_modelling.json`

All three **CONFIRMED**, and two are worse than reported. Both bank copies are affected
identically — `gre-free/pro/bank/` and `DEPLOY_EXCLUDED_2026-09-20/gre-pro/bank/` — all
three keys read D, C, D in both files. None of these three is in the WRD-MST 30, so none is
repaired by shipping this sheet (the patch's ALG-WPM-050 rewrite repairs only the sheet's
copy of that one id).

### ALG-WPM-025 — unanswerable. CONFIRMED. Blocking.
"Tens digit is 3 more than the units digit; reversed, the number is 27 less than the
original." Writing u for the units digit, original = 11u + 30 and reversed = 11u + 3, so the
difference is **identically 27** for every such number. The second condition carries no
information. **Verified in Python**: the qualifying numbers are 30, 41, 52, 63, 74, 85, 96
(the bank's own explanation lists only six — it misses 30), and all of them satisfy both
stated conditions, so **all five options A-E are correct**. Stored key D.

Worse: the explanation ships the author's live self-negotiation — *"This question needs a
unique answer. Let me add a constraint: 'the sum of the digits is 11.'"* A scratchpad
monologue is in the student-visible field.

**Minimal fix**: adopt the constraint the explanation itself proposes. Add "and the sum of
the digits is 11" to the stem, then rewrite the explanation to derive it cleanly and delete
the monologue. **Verified**: digit sums over the qualifying numbers are 3, 5, 7, 9, 11, 13,
15 — exactly one is 11, giving 74, so **stored key D stands** and no option needs changing.
The "27 less" clause should then be recast as a check line rather than a condition, or
dropped, since it remains vacuous.

### ALG-WPM-047 — stored key C self-contradictory; true key B. CONFIRMED. Blocking.
Scaling both speeds by 1.2 scales both leg times by 1/1.2, so T2 = T1/1.2 and the decrease
is 1 - 1/1.2 = **1/6 = 16.67%** (exact, independent of v1, v2 and D — verified with
`Fraction`). The claim is wrong and the decrease is **less than 20%** → **B**. Option C
("the claim is wrong; time decreases by exactly 20%") is internally contradictory: if it
decreased by exactly 20% the claim would be right. The explanation's own last sentence says
*"The answer is B"* — so the key field simply disagrees with the prose above it.

**Minimal fix**: change `answer` to `"B"`. No other edit needed for correctness. Two
cosmetic follow-ups: the stem and options use `v₁`/`v₂` subscripts and the U+2212 minus
sign, both ASCII violations — replace with `v1`, `v2`, `-`.

### ALG-WPM-050 — stored key D requires p = 0. CONFIRMED. Blocking.
With daily net -(s - p) then -(2s - p), emptiness gives W = 30(s - p) and
m = 30(s - p)/(2s - p), which depends on p/s. **Verified in sympy**, writing r = p/s:
Day 10 needs r = 1/2, Day 12 needs r = 1/3, Day 14 needs r = 1/8, **Day 15 needs r = 0**,
Day 20 needs r = -1 (impossible). So three of the five options are attainable for a
legitimate 0 < p < s and the stored key D is attainable only at p = 0 — which the stem
forbids, since it says the factory produces p widgets per day with s > p. The explanation
admits it outright: *"This depends on p and s values. We need additional info... However, if
we assume p = 0..."*. Unanswerable as written, with a shipped admission of it.

**Minimal fix**: adopt the patch's own rewrite back into the bank. Fixing the shipment rate
to a multiple of production makes p cancel: production p, shipments 3p, empty at end of
Day 30 → W = 60p; new shipments 6p → net 5p → **Day 12**. **Verified**: 60p/(5p) = 12 for
every p > 0. Key becomes B, and options A/C/D/E map to nameable errors (6p drain → 10;
"double the shipments halves the time" → 15; forgetting production in phase 1 → 18;
confusing shipment rate with net rate → 20). That is precisely the object already sitting in
`_source/WRD-MST.json`, so the repair is a copy-across, not new authoring.

**Recommendation**: these three are live in the portal bank and none of them is reachable
by the practice-sheet pipeline. They need a direct bank patch (both copies), independent of
this sheet.

---

## 6. Clean — nothing to change

Keys, options, explanations, traps, notation, times and tags all verified correct:

ALG-WPM-005, ALG-WPM-011, ALG-WPM-015, ALG-WPM-016, ALG-WPM-018, ALG-WPM-021,
ALG-WPM-022, ALG-WPM-023, ALG-WPM-024, ALG-WPM-034, ALG-WPM-044, ALG-WPM-001,
ALG-WPM-050 (as rewritten in this patch), ALG-WPM-008,
WRD-MST-051, WRD-MST-052, WRD-MST-054, WRD-MST-056, WRD-MST-057, WRD-MST-059,
WRD-MST-060, WRD-MST-061.

Cosmetic-only, otherwise clean: ALG-WPM-012, ALG-WPM-020, ALG-WPM-046.
Needs strengthening in place: ALG-WPM-004, WRD-MST-053, WRD-MST-055, WRD-MST-058.
Keep, with a trap tightening: WRD-MST-040.

### The eleven authored ids, verdict each
All eleven are solvable, uniquely determined, realistically quantified, free of hidden
second solutions, and their explanations derive their keys without an arithmetic slip.

| Id | My independent result | Stored | Verdict |
|---|---|---|---|
| WRD-MST-051 | A, C, E translate to n - 5 | A,C,E | pass |
| WRD-MST-052 | A - B = m - 6; m > 4 admits both signs and equality at m = 6 | D | pass, genuinely D |
| WRD-MST-053 | start 108, end 111 | D | key right, tier inflated (D2) |
| WRD-MST-054 | s = 3, m = 5; 20 - 18 = 2 | A | pass |
| WRD-MST-055 | lower 27, upper 69 > 66 | A | key right, tier inflated (D3) |
| WRD-MST-056 | 3p + 8e = 48 forces e ≡ 0 mod 3; only (p,e) = (8,3) | 3 | pass, unique |
| WRD-MST-057 | only (3,8,9) and (4,5,11); A,B,E must be true | A,B,E | pass |
| WRD-MST-058 | m = 18, n = 48 | D | key right, tier inflated (D4) |
| WRD-MST-059 | x = 3y - 4, so A - B = -8 always | B | pass, elegant |
| WRD-MST-060 | j multiple of 4 and ≤ 14 → j = 12, total 51 | 51 | pass |
| WRD-MST-061 | 200 < 7n + 21 < 250 → n ∈ 26..32 | B,C,D | pass |

No key among the eleven is wrong. The only issues are the three inflated tiers.
