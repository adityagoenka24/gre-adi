-- Migration for an already-deployed D1 database (adds Managed Mode).
-- Safe, additive only. Paste into the D1 Console → Execute, or:
--   wrangler d1 execute shopnow_internship --file=backend/migration_002_managed_mode.sql --remote
-- Skip this file entirely for a brand-new database — schema.sql already includes these changes.

ALTER TABLE users ADD COLUMN mode TEXT NOT NULL DEFAULT 'subscriber';
ALTER TABLE allowed_students ADD COLUMN mode TEXT NOT NULL DEFAULT 'subscriber';

CREATE TABLE IF NOT EXISTS assignments (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  ticket_id    TEXT NOT NULL,
  note         TEXT,
  due_at       TEXT,
  status       TEXT NOT NULL DEFAULT 'active',
  assigned_at  TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_assign_user ON assignments (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_assignment ON assignments (user_id) WHERE status = 'active';
