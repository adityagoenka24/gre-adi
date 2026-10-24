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

---

# Round 3 — UI cleanup + student-centric Coach View

## 15. Buttons removed

Gone from both loggers:

| Screen | Removed |
|---|---|
| Exam Mode analysis | Save Session · Send to Tutor |
| Bank practice complete | Save Session Data · Send to Tutor |
| My Progress (consolidated) | Send to Tutor (Download PDF kept) |
| Manual session report | Save Session Data · Send to Tutor |

`New Session` / `Practice Again` / `Download PDF` all kept.

The Pro logger's **"Log a Session"** tab button is removed, so the manual
logger is no longer reachable.

**The panel markup was deliberately left in the DOM.** Two statements run at
page load — `document.getElementById('session-date').value = …` at lines 2814
and 4379 — with no null guard. Deleting the panel would throw during load and
take the whole logger down. Without an `.active` class the panel never
displays, so removing the tab button is sufficient. `resetSession()` also
reached for that tab; those two lines are now optional-chained.

The now-unreachable functions (`startSession`, `endSession`,
`buildReviewPanel`, `renderSessionReport`, `generateReport`, `downloadJSON`,
`downloadPDF`, `sendSessionMailto`, `sendBankMailto`,
`saveBankSessionAsJSON`, `sendConsolidatedMailto`) were left in place.
Excising ~600 interdependent lines from a 4,300-line live file is a much
bigger risk than dead code. `buildBankSessionData()` is still live and must
stay — the progress saves depend on it.

The free logger's "New Session" tab was already commented out, so it only
needed the button removals.

## 16. Coach View rebuilt around the student

The cohort tab is gone. Two tabs remain: **Students** and **Event mock
attempts**.

**Attempt types are now named.** Every stored `session_type` maps to a label
and icon:

| `session_type` | Shown as | Group |
|---|---|---|
| `bank_practice` | 🎯 Topic Test · Practice | Topic Tests |
| `bank_exam` | ⏱ Topic Test · Exam Mode | Topic Tests |
| `sectional` | 📐 Sectional | Sectionals |
| `full_mock` | 📝 Full Mock | Mocks |
| `event_mock` | 🏆 Event Mock | Mocks |
| `manual` | ✏️ Logged Session | Other |

**Students table** — one row per student with a chip row showing the mix of
what they've attempted (`🎯 Practice 2  ⏱ Exam 1  📐 Sectional 2 …`), plus
sessions, questions, accuracy and last-active. Click anywhere on a row.

**Student detail** —
1. Name, email, last active
2. KPI cards: overall accuracy, sessions, questions, avg/question
3. **What they have attempted** — a card per attempt type with session count,
   question count, avg time, accuracy bar and date range
4. Accuracy trend (inline SVG, y-axis pinned 0–100; hovering a point names
   the date, the attempt type and the score)
5. Needs work — weak subtopic badges (≥3 attempts, under 60%)
6. Full subtopic breakdown, worst first
7. Difficulty breakdown
8. **Every session** — with a type badge, and each row expands to that
   session's question-by-question detail: subtopic, difficulty, type,
   correct/wrong/skipped, time (over 3 min flagged amber) and question ID

The drill-down costs no extra request: the detail view calls
`/admin/progress?email=…&include_payloads=1`, so every question of every
session arrives in one response and expanding a row is instant.

## 17. Worker: per-type counts

`/admin/progress-students` now returns `by_type` per student —
`{bank_practice:{sessions,questions,correct,accuracy}, …}` — from a second
`GROUP BY email, session_type` query.

`/admin/progress?email=` now returns a `by_type` array with per-type
sessions, questions, correct, total_time and date range.

`/admin/cohort-weakness` is **still in the Worker but no longer used by any
page.** Left in place in case the cohort view is wanted back; safe to delete
(it is self-contained) if not.

## 18. Round 3 verification

- **23 checks** on the extended Worker endpoints, against real SQLite with a
  mixed set of 7 sessions across all 5 types: per-type session counts,
  per-type accuracy, preserved totals, `by_type` date ranges, payload
  inclusion for drill-down, payload field stripped from the response,
  ordering, and unchanged auth.
- **22 checks** driving the Coach View's real render functions under a DOM
  shim with worker-shaped fixtures: type chips, HTML escaping of an
  apostrophe in a student name, type cards, trend SVG and its tooltips, weak
  subtopics, the session table, the question drill-down, and confirmation
  that no cohort markup remains.
- Round 1 and 2 suites re-run: no regressions.

**97 checks across four suites, all passing.**

## 19. Round 3 files

Modified: `cloudflare/worker.js`, `cloudflare/coach.html` (rebuilt),
`pro/gre_practice_logger_pro.html`, `gre_practice_logger_free.html`

---

# Round 4 — Import zone removed from My Progress

With auto-save covering every surface and the "Save Session" buttons gone,
students can no longer produce session JSON files, so the drag-and-drop
import zone had nothing left to import. Removed from both loggers.

Taken out: the drop zone, the hidden file input, the uploaded-files list, and
the **Generate Dashboard** / **Clear All** buttons. The Progress tab is now a
header card plus the dashboard and its **Download PDF** button.

**The part that would have broken the page.** Three load-time or
auto-load-time dependencies had to go with the markup:

1. `const uploadZone = document.getElementById('upload-zone')` followed
   immediately by `uploadZone.addEventListener(...)` — this ran at page load
   and would have thrown on a null element, taking the whole logger down.
   The listener block was removed.
2. `renderUploadedFiles()` wrote into `#uploaded-files-list` and is called by
   `syncProgressTab()`. It now returns early if the element is absent, and
   `syncProgressTab()` no longer calls it.
3. `handleFileUpload`, `removeFile` and `clearUploadedFiles` each dereferenced
   `#generate-consolidated-btn` unguarded. All three are now optional-chained,
   even though no markup can reach them any more.

`generateConsolidated()` reveals the dashboard itself (`classList.add('visible')`),
so the auto-load path never needed the button — `syncProgressTab()` is now
fetch → populate `uploadedSessions` → `generateConsolidated()`.

`uploadedSessions` **stays**: it is the array `generateConsolidated()` reads and
the one `syncProgressTab()` fills from the server. The `.upload-zone` CSS is now
unused but harmless and was left alone.

Copy updated to match reality — Pro: "Every practice session, sectional and
mock you complete is saved automatically and appears here — on any device you
log in from. Nothing to upload." Free: the same sentence as the Pro pitch.

## Cohort endpoint deleted

`/admin/cohort-weakness` and `handleAdminCohortWeakness()` are gone from the
Worker (route + handler, ~1,900 characters). The Worker is now 1,500 lines.

The `attempts` table **stays** — it is what makes per-student subtopic and
difficulty accuracy a single `GROUP BY`, which is what the coach view reads.
Only the cross-student rollup was removed. The doc comment at the top of the
progress section was corrected to say so, since it had justified the table by
the cohort view.

Four progress endpoints remain:

| Endpoint | Auth |
|---|---|
| `POST /progress/save` | student token |
| `GET /progress/sessions` | student token |
| `GET /admin/progress-students` | `X-Admin-Secret` |
| `GET /admin/progress?email=` | `X-Admin-Secret` |

## Verification

Two test suites had referenced the deleted endpoint and were updated rather
than dropped: both now assert it returns **404**, and the admin-auth check
that had used it was repointed at `/admin/progress-students`.

All four suites: **29 + 22 + 23 + 22 = 96 checks, 0 failures.** Every touched
file passes a JS syntax check, and no markup references the removed import
handlers.

---

# Round 5 — Student names stop being the student's problem

Three connected changes: the app stops asking a logged-in Pro student for a
name it already has, the webhook captures the buyer's name when Razorpay
supplies it, and the admin panel can set or correct a name by hand.

## 20. Pro students are no longer asked for their name

`/validate` now returns `name` alongside `access` and `progress_token`, on all
three success paths. The Pro logger stores it in `gre_pro_auth` and
`applyStudentName()` fills the topic-test setup field silently, hiding only its
wrapper.

**The input stays in the DOM on purpose.** `startBankSession()` and the Exam
Mode override both read `#bank-student-name`.value, and both still validate
that it is non-empty. Pre-filling it rather than removing it means neither
code path changed, so neither could break. The new wrapper id
`bank-student-name-group` is what gets hidden.

A legacy student whose record has no name still sees the field, so nobody is
locked out of starting a session. Once a name exists the field never appears
again, and `saveAuth()` keeps any name it already had if a later response
carries none.

`pro-gate.js` stores the name too, so `sectional.html` and `full_mock.html`
save sessions under the real name instead of the `'Pro Student'` placeholder.

The **free** logger still asks, which is correct — free users have no account
to read a name from.

## 21. Webhook captures the buyer's name

New `razorpayName(body, payment)` helper. Razorpay puts the name in different
places depending on how the payment was made, so it tries each in descending
order of reliability:

1. `payload.payment_link.entity.customer.name` — present when the payment came
   from a Payment Link that collected a name, which is what the pricing links
   do. Most reliable.
2. `payment.notes.*` — `name`, `Name`, `full_name`, `fullName`,
   `student_name`, `studentName`, `customer_name`, `customerName`
3. `payment.card.name` — the cardholder name on card payments

Values that are clearly not names are rejected rather than stored: anything
containing `@`, anything matching a bare phone number, the placeholders
`na`/`n/a`/`none`/`null`/`undefined`/`-`, blanks, and anything over 120
characters. A rejected value leaves the name empty for a coach to fill in.

**A name is never overwritten once set.** New records take the extracted name.
Repeat payments, upgrades and reactivations fill the name only if the stored
one is blank, so a correction made in the admin panel survives the student's
next payment. The name is also recorded on the `webhook_manual:` and
`webhook_noemail:` queue entries, so a manual provision has something to work
from.

## 22. Admin panel: add / edit a student's name

New `POST /admin/set-name` — `{ email, name }` — trims, caps at 120
characters, normalises the email, stamps `nameUpdatedAt`, returns 404 for an
unknown student and 400 without an email. An empty name clears the stored one.

In `admin.html`, a **🙋 Student Name** card in the Access tab (email + name +
Save), and a per-row button in the student table reading **Edit Name** or
**+ Add Name** depending on whether one is stored. The button jumps to the
card with both fields pre-filled, mirroring the existing Edit Access flow.
Clearing a name asks for confirmation first.

## 23. Round 5 verification

30 new checks, including webhook calls signed with real HMAC signatures:

- name extracted from each of the three sources
- `payment_link` taking precedence over notes and card
- every rubbish-value rejection (email, phone, `NA`, whitespace, over-long)
- a hand-set name surviving a later webhook, a blank name being filled, and
  reactivation filling a blank name
- `/validate` returning the name on all three success paths, and `''` rather
  than `undefined` when the record has none
- `/admin/set-name` trimming, clearing, capping, email normalisation, 404,
  400, 401, and leaving `access` untouched

All five suites: **29 + 22 + 23 + 22 + 30 = 126 checks, 0 failures.**

## 24. Round 5 files

Modified: `cloudflare/worker.js`, `cloudflare/admin.html`,
`pro/gre_practice_logger_pro.html`, `pro/pro-gate.js`
