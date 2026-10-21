# Digit Problems & Place Value

**Section:** Number Properties  |  **Bank code:** NUM-DPV  |  **GRE frequency:** Medium

---

## 1. Core Idea

A digit is one of 0-9. A **number** is built from digits by place value:

A two-digit number with tens digit a and units digit b equals `10a + b`, **not** `ab`.

Writing that expansion is the first move in every digit problem. Once you do, digit puzzles become ordinary algebra with the extra constraint that each digit is an integer from 0 to 9.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Two-digit number | 10a + b (a from 1-9, b from 0-9) |
| Three-digit number | 100a + 10b + c |
| Reversing a two-digit number | 10b + a |
| Difference of a number and its reverse | (10a+b) - (10b+a) = 9(a - b) |
| Sum of a number and its reverse | 11(a + b) |
| Leading digit | cannot be 0 |
| Digit sum | tests divisibility by 3 and 9 |
| Units digit of a product | depends only on the units digits of the factors |

**Two facts worth memorising:**

1. The difference between a two-digit number and its reverse is **always a multiple of 9**.
2. The sum of a two-digit number and its reverse is **always a multiple of 11**.

**Counting numbers with digit constraints.** Use the slot method: draw one blank per digit, count the allowed choices for each slot, and multiply. Remember the leading slot excludes 0.

*How many 3-digit numbers have all distinct digits?* First slot: 9 (1-9). Second: 9 (0-9 minus the one used). Third: 8. Total = 9 x 9 x 8 = 648.

---

## 3. Worked Examples

### Example 1 — Classic reversal

*A two-digit number is 27 less than the number formed by reversing its digits. If the digit sum is 11, find the number.*

Let the number be 10a + b.

Reverse - original = 27: (10b + a) - (10a + b) = 9(b - a) = 27, so b - a = 3.

Also a + b = 11.

Adding: 2b = 14 -> b = 7, a = 4.

Number = **47**. Check: 74 - 47 = 27, and 4 + 7 = 11. Correct.

### Example 2 — Units digit of a product

*What is the units digit of 37 x 48 x 55?*

Only units digits matter: 7 x 8 = 56 -> units 6. Then 6 x 5 = 30 -> units **0**.

(Faster: any product containing a factor ending in 5 and an even factor ends in 0.)

### Example 3 — Counting with constraints

*How many 3-digit numbers are there whose digits are all odd?*

Odd digits: 1, 3, 5, 7, 9 — five choices. Leading digit may be any of them (none is 0).

5 x 5 x 5 = **125**.

---

## 4. GRE Traps

- **Writing "ab" for a two-digit number.** That means a x b. You need 10a + b.
- **Allowing 0 as a leading digit.** A three-digit number cannot start with 0.
- **Confusing "digits" with "numbers".** "The digits sum to 12" is a very different constraint from "the number is 12".
- **Assuming digits are distinct** when the problem doesn't say so — and vice versa.
- **Place value of decimals.** In 3.147, the 4 is in the hundredths place. Tenths, hundredths, thousandths — going right, not left.
- **Forgetting the digit range.** Any solution with a digit outside 0-9 is invalid, which often rules out an otherwise-valid algebraic answer.

---

## 5. Speed Tricks

- **Expand immediately:** 10a + b. Never work with the digits informally.
- **Difference of reverses = 9(a-b).** If a digit problem mentions "27 less when reversed", you instantly know b - a = 3.
- **Units-digit questions need only units digits.** Discard everything else.
- **Slot-and-multiply for counting.** Handle the restricted slot (usually the leading digit) first.
- **Digit sums for divisibility** — if a question asks which digit makes a number divisible by 9, use the digit sum, don't divide.

---

## 6. Self-Check

**Q1.** A two-digit number has digit sum 9. Reversing it increases the number by 45. Find the number.

**Q2.** What is the units digit of 23 x 47 x 61?

**Q3.** How many two-digit numbers have distinct digits?

<details>
<summary>Answers</summary>

**A1.** 9(b - a) = 45 -> b - a = 5; with a + b = 9, we get b = 7, a = 2. Number = **27**. (72 - 27 = 45.)

**A2.** 3 x 7 = 21 -> 1; 1 x 1 = **1**.

**A3.** First digit 9 choices, second 9 choices (0-9 minus the first) = **81**.

</details>

---

## 7. One-Line Summary for the Board

> A two-digit number is 10a + b. Reverse-difference is a multiple of 9; reverse-sum a multiple of 11.
