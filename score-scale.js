/* ============================================================
   GREScore — one raw-to-scaled model for every surface

   A full mock, a sectional and a topic test all now report an
   estimated Quant score on the real 130-170 scale, and they must
   agree: the same 18-of-24 at the same difficulty mix has to produce
   the same number whether the student met it in a mock, a sectional
   or a drill, and the coach view has to reproduce exactly what the
   student was shown. So the weights, the anchors and the confidence
   band live here, in one file, instead of being re-typed per page.

   HOW THE ESTIMATE WORKS

     1. Difficulty-weight the raw accuracy. A hard question is worth
        more than an easy one, because the real test's adaptive
        algorithm rewards the harder second section.
     2. Map that weighted accuracy onto 130-170 through a piecewise-
        linear anchor table.
     3. Return a RANGE, never a bare number. ETS publishes no
        raw-to-scaled table and it varies by form, so a single figure
        would claim a precision we do not have.

   The anchors and weights are the ones full_mock.html has been using
   since the free mock shipped, unchanged, so no student's past mock
   score moves because of this file.

   WHY A TOPIC TEST GETS A SCORE AT ALL

     A 10-question drill on one subtopic cannot predict a section
     score, and saying so is the honest position. What it CAN say is:
     "this accuracy, at this difficulty, is what a 154 scorer looks
     like." That is the number coaches and students actually want, and
     it is well defined. The band widens with fewer questions and
     narrower scope, and `confidence` / `note` carry the caveat into
     the UI rather than leaving the page to invent its own wording.

   Include before the page's own script:
     <script src="score-scale.js"></script>
   (from pro/, events/ or cloudflare/, use "../score-scale.js")

   Every call site must be guarded with `if (window.GREScore)`, so a
   failed script load costs the score line and nothing else.
   ============================================================ */
window.GREScore = (function () {

  var MIN = 130, MAX = 170;

  /* A hard question correct says more about a score than an easy one.
     Keys are normalised, so 'extreme_hard', 'Extreme Hard' and
     'extreme hard' all land on the same weight — the bank stores the
     first, the v2.0 session shape title-cases to the second. */
  var WEIGHTS = { 'easy': 1.00, 'medium': 1.15, 'hard': 1.35, 'extreme hard': 1.55 };

  /* weighted accuracy -> scaled score. Linear between anchors. */
  var ANCHORS = [[0, 134], [0.25, 145], [0.40, 152], [0.50, 156],
                 [0.60, 159], [0.70, 162], [0.80, 165], [0.90, 168], [1, 170]];

  /* Which surface the questions came from. Scope widens the band:
     a mock samples the whole syllabus, a topic test samples one
     subtopic, and the narrower sample is the weaker predictor. */
  var SCOPE_SPREAD = { mock: 0, sectional: 1, topic: 2 };

  var TYPE_SCOPE = {
    full_mock: 'mock', event_mock: 'mock',
    sectional: 'sectional',
    bank_practice: 'topic', bank_exam: 'topic', practice: 'topic', manual: 'topic'
  };

  function normDiff(d) {
    return String(d == null ? '' : d).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* null when the difficulty is missing or not one of the four bands. The
     callers weight such a question as 1 but do not count it as graded, which
     is what lets an unscoreable set be reported as unscoreable instead of
     quietly becoming a plain accuracy-to-scale conversion. */
  function lookup(d) {
    var w = WEIGHTS[normDiff(d)];
    return w == null ? null : w;
  }

  function weightOf(d) {
    var w = lookup(d);
    return w == null ? 1 : w;
  }

  function clampScore(v) {
    return Math.max(MIN, Math.min(MAX, Math.round(v)));
  }

  /* Maps a 0-1 weighted accuracy onto the scale. */
  function scaledFromWeighted(wacc) {
    var x = Math.max(0, Math.min(1, Number(wacc) || 0));
    for (var i = 0; i < ANCHORS.length - 1; i++) {
      var x0 = ANCHORS[i][0], y0 = ANCHORS[i][1];
      var x1 = ANCHORS[i + 1][0], y1 = ANCHORS[i + 1][1];
      if (x >= x0 && x <= x1) {
        var t = (x1 === x0) ? 0 : (x - x0) / (x1 - x0);
        return clampScore(y0 + t * (y1 - y0));
      }
    }
    return MAX;
  }

  /* Half-width of the reported range. Sampling error falls as
     1/sqrt(n), so the constant is set to put a 27-question mock at the
     +/-3 the free mock has always shown. Scope adds to it. */
  function spread(n, scope) {
    var count = Math.max(1, Number(n) || 0);
    var base = Math.round(16 / Math.sqrt(count)) + (SCOPE_SPREAD[scope] || 0);
    return Math.max(3, Math.min(10, base));
  }

  function confidenceOf(n, scope) {
    var count = Number(n) || 0;
    if (count < 8) return 'indicative';
    if (count < 15) return 'low';
    if (count < 25) return 'moderate';
    return scope === 'mock' ? 'high' : 'moderate';
  }

  /* The caveat, written once. Pages print this verbatim rather than
     each inventing its own hedge — which is how two surfaces end up
     making different promises about the same number. */
  function noteFor(scope, n, confidence) {
    var thin = (confidence === 'indicative')
      ? 'Too few questions to be reliable yet — '
      : '';
    if (scope === 'mock') {
      return thin + 'Difficulty-weighted estimate on the 130–170 Quant scale. ' +
        'ETS publishes no raw-to-scaled table and it varies by form, so the range is the answer, not the single number.';
    }
    if (scope === 'sectional') {
      return thin + 'This is the Quant score this accuracy and difficulty mix would translate to across a full section. ' +
        'One section of one topic is a narrower sample than a mock, so treat it as a direction, not a predicted score.';
    }
    return thin + 'A topic test is a drill, not a section. This is the Quant score this accuracy would correspond to ' +
      'at this difficulty level — useful for tracking a topic, not a substitute for a full mock.';
  }

  function scopeFor(sessionType) {
    return TYPE_SCOPE[String(sessionType || '')] || 'topic';
  }

  /* The one constructor every entry point funnels into. Returns null
     for an empty set rather than a score: with no questions there is
     nothing to scale, and 134 (what a 0% weighted accuracy maps to)
     would be a real-looking number for a session that never happened.
     Callers already guard on `if (window.GREScore)`, so guarding the
     result the same way costs them nothing. */
  function build(num, den, correct, total, graded, scope, opts) {
    opts = opts || {};
    if (!total || den <= 0) return null;
    // No question carried a difficulty we recognise, so there is nothing to
    // weight. Mapping raw accuracy onto the scale here would look like a
    // difficulty-weighted score without being one, so this declines instead —
    // the surfaces show a dash. Only reachable for sessions stored before
    // difficulty was recorded; every live surface sends it.
    if (!graded) return null;
    var sc = SCOPE_SPREAD[scope] == null ? 'topic' : scope;
    var wacc = den > 0 ? (num / den) : 0;
    var scaled = scaledFromWeighted(wacc);
    var half = opts.spread == null ? spread(total, sc) : opts.spread;
    var conf = confidenceOf(total, sc);
    return {
      scaled: scaled,
      low: Math.max(MIN, scaled - half),
      high: Math.min(MAX, scaled + half),
      range: Math.max(MIN, scaled - half) + '–' + Math.min(MAX, scaled + half),
      spread: half,
      wacc: Math.round(wacc * 1000) / 1000,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      correct: correct,
      total: total,
      scope: sc,
      graded: graded,
      confidence: conf,
      note: noteFor(sc, total, conf),
      min: MIN,
      max: MAX
    };
  }

  /* ── Entry points ──────────────────────────────────────────────── */

  /* From a v2.0 session's `questions` array, or any array of
     { correct, difficulty }. `correct === null` means skipped, which
     counts against the student exactly as a wrong answer does on the
     real test. */
  function fromQuestions(questions, scope, opts) {
    var list = Array.isArray(questions) ? questions : [];
    var num = 0, den = 0, correct = 0, graded = 0;
    for (var i = 0; i < list.length; i++) {
      var known = lookup(list[i].difficulty);
      var w = 1;
      if (known != null) { w = known; graded++; }
      den += w;
      if (list[i].correct === true) { num += w; correct++; }
    }
    return build(num, den, correct, list.length, graded, scope, opts);
  }

  /* From the mock/sectional submission payload's flat `results` array
     ({ correct, skipped, difficulty }). */
  function fromResults(results, scope, opts) {
    var list = Array.isArray(results) ? results : [];
    var num = 0, den = 0, correct = 0, graded = 0;
    for (var i = 0; i < list.length; i++) {
      var known = lookup(list[i].difficulty);
      var w = 1;
      if (known != null) { w = known; graded++; }
      den += w;
      if (list[i].correct && !list[i].skipped) { num += w; correct++; }
    }
    return build(num, den, correct, list.length, graded, scope, opts);
  }

  /* From a whole v2.0 session object — scope inferred from
     session_type. This is what the coach view uses, so a stored
     session re-scores identically to what the student saw. */
  function fromSession(session) {
    if (!session || !Array.isArray(session.questions)) return null;
    return fromQuestions(session.questions, scopeFor(session.session_type));
  }

  /* From pre-aggregated difficulty counts, which is all the coach
     view's student LIST has: [{ difficulty, attempts, correct }].
     Used for a student's overall figure across many sessions, so the
     scope is deliberately the widest. */
  function fromCounts(rows, scope, opts) {
    var list = Array.isArray(rows) ? rows : [];
    var num = 0, den = 0, correct = 0, total = 0, graded = 0;
    for (var i = 0; i < list.length; i++) {
      var known = lookup(list[i].difficulty);
      var w = known == null ? 1 : known;
      var a = Number(list[i].attempts) || 0;
      var c = Number(list[i].correct) || 0;
      if (known != null) graded += a;
      den += w * a; num += w * c;
      total += a; correct += c;
    }
    return build(num, den, correct, total, graded, scope || 'mock', opts);
  }

  /* Shared verdict band, so the mock's diagnosis card, the sectional
     headline and the coach view all cut the scale in the same places. */
  function bandFor(scaled) {
    var s = Number(scaled) || 0;
    if (s >= 165) return { key: 'strong', label: 'STRONG', blurb: 'At or near a top Quant score.' };
    if (s >= 158) return { key: 'close',  label: 'CLOSE',  blurb: 'Within reach of 165+ with targeted work.' };
    if (s >= 150) return { key: 'focus',  label: 'NEEDS FOCUS', blurb: 'Clear concept gaps to close first.' };
    return { key: 'foundation', label: 'FOUNDATION', blurb: 'Fundamentals before full mocks.' };
  }

  return {
    fromQuestions: fromQuestions,
    fromResults: fromResults,
    fromSession: fromSession,
    fromCounts: fromCounts,
    scaledFromWeighted: scaledFromWeighted,
    weightOf: weightOf,
    scopeFor: scopeFor,
    spread: spread,
    bandFor: bandFor,
    WEIGHTS: WEIGHTS,
    ANCHORS: ANCHORS,
    MIN: MIN,
    MAX: MAX
  };
})();
