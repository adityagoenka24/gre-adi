/**
 * GRE Pro Auth Worker
 * our coaching team — goenka.aditya.kol@gmail.com
 *
 * KV Namespace: GRE_AUTH (bind as GRE_AUTH in Cloudflare dashboard)
 *
 * KV Key structure:
 *   student:{email}  →  { fingerprints: [fp1, fp2], addedAt: ISO, name: "", plan?, paidAt?, paymentId?, source?, access? }
 *
 *   access: string[] — which Pro surfaces this student can use. One or more of:
 *     'practice'   — the practice logger (pro/gre_practice_logger_pro.html)
 *     'sectional'  — sectional tests (pro/sectional.html)
 *     'mocks'      — full-length mocks (pro/full_mock.html)
 *   Missing, empty, or containing 'full' means full access to all of the above —
 *   this is the default so every student added before this field existed keeps
 *   working exactly as before. Only set `access` to grant a partial/selective plan.
 *
 * Endpoints:
 *   POST /validate              — check email + fingerprint (called on every app load)
 *   POST /register              — save fingerprint after first successful email check
 *   POST /admin/add-student     — add a new paying student (protected by ADMIN_SECRET)
 *   POST /admin/set-access      — change a student's feature access (protected by ADMIN_SECRET)
 *   POST /admin/reset-device    — clear fingerprints for a student (protected by ADMIN_SECRET)
 *   GET  /admin/list            — list all students (protected by ADMIN_SECRET)
 *   POST /analytics/view        — anonymous pageview counter
 *   GET  /admin/analytics       — daily pageviews + unique visitors (protected by ADMIN_SECRET)
 *   POST /lead                  — capture an email for a free download (handbook PDF)
 *   GET  /admin/leads           — list captured emails (protected by ADMIN_SECRET)
 *   POST /mock/submission       — save a completed mock/team attempt
 *   GET  /admin/mock-attempts   — list saved mock/team attempts (protected by ADMIN_SECRET)
 *   POST /razorpay/webhook      — Razorpay webhook: auto-provisions Pro on payment.captured
 *   GET  /admin/webhook-queue   — list auto-provisioned, manual-review, and no-email payments (protected by ADMIN_SECRET)
 *   POST /admin/dismiss-webhook-item — remove a resolved item from the manual-review/no-email queue (protected by ADMIN_SECRET)
 *
 * Environment variables to set in Cloudflare dashboard:
 *   ADMIN_SECRET             — a strong random secret string only you know (set via `wrangler secret put`, never checked into git)
 *   MAX_DEVICES              — max fingerprints per student (default: 2)
 *   RAZORPAY_WEBHOOK_SECRET  — the webhook secret set in Razorpay dashboard (Settings → Webhooks)
 *
 * Razorpay webhook setup:
 *   1. In Razorpay dashboard → Settings → Webhooks → Add new webhook
 *   2. URL: https://gre-auth.goenka-aditya-kol.workers.dev/razorpay/webhook
 *   3. Secret: copy the value you set as RAZORPAY_WEBHOOK_SECRET in Worker env
 *   4. Events: check "payment.captured"
 *   5. Amount mapping — each is a static Razorpay Payment Link at a fixed
 *      price, auto-provisioning the matching feature access (see
 *      AMOUNT_ACCESS below):
 *        ₹399 (39900 paise)  → Sectional Tests only
 *        ₹499 (49900 paise)  → Topic-wise Practice only
 *        ₹599 (59900 paise)  → Full-Length Mocks only
 *        ₹799 (79900 paise)  → Practice + Sectional
 *        ₹899 (89900 paise)  → Sectional + Mocks
 *        ₹999 (99900 paise)  → Full Pro (all three)
 *      Any other amount is logged for manual review, not auto-provisioned.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',       // Restrict to your GitHub Pages URL in production
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env) {
    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/validate' && request.method === 'POST') {
        return await handleValidate(request, env);
      }
      if (path === '/register' && request.method === 'POST') {
        return await handleRegister(request, env);
      }
      if (path === '/admin/add-student' && request.method === 'POST') {
        return await handleAdminAddStudent(request, env);
      }
      if (path === '/admin/set-access' && request.method === 'POST') {
        return await handleAdminSetAccess(request, env);
      }
      if (path === '/admin/reset-device' && request.method === 'POST') {
        return await handleAdminResetDevice(request, env);
      }
      if (path === '/admin/remove-student' && request.method === 'POST') {
        return await handleAdminRemoveStudent(request, env);
      }
      if (path === '/admin/delete-student' && request.method === 'POST') {
        return await handleAdminDeleteStudent(request, env);
      }
      if (path === '/admin/list' && request.method === 'GET') {
        return await handleAdminList(request, env);
      }
      if (path === '/analytics/view' && request.method === 'POST') {
        return await handleAnalyticsView(request, env);
      }
      if (path === '/analytics/event' && request.method === 'POST') {
        return await handleAnalyticsEvent(request, env);
      }
      if (path === '/lead' && request.method === 'POST') {
        return await handleLead(request, env);
      }
      if (path === '/admin/leads' && request.method === 'GET') {
        return await handleAdminLeads(request, env);
      }
      if (path === '/admin/analytics' && request.method === 'GET') {
        return await handleAdminAnalytics(request, env, url);
      }
      if (path === '/admin/analytics/events' && request.method === 'GET') {
        return await handleAdminAnalyticsEvents(request, env, url);
      }
      if (path === '/mock/submission' && request.method === 'POST') {
        return await handleMockSubmission(request, env);
      }
      if (path === '/admin/mock-attempts' && request.method === 'GET') {
        return await handleAdminMockAttempts(request, env, url);
      }
      if (path === '/razorpay/webhook' && request.method === 'POST') {
        return await handleRazorpayWebhook(request, env);
      }
      if (path === '/admin/webhook-queue' && request.method === 'GET') {
        return await handleAdminWebhookQueue(request, env);
      }
      if (path === '/admin/dismiss-webhook-item' && request.method === 'POST') {
        return await handleAdminDismissWebhookItem(request, env);
      }

      if (path === '/progress/save' && request.method === 'POST') {
        return await handleProgressSave(request, env);
      }
      if (path === '/progress/sessions' && request.method === 'GET') {
        return await handleProgressSessions(request, env, url);
      }
      if (path === '/admin/progress-students' && request.method === 'GET') {
        return await handleAdminProgressStudents(request, env);
      }
      if (path === '/admin/progress' && request.method === 'GET') {
        return await handleAdminProgress(request, env, url);
      }
      if (path === '/admin/cohort-weakness' && request.method === 'GET') {
        return await handleAdminCohortWeakness(request, env, url);
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (err) {
      return jsonResponse({ error: 'Server error', detail: err.message }, 500);
    }
  }
};

// ─── ACCESS TIERS ────────────────────────────────────────────────────────────
// Selective Pro access: a student can be limited to a subset of these
// surfaces instead of the full app. See the KV key structure note at the
// top of this file.
const ALL_FEATURES = ['practice', 'sectional', 'mocks'];

// Amount (in paise) → feature access that payment grants. Each key is the
// fixed price of one static Razorpay Payment Link used on pricing.html —
// see the doc comment at the top of this file for the price list.
const AMOUNT_ACCESS = {
  39900: ['sectional'],
  49900: ['practice'],
  59900: ['mocks'],
  79900: ['practice', 'sectional'],
  89900: ['sectional', 'mocks'],
  99900: ['practice', 'sectional', 'mocks'],
};

// Returns the effective feature list for a student record. Missing/empty/
// 'full' all mean "everything" so pre-existing students are never narrowed
// by the mere addition of this field.
function resolveAccess(student) {
  const access = student.access;
  if (!Array.isArray(access) || access.length === 0) return ALL_FEATURES.slice();
  if (access.includes('full')) return ALL_FEATURES.slice();
  const filtered = access.filter(a => ALL_FEATURES.includes(a));
  return filtered.length ? filtered : ALL_FEATURES.slice();
}

// Validates/cleans an `access` value from an admin request body.
// Returns null if the caller didn't specify one (→ caller should default to full).
function normalizeAccessInput(access) {
  if (!Array.isArray(access) || access.length === 0) return null;
  const filtered = [...new Set(access.filter(a => ALL_FEATURES.includes(a)))];
  return filtered.length ? filtered : null;
}

// ─── VALIDATE ────────────────────────────────────────────────────────────────
// Called every time the pro app loads.
// Returns: { status: 'ok' | 'unknown_email' | 'device_limit' | 'device_mismatch', access?: string[] }
async function handleValidate(request, env) {
  const { email, fingerprint } = await request.json();

  if (!email || !fingerprint) {
    return jsonResponse({ status: 'error', message: 'Missing email or fingerprint' }, 400);
  }

  const key = `student:${email.toLowerCase().trim()}`;
  const raw = await env.GRE_AUTH.get(key);

  // Email not in allowed list
  if (!raw) {
    return jsonResponse({ status: 'unknown_email' });
  }

  const student = JSON.parse(raw);

  // Access revoked
  if (student.revoked) {
    return jsonResponse({ status: 'unknown_email' });
  }

  const access = resolveAccess(student);
  const { fingerprints = [] } = student;

  // No fingerprint registered yet → new device, allow registration
  if (fingerprints.length === 0) {
    return jsonResponse({ status: 'ok', needsRegister: true, access, progress_token: await issueProgressToken(env, email) });
  }

  // Fingerprint matches one of their registered devices → let them in
  if (fingerprints.includes(fingerprint)) {
    return jsonResponse({ status: 'ok', needsRegister: false, access, progress_token: await issueProgressToken(env, email) });
  }

  // Fingerprint doesn't match — check if they're under device limit
  const maxDevices = parseInt(env.MAX_DEVICES || '2');
  if (fingerprints.length < maxDevices) {
    // Under limit → allow, but register this new device
    return jsonResponse({ status: 'ok', needsRegister: true, access, progress_token: await issueProgressToken(env, email) });
  }

  // Over device limit, fingerprint mismatch → block
  return jsonResponse({ status: 'device_limit' });
}

// ─── ANALYTICS: PAGEVIEW ─────────────────────────────────────────────────────
// Privacy-light analytics:
// - no names/emails
// - no IP storage
// - one anonymous browser id generated client-side
// - daily buckets use Asia/Kolkata dates
async function handleAnalyticsView(request, env) {
  const body = await safeJson(request);
  const visitorId = normalizeVisitorId(body.visitorId);
  const page = normalizePage(body.path);
  const site = String(body.site || 'grequantpro').slice(0, 60);
  const date = indiaDate();
  const key = `analytics:${site}:${date}`;
  const raw = await env.GRE_AUTH.get(key);
  const data = raw ? JSON.parse(raw) : {
    date,
    site,
    pageviews: 0,
    uniqueVisitors: 0,
    visitors: {},
    pages: {},
    updatedAt: null,
  };

  data.pageviews = (data.pageviews || 0) + 1;
  data.pages = data.pages || {};
  data.pages[page] = (data.pages[page] || 0) + 1;
  data.visitors = data.visitors || {};
  if (visitorId && !data.visitors[visitorId]) {
    data.visitors[visitorId] = new Date().toISOString();
  }
  data.uniqueVisitors = Object.keys(data.visitors).length;
  data.updatedAt = new Date().toISOString();

  await env.GRE_AUTH.put(key, JSON.stringify(data));
  return jsonResponse({ status: 'ok' });
}

// ─── ANALYTICS: CUSTOM EVENTS ────────────────────────────────────────────────
// Stores named event counts per day.
// KV key: event:{site}:{date}:{event_name}
// → { date, site, event, count, visitors: {}, last_props: {} }
async function handleAnalyticsEvent(request, env) {
  const body = await safeJson(request);
  const visitorId = normalizeVisitorId(body.visitorId);
  const eventName = String(body.event || 'unknown').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 60);
  const site = String(body.site || 'grequantpro').slice(0, 60);
  const props = (body.props && typeof body.props === 'object') ? body.props : {};
  const from = String(props.from || '').slice(0, 60);
  const date = indiaDate();
  const key = `event:${site}:${date}:${eventName}`;

  const raw = await env.GRE_AUTH.get(key);
  const data = raw ? JSON.parse(raw) : {
    date, site, event: eventName, count: 0, visitors: {}, sources: {}, last_props: {}
  };

  data.count = (data.count || 0) + 1;
  data.visitors = data.visitors || {};
  if (visitorId) data.visitors[visitorId] = new Date().toISOString();
  data.unique = Object.keys(data.visitors).length;
  // Track breakdown by `from` source
  if (from) {
    data.sources = data.sources || {};
    data.sources[from] = (data.sources[from] || 0) + 1;
  }
  data.last_props = props;
  data.updatedAt = new Date().toISOString();

  await env.GRE_AUTH.put(key, JSON.stringify(data));
  return jsonResponse({ status: 'ok' });
}

// ─── ADMIN: ANALYTICS ────────────────────────────────────────────────────────
async function handleAdminAnalytics(request, env, url) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const site = String(url.searchParams.get('site') || 'grequantpro').slice(0, 60);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10) || 30, 1), 180);
  const dates = recentIndiaDates(days);
  const daily = [];

  for (const date of dates) {
    const raw = await env.GRE_AUTH.get(`analytics:${site}:${date}`);
    if (!raw) {
      daily.push({ date, pageviews: 0, uniqueVisitors: 0, pages: [] });
      continue;
    }
    const data = JSON.parse(raw);
    const pages = Object.entries(data.pages || {})
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views);
    daily.push({
      date,
      pageviews: data.pageviews || 0,
      uniqueVisitors: data.uniqueVisitors || Object.keys(data.visitors || {}).length,
      pages,
      updatedAt: data.updatedAt || null,
    });
  }

  return jsonResponse({
    site,
    timezone: 'Asia/Kolkata',
    days,
    daily,
    totals: {
      pageviews: daily.reduce((sum, d) => sum + d.pageviews, 0),
      uniqueDailyVisitors: daily.reduce((sum, d) => sum + d.uniqueVisitors, 0),
    },
  });
}

// ─── ADMIN: CUSTOM EVENTS ────────────────────────────────────────────────────
// GET /admin/analytics/events?days=N&site=grequantpro
// Returns per-event counts aggregated across the requested date range.
async function handleAdminAnalyticsEvents(request, env, url) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const site = String(url.searchParams.get('site') || 'grequantpro').slice(0, 60);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10) || 30, 1), 180);
  const dates = recentIndiaDates(days);

  // Scan all event keys for the date range
  const eventTotals = {}; // { event_name: { count, unique_visitors: Set, daily: [] } }

  for (const date of dates) {
    const listed = await env.GRE_AUTH.list({ prefix: `event:${site}:${date}:` });
    for (const k of listed.keys) {
      const raw = await env.GRE_AUTH.get(k.name);
      if (!raw) continue;
      const d = JSON.parse(raw);
      const name = d.event;
      if (!eventTotals[name]) eventTotals[name] = { event: name, count: 0, unique_visitors: 0, sources: {}, daily: [] };
      eventTotals[name].count += d.count || 0;
      eventTotals[name].unique_visitors += d.unique || Object.keys(d.visitors || {}).length;
      // Merge per-source counts
      for (const [src, cnt] of Object.entries(d.sources || {})) {
        eventTotals[name].sources[src] = (eventTotals[name].sources[src] || 0) + cnt;
      }
      eventTotals[name].daily.push({ date, count: d.count || 0, unique: d.unique || 0 });
    }
  }

  const events = Object.values(eventTotals).sort((a, b) => b.count - a.count);
  return jsonResponse({ site, timezone: 'Asia/Kolkata', days, events });
}

// ─── MOCK SUBMISSIONS ────────────────────────────────────────────────────────
async function handleMockSubmission(request, env) {
  const body = await safeJson(request);
  const result = body && body.result ? body.result : body;
  if (!result || !Array.isArray(result.results)) {
    return jsonResponse({ error: 'Missing result payload' }, 400);
  }

  const submittedAt = safeIso(result.submitted_at) || new Date().toISOString();
  const date = indiaDate(new Date(submittedAt));
  const attemptId = crypto.randomUUID();
  const eventId = normalizeKeyPart(result.event_id || 'event');
  const student = result.student || {};
  const record = {
    attempt_id: attemptId,
    saved_at: new Date().toISOString(),
    date,
    event_id: String(result.event_id || ''),
    event_name: String(result.event_name || ''),
    event_type: String(result.event_type || ''),
    submitted_at: submittedAt,
    student: {
      name: String(student.name || '').slice(0, 120),
      email: String(student.email || '').toLowerCase().trim().slice(0, 180),
      batch: String(student.batch || '').slice(0, 120),
    },
    team: result.team || null,
    score: Number(result.score) || 0,
    total_questions: Number(result.total_questions) || 0,
    accuracy: Number(result.accuracy) || 0,
    correct: Number(result.correct) || 0,
    incorrect: Number(result.incorrect) || 0,
    skipped: Number(result.skipped) || 0,
    total_time_seconds: Number(result.total_time_seconds) || 0,
    average_time_seconds: Number(result.average_time_seconds) || 0,
    diagnosis: result.diagnosis || null,
    result,
  };

  const key = `mock_attempt:${date}:${eventId}:${attemptId}`;
  await env.GRE_AUTH.put(key, JSON.stringify(record));
  return jsonResponse({ status: 'ok', attempt_id: attemptId, date });
}

// ─── ADMIN: MOCK ATTEMPTS ────────────────────────────────────────────────────
async function handleAdminMockAttempts(request, env, url) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10) || 30, 1), 180);
  const includeResults = url.searchParams.get('include_results') === '1';
  const dates = recentIndiaDates(days);
  const attempts = [];

  for (const date of dates) {
    let cursor;
    do {
      const listed = await env.GRE_AUTH.list({
        prefix: `mock_attempt:${date}:`,
        cursor,
        limit: 1000,
      });
      for (const key of listed.keys) {
        const raw = await env.GRE_AUTH.get(key.name);
        if (!raw) continue;
        const record = JSON.parse(raw);
        attempts.push(includeResults ? record : summarizeAttempt(record));
      }
      cursor = listed.list_complete ? undefined : listed.cursor;
    } while (cursor);
  }

  attempts.sort((a, b) => String(b.submitted_at || b.saved_at).localeCompare(String(a.submitted_at || a.saved_at)));
  return jsonResponse({
    timezone: 'Asia/Kolkata',
    days,
    count: attempts.length,
    attempts,
  });
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
// Called after validate returns needsRegister: true.
// Saves the fingerprint to this student's record.
async function handleRegister(request, env) {
  const { email, fingerprint } = await request.json();

  if (!email || !fingerprint) {
    return jsonResponse({ status: 'error', message: 'Missing email or fingerprint' }, 400);
  }

  const key = `student:${email.toLowerCase().trim()}`;
  const raw = await env.GRE_AUTH.get(key);

  if (!raw) {
    return jsonResponse({ status: 'unknown_email' });
  }

  const student = JSON.parse(raw);
  const fingerprints = student.fingerprints || [];

  if (!fingerprints.includes(fingerprint)) {
    fingerprints.push(fingerprint);
  }

  student.fingerprints = fingerprints;
  student.lastSeen = new Date().toISOString();
  await env.GRE_AUTH.put(key, JSON.stringify(student));

  return jsonResponse({ status: 'registered' });
}

// ─── ADMIN: ADD STUDENT ───────────────────────────────────────────────────────
// You call this after a student pays. Adds their email to the allowed list.
// Body: { email, name, access? }  — access: string[] subset of ALL_FEATURES,
//   e.g. ["sectional"] or ["mocks"] or ["practice"]. Omit for full access.
// Header: X-Admin-Secret: your-secret
async function handleAdminAddStudent(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { email, name = '', access } = await request.json();
  if (!email) {
    return jsonResponse({ error: 'Missing email' }, 400);
  }
  const normalizedAccess = normalizeAccessInput(access) || ALL_FEATURES.slice();

  const key = `student:${email.toLowerCase().trim()}`;
  const existing = await env.GRE_AUTH.get(key);

  if (existing) {
    const existingStudent = JSON.parse(existing);
    // Re-add a previously revoked student
    if (existingStudent.revoked) {
      existingStudent.revoked = false;
      delete existingStudent.revokedAt;
      existingStudent.fingerprints = [];
      existingStudent.reactivatedAt = new Date().toISOString();
      if (name) existingStudent.name = name;
      existingStudent.access = normalizedAccess;
      await env.GRE_AUTH.put(key, JSON.stringify(existingStudent));
      return jsonResponse({ status: 'reactivated', email: existingStudent.email, access: normalizedAccess });
    }
    return jsonResponse({ status: 'already_exists', message: 'Student already registered' });
  }

  const record = {
    email: email.toLowerCase().trim(),
    name,
    fingerprints: [],
    addedAt: new Date().toISOString(),
    lastSeen: null,
    access: normalizedAccess,
  };

  await env.GRE_AUTH.put(key, JSON.stringify(record));
  return jsonResponse({ status: 'added', email: record.email, access: normalizedAccess });
}

// ─── ADMIN: SET ACCESS ────────────────────────────────────────────────────────
// Dial an existing student's access up or down after the fact — e.g. give a
// beta tester sectional-only, or upgrade someone to full access later.
// Body: { email, access: string[] }  — access is a subset of ALL_FEATURES,
//   or [] / ["full"] for full access.
// Header: X-Admin-Secret: your-secret
async function handleAdminSetAccess(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { email, access } = await request.json();
  if (!email) {
    return jsonResponse({ error: 'Missing email' }, 400);
  }
  if (access !== undefined && !Array.isArray(access)) {
    return jsonResponse({ error: 'access must be an array of feature names' }, 400);
  }

  const key = `student:${email.toLowerCase().trim()}`;
  const raw = await env.GRE_AUTH.get(key);
  if (!raw) {
    return jsonResponse({ error: 'Student not found' }, 404);
  }

  const student = JSON.parse(raw);
  // access: [] or ["full"] or omitted → full access (stored explicitly for clarity in /admin/list)
  student.access = normalizeAccessInput(access) || ALL_FEATURES.slice();
  await env.GRE_AUTH.put(key, JSON.stringify(student));

  return jsonResponse({ status: 'ok', email: student.email, access: student.access });
}

// ─── ADMIN: RESET DEVICE ─────────────────────────────────────────────────────
// Use when a student changes device or needs re-activation.
// Body: { email }
async function handleAdminResetDevice(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { email } = await request.json();
  if (!email) {
    return jsonResponse({ error: 'Missing email' }, 400);
  }

  const key = `student:${email.toLowerCase().trim()}`;
  const raw = await env.GRE_AUTH.get(key);

  if (!raw) {
    return jsonResponse({ error: 'Student not found' });
  }

  const student = JSON.parse(raw);
  student.fingerprints = [];
  student.resetAt = new Date().toISOString();

  await env.GRE_AUTH.put(key, JSON.stringify(student));
  return jsonResponse({ status: 'reset', email: email.toLowerCase().trim() });
}

// ─── ADMIN: REMOVE STUDENT ───────────────────────────────────────────────────
// Marks the student as revoked — blocks them on next app load, but preserves the record.
// Body: { email }
async function handleAdminRemoveStudent(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { email } = await request.json();
  if (!email) {
    return jsonResponse({ error: 'Missing email' }, 400);
  }

  const key = `student:${email.toLowerCase().trim()}`;
  const raw = await env.GRE_AUTH.get(key);

  if (!raw) {
    return jsonResponse({ error: 'Student not found' }, 404);
  }

  const student = JSON.parse(raw);
  student.revoked = true;
  student.revokedAt = new Date().toISOString();
  student.fingerprints = [];  // clear devices so they can't continue an existing session

  await env.GRE_AUTH.put(key, JSON.stringify(student));
  return jsonResponse({ status: 'revoked', email: email.toLowerCase().trim() });
}

// ─── ADMIN: DELETE STUDENT ───────────────────────────────────────────────────
// Permanently removes the student's record from KV so they drop off the list
// (e.g. students who have completed the course). Unlike revoke, this can't be
// undone — re-adding creates a fresh record.
// Body: { email }
async function handleAdminDeleteStudent(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { email } = await request.json();
  if (!email) {
    return jsonResponse({ error: 'Missing email' }, 400);
  }

  const normalized = email.toLowerCase().trim();
  const key = `student:${normalized}`;
  const raw = await env.GRE_AUTH.get(key);

  if (!raw) {
    return jsonResponse({ error: 'Student not found' }, 404);
  }

  await env.GRE_AUTH.delete(key);
  return jsonResponse({ status: 'deleted', email: normalized });
}

// ─── ADMIN: LIST STUDENTS ─────────────────────────────────────────────────────
async function handleAdminList(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const list = await env.GRE_AUTH.list({ prefix: 'student:' });
  const students = [];

  for (const key of list.keys) {
    const raw = await env.GRE_AUTH.get(key.name);
    if (raw) {
      const s = JSON.parse(raw);
      students.push({
        email: s.email,
        name: s.name,
        devices: s.fingerprints?.length || 0,
        addedAt: s.addedAt,
        lastSeen: s.lastSeen,
        revoked: s.revoked || false,
        source: s.source || 'manual',
        plan: s.plan || '',
        paymentId: s.paymentId || '',
        access: resolveAccess(s),
      });
    }
  }

  return jsonResponse({ students });
}

// ─── ADMIN: WEBHOOK QUEUE ────────────────────────────────────────────────────
// GET /admin/webhook-queue
// Returns items that need manual attention:
//   manual[]   — payments received at an amount not in AMOUNT_ACCESS
//   noemail[]  — payments with no email address in the Razorpay payload
// Also returns recent auto-provisioned students for visibility.
async function handleAdminWebhookQueue(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Fetch manual-review queue
  const manualList = await env.GRE_AUTH.list({ prefix: 'webhook_manual:' });
  const manual = [];
  for (const k of manualList.keys) {
    const raw = await env.GRE_AUTH.get(k.name);
    if (raw) manual.push(JSON.parse(raw));
  }

  // Fetch no-email queue
  const noEmailList = await env.GRE_AUTH.list({ prefix: 'webhook_noemail:' });
  const noemail = [];
  for (const k of noEmailList.keys) {
    const raw = await env.GRE_AUTH.get(k.name);
    if (raw) noemail.push(JSON.parse(raw));
  }

  // Recent auto-provisioned students (source = razorpay_webhook)
  const studentList = await env.GRE_AUTH.list({ prefix: 'student:' });
  const autoProvisioned = [];
  for (const k of studentList.keys) {
    const raw = await env.GRE_AUTH.get(k.name);
    if (!raw) continue;
    const s = JSON.parse(raw);
    if (s.source === 'razorpay_webhook') {
      autoProvisioned.push({
        email: s.email,
        name: s.name || '',
        plan: s.plan || 'pro',
        paidAt: s.paidAt || s.addedAt,
        paymentId: s.paymentId || '',
        revoked: s.revoked || false,
      });
    }
  }

  // Sort all by date desc
  const byDate = arr => arr.sort((a, b) =>
    String(b.paidAt || b.savedAt || '').localeCompare(String(a.paidAt || a.savedAt || ''))
  );

  return jsonResponse({
    auto_provisioned: byDate(autoProvisioned),
    manual_review: byDate(manual),
    no_email: byDate(noemail),
    counts: {
      auto_provisioned: autoProvisioned.length,
      manual_review: manual.length,
      no_email: noemail.length,
    },
  });
}

// ─── ADMIN: DISMISS WEBHOOK QUEUE ITEM ───────────────────────────────────────
// Call this once a manual-review or no-email item has been handled (e.g. right
// after "Provision Pro" succeeds) so it stops showing up in the queue.
// Body: { type: 'manual' | 'noemail', paymentId }
async function handleAdminDismissWebhookItem(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { type, paymentId } = await request.json();
  if (!paymentId || (type !== 'manual' && type !== 'noemail')) {
    return jsonResponse({ error: 'Missing or invalid type/paymentId' }, 400);
  }

  await env.GRE_AUTH.delete(`webhook_${type}:${paymentId}`);
  return jsonResponse({ status: 'dismissed', type, paymentId });
}

// ─── RAZORPAY WEBHOOK ────────────────────────────────────────────────────────
// POST /razorpay/webhook
// Verifies signature, provisions Pro access on payment.captured. The paid
// amount is looked up in AMOUNT_ACCESS to determine which features to grant —
// any amount not in that table is logged for manual review instead.
//
// Razorpay sends:  X-Razorpay-Signature: HMAC-SHA256(rawBody, webhookSecret) as hex
// The body is the raw JSON string (must be read before .json() parsing).
//
// KV record written: student:{email} → { email, name, fingerprints:[], addedAt,
//   lastSeen:null, plan:'pro', paidAt, paymentId, source:'razorpay_webhook', access }
async function handleRazorpayWebhook(request, env) {
  // Read raw body first — signature is computed over the raw bytes
  const rawBody = await request.text();
  const signature = request.headers.get('X-Razorpay-Signature') || '';

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    // Misconfigured worker — reject so Razorpay will retry later
    return jsonResponse({ error: 'Webhook secret not configured' }, 500);
  }

  const valid = await verifyRazorpayHmac(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      // No CORS headers — webhook is server-to-server, not browser-to-server
    });
  }

  let body;
  try { body = JSON.parse(rawBody); } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  // Acknowledge non-payment events without processing
  if (body.event !== 'payment.captured') {
    return jsonResponse({ status: 'ignored', event: body.event || 'unknown' });
  }

  const payment = body?.payload?.payment?.entity;
  if (!payment) {
    return jsonResponse({ error: 'Missing payload.payment.entity' }, 400);
  }

  const email = String(payment.email || '').toLowerCase().trim();
  const amount = Number(payment.amount || 0); // in paise
  const paymentId = String(payment.id || '');
  const paidAt = payment.created_at
    ? new Date(payment.created_at * 1000).toISOString()
    : new Date().toISOString();

  if (!email) {
    // Razorpay payment had no email — log to KV for manual follow-up
    await env.GRE_AUTH.put(
      `webhook_noemail:${paymentId}`,
      JSON.stringify({ paymentId, amount, paidAt, contact: payment.contact || '' }),
      { expirationTtl: 60 * 60 * 24 * 90 } // keep 90 days
    );
    return jsonResponse({ status: 'no_email', paymentId });
  }

  const access = AMOUNT_ACCESS[amount];
  if (!access) {
    // Unrecognized amount — log for manual review, don't auto-provision
    await env.GRE_AUTH.put(
      `webhook_manual:${paymentId}`,
      JSON.stringify({ paymentId, email, amount, paidAt }),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    return jsonResponse({ status: 'manual_review_required', amount, email, paymentId });
  }

  const plan = 'pro';
  const key = `student:${email}`;
  const existing = await env.GRE_AUTH.get(key);

  if (existing) {
    const student = JSON.parse(existing);
    // Reactivate a previously revoked student who repurchased
    if (student.revoked) {
      student.revoked = false;
      delete student.revokedAt;
      student.fingerprints = [];
      student.reactivatedAt = paidAt;
      student.plan = plan;
      student.paidAt = paidAt;
      student.paymentId = paymentId;
      student.source = 'razorpay_webhook';
      student.access = access.slice();
      await env.GRE_AUTH.put(key, JSON.stringify(student));
      return jsonResponse({ status: 'reactivated', email, plan, access: student.access });
    }
    // Already has access — merge in whatever this payment adds (e.g. an
    // upgrade from a single feature to a combo), never narrowing existing access.
    const merged = new Set([...resolveAccess(student), ...access]);
    student.access = merged.size >= ALL_FEATURES.length ? ALL_FEATURES.slice() : [...merged];
    student.plan = plan;
    student.paidAt = paidAt;
    student.paymentId = paymentId;
    student.source = 'razorpay_webhook';
    await env.GRE_AUTH.put(key, JSON.stringify(student));
    return jsonResponse({ status: 'already_exists', email, plan, access: student.access });
  }

  // New student — create record and grant exactly the access this payment paid for.
  const record = {
    email,
    name: '', // Razorpay doesn't reliably carry the buyer's name; can be updated manually
    fingerprints: [],
    addedAt: paidAt,
    lastSeen: null,
    plan,
    paidAt,
    paymentId,
    source: 'razorpay_webhook',
    access: access.slice(),
  };

  await env.GRE_AUTH.put(key, JSON.stringify(record));
  return jsonResponse({ status: 'provisioned', email, plan, access: record.access });
}

// Verify Razorpay webhook signature.
// Razorpay sends: HMAC-SHA256(rawBody, webhookSecret) as a hex string.
async function verifyRazorpayHmac(body, signature, secret) {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, enc.encode(body));
    const computedHex = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return computedHex === signature;
  } catch {
    return false;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function isAdmin(request, env) {
  const secret = request.headers.get('X-Admin-Secret');
  return secret && secret === env.ADMIN_SECRET;
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function normalizeVisitorId(value) {
  const text = String(value || '').trim();
  return /^[a-zA-Z0-9_-]{8,100}$/.test(text) ? text : '';
}

function normalizePage(value) {
  const text = String(value || '/').trim().slice(0, 240);
  if (!text || text[0] !== '/') return '/';
  return text.replace(/#.*$/, '');
}

function indiaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function recentIndiaDates(days) {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    dates.push(indiaDate(new Date(now.getTime() - i * 86400000)));
  }
  return dates;
}

function safeIso(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

function normalizeKeyPart(value) {
  return String(value || 'event').toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'event';
}

function summarizeAttempt(record) {
  return {
    attempt_id: record.attempt_id,
    saved_at: record.saved_at,
    date: record.date,
    event_id: record.event_id,
    event_name: record.event_name,
    event_type: record.event_type,
    submitted_at: record.submitted_at,
    student: record.student,
    team: record.team,
    score: record.score,
    total_questions: record.total_questions,
    accuracy: record.accuracy,
    correct: record.correct,
    incorrect: record.incorrect,
    skipped: record.skipped,
    total_time_seconds: record.total_time_seconds,
    average_time_seconds: record.average_time_seconds,
    diagnosis: record.diagnosis,
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}


/**
 * POST /lead  — capture an email in exchange for a free download.
 *
 * Body: { email, source, site }
 * KV:   lead:{email} -> { email, source, site, firstSeen, lastSeen, count }
 *
 * Deliberately forgiving: a duplicate submission updates the existing record
 * rather than erroring, because the page releases the download either way and
 * a hard failure here would only lose the lead, not stop the student.
 */
async function handleLead(request, env) {
  const body = await safeJson(request);
  const email = String(body.email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) {
    return jsonResponse({ error: 'Invalid email' }, 400);
  }

  const source = String(body.source || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const site = String(body.site || 'grequantpro').slice(0, 60);
  const now = new Date().toISOString();
  const key = `lead:${email}`;

  const raw = await env.GRE_AUTH.get(key);
  const rec = raw ? JSON.parse(raw) : { email, site, firstSeen: now, count: 0, sources: {} };

  rec.lastSeen = now;
  rec.count = (rec.count || 0) + 1;
  rec.sources = rec.sources || {};
  rec.sources[source] = (rec.sources[source] || 0) + 1;
  rec.source = source;

  await env.GRE_AUTH.put(key, JSON.stringify(rec));

  // Also bump the daily counter so leads show up beside the other analytics.
  const dayKey = `event:${site}:${indiaDate()}:lead_captured`;
  const dayRaw = await env.GRE_AUTH.get(dayKey);
  const day = dayRaw ? JSON.parse(dayRaw) : {
    date: indiaDate(), site, event: 'lead_captured', count: 0, sources: {},
  };
  day.count = (day.count || 0) + 1;
  day.sources = day.sources || {};
  day.sources[source] = (day.sources[source] || 0) + 1;
  day.updatedAt = now;
  await env.GRE_AUTH.put(dayKey, JSON.stringify(day));

  return jsonResponse({ status: 'ok' });
}

/** GET /admin/leads — every captured email, newest first. */
async function handleAdminLeads(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const list = await env.GRE_AUTH.list({ prefix: 'lead:' });
  const leads = [];

  for (const key of list.keys) {
    const raw = await env.GRE_AUTH.get(key.name);
    if (raw) leads.push(JSON.parse(raw));
  }

  leads.sort((a, b) => String(b.firstSeen || '').localeCompare(String(a.firstSeen || '')));
  return jsonResponse({ count: leads.length, leads });
}


/* ============================================================================
 * STUDENT PROGRESS  (Cloudflare D1, binding: GRE_DB)
 * ----------------------------------------------------------------------------
 * Pro students only. Every completed session (bank practice, sectional, full
 * mock) is written to D1 so "My Progress" rebuilds itself on any device
 * instead of asking the student to re-upload JSON files.
 *
 * Two tables, on purpose:
 *   sessions  — one row per session, with the full v2.0 session JSON in
 *               `payload`. That payload is exactly what the logger's existing
 *               generateConsolidated() already consumes, so the dashboard
 *               renderer needed no rewrite.
 *   attempts  — one row per question. This is what KV could never do: it
 *               makes cohort-wide questions ("which subtopic is everyone
 *               weakest at") a single GROUP BY.
 *
 * Writes are batched: one session row + N attempt rows per save. D1's free
 * tier allows 100k row writes/day, so a 10-question session costs 11 of them.
 *
 * Auth is a stateless signed token, NOT a KV record: /validate runs on every
 * page load, and a KV-stored token would spend a KV write each time against a
 * 1,000/day free limit. See issueProgressToken below.
 * ==========================================================================*/

const PROGRESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const PROGRESS_MAX_SESSIONS_PER_CALL = 50;            // caps a free-tier backfill
const PROGRESS_MAX_QUESTIONS_PER_SESSION = 200;

// PROGRESS_SECRET is preferred; ADMIN_SECRET is the fallback so progress keeps
// working if that variable has not been added in the dashboard yet.
function progressSecret(env) {
  return env.PROGRESS_SECRET || env.ADMIN_SECRET || '';
}

function b64urlFromBytes(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bytesFromB64url(text) {
  const padded = String(text).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Length-independent compare so a wrong signature does not leak its prefix.
function timingSafeEqual(a, b) {
  const x = String(a), y = String(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

// token = base64url({ e: email, x: expiry }) + "." + hmac
async function issueProgressToken(env, email) {
  const secret = progressSecret(env);
  if (!secret) return '';
  const payload = b64urlFromBytes(new TextEncoder().encode(JSON.stringify({
    e: String(email || '').toLowerCase().trim(),
    x: Math.floor(Date.now() / 1000) + PROGRESS_TOKEN_TTL_SECONDS,
  })));
  return payload + '.' + (await hmacHex(secret, payload));
}

// Returns the student's email, or '' if the token is missing/forged/expired.
async function verifyProgressToken(env, token) {
  const secret = progressSecret(env);
  if (!secret || !token) return '';
  const parts = String(token).split('.');
  if (parts.length !== 2) return '';
  const [payload, signature] = parts;
  if (!timingSafeEqual(signature, await hmacHex(secret, payload))) return '';
  try {
    const claims = JSON.parse(new TextDecoder().decode(bytesFromB64url(payload)));
    if (!claims || !claims.e) return '';
    if (!Number.isFinite(claims.x) || claims.x < Math.floor(Date.now() / 1000)) return '';
    return String(claims.e).toLowerCase().trim();
  } catch {
    return '';
  }
}

// A session's id is derived from its own content, so re-uploading the same
// session (a retry, or a free-tier backfill run twice) overwrites one row
// instead of creating a duplicate.
async function stableSessionId(email, session) {
  const basis = [
    email,
    session.startTime || '',
    session.date || '',
    session.session_type || '',
    session.topic || '',
    session.notes || '',
    Array.isArray(session.questions) ? session.questions.length : 0,
  ].join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(basis));
  return [...new Uint8Array(digest)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

function progressText(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

// Derives the row values from a v2.0 session JSON. Accuracy is recomputed here
// rather than trusted from the client.
function summarizeSession(session) {
  const questions = Array.isArray(session.questions)
    ? session.questions.slice(0, PROGRESS_MAX_QUESTIONS_PER_SESSION)
    : [];
  const marked = questions.filter(q => q && q.correct !== null && q.correct !== undefined);
  const correct = marked.filter(q => q.correct).length;
  const totalTime = questions.reduce((sum, q) => sum + (Number(q && q.timeTaken) || 0), 0);
  return {
    questions,
    total: questions.length,
    correct,
    accuracy: marked.length ? Math.round((correct / marked.length) * 100) : 0,
    totalTime,
  };
}

/**
 * POST /progress/save
 *
 * Body: { token, session }  or  { token, sessions: [...] }  (backfill)
 * The array form is how a student's free-tier history is carried over when
 * they upgrade and log in on the same browser.
 */
async function handleProgressSave(request, env) {
  if (!env.GRE_DB) {
    return jsonResponse({ error: 'Progress storage not configured' }, 503);
  }

  const body = await safeJson(request);
  const email = await verifyProgressToken(env, body && body.token);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const incoming = Array.isArray(body.sessions)
    ? body.sessions
    : (body.session ? [body.session] : []);
  if (!incoming.length) {
    return jsonResponse({ error: 'Missing session payload' }, 400);
  }

  const sessions = incoming
    .filter(s => s && Array.isArray(s.questions) && s.questions.length)
    .slice(0, PROGRESS_MAX_SESSIONS_PER_CALL);
  if (!sessions.length) {
    return jsonResponse({ error: 'No session contained questions' }, 400);
  }

  const now = Date.now();
  const statements = [];
  const savedIds = [];

  for (const session of sessions) {
    const id = await stableSessionId(email, session);
    const s = summarizeSession(session);
    const date = session.date || indiaDate(new Date(session.startTime || now));
    const subtopic = progressText(session.subtopic || '', 120);

    savedIds.push(id);

    statements.push(
      env.GRE_DB.prepare(
        `INSERT OR REPLACE INTO sessions
           (id, email, student_name, session_type, topic, subtopic, date,
            total_questions, correct, accuracy, total_time, payload, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        id,
        email,
        progressText(session.studentName, 120),
        progressText(session.session_type || 'manual', 40),
        progressText(session.topic, 120),
        subtopic,
        progressText(date, 10),
        s.total,
        s.correct,
        s.accuracy,
        s.totalTime,
        JSON.stringify(session).slice(0, 600000),
        now
      )
    );

    // Replace rather than append, so a re-saved session cannot double-count.
    statements.push(
      env.GRE_DB.prepare('DELETE FROM attempts WHERE session_id = ?').bind(id)
    );

    for (const q of s.questions) {
      statements.push(
        env.GRE_DB.prepare(
          `INSERT INTO attempts
             (session_id, email, bank_question_id, topic, subtopic,
              difficulty, qtype, correct, time_taken, date)
           VALUES (?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          id,
          email,
          progressText(q.bank_question_id, 80),
          progressText(q.topic || session.topic, 120),
          progressText(q.subtopic || subtopic, 120),
          progressText(q.difficulty, 40),
          progressText(q.type, 20),
          q.correct ? 1 : 0,
          Number(q.timeTaken) || 0,
          progressText(q.sessionDate || date, 10)
        )
      );
    }
  }

  await env.GRE_DB.batch(statements);

  return jsonResponse({
    status: 'ok',
    saved: savedIds.length,
    session_ids: savedIds,
    skipped: incoming.length - sessions.length,
  });
}

/**
 * GET /progress/sessions?token=...&limit=200
 *
 * Returns the student's stored session payloads, newest first. The logger
 * drops these straight into its `uploadedSessions` array.
 */
async function handleProgressSessions(request, env, url) {
  if (!env.GRE_DB) {
    return jsonResponse({ error: 'Progress storage not configured' }, 503);
  }

  const token = url.searchParams.get('token') || request.headers.get('X-Progress-Token');
  const email = await verifyProgressToken(env, token);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '200', 10) || 200, 1), 400);
  const { results } = await env.GRE_DB.prepare(
    `SELECT id, date, created_at, payload
       FROM sessions
      WHERE email = ?
      ORDER BY date DESC, created_at DESC
      LIMIT ?`
  ).bind(email, limit).all();

  const sessions = [];
  for (const row of results || []) {
    try {
      sessions.push({ id: row.id, date: row.date, data: JSON.parse(row.payload) });
    } catch {
      // A corrupt payload should cost one session, not the whole dashboard.
    }
  }

  return jsonResponse({ status: 'ok', count: sessions.length, sessions });
}

/* ─── COACH / ADMIN VIEWS ─────────────────────────────────────────────────── */

/**
 * GET /admin/progress-students
 * One row per student who has any stored progress, for the coach page list.
 */
async function handleAdminProgressStudents(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const { results } = await env.GRE_DB.prepare(
    `SELECT email,
            MAX(student_name)       AS student_name,
            COUNT(*)                AS sessions,
            SUM(total_questions)    AS questions,
            SUM(correct)            AS correct,
            MIN(date)               AS first_date,
            MAX(date)               AS last_date,
            MAX(created_at)         AS last_saved
       FROM sessions
      GROUP BY email
      ORDER BY last_saved DESC`
  ).all();

  const students = (results || []).map(r => ({
    ...r,
    accuracy: r.questions ? Math.round((r.correct / r.questions) * 100) : 0,
  }));

  return jsonResponse({ status: 'ok', count: students.length, students });
}

/**
 * GET /admin/progress?email=...&include_payloads=1
 * Everything the coach view needs for one student.
 */
async function handleAdminProgress(request, env, url) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const email = String(url.searchParams.get('email') || '').toLowerCase().trim();
  if (!email) return jsonResponse({ error: 'Missing email' }, 400);
  const includePayloads = url.searchParams.get('include_payloads') === '1';

  const cols = includePayloads
    ? 'id, date, created_at, student_name, session_type, topic, subtopic, total_questions, correct, accuracy, total_time, payload'
    : 'id, date, created_at, student_name, session_type, topic, subtopic, total_questions, correct, accuracy, total_time';

  const sessionsQuery = env.GRE_DB.prepare(
    `SELECT ${cols} FROM sessions WHERE email = ? ORDER BY date ASC, created_at ASC`
  ).bind(email).all();

  const subtopicsQuery = env.GRE_DB.prepare(
    `SELECT subtopic, topic,
            COUNT(*)                        AS attempts,
            SUM(correct)                    AS correct,
            ROUND(AVG(time_taken))          AS avg_time
       FROM attempts
      WHERE email = ? AND subtopic <> ''
      GROUP BY subtopic, topic
      ORDER BY attempts DESC`
  ).bind(email).all();

  const difficultyQuery = env.GRE_DB.prepare(
    `SELECT difficulty,
            COUNT(*)               AS attempts,
            SUM(correct)           AS correct,
            ROUND(AVG(time_taken)) AS avg_time
       FROM attempts
      WHERE email = ? AND difficulty <> ''
      GROUP BY difficulty`
  ).bind(email).all();

  const [sessions, subtopics, difficulty] = await Promise.all([
    sessionsQuery, subtopicsQuery, difficultyQuery,
  ]);

  const rows = (sessions.results || []).map(r => {
    if (!includePayloads) return r;
    try {
      return { ...r, data: JSON.parse(r.payload), payload: undefined };
    } catch {
      return { ...r, payload: undefined };
    }
  });

  const withAccuracy = list => (list || []).map(r => ({
    ...r,
    accuracy: r.attempts ? Math.round((r.correct / r.attempts) * 100) : 0,
  }));

  return jsonResponse({
    status: 'ok',
    email,
    sessions: rows,
    subtopics: withAccuracy(subtopics.results),
    difficulty: withAccuracy(difficulty.results),
  });
}

/**
 * GET /admin/cohort-weakness?min_attempts=5
 * Subtopic accuracy across every student — tells you which subtopics need
 * more or better questions.
 */
async function handleAdminCohortWeakness(request, env, url) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const minAttempts = Math.min(Math.max(parseInt(url.searchParams.get('min_attempts') || '5', 10) || 5, 1), 1000);

  const { results } = await env.GRE_DB.prepare(
    `SELECT subtopic, topic,
            COUNT(*)                         AS attempts,
            COUNT(DISTINCT email)            AS students,
            SUM(correct)                     AS correct,
            ROUND(AVG(time_taken))           AS avg_time
       FROM attempts
      WHERE subtopic <> ''
      GROUP BY subtopic, topic
     HAVING attempts >= ?
      ORDER BY (CAST(SUM(correct) AS REAL) / COUNT(*)) ASC`
  ).bind(minAttempts).all();

  const subtopics = (results || []).map(r => ({
    ...r,
    accuracy: r.attempts ? Math.round((r.correct / r.attempts) * 100) : 0,
  }));

  const hardest = env.GRE_DB.prepare(
    `SELECT bank_question_id, subtopic,
            COUNT(*)      AS attempts,
            SUM(correct)  AS correct
       FROM attempts
      WHERE bank_question_id <> ''
      GROUP BY bank_question_id
     HAVING attempts >= 3
      ORDER BY (CAST(SUM(correct) AS REAL) / COUNT(*)) ASC
      LIMIT 25`
  ).all();

  const hardestRows = (await hardest).results || [];

  return jsonResponse({
    status: 'ok',
    min_attempts: minAttempts,
    subtopics,
    hardest_questions: hardestRows.map(r => ({
      ...r,
      accuracy: r.attempts ? Math.round((r.correct / r.attempts) * 100) : 0,
    })),
  });
}
