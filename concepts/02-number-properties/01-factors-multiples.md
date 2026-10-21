# Factors & Multiples

**Section:** Number Properties  |  **Bank code:** NUM-FAM  |  **GRE frequency:** High

---

## 1. Core Idea

If `a x b = N` with a, b integers, then a and b are **factors** of N, and N is a **multiple** of a and b.

Factors are **at most** N and finite in number. Multiples are **at least** N and infinite. Students who keep those two sentences straight avoid half the errors in this topic.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Factor | divides N exactly, leaving remainder 0 |
| Multiple | N x k for integer k |
| Smallest factor of N > 1 | its smallest prime factor |
| Largest factor of N | N itself |
| Smallest positive multiple of N | N itself |
| Number of factors | if N = p^a x q^b x r^c, count = (a+1)(b+1)(c+1) |
| Sum of factors | (p^0+...+p^a)(q^0+...+q^b)... |
| Factors come in pairs | d and N/d |
| Perfect squares | have an ODD number of factors |

**Why perfect squares are odd-count.** Factors pair up as d and N/d. For a perfect square, the middle pair is the square root paired with itself, so one factor is unpaired. 36 has factors 1,2,3,4,6,9,12,18,36 — nine of them.

**Counting factors — worked mechanic.**

72 = 2^3 x 3^2

Number of factors = (3+1)(2+1) = 4 x 3 = **12**.

Check: 1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72. Twelve. Correct.

**Listing factors efficiently.** Walk upward from 1 to sqrt(N), and each divisor you find gives you its partner for free.

---

## 3. Worked Examples

### Example 1 — Number of factors

*How many positive factors does 180 have?*

180 = 2^2 x 3^2 x 5^1

Count = (2+1)(2+1)(1+1) = 3 x 3 x 2 = **18**.

### Example 2 — Even factors only

*How many even factors does 180 have?*

An even factor must contain at least one 2. Fix one 2 and count the factors of what remains:

180/2 = 90 = 2^1 x 3^2 x 5

Number of factors of 90 = (1+1)(2+1)(1+1) = 12.

**12 even factors.** (And 18 - 12 = 6 odd factors — check: the odd factors are the factors of 3^2 x 5, which is (2+1)(1+1) = 6. Correct.)

### Example 3 — Multiples in a range

*How many multiples of 7 are there between 100 and 300 inclusive?*

Smallest multiple >= 100: 7 x 15 = 105.

Largest multiple <= 300: 7 x 42 = 294.

Count = 42 - 15 + 1 = **28**.

---

## 4. GRE Traps

- **Forgetting 1 and N.** Both are factors of N.
- **Counting only prime factors** when the question asks for all factors.
- **Negative factors.** Unless the question says "positive", technically -3 is a factor of 12. The GRE almost always means positive — but read carefully.
- **Off-by-one in counting multiples.** The count in a range is (last - first)/step + 1. The "+1" is forgotten constantly.
- **Assuming a factor of a product must be a factor of one of the parts.** 6 is a factor of 4 x 9 = 36 but not of 4 or 9.
- **Perfect-square factor count.** If a question says "N has an odd number of factors", it is telling you N is a perfect square.

---

## 5. Speed Tricks

- **Prime factorise first, always.** Every factor question reduces to exponents once you do.
- **(a+1)(b+1)(c+1)** for factor counts — memorise the "+1 to each exponent" rule.
- **Odd factors** = drop all the 2s, then count. **Even factors** = total minus odd.
- **Factor pairs** halve your listing work — stop at sqrt(N).
- **"How many multiples of k in [a, b]"** = floor(b/k) - floor((a-1)/k).

---

## 6. Self-Check

**Q1.** How many positive factors does 96 have?

**Q2.** How many multiples of 12 are between 50 and 200 inclusive?

**Q3.** If a number has exactly 3 positive factors, what kind of number is it?

<details>
<summary>Answers</summary>

**A1.** 96 = 2^5 x 3, so (5+1)(1+1) = **12**.

**A2.** First: 60 (12x5). Last: 192 (12x16). Count = 16 - 5 + 1 = **12**.

**A3.** (a+1) = 3 means a = 2 and only one prime, so it is **the square of a prime** (4, 9, 25, 49, ...).

</details>

---

## 7. One-Line Summary for the Board

> Prime factorise, then add 1 to every exponent and multiply. Factors are finite; multiples are infinite.
