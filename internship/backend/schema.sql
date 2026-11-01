-- ShopNow Internship — cohort backend (Cloudflare D1 / SQLite)
-- Run once against your D1 database (see README_BACKEND.md).

CREATE TABLE IF NOT EXISTS cohorts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  join_code  TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- Pre-approved emails per cohort. Registration requires the join code AND the
-- student's email to be on this list — this is what stops someone who was
-- merely handed the join code (not enrolled) from registering.
CREATE TABLE IF NOT EXISTS allowed_students (
  id         TEXT PRIMARY KEY,
  cohort_id  TEXT NOT NULL,
  email      TEXT NOT NULL,
  added_at   TEXT NOT NULL,
  mode       TEXT NOT NULL DEFAULT 'subscriber', -- the mode a NEW user is created with on first sign-in
  UNIQUE (cohort_id, email)
);

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  cohort_id  TEXT NOT NULL,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  token      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',      -- active | revoked (mentor can revoke access)
  mode       TEXT NOT NULL DEFAULT 'subscriber',  -- subscriber (self-paced) | managed (manager assigns tickets)
  progress   TEXT,               -- JSON snapshot of the student's localStorage progress
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (cohort_id, email)
);

CREATE TABLE IF NOT EXISTS submissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  cohort_id  TEXT NOT NULL,
  ticket_id  TEXT NOT NULL,
  status     TEXT NOT NULL,      -- done | review | wip | todo
  work       TEXT,               -- the submitted SQL or note
  created_at TEXT NOT NULL
);

-- Managed-mode assignments: which ticket a manager has handed to a student, and when it's due.
-- Only one 'active' row per user at a time (enforced by the partial unique index below) --
-- assigning a new ticket flips the old active row to 'reassigned' first.
CREATE TABLE IF NOT EXISTS assignments (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  ticket_id    TEXT NOT NULL,
  note         TEXT,             -- optional manager instructions, shown to the student
  due_at       TEXT,             -- ISO date, nullable (no deadline set = no pressure shown)
  status       TEXT NOT NULL DEFAULT 'active', -- active | done | reassigned
  assigned_at  TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sub_user   ON submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_sub_cohort ON submissions (cohort_id);
CREATE INDEX IF NOT EXISTS idx_users_cohort ON users (cohort_id);
CREATE INDEX IF NOT EXISTS idx_allowed_cohort ON allowed_students (cohort_id);
CREATE INDEX IF NOT EXISTS idx_assign_user ON assignments (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_assignment ON assignments (user_id) WHERE status = 'active';
