# PharmaBoard · Presenter Script
## AFD Hospicare · Sales Storytelling Walk-Through

A companion explainer for `dashboard_presentation.html` and `dashboard_presentation_codex.html`. One block per KPI and chart, written for live delivery — read it, internalise the framing, then talk to the slide.

**How to use this script:**
- Each slide has a **What the room sees** opener, a list of **KPIs / Charts** with their explainer, an **Embedded YoY band** explainer for the new comparable-period tiles, and a **Speaker bridge** to the next slide.
- Numbers below are illustrative — you'll replace them with whatever the live data shows when you present.
- Total slot: ~35 minutes for 11 presentation slides plus the Slide 12 register appendix. Some are KPI-only (90 seconds is fine); the field-force slides (7, 8, 9) and the YoY slide (11) deserve closer to 4 minutes each.
- Keyboard: arrow keys / page-down to advance, `F` for fullscreen, click any dot on the right to jump.

---

## YoY Methodology · How the Comparable-Period Engine Works

Every YoY tile, chart, and table across the deck obeys one rule: **compare like with like**. Specifically:

- **Fiscal year** runs April → March. The active comparison is always **Current FY vs Previous FY**, named in the deck like `FY26-27` (the file's actual tag). The chip at the right of the filter bar reads `FY26-27 Apr–May vs FY25-26 Apr–May` — that's the active comparable window in plain English.
- **Comparable window** is computed automatically: the intersection of the fiscal months present in the current-FY sales file and those present in the previous-FY file. If the current FY only has April + May closed (because we are presenting in early June), every YoY metric on the deck restricts the previous-FY rows to April + May before comparing. This prevents the classic "Apr–May FY27 vs full FY26" trap.
- **Two filter layers.** Global filter bar drives the *narrative* — FY mode, fiscal-month range, product / customer / region / MSR / ABM / speciality / tier. Each YoY card also has its own *local* filter strip (e.g., on the Product YoY Lens the presenter can switch products live without rewinding the deck).
- **YoY math.** `YoY Δ = NetCur − NetPrev`. `YoY % = (NetCur − NetPrev) / |NetPrev|` with safe handling: `Prev=0 & Cur>0 → "New"` chip, `Prev<0 → %  suppressed`. The Revenue Bridge decomposes YoY Δ into **Volume Δ · Price Δ · Mix Δ · New-Biz · Lost-Biz · Residual** (the residual closes the math to ±0 at the rupee level).

**When the audience asks** *"is this current-year vs full last year?"* the answer is always no — it's same-fiscal-months vs same-fiscal-months. Point at the chip at the top right of the filter bar.

---

## SLIDE 1 · Cover — *"Where AFD Hospicare Stands Today"*

**What the room sees.** Four large hero KPIs sitting on a dark band, followed by a five-tile strip of supporting numbers, anchored by the active period in the top right.

### Hero KPI · Net Revenue

**What it shows.** Total net sales (gross sales minus returns) across the active period, with the latest month called out below. The chip on the side shows the month-over-month direction — green up-arrow if growing, red down-arrow if shrinking.

**Why it matters.** This is the single number the National Sales Head has to defend. Every other number on this dashboard either explains this one or warns about it. Net is what we keep — not gross, not invoiced — so we lead with it. The latest-month callout matters because annual or six-month totals can hide a recent collapse.

**How to talk to it.** *"For the period shown, we did ₹X in net revenue. Last month alone closed at ₹Y, and that was up/down Z% versus the month before."*

### Hero KPI · Growth (MoM)

**What it shows.** Latest month's net revenue compared with the previous month, expressed as a percent change. The tile colour itself signals direction — green for positive, red for negative.

**Why it matters.** MoM is the freshest momentum signal we have. Year-on-year is comforting but slow; MoM is what tells you whether your last beat-plan cycle worked. For a sales force that resets its targets monthly, MoM is the heartbeat.

**How to talk to it.** *"We're moving at +X% MoM. Translation — every month is adding ₹Y over what we did the previous month. If we hold this rate, we exit the quarter at ₹Z."* If negative, flip it: *"We're losing ₹Y a month at the current rate — we have to find where it's leaking."*

### Hero KPI · Return Drag

**What it shows.** Returns as a percentage of gross billing, with the absolute rupee leakage and the count of credit notes below. Chip colour signals severity — green under 2%, neutral 2–5%, red above 5%.

**Why it matters.** In Indian pharma the industry-respectable return rate is ≤1.5% and the worry-line is 4%. Above 4% we're not running a sales operation, we're running a credit-note operation. Returns also distort our gross numbers, so calling them out early stops the room from inflating the rest of the story.

**How to talk to it.** *"We're losing X% of every rupee we bill to returns. That's ₹Y back-out across N credit notes. Pharma benchmark is 1.5% — we'll diagnose this on Slide 10."*

### Hero KPI · Doctor Coverage (or Active MSRs if Doctor Master not loaded)

**What it shows.** What percent of the mapped doctor universe is "active" — meaning their MSR billed in their city this period AND a product mapped to that doctor showed up in those bills. If the Doctor Master isn't loaded, we fall back to active MSR count.

**Why it matters.** This is the field-force productivity headline. Coverage of 60%+ is healthy; 40–60% is the band where most companies actually sit; under 40% means a large slice of the doctor universe sees no detailing this month. Coverage is leading-indicator — it predicts next month's revenue better than any retro number.

**How to talk to it.** *"Of the N doctors on the master, we're touching X% effectively right now. That's the leading indicator — if this slips, revenue follows two months later."*

### Bottom Strip · 5 Supporting KPIs

- **Bills Raised** — count of unique invoices. Cross-checks billing volume against revenue; rising revenue with flat bills means bigger orders, flat revenue with rising bills means more fragmentation.
- **Avg Bill Value** — gross sales ÷ bills. A simple proxy for order quality. Higher = better stock-balancing or bigger institutional orders.
- **Active SKUs** — count of distinct products sold. Tells you how wide our portfolio is being worked. A drop here means we're concentrating on fewer brands.
- **Customers** — count of buying parties. Compare against historic base to spot churn.
- **Territories** — count of cities/regions where we billed. Footprint width.

**Why this strip matters.** The four big tiles give the *story*; this strip gives the *muscle behind it*. If someone asks "but how many doctors / customers / cities did that come from?", everything they need is right here.

### Speaker bridge to Slide 2

*"That's the where-we-stand picture. Let's look at how we got here — the trajectory month by month."*

---

## SLIDE 2 · Revenue Momentum — *"The Trajectory"*

**What the room sees.** A four-tile KPI strip at the top, then one big monthly trend chart filling the rest of the screen. The chart has blue bars (net), red bars below the axis (returns), and a gold line on the right axis (return %).

### KPI Strip — 4 tiles

- **Latest Month.** The most recent month's net plus its MoM chip. Restates Slide 1's growth number in a single tile so the room can keep it on screen while reading the chart.
- **Best Month.** Highest-net month in the period with its label. *Why it matters:* sets the ceiling — gives you the "we've done it before" anchor when arguing for stretch targets.
- **Worst Month.** Lowest-net month (positive only) with its label. *Why it matters:* sets the floor — useful for the "even on our worst month we did X" framing in a defensive conversation.
- **Monthly Average.** Mean net per month, plus total return value. *Why it matters:* the running run-rate. If your monthly average is ₹X, your "fair" annual is roughly 12×X — useful when modelling forward.

### Chart · Monthly Revenue Trend

**What it shows.**
- **Blue bars (left axis):** Net revenue per month — your top-line trajectory.
- **Red bars (downward, left axis):** Returns leakage per month — drawn as negatives so the eye sees them eating into the same bar space.
- **Gold line (right axis):** Return % per month — returns divided by gross for that month.

**Why it matters.** Three things in one image, all linked. The blue bars tell the growth story; the red bars tell the leakage story; the gold line tells you whether the leakage is *getting worse* relative to volume. A common trap: returns can rise in rupees just because volume rose, but the % stays flat — that's healthy. The opposite — flat rupees but rising % — means we're shipping worse-quality SKUs.

**How to talk to it.** Walk the room across left-to-right.
1. *"Look at the blue bars first — that's our net trajectory. We see growth from Month-1 through Month-4, then a dip in Month-5, recovery in Month-6."*
2. *"Now the red bars — that's what we gave back. Notice they spike in Month-X. That's expiry-driven."* (Or whatever the actual driver is from your data.)
3. *"And the gold line on the right — the percent. That's the cleanest leakage signal. We want it under 1.5%."*

### Speaker bridge to Slide 3

*"So that's the shape of the trajectory. Now let's pry open last month — what specifically drove that change, product by product?"*

---

## SLIDE 3 · Growth Story — *"What Changed Last Month"*

**What the room sees.** A KPI strip at the top, then a 2:1 split — a waterfall chart on the left showing per-product MoM Δ, and a stacked list on the right with Top 5 Accelerating and Top 5 Declining SKUs.

### KPI Strip — 4 tiles

- **Latest Month Net.** Repeats the latest month tile for context — it's the number we're decomposing.
- **MoM Δ Value.** The rupee change, *not* the percent. *Why it matters:* percent change can lie at small bases. If we went from ₹1 to ₹2, that's +100% but who cares. The rupee delta tells you whether the movement is material.
- **Accelerating SKUs.** Count of products that grew over prior month. *Why it matters:* breadth signal. 30 accelerating + 30 declining is healthy churn; 10 accelerating + 60 declining is a portfolio in trouble even if total net looks flat.
- **Declining SKUs.** Count of products that shrank, with new/lost SKU counts in the sub-text. *Why it matters:* the count tells you whether to act narrowly (a few SKUs) or broadly (portfolio-wide issue).

### Chart · Growth Bridge (Waterfall)

**What it shows.** Top 12 products by absolute MoM change. Green bars are positive contributors (products that grew); red bars are detractors (products that shrank); the final gold "Net Change" bar shows the sum of all 12, which approximates the total monthly delta.

**Why it matters.** This is the single most useful chart for a monthly business review. It turns "we went up/down ₹X" into "we went up/down ₹X because A, B, C grew and D, E, F shrank." It assigns blame and credit to specific SKUs — exactly what an MSR or ABM can act on.

**How to talk to it.**
1. *"Read left to right. The green bars on the left are our growth heroes — Product A added ₹X, Product B added ₹Y."*
2. *"Then we hit the red bars — Product D gave back ₹Z."*
3. *"The gold bar at the end is the net of all that — and it's positive/negative, which is why our total moved the way it did on Slide 2."*

### Side Panel · Top 5 Accelerating · Top 5 Declining

**What it shows.** A simpler, faster-to-scan version of the waterfall — the named winners and named losers, with the rupee delta against each.

**Why it matters.** The chart shows you the *shape*; the list gives you the *names to write down*. When the ABM walks out of this meeting and asks "OK, but what do I tell my team to push?" — this list is the answer to the first half ("push these five") and the second half ("rescue these five").

**How to talk to it.** *"Quick names to take away — these five products are pulling us up; these five need intervention this week."*

### Speaker bridge to Slide 4

*"That's growth versus last month. Let's zoom out to the whole portfolio — which SKUs actually carry the business."*

---

## SLIDE 4 · Product Portfolio — *"What Sells"*

**What the room sees.** A current-period KPI strip, an embedded same-period YoY strip and chart, then the current-period Top 10 Products, Treemap, and Pareto charts.

### KPI Strip — 4 tiles

- **Active SKUs.** Number of products that billed in the period vs total in catalogue. *Why it matters:* tells you what fraction of your SKU catalogue is actually working. Big gap = dead SKUs taking up rep mind-share.
- **Top SKU Share.** What % of total revenue comes from the single biggest product. *Why it matters:* if one SKU is >30% of revenue, the whole business has SKU-concentration risk — one regulatory or supply hiccup and the year is broken.
- **Top 10 Share.** Combined share of the top 10 products. *Why it matters:* in healthy distribution this is 60–75%. Below 60% means you're spread too thin; above 80% means dangerous concentration.
- **Accelerating.** Count of SKUs growing >10% MoM. *Why it matters:* shows where the leading-edge of the portfolio is — your next year's hero SKUs.

### Embedded YoY Strip — 4 tiles

- **Current Net.** Net after returns for the active product and month filters.
- **Previous-Year Net.** Net after returns for the exact same product and month-of-year window in `previous_sales`.
- **YoY Delta.** Current minus previous in rupees. *Why it matters:* shows the material revenue gap or lift.
- **YoY Growth.** Delta as a percent, with return-rate shift in percentage points. *Why it matters:* separates growth from return-quality deterioration.

### Chart · Product YoY Lens

**What it shows.** With **All Products** selected, grouped bars compare current-year and previous-year net for the largest SKUs in the active period. Click a SKU to isolate it. With one product selected, the chart switches to a month mirror for that SKU: previous year in grey, current year in blue, YoY% in gold.

**Why it matters.** This is the working comparison surface. Choosing **April** in the Month Lens instantly answers "how did April perform versus last April?" Choosing a product answers the same question for that SKU only.

**How to talk to it.** *"We are looking at the same product and the same calendar month against last year. Blue above grey is real YoY lift; blue below grey is revenue we have already proved we can recover."*

### Chart · Top 10 Products by Net Revenue

**What it shows.** Horizontal bar chart, products ranked by total net revenue in the period, colour-coded by rank.

**Why it matters.** This is the simplest possible question — *what sells?* — and the answer most often informs production planning, marketing spend, and MSR detailing priority. If REDNIL is #1, that's where the marketing investment and the CME calendar should follow.

**How to talk to it.** *"This is our hit list. The top three carry roughly N% of the business, and you'll see them mentioned on almost every other slide too."*

### Chart · Product Sales Mix (Treemap)

**What it shows.** A treemap of the top 30 SKUs sized by revenue share. Each tile shows the product name and its share of the total. The biggest tiles are the biggest sellers.

**Why it matters.** The bar chart on the left answers "who's on top"; the treemap answers "how much of the portfolio is *actually concentrated* in just a few SKUs vs spread out." A treemap with one dominant tile is a fragile portfolio. A treemap with a balanced grid is a resilient one.

**How to talk to it.** *"The shape of the treemap tells you the portfolio's risk profile. If you see one giant box and a sliver of everything else, we have a fragility problem. If it's more balanced, we have a resilience advantage."*

### Chart · Cumulative Revenue Pareto (full-width)

**What it shows.** Bars for each product sorted descending by revenue, with a cumulative % line on the right axis. The classic 80/20 chart — colour-coded teal for the top 50%, blue for 50–80%, amber for the long tail. A dashed line marks the 80% threshold. The pill in the top-right shows the top-10 share.

**Why it matters.** This is the strategic clarity chart. It tells you exactly where the 80/20 cut sits — i.e., how many products you'd need to focus on to capture 80% of revenue. In pharma, "top 5 brands = 80% of revenue" is the classic signal of a focused company. If it takes the top 40 SKUs to reach 80%, your sales force is spread too thin.

**How to talk to it.** *"Eighty percent of our revenue comes from these N products (point at the bar where the cum line crosses 80%). The rest — the amber tail — is where we evaluate whether to keep promoting or harvest and drop."*

### Speaker bridge to Slide 5

*"That's what sells. Now let's look at who buys."*

---

## SLIDE 5 · Customer Base — *"Who Buys"*

**What the room sees.** KPI strip; then a 2-column row with Top 10 Customers (left) and a Customer Pareto (right); a Customer × Product combos table at the bottom.

### KPI Strip — 4 tiles

- **Active Customers.** Count of buying parties, with avg bill value in the sub. *Why it matters:* size of the active customer base. If this drops over time, churn is real even if revenue holds.
- **Top 10 Share.** Combined revenue share of the top 10 customers. *Why it matters:* customer concentration risk. Above 60% is heavy; above 75% means losing one big customer breaks the year.
- **Top 5 Share.** The tighter view — even more brittle if high. *Why it matters:* the top 5 customer share is the single fastest way to call out an account-management risk.
- **Repeat Customers.** Count of customers with more than one bill in the period. *Why it matters:* loyalty signal. A high one-and-done count means we're acquiring but not retaining.

### Chart · Top 10 Customers by Net Revenue

**What it shows.** Horizontal bar chart of the top 10 customer accounts ranked by net revenue, with rupee value labelled.

**Why it matters.** These are the names every ABM should know cold. They're also the names that should have a contract-renewal date marked on a calendar somewhere. Losing one of these isn't a quarterly issue — it's a year-end miss.

**How to talk to it.** *"These ten names carry roughly N% of the business. Every one of them needs a relationship review, a renewal lock-in, and a named owner."*

### Chart · Customer Concentration (Pareto)

**What it shows.** Same Pareto treatment as Slide 4, but for customers. Bars ranked by revenue, gold line for cumulative %, 80% dashed line.

**Why it matters.** Customer concentration is *structurally riskier* than SKU concentration because customers can switch suppliers overnight, whereas brand loyalty takes years to erode. The shape of this chart tells you how exposed we are. A steep curve up front = high dependency; a gradual curve = healthy diversification.

**How to talk to it.** *"Notice how steeply the cumulative line rises — the top N customers already cross 80%. That's our concentration risk. The action that follows is contract lock-ins on every one of those names."*

### Table · Top 12 Customer × Product Combos

**What it shows.** Twelve highest-value customer-product pairings, ranked by net revenue, with MoM rupee delta and percent delta.

**Why it matters.** Customers and products are interesting; *combos* are actionable. This row says "Dr Sharma's clinic buys ₹X of REDNIL every month" — which is where account planning actually lives. A growing combo means double down; a declining combo with a big base means visit this customer next week.

**How to talk to it.** *"Single most actionable table on this slide. Each row is a relationship: a named customer, a named product, the size of that flow, and whether it's growing or shrinking. ABMs should treat every row in red as a same-week visit."*

### Speaker bridge to Slide 6

*"That's the customer story by name. Now let's spread it geographically."*

---

## SLIDE 6 · Territory Map — *"Where We Sell"*

**What the room sees.** KPI strip; then a 2-column row with a region donut on the left and a Territory Opportunity Matrix (scatter) on the right.

### KPI Strip — 4 tiles

- **Active Territories.** Count of cities/regions where we billed, with the top territory named. *Why it matters:* footprint size. Tells you scale of presence at a glance.
- **Top Territory Share.** % of revenue from the single biggest territory. *Why it matters:* geographic concentration risk. If one city is >30%, anything that disrupts that city (regulator, logistics, local market shift) hits the whole P&L.
- **Growing Territories.** Count of territories with positive MoM > 5%. *Why it matters:* shows momentum breadth. Many growing territories = we're winning broadly; few growing = success is fragile.
- **Declining Territories.** Count of territories down by >5% MoM. *Why it matters:* the alert list. Each one of these deserves a named owner and a "what's happening here" answer by next week.

### Chart · Revenue by Region (Donut)

**What it shows.** Donut chart of net sales share across territories. Bigger slice = bigger territory.

**Why it matters.** The most-asked question in any sales review is "what's our regional mix?" This shows it at a glance. Equally important: it shows what's *not* there. If half the country isn't on this chart, that's the question — *why aren't we there?*

**How to talk to it.** *"Our revenue is concentrated in these N regions. The slices missing from this picture are the obvious expansion targets — we'll come back to them in the Actions slide."*

### Chart · Territory Opportunity Matrix

**What it shows.** A bubble chart where:
- **X axis = Net Revenue** (size of opportunity now)
- **Y axis = MoM Growth %** (momentum)
- **Bubble size = Customer count** (depth of the relationship base)
- **Bubble colour = Return rate** (green = clean, amber = watch, red = quality concern)

The zero-line is highlighted so you can immediately see which territories are above (growing) vs below (declining).

**Why it matters.** This is the strategic resource-allocation chart for the National Sales Head. It separates territories into four implicit quadrants:
- **Top-right (high revenue, high growth):** Winners. Protect and amplify.
- **Top-left (low revenue, high growth):** Future stars. Invest now while momentum is free.
- **Bottom-right (high revenue, declining):** Cash cows in trouble. Same-week intervention.
- **Bottom-left (low revenue, declining):** Harvest or exit conversation.

Bubble colour overlays a quality dimension on top of all four — red bubbles in any quadrant deserve a returns audit.

**How to talk to it.** Walk the four corners.
1. *"Top right — these are our stars. Lock them in."*
2. *"Top left — small but growing fast. Resource them before the competition notices."*
3. *"Bottom right — biggest territories but losing momentum. Same-week ABM intervention."*
4. *"Bottom left — frankly, the conversation here is harvest or exit."*

### Speaker bridge to Slide 7

*"That's the territory story. Now let's look at the people who actually deliver those numbers — starting with the ABMs."*

---

## SLIDE 7 · ABM Team Performance — *"Manager of Managers"*

**What the room sees.** KPI strip; a 2-column row with the ABM Efficiency stacked bars (left) and ABM MoM Growth (right); a full ABM scorecard table below.

### KPI Strip — 4 tiles

- **Active ABMs.** Count of ABMs with net revenue. *Why it matters:* baseline team size for the National Sales Head's mental map.
- **Top Performer.** Name of the highest-scoring ABM with score and revenue. *Why it matters:* establishes the bar. This person's playbook is the one to study.
- **Avg Team Revenue.** Mean revenue per ABM. *Why it matters:* lets you read the table — anyone significantly below this is in the bottom half.
- **Growing Teams.** Count of ABMs with positive MoM, expressed as X / N. *Why it matters:* breadth of the growth story at the team level.

### Chart · ABM Efficiency Score (Stacked Bars)

**What it shows.** A horizontal stacked-bar chart where each bar is one ABM and the segments are the four components of the territory-fair Efficiency Score:
- **Growth** (out of 35 points) — green
- **Targeting** (out of 30) — blue
- **Coverage** (out of 25) — gold
- **Strategic SKU breadth** (out of 10) — violet

The total score (out of 100) is called out at the right end of each bar.

**Why it matters.** This is the most important chart for the National Sales Head. Two reasons:

1. **It's territory-fair.** We deliberately stripped out the "absolute revenue scale" term — punishing upcountry ABMs for not matching Mumbai on rupees is unfair and unactionable. Every component here is a ratio or velocity, so an ABM in a smaller territory can score 90 if they're executing well, just like a Mumbai ABM.
2. **It shows *which lever* each ABM is winning or losing on.** Same total score can come from completely different mixes — one ABM might be a coverage king with weak targeting; another might be a targeting genius with poor SKU breadth. The stacked bar makes the lever visible.

**How to talk to it.** *"Two things to watch. First — the total at the right edge of each bar — that's the headline. Second, the colour mix inside each bar — that tells me whether this ABM needs growth coaching, targeting refresh, coverage tour-plan reset, or a strategic-SKU push. Same score, different prescriptions."*

### Chart · ABM MoM Growth

**What it shows.** Horizontal bars of MoM growth % per ABM, green for positive, red for negative, with the percent labelled outside the bar.

**Why it matters.** The Efficiency Score is a balanced view; this chart is the unbalanced "did your team grow or not?" view. Both matter — the score is the strategic view, MoM is the trailing-month tactical view.

**How to talk to it.** *"If the score tells you which ABMs are executing the strategy well, this chart tells you which ones are simply not putting up the number this month. The two together help you separate strategic underperformance from a one-off bad month."*

### Table · ABM Scorecard

**What it shows.** Every ABM with their score, MSR count, net revenue, MoM%, coverage%, targeting%, strategic SKU count, and return %. Click any column header to re-sort.

**Why it matters.** The chart gives the shape, the table gives the receipts. Anyone who wants to dig in — "wait, why is that ABM scoring lower than this one when their revenue is higher?" — finds the answer here in the per-column breakdown.

**How to talk to it.** *"This is the working table. Sort by any column. The Score column is the headline; the MoM column is the trailing month; coverage and targeting are where we coach."*

### Speaker bridge to Slide 8

*"ABMs run their MSRs. Let's go one level down — to the individual reps themselves."*

---

## SLIDE 8 · MSR Performance — *"The Field Force"*

**What the room sees.** KPI strip; a 2-column row with MSR Net Revenue (left) and Targeting Effectiveness (right); a stacked monthly trend for the top 5 MSRs at the bottom.

### KPI Strip — 4 tiles

- **Active MSRs.** Count of named representatives with revenue, vs total assigned. *Why it matters:* tells you how many of your assigned reps are actually contributing. A gap = onboarding issue or attribution issue.
- **Top MSR.** The single highest-revenue MSR with their net. *Why it matters:* names the leader. The room should know this person's name.
- **Avg per MSR.** Total net divided by active rep count. *Why it matters:* the productivity benchmark — anyone below this in the bottom chart is a coaching opportunity.
- **Targeting Fit.** What % of MSR revenue came from products mapped to their doctors (when Doctor Master is loaded). Falls back to "Customers Covered" if no Doctor Master. *Why it matters:* the strategy-adherence signal. High net + low targeting = the MSR is winning but off-strategy (selling whatever, not what we asked them to sell). That's a coaching conversation, not a celebration.

### Chart · MSR Net Revenue

**What it shows.** Horizontal bar chart of every active MSR ranked by net revenue, colour-cycled for visual distinction.

**Why it matters.** This is the rep ranking. Everyone in the room wants to see where they stand on this list — and that motivational effect alone is worth the chart. It's also the simplest answer to the question "who's delivering."

**How to talk to it.** Address the room directly. *"This list ranks every named MSR by their attributed revenue. Top of the list — well done. Bottom of the list — let's talk this week."*

### Chart · Targeting Effectiveness

**What it shows.** Horizontal bar chart of each MSR's "on-strategy %" — the share of their revenue coming from products mapped to *their* assigned doctors on the Doctor Master. Bar colour codes the band: green ≥70%, amber 40–70%, red <40%. A dotted line marks the 70% target.

**Why it matters.** This is the most insightful field-force chart we have, and the one that surprises people the most. An MSR can be #1 on the previous chart (high revenue) and still be deep in the red here. That means they're selling, but they're selling whatever the customer wants — not what we put on their priority brand list. That's a strategic problem because:
- It says our brand strategy isn't reaching the field.
- It says when we lose those off-strategy SKUs (price war, regulatory issue), we lose that MSR's revenue.
- It says competitor positioning is winning at our customer's counter even when we're billing.

**How to talk to it.** *"Read this carefully. Green means the MSR is selling what we asked them to sell. Red means they're selling, but off-list. Compare against the previous chart — anyone high on revenue and red here is winning the customer but losing the strategy. Joint field day this month."*

### Chart · MSR Sales Trend — Top 5 (Stacked Monthly)

**What it shows.** Stacked bar chart, one bar per month, segments colour-coded by MSR. Shows the contribution of the top 5 MSRs across the period.

**Why it matters.** The two charts above are point-in-time snapshots. This one shows movement. You can see if a particular MSR is on a rising trajectory or has fallen off a cliff — even if their overall ranking looks the same as last quarter, the slope tells you everything about the next quarter.

**How to talk to it.** *"Watch the colours across months. If a segment is shrinking month over month, that MSR is losing ground even if their total still looks fine. We catch declines here before they show up in the rankings."*

### Speaker bridge to Slide 9

*"That's the rep view. Now let's look at who they're meant to be calling on — the doctor universe."*

---

## SLIDE 9 · Doctor Universe — *"Coverage & Targeting"*

**What the room sees.** A 6-tile KPI strip (this is the doctor-heavy slide); then a 2:1 split with the Doctor Pyramid by MSR (left) and Speciality Headcount (right); a full-width HQ vs EX coverage chart below.

### KPI Strip — 6 tiles

- **Mapped Doctors.** Total count on the Doctor Master, with territory and speciality counts in the sub. *Why it matters:* the size of the universe we're playing in.
- **Super Core / VIP / Core** — three tiles showing tier composition. *Why it matters:* portfolio shape. A doctor universe weighted heavily Super Core/VIP is high-value but high-effort; weighted toward Core is broader but lower per-doctor yield.
- **Active Coverage.** % of mapped doctors who are "active" (their MSR billed in their city this period AND a mapped product showed up). *Why it matters:* the productivity headline. If we're below 50%, half the doctor master is wasted effort.
- **Join Health.** What % of Doctor Master MSRs matched the MSR file. *Why it matters:* this is a data-hygiene signal disguised as a KPI. Anything under 60% means the two files don't agree on rep names — and the rest of this slide should be read with caution. Above 80% = trust everything; under 60% = trust shapes but not specific percentages.

### Chart · Doctor Portfolio Pyramid by MSR

**What it shows.** One row per MSR, showing the relative mix of their doctor portfolio — violet segment = Super Core, gold = VIP, blue = Core. The total doctor count is on the right.

**Why it matters.** This is the *workload* chart. Two MSRs with the same doctor count can have completely different jobs — one carrying 30 Super Cores is doing high-stakes relationship work; another carrying 30 Cores is doing wide-net detailing. The pyramid says what each MSR is actually managing.

**How to talk to it.** *"Same total doctor count can hide totally different jobs. The MSRs with lots of violet are doing high-touch VIP work — fewer calls, deeper relationships. The MSRs heavy on blue are doing volume work — more calls, lighter touch. Both are legitimate, but they need different support."*

### Chart · Speciality Headcount

**What it shows.** Horizontal bar chart of the top 10 specialities in the mapped doctor universe, with count and % share.

**Why it matters.** This is the *what do we play in?* chart. If our biggest speciality is Cardiology and we don't have a strong cardio brand, that's a marketing gap. If our biggest speciality is General Medicine and our REDNIL cardio brand is the headline product, that's a misalignment that explains a lot of the targeting underperformance on Slide 8.

**How to talk to it.** *"Read this against our brand portfolio. If our biggest doctor speciality and our biggest brand division line up, we're well-positioned. If they don't — and often they don't — that's the conversation: are we calling on the right doctors, or do we need a brand acquisition?"*

### Chart · HQ vs Extension — Coverage & Strategy Adherence

**What it shows.** A grouped bar + line chart with two territory types (HQ — your headquarter towns; EX — extension territories) and three measures:
- **Light bar = Mapped Doctors** (the count we have on the master)
- **Solid blue bar = Active Doctors** (the count that's actually getting touched)
- **Gold line on the right axis = Strategy Adherence %** (% of the revenue from those territories coming from on-strategy products)

**Why it matters.** In Indian pharma, headquarter towns are the home base where reps live, and extension territories are the upcountry expansion. HQ usually gets all the attention because billing mechanically lands there (the stockist is there). EX is where the field-force discipline shows — because there's no auto-credit, the only way to win an EX town is by actually doing the work.

So this chart asks two questions:
1. **Coverage gap.** Are we actually working our EX towns, or just collecting names on the master?
2. **Adherence gap.** Is the revenue coming from on-strategy products or from whatever?

If HQ adherence is 70% but EX adherence is 30%, our extension reps are off-script. If EX coverage is below 40%, our extension towns aren't being worked at all.

**How to talk to it.** *"HQ is easy — we live there, billing lands there. EX is the test. Look at the active bar versus mapped bar on the EX side — if there's a big gap, we have doctors on paper that nobody is calling. Look at the gold line — that's our strategy reach. Low gold on EX means we're winning extensions on price or relationship, not on our brand strategy."*

### Speaker bridge to Slide 10

*"That completes the diagnostic. Now let's turn it into a plan — what we're going to do about it."*

---

## SLIDE 10 · Risks & Actions — *"What Happens Next"*

**What the room sees.** KPI strip; a 2-column row with the Return Rate Trend (left) and a Concentration Risk donut (right); then up to six action cards in a 3-column grid.

### KPI Strip — 4 tiles

- **Return Rate.** Restated for emphasis. *Why it matters:* this is the leakage number — we close on it because it's the cheapest revenue to win back (it's already been billed once).
- **Top 5 Share.** Restated customer concentration. *Why it matters:* the single biggest structural risk on the dashboard. Closing on it makes the room remember it.
- **High-Return SKUs.** Count of products with >5% return rate. *Why it matters:* gives you the count for the quality conversation — exactly how many SKUs need a returns root-cause analysis.
- **Declining SKUs.** Count of products down >10% MoM. *Why it matters:* gives you the count for the urgency conversation — how many products are slipping that we have to act on.

### Chart · Return Rate Trend

**What it shows.** Monthly return rate as a bar chart, colour-coded by severity (green ≤2%, amber 2–5%, red >5%), with a dotted line at the 1.5% pharma target.

**Why it matters.** We saw the absolute returns on Slide 2; this is the trend in *rate*. Returns can grow with volume and stay healthy — what we care about is whether the rate itself is creeping up. If we see three months of amber turning to red, something specific is breaking (a batch, an expiry wave, a damage incident at a depot).

**How to talk to it.** *"The dotted line at 1.5% is the industry target. Anything green is fine, amber is a watch, red is an active leakage problem. If we're consistently in the red, the next conversation is: expiry, damage, scheme adjustment, or stock-balancing — assign owners by category."*

### Chart · Concentration Risk — Top 5 Customer Share (Donut)

**What it shows.** A donut chart with the top 5 customers each shown as a slice in red/amber/gold/blue/violet and "Everyone else" as the remaining grey slice. The centre callout shows the top-5 combined share.

**Why it matters.** This is the most visceral concentration chart on the deck. When the room sees that 5 named customers eat 60–70% of the donut, the urgency of contract renewals and account protection lands harder than any percentage written in a table.

**How to talk to it.** *"Five names. That's how much of the business hinges on them. If we lose one — for any reason — we have to find an equivalent customer in 30 days. That's the protect-accounts strategy in one image."*

### Action Cards (up to 6, auto-ranked by ₹ impact)

These six cards are auto-generated from the data. Each card has a left-border colour indicating type — red (Protect from risk), amber (Intervene), green (Accelerate or Expand), violet (Realign strategy), gold (Defend). They're ranked by ₹ impact so the most important card is on the top-left.

**Why this section matters.** A presentation that ends in "interesting" is a presentation that wasted the room's time. This section closes with named, specific, owner-assignable actions:

- **Protect** — usually the biggest customer or the biggest single-customer dependency. The action is contract renewal + ABM relationship review.
- **Accelerate** — the fastest-growing product. The action is lift POB targets, sponsor a CME in the top customer cities, sample drop on the next beat cycle.
- **Fix** — the largest single returns leak. The action is decompose returns by reason (expiry / near-expiry / damage / scheme) and assign an owner per reason.
- **Intervene** — the most declining MSR. The action is joint field day this week, tour-plan-vs-actual audit, product-knowledge refresher.
- **Realign** — when overall targeting is <60%, the action is reset target-product priority for the quarter and reconfirm DCR captures match the priority portfolio.
- **Expand** — the fastest-growing territory. The action is capture the playbook and brief regional ABMs to replicate in the bottom-3 cities.
- **ABM Monthly Review** — the ABM whose team score lags the leader by >20 points. The action is set up joint field day with the bottom MSR on that team, plus tour-plan audit.

**How to talk to it.** Walk each card briefly — *"first action this quarter, protect [customer]"* / *"second, lift POB on [product]"* etc. Don't repeat what's on the card. Just point to the card and say what the owner has to do *this week*.

### Speaker bridge to Slide 11

*"Those are the current-period actions. Before we close, let's add the most important context: are these actions fixing a temporary month, or are they reversing a year-on-year pattern?"*

---

## SLIDE 11 · YoY Command Center — *"Are We Beating Last Year?"*

**What the room sees.** Four YoY KPI tiles, a current-vs-previous month mirror, a product velocity scatter, a winners/leaks bar chart, and a compact boardroom signals table. This slide activates when the `previous_sales` file is uploaded; it uses the same sales column mapping as the current-year `sales` file.

### KPI Strip — 4 tiles

- **YoY Net Delta.** Current net after returns minus previous-year net after returns for the active filters. *Why it matters:* this is the cleanest "are we ahead or behind last year?" number.
- **YoY Growth.** The same change as a percent. *Why it matters:* it normalises the rupee delta, especially when comparing a small month like May with a large quarter.
- **Product Retention.** How many previous-year SKUs are still present, plus new and not-repeated counts. *Why it matters:* separates genuine growth from churn masked by launches.
- **Customer Retention.** Previous-year buyers who also bought in the current year. *Why it matters:* a strong revenue year with weak customer retention means the base is being replaced, not deepened.

### Chart · Month Mirror — Current vs Previous

**What it shows.** Grouped bars for each month-of-year: previous year in muted grey, current year in blue, with a gold YoY% line. Selecting **May** in the filter bar turns this into May-current vs May-previous only.

**Why it matters.** This is the "seasonality truth serum." It stops the room from comparing a strong March to a weak April and calling it strategy. Same month vs same month is the fair comparison.

**How to talk to it.** *"Read this as month against its own shadow from last year. Blue above grey means we beat last year. Blue below grey means the month needs explanation. The gold line tells us whether the beat is material or just noise."*

### Chart · Product Velocity Radar

**What it shows.** Each product is a point: X-axis is previous-year revenue, Y-axis is current-year revenue. The diagonal line is parity. Products above the line gained ground; below the line lost ground. Bubble size reflects the absolute movement.

**Why it matters.** This is the fastest portfolio strategy chart in the deck. It separates:
- **Scale winners** — high previous-year base, even higher current-year revenue.
- **Breakouts** — low previous-year base, high current-year jump.
- **Leaks** — meaningful previous-year base, lower current-year revenue.
- **Dormant tail** — low both years, probably not worth field-force energy.

**How to talk to it.** *"Everything above this diagonal is working harder than last year. Everything below it is giving back ground. The big bubbles are where management attention belongs."*

### Chart · YoY Product Winners & Leaks

**What it shows.** Horizontal bars of the largest absolute product deltas. Green bars are products that added revenue vs previous year; red bars are products that leaked revenue.

**Why it matters.** This converts the scatter into a field-ready hit list. The green side tells the team what to scale. The red side tells the team what to rescue.

**How to talk to it.** *"The green names are our repeatable plays. The red names are not abstract decline; they are rupee leakage versus what we already proved we could do last year."*

### Table · Boardroom Signals

**What it shows.** Auto-generated prompts: total growth/gap, strongest product lift, biggest product leakage, best territory lift, sharpest customer drop, portfolio churn, and customer retention.

**Why it matters.** This is the executive summary of the comparison. It creates immediate owner-ready questions: protect which customer, recover which product, replicate which territory, and whether the business is growing by retention or replacement.

**How to talk to it.** Keep it crisp. *"Here are the signals I want owners against: one product to scale, one product to recover, one territory playbook to replicate, and one customer relationship to protect."*

### Closing the deck

After walking the action cards, close in three sentences:
1. *"That's our diagnosis — the trajectory, the drivers, and where the risk sits."*
2. *"The YoY lens tells us which of these are temporary movements and which are real year-on-year shifts."*
3. *"By next month's review I want to be able to come back and tick off four actions, with at least one product leak visibly recovering."*

---

## SLIDE 12 · Filtered Sales Register — *"Show Me the Rows"*

**What the room sees.** A filtered transaction table with a year-scope selector (`Current Year`, `Previous Year`, `Current + Previous`), four register KPIs, and an **Export Excel** button.

**What it shows.** Cleaned canonical sales-register rows after the active dashboard filters. The on-screen preview shows up to 300 rows for readability. Excel export includes every matching row, not only the preview.

**Why it matters.** This is the audit trail. When someone asks which bills sit behind a product decline, a return spike, or an April-vs-April gap, jump here and export the exact filtered rows.

**How to talk to it.** Use this as an appendix, not a mandatory presentation stop. *"We can drill to the bill-level rows behind any chart and export the filtered register for follow-up."*

---

## Appendix · Speaker Tips

**Pacing.**
- Slides 1, 2, 3, 4, 5 — 2 minutes each (set up the story, move through it briskly).
- Slides 6 — 2-3 minutes (territory map invites discussion).
- Slides 7, 8, 9 — 4 minutes each (this is where the field-force audience lives, slow down).
- Slide 10 — 4 minutes (current-period actions).
- Slide 11 — 5 minutes (YoY context and final management questions).
- Slide 12 — optional appendix for bill-level drill-down and export.

**Common audience questions and how to handle them.**

*"Why is my MSR ranked here?"* — Open the MSR Scorecard table, sort by their name, walk through their score components. The territory-fair scoring is your friend — "you can score 90 from a smaller territory if you execute the right way."

*"How is targeting effectiveness calculated?"* — It's the % of a rep's net revenue that came from products mapped to *their* doctors on the Doctor Master. We canonicalise brand names (REDNIL TAB 10 → REDNIL) so spelling variations don't muddy the match.

*"Why did returns spike in Month X?"* — Bring up the Sales Register tab (in the strategic dashboard if needed) and filter to that month and is_return=true. Walk through reason — usually one or two SKUs dominate.

*"Are we losing customers?"* — Compare Active Customers KPI from Slide 1 against historic numbers. Repeat Customers tile from Slide 5 also helps — a falling repeat-rate is the leading indicator of churn.

*"How do I compare only May?"* — Use the **All Months** dropdown in the filter bar and choose **May**. Current-year rows and previous-year rows are both restricted to May, regardless of calendar year.

*"Can I trust the YoY slide if previous_sales has different columns?"* — Only if the same mapping works. The dashboard deliberately applies the current Sales Register mapping to `previous_sales`; if the previous export has different headers or layout, re-export it in the same format.

*"Can you export the April rows for this product?"* — Pick **April**, choose the product, jump to Slide 12, choose the year scope, then click **Export Excel**. The export includes all filtered rows.

*"What's our Top 5 customer concentration trend?"* — Slide 11 gives customer retention and sharpest customer drop, but not a multi-year Top 5 concentration trend yet — note it as a follow-up.

**Tech tips.**

- Press **F** to enter fullscreen — the topbar and arrow nav stay accessible.
- **Arrow keys** to navigate; the navigation dots on the right also jump.
- The dashboard updates the slide counter automatically as you scroll.
- All charts have hover tooltips with exact numbers — useful when someone asks "what's the exact value of that bar?"
- If a chart looks empty, scroll past the slide and come back — the lazy rendering occasionally needs a second pass.

---

## Appendix · YoY Band Per-Slide Notes (v6)

Each slide now carries an **Embedded YoY Band** — a strip of comparable-period tiles between the headline KPIs and the main chart(s). Use the notes below in addition to the original per-slide blocks above.

### Slide 1 · Cover · YoY Band

Four tiles: **Cur FY Net (comp)**, **YoY Net Δ**, **YoY Growth %**, **Customer Retention**. Talk track: *"Beyond the current period, the comparable-window picture is — versus the same April-and-May last fiscal year — we are Δ. Our customer retention is X% of last year's buyers."* If retention < 45%, flag as a structural concern. Period chip in top-right reads the FY tags.

### Slide 2 · Revenue Momentum · YoY Band

Four tiles: **Current FY (comp)**, **Previous FY (comp)**, **YoY Δ**, **Best / Worst Month**. The trend chart is now a dual-FY overlay — grey bars = previous FY, blue = current FY, gold line = YoY %, red bars below = current-FY returns. Use the card-local Product filter to isolate a single SKU live.

### Slide 3 · Growth Story · YoY Revenue Bridge

The waterfall is the hero. Order: `Prev FY Net → Volume Δ → Price Δ → Mix Δ → New Biz → Lost Biz → Residual → Cur FY Net`. Walk it: *"Of our YoY Δ, X came from volume gains, Y from pricing, Z from new customers, and we gave A back to lost customers."* The side panel ranks Top 5 Accelerating / Top 5 Declining SKUs by YoY Δ (not MoM Δ anymore).

### Slide 4 · Product Portfolio · YoY Lens upgrade + Momentum Quadrant

Six YoY tiles now: **Cur Net · Prev Net · YoY Δ · Volume Δ · Price Δ · Share Shift**. The quadrant card next to it is the new strategy chart — **Stars / Rising / Cash Cows / Drag**. Stars sustain, Rising warrant investment, Cash Cows defend, Drag deprioritise. Card-local Product filter narrows both charts in sync.

### Slide 5 · Customer Base · YoY Band + Growth Attribution

YoY band: **YoY Δ · Retention · New · Lost · Top Gain · Top Drop**. The Growth Attribution donut splits the YoY swing into four colour-coded slices: green = existing-customer growth, gold = new customers, amber = existing-customer decline, red = lost customers. The customer × product combos table now shows YoY % for any combo present in both years.

### Slide 6 · Territory Map · Region YoY

YoY band: **Region YoY Δ · Expanding Regions · Top Region Lift · Sharpest Drop**. The Region YoY chart shows top 12 regions grouped cur-vs-prev with hover tooltips that surface the share-shift (pp). Card-local filter narrows to a specific region or product.

### Slide 7 · ABM Team · ABM YoY

YoY band: **Total ABM YoY Δ · Best Team · Worst Team · Teams Up/Down**. The ABM YoY chart shows grouped bars per ABM with a **rank-movement chip** (↑3 / ↓2) at the right of each bar — that's the team's position-change between FY years on net revenue. Use this to deflect "why is my team ranked here?": *"You are at rank N in current FY, were at rank M last FY — that's a Δ of (N−M) positions."*

### Slide 8 · MSR Performance · MSR YoY

Mirrors the ABM card at the rep grain. YoY band shows: **MSR YoY Δ · Top Mover ↑ · Sharpest Drop ↓ · Reps Up/Down**. Each rep bar carries a rank-movement chip. Combined with the existing on-strategy chart below, this is the deepest field-force diagnostic in the deck.

### Slide 9 · Doctor Universe · Inherited MSR YoY

Doctor data is point-in-time (no historical mapped-doctor records), so doctor YoY is **inherited from the MSR layer**. Four tiles: **MSR Pool YoY Δ · Active MSRs (cur vs prev) · On-Strategy % (with pp shift) · MSR Overlap**. Speaker line: *"Of last year's MSR base, X are still active this year. Of their revenue this year, Y% is on-strategy — Z pp shift versus last FY."*

### Slide 10 · Risks & Actions · YoY Watch

Four early-warning tiles: **Declining SKUs YoY · SKU Churn (+launched / −not-repeated) · Customers Lost · Top-5 Concentration**. The action cards now consider both MoM Δ AND YoY Δ — if a product was flat MoM but down −22% YoY, it surfaces as a YoY-Risk card. Two new card types: **YoY Risk** (red) and **YoY Watch** (amber).

### Slide 11 · Executive YoY Analysis Center (was YoY Command Center)

Wholesale rebuild. The control bar is a single card with five local filters (Product, Customer, Region, From, To) — every chart on this slide responds instantly. Layout:

- **Hero row**: Revenue Bridge waterfall + Product Momentum Quadrant.
- **Mirror row**: Month Mirror (cur vs prev by fiscal month) + Growth Attribution donut.
- **Top Movers row**: top 5 positive contributors (green) + top 5 negative contributors (red) — each hover shows share of total YoY movement.
- **Insights row**: Product Winners & Leaks bar + Boardroom Signals table.
- **Velocity Radar**: scatter showing each SKU as cur vs prev, above-diagonal = gained ground.

Boardroom Signals now produces up to ten insights with explicit attribution language: *"Product X contributed 34% of total growth"*, *"Top-5 customer share moved from 62% to 71%"*. Use these as direct talking points — read them aloud as written.

### Slide 12 · Sales Register · Data Grid

The register is now a proper data grid: **search box** (matches customer / product / bill / batch), **click-to-sort** any column, **per-column text filter** (toggle with the ⌕ Column filter button), **pagination** (25/50/100/250 rows per page), **sticky header**, **YoY % column** for any row where a comparable previous-FY value exists, and three exports:

- **↓ Export view (.xlsx)** — the current page in current sort + filter state.
- **↓ Export all (.xlsx)** — every filtered row (no page slice).
- **↓ CSV** — same as Export all but as CSV.

Use this for live drill-down: pick a fiscal month, search a customer name, sort by Sales Value, export to email.

---

## Appendix · Card-Local Filters · Cheat-Sheet

The presenter does NOT need to leave a slide to answer "what about Product X?". Every YoY card has its own filter strip in the card head:

| Slide / Card | Local filters |
|---|---|
| 2 · Momentum chart | Product · From-month · To-month |
| 3 · Revenue Bridge | Product · Customer · Region |
| 4 · Product YoY Lens | Product · From-month · To-month |
| 5 · Customer YoY | Customer · Region · From-month · To-month |
| 6 · Region YoY | Region · Product · From-month · To-month |
| 7 · ABM YoY | ABM · Product · From-month · To-month |
| 8 · MSR YoY | MSR · Product · From-month · To-month |
| 11 · Analysis Controls | Product · Customer · Region · From-month · To-month |

The global filter bar still exists for deck-wide context (e.g., "this whole walkthrough is about Q1"). Card-local filters narrow *within* the global selection — they do not override it.
