# Range & Standard Deviation

**Section:** Statistics & Probability  |  **Bank code:** STA-RSD  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

These are measures of **spread**, not of centre. They answer "how scattered is the data?"

- **Range** = largest - smallest. Simple, but determined entirely by two values.
- **Standard deviation (SD)** = the typical distance of a value from the mean. It uses every value.

**Good news for GRE students:** you almost never have to compute a standard deviation. You need to *compare* SDs and know how they respond to changes.

---

## 2. Must-Know Rules

| Concept | Rule |
|---|---|
| Range | max - min |
| SD | roughly, the average distance from the mean |
| SD >= 0 | always; SD = 0 only if all values are identical |
| Add k to every value | range and SD **unchanged** |
| Multiply every value by k | range and SD multiplied by \|k\| |
| More spread out | larger SD |
| Values clustered near the mean | smaller SD |

**Comparing standard deviations without computing.** Ask: *which set has values further from its own mean?*

- {10, 10, 10, 10} -> SD = 0
- {9, 10, 10, 11} -> small SD
- {2, 6, 14, 18} -> large SD

**The formula, for completeness:**

SD = sqrt[ (sum of (each value - mean)^2) / n ]

The GRE will not require you to evaluate this under time pressure, but seeing it explains why adding a constant changes nothing (every deviation is unchanged) and multiplying by k scales it (every deviation scales by k).

**Normal distribution rule (68-95-99.7):** in a normal distribution,

- about **68%** of values lie within 1 SD of the mean
- about **95%** within 2 SDs
- about **99.7%** within 3 SDs

---

## 3. Worked Examples

### Example 1 — Comparing spread

*Which set has the larger standard deviation: A = {4, 5, 6, 7, 8} or B = {1, 5, 6, 7, 11}?*

Both have mean 6.

- A's deviations: 2, 1, 0, 1, 2
- B's deviations: 5, 1, 0, 1, 5

B's values sit further from the mean, so **B has the larger SD**. No computation needed.

### Example 2 — Transformations

*A data set has mean 50 and SD 8. Each value is doubled and then increased by 10. Find the new mean and SD.*

Doubling: mean 100, SD 16.

Adding 10: mean 110, SD **still 16**.

**New mean 110, new SD 16.**

### Example 3 — The normal rule

*Scores are normally distributed with mean 500 and SD 100. Approximately what percent of scores lie between 400 and 600?*

400 and 600 are exactly 1 SD either side of the mean.

**About 68%.**

---

## 4. GRE Traps

- **Assuming adding a constant increases the SD.** It shifts everything equally; the spread is unchanged.
- **Assuming a bigger mean means a bigger SD.** They are independent.
- **Assuming a bigger range means a bigger SD.** Usually true, but not guaranteed — the range depends on only two values while the SD depends on all of them.
- **Computing the SD when a comparison would do.**
- **Negative SD.** Impossible; SD is always non-negative.
- **Applying the 68-95-99.7 rule to non-normal data.** It requires a normal distribution.
- **Multiplying by a negative.** SD scales by |k|, so it stays positive.

---

## 5. Speed Tricks

- **Compare, don't compute.** Look at how far the values sit from their mean.
- **Adding shifts, multiplying scales.** Two words cover every transformation question.
- **SD = 0 means all values are equal.** A frequent quantitative comparison shortcut.
- **The set with more values bunched near the middle has the smaller SD**, even if the extremes match.
- **For normal-distribution questions, sketch the bell curve** and mark the SD boundaries; the percentages read straight off.
- **Range is a two-number question** — find the max and min and stop.

---

## 6. Self-Check

**Q1.** What is the range of 14, 3, 22, 9, 17?

**Q2.** A set has SD 5. Every value is increased by 20. What is the new SD?

**Q3.** Which has the larger SD: {20, 20, 20} or {19, 20, 21}?

<details>
<summary>Answers</summary>

**A1.** 22 - 3 = **19**.

**A2.** **5** — adding a constant does not change the spread.

**A3.** The first has SD **0**; the second is larger. **{19, 20, 21} has the larger SD.**

</details>

---

## 7. One-Line Summary for the Board

> Adding shifts (SD unchanged); multiplying scales (SD times |k|). Compare spread by eye — don't compute.
