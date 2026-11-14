# PharmaBoard — Full Product Handoff Document v2

**Last updated:** May 2026  
**Client:** AFD Hospicare (S.D. Pharmaceuticals)  
**Built by:** Adi Goenka × Claude (Anthropic)  
**Strategy:** Path B — sell first, refactor while earning. Deepen pharma/SwilERP niche before generalising.

---

## 1. What PharmaBoard Is

PharmaBoard is a **single-file HTML analytics dashboard** for Indian pharmaceutical companies and stockists. It ingests ERP export files (XLS/XLSX/CSV), processes them entirely in the browser, and presents PowerBI-level sales intelligence. No server. No login. No data leaves the machine.

There are two separate dashboard products:

| Dashboard | File | Audience | Theme | Status |
|---|---|---|---|---|
| **Management Dashboard** | `dashboard_mgmt.html` | Owner / MD / CFO | Gold accent, dark | Complete — Phase 1 |
| **Sales Dashboard** | `dashboard_sales_v3.html` | VP Sales / MSR Manager | Slate blue, light | Active — current work |

This document covers **both**, with the Sales Dashboard in full detail since that is where active development is happening.

---

## 2. Product Context

### The Company
AFD Hospicare (operating as S.D. Pharmaceuticals, 14 Watkins Lane) is a pharmaceutical manufacturer/distributor based in Kolkata. They use **SwilERP** for their ERP system. Their sales data spans 64 products, 73 customers, across states including West Bengal, Bihar, Jharkhand, Odisha.

### The ERP: SwilERP
SwilERP is a common Indian pharma ERP. Its XLS exports have specific quirks that define how the ETL layer must work:

- **Header rows:** Files have 5–6 header/title rows before the actual column header row. The dashboard auto-detects the header row as the first row with ≥4 non-empty cells.
- **Merged cells:** Product name, customer, station appear only on the first row of each group. All subsequent rows in that group have blank cells → must be forward-filled.
- **Subtotal rows:** SwilERP inserts subtotal/total rows throughout. Guard: skip any row where Bill No. is blank, or where name/customer contains "total", "subtotal", "grand total", "powered by", "*****", "sundry", "narration".
- **Returns:** Identified by `sales_value < 0` OR `qty < 0` OR bill number starting with `z` or `Z`.
- **Excel serial dates:** SwilERP exports dates as Excel serial numbers (e.g. 45777 = Apr 4, 2025). Parse with: `new Date(Math.round((serial - 25569) * 86400000))`.

### The Files
**Sales Register (`sales.xls`)** — "Product-Customer Bill Wise Sales" export from SwilERP.

Actual columns (row 5 of file, 0-indexed):
```
Col 0: Code (product code)
Col 1: Name (product name) ← forward-filled
Col 2: Packing
Col 3: Code (customer code)
Col 4: Customer ← forward-filled
Col 5: Station ← forward-filled
Col 6: Bill No.
Col 7: Date (Excel serial)
Col 8: Batch
Col 9: MRP
Col 10: Exp.Date
Col 11: Qty.
Col 12: Sales Value
```

**MSR Master (`msr.xlsx`)** — Customer-to-MSR territory mapping table. NOT a sales file.

Actual columns:
```
SL No. | Code | Customer Name | Place | State | MSR - 1 | MSR - 2 | MSR - 3 | ABM - 1 | ABM - 2
```

This is a 50-row lookup table. Each row = one customer. MSR-1/2/3 are the sales reps assigned to that customer (some customers have multiple MSRs). ABM = Area Business Manager. The dashboard joins this with sales data on customer name to produce MSR-attributed analytics.

**GitHub Repository:**
```
https://github.com/adityagoenka24/afd-hospicare-sales-dashboard
Sales file: https://raw.githubusercontent.com/adityagoenka24/afd-hospicare-sales-dashboard/main/sales.xls
MSR file:   https://raw.githubusercontent.com/adityagoenka24/afd-hospicare-sales-dashboard/main/msr.xlsx
```

---

## 3. Sales Dashboard — Full Technical Specification

### File
`dashboard_sales_v3.html` — ~82KB, ~1,495 lines, zero build step, open in any browser.

### Tech Stack
```
Plotly.js    2.35.2  — all charts (CDN)
SheetJS xlsx 0.18.5  — XLS/XLSX/CSV parsing (CDN)
Plus Jakarta Sans    — headings/labels (Google Fonts)
Inter                — body/data text (Google Fonts)
```
**No PptxGenJS** — removed entirely. It causes `console.trace.apply` crash on Safari/WebKit on load. PNG export via `Plotly.toImage()` works fine.

### Visual Design
- **Theme:** Light. Background `#f1f5fb`, cards `#ffffff`, borders `#e2e8f4`.
- **Accent:** Slate blue `#4361ee`.
- **Supporting colours:** Green `#0ea96e`, Amber `#d97706`, Red `#dc2626`, Purple `#7c3aed`.
- **Typography:** Plus Jakarta Sans (800 weight for KPI values, 700 for titles, 600 for labels), Inter for data/numbers.
- **CSS variables:** All colours and radii are CSS custom properties at `:root` — theme can be swapped by editing ~20 lines.

---

### Application Flow

```
1. Choice Screen
   ├── "Auto-Fetch from GitHub" → fetch() both files in parallel → parse → Mapper
   └── "Upload Files" → Upload Screen
       ├── Sales file slot (required)
       ├── MSR file slot (optional)
       └── "Next: Map Columns" → Mapper

2. Mapper Screen
   ├── Auto-detects columns using fuzzy alias matching
   ├── Shows Sales file sections + MSR file section (if loaded)
   ├── User confirms/corrects mapping
   └── "Launch Dashboard" → validates required fields → cleans data → App

3. App (4 tabs)
   ├── Overview
   ├── Sales
   ├── Products
   └── MSR Analytics
```

### State Variables
```javascript
RAW   = {}       // raw parsed rows, keyed 'sales' and 'msr'
COLS  = {}       // detected column names per file
MAP   = {}       // column mapping (canonical → actual col name) per file
D     = []       // cleaned sales rows (canonical schema)
DMSR  = []       // MSR-attributed rows (join of D × MSR lookup)
FS    = []       // filtered sales rows (D after global filters + cross-filter)
FSMSR = []       // filtered MSR rows
CF    = {}       // active cross-filter: { dim: 'month'|'product'|'customer'|'station', val }
MSR_CF = null    // active MSR cross-filter (MSR name string)
SORTS = {}       // sort direction per chart
TBL   = {}       // table sort state
TBL_D = []       // current table data (for Excel export)
```

### Canonical Sales Row Schema
Every row in `D` and `FS` conforms to:
```javascript
{
  product_name: String,   // trimmed, forward-filled
  bill_no:      String,   // trimmed, used as return signal if starts with 'z'
  date:         Date,     // JS Date object, null if unparseable
  date_str:     String,   // ISO YYYY-MM-DD, '' if null
  customer:     String,   // trimmed, forward-filled
  station:      String,   // trimmed, forward-filled (city/region)
  qty:          Number,   // absolute value (returns are negative in source)
  sales_value:  Number,   // signed (negative = return)
  batch_no:     String,
  expiry:       String,   // raw string from file (e.g. "04/26")
  mrp:          Number,
  is_return:    Boolean,  // true if sv<0 OR qty<0 OR bill starts with 'z'
}
```

### MSR Attributed Row Schema
Every row in `DMSR` and `FSMSR`:
```javascript
{
  msr:          String,   // MSR name from MSR file (e.g. "Mr. Arnab Dutta")
  abm:          String,   // ABM name (e.g. "Mr. Arindam Chakraborty")
  customer:     String,   // from sales row
  product_name: String,   // from sales row
  station:      String,   // place from MSR file, fallback to station from sales
  state:        String,   // state from MSR file (e.g. "West Bengal")
  date:         Date,     // from sales row
  date_str:     String,
  sales_value:  Number,   // from sales row (signed)
  qty:          Number,
  is_return:    Boolean,
  bill_no:      String,
}
```

**MSR join logic:** `buildMSRLookup()` creates a `Map` keyed by both customer code (uppercase) and customer name (uppercase). For each sales row, `cleanMSR()` looks up the customer name in this map, gets the list of MSRs (MSR-1, MSR-2, MSR-3), and creates one attributed row per MSR. So if a customer has 2 MSRs, their sales count for both.

---

### Column Auto-Detection

The `autoMap(cols, schema)` function runs on every file load. For each canonical field in the schema, it tries:
1. **Exact match** (case-insensitive) against each alias in order
2. **Substring match** fallback if no exact match

Sales SCHEMA aliases:
```
product_name  ← 'name', 'product name', 'item', 'medicine', 'product'
bill_no       ← 'bill no', 'bill no.', 'invoice', 'invoice no', 'vch no'
date          ← 'date', 'bill date', 'invoice date', 'trans date'
customer      ← 'customer', 'party', 'customer name', 'party name', 'buyer'
station       ← 'station', 'city', 'location', 'district', 'region', 'area'
qty           ← 'qty', 'quantity', 'qty.', 'units'
sales_value   ← 'sales value', 'value', 'amount', 'net amount', 'net value'
batch_no      ← 'batch', 'batch no', 'batch no.', 'batch number'
expiry        ← 'exp.date', 'exp date', 'expiry', 'expiry date', 'exp'
mrp           ← 'mrp', 'm.r.p', 'mrp rs'
```

MSR SCHEMA aliases:
```
cust_code     ← 'code', 'code ', 'cust code', 'customer code'
cust_name     ← 'customer name', 'customer name                  ', 'customer', 'party name'
place         ← 'place', 'place                ', 'city', 'location'
state         ← 'state'
msr1          ← 'msr - 1', 'msr-1', 'msr1', 'msr'
msr2          ← 'msr - 2', 'msr-2', 'msr2'
msr3          ← 'msr - 3', 'msr-3', 'msr3'
abm1          ← 'abm - 1', 'abm-1', 'abm1', 'abm'
```

Note: SwilERP columns have trailing spaces (e.g. `"Code "`, `"Customer Name                  "`, `"Place                "`). The aliases include these exact padded strings.

---

### The 4 Tabs

#### Tab 1: Overview
Cross-filtering is active on this tab. Clicking any chart filters the entire dashboard.

| Chart | ID | Type | Cross-filter dim |
|---|---|---|---|
| Monthly Revenue Trend | `ch-monthly` | Grouped bar + line | `month` |
| Sales by Region | `ch-region` | Donut pie | `station` |
| Top 10 Products | `ch-topprod` | Horizontal bar | `product` |
| Top 10 Customers | `ch-topcust` | Horizontal bar | `customer` |
| Returns Rate % | `ch-returns` | Bar (coloured by threshold) | — |

KPI cards: Net Sales, Returns (₹ + rate %), Bills Raised, Avg Bill Value, Active SKUs, Customers.

#### Tab 2: Sales
| Chart / Element | ID | Description |
|---|---|---|
| Weekly Heatmap | `ch-heatmap` | Sales value by day-of-week × month |
| Customer Purchase Frequency | `ch-freq` | Unique bills per customer, cross-filterable |
| Cumulative Revenue Pareto | `ch-pareto` | Products sorted by revenue with cumulative % line. 80% line marked. |
| Sales Register table | `tbl-body` | Sortable, searchable, 500-row cap, Excel export |

#### Tab 3: Products
| Chart | ID | Description |
|---|---|---|
| Product Sales Mix Treemap | `ch-treemap` | Area = revenue share. Uses `branchvalues:'remainder'`, root value = sum of children. Colors interpolated ACC→GRN→PUR by rank. |
| Revenue vs Qty Bubble | `ch-bubble` | X=qty, Y=revenue, bubble size=unique customers |
| Top 8 Products Monthly Trend | `ch-prodtrend` | Line chart, one series per product |
| Product Summary Table | `prod-tbl-body` | Gross, net, returns, qty, customers per product |

**Treemap known bug history:** Was blank because (1) `colors` array was `N` long but `labels` was `N+1` (root missing a color), and (2) `branchvalues:'total'` with root `value:0` breaks layout. Fixed: root value = `sum(children)`, `branchvalues:'remainder'`, explicit per-tile color array including a transparent root color.

#### Tab 4: MSR Analytics
Shown only if MSR file was loaded. "No Data" state displayed otherwise.

**KPI cards:** Total MSRs, MSR Revenue, Avg per MSR, Customers Covered, Top Performer, States.

| Chart | ID | Description |
|---|---|---|
| MSR-wise Sales | `ch-msr-sales` | Horizontal bar, click to cross-filter MSR tab |
| MSR Sales Trend | `ch-msr-trend` | Stacked bar by month, up to 6 MSRs |
| Customer Coverage | `ch-msr-cov` | Unique customers per MSR |
| Product Mix | `ch-msr-mix` | Stacked bar: top 5 products per MSR |
| MSR Performance Table | `msr-tbl-body` | Net revenue, % share, customers, products, states |

---

### Cross-Filter System

Cross-filtering is the PowerBI-level feature. Clicking a chart element sets a global `CF` object and re-runs `applyF()` which re-filters `FS` and re-renders all charts.

```javascript
CF = { dim: 'month' | 'product' | 'customer' | 'station', val: String }
```

When `CF` is set, a teal banner appears at the top of the Overview tab showing what is active. Clicking the same element again clears the filter. Clicking ✕ on the banner clears it.

`applyF()` applies: global date range + dropdown filters + `CF` cross-filter simultaneously.

MSR tab has its own separate cross-filter (`MSR_CF`) that only affects MSR charts.

---

### Export System

| Export | Trigger | Method |
|---|---|---|
| Chart PNG | ↓ button on chart card | `Plotly.toImage(el, {format:'png', width:1000, height:540})` → `<a download>` |
| Table Excel | ↓ Excel on table header | `XLSX.utils.json_to_sheet(TBL_D)` → `XLSX.writeFile()` |

**No PPT export** — PptxGenJS removed permanently due to `console.trace.apply` crash on Safari/WebKit. The error triggers on script load, before any user interaction, and kills the entire page. Do not add it back.

---

### Key Implementation Details

**Header row detection:** Scans first 20 rows, returns the first row where ≥4 cells are non-empty. This correctly skips SwilERP's 5 title rows.

**Forward fill (`ffill`):** Takes an array of row objects and a list of keys. Maintains a `last` state dict. If a cell is blank, fills it from `last`. If non-blank, updates `last`.

**Return detection:** Three signals, any one is sufficient:
1. `sales_value < 0`
2. `qty < 0`
3. Bill No starts with `z` or `Z` (SwilERP-specific convention for credit notes)

**Date parsing:**
- Excel serial number → `new Date(Math.round((v - 25569) * 86400000))`
- String → `new Date(string)` with `isNaN` guard
- Both return `null` on failure, rows with null dates are excluded from time-series charts

**Money parsing:** Strips `₹`, `,`, and whitespace before `parseFloat`. Returns `0` on failure.

**Skip list:** `['total','subtotal','grand total','powered by','*****','sundry','narration']` — any row where product name or customer name contains one of these strings is discarded.

**Plotly base config objects (shared across all charts):**
```javascript
PL = { paper_bgcolor:'transparent', plot_bgcolor:'transparent',
       font:{ family:'Inter,sans-serif', color:'#64748b', size:10 },
       margin:{t:8, r:16, b:32, l:50} }
AX = { gridcolor:'rgba(148,163,184,.18)', linecolor:'rgba(148,163,184,.25)',
       tickcolor:'transparent', zeroline:false, automargin:true }
PC = { responsive:true, displayModeBar:false }
```

---

## 4. Management Dashboard — Summary

`dashboard_mgmt.html` — Password: `shre2831`

### Features
- Password gate → Choice screen (GitHub or manual upload)
- 4 required files: Sales, Purchase, Inventory, Outstanding
- 7 tabs: Overview · Sales · Products & Margin · Purchases · Inventory · Receivables · MSR Analytics
- Gold accent theme (`#c9a84c`) on dark background
- Full P&L, purchase margins, batch-level margin analysis
- Exports: PNG/PPT per chart, PNG/PPT/Excel per page, Excel on every table

### Known Issues (Management Dashboard)
- Build pipeline (`build.js`) was throwing "Anchor not found" errors — root cause was the `// ── derived` comment in the `CLIENT` config block getting accidentally removed. This comment is a regex anchor for the build script. Never remove it.
- Secret injection: `SECRET` split into 3 base64-encoded chunks in `server.js`, patched out before compilation.

### Build System (Management Dashboard Only)
```bash
# One-time setup
npm install -g @yao-pkg/pkg

# Build for a client
node build.js client.json       # injects config, password, license key
node compile.js client.json     # cross-compiles Mac → Windows .exe

# Local testing (Mac)
node server.js client.json      # runs local data server
```

Files created by build system:
- `builds.json` — audit log of all builds (deduplicates by company+expiry, renewals append)
- `dist/<slug>/` — deliverable folder: `PharmaBoard.exe`, `client.json` (secrets stripped), `start.bat`, HTML

---

## 5. Pricing & Business Model

| Stage | Clients | Pricing |
|---|---|---|
| Seed | First 3 clients | ₹2,000–3,000 one-time |
| Growth | Clients 4–10 | ₹8,000 setup + ₹3,500/year renewal |
| Scale | Client 11+ | ₹10,000–12,000 setup + ₹4,000–5,000/year |

**Current:** 2 paying clients. AFD Hospicare is an active client/collaborator.

**Delivery method:** Single HTML file sent via WhatsApp/Google Drive. Framed as a privacy feature ("your data never leaves your machine"). No cloud hosting needed.

---

## 6. Architecture & File Map

### Current Files

| File | Location | Description |
|---|---|---|
| `dashboard_sales_v3.html` | outputs / project | Active sales dashboard — latest version |
| `dashboard_mgmt.html` | `/mnt/project/` | Management dashboard (complete) |
| `build.js` | `/mnt/project/` | Build pipeline — injects client config |
| `compile.js` | `/mnt/project/` | Cross-compiles to Windows .exe |
| `obfuscate.js` | `/mnt/project/` | Character-level JS minifier (string-boundary-safe) |
| `keygen.js` | `/mnt/project/` | HMAC-SHA256 license key generator |
| `server.js` | `/mnt/project/` | Local data server for `local` mode clients |
| `client.json` | `/mnt/project/` | Per-client config template |
| `builds.json` | `/mnt/project/` | Auto-generated build registry |

### Claude Skills (at `/mnt/skills/user/`)

| Skill | Description |
|---|---|
| `pharma-sales-dashboard/SKILL.md` | Instructions for building Dashboard A (sales view) |
| `pharma-stockist-dashboard/SKILL.md` | Instructions for building Dashboard B (management view) |
| `frontend-design/SKILL.md` | UI/design system instructions |
| `document-dashboard/SKILL.md` | Document-to-dashboard conversion |

### Data Source Modes (Management Dashboard)
Three modes, auto-derived from `client.json`:
- `local` — reads from a local folder via `server.js` + `PharmaBoard.exe`
- `github` — fetches from GitHub raw URLs (like AFD Hospicare's setup)
- `manual` — user uploads files each session

---

## 7. Known Bugs Fixed (Cumulative Log)

| Bug | Root Cause | Fix |
|---|---|---|
| `console.trace.apply` crash on load | PptxGenJS (both 3.6 and 3.12) calls `console.trace.apply()` on load. Safari/WebKit `console.trace` is not a proper Function. Crashes before any user interaction. | Removed PptxGenJS entirely. PNG export via Plotly.toImage still works. |
| Treemap blank | `colors` array was length N, `labels` was N+1 (root missing color). Also `branchvalues:'total'` + `value:0` for root breaks Plotly layout. | Root value = sum of children. `branchvalues:'remainder'`. Explicit colors array with transparent root. |
| Mapper screen not scrollable | CSS targeted `#mapper-screen` but HTML element has `id="s-mapper"`. `overflow-y:auto` never applied. | Fixed selector to `#s-mapper`, changed to `display:block` so content scrolls naturally. |
| MSR tab empty | MSR file is a customer→MSR lookup table, not a sales file. Previous code tried to treat it as row-level sales data with dates/values. | Rebuilt MSR logic: `buildMSRLookup()` creates a Map of customer→{msrs, abm, state}. `cleanMSR()` joins this against `D` (sales rows) by customer name, producing MSR-attributed rows with full sales data. |
| Double upload prompt | Previous version had separate choice→upload→mapper flow where file parsing happened twice. | Single upload screen, file parsed once on input change. Mapper receives already-parsed data. |
| Management dashboard margin blank | `cleanSales()` only forward-filled `['product_name','customer','station']`. SwilERP also uses merged cells for batch and rate → most rows had blank batch → no margin matches. | Added `'batch'` and `'rate'` to forwardFill keys. |
| Build "Anchor not found" error | `// ── derived` comment in `CLIENT` block was accidentally removed. It is a regex anchor for `build.js`. | Comment is load-bearing. Documented as such. Never remove it. |

---

## 8. What to Build Next

These are the planned next phases in priority order:

### Phase 1 (Immediate): Sales Dashboard Polish
- [ ] Lazy render on tab switch (Plotly charts on hidden tabs render at 0×0 — need `RENDERED` set pattern from `pharma-sales-dashboard/SKILL.md`)
- [ ] Plotly.Plots.resize() call after tab switch with 60ms delay
- [ ] ABM Analytics sub-section within MSR tab
- [ ] State-level drill-down (click a state in MSR → see customers in that state)
- [ ] Export: PDF report button (html2canvas → jsPDF)

### Phase 2: Column Mapping Persistence
Currently the mapper runs every session. Should save the mapping to `localStorage` keyed by a fingerprint of the column headers so repeat users skip it automatically.

```javascript
const fingerprint = COLS.sales.join('|');
const saved = localStorage.getItem('pb_map_' + btoa(fingerprint));
if (saved) { MAP.sales = JSON.parse(saved); skipMapper(); }
```

### Phase 3: Marg ERP Adapter
Second ERP after SwilERP. Marg uses different column names and export structure. Build as a separate `cleanMarg()` function that outputs the same canonical schema as `cleanSales()`.

### Phase 4: Cloud Sync (Cloudflare R2)
For clients who want automatic data refresh without GitHub:
- Cloudflare R2 bucket ($0.015/GB/month) + Workers (~₹70/month for 10–50 clients)
- Client uploads files to R2 via a simple web form or CLI
- Dashboard fetches from R2 presigned URL

### Phase 5: Management Dashboard for AFD Hospicare
The existing `dashboard_mgmt.html` was built for stockist/distributor use (it shows purchase margins, inventory value etc.). AFD Hospicare is a manufacturer — their management needs are different:
- Production vs sales comparison
- Territory-level P&L (not just batch margins)
- MSR performance vs target

---

## 9. How to Resume Development

### Starting a New Claude Chat
Paste this document into your Claude Project context. Then describe what you want to change or build. The project also has the actual HTML files attached so Claude can read the current code directly.

### Referencing the Right File Version
Always work from `dashboard_sales_v3.html`. Earlier versions (`dashboard_sales.html`, `dashboard_sales_light.html`, `dashboard_sales_v2.html`) are superseded and should not be used.

### Making Changes
The dashboard is structured in clear sections marked with `// ══` comment headers:
```
CONFIG          ← GH_FILES URLs, SCHEMA, MSR_SCHEMA
STATE           ← all let variables
SCREEN HELPERS  ← showOnly, showLoad, goChoice, goUpload
GITHUB FETCH    ← startGithub(), onGithubDone()
FILE UPLOAD     ← onFile(), proceedFromUpload()
PARSE XLS BUFFER← parseXLS()
AUTO-DETECT MAP ← autoMap()
MAPPER UI       ← buildMapper(), makeMapRow(), updatePreview(), launchDashboard()
DATA CLEANING   ← parseDate(), parseMoney(), ffill(), cleanSales(), buildMSRLookup(), cleanMSR()
FILTERS         ← buildFilters(), applyF(), resetF()
CROSS-FILTER    ← setCF(), clearCF(), hideCF()
HELPERS         ← mKey(), mLbl(), fmt(), toggleSort()
TABS            ← switchTab()
MASTER RENDER   ← render()
(one section per chart/table render function)
EXPORT          ← closeDl(), toggleDl(), dlPng(), dlExcel()
RESET           ← resetAll()
```

### Adding a New Chart
1. Add HTML `<div class="cc">` with a `<div id="ch-yourname">` inside the appropriate `tab-panel`
2. Write `function renderYourChart() { ... Plotly.newPlot('ch-yourname', ...) }`
3. Call it from `render()` (or from `renderSalesTab()` / `renderProductsTab()` / `renderMSRTab()` for lazy tabs)
4. If it should support cross-filter: add `.on('plotly_click', d => { if(d.points.length) setCF('dim', d.points[0].x_or_y); })`

### Adding a New ERP
1. Add aliases to `SCHEMA` for that ERP's column names
2. If structure is radically different (e.g. vertical layout), add a `cleanMarg()` function that outputs the same canonical row schema as `cleanSales()`
3. `autoMap()` is ERP-agnostic — it will pick up the new aliases automatically

---

## 10. Critical Rules — Never Break These

1. **No PptxGenJS** — ever. Not any version. Crashes Safari on load.
2. **`branchvalues:'remainder'` for treemaps** — never `'total'` with computed root.
3. **Colors array length must match labels array length** in Plotly treemaps and sunbursts.
4. **`cleanMSR()` must run after `cleanSales()`** — it joins against `D` which must already be populated.
5. **`D = cleanSales()` before `DMSR = cleanMSR()`** in `launchDashboard()` — order is mandatory.
6. **Forward-fill before filtering** in `cleanSales()` — filter after ffill, not before.
7. **The `// ── derived` comment** in `dashboard_mgmt.html`'s CLIENT block is a regex anchor for `build.js`. Never remove it.
8. **Skip list guard is three-stage** — (A) name skip-keywords, (B) empty bill_no, (C) customer skip-keywords. All three must be checked.
9. **MSR file has trailing spaces on column names** — `"Code "`, `"Customer Name                  "`, `"Place                "` — aliases must match these exactly.
10. **Excel serial date offset is 25569** (not 25568) — using the wrong offset shifts all dates by 1 day.

---

## 11. Sample Prompts for Common Tasks

**Fix a chart:**
> "The ch-monthly chart in dashboard_sales_v3.html is showing returns as positive values. Find renderMonthly() and fix the returns bar to always show as negative/absolute correctly."

**Add a chart:**
> "Add a new chart to the Products tab in dashboard_sales_v3.html: a scatter plot of product expiry dates vs current inventory value. Chart ID: ch-expiry-risk. Read the existing renderBubble() for style reference."

**Change a colour:**
> "Change the accent colour in dashboard_sales_v3.html from slate blue (#4361ee) to deep teal (#0d9488). Update all CSS variables and the JS colour constants ACC."

**Add a new ERP:**
> "I have a Marg ERP sales export. Headers are: Item Name, Voucher No, Party Name, Date, Qty, Rate, Amount. Add aliases to SCHEMA in dashboard_sales_v3.html and write a cleanMarg() function that outputs the same canonical row schema as cleanSales()."

**Add localStorage mapping persistence:**
> "In dashboard_sales_v3.html, after launchDashboard() succeeds, save MAP.sales to localStorage keyed by a hash of COLS.sales. At the start of buildMapper(), check for a saved mapping and pre-populate MAP.sales if found. Show a 'Using saved mapping' notice with a 'Reset' link."

---

*End of handoff document. Store alongside dashboard_sales_v3.html and dashboard_mgmt.html.*
