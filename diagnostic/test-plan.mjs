/* Phase 2 tests. Run: node test-plan.mjs */
import { readFileSync } from 'fs';
import { analyse } from './analysis.js';
import { buildPlan, allocateWeeks, drillTier, drillCapacity, pickSubtopics, WEEK_OPTIONS } from './plan.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const HERE = dirname(fileURLToPath(import.meta.url));
const at = (...p) => join(HERE, ...p);

const exp = JSON.parse(readFileSync(at('_dev','expected.json'), 'utf8'));
const taxo = JSON.parse(readFileSync(at('taxonomy.json'), 'utf8'));
const toRows = (t) => t.map(([section, area, qtype, setting, verdict, difficulty, seconds], i) =>
  ({ section, area, qtype, setting, verdict, difficulty, seconds, ref: i + 1 }));

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) pass++; else { fail++; console.log(`  FAIL ${label}\n    got  ${a}\n    want ${b}`); }
};
const ok = (label, cond) => eq(label, !!cond, true);

const A = analyse(toRows(exp.studentA), { target: 165 });
const B = analyse(toRows(exp.studentB), { target: 165 });
const pA = buildPlan(A, taxo, { weeks: 8 });
const pB = buildPlan(B, taxo, { weeks: 8 });
const items = (p) => p.weeks.flatMap((w) => w.items);
const drills = (p) => items(p).filter((i) => i.kind === 'drill');

/* --- taxonomy integrity: the plan is only as good as its links --- */
const codes = Object.keys(taxo);
eq('87 subtopics', codes.length, 87);
eq('every subtopic has a capsule', codes.filter((c) => !taxo[c].capsule), []);
eq('every subtopic has a bank count', codes.filter((c) => !taxo[c].count), []);
ok('some subtopics are free', codes.filter((c) => taxo[c].free).length >= 20);
ok('free is a strict subset', codes.filter((c) => taxo[c].free).length < codes.length);
eq('free subtopics carry a tier breakdown',
   codes.filter((c) => taxo[c].free && !Object.keys(taxo[c].freeDist || {}).length), []);

/* --- capacity model --- */
eq('GEO-CIR free easy capacity', drillCapacity(taxo['GEO-CIR'], ['easy']).free, 10);
eq('GEO-CIR pro easy capacity', drillCapacity(taxo['GEO-CIR'], ['easy']).pro, 18);
eq('a Pro-only subtopic has no free capacity', drillCapacity(taxo['ALG-EXP'], ['medium']).free, 0);

/* --- week allocation, weighted by where errors are --- */
const alloc = allocateWeeks(A.areas.filter((a) => a.pct < 75 && a.wrong > 0), 5);
eq('allocation spends exactly the weeks available',
   [...alloc.values()].reduce((a, b) => a + b, 0), 5);
eq('the worst area gets the most weeks — the bug that bit Student A',
   alloc.get('Geometry') >= Math.max(...[...alloc.values()]), true);
eq('Geometry (4 errors) beats Arithmetic (2 errors)',
   alloc.get('Geometry') > alloc.get('Arithmetic'), true);
eq('every worked area gets at least one week', [...alloc.values()].every((v) => v >= 1), true);

/* --- drill tier follows the difficulty read --- */
eq('A tier from a ceiling of 2', drillTier(A).tiers, ['easy', 'medium']);
eq('B tier from an erratic curve', drillTier(B).tiers, ['medium', 'hard']);

/* --- structure --- */
for (const [n, p] of [['A', pA], ['B', pB]]) {
  eq(`${n} produces 8 weeks`, p.weeks.length, 8);
  eq(`${n} weeks are numbered 1..8`, p.weeks.map((w) => w.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  ok(`${n} every week has a reason`, p.weeks.every((w) => w.why && w.why.length > 30));
  ok(`${n} every week has a checkpoint`, p.weeks.every((w) => w.checkpoint));
  ok(`${n} no week is empty`, p.weeks.every((w) => w.items.length >= 2));
  ok(`${n} week 1 is behaviour, not content`, p.weeks[0].items.some((i) => i.kind === 'rule'));
  ok(`${n} week 1 has no drills`, !p.weeks[0].items.some((i) => i.kind === 'drill'));
  ok(`${n} last week re-diagnoses`, p.weeks[7].items.some((i) => /ETS diagnostic/.test(i.label)));

  // Rule 1: the abandon rule is in every plan — both real students lost 9+ min
  ok(`${n} week 1 carries the abandon rule`, p.weeks[0].items.some((i) => /2-minute rule/.test(i.label)));
  // Rule 2: every link points at a real PUBLISHED page.
  // This test used to check repo markdown paths; once /learn/ shipped that
  // filter matched nothing and the test passed vacuously. It now asserts the
  // real contract: no plan item may link to repo markdown, and every capsule
  // or practice link must be a /learn/ URL the taxonomy knows about.
  const linked = items(p).filter((i) => i.href);
  eq(`${n} no plan link points at repo markdown`,
     linked.filter((i) => /\.md$/.test(i.href)).map((i) => i.href), []);
  const learnUrls = new Set([
    ...Object.values(taxo).map((v) => v.url).filter(Boolean),
    ...Object.values(taxo).map((v) => v.practiceUrl).filter(Boolean),
    '/learn/exam-strategy/quantitative-comparison.html',
    '/learn/exam-strategy/time-management.html',
  ]);
  const content = linked.filter((i) => i.kind === 'capsule' || i.kind === 'practice');
  ok(`${n} every capsule/practice link is a published /learn/ page`,
     content.length > 0 && content.every((i) => learnUrls.has(i.href)));
  // No duplicated reading
  const caps = items(p).filter((i) => i.kind === 'capsule').map((i) => i.href);
  eq(`${n} no capsule is repeated`, caps.length, new Set(caps).size);
  const dcodes = drills(p).map((i) => i.code);
  eq(`${n} no subtopic is drilled twice`, dcodes.length, new Set(dcodes).size);
}

/* --- Rule 3: locks are honest AND the student can start --- */
for (const [n, p] of [['A', pA], ['B', pB]]) {
  const d = drills(p);
  ok(`${n} has some fully-free drills`, d.some((i) => !i.locked && !i.partial));
  ok(`${n} has some gated drills`, d.some((i) => i.locked || i.partial));
  // The rule is that the student can START, not that everything is free.
  ok(`${n} the first content week is startable without paying`,
     p.weeks[1].items.filter((i) => i.kind === 'drill').some((i) => !i.locked));
  ok(`${n} no week is entirely locked`,
     p.weeks.every((w) => {
       const d = w.items.filter((i) => i.kind === 'drill');
       return d.length === 0 || d.some((i) => !i.locked) || w.items.some((i) => !i.locked);
     }));
  ok(`${n} a partial drill still gives a real number`,
     d.filter((i) => i.partial).every((i) => i.freeCount > 0));
  ok(`${n} a locked drill is genuinely absent from the free bank`,
     d.filter((i) => i.locked).every((i) => (taxo[i.code].freeCount || 0) === 0));
  ok(`${n} upgrade line is specific, not a banner`,
     /\d+ more questions across \d+ subtopics/.test(p.meta.upgradeLine));
}

/* --- the two students get different plans --- */
eq('A works Geometry first', pA.weeks[1].title.startsWith('Geometry'), true);
eq('A gives the Wall two weeks',
   pA.weeks.filter((w) => w.title.startsWith('Geometry')).length, 2);
eq('B leads with the Translator week', pB.weeks[1].title, 'Abstract maths, on its own terms');
ok('B Translator week is startable without Pro',
   pB.weeks[1].items.filter((i) => i.kind === 'drill').some((i) => !i.locked));
ok('plans differ', JSON.stringify(pA.weeks.map((w) => w.title)) !== JSON.stringify(pB.weeks.map((w) => w.title)));
ok('A gets QC surgery only if QC lags', !items(pA).some((i) => /Quantitative Comparison — Method/.test(i.label || '')));
ok('B gets QC surgery', items(pB).some((i) => /Quantitative Comparison — Method/.test(i.label || '')));

/* --- narrowing overrides the inference --- */
const pNarrow = buildPlan(A, taxo, { weeks: 8, narrow: ['GEO-SAV', 'GEO-3DG'] });
ok('a student-chosen subtopic is used', drills(pNarrow).some((i) => i.code === 'GEO-SAV'));
eq('narrowing is recorded', pNarrow.meta.narrowed, true);

/* --- every week length works --- */
for (const w of WEEK_OPTIONS) {
  const p = buildPlan(A, taxo, { weeks: w });
  eq(`${w}-week plan has ${w} weeks`, p.weeks.length, w);
  ok(`${w}-week plan still starts with behaviour`, p.weeks[0].items.some((i) => i.kind === 'rule'));
  ok(`${w}-week plan still ends with a mock`, p.weeks[w - 1].items.some((i) => /mock/i.test(i.label)));
  ok(`${w}-week plan has no empty week`, p.weeks.every((x) => x.items.length >= 2));
}
eq('an invalid week count falls back to 8', buildPlan(A, taxo, { weeks: 7 }).weeks.length, 8);

/* --- degenerate students --- */
const perfectRows = toRows(exp.studentA).map((r) => ({ ...r, verdict: 'R' }));
const pPerfect = buildPlan(analyse(perfectRows, { target: 165 }), taxo, { weeks: 8 });
eq('a perfect student still gets a coherent plan', pPerfect.weeks.length, 8);
ok('a perfect student gets no invented sunk-cost rule',
   !pPerfect.weeks[0].items.some((i) => /2-minute rule/.test(i.label)));

const allWrong = toRows(exp.studentA).map((r) => ({ ...r, verdict: 'W' }));
const pWorst = buildPlan(analyse(allWrong, { target: 165 }), taxo, { weeks: 4 });
eq('an all-wrong student gets 4 weeks', pWorst.weeks.length, 4);
ok('an all-wrong student starts at the bottom tier', pWorst.tier.tiers[0] === 'easy');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
