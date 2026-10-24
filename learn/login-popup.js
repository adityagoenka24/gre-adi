/* ============================================================
   GRE Quant Pro — shared login popup
   A lightweight modal wrapping the same email + fingerprint flow
   the practice logger (gre_practice_logger_pro.html) uses to sign
   in. Any element carrying [data-gqp-login] opens it on click
   instead of navigating away — used so "Log in" and "I already
   have Pro" on /learn/ pages don't dead-end at /pro/, which has
   no login form of its own (the logger is where sign-in actually
   happens).

   On success: the caller's onSuccess callback runs. The concept-
   note gate (learn/gate.js) uses this to re-check and unlock in
   place; a bare nav "Log in" click has no page-specific follow-up,
   so it sends the student to /pro/ instead.
   ============================================================ */
(function () {
  var WORKER = 'https://gre-auth.goenka-aditya-kol.workers.dev';
  var STORAGE_KEY = 'gre_pro_auth';

  var overlay = null;

  function injectStyles() {
    if (document.getElementById('gqp-login-style')) return;
    var style = document.createElement('style');
    style.id = 'gqp-login-style';
    style.textContent = [
      '#gqp-login-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(21,42,61,.5);padding:20px}',
      '#gqp-login-overlay .gqp-card{max-width:400px;width:100%;background:#fff;border-radius:16px;padding:34px 30px;box-shadow:0 20px 60px rgba(20,30,40,.25);position:relative;font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif}',
      '#gqp-login-overlay .gqp-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border:none;background:none;color:#7a8894;font-size:20px;cursor:pointer;border-radius:8px;line-height:1}',
      '#gqp-login-overlay .gqp-close:hover{background:#f3efe7;color:#16324f}',
      '#gqp-login-overlay .gqp-logo{font-family:"Fraunces",Georgia,serif;font-size:20px;font-weight:700;color:#16324f;text-align:center;margin-bottom:4px}',
      '#gqp-login-overlay .gqp-logo em{font-style:normal;color:#c65d21}',
      '#gqp-login-overlay .gqp-sub{text-align:center;font-size:13px;color:#7c8b99;margin-bottom:22px}',
      '#gqp-login-overlay .gqp-label{display:block;font-size:12.5px;font-weight:700;color:#46586a;margin-bottom:6px}',
      '#gqp-login-overlay .gqp-input{width:100%;padding:12px 14px;border:1.5px solid #d5ccbc;border-radius:9px;font-size:15px;margin-bottom:14px;font-family:inherit;box-sizing:border-box}',
      '#gqp-login-overlay .gqp-input:focus{outline:none;border-color:#1a5da6}',
      '#gqp-login-overlay .gqp-btn{width:100%;padding:13px;border:none;border-radius:9px;background:#c65d21;color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}',
      '#gqp-login-overlay .gqp-btn:hover{background:#a84e1b}',
      '#gqp-login-overlay .gqp-btn:disabled{opacity:.6;cursor:default}',
      '#gqp-login-overlay .gqp-error{background:#f9e9e6;color:#8a3223;border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:14px;display:none}',
      '#gqp-login-overlay .gqp-error.show{display:block}',
      '#gqp-login-overlay .gqp-status{text-align:center;font-size:12.5px;color:#7c8b99;margin-top:12px;min-height:16px}',
      '#gqp-login-overlay .gqp-footer{text-align:center;font-size:12.5px;color:#7c8b99;margin-top:16px;line-height:1.6}',
      '#gqp-login-overlay .gqp-footer a{color:#1a5da6;font-weight:600;text-decoration:none}',
    ].join('');
    document.head.appendChild(style);
  }

  function generateFingerprint() {
    var signals = [
      navigator.userAgent, navigator.language,
      screen.width + 'x' + screen.height, screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || '', navigator.platform || '',
    ];
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top'; ctx.font = '14px Arial';
      ctx.fillText('GRE-fp-2026', 2, 2);
      signals.push(canvas.toDataURL());
    } catch (e) { /* canvas blocked — skip */ }
    var raw = signals.join('||');
    var encoded = new TextEncoder().encode(raw);
    return crypto.subtle.digest('SHA-256', encoded).then(function (hashBuffer) {
      return Array.from(new Uint8Array(hashBuffer)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function saveAuth(email, fingerprint) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email, fingerprint: fingerprint, savedAt: Date.now() }));
  }

  function onKeydown(e) { if (e.key === 'Escape') close(); }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onKeydown);
  }

  function open(onSuccess) {
    injectStyles();
    if (overlay) close();

    overlay = document.createElement('div');
    overlay.id = 'gqp-login-overlay';
    overlay.innerHTML =
      '<div class="gqp-card">' +
        '<button class="gqp-close" aria-label="Close">&times;</button>' +
        '<div class="gqp-logo">GRE Quant <em>Pro</em></div>' +
        '<div class="gqp-sub">Log in with your registered email — no password needed</div>' +
        '<div class="gqp-error" id="gqp-error"></div>' +
        '<label class="gqp-label" for="gqp-email">Your registered email</label>' +
        '<input class="gqp-input" type="email" id="gqp-email" placeholder="you@example.com" autocomplete="email">' +
        '<button class="gqp-btn" id="gqp-submit">Log In</button>' +
        '<div class="gqp-status" id="gqp-status"></div>' +
        '<div class="gqp-footer">Not a Pro student yet? <a href="/pricing.html">See pricing &rarr;</a><br>Device issue? <a href="mailto:goenka.aditya.kol@gmail.com">Email Coach Aditya</a></div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);

    overlay.querySelector('.gqp-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    var emailInput = overlay.querySelector('#gqp-email');
    var btn = overlay.querySelector('#gqp-submit');
    var errorEl = overlay.querySelector('#gqp-error');
    var statusEl = overlay.querySelector('#gqp-status');
    emailInput.focus();

    function showError(msg) { errorEl.textContent = msg; errorEl.classList.add('show'); }
    function clearError() { errorEl.classList.remove('show'); }

    function submit() {
      var email = emailInput.value.trim().toLowerCase();
      if (!email || email.indexOf('@') === -1) { showError('Please enter a valid email address.'); return; }
      clearError();
      btn.disabled = true; btn.textContent = 'Checking…';
      statusEl.textContent = '';

      generateFingerprint().then(function (fp) {
        return fetch(WORKER + '/validate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, fingerprint: fp }),
        }).then(function (res) {
          if (!res.ok) throw new Error('server ' + res.status);
          return res.json();
        }).then(function (data) {
          if (data.status === 'ok') {
            var afterRegister = function () {
              saveAuth(email, fp);
              close();
              if (onSuccess) onSuccess();
            };
            if (data.needsRegister) {
              statusEl.textContent = 'Registering your device…';
              return fetch(WORKER + '/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, fingerprint: fp }),
              }).then(afterRegister);
            }
            afterRegister();
          } else if (data.status === 'revoked') {
            localStorage.removeItem(STORAGE_KEY);
            showError('Your Pro access has been revoked. Email Coach Aditya for help.');
          } else if (data.status === 'unknown_email') {
            showError('This email isn’t registered for Pro access.');
          } else if (data.status === 'device_limit') {
            showError('This account is already active on another device. Email Coach Aditya to reset it.');
          } else {
            showError('Unexpected error. Please try again.');
          }
        });
      }).catch(function () {
        showError('Could not reach the server. Check your connection and try again.');
      }).finally(function () {
        btn.disabled = false; btn.textContent = 'Log In';
      });
    }

    btn.addEventListener('click', submit);
    emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  window.GQPLogin = { open: open };

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-gqp-login]');
    if (!el) return;
    e.preventDefault();
    open(function () { location.href = '/pro/'; });
  });
})();
