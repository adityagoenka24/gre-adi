# Simple & Compound Interest

**Section:** Word Problems  |  **Bank code:** WRD-INT  |  **GRE frequency:** Medium

---

## 1. Core Idea

- **Simple interest:** the interest is calculated on the **original principal** every period. Growth is linear.
- **Compound interest:** the interest is calculated on the **running balance**, so you earn interest on interest. Growth is exponential.

Compound always beats simple after the first period, and the gap widens over time.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Simple interest | SI = P x r x t |
| Amount (simple) | A = P(1 + rt) |
| Compound amount | A = P(1 + r)^t |
| Compound interest | CI = P[(1 + r)^t - 1] |
| Compounded n times per year | A = P(1 + r/n)^(nt) |
| Difference for 2 years | CI - SI = P x r^2 |

Here `r` is the rate as a **decimal** (8% -> 0.08) and `t` is in years, matching the rate's period.

**Compounding frequency.** For 12% per annum compounded quarterly over 2 years:

- rate per quarter = 12%/4 = 3%
- number of periods = 2 x 4 = 8
- A = P(1.03)^8

**The 2-year difference formula** is worth memorising: for the same P, r and 2 years, `CI - SI = P r^2`. For P = 10,000 and r = 10%: difference = 10000 x 0.01 = 100.

**Doubling.** Under compounding, the rule of 72 estimates the doubling time: `t ≈ 72 / (rate as a percent)`. At 8%, money roughly doubles in 9 years.

---

## 3. Worked Examples

### Example 1 — Simple interest

*Find the simple interest on $6,000 at 7% per annum for 3 years, and the final amount.*

SI = 6000 x 0.07 x 3 = **$1,260**.

Amount = 6000 + 1260 = **$7,260**.

### Example 2 — Compound interest

*$5,000 is invested at 10% per annum compounded annually for 3 years. Find the amount.*

A = 5000(1.10)^3 = 5000 x 1.331 = **$6,655**.

Interest earned = 6655 - 5000 = $1,655. (Simple interest would have been $1,500 — the $155 difference is the interest on interest.)

### Example 3 — Using the difference formula

*The difference between compound and simple interest on a sum for 2 years at 5% per annum is $20. Find the sum.*

CI - SI = P r^2 = P(0.05)^2 = 0.0025P.

0.0025P = 20 -> P = **$8,000**.

---

## 4. GRE Traps

- **Using the annual rate with a non-annual period.** Quarterly compounding needs r/4 and 4t.
- **Forgetting to subtract the principal.** "Interest earned" is A - P, not A.
- **Treating percentages as whole numbers.** 8% is 0.08 in the formula.
- **Assuming CI = SI for one period.** They are equal for exactly one compounding period, then diverge — a common quantitative comparison setup.
- **Simple interest treated as compound.** Read the word "compounded"; if absent, it is usually simple.
- **Rate per annum vs rate per period.** "6% per annum compounded semi-annually" is 3% per half-year, not 6%.

---

## 5. Speed Tricks

- **Compute the multiplier, then power it.** 8% for 3 years is x1.08 three times. Keep it as (1.08)^3 until the last step.
- **For 2-year problems, use CI - SI = Pr^2.** It appears often and takes five seconds.
- **Rule of 72** for any "how long to double" question.
- **Compound interest year by year** is often faster than the formula for 2-3 years: add 10%, then add 10% of the new total.
- **On comparison questions, remember CI > SI for t > 1** — you may not need to compute at all.

---

## 6. Self-Check

**Q1.** Find the simple interest on $12,000 at 6% for 4 years.

**Q2.** What is the amount if $2,000 is invested at 20% per annum compounded annually for 2 years?

**Q3.** At 12% per annum compounded quarterly, what rate applies per quarter and how many periods in 3 years?

<details>
<summary>Answers</summary>

**A1.** 12000 x 0.06 x 4 = **$2,880**.

**A2.** 2000 x 1.2^2 = 2000 x 1.44 = **$2,880**.

**A3.** **3% per quarter, 12 periods.**

</details>

---

## 7. One-Line Summary for the Board

> Simple grows on the principal; compound grows on the balance. Match the rate to the compounding period.
