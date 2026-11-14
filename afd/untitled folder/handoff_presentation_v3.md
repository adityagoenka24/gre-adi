# PharmaBoard · Presentation Dashboard — Handoff v3

**File:** `dashboard_presentation.html`
**Predecessor:** `handoff_presentation_v2.md` (v6 build — FY engine, YoY everywhere, Slide 12 register)
**Owner:** Adi (goenka.aditya.kol@gmail.com)

This document covers two sprint patches applied on top of v6:
- **Sprint A** — Bug fixes + filter overhaul + UX polish
- **Sprint B** — ABM/MSR filter propagation + new charts + Slide 13

---

## 1. What changed (v6 → v7)

| Area | v6 | v7 |
|---|---|---|
| Initial PY data load | `FS_CUR_COMP` / `FS_PREV_COMP` were empty arrays on first render (only populated after first filter change) | `applyF()` called at launch instead of raw `renderSlide(1)` — comparable arrays are ready before slide 1 renders |
| Worst Month KPI | Filtered to `b.net > 0` before finding minimum — caused worst = best when only one positive month existed | Filter removed; worst month is the true minimum across all months including negative-net months |
| In-card filter dropdowns | Each YoY card had its own Product / Region / Month dropdowns | All card-filter strips hidden via `display:none!important`. Charts still render through `mountCardFilters` callbacks using global filtered data. One master filter bar controls everything |
| ABM / MSR filter propagation | ABM and MSR filters only affected DMSR-powered slides (7, 8). All revenue / customer / territory slides ignored them | When ABM or MSR is selected, code derives exact customer set from `DMSR ∪ DMSR_PREV` and applies it inside `passDim()` — all slides narrow to that manager's territory |
| Duplicate customer names | Customer dropdown showed "Chandan Enterprises" twice; no way to distinguish | `buildCustDisambig()` detects names at multiple stations. Dropdown shows "Chandan Enterprises (Kolkata)" etc. Filter value is compound `name\|\|\|station`; `passDim()` matches both fields. Customer YoY chart uses `compareByCustomerDisambig()` with per-station grouping |
| ABM Efficiency Score chart | Composite 100-pt weighted score stacked bar (Growth 35 + Targeting 30 + Coverage 25 + SKU 10) — confusing without Doctor Master loaded | Replaced with grouped horizontal bar: each ABM's latest-month revenue vs prior-month revenue |
| ABM / MSR KPI strips | 4 generic tiles (Active count, Top performer, Avg revenue, Growing teams) | 6 tiles: **Latest Month Revenue**, **FY Revenue (to date)**, Avg per ABM/MSR, Top ABM/MSR, Growing teams, **Prior Month Revenue** |
| Growth Attribution donut | Labels rendered inside pie slices — text invisible on gold/amber segments | `textposition:'outside'` — labels rendered outside donut on dark background, always readable |
| Slide 11 duplications | Contained Revenue Bridge (dup of Slide 3), Month Mirror (dup of Slide 2), Growth Attribution (dup of Slide 5) | Removed duplicates. Slide 11 now shows only unique analytics: Product Momentum Quadrant (full-width), Top 5 Gainers + Losers, Boardroom Signals, Product Winners & Leaks, Velocity Radar |
| Decimal places | Many percentages and delta values used `.toFixed(1)` | All percentage / delta displays use `.toFixed(2)`. `fmtPct` default changed from 1 → 2 dp. `fmtDelta` changed from 1 → 2 dp. Money-in-thousands changed from `.toFixed(1)` → `.toFixed(2)` |
| Slide count | 12 slides | 13 slides — Slide 13 is the new Field Force Register |
| Field Force Register | — | New Slide 13: searchable, sortable, paginated grid of all FSMSR rows. Columns: Date, FY, ABM, MSR, Customer, Territory, Product, Bill No, Qty, Net ₹, Return. Sort by any column. Excel + CSV export. Responds to master filters |

---

## 2. Architecture — updated

```
┌────────────────────────────────────────────────────────────────┐
│  ONBOARDING → APP SHELL                                        │
│   ├─ topbar                                                    │
│   ├─ MASTER FILTER BAR (single source of truth)               │
│   │     FY · From · To · Product · Customer · Region          │
│   │     ABM · MSR · Speciality · Tier · Reset · FY chip       │
│   │   ↳ ABM/MSR filter also derives custRestrict set          │
│   │     and narrows D rows on ALL slides                       │
│   ├─ cf-bar (cross-filter banner)                             │
│   └─ deck (13 slides, scroll-snap)                            │
│        ├─ Slides 1–10  standard KPI strip + YoY band + charts  │
│        ├─ Slide 11     Simplified YoY Center (unique charts)   │
│        ├─ Slide 12     Sales Register (data grid)              │
│        └─ Slide 13     Field Force Register (DMSR data grid)   │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Filter pipeline — updated `applyF()`

### 3.1 New: ABM / MSR territory restrictor

Runs before `passDim()` is defined. When `f-abm` or `f-msr` is non-empty:

```javascript
const allMsrRows = DMSR_PREV.length ? [...DMSR, ...DMSR_PREV] : DMSR;
abmCustRestrict = new Set(
  allMsrRows
    .filter(r => (!fabm || r.abm.trim() === fabm) && (!fmsr || r.msr === fmsr))
    .map(r => r.customer)
);
```

`passDim()` then includes:
```javascript
if (abmCustRestrict && !abmCustRestrict.has(r.customer)) return false;
```

This correctly narrows `FS_CUR_FILTERED` and `FS_PREV_FILTERED` so every slide (Revenue Momentum, Customer Base, Territory Map, Product Portfolio, etc.) shows only the territory belonging to the selected ABM or MSR. No approximation — the customer→MSR→ABM relationship is exact from the MSR file.

### 3.2 New: Compound customer filter value

When a customer with a duplicate name is selected from `f-cust`, the value is `"Name|||Station"`.  
`passDim()` detects the `|||` separator and matches both `r.customer` and `r.station`.

```javascript
if (fc) {
  const sep = fc.indexOf('|||');
  if (sep !== -1) {
    if (r.customer !== fc.slice(0, sep) || r.station !== fc.slice(sep + 3)) return false;
  } else {
    if (r.customer !== fc) return false;
  }
}
```

### 3.3 Launch fix

`launchDashboard()` now calls `applyF()` instead of `renderSlide(1)`. `applyF()` populates `FS_CUR_COMP` / `FS_PREV_COMP` and then calls `renderSlide(1)` + `prerenderRemainingSlides` internally. Without this, all YoY cards showed "Previous-year file not loaded" on first open even when PY data was present.

---

## 4. Customer disambiguation

### 4.1 `buildCustDisambig()`

Called in `launchDashboard()` after `cleanSales()`, before `buildFilters()`.

```javascript
function buildCustDisambig() {
  const map = new Map();               // name → Set(stations)
  for (const r of D) {
    if (!map.has(r.customer)) map.set(r.customer, new Set());
    if (r.station) map.get(r.customer).add(r.station);
  }
  const dupes = new Set([...map.entries()].filter(([,s]) => s.size > 1).map(([k]) => k));
  CUST_DISAMBIG = { dupes, custStations: map };
}
```

### 4.2 Customer dropdown

`buildFilters()` builds compound options for duplicate names:
- Value: `"Chandan Enterprises|||Kolkata"`
- Label: `"Chandan Enterprises (Kolkata)"`

Unique-name customers keep plain `value = name`.

### 4.3 `compareByCustomerDisambig(curRows, prevRows)`

New function used by `renderCustomerYoYChart()`. Groups by compound key `name|||station` for duplicate names, `name` for unique names. Produces a `label` field with the human-readable `"Name (Station)"` form used in chart y-axis labels.

### 4.4 `custDisp(name, station)`

Helper — returns `"Name (Station)"` if name is in `CUST_DISAMBIG.dupes`, else `"Name"`. Available for future use in tables/lists.

---

## 5. ABM slide (Slide 7) — changes

### 5.1 KPI strip (6 tiles, `.kpi-row.six`)

| Tile | Source |
|---|---|
| Latest Month Revenue | `sum(FSMSR where monthKey === latestKey and !is_return)` |
| FY Revenue (to date) | `totalNet` from `abmStats()` |
| Avg per ABM | `totalNet / activeABMCount` |
| Top ABM | ABM with highest `net` |
| Growing Teams | Count of ABMs with positive MoM |
| Prior Month Revenue | `sum(FSMSR where monthKey === priorKey and !is_return)` |

### 5.2 ABM Revenue Bar (`ch-abm-bars`)

Replaced the Efficiency Score stacked bar. Now a grouped horizontal bar:
- Grey bars = prior month revenue per ABM
- Blue bars = latest month revenue per ABM
- Sorted by latest month revenue descending
- Month labels in legend and subtitle come from `latestPriorRows(FSMSR)`

### 5.3 ABM Scorecard table

Unchanged. Still shows Score (the 100-pt composite), MSRs, Net Rev, MoM%, Cov%, Targ%, Strat SKUs, Ret%. Score is still computed but only displayed in the table — not plotted as the primary chart.

**Score formula reference** (for future use):
```
growthScore    = clamp((MoM% + 25) / 50, 0, 1) × 35
targetingScore = (revenue from listed products / total revenue) × 30
coverageScore  = (active doctors / mapped doctors) × 25   [needs Doctor Master]
skuScore       = (strategic brands sold / total strategic brands) × 10
Total          = sum of above (max 100)
```

---

## 6. MSR slide (Slide 8) — changes

### 6.1 KPI strip (6 tiles, `.kpi-row.six`)

| Tile | Source |
|---|---|
| Latest Month Revenue | `sum(FSMSR where monthKey === latestKey and !is_return)` |
| FY Revenue (to date) | `totalNet` from `msrStats()` |
| Avg per MSR | `totalNet / activeMSRs` |
| Top MSR | MSR with highest `net` |
| Targeting Fit / Customers | `targPct` if Doctor Master loaded, else unique customer count |
| Prior Month Revenue | `sum(FSMSR where monthKey === priorKey and !is_return)` |

---

## 7. Slide 11 — simplified YoY Analysis Center

### Removed from v6
- Revenue Bridge waterfall (still on Slide 3)
- Month Mirror dual-FY bar chart (still on Slide 2)
- Growth Attribution donut (still on Slide 5)
- Analysis Controls card (card filters are hidden; no UI to show)

### Retained (unique to Slide 11)
| Chart | ID | What it shows |
|---|---|---|
| Product Momentum Quadrant | `ch-yoy-quad` | Full-width. X = PY net, Y = YoY %, bubble size = CY net. 4 zones: Stars, Rising, Cash Cows, Drag |
| Top 5 Positive Contributors | `ch-yoy-pos` | Products with largest absolute YoY gains |
| Top 5 Negative Contributors | `ch-yoy-neg` | Products with largest absolute YoY losses |
| Product Winners & Leaks | `ch-yoy-products` | Combined bar: top 14 movers by absolute delta, green/red |
| Boardroom Signals | `yoy-action-b` | Auto-generated insight table from `buildYoYSignalsV2()` |
| Product Velocity Radar | `ch-yoy-matrix` | Scatter: PY net (X) vs CY net (Y). Diagonal = parity. Bubble size = |Δ| |

### Hidden placeholders
The DOM still has `<div id="ch-yoy-bridge" style="display:none">` etc. so `renderYoYAnalysisCenterContent()` can reference them without erroring. The render calls for Bridge, Month Mirror, and Growth Attribution are removed from the JS function.

### "Share of Movement" (Slide 11 tooltip)
Appears in hover on Top 5 Gainers / Losers bars: `%{customdata[1]:.0f}%`. Calculated as:
```javascript
const totalY = items.reduce((a,b) => a + Math.abs(b.delta), 0);
shareOfMovement = Math.abs(item.delta) / totalY * 100;
```
Answers: "this product drove X% of total positive (or negative) movement."

---

## 8. Slide 13 — Field Force Register

### HTML
Section `#slide-13`. Toolbar: scope selector (Current / Previous / Both FY), search input, page-size selector, Export xlsx + CSV buttons.

### State
```javascript
let FF_STATE = { page:1, pageSize:50, sortCol:'date', sortDir:'desc', search:'' };
```
Reset to defaults in `goChoice()` alongside the existing state resets.

### Data source
`getFFRowsRaw()` reads from `FSMSR` / `FPREVMSR` depending on scope. Each output row:
```
{ date, fy, abm, msr, customer, territory, product, bill_no, qty, net_value, is_return }
```
`net_value` is signed (negative for returns).

### Filtering / sorting
`applyFFFilter(rows)` applies the search string across `abm + msr + customer + territory + product + bill_no`, then sorts by `FF_STATE.sortCol` / `FF_STATE.sortDir`.

### Functions
| Function | Purpose |
|---|---|
| `renderFieldRegister()` | Full render — builds header, body, pager |
| `ffSort(col)` | Toggle sort on column click |
| `onFFChange()` | Called on search/scope/page-size change — resets to page 1 |
| `ffPage(dir)` | Prev / Next pagination |
| `exportFFAll()` | Export all filtered rows as XLSX via SheetJS |
| `exportFFCSV()` | Export all filtered rows as CSV |

### Responds to master filter
`FSMSR` and `FPREVMSR` are already the filtered sets after `applyF()` runs, so the Field Force Register automatically reflects whatever ABM / MSR / Product / Customer / Territory is selected in the master filter bar.

---

## 9. Revenue Bridge — logic reference (no code change)

Documented here for reference since users asked for explanation.

`buildRevenueBridge(curRows, prevRows)` at the comparable-period grain:

| Bar | Formula | Grain |
|---|---|---|
| Prev FY Net | `Σ prevRows net` | — |
| Volume Δ | `Σ (CurQty − PrevQty) × PrevPrice` per SKU | SKU |
| Price Δ | `Σ (CurPrice − PrevPrice) × CurQty` per SKU | SKU |
| Mix Δ | `Σ (CurShare − PrevShare) × PrevRevenue` per SKU (both-year SKUs only) | SKU |
| New Biz | `Σ CurRevenue` for customers absent from prevRows | Customer |
| Lost Biz | `−Σ PrevRevenue` for customers absent from curRows | Customer |
| Residual | `YoY − (Volume + Price + Mix + NewBiz + LostBiz)` — closes cross-effects | — |
| Cur FY Net | `Σ curRows net` | — |

Price = volume-weighted (`net / qty`). Residual is always small if customer churn is low.

---

## 10. Decimal formatting standards (v7)

| Function / place | v6 | v7 |
|---|---|---|
| `fmtPct(n)` default | 1 dp | 2 dp |
| `fmtDelta(n)` | 1 dp | 2 dp |
| `fmtMoney` — thousands | `.toFixed(1)K` | `.toFixed(2)K` |
| Share Shift pp | `.toFixed(1)` | `.toFixed(2)` |
| Return rate % | `.toFixed(1)` | `.toFixed(2)` |
| On-strategy shift pp | `.toFixed(1)` | `.toFixed(2)` |
| Concentration shift pp | `.toFixed(1)` | `.toFixed(2)` |
| All other `.toFixed(1)` percent displays | 1 dp | 2 dp |

`.toFixed(0)` (integer counts, chart axis labels, score badges) unchanged.

---

## 11. Testing checklist

- [ ] Open dashboard — Slide 1 loads with PY YoY tiles populated (not "Not loaded")
- [ ] Slide 2 — Worst Month shows true lowest month, not same as Best Month
- [ ] Filter by ABM (e.g. Arindam) — Slides 2, 3, 4, 5, 6 all narrow to his customer set
- [ ] Filter by MSR — same cross-slide propagation
- [ ] Customer dropdown — duplicate names show "(Station)" suffix
- [ ] Selecting "Chandan Enterprises (Kolkata)" filters to that station only
- [ ] Slide 7 — ABM Revenue Bar shows grouped latest/prior month bars
- [ ] Slide 7 / 8 KPI strips — 6 tiles visible with current month + FY cumulative
- [ ] Slide 11 — No Revenue Bridge, no Month Mirror, no Growth Attribution; Momentum Quadrant is full-width
- [ ] Growth Attribution donut (Slide 5) — labels appear outside on dark background
- [ ] All decimals show 2 dp (Share Shift, return %, growth %)
- [ ] Slide 13 accessible via nav; grid populates with ABM/MSR/Customer/Product rows
- [ ] Slide 13 — search by MSR name narrows grid
- [ ] Slide 13 — column header click sorts; second click reverses
- [ ] Slide 13 — Export xlsx and CSV produce correct files
- [ ] Master filter reset clears ABM/MSR; all slides return to unfiltered state

---

## 12. Known limitations

| Item | Status |
|---|---|
| ABM filter on Slides 7/8 scorecard tables | Scorecard uses `FSMSR` which IS filtered by `passMsrDim` — works correctly |
| Customers served by multiple ABMs | Will appear in both ABMs' filtered views (expected — they belong to both territories) |
| Doctor Master targeting % | Only meaningful if MSR file has product columns filled AND Doctor Master is loaded |
| Slide 13 doctor columns | No doctor-level data in DMSR rows — doctor-level detail is only in `DOC` (point-in-time) |
| `dashboard_presentation_codex.html` | Not updated in Sprint A/B — still on v6 architecture |

---

## 13. File map

| File | Role |
|---|---|
| `dashboard_presentation.html` | **Primary file — v7 (this document)** |
| `handoff_presentation_v3.md` | **This document** |
| `handoff_presentation_v2.md` | v6 architecture — still accurate for FY engine, Revenue Bridge math, comparable-period semantics |
| `handoff_presentation_v1.md` | v5 — filter / cross-filter / lazy-render basics still valid |
| `dashboard_presentation_codex.html` | v6 sibling — denser executive layout, not updated to v7 |
| `dashboard_strategic.html` | Analyst dashboard — separate codebase |
| `files/sales.xls` | Current FY sales (FY26-27, Apr–May 2026) |
| `files/previous_sales.xls` | Previous FY sales (FY25-26, Apr 2025–Mar 2026) |
| `files/msr.xlsx` | MSR + ABM mapping file |
| `Doctor_Master.xlsx` | Doctor universe (optional — activates targeting + coverage) |
