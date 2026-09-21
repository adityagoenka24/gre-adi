/* ============================================================
   GRE Quant Pro — study plan generator
   Phase 2.  analysis{} + taxonomy -> plan{}.  Pure, no DOM.

   Turns the diagnosis into a week-by-week schedule made of REAL
   assets: 86 subtopics, every one with a concept capsule, 34 with a
   printable practice sheet, all with a bank drill.

   Four rules that came out of the two verified reports:

   1. Week 1 always carries the abandon-discipline rule. Both real
      students lost over nine minutes to questions they refused to
      give up on, and got none of them right. It costs no new content
      to fix and is worth more points than any single topic.
   2. Every item is concrete and linked. "Revise Geometry" is
      worthless; "read Circles -> sheet Q1-15 -> 20 medium GEO-CIR
      drills -> you should hit 70%" is a product.
   3. Locks are HONEST and derived from real bank depth. Free holds
      10 questions per tier in 24 subtopics; Pro holds 20-30 per tier
      across 86. A 20-question medium drill therefore genuinely
      exceeds free — so it is shown as "10 now, 17 more with Pro"
      rather than as a wall. The student can always start.
   4. Weeks are allocated by where the errors actually are, not
      evenly. The area holding a third of the errors gets a third of
      the weeks.
   ============================================================ */

/** ETS reports four coarse areas. The bank has eight topics.
 *  This is the bridge, and it is an INFERENCE — the report never
 *  names a subtopic, so copy built on it says "likely". */
export const AREA_TO_TOPICS = {
  Arithmetic:   ['Arithmetic', 'Number Properties'],
  Algebra:      ['Algebra', 'Word Problems'],
  Geometry:     ['Geometry', 'Coordinate Geometry'],
  DataAnalysis: ['Statistics & Probability', 'Data Interpretation'],
};

/** Symbolic fluency — the prescription for a Translator, who reasons
 *  fine but stalls once the question is abstract. */
export const FLUENCY_CODES = [
  'ALG-EXP', 'ALG-FAC', 'ALG-EXR', 'ALG-INQ', 'ALG-LIN',
  'NUM-FAM', 'NUM-GCL', 'NUM-DIV', 'ARI-EXP',
];
/** Translation — the prescription for a Purist, who can do the maths
 *  once they find it. */
export const TRANSLATION_CODES = [
  'ALG-WPM', 'WRD-DST', 'WRD-WRK', 'WRD-MIX', 'WRD-PCT', 'WRD-RAT',
];

export const STRATEGY = {
  QC:     { title: 'Quantitative Comparison — Method',   path: '/learn/exam-strategy/quantitative-comparison.html' },
  TIMING: { title: 'Time Management & Test-Day Tactics', path: '/learn/exam-strategy/time-management.html' },
};

export const WEEK_OPTIONS = [4, 6, 8, 12];
const TIER_KEY = { easy: 'easy', medium: 'medium', hard: 'hard', extreme: 'extreme_hard' };
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ---------- drill tier, chosen from the difficulty curve ---------- */

export function drillTier(analysis) {
  const d = analysis.difficulty;
  if (!d.monotonic) {
    return { tiers: ['medium', 'hard'], why: 'Your accuracy jumps around rather than falling with difficulty, so this is about closing specific gaps, not climbing a ladder.' };
  }
  if (d.ceiling === null || d.ceiling <= 1) {
    return { tiers: ['easy', 'medium'], why: 'Start below where you are failing and build up — drilling hard questions now would only repeat the same errors.' };
  }
  if (d.ceiling <= 2) {
    return { tiers: ['easy', 'medium'], why: `You hold up to level ${d.ceiling} and fall away after it, so the work sits just above your current line.` };
  }
  if (d.ceiling === 3) return { tiers: ['medium', 'hard'], why: 'You are solid to level 3. Level 4 is where your target score is decided.' };
  return { tiers: ['hard', 'extreme'], why: 'Your fundamentals hold. Only the top tier moves your score now.' };
}

/* ---------- honest drill capacity ---------- */

/** How many questions of these tiers the free bank and Pro actually hold. */
export function drillCapacity(sub, tiers) {
  const cap = (dist) => tiers.reduce((a, t) => a + ((dist || {})[TIER_KEY[t]] || 0), 0);
  const free = cap(sub.freeDist), pro = cap(sub.proDist);
  return { free, pro, total: free + pro };
}

/* ---------- picking subtopics inside an area ---------- */

/**
 * The report cannot name a subtopic, so rank candidates by the signals
 * it does give, plus what the library can actually teach.
 *  - a student-chosen narrowing beats everything
 *  - archetype prescription biases the choice
 *  - bank size is a fair proxy for how often the GRE tests it
 *  - a printable practice sheet makes a subtopic more useful
 */
export function pickSubtopics(taxonomy, areaKey, { narrow = [], limit = 3, prefer = [], exclude = [], freeFirst = false } = {}) {
  const topics = AREA_TO_TOPICS[areaKey] || [];
  const score = (s) => {
    let n = Math.min(s.count || 0, 90);
    if (narrow.includes(s.code)) n += 1000;
    if (prefer.includes(s.code)) n += 400;
    // The student's first week of content should be one they can finish
    // without paying. Later weeks rank on merit alone.
    if (freeFirst && s.free) n += 200;
    if (s.practice) n += 30;
    return n;
  };
  return Object.entries(taxonomy)
    .filter(([code, v]) => topics.includes(v.topic) && !exclude.includes(code))
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

/* ---------- item builders ---------- */

const capsuleItem = (s) => ({
  // `url` is the published /learn/ page; `capsule` is the repo markdown path
  // and only a fallback for a taxonomy built before the site existed.
  kind: 'capsule', code: s.code, label: `Read: ${s.name}`,
  href: s.url || s.capsule, locked: false,
  detail: 'Concept capsule — core idea, rules, three worked examples, the traps, speed tricks.',
});

const sheetItem = (s) => s.practice ? {
  kind: 'practice', code: s.code, label: `Practice sheet: ${s.name}`,
  href: s.practiceUrl || s.practice, locked: false,
  detail: '30 questions, level-wise, with full worked solutions and the trap named.',
} : null;

function drillItem(s, tiers, want) {
  const capacity = drillCapacity(s, tiers);
  const freeHas = Math.min(want, capacity.free);
  const short = Math.max(0, want - capacity.free);
  return {
    kind: 'drill', code: s.code,
    label: `Drill: ${s.name}`,
    href: `/gre_practice_logger_free.html?topic=${s.code}&tier=${tiers.join(',')}`,
    locked: freeHas === 0,
    partial: freeHas > 0 && short > 0,
    freeCount: freeHas, proCount: capacity.pro, want,
    detail: short === 0
      ? `${want} ${tiers.join('/')} questions from the ${s.code} bank.`
      : freeHas === 0
        ? `${s.code} is Pro-only — ${capacity.pro} ${tiers.join('/')} questions, ${s.count} in total.`
        : `${freeHas} ${tiers.join('/')} questions free. Pro adds ${capacity.pro} more in ${s.code} alone.`,
  };
}

const ruleItem = (label, detail) => ({ kind: 'rule', label, detail, href: null, locked: false });
const checkItem = (label, detail, href = null) => ({ kind: 'checkpoint', label, detail, href, locked: false });

/* ---------- largest-remainder week allocation ---------- */

export function allocateWeeks(areas, available) {
  if (!areas.length || available <= 0) return new Map();
  const totalErrors = areas.reduce((a, x) => a + x.wrong, 0) || areas.length;
  const raw = areas.map((a) => ({ key: a.key, exact: (a.wrong / totalErrors) * available }));
  const alloc = new Map(raw.map((r) => [r.key, Math.max(1, Math.floor(r.exact))]));
  let used = [...alloc.values()].reduce((a, b) => a + b, 0);
  // Remainders must be measured against what was ACTUALLY allocated, not
  // against the raw floor: an area clamped up from 0 to 1 has already had
  // its share and must not also win the spare week ahead of the weakest
  // area. (Caught on Student A, where Arithmetic outranked the Geometry
  // wall despite having half the errors.)
  const byRemainder = raw.slice().sort((a, b) =>
    (b.exact - alloc.get(b.key)) - (a.exact - alloc.get(a.key)));
  let i = 0;
  while (used < available && byRemainder.length) {
    const k = byRemainder[i % byRemainder.length].key;
    alloc.set(k, alloc.get(k) + 1); used++; i++;
  }
  const bySmallest = raw.slice().sort((a, b) => a.exact - b.exact);
  i = 0;
  while (used > available && bySmallest.length) {
    const k = bySmallest[i % bySmallest.length].key;
    if (alloc.get(k) > 1) { alloc.set(k, alloc.get(k) - 1); used--; }
    else if (alloc.size > 1 && i > bySmallest.length * 2) { alloc.delete(k); used--; }
    i++;
    if (i > 100) break;
  }
  return alloc;
}

/* ---------- the generator ---------- */

/**
 * @param analysis  output of analyse()
 * @param taxonomy  taxonomy.json
 * @param opts      { weeks=8, narrow=[], testDate=null }
 */
export function buildPlan(analysis, taxonomy, opts = {}) {
  const weeks = WEEK_OPTIONS.includes(opts.weeks) ? opts.weeks : 8;
  const narrow = opts.narrow || [];
  const tier = drillTier(analysis);
  const prescriptions = analysis.archetypes.map((a) => a.prescription);
  const usedCapsules = new Set();          // a capsule is never repeated
  const usedSubs = new Set();

  const prefer = prescriptions.includes('fluency') ? FLUENCY_CODES
    : prescriptions.includes('translation') ? TRANSLATION_CODES : [];

  // Areas worth working, weakest first. Data Analysis at 88% does not
  // need a week; that time belongs to the areas losing points.
  const weak = analysis.areas.filter((a) => a.pct < 75 && a.wrong > 0);
  const targetAreas = weak.length ? weak : analysis.areas.slice(0, 1);

  const wantsArchetypeWeek = prescriptions.includes('fluency') || prescriptions.includes('translation');
  const typeSurgery = buildTypeSurgery(analysis);
  const reserved = 1 + (wantsArchetypeWeek ? 1 : 0) + (typeSurgery.length ? 1 : 0) + 1;
  const areaWeeks = Math.max(1, weeks - reserved);
  const alloc = allocateWeeks(targetAreas, areaWeeks);

  const out = [];
  const addCapsule = (week, s) => {
    if (usedCapsules.has(s.code)) return false;
    usedCapsules.add(s.code); week.items.push(capsuleItem(s)); return true;
  };

  /* --- Week 1: behaviour. No content — it would duplicate week 2. --- */
  const w1 = { n: 1, title: 'Stop the bleeding', items: [] };
  const sunkN = analysis.timing.sunk.length;
  if (sunkN) {
    w1.why = `${sunkN} question${sunkN === 1 ? '' : 's'} took ${fmt(analysis.timing.sunkSeconds)} of your test and you got ${sunkN === 1 ? 'it' : 'none of them'} right. Nothing else on this plan is worth as many points as fixing that, and it needs no new maths.`;
    w1.items.push(ruleItem('The 2-minute rule',
      `Practise every set with a visible timer. At two minutes, if you cannot see the finish, mark it and move. Your longest wrong answer took ${fmt(analysis.timing.sunk[0].seconds)}.`));
  } else {
    w1.why = 'Your pacing is already sound, so week 1 sets the habits and goes straight at your weakest area from week 2.';
  }
  if (analysis.timing.rushed.length >= 3) {
    w1.items.push(ruleItem('The 40-second floor',
      `${analysis.timing.rushed.length} of your wrong answers took under a minute. A fast wrong answer is a question you never really read — before committing, say what is actually being asked.`));
  }
  if (analysis.timing.totalSpare < 60) {
    w1.items.push(ruleItem('Build a buffer',
      `You finished the whole test with ${analysis.timing.totalSpare} seconds to spare. There is no room to absorb one slow question — the 2-minute rule is what creates that room.`));
  }
  w1.items.push({ kind: 'capsule', label: `Read: ${STRATEGY.TIMING.title}`, href: STRATEGY.TIMING.path, locked: false, detail: 'Pacing, when to abandon, and test-day tactics.' });
  w1.items.push(checkItem('One timed sectional', 'Same content as usual. The only goal this week is that nothing runs past two minutes.', '/sectional.html'));
  w1.checkpoint = 'Success this week is not a higher score. It is zero questions over two minutes.';
  out.push(w1);

  /* --- the archetype week, when the headline finding is a mode --- */
  if (wantsArchetypeWeek) {
    const fluency = prescriptions.includes('fluency');
    // The headline finding must be startable. Take up to two free
    // subtopics first, then fill from the priority list — so the student
    // can begin on their biggest weakness without paying, and still sees
    // the depth sitting behind it.
    const pool = (fluency ? FLUENCY_CODES : TRANSLATION_CODES)
      .filter((c) => taxonomy[c]).map((c) => ({ code: c, ...taxonomy[c] }));
    const codes = [
      ...pool.filter((s2) => s2.free).slice(0, 2),
      ...pool.filter((s2) => !s2.free),
    ].slice(0, 3);
    const wk = {
      n: out.length + 1,
      title: fluency ? 'Abstract maths, on its own terms' : 'Reading the question',
      why: fluency
        ? `${analysis.settings.real.pct}% on real-life questions against ${analysis.settings.pure.pct}% on abstract ones. Your reasoning is not the problem — symbols are. This week is pure notation, deliberately stripped of any story.`
        : `${analysis.settings.pure.pct}% on abstract questions against ${analysis.settings.real.pct}% on real-life ones. You can do the maths once you find it; the work is in finding it.`,
      items: [],
    };
    for (const s of codes) {
      addCapsule(wk, s);
      const sh = sheetItem(s);
      if (sh) wk.items.push(sh);
      const cap = drillCapacity(s, tier.tiers).free;
      wk.items.push(drillItem(s, tier.tiers, cap > 0 ? Math.min(20, cap) : 20));
      usedSubs.add(s.code);
    }
    wk.checkpoint = fluency
      ? `Target: close the abstract-vs-real gap from ${Math.abs(analysis.settings.gap)} points to under 15.`
      : 'Target: translate every word problem into an equation before solving anything.';
    out.push(wk);
  }

  /* --- area weeks, allocated by where the errors are --- */
  for (const area of targetAreas) {
    const span = alloc.get(area.key) || 0;
    if (!span) continue;
    const subs = pickSubtopics(taxonomy, area.key, {
      narrow, prefer, limit: span * 2, exclude: [...usedSubs],
      freeFirst: out.length === (wantsArchetypeWeek ? 2 : 1),   // the first content week
    });
    for (let k = 0; k < span; k++) {
      const slice = subs.slice(k * 2, k * 2 + 2);
      if (!slice.length) break;
      slice.forEach((s) => usedSubs.add(s.code));
      const first = k === 0;
      const week = {
        n: out.length + 1,
        title: `${area.label} — ${first ? 'the foundations' : 'under pressure'}`,
        why: whyForArea(area, first),
        items: [],
      };
      const firstContentWeek = week.n === (wantsArchetypeWeek ? 3 : 2);
      for (const s of slice) {
        addCapsule(week, s);
        const sh = sheetItem(s);
        if (sh) week.items.push(sh);
        const tiers = first ? [tier.tiers[0]] : tier.tiers;
        // Week 1 is behaviour, so the first content week is the student's
        // first real taste. Size it to what the free bank holds so they can
        // genuinely finish it; the ceiling then arrives on its own.
        const cap = drillCapacity(s, tiers).free;
        const want = firstContentWeek && cap > 0 ? Math.min(20, cap) : (first ? 20 : 30);
        week.items.push(drillItem(s, tiers, want));
      }
      week.checkpoint = `Target: 70% on ${slice.map((s) => s.code).join(' and ')} at ${first ? tier.tiers[0] : tier.tiers.join('/')}. Below that, repeat the week rather than moving on.`;
      out.push(week);
    }
  }

  /* --- question-type surgery --- */
  if (typeSurgery.length) {
    const wk = {
      n: out.length + 1, title: 'Question-type surgery',
      why: 'These are not content gaps. They are specific question formats costing you points or time, and they have their own fixes.',
      items: [...typeSurgery],
      checkpoint: 'Re-drill the weak format until it matches your overall accuracy.',
    };
    // A week with one item is not a week. Consolidate on the weakest area
    // so the format work has something to be practised against.
    if (wk.items.length < 2) {
      const extra = pickSubtopics(taxonomy, targetAreas[0].key, {
        narrow, prefer, limit: 1, exclude: [...usedSubs], freeFirst: true,
      })[0];
      if (extra) {
        addCapsule(wk, extra);
        const sh = sheetItem(extra);
        if (sh) wk.items.push(sh);
        wk.items.push(drillItem(extra, tier.tiers, 20));
        usedSubs.add(extra.code);
      }
    }
    wk.items.push(checkItem('One timed sectional',
      `At ${tier.tiers.join('/')}. Apply the format fix under the clock, not in isolation.`, '/sectional.html'));
    out.push(wk);
  }

  /* --- final week --- */
  out.push({
    n: out.length + 1, title: 'Simulate, then re-diagnose',
    why: 'Work done in isolation does not survive a timed section until you have proved that it does.',
    items: [
      checkItem('Full mock under exam timing', 'No pauses, no notes. 21 minutes, then 26 minutes.', '/full_mock.html'),
      checkItem('Two sectionals back to back', `At ${tier.tiers.join('/')}, on the areas you worked.`, '/sectional.html'),
      ruleItem('Re-take the ETS diagnostic', 'Then upload the new report here. The plan rebuilds against your new numbers and you see exactly what moved.'),
    ],
    checkpoint: `On track means converting at least ${Math.max(1, Math.ceil(analysis.gap.questionsAway / 2))} of the ${analysis.gap.questionsAway} questions between you and ${analysis.gap.target}.`,
  });

  /* --- meta --- */
  const allItems = out.flatMap((w) => w.items);
  const drills = allItems.filter((i) => i.kind === 'drill');
  const gated = drills.filter((i) => i.locked || i.partial);
  const codes = [...new Set(gated.map((i) => i.code))];
  const proQuestions = codes.reduce((a, c) => a + ((taxonomy[c]?.count || 0) - (taxonomy[c]?.freeCount || 0)), 0);
  const firstGatedWeek = out.find((w) => w.items.some((i) => i.locked || i.partial))?.n ?? null;

  return {
    weeks: out.map((w, i) => ({ ...w, n: i + 1 })),
    tier,
    meta: {
      weeks: out.length, requestedWeeks: weeks,
      target: analysis.gap.target, questionsAway: analysis.gap.questionsAway,
      primaryArchetype: analysis.archetypes[0].key,
      areasWorked: targetAreas.map((a) => a.key),
      narrowed: narrow.length > 0,
      totalItems: allItems.length,
      drills: drills.length,
      fullyFreeDrills: drills.filter((i) => !i.locked && !i.partial).length,
      partialDrills: drills.filter((i) => i.partial).length,
      lockedDrills: drills.filter((i) => i.locked).length,
      firstGatedWeek, gatedCodes: codes, proQuestions,
      // Contextual, specific, never a generic banner. Week 1 is always
      // free and complete, so the student can genuinely start.
      upgradeLine: gated.length
        ? `From week ${firstGatedWeek}, ${gated.length} of your drill sets run past what the free bank holds — ${proQuestions} more questions across ${codes.length} subtopics sit in Pro. ₹499 for the year.`
        : null,
    },
  };
}

function whyForArea(area, first) {
  if (!first) {
    return `You have the ${area.label} fundamentals now. This week holds them at speed, which is where they broke last time.`;
  }
  if (area.tempo === 'fast') {
    return `${area.wrong} of your errors are in ${area.label}, and they took an average of ${area.avgErrorSeconds} seconds. That is not a timing problem — you did not know where to start. So this week is reading, not drilling.`;
  }
  if (area.tempo === 'slow') {
    return `Your ${area.label} errors averaged ${area.avgErrorSeconds} seconds. You knew enough to begin and picked a route that did not finish, so this week is about method rather than knowledge.`;
  }
  return `${area.label} sits at ${area.pct}% — ${area.correct} of ${area.n}. It is the largest block of points still available to you.`;
}

/** Formats costing points or time, beyond content. Never fires on a thin sample. */
function buildTypeSurgery(analysis) {
  const items = [];
  const overall = analysis.overall.pct;
  for (const t of analysis.types) {
    if (t.thin) continue;
    if (t.key === 'QC' && t.pct < overall - 5) {
      items.push({
        kind: 'capsule', label: `Read: ${STRATEGY.QC.title}`, href: STRATEGY.QC.path, locked: false,
        detail: `Quantitative Comparison is ${t.pct}% for you against ${overall}% overall, across ${t.n} questions. It is a distinct skill with its own method — not more algebra.`,
      });
    }
    if (t.key === 'MCM' && t.pct < overall - 10) {
      items.push(ruleItem('Multi-select discipline',
        `Select-one-or-more is ${t.pct}% for you. Test every option independently — there is no partial credit.`));
    }
  }
  const ne = analysis.types.find((t) => t.key === 'NE');
  if (ne && ne.avgSeconds > 150) {
    items.push(ruleItem(ne.thin ? 'Watch Numeric Entry timing' : 'Numeric Entry speed',
      ne.thin
        ? `Only ${ne.n} Numeric Entry questions here — too few to call a weakness — but they averaged ${ne.avgSeconds} seconds, which is worth watching.`
        : `Your Numeric Entry questions average ${ne.avgSeconds} seconds. With no options to work backwards from, set up once and commit rather than re-deriving.`));
  }
  return items;
}
