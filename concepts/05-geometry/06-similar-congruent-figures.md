# Similar & Congruent Figures

**Section:** Geometry  |  **Bank code:** GEO-SCF  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

- **Congruent** = same shape **and** same size. Corresponding sides and angles are all equal.
- **Similar** = same shape, possibly different size. Corresponding **angles are equal**, and corresponding **sides are in a constant ratio**.

The GRE tests similarity far more than congruence, and almost always through the **scale factor**:

| If lengths scale by k | then |
|---|---|
| areas scale by | k^2 |
| volumes scale by | k^3 |

---

## 2. Must-Know Rules

**Proving triangles similar** (any one is enough):

| Test | Meaning |
|---|---|
| AA | two pairs of equal angles |
| SSS | all three side pairs in the same ratio |
| SAS | two side pairs in ratio with the included angles equal |

**AA is the workhorse.** Because angles sum to 180, two equal angle pairs force the third — so two equal angles are enough.

**Proving triangles congruent:** SSS, SAS, ASA, AAS, and RHS (right angle, hypotenuse, side). Note **SSA is not a valid test**, and neither is AAA (that gives similarity, not congruence).

**Where similar triangles hide:**

- A line drawn parallel to one side of a triangle cuts off a similar triangle.
- The altitude to the hypotenuse of a right triangle creates two triangles similar to the original and to each other.
- Overlapping or "hourglass" (X-shaped) figures formed by two intersecting lines between parallels.

**Setting up the proportion.** Write corresponding vertices in the same order: if triangle ABC ~ triangle DEF, then AB/DE = BC/EF = AC/DF.

---

## 3. Worked Examples

### Example 1 — Parallel line inside a triangle

*In triangle ABC, DE is parallel to BC with D on AB and E on AC. AD = 4, DB = 6, and AE = 5. Find EC.*

Triangle ADE ~ triangle ABC (AA, because DE is parallel to BC).

AD/AB = AE/AC -> 4/10 = 5/AC -> AC = 12.5.

EC = AC - AE = 12.5 - 5 = **7.5**.

### Example 2 — Area scale factor

*Two similar triangles have corresponding sides 6 and 9. If the smaller has area 20, what is the area of the larger?*

Scale factor k = 9/6 = 3/2.

Area ratio = k^2 = 9/4.

Larger area = 20 x 9/4 = **45**.

### Example 3 — Shadow problem

*A 1.8 m person casts a 2.4 m shadow. At the same moment, a tree casts a 20 m shadow. How tall is the tree?*

The sun's rays are parallel, so the two triangles are similar.

h/20 = 1.8/2.4 -> h = 20 x 0.75 = **15 m**.

---

## 4. GRE Traps

- **Using the linear ratio for areas.** If sides are 2 : 3, areas are 4 : 9, not 2 : 3. This is the number-one trap in the topic.
- **Using the area ratio for sides.** Reverse of the same error — if areas are 16 : 25, sides are 4 : 5.
- **Mismatched correspondence.** AB/DE must pair the correct vertices; writing AB/EF gives nonsense.
- **Assuming similarity from appearance.** You need equal angles or proportional sides.
- **SSA treated as a congruence test.** It is not.
- **Assuming similar means congruent.** Similar figures can differ wildly in size.
- **Perimeter ratio.** Perimeters scale like lengths (k), not like areas (k^2).

---

## 5. Speed Tricks

- **Look for parallel lines** — they generate similar triangles automatically.
- **Look for a shared angle** plus one more equal angle; that is AA in two seconds.
- **Memorise 1-2-3:** lengths scale as k^1, areas as k^2, volumes as k^3.
- **Write the similarity statement with matching letters** before writing any ratio.
- **Redraw the two triangles separately,** in the same orientation. Overlapping figures cause most correspondence errors.
- **For shadow, ladder and mirror problems, similarity is nearly always the intended method.**

---

## 6. Self-Check

**Q1.** Two similar rectangles have sides in the ratio 3 : 5. What is the ratio of their areas?

**Q2.** Two similar solids have volumes in the ratio 8 : 27. What is the ratio of their surface areas?

**Q3.** In triangle PQR, ST is parallel to QR with S on PQ, T on PR. PS = 3, SQ = 6, ST = 4. Find QR.

<details>
<summary>Answers</summary>

**A1.** 3^2 : 5^2 = **9 : 25**.

**A2.** Linear ratio = cube roots: 2 : 3. Surface areas = 2^2 : 3^2 = **4 : 9**.

**A3.** PS/PQ = ST/QR -> 3/9 = 4/QR -> **QR = 12**.

</details>

---

## 7. One-Line Summary for the Board

> Similar means equal angles and proportional sides. Lengths k, areas k squared, volumes k cubed.
