# Cohort backend — deploy on the Cloudflare portal

This adds accounts, central submission capture, and a mentor dashboard on top of the static app. **Nothing here is required to run the app** — with `config.json` `backendUrl` empty, the app stays fully local (save/load JSON still works). Turn the backend on only when you want a cohort.

## The pieces

| Piece | What it is | Where it lives |
|---|---|---|
| **Pages site** | the student app (static) | Cloudflare Pages — the `internship/` folder |
| **Worker API** | `worker.js` — register / sync / submit / admin | Cloudflare Workers |
| **D1 database** | `schema.sql` — cohorts, users, submissions | Cloudflare D1 |
| **Mentor console** | `mentor.html` — roster + submissions | open locally, or host privately |

Data flow: student signs in with a **join code** → the app POSTs progress + each submission to the Worker → the Worker stores it in D1 → the mentor console reads it back with an **admin token**.

---

## Deploy via the dashboard (portal) — step by step

### 1. Create the D1 database
1. Cloudflare dashboard → **Storage & Databases → D1 SQL Database → Create**.
2. Name it `shopnow_internship` → Create.
3. Open it → **Console** tab → paste the entire contents of `schema.sql` → **Execute**. You should see the three tables created.

### 2. Create the Worker
1. **Workers & Pages → Create → Workers → Create Worker**. Give it a name, e.g. `shopnow-internship-api` → Deploy (the placeholder).
2. Click **Edit code**, delete the placeholder, paste the entire contents of `worker.js` → **Deploy**.
3. **Settings → Bindings → Add → D1 database**:
   - Variable name: `DB`  (exactly)
   - D1 database: `shopnow_internship`
   - Save.
4. **Settings → Variables and Secrets → Add**:
   - Type: **Secret**
   - Name: `ADMIN_TOKEN`
   - Value: a long random string you invent (this is the mentor password) → Save.
5. Deploy again if prompted. Note the Worker URL: `https://shopnow-internship-api.<your-subdomain>.workers.dev`.
6. Test it: open `…workers.dev/api/health` in a browser — you should see `{"ok":true,...}`.

### 3. Point the app at the Worker
1. Edit `internship/config.json`:
   ```json
   { "backendUrl": "https://shopnow-internship-api.<your-subdomain>.workers.dev" }
   ```
2. Save. (Leaving it `""` keeps the app fully local.)

### 4. Deploy the Pages site
1. **Workers & Pages → Create → Pages → Upload assets**. Name it e.g. `shopnow-internship`.
2. Drag the **contents of `internship/`** (so `app.html` / `index.html` / `config.json` sit at the root) → Deploy.
3. Site is live at `https://<project>.pages.dev`. (To update later, re-upload.)

### 5. Create a cohort (mentor console)
1. Open `mentor.html` — easiest is to just double-click it to open in your browser (it's static). Keep it private; don't upload it to the public Pages site.
2. Enter your **API base URL** (the Worker URL) and the **admin token** you set → **Save & connect**.
3. **Create a cohort**: give it a name and a **join code** (e.g. `SHOPNOW-A`). Share that join code with students.
4. **Add students to the Allowlist** (see below) — required before anyone can register.
5. As students sign in and work, click a cohort → **Roster** → a student → **Submissions**.

Students click **Sign in to cohort** in the app header, enter the join code + their name + email, and their progress syncs automatically. They can still use **Save / Load progress** files as a backup.

### 6. Refresh, allowlist, and access control (mentor console)

- **Refresh** — the Cohorts, Allowlist, Roster, and Submissions sections each have a **↻ Refresh** button that re-fetches from the Worker (D1 has no push/live updates, so refresh when you want the latest).
- **Allowlist (join-code sharing protection)** — click **Allowlist →** on a cohort card. Paste the enrolled students' emails (one per line, or comma-separated) → **Add to allowlist**. Registration now checks the join code **and** that the submitted email is on this list — a friend a student handed the join code to will be rejected at `/api/register` even though the code itself is valid, because their email isn't approved. Remove an email any time with **Remove**; that only blocks *future* registration attempts, it doesn't touch a student who already registered (use Revoke for that).
- **Grant access** — add the student's email to the allowlist (step above). If they already registered once and were later revoked, adding them back to the allowlist does nothing by itself — use **Restore** in the Roster (see below).
- **Remove / revoke access** — click **Roster →** on a cohort card, find the student, click **Revoke**. This sets their account to `revoked`: they're immediately blocked from `/api/me`, `/api/sync`, and `/api/submit` (effectively signed out — their next sync/submit call gets `401`), but their progress and submission history are kept, not deleted. Click **Restore** to reinstate them.
- The Roster table shows each student's **Status** (`active` / `revoked`) alongside ticket completions and last-active time.

---

## CLI alternative (wrangler)

```bash
npm install -g wrangler
wrangler login
wrangler d1 create shopnow_internship          # copy the printed database_id into wrangler.toml
wrangler d1 execute shopnow_internship --file=schema.sql --remote
wrangler secret put ADMIN_TOKEN                 # paste your token
wrangler deploy                                 # deploys worker.js
# then set internship/config.json backendUrl and: wrangler pages deploy internship
```

---

## Notes

- **Auth model:** cohort join-code + name + email + **email allowlist**, no passwords. The join code alone is not treated as a secret — it identifies the cohort, but `/api/register` also requires the submitted email to be on that cohort's allowlist (managed from `mentor.html`). So a student sharing the join code with a friend doesn't grant that friend access; the friend's email still needs to be added by the mentor. This is appropriate for a training cohort with a known roster; it isn't identity-verified (nothing stops someone from registering with a valid-looking email they don't own), so if you need stronger guarantees, add Cloudflare Access in front of the Pages project or extend the Worker with email magic-links / OTP.
- **Revoking access:** the Roster's Revoke/Restore toggle sets `users.status`. A `revoked` user's token is rejected by every authenticated route (`/api/me`, `/api/sync`, `/api/submit`) — their local app will start getting 401s until a mentor restores them or they can't push further progress. Revoke does **not** delete their row, progress, or submissions.
- **CORS** is open (`*`) so the app on `pages.dev` and a locally-opened `mentor.html` can both call the Worker.
- **Admin endpoints** require the `X-Admin-Token` header — keep the token secret; it's the only thing protecting the roster and allowlist.
- **Free tier:** D1 and Workers free tiers comfortably cover a cohort of students.
- **Resuming on a new device with the backend:** signing in with the same join code + email restores the student's server-side progress. Without the backend, that's what the Save/Load JSON is for.

## Migrating an already-deployed database

If you already ran the old `schema.sql` (before `allowed_students` and `users.status` existed), apply this once against your D1 database (Console tab, or `wrangler d1 execute … --file=migration.sql --remote`):

```sql
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS allowed_students (
  id         TEXT PRIMARY KEY,
  cohort_id  TEXT NOT NULL,
  email      TEXT NOT NULL,
  added_at   TEXT NOT NULL,
  UNIQUE (cohort_id, email)
);
CREATE INDEX IF NOT EXISTS idx_allowed_cohort ON allowed_students (cohort_id);
```

**Important:** until you add emails to `allowed_students` for a cohort (via the mentor console's Allowlist panel), **no new students can register** for it — existing already-registered students are unaffected and keep syncing normally.

### Adding Managed Mode to an already-deployed database

If your D1 database predates the `mode` column and `assignments` table (i.e. you deployed before 2026-07-22), run `backend/migration_002_managed_mode.sql` once against it — D1 Console → paste the file contents → Execute, or:

```bash
wrangler d1 execute shopnow_internship --file=backend/migration_002_managed_mode.sql --remote
```

It's additive only (two `ALTER TABLE ... ADD COLUMN`, one new table, two indexes) — every existing subscriber row defaults to `mode='subscriber'` and is unaffected. After running it, redeploy `worker.js` (it now expects the `mode` column and `assignments` table to exist) and re-upload the updated `internship/app.html` and `backend/mentor.html`. See HANDOFF.md §16 for how Managed Mode works day to day.
