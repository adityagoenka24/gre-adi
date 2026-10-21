# Combinations

**Section:** Statistics & Probability  |  **Bank code:** STA-CMB  |  **GRE frequency:** High

---

## 1. Core Idea

A **combination** is a selection where **order does not matter**. Choosing Amit, Bina and Chetan for a committee is the same committee no matter what sequence you name them in.

The formula comes straight from permutations: count the ordered selections, then divide out the orderings you have over-counted.

`C(n,r) = P(n,r)/r! = n! / [r! (n-r)!]`

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Combinations of r from n | C(n,r) = n!/[r!(n-r)!] |
| Symmetry | C(n,r) = C(n, n-r) |
| Choose 0 or all | C(n,0) = C(n,n) = 1 |
| Choose 1 | C(n,1) = n |
| Choose 2 | C(n,2) = n(n-1)/2 |
| Total subsets of an n-set | 2^n |

**The symmetry rule saves real time.** C(10,8) = C(10,2) = 45. Always convert to the smaller r.

**Values worth recognising:**

| C(n,2) | n(n-1)/2 |
|---|---|
| C(5,2) | 10 |
| C(6,2) | 15 |
| C(8,2) | 28 |
| C(10,2) | 45 |

**Handshake problems** are always C(n,2): n people each shaking hands once with every other gives n(n-1)/2 handshakes.

**Multiple groups.** If you must choose from separate pools, multiply: choosing 2 from 5 men and 3 from 6 women gives C(5,2) x C(6,3) = 10 x 20 = 200.

**"At least" problems.** Either sum the individual cases, or subtract the complement from the total — the complement is usually faster.

---

## 3. Worked Examples

### Example 1 — Basic committee

*From 9 people, how many committees of 4 can be formed?*

C(9,4) = 9!/(4! 5!) = (9 x 8 x 7 x 6)/(4 x 3 x 2 x 1) = 3024/24 = **126**.

### Example 2 — Two pools

*A team of 3 must include 2 engineers from 6 and 1 designer from 4. How many teams?*

C(6,2) x C(4,1) = 15 x 4 = **60**.

### Example 3 — At least

*From 5 men and 4 women, a committee of 3 is chosen. In how many ways can it include at least one woman?*

Total committees = C(9,3) = 84.

All-men committees = C(5,3) = 10.

At least one woman = 84 - 10 = **74**.

---

## 4. GRE Traps

- **Using permutations for selections.** A committee of 3 from 9 is 126, not P(9,3) = 504.
- **Forgetting the symmetry shortcut** and grinding C(12,10) the long way.
- **Adding when you should multiply.** Independent selections from separate pools multiply.
- **Summing "at least" cases and missing one.** Use the complement.
- **Treating identical items as distinct** (or vice versa). Read whether the objects are distinguishable.
- **Double counting** when a person could belong to two categories.
- **Choosing "3 out of 9 in order" for a ranked list** — that *is* a permutation. Re-read whether roles differ (president/secretary vs plain members).

---

## 5. Speed Tricks

- **Order matters -> P. Order doesn't -> C.** Decide before writing.
- **Use the symmetry rule** to make r as small as possible.
- **C(n,2) = n(n-1)/2** covers handshakes, pairings, line segments between points, and diagonals.
- **Cancel before multiplying** in the factorial expression — never compute 9! outright.
- **"At least one" -> total minus none.**
- **A quick sanity check:** C(n,r) is always a whole number, and always less than or equal to P(n,r).

---

## 6. Self-Check

**Q1.** How many ways can 3 books be chosen from 7?

**Q2.** How many handshakes occur if 12 people each shake hands once with every other?

**Q3.** From 4 boys and 5 girls, how many groups of 4 contain exactly 2 boys?

<details>
<summary>Answers</summary>

**A1.** C(7,3) = (7x6x5)/6 = **35**.

**A2.** C(12,2) = 12x11/2 = **66**.

**A3.** C(4,2) x C(5,2) = 6 x 10 = **60**.

</details>

---

## 7. One-Line Summary for the Board

> Combination = selection without order. C(n,r) = C(n, n-r). Handshakes are always n(n-1)/2.
