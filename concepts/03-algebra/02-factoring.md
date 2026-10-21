# Factoring

**Section:** Algebra  |  **Bank code:** ALG-FAC  |  **GRE frequency:** High

---

## 1. Core Idea

Factoring means writing an expression as a **product**. It matters because of the zero-product property:

> If A x B = 0, then A = 0 or B = 0.

That is the only reliable way to solve most non-linear equations, and it is also how fractions get simplified.

---

## 2. Must-Know Rules

**The factoring checklist, in order:**

1. **Common factor first.** Always. 3x^2 + 6x = 3x(x + 2).
2. **Two terms?** Look for difference of squares (a^2 - b^2) or sum/difference of cubes.
3. **Three terms?** Try the x^2 + (a+b)x + ab pattern, or a perfect square trinomial.
4. **Four terms?** Group in pairs.

| Pattern | Factored form |
|---|---|
| a^2 - b^2 | (a + b)(a - b) |
| a^2 + 2ab + b^2 | (a + b)^2 |
| a^2 - 2ab + b^2 | (a - b)^2 |
| a^3 + b^3 | (a + b)(a^2 - ab + b^2) |
| a^3 - b^3 | (a - b)(a^2 + ab + b^2) |
| x^2 + (p+q)x + pq | (x + p)(x + q) |

**Note:** a^2 + b^2 does **not** factor over the real numbers.

**Trinomials with a leading coefficient.** For ax^2 + bx + c, find two numbers whose product is `ac` and whose sum is `b`, then split the middle term.

*Factor 6x^2 + 11x + 3.* Here ac = 18, and we need two numbers multiplying to 18 and summing to 11: 9 and 2.

6x^2 + 9x + 2x + 3 = 3x(2x + 3) + 1(2x + 3) = **(3x + 1)(2x + 3)**.

**Grouping (four terms).**

xy + 3x + 2y + 6 = x(y + 3) + 2(y + 3) = **(x + 2)(y + 3)**.

---

## 3. Worked Examples

### Example 1 — Full checklist in action

*Factor 2x^3 - 18x.*

Common factor: 2x(x^2 - 9).

Difference of squares: **2x(x - 3)(x + 3)**.

Students who skip step 1 get stuck immediately.

### Example 2 — Solving via factoring

*Solve x^2 = 5x + 24.*

Move everything to one side: x^2 - 5x - 24 = 0.

Need two numbers with product -24 and sum -5: -8 and +3.

(x - 8)(x + 3) = 0, so **x = 8 or x = -3**.

### Example 3 — Simplifying a rational expression

*Simplify (x^2 - 4)/(x^2 + 5x + 6).*

Numerator: (x - 2)(x + 2).

Denominator: (x + 2)(x + 3).

Cancel (x + 2): **(x - 2)/(x + 3)**, for x not equal to -2 or -3.

---

## 4. GRE Traps

- **Forgetting the common factor.** 2x^3 - 18x factored as (x - 3)(x + 3) loses the 2x.
- **Dividing instead of factoring.** From x^2 = 5x, dividing by x gives x = 5 and loses x = 0.
- **Trying to factor a^2 + b^2.** It does not factor over the reals.
- **Sign errors in the trinomial split.** Check by expanding — it takes five seconds.
- **Cancelling terms.** In (x^2 - 4)/(x + 3), you cannot cancel anything, because x + 3 is not a factor of the numerator.
- **Ignoring domain restrictions.** After cancelling (x + 2), the original expression is still undefined at x = -2.

---

## 5. Speed Tricks

- **Common factor, always first.** It is a free simplification and often reveals the pattern underneath.
- **Recognise the numbers:** any expression of the form (something)^2 - (something)^2 factors instantly, even with variables inside, e.g. (x+1)^2 - 9 = (x + 4)(x - 2).
- **If the answer choices are factored, work backwards** — expand a choice and compare.
- **For x^2 + bx + c with c positive,** both factors share the sign of b. With c negative, the factors have opposite signs and the larger one carries the sign of b.
- **Check factorisations by plugging x = 1.** Both forms must give the same value.

---

## 6. Self-Check

**Q1.** Factor x^2 - 7x + 12.

**Q2.** Factor 4x^2 - 25.

**Q3.** Solve 3x^2 - 12x = 0.

<details>
<summary>Answers</summary>

**A1.** Product 12, sum -7 -> -3 and -4. **(x - 3)(x - 4)**.

**A2.** Difference of squares: **(2x - 5)(2x + 5)**.

**A3.** 3x(x - 4) = 0, so **x = 0 or x = 4**. (Dividing by 3x would lose x = 0.)

</details>

---

## 7. One-Line Summary for the Board

> Common factor first, then match a pattern. Product = 0 means one of the factors is 0 — never divide the variable away.
