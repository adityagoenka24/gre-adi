# Practice Sets

Level-wise practice for each concept capsule. One sheet per subtopic, **30 questions**: 5 easy · 8 medium · 12 hard · 5 extreme.

Each sheet has three parts — **A** the questions (clean, printable), **B** a one-glance answer key, **C** full worked solutions with the trap named.

## How this stays in sync with the portal

Every question here is live in the GRE Quant Pro question bank under the ID printed beside it. The sheets are not written by hand — each one is **generated** from a source file:

```
_source/<BANK-CODE>.json   →   build_practice_md.py   →   <subtopic>-practice.md
                           →   sync_bank.py           →   gre-pro/bank/…  (+ all bank copies)
```

So the markdown and the JSON can never drift. To change a question: edit `_source/<CODE>.json`, then re-run both scripts.

```
python3 _source/build_practice_md.py _source/ARI-PCT.json 01-arithmetic/01-percentages-practice.md
python3 _source/validate.py                 # schema, split, type mix, ASCII
python3 _source/sync_bank.py <workspace-root>   # writes into every bank tree
```

`sync_bank.py` writes by question ID into **all three** bank trees (`gre-pro/bank`, `gre-free/bank`, `gre-free/pro/bank`) and into the matching `*_mixed_bag.json` files, appends any `is_new` questions, then refreshes `meta.total_questions`, `meta.distribution` and `index.json`. It is idempotent.

`_source/SPEC.md` is the authoring spec — the quality bar every question is held to, plus an addendum listing the defect patterns found in the original bank.

## Sheets — Arithmetic complete (13 subtopics, 390 questions)

| # | Subtopic | Bank code | Capsule | Sheet |
|---|---|---|---|---|
| 1 | Percentages | `ARI-PCT` | [capsule](../01-arithmetic/01-percentages.md) | [practice](01-arithmetic/01-percentages-practice.md) |
| 2 | Fractions & Decimals | `ARI-FRC` | [capsule](../01-arithmetic/02-fractions-decimals.md) | [practice](01-arithmetic/02-fractions-decimals-practice.md) |
| 3 | Ratios & Proportions | `ARI-RAT` | [capsule](../01-arithmetic/03-ratios-proportions.md) | [practice](01-arithmetic/03-ratios-proportions-practice.md) |
| 4 | Exponents & Roots | `ARI-EXP` | [capsule](../01-arithmetic/04-exponents-roots.md) | [practice](01-arithmetic/04-exponents-roots-practice.md) |
| 5 | Rates & Unit Conversions | `ARI-RAE` | [capsule](../01-arithmetic/05-rates-unit-conversions.md) | [practice](01-arithmetic/05-rates-unit-conversions-practice.md) |
| 6 | Remainders & Cyclicity | `NUM-REM` | [capsule](../01-arithmetic/06-remainders-cyclicity.md) | [practice](01-arithmetic/06-remainders-cyclicity-practice.md) |
| 7 | Absolute Value | `NUM-ABS` | [capsule](../01-arithmetic/07-absolute-value.md) | [practice](01-arithmetic/07-absolute-value-practice.md) |
| 8 | Powers of 10 & Scientific Notation | `ARI-P10` | [capsule](../01-arithmetic/08-powers-of-10-scientific-notation.md) | [practice](01-arithmetic/08-powers-of-10-scientific-notation-practice.md) |
| 9 | Number Line & Ordering | `ARI-NLO` | [capsule](../01-arithmetic/09-number-line-ordering.md) | [practice](01-arithmetic/09-number-line-ordering-practice.md) |
| 10 | Estimation & Approximation | `ARI-EST` | [capsule](../01-arithmetic/10-estimation-approximation.md) | [practice](01-arithmetic/10-estimation-approximation-practice.md) |
| 11 | Sequences & Patterns | `ARI-SEQ` | [capsule](../03-algebra/08-sequences-series.md) | [practice](03-algebra/08-sequences-series-practice.md) |
| 12 | Mixture Problems | `WRD-MIX` | [capsule](../04-word-problems/04-mixtures.md) | [practice](04-word-problems/04-mixtures-practice.md) |
| 13 | Ratio Word Problems | `WRD-RAT` | [capsule](../04-word-problems/09-ratio-word-problems.md) | [practice](04-word-problems/09-ratio-word-problems-practice.md) |

Sequences & Patterns sits under Algebra in the capsule folders but under Arithmetic in the bank — the sheet lives beside its capsule.

## Sheets — Statistics & Probability complete (11 subtopics, 330 questions)

| # | Subtopic | Bank code | Capsule | Sheet |
|---|---|---|---|---|
| 1 | Mean, Median & Mode | `STA-MMM` | [capsule](../07-statistics-probability/01-mean-median-mode.md) | [practice](07-statistics-probability/01-mean-median-mode-practice.md) |
| 2 | Weighted Average | `STA-WAV` | [capsule](../07-statistics-probability/02-weighted-average.md) | [practice](07-statistics-probability/02-weighted-average-practice.md) |
| 3 | Range & Standard Deviation | `STA-RSD` | [capsule](../07-statistics-probability/03-range-standard-deviation.md) | [practice](07-statistics-probability/03-range-standard-deviation-practice.md) |
| 4 | Quartiles, IQR & Percentiles | `STA-IQR` | [capsule](../07-statistics-probability/04-quartiles-percentiles.md) | [practice](07-statistics-probability/04-quartiles-percentiles-practice.md) |
| 5 | Data Distribution | `STA-DDI` | [capsule](../07-statistics-probability/05-data-distribution.md) | [practice](07-statistics-probability/05-data-distribution-practice.md) |
| 6 | Counting & Permutations | `STA-PRM` | [capsule](../07-statistics-probability/06-counting-permutations.md) | [practice](07-statistics-probability/06-counting-permutations-practice.md) |
| 7 | Combinations | `STA-CMB` | [capsule](../07-statistics-probability/07-combinations.md) | [practice](07-statistics-probability/07-combinations-practice.md) |
| 8 | Basic Probability | `STA-PRB` | [capsule](../07-statistics-probability/08-basic-probability.md) | [practice](07-statistics-probability/08-basic-probability-practice.md) |
| 9 | Compound Probability | `STA-CPR` | [capsule](../07-statistics-probability/09-compound-probability.md) | [practice](07-statistics-probability/09-compound-probability-practice.md) |
| 10 | Independent & Dependent Events | `STA-IDE` | [capsule](../07-statistics-probability/10-independent-dependent-events.md) | [practice](07-statistics-probability/10-independent-dependent-events-practice.md) |
| 11 | Overlapping Sets | `STA-OVL` | [capsule](../07-statistics-probability/11-overlapping-sets.md) | [practice](07-statistics-probability/11-overlapping-sets-practice.md) |

The three probability sheets divide the ground deliberately: `STA-PRB` is single-event work (complements, the addition rule, geometric probability), `STA-CPR` is multi-stage chains (sequential draws, at-least-one by complement, trees), and `STA-IDE` is the independence question itself (testing P(A and B) = P(A)P(B), conditional probability, mutually exclusive vs independent). Nothing is duplicated across them.

## Sheets — Number Properties complete (8 subtopics, 240 questions)

| # | Subtopic | Bank code | Capsule | Sheet |
|---|---|---|---|---|
| 1 | Factors & Multiples | `NUM-FAM` | [capsule](../02-number-properties/01-factors-multiples.md) | [practice](02-number-properties/01-factors-multiples-practice.md) |
| 2 | Primes & Prime Factorization | `NUM-PRF` | [capsule](../02-number-properties/02-primes-prime-factorization.md) | [practice](02-number-properties/02-primes-prime-factorization-practice.md) |
| 3 | Divisibility Rules | `NUM-DIV` | [capsule](../02-number-properties/03-divisibility-rules.md) | [practice](02-number-properties/03-divisibility-rules-practice.md) |
| 4 | GCD & LCM | `NUM-GCL` | [capsule](../02-number-properties/04-gcd-lcm.md) | [practice](02-number-properties/04-gcd-lcm-practice.md) |
| 5 | Consecutive Integers | `NUM-CON` | [capsule](../02-number-properties/05-consecutive-integers.md) | [practice](02-number-properties/05-consecutive-integers-practice.md) |
| 6 | Even & Odd Parity | `NUM-EOP` | [capsule](../02-number-properties/06-even-odd-parity.md) | [practice](02-number-properties/06-even-odd-parity-practice.md) |
| 7 | Digits & Place Value | `NUM-DPV` | [capsule](../02-number-properties/07-digits-place-value.md) | [practice](02-number-properties/07-digits-place-value-practice.md) |
| 8 | Number Theory Essentials | `NUM-NTH` | [capsule](../02-number-properties/08-number-theory-essentials.md) | [practice](02-number-properties/08-number-theory-essentials-practice.md) |

Absolute Value (`NUM-ABS`) and Remainders & Cyclicity (`NUM-REM`) are capsules in this section but were
built during the Arithmetic run and are listed there. The three sets divide their ground deliberately:
`NUM-FAM` is plain factor and multiple counting, `NUM-PRF` owns everything that goes through a prime
factorisation (including factorial prime-power counts and trailing zeros), `NUM-DIV` is the
divisibility tests themselves — the 2/3/4/5/6/8/9/11/25 rules, digit-sum arguments, unknown-digit
problems and coprime splitting — `NUM-GCL` owns gcd and lcm as such (the min/max construction, the
gcd x lcm = product identity, coprimality, and the coinciding-cycles and grouping word problems),
`NUM-CON` owns consecutive-integer structure (the count and sum formulas, mean equals median, the
k! divisibility of a product of k consecutive integers, and representation as a sum), `NUM-EOP`
owns parity, `NUM-DPV` owns the 10a + b decomposition, digit sums, reversal and digit counting, and
`NUM-NTH` is the synthesis set — number families, closure, rational vs irrational, squares and
cubes, and the zero-and-one edge cases — carrying only questions that chain two or more results
together. Remainder-of-a-series work stays in `NUM-REM`.

The bank file `number_properties/integers_divisibility.json` (`NUM-INT`, 50 questions) has no
capsule and no practice sheet. It is still live in the bank and still served by mocks; it needs
either a capsule of its own or folding into `NUM-DIV`.

## Sheets — Algebra complete (8 subtopics, 240 questions)

| # | Subtopic | Bank code | Capsule | Sheet |
|---|---|---|---|---|
| 1 | Algebraic Expressions | `ALG-EXP` | [capsule](../03-algebra/01-algebraic-expressions.md) | [practice](03-algebra/01-algebraic-expressions-practice.md) |
| 2 | Factoring | `ALG-FAC` | [capsule](../03-algebra/02-factoring.md) | [practice](03-algebra/02-factoring-practice.md) |
| 3 | Linear Equations | `ALG-LIN` | [capsule](../03-algebra/03-linear-equations.md) | [practice](03-algebra/03-linear-equations-practice.md) |
| 4 | Systems of Equations | `ALG-SIM` + `ALG-LN2` | [capsule](../03-algebra/04-systems-of-equations.md) | [practice](03-algebra/04-systems-of-equations-practice.md) |
| 4 | Inequalities | `ALG-INQ` | [capsule](../03-algebra/05-inequalities.md) | [practice](03-algebra/05-inequalities-practice.md) |
| 5 | Quadratic Equations | `ALG-QDR` | [capsule](../03-algebra/06-quadratic-equations.md) | [practice](03-algebra/06-quadratic-equations-practice.md) |
| 6 | Functions | `ALG-FNC` | [capsule](../03-algebra/07-functions.md) | [practice](03-algebra/07-functions-practice.md) |
| 7 | Algebraic Exponents & Radicals | `ALG-EXR` | [capsule](../03-algebra/09-algebraic-exponents-radicals.md) | [practice](03-algebra/09-algebraic-exponents-radicals-practice.md) |

The seam runs: `ALG-EXP` owns expansion and collection — the special products used as EXPANSIONS —
`ALG-FAC` owns the same identities in REVERSE plus grouping and cancellation, and `ALG-LIN` owns the
single-variable equation, including parameters, literal equations and the no-solution case. Two-variable
systems, inequalities and quadratic solving are not built yet and own their own ground.

Sequences & Series (`ARI-SEQ`) sits under Algebra in the capsule folders but was built in the
Arithmetic run and is listed there.

`ALG-INQ` owns solution sets and sign charts, `ALG-QDR` owns the discriminant, Vieta and completing
the square, and `ALG-FNC` owns notation, composition, inverses and transformations — a parabola's
vertex is ALG-QDR's, the same parabola transformed as f(x) is ALG-FNC's.

**Systems of equations is the one set that draws from two bank files.** The capsule
`04-systems-of-equations.md` is a single capsule and sheets map 1:1 to capsules, so it gets one
sheet of 30 curated from both `simultaneous_equations.json` (ALG-SIM ids, 12 of the 30) and
`linear_equations_2var.json` (ALG-LN2 ids, 18). Questions keep their own ids and `sync_bank.py`
writes each back to whichever bank file holds it.

Two algebra bank files remain unclaimed, the same situation `NUM-INT` was in: `ALG-SEQ`
(sequences_series.json, 50 questions — distinct from the shipped ARI-SEQ, which owns the capsule)
and `ALG-WPM` (word_problem_modelling.json, 50, whose capsules live in the Word Problems section).
Both are live in the bank and served by mocks; neither has a sheet. Audit-in-place, as was done for
NUM-INT, is the cheap resolution. Two further algebra bank files
have no capsule: `ALG-SEQ` (sequences_series.json, 50 questions — distinct from the shipped ARI-SEQ)
and `ALG-WPM` (word_problem_modelling.json, 50).

## Sheets — Word Problems complete (9 subtopics, 270 questions)

| # | Subtopic | Bank code | Capsule | Sheet |
|---|---|---|---|---|
| 1 | Distance, Speed & Time | `WRD-DST` | [capsule](../04-word-problems/02-distance-speed-time.md) | [practice](04-word-problems/02-distance-speed-time-practice.md) |
| 2 | Work & Rate | `WRD-WRK` | [capsule](../04-word-problems/03-work-and-rate.md) | [practice](04-word-problems/03-work-and-rate-practice.md) |
| 3 | Simple & Compound Interest | `WRD-INT` | [capsule](../04-word-problems/05-simple-compound-interest.md) | [practice](04-word-problems/05-simple-compound-interest-practice.md) |
| 4 | Profit, Loss & Discount | `WRD-PNL` | [capsule](../04-word-problems/06-profit-loss-discount.md) | [practice](04-word-problems/06-profit-loss-discount-practice.md) |
| 5 | Percentage Word Problems | `WRD-PCT` | [capsule](../04-word-problems/08-percentage-word-problems.md) | [practice](04-word-problems/08-percentage-word-problems-practice.md) |
| 3 | Mixtures | `WRD-MIX` | [capsule](../04-word-problems/04-mixtures.md) | [practice](04-word-problems/04-mixtures-practice.md) |
| 4 | Ratio Word Problems | `WRD-RAT` | [capsule](../04-word-problems/09-ratio-word-problems.md) | [practice](04-word-problems/09-ratio-word-problems-practice.md) |
| 8 | Translating Word Problems | `WRD-MST` + `ALG-WPM` | [capsule](../04-word-problems/01-translating-word-problems.md) | [practice](04-word-problems/01-translating-word-problems-practice.md) |
| 9 | Age Problems | `WRD-AGE` | [capsule](../04-word-problems/07-age-problems.md) | [practice](04-word-problems/07-age-problems-practice.md) |

Mixtures and Ratio Word Problems were built during the Arithmetic run. The seam with the shipped
`ARI-RAE` (Rates & Unit Conversions) is narrow and was deliberately thinned: ARI-RAE keeps the
average-speed and worker-days material it already had, so `WRD-DST` carries only two average-speed
items and leans on relative motion, meeting and overtaking, and stream separation, while `WRD-WRK`
was renumbered off ARI-RAE's and WRD-RAT's tank-filling numbers.

**`WRD-PCT` is the most heavily authored set in the product — 19 of its 30 questions were written
from scratch.** Its mechanics are nearly identical to `ARI-PCT` (Percentages), the first set ever
built, so most of the bank was rejected rather than shipped as duplicates. The line the two sheets
draw, and it must be held: **ARI-PCT asks "compute the percent"; WRD-PCT asks "percent of *what*"** —
base identification and construction. WRD-PCT covers nested subgroups, two groups with different
rates, a share riding on a moving total, three-level nesting, the reverse weighted average, an
absolute count against a percentage constraint, percentage points in both directions, and a two-way
table. Keep it separate; do not let a future batch drift it back into bare percent arithmetic.

**`WRD-MST` (Translating Word Problems) and `WRD-AGE` (Age Problems) shipped 2026-09-26**, closing
the section. Both sheets were adversarially verified before syncing and every one of the 60 stored
keys survived the independent re-solve — the residual defect class in this batch was tier honesty,
not correctness.

`WRD-MST` is drawn from two bank files, as the capsule's header (`Bank codes: ALG-WPM, WRD-MST`)
requires: 18 curated `ALG-WPM` ids, `WRD-MST-040`, and **11 authored ids (`WRD-MST-051`–`061`)**.
That heavy authoring was forced: **`word_problems/multi_step_problems.json` (48 questions) is
essentially redundant.** 47 of its 48 items belong to subtopics that now have their own shipped
sheets — spot-checked on nine ids, which resolved to mixtures, percentages, work/rate,
distance-speed-time, interest, profit and age. It is not a translation bank at all. The `WRD-MST`
subtopic is now carried by the authored `05x`/`06x` ids.

`WRD-AGE` took 27 curated ids plus **3 authored (`041`–`043`)**. Ten bank questions were rewritten
in place because their ask made one of their own stated conditions redundant, or because they were
one-equation items labelled hard.

Two structural calls were left open for Adi rather than decided by an agent: **three age-flavoured
items (`ALG-WPM-008`, `ALG-WPM-018`, `WRD-MST-040`) sit in the Translating sheet** while a dedicated
Ages sheet now exists — no id is duplicated across the two sheets, so nothing is broken, but
`WRD-MST-040` and the rewritten `WRD-AGE-031` are now near-identical QC items (past k-times plus
future twice-as-old system, both keyed B, both hard). Retiring `WRD-MST-040` in favour of a
non-age translation item is the clean fix; a verified drop-in exists in
`_audits/WRD-MST-verify.md`. Second: `WRD-MST-040`'s answer runs through a son aged 12.5. The
adjudication was **keep it** — the *asked* quantity is the mother's integer 35, the half-year is
only an intermediate, and no integer son age satisfies both conditions — and its trap was rewritten
to teach exactly that.

**THREE BLOCKING DEFECTS ARE LIVE IN `algebra/word_problem_modelling.json`** and are not reachable
by the practice-sheet pipeline, because none of the three is in the shipped 30. They need a direct
bank patch:

- **`ALG-WPM-025` is unanswerable.** Original minus reversed is identically 27, so the second
  condition is vacuous and all five options are correct. Its explanation also ships the author's
  live monologue ("This question needs a unique answer. Let me add a constraint..."). Verified fix:
  add "the sum of the digits is 11", which makes 74 unique and leaves stored key D standing.
- **`ALG-WPM-047`'s stored key C is wrong.** The decrease is exactly 1 − 1/1.2 = 1/6 = 16.67%,
  independent of every variable; the true key is **B**, and the explanation's own last line says so.
  Also carries non-ASCII (`v₁`, U+2212).
- **`ALG-WPM-050`'s stored key D requires p = 0**, which its own stem forbids. The patch's rewrite
  of the item is a correct repair and can be copied back to the bank.

Three further live defects in `word_problems/multi_step_problems.json`: **`WRD-MST-013` is a
degenerate select-all** (one option, key `["A"]`), **`WRD-MST-043` ships the author's unedited
self-correction inside the stem** ("...$12,000 (approximately) — actually it amounts to
$11,576.25..."), and `WRD-MST-041` carries a `1/3` glyph in non-ASCII form. Given that file's
redundancy, retiring it is probably cheaper than repairing it.

## The standard every question meets

- Curated from the existing bank and rewritten — original IDs kept, so nothing on the portal breaks.
- Every distractor is the output of a **nameable** student error; no filler numbers.
- Every trap names the concrete wrong reasoning **and** the option it leads to.
- Every explanation shows each step and ends with a check.
- Every answer key independently re-solved from scratch by a second pass before being written back, with the arithmetic brute-forced in Python.

## Timings

Each question carries an ETS-realistic time. The GRE gives ~1 min 45 s per question (Section 1: 12 questions / 21 min; Section 2: 15 / 26 min), so a full sheet runs roughly 45 minutes of clock time.

## Still to do

05 Geometry, 06 Coordinate Geometry, 08 Data Interpretation — 28 subtopics.

**Done so far: 47 subtopics, 1,410 questions** — Arithmetic (13), Statistics & Probability (11),
Number Properties (8), Algebra (8) and Word Problems (9, two of which were built during the
Arithmetic run).

`NUM-INT` (integers_divisibility.json, 50 questions) has no capsule or practice sheet but was
audited in place on 2026-09-18. Source of truth: `concepts/practice/_audits/NUM-INT.json`.
`ALG-SEQ` (algebra/sequences_series.json, 50) is the one remaining unclaimed bank file — the
sequences capsule was mapped to `ARI-SEQ` in the Arithmetic run. Audit-in-place is the cheap fix.

**PIPELINE GAP — `sync_bank.py` cannot retire a question.** It writes and appends by id and never
deletes, so a question dropped from a `_source` patch survives in the bank as an orphan. Found on
2026-09-25 when `WRD-PCT-047` (a profit-margin item that belonged in WRD-PNL) was retired from the
patch: the bank would have carried 51 PCT items including the retired one, and it had to be purged
by hand. Either add a `retired_ids` list to the script or check for orphans after any batch that
drops a question.

**Bank tree note (2026-09-21):** only two live trees remain — `gre-free/bank` and
`gre-free/pro/bank`. `sync_bank.py` still lists the archived `gre-pro/bank` in `TREES` and skips it
silently.

**Known notation issues.** SPEC.md's rule was amended 2026-09-24 to use `*` for multiplication and
never a bare `x` where `x` is a variable. Two artefacts of the old rule survive: `ARI-SEQ-043`
contains `1x2 + 2x3 + ... + 10x11`, and the capsule
`03-algebra/09-algebraic-exponents-radicals.md` writes `x^a x x^b` in its rules table.
