# GCD & LCM

**Section:** Number Properties  |  **Bank code:** NUM-GCL  |  **GRE frequency:** High

---

## 1. Core Idea

- **GCD (Greatest Common Divisor / HCF):** the largest number that divides both. It is about **splitting into equal groups**.
- **LCM (Least Common Multiple):** the smallest number that both divide. It is about **events lining up again**.

The word-problem tell: "largest possible size / greatest number of identical pieces" -> GCD. "When will they next coincide / smallest quantity that works for both" -> LCM.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| GCD from prime factorisation | Take the **lowest** power of each **shared** prime |
| LCM from prime factorisation | Take the **highest** power of **every** prime present |
| Key identity | GCD(a,b) x LCM(a,b) = a x b |
| Coprime numbers | GCD = 1, and then LCM = a x b |
| GCD range | 1 <= GCD <= min(a, b) |
| LCM range | max(a, b) <= LCM <= a x b |
| GCD divides LCM | always |

**Worked mechanic.** For 84 and 120:

- 84 = 2^2 x 3 x 7
- 120 = 2^3 x 3 x 5

GCD = 2^2 x 3^1 = **12** (lowest power of shared primes 2 and 3; 5 and 7 are not shared).

LCM = 2^3 x 3 x 5 x 7 = **840** (highest power of every prime).

Check the identity: 12 x 840 = 10,080 and 84 x 120 = 10,080. Correct.

**Three numbers.** GCD and LCM extend the same way, but note the identity `GCD x LCM = product` is **only valid for two numbers**.

---

## 3. Worked Examples

### Example 1 — GCD word problem

*A florist has 48 roses and 36 tulips. She wants to make identical bouquets using all the flowers. What is the greatest number of bouquets she can make, and what does each contain?*

"Greatest number of identical groups using all" -> GCD.

48 = 2^4 x 3, 36 = 2^2 x 3^2. GCD = 2^2 x 3 = 12.

**12 bouquets**, each with 48/12 = 4 roses and 36/12 = 3 tulips.

### Example 2 — LCM word problem

*Three bells ring every 12, 18 and 30 minutes. If they ring together at noon, when do they next ring together?*

"Next coincide" -> LCM.

- 12 = 2^2 x 3
- 18 = 2 x 3^2
- 30 = 2 x 3 x 5

LCM = 2^2 x 3^2 x 5 = 180 minutes = 3 hours.

**They next ring together at 3:00 pm.**

### Example 3 — Using the identity

*Two numbers have GCD 6 and LCM 90. If one number is 18, what is the other?*

GCD x LCM = product: 6 x 90 = 540.

Other number = 540/18 = **30**.

Check: GCD(18, 30) = 6 and LCM(18, 30) = 90. Correct.

---

## 4. GRE Traps

- **Swapping GCD and LCM.** GCD is small (at most the smaller number); LCM is large (at least the larger number). If your GCD exceeds either number, you've computed the LCM.
- **Using the highest power for GCD.** GCD takes the *lowest* power, and only of *shared* primes.
- **Applying GCD x LCM = product to three numbers.** It fails. For 2, 4, 8: GCD = 2, LCM = 8, product of the two is 16, but 2 x 4 x 8 = 64.
- **Assuming divisible by 4 and 6 means divisible by 24.** It means divisible by LCM(4, 6) = 12.
- **Forgetting a prime that appears in only one number** when computing LCM.
- **Word-problem misread.** "Same number of items in each group" is GCD; "smallest length both can be cut into" is LCM.

---

## 5. Speed Tricks

- **Prime factorise in a column.** Write the primes down the side and the exponents across; GCD is the row minimum, LCM the row maximum.
- **Euclid's algorithm for two big numbers.** GCD(a,b) = GCD(b, a mod b), repeat until 0. GCD(252, 105) -> GCD(105, 42) -> GCD(42, 21) -> GCD(21, 0) = 21.
- **If one number divides the other,** GCD is the smaller and LCM is the larger. Instant.
- **Consecutive integers are always coprime** — GCD = 1, LCM = product.
- **LCM of a set is a multiple of every element** — use it as a sanity check.

---

## 6. Self-Check

**Q1.** Find GCD and LCM of 60 and 144.

**Q2.** Two runners complete a lap in 40 and 60 seconds. They start together. After how long are they together at the start line again?

**Q3.** If GCD(a, b) = 8 and LCM(a, b) = 96, what is a x b?

<details>
<summary>Answers</summary>

**A1.** 60 = 2^2 x 3 x 5; 144 = 2^4 x 3^2. GCD = 2^2 x 3 = **12**. LCM = 2^4 x 3^2 x 5 = **720**.

**A2.** LCM(40, 60) = 120 seconds = **2 minutes**.

**A3.** 8 x 96 = **768**.

</details>

---

## 7. One-Line Summary for the Board

> GCD = lowest powers of shared primes (grouping). LCM = highest powers of all primes (coinciding). GCD x LCM = product, for two numbers only.
