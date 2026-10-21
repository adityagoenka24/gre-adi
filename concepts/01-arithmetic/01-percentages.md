# Percentages — Full Lecture

**Section:** Arithmetic · **Bank code:** ARI-PCT · **GRE frequency:** Very High · **Class length:** ~75 min

> **Thesis of the whole lesson:** every percent question is really the question *per cent of **what***? Errors in this topic are almost never arithmetic — they are always about choosing the wrong base.

---

## How to use this capsule

Read straight through, it is a lecture script with timings. Sections are numbered in teaching order, and each opens with a time budget.

Three kinds of block appear throughout:

- **Teaching note** — what to say, what to ask, where to pause. Written for the teacher, but students self-studying should read them too: they name the mistake before you make it.
- **Board** — the one line worth writing on the whiteboard.
- **Answers** are hidden inside collapsible blocks so you can attempt first.

**Running time:** hook 3 · foundation 11 · multiplier 17 · worked examples 20 · practice 5 · traps & tricks 11 · challenge 15 · close 5.

---

## 0. The Hook — why this topic first *(3 min)*

Percentages are not one topic. They are the plumbing running underneath half of GRE Quant, so an error here does not cost you one question — it leaks into several.

| Where percentages resurface | How |
|---|---|
| Word problems | Profit & loss, interest, discount, mixtures are all percent engines |
| Data Interpretation | Every DI set asks for percent of total or percent change |
| Statistics | Weighted averages and percentiles are percent questions in disguise |

> **Teaching note.** Open by asking the room two questions. *"How many of you think percentages are easy?"* — most hands go up. *"How many of you have got a percent question wrong on a mock?"* — most hands stay up. That gap is the entire class. Then promise them one tool, the multiplier, that closes most of it.

> **Board.** Every percent question is really: *per cent of **what**?*

---

## 1. Core Idea — percent means "per hundred" *(6 min)*

The word is literally *per cent* — per hundred. A percent is a fraction whose denominator has already been fixed at 100.

```
x% = x/100
```

Picture a 10 × 10 grid of 100 squares. Shade 35 of them and 35% is shaded. Nothing more mysterious than that.

**Why it matters.** A denominator of 100 is a *choice of base*. Change what the 100 refers to and the same percent means something completely different.

> **Teaching note.** Draw the grid and physically shade squares — it sticks. Then ask: *"If I shade 35 squares out of 100, what percent is shaded?"* (35% — easy.) Immediately follow with: *"And if I shade 35 squares out of 200?"* (17.5%.) That second question is the whole lesson in one move: same 35, different base, different answer. Do not move on until the room feels the difference.

---

## 2. Diagnose First — the four question types *(5 min)*

Before writing anything, decide which of these four you are looking at. Students who classify first almost never pick the wrong base.

| # | Type | Sounds like | Method |
|---|---|---|---|
| 1 | Find the **part** | What is 15% of 80? | multiply: 0.15 × 80 |
| 2 | Find the **whole** | 12 is 15% of what? | divide: 12 ÷ 0.15 |
| 3 | Find the **percent** | 12 is what percent of 80? | divide, then ×100: (12/80) × 100 |
| 4 | Find the **change** | 80 → 92, what percent change? | (New − Old)/Old × 100 |

Types 1–3 are a single calculation. **Type 4 hides the trap**, because it is the only one where you must decide which number goes on the bottom.

> **Teaching note.** Run a 30-second drill: call out questions in random order and have the class shout the *type number*, not the answer. *"A shirt costs $40 after a 20% discount, what was the original?"* → Type 2. *"Sales went from 200 to 260"* → Type 4. *"What is 30% of 90?"* → Type 1. Classification is the skill being trained here, not arithmetic.

---

## 3. Conversions — one number, three costumes *(6 min)*

Fraction, decimal and percent are the same value dressed differently.

```
3/4  =  0.75  =  75%          1/8  =  0.125  =  12.5%
```

| Direction | How | Example |
|---|---|---|
| Fraction → Decimal | divide | 3 ÷ 4 = 0.75 |
| Decimal → Percent | × 100 | 0.75 → 75% |
| Percent → Fraction | put over 100, reduce | 75/100 = 3/4 |

**Rule of thumb: stay in fractions while you compute, and convert to a percent only at the very end.** Rounding 1/3 to 0.33 early will eventually cost a question.

### The nine to know cold

| | | |
|---|---|---|
| 1/8 = 12.5% | 1/6 = 16⅔% | 1/5 = 20% |
| 1/4 = 25% | 1/3 = 33⅓% | 3/8 = 37.5% |
| 5/8 = 62.5% | 2/3 = 66⅔% | 3/4 = 75% |

> **Teaching note.** Drill both directions for two minutes. Call *"three-eighths"* → class shouts *"37.5"*. Call *"62.5 percent"* → class shouts *"five-eighths"*. The thirds and sixths matter most — they are the ones that turn up in DI answer choices, where dividing by 3 beats multiplying by 0.333.

---

## 4. The Multiplier Method — the core tool *(10 min)*

Instead of computing a change and then adding it on, convert the percent into a **single number you multiply by**. The addition step — where the errors live — disappears.

| Percent change | Multiplier |
|---|---|
| up 20% | × 1.20 |
| down 20% | × 0.80 |
| up 5% | × 1.05 |
| down 5% | × 0.95 |
| up 150% | × 2.50 |
| down 60% | × 0.40 |

```
up x%    ->  × (1 + x/100)
down x%  ->  × (1 - x/100)
```

**Successive changes multiply. They never add.**

```
100  --×1.25-->  125  --×0.80-->  100
```

| What students do | What actually happens |
|---|---|
| +25% − 20% = +5% | 1.25 × 0.80 = 1.00, i.e. **no change at all** |

**The payoff:** reversing a change means **dividing** by the multiplier, never subtracting the same percent back. That one habit solves every "find the original price" question.

> **Teaching note.** This is the highest-value slide of the lesson — slow down. Walk the chain on the board: 100 → 125 → 100. Then ask *why* the 20% fall exactly wipes out the 25% rise: because 20% of 125 is 25, and 25% of 100 is also 25. Same absolute amount, different bases. Fire a rapid round afterwards: *"up 35%?"* → 1.35. *"down 12%?"* → 0.88. *"up 200%?"* → 3.00 — that last one catches people, because a 200% increase **triples** the value.

> **Board.** Turn every percent into a multiplier, then multiply.

---

## 5. Percent Change and the Base Rule *(7 min)*

```
Percent change = (New − Old) / Old × 100
```

Going from 50 to 60:

```
(60 − 50)/50 × 100 = 10/50 × 100 = 20% increase
```

**Divide by 50 — the OLD value. Not by 60.** Dividing by 60 gives 16.7%, which is a real GRE answer choice, placed there precisely to catch this.

### The asymmetry that follows

Because the base changes, a fall and its recovery are never the same percent:

| Fall | Rise needed to recover |
|---|---|
| 20% | 25% |
| 25% | 33⅓% |
| 50% | 100% |

> **Teaching note.** Ask directly: *"A stock falls 20%. How much must it rise to get back to where it started?"* Someone will say 20%. Let the wrong answer sit in the air for a beat, then work it: 100 → 80, and 20/80 = 25%. This is the moment the base rule becomes real. Do not rush the silence.

> **Board.** Percent change always divides by the ORIGINAL.

---

## 6. Worked Examples *(20 min)*

Work each one on the board. State the method out loud *before* touching arithmetic.

### Example 1 — successive changes *(Type 4)*

*A stock rises 25% in January, then falls 20% in February. What is the net percent change?*

**Step 1 — convert to multipliers.** +25% → ×1.25 and −20% → ×0.80.

**Step 2 — multiply.** 1.25 × 0.80 = 1.00

**Step 3 — read it back.** A net multiplier of 1.00 means **no change: 0%.**

> **Teaching note.** Before revealing step 2, take a show of hands on +5%, 0%, and "something else". +5% will dominate — write the tally on the board, then disprove it. Correcting a prediction the class committed to out loud is far stickier than correcting one they never made.

**The insight worth keeping:** a rise of 1/n followed by a fall of 1/(n+1) always cancels exactly.

| Pair | As fractions |
|---|---|
| up 25%, down 20% | 5/4 × 4/5 = 1 |
| up 50%, down 33⅓% | 3/2 × 2/3 = 1 |
| up 100%, down 50% | 2/1 × 1/2 = 1 |
| up 20%, down 16⅔% | 6/5 × 5/6 = 1 |

Writing them as fractions makes the cancellation visible in a way that 1.25 and 0.80 never will. This is the strongest argument in the whole topic for staying in fractions.

---

### Example 2 — reverse percent *(Type 2)*

*After a 15% discount, a jacket costs $170. What was the original price?*

**Step 1 — write the relationship.** New = Original × 0.85

**Step 2 — reverse it by dividing.**

```
Original = 170 / 0.85 = 17000 / 85 = $200
```

**Check backwards:** 15% of 200 = 30, and 200 − 30 = 170. ✓

**The trap answer is $144.50** — taking 15% off $170. Wrong base: the discount was applied to the *original*, not to the sale price.

> **Teaching note.** Ask for the wrong approach *first*, before you solve it. Someone will offer "take 15% off 170". Compute it (144.50), write it up, and then ask what is wrong with it. Naming the temptation is what stops it recurring.

---

### Example 3 — "more than" vs "less than" *(Type 3)*

*If A is 40% more than B, then B is what percent less than A?*

**Step 1 — pick a smart number.** Let B = 100, so A = 100 × 1.40 = 140.

**Step 2 — spot the base switch.** The gap is 40 either way. But *"B is what percent less than **A**"* means the base is now A = 140.

```
40/140 × 100 = 28.57%
```

So A is 40% more than B, while B is only about **28.6% less than A**. Same gap, different denominators.

**Language decoder — worth copying to the board and leaving up:**

| Phrase | Means |
|---|---|
| "40% more than B" | 1.40 × B |
| "40% of B" | 0.40 × B |
| "40% less than B" | 0.60 × B |

> **Teaching note.** Before computing, ask the class to predict whether the answer will be more or less than 40%. It must be less, because the base got bigger. Prediction first, arithmetic second — that habit alone kills most trap answers. Note also that "more than" and "of" differ by a factor of three and a half here; students who skim the preposition lose the question before they start.

---

### Example 4 — the pair that looks like it cancels

*A price rises 30%, then falls 30%. What is the net change?*

```
1.30 × 0.70 = 0.91  ->  a net LOSS of 9%
```

Why not 0%? The 30% rise is taken on 100; the 30% fall is taken on 130 — a bigger base, so the fall is bigger in absolute terms.

**Shortcut:** up x% then down x% always loses, and the loss is exactly **x²/100 percent**. Here 900/100 = 9%.

> **Teaching note.** Put this directly against Example 1. There, +25/−20 cancelled. Here, +30/−30 does not. Students assume matching percents cancel — they never do. Test the shortcut live: up 10% then down 10% should lose 100/100 = 1%. Check: 1.1 × 0.9 = 0.99. ✓

---

### Example 5 — a percent of a percent

*In a class of 200 students, 60% are girls, and 25% of the girls play a sport. What percent of the whole class is that?*

**Step 1 — work outward one layer at a time.** Girls = 0.60 × 200 = 120.

**Step 2 — apply the second percent to the right base.** Sporty girls = 0.25 × 120 = 30.

```
30/200 = 15% of the class — not 25%, and not 85%
```

Or, with multipliers in one line: 0.60 × 0.25 = 0.15.

> **Teaching note.** The 25% was of the *girls*, not of the class. That is the entire question. Follow up: *"What percent of the class are girls who do NOT play a sport?"* → 0.60 × 0.75 = 45%.

---

### Example 6 — percent vs percentage points

*A country's unemployment rate rises from 5% to 7%. One newspaper reports "unemployment up 2%", another reports "up 40%". Who is right?*

| Reading | Calculation | Meaning |
|---|---|---|
| Percentage **points** | 7 − 5 = **2 points** | the arithmetic gap between two rates |
| Percent **change** | (7 − 5)/5 × 100 = **40%** | the relative change, base = old rate |

Both are right — they measure different things. **On the GRE, "percent increase" always means the relative change (40%).** "Percentage points" means the raw gap.

> **Teaching note.** This distinction is everywhere in Data Interpretation. Give a second case: market share going from 2% to 3% is one percentage point but a 50% increase. Headlines exploit the ambiguity deliberately; the GRE tests whether students notice it.

---

## 7. Practice Pause *(5 min)*

Three minutes on the clock, no calculator. **Classify each one first** — which of the four types is it?

1. A price is increased by 20% and then decreased by 25%. What is the net percent change?
2. 45 is what percent of 300?
3. A number is decreased by 40% to give 96. What was the number?

<details>
<summary>Answers</summary>

**1.** 1.20 × 0.75 = 0.90 → a **10% decrease**. *(Adding gives −5%, which is the trap.)*

**2.** 45/300 × 100 = **15%**. *(Type 3. The base is the number after "of".)*

**3.** N × 0.60 = 96, so N = 96/0.6 = **160**. *(Reverse percent — divide by the multiplier, do not add 40% back.)*

</details>

> **Teaching note.** Actually stay quiet for the three minutes and walk the room. Q1 catches anyone still adding percents; Q3 catches anyone adding 40% back (which gives 134.4). Before revealing answers, ask three different students for their **method**, not their number.

---

## 8. The Six Traps *(6 min)*

| # | Trap | ✗ Wrong | ✓ Right |
|---|---|---|---|
| 1 | New value used as the base | 50 → 60 is 10/60 = 16.7% | 50 → 60 is 10/50 = 20% |
| 2 | Adding successive percents | +30% then −30% = 0% | 1.30 × 0.70 = 0.91, a 9% loss |
| 3 | "More than" read as "of" | A is 40% more than B → A = 0.40B | A is 40% more than B → A = 1.40B |
| 4 | Percent vs percentage points | 5% → 7% is "a 2% increase" | 2 percentage points, but a 40% increase |
| 5 | Percent of a percent | 20% of 30% = 50% or 10% | 0.20 × 0.30 = 6% |
| 6 | Equal fall and rise assumed to cancel | down 20% then up 20% → back to start | 0.80 × 1.20 = 0.96, still 4% down |

> **Teaching note.** Do not just read these out. For each, ask *why the wrong side is tempting*. Trap 1 tempts because 60 is the number in front of you. Trap 2 because the percents match. Trap 3 because students skim prepositions under time pressure. Naming the temptation is what prevents the error. For trap 6, point out that order does not matter — 0.8 × 1.2 and 1.2 × 0.8 both give 0.96 — so a discount then a tax equals a tax then a discount. Students waste time recomputing this.

---

## 9. Speed Tricks and Habits *(5 min)*

**Tricks:**

- **Pick 100.** When the problem is all percents and no amounts, set the starting value to 100. Legal, and it turns algebra into arithmetic.
- **Split the percent.** 15% of 240 = 10% + 5% = 24 + 12 = 36.
- **Swap the terms.** x% of y = y% of x. So 8% of 25 = 25% of 8 = 2.
- **1% then scale.** 17% of 350: one percent is 3.5, so 3.5 × 17 = 59.5.
- **Percent as a fraction.** 12.5% = 1/8, so dividing by 8 beats multiplying by 0.125.

**Habits that separate 160 from 167:**

| Habit | Why |
|---|---|
| Predict before you compute | Decide whether the answer should be bigger or smaller than the start. Half of all trap answers fail this check instantly. |
| Read the answer spread first | Choices of 20/25/30 mean estimate. Choices of 24/25/26 mean compute exactly. |
| Write the multiplier chain, not the steps | One line — 1.40 × 0.80 × 0.90 — instead of three calculations with three chances to slip. |

> **Teaching note.** Demonstrate "pick 100" live on a question with no numbers in it: *"A price rises 20% then falls 10%. By what percent has it changed?"* Set it to 100 and it is a five-second question (1.2 × 0.9 = 1.08, so +8%). Prove the swap trick rather than asserting it: x% of y = xy/100 = y% of x.

---

## 10. Challenge Set — 165+ *(15 min)*

Four problems at the difficulty where marks are actually won. Give the class four minutes each before solving.

### Challenge 1 — markup with successive discounts

*A shopkeeper marks an item up by 40%, then offers two successive discounts of 20% and 10%. The final selling price is $1,512. Find the cost price, and state the profit or loss percent.*

> **Nudge:** three percent changes in a row. Build one chain, then reverse it.

<details>
<summary>Solution</summary>

**Step 1 — one chain.** SP = CP × 1.40 × 0.80 × 0.90

**Step 2 — collapse it.** 1.40 × 0.80 × 0.90 = **1.008**

**Step 3 — reverse by dividing.** CP = 1512 / 1.008 = **$1,500**

**Profit** = $12, so 12/1500 × 100 = **0.8% profit**.

The punchline: a 40% markup survived two discounts by only 0.8%.

</details>

> **Teaching note.** Most students compute the marked price first and get lost in intermediate numbers. Steer them to write the whole chain before substituting anything. Watch for anyone adding the discounts to 30% — that builds the wrong chain. Afterwards ask: what single discount equals 20% then 10%? 1 − 0.72 = **28%**, not 30%.

---

### Challenge 2 — weighted percent across two groups

*In a town, 60% of the population are adults. 45% of the adults and 20% of the non-adults own a smartphone. If 3,500 people own a smartphone, what is the town's population?*

> **Nudge:** two groups, two rates. Express both owner counts in terms of one unknown.

<details>
<summary>Solution</summary>

Let the population be P.

- Adults = 0.60P, of whom 45% own one → 0.45 × 0.60P = **0.27P**
- Non-adults = 0.40P, of whom 20% own one → 0.20 × 0.40P = **0.08P**

Total owners = 0.27P + 0.08P = **0.35P**

```
0.35P = 3500  ->  P = 10,000
```

Adults 6,000 and non-adults 4,000. **Check:** 45% of 6,000 = 2,700 and 20% of 4,000 = 800, summing to 3,500. ✓

</details>

> **Teaching note.** Warn them off the classic error before they start: averaging 45% and 20% to 32.5%, which would give P ≈ 10,769. That is only valid if the two groups are the same size, and they are 60/40. Always close a weighted problem by checking the parts sum back to the given total. Extension: what percent of owners are adults? 2700/3500 = 77.1%.

---

### Challenge 3 — solving for an unknown percent

*A number is increased by 25%. The result is then decreased by y%. The final value is 10% less than the original. Find y.*

> **Nudge:** you know the first multiplier and the overall multiplier. Solve for the middle one.

<details>
<summary>Solution</summary>

```
1.25 × (1 − y/100) = 0.90
     (1 − y/100) = 0.90 / 1.25 = 0.72
            y/100 = 0.28
                y = 28%
```

**Check:** 100 → 125 → 125 × 0.72 = 90, which is 10% below 100. ✓

</details>

> **Teaching note.** Students guess 15% or 35% here. The lesson: when multipliers chain, the individual percents have no simple additive relationship. Show the "pick 100" route as well — start at 100, go to 125, and ask what takes 125 down to 90 — so the students who fear algebra can see both paths land in the same place.

---

### Challenge 4 — compound effect on a product

*A shop's revenue is price × quantity. Next quarter the price rises 20% while the quantity sold falls 15%. What is the percent change in revenue?*

> **Nudge:** revenue is a product, so its multiplier is the product of the two multipliers.

<details>
<summary>Solution</summary>

```
1.20 × 0.85 = 1.02  ->  revenue rises 2%
```

</details>

> **Teaching note.** Say this out loud: a bigger percent rise paired with a smaller percent fall does **not** guarantee a gain — 20% up and 20% down still loses. It is the multipliers that decide, never the percents. Extension for a strong class: what quantity fall exactly cancels a 20% price rise? 1.20 × m = 1 → m = 0.8333, a **16⅔% fall** — the 1/n and 1/(n+1) rule from Example 1 returning.

---

## 11. Exit Ticket *(3 min)*

No calculator, no paper working — these should be mental by now.

1. What is 15% of 240?
2. A value rises from 80 to 92. Percent increase?
3. Two successive 10% discounts equal a single discount of what percent?
4. If A is 25% more than B, then B is what percent less than A?

<details>
<summary>Answers</summary>

**1.** 0.15 × 240 = **36** *(split it: 24 + 12)*

**2.** 12/80 × 100 = **15%** *(base is 80, the old value)*

**3.** 1 − (0.9)(0.9) = 0.19 → **19%** *(not 20% — the second discount is on a smaller price)*

**4.** 25/125 × 100 = **20%** *(base flips from B to A)*

</details>

> **Teaching note.** Have them write answers on a slip and hand it in on the way out — it tells you in thirty seconds who needs Percentages again before you move to Fractions & Decimals. Q1 and Q2 should be universal; **Q3 and Q4 are the diagnostic ones**. If someone says 20% on Q3, walk it on the board: 100 → 90 → 81.

---

## 12. Close *(2 min)*

### Three sentences to take away

1. **Turn every percent into a multiplier, then multiply.** It replaces four formulas and removes the addition step where errors live.
2. **Percent change always divides by the ORIGINAL value.** If you are dividing by the new number, you have already lost the question.
3. **Matching percents never cancel.** Up x% then down x% always loses — exactly x²/100 percent.

### Homework

- Re-read sections 4 and 5 of this capsule.
- Attempt 20 questions from the **ARI-PCT** bank set.
- Flag any question where you could not name the base. That flag — not whether the answer was right — is the real diagnostic.

### Next class

**Arithmetic 02 — Fractions & Decimals**, which builds directly on the "stay in fractions" habit from section 3.
