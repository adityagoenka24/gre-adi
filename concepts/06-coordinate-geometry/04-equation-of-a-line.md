# Equation of a Line

**Section:** Coordinate Geometry  |  **Bank codes:** COG-EQL, COG-GLE  |  **GRE frequency:** High

---

## 1. Core Idea

A line's equation is a rule that every point on the line satisfies and no other point does. To write one you need exactly two pieces of information:

- a **slope** and a **point**, or
- **two points** (from which you compute the slope).

---

## 2. Must-Know Rules

| Form | Equation | Use when |
|---|---|---|
| Slope-intercept | y = mx + b | you know the slope and the y-intercept |
| Point-slope | y - y1 = m(x - x1) | you know the slope and any point |
| Standard | Ax + By = C | answer choices are in this form |
| Horizontal | y = c | |
| Vertical | x = c | |

**The workflow for two points:**

1. Compute the slope m = (y2-y1)/(x2-x1).
2. Plug m and either point into point-slope form.
3. Rearrange to whatever form the answer choices use.

**Testing whether a point lies on a line:** substitute its coordinates. If both sides balance, it is on the line.

**Finding where two lines intersect:** solve the two equations simultaneously. The solution (x, y) is the intersection point.

---

## 3. Worked Examples

### Example 1 — From two points

*Find the equation of the line through (2, 5) and (6, 13).*

Slope = (13 - 5)/(6 - 2) = 8/4 = 2.

Point-slope with (2, 5): y - 5 = 2(x - 2) -> y - 5 = 2x - 4

**y = 2x + 1.**

Check with the second point: 2(6) + 1 = 13. Correct.

### Example 2 — Point on a line

*Does the point (3, -4) lie on the line 2x - 3y = 18?*

2(3) - 3(-4) = 6 + 12 = 18. Yes, it balances.

**The point lies on the line.**

### Example 3 — Intersection

*Where do y = 3x - 4 and y = -x + 8 intersect?*

Set them equal: 3x - 4 = -x + 8 -> 4x = 12 -> x = 3.

Then y = 3(3) - 4 = 5.

**Intersection at (3, 5).**

---

## 4. GRE Traps

- **Sign error in point-slope.** y - y1 = m(x - x1). With a point (2, -5), the left side is y + 5.
- **Using the point as the intercept.** The y-intercept is only the point where x = 0.
- **Slope computed with the coordinates in inconsistent order.**
- **Forgetting to distribute** when expanding m(x - x1).
- **Answer form mismatch.** If the choices are in Ax + By = C form, convert before comparing.
- **Assuming a line through the origin.** Only if b = 0.
- **Vertical lines.** They cannot be written as y = mx + b at all; the equation is x = c.

---

## 5. Speed Tricks

- **Use point-slope form as the default.** It works from any point and never requires you to find b separately.
- **To check an answer choice quickly, substitute a known point** rather than deriving the equation.
- **For intersection questions, substitute rather than eliminate** when one equation is already solved for y.
- **The y-intercept can be read directly** if the equation is in y = mx + b form — convert first.
- **Two points with the same y give a horizontal line** (y = that value). Same x gives a vertical line.

---

## 6. Self-Check

**Q1.** Find the equation of the line with slope -3 passing through (4, 2).

**Q2.** Find the equation of the line through (0, -5) and (5, 5).

**Q3.** Where does y = 2x + 1 cross the x-axis?

<details>
<summary>Answers</summary>

**A1.** y - 2 = -3(x - 4) -> **y = -3x + 14**.

**A2.** Slope = 10/5 = 2; y-intercept is -5, so **y = 2x - 5**.

**A3.** Set y = 0: 0 = 2x + 1 -> x = -1/2, so **(-1/2, 0)**.

</details>

---

## 7. One-Line Summary for the Board

> Slope plus one point gives the line. Use y - y1 = m(x - x1) and rearrange to whatever form is asked.
