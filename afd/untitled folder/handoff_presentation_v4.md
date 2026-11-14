# PharmaBoard · Presentation Dashboard — Handoff v4

**File:** `dashboard_presentation.html`
**Predecessor:** `handoff_presentation_v3.md` (v7 build — Sprint A/B: filter overhaul, ABM/MSR propagation, Slide 13)
**Backup of pre-patch file:** `dashboard_presentation.BACKUP.html`
**Companion spec:** `KPI_LOGIC_FIX_PLAN.md` (the full KPI-by-KPI audit this patch implements)
**Owner:** Adi (goenka.aditya.kol@gmail.com)

This document covers **Sprint C (v7 → v8)** — a *logic-correctness* patch. **No UI / layout / styling changed.** Only the underlying calculations were corrected.

---

## 1. Why this patch exists (two bugs)

### Bug 1 — "Net" was not net of credit notes
The dashboard carried two conflicting definitions of "net":
- **Convention A** (`sum of rows where !is_return`) = gross sales with returns simply *dropped*, not subtracted. Used by every KPI **card**.
- **Convention B** (`is_return ? -|sv| : sv`) = true net of returns. Used by the **charts** and YoY bands.

So cards were inflated and never reconciled to the charts beneath them. Measured on the real files:

| | Gross (P) | Returns (R) | TRUE Net (P−R) | Card showed | Overstated |
|---|---|---|---|---|---|
| CY (sales.xls) | ₹50,57,782.07 | ₹9,17,080.88 | **₹41,40,701.19** | ₹50,57,782.07 | **+22.15%** |
| PY (previous_sales.xls) | ₹2,16,14,845.77 | ₹28,11,319.32 | **₹1,88,03,526.45** | ₹2,16,14,845.77 | **+14.95%** |

### Bug 2 — ABM/MSR revenue did not tie to total sales
`cleanMSR()` dropped every customer not found in `msr.xlsx`, so Slides 7 & 8 only ever showed a subset (~97.2%) of sales and could never reconcile to the company total. The missing **₹1,14,407 (2.8%)** belonged to unmapped customers.

---

## 2. Decisions taken (locked with Adi)

| Decision | Choice |
|---|---|
| Net = Gross − Returns | Yes, dashboard-wide |
| Return timing | Period of the credit note's **own date** (automatic once net is a signed sum) |
| ABM/MSR reconciliation | Add an explicit **"Unassigned"** bucket for unmapped customers → `Σ ABM net + Unassigned = CY net` exactly |
| Multi-MSR customer | **Equal split** retained (no double counting) |
| Return-flag rule | **Unchanged** — `sv < 0 \|\| qty < 0 \|\| /^z/i.test(bill_no)` |
| Return rate denominator | Standardised to **R / Gross** |

---

## 3. The canonical metric layer (single source of truth)

For any row set `R`:

```
GROSS    = Σ (sales_value where NOT is_return)            // positive sales, P
RETURNS  = Σ (|sales_value| where is_return)              // credit notes, R (positive)
NET      = GROSS - RETURNS  =  Σ (is_return ? -|sv| : sv) // headline metric, P - R
RET_RATE = RETURNS / GROSS                                // R / P
```

Key implementation nicety: because `NET = GROSS − RETURNS`, the expression `NET + RETURNS` now equals `GROSS`. So every pre-existing `retPct: safePct(ret, net + ret)` **auto-corrected to R/P with no edit** once `net` was redefined.

---

## 4. What changed in code (v7 → v8)

### 4.1 Core helpers

| Function | Line (approx) | Change |
|---|---|---|
| `summarize(rows)` | ~1383 | `gross = Σ(!is_return)`, `ret = Σ|return|`, **`net = gross − ret`**; `retPct = safePct(ret, gross)`. `gross` field now = **P** (was P+R) |
| `monthBuckets(rows)` | ~1353 | Accumulator renamed `net`→`gross` (positive rows). Emits `net = gross − ret`, `gross = gross`, `retPct = ret/gross`. Monthly `net` now **identical to the chart bars** |
| `productStats(rows)` | ~2137 | `net = netAfterReturns(list)` (was Σ non-return) |
| `msrStats(rows)` | ~2159 | `net = netAfterReturns(list)` |
| `abmStats(rows)` | ~2251 | `net = netAfterReturns(list)`. Composite score unaffected (uses signed growth + ratios) |
| `cleanMSR()` | ~1992 | **Unassigned bucket** — unmapped customers are no longer skipped; they're pushed at full value with `msr='Unassigned', abm='Unassigned'`. Mapped customers still split equally. Applies to **both** `DMSR` and `DMSR_PREV` |

### 4.2 Slide-level fixes (inline rankings & tiles)

| Location | Line (approx) | Change |
|---|---|---|
| `renderCover` — avg bill value | ~2604 | `s.gross/s.bills` → `s.net/s.bills` |
| `renderCustomerBase` — avg bill | ~3137 | `s.gross/s.bills` → `s.net/s.bills` |
| `renderMomentum` — return pill | ~2710 | `safePct(totalRet, totalNet+totalRet)` → `safePct(totalRet, totalNet)` (R/P) |
| `renderMomentumChart` — monthly ret% | ~2762 | `safePct(b.ret, b.net+b.ret)` → `safePct(b.ret, b.net)` (R/P) |
| `renderCustomerBase` — customer ranking | ~3127 | Group **all** rows; value `= netAfterReturns(l)` (was Σ non-return) |
| `renderCustomerBase` — customer×product combo | ~3224 | `b.net` now accumulates signed (`is_return ? -|sv| : sv`) |
| `renderTerritoryMap` — territory ranking | ~3356 | `net = netAfterReturns(l)`; keeps the `net<=0` skip |
| `renderABMTeam` — latest/prior month tiles | ~3517 | Month revenue now signed (net of returns) |
| `renderMSRPerformance` — latest/prior month tiles | ~3673 | Month revenue now signed (net of returns) |
| `renderRisksActions` — top-5 concentration | ~4107 | Customer ranking → `netAfterReturns(l)` |
| `buildActions` — protect/concentration | ~4196 | Customer ranking → `netAfterReturns(l)` |

### 4.3 Deliberately left as GROSS (correct as-is)

These four `!is_return` sites are intentional and were **not** changed:
- `summarize` gross definition itself (P).
- `productStats` customer-dependency `byCust` (largest single-customer gross).
- `activeStations` set in coverage logic (presence detection, not revenue).
- `renderMomentum` `totalNet` local — it is the **gross** denominator for the return-rate pill.

### 4.4 Already-correct (no change needed)
Slide 12 Sales Register "Net Revenue" (`netAfterReturns`), Slide 13 Field Register `net_value`, Revenue Bridge, Growth Attribution, all YoY **charts**, `compareByDim`/`compareSummary`, Product Momentum Quadrant, Velocity Radar — these already used signed net.

### 4.5 Flagged but not changed (low impact)
`targetingEffectiveness`, `targetingByAbm`, `hqExCoverage` weight revenue by gross. They are **ratios** (hit/total), so gross-vs-net barely moves them. Convert later for full consistency if desired.

---

## 5. Reconciliation invariants (now hold)

1. `summarize(R).net === Σ(R signed) === GROSS − RETURNS` for any filter.
2. **Card = chart:** Slide 2 "Latest Month" === last bar of Slide 2 chart === `monthBuckets` last `net`.
3. **Slide 1 = Slide 7 = Slide 8 FY totals** (unfiltered CY): **₹41,40,701.19**.
4. ABM mapped net = ₹40,26,294.26 (97.2%); Unassigned = ₹1,14,406.93 (2.8%).
5. No double count — multi-MSR equal split ⇒ `Σ MSR net === Σ ABM net === CY net`.

---

## 6. Verification performed

- `node --check` on the full inline script — **clean**.
- The actual edited `summarize` / `monthBuckets` / `netAfterReturns` run against test rows — net, gross, return-rate correct; **monthly nets sum exactly to the headline net**.
- Reconciliation against the real files: **Slide-1 CY Net ₹41,40,701.19 = Σ ABM/MSR net (mapped ₹40,26,294.26 + Unassigned ₹1,14,406.93)** — **exact tie-out**.

---

## 7. Testing checklist (Sprint C)

- [ ] Slide 1 "Net Revenue" reads **≈₹41.4L** (not ₹50.6L) on unfiltered CY.
- [ ] Slide 1 Return Drag ≈ **18%** (R/P), consistent with Slide 10 Return Rate.
- [ ] Slide 2 "Latest Month" tile == the last current-FY bar in the chart.
- [ ] Slide 7 "FY Revenue (to date)" == Slide 1 "Cur FY Net" for the same filter.
- [ ] Slide 7/8 show an **"Unassigned"** ABM/MSR row carrying ~₹1.14L.
- [ ] `Σ ABM net (incl Unassigned)` == CY net.
- [ ] Customer / territory / product rankings reflect net (heavily-returned items drop or go negative as appropriate).
- [ ] Treemap (Slide 4) still renders — it filters `net>0`; totals stay full net.
- [ ] Sales Register (Slide 12) "Net Revenue" unchanged (was already correct).

---

## 8. Known limitations / follow-ups

| Item | Status |
|---|---|
| `targetingEffectiveness` / `hqExCoverage` revenue weights | Still gross-weighted (ratios, low impact) — optional future cleanup |
| Negative-net items | Products/territories/months whose returns exceed sales now show **negative net** — intended; chart scales tolerate it (treemap filters `net>0` only) |
| "Unassigned" in averages | Included in **totals** (for reconciliation) but should be **excluded** from "Top ABM/MSR" and "Avg per ABM/MSR" displays — verify if a future sprint touches those tiles |
| `dashboard_presentation_codex.html` | Not patched — still on v7 Convention-A logic |

---

## 9. File map (updated)

| File | Role |
|---|---|
| `dashboard_presentation.html` | **Primary file — v8 (this document)** |
| `dashboard_presentation.BACKUP.html` | Pre-patch v7 snapshot (revert/diff source) |
| `KPI_LOGIC_FIX_PLAN.md` | Full KPI-by-KPI audit & corrected-logic spec |
| `handoff_presentation_v4.md` | **This document** |
| `handoff_presentation_v3.md` | v7 — Sprint A/B (filters, ABM/MSR propagation, Slide 13) |
| `handoff_presentation_v2.md` | v6 — FY engine, Revenue Bridge math, comparable-period semantics |
| `handoff_presentation_v1.md` | v5 — filter / cross-filter / lazy-render basics |
| `files/sales.xls` | Current FY sales (FY26-27, Apr–May 2026) |
| `files/previous_sales.xls` | Previous FY sales (FY25-26) |
| `files/msr.xlsx` | MSR + ABM mapping |
| `files/Doctor_Master.xlsx` | Doctor universe (optional) |
