# Sequences & Series

**Section:** Algebra  |  **Bank codes:** ARI-SEQ, ALG-SEQ  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

A sequence is an ordered list; a series is its sum. The GRE tests two families plus "spot the pattern":

- **Arithmetic:** you **add** a constant `d` each step.
- **Geometric:** you **multiply** by a constant `r` each step.

The diagnostic: look at consecutive **differences** (constant -> arithmetic) and consecutive **ratios** (constant -> geometric).

---

## 2. Must-Know Rules

**Arithmetic sequence** (first term a, common difference d):

| Quantity | Formula |
|---|---|
| nth term | a_n = a + (n - 1)d |
| Sum of first n terms | S_n = n/2 x (first + last) = n/2 x [2a + (n-1)d] |
| Average of the terms | (first + last)/2 |
| Number of terms from a to L | (L - a)/d + 1 |

**Geometric sequence** (first term a, common ratio r):

| Quantity | Formula |
|---|---|
| nth term | a_n = a x r^(n-1) |
| Sum of first n terms | S_n = a(r^n - 1)/(r - 1), for r not 1 |
| Infinite sum (only if \|r\| < 1) | S = a/(1 - r) |

**Useful summation results:**

- 1 + 2 + ... + n = n(n+1)/2
- Sum of the first n odd numbers = n^2
- Sum of the first n even numbers = n(n+1)

**Recursive sequences.** Given `a_1 = 3` and `a_(n+1) = 2a_n - 1`, just generate terms: 3, 5, 9, 17, 33. GRE recursive questions rarely go beyond 6-8 terms — computing is usually faster than finding a closed form.

---

## 3. Worked Examples

### Example 1 — nth term

*In an arithmetic sequence, the 4th term is 14 and the 9th term is 34. Find the first term.*

From term 4 to term 9 is 5 steps: 34 - 14 = 20, so d = 4.

a_4 = a + 3d = 14 -> a + 12 = 14 -> **a = 2**.

### Example 2 — Sum of a series

*Find the sum of all multiples of 6 between 20 and 200.*

First multiple: 24. Last: 198. Common difference 6.

Number of terms = (198 - 24)/6 + 1 = 29 + 1 = 30.

Sum = 30/2 x (24 + 198) = 15 x 222 = **3,330**.

### Example 3 — Infinite geometric series

*Find the sum of 8 + 4 + 2 + 1 + ... continuing forever.*

a = 8, r = 1/2, and |r| < 1, so the sum converges.

S = 8/(1 - 1/2) = 8/(1/2) = **16**.

---

## 4. GRE Traps

- **Off by one in the nth term.** It is a + (n-1)d, not a + nd. The 1st term uses no d at all.
- **Off by one in counting terms.** From 24 to 198 in steps of 6 there are 30 terms, not 29.
- **Confusing arithmetic with geometric.** Check differences *and* ratios before choosing a formula.
- **Applying the infinite-sum formula when |r| >= 1.** The series diverges; there is no finite sum.
- **Assuming a pattern from three terms.** 1, 2, 4 could be doubling (8 next) or could be +1, +2, +3 (7 next). The GRE exploits this — look for a stated rule.
- **Sum vs term.** "What is the 10th term" and "what is the sum of the first 10 terms" are very different questions.

---

## 5. Speed Tricks

- **Sum = count x average**, and for arithmetic sequences the average is (first + last)/2. This one line replaces both sum formulas.
- **Count terms with (last - first)/step + 1.** Say the "+1" out loud every time.
- **For "how many terms until X", solve a + (n-1)d = X for n.**
- **For recursive sequences, just list terms** — it is almost always faster than algebra.
- **Look for telescoping.** Sums like 1/(1x2) + 1/(2x3) + ... collapse because each term is 1/n - 1/(n+1).
- **Geometric growth doubles fast:** if the ratio is 2, the 11th term is 1024 times the first. Useful for estimating.

---

## 6. Self-Check

**Q1.** What is the 20th term of the sequence 5, 9, 13, 17, ...?

**Q2.** How many multiples of 7 lie between 50 and 400?

**Q3.** Find the sum of the infinite series 27 + 9 + 3 + 1 + ...

<details>
<summary>Answers</summary>

**A1.** a = 5, d = 4. a_20 = 5 + 19(4) = **81**.

**A2.** First 56 (7x8), last 399 (7x57). Count = 57 - 8 + 1 = **50**.

**A3.** a = 27, r = 1/3. S = 27/(1 - 1/3) = 27/(2/3) = **40.5**.

</details>

---

## 7. One-Line Summary for the Board

> Differences constant = arithmetic; ratios constant = geometric. nth term uses (n-1). Count = (last - first)/step + 1.
