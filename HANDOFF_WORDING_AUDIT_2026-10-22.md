# GRE Quant Pro — ETS/KMF wording audit and remediation (2026-10-22)

Triggered by students reporting that the questions "don't read like real GRE". The complaint was
correct. The mathematics was largely sound; the **register** had drifted. Everything below is in
the working tree, uncommitted.

Follows `HANDOFF_ETS_AUDIT_2026-10-06.md` and `claude/ets_fidelity_followup_2026-10-19.md`.

## Headline

| | before | after |
|---|---|---|
| hard-rule errors across the 10,738 pro-bank questions | 868 | **65** (all known-accepted or checker false positives) |
| distinct questions edited | — | **1,376** |
| mock QC items using pre-2011 wording | 59 of 59 | **0** |

## The source of truth used

`KMF 1804` (the 851-page PDF) is a page-image set of the **real ETS test interface** — radio
buttons, section/question headers, live timer — watermarked and resold. Treat every item in it as
copyrighted ETS content. **Nothing was transcribed**, consistent with the 2026-10 import decision.
It was used only to confirm conventions, which it did on every point below.

## 1. The app and the mocks (biggest student-visible defect)

- **`pro/gre_practice_logger_pro.html` line ~3434** showed `Compare **Column A and Column B**,
  using additional information given, if any.` above every one of the 2,317 QC questions. The
  other four shells already said "Quantity A and Quantity B". Fixed.
- **All 59 QC questions across all 12 mock tests** (`mocks/mock_01–02`, `pro/mocks/mock_01–10`)
  used `Column A:` / `Column B:` in the stem **and** a non-verbatim option set
  (`A. Column A is greater` — no terminal period). All rewritten to Quantity A/B with the ETS
  verbatim four. This was 100% of mock QC items; the 2026-10 audit had cleaned the bank but not
  the mocks.
- The `⚠️ Select ALL that apply` warning-red monospace banner in the practice renderer
  (pro logger ×2, free logger, `previous.html`) replaced with a plain italic ETS directions line.
- **3,100 "Column A/B" occurrences rewritten across 112 files** — `learn/pro-body/*.html` (25
  sheets), `learn/practice/*.html` (31 sheets), `concepts/practice/**/*.md`, `full_mock.html`.

## 2. The wording contract applied to the bank

Each rule was confirmed against the KMF pages.

| Fixed | Count | Rule |
|---|---|---|
| `"Enter your answer as a number."` and variants stripped from numeric-entry stems | 440 | ETS never puts the entry format in the item; the directions line does it. Content-bearing forms kept, in ETS's words: `Give your answer as a fraction.`, `Round your answer to …` |
| Select-all directives normalised | 240 | Canonical two-part shape: interrogative question, blank line, `Indicate all such <noun>.` (or `Select all that apply.`). 112 by rule, 105 by a second pass, 23 hand-written |
| Imperative stems converted to interrogatives | 78 | `Simplify: (2x²−8)/(x²−4)` → `Which of the following is equal to …?`; `Find n.` → `What is the value of n?`; `Find the chance that` → `What is the probability that` |
| British → US spelling | 224 | centre→center, metres→meters, litres→liters, colour→color, factorisation→factorization, minimise→minimize … |
| Bare `LCM`/`GCD`/`HCF` spelled out | 107 | stems and explanations |
| All-caps emphasis de-shouted | 24 | `MUST`, `BOTH`, `ALL`, `TRUE` → lower case. **`NOT` deliberately kept capitalised** |
| `Select ALL` → `Select all` | 43 | |
| Contractions expanded | 107 | doesn't → does not, etc. |
| `the coordinate plane` → `the xy-plane` | 8 | |
| `digits sum` rephrased in stems | 3 | |
| missing `options: null` on numeric entry | 61 | |

## 3. Off-syllabus solution routes

The rubric treats an off-syllabus *explanation* as a defect even when the question is fine. This
was the largest remaining category.

| Fixed | Count | Replacement route |
|---|---|---|
| `mod n` operator / `≡` notation | 74 | plain remainder language ("when n is divided by 7, the remainder is 3") |
| Vieta's formulas named | 30 | "the sum and product of the roots" (the fact is in scope; the name is not) |
| AM-GM named | 9 | `(a − b)² ≥ 0` route |
| trigonometry in explanations | 12 | 30-60-90 / 45-45-90 ratios, Pythagoras, perpendicular from the centre to a chord |
| vectors, dot/cross product, determinants | 20 | coordinate changes and slopes |
| logarithms, set-cardinality, Heron, Fermat, incenter/circumcenter | 17 | on-syllabus equivalents |

Notable rewrites: `GEO-TRI-047` (Heron → altitude split, 5-12-13), `GEO-CIR-030`/`036`/`061`
(law of cosines → 30-60-90 and Pythagoras), `GEO-TRI-KMF-007`/`011` (cos/sin monotonicity →
geometric height arguments), `GEO-CIR-063` (**the explanation derived 8√6 while the key is 16, and
used the wrong radius and centre distance throughout — fully re-derived; the key 16 is correct**).

## 4. Structural hard rules

- **Numeric options reordered to ascending: 39 questions** (24 by rule, 15 after a generalised
  option-label relabeller). The 2026-10-17 sweep had covered MCQs only; these were mostly
  select-alls. **Verified: the correct answer's option text is unchanged on all 39**, and all 39
  are now ascending.
- **Four malformed items repaired:**
  - `NUM-PRF-053` — all 5 options were correct (20!–24! all have 4 trailing zeros). Option E
    changed to 25 (6 zeros); answer now A, B, C, D.
  - `STA-CMB-060` — options A–D were four spellings of the same value 1568, with E = "All of the
    above are equivalent". Rebuilt with five distinct ascending option values, each distractor
    encoding a real counting error; answer now C.
  - `DAT-MXG-KMF-007` — had only 4 options. Fifth added (46%, applying the region share to total
    cargo instead of container tonnage); answer unchanged (B).
  - `NUM-INT-041` — bare "None" option reworded to "No integers n"; its `trap` also described
    choice D, which is the key — rewritten.

## 5. What remains (65 "errors", all triaged)

- **52 `duplicate_option_value` → 8 unique, all accepted.** Six are equivalence select-alls
  ("which of these equal 1/3?") where equal-valued options are the point: `ARI-FRC-025`,
  `ARI-FRC-055`, `ARI-PCT-020`, `ARI-EXP-KMF-018`, `ARI-EXP-KMF-024`, `GEO-IET-026`. Two are
  checker false positives: `ARI-NLO-024` (ordered lists, not numbers) and `COG-GQF-003`
  (`x = 3` vs `y = 3`).
- **12 `options_unordered` → 7 unique**, the same equivalence sets: ordering by value is
  meaningless when values tie.
- **1 `offsyllabus_logarithm`** — `STA-DDI-KMF-016` says "appear in the log (4 rides)". False positive.
- **19 `figure_description_textbox` (WARN) — genuinely open.** These questions carry a prose
  `figure_description` instead of a drawn figure. Fixing them needs the `add_figures.py` workflow.
- **153 `term_find_imperative` (WARN)** — all in *explanations*, none in stems (stems are at 0).
  Acceptable; explanations may say "find the value".
- **126 `numeric_entry_rounding` / 10 `numeric_entry_fraction` (WARN)** — decimal or fraction keys
  whose stems carry no explicit instruction. Worth a pass; mostly exact values where no rounding
  is implied.
- **4,203 `duplicate_stem` (WARN)** — by design: subtopic files and mixed bags hold the same
  question. Only 37 groups involve genuinely different IDs, and most of those are legitimate
  cross-topic placements (e.g. `ALG-SEQ-005` / `ARI-SEQ-004`).

## 6. Known pre-existing issues NOT introduced here

- `pro/bank/index.json` `total_questions` = 10,318 while the folder holds 10,738. The 420-question
  `sectional/` set is indexed separately. Unchanged by this work.
- 30 IDs have an `svg` on one copy and not another (pro/bank vs mixed bag vs free bank). Student-facing
  text is identical across all copies (verified), but a figure may be missing in one place.
- `STA-CMB-060` is still labelled `extreme_hard`; after the repair it is more like medium. Left
  alone so file `meta` distributions stay consistent — relabel together with a meta rebuild.

## 7. Process note — one rollback happened

The first terminology pass contained a regex that capitalised sentence-initial maths variables
("x is a positive integer" → "X is …") across 531 questions, plus three smaller grammar breaks.
It was caught on review. `pro/bank` and `bank` were restored in place from the backup, waves 1–4
were replayed (identical counts, so the replay was clean), and a corrected pass touched 24
questions instead of 531. **Deleting is blocked inside connected folders**, so the restore used
`cp -r <backup>/. <target>/` rather than `rm -rf` + copy — note this for future restores.

## Backups and logs

- `_ets_audit_archive_2026-10/backups/bank_backup_2026-10-22_pre_wording/` — `pro_bank`,
  `free_bank`, `mocks`, `pro_mocks`, `html` (the three logger pages + `full_mock.html`),
  `learn_full`, `learn_pro_body`. Taken before any change in this session.
- `_ets_audit_archive_2026-10/wording_audit_2026-10-22/` — a per-wave JSON change log
  (`log_wave*.json`, every edited ID with before/after), the final issue list
  (`issues_pro_bank.json`) and the final audit output (`run5.log`).
  `log_wave5_ROLLED_BACK_do_not_replay.json` is the reverted pass — do not replay it.
- `events/config/` was not in the backup; its question copies were re-synced from the bank by ID
  after the rollback and verified identical.

## The skill

`gre-question-gen` was rewritten and saved. New in it: a **wording contract** section (interrogative
stems with a replacement table, the numeric-entry instruction ban, the canonical select-all shape,
US spelling, the no-shouty-caps rule, the expanded terminology table, ETS exhibit formatting), the
**on-syllabus rewrite table** for explanations, the KMF copyright rule, the ascending-order rule
extended to select-alls, the QC terminal-period requirement, a reminder to grep every test shell's
`ETS_DIRECTIONS` after QC work, and a wording block in the self-review checklist.

## Suggested next steps

1. Eyeball a QC question and a select-all in the pro logger, and one mock, before deploying.
2. The 19 `figure_description` text boxes — run the `add_figures.py` workflow.
3. `learn/practice` and `learn/pro-body` sheets are still the September snapshots in every other
   respect (stale option order, stale question text); only the Column A/B wording was fixed here.
4. Deploy item 6 from the 2026-10-19 follow-up (the `/pro-data` Worker gate) — still not deployed,
   and `pro/bank` is still publicly fetchable. Rebuild the KV payload after these edits.
