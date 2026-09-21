/* Phase 1 tests. Fixtures are the two hand-verified real reports.
   Run: node test-analysis.mjs */
import { readFileSync } from 'fs';
import { analyse } from './analysis.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const HERE = dirname(fileURLToPath(import.meta.url));
const at = (...p) => join(HERE, ...p);

const exp = JSON.parse(readFileSync(at('_dev','expected.json'), 'utf8'));
const toRows = (t) => t.map(([section, area, qtype, setting, verdict, difficulty, seconds], i) =>
  ({ section, area, qtype, setting, verdict, difficulty, seconds, ref: i + 1 }));

const A = analyse(toRows(exp.studentA), { target: 165 });
const B = analyse(toRows(exp.studentB), { target: 165 });

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) pass++; else { fail++; console.log(`  FAIL ${label}\n    got  ${a}\n    want ${b}`); }
};
const area = (an, k) => an.areas.find((x) => x.key === k);
const lvl = (an, d) => an.difficulty.levels.find((x) => x.level === d);
const type = (an, k) => an.types.find((x) => x.key === k);

/* ================= STUDENT A ================= */
eq('A overall', [A.overall.correct, A.overall.n, A.overall.pct], [16, 27, 59.3]);
eq('A section 1', [A.sections[0].correct, A.sections[0].pct, A.sections[0].seconds, A.sections[0].spare], [8, 66.7, 1255, 5]);
eq('A section 2', [A.sections[1].correct, A.sections[1].pct, A.sections[1].seconds, A.sections[1].spare], [8, 53.3, 1490, 70]);

eq('A Arithmetic', [area(A, 'Arithmetic').correct, area(A, 'Arithmetic').n, area(A, 'Arithmetic').pct], [4, 6, 66.7]);
eq('A Algebra', [area(A, 'Algebra').correct, area(A, 'Algebra').pct], [5, 71.4]);
eq('A Geometry', [area(A, 'Geometry').correct, area(A, 'Geometry').pct], [2, 33.3]);
eq('A DataAnalysis', [area(A, 'DataAnalysis').correct, area(A, 'DataAnalysis').pct], [5, 62.5]);
eq('A weakest area is Geometry', A.weakestArea.key, 'Geometry');
eq('A Geometry errors are FAST (stuck, not slow)', [area(A, 'Geometry').avgErrorSeconds, area(A, 'Geometry').tempo], [60, 'fast']);
eq('A Arithmetic errors are SLOW (grinding)', area(A, 'Arithmetic').tempo, 'slow');

eq('A difficulty curve', A.difficulty.levels.map((l) => [l.level, l.correct, l.n]),
   [[1, 1, 1], [2, 4, 5], [3, 5, 8], [4, 5, 10], [5, 1, 3]]);
eq('A curve falls with difficulty', A.difficulty.monotonic, true);
eq('A ceiling is level 2', A.difficulty.ceiling, 2);

eq('A QC', [type(A, 'QC').correct, type(A, 'QC').n, type(A, 'QC').avgSeconds], [5, 9, 88]);
eq('A NE right but slow', [type(A, 'NE').pct, type(A, 'NE').avgSeconds, type(A, 'NE').thin], [100, 201, true]);

eq('A setting gap is noise', [A.settings.pure.pct, A.settings.real.pct, A.settings.significant], [60, 58.3, false]);

eq('A sunk cost', [A.timing.sunk.length, A.timing.sunkSeconds], [3, 551]);
eq('A rushed', A.timing.rushed.length, 3);
eq('A avg wrong vs right nearly equal', [A.timing.avgWrong, A.timing.avgRight], [99, 103]);
eq('A total slack', A.timing.totalSpare, 75);
eq('A scatter has every question', A.timing.points.length, 27);

eq('A second section was harder', [A.stamina.difficultyRise, A.stamina.secondSectionHarder], [0.8, true]);
eq('A Fader suppressed — drop is explained by difficulty',
   [A.stamina.drop >= 12, A.archetypes.some((x) => x.key === 'fader')], [true, false]);

eq('A archetypes', A.archetypes.map((x) => x.key), ['wall', 'sinker']);
eq('A wall is Geometry', A.archetypes[0].area, 'Geometry');
eq('A gap to 165', [A.gap.have, A.gap.need, A.gap.questionsAway, A.gap.named], [16, 24, 8, 7]);

/* ================= STUDENT B ================= */
eq('B overall', [B.overall.correct, B.overall.n, B.overall.pct], [17, 27, 63]);
eq('B section 1', [B.sections[0].correct, B.sections[0].pct, B.sections[0].spare], [8, 66.7, 5]);
eq('B section 2', [B.sections[1].correct, B.sections[1].pct, B.sections[1].spare], [9, 60, 7]);
eq('B has almost no slack', B.timing.totalSpare, 12);

eq('B Arithmetic', [area(B, 'Arithmetic').correct, area(B, 'Arithmetic').pct], [3, 50]);
eq('B Geometry', [area(B, 'Geometry').correct, area(B, 'Geometry').pct], [3, 50]);
eq('B DataAnalysis is strong', [area(B, 'DataAnalysis').correct, area(B, 'DataAnalysis').pct], [7, 87.5]);

eq('B difficulty curve', B.difficulty.levels.map((l) => [l.level, l.correct, l.n]),
   [[1, 1, 1], [2, 4, 5], [3, 3, 6], [4, 8, 11], [5, 1, 4]]);
eq('B curve is ERRATIC — rises at level 4', B.difficulty.monotonic, false);
eq('B no false ceiling reported', B.difficulty.ceiling, null);
eq('B erratic levels named', B.difficulty.erraticLevels, [3, 5]);

eq('B setting split is the headline',
   [B.settings.pure.pct, B.settings.real.pct, B.settings.gap, B.settings.significant, B.settings.favours],
   [46.7, 83.3, 36.6, true, 'real']);

eq('B sunk cost', [B.timing.sunk.length, B.timing.sunkSeconds], [4, 585]);
eq('B Geometry errors are SLOW, not fast', area(B, 'Geometry').tempo, 'slow');
eq('B Arithmetic errors are FAST', area(B, 'Arithmetic').tempo, 'fast');

eq('B archetypes — Translator leads', B.archetypes.map((x) => x.key), ['translator', 'sinker']);
eq('B gap to 165', [B.gap.have, B.gap.questionsAway], [17, 7]);

/* ================= the two students must not look alike ========= */
eq('different weakest areas', A.weakestArea.key !== B.weakestArea.key, true);
eq('different primary archetypes', A.archetypes[0].key !== B.archetypes[0].key, true);
eq('different prescriptions', [A.archetypes[0].prescription, B.archetypes[0].prescription], ['content', 'fluency']);

/* ================= guards and targets ========================== */
eq('A guards mention thin buckets', A.guards.some((g) => /too few to read/.test(g)), true);
eq('every analysis disclaims chronology', A.guards.some((g) => /not by the order you saw them/.test(g)), true);
eq('B guards do NOT dismiss its real setting split', B.guards.some((g) => /not a real split/.test(g)), false);

const A170 = analyse(toRows(exp.studentA), { target: 170 });
const A160 = analyse(toRows(exp.studentA), { target: 160 });
eq('target 170 needs all 27', [A170.gap.need, A170.gap.questionsAway], [27, 11]);
eq('target 160 is a shorter gap', [A160.gap.need, A160.gap.questionsAway], [21, 5]);

/* ================= degenerate inputs =========================== */
const perfect = analyse(toRows(exp.studentA).map((r) => ({ ...r, verdict: 'R' })), { target: 165 });
eq('all-correct: gap closed', [perfect.gap.questionsAway, perfect.gap.reached], [0, true]);
eq('all-correct: no archetype invented', perfect.archetypes.map((x) => x.key), ['grinder']);

const noDiff = analyse(toRows(exp.studentA).map((r) => ({ ...r, difficulty: null })), { target: 165 });
eq('missing difficulty does not crash', noDiff.overall.correct, 16);
eq('missing difficulty yields no ceiling', noDiff.difficulty.ceiling, null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
