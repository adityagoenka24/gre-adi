# Circles — Circumference, Area, Arc & Sector

**Section:** Geometry  |  **Bank code:** GEO-CIR  |  **GRE frequency:** Very High

---

## 1. Core Idea

Every circle formula is built from the **radius**. The first move in any circle problem is to find r — from the diameter, the circumference, or the area.

The second big idea: an arc or sector is just a **fraction of the whole circle**, and that fraction is `central angle / 360`.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Diameter | d = 2r |
| Circumference | C = 2 pi r = pi d |
| Area | A = pi r^2 |
| Arc length (angle t degrees) | (t/360) x 2 pi r |
| Sector area (angle t degrees) | (t/360) x pi r^2 |
| Area from circumference | A = C^2/(4 pi) |

**The fraction principle.** A 90-degree sector is 90/360 = 1/4 of the circle: one quarter of the area, one quarter of the circumference.

**Useful angle fractions:**

| Angle | Fraction |
|---|---|
| 30 | 1/12 |
| 45 | 1/8 |
| 60 | 1/6 |
| 90 | 1/4 |
| 120 | 1/3 |
| 180 | 1/2 |

**Scaling.** If the radius doubles, the circumference doubles but the area **quadruples**. Area scales with r^2.

**Value of pi:** about 3.14, or 22/7 for hand computation. GRE answers usually keep pi symbolic — leave it in.

---

## 3. Worked Examples

### Example 1 — Working backwards to r

*A circle has circumference 18 pi. Find its area.*

2 pi r = 18 pi -> r = 9.

Area = pi(81) = **81 pi**.

### Example 2 — Sector and arc

*A circle has radius 12. Find the arc length and sector area for a central angle of 60 degrees.*

Fraction = 60/360 = 1/6.

Arc = (1/6)(2 pi x 12) = (1/6)(24 pi) = **4 pi**.

Sector area = (1/6)(pi x 144) = **24 pi**.

### Example 3 — Shaded region

*A square of side 10 has a circle inscribed in it. What is the area of the region inside the square but outside the circle?*

The inscribed circle has diameter 10, so r = 5.

Square area = 100. Circle area = 25 pi.

Shaded = **100 - 25 pi** (about 21.5).

---

## 4. GRE Traps

- **Using the diameter as the radius.** If a question gives d = 14, then r = 7. Halving is forgotten constantly.
- **Arc length formula with the diameter.** Arc uses 2 pi r; get r right first.
- **Confusing chord with arc.** A chord is a straight segment; an arc is part of the curve. An arc is always longer than its chord.
- **Doubling the radius doubles the area.** It quadruples it.
- **Sector area vs arc length.** One is a piece of the area (r^2), the other a piece of the perimeter (r). Different formulas.
- **Perimeter of a sector.** It is arc + 2 radii, not just the arc.
- **Approximating pi too early.** Keep it symbolic; the answer choices usually contain pi.

---

## 5. Speed Tricks

- **Find r first, always.** Write it down before touching any other formula.
- **Turn the central angle into a fraction of 360** and apply it to the whole-circle quantity. One method covers arcs and sectors alike.
- **A = C^2/(4 pi)** goes straight from circumference to area with no r step.
- **Inscribed circle in a square:** diameter = side. **Circumscribed circle around a square:** diameter = the square's diagonal = s sqrt(2).
- **For shaded regions, compute the outer figure minus the inner figure.** Never try to compute the odd shape directly.
- **Doubling the radius:** circumference x2, area x4. Tripling: x3 and x9.

---

## 6. Self-Check

**Q1.** A circle has diameter 20. Find its circumference and area.

**Q2.** A circle of radius 6 has a sector with central angle 120 degrees. Find the sector area.

**Q3.** A circle has area 49 pi. Find its circumference.

<details>
<summary>Answers</summary>

**A1.** C = 20 pi; r = 10 so A = **100 pi**.

**A2.** Fraction 1/3; area = (1/3)(36 pi) = **12 pi**.

**A3.** r = 7, so C = **14 pi**.

</details>

---

## 7. One-Line Summary for the Board

> Find r first. Arc and sector are just (angle/360) of the whole. Double the radius, quadruple the area.
