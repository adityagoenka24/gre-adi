/* ============================================================
   GRE Quant Pro — shared Pro-content gate for pages that aren't
   the practice logger itself (full_mock.html, sectional.html).

   The practice logger (gre_practice_logger_pro.html) is where a
   student actually logs in — it has the full email-entry form and
   device registration flow. This script does the LIGHTER check
   every other Pro page needs: is there already a validated session
   in localStorage? If not (or if the Worker says no), show a lock
   screen and send them to the practice logger to log in. Uses the
   exact same fingerprint algorithm, storage key, and Worker calls
   as the logger, so a session started there is honoured here with
   no second login.

   Include with a single, un-deferred <script> tag right after
   <body> opens, so the lock overlay paints before any page content
   is visible:
     <script src="pro-gate.js"></script>
   ============================================================ */

(function () {
  var WORKER_URL = 'https://gre-auth.goenka-aditya-kol.workers.dev';
  var STORAGE_KEY = 'gre_pro_auth';
  var LOGIN_PAGE = 'gre_practice_logger_pro.html';

  // ---------- overlay, built and inserted before anything else paints ----------
  var style = document.createElement('style');
  style.textContent = [
    '#pro-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;',
    'justify-content:center;background:#eef1f4;padding:24px}',
    '#pro-gate .pg-card{max-width:420px;width:100%;background:#fff;border:1px solid #c9d2da;',
    'border-radius:14px;padding:36px 30px;text-align:center;box-shadow:0 10px 30px rgba(20,30,40,.08)}',
    '#pro-gate .pg-lock{width:46px;height:46px;margin:0 auto 16px;border-radius:50%;',
    'background:#eaf1f8;color:#1a5da6;display:flex;align-items:center;justify-content:center}',
    '#pro-gate h2{margin:0 0 10px;font-size:20px;font-family:Georgia,serif;color:#16324f}',
    '#pro-gate p{margin:0 0 22px;font-size:14.5px;line-height:1.6;color:#4a5560}',
    '#pro-gate .pg-btn{display:inline-block;padding:12px 22px;border-radius:9px;background:#1a5da6;',
    'color:#fff;text-decoration:none;font-weight:700;font-size:14.5px}',
    '#pro-gate .pg-btn:hover{background:#144a86}',
    '#pro-gate .pg-status{margin-top:16px;font-size:13px;color:#7a8894}',
  ].join('');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'pro-gate';
  overlay.innerHTML =
    '<div class="pg-card">' +
      '<div class="pg-lock" aria-hidden="true">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
        '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
      '</div>' +
      '<h2 id="pg-title">Checking your Pro access&hellip;</h2>' +
      '<p id="pg-msg">One moment.</p>' +
      '<a class="pg-btn" id="pg-btn" href="' + LOGIN_PAGE + '">Log in via the Practice app</a>' +
      '<div class="pg-status" id="pg-status"></div>' +
    '</div>';
  // Insert as early as possible — right at the top of <body>.
  document.body.insertBefore(overlay, document.body.firstChild);

  function setMessage(title, msg, showBtn, status) {
    document.getElementById('pg-title').textContent = title;
    document.getElementById('pg-msg').textContent = msg;
    document.getElementById('pg-btn').style.display = showBtn ? 'inline-block' : 'none';
    document.getElementById('pg-status').textContent = status || '';
  }

  function unlock() {
    overlay.remove();
  }

  function showLocked() {
    setMessage(
      'This page is part of GRE Quant Pro',
      'Log in with your registered email in the practice app — no password needed — then come back here.',
      true
    );
  }

  // ---------- same fingerprint algorithm as the practice logger ----------
  function generateFingerprint() {
    var signals = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || '',
      navigator.platform || '',
    ];
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('GRE-fp-2026', 2, 2);
      signals.push(canvas.toDataURL());
    } catch (e) { /* canvas blocked — skip */ }

    var raw = signals.join('||');
    var encoded = new TextEncoder().encode(raw);
    return crypto.subtle.digest('SHA-256', encoded).then(function (hashBuffer) {
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function getStoredAuth() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch (e) { return null; }
  }

  // ---------- init ----------
  var stored = getStoredAuth();
  if (!stored || !stored.email) {
    showLocked();
    return;
  }

  setMessage('Checking your Pro access…', 'One moment.', false);
  generateFingerprint().then(function (fp) {
    return fetch(WORKER_URL + '/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: stored.email, fingerprint: fp }),
    });
  }).then(function (res) {
    if (!res.ok) throw new Error('server ' + res.status);
    return res.json();
  }).then(function (data) {
    if (data && data.status === 'ok') {
      unlock();
    } else if (data && data.status === 'revoked') {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      setMessage(
        'Your Pro access was revoked',
        'Please contact Coach Aditya at goenka.aditya.kol@gmail.com for assistance.',
        true
      );
    } else if (data && data.status === 'device_limit') {
      setMessage(
        'This account is active on another device',
        'To reset your device access, email Coach Aditya at goenka.aditya.kol@gmail.com',
        true
      );
    } else {
      showLocked();
    }
  }).catch(function () {
    // Network hiccup or the Worker is unreachable — fail closed, not open.
    setMessage(
      'Could not verify your Pro access',
      'Your login may still be fine — this just couldn’t reach the server. Please refresh, or log in again below.',
      true
    );
  });
})();
