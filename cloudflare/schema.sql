-- GRE Quant Pro — student progress schema (Cloudflare D1, database: gre-progress)
-- Run in: Cloudflare dashboard -> D1 SQL database -> gre-progress -> Console
--
-- sessions.payload holds the full v2.0 session JSON exactly as the practice
-- logger exports it, which is what the existing generateConsolidated() in
-- gre_practice_logger_pro.html already consumes.
-- attempts holds one row per question, which is what makes cohort-wide
-- subtopic analysis a single GROUP BY.

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  student_name    TEXT,
  session_type    TEXT,          -- bank_practice | sectional | full_mock | manual
  topic           TEXT,
  subtopic        TEXT,
  date            TEXT NOT NULL, -- YYYY-MM-DD, Asia/Kolkata
  total_questions INTEGER,
  correct         INTEGER,
  accuracy        INTEGER,
  total_time      INTEGER,
  payload         TEXT NOT NULL,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_email_date ON sessions(email, date);

CREATE TABLE IF NOT EXISTS attempts (
  session_id       TEXT NOT NULL,
  email            TEXT NOT NULL,
  bank_question_id TEXT,
  topic            TEXT,
  subtopic         TEXT,
  difficulty       TEXT,
  qtype            TEXT,
  correct          INTEGER,
  time_taken       INTEGER,
  date             TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_email    ON attempts(email);
CREATE INDEX IF NOT EXISTS idx_attempts_subtopic ON attempts(subtopic, correct);
CREATE INDEX IF NOT EXISTS idx_attempts_session  ON attempts(session_id);

-- ── Error log (added with the post-session mistake log) ──────────────────────
-- Both statements are idempotent, so re-running this whole file is safe.
-- The Worker treats a missing table as "feature off", so it can be deployed
-- before or after these are created without affecting existing behaviour.
--
-- error_log     one row per tagged wrong/skipped question, keyed by
--               (session_id, q_index). Kept apart from `attempts` because
--               /progress/save replaces a session's attempts on every re-save.
-- log_required  one row per saved session that needs a log: the question
--               indices still to tag, and a coach-set `waived` flag.

CREATE TABLE IF NOT EXISTS error_log (
  session_id       TEXT NOT NULL,
  email            TEXT NOT NULL,
  q_index          INTEGER NOT NULL,
  bank_question_id TEXT,
  error_type       TEXT NOT NULL,
  error_cause      TEXT,
  note             TEXT,
  logged_at        INTEGER NOT NULL,
  PRIMARY KEY (session_id, q_index)
);
CREATE INDEX IF NOT EXISTS idx_error_log_email ON error_log(email);

CREATE TABLE IF NOT EXISTS log_required (
  session_id TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  needed     TEXT NOT NULL,
  waived     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_log_required_email ON log_required(email, waived);

-- ── Event error log ─────────────────────────────────────────────────────────
-- Same idea as error_log / log_required, for event mocks (no login). The
-- attempt_id, a random UUID returned only to the submitting browser, is the key.
--
-- event_log_required  one row per event attempt that must be tagged: the
--                     result indices still to tag, the KV key of the stored
--                     attempt, and a coach-set `waived` flag.
-- event_error_log     one row per tagged question, keyed (attempt_id, q_index).

CREATE TABLE IF NOT EXISTS event_log_required (
  attempt_id TEXT PRIMARY KEY,
  event_key  TEXT NOT NULL,
  email      TEXT,
  needed     TEXT NOT NULL,
  kv_key     TEXT,
  waived     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evlr_event ON event_log_required(event_key);

CREATE TABLE IF NOT EXISTS event_error_log (
  attempt_id  TEXT NOT NULL,
  event_key   TEXT NOT NULL,
  email       TEXT,
  q_index     INTEGER NOT NULL,
  question_id TEXT,
  error_type  TEXT NOT NULL,
  error_cause TEXT,
  note        TEXT,
  logged_at   INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, q_index)
);
CREATE INDEX IF NOT EXISTS idx_evel_event ON event_error_log(event_key);

-- ── Attempt index (added with the 3-day detail expiry) ──────────────────────
-- One small, permanent row per event / free-mock / sectional attempt.
--
-- The full attempt record still goes to KV, but now with a 3-day expiry: it
-- is the heavy half (every question, answer and time) and it is only wanted
-- while an attempt is fresh enough to review question by question. The coach
-- list views read this table instead, so opening the Events tab costs one SQL
-- statement rather than hundreds of KV reads.
--
-- kv_key             where the full record lives while it lasts
-- detail_expires_at  unix seconds; past it, the drill-down is gone and the
--                    row is summary-only. The coach page says so.
--
-- Rows outlive the KV record on purpose: scores, accuracy and timings stay
-- for ever at a few hundred bytes each.
--
-- The Worker treats a missing table as "index off" and falls back to the old
-- KV scan, so it can be deployed before or after this runs.

CREATE TABLE IF NOT EXISTS mock_attempt_index (
  attempt_id           TEXT PRIMARY KEY,
  kv_key               TEXT,
  date                 TEXT NOT NULL,   -- YYYY-MM-DD, Asia/Kolkata
  event_key            TEXT NOT NULL,   -- normalised event_id, matches the KV key
  event_id             TEXT,
  event_name           TEXT,
  event_type           TEXT,
  tier                 TEXT,            -- pro | free | '' (event)
  submitted_at         TEXT,
  saved_at             TEXT,
  student_name         TEXT,
  student_email        TEXT,
  student_batch        TEXT,
  team                 TEXT,            -- JSON, or NULL
  score                REAL,
  total_questions      INTEGER,
  accuracy             REAL,
  correct              INTEGER,
  incorrect            INTEGER,
  skipped              INTEGER,
  total_time_seconds   INTEGER,
  average_time_seconds REAL,
  diagnosis            TEXT,            -- JSON, or NULL
  detail_expires_at    INTEGER,         -- unix seconds
  created_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mai_event ON mock_attempt_index(event_key, date);
CREATE INDEX IF NOT EXISTS idx_mai_date  ON mock_attempt_index(date);
CREATE INDEX IF NOT EXISTS idx_mai_email ON mock_attempt_index(student_email);


-- ─── 2026-10-30: move KV-held data to D1 ─────────────────────────────────────
-- Workers KV's free tier is 100k reads / 1,000 writes / 1,000 lists a day.
-- /validate alone read KV on every Pro page load. These tables take over the
-- student records, the full attempt records, the payment review queue and
-- lead capture. The Worker copies existing KV data across by itself, a chunk
-- at a time, from the admin screens, and falls back to KV if a table is
-- missing. Safe to re-run.

-- One row per Pro student; `data` is the same JSON the KV record held.
-- A delete is a tombstone (deleted = 1), so the old KV copy cannot come back.
CREATE TABLE IF NOT EXISTS students (
  email      TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Progress flags for the one-off KV -> D1 copies (students_done etc.).
CREATE TABLE IF NOT EXISTS kv_meta (
  k TEXT PRIMARY KEY,
  v TEXT
);

-- Full attempt record (every question, answer and time), kept 14 days.
-- The coach list reads mock_attempt_index; this is only the drill-down.
CREATE TABLE IF NOT EXISTS mock_attempt_detail (
  attempt_id TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  expires_at INTEGER NOT NULL        -- unix seconds
);
CREATE INDEX IF NOT EXISTS idx_mad_expires ON mock_attempt_detail(expires_at);

-- Payments that need a person: unknown amount (manual) or no email (noemail).
CREATE TABLE IF NOT EXISTS webhook_queue (
  kind       TEXT NOT NULL,          -- 'manual' | 'noemail'
  payment_id TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at INTEGER NOT NULL,       -- ms; rows older than 90 days are dropped
  PRIMARY KEY (kind, payment_id)
);

-- Handbook / email-capture leads.
CREATE TABLE IF NOT EXISTS leads (
  email      TEXT PRIMARY KEY,
  site       TEXT,
  first_seen TEXT,
  last_seen  TEXT,
  count      INTEGER NOT NULL DEFAULT 1,
  source     TEXT,
  sources    TEXT                    -- JSON {source: count}
);
