# Fractions & Decimals

**Section:** Arithmetic  |  **Bank code:** ARI-FRC  |  **GRE frequency:** Very High

---

## 1. Core Idea

A fraction is a division waiting to happen. Every fraction question tests one of three skills:

1. **Operating** with fractions (add, subtract, multiply, divide)
2. **Comparing / ordering** fractions
3. **Converting** between fraction, decimal and percent

On the GRE, fractions are almost always faster than decimals. Resist the urge to convert to decimals early — you lose exactness and gain arithmetic.

---

## 2. Must-Know Rules

| Operation | Rule |
|---|---|
| a/b + c/d | (ad + bc) / bd |
| a/b - c/d | (ad - bc) / bd |
| a/b x c/d | ac / bd |
| a/b / (c/d) | a/b x d/c (flip and multiply) |
| (a/b)^n | a^n / b^n |
| Compare a/b vs c/d | cross-multiply: ad vs bc (valid when b, d > 0) |
| Mixed to improper | a b/c = (ac + b)/c |

**Fraction size intuition:**

- Same numerator, bigger denominator -> **smaller** fraction. 3/7 < 3/5.
- Same denominator, bigger numerator -> **bigger** fraction. 5/7 > 3/7.
- Adding the same positive k to numerator and denominator of a proper fraction (< 1) moves it **closer to 1**, i.e. makes it bigger. 2/3 < 3/4 < 4/5.
- For an improper fraction (> 1), adding k to both moves it **down** toward 1. 5/3 > 6/4 > 7/5.

**Terminating vs recurring decimals:**

A fraction in lowest terms terminates if and only if its denominator's prime factorisation contains **only 2s and/or 5s**.

- 7/40 = 7/(2^3 x 5) -> terminates (0.175)
- 5/12 = 5/(2^2 x 3) -> recurring (0.41666...)

**Decimal essentials:**

- Multiplying decimals: multiply as integers, then the answer has as many decimal places as the two factors combined. 0.03 x 0.4 -> 3 x 4 = 12, three decimal places -> 0.012.
- Dividing decimals: shift both decimal points right until the divisor is a whole number.
- 0.999... = 1 exactly. This is not an approximation.

---

## 3. Worked Examples

### Example 1 — Complex fraction

*Simplify (1/2 + 1/3) / (1/4).*

Numerator: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.

Divide: (5/6) / (1/4) = 5/6 x 4/1 = 20/6 = **10/3**.

### Example 2 — Ordering without decimals

*Order 5/8, 7/11, 2/3 from smallest to largest.*

Compare 5/8 vs 7/11: cross-multiply -> 5 x 11 = 55 vs 7 x 8 = 56. Since 55 < 56, **5/8 < 7/11**.

Compare 7/11 vs 2/3: 7 x 3 = 21 vs 2 x 11 = 22. Since 21 < 22, **7/11 < 2/3**.

Order: **5/8 < 7/11 < 2/3**.

### Example 3 — Terminating test

*Which of 3/16, 9/24, 11/30 have terminating decimal forms?*

- 3/16 = 3/2^4 -> only 2s -> terminates.
- 9/24 reduces to 3/8 = 3/2^3 -> terminates. (Must reduce first!)
- 11/30 = 11/(2 x 3 x 5) -> has a 3 -> recurs.

**3/16 and 9/24 terminate.**

---

## 4. GRE Traps

- **Adding across.** 1/2 + 1/3 is not 2/5. You must find a common denominator.
- **Forgetting to reduce before testing for terminating decimals.** 9/24 looks like it has a 3 in the denominator; reduced, it does not.
- **Flipping the wrong fraction** when dividing. Flip the *second* one (the divisor).
- **Squaring a fraction between 0 and 1 makes it smaller.** (1/2)^2 = 1/4 < 1/2. Students expect powers to grow. Similarly, the square root of a number between 0 and 1 is *larger* than the number.
- **Negative fractions reverse intuition.** -1/2 > -3/4, because it is closer to zero.
- **Decimal place miscount** in multiplication — the classic 0.2 x 0.3 = 0.6 error (it is 0.06).

---

## 5. Speed Tricks

- **Benchmark against 1/2.** To compare fractions quickly, ask whether each is above or below 1/2, 1/3, or 1.
- **Cancel before multiplying.** (14/25) x (75/28) -> cancel 14/28 = 1/2 and 75/25 = 3 -> 3/2.
- **Cross-multiply to compare** — it beats converting to decimals every time.
- **Keep answers as fractions** until the very last step, especially in numeric-entry questions that accept fraction answers.
- **Common recurring decimals:** 1/3 = 0.333, 1/6 = 0.1666, 1/7 = 0.142857 repeating, 1/9 = 0.111, 1/11 = 0.0909.

---

## 6. Self-Check

**Q1.** Which is larger, 9/13 or 11/16?

**Q2.** Simplify: (3/4) / (9/8).

**Q3.** Does 21/56 have a terminating decimal expansion?

<details>
<summary>Answers</summary>

**A1.** Cross-multiply: 9 x 16 = 144 vs 11 x 13 = 143. Since 144 > 143, **9/13 is larger**.

**A2.** 3/4 x 8/9 = 24/36 = **2/3**.

**A3.** 21/56 reduces to 3/8 (divide both by 7), and 8 = 2^3. **Yes — it terminates (0.375).**

</details>

---

## 7. One-Line Summary for the Board

> Stay in fractions. Cross-multiply to compare. Reduce before you judge a denominator.
