# Rates & Unit Conversions

**Section:** Arithmetic  |  **Bank code:** ARI-RAE  |  **GRE frequency:** High

---

## 1. Core Idea

A rate is a ratio with units attached: km per hour, dollars per kg, jobs per day. Two ideas cover almost every rate question:

1. **Rate x Time = Amount** (distance, work done, cost, volume filled)
2. **Rates that act together add; rates that oppose subtract.**

Unit conversion is just multiplying by a clever form of 1, e.g. `(1 km / 1000 m)`.

---

## 2. Must-Know Rules

| Concept | Formula |
|---|---|
| Distance | Speed x Time |
| Work done | Rate x Time |
| Combined rate (working together) | R1 + R2 |
| Opposing rates (drain vs fill) | R1 - R2 |
| Average speed | Total distance / Total time |
| Equal distances at speeds a and b | Average speed = 2ab/(a+b) |
| Unit conversion | multiply by (desired unit / given unit) = 1 |
| Relative speed (same direction) | difference of speeds |
| Relative speed (opposite directions) | sum of speeds |

**Average speed is never the average of the speeds** unless the *times* are equal.

- Equal **distances**: use the harmonic mean 2ab/(a+b).
- Equal **times**: the plain average (a+b)/2 is correct.

**Common conversions the GRE may need:**

- 1 hour = 3600 seconds; 1 km = 1000 m
- To convert km/h to m/s, multiply by 5/18. To go the other way, multiply by 18/5.
- 1 mile is about 1.6 km; 1 kg is about 2.2 pounds (the GRE will normally supply any non-metric factor).

---

## 3. Worked Examples

### Example 1 — Average speed with equal distances

*A car travels from A to B at 60 km/h and returns along the same road at 40 km/h. What is the average speed for the whole trip?*

Distances are equal, so use the harmonic mean:

2(60)(40)/(60 + 40) = 4800/100 = **48 km/h**.

Sanity check: it must be closer to the slower speed, because more time is spent going slowly. 48 < 50. Correct.

### Example 2 — Combined work

*Pipe A fills a tank in 6 hours; pipe B fills it in 12 hours. Working together, how long do they take?*

Rate of A = 1/6 tank per hour. Rate of B = 1/12.

Combined = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4 tank per hour.

Time = 1 / (1/4) = **4 hours**.

### Example 3 — Fill and drain

*Pipe A fills a tank in 5 hours. A leak empties a full tank in 20 hours. With the leak open, how long does filling take?*

Net rate = 1/5 - 1/20 = 4/20 - 1/20 = 3/20 tank per hour.

Time = 20/3 = **6 hours 40 minutes**.

---

## 4. GRE Traps

- **Averaging the speeds.** In Example 1, 50 km/h is the trap answer and it is wrong.
- **Not converting units first.** If speed is in km/h and time is in minutes, convert before multiplying.
- **Adding times instead of rates.** Two people who each take 6 hours do not together take 12 hours (or 3 hours by "averaging") — add their *rates*.
- **Forgetting the leak subtracts.** Combined rate is a sum only if both agents push in the same direction.
- **Assuming "twice as fast" halves the time correctly but "50% faster" does too.** 50% faster means rate x 1.5, so time x 2/3, not time x 0.5.
- **Rounding mid-problem.** Keep fractions until the end; 20/3 hours is exact, 6.67 hours invites error.

---

## 5. Speed Tricks

- **Use the LCM as the total work.** For two workers taking 6 and 12 hours, set the job = 12 units. A does 2 units/hour, B does 1 unit/hour, together 3 units/hour, so 12/3 = 4 hours. No fractions at all.
- **Chain the units.** Write conversions as a product of fractions and cancel units diagonally; if the leftover units are right, the arithmetic is right.
- **km/h to m/s: x5/18.** Memorise it; it appears often.
- **For "meets in the middle" problems, add the speeds** and divide the gap by that sum.
- **Estimate the answer's direction first** — should it be closer to the faster or slower value? This catches trap answers instantly.

---

## 6. Self-Check

**Q1.** A cyclist covers 30 km at 15 km/h and the next 30 km at 10 km/h. What is the average speed?

**Q2.** Convert 72 km/h to metres per second.

**Q3.** X can paint a room in 4 hours, Y in 6 hours. How long together?

<details>
<summary>Answers</summary>

**A1.** Equal distances: 2(15)(10)/25 = 300/25 = **12 km/h**.

**A2.** 72 x 5/18 = **20 m/s**.

**A3.** LCM method: job = 12 units. X does 3/hour, Y does 2/hour, together 5/hour. Time = 12/5 = **2.4 hours** (2 h 24 min).

</details>

---

## 7. One-Line Summary for the Board

> Add rates, never times. Average speed = total distance over total time — always.
