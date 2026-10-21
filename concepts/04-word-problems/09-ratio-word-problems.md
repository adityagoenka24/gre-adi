# Ratio Word Problems — Full Lecture

**Section:** Word Problems · **Bank code:** WRD-RAT · **GRE frequency:** Medium-High · **Class length:** ~60 min

> **Thesis of the whole lesson:** write every quantity as a multiple of k, then ask **what stayed the same**. The invariant is what turns a confusing story into a single equation.

---

## How to use this capsule

Read straight through, it is a lecture script with timings. Sections are numbered in teaching order, and each opens with a time budget.

Three kinds of block appear throughout:

- **Teaching note** — what to say, what to ask, where to pause. Written for the teacher, but students self-studying should read them too: they name the mistake before you make it.
- **Board** — the one line worth writing on the whiteboard.
- **Answers** are hidden inside collapsible blocks so you can attempt first.

**Running time:** hook 3 · core & diagnosis 7 · machinery 13 · worked examples 15 · practice 4 · traps & tricks 7 · challenge 9 · close 2.

---

## 0. The Hook — the mechanics are easy, the stories are not *(3 min)*

You already know how ratios work — that was *Arithmetic 03*. This class is about the sentence that comes **after** the ratio, because that sentence is where the GRE hides the question.

| The story says | The trap it sets |
|---|---|
| "10 more girls join" | Students change both parts of the ratio |
| "8 red balls are replaced by 8 blue" | Students change the total, which did not move |
| "coins in the ratio 3 : 5 : 7" | Students treat a count ratio as a value ratio |
| "each saves $600" | Students look for one equation when there are two |
| "16 pumps instead of 12" | Students use direct proportion where it is inverse |

Every row is the same failure: reading the ratio correctly and then modelling the *change* wrongly.

> **Teaching note.** Open with a question that takes ten seconds and splits the room. *"Red and blue marbles are in the ratio 2 : 3. I add 10 red marbles. What is the new ratio?"* Somebody will confidently say 12 : 13, or 4 : 3. The honest answer is **you cannot tell** — you do not know how many marbles there were. That is the lesson: a ratio plus a change is not another ratio, it is an *equation waiting for k*.

> **Board.** Write ak, bk. Then ask: what stayed the same?

---

## 1. Core Idea — name k, then find the invariant *(4 min)*

```
a : b   means the quantities are   ak   and   bk   for some positive k
```

Naming k is the move that makes the story computable. But in a *word* problem there is a second move, and it is the one that separates a fast solution from a stuck one:

> **Find the quantity that did not change.**

In almost every ratio story, exactly one thing is invariant, and it hands you the equation:

| What is invariant | Typical wording |
|---|---|
| **One quantity** | "10 more girls join" — the boys did not move |
| **The total** | "8 red are replaced by 8 blue" — an exchange, not an addition |
| **The difference** | "C gets $600 more than A" — the gap is given directly |
| **The product** (inverse) | "more pumps, fewer days" — pump-hours are fixed |

Pin the invariant and the second equation writes itself.

> **Teaching note.** Say the two-step method out loud and make them copy it: *name k, then name the invariant.* Then test the second step alone, with no arithmetic. *"Boys and girls are 5 : 4 and 10 girls join — what did not change?"* The boys. *"Red and blue are 7 : 3 and 8 red are swapped for 8 blue — what did not change?"* The total. Students who can answer that question have already solved the problem.

---

## 2. Diagnose First — the five story types *(3 min)*

| # | Type | Sounds like | Opening move |
|---|---|---|---|
| 1 | **Share a total** | "$4,800 in the ratio 3 : 5 : 8" | Sum the parts, divide, scale |
| 2 | **A difference is given** | "C gets $600 more than A" | Difference in ratio units = k in one step |
| 3 | **The ratio changes** | "after 10 more girls join…" | Change only the affected quantity, then cross-multiply |
| 4 | **Chain two ratios** | "students : teachers and teachers : admin" | Match the shared term via its LCM |
| 5 | **Two ratios, two unknowns** | "incomes 4 : 3, expenditures 3 : 2, each saves $600" | Two variables — k for one ratio, a different letter for the other |

Type 5 is the one students have never been shown. **Two independent ratios need two independent multipliers**, and using k for both is the single most expensive error in this capsule.

> **Teaching note.** Sorting drill, thirty seconds, type number only. *"Divide 91 sweets in the ratio 4 : 3"* → 1. *"After 6 boys leave, the ratio becomes 1 : 2"* → 3. *"Incomes are 5 : 4 and expenses are 3 : 2"* → 5. *"A : B = 3 : 4 and B : C = 8 : 9"* → 4. *"B receives ₹800 more than A"* → 2. Then ask what makes Type 5 different from Type 4 — in a chain the ratios *share* a quantity; here they describe two *different* quantities, so they cannot share a multiplier.

---

## 3. Sharing a Total, and the Difference Shortcut *(4 min)*

**Type 1 — share a total.** If T is split in the ratio `a : b : c`:

```
total parts = a + b + c        one part = T / (a + b + c)
```

Then each share is its number of parts times that value. A free error-check: on the GRE, T almost always divides cleanly by the sum of the parts. If it does not, re-read.

**Type 2 — a difference is given.** This is faster than students expect. If the shares are 2k, 3k and 5k and *"C gets $600 more than A"*, then:

```
5k - 2k = 600   ->   3k = 600   ->   k = 200
```

**The difference in ratio units maps straight onto the difference in real units.** No need to build the total first.

**The part-to-whole reminder.** With shares 2 : 3 : 5, A gets 2/10 of the money, not 2/3 and not 2/5. The denominator is always the **sum of all the parts**.

> **Teaching note.** Give the same problem twice, once each way, to show that Type 2 is not a special case but a shortcut. *"A : B : C = 2 : 3 : 5 and the total is $2,000"* → one part is 200. *"…and C gets $600 more than A"* → 3k = 600, so one part is 200. Identical k, arrived at from opposite ends. Students who see that stop fearing the version that withholds the total.

---

## 4. When the Ratio Changes — the invariant in action *(5 min)*

This is the heart of the topic. Three change-patterns cover nearly everything.

**Pattern A — something is added to one quantity.** Only that quantity moves.

```
boys : girls = 5 : 4,  then 10 girls join

        5k
      -------  =  5/6            <- boys unchanged, girls + 10
      4k + 10
```

Writing `(5k + 10)/(4k + 10)` here is the classic error — nobody added any boys.

**Pattern B — an exchange.** The total is invariant; one side loses exactly what the other gains.

```
red : blue = 7 : 3,  8 red swapped for 8 blue

      7k - 8
      -------  =  3/2            <- total 10k never moves
      3k + 8
```

**Pattern C — the same amount is added to or removed from *both*.**

```
two numbers are 3 : 5, then 9 is subtracted from each

      3k - 9
      -------  =  12/23
      5k - 9
```

In every pattern the method after the setup is identical: **cross-multiply, solve for k, then answer the question actually asked.**

> **Teaching note.** Put all three fraction setups on the board side by side, with the words above them, and leave them up for the rest of the lesson. Then read a new problem aloud and ask only *"which pattern?"* — not the answer. The setups differ by a few characters, and choosing among three visible options is far easier for a struggling student than generating one from scratch.

> **Board.** Change only what the story changed. Then cross-multiply.

---

## 5. Chaining, Inverse Proportion, and Two-Ratio Problems *(4 min)*

**Chaining (Type 4).** To link `A : B` with `B : C`, scale each until the shared term matches — use the LCM of the two B-values.

```
A : B = 3 : 4        B : C = 8 : 9
B is 4 and 8, LCM 8, so double the first:
A : B = 6 : 8        ->   A : B : C = 6 : 8 : 9
```

**Inverse proportion.** More workers, fewer days. The **product** is the invariant:

```
workers x days = constant          pumps x hours x days = constant
```

The decisive check is never algebraic — it is a sentence. *Should the answer be bigger or smaller than what I started with?* If more pumps gives you more days, you have used direct proportion where the situation is inverse.

**Two ratios, two unknowns (Type 5).** When two *different* quantities each have their own ratio, they need their own multipliers:

```
incomes      4x : 3x
expenditures 3y : 2y
savings = income - expenditure
```

Two savings statements then give two equations in x and y. **Using k for both ratios silently asserts that income and expenditure scale together**, which the problem never said.

> **Teaching note.** Make the two-letter point physically. Write `4k : 3k` and `3k : 2k` on the board and ask what that would mean — that A's income and A's expenditure are locked to the same scale, so a person who earns twice as much must also spend twice as much. Nothing in the problem says that. Erase one k and replace it with y. That single substitution is the whole of Type 5.

---

## 6. Worked Examples *(15 min)*

### Example 1 — a difference is given *(Type 2)*

*A sum of money is divided among A, B and C in the ratio 2 : 3 : 5. If C gets $600 more than A, what is the total?*

**Step 1 — name k.** Shares are 2k, 3k, 5k.

**Step 2 — the difference maps directly.**

```
5k - 2k = 600   ->   3k = 600   ->   k = 200
```

**Step 3 — answer what was asked.** The question wants the **total**, not k.

```
Total = 10k = $2,000
```

> **Teaching note.** Ask for the answer before you compute step 3 and someone will say 200. That is k, not the total — and "answered the wrong quantity" is the most common way to lose a question you actually solved. Circle the word "total" in the question before starting.

---

### Example 2 — something is added *(Type 3, Pattern A)*

*The ratio of boys to girls in a class is 5 : 4. If 10 more girls join, the ratio becomes 5 : 6. How many boys are there?*

**Step 1 — name k and the invariant.** Boys = 5k, girls = 4k. **Only the girls change.**

**Step 2 — write and cross-multiply.**

```
   5k
--------- = 5/6      ->   30k = 20k + 50   ->   10k = 50   ->   k = 5
 4k + 10
```

**Step 3 — answer.** Boys = 5(5) = **25**.

**Check:** 25 boys, 20 girls. After 10 join: 25 : 30 = 5 : 6. ✓

*Sanity note:* had k come out fractional, we would have a non-whole number of students — a reliable signal of a misread setup.

---

### Example 3 — an exchange *(Type 3, Pattern B)*

*A jar has red and blue balls in the ratio 7 : 3. If 8 red balls are replaced by 8 blue balls, the ratio becomes 3 : 2. How many balls are in the jar?*

**Step 1 — spot the invariant.** Red = 7k, blue = 3k. Balls are *replaced*, so the **total 10k never changes**.

**Step 2 — one side loses what the other gains.**

```
 7k - 8
-------- = 3/2   ->   2(7k - 8) = 3(3k + 8)   ->   14k - 16 = 9k + 24   ->   5k = 40   ->   k = 8
 3k + 8
```

**Step 3 — answer.** Total = 10k = **80 balls**.

**Check:** red 56 → 48, blue 24 → 32, and 48 : 32 = 3 : 2. ✓

> **Teaching note.** Contrast this directly with Example 2 by asking one question: *"did the total change?"* In Example 2 it did — ten students walked in. Here it did not — the jar holds the same number of balls throughout. Same topic, opposite invariant, and the difference is a single word in the problem: *replaced*.

---

### Example 4 — chaining inside a story *(Type 4)*

*In a college the ratio of students to teachers is 20 : 1, and the ratio of teachers to admin staff is 4 : 3. If there are 45 admin staff, how many students are there?*

**Step 1 — work from the known quantity outward.** Admin staff is the number you have, so start there.

```
teachers : admin = 4 : 3,  admin = 45   ->   teachers = 45 x 4/3 = 60
```

**Step 2 — step along the chain.**

```
students : teachers = 20 : 1,  teachers = 60   ->   students = 20 x 60 = 1,200
```

**Answer: 1,200 students.**

> **Teaching note.** Show the alternative route too — building the full chain `students : teachers : admin = 80 : 4 : 3` and then scaling by 15 — and let the class judge which is faster here. Walking the chain from the known value wins when only one number is given; building the full chain wins when the question asks for a total or several shares. Both are correct; the choice is about what the question wants.

---

### Example 5 — inverse proportion *(Type 5 machinery)*

*12 pumps working 8 hours a day empty a reservoir in 5 days. How many days would 16 pumps working 5 hours a day take?*

**Step 1 — find the invariant.** The job is fixed, so the total **pump-hours** is constant.

```
12 x 8 x 5 = 480 pump-hours
```

**Step 2 — divide by the new rate.**

```
16 pumps x 5 hours = 80 pump-hours per day
480 / 80 = 6 days
```

**Answer: 6 days.**

> **Teaching note.** Before computing, ask the class to predict whether the answer beats 5 days or not. More pumps pushes it down, fewer hours pushes it up, so the two effects fight and prediction alone is not enough — which is exactly why the pump-hours method is worth having. Note also that 480 is the "size of the job" in the same sense as the LCM units from *Work & Rate*; it is the same idea in different clothing.

---

### Example 6 — two ratios, two unknowns *(Type 5)*

*The incomes of A and B are in the ratio 4 : 3 and their expenditures are in the ratio 3 : 2. If each saves $600, find A's income.*

**Step 1 — two ratios, two letters.** Incomes 4x and 3x; expenditures 3y and 2y. **Not the same multiplier.**

**Step 2 — savings gives two equations.**

```
A:  4x - 3y = 600
B:  3x - 2y = 600
```

**Step 3 — eliminate.** Multiply the first by 2 and the second by 3:

```
8x - 6y = 1200
9x - 6y = 1800
subtract:  x = 600
```

Then 4(600) − 3y = 600, so 3y = 1800 and y = 600.

**Step 4 — answer.** A's income = 4x = **$2,400**.

**Check:** incomes 2400 and 1800; expenditures 1800 and 1200; savings 600 and 600. ✓

> **Teaching note.** This is the hardest routine problem in the capsule and it is worth the four minutes. Before solving, ask *"how many unknowns are there?"* Most will say one. Two — and the tell is that income and expenditure are separate quantities with separate ratios. Then point out the payoff: two unknowns need two equations, and the problem obligingly gave two savings statements. The structure of the question was telling you the method all along.

---

## 7. Practice Pause *(4 min)*

Three minutes, no calculator. Name k first, then the invariant.

1. $3,600 is divided in the ratio 4 : 5. What is the larger share?
2. The ratio of pens to pencils is 3 : 7. If there are 24 more pencils than pens, how many pens are there?
3. A : B = 3 : 4 and B : C = 8 : 9. Find A : B : C.

<details>
<summary>Answers</summary>

**1.** 9 parts = 3,600, so one part = 400. Larger share = 5 × 400 = **$2,000**.

**2.** 7k − 3k = 24, so 4k = 24 and k = 6. Pens = 3(6) = **18**. *(Pencils 42, and 42 − 18 = 24 ✓)*

**3.** Match B: it is 4 in the first and 8 in the second, so double the first. A : B = 6 : 8, giving **A : B : C = 6 : 8 : 9**.

</details>

> **Teaching note.** Q2 is the difference shortcut from section 3 — watch for students who build the total first and take twice as long. Q3 catches anyone who writes 3 : 4 : 9 by ignoring the mismatch in B. Before revealing, ask one student for the *invariant* in Q2 (the difference) rather than the answer.

---

## 8. The Traps *(4 min)*

| # | Trap | ✗ Wrong | ✓ Right |
|---|---|---|---|
| 1 | Changing both parts when only one moved | 10 girls join → (5k+10)/(4k+10) | 5k/(4k+10) |
| 2 | Treating ratio numbers as counts | "5 : 4" means 5 boys | 5k boys, k unknown |
| 3 | Part-to-part read as part-to-whole | boys : girls = 5 : 4 → boys are 5/4 of the class | boys are 5/9 of the class |
| 4 | Chaining without matching the shared term | 3 : 4 and 8 : 9 → 3 : 4 : 9 | scale to 6 : 8 : 9 |
| 5 | One multiplier for two independent ratios | incomes 4k : 3k, expenses 3k : 2k | 4x : 3x and 3y : 2y |
| 6 | Direct proportion where it is inverse | 16 pumps take longer than 12 | pump-hours fixed, so fewer days |
| 7 | A count ratio used as a value ratio | coins 3 : 5 : 7 → value ratio 3 : 5 : 7 | multiply each count by its denomination |

> **Teaching note.** For each trap, ask *why the wrong side is tempting* rather than just reading it out. Trap 1 tempts because the ratio has two numbers and it feels unbalanced to touch only one. Trap 5 tempts because k has worked all lesson. Trap 7 tempts because the numbers are sitting right there in the order you need them. Naming the temptation is what stops it recurring under time pressure.

---

## 9. Speed Tricks and Habits *(3 min)*

**Tricks:**

- **Name k before reading the second sentence.** The story is much easier to parse once the quantities have symbols.
- **Difference given? Use it directly.** 5k − 2k = 600 gives k in one line; do not build the total first.
- **Cross-multiply immediately.** Do not try to reason about the new ratio verbally.
- **For inverse proportion, compute the fixed product** (worker-days, pump-hours) and divide.
- **Check against the ORIGINAL ratio, not just the new one.** Both must hold.

**Habits:**

| Habit | Why |
|---|---|
| Ask "what stayed the same?" before writing equation two | It is the fastest route to the setup, and it is the step students skip |
| Count the unknowns before solving | One ratio needs k; two independent ratios need x and y |
| Sanity-check that counts come out whole | A fractional k for people or objects means a misread setup |

---

## 10. Challenge Set — 165+ *(9 min)*

### Challenge 1 — counts versus values

*A bag contains 1-rupee, 2-rupee and 5-rupee coins in the ratio 3 : 5 : 7. If the total value is ₹480, how many 2-rupee coins are there?*

> **Nudge:** the ratio counts coins. The ₹480 measures value. Those are not the same thing.

<details>
<summary>Solution</summary>

Counts are 3k, 5k and 7k. **Value** is each count times its denomination:

```
3k(1) + 5k(2) + 7k(5) = 3k + 10k + 35k = 48k
48k = 480   ->   k = 10
```

Two-rupee coins = 5k = **50**.

**Check:** 30 coins of ₹1 = ₹30; 50 of ₹2 = ₹100; 70 of ₹5 = ₹350. Total = ₹480. ✓

</details>

> **Teaching note.** The trap answer comes from setting 3k + 5k + 7k = 480, giving k = 32 and 160 two-rupee coins. Ask the class what 15k = 480 would actually be counting — the *number* of coins, not their worth. This count-versus-value distinction reappears in Data Interpretation whenever a table gives quantities and prices separately.

---

### Challenge 2 — adding to change the ratio

*A 60-litre mixture has milk and water in the ratio 2 : 1. How much water must be added to make the ratio 1 : 2?*

> **Nudge:** which of the two liquids is the invariant here?

<details>
<summary>Solution</summary>

Milk = (2/3)(60) = 40 L, water = (1/3)(60) = 20 L. **Only water is added, so the milk stays at 40.**

```
   40
-------- = 1/2   ->   20 + x = 80   ->   x = 60 litres
 20 + x
```

**Check:** milk 40, water 80, and 40 : 80 = 1 : 2. ✓

</details>

> **Teaching note.** Students often expect a small answer and are surprised that you must add more water than the tank originally held. Make the reason explicit: going from 2 : 1 to 1 : 2 means water must move from *half* the milk to *twice* the milk — a fourfold increase, from 20 to 80. This is the same "track the invariant" logic as the Mixtures capsule, which is worth naming out loud.

---

### Challenge 3 — subtracting from both

*Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new ratio is 12 : 23. Find the larger number.*

> **Nudge:** Pattern C. Both quantities move by the same amount.

<details>
<summary>Solution</summary>

```
 3k - 9
-------- = 12/23
 5k - 9

23(3k - 9) = 12(5k - 9)
69k - 207  = 60k - 108
       9k  = 99      ->   k = 11
```

The numbers are 33 and 55, so the larger is **55**.

**Check:** 33 − 9 = 24 and 55 − 9 = 46, and 24 : 46 = 12 : 23. ✓

</details>

> **Teaching note.** Note that the new ratio 12 : 23 is deliberately ugly — it cannot be simplified, so students cannot guess their way in. Point out the useful consequence: because subtracting the same amount from both drags the ratio *away* from 1, and 3/5 = 0.6 while 12/23 ≈ 0.52, the direction is consistent. A quick decimal check like that catches a sign error before you commit to the algebra.

---

### Challenge 4 — remove and replace

*A vessel contains milk and water in the ratio 5 : 1. Twelve litres of the mixture are removed and replaced with water, after which the ratio is 5 : 3. What was the original volume?*

> **Nudge:** removing 12 litres of *mixture* does not remove 12 litres of milk. It removes milk in proportion.

<details>
<summary>Solution</summary>

Let the original volume be V. Milk = 5V/6, water = V/6.

**Removing 12 L of mixture takes milk and water in the 5 : 1 ratio** — that is 10 L of milk and 2 L of water. Then 12 L of water goes back in.

```
milk  = 5V/6 - 10
water = V/6 - 2 + 12 = V/6 + 10

 5V/6 - 10
------------ = 5/3
 V/6  + 10

3(5V/6 - 10) = 5(V/6 + 10)
 15V/6 - 30  = 5V/6 + 50
      10V/6  = 80        ->   V = 48 litres
```

**Check:** V = 48 gives milk 40, water 8. Remove 12 L (10 milk, 2 water) → milk 30, water 6. Add 12 L water → water 18. And 30 : 18 = 5 : 3. ✓

</details>

> **Teaching note.** This is the hardest problem in the capsule and the one worth the most. The error to watch for is subtracting all 12 litres from the milk. Ask before solving: *"if I scoop a cup out of a well-stirred jug, what is in the cup?"* Some of each, in exactly the jug's ratio. That physical picture is the entire insight, and it is the same one that drives the repeated-replacement formula in *Mixtures*.

---

## 11. Exit Ticket *(2 min)*

No calculator.

1. Divide 72 in the ratio 5 : 3. What is the larger share?
2. If A : B = 3 : 4 and B : C = 6 : 7, find A : B : C.
3. If x : y = 3 : 4, what is (x + y) : y?
4. 8 workers finish a job in 15 days. How long would 12 workers take?

<details>
<summary>Answers</summary>

**1.** 8 parts, so one part = 9. Larger = 5 × 9 = **45**.

**2.** B is 4 and 6; LCM 12, so scale the first by 3 and the second by 2 → **9 : 12 : 14**.

**3.** Take x = 3, y = 4. Then (x + y) : y = 7 : 4.

**4.** Inverse: 8 × 15 = 120 worker-days, so 120 ÷ 12 = **10 days**.

</details>

> **Teaching note.** Q2 and Q4 are the diagnostic ones. Q2 catches anyone still chaining without matching the shared term — and note this version needs *both* ratios scaled, which is a step harder than the practice question. Q4 catches anyone reaching for direct proportion; if a student answers more than 15 days, the inverse idea has not landed.

---

## 12. Close *(2 min)*

### Three sentences to take away

1. **Write ak and bk before you read the next sentence.** A ratio is not an amount, and the story only becomes solvable once the quantities have symbols.
2. **Ask what stayed the same.** One quantity, the total, the difference or a product — the invariant is what gives you the second equation.
3. **Two independent ratios need two multipliers.** Using k for both asserts a link the problem never stated.

### Homework

- Re-read sections 4 and 5 — the change patterns and the two-ratio setup.
- Attempt 20 questions from the **WRD-RAT** bank set.
- On every question, write down the invariant before the equation. Flag any question where you could not name one — that flag, not a wrong answer, is the real diagnostic.

### Next class

**Geometry 01 — Lines, Angles & Transversals.** We leave arithmetic behind, but the habit of naming the unknown and hunting the invariant carries straight over into angle chasing.
