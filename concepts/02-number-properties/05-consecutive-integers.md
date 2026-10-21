# Consecutive Integers

**Section:** Number Properties  |  **Bank code:** NUM-CON  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

Consecutive integers are evenly spaced, so they behave like an arithmetic sequence with common difference 1. Two consequences do all the work:

1. **The mean equals the median.** For evenly spaced sets, average = (first + last)/2.
2. **Divisibility is guaranteed in blocks.** Among any n consecutive integers, exactly one is divisible by n.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| n consecutive integers | n, n+1, n+2, ... |
| n consecutive **even** or **odd** | n, n+2, n+4, ... |
| Sum of n consecutive integers | n x (average) = n x (first + last)/2 |
| Average of evenly spaced set | (first + last)/2 |
| Count of integers from a to b | b - a + 1 |
| Product of n consecutive integers | always divisible by n! |
| Among any 2 consecutive | one is even |
| Among any 3 consecutive | one is divisible by 3 |
| Sum of first n positive integers | n(n+1)/2 |

**Product divisibility.** The product of any k consecutive integers is divisible by k!.

- 2 consecutive: divisible by 2! = 2
- 3 consecutive: divisible by 3! = 6
- 4 consecutive: divisible by 4! = 24

So n(n+1)(n+2) is always a multiple of 6, for every integer n.

**Sum parity.**

- Sum of an **odd** number of consecutive integers is divisible by that count. (3 consecutive integers sum to 3 times the middle one.)
- Sum of an **even** number of consecutive integers is **never** divisible by that count.

**Setting up.** For 3 consecutive integers, using `n-1, n, n+1` is usually cleaner than `n, n+1, n+2` — the sum becomes 3n immediately.

---

## 3. Worked Examples

### Example 1 — Sum of consecutive integers

*The sum of 5 consecutive integers is 265. What is the largest one?*

For an odd count, sum = count x middle. So the middle = 265/5 = 53.

The five integers are 51, 52, 53, 54, 55.

Largest = **55**.

### Example 2 — Consecutive even integers

*The sum of 4 consecutive even integers is 100. Find the smallest.*

Let them be n, n+2, n+4, n+6.

Sum = 4n + 12 = 100 -> 4n = 88 -> n = **22**.

Check: 22 + 24 + 26 + 28 = 100. Correct.

### Example 3 — Guaranteed divisibility

*If n is an integer, which of the following must be divisible by 6: n(n+1), n(n+1)(n+2), or n^2 + n + 1?*

- n(n+1) is 2 consecutive -> divisible by 2, not necessarily 6 (n=1 gives 2).
- n(n+1)(n+2) is 3 consecutive -> divisible by 3! = **6**. Always.
- n^2 + n + 1 = n(n+1) + 1 is always odd, so never divisible by 6.

**Only n(n+1)(n+2).**

---

## 4. GRE Traps

- **Assuming "consecutive" means only positive integers.** -3, -2, -1, 0, 1 are consecutive integers.
- **Consecutive even/odd spacing.** The gap is 2, not 1. Students write n, n+1, n+2 for "consecutive odd integers".
- **Count off by one.** Integers from 7 to 19 inclusive number 19 - 7 + 1 = 13, not 12.
- **Average of an even-sized set is not a member of the set.** The average of 4, 5, 6, 7 is 5.5.
- **Assuming the sum of consecutive integers is always divisible by the count.** True for odd counts only.
- **Zero.** 0 is an integer and is even. Consecutive sets can include it.

---

## 5. Speed Tricks

- **Centre the variable.** For an odd count, name the middle term n. The sum collapses instantly.
- **Sum = count x average**, and for evenly spaced sets average = (first + last)/2. This is the single most reusable formula in the topic.
- **For "must be divisible by" questions, count how many consecutive terms are in the product** and apply the k! rule.
- **Test n = 1, n = 2 and n = 0** on any "must be true" statement — it eliminates most wrong choices in seconds.
- **Sum 1 to n = n(n+1)/2.** Also: sum of the first n odd numbers = n^2.

---

## 6. Self-Check

**Q1.** The sum of 3 consecutive odd integers is 81. What are they?

**Q2.** How many integers are there from -4 to 12 inclusive?

**Q3.** Is n(n+1)(n+2)(n+3) always divisible by 24?

<details>
<summary>Answers</summary>

**A1.** Middle = 81/3 = 27, so **25, 27, 29**.

**A2.** 12 - (-4) + 1 = **17**.

**A3.** **Yes** — the product of 4 consecutive integers is divisible by 4! = 24.

</details>

---

## 7. One-Line Summary for the Board

> Evenly spaced means mean = median. Sum = count x (first + last)/2. Product of k consecutive is divisible by k!.
