/* Unit tests for the DOM-free half of the parser. Run: node test-pure.mjs */
import {
  norm, levenshtein, snapQuestionType, snapSetting, snapVerdict,
  snapDifficulty, parseClock, parseRow, parseOcrText, validate,
  matchAreaHeader, matchSubHeader, matchSectionHeader, looksLikeVerbal,
  assignSections,
} from './parser.js';

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) { pass++; } else { fail++; console.log(`  FAIL ${label}\n    got  ${a}\n    want ${b}`); }
};

/* --- token snapping: the mechanism that makes free OCR viable --- */
eq('qtype exact MC1', snapQuestionType('Multiple-choice--Select One').key, 'MC1');
eq('qtype exact MCM', snapQuestionType('Multiple-choice--Select One or More').key, 'MCM');
eq('qtype em-dash variant', snapQuestionType('Multiple-choice—Select One').key, 'MC1');
eq('qtype MCM not shadowed by MC1', snapQuestionType('Multiple-choice—Select One or More').key, 'MCM');
eq('qtype noisy MC1', snapQuestionType('Multiple-choice-Select One').key, 'MC1');
eq('qtype QC', snapQuestionType('Quantitative Comparison').key, 'QC');
eq('qtype NE', snapQuestionType('Numeric Entry').key, 'NE');
eq('qtype garbage rejected', snapQuestionType('Wikdwoosoec Omeorton'), null);

eq('setting Pure', snapSetting('Pure math').key, 'Pure');
eq('setting Real', snapSetting('Real-life').key, 'Real');
eq('setting OCR Realiife', snapSetting('Realiife').key, 'Real');   // seen at 150 DPI
eq('setting OCR Reabife', snapSetting('Reabife').key, 'Real');     // seen at 150 DPI
eq('setting OCR Reallife', snapSetting('Reallife').key, 'Real');

eq('verdict Right', snapVerdict('Right'), 'R');
eq('verdict Wrong', snapVerdict('Wrong'), 'W');
eq('verdict noisy', snapVerdict('Rignt'), 'R');
eq('verdict junk', snapVerdict('xyzzy'), null);

eq('difficulty digit', snapDifficulty('4'), 4);
eq('difficulty S->5', snapDifficulty('S'), 5);   // seen on a real screenshot
eq('difficulty l->1', snapDifficulty('l'), 1);
eq('difficulty unknown', snapDifficulty('o'), null);

eq('clock', parseClock('04:18'), 258);
eq('clock semicolon', parseClock('01;43'), 103);
eq('clock bad seconds', parseClock('01:73'), null);

/* --- headers --- */
eq('section first', matchSectionHeader('First Section'), 1);
eq('section second', matchSectionHeader('Second Section'), 2);
eq('area DA', matchAreaHeader('Data Analysis'), 'DataAnalysis');
eq('area not a data row', matchAreaHeader('1 Numeric Entry Real-life Right 4 04:18'), null);
eq('sub discrete', matchSubHeader('Discrete Questions'), 'discrete');
eq('sub set', matchSubHeader('Set Members'), 'set');

/* --- rows --- */
const r1 = parseRow('1 Quantitative Comparison Pure math Right 2 01:43');
eq('row ok', r1.ok, true);
eq('row fields', [r1.row.qtype, r1.row.setting, r1.row.verdict, r1.row.difficulty, r1.row.seconds],
   ['QC', 'Pure', 'R', 2, 103]);
const r2 = parseRow('2. Multiple-choice--Select One Real-life Right 3 02:09');  // border artefact
eq('row with "2." prefix', r2.ok, true);
const r3 = parseRow('2] Multiple-choice--Select One or More Pure math Wrong 4 02:00');
eq('row with "2]" prefix', [r3.ok, r3.row.qtype], [true, 'MCM']);
const r4 = parseRow('3 Numeric Entry Real-life Wrong 01:28');   // difficulty dropped by OCR
eq('row survives missing difficulty', [r4.ok, r4.row.difficulty, r4.row.needsReview],
   [true, null, ['difficulty']]);
const r5 = parseRow('3 Quantitative Comparison Real-life Right o 01:23'); // difficulty as "o"
eq('row survives junk difficulty', [r5.ok, r5.row.difficulty, r5.row.seconds], [true, null, 83]);

/* --- the ETS preamble must not be read as area headers --- */
const preamble = `Quantitative Reasoning questions are categorized by:
Mathematical Content Area
o Arithmetic
o Algebra
o Geometry
o Data Analysis
First Section
Arithmetic
Reference # Question Type Setting Right/Wrong Difficulty Level Time Spent
1 Quantitative Comparison Pure math Right 2 01:43`;
const pp = parseOcrText(preamble);
eq('preamble ignored, 1 row found', pp.rows.length, 1);
eq('row attributed to Arithmetic', pp.rows[0].area, 'Arithmetic');

/* --- a screenshot with its section heading cropped off --- */
const noHeading = `Arithmetic
Reference # Question Type Setting Right/Wrong Difficulty Level Time Spent
1 Quantitative Comparison Pure math Right 2 01:43`;
const nh = parseOcrText(noHeading);
eq('parses without a section heading', nh.rows.length, 1);
eq('section left unknown', nh.rows[0].section, null);

/* --- section inference by count --- */
const mk = (n, section) => ({ rows: Array.from({ length: n }, () => ({ section, area: 'Arithmetic' })), issues: [] });
const merged = assignSections([mk(12, 1), mk(15, null)]);
eq('15 unknown rows inferred as section 2', merged[12].section, 2);
eq('inference is flagged', merged[12].sectionInferred, true);
const ambiguous = assignSections([mk(13, null)]);
eq('ambiguous count is NOT guessed', ambiguous[0].section, null);

/* --- validation --- */
const good = [...Array(12)].map(() => ({ section: 1, seconds: 60, confident: true, area: 'A', ref: 1 }))
  .concat([...Array(15)].map(() => ({ section: 2, seconds: 60, confident: true, area: 'A', ref: 1 })));
eq('valid report passes', validate(good).ok, true);
eq('valid report is clean', validate(good).clean, true);
const short = good.slice(0, 26);
eq('missing row is caught', validate(short).ok, false);
const overtime = [...Array(12)].map(() => ({ section: 1, seconds: 200, confident: true, area: 'A', ref: 1 }));
eq('overtime section is caught', validate(overtime).errors.some((e) => e.code === 'section-overtime'), true);

eq('verbal report detected', looksLikeVerbal('ETS GRE Diagnostic Service: Verbal Reasoning'), true);
eq('quant report not flagged as verbal', looksLikeVerbal('ETS GRE Diagnostic Service: Quantitative Reasoning'), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
