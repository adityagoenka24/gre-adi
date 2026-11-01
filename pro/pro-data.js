/* ============================================================
   GRE Quant Pro — loads the paid question files.

   The Pro bank and the Pro mocks are no longer published on the website.
   They live behind the Worker (POST /pro-data), which checks that the
   student is current, is on a device that is already registered, and that
   their plan covers the file. This script is the one place the Pro pages
   ask for them:

     const res = await greProFetch('bank/index.json');
     if (!res.ok) throw new Error(greProMessage(res.status));
     const data = await res.json();

   greProFetch(path) takes the same path the page used to fetch (relative to
   /pro/) and resolves to an ordinary Response, so callers keep their
   existing res.ok / res.json() code.

   - Files are kept in memory for the page, and in the browser's Cache Storage
     for a few hours, so a student does not re-download a file on every visit
     (and the Worker's free KV reads are barely touched). After you upload a
     changed file, students see it within CACHE_TTL.
   - A 401 / 403 / 429 from the Worker is passed straight through. A 404 or a
     server error falls back to the old static file, which only matters while
     the files have not been taken off the website yet; afterwards that
     fallback simply 404s too.
   - Include with a plain <script src="pro-data.js"></script>, after pro-gate.js.
   ============================================================ */
(function () {
  var WORKER_URL = 'https://gre-auth.goenka-aditya-kol.workers.dev';
  var AUTH_KEY = 'gre_pro_auth';
  var CACHE_NAME = 'gre-pro-data-v1';
  var CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // 6 hours

  var mem = {};          // path -> Promise<{status, text}>
  var fpPromise = null;

  function auth() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') || {}; }
    catch (e) { return {}; }
  }

  /* Same algorithm as pro-gate.js and the practice logger. Only used when the
     stored login carries no fingerprint (the logger saves the registered one). */
  function computeFingerprint() {
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
    var encoded = new TextEncoder().encode(signals.join('||'));
    return crypto.subtle.digest('SHA-256', encoded).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function fingerprint() {
    var a = auth();
    if (a.fingerprint) return Promise.resolve(a.fingerprint);
    if (!fpPromise) fpPromise = computeFingerprint();
    return fpPromise;
  }

  // ---------- Cache Storage (best effort; never required) ----------
  function cacheUrl(path) {
    return location.origin + '/__pro-data/' + encodeURIComponent(auth().email || '') + '/' + encodeURI(path);
  }
  function cacheGet(path) {
    if (!window.caches) return Promise.resolve(null);
    return caches.open(CACHE_NAME).then(function (c) {
      return c.match(cacheUrl(path)).then(function (r) {
        if (!r) return null;
        var at = parseInt(r.headers.get('x-cached-at') || '0', 10);
        if (!at || Date.now() - at > CACHE_TTL_MS) return null;
        return r.text();
      });
    }).catch(function () { return null; });
  }
  function cachePut(path, text) {
    if (!window.caches) return;
    caches.open(CACHE_NAME).then(function (c) {
      return c.put(cacheUrl(path), new Response(text, {
        headers: { 'Content-Type': 'application/json', 'x-cached-at': String(Date.now()) },
      }));
    }).catch(function () { /* quota or private mode: fine */ });
  }

  // ---------- network ----------
  function staticFallback(path) {
    return fetch(path).then(function (r) {
      return r.ok ? r.text().then(function (t) { return { status: 200, text: t }; })
                  : { status: r.status, text: '' };
    }).catch(function () { return { status: 503, text: '' }; });
  }

  function fromWorker(path) {
    var a = auth();
    if (!a.email) return Promise.resolve({ status: 401, text: '' });
    return fingerprint().then(function (fp) {
      return fetch(WORKER_URL + '/pro-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: a.email, fingerprint: fp, path: path }),
      });
    }).then(function (res) {
      if (res.status === 200) {
        return res.text().then(function (t) { cachePut(path, t); return { status: 200, text: t }; });
      }
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        return { status: res.status, text: '' };
      }
      return staticFallback(path);               // 404 (not uploaded yet / older Worker) or 5xx
    }).catch(function () { return staticFallback(path); });
  }

  function load(path) {
    if (mem[path]) return mem[path];
    var p = cacheGet(path).then(function (hit) {
      return hit != null ? { status: 200, text: hit } : fromWorker(path);
    });
    mem[path] = p;
    p.then(function (r) { if (r.status !== 200) delete mem[path]; },
           function () { delete mem[path]; });
    return p;
  }

  window.greProFetch = function (path) {
    return load(path).then(function (r) {
      return new Response(r.status === 200 ? r.text : '', {
        status: r.status,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  };

  /* A sentence a student can act on, for the page's own error box or toast. */
  window.greProMessage = function (status) {
    if (status === 401) return 'Please log in again from the Practice app — this device is not registered to your account.';
    if (status === 403) return 'This is not part of your plan. Email our coaching team to add it.';
    if (status === 429) return 'Too many files loaded today. Please try again tomorrow.';
    if (status === 404) return 'This file is not available right now. Please try again shortly.';
    return 'Could not load this file (error ' + status + '). Check your connection and try again.';
  };
})();
