# Graphs of Quadratic Functions (Parabolas)

**Section:** Coordinate Geometry  |  **Bank code:** COG-GQF  |  **GRE frequency:** Medium

---

## 1. Core Idea

The graph of `y = ax^2 + bx + c` is a **parabola** — a symmetric U-shaped curve.

Three things describe it completely:

1. **Direction:** opens **up** if a > 0, **down** if a < 0.
2. **Vertex:** the turning point — the minimum if it opens up, the maximum if it opens down.
3. **Roots (x-intercepts):** where it crosses the x-axis, if it does.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Standard form | y = ax^2 + bx + c |
| Vertex form | y = a(x - h)^2 + k, vertex at (h, k) |
| Axis of symmetry | x = -b/(2a) |
| Vertex x-coordinate | -b/(2a) |
| Vertex y-coordinate | substitute that x back into the equation |
| y-intercept | c (set x = 0) |
| x-intercepts | solve ax^2 + bx + c = 0 |
| Number of x-intercepts | from the discriminant b^2 - 4ac |

**Discriminant and the graph:**

| D = b^2 - 4ac | x-intercepts | Picture |
|---|---|---|
| D > 0 | two | crosses the axis twice |
| D = 0 | one | touches the axis at the vertex |
| D < 0 | none | floats entirely above or below the axis |

**Symmetry.** The parabola is symmetric about the vertical line through the vertex. So if the roots are r1 and r2, the vertex sits at x = (r1 + r2)/2 — the midpoint of the roots.

**Transformations of y = x^2:**

| Change | Effect |
|---|---|
| y = x^2 + k | shifts up by k |
| y = (x - h)^2 | shifts right by h |
| y = -x^2 | flips upside down |
| y = ax^2, a > 1 | narrower |
| y = ax^2, 0 < a < 1 | wider |

Note the counter-intuitive one: `(x - h)^2` shifts **right**, not left.

---

## 3. Worked Examples

### Example 1 — Finding the vertex

*Find the vertex of y = 2x^2 - 8x + 5.*

x = -b/(2a) = 8/4 = 2.

y = 2(4) - 8(2) + 5 = 8 - 16 + 5 = -3.

**Vertex at (2, -3)**, and since a > 0 it is a minimum.

### Example 2 — Minimum value

*What is the minimum value of y = x^2 - 6x + 11?*

x = 6/2 = 3. y = 9 - 18 + 11 = 2.

**Minimum value is 2**, at x = 3.

(Vertex form confirms: y = (x-3)^2 + 2.)

### Example 3 — Reading the graph from the equation

*Describe the graph of y = -3(x + 1)^2 + 7.*

- a = -3 < 0, so it opens **downward**.
- Vertex form gives h = -1, k = 7, so the vertex is at **(-1, 7)** and that is a **maximum**.
- The y-intercept is at x = 0: y = -3(1) + 7 = 4.

---

## 4. GRE Traps

- **Shift direction.** (x - 3)^2 moves the graph **right** 3, not left.
- **Vertex formula sign.** It is x = -b/(2a); with b = -8, that gives +2.
- **Forgetting to substitute back** for the vertex's y-coordinate.
- **Assuming every parabola crosses the x-axis.** If D < 0, it does not.
- **Confusing the y-intercept with the vertex.** They coincide only when b = 0.
- **Reading "maximum" for an upward parabola.** Upward has a minimum; downward has a maximum.
- **Assuming a is 1.** The stretch factor changes the width and the vertex's y-value.

---

## 5. Speed Tricks

- **Sign of a first.** It tells you immediately whether the answer is a max or a min, and often eliminates half the choices.
- **x = -b/(2a) is the axis of symmetry AND the vertex x.** One formula, two uses.
- **If the roots are known, the vertex x is their average.** Faster than the formula.
- **The y-intercept is just c** — no work at all.
- **For "how many real solutions", compute the discriminant only.** You never need the roots.
- **Match graphs to equations by testing x = 0** and checking the direction of opening.

---

## 6. Self-Check

**Q1.** Find the vertex of y = x^2 - 4x + 1.

**Q2.** How many x-intercepts does y = x^2 + 2x + 5 have?

**Q3.** Describe how y = (x + 2)^2 - 3 relates to y = x^2.

<details>
<summary>Answers</summary>

**A1.** x = 4/2 = 2; y = 4 - 8 + 1 = -3. **Vertex (2, -3).**

**A2.** D = 4 - 20 = -16 < 0, so **none**.

**A3.** Shifted **2 units left and 3 units down**.

</details>

---

## 7. One-Line Summary for the Board

> a > 0 opens up (minimum). Vertex at x = -b/2a. (x - h) shifts RIGHT by h.
