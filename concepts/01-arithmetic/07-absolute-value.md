# Absolute Value

**Section:** Arithmetic  |  **Bank code:** ARI-ABS  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

`|x|` is the **distance of x from 0** on the number line. Distance is never negative.

Because of the distance interpretation, `|a - b|` is the distance between a and b. Almost every hard absolute-value question becomes easy when you read it as a statement about distance.

---

## 2. Must-Know Rules

| Statement | Meaning |
|---|---|
| \|x\| = x if x >= 0 | |
| \|x\| = -x if x < 0 | (and -x is positive here) |
| \|x\| >= 0 always | |
| \|-x\| = \|x\| | |
| \|ab\| = \|a\| x \|b\| | |
| \|a/b\| = \|a\|/\|b\| | |
| \|a - b\| | distance between a and b |
| \|x\| = k (k > 0) | x = k or x = -k (two solutions) |
| \|x\| = 0 | x = 0 (one solution) |
| \|x\| = k (k < 0) | no solution |
| \|x\| < k (k > 0) | -k < x < k (an interval, AND) |
| \|x\| > k (k > 0) | x < -k or x > k (two rays, OR) |
| Triangle inequality | \|a + b\| <= \|a\| + \|b\| |

**The general pattern.** `|x - c| < r` means "x is within r of c", i.e. the interval `(c - r, c + r)`.

So `|x - 3| < 5` means x is within 5 of 3, giving `-2 < x < 8`.

**Note also:** sqrt(x^2) = |x|, not x. This matters whenever x could be negative.

---

## 3. Worked Examples

### Example 1 — Solving an equation

*Solve |2x - 5| = 9.*

Two cases:

- 2x - 5 = 9 -> 2x = 14 -> x = 7
- 2x - 5 = -9 -> 2x = -4 -> x = -2

**x = 7 or x = -2.** Always check both in the original: |9| = 9 and |-9| = 9. Both valid.

### Example 2 — Inequality as an interval

*Solve |x + 4| <= 6.*

-6 <= x + 4 <= 6

Subtract 4 throughout: **-10 <= x <= 2**.

Distance reading: x is within 6 of -4. Correct.

### Example 3 — A "greater than" inequality

*Solve |3x - 1| > 8.*

Two rays:

- 3x - 1 > 8 -> 3x > 9 -> x > 3
- 3x - 1 < -8 -> 3x < -7 -> x < -7/3

**x < -7/3 or x > 3.**

---

## 4. GRE Traps

- **Only taking the positive case.** |x| = 5 has two answers. Missing x = -5 is the classic error.
- **Writing |x| = -x is wrong.** It is only true when x <= 0, and even then -x is positive.
- **Treating |x| > k like |x| < k.** Less-than gives one interval (AND); greater-than gives two rays (OR).
- **Distributing the bars.** |a + b| is not |a| + |b|. Try a = 3, b = -3: |0| = 0 but 3 + 3 = 6.
- **Assuming sqrt(x^2) = x.** It equals |x|.
- **Forgetting to check extraneous solutions** when the variable also appears outside the bars, e.g. |x - 2| = 3x. Solve both cases, then substitute back and discard any that fail.
- **Sign flip on inequalities.** When you multiply or divide an inequality by a negative number, reverse the sign.

---

## 5. Speed Tricks

- **Read it as distance.** "|x - 7| = 2" -> "x is 2 away from 7" -> x = 5 or 9. No algebra needed.
- **Sketch the number line.** For any absolute value inequality, mark the centre and the radius; the answer is either inside or outside.
- **On quantitative comparison, test a negative value.** Whenever a variable inside bars is unrestricted, plug in a negative — that is where the trap lives.
- **|a| = |b| means a = b or a = -b.** Two cases, always.
- **The minimum of |x - a| + |x - b| is |a - b|**, achieved for any x between a and b. Occasionally shortcut-worthy.

---

## 6. Self-Check

**Q1.** Solve |5 - x| = 3.

**Q2.** Solve |2x + 1| < 7 and express the answer as an interval.

**Q3.** If |x| = |y| and x is not equal to y, what must be true?

<details>
<summary>Answers</summary>

**A1.** 5 - x = 3 gives x = 2; 5 - x = -3 gives x = 8. **x = 2 or x = 8.**

**A2.** -7 < 2x + 1 < 7 -> -8 < 2x < 6 -> **-4 < x < 3**.

**A3.** **x = -y** (they are opposites, and neither is 0).

</details>

---

## 7. One-Line Summary for the Board

> |x| means distance. Two cases for equations. Less-than = inside, greater-than = outside.
