// ShopNow Internship — cohort backend (Cloudflare Worker + D1)
// Bindings (see wrangler.toml): env.DB (D1), env.ADMIN_TOKEN (secret)
//
// Student routes:  POST /api/register, /api/me, /api/sync, /api/submit
//                  (register requires the student's email to be on the cohort's allowlist)
//                  A user's `mode` (subscriber | managed) is copied from the allowlist row the
//                  first time they register, and can be changed later by the mentor.
//                  Managed students only see one ticket at a time — see /api/admin/assign.
// Mentor routes:   POST /api/admin/cohort, /api/admin/allowlist/add, /api/admin/allowlist/remove,
//                  /api/admin/user/revoke, /api/admin/user/restore, /api/admin/user/set-mode,
//                  /api/admin/managed/create, /api/admin/assign, /api/admin/reset-students
//                  GET  /api/admin/cohorts, /api/admin/roster, /api/admin/submissions, /api/admin/allowlist,
//                  /api/admin/assignment
//                  (all require header  X-Admin-Token: <ADMIN_TOKEN>)
//
// Note: set-mode only allows subscriber -> managed. Converting a managed student back to
// subscriber isn't supported from the console — add them to a subscriber cohort's allowlist
// manually instead.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

async function getUser(env, userId, token) {
  if (!userId || !token) return null;
  const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!u || u.token !== token) return null;
  if (u.status === "revoked") return null; // access pulled by mentor — treat like unauthorized
  return u;
}

function requireAdmin(req, env) {
  const t = req.headers.get("X-Admin-Token");
  return env.ADMIN_TOKEN && t === env.ADMIN_TOKEN;
}

function randomCode(prefix) {
  return prefix + "-" + crypto.randomUUID().split("-")[0].toUpperCase();
}

// Current active assignment + recent completed history for a managed-mode student.
// Returns { assignment: {...} | null, history: [...] } — safe to call for subscriber-mode
// users too (just returns nulls/empty), so callers don't need to branch on mode first.
async function loadAssignmentInfo(env, userId) {
  const active = await env.DB.prepare(
    "SELECT ticket_id, note, due_at, assigned_at FROM assignments WHERE user_id = ? AND status = 'active'"
  ).bind(userId).first();
  const { results } = await env.DB.prepare(
    "SELECT ticket_id, completed_at FROM assignments WHERE user_id = ? AND status = 'done' ORDER BY completed_at DESC LIMIT 50"
  ).bind(userId).all();
  return {
    assignment: active
      ? { ticketId: active.ticket_id, note: active.note, dueAt: active.due_at, assignedAt: active.assigned_at }
      : null,
    history: (results || []).map((h) => ({ ticketId: h.ticket_id, completedAt: h.completed_at })),
  };
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");

    try {
      // ---------------- health ----------------
      if (path === "/api/health") return json({ ok: true, ts: now() });

      // ---------------- student: register / resume ----------------
      if (path === "/api/register" && req.method === "POST") {
        const { joinCode, email, name } = await req.json();
        if (!joinCode || !email || !name) return json({ error: "joinCode, email and name are required" }, 400);
        const cohort = await env.DB.prepare("SELECT * FROM cohorts WHERE join_code = ?").bind(joinCode.trim()).first();
        if (!cohort) return json({ error: "No cohort found for that code" }, 404);

        const cleanEmail = email.trim().toLowerCase();

        // Security gate: the join code alone is not enough. A friend a student
        // shared the code with will not be on the cohort's approved email list,
        // so they get rejected here even with a valid code.
        const allowed = await env.DB.prepare(
          "SELECT id, mode FROM allowed_students WHERE cohort_id = ? AND email = ?"
        ).bind(cohort.id, cleanEmail).first();
        if (!allowed) {
          return json({ error: "This email isn't on the approved list for this cohort. Ask your mentor to add you before signing in." }, 403);
        }

        const existing = await env.DB.prepare(
          "SELECT * FROM users WHERE cohort_id = ? AND email = ?"
        ).bind(cohort.id, cleanEmail).first();

        if (existing && existing.status === "revoked") {
          return json({ error: "Your access to this cohort has been revoked. Contact your mentor." }, 403);
        }

        const token = uid();
        if (existing) {
          await env.DB.prepare("UPDATE users SET token = ?, name = ?, updated_at = ? WHERE id = ?")
            .bind(token, name.trim(), now(), existing.id).run();
          const info = existing.mode === "managed" ? await loadAssignmentInfo(env, existing.id) : { assignment: null, history: [] };
          // isNew:false tells the app this is a returning account — the server's progress
          // (however empty, e.g. right after a mentor's "Reset progress") is authoritative and
          // should overwrite whatever's cached in this browser, not merge with it.
          return json({ userId: existing.id, token, name: name.trim(), cohortName: cohort.name, mode: existing.mode || "subscriber", ...info, progress: existing.progress ? JSON.parse(existing.progress) : null, isNew: false });
        }
        const id = uid();
        const mode = allowed.mode === "managed" ? "managed" : "subscriber";
        await env.DB.prepare(
          "INSERT INTO users (id, cohort_id, email, name, token, status, mode, progress, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
        ).bind(id, cohort.id, cleanEmail, name.trim(), token, "active", mode, null, now(), now()).run();
        // isNew:true tells the app this account never had server progress before — safe to
        // treat this browser's existing local progress (if any, e.g. prior guest/local use) as
        // the starting point and push it up, instead of wiping it.
        return json({ userId: id, token, name: name.trim(), cohortName: cohort.name, mode, assignment: null, history: [], progress: null, isNew: true });
      }

      // ---------------- student: fetch my snapshot ----------------
      if (path === "/api/me" && req.method === "POST") {
        const { userId, token } = await req.json();
        const u = await getUser(env, userId, token);
        if (!u) return json({ error: "unauthorized" }, 401);
        const cohort = await env.DB.prepare("SELECT name FROM cohorts WHERE id = ?").bind(u.cohort_id).first();
        const info = u.mode === "managed" ? await loadAssignmentInfo(env, u.id) : { assignment: null, history: [] };
        return json({ name: u.name, cohortName: cohort?.name || "", mode: u.mode || "subscriber", ...info, progress: u.progress ? JSON.parse(u.progress) : null });
      }

      // ---------------- student: push full progress snapshot ----------------
      if (path === "/api/sync" && req.method === "POST") {
        const { userId, token, progress } = await req.json();
        const u = await getUser(env, userId, token);
        if (!u) return json({ error: "unauthorized" }, 401);
        await env.DB.prepare("UPDATE users SET progress = ?, updated_at = ? WHERE id = ?")
          .bind(JSON.stringify(progress || {}), now(), u.id).run();
        return json({ ok: true });
      }

      // ---------------- student: record one submission ----------------
      if (path === "/api/submit" && req.method === "POST") {
        const { userId, token, ticketId, status, work } = await req.json();
        const u = await getUser(env, userId, token);
        if (!u) return json({ error: "unauthorized" }, 401);
        if (!ticketId || !status) return json({ error: "ticketId and status required" }, 400);
        await env.DB.prepare(
          "INSERT INTO submissions (user_id, cohort_id, ticket_id, status, work, created_at) VALUES (?,?,?,?,?,?)"
        ).bind(u.id, u.cohort_id, ticketId, status, (work || "").slice(0, 20000), now()).run();
        // Managed mode: passing/marking-done the ticket that's currently assigned auto-closes
        // that assignment. The student then sees "waiting for next assignment" until the
        // manager assigns another one — no separate "mark complete" step needed.
        if (u.mode === "managed" && status === "done") {
          await env.DB.prepare(
            "UPDATE assignments SET status = 'done', completed_at = ? WHERE user_id = ? AND ticket_id = ? AND status = 'active'"
          ).bind(now(), u.id, ticketId).run();
        }
        return json({ ok: true });
      }

      // ---------------- mentor: create a cohort ----------------
      if (path === "/api/admin/cohort" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { name, joinCode } = await req.json();
        if (!name || !joinCode) return json({ error: "name and joinCode required" }, 400);
        const dupe = await env.DB.prepare("SELECT id FROM cohorts WHERE join_code = ?").bind(joinCode.trim()).first();
        if (dupe) return json({ error: "That join code is already in use" }, 409);
        const id = uid();
        await env.DB.prepare("INSERT INTO cohorts (id, name, join_code, created_at) VALUES (?,?,?,?)")
          .bind(id, name.trim(), joinCode.trim(), now()).run();
        return json({ id, name: name.trim(), joinCode: joinCode.trim() });
      }

      // ---------------- mentor: list cohorts (+ user counts) ----------------
      if (path === "/api/admin/cohorts" && req.method === "GET") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { results } = await env.DB.prepare(
          `SELECT c.id, c.name, c.join_code,
                  (SELECT COUNT(*) FROM users u WHERE u.cohort_id = c.id) AS students
           FROM cohorts c ORDER BY c.created_at DESC`
        ).all();
        return json({ cohorts: results });
      }

      // ---------------- mentor: roster for a cohort ----------------
      if (path === "/api/admin/roster" && req.method === "GET") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const cohortId = url.searchParams.get("cohortId");
        const { results } = await env.DB.prepare(
          `SELECT u.id, u.name, u.email, u.status, u.mode, u.progress, u.updated_at,
                  (SELECT ticket_id FROM assignments WHERE user_id = u.id AND status = 'active') AS active_ticket,
                  (SELECT due_at    FROM assignments WHERE user_id = u.id AND status = 'active') AS active_due
           FROM users u WHERE u.cohort_id = ? ORDER BY u.name`
        ).bind(cohortId).all();
        const roster = results.map((u) => {
          let done = 0;
          try {
            const p = u.progress ? JSON.parse(u.progress) : {};
            done = Object.entries(p).filter(([k, v]) => k.startsWith("shopnow.status.") && v === "done").length;
          } catch (_) {}
          return {
            id: u.id, name: u.name, email: u.email, status: u.status || "active",
            mode: u.mode || "subscriber", activeTicket: u.active_ticket || null, activeDue: u.active_due || null,
            doneCount: done, updatedAt: u.updated_at,
          };
        });
        return json({ roster });
      }

      // ---------------- mentor: revoke a student's access ----------------
      if (path === "/api/admin/user/revoke" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { userId } = await req.json();
        if (!userId) return json({ error: "userId required" }, 400);
        await env.DB.prepare("UPDATE users SET status = 'revoked', updated_at = ? WHERE id = ?").bind(now(), userId).run();
        return json({ ok: true });
      }

      // ---------------- mentor: restore a student's access ----------------
      if (path === "/api/admin/user/restore" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { userId } = await req.json();
        if (!userId) return json({ error: "userId required" }, 400);
        await env.DB.prepare("UPDATE users SET status = 'active', updated_at = ? WHERE id = ?").bind(now(), userId).run();
        return json({ ok: true });
      }

      // ---------------- mentor: switch a student from subscriber to managed ----------------
      // One-way only. Converting a managed student back to subscriber is not supported here —
      // if a managed (1:1) student needs to move to a subscriber cohort, add them to that
      // cohort's allowlist manually instead.
      if (path === "/api/admin/user/set-mode" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { userId, mode } = await req.json();
        if (!userId || mode !== "managed") return json({ error: "userId required; mode must be 'managed' (subscriber -> managed only)" }, 400);
        const u = await env.DB.prepare("SELECT mode FROM users WHERE id = ?").bind(userId).first();
        if (!u) return json({ error: "no such user" }, 404);
        if (u.mode === "managed") return json({ error: "already managed" }, 400);
        await env.DB.prepare("UPDATE users SET mode = ?, updated_at = ? WHERE id = ?").bind(mode, now(), userId).run();
        return json({ ok: true });
      }

      // ---------------- mentor: one-step add of a managed (1:1, paid-offline) student ----------------
      // Creates a dedicated cohort (its own join code, not shared with subscribers) and
      // approves the student's email on it with mode='managed'. The student then signs in
      // with that join code exactly like a subscriber, but lands in the restricted
      // single-assignment view because their allowlist row has mode='managed'.
      if (path === "/api/admin/managed/create" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { name, email } = await req.json();
        if (!name || !email) return json({ error: "name and email required" }, 400);
        const cleanEmail = email.trim().toLowerCase();
        let joinCode, dupe;
        do { joinCode = randomCode("INTERN"); dupe = await env.DB.prepare("SELECT id FROM cohorts WHERE join_code = ?").bind(joinCode).first(); } while (dupe);
        const cohortId = uid();
        await env.DB.prepare("INSERT INTO cohorts (id, name, join_code, created_at) VALUES (?,?,?,?)")
          .bind(cohortId, "Managed · " + name.trim(), joinCode, now()).run();
        await env.DB.prepare("INSERT INTO allowed_students (id, cohort_id, email, added_at, mode) VALUES (?,?,?,?,?)")
          .bind(uid(), cohortId, cleanEmail, now(), "managed").run();
        return json({ cohortId, cohortName: "Managed · " + name.trim(), joinCode, email: cleanEmail });
      }

      // ---------------- mentor: assign a ticket to a managed student ----------------
      if (path === "/api/admin/assign" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { userId, ticketId, dueAt, note } = await req.json();
        if (!userId || !ticketId) return json({ error: "userId and ticketId required" }, 400);
        const u = await env.DB.prepare("SELECT id, mode FROM users WHERE id = ?").bind(userId).first();
        if (!u) return json({ error: "no such user" }, 404);
        if (u.mode !== "managed") return json({ error: "this student is in subscriber mode — switch them to managed first" }, 400);
        await env.DB.prepare("UPDATE assignments SET status = 'reassigned' WHERE user_id = ? AND status = 'active'").bind(userId).run();
        await env.DB.prepare(
          "INSERT INTO assignments (id, user_id, ticket_id, note, due_at, status, assigned_at) VALUES (?,?,?,?,?,?,?)"
        ).bind(uid(), userId, ticketId, note || null, dueAt || null, "active", now()).run();
        return json({ ok: true });
      }

      // ---------------- mentor: a managed student's current + past assignments ----------------
      if (path === "/api/admin/assignment" && req.method === "GET") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const userId = url.searchParams.get("userId");
        if (!userId) return json({ error: "userId required" }, 400);
        const info = await loadAssignmentInfo(env, userId);
        return json(info);
      }

      // ---------------- mentor: list a cohort's approved-email allowlist ----------------
      if (path === "/api/admin/allowlist" && req.method === "GET") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const cohortId = url.searchParams.get("cohortId");
        const { results } = await env.DB.prepare(
          `SELECT a.email, a.added_at, a.mode,
                  (SELECT u.id FROM users u WHERE u.cohort_id = a.cohort_id AND u.email = a.email) AS user_id,
                  (SELECT u.status FROM users u WHERE u.cohort_id = a.cohort_id AND u.email = a.email) AS user_status
           FROM allowed_students a WHERE a.cohort_id = ? ORDER BY a.email`
        ).bind(cohortId).all();
        return json({ allowlist: results });
      }

      // ---------------- mentor: add email(s) to a cohort's allowlist ----------------
      if (path === "/api/admin/allowlist/add" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { cohortId, emails, mode } = await req.json();
        if (!cohortId || !emails) return json({ error: "cohortId and emails required" }, 400);
        const useMode = mode === "managed" ? "managed" : "subscriber";
        const list = (Array.isArray(emails) ? emails : String(emails).split(/[\n,]/))
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        let added = 0;
        for (const emailAddr of list) {
          const dupe = await env.DB.prepare(
            "SELECT id FROM allowed_students WHERE cohort_id = ? AND email = ?"
          ).bind(cohortId, emailAddr).first();
          if (dupe) continue;
          await env.DB.prepare(
            "INSERT INTO allowed_students (id, cohort_id, email, added_at, mode) VALUES (?,?,?,?,?)"
          ).bind(uid(), cohortId, emailAddr, now(), useMode).run();
          added++;
        }
        return json({ ok: true, added, total: list.length });
      }

      // ---------------- mentor: remove an email from a cohort's allowlist ----------------
      if (path === "/api/admin/allowlist/remove" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const { cohortId, email } = await req.json();
        if (!cohortId || !email) return json({ error: "cohortId and email required" }, 400);
        await env.DB.prepare(
          "DELETE FROM allowed_students WHERE cohort_id = ? AND email = ?"
        ).bind(cohortId, email.trim().toLowerCase()).run();
        return json({ ok: true });
      }

      // ---------------- mentor: full reset — clear every student from every cohort ----------------
      // Wipes users, allowed_students, assignments, and submissions entirely, and deletes the
      // auto-created dedicated "Managed · <name>" cohorts (they're pointless once their one
      // student is gone). Regular cohorts (created via "Create a cohort") are kept, just empty,
      // so their join codes keep working. Irreversible — the mentor console double-confirms
      // before calling this.
      if (path === "/api/admin/reset-students" && req.method === "POST") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const subs = await env.DB.prepare("DELETE FROM submissions").run();
        const asns = await env.DB.prepare("DELETE FROM assignments").run();
        const users = await env.DB.prepare("DELETE FROM users").run();
        const allow = await env.DB.prepare("DELETE FROM allowed_students").run();
        const cohorts = await env.DB.prepare("DELETE FROM cohorts WHERE name LIKE 'Managed · %'").run();
        return json({
          ok: true,
          deleted: {
            submissions: subs.meta?.changes || 0,
            assignments: asns.meta?.changes || 0,
            users: users.meta?.changes || 0,
            allowedStudents: allow.meta?.changes || 0,
            managedCohorts: cohorts.meta?.changes || 0,
          },
        });
      }

      // ---------------- mentor: a student's submissions ----------------
      if (path === "/api/admin/submissions" && req.method === "GET") {
        if (!requireAdmin(req, env)) return json({ error: "forbidden" }, 403);
        const userId = url.searchParams.get("userId");
        const { results } = await env.DB.prepare(
          "SELECT ticket_id, status, work, created_at FROM submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 500"
        ).bind(userId).all();
        return json({ submissions: results });
      }

      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};
