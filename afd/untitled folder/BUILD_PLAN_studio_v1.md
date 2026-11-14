# PharmaBoard **Studio** — Build Plan v1

**Goal:** a *new* dashboard, `dashboard_studio.html`, that does everything the current one‑pager does **plus** ships with a built‑in **Admin Portal** so Adi can change layout, KPIs, chart types, thresholds, colours and even KPI/chart *logic* without coming back to Claude for every tweak.

**Hard rule:** we do **not** touch `dashboard_onepager.html` or `dashboard_presentation.html`. Studio is built from a *copy*. The existing dashboards keep working untouched as our reference + fallback.

**Owner:** Adi · **Status:** plan for approval (nothing built yet)

---

## 0. The one idea that makes this work

Your current one‑pager already has two cleanly separated parts, even if they don't *look* separate in the file:

1. **The engine** — data load, cleaning, the net‑of‑returns maths, and the Plotly helpers (`summarize`, `monthBuckets`, `productStats`, `safeGrowth`, `fmtMoney`, `COLORS`, `PL`, `AX`, `PC`, …). This is the trustworthy, hard‑won part. Every number reconciles because of it.

2. **The controller** — the part that *decides what to show*: the 5 KPI cards (hardcoded in `renderKPIs()`), the list of charts to display (`moveCard(...)` calls in `opBuild()`), and the toggle config (`TOG`).

Right now part 2 is **hardcoded in JavaScript, scattered across the controller**. Studio's whole job is to lift part 2 out into a single **`STUDIO_CONFIG`** object, write generic renderers that draw the dashboard *from that object*, and then put a UI on top of the object. The engine (part 1) is copied across **frozen and unchanged** — that's what keeps the numbers correct.

```
   ┌─────────────────────────────────────────────┐
   │  ADMIN PORTAL  (forms + code editors)        │  ← you edit here
   └───────────────┬─────────────────────────────┘
                   │ reads / writes
   ┌───────────────▼─────────────────────────────┐
   │  STUDIO_CONFIG  (one JSON object)            │  ← the single source of truth
   │  tabs · KPI specs · chart specs · toggles ·  │
   │  thresholds · theme · formatting             │
   └───────────────┬─────────────────────────────┘
                   │ rendered by
   ┌───────────────▼─────────────────────────────┐
   │  GENERIC RENDERERS  (config → DOM + Plotly)  │
   └───────────────┬─────────────────────────────┘
                   │ calls
   ┌───────────────▼─────────────────────────────┐
   │  ENGINE  (copied verbatim, FROZEN)           │  ← never edited in the portal
   │  data load · cleaning · summarize() · etc.   │
   └─────────────────────────────────────────────┘
```

---

## 1. The three tiers of freedom (mapped to *your* dashboard)

| Tier | How you edit it | What it covers on your dashboard |
|---|---|---|
| **1 · No‑code (Portal forms)** | clicks, toggles, dropdowns, colour pickers | Show/hide & reorder the 5 KPI cards · rename labels · change thresholds (Return Drag 1.5%, MoM green/red cutoff) · show/hide/reorder every chart · switch chart type (bar↔line↔donut↔grouped) · Top‑N (Top 10→15) · which chart sits on which tab · tab names/order · default toggle (CY vs YoY) · theme colours · number format (lakhs/crores/decimals) |
| **2 · Light code (Config editor)** | edit a small JSON/JS spec block in the portal | Define a **new KPI** by composing engine building blocks (pick metric + dimension + format) · define a **new chart** from a measure × dimension × type · build a new toggle pair |
| **3 · Real code (Advanced editor)** | write a JS function in the portal's code box, live‑evaluated with a safety net | Custom KPI `computeFn` (any formula over the data rows) · custom chart spec (full Plotly trace) · anything the registries don't already cover |

Tier 1 is your daily driver. Tier 2 is "I want a metric we don't have yet." Tier 3 is the escape hatch for when you (knowing JS) want to go off‑road — with a reconciliation self‑test so you can trust the result.

**Still comes to Claude:** changes to the *engine itself* (the net‑of‑returns reconciliation, new data files/joins, new data cleaning). That's the deliberate line — wrong logic there corrupts everything, so it keeps a human checkpoint.

---

## 2. `STUDIO_CONFIG` — the single source of truth

One JSON‑serialisable object. Everything the portal edits lives here. Sketch:

```js
const STUDIO_CONFIG = {
  schemaVersion: 1,
  theme: {
    colors: { acc:'#…', green:'#…', red:'#…', amber:'#…', violet:'#…', gold:'#…' },
    numberFormat: { scale:'auto', /* auto | lakh | crore */ decimals:0, currency:'₹' }
  },

  tabs: [
    { id:'t0', name:'Revenue & Products', blocks:['kpiRow','hero','prodGrid','prodMirror','prodReturns','actions'] },
    { id:'t1', name:'Customers & Regions', blocks:['custToggle','regionToggle','custReturns','actions'] },
    { id:'t2', name:'Team & Doctors', blocks:['msrToggle','abmToggle','coverage','actions'] },
    { id:'t3', name:'Sales Register',  blocks:['salesGrid'] },
    { id:'t4', name:'Field Register',  blocks:['fieldGrid'] }
  ],

  kpis: [
    { id:'net',  label:'Net Revenue',      tone:'blue',   metric:'netRevenue',
      format:'money', chip:{ source:'yoy', up:'▲ +{v}% YoY', down:'▼ {v}% YoY' },
      sub:'Latest month {lastLabel}: {lastNet}', visible:true },
    { id:'mom',  label:'MoM Growth',       tone:'auto',   metric:'momGrowth', format:'pct',
      thresholds:{ green:0, red:0 }, visible:true },
    { id:'drag', label:'Return Drag',      tone:'amber',  metric:'returnPct', format:'pct1',
      thresholds:{ targetMax:1.5 }, sub:'Leakage {returnValue} · R / Gross', visible:true },
    { id:'cust', label:'Active Customers', tone:'violet', metric:'activeCustomers', format:'num', visible:true },
    { id:'prod', label:'Top Product',      tone:'gold',   metric:'topProduct', format:'name', visible:true }
    // + user-added KPIs append here
  ],

  charts: [
    { id:'hero', title:'Monthly Revenue Trend · CY vs PY', type:'line',
      source:'momentum', /* a named view that the engine already builds */ tab:'t0', visible:true },
    { id:'topprod', title:'Top 10 Products by Net Revenue', type:'hbar',
      source:'FS', dimension:'product_name', measure:'net', topN:10, sort:'desc',
      color:'acc', tab:'t0', visible:true },
    // … every other chart, same shape …
  ],

  toggles: [
    { id:'cust',   label:'Customers', options:[{v:'cy',chart:'topcust'},{v:'yoy',chart:'custYoY'}], default:'cy' },
    { id:'region', label:'Regions',   options:[{v:'cy',chart:'region'},{v:'yoy',chart:'regionYoY'}], default:'cy' }
    // …
  ]
};
```

**Key point:** the *current* dashboard must be expressible as the default `STUDIO_CONFIG`. Phase 1's success test is literally "Studio with the default config looks pixel‑identical to today's one‑pager."

---

## 3. The registries — the building blocks the portal exposes

These are what make Tier 2 (new KPIs/charts without engine edits) possible. Each is just a named lookup table wired to the existing engine helpers.

**Metric registry** — named functions `(filteredSet) → {value, raw, extra}`:
`netRevenue`, `grossRevenue`, `returnValue`, `returnPct`, `momGrowth`, `yoyGrowth`, `activeCustomers`, `activeProducts`, `billCount`, `qty`, `topProduct`, `topCustomer`, `avgBillValue`, … Each wraps `summarize()` / `monthBuckets()` / `productStats()` etc. New named metrics get added here; the portal lists them in a dropdown.

**Dimension registry** — how to group rows: `product_name`, `customer`, `region/station`, `msr`, `abm`, `speciality`, `tier`.

**Measure registry** — what to sum per group: `net` (net‑of‑returns), `gross`, `returns`, `qty`, `bills`.

**Data‑source registry** — which prepared row set a block reads:
`FS` (current‑FY, filtered), `FS_CUR_COMP` / `FS_PREV_COMP` (the comparable YoY window), `FSMSR_*`. These are exactly the sets `applyF()` already maintains.

**Chart‑type factory** — `(type, data, spec) → Plotly.newPlot(...)`:
`hbar`, `vbar`, `line`, `groupedBar` (YoY twins), `donut`, `treemap`. Uses your existing `PL`, `AX`, `PC`, `COLORS`, `fmtMoney`, `shortName` so every chart inherits the house style automatically.

A chart spec like `{type:'hbar', source:'FS', dimension:'product_name', measure:'net', topN:10}` is enough for the factory to draw "Top 10 products by net revenue" with zero bespoke code — which is how the portal lets you spin up new charts.

---

## 4. The Admin Portal (the UI)

A slide‑over panel (gear icon, top‑right) over the live dashboard, so every change previews instantly behind it. Sections:

1. **Layout** — list of tabs and the blocks inside each. Drag to reorder, toggle visibility, rename, move a block to another tab.
2. **KPI cards** — one row per card: visible toggle, label, tone colour, **metric** dropdown (from the registry), format, threshold inputs. "**+ Add KPI**" → pick metric + format, or open the code editor for a custom one.
3. **Charts** — one row per chart: visible toggle, title, **type** dropdown, dimension/measure/topN/sort/colour. "**+ Add chart**".
4. **Toggles** — manage the CY/YoY twin switches and their defaults.
5. **Theme & format** — colour pickers for the 6 tones, number scale (auto/lakh/crore), decimals.
6. **Advanced (code)** — per‑KPI `computeFn` editor and per‑chart spec editor (Tier 3), each with **Preview**, error display, and **Reset**.
7. **Config I/O** — Export config (JSON), Import config, **Reset to defaults**, **Bake into file** (download a Studio HTML whose default *is* your current config).

Every control writes to `STUDIO_CONFIG` and calls the matching renderer — no reload.

---

## 5. Persistence — where your settings live

Single local HTML file, no server, so we use a layered approach:

- **Auto‑save to `localStorage`** — your tweaks survive refresh/close on *this* browser. Zero effort.
- **Export / Import JSON** — a small `studio_config.json` you can save, back up, move to another machine, or send to Claude.
- **Bake into file** — one click downloads a fresh `dashboard_studio.html` with your current config as its built‑in default. This is the "make it permanent / share it" path and it survives anything.
- **Reset to defaults** — always returns to the known‑good current‑one‑pager config.

Recommended default: localStorage for day‑to‑day + Export before any big experiment. *(This is the one workflow choice worth your confirmation — see §9.)*

---

## 6. Safety net (this is what makes editing logic OK)

- **Everything config‑driven is wrapped in `try/catch`.** A bad KPI or chart shows a red "⚠ This card errored — Reset" tile, never a blank page. The rest of the dashboard keeps working.
- **Reconciliation self‑test** — a button that independently re‑sums grand totals and compares to `summarize(FS).net`. Green ✓ "ties out" / red ✗ "off by ₹X". So after you edit a metric, you can *prove* it's still correct.
- **Preview before Apply** in the advanced code editor — your code runs against real data in a sandbox render first; you only commit if it looks right.
- **Schema versioning + migration** — `schemaVersion` lets a newer Studio safely upgrade an older saved config instead of breaking.
- **Frozen engine** — the portal physically has no control that edits engine functions, so no amount of clicking can corrupt the maths.

---

## 7. Build phases

**Phase 0 — Scaffold (low risk).**
Copy `dashboard_onepager.html` → `dashboard_studio.html`. Add a clear banner comment marking the engine region as frozen. Confirm it loads and renders *identically* to the one‑pager (data load, all tabs, all charts). Baseline established.

**Phase 1 — Extract config + generic renderers (the critical refactor).**
Convert the hardcoded 5 KPI cards, the `moveCard` chart list, and `TOG` into `STUDIO_CONFIG`. Write `renderKPIsFromConfig()`, `renderChartsFromConfig()`, `buildTabsFromConfig()`, `applyTheme()`. **Acceptance test: Studio rendered from the default config is pixel‑identical to today's one‑pager and every number reconciles.** Nothing user‑facing changes yet — this is the foundation.

**Phase 2 — Registries.**
Formalise the metric / dimension / measure / data‑source registries and the chart‑type factory. Re‑point the Phase‑1 renderers to go through them. Still pixel‑identical output.

**Phase 3 — Portal Tier 1 (no‑code).**
Build the slide‑over UI: layout, KPI, charts, toggles, theme sections. Live re‑render on change. localStorage auto‑save + Export/Import/Reset. This is the first point where you get hands‑on control.

**Phase 4 — Portal Tier 2 & 3 (config + code).**
"+ Add KPI / + Add chart" builders. Advanced code editors with live eval, try/catch, Preview, and the reconciliation self‑test. Bake‑into‑file.

**Phase 5 — Polish.**
Schema versioning/migration, empty/error states, optional one‑click Print/PDF of the three screens, help tooltips in the portal.

**Phase 6 — Verification.**
Run the existing handoff's verification checklist; diff Studio's numbers against `dashboard_onepager.html` on the same data; visual QA on every tab/toggle; confirm a deliberately broken config fails gracefully. Then write `handoff_studio_v1.md` (a rebuild recipe, same spirit as your current handoff).

---

## 8. Risks & how we handle them

| Risk | Mitigation |
|---|---|
| Refactor accidentally changes a number | Phase 1/2 gate = pixel + number parity vs the existing one‑pager before any UI is added |
| You build a KPI that silently miscounts | Reconciliation self‑test + the metric registry composes from already‑correct helpers |
| A bad edit blanks the dashboard | `try/catch` per block → error tile, plus Reset‑to‑defaults |
| Settings lost / trapped in one browser | Export JSON + Bake‑into‑file |
| Portal grows into its own fragile mega‑tool | Scope Tier 1 to the ~80% you actually change; Tiers 2/3 are opt‑in code, not sprawling forms |
| Studio drifts from the engine over time | Engine stays a *copied, frozen* block; engine upgrades are a deliberate Claude task, re‑synced explicitly |

---

## 9. Decisions I need from you before building

1. **Persistence default** — localStorage + manual Export (my recommendation), or always Bake‑into‑file, or both equally prominent?
2. **Scope of v1** — ship Tier 1 (no‑code) first and add Tiers 2/3 in a follow‑up, or build all three tiers in one go?
3. **Charts to make configurable first** — all of them, or start with the KPI row + the four YoY‑twin toggles (highest‑value, lowest‑risk) and expand?
4. **Name** — `dashboard_studio.html` ok, or you prefer something else?

---

## 10. Deliverables

- `dashboard_studio.html` — the new config‑driven dashboard + admin portal (existing files untouched).
- `studio_config.default.json` — the exported default config (= current one‑pager).
- `handoff_studio_v1.md` — rebuild recipe + portal user guide.

---

*Plan v1 — for review. No code written yet. On approval I'll start at Phase 0 and check in at the Phase 1 parity gate before going further.*
