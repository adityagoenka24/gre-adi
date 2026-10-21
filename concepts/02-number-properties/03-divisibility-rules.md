# Divisibility Rules

**Section:** Number Properties  |  **Bank codes:** ARI-INT, NUM-DIV  |  **GRE frequency:** High

---

## 1. Core Idea

A divisibility rule is a shortcut for testing whether `d` divides `N` without doing the division. Knowing them turns 30-second computations into 3-second observations.

---

## 2. Must-Know Rules

| Divisor | Test |
|---|---|
| 2 | Last digit is even (0, 2, 4, 6, 8) |
| 3 | Digit sum is divisible by 3 |
| 4 | Last **two** digits form a number divisible by 4 |
| 5 | Last digit is 0 or 5 |
| 6 | Divisible by both 2 and 3 |
| 8 | Last **three** digits form a number divisible by 8 |
| 9 | Digit sum is divisible by 9 |
| 10 | Last digit is 0 |
| 11 | Alternating digit sum is divisible by 11 |
| 12 | Divisible by both 3 and 4 |
| 25 | Last two digits are 00, 25, 50 or 75 |

**The 11 rule in detail.** Add digits in odd positions, subtract digits in even positions (from the right). If the result is 0 or a multiple of 11, the number is divisible by 11.

For 82,918: (8 + 9 + 8) - (2 + 1) = 25 - 3 = 22. 22 is a multiple of 11, so **82,918 is divisible by 11**.

**Combining rules — the essential caution.** To test divisibility by a composite d, split it into **coprime** factors.

- 12 = 3 x 4 (coprime) -> test 3 and 4. Valid.
- 12 = 2 x 6 (NOT coprime) -> testing 2 and 6 is not sufficient. 18 passes both but 18/12 is not an integer.

**Divisibility of expressions.** If d divides a and d divides b, then d divides a + b, a - b, and ka for any integer k.

---

## 3. Worked Examples

### Example 1 — Finding a missing digit

*For what digit x is the number 4,3x2 divisible by 9?*

Digit sum = 4 + 3 + x + 2 = 9 + x.

For divisibility by 9, 9 + x must be a multiple of 9. So x = 0 or x = 9.

**x = 0 or 9.**

### Example 2 — Composite divisor

*Is 3,624 divisible by 12?*

Test 3: digit sum = 3 + 6 + 2 + 4 = 15, divisible by 3. Yes.

Test 4: last two digits are 24, divisible by 4. Yes.

3 and 4 are coprime, so **yes, 3,624 is divisible by 12**. (3624/12 = 302.)

### Example 3 — Divisibility of an expression

*If n is divisible by 6, is n^2 + 3n divisible by 6?*

n = 6k, so n^2 + 3n = n(n + 3) = 6k(6k + 3) = 6 x k(6k+3).

The factor 6 is explicit, so **yes**.

---

## 4. GRE Traps

- **Testing 12 as 2 and 6.** The factors must be coprime. Use 3 and 4.
- **Confusing the 4 rule with the 2 rule.** Divisibility by 4 needs the last *two* digits, not just the last.
- **Digit sum rule applied to 4 or 8.** It only works for 3 and 9.
- **Assuming divisibility of a sum implies divisibility of each term.** 7 divides 3 + 4 but divides neither 3 nor 4.
- **Zero.** 0 is divisible by every non-zero integer. It is also even.
- **Negative numbers.** -12 is divisible by 3. Divisibility is about the remainder being 0, and sign doesn't affect that.
- **"Divisible by" vs "a divisor of".** "6 is divisible by 3" and "3 is a divisor of 6" say the same thing; students reverse them under time pressure.

---

## 5. Speed Tricks

- **Digit sum first.** It settles 3, 9 and (with the 2-test) 6 in one glance.
- **For 8, halve three times** or just check the last three digits.
- **To test large numbers by 7,** there is a rule (double the last digit, subtract from the rest) but on the GRE it is usually faster to just divide.
- **Prime factorise the divisor,** then check each prime power separately: 72 = 8 x 9, so check the last three digits for 8 and the digit sum for 9.
- **In "which of the following must be divisible by" questions, prime factorise the given expression** rather than plugging numbers.

---

## 6. Self-Check

**Q1.** Is 5,148 divisible by 11?

**Q2.** What is the smallest digit d that makes 27,d4 divisible by 4? (The number is 2, 7, d, 4.)

**Q3.** If n is divisible by both 4 and 6, must n be divisible by 24?

<details>
<summary>Answers</summary>

**A1.** Alternating sum from the right: (8 + 1) - (4 + 5) = 9 - 9 = 0. **Yes** (5148 = 11 x 468).

**A2.** Last two digits are "d4". Need d4 divisible by 4: 04, 24, 44, 64, 84 work. Smallest d = **0**.

**A3.** **No.** 12 is divisible by 4 and 6 but not by 24. The correct conclusion is divisibility by LCM(4,6) = 12.

</details>

---

## 7. One-Line Summary for the Board

> Digit sum for 3 and 9; last two digits for 4; last three for 8. Split composite divisors into COPRIME factors.
