# PharmaBoard · Presentation Dashboard — Handoff v2 (Embedded YoY · FY-aware)

**Files:** `dashboard_presentation.html`, `dashboard_presentation_codex.html`
**Companion script:** `presenter_script.md`
**Sibling dashboards:** `index-4.html` (chart-only), `dashboard_strategic.html` (analyst)
**Predecessor:** `handoff_presentation_v1.md` (still accurate for filter / cross-filter / lazy-render basics; v2 supersedes the YoY model and Slides 1–12 architecture)

This handoff documents the v6 build, which embeds YoY analytics throughout the deck on a fiscal-year-aware comparable-period engine, replaces the single global filter bar with global + per-card local filters, rebuilds Slide 11 as an Executive YoY Analysis Center, and replaces the Slide 12 sales register with a full data grid.

---

## 1. What changed (v5 → v6)

| Area | v5 | v6 |
|---|---|---|
| Fiscal year | Not modelled. Dates treated as calendar. | First-class. `FY_CUR`, `FY_PREV`, `COMP_MONTHS` derived from data. Every row tagged with `fy` + `fy_month_idx`. |
| YoY comparison | Calendar same-month/day window; one slide (Slide 11) + Product YoY lens. | Comparable-period gate (intersection of fiscal months present in both files) applied at filter layer. YoY band embedded on **every slide**. |
| Filter bar | Date from / to, calendar month, dimensions. | FY mode + fiscal-month range + dimensions. Date inputs removed. New FY chip at right of bar. |
| Card-local filters | None. | Generic scaffold (`mountCardFilters`) — each YoY card has its own filter strip wired only to that card. |
| Revenue Bridge | Generic MoM waterfall. | True YoY decomposition: Volume Δ · Price Δ · Mix Δ · New Biz · Lost Biz · Residual. |
| Slide 11 | "YoY Command Center" — 4 tiles + 4 charts. | "Executive YoY Analysis Center" — 6 tiles + 8 charts including Revenue Bridge hero, Momentum Quadrant, Growth Attribution donut, Top Movers strip, expanded Boardroom Signals. |
| Slide 12 | Read-only table preview (300 rows) + Excel export. | Full data grid: search · sort · pagination · per-column filter · sticky header · YoY % column · view/all/CSV exports. |

---

## 2. Architecture in one screen

```
┌──────────────────────────────────────────────────────────────┐
│  ONBOARDING (unchanged) → APP SHELL                          │
│   ├─ topbar (brand, period, slide counter, fullscreen)       │
│   ├─ filter bar (FY · From · To · Product · Customer · Region│
│   │              ABM · MSR · Speciality · Tier · Reset · FY  │
│   │              chip)                                        │
│   ├─ cf-bar (cross-filter banner)                            │
│   └─ deck (12 slides, scroll-snap)                           │
│        Every slide carries:                                  │
│         · standard KPI strip                                 │
│         · YoY band (comparable-window tiles)                 │
│         · main chart(s) with optional card-filter strip      │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Fiscal-year + comparable-period engine

### 3.1 Tagging

`cleanSales()` writes two new fields onto every row in `D` and `DPREV`:
- `r.fy` — `"FYxx-yy"` like `FY26-27`
- `r.fy_month_idx` — 1 for April, 2 for May, …, 12 for March

`cleanMSR()` inherits both onto every row in `DMSR` and `DMSR_PREV`.

### 3.2 Detection

`detectFiscalYears()` runs after data load (just before `buildFilters()`). It:
1. Buckets rows in `D` by `fy` and picks the highest tag as `FY_CUR`.
2. Buckets rows in `DPREV` by `fy` and picks the highest tag *below* `FY_CUR` as `FY_PREV`.
3. Sets `FY_CUR_MONTHS` / `FY_PREV_MONTHS` to the sets of fiscal months present in each.
4. Sets `COMP_MONTHS = FY_CUR_MONTHS ∩ FY_PREV_MONTHS` — the comparable window.

If no previous-year data is loaded, `COMP_MONTHS = FY_CUR_MONTHS`. The deck still renders, but every YoY card shows a "previous-year file not loaded" empty state.

### 3.3 Comparable-period semantics

The current-FY file in `files/sales.xls` covers Apr–May 2026 (FY26-27 partial). The previous-FY file in `files/previous_sales.xls` covers Apr 2025 – Mar 2026 (FY25-26 full). On load:

```
FY_CUR       = "FY26-27"
FY_PREV      = "FY25-26"
FY_CUR_MONTHS  = {1, 2}              (Apr, May)
FY_PREV_MONTHS = {1, 2, 3, …, 12}    (Apr–Mar)
COMP_MONTHS    = {1, 2}              (Apr, May — the intersection)
```

Every YoY metric on the deck restricts `DPREV` to fiscal-month-index in `COMP_MONTHS` *before* computing the comparison. There is no path through the code that lets a YoY chart compare Apr–May current against full Apr–March previous.

---

## 4. Filter pipeline (`applyF`)

Two-pass:

**Pass 1 — global filter.** Reads `f-fy`, `f-fmfrom`, `f-fmto`, `f-prod`, `f-cust`, `f-rgn`, `f-abm`, `f-msr`, `f-spec`, `f-tier`, the cross-filter (`CF`), and the doctor-derived restrictor. Produces:

```
FS_CUR_FILTERED   — D rows in FY_CUR, dimension-filtered, no comp gate
FS_PREV_FILTERED  — DPREV rows in FY_PREV, dimension-filtered, no comp gate
FSMSR_CUR (local) — DMSR rows in FY_CUR, dimension-filtered
FSMSR_PREV(local) — DMSR_PREV rows in FY_PREV, dimension-filtered
```

**Pass 2 — comparable-period gate.** Restricts the four sets to `COMP_MONTHS` (intersected with the user's fiscal-month range if set):

```
FS_CUR_COMP       — used by every YoY card
FS_PREV_COMP      — used by every YoY card
FSMSR_CUR_COMP    — used by MSR/ABM YoY cards
FSMSR_PREV_COMP   — used by MSR/ABM YoY cards
```

**Legacy aliases** for slides that haven't been refactored:
- `FS` / `FSMSR` = current-FY filtered (no comp gate — Slide 2 trend uses these to show ALL current-FY months even outside `COMP_MONTHS`).
- `FPREV` / `FPREVMSR` = previous-FY comparable rows (so existing code paths get apples-to-apples).

When the user picks **FY = Previous only** or **Both**, `FS` / `FSMSR` are reshuffled accordingly while the `_COMP` sets remain definitionally pure.

---

## 5. Card-local filters

Every YoY card has its own filter strip mounted via:

```js
mountCardFilters({
  cardKey: 'prodYoY',
  mountId: 'cardf-prodyoy',
  fields: [
    { key:'product',  label:'Product', kind:'option', options:[…], all:'All' },
    { key:'monthFrom', label:'From',   kind:'fy-month' },
    { key:'monthTo',   label:'To',     kind:'fy-month' },
  ],
  onChange: renderProductYoYInner,
});
```

State lives in `LOCAL_F[cardKey]`. The `onChange` handler is stored in `CARD_RENDER_REGISTRY[cardKey]` so the slide can re-invoke it without re-running the global pipeline. `applyLocalFilter(cardKey, curRows, prevRows)` narrows row sets by the card-local state and returns `{ cur, prev, state, monthLabel }`.

`resetF()` clears `LOCAL_F` as well as the global filter bar.

### Card-key registry

| Card | cardKey | Slide |
|---|---|---|
| Momentum chart | `momentum` | 2 |
| Revenue Bridge | `bridge` | 3 |
| Product YoY Lens | `prodYoY` | 4 |
| Customer YoY | `custYoY` | 5 |
| Region YoY | `regYoY` | 6 |
| ABM YoY | `abmYoY` | 7 |
| MSR YoY | `msrYoY` | 8 |
| Analysis Controls | `yoyCtrl` | 11 |

---

## 6. YoY KPI definitions

All KPIs are recomputed per render from the relevant filtered row set.

| KPI | Formula |
|---|---|
| Net (after returns) | `Σ(sales_value where !is_return) − Σ(|sales_value| where is_return)` |
| YoY Δ | `NetCur − NetPrev` |
| YoY % | `safeGrowth(NetCur, NetPrev)` — handles ÷ 0 and Prev<0 |
| Volume Δ | `Σ((QtyCur − QtyPrev) × PrevPrice)` per SKU |
| Price Δ | `Σ((PriceCur − PricePrev) × QtyCur)` per SKU |
| Mix Δ | `Σ((ShareCur − SharePrev) × PrevNet)` per SKU present both years |
| New Biz | `Σ NetCur` for customers absent from `FS_PREV_COMP` |
| Lost Biz | `−Σ NetPrev` for customers absent from `FS_CUR_COMP` |
| Existing Expansion | `Σ Max(0, NetCur − NetPrev)` for retained customers |
| Share Shift | `(NetCur / TotalCur) − (NetPrev / TotalPrev)` in pp |
| Customer Retention | `# customers active both years / # previous-year customers` |
| Rank Movement | `prevRank − curRank` (positive = improved) |

`PrevPrice` / `CurPrice` are volume-weighted (`Net / Qty`).

---

## 7. Revenue Bridge reconciliation

`buildRevenueBridge(curRows, prevRows)` returns:

```
{ prevNet, curNet, yoy,
  volume, price, mix,
  newBiz, lostBiz, expansion, residual }
```

The waterfall plots `[prevNet, volume, price, mix, newBiz, lostBiz, residual, curNet]` with measures `[absolute, relative×6, total]`. The residual closes any decomposition cross-effect so the math balances at the rupee. Hover tooltips can be extended to show the underlying SKU / customer lists (TODO; not in v6).

---

## 8. Slide-by-slide YoY surface

| # | Slide | YoY surface |
|---|---|---|
| 1 | Cover | 4-tile hero strip (Cur Net · YoY Δ · YoY % · Customer Retention) below the megas |
| 2 | Momentum | 4-tile YoY band + dual-FY overlay chart (grey prev, blue cur, gold YoY %); card-local product + month range |
| 3 | Growth Story | YoY band + Revenue Bridge waterfall + Top 5 Accel / Decline (YoY) panel; card-local product/customer/region |
| 4 | Product Portfolio | 6-tile YoY strip (incl. Volume Δ, Price Δ, Share Shift) + Product YoY Lens + Product Momentum Quadrant; card-local product + month range |
| 5 | Customer Base | 6-tile YoY band + Customer YoY chart + Growth Attribution donut; card-local customer/region/month |
| 6 | Territory Map | 4-tile YoY band + Region YoY chart; card-local region/product/month |
| 7 | ABM Team | 4-tile YoY band + ABM YoY chart with rank-movement chips; card-local ABM/product/month |
| 8 | MSR Performance | 4-tile YoY band + MSR YoY chart with rank-movement chips; card-local MSR/product/month |
| 9 | Doctor Universe | 4-tile inherited MSR YoY band (Pool Δ · Active MSRs · On-Strategy % · Overlap) |
| 10 | Risks & Actions | 4-tile YoY Watch band (Declining SKUs · SKU Churn · Customers Lost · Top-5 Concentration); action ranking now considers both MoM and YoY |
| 11 | Executive YoY | Full slide: 6 KPI tiles · Analysis Controls strip · Revenue Bridge · Momentum Quadrant · Month Mirror · Growth Attribution · Top Movers · Winners/Leaks · Boardroom Signals · Velocity Radar |
| 12 | Sales Register | Data grid with YoY % column, search, sort, pagination, per-column filter, view/all/CSV exports |

---

## 9. New JS surface — function map

| Function | Purpose |
|---|---|
| `fyOf(date)`, `fyMonthIndex(date)`, `fyMonthLabel(idx)` | Fiscal-year primitives |
| `detectFiscalYears()` | Set FY_CUR / FY_PREV / COMP_MONTHS from D / DPREV |
| `comparablePeriodLabel()`, `periodChipText()` | Human-readable labels for the chip and headers |
| `fiscalMonthCompare(cur, prev)` | Apr→Mar sorted per-fiscal-month aggregation |
| `skuCompareWithVolume(cur, prev)` | Per-SKU map with Net + Qty + Price |
| `buildRevenueBridge(cur, prev)` | Volume/Price/Mix/New/Lost decomposition |
| `buildGrowthAttribution(cur, prev)` | Existing-growth/decline/new/lost buckets |
| `renderRevenueBridge(id, cur, prev)` | Waterfall renderer |
| `renderGrowthAttribution(id, cur, prev)` | Donut renderer |
| `renderProductMomentumQuadrant(id, cur, prev)` | Quadrant scatter renderer |
| `mountCardFilters(spec)` | Card-local filter strip mount |
| `applyLocalFilter(cardKey, cur, prev)` | Narrow row sets by local state |
| `yoyTile(label, value, sub, tone)` | YoY band tile factory |
| `rankChip(curRank, prevRank)` | Up/down/flat rank-movement chip |
| `renderXxxYoYBand()` per slide | Per-slide YoY band renderer (cover, momentum, growth, prod, cust, terr, abm, msr, doc, risk) |
| `renderXxxYoYChart()` per slide | Per-slide YoY chart renderer (the ones that respond to card-local filters) |
| `renderRegionYoYChart`, `renderABMYoYChart`, `renderMSRYoYChart`, `renderCustomerYoYChart`, `renderProductYoYInner`, `renderMomentumChart`, `renderGrowthBridgeAndLists`, `renderYoYAnalysisCenterContent` | Card-level renderers |
| Sales register: `registerColumns`, `getRegisterRowsRaw`, `annotateRegisterYoY`, `applyRegisterSearchSortFilter`, `renderSalesRegister`, `onRegisterChange/Sort/ColFilter`, `toggleRegisterColumnFilters`, `registerPage`, `exportRegisterAll`, `exportRegisterView`, `exportRegisterCSV` | Data grid + exports |

---

## 10. CSS additions

| Class | Purpose |
|---|---|
| `.fy-chip` | The FY comparable-window chip at the right of the filter bar |
| `.card-filter` + child `label`/`select` | Per-card local filter strip injected into `.card-head` |
| `.yoy-band` | Grid container for YoY tiles |
| `.yoy-tile`, `.yoy-tile.up`, `.yoy-tile.down` | Tile box with tone-coloured left border + value |
| `.rank-chip.up/.down/.flat` | ABM/MSR rank-movement chip |
| `.register-grid-wrap` | Scroll container for the data grid (sticky header) |
| `.register-grid thead th`, `.col-filter-row th input` | Header cell, sort indicators, per-column filter row |
| `.register-grid tbody td.num/.up/.down/.strong` | Grid cell styles |
| `.register-pager` | Pagination footer |

---

## 11. Edge cases

| Case | Handling |
|---|---|
| `DPREV` empty | Every YoY card shows "Previous-year file not loaded" empty state. KPI bands collapse to a single "Not loaded" tile. |
| Both files cover the same FY | `FY_PREV` falls back to highest tag in `DPREV`; `COMP_MONTHS` = full intersection. YoY math runs but Δ = 0. |
| Current FY has more months than previous | `COMP_MONTHS` = intersection only. Months outside the intersection appear in Slide 2's dual-FY chart with one bar missing (intentional). |
| `Prev = 0, Cur > 0` | `safeGrowth` returns `999` and `fmtDelta` renders `▲ NEW`. |
| `Prev < 0` (returns-heavy SKU) | YoY % becomes meaningless; raw Δ is still shown, footnote in Top Movers caption. |
| Card-local filter zero-rows | Card shows "No comparable data for this selection". No exception. |
| Cross-filter clash with card-local | Cross-filter wins for global narrowing; card-local narrows further within. |
| FY = "Previous only" or "Both" | `FS` reshuffled accordingly; `FS_CUR_COMP` / `FS_PREV_COMP` retain their semantics. |

---

## 12. Sales Register (Slide 12) — operations

- **Search** matches across Customer / Product / Bill / Batch.
- **Click any header** to sort. Sort indicator (▲/▼ in gold) shows current sort.
- **Column filter** toggle (⌕ Column filter button) shows a second header row with per-column text inputs.
- **Pagination** — 25/50/100/250 rows per page. `‹ Prev` / `Next ›` plus a "Page X / Y · row a–b" indicator.
- **Sticky header** + sticky col-filter row via CSS `position: sticky`.
- **YoY %** column computes at (Customer × Product × Fiscal Month) using `FS_CUR_COMP` and `FS_PREV_COMP`. Rows without a comparable row show `—`.

### Exports

- `exportRegisterView()` — current page in current sort + filter state.
- `exportRegisterAll()` — every filtered row, sorted by date desc by default.
- `exportRegisterCSV()` — same as `all` but CSV (comma-quoted, RFC-4180-safe).
- Legacy `exportSalesRegister()` aliases `exportRegisterAll()` so any old caller still works.

XLSX is written via the already-loaded SheetJS dependency (no new CDNs).

---

## 13. Wow-factor analytics — implementation refs

| Feature | Function | Slides |
|---|---|---|
| Revenue Bridge | `buildRevenueBridge` + `renderRevenueBridge` | 3, 11 |
| Growth Attribution donut | `buildGrowthAttribution` + `renderGrowthAttribution` | 5, 11 |
| Product Momentum Quadrant | `renderProductMomentumQuadrant` | 4, 11 |
| Top Movers strip | `drawMoversBar` | 11 |
| Boardroom Signals + Early Warnings | `buildYoYSignalsV2` | 11 |
| Rank movement chips | `rankChip` + `buildRankMap` | 7, 8 |
| YoY-aware action ranking | `buildActions` (extended) | 10 |

---

## 14. Filter validation table

Every change should propagate to the right charts. Use this table when debugging "why isn't this chart updating?":

| Filter | Drives | Card-local override |
|---|---|---|
| FY mode (`f-fy`) | Whole deck via `FS` / `FSMSR` reshuffle | — |
| Fiscal-month From/To (`f-fmfrom`, `f-fmto`) | All YoY cards + non-YoY charts | Card-local From/To overrides on momentum/bridge/prodYoY/custYoY/regYoY/abmYoY/msrYoY/yoyCtrl |
| Product (`f-prod`) | All slides | Card-local `product` on bridge/prodYoY/regYoY/abmYoY/msrYoY/yoyCtrl |
| Customer (`f-cust`) | Slides 5, 11 | Card-local `customer` on bridge/custYoY/yoyCtrl |
| Region (`f-rgn`) | Slides 6, 11 | Card-local `region` on bridge/custYoY/regYoY/yoyCtrl |
| ABM (`f-abm`) | Slides 7, 8 | Card-local `abm` on abmYoY |
| MSR (`f-msr`) | Slide 8 | Card-local `msr` on msrYoY |
| Speciality / Tier | Slides 7, 8, 9 (via doc restrictor) | — |
| Cross-filter (`CF`) | All slides (clicks lock the deck) | Card-local does not override CF |

`resetF()` clears global + `LOCAL_F` + `CF`.

---

## 15. Testing & verification (v6)

JS passes `node --check`. The dashboard was verified on the real data files:
- `files/sales.xls` — FY26-27, 624 rows after cleaning, Apr–May 2026.
- `files/previous_sales.xls` — FY25-26, 3,001 rows, Apr 2025–Mar 2026.
- `files/msr.xlsx`, `Doctor_Master.xlsx` — unchanged.

Expected behaviour on the live data:
- FY chip reads `FY26-27 Apr–May vs FY25-26 Apr–May`.
- COMP_MONTHS = `{1, 2}`.
- Slide 2 trend shows 2 cur-FY bars + 2 grey prev-FY bars.
- Revenue Bridge closes to the rupee YoY Δ ± residual ≤ ₹1,000.

Known acceptable behaviours:
- Slide 2's trend chart only plots months that exist in EITHER FY. With Apr–May current vs Apr–May previous it plots only Apr + May.
- The Doctor YoY band reports `MSR Overlap` rather than doctor-overlap because doctor data is point-in-time.

---

## 16. Codex sibling (`dashboard_presentation_codex.html`)

Same JS engine, denser executive layout: 3-up grids on Slides 5/6/7/8, more compact KPI tiles, persistent Boardroom Signals sidebar across Slides 4–10, Revenue Bridge promoted to its own slot. Built as a sibling so the primary file stays familiar to the existing team.

---

## 17. Quick reference — keyboard

| Key | Action |
|---|---|
| → / Space / PgDn | Next slide |
| ← / PgUp | Previous slide |
| Home | Slide 1 |
| End | Slide 12 |
| F | Toggle fullscreen |
| Esc | Close chart popup |

---

## 18. Migration notes for v5 readers

- The Date `From` / `To` inputs are gone. Use `From` / `To` fiscal-month dropdowns instead.
- The calendar Month Lens is gone. Use the FY-month range plus the FY-mode dropdown.
- `renderProductYoYLens()` no longer reads from the global product filter directly — it now mounts a card-local filter and uses `LOCAL_F.prodYoY`.
- `renderYoYCommandCenter()` is now `renderYoYAnalysisCenterContent()` invoked from the card-local controls.
- `getRegisterRows()` / `salesRegisterExportRows()` are gone. Use `getRegisterRowsRaw()` + `annotateRegisterYoY()` + `applyRegisterSearchSortFilter()`.
- `exportSalesRegister()` is preserved as a legacy alias of `exportRegisterAll()`.

---

## 19. Contact

Owner: **Adi (goenka.aditya.kol@gmail.com)**
Built with: Claude inside Cowork mode
