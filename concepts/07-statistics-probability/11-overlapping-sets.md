# Overlapping Sets & Venn Diagrams

**Section:** Statistics & Probability  |  **Bank code:** STA-OVL  |  **GRE frequency:** High

---

## 1. Core Idea

When two groups overlap, simply adding their sizes **double counts** the members in both. The correction is the inclusion-exclusion principle:

`Total in A or B = A + B - (both)`

For questions with two attributes and a yes/no answer for each, a **2x2 table** is usually faster and less error-prone than a Venn diagram.

---

## 2. Must-Know Rules

**Two sets:**

| Concept | Formula |
|---|---|
| In A or B | A + B - (A and B) |
| Total group | (A only) + (B only) + (both) + (neither) |
| A only | A - (both) |
| Neither | Total - (A or B) |

**Three sets:**

Total in at least one = A + B + C - (A and B) - (B and C) - (A and C) + (A and B and C)

The final term is added back because members of all three were subtracted one too many times.

**The 2x2 table.** For two yes/no attributes:

| | B yes | B no | Total |
|---|---|---|---|
| **A yes** | both | A only | A total |
| **A no** | B only | neither | not-A total |
| **Total** | B total | not-B total | Grand total |

Every row and column must sum correctly, which means **filling in three cells usually determines the rest**. This self-checking property is why the table beats a Venn diagram for two-set problems.

---

## 3. Worked Examples

### Example 1 — Two sets

*In a class of 40, 25 play cricket, 18 play football, and 5 play neither. How many play both?*

Play at least one = 40 - 5 = 35.

35 = 25 + 18 - both -> both = 43 - 35 = **8**.

### Example 2 — Using the 2x2 table

*Of 100 people, 60 own a car, 45 own a bike, and 20 own both. How many own neither?*

| | Bike yes | Bike no | Total |
|---|---|---|---|
| Car yes | 20 | 40 | 60 |
| Car no | 25 | **15** | 40 |
| Total | 45 | 55 | 100 |

**15 own neither.**

### Example 3 — Three sets

*In a survey of 100 students: 50 like tea, 40 like coffee, 30 like juice; 15 like tea and coffee, 10 like coffee and juice, 12 like tea and juice, and 5 like all three. How many like at least one?*

50 + 40 + 30 - 15 - 10 - 12 + 5 = **88**.

So 12 like none.

---

## 4. GRE Traps

- **Forgetting to subtract the overlap.** Adding 25 + 18 gives 43 in a class of 40 — an impossible result that should immediately signal the error.
- **"A only" read as "A".** The 25 cricket players include the 8 who also play football; cricket-only is 17.
- **Forgetting the "neither" category.** It is part of the total but not part of "A or B".
- **Sign error in the three-set formula.** Pairs subtract, the triple adds back.
- **Double-subtracting the triple overlap.** It is inside each of the three pairwise counts.
- **Percentages that must be applied to a common base.** Set the total to 100 to avoid this.
- **Assuming the two categories are exhaustive.** They rarely are.

---

## 5. Speed Tricks

- **Use the 2x2 table for two sets.** It builds in an arithmetic check on every row and column.
- **Fill in the overlap first**, then work outward — every other cell follows by subtraction.
- **Set the total to 100 for percentage problems.**
- **For three sets, draw the Venn diagram and fill from the centre outward:** all three first, then the pairs (minus the centre), then the singles.
- **Sanity check:** no region can be negative, and the parts must sum to the total.
- **"At least one" = total - neither.** Often the fastest route in.

---

## 6. Self-Check

**Q1.** In a group of 50, 30 like tea, 25 like coffee, and 10 like both. How many like neither?

**Q2.** Of 80 students, 45 study French, 35 study German, and 12 study neither. How many study both?

**Q3.** In a class, 20 students play only chess, 15 play only carrom, 8 play both, and 7 play neither. How many students are there?

<details>
<summary>Answers</summary>

**A1.** At least one = 30 + 25 - 10 = 45. Neither = 50 - 45 = **5**.

**A2.** At least one = 80 - 12 = 68. Both = 45 + 35 - 68 = **12**.

**A3.** 20 + 15 + 8 + 7 = **50**.

</details>

---

## 7. One-Line Summary for the Board

> Total = A + B - both + neither. Build the 2x2 table; every row and column must add up.
