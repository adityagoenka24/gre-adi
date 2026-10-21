# Ratios & Proportions — Full Lecture

**Section:** Arithmetic · **Bank code:** ARI-RAT · **GRE frequency:** High · **Class length:** ~75 min

> **Thesis of the whole lesson:** a ratio is not an amount. Until you have written `ak` and `bk` you have no numbers at all — and every ratio error is either forgetting that, or confusing a part with the whole.

---

## How to use this capsule

Read straight through, it is a lecture script with timings. Sections are numbered in teaching order, and each opens with a time budget.

Three kinds of block appear throughout:

- **Teaching note** — what to say, what to ask, where to pause. Written for the teacher, but students self-studying should read them too: they name the mistake before you make it.
- **Board** — the one line worth writing on the whiteboard.
- **Answers** are hidden inside collapsible blocks so you can attempt first.

**Running time:** hook 3 · foundation 11 · machinery 23 · worked examples 20 · practice 5 · traps & tricks 11 · challenge 15 · close 5.

---

## 0. The Hook — why ratios are everywhere *(3 min)*

A ratio is the most compressed way to state a relationship, which is exactly why the GRE loves it: it hands you a relationship and withholds the sizes.

| Where ratios resurface | How |
|---|---|
| Mixtures & solutions | Milk to water, alcohol to solvent — pure ratio work |
| Rates & work | Inverse proportion: more workers, less time |
| Geometry | Similar figures scale by k, k^2, k^3 |
| Data Interpretation | "The ratio of A to B in 2019 was…" on almost every set |
| Statistics | Weighted averages are ratios of group sizes |

> **Teaching note.** Open with a question that has no answer. *"In a class the ratio of boys to girls is 3 : 5. How many boys are there?"* Wait. Somebody will say 3. Somebody will say "you can't tell". Praise the second and make the first say why 3 is wrong — because 6 and 10, or 30 and 50, fit just as well. That one exchange sets up the entire class: a ratio constrains the *relationship*, and you need one extra fact to pin down the *sizes*.

> **Board.** A ratio is not an amount. Write ak and bk, then use the extra fact to find k.

---

## 1. Core Idea — name the multiplier *(6 min)*

```
a : b   means the quantities are   ak   and   bk   for some positive k
```

Introducing k is the single most powerful move in this topic. It converts a vague relationship into an equation with one unknown, and every ratio problem you will ever see then becomes "find k".

If boys : girls = 3 : 5, write boys = 3k and girls = 5k, so the total is 8k. Then *"there are 12 more girls than boys"* gives 5k − 3k = 12, so k = 6 and the class is 18 and 30. Whereas *"there are 40 students"* gives 8k = 40, so k = 5 and the class is 15 and 25. Same ratio, different extra fact, different sizes: the ratio was never the answer, it was the shape of the answer.

**Part-to-part versus part-to-whole.** The colon gives you part-to-part. To get a fraction of the whole, put the part over the *sum of all parts*.

```
boys : girls = 3 : 5   ->   boys are 3/8 of the class, NOT 3/5
```

> **Teaching note.** Write `3 : 5` on the board and ask two questions in quick succession. *"Boys are what fraction of girls?"* → 3/5. *"Boys are what fraction of the class?"* → 3/8. Both are legitimate readings of the same ratio, and the question decides which one you want. Students who answer 3/5 to the second question are not careless — they simply never separated the two readings. Separate them now, out loud, and make them write both fractions down.

---

## 2. Diagnose First — the four question types *(5 min)*

| # | Type | Sounds like | First move |
|---|---|---|---|
| 1 | **Split a total** | $4,800 in the ratio 3 : 5 : 8 | Sum the parts, divide, scale |
| 2 | **Find the missing quantity** | Flour : sugar = 7 : 3, 2.1 kg flour, how much sugar? | Set up a proportion, cross-multiply |
| 3 | **Chain two ratios** | A : B = 2 : 3 and B : C = 4 : 5 | Scale so the shared term matches |
| 4 | **The ratio changes** | Add 10 red marbles and it becomes 4 : 3 | Write ak and bk, change only what moved |

Type 4 is where the marks are. It is the only one where you must decide, carefully, which quantity the new information touches.

> **Teaching note.** Thirty-second drill: call out stems and have the room shout the type number only. *"Divide 91 sweets between two children in the ratio 4 : 3"* → Type 1. *"Two similar cones, heights 3 : 4, volumes?"* → Type 2 (a proportion with a power). *"A : B = 5 : 7 and B : C = 14 : 9"* → Type 3. *"After 6 boys leave, the ratio becomes 1 : 2"* → Type 4. Classifying first is what stops students writing (2k+10)/(3k+10) when only the reds changed.

---

## 3. Splitting a Total — the parts method *(6 min)*

If a quantity T is split in the ratio `a : b : c`, then:

| Concept | Rule |
|---|---|
| Total parts | a + b + c |
| Value of one part | T / (a + b + c) |
| The share of the first | a/(a+b+c) × T |
| Part-to-whole fraction | (that part) / (sum of parts) |

That is the whole of Type 1. Sum, divide, scale.

**A free error-check:** if T does not divide neatly by the sum of the parts, either you have misread the ratio or the parts are not in lowest terms. On the GRE, Type 1 answers are almost always clean.

> **Teaching note.** Ask what happens if the ratio is given as 6 : 10 : 16 rather than 3 : 5 : 8. Nothing — the parts sum to 32 instead of 16, one part is half as big, and the shares are identical. Reduce first and the arithmetic stays small.

---

## 4. Proportions — direct, inverse, and cross-multiplication *(10 min)*

A proportion is a statement that two ratios are equal.

```
a/b = c/d      ->      ad = bc
```

**Direct proportion** means the *ratio* is constant: `y = kx`, so y/x never changes and doubling x doubles y. Recipes, prices, distance at fixed speed.

**Inverse proportion** means the *product* is constant: `xy = k`, so doubling x halves y. Workers and time on a fixed job, speed and time over a fixed distance, people and each person's share.

| Test | Direct | Inverse |
|---|---|---|
| What stays constant? | the quotient y/x | the product xy |
| Double one quantity | the other doubles | the other halves |
| Typical GRE dressing | recipes, prices, scale drawings | workers, speeds, pipes, shares |

**The decisive question is always: does the answer get bigger or smaller?** More workers on the same job must take *less* time. If your arithmetic says otherwise, you have used the wrong proportion — do not check the algebra, check the direction.

### Powers of the scale factor

For similar figures — same shape, different size — everything scales by a power of the linear ratio k:

| Quantity | Scales as |
|---|---|
| Length, perimeter, radius, height | k |
| Area, surface area | k^2 |
| Volume, mass, capacity | k^3 |

Memorise it as **1-2-3 powers**. Sides in ratio 2 : 3 → areas in ratio 4 : 9 → volumes in ratio 8 : 27.

> **Teaching note.** Do not let this be a memorised list. Draw a 1 × 1 square and a 2 × 2 square. The side doubled; ask how many of the small square fit in the big one. Four. Then say "now imagine cubes" — eight. The powers come from the number of dimensions, and a student who has seen the squares fit will never mix up k^2 and k^3 again. Then run it backwards, which is what the GRE actually asks: areas in ratio 49 : 81 means lengths in ratio 7 : 9.

> **Board.** Length k, area k^2, volume k^3. Run it backwards by taking roots.

---

## 5. Chaining Ratios and Tracking the Invariant *(7 min)*

### Chaining

To combine `A : B` and `B : C`, scale each so the shared term B matches. Use the LCM of the two B values.

*A : B = 2 : 3 and B : C = 4 : 5.* B is 3 in one and 4 in the other; LCM(3, 4) = 12.

```
A : B  =  2 : 3   ×4   ->   8 : 12
B : C  =  4 : 5   ×3   ->        12 : 15
A : B : C  =  8 : 12 : 15
```

**Not 2 : 3 : 5.** Sticking the ratios together without matching the shared term is the most common error in this topic.

### The invariant

In a problem where a mixture or a group *changes*, one quantity almost always stays fixed. Find it and anchor everything to it.

| Situation | What does not change |
|---|---|
| Water added to a milk-water mixture | the amount of milk |
| Boys leave a class | the number of girls |
| A solution is diluted | the mass of solute |
| Money is redistributed between two people | the total |

Once you have named the invariant, you have a second equation for free.

> **Teaching note.** Demonstrate the invariant with your hands. Hold up a jug: *"I pour in water. What is the same before and after?"* The milk. Write "milk = 30 litres, before and after" on the board and leave it there for the rest of the section. Students who anchor to the invariant solve mixture problems in two lines; students who don't write three equations and lose the thread.

---

## 6. Worked Examples *(20 min)*

State the method out loud *before* touching arithmetic.

### Example 1 — splitting a total *(Type 1)*

*$4,800 is divided among P, Q and R in the ratio 3 : 5 : 8. How much does Q get?*

**Step 1 — sum the parts.** 3 + 5 + 8 = 16.

**Step 2 — one part.** 4800 / 16 = 300.

**Step 3 — scale Q's share.** Q gets 5 × 300 = **$1,500**.

**Check:** 900 + 1,500 + 2,400 = 4,800. ✓

> **Teaching note.** Always close a Type 1 problem by adding the shares back to the total. It costs four seconds and it catches the two errors that actually happen: multiplying by the wrong part, and summing the parts wrongly. Ask also for Q's share as a fraction of the total — 5/16 — so the part-to-whole reading gets rehearsed rather than just stated.

---

### Example 2 — the ratio changes *(Type 4)*

*In a bag, red : blue marbles = 2 : 3. After adding 10 red marbles the ratio becomes 4 : 3. How many blue marbles are there?*

**Step 1 — name k.** Red = 2k, blue = 3k.

**Step 2 — change only what moved.** Ten reds were added; the blues were untouched.

```
(2k + 10) / (3k) = 4/3
```

**Step 3 — cross-multiply and solve.**

```
3(2k + 10) = 12k
6k + 30 = 12k
6k = 30
k = 5
```

**Step 4 — answer the question asked.** Blue = 3k = **15**.

**Check:** red was 10, now 20; and 20 : 15 = 4 : 3. ✓

> **Teaching note.** Before solving, write the wrong equation on the board — `(2k + 10)/(3k + 10) = 4/3` — and ask what is wrong with it. Then solve it anyway: it gives k = −5/3, a negative number of marbles. A wrong model producing an impossible answer is the most persuasive correction available; use it. Also note the trap of stopping at k = 5 and calling that the answer. The question asked for blue.

---

### Example 3 — inverse proportion *(Type 2)*

*8 workers build a wall in 15 days. How long do 12 workers take, at the same rate?*

**Step 1 — decide the direction first.** More workers, so fewer days. The answer must be **below 15**.

**Step 2 — inverse means the product is constant.** Workers × days = total work.

```
8 × 15 = 120 worker-days
12 × days = 120
days = 10
```

**Answer: 10 days**, which is indeed below 15. ✓

> **Teaching note.** Insist on step 1 every time, out loud, before any arithmetic. The trap answer here is 22.5 days, from setting up 8/15 = 12/d as a direct proportion. It is instantly killed by the direction check, and no algebra is needed to kill it. "Worker-days" is also worth writing on the board as a unit — it makes the constant feel like a real quantity rather than a trick.

---

### Example 4 — chaining, then using the gap *(Type 3)*

*A : B = 2 : 3 and B : C = 4 : 5. If C exceeds A by 42, find B.*

**Step 1 — match the shared term.** B is 3 and 4; LCM is 12.

```
A : B = 8 : 12          B : C = 12 : 15          A : B : C = 8 : 12 : 15
```

**Step 2 — introduce k.** A = 8k, B = 12k, C = 15k.

**Step 3 — use the extra fact.**

```
C − A = 15k − 8k = 7k = 42   ->   k = 6
```

**Step 4 — answer.** B = 12 × 6 = **72**.

**Check:** A = 48, C = 90, and 90 − 48 = 42. Also 48 : 72 = 2 : 3 ✓ and 72 : 90 = 4 : 5 ✓.

> **Teaching note.** Two failure points, both worth pre-empting. First, writing A : B : C = 2 : 3 : 5 by just borrowing the C. Second, forgetting to re-scale the *first* ratio as well as the second — students multiply B : C by 3 and leave A : B alone. Make them say aloud which number the LCM is replacing, in both ratios, before they write anything.

---

### Example 5 — running the scale factor backwards *(Type 2)*

*Two similar triangles have areas 49 cm^2 and 81 cm^2. The perimeter of the smaller is 35 cm. What is the perimeter of the larger?*

**Step 1 — areas scale as k^2, so take the square root.**

```
area ratio 49 : 81   ->   linear ratio 7 : 9
```

**Step 2 — perimeter is a length, so it scales as k, not k^2.**

```
35 × 9/7 = 45
```

**Answer: 45 cm.**

> **Teaching note.** The trap answer is 35 × 81/49 ≈ 57.9, from applying the *area* ratio to a *length*. Ask the class which of perimeter and area is a length before they compute — perimeter is a sum of sides, so it is a length, so it scales linearly. Getting them to classify the quantity first (length, area or volume) is the whole skill; the arithmetic is trivial once classified.

---

### Example 6 — mixtures and the invariant *(Type 4)*

*A 40-litre mixture of milk and water is in the ratio 3 : 1. How much water must be added to make the ratio 3 : 2?*

**Step 1 — get the actual amounts.** Parts sum to 4, so one part is 10 litres. Milk = 30 L, water = 10 L.

**Step 2 — name the invariant.** Only water is added, so **milk stays at 30 litres**.

**Step 3 — use the new ratio against the fixed milk.** Milk : water = 3 : 2 with milk = 30 means water must be 20 L.

**Step 4 — answer the question asked.** Water added = 20 − 10 = **10 litres**.

**Check:** the new mixture is 30 milk and 20 water, total 50 L, and 30 : 20 = 3 : 2. ✓

> **Teaching note.** The classic wrong answer is 20 — the new water amount rather than the amount *added*. Read the final question aloud twice. Then extend: *"What if instead we wanted milk to be 50% of the mixture?"* Milk 30 must equal half the total, so total = 60, water = 30, add 20 litres. Same invariant, and it shows the bridge between ratio language and percent language.

---

## 7. Practice Pause *(5 min)*

Three minutes on the clock, no calculator. **Name the type first.**

1. A : B = 5 : 7 and B : C = 14 : 9. Find A : B : C.
2. A recipe uses flour and sugar in ratio 7 : 3. If 2.1 kg of flour is used, how much sugar is needed?
3. Two similar cylinders have heights in ratio 3 : 4. What is the ratio of their volumes?

<details>
<summary>Answers</summary>

**1.** B is 7 in the first ratio and 14 in the second. Scale the first by 2: A : B = 10 : 14. So **A : B : C = 10 : 14 : 9**. *(Type 3. Note the LCM of 7 and 14 is just 14, so only one ratio needs scaling.)*

**2.** 7 parts = 2.1 kg, so 1 part = 0.3 kg. Sugar = 3 × 0.3 = **0.9 kg**. *(Type 2. Direct proportion — more flour, more sugar.)*

**3.** Volume scales as the cube: 3^3 : 4^3 = **27 : 64**. *(Type 2 with a power. Not 3 : 4, and not 9 : 16.)*

</details>

> **Teaching note.** Stay quiet and walk the room. Q1 catches anyone gluing ratios together as 5 : 7 : 9. Q3 catches anyone who reached for k^2 out of habit — squaring is the reflex because area comes up more often in class, but the question says cylinders and volumes. Before revealing, ask one student for the *invariant or shared term* in each question rather than the answer.

---

## 8. The Six Traps *(6 min)*

| # | Trap | ✗ Wrong | ✓ Right |
|---|---|---|---|
| 1 | Part-to-part read as part-to-whole | boys : girls = 2 : 3, so boys are 2/3 of the class | boys are 2/5 of the class |
| 2 | Changing both parts when only one moved | (2k + 10)/(3k + 10) = 4/3 | (2k + 10)/(3k) = 4/3 |
| 3 | Chaining without matching the shared term | A:B = 2:3, B:C = 4:5, so A:B:C = 2:3:5 | scale to 8 : 12 : 15 |
| 4 | Reading the ratio as the amounts | 3 : 5 means 3 boys and 5 girls | it means 3k and 5k for some k |
| 5 | Direct used where inverse belongs | 12 workers take 15 × 12/8 = 22.5 days | 12 workers take 15 × 8/12 = 10 days |
| 6 | Forgetting to square or cube | sides 2 : 3, so areas 2 : 3 | sides 2 : 3, so areas 4 : 9, volumes 8 : 27 |

> **Teaching note.** For each, name why the wrong side is tempting. Trap 1 tempts because the numbers in front of you are 2 and 3, and 5 is nowhere on the page. Trap 2 tempts because symmetry feels right. Trap 5 tempts because "proportion" gets read as "direct proportion" by default. Trap 6 tempts because 2 : 3 is the only ratio the question printed. Make the room say each temptation back to you.

---

## 9. Speed Tricks and Habits *(5 min)*

**Tricks:**

- **Always name k**, even on easy problems. It turns a ratio problem into an equation problem, and equations are safe.
- **The sum of the parts divides the total.** If it doesn't divide cleanly, you have misread the ratio or forgotten to reduce it.
- **To compare two ratios, cross-multiply** exactly as with fractions: 5 : 8 versus 7 : 11 → 55 versus 56.
- **1-2-3 powers for similar figures:** length k, area k^2, volume k^3. Take roots to run it backwards.
- **In any mixture or change problem, track the quantity that does not change** — usually the pure solute, or the group nobody joined or left.

**Habits that separate 160 from 167:**

| Habit | Why |
|---|---|
| Predict the direction before computing | "More workers, fewer days" kills the direct/inverse trap without algebra |
| Re-read the final sentence before answering | Ratio problems routinely ask for the amount *added*, or for B when you solved for k |
| Reduce the ratio before introducing k | 6 : 10 : 16 and 3 : 5 : 8 give the same shares with half the arithmetic |

> **Teaching note.** Demonstrate the "sum of parts divides the total" check live. Offer: *"$500 divided in the ratio 3 : 5 : 8."* Parts sum to 16, and 500/16 = 31.25 — untidy, so on a real GRE question you would re-read the stem. It is not a proof of error, but it is a strong signal, and signals are what you want at speed.

---

## 10. Challenge Set — 165+ *(15 min)*

Four problems at the difficulty where marks are actually won. Give the class four minutes each before solving.

### Challenge 1 — successive replacement

*A 60-litre vessel is full of pure alcohol. 15 litres are drawn off and replaced with water. Then 15 litres of the resulting mixture are drawn off and again replaced with water. How much pure alcohol remains?*

> **Nudge:** the second draw removes a *mixture*, not pure alcohol. Think in multipliers, not subtractions.

<details>
<summary>Solution</summary>

**Step 1 — see the operation as a multiplier.** Removing 15 of 60 litres removes one quarter of *whatever is in there*, leaving three quarters. Topping up with water does not change the alcohol.

```
each cycle:  alcohol  ×  3/4
```

**Step 2 — apply it twice.**

```
60 × (3/4) × (3/4) = 60 × 9/16 = 33.75 litres
```

**Step 3 — verify the long way.** After the first cycle: 45 L alcohol, 15 L water. The second draw of 15 L is 3/4 alcohol, so it removes 11.25 L of alcohol, leaving 45 − 11.25 = **33.75 L**. ✓

</details>

> **Teaching note.** The wrong turn is 60 − 15 − 15 = 30, which treats the second draw as pure alcohol. Ask directly: *"When you scoop the second 15 litres, what is in the scoop?"* Once someone says "a mixture", the problem is over. Then name the general formula — after n replacements of size r from a vessel of size V, the original substance is V(1 − r/V)^n — and point out it is the multiplier chain from Percentages wearing a chemistry costume.

---

### Challenge 2 — a ratio at two points in time

*The present ages of a father and his son are in the ratio 7 : 2. In 12 years the ratio will be 2 : 1. How old is the son now?*

> **Nudge:** twelve years pass for both of them. Only one k, used twice.

<details>
<summary>Solution</summary>

**Step 1 — name k.** Father = 7k, son = 2k.

**Step 2 — age both by 12.** Father = 7k + 12, son = 2k + 12.

**Step 3 — impose the new ratio.**

```
(7k + 12) / (2k + 12) = 2/1
7k + 12 = 2(2k + 12) = 4k + 24
3k = 12
k = 4
```

**Step 4 — answer the question asked.** Son = 2k = **8 years old**. (Father is 28.)

**Check:** in 12 years they are 40 and 20, and 40 : 20 = 2 : 1. ✓

</details>

> **Teaching note.** Contrast this directly with Example 2. There, only one quantity changed and adding 10 to both was the error. Here, *both* change, because time passes for everyone — and a student who over-learned Example 2 will now wrongly add 12 to only one of them. The rule is not "change one" or "change both"; the rule is **read what actually happened**. Put the two problems side by side on the board.

---

### Challenge 3 — inverse proportion with an unknown workforce

*A certain number of workers can finish a job in 30 days. If 5 more workers were on the team, the job would take 5 days less. How many workers are on the team?*

> **Nudge:** the job is the same size both ways. Write it twice.

<details>
<summary>Solution</summary>

**Step 1 — the job is the invariant.** Workers × days is the same in both scenarios.

**Step 2 — write both.** Let there be w workers.

```
w × 30 = (w + 5) × 25
```

**Step 3 — solve.**

```
30w = 25w + 125
5w = 125
w = 25
```

**Answer: 25 workers.**

**Check:** 25 × 30 = 750 worker-days; 30 × 25 = 750 worker-days. ✓

</details>

> **Teaching note.** The wrong turn is setting up a proportion between the *changes* — "5 more workers saves 5 days, so 10 more saves 10 days". Test that claim live: 35 workers would need 750/35 ≈ 21.4 days, not 20. Savings from extra workers shrink as the team grows, because inverse proportion is a curve, not a line. That single observation is worth more than the answer.

---

### Challenge 4 — chaining with a difference

*A bag holds red, blue and green marbles. Red : blue = 3 : 4 and blue : green = 6 : 5. There are 20 more blue marbles than green. How many marbles are in the bag altogether?*

> **Nudge:** blue is the shared term, and it is 4 in one ratio and 6 in the other.

<details>
<summary>Solution</summary>

**Step 1 — match the shared term.** LCM(4, 6) = 12.

```
red : blue    = 3 : 4   ×3   ->   9 : 12
blue : green  = 6 : 5   ×2   ->        12 : 10
red : blue : green  =  9 : 12 : 10
```

**Step 2 — introduce k.** Red = 9k, blue = 12k, green = 10k.

**Step 3 — use the difference.**

```
blue − green = 12k − 10k = 2k = 20   ->   k = 10
```

**Step 4 — total.** (9 + 12 + 10)k = 31 × 10 = **310 marbles**.

**Check:** red 90, blue 120, green 100. Then 90 : 120 = 3 : 4 ✓, 120 : 100 = 6 : 5 ✓, and 120 − 100 = 20 ✓.

</details>

> **Teaching note.** Watch for two things. First, students who scale only the second ratio and get 3 : 4 : … stuck. Second, students who find k = 10 and hand in 10, or hand in the blue count. The habit to build is: circle the final question before starting, and check your answer against that circle. Extension: what fraction of the bag is green? 10/31 — a reminder that part-to-whole always uses the *sum* of the parts.

---

## 11. Exit Ticket *(3 min)*

No calculator, no written working.

1. If a : b = 3 : 7 and a = 12, what is b?
2. 6 machines complete a job in 10 hours. How long would 15 machines take?
3. Two similar squares have sides in the ratio 2 : 5. What is the ratio of their areas?
4. If x : y = 5 : 3, what fraction of the total is x?

<details>
<summary>Answers</summary>

**1.** One part = 12/3 = 4, so b = 7 × 4 = **28**.

**2.** Inverse: 6 × 10 = 60 machine-hours, so 60/15 = **4 hours**. *(Fewer hours, as it must be.)*

**3.** Areas scale as k^2: 2^2 : 5^2 = **4 : 25**.

**4.** Total parts = 5 + 3 = 8, so x is **5/8** of the total. *(Not 5/3 — that is x as a fraction of y.)*

</details>

> **Teaching note.** Slips of paper at the door. Q1 and Q2 should be universal. **Q3 and Q4 are the diagnostic ones** — Q3 tests the power of the scale factor, Q4 tests part-to-whole, and those two are the errors that survive into Word Problems and Geometry. Anyone who wrote 5/3 on Q4 needs section 1 again before the next class.

---

## 12. Close *(2 min)*

### Three sentences to take away

1. **A ratio is not an amount — write ak and bk.** The extra fact in the question exists to give you k, and nothing can be computed until you have it.
2. **Part-to-part is not part-to-whole.** 2 : 3 means two fifths of the total, and the 5 is nowhere printed in the question.
3. **Ask whether the answer should grow or shrink before you compute.** That single question separates direct from inverse and kills the most common trap in the topic.

### Homework

- Re-read sections 4 and 5 of this capsule.
- Attempt 20 questions from the **ARI-RAT** bank set.
- For every mixture or change question, write one line naming the invariant before you solve it. If you cannot name it, that is the question to bring to class.

### Next class

**Arithmetic 04 — Exponents & Roots**, where the 1-2-3 powers of the scale factor turn into the general rules for manipulating any power at all.
