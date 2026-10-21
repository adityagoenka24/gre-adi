# Primes & Prime Factorization

**Section:** Number Properties  |  **Bank codes:** ARI-PRM, NUM-PRF  |  **GRE frequency:** High

---

## 1. Core Idea

A **prime** is a positive integer greater than 1 with exactly two positive factors: 1 and itself.

The **Fundamental Theorem of Arithmetic** says every integer greater than 1 has one and only one prime factorisation. That uniqueness is why prime factorisation is the universal first move for divisibility, GCD, LCM, factor counting and remainder problems.

---

## 2. Must-Know Rules

| Fact | Detail |
|---|---|
| 1 is not prime | It has only one factor |
| 2 is the only even prime | Every other even number has 2 as a third factor |
| Primes under 50 | 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47 |
| Primality test | Test divisibility by primes up to sqrt(N) only |
| Prime factorisation | N = p1^a1 x p2^a2 x ... (unique) |
| Relatively prime (coprime) | GCD = 1; they share no prime factor |
| Composite | Any integer > 1 that is not prime |
| 0 and 1 | Neither prime nor composite |

**Primality test in practice.** To check whether 191 is prime, sqrt(191) is about 13.8, so test only 2, 3, 5, 7, 11, 13.

- Not even; digit sum 11 not divisible by 3; doesn't end in 0/5; 191/7 = 27.28...; 191/11 = 17.36...; 191/13 = 14.69...

**191 is prime.**

**Prime factorisation by factor tree.**

360 -> 36 x 10 -> (6 x 6) x (2 x 5) -> (2x3)(2x3)(2x5) = 2^3 x 3^2 x 5.

**Consecutive integers and primes.** Among any 3 consecutive integers, exactly one is divisible by 3. Among any n consecutive integers, exactly one is divisible by n... (at least one, precisely one when you take exactly n of them).

---

## 3. Worked Examples

### Example 1 — Prime factorisation as a tool

*What is the smallest positive integer k such that 720k is a perfect square?*

720 = 2^4 x 3^2 x 5^1

A perfect square needs every exponent even. The 2s (4) and 3s (2) are fine; the 5 has exponent 1, which is odd.

Multiply by 5: 720 x 5 = 3600 = 2^4 x 3^2 x 5^2 = 60^2.

**k = 5.**

### Example 2 — Coprimality

*Are 91 and 60 relatively prime?*

91 = 7 x 13. 60 = 2^2 x 3 x 5.

No shared prime factor, so GCD = 1. **Yes, they are relatively prime.**

### Example 3 — Counting primes with a constraint

*How many prime numbers p satisfy 20 < p < 40?*

Candidates: 23, 29, 31, 37. (21 = 3x7, 25 = 5^2, 27 = 3^3, 33 = 3x11, 35 = 5x7, 39 = 3x13 are composite.)

**4 primes.**

---

## 4. GRE Traps

- **Calling 1 prime.** It is not. This single fact appears in traps constantly.
- **Assuming all primes are odd.** 2 is prime and even. If a question says "p is prime", you must consider p = 2.
- **Assuming all odd numbers are prime.** 9, 15, 21, 25, 27 are odd and composite.
- **Testing divisibility beyond sqrt(N).** Wasted time; anything above sqrt(N) pairs with something below.
- **"Prime factors" vs "factors".** 12 has 6 factors but only 2 distinct prime factors (2 and 3).
- **Forgetting exponents count.** 12 = 2^2 x 3 has 3 prime factors *with multiplicity* but 2 *distinct* ones. Read which is wanted.
- **Negative numbers.** Primality is defined only for integers greater than 1.

---

## 5. Speed Tricks

- **Memorise the primes to 50.** It pays for itself many times over.
- **Perfect square = all even exponents. Perfect cube = all exponents divisible by 3.** This turns a whole class of "smallest k" problems into inspection.
- **The 6k +/- 1 rule.** Every prime greater than 3 is one more or one less than a multiple of 6. Handy for quick elimination (though not every such number is prime).
- **For "p and q are primes" questions, always test p = 2.** It is the exception that generates the trap answer.
- **Factor trees beat trial division** for any number above about 200.

---

## 6. Self-Check

**Q1.** Is 143 prime?

**Q2.** What is the prime factorisation of 504?

**Q3.** What is the smallest positive integer k such that 108k is a perfect cube?

<details>
<summary>Answers</summary>

**A1.** 143 = 11 x 13. **Not prime.**

**A2.** 504 = 8 x 63 = 2^3 x 3^2 x 7. **2^3 x 3^2 x 7.**

**A3.** 108 = 2^2 x 3^3. For a cube, exponents must be multiples of 3. The 2s need one more, the 3s are fine. **k = 2** (giving 216 = 6^3).

</details>

---

## 7. One-Line Summary for the Board

> 1 is not prime, 2 is the only even prime. Prime factorise first — everything else follows.
