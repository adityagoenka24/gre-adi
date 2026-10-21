# Compound Probability (AND / OR)

**Section:** Statistics & Probability  |  **Bank code:** STA-CPR  |  **GRE frequency:** High

---

## 1. Core Idea

Compound events combine two or more simple events. Two connective words control everything:

- **AND -> multiply.** Both events happen.
- **OR -> add** (then subtract the overlap, if any). At least one happens.

Getting the connective right is more important than any formula in this topic.

---

## 2. Must-Know Rules

| Situation | Rule |
|---|---|
| A and B (independent) | P(A) x P(B) |
| A and B (dependent) | P(A) x P(B given A) |
| A or B (mutually exclusive) | P(A) + P(B) |
| A or B (general) | P(A) + P(B) - P(A and B) |
| Not A | 1 - P(A) |
| At least one | 1 - P(none) |

**Mutually exclusive** means the two events cannot both happen (rolling a 3 *and* rolling a 5 on one die). Then P(A and B) = 0, and the addition rule simplifies.

**Independent** means one event does not affect the other's probability (two separate coin tosses). Independence is about multiplication; mutual exclusivity is about addition. **They are different ideas** — in fact, two events with non-zero probability cannot be both.

**With vs without replacement:**

- With replacement: the pool resets, so draws are independent.
- Without replacement: both the favourable count and the total shrink, so the second probability changes.

---

## 3. Worked Examples

### Example 1 — AND, independent

*A fair coin is tossed and a fair die is rolled. What is the probability of a head and a 6?*

Independent events: (1/2)(1/6) = **1/12**.

### Example 2 — AND, dependent (no replacement)

*A bag has 4 red and 6 blue marbles. Two are drawn without replacement. What is P(both red)?*

First draw: 4/10.

Second draw: now 3 red out of 9 remaining -> 3/9.

P = (4/10)(3/9) = 12/90 = **2/15**.

### Example 3 — OR with overlap

*A card is drawn from a standard deck. What is P(a heart or a face card)?*

P(heart) = 13/52. P(face) = 12/52. Overlap (face cards that are hearts: J, Q, K of hearts) = 3/52.

P = 13/52 + 12/52 - 3/52 = 22/52 = **11/26**.

---

## 4. GRE Traps

- **Adding when you should multiply.** "A and B" multiplies.
- **Forgetting to subtract the overlap** in an OR question. Double counting is the classic error.
- **Treating dependent draws as independent.** Without replacement, the second denominator drops.
- **Assuming mutual exclusivity.** Two events can easily overlap; check before adding.
- **Confusing independent with mutually exclusive.** Mutually exclusive events are strongly *dependent* — if one happens, the other definitely does not.
- **Order in "one red and one blue" problems.** If order is not specified, both orders count: (4/10)(6/9) + (6/10)(4/9).
- **Probability exceeding 1** after adding — a sure sign the overlap was not subtracted.

---

## 5. Speed Tricks

- **Underline the connective word** in the question: "and", "or", "at least", "neither".
- **"Neither A nor B" = 1 - P(A or B).**
- **Draw the tree** for two-stage problems; each path multiplies, and you add the paths that qualify.
- **For without-replacement problems, write the fractions before simplifying** so you can see the shrinking denominators.
- **Check independence explicitly:** does the first event change the second's pool? If yes, dependent.
- **"At least one" -> complement**, every single time.

---

## 6. Self-Check

**Q1.** Two fair coins are tossed. What is P(both heads)?

**Q2.** A bag has 5 white and 3 black balls. Two are drawn without replacement. What is P(both white)?

**Q3.** A die is rolled. What is P(even or greater than 4)?

<details>
<summary>Answers</summary>

**A1.** (1/2)(1/2) = **1/4**.

**A2.** (5/8)(4/7) = 20/56 = **5/14**.

**A3.** Even: 2,4,6 (3 outcomes). Greater than 4: 5,6 (2 outcomes). Overlap: 6 (1 outcome). P = (3 + 2 - 1)/6 = **4/6 = 2/3**.

</details>

---

## 7. One-Line Summary for the Board

> AND multiplies, OR adds minus the overlap. Without replacement, both numbers shrink.
