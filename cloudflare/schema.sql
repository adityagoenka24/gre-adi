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
