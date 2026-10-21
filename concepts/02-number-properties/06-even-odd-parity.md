# Even, Odd & Parity

**Section:** Number Properties  |  **Bank codes:** ARI-ODE, NUM-EOP  |  **GRE frequency:** Medium-High

---

## 1. Core Idea

Parity is whether an integer is even or odd. Parity questions are *classification* questions, not calculation questions — you never need the actual value, only whether it is even or odd.

An integer is **even** if it is divisible by 2 (form 2k), **odd** otherwise (form 2k + 1).

---

## 2. Must-Know Rules

| Operation | Result |
|---|---|
| even + even | even |
| odd + odd | **even** |
| even + odd | odd |
| even - even | even |
| odd - odd | **even** |
| even x even | even |
| even x odd | even |
| odd x odd | **odd** |
| even^n (n >= 1) | even |
| odd^n | odd |

**The two headline facts students forget:**

1. **odd + odd = even** (3 + 5 = 8)
2. **even x anything = even** — the only way to get an odd product is if *every* factor is odd.

**Division has no parity rule.** 8/4 = 2 (even), 8/2 = 4 (even), 6/2 = 3 (odd), 8/16 = 0.5 (not an integer). Never reason about parity through division.

**Special cases:**

- **0 is even.** It is 2 x 0.
- Negative integers have parity too: -6 is even, -7 is odd.
- Consecutive integers alternate parity.

**Sum of n consecutive integers:** parity depends on n and the starting value — safer to just compute.

---

## 3. Worked Examples

### Example 1 — Parity of an expression

*If a is odd and b is even, is 3a + 2b + 1 even or odd?*

- 3a: odd x odd = odd
- 2b: even x even = even
- odd + even = odd
- odd + 1 = **even**

### Example 2 — Deducing parity from a condition

*If x + y is odd, what can be said about x and y?*

Odd sums come only from even + odd. So **one is even and the other is odd** — they have opposite parity. Consequently xy is even.

### Example 3 — Must-be-true

*n is an integer. Which of these must be even: n^2 + n, n^2 + 1, 2n + 3?*

- n^2 + n = n(n+1) is the product of 2 consecutive integers -> always **even**.
- n^2 + 1: if n = 2, this is 5 (odd). Not always even.
- 2n + 3 = even + odd = always **odd**.

**Only n^2 + n.**

---

## 4. GRE Traps

- **odd + odd = odd.** No, it is even. This is the most common parity slip.
- **Forgetting 0 is even.** A question asking for "the number of even integers between -3 and 3" must count 0, -2 and 2.
- **Assuming parity rules apply to division.** They don't.
- **Assuming a variable is an integer.** Parity is defined only for integers; if the problem doesn't say "integer", parity reasoning may not apply at all.
- **Even^0.** 2^0 = 1, which is odd. The rule "even^n is even" needs n >= 1.
- **Reading "not even" as "positive odd".** Negative odd integers exist.
- **Assuming odd x odd could be even.** It never is.

---

## 5. Speed Tricks

- **Substitute the smallest cases.** Use 2 for even and 3 for odd (avoid 0 and 1 initially, then test them separately as edge cases).
- **Only the parity of each term matters** — you can throw away all coefficients that are even, because they force the term even.
- **Any term multiplied by 2 is even**, so it never affects the parity of a sum. Delete it mentally.
- **n(n+1) is always even** — remember this identity; it resolves many "must be true" questions instantly.
- **On quantitative comparison, test both parities** of any unrestricted integer variable.

---

## 6. Self-Check

**Q1.** If p is even and q is odd, what is the parity of (p + q)(p - q)?

**Q2.** Is 0 even, odd, or neither?

**Q3.** If n^2 is even, what can you say about n?

<details>
<summary>Answers</summary>

**A1.** p + q is odd; p - q is odd; odd x odd = **odd**.

**A2.** **Even** (0 = 2 x 0).

**A3.** **n is even.** If n were odd, n^2 would be odd.

</details>

---

## 7. One-Line Summary for the Board

> odd + odd = even. even x anything = even. Zero is even. Division has no parity rule.
