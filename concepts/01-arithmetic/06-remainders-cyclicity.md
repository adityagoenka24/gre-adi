# Remainders & Cyclicity

**Section:** Arithmetic  |  **Bank code:** ARI-REM  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

When N is divided by d, we write

`N = dq + r`, where `0 <= r < d`.

The remainder r is what is left over. Two facts do most of the work:

1. Remainders **repeat in cycles** as numbers grow.
2. You can take the remainder **at each step** of a calculation instead of at the end.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Division algorithm | N = dq + r, with 0 <= r < d |
| Remainder range | A remainder is always less than the divisor; 0 is allowed |
| Sum | rem(a+b) = rem( rem(a) + rem(b) ) |
| Product | rem(a x b) = rem( rem(a) x rem(b) ) |
| Power | rem(a^n) = rem( (rem a)^n ), then use cycling |
| Last digit | the remainder on division by 10 |
| Form of the number | "leaves remainder 3 when divided by 7" means N = 7k + 3 |

**Cyclicity of units digits (powers):**

| Units digit of base | Cycle | Length |
|---|---|---|
| 0, 1, 5, 6 | itself | 1 |
| 4, 9 | 4,6 / 9,1 | 2 |
| 2 | 2, 4, 8, 6 | 4 |
| 3 | 3, 9, 7, 1 | 4 |
| 7 | 7, 9, 3, 1 | 4 |
| 8 | 8, 4, 2, 6 | 4 |

To find the units digit of a^n where the cycle length is 4: compute n mod 4. If the result is 0, use the 4th entry in the cycle.

---

## 3. Worked Examples

### Example 1 — Building a number from its remainder

*When n is divided by 5, the remainder is 3. What is the remainder when 3n is divided by 5?*

n = 5k + 3, so 3n = 15k + 9 = 15k + 5 + 4 = 5(3k + 1) + 4.

Remainder = **4**.

Faster: rem(3 x 3) = rem(9) = 4.

### Example 2 — Units digit of a large power

*What is the units digit of 7^83?*

Cycle for 7 is 7, 9, 3, 1 (length 4).

83 divided by 4 leaves remainder 3, so we want the 3rd entry: **3**.

### Example 3 — Two conditions

*A number leaves remainder 2 when divided by 5 and remainder 2 when divided by 7. What is the smallest such positive number greater than 2?*

If the remainder is the same for both, the number is 2 more than a common multiple.

LCM(5, 7) = 35, so the numbers are 35k + 2: 2, 37, 72, ...

Smallest above 2 is **37**.

---

## 4. GRE Traps

- **Assuming remainder 0 is "no remainder" and therefore invalid.** Zero is a perfectly good remainder — it means divisible.
- **Remainder greater than or equal to the divisor.** If you compute a remainder of 9 on division by 7, you are not finished; reduce to 2.
- **Adding remainders without re-reducing.** rem(4) + rem(5) mod 7 = 9, which must reduce to 2.
- **Negative remainders.** The GRE uses non-negative remainders. -3 divided by 5 leaves remainder 2, not -3.
- **Off-by-one on cycles.** For 2^12, 12 mod 4 = 0, so use the **4th** entry (6), not the 0th.
- **Assuming a unique answer.** "n leaves remainder 3 on division by 7" describes infinitely many n; on quantitative comparison, test at least two of them.

---

## 5. Speed Tricks

- **Write N = dq + r immediately.** Almost every remainder word problem becomes algebra once you do.
- **Pick the smallest valid number.** If n leaves remainder 3 mod 7, just try n = 3 (then n = 10 to confirm). Fast and usually decisive.
- **Reduce before you multiply.** To find rem(97 x 98) mod 5, use 2 x 3 = 6 -> 1.
- **Same remainder for two divisors -> LCM + r.** Different remainders -> list one sequence and test against the other.
- **Last two digits** work the same way as last digits, but mod 100.

---

## 6. Self-Check

**Q1.** What is the remainder when 2^30 is divided by 10?

**Q2.** n leaves remainder 4 when divided by 9. What is the remainder when n + 8 is divided by 9?

**Q3.** What is the units digit of 3^47?

<details>
<summary>Answers</summary>

**A1.** Remainder mod 10 = units digit. Cycle for 2 is 2,4,8,6; 30 mod 4 = 2, so 2nd entry = **4**.

**A2.** 4 + 8 = 12, and 12 mod 9 = **3**.

**A3.** Cycle for 3 is 3,9,7,1; 47 mod 4 = 3, so 3rd entry = **7**.

</details>

---

## 7. One-Line Summary for the Board

> Write N = dq + r. Reduce at every step. Powers repeat with period 4 (or less).
