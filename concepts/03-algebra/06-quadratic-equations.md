# Quadratic Equations

**Section:** Algebra  |  **Bank code:** ALG-QDR  |  **GRE frequency:** High

---

## 1. Core Idea

A quadratic has the form `ax^2 + bx + c = 0` with a not equal to 0. It has **at most two** real solutions.

Three tools, in order of usefulness on the GRE:

1. **Factoring** — fastest when it works, which on the GRE is most of the time.
2. **Vieta's formulas** — when you only need the sum or product of the roots.
3. **The quadratic formula** — the guaranteed method when factoring fails.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Standard form | ax^2 + bx + c = 0 |
| Quadratic formula | x = [-b +/- sqrt(b^2 - 4ac)] / (2a) |
| Discriminant | D = b^2 - 4ac |
| Sum of roots | -b/a |
| Product of roots | c/a |
| Zero-product property | AB = 0 means A = 0 or B = 0 |

**The discriminant tells you the number of real roots:**

| D | Roots |
|---|---|
| D > 0 | two distinct real roots |
| D = 0 | exactly one real root (a repeated root) |
| D < 0 | no real roots |

**Vieta in practice.** For 2x^2 - 10x + 8 = 0:

- Sum of roots = 10/2 = 5
- Product of roots = 8/2 = 4

(The roots are 1 and 4. Sum 5, product 4. Confirmed.)

**Completing the square.** x^2 + 6x + 5 = 0 -> (x + 3)^2 - 9 + 5 = 0 -> (x+3)^2 = 4 -> x + 3 = +/-2 -> x = -1 or -5.

**Quadratic in disguise.** x^4 - 5x^2 + 4 = 0 is quadratic in u = x^2: u^2 - 5u + 4 = 0 -> u = 1 or 4 -> x = +/-1 or +/-2. Four solutions.

---

## 3. Worked Examples

### Example 1 — Factoring

*Solve x^2 - x - 20 = 0.*

Two numbers with product -20 and sum -1: -5 and +4.

(x - 5)(x + 4) = 0 -> **x = 5 or x = -4**.

### Example 2 — Vieta shortcut

*The roots of x^2 - 7x + k = 0 differ by 3. Find k.*

Sum of roots = 7. Difference = 3.

So the roots are (7+3)/2 = 5 and (7-3)/2 = 2.

Product = k = 5 x 2 = **10**.

### Example 3 — Discriminant

*For what values of m does x^2 + mx + 9 = 0 have exactly one real solution?*

D = m^2 - 4(1)(9) = m^2 - 36 = 0

m^2 = 36 -> **m = 6 or m = -6**.

---

## 4. GRE Traps

- **Missing the negative root.** From x^2 = 49, x = 7 **or** -7. When the GRE gives x^2 = k, it is usually testing exactly this.
- **Sum of roots = b/a.** It is **-b/a**. The minus sign is forgotten constantly.
- **Dividing by x.** From x^2 = 3x, you lose the root x = 0.
- **Assuming two roots always exist.** If D < 0 there are none over the reals.
- **Forgetting to set the equation to zero** before factoring. x^2 = 5x + 24 must become x^2 - 5x - 24 = 0.
- **Extraneous roots.** After squaring both sides of an equation involving a square root, always substitute back — some roots will be invalid.
- **Quadratic in disguise gives 2 solutions.** x^4 = 16 has x = 2 and x = -2 over the reals; a degree-4 equation can have up to 4 real roots, so count carefully.

---

## 5. Speed Tricks

- **Try factoring first.** GRE quadratics are designed to factor about 80% of the time.
- **Use Vieta when the question asks for the sum or product of roots** — never solve for the roots individually.
- **If the roots are r and s, the equation is x^2 - (r+s)x + rs = 0.** Useful for building an equation from its roots.
- **Recognise the perfect-square trinomials:** x^2 + 2kx + k^2 and x^2 - 2kx + k^2.
- **Back-solve from answer choices** when a quadratic looks ugly — plug each choice in.
- **Discriminant questions never need the roots.** Just compute b^2 - 4ac.

---

## 6. Self-Check

**Q1.** Solve 2x^2 - 5x - 3 = 0.

**Q2.** What is the sum of the roots of 3x^2 + 12x - 7 = 0?

**Q3.** How many real solutions does x^2 + 2x + 5 = 0 have?

<details>
<summary>Answers</summary>

**A1.** ac = -6; two numbers with product -6 and sum -5: -6 and +1. Split: 2x^2 - 6x + x - 3 = 2x(x-3) + 1(x-3) = (2x+1)(x-3). **x = 3 or x = -1/2.**

**A2.** -b/a = -12/3 = **-4**.

**A3.** D = 4 - 20 = -16 < 0, so **none**.

</details>

---

## 7. One-Line Summary for the Board

> Set it to zero, then factor. Sum of roots = -b/a, product = c/a. Never lose the negative root.
