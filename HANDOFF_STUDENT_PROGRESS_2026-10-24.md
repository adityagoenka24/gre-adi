# Handoff — Server-side student progress + Coach View (2026-10-24)

Pro students' practice history is now stored server-side in Cloudflare D1 and
rebuilds itself on any device. Free students keep their history in their own
browser and get a locked-history upgrade prompt. A new Coach View page shows
per-student and cohort-wide analytics.

**Cost: ₹0/month.** D1's free tier allows 100,000 row writes/day. One session
costs 1 session row + N attempt rows, so a 10-question session is 11 writes —
roughly 9,000 sessions/day before anything is payable.

---

## 1. Decisions this was built on

| Decision | Choice |
|---|---|
| Who gets server-side progress | Pro students only |
| Store | Cloudflare D1 free tier (not KV — 100× the write headroom) |
| Free tier | History in `localStorage`, locked-history teaser, uploaded on upgrade |
| Existing KV `mock_attempt:` records | Left alone, not migrated |
| Coach view | New `cloudflare/coach.html`, not bolted onto `admin.html` |

Two notes on *why*, since both diverge from the obvious approach:

- **Tokens are stateless HMAC, not KV records.** `/validate` runs on every page
  load. A KV-stored token would spend a KV write each time, against a free
  limit of 1,000 writes/day. Signed tokens cost zero reads and zero writes.
- **Coach View is a separate page.** `admin.html` is already 55 KB. A separate
  page reusing the `gre_admin_secret` / `gre_admin_url` localStorage keys
  inherits the admin login with no extra auth code.

---

## 2. Cloudflare setup (dashboard only — no wrangler)

1. **D1 SQL database** → Create Database → `gre-progress`
2. Open it → **Console** → paste `cloudflare/schema.sql` → Execute
3. **Workers & Pages** → `gre-auth` → **Bindings** → Add binding → D1 database
   → variable name **`GRE_DB`** → select `gre-progress`
4. *(Recommended)* **Settings** → **Variables** → add `PROGRESS_SECRET`, any
   long random string. It signs the student progress tokens. Without it the
   code falls back to `ADMIN_SECRET`, which works but reuses one secret for
   two jobs.
5. Paste `cloudflare/worker.js` into **Edit code** → Save →
   **Deployments** → Deploy version

The variable name must be exactly `GRE_DB`. If it is anything else, every
`/progress/*` call returns `503 Progress storage not configured` — which is
the deliberate failure mode, not a crash.

---

## 3. Schema

Two tables, in `cloudflare/schema.sql` (idempotent — safe to re-run).

- **`sessions`** — one row per session. `payload` holds the full v2.0 session
  JSON exactly as the practice logger exports it. That is what the logger's
  existing `generateConsolidated()` already consumes, which is why the
  dashboard renderer needed no rewrite.
- **`attempts`** — one row per question. This is what KV could never do: it
  makes cohort-wide subtopic analysis a single `GROUP BY`.

A session's primary key is a SHA-256 over its own content (email, startTime,
date, type, topic, notes, question count), so a retry or a double-run backfill
overwrites one row instead of duplicating it. Verified by test.

---

## 4. Worker endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /progress/save` | student token | Saves `{session}` or `{sessions:[...]}` (backfill, max 50) |
| `GET /progress/sessions` | student token | That student's payloads, newest first |
| `GET /admin/progress-students` | `X-Admin-Secret` | Student list with session counts and accuracy |
| `GET /admin/progress?email=` | `X-Admin-Secret` | One student: sessions, subtopic and difficulty stats |
| `GET /admin/cohort-weakness` | `X-Admin-Secret` | Subtopic accuracy across everyone + lowest-scoring questions |

`/validate` now also returns `progress_token` (30-day expiry, refreshed on
every validated load). Accuracy is recomputed server-side, never trusted from
the client.

---

## 5. Client changes

**`pro/gre_practice_logger_pro.html`**
- New PROGRESS SYNC block: token storage, save, fetch, backfill
- `buildBankSessionData()` split out of `saveBankSessionAsJSON()` so the
  download and the background save send identical data
- `bankFinish()` saves bank sessions; `generateReport()` saves manual
  sessions — the later hook on purpose, because `buildReviewPanel()` resets
  `q.correct = null` and answers are not scored until the student marks them
- Progress tab auto-loads on open (once per page load, and only when nothing
  has been uploaded by hand, so a coach comparing specific files is never
  overridden). Drag-drop upload kept as a fallback.

**`pro/pro-gate.js`** — stores the refreshed token, and exposes a shared
`window.GREProgress` write-side helper so the two pages below need no
duplicated logic.

**`pro/sectional.html`** and **`pro/full_mock.html`** — each builds its own
v2.0 session and calls `GREProgress.save()`. Sectional derives real
`startTime`/`endTime` from `submitted_at` minus elapsed time, so two attempts
at the same set on the same day do not collide on the content-derived id.

**`gre_practice_logger_free.html`**
- Sessions kept in `localStorage` under `gqp_free_sessions`, capped at 50
- Locked-history panel after each session: real session and question counts,
  blurred trend preview, `pricing.html` CTA, and an honest line that it is
  browser-only
- On the student's first Pro login in that browser, the Pro logger uploads
  that history and clears the key. Same origin, so this works.

All saves are fire-and-forget. A network failure never blocks or alters a
student's result screen.

---

## 6. Coach View — `cloudflare/coach.html`

Linked from the `admin.html` subtitle. Three tabs:

- **Students** — list with sessions, questions, accuracy, date range. Click a
  row for one student: KPI cards, accuracy trend (inline SVG, y-axis pinned
  0–100 so slopes compare across students), "Needs work" badges, subtopic
  breakdown worst-first, difficulty breakdown, full session list.
- **Cohort weakness** — subtopic accuracy across every student, worst first.
  This is the list to write more questions for. Plus lowest-scoring individual
  questions, which is a defect detector as much as a difficulty one.
- **Mock attempts** — the existing `/admin/mock-attempts` KV records, with a
  name/email filter.

No external libraries; same design tokens as `admin.html`.

---

## 7. Verification

31 automated checks run against real SQLite using the real `schema.sql`
(Node's `node:sqlite` behind a D1-shaped facade), covering: token issuance,
forged/expired token rejection, admin auth, save correctness, server-side
accuracy, idempotent re-save, distinct-session handling, batch backfill,
read-back shape, **cross-student isolation**, all coach endpoints, and clean
`503` degradation when `GRE_DB` is unbound. All 31 pass.

Every modified file passes a JS syntax check.

---

## 8. Known limits

- Free-tier history is per-browser and best-effort. Clearing browser data
  loses it. The UI says so plainly and promises nothing.
- A student's progress is keyed to their email, and email + device fingerprint
  remains the only credential. The signed token closes the direct read hole
  (progress is no longer readable by guessing an email), but anyone who can
  pass the existing Pro login for an email can see that email's progress. That
  is the pre-existing auth model, not something this change introduced.
- `full_mock.html` reconstructs per-question correctness via `checkAnswer()`
  at save time rather than reusing stored per-question results, because the
  page keeps answers and timings in parallel maps rather than a results array.
- Worker is now 1,514 lines and edited through the dashboard. Still workable,
  but this is the point where wrangler would start paying for itself.

---

## 9. Files

Modified: `cloudflare/worker.js`, `cloudflare/wrangler.toml`,
`cloudflare/admin.html`, `pro/pro-gate.js`,
`pro/gre_practice_logger_pro.html`, `pro/sectional.html`,
`pro/full_mock.html`, `gre_practice_logger_free.html`

New: `cloudflare/coach.html`, `cloudflare/schema.sql`

902 insertions, 10 deletions. No non-GRE folders touched. No personal name or
credential claim introduced anywhere.

---

# Round 2 — Exam Mode fix + full free-tier coverage

## 10. Bug found in testing: Exam Mode never saved

The first round hooked `bankFinish()`, which is the **practice mode** exit path.
Exam Mode has a completely separate one — `examSubmit()` — so an exam session
was scored, rendered, and then dropped. `/progress/sessions` returned
`200 {"count":0}` with a valid token and a working D1 binding, which is what
pointed at the client rather than the backend.

`examSubmit()` scores into the same `bankState.results` shape as `bankSubmit()`
and sets `sessionStartTime`, so `buildBankSessionData()` worked unchanged — it
just needed calling. It now takes an optional `sessionType`, and Exam Mode
saves as `bank_exam`.

The same gap existed in the free logger, where `FREE_CONFIG.examMode` is
`true` — free users can reach Exam Mode too. Fixed there as well.

**Lesson for future work:** this app has more than one exit path per surface.
Before wiring anything to "when a session ends", enumerate them. The audit:

| File | Exit path | Hook |
|---|---|---|
| `pro/gre_practice_logger_pro.html` | `bankFinish()` (practice) | `saveProgressSession` |
| `pro/gre_practice_logger_pro.html` | `examSubmit()` (exam) | `saveProgressSession` |
| `pro/gre_practice_logger_pro.html` | `generateReport()` (manual) | `saveProgressSession` |
| `pro/sectional.html` | `saveAttempt()` | `GREProgress.save` |
| `pro/full_mock.html` | `showResults()` | `GREProgress.save` |
| `gre_practice_logger_free.html` | `bankFinish()` | `recordFreeSession` |
| `gre_practice_logger_free.html` | `examSubmit()` | `recordFreeSession` |
| `gre_practice_logger_free.html` | `generateReport()` | `recordFreeSession` |
| `sectional.html` (free) | `saveAttempt()` | `GREProgressLocal.recordAttemptPayload` |
| `full_mock.html` (free) | `showResults()` | `GREProgressLocal.record` |
| `events/events_common.js` | `submitEvent()` | `GREProgressLocal.recordAttemptPayload` |

`bankState.results` is assigned in exactly two places per logger (practice and
exam), both now covered.

## 11. Free-tier coverage extended to every surface

Free history previously covered only the practice logger. It now covers
**topic tests, sectionals and mocks** — every surface a free student can reach.

New file **`progress-local.js`** (repo root) holds one implementation of the
free history: one key (`gqp_free_sessions`), one cap (50), and the converter
from the flat submission payload used by sectionals and event mocks into the
v2.0 session shape. Written as a shared file rather than inlined in four
places so the key and cap cannot drift apart.

API: `read()`, `count()`, `record(session)`,
`recordAttemptPayload(payload, {session_type, topic, label})`, `capWord()`.

Loaded by: `gre_practice_logger_free.html`, `sectional.html`,
`full_mock.html`, `events/mock_test.html`, `events/team_battle.html`
(the last two via `../progress-local.js`).

`gre_practice_logger_free.html` now delegates its `readFreeHistory()` and
`recordFreeSession()` to this helper instead of keeping its own copy.

`full_mock.html` builds its own v2.0 session rather than using
`recordAttemptPayload`, because a mock's per-question detail lives in
`state.mockData` / `state.answers` / `state.timings` rather than a flat
results array, and correctness has to come from `checkAnswer()`.

Every call site is guarded with `if (window.GREProgressLocal)`, so a failed
script load degrades the carry-over without touching the result screens.

Event mocks continue to POST to `/mock/submission` exactly as before — that
KV path is untouched. The local record is additional, not a replacement.

## 12. Round 2 verification

21 further automated checks, run against the real `progress-local.js` under a
`localStorage` shim and then through the real Worker into real SQLite:
payload conversion (type mapping, title-casing, skipped-as-`null`, distinct
timestamps), the 50-session cap, and the **full upgrade path** — free sessions
recorded locally, backfilled into D1, re-read in dashboard shape, with a
repeat backfill proving no duplication.

21 passed, 0 failed. With round 1, **52 checks, all passing.**

## 13. Stale file noticed, not touched

Root `mock_test.html` references `events_common.js` (which exists only in
`events/`) and `../ads-config.js`, so its paths cannot resolve from the repo
root. The live event mock is `events/mock_test.html`. The root copy looks like
a leftover and was left alone — worth deleting once confirmed unused.

## 14. Round 2 files

Modified: `pro/gre_practice_logger_pro.html`, `gre_practice_logger_free.html`,
`sectional.html`, `full_mock.html`, `events/events_common.js`,
`events/mock_test.html`, `events/team_battle.html`

New: `progress-local.js`
