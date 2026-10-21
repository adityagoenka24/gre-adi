# Algebraic Exponents & Radicals

**Section:** Algebra  |  **Bank code:** ALG-EXR  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

This capsule applies the exponent laws to **expressions with variables**, where the exponent itself may be unknown. (For the numeric version, see *Arithmetic > Exponents & Roots*.)

The governing principle stays the same: **make the bases match**, then equate exponents. What is new here is that the answer may be an expression rather than a number, and that variable bases bring domain caveats.

---

## 2. Must-Know Rules

| Rule | Statement |
|---|---|
| x^a x x^b | x^(a+b) |
| x^a / x^b | x^(a-b) |
| (x^a)^b | x^(ab) |
| (xy)^a | x^a y^a |
| x^(-a) | 1/x^a |
| x^(a/b) | b-th root of x^a |
| If x^a = x^b and x is not 0, 1, or -1 | then a = b |

**The equating rule has conditions.** From x^a = x^b you may conclude a = b only when the base is not 0, 1 or -1. If x = 1, then 1^5 = 1^9 without 5 = 9.

**Radical rules:**

- sqrt(xy) = sqrt(x) x sqrt(y), for x, y >= 0
- sqrt(x/y) = sqrt(x)/sqrt(y), for x >= 0, y > 0
- sqrt(x^2) = |x| — **not** x
- sqrt(x) + sqrt(y) is **not** sqrt(x + y)

**Rationalising denominators:**

- 1/sqrt(x) = sqrt(x)/x
- 1/(a + sqrt(b)) -> multiply by the conjugate (a - sqrt(b)) to get (a - sqrt(b))/(a^2 - b)

**Factoring with exponents.** This is the highest-yield skill in the topic:

2^(n+2) + 2^n = 2^n(2^2 + 1) = 5 x 2^n

---

## 3. Worked Examples

### Example 1 — Solving for an exponent

*If 2^(3x) = 32^(x-1), find x.*

32 = 2^5, so the right side is 2^(5(x-1)).

3x = 5x - 5 -> 2x = 5 -> **x = 5/2**.

### Example 2 — Factoring powers

*Simplify (3^(n+1) - 3^n) / 3^n.*

Numerator = 3^n(3 - 1) = 2 x 3^n.

Divide by 3^n: **2**.

Note the answer does not depend on n at all — a common GRE design.

### Example 3 — Rationalising with a conjugate

*Simplify 6/(3 + sqrt(3)).*

Multiply top and bottom by (3 - sqrt(3)):

Numerator: 6(3 - sqrt(3)) = 18 - 6sqrt(3).

Denominator: 9 - 3 = 6.

Result: (18 - 6sqrt(3))/6 = **3 - sqrt(3)**.

---

## 4. GRE Traps

- **Equating exponents when the base could be 1, 0, or -1.** Always check.
- **x^a + x^b = x^(a+b).** No such rule. Factor instead.
- **sqrt(x^2) = x.** It is |x|. Matters whenever x may be negative.
- **(x + y)^2 = x^2 + y^2.** Missing 2xy.
- **Negative exponents made negative.** x^(-2) is 1/x^2, positive for any non-zero real x.
- **Fractional exponent inverted.** In x^(m/n), the **denominator is the root** and the numerator is the power. So x^(2/3) is the cube root of x^2. Students routinely flip it and write x^(3/2).
- **Cancelling a variable base that could be zero.** Dividing by x^n assumes x is not 0.

---

## 5. Speed Tricks

- **Rewrite every base as a prime power.** Nearly all exponent equations become linear in the exponent immediately.
- **Factor out the smallest power** whenever you see a sum or difference of powers with the same base.
- **When the answer must be independent of n**, factoring is the intended route.
- **Conjugates clear any two-term radical denominator** in one step.
- **Simplify radicals by pulling out perfect squares first** — sqrt(48) = 4sqrt(3) before you do anything else.
- **Check with a number.** Substitute n = 1 or x = 4 into your simplified form and the original; they must match.

---

## 6. Self-Check

**Q1.** Simplify (x^5 y^2)/(x^2 y^5).

**Q2.** If 9^(x+1) = 3^(x+5), find x.

**Q3.** Simplify 5^(n+1) + 5^(n+1) + 5^(n+1) + 5^(n+1) + 5^(n+1).

<details>
<summary>Answers</summary>

**A1.** x^(5-2) y^(2-5) = **x^3 / y^3**, or (x/y)^3.

**A2.** 3^(2x+2) = 3^(x+5) -> 2x + 2 = x + 5 -> **x = 3**.

**A3.** Five copies: 5 x 5^(n+1) = **5^(n+2)**.

</details>

---

## 7. One-Line Summary for the Board

> Same base, then equate exponents (base not 0, 1, -1). Sums of powers get FACTORED, never added.
