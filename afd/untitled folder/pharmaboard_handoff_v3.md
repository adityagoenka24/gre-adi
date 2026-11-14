# PharmaBoard — Handoff v3 (Strategic Dashboard)

**Last updated:** May 2026
**Client:** AFD Hospicare (S.D. Pharmaceuticals)
**Active file:** `dashboard_strategic.html` *(supersedes `dashboard_sales_v3.html` / `index.html`)*
**Companion docs:** `Strategic_Brief.md` · `Presenter_Cheatsheet.md`
**Predecessor handoff:** `pharmaboard_handoff_v2.md` *(still valid for SwilERP file structure, build system, mgmt dashboard)*

> **Tldr for the next chat:** the dashboard was rebuilt from the ground up around a third data file (Doctor Master) that was previously ignored. Six tabs, premium navy/gold design, auto-surfaced insights, chart-zoom modal, late-upload, MSR-name salutation normalization. The Field Force tab is the new heart — it computes targeting effectiveness, doctor portfolio pyramid, speciality mix, HQ vs Extension productivity using the Doctor Master.

---

## 1. What changed from v2 → v3

| Area | v2 (sales_v3) | v3 (strategic) |
|---|---|---|
| Tabs | Overview · Sales · Products · MSR Analytics (4) | Executive Pulse · Growth Engine · Field Force · Product Strategy · Territory · Register (6) |
| Doctor data | Not used. "Doctor" was a cosmetic label on the customer column. | Three-way join: Sales ↔ Customer-MSR ↔ Doctor-MSR. Unlocks targeting analytics. |
| Visual hierarchy | Flat — equal-weight cards | Hero KPI tiles with sparklines · auto-surfaced Intelligence Brief leads each tab · navy/gold premium design |
| Insights | Computed but demoted below charts | Computed and surfaced as the headline narrative (Pulse + every tab) |
| Chart interaction | Click to cross-filter | Click cross-filter + **Expand button on every card** opens a fullscreen modal with Plotly's modeBar (zoom/pan/reset/save) |
| File loading | Choice → Upload → Mapper → App (locked) | Same flow, plus **late-upload pills in topbar** for Doctor Master / MSR if missed at start |
| Name joins | Plain uppercase compare; broke when MSR file used "Mr. Arnab Dutta" and Doctor Master used "ARNAB DUTTA" | `normName()` strips Mr./Mrs./Ms./Dr./Prof./Shri/Smt; `JOIN_HEALTH` diagnostic surfaces match % |
| Growth display | "1,040,000%" for new products with zero prior | Capped at 999, shown as "▲ NEW" |
| Decisions / Roadmap | Wordy section at the bottom of each tab | Single "Strategic Decisions" grid on Pulse — six tagged cards (Protect / Accelerate / Fix / Intervene / Realign / Expand) |
| Filters | Date, product, customer, territory, MSR | Add **speciality** and **doctor tier** (SUPER CORE / VIP / CORE) filters |

---

## 2. File inventory

Located in: `/Users/adityagoenka/Desktop/Sandbox/Pharmaboard/`

| File | Role | Lines | Bytes |
|---|---|---|---|
| `dashboard_strategic.html` | **Active dashboard** — single file, browser-only | ~2,957 | ~165 KB |
| `Strategic_Brief.md` | Redesign rationale, KPI hierarchy, missing-data recommendations, AI roadmap | ~203 | — |
| `Presenter_Cheatsheet.md` | Tab-by-tab walkthrough for live QBR — chart, how to read, story to tell | ~214 | — |
| `pharmaboard_handoff_v3.md` | **This file** | — | — |
| `pharmaboard_handoff_v2.md` | Predecessor doc — keep for SwilERP file format, mgmt dashboard, build system | — | — |
| `Doctor_Master.xlsx` | 1,366 doctors × 12 cols — Doctor Name, MSR Code, MSR Name, City, Territory, Speciality, Category (VIP/CORE/SUPER CORE), Qualification, Territory Type (HQ/EX), Address, Products Mapped, Shared Across MSRs | — | ~88 KB |
| `index.html` *(v3-era)* | Previous strategic dashboard draft — **superseded** | ~2,042 | — |
| `index-3.html` | Older artifact in folder — **superseded** | — | — |

**Always work from `dashboard_strategic.html`.** Older files are kept for reference only.

---

## 3. Architecture summary

Same backbone as v2: **single-file HTML · Plotly + SheetJS via CDN · zero build step · open in any browser**. No server, no login, no data leaves the machine.

### App flow

```
1. Choice screen
   ├── Auto-fetch (GitHub: sales.xls + msr.xlsx) — Doctor_Master.xlsx URL configured but file not on GitHub
   └── Upload screen → three slots (sales required, MSR + Doctor optional)
         ↓
2. Mapper screen — auto-detects columns per schema, user confirms
         ↓
3. App (6 tabs, topbar status pills, late-upload)
```

### State variables (global)

```javascript
RAW    = {}          // parsed rows per file ('sales','msr','doc')
COLS   = {}          // column headers per file
MAP    = {}          // canonical→actual column mapping per file

D      = []          // cleaned sales rows
DMSR   = []          // sales × Customer-to-MSR join (one row per sale per assigned MSR)
DOC    = []          // cleaned doctor records (from Doctor Master)
FS     = []          // D after filters + cross-filter
FSMSR  = []          // DMSR after filters

MSR_PRODUCTS = Map() // normName(msr) → Set<mapped product tokens>
DOC_BY_MSR   = Map() // normName(msr) → [doctor records]
DOC_BY_CITY  = Map() // norm(city)   → [doctor records]

JOIN_HEALTH  = { msrLinked, msrTotal, pct, cityLinked, cityTotal, cityPct }

CF     = {}          // active cross-filter {dim, val}
TBL, PROD_SORT, MSR_SORT, TERR_SORT  // sort state for each table
```

### Data flow

```
sales.xls   → parseXLS → cleanSales(RAW.sales, MAP.sales)  → D
msr.xlsx    → parseXLS → cleanMSR(RAW.msr, MAP.msr)        → DMSR (D × customer-to-MSR join)
Doctor.xlsx → parseXLS → buildDoctorIndex(RAW.doc, MAP.doc) → DOC + MSR_PRODUCTS + DOC_BY_MSR + DOC_BY_CITY
                                                            ↓
                                                       computeJoinHealth()  ← sanity check
                                                            ↓
                                                       applyF() → FS, FSMSR
                                                            ↓
                                                       render() → tab renderer
```

---

## 4. Critical fix in v3: the `normName()` join

### The bug

The Customer-to-MSR file (`msr.xlsx`) stores reps as **`"Mr. Arnab Dutta"`** (with salutation, title case).
The Doctor Master stores the same person as **`"ARNAB DUTTA"`** (no salutation, all caps).

Every MSR-name join key compared these strings literally. They never matched, so:
- `activeDoctorCount` returned 0
- Doctor Coverage KPI showed "0 of 1366 mapped"
- Targeting Effectiveness was 0% or nonsensical
- Doctor Portfolio Pyramid was empty
- Doctor Watchlist returned no rows

### The fix

`normName(s)` strips salutations before normalising:

```javascript
const SALUTATION_RE = /^(?:mr\.?|mrs\.?|ms\.?|miss|dr\.?|prof\.?|shri|smt\.?|sri)\s+/i;
function normName(s) {
  let v = String(s || '').trim();
  v = v.replace(SALUTATION_RE, '').replace(SALUTATION_RE, '');
  return v.toUpperCase().replace(/\.+/g,'').replace(/\s+/g,' ').trim();
}
```

So `"Mr. Arnab Dutta"`, `"ARNAB DUTTA"`, `"Arnab  Dutta"`, `"DR. SUTAPA GHOSH"` all collapse to the same key.

**Every MSR-name join key replaced** with `normName()`:
- `buildDoctorIndex`: `msrUpper: normName(msr)`
- `MSR_PRODUCTS` keys
- `DOC_BY_MSR` keys
- `targetingEffectiveness` lookup key
- `doctorPortfolio(msrName)` lookup
- `activeDoctorCount` MSR set construction
- `applyF` doctor-tier filter
- `renderDoctorWatch` MSR matching

**Use `norm()` (plain uppercase) for other keys** — products, customer names, cities, stations. Only person names go through `normName()`.

### `JOIN_HEALTH` diagnostic

After both DOC and DMSR exist, `computeJoinHealth()` runs and fills:

```javascript
JOIN_HEALTH = {
  msrLinked: <int>,    // unique MSRs in DOC that appear in DMSR after normName
  msrTotal:  <int>,    // unique MSRs in DOC
  pct:       <0..100>, // msrLinked / msrTotal
  cityLinked: <int>,   // doctor cities matching sales stations
  cityTotal: <int>,
  cityPct:   <0..100>,
}
```

Surfaced two places:
1. **Topbar pill**: `"Doctors · 1366 · join 92%"` — green if ≥60%, red if below
2. **Field Force banner**: red warning if `pct < 40` with explanation of name-format mismatch

If the user sees a red banner, the diagnosis is almost always "name spelling differs between files".

---

## 5. Six-tab structure

### Tab 1 — Executive Pulse (`#tab-pulse`)
- Hero grid: 4 gradient tiles with sparklines (Net Revenue · MoM Growth · Return Drag · Doctor Coverage)
- Auto-surfaced Intelligence Brief: 4–8 insight cards from `buildInsights()`, tagged growth/risk/watch/focus/opp
- Revenue Momentum (`ch-momentum`) + Growth Bridge waterfall (`ch-bridge`)
- Concentration Pareto (`ch-pareto`) + Territory Opportunity Matrix (`ch-opp`)
- Strategic Decisions grid: six tagged cards (Protect / Accelerate / Fix / Intervene / Realign / Expand)

### Tab 2 — Growth Engine (`#tab-growth`)
- KPI row (Latest Net · MoM Δ · Accelerating SKUs · Declining · New/Lost)
- Product Growth Contribution (`ch-growth-waterfall`)
- Product Momentum Matrix (`ch-momentum-matrix`)
- Top Customer × Product heatmap (`ch-cust-prod-heat`)
- Accelerating / Declining tables

### Tab 3 — Field Force (`#tab-field`) — *the new heart, requires Doctor Master*
- Doc-banner (shows when DOC missing or join-health low)
- 6-card KPI row including **Doctor Coverage** and **Targeting Effectiveness**
- MSR Performance Scorecard with composite score (revenue 40 + growth 25 + reach 15 + breadth 10 + targeting 10)
- Doctor Portfolio Pyramid (custom DOM, not Plotly — stacked horizontal bars per MSR)
- Targeting Effectiveness chart (`ch-targeting`)
- Speciality Revenue Mix (`ch-spec-mix`)
- HQ vs Extension productivity (`ch-hq-ex`)
- Doctor Watchlist (auto-tagged Anchor/Untapped/Diversify/Performer)

### Tab 4 — Product Strategy (`#tab-products`)
- KPI row (Active SKUs · Top SKU Share · Accelerating · Declining · High-return)
- Portfolio Quadrant (`ch-prod-quadrant`)
- Concentration Risk (`ch-prod-dep`)
- Top Product Trend (`ch-prod-trend`)
- Decision table with auto role (Accelerate / Defend / Fix / Audit / Harvest / Hold)

### Tab 5 — Territory (`#tab-territory`)
- KPI row, Risk × Growth Matrix (`ch-terr-risk`), State-Product Heatmap (`ch-state-product`), Trend lines, Action table

### Tab 6 — Register (`#tab-register`)
- Sortable, searchable row-level table with Excel export

---

## 6. Code section map

```
CONFIG          GH_FILES URLs · SCHEMA · MSR_SCHEMA · DOC_SCHEMA · COLORS · PALETTE · PL/AX/PC
STATE           RAW · COLS · MAP · D · DMSR · DOC · FS · FSMSR · CF · sort state · JOIN_HEALTH
HELPERS         norm · normName · fmtMoney · fmtNum · fmtPct · fmtDelta · safeGrowth · sortBy · etc.
SCREEN ROUTING  showOnly · showApp · showLoad · goChoice · goUpload
FILE INTAKE     startGithub · onFile · proceedFromUpload · parseXLS · cleanHeader · autoMap
MAPPER UI       buildMapper · addMapSection · makeMapRow · updatePreview · launchDashboard
DATA CLEANING   parseDate · parseMoney · ffill · cleanSales · buildMSRLookup · cleanMSR
                tokenizeProducts · productTokenMatch · computeJoinHealth · buildDoctorIndex
FILTERS         buildFilters · fillSelect · resetF · applyF · setCF · clearCF · hideCF
COMPUTE         monthKey · monthLabel · monthBuckets · maxDate · latestPriorRows
                summarize · groupRows · growthByDim · productStats · msrStats
                targetingEffectiveness · doctorPortfolio
ROUTING/RENDER  switchTab · render · resizeCharts · renderPeriodBadge · noData
TAB 1 PULSE     renderPulse · renderHeroes · sparkData · activeDoctorCount
                renderInsights · buildInsights
                renderMomentum · renderBridge · renderPareto · renderOpportunity
                renderDecisions
TAB 2 GROWTH    renderGrowth · renderGrowthKPI · renderGrowthWaterfall · renderMomentumMatrix
                renderCustProdHeat · renderAccelTable · renderDeclTable
TAB 3 FIELD     renderField · renderDocBanner · renderFFKPI · renderMSRTable · msrSort
                renderPyramid · renderTargeting · renderSpecMix · renderHQEx
                renderDoctorWatch
TAB 4 PRODUCTS  renderProducts · renderProdKPI · renderProdQuadrant · renderProdDep
                renderProdTrend · renderProdTable · prodSort
TAB 5 TERR      renderTerritory · renderTerrKPI · renderTerrRisk · renderStateProduct
                renderTerrTrend · renderTerrTable · terrSort
TAB 6 REG       renderRegister · toggleSort
EXPORT          dlPng · dlExcel · downloadReport
ZOOM MODAL      openChartModal · closeChartModal · exportModalPng · injectZoomButtons
LATE UPLOAD     renderFileStatus · lateUploadDoc · lateUploadMSR · lateUpload · flashToast
                (also: render wrapper that calls renderFileStatus + injectZoomButtons)
RESET           resetAll
```

---

## 7. Key new features (v3) — implementation notes

### Chart zoom modal

Every card with a chart has an **Expand** button injected by `injectZoomButtons()` which runs after every render. It walks `.card .download` (the PNG button) and inserts a sibling `.zoom-btn` that calls `openChartModal(chartId, title, subtitle)`.

`openChartModal` clones the chart's `data` and `layout`, enlarges fonts and margins, and renders into `#chart-modal-target` with `displayModeBar:true` so Plotly's native zoom/pan/reset toolbar appears. Pressing **Esc** closes.

### Late upload

Topbar shows file-status pills. If MSR or Doctor Master is missing, the pill is amber-pulsing and clickable. Clicking opens a hidden file input → `lateUpload()` → `parseXLS` + `autoMap` + cleanup function → re-render. Surfaced via toast.

### Salutation-aware MSR joining

Already described in section 4. The **only person-name join key** that must be normalised is the MSR name. Customer/Doctor names are kept as-is (they're either separate ID spaces or already unique enough).

### Growth display capping

`safeGrowth(latest, prior)` returns `999` when `prior==0 && latest>0` as a sentinel meaning "NEW".
`fmtDelta()` renders 999 as `"▲ NEW"` instead of `"+1,040,000%"`.

---

## 8. Validated test scenarios

Run the smoke test from `/tmp/smoke_real.js` (regenerate via `/tmp/build_smoke.py`).

Synthetic data simulates the real-world MSR name mismatch (`"Mr. Arnab Dutta"` in MSR file vs `"ARNAB DUTTA"` in Doctor Master). Expected output:

```
JOIN_HEALTH: { msrLinked:2, msrTotal:2, pct:100, cityLinked:2, cityTotal:2, cityPct:100 }
DOC.length: 3
activeDoctorCount: 3
doctorPortfolio("Mr. Sutapa Ghosh"): total:2, vip:1, core:1
doctorPortfolio("Sutapa Ghosh"):     total:2, vip:1, core:1   ← salutation-invariant
doctorPortfolio("Mr. Arnab Dutta"):  total:1, super:1
targetingEffectiveness: [
  {msr:"Mr. Sutapa Ghosh", pct:100},
  {msr:"Mr. Arnab Dutta",  pct:~41}
]

normName("Mr. Arnab Dutta")  → "ARNAB DUTTA"
normName("ARNAB DUTTA")      → "ARNAB DUTTA"
normName("Dr. Sutapa Ghosh") → "SUTAPA GHOSH"
normName("Shri Ranjan Kumar")→ "RANJAN KUMAR"
```

When the user reports a Doctor-related bug, **always run the smoke test against their data first** to isolate compute layer vs render layer.

---

## 9. Known limitations / open issues

1. **GitHub repo doesn't have `Doctor_Master.xlsx`.** Auto-fetch silently misses it. The late-upload flow handles this gracefully but ideal would be to push the file to the repo. URL configured in `GH_FILES.doc`.

2. **Targeting effectiveness uses fuzzy first-two-word match.** Works for `"KOVER ALL TAB"` ↔ `"KOVER ALL TAB"` and `"AFDICAL ADVANCE TAB"` ↔ `"AFDICAL"` but not for `"ECOXIB 60 MR"` vs `"ECOXIB60"`. The Doctor Master itself has inconsistent product naming (sometimes `"ECOXIB 60 MR TAB"`, sometimes `"ECOXIB60"`, `"Ecoxib p, Ecoxib 60MR"`). Worth a cleanup pass on the Doctor Master file before stricter matching is added.

3. **City↔station join is exact-after-norm.** If sales has `"BAGDAH"` and Doctor Master has `"Bagdah, North 24 Parganas"`, they won't match. Solution would be substring or Levenshtein fuzzy match.

4. **Speciality Mix proportionally allocates revenue by doctor speciality count in each city.** It's an estimate, not a measurement. To make it exact, AFD would need to capture which doctor each prescription went through (currently they don't).

5. **No PptxGenJS** — never re-add (Safari crash documented in handoff v2). PNG-per-chart works fine via the modal "Save PNG" button.

6. **Lazy tab rendering not yet implemented** — all tabs render on every `applyF()`. Acceptable on the AFD dataset size (~10K rows). Will need fixing if data grows to 100K+ rows.

7. **Marg ERP adapter not built** — `cleanSales()` is SwilERP-shaped. Adding Marg means writing `cleanMarg()` that outputs the same canonical schema.

---

## 10. Roadmap (priority order)

### Immediate next (Phase 1)
- [ ] Push `Doctor_Master.xlsx` to the GitHub repo so auto-fetch picks it up
- [ ] Clean Doctor Master product names — standardize "KOVER ALL TAB" everywhere instead of "KOVER", "KOVERALL", etc.
- [ ] Add Doctor Master version of the salutation strip on the source file too — recommend AFD re-export with consistent "FIRSTNAME LASTNAME" all caps

### Phase 2
- [ ] Lazy tab rendering (RENDERED set pattern, resize on switch)
- [ ] localStorage persistence of column mapping (skip mapper for return visitors)
- [ ] PDF report export (html2canvas + jsPDF)

### Phase 3
- [ ] Marg ERP adapter — `cleanMarg()` outputs same canonical schema
- [ ] ABM-level rollups (currently only MSR-level)
- [ ] State-level drill-down on Doctor Watchlist

### Phase 4 — high-value analytics
- [ ] Beat-plan adherence — compare actual customer activity vs rep's planned calls *(requires MSR target/call data we don't have today)*
- [ ] Prescription-share modelling — Bayesian estimate of doctor-level Rx share using sales-weighted speciality + product mapping
- [ ] Customer/Doctor churn prediction (XGBoost) — flag relationships likely to drop in next 30/60/90 days
- [ ] Doctor cohort retention curves

### Phase 5
- [ ] Cloud sync via Cloudflare R2 (optional, for clients who want auto-refresh)
- [ ] AFD-specific Management dashboard (production vs sales, territory P&L, MSR vs target)

---

## 11. Strategic narrative (use in QBR)

The dashboard tells a five-act story:

1. **Pulse** — *Here's where we are.*
2. **Growth Engine** — *Here's what's working and what's hurting.*
3. **Field Force** — *Here's the team executing it and the doctors behind the numbers.*
4. **Product Strategy** — *Here's our portfolio bets — defend, accelerate, fix, harvest.*
5. **Territory** — *Here are the regional priorities for next quarter.*

The presenter cheatsheet (`Presenter_Cheatsheet.md`) gives the exact talk-track per chart.

---

## 12. Resume-development prompt cookbook

When starting a new chat to extend this dashboard, paste this handoff + the relevant prompt below.

### Fix a chart
> "The `ch-momentum-matrix` chart on the Growth Engine tab in `dashboard_strategic.html` is showing all bubbles overlapping at the origin. Inspect `renderMomentumMatrix()` — check the X-axis log transform and the cmin/cmax for the color scale."

### Add a chart
> "Add a 'Doctor Specialty × MSR' bipartite chart to the Field Force tab in `dashboard_strategic.html`. Chart ID: `ch-spec-msr-bipartite`. Style: Plotly Sankey, doctor speciality on left → MSR on right, sized by doctor count. Read `renderSpecMix()` for color and styling reference, and inject the zoom button as usual."

### Fix a join
> "The Doctor Master from <Client X> uses doctor codes (D001, D002) instead of MSR names. Add a join path that goes Sales → Customer-MSR → MSR Code → Doctor Master, in addition to the current name-based join. Keep `normName()` as the fallback."

### Add a new ERP
> "Add a Marg ERP adapter to `dashboard_strategic.html`. Marg's sales export columns are: Item Name, Voucher No, Party Name, Date, Qty, Rate, Amount. Add aliases to `SCHEMA` and write a `cleanMarg()` function that outputs the same canonical schema as `cleanSales()`."

### Add a chart insight
> "Add a new auto-surfaced insight type to `buildInsights()` in `dashboard_strategic.html`: detect when a single MSR's revenue is more than 30% of total field-force revenue and flag it as concentration risk."

### Localstorage persistence
> "In `dashboard_strategic.html`, after `launchDashboard()` succeeds, save `MAP` to localStorage keyed by a hash of `COLS.sales`. At the start of `buildMapper()`, check for a saved mapping and pre-populate if found. Show a 'Using saved mapping' notice with a 'Reset' link."

---

## 13. Inherited critical rules (still apply)

These rules from v2 are unchanged:

1. **No PptxGenJS** — ever. Safari WebKit crash on script load.
2. **`branchvalues:'remainder'` for treemaps** — never `'total'` with computed root.
3. **`cleanMSR()` must run after `cleanSales()`** — DMSR depends on D.
4. **Forward-fill before filtering** in `cleanSales()`.
5. **Three-stage skip list** — name skip-keywords, empty bill_no, customer skip-keywords.
6. **MSR file column names have trailing spaces** — aliases must match exactly.
7. **Excel serial date offset is 25569** — using 25568 shifts dates by 1 day.
8. **`// ── derived` comment** in mgmt dashboard CLIENT block is a regex anchor — never remove.

New v3 rule:

9. **Use `normName()` not `norm()` for person names.** Customer/product/city use `norm()`. Only MSR/rep names go through `normName()`.

10. **JOIN_HEALTH must be computed after both DOC and DMSR exist.** Late uploads must re-call `computeJoinHealth()` for the topbar pill to refresh.

---

## 14. Tech stack reference

```
HTML5 single file
Plotly.js     2.35.2  — all charts (CDN)
SheetJS xlsx  0.18.5  — XLS/XLSX/CSV parsing (CDN)
Plus Jakarta Sans     — display typography
Inter                 — body typography
JetBrains Mono        — numeric/code
```

Design tokens (all CSS variables at `:root`):
- **Navy** `#0b1f3a` — primary surface (topbar, hero default)
- **Royal blue** `#1e40af` / `#2563eb` — primary accent
- **Gold** `#b08a3e` / `#c9a84c` — executive highlight (Doctor analytics, Anchor tag)
- **Emerald** `#047857` / `#059669` — growth, positive
- **Crimson** `#b91c1c` / `#dc2626` — risk
- **Amber** `#b45309` / `#d97706` — watch
- **Violet** `#5b21b6` / `#7c3aed` — SUPER CORE, opportunity tag
- Body grey `#334155`, muted `#64748b`, line `#e2e8f0`, bg `#f4f6fb`

---

## 15. Validation checklist for next chat

Before claiming any change is shipped:

1. [ ] `node --check` on the extracted JS — no syntax errors
2. [ ] Run `/tmp/smoke_real.js` — JOIN_HEALTH = 100%, targeting and portfolio fns return non-empty
3. [ ] Open in browser — Pulse tab renders without errors in console
4. [ ] Click **Expand** on any chart — modal opens with Plotly toolbar
5. [ ] Verify topbar shows `Sales · X / MSR · Y / Doctors · Z · join W%` pills
6. [ ] Field Force tab shows real numbers — not `0 of 1366`
7. [ ] Targeting Effectiveness shows a sorted horizontal bar chart (not "No data")

---

*End of handoff v3. Continues `pharmaboard_handoff_v2.md` for SwilERP file structure, build pipeline, mgmt dashboard. Active development happens on `dashboard_strategic.html`.*
