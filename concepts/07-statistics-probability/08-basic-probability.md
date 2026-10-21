# Basic Probability

**Section:** Statistics & Probability  |  **Bank code:** STA-PRB  |  **GRE frequency:** Very High

---

## 1. Core Idea

For equally likely outcomes:

`P(event) = (number of favourable outcomes) / (total number of outcomes)`

Every probability lies between 0 and 1. A probability of 0 means impossible; 1 means certain.

The hardest part is usually **counting the total correctly** — which is why counting techniques come first.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Probability range | 0 <= P <= 1 |
| Certain event | P = 1 |
| Impossible event | P = 0 |
| Complement | P(not A) = 1 - P(A) |
| Sum of all outcomes | equals 1 |
| Odds in favour a : b | P = a/(a + b) |

**The complement rule is the workhorse.** Any question containing "at least one" should trigger it:

`P(at least one) = 1 - P(none)`

**Standard setups and their totals:**

| Experiment | Total outcomes |
|---|---|
| One coin | 2 |
| Two coins | 4 |
| n coins | 2^n |
| One die | 6 |
| Two dice | 36 |
| A standard deck | 52 cards, 4 suits of 13, 26 red, 26 black, 12 face cards |

**Two-dice sums.** The most likely sum is 7 (6 ways out of 36). Sums 2 and 12 have 1 way each. The count for a sum s (2 to 7) is s - 1, and it mirrors downward after 7.

---

## 3. Worked Examples

### Example 1 — Simple count

*A bag has 5 red, 3 blue and 4 green marbles. One is drawn at random. What is P(not blue)?*

Total = 12. Blue = 3.

P(blue) = 3/12 = 1/4, so P(not blue) = 1 - 1/4 = **3/4**.

### Example 2 — Two dice

*Two fair dice are rolled. What is the probability the sum is 9?*

Favourable: (3,6), (4,5), (5,4), (6,3) -> 4 ways.

Total = 36.

P = 4/36 = **1/9**.

### Example 3 — At least one

*Three fair coins are tossed. What is the probability of getting at least one head?*

P(no heads) = P(all tails) = (1/2)^3 = 1/8.

P(at least one head) = 1 - 1/8 = **7/8**.

Counting the cases directly would take four separate calculations; the complement takes one.

---

## 4. GRE Traps

- **Wrong denominator.** Two dice give 36 outcomes, not 12 or 11.
- **Forgetting that (3,6) and (6,3) are different outcomes** when the dice are distinguishable.
- **Probability greater than 1.** A sure sign of a counting error.
- **Adding probabilities of non-mutually-exclusive events.** P(A or B) = P(A) + P(B) - P(A and B).
- **Assuming replacement.** "Two marbles are drawn" usually means without replacement, so the second draw has a smaller total.
- **Confusing odds with probability.** Odds of 3 : 2 in favour means a probability of 3/5, not 3/2.
- **Enumerating "at least one" case by case** and missing a case.

---

## 5. Speed Tricks

- **Count the total first.** Get the denominator right and the rest usually follows.
- **"At least one" -> 1 minus none.** Automatic.
- **Draw the 6x6 grid** for two-dice questions once in class; students then recall the pattern rather than recounting.
- **Simplify fractions as you go** — GRE answer choices are in lowest terms.
- **Sanity check the size:** a "likely" event should give a probability well above 1/2.
- **For sequential draws, multiply stage by stage**, adjusting the counts each time.

---

## 6. Self-Check

**Q1.** A die is rolled. What is the probability of getting a number greater than 4?

**Q2.** A card is drawn from a standard deck. What is P(a face card)?

**Q3.** Two dice are rolled. What is the probability the sum is at least 11?

<details>
<summary>Answers</summary>

**A1.** Favourable: 5, 6 -> 2/6 = **1/3**.

**A2.** 12 face cards out of 52 = **3/13**.

**A3.** Sum 11: (5,6),(6,5) = 2 ways. Sum 12: (6,6) = 1 way. Total 3/36 = **1/12**.

</details>

---

## 7. One-Line Summary for the Board

> P = favourable over total. Get the total right first. "At least one" means 1 minus none.
