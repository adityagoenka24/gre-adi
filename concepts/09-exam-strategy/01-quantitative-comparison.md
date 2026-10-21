# Quantitative Comparison — Method

**Section:** Exam Strategy  |  **GRE frequency:** Roughly a third to a half of every Quant section (about 5 in the 12-question section, 6-7 in the 15-question section)

---

## 1. Core Idea

Quantitative Comparison (QC) gives you two quantities and asks which is bigger. The answer choices are **always the same four**:

- **A.** Quantity A is greater
- **B.** Quantity B is greater
- **C.** The two quantities are equal
- **D.** The relationship cannot be determined from the information given

The critical insight: you usually **do not need to compute either quantity**. You need to determine the *relationship*. That is often far less work.

---

## 2. Must-Know Rules

**The decision rule for D.** Choose D if and only if you can find **two cases that give different answers**. If you find one case where A > B and another where A = B, the answer is D.

**When D is impossible.** If both quantities are pure numbers with no variables, the answer can never be D — the relationship is fixed even if you cannot see it yet.

**Legal operations on both quantities** (they preserve the relationship, exactly like inequalities):

| Operation | Safe? |
|---|---|
| Add or subtract the same value | Yes |
| Multiply or divide by the same **positive** value | Yes |
| Multiply or divide by a **negative** | No — reverses the relationship |
| Multiply or divide by an expression of unknown sign | No |
| Square both sides | Only if both are known non-negative |

**The FROZEN test values.** When a variable is unrestricted, test:

- **F**ractions (0.5)
- **R**epeats (make variables equal)
- **O**ne
- **Z**ero
- **E**xtremes (very large, very small)
- **N**egatives

If two of these disagree, the answer is D. If all agree, the answer is probably A, B or C — but test at least three.

---

## 3. Worked Examples

### Example 1 — Simplify rather than compute

*Quantity A: 37 x 48. Quantity B: 38 x 47.*

Do not multiply. Rewrite:

A = 37 x 48. B = (37 + 1)(48 - 1) = 37x48 - 37 + 48 - 1 = 37x48 + 10.

**B is greater.** Answer B.

(General pattern: for a fixed sum, the product is larger when the two numbers are closer together.)

### Example 2 — Testing for D

*x^2 > x. Quantity A: x. Quantity B: 1.*

The condition x^2 > x holds when x > 1 or x < 0.

- Try x = 2: A = 2, B = 1 -> A greater.
- Try x = -3: A = -3, B = 1 -> B greater.

Two different outcomes, so the answer is **D**.

### Example 3 — Legal operations

*Quantity A: 3x + 7. Quantity B: 2x + 12, given x > 5.*

Subtract 2x + 7 from both: A becomes x, B becomes 5.

Since x > 5, **A is greater**. Answer A.

---

## 4. GRE Traps

- **Assuming variables are positive integers.** Unless stated, x can be negative, zero, or a fraction.
- **Choosing D when both quantities are pure numbers.** Impossible.
- **Testing only one value.** One test can never prove A, B or C — it can only rule things out.
- **Multiplying both sides by a variable.** You do not know its sign.
- **Squaring to remove a radical** when a quantity might be negative.
- **Computing the full value** when a comparison would do — this is a time trap more than an accuracy trap.
- **Assuming a geometric figure is drawn to scale** in a QC question. Many are not.

---

## 5. Speed Tricks

- **Strip away what is common.** Subtract identical terms from both sides; the remainder is usually trivial.
- **Look for a shortcut before computing.** QC questions are designed to be solvable without arithmetic.
- **Test values in this order: 0, 1, a fraction, a negative.** Fastest route to D.
- **If the two quantities look designed to be equal, suspect C — then test one edge case** to be sure.
- **Keep an eye on the clock.** QC questions should average under 90 seconds. If you are computing large numbers, you have missed the intended route.
- **Estimate.** If A is clearly above 100 and B is clearly below 50, you are done.

---

## 6. Self-Check

**Q1.** Quantity A: 1/3 + 1/4. Quantity B: 1/2. Which is greater?

**Q2.** Given x is a non-zero real number. Quantity A: x^2. Quantity B: x^3. Which is greater?

**Q3.** Quantity A: the average of 10, 20, 30. Quantity B: the median of 10, 20, 30.

<details>
<summary>Answers</summary>

**A1.** 7/12 vs 6/12. **A is greater.**

**A2.** x = 2 gives B greater; x = 0.5 gives A greater. **D.**

**A3.** Evenly spaced, so mean = median = 20. **C.**

</details>

---

## 7. One-Line Summary for the Board

> Compare, don't compute. Strip common terms. If two test values disagree, the answer is D — and D is impossible when both quantities are numbers.
