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
 *   POST /mock/submission       — save a completed mock attempt
 *   GET  /admin/mock-attempts   — list saved mock attempts (protected by ADMIN_SECRET)
 *   POST /mock/error-log        — an event student tags a wrong/skipped question (attempt_id is the secret)
 *   GET  /mock/pending-log      — attempts in this browser that still owe a log
 *   GET  /mock/log-status       — one attempt: pending | complete | waived (cheap; polled while a student reviews)
 *   GET  /admin/events          — one row per event, aggregated (protected by ADMIN_SECRET)
 *   GET  /admin/event-attempts  — every attempt at one event, with tags (protected by ADMIN_SECRET)
 *   POST /admin/event-log/waive — release a student from an event error log (protected by ADMIN_SECRET)
 *   POST /admin/attempts/delete — permanently delete event / free-mock / sectional attempts and their error-log rows (protected by ADMIN_SECRET)
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
      if (path === '/admin/set-name' && request.method === 'POST') {
        return await handleAdminSetName(request, env);
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
      if (path === '/mock/error-log' && request.method === 'POST') {
        return await handleEventErrorLogSave(request, env);
      }
      if (path === '/mock/pending-log' && request.method === 'GET') {
        return await handleEventPendingLog(request, env, url);
      }
      if (path === '/mock/log-status' && request.method === 'GET') {
        return await handleEventLogStatus(request, env, url);
      }
      if (path === '/admin/events' && request.method === 'GET') {
        return await handleAdminEvents(request, env, url);
      }
      if (path === '/admin/event-attempts' && request.method === 'GET') {
        return await handleAdminEventAttempts(request, env, url);
      }
      if (path === '/admin/event-log/waive' && request.method === 'POST') {
        return await handleAdminEventWaive(request, env);
      }
      if (path === '/admin/attempts/delete' && request.method === 'POST') {
        return await handleAdminAttemptsDelete(request, env);
      }
      if (path === '/admin/attempts/purge' && request.method === 'POST') {
        return await handleAdminAttemptsPurge(request, env);
      }
      if (path === '/admin/attempts/reindex' && request.method === 'POST') {
        return await handleAdminAttemptsReindex(request, env);
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
      if (path === '/admin/progress/delete' && request.method === 'POST') {
        return await handleAdminProgressDelete(request, env);
      }
      if (path === '/admin/progress' && request.method === 'GET') {
        return await handleAdminProgress(request, env, url);
      }
      if (path === '/progress/error-log' && request.method === 'POST') {
        return await handleErrorLogSave(request, env);
      }
      if (path === '/progress/pending-log' && request.method === 'GET') {
        return await handlePendingLog(request, env, url);
      }
      if (path === '/progress/log-status' && request.method === 'GET') {
        return await handleProgressLogStatus(request, env, url);
      }
      if (path === '/admin/progress/waive-log' && request.method === 'POST') {
        return await handleAdminWaiveLog(request, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (err) {
      return jsonResponse({ error: 'Server error', detail: err.message }, 500);
    }
  },

  /**
   * Optional nightly sweep. Add a cron trigger in the Cloudflare dashboard
   * (Workers -> gre-auth -> Settings -> Triggers -> Cron, e.g. `17 20 * * *`)
   * and this clears out attempts written before the index existed, a page per
   * run. Everything written since carries its own expiry, so with no cron
   * trigger at all nothing piles up — this only shortens the tail. The same
   * work is available by hand at POST /admin/attempts/reindex.
   */
  async scheduled(event, env, ctx) {
    if (!env.GRE_DB) return;
    ctx.waitUntil((async () => {
      let cursor;
      for (let page = 0; page < 10; page++) {
        let out;
        try { out = await reindexAttemptPage(env, { cursor }); } catch (e) { return; }
        let data;
        try { data = await out.json(); } catch (e) { return; }
        if (!data || data.error || data.done || !data.cursor) return;
        cursor = data.cursor;
      }
    })());
  },
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
    return jsonResponse({ status: 'ok', needsRegister: true, access, name: student.name || '', progress_token: await issueProgressToken(env, email) });
  }

  // Fingerprint matches one of their registered devices → let them in
  if (fingerprints.includes(fingerprint)) {
    return jsonResponse({ status: 'ok', needsRegister: false, access, name: student.name || '', progress_token: await issueProgressToken(env, email) });
  }

  // Fingerprint doesn't match — check if they're under device limit
  const maxDevices = parseInt(env.MAX_DEVICES || '2');
  if (fingerprints.length < maxDevices) {
    // Under limit → allow, but register this new device
    return jsonResponse({ status: 'ok', needsRegister: true, access, name: student.name || '', progress_token: await issueProgressToken(env, email) });
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


/* ─── ATTEMPT RETENTION AND THE D1 INDEX ─────────────────────────────────────

   Every event, free-mock and sectional attempt used to be a permanent KV
   record, and every coach view re-read the lot: /admin/events walked 90 days
   of keys, /admin/event-attempts walked 365, and each key found cost a GET.
   An afternoon of clicking round the coach page could spend a day's free-tier
   KV reads.

   A submission now writes two things:

     * the full record to KV with a 3-day expiry (ATTEMPT_DETAIL_TTL_DAYS).
       This is the heavy half — every question, answer and time — and it is
       only wanted while an attempt is fresh enough to review question by
       question. KV removes an expired key itself: it is free, it does not
       count against the daily delete allowance, and nothing has to run.
     * a one-row summary to D1 (`mock_attempt_index`). Small, permanent and
       queryable, so every coach list is one SQL statement and no KV reads.

   An attempt whose detail has expired still appears in every list, with its
   score, accuracy and timing intact; only the per-question drill-down goes,
   and the page says so.

   D1 is best effort throughout. No binding, no table or a failed query means
   the old KV scan runs instead, so a half-finished deploy behaves exactly as
   it did before — slower, never broken.
   ──────────────────────────────────────────────────────────────────────── */

const ATTEMPT_DETAIL_TTL_DAYS = 3;
const ATTEMPT_DETAIL_TTL_SECONDS = ATTEMPT_DETAIL_TTL_DAYS * 86400;

/* KV counts every get, put and delete as a subrequest and the Workers free
   plan allows 50 per request, so anything that loops over keys stops here and
   hands the caller a cursor instead of risking a hard failure part-way. */
const ATTEMPT_KV_OPS_MAX = 40;

const ATTEMPT_INDEX_COLUMNS =
  'attempt_id, kv_key, date, event_key, event_id, event_name, event_type, tier, ' +
  'submitted_at, saved_at, student_name, student_email, student_batch, team, ' +
  'score, total_questions, accuracy, correct, incorrect, skipped, ' +
  'total_time_seconds, average_time_seconds, diagnosis, detail_expires_at, created_at';

const ATTEMPT_INDEX_INSERT =
  'INSERT OR REPLACE INTO mock_attempt_index (' + ATTEMPT_INDEX_COLUMNS + ') ' +
  'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

function attemptIndexValues(record, kvKey, expiresAt) {
  const s = record.student || {};
  return [
    String(record.attempt_id || ''),
    String(kvKey || ''),
    String(record.date || ''),
    normalizeKeyPart(record.event_id || 'event'),
    String(record.event_id || ''),
    String(record.event_name || ''),
    String(record.event_type || ''),
    String(record.tier || ''),
    String(record.submitted_at || ''),
    String(record.saved_at || ''),
    String(s.name || ''),
    String(s.email || ''),
    String(s.batch || ''),
    record.team ? JSON.stringify(record.team).slice(0, 2000) : null,
    Number(record.score) || 0,
    Number(record.total_questions) || 0,
    Number(record.accuracy) || 0,
    Number(record.correct) || 0,
    Number(record.incorrect) || 0,
    Number(record.skipped) || 0,
    Number(record.total_time_seconds) || 0,
    Number(record.average_time_seconds) || 0,
    record.diagnosis ? JSON.stringify(record.diagnosis).slice(0, 6000) : null,
    Number(expiresAt) || 0,
    Math.floor(Date.now() / 1000),
  ];
}

/* Returns false rather than throwing: the attempt is already safely in KV by
   the time this runs, and losing the index row costs a slower coach view, not
   a student's result. */
async function saveAttemptIndex(env, record, kvKey, expiresAt) {
  if (!env.GRE_DB) return false;
  try {
    await env.GRE_DB.prepare(ATTEMPT_INDEX_INSERT)
      .bind(...attemptIndexValues(record, kvKey, expiresAt)).run();
    return true;
  } catch (e) {
    return false;   // table not created yet
  }
}

/* An index row back in the shape summarizeAttempt() returns, so the coach page
   and every existing caller keep working unchanged. The two extra fields
   (kv_key, detail_expired) are what the drill-down needs. */
function attemptFromIndex(row) {
  let team = null, diagnosis = null;
  try { team = row.team ? JSON.parse(row.team) : null; } catch (e) { /* keep null */ }
  try { diagnosis = row.diagnosis ? JSON.parse(row.diagnosis) : null; } catch (e) { /* keep null */ }
  const expires = Number(row.detail_expires_at) || 0;
  return {
    attempt_id: row.attempt_id,
    saved_at: row.saved_at,
    date: row.date,
    event_id: row.event_id,
    event_name: row.event_name,
    event_type: row.event_type,
    tier: row.tier || '',
    submitted_at: row.submitted_at,
    student: { name: row.student_name || '', email: row.student_email || '', batch: row.student_batch || '' },
    team,
    score: row.score,
    total_questions: row.total_questions,
    accuracy: row.accuracy,
    correct: row.correct,
    incorrect: row.incorrect,
    skipped: row.skipped,
    total_time_seconds: row.total_time_seconds,
    average_time_seconds: row.average_time_seconds,
    diagnosis,
    kv_key: row.kv_key || '',
    detail_expires_at: expires,
    detail_expired: !(expires && expires * 1000 > Date.now()),
  };
}

/* `null` means there is no usable index (no binding, no table, query failed)
   and the caller should fall back to walking KV. An empty array is a real
   answer: the index exists and holds nothing for this window. */
async function readAttemptIndex(env, opts) {
  if (!env.GRE_DB) return null;
  const o = opts || {};
  const where = [], binds = [];
  if (o.eventKey) { where.push('event_key = ?'); binds.push(o.eventKey); }
  if (o.days) {
    where.push('date >= ?');
    binds.push(indiaDate(new Date(Date.now() - (o.days - 1) * 86400000)));
  }
  const limit = Math.min(Math.max(parseInt(o.limit, 10) || 5000, 1), 20000);
  const sql = 'SELECT * FROM mock_attempt_index'
    + (where.length ? ' WHERE ' + where.join(' AND ') : '')
    + ' ORDER BY submitted_at DESC, saved_at DESC LIMIT ' + limit;
  try {
    const out = await env.GRE_DB.prepare(sql).bind(...binds).all();
    return (out.results || []).map(attemptFromIndex);
  } catch (e) {
    return null;
  }
}

/* explanation and trap are most of a result's size and no coach view shows
   them, so they never leave the Worker. */
function stripHeavyResult(result) {
  if (!result) return null;
  const out = { ...result };
  if (Array.isArray(out.results)) {
    out.results = out.results.map(r => {
      const { explanation, trap, ...rest } = r || {};
      return rest;
    });
  }
  return out;
}

async function deleteAttemptIndexRows(env, attemptIds) {
  if (!env.GRE_DB || !attemptIds.length) return false;
  const marks = attemptIds.map(() => '?').join(',');
  try {
    await env.GRE_DB.prepare('DELETE FROM mock_attempt_index WHERE attempt_id IN (' + marks + ')')
      .bind(...attemptIds).run();
    return true;
  } catch (e) {
    return false;
  }
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
    tier: result.tier === 'pro' ? 'pro' : (result.tier === 'free' ? 'free' : ''),
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
  const detailExpiresAt = Math.floor(Date.now() / 1000) + ATTEMPT_DETAIL_TTL_SECONDS;
  // The full record expires by itself after ATTEMPT_DETAIL_TTL_DAYS; the
  // permanent copy of what the coach lists is the D1 index row written next.
  await env.GRE_AUTH.put(key, JSON.stringify(record), { expirationTtl: ATTEMPT_DETAIL_TTL_SECONDS });
  await saveAttemptIndex(env, record, key, detailExpiresAt);

  // Only the new client sets this flag, so older cached pages never create a
  // requirement. Anything going wrong here leaves the student unlocked.
  let log = { enabled: false, needed: [] };
  if (result.requires_error_log === true) {
    log = await recordEventLogRequirement(env, {
      result, attemptId, eventKey: eventId, email: record.student.email, kvKey: key,
    });
  }
  return jsonResponse({ status: 'ok', attempt_id: attemptId, date, log });
}

// ─── ADMIN: MOCK ATTEMPTS ────────────────────────────────────────────────────
async function handleAdminMockAttempts(request, env, url) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10) || 30, 1), 180);
  const includeResults = url.searchParams.get('include_results') === '1';

  // The list view only ever needs the summary, and the index has it without
  // touching KV at all. include_results=1 still has to read the records.
  if (!includeResults) {
    const indexed = await readAttemptIndex(env, { days });
    if (indexed) {
      return jsonResponse({
        timezone: 'Asia/Kolkata',
        days,
        source: 'index',
        detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
        count: indexed.length,
        attempts: indexed,
      });
    }
  }

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
    source: 'kv',
    detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
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

/**
 * POST /admin/set-name  — { email, name }
 *
 * The buyer's name is not always present in a Razorpay payload, so this is
 * how a coach fills it in or corrects it afterwards. An empty name is allowed
 * and clears the stored one.
 */
async function handleAdminSetName(request, env) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = await safeJson(request);
  const email = String(body.email || '').toLowerCase().trim();
  if (!email) {
    return jsonResponse({ error: 'Missing email' }, 400);
  }

  const key = `student:${email}`;
  const raw = await env.GRE_AUTH.get(key);
  if (!raw) {
    return jsonResponse({ error: 'Student not found' }, 404);
  }

  const student = JSON.parse(raw);
  student.name = String(body.name == null ? '' : body.name).trim().slice(0, 120);
  student.nameUpdatedAt = new Date().toISOString();
  await env.GRE_AUTH.put(key, JSON.stringify(student));

  return jsonResponse({ status: 'ok', email, name: student.name });
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
/**
 * Razorpay does not put the buyer's name in one dependable place, so try each
 * spot it is known to appear, in descending order of trustworthiness:
 *   - payment_link.entity.customer.name — set when the payment came from a
 *     Payment Link that collected a name (the most reliable source, and the
 *     one our pricing links use)
 *   - payment.notes.* — whatever the link's notes carried
 *   - payment.card.name — the cardholder name on card payments
 * Returns '' when none of them is usable, which the caller treats as
 * "leave it for the coach to fill in".
 */
function razorpayName(body, payment) {
  const candidates = [];

  const link = body && body.payload && body.payload.payment_link
    && body.payload.payment_link.entity;
  if (link && link.customer) candidates.push(link.customer.name);

  const notes = (payment && payment.notes) || {};
  for (const k of ['name', 'Name', 'full_name', 'fullName', 'student_name',
                   'studentName', 'customer_name', 'customerName']) {
    candidates.push(notes[k]);
  }

  if (payment && payment.card) candidates.push(payment.card.name);

  for (const c of candidates) {
    const v = String(c == null ? '' : c).trim();
    // Reject values that are clearly not names: an email, a bare phone
    // number, or Razorpay's own placeholders.
    if (!v || v.length > 120) continue;
    if (v.includes('@')) continue;
    if (/^[+\d][\d\s()-]{5,}$/.test(v)) continue;
    if (/^(na|n\/a|none|null|undefined|-)$/i.test(v)) continue;
    return v.slice(0, 120);
  }
  return '';
}

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
  const buyerName = razorpayName(body, payment);
  const amount = Number(payment.amount || 0); // in paise
  const paymentId = String(payment.id || '');
  const paidAt = payment.created_at
    ? new Date(payment.created_at * 1000).toISOString()
    : new Date().toISOString();

  if (!email) {
    // Razorpay payment had no email — log to KV for manual follow-up
    await env.GRE_AUTH.put(
      `webhook_noemail:${paymentId}`,
      JSON.stringify({ paymentId, amount, paidAt, contact: payment.contact || '', name: buyerName }),
      { expirationTtl: 60 * 60 * 24 * 90 } // keep 90 days
    );
    return jsonResponse({ status: 'no_email', paymentId });
  }

  const access = AMOUNT_ACCESS[amount];
  if (!access) {
    // Unrecognized amount — log for manual review, don't auto-provision
    await env.GRE_AUTH.put(
      `webhook_manual:${paymentId}`,
      JSON.stringify({ paymentId, email, amount, paidAt, name: buyerName }),
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
      if (!student.name && buyerName) student.name = buyerName;
      await env.GRE_AUTH.put(key, JSON.stringify(student));
      return jsonResponse({ status: 'reactivated', email, plan, access: student.access, name: student.name || '' });
    }
    // Already has access — merge in whatever this payment adds (e.g. an
    // upgrade from a single feature to a combo), never narrowing existing access.
    const merged = new Set([...resolveAccess(student), ...access]);
    student.access = merged.size >= ALL_FEATURES.length ? ALL_FEATURES.slice() : [...merged];
    student.plan = plan;
    student.paidAt = paidAt;
    student.paymentId = paymentId;
    student.source = 'razorpay_webhook';
    if (!student.name && buyerName) student.name = buyerName;
    await env.GRE_AUTH.put(key, JSON.stringify(student));
    return jsonResponse({ status: 'already_exists', email, plan, access: student.access, name: student.name || '' });
  }

  // New student — create record and grant exactly the access this payment paid for.
  const record = {
    email,
    name: buyerName, // best effort from the payload; editable via /admin/set-name
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
  return jsonResponse({ status: 'provisioned', email, plan, access: record.access, name: record.name });
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
    tier: record.tier || (record.result && record.result.tier) || '',
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
 *               makes per-student subtopic and difficulty accuracy a single
 *               GROUP BY, which is what the coach view reads.
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

  // Sessions from the new client are flagged `requires_error_log`. Record which
  // questions the student still has to tag. Deliberately AFTER the main batch
  // and inside try/catch: if the error-log tables have not been created yet,
  // saving a session must still succeed exactly as it did before.
  const logStatements = [];
  sessions.forEach((session, i) => {
    if (!session || session.requires_error_log !== true) return;
    const needed = neededLogIndices(session);
    if (!needed.length) return;
    logStatements.push(
      env.GRE_DB.prepare(
        `INSERT INTO log_required (session_id, email, needed, created_at)
         VALUES (?,?,?,?)
         ON CONFLICT(session_id) DO UPDATE SET needed = excluded.needed, email = excluded.email`
      ).bind(savedIds[i], email, needed.join(','), now)
    );
  });
  if (logStatements.length) {
    try { await env.GRE_DB.batch(logStatements); } catch (e) { /* tables not created yet */ }
  }

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

  // Merge the student's error-log tags into each stored payload so My Progress
  // can analyse them. Best-effort: if the table is missing, error_log_ok is
  // false and the dashboard simply has no tags to show.
  const tags = await loadErrorTags(env, email);
  if (tags.ok) {
    for (const s of sessions) applyErrorTags(s.data, tags.bySession.get(s.id));
  }

  return jsonResponse({ status: 'ok', count: sessions.length, sessions, error_log_ok: tags.ok });
}

/**
 * POST /admin/progress/delete  — { email, session_id? }
 *
 * With a session_id, deletes that one session. Without, deletes every session
 * the student has. Both forms clear the matching `attempts` rows too, so no
 * orphans are left behind to skew the subtopic and difficulty figures.
 *
 * This is permanent — D1 has no undo here — so the coach page confirms first.
 */
async function handleAdminProgressDelete(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const body = await safeJson(request);
  const email = String(body.email || '').toLowerCase().trim();
  const sessionId = String(body.session_id || '').trim();
  if (!email) return jsonResponse({ error: 'Missing email' }, 400);

  // Count first, so the response can tell the coach what actually went.
  const countSql = sessionId
    ? 'SELECT COUNT(*) AS n FROM sessions WHERE email = ? AND id = ?'
    : 'SELECT COUNT(*) AS n FROM sessions WHERE email = ?';
  const countStmt = sessionId
    ? env.GRE_DB.prepare(countSql).bind(email, sessionId)
    : env.GRE_DB.prepare(countSql).bind(email);
  const counted = await countStmt.all();
  const sessions = ((counted.results || [])[0] || {}).n || 0;

  if (!sessions) {
    return jsonResponse({ status: 'nothing_to_delete', email, session_id: sessionId || null, sessions: 0 });
  }

  // attempts first: if the second statement somehow failed, orphaned attempts
  // would be worse than orphaned sessions, which still render on their own.
  if (sessionId) {
    await env.GRE_DB.batch([
      env.GRE_DB.prepare('DELETE FROM attempts WHERE email = ? AND session_id = ?').bind(email, sessionId),
      env.GRE_DB.prepare('DELETE FROM sessions WHERE email = ? AND id = ?').bind(email, sessionId),
    ]);
  } else {
    await env.GRE_DB.batch([
      env.GRE_DB.prepare('DELETE FROM attempts WHERE email = ?').bind(email),
      env.GRE_DB.prepare('DELETE FROM sessions WHERE email = ?').bind(email),
    ]);
  }

  // Clear the matching error-log rows too. Best-effort (the tables may not exist).
  try {
    if (sessionId) {
      await env.GRE_DB.batch([
        env.GRE_DB.prepare('DELETE FROM error_log WHERE email = ? AND session_id = ?').bind(email, sessionId),
        env.GRE_DB.prepare('DELETE FROM log_required WHERE email = ? AND session_id = ?').bind(email, sessionId),
      ]);
    } else {
      await env.GRE_DB.batch([
        env.GRE_DB.prepare('DELETE FROM error_log WHERE email = ?').bind(email),
        env.GRE_DB.prepare('DELETE FROM log_required WHERE email = ?').bind(email),
      ]);
    }
  } catch (e) { /* tables not created yet */ }

  return jsonResponse({
    status: 'deleted',
    email,
    session_id: sessionId || null,
    sessions,
    scope: sessionId ? 'session' : 'all',
  });
}

/* ─── ERROR LOG ───────────────────────────────────────────────────────────────
 *
 * After a Pro session, the student tags WHY each wrong or skipped question went
 * wrong. Two small tables, both created by schema.sql with CREATE IF NOT EXISTS:
 *
 *   log_required  one row per saved session that needs a log: the question
 *                 indices that must be tagged, and a `waived` flag a coach can
 *                 set so a student is never stranded.
 *   error_log     one row per tagged question, keyed (session_id, q_index).
 *
 * These live in their own tables on purpose. /progress/save replaces a
 * session's `attempts` rows on every re-save, so tags kept there would be lost
 * by a retry. Here they survive. Every read that touches these tables is
 * wrapped so the app behaves exactly as before if they have not been created.
 * ==========================================================================*/

// Stable slugs, never display strings. The labels live in pro/error-log.js.
const ERROR_TYPES = [
  'concept_gap', 'method_not_recalled', 'misread', 'calculation_slip',
  'careless', 'fell_for_trap', 'diagram_misread', 'no_start',
];
const ERROR_CAUSES = ['rushed', 'fatigue', 'changed_answer', 'guessed', 'overthought'];
const ERROR_NOTE_MAX = 300;
const ERROR_LOG_MAX_PENDING = 10;

// Indices of the questions a student must tag: everything not answered correctly
// (wrong, skipped, or unmarked).
function neededLogIndices(session) {
  const qs = Array.isArray(session && session.questions)
    ? session.questions.slice(0, PROGRESS_MAX_QUESTIONS_PER_SESSION)
    : [];
  const out = [];
  qs.forEach((q, i) => { if (q && q.correct !== true) out.push(i); });
  return out;
}

function parseNeeded(text) {
  return String(text || '').split(',').filter(x => x !== '').map(Number).filter(Number.isInteger);
}

// session_id -> Map(q_index -> tag). `ok` is false if the table is missing.
async function loadErrorTags(env, email) {
  const bySession = new Map();
  try {
    const { results } = await env.GRE_DB.prepare(
      'SELECT session_id, q_index, error_type, error_cause, note FROM error_log WHERE email = ?'
    ).bind(email).all();
    for (const r of results || []) {
      if (!bySession.has(r.session_id)) bySession.set(r.session_id, new Map());
      bySession.get(r.session_id).set(r.q_index, r);
    }
    return { ok: true, bySession };
  } catch (e) {
    return { ok: false, bySession };
  }
}

// Copies tags onto the questions of a payload that is about to be returned.
// Never persisted: the stored payload is not touched.
function applyErrorTags(data, tagMap) {
  if (!data || !Array.isArray(data.questions) || !tagMap) return data;
  for (const [idx, t] of tagMap) {
    const q = data.questions[idx];
    if (q) {
      q.error_type = t.error_type;
      q.error_cause = t.error_cause || '';
      q.error_note = t.note || '';
    }
  }
  return data;
}

function pendingItem(q, i) {
  const answers = Array.isArray(q.answers) ? q.answers : [];
  const skipped = q.correct === null || q.correct === undefined || q.submitted === false ||
    (answers.length && answers.every(a => a === '(no answer)'));
  return {
    q_index: i,
    bank_question_id: progressText(q.bank_question_id, 80),
    topic: progressText(q.topic, 120),
    subtopic: progressText(q.subtopic, 120),
    difficulty: progressText(q.difficulty, 40),
    time_taken: Number(q.timeTaken) || 0,
    status: skipped ? 'skipped' : 'wrong',
    your_answer: skipped ? '' : progressText(q.numericAnswer || answers.join(', '), 120),
  };
}

/**
 * POST /progress/error-log
 * Body: { token, session_id, entries: [{ q_index, error_type, error_cause?, note? }] }
 * Idempotent: re-posting an index overwrites it. Only indices the session
 * actually requires are accepted, and only for the token's own session.
 */
async function handleErrorLogSave(request, env) {
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const body = await safeJson(request);
  const email = await verifyProgressToken(env, body && body.token);
  if (!email) return jsonResponse({ error: 'Unauthorized' }, 401);

  const sessionId = progressText(body.session_id, 64);
  const entries = Array.isArray(body.entries) ? body.entries.slice(0, PROGRESS_MAX_QUESTIONS_PER_SESSION) : [];
  if (!sessionId || !entries.length) return jsonResponse({ error: 'Missing session_id or entries' }, 400);

  const found = await env.GRE_DB.prepare(
    'SELECT payload FROM sessions WHERE id = ? AND email = ?'
  ).bind(sessionId, email).all();
  const row = (found.results || [])[0];
  if (!row) return jsonResponse({ error: 'Session not found' }, 404);

  let session;
  try { session = JSON.parse(row.payload); } catch (e) { return jsonResponse({ error: 'Session unreadable' }, 422); }
  const needed = neededLogIndices(session);
  const neededSet = new Set(needed);

  const now = Date.now();
  const statements = [];
  let rejected = 0;
  for (const e of entries) {
    const idx = e && Number.isInteger(e.q_index) ? e.q_index : -1;
    const type = e && String(e.error_type || '');
    const cause = e && e.error_cause ? String(e.error_cause) : '';
    if (!neededSet.has(idx) || !ERROR_TYPES.includes(type) || (cause && !ERROR_CAUSES.includes(cause))) {
      rejected++;
      continue;
    }
    statements.push(
      env.GRE_DB.prepare(
        `INSERT OR REPLACE INTO error_log
           (session_id, email, q_index, bank_question_id, error_type, error_cause, note, logged_at)
         VALUES (?,?,?,?,?,?,?,?)`
      ).bind(
        sessionId, email, idx,
        progressText(session.questions[idx] && session.questions[idx].bank_question_id, 80),
        type, cause, progressText(e.note, ERROR_NOTE_MAX), now
      )
    );
  }
  if (!statements.length) return jsonResponse({ error: 'No valid entries', rejected }, 400);

  // Self-healing: make sure the requirement row exists, in case the save-time
  // insert ran before the tables did.
  statements.push(
    env.GRE_DB.prepare(
      `INSERT INTO log_required (session_id, email, needed, created_at)
       VALUES (?,?,?,?)
       ON CONFLICT(session_id) DO UPDATE SET needed = excluded.needed`
    ).bind(sessionId, email, needed.join(','), now)
  );

  try {
    await env.GRE_DB.batch(statements);
  } catch (e) {
    return jsonResponse({ error: 'Error log storage not configured' }, 503);
  }

  const logged = await env.GRE_DB.prepare(
    'SELECT q_index FROM error_log WHERE session_id = ? AND email = ?'
  ).bind(sessionId, email).all();
  const loggedSet = new Set((logged.results || []).map(r => r.q_index));
  const remaining = needed.filter(i => !loggedSet.has(i));

  return jsonResponse({
    status: 'ok',
    saved: statements.length - 1,
    rejected,
    remaining: remaining.length,
    complete: remaining.length === 0,
  });
}

/**
 * GET /progress/log-status?token=...&session_id=...
 * One Pro session's gate state (see handleEventLogStatus). Cheap on purpose:
 * it is polled while the student is looking at the review screen.
 */
async function handleProgressLogStatus(request, env, url) {
  if (!env.GRE_DB) return jsonResponse({ status: 'ok', enabled: false, state: 'none', left: 0 });
  const token = url.searchParams.get('token') || request.headers.get('X-Progress-Token');
  const email = await verifyProgressToken(env, token);
  if (!email) return jsonResponse({ error: 'Unauthorized' }, 401);
  const sessionId = String(url.searchParams.get('session_id') || '').trim().slice(0, 120);
  if (!sessionId) return jsonResponse({ error: 'Missing session_id' }, 400);
  try {
    const found = await env.GRE_DB.prepare(
      'SELECT needed, waived FROM log_required WHERE session_id = ? AND email = ?'
    ).bind(sessionId, email).all();
    const req = (found.results || [])[0];
    if (!req) return jsonResponse({ status: 'ok', enabled: true, state: 'none', left: 0 });
    const logged = await env.GRE_DB.prepare(
      'SELECT q_index FROM error_log WHERE session_id = ? AND email = ?'
    ).bind(sessionId, email).all();
    const have = new Set((logged.results || []).map(r => r.q_index));
    const left = parseNeeded(req.needed).filter(i => !have.has(i)).length;
    const state = left === 0 ? 'complete' : (req.waived ? 'waived' : 'pending');
    return jsonResponse({ status: 'ok', enabled: true, state, left });
  } catch (e) {
    return jsonResponse({ status: 'ok', enabled: false, state: 'none', left: 0 });
  }
}

/**
 * GET /progress/pending-log?token=...
 * Sessions with mistakes the student still has to tag (waived ones excluded).
 * `enabled:false` means the tables do not exist yet, and the client must NOT
 * lock anything.
 */
async function handlePendingLog(request, env, url) {
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const token = url.searchParams.get('token') || request.headers.get('X-Progress-Token');
  const email = await verifyProgressToken(env, token);
  if (!email) return jsonResponse({ error: 'Unauthorized' }, 401);

  let reqs;
  let logged;
  try {
    reqs = await env.GRE_DB.prepare(
      'SELECT session_id, needed FROM log_required WHERE email = ? AND waived = 0 ORDER BY created_at DESC'
    ).bind(email).all();
    logged = await env.GRE_DB.prepare(
      'SELECT session_id, q_index FROM error_log WHERE email = ?'
    ).bind(email).all();
  } catch (e) {
    return jsonResponse({ status: 'ok', enabled: false, pending: [] });
  }

  const loggedBy = new Map();
  for (const r of logged.results || []) {
    if (!loggedBy.has(r.session_id)) loggedBy.set(r.session_id, new Set());
    loggedBy.get(r.session_id).add(r.q_index);
  }

  const pending = [];
  for (const r of reqs.results || []) {
    if (pending.length >= ERROR_LOG_MAX_PENDING) break;
    const needed = parseNeeded(r.needed);
    const have = loggedBy.get(r.session_id) || new Set();
    const left = needed.filter(i => !have.has(i));
    if (!left.length) continue;

    const found = await env.GRE_DB.prepare(
      'SELECT date, session_type, topic, subtopic, payload FROM sessions WHERE id = ? AND email = ?'
    ).bind(r.session_id, email).all();
    const s = (found.results || [])[0];
    if (!s) continue;
    let data;
    try { data = JSON.parse(s.payload); } catch (e) { continue; }
    pending.push({
      session_id: r.session_id,
      date: s.date,
      session_type: s.session_type,
      topic: s.topic,
      subtopic: s.subtopic,
      needed: needed.length,
      remaining: left.length,
      items: left.filter(i => data.questions && data.questions[i]).map(i => pendingItem(data.questions[i], i)),
    });
  }

  return jsonResponse({ status: 'ok', enabled: true, count: pending.length, pending });
}

/**
 * POST /admin/progress/waive-log — { email, session_id? }
 * A coach's escape hatch: stops a student being locked behind a session they
 * can no longer finish. Without session_id, waives every open session.
 */
async function handleAdminWaiveLog(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const body = await safeJson(request);
  const email = String(body.email || '').toLowerCase().trim();
  const sessionId = String(body.session_id || '').trim();
  if (!email) return jsonResponse({ error: 'Missing email' }, 400);

  try {
    const open = sessionId
      ? await env.GRE_DB.prepare('SELECT COUNT(*) AS n FROM log_required WHERE email = ? AND session_id = ? AND waived = 0').bind(email, sessionId).all()
      : await env.GRE_DB.prepare('SELECT COUNT(*) AS n FROM log_required WHERE email = ? AND waived = 0').bind(email).all();
    const n = ((open.results || [])[0] || {}).n || 0;
    if (!n) return jsonResponse({ status: 'nothing_to_waive', email, waived: 0 });

    if (sessionId) {
      await env.GRE_DB.prepare('UPDATE log_required SET waived = 1 WHERE email = ? AND session_id = ?').bind(email, sessionId).run();
    } else {
      await env.GRE_DB.prepare('UPDATE log_required SET waived = 1 WHERE email = ?').bind(email).run();
    }
    return jsonResponse({ status: 'waived', email, session_id: sessionId || null, waived: n });
  } catch (e) {
    return jsonResponse({ error: 'Error log storage not configured' }, 503);
  }
}

/* ─── EVENT ERROR LOG ─────────────────────────────────────────────────────────
 *
 * Event mocks (events/mock_test.html) have no login, so
 * the Pro token cannot identify the student. Instead:
 *
 *   - /mock/submission stores the attempt in KV as before and, when the client
 *     flags it `requires_error_log`, records which questions must be tagged in
 *     `event_log_required`. It returns the new attempt_id.
 *   - The attempt_id is a random UUID that only the submitting browser ever
 *     sees. It is the bearer secret for POST /mock/error-log and for
 *     GET /mock/pending-log, so nobody can read or write another student's log.
 *   - Tags live in `event_error_log`, never in the KV record, so they cannot be
 *     lost by anything that rewrites the attempt.
 *
 * Fail-open, like the Pro log: a missing table, a 5xx or a network error means
 * the student is NOT locked. Only an attempt the new client flagged can lock.
 * ==========================================================================*/

const EVENT_LOG_MAX_PENDING = 10;
const EVENT_ID_RE = /^[0-9a-f-]{8,64}$/i;

// Every question not answered correctly (wrong or skipped) must be tagged.
function eventNeededIndices(result) {
  const rs = Array.isArray(result && result.results) ? result.results.slice(0, PROGRESS_MAX_QUESTIONS_PER_SESSION) : [];
  const out = [];
  rs.forEach((r, i) => { if (r && r.correct !== true) out.push(i); });
  return out;
}

// Called from handleMockSubmission. Never throws.
async function recordEventLogRequirement(env, ctx) {
  const needed = eventNeededIndices(ctx.result);
  if (!needed.length) return { enabled: true, needed: [] };
  if (!env.GRE_DB) return { enabled: false, needed: [] };
  try {
    await env.GRE_DB.prepare(
      `INSERT OR IGNORE INTO event_log_required
         (attempt_id, event_key, email, needed, kv_key, waived, created_at)
       VALUES (?,?,?,?,?,0,?)`
    ).bind(ctx.attemptId, ctx.eventKey, ctx.email, needed.join(','), ctx.kvKey, Date.now()).run();
    return { enabled: true, needed };
  } catch (e) {
    return { enabled: false, needed: [] };
  }
}

async function loadEventRecord(env, kvKey) {
  if (!kvKey) return null;
  try {
    const raw = await env.GRE_AUTH.get(kvKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function eventPendingItem(r, i) {
  const skipped = !!(r && (r.skipped || r.student_answer == null));
  return {
    q_index: i,
    question_id: progressText(r && r.question_id, 80),
    bank_question_id: progressText(r && r.question_id, 80),
    topic: progressText(r && r.topic, 120),
    subtopic: progressText(r && r.subtopic, 120),
    difficulty: progressText(r && r.difficulty, 40),
    time_taken: Number(r && r.time_taken_seconds) || 0,
    status: skipped ? 'skipped' : 'wrong',
    your_answer: skipped ? '' : progressText(Array.isArray(r.student_answer) ? r.student_answer.join(', ') : r.student_answer, 120),
    stem: progressText(r && r.question_text, 160),
  };
}

/**
 * POST /mock/error-log
 * Body: { attempt_id, entries: [{ q_index, error_type, error_cause?, note? }] }
 * Idempotent. Only indices the attempt requires are accepted.
 */
async function handleEventErrorLogSave(request, env) {
  if (!env.GRE_DB) return jsonResponse({ error: 'Storage not configured' }, 503);
  const body = await safeJson(request);
  const attemptId = String((body && body.attempt_id) || '').trim();
  if (!EVENT_ID_RE.test(attemptId)) return jsonResponse({ error: 'Missing attempt_id' }, 400);
  const entries = Array.isArray(body.entries) ? body.entries.slice(0, PROGRESS_MAX_QUESTIONS_PER_SESSION) : [];
  if (!entries.length) return jsonResponse({ error: 'Missing entries' }, 400);

  let req;
  try {
    const found = await env.GRE_DB.prepare(
      'SELECT attempt_id, event_key, email, needed, kv_key FROM event_log_required WHERE attempt_id = ?'
    ).bind(attemptId).all();
    req = (found.results || [])[0];
  } catch (e) {
    return jsonResponse({ error: 'Error log storage not configured' }, 503);
  }
  if (!req) return jsonResponse({ error: 'Attempt not found' }, 404);

  const needed = parseNeeded(req.needed);
  const neededSet = new Set(needed);
  const record = await loadEventRecord(env, req.kv_key);
  const results = (record && record.result && record.result.results) || [];

  const now = Date.now();
  const statements = [];
  let rejected = 0;
  for (const e of entries) {
    const idx = e && Number.isInteger(e.q_index) ? e.q_index : -1;
    const type = e && String(e.error_type || '');
    const cause = e && e.error_cause ? String(e.error_cause) : '';
    if (!neededSet.has(idx) || !ERROR_TYPES.includes(type) || (cause && !ERROR_CAUSES.includes(cause))) {
      rejected++;
      continue;
    }
    statements.push(
      env.GRE_DB.prepare(
        `INSERT OR REPLACE INTO event_error_log
           (attempt_id, event_key, email, q_index, question_id, error_type, error_cause, note, logged_at)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).bind(
        attemptId, req.event_key, req.email, idx,
        progressText(results[idx] && results[idx].question_id, 80),
        type, cause, progressText(e.note, ERROR_NOTE_MAX), now
      )
    );
  }
  if (!statements.length) return jsonResponse({ error: 'No valid entries', rejected }, 400);

  try {
    await env.GRE_DB.batch(statements);
  } catch (e) {
    return jsonResponse({ error: 'Error log storage not configured' }, 503);
  }

  const logged = await env.GRE_DB.prepare(
    'SELECT q_index FROM event_error_log WHERE attempt_id = ?'
  ).bind(attemptId).all();
  const loggedSet = new Set((logged.results || []).map(r => r.q_index));
  const remaining = needed.filter(i => !loggedSet.has(i));
  return jsonResponse({ status: 'ok', saved: statements.length, rejected, remaining: remaining.length, complete: remaining.length === 0 });
}

/**
 * GET /mock/pending-log?attempt_ids=a,b
 * Of the attempts this browser remembers, the ones still owing a log (waived
 * excluded). `enabled:false` means the tables are missing: never lock.
 */
/**
 * GET /mock/log-status?attempt_id=...
 * One attempt's gate state, for a student who is on the review screen and may
 * have been cleared by the coach in the meantime. The attempt_id is the secret.
 * state: 'pending' (tags still owed), 'complete', 'waived', or 'none' (no
 * requirement was recorded). enabled:false means "do not lock anything".
 */
async function handleEventLogStatus(request, env, url) {
  if (!env.GRE_DB) return jsonResponse({ status: 'ok', enabled: false, state: 'none', left: 0 });
  const id = String(url.searchParams.get('attempt_id') || '').trim();
  if (!EVENT_ID_RE.test(id)) return jsonResponse({ error: 'Missing attempt_id' }, 400);
  try {
    const found = await env.GRE_DB.prepare(
      'SELECT needed, waived FROM event_log_required WHERE attempt_id = ?'
    ).bind(id).all();
    const req = (found.results || [])[0];
    if (!req) return jsonResponse({ status: 'ok', enabled: true, state: 'none', left: 0 });
    const logged = await env.GRE_DB.prepare('SELECT q_index FROM event_error_log WHERE attempt_id = ?').bind(id).all();
    const have = new Set((logged.results || []).map(r => r.q_index));
    const left = parseNeeded(req.needed).filter(i => !have.has(i)).length;
    const state = left === 0 ? 'complete' : (req.waived ? 'waived' : 'pending');
    return jsonResponse({ status: 'ok', enabled: true, state, left });
  } catch (e) {
    return jsonResponse({ status: 'ok', enabled: false, state: 'none', left: 0 });
  }
}

async function handleEventPendingLog(request, env, url) {
  if (!env.GRE_DB) return jsonResponse({ status: 'ok', enabled: false, pending: [] });
  const ids = String(url.searchParams.get('attempt_ids') || '').split(',')
    .map(s => s.trim()).filter(s => EVENT_ID_RE.test(s)).slice(0, EVENT_LOG_MAX_PENDING);
  if (!ids.length) return jsonResponse({ status: 'ok', enabled: true, count: 0, pending: [] });

  const pending = [];
  try {
    for (const id of ids) {
      const found = await env.GRE_DB.prepare(
        'SELECT attempt_id, event_key, needed, kv_key FROM event_log_required WHERE attempt_id = ? AND waived = 0'
      ).bind(id).all();
      const req = (found.results || [])[0];
      if (!req) continue;
      const logged = await env.GRE_DB.prepare('SELECT q_index FROM event_error_log WHERE attempt_id = ?').bind(id).all();
      const have = new Set((logged.results || []).map(r => r.q_index));
      const needed = parseNeeded(req.needed);
      const left = needed.filter(i => !have.has(i));
      if (!left.length) continue;
      const record = await loadEventRecord(env, req.kv_key);
      if (!record || !record.result || !Array.isArray(record.result.results)) continue;
      pending.push({
        attempt_id: id,
        event_id: record.event_id,
        event_name: record.event_name,
        date: record.date,
        needed: needed.length,
        remaining: left.length,
        items: left.filter(i => record.result.results[i]).map(i => eventPendingItem(record.result.results[i], i)),
      });
    }
  } catch (e) {
    return jsonResponse({ status: 'ok', enabled: false, pending: [] });
  }
  return jsonResponse({ status: 'ok', enabled: true, count: pending.length, pending });
}

// attempt_id -> { needed, logged, waived } and event_key -> rollup. `ok` is
// false when the tables do not exist. eventKey narrows the query to one event.
async function loadEventLogState(env, eventKey) {
  const attempts = new Map();
  const tagsByAttempt = new Map();
  if (!env.GRE_DB) return { ok: false, attempts, tagsByAttempt };
  try {
    const reqs = eventKey
      ? await env.GRE_DB.prepare('SELECT attempt_id, event_key, needed, waived FROM event_log_required WHERE event_key = ?').bind(eventKey).all()
      : await env.GRE_DB.prepare('SELECT attempt_id, event_key, needed, waived FROM event_log_required').all();
    const tags = eventKey
      ? await env.GRE_DB.prepare('SELECT attempt_id, q_index, error_type, error_cause, note FROM event_error_log WHERE event_key = ?').bind(eventKey).all()
      : await env.GRE_DB.prepare('SELECT attempt_id, q_index, error_type, error_cause, note FROM event_error_log').all();
    for (const t of tags.results || []) {
      if (!tagsByAttempt.has(t.attempt_id)) tagsByAttempt.set(t.attempt_id, []);
      tagsByAttempt.get(t.attempt_id).push({
        q_index: t.q_index, error_type: t.error_type, error_cause: t.error_cause || '', note: t.note || '',
      });
    }
    for (const r of reqs.results || []) {
      const needed = parseNeeded(r.needed);
      const have = new Set((tagsByAttempt.get(r.attempt_id) || []).map(t => t.q_index));
      attempts.set(r.attempt_id, {
        event_key: r.event_key,
        required: true,
        needed: needed.length,
        logged: needed.filter(i => have.has(i)).length,
        waived: !!r.waived,
      });
    }
    return { ok: true, attempts, tagsByAttempt };
  } catch (e) {
    return { ok: false, attempts: new Map(), tagsByAttempt: new Map() };
  }
}

function eventLogOf(state, attemptId) {
  const s = state.attempts.get(attemptId);
  // `required:false` = never gated (legacy attempt, or a clean paper).
  return s ? { required: true, needed: s.needed, logged: s.logged, waived: s.waived } : { required: false, needed: 0, logged: 0, waived: false };
}

// Walks the KV keys for one date range. eventKey narrows by key prefix, which
// is exact: keys are mock_attempt:{date}:{event}:{attemptId}.
async function collectEventRecords(env, days, eventKey, summarise) {
  const out = [];
  for (const date of recentIndiaDates(days)) {
    let cursor;
    do {
      const listed = await env.GRE_AUTH.list({
        prefix: eventKey ? `mock_attempt:${date}:${eventKey}:` : `mock_attempt:${date}:`,
        cursor,
        limit: 1000,
      });
      for (const key of listed.keys) {
        const raw = await env.GRE_AUTH.get(key.name);
        if (!raw) continue;
        try { out.push(summarise(JSON.parse(raw))); } catch (e) { /* skip unreadable */ }
      }
      cursor = listed.list_complete ? undefined : listed.cursor;
    } while (cursor);
  }
  return out;
}

/**
 * GET /admin/events?days=90
 * One row per event, aggregated here so the coach list is a single small call.
 */
async function handleAdminEvents(request, env, url) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '90', 10) || 90, 1), 365);
  const state = await loadEventLogState(env, null);

  // Index first: one SQL statement instead of `days` KV list calls and a GET
  // per attempt. collectEventRecords stays as the fallback for a deploy where
  // mock_attempt_index does not exist yet.
  let attempts = await readAttemptIndex(env, { days });
  let source = 'index';
  if (attempts) {
    attempts = attempts.map(a => ({ ...a, log: eventLogOf(state, a.attempt_id) }));
  } else {
    source = 'kv';
    const slim = (rec) => ({ ...summarizeAttempt(rec), log: eventLogOf(state, rec.attempt_id) });
    attempts = await collectEventRecords(env, days, null, slim);
  }

  const byEvent = new Map();
  for (const a of attempts) {
    const key = normalizeKeyPart(a.event_id || 'event');
    if (!byEvent.has(key)) byEvent.set(key, { event_key: key, event_id: a.event_id, event_name: a.event_name, event_type: a.event_type, rows: [] });
    byEvent.get(key).rows.push(a);
  }
  const events = [];
  for (const e of byEvent.values()) {
    const rows = e.rows;
    const people = new Set(rows.map(r => (r.student && (r.student.email || r.student.name)) || r.attempt_id));
    const dates = rows.map(r => r.date).sort();
    const avg = (f) => rows.length ? rows.reduce((s, r) => s + (Number(f(r)) || 0), 0) / rows.length : 0;
    const gated = rows.filter(r => r.log.required);
    const open = gated.filter(r => !r.log.waived && r.log.logged < r.log.needed).length;
    events.push({
      event_key: e.event_key,
      event_id: e.event_id,
      event_name: e.event_name,
      event_type: e.event_type,
      attempts: rows.length,
      students: people.size,
      first_date: dates[0],
      last_date: dates[dates.length - 1],
      avg_accuracy: Math.round(avg(r => r.accuracy) * 10) / 10,
      avg_correct: Math.round(avg(r => r.correct) * 10) / 10,
      total_questions: Math.max(...rows.map(r => r.total_questions || 0)),
      best_accuracy: Math.max(...rows.map(r => Number(r.accuracy) || 0)),
      // How many of this event's attempts can still be opened question by
      // question. The rest are summary-only; their detail has expired.
      detail_live: rows.filter(r => r.detail_expired === false).length,
      log: {
        enabled: state.ok,
        gated: gated.length,
        complete: gated.filter(r => r.log.waived || r.log.logged >= r.log.needed).length,
        open,
        waived: gated.filter(r => r.log.waived).length,
      },
    });
  }
  events.sort((a, b) => String(b.last_date).localeCompare(String(a.last_date)));
  return jsonResponse({
    timezone: 'Asia/Kolkata', days, source,
    detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
    log_enabled: state.ok, count: events.length, events,
  });
}

/**
 * GET /admin/event-attempts?event_id=...&days=180
 * Every attempt at one event, in full, with its error tags and log status.
 * explanation/trap are dropped: the coach views never show them and they are
 * most of the payload.
 */
async function handleAdminEventAttempts(request, env, url) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  const eventId = String(url.searchParams.get('event_id') || '').trim();
  if (!eventId) return jsonResponse({ error: 'Missing event_id' }, 400);
  const eventKey = normalizeKeyPart(eventId);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '180', 10) || 180, 1), 365);
  const state = await loadEventLogState(env, eventKey);

  // Detail costs one KV read each and the Workers free plan allows 50
  // subrequests per request, so a crowded event is served in pages: the reply
  // carries detail_next and the page asks again until detail_done.
  const detailOffset = Math.max(parseInt(url.searchParams.get('detail_offset') || '0', 10) || 0, 0);
  const detailLimit = Math.min(Math.max(parseInt(url.searchParams.get('detail_limit') || String(ATTEMPT_KV_OPS_MAX), 10) || ATTEMPT_KV_OPS_MAX, 0), 200);

  const indexed = await readAttemptIndex(env, { eventKey, days });
  if (indexed) {
    indexed.sort((a, b) => String(a.submitted_at || a.saved_at).localeCompare(String(b.submitted_at || b.saved_at)));

    // Only rows whose detail has not expired are worth a KV read, and only
    // the slice this page asked for.
    const live = [];
    for (let i = 0; i < indexed.length; i++) {
      if (!indexed[i].detail_expired && indexed[i].kv_key) live.push(i);
    }
    const slice = live.slice(detailOffset, detailOffset + detailLimit);
    const fetched = new Map();
    for (const i of slice) {
      const row = indexed[i];
      try {
        const raw = await env.GRE_AUTH.get(row.kv_key);
        // Gone early (purged by hand): the summary stays, the detail does not.
        fetched.set(row.attempt_id, raw ? stripHeavyResult(JSON.parse(raw).result) : null);
      } catch (e) {
        fetched.set(row.attempt_id, null);
      }
    }

    const attempts = indexed.map((a, i) => {
      const got = fetched.has(a.attempt_id) ? fetched.get(a.attempt_id) : undefined;
      return {
        ...a,
        result: got === undefined ? null : got,
        // true once we know there is nothing to open: expired, or looked for
        // and not found. A row we simply have not paged to yet is neither.
        detail_expired: a.detail_expired || got === null,
        detail_pending: got === undefined && !a.detail_expired,
        tags: state.tagsByAttempt.get(a.attempt_id) || [],
        log: eventLogOf(state, a.attempt_id),
      };
    });

    const nextOffset = detailOffset + slice.length;
    return jsonResponse({
      timezone: 'Asia/Kolkata', event_id: eventId, days, source: 'index',
      detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
      detail_total: live.length,
      detail_next: nextOffset,
      detail_done: nextOffset >= live.length,
      log_enabled: state.ok, count: attempts.length, attempts,
    });
  }

  const full = (rec) => ({
    ...rec,
    result: stripHeavyResult(rec.result),
    tags: state.tagsByAttempt.get(rec.attempt_id) || [],
    log: eventLogOf(state, rec.attempt_id),
  });
  const attempts = await collectEventRecords(env, days, eventKey, full);
  attempts.sort((a, b) => String(a.submitted_at || a.saved_at).localeCompare(String(b.submitted_at || b.saved_at)));
  return jsonResponse({
    timezone: 'Asia/Kolkata', event_id: eventId, days, source: 'kv',
    detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
    detail_total: attempts.length, detail_next: attempts.length, detail_done: true,
    log_enabled: state.ok, count: attempts.length, attempts,
  });
}

/**
 * POST /admin/event-log/waive — { attempt_id } or { event_id }
 * Releases a student who cannot finish (new device, lost browser data). With
 * event_id, waives every open attempt of that event. Never deletes tags.
 */
async function handleAdminEventWaive(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Storage not configured' }, 503);
  const body = await safeJson(request);
  const attemptId = String(body.attempt_id || '').trim();
  const eventId = String(body.event_id || '').trim();
  if (!attemptId && !eventId) return jsonResponse({ error: 'Missing attempt_id or event_id' }, 400);
  try {
    const q = attemptId
      ? env.GRE_DB.prepare('SELECT COUNT(*) AS n FROM event_log_required WHERE attempt_id = ? AND waived = 0').bind(attemptId)
      : env.GRE_DB.prepare('SELECT COUNT(*) AS n FROM event_log_required WHERE event_key = ? AND waived = 0').bind(normalizeKeyPart(eventId));
    const n = (((await q.all()).results || [])[0] || {}).n || 0;
    if (!n) return jsonResponse({ status: 'nothing_to_waive', waived: 0 });
    if (attemptId) await env.GRE_DB.prepare('UPDATE event_log_required SET waived = 1 WHERE attempt_id = ?').bind(attemptId).run();
    else await env.GRE_DB.prepare('UPDATE event_log_required SET waived = 1 WHERE event_key = ?').bind(normalizeKeyPart(eventId)).run();
    return jsonResponse({ status: 'waived', waived: n });
  } catch (e) {
    return jsonResponse({ error: 'Error log storage not configured' }, 503);
  }
}

/**
 * POST /admin/attempts/delete — { attempts: [{ attempt_id, date, event_id }, ...] }
 *
 * Permanently removes event, free-mock and free-sectional attempts (they all
 * live in the same `mock_attempt:` KV records) and the error-log rows that
 * belong to them. The coach page already holds each attempt's id, date and
 * event, so it sends those and we rebuild the KV key here. No key string is
 * ever taken from the request, so this can only ever touch `mock_attempt:`
 * records.
 *
 * Small batches on purpose (ATTEMPT_DELETE_MAX): each attempt costs a KV read
 * and a KV delete, both subrequests, and the Worker plan may allow only 50.
 * The page loops over chunks to remove a whole event. An attempt that is not
 * there (already deleted, or an event_id that does not match) is counted as
 * `missing`, and its log rows are left alone.
 *
 * Pro progress is a different store (D1 sessions): see /admin/progress/delete.
 * Nothing here undoes: the coach page confirms first.
 */
const ATTEMPT_DELETE_MAX = 20;
const ATTEMPT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function handleAdminAttemptsDelete(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_AUTH) return jsonResponse({ error: 'Storage not configured' }, 503);

  const body = await safeJson(request);
  const items = Array.isArray(body.attempts) ? body.attempts : null;
  if (!items || !items.length) return jsonResponse({ error: 'Missing attempts' }, 400);
  if (items.length > ATTEMPT_DELETE_MAX) {
    return jsonResponse({ error: 'Too many attempts in one request (max ' + ATTEMPT_DELETE_MAX + ')' }, 400);
  }

  // Validate everything before touching anything: one bad row rejects the lot.
  const targets = [];
  const seen = new Set();
  for (const it of items) {
    const id = String((it && it.attempt_id) || '').trim();
    const date = String((it && it.date) || '').trim();
    if (!EVENT_ID_RE.test(id) || !ATTEMPT_DATE_RE.test(date)) {
      return jsonResponse({ error: 'Each attempt needs a valid attempt_id and date (YYYY-MM-DD)' }, 400);
    }
    if (seen.has(id)) continue;
    seen.add(id);
    targets.push({ id, key: `mock_attempt:${date}:${normalizeKeyPart((it && it.event_id) || 'event')}:${id}` });
  }

  // Records first (what the coach sees), log rows after (best effort).
  const gone = [];
  let failed = 0, missing = 0;
  for (const t of targets) {
    try {
      if ((await env.GRE_AUTH.get(t.key)) == null) { missing += 1; continue; }
      await env.GRE_AUTH.delete(t.key);
      gone.push(t.id);
    } catch (e) { failed += 1; }
  }

  let logCleaned = false;
  if (env.GRE_DB && gone.length) {
    const marks = gone.map(() => '?').join(',');
    try {
      await env.GRE_DB.batch([
        env.GRE_DB.prepare(`DELETE FROM event_error_log WHERE attempt_id IN (${marks})`).bind(...gone),
        env.GRE_DB.prepare(`DELETE FROM event_log_required WHERE attempt_id IN (${marks})`).bind(...gone),
      ]);
      logCleaned = true;
    } catch (e) { /* event tables not created yet: nothing to clean */ }
  }
  // The index row is what the coach page lists, so it has to go too, and it
  // goes even for a `missing` attempt — that is exactly the row left behind
  // when the KV record expired before the coach got round to deleting it.
  await deleteAttemptIndexRows(env, targets.map(t => t.id));

  return jsonResponse({
    status: failed ? (gone.length ? 'partial' : 'failed') : 'deleted',
    deleted: gone.length,
    missing,
    failed,
    log_cleaned: logCleaned,
  }, failed && !gone.length ? 500 : 200);
}


/**
 * POST /admin/attempts/purge — clear attempts in bulk.
 *
 * Body: { scope: 'all' | 'event', event_id?, older_than_days?, hard? }
 *
 *   scope 'all'    every event, free-mock and sectional attempt
 *   scope 'event'  one event, named by event_id
 *   older_than_days  keeps anything newer, so "clear everything before this
 *                    week's batch" does not need a list of attempt ids
 *   hard           also delete the KV records now (see below)
 *
 * The default is a soft purge: it deletes the D1 index rows and the error-log
 * rows and leaves the KV records to expire by themselves within
 * ATTEMPT_DETAIL_TTL_DAYS. The index is what every coach view reads, so the
 * view is clear immediately, at a cost of three SQL statements and no KV
 * operations whatever the size of the purge. Deleting the KV keys by hand
 * instead would spend the free tier's 1,000 daily deletes to remove records
 * that disappear on their own within three days.
 *
 * hard:true is for when the data itself has to go now rather than within three
 * days. It is capped at ATTEMPT_KV_OPS_MAX keys per call and the reply carries
 * `remaining`, so the page loops until it reaches zero.
 *
 * Pro progress is a different store: see POST /admin/progress/delete.
 * Nothing here can be undone; the coach page asks for a typed confirmation.
 */
async function handleAdminAttemptsPurge(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Attempt index not configured' }, 503);

  const body = await safeJson(request);
  const scope = String(body.scope || '').trim();
  const hard = body.hard === true;
  const olderThan = Math.max(parseInt(body.older_than_days, 10) || 0, 0);
  if (scope !== 'all' && scope !== 'event') {
    return jsonResponse({ error: "scope must be 'all' or 'event'" }, 400);
  }

  const where = [], binds = [];
  if (scope === 'event') {
    const eventId = String(body.event_id || '').trim();
    if (!eventId) return jsonResponse({ error: 'Missing event_id' }, 400);
    where.push('event_key = ?');
    binds.push(normalizeKeyPart(eventId));
  }
  if (olderThan) {
    where.push('date < ?');
    binds.push(indiaDate(new Date(Date.now() - olderThan * 86400000)));
  }
  const clause = where.length ? ' WHERE ' + where.join(' AND ') : '';

  let rows;
  try {
    const out = await env.GRE_DB.prepare(
      'SELECT attempt_id, kv_key, detail_expires_at FROM mock_attempt_index' + clause
    ).bind(...binds).all();
    rows = out.results || [];
  } catch (e) {
    return jsonResponse({ error: 'Attempt index not configured' }, 503);
  }
  if (!rows.length) return jsonResponse({ status: 'nothing_to_delete', deleted: 0, remaining: 0 });

  // Hard purge: only keys that have not expired are worth a delete call.
  let kvDeleted = 0, kvFailed = 0, remaining = 0;
  let handled = rows;
  if (hard) {
    const now = Date.now();
    const liveKeys = rows.filter(r => r.kv_key && Number(r.detail_expires_at) * 1000 > now);
    const batch = liveKeys.slice(0, ATTEMPT_KV_OPS_MAX);
    remaining = Math.max(liveKeys.length - batch.length, 0);
    for (const r of batch) {
      try { await env.GRE_AUTH.delete(r.kv_key); kvDeleted += 1; } catch (e) { kvFailed += 1; }
    }
    // Keep the index rows for anything still holding a live KV record, so the
    // next call can find them again. Everything else goes now.
    const stillLive = new Set(liveKeys.slice(batch.length).map(r => r.attempt_id));
    handled = rows.filter(r => !stillLive.has(r.attempt_id));
  }

  const ids = handled.map(r => r.attempt_id);
  let logCleaned = false;
  // D1 caps the number of bound parameters, so large purges go in chunks.
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const marks = chunk.map(() => '?').join(',');
    try {
      await env.GRE_DB.batch([
        env.GRE_DB.prepare('DELETE FROM mock_attempt_index WHERE attempt_id IN (' + marks + ')').bind(...chunk),
        env.GRE_DB.prepare('DELETE FROM event_error_log WHERE attempt_id IN (' + marks + ')').bind(...chunk),
        env.GRE_DB.prepare('DELETE FROM event_log_required WHERE attempt_id IN (' + marks + ')').bind(...chunk),
      ]);
      logCleaned = true;
    } catch (e) {
      // event tables may not exist; the index delete still has to happen
      try {
        await env.GRE_DB.prepare('DELETE FROM mock_attempt_index WHERE attempt_id IN (' + marks + ')').bind(...chunk).run();
      } catch (e2) { /* nothing more to try */ }
    }
  }

  return jsonResponse({
    status: remaining ? 'partial' : 'deleted',
    scope,
    deleted: ids.length,
    kv_deleted: kvDeleted,
    kv_failed: kvFailed,
    remaining,
    log_cleaned: logCleaned,
    detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
    note: hard ? undefined : 'Stored results expire on their own within ' + ATTEMPT_DETAIL_TTL_DAYS + ' days.',
  });
}

/**
 * POST /admin/attempts/reindex — one-off migration, and the nightly sweep.
 *
 * Attempts written before the index existed have no D1 row and no expiry, so
 * they would both vanish from the coach page and sit in KV for ever. This
 * walks the `mock_attempt:` keyspace a page at a time and, for each key:
 *
 *   * writes the index row if it is missing, so the attempt keeps showing;
 *   * deletes the KV record if it is already older than the retention window,
 *     which is what the expiry would have done had it been set.
 *
 * Body: { cursor?, max_ops? }. KV work is capped at ATTEMPT_KV_OPS_MAX per
 * call and the reply carries `cursor` and `done`, so the coach page (or the
 * scheduled handler below) loops until it finishes. Safe to re-run: an
 * already-indexed, in-window key costs nothing but the list call.
 */
async function handleAdminAttemptsReindex(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Attempt index not configured' }, 503);
  const body = await safeJson(request);
  return await reindexAttemptPage(env, {
    cursor: body.cursor ? String(body.cursor) : undefined,
    maxOps: Math.min(Math.max(parseInt(body.max_ops, 10) || ATTEMPT_KV_OPS_MAX, 1), ATTEMPT_KV_OPS_MAX),
  });
}

async function reindexAttemptPage(env, opts) {
  const o = opts || {};
  const maxOps = o.maxOps || ATTEMPT_KV_OPS_MAX;
  const cutoff = indiaDate(new Date(Date.now() - ATTEMPT_DETAIL_TTL_DAYS * 86400000));

  let listed;
  try {
    listed = await env.GRE_AUTH.list({ prefix: 'mock_attempt:', cursor: o.cursor, limit: 1000 });
  } catch (e) {
    return jsonResponse({ error: 'Could not list attempts' }, 500);
  }

  // Key shape is mock_attempt:{date}:{event}:{attemptId}, so the date and the
  // id come out of the name itself — no read needed to decide what to do.
  const parsed = [];
  for (const k of listed.keys) {
    const bits = String(k.name).split(':');
    if (bits.length < 4) continue;
    parsed.push({ key: k.name, date: bits[1], attemptId: bits.slice(3).join(':') });
  }

  let known = new Set();
  if (parsed.length) {
    for (let i = 0; i < parsed.length; i += 200) {
      const chunk = parsed.slice(i, i + 200);
      const marks = chunk.map(() => '?').join(',');
      try {
        const out = await env.GRE_DB.prepare(
          'SELECT attempt_id FROM mock_attempt_index WHERE attempt_id IN (' + marks + ')'
        ).bind(...chunk.map(p => p.attemptId)).all();
        for (const r of out.results || []) known.add(r.attempt_id);
      } catch (e) {
        return jsonResponse({ error: 'Attempt index table missing — run schema.sql first' }, 503);
      }
    }
  }

  let ops = 0, indexed = 0, deleted = 0, failed = 0, skipped = 0, stoppedEarly = false;
  for (const p of parsed) {
    const stale = p.date < cutoff;
    const needsIndex = !known.has(p.attemptId);
    if (!stale && !needsIndex) { skipped += 1; continue; }
    if (ops + (needsIndex ? 1 : 0) + (stale ? 1 : 0) > maxOps) { stoppedEarly = true; break; }

    if (needsIndex) {
      ops += 1;
      try {
        const raw = await env.GRE_AUTH.get(p.key);
        if (raw) {
          const rec = JSON.parse(raw);
          // Legacy records carry no expiry. Index them as already expired when
          // they are past the window, otherwise give them the time they have
          // left so the drill-down still works until the sweep reaches them.
          const expiresAt = stale ? 0 : Math.floor(Date.now() / 1000) + ATTEMPT_DETAIL_TTL_SECONDS;
          if (!rec.attempt_id) rec.attempt_id = p.attemptId;
          if (!rec.date) rec.date = p.date;
          if (await saveAttemptIndex(env, rec, p.key, expiresAt)) indexed += 1;
          else failed += 1;
        }
      } catch (e) { failed += 1; }
    }
    if (stale) {
      ops += 1;
      try { await env.GRE_AUTH.delete(p.key); deleted += 1; } catch (e) { failed += 1; }
    }
  }

  const done = !stoppedEarly && listed.list_complete;
  return jsonResponse({
    status: 'ok',
    scanned: parsed.length,
    indexed, deleted, failed, skipped,
    // Re-list the same page when we stopped early: the deleted keys are gone
    // and the indexed ones are now skipped, so each pass gets further.
    cursor: done ? null : (stoppedEarly ? (o.cursor || null) : (listed.cursor || null)),
    done,
    detail_ttl_days: ATTEMPT_DETAIL_TTL_DAYS,
  });
}

/* ─── COACH / ADMIN VIEWS ─────────────────────────────────────────────────── */

/**
 * GET /admin/progress-students
 * One row per student who has any stored progress, for the coach page list.
 */
async function handleAdminProgressStudents(request, env) {
  if (!isAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!env.GRE_DB) return jsonResponse({ error: 'Progress storage not configured' }, 503);

  const totals = env.GRE_DB.prepare(
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

  // Per-type counts, so the coach table can show at a glance whether a student
  // has been doing topic tests, sectionals or full mocks — not just a total.
  const byType = env.GRE_DB.prepare(
    `SELECT email, session_type,
            COUNT(*)             AS sessions,
            SUM(total_questions) AS questions,
            SUM(correct)         AS correct
       FROM sessions
      GROUP BY email, session_type`
  ).all();

  // Attempts grouped by difficulty, so the coach list can show each student's
  // estimated Quant score. The scale itself is NOT applied here: score-scale.js
  // owns it, and the student's own result screen already used that file. Doing
  // the weighting a second time in SQL would be a second source of truth, and
  // the two would drift the first time an anchor moved.
  const byDifficulty = env.GRE_DB.prepare(
    `SELECT email, difficulty,
            COUNT(*)     AS attempts,
            SUM(correct) AS correct
       FROM attempts
      WHERE difficulty <> ''
      GROUP BY email, difficulty`
  ).all();

  const [totalRows, typeRows, diffRows] = await Promise.all([totals, byType, byDifficulty]);

  const typeMap = new Map();
  for (const r of typeRows.results || []) {
    if (!typeMap.has(r.email)) typeMap.set(r.email, {});
    typeMap.get(r.email)[r.session_type || 'manual'] = {
      sessions: r.sessions,
      questions: r.questions,
      correct: r.correct,
      accuracy: r.questions ? Math.round((r.correct / r.questions) * 100) : 0,
    };
  }

  const diffMap = new Map();
  for (const r of diffRows.results || []) {
    if (!diffMap.has(r.email)) diffMap.set(r.email, []);
    diffMap.get(r.email).push({
      difficulty: r.difficulty,
      attempts: r.attempts,
      correct: r.correct,
    });
  }

  // Mistakes still waiting to be tagged, per student (waived sessions excluded).
  const unlogged = new Map();
  try {
    const reqs = await env.GRE_DB.prepare(
      'SELECT session_id, email, needed FROM log_required WHERE waived = 0'
    ).all();
    const done = await env.GRE_DB.prepare(
      'SELECT session_id, COUNT(*) AS n FROM error_log GROUP BY session_id'
    ).all();
    const doneMap = new Map((done.results || []).map(r => [r.session_id, r.n]));
    for (const r of reqs.results || []) {
      const left = parseNeeded(r.needed).length - (doneMap.get(r.session_id) || 0);
      if (left > 0) unlogged.set(r.email, (unlogged.get(r.email) || 0) + left);
    }
  } catch (e) { /* tables not created yet */ }

  const students = (totalRows.results || []).map(r => ({
    ...r,
    accuracy: r.questions ? Math.round((r.correct / r.questions) * 100) : 0,
    by_type: typeMap.get(r.email) || {},
    by_difficulty: diffMap.get(r.email) || [],
    unlogged: unlogged.get(r.email) || 0,
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

  const byTypeQuery = env.GRE_DB.prepare(
    `SELECT session_type,
            COUNT(*)             AS sessions,
            SUM(total_questions) AS questions,
            SUM(correct)         AS correct,
            SUM(total_time)      AS total_time,
            MIN(date)            AS first_date,
            MAX(date)            AS last_date
       FROM sessions
      WHERE email = ?
      GROUP BY session_type
      ORDER BY sessions DESC`
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

  const [sessions, subtopics, difficulty, byType] = await Promise.all([
    sessionsQuery, subtopicsQuery, difficultyQuery, byTypeQuery,
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

  // Error-log tags and per-session log status (best-effort; tables may not exist).
  const tags = await loadErrorTags(env, email);
  let logReq = new Map();
  try {
    const rr = await env.GRE_DB.prepare(
      'SELECT session_id, needed, waived FROM log_required WHERE email = ?'
    ).bind(email).all();
    logReq = new Map((rr.results || []).map(r => [r.session_id, r]));
  } catch (e) { /* tables not created yet */ }
  for (const row of rows) {
    const t = tags.bySession.get(row.id);
    if (includePayloads && row.data) applyErrorTags(row.data, t);
    const req = logReq.get(row.id);
    if (req) {
      const needed = parseNeeded(req.needed);
      const logged = needed.filter(i => t && t.has(i)).length;
      row.log_status = { needed: needed.length, logged, waived: !!req.waived };
    }
  }

  return jsonResponse({
    status: 'ok',
    email,
    error_log_ok: tags.ok,
    sessions: rows,
    subtopics: withAccuracy(subtopics.results),
    difficulty: withAccuracy(difficulty.results),
    by_type: (byType.results || []).map(r => ({
      ...r,
      accuracy: r.questions ? Math.round((r.correct / r.questions) * 100) : 0,
    })),
  });
}
