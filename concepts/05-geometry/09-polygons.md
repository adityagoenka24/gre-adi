# Polygons

**Section:** Geometry  |  **Bank code:** GEO-POL  |  **GRE frequency:** Medium

---

## 1. Core Idea

A polygon is a closed figure with straight sides. Everything about its angles follows from one observation:

> An n-sided polygon can be cut into **(n - 2) triangles** by drawing diagonals from a single vertex.

Since each triangle contributes 180 degrees, the interior angles sum to `(n - 2) x 180`.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Sum of interior angles | (n - 2) x 180 |
| Each interior angle (regular) | (n - 2) x 180 / n |
| Sum of exterior angles | **360, always** |
| Each exterior angle (regular) | 360 / n |
| Interior + exterior at a vertex | 180 |
| Number of diagonals | n(n - 3) / 2 |

**The exterior-angle sum is 360 for every polygon**, regardless of the number of sides. This is the single most useful fact in the topic — questions about regular polygons are usually faster through the exterior angle.

**Common values:**

| Polygon | n | Interior sum | Each interior (regular) | Each exterior |
|---|---|---|---|---|
| Triangle | 3 | 180 | 60 | 120 |
| Quadrilateral | 4 | 360 | 90 | 90 |
| Pentagon | 5 | 540 | 108 | 72 |
| Hexagon | 6 | 720 | 120 | 60 |
| Octagon | 8 | 1080 | 135 | 45 |
| Decagon | 10 | 1440 | 144 | 36 |

**Regular hexagon bonus:** a regular hexagon of side s splits into **six equilateral triangles**, so its area is `6 x s^2 sqrt(3)/4 = 3 s^2 sqrt(3)/2`.

---

## 3. Worked Examples

### Example 1 — Finding n from an angle

*Each interior angle of a regular polygon is 156 degrees. How many sides does it have?*

Use the exterior angle: 180 - 156 = 24.

n = 360/24 = **15 sides**.

(Doing it via the interior formula works too but takes longer.)

### Example 2 — Interior angle sum

*Find the sum of the interior angles of a 12-sided polygon.*

(12 - 2) x 180 = 10 x 180 = **1,800 degrees**.

### Example 3 — Diagonals

*How many diagonals does a decagon have?*

n(n - 3)/2 = 10 x 7/2 = **35**.

---

## 4. GRE Traps

- **Using n x 180 instead of (n - 2) x 180.**
- **Assuming a polygon is regular.** "Hexagon" alone does not mean all sides and angles are equal — only "regular hexagon" does.
- **Thinking the exterior sum grows with n.** It is always 360.
- **Counting sides as diagonals.** A diagonal connects non-adjacent vertices.
- **Applying the "each interior angle" formula to an irregular polygon.** The sum is still (n-2)180, but the individual angles vary.
- **Confusing the number of triangles (n-2) with the number of sides.**

---

## 5. Speed Tricks

- **Go through the exterior angle** whenever a regular polygon's angle is given. Exterior = 180 - interior, then n = 360/exterior. Two steps instead of solving an equation.
- **Memorise the hexagon:** 120 interior, 60 exterior, six equilateral triangles, area 3s^2 sqrt(3)/2.
- **Diagonals from one vertex = n - 3.** Total = n(n-3)/2 (the /2 avoids double counting).
- **For area of a regular polygon, decompose into triangles** from the centre.
- **Sanity check:** an interior angle of a regular polygon is always less than 180 and increases with n.

---

## 6. Self-Check

**Q1.** What is the sum of the interior angles of a heptagon (7 sides)?

**Q2.** Each exterior angle of a regular polygon is 30 degrees. How many sides?

**Q3.** What is the area of a regular hexagon with side 4?

<details>
<summary>Answers</summary>

**A1.** (7-2) x 180 = **900 degrees**.

**A2.** 360/30 = **12 sides**.

**A3.** 3(16)sqrt(3)/2 = **24 sqrt(3)** (about 41.6).

</details>

---

## 7. One-Line Summary for the Board

> Interior sum = (n-2) x 180. Exterior sum = 360, always. Go through the exterior angle for regular polygons.
