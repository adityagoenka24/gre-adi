# Triangles — Fundamentals

**Section:** Geometry  |  **Bank code:** GEO-TRI  |  **GRE frequency:** Very High

---

## 1. Core Idea

The triangle is the most-tested figure on the GRE. Four facts generate nearly every question:

1. Angles sum to **180 degrees**.
2. **Area = (1/2) x base x height**, where the height is perpendicular to that base.
3. The **largest angle faces the largest side**.
4. The **triangle inequality** constrains which side lengths are possible.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Angle sum | 180 degrees |
| Exterior angle | equals the sum of the two remote interior angles |
| Area | (1/2) x base x height |
| Area (Heron) | sqrt[s(s-a)(s-b)(s-c)], s = (a+b+c)/2 |
| Triangle inequality | \|b - c\| < a < b + c |
| Side-angle correspondence | largest side is opposite the largest angle |
| Perimeter | a + b + c |
| Median | joins a vertex to the midpoint of the opposite side |

**The triangle inequality in usable form.** For sides of length 5 and 9, the third side x satisfies:

`9 - 5 < x < 9 + 5`, i.e. `4 < x < 14`.

Note the inequalities are strict — x = 4 or x = 14 gives a degenerate (flat) triangle.

**Triangle classification:**

| By sides | | By angles | |
|---|---|---|---|
| Scalene | all sides different | Acute | all angles < 90 |
| Isosceles | two sides equal | Right | one angle = 90 |
| Equilateral | all three equal | Obtuse | one angle > 90 |

**Exterior angle theorem.** If the interior angles are A, B and C, the exterior angle at C equals A + B. This saves a step constantly.

**A median splits a triangle into two triangles of equal area** (same base length, same height).

---

## 3. Worked Examples

### Example 1 — Triangle inequality range

*Two sides of a triangle are 7 and 11. How many integer values are possible for the third side?*

11 - 7 < x < 11 + 7, so 4 < x < 18.

Integers from 5 to 17 inclusive: 17 - 5 + 1 = **13 values**.

### Example 2 — Exterior angle

*In triangle ABC, angle A = 50 and angle B = 65. What is the exterior angle at C?*

Exterior angle at C = A + B = 50 + 65 = **115 degrees**.

(Check: interior C = 180 - 115 = 65, and 50 + 65 + 65 = 180. Correct.)

### Example 3 — Area with a non-obvious height

*A triangle has sides 13, 14 and 15. Find its area.*

Use Heron's formula. s = (13 + 14 + 15)/2 = 21.

Area = sqrt[21 x (21-13) x (21-14) x (21-15)] = sqrt[21 x 8 x 7 x 6]

= sqrt[7056] = **84**.

---

## 4. GRE Traps

- **Using a slanted side as the height.** The height must be perpendicular to the chosen base.
- **Forgetting the triangle inequality has a lower bound too.** Students remember a + b > c but forget |a - b| < c.
- **Assuming a triangle is isosceles or right** because it looks that way.
- **Confusing the exterior angle with the interior one.**
- **Assuming the largest side is opposite the smallest angle.** It is the opposite.
- **Height falling outside the triangle.** In an obtuse triangle the foot of the altitude can lie beyond the base — the formula still holds.
- **Adding angles to 360.** A triangle's interior angles sum to 180.

---

## 5. Speed Tricks

- **Third side range: difference < x < sum.** One line, always.
- **Exterior angle = sum of the two remote interiors.** Faster than computing the interior angle first.
- **Area ratios:** two triangles with the same height have areas in the ratio of their bases; with the same base, in the ratio of their heights.
- **Heron only when nothing else works** — it involves a square root and is slow. Look for a right angle first.
- **In any triangle, rank the sides to rank the angles** and vice versa. Many quantitative comparison questions need nothing more.

---

## 6. Self-Check

**Q1.** Two sides of a triangle are 6 and 10. What is the range of the third side?

**Q2.** A triangle has angles in the ratio 2 : 3 : 4. Find the largest angle.

**Q3.** A triangle has base 12 and area 42. What is its height to that base?

<details>
<summary>Answers</summary>

**A1.** 10 - 6 < x < 10 + 6, so **4 < x < 16**.

**A2.** 9 parts = 180, one part = 20. Largest = 4 x 20 = **80 degrees**.

**A3.** 42 = (1/2)(12)h -> 6h = 42 -> **h = 7**.

</details>

---

## 7. One-Line Summary for the Board

> Angles sum to 180. Third side is between the difference and the sum. Biggest side faces the biggest angle.
