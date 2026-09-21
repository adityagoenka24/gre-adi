/* ============================================================
   GRE Quant Pro — Diagnostic Planner UI

   A clean parse (right question counts, sane time totals) goes
   straight from parsing to the report — no review step in between.
   The confirm grid still exists, but only for the two cases that
   actually need it: a parse whose structure doesn't add up (routed
   there to be fixed by hand) and manual entry (there is no data
   without it). Target score and plan length used to live only on
   that grid; they now live as adjustable pills at the top of the
   report itself, so removing the grid from the common path didn't
   remove the ability to personalise.

   Scope is the lean v1 that was agreed: verdict + archetype,
   gap-to-target with a student-chosen target, content-area bars,
   the timing map, and the week-by-week plan. The ceiling ladder,
   stamina arcs and trap cards are deliberately not here.

   Nothing leaves the browser. The PDF is read on-device and the
   student's name, which the ETS report carries in its header, is
   never extracted, stored or transmitted.
   ============================================================ */

import * as pdfjsLib from './vendor/pdf.min.mjs';
import { parseDiagnostic, QUESTION_TYPES, SETTINGS } from './parser.js';
import { analyse } from './analysis.js';
import { buildPlan, WEEK_OPTIONS, AREA_TO_TOPICS } from './plan.js';
import { gapMeter, areaBars, timingMap, timingLegend, timingTable, hideTip,
         paperGrid, paperLegend, difficultyLadder, typeBars } from './charts.js';
import { take } from './handoff.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = './diagnostic/vendor/pdf.worker.min.mjs';

const TARGETS = [160, 165, 168, 170];
const AREA_LABEL = {
  Arithmetic: 'Arithmetic', Algebra: 'Algebra',
  Geometry: 'Geometry', DataAnalysis: 'Data Analysis',
};
const KIND_ICON = { capsule: '📖', practice: '📝', drill: '◎', rule: '⚡', checkpoint: '✓' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const track = (n, d) => { try { window.GQP?.track?.(n, d); } catch {} };

const state = { rows: [], analysis: null, plan: null, taxonomy: null, target: 165, weeks: 8, narrow: [], testDate: null };

/* ---------- screens ---------- */
function show(id) {
  $$('.dx-screen').forEach((s) => s.classList.toggle('is-on', s.id === id));
  hideTip();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ============================================================
   Landing
   ============================================================ */

function initLanding() {
  const drop = $('#dxDrop'), input = $('#dxFile');
  // No click handler: the <label for> opens the picker natively, which
  // works in every browser and needs no permission to synthesise a click.
  input.addEventListener('change', () => input.files.length && run([...input.files]));

  ['dragenter', 'dragover'].forEach((t) => document.addEventListener(t, (e) => {
    e.preventDefault(); drop.classList.add('is-over');
  }));
  ['dragleave', 'drop'].forEach((t) => document.addEventListener(t, (e) => {
    e.preventDefault();
    if (t === 'dragleave' && e.relatedTarget) return;
    drop.classList.remove('is-over');
  }));
  document.addEventListener('drop', (e) => {
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) run(files);
  });

  $('#dxManual').addEventListener('click', () => {
    track('diagnostic_manual_entry');
    state.rows = blankRows();
    renderConfirm({ ok: false, errors: [], warnings: [] }, true);
    show('dxConfirm');
  });
  track('diagnostic_page_view');
}

/** 27 empty rows in the shape the real GRE gives, for the student
 *  whose file will not parse — nobody hits a dead end. */
function blankRows() {
  const shape = [
    [1, 'Arithmetic', 2], [1, 'Algebra', 3], [1, 'Geometry', 3], [1, 'DataAnalysis', 4],
    [2, 'Arithmetic', 4], [2, 'Algebra', 4], [2, 'Geometry', 3], [2, 'DataAnalysis', 4],
  ];
  const out = [];
  for (const [section, area, n] of shape) {
    for (let i = 1; i <= n; i++) {
      out.push({
        section, area, ref: i, qtype: 'MC1', setting: 'Pure',
        verdict: 'R', difficulty: 3, seconds: 90,
        needsReview: ['qtype', 'setting', 'verdict', 'difficulty', 'seconds'], confident: false,
      });
    }
  }
  return out;
}

/* ============================================================
   Parsing
   ============================================================ */

const STEPS = [
  'Reading your report',
  'Finding the question tables',
  'Mapping to 95 subtopics',
  'Analysing your timing',
  'Building your plan',
];

async function run(files) {
  track('diagnostic_file_dropped', { count: files.length });
  show('dxParsing');
  const stepEls = $$('#dxSteps .dx-step');
  const bar = $('#dxBar i');
  let step = 0;
  const setStep = (i) => {
    stepEls.forEach((e, k) => {
      e.classList.toggle('is-on', k === i);
      e.classList.toggle('is-done', k < i);
    });
    bar.style.width = `${((i + 1) / STEPS.length) * 100}%`;
  };
  setStep(0);
  // The narration is real work, but paced: results that land instantly
  // read as cheap, and this is the moment value is being established.
  const tick = setInterval(() => { if (step < STEPS.length - 1) setStep(++step); }, 850);

  const started = Date.now();
  let result;
  try {
    result = await parseDiagnostic(files, {
      pdfjsLib,
      createWorker: () => Tesseract.createWorker('eng', 1, {
        workerPath: './diagnostic/vendor/tess/worker.min.js',
        corePath: './diagnostic/vendor/tess/',
        langPath: './diagnostic/vendor/tess/',
        gzip: true,
      }),
    });
  } catch (err) {
    clearInterval(tick);
    track('diagnostic_parse_failed', { reason: 'exception' });
    return fail('That file could not be read.', String(err && err.message || err));
  }
  clearInterval(tick);

  if (result.kind === 'verbal-report') {
    track('diagnostic_parse_failed', { reason: 'verbal' });
    return fail('That is your Verbal report.',
      'Open the ETS Diagnostic Service again and choose Quantitative Reasoning, then upload that page.');
  }
  if (!result.rows.length) {
    track('diagnostic_parse_failed', { reason: 'no-rows' });
    return fail('No question tables found in that file.',
      'Make sure it is the Quantitative Reasoning page of the ETS Diagnostic Service. You can also type your results in by hand.');
  }

  state.rows = result.rows;
  await new Promise((r) => setTimeout(r, Math.max(0, 2600 - (Date.now() - started))));
  setStep(STEPS.length - 1);
  await new Promise((r) => setTimeout(r, 450));

  track('diagnostic_parse_ok', {
    rows: result.rows.length,
    warnings: result.validation.warnings.length,
    clean: result.validation.clean,
  });

  if (!result.validation.ok) {
    // The numbers don't add up (wrong question count for a section, or an
    // impossible time total) — that needs a human to fix the specific row,
    // so it still goes to the grid rather than a plan built on bad data.
    track('diagnostic_parse_needs_fix', { errors: result.validation.errors.map((e) => e.code) });
    renderConfirm(result.validation, false);
    show('dxConfirm');
    return;
  }

  // Structure is sound — skip the review step and go straight to the plan.
  // Any individual cells the parser wasn't fully sure of are used as its
  // best read and flagged in the report's own guard note instead of
  // gating the whole flow on them.
  await buildAndShowReport();
}

function fail(title, detail) {
  $('#dxFailTitle').textContent = title;
  $('#dxFailDetail').textContent = detail;
  show('dxFail');
}

/* ============================================================
   Confirm grid
   Only reached now via manual entry, or a parse whose structure
   didn't add up and needs a row fixed by hand — a clean parse skips
   straight past this to the report.
   ============================================================ */

function renderConfirm(validation, manual) {
  const flag = $('#dxFlag');
  const warnCount = state.rows.filter((r) => r.needsReview?.length).length;
  if (manual) {
    flag.className = 'dx-flag warn';
    flag.textContent = 'Fill in your 27 questions';
  } else if (!validation.ok) {
    flag.className = 'dx-flag bad';
    flag.textContent = validation.errors[0]?.message || 'Something looks off — please check';
  } else if (warnCount) {
    flag.className = 'dx-flag warn';
    flag.textContent = `${warnCount} cell${warnCount === 1 ? '' : 's'} we could not read — please confirm`;
  } else {
    flag.className = 'dx-flag ok';
    flag.textContent = 'All 27 questions read cleanly';
  }

  const tb = $('#dxGridBody');
  tb.innerHTML = '';
  let lastSection = null;
  state.rows.forEach((r, i) => {
    if (r.section !== lastSection) {
      lastSection = r.section;
      const tr = document.createElement('tr');
      tr.className = 'dx-sec';
      tr.innerHTML = `<td colspan="6">Section ${r.section}${r.sectionInferred ? ' — worked out from the question count' : ''}</td>`;
      tb.appendChild(tr);
    }
    const need = (f) => (r.needsReview || []).includes(f) ? ' class="needs"' : '';
    const tr = document.createElement('tr');
    tr.dataset.i = i;
    tr.innerHTML = `
      <td data-l="Area">${esc(AREA_LABEL[r.area] || r.area)}</td>
      <td data-l="Type"${need('qtype')}><select data-f="qtype">${
        QUESTION_TYPES.map((q) => `<option value="${q.key}"${q.key === r.qtype ? ' selected' : ''}>${esc(q.label.replace('--', ' — '))}</option>`).join('')
      }</select></td>
      <td data-l="Setting"${need('setting')}><select data-f="setting">${
        SETTINGS.map((s) => `<option value="${s.key}"${s.key === r.setting ? ' selected' : ''}>${esc(s.label)}</option>`).join('')
      }</select></td>
      <td data-l="Result"${need('verdict')}><select data-f="verdict">
        <option value="R"${r.verdict === 'R' ? ' selected' : ''}>Right</option>
        <option value="W"${r.verdict === 'W' ? ' selected' : ''}>Wrong</option></select></td>
      <td data-l="Level"${need('difficulty')}><select data-f="difficulty">
        <option value=""${r.difficulty ? '' : ' selected'}>—</option>
        ${[1, 2, 3, 4, 5].map((d) => `<option value="${d}"${r.difficulty === d ? ' selected' : ''}>${d}</option>`).join('')}
      </select></td>
      <td data-l="Time"${need('seconds')}><input data-f="seconds" inputmode="numeric" value="${mmss(r.seconds)}" aria-label="Time spent, minutes and seconds"></td>`;
    tb.appendChild(tr);
  });

  tb.oninput = (e) => {
    const f = e.target.dataset.f; if (!f) return;
    const row = state.rows[+e.target.closest('tr').dataset.i];
    if (f === 'seconds') {
      const m = e.target.value.match(/^(\d{1,2})[:.](\d{1,2})$/);
      if (m) row.seconds = +m[1] * 60 + +m[2];
      else if (/^\d+$/.test(e.target.value)) row.seconds = +e.target.value;
    } else if (f === 'difficulty') {
      row.difficulty = e.target.value ? +e.target.value : null;
    } else {
      row[f] = e.target.value;
    }
    e.target.closest('td').classList.remove('needs');
    row.needsReview = (row.needsReview || []).filter((x) => x !== f);
  };

  segment($('#dxTarget'), TARGETS, state.target, (v) => { state.target = v; });
  segment($('#dxWeeks'), WEEK_OPTIONS, state.weeks, (v) => { state.weeks = v; }, (v) => `${v} weeks`);
}

function segment(host, values, current, onPick, fmt = String) {
  host.innerHTML = values.map((v) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === current}">${fmt(v)}</button>`).join('');
  host.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', host).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onPick(+b.dataset.v);
  };
}

/** Target score and plan length, now living on the report itself rather
 *  than gating it — changing either instantly rebuilds the plan in place,
 *  the same pattern the topic-narrowing chips already use below. */
function renderPersonalize() {
  segment($('#dxTargetR'), TARGETS, state.target, (v) => {
    if (v === state.target) return;
    state.target = v;
    computeAnalysisAndPlan();
    renderReport();
  });
  segment($('#dxWeeksR'), WEEK_OPTIONS, state.weeks, (v) => {
    if (v === state.weeks) return;
    state.weeks = v;
    computeAnalysisAndPlan();
    renderReport();
  }, (v) => `${v} weeks`);

  // The real date is optional and sits beside the week pills rather than
  // in front of the report: a student who gives it gets the plan sized to
  // the time they actually have, and one who doesn't loses nothing.
  const date = $('#dxTestDate');
  if (date && !date.dataset.wired) {
    date.dataset.wired = '1';
    date.min = isoDay(new Date());
    date.addEventListener('change', () => {
      state.testDate = date.value || null;
      const days = daysUntil(state.testDate);
      if (days !== null && days > 0) {
        // Use as much of the runway as the plan lengths allow.
        const fits = WEEK_OPTIONS.filter((w) => w * 7 <= days);
        const chosen = fits.length ? Math.max(...fits) : Math.min(...WEEK_OPTIONS);
        state.weeks = chosen;
        track('diagnostic_test_date_set', { days, weeks: chosen });
        computeAnalysisAndPlan();
        renderReport();
        return;
      }
      renderCountdown();
    });
  }
  if (date && state.testDate && date.value !== state.testDate) date.value = state.testDate;
  renderCountdown();
}

const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function daysUntil(iso) {
  if (!iso) return null;
  const then = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(+then)) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((then - now) / 86400000);
}

function renderCountdown() {
  const el = $('#dxCountdown');
  if (!el) return;
  const days = daysUntil(state.testDate);
  if (days === null) { el.innerHTML = ''; return; }
  if (days <= 0) { el.textContent = 'That date has gone — pick the next one.'; return; }
  const sessions = Math.floor((days / 7) * 4);
  const slack = days - state.weeks * 7;
  el.innerHTML =
    `<b>${days} day${days === 1 ? '' : 's'}</b> — about ${sessions} sessions at four a week. ` +
    (slack >= 0
      ? `Your ${state.weeks}-week plan finishes ${slack} day${slack === 1 ? '' : 's'} before it.`
      : `Your ${state.weeks}-week plan runs ${Math.abs(slack)} day${Math.abs(slack) === 1 ? '' : 's'} past it.`);
}

/* ============================================================
   Report
   ============================================================ */

async function ensureTaxonomy() {
  if (!state.taxonomy) {
    state.taxonomy = await fetch('./diagnostic/taxonomy.json').then((r) => r.json());
  }
}

/** Analyse + build the plan from the current rows/target/weeks/narrow.
 *  Anything the parser wasn't fully sure of (an unread cell, a missing
 *  difficulty level) used to block behind a popup; now it is folded into
 *  the report's own "what this does not tell you" guard note instead —
 *  informative, but never in the way. */
function computeAnalysisAndPlan() {
  state.analysis = analyse(state.rows, { target: state.target });
  const unread = state.rows.filter((r) => r.needsReview?.length).length;
  const noDifficulty = state.rows.filter((r) => !r.difficulty).length;
  if (unread || noDifficulty) {
    const bits = [];
    if (unread) bits.push(`${unread} answer${unread === 1 ? '' : 's'} it wasn't fully sure it read right`);
    if (noDifficulty) bits.push(`${noDifficulty} question${noDifficulty === 1 ? '' : 's'} with no difficulty level`);
    state.analysis.guards.push(
      `The reader flagged ${bits.join(' and ')} — its best guess was used, so double-check that area below if something looks off.`
    );
  }
  state.plan = buildPlan(state.analysis, state.taxonomy, { weeks: state.weeks, narrow: state.narrow });
}

async function buildAndShowReport() {
  await ensureTaxonomy();
  computeAnalysisAndPlan();
  track('diagnostic_plan_generated', {
    target: state.target, weeks: state.weeks,
    archetype: state.analysis.archetypes[0].key,
    away: state.analysis.gap.questionsAway,
  });
  renderReport();
  show('dxReport');
}

/** Still the confirm-grid's own button handler — manual entry, and a
 *  parse that needed a row fixed by hand, both land here. */
async function generate() {
  await buildAndShowReport();
}

function renderReport() {
  const a = state.analysis, p = state.plan;
  const [primary, secondary] = a.archetypes;

  /* --- verdict --- */
  stampPrintHeader();
  renderPersonalize();
  $('#dxArch').textContent = primary.label;
  $('#dxHead').textContent = primary.headline;
  $('#dxEvidence').textContent = primary.evidence;
  $('#dxSecond').innerHTML = secondary
    ? `<b>Also: ${esc(secondary.label)}</b><p>${esc(secondary.evidence)}</p>` : '';
  $('#dxSecond').style.display = secondary ? '' : 'none';

  // The estimated score leads. It is the number they opened the page for,
  // and everything after it is the explanation of how it got that way.
  const tiles = [
    { v: a.score.label, l: 'estimated Quant score', alert: false },
    { v: `${a.overall.correct}/${a.overall.n}`, l: 'correct', alert: false },
    { v: `${a.gap.questionsAway}`, l: `questions from ${a.gap.target}`, alert: true },
    { v: mmss(a.timing.sunkSeconds), l: 'lost to questions you got wrong', alert: a.timing.sunkSeconds > 300 },
  ];
  $('#dxTiles').innerHTML = tiles.map((t) =>
    `<div class="dx-tile${t.alert ? ' alert' : ''}"><div class="dx-tile-v">${esc(t.v)}</div><div class="dx-tile-l">${esc(t.l)}</div></div>`).join('');

  /* --- the paper, priced --- */
  renderPaper();

  /* --- the ceiling, the formats, the two sections --- */
  renderCeiling();
  renderFormat();
  renderSections();

  /* --- areas --- */
  const barHost = $('#dxAreaChart'); barHost.innerHTML = ''; barHost.appendChild(areaBars(a));
  const w = a.weakestArea;
  $('#dxAreaRead').innerHTML = `<b>${esc(w.label)}</b> is your weakest at ${w.correct} of ${w.n}.` +
    (w.tempo === 'fast'
      ? ` Those errors averaged ${w.avgErrorSeconds} seconds — fast, which means you did not know where to start rather than running out of time.`
      : w.tempo === 'slow'
        ? ` Those errors averaged ${w.avgErrorSeconds} seconds — slow, which means you knew enough to begin and picked a route that did not finish.`
        : '');

  /* --- timing map --- */
  const tmHost = $('#dxTimingChart'); tmHost.innerHTML = '';
  tmHost.appendChild(timingMap(a));
  tmHost.appendChild(timingLegend());
  $('#dxTimingTable').innerHTML = ''; $('#dxTimingTable').appendChild(timingTable(a));
  $('#dxTimingRead').innerHTML =
    `Your wrong answers averaged <b>${a.timing.avgWrong}s</b> and your right answers <b>${a.timing.avgRight}s</b> — almost the same, which looks like nothing. It is two opposite problems cancelling out. ` +
    (a.timing.sunk.length
      ? `<b>${a.timing.sunk.length} questions took ${mmss(a.timing.sunkSeconds)} between them and you got none of them right.</b> `
      : '') +
    (a.timing.rushed.length ? `Another ${a.timing.rushed.length} went wrong in under a minute each.` : '');

  /* --- narrowing --- */
  renderChips();

  /* --- plan --- */
  const focus = state.narrow.map((c) => state.taxonomy[c]?.name).filter(Boolean);
  $('#dxPlanIntro').innerHTML =
    `${p.meta.weeks} weeks, built from your own numbers. Drills sit at <b>${esc(p.tier.tiers.join(' and '))}</b> — ${esc(p.tier.why)}` +
    (focus.length
      ? `<br><span style="display:inline-block;margin-top:10px;padding:6px 13px;background:var(--accent-soft);border-radius:999px;font-size:14px;font-weight:700;color:var(--accent-dark)">Focused on ${esc(focus.join(' and '))}</span>`
      : '');
  $('#dxWeekList').innerHTML = p.weeks.map((wk) => `
    <article class="dx-week">
      <div class="dx-week-n">Week ${wk.n}</div>
      <h3>${esc(wk.title)}</h3>
      <p class="dx-why">${esc(wk.why)}</p>
      <ul class="dx-items">${wk.items.map((i) => `
        <li class="dx-item${i.locked ? ' is-locked' : ''}${i.kind === 'rule' ? ' is-rule' : ''}">
          <span class="dx-ico" aria-hidden="true">${KIND_ICON[i.kind] || '·'}</span>
          <span class="dx-item-b">
            <span class="dx-item-t">${i.href ? `<a href="${esc(i.href)}">${esc(i.label)}</a>` : esc(i.label)}${
              i.locked ? '<span class="dx-lock">PRO</span>' : i.partial ? '<span class="dx-lock">PART PRO</span>' : ''}</span>
            <span class="dx-item-d">${esc(i.detail)}</span>
          </span>
        </li>`).join('')}</ul>
      ${wk.checkpoint ? `<p class="dx-check"><b>Checkpoint —</b> ${esc(wk.checkpoint)}</p>` : ''}
    </article>`).join('');

  $('#dxUpsell').style.display = p.meta.upgradeLine ? '' : 'none';
  if (p.meta.upgradeLine) $('#dxUpsellText').innerHTML = esc(p.meta.upgradeLine);

  /* --- what the ETS report structurally cannot answer --- */
  renderMoat();

  /* --- what we did not conclude --- */
  $('#dxGuards').innerHTML =
    `<b>What this does not tell you.</b><ul>${a.guards.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>`;
}

/* ============================================================
   The paper, priced
   The centre of the upgraded report. The ETS table is 27 rows of
   grey; this turns it into 27 objects with a price on each, and
   then spends them against the student's own target.
   ============================================================ */

function renderPaper() {
  const a = state.analysis, L = a.ledger;

  $('#dxPaperIntro').innerHTML =
    `You got <b>${a.overall.correct} of ${a.overall.n}</b> — about <b>${esc(a.score.label)}</b> on the 130–170 scale. ` +
    `Every box below is one question, coloured by what it would actually cost you to own it. ` +
    `The number inside is ETS's difficulty level for that question.`;

  const gridHost = $('#dxPaperChart'); gridHost.innerHTML = ''; gridHost.appendChild(paperGrid(a));
  const legHost = $('#dxPaperLegend'); legHost.innerHTML = ''; legHost.appendChild(paperLegend(a));
  // The gap meter used to sit in a band of its own that restated these
  // very numbers a paragraph later. It belongs with the route.
  const gapHost = $('#dxGapChart'); gapHost.innerHTML = ''; gapHost.appendChild(gapMeter(a));

  const host = $('#dxRoute');
  if (a.gap.reached) {
    host.innerHTML =
      `<div class="dx-route-foot">You already cleared <b>${a.gap.target}</b> on this paper. ` +
      `The plan below is about holding it when the questions are unfamiliar and the clock is real.</div>`;
    $('#dxRouteNote').textContent = a.gap.estimateCaveat;
    return;
  }

  const head =
    `<div class="dx-route-foot"><b>${a.gap.target} needs about ${a.gap.need} of ${a.overall.n}.</b> ` +
    `You got ${a.gap.have}. Here is where the missing ${a.gap.questionsAway} ` +
    `${a.gap.questionsAway === 1 ? 'question comes' : 'questions come'} from — cheapest first.</div>`;

  const rows = L.route.map((s) => `
    <div class="dx-route-row${s.key === 'careless' ? ' is-free' : ''}">
      <div class="dx-route-n">${s.take}</div>
      <div class="dx-route-b">
        <div class="dx-route-t">${esc(s.label)}${s.take < s.available ? ` <span style="font-weight:600;color:var(--ink3)">(${s.available} available)</span>` : ''}</div>
        <div class="dx-route-d">${esc(s.why)}</div>
      </div>
    </div>`).join('');

  const tail = L.shortfall > 0
    ? `<div class="dx-route-foot">The last <b>${L.shortfall}</b> cannot come from this paper's mistakes — ` +
      `they are questions you have not shown you can do yet. That is new ground, and it is what the later weeks of the plan are for.</div>`
    : L.perfectRequired
      ? `<div class="dx-route-foot">Worth saying plainly: a <b>${a.gap.target}</b> on this estimate means <b>every question</b>. ` +
        `There is no slack anywhere in that route.</div>`
      : `<div class="dx-route-foot">Every one of those ${a.gap.questionsAway} is a question you got wrong on a paper you have already sat — ` +
        `not a harder test you have yet to face.</div>`;

  host.innerHTML = head + rows + tail;
  $('#dxRouteNote').textContent = a.gap.estimateCaveat +
    ' This route shows where the missing questions sit, not a promise that every one of them converts.';
}

/* ============================================================
   The ceiling — the chart the ETS report implies and never draws
   ============================================================ */

function renderCeiling() {
  const a = state.analysis, d = a.difficulty, proven = a.ledger.provenLevel;
  const provenRow = d.levels.find((l) => l.level === proven);
  const above = d.levels.filter((l) => l.level > proven && l.n >= 2);
  const aboveN = above.reduce((x, l) => x + l.n, 0);
  const aboveC = above.reduce((x, l) => x + l.correct, 0);

  // A ceiling is only a ceiling when the curve actually falls. On an
  // erratic curve, saying "you hold level 4" while the student is 50% at
  // level 3 would be plainly wrong — and the honest read there is the
  // more useful one anyway, because holes close faster than ceilings rise.
  const holes = d.levels.filter((l) => l.n >= 2 && l.pct < a.config.CEILING_PCT);
  const held = d.levels.filter((l) => l.n >= 2 && l.pct >= a.config.CEILING_PCT);
  const listLevels = (ls) => ls.map((l) => `level ${l.level} (${l.pct}%)`).join(', ');

  $('#dxCeilingRead').innerHTML = !d.monotonic && holes.length && held.length
    ? `Your accuracy does not track difficulty. You are strong at ${listLevels(held)} ` +
      `but fall away at ${listLevels(holes)} — <b>below</b> some of the levels you handle well. ` +
      `A real ceiling fails upward in order; yours does not. That means specific topic gaps rather than a level limit, ` +
      `and gaps close a great deal faster than a ceiling rises.`
    : proven
      ? `You hold <b>level ${proven}</b> — ${provenRow.correct} of ${provenRow.n}, ${provenRow.pct}%.` +
        (aboveN
          ? ` Above it you are <b>${aboveC} of ${aboveN}</b>. That line is where your score is decided: the distance between a 160 and a 165 is almost entirely level 4 and 5 questions.`
          : ' There were too few questions above it here to read where the fall begins.')
      : `No difficulty level here cleared the reliable line, so this is about rebuilding the base rather than raising a ceiling.`;

  const host = $('#dxCeilingChart'); host.innerHTML = ''; host.appendChild(difficultyLadder(a));
  // On an erratic curve the read above already says what d.read says, so
  // printing both puts the same sentence twice in a row.
  $('#dxCeilingNote').textContent =
    (d.monotonic ? `${d.read} ` : '') +
    `The dashed line is ${a.config.CEILING_PCT}% — the bar a level has to clear before it counts as one you hold. ` +
    `Faded bars had too few questions behind them to read.`;
}

/* ============================================================
   Formats — QC is a third of the section and a different skill
   ============================================================ */

function renderFormat() {
  const a = state.analysis;
  const overall = a.overall.pct;
  const readable = a.types.filter((t) => !t.thin);

  // Only three of the four formats carry a method of their own. Plain
  // multiple choice is the default wrapper for most of the section, so
  // being a little below average on it is just where the questions live
  // — calling that a "format problem" would send a student to fix
  // something that isn't broken. QC leads when it is down at all,
  // because it is the one format that is a genuinely separate skill.
  const METHOD_NOTE = {
    QC: 'Quantitative Comparison is about a third of every Quant section, and it is a different skill from the algebra underneath it — you are comparing, not solving, and a good chunk of them never need a full calculation. It trains on its own, and it trains fast.',
    MCM: 'Select-one-or-more gives no partial credit, so a single missed option costs the whole question. It is a checking discipline — test every option independently — rather than harder maths.',
    NE: 'Numeric Entry takes away the options, so you cannot work backwards or eliminate. Set up once and commit; re-deriving is what eats the clock here.',
  };
  const qc = readable.find((t) => t.key === 'QC');
  const methodTypes = readable.filter((t) => METHOD_NOTE[t.key]);
  const material = a.config.TYPE_MATERIAL_GAP;
  const pick = (qc && qc.pct < overall - material)
    ? qc
    : methodTypes.slice().sort((x, y) => x.pct - y.pct)[0];

  $('#dxFormatRead').innerHTML = pick && !pick.thin && pick.pct < overall - material
    ? `<b>${esc(pick.label)}</b> is ${pick.pct}% for you against ${overall}% overall — ${pick.correct} of ${pick.n}. ${METHOD_NOTE[pick.key]}`
    : `No single question format is costing you points here — your accuracy holds across all four, so the work below is about content and the clock rather than format technique.`;

  const host = $('#dxFormatChart'); host.innerHTML = ''; host.appendChild(typeBars(a));

  const s = a.settings;
  const weak = s.favours === 'real' ? 'pure' : 'real';
  const card = (k, t, v, d) => `
    <div class="dx-split-card${s.significant && k === weak ? ' is-weak' : ''}">
      <div class="dx-split-v">${v}</div>
      <div class="dx-split-l">${t}</div>
      <div class="dx-split-d">${d}</div>
    </div>`;
  $('#dxSettingSplit').innerHTML =
    card('pure', 'Abstract questions', `${s.pure.correct}/${s.pure.n}`, 'Pure symbols — an equation, a ratio, a figure with no story around it.') +
    card('real', 'Real-life questions', `${s.real.correct}/${s.real.n}`, 'The same maths wrapped in a situation you have to translate first.') +
    `<div class="dx-split-card"><div class="dx-split-v">${Math.abs(s.gap)}</div>
       <div class="dx-split-l">point gap</div>
       <div class="dx-split-d">${s.significant
         ? `Real and worth naming — it points at ${s.favours === 'real' ? 'symbolic fluency' : 'translating the words into maths'}, not at the topics themselves.`
         : 'Too small to read as a real split — the two sit within noise of each other.'}</div></div>`;
}

/* ============================================================
   Section 1 vs Section 2 — the adaptive read
   Most students never learn that the second section's difficulty is
   chosen by how the first one went, so they read a lower second
   score as failure. Often it is the opposite.
   ============================================================ */

function renderSections() {
  const a = state.analysis, [s1, s2] = a.sections;
  $('#dxSectionRead').innerHTML = esc(a.stamina.read);

  const card = (s, label) => `
    <div class="dx-sec-card">
      <div class="dx-sec-h">${label}</div>
      <div class="dx-sec-v">${s.correct}/${s.n} · ${s.pct}%</div>
      <div class="dx-sec-m">Average difficulty <b>${s.meanDifficulty.toFixed(1)}</b> of 5<br>
        Used <b>${mmss(s.seconds)}</b> of ${mmss(s.budget)}${s.spare >= 0 ? ` — ${mmss(Math.abs(s.spare))} spare` : ''}</div>
    </div>`;
  $('#dxSectionStats').innerHTML = card(s1, 'Section 1') + card(s2, 'Section 2') + `
    <div class="dx-sec-card">
      <div class="dx-sec-h">Difficulty shift</div>
      <div class="dx-sec-v">${a.stamina.difficultyRise > 0 ? '+' : ''}${a.stamina.difficultyRise}</div>
      <div class="dx-sec-m">${a.stamina.secondSectionHarder
        ? 'The engine raised the level because Section 1 went well. Some of the accuracy drop is the reward, not a fault.'
        : 'Both sections sat at a similar level, so the change in accuracy is about stamina rather than a harder paper.'}</div>
    </div>`;

  $('#dxSectionNote').textContent =
    'GRE Quant is section-adaptive: how you do in Section 1 chooses how hard Section 2 is. ' +
    'That makes Section 1 worth more than its share of questions — which is why the plan front-loads accuracy over speed.';
}

/* ============================================================
   The honest moat
   Every line here is a real, structural limit of the ETS report —
   not a sales claim dressed as one. That is the point: the gap is
   genuine, so naming it plainly is both the truthful thing to do
   and the strongest argument for the thing that closes it.
   ============================================================ */

function renderMoat() {
  const a = state.analysis, p = state.plan;
  const w = a.weakestArea;
  const inArea = Object.entries(state.taxonomy || {})
    .filter(([, v]) => (AREA_TO_TOPICS[w.key] || []).includes(v.topic))
    .map(([, v]) => v);
  const subs = inArea.length;
  // Example subtopics must come from the student's OWN weakest area —
  // an earlier draft hardcoded them and cheerfully offered "ratios or
  // remainders" as examples of Geometry.
  const egs = inArea.slice().sort((x, y) => (y.count || 0) - (x.count || 0))
    .slice(0, 2).map((v) => v.name);

  $('#dxMoatLead').innerHTML =
    `Everything above came out of a single ETS table, and that table has hard limits. ` +
    `These are the questions it cannot answer about you — worth knowing whether or not you ever pay us a rupee.`;

  const items = [
    `<b>It names four areas, never a topic.</b> It can tell you ${esc(w.label)} is ${w.correct} of ${w.n}. ` +
    `It cannot tell you which of the <b>${subs || 'dozen-odd'} ${esc(w.label)} subtopics</b> actually broke` +
    (egs.length === 2 ? ` — ${esc(egs[0])} or ${esc(egs[1])}, or one of the ${Math.max(0, subs - 2)} others. ` : '. ') +
    `No tool reading this file can, including this one. Only questions tagged at subtopic level can.`,

    `<b>It says you got it wrong. It never says why.</b> A wrong answer on this report is one bit of information. ` +
    `It does not know whether you misread the question, fell for the trap answer, or never knew the rule — and those three need completely different fixes.`,

    `<b>It is one sitting, frozen.</b> There is no second data point, so nothing here can tell you whether a fix held, ` +
    `or whether the ${a.timing.sunk.length} question${a.timing.sunk.length === 1 ? '' : 's'} you sank time into ${a.timing.sunk.length === 1 ? 'is' : 'are'} a habit or a bad morning.`,

    `<b>It cannot put a question in front of you.</b> It is a record of a paper you have already sat. ` +
    `Reading it changes nothing by itself — the points come from the reps afterwards.`,
  ];
  $('#dxMoatList').innerHTML = items.map((t) => `<li>${t}</li>`).join('');

  // The price lives in the band directly below this one, so this note
  // is the bridge into it rather than a second pitch with a second ask.
  const m = p?.meta;
  $('#dxMoatNote').innerHTML = m && m.proQuestions
    ? `Each of those four is a data problem, and all four are fixed the same way — by questions tagged at subtopic level, by the trap each one punishes, and by sitting more than once. That is what the bank underneath your plan is: <b>${m.proQuestions} more questions</b> across the ${m.gatedCodes.length} subtopics it already named for you, plus the mocks and sectionals that give you the second reading.`
    : `Each of those four is a data problem, and all four are fixed the same way — by questions tagged at subtopic level, by the trap each one punishes, and by sitting more than once.`;
}

/** One tap that turns the ETS-area inference into a fact. The report
 *  never names a subtopic, so this is the cheapest accuracy we can buy. */
function renderChips() {
  const a = state.analysis;
  const area = a.weakestArea.key;
  const topics = AREA_TO_TOPICS[area] || [];
  const subs = Object.entries(state.taxonomy)
    .filter(([, v]) => topics.includes(v.topic))
    .sort((x, y) => (y[1].count || 0) - (x[1].count || 0))
    .slice(0, 6);
  $('#dxNarrowQ').innerHTML = `Your <b>${esc(a.weakestArea.label)}</b> needs work. Which of these feels worst?`;
  $('#dxChips').innerHTML = subs.map(([code, v]) =>
    `<button type="button" class="dx-chip" data-c="${code}" aria-pressed="${state.narrow.includes(code)}">${esc(v.name)}</button>`).join('')
    + `<button type="button" class="dx-chip" data-c="" aria-pressed="false">Not sure</button>`;
  $('#dxChips').onclick = async (e) => {
    const b = e.target.closest('.dx-chip'); if (!b) return;
    const code = b.dataset.c;
    if (!code) { state.narrow = []; }
    else {
      state.narrow = state.narrow.includes(code)
        ? state.narrow.filter((c) => c !== code) : [...state.narrow, code];
    }
    track('diagnostic_narrowed', { code: code || 'unsure' });
    state.plan = buildPlan(state.analysis, state.taxonomy, { weeks: state.weeks, narrow: state.narrow });
    renderReport();
    $('#dxPlanBand').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

/* ============================================================
   PDF download

   Printing to PDF rather than generating one with a library is a
   deliberate choice. jsPDF + html2canvas would add ~600KB and
   rasterise the page — blurry text, no selection, no search, and
   page breaks that land mid-card. The browser's own print path
   gives vector text, real pagination and costs nothing.
   ============================================================ */

/** Stamp the print masthead. Called on render AND on beforeprint, so a
 *  Ctrl+P (which never touches the download button) still produces a
 *  titled, dated document. */
function stampPrintHeader() {
  const a = state.analysis;
  if (!a) return;
  $('#dxPrintTitle').textContent =
    `Quant diagnostic — ${a.overall.correct}/${a.overall.n}, aiming for ${a.gap.target}`;
  $('#dxPrintDate').textContent = new Date().toLocaleDateString('en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' });
}

function downloadPdf() {
  track('diagnostic_printed', { archetype: state.analysis?.archetypes[0].key });
  stampPrintHeader();
  // The table view lives behind a disclosure on screen; a printed plan
  // should carry the underlying numbers rather than hide them.
  const details = $$('#dxReport details');
  const wasOpen = details.map((d) => d.open);
  details.forEach((d) => { d.open = true; });
  const restore = () => details.forEach((d, i) => { d.open = wasOpen[i]; });
  window.addEventListener('afterprint', restore, { once: true });
  setTimeout(() => { print(); setTimeout(restore, 1200); }, 60);
}

/* ============================================================
   Boot
   ============================================================ */

async function init() {
  initLanding();
  $('#dxGenerate').addEventListener('click', generate);
  $('#dxRestart').addEventListener('click', () => location.reload());
  $('#dxFailManual').addEventListener('click', () => {
    state.rows = blankRows();
    renderConfirm({ ok: false, errors: [], warnings: [] }, true);
    show('dxConfirm');
  });
  $('#dxFailRetry').addEventListener('click', () => show('dxLanding'));
  $('#dxPrint').addEventListener('click', downloadPdf);
  $('#dxRedo').addEventListener('click', () => location.reload());
  $$('[data-pro]').forEach((b) => b.addEventListener('click', () =>
    track('diagnostic_pro_cta_clicked', { archetype: state.analysis?.archetypes[0].key })));
  // A file dropped on the landing page is parked in IndexedDB; collect it
  // and go straight to parsing, so the student drops once and lands on
  // their results rather than being asked for the file twice.
  window.__dxReady = true;   // the boot-failure banner watches for this

  const handed = await take();
  if (handed.length) { run(handed); return; }

  show('dxLanding');
}

window.addEventListener('beforeprint', stampPrintHeader);

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
