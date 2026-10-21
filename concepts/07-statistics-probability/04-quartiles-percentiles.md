# Quartiles, IQR & Percentiles

**Section:** Statistics & Probability  |  **Bank code:** STA-IQR  |  **GRE frequency:** Medium

---

## 1. Core Idea

Quartiles and percentiles describe **position within sorted data**, not the values themselves.

- **Percentile:** the pth percentile is the value below which p% of the data falls.
- **Quartiles:** the three values that split sorted data into four equal-sized parts.

The mental model: line everyone up shortest to tallest, then ask "where in the line does this person stand?"

---

## 2. Must-Know Rules

| Term | Meaning |
|---|---|
| Q1 (first quartile) | 25th percentile — median of the lower half |
| Q2 (second quartile) | 50th percentile — the median |
| Q3 (third quartile) | 75th percentile — median of the upper half |
| IQR (interquartile range) | Q3 - Q1 |
| Range | max - min |

**Each quartile section holds 25% of the data.** Between Q1 and Q3 lies the middle 50%.

**Boxplot (box-and-whisker) anatomy:** the box runs from Q1 to Q3 with a line at the median; the whiskers extend to the minimum and maximum.

**Computing quartiles by hand:**

1. Sort the data.
2. Find the median (Q2).
3. Q1 = median of the values **below** Q2; Q3 = median of the values **above** Q2.

*Example:* 2, 4, 5, 7, 8, 10, 12, 15.

Median = (7 + 8)/2 = 7.5. Lower half: 2, 4, 5, 7 -> Q1 = 4.5. Upper half: 8, 10, 12, 15 -> Q3 = 11.

IQR = 11 - 4.5 = 6.5.

**Percentile interpretation.** Scoring in the 80th percentile means you scored **higher than 80% of test takers** — it does not mean you got 80% of the questions right. This distinction matters for GRE students reading their own score reports.

**Outlier rule (occasionally tested):** a value is an outlier if it lies more than 1.5 x IQR below Q1 or above Q3.

---

## 3. Worked Examples

### Example 1 — Quartiles and IQR

*Find Q1, Q3 and the IQR of: 3, 7, 8, 12, 13, 14, 18, 21, 22.*

Nine values sorted. Median (5th) = 13.

Lower half: 3, 7, 8, 12 -> Q1 = (7 + 8)/2 = 7.5.

Upper half: 14, 18, 21, 22 -> Q3 = (18 + 21)/2 = 19.5.

IQR = 19.5 - 7.5 = **12**.

### Example 2 — Percentile meaning

*In a group of 400 test takers, Priya scored at the 85th percentile. Roughly how many people scored below her?*

85% of 400 = **340 people**.

### Example 3 — What the IQR tells you

*Two data sets have the same range but set A has a much smaller IQR. What does that suggest?*

Set A's middle 50% is tightly clustered, with its spread coming mainly from a few extreme values. Set B's values are more evenly distributed across the range.

---

## 4. GRE Traps

- **Percentile read as percentage score.** The 90th percentile is a rank, not a mark.
- **Assuming quartiles are evenly spaced numerically.** Each quartile holds 25% of the *data points*, not 25% of the numeric range.
- **Forgetting to sort** before finding quartiles.
- **Including the median in both halves.** With an odd count, exclude the median when finding Q1 and Q3.
- **IQR calculated as Q3 + Q1.** It is the difference.
- **Assuming the 50th percentile is the mean.** It is the median.
- **Assuming a boxplot's box shows half the range.** It shows the middle half of the *data*.

---

## 5. Speed Tricks

- **Sort first, then count positions.** Quartile questions are counting exercises, not arithmetic.
- **Q1 and Q3 are just medians of the halves** — same procedure, applied twice.
- **Percentile to count: multiply the percentile by the total.**
- **A long whisker with a short box means skew** — useful for interpretation questions.
- **The IQR ignores outliers by design**, which is exactly why it is used alongside the range.

---

## 6. Self-Check

**Q1.** Find the IQR of 5, 9, 11, 14, 20, 25, 30, 33.

**Q2.** Manav is at the 60th percentile among 250 students. About how many scored below him?

**Q3.** Which is unaffected by an extreme outlier: the range or the IQR?

<details>
<summary>Answers</summary>

**A1.** Median = (14+20)/2 = 17. Lower half 5, 9, 11, 14 -> Q1 = 10. Upper half 20, 25, 30, 33 -> Q3 = 27.5. IQR = **17.5**.

**A2.** 0.60 x 250 = **150 students**.

**A3.** The **IQR** — the range depends directly on the extremes.

</details>

---

## 7. One-Line Summary for the Board

> Percentile is a rank, not a score. Quartiles split the sorted data into four equal counts. IQR = Q3 - Q1.
