/* ============================================================
   GREProgressLocal — free-tier session history (browser only)

   Free practice is deliberately NOT stored on the server. But every
   free surface records its sessions here, in this browser, for two
   reasons:

     1. The locked-history upgrade panel can quote a real number
        ("4 sessions saved") instead of a generic pitch.
     2. When the student upgrades and logs into the Pro app in this
        same browser, pro/gre_practice_logger_pro.html reads this key
        and uploads the lot, so their Pro trend starts populated
        instead of empty. Same origin, so this works.

   One key, one cap, one implementation — shared by the free practice
   logger, sectional.html, full_mock.html and the event mocks, so the
   count and the carry-over stay consistent across all of them.

   Best-effort by nature: localStorage is per-browser and the student
   may clear it. Nothing in the UI promises otherwise.

   Include before the page's own script:
     <script src="progress-local.js"></script>
   (from events/, use "../progress-local.js")
   ============================================================ */
window.GREProgressLocal = (function () {
  var KEY = 'gqp_free_sessions';
  var MAX = 50;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function count() { return read().length; }

  /* Appends a v2.0 session object. Returns the new history length. */
  function record(session) {
    if (!session || !session.questions || !session.questions.length) return count();
    try {
      var history = read();
      history.push(session);
      var trimmed = history.slice(-MAX); // oldest fall off first
      localStorage.setItem(KEY, JSON.stringify(trimmed));
      return trimmed.length;
    } catch (e) {
      // Quota full or storage blocked. The student's result screen is
      // unaffected; only the carry-over is lost.
      return count();
    }
  }

  function capWord(s) {
    return s ? String(s).replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim() : '';
  }

  /* Converts the submission payload used by sectional.html and the event
     mocks (a flat `results` array with time_taken_seconds) into the v2.0
     session shape the Pro dashboard consumes, then records it.

     opts: { session_type, topic, label } — all optional. */
  function recordAttemptPayload(payload, opts) {
    if (!payload || !payload.results || !payload.results.length) return count();
    opts = opts || {};

    var topicName = capWord(
      opts.topic ||
      (payload.sectional && payload.sectional.topic_name) ||
      payload.event_name || 'Practice'
    );
    var setNo = (payload.sectional && payload.sectional.set) || '';
    var label = opts.label || (topicName + (setNo ? ' Set ' + setNo : ''));

    // Real timestamps, so two attempts at the same set on the same day stay
    // distinct once they reach the server (its session id is content-derived).
    var endedAt = Date.parse(payload.submitted_at || '') || Date.now();
    var startedAt = endedAt - (Number(payload.total_time_seconds) || 0) * 1000;

    var questions = payload.results.map(function (r, i) {
      var given = r.given_answer;
      return {
        id: i + 1,
        startTime: null,
        endTime: null,
        timeTaken: Number(r.time_taken_seconds) || 0,
        type: r.type === 'numeric_entry' ? 'numeric'
            : (r.type === 'multiple_answer' ? 'multi' : 'mcq'),
        answers: given ? String(given).split(',') : [],
        numericAnswer: r.type === 'numeric_entry' ? String(given || '') : '',
        topic: capWord(r.topic) || topicName,
        subtopic: capWord(r.subtopic) || capWord(r.topic) || '',
        correct: r.skipped ? null : !!r.correct,
        difficulty: capWord(r.difficulty),
        notes: '',
        submitted: !r.skipped,
        bank_question_id: r.id,
        source: label
      };
    });

    return record({
      studentName: (payload.student && payload.student.name) || 'Student',
      date: new Date(endedAt).toISOString().slice(0, 10),
      topic: topicName,
      subtopic: setNo ? 'Set ' + setNo : '',
      source: label,
      notes: label + ' — ' + questions.length + ' questions',
      startTime: startedAt,
      endTime: endedAt,
      questions: questions,
      exportedAt: new Date().toISOString(),
      version: '2.0',
      session_type: opts.session_type || 'practice'
    });
  }

  /* Name + email the student typed on a free attempt, remembered in this
     browser so the next mock, sectional or event is pre-filled. The same
     two values are what the coach view lists against each attempt. */
  var STUDENT_KEY = 'gqp_free_student';
  function student() {
    try {
      var o = JSON.parse(localStorage.getItem(STUDENT_KEY) || '{}') || {};
      return { name: String(o.name || ''), email: String(o.email || '') };
    } catch (e) { return { name: '', email: '' }; }
  }
  function rememberStudent(name, email) {
    try { localStorage.setItem(STUDENT_KEY, JSON.stringify({ name: name, email: email })); } catch (e) {}
  }
  function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim()); }

  return {
    read: read,
    count: count,
    record: record,
    student: student,
    rememberStudent: rememberStudent,
    validEmail: validEmail,
    recordAttemptPayload: recordAttemptPayload,
    capWord: capWord,
    KEY: KEY,
    MAX: MAX
  };
})();
