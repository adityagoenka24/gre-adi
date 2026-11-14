# PharmaBoard · One-Pager Presentation Dashboard — Handoff v1

**File produced:** `dashboard_onepager.html`
**Built from:** `dashboard_presentation.html` (the full 13-slide v8 deck)
**Owner:** Adi (goenka.aditya.kol@gmail.com)
**Audience the one-pager targets:** Sales leadership / VP Sales (no margins, no P&L — sales view only)

This document is a **complete rebuild recipe**. If `dashboard_onepager.html` is ever lost, you can recreate it from a fresh copy of `dashboard_presentation.html` by following §7 exactly. Everything else (§1–§6, §8–§10) explains *why* it is built this way so you can change it safely.

---

## 1. What this is (and the core idea)

The full deck (`dashboard_presentation.html`) has **13 slides and ~40 charts**. The one-pager collapses the *presentation-worthy* subset into **three tabbed screens**, plus the two data registers as their own tabs:

| Tab | Screen | Holds |
|---|---|---|
| 0 | **Revenue & Products** | 5 KPI cards · Monthly Trend (CY vs PY) hero · Top 10 Products · Portfolio Product Mirror · Actions strip |
| 1 | **Customers & Regions** | Customers (This-FY ↔ YoY toggle) · Regions (This-FY ↔ YoY toggle) · Actions strip |
| 2 | **Team & Doctors** | MSR (Net Rev ↔ YoY toggle) · ABM (Latest-vs-Prior ↔ YoY toggle) · Coverage & Strategy Adherence · Actions strip |
| 3 | **Sales Register** | the searchable sales data grid (moved as-is) |
| 4 | **Field Register** | the ABM·MSR·Party·Revenue grid (moved as-is) |

**The central architectural decision: re-home, don't rebuild.**
We do **not** re-implement any chart. The full deck already renders every chart we need with carefully reconciled v8 net-of-returns math. The one-pager:

1. lets the original deck render its slides (hidden, off-screen),
2. **moves the specific `.card` DOM nodes we want** (each contains one Plotly chart) into the new tab screens,
3. builds its own **KPI cards** and **Actions strips** from the same engine helpers,
4. hides the original deck/nav and shows the tab UI.

Because Plotly charts are looked up by their container **id** (`ch-momentum`, `ch-topcust`, …), moving the node to a new parent does not break re-rendering: when a filter changes, the engine redraws into the same id wherever it now lives. **This is why every number reconciles to the full deck exactly — there is zero duplicated math.**

---

## 2. Screen-by-screen spec

### KPI cards (Screen 0) — 5 cards, computed in the controller's `renderKPIs()`

| # | Card | Value | Chip | Sub-line |
|---|---|---|---|---|
| 1 | Net Revenue | `summarize(FS).net` → `fmtMoney` | YoY %: `safeGrowth(summarize(FS_CUR_COMP).net, summarize(FS_PREV_COMP).net)` | Latest month label + value from `monthBuckets(FS)` |
| 2 | MoM Growth | `safeGrowth(last.net, prev.net)` from `monthBuckets(FS)` | growing/slowing | Prior month value |
| 3 | Return Drag | `fmtPct(summarize(FS).retPct,1)` (= R/Gross) | above/at 1.5% target | Leakage = `fmtMoney(s.ret)` |
| 4 | Active Customers | `summarize(FS).custs` | — | Top customer (by `netAfterReturns`) name + value |
| 5 | Top Product | top `productStats(FS)` by `.net` → name | — | Its net + % of total net |

All five recompute on every filter change (the controller wraps `applyF`).

### Charts per screen — each is an existing card moved by container id

| Screen | Chart card title | Container id | Rendered by (slide fn) |
|---|---|---|---|
| 0 | Monthly Revenue Trend · CY vs PY (hero) | `ch-momentum` | `renderMomentum()` (slide 2) |
| 0 | Top 10 Products by Net Revenue | `ch-topprod` | `renderProductPortfolio()` (slide 4) |
| 0 | Portfolio Product Mirror | `ch-prod-yoy` | `renderProductPortfolio()` → `renderProductYoYLens()` (slide 4) |
| 1 | Top 10 Customers (This FY) | `ch-topcust` | `renderCustomerBase()` (slide 5) |
| 1 | Customer YoY — CY vs PY | `ch-cust-yoy` | `renderCustomerBase()` (slide 5) |
| 1 | Revenue by Region (This FY) | `ch-region` | `renderTerritoryMap()` (slide 6) |
| 1 | Region YoY — CY vs PY | `ch-region-yoy` | `renderTerritoryMap()` (slide 6) |
| 2 | MSR Net Revenue | `ch-msr-sales` | `renderMSRPerformance()` (slide 8) |
| 2 | MSR YoY — CY vs PY | `ch-msr-yoy` | `renderMSRPerformance()` (slide 8) |
| 2 | ABM Revenue — Latest vs Prior | `ch-abm-bars` | `renderABMTeam()` (slide 7) |
| 2 | ABM YoY — CY vs PY | `ch-abm-yoy` | `renderABMTeam()` (slide 7) |
| 2 | HQ vs Extension — Coverage & Strategy Adherence | `ch-hq-ex` | `renderDoctorUniverse()` (slide 9) |
| 3 | Sales Register grid | `register-grid` (its `.card`) | `renderSalesRegister()` (slide 12) |
| 4 | Field Register grid | `ff-grid` (its `.card`) | `renderFieldRegister()` (slide 13) |

> **Important:** we move only these cards. Every *other* container the slide functions write to (e.g. `ch-treemap`, `ch-pareto`, `ch-terr-opp`, `ch-abm-growth`, `ch-targeting`, `ch-spec-headcount`, the strips/tables) **stays inside the hidden deck**. That is deliberate — it means force-rendering those slides never throws on a missing node.

### Toggles ("YoY twins")

Four topics each render as **one visible chart with a 2-way switch** instead of two boxes. Config lives in the controller's `TOG` object:

| Group | Switch values → chart id | Default |
|---|---|---|
| `cust` | `cy` → `ch-topcust` · `yoy` → `ch-cust-yoy` | `cy` |
| `region` | `cy` → `ch-region` · `yoy` → `ch-region-yoy` | `cy` |
| `msr` | `cy` → `ch-msr-sales` · `yoy` → `ch-msr-yoy` | `cy` |
| `abm` | `mom` → `ch-abm-bars` · `yoy` → `ch-abm-yoy` | `mom` |

`opTog(group,val)` shows the chosen card, hides the other, marks the switch button `.on`, and calls `Plotly.Plots.resize` on the now-visible chart (needed because it may have been drawn while hidden = 0-width).

### Actions for the room

Built from the engine's existing `buildActions()` (returns objects with `lbl`, `tone`, `title`, `meta`). The controller buckets them by `lbl` onto the three screens:

| Screen | Action labels shown |
|---|---|
| 0 (Revenue & Products) | `Accelerate`, `Fix` |
| 1 (Customers & Regions) | `Protect`, `Expand` |
| 2 (Team & Doctors) | `Intervene`, `Realign` |

---

## 3. The reusable engine it depends on

The controller calls these **existing** globals/helpers from the main script (do not redefine them):

- **Data globals:** `FS` (current-FY filtered rows), `FS_CUR_COMP` / `FS_PREV_COMP` (comparable-window CY/PY), set by `applyF()`.
- **Metrics:** `summarize(rows)` → `{net, ret, gross, retPct, qty, bills, custs, prods}`; `monthBuckets(rows)`; `netAfterReturns(rows)`; `productStats(rows)`; `groupRows(rows, keyFn)`; `safeGrowth`, `safePct`.
- **Format:** `fmtMoney`, `fmtPct`, `fmtNum`, `shortName`, `esc`, `sortBy` (⚠ `sortBy` defaults to **descending**, so `sortBy(arr, fn)[0]` is the top item).
- **Render dispatch:** `renderSlide(n)` (lazy, idempotent via `RENDERED_SLIDES`); `applyF()`; `launchDashboard()`.

---

## 4. Navigation behaviour

- Tabs are clickable (`opGo(i)`).
- The original arrow buttons and keyboard ←/→ are **repurposed**: the controller overrides `window.navSlide(delta)` to move between tabs (0–4) and stubs out `window.goToSlide` (the old nav dots are hidden).
- The original `.deck`, `.nav-dots`, `.arrow-nav`, and `.slide-counter` are hidden once the one-pager builds.

---

## 5. Data sources & load

Unchanged from the full deck. On launch you either (a) auto-fetch from the GitHub repo, or (b) upload the four ERP exports:

| File | Role |
|---|---|
| `sales.xls` | Current FY sales (FY26-27) |
| `previous_sales.xls` | Previous FY sales (FY25-26) |
| `msr.xlsx` | Customer → MSR → ABM mapping |
| `Doctor_Master.xlsx` | Doctor universe (unlocks Coverage chart) |

After mapping is confirmed, `launchDashboard()` cleans data, sets `FS` etc., renders slide 1, and lazily renders the rest. The controller hooks the **end** of `launchDashboard` to build the one-pager ~1s later.

---

## 6. The two layout bugs that were fixed (read before editing CSS)

The full deck's scroll model: `#app{position:fixed;inset:0;display:flex;flex-direction:column}` with **`.deck{flex:1;overflow-y:auto}`** as the only scroller; `body{overflow:hidden}`.

**Bug:** the first build added `#op-root` as a plain block child of `#app` with no flex sizing. Because its content is tall and `min-height:auto`, flex couldn't shrink it, so the shrink pressure fell on the topbar and **filter bar (squashed to near-invisible)**, and nothing was a scroll container (**page wouldn't scroll**).

**Fix:** make `#op-root` the scroller in place of `.deck`:
```css
#op-root{flex:1;min-height:0;overflow-y:auto;padding:0 26px 40px}
```
`min-height:0` is the critical part — it lets the flex item shrink below content height so its own `overflow-y:auto` engages. The sticky `.op-tabs` then pin to the top of `#op-root` while the topbar + filter bar keep their natural height above it.

---

## 7. FULL REBUILD RECIPE (from a clean `dashboard_presentation.html`)

> Goal: turn a fresh copy into `dashboard_onepager.html` with **three edits**. No engine code is modified — we only *append*.

**Step 0 — copy the file**
```
cp dashboard_presentation.html dashboard_onepager.html
```

**Step 1 — inject the CSS.** Find the first `</style>` (end of the main `<style>` in `<head>`) and paste this block immediately **before** it:

```css
/* ═══════════════ ONE-PAGER OVERLAY ═══════════════ */
/* op-root becomes the flex scroller (replacing .deck) so the topbar + filter bar
   keep their natural height and the screen content scrolls inside op-root. */
#op-root{flex:1;min-height:0;overflow-y:auto;padding:0 26px 40px}
#op-root::-webkit-scrollbar{width:8px}
#op-root::-webkit-scrollbar-track{background:transparent}
#op-root::-webkit-scrollbar-thumb{background:rgba(255,255,255,.10);border-radius:4px}
#op-root::-webkit-scrollbar-thumb:hover{background:rgba(244,207,107,.4)}
.op-tabs{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:8px;
  padding:14px 0 12px;background:linear-gradient(180deg,var(--bg) 70%,transparent);margin-bottom:6px}
.op-tab{font-family:var(--display);font-weight:800;font-size:13px;letter-spacing:.01em;
  color:var(--tx3);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  padding:9px 16px;border-radius:11px;cursor:pointer;transition:all .16s;white-space:nowrap}
.op-tab:hover{color:var(--tx);border-color:rgba(255,255,255,.18)}
.op-tab.active{color:#fff;background:linear-gradient(135deg,var(--acc),#3a6fd8);border-color:transparent;
  box-shadow:0 6px 18px rgba(58,111,216,.32)}
.op-tab.reg{font-size:12px;color:var(--tx3);background:transparent}
.op-tab.reg.active{background:rgba(255,255,255,.1);color:#fff;box-shadow:none}
.op-tab-spacer{flex:1}
.op-screen{display:none;animation:opfade .22s ease}
.op-screen.active{display:block}
@keyframes opfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.op-screenhead{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:4px 0 14px}
.op-eyebrow{font-family:var(--display);font-weight:800;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--acc);margin-bottom:4px}
.op-h2{font-family:var(--display);font-weight:800;font-size:24px;color:#fff;margin:0;letter-spacing:-.01em}
.op-period{text-align:right;font-size:12px}
.op-period .lbl{display:block;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;font-size:10px}
.op-period .val{font-family:var(--display);font-weight:800;color:var(--tx);font-size:13px}
.op-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:16px}
.op-kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 16px 14px;position:relative;overflow:hidden}
.op-kpi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--acc)}
.op-kpi.blue::before{background:var(--acc)} .op-kpi.green::before{background:var(--green)}
.op-kpi.red::before{background:var(--red)} .op-kpi.amber::before{background:var(--amber)}
.op-kpi.gold::before{background:var(--gold)} .op-kpi.violet::before{background:var(--violet)}
.op-kpi .lbl{font-family:var(--display);font-weight:800;font-size:11px;letter-spacing:.06em;
  text-transform:uppercase;color:var(--tx3);margin-bottom:7px}
.op-kpi .val{font-family:var(--display);font-weight:800;font-size:25px;color:#fff;line-height:1.05;letter-spacing:-.02em}
.op-kpi .sub{font-size:11.5px;color:var(--tx2);margin-top:7px;line-height:1.35}
.op-kpi .chip{display:inline-block;font-family:var(--display);font-weight:800;font-size:11px;
  padding:2px 8px;border-radius:7px;margin-top:8px}
.op-kpi .chip.up{background:rgba(34,211,154,.16);color:var(--green)}
.op-kpi .chip.down{background:rgba(240,72,72,.16);color:var(--red)}
.op-kpi .chip.neutral{background:rgba(255,255,255,.08);color:var(--tx2)}
.op-mount{margin-bottom:16px}
.op-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;align-items:start}
.op-toggcol{display:flex;flex-direction:column;gap:10px}
.op-togghead{display:flex;align-items:center;justify-content:space-between;gap:10px}
.op-togg-lbl{font-family:var(--display);font-weight:800;font-size:13px;color:var(--tx);letter-spacing:.02em}
.op-switch{display:inline-flex;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:3px}
.op-switch button{font-family:var(--display);font-weight:800;font-size:11px;color:var(--tx3);
  background:transparent;border:0;padding:5px 11px;border-radius:7px;cursor:pointer;transition:all .14s}
.op-switch button.on{background:var(--acc);color:#fff}
.op-toggbody>.card,.op-mount>.card,.op-grid2>.card{margin:0}
.op-actions-wrap{margin-top:6px}
.op-act-title{font-family:var(--display);font-weight:800;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.op-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.op-actions:empty::after{content:'No actions surface from current data.';color:var(--tx3);font-size:12px}
.op-act{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:13px 14px;border-left:4px solid var(--acc)}
.op-act.red{border-left-color:var(--red)} .op-act.green{border-left-color:var(--green)}
.op-act.amber{border-left-color:var(--amber)} .op-act.gold{border-left-color:var(--gold)}
.op-act.violet{border-left-color:var(--violet)}
.op-act .albl{font-family:var(--display);font-weight:800;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.op-act h4{font-family:var(--display);font-weight:800;font-size:14px;color:#fff;margin:5px 0 4px}
.op-act .ameta{font-size:11.5px;color:var(--tx2);line-height:1.4}
@media(max-width:1100px){.op-kpis{grid-template-columns:repeat(2,1fr)}.op-grid2{grid-template-columns:1fr}.op-actions{grid-template-columns:1fr}}
```

**Step 2 — inject the HTML overlay.** Find the deck close + nav dots, which look like:
```html
  </div>

  <!-- Navigation dots -->
  <div class="nav-dots" id="nav-dots"></div>
```
Insert this block **between** the `</div>` (deck close) and the `<!-- Navigation dots -->` comment:

```html
  <!-- ═══════════════ ONE-PAGER OVERLAY (3 presentation screens + 2 registers) ═══════════════ -->
  <div id="op-root" style="display:none">
    <div class="op-tabs" id="op-tabs">
      <button class="op-tab active" data-tab="0" onclick="opGo(0)">Revenue &amp; Products</button>
      <button class="op-tab" data-tab="1" onclick="opGo(1)">Customers &amp; Regions</button>
      <button class="op-tab" data-tab="2" onclick="opGo(2)">Team &amp; Doctors</button>
      <span class="op-tab-spacer"></span>
      <button class="op-tab reg" data-tab="3" onclick="opGo(3)">Sales Register</button>
      <button class="op-tab reg" data-tab="4" onclick="opGo(4)">Field Register</button>
    </div>

    <!-- SCREEN 1 · REVENUE & PRODUCTS -->
    <section class="op-screen active" id="op-screen-0">
      <div class="op-screenhead">
        <div><div class="op-eyebrow">01 · Revenue &amp; Products</div><h2 class="op-h2">AFD Hospicare · Sales Pulse</h2></div>
        <div class="op-period"><span class="lbl">Active period</span><span class="val" id="op-period">—</span></div>
      </div>
      <div class="op-kpis" id="op-kpis"></div>
      <div class="op-mount" id="op-hero-mount"></div>
      <div class="op-grid2" id="op-prod-mount"></div>
      <div class="op-actions-wrap"><div class="op-act-title">▸ Actions for the room</div><div class="op-actions" id="op-act-0"></div></div>
    </section>

    <!-- SCREEN 2 · CUSTOMERS & REGIONS -->
    <section class="op-screen" id="op-screen-1">
      <div class="op-screenhead">
        <div><div class="op-eyebrow">02 · Customers &amp; Regions</div><h2 class="op-h2">Who Buys &amp; Where</h2></div>
        <div class="op-period"><span class="lbl">Comparable window</span><span class="val" id="op-period-2">—</span></div>
      </div>
      <div class="op-grid2">
        <div class="op-toggcol">
          <div class="op-togghead"><span class="op-togg-lbl">Customers</span>
            <div class="op-switch" id="op-sw-cust">
              <button class="on" data-v="cy"  onclick="opTog('cust','cy')">This FY</button>
              <button data-v="yoy" onclick="opTog('cust','yoy')">YoY vs PY</button>
            </div>
          </div>
          <div class="op-toggbody" id="op-cust-mount"></div>
        </div>
        <div class="op-toggcol">
          <div class="op-togghead"><span class="op-togg-lbl">Regions</span>
            <div class="op-switch" id="op-sw-region">
              <button class="on" data-v="cy"  onclick="opTog('region','cy')">This FY</button>
              <button data-v="yoy" onclick="opTog('region','yoy')">YoY vs PY</button>
            </div>
          </div>
          <div class="op-toggbody" id="op-region-mount"></div>
        </div>
      </div>
      <div class="op-actions-wrap"><div class="op-act-title">▸ Actions for the room</div><div class="op-actions" id="op-act-1"></div></div>
    </section>

    <!-- SCREEN 3 · TEAM & DOCTORS -->
    <section class="op-screen" id="op-screen-2">
      <div class="op-screenhead">
        <div><div class="op-eyebrow">03 · Team &amp; Doctors</div><h2 class="op-h2">Field Force &amp; Coverage</h2></div>
        <div class="op-period"><span class="lbl">Manager grain</span><span class="val">ABM → MSR → Doctor</span></div>
      </div>
      <div class="op-grid2">
        <div class="op-toggcol">
          <div class="op-togghead"><span class="op-togg-lbl">MSR</span>
            <div class="op-switch" id="op-sw-msr">
              <button class="on" data-v="cy"  onclick="opTog('msr','cy')">Net Revenue</button>
              <button data-v="yoy" onclick="opTog('msr','yoy')">YoY vs PY</button>
            </div>
          </div>
          <div class="op-toggbody" id="op-msr-mount"></div>
        </div>
        <div class="op-toggcol">
          <div class="op-togghead"><span class="op-togg-lbl">ABM</span>
            <div class="op-switch" id="op-sw-abm">
              <button class="on" data-v="mom" onclick="opTog('abm','mom')">Latest vs Prior</button>
              <button data-v="yoy" onclick="opTog('abm','yoy')">YoY vs PY</button>
            </div>
          </div>
          <div class="op-toggbody" id="op-abm-mount"></div>
        </div>
      </div>
      <div class="op-mount" id="op-doc-mount"></div>
      <div class="op-actions-wrap"><div class="op-act-title">▸ Actions for the room</div><div class="op-actions" id="op-act-2"></div></div>
    </section>

    <!-- SCREEN 4 · SALES REGISTER -->
    <section class="op-screen" id="op-screen-3">
      <div class="op-screenhead"><div><div class="op-eyebrow">Detail</div><h2 class="op-h2">Sales Register</h2></div></div>
      <div class="op-mount" id="op-reg1-mount"></div>
    </section>

    <!-- SCREEN 5 · FIELD REGISTER -->
    <section class="op-screen" id="op-screen-4">
      <div class="op-screenhead"><div><div class="op-eyebrow">Detail</div><h2 class="op-h2">Field Force Register</h2></div></div>
      <div class="op-mount" id="op-reg2-mount"></div>
    </section>
  </div>
```

**Step 3 — inject the controller JS.** Find the end of the main script, which looks like:
```html
/* boot */
goChoice();
</script>
```
Insert this **new** `<script>` block immediately **after** that `</script>` (and before `</body>`):

```html
<!-- ═══════════════ ONE-PAGER CONTROLLER ═══════════════ -->
<script>
(function(){
  'use strict';
  var OP_BUILT=false, OP_TAB=0;
  var elx=function(id){return document.getElementById(id);};

  function moveCard(chId, mountId){
    var ch=elx(chId); if(!ch) return null;
    var card=ch.closest('.card'); if(!card) return null;
    var mount=elx(mountId); if(!mount) return null;
    mount.appendChild(card); return card;
  }

  /* toggle groups → which chart id maps to each switch value */
  var TOG={
    cust:  {sw:'op-sw-cust',   map:{cy:'ch-topcust',  yoy:'ch-cust-yoy'}},
    region:{sw:'op-sw-region', map:{cy:'ch-region',   yoy:'ch-region-yoy'}},
    msr:   {sw:'op-sw-msr',    map:{cy:'ch-msr-sales',yoy:'ch-msr-yoy'}},
    abm:   {sw:'op-sw-abm',    map:{mom:'ch-abm-bars',yoy:'ch-abm-yoy'}}
  };

  window.opTog=function(group,val){
    var cfg=TOG[group]; if(!cfg) return;
    Object.keys(cfg.map).forEach(function(k){
      var ch=elx(cfg.map[k]); if(!ch) return; var card=ch.closest('.card'); if(!card) return;
      var show=(k===val); card.style.display=show?'':'none';
      if(show){ setTimeout(function(){ try{Plotly.Plots.resize(ch);}catch(e){} },20); }
    });
    var sw=elx(cfg.sw);
    if(sw) sw.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.dataset.v===val); });
  };

  window.opGo=function(i){
    OP_TAB=i;
    for(var t=0;t<5;t++){ var sc=elx('op-screen-'+t); if(sc) sc.classList.toggle('active', t===i); }
    document.querySelectorAll('.op-tab').forEach(function(b){ b.classList.toggle('active', +b.dataset.tab===i); });
    setTimeout(function(){
      var sc=elx('op-screen-'+i); if(!sc) return;
      sc.querySelectorAll('[id^="ch-"]').forEach(function(c){
        if(c.offsetParent===null) return;             /* skip toggle-hidden cards */
        try{Plotly.Plots.resize(c);}catch(e){}
      });
    },70);
  };

  /* repurpose arrow buttons + keyboard nav (they call navSlide) to move between tabs */
  window.navSlide=function(delta){ var n=OP_TAB+delta; if(n<0)n=0; if(n>4)n=4; window.opGo(n); };
  window.goToSlide=function(n){};                      /* nav dots disabled in one-pager */

  function renderKPIs(){
    if(typeof summarize!=='function'||typeof FS==='undefined'||!FS) return;
    var s=summarize(FS);
    var buckets=monthBuckets(FS);
    var last=buckets[buckets.length-1], prev=buckets[buckets.length-2];
    var mom=(last&&prev)?safeGrowth(last.net,prev.net):null;
    var yoy=null; try{ yoy=safeGrowth(summarize(FS_CUR_COMP).net, summarize(FS_PREV_COMP).net); }catch(e){}
    var cArr=sortBy([].concat.apply([],[Array.from(groupRows(FS,function(r){return r.customer;}))])
                .map(function(kv){return {k:kv[0],v:netAfterReturns(kv[1])};}), function(x){return x.v;});
    var topC=cArr[0];
    var topP=sortBy(productStats(FS), function(p){return p.net;})[0];
    var totNet=s.net||1;

    var cards=[
      {tone:'blue', lbl:'Net Revenue', val:fmtMoney(s.net),
       chip: yoy!=null?(yoy>=0?'up':'down'):'neutral',
       chipTxt: yoy!=null?((yoy>=0?'▲ +':'▼ ')+yoy.toFixed(1)+'% YoY'):'',
       sub: last?('Latest month '+last.label+': <b style="color:#fff">'+fmtMoney(last.net)+'</b>'):'Period total'},
      {tone: mom==null?'gold':(mom>=0?'green':'red'), lbl:'MoM Growth',
       val: mom==null?'—':((mom>=0?'+':'')+mom.toFixed(1)+'%'),
       chip: mom!=null?(mom>=0?'up':'down'):'neutral',
       chipTxt: mom!=null?(mom>=0?'▲ growing':'▼ slowing'):'',
       sub: prev?('Prior '+prev.label+': '+fmtMoney(prev.net)):'Need two months'},
      {tone:'amber', lbl:'Return Drag', val:fmtPct(s.retPct,1),
       chip: s.retPct>2?'down':'up',
       chipTxt: s.retPct>1.5?'▲ above 1.5% target':'on target',
       sub:'Leakage <b style="color:#fff">'+fmtMoney(s.ret)+'</b> · R / Gross'},
      {tone:'violet', lbl:'Active Customers', val:fmtNum(s.custs),
       chipTxt:'',
       sub: topC?('Top: <b style="color:#fff">'+esc(shortName(topC.k,18))+'</b> · '+fmtMoney(topC.v)):(s.prods+' SKUs')},
      {tone:'gold', lbl:'Top Product', val: topP?esc(shortName(topP.name,15)):'—',
       chipTxt:'',
       sub: topP?('<b style="color:#fff">'+fmtMoney(topP.net)+'</b> · '+safePct(topP.net,totNet).toFixed(0)+'% of net'):''}
    ];
    elx('op-kpis').innerHTML=cards.map(function(c){
      return '<div class="op-kpi '+c.tone+'"><div class="lbl">'+c.lbl+'</div>'+
        '<div class="val">'+c.val+'</div>'+
        (c.chipTxt?'<div class="chip '+(c.chip||'neutral')+'">'+c.chipTxt+'</div>':'')+
        '<div class="sub">'+c.sub+'</div></div>';
    }).join('');

    try{
      var dates=FS.map(function(r){return r.date;}).filter(Boolean);
      if(dates.length){ var mn=new Date(Math.min.apply(null,dates)),mx=new Date(Math.max.apply(null,dates));
        var f=function(d){return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});};
        var pt=f(mn)+' — '+f(mx);
        if(elx('op-period'))elx('op-period').textContent=pt;
        if(elx('op-period-2'))elx('op-period-2').textContent=pt; }
    }catch(e){}
  }

  function renderActions(){
    if(typeof buildActions!=='function') return;
    var acts=[]; try{acts=buildActions();}catch(e){acts=[];}
    var map={'0':['Accelerate','Fix'],'1':['Protect','Expand'],'2':['Intervene','Realign']};
    function card(a){return '<div class="op-act '+a.tone+'"><div class="albl">'+a.lbl+'</div><h4>'+a.title+'</h4><div class="ameta">'+a.meta+'</div></div>';}
    Object.keys(map).forEach(function(scr){
      var wanted=map[scr];
      var list=acts.filter(function(a){return wanted.indexOf(a.lbl)>=0;});
      var c=elx('op-act-'+scr); if(c) c.innerHTML=list.map(card).join('');
    });
  }

  window.opRefresh=function(){ renderKPIs(); renderActions(); };

  function opBuild(){
    if(OP_BUILT) return;
    if(typeof FS==='undefined'||!FS){ setTimeout(opBuild,400); return; }
    [2,4,5,6,7,8,9,12,13].forEach(function(n){ try{ if(typeof renderSlide==='function') renderSlide(n); }catch(e){} });

    moveCard('ch-momentum','op-hero-mount');
    moveCard('ch-topprod','op-prod-mount');
    moveCard('ch-prod-yoy','op-prod-mount');
    moveCard('ch-topcust','op-cust-mount');
    moveCard('ch-cust-yoy','op-cust-mount');
    moveCard('ch-region','op-region-mount');
    moveCard('ch-region-yoy','op-region-mount');
    moveCard('ch-msr-sales','op-msr-mount');
    moveCard('ch-msr-yoy','op-msr-mount');
    moveCard('ch-abm-bars','op-abm-mount');
    moveCard('ch-abm-yoy','op-abm-mount');
    moveCard('ch-hq-ex','op-doc-mount');
    var reg=elx('register-grid'); if(reg){var rc=reg.closest('.card'); if(rc&&elx('op-reg1-mount'))elx('op-reg1-mount').appendChild(rc);}
    var ff=elx('ff-grid'); if(ff){var fc=ff.closest('.card'); if(fc&&elx('op-reg2-mount'))elx('op-reg2-mount').appendChild(fc);}

    ['deck','nav-dots'].forEach(function(id){var n=elx(id); if(n)n.style.display='none';});
    var an=document.querySelector('.arrow-nav'); if(an)an.style.display='none';
    var scnt=document.querySelector('.slide-counter'); if(scnt)scnt.style.display='none';
    var root=elx('op-root'); if(root)root.style.display='block';

    window.opTog('cust','cy'); window.opTog('region','cy'); window.opTog('msr','cy'); window.opTog('abm','mom');

    OP_BUILT=true;
    window.opRefresh();
    window.opGo(0);
    setTimeout(function(){ document.querySelectorAll('#op-screen-0 [id^="ch-"]').forEach(function(c){try{Plotly.Plots.resize(c);}catch(e){}}); },200);
  }

  var _ol=window.launchDashboard;
  if(typeof _ol==='function'){
    window.launchDashboard=function(){ var r=_ol.apply(this,arguments); setTimeout(opBuild,1000); return r; };
  }
  var _oa=window.applyF;
  if(typeof _oa==='function'){
    window.applyF=function(){ var r=_oa.apply(this,arguments);
      if(OP_BUILT){ setTimeout(window.opRefresh,80); setTimeout(function(){window.opGo(OP_TAB);},800); }
      return r; };
  }
})();
</script>
```

That's it — three appends, no engine edits.

---

## 8. Verification checklist (after a rebuild)

1. **Syntax:** extract both inline `<script>` bodies and run `node --check` on each → clean.
2. **HTML well-formed:** no unclosed/stray tags.
3. **Load data** (auto-fetch or upload all four files).
4. **Filters visible** at top, full height; **page scrolls** inside the content area.
5. **Tabs** switch; **toggles** flip This-FY ↔ YoY and the chart re-sizes correctly.
6. **Reconciliation:** unfiltered CY Net Revenue KPI ≈ **₹41.4L** (same as the full deck's Slide 1) — proves the shared engine.
7. **Filter a product/region/MSR** → KPIs, charts, and Actions all update together.
8. **Registers** (tabs 4 & 5) render and export.

---

## 9. Known limitations / future ideas

- **No live-render test was possible in the build sandbox** (no headless browser; GitHub data host blocked by allowlist). The build was verified statically (syntax, structure, id wiring). Always do a visual pass after a rebuild.
- **Chart sizing on first paint:** charts that are toggled-off or on an inactive tab draw at 0-width and are resized on show via `Plotly.Plots.resize`. If one ever looks squished, switching tabs/toggles fixes it; the resize timers (70/200ms) can be lengthened on slow machines.
- **`Coverage & Strategy Adherence`** (`ch-hq-ex`) only appears if `Doctor_Master.xlsx` is loaded; otherwise its mount stays empty (handled gracefully).
- **Coverage vs adherence:** Coverage is doctor-count based (`active / mapped`). Strategy adherence is revenue based: `mapped-product revenue / scoped revenue`. A rep can therefore show 100% active coverage but a much lower adherence % if revenue is coming from products not mapped to many of that rep's scoped doctors.
- **Product variant matching:** On-strategy checks use cleaned product keys and allow mapped base brands to match sales variants (for example `AFDICAL` can match `AFDICAL S`). This avoids undercounting adherence when Doctor Master uses base brand names and Sales uses SKU variants.
- **Possible next step:** a one-click "Print / PDF" of the three screens for handouts.

---

## 10. File map

| File | Role |
|---|---|
| `dashboard_onepager.html` | **The one-pager (this handoff's subject)** |
| `dashboard_presentation.html` | Full 13-slide deck — the source engine; untouched |
| `dashboard_presentation.BACKUP.html` | Pre-v8 snapshot |
| `handoff_onepager_v1.md` | **This document** |
| `handoff_presentation_v4.md` | Full-deck v8 handoff (metric-layer details) |
| `KPI_LOGIC_FIX_PLAN.md` | KPI-by-KPI audit of the net-of-returns logic |
| `files/sales.xls`, `previous_sales.xls`, `msr.xlsx`, `Doctor_Master.xlsx` | Data inputs |

---

## 11. Amendments (post-v1)

Three changes were made directly in `dashboard_onepager.html` (all inside the **one-pager controller** `<script>` and the overlay HTML — the deck engine is still untouched):

1. **Returns by Product (Screen 0 · Revenue & Products).** New full-width toggle block (`This FY` ↔ `YoY vs PY`) below the product grid. Charts: `ch-prodret` (CY) and `ch-prodret-yoy` (CY vs PY comparable window). Bars are credit-note value per product, **sorted descending by value**; hover shows **count of parties** that returned the product.

2. **Returns by Customer (Screen 1 · Customers & Regions).** New full-width toggle block below the customers/regions grid. Charts: `ch-custret` (CY) and `ch-custret-yoy`. Bars are return value per customer, **sorted descending**; hover shows **count of products** that customer returned.

   These two are **one-pager originals**, not re-homed deck cards. They are built by `renderReturns()` from `FS` / `FS_CUR_COMP` / `FS_PREV_COMP` using the existing engine helpers (`groupRows`, `sum`, `uniq`, `fmtMoney`, `shortName`, `COLORS`, `PL`, `AX`, `PC`). `renderReturns()` is called from `opRefresh()`, so the charts recompute on every filter change. Toggle groups `prodret` and `custret` were added to the controller's `TOG` object and initialised in `opBuild()`.

3. **Removed rank-change arrows (Screen 2 · Team & Doctors).** The `↑N` / `↓N` rank-movement annotations on `ch-abm-yoy` and `ch-msr-yoy` were removed (each chart's `annotations` array is now empty). All other arrows/labels are unchanged.

**General:** all value-ranked bar charts render in **descending order of value** (largest at the top of horizontal bars). Time-series charts (monthly trend, etc.) remain chronological by design.

---

## 12. Amendments (2026-06-13) — Mobile responsiveness + boot-flash fix

Two changes were made directly in `dashboard_onepager.html`. A pre-change backup was saved as **`dashboard_onepager.BEFORE-MOBILE.html`**. The deck engine is still untouched; these are CSS + one-pager-controller edits only. *(Not yet folded into the §7 rebuild recipe — apply them as post-build edits, same pattern as §11.)*

### 12.1 Mobile responsive layout

The file previously had breakpoints only down to **980px**, so phones (360–430px) rendered a near-desktop layout that overflowed. Added two new `@media` blocks **immediately after the existing `@media(max-width:1100px)` line** (just before the first `</style>`):

- **`@media(max-width:640px)`** — phone layout:
  - `html,body{min-height:100dvh}` (replaces the `100vh` jump caused by mobile browser chrome).
  - **Topbar** compacts and wraps; **filter bar** becomes a single-row horizontal scroll strip (`flex-wrap:nowrap`); `#op-root` side padding 26px → 14px.
  - **Tab strip** (`.op-tabs`) becomes a swipeable horizontal scroller; tabs get `min-height:44px` touch targets.
  - **Grids collapse:** `.op-kpis` → 2-up, `.op-grid2` / `.op-actions` / `.mega-grid` → 1 col, `.kpi-row*` → 2-up, `.grid.*` → 1 col. Screen heads stack vertically; KPI/heading fonts reduced.
  - **Charts** get shorter fixed heights (`.chart` 280px, `.sm` 230px); full detail still available via the tap-to-open chart modal, which goes near-fullscreen (`96vw × 90vh`).
- **`@media(max-width:400px)`** — small phones: KPIs and all KPI rows go fully single-column; headings shrink further; charts 260px.

Desktop is unaffected — everything is gated behind the new breakpoints.

### 12.2 Register sections removed on mobile

Per requirement, the **Sales Register** and **Field Register** are hidden on phones. In the `≤640px` block:

```css
#slide-12,#slide-13,
#op-screen-3,#op-screen-4,
.op-tab.reg,.op-tab-spacer{display:none!important}
```

To stop arrow/keyboard nav from landing on the now-hidden register screens, the controller's `navSlide` clamp was made viewport-aware:

```js
window.navSlide=function(delta){ var max=window.matchMedia('(max-width:640px)').matches?2:4; var n=OP_TAB+delta; if(n<0)n=0; if(n>max)n=max; window.opGo(n); };
```

(The visible register tabs are hidden, so tapping isn't possible on mobile; this guard covers the arrow/keyboard path. On desktop, `max` stays 4 — registers fully available.)

### 12.3 Boot flash fixed (the ~1s "old dashboard" preview)

**Cause:** the original `launchDashboard` wrapper (§7 Step 3) revealed the presentation **deck** first, then waited a hard-coded `setTimeout(opBuild, 1000)` before hiding the deck and showing the one-pager. That 1-second window was the visible flash of the deck.

**Fix** (in the controller's `launchDashboard` wrapper + end of `opBuild`):

- The deck and its chrome (`deck`, `nav-dots`, `.arrow-nav`, `.slide-counter`) are now hidden **immediately at launch**, so the deck never paints. (Charts still render into the hidden deck and are re-homed/resized as before — Plotly `responsive:true` + the existing resize calls handle sizing once visible.)
- The existing **loading screen (`#s-load`, `.screen` z-index 200)** is held up over the empty shell until `opBuild` finishes, then lifted — so the transition is *loader → one-pager*, with no deck in between.
- The blind `1000ms` delay was reduced to `500ms`. `opBuild` already self-defers (`setTimeout(opBuild,400)`) until `FS` is ready, and because `applyF()` runs in the same synchronous block that sets `FS`, an `FS`-truthy check implies the comparable-window globals are ready too — so the shorter delay is safe.

Net effect: opening the page now shows the loader and then the one-pager directly, on both desktop and mobile.

### 12.4 Verification

- Both inline `<script>` bodies pass `node --check` (syntax clean).
- New mobile block: braces balanced; referenced selectors (`#slide-12/13`, `#op-screen-3/4`, `.op-tab.reg`, `.op-tab-spacer`) all exist.
- Visual pass on a real phone still recommended (per §9, the sandbox has no headless browser / data host).
