# WRD batch re-verification (independent) — 2026-09-26

Scope: every question the fix agents touched in `_source/WRD-MST.json` and
`_source/WRD-AGE.json`, re-solved from scratch in sympy/Fraction BEFORE reading the
stored key or explanation. Read-only audit; no file was edited. SPEC.md + addendum binding.

Method per item: (a) independent solve; (b) key letter check against the mandated
distributions; (c) pairwise option-collapse via `simplify(a-b)==0` (solution-set
comparison for the equation-valued options of ALG-WPM-004); (d) condition-drop test
(each stated condition removed in turn, checking the target becomes free/changes);
(e) distractor provenance; (f) recomputation of every number quoted in the trap and
explanation; (g) age sanity; (h) ASCII/notation sweep; (i) file-level invariants.

## 1. WRD-MST — rewritten items

### ALG-WPM-004 — PASS (one note)
Model d = 60t + 45; target 5 * 45 = 225; equation 60t + 45 = 225 -> **E**, stored E.
Option solution sets are all distinct and none collapses:
A {15/4}, B {17/4}, C {-3/5}, D {1/12}, E {3}. Every distractor is a named error and
each reproduces exactly: A drops the head start (t = 3.75), B scales the SPEED
(60t + 45 = 300, t = 4.25), C multiplies the wrong side (t = -3/5, negative time),
D reads "5 times" as "5 more" (t = 1/12). Dominant structural error (losing the 45)
has a landing option (A). Explanation arithmetic reproduces (60*3 + 45 = 225).
Note (not a defect): criterion 4 ("more than one equation in one unknown") does not
apply — this is an equation-identification item, nothing is solved. Its hard label rests
on the modelling/translation load, which is reasonable but is the thinnest "hard" of the
four rewrites.

### WRD-MST-053 — PASS (one note)
n/2 + 30 = n + 6 -> n = 48, END = 54 -> **D**, stored D. Chain verified whole at every
step: 48 -> 36 -> 24 -> 54, and 54 - 48 = 6. Misread claim verified exactly:
(5/12)n + 30 = n + 6 gives n = 288/7 = 41.142857..., non-integer as the trap says.
Options 24/36/48/54/78 distinct, all named: 24 = pre-purchase count, 36 = post-first-
giveaway, 48 = n (answer-asked trap), 78 = 48 + 30. Condition-drop: removing the quarter
gives n = 72 (end 78), removing the third gives n = 96 (end 102), removing the +30 gives
n = -12 (absurd), removing "6 more than start" leaves it underdetermined — all four
load-bearing.
Note: the item is still **one linear equation in one unknown**; the strengthening added
chain length, shifting fraction bases and a terminal re-ask rather than a second
equation. Acceptable for hard, but it is the weakest against criterion 4. Also, the
dominant structural error (fraction of the ORIGINAL total) cannot have a landing option
because it is non-integer; the trap handles this honestly by using the non-integer as the
detection signal, and three other named errors do land (A, B, C, E all used).

### WRD-MST-055 — PASS
L + L/2 + (3L - 12) = 114 -> (9/2)L = 126 -> L = 28; middle 14; upper = 3*28 - 12 = 72.
72 > 66 -> **A**, stored A. Total check 28 + 14 + 72 = 114. Fully determined, so D is
correctly not the key. All three trap routes reproduce exactly:
inverted middle relation -> 6L = 126, L = 21, upper 51 (< 66, lands B);
`3(L - 12)` misplacement -> L = 100/3 and upper = 3*(100/3) - 36 = **64** exactly (< 66,
lands B); comparing L = 28 or middle 14 with 66 also lands B. Genuine 3-relation system
in 3 unknowns; each condition load-bearing (dropping any one leaves the upper shelf
undetermined). Quantity B = 66 is well chosen: all three wrong routes fall below it.
Minor observation: the `3(L - 12)` route passes through a non-integer book count (33.33)
before landing on the whole number 64 — a student may abandon it earlier than the trap
assumes. Cosmetic only.

### WRD-MST-058 — PASS
n + 6 = 3m and n - 6 = 2(m + 6) -> m = **24**, n = **66** -> stored D (66). Both checks
reproduce: 66 + 6 = 72 = 3*24; 60 novels and 30 manuals, 60 = 2*30. Genuine independent
2x2 (rows (1,-3) and (1,-2), determinant 1); dropping either condition leaves n free
(2m + 18 / 3m - 6). Distractor B = **48** reproduces exactly as the ignore-the-removal
route: n = 2(m + 6) with n + 6 = 3m gives m = 18, n = 48 — the dominant structural error,
and it has its option. 24 = manuals, 60 = post-removal novels, 72 = post-addition novels.
Options distinct, no collapse.

## 2. WRD-MST — trap-text-only changes

### ALG-WPM-046 — PASS
4B + 150 = 1550 -> B = 350, A = 550, C = 650, answer **100**, stored 100.
Trap claim verified: 2(B - 50) gives 4B + 100 = 1550 -> B = 725/2 = **362.50** exactly.
Sum check 550 + 350 + 650 = 1550. All three relations load-bearing.

### ALG-WPM-020 — PASS
q + d = 20, 25q + 10d = 380 -> q = 12, d = **8** -> stored A. Trap claims verified:
value-swap (10q + 25d = 380) gives d = 12, i.e. option C, the same number as the
answer-asked error; 380/25 = 76/5 = **15.2**, truncating to 15 = option D; B = 10 is the
even split; E = 20 the coin total. Options 8/10/12/15/20 distinct.

### WRD-MST-040 — PASS on arithmetic; see D-1 below for a structural defect
m - 5 = 4(s - 5) and m + 10 = 2(s + 10) -> s = 25/2, m = **35** < 45 -> **B**, stored B.
Every number in the rewritten trap reproduces exactly:
s = 12 -> m = 33 (first sentence) vs m = 34 (second); s = 13 -> m = 37 vs m = 36; no
integer son satisfies both. Single-shift error m = 2(s + 10) -> s = 35/2, m = **55**,
which lands on A. Age sanity: man 35, son 12.5, gap 22.5 years (>= 16), son 7.5 five
years ago (born). Non-integer son age is disclosed by the trap and `review_flag: true`
is set — appropriate.

## 3. WRD-AGE — rewritten items

### WRD-AGE-039 — PASS
Mei m, Priya 4m, Jordan (4m + m)/2 + 5 = 5m/2 + 5; total 7.5m + 5 = 65 -> m = 8, so
Priya 32, Mei 8, Jordan 25 (sum 65). 32 + t = 3(8 + t) -> **t = 4**, stored 4.
Trap numbers reproduce: freezing Mei gives t = -8; "average of all three" misread gives
Jordan = 65/3 + 5 = 80/3 = 26.67 (non-integer). Genuine 3x3 then a second-stage equation;
all three conditions load-bearing. Ages non-negative, no parent-child claim in the stem.

### WRD-AGE-029 — PASS
N = 0.2M and N + 15 = 0.4(M + 15) -> **M = 45, N = 9**. 50% moment: 9 + t = 0.5(45 + t)
-> t = 27, ages 36 and 72, **sum 108**, stored 108. Checks reproduce: 9/45 = 0.20,
24/60 = 0.40, 36/72 = 0.50, invariant difference 36. Trap: shifting Nina only gives
M = 75 (and Nina 15). Both conditions load-bearing (2x2). Mother-daughter gap 36 years
(>= 16); all ages plausible at both moments.

### WRD-AGE-015 — PASS
4b + 10 = 90 -> Ben 20, Ana 40, Carlos 30; sum 90. True options = 20, 30, 40 =
**A, B, D**, stored ['A','B','D'] (3 letters, within 2-4, not the {A,B,C} cluster).
Both false options reproduce exactly: reversing to Ben = 2*Ana gives a = 16 and
**Ben = 32** (option C); Ana = 2*Carlos gives b = 15 and **Ana = 50** (option E), and the
"10 years younger" misread gives b = 25 and Ana = 50 as well. Options 20/30/32/40/50
distinct, every option accounted for. Three relations, all load-bearing.

### WRD-AGE-027 — PASS
Mei m, Carlos 3m, Jordan m + 5; (3m - 5) + (m - 5) + m = 35 -> m = 9, so 9/27/14, present
sum 50. 27 + t = 23 + 2t -> **t = 4**; sum grows 3/yr -> 50 + 12 = **62**, stored E (62).
Check reproduces: 31 = 13 + 18, total 62; five years ago 22 + 4 + 9 = 35. Distractors all
reproduce: B 50 present sum, C 54 = 50 + t (1/yr error), D 56 from freezing Carlos
(27 = 23 + 2t -> t = 2 -> 50 + 6 = 56), A 35 the past sum. Options distinct. All three
conditions load-bearing; two-stage solve.

### WRD-AGE-037 — PASS
a + 3b + 15 - 20 = 65 and a + 5 = 2(b + 5) -> b = 13, a = 31; Carlos 18, Divya 23.
Ana reaches 40 in 9 years -> Divya **32**, stored 32. Past-sum check 26 + 8 + 13 + 18 = 65.
Trap numbers reproduce exactly: subtracting only 5 gives b = 10, a = 25, Divya 20 and the
answer **35**; shifting only Ana gives b = 15, a = 25, Divya 25 and the answer **40**.
Four unknowns, four relations, every one load-bearing (drop test: target goes free in all
four cases). Ages all positive five years ago (Beto 8).

### WRD-AGE-043 — PASS
Deepa 27, Esha 19 (from 46 and 8), Farah 8, present total 54.
54 + 3t = 5(8 + t) -> **t = 7**, stored C (7). Check: 34 + 26 + 15 = 75 = 5*15.
Distractors reproduce: A 2 from 46 + 2t = 5(8 + t); B 4 from 54 + t = 5(8 + t) -> t = 3.5
rounded up; D 15 = Farah then; E 75 = total then; freezing Farah gives t = -14/3.
Options distinct. All three conditions load-bearing.

### WRD-AGE-028 — PASS on mathematics; one realism flag (D-2)
s = 24, Priya 48; 48 + t = (5/4)(24 + t) -> **t = 72**, stored A (72 > 24).
Invariant route confirms: difference 24 = 1 part, Sasha must be 96, i.e. 72 years out.
Reversed condition gives t = -144 (negative), which is the B route as the trap says.
Both conditions load-bearing; D correctly rejected. Quantity B = 24 deliberately equals both
Sasha's present age and the invariant difference — a good C trap.

### WRD-AGE-031 — PASS on mathematics; see D-1 for a template collision
a - 6 = 5(b - 6) and a + 12 = 2(b + 12) -> b = 12, a = **36** < 40 -> **B**, stored B.
Verified genuinely 2x2 and independent: coefficient matrix [[1,-5],[1,-2]], determinant 3,
so D is wrong; dropping either condition leaves a free (2b + 12 / 5b - 24).
Trap numbers reproduce: shifting only Beto (a = 5(b - 6)) gives b = 14 and **Ana = 40**,
which makes the columns equal and lands on C exactly as claimed; dropping both shifts
(a = 2b) gives b = 8, Ana 16. Age checks: 30 = 5*6 six years ago, 48 = 2*24 in twelve
years, invariant difference 24. No negative or unborn age.

## 4. WRD-AGE-036 — PASS (re-lettering correct)
In 4 years: 32 > 2(p + 4) -> p < 12. In 8 years: 36 < 3(p + 8) -> p > 4. Both strict, so
the admissible integer set is exactly **5 through 11**, as claimed. Against the options
(A 2, B 4, C 5, D 11, E 14, ascending and correctly lettered) the key is **C, D**, stored
['C','D'] — 2 letters, within 2-4, not clustered on {A,B,C}.
Per-option recomputation: p = 2 passes cond 1, fails cond 2 (36 < 30 false); p = 4 fails
cond 2 at the boundary (36 < 36 false) — the intended "<=" trap; p = 5 (32 > 18, 36 < 39)
and p = 11 (32 > 30, 36 < 57) pass both; p = 14 fails cond 1 (32 > 36 false). The trap's
"drop the shifts" route also reproduces: 32 > 2p and 36 < 3p give 12 < p < 16, whose only
listed member is 14. Options distinct. Sister aged 5-11 against Priya 28 is a 17-23 year
sibling gap — unusual but not impossible, and no parent-child rule applies.

## 5. Distribution tables (recomputed across all 30 in each file)

WRD-MST.json
| type | A | B | C | D | E | n | required | verdict |
|---|---|---|---|---|---|---|---|---|
| mcq | 3 | 2 | 3 | 2 | 2 | 12 | A3/B2/C3/D2/E2 | MATCH |
| quantitative_comparison | 1 | 2 | 2 | 1 | - | 6 | A1/B2/C2/D1 | MATCH |

WRD-AGE.json
| type | A | B | C | D | E | n | required | verdict |
|---|---|---|---|---|---|---|---|---|
| mcq | 2 | 2 | 3 | 3 | 2 | 12 | A2/B2/C3/D3/E2 | MATCH |
| quantitative_comparison | 2 | 2 | 1 | 1 | - | 6 | A2/B2/C1/D1 | MATCH |

Every changed item's independently computed key equals its stored key, and every stored
key is the letter the distribution requires. WRD-AGE-036's re-lettering is consistent with
ascending option values.

## 6. Global invariants

| check | WRD-MST | WRD-AGE |
|---|---|---|
| question count 30 | PASS | PASS |
| tier split 5 easy / 8 medium / 12 hard / 5 extreme_hard | PASS | PASS |
| type split 12 mcq / 6 QC / 7 numeric_entry / 5 multiple_answer | PASS | PASS |
| duplicate ids | none | none |
| ids unchanged vs prior audits' id lists | PASS | PASS |
| questions ordered easy -> extreme_hard | PASS | PASS |
| field order + no stray fields | PASS | PASS |
| MCQ/MA exactly 5 options, "A. " ... "E. " format | PASS | PASS |
| QC options verbatim standard four | PASS | PASS |
| numeric_entry options null, stem ends "Enter your answer as a number." | PASS | PASS |
| multiple_answer stems end "Select all that apply." | PASS | PASS |
| select-all key sets 2-4 letters, none clustered on {A,B,C} | PASS: ACE, BCD, AC, ABE, BCD | PASS: ABD, BCD, ACD, CDE, CD |
| no literally duplicated option text | PASS | PASS |
| estimated_time_seconds inside tier band | PASS | PASS |
| 2-3 tags | PASS | PASS |
| option collapse on every changed MCQ / select-all | none | none |
| review_flag | WRD-MST-040 (justified) | none |

Set metadata blocks intact in both files (subtopic_id, capsule, bank_files, practice_path,
one_liner present). Both files parse as valid JSON.

## 7. Notation sweep (both whole files, all 60 questions)

- Non-ASCII characters: none anywhere except the em dash.
- Em dash: appears only in the `Step n —` position; no other use found.
- No LaTeX/KaTeX (`$` occurrences are all literal dollar amounts in money stems), no
  unicode math symbols, `*` used for explicit multiplication, `<=` / `>=` in ASCII.
- No bare `x` used as a times sign. The five candidate hits are all prose where `x` is
  the variable ("buys x apples", "let x be the simplest quantity", "x > y").

## 8. The two WRD-AGE fix-agent claims

**Claim 1 — WRD-AGE-032's true set is s >= 9, so ascending options force the key to C,D,E.
CONFIRMED.** Independently: son s, Jordan s + 24; s + 24 - t = 4(s - t) reduces to
t = s - 8, and t >= 1 (a positive whole number of years ago) gives exactly **s >= 9**.
Against ascending options 6, 8, 9, 14, 20 the key is **C, D, E**, as stored. s = 8 gives
t = 0 (today, excluded by "positive") and s = 6 gives t = -2 (future) — both false, and
both are nameable errors. In every true case the past pair is 32 and 8, difference 24,
ratio 4:1, so the invariant argument in the explanation is sound. Parent-child gap 24
years, no negative ages.

**Claim 2 — new 031 is a genuine 2x2 (so D is wrong) and no longer shares the
"two-person sum = 3x one age" template with 042 and 043. CONFIRMED, with a new collision
introduced — see D-1.** The 2x2 is genuinely independent (determinant 3) and both ages are
pinned, so D is correctly rejected. 031 no longer uses a sum-equals-multiple target, so it
is clear of 042 (sum of two = 3x Theo, calendar year) and 043 (sum of three = 5x Farah).
Residual, pre-existing: **042 and 043 still share that template with each other** — both
recover two ages from a sum and a difference and then ask when the age total equals a
multiple of one person's age; both carry the `sum-and-difference` tag. Differentiators are
the third person and the calendar-year wrapper. Severity: minor / should-fix in a later
curation pass; not a correctness issue.

## 9. Defects found

**D-1 — WRD-AGE-031 and WRD-MST-040 are now the same question. Severity: should-fix
(structural), not a correctness blocker.**
After the rewrite, 031 is "k years ago A was n times B; m years from now A will be twice
B; Quantity A = A's current age, Quantity B = a round number", key **B**, type QC, tier hard.
WRD-MST-040 is "5 years ago the man was 4 times the son; 10 years from now twice; Quantity A
= man's current age, Quantity B = 45", key **B**, type QC, tier hard. Same template, same
column structure, same key, in two sheets a student works through in the same topic. Note
this is a regression against the prior audit: `WRD-MST-verify.md` D9 already flagged that
031 duplicated 040, and the rewrite moved 031 from a present-ratio + future condition onto
040's exact past + future shape, making the pair closer rather than further apart.
Minimal fix (preferred): act on the WRD-MST side as D9 recommended — replace WRD-MST-040
with a non-age two-condition QC, since it is an age item living in the Translating sheet
alongside ALG-WPM-008 and ALG-WPM-018. Its key is B, so any replacement keyed B preserves
the WRD-MST QC distribution.
Fix on the 031 side is possible but costs quality, and I verified both variants myself:
replacing 031's second condition with "today the sum of their ages is 48" still gives
b = 12, a = 36 and key B, but the shift-only-Beto error then yields a = 35, which still
lands on B and so destroys the C-landing trap. Re-pointing Quantity A at Beto's age would
key the item C and break the WRD-AGE QC distribution (C is already used once). So do not
fix this on 031.

**D-2 — WRD-AGE-028's answer entails ages of 120 and 96. Severity: cosmetic.**
The item is mathematically airtight (t = 72 verified, 120 = (5/4)*96, difference 24
preserved), and the explanation openly says the moment is "far in the future", but a
5/4 ratio moment 72 years out puts a living person at 120. Minimal fix, if wanted: scale
the present ages down (e.g. sum 36 -> Sasha 12, Priya 24, t = 36, ages 48 and 60 — I
verified this: 24 + 36 = 60 = (5/4)*48, still key A against Quantity B = 24). The cost is
that Quantity B = 24 stops coinciding with Sasha's present age and the invariant difference,
which is the item's designed C trap — so I recommend leaving it as is.

No other defect found. Every arithmetic claim the fix agents made in a trap or an
explanation reproduced exactly, including the specific numbers listed in the assignment:
48->36->24->54 with 288/7 (053); L = 28/14/72, L = 21 -> 51, and 64 (055); m = 24, n = 66
and 48 (058); s = 12 -> 33 vs 34, s = 13 -> 37 vs 36 (040); 4B + 100 = 1550, B = 362.50
(046); 380/25 = 15.2 (020); t = 4 (039); M = 45, Nina 9, sum 108 (029); Ben 32 and Ana 50
(015); t = 4, sum 62 (027); Divya 32 (037); t = 7 (043); 72 vs 24 (028); Ana 36 with b = 12
(031); admissible 5..11 with key C,D (036).

## 10. Verdict

**Safe to build and sync.** All 17 changed questions are mathematically correct, keyed
correctly, collapse-free, condition-tight and notation-clean; both files hold every global
invariant and both distribution tables match exactly. The only should-fix item is the
structural duplication D-1 (WRD-AGE-031 vs WRD-MST-040), which belongs in a curation pass
on the WRD-MST sheet and does not block this build.
