# Homepage slim-down — 2026-10-24

Third pass of the day, after the question purge and the de-identification. Goal: only content that
earns its place, best proof first, no dead whitespace. Verified by rendering at 1440px and 390px.

## Result

| | Before | After |
|---|---|---|
| Sections on the page | 21 | **11** |
| `index.html` | 1,091 lines | **754 lines** |
| Dead JavaScript | — | **5.7 KB removed** |
| Step cards layout | 3 + 1 orphan with a gap | **2 × 2, no orphan** |
| Horizontal scroll on phone | yes | **no** |

## New order (best proof first)

1. Top bar — *"806 questions deleted in our October 2026 ETS re-audit."*
2. Hero — defines "trap" in the first sentence; CTAs are **Get Pro** and **Start with 10 free questions**
3. Proof bar — 9,629 questions · 95 subtopics · **806 removed in the Oct 2026 audit** · 1:45 pace · 8 topics
4. **The named-trap worked example** — moved up from position 8. This is the strongest 3-second asset on the site: a real question, the answer, and the trap, all checkable without buying or believing anything.
5. Three-term glossary (trap / QC / Practice vs Exam Mode), salvaged from the cut Question Bank section
6. Start free — in the right order (Steps 1–4)
7. How this was built — the audit, i.e. the trust section that replaced the founder block
8. ETS diagnostic upload
9. Pricing + guarantee
10. Is this for you + the beginner fork
11. FAQ (5 questions) + final CTA

## Cut, and why

| Section | Reason |
|---|---|
| The Problem (3 cards) | Generic pain points, nothing a reader can check. Pure scroll cost. |
| How It Works (3 steps) | Said the same thing as the Steps 1–4 panel, 200px further down. |
| Sectional Tests (full section) | Already Step 3 of the free panel. |
| Handbook strip | Already Step 1 of the free panel. |
| Founding cohort | Overlapped "How this was built"; the stronger of the two kept. |
| Diagnostic front door | Duplicate of the diagnostic upload band. |
| Question Bank | Was a subtitle plus a glossary; glossary kept, rest dropped. |
| Mid-page CTA | Duplicate of the final CTA. |
| Full comparison table | Lives on `pricing.html`; the homepage already has the plan cards. |
| 4 of 9 FAQs | "Is it a web app", "payment methods", "what is Exam Mode" (now in the glossary), "can I buy more later". |

## Layout and whitespace

The orphaned fourth card had a specific cause: `.free-panel` was capped at **760px** while
`.free-launcher-grid` used `repeat(auto-fit, minmax(186px, 1fr))`. Four cards need 792px, so the
fourth always wrapped alone onto a second row with a gap beside it.

- `.free-panel` 760px → **960px**, padding 36px → 28px
- `.free-launcher-grid` → fixed **`repeat(2,1fr)`** (2×2 desktop, 1 column ≤760px) — orphan impossible
- `.section` margin-bottom **104px → 60px**
- `.section-sub` margin-bottom **52px → 30px**
- `.proof-bar` margin-bottom **88px → 52px**, padding 22px → 16px
- `.diff-card` padding **56px → 40px**
- `html{overflow-x:hidden}` — the decorative `.glow-1/.glow-2` blurs sit outside the viewport and were
  letting the page scroll sideways on a phone. Pre-existing, now fixed.
- Mobile: `.hero-eyebrow` was an `inline-flex` row whose two children stacked into ragged columns at
  390px (38px tall, three fragments). Now `display:block` with the leading dash hidden — **18px, one
  clean line**.

## Honesty fixes made in passing

- The showcased question was labelled **"Extreme Hard"** (the 167–170 band) but is a two-minute
  multi-step percentage question. Relabelled **Medium**. It was proving the difficulty labels are
  inflated to exactly the audience most likely to notice.
- The FAQ said all questions are "added continuously". It now says the 9,629 figure is the bank
  *after* the audit removed 806, and that anything failing a later audit gets pulled rather than left in.

## Verification

Rendered headless at 1440px and 390px: no page errors, no horizontal scroll, 4 step cards in 2 rows
on desktop and 4 on phone, all 11 reveal-on-scroll sections fire correctly, every internal anchor
(`#free`, `#how-built`, `#plans`, `#faq`) resolves, div tags balanced 165/165, all 4 inline script
blocks parse, JSON-LD valid.

Dead anchors from the cut sections were repointed: `#handbook` → `handbook/`, `#how` → `#free`,
`#bank` → `#how-built`.

## Still open

- Desktop page height is 8,116px. Most of what remains is the pricing block, which has to be there.
- The refund is still 7 days. The strategy doc recommends 30; that's a commercial decision, not made.
- Nothing is committed or pushed.
