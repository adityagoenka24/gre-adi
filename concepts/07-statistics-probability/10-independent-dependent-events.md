# Independent & Dependent Events

**Section:** Statistics & Probability  |  **Bank code:** STA-IDE  |  **GRE frequency:** Medium

---

## 1. Core Idea

- **Independent:** the outcome of one event does not change the probability of the other. Tossing a coin twice.
- **Dependent:** the first outcome changes the second's probability. Drawing two cards without replacement.

The diagnostic question: **"After the first event happens, has the pool changed?"** If yes, dependent.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Independent, both occur | P(A) x P(B) |
| Dependent, both occur | P(A) x P(B given A) |
| Test for independence | P(B given A) = P(B) |
| With replacement | independent |
| Without replacement | dependent |

**Conditional probability:** `P(B | A)` reads "the probability of B, given that A has happened". For dependent events, this is the number you multiply by.

`P(A and B) = P(A) x P(B | A)`

Rearranged: `P(B | A) = P(A and B) / P(A)`

**The gambler's fallacy.** Successive independent trials have no memory. After five heads in a row, the probability of a head on the sixth toss is still 1/2. The GRE tests this directly.

**Common independent setups:** repeated coin tosses, repeated die rolls, spinner spins, drawing with replacement, two unrelated machines.

**Common dependent setups:** drawing without replacement, selecting a committee one person at a time, picking cards from a shrinking deck.

---

## 3. Worked Examples

### Example 1 — With vs without replacement

*A box has 3 red and 7 blue pens. Two are drawn. Find P(both red) (a) with replacement, (b) without.*

(a) With replacement (independent): (3/10)(3/10) = 9/100 = **0.09**.

(b) Without replacement (dependent): (3/10)(2/9) = 6/90 = **1/15**, about 0.067.

The second is smaller, as expected — removing a red pen makes a second red less likely.

### Example 2 — Conditional probability

*In a class, 60% of students study Spanish and 25% study both Spanish and French. Given that a student studies Spanish, what is the probability they also study French?*

P(F | S) = P(F and S)/P(S) = 0.25/0.60 = **5/12**, about 41.7%.

### Example 3 — Independence check

*A fair coin has landed heads 4 times in a row. What is the probability of heads on the next toss?*

Coin tosses are independent; previous results do not matter.

**1/2.**

---

## 4. GRE Traps

- **The gambler's fallacy.** Past independent results never affect the next one.
- **Treating "without replacement" as independent.** Update both numerator and denominator.
- **Confusing P(A and B) with P(B | A).** The conditional already assumes A happened, so its denominator is smaller.
- **Confusing independent with mutually exclusive.** Mutually exclusive events are dependent: if A happens, B cannot.
- **Assuming replacement when the problem is silent.** "Two marbles are drawn" conventionally means without replacement — but look for the phrase "one at a time, replacing each".
- **Multiplying conditional probabilities in the wrong order.** P(A) x P(B|A) — the condition must match the event already taken.

---

## 5. Speed Tricks

- **Ask: does the pool change?** One question settles independent vs dependent.
- **Write the fractions stage by stage** without simplifying, so the shrinking denominators are visible.
- **For conditional probability, restrict the universe.** "Given that the student studies Spanish" means your new total is the Spanish students only.
- **Tree diagrams** make two-stage dependent problems almost automatic.
- **Sanity check:** without-replacement probabilities of repeating the same colour are always *lower* than with replacement.

---

## 6. Self-Check

**Q1.** A bag has 4 green and 6 yellow balls. Two are drawn without replacement. What is P(both green)?

**Q2.** A die is rolled twice. What is P(a 6 both times)?

**Q3.** 40% of a group wear glasses; 10% wear glasses and are left-handed. Given someone wears glasses, what is the probability they are left-handed?

<details>
<summary>Answers</summary>

**A1.** (4/10)(3/9) = 12/90 = **2/15**.

**A2.** Independent: (1/6)(1/6) = **1/36**.

**A3.** 0.10/0.40 = **1/4**.

</details>

---

## 7. One-Line Summary for the Board

> Does the pool change? If yes, dependent — update both numbers. Coins have no memory.
