#!/usr/bin/env python3
"""Add a 'Leads' tab to cloudflare/admin.html, reading GET /admin/leads.

Follows the existing page conventions exactly: a tab button, a tab-panel, a
loadX() that uses getConfig() + the X-Admin-Secret header, and a CSV download
through the existing downloadBlob() helper.

Idempotent: running it twice changes nothing.
"""
import os
import sys

PATH = os.path.expanduser('~/mnt/gre-adi/cloudflare/admin.html')
src = open(PATH, encoding='utf-8').read()

if 'data-tab="leads"' in src:
    sys.exit('already patched — nothing to do')

# ---- 1. the tab button ---------------------------------------------------
TAB_ANCHOR = ('    <button class="tab-btn" data-tab="webhooks" '
              'onclick="switchTab(\'webhooks\')">💳 Webhooks</button>\n')
assert src.count(TAB_ANCHOR) == 1, 'tab-button anchor not found exactly once'
src = src.replace(TAB_ANCHOR, TAB_ANCHOR +
                  '    <button class="tab-btn" data-tab="leads" '
                  'onclick="switchTab(\'leads\')">📧 Leads</button>\n')

# ---- 2. the panel --------------------------------------------------------
PANEL_ANCHOR = '  <!-- ═══ ANALYTICS ═══ -->\n'
assert src.count(PANEL_ANCHOR) == 1, 'panel anchor not found exactly once'

PANEL = '''  <!-- ═══ LEADS ═══ -->
  <div class="tab-panel" id="tab-leads" data-tab-panel="leads">

    <!-- Captured Emails -->
    <div class="card">
      <h2>📧 Captured Emails</h2>
      <p style="font-size:13px;color:var(--text3);margin-bottom:16px;line-height:1.6;">
        Everyone who gave an email to download a free asset — currently the
        <a href="/handbook/" target="_blank" rel="noopener">revision handbook</a> PDF.
        These are <strong>not</strong> paying students; nothing here grants any access.
        A repeat download updates the existing row rather than adding a second one, so
        <em>Times</em> counts how often the same person came back.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="loadLeads()">🔄 Refresh Leads</button>
        <button class="btn btn-ghost" onclick="downloadLeadsCsv()">Download CSV</button>
      </div>
      <div id="leads-table" style="margin-top:16px;"><div class="empty">Click "Refresh Leads" to load.</div></div>
    </div>

  </div>

'''
src = src.replace(PANEL_ANCHOR, PANEL + PANEL_ANCHOR)

# ---- 3. the loader -------------------------------------------------------
JS_ANCHOR = '// ─── Mock Attempts ───────────────────────────────────────────────────────────\n'
assert src.count(JS_ANCHOR) == 1, 'js anchor not found exactly once'

JS = '''// ─── Leads ───────────────────────────────────────────────────────────────────
let latestLeads = [];

function leadDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? '—' : d.toISOString().slice(0, 10);
}

async function loadLeads() {
  const { url, secret } = getConfig();
  const el = document.getElementById('leads-table');
  if (!url || !secret) { el.innerHTML = '<div class="empty">Set Worker URL and Admin Secret first.</div>'; return; }
  el.innerHTML = '<div class="empty">Loading leads…</div>';
  try {
    const res = await fetch(`${url}/admin/leads`, { headers: { 'X-Admin-Secret': secret } });
    const data = await res.json();
    if (data.error) { el.innerHTML = `<div class="empty">Error: ${data.error}</div>`; return; }

    latestLeads = data.leads || [];
    if (!latestLeads.length) {
      el.innerHTML = '<div class="empty">No leads captured yet. They appear here as soon as someone downloads the handbook PDF.</div>';
      return;
    }

    // last 7 days, and a count per source
    const weekAgo = Date.now() - 7 * 86400000;
    const recent = latestLeads.filter(l => new Date(l.firstSeen).getTime() >= weekAgo).length;
    const bySource = {};
    latestLeads.forEach(l => {
      Object.keys(l.sources || { [l.source || 'unknown']: 1 }).forEach(s => {
        bySource[s] = (bySource[s] || 0) + 1;
      });
    });
    const sourceBadges = Object.entries(bySource)
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `<span class="badge">${escapeHtml(s)}: ${n}</span>`)
      .join('');

    const rows = latestLeads.map(l => `<tr>
      <td style="font-family:var(--font-mono);">${escapeHtml(l.email)}</td>
      <td style="font-family:var(--font-mono);">${leadDate(l.firstSeen)}</td>
      <td style="font-family:var(--font-mono);">${leadDate(l.lastSeen)}</td>
      <td><span class="badge">${l.count || 1}</span></td>
      <td style="font-size:12px;color:var(--text3);">${escapeHtml(l.source || 'unknown')}</td>
    </tr>`).join('');

    el.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <span class="badge badge-ok">${latestLeads.length} total</span>
        <span class="badge badge-warn">${recent} in the last 7 days</span>
        ${sourceBadges}
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Email</th><th>First Seen</th><th>Last Seen</th><th>Times</th><th>Source</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  } catch (e) {
    el.innerHTML = `<div class="empty">Network error: ${e.message}</div>`;
  }
}

function downloadLeadsCsv() {
  if (!latestLeads.length) return alert('Load the leads first.');
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['email', 'first_seen', 'last_seen', 'times', 'source'].join(',')];
  latestLeads.forEach(l => lines.push([
    esc(l.email), esc(l.firstSeen), esc(l.lastSeen), esc(l.count || 1), esc(l.source || 'unknown'),
  ].join(',')));
  downloadBlob('leads.csv', lines.join('\\n'), 'text/csv');
}

'''
src = src.replace(JS_ANCHOR, JS + JS_ANCHOR)

open(PATH, 'w', encoding='utf-8').write(src)
print('patched cloudflare/admin.html — added the Leads tab')
