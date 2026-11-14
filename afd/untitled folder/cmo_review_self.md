# Strategic Dashboard Review — CMO1 (Independent Audit)

**Reviewer voice:** 15-year veteran CMO / Chief of Sales & Marketing, mid-size Indian pharma company. Sat through too many QBRs where the dashboard said "growth" and the cash book said "overdue."

**File reviewed:** `dashboard_strategic.html` (active build, May 2026)
**Supporting docs read:** `Strategic_Brief.md`, `Presenter_Cheatsheet.md`, `pharmaboard_handoff_v3.md`
**Stance:** This is a well-designed tool. The visual hierarchy is genuinely premium. The team understands BI craft. But the *commercial* worldview behind the metrics is undercooked, and a few things on screen are mathematically dishonest. If I had to walk a board into this in its current form, I'd cover three or four numbers with my hand.

---

## TL;DR — the executive summary I'd send the team

The dashboard sees only PRIMARY billing and treats it as if it were truth. In Indian pharma, that is the original sin. Until we see closing stock, secondary off-take, schemes, receivables and target-achievement alongside this revenue, every "growth" callout could be hiding channel-stuffing, an unrecoverable receivable, or a scheme cost that wiped the margin. The Field Force tab — which the brief calls the "heart" of the deck — has two charts that are statistical fabrications (Speciality Mix and HQ vs EX). The MSR composite score punishes upcountry reps for not being Mumbai. And the decision cards lack the verbs we actually use in pharma — POB, RCPA, CME, DCR, joint field day. Fix four things and add five things and this becomes a genuinely senior tool.

---

## Category A — KILL THESE (do not fix, remove)

### A1. Speciality Revenue Mix (Field Force tab)
**The flaw.** The chart takes each city's stockist billing and apportions it to specialities based on the *headcount ratio* of doctors in that city. If Burdwan has 6 cardiologists and 4 GPs, 60% of Burdwan's billing becomes "cardio revenue." This is fiction dressed up as analysis. The stockist doesn't know which prescription drove which sale. The doctor master headcount has zero causal link to billing mix.

**Recommendation.** Delete the chart in its current form. Replace with two honest charts: (1) revenue by therapeutic *brand* category (Ortho/Cardio/GP — based on which product was billed), (2) doctor headcount distribution by speciality, shown separately. Don't fake the join.

### A2. HQ vs Extension Productivity (Field Force tab)
**The flaw.** Same fabrication. The code splits each city's revenue by the HQ/EX doctor-headcount ratio. The reality of Indian pharma is the opposite — 100% of ERP billing lands on the HQ stockist by definition because chemists in EX towns buy from HQ stockists. So this chart manufactures EX revenue that doesn't exist and then judges MSRs on it.

**Recommendation.** Kill the revenue split. Replace with field-coverage metrics: HQ Active Doctor % vs EX Active Doctor %, EX Strategy Adherence % (sales of mapped products in EX cities / total billing in those cities). That measures field activity honestly.

### A3. Top Customer × Product Heatmap (Growth Engine tab)
**The flaw.** A 15×12 grid of mostly near-empty cells with two or three dark navy squares. Looks impressive in a screenshot, but the ratio of ink to insight is awful. A CMO scanning this will look for ~30 seconds and move on.

**Recommendation.** Replace with a ranked Top 20 Customer-Product *combos* table — absolute revenue, MoM growth, returns flag, contract status. That's actionable. A heatmap with five hot cells is not.

### A4. Duplicate decision logic across tabs
Pulse has six "Strategic Decisions" cards. Field Force has the MSR Watchlist (Anchor/Untapped/Diversify/Performer). Territory has its own action table. Product has its own Role badges. Four sets of recommendations on the same data set — they will contradict each other and overload the reader.

**Recommendation.** One decision queue per dashboard load, ranked by ₹ impact, with a filter chip per tab. "Top 10 actions for this quarter" with type tags. Not four parallel recommendation engines.

---

## Category B — BROKEN LOGIC (fix the math)

### B1. The Composite MSR Score is unfair to upcountry reps
Formula (line 2228): `(net/maxNet)*40 + clamp((g+25)/50, 0, 1)*25 + (custs/maxCust)*15 + (prods/maxProd)*10 + (tpct/100)*10`.

Revenue scale gets 40% of the score and is normalized against the *country's #1* performer. A Patna rep handling a smaller geography can never structurally beat a Mumbai rep on that 40 points. They start a coaching conversation already labelled "warn (28)."

**Recommendation.** Split into two scores: a Scale Score (for capacity planning at HQ) and an Efficiency Score (for the rep's coaching review). Efficiency uses growth velocity, targeting effectiveness, doctor coverage in mapped cities, and achievement-vs-target (when target data lands). Never collapse scale and efficiency into one number that is shown to the rep.

### B2. "Doctor Coverage" definition is misleading
Code (`activeDoctorCount`): a doctor is "active" if there is any billing in their city. By that logic, in any city where the stockist had even one bill, *every* mapped doctor is "active." This metric overstates execution.

**Recommendation.** Tighten the definition. Active = a product *mapped to that doctor in the Doctor Master* was billed in their city during the period. This becomes a real beat-plan-adherence proxy. Today it's just geographic billing presence.

### B3. Return Drag is undecomposed
"Return Drag" as % of gross is the right idea, but treats every credit note the same. In pharma we care about which kind: (a) expiry, (b) near-expiry preemptive, (c) damage/breakage, (d) scheme/discount adjustment, (e) sale-or-return. Each has a different owner (Production, Supply Chain, Logistics, Marketing, Sales). 2% as a watch threshold is the generic FMCG number — pharma target is <1.5% net of scheme adjustments.

**Recommendation.** Decompose by reason code (most ERPs carry this). Lift expiry returns into its own KPI; that's the inventory-aging tell. Move the threshold to 1.5% with a tighter band.

### B4. "Growth (MoM)" as the headline KPI is naïve
Indian pharma months are noisy — month-end primary push, scheme months vs non-scheme months, holiday months, dealer credit-cycle months. Single MoM% can swing 15 points for non-business reasons.

**Recommendation.** Make the hero KPI a T3M (trailing 3-month) moving average growth. Keep MoM as a secondary chip. Or even better: T3M growth + MoM as a "vs trend" delta.

### B5. Targeting Effectiveness fuzzy match (also flagged by CMO2)
`productTokenMatch` uses first-two-word substring matching. "ECOXIB 60 MR TAB" vs "ECOXIB60" misses. "AFDICAL ADVANCE TAB" vs "AFDICAL" misses. So real on-strategy revenue gets marked off-strategy, the MSR looks worse than reality, and the chart's coaching implication is wrong.

**Recommendation.** Build a canonical brand normalizer that strips strengths (60, 90, 120), forms (TAB, CAP, INJ, MR, SR), and punctuation. Match on canonical key. Manual override map for known exceptions. (Match CMO2's `cleanBrandKey` proposal — engineering is sound.)

### B6. Concentration analysis is single-axis
The Pareto chart shows "Top 10 customers = X%" at the company level. But the dangerous concentrations are usually at the *product × MSR × customer* level. A product can be 90% from one buyer; an MSR's book can be 70% from one stockist.

**Recommendation.** Three concentration views: company (have), by product (have, in Product tab — link it), by MSR (missing — add). Show the worst-three concentration risks as an alert.

---

## Category C — MEDIOCRE (rework with pharma context)

### C1. Decision cards lack pharma verbs
"Protect [Customer X]" — but how, with what instrument? "Accelerate [Product Y]" — by doing what? In our industry the verbs are:
- **Protect:** credit-term renewal, exclusivity clause, joint stock-balancing visit, ABM relationship review
- **Accelerate:** lift POB (Plan of Business), CME / RTM sponsor, sample drop, detailing frequency change, beat-plan focus
- **Coach (MSR):** joint field day, RCPA audit, product-knowledge refresher, tour plan vs actual review
- **Realign:** beat plan reset, target-product priority refresh, division re-tagging

Rewrite the card bodies with these instruments. Right now they read like a generic BCG slide.

### C2. No target-vs-achievement (the biggest commercial blind spot)
There is no target/budget file ingestion anywhere. So "growth" is always vs Last Month or Last Year, never vs *Plan*. In our world the conversation is always "What's our achievement %?" first. A rep growing 8% in a territory where we budgeted 22% is *behind plan*, not "growing."

**Recommendation.** Add a Targets file ingestion (MSR × Month × Target ₹, optionally by product). Compute Achievement % as a primary KPI. Surface Gap-to-Target on Pulse hero. The Decision card should read "Patna territory at 62% of plan, gap ₹14L — joint visit week 2."

### C3. The VIP/CORE/SUPER CORE tiering is taken on faith
The Doctor Master labels are inherited as gospel. There is no check that a VIP doctor actually generates 4-5x of a Core or that a Super Core actually generates 8-10x. If the tiering doesn't hold up, the whole "portfolio pyramid" story collapses.

**Recommendation.** Add a "Tier Validation" panel — Revenue per VIP / per Core / per Super Core ratios, by MSR. If a rep's ratio is inverted (their Core doctors out-bill VIPs) — that's the conversation.

### C4. The 8 Intelligence Brief cards are too many
Executive scan time on Pulse is 30 seconds. Eight insight cards dilutes whatever is the actual #1 priority. Mid-deck I'd want one headline insight, two supporting, and a "show 5 more" disclosure.

**Recommendation.** Rank by ₹ impact (or by deterioration severity). Show top 3 by default. Move the rest under a disclosure.

### C5. Visual overload on Tab 1
Pulse currently shows: 4 hero tiles + 8 insight cards + 4 large charts + 6 decision cards = 22 visual blocks. That's two screens of vertical scroll on a 14" laptop. CMO needs an L1 view that fits one screen.

**Recommendation.** Restructure as: L1 (visible on load) = 4 hero tiles + 3 ranked insights + 1 "Decision of the Week." L2 (scroll) = charts. L3 (click to expand) = full decision queue.

### C6. Speciality / city naming hygiene
The Doctor Master speciality field has "Cardiologist" / "Cardiology" / "CARDIO" as three different categories. The City field has "BAGDAH" vs "Bagdah, North 24 Parganas." These get treated as different keys throughout.

**Recommendation.** Add normalization tables — speciality canonical map and city/station canonical map. Surface a "data hygiene" pill in the topbar when unmatched ratios exceed 10%.

### C7. Single cross-filter only
Click a bar = whole dashboard locks to that one filter. Can't chain (e.g., MSR Arnab + Product Ecoxib). In live analysis I want to drill on two dimensions together.

**Recommendation.** Multi-dimensional cross-filter — clicked filters compose, with a chip stack at the top showing active filters and individual ✕ to clear each.

---

## Category D — MISSING (what a real CMO would demand)

### D1. PRIMARY vs SECONDARY vs TERTIARY (the biggest miss)
The dashboard sees only PRIMARY (our billing to stockists). It is blind to:
- **Secondary** — stockist's billing to chemists (what's actually moving out)
- **Tertiary** — chemist's sale to consumer (the actual demand signal)
- **Closing stock at stockist** — channel inventory

Without these we cannot tell if "growth" is real demand or channel-stuffing. A 20% MoM growth at primary plus 90 days of closing stock at the stockist is FAKE growth that will reverse next quarter.

**Recommendation.** If secondary/tertiary isn't available, at minimum show CLOSING STOCK from SwilERP (`CurBal` field — it's literally already in the data). Add: Days of Inventory KPI, Inventory-to-Sales ratio per stockist, near-expiry % of closing stock. Without this, primary-growth callouts are unverifiable.

### D2. Outstanding / Receivables / DSO
The handoff v2 mentions outstanding files exist in SwilERP. They're not in this dashboard. A CMO who sees revenue without overdue receivables is half-blind.

**Recommendation.** Add an "Outstanding" tab or KPI strip: Outstanding by stockist, aging buckets (0-30 / 31-60 / 61-90 / 90+), DSO trend, top 10 overdues. Tie growth to collection — revenue without collection is a balance-sheet write-down waiting to happen. Show "Collected Revenue %" as a quality metric.

### D3. Schemes / Trade Discounts / Net Realization
Indian pharma gross-to-net is enormous — 10+1, 12+3, special launch offers, monthly schemes, end-of-quarter clearance schemes. These eat 15-30% of gross. The dashboard's "Net Revenue" is gross minus returns ONLY — it is not net of schemes. So the actual margin reality is hidden.

**Recommendation.** Add a Gross → Scheme Discount → Net Realization waterfall. By product and by MSR. A product growing in gross but with scheme cost growing faster is *losing money to grow*. We need to see that.

### D4. Market Share / Competitive context
"Top SKU Share" is share of OUR billing, not share of MARKET. Without molecule-level market share (AIOCD-AWACS, IMS data) we can't judge whether 12% growth is good if the molecule market grew 18% — we'd be losing share while celebrating growth.

**Recommendation.** Even without buying AIOCD data, allow a manual "Market Reference Growth %" input per division/molecule. Compute relative outperformance/underperformance. Show as a chip on each product.

### D5. MSR call metrics (the actual Indian pharma KPIs)
Entirely missing:
- **Call Average** — calls/day per MSR (national benchmark ~10-12, top reps 14-16)
- **RCPA captured** — Retail Chemist Prescription Audit per week
- **DCR compliance** — Daily Call Report submission %
- **Tour Plan vs Actual** — adherence to the locked beat plan
- **POB** — Plan of Business achievement
- **Sample/Input cost per call** — promo efficiency

Without these, "MSR performance" is just revenue attribution. A rep doing 30 calls/day to hit 80% target is OUTSTANDING. A rep doing 10 calls/day to hit 80% target is COASTING (the target was too soft). The dashboard cannot tell the difference.

**Recommendation.** If SFA (sales-force automation) data feed exists (most companies have one — Marg+, MR-Plus, Bizom), ingest it. If not, this is the highest-ROI next-data-source ask for the client.

### D6. Customer cohort / Stockist lifecycle
- When did each stockist start billing?
- How many billed in the last 30/60/90 days?
- Stockist who billed Q1 but not Q2 = silent churn (huge in our industry — small stockists often go quiet for credit reasons)
- New stockist acquisition rate

None of this is on screen. So a slowly-bleeding customer base looks fine until it isn't.

**Recommendation.** Add a "Customer Lifecycle" widget — new stockists this quarter, silent stockists (no bill in 60 days), reactivated stockists. Single-glance retention health.

### D7. Therapy / Division filter (same as CMO2)
Cardio rep cares about Cardio. Ortho ABM cares about Ortho. Currently the dashboard is mono-division — Ecoxib, Rednil and Kover All all roll into the same total. Add a division/therapy filter so each manager can see their slice.

### D8. ABM rollup layer
Indian pharma hierarchy is Country → Region → Zone → ABM → MSR. ABMs sign off MSR monthly reviews and own their team's number. The dashboard has no ABM layer — only MSR.

**Recommendation.** Add an ABM rollup (group MSRs by ABM, compute ABM scorecard). The "manager-of-managers" view that the National Sales Head will live in.

### D9. Expiry / Near-Expiry stock at stockist
SwilERP carries batch-level expiry. Stockist holding 6-month-expiry stock is a return waiting to happen. The dashboard doesn't surface this anywhere.

**Recommendation.** Add: % of stockist closing stock with expiry <6 months, ranked by stockist, with the implied write-back risk in ₹.

### D10. Doctor digital engagement
The modern marketing question: how many of our targeted doctors attended a CME we sponsored, watched a webinar, requested samples digitally? Even just a placeholder integration hook signals the team is thinking forward.

---

## What I'd actually want as CMO — the 5-question dashboard

If I rebuilt this from scratch for myself, the front page would answer exactly five questions:

1. **"Are we ahead, behind, or on target — by division?"** → Achievement % vs Plan, by division, with the gap-₹ to close
2. **"Is the growth real or channel-stuffed?"** → Primary vs Closing Stock vs (proxy) Secondary triangulation
3. **"Who's collecting? Who isn't?"** → DSO + Overdue concentration + Collected-Revenue %
4. **"Where's the field force breaking?"** → Bottom 3 MSRs by Efficiency Score (not Scale) + the single biggest beat-plan adherence gap
5. **"What's the ONE thing for Monday morning?"** → A single ranked decision with a specific instrument (POB lift, joint visit, CME, scheme, contract review)

Everything else is a drill-down. The current dashboard tries to answer 25 questions on Page 1 and ends up answering none of them definitively.

---

## Closing note

The build quality is high. The team has clearly done good work on visual hierarchy, the salutation-aware MSR join, the late-upload flow. None of my criticism is about the engineering craft. It's about the *commercial worldview*. Treat Indian pharma as a tertiary-pull business with a channel-stuffing risk, schemes eating margin, receivables creating fake revenue, and field-force discipline as the real lever — and rebuild the headline KPIs around those realities. The chassis is good. The interior trim is also good. The dashboard just needs a louder engine.

— *Reviewer 1, internal*
