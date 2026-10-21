# Weighted Average

**Section:** Statistics & Probability  |  **Bank code:** STA-WAV  |  **GRE frequency:** High

---

## 1. Core Idea

When groups have different sizes, you **cannot** average their averages. Each group's average must be weighted by how many members it has.

`Weighted average = (sum of all values) / (total count) = (n1 x a1 + n2 x a2) / (n1 + n2)`

The intuition worth teaching: the combined average is always **pulled toward the larger group**.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Weighted average of two groups | (n1 a1 + n2 a2)/(n1 + n2) |
| With weights as fractions/percents | w1 a1 + w2 a2, where w1 + w2 = 1 |
| Group sum | count x average |
| Alligation (finding the ratio) | n1 : n2 = (a2 - m) : (m - a1) |

**Alligation — the fast method.** If two groups with averages a1 and a2 combine to give m, then:

`n1 : n2 = (a2 - m) : (m - a1)`

The ratio of the counts is the **inverse** of the distances from the combined mean.

*Example:* averages 60 and 90 combine to 70. Distances: 90 - 70 = 20 and 70 - 60 = 10. So n1 : n2 = 20 : 10 = **2 : 1** — twice as many in the 60 group, which is why the mean sits closer to 60.

**Sanity check:** the weighted average always lies **strictly between** the two group averages, closer to the group with more members.

---

## 3. Worked Examples

### Example 1 — Basic weighting

*Class A has 20 students averaging 75. Class B has 30 students averaging 85. What is the combined average?*

Total = 20(75) + 30(85) = 1500 + 2550 = 4050.

Count = 50.

Average = 4050/50 = **81**.

Note: not 80 (the plain average), because class B is larger and pulls the mean up.

### Example 2 — Finding the ratio (alligation)

*Two solutions with 20% and 50% concentration are mixed to give 30%. In what ratio?*

Distances: 50 - 30 = 20; 30 - 20 = 10.

Ratio (20% group : 50% group) = 20 : 10 = **2 : 1**.

### Example 3 — Finding a missing group average

*A company has 40 men averaging $50,000 and 60 women. The overall average is $52,000. What is the women's average?*

Total payroll = 100 x 52,000 = 5,200,000.

Men's total = 40 x 50,000 = 2,000,000.

Women's total = 3,200,000, over 60 people = **$53,333.33**.

---

## 4. GRE Traps

- **Averaging the averages.** In Example 1, 80 is the trap answer.
- **Weighting by the wrong quantity.** Weight by the number of items, not by the values.
- **Alligation ratio inverted.** The larger group is the one whose average is *closer* to the combined mean.
- **Percentages used as weights without normalising.** They must sum to 1 (or 100%).
- **Forgetting the answer must lie between the two averages.** If it doesn't, you've made an error.
- **Three or more groups** — the same formula extends, but every group must be included.

---

## 5. Speed Tricks

- **Convert averages to totals immediately.** Weighted-average problems are sum problems in disguise.
- **Use alligation when you need a ratio** rather than a value. It is a 10-second method.
- **Check the pull direction first.** If group B is larger and has the higher average, the answer must exceed the plain average — that alone often identifies the right choice.
- **Set the total count to 100** when the problem gives percentages.
- **For a two-group problem, the combined mean divides the gap in the inverse ratio of the group sizes.**

---

## 6. Self-Check

**Q1.** 10 items average 4 and 30 items average 8. What is the combined average?

**Q2.** In what ratio must groups averaging 40 and 70 be combined to average 60?

**Q3.** A student scores 80 on three tests and 92 on two tests. What is the overall average?

<details>
<summary>Answers</summary>

**A1.** (40 + 240)/40 = 280/40 = **7**.

**A2.** Distances: 70 - 60 = 10; 60 - 40 = 20. Ratio (40 group : 70 group) = 10 : 20 = **1 : 2**.

**A3.** (240 + 184)/5 = 424/5 = **84.8**.

</details>

---

## 7. One-Line Summary for the Board

> Never average averages. Weight by count. The result always sits closer to the bigger group.
