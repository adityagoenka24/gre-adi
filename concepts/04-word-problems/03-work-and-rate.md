# Work & Rate

**Section:** Word Problems  |  **Bank code:** WRD-WRK  |  **GRE frequency:** High

---

## 1. Core Idea

Work problems are rate problems where the "distance" is a job.

`Work done = Rate x Time`

The one rule that makes everything easy: **rates add, times do not.** If A takes 6 hours and B takes 3 hours, they do not together take 9 hours or 4.5 hours.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Individual rate | 1 job / time taken |
| Combined rate (together) | R_A + R_B |
| Opposing rate (leak, drain) | R_fill - R_drain |
| Time together (two workers) | (ab)/(a + b) hours, where a, b are individual times |
| Work done in time t | Rate x t |
| Remaining work | 1 - (work already done) |

**Two equally good methods:**

**Method 1 — Fractional rates.** A takes 6 h -> rate 1/6 job/hour. B takes 3 h -> 1/3. Together 1/6 + 1/3 = 1/2, so 2 hours.

**Method 2 — LCM units (usually faster).** Let the job = LCM(6, 3) = 6 units. A does 1 unit/h, B does 2 units/h, together 3 units/h. Time = 6/3 = 2 hours. **No fractions at all.**

Teach Method 2 for speed; teach Method 1 so students understand why it works.

**Man-days.** If 6 workers take 10 days, the job is 60 worker-days. Then 15 workers take 60/15 = 4 days. Worker-days is conserved (assuming equal efficiency).

---

## 3. Worked Examples

### Example 1 — Basic combination

*A can paint a house in 12 days, B in 18 days. How long together?*

LCM(12, 18) = 36 units of work.

A: 3 units/day. B: 2 units/day. Together: 5 units/day.

Time = 36/5 = **7.2 days**.

### Example 2 — Fill and drain

*Tap A fills a tank in 10 hours; tap B fills it in 15 hours; a drain empties it in 30 hours. All three are open. How long to fill?*

LCM(10, 15, 30) = 30 units.

A: 3 units/h. B: 2 units/h. Drain: -1 unit/h.

Net = 3 + 2 - 1 = 4 units/h.

Time = 30/4 = **7.5 hours**.

### Example 3 — Partial work

*A can do a job in 20 days. He works alone for 5 days, then B joins and they finish in 6 more days. How long would B take alone?*

Job = 20 units (A does 1 unit/day).

A works 5 days alone: 5 units done, 15 remaining.

In the next 6 days A contributes 6 units, so B contributes 15 - 6 = 9 units in 6 days -> B's rate = 1.5 units/day.

B alone: 20/1.5 = **13.33 days** (40/3 days).

---

## 4. GRE Traps

- **Averaging the times.** A takes 6 h, B takes 3 h, "so together 4.5 h" — wrong. It must be *less than the faster worker's time*, i.e. under 3 h.
- **Adding times.** Never.
- **Forgetting the drain is negative.** Subtract, don't add.
- **Assuming equal efficiency** when the problem says otherwise.
- **Sanity check ignored.** The combined time is always shorter than any individual time. If your answer isn't, you've made an error.
- **Worker-days used when efficiency differs.** 6 workers x 10 days = 60 worker-days assumes all workers are identical.
- **"Half the job" questions.** Compute the rate first, then apply it to 0.5 job.

---

## 5. Speed Tricks

- **Use LCM units.** It eliminates every fraction. This single technique is worth teaching before anything else in the topic.
- **Two-worker shortcut:** together they take `ab/(a+b)`. For 12 and 18: (12x18)/30 = 216/30 = 7.2. Instant.
- **Check the bound:** the answer must be between (faster time)/2 and (faster time).
- **For "how much of the job is done", multiply rate by time** and express as a fraction of 1.
- **Man-days is conserved:** workers x days = constant, so more workers means proportionally fewer days.

---

## 6. Self-Check

**Q1.** X takes 8 hours, Y takes 24 hours. How long together?

**Q2.** A pipe fills a tank in 6 hours; a leak drains it in 18 hours. With both open, how long to fill?

**Q3.** If 4 machines produce 200 units in 5 hours, how long do 10 machines take to produce 500 units?

<details>
<summary>Answers</summary>

**A1.** Job = 24 units; X does 3/h, Y does 1/h, together 4/h -> **6 hours**.

**A2.** Job = 18 units; fill 3/h, leak -1/h, net 2/h -> **9 hours**.

**A3.** 4 machines make 40 units/hour, so each makes 10 units/hour. 10 machines make 100 units/hour. 500/100 = **5 hours**.

</details>

---

## 7. One-Line Summary for the Board

> Rates add, times don't. Set the job to the LCM of the times and the fractions disappear.
