#!/usr/bin/env python3
"""Add the /lead and /admin/leads endpoints to cloudflare/worker.js.

Idempotent: running it twice changes nothing.
"""
import os
import sys

PATH = os.path.expanduser('~/mnt/gre-adi/cloudflare/worker.js')
src = open(PATH, encoding='utf-8').read()

if "path === '/lead'" in src:
    sys.exit('already patched — nothing to do')

# ---- 1. the routes -------------------------------------------------------
ANCHOR = """      if (path === '/analytics/event' && request.method === 'POST') {
        return await handleAnalyticsEvent(request, env);
      }
"""
ROUTES = ANCHOR + """      if (path === '/lead' && request.method === 'POST') {
        return await handleLead(request, env);
      }
      if (path === '/admin/leads' && request.method === 'GET') {
        return await handleAdminLeads(request, env);
      }
"""
assert src.count(ANCHOR) == 1, 'route anchor not found exactly once'
src = src.replace(ANCHOR, ROUTES)

# ---- 2. the handlers -----------------------------------------------------
HANDLERS = '''

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

  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email) || email.length > 160) {
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
'''
src = src.rstrip('\n') + '\n' + HANDLERS

# ---- 3. the endpoint list in the header comment --------------------------
DOC_ANCHOR = " *   GET  /admin/analytics       — daily pageviews + unique visitors (protected by ADMIN_SECRET)\n"
if DOC_ANCHOR in src:
    src = src.replace(DOC_ANCHOR, DOC_ANCHOR +
                      " *   POST /lead                  — capture an email for a free download (handbook PDF)\n"
                      " *   GET  /admin/leads           — list captured emails (protected by ADMIN_SECRET)\n")

open(PATH, 'w', encoding='utf-8').write(src)
print('patched cloudflare/worker.js — added /lead and /admin/leads')
