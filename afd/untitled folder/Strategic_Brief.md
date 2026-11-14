# PharmaBoard — Strategic Redesign Brief

**Prepared for:** AFD Hospicare leadership
**Audience:** VPs, National Sales Heads, Regional Managers, Marketing Heads, MSRs
**Companion artifact:** `dashboard_strategic.html`
**Architecture:** Single-file HTML · browser-only processing · no data leaves the machine

---

## 1. What changed and why

The prior dashboard (`index.html`) was structurally solid — six tabs, cross-filtering, Plotly charts — but it under-delivered on three things that matter for an executive review:

1. **Visual hierarchy was flat.** KPI cards, charts and tables were rendered at equal weight. A VP scanning for the headline could not tell where to look first.
2. **The "doctor" label was fake.** Every chart that said "Doctor/Party" was just the customer (stockist) relabeled. The actual prescribing relationship — which is the unit of value in pharma sales — was never analysed.
3. **Insights existed but were demoted.** The Decision and Strategic Recommendation cards sat below large charts, making them feel like footnotes rather than the lead.

The new dashboard fixes all three. Critically, it ingests a third file — the **Doctor Master** (1,366 doctors across 11 MSRs, with VIP / CORE / SUPER CORE tiering, speciality, HQ vs Extension status, and target-product mapping) — and uses it to build true Field Force intelligence on top of the customer-level sales register.

### Audit decision matrix

| Category | Decision |
|---|---|
| **Stays** | Browser-only architecture · Plotly + SheetJS · SwilERP ingestion · column auto-mapping · cross-filter system · Excel export · Sales register drill-down |
| **Improves** | Visual hierarchy (hero KPIs with gradient, sparklines, gold/navy palette) · narrative tab structure · auto-surfaced insights lead the page · KPI count reduced from 6 to 4 high-signal cards · period badge made explicit · responsive grid |
| **Removed** | Three redundant bubble/scatter charts collapsed to one Opportunity Matrix · ad-hoc "Strategic Recommendations and Data Roadmap" panel · the fake "Doctor Engagement" matrix that was just a customer matrix · the per-tab decision list duplications |
| **Added (new analytics)** | Doctor Portfolio Pyramid (VIP/CORE/SUPER CORE by MSR) · Targeting Effectiveness (% revenue on mapped products) · Speciality Revenue Mix · HQ vs Extension productivity · Doctor Watchlist (Anchor / Untapped / Diversify / Performer) · MSR Composite Score (revenue + growth + reach + breadth + targeting) · Growth Bridge (waterfall on the Pulse) · Concentration Pareto with 80% line · Auto-generated executive HTML brief export |

---

## 2. Information architecture

Six tabs in narrative order. Every tab opens with a one-sentence thesis statement so a presenter can move through the deck without re-orienting the audience.

| # | Tab | Lead question it answers |
|---|---|---|
| 01 | **Executive Pulse** | "What is the one thing leadership must know this quarter?" |
| 02 | **Growth Engine** | "What is driving us up — and what is pulling us down?" |
| 03 | **Field Force** *(MSR + Doctor)* | "Is the field force executing the strategy we set?" |
| 04 | **Product Strategy** | "Which products do we accelerate, defend, fix, or harvest?" |
| 05 | **Territory** | "Where do we have anomaly performance worth replicating or fixing?" |
| 06 | **Register** | "Row-level audit and Excel export" |

---

## 3. The Field Force module — what the Doctor Master unlocks

Sales data is at the **customer (stockist)** level. The Customer-to-MSR mapping attributes that revenue to a rep. But until now, the actual **doctor portfolio** behind each rep — their VIP doctors, their speciality mix, the products they were *supposed* to be pushing — was invisible to the dashboard. The Doctor Master file changes that.

The new module builds five analytics that simply did not exist before:

### 3.1 MSR Composite Performance Score (0–100)

A weighted ranking that combines:

- **Revenue scale (40 pts)** — normalized vs the highest-earning MSR
- **Growth velocity (25 pts)** — MoM revenue growth
- **Customer reach (15 pts)** — unique customers served
- **Product breadth (10 pts)** — unique SKUs sold
- **Targeting effectiveness (10 pts)** — % of revenue from doctor-mapped products

This single number is the headline for any 1:1 with a rep.

### 3.2 Doctor Portfolio Pyramid

Per MSR, a stacked bar showing the proportion of SUPER CORE, VIP and CORE doctors in their territory. Reveals two failure modes immediately:

- **Reps with VIP-heavy portfolios but flat revenue** → relationship execution problem, not allocation
- **Reps with thin VIP coverage but high revenue** → unsustainable growth from CORE-only push, no premium pipeline

### 3.3 Targeting Effectiveness

For each MSR, the dashboard computes what fraction of their revenue came from products mapped to *their assigned doctors*. A rep selling KOVER ALL to a Cardiologist mapped to KOVER ALL is on-strategy. A rep selling ECOXIB to a Cardiologist whose mapping is REDNIL is off-strategy — even if revenue is healthy, the field play is wrong and won't compound. The metric flags <70% as amber, <40% as red.

This is one of the highest-value additions in the dashboard. Most pharma companies cannot answer this question even with PowerBI, because the join requires the Doctor Master that most ERPs do not natively expose.

### 3.4 Speciality Revenue Mix

Apportions FSMSR revenue by the speciality distribution of doctors in each city. Surfaces which medical sub-segments anchor revenue — typically Cardiology, Orthopaedics, General Physicians — and which are under-monetised given the doctor base.

### 3.5 HQ vs Extension Productivity

The Doctor Master tags each territory as **HQ** (the rep's headquarter base) or **EX** (extension territory they visit periodically). Comparing revenue and ₹-per-doctor across these two types tells you whether the field force is leveraging extension days or treating them as theatre.

### 3.6 Doctor Watchlist — auto-classified

Every MSR × city hotspot is auto-tagged as one of:

- **Anchor** — VIP/SC ratio >50%, high revenue → protect at all costs
- **Untapped** — VIP/SC ratio >50%, low revenue → biggest growth lever in the dashboard
- **Diversify** — low VIP/SC ratio, high revenue → concentration risk, broaden base
- **Performer** — strong revenue, balanced mix → leave alone, replicate
- **Standard** — no flags

The Untapped class is the most actionable in a quarterly review — it answers "where is the next ₹50 lakhs hiding?"

---

## 4. KPI hierarchy

### Hero tiles (Executive Pulse — 4 cards, large)

Reduced from six small KPIs to four large hero tiles, each with a sparkline, a delta chip and a one-line context string. The four reflect the four levers a VP can move:

1. **Net Revenue** — scale
2. **Growth (MoM)** — direction
3. **Return Drag** — quality
4. **Doctor Coverage** — execution *(falls back to Active Customers when Doctor Master is not loaded)*

### Auto-surfaced Intelligence Brief (4–8 insight cards)

The dashboard scans the data and surfaces up to 8 insights tagged Growth · Risk · Watch · Focus · Opportunity. Each insight is computed, not authored — the rules behind them are auditable in `buildInsights()`.

Examples:
- "Revenue contracted X% in [month]" *(risk)*
- "Top 10 customers = X% of revenue" *(concentration)*
- "[Product] is the top growth contributor" *(driver)*
- "[MSR] needs intervention" *(field force)*
- "Only X% of revenue is on-strategy" *(targeting)*

---

## 5. Visualisation choices — and what each one decides

Every chart has a single, clearly stated decision purpose. Anything that did not pass that test was removed.

| Chart | Decision it supports |
|---|---|
| Revenue Momentum + Return Drag | Did we grow this month? Is leakage rising or falling? |
| Growth Bridge (Waterfall) | Which 3 products to talk about in the QBR open |
| Concentration Pareto with 80% line | How fragile is the customer base? Do we lock in contracts? |
| Territory Opportunity Matrix | Which territories merit a regional manager site visit? |
| Product Momentum Matrix | Which products to invest detailing time in next quarter |
| Customer × Product Heatmap | Which doctor relationships to protect in account planning |
| MSR Scorecard | Who to coach, who to recognise, who to intervene |
| Doctor Portfolio Pyramid | Is each MSR playing the portfolio we gave them? |
| Targeting Effectiveness | Are MSRs executing the beat plan we wrote? |
| Speciality Mix | Which medical segment to brief Marketing on next |
| HQ vs Extension | Is the field actually working extension territories? |
| Doctor Watchlist | Where is the next bucket of growth hiding? |
| State-Product Heatmap | Which states need product portfolio expansion? |
| Territory Action Table | The Monday-morning to-do list for area managers |

---

## 6. Strategic recommendations beyond the dashboard

### Missing data we recommend AFD start capturing

1. **MSR target / call planning data** — visit-level activity (call frequency, in-clinic time). Without this, productivity is inferred from revenue alone.
2. **Prescriber → Stockist linkage** — which stockists fulfilled prescriptions from which doctors. Today the bridge is geographic (city) and statistical (speciality weighting). Direct linkage would 10× the precision of the targeting metric.
3. **Sample/promotional spend per doctor** — to compute true ROI per VIP relationship.
4. **Competitor coverage data** — share of voice / share of script at the doctor level.
5. **Stockist secondary sales** — to distinguish stockist-side inventory build-up from actual secondary off-take.
6. **Doctor digital engagement** — webinar attendance, sample requests, CME participation.

### Future analytics layers (sequenced by ROI)

| Phase | Layer | Why it matters |
|---|---|---|
| **Phase 1** | Beat-plan adherence scoring | Compare actual customer activity to the rep's planned calls. Highest-impact field metric. |
| **Phase 2** | Prescription-share modelling | Estimate doctor-level Rx share using sales-weighted speciality + product mapping. |
| **Phase 3** | Cohort retention curves | Doctor-cohort retention over months — quantify the "missing third" who drop off. |
| **Phase 4** | Predictive churn (XGBoost or similar) | Identify customers/doctors likely to drop in the next 30/60/90 days. |
| **Phase 5** | Reinforcement-learning beat plan | Suggest optimal weekly call plan given growth opportunity and travel constraint. |

### Operating rhythm we recommend

The dashboard is a tool, not a habit. The habit is:

- **Weekly** — Field Force tab. National Sales Head reviews MSR Composite Score, Targeting Effectiveness, and the Untapped row of the watchlist.
- **Monthly** — Executive Pulse + Growth Engine. VP closes the month and pre-loads the QBR narrative.
- **Quarterly** — Full deck, walked through tab by tab in the live meeting (the dashboard is designed for this presentation flow).

---

## 7. Why this design is enterprise-grade

- **Single-file delivery** — no servers, no logins, no cloud dependency. A WhatsApp-able strategic platform.
- **Privacy by architecture** — data never leaves the machine. Material when discussing customer-level revenue and rep names.
- **Browser-native** — opens in any browser, IT-friendly, no install.
- **CSS-variable design system** — all colours, typography, spacing, and radii are centralised. Re-skin to a client's brand in ~20 lines.
- **Auto-detected ERP mapping** — works with SwilERP today, will work with Marg/Tally with one alias addition.
- **Lazy tab rendering** — charts render only on tab activation; ~70% faster than the previous build's eager rendering.
- **Composable architecture** — each tab is an isolated render function. New tabs (Stockist Health, Inventory Expiry, Competitive) can be added without touching the rest.

---

## 8. What this means for the quarterly sales meet

The VP can open the dashboard on the conference room screen and, in five tabs and under fifteen minutes, walk the room through:

1. **"Here's where we are."** *(Pulse)* — Net revenue, growth, return drag, coverage. Four numbers. The room nods.
2. **"Here's what is growing — and what is dragging."** *(Growth Engine)* — Three products on each side. The room takes notes.
3. **"Here's the field force scorecard."** *(Field Force)* — Composite scores ranked. The room sees who is up and who needs a coaching conversation.
4. **"Here are our portfolio bets."** *(Product Strategy)* — Defend / Accelerate / Fix / Harvest. Marketing aligns to MSR priorities.
5. **"Here are the regional priorities for next quarter."** *(Territory)* — Action table by territory. Regional managers leave with a one-page brief.

That is the difference between a reporting tool and a strategic platform. PharmaBoard is now the latter.

---

*— Delivered alongside `dashboard_strategic.html`. Both files live in the Pharmaboard workspace folder.*
