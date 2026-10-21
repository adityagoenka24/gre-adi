# Number Theory Essentials

**Section:** Number Properties  |  **Bank code:** NUM-NTH  |  **GRE frequency:** Medium

---

## 1. Core Idea

This capsule collects the vocabulary and closure facts that GRE questions assume you know without ever teaching them. Most "must be true" questions in the Quant section are really testing whether a student knows these definitions precisely.

---

## 2. Must-Know Rules

**The number families, nested:**

| Set | Members | Notes |
|---|---|---|
| Counting / natural numbers | 1, 2, 3, ... | Positive integers |
| Whole numbers | 0, 1, 2, 3, ... | Includes 0 |
| Integers | ..., -2, -1, 0, 1, 2, ... | No fractions |
| Rational numbers | any a/b where a and b are **integers** and b is not 0 | Includes all integers, terminating and recurring decimals |
| Irrational numbers | sqrt(2), pi, e | Non-terminating, non-repeating decimals |
| Real numbers | all of the above | Everything on the number line |

**Closure — which operations keep you inside a set:**

| Set | + | - | x | / |
|---|---|---|---|---|
| Integers | yes | yes | yes | **no** |
| Rationals (non-zero divisor) | yes | yes | yes | yes |
| Irrationals | **no** | **no** | **no** | **no** |

Note: sqrt(2) + (-sqrt(2)) = 0, which is rational — so irrationals are not closed under addition. But **rational + irrational is always irrational**, and **non-zero rational x irrational is always irrational**.

**Squares and cubes:**

| Property | Squares | Cubes |
|---|---|---|
| Sign | never negative | keeps the sign of the base |
| Units digits possible | 0,1,4,5,6,9 | any digit 0-9 |
| Factor count | odd | not necessarily |
| Prime exponents | all even | all multiples of 3 |

A square never ends in 2, 3, 7 or 8. This is a fast elimination tool.

**Zero and one:**

- 0 is an integer, is even, is neither positive nor negative, and is a multiple of every integer.
- Division by 0 is undefined. 0/5 = 0 is fine; 5/0 is not.
- 1 is neither prime nor composite; 1^n = 1 for all n.

**Key inequalities to remember:**

- If 0 < x < 1: x^2 < x < sqrt(x) < 1/x
- If x > 1: 1/x < sqrt(x) < x < x^2

---

## 3. Worked Examples

### Example 1 — Closure reasoning

*If x is rational and y is irrational, must x + y be irrational?*

Suppose x + y = r were rational. Then y = r - x would be the difference of two rationals, hence rational — contradiction.

**Yes, x + y must be irrational.**

### Example 2 — Units digit elimination

*Which of 3,127, 4,096, 5,478 could be a perfect square?*

Squares end only in 0, 1, 4, 5, 6, 9.

- 3,127 ends in 7 -> impossible.
- 5,478 ends in 8 -> impossible.
- 4,096 ends in 6 -> possible. (Indeed 64^2 = 4,096.)

**4,096.**

### Example 3 — Ordering on an interval

*If 0 < k < 1, order k, k^2, sqrt(k), 1/k.*

Take k = 0.25: k^2 = 0.0625, sqrt(k) = 0.5, 1/k = 4.

**k^2 < k < sqrt(k) < 1/k.**

---

## 4. GRE Traps

- **"Number" does not mean "integer".** Unless the problem says integer, x could be 2.5 or -1/3.
- **Assuming positive.** "x is a number" allows negatives and zero.
- **0 is a multiple of every integer** but is a factor of nothing (except itself, trivially).
- **Thinking irrational x irrational is always irrational.** sqrt(2) x sqrt(2) = 2.
- **Assuming all non-terminating decimals are irrational.** 0.3333... is rational (= 1/3). Irrational means non-terminating *and* non-repeating.
- **Assuming x^2 > x.** False for 0 < x < 1 and for x = 0, 1.
- **Reciprocal ordering.** For positive numbers, taking reciprocals reverses the order: 2 < 3 but 1/2 > 1/3.

---

## 5. Speed Tricks

- **Before answering any "must be true" question, run the FROZEN check:** Fractions, Repeats (equal values), One, Zero, Extremes (very large/small), Negatives. If any of these breaks the statement, it is not "must be true".
- **Units digits eliminate square candidates** in one glance.
- **A number with an odd count of factors is a perfect square** — a common disguised hint.
- **Rational + irrational = irrational** is a reliable, quotable rule.
- **When variables are unrestricted on quantitative comparison, the answer is D more often than students expect** — but only prove it by finding two cases that disagree.

---

## 6. Self-Check

**Q1.** Is 0.121212... rational or irrational?

**Q2.** Can a perfect square end in the digit 3?

**Q3.** If -1 < x < 0, which is greater: x or x^3?

<details>
<summary>Answers</summary>

**A1.** **Rational** — it repeats, and equals 12/99 = 4/33.

**A2.** **No.** Squares end only in 0, 1, 4, 5, 6, 9.

**A3.** Take x = -0.5: x^3 = -0.125, which is greater than -0.5. **x^3 is greater.**

</details>

---

## 7. One-Line Summary for the Board

> "Number" is not "integer". Test fractions, zero and negatives on every must-be-true question.
