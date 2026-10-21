# Inequalities

**Section:** Algebra  |  **Bank code:** ALG-INQ  |  **GRE frequency:** Very High

---

## 1. Core Idea

An inequality is solved exactly like an equation, with **one extra rule**:

> Multiplying or dividing both sides by a **negative** number reverses the inequality sign.

Because of that rule, and because inequalities describe ranges rather than points, they are the natural home of quantitative comparison questions.

---

## 2. Must-Know Rules

| Operation | Effect on the sign |
|---|---|
| Add or subtract anything | unchanged |
| Multiply/divide by a positive | unchanged |
| Multiply/divide by a **negative** | **reversed** |
| Take reciprocals of two positives | reversed (2 < 3 but 1/2 > 1/3) |
| Square both sides | only safe if both sides are non-negative |

**Compound inequalities:**

- `a < x < b` means BOTH conditions — an interval.
- `x < a or x > b` means EITHER — two rays.

Operate on all three parts of a compound inequality at once: from -3 < 2x + 1 < 7, subtract 1 throughout, then divide by 2, giving -2 < x < 3.

**Adding and multiplying inequalities:**

- You may **add** two inequalities pointing the same way: if a > b and c > d, then a + c > b + d.
- You may **not subtract** them. If a > b and c > d, nothing follows about a - c and b - d.
- You may multiply only if all quantities are positive.

**Quadratic inequalities.** Solve x^2 - 5x + 6 > 0 by factoring: (x-2)(x-3) > 0. The critical points are 2 and 3. Test each region:

- x < 2: (neg)(neg) = positive -> satisfies
- 2 < x < 3: (pos)(neg) = negative -> fails
- x > 3: (pos)(pos) = positive -> satisfies

Answer: **x < 2 or x > 3.**

For "< 0" the answer would be the middle region, 2 < x < 3.

---

## 3. Worked Examples

### Example 1 — The sign flip

*Solve -3x + 7 > 22.*

-3x > 15

Divide by -3 and **flip**: **x < -5**.

Check with x = -6: -3(-6) + 7 = 25 > 22. Correct.

### Example 2 — Combining ranges

*If 2 < x < 5 and 1 < y < 3, what is the range of x - y?*

For the maximum of x - y, take x as large and y as small as possible: just under 5 minus just over 1 -> just under 4.

For the minimum, take x small and y large: just over 2 minus just under 3 -> just over -1.

**-1 < x - y < 4.**

Note: you flip the y-range and add. This is the correct way to "subtract" inequalities.

### Example 3 — Quadratic inequality

*Solve x^2 <= 9.*

x^2 - 9 <= 0 -> (x - 3)(x + 3) <= 0.

Critical points -3 and 3; the product is negative between them.

**-3 <= x <= 3.**

Common wrong answer: x <= 3 only, which forgets all the negative values.

---

## 4. GRE Traps

- **Forgetting to flip** when dividing by a negative. The most common inequality error, full stop.
- **Dividing by a variable of unknown sign.** From ax > a you cannot divide by a — you don't know its sign, or whether it is zero.
- **Subtracting inequalities.** Flip the second and add instead.
- **x^2 < 9 giving x < 3.** It gives -3 < x < 3.
- **Squaring both sides carelessly.** -5 < 2 is true, but 25 < 4 is false.
- **Reciprocals across zero.** 1/x > 1/y does not imply y > x when the signs differ.
- **Treating an inequality's endpoints as included** when the sign is strict. Watch < versus <=.

---

## 5. Speed Tricks

- **For range questions, test the four corner combinations** (min-min, min-max, max-min, max-max) and take the extremes. It works for +, -, x and /.
- **Draw the number line.** Shade the solution; it prevents AND/OR mix-ups.
- **On quantitative comparison, hunt for a counterexample** rather than trying to prove equality. Two disagreeing test values immediately give answer D.
- **Keep everything positive** by moving terms rather than multiplying by negatives — it sidesteps the flip rule entirely.
- **Critical-point method** works for any factored inequality: mark the roots, then test one value in each region.

---

## 6. Self-Check

**Q1.** Solve 5 - 2x <= 11.

**Q2.** If -4 < a < 2 and 1 < b < 6, what is the range of ab?

**Q3.** Solve x^2 - 4x < 0.

<details>
<summary>Answers</summary>

**A1.** -2x <= 6 -> **x >= -3** (sign flipped).

**A2.** Test the four corners: (-4)(1) = -4, (-4)(6) = -24, (2)(1) = 2, (2)(6) = 12. Range is **-24 < ab < 12**.

**A3.** x(x - 4) < 0; critical points 0 and 4; negative between them: **0 < x < 4**.

</details>

---

## 7. One-Line Summary for the Board

> Divide by a negative, flip the sign. x^2 < k gives a two-sided range. Never subtract inequalities.
