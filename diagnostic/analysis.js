/* ============================================================
   GRE Quant Pro — diagnostic analytics engine
   Phase 1.  rows[] -> analysis{}.  Pure, no DOM, no network.

   Every threshold lives in CONFIG so it can be tuned without
   touching logic. Three principles run through the whole file:

   1. Never over-read a small sample. 27 questions is not a lot.
      Any bucket under MIN_SAMPLE is marked `thin` and the UI says
      "too few to read" instead of inventing a trend.
   2. Never claim what the report cannot support. Reference # is a
      position in a difficulty-sorted table, NOT test order, so there
      is no chronological analysis here and there must never be.
   3. Prefer the true finding to the flattering one. A difficulty
      curve that rises is reported as erratic, not as a high ceiling.
   ============================================================ */

export const CONFIG = {
  MIN_SAMPLE: 4,            // below this a bucket is `thin`
  SETTING_MIN_SAMPLE: 8,    // Pure/Real split needs real samples both sides
  SUNK_SECONDS: 120,        // wrong AND at least this long = sunk cost
  RUSHED_SECONDS: 60,       // wrong AND at most this long = rushed
  FAST_AREA_TEMPO: 75,      // mean error time below this = "stuck", not "slow"
  SLOW_AREA_TEMPO: 110,     // mean error time above this = "grinding"
  CEILING_PCT: 70,          // highest level still at/above this
  MONOTONIC_TOLERANCE: 10,  // a curve may rise by this much and still count
  ADAPTIVE_DELTA: 0.4,      // mean-difficulty rise that counts as "harder S2"
  FADER_DROP: 12,           // S1->S2 accuracy drop, in points
  SETTING_GAP: 20,          // Pure/Real gap worth naming
  WALL_MIN_ERRORS: 3,
  SINKER_MIN_COUNT: 2,
  SINKER_MIN_SECONDS: 420,
  RUSHER_MIN_COUNT: 4,

  // Archetype severities are scaled so they are comparable to each
  // other; the top two are shown. Tuned against the two real reports
  // so the headline is the most actionable finding, not just the
  // largest number. See ARCHETYPE_NOTES at the bottom.
  W_WALL: 15,       // per error in the walled area
  W_SINKER: 0.1,    // per second sunk
  W_SETTING: 2,     // per point of Pure/Real gap
  W_RUSHER: 10,     // per rushed error
  W_FADER: 1,       // per point of unexplained drop
  W_CEILING: 1,     // per point of low-vs-high gap
};

/** Approximate raw score needed for a scaled Quant score on a
 *  27-question form. ETS publishes no conversion table and it moves
 *  by form, so these are estimates and the UI must label them as
 *  such. Kept here so they are tuned in one place. */
export const RAW_FOR_SCALED = { 160: 21, 162: 22, 165: 24, 168: 26, 170: 27 };

export const AREA_LABELS = {
  Arithmetic: 'Arithmetic', Algebra: 'Algebra',
  Geometry: 'Geometry', DataAnalysis: 'Data Analysis',
};
export const TYPE_LABELS = {
  QC: 'Quantitative Comparison', MC1: 'Multiple choice (one answer)',
  MCM: 'Multiple choice (one or more)', NE: 'Numeric Entry',
};
export const SECTION_BUDGETS = { 1: 21 * 60, 2: 26 * 60 };

/* ---------- small helpers ---------- */

const pct = (c, n) => (n ? (100 * c) / n : 0);
const round1 = (x) => Math.round(x * 10) / 10;

function tally(rows, cfg = CONFIG) {
  const n = rows.length;
  const correct = rows.filter((r) => r.verdict === 'R').length;
  return {
    n, correct, wrong: n - correct,
    pct: round1(pct(correct, n)),
    thin: n < cfg.MIN_SAMPLE,
  };
}

const sum = (rows, f) => rows.reduce((a, r) => a + f(r), 0);
const mean = (rows, f) => (rows.length ? sum(rows, f) / rows.length : 0);

/* ---------- the engine ---------- */

/**
 * @param rows   parser output (27 rows)
 * @param opts   { target=165, testDate=null }
 */
export function analyse(rows, opts = {}) {
  const cfg = { ...CONFIG, ...(opts.config || {}) };
  const target = opts.target ?? 165;
  const errors = rows.filter((r) => r.verdict === 'W');

  /* --- sections and pace --- */
  const sections = [1, 2].map((s) => {
    const rs = rows.filter((r) => r.section === s);
    const seconds = sum(rs, (r) => r.seconds);
    const budget = SECTION_BUDGETS[s];
    return {
      section: s, ...tally(rs, cfg), seconds, budget, spare: budget - seconds,
      meanDifficulty: round1(mean(rs.filter((r) => r.difficulty), (r) => r.difficulty)),
    };
  });
  const totalSpare = sections.reduce((a, s) => a + s.spare, 0);

  /* --- content areas --- */
  const areas = Object.keys(AREA_LABELS).map((key) => {
    const rs = rows.filter((r) => r.area === key);
    const errs = rs.filter((r) => r.verdict === 'W');
    const avgErrorSeconds = errs.length ? Math.round(mean(errs, (r) => r.seconds)) : null;
    let tempo = null;
    if (errs.length >= 2) {
      tempo = avgErrorSeconds <= cfg.FAST_AREA_TEMPO ? 'fast'
            : avgErrorSeconds >= cfg.SLOW_AREA_TEMPO ? 'slow' : 'mixed';
    }
    return { key, label: AREA_LABELS[key], ...tally(rs, cfg), avgErrorSeconds, tempo };
  }).sort((a, b) => a.pct - b.pct);          // weakest first — the UI reads top-down

  /* --- difficulty curve, with the monotonicity guard --- */
  const levels = [1, 2, 3, 4, 5].map((d) => {
    const rs = rows.filter((r) => r.difficulty === d);
    return { level: d, ...tally(rs, cfg) };
  }).filter((l) => l.n > 0);

  const usable = levels.filter((l) => l.n >= 2);
  let monotonic = true;
  for (let i = 0; i < usable.length - 1; i++) {
    if (usable[i + 1].pct > usable[i].pct + cfg.MONOTONIC_TOLERANCE) { monotonic = false; break; }
  }
  // A ceiling is only meaningful on a falling curve. On an erratic one
  // the honest reading is "topic gaps, not a level limit" — which is
  // also the more useful thing to tell the student.
  const ceiling = monotonic
    ? (usable.filter((l) => l.pct >= cfg.CEILING_PCT).map((l) => l.level).pop() ?? null)
    : null;
  const erraticLevels = monotonic ? [] : usable.filter((l) => l.pct < 60).map((l) => l.level);

  const difficulty = {
    levels, monotonic, ceiling, erraticLevels,
    read: monotonic
      ? (ceiling
          ? `Accuracy holds to level ${ceiling} and falls after it.`
          : 'Accuracy is below the reliable line at every difficulty.')
      : 'Accuracy does not fall with difficulty — it jumps around. That points at specific topic gaps rather than a general level limit.',
  };

  /* --- question types --- */
  const types = Object.keys(TYPE_LABELS).map((key) => {
    const rs = rows.filter((r) => r.qtype === key);
    return {
      key, label: TYPE_LABELS[key], ...tally(rs, cfg),
      avgSeconds: rs.length ? Math.round(mean(rs, (r) => r.seconds)) : null,
    };
  }).filter((t) => t.n > 0);

  /* --- setting: abstract vs dressed-up --- */
  const pureRows = rows.filter((r) => r.setting === 'Pure');
  const realRows = rows.filter((r) => r.setting === 'Real');
  const pure = tally(pureRows, cfg), real = tally(realRows, cfg);
  const settingGap = round1(real.pct - pure.pct);
  const settings = {
    pure, real, gap: settingGap,
    significant: Math.abs(settingGap) >= cfg.SETTING_GAP
      && pure.n >= cfg.SETTING_MIN_SAMPLE && real.n >= cfg.SETTING_MIN_SAMPLE,
    favours: settingGap > 0 ? 'real' : 'pure',
  };

  /* --- timing forensics --- */
  const sunk = errors.filter((r) => r.seconds >= cfg.SUNK_SECONDS)
    .sort((a, b) => b.seconds - a.seconds);
  const rushed = errors.filter((r) => r.seconds <= cfg.RUSHED_SECONDS)
    .sort((a, b) => a.seconds - b.seconds);
  const rightRows = rows.filter((r) => r.verdict === 'R');
  const timing = {
    avgWrong: errors.length ? Math.round(mean(errors, (r) => r.seconds)) : null,
    avgRight: rightRows.length ? Math.round(mean(rightRows, (r) => r.seconds)) : null,
    sunk, sunkSeconds: sum(sunk, (r) => r.seconds),
    rushed, totalSpare,
    // Scatter data for the timing map — the one chart that must ship.
    points: rows.map((r) => ({
      seconds: r.seconds, difficulty: r.difficulty, verdict: r.verdict,
      area: r.area, qtype: r.qtype, setting: r.setting, section: r.section,
      zone: r.verdict === 'W' && r.seconds >= cfg.SUNK_SECONDS ? 'sunk'
          : r.verdict === 'W' && r.seconds <= cfg.RUSHED_SECONDS ? 'rushed' : null,
    })),
  };

  /* --- stamina, net of the adaptive engine --- */
  const [s1, s2] = sections;
  const difficultyRise = round1(s2.meanDifficulty - s1.meanDifficulty);
  const stamina = {
    s1Pct: s1.pct, s2Pct: s2.pct,
    drop: round1(s1.pct - s2.pct),
    difficultyRise,
    secondSectionHarder: difficultyRise >= cfg.ADAPTIVE_DELTA,
    // Say the good news first: a harder second section is the adaptive
    // engine rewarding a decent first one, not a failure.
    read: difficultyRise >= cfg.ADAPTIVE_DELTA
      ? `Your second section was harder (mean difficulty ${s1.meanDifficulty.toFixed(1)} → ${s2.meanDifficulty.toFixed(1)}) — the test raised the level because your first section went well. Some of the accuracy drop is expected.`
      : 'Both sections sat at a similar difficulty, so the change in accuracy is a stamina reading rather than a harder paper.',
  };

  /* --- archetypes --- */
  const candidates = [];

  for (const a of areas) {
    if (a.wrong >= cfg.WALL_MIN_ERRORS && a.tempo === 'fast') {
      candidates.push({
        key: 'wall', area: a.key, label: `The Wall — ${a.label}`,
        headline: `You're not slow at ${a.label}. You're stuck.`,
        evidence: `${a.wrong} of your errors are in ${a.label}, and they took an average of ${a.avgErrorSeconds} seconds. A fast wrong answer means you looked at it and had no idea where to start.`,
        prescription: 'content',
        severity: a.wrong * cfg.W_WALL,
      });
    }
  }
  if (sunk.length >= cfg.SINKER_MIN_COUNT && timing.sunkSeconds >= cfg.SINKER_MIN_SECONDS) {
    const m = Math.floor(timing.sunkSeconds / 60), s = timing.sunkSeconds % 60;
    candidates.push({
      key: 'sinker', label: 'The Sinker',
      headline: `${sunk.length} questions ate ${m}:${String(s).padStart(2, '0')} of your test. You got none of them right.`,
      evidence: `Wrong answers that took over two minutes: ${sunk.map((r) => `${AREA_LABELS[r.area]} ${Math.floor(r.seconds / 60)}:${String(r.seconds % 60).padStart(2, '0')}`).join(', ')}.`,
      prescription: 'behaviour',
      severity: timing.sunkSeconds * cfg.W_SINKER,
    });
  }
  if (settings.significant) {
    const real = settings.favours === 'real';
    candidates.push({
      key: real ? 'translator' : 'purist',
      label: real ? 'The Translator' : 'The Purist',
      headline: real
        ? "You can do the word problems. You can't do the pure math."
        : 'The maths is fine. The wording is beating you.',
      evidence: real
        ? `Real-life questions ${settings.real.correct}/${settings.real.n} (${settings.real.pct}%), abstract questions ${settings.pure.correct}/${settings.pure.n} (${settings.pure.pct}%). Your reasoning works; the symbolic layer doesn't.`
        : `Abstract questions ${settings.pure.correct}/${settings.pure.n} (${settings.pure.pct}%), real-life questions ${settings.real.correct}/${settings.real.n} (${settings.real.pct}%). You can do the maths once you find it.`,
      prescription: real ? 'fluency' : 'translation',
      severity: Math.abs(settings.gap) * cfg.W_SETTING,
    });
  }
  if (rushed.length >= cfg.RUSHER_MIN_COUNT) {
    candidates.push({
      key: 'rusher', label: 'The Rusher',
      headline: "You're fast. That's the problem.",
      evidence: `${rushed.length} wrong answers took under a minute each.`,
      prescription: 'behaviour',
      severity: rushed.length * cfg.W_RUSHER,
    });
  }
  // Fader only fires when the drop is NOT explained by a harder section.
  if (stamina.drop >= cfg.FADER_DROP && !stamina.secondSectionHarder) {
    candidates.push({
      key: 'fader', label: 'The Fader',
      headline: 'You start strong and drain.',
      evidence: `Section 1 ${s1.pct}%, section 2 ${s2.pct}%, at the same difficulty.`,
      prescription: 'behaviour',
      severity: stamina.drop * cfg.W_FADER,
    });
  }
  const low = tally(rows.filter((r) => r.difficulty && r.difficulty <= 3), cfg);
  const high = tally(rows.filter((r) => r.difficulty && r.difficulty >= 4), cfg);
  if (difficulty.monotonic && low.pct >= 75 && high.pct <= 40 && high.n >= cfg.MIN_SAMPLE) {
    candidates.push({
      key: 'ceiling', label: 'The Ceiling',
      headline: "Your fundamentals are fine. Your top end isn't.",
      evidence: `Levels 1–3: ${low.pct}%. Levels 4–5: ${high.pct}%.`,
      prescription: 'content',
      severity: (low.pct - high.pct) * cfg.W_CEILING,
    });
  }

  candidates.sort((a, b) => b.severity - a.severity);
  const archetypes = candidates.length ? candidates.slice(0, 2) : [{
    key: 'grinder', label: 'The Grinder',
    headline: 'No single leak — your errors are spread evenly.',
    evidence: 'Nothing dominates, which means volume and consolidation rather than surgery on one weakness.',
    prescription: 'volume', severity: 0,
  }];

  /* --- the gap, stated in questions --- */
  const have = rows.filter((r) => r.verdict === 'R').length;
  const need = RAW_FOR_SCALED[target] ?? RAW_FOR_SCALED[165];
  const questionsAway = Math.max(0, need - have);
  const weakest = areas[0];
  const namedSet = new Set([
    ...errors.filter((r) => r.area === weakest.key),
    ...sunk,
  ]);
  const named = Math.min(namedSet.size, questionsAway);
  const gap = {
    target, need, have, questionsAway, named,
    reached: questionsAway === 0,
    estimateCaveat: 'ETS publishes no raw-to-scaled table and it varies by form, so this is an estimate.',
  };

  /* --- what was deliberately not said --- */
  const guards = [];
  for (const t of types) if (t.thin) guards.push(`${t.label}: only ${t.n} question${t.n === 1 ? '' : 's'} — too few to read`);
  for (const a of areas) if (a.thin) guards.push(`${a.label}: only ${a.n} questions — too few to read`);
  if (!settings.significant && pure.n >= cfg.SETTING_MIN_SAMPLE && real.n >= cfg.SETTING_MIN_SAMPLE) {
    guards.push(`Abstract vs real-life differ by ${Math.abs(settings.gap)} points — not a real split`);
  }
  guards.push('The report lists questions by difficulty, not by the order you saw them, so there is no "you slowed down at the end" reading here.');

  return {
    overall: tally(rows, cfg),
    sections, areas, difficulty, types, settings, timing, stamina,
    archetypes, gap, guards,
    weakestArea: weakest,
    config: cfg,
  };
}

/* ARCHETYPE_NOTES
   Severity weights were tuned against the two verified reports:

   Student A — Wall(Geometry) 4 errors averaging 60s -> 60;
               Sinker 551s -> 55.1.  Wall leads, Sinker second.
               Fader correctly suppressed: the 13.4-point drop is
               explained by mean difficulty rising 2.9 -> 3.7.

   Student B — Translator, 37-point gap -> 74;
               Sinker 585s -> 58.5;  Wall(Arithmetic) 3 -> 45.
               Translator leads, Sinker second.

   A content hole is weighted above a behavioural one of similar size
   because it is the more actionable finding, and a large setting gap
   is weighted above both because it re-frames every other number.
*/
