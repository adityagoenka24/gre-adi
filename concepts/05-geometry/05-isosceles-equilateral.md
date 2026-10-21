# Isosceles & Equilateral Triangles

**Section:** Geometry  |  **Bank code:** GEO-IET  |  **GRE frequency:** Medium

---

## 1. Core Idea

- **Isosceles:** two equal sides, and therefore **two equal angles** (the base angles, opposite the equal sides).
- **Equilateral:** all three sides equal, so all three angles are **60 degrees**.

The equal-sides/equal-angles link runs both ways, and that biconditional is what most questions exploit: prove two angles equal and you have proved two sides equal.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Isosceles base angles | equal |
| Converse | equal angles imply equal opposite sides |
| Equilateral angles | 60 each |
| Equilateral is equiangular | and vice versa |
| Altitude to the base (isosceles) | also the median and the angle bisector |
| Equilateral altitude, side s | s sqrt(3)/2 |
| Equilateral area, side s | s^2 sqrt(3)/4 |
| Equilateral perimeter | 3s |

**The symmetry line.** In an isosceles triangle, the altitude from the apex to the base does four jobs at once: it is the altitude, the median, the perpendicular bisector of the base, and the apex angle bisector. Dropping it splits the triangle into two congruent right triangles — the standard solution move.

**Angle arithmetic.** If the apex angle is A, each base angle is (180 - A)/2. If a base angle is B, the apex is 180 - 2B.

**Isosceles right triangle** = the 45-45-90 triangle.

---

## 3. Worked Examples

### Example 1 — Angle from the apex

*An isosceles triangle has an apex angle of 40 degrees. Find each base angle.*

(180 - 40)/2 = 140/2 = **70 degrees each**.

### Example 2 — Ambiguity worth teaching

*An isosceles triangle has one angle of 100 degrees. Find the other two.*

100 cannot be a base angle (two of them would already exceed 180), so it must be the apex.

Base angles = (180 - 100)/2 = **40 each**.

But if the given angle had been 40 instead, there would be **two** possible triangles: apex 40 with base angles 70, or base angle 40 with apex 100. GRE quantitative comparison questions live on this ambiguity.

### Example 3 — Area via the altitude

*An isosceles triangle has equal sides of 13 and a base of 10. Find its area.*

Drop the altitude to the base; it bisects the base into two 5s.

Height: 13^2 - 5^2 = 169 - 25 = 144, so h = 12. (A 5-12-13 triangle.)

Area = (1/2)(10)(12) = **60**.

---

## 4. GRE Traps

- **Assuming which angle is the apex.** If the given angle is acute, two configurations may be possible — the answer may be "cannot be determined".
- **Assuming a triangle is isosceles from the picture.** Look for tick marks or equal-angle markings.
- **Applying the s^2 sqrt(3)/4 area formula to a merely isosceles triangle.** It is for equilateral only.
- **Forgetting the altitude bisects the base** — this is what makes Example 3 solvable.
- **Equiangular but not equilateral.** For triangles the two are equivalent, but for other polygons they are not (a rectangle is equiangular, not equilateral). Keep the distinction clear.
- **Base angles taken as equal to the apex.** They are equal to each other, not to the apex.

---

## 5. Speed Tricks

- **Drop the altitude immediately** in any isosceles problem; it creates a right triangle with a known half-base.
- **(180 - apex)/2** for base angles — one step.
- **Equilateral area: s^2 sqrt(3)/4.** Also worth knowing: the altitude, the median and the angle bisector coincide, and the centroid divides each in a 2:1 ratio.
- **If two angles of a triangle are equal, mark the opposite sides equal** immediately — it often unlocks a length you need.
- **On "cannot be determined" questions, actively look for the second configuration.** If an isosceles triangle's given angle is under 90, there usually is one.

---

## 6. Self-Check

**Q1.** An isosceles triangle has base angles of 65 degrees. Find the apex angle.

**Q2.** An equilateral triangle has a perimeter of 24. Find its area.

**Q3.** An isosceles triangle has equal sides 10 and base 12. Find its area.

<details>
<summary>Answers</summary>

**A1.** 180 - 2(65) = **50 degrees**.

**A2.** Side = 8; area = 64 sqrt(3)/4 = **16 sqrt(3)** (about 27.7).

**A3.** Half-base 6; height = sqrt(100 - 36) = 8. Area = (1/2)(12)(8) = **48**.

</details>

---

## 7. One-Line Summary for the Board

> Equal sides face equal angles, both ways. Drop the altitude — it bisects the base and creates a right triangle.
