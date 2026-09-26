/**
 * GRE Pro Auth Worker
 * Coach Aditya Goenka — goenka.aditya.kol@gmail.com
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
 *   POST /mock/submission       — save a completed mock/team attempt
 *   GET  /admin/mock-attempts   — list saved mock/team attempts (protected by ADMIN_SECRET)
 *   POST /razorpay/webhook      — Razorpay webhook: auto-provisions Pro on payment.captured
 *   GET  /admin/webhook-queue   — list auto-provisioned, manual-review, and no-email payments (protected by ADMIN_SECRET)
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
      if (path === '/admin/list' && request.method === 'GET') {
        return await handleAdminList(request, env);
      }
      if (path === '/analytics/view' && request.method === 'POST') {
        return await handleAnalyticsView(request, env);
      }
      if (path === '/analytics/event' && request.method === 'POST') {
        return await handleAnalyticsEvent(request, env);
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
    return jsonResponse({ status: 'ok', needsRegister: true, access });
  }

  // Fingerprint matches one of their registered devices → let them in
  if (fingerprints.includes(fingerprint)) {
    return jsonResponse({ status: 'ok', needsRegister: false, access });
  }

  // Fingerprint doesn't match — check if they're under device limit
  const maxDevices = parseInt(env.MAX_DEVICES || '2');
  if (fingerprints.length < maxDevices) {
    // Under limit → allow, but register this new device
    return jsonResponse({ status: 'ok', needsRegister: true, access });
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
