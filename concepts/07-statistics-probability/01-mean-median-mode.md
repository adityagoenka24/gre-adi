# Mean, Median & Mode

**Section:** Statistics & Probability  |  **Bank code:** STA-MMM  |  **GRE frequency:** Very High

---

## 1. Core Idea

Three different answers to "what is a typical value?":

- **Mean** — the arithmetic average. Sensitive to every value, including outliers.
- **Median** — the middle value when sorted. Immune to outliers.
- **Mode** — the most frequent value. A set can have none, one, or several.

The GRE's favourite question is not "compute these" but "**what happens to each when the data changes?**"

---

## 2. Must-Know Rules

| Measure | Definition |
|---|---|
| Mean | sum of values / number of values |
| Sum | mean x count (rearranged — the most useful form) |
| Median (odd n) | the middle value after sorting |
| Median (even n) | the average of the two middle values |
| Mode | the most frequently occurring value |
| Range | largest - smallest |

**Sort before finding the median.** Always. The single most common careless error in this topic.

**Effect of adding a constant k to every value:**

| Measure | Effect |
|---|---|
| Mean | increases by k |
| Median | increases by k |
| Mode | increases by k |
| Range | **unchanged** |
| Standard deviation | **unchanged** |

**Effect of multiplying every value by k:**

| Measure | Effect |
|---|---|
| Mean, median, mode | multiplied by k |
| Range, standard deviation | multiplied by \|k\| |

**Mean vs median and skew:**

- Symmetric data: mean = median.
- Skewed right (a few very large values): mean > median.
- Skewed left (a few very small values): mean < median.

**Evenly spaced sets:** mean = median = (first + last)/2. This shortcut appears constantly.

---

## 3. Worked Examples

### Example 1 — Using sum = mean x count

*The average of 6 numbers is 15. When a seventh number is added, the average becomes 17. What is the seventh number?*

Original sum = 6 x 15 = 90.

New sum = 7 x 17 = 119.

Seventh number = 119 - 90 = **29**.

### Example 2 — Median with an even count

*Find the median of 12, 3, 19, 7, 15, 8.*

Sort: 3, 7, 8, 12, 15, 19.

Two middle values are 8 and 12.

Median = (8 + 12)/2 = **10**.

### Example 3 — Mean vs median under an outlier

*A set is 4, 5, 6, 7, 8. What happens to the mean and median if 8 is replaced by 88?*

Original: mean 6, median 6.

New set 4, 5, 6, 7, 88: mean = 110/5 = 22, median still **6**.

**The mean jumps to 22; the median is unchanged.** This is exactly why the median is used for house prices and salaries.

---

## 4. GRE Traps

- **Finding the median without sorting.**
- **Assuming the median is a member of the set.** For an even count it usually is not.
- **Assuming a unique mode.** A set can be bimodal, or have no mode at all if every value appears once.
- **Assuming the mean is a member of the set.** It rarely is.
- **Adding a constant changes the range.** It does not.
- **Confusing "average of the averages" with the overall average.** That only works when the groups are the same size — otherwise you need a weighted average.
- **Mean = median implies symmetry.** It is suggestive but not a proof.

---

## 5. Speed Tricks

- **Sum = mean x count.** Almost every "average" word problem is solved by converting averages into sums.
- **For evenly spaced sets, mean = median = (first + last)/2.** No addition needed.
- **Deviation shortcut:** to average numbers near 200, average their differences from 200 and add 200 back.
- **To find a missing value, work with sums**, not averages.
- **On "which changes" questions, test with a tiny concrete set** (three or five numbers) rather than reasoning abstractly.
- **The median only cares about position** — changing an extreme value usually leaves it alone.

---

## 6. Self-Check

**Q1.** The average of 5 numbers is 24. If one number is removed and the average becomes 26, what was removed?

**Q2.** Find the median of 2, 9, 4, 4, 11, 7, 4.

**Q3.** Every value in a data set is increased by 10. What happens to the range?

<details>
<summary>Answers</summary>

**A1.** Original sum 120; new sum = 4 x 26 = 104. Removed = **16**.

**A2.** Sorted: 2, 4, 4, 4, 7, 9, 11. Middle (4th) value = **4**.

**A3.** **Unchanged** — adding a constant shifts everything equally.

</details>

---

## 7. One-Line Summary for the Board

> Sum = mean x count. Sort before you take the median. Outliers move the mean, not the median.
