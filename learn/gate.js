/* ============================================================
   GRE Quant Pro — concept-note Pro gate
   Reuses the same credentials the Pro app stores, so a student who
   is logged in there is logged in here with no second sign-in.

   HONEST ABOUT WHAT THIS IS: a soft gate. The site is static, so
   nothing here can be enforced — the same is already true of the Pro
   question bank, whose JSON is publicly fetchable. What this does buy:
   the locked body is not in the page source, so it is not in Google's
   index and not one Ctrl-U away.

   Real enforcement would mean serving the body from the Worker, which
   already holds the KV and the /validate endpoint. See
   HANDOFF_2026-09-19.md §2.3.
   ============================================================ */

(function () {
  var WORKER = 'https://gre-auth.goenka-aditya-kol.workers.dev';
  var STORAGE_KEY = 'gre_pro_auth';           // written by the Pro app
  var slug = document.currentScript && document.currentScript.dataset.slug;
  var gate = document.getElementById('lrnGate');
  var body = document.getElementById('lrnBody');
  if (!gate || !body || !slug) return;

  function stored() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch (e) { return null; }
  }

  function unlock() {
    fetch('/learn/_body/' + slug + '.html', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (html) {
        body.insertAdjacentHTML('beforeend', html);
        gate.remove();
        // The unlocked continuation is plain-ASCII math like the free half
        // above it (see gre-math.js) — it just arrived after the page's own
        // load-time typeset pass already ran, so run it again on what we
        // just inserted.
        if (window.GREMath) window.GREMath.renderIn(body);
        if (window.GQP && window.GQP.track) window.GQP.track('learn_unlocked', { slug: slug });
      })
      .catch(function () {
        gate.classList.remove('is-checking');
        gate.querySelector('h2').textContent = 'Could not load the rest of this note';
        gate.querySelector('p').textContent =
          'Your Pro access is fine — the content just failed to load. Please refresh.';
      });
  }

  var auth = stored();
  if (!auth || !auth.email || !auth.fingerprint) return;   // show the gate

  gate.classList.add('is-checking');
  fetch(WORKER + '/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: auth.email, fingerprint: auth.fingerprint }),
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && d.status === 'ok') unlock();
      else { gate.classList.remove('is-checking'); }
    })
    .catch(function () { gate.classList.remove('is-checking'); });

  var btn = document.getElementById('lrnLogin');
  if (btn) btn.addEventListener('click', function () {
    // The Pro app owns sign-in; come back here once it has run.
    sessionStorage.setItem('gqp_return_to', location.pathname);
    location.href = '/pro';
  });
})();
