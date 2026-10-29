const Events = (() => {
  const SUBMISSION_ENDPOINT = "https://gre-auth.goenka-aditya-kol.workers.dev/mock/submission";
  const $ = (id) => document.getElementById(id);
  const state = { config: null, current: 0, answers: [], qTimes: [], qStartedAt: 0, startedAt: null, submitted: false, timer: null, remaining: 0,
    sectionIndex: 0, sectionStartedAt: 0, sectionUsed: [], onBreak: false, marked: [], timerHidden: false, timerLimit: 0 };

  // ── Full-mock events: a paper split into timed sections ──────────────────
  // A config with 2+ entries in `sections` runs like the real test: each
  // section has its own timer, the student moves freely inside the current
  // section, and once a section ends it can't be reopened. Every question
  // carries a 0-based `section` index. Configs without `sections` (topic
  // tests) take none of these paths.
  function isSectioned() {
    return !!state.config && Array.isArray(state.config.sections) && state.config.sections.length > 1;
  }
  function sectionBounds(si) {
    let first = -1, last = -1;
    state.config.questions.forEach((q, i) => {
      if ((q.section || 0) === si) { if (first < 0) first = i; last = i; }
    });
    return [first, last];
  }
  function currentBounds() {
    return isSectioned() ? sectionBounds(state.sectionIndex) : [0, state.config.questions.length - 1];
  }
  function questionLabel(i) {
    return isSectioned() ? i - sectionBounds(state.config.questions[i].section || 0)[0] + 1 : i + 1;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function slug(value) {
    return String(value || "event").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "event";
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function downloadText(filename, text, type = "text/plain") {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function answerLetter(value) {
    const text = String(value ?? "").trim();
    const match = text.match(/^[A-E]/i);
    return match ? match[0].toUpperCase() : text.toUpperCase();
  }

  function normalizeAnswer(value) {
    if (Array.isArray(value)) return value.map(answerLetter).sort().join(",");
    return String(value ?? "").trim().replace(/\s+/g, " ");
  }

  function isNumericEqual(a, b) {
    const na = Number(String(a).trim());
    const nb = Number(String(b).trim());
    return Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1e-9;
  }

  function isCorrect(question, studentAnswer) {
    if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "" || (Array.isArray(studentAnswer) && !studentAnswer.length)) return false;
    if (question.type === "numeric_entry") return isNumericEqual(studentAnswer, question.answer) || normalizeAnswer(studentAnswer).toLowerCase() === normalizeAnswer(question.answer).toLowerCase();
    if (question.type === "multiple_answer") return normalizeAnswer(studentAnswer) === normalizeAnswer(question.answer);
    return answerLetter(studentAnswer) === answerLetter(question.answer);
  }

  function typeLabel(type) {
    return {
      mcq: "MCQ",
      numeric_entry: "Numeric Entry",
      quantitative_comparison: "Quant Comp.",
      multiple_answer: "Multi-Answer"
    }[type] || String(type || "Question");
  }

  function difficultyLabel(diff) {
    return String(diff || "unspecified").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  async function loadConfig(defaultPath = "config/current.json", useQueryParam = true) {
    const params = new URLSearchParams(location.search);
    const configPath = useQueryParam ? params.get("config") || defaultPath : defaultPath;
    const config = await loadJson(configPath);
    if ((config.active_config || config.config_path) && !Array.isArray(config.questions)) {
      const target = String(config.active_config || config.config_path).trim();
      const resolvedPath = target.includes("/") ? target : `config/${target}`;
      return loadConfig(resolvedPath, false);
    }
    if (config.shuffle_questions_for_students) {
      if (Array.isArray(config.sections) && config.sections.length > 1) {
        // Shuffle inside each section so a question never crosses into the other one.
        config.questions = config.sections.flatMap((_, si) => shuffle((config.questions || []).filter((q) => (q.section || 0) === si)));
      } else {
        config.questions = shuffle(config.questions || []);
      }
    }
    return config;
  }

  function enrichQuestion(question, topic, subtopic) {
    return {
      ...question,
      topic: question.topic || topic || "Mixed",
      subtopic: question.subtopic || subtopic || "Mixed"
    };
  }

  function summarize(results) {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const skipped = results.filter((r) => r.skipped).length;
    const incorrect = total - correct - skipped;
    const totalTime = results.reduce((sum, r) => sum + (Number(r.time_taken_seconds) || 0), 0);
    return {
      score: correct,
      total_questions: total,
      accuracy: total ? Number(((correct / total) * 100).toFixed(2)) : 0,
      correct,
      incorrect,
      skipped,
      total_time_seconds: totalTime,
      average_time_seconds: total ? Number((totalTime / total).toFixed(1)) : 0
    };
  }

  function breakdown(results, key) {
    const map = new Map();
    for (const r of results) {
      const k = r[key] || "Unspecified";
      if (!map.has(k)) map.set(k, { label: k, total: 0, correct: 0, skipped: 0, time: 0 });
      const item = map.get(k);
      item.total += 1;
      item.correct += r.correct ? 1 : 0;
      item.skipped += r.skipped ? 1 : 0;
      item.time += Number(r.time_taken_seconds) || 0;
    }
    return [...map.values()].map((item) => ({
      ...item,
      accuracy: item.total ? Number(((item.correct / item.total) * 100).toFixed(2)) : 0,
      avg_time_seconds: item.total ? Number((item.time / item.total).toFixed(1)) : 0
    }));
  }

  function weakestBreakdown(items, minTotal = 1) {
    return [...(items || [])]
      .filter((item) => item.total >= minTotal)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total || b.avg_time_seconds - a.avg_time_seconds)[0] || null;
  }

  function strongestBreakdown(items, minTotal = 1) {
    return [...(items || [])]
      .filter((item) => item.total >= minTotal)
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0] || null;
  }

  function performanceBand(accuracy) {
    if (accuracy >= 85) return { label: "Strong", tone: "strong", summary: "Your accuracy is already in a good zone. The next gain is speed and consistency." };
    if (accuracy >= 70) return { label: "Close", tone: "close", summary: "You are close. A few recurring errors are costing more than a lack of ability." };
    if (accuracy >= 50) return { label: "Needs Focus", tone: "focus", summary: "You have enough base to build from, but the weak areas need targeted practice." };
    return { label: "High Risk", tone: "risk", summary: "This score pattern needs structured recovery before the next full GRE-style attempt." };
  }

  function getPrimaryWeakArea(result) {
    const minTotal = result.total_questions >= 8 ? 2 : 1;
    const subtopic = weakestBreakdown(result.breakdowns.subtopic, minTotal);
    const topic = weakestBreakdown(result.breakdowns.topic, minTotal);
    const type = weakestBreakdown(result.breakdowns.type, minTotal);
    const difficulty = weakestBreakdown(result.breakdowns.difficulty, minTotal);
    return subtopic || topic || type || difficulty || null;
  }

  function getTimingDiagnosis(result) {
    const attempted = (result.results || []).filter((r) => !r.skipped);
    const slow = attempted.filter((r) => {
      const expected = Number(r.estimated_time_seconds) || 90;
      return (Number(r.time_taken_seconds) || 0) > expected * 1.2;
    });
    const fastWrong = attempted.filter((r) => {
      const expected = Number(r.estimated_time_seconds) || 90;
      return !r.correct && (Number(r.time_taken_seconds) || 0) < expected * 0.55;
    });
    if (slow.length >= Math.max(2, Math.ceil(attempted.length * 0.25))) {
      return {
        label: "Time pressure",
        detail: `${slow.length} question${slow.length === 1 ? "" : "s"} took much longer than the suggested pace. Accuracy may drop when the clock gets tight.`,
        recommendation: "Do one untimed concept round, then repeat the same area at 1:45 per question."
      };
    }
    if (fastWrong.length >= Math.max(2, Math.ceil(attempted.length * 0.2))) {
      return {
        label: "Rushed mistakes",
        detail: `${fastWrong.length} wrong answer${fastWrong.length === 1 ? "" : "s"} came very quickly. That usually means the trap was accepted before the question was fully parsed.`,
        recommendation: "Pause for 5 seconds on hard questions and name what the question is really asking before calculating."
      };
    }
    return {
      label: "Pace is usable",
      detail: `Average pace was ${formatTime(result.average_time_seconds)} per question. The bigger opportunity is accuracy inside weak areas.`,
      recommendation: "Keep the timer on, but make the next practice set topic-specific."
    };
  }

  function getTrapDiagnosis(result) {
    const wrong = (result.results || []).filter((r) => !r.correct);
    const tagged = new Map();
    wrong.forEach((r) => (r.tags || []).forEach((tag) => {
      const label = String(tag || "").replace(/[-_]+/g, " ").trim();
      if (!label) return;
      tagged.set(label, (tagged.get(label) || 0) + 1);
    }));
    const repeatedTag = [...tagged.entries()].sort((a, b) => b[1] - a[1])[0];
    const sampleTrap = wrong.find((r) => r.trap)?.trap || "";
    if (repeatedTag && repeatedTag[1] >= 2) {
      return {
        label: repeatedTag[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        detail: `This trap pattern appeared ${repeatedTag[1]} times in your misses.`,
        sample: sampleTrap
      };
    }
    if (sampleTrap) {
      return {
        label: "Question-specific trap",
        detail: "Your misses were not random. At least one had a clear GRE-style trap pattern.",
        sample: sampleTrap
      };
    }
    if (!wrong.length) {
      return {
        label: "No major trap exposed",
        detail: "No wrong-answer trap was exposed in this attempt.",
        sample: "Now the goal is to prove the same accuracy across harder and mixed sets."
      };
    }
    return {
      label: "Review needed",
      detail: "The missed questions need a second pass to separate concept gaps from careless errors.",
      sample: "Redo each missed question without looking at the solution, then compare your reasoning."
    };
  }

  function buildDiagnosis(result) {
    const band = performanceBand(result.accuracy);
    const weakArea = getPrimaryWeakArea(result);
    const strongest = strongestBreakdown(result.breakdowns.subtopic) || strongestBreakdown(result.breakdowns.topic);
    const timing = getTimingDiagnosis(result);
    const trap = getTrapDiagnosis(result);
    const weakLabel = weakArea ? weakArea.label : "Mixed Quant";
    const weakDetail = weakArea
      ? `${weakArea.correct}/${weakArea.total} correct (${weakArea.accuracy}%) with ${formatTime(weakArea.avg_time_seconds)} average time.`
      : "This mock was too small to isolate one weak zone reliably.";
    const mainIssue = result.skipped >= Math.max(2, Math.ceil(result.total_questions * 0.2))
      ? "Unanswered questions are pulling the score down."
      : result.accuracy < 70
        ? `${weakLabel} needs the next focused practice block.`
        : `${weakLabel} is the best place to chase the next few points.`;
    const recoveryPlan = [
      `Redo the missed ${weakLabel} questions once without the solution open.`,
      `Practice 15-20 ${weakLabel} questions in Pro, starting untimed if accuracy is below 70%.`,
      `Finish with a timed set at GRE pace and check whether the same trap appears again.`
    ];
    return {
      band,
      main_issue: mainIssue,
      weak_area: weakArea ? { label: weakLabel, detail: weakDetail } : { label: weakLabel, detail: weakDetail },
      strongest_area: strongest ? `${strongest.label} (${strongest.accuracy}%)` : "Not enough data yet",
      timing,
      trap,
      recovery_plan: recoveryPlan,
      pro_recommendation: `Start your next Pro session with ${weakLabel}.`
    };
  }

  function buildResult(student) {
    const submittedAt = new Date();
    const results = state.config.questions.map((q, i) => {
      const answer = state.answers[i];
      const skipped = answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && !answer.length);
      return {
        question_id: q.id,
        question_text: q.question || "",
        student_answer: skipped ? null : answer,
        correct_answer: q.answer,
        correct: isCorrect(q, answer),
        skipped,
        time_taken_seconds: Math.max(0, Math.round(state.qTimes[i] || 0)),
        estimated_time_seconds: q.estimated_time_seconds || 90,
        difficulty: q.difficulty || "unspecified",
        type: q.type || "unspecified",
        topic: q.topic || "Mixed",
        subtopic: q.subtopic || "Mixed",
        tags: q.tags || [],
        explanation: q.explanation || "",
        trap: q.trap || "",
        ...(isSectioned() ? { section: (q.section || 0) + 1 } : {})
      };
    });
    const summary = summarize(results);
    const result = {
      event_id: state.config.event_id,
      event_name: state.config.event_name,
      event_type: state.config.event_type,
      student,
      started_at: state.startedAt.toISOString(),
      submitted_at: submittedAt.toISOString(),
      total_time_seconds: isSectioned()
        ? Math.max(0, Math.round(state.sectionUsed.reduce((sum, t) => sum + (t || 0), 0)))
        : Math.max(0, Math.round((submittedAt - state.startedAt) / 1000)),
      score: summary.score,
      total_questions: summary.total_questions,
      accuracy: summary.accuracy,
      correct: summary.correct,
      incorrect: summary.incorrect,
      skipped: summary.skipped,
      average_time_seconds: summary.average_time_seconds,
      breakdowns: {
        topic: breakdown(results, "topic"),
        subtopic: breakdown(results, "subtopic"),
        difficulty: breakdown(results, "difficulty"),
        type: breakdown(results, "type")
      },
      results
    };
    if (isSectioned()) {
      result.sections = state.config.sections.map((sec, si) => {
        const rows = results.filter((r) => r.section === si + 1);
        const correct = rows.filter((r) => r.correct).length;
        const skipped = rows.filter((r) => r.skipped).length;
        return {
          section: si + 1,
          name: sec.name || `Section ${si + 1}`,
          total: rows.length,
          correct,
          incorrect: rows.length - correct - skipped,
          skipped,
          accuracy: rows.length ? Number(((correct / rows.length) * 100).toFixed(2)) : 0,
          time_limit_seconds: Number(sec.time_limit_seconds) || 0,
          time_used_seconds: Math.round(state.sectionUsed[si] || 0)
        };
      });
    }
    result.tier = "free";
    result.diagnosis = buildDiagnosis(result);
    return result;
  }

  function setQuestionTime(index) {
    if (!state.qStartedAt || state.submitted) return;
    const now = Date.now();
    state.qTimes[index] = (state.qTimes[index] || 0) + (now - state.qStartedAt) / 1000;
    state.qStartedAt = now;
  }

  // ── GRE-replica exam shell ───────────────────────────────────────────────
  // Same interface as full_mock.html: control bar (Exit / Calculator / Help /
  // Mark / Review / Back / Next), timer strip, one question at a time, a
  // Review table and ETS-style dialogs. The data model is unchanged:
  // state.answers[i] holds "A", ["A","C"] or "12.5", exactly as before.
  const TYPE_DIRECTIONS = {
    mcq: "Select one answer choice.",
    quantitative_comparison: "Compare Quantity A and Quantity B, using additional information given, if any. Select one answer choice.",
    numeric_entry: "Enter your answer in the box.",
    multiple_answer: "Select one or more answer choices. Select all that apply."
  };

  function hasAnswer(i) {
    const a = state.answers[i];
    return !!(a && (!Array.isArray(a) || a.length));
  }

  function clock(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  }

  function showModal(title, bodyHtml, buttons) {
    $("gre-modal-title").textContent = title;
    $("gre-modal-body").innerHTML = bodyHtml;
    const actions = $("gre-modal-actions");
    actions.innerHTML = "";
    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = "btn " + (b.cls || "btn-ghost");
      btn.textContent = b.label;
      btn.onclick = () => { closeModal(); if (b.action) b.action(); };
      actions.appendChild(btn);
    });
    $("gre-modal").classList.add("open");
  }
  function closeModal() { const m = $("gre-modal"); if (m) m.classList.remove("open"); }

  function showExam() {
    $("examSection").classList.remove("hidden");
    document.body.classList.add("gre-exam-open");
  }
  function hideExam() {
    closeModal();
    if (window.GRECalc) window.GRECalc.close();
    $("examSection").classList.add("hidden");
    document.body.classList.remove("gre-exam-open");
  }

  function parseQC(text) {
    const isQ = (line, x) => new RegExp("^\\s*(Column|Quantity)\\s*" + x + "\\s*:", "i").test(line);
    const lines = String(text || "").split("\n");
    return {
      info: lines.filter((line) => !isQ(line, "A") && !isQ(line, "B")).join("\n").trim(),
      a: (lines.find((line) => isQ(line, "A")) || "—").replace(/^\s*(Column|Quantity)\s*A\s*:/i, "").trim(),
      b: (lines.find((line) => isQ(line, "B")) || "—").replace(/^\s*(Column|Quantity)\s*B\s*:/i, "").trim()
    };
  }

  function qcOptionText(option) {
    return String(option).replace(/^[A-E]\.\s*/, "").replace(/Column\s+A/g, "Quantity A").replace(/Column\s+B/g, "Quantity B")
      .replace(/The two columns are equal/i, "The two quantities are equal");
  }

  function renderQuestion() {
    const q = state.config.questions[state.current];
    closeReviewPanel();
    const figure = window.GREExhibit ? window.GREExhibit.html(q) : (q.svg ? `<div class="gre-svg">${q.svg}</div>` : "");
    const directions = TYPE_DIRECTIONS[q.type] || "";
    $("eventQuestionArea").innerHTML = `${directions ? `<div class="gre-directions">${directions}</div>` : ""}${renderAnswerControl(q, state.answers[state.current], figure)}`;
    if (window.GREMath) window.GREMath.renderIn($("eventQuestionArea"));
    renderNav();
    $("gre-body").scrollTop = 0;
  }

  function optionRow(letter, text, selected, multiple) {
    return `<label class="gre-option${selected ? " selected" : ""}">
      <input type="${multiple ? "checkbox" : "radio"}" ${multiple ? "" : 'name="gre-q" '}value="${letter}" ${selected ? "checked" : ""} onchange="Events.chooseOption('${letter}', ${multiple})">
      <span class="opt-body">${escapeHtml(text)}</span>
    </label>`;
  }

  function renderAnswerControl(q, currentAnswer, figure) {
    if (q.type === "numeric_entry") {
      return `<div class="gre-qtext">${escapeHtml(q.question)}</div>${figure}
        <div class="gre-ne"><input id="ne-input" type="text" inputmode="decimal" autocomplete="off" aria-label="Your answer" value="${escapeHtml(currentAnswer || "")}" oninput="Events.setAnswer(this.value)"></div>`;
    }
    if (q.type === "quantitative_comparison" && /(Column|Quantity)\s*[AB]\s*:/i.test(q.question || "")) {
      const qc = parseQC(q.question);
      const picked = Array.isArray(currentAnswer) ? currentAnswer[0] : currentAnswer;
      return `${qc.info ? `<div class="gre-qc-info">${escapeHtml(qc.info)}</div>` : ""}${figure}
        <div class="gre-qc-grid">
          <div class="gre-qc-col"><div class="gre-qc-head">Quantity A</div><div class="gre-qc-val">${escapeHtml(qc.a)}</div></div>
          <div class="gre-qc-col"><div class="gre-qc-head">Quantity B</div><div class="gre-qc-val">${escapeHtml(qc.b)}</div></div>
        </div>
        <div class="gre-options" role="radiogroup" aria-label="Answer choices">${(q.options || []).map((option) => {
          const letter = answerLetter(option);
          return optionRow(letter, qcOptionText(option), picked === letter, false);
        }).join("")}</div>`;
    }
    const multiple = q.type === "multiple_answer";
    const selected = new Set(Array.isArray(currentAnswer) ? currentAnswer : currentAnswer ? [currentAnswer] : []);
    return `<div class="gre-qtext">${escapeHtml(q.question)}</div>${figure}
      <div class="gre-options" role="${multiple ? "group" : "radiogroup"}" aria-label="Answer choices">${(q.options || []).map((option) => {
        const letter = answerLetter(option);
        return optionRow(letter, String(option).replace(/^[A-E]\.\s*/, ""), selected.has(letter), multiple);
      }).join("")}</div>`;
  }

  // Everything on the control bar that depends on where the student is.
  function renderNav() {
    const [secFirst, secLast] = currentBounds();
    const locked = state.config.allow_navigation === false;
    $("gre-sec-label").textContent = isSectioned() ? `Section ${state.sectionIndex + 1} of ${state.config.sections.length}` : (state.config.event_name || "GRE Quant Mock");
    $("gre-q-label").textContent = `Question ${questionLabel(state.current)} of ${secLast - secFirst + 1}`;
    $("btn-prev").disabled = locked || state.current <= secFirst;
    $("btn-next").disabled = state.current >= secLast;
    $("btn-review").hidden = locked;
    const marked = !!state.marked[state.current];
    $("btn-mark").classList.toggle("marked", marked);
    $("btn-mark").setAttribute("aria-pressed", marked ? "true" : "false");
  }

  function chooseOption(letter, multiple) {
    if (multiple) {
      const current = new Set(Array.isArray(state.answers[state.current]) ? state.answers[state.current] : []);
      current.has(letter) ? current.delete(letter) : current.add(letter);
      state.answers[state.current] = [...current].sort();
    } else {
      state.answers[state.current] = letter;
    }
    // Update the rows in place so the page does not jump or lose focus.
    const chosen = new Set(Array.isArray(state.answers[state.current]) ? state.answers[state.current] : [state.answers[state.current]]);
    document.querySelectorAll("#eventQuestionArea .gre-option").forEach((row) => {
      const input = row.querySelector("input");
      row.classList.toggle("selected", chosen.has(input.value));
    });
    renderNav();
  }

  function setAnswer(value) {
    state.answers[state.current] = value;
  }

  function toggleMark() {
    if (state.submitted || state.onBreak) return;
    state.marked[state.current] = !state.marked[state.current];
    renderNav();
  }

  function goQuestion(index) {
    const [secFirst, secLast] = currentBounds();
    if (index < secFirst || index > secLast) return;
    if (state.config.allow_navigation === false && index !== state.current + 1) return;
    setQuestionTime(state.current);
    state.current = index;
    state.qStartedAt = Date.now();   // also restarts the clock after a visit to Review
    renderQuestion();
  }

  function nextQuestion() {
    if (state.current < currentBounds()[1]) goQuestion(state.current + 1);
  }

  function prevQuestion() {
    if (state.config.allow_navigation === false) return;
    if (state.current > currentBounds()[0]) goQuestion(state.current - 1);
  }

  // ── Review screen: status of every question in this section ──────────────
  function openReview() {
    if (state.submitted || state.onBreak || state.config.allow_navigation === false) return;
    setQuestionTime(state.current);
    state.qStartedAt = 0;            // time on the Review screen is not charged to a question
    const [secFirst, secLast] = currentBounds();
    let answered = 0;
    const rows = [];
    for (let i = secFirst; i <= secLast; i++) {
      const done = hasAnswer(i);
      if (done) answered += 1;
      rows.push(`<tr class="go" onclick="Events.goQuestion(${i})" tabindex="0" onkeydown="if(event.key==='Enter')Events.goQuestion(${i})" aria-label="Go to question ${questionLabel(i)}">
        <td>Question ${questionLabel(i)}${i === state.current ? " (current)" : ""}</td>
        <td class="${done ? "st-answered" : "st-unanswered"}">${done ? "Answered" : "Not Answered"}</td>
        <td>${state.marked[i] ? '<span class="mark-flag">⚑ Marked</span>' : ""}</td>
      </tr>`);
    }
    const total = secLast - secFirst + 1;
    $("gre-review-area").innerHTML = `
      <h2>Review${isSectioned() ? ` — Section ${state.sectionIndex + 1}` : ""}</h2>
      <p>Below is the status of each question. Select a question to return to it. ${answered} of ${total} answered.</p>
      <table class="gre-review-table">
        <thead><tr><th scope="col">Question</th><th scope="col">Status</th><th scope="col">Marked</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
      <div class="gre-review-actions">
        <button class="btn btn-primary" onclick="Events.returnFromReview()">Return to Question</button>
        <button class="btn btn-outline" onclick="Events.confirmExit()">${isSectioned() ? "Exit Section" : "Submit Test"}</button>
      </div>`;
    $("eventQuestionArea").style.display = "none";
    $("gre-review-area").style.display = "block";
    $("gre-body").scrollTop = 0;
  }

  function closeReviewPanel() {
    const review = $("gre-review-area");
    if (review) review.style.display = "none";
    const area = $("eventQuestionArea");
    if (area) area.style.display = "block";
  }

  function returnFromReview() {
    closeReviewPanel();
    state.qStartedAt = Date.now();
  }

  function showHelp() {
    const locked = state.config.allow_navigation === false;
    showModal("Test Help", locked
      ? `<strong>Next</strong> — move to the next question. This event is in a locked order, so you cannot go back.<br>
         <strong>Mark</strong> — flag the current question.<br>
         <strong>Calculator</strong> — open the on-screen calculator.<br>
         <strong>${isSectioned() ? "Exit Section" : "Submit Test"}</strong> — finish. You cannot return afterwards.<br><br>
         Unanswered questions count as wrong. The timer shows in the final 5 minutes even if hidden.`
      : `<strong>Back / Next</strong> — move between questions${isSectioned() ? " in this section" : ""}.<br>
         <strong>Mark</strong> — flag the current question so you can find it on the Review screen.<br>
         <strong>Review</strong> — see the answered / marked status of every question and jump to any of them.<br>
         <strong>Calculator</strong> — open the on-screen calculator.<br>
         <strong>${isSectioned() ? "Exit Section" : "Submit Test"}</strong> — finish${isSectioned() ? " this section" : ""}. You cannot return to ${isSectioned() ? "it" : "the test"} afterwards.<br><br>
         Unanswered questions count as wrong. The timer shows in the final 5 minutes even if hidden.`,
      [{ label: "Return to Test", cls: "btn-primary" }]);
  }

  // ── Timer ────────────────────────────────────────────────────────────────
  function updateTimerDisplay() {
    const limit = state.timerLimit;
    $("timer").textContent = limit ? clock(state.remaining) : "Untimed";
    const el = $("exam-timer");
    const last5 = !!limit && state.remaining <= 300;
    el.classList.toggle("urgent", last5 && state.remaining > 0);
    // Like the real test, a hidden clock comes back for the last five minutes.
    el.classList.toggle("hidden-time", !!state.timerHidden && !last5);
    $("btn-hide-time").hidden = !limit;
    $("btn-hide-time").textContent = state.timerHidden ? "Show Time" : "Hide Time";
  }

  function toggleTimer() {
    state.timerHidden = !state.timerHidden;
    updateTimerDisplay();
  }

  function startTimer() {
    clearInterval(state.timer);
    const sectioned = isSectioned();
    const limit = sectioned
      ? Number(state.config.sections[state.sectionIndex].time_limit_seconds) || 0
      : Number(state.config.timer_seconds) || 0;
    state.timerLimit = limit;
    state.remaining = limit;
    state.sectionStartedAt = Date.now();
    const tick = () => {
      updateTimerDisplay();
      if (limit && state.remaining <= 0) {
        clearInterval(state.timer);
        if (sectioned) endSection(true); else submitEvent(true);
        return;
      }
      if (state.remaining > 0) state.remaining -= 1;
    };
    tick();
    if (state.remaining) state.timer = setInterval(tick, 1000);
  }

  // ── Leaving a section ────────────────────────────────────────────────────
  function confirmExit() {
    if (state.submitted || state.onBreak) return;
    const [secFirst, secLast] = currentBounds();
    let open = 0;
    for (let i = secFirst; i <= secLast; i++) if (!hasAnswer(i)) open += 1;
    const sectioned = isSectioned();
    const final = !sectioned || state.sectionIndex >= state.config.sections.length - 1;
    const warn = open ? `<br><br><strong>You have ${open} unanswered question${open === 1 ? "" : "s"}.</strong>` : "";
    showModal(sectioned ? "Exit Section" : "Submit Test",
      `Are you sure you want to ${sectioned ? "exit this section" : "submit the test"}?${warn}<br><br>Once you exit, you cannot return to ${sectioned ? "this section" : "the test"}.${sectioned && final ? " This is the last section, so your test will be submitted." : ""}`,
      [
        { label: "Cancel", cls: "btn-ghost" },
        { label: sectioned ? "Exit Section" : "Submit Test", cls: "btn-primary", action: () => (sectioned ? endSection(false, true) : submitEvent(false)) }
      ]);
  }

  // Close the current section. The last one submits the whole paper; an
  // earlier one shows the break card, and the next section's clock only
  // starts when the student presses the button on it.
  function endSection(timedOut = false, confirmed = false) {
    if (state.submitted || state.onBreak) return;
    if (!timedOut && !confirmed) { confirmExit(); return; }
    closeModal();
    const [secFirst, secLast] = currentBounds();
    setQuestionTime(state.current);
    clearInterval(state.timer);
    state.sectionUsed[state.sectionIndex] = Math.min(
      (Date.now() - state.sectionStartedAt) / 1000,
      Number(state.config.sections[state.sectionIndex].time_limit_seconds) || Infinity
    );
    if (state.sectionIndex >= state.config.sections.length - 1) {
      submitEvent(timedOut);
      return;
    }
    let answered = 0;
    for (let i = secFirst; i <= secLast; i++) if (hasAnswer(i)) answered += 1;
    const total = secLast - secFirst + 1;
    const next = state.config.sections[state.sectionIndex + 1];
    state.onBreak = true;
    hideExam();
    $("breakTitle").textContent = timedOut ? `Time is up — Section ${state.sectionIndex + 1} ended` : `Section ${state.sectionIndex + 1} Complete`;
    $("breakPreview").innerHTML = `You answered <strong>${answered} of ${total}</strong> questions. This section is now locked.<br><br>
      Next: <strong>${escapeHtml(next.name || `Section ${state.sectionIndex + 2}`)}</strong> · ${next.question_count || ""} questions · ${formatTime(next.time_limit_seconds)}`;
    $("breakNextBtn").textContent = `Start Section ${state.sectionIndex + 2} →`;
    $("breakSection").classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function startNextSection() {
    if (!state.onBreak || state.submitted) return;
    state.onBreak = false;
    state.sectionIndex += 1;
    state.current = currentBounds()[0];
    state.qStartedAt = Date.now();
    $("breakSection").classList.add("hidden");
    showExam();
    updateExitLabel();
    renderQuestion();
    startTimer();
  }

  function updateExitLabel() {
    $("greExitLabel").textContent = isSectioned() ? "Exit Section" : "Submit Test";
    $("submitBtn").setAttribute("aria-label", $("greExitLabel").textContent);
  }

  // ── "Before you begin" ───────────────────────────────────────────────────
  function showInstructions() {
    const cfg = state.config;
    const sectioned = isSectioned();
    const locked = cfg.allow_navigation === false;
    const total = cfg.question_count || cfg.questions.length;
    $("instrHighlight").innerHTML = sectioned
      ? `<strong>This is a timed, full-length GRE Quant mock — real format, real interface.</strong><br>${cfg.sections.map((sec, i) => `<strong>Section ${i + 1}:</strong> ${sec.question_count || ""} questions · ${formatTime(sec.time_limit_seconds)}`).join(" &nbsp;|&nbsp; ")}`
      : `<strong>This is a timed GRE Quant mock — real format, real interface.</strong><br>${total} questions · ${cfg.timer_seconds ? formatTime(cfg.timer_seconds) : "Untimed"}`;
    const items = [
      locked
        ? "Questions are in a <strong>locked order</strong>. Use <strong>Next</strong> to move on; you cannot go back to a previous question."
        : "The test screen replicates the real GRE: use <strong>Back / Next</strong> to move, <strong>Mark</strong> to flag a question, and <strong>Review</strong> to see the status of every question" + (sectioned ? " in the section." : "."),
      sectioned
        ? "Each section has its own clock. Time does not carry over, and a section locks when you exit it or time runs out."
        : (cfg.timer_seconds ? "When time runs out, the test is submitted automatically." : "This event is untimed."),
      "An on-screen <strong>Calculator</strong> is available from the top bar, as on the real GRE.",
      locked ? "Once you move on from a question you cannot change your answer." : `You can change your answer any time before exiting ${sectioned ? "the section" : "the test"}.`,
      ...(sectioned ? ["There is a short break between sections. The next clock starts only when you press the button."] : []),
      "Unanswered questions count as wrong — attempt everything.",
      "No feedback is shown during the test. Your review appears as soon as you finish."
    ];
    $("instrList").innerHTML = items.map((html) => `<li><span>${html}</span></li>`).join("");
    $("beginBtn").textContent = sectioned ? "Start Section 1 →" : "Start Test →";
    $("startSection").classList.add("hidden");
    $("instructionsSection").classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function beginTest() {
    $("instructionsSection").classList.add("hidden");
    if ($("gre-strip-mock")) $("gre-strip-mock").textContent = "· " + (state.config.event_name || "");
    if (window.GQP) window.GQP.track('mock_started', {
      event_id: state.config.event_id,
      event_name: state.config.event_name,
      mode: 'solo'
    });
    state.startedAt = new Date();
    state.answers = new Array(state.config.questions.length).fill(null);
    state.qTimes = new Array(state.config.questions.length).fill(0);
    state.marked = [];
    state.timerHidden = false;
    state.qStartedAt = Date.now();
    state.sectionIndex = 0;
    state.sectionUsed = [];
    state.onBreak = false;
    state.current = 0;
    showExam();
    updateExitLabel();
    renderQuestion();
    startTimer();
  }

  function kpiCard(icon, value, label, color) {
    return `<div class="kpi-card" style="border-top:3px solid ${color};">
      <div class="kpi-icon">${icon}</div>
      <div class="kpi-value" style="color:${color};font-family:var(--font-display);font-size:28px;">${value}</div>
      <div class="kpi-label">${escapeHtml(label)}</div>
    </div>`;
  }

  function barRow(label, correct, total, pct, color) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="width:100px;font-size:13px;color:var(--text2);flex-shrink:0;">${escapeHtml(label)}</span>
      <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width 0.8s ease;"></div>
      </div>
      <span style="font-family:var(--font-mono);font-size:12px;color:${color};min-width:70px;text-align:right;">${correct}/${total} (${pct}%)</span>
    </div>`;
  }

  function renderAnalysisBars(result) {
    const dOrder = ["easy", "medium", "hard", "extreme_hard"];
    const dLabels = { easy: "Easy", medium: "Medium", hard: "Hard", extreme_hard: "Extreme" };
    const byDiff = {};
    result.results.forEach((r) => {
      const d = r.difficulty;
      if (!byDiff[d]) byDiff[d] = { total: 0, correct: 0 };
      byDiff[d].total += 1;
      if (r.correct) byDiff[d].correct += 1;
    });
    $("exam-diff-bars").innerHTML = dOrder.filter((d) => byDiff[d]).map((d) => {
      const s = byDiff[d];
      const pct = Math.round((s.correct / s.total) * 100);
      const col = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
      return barRow(dLabels[d], s.correct, s.total, pct, col);
    }).join("") || '<p style="color:var(--text3);font-size:13px;">No data</p>';

    const byType = {};
    result.results.forEach((r) => {
      const t = r.type;
      if (!byType[t]) byType[t] = { total: 0, correct: 0 };
      byType[t].total += 1;
      if (r.correct) byType[t].correct += 1;
    });
    $("exam-type-bars").innerHTML = Object.entries(byType).map(([t, s]) => {
      const pct = Math.round((s.correct / s.total) * 100);
      const col = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
      return barRow(typeLabel(t), s.correct, s.total, pct, col);
    }).join("") || '<p style="color:var(--text3);font-size:13px;">No data</p>';
  }

  function renderTimeTable(result) {
    const dLabels = { easy: "Easy", medium: "Medium", hard: "Hard", extreme_hard: "Extreme" };
    $("exam-time-table").innerHTML = `
      <table><thead><tr>
        <th>#</th><th>Difficulty</th><th>Type</th><th>Est. Time</th><th>Actual Time</th><th>Result</th>
      </tr></thead><tbody>
      ${result.results.map((r, i) => {
        const icon = r.correct ? "✅" : r.skipped ? "⏭" : "❌";
        return `<tr>
          <td style="font-family:var(--font-mono);">${r.section ? `S${r.section}·Q${result.results.slice(0, i).filter((x) => x.section === r.section).length + 1}` : `Q${i + 1}`}</td>
          <td><span class="tag tag-${escapeHtml(String(r.difficulty).replace("_", "-"))}">${escapeHtml(dLabels[r.difficulty] || difficultyLabel(r.difficulty))}</span></td>
          <td style="font-size:12px;color:var(--text2);">${escapeHtml(typeLabel(r.type))}</td>
          <td style="font-family:var(--font-mono);font-size:12px;color:var(--text3);">${formatTime(r.estimated_time_seconds || 90)}</td>
          <td style="font-family:var(--font-mono);font-size:12px;color:var(--text3);">${formatTime(r.time_taken_seconds || 0)}</td>
          <td>${icon}</td>
        </tr>`;
      }).join("")}
      </tbody></table>`;
  }

  // ── Log Error (review only) ───────────────────────────────────────────────
  // Lives in memory for this attempt. It is written into the downloaded JSON
  // and nowhere else: not sent to the server, not kept in browser storage.
  const LE_TYPES = ["Concept gap", "Calculation slip", "Misread the question", "Fell for the trap", "Ran out of time", "Guessed", "Other"];
  let errorLog = {};   // result index -> { type, note }
  let errorMeta = {};  // result index -> question details, registered as the review renders

  /* ── MANDATORY ERROR LOG ────────────────────────────────────────────────
     Same gate as the Pro sessions (pro/error-log.js): every wrong or skipped
     question must be tagged before the result can be downloaded or sent, and
     a student who leaves mid-way is held at the door next time. If that script
     did not load, or the Worker has no log tables yet, this all stays out of the
     way and the optional box below is what the student sees. */
  let evReview = null;       // pro/error-log.js controller for this attempt
  let evResult = null;
  let evInsightsShown = false;
  let evUnloadWired = false;

  function setupEventLog(result) {
    if (evReview) { try { evReview.dispose(); } catch (e) { /* already gone */ } }
    evReview = null; evResult = result; evInsightsShown = false;
    if (!window.GREErrorLog) return false;
    const rv = window.GREErrorLog.review({ kind: "event", blocking: true, onUpdate: syncEventLog });
    (result.results || []).forEach((r, i) => {
      if (r.correct) return;
      rv.require(i, { status: r.skipped ? "skipped" : "wrong", time: r.time_taken_seconds, difficulty: r.difficulty, question_id: r.question_id });
    });
    evReview = rv;
    if (!evUnloadWired) {
      evUnloadWired = true;
      window.addEventListener("beforeunload", (e) => {
        if (window.GREErrorLog && window.GREErrorLog.isBlocking()) { e.preventDefault(); e.returnValue = ""; }
      });
    }
    return true;
  }

  function syncEventLog() {
    if (!window.GREErrorLog) return;
    const blocking = window.GREErrorLog.isBlocking();
    window.GREErrorLog.setLocked([$("downloadResultBtn"), $("emailResultBtn")], blocking, "Log your mistakes first");
  }

  // The review-first gate lets go: the score and analysis are now on screen. A
  // student who finished the log gets the mistake pattern on top; one the coach
  // cleared gets everything else and a note about what is missing.
  function onEventRelease(info) {
    syncEventLog();
    if (info.reason !== "proceed" || !evReview || !evReview.order.length) return;
    if (info.waived) {
      const host = document.getElementById("ev-insights");
      if (host) host.innerHTML = `<div class="notice" style="margin-bottom:24px;">${info.clearedBy === "waived" ? "Our coaching team cleared your error log" : "Your error log is already cleared"}, so the mistake-pattern analysis is skipped for this attempt. Everything else is below.</div>`;
      return;
    }
    if (!evInsightsShown) showEventInsights();
  }

  // What Pro shows after every session, from the tags just logged: the payoff.
  function showEventInsights() {
    const host = document.getElementById("ev-insights");
    if (!host || !evResult) return;
    evInsightsShown = true;
    const G = window.GREErrorLog;
    const tags = evReview.entries(false);
    const qs = G.fromEventAttempts([{ attempt_id: "me", date: String(evResult.submitted_at || "").slice(0, 10), result: evResult, tags }]);
    const counts = {};
    tags.forEach((t) => { counts[t.error_type] = (counts[t.error_type] || 0) + 1; });
    const summary = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((k) => `${G.typeLabel(k)} × ${counts[k]}`).join(" · ");
    const full = qs.filter((q) => q.correct !== true).length >= 3;
    host.innerHTML = `<div class="table-card" style="margin-bottom:24px;">
      <h3>Your mistake pattern</h3>
      <p style="margin:6px 0 14px;font-size:13px;color:var(--text2);">Built from the tags you just logged. This is what Pro builds for you after every session.</p>
      <div id="ev-ins-body" class="gel-paper">${full ? "" : `<p style="margin:0;font-size:14px;">You logged ${tags.length} ${tags.length === 1 ? "mistake" : "mistakes"}: ${escapeHtml(summary)}. With three or more, this opens into a full breakdown of where they come from.</p>`}</div>
      <div class="pro-analysis-cta" style="margin-top:16px;">
        <div>
          <h3>This is one mock. Pro shows the whole picture.</h3>
          <p>Your tags carry across every Pro session: how each mistake type is trending, a map of mistakes against all 88 subtopics, and a ranked list of exactly what to practise next.</p>
        </div>
        <a class="primary-btn" href="https://grequantpro.com/#plans" onclick="if(window.GQP)window.GQP.track('pro_cta_clicked',{from:'mock_error_log',event_id:'${escapeHtml(String(evResult.event_id || ""))}'})">See what Pro adds</a>
      </div>
    </div>`;
    if (full) G.mountPanels(document.getElementById("ev-ins-body"), qs, { min: 3, noTrend: true, unit: "mock" });
  }

  function leHint() {
    return `<div class="le-hint"><strong>Log Error</strong> on any question to tag what went wrong. It goes into the result file you download and isn't saved anywhere else. <span id="le-count"></span></div>`;
  }

  function leBox(index, r) {
    const given = r.skipped ? "" : Array.isArray(r.student_answer) ? r.student_answer.join(", ") : r.student_answer;
    errorMeta[index] = {
      question_number: index + 1,
      question_id: r.question_id,
      topic: r.topic,
      subtopic: r.subtopic,
      status: r.correct ? "correct" : r.skipped ? "skipped" : "incorrect",
      given_answer: given,
      correct_answer: Array.isArray(r.correct_answer) ? r.correct_answer.join(", ") : r.correct_answer
    };
    if (evReview && !r.correct && evReview.items[index]) return evReview.html(index);   // required chips
    return `<div class="le-box" data-le="${index}">${leInner(index, false)}</div>`;
  }

  function leInner(key, editing) {
    const e = errorLog[key];
    if (editing) {
      return `<div class="le-form">
        <label>What went wrong?<select class="le-type" onchange="this.classList.remove('le-err')"><option value="">Select…</option>${
          LE_TYPES.map((t) => `<option${e && e.type === t ? " selected" : ""}>${t}</option>`).join("")
        }</select></label>
        <label>Note (optional)<textarea class="le-text" rows="2" maxlength="300" placeholder="e.g. Forgot to convert minutes to hours">${escapeHtml(e ? e.note : "")}</textarea></label>
        <div class="le-actions">
          <button class="btn btn-primary le-btn" data-le-act="save">Save</button>
          <button class="btn btn-ghost le-btn" data-le-act="cancel">Cancel</button>
          ${e ? '<button class="btn btn-ghost le-btn" data-le-act="remove">Remove</button>' : ""}
        </div></div>`;
    }
    if (e) {
      return `<div class="le-chip"><span class="le-tag">⚑ ${escapeHtml(e.type)}</span>${
        e.note ? `<span class="le-note">${escapeHtml(e.note)}</span>` : ""
      }<button class="btn btn-ghost le-btn" data-le-act="edit">Edit</button></div>`;
    }
    return `<button class="btn btn-ghost le-btn" data-le-act="edit">⚑ Log Error</button>`;
  }

  function leRefresh(key) {
    document.querySelectorAll(`.le-box[data-le="${key}"]`).forEach((b) => { b.innerHTML = leInner(key, false); });
    const n = leEntries().length, hint = $("le-count");
    if (hint) hint.textContent = n ? `${n} logged so far.` : "";
  }

  function leClick(ev) {
    const btn = ev.target.closest("[data-le-act]");
    if (!btn) return;
    const box = btn.closest(".le-box"), key = box.dataset.le, act = btn.dataset.leAct;
    if (act === "edit") {
      box.innerHTML = leInner(key, true);
      box.querySelector(".le-type").focus();
    } else if (act === "cancel") {
      box.innerHTML = leInner(key, false);
    } else if (act === "remove") {
      delete errorLog[key];
      leRefresh(key);
    } else if (act === "save") {
      const sel = box.querySelector(".le-type");
      if (!sel.value) { sel.classList.add("le-err"); sel.focus(); return; }
      errorLog[key] = { type: sel.value, note: box.querySelector(".le-text").value.trim() };
      leRefresh(key);
    }
  }

  // Everything logged so far, in question order, ready for the download.
  function leEntries() {
    const rows = Object.keys(errorMeta).filter((k) => errorLog[k]).map((k) => (
      { ...errorMeta[k], error_type: errorLog[k].type, note: errorLog[k].note }
    ));
    if (evReview) {
      evReview.order.forEach((i) => {
        const it = evReview.items[i];
        if (it.type && errorMeta[i]) {
          rows.push({
            ...errorMeta[i],
            error_type: window.GREErrorLog.typeLabel(it.type),
            error_cause: window.GREErrorLog.causeLabel(it.cause),
            note: it.note || ""
          });
        }
      });
      rows.sort((a, b) => a.question_number - b.question_number);
    }
    return rows;
  }

  function renderWrongReview(result) {
    const wrong = (result.results || []).filter((r) => !r.correct);
    if (!wrong.length) {
      return `<div class="table-card" style="margin-bottom:24px;text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:16px;">🏆</div>
        <div style="font-family:var(--font-display);font-size:22px;margin-bottom:8px;">Perfect Score!</div>
        <div style="color:var(--text2);font-size:14px;">All questions answered correctly.</div>
      </div>`;
    }
    return `<div class="table-card" style="margin-bottom:24px;">
      <h3>Questions to Review (${wrong.length})</h3>
      <div class="wrong-q-list">${wrong.map((r) => {
        const correctAnswer = Array.isArray(r.correct_answer) ? r.correct_answer.join(", ") : r.correct_answer;
        const studentAnswer = r.skipped ? "(no answer)" : Array.isArray(r.student_answer) ? r.student_answer.join(", ") : r.student_answer;
        return `<div class="wrong-q-card">
          <div class="wrong-q-header">
            <span class="pq-badge ${escapeHtml(r.difficulty)}">${escapeHtml(difficultyLabel(r.difficulty))}</span>
            <span class="pq-type-badge">${escapeHtml(typeLabel(r.type))}</span>
            <span style="font-size:12px;color:var(--text3);font-family:var(--font-mono);">${escapeHtml(r.question_id)}</span>
            ${r.skipped ? '<span style="font-size:12px;color:var(--text3);font-family:var(--font-mono);">Skipped</span>' : ""}
          </div>
          <div class="wrong-q-body">
            <div class="wrong-q-text">${escapeHtml(r.question_text)}</div>
            <div class="wrong-q-answers">
              <span class="wrong-q-your">Your answer: ${escapeHtml(studentAnswer)}</span>
              <span style="color:var(--text3);">·</span>
              <span class="wrong-q-correct">Correct: ${escapeHtml(correctAnswer)}</span>
            </div>
            ${r.explanation ? `<div class="wrong-q-explanation">${escapeHtml(r.explanation)}</div>` : ""}
            ${r.trap ? `<div class="wrong-q-trap">⚠️ Trap: ${escapeHtml(r.trap)}</div>` : ""}
            ${leBox(result.results.indexOf(r), r)}
          </div>
        </div>`;
      }).join("")}</div>
    </div>`;
  }

  function resultIcon(item) {
    if (item.correct) return "Correct";
    if (item.skipped) return "Skipped";
    return "Incorrect";
  }

  function renderQuestionReference(result) {
    const items = result.results || [];
    if (!items.length) return "";
    return `<details class="question-reference">
      <summary>Show full question list (${items.length})</summary>
      <div class="question-reference-list">
        ${items.map((r, i) => {
          const correctAnswer = Array.isArray(r.correct_answer) ? r.correct_answer.join(", ") : r.correct_answer;
          const studentAnswer = r.skipped ? "(no answer)" : Array.isArray(r.student_answer) ? r.student_answer.join(", ") : r.student_answer;
          const status = resultIcon(r);
          return `<div class="reference-q-card ${r.correct ? "correct" : r.skipped ? "skipped" : "incorrect"}">
            <div class="wrong-q-header">
              <span class="pq-badge ${escapeHtml(r.difficulty)}">${escapeHtml(difficultyLabel(r.difficulty))}</span>
              <span class="pq-type-badge">${escapeHtml(typeLabel(r.type))}</span>
              <span style="font-size:12px;color:var(--text3);font-family:var(--font-mono);">Q${i + 1} · ${escapeHtml(r.question_id)}</span>
              <span class="reference-status">${escapeHtml(status)}</span>
            </div>
            <div class="wrong-q-body">
              <div class="wrong-q-text">${escapeHtml(r.question_text)}</div>
              <div class="wrong-q-answers">
                <span class="${r.correct ? "wrong-q-correct" : "wrong-q-your"}">Your answer: ${escapeHtml(studentAnswer)}</span>
                <span style="color:var(--text3);">·</span>
                <span class="wrong-q-correct">Correct: ${escapeHtml(correctAnswer)}</span>
                <span style="color:var(--text3);">·</span>
                <span style="color:var(--text3);">Time: ${formatTime(r.time_taken_seconds || 0)}</span>
              </div>
              ${r.explanation ? `<div class="wrong-q-explanation">${escapeHtml(r.explanation)}</div>` : ""}
              ${r.trap ? `<div class="wrong-q-trap">Trap: ${escapeHtml(r.trap)}</div>` : ""}
              ${leBox(i, r)}
            </div>
          </div>`;
        }).join("")}
      </div>
    </details>`;
  }

  function renderSmartDiagnosis(result) {
    const diagnosis = result.diagnosis || buildDiagnosis(result);
    const band = diagnosis.band || performanceBand(result.accuracy);
    const trapSample = diagnosis.trap.sample
      ? `<div class="diagnosis-trap-sample">${escapeHtml(diagnosis.trap.sample)}</div>`
      : "";
    return `<div class="smart-diagnosis">
      <div class="diagnosis-top">
        <div>
          <div class="diagnosis-eyebrow">Personal diagnosis</div>
          <h3>Your GRE Quant next step is clear</h3>
          <p>${escapeHtml(band.summary)}</p>
        </div>
        <div class="diagnosis-band ${escapeHtml(band.tone)}">
          <span>${escapeHtml(band.label)}</span>
          <b>${escapeHtml(String(result.accuracy))}%</b>
        </div>
      </div>
      <div class="diagnosis-grid">
        <div class="diagnosis-card primary">
          <span>Main issue</span>
          <b>${escapeHtml(diagnosis.main_issue)}</b>
          <p>${escapeHtml(diagnosis.weak_area.detail)}</p>
        </div>
        <div class="diagnosis-card">
          <span>Weakest zone</span>
          <b>${escapeHtml(diagnosis.weak_area.label)}</b>
          <p>${escapeHtml(diagnosis.pro_recommendation)}</p>
        </div>
        <div class="diagnosis-card">
          <span>Timing read</span>
          <b>${escapeHtml(diagnosis.timing.label)}</b>
          <p>${escapeHtml(diagnosis.timing.detail)}</p>
        </div>
        <div class="diagnosis-card">
          <span>Trap pattern</span>
          <b>${escapeHtml(diagnosis.trap.label)}</b>
          <p>${escapeHtml(diagnosis.trap.detail)}</p>
          ${trapSample}
        </div>
      </div>
      <div class="recovery-plan">
        <div>
          <div class="diagnosis-eyebrow">Recommended recovery plan</div>
          <h4>Do this before your next full mock</h4>
        </div>
        <ol>
          ${diagnosis.recovery_plan.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    </div>`;
  }

  function renderProCta(result) {
    const diagnosis = result.diagnosis || buildDiagnosis(result);
    const weakText = `${escapeHtml(diagnosis.pro_recommendation)} GRE Quant Pro turns this diagnosis into targeted drills from the full 8,410+ question bank across 88 subtopics.`;
    const wrongTraps = (result.results || []).filter((r) => !r.correct && r.trap).slice(0, 2);
    const trapText = wrongTraps.length
      ? wrongTraps.map((r) => escapeHtml(r.trap)).join(" ")
      : "Pro keeps naming the exact trap after every wrong answer so patterns stop repeating.";
    return `<div class="pro-analysis-cta">
      <div>
        <h3>This mock is the diagnosis. Pro is the practice plan.</h3>
        <p>${weakText}</p>
        <div class="pro-cta-points">
          <span>Your weak-area practice queue</span>
          <span>Trap explanations after every question</span>
          <span>Timed exam mode for real GRE pace</span>
          <span>Progress analytics across sessions</span>
        </div>
        <div class="pro-locked-grid">
          <div class="pro-locked-card"><div class="pro-locked-label">Locked in Pro</div><b>Weak subtopic map</b><span>See exactly where accuracy and time collapse across all 88 subtopics.</span></div>
          <div class="pro-locked-card"><div class="pro-locked-label">Locked in Pro</div><b>${escapeHtml(diagnosis.weak_area.label)} recovery set</b><span>Practice more questions from the area this mock exposed.</span></div>
          <div class="pro-locked-card"><div class="pro-locked-label">Locked in Pro</div><b>Trap pattern review</b><span>${trapText}</span></div>
        </div>
      </div>
      <a class="primary-btn" href="https://grequantpro.com/#plans" onclick="if(window.GQP)window.GQP.track('pro_cta_clicked',{from:'mock_result',event_id:'${escapeHtml(String(state.config && state.config.event_id || ''))}',band:'${escapeHtml(String(diagnosis.band && diagnosis.band.label || ''))}',accuracy:${result.accuracy}})">Unlock My Practice Plan</a>
    </div>`;
  }

  function renderResults(result, timedOut) {
    hideExam();
    $("resultsSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    $("resultsTitle").textContent = timedOut ? "Time is up. Exam analysis saved." : "Exam Analysis";
    if ($("analysisMeta")) {
      $("analysisMeta").innerHTML = `
        <div class="analysis-meta-item"><span class="al">Student</span><span class="av">${escapeHtml(result.student.name)}</span></div>
        <div class="analysis-meta-item"><span class="al">Event</span><span class="av">${escapeHtml(result.event_name)}</span></div>
        <div class="analysis-meta-item"><span class="al">Date</span><span class="av">${new Date(result.submitted_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
        <div class="analysis-meta-item"><span class="al">Duration</span><span class="av">${formatTime(result.total_time_seconds)} / ${formatTime(state.config.timer_seconds)} allotted</span></div>`;
    }
    $("exam-kpi-row").innerHTML = [
      kpiCard("🎯", `${result.accuracy}%`, "Accuracy", "var(--accent)"),
      kpiCard("✅", result.correct, "Correct", "var(--success)"),
      kpiCard("❌", result.incorrect, "Incorrect", "var(--danger)"),
      kpiCard("⏭", result.skipped, "Skipped", "var(--text3)"),
      kpiCard("⏱", formatTime(result.total_time_seconds), "Total Time", "var(--warning)"),
      kpiCard("⚡", `${formatTime(result.average_time_seconds)}/q`, "Avg per Q", "var(--accent2)")
    ].join("");
    const oldSectionCard = document.getElementById("exam-section-card");
    if (oldSectionCard) oldSectionCard.remove();
    if (result.sections && result.sections.length) {
      $("exam-kpi-row").insertAdjacentHTML("afterend", `
        <div class="chart-card gel-secret" id="exam-section-card" style="margin-bottom:24px;"><h3>By Section</h3>
          ${result.sections.map((sec) => {
            const pct = Math.round(sec.accuracy);
            const col = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
            return barRow(`${sec.name} · ${formatTime(sec.time_used_seconds)}`, sec.correct, sec.total, pct, col);
          }).join("")}
        </div>`);
    }
    renderAnalysisBars(result);
    renderTimeTable(result);
    if ($("proCta")) $("proCta").innerHTML = renderSmartDiagnosis(result) + renderProCta(result);
    errorLog = {};
    errorMeta = {};
    const gated = setupEventLog(result);
    document.querySelectorAll(".ev-top-banner").forEach((n) => n.remove());
    if (gated && evReview.order.length) {
      // A banner at the top as well as above the review, because the review is a long way down the page.
      $("exam-kpi-row").insertAdjacentHTML("beforebegin", `<div class="ev-top-banner" style="position:sticky;top:8px;z-index:20;">${evReview.banner()}</div>`);
    }
    $("exam-wrong-section").innerHTML = (gated ? "" : leHint()) + renderQuestionReference(result) + renderWrongReview(result);
    if (gated) evReview.refreshBanners();
    $("exam-wrong-section").onclick = leClick;
    if ($("ev-insights")) $("ev-insights").innerHTML = "";
    if ($("resultsHeldTitle")) $("resultsHeldTitle").textContent = timedOut ? "Time is up. Now the review." : "Score recorded. Now the review.";
    // Typeset only the question review. The rest of this page is statistics
    // ("0:01 / 47:00", "7/12 (58%)"), and the typesetter would turn every
    // slash in those into a stacked fraction.
    if (window.GREMath) window.GREMath.renderIn($("exam-wrong-section"));
    $("downloadResultBtn").onclick = () => {
      const errors = leEntries();
      downloadJson(`${slug(result.event_id)}_${slug(result.student.name)}_result.json`, errors.length ? { ...result, error_log: errors } : result);
    };
    syncEventLog();
    // Review first: until every miss is tagged (or the coach clears it) the score
    // and analysis stay hidden. If this throws, release rather than strand the page.
    if (gated) {
      try { evReview.hold({ at: $("gelProceedHost"), onRelease: onEventRelease }); }
      catch (e) { try { evReview.dispose(); } catch (x) { /* nothing more to do */ } if (window.console) console.warn("review gate", e); }
    }
    document.getElementById("emailResultBtn").onclick = async () => {
  const subject = encodeURIComponent(`GRE Quant Pro Event Result - ${result.event_name} - ${result.student.name}`);
  const bodyText = `Hi our coaching team,\n\nAttached/pasted below is my event result JSON.\n\n${JSON.stringify(result, null, 2)}`;
  
  // Copy full body to clipboard
  await navigator.clipboard.writeText(bodyText);

  // Open Gmail with a short nudge to paste
  const shortBody = encodeURIComponent("Hi our coaching team,\n\n[Paste your result here — it has been copied to your clipboard]");
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=goenka.aditya.kol@gmail.com&su=${subject}&body=${shortBody}`, '_blank');

  alert("Gmail is opening. The full result JSON has been copied to your clipboard — just paste it into the email body.");
};
    showEventScoreCard(result);
  }

  /* Score first, then the review, then the analysis.

     Event papers are scored here rather than in buildResult() because the
     student page has never shown a scaled score — only the coach views did,
     through the same score-scale.js. Reading it off result.results means the
     number on this card, the one in the saved attempt and the one the coach
     sees all come from the same rows.

     A sectioned event paper is a whole mock; a short one is a topic test, and
     score-scale.js widens the band accordingly. */
  function eventScore(result) {
    if (!window.GREScore) return null;
    var rows = (result.results || []).map(function (r) {
      return { difficulty: r.difficulty, correct: !!r.correct && !r.skipped };
    });
    if (!rows.length) return null;
    var scope = (rows.length >= 20 || (result.sections && result.sections.length > 1)) ? 'mock'
      : (rows.length >= 12 ? 'sectional' : 'topic');
    try { return GREScore.fromQuestions(rows, scope); } catch (e) { return null; }
  }

  function showEventScoreCard(result) {
    if (!window.GREScoreCard) return;
    var est = eventScore(result);
    GREScoreCard.show({
      est: est,
      correct: result.correct, total: result.total_questions,
      scope: (result.sections && result.sections.length > 1) ? 'mock' : 'sectional',
      testTitle: result.event_name || 'Event Mock',
      studentName: result.student && result.student.name,
    });
  }

  // Resolves to the Worker's reply ({ attempt_id, log }) or null if the save did
  // not go through. Only the new client sets requires_error_log, so an older
  // cached page can never leave a student locked.
  async function saveAttempt(result) {
    const flagged = window.GREErrorLog ? { ...result, requires_error_log: true } : result;
    try {
      const res = await fetch(SUBMISSION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: flagged })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.warn("Could not save mock attempt", error);
      return null;
    }
  }

  function submitEvent(timedOut = false) {
    if (state.submitted) return;
    closeModal();
    setQuestionTime(state.current);
    state.submitted = true;
    clearInterval(state.timer);
    const student = {
      name: $("studentName").value.trim(),
      email: $("studentEmail").value.trim(),
      batch: $("studentBatch").value.trim()
    };
    const result = buildResult(student);
    if (window.GQP) window.GQP.track('mock_submitted', {
      event_id: result.event_id,
      score: result.score,
      total: result.total_questions,
      accuracy: result.accuracy,
      band: result.diagnosis && result.diagnosis.band ? result.diagnosis.band.label : null,
      timed_out: timedOut
    });
    renderResults(result, timedOut);
    const saved = saveAttempt(result);
    if (evReview) evReview.attachEvent(saved, { ...result, requires_error_log: true });
    // Free event mocks also feed this browser's local history, so they count
    // toward the upgrade prompt and carry over if the student goes Pro.
    if (window.GREProgressLocal) {
      GREProgressLocal.recordAttemptPayload(result, {
        session_type: 'event_mock',
        label: result.event_name || 'Event Mock'
      });
    }
  }

  async function initStudentPage() {
    // A student who left a previous attempt untagged is held here until it is done.
    if (window.GREErrorLog) window.GREErrorLog.resumeEvents();
    try {
      state.config = await loadConfig();
      state.config.questions = (state.config.questions || []).map((q) => enrichQuestion(q, q.topic, q.subtopic));
      $("eventName").textContent = state.config.event_name || "GRE Quant Pro Event";
      $("eventDetails").textContent = isSectioned()
        ? `${state.config.question_count || state.config.questions.length} questions · ${state.config.sections.map((sec) => `${sec.question_count || ""} Q in ${formatTime(sec.time_limit_seconds)}`).join(" + ")} · each section timed separately`
        : `${state.config.question_count || state.config.questions.length} questions · ${state.config.timer_seconds ? formatTime(state.config.timer_seconds) : "Untimed"} · ${state.config.allow_navigation === false ? "Locked order" : "Navigation allowed"}`;
      $("instructions").textContent = state.config.instructions || "Answer all questions. Feedback is shown only after submission.";
      $("startBtn").onclick = () => {
        if (!$("studentName").value.trim() || !$("studentEmail").value.trim()) {
          $("startError").textContent = "Name and email are required before starting.";
          return;
        }
        $("startError").textContent = "";
        showInstructions();
      };
      $("instrBackBtn").onclick = () => {
        $("instructionsSection").classList.add("hidden");
        $("startSection").classList.remove("hidden");
      };
      $("beginBtn").onclick = beginTest;
      $("breakNextBtn").onclick = startNextSection;
      $("submitBtn").onclick = confirmExit;
      document.addEventListener("keydown", (e) => {
        if ($("examSection").classList.contains("hidden") || $("gre-modal").classList.contains("open")) return;
        if (["INPUT", "TEXTAREA"].includes(document.activeElement && document.activeElement.tagName)) return;
        if ($("gre-review-area").style.display === "block") return;
        if (e.key === "ArrowRight") nextQuestion();
        else if (e.key === "ArrowLeft") prevQuestion();
      });
    } catch (error) {
      $("startSection").innerHTML = `<div class="notice danger">Could not load event config. ${escapeHtml(error.message)}</div>`;
    }
  }

  return {
    $, state, escapeHtml, slug, formatTime, downloadJson, downloadText, shuffle, loadJson, enrichQuestion, isCorrect, summarize, breakdown,
    chooseOption, setAnswer, goQuestion, nextQuestion, prevQuestion, submitEvent, endSection, startNextSection, initStudentPage,
    toggleMark, openReview, returnFromReview, showHelp, toggleTimer, confirmExit
  };
})();
