# Mixture Problems — Full Lecture

**Section:** Word Problems · **Bank code:** WRD-MIX · **GRE frequency:** Medium-High · **Class length:** ~60 min

> **Thesis of the whole lesson:** **track the pure component, never the mixture.** Percentages move around confusingly; litres of acid do not. Write down the amount of the pure thing first, and every mixture question becomes a one-line equation.

---

## How to use this capsule

Read straight through, it is a lecture script with timings. Sections are numbered in teaching order, and each opens with a time budget.

Three kinds of block appear throughout:

- **Teaching note** — what to say, what to ask, where to pause. Written for the teacher, but students self-studying should read them too: they name the mistake before you make it.
- **Board** — the one line worth writing on the whiteboard.
- **Answers** are hidden inside collapsible blocks so you can attempt first.

**Running time:** hook 3 · core & diagnosis 7 · machinery 9 · worked examples 15 · practice 4 · traps & tricks 8 · challenge 10 · close 4.

---

## 0. The Hook — why this topic matters *(3 min)*

Mixtures look like a chemistry topic. They are actually the **weighted average** topic, and that makes them worth more than their question count suggests.

| Where the mixture structure resurfaces | The "concentration" | The "volume" |
|---|---|---|
| Statistics — weighted mean | the group's average | the group's size |
| Percentage word problems | the rate within a subgroup | the subgroup size |
| Profit, Loss & Discount | the profit rate on a batch | the batch cost |
| Ratio word problems | parts per unit | number of units |
| Data Interpretation | percentage within a category | category total |

Alligation — the ten-second method you will learn in section 4 — works in every one of those settings, not just with liquids.

> **Teaching note.** Open with a deliberately trivial-sounding question that half the room gets wrong. *"I mix 10 litres of a 60% solution with 30 litres of a 20% solution. What is the concentration?"* Take a show of hands on 40% (the plain average). It will be popular. Do not correct it yet — just write "40%?" on the board and say you will come back to it. The answer is 30%, and the reason is that the weak solution outweighs the strong one three to one.

> **Board.** Concentration × volume = the amount of the pure thing. Write that number first, every time.

---

## 1. Core Idea — the pure component is the invariant *(4 min)*

If you have 40 litres of a 25% acid solution, the useful fact is not "25%". It is:

```
0.25 x 40 = 10 litres of pure acid
```

Now watch what different operations do to that 10:

| Operation | Pure acid | Total volume |
|---|---|---|
| Add pure **water** | unchanged (10) | increases |
| Add pure **acid** | increases | increases by the same amount |
| Add another **solution** | increases by that solution's acid | increases by that solution's volume |
| Remove some **mixture** | falls in proportion | falls |
| Evaporate water | unchanged | falls |

Every mixture question is one of those five rows, or a sequence of them. Once you know which row you are on, the equation is immediate — and in three of the five rows one of the two columns does not move at all, which is what makes the problem solvable.

> **Teaching note.** Draw a beaker on the board with a shaded band at the bottom labelled "10 L acid" and clear liquid above it labelled "30 L water". Then physically add water above the band: the shaded band does not move. Then add acid: the band grows. That picture, once drawn, is worth more than the whole formula table. Ask before each operation: *"Does the shaded band change?"*

---

## 2. Diagnose First — the five question types *(3 min)*

| # | Type | Sounds like | Method |
|---|---|---|---|
| 1 | **Combine two solutions** | "30 L of 15% is mixed with 20 L of 40%" | c1V1 + c2V2, then divide by the total |
| 2 | **Add a pure substance** | "how much water must be added?" | numerator fixed (water) or both move (solute) |
| 3 | **Find the mixing ratio** | "in what ratio must they be mixed to get 30%?" | alligation |
| 4 | **Remove and replace** | "8 L are drawn off and replaced with water" | remaining = initial × (1 − f)^n |
| 5 | **Price / value blend** | "tea at $80 mixed with tea at $120" | identical to type 1 or 3, with price as the "concentration" |

Type 5 is the one students fail to recognise. A price per kilogram behaves exactly like a concentration: it is a *per-unit* quantity being weighted by *quantity*.

> **Teaching note.** Run the classification drill for a minute. *"How much pure alcohol must be added?"* → type 2, and note that the answer will be *added to both* numerator and denominator. *"In what ratio?"* → type 3, alligation, and the answer is a ratio with no volumes in it at all. *"Drawn off and replaced"* → type 4. The keyword-to-method map here is unusually reliable, which makes it worth drilling explicitly.

---

## 3. The Master Equation and the Four Operations *(5 min)*

| Concept | Formula |
|---|---|
| Amount of the component | concentration × total volume |
| Mixing two solutions | c1·V1 + c2·V2 = c_final·(V1 + V2) |
| Adding pure water | component amount stays the same, total increases |
| Adding pure solute | component and total both increase by the same amount |
| Removing and replacing | after n replacements of fraction f: remaining = initial × (1 − f)^n |

**The master equation is just conservation of the pure thing:**

```
c1 V1 + c2 V2 = c_f (V1 + V2)
```

Left side: how much acid went in. Right side: how much acid is in the result. Nothing was created or destroyed.

**Pure water is a 0% solution. Pure acid is a 100% solution.** That is the whole trick for type 2 — you do not need a separate formula, you just plug c = 0 or c = 1 into the master equation.

```
adding water:  c1 V1 + 0 x x   = c_f (V1 + x)
adding acid:   c1 V1 + 1 x x   = c_f (V1 + x)
```

**Repeated replacement.** If you remove a fraction f of a mixture and top up with pure solvent, the solute is scaled by (1 − f) each time — because the removal takes solute *in proportion*, and the top-up adds none.

```
after n rounds:   remaining solute = initial x (1 - f)^n
```

Note carefully what is *not* true: removing 8 litres from a 40-litre tank does not remove 8 litres of solute. It removes 8/40 = 1/5 of whatever solute is present.

> **Teaching note.** Write the master equation once and then show the class that every formula in the table is a special case of it. Students who memorise five formulas will pick the wrong one under pressure; students who hold one equation and set c = 0 or c = 1 will not. Test it live: *"What is c for pure water?"* Zero. *"For pure acid?"* One. *"For a 40% solution?"* 0.4. Three seconds, and type 2 stops being a separate topic.

> **Board.** Water is 0%. Pure solute is 100%. One equation covers everything.

---

## 4. Alligation — the ten-second method *(4 min)*

To mix two things with values `a` and `b` (with a < b) to get a mean value `m`:

```
quantity of a : quantity of b  =  (b - m) : (m - a)
```

**The ratio of quantities is the *inverse* of the distances from the mean.** The one that is further from the target gets less weight.

**Worked in miniature.** Mix a 20% and a 50% solution to get 30%.

```
distances:  50 - 30 = 20        30 - 20 = 10
ratio (20% : 50%) = 20 : 10 = 2 : 1
```

**Check:** 2 parts at 20% and 1 part at 50% → (2×0.20 + 1×0.50)/3 = 0.90/3 = 0.30. ✓

**The sanity check that saves you from inverting it:** the target 30% is much closer to 20% than to 50%, so **most of the mixture must be the 20% solution**. Two parts to one — correct. If your ratio says otherwise, you have flipped it.

The visual layout, if you like it:

```
   20            50
      \        /
        [ 30 ]
      /        \
  (50-30)=20   (30-20)=10

  so 20% : 50% = 20 : 10 = 2 : 1
```

Notice the arms cross: the distance measured on the 50 side becomes the quantity of the 20.

> **Teaching note.** Do not let them memorise the crossing without the sanity check — the crossing is exactly what students get backwards under pressure, and the check ("more of the one nearer the target") is instant and unforgettable. Then broaden it: alligation works for prices, for average marks, for average speeds where the *times* are equal, for anything that is a weighted average. Mention that it is also how you solve "two groups, one overall percentage" questions in Statistics.

---

## 5. Worked Examples *(15 min)*

Work each one on the board. **Write the pure-component amount before anything else.**

### Example 1 — adding water *(type 2)*

*How much water must be added to 40 litres of a 25% acid solution to reduce it to 20% acid?*

**Step 1 — the invariant.** Water adds no acid, so the acid amount never changes.

```
acid = 0.25 x 40 = 10 litres, fixed
```

**Step 2 — write the new concentration.** Let x litres of water be added; the total becomes 40 + x.

```
10 / (40 + x) = 0.20
```

**Step 3 — solve.**

```
10 = 8 + 0.2x  ->  0.2x = 2  ->  x = 10 litres
```

**Check:** 10 litres of acid in 50 litres total = 20%. ✓

> **Teaching note.** Ask for a prediction before solving: *"Will we need more than 10 litres of water or less?"* Reasoning it out is quick — to go from 25% to 20% the total must grow by the ratio 25/20 = 1.25, so 40 becomes 50, so 10 litres. That reasoning route is faster than the algebra and worth showing after the algebra, not before. The trap answer is 8 (from "5% of 40 × ...", a meaningless move that nevertheless appears).

---

### Example 2 — mixing two solutions *(type 1)*

*30 litres of a 15% salt solution is mixed with 20 litres of a 40% salt solution. What is the concentration of the result?*

**Step 1 — pure component in each, before anything else.**

```
0.15 x 30 = 4.5 litres of salt
0.40 x 20 = 8.0 litres of salt
```

**Step 2 — add them, and add the volumes separately.**

```
salt  = 4.5 + 8 = 12.5 litres
total = 30 + 20 = 50 litres
```

**Step 3 — divide.**

```
12.5/50 = 0.25 = 25%
```

**Sanity check:** 25% lies between 15% and 40%, and closer to 15% because there is more of the weak solution. ✓

> **Teaching note.** The trap answer is 27.5%, the plain average of 15 and 40, and it is only correct when the volumes are equal. Ask the room, before solving, whether the answer should be above or below 27.5% — below, because the weak solution is the larger batch. That single prediction eliminates the trap.

---

### Example 3 — alligation with prices *(type 5)*

*In what ratio must tea costing $80/kg be mixed with tea costing $120/kg to produce a blend worth $95/kg?*

**Step 1 — recognise the type.** Price per kg behaves exactly like a concentration.

**Step 2 — distances from the target.**

```
120 - 95 = 25          95 - 80 = 15
```

**Step 3 — cross them.**

```
($80 tea) : ($120 tea) = 25 : 15 = 5 : 3
```

**Check:** (5 × 80 + 3 × 120)/8 = (400 + 360)/8 = 760/8 = **95**. ✓

**Sanity check:** 95 is nearer to 80 than to 120, so there must be more of the cheap tea. 5 against 3 — correct.

> **Teaching note.** Have someone state the sanity check *before* you cross the arms. Then ask what the ratio would be for a $110 blend: distances 10 and 30, so 10 : 30 = 1 : 3, mostly expensive tea. Doing a second one immediately, with the answer flipping to the other side, is what fixes the direction in their heads.

---

### Example 4 — adding pure solute *(type 2, both columns move)*

*How much pure alcohol must be added to 15 litres of a 20% alcohol solution to make it 50% alcohol?*

**Step 1 — the pure component now.**

```
alcohol = 0.20 x 15 = 3 litres
```

**Step 2 — pure alcohol is 100%, so x litres of it adds x to BOTH numerator and denominator.**

```
(3 + x) / (15 + x) = 0.50
```

**Step 3 — solve.**

```
3 + x = 0.5(15 + x)
3 + x = 7.5 + 0.5x
0.5x  = 4.5
   x  = 9 litres
```

**Check:** 3 + 9 = 12 litres of alcohol in 15 + 9 = 24 litres total, and 12/24 = **50%**. ✓

> **Teaching note.** This is the single most instructive contrast in the topic — put it directly against Example 1. There, x went into the denominator only. Here it goes into both. Ask the class to say, out loud, why: because water contains no alcohol and pure alcohol contains nothing but. Then note the wrong answer 4.5, which comes from treating the added alcohol as if it were another solution and forgetting the denominator. Ask also whether 9 litres feels large — it should, because doubling a concentration from 20% to 50% is a big move.

---

### Example 5 — remove and replace *(type 4)*

*A 40-litre vessel is full of pure milk. 8 litres are removed and replaced with water. The same operation is performed a second time. How much milk remains?*

**Step 1 — the fraction removed each time.**

```
f = 8/40 = 1/5
```

**Step 2 — each round multiplies the milk by (1 − f).**

```
remaining = 40 x (4/5)^2 = 40 x 16/25 = 25.6 litres
```

**Step 3 — verify by walking it, because the formula is easy to misapply.**

```
Round 1: remove 8 L of PURE milk  ->  32 L milk, 8 L water
Round 2: the vessel is now 32/40 = 80% milk,
         so removing 8 L removes 0.8 x 8 = 6.4 L of milk
         ->  32 - 6.4 = 25.6 L milk, 14.4 L water
```

**25.6 litres of milk** (and 14.4 litres of water). ✓

> **Teaching note.** The near-universal error is 40 − 16 = 24, from assuming both rounds remove 8 litres of milk. Walk round 2 explicitly and ask: *"When we scoop out 8 litres the second time, is it pure milk?"* No — it is a mixture, so it takes water out too, and less milk is lost. That is exactly why the answer is above 24, not below it. Point out that the formula and the step-by-step give the same number, and that on test day the formula wins, but only if they understand what it is doing.

---

## 6. Practice Pause *(4 min)*

Three minutes on the clock, no calculator. **Write the pure-component amount first on every one.**

1. 10 litres of a 60% alcohol solution is mixed with 30 litres of a 20% solution. What is the resulting concentration?
2. How much pure water must be added to 20 litres of a 50% solution to make it 40%?
3. In what ratio should 30% and 70% solutions be mixed to get 60%?

<details>
<summary>Answers</summary>

**1.** Alcohol = 0.60(10) + 0.20(30) = 6 + 6 = 12 litres, in a total of 40 litres → **30%**. *(Not 40%, the plain average — there is three times as much weak solution.)*

**2.** Solute = 0.50 × 20 = 10 litres, fixed. 10/(20 + x) = 0.4 → 20 + x = 25 → **x = 5 litres**.

**3.** Distances: 70 − 60 = 10 and 60 − 30 = 30. Ratio (30% : 70%) = 10 : 30 = **1 : 3**. *(Sanity check: 60 is nearer 70, so most of the mixture is the 70% solution. ✓)*

</details>

> **Teaching note.** This is where you cash in the hook — Q1 is the question you wrote "40%?" on the board for at the start. Cross it out now and write 30%. Q3 is the diagnostic: anyone answering 3 : 1 has inverted the alligation and did not run the sanity check. Before revealing answers, ask which of the three solutions has the larger share in Q3, and make them justify it in words.

---

## 7. The Six Traps *(5 min)*

| # | Trap | ✗ Wrong | ✓ Right |
|---|---|---|---|
| 1 | Averaging the concentrations | 15% and 40% mixed → 27.5% | weight by volume: 12.5/50 = 25% |
| 2 | Total left unchanged when adding | 10/40 after adding 10 L of water | 10/(40+10) = 20% |
| 3 | Pure solute treated as a solution | (3+x)/15 = 0.5 | (3+x)/(15+x) = 0.5 |
| 4 | Alligation ratio inverted | 20% and 50% → 30% gives 1 : 2 | 2 : 1 — more of the one nearer the target |
| 5 | Percent used as a whole number | 25 × 40 = 1000 litres of acid | 0.25 × 40 = 10 litres |
| 6 | Removal treated as removing pure solute | second scoop removes 8 L of milk | it removes 8 × (current milk fraction) |

> **Teaching note.** Ask *why the wrong side is tempting* for each. Trap 1 because averaging two numbers is the reflex. Trap 2 because the 40 is written down in front of them and the x feels like it belongs somewhere else. Trap 3 because the added substance feels like an ingredient rather than part of the total. Trap 4 because the crossing is arbitrary-looking and half the class will guess. Trap 6 because the first scoop *was* pure and nothing announces that the second one is not. For traps 4 and 6 the defence is the same: state in one sentence what the answer should look like before computing.

---

## 8. Speed Tricks and Habits *(3 min)*

**Tricks:**

- **Write the pure-component amount immediately.** For every solution mentioned, compute concentration × volume before doing anything else. That one habit solves half the topic.
- **Use alligation for any two-source problem.** It is a ten-second method once practised, and it works for prices, marks and speeds too.
- **Sanity-check the direction:** the final concentration must lie *strictly between* the two starting concentrations, and nearer to whichever source there is more of.
- **For repeated replacement, use (1 − f)^n** rather than stepping through each round.
- **Work in litres of pure substance, not percentages,** until the very last step.
- **Set the total to 100** when the problem gives no volumes at all — the answer then reads off directly.

**Habits that separate 160 from 167:**

| Habit | Why |
|---|---|
| Ask "did the total change?" after every operation | Adding water changes the denominator only; adding solute changes both; evaporation changes only the denominator downward |
| State whether the answer is above or below the midpoint before computing | Kills the plain-average trap on every type-1 question |
| Check that the final amount of pure component still balances | c1V1 + c2V2 must equal c_f × V_total; this catches almost every arithmetic slip |

> **Teaching note.** Demonstrate the "set the total to 100" trick on a question with no volumes: *"A solution is 30% acid. What fraction of it must be replaced by pure acid to make it 50%?"* Take 100 litres: 30 acid. Remove x litres of mixture (taking 0.3x acid) and add x litres of pure acid → (30 − 0.3x + x)/100 = 0.5 → 0.7x = 20 → x = 200/7 ≈ 28.6 litres, so about 2/7 of it. Doing it live shows the trick and revises type 4 at the same time.

---

## 9. Challenge Set — 165+ *(10 min)*

Three problems where the setup is the difficulty. Three minutes each before you solve.

### Challenge 1 — replace with the solute, not the solvent

*A vessel contains 60 litres of a milk-and-water mixture in the ratio 7 : 5. How much of the mixture must be drawn off and replaced with pure milk so that the ratio becomes 3 : 1?*

> **Nudge:** the replacement liquid contains no water. So which quantity is easier to track — the milk or the water?

<details>
<summary>Solution</summary>

**Step 1 — the starting amounts.** 7 + 5 = 12 parts in 60 litres, so one part is 5 litres.

```
milk  = 35 litres
water = 25 litres
```

**Step 2 — pick the easy quantity.** The pure milk added contains **no water**, so water only ever leaves. Track the water.

**Step 3 — the target.** After the operation the total is still 60 litres (drawn off and replaced by the same volume), and the ratio 3 : 1 means water is 1/4 of the total.

```
water needed = 60/4 = 15 litres
```

**Step 4 — how much must be drawn off?** Drawing off x litres of a mixture removes the fraction x/60 of everything in it.

```
25 (1 - x/60) = 15
    1 - x/60  = 15/25 = 3/5
        x/60  = 2/5
           x  = 24 litres
```

**Check:** draw off 24 L → removes 14 L milk and 10 L water, leaving 21 milk and 15 water (36 L). Add 24 L pure milk → 45 milk and 15 water, which is **3 : 1**. ✓

</details>

> **Teaching note.** The whole difficulty is choosing what to track. Students who track the milk have to handle both the removal *and* the addition, and the algebra doubles. Ask explicitly: *"Which quantity does the added liquid not touch?"* The water. That question is transferable — in every replacement problem, track the component the top-up does **not** contain. Also note that this is why the (1 − f)^n formula works: it is the same "the top-up adds none of this" logic applied repeatedly.

---

### Challenge 2 — alligation with a fixed total

*Alloy A is 60% copper and alloy B is 25% copper. They are to be melted together to make 70 kg of an alloy that is 40% copper. How many kilograms of each alloy are needed?*

> **Nudge:** alligation gives you the ratio. The 70 kg then tells you the actual masses.

<details>
<summary>Solution</summary>

**Step 1 — alligation.** The lower value is 25, the higher is 60, the target is 40.

```
distances:  60 - 40 = 20        40 - 25 = 15
quantity of B (25%) : quantity of A (60%) = 20 : 15 = 4 : 3
```

**Sanity check:** 40 is closer to 25 than to 60, so there must be more of alloy B. 4 against 3 — correct.

**Step 2 — split 70 kg in the ratio 3 : 4** (A : B).

```
7 parts = 70 kg  ->  1 part = 10 kg
A = 30 kg,  B = 40 kg
```

**Check:** copper = 0.60(30) + 0.25(40) = 18 + 10 = 28 kg, and 28/70 = **40%**. ✓

</details>

> **Teaching note.** Two errors to expect. The first is reporting the ratio 4 : 3 and stopping — the question asks for masses, so the ratio is an intermediate value, exactly the wrong-quantity trap from the Translating capsule. The second is assigning 4 parts to A because the 20 was computed on A's side; that is the crossing, and it is why the sanity check exists. Insist that someone states "more of B" out loud before any parts are assigned.

---

### Challenge 3 — the mixture hidden behind a profit

*A shopkeeper blends rice costing $30/kg with rice costing $45/kg. He sells the blend at $48/kg and makes a 20% profit. In what ratio did he mix the two varieties?*

> **Nudge:** alligation needs the blend's *cost*, and you have been given its selling price. Undo the profit first.

<details>
<summary>Solution</summary>

**Step 1 — find the cost price of the blend.** Profit is always reckoned on cost, so SP = CP × 1.20.

```
CP = 48 / 1.20 = $40 per kg
```

**Step 2 — now alligate between 30 and 45 with a target of 40.**

```
distances:  45 - 40 = 5        40 - 30 = 10
ratio ($30 rice : $45 rice) = 5 : 10 = 1 : 2
```

**Sanity check:** 40 is nearer to 45, so there must be more of the expensive rice. 1 against 2 — correct.

**Check:** (1 × 30 + 2 × 45)/3 = (30 + 90)/3 = **$40 per kg**, which sold at $48 is a 20% profit. ✓

</details>

> **Teaching note.** The trap is alligating straight to 48 — using the selling price as the blend's value. Point out that this is not merely wrong, it is *impossible*: 48 lies outside the range 30 to 45, and a weighted average can never fall outside the values being averaged. Anyone whose target sits outside both sources has misidentified the target. Ask the room, before anyone computes: *"Is $48 the cost of the blend or its price?"* Getting that one word right is the whole question. Note also the direction of the reversal: divide by 1.20, never subtract 20% from 48 (which would give $38.40 and a different, wrong ratio). This is the Percentages base rule reappearing inside a mixture problem, and it is worth saying so.

---

## 10. Exit Ticket *(2 min)*

No calculator, no paper working.

1. How much pure solute is in 20 litres of a 30% solution?
2. Equal volumes of a 10% and a 30% solution are mixed. What is the result?
3. In what ratio must 10% and 40% solutions be mixed to give 20%?
4. 50 litres of pure water is added to 50 litres of 40% acid. What is the new concentration?

<details>
<summary>Answers</summary>

**1.** 0.30 × 20 = **6 litres**.

**2.** Equal volumes, so the plain average is valid here: **20%**.

**3.** Distances: 40 − 20 = 20 and 20 − 10 = 10. Ratio (10% : 40%) = 20 : 10 = **2 : 1**. *(More of the 10%, since 20 is nearer 10. ✓)*

**4.** Acid = 0.40 × 50 = 20 litres, unchanged; total becomes 100 litres → **20%**. *(Adding an equal volume of water halves the concentration.)*

</details>

> **Teaching note.** Collect these at the door. Q1 and Q2 should be universal — Q2 is there precisely to confirm that averaging *is* right when the volumes are equal, so students do not over-correct. **Q3 and Q4 are the diagnostic ones.** A 1 : 2 answer on Q3 means the alligation is still inverted; anything other than 20% on Q4 means the fixed-numerator idea has not landed.

---

## 11. Close *(2 min)*

### Three sentences to take away

1. **Write down the litres of pure component before you do anything else.** Concentrations mislead; amounts do not.
2. **Water is 0% and pure solute is 100%.** With those two values, the single master equation `c1V1 + c2V2 = c_f(V1+V2)` covers every question in the topic.
3. **The blend always lands between the two sources, nearer the one you used more of.** State which side before you compute, and the plain-average trap and the inverted alligation both die.

### Homework

- Re-read sections 3 and 4 of this capsule — the master equation and alligation.
- Attempt 15 questions from the **WRD-MIX** bank set.
- On every question, write the pure-component amount for each source in the margin before starting. Then check whether the questions you got wrong were ones where you skipped that step. For most students they will be.

### Next class

**Word Problems 05 — Simple & Compound Interest**, which is the multiplier chain from Percentages applied over time. The `(1 − f)^n` structure you met in repeated replacement today is the same exponential shape, running downwards instead of upwards.
