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
    misread:             'Slow-read drill: underline what is being asked before touching the numbers.',
    calculation_slip:    'Write every step, and re-do the arithmetic once before locking the answer.',
    careless:            'Slow-down drill: check sign, unit and what was asked before locking the answer.',
    fell_for_trap:       'Read the trap note on each miss, then drill the same question style.',
    diagram_misread:     'Redraw or re-read the figure or table first; label every given.',
    no_start:            'Study the worked solution, then retry the question cold tomorrow.'
  };

  /* The three families every mistake type belongs to. This is the cut that
     changes what a student should actually do next: more studying, a reading
     routine, or a checking routine. Order is deliberate — knowledge first,
     because it is the slowest to fix. */
  var FAMILY_ORDER = ['knowledge', 'reading', 'execution'];
  var FAMILY_OF = {
    concept_gap: 'knowledge', method_not_recalled: 'knowledge', no_start: 'knowledge',
    misread: 'reading', diagram_misread: 'reading', fell_for_trap: 'reading',
    calculation_slip: 'execution', careless: 'execution'
  };
  var FAMILY_META = {
    knowledge: {
      label: 'Knowledge gaps', color: '#2f5597', meaning: 'needs studying',
      verdict: function () { return 'The fix is study, not test technique: learn the method cold, then drill the subtopic.'; }
    },
    reading: {
      label: 'Reading and setup', color: '#b0761a', meaning: 'needs a reading routine',
      verdict: function () { return 'The maths is not the problem. The fix is a fixed reading routine before any arithmetic starts.'; }
    },
    execution: {
      label: 'Execution', color: '#c0392b', meaning: 'needs a checking routine',
      verdict: function () { return 'The method is there and it breaks on the way to the answer. A checking routine will move the score faster than more theory.'; }
    }
  };
  var TYPE_COLOR = {
    concept_gap: '#1f3a68', method_not_recalled: '#2f5597', no_start: '#6487c4',
    misread: '#8f5e05', diagram_misread: '#b0761a', fell_for_trap: '#cfa03c',
    calculation_slip: '#a8321f', careless: '#d4694a'
  };
  function typeColor(s) { return TYPE_COLOR[s] || '#6b7a88'; }

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
    /* ── analytics dashboard ──────────────────────────────────────────────
       Colours come from the host page's own tokens where they exist, so this
       reads as part of the practice logger and as part of Coach View without
       either needing to know about the other. */
    '.gel-p{font-family:inherit;color:var(--text,#152a3d);display:grid;gap:14px}',
    '.gel-p *{box-sizing:border-box}',
    '.gel-p-card{background:var(--surface,#fff);border:1px solid var(--border,#e1e7ec);border-radius:12px;padding:18px}',
    '.gel-p-card h3{margin:0;font-size:15px;font-weight:700;letter-spacing:-.01em;color:var(--text,#152a3d)}',
    '.gel-p-head{margin-bottom:14px}',
    '.gel-p-head p{margin:5px 0 0;font-size:12.5px;line-height:1.5;color:var(--text3,#7c8b99);max-width:62ch}',
    '.gel-p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:14px}',
    /* headline strip */
    '.gel-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}',
    '.gel-stat{background:var(--surface,#fff);border:1px solid var(--border,#e1e7ec);border-left:3px solid var(--gel-accent,#1a5da6);border-radius:10px;padding:13px 15px}',
    '.gel-stat b{display:block;font-size:24px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--gel-accent,#16324f)}',
    '.gel-stat span{display:block;margin-top:4px;font-size:11.5px;line-height:1.4;color:var(--text3,#7c8b99)}',
    '.gel-stat-warn{--gel-accent:#b06000}.gel-stat-ok{--gel-accent:#1e7e46}',
    '.gel-stat-down{--gel-accent:#1e7e46}.gel-stat-up{--gel-accent:#c0392b}.gel-stat-flat{--gel-accent:#7c8b99}',
    /* family split */
    '.gel-fam-bar{display:flex;height:14px;border-radius:999px;overflow:hidden;background:var(--surface2,#f1f4f7)}',
    '.gel-fam-bar i{display:block;height:100%}',
    '.gel-fam-key{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:14px}',
    '.gel-fam-k{font-size:12.5px;line-height:1.45;color:var(--text2,#46586a);padding-left:16px;position:relative}',
    '.gel-fam-k span{position:absolute;left:0;top:4px;width:9px;height:9px;border-radius:2px}',
    '.gel-fam-k b{color:var(--text,#152a3d);font-weight:700}',
    '.gel-fam-k em{display:block;font-style:normal;color:var(--text3,#7c8b99);font-size:11.5px;margin-top:1px}',
    /* bar rows */
    '.gel-p-row{display:block;width:100%;appearance:none;text-align:left;background:none;border:none;border-radius:8px;padding:7px 8px;margin-bottom:2px;cursor:pointer;font:inherit;color:inherit;transition:background .12s}',
    '.gel-p-row:hover{background:var(--surface2,#f3f6f9)}',
    '.gel-p-row.gel-on{background:var(--surface2,#eef4fb);box-shadow:inset 0 0 0 1px var(--accent,#1a5da6)}',
    '.gel-p-line{display:flex;justify-content:space-between;gap:10px;align-items:baseline;font-size:13px;margin-bottom:5px}',
    '.gel-p-line b{font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.gel-p-line i{font-style:normal;font-weight:400;color:var(--text3,#7c8b99);font-size:11px;margin-left:5px}',
    '.gel-p-bar{height:6px;background:var(--surface2,#eef1f4);border-radius:999px;overflow:hidden}',
    '.gel-p-bar i{display:block;height:100%;border-radius:999px}',
    /* insights */
    '.gel-p-note{font-size:12.5px;line-height:1.5;color:var(--text3,#7c8b99);margin:0 0 10px}',
    '.gel-p-insight{font-size:13.5px;line-height:1.55;padding:11px 13px;border-radius:9px;margin-bottom:8px;border-left:3px solid}',
    '.gel-p-insight:last-child{margin-bottom:0}',
    '.gel-i-warn{background:#fdf6e6;border-color:#b06000;color:#5d4410}',
    '.gel-i-info{background:#eef4fb;border-color:#1a5da6;color:#16324f}',
    '.gel-i-key{background:#f3eee8;border-color:#8a5a2b;color:#4a3420;font-weight:600}',
    /* plan */
    '.gel-plan{list-style:none;margin:0;padding:0;counter-reset:gp}',
    '.gel-plan li{display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--border,#e9edf1)}',
    '.gel-plan li:first-child{border-top:none;padding-top:2px}',
    '.gel-plan-n{flex:0 0 22px;height:22px;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}',
    '.gel-plan b{display:block;font-size:13.5px;line-height:1.5;font-weight:600;color:var(--text,#152a3d)}',
    '.gel-plan span{display:block;font-size:12.5px;line-height:1.45;color:var(--text3,#7c8b99);margin-top:3px}',
    '.gel-plan a{display:inline-block;margin-top:5px;font-size:12.5px;font-weight:700;color:var(--accent,#1a5da6);text-decoration:none}',
    /* matrix */
    '.gel-mx-wrap{overflow-x:auto;margin:0 -4px;padding:0 4px}',
    'table.gel-mx{border-collapse:separate;border-spacing:3px;font-size:12px;width:max-content;max-width:100%;margin:0}',
    /* the host pages style their own tables; none of that applies here */
    '.gel-mx th,.gel-mx td{border:none;background:none;text-transform:none;letter-spacing:normal}',
    '.gel-mx th{font-weight:600;color:var(--text3,#7c8b99);font-size:10.5px;text-align:center;padding:2px;white-space:nowrap;line-height:1.3}',
    '.gel-mx th span{display:block;width:26px;height:3px;border-radius:2px;margin:0 auto 5px}',
    '.gel-mx th[scope=row]{text-align:left;color:var(--text2,#46586a);font-size:12px;padding-right:10px;width:auto;max-width:170px;white-space:normal}',
    '.gel-mx td{text-align:center;padding:0}',
    '.gel-mx-c{appearance:none;border:none;width:100%;min-width:46px;padding:8px 6px;border-radius:5px;font:inherit;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;cursor:pointer}',
    '.gel-mx-c:hover{outline:2px solid var(--accent,#1a5da6);outline-offset:-2px}',
    '.gel-mx-c.gel-on{outline:2px solid var(--text,#16324f);outline-offset:-2px}',
    '.gel-mx-0{color:#cfd7de;font-size:13px}',
    '.gel-mx-tot{color:var(--text3,#7c8b99);font-variant-numeric:tabular-nums;padding-left:6px;font-size:11.5px}',
    /* session trend */
    '.gel-trend{margin:0 auto}',
    '.gel-trend-svg{display:block;width:100%;height:112px}',
    '.gel-trend-labels{display:grid;gap:2.2%;margin-top:6px}',
    '.gel-tl{text-align:center;font-size:10.5px;line-height:1.35;color:var(--text3,#7c8b99);min-width:0}',
    '.gel-tl b{display:inline;font-size:12px;color:var(--text,#152a3d);font-variant-numeric:tabular-nums}',
    '.gel-tl em{display:block;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    /* time signature */
    '.gel-ts-row{display:grid;grid-template-columns:minmax(80px,1.1fr) 2fr auto;gap:10px;align-items:center;margin-bottom:7px}',
    '.gel-ts-l{font-size:12.5px;color:var(--text2,#46586a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.gel-ts-track{position:relative;height:16px;background:var(--surface2,#f3f6f9);border-radius:4px}',
    '.gel-ts-track i{position:absolute;top:3px;height:10px;border-radius:2px;min-width:2px}',
    '.gel-ts-track u{position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:var(--text3,#9aa6b1)}',
    '.gel-ts-v{font-size:11.5px;color:var(--text3,#7c8b99);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.gel-ts-key{margin:10px 0 0}',
    /* logged list */
    '.gel-p-filter{font-size:12.5px;color:var(--text2,#46586a);margin-bottom:10px}',
    '.gel-p-filter b{font-variant-numeric:tabular-nums}',
    '.gel-p-list{display:grid;gap:6px}',
    '.gel-p-li{display:flex;gap:9px;align-items:flex-start;border:1px solid var(--border,#e9edf1);border-radius:9px;padding:9px 11px;font-size:13px}',
    '.gel-p-dot{flex:0 0 7px;height:7px;border-radius:50%;margin-top:5px}',
    '.gel-p-li b{font-weight:600}',
    '.gel-p-li em{font-style:normal;color:var(--text2,#46586a)}',
    '.gel-p-li small{display:block;color:var(--text3,#7c8b99);margin-top:2px;font-size:11.5px}',
    '.gel-p-quote{font-style:italic}',
    '.gel-p-clear{appearance:none;background:none;border:none;color:var(--accent,#1a5da6);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;padding:0 0 0 4px}',
    /* empty + threshold */
    '.gel-p-locked{padding:20px;border:1px dashed var(--border,#c9d2da);border-radius:12px;text-align:center;color:var(--text2,#5c6b79);font-size:13.5px;line-height:1.6}',
    '.gel-p-progress{height:5px;max-width:260px;margin:12px auto 0;background:var(--surface2,#eef1f4);border-radius:999px;overflow:hidden}',
    '.gel-p-progress i{display:block;height:100%;background:var(--accent,#1a5da6);border-radius:999px}',
    /* phone: the label matters more than the single-line row, so stack it */
    '@media (max-width:560px){',
    '.gel-p-card{padding:15px}',
    '.gel-ts-row{grid-template-columns:1fr auto;grid-template-areas:"l l" "t v";row-gap:4px;margin-bottom:11px}',
    '.gel-ts-l{grid-area:l;white-space:normal;overflow:visible;text-overflow:clip}',
    '.gel-ts-track{grid-area:t}.gel-ts-v{grid-area:v}',
    '.gel-stat b{font-size:21px}',
    '}',
    '@media print{.gel-p-card{break-inside:avoid;page-break-inside:avoid}}',
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
     ANALYSIS + PANELS (student My Progress, and Coach View)

     One renderer, two audiences. `opts.third` switches the wording from
     "you" to "they"; everything else is identical, so a coach and a student
     are always looking at the same numbers computed the same way.
     ============================================================ */
  function isHard(d) { return /hard|extreme/i.test(String(d || '')); }
  function isEasy(d) { return /easy/i.test(String(d || '')); }
  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  /* A mistake is any question not answered correctly: wrong, skipped or
     unmarked. Same rule the gate uses, so the counts agree. */
  function isMistake(q) { return q && q.correct !== true; }

  /* questions: stored questions carrying error_type / error_cause (merged by
     the Worker). Each may also carry sessionDate / sessionType. Returns counts
     only; no opinion is formed until MIN_FOR_PATTERNS mistakes are logged. */
  function analyse(questions, third) {
    var all = (questions || []).filter(Boolean);
    var subj = third ? 'They' : 'You', subjLower = third ? 'they' : 'you';
    var poss = third ? 'their' : 'your', possCap = third ? 'Their' : 'Your';
    var obj = third ? 'them' : 'you';
    var tagged = all.filter(function (q) { return q.error_type; });
    var mistakes = all.filter(isMistake);
    var res = {
      logged: tagged.length, ready: tagged.length >= MIN_FOR_PATTERNS, min: MIN_FOR_PATTERNS,
      questions: all.length, mistakes: mistakes.length, untagged: Math.max(0, mistakes.length - tagged.length),
      types: {}, causes: {}, bySub: {}, families: {}, sessions: [],
      selfCheck: [], clusters: [], plan: [], timeSig: [], tagged: tagged,
      avgAll: 0, topFamily: null, trend: null,
      words: { subj: subj, subjLower: subjLower, poss: poss, possCap: possCap, obj: obj, third: !!third }
    };

    var timed = all.filter(function (q) { return (Number(q.timeTaken) || 0) > 0; });
    res.avgAll = timed.length
      ? Math.round(timed.reduce(function (a, q) { return a + Number(q.timeTaken); }, 0) / timed.length)
      : 0;

    var sessMap = {};
    tagged.forEach(function (q) {
      res.types[q.error_type] = (res.types[q.error_type] || 0) + 1;
      if (q.error_cause) res.causes[q.error_cause] = (res.causes[q.error_cause] || 0) + 1;
      var fam = FAMILY_OF[q.error_type] || 'knowledge';
      res.families[fam] = (res.families[fam] || 0) + 1;
      var sub = q.subtopic || q.topic || 'General';
      if (!res.bySub[sub]) res.bySub[sub] = { total: 0, types: {}, topic: q.topic || '' };
      res.bySub[sub].total++;
      res.bySub[sub].types[q.error_type] = (res.bySub[sub].types[q.error_type] || 0) + 1;
      var key = q.sessionKey || q.sessionDate || '—';
      if (!sessMap[key]) sessMap[key] = { key: key, date: q.sessionDate || '', total: 0, fam: {}, questions: 0 };
      sessMap[key].total++;
      sessMap[key].fam[fam] = (sessMap[key].fam[fam] || 0) + 1;
    });
    // Session size, so "6 mistakes" can be read against how many were attempted.
    all.forEach(function (q) {
      var key = q.sessionKey || q.sessionDate || '—';
      if (sessMap[key]) sessMap[key].questions++;
    });
    res.sessions = Object.keys(sessMap).map(function (k) { return sessMap[k]; })
      .sort(function (a, b) {
        var d = String(a.date), e = String(b.date);
        return d === e ? (String(a.key) < String(b.key) ? -1 : 1) : (d < e ? -1 : 1);
      });

    // Time signature: how long each mistake type took, against the overall average.
    Object.keys(res.types).forEach(function (ty) {
      var rows = tagged.filter(function (q) { return q.error_type === ty && (Number(q.timeTaken) || 0) > 0; });
      if (!rows.length) return;
      var avg = Math.round(rows.reduce(function (a, q) { return a + Number(q.timeTaken); }, 0) / rows.length);
      res.timeSig.push({ type: ty, n: res.types[ty], avg: avg, delta: res.avgAll ? avg - res.avgAll : 0 });
    });
    res.timeSig.sort(function (a, b) { return b.n - a.n; });

    var famKeys = Object.keys(res.families).sort(function (a, b) { return res.families[b] - res.families[a]; });
    if (famKeys.length) res.topFamily = { key: famKeys[0], n: res.families[famKeys[0]], share: pct(res.families[famKeys[0]], tagged.length) };

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

    /* ---- Reality check: what they said, against what we measured ---- */
    var care = tagged.filter(function (q) { return q.error_type === 'careless' || q.error_type === 'calculation_slip'; });
    var careHard = care.filter(function (q) { return isHard(q.difficulty) && (Number(q.timeTaken) || 0) >= 150; });
    if (careHard.length >= 2) res.selfCheck.push({
      tone: 'warn',
      text: subj + ' tagged ' + care.length + ' ' + plural(care.length, 'mistake') + ' careless or a calculation slip, but ' + careHard.length +
        ' of them were hard questions where ' + subjLower + ' spent over 2.5 minutes. A long grind on a hard question is usually a method gap, not carelessness.'
    });

    var cg = tagged.filter(function (q) { return q.error_type === 'concept_gap'; });
    var cgFast = cg.filter(function (q) { return isEasy(q.difficulty) && (Number(q.timeTaken) || 0) > 0 && (Number(q.timeTaken) || 0) < 45; });
    if (cgFast.length >= 2) res.selfCheck.push({
      tone: 'warn',
      text: cgFast.length + ' of ' + poss + ' ' + cg.length + ' concept-gap mistakes were easy questions answered in under 45 seconds. ' +
        'Check whether ' + subjLower + ' misread them before relearning the concept.'
    });

    // "Rushed" on questions that actually took longer than average = stuck, not rushed.
    var rushed = tagged.filter(function (q) { return q.error_cause === 'rushed' && (Number(q.timeTaken) || 0) > 0; });
    var rushedSlow = rushed.filter(function (q) { return res.avgAll && Number(q.timeTaken) > res.avgAll * 1.25; });
    if (rushed.length >= 3 && rushedSlow.length / rushed.length >= 0.5) res.selfCheck.push({
      tone: 'warn',
      text: subj + ' put ' + rushed.length + ' ' + plural(rushed.length, 'mistake') + ' down to rushing, but ' + rushedSlow.length +
        ' of those took longer than ' + poss + ' average question. That is being stuck, not being rushed — the clock is the symptom, not the cause.'
    });

    // A single subtopic owning the "didn't know where to start" tags is a syllabus hole.
    var ns = tagged.filter(function (q) { return q.error_type === 'no_start'; });
    if (ns.length >= 3) {
      var nsSub = {};
      ns.forEach(function (q) { var s = q.subtopic || q.topic || 'General'; nsSub[s] = (nsSub[s] || 0) + 1; });
      var nsTop = Object.keys(nsSub).sort(function (a, b) { return nsSub[b] - nsSub[a]; })[0];
      if (nsSub[nsTop] >= 3) res.selfCheck.push({
        tone: 'info',
        text: nsSub[nsTop] + ' of ' + ns.length + ' "didn\'t know where to start" mistakes are in ' + nsTop +
          '. That is a gap in what ' + subjLower + ' ' + (third ? 'has' : 'have') + ' studied, not a test-day problem. Learn it before drilling it.'
      });
    }

    // The headline: one family dominating changes what to work on entirely.
    if (res.topFamily && res.topFamily.share >= 50 && tagged.length >= MIN_FOR_PATTERNS) {
      var fm = FAMILY_META[res.topFamily.key];
      res.selfCheck.push({ tone: 'key', text: res.topFamily.share + '% of ' + poss + ' logged mistakes are ' + fm.label.toLowerCase() + '. ' + fm.verdict(res.words) });
    }

    /* ---- Trend: is the biggest leak shrinking? ---- */
    if (res.sessions.length >= 4 && res.topFamily) {
      var half = Math.floor(res.sessions.length / 2);
      var older = res.sessions.slice(0, half), newer = res.sessions.slice(res.sessions.length - half);
      var sum = function (list, pick) { return list.reduce(function (a, s) { return a + pick(s); }, 0); };
      var oldQ = sum(older, function (s) { return s.questions; }), newQ = sum(newer, function (s) { return s.questions; });
      var k = res.topFamily.key;
      var oldN = sum(older, function (s) { return s.fam[k] || 0; }), newN = sum(newer, function (s) { return s.fam[k] || 0; });
      if (oldQ >= 10 && newQ >= 10) {
        var oldRate = oldN / oldQ, newRate = newN / newQ;
        var change = oldRate ? Math.round(((newRate - oldRate) / oldRate) * 100) : 0;
        res.trend = {
          family: k, oldRate: oldRate, newRate: newRate, change: change,
          label: FAMILY_META[k].label,
          dir: change <= -20 ? 'down' : (change >= 20 ? 'up' : 'flat')
        };
      }
    }

    /* ---- Action plan: at most three, strongest evidence first ---- */
    var seen = {};
    res.clusters.slice(0, 3).forEach(function (c) {
      seen[c.type] = true;
      res.plan.push({
        type: c.type, sub: c.sub, topic: c.topic, n: c.n, of: c.of,
        why: typeLabel(c.type) + ' shows up in ' + c.sub + ' ' + c.n + ' times out of ' + c.of + '.',
        how: ACTIONS[c.type] || ''
      });
    });
    Object.keys(res.types).sort(function (a, b) { return res.types[b] - res.types[a]; }).forEach(function (ty) {
      if (res.plan.length >= 3 || seen[ty] || res.types[ty] < 2) return;
      res.plan.push({
        type: ty, sub: '', topic: '', n: res.types[ty], of: tagged.length,
        why: typeLabel(ty) + ' accounts for ' + res.types[ty] + ' of ' + tagged.length + ' logged mistakes.',
        how: ACTIONS[ty] || ''
      });
    });
    return res;
  }

  /* ---------- small chart helpers (inline SVG, no chart library) ---------- */

  function barRows(map, labelFn, attr, active, colorFn) {
    var keys = Object.keys(map).sort(function (a, b) { return map[b] - map[a]; });
    var max = keys.length ? map[keys[0]] : 1;
    var total = keys.reduce(function (a, k) { return a + map[k]; }, 0);
    return keys.map(function (k) {
      var col = colorFn ? colorFn(k) : '#1a5da6';
      return '<button type="button" class="gel-p-row' + (active === k ? ' gel-on' : '') + '" ' + attr + '="' + esc(k) + '">' +
        '<div class="gel-p-line"><span>' + esc(labelFn(k)) + '</span><b>' + map[k] +
          '<i>' + pct(map[k], total) + '%</i></b></div>' +
        '<div class="gel-p-bar"><i style="width:' + Math.max(5, Math.round(map[k] / max * 100)) + '%;background:' + col + '"></i></div></button>';
    }).join('');
  }

  /* Stacked bars, one per session, coloured by family. Counts are shown against
     the session size underneath, because 6 mistakes in 40 questions and 6 in 10
     are not the same thing. */
  function trendSvg(sessions, maxBars) {
    var rows = sessions.slice(-(maxBars || 10));
    if (rows.length < 2) return '';
    var W = 100, gap = 2.2, bw = (W - gap * (rows.length - 1)) / rows.length;
    var peak = Math.max.apply(null, rows.map(function (s) { return s.total; })) || 1;
    var bars = '', labels = '';
    rows.forEach(function (s, i) {
      var x = i * (bw + gap), y = 0;
      FAMILY_ORDER.forEach(function (f) {
        var n = s.fam[f] || 0; if (!n) return;
        var h = (n / peak) * 86;
        bars += '<rect x="' + x.toFixed(2) + '" y="' + (86 - y - h).toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + h.toFixed(2) +
          '" fill="' + FAMILY_META[f].color + '" rx="0.7"><title>' + esc(s.date) + ' — ' + FAMILY_META[f].label + ': ' + n + '</title></rect>';
        y += h;
      });
      labels += '<div class="gel-tl"><b>' + s.total + '</b><span>/' + s.questions + 'q</span><em>' + esc(shortDate(s.date)) + '</em></div>';
    });
    var cap = 'max-width:' + (rows.length * 108) + 'px';
    return '<div class="gel-trend" style="' + cap + '"><svg viewBox="0 0 100 90" preserveAspectRatio="none" class="gel-trend-svg" aria-hidden="true">' + bars +
      '<line x1="0" y1="86.4" x2="100" y2="86.4" stroke="#d7dee5" stroke-width="0.5"/></svg>' +
      '<div class="gel-trend-labels" style="grid-template-columns:repeat(' + rows.length + ',1fr)">' + labels + '</div></div>';
  }

  function shortDate(d) {
    var m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(d || '').slice(0, 6);
    return m[3] + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m[2]) - 1];
  }

  /* Diverging bars around the student's own average time per question. */
  function timeSigHtml(a) {
    if (!a.avgAll || !a.timeSig.length) return '';
    var span = Math.max.apply(null, a.timeSig.map(function (r) { return Math.abs(r.delta); })) || 1;
    return '<div class="gel-ts">' + a.timeSig.slice(0, 6).map(function (r) {
      var even = Math.abs(r.delta) <= 5;              // within 5s of average
      var w = even ? 4 : Math.max(3, Math.min(50, Math.round(Math.abs(r.delta) / span * 46)));
      var slower = r.delta >= 0;
      var pos = even ? 'left:48%' : (slower ? 'left:50%' : 'right:50%');
      return '<div class="gel-ts-row"><span class="gel-ts-l">' + esc(typeLabel(r.type)) + '</span>' +
        '<span class="gel-ts-track">' +
          '<i style="' + pos + ';width:' + w + '%;background:' + typeColor(r.type) + '"></i>' +
          '<u></u></span>' +
        '<span class="gel-ts-v">' + (even ? 'on pace' : fmtSecs(r.avg)) + '</span></div>';
    }).join('') +
      '<p class="gel-p-note gel-ts-key">Average time on each kind of mistake, against an overall average of <b>' + fmtSecs(a.avgAll) +
      '</b> per question. Bars to the right took longer, to the left were faster.</p></div>';
  }

  /* Subtopic × mistake-type grid. The cell is the whole story in one glance:
     a dark column is a habit, a dark row is a topic problem. */
  function matrixHtml(a, state) {
    var subs = Object.keys(a.bySub).sort(function (x, y) { return a.bySub[y].total - a.bySub[x].total; }).slice(0, 8);
    var types = Object.keys(a.types).sort(function (x, y) { return a.types[y] - a.types[x]; });
    if (subs.length < 2 || types.length < 2) return '';
    var peak = 1;
    subs.forEach(function (s) { types.forEach(function (t) { peak = Math.max(peak, a.bySub[s].types[t] || 0); }); });
    var head = '<tr><th class="gel-mx-corner"></th>' + types.map(function (t) {
      return '<th><span style="background:' + typeColor(t) + '"></span>' + esc(shortType(t)) + '</th>';
    }).join('') + '<th class="gel-mx-tot">All</th></tr>';
    var body = subs.map(function (s) {
      return '<tr><th scope="row">' + esc(s) + '</th>' + types.map(function (t) {
        var n = a.bySub[s].types[t] || 0;
        var on = state.sub === s && state.type === t;
        if (!n) return '<td class="gel-mx-0">·</td>';
        return '<td><button type="button" class="gel-mx-c' + (on ? ' gel-on' : '') + '" data-gel-fcell="' + esc(s) + '|' + esc(t) +
          '" style="background:' + shade(typeColor(t), n / peak) + ';color:' + (n / peak > 0.55 ? '#fff' : '#16324f') + '" title="' +
          esc(s + ' · ' + typeLabel(t) + ': ' + n) + '">' + n + '</button></td>';
      }).join('') + '<td class="gel-mx-tot">' + a.bySub[s].total + '</td></tr>';
    }).join('');
    return '<div class="gel-mx-wrap"><table class="gel-mx">' + head + body + '</table></div>';
  }

  function shortType(t) {
    return ({ concept_gap: 'Concept', method_not_recalled: 'Method', misread: 'Misread', calculation_slip: 'Calc slip',
      careless: 'Careless', fell_for_trap: 'Trap', diagram_misread: 'Diagram', no_start: 'No start' })[t] || typeLabel(t);
  }
  /* Mix a hex toward white; `k` is 0..1 strength. */
  function shade(hex, k) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
    var v = parseInt(m[1], 16), r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    var t = 0.18 + 0.82 * Math.max(0, Math.min(1, k));
    var mix = function (c) { return Math.round(255 - (255 - c) * t); };
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }

  /* ---------- the dashboard ---------- */

  /* Renders the full mistake analytics into `el` and wires every filter.
     opts: { third, drillHref(topic, subtopic) -> url|'', emptyText, compact } */
  function mountPanels(el, questions, opts) {
    opts = opts || {}; injectCss();
    var a = analyse(questions, opts.third), state = { type: '', cause: '', sub: '' };
    var W = a.words;

    function head(title, note) {
      return '<div class="gel-p-head"><h3>' + esc(title) + '</h3>' + (note ? '<p>' + esc(note) + '</p>' : '') + '</div>';
    }

    function draw() {
      if (!a.logged) {
        el.innerHTML = '<div class="gel-p"><div class="gel-p-locked">' + esc(opts.emptyText ||
          (W.possCap + ' mistake patterns appear here once ' + W.subjLower + ' ' + (W.third ? 'has' : 'have') +
           ' tagged mistakes after a session.')) + '</div></div>';
        return;
      }
      if (!a.ready) {
        el.innerHTML = '<div class="gel-p"><div class="gel-p-locked"><b>' + a.logged + ' of ' + a.min + ' mistakes logged.</b><br>' +
          'Patterns open at ' + a.min + ' logged mistakes. With fewer, a single mistake looks like a trend.' +
          '<div class="gel-p-progress"><i style="width:' + pct(a.logged, a.min) + '%"></i></div></div></div>';
        return;
      }

      var list = a.tagged.filter(function (q) {
        return (!state.type || q.error_type === state.type) && (!state.cause || q.error_cause === state.cause) &&
          (!state.sub || (q.subtopic || q.topic || 'General') === state.sub);
      });
      var subMap = {}; Object.keys(a.bySub).forEach(function (s) { subMap[s] = a.bySub[s].total; });
      var topSubs = Object.keys(subMap).sort(function (x, y) { return subMap[y] - subMap[x]; }).slice(0, 6), subTop = {};
      topSubs.forEach(function (s) { subTop[s] = subMap[s]; });

      /* — headline strip — */
      var fam = a.topFamily ? FAMILY_META[a.topFamily.key] : null;
      var trendTile = '';
      if (a.trend) {
        var tArrow = a.trend.dir === 'down' ? '↓' : (a.trend.dir === 'up' ? '↑' : '→');
        var tWord = a.trend.dir === 'down' ? 'improving' : (a.trend.dir === 'up' ? 'getting worse' : 'holding steady');
        trendTile = '<div class="gel-stat gel-stat-' + a.trend.dir + '"><b>' + tArrow + ' ' + Math.abs(a.trend.change) + '%</b>' +
          '<span>' + esc(a.trend.label) + ' rate, ' + tWord + '</span></div>';
      }
      var strip = '<div class="gel-stats">' +
        '<div class="gel-stat"><b>' + a.logged + '</b><span>' + plural(a.logged, 'mistake') + ' logged across ' + a.sessions.length + ' ' + plural(a.sessions.length, 'session') + '</span></div>' +
        (fam ? '<div class="gel-stat" style="--gel-accent:' + fam.color + '"><b>' + a.topFamily.share + '%</b><span>' +
          esc(fam.label) + ' — ' + esc(fam.meaning) + '</span></div>' : '') +
        trendTile +
        (a.untagged > 0
          ? '<div class="gel-stat gel-stat-warn"><b>' + a.untagged + '</b><span>' + plural(a.untagged, 'mistake') + ' not tagged yet</span></div>'
          : '<div class="gel-stat gel-stat-ok"><b>100%</b><span>of mistakes tagged</span></div>') +
      '</div>';

      /* — family split — the single most useful cut — */
      var famTotal = FAMILY_ORDER.reduce(function (s, f) { return s + (a.families[f] || 0); }, 0) || 1;
      var famBar = '<div class="gel-fam">' +
        '<div class="gel-fam-bar">' + FAMILY_ORDER.map(function (f) {
          var n = a.families[f] || 0; if (!n) return '';
          return '<i style="width:' + (n / famTotal * 100) + '%;background:' + FAMILY_META[f].color + '" title="' + esc(FAMILY_META[f].label + ': ' + n) + '"></i>';
        }).join('') + '</div>' +
        '<div class="gel-fam-key">' + FAMILY_ORDER.map(function (f) {
          var n = a.families[f] || 0; if (!n) return '';
          return '<div class="gel-fam-k"><span style="background:' + FAMILY_META[f].color + '"></span>' +
            '<b>' + esc(FAMILY_META[f].label) + '</b> ' + n + ' · ' + pct(n, famTotal) + '%' +
            '<em>' + esc(FAMILY_META[f].meaning) + '</em></div>';
        }).join('') + '</div></div>';

      /* — reality check + plan — */
      var checks = a.selfCheck.map(function (c) {
        return '<div class="gel-p-insight gel-i-' + (c.tone || 'warn') + '">' + esc(c.text) + '</div>';
      }).join('');

      var plan = a.plan.length ? '<ol class="gel-plan">' + a.plan.map(function (p, i) {
        var href = (opts.drillHref && p.sub) ? opts.drillHref(p.topic, p.sub) : '';
        return '<li><div class="gel-plan-n" style="background:' + typeColor(p.type) + '">' + (i + 1) + '</div>' +
          '<div><b>' + esc(p.how) + '</b><span>' + esc(p.why) + '</span>' +
          (href ? '<a href="' + esc(href) + '">Drill ' + esc(p.sub) + ' →</a>' : '') + '</div></li>';
      }).join('') + '</ol>' : '';

      var filtered = (state.type || state.cause || state.sub);
      var filterLine = filtered
        ? '<div class="gel-p-filter">Showing <b>' + list.length + '</b> of ' + a.tagged.length + ' · ' +
          [state.type ? typeLabel(state.type) : '', state.cause ? causeLabel(state.cause) : '', state.sub || ''].filter(Boolean).map(esc).join(' · ') +
          ' <button type="button" class="gel-p-clear" data-gel-fclear>Clear</button></div>'
        : '<p class="gel-p-note">Tap any bar or grid cell to filter this list.</p>';

      el.innerHTML = '<div class="gel-p">' + strip +
        '<section class="gel-p-card gel-span">' + head('Where the mistakes come from',
          'Every logged mistake sorted into what actually has to change. This is the number to act on first.') + famBar + '</section>' +
        (checks ? '<section class="gel-p-card gel-span">' + head('Reality check', 'Where the tags disagree with the clock and the difficulty.') + checks + '</section>' : '') +
        '<div class="gel-p-grid">' +
          '<section class="gel-p-card"><h3>Most common mistakes</h3>' + barRows(a.types, typeLabel, 'data-gel-ftype', state.type, typeColor) + '</section>' +
          '<section class="gel-p-card"><h3>Why it happened</h3>' +
            (Object.keys(a.causes).length ? barRows(a.causes, causeLabel, 'data-gel-fcause', state.cause, function () { return '#6b7a88'; })
              : '<p class="gel-p-note">No causes logged yet — that chip is optional.</p>') + '</section>' +
          '<section class="gel-p-card"><h3>Where they happen</h3>' + barRows(subTop, function (s) { return s; }, 'data-gel-fsub', state.sub, function () { return '#1a5da6'; }) + '</section>' +
        '</div>' +
        (matrixHtml(a, state) ? '<section class="gel-p-card gel-span">' + head('Mistake map',
          'Subtopic against mistake type. A dark column is a habit that follows ' + W.obj + ' everywhere; a dark row is one topic that needs work.') +
          matrixHtml(a, state) + '</section>' : '') +
        (trendSvg(a.sessions) ? '<section class="gel-p-card gel-span">' + head('Session by session',
          'Mistakes logged per session, against how many questions that session had.') + trendSvg(a.sessions) + '</section>' : '') +
        (timeSigHtml(a) ? '<section class="gel-p-card gel-span">' + head('Time signature',
          'Rushing and grinding leave different fingerprints. This is which one each mistake type has.') + timeSigHtml(a) + '</section>' : '') +
        (plan ? '<section class="gel-p-card gel-span gel-p-planbox">' + head(W.third ? 'What to set them' : 'What to do next',
          'Ranked by how much evidence there is, not by how bad it sounds.') + plan + '</section>' : '') +
        '<section class="gel-p-card gel-span"><h3>' + (W.third ? 'Logged mistakes' : 'Your logged mistakes') + '</h3>' +
          filterLine +
          '<div class="gel-p-list">' + list.slice(0, 60).map(function (q) {
            return '<div class="gel-p-li"><span class="gel-p-dot" style="background:' + typeColor(q.error_type) + '"></span>' +
              '<div><b>' + esc(typeLabel(q.error_type)) + '</b>' + (q.error_cause ? ' <em>· ' + esc(causeLabel(q.error_cause)) + '</em>' : '') +
              '<small>' + esc(q.sessionDate || '') + ' · ' + esc(q.subtopic || q.topic || '') + (q.difficulty ? ' · ' + esc(q.difficulty) : '') +
              (q.timeTaken ? ' · ' + fmtSecs(q.timeTaken) : '') + (q.bank_question_id ? ' · ' + esc(q.bank_question_id) : '') + '</small>' +
              (q.error_note ? '<small class="gel-p-quote">' + esc(q.error_note) + '</small>' : '') + '</div></div>';
          }).join('') + (list.length > 60 ? '<p class="gel-p-note">Showing the 60 most recent of ' + list.length + '.</p>' : '') +
          (!list.length ? '<p class="gel-p-note">Nothing matches that filter.</p>' : '') +
        '</div></section></div>';
    }

    el.onclick = function (e) {
      var t = e.target.closest ? e.target.closest('[data-gel-ftype],[data-gel-fcause],[data-gel-fsub],[data-gel-fcell],[data-gel-fclear]') : null;
      if (!t) return;
      if (t.hasAttribute('data-gel-fclear')) state = { type: '', cause: '', sub: '' };
      else if (t.hasAttribute('data-gel-ftype')) { var v = t.getAttribute('data-gel-ftype'); state.type = state.type === v ? '' : v; }
      else if (t.hasAttribute('data-gel-fcause')) { var c = t.getAttribute('data-gel-fcause'); state.cause = state.cause === c ? '' : c; }
      else if (t.hasAttribute('data-gel-fsub')) { var s = t.getAttribute('data-gel-fsub'); state.sub = state.sub === s ? '' : s; }
      else if (t.hasAttribute('data-gel-fcell')) {
        var parts = t.getAttribute('data-gel-fcell').split('|');
        var same = state.sub === parts[0] && state.type === parts[1];
        state.sub = same ? '' : parts[0]; state.type = same ? '' : parts[1]; state.cause = '';
      }
      draw();
    };
    draw();
    return a;
  }

  window.GREErrorLog = {
    TYPES: TYPES, CAUSES: CAUSES, ACTIONS: ACTIONS, MIN_FOR_PATTERNS: MIN_FOR_PATTERNS,
    FAMILY_OF: FAMILY_OF, FAMILY_META: FAMILY_META, FAMILY_ORDER: FAMILY_ORDER,
    typeLabel: typeLabel, causeLabel: causeLabel, typeColor: typeColor,
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
