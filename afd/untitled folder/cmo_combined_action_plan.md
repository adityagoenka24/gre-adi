# Two-CMO Synthesis & Combined Improvement Plan

**Inputs:** `cmo_review_self.md` (CMO1 — me) · `strategic_review_cmo.md` (CMO2)
**Target file:** `dashboard_strategic.html`
**Purpose:** Reconcile two independent reviews. Decide what ships, what's debated, what's added. Hand engineering a sequenced backlog.

---

## 1. Where we agree (4 items — ship these, no debate)

These four points were caught by both reviewers independently. That's the strongest possible signal — they're real and they're blocking. Implement first.

| # | Flaw | CMO2 fix | CMO1 view | Verdict |
|---|---|---|---|---|
| **1** | **Speciality Revenue Mix is fabricated** — proportionally allocates city revenue by doctor-headcount ratio (`renderSpecMix`, line 2322) | Replace with Brand Category Revenue Mix using a static DIVISIONS map, plus a separate Doctor Speciality Headcount chart | Same — A1 in my review. "Statistical fantasy" labelled as revenue is worse than no chart. | **Ship CMO2's solution.** Split into two honest charts. |
| **2** | **HQ vs EX Revenue Split is fabricated** — splits city revenue by HQ/EX doctor headcount (`renderHQEx`, line 2351) | Shift to Coverage & Adherence: Total Mapped vs Active Mapped Doctors in HQ vs EX, plus Strategy Adherence % | Same — A2 in my review. 100% of billing lands on HQ stockist by industry mechanic. | **Ship CMO2's solution.** Reframe as field coverage, not revenue split. |
| **3** | **MSR Composite Score normalizes against the top national rep** — punishes upcountry territories on the 40-point revenue term (line 2228) | Drop the revenue scale term. New score: Growth 35 + Targeting 25 + Coverage 25 + SKU Breadth 15 | Same — B1 in my review. Patna can never beat Mumbai on absolute scale; you destroy morale and analytical validity in one number. | **Ship CMO2's restructure, with one modification** — see §2.3 below. |
| **4** | **Fuzzy product matching is fragile** — "ECOXIB 60 MR" vs "ECOXIB60" misses (line 1589 `productTokenMatch`) | Build `cleanBrandKey()` normalizer — strips strengths/forms/punctuation, manual override map | Same — B5 in my review. | **Ship CMO2's code.** Regex + manual map is the right shape. |

These four together fix the dashboard's biggest credibility problems. CMO2's implementation backlog (Part 2 of `strategic_review_cmo.md`) is engineering-ready — accept it largely as-is.

---

## 2. Where we differ (and what I'd amend)

### 2.1 Therapeutic Division mapping — static dict vs ingested file

**CMO2's proposal:** Hardcode `DIVISIONS = { 'CARDIOLOGY': { brands: ['REDNIL'], ... }, ... }` in JS.

**My pushback:** Pragmatic for MVP, but creates code-gating for every new product. AFD will add SKUs, divisions will be renamed, the dev team will get pinged for every product master change. That's 6-month tech debt embedded on Day 1.

**Compromise:** Ship CMO2's dict as v1 (it unblocks the Spec Mix and HQ/EX rebuilds today), but add a TODO: in v2, externalize to either (a) a separate `product_division_map.csv` the user can upload alongside sales/MSR/doctor, or (b) a column added to the Doctor Master export. The static dict ships now; the externalization is a 1-sprint upgrade.

### 2.2 Therapeutic Division *filter* (CMO2 Backlog #2)

**Strong agreement.** I called this out as D7 in my review. Adding a `<select id="f-div">` next to the other filters is the right MVP. The mechanics CMO2 describes (filter sales rows by division brands, filter doctor rows by division specialities) are exactly right.

**Amendment:** When a Division filter is active, the entire dashboard should reflect division context — including a "Division Mode" pill in the topbar so a Cardio rep doesn't accidentally read company-wide numbers as their own.

### 2.3 New MSR Composite Score formula — disagreement on weighting

**CMO2's proposal:** Growth 35 + Targeting 25 + Coverage 25 + SKU Breadth 15. Growth capped at ±20%.

**My pushback:** 35% weight on growth is itself a fairness problem for *different* reasons than the original score. A rep in a saturated metro doing ₹1.2 Cr/month has diminishing-returns growth. A rep in a fresh territory doing ₹15 L/month can show 50% growth on a small base — and looks brilliant. The original score punished upcountry on scale; CMO2's score may punish mature territories on growth ceiling.

**SKU Breadth 15 is also arbitrary.** A rep selling 4 strategic priority SKUs deeply is BETTER than one selling 15 SKUs superficially. Breadth-for-its-own-sake encourages dilution.

**Counter-proposal — territory-fair AND lifecycle-aware:**

```
Growth velocity        → 30 pts  (capped at ±25%, normalize per Territory Maturity bucket — Mature / Growing / New)
Targeting effectiveness → 25 pts  (% revenue from mapped products — KEEP CMO2's)
Doctor coverage        → 25 pts  (active mapped doctors / total mapped — KEEP CMO2's)
Achievement vs Target  → 10 pts  (NEW — needs target file ingestion, see §3.2)
SKU breadth (strategic) → 10 pts  (count of STRATEGIC SKUs sold, not all SKUs — discourages dilution)
```

If target data isn't loaded, the 10 points redistribute to Growth (40) and Targeting (30). Score remains in 0-100 range.

### 2.4 Returns decomposition

CMO2 doesn't address returns at all. I called this out as B3 — return drag needs to be decomposed by reason (expiry / near-expiry / damage / scheme adjustment / sale-or-return). Adding this to the backlog.

### 2.5 T3M smoothing

CMO2 doesn't address MoM noise. I called this out as B4 — monthly comparisons are too noisy for headline KPIs in pharma. Adding T3M as supporting metric.

### 2.6 Insight & Decision card refactor

**Agreement on direction.** Both reviews call out that buildInsights/renderDecisions need rework. CMO2 wants them re-aligned to new brand categories and new score. I want them rewritten with pharma-specific verbs (POB, RCPA, CME, joint field day) and ranked by ₹ impact.

**Combined approach:** Rewrite buildInsights to (a) trigger from new categories, division filters, fair scores AND (b) rank by ₹ impact AND (c) use pharma-instrument language in the body text.

---

## 3. What CMO2 missed (gaps in their review)

CMO2's scope was tight: "pure-code engineering solutions on existing data files. No further client data required." That's a sensible boundary for a sprint, but it leaves out the strategic capabilities a CMO would actually demand. These are the gaps:

### 3.1 PRIMARY vs SECONDARY vs TERTIARY blindness (CMO1 D1)
The dashboard treats stockist primary billing as if it were demand. Indian pharma reality: it isn't. Without closing stock visibility, growth callouts are unverifiable. At minimum, ingest `CurBal` from SwilERP inventory export (it's mentioned in handoff v2) → Days of Inventory KPI, near-expiry % of closing stock.

### 3.2 No target-vs-achievement (CMO1 C2)
The conversation a CMO actually has is "what's our achievement?" — not "what's our growth?" Without target ingestion (MSR × Month × Target ₹), the dashboard answers the wrong question.

### 3.3 Outstanding / Receivables / DSO (CMO1 D2)
Mentioned as existing in SwilERP exports (handoff v2). Ignored by dashboard. Revenue without collection is balance-sheet fiction.

### 3.4 Schemes / Trade Discounts / Net Realization (CMO1 D3)
Gross-to-net in Indian pharma is 15-30%. The dashboard's "Net Revenue" is gross minus returns only. Margin reality is hidden.

### 3.5 MSR call metrics — Call Average, RCPA, DCR, POB, Tour Plan (CMO1 D5)
These are the universally tracked Indian pharma MSR KPIs. None are on screen. The dashboard's "MSR performance" is just revenue attribution.

### 3.6 ABM rollup layer (CMO1 D8)
Country → Region → Zone → ABM → MSR is the org. The dashboard goes Country → MSR with no ABM layer. National Sales Head will live in the ABM view; we don't have it.

### 3.7 Customer cohort / Stockist silent-churn (CMO1 D6)
No view of stockist lifecycle, no silent churn alert, no new-acquisition rate.

### 3.8 Tier validation for VIP/CORE/SUPER CORE (CMO1 C3)
The tier labels are taken on faith. If our VIPs aren't generating 4-5× of Cores, the classification is broken or the detailing isn't translating. The dashboard never asks this.

### 3.9 Visual overload on Pulse (CMO1 C4-C5)
22 visual blocks on Page 1. CMO scan time is 30 seconds. Need L1 / L2 / L3 disclosure pattern.

### 3.10 Top Customer × Product Heatmap is low-signal (CMO1 A3)
Replace with a ranked Top-20 customer×product *combos* table — strictly more actionable.

---

## 4. What I missed (gains from CMO2)

Fair credit — CMO2's review has things mine didn't:

- **Engineering-deep specificity.** The `cleanBrandKey()` regex, the DIVISIONS map structure, the exact line numbers to edit, the new score formula JS — those are ready to drop into a PR. My review was more strategic; CMO2's was more implementation-ready. Both are needed.
- **Pragmatic scoping.** CMO2 explicitly constrained themselves to "no new data files." That keeps Sprint 1 small and shippable. My review was wider but slower. Combining them sequences neatly: ship CMO2's pure-code fixes first (Sprint 1), layer in my data-ingestion additions next (Sprint 2-3).
- **The "auto-flag low EX Doctor Coverage" insight idea** (Backlog #6) — concrete and mechanical, would have surfaced under my D2/D5 group but CMO2 wrote it as a single triggerable insight rule. Adopt.

---

## 5. Combined Sprint Plan

Sequenced by impact-per-week. Each sprint is shippable on its own.

### Sprint 1 (Week 1-2) — The Four Non-Negotiables + Division Filter
*Pure code on existing data. CMO2's backlog largely as-written.*

1. **Canonical Brand Normalizer** — `cleanBrandKey()` per CMO2 §1. Refactor `buildDoctorIndex` and `targetingEffectiveness` to use it.
2. **Therapeutic Division Filter** — `<select id="f-div">` + DIVISIONS static dict + `applyF()` integration. Add "Division Mode" pill in topbar.
3. **Speciality Mix → Brand Category Revenue Mix + Doctor Speciality Headcount** — two separate charts. Delete the fabricated allocation.
4. **HQ vs EX → Coverage & Adherence** — drop revenue split. Show Active Mapped Doctors HQ vs EX + Strategy Adherence % line.
5. **Territory-Fair MSR Composite Score** — drop the `(net/maxNet)*40` term. Use modified formula from §2.3 (Growth 30 / Targeting 25 / Coverage 25 / Achievement 10 / Strategic SKU 10, with the 10-pt achievement bucket auto-redistributed if no target file).
6. **Refactor buildInsights and renderDecisions** — trigger from new categories, rank by ₹ impact, rewrite body text with pharma instruments (POB, CME, RCPA, joint field day, contract review).
7. **Kill the Top Customer × Product Heatmap** — replace with ranked Top-20 combos table.
8. **Speciality and city normalization tables** — strip nomenclature inconsistency. Add data-hygiene pill in topbar.

**Definition of done:** All four CMO2 flaws closed. Tier-fair scoring. Division filter live. Pulse decision cards use pharma language. Smoke test passes.

### Sprint 2 (Week 3-4) — The Data the CMO Actually Needs

9. **TARGETS file ingestion** (MSR × Month × Target ₹, optionally by Product) → Achievement % everywhere → activate the 10-pt achievement bucket in the score → "Gap-to-Target" KPI on Pulse hero.
10. **OUTSTANDING/RECEIVABLES file ingestion** (already in SwilERP per handoff v2) → new "Receivables" KPI strip or tab → DSO trend, aging buckets, top-10 overdues, Collected-Revenue %.
11. **INVENTORY/CLOSING STOCK ingestion** (CurBal from SwilERP) → Days of Inventory KPI, Inventory-to-Sales ratio per stockist, near-expiry % of closing stock.
12. **ABM rollup layer** — group MSRs by ABM, compute ABM-level scorecard. Add as a section in Field Force.

**Definition of done:** Achievement-vs-Plan is the headline KPI. CMO can see growth-vs-collection-vs-channel-inventory in one view. ABMs have their own scorecard.

### Sprint 3 (Week 5-6) — The Intelligence Layer

13. **Returns decomposition by reason code** — expiry / near-expiry / damage / scheme / sale-or-return as a stacked chart, with the expiry slice as its own KPI.
14. **T3M moving average** — alongside MoM on every growth metric. Pulse hero shows T3M as primary, MoM as secondary chip.
15. **Customer cohort / Silent churn widget** — new stockists this quarter, silent (no bill 60d), reactivated.
16. **Tier validation panel** — Revenue per VIP / Core / Super Core ratios by MSR. Flag inverted ratios.
17. **Visual hierarchy refactor for Pulse** — L1/L2/L3 disclosure pattern. 4 hero tiles + 3 ranked insights + 1 Decision of the Week visible on load; charts on scroll; full decision queue on click.
18. **Multi-dimensional cross-filter** — chained filters with chip stack.

### Sprint 4 (Future) — Strategic Capability (data-dependent)

19. **Market reference input** — manual benchmark per division for share-of-growth comparison.
20. **MSR call metrics ingestion** (Call Avg, RCPA, DCR, Tour Plan, POB) — if SFA tool feed is available.
21. **Sample / Promo cost ingestion** — sample-to-sale ROI per MSR/product/territory.
22. **Stockist-level secondary sales** — if AIOCD or stockist secondary feeds become available.
23. **Doctor digital engagement** — CMEs attended, sample requests, webinar views.

---

## 6. Working agreement between the two reviews

If we treat the two reviews as the brief: **CMO2 gives us the surgeon's plan for the next two weeks. CMO1 gives the architect's plan for the next two quarters.**

Neither alone is enough. CMO2 alone leaves the dashboard structurally fixed but commercially incomplete — the four fabrications are gone, but Indian pharma blindspots (closing stock, receivables, targets, schemes, call metrics) remain. CMO1 alone risks scope-creep paralysis — too many "we need a new file" asks before anything ships.

Sequenced together: Sprint 1 ships the credibility fixes. Sprint 2 ships the commercial substance. Sprint 3 ships the intelligence layer. Sprint 4 is the longer arc as data sources mature.

**Recommended next action:** kick off Sprint 1 with CMO2's backlog as the engineering doc, plus the amended composite-score formula and the kill-the-heatmap addition from this synthesis. Sprint 2 starts the day Sprint 1 ships, and is the conversation to have with AFD finance (for target/outstanding file pulls).

— *Synthesis by CMO1, against CMO2's review*
