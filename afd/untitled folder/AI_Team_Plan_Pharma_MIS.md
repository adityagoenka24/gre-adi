# AI Agentic Team Plan — Pharma Sales MIS & Dashboarding

**Prepared for:** Adi's Pharma Analytics Engagement  
**Date:** June 2026  
**Objective:** Build a 4-agent AI team that ingests raw pharma sales data (Excel/CSV from C&F agents, stockists, multiple ERPs) and delivers production-quality MIS dashboards with minimal token spend.

---

## Overview

| # | Agent | Role | Primary Model | Secondary Model |
|---|-------|------|--------------|-----------------|
| 1 | **Data Standardizer** | Clean & unify all incoming raw files | Claude Haiku 4.5 | Claude Sonnet 4.6 (edge cases) |
| 2 | **Analytics Engine** | KPIs, business logic, computed metrics | Claude Sonnet 4.6 | — |
| 3 | **Dashboard Builder** | HTML/JS dashboard generation | Claude Sonnet 4.6 | — |
| 4 | **QA Validator** *(recommended addition)* | Validate numbers, flag anomalies pre-publish | Claude Haiku 4.5 | — |

**Human checkpoint:** After QA Validator outputs its report, you review once and approve. Nothing publishes automatically.

---

## Why 4 Agents, Not 3

Your 3-team design is right in spirit. The QA Validator is strongly recommended as a 4th because:
- Pharma MIS goes to senior stakeholders — one wrong number destroys trust
- It costs almost nothing (Haiku) but catches calculation errors, mismatched totals, and data anomalies before you see the dashboard
- It replaces the mental load of you manually cross-checking every dashboard run

---

## Agent 1: Data Standardizer

### What it does
Receives raw Excel/CSV from any C&F agent or stockist (SAP exports, Tally, SwilERP, custom formats) and outputs a **canonical, relationship-ready dataset** in a fixed schema.

### Outputs
- `sales_transactions.csv` — one row per bill line item
- `master_products.csv` — product master (product ID, name, pack, MRP, HSN)
- `master_customers.csv` — party master (party ID, name, station, beat, ABM zone)
- `master_msr.csv` — MSR master (MSR ID, name, territory, ABM)
- `master_doctors.csv` — doctor master (doctor ID, name, specialization, station, linked MSR)
- `cleaning_report.json` — what was changed, what was rejected, what needs your attention

### Canonical Schema (Sales Transactions)

```
bill_date | bill_no | stockist_id | stockist_name | customer_id | customer_name |
station | product_id | product_name | batch_no | expiry | hsn | 
qty_sold | qty_returned | net_qty | mrp | sale_rate | 
gross_value | discount | net_value | gst | invoice_value |
msr_id | msr_name | abm_id | abm_name | region | state
```

### What it standardizes
- Column name aliases (e.g., "Net Amt", "Net Amount", "Invoice Amt" → `net_value`)
- Date formats (DD/MM/YYYY, MM-DD-YY, Excel serial dates → ISO 8601)
- Product ID reconciliation across sources (same product, different codes)
- Duplicate bill detection
- Subtotal/total rows removal (common in SwilERP exports)
- Negative qty = return detection
- GST column splitting/merging as needed

### Model Strategy
- **Haiku 4.5** for routine weekly runs where schema is already mapped
- **Sonnet 4.6** only when a *new* source file arrives with an unknown format — it reads the file structure, proposes a column mapping, and saves it to the mapping library for Haiku to reuse next time

### Token optimization
Build a **Column Mapping Library** (`column_mappings.json`) after Sonnet maps each new source once. Haiku uses only that JSON on every subsequent run — Sonnet is never called again for the same source. This means each new C&F agent costs one Sonnet call, then zero forever.

---

## Agent 2: Analytics Engine

### What it does
Consumes the standardized data from Agent 1 and computes **all KPIs, business logic, and analytical outputs** needed for dashboards. Think of this as your backend data scientist — it never touches visualization.

### Outputs
- `kpi_summary.json` — aggregated KPIs at all levels (national, state, ABM, MSR, station, product)
- `computed_tables/` — pre-aggregated DataFrames for each dashboard module
- `logic_library.py` — reusable Python functions for every KPI (persisted, not recomputed)

### Core KPIs it handles (pharma-specific)
- **Sales Performance:** Primary vs Secondary sales, MoM/YoY growth, sell-through rate
- **MSR Analytics:** MSR-wise sales, doctor coverage, visit-to-sale conversion (when doctor data available)
- **ABM Territory:** ABM-wise contribution, territory growth vs target
- **Product Analytics:** Top movers, slow movers, contribution margin by product
- **Returns Analysis:** Return rate by product, by customer, by MSR
- **Inventory:** Stock aging, near-expiry alert (from inventory files when provided)
- **Receivables:** Overdue aging buckets (from outstanding files when provided)
- **Ad hoc:** Any new KPI you define is added to `logic_library.py` and reused going forward

### Model Strategy
- **Sonnet 4.6** — this agent handles the most complex reasoning (multi-level aggregations, growth rate logic, edge cases in pharma returns)
- Sonnet is called ONCE per weekly run to check if any logic needs updating, then executes Python via code interpreter
- All KPI logic is **written to `logic_library.py`** — next week Sonnet reads the existing library and only writes delta logic for new requirements

### Token optimization
- System prompt = minimal (just role + output format)
- Context = current week's cleaned data summary + the logic library (not the full dataset)
- Full data processing happens in Python code the agent generates, not inside the LLM context window

---

## Agent 3: Dashboard Builder

### What it does
Takes `kpi_summary.json` + `computed_tables/` from Agent 2 and generates **self-contained, single-file HTML dashboards** using Plotly.js — no server required, opens in any browser.

### Outputs
- `dashboard_sales.html` — Sales view (for MSRs, ABMs, field staff — no margins)
- `dashboard_management.html` — Full view with P&L, margins, inventory value (password-protected)
- `dashboard_adhoc_[name].html` — Any one-off dashboard on request

### What it builds
- KPI cards with MoM/YoY delta indicators
- Interactive charts (filterable by state, ABM, MSR, product, date range)
- Ranking tables (top/bottom products, MSRs, customers)
- Drill-down from national → state → ABM → MSR → station
- Expiry and returns heatmaps
- Receivables aging bar charts

### Design standards (already proven in your existing dashboards)
- Single-file HTML, no external dependencies (all JS/CSS bundled inline)
- Mobile-responsive
- Pharma color palette (clean, professional)
- Export buttons for each chart and table

### Model Strategy
- **Sonnet 4.6** for generating/modifying dashboard HTML
- Agent reads your existing `dashboard_sales.html` (from your previous engagement) as a **template reference** — this prevents re-inventing the design on every run and dramatically cuts tokens
- Only *changed* modules are regenerated each week, not the entire dashboard from scratch

### Token optimization
- Existing dashboard as template = Sonnet doesn't design from scratch
- Modular dashboard structure: each section is a standalone function in the HTML — only modified sections are regenerated
- Charts are generated from pre-aggregated JSON (Agent 2's output), not raw data

---

## Agent 4: QA Validator *(Strongly Recommended)*

### What it does
Before you see the final dashboard, this agent runs an automated sanity check on the numbers and flags anything suspicious.

### Checks it runs
- Total invoice value in dashboard == sum in raw data (reconciliation)
- No negative sales (unless returns file was provided)
- YoY growth not exceeding ±200% (flags outliers for your review)
- All MSRs in master appear in sales (or flags missing)
- Expiry dates are in the future (catches data entry errors)
- Duplicate bill numbers detected
- State totals add up to national total

### Output
- `qa_report.html` — a simple pass/fail report with details on every failed check
- This lands on your screen BEFORE the dashboard link

### Model Strategy
- **Haiku 4.5** — purely mechanical checks, Python execution, no complex reasoning needed
- Cost: ~$0.01–0.05 per weekly run

---

## Weekly Pipeline Flow

```
MONDAY (data drop day)
─────────────────────────────────────────────────────────────────
[You]           Drop Excel/CSV files into /inbox/ folder

[Agent 1]       Data Standardizer activates automatically
                → Cleans, standardizes, outputs canonical CSVs
                → Generates cleaning_report.json
                (New source? Sonnet maps it once → saved to mapping library)

[Agent 2]       Analytics Engine activates on clean data
                → Runs logic_library.py against new data
                → Adds any new KPIs requested that week
                → Outputs kpi_summary.json + computed_tables/

[Agent 3]       Dashboard Builder activates
                → Reads existing dashboard template
                → Regenerates only changed sections
                → Outputs dashboard_sales.html + dashboard_management.html

[Agent 4]       QA Validator activates
                → Runs all reconciliation checks
                → Outputs qa_report.html

────────────────────────────────────────────────────
[YOU REVIEW]    Open qa_report.html (2 min scan)
                Open dashboards in browser
                ✅ Approve → send to client
                ❌ Flag issue → feed error back to relevant agent
────────────────────────────────────────────────────
```

---

## Model Recommendations & Cost Strategy

### Model Assignments

| Agent | Task Type | Model | Why |
|-------|-----------|-------|-----|
| Data Standardizer (known source) | Routine execution | **Claude Haiku 4.5** | Cheap, fast, follows rules well |
| Data Standardizer (new source) | Schema inference | **Claude Sonnet 4.6** | Better reasoning, used once per source |
| Analytics Engine | Complex logic + code gen | **Claude Sonnet 4.6** | Best reasoning-to-cost ratio |
| Dashboard Builder | HTML/JS generation | **Claude Sonnet 4.6** | Excellent code quality, knows Plotly |
| QA Validator | Mechanical checks | **Claude Haiku 4.5** | Cheap, no reasoning needed |
| Ad hoc requests | Complex one-offs | **Claude Sonnet 4.6** | Use Opus only if Sonnet fails |

### Why not Codex or DeepSeek?

**Codex (OpenAI o-series):**
- Strong at pure code generation, but weak on reasoning about *what* the code should do
- Doesn't understand pharma business context well without heavy prompting
- More expensive at scale for reasoning tasks
- Data privacy: OpenAI uses data for training by default unless enterprise tier

**DeepSeek:**
- Excellent cost per token, strong coder
- **Hard blocker for pharma client work:** DeepSeek servers are in China — sending client sales data there is a serious data privacy/compliance risk. Do not use for any client data pipeline.

**Recommendation: Haiku + Sonnet is your sweet spot.**  
Haiku handles 60–70% of weekly token volume (routine cleaning + QA). Sonnet handles the 30–40% that needs intelligence. Opus is kept in reserve for complex one-off analytical requests.

### Estimated Weekly Token Cost (rough)

| Agent | Tokens/run | Model | Est. Cost |
|-------|-----------|-------|-----------|
| Data Standardizer | ~50K | Haiku | ~$0.04 |
| Analytics Engine | ~80K | Sonnet | ~$0.24 |
| Dashboard Builder | ~100K | Sonnet | ~$0.30 |
| QA Validator | ~20K | Haiku | ~$0.02 |
| **Total** | **~250K** | **Mixed** | **~$0.60/week** |

*These drop significantly as logic libraries and mapping files build up (less is re-derived each week).*

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| **Orchestration** | Python scripts (Claude Code compatible) | Simple trigger scripts per agent — no over-engineered framework |
| **Agent framework** | Anthropic Python SDK (`anthropic` + `claude-code-sdk`) | Direct API calls, full control over prompts and costs |
| **File storage** | Local folder structure (see below) | Weekly folders, git-versioned for audit trail |
| **Data processing** | Python + Pandas + OpenPyXL | Agents generate and run Python code |
| **Visualization** | Plotly.js (bundled in HTML) | No server needed, offline-capable |
| **Scheduling** | Cowork scheduled task / cron | Auto-trigger pipeline when files are dropped |
| **Version control** | Git (local) | Track all dashboard versions and logic changes |

### Recommended Folder Structure

```
/pharma-mis/
├── inbox/                    ← Drop raw files here
├── processed/
│   ├── 2026-W24/
│   │   ├── raw/             ← Original files archived
│   │   ├── clean/           ← Agent 1 output
│   │   ├── computed/        ← Agent 2 output
│   │   └── dashboards/      ← Agent 3 output
├── library/
│   ├── column_mappings.json ← Agent 1's learned mappings
│   ├── logic_library.py     ← Agent 2's KPI functions
│   └── dashboard_template/  ← Agent 3's base templates
├── qa_reports/              ← Agent 4 output
└── agents/
    ├── agent1_standardizer.py
    ├── agent2_analytics.py
    ├── agent3_dashboard.py
    └── agent4_qa.py
```

---

## Handling Your Existing Dashboard

Your existing dashboard from the previous engagement becomes **Agent 3's primary template**. Here's the integration plan:

1. Drop your existing `dashboard_sales.html` into `/library/dashboard_template/`
2. Agent 3 reads it on first run and extracts: color palette, layout structure, chart types, section names
3. It creates a `template_spec.json` from this analysis
4. All future dashboards inherit from this spec — your client sees visual continuity
5. Enhancements (new sections, new KPIs) are added on top of the existing design

---

## Suggested Phase Rollout

**Week 1–2: Foundation**
- Set up folder structure
- Build Agent 1 with mapping library starter (based on your existing SwilERP data)
- Test with 2–3 known data sources

**Week 3–4: Analytics**
- Build Agent 2 with core KPI set (sales, MSR, ABM, product)
- Define logic_library.py with your 20 most common metrics

**Week 5–6: Dashboard + QA**
- Integrate Agent 3 using your existing dashboard as template
- Build Agent 4 QA checks
- Full pipeline test run

**Week 7+: Steady state**
- Weekly automated runs
- Add new KPIs and data sources incrementally
- Each new C&F source = one Sonnet mapping call → permanent addition to library

---

## What You Should Add When Ready

- **ROI Agent (future):** When you get ROI/promotional spend data, add a 5th agent that computes ROI by MSR/product/zone — this is a natural extension
- **Forecast Agent (future):** Once 6+ months of clean historical data accumulates, a lightweight forecasting agent can project next month's secondary sales by territory

---

*This plan is designed to be built incrementally — start with Agent 1 + Agent 2, get the data layer solid, then add the dashboard and QA layers.*
