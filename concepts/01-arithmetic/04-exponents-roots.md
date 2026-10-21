# Exponents & Roots

**Section:** Arithmetic  |  **Bank code:** ARI-EXP  |  **GRE frequency:** Very High

---

## 1. Core Idea

Exponent questions are almost never about computing a big number. They are about **rewriting everything on the same base** and then comparing or cancelling exponents.

The single most useful instruction: *get the bases to match.*

---

## 2. Must-Know Rules

| Rule | Statement |
|---|---|
| Product | a^m x a^n = a^(m+n) |
| Quotient | a^m / a^n = a^(m-n) |
| Power of a power | (a^m)^n = a^(mn) |
| Power of a product | (ab)^n = a^n b^n |
| Power of a quotient | (a/b)^n = a^n / b^n |
| Zero exponent | a^0 = 1 for a not equal to 0 |
| Negative exponent | a^(-n) = 1/a^n |
| Fractional exponent | a^(m/n) = the n-th root of a^m |
| Root as power | sqrt(a) = a^(1/2), cube root of a = a^(1/3) |

**What the rules do NOT say:**

- a^m + a^n does **not** simplify to a^(m+n). Addition has no exponent rule — you must factor instead: 2^5 + 2^6 = 2^5(1 + 2) = 3 x 2^5.
- (a + b)^2 is **not** a^2 + b^2. It is a^2 + 2ab + b^2.
- sqrt(a^2 + b^2) is **not** a + b.

**Signs and parity:**

- (-2)^4 = 16 (even power, positive)
- (-2)^3 = -8 (odd power, negative)
- -2^4 = -16 — the minus is **outside**; only the 2 is raised.

**Roots on the GRE:**

- The symbol sqrt(x) denotes the **non-negative** root. sqrt(25) = 5, never -5.
- But the *equation* x^2 = 25 has two solutions, x = 5 and x = -5. This distinction is tested constantly.

**Simplifying radicals:** pull out perfect squares. sqrt(72) = sqrt(36 x 2) = 6 sqrt(2).

**Rationalising:** 1/sqrt(3) = sqrt(3)/3. For 1/(2 + sqrt(3)), multiply by the conjugate (2 - sqrt(3))/(2 - sqrt(3)) to get (2 - sqrt(3))/1 = 2 - sqrt(3).

**Useful values to know cold:**

Squares 1-20; cubes 1-10; 2^1 through 2^10 (2, 4, 8, 16, 32, 64, 128, 256, 512, 1024); 3^1 through 3^5; sqrt(2) = 1.414, sqrt(3) = 1.732, sqrt(5) = 2.236.

---

## 3. Worked Examples

### Example 1 — Same base

*If 4^(x+1) = 8^(x-1), find x.*

Write both as powers of 2: 4 = 2^2 and 8 = 2^3.

2^(2(x+1)) = 2^(3(x-1))

2x + 2 = 3x - 3

x = **5**.

### Example 2 — Factoring out, not adding

*Simplify 3^10 + 3^10 + 3^10.*

This is 3 x 3^10 = 3^11.

Note it is **not** 3^30 and **not** 9^10.

### Example 3 — Comparing without computing

*Which is greater, 2^40 or 3^25?*

Take a common exponent. 2^40 = (2^8)^5 = 256^5, and 3^25 = (3^5)^5 = 243^5.

Since 256 > 243, **2^40 is greater**.

---

## 4. GRE Traps

- **(-2)^2 vs -2^2.** With brackets, 4; without, -4.
- **x^2 = 16 gives x = 4 only.** No — it gives x = 4 or x = -4. Missing the negative root is the number-one exponent error on quantitative comparison.
- **a^(1/2) read as "half of a".** It is the square root.
- **Adding exponents when multiplying different bases.** 2^3 x 3^3 is not 6^6; it is 6^3.
- **0^0.** Not tested, and undefined — if you see it, you've misread.
- **Fractional bases.** (1/2)^5 is *smaller* than (1/2)^2. Raising a number between 0 and 1 to a higher power makes it smaller.
- **Negative exponent read as negative number.** 2^(-3) = 1/8, a positive number.

---

## 5. Speed Tricks

- **Prime-factorise everything.** Any exponent equation becomes trivial once every base is a prime power.
- **To compare a^m and b^n, find a common exponent** (as in Example 3) or a common base — whichever is easier.
- **Factor, don't expand,** whenever you see a sum of powers with the same base.
- **Estimate roots by bracketing.** sqrt(50) is between 7 (49) and 8 (64), and much closer to 7. So about 7.07.
- **Units digit cycles** of powers repeat with period at most 4: 2 -> 2,4,8,6; 3 -> 3,9,7,1; 7 -> 7,9,3,1; 8 -> 8,4,2,6. 0,1,5,6 never change.

---

## 6. Self-Check

**Q1.** Simplify (2^5 x 2^3) / 2^6.

**Q2.** If 9^(2x) = 27^(x+1), find x.

**Q3.** Simplify sqrt(98) + sqrt(50).

<details>
<summary>Answers</summary>

**A1.** 2^(5+3-6) = 2^2 = **4**.

**A2.** 3^(4x) = 3^(3x+3), so 4x = 3x + 3, giving x = **3**.

**A3.** sqrt(98) = 7sqrt(2), sqrt(50) = 5sqrt(2). Sum = **12 sqrt(2)**.

</details>

---

## 7. One-Line Summary for the Board

> Match the bases. Never add exponents across a plus sign — factor instead. x^2 = k has two roots.
