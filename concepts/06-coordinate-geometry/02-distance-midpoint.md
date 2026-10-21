# Distance & Midpoint

**Section:** Coordinate Geometry  |  **Bank codes:** COG-DST, COG-MID  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

Two formulas, and both are easier than they look:

- **Distance is Pythagoras.** The horizontal gap and the vertical gap are the legs of a right triangle; the distance is the hypotenuse.
- **Midpoint is an average.** Average the x's, average the y's.

If a student can draw the right triangle, they never need to memorise the distance formula.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Distance between (x1,y1) and (x2,y2) | sqrt[(x2-x1)^2 + (y2-y1)^2] |
| Midpoint | ((x1+x2)/2, (y1+y2)/2) |
| Distance from the origin | sqrt(x^2 + y^2) |
| Horizontal distance (same y) | \|x2 - x1\| |
| Vertical distance (same x) | \|y2 - y1\| |

**Finding an endpoint from the midpoint.** If M is the midpoint of AB and you know A and M, then B = (2Mx - Ax, 2My - Ay). "Double the midpoint, subtract the known endpoint."

**Distance is symmetric** — the order of the points does not matter, because the differences are squared.

**Watch for triples.** If the horizontal and vertical gaps are 3 and 4, or 6 and 8, or 5 and 12, the distance is a whole number. This happens constantly on the GRE.

---

## 3. Worked Examples

### Example 1 — Distance

*Find the distance between (2, 3) and (10, 9).*

Horizontal gap: 10 - 2 = 8. Vertical gap: 9 - 3 = 6.

Distance = sqrt(64 + 36) = sqrt(100) = **10**. (A 6-8-10 triangle.)

### Example 2 — Midpoint

*Find the midpoint of (-4, 7) and (10, -1).*

x: (-4 + 10)/2 = 3. y: (7 + (-1))/2 = 3.

Midpoint = **(3, 3)**.

### Example 3 — Missing endpoint

*M(5, -2) is the midpoint of AB. If A is (1, 4), find B.*

B_x = 2(5) - 1 = 9. B_y = 2(-2) - 4 = -8.

**B = (9, -8).**

Check: midpoint of (1,4) and (9,-8) is ((1+9)/2, (4-8)/2) = (5, -2). Correct.

---

## 4. GRE Traps

- **Subtracting inside the midpoint formula.** Midpoint uses a **sum** divided by 2.
- **Adding inside the distance formula.** Distance uses **differences**.
- **Forgetting the square root.** sqrt(64 + 36) = 10, not 100.
- **Sign errors with negative coordinates.** 9 - (-1) = 10, not 8.
- **sqrt(a^2 + b^2) = a + b.** Never.
- **Mixing up which point is which** — harmless for distance (squares), fatal for the missing-endpoint formula.

---

## 5. Speed Tricks

- **Draw the right triangle.** Horizontal leg, vertical leg, hypotenuse. Then Pythagoras.
- **Look for a Pythagorean triple** in the two gaps before reaching for a calculator.
- **Midpoint = average.** Two averages, done.
- **"Double the midpoint minus the known endpoint"** for the missing-endpoint type.
- **For a circle's centre given two endpoints of a diameter, the centre is the midpoint** — and the radius is half the distance.
- **Distance from the origin is just sqrt(x^2 + y^2).**

---

## 6. Self-Check

**Q1.** Find the distance between (-1, 2) and (4, 14).

**Q2.** Find the midpoint of (3, -6) and (-9, 2).

**Q3.** The endpoints of a circle's diameter are (2, 1) and (8, 9). Find the centre and the radius.

<details>
<summary>Answers</summary>

**A1.** Gaps 5 and 12 -> distance = **13**.

**A2.** ((3-9)/2, (-6+2)/2) = **(-3, -2)**.

**A3.** Centre = midpoint = **(5, 5)**. Diameter = sqrt(36 + 64) = 10, so radius = **5**.

</details>

---

## 7. One-Line Summary for the Board

> Distance is Pythagoras on the gaps. Midpoint is the average of the coordinates.
