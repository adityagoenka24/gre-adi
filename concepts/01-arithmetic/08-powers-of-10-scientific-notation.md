# Powers of 10 & Scientific Notation

**Section:** Arithmetic  |  **Bank code:** ARI-P10  |  **GRE frequency:** Medium

---

## 1. Core Idea

Scientific notation writes any number as

`a x 10^n`, where `1 <= a < 10` and n is an integer.

Its purpose is to separate the **size** of a number (the exponent) from its **digits** (the coefficient). Once separated, comparison and multiplication become trivial.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Standard form | a x 10^n with 1 <= a < 10 |
| Multiplying | (a x 10^m)(b x 10^n) = ab x 10^(m+n), then renormalise |
| Dividing | (a x 10^m)/(b x 10^n) = (a/b) x 10^(m-n) |
| Adding | make exponents equal first, then add coefficients |
| Moving the point right | exponent decreases by 1 per place |
| Moving the point left | exponent increases by 1 per place |
| 10^0 | 1 |
| 10^(-n) | 1/10^n (a small positive number) |

**Reading the exponent as place value:**

- 10^3 = 1,000 (thousand)
- 10^6 = 1,000,000 (million)
- 10^9 = billion
- 10^(-2) = 0.01 (hundredth)
- 10^(-3) = 0.001 (thousandth)

**Counting zeros / decimal places.** In 0.00047, the first significant digit is in the 4th decimal place, so 0.00047 = 4.7 x 10^(-4).

**Comparing.** Compare exponents first; only if they tie do you compare coefficients. 3.1 x 10^8 > 9.9 x 10^7 because 8 > 7.

---

## 3. Worked Examples

### Example 1 — Multiplication with renormalising

*Compute (4 x 10^5)(6 x 10^(-9)) in scientific notation.*

Coefficients: 4 x 6 = 24. Exponents: 5 + (-9) = -4.

So 24 x 10^(-4). But 24 is not between 1 and 10, so renormalise:

24 x 10^(-4) = 2.4 x 10^1 x 10^(-4) = **2.4 x 10^(-3)**.

### Example 2 — Addition

*Compute 3.2 x 10^6 + 4.5 x 10^5.*

Rewrite the second with exponent 6: 4.5 x 10^5 = 0.45 x 10^6.

Sum = (3.2 + 0.45) x 10^6 = **3.65 x 10^6**.

### Example 3 — Division

*Compute (8.4 x 10^(-3)) / (2.1 x 10^2).*

Coefficients: 8.4/2.1 = 4. Exponents: -3 - 2 = -5.

**4 x 10^(-5)**.

---

## 4. GRE Traps

- **10^0 = 0.** No — it is 1.
- **Negative exponent means negative number.** 10^(-4) = 0.0001, which is positive and small.
- **Adding coefficients without matching exponents.** 3 x 10^5 + 2 x 10^3 is not 5 x 10^8 or 5 x 10^5.
- **Forgetting to renormalise** after multiplying (Example 1). Answer choices are always in proper standard form.
- **Miscounting decimal places.** 0.0034 is 3.4 x 10^(-3), not 10^(-4) — count from the decimal point to the first non-zero digit.
- **Assuming more digits means bigger.** 1.9 x 10^7 is much smaller than 2.0 x 10^9.

---

## 5. Speed Tricks

- **Split every number into coefficient and power** before doing anything. Then handle the two parts separately.
- **Estimate first.** For "approximately equal to" DI questions, round coefficients to one digit and just track the exponent.
- **Zeros count.** A number like 5,600,000 has the point moved 6 places -> 5.6 x 10^6.
- **For "how many times greater", divide** — the answer comes out as a power of 10 immediately.
- **Sanity check the exponent's sign:** numbers bigger than 1 have positive exponents, numbers between 0 and 1 have negative exponents.

---

## 6. Self-Check

**Q1.** Write 0.000901 in scientific notation.

**Q2.** Compute (5 x 10^4)(3 x 10^(-7)).

**Q3.** How many times greater is 6 x 10^8 than 3 x 10^5?

<details>
<summary>Answers</summary>

**A1.** **9.01 x 10^(-4)**.

**A2.** 15 x 10^(-3) = **1.5 x 10^(-2)**.

**A3.** (6/3) x 10^(8-5) = 2 x 10^3 = **2,000 times**.

</details>

---

## 7. One-Line Summary for the Board

> Separate the digits from the size. Compare exponents first; renormalise so 1 <= a < 10.
