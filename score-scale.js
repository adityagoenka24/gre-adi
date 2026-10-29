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


  /* ── ADAPTIVE ROUTING ───────────────────────────────────────────

     The mocks now serve one of three second sections depending on how
     Section 1 went, as the real test does. That has to reach the
     score, and weighting alone will not carry it: weighted accuracy
     is a ratio, so its denominator grows with the paper's difficulty
     and a perfect easy section scores exactly what a perfect hard one
     does. On the real GRE it does not — the second section you are
     routed to sets the ceiling of what the form can report.

     So each route carries a ceiling and the 130–170 result is
     compressed into 130–ceiling. Compressed, not clipped, so the top
     of the easier routes is still a slope and not a flat line: two
     students on the easy route who answered different numbers
     correctly still get different scores.

     The ceilings are the usual published shape of a section-adaptive
     form — an easy second section cannot reach the high 160s, a
     middle one stops short of the top. They are approximations of an
     algorithm ETS does not publish, which is the same caveat the
     whole estimate already carries.

     No route means no adjustment, so sectionals, topic tests and
     every stored attempt from before this existed score exactly as
     they did. */
  var ROUTE_CEILING = { easy: 158, medium: 165, hard: MAX };

  function normRoute(r) {
    var k = String(r == null ? '' : r).toLowerCase().trim();
    return ROUTE_CEILING[k] == null ? null : k;
  }

  function applyRoute(score, route) {
    var ceiling = ROUTE_CEILING[route];
    if (ceiling == null || ceiling >= MAX) return score;
    return clampScore(MIN + (score - MIN) * (ceiling - MIN) / (MAX - MIN));
  }

  /* Which second section a Section 1 raw score earns. Thresholds are
     on the raw count, as the real test's are, and a paper may override
     them in its own meta so a form can be tuned without a code change.

     This lives here, beside the scoring, because the routing decision
     and the ceiling it implies have to agree — a page picking the hard
     section while the score thinks it served the easy one would report
     a number nobody can reproduce. */
  var DEFAULT_ROUTING = { medium: 6, hard: 9 };

  function routeFor(correct, total, routing) {
    var r = routing || DEFAULT_ROUTING;
    var n = Number(correct) || 0;
    // Thresholds are written for a 12-question Section 1; a different
    // length is scaled so the same proportions apply.
    var scale = (Number(total) || 12) / 12;
    if (n >= (Number(r.hard) || DEFAULT_ROUTING.hard) * scale) return 'hard';
    if (n >= (Number(r.medium) || DEFAULT_ROUTING.medium) * scale) return 'medium';
    return 'easy';
  }

  /* The Section 2 form a route should be served, given what the paper
     actually carries. Papers built before three forms existed only have
     `easy` and `hard`, and a paper may yet be built with one more or one
     fewer, so this walks outwards from the wanted level rather than
     assuming. Returns { form, questions } or null. */
  var ROUTE_ORDER = ['easy', 'medium', 'hard'];

  function pickForm(forms, route) {
    if (!forms || typeof forms !== 'object') return null;
    var want = normRoute(route) || 'medium';
    var at = ROUTE_ORDER.indexOf(want);
    for (var step = 0; step < ROUTE_ORDER.length; step++) {
      // The wanted level, then one step down, then one step up: a student
      // routed to `medium` on a two-form paper sits the easier section,
      // which is the cautious way round.
      var tries = step === 0 ? [at] : [at - step, at + step];
      for (var k = 0; k < tries.length; k++) {
        var name = ROUTE_ORDER[tries[k]];
        if (name && Array.isArray(forms[name]) && forms[name].length) {
          return { form: name, questions: forms[name] };
        }
      }
    }
    // A paper with form names we do not know: take the first usable one.
    for (var key in forms) {
      if (Array.isArray(forms[key]) && forms[key].length) return { form: key, questions: forms[key] };
    }
    return null;
  }

  var ROUTE_LABEL = {
    easy: 'Section 2 was the easier form, which is what a section-adaptive test serves after a weaker Section 1. The highest score reachable on it is about ' + ROUTE_CEILING.easy + '.',
    medium: 'Section 2 was the middle form, served after a solid Section 1. The highest score reachable on it is about ' + ROUTE_CEILING.medium + '.',
    hard: 'Section 2 was the hardest form, served after a strong Section 1, so the full range was reachable.'
  };

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
    var route = normRoute(opts.route);
    var scaled = applyRoute(scaledFromWeighted(wacc), route);
    var half = opts.spread == null ? spread(total, sc) : opts.spread;
    var conf = confidenceOf(total, sc);
    // The band is capped by the same ceiling, or a 157 on the easy route
    // would advertise a 160 it could not have produced.
    var ceiling = route ? ROUTE_CEILING[route] : MAX;
    var lo = Math.max(MIN, scaled - half), hi = Math.min(ceiling, scaled + half);
    return {
      scaled: scaled,
      low: lo,
      high: hi,
      range: lo + '–' + hi,
      spread: half,
      route: route,
      route_ceiling: route ? ceiling : null,
      wacc: Math.round(wacc * 1000) / 1000,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      correct: correct,
      total: total,
      scope: sc,
      graded: graded,
      confidence: conf,
      note: noteFor(sc, total, conf) + (route ? ' ' + ROUTE_LABEL[route] : ''),
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
    // A stored adaptive mock has to re-score to the number the student was
    // shown, so the form they were served travels with the session. Older
    // sessions carry none and score exactly as they always did.
    var route = normRoute(session.adaptive_route || session.section_2_form);
    return fromQuestions(session.questions, scopeFor(session.session_type),
      route ? { route: route } : undefined);
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
    routeFor: routeFor,
    pickForm: pickForm,
    ROUTE_CEILING: ROUTE_CEILING,
    ROUTE_LABEL: ROUTE_LABEL,
    DEFAULT_ROUTING: DEFAULT_ROUTING,
    WEIGHTS: WEIGHTS,
    ANCHORS: ANCHORS,
    MIN: MIN,
    MAX: MAX
  };
})();
