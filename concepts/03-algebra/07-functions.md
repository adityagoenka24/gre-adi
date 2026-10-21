# Functions & Function Notation

**Section:** Algebra  |  **Bank code:** ALG-FNC  |  **GRE frequency:** High

---

## 1. Core Idea

A function is a rule that assigns **exactly one output to each input**. `f(x)` is not multiplication — it means "the output of f when the input is x".

The single most useful mental model: `f` is a machine, and `x` is whatever you feed it. Whatever appears inside the brackets replaces every x in the rule.

---

## 2. Must-Know Rules

| Concept | Meaning |
|---|---|
| f(x) | the output for input x |
| f(3) | substitute 3 for every x |
| f(a + 1) | substitute (a+1) for every x — keep the brackets |
| Domain | all allowed inputs |
| Range | all possible outputs |
| Composite f(g(x)) | apply g first, then f |
| Inverse f^(-1)(x) | swap x and y, then solve for y |
| Vertical line test | a graph is a function if no vertical line hits it twice |

**Domain restrictions — the only two the GRE tests:**

1. Denominator cannot be zero.
2. Expression under an even root cannot be negative.

For f(x) = sqrt(x - 3)/(x - 5): need x - 3 >= 0 and x not equal to 5, so the domain is x >= 3 with x not equal to 5.

**Composite functions are not commutative.** f(g(x)) is usually different from g(f(x)).

**GRE "strange symbol" functions.** The test often defines a made-up operation, e.g. "a # b = a^2 - 2b". These are just functions with unusual notation. Substitute exactly as defined and do not overthink.

---

## 3. Worked Examples

### Example 1 — Substituting an expression

*If f(x) = x^2 - 3x, find f(a + 2).*

Replace every x with (a + 2):

f(a+2) = (a+2)^2 - 3(a+2) = a^2 + 4a + 4 - 3a - 6 = **a^2 + a - 2**.

### Example 2 — Composite in both orders

*If f(x) = 2x + 1 and g(x) = x^2, find f(g(3)) and g(f(3)).*

- g(3) = 9, then f(9) = 19. So **f(g(3)) = 19**.
- f(3) = 7, then g(7) = 49. So **g(f(3)) = 49**.

Different, as expected.

### Example 3 — Strange symbol

*Define a * b = (a + b)/(a - b) for a not equal to b. Compute 5 * 3.*

(5 + 3)/(5 - 3) = 8/2 = **4**.

---

## 4. GRE Traps

- **Reading f(x) as f times x.** It is not multiplication.
- **f(a + b) = f(a) + f(b).** Almost never true. Test it: for f(x) = x^2, f(1+2) = 9 but f(1) + f(2) = 5.
- **Order in composites.** f(g(x)) applies g first — the inner one.
- **Dropping brackets when substituting.** f(x) = x^2 and input -3: f(-3) = (-3)^2 = 9, not -9.
- **Forgetting domain restrictions** — especially the denominator-zero case, which often eliminates an answer choice.
- **Assuming an inverse exists.** Only one-to-one functions have inverses (though the GRE rarely pushes on this).
- **2f(x) vs f(2x).** Different operations: one doubles the output, the other doubles the input.

---

## 5. Speed Tricks

- **Work from the inside out** for composites.
- **Cover the x with your finger.** Whatever is in the brackets goes wherever your finger was.
- **For "which function has this graph", test a single easy point** like x = 0 and eliminate.
- **For strange-symbol questions, rewrite the definition with boxes** rather than letters if students find substitution confusing: "box1 # box2 = box1^2 - 2 x box2".
- **Inverse check:** f(f^(-1)(x)) should give back x. A 10-second verification.

---

## 6. Self-Check

**Q1.** If f(x) = 3x - 4, find f(-2).

**Q2.** If f(x) = x + 3 and g(x) = 2x, what is g(f(1))?

**Q3.** What is the domain of f(x) = 1/(x^2 - 4)?

<details>
<summary>Answers</summary>

**A1.** 3(-2) - 4 = **-10**.

**A2.** f(1) = 4, then g(4) = **8**.

**A3.** x^2 - 4 = 0 at x = 2 and x = -2, so the domain is **all real numbers except 2 and -2**.

</details>

---

## 7. One-Line Summary for the Board

> f(x) is a machine, not a product. Whatever is in the brackets replaces every x. Inner function first.
