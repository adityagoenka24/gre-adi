# PharmaBoard — Handoff v4 (Strategic Dashboard, post-Sprint-1 + ABM rollup)

**Last updated:** May 25, 2026
**Client:** AFD Hospicare (S.D. Pharmaceuticals)
**Active file:** `dashboard_strategic.html` *(2,925 lines, ~175 KB)*
**Predecessor handoffs:** `pharmaboard_handoff_v3.md` (architecture baseline), `pharmaboard_handoff_v2.md` (SwilERP file structure, build system)
**Companion docs:** `Strategic_Brief.md` · `Presenter_Cheatsheet.md` · `cmo_review_self.md` (CMO1 audit) · `strategic_review_cmo.md` (CMO2 audit) · `cmo_combined_action_plan.md` (sequenced backlog)

> **Tldr for the next chat:** Sprint 1 of the combined CMO action plan ("Two-CMO Synthesis") is shipped. Four mathematical fabrications removed, territory-fair scoring in, Therapeutic Division filter live, ABM rollup added (Sprint 2 item #12 brought forward because it was data-unblocked). The dashboard is no longer "statistical fantasy dressed up as analysis" in the four places the CMOs called out. **Next:** Sprint 2 items 9–11 (Targets / Outstanding / Inventory) — each blocked on a single XLSX export from AFD finance.

---

## 1. What changed v3 → v4

This release implements the **`cmo_combined_action_plan.md`** synthesis. Two independent CMO audits agreed on four blocking flaws; both reviews + the synthesis are in the repo. Read those three files before extending — they define the *commercial* worldview the dashboard now serves.

### v4 changes summary

| Area | v3 (pre-audit) | v4 (post-Sprint-1 + ABM) |
|---|---|---|
| **Brand matching** | Fuzzy first-two-word substring (`productTokenMatch` line 1312) — `ECOXIB 60 MR TAB` missed `ECOXIB60` | `cleanBrandKey()` canonical normalizer — strips strength/form/punctuation, manual override map |
| **Speciality Revenue Mix** | Fabrication: city revenue proportionally allocated by doctor-headcount ratio per speciality | **Brand Category Revenue Mix** — sum of FSMSR revenue by product → therapeutic division (Cardio/Ortho/GenMed). Separate **Doctor Speciality Headcount** chart shown alongside. |
| **HQ vs EX Revenue** | Fabrication: city revenue split by HQ/EX doctor-headcount ratio. 100% of stockist billing lands on HQ in reality. | **HQ vs EX Coverage & Adherence** — Total Mapped vs Active Mapped doctors (grouped bars) + Strategy Adherence % (line on secondary axis). Honest field-coverage metric. |
| **MSR Composite Score** | Punished upcountry reps: `(net/maxNet)*40` term meant a Patna rep could never beat a Mumbai rep | Territory-fair Efficiency Score: Growth 35 + Targeting 30 + Coverage 25 + Strategic SKU 10 (out of 100). 10-pt Achievement bucket pre-wired for Sprint 2 targets file. |
| **Customer × Product heatmap** | 15×12 grid, mostly empty cells, low ink-to-insight | **Top-20 Customer × Product combos table** — Revenue · MoM Δ · Δ% · Returns flag · Share of Top-20 |
| **Therapeutic Division filter** | Mono-division — Ecoxib/Rednil/Kover all rolled into one total | `f-div` dropdown · DIVISIONS static dict · "Division · Cardiology" pill in topbar so reps don't read company totals as their own |
| **ABM grain** | None — only MSR-level | Full ABM rollup: KPI strip · Scorecard table · Score-component stacked bars · `f-abm` filter |
| **Speciality nomenclature** | "Cardiologist"/"CARDIO"/"Cardiology" treated as 3 categories | `SPEC_CANON` + `canonSpeciality()` collapses variants |
| **City joins** | `BAGDAH` ≠ `Bagdah, North 24 Parganas` | `canonCity()` strips district suffix and parenthetical asides |
| **Data hygiene** | Silent | Topbar pill **"Data hygiene · review"** when >10% of cities unmatched or specialities collapsed |
| **Insights/Decisions** | Generic BCG-slide language | Pharma instruments: POB, CME, RCPA, DCR, joint field day, contract renewal, beat-plan reset. Ranked by ₹ impact. ABM-level cards. Auto-flag low EX coverage. |

### What is now mathematically honest

The "kill these" category from the CMO audits is closed:
- ✅ **A1 — Speciality Revenue Mix fabrication** — replaced by Brand Category Revenue Mix (real revenue from product) + separate Speciality Headcount chart (real doctor count).
- ✅ **A2 — HQ/EX Revenue Split fabrication** — replaced by Coverage & Adherence (honest field metric).
- ✅ **A3 — Top Customer × Product Heatmap** — replaced by ranked Top-20 combos table.
- ✅ **B1 — Composite Score scale punishment** — `(net/maxNet)*40` removed; new score is territory-fair.
- ✅ **B5 — Targeting fuzzy match** — `cleanBrandKey()` is now an exact-canonical match.
- ✅ **C6 — Speciality / city nomenclature hygiene** — `SPEC_CANON` + `canonCity` collapse variants; topbar warning pill.
- ✅ **D7 — Division filter (also CMO2 #2)** — `f-div` + DIVISIONS + Division Mode pill.
- ✅ **D8 — ABM rollup** — full scorecard, comparison chart, filter.

Sprint 1 said 8 items; we shipped 8 items + ABM (which was Sprint 2 item #12, pulled forward because it needed no new data).

---

## 2. File inventory (updated)

Located in: `/Users/adityagoenka/Desktop/Sandbox/Pharmaboard/`

| File | Role | Status |
|---|---|---|
| `dashboard_strategic.html` | **Active dashboard** — 2,925 lines, single file, browser-only | **Current** |
| `cmo_combined_action_plan.md` | Two-CMO synthesis → 4-sprint sequenced backlog | **Source of truth for what to ship next** |
| `cmo_review_self.md` | CMO1 audit — strategic/commercial worldview gaps | Reference for Sprint 2/3/4 priorities |
| `strategic_review_cmo.md` | CMO2 audit — engineering-deep pure-code fixes | Reference for the four flaws |
| `pharmaboard_handoff_v4.md` | **This file** | Current |
| `pharmaboard_handoff_v3.md` | Architecture baseline doc | Still valid for: normName(), JOIN_HEALTH, app flow, chart zoom modal, late upload, salutation-aware MSR joining |
| `pharmaboard_handoff_v2.md` | SwilERP file format, mgmt dashboard, build system | Still authoritative for those topics |
| `Strategic_Brief.md`, `Presenter_Cheatsheet.md` | QBR narrative + per-chart talk track | Need a refresh — body text changed in v4 |
| `Doctor_Master.xlsx` | 1,366 doctors × 12 cols | Unchanged |
| `index-3.html` | Older artifact | **Superseded — ignore** |

**Always work from `dashboard_strategic.html`.**

---

## 3. New architecture pieces (v4)

### 3.1 Canonical brand normalizer — `cleanBrandKey()`

**Location:** lines ~975 (function), used at ~10 call sites.

```javascript
function cleanBrandKey(name) {
  // strips TAB/CAP/INJ/MR/SR/PR/XR/XL/CR/DS/FORTE/PLUS/ADVANCE
  // strips numeric strengths (60, 60mg, 250, 500, 90, 120, etc.)
  // strips punctuation, normalizes whitespace
  // manual map: anything starting with ECOXIB → 'ECOXIB',
  //             anything starting with KOVER  → 'KOVER ALL',
  //             anything starting with REDNIL → 'REDNIL'
  return cleanCanonical;
}
```

Verified: `ECOXIB 60 MR TAB` ≡ `ECOXIB60` ≡ `ECOXIB-60 MR Tab` ≡ `ECOXIB` all return `'ECOXIB'`.

**Used by:**
- `tokenizeProducts()` — when ingesting the Doctor Master's mapped-products column
- `productTokenMatch()` — when checking if a sold product is in a doctor's mapped set
- `applyF()` — when the Division filter is active (brand whitelist)
- `divisionForProduct()` — to assign each sales row to a division
- MSR Score's Strategic SKU breadth term — count distinct strategic brands sold
- `renderCustProdCombos`, `abmStats`, `hqExCoverage`, all key product joins

### 3.2 Therapeutic Division dictionary — `DIVISIONS`

**Location:** lines ~895–945.

```javascript
const DIVISIONS = {
  'CARDIOLOGY':       { label, brands:['REDNIL'],    specialities:[...], strategic:['REDNIL'],    color:'#b91c1c' },
  'ORTHOPAEDICS':     { label, brands:['ECOXIB'],    specialities:[...], strategic:['ECOXIB'],    color:'#1e40af' },
  'GENERAL MEDICINE': { label, brands:['KOVER ALL'], specialities:[...], strategic:['KOVER ALL'], color:'#047857' }
};
const BRAND_TO_DIVISION = {};     // 'ECOXIB' → 'ORTHOPAEDICS', etc.
const SPEC_TO_DIVISION = {};      // 'CARDIOLOGIST' → 'CARDIOLOGY', etc.
const STRATEGIC_BRANDS = new Set(['ECOXIB','REDNIL','KOVER ALL']);
```

**This is v1 — static dict.** Synthesis §2.1: in v2, externalize this to either (a) a separate `product_division_map.csv` uploaded alongside sales/MSR/doctor, or (b) a column on the Doctor Master. **AFD will add SKUs and rename divisions; today every change requires a code edit.** Tech debt is intentional and noted.

### 3.3 Speciality / City canonicalization

**`SPEC_CANON`** (lines ~955) collapses `Cardiologist`/`CARDIO`/`Cardiology`/`Cardiac` → `CARDIOLOGY`, similar for Ortho, GP, OBG, Derm, ENT, Neuro, Psych, Surgery.

**`canonSpeciality(s)`** returns canonical key, fallback to uppercased original if no match.

**`canonCity(c)`** strips parenthetical asides, takes only the segment before first comma, strips `DIST.`/`DISTRICT`/punctuation, uppercases, trims. Examples:
- `'Bagdah, North 24 Parganas'` → `'BAGDAH'`
- `'Burdwan Dist.'` → `'BURDWAN'`
- `'  patna  '` → `'PATNA'`

**Important:** `DOC_BY_CITY` is now keyed by `canonCity()` output (not `norm()`). All consumers must use `canonCity(r.station)` for the lookup. The data-hygiene pill triggers when >10% of doctor cities don't match a sales station after canonicalization.

### 3.4 Territory-Fair MSR Efficiency Score

**Formula (synthesis §2.3, lines ~2351–2400):**

```javascript
// HAS_TARGETS flag is false until Sprint 2 ingestion lands.
// When false, the 10-pt Achievement bucket auto-redistributes:
//    Growth 30 → 35,  Targeting 25 → 30,  Coverage 25 → 25,  Achievement 10 → 0,  SKU 10 → 10
// Total stays 100.

const growthScore    = clamp((g + 25) / 50, 0, 1) * W.growth;      // ±25% MoM range
const targetingScore = clamp(tpct / 100, 0, 1)    * W.target;
const coverageScore  = clamp(coveragePct / 100, 0, 1) * W.coverage;
const skuScore       = clamp(strategicCount / STRATEGIC_BRANDS.size, 0, 1) * W.sku;
score = growthScore + targetingScore + coverageScore + skuScore;
```

The `(net/maxNet)*40` term is **gone**. Patna and Mumbai are now compared on efficiency, not scale.

`s.score_parts` carries the four component values so the table tooltip shows the breakdown.

### 3.5 ABM rollup

**`abmStats(rows, hasDoc)`** (lines ~1763–1810) groups FSMSR by `r.abm` and computes the same territory-fair score at ABM grain. Returns array of `{abm, msrs, msrCount, net, growth, coverage, targeting, strategic, score, score_parts, ...}`.

**Helper functions:**
- `targetingByAbm(rows)` — same calculation as `targetingEffectiveness` but grouped by ABM
- `abmCoverage(rows, hasDoc)` — for each ABM, count mapped doctors across the team's MSRs and how many are active (mapped product sold in their city by any MSR on the team)

**Render functions** (lines ~2240–2320):
- `renderABMKpi(hasDoc)` — 4-tile KPI strip (Active ABMs, Avg Team Revenue, Top Performer, Efficiency Spread)
- `renderABMTable(hasDoc)` — sortable scorecard. Mirrors MSR table columns but at team grain. ABM name + roster on hover.
- `renderABMBars(hasDoc)` — stacked horizontal bars per ABM, segmented by the four score components. The single most useful National-Sales-Head view.
- `abmSort(col)` — sort handler (mirrors `msrSort`)

**Filter:** `f-abm` dropdown (lines ~544), wired in `buildFilters`/`resetF`/`applyF`. Selecting an ABM scopes the entire dashboard to that team.

### 3.6 HQ vs EX Coverage & Adherence

**`hqExCoverage()`** (lines ~2731–2778) returns `{ HQ:{mapped,active,coveragePct,rev,mappedRev,adherencePct,...}, EX:{...} }`.

Definitions:
- `mapped` = count of doctors classified as HQ (or EX) on Doctor Master
- `active` = of those, how many had a mapped product billed in their city
- `coveragePct` = active / mapped
- `adherencePct` = revenue from mapped products / total revenue (in cities where the doctor lives)

This is used by `renderHQEx()` and by both `buildInsights()` (low EX coverage flag) and `renderDecisions()` (EX intervention card).

---

## 4. State variables — what's new

```javascript
// added in v4:
let ACTIVE_DIV = null;                     // current Therapeutic Division filter ('CARDIOLOGY' | 'ORTHOPAEDICS' | 'GENERAL MEDICINE' | null)
let ABM_SORT = { col:'score', dir:'desc' };

// updated semantics:
DOC_BY_CITY = Map()                        // KEYS ARE NOW canonCity() output, not norm()
JOIN_HEALTH = {
  msrLinked, msrTotal, pct,
  cityLinked, cityTotal, cityPct,
  specCollapseRatio,                       // NEW — fraction of speciality variants collapsed
  cityUnmatched                            // NEW — fraction of doctor cities unmatched by sales stations
};

// Doctor record (DOC[i]) now has:
//   speciality_raw     — original string
//   speciality         — title-cased canonical
//   speciality_canon   — uppercase canonical (joins on this)
//   cityKey            — canonCity() output
//   division           — divisionForSpeciality(...) or null

// FSMSR row gets r.abm joined in cleanMSR (unchanged from v3, but now consumed for the first time)
```

---

## 5. Updated code section map

Changes from v3 section map are marked **[v4]**.

```
CONFIG          GH_FILES URLs · SCHEMA · MSR_SCHEMA · DOC_SCHEMA · COLORS · PALETTE · PL/AX/PC
                **[v4]** DIVISIONS · BRAND_TO_DIVISION · SPEC_TO_DIVISION · STRATEGIC_BRANDS · SPEC_CANON
STATE           RAW · COLS · MAP · D · DMSR · DOC · FS · FSMSR · CF · sort state · JOIN_HEALTH
                **[v4]** ACTIVE_DIV · ABM_SORT
HELPERS         norm · normName · fmtMoney · fmtNum · fmtPct · fmtDelta · safeGrowth · sortBy
                **[v4]** cleanBrandKey · canonSpeciality · canonCity · divisionForProduct · divisionForSpeciality
DATA CLEANING   tokenizeProducts (now canonical) · productTokenMatch (now exact-canonical) ·
                computeJoinHealth (adds spec/city hygiene metrics) · buildDoctorIndex (adds canonical fields + division on doctor)
FILTERS         buildFilters (adds f-div, f-abm) · resetF · applyF (adds division brand + spec whitelisting, ABM filter)
COMPUTE         msrStats · targetingEffectiveness · doctorPortfolio
                **[v4]** targetingByAbm · abmCoverage · abmStats · hqExCoverage
TAB 1 PULSE     renderPulse · renderHeroes · renderInsights · buildInsights (ABM tiles, low-EX flag, pharma verbs, ₹-ranked)
                renderMomentum · renderBridge · renderPareto · renderOpportunity
                renderDecisions (ABM card, EX card, pharma instruments, ₹-ranked)
TAB 2 GROWTH    renderGrowth · renderGrowthKPI · renderGrowthWaterfall · renderMomentumMatrix
                **[v4]** renderCustProdCombos (replaces renderCustProdHeat)
                renderAccelTable · renderDeclTable
TAB 3 FIELD     renderField · renderDocBanner · renderFFKPI
                **[v4]** renderABMKpi · renderABMTable · renderABMBars · abmSort
                renderMSRTable (uses new score, adds coverage/strategic columns)
                renderPyramid · renderTargeting
                **[v4]** renderSpecMix → Brand Category Revenue Mix
                **[v4]** renderSpecHeadcount (new)
                **[v4]** renderHQEx → HQ vs EX Coverage & Adherence
                renderDoctorWatch (canonCity now used in lookup)
TAB 4 PRODUCTS  unchanged from v3
TAB 5 TERR      unchanged from v3 (state×product heatmap is different from the one we killed — left in)
TAB 6 REG       unchanged
LATE UPLOAD     renderFileStatus (adds Division Mode pill, Data hygiene pill)
```

---

## 6. Filter bar (post-v4)

Eight controls, left to right:

| Filter | ID | Type | Behavior |
|---|---|---|---|
| From | `f-from` | date | start of period |
| To | `f-to` | date | end of period |
| Division | `f-div` | select | Cardiology / Orthopaedics / General Medicine. Whitelists brands and specialities. Surfaces "Division Mode" pill. |
| Product | `f-prod` | select | individual SKU |
| Customer | `f-cust` | select | stockist |
| Territory | `f-rgn` | select | station name |
| ABM | `f-abm` | select | populated from `DMSR.abm` |
| MSR | `f-msr` | select | populated from `DMSR.msr` |
| Speciality | `f-spec` | select | populated from canonical specialities (DOC) |
| Doctor Tier | `f-tier` | select | SUPER CORE / VIP / CORE |

Click **Reset Filters** clears all eight + the cross-filter chip.

---

## 7. Pulse tab — what changed

Heroes/momentum/bridge/pareto/opportunity unchanged. The **Intelligence Brief** and **Strategic Decisions** are now:

**Intelligence Brief** (`buildInsights`) — ranks every candidate insight by `impact` (₹ value or proxy), returns top 8. New insight types:
- ABM Leader / ABM Laggard
- Low EX coverage (auto-fires when EX coverage <40%)
- Low HQ adherence (<50% on-strategy revenue in HQ)

All insight bodies now use pharma instruments: POB, CME, RCPA, DCR, joint field day, beat-plan reset, contract renewal lock-in.

**Strategic Decisions** (`renderDecisions`) — same six tags (Protect / Accelerate / Fix / Intervene / Realign / Expand) + a 7th Intervene for ABM monthly review + an 8th Intervene for low EX coverage. Ranked by ₹ impact, capped at 6 visible.

---

## 8. Field Force tab — what changed

New section order (top to bottom):

1. KPI strip (unchanged: Active MSRs · Net Rev · Avg per MSR · Top Performer · Doctor Coverage · Targeting Effectiveness)
2. **`[v4]` ABM Rollup section** — 4 KPI tiles + Scorecard + Score-component bar chart
3. MSR Performance Scorecard — **[v4]** new score formula and columns (Coverage % · Strategic SKUs)
4. Doctor Portfolio Pyramid (unchanged)
5. Targeting Effectiveness chart (unchanged)
6. **`[v4]` Brand Category Revenue Mix** (replaces Speciality Revenue Mix)
7. **`[v4]` HQ vs EX Coverage & Adherence** (replaces HQ vs EX Revenue Split)
8. **`[v4]` Doctor Speciality Headcount** (new chart, separated from Brand Mix)
9. Doctor Watchlist (unchanged behavior; canonCity now used internally)

---

## 9. Smoke test recipe

### JS syntax check

```bash
# Extract the inline <script> body and node --check it.
python3 -c "
import re
html = open('/Users/adityagoenka/Desktop/Sandbox/Pharmaboard/dashboard_strategic.html').read()
scripts = re.findall(r'<script>(.*?)</script>', html, flags=re.DOTALL)
open('/tmp/d.js','w').write(max(scripts, key=len))
"
node --check /tmp/d.js
```

Expected: `SYNTAX OK` (currently 2,627 lines of JS).

### Helper unit tests (25 cases)

The full test bench lives in the conversation that built v4. Critical assertions any future change must preserve:

```javascript
cleanBrandKey('ECOXIB 60 MR TAB')       === 'ECOXIB'
cleanBrandKey('ECOXIB60')               === 'ECOXIB'
cleanBrandKey('ECOXIB-60 MR Tab')       === 'ECOXIB'
cleanBrandKey('KOVER ALL TAB')          === 'KOVER ALL'
cleanBrandKey('Kover All Forte')        === 'KOVER ALL'

divisionForProduct('Ecoxib 60 MR Tab')  === 'ORTHOPAEDICS'
divisionForProduct('Rednil 5mg Cap')    === 'CARDIOLOGY'
divisionForProduct('Kover All Liquid')  === 'GENERAL MEDICINE'
divisionForProduct('UnknownX')          === null

canonSpeciality('Cardiologist')         === 'CARDIOLOGY'
canonSpeciality('CARDIO')               === 'CARDIOLOGY'
canonSpeciality('Ortho')                === 'ORTHOPAEDICS'
canonSpeciality('GP')                   === 'GENERAL MEDICINE'

canonCity('Bagdah, North 24 Parganas')  === 'BAGDAH'
canonCity('Burdwan Dist.')              === 'BURDWAN'

productTokenMatch('ECOXIB60', new Set(['ECOXIB']))    === true
productTokenMatch('Marvel 90', new Set(['ECOXIB']))   === false
```

### ABM unit tests (11 cases)

Fixture (in `abmStats`):
- ABM-1 has 2 MSRs (Arnab + Bipul), all sales on Ecoxib + Rednil → expect targeting 100%, strategic 2/3
- ABM-2 has 2 MSRs (Chetan + Deep), mix of mapped Kover and unmapped Marvel → expect targeting <100%, strategic 1/3
- ABM-1's net = 440,000 (300K March + 210K April)
- ABM-1's score > ABM-2's score
- Both ABMs have score_parts with 4 keys

Run via the eval-the-script-with-DOM-stubs pattern in the original implementation transcript.

### Manual smoke checklist

Open the file and verify:
- [ ] Filter bar shows 8 selects (Division and ABM are new)
- [ ] No data hygiene pill on Doctor_Master.xlsx (it's clean for AFD's data)
- [ ] Field Force tab shows ABM section above MSR section
- [ ] Hover the ABM Score badge — tooltip shows "Growth X/35 · Targeting Y/30 · Coverage Z/25 · Strategic SKU W/10"
- [ ] Brand Category Revenue Mix chart shows 3 division bars + (possibly) Off-divisional
- [ ] HQ vs EX chart shows grouped bars + gold dotted Adherence line, NOT the prior revenue split
- [ ] Pick Division = Cardiology → "Division · Cardiology" pill appears in topbar, brand/spec scope tightens

---

## 10. What's blocked vs unblocked for Sprint 2

Sprint 2 spec is in `cmo_combined_action_plan.md` §5 (items 9–12). One is shipped, three are data-blocked.

### ✅ #12 ABM rollup — SHIPPED in v4

Data was already in the MSR mapping file (`abm1`/`abm2` columns). No external data needed.

### ⏳ #9 Targets file — BLOCKED on data

**Ask AFD finance for:** `targets.xlsx` with columns:
- `MSR Name` (matching the spelling in the MSR mapping file — Mr./No-salutation either OK, `normName()` will harmonize)
- `Month` (e.g. `Apr-2026` or `2026-04`)
- `Target ₹`
- *(optional)* `Product` / `Brand` — for SKU-level targets
- *(optional)* `Region` / `Zone` / `ABM` — for hierarchical targets

**What unlocks when this lands:**
- `Achievement %` becomes the Pulse hero KPI
- "Gap-to-Target ₹14L" replaces "MoM +8%" in Decision cards
- The 10-pt Achievement bucket activates in the territory-fair score (the existing `HAS_TARGETS` flag in `renderMSRTable` and `abmStats` flips to true)
- Score weights redistribute: Growth 30 + Targeting 25 + Coverage 25 + **Achievement 10** + SKU 10

**Implementation plan when data lands:**
1. Add `target.xlsx` slot to upload screen + `TARGET_SCHEMA` + `MAP.target`
2. `cleanTargets(raw, map)` → array of `{msr, month, target, product?, abm?}`
3. `achievementByMsr(monthKey)` / `achievementByAbm(monthKey)` helpers
4. Flip `HAS_TARGETS = true` in `renderMSRTable` and `abmStats`
5. Compute `achievementScore = clamp(actual/target, 0, 1.2) * W.achieve` (allow over-100 to reward but cap at 120% so it doesn't dominate)
6. Add a Hero tile "Achievement %" and Decision text "MSR X at 62% of plan — gap ₹14L"

### ⏳ #10 Outstanding / Receivables — BLOCKED on data

**Ask AFD ops for the SwilERP "Outstanding/Aging" report.** Handoff v2 notes it exists. Expected columns:
- `Customer` (matches `Name of Party` in sales file)
- `Bill No`
- `Bill Date`
- `Due Date` *(or credit terms — we can compute)*
- `Bill Amount`
- `Outstanding Amount`

**What unlocks:**
- New tab or KPI strip: Outstanding by stockist · DSO trend · Aging buckets (0-30 / 31-60 / 61-90 / 90+) · Top-10 overdues
- "Collected Revenue %" as a quality metric next to Net Revenue
- Decision card text becomes "Customer X at ₹4.2L overdue 75 days — escalate ABM review before next dispatch"

### ⏳ #11 Inventory / Closing Stock — BLOCKED on data

**Ask AFD ops for the SwilERP "Inventory/Stock as on" report.** Handoff v2 mentions `CurBal`. Expected columns:
- `Product` (matches sales file)
- `Batch No`
- `Mfg Date`
- `Expiry Date`
- `Closing Qty`
- `Closing Value` *(or PRate so we can compute)*

**What unlocks (CMO1's biggest miss, D1 in the audit):**
- **Days of Inventory** KPI on Pulse hero — `closingStock / (avgMonthlySales / 30)`
- **Near-expiry %** of closing stock — flags channel-stuffing risk
- **Inventory-to-Sales ratio** per stockist
- Decision card "Stockist Y holding 92 days inventory + 38% near-expiry — credit hold + return preempt"
- The primary-vs-secondary blind spot becomes visible (or at least the channel-inventory side)

### Recommended ask email (draft)

> Subject: PharmaBoard Sprint 2 — three SwilERP exports needed
>
> Hi [finance/ops],
>
> The strategic dashboard is ready for the second-phase data — three monthly SwilERP exports you already run for internal reporting. Could you send the most recent month (and ideally the prior 6 months) of:
>
> 1. **Targets** — MSR × Month × Target ₹ (and Product if you target at SKU level). XLSX is fine.
> 2. **Outstanding / Aging** — the standard SwilERP receivables export with Bill Date, Due Date, Bill Amount, Outstanding Amount per stockist.
> 3. **Inventory / Closing Stock** — the SwilERP stock-as-on report with Batch, Mfg Date, Expiry, Closing Qty, Closing Value.
>
> No formatting changes needed — auto-mapper will pick up your existing column names. Send to [email].
>
> The dashboard will then surface: Achievement % vs Plan, DSO and overdue concentration, Days of Inventory and near-expiry risk. All three unlock the CMO-level "is the growth real or channel-stuffed?" view.
>
> Thanks!

---

## 11. Sprint 3 — Intelligence layer (after Sprint 2 closes)

From `cmo_combined_action_plan.md` §5:

### #13 Returns decomposition by reason code
SwilERP carries return reason codes. Stack chart: expiry / near-expiry / damage / scheme adjustment / sale-or-return. Lift expiry into its own KPI. Tighten threshold to 1.5% from current 2%.

### #14 T3M moving average
Pharma months are noisy (scheme/non-scheme, holiday months, credit-cycle). Make T3M the Pulse hero primary, MoM the secondary chip. Implementation: `monthBuckets()` already returns rolling array — add a `t3m` helper that returns the trailing 3-month average.

### #15 Customer cohort / Silent churn widget
- New stockists this quarter (first bill in last 90 days)
- Silent stockists (no bill in last 60 days)
- Reactivated stockists (gap > 60 days then resumed)
- Single-glance retention health card on Pulse

### #16 Tier validation panel
Revenue per VIP / per Core / per Super Core ratios, by MSR. Flag inverted ratios (where a rep's Core doctors out-bill their VIPs). This validates whether the Doctor Master labels are commercially real.

### #17 Visual hierarchy refactor for Pulse
22 visual blocks on Page 1 today. Restructure to L1 (4 hero tiles + 3 ranked insights + 1 Decision of the Week) visible on load, L2 (charts) on scroll, L3 (full decision queue) on click.

### #18 Multi-dimensional cross-filter
Chained filters with chip stack at top. Right now clicking a bar replaces the cross-filter; we need it to compose.

---

## 12. Sprint 4 — Strategic capability (data-dependent, longer arc)

### #19 Market reference input
Manual "Market Reference Growth %" input per division/molecule. Compute outperformance vs market. Even without AIOCD data, a manual quarterly number suffices.

### #20 MSR call metrics ingestion (the holy grail)
If AFD has SFA tool (Marg+/MR-Plus/Bizom): ingest Call Average, RCPA, DCR compliance, Tour Plan vs Actual, POB achievement. Today the dashboard's "MSR performance" is revenue attribution only; with call metrics it becomes true productivity.

### #21 Sample / Promo cost ingestion
Sample-to-sale ROI per MSR/product/territory. If sample register is in any form (Excel or SwilERP), ingestion is one CSV.

### #22 Stockist secondary sales
If AIOCD or stockist secondary feeds available, the channel-stuffing question gets a definitive answer.

### #23 Doctor digital engagement
CMEs attended, sample requests, webinar views.

---

## 13. Known limitations / open issues (updated)

Items 1–7 from v3 §9 are unchanged. Updates and new:

8. **`DIVISIONS` is a static dict** — adding a new SKU or renaming a division requires a code edit. Synthesis §2.1 calls this v1 tech debt; v2 will externalize.

9. **`HAS_TARGETS = false`** — both `renderMSRTable` and `abmStats` have this flag hard-coded. When Sprint 2 ships, flip it to true and the 10-pt Achievement bucket auto-activates.

10. **Strategic SKU breadth caps at `STRATEGIC_BRANDS.size = 3`** — this is right for AFD today but if the company adds a 4th strategic brand, the score's strategic component will artificially compress unless the cap is updated.

11. **ABM rollup attributes each MSR's rows to whichever ABM the MSR file lists** — if the MSR mapping has multi-ABM rows (e.g. `"ABM-1 / ABM-2"`), they roll up to that combined string. Today AFD's data uses single ABM per customer, so this is theoretical.

12. **Coverage at MSR grain re-computes per-MSR active set** — `renderMSRTable` walks DOC and FSMSR for each MSR. O(MSRs × DOC × FSMSR). On AFD's data (~30 MSRs × 1,366 docs × ~10K sales rows) this is ~400ms total. Will need indexing if data scales to 100+ MSRs.

13. **The State × Product heatmap on the Territory tab is still a heatmap** — different from the Customer × Product one we killed. It's 10×10, denser, and the action plan didn't flag it. Leaving intact.

---

## 14. Updated rules for v4

v3 rules 1–10 still apply. New v4 rules:

11. **Use `cleanBrandKey()` for any product-name comparison.** Never raw string compare. The fuzzy `productTokenMatch` is replaced by a Set lookup on canonical keys.

12. **Use `canonCity()` (not `norm()`) for city/station joins.** `DOC_BY_CITY` is keyed by `canonCity()` output. Any consumer that uses `norm(r.station)` to look up doctors will silently miss matches.

13. **Use `canonSpeciality()` when grouping by speciality.** The DOC record carries both `speciality_canon` (for joins) and `speciality` (title-cased canonical for display).

14. **`DIVISIONS` is the source of truth for brand → division and speciality → division.** When AFD adds a new SKU, update DIVISIONS (not the chart code). When AFD adds a new speciality variant, add it to both `DIVISIONS[X].specialities` and `SPEC_CANON`.

15. **Two flags control score weight redistribution:** `HAS_TARGETS` (in `renderMSRTable` and `abmStats`). These are intentionally duplicated — keep them in sync when Sprint 2 ships.

16. **`computeJoinHealth()` now also computes `specCollapseRatio` and `cityUnmatched`.** Don't remove those — the data-hygiene pill reads them.

17. **`ACTIVE_DIV` is global state, set inside `applyF()`.** Insight/Decision builders read it. Don't shadow it with a local.

---

## 15. Resume-development prompt cookbook (v4 additions)

### Wire up Targets file (Sprint 2 #9)
> "AFD finance sent `targets.xlsx` with columns MSR Name, Month, Target ₹. Add a 4th upload slot to `dashboard_strategic.html`, write `TARGET_SCHEMA`, `cleanTargets()`, and `achievementByMsr(monthKey)`. Flip `HAS_TARGETS = true` in `renderMSRTable` and `abmStats`. Add a Hero tile 'Achievement %' to Pulse and update Decision card text to use Gap-to-Target language. Re-run smoke tests."

### Wire up Outstanding (Sprint 2 #10)
> "AFD ops sent `outstanding.xlsx` from SwilERP. Add an Outstanding tab (or KPI strip) showing: aging buckets, DSO trend, top-10 overdues, Collected-Revenue %. Schema: Customer, Bill No, Bill Date, Due Date, Bill Amount, Outstanding Amount. The Customer column matches sales file's customer."

### Wire up Inventory (Sprint 2 #11)
> "AFD ops sent the SwilERP `inventory.xlsx`. Compute Days of Inventory (closing / avg-monthly-sales × 30) and Near-Expiry % (stock with expiry <6 months / total closing). Add to Pulse hero. Add a per-stockist DOI table on Territory tab. Schema: Product, Batch No, Mfg Date, Expiry, Closing Qty, Closing Value."

### Externalize DIVISIONS to file (Sprint 2 v2 of #1)
> "Replace the static `DIVISIONS` dict with a CSV upload. New 5th upload slot for `product_division_map.csv` with columns Brand · Division · Strategic (Y/N) · Specialities (semicolon-separated). Build DIVISIONS at runtime in cleanDivisionMap(). Keep the hardcoded dict as fallback if no file uploaded."

### Add T3M smoothing (Sprint 3 #14)
> "Add `t3m(buckets)` helper that returns a parallel array of trailing-3-month averages of buckets[i].net. Update Pulse hero KPI: show T3M growth as primary, MoM as secondary chip. Update `buildInsights` headline momentum block to lead with T3M."

### Returns decomposition (Sprint 3 #13)
> "SwilERP carries a `Return Reason` column on credit notes. Add it to sales schema aliases. In Pulse, replace the single Return Drag tile with a stacked bar by reason code (Expiry / Near-Expiry / Damage / Scheme / Sale-or-Return). Lift Expiry % into its own KPI tile. Tighten the watch threshold from 2% to 1.5%."

### Lazy tab rendering (Phase 2)
> "Optimize: tabs other than the active one shouldn't render on `applyF()`. Use the `RENDERED` Set to track which tabs are clean; clear it on `applyF()`; only render tabs as they're activated. Re-resize charts on `switchTab`."

---

## 16. Tech stack — unchanged

```
HTML5 single file
Plotly.js     2.35.2  — all charts (CDN)
SheetJS xlsx  0.18.5  — XLS/XLSX/CSV parsing (CDN)
Plus Jakarta Sans     — display typography
Inter                 — body typography
JetBrains Mono        — numeric/code
```

No PptxGenJS — ever (Safari WebKit crash, documented in handoff v2).

---

## 17. Validation checklist for next chat

Before declaring any change to `dashboard_strategic.html` "done":

- [ ] `node --check` on the extracted inline script passes
- [ ] Open file in browser, no console errors on load
- [ ] All 25 helper unit tests still pass (cleanBrandKey, divisionForProduct, canonCity, canonSpeciality, productTokenMatch, STRATEGIC_BRANDS membership)
- [ ] All 11 ABM-rollup unit tests still pass (abmStats fixture)
- [ ] Visual: Field Force tab shows ABM section above MSR section
- [ ] Visual: Division filter scopes the dashboard and surfaces the "Division Mode" pill
- [ ] Visual: data-hygiene pill **does not** show on AFD's clean Doctor_Master.xlsx
- [ ] Visual: HQ vs EX chart shows grouped bars + adherence line, NOT a revenue split

---

## 18. Why this matters (the commercial story for v4)

Quoting the synthesis (`cmo_combined_action_plan.md` §6):

> *"CMO2 gives us the surgeon's plan for the next two weeks. CMO1 gives the architect's plan for the next two quarters."*

v4 is the surgeon's plan executed. Four mathematical fabrications are removed; the dashboard no longer needs to be "covered with my hand" in front of a board. The MSR scorecard is now fair to a Patna rep working a smaller geography. Divisional context is one click. The National Sales Head has an ABM rollup to live in.

v5 (Sprint 2) starts the architect's plan — Targets, Outstanding, Inventory — and is the conversation to have with AFD finance. Once those three land, the dashboard answers the five questions a CMO actually asks:

1. *Are we ahead, behind, or on target — by division?* → Achievement % (Sprint 2 #9)
2. *Is the growth real or channel-stuffed?* → Inventory + closing stock triangulation (Sprint 2 #11)
3. *Who's collecting? Who isn't?* → DSO + aging + collected-revenue % (Sprint 2 #10)
4. *Where's the field force breaking?* → ABM and MSR efficiency scores ✓ **done in v4**
5. *What's the ONE thing for Monday morning?* → Single ranked Decision card ✓ **done in v4**

v4 closes question 4 and 5. v5 closes 1–3.

— *Updated by next-chat me, May 25, 2026.*
