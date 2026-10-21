# Estimation & Approximation

**Section:** Arithmetic  |  **Bank code:** ARI-EST  |  **GRE frequency:** Medium (but saves time everywhere)

---

## 1. Core Idea

The GRE rewards students who know **when not to calculate**. If the answer choices are far apart, or the question says "approximately", exact arithmetic is wasted effort.

Estimation is a decision, not a fallback. Look at the answer choices *before* you compute.

---

## 2. Must-Know Rules

| Situation | Approach |
|---|---|
| Answer choices far apart | Round aggressively, then match |
| Answer choices close together | Compute exactly |
| "Approximately" in the stem | Estimation is intended |
| Percent of a large number | Use 10% and scale |
| Square roots | Bracket between perfect squares |
| Fractions | Round to a friendly benchmark (1/2, 1/3, 3/4) |
| Products | Round one factor up and the other down to control error |

**Controlling the direction of error.** This is the part students miss.

- Round the numerator **up** and the denominator **down** -> your estimate is **too big**.
- Round both in the **same direction** -> the errors partly cancel, giving a better estimate.

So for 487/103 (true value 4.73), rounding to 500/100 = 5 overestimates twice — the numerator went up *and* the denominator went down. Rounding both the same way gives 500/110 = 4.55, or 490/105 = 4.67 — both much closer.

**Root approximation.** sqrt(N) sits between the two nearest perfect squares, positioned roughly proportionally.

sqrt(60): between 7 (49) and 8 (64). 60 is 11 above 49 out of a gap of 15, so about 7.7. (True: 7.746.)

**Benchmarks worth knowing:**

| Value | Approx |
|---|---|
| sqrt(2) | 1.41 |
| sqrt(3) | 1.73 |
| sqrt(5) | 2.24 |
| sqrt(10) | 3.16 |
| pi | 3.14 |
| 1/7 | 0.143 |
| 1/9 | 0.111 |

---

## 3. Worked Examples

### Example 1 — Deciding to estimate

*Approximately what is 19.8% of 4,062?*

19.8% is essentially 20% = 1/5.

4,062 / 5 is about 812.

**About 812.** (Exact: 804.3 — well within tolerance for an "approximately" question.)

### Example 2 — Root bracketing

*Between which two consecutive integers does sqrt(150) lie?*

12^2 = 144 and 13^2 = 169.

Since 144 < 150 < 169, sqrt(150) lies **between 12 and 13**, much closer to 12. (True: 12.25.)

### Example 3 — Controlled rounding

*Estimate (612 x 39) / 197.*

612 is about 600, 39 is about 40, 197 is about 200.

(600 x 40)/200 = 24000/200 = **120**.

Exact value is 121.2, so the estimate is well inside 1%.

---

## 4. GRE Traps

- **Rounding intermediate steps and then being asked for an exact value.** Estimate only when the question or the answer spread allows it.
- **Compounding errors in the same direction.** Rounding 4.6 up to 5 and 2.4 down to 2 in a product 4.6 x 2.4 gives 10 vs a true 11.04 — a 10% miss.
- **Over-rounding percentages.** Treating 19.8% as 20% is fine; treating 17% as 20% usually is not.
- **Rounding before simplifying.** Cancel common factors first — often the exact answer becomes easy.
- **Assuming "approximately" means the answer choices are loose.** Check the spread. Sometimes they are 2% apart.
- **Estimating on quantitative comparison when the two quantities are close.** If your estimates come out nearly equal, you must compute exactly — an estimate cannot distinguish A from C.

---

## 5. Speed Tricks

- **Look at the choices first.** Their spread tells you the precision you need.
- **10% then scale** for any percent: 35% of 480 = 48 x 3.5 = 168.
- **Doubling and halving.** 25 x 36 = 50 x 18 = 100 x 9 = 900.
- **Percent as a fraction.** 12.5% = 1/8, 16.67% = 1/6, 37.5% = 3/8 — dividing is faster than multiplying by a decimal.
- **Check the order of magnitude last.** Even if your digits are shaky, getting 10^3 vs 10^4 right usually identifies the answer.

---

## 6. Self-Check

**Q1.** Approximately what is 51% of 798?

**Q2.** Between which two consecutive integers does sqrt(200) lie?

**Q3.** Estimate 1,203 / 39.

<details>
<summary>Answers</summary>

**A1.** Just over half of 798, so **about 400** (exact 406.98).

**A2.** 14^2 = 196, 15^2 = 225, so **between 14 and 15** (very close to 14).

**A3.** About 1200/40 = **30** (exact 30.8).

</details>

---

## 7. One-Line Summary for the Board

> Read the answer choices before you calculate. If they are far apart, round — and round both parts the same way.
