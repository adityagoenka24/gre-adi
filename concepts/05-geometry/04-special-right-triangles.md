# Special Right Triangles

**Section:** Geometry  |  **Bank code:** GEO-SPT  |  **GRE frequency:** High

---

## 1. Core Idea

Two right triangles appear so often that their side ratios should be automatic:

- **45-45-90** (half a square): sides in the ratio `1 : 1 : sqrt(2)`
- **30-60-90** (half an equilateral triangle): sides in the ratio `1 : sqrt(3) : 2`

Recognising them means you never need Pythagoras for these shapes — and, crucially, you get an **exact** answer with a radical rather than a decimal.

---

## 2. Must-Know Rules

**45-45-90 triangle:**

| Side | Length |
|---|---|
| leg | x |
| leg | x |
| hypotenuse | x sqrt(2) |

So: hypotenuse = leg x sqrt(2), and leg = hypotenuse / sqrt(2) = hypotenuse x sqrt(2)/2.

**30-60-90 triangle:**

| Opposite | Side |
|---|---|
| 30 degrees | x (shortest) |
| 60 degrees | x sqrt(3) |
| 90 degrees | 2x (hypotenuse) |

**The anchor:** the side opposite 30 is **half the hypotenuse**. Find that side first, then everything else follows.

**Where these come from:**

- A square with side x has diagonal x sqrt(2) — the diagonal cuts it into two 45-45-90 triangles.
- An equilateral triangle with side 2x, cut in half by its altitude, gives a 30-60-90 with legs x and x sqrt(3).

**Derived formulas worth knowing:**

| Figure | Formula |
|---|---|
| Diagonal of a square, side s | s sqrt(2) |
| Altitude of an equilateral triangle, side s | s sqrt(3)/2 |
| Area of an equilateral triangle, side s | s^2 sqrt(3)/4 |

**Decimal values:** sqrt(2) ≈ 1.414, sqrt(3) ≈ 1.732.

---

## 3. Worked Examples

### Example 1 — 45-45-90

*A square has a diagonal of 10. Find its area.*

Diagonal = s sqrt(2) = 10, so s = 10/sqrt(2) = 5 sqrt(2).

Area = s^2 = (5 sqrt(2))^2 = 25 x 2 = **50**.

Faster: for a square, area = d^2/2 = 100/2 = 50.

### Example 2 — 30-60-90

*In a 30-60-90 triangle, the hypotenuse is 14. Find the other two sides.*

Side opposite 30 = half the hypotenuse = **7**.

Side opposite 60 = 7 sqrt(3), which is about **12.12**.

### Example 3 — Equilateral triangle

*An equilateral triangle has side 6. Find its altitude and area.*

Altitude = 6 sqrt(3)/2 = **3 sqrt(3)** (about 5.20).

Area = (1/2)(6)(3 sqrt(3)) = **9 sqrt(3)** (about 15.59).

Or directly: s^2 sqrt(3)/4 = 36 sqrt(3)/4 = 9 sqrt(3). Same.

---

## 4. GRE Traps

- **Assigning sqrt(3) to the wrong side.** It goes with the 60-degree angle, not the 30. The shortest side (opposite 30) has no radical.
- **Multiplying by sqrt(2) instead of dividing.** Going from hypotenuse to leg, you divide.
- **Assuming a triangle is 30-60-90 because it looks like it.** Confirm from a marked angle or an equilateral half.
- **Approximating too early.** Keep sqrt(2) and sqrt(3) symbolic; GRE answers usually contain them.
- **Confusing the altitude of an equilateral triangle with its side.** The altitude is s sqrt(3)/2, always less than s.
- **Using 1 : 2 : 3 for a 30-60-90.** The ratio is 1 : sqrt(3) : 2.

---

## 5. Speed Tricks

- **For a 30-60-90, find the short side first** (half the hypotenuse). Everything else is that number times 1, sqrt(3) or 2.
- **Square area from the diagonal: d^2/2.** No radicals at all.
- **Equilateral area: s^2 sqrt(3)/4.** Memorise it; deriving it costs 40 seconds.
- **Spot the half-square and half-equilateral** whenever a figure is cut by a diagonal or an altitude.
- **sqrt(2) ≈ 1.4, sqrt(3) ≈ 1.7** for quick estimation and elimination.
- **A 45-45-90 is isosceles** — the two legs are equal, which is often the missing fact.

---

## 6. Self-Check

**Q1.** A 45-45-90 triangle has a leg of 6. Find the hypotenuse.

**Q2.** A 30-60-90 triangle has its shortest side equal to 5. Find the other two sides.

**Q3.** An equilateral triangle has area 16 sqrt(3). Find its side.

<details>
<summary>Answers</summary>

**A1.** 6 sqrt(2), about **8.49**.

**A2.** Hypotenuse = 10; middle side = **5 sqrt(3)** (about 8.66).

**A3.** s^2 sqrt(3)/4 = 16 sqrt(3) -> s^2 = 64 -> **s = 8**.

</details>

---

## 7. One-Line Summary for the Board

> 45-45-90 is 1 : 1 : sqrt(2). 30-60-90 is 1 : sqrt(3) : 2, and the side opposite 30 is half the hypotenuse.
