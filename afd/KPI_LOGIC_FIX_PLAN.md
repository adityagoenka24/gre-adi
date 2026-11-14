# PharmaBoard — KPI Logic Audit & Fix Plan (v7 → v8 "logic correctness")

**File audited:** `dashboard_presentation.html` (v7, 5,444 lines)
**Author:** Fresh-analyst audit for Adi
**Scope:** Underlying calculation logic only. **No UI / layout / styling changes.** Every formula below references the function and line where it lives in the current file.

---

## 0. TL;DR — the two root causes

### Bug 1 — "Net" is not net of credit notes
The whole dashboard has **two conflicting definitions of "net"** living side by side:

| Convention | Formula | Meaning | Where it's used |
|---|---|---|---|
| **A — "exclude returns"** (WRONG when labelled *net*) | `sum(rows where !is_return → sales_value)` | Gross sales, returns simply dropped | `summarize()`, `monthBuckets()`, `productStats()`, `msrStats()`, `abmStats()`, all KPI-card "Net Revenue / Net" tiles, customer & territory rankings |
| **B — "signed"** (CORRECT net) | `sum(rows → is_return ? -|sales_value| : sales_value)` | Gross − credit notes = true net | `netAfterReturns()`, `compareByDim()`, `compareSummary()`, all monthly **charts**, all YoY **charts**, Sales Register "Net Revenue" tile |

Because the **KPI cards** use Convention A but the **charts/YoY** use Convention B, the cards are inflated and **nothing reconciles to the charts.**

**Verified against the raw files:**

| | Gross (P) | Returns (R) | TRUE Net (P−R) | Card shows ("net") | Overstated by |
|---|---|---|---|---|---|
| **CY (sales.xls)** | ₹50,57,782.07 | ₹9,17,080.88 | **₹41,40,701.19** | ₹50,57,782.07 | **+22.15%** |
| **PY (previous_sales.xls)** | ₹2,16,14,845.77 | ₹28,11,319.32 | **₹1,88,03,526.45** | ₹2,16,14,845.77 | **+14.95%** |

> Directive (confirmed): **every KPI must use TRUE net = Gross − Credit Notes**, with credit notes netted in the period of their own date.

### Bug 2 — ABM/MSR revenue ≠ total CY sales
`cleanMSR()` (line 1989) **drops every sales customer not found in `msr.xlsx`** (`if (!entry…) continue;`). So ABM/MSR slides only ever see a *subset* of sales and can never tie to the company total.

**Verified:** of CY true-net ₹41,40,701, **₹40,26,294 (97.2%) is mapped** to an MSR/ABM and **₹1,14,407 (2.8%) is unmapped** and silently disappears from Slides 7 & 8.

> Directive (confirmed): add an explicit **"Unassigned"** ABM/MSR bucket holding all unmapped customers, so **Σ(ABM net) + Unassigned = CY total net** exactly. Keep the equal-split rule for customers shared by multiple MSRs (no double counting). Keep the current return-flag rule.

---

## 1. The canonical metric layer (single source of truth)

Define these **four** quantities once and use them **everywhere**. All "money" KPIs derive from them.

For any row set `R`:

```
GROSS    = Σ over R of (sales_value where NOT is_return)            // positive sales only
RETURNS  = Σ over R of (|sales_value| where is_return)              // credit notes, as a positive number
NET      = Σ over R of (is_return ? -|sales_value| : sales_value)   // = GROSS - RETURNS  (the headline metric)
RET_RATE = RETURNS / GROSS                                          // returns as % of gross  (NOT /(GROSS+RETURNS))
```

Rules that follow and must hold dashboard-wide:

1. **Anything labelled "Net", "Revenue", "Sales", or fed into growth/YoY/MoM = NET.** Never Convention A.
2. **`GROSS` means positive sales only** (`P`). The current `gross = net + ret` (which evaluates to `P + R`) is wrong on two counts and must be replaced — see §2.1.
3. **Return rate denominator = GROSS (`P`)**, not `P+R`. Current code uses `R/(P+R)` which slightly understates the rate. Standardise to `R/P`. (If you prefer to keep `R/(P+R)`, do it everywhere — but `R/P` is the standard "returns as % of sales".)
4. **Returns are period-of-their-own-date** (a May credit note hits May), which is automatic once NET is a signed sum — no bill-matching.
5. **`is_return` rule is unchanged:** `sales_value < 0 || qty < 0 || /^z/i.test(bill_no)` (line 1957). Keep as-is.

---

## 2. Central helper changes (fix these and ~80% of cards self-correct)

### 2.1 `summarize(rows)` — line 1383  ⟶ **CHANGE**
Current:
```javascript
const net = sum(rows.filter(r => !r.is_return), r => r.sales_value);   // = P (WRONG: gross)
const ret = sum(rows.filter(r => r.is_return), r => Math.abs(r.sales_value));
return { net, ret, gross: net + ret, retPct: safePct(ret, net + ret), ... };
```
Corrected:
```javascript
const gross = sum(rows.filter(r => !r.is_return), r => r.sales_value);  // P
const ret   = sum(rows.filter(r => r.is_return),  r => Math.abs(r.sales_value)); // R
const net   = gross - ret;                                              // P - R  (TRUE net)
return {
  net, ret, gross,
  retPct: safePct(ret, gross),    // R / P
  qty, bills, custs, prods        // unchanged
};
```
> Note: `gross` now = `P` (was `P+R`). Every consumer of `s.gross` must be re-read — see §3 (avg-bill uses it).

### 2.2 `monthBuckets(rows)` — line 1353  ⟶ **CHANGE**
Current line 1360 only accumulates positive rows into `net`; `gross` becomes `net+ret`.
Corrected per bucket:
```javascript
if (r.is_return) b.ret += Math.abs(r.sales_value);
else            b.gross_pos += r.sales_value;
// on emit:
net   = b.gross_pos - b.ret;     // signed monthly net
gross = b.gross_pos;             // P for the month
retPct = safePct(b.ret, b.gross_pos);
```
This makes `monthBuckets[i].net` **identical** to the monthly chart bars (which already use signed) — so Slide 2 strip and the Slide 2 chart finally agree.

### 2.3 `productStats(rows)` — line 2132  ⟶ **CHANGE**
Line 2137 `net = sum(!is_return)`. Replace with `net = netAfterReturns(list)` (= P−R per product). Keep `ret` as the positive return sum, `gross = P`, `retPct = ret/gross`. `latest`/`prior`/`growth` already signed (lines 2142-2144) — **no change**. `dep` (customer dependency, line 2145) uses `net` as denominator → it will now divide by the smaller true-net; that is correct, but guard `net>0` (already implicit). Products whose returns exceed sales now show **negative net** — intended.

### 2.4 `msrStats(rows)` — line 2154  ⟶ **CHANGE**
Same single change: line 2159 `net = netAfterReturns(list)`. `latest/prior/growth` already signed. `retPct = ret/gross`.

### 2.5 `abmStats(rows, hasDoc)` — line 2228  ⟶ **CHANGE**
Same single change: line 2251 `net = netAfterReturns(list)`. Everything else (latest/prior/growth/score parts) already signed or score-based; **no other change**. The composite `score` (lines 2264-2268) is unaffected because it uses `growth` (already signed) and ratio metrics.

### 2.6 `cleanMSR()` — line 1989  ⟶ **CHANGE (Bug 2 — Unassigned bucket)**
Currently unmapped customers `continue` (line 1995) and vanish. Replace the skip with a fallthrough that emits **one** row tagged Unassigned, so totals reconcile:
```javascript
for (const sale of salesRows) {
  let entry = lookup.get(norm(sale.customer))
           || lookup._entries.find(e => { const a=norm(sale.customer), b=norm(e.name);
                                          return b && (a.includes(b)||b.includes(a)); });
  if (!entry || !entry.msrs.length) {
    // NEW: keep the sale, attribute to Unassigned (full value, no split)
    out.push({ sale_id:sale.sale_id, msr:'Unassigned', abm:'Unassigned',
               customer:sale.customer, product_name:sale.product_name,
               station:sale.station, state:'', date:sale.date, date_str:sale.date_str,
               sales_value:sale.sales_value, qty:sale.qty,
               is_return:sale.is_return, bill_no:sale.bill_no,
               fy:sale.fy, fy_month_idx:sale.fy_month_idx });
    continue;
  }
  const share = entry.msrs.length;                 // equal split — UNCHANGED
  for (const msr of entry.msrs) {
    out.push({ ...as today..., sales_value: sale.sales_value/share, qty: sale.qty/share });
  }
}
```
**Invariant after this change:** `Σ netAfterReturns(FSMSR) === Σ netAfterReturns(FS)` for any identical filter. The equal-split preserves per-sale totals; the Unassigned bucket recovers the 2.8% gap. The existing `(r.abm||'Unassigned')` guards in `abmStats`/`targetingByAbm` already render this bucket — it will now simply carry real revenue.

> Apply the **same** Unassigned fallthrough to `FPREVMSR` (previous-year MSR build) so YoY on Slides 7/8 also reconciles.

### 2.7 Customer & territory inline rankings ⟶ **CHANGE**
These bypass the stats helpers and re-implement Convention A:
- `renderCustomerBase()` line 3127-3128: `groupRows(FS.filter(!is_return))` then `sum(sales_value)`. **Change** to net: group all rows, value = `netAfterReturns(list)`. (Top-customer bars, Pareto, top-10 share all then reflect net.)
- `renderTerritoryMap()` line 3356: `net = sum(!is_return)`. **Change** to `net = netAfterReturns(l)`; keep the `net<=0` skip but be aware a heavily-returned territory may now drop — that is correct, or relax to `gross>0` if you want to still list it. (Decision: keep `net>0` filter.)
- `renderRisksActions()` & any other slide that re-derives `byC = groupRows(FS.filter(!is_return))` (grep `filter(r ?=> ?!r.is_return)`): convert to net the same way **unless** the intent is explicitly "gross/returns split" (e.g. the returns-by-product list, which *should* stay returns-only).

---

## 3. KPI-by-KPI catalogue (every tile / chart, by slide)

Legend: **KEEP** = logic already correct · **FIX** = must change · formula shown is the corrected one.

### Slide 1 — Cover (`renderCover` 2523, `renderCoverYoYBand` 2624)
| KPI | Current logic | Verdict | Correct logic |
|---|---|---|---|
| **Net Revenue** (mega) | `summarize(FS).net` = P | **FIX** | `summarize(FS).net` = P−R (auto via §2.1). Sub-line "Latest month" uses `last.net` → also net via §2.2 |
| Growth (MoM) | `safeGrowth(last.net, prev.net)` on month buckets | **FIX**(by dependency) | same formula; inputs become net via §2.2. `((last−prev)/|prev|)×100` |
| Return Drag | `s.retPct` = R/(P+R); sub shows `s.ret`, credit-note count | **FIX** | `retPct = R/P` (§2.1). `s.ret` & count unchanged |
| Doctor Coverage | `activeDoctorCount()/totalDocs` | KEEP | count-based, no revenue. (Optional: `activeDoctorCount` line 2285 ignores `is_return` — fine, it's presence-based) |
| Active MSRs / Customers (fallback mega) | unique counts | KEEP | counts only |
| Bills Raised | `uniq(bill_no)` | KEEP | |
| **Avg Bill Value** | `s.gross / s.bills` where gross was P+R | **FIX** | Decide numerator. Recommended **Net per bill** = `s.net / s.bills`. (If you want gross-per-bill use new `s.gross`=P.) Do **not** use old P+R |
| Active SKUs / Customers / Territories | unique counts | KEEP | |
| **Cur FY Net (comp)** | `summarize(FS_CUR_COMP).net` = P | **FIX** | P−R (auto) |
| **YoY Net Δ** | `sCur.net − sPrev.net` | **FIX** | now net−net (auto). Value & tone follow |
| **YoY Growth** | `safeGrowth(sCur.net, sPrev.net)` | **FIX** | net-based (auto) |
| Customer Retention | `retained/prevCusts` (set membership) | KEEP | presence-based; not revenue |

### Slide 2 — Revenue Momentum (`renderMomentum` 2664)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| Latest Month | `last.net` (bucket, P) | **FIX** | net bucket (§2.2) |
| Best Month | `sortBy(buckets, net)[0]` | **FIX** | sort by net bucket; max P−R month |
| Worst Month | min net bucket | **FIX** | min P−R month (still includes negatives — keep v7 fix) |
| Monthly Average | `Σ bucket.net / months` | **FIX** | average of net buckets |
| total return (sub) | `Σ|ret|` | KEEP | returns figure |
| Momentum pill `Return %` | `R/(P+R)` | **FIX** | `R/P` |
| YoY band (Cur/Prev/Δ/Best-Worst) | `summarize(comp).net`, `fiscalMonthCompare` | **FIX**(cards via §2.1) / KEEP(chart already signed) | tiles net-based; chart unchanged |
| Momentum chart (bars/returns/YoY line) | signed (lines 2744-2763) | KEEP | already correct; now **matches** the strip |

### Slide 3 — Growth Story (`renderGrowthStory` 2798)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| Latest Month Net | `last.net` bucket | **FIX** | net bucket |
| MoM Δ Value | `last.net − prev.net` | **FIX** | net buckets |
| Accelerating / Declining SKUs | `growthByDim(FS,'product_name')` signed | KEEP | already signed (lines 1407-1408) |
| new / lost prods | prior/latest signed | KEEP | |
| YoY band | `summarize(comp).net`, `compareByDim` | **FIX**(tiles)/KEEP(spread) | tiles net via §2.1 |
| **Revenue Bridge** (`buildRevenueBridge` 1504) | all SKU/customer sums signed (`sign = is_return?-1:1`) | KEEP | already net-correct. Bars Prev/Cur Net = signed totals |
| Growth Attribution (`buildGrowthAttribution` 1549) | signed | KEEP | net-correct |

### Slide 4 — Product Portfolio (`renderProductPortfolio` 2888)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| Active SKUs (`p.net>0`) | `productStats` net=P | **FIX** | net=P−R (§2.3); a SKU net-negative from returns now excluded from "active" — correct |
| Total / Top1 share / Top10 share | `Σ p.net`, `p.net` | **FIX** | net-based shares (auto via §2.3) |
| High-return SKUs (`retPct>5`) | `R/(P+R)` per product | **FIX** | `R/P` per product (§2.3) |
| Top-10 bar, treemap, Pareto | `p.net` | **FIX**(values)/KEEP(logic) | net values (auto) |
| Product YoY lens (`renderProductYoYInner` 3031) | check: uses comparable signed | KEEP if signed | verify it uses `compareByDim`/signed; if it calls `summarize().net` for a tile, FIX |

### Slide 5 — Customer Base (`renderCustomerBase` 3125)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| Active Customers | count | KEEP | |
| Avg bill (sub) | `s.gross/s.bills` (P+R) | **FIX** | `s.net/s.bills` (or new gross=P) |
| Top 10 / Top 5 Share | ranking on `sum(!is_return)` = P | **FIX** | rank & share on net (§2.7) |
| Repeat Customers | `bills>1` count | KEEP | |
| Top-customer bar / Pareto | P-based | **FIX** | net-based (§2.7) |
| Customer × Product combo table — Net Revenue col | `b.net` from `!is_return` (line 3224-3225) | **FIX** | accumulate signed: `b.net += is_return?-|sv|:sv` |
| combo YoY Δ / % | signed (lines 3239-3245) | KEEP | |
| Customer YoY band | `summarize(comp).net`, `compareByDim` | **FIX**(tiles)/KEEP | tiles net via §2.1 |
| Growth Attribution donut | signed | KEEP | |

### Slide 6 — Territory Map (`renderTerritoryMap` 3351)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| Active Territories (`net>0`) | `sum(!is_return)` | **FIX** | net=P−R per station (§2.7) |
| Top Territory Share | `top1.net/totalNet` on P | **FIX** | net-based |
| Growing / Declining (`growth ±5%`) | `growthByDim(FS,'station')` signed | KEEP | already signed |
| retPct per territory | `R/(P+R)` | **FIX** | `R/P` |
| Region YoY band/chart | comparable signed / `summarize` tiles | **FIX**(tiles)/KEEP(chart) | |

### Slide 7 — ABM Team (`renderABMTeam` 3495)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| **[Month] Revenue** (latest) | `sum(FSMSR month==latest & !is_return → sv)` (line 3517) = P for month | **FIX** | net for month: `sum(... → is_return?-|sv|:sv)` |
| FY Revenue (to date) | `Σ abmStats.net` = P (subset) | **FIX (both bugs)** | net via §2.5 **and** now includes Unassigned via §2.6 → ties to CY |
| Avg per ABM | `totalNet / #ABMs` | **FIX** | net total / ABM count (Unassigned counts as one bucket — decide whether to exclude it from "per ABM" averages; recommend **exclude 'Unassigned'** from Top-ABM and Avg-per-ABM, but **include** it in FY Revenue total) |
| Top ABM | `sortBy(score)[0]` / shows `top.net` | **FIX** | net via §2.5; exclude 'Unassigned' from Top |
| Growing Teams | `growth>0` count (signed) | KEEP | |
| **Prior Month** | `sum(... & !is_return)` (line 3518) = P | **FIX** | net for prior month (signed) |
| ABM Revenue bar (latest vs prior) | `s.latest/s.prior` signed (§2.5) | KEEP | already net |
| ABM MoM growth bar | `s.growth` signed | KEEP | |
| Scorecard: Net Rev | `s.net`=P | **FIX** | net (§2.5) |
| Scorecard: MoM% / Cov% / Targ% / Strat / Ret% | signed growth; ratios; `R/(P+R)` | **FIX** Ret% only → `R/P`; others KEEP | |
| Composite Score (35/30/25/10) | uses signed growth + ratios | KEEP | unaffected |

> **Reconciliation tie-out for Slide 7:** after fixes, `FY Revenue (to date)` tile **must equal** Slide 1 `Cur FY Net` for the same filter (both = CY net incl. Unassigned). Add this as a test.

### Slide 8 — MSR Performance (`renderMSRPerformance` 3653)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| [Month] Revenue (latest) | `sum(!is_return)` month (line 3673) = P | **FIX** | net for month |
| FY Revenue (to date) | `Σ msrStats.net` = P (subset) | **FIX (both bugs)** | net (§2.4) + Unassigned (§2.6) |
| Avg per MSR | `totalNet/activeMSRs` | **FIX** | net / active (exclude 'Unassigned' from rep count & Top) |
| Top MSR | `sortBy(net)[0]` | **FIX** | net; exclude Unassigned |
| Targeting Fit / Customers Covered | `targetingEffectiveness` (signed, line 2181 uses `+= sales_value` but skips returns at 2175) | **REVIEW** | `targetingEffectiveness` (2172) accumulates `bucket.total += sales_value` over `!is_return` rows = gross. For a *ratio* (hit/total) gross-vs-net barely matters, but for consistency change `total`/`hit` to signed net. Low priority; flag it |
| Prior Month | `sum(!is_return)` = P | **FIX** | net for prior month |
| MSR sales chart / trend / YoY | check each: bars should be net | **FIX** any that read `!is_return`; KEEP signed ones |

### Slide 9 — Doctor Universe (`renderDoctorUniverse` 3964)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| Revenue-bearing tiles (`s = summarize(FS)`, line ~4105) | P | **FIX** | net via §2.1 |
| customer ranking `byC = groupRows(!is_return)` (~4108) | P | **FIX** | net (§2.7) |
| On-strategy revenue (`onCur/onPrev`, lines ~4344) | signed (`is_return?-1:1`) | KEEP | net-correct |
| Coverage / active-doctor / HQ-EX (`hqExCoverage` 2294) | revenue weights use `!is_return` (gross) | **REVIEW** | these are coverage ratios weighted by revenue; switch the revenue weights to net for consistency (low impact) |
| Doctor counts / categories | counts | KEEP | |

### Slide 10 — Risks & Actions (`renderRisksActions` 4104)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| `s = summarize(FS)` tiles | P / `R/(P+R)` | **FIX** | net + `R/P` (§2.1) |
| Return Rate tile | `s.retPct` | **FIX** | `R/P` |
| High-return SKU count | `p.retPct>5` | **FIX** | `R/P` per product |
| customer concentration `byC` | P ranking | **FIX** | net (§2.7) |
| **Returns-by-product list** (`groupRows(FS.filter(is_return))`, line ~4225) | returns-only `Σ|sv|` | **KEEP** | this is *meant* to be returns; do **not** net it |
| Risk signal thresholds | derived from above | **FIX**(by dependency) | recompute on corrected net |

### Slide 11 — YoY Analysis Center (`renderYoYCommandCenter` 4395, content 4422)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| `totalCur = sum(FS_CUR_COMP, signed)` (line ~4419) | signed | KEEP | already net |
| Momentum Quadrant (`buildProductMomentumQuadrant`/`renderProductMomentumQuadrant` 1644) | verify uses `compareByDim` (signed) | KEEP if signed | X=PY net, Y=YoY%, size=CY net — must be signed both sides |
| Top 5 Gainers / Losers | `compareByDim` deltas signed | KEEP | |
| Product Winners & Leaks | signed deltas | KEEP | |
| Boardroom Signals (`buildYoYSignalsV2`) | derived | **FIX**(by dependency) | ensure inputs are net |
| Velocity Radar (`renderVelocityRadar` 4521, `totalCur/totalPrev` signed line ~4601) | signed | KEEP | |

### Slide 12 — Sales Register (`renderSalesRegister` 4727)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| **Net Revenue** tile | `netAfterReturns(rows)` (line ~4746) | **KEEP** ✅ | this is the *reference* correct implementation |
| Return Drag | `summarize(rows).retPct` = R/(P+R) | **FIX** | `R/P` |
| per-row Sales Value / Type | raw signed | KEEP | |
| YoY map (curMap/prevMap, lines ~4684-4685) | signed | KEEP | |

### Slide 13 — Field Force Register (`renderFieldRegister` 4918)
| KPI | Current | Verdict | Correct |
|---|---|---|---|
| `net_value = is_return ? -|sv| : sv` (line ~4937) | signed | **KEEP** ✅ | already net per row |
| Export Net_Value | signed | KEEP | |
| Any footer/total (if present) | verify | FIX if it sums `!is_return` | use `Σ net_value` |

---

## 4. Reconciliation invariants (must all hold after the fix)

Bake these into the test checklist; they are the definition of "everything ties up":

1. **Net identity:** for any filter, `summarize(R).net === sum(R, signed) === GROSS − RETURNS`.
2. **Card = chart:** Slide 2 strip "Latest Month" === last bar of Slide 2 chart === `monthBuckets` last `net`.
3. **Slide-1 = Slide-7 = Slide-8 FY totals:** `Cover Cur-FY-Net (full period, unfiltered)` === `Σ ABM net (incl Unassigned)` === `Σ MSR net (incl Unassigned)`. Target with current data (full CY, no filter): **₹41,40,701.19**.
4. **ABM coverage:** `Σ ABM net (excl Unassigned)` = ₹40,26,294 (97.2%); `Unassigned` = ₹1,14,407 (2.8%).
5. **No double count:** multi-MSR customers split equally, so `Σ MSR net === Σ ABM net === CY net`.
6. **YoY tiles = YoY charts:** every "Cur FY Net" / "Prev FY Net" tile equals the summed comparable-period bars on the same slide.
7. **Returns sign:** `RETURNS ≥ 0` always; `NET` may be negative for a small slice (product/territory/month) and that must render, not be clamped (except the deliberate `net>0` "active" filters).

---

## 5. Implementation order (lowest-risk first)

1. **§2.1 `summarize`** + **§2.2 `monthBuckets`** → fixes Slides 1,2,3,5,10,12 cards in one shot. Re-grep every `s.gross` use (avg-bill) and fix numerator.
2. **§2.3/2.4/2.5 stats helpers** (`net = netAfterReturns(list)`) → fixes Slides 4,7,8 values.
3. **§2.7 inline rankings** (customer, territory, combo table, risk concentration) → net.
4. **Return rate** everywhere → `R/P` (search `safePct(.*ret.*net.*ret)` and `retPct`).
5. **§2.6 `cleanMSR` Unassigned bucket** (and the PY MSR build) → Bug 2 reconciliation.
6. Run §4 invariants. Then spot-check the numbers in §0 tables.

---

## 6. Edge cases & gotchas for the implementer

- **`gross` semantics flipped:** old `gross = P+R`, new `gross = P`. Anything reading `.gross` (notably **avg bill value**, Slides 1 & 5) changes meaning — set it explicitly to net-per-bill or gross(P)-per-bill, don't leave it ambiguous.
- **Negative net products/territories:** with returns netted, items whose returns exceed sales go negative. Sort/scale code using `Math.log` or assuming positives must tolerate ≤0 (Pareto, treemap `values:[total,...]`). Treemap especially breaks on negatives — filter to `net>0` for the treemap **only**, while totals stay full net.
- **`safeGrowth` with negative base:** `((cur−prev)/|prev|)×100` — confirm `safeGrowth` uses `|prev|` (it appears to). A prev of 0 with cur>0 should read "new", not ∞.
- **Unassigned in averages:** include Unassigned in **totals** (so they reconcile) but **exclude** it from "Top ABM/MSR", "Avg per ABM/MSR", and "Growing teams" so a catch-all bucket doesn't masquerade as a person. Make this explicit.
- **`targetingEffectiveness`/`hqExCoverage`/coverage** weight revenue by gross today; converting to net is correct-for-consistency but low-impact (they're ratios). Flagged, not blocking.
- **Returns-only lists stay returns-only** (Slide 10 returns-by-product, credit-note counts). Don't net these — they are intentionally `Σ|sv|` over `is_return` rows.
- **Both files reconcile independently:** apply identical logic to `D/FS` (CY) and `DPREV/FPREV` (PY), and to `DMSR/FSMSR` and `DMSR_PREV/FPREVMSR`.

---

## 7. Quick reference — corrected numbers (full period, unfiltered)

| Metric | CY (FY26-27, Apr–May'26) | PY (FY25-26) |
|---|---|---|
| Gross (P) | ₹50,57,782.07 | ₹2,16,14,845.77 |
| Returns (R) | ₹9,17,080.88 | ₹28,11,319.32 |
| **Net (P−R)** ← headline | **₹41,40,701.19** | **₹1,88,03,526.45** |
| Return rate (R/P) | 18.13% | 13.01% |
| ABM/MSR mapped net | ₹40,26,294.26 (97.2%) | — |
| Unassigned net | ₹1,14,406.93 (2.8%) | — |

> If, after implementing, the Slide-1 "Net Revenue" tile does not read **₹41,40,701** on the unfiltered CY view, the fix is incomplete. Return rate shown should be ~18% (R/P), or ~15.4% if you keep the R/(P+R) convention — pick one and apply globally.
