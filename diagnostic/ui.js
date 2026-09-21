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
import { gapMeter, areaBars, timingMap, timingLegend, timingTable, hideTip } from './charts.js';
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

const state = { rows: [], analysis: null, plan: null, taxonomy: null, target: 165, weeks: 8, narrow: [] };

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

  const tiles = [
    { v: `${a.overall.correct}/${a.overall.n}`, l: 'correct', alert: false },
    { v: `${a.gap.questionsAway}`, l: `questions from ${a.gap.target}`, alert: true },
    { v: mmss(a.timing.sunkSeconds), l: 'lost to questions you got wrong', alert: a.timing.sunkSeconds > 300 },
    { v: `${a.timing.totalSpare}s`, l: 'spare across the whole test', alert: a.timing.totalSpare < 60 },
  ];
  $('#dxTiles').innerHTML = tiles.map((t) =>
    `<div class="dx-tile${t.alert ? ' alert' : ''}"><div class="dx-tile-v">${esc(t.v)}</div><div class="dx-tile-l">${esc(t.l)}</div></div>`).join('');

  /* --- gap --- */
  $('#dxGapText').innerHTML = a.gap.reached
    ? `You are already at <b>${a.gap.target}</b> on this diagnostic. The plan below holds it there under pressure.`
    : `You got <b>${a.gap.have} of ${a.overall.n}</b>. A ${a.gap.target} needs about <b>${a.gap.need}</b>. That is <b>${a.gap.questionsAway} questions</b>${a.gap.named ? ` — and <b>${a.gap.named}</b> of them are already named below` : ''}.`;
  const gapHost = $('#dxGapChart'); gapHost.innerHTML = ''; gapHost.appendChild(gapMeter(a));
  $('#dxGapCaveat').textContent = a.gap.estimateCaveat;

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

  /* --- what we did not conclude --- */
  $('#dxGuards').innerHTML =
    `<b>What this does not tell you.</b><ul>${a.guards.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>`;
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
