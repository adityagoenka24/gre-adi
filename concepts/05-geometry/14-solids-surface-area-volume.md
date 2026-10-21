# Solids — Surface Area & Volume

**Section:** Geometry  |  **Bank codes:** GEO-SAV, GEO-3DG, GEO-CSH  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

- **Volume** is how much a solid holds (cubic units).
- **Surface area** is the total area of its outside faces (square units).

For any **prism or cylinder** (a solid with a constant cross-section), volume is simply:

`Volume = area of the base x height`

That single formula covers cubes, boxes, cylinders and any prism.

---

## 2. Must-Know Rules

| Solid | Volume | Surface area |
|---|---|---|
| Cube (s) | s^3 | 6 s^2 |
| Rectangular box (l, w, h) | lwh | 2(lw + lh + wh) |
| Cylinder (r, h) | pi r^2 h | 2 pi r^2 + 2 pi r h |
| Cone (r, h) | (1/3) pi r^2 h | pi r^2 + pi r l (l = slant height) |
| Sphere (r) | (4/3) pi r^3 | 4 pi r^2 |
| Hemisphere (r) | (2/3) pi r^3 | 3 pi r^2 (curved + flat) |
| Prism | base area x height | 2(base area) + (perimeter x height) |
| Pyramid | (1/3)(base area)(height) | base + lateral faces |

**Diagonals:**

- Face diagonal of a cube, side s: `s sqrt(2)`
- Space diagonal of a cube, side s: `s sqrt(3)`
- Space diagonal of a box: `sqrt(l^2 + w^2 + h^2)`

**Cone slant height:** l = sqrt(r^2 + h^2), by Pythagoras.

**The one-third rule.** A cone is one third of the cylinder with the same base and height. A pyramid is one third of the prism with the same base and height.

**Scaling.** Multiply all lengths by k: surface area x k^2, volume x k^3. Doubling every dimension of a box multiplies its volume by 8.

---

## 3. Worked Examples

### Example 1 — Cylinder

*A cylinder has radius 3 and height 10. Find its volume and total surface area.*

Volume = pi(9)(10) = **90 pi**.

Surface area = 2 pi(9) + 2 pi(3)(10) = 18 pi + 60 pi = **78 pi**.

### Example 2 — Cube from volume

*A cube has volume 216. Find its surface area and its space diagonal.*

s^3 = 216 -> s = 6.

Surface area = 6(36) = **216**. (A coincidence at s = 6 — worth pointing out to students so they don't over-generalise.)

Space diagonal = 6 sqrt(3), about **10.39**.

### Example 3 — Scaling

*A sphere's radius is tripled. By what factor does its volume increase?*

Volume scales as r^3, so the factor is 3^3 = **27**.

---

## 4. GRE Traps

- **Using the diameter as the radius** in cylinder and sphere formulas.
- **Forgetting the 1/3** for cones and pyramids.
- **Using the height instead of the slant height** in a cone's lateral surface area.
- **Confusing total surface area with lateral (curved) surface area.** A closed cylinder has two circular ends; an open pipe has none.
- **Doubling a dimension doubles the volume.** Doubling *all* dimensions multiplies volume by 8; doubling only the height doubles it.
- **Mixing units.** 1 cubic metre = 1,000,000 cubic cm, not 100.
- **Sphere surface area given as 2 pi r^2.** It is 4 pi r^2.

---

## 5. Speed Tricks

- **Volume of any prism or cylinder = base area x height.** Learn it as one formula, not five.
- **Cone or pyramid? Multiply by 1/3.**
- **Space diagonal of a box = sqrt(l^2 + w^2 + h^2)** — three-dimensional Pythagoras.
- **Cube facts:** face diagonal s sqrt(2), space diagonal s sqrt(3), surface 6s^2, volume s^3.
- **For scaling questions, don't compute anything** — just apply k^2 for area and k^3 for volume.
- **Unroll the curved surface of a cylinder** into a rectangle of width 2 pi r and height h. It makes 2 pi r h obvious.

---

## 6. Self-Check

**Q1.** A rectangular box is 4 by 5 by 6. Find its volume and surface area.

**Q2.** A cone has radius 6 and height 8. Find its volume and slant height.

**Q3.** A sphere has surface area 100 pi. Find its volume.

<details>
<summary>Answers</summary>

**A1.** Volume = **120**. Surface = 2(20 + 24 + 30) = **148**.

**A2.** Volume = (1/3)pi(36)(8) = **96 pi**. Slant = sqrt(36 + 64) = **10**.

**A3.** 4 pi r^2 = 100 pi -> r = 5. Volume = (4/3)pi(125) = **500 pi/3**, about 523.6.

</details>

---

## 7. One-Line Summary for the Board

> Prism or cylinder: base area x height. Cone or pyramid: one third of that. Volume scales as k cubed.
