# GRE Quant Formula & Revision Handbook — build handoff (2026-10-24)

A free, public, printable revision handbook at `/handbook/`, built because students asked for
"one thing to revise everything from" before mocks and before the real exam.

Everything below is **uncommitted in the working tree**.

## What shipped

| Path | What it is |
|---|---|
| `concepts/handbook/HANDBOOK.md` | **The single source of truth.** 28,050 words, 9 sections + appendix. |
| `concepts/build_handbook.py` | Builds the page and (with `--pdf`) the PDF from that one file. |
| `handbook/index.html` | The public page. Generated — **never hand-edit it.** |
| `handbook/handbook.css` | Screen + print stylesheet. Generated. |
| `handbook/gre-quant-formula-handbook.pdf` | 63 pages, A4, 904 KB. |
| `cloudflare/worker.js` | Patched: `POST /lead`, `GET /admin/leads`. Backup at `worker.js.bak_pre_lead_2026-10-24`. |
| `sitemap.xml` | `/handbook/` added at priority 0.9. |
| `index.html`, `diagnostic.html` | Nav and mobile menu now club **Concept Notes + Handbook** under one "Study Material" dropdown, mirroring "Free Practice". Backups: `*.bak_pre_study_2026-10-24`. |
| `index.html` `#study` | New "Study Material" section directly below the ETS diagnostic band and above Free Practice: two cards (Concept Notes, Handbook), tracked as `study_concepts_clicked` / `study_handbook_clicked`. |
| `cloudflare/admin.html` | New **Leads** tab. Backup at `admin.html.bak_pre_leads_2026-10-24`. |
| `concepts/handbook/_patch_*.py` | The three patch scripts. Idempotent; kept for the record. |

To rebuild after editing the markdown:

```
python3 concepts/build_handbook.py          # page only
python3 concepts/build_handbook.py --pdf    # page + PDF (needs playwright)
```

The PDF in the repo was rendered with headless Chromium in a cloud container. `--pdf` on the Mac
needs `pip3 install playwright && python3 -m playwright install chromium`; without it the HTML still
builds and the committed PDF is left alone.

## Structure

Section A is the test itself — timing, the four formats, the quantitative-comparison method, the
test-day rules. Sections 1–8 are the content areas, each subtopic in the same three blocks:
**Formulas and rules**, **Traps**, **Speed**. Section 9 is the 25 traps that cost the most marks,
consolidated. The Appendix is pure recall material — squares, cubes, primes, the
fraction/decimal/percent table, roots, triples, polygon angles, factorials, normal-curve bands,
conversions.

Three reading modes are stated up front, because 63 pages is not a "quick" revision on its own:
90 minutes front to back, 25 minutes reading only the **Formulas and rules** boxes, 10 minutes for
Section A + Section 9 + the Appendix.

## Content decisions

- **Condensed from the 75 capsules**, not re-authored, so notation and terminology match `/learn/`.
- **The 2026-10-22 wording contract is applied**: US spelling, "Quantity A/B" never "Column A/B", no
  contractions, `xy`-plane. Off-syllabus routes are kept out — no modular notation, no naming of
  Vieta, no trigonometry, no logarithms, no Heron, no incenter/circumcenter terminology.
- **Heron's formula is deliberately absent** even though `02-triangles-fundamentals.md` carries it
  (see defects below).
- Math is plain text (`sqrt(x)`, `x^2`, `pi`), as in the capsules, so it survives print, phone and
  WhatsApp. No KaTeX on this page.

## Verification

Three independent agents re-derived every formula, identity, worked example and appendix value in
sympy and by brute force, each seeing only the finished handbook and not the drafting. **Eight
defects were found and all eight are fixed**, plus seven ambiguous claims that were tightened.

The appendix came back clean on the first pass: squares, cubes, all four powers rows, the 25 primes,
all 23 fraction rows, the roots, all 14 triples and their multiples, the polygon table (24/24 cells),
factorials and the `C(n,2)` values. The quadrilateral properties table was re-derived from coordinate
models, 28/28 cells correct.

## Five defects this surfaced in the capsules — these are live on the site

The handbook was corrected; **the capsules and their built `/learn/` pages were not touched.**

1. **`05-geometry/01-lines-angles.md`** — says GRE figures "are drawn to scale unless stated
   otherwise" and tells students to judge angles by eye. ETS says the opposite: geometric figures are
   **not necessarily drawn to scale**; only coordinate systems, number lines and data graphs are.
   This one teaches a method that loses marks. Highest priority.
2. **`07-statistics-probability/07-combinations.md`** — "A committee of 3 from 9 is 126". It is
   **84**. (126 is `C(9,4)`.)
3. **`01-arithmetic/05-rates-unit-conversions.md`** — "Two people who each take 6 hours do not
   together take 12 hours (or 3 hours by averaging)". They take **exactly 3 hours**. The trap names
   the correct answer as wrong, and the attached "averaging" arithmetic is wrong too (averaging 6
   and 6 gives 6).
4. **`01-arithmetic/10-estimation-approximation.md`** — the trap headed "compounding errors in the
   same direction" demonstrates 4.6 up to 5 and 2.4 **down** to 2, which is opposite directions, and
   those errors partly cancel. It shows the opposite of what it names.
5. **`05-geometry/02-triangles-fundamentals.md`** — still lists Heron's formula, which the
   2026-10-22 audit classified as an off-syllabus route.

Fixing 1–4 in the capsules and rerunning `build_learn.py` is the obvious follow-up. Defect 1 may also
be worth grepping for across the bank and mock explanations.

## Before this goes live

1. **Deploy the Worker.** `/lead` and `/admin/leads` exist in `cloudflare/worker.js` but are **not
   deployed** — paste the file into the Cloudflare dashboard as usual. Until then the email gate
   captures nothing, though the download still works (see below).
2. **Decide on the gate's failure behaviour.** By design the PDF is released even when the `/lead`
   call fails, and after 4 seconds regardless — a lead-capture outage must not cost a student the
   handbook. Tested: invalid email is rejected, a worker outage still releases the download, and a
   returning visitor skips the gate via `localStorage`. If you would rather hard-gate it, that is one
   change in `GATE_JS` in the build script.
3. **Read the leads.** A **Leads** tab is now in `cloudflare/admin.html`, between Webhooks and
   Analytics: total, last-7-days and per-source counts, a table of email / first seen / last seen /
   times / source, and a CSV download. It calls `GET /admin/leads` with the existing
   `X-Admin-Secret` header, so it starts working the moment the Worker is deployed. Backup at
   `admin.html.bak_pre_leads_2026-10-24`. Tested against a mocked response: tab switching and
   persistence, rendering, repeat-visit counts, CSV download, no console errors.
4. **Nav on the rest of the site.** `pricing.html`, `sectional.html`, `thank-you.html` and the
   generated `/learn/` pages do not link to the handbook yet. The `/learn/` pages need the nav
   template in `build_learn.py` patched and a rebuild.
5. **Proof one printed copy.** The print CSS pins fonts to Helvetica/Georgia/Courier fallbacks so the
   PDF renders identically without the webfonts.

## Open questions

- **63 pages is long for something called quick revision.** The three reading modes are the answer
  for now. A separate 8–10 page formula-only sheet, generated from the same source by taking only the
  **Formulas and rules** blocks, would be a small change to the build script — it was considered and
  deliberately deferred.
- The QC-per-section counts in Section A.4 are deliberately vague, because ETS does not publish them.
  Worth replacing with real figures from your own mocks.
- The normal-curve band figures use the 34 / 13.5 / 2.35 split derived from 68-95-99.7. The true
  values are 34.13 / 13.59 / 2.14. Kept as derived, since that is how GRE normal questions are built.
