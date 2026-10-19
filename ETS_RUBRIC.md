# ETS Fidelity Rubric — GRE Quant Pro question bank

Derived from ETS's own published material (GRE Math Conventions, the paper-delivered
practice book, and the ETS Quantitative Reasoning content page). Use this to judge whether
a question could plausibly have appeared on a real GRE, and to generate new ones.

---

## PART 1 — HARD RULES (a violation is a defect, not a style opinion)

### 1.1 Quantitative comparison boilerplate

ETS has used **Quantity A / Quantity B** since the 2011 revision. "Column A/B" is pre-2011
GRE and old GMAT phrasing.

The four choices are fixed, in this order, verbatim:

```
A. Quantity A is greater.
B. Quantity B is greater.
C. The two quantities are equal.
D. The relationship cannot be determined from the information given.
```

Rules:
- Exactly four options. Never five. Never "none of the above".
- The order is never shuffled — the answer is determined by the maths, not the letter position.
- Common information above the quantities applies to both and is stated once.
- A QC asking for a numeric value, or whose quantities are not two comparable quantities, is malformed.

### 1.2 Select-all (multiple-answer) conventions

- Stem ends with an explicit instruction: **"Indicate all such values."** / "Indicate all
  such integers." / "Select all that apply."
- 3 to 8 options. At least one is correct.
- **Degenerate forms are defects:** all options correct, exactly one option correct (that is an
  MCQ), or no option correct.

### 1.3 Numeric entry conventions

- No answer options at all. If a numeric-entry question carries options, it is malformed.
- The answer is exact unless the stem says to round; if rounding is required the stem must say
  so explicitly ("Round your answer to the nearest whole number").
- If the answer is a fraction, the stem should say "Give your answer as a fraction."
- Equivalent forms (2.5 / 2.50) are all correct — explanations should not insist on one form.
- Units, when they matter, are stated in the stem or in a label after the box, not inferred.

### 1.4 MCQ conventions

- Exactly five options, A–E, exactly one correct.
- **Numeric options must be in ascending order.** This is an ETS invariant. Re-lettering numeric
  options to flatten the answer distribution is not permitted; only textual-option sets may be
  re-lettered.
- **No two options may have the same value.** A value-equal but not-fully-simplified option is a
  legitimate distractor *only* when the stem itself demands a form ("in simplest form", "factor
  completely", "fully simplified", "in scientific notation"); in every other stem it is a defect,
  because ETS grades the value and the student who reaches it would be marked wrong. (Settled
  2026-10-11 from the two defensible positions in the ETS audit — `ALG-FAC-037` keeps its
  incompletely-factored option under "factor completely"; `ALG-EXP-007`, `ALG-FAC-008` and
  `ARI-P10-012` had theirs replaced because their stems asked only for a value. **Confirmed by Adi
  2026-10-12.**)
- No "none of the above" / "cannot be determined" in a single-answer MCQ (that belongs to QC).
- Approximation questions say "approximately"; the correct answer is the closest in value.

### 1.5 Syllabus boundaries — ETS states these are NOT tested

Off-syllabus content is a defect regardless of how good the question is:

- **Trigonometry** — sin, cos, tan, the unit circle, identities. (A 30-60-90 or 45-45-90
  triangle solved by side ratios is fine; naming it as trig is not.)
- **Calculus** — limits, derivatives, integrals, continuity.
- **Proofs** — "prove that", formal induction.
- **Inferential statistics** — hypothesis tests, p-values, confidence intervals, t-tests,
  regression inference. (Descriptive statistics and the normal distribution ARE tested.)
- **Conic sections beyond the circle** — ellipses, hyperbolas, parabolas given by conic
  equations. (A parabola as the graph of a quadratic function IS in scope.)
- **Complex / imaginary numbers**, matrices and determinants, vectors, logarithms,
  radians, set-theoretic cardinality, modular-arithmetic notation (`a ≡ b mod n`),
  graph theory, recurrence relations solved by characteristic equations.

In scope, per ETS: integer properties, divisibility, factorisation, primes, remainders,
odd/even; arithmetic operations, exponents and roots; estimation, percent, ratio, rate,
absolute value, the number line, decimal representation, sequences; exponent operations,
factoring and simplifying expressions, relations, functions, equations and inequalities,
linear and quadratic solving, word-problem setup; coordinate geometry — graphs of functions,
equations and inequalities, intercepts, slopes; parallel and perpendicular lines, circles,
triangles, quadrilaterals, polygons, congruence and similarity, 3-D figures, area, perimeter,
volume, the Pythagorean theorem, angles in degrees; mean, median, mode, range, standard
deviation, interquartile range, quartiles, percentiles; tables and graphs; elementary and
conditional probability; random variables and distributions including the normal; permutations,
combinations and Venn diagrams.

### 1.6 Figure conventions

- Geometric figures are **not** drawn to scale: a solver may assume relative position,
  collinearity, straightness and marked right angles, but not unmarked lengths or angle sizes.
  A question whose answer requires reading an unmarked length off the picture is a defect.
- **Coordinate systems and data graphs ARE drawn to scale** — estimating by sight is legitimate.
- "In the figure above" requires a figure actually to be present.
- A figure that visibly contradicts its own stated conditions is a defect even when labelled
  "not drawn to scale".

### 1.7 Terminology ETS uses

| Avoid | ETS uses |
|---|---|
| Column A / Column B | Quantity A / Quantity B |
| GCD, LCM, HCF (bare abbreviations) | greatest common divisor, least common multiple |
| "the coordinate plane" | "the *xy*-plane" |
| "digits sum" | "the sum of the digits" |
| "Find X" | "What is X?" / "X is how much greater than…" |
| "difference" meaning signed | difference = positive difference |
| natural numbers | positive integers |

Also: numbers are base 10; leading zeros don't count as digits; a value exactly halfway rounds
up; zero is neither positive nor negative; odd and even integers are not necessarily positive;
a prime is an integer greater than 1 with exactly two positive divisors; for `n = qd + r`,
`0 ≤ r < d`; `-3² = -9` but `(-3)² = 9`.

### 1.8 Notation — NOT a defect in this bank

The bank's own renderer (`gre-math.js`) converts plain-text math to typeset math via KaTeX and
**normalises both conventions at display time**: `x^2` and `x²`, `sqrt(5)` and `√(5)`,
`<=` and `≤` all render identically for the student.

So do **not** tag or penalise ASCII math notation. It is invisible to the user. There is no
`notation_ascii` tag. Judge the mathematics and the wording, not the raw encoding.

### 1.9 Editorial decisions on record

Decided by Adi, 2026-10-12. These are settled; do not reopen them in an audit.

- **Unsimplified equal-valued options** — a defect unless the stem demands a form (see §1.4).
- **`DAT-MGS-014`** — the key stays **73** (`82/6` is not rounded before dividing; only the final
  answer is rounded to the nearest whole number). The stem carries no rounding clause on `82/6`.
- **`DAT-LIN-025`** — readings are taken **every 2 hours** (not "hourly"); the 11am estimate of 62°F
  stands.

---

## PART 2 — ETS FLAVOUR (what the score measures)

A question can be flawless and still not read like ETS. These are the dimensions.

### 2.1 Insight over computation
ETS rewards seeing the structure, not grinding. A real item usually has a short path
(factor the difference of squares, notice the symmetry, test one boundary case). If the only
route is four-step arithmetic with ugly intermediate values, it is not an ETS item.
**Red flag:** answers requiring long multiplication/division, or more than ~4 steps of pure
calculation with no conceptual turn.

### 2.2 Clean numbers, concrete cover story
Numbers chosen to work out cleanly. Contexts are mundane and plausible — prices, distances,
ages, test scores, employees, inventory — never whimsical or implausible ("a wizard has 3
potions"). Quantities are realistic in magnitude.

### 2.3 Distractors that encode real errors
Each wrong option should be reachable by a specific, common mistake: sign error, reciprocal,
off-by-one, perimeter-for-area, forgetting the ½, using radius for diameter, percent of the
wrong base. **Red flag:** filler options (arithmetic sequences around the answer, round
numbers with no derivation), or a `trap` field that does not match any actual option.

### 2.4 Economical, unambiguous stem
Short, declarative, no throat-clearing. Every stated fact is used or is deliberate
misdirection. All conditions needed are stated. No "textbook-ese" ("Apply the distance formula
to find…" — that tells the solver the method).
**Red flag:** the stem or the explanation names the technique the solver is supposed to discover.

### 2.5 Difficulty honesty
- `easy` — one step, one concept, most testers get it.
- `medium` — two concepts, or one concept with a trap.
- `hard` — multi-concept, or requires a non-obvious reframing / case analysis.
- `extreme_hard` — above the real GRE ceiling; legitimate as stretch material but should be rare.

A one-step distance-formula question labelled `medium` is mislabelled. Labels should match the
work actually required.

### 2.6 Single defensible answer
Exactly one answer is correct under every reading of the stem. Watch for: "could be" vs "must
be", inclusive vs exclusive bounds, whether 0 and negatives are admitted, integer vs real,
and whether "between" includes endpoints.

---

## PART 3 — SCORING

Score `ets_score` 1–5 on flavour, **after** correctness and hard rules are recorded separately.

- **5** — indistinguishable from a real ETS item. Ship as is.
- **4** — solidly ETS-like; at most a cosmetic nit.
- **3** — serviceable but identifiably not ETS: plain, slightly textbook-y, weak distractors,
  or mislabelled difficulty. Usable; improvable.
- **2** — clearly not an ETS item: grindy, contrived, telegraphed method, filler distractors,
  or awkward phrasing. Needs rewriting.
- **1** — unusable as GRE practice: off-syllabus, malformed for its type, ambiguous,
  or wrong answer.

Any hard-rule violation (Part 1) caps the score at 2. A wrong key or an off-syllabus topic
caps it at 1.

### Reason tags
Record one or more, machine-readable:

`wrong_key`, `multiple_correct`, `no_correct_option`, `ambiguous_stem`, `missing_data`,
`off_syllabus`, `malformed_type`, `qc_column_wording`, `qc_option_set`, `options_unordered`,
`degenerate_select_all`, `numeric_entry_has_options`, `figure_missing`,
`figure_contradicts_stem`, `requires_scale_reading`, `filler_distractors`,
`trap_mismatch`, `grindy_computation`, `telegraphed_method`, `textbook_phrasing`,
`contrived_context`, `ugly_numbers`, `difficulty_mislabelled`, `terminology_nonets`,
`explanation_error`, `explanation_offsyllabus`, `duplicate_stem`, `chart_data_corrupt`.

`chart_data_corrupt` — the chart's labels contain stem sentences, or its data values are
years / all-identical / otherwise not real data. A known systematic defect in this bank; tag
it and score 1, since the question cannot be answered as rendered.

---

## PART 4 — THE RE-SOLVE PROTOCOL

Correctness is checked by independent re-solution, not by reading the explanation.

1. Read the stem and options only. **Do not read `answer`, `explanation` or `trap` yet.**
2. Solve from scratch. Write the derivation and the letter/value you arrive at.
3. For select-all, evaluate every option independently. For QC, test boundary and edge cases
   (0, negatives, fractions, equality) before concluding D.
4. *Then* reveal the stated answer and compare.
5. On disagreement: re-solve once more. If you still disagree, record `wrong_key` with your
   derivation and your proposed answer. Never silently "fix" the key — flag it with working.
6. Also check the explanation derives the stated answer and is itself on-syllabus, and that
   `trap` names an option that actually exists.

Keys in this bank have historically been reliable; the known failure modes are inclusive/
exclusive bounds, "exactly" wording making an extra select-all option true, and explanations
that reach the right answer by invalid reasoning.
