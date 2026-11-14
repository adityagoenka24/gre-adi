# PharmaBoard · Presentation Dashboard — Handoff v1

**Files:** `dashboard_presentation.html`, `dashboard_presentation_codex.html`
**Companion script:** `presenter_script.md`
**Sibling dashboards:** `index-4.html` (chart-only view), `dashboard_strategic.html` (analyst view)

This document explains how the presentation dashboard is built, what it depends on, where the data flows, and where to extend it. Read end-to-end before making changes — the file is single-page, self-contained, and small enough to grok in one sitting.

---

## 1. What this file is for

A 12-section presentation deck that loads current-year sales, optional previous-year sales, Customer-to-MSR Mapping, and Doctor Master. It renders a guided storytelling flow for a 35-minute walk-through with sales leadership, ABMs, MSRs and the National Sales Head, plus a final operational register appendix.

It is deliberately a **third sibling**, not a replacement: the other two stay as-is. This one is presentation-first — bigger fonts, slide-snap scrolling, fewer charts per viewport, cross-filter, and an expand-to-popup modal on every chart.

---

## 2. Architecture in one screen

```
┌──────────────────────────────────────────────────────────────┐
│  ONBOARDING  (choice → upload → mapper → load)               │
│   ↓                                                          │
│  APP SHELL                                                   │
│   ├─ topbar (brand, period, slide counter, fullscreen)       │
│   ├─ filter bar (dates, product, customer, region, MSR,      │
│   │              month lens, ABM, speciality, tier, reset)   │
│   ├─ cf-bar (cross-filter banner, shows when locked)         │
│   └─ deck (12 slides, scroll-snap)                           │
│        ├─ Slide 1  · Cover                                   │
│        ├─ Slide 2  · Revenue Momentum                        │
│        ├─ Slide 3  · Growth Story                            │
│        ├─ Slide 4  · Product Portfolio                       │
│        ├─ Slide 5  · Customer Base                           │
│        ├─ Slide 6  · Territory Map                           │
│        ├─ Slide 7  · ABM Team                                │
│        ├─ Slide 8  · MSR Performance                         │
│        ├─ Slide 9  · Doctor Universe                         │
│        ├─ Slide 10 · Risks & Actions                         │
│        ├─ Slide 11 · YoY Command Center                      │
│        └─ Slide 12 · Sales Register                          │
│                                                              │
│  CHART MODAL  (popup, opens via Expand on any chart card)    │
│  NAV DOTS  (right edge) · ARROW BUTTONS (bottom-right)       │
└──────────────────────────────────────────────────────────────┘
```

Everything is one HTML file. Only two external CDNs are loaded — `plotly.js-dist@2.35.2` and `xlsx@0.18.5`. No build step, no server. Data never leaves the browser.

---

## 3. Data flow

```
USER FILES                                         IN-MEMORY STATE
─────────────                                      ─────────────────
sales.xls          ─┐                              RAW.sales  (raw row objects)
previous_sales.xls ─┤                              RAW.previous_sales
msr.xlsx           ─┼─→ parseXLS() ─→ autoMap() → COLS.sales, MAP.sales
doc.xlsx           ─┘                              RAW.msr, COLS.msr, MAP.msr
                                                   RAW.doc, COLS.doc, MAP.doc
                                                          │
                                                          ▼
                                                   cleanSales()   → D
                                                   cleanSales(previous_sales, MAP.sales) → DPREV
                                                   cleanMSR(D)     → DMSR
                                                   cleanMSR(DPREV) → DMSR_PREV
                                                   buildDoctorIndex() → DOC, DOC_BY_MSR, DOC_BY_CITY, MSR_PRODUCTS
                                                   computeJoinHealth() → JOIN_HEALTH
                                                          │
                                                          ▼
                                                   FS = filtered D
                                                   FPREV = filtered DPREV
                                                   FSMSR = filtered DMSR
                                                   FPREVMSR = filtered DMSR_PREV
                                                          │
                                                          ▼
                                                   renderSlide(n)
                                                          │
                                                          ▼
                                                   Plotly charts + KPI tiles
```

**Key state variables (all module-scope):**

| Var | Type | Holds |
|---|---|---|
| `RAW.{sales,previous_sales,msr,doc}` | `[{...}]` | Raw parsed rows, one object per data row |
| `COLS.{sales,previous_sales,msr,doc}` | `[string]` | Detected column headers |
| `MAP.{sales,msr,doc}` | `{canon: header}` | Auto-detected mapping, user-confirmable in mapper |
| `D` | `[{...}]` | Cleaned sales rows: `{product_name, bill_no, date, customer, station, qty, sales_value, batch_no, expiry, mrp, is_return}` |
| `DPREV` | `[{...}]` | Cleaned previous-year sales rows. Uses `MAP.sales`; there is no separate previous-sales mapper. |
| `DMSR` | `[{...}]` | Sales rows attributed to MSRs (value split across N MSRs per customer) |
| `DMSR_PREV` | `[{...}]` | Previous-year sales rows attributed to MSRs using the same MSR lookup. |
| `DOC` | `[{...}]` | Doctor records: `{doctor, msr, msrUpper, city, cityKey, territory, speciality, category, terr_type, mapped_products}` |
| `FS` | `[{...}]` | Currently-filtered subset of D |
| `FPREV` | `[{...}]` | Currently-filtered subset of DPREV. Date filtering uses same month/day window across years. |
| `FSMSR` | `[{...}]` | Currently-filtered subset of DMSR |
| `FPREVMSR` | `[{...}]` | Currently-filtered subset of DMSR_PREV |
| `CF` | `{dim, val}` | Active cross-filter (set by clicking a chart bar/slice) |
| `MSR_PRODUCTS` | `Map<msrUpper, Set<brandKey>>` | Each MSR's mapped target products (canonical brand keys) |
| `DOC_BY_MSR` | `Map<msrUpper, [DocRec]>` | Doctors grouped by their assigned MSR |
| `DOC_BY_CITY` | `Map<cityKey, [DocRec]>` | Doctors grouped by canonical city |
| `JOIN_HEALTH` | `{msrLinked, msrTotal, pct, ...}` | How well the MSR and Doctor Master files agree |
| `CURRENT_SLIDE` | `int` | Current visible slide (1-12) |
| `RENDERED_SLIDES` | `Set<int>` | Slides already rendered (lazy-render cache) |

---

## 4. The 12 slides — what each one computes

Each slide has one render function. They all read from `FS` / `FSMSR` / `DOC` (post-filter, post-cross-filter), so any filter or cross-filter change cascades through all of them.

| # | Slide | Render fn | Reads | Key derived data |
|---|---|---|---|---|
| 1 | Cover | `renderCover` | `FS`, `DOC`, `FSMSR` | `summarize()`, `monthBuckets()`, `activeDoctorCount()` |
| 2 | Revenue Momentum | `renderMomentum` | `FS` | `monthBuckets()`, sparkline data |
| 3 | Growth Story | `renderGrowthStory` | `FS` | `growthByDim('product_name')`, top 5 accel/decline |
| 4 | Product Portfolio | `renderProductPortfolio` | `FS`, `FPREV` | `productStats()`, embedded `renderProductYoYLens()`, treemap, pareto |
| 5 | Customer Base | `renderCustomerBase` | `FS` | top-customer pareto, customer×product combos |
| 6 | Territory Map | `renderTerritoryMap` | `FS` | region donut, bubble matrix |
| 7 | ABM Team | `renderABMTeam` | `FSMSR`, `DOC` | `abmStats()` — territory-fair scoring |
| 8 | MSR Performance | `renderMSRPerformance` | `FSMSR`, `DOC` | `msrStats()`, `targetingEffectiveness()` |
| 9 | Doctor Universe | `renderDoctorUniverse` | `DOC`, `FSMSR` | `doctorPortfolio()`, `hqExCoverage()` |
| 10 | Risks & Actions | `renderRisksActions` | `FS`, `FSMSR`, `DOC` | `buildActions()` — auto-ranked by ₹ impact |
| 11 | YoY Command Center | `renderYoYCommandCenter` | `FS`, `FPREV` | `compareSummary()`, `compareByDim()`, `monthOfYearCompare()`, `buildYoYSignals()` |
| 12 | Sales Register | `renderSalesRegister` | `FS`, `FPREV` | Bill-level filtered rows, scope selector, `exportSalesRegister()` |

---

## 5. Scoring & analytical concepts (inherited from strategic dashboard)

**Territory-fair MSR / ABM Efficiency Score (out of 100).** No absolute-revenue term — that would punish smaller territories unfairly. Four components:

- **Growth** (35 pts) — clamp(`(growth_pct + 25) / 50`, 0, 1) × 35. Capped at ±25% MoM.
- **Targeting** (30 pts) — `% of revenue from products mapped to assigned doctors`. Mirrors the strategic dashboard's `targetingEffectiveness()`.
- **Coverage** (25 pts) — `% of assigned doctors whose mapped product was billed in their city`. Mirrors `doctorPortfolio` + per-MSR active calculation.
- **Strategic SKU breadth** (10 pts) — `count of strategic brands sold` / `total strategic brands` (currently 3: REDNIL, ECOXIB, KOVER ALL).

ABM grain rolls up the same four components from its MSRs.

**Therapeutic divisions.** Static dict in `DIVISIONS`:

| Division | Brand | Specialities (canonicalised) |
|---|---|---|
| Cardiology | REDNIL | CARDIOLOGY, CARDIO, INTERVENTIONAL CARDIOLOGIST |
| Orthopaedics | ECOXIB | ORTHOPAEDIC, ORTHO, ORTHOPAEDIC SURGEON, … |
| General Medicine | KOVER ALL | GENERAL PHYSICIAN, GP, MD, PHYSICIAN, … |

**Canonical key functions:**
- `cleanBrandKey('ECOXIB 60 MR TAB')` → `'ECOXIB'`
- `canonSpeciality('Cardiologist')` → `'CARDIOLOGY'`
- `canonCity('BAGDAH, North 24 Parganas')` → `'BAGDAH'`
- `normName('Mr. Arnab Dutta')` → `'ARNAB DUTTA'`

These four normalisers are why join-health works at all — the raw files disagree on spelling/format and the canonical functions reconcile them.

---

## 6. Filters & cross-filter

**Filter bar (9 dropdowns + reset)** — sits between topbar and deck.
- Date `from` / `to` — restricts `FS` and `FSMSR` to the date range.
- Month Lens — restricts current and previous sales to the same month-of-year (`May` = May current vs May previous), regardless of calendar year.
- Product / Customer / Territory — single-select, restrict on `D`-row dimensions.
- MSR / ABM — single-select, restrict on `DMSR`-row dimensions.
- Speciality / Tier — single-select, restrict via `DOC` (derives station whitelist and MSR whitelist that then restrict `FS`/`FSMSR`).
- Reset — clears all dropdowns + CF and re-applies.

**Cross-filter (`CF`)** — clicking a chart bar/slice locks the entire deck to that dimension. Wired charts:

| Slide | Chart | Click → Filter on |
|---|---|---|
| 2 | `ch-momentum` | `month = YYYY-MM` |
| 4 | `ch-topprod` | `product = <full name>` (via customdata) |
| 4 | `ch-treemap` | `product = <full name>` |
| 5 | `ch-topcust` | `customer = <full name>` (via customdata) |
| 6 | `ch-region` | `station = <region>` |
| 6 | `ch-terr-opp` | `station = <territory>` |
| 8 | `ch-msr-sales` | pushes to the `f-msr` dropdown (visible in filter bar) |

**Important:** because chart y-axis labels are truncated with `shortName()`, we attach `customdata` (full name) to the trace and read that in the click handler. New charts that need cross-filter must do the same — see `wireSlideCrossFilters(n)`.

**Re-render on filter change.** `applyF()` clears `RENDERED_SLIDES`, re-renders the current slide immediately, and marks only the current slide as rendered. When the user scrolls to a different slide, the lazy renderer re-renders it fresh with the new `FS`/`FPREV`/`FSMSR`.

**Previous-year date logic.** Current-year sales use absolute `from` / `to` dates. Previous-year sales use the same month/day window across years so a current range like `2025-05-01` to `2025-05-31` compares against all previous-year rows whose dates fall between May 1 and May 31.

---

## 7. Chart expand / popup modal

Every chart card automatically gets an **Expand** button injected after each render pass via `injectExpandButtons()`. Clicking it:

1. Deep-clones the chart's `data` + `layout` (so editing the modal doesn't mutate the source).
2. Scales up margins, font sizes, and axis tick fonts for a larger canvas.
3. Plots the clone into `#chart-modal-target` in a 1400×900 modal with Plotly's full mode bar enabled.
4. Provides Save PNG (1800×1000 @2x) and Close buttons. `Esc` closes.

The modal uses `requestAnimationFrame` before plotting so Plotly measures the correct dimensions of the modal box (rather than `0x0` if plotted synchronously).

---

## 8. Navigation

- **Scroll** — natural scrolling with `scroll-snap-type: y proximity`. Snaps to slide tops but allows scrolling within a tall slide.
- **Arrow keys / PageUp / PageDown / Home / End / Space** — bound on `document` keydown, skipped when focus is in an INPUT/SELECT/TEXTAREA.
- **Right-edge dots** — one per slide, hover shows the title, click jumps.
- **Bottom-right `‹` / `›`** — previous/next.
- **F** — toggles fullscreen.
- **Slide counter** in topbar updates via `IntersectionObserver` on the deck — when a slide crosses 55% intersection, it becomes the current slide.

---

## 9. Lazy rendering

Charts are expensive. `renderSlide(n)`:

1. If `n` is already in `RENDERED_SLIDES` → resize all charts on that slide (`Plotly.Plots.resize`) and return. This catches viewport / fullscreen size changes.
2. Otherwise dispatch to the matching `renderXxx()` and add `n` to the set.
3. After 80ms, inject Expand buttons and wire cross-filter handlers for that slide.

The 80ms delay matters — Plotly's `plotly_click` event handler doesn't attach until after the chart has rendered, and the chart DOM nodes don't have `.on(...)` until then.

`applyF()` invalidates the cache by replacing `RENDERED_SLIDES` with a new Set so the next visit to any slide forces a fresh render with new filtered data.

---

## 10. Chart sizing rules (the v2 fix)

**v1 problem.** Cards used `flex:1; min-height:0` and chart divs used `flex:1; width:100%; min-height:0`. When the slide was taller than the viewport (which happens with 4 KPIs + 2 charts + a table), the chart flex-collapsed to 0px and Plotly rendered into a 0×0 container — invisible.

**v2 rule.** Every chart `<div>` gets an explicit pixel height via class:

| Class | Height |
|---|---|
| `.chart` (default) | 320px |
| `.chart.sm` | 240px |
| `.chart.md` | 320px |
| `.chart.lg` | 400px |
| `.chart.xl` | 460px |

Slides have `min-height: calc(100vh - 100px)` (a minimum, not a max). Content grows naturally; the deck scrolls. This works correctly in normal mode AND in fullscreen, because chart heights are not viewport-dependent.

**When adding a new chart**, ALWAYS attach one of these classes. Never let a chart div have a flex height.

---

## 11. Hooking new analytics in

To add a new computation that the dashboard surfaces:

1. **If reusable** — add a function next to `productStats`, `msrStats`, `abmStats`, `targetingEffectiveness`. Same signature: takes a filtered row array (`FS` or `FSMSR`), returns a derived array or object.
2. **If slide-specific** — compute inside the `renderXxx()` function. Keep it pure: `FS` / `FSMSR` / `DOC` in, DOM out.
3. **If it depends on a new field** — extend the relevant `SCHEMA` / `MSR_SCHEMA` / `DOC_SCHEMA` and add aliases. The auto-mapper handles the rest as long as the field name matches an alias substring.

---

## 12. Adding a new slide

1. Bump `TOTAL_SLIDES` from 12 to 13.
2. Add the title to `SLIDE_TITLES` array.
3. Add a `<section class="slide" id="slide-13" data-title="…">` block in the HTML (copy any existing slide for structure).
4. Add a `renderSlideN()` function.
5. Add the dispatch entry in the `renderSlide(n)` switch.
6. If the slide has cross-filter-able charts, add cases in `wireSlideCrossFilters(n)`.
7. Update `presenter_script.md` with the new section.

---

## 13. Customisation points

| Want to change | Where |
|---|---|
| Visual theme (dark → light, accent colour) | `:root { --bg, --acc, --gold, … }` |
| Strategic brand list | `DIVISIONS` dict + `cleanBrandKey()` overrides |
| Specialities canonicalisation | `SPEC_CANON` dict |
| GitHub auto-fetch URLs | `GH_FILES` const |
| Score weights | `W` object inside `abmStats()` and `msrStats()` (currently growth 35, targeting 30, coverage 25, sku 10) |
| Default chart heights | `.chart.sm/.md/.lg/.xl` in CSS |
| Number of action cards on slide 10 | `.slice(0, 6)` at end of `buildActions()` |
| Filter dropdown contents | `buildFilters()` |

---

## 14. Test results on real data

Verified with `sales.xls` (3637 raw rows), `msr.xlsx` (51 rows), `Doctor_Master.xlsx` (1366 rows):

```
D = 3001 sales rows after cleanup
DMSR = 3159 MSR-attributed rows (some rows duplicate per multi-MSR customer)
DOC = 1366 doctor records
Join health: 7/11 unique MSRs matched between files (64%)

Slide 1 Cover values produced:
  Net Revenue ₹2.16 Cr · MoM −79.6% · Return 11.51% · Doctor Coverage 27%

Slide 7 ABM Team:
  7 ABMs computed, top = Mr. Arindam Chakraborty (score 37.4, ₹79.61L)

Slide 9 HQ vs EX:
  HQ: 338/989 active (34%), adherence 52.0%
  EX: 120/377 active (32%), adherence 37.0%

Cross-filter simulation:
  Locking on top product 'KOVER - ALL TAB 15's: FS narrows from 3001 → 225 rows
  Locking on top ABM: FSMSR narrows from 3159 → 975 rows
```

No runtime errors. JS passes `node --check`.

---

## 15. Known limitations & future work

**1. Strategic SKU list is hardcoded.** `STRATEGIC_BRANDS = {REDNIL, ECOXIB, KOVER ALL}`. If AFD adds a 4th brand (say IMMUTAB), it won't count toward the strategic-SKU score until added to `DIVISIONS` AND the cap recalculated. Future work: load brand list from a `brand_master.csv` upload slot.

**2. Targets / achievement.** The score-weight redistribution (`HAS_TARGETS = false` in strategic dashboard) gives the 10 achievement points to growth+targeting because we don't have a target file. When AFD ships per-MSR monthly targets, set `HAS_TARGETS = true` and ingest a 4th file.

**3. No multi-select filters.** Filter bar dropdowns are single-select. To allow "MSR A or MSR B", convert each `<select>` to a multi-tag input and update `applyF()` to test set membership.

**4. Customer × Product table is top-12.** Hardcoded slice. Could become "top N" with a control.

**5. Cross-filter doesn't push to the dropdown for product/customer/territory.** Only MSR cross-filter does. Symmetric behaviour would mean clicking the Top 10 Products bar also sets `f-prod`. Minor change — extend `wireSlideCrossFilters` similarly.

**6. No HQ vs EX selector.** Slide 9's HQ-vs-EX chart is always both. A filter to show only HQ or only EX would help — add to filter bar, restrict `FSMSR` accordingly.

**7. `injectExpandButtons` matches `[id^="ch-"]`.** If you add a chart that's not in a `.card` with a `.card-head`, the expand button won't inject. The pyramid (`#pyramid-list`) has no expand button by design — it's a list, not a chart.

**8. Performance.** Slide 4 treemap with 30 SKUs and slide 8 MSR bar with ~12 reps each take ~150–200ms to render on a modest laptop. The full deck renders all 12 slides quickly on first load. If you push past 50+ MSRs, consider chunking traces.

**9. Mobile.** Responsive breakpoints exist (`@media(max-width:980px)`) but the dashboard is genuinely designed for projector / laptop screens. Mobile viewing works but is cramped.

---

## 16. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Chart shows as empty white box | Container has no height. Check that the `<div>` has a `.chart`, `.chart.sm`, `.chart.md`, `.chart.lg`, or `.chart.xl` class. |
| Filter changes don't reflect in chart | Slide was already rendered and not re-rendered after `applyF()`. Make sure `applyF()` is called from the filter change (it should be — `onchange="applyF()"`). |
| Cross-filter sticks even after page reload | `CF` is in-memory only; reload should clear it. If not, hard-refresh (Cmd-Shift-R). |
| MSR clicks navigate but full name isn't matched | The chart trace is missing `customdata: …map(s => s.msr)`. Add it. |
| Expand button doesn't appear | The `<div id="ch-…">` isn't inside a `<div class="card">` with a `<div class="card-head">`. Restructure. |
| Doctor coverage shows 0% | `JOIN_HEALTH.pct` is low — the MSR-name spelling differs between MSR file and Doctor Master. Check the data, not the code. The `normName()` strips salutations and case, but can't fix initials vs full names ("A. Dutta" vs "Arnab Dutta"). |
| `cleanMSR` returns 0 rows | Customer names in sales don't match customer codes/names in MSR file. Open the mapper and confirm the customer/code column mapping. |
| `buildDoctorIndex` returns 0 doctors | Doctor Master has no `Doctor Name` or `MSR Name` columns mapped. Check the mapper. |
| Modal opens but chart inside is empty | Source chart wasn't rendered yet. Visit the slide first, then click Expand. |
| Page renders but slides aren't navigable | Make sure the deck `<div>` has `id="deck"` — the IntersectionObserver looks for it. |
| Fullscreen leaves cropped chart | Press F again to exit and re-enter, or scroll within the slide. The `renderSlide` re-resize path handles this. |

---

## 17. Files in this folder

| File | Role |
|---|---|
| `dashboard_presentation.html` | The presentation dashboard (this handoff is about this file) |
| `dashboard_presentation_codex.html` | Codex-built copy with the same YoY implementation |
| `presenter_script.md` | Companion speaker notes — one block per KPI/chart for live delivery |
| `index-4.html` | The original chart-focused dashboard (kept as-is) |
| `dashboard_strategic.html` | The original analyst-focused dashboard (kept as-is) |
| `Doctor_Master.xlsx` | Doctor → MSR mapping with category, speciality, products |
| `files/sales.xls` | Sales register (product-customer bill wise) |
| `files/previous_sales.xls` | Optional previous-year sales register when available; same mapping as `sales` |
| `files/msr.xlsx` | Customer-to-MSR mapping with ABM column |
| `files/*.xlsx` | Per-MSR doctor lists (used to build the master) |

---

## 18. Quick reference — keyboard

| Key | Action |
|---|---|
| `→` / `Space` / `PgDn` | Next slide |
| `←` / `PgUp` | Previous slide |
| `Home` | Slide 1 |
| `End` | Slide 12 |
| `F` | Toggle fullscreen |
| `Esc` | Close chart popup |

---

## 19. Code map — where to look

| What | Line range (approx) |
|---|---|
| CSS tokens, layout, theming | ~10 – 430 |
| Onboarding screens | ~435 – 530 |
| Topbar + filter bar + CF bar | ~535 – 565 |
| 12 slide `<section>` blocks | ~575 – 850 |
| Chart modal HTML | ~785 – 805 |
| `SCHEMA`, `MSR_SCHEMA`, `DOC_SCHEMA`, `DIVISIONS` | ~815 – 920 |
| Helpers (`fmtMoney`, `monthBuckets`, `summarize`, …) | ~970 – 1050 |
| File intake (parseXLS, autoMap, mapper) | ~1055 – 1230 |
| Data cleaning (`cleanSales`, `cleanMSR`, `buildDoctorIndex`) | ~1240 – 1370 |
| Analytics (`productStats`, `msrStats`, `abmStats`, …) | ~1375 – 1525 |
| Navigation, scroll observer, keyboard | ~1530 – 1620 |
| `renderSlide` dispatcher + `wireSlideCrossFilters` | ~1625 – 1680 |
| `renderCover` through `renderRisksActions` | ~1685 – 2790 |
| `buildActions` (slide-10 action cards) | ~2795 – 2900 |
| Filters, cross-filter, modal, expand-buttons | ~2920 – 3080 |
| Boot | end |

---

## 20. What changed between v1 (initial build) and v2 (this version)

**v1 problems reported by user:**
1. Charts after KPI cards not visible properly.
2. No expand-to-popup feature for charts.
3. No filter dropdowns; no cross-filter wiring.
4. Parts hidden in fullscreen.

**v2 fixes (this handoff document is for v2):**
1. **Chart sizing.** Dropped `flex:1; min-height:0` everywhere. Every chart `<div>` now has an explicit pixel height via `.chart.sm/.md/.lg/.xl`. Slides grow as tall as needed; deck scrolls within. Tested at multiple viewport sizes including fullscreen.
2. **Expand modal.** Added `#chart-modal` HTML, `openChartModal()` / `closeChartModal()` / `exportModalPng()` JS, and `injectExpandButtons()` that auto-injects an Expand button on every chart card after render.
3. **Filter bar.** Added dropdowns + reset between topbar and deck: Date from/to, Month Lens, Product, Customer, Territory, ABM, MSR, Speciality, Tier. `applyF()` recomputes `FS`/`FPREV`/`FSMSR` and re-renders.
4. **Cross-filter.** Added `CF` state, `setCF`/`clearCF`, a banner that shows when locked, and `wireSlideCrossFilters(n)` that wires click handlers on key charts (momentum, top-products, treemap, top-customers, region donut, territory matrix, MSR-sales). Cross-filter uses `customdata` (full name) instead of truncated y-axis labels.
5. **Slide layout.** Removed `flex:1` from grid/card containers, lowered slide min-height to `calc(100vh - 100px)` to account for the new filter bar.
6. **Keyboard hardening.** Navigation keys are skipped when focus is in INPUT/SELECT/TEXTAREA so typing in a date field doesn't accidentally advance the slide.

Net file change: ~2745 lines → ~3100 lines.

**v3 / Codex YoY upgrade:**
1. **Second sales intake.** Added a `previous_sales` upload slot. It uses the same `MAP.sales` mapping as the current-year `sales` file.
2. **Comparison state.** Added `DPREV`, `DMSR_PREV`, `FPREV`, and `FPREVMSR` so previous-year rows travel through the same filter and attribution machinery without mutating current-year analytics.
3. **Month Lens.** Added the `f-month` dropdown. Choosing May restricts both years to May, while date ranges on previous-year rows are interpreted as the same month/day window in the prior file.
4. **Slide 11.** Added `renderYoYCommandCenter()` with Month Mirror, Product Velocity Radar, YoY Winners & Leaks, and Boardroom Signals.
5. **New dashboard copy.** Added `dashboard_presentation_codex.html` as a same-content sibling for review and experimentation.

**v4 / Integrated product YoY + register export:**
1. **Product-level YoY lens.** Slide 4 now calls `renderProductYoYLens()` after the current-period KPI strip. It reads `FS` and `FPREV`, so Product, Month Lens, Customer, Territory, and cross-filters apply to both years.
2. **Dynamic product chart.** With all products selected, `#ch-prod-yoy` renders grouped current-vs-previous SKU bars. With one product selected, it switches to a month mirror for that SKU.
3. **Same-month KPI logic.** Choosing April in `f-month` restricts both `FS` and `FPREV` to April. The Slide 4 KPIs then report current April net, previous April net, rupee delta, YoY%, and return-rate shift.
4. **Sales Register appendix.** Added Slide 12 with `renderSalesRegister()`, a year-scope selector, and a 300-row browser preview.
5. **Excel export.** `exportSalesRegister()` writes every filtered canonical register row to `.xlsx` using the already-loaded SheetJS dependency.

**v5 / Render hardening:**
1. **Recovered lazy-render lifecycle.** `renderSlide(n)` now marks a slide rendered only after its render function finishes successfully. If a render throws, the slide is removed from `RENDERED_SLIDES` so revisiting it can retry.
2. **Background pre-render.** After launch, `prerenderRemainingSlides()` renders slides 2-12 in the background. This prevents chart cards from staying blank when a presenter jumps quickly or scrolls through tall slides.
3. **Filter safety.** `applyF()` no longer manually re-adds the current slide to `RENDERED_SLIDES`; `renderSlide()` owns render status.
4. **Verification.** Browser audit on repository data found 22 chart containers, all with SVG output, no empty placeholders, and no console errors.

---

## 21. Contact

Owner: **Adi (goenka.aditya.kol@gmail.com)**
Built with: Claude inside Cowork mode
Originals: `index-4.html` (chart view), `dashboard_strategic.html` (analyst view)
