# Strategic CMO Audit & Developer Implementation Backlog
**Target File for Rebuild:** [dashboard_strategic.html](file:///Users/adityagoenka/Desktop/Sandbox/Pharmaboard/dashboard_strategic.html)  
**Primary Files Available:** `sales.xls` (Sales Register), `msr.xlsx` (MSR Mapping), `Doctor_Master.xlsx` (Doctor Master)  
**Objective:** Correct all strategic sales-marketing logical fallacies in the dashboard using **pure-code engineering solutions** on the existing data files. **No further client data is required.**

---

## Part 1: The CMO's Critical Critique (Indian Pharma Context)

In the Indian pharmaceutical industry, sales occur via a three-tiered push-pull system: **MSRs detail doctors to generate prescriptions (tertiary demand) $\rightarrow$ Patients purchase from retail chemists $\rightarrow$ Chemists replenish from stockists (primary billing).** 

The current dashboard contains several critical logical errors that confuse primary stockist billing with direct doctor behavior. If left unfixed, this will lead leadership to make incorrect commercial decisions. 

Here are the four core fallacies and our **pure-code solutions** that the next AI agent must build:

### 1. The Speciality Revenue Mix Fallacy
* **The Flaw:** `renderSpecMix` proportionally allocates a city's total stockist revenue based on the headcount ratio of doctor specialities in that city (e.g. if a city has 5 Cardiologists and 5 Gps, it splits the stockist revenue 50/50). This is a statistical fantasy that completely ignores actual prescribing volumes and therapy profiles.
* **The Pure-Code Solution:** Convert this to a **Therapeutic Brand Revenue Mix** and a **Doctor Portfolio Distribution**.
  * Use a static dictionary in JS to map our products to their actual therapeutic categories (*Ecoxib* $\rightarrow$ Ortho, *Rednil* $\rightarrow$ Cardio, *Kover All* $\rightarrow$ GP/General). 
  * Classify and display actual revenue based on the sold product's category, while showing the doctor headcount separately. Do not mix them.

### 2. The HQ vs. EX Revenue Split Fallacy
* **The Flaw:** `renderHQEx` attempts to split stockist revenue between Headquarter (HQ) and Extension (EX) territories based on the doctor headcount ratio. In reality, stockists are concentrated in HQ cities. Chemists in EX towns buy from HQ stockists, meaning **100% of ERP sales billing is credited to the HQ stockist**. The current chart falsely makes MSRs look completely unproductive in EX towns.
* **The Pure-Code Solution:** Shift the focus from fake revenue splits to **Doctor Detailing Coverage & Strategy Adherence in EX vs. HQ**.
  * Compare **Total Mapped Doctors vs. Active Mapped Doctors** (doctors whose mapped products had sales in their city/station) in HQ vs. EX.
  * This measures field activity and coverage hygiene without distorting revenue flow.

### 3. The Absolute "MSR Composite Score" Fallacy
* **The Flaw:** The current 0–100 score normalizes MSR performance against the top rep in the country. A rep handling a metro territory like Mumbai will naturally have huge revenue scale, while an upcountry rep in Bihar will have a narrow patch. Normalizing them against the top performer ensures the Bihar rep always gets a low score, destroying morale.
* **The Pure-Code Solution:** Implement a **Territory-Fair MSR Efficiency Score**.
  * Remove the absolute revenue scale term `(s.net / maxNet) * 40`.
  * Calculate the score based entirely on **Territory Growth Velocity (35 pts)**, **Targeting Effectiveness (25 pts)**, **Doctor Coverage % (25 pts)**, and **Product SKU Breadth (15 pts)**. This scores the rep on how *efficiently* they manage their specific territory.

### 4. Messy Fuzzy Product Matches
* **The Flaw:** `targetingEffectiveness` uses a fuzzy text search on the first two words of the product name. Discrepancies like `"ECOXIB 60 MR TAB"` in ERP vs `"ECOXIB60"` in the Doctor Master lead to false "off-strategy" flags and incorrect MSR targeting metrics.
* **The Pure-Code Solution:** Build a robust **Canonical Brand Normalizer** in JavaScript that strips strengths, package types (`TAB`, `CAP`, `INJ`), and punctuation to map all variations to clean canonical brand keys.

---

## Part 2: Pure-Code Developer Implementation Backlog (TO-DOs)

This section provides the step-by-step checklist for the next AI agent to modify [dashboard_strategic.html](file:///Users/adityagoenka/Desktop/Sandbox/Pharmaboard/dashboard_strategic.html).

### 1. Robust Brand Normalization & Mapping
* [ ] **Add standardizer function:** Implement `cleanBrandKey(productName)` in the help functions:
  ```javascript
  function cleanBrandKey(name) {
    if (!name) return '';
    let v = String(name).trim().toUpperCase();
    // Remove common strength/form indicators
    v = v.replace(/\b(?:TAB|CAP|INJ|LIQUID|SUSP|GEL|CREAM|OINTMENT|MR|SR|PR|60\s*MR|90|120|60|500|250|100|P)\b/gi, '');
    v = v.replace(/[^A-Z0-9\s]/g, ''); // strip punctuation
    v = v.replace(/\s+/g, ' ').trim(); // normalize spaces
    // Explicit manual mappings for known mismatches
    if (v.startsWith('ECOXIB')) return 'ECOXIB';
    if (v.startsWith('KOVER')) return 'KOVER ALL';
    if (v.startsWith('REDNIL')) return 'REDNIL';
    return v;
  }
  ```
* [ ] **Update joins to use `cleanBrandKey`:**
  * Refactor `buildDoctorIndex` to normalize products mapped in the Doctor Master using `cleanBrandKey`.
  * Refactor `targetingEffectiveness` (lines 1579–1592) to match product names using `cleanBrandKey(r.product_name)` against the doctor's normalized mapped products.

### 2. Global Therapeutic Division Filter
* [ ] **Define Static Division Map:** Add a static division mapping in the config block:
  ```javascript
  const DIVISIONS = {
    'CARDIOLOGY': { brands: ['REDNIL'], specialities: ['CARDIOLOGIST', 'CARDIOLOGY'] },
    'ORTHOPAEDICS': { brands: ['ECOXIB'], specialities: ['ORTHOPAEDIC', 'ORTHOPAEDIC SURGEON', 'ORTHO'] },
    'GENERAL MEDICINE': { brands: ['KOVER ALL'], specialities: ['GENERAL PHYSICIAN', 'MD', 'GP', 'PEDIATRICIAN'] }
  };
  ```
* [ ] **Inject UI Dropdown:** Add a `<select id="f-div" class="select" onchange="applyF()"><option value="">All Divisions</option></select>` next to the other filters in the `.filter-bar` (line 537).
* [ ] **Filter Logic integration:**
  * In `buildFilters`, populate the Division filter.
  * In `applyF()`, if a Division is selected (e.g. `CARDIOLOGY`), filter the sales rows `FS` to include only products matching the division's brands, and filter the doctor records `FS_DOC` (or the local doctor array) to include only doctors with the division's specialities.

### 3. De-link Revenue from Speciality Mix
* [ ] **Convert `renderSpecMix` to Brand Category Revenue Mix:**
  * Map sales values directly to their therapeutic categories (*Cardiology*, *Orthopaedics*, *General Medicine*) using the static division brands.
  * Plot a horizontal bar chart of **Revenue by Therapeutic Category** based on clean product mapping.
* [ ] **Add Doctor Speciality Count Portfolio:**
  * Plot a separate, clean Pie chart or Bar chart showing the distribution of the 1,366 mapped doctors by their **Speciality Headcount** (Cardiology, Ortho, GP, etc.) to show detailing focus without faking revenue distribution.

### 4. Shift HQ vs. EX to "Strategy Adherence & Coverage"
* [ ] **Rebuild `renderHQEx`:**
  * Map each customer's station to HQ or EX territory type using the doctor cities in the Doctor Master.
  * Calculate **Active Doctor Coverage %** (number of doctors who have mapped products billed to stockists in their city / total doctors mapped to that MSR in that city) for HQ vs EX.
  * Plot a grouped bar chart comparing **Target Mapped Doctors** vs. **Active Prescribing Doctors** in HQ vs. EX.
  * Display a line indicating **Strategy Adherence %** (revenue from mapped products / total revenue) in HQ vs. EX.

### 5. Territory-Fair MSR Composite Score
* [ ] **Rebuild Score Formula:** In `renderMSRTable` (lines 2221–2233), replace the score calculation:
  * Remove `s.net/maxNet * 40`.
  * Define **MSR Score** out of 100 as:
    ```javascript
    const growthScore = clamp((s.growth + 20) / 40, 0, 1) * 35; // 35 pts (MoM growth capped at ±20%)
    const targetingScore = (s.targeting / 100) * 25;           // 25 pts (Targeting Effectiveness %)
    const coverageScore = (s.docs_total ? (s.docs_active / s.docs_total) : 0) * 25; // 25 pts (Doctor Coverage %)
    const skuBreadthScore = clamp(s.prods / 15, 0, 1) * 15;    // 15 pts (SKU breadth capped at 15 SKUs)
    s.score = growthScore + targetingScore + coverageScore + skuBreadthScore;
    ```
  * Ensure the table displays this new territory-fair efficiency rating.

### 6. Refactor Intelligence Brief & Decisions
* [ ] **Refactor `buildInsights`:**
  * Remove references to client-data gaps (SFA, primary/secondary).
  * Add automatic insights that flag when an MSR has low EX Doctor Coverage (e.g., `< 40%`) or when a specific Brand Category is dragging revenue growth.
* [ ] **Refactor `renderDecisions`:**
  * Re-align the 6 decision cards (Protect, Accelerate, Fix, Intervene, Realign, Expand) to trigger based on the new brand categories, division filters, and territory-fair efficiency scores.
  * Update card text descriptions to offer actionable commercial instructions for MSRs (e.g. *"Reset clinic beat-plan priorities"* or *"Shift detailing focus to HQ chronic portfolio"*).
