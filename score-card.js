/* ============================================================
   GREScoreCard — the score page every test now ends on.

   WHY IT EXISTS

     Until now a finished test went straight to the review screen:
     tag every mistake, press Proceed, and only then see the score
     and the analysis. Students told us the wait for the number was
     the wrong thing to withhold — they sit there wondering how they
     did instead of thinking about the question in front of them.

     So the order is now: score, then review, then analysis.

       1. this card — the scaled score, full screen, and nothing else
       2. the error log — every wrong and skipped question tagged
       3. the analysis — released by the existing Proceed gate

     The card is deliberately bare. One number is an answer; accuracy,
     correct counts, section splits and topic bars are the beginning
     of an explanation, and a student who has started explaining their
     result to themselves has stopped wanting to log it. Everything
     except the score stays behind the gate, exactly as before — this
     file does not unlock anything.

   WHAT IT SHOWS

     The scaled 130-170 estimate from score-scale.js, its likely
     range, and the word "estimated". score-scale.js returns a range
     on purpose (ETS publishes no raw-to-scaled table and it moves
     with the form), and dropping that here would claim a precision
     the number does not have. A range is not an insight; it is how
     accurate the one number is.

     With no estimate — score-scale.js did not load, or the paper has
     no difficulty labels to weight — it falls back to the raw score
     and says so, rather than inventing a scale.

   USE

     <script src="score-scale.js"></script>   (../score-scale.js from
     <script src="score-card.js"></script>     pro/ or events/)

       GREScoreCard.show({
         est: GREScore.fromQuestions(rows, 'mock'),   // or null
         correct: 19, total: 27,
         scope: 'mock',                                // or 'sectional'
         testTitle: 'Mock Test 3',
         studentName: 'Asha',
         onContinue: function () { ... }               // reveal the review
       });

     Guard the call with `if (window.GREScoreCard)`. If this file does
     not load the page must carry on to the review as it does today —
     a missing score page is a disappointment, a stuck page is a bug.
     show() never throws; onContinue always runs exactly once, even if
     rendering fails.
   ============================================================ */
(function () {
  'use strict';

  var MOUNT_ID = 'gre-score-card';
  var STYLE_ID = 'gre-score-card-css';

  /* Self-contained so the card looks the same on all five surfaces,
     none of which share a stylesheet. Values match gre-exam-theme.css. */
  var CSS = [
    '#' + MOUNT_ID + '{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;',
    '  background:#eef1f4;color:#16191d;font-family:Arial,Helvetica,"Segoe UI",sans-serif;',
    '  overflow-y:auto;-webkit-overflow-scrolling:touch;opacity:0;transition:opacity .18s ease;}',
    '#' + MOUNT_ID + '.gsc-in{opacity:1;}',
    '#' + MOUNT_ID + ' *{box-sizing:border-box;}',

    '.gsc-bar{flex:0 0 auto;background:#28455e;color:#fff;padding:12px 20px;display:flex;',
    '  align-items:center;justify-content:space-between;gap:16px;font-size:13.5px;letter-spacing:.02em;}',
    '.gsc-bar b{font-weight:700;}',
    '.gsc-bar-right{opacity:.82;font-size:12.5px;text-align:right;}',

    '.gsc-body{flex:1 1 auto;display:flex;align-items:center;justify-content:center;padding:32px 16px 40px;}',
    '.gsc-panel{width:100%;max-width:560px;background:#fff;border:1px solid #c9d2da;border-radius:6px;',
    '  box-shadow:0 1px 3px rgba(22,25,29,.07);padding:44px 36px 32px;text-align:center;}',

    '.gsc-eyebrow{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#5a6672;font-weight:700;}',
    '.gsc-measure{margin:10px 0 0;font-size:19px;font-weight:700;color:#16191d;}',
    '.gsc-rule{height:1px;background:#e2e8ee;margin:26px 0;}',

    '.gsc-score{font-size:112px;line-height:1;font-weight:700;color:#1a5da6;letter-spacing:-.03em;',
    '  font-variant-numeric:tabular-nums;}',
    '.gsc-score.gsc-raw{font-size:76px;}',
    '.gsc-scale{margin-top:12px;font-size:13.5px;color:#5a6672;}',
    '.gsc-range{margin-top:18px;display:inline-block;border:1px solid #c9d2da;border-radius:4px;',
    '  padding:7px 14px;font-size:13px;color:#3d4852;background:#f6f8fa;}',
    '.gsc-range b{color:#16191d;font-weight:700;font-variant-numeric:tabular-nums;}',
    '.gsc-note{margin:18px auto 0;max-width:420px;font-size:12.5px;line-height:1.55;color:#6b7680;}',

    '.gsc-next{margin-top:30px;padding-top:24px;border-top:1px solid #e2e8ee;}',
    '.gsc-btn{appearance:none;border:1px solid #124a87;background:#1a5da6;color:#fff;font:inherit;',
    '  font-size:15px;font-weight:700;padding:13px 34px;border-radius:4px;cursor:pointer;',
    '  min-height:46px;transition:background .12s ease;}',
    '.gsc-btn:hover{background:#124a87;}',
    '.gsc-btn:focus-visible{outline:3px solid #8cb4e2;outline-offset:2px;}',
    '.gsc-whats-next{margin-top:14px;font-size:12.5px;color:#6b7680;line-height:1.55;}',

    '.gsc-steps{display:flex;gap:0;justify-content:center;margin-top:22px;font-size:11.5px;color:#8a949e;}',
    '.gsc-step{display:flex;align-items:center;gap:7px;padding:0 13px;}',
    '.gsc-step + .gsc-step{border-left:1px solid #dfe6ed;}',
    '.gsc-dot{width:7px;height:7px;border-radius:50%;background:#cfd8e0;flex:0 0 auto;}',
    '.gsc-step.gsc-now{color:#1a5da6;font-weight:700;}',
    '.gsc-step.gsc-now .gsc-dot{background:#1a5da6;}',

    '@media (max-width:560px){',
    '  .gsc-panel{padding:32px 20px 24px;}',
    '  .gsc-score{font-size:84px;} .gsc-score.gsc-raw{font-size:58px;}',
    '  .gsc-bar{font-size:12.5px;padding:10px 14px;} .gsc-bar-right{display:none;}',
    '  .gsc-steps{flex-wrap:wrap;gap:4px 0;} .gsc-step{padding:0 9px;}',
    '  .gsc-step + .gsc-step{border-left:0;}',      // dividers look wrong once the row wraps
    '  .gsc-btn{width:100%;}',
    '}',
    '@media (prefers-reduced-motion:reduce){#' + MOUNT_ID + '{transition:none;}}',
    '@media print{#' + MOUNT_ID + '{display:none !important;}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function todayLabel() {
    try {
      return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return new Date().toDateString();
    }
  }

  /* A sectional is a section, not a test, and score-scale.js already widens
     its band to say so. The wording here has to match or the two disagree. */
  function measureLine(scope) {
    return scope === 'sectional' ? 'Quantitative Reasoning — one section' : 'Quantitative Reasoning';
  }

  /* Is there a mistake log waiting behind this card? By the time a page shows
     the card its review gate is already set up, so asking the gate is more
     reliable than each page working it out again — and a clean paper is never
     held, so it must not be promised a log step it will never see. `held` in
     the options overrides, for a page that knows better. */
  function isHeld(o) {
    if (o && typeof o.held === 'boolean') return o.held;
    try { return !!(window.GREErrorLog && window.GREErrorLog.holding()); } catch (e) { return false; }
  }

  function stepsHtml(held) {
    var steps = held
      ? [['Your score', true], ['Log your mistakes', false], ['Full analysis', false]]
      : [['Your score', true], ['Full analysis', false]];
    return '<div class="gsc-steps">' + steps.map(function (s) {
      return '<span class="gsc-step' + (s[1] ? ' gsc-now' : '') + '"><i class="gsc-dot"></i>' + esc(s[0]) + '</span>';
    }).join('') + '</div>';
  }

  function nextLine(held) {
    return held
      ? 'Next: log what went wrong on each question you missed. Your full analysis opens once that is done.'
      : 'Nothing to log on this one. Your full analysis is next.';
  }

  function panelHtml(o) {
    var est = o.est;
    var body;

    if (est && est.scaled != null) {
      // score-scale.js reports the band as low/high (min/max are the ends of
      // the 130-170 scale itself, not of this estimate). A zero-width band
      // only happens at the very ends, where there is no range to show.
      var band = est.range || (est.low != null && est.high != null && est.low !== est.high
        ? est.low + '–' + est.high : '');
      body =
        '<div class="gsc-score" id="gsc-num">' + esc(est.scaled) + '</div>' +
        '<div class="gsc-scale">Scaled score &middot; 130&ndash;170</div>' +
        (band
          ? '<div class="gsc-range">Estimated &middot; likely range <b>' + esc(band) + '</b></div>'
          : '<div class="gsc-range">Estimated</div>');
    } else {
      // No weighting to work from. Say what we actually know.
      var c = Number(o.correct) || 0, t = Number(o.total) || 0;
      body =
        '<div class="gsc-score gsc-raw" id="gsc-num">' + esc(c) + ' / ' + esc(t) + '</div>' +
        '<div class="gsc-scale">Questions correct</div>' +
        '<div class="gsc-note">A scaled score is not available for this paper, so this is the raw result.</div>';
    }

    var held = isHeld(o);
    return '' +
      '<div class="gsc-bar">' +
        '<span><b>GRE Quant Pro</b> &middot; ' + esc(o.testTitle || 'Practice Test') + '</span>' +
        '<span class="gsc-bar-right">' +
          (o.studentName ? esc(o.studentName) + ' &middot; ' : '') + esc(todayLabel()) +
        '</span>' +
      '</div>' +
      '<div class="gsc-body"><div class="gsc-panel" role="document">' +
        '<div class="gsc-eyebrow">Your score</div>' +
        '<h1 class="gsc-measure" id="gsc-title">' + esc(measureLine(o.scope)) + '</h1>' +
        '<div class="gsc-rule"></div>' +
        body +
        '<div class="gsc-next">' +
          '<button type="button" class="gsc-btn" id="gsc-continue">' + esc(o.continueLabel || 'Continue') + ' &rarr;</button>' +
          '<div class="gsc-whats-next">' + esc(nextLine(held)) + '</div>' +
          stepsHtml(held) +
        '</div>' +
      '</div></div>';
  }

  var openCard = null;

  function close(card) {
    if (!card || card.closed) return;
    card.closed = true;
    document.removeEventListener('keydown', card.onKey, true);
    if (card.prevOverflow != null) document.documentElement.style.overflow = card.prevOverflow;
    if (card.bodyOverflow != null) document.body.style.overflow = card.bodyOverflow;
    var el = card.el;
    if (el) {
      el.classList.remove('gsc-in');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
    }
    if (card.prevFocus && card.prevFocus.focus) { try { card.prevFocus.focus(); } catch (e) { /* gone */ } }
    openCard = null;
    if (card.onContinue) {
      var fn = card.onContinue;
      card.onContinue = null;        // exactly once, whatever happens next
      try { fn(); } catch (e) { if (window.console) console.warn('score card onContinue', e); }
    }
  }

  function show(opts) {
    var o = opts || {};
    var onContinue = typeof o.onContinue === 'function' ? o.onContinue : null;

    // Never leave a page stranded behind a card that failed to build.
    try {
      if (openCard) close(openCard);
      injectCss();

      var el = document.createElement('div');
      el.id = MOUNT_ID;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'gsc-title');
      el.innerHTML = panelHtml(o);
      document.body.appendChild(el);

      var card = {
        el: el,
        onContinue: onContinue,
        closed: false,
        prevFocus: document.activeElement,
        prevOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow
      };

      // The result screen underneath is already built; stop it scrolling
      // behind the card.
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      var btn = el.querySelector('#gsc-continue');
      if (btn) btn.addEventListener('click', function () { close(card); });

      /* Enter and Escape both continue. There is nothing to cancel — the card
         is a step in the flow, not a dialog over something else — and a
         student who hits Escape expecting a way out should get the next
         screen, not a card that ignores them. Tab is kept inside the card so
         focus cannot wander into the hidden results behind it. */
      card.onKey = function (e) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          if (e.key === 'Enter' && e.target && e.target.tagName === 'BUTTON') return;  // the click handler has it
          e.preventDefault();
          close(card);
          return;
        }
        if (e.key === 'Tab' && btn) { e.preventDefault(); btn.focus(); }
      };
      document.addEventListener('keydown', card.onKey, true);

      openCard = card;
      // Next frame, so the opacity transition actually runs.
      requestAnimationFrame(function () { el.classList.add('gsc-in'); });
      if (btn) setTimeout(function () { try { btn.focus(); } catch (e) { /* not focusable yet */ } }, 60);
      return card;
    } catch (e) {
      if (window.console) console.warn('score card', e);
      if (onContinue) { try { onContinue(); } catch (e2) { /* nothing left to do */ } }
      return null;
    }
  }

  /* For a page that tears its result screen down (retake, new session) while
     the card happens to still be up. Does not run onContinue. */
  function dismiss() {
    if (!openCard) return;
    openCard.onContinue = null;
    close(openCard);
  }

  window.GREScoreCard = { show: show, dismiss: dismiss, isOpen: function () { return !!openCard; } };
})();
