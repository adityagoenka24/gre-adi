# Counting Principle & Permutations

**Section:** Statistics & Probability  |  **Bank code:** STA-PRM  |  **GRE frequency:** High

---

## 1. Core Idea

Counting problems reduce to one question: **does order matter?**

- Order matters -> **permutation** (arrangements, rankings, seat orders, passwords).
- Order does not matter -> **combination** (committees, teams, handshakes — see the next capsule).

And underneath both sits the **fundamental counting principle**: if one choice can be made in m ways and a second independently in n ways, together there are m x n ways.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Fundamental counting principle | multiply the choices at each stage |
| Factorial | n! = n(n-1)(n-2)...(1); 0! = 1 |
| Arrangements of n distinct items | n! |
| Permutations of r from n | P(n,r) = n!/(n-r)! |
| Arrangements with repeats | n! / (a! b! c! ...) for repeated items |
| Circular arrangements of n | (n-1)! |

**Factorial values to know:** 1, 2, 6, 24, 120, 720, 5040 for 1! through 7!.

**Arrangements with repeated letters.** The word BANANA has 6 letters with A appearing 3 times and N twice:

6!/(3! x 2!) = 720/12 = **60** distinct arrangements.

**Restrictions — two standard techniques:**

1. **Glue method** (items must be together): treat the block as one item, arrange, then multiply by the internal arrangements of the block.
2. **Complement method** (items must be apart): total arrangements minus the arrangements where they are together.

**Circular arrangements** lose one degree of freedom because rotations are equivalent: n people around a round table can be seated in (n-1)! ways.

---

## 3. Worked Examples

### Example 1 — Counting principle

*A menu has 4 starters, 6 mains and 3 desserts. How many three-course meals are possible?*

4 x 6 x 3 = **72**.

### Example 2 — Permutation with restriction (glue)

*In how many ways can 5 people be seated in a row if two particular people must sit together?*

Glue the pair into one block: now arrange 4 items -> 4! = 24.

The pair can be internally ordered in 2! = 2 ways.

Total = 24 x 2 = **48**.

(Check with the complement: total 5! = 120, so 120 - 48 = 72 arrangements have them apart.)

### Example 3 — Repeated letters

*How many distinct arrangements are there of the letters in LEVEL?*

5 letters: L appears twice, E twice, V once.

5!/(2! x 2!) = 120/4 = **30**.

---

## 4. GRE Traps

- **Using a permutation where order does not matter.** "How many committees of 3" is a combination, not a permutation.
- **Forgetting to divide by repeats.** BANANA has 60 arrangements, not 720.
- **Adding instead of multiplying.** Sequential independent choices multiply. Only mutually exclusive alternatives add ("or" adds, "and" multiplies).
- **0! treated as 0.** It equals 1.
- **Circular arrangements counted as n!.** Rotations are the same arrangement, so it is (n-1)!.
- **Double counting** in restriction problems — glue *or* complement, not both at once.
- **Assuming repetition is allowed.** "A 3-digit code from digits 0-9" allows repeats (1000 options) unless the problem says digits are distinct (10 x 9 x 8 = 720).

---

## 5. Speed Tricks

- **Ask "does order matter?" out loud** before writing anything.
- **Draw slots.** One blank per position, fill in the number of choices, multiply. This handles most GRE counting questions without any formula.
- **"At least one" almost always means use the complement:** total minus none.
- **Glue for together, complement for apart.**
- **Cancel factorials rather than expanding.** 10!/8! = 10 x 9 = 90.
- **Check the size of your answer.** Counting answers grow fast; if yours is suspiciously small, you probably added where you should have multiplied.

---

## 6. Self-Check

**Q1.** How many 4-letter arrangements can be made from the letters of MATH (no repeats)?

**Q2.** How many distinct arrangements does the word SUCCESS have?

**Q3.** In how many ways can 6 people sit around a circular table?

<details>
<summary>Answers</summary>

**A1.** 4! = **24**.

**A2.** 7 letters: S appears 3 times, C twice. 7!/(3! x 2!) = 5040/12 = **420**.

**A3.** (6-1)! = 5! = **120**.

</details>

---

## 7. One-Line Summary for the Board

> Order matters = permutation. Draw slots and multiply. Divide by the factorial of each repeat.
