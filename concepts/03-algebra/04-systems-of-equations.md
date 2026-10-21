# Systems of Linear Equations

**Section:** Algebra  |  **Bank codes:** ALG-LN2, ALG-SIM  |  **GRE frequency:** Very High

---

## 1. Core Idea

Two equations, two unknowns. Three methods:

1. **Substitution** — best when one variable is already isolated (or easy to isolate).
2. **Elimination** — best when coefficients line up or can be matched quickly.
3. **Combination shortcut** — the GRE favourite: when the question asks for `x + y` or `x - y`, you often get it by adding or subtracting the equations directly, without solving for either variable.

---

## 2. Must-Know Rules

| Method | Procedure |
|---|---|
| Substitution | Isolate one variable, substitute into the other equation |
| Elimination | Scale one/both equations so a variable cancels when added or subtracted |
| Shortcut | Add or subtract the equations as-is and see what emerges |

**Number of solutions — the geometric reading:**

| Situation | Lines | Solutions |
|---|---|---|
| Different slopes | intersect once | exactly one |
| Same slope, different intercept | parallel | none |
| Same slope, same intercept | identical | infinitely many |

Algebraically, for `a1x + b1y = c1` and `a2x + b2y = c2`:

- One solution when a1/a2 is not equal to b1/b2
- No solution when a1/a2 = b1/b2 but not equal to c1/c2
- Infinite solutions when a1/a2 = b1/b2 = c1/c2

**Three variables** need three independent equations. Eliminate one variable twice to reduce to a 2x2 system.

---

## 3. Worked Examples

### Example 1 — Elimination

*Solve 3x + 2y = 16 and 5x - 2y = 8.*

The y-coefficients are already opposites. Add:

8x = 24 -> x = 3.

Substitute: 3(3) + 2y = 16 -> 2y = 7 -> y = 3.5.

**x = 3, y = 3.5.**

### Example 2 — The GRE shortcut

*If 4x + 3y = 20 and 3x + 4y = 22, what is x + y?*

Do not solve for x and y. Just add the two equations:

7x + 7y = 42

Divide by 7: **x + y = 6.** One step.

(If the question had asked for x - y, subtract instead: x - y = -2. And if it wanted x and y individually, those two results give x = 2, y = 4.)

*Teaching point:* the shortcut works whenever the coefficients are symmetric — ax + by and bx + ay. Check for that pattern before committing to elimination.

### Example 3 — Recognising "no solution"

*For what value of k does the system 2x + 3y = 7 and 4x + ky = 15 have no solution?*

Parallel requires 2/4 = 3/k, so k = 6.

Then check the constants: 7/15 is not equal to 1/2, so the lines are genuinely parallel and distinct.

**k = 6.**

---

## 4. GRE Traps

- **Solving for both variables when only the sum is wanted.** Wastes 40 seconds; look for the shortcut first.
- **Sign errors in elimination.** When subtracting equations, every term of the second changes sign.
- **Confusing "no solution" with "infinitely many".** Same slope + different intercept = none. Same slope + same intercept = infinite.
- **Assuming two equations always determine two unknowns.** If one is a multiple of the other, they don't.
- **Answering x when the question asks for y** (or for xy, or x/y).
- **Word problems where the two equations aren't independent** — re-read the setup.

---

## 5. Speed Tricks

- **Always ask what is actually wanted first.** If it is x + y or x - y, try adding/subtracting the raw equations.
- **Symmetric coefficients are a signal.** If the system is ax + by = m and bx + ay = n, then adding gives (a+b)(x+y) = m+n and subtracting gives (a-b)(x-y) = m-n. Both in one step.
- **Elimination beats substitution** when no coefficient is 1.
- **Back-substitute into the equation you did not use** — it checks your answer for free.
- **For "no solution" questions, compare coefficient ratios** rather than attempting to solve.

---

## 6. Self-Check

**Q1.** Solve x + y = 10 and x - y = 4.

**Q2.** If 5a + 2b = 26 and 2a + 5b = 30, what is a + b?

**Q3.** For what k does 3x - y = 5 and 6x - 2y = k have infinitely many solutions?

<details>
<summary>Answers</summary>

**A1.** Adding: 2x = 14 -> x = 7; then y = 3. **x = 7, y = 3.**

**A2.** Add: 7a + 7b = 56, so a + b = **8**. (No need to find a and b.)

**A3.** The second must be exactly twice the first: k = **10**.

</details>

---

## 7. One-Line Summary for the Board

> Ask what is wanted before you solve. Symmetric systems: add for the sum, subtract for the difference.
