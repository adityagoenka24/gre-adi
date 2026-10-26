/* ============================================================
   GRE Quant Pro — post-session error log (shared by the Pro pages)

   After a session, the student tags WHY each wrong or skipped question
   went wrong. This file holds everything the pages share:

     • the taxonomy (stable slugs + labels)
     • the review controller that renders the tag chips, keeps the gate
       state, and syncs to the Worker (/progress/error-log)
     • the "finish your log" modal for a session left unfinished
     • the analysis + panels used by My Progress and the Coach View

   Rules this follows:
   - A failed network call never traps a student. Tags are queued in
     localStorage and retried; an unreachable server or a Worker without
     the new tables means NO lock (the pending check fails open).
   - Slugs are stored, never labels, so wording can change later.
   - Loading this file changes nothing by itself. Pages opt in.
   ============================================================ */
(function () {
  'use strict';

  var WORKER_URL = window.GRE_WORKER_URL || 'https://gre-auth.goenka-aditya-kol.workers.dev';
  var TOKEN_KEY = 'gre_progress_token';
  var OUTBOX_KEY = 'gre_errlog_outbox';
  var MIN_FOR_PATTERNS = 10;      // logged mistakes before the insight panels open
  var NOTE_MAX = 300;

  // What went wrong (required) — keep labels that existed in the old optional
  // "Log Error" box so downloaded JSON keeps the same wording.
  var TYPES = [
    { slug: 'concept_gap',         label: 'Concept gap' },
    { slug: 'method_not_recalled', label: 'Method or formula not recalled' },
    { slug: 'misread',             label: 'Misread the question' },
    { slug: 'calculation_slip',    label: 'Calculation slip' },
    { slug: 'careless',            label: 'Careless (sign, unit, copying)' },
    { slug: 'fell_for_trap',       label: 'Fell for the trap' },
    { slug: 'diagram_misread',     label: 'Diagram or table misread' },
    { slug: 'no_start',            label: "Didn't know where to start" }
  ];
  // Why it happened (optional)
  var CAUSES = [
    { slug: 'rushed',         label: 'Rushed or ran out of time' },
    { slug: 'fatigue',        label: 'Fatigue' },
    { slug: 'changed_answer', label: 'Changed a correct answer' },
    { slug: 'guessed',        label: 'Guessed' },
    { slug: 'overthought',    label: 'Overthought' }
  ];
  // What each pattern should lead to — shown in the My Progress / Coach panels.
  var ACTIONS = {
    concept_gap:         'Relearn the concept, then drill the subtopic.',
    method_not_recalled: 'Re-read the concept note, write the method on one line, then drill.',
    misread:             'Slow-read drill: underline what is being asked before you touch the numbers.',
    calculation_slip:    'Write each step; re-do the arithmetic once before you lock the answer.',
    careless:            'Slow-down drill: check sign, unit and what was asked before you lock the answer.',
    fell_for_trap:       'Read the trap note on each miss, then drill the same question style.',
    diagram_misread:     'Redraw or re-read the figure or table first; label every given.',
    no_start:            'Study the worked solution, then retry the question cold tomorrow.'
  };

  function byslug(list) { var m = {}; list.forEach(function (x) { m[x.slug] = x; }); return m; }
  var TYPE_MAP = byslug(TYPES), CAUSE_MAP = byslug(CAUSES);
  function typeLabel(s) { return TYPE_MAP[s] ? TYPE_MAP[s].label : (s || ''); }
  function causeLabel(s) { return CAUSE_MAP[s] ? CAUSE_MAP[s].label : (s || ''); }

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtSecs(s) {
    s = Math.round(Number(s) || 0);
    return s >= 60 ? Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's' : s + 's';
  }
  function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }

  /* ---------- network (never throws) ---------- */
  function postJson(path, body) {
    return fetch(WORKER_URL + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, json: j }; }); })
      .catch(function () { return { ok: false, status: 0, json: {} }; });
  }
  function getJson(path) {
    return fetch(WORKER_URL + path).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, json: j }; });
    }).catch(function () { return { ok: false, status: 0, json: {} }; });
  }

  /* ---------- outbox: tags that have not reached the server yet ---------- */
  function readOutbox() {
    try { var a = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function writeOutbox(list) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-15))); } catch (e) { /* private mode: best effort */ }
  }
  function outboxPut(item) {
    var list = readOutbox().filter(function (x) { return x.ref !== item.ref; });
    list.push(item); writeOutbox(list);
  }
  function outboxDrop(ref) { writeOutbox(readOutbox().filter(function (x) { return x.ref !== ref; })); }

  /* ============================================================
     STYLES (self-contained, so every page looks the same)
     ============================================================ */
  var CSS = [
    '.gel-box{margin-top:12px;padding:12px 14px;border:1px solid #d9e1e8;border-left:4px solid #b3402e;border-radius:10px;background:#fbfcfd;font-family:inherit;color:#152a3d;text-align:left}',
    '.gel-box.gel-done{border-left-color:#1e7e46;background:#f4faf6}',
    '.gel-head{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin-bottom:6px}',
    '.gel-req{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b3402e;background:#f9e9e6;border-radius:999px;padding:2px 8px}',
    '.gel-ok{font-size:12px;font-weight:700;color:#1e7e46}',
    '.gel-hint{font-size:12.5px;color:#5c6b79;margin:0 0 8px}',
    '.gel-label{font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#5c6b79;margin:8px 0 5px}',
    '.gel-label span{font-weight:500;text-transform:none;letter-spacing:0;color:#8a97a3}',
    '.gel-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.gel-chip{appearance:none;border:1px solid #c9d2da;background:#fff;color:#27384a;border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;line-height:1.2;cursor:pointer;min-height:36px}',
    '.gel-chip:hover{border-color:#1a5da6}',
    '.gel-chip[aria-pressed="true"]{background:#1a5da6;border-color:#1a5da6;color:#fff;font-weight:600}',
    '.gel-causes .gel-chip{font-size:12.5px;padding:5px 10px;min-height:30px}',
    '.gel-causes .gel-chip[aria-pressed="true"]{background:#5c6b79;border-color:#5c6b79}',
    '.gel-notebtn{appearance:none;background:none;border:none;color:#1a5da6;font:inherit;font-size:12.5px;cursor:pointer;padding:6px 0 0}',
    '.gel-note{display:block;width:100%;margin-top:6px;border:1px solid #c9d2da;border-radius:8px;padding:8px 10px;font:inherit;font-size:13px;resize:vertical;min-height:54px;box-sizing:border-box}',
    '.gel-banner{margin:0 0 16px;padding:12px 16px;border-radius:10px;font-size:14px;font-weight:600;background:#f9e9e6;color:#8c2f20;border:1px solid #efc4bb}',
    '.gel-banner.gel-clear{background:#e5f2ea;color:#1a6338;border-color:#bfdfca}',
    '.gel-locked{opacity:.45;cursor:not-allowed !important;pointer-events:auto}',
    /* resume modal */
    '.gel-modal{position:fixed;inset:0;z-index:100000;background:rgba(15,30,45,.62);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 14px}',
    '.gel-modal-card{background:#fff;border-radius:14px;max-width:760px;width:100%;padding:24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.3);color:#152a3d}',
    '.gel-modal-card h2{margin:0 0 6px;font-size:20px}',
    '.gel-modal-card p{margin:0 0 14px;font-size:14px;color:#46586a;line-height:1.55}',
    '.gel-sess{margin:18px 0 6px;font-size:13px;font-weight:700;color:#16324f;text-transform:uppercase;letter-spacing:.04em}',
    '.gel-item{border:1px solid #e1e7ec;border-radius:10px;padding:12px 14px;margin-bottom:12px}',
    '.gel-item-top{font-size:13.5px;font-weight:700;margin-bottom:2px}',
    '.gel-item-meta{font-size:12.5px;color:#5c6b79}',
    '.gel-modal-foot{margin-top:14px;font-size:12.5px;color:#7c8b99}',
    '.gel-modal-foot a{color:#1a5da6}',
    /* panels (My Progress + Coach View) */
    '.gel-p{font-family:inherit;color:#152a3d}',
    '.gel-p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:16px}',
    '.gel-p-card{background:#fff;border:1px solid #e1e7ec;border-radius:12px;padding:18px 18px 12px}',
    '.gel-p-card h3{margin:0 0 12px;font-size:16px}',
    '.gel-p-row{display:block;width:100%;appearance:none;text-align:left;background:#fff;border:1px solid #e1e7ec;border-radius:10px;padding:9px 12px;margin-bottom:8px;cursor:pointer;font:inherit;color:inherit}',
    '.gel-p-row:hover{border-color:#1a5da6}',
    '.gel-p-row.gel-on{border-color:#1a5da6;background:#eef4fb}',
    '.gel-p-line{display:flex;justify-content:space-between;gap:10px;font-size:14px;margin-bottom:6px}',
    '.gel-p-line b{font-variant-numeric:tabular-nums}',
    '.gel-p-bar{height:7px;background:#eef1f4;border-radius:999px;overflow:hidden}',
    '.gel-p-bar i{display:block;height:100%;border-radius:999px;background:#7a3fe0}',
    '.gel-p-causes .gel-p-bar i{background:#e8940c}',
    '.gel-p-note{font-size:12.5px;color:#5c6b79;margin:0 0 12px}',
    '.gel-p-insight{font-size:14px;line-height:1.55;padding:10px 12px;border-radius:10px;background:#f7efdb;color:#5d4410;margin-bottom:8px}',
    '.gel-p-action{font-size:13.5px;line-height:1.5;margin:0 0 8px;padding:10px 12px;border-radius:10px;background:#eef4fb;color:#16324f}',
    '.gel-p-action a{color:#1a5da6;font-weight:700}',
    '.gel-p-locked{padding:18px;border:1px dashed #c9d2da;border-radius:12px;text-align:center;color:#5c6b79;font-size:14px}',
    '.gel-p-list{margin-top:6px}',
    '.gel-p-li{border:1px solid #e1e7ec;border-radius:10px;padding:10px 12px;margin-bottom:8px;font-size:13.5px}',
    '.gel-p-li small{display:block;color:#7c8b99;margin-top:2px}',
    '.gel-p-clear{appearance:none;background:none;border:none;color:#1a5da6;font:inherit;font-size:13px;cursor:pointer;padding:0 0 8px}',
    '@media (max-width:520px){.gel-chip{font-size:13px;padding:8px 11px}.gel-modal{padding:10px 8px}.gel-modal-card{padding:18px 14px}}'
  ].join('');
  var cssInjected = false;
  function injectCss() {
    if (cssInjected || typeof document === 'undefined') return;
    cssInjected = true;
    var s = document.createElement('style');
    s.setAttribute('data-gel', '1'); s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ============================================================
     REVIEW CONTROLLER
     ============================================================ */
  var registry = {}, seq = 0;

  function hintFor(m) {
    if (!m) return '';
    var t = Number(m.time) || 0;
    if (m.status === 'skipped') return 'You skipped this one. If you did not know where to start, say so; if you ran out of time, tag "Rushed" below.';
    if (t > 0 && t <= 40 && /easy|medium/i.test(m.difficulty || '')) return 'You answered this in ' + fmtSecs(t) + '. Fast misses are often a misread or a careless slip.';
    if (t >= 150) return 'You spent ' + fmtSecs(t) + ' here. A long struggle usually points to a concept or method gap.';
    return '';
  }

  /* opts: { blocking:true, onUpdate(progress) } */
  function Review(opts) {
    opts = opts || {};
    this.id = 'gel' + (++seq);
    this.ref = this.id + '-' + Date.now().toString(36);
    this.items = {};             // idx -> { meta, type, cause, note, dirty }
    this.order = [];
    this.sessionId = opts.sessionId || null;
    this.payload = null;
    this.blocking = opts.blocking !== false;
    this.onUpdate = opts.onUpdate || function () {};
    this.timer = null;
    this.flushing = false;
    registry[this.id] = this;
    injectCss();
  }

  /* Registers a question that must be tagged. Safe to call again for the same
     idx (keeps what the student already chose). */
  Review.prototype.require = function (idx, meta) {
    if (!this.items[idx]) { this.items[idx] = { meta: meta || {}, type: '', cause: '', note: '', dirty: false }; this.order.push(idx); }
    else if (meta) this.items[idx].meta = meta;
    return this;
  };

  Review.prototype.progress = function () {
    var total = this.order.length, done = 0, self = this;
    this.order.forEach(function (i) { if (self.items[i].type) done++; });
    return { done: done, total: total, complete: done === total };
  };

  Review.prototype.html = function (idx) {
    var it = this.items[idx];
    if (!it) return '';
    var done = !!it.type, h = hintFor(it.meta);
    // "gre-math" is the typesetter's own opt-out class: without it, GREMath.renderIn()
    // run over a review list reads "a / b" in a chip as a fraction.
    return '<div class="gel-box gre-math' + (done ? ' gel-done' : '') + '" data-gel-ctl="' + this.id + '" data-gel-idx="' + idx + '">' + this.inner(idx) + '</div>';
  };

  Review.prototype.inner = function (idx) {
    var it = this.items[idx], done = !!it.type, h = hintFor(it.meta);
    var out = '<div class="gel-head"><span>⚑ Log this mistake</span>' +
      (done ? '<span class="gel-ok">✓ Logged</span>' : '<span class="gel-req">Required</span>') + '</div>';
    if (h) out += '<p class="gel-hint">' + esc(h) + '</p>';
    out += '<div class="gel-label">What went wrong?</div><div class="gel-chips" role="group" aria-label="What went wrong">';
    TYPES.forEach(function (t) {
      out += '<button type="button" class="gel-chip" data-gel-type="' + t.slug + '" aria-pressed="' + (it.type === t.slug) + '">' + esc(t.label) + '</button>';
    });
    out += '</div><div class="gel-label">Why did it happen? <span>(optional)</span></div><div class="gel-chips gel-causes" role="group" aria-label="Why it happened">';
    CAUSES.forEach(function (c) {
      out += '<button type="button" class="gel-chip" data-gel-cause="' + c.slug + '" aria-pressed="' + (it.cause === c.slug) + '">' + esc(c.label) + '</button>';
    });
    out += '</div>';
    if (it.note || it.noteOpen) {
      out += '<textarea class="gel-note" data-gel-notetext maxlength="' + NOTE_MAX + '" rows="2" placeholder="e.g. Forgot to convert minutes to hours">' + esc(it.note) + '</textarea>';
    } else {
      out += '<button type="button" class="gel-notebtn" data-gel-note>＋ Add a note</button>';
    }
    return out;
  };

  Review.prototype.rerender = function (idx) {
    var self = this;
    var boxes = document.querySelectorAll('.gel-box[data-gel-ctl="' + this.id + '"][data-gel-idx="' + idx + '"]');
    Array.prototype.forEach.call(boxes, function (b) {
      b.innerHTML = self.inner(idx);
      b.classList.toggle('gel-done', !!self.items[idx].type);
    });
  };

  Review.prototype.banner = function () {
    return '<div class="gel-banner" data-gel-banner="' + this.id + '"></div>';
  };

  Review.prototype.refreshBanners = function () {
    var p = this.progress(), self = this;
    var els = document.querySelectorAll('.gel-banner[data-gel-banner="' + this.id + '"]');
    Array.prototype.forEach.call(els, function (el) {
      if (!p.total) { el.style.display = 'none'; return; }
      el.style.display = '';
      el.classList.toggle('gel-clear', p.complete);
      el.textContent = p.complete
        ? '✓ All mistakes logged. You can continue.'
        : '⚑ Tag why you missed each question below to continue (' + p.done + ' of ' + p.total + ' logged).';
    });
  };

  Review.prototype.changed = function () {
    this.refreshBanners();
    try { this.onUpdate(this.progress()); } catch (e) { /* page callback must not break tagging */ }
    this.schedule();
  };

  Review.prototype.setType = function (idx, slug) {
    var it = this.items[idx]; if (!it || !TYPE_MAP[slug]) return;
    it.type = slug; it.dirty = true; this.rerender(idx); this.changed();
  };
  Review.prototype.setCause = function (idx, slug) {
    var it = this.items[idx]; if (!it) return;
    it.cause = it.cause === slug ? '' : slug;           // toggles off on second tap
    it.dirty = true; this.rerender(idx); if (it.type) this.changed();
  };
  Review.prototype.setNote = function (idx, text) {
    var it = this.items[idx]; if (!it) return;
    it.note = String(text || '').slice(0, NOTE_MAX); it.dirty = true; if (it.type) this.changed();
  };

  Review.prototype.entries = function (onlyDirty) {
    var self = this, out = [];
    this.order.forEach(function (i) {
      var it = self.items[i];
      if (it.type && (!onlyDirty || it.dirty)) out.push({ q_index: i, error_type: it.type, error_cause: it.cause || '', note: it.note || '' });
    });
    return out;
  };

  /* Rows for the downloaded JSON: same keys the old optional log wrote
     (error_type as a readable label, note), plus the new cause. */
  Review.prototype.exportRows = function () {
    var self = this, out = [];
    this.order.forEach(function (i) {
      var it = self.items[i];
      if (it.type) out.push({ meta: it.meta, error_type: typeLabel(it.type), error_cause: causeLabel(it.cause), note: it.note || '' });
    });
    return out;
  };

  /* `idOrPromise` resolves to the server session id, or null if the save
     failed. `payload` is kept so a failed save can be retried later. */
  Review.prototype.attach = function (idOrPromise, payload) {
    var self = this; this.payload = payload || null;
    Promise.resolve(idOrPromise).then(function (id) {
      if (id) { self.sessionId = id; self.flush(); } else { self.persist(); }
    }).catch(function () { self.persist(); });
  };

  Review.prototype.persist = function () {
    var e = this.entries(false);
    if (!e.length && !this.payload) return;
    outboxPut({ ref: this.ref, sessionId: this.sessionId, payload: this.sessionId ? null : this.payload, entries: e, ts: Date.now() });
  };

  Review.prototype.schedule = function () {
    var self = this;
    if (!this.sessionId) { this.persist(); return; }    // keep it safe until the id arrives
    clearTimeout(this.timer);
    this.timer = setTimeout(function () { self.flush(); }, 350);
  };

  Review.prototype.flush = function () {
    var self = this;
    if (!this.sessionId || this.flushing) { if (this.flushing) this.again = true; return Promise.resolve(); }
    var entries = this.entries(true);
    if (!entries.length) return Promise.resolve();
    var t = token();
    if (!t) { this.persist(); return Promise.resolve(); }
    this.flushing = true;
    return postJson('/progress/error-log', { token: t, session_id: this.sessionId, entries: entries }).then(function (r) {
      self.flushing = false;
      if (r.ok) {
        entries.forEach(function (e) { var it = self.items[e.q_index]; if (it) it.dirty = false; });
        outboxDrop(self.ref);                            // the server has them now
      } else {
        self.persist();                                 // retried on the next load
      }
      if (self.again) { self.again = false; self.flush(); }
    });
  };

  /* ---------- gating helpers ---------- */
  function setLocked(els, locked, msg) {
    (els || []).forEach(function (el) {
      if (!el) return;
      el.disabled = !!locked;
      el.classList.toggle('gel-locked', !!locked);
      if (locked) { el.setAttribute('aria-disabled', 'true'); el.setAttribute('data-gel-title', el.title || ''); el.title = msg || 'Log your mistakes first'; }
      else { el.removeAttribute('aria-disabled'); if (el.hasAttribute('data-gel-title')) { el.title = el.getAttribute('data-gel-title'); el.removeAttribute('data-gel-title'); } }
    });
  }
  function isBlocking() {
    return Object.keys(registry).some(function (k) { var r = registry[k]; return r.blocking && r.order.length && !r.progress().complete; });
  }

  /* ---------- delegated events (one set for every box on the page) ---------- */
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var chip = e.target.closest && e.target.closest('.gel-chip');
      var noteBtn = e.target.closest && e.target.closest('[data-gel-note]');
      var box = e.target.closest && e.target.closest('.gel-box');
      if (!box || (!chip && !noteBtn)) return;
      var r = registry[box.getAttribute('data-gel-ctl')], idx = Number(box.getAttribute('data-gel-idx'));
      if (!r) return;
      if (chip && chip.hasAttribute('data-gel-type')) r.setType(idx, chip.getAttribute('data-gel-type'));
      else if (chip && chip.hasAttribute('data-gel-cause')) r.setCause(idx, chip.getAttribute('data-gel-cause'));
      else if (noteBtn) { r.items[idx].noteOpen = true; r.rerender(idx); var ta = box.querySelector('.gel-note'); if (ta) ta.focus(); }
    });
    document.addEventListener('input', function (e) {
      var ta = e.target;
      if (!ta || !ta.hasAttribute || !ta.hasAttribute('data-gel-notetext')) return;
      var box = ta.closest('.gel-box'); if (!box) return;
      var r = registry[box.getAttribute('data-gel-ctl')]; if (!r) return;
      r.setNote(Number(box.getAttribute('data-gel-idx')), ta.value);
    });
  }

  /* ============================================================
     RESUME — a session the student left without finishing
     ============================================================ */
  function flushOutbox() {
    var list = readOutbox(), t = token();
    if (!list.length || !t) return Promise.resolve();
    return list.reduce(function (chain, item) {
      return chain.then(function () {
        var idP = item.sessionId
          ? Promise.resolve(item.sessionId)
          : (item.payload
              ? postJson('/progress/save', { token: t, session: item.payload }).then(function (r) { return r.ok && r.json.session_ids ? r.json.session_ids[0] : null; })
              : Promise.resolve(null));
        return idP.then(function (sid) {
          if (!sid) return;
          if (!item.entries || !item.entries.length) { outboxDrop(item.ref); return; }
          return postJson('/progress/error-log', { token: t, session_id: sid, entries: item.entries }).then(function (r) {
            if (r.ok) { if (r.json && r.json.complete) outboxDrop(item.ref); else outboxPut({ ref: item.ref, sessionId: sid, payload: null, entries: item.entries, ts: item.ts }); }
            else if (r.status === 404 || r.status === 400) outboxDrop(item.ref);   // can never succeed: stop retrying
          });
        });
      });
    }, Promise.resolve());
  }

  var resuming = false;
  function resume(opts) {
    opts = opts || {};
    if (resuming || typeof document === 'undefined') return Promise.resolve(false);
    var t = token(); if (!t) return Promise.resolve(false);
    resuming = true;
    return flushOutbox().then(function () {
      return getJson('/progress/pending-log?token=' + encodeURIComponent(token()));
    }).then(function (r) {
      resuming = false;
      // Fails OPEN: any error, or a Worker without the tables, means no lock.
      if (!r.ok || !r.json || r.json.enabled !== true || !r.json.pending || !r.json.pending.length) return false;
      showResumeModal(r.json.pending, opts);
      return true;
    }).catch(function () { resuming = false; return false; });
  }

  function showResumeModal(pending, opts) {
    injectCss();
    var modal = document.createElement('div');
    modal.className = 'gel-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
    var reviews = [], html = '<div class="gel-modal-card"><h2>Finish your error log</h2>' +
      '<p>You left a session before tagging your mistakes. Tag each one to continue. It takes about a minute, and these tags are what power your mistake patterns.</p>' +
      '<div class="gel-banner" data-gel-banner="__resume__"></div>';
    pending.forEach(function (p) {
      var rv = new Review({ sessionId: p.session_id, blocking: true });
      reviews.push(rv);
      html += '<div class="gel-sess">' + esc(p.date || '') + ' · ' + esc(p.topic || 'Session') + (p.subtopic ? ' · ' + esc(p.subtopic) : '') + '</div>';
      (p.items || []).forEach(function (it) {
        rv.require(it.q_index, { status: it.status, time: it.time_taken, difficulty: it.difficulty, question_id: it.bank_question_id });
        html += '<div class="gel-item"><div class="gel-item-top">Q' + (it.q_index + 1) + ' · ' + esc(it.subtopic || it.topic || '') +
          (it.difficulty ? ' · ' + esc(it.difficulty) : '') + '</div><div class="gel-item-meta">' +
          (it.status === 'skipped' ? 'Skipped' : 'Wrong' + (it.your_answer ? ' · your answer: ' + esc(it.your_answer) : '')) +
          (it.time_taken ? ' · ' + fmtSecs(it.time_taken) : '') + (it.bank_question_id ? ' · ' + esc(it.bank_question_id) : '') +
          '</div>' + rv.html(it.q_index) + '</div>';
      });
    });
    html += '<div class="gel-modal-foot">Cannot complete this? <a href="mailto:goenka.aditya.kol@gmail.com?subject=Error%20log%20help">Email our coaching team</a> and we will clear it for you.</div></div>';
    modal.innerHTML = html;
    document.body.appendChild(modal);

    function refresh() {
      var done = 0, total = 0;
      reviews.forEach(function (rv) { var p = rv.progress(); done += p.done; total += p.total; });
      var b = modal.querySelector('[data-gel-banner="__resume__"]');
      b.classList.toggle('gel-clear', done === total);
      b.textContent = done === total ? '✓ All done. You can continue.' : '⚑ ' + done + ' of ' + total + ' mistakes logged.';
      if (done === total) {
        reviews.forEach(function (rv) { rv.flush(); });
        setTimeout(function () {
          modal.remove();
          reviews.forEach(function (rv) { delete registry[rv.id]; });
          if (opts.onDone) opts.onDone();
        }, 700);
      }
    }
    reviews.forEach(function (rv) { rv.onUpdate = refresh; });
    refresh();
  }

  /* ============================================================
     ANALYSIS + PANELS (My Progress and Coach View)
     ============================================================ */
  function isHard(d) { return /hard|extreme/i.test(String(d || '')); }
  function isEasy(d) { return /easy/i.test(String(d || '')); }

  /* questions: stored questions carrying error_type / error_cause (merged by
     the Worker). Each may also carry sessionDate. Returns counts only; no
     opinion is formed until MIN_FOR_PATTERNS mistakes are logged. */
  function analyse(questions, third) {
    var subj = third ? 'They' : 'You', yourSp = third ? 'they spent' : 'you spent';
    var tagged = (questions || []).filter(function (q) { return q && q.error_type; });
    var res = { logged: tagged.length, ready: tagged.length >= MIN_FOR_PATTERNS, min: MIN_FOR_PATTERNS,
      types: {}, causes: {}, bySub: {}, selfCheck: [], clusters: [], tagged: tagged };
    tagged.forEach(function (q) {
      res.types[q.error_type] = (res.types[q.error_type] || 0) + 1;
      if (q.error_cause) res.causes[q.error_cause] = (res.causes[q.error_cause] || 0) + 1;
      var sub = q.subtopic || q.topic || 'General';
      if (!res.bySub[sub]) res.bySub[sub] = { total: 0, types: {}, topic: q.topic || '' };
      res.bySub[sub].total++; res.bySub[sub].types[q.error_type] = (res.bySub[sub].types[q.error_type] || 0) + 1;
    });
    if (!res.ready) return res;

    // Cross-cut: where does each mistake type concentrate?
    Object.keys(res.types).forEach(function (ty) {
      var best = null;
      Object.keys(res.bySub).forEach(function (sub) {
        var n = res.bySub[sub].types[ty] || 0;
        if (n >= 3 && (!best || n > best.n)) best = { sub: sub, n: n, topic: res.bySub[sub].topic };
      });
      if (best && best.n / res.types[ty] >= 0.4) res.clusters.push({ type: ty, sub: best.sub, topic: best.topic, n: best.n, of: res.types[ty] });
    });
    res.clusters.sort(function (a, b) { return b.n - a.n; });

    // Self-diagnosis check: compare what they said with what we measured.
    var care = tagged.filter(function (q) { return q.error_type === 'careless' || q.error_type === 'calculation_slip'; });
    var careHard = care.filter(function (q) { return isHard(q.difficulty) && (Number(q.timeTaken) || 0) >= 150; });
    if (careHard.length >= 2) res.selfCheck.push(subj + ' tagged ' + care.length + ' mistakes careless or a calculation slip, but ' + careHard.length +
      ' of them were hard questions where ' + yourSp + ' over 2.5 minutes. That usually points to a method gap rather than carelessness.');
    var cg = tagged.filter(function (q) { return q.error_type === 'concept_gap'; });
    var cgFast = cg.filter(function (q) { return isEasy(q.difficulty) && (Number(q.timeTaken) || 0) > 0 && (Number(q.timeTaken) || 0) < 45; });
    if (cgFast.length >= 2) res.selfCheck.push(cgFast.length + ' of ' + (third ? 'their ' : 'your ') + cg.length + ' concept-gap mistakes were easy questions answered in under 45 seconds. Check whether you misread them before relearning the concept.');
    return res;
  }

  function barRows(map, labelFn, attr, active) {
    var keys = Object.keys(map).sort(function (a, b) { return map[b] - map[a]; });
    var max = keys.length ? map[keys[0]] : 1;
    return keys.map(function (k) {
      return '<button type="button" class="gel-p-row' + (active === k ? ' gel-on' : '') + '" ' + attr + '="' + esc(k) + '">' +
        '<div class="gel-p-line"><span>' + esc(labelFn(k)) + '</span><b>' + map[k] + '</b></div>' +
        '<div class="gel-p-bar"><i style="width:' + Math.max(6, Math.round(map[k] / max * 100)) + '%"></i></div></button>';
    }).join('');
  }

  /* Renders the panels into `el` and wires tap-to-filter.
     opts: { drillHref(topic, subtopic) -> url|'' , emptyText } */
  function mountPanels(el, questions, opts) {
    opts = opts || {}; injectCss();
    var a = analyse(questions, opts.third), state = { type: '', cause: '', sub: '' };

    function draw() {
      if (!a.logged) {
        el.innerHTML = '<div class="gel-p"><div class="gel-p-locked">' + esc(opts.emptyText || 'Your mistake patterns will appear here once you have logged your mistakes after a session.') + '</div></div>';
        return;
      }
      if (!a.ready) {
        el.innerHTML = '<div class="gel-p"><div class="gel-p-locked"><b>' + a.logged + ' of ' + a.min + ' mistakes logged.</b><br>Patterns open at ' + a.min +
          ' logged mistakes. With fewer, a single mistake looks like a trend.</div></div>';
        return;
      }
      var list = a.tagged.filter(function (q) {
        return (!state.type || q.error_type === state.type) && (!state.cause || q.error_cause === state.cause) &&
          (!state.sub || (q.subtopic || q.topic || 'General') === state.sub);
      });
      var subMap = {}; Object.keys(a.bySub).forEach(function (s) { subMap[s] = a.bySub[s].total; });
      var top = Object.keys(subMap).sort(function (x, y) { return subMap[y] - subMap[x]; }).slice(0, 6), subTop = {};
      top.forEach(function (s) { subTop[s] = subMap[s]; });

      var actions = '';
      a.clusters.slice(0, 3).forEach(function (c) {
        var href = opts.drillHref ? opts.drillHref(c.topic, c.sub) : '';
        actions += '<div class="gel-p-action"><b>' + esc(typeLabel(c.type)) + '</b> clusters in <b>' + esc(c.sub) + '</b> (' + c.n + ' of ' + c.of + '). ' +
          esc(ACTIONS[c.type] || '') + (href ? ' <a href="' + esc(href) + '">Drill ' + esc(c.sub) + ' →</a>' : '') + '</div>';
      });
      if (!actions) {
        var tk = Object.keys(a.types).sort(function (x, y) { return a.types[y] - a.types[x]; })[0];
        if (tk) actions = '<div class="gel-p-action">' + (opts.third ? 'Their' : 'Your') + ' most common mistake is <b>' + esc(typeLabel(tk)) + '</b>. ' + esc(ACTIONS[tk] || '') + '</div>';
      }
      var insights = a.selfCheck.map(function (s) { return '<div class="gel-p-insight">' + esc(s) + '</div>'; }).join('');

      el.innerHTML = '<div class="gel-p">' +
        '<div class="gel-p-grid">' +
          '<div class="gel-p-card"><h3>Most common mistakes</h3>' + barRows(a.types, typeLabel, 'data-gel-ftype', state.type) + '</div>' +
          '<div class="gel-p-card gel-p-causes"><h3>Why it happened</h3>' +
            (Object.keys(a.causes).length ? barRows(a.causes, causeLabel, 'data-gel-fcause', state.cause) : '<p class="gel-p-note">No causes logged yet. They are optional.</p>') + '</div>' +
          '<div class="gel-p-card"><h3>Where they happen</h3>' + barRows(subTop, function (s) { return s; }, 'data-gel-fsub', state.sub) + '</div>' +
        '</div>' + insights + actions +
        '<div class="gel-p-card"><h3>' + (opts.third ? 'Logged mistakes' : 'Your logged mistakes') + (list.length !== a.tagged.length ? ' (' + list.length + ' of ' + a.tagged.length + ')' : '') + '</h3>' +
          ((state.type || state.cause || state.sub) ? '<button type="button" class="gel-p-clear" data-gel-fclear>Clear filter</button>' : '<p class="gel-p-note">Tap any bar above to filter this list.</p>') +
          '<div class="gel-p-list">' + list.slice(0, 60).map(function (q) {
            return '<div class="gel-p-li"><b>' + esc(typeLabel(q.error_type)) + '</b>' + (q.error_cause ? ' · ' + esc(causeLabel(q.error_cause)) : '') +
              '<small>' + esc(q.sessionDate || '') + ' · ' + esc(q.subtopic || q.topic || '') + (q.difficulty ? ' · ' + esc(q.difficulty) : '') +
              (q.timeTaken ? ' · ' + fmtSecs(q.timeTaken) : '') + (q.bank_question_id ? ' · ' + esc(q.bank_question_id) : '') + '</small>' +
              (q.error_note ? '<small>“' + esc(q.error_note) + '”</small>' : '') + '</div>';
          }).join('') + (list.length > 60 ? '<p class="gel-p-note">Showing the 60 most recent of ' + list.length + '.</p>' : '') + '</div></div></div>';
    }

    el.onclick = function (e) {
      var t = e.target.closest ? e.target.closest('[data-gel-ftype],[data-gel-fcause],[data-gel-fsub],[data-gel-fclear]') : null;
      if (!t) return;
      if (t.hasAttribute('data-gel-fclear')) state = { type: '', cause: '', sub: '' };
      else if (t.hasAttribute('data-gel-ftype')) { var v = t.getAttribute('data-gel-ftype'); state.type = state.type === v ? '' : v; }
      else if (t.hasAttribute('data-gel-fcause')) { var c = t.getAttribute('data-gel-fcause'); state.cause = state.cause === c ? '' : c; }
      else if (t.hasAttribute('data-gel-fsub')) { var s = t.getAttribute('data-gel-fsub'); state.sub = state.sub === s ? '' : s; }
      draw();
    };
    draw();
    return a;
  }

  window.GREErrorLog = {
    TYPES: TYPES, CAUSES: CAUSES, ACTIONS: ACTIONS, MIN_FOR_PATTERNS: MIN_FOR_PATTERNS,
    typeLabel: typeLabel, causeLabel: causeLabel,
    review: function (opts) { return new Review(opts); },
    setLocked: setLocked, isBlocking: isBlocking,
    resume: resume, flushOutbox: flushOutbox,
    analyse: analyse, mountPanels: mountPanels,
    _registry: registry
  };

  // Pages unlock after the Pro gate validates the student; retry the outbox and
  // check for an unfinished session then. A page that already knows it is
  // unlocked (the practice logger) calls GREErrorLog.resume() itself.
  if (typeof document !== 'undefined') {
    document.addEventListener('gre:pro-unlocked', function () { resume(); });
  }
})();
