# GRE Quant Pro — Master Handoff

**Current as of 2026-10-29.** This is the only handoff. It replaces the repo's `HANDOFF_STUDENT_PROGRESS_2026-10-24.md` and 18 older project docs (listed in section 9). Read sections 0 to 2 first. The rest is reference.

---

## 0. Where things stand

| | |
|---|---|
| Repo | `~/GitHub/gre-adi` → `github.com/adityagoenka24/gre-adi`, branch `main` |
| Git | HEAD `a2fb531` ("mocks", 2026-10-29 16:10), level with `origin/main`. Everything described in section 4 is committed and pushed. This handoff file is not committed. |
| Static site | GitHub Pages at `grequantpro.com` (`CNAME`) |
| Backend | Cloudflare Worker `gre-auth` (`cloudflare/worker.js`, pasted into the dashboard, no wrangler), KV namespace `GRE_AUTH`, D1 database `gre-progress` bound as `GRE_DB` |
| **Not verifiable from the repo** | Whether the Worker, the D1 tables and the one-off "Tidy up old storage" run have actually been done. Section 6 is the checklist. Confirm each before trusting any Coach View screen. |
| Tests | The Worker and browser suites quoted in earlier handoffs were run from scratch folders and **are not in the repo**. The only tracked tests are `diagnostic/test-*.mjs`. Regression cover for everything below has to be rebuilt or re-run by hand. |
| Build scripts | The scripts that rebuilt the 10 mocks (section 4.5) lived in a scratch folder and were not kept. The papers themselves are the source of truth. The method is in 4.5. |

---

## 1. Open decisions and next work (ranked)

### 1. Scoring after the mock rebuild — needs a decision
`score-scale.js` scores on difficulty-weighted accuracy, which is a ratio. A harder paper has a bigger denominator, so the same student gets a lower number. Routing cannot compensate: every threshold pair in the search space gave the same −6.6 to −7.1 mean shift.

| Student (modelled) | Old papers | New papers | Shift |
|---|---|---|---|
| weak | 152 | 140 | −12 |
| mid | 158 | 149 | −10 |
| strong | 166 | 158 | −8 |
| very strong | 169 | 168 | −1 |

- **Accept it.** The old papers over-predicted, which was the original complaint. The new range also discriminates better (the old papers put everyone above one ability level at 168–170).
- **Re-anchor.** Give `score-scale.js` a per-paper anchor table so sectionals, topic tests and stored attempts keep today's scale. A naive derivation comes out non-monotonic because the route ceilings (158 / 165 / 170) are discontinuous, so this needs real design, not a constant offset.

Nothing in `score-scale.js` was changed. The papers ship with the deflation. Routing was moved to `{medium: 4, hard: 7}` to keep strong students on the right form.

### 2. The rebuilt mocks lost their real-GRE question order
The earlier 10-29 build had the real shape: Section 1 = four QC first, then a three-question DI set, then the rest; Section 2 with QC grouped. The difficulty rebuild shuffled types inside each container. Current order, mock_01 Section 1: `QQMNMNSQMQMS` (Q = QC, M = MCQ, N = numeric, S = select-all), DI exhibit at 5–7. Section 2 forms are scattered too, for example hard form `MSNMQMMQQQMSNMQ`.

Fix: within each section and each form, put QC items first, keep the DI set at positions 5–7 sharing one exhibit, then reorder and renumber ids (`MOCK-NN-S1-###`, `MOCK-NN-S2E/S2M/S2H-###`; keep `bank_id`). Re-check the shared-exhibit set, the per-form counts and the time budgets afterwards. Free mocks 01–02 must stay byte-identical to pro 01–02.

### 3. Paid content is publicly fetchable
`pro/bank/` (132 files) and `pro/mocks/` (10 files) are tracked in git and served by GitHub Pages, so every Pro question and all 10 mocks (03–10 are paid) can be downloaded by URL. `learn/pro-body/*.html` is a documented soft gate. A fix was designed on 2026-10-19 (a Worker route `POST /pro-data {email, fingerprint, path}` that checks the plan and streams a file from KV key `data:<path>`) but was **never merged into `worker.js`** (no `pro-data` string in it today). The design and exact deploy commands are in git: `git show 8f99c73^:HANDOFF_ETS_AUDIT_2026-10-06.md` (Addendum 4).

Residual risks if you do it: git history still holds the bank (purging needs `git filter-repo`, a force-push and a GitHub support request); `/validate` authenticates by email plus a browser fingerprint with 2 device slots, so anyone who knows a student's email can register a device while a slot is free; no per-student rate limit.

### 4. Marketing still sells the retired difficulty ladder
Now false, because every mock is at real-GRE level. Three lines, left untouched because marketing is the owner's call:
- `pricing.html:155` and `index.html:383` — "All 10 mocks, Balanced to Expert (170)"
- `pro/index.html:87` — "10 full-length mocks from Balanced (160) to Expert (170)…"

Truthful wording already exists in the upgrade block of `full_mock.html`: "Two mocks tell you where you are. Ten tell you whether it holds."

### 5. Confirm the backend deploys (section 6)
If the Worker is stale, Coach View falls back to the slow KV scan and some buttons alert "Could not delete".

### 6. The same label inflation is still in the practice bank and sectionals
A bank `medium` is really a one-step item, so a student drilling "medium" in the logger gets easy questions. Re-tier the practice bank and sectionals the way the mocks were (4.5). Re-solve any generated-hard item before trusting its label.

### 7. Coach View mirror case
Event attempts no longer appear in the Free attempts tab. Free full-mock and free sectional attempts **still appear in the Events tab**, grouped as events (type `full_mock` / `sectional`). Add better labels and a type filter, or split them out.

### 8. Smaller items

- **DI exhibits for mocks 02, 03, 07** are new. Their questions are verified; the exhibits have not been looked at in a browser at phone width.
- **Only 13 shared-exhibit DI sets of 3+ exist in the bank** and 10 are used, one per mock. A few more (source: the KMF 1804 import) would give room.
- **Five live capsule defects** found while building the handbook (2026-10-24, capsules not touched): `concepts/…/05-geometry/01-lines-angles.md` says GRE figures are "drawn to scale unless stated" (ETS says not necessarily; this one costs marks, so also grep bank and mock explanations); `07-statistics-probability/07-combinations.md` says a committee of 3 from 9 is 126 (it is 84); `01-arithmetic/05-rates-unit-conversions.md` says two people taking 6 hours each do not take 3 together (they do); `01-arithmetic/10-estimation-approximation.md` demonstrates opposite-direction rounding as "same direction"; `05-geometry/02-triangles-fundamentals.md` still carries Heron's formula. Fix 1–4, then rerun `build_learn.py`.
- **19 questions** carry a prose `figure_description` instead of a drawn figure (2026-10-22). Use the diagram workflow in the `gre-question-gen` skill.
- **Content gaps** (2026-10-24 counts): extreme-hard is thin (340 pro, 70 free). Data Interpretation is the thinnest topic after the audit. Both are generation jobs for the skill.
- **Events:** `events/config/current.json` Q1 carries its table as pipe-separated text (a `table_data` block would render it as an exhibit); its `event_id` is `mock_001`, the same as `mock_001.json`, so analytics for the two share an id; `coach_aggregator.html` and `event_builder.html` still use the old dark theme.
- **Pro logger:** the exam analysis screen overflows 114px horizontally at 390px (the "By Question Type" card), pre-existing. Dead code remains (see section 7).
- **Handbook:** the email gate says "One email, no list, no spam. Just the handbook." That forbids emailing those leads about Pro, so change it before using the list. Prices and bank sizes are copied into `concepts/build_handbook.py` (`BANK`, `BRIDGE`, `ENDCARD`); update and rebuild if pricing changes.
- **Commercial calls not made:** refund window (7 days; the trust strategy recommends 30), a ₹3,999 "Retake Rescue" tier, and a neutral contact address. The personal Gmail is still in about 268 places (262 `mailto:` links and 6 code constants, counted 2026-10-24).
- **Standing flag:** the pharma files in `afd/` (`Doctor_Master.xlsx`, `msr.xlsx`, `previous_sales.xls`, `roi_register.xlsx`, `sales.xls`) and root `dashboard.html` are publicly fetchable. Left alone by instruction.
- **Carry-overs to recheck before acting** (stated in 2026-10-06 and 2026-10-19 docs; the 2026-10-24 purge may have removed them): `DAT-MGS-014` (stem says round 82 ÷ 6 to a whole number, key needs the unrounded value), `DAT-LIN-025` ("hourly readings" vs 2-hour spacing), `GEO-TRI-KMF-008` (figure not to scale, visibly breaks a stated condition), `DAT-BAR-KMF-004/012` (need exact bar reading, check the live chart shows value labels).

---

## 2. Standing rules

- **No personal name or credential on any GRE page.** Use an impersonal team voice. Never reintroduce a personal score claim. "We / our coaching team" is fine, but add no specifics (no team size, no bios).
- **Never delete or edit non-GRE material:** `afd/`, `sdp/` (including its own `*_Handoff.md` files), `internship/`, root `dashboard.html`.
- **The bank has exactly two sources:** `bank/` (free) and `pro/bank/` (pro). `*_mixed_bag.json` files are roll-ups of their subtopic files, not new questions. Dedupe before auditing; propagate every fix to all copies. The free bank is nearly a subset of pro.
- **Do not change config identifiers:** Worker URLs, localStorage keys (`gre_admin_secret`, `gre_admin_url`, `gre_pro_auth`, `gqp_free_sessions`, `gre_errlog_outbox`), GitHub URLs.
- **Handoff format:** `.md`. No scripts or HTML files unless asked.
- **The owner commits and pushes.** Do not commit or push unless asked.
- **Deleting inside connected folders is blocked.** `rm` fails with "Operation not permitted"; restore with `cp -r <backup>/. <target>/`, or request delete permission.
- **Question standard:** `ETS_RUBRIC.md` outranks the skill's reference files. Use the `gre-question-gen` skill for any generation or repair. Wording contract: "Quantity A / Quantity B" (never Column), ETS-verbatim QC option set with terminal periods, US spelling, no contractions, "xy-plane", numeric options ascending (select-alls included), select-all stems end "Indicate all such <noun>.", no "Enter your answer as a number" clause on numeric entry. Keep solutions on-syllabus: no modular notation, Vieta by name, trigonometry, logarithms, Heron, incenter/circumcenter, vectors, AM-GM, ellipses or infinite series.
- **KMF 1804 is presumed copyrighted ETS content.** Never transcribe; rewrite only (same concept, new cover story, numbers and exhibit data; key re-derived).
- **Math notation is not a defect.** `gre-math.js` already renders `x^2` / `x²`, `sqrt(5)` / `√5`, `<=` / `≤` identically. Do not "fix" it.
- **Honest claims only.** Every number on a page must match the files. No fake urgency, no invented testimonials. Free tier is "Easy & Medium (Hard & Extreme are Pro)".

---

## 3. Architecture

### Surfaces

| Surface | Free | Pro |
|---|---|---|
| Practice (topic tests, practice and exam mode) | `gre_practice_logger_free.html` | `pro/gre_practice_logger_pro.html` |
| Sectionals | `sectional.html` | `pro/sectional.html` |
| Full mocks | `full_mock.html` (`mocks/mock_01-02.json`) | `pro/full_mock.html` (`pro/mocks/mock_01-10.json`) |
| Events | `events/mock_test.html` + `events/config/*.json` | — |
| Admin / coach | `cloudflare/admin.html`, `cloudflare/coach.html` | |
| Study material | `learn/`, `handbook/`, `diagnostic.html` (ETS-report analyser) | `learn/pro-body/` |
| Public audit | `audit/index.html` + `audit/removed.json` | |

### Shared files (repo root unless noted)
`score-scale.js` (the one copy of the score model) · `score-card.js` (score-first page) · `gre-exhibit.js` (static SVG bar/line/pie charts and tables) · `progress-local.js` (free history) · `pro/error-log.js` (error log, gate, analytics renderer) · `pro/pro-gate.js` (Pro login, `GREProgress` helper) · `gre-exam-theme.css` and `events/gre-exam.css` (ETS shell) · `gre-calculator.js` · `gre-math.js` (KaTeX) · `ads-config.js` · `ETS_RUBRIC.md`.

### Worker routes (`cloudflare/worker.js`)

| Group | Routes |
|---|---|
| Auth | `/validate` (returns access, name, `progress_token`), Razorpay webhook (`razorpayName` extracts the buyer name) |
| Leads | `POST /lead`, `GET /admin/leads` |
| Pro progress | `POST /progress/save`, `GET /progress/sessions`, `POST /progress/error-log`, `GET /progress/pending-log`, `GET /progress/log-status` |
| Mock and event attempts | `POST /mock/submission` (returns `attempt_id`, `log`), `POST /mock/error-log`, `GET /mock/pending-log`, `GET /mock/log-status` |
| Admin, students | `GET /admin/progress-students`, `GET /admin/progress?email=` (`include_payloads=1`), `POST /admin/progress/delete`, `POST /admin/progress/waive-log`, `POST /admin/set-name` |
| Admin, attempts | `GET /admin/mock-attempts`, `GET /admin/events`, `GET /admin/event-attempts`, `POST /admin/event-log/waive`, `POST /admin/attempts/delete`, `POST /admin/attempts/purge`, `POST /admin/attempts/reindex`, optional `scheduled` handler |
| Removed | `/admin/cohort-weakness` |

Admin routes need `X-Admin-Secret`. Secrets: `ADMIN_SECRET`; `PROGRESS_SECRET` is recommended (signs student tokens; falls back to `ADMIN_SECRET`).

### Storage

- **D1** (`cloudflare/schema.sql`, idempotent): `sessions`, `attempts`, `error_log`, `log_required`, `event_log_required`, `event_error_log`, `mock_attempt_index`. If the binding is not named exactly `GRE_DB`, every `/progress/*` call returns 503.
- **KV `GRE_AUTH`:** `student:{email}`, `lead:{email}`, `mock_attempt:{date}:{event}:{id}` (now expires after 3 days), `webhook_manual:` / `webhook_noemail:` queues, daily counters.

---

## 4. How each part works now

### 4.1 Student progress and Coach View

- **Pro** history is stored in D1 and rebuilds on any device. Tokens are stateless HMAC (30-day expiry, refreshed on every validated load), so `/validate` costs no KV writes. A session's primary key is a SHA-256 over email, startTime, date, type, topic, notes and question count, so retries and double backfills overwrite rather than duplicate. Accuracy is recomputed server-side. All saves are fire-and-forget; a network failure never alters a result screen.
- **Free** history lives in `localStorage` (`gqp_free_sessions`, cap 50) via `progress-local.js`, with a locked-history teaser. On a student's first Pro login in that browser the Pro logger uploads it (max 50 per call) and clears it.
- **Session types:** `bank_practice`, `bank_exam`, `sectional`, `full_mock`, `event_mock`, `manual` (unreachable now).
- **Removed from the loggers:** Save Session / Send to Tutor buttons, the "Log a Session" tab, the JSON import zone and Generate Dashboard / Clear All buttons, the cohort tab and endpoint, and `pro/analytics.html` ("My Analytics"; "My Progress" at `gre_practice_logger_pro.html#progress` replaced it).
- **Names:** `/validate` returns `name`; the Pro logger pre-fills and hides the name field and `pro-gate.js` stores it. The field stays in the DOM because `startBankSession()` and the exam override read it. The webhook takes the name from the payment link customer, then `notes.*`, then the card, and rejects emails, bare phone numbers, "NA" style placeholders and anything over 120 characters. A name is never overwritten once set. `admin.html` has a Student Name card and Edit/Add Name buttons.
- **Coach View** (`cloudflare/coach.html`, light theme matching `site.css`) has three tabs: **Students** (Pro), **Events**, **Free attempts**.
  - Students list: type chips, sessions, accuracy, Est. score with range, error-log column. Detail: KPIs, a card per attempt type, an estimated-score trend (axis pinned 130–170) above the accuracy trend (0–100), weak subtopics, subtopic and difficulty tables, the session log with question-by-question drill-down, Mistake patterns, a waive banner.
  - Events: `#events` (list), `#events/<event>` (KPIs, score spread, by-section table, question-by-question with the trap answer, subtopic accuracy, cohort mistake analytics, every student), `#events/<event>/<attempt>` (one student against the cohort). Retakes show "attempt 2 of 2".
  - Free attempts: free full mocks and free sectionals only. Event papers are excluded. Pro students' sectional attempts are hidden unless "Include Pro students' sectional attempts" is ticked.
- **Deleting** (permanent; no undo in KV or D1):

| Where | What | Confirmation |
|---|---|---|
| Students | a student's whole progress (✕ on the row); one session (✕ inside) | confirm dialog |
| Events | a whole event; one student's attempt | type DELETE for the event, confirm for one attempt |
| Free attempts | one attempt; "Delete all n shown" (follows filters) | confirm; type DELETE for all |
| Events | **Delete all events** (clears every event, free-mock and sectional attempt and its log tags) | type DELETE |
| Events | **Tidy up old storage** (see section 6) | one click |

  `POST /admin/attempts/delete` takes up to 20 attempts per call and rebuilds the KV key itself, so it can only touch `mock_attempt:` records. Deleting an attempt also clears its tags and log requirement. A Pro student's access record (`student:{email}`) is **not** touched by any of these; that stays in `admin.html`.

### 4.2 Why the Coach View no longer burns KV reads
It used to make 90 `list` calls plus a `get` per attempt on every Events open, and 365 plus a `get` per attempt on every drill-down. Now every submission writes a small summary row to D1 `mock_attempt_index` (kept forever) and the full answer sheet to KV with a 3-day expiry. List views cost zero KV reads. Drill-downs read only unexpired attempts, in pages of 40 (the free plan allows 50 subrequests per request). An attempt whose detail expired still shows score, accuracy, timing and tags; only the question-by-question view goes.

Purge clears the D1 index and log rows (three SQL statements regardless of size) and lets KV expire on its own, because manual deletes would spend the 1,000 daily free deletes on records already leaving. `hard: true` forces KV deletion in capped batches. Everything fails open: with no D1 binding, no `mock_attempt_index` table or a failed query, views fall back to the old KV scan.

### 4.3 Error log and the review-first gate

- **Every wrong or skipped question must be tagged**, with no skip option. Required: one "What went wrong" chip (Concept gap, Method or formula not recalled, Misread the question, Calculation slip, Careless, Fell for the trap, Diagram or table misread, Didn't know where to start). Optional: one "Why" chip (Rushed or ran out of time, Fatigue, Changed a correct answer, Guessed, Overthought) and a note. Hints are shown but never pre-selected.
- **Families:** knowledge gaps (concept gap, method, where to start), reading and setup (misread, diagram, trap), execution (calculation slip, careless). Each needs a different fix.
- **The gate:** after any test with at least one wrong or skipped question the student sees only the review (mistakes with chips, a sticky progress banner and a greyed "Proceed to analytics →"). It enables when every wrong or skipped question is tagged or the coach waives. Tagging the last one does not open anything by itself. A perfect score is never held.
- **Hidden until Proceed:** score, accuracy, estimated score and range, all breakdowns, time tables, diagnosis, upsells, downloads, retake and navigation, and the free mock's attempt history. Correct answers stay visible in the review.
- **Surfaces and gate type:** event mock, free sectional, free full mock = server (attempt id); Pro sectional, Pro full mock, Pro topic tests = server (Pro session); **free topic tests = local only** (anonymous, nothing server-side, a reload escapes it).
- **Admin override:** Pro via the existing waive buttons; events, free sectionals and free mocks via Coach View → Events → "Waive this log" / "Waive pending logs". A student already on the review screen is released within about 30 seconds (the page polls on tab focus, visibility and every 30 s). Waive releases the requirement and never deletes tags.
- **Analytics** (one renderer, `GREErrorLog.mountPanels`, used by the student's My Progress, the coach's student page and the event cohort pooled view): headline strip; mistake families; reality check (tags vs clock and difficulty); most common mistakes; why it happened; where; mistake map (subtopic × type); session by session; time signature; ranked "what to do next" (at most three); filtered mistake list. Pro panels open at 10 logged mistakes; events show full panels at 3 or more and a one-line summary at 1–2.
- **Fail-open everywhere:** a missing table, a 5xx, an old Worker, a failed script load or a thrown hold set-up means no lock. Only results flagged `requires_error_log` by the new client create a requirement, so cached old pages never lock anyone. Tags live in their own tables, so re-saving a session never wipes them. Failed syncs queue in `gre_errlog_outbox` (max 15) and retry; an offline event submission replays on the next visit.
- **Limits:** the gate is behavioural, not tamper-proof (the hidden parts are in the page). Event resume is per browser; a new device is not held. Forced tagging can yield "first chip" answers, so review real tag distributions after a few weeks. "Changed a correct answer" is self-reported. The plan's "drill this" deep link is not built (the renderer accepts a `drillHref(topic, subtopic)` option).

### 4.4 Scoring (`score-scale.js`, the only copy of the model)

- **Weights:** easy 1.00, medium 1.15, hard 1.35, extreme_hard 1.55. Keys normalise (`extreme_hard`, `Extreme Hard`, `extreme hard`).
- **Anchors** (weighted accuracy → scaled): 0 → 134, .25 → 145, .40 → 152, .50 → 156, .60 → 159, .70 → 162, .80 → 165, .90 → 168, 1 → 170.
- **Band:** `round(16/√n)` plus a scope penalty (mock 0, sectional +1, topic test +2), clamped 3–10. A 27-question mock is ±3, a 14-question sectional ±6, a 10-question topic test ±7. `note` text is printed verbatim by every page; sets under 8 questions are prefixed "Too few questions to be reliable yet". A set with no recognised difficulty returns `null` ("—").
- **Route ceilings** (full mocks only): the Section 2 form served compresses 130–170 into 130–ceiling: easy 158, medium 165, hard 170. A perfect easy section cannot out-score a hard one. The form is stored on the session so Coach View re-scores to the number the student saw. Sectionals, topic tests and attempts stored before this pass no route and score as before.
- **Surfaces:** every mock, sectional and topic test shows an estimated Quant score with a range; Coach View recomputes it from the stored questions rather than reading a saved field.
- **API:** `fromQuestions`, `fromResults`, `fromSession`, `fromCounts`, `scaledFromWeighted`, `bandFor`, `scopeFor`, `routeFor`, `pickForm`.
- **Known calibration issue:** anchors are generous (58% raw on a sectional gives 158; real GRE puts it nearer 152–155). They were kept so no past score moved. Open decision 1 is the same lever.
- **Score-first page (`score-card.js`, loaded by both full mocks, both sectionals and the event mock):** order is score page → error log → analysis. The score page is full-screen and deliberately bare: the scaled score out of 170 and its range, nothing else (no accuracy, counts, section split or diagnosis). If the script fails to load the student lands on the review as before.

### 4.5 The 10 mocks (rebuilt 2026-10-29)

**Why Section 1 felt "very very easy":** all 570 questions in the old papers came from the bank's `easy` and `medium` tiers, never the hard tier, and the labels are inflated about a level (a bank `medium` is a one-step item). The two items labelled `hard` in the old mock_01 Section 1 were one-liners. Three of the Section 1 DI sets (mocks 02, 03, 07) were also unanswerable: the stems asked about categories the exhibit did not contain.

**The hard tier has three strata:** KMF-origin (287, genuinely ETS-hard, 12/12 in a blind sample), sectional (176, genuinely hard, 12/12), and generated (905, only about a third truly hard).

**Decisions taken with the owner:** every mock at true real-GRE level (no escalating ladder); Section 1 has no easy items.

**What a paper is:** 57 slots, 570 distinct questions across the ten papers, none repeated. Labels reflect work required (`ETS_RUBRIC` Part 2.5):

| mock label | source | band |
|---|---|---|
| `medium` | generated-hard | 155–162 |
| `hard` | KMF + sectional | 162–167 |
| `extreme_hard` | bank extreme, 2 per paper, Section 2 only | 167–170 |

- **Section 1** (12 q, 21 min): 7 medium / 5 hard. 9 bank items (QC 4, MCQ 3, select-all 1, numeric 1) plus a three-question DI set at positions 5–7 off one shared exhibit.
- **Section 2** (15 q, 26 min), three forms: easy 10 medium / 5 hard; medium 7 / 7 / 1 extreme; hard 4 / 10 / 1 extreme. Types QC 5, MCQ 6, select-all 2, numeric 2.
- **Routing** (`meta.routing` `{medium: 4, hard: 7}`, `adaptive_threshold` 7): Section 1 correct < 4 → easy form, 4–6 → medium, 7 or more → hard.
- **Pacing:** Section 1 runs 100–103 s per question (real GRE 105); Section 2 forms 102–108. Drawing only from the hard tier first pushed every paper to 96–107% of its clock, so a repair pass swapped within tier and type, then across papers.
- **Free mocks** `mocks/mock_01-02.json` are byte-identical to pro 01–02. Files are `indent=1`, `ensure_ascii=False`, no trailing newline. Meta carries `built: "2026-10-29"`, `built_from`, `blueprint`, `adaptive_forms`.
- **DI sets:** ten rebuilt, 30 questions, each ramping medium → hard → hard. Every key is computed from the exhibit data, never typed, and was recomputed independently (`validate.py --solutions`: 0 errors, 0 warnings). Writing the independent solver caught eight defects in the first draft (seven explanations contradicting computed keys, one negative answer).
- **Method, if you need to redo it:** pool the hard tier; drop 15 structurally defective ids; drop items budgeted over 130 s (140 for extreme); reserve exhibit items for DI sets; assign per container so QC (only 90 hard-stratum items for about 80 slots) lands on medium slots and the other types buy the hard slots; spread across source files and topics; then time-repair. Remember open decision 2 (type order).
- **Verification:** `validate.py` over all 570: 0 errors (348 `estimated_time_seconds unusual for <difficulty>` warnings, expected from re-labelling items down); seven bank keys re-solved with sympy, all correct; free `full_mock.html` run end to end in a browser, no page errors.
- **Real GRE shape** (reconstructed from the KMF import's "Section N Base / Hard" tags): real Section 1 is 27% easy / 56% medium / 17% hard / 1% extreme; the hardest real Section 2 is 3% / 58% / 37% / 2%. Real mixes are never all-extreme.

### 4.6 Event mocks (`events/mock_test.html`)

- Full ETS replica shell like the mocks: Exit Section (Submit Test on single-section events, with confirmation), Calculator, Help, Mark, Review, Back, Next; HH:MM:SS strip with Hide Time (forced visible in the last 5 minutes); radio/checkbox rows, Quantity grid, numeric box `#ne-input`; exhibits via `GREExhibit.html(q)`; KaTeX via `GREMath`; review table where review time is not charged to a question; ETS-style dialogs instead of `window.confirm`; "Before You Begin" screen built from the event config; card-page section break; arrow keys. Back and Review are hidden when `allow_navigation` is false.
- Unchanged: scoring, per-question timing, section timers and auto-submit, shuffling inside sections, submission payload, the error-log gate, the score card, results and coach view. Answers stay `"A"`, `["A","C"]` or `"12.5"`.
- Verified in Chromium on the sectioned `current.json` (27 q, 12 min + 15 min sections) and single-section `mock_002.json` (10 q); phone width has no horizontal overflow.
- **Team Battle was removed** (`events/team_battle.html` and everything that existed only for it). The Worker still stores a `team` field if sent, and Coach View labels old `team_battle` attempts "Team battle (retired)".
- Free events serve free-bank questions only (`current.json` rebuilt from `bank/`; 14 pro-only items replaced in `mock_001/002`).

### 4.7 Content and bank state

- **Counts** (2026-10-24, unchanged since): free 848 topic + 48 sectional; pro 9,629 topic + 418 sectional. Difficulty mix after the purge: free 258 / 319 / 201 / 70, pro 2,510 / 4,451 / 2,328 / 340 (easy / medium / hard / extreme). Marketing quotes 9,629 and 95 subtopics, 24 free subtopics, 10 mocks (2 free).
- **Purge (2026-10-24):** every question scoring ≤ 2 on the ETS-fidelity scale or carrying a structural defect tag (`explanation_error`, `no_correct_option`, `wrong_key`, `figure_contradicts_stem`, `chart_data_corrupt`, `missing_data`, `figure_missing`, `malformed_type`) was deleted, plus 13 cross-file free-bank duplicates. **370 distinct questions** were removed (793 entries across files; 271 pro only, 11 free only, 88 in both). The homepage briefly said 806, which counted entries; it was corrected to 370 everywhere. 38,646 `ets_*` QA fields were stripped from shipped JSON. The pre-purge bank with every verdict is in git at `3195cd3`.
- **Public audit page** `/audit/`: all 370 ids, bank, topic, label, failure tags and the reviewer's note; no question text. Biggest reasons: filler distractors (138), trap mismatch (114), textbook phrasing (88). Geometry (91) and Data Interpretation (67) lost the most.
- **KMF 1804 import (merged 2026-10-03/04):** 996 rewritten questions in 82 subtopic files, ids `<SUBTOPIC>-KMF-###`, tagged `origin: "kmf1804"`, `origin_set` ("Section N Base" / "Section N Hard"), `source_pages`. Audited twice (754 sonnet key audits, 411 opus audits of the riskiest, 141 flags re-solved; every stated answer correct). `GEO-CIR-KMF-023` (ellipse) was dropped. Three source items were unbuildable (S49 Base Q11, S55 Base Q10, S56 Hard Q4). The pro logger now stacks chart + table + svg instead of showing one exhibit.
- **Wording audit (2026-10-22):** 1,376 questions edited; hard-rule errors across the pro bank went 868 → 65 (all accepted or checker false positives); all 59 mock QC items had used "Column A/B" and were rewritten; 3,100 "Column A/B" occurrences rewritten across 112 files; the pro logger had printed "Compare Column A and Column B" above every QC. 39 questions reordered to ascending options; four malformed items repaired. `learn/practice` and `learn/pro-body` are otherwise still September snapshots.
- **ETS-fidelity audit (2026-10-06 to 10-19):** 4,920 claude-generated questions re-solved blind and scored; 111 key disputes triaged (only 4 were the first auditor's error; 24 keys were really wrong); 89 corrupted exhibits rebuilt from stems; 889 difficulty labels recalibrated, all downward; 654 weak questions revised; 12 flagged questions repaired. Four free sectional sets (`bank/sectional/*_set1.json`) are the free samples; do not delete them.
- **Handbook** `/handbook/`: 63-page A4 revision handbook, 28,050 words, from one source `concepts/handbook/HANDBOOK.md` via `concepts/build_handbook.py` (never hand-edit the HTML). Plain-text math. Page is free and indexable; the PDF sits behind a one-field email gate posting to `/lead`, which releases the download even if the Worker call fails. A Pro conversion layer (bridge band, rail card, end-of-section boxes, end offer; clicks fire `handbook_pro_clicked` with a `data-track-from` slot) uses only facts already on `pricing.html`. Leads are stored as `lead:{email}` and are not students. Three agents re-derived every formula in sympy: eight defects found and fixed.

### 4.8 Site and marketing state

- **Homepage** (`index.html`, 11 sections, best proof first): top bar with the audit line; hero (defines "trap" in its first sentence; CTAs "Get Pro" and "Start with 10 free questions"); proof bar; the named-trap worked example; glossary; "Start free" as Learn → Drill → Time it → Test; "How this was built"; ETS diagnostic upload; pricing and guarantee; fit section with a beginner fork; FAQ. Nav has Study Material and Free Practice dropdowns; "Get Pro — from ₹399" on every page.
- **Layout lessons:** `.free-list` bold leads over about 35 characters wrap and misalign; `html{overflow-x:hidden}` stops the glow blurs scrolling sideways on phones.
- **Free full mock** gives an estimated score with range, a computed weakness report, a drill button deep-linking `?start=guided&topic=…`, a PDF report and on-device attempt history. The free practice app no longer needs a name ("Student" default) and its difficulty pills are 42px tall.
- **Strategy documents** (kept in the project, not handoffs): `claude/conversion_diagnosis_marketing_2026-10-24.md` (three student personas, CAC arithmetic, 90-day plan; the headline is that under 100 visitors a month, so traffic, not the funnel, is the problem) and `claude/trust_strategy_2026-10-24.md` (stop asking to be believed and be checkable: explanations as marketing, public audit, risk reversal).

---

## 5. Files changed in the most recent round (committed in a2fb531)

| File | Change |
|---|---|
| `pro/mocks/mock_01..10.json`, `mocks/mock_01-02.json` | rebuilt (4.5) |
| `events/mock_test.html`, `events/events_common.js`, `events/gre-exam.css` | ETS shell for event mocks (4.6) |
| `cloudflare/coach.html` | event attempts removed from the Free attempts tab |
| `full_mock.html`, `pro/full_mock.html` | ladder copy replaced; blueprint comment updated |

---

## 6. Deploy checklist (confirm each; status unknown from here)

1. **D1 console:** run the `CREATE TABLE IF NOT EXISTS` blocks in `cloudflare/schema.sql` (re-running the whole file is safe). Seven tables listed in section 3.
2. **Cloudflare dashboard:** deploy `cloudflare/worker.js`. Bindings: D1 as `GRE_DB`, KV `GRE_AUTH`. Variables: `ADMIN_SECRET`, `PROGRESS_SECRET` (recommended). Optional cron trigger, for example `17 20 * * *`, for a nightly sweep; without it nothing piles up because new attempts self-expire.
3. **Publish the site** (GitHub Pages is push-to-deploy; this is already pushed).
4. **Once after deploying the Worker:** Coach View → Events → **Tidy up old storage**. Attempts saved before the expiry existed have no index row and never expire; this indexes them and removes the ones past three days. Safe to re-run.
5. **Smoke test, about five minutes:** sit `full_mock.html`, get about half of Section 1 right; check question 5 shows an exhibit, the break appears, the score page shows nothing but the score, Continue lands on the error log with Proceed greyed, tagging everything enables it, and the analysis matches the score. Then open Coach View → Events and confirm the list loads and the retention line appears. Waive a log from the Events tab while a review is open and watch the button enable within about 30 seconds. Publishing pages before the Worker is safe: delete buttons alert and nothing is lost.
6. **Lead capture** records nothing until the Worker with `/lead` is live.

---

## 7. Gotchas that cost real time

- **Every surface has more than one exit path.** Before hooking "when a session ends", enumerate them. Current hooks: Pro logger `bankFinish()`, `examSubmit()`, `generateReport()` → `saveProgressSession`; `pro/sectional.html` `saveAttempt()` and `pro/full_mock.html` `showResults()` → `GREProgress.save`; free logger `bankFinish()`, `examSubmit()`, `generateReport()` → `recordFreeSession`; `sectional.html` `saveAttempt()` → `GREProgressLocal.recordAttemptPayload`; `full_mock.html` `showResults()` → `GREProgressLocal.record`; `events_common.js` `submitEvent()` → `recordAttemptPayload`. `bankState.results` is assigned in exactly two places per logger.
- **Do not delete dead markup without checking load-time code.** The "Log a Session" panel stays in the DOM because two load-time `getElementById('session-date').value = …` statements have no null guard. About 600 lines of unreachable functions remain in the Pro logger for the same reason. `buildBankSessionData()` is live and must stay, and `uploadedSessions` stays because `generateConsolidated()` reads it.
- **Replacing an option set moves the correct letter.** The most dangerous operation in this codebase. Always recompute the letter by locating the originally-correct option in the new list, and evaluate symbolically when text matching fails (`1 − π/4` vs `(4 − π)/4`, `8/√3` vs `8√3/3`). Never re-letter by hand.
- **Mixed bags and duplicates.** `*_mixed_bag.json` repeats subtopic content by design (3,908 shared ids in pro). A first purge pass that treated them as duplicates gutted the pro bank from 10,738 to 5,441 and had to be restored from git.
- **Match by id within claude-generated questions** (text hashes break once stems are rewritten); 12 pairs of different ids share identical text, a pre-existing duplication.
- **Weighted accuracy is a ratio.** Making papers harder lowers every score unless something moves, and without explicit route ceilings a perfect easy section scores like a perfect hard one.
- **Label inflation is uneven.** Check the stratum (KMF / sectional / generated) before trusting a bank difficulty label.
- **Free-tier limits that shape design:** KV 1,000 writes and 1,000 deletes a day, 100k reads a day; Workers 50 subrequests per request; D1 100,000 row writes a day (a 10-question session costs 11).
- **Regex hazards:** a terminology pass once capitalised sentence-initial maths variables ("x is a positive integer" → "X is …") across 531 questions; restore from backup and replay. `validate.py` flags "column a" inside phrases like "column and answer"; reword.
- **KMF-style rewriting:** prose rules alone made leakage worse; recording `_source_stem` and policing it with a masked verbatim check fixed it (mask numbers and variables, ignore pure placeholder runs). Parallel agents need their own scratch folders. Make agents save every few items. Sonnet suits bulk passes; Opus suits adversarial ones (key triage, option-letter resolution, distractor design).
- **Verify before reporting a defect.** The "stale index", the "45% duplicates" and the "ASCII notation inconsistency" in earlier audits were all working as designed; a `year_as_data` flag was a commission chart.
- **Verify tooling output.** A failed `rm` short-circuited an `&&` chain and a regeneration silently never ran; assert on regenerated content.
- **Root `mock_test.html` and `previous.html` are gone** (orphans, one carried a personal name in its title). The live event mock is `events/mock_test.html`.

---

## 8. Reference: the gre-question-gen skill

Use it for any question generation, repair or diagram work, even for a few questions. It defines the schema, the ETS standard, the wording contract (section 2), QC verbatim options, ascending options, select-all conventions, an off-syllabus scan, the independent-solution gate (`solutions_*.py` plus `validate.py --solutions`), difficulty bands and the diagram workflow. `ETS_RUBRIC.md` takes precedence over the skill's reference files (`references/gre-scope.md` lines 78, 91, 121 and `references/trap-patterns.md` lines 157, 166 still carry old Column A/B and select-all wording).

---

## 9. What this consolidation replaced

**Removed from the project (2026-10-29), each folded into the sections above:**
`mock_difficulty_rebuild_2026-10-29`, `event_gre_shell_handoff_2026-10-29`, `kv_scorepage_adaptive_handoff_2026-10-29`, `delete_options_handoff_2026-10-27`, `review_first_gate_handoff_2026-10-27`, `events_error_log_handoff_2026-10-27`, `error_log_handoff_2026-10-26`, `scaled_score_2026-10-25`, `student_progress_d1_2026-10-24`, `fixes_applied_2026-10-24`, `homepage_slim_2026-10-24`, `audit_page_2026-10-24`, `handbook_2026-10-24`, `handbook_pro_conversion_2026-10-24`, `wording_audit_2026-10-22`, `ets_fidelity_followup_2026-10-19`, `ets_fidelity_audit_2026-10-06`, `kmf_1804_import_progress`.

**Kept in the project:** `conversion_diagnosis_marketing_2026-10-24` and `trust_strategy_2026-10-24` (strategy, not handoffs).

**Recoverable from git:** nine repo handoffs deleted in commit `8f99c73` are in its parent, for example `git show 8f99c73^:HANDOFF_ETS_AUDIT_2026-10-06.md`, and likewise `HANDOFF_WORDING_AUDIT_2026-10-22.md`, `HANDOFF_HANDBOOK_2026-10-24.md`, `HANDOFF_FIXES_APPLIED_2026-10-24.md`, `HANDOFF_HOMEPAGE_SLIM_2026-10-24.md`, `HANDOFF_AUDIT_PAGE_2026-10-24.md`, `HANDOFF_TRUST_STRATEGY_2026-10-24.md`, `HANDOFF_CONVERSION_MARKETING_2026-10-24.md`, `HANDOFF_2026-09-26.md`. The repo's `HANDOFF_STUDENT_PROGRESS_2026-10-24.md` was renamed to `HANDOFF.md` and rewritten. The project docs for 2026-10-25 to 2026-10-29 (scaled score, error log, events error log, review gate, delete options, KV/score page/adaptive, event shell, mock rebuild) and the KMF import progress doc had no git copy; their load-bearing content is in this file.
