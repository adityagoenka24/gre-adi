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
