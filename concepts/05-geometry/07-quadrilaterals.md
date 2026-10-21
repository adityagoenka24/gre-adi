# Quadrilaterals — Squares & Rectangles

**Section:** Geometry  |  **Bank code:** GEO-QDL  |  **GRE frequency:** High

---

## 1. Core Idea

A quadrilateral is any four-sided figure; its interior angles always sum to **360 degrees**.

The GRE's favourites are the rectangle and the square, and the recurring theme is the **diagonal**, which turns every rectangle problem into a Pythagoras problem and every square problem into a 45-45-90 problem.

---

## 2. Must-Know Rules

| Figure | Area | Perimeter | Diagonal |
|---|---|---|---|
| Rectangle (l, w) | l x w | 2(l + w) | sqrt(l^2 + w^2) |
| Square (s) | s^2 | 4s | s sqrt(2) |

**Square area from the diagonal:** `Area = d^2 / 2`. Worth memorising.

**Properties:**

| Property | Rectangle | Square |
|---|---|---|
| All angles 90 | yes | yes |
| Opposite sides equal and parallel | yes | yes |
| All sides equal | no | yes |
| Diagonals equal | yes | yes |
| Diagonals bisect each other | yes | yes |
| Diagonals perpendicular | no | yes |
| Diagonals bisect the angles | no | yes |

**The hierarchy.** Every square is a rectangle, every rectangle is a parallelogram, every parallelogram is a quadrilateral. The reverse is never guaranteed.

**Maximum area.** Among all rectangles with a fixed perimeter, the **square** has the largest area. Among all rectangles with a fixed area, the square has the smallest perimeter. This is a frequent quantitative comparison theme.

---

## 3. Worked Examples

### Example 1 — Perimeter and area together

*A rectangle has perimeter 34 and area 60. Find its dimensions.*

l + w = 17 and lw = 60.

Two numbers summing to 17 with product 60: 5 and 12.

**Dimensions 12 by 5.** (Diagonal, if wanted, is 13.)

### Example 2 — Diagonal of a square

*A square has area 50. Find its diagonal.*

Area = d^2/2 -> 50 = d^2/2 -> d^2 = 100 -> **d = 10**.

(Side would be sqrt(50) = 5 sqrt(2), and 5 sqrt(2) x sqrt(2) = 10. Consistent.)

### Example 3 — Fixed perimeter comparison

*Rectangle A is 8 by 12. Rectangle B has the same perimeter but is a square. Which has the greater area?*

A: perimeter 40, area 96.

B: perimeter 40 means side 10, area 100.

**The square has the greater area** — as the maximum-area principle predicts.

---

## 4. GRE Traps

- **Assuming a quadrilateral is a rectangle** because it looks like one. Right angles must be marked or stated.
- **Confusing perimeter with area,** especially in word problems about fencing versus paving.
- **Doubling the side to get the diagonal.** The diagonal of a square is s sqrt(2), about 1.41s, not 2s.
- **Assuming equal perimeters mean equal areas.** They do not (Example 3).
- **Assuming equal areas mean equal perimeters.** Also false: 1x36 and 6x6 both have area 36 but perimeters 74 and 24.
- **A rectangle's diagonals bisect its angles.** Only in a square.
- **Units.** Area is in square units; a question asking for the cost of carpeting needs area, of fencing needs perimeter.

---

## 5. Speed Tricks

- **Square area from the diagonal: d^2/2.** Skips the side entirely.
- **For "perimeter P and area A" problems, you are solving x^2 - (P/2)x + A = 0** — but usually two friendly factors are visible immediately.
- **Rectangle diagonal is often a Pythagorean triple:** 3-4-5, 5-12-13, 8-15-17 show up as rectangle dimensions constantly.
- **For maximum-area questions, go square.** For minimum-perimeter with fixed area, go square.
- **Scale factor:** doubling both dimensions quadruples the area. Doubling only one doubles it.

---

## 6. Self-Check

**Q1.** A square has perimeter 36. Find its area and its diagonal.

**Q2.** A rectangle is 9 by 12. Find its diagonal.

**Q3.** A rectangle has area 48 and one side 6. Find its perimeter.

<details>
<summary>Answers</summary>

**A1.** Side 9, so area = **81** and diagonal = **9 sqrt(2)** (about 12.73).

**A2.** sqrt(81 + 144) = sqrt(225) = **15** (a 9-12-15 triple).

**A3.** Other side = 8; perimeter = 2(6 + 8) = **28**.

</details>

---

## 7. One-Line Summary for the Board

> Quadrilateral angles sum to 360. Square diagonal = s sqrt(2), and square area = d squared over 2.
