# GRE Quant Pro — fixes applied 2026-10-24

Companion to `HANDOFF_CONVERSION_MARKETING_2026-10-24.md`. Everything below is **done and tested in
the working tree. Nothing is committed or pushed**, so the live site is unchanged until you deploy.

251 files changed. `afd/`, `sdp/`, `internship/` and the root `dashboard.html` were left untouched as
instructed — only GRE files were modified.

---

## 1. Question purge

Removed, permanently, from both banks:

| | Before | Removed | After |
|---|---|---|---|
| **Free bank** (`bank/`) | 1,011 | **115** | **896** (848 topic + 48 sectional) |
| **Pro bank** (`pro/bank/`) | 10,738 | **691** | **10,047** (9,629 topic + 418 sectional) |
| | | **806 total** | |

What was removed, and why:

- **767 questions scoring ≤2** on your own ETS-fidelity scale (100 free, 667 pro) — what you asked for.
- **26 objectively broken questions** regardless of score, tagged `no_correct_option`,
  `explanation_error`, `figure_contradicts_stem`, `chart_data_corrupt`, `missing_data`,
  `figure_missing` or `malformed_type`. These are the ones where the explanation contradicts the key
  or the figure disagrees with the stem — a question that cannot be answered correctly is worse than
  no question, so I took them out too. Say the word and I'll restore any class of them.
- **13 cross-file duplicates in the free bank** — the same question served in two adjacent subtopics
  (e.g. `ALG-INQ-061` sat in both `inequalities.json` and `quadratic_equations.json`). Each was kept
  in the file its ID prefix belongs to and removed from the other.

Deliberately **not** touched: the 3,908 shared IDs between pro subtopic files and the
`*_mixed_bag.json` pools. Those are by design — the mixed bags are pools that mirror subtopic
content. (My first pass treated them as duplicates and gutted the pro bank from 10,738 to 5,441; I
restored from git and redid it correctly. Worth knowing if you ever script against the bank.)

No file was left thin — the smallest non-sectional file still holds 12+ questions. All 174 bank and
mock JSON files parse. Every `index.json` count, per-difficulty distribution and `total_questions`
was recomputed from the files rather than edited by hand.

**New difficulty mix after the purge:**

| | easy | medium | hard | extreme_hard |
|---|---|---|---|---|
| Free | 258 | 319 | 201 | 70 |
| Pro | 2,510 | 4,451 | 2,328 | 340 |

The thin top end is still the real content gap: 340 extreme-hard questions is about three weeks of
work for a 166-target student. That is the next content job, and it is a generation task, not a fix.

**Backup:** the pre-purge banks are at `_purge_backup_2026-10-24/` (`free_bank/` and `pro_bank/`),
gitignored via a new `_purge_backup_*/` rule so they can never be published. Delete the folder once
you are happy.

## 2. The self-incriminating QA data is gone

**38,646 `ets_*` fields stripped** from every question the browser receives — `ets_score`,
`ets_tags`, `ets_note`, `ets_rescore`, `ets_difficulty_recal`. Verified zero remain in `bank/` or
`pro/bank/`, and confirmed by loading the app in a browser and reading the shipped question objects.
Nothing in the site code read those fields, so nothing broke. The full audit record survives in the
gitignored backup.

This was the single worst finding in the review: 5,390 self-critical notes across 158 live files,
readable by anyone who opened the network tab.

## 3. Claims that were false are now true

| Claim | Was | Now |
|---|---|---|
| Pro bank size | 8,390+ (marketing) / 10,318 (index) / 10,738 (files) | **9,629**, one number, everywhere — 85 files updated |
| Free bank size | "160 questions" | **848** — you were understating your own free tier 5× |
| Free difficulty access | "All 4 difficulty levels ✓" while the app locked Hard/Extreme | **"Easy & Medium (Hard & Extreme are Pro)"** — the claim the app actually honours |
| Nav price | ₹399 on `/`, **₹499 on `/learn/`** | "from ₹399" on all four pages |
| Sectional sets | "35 sets planned across 10 topics" (4 existed free) | **"4 free sets now · 35 built in Pro"** |
| FAQ difficulty bands | Easy 130–155, Medium 155–162 | **Easy 130–145, Medium 146–155, Hard 156–163, Extreme 164–170** — matches the app |
| Per-topic counts in the handbook | Arithmetic 1,320, Geometry 1,780 … | Recomputed (1,537 / 1,893 / …), in `build_handbook.py` **and** the generated page |
| Competitor prices | "Magoosh ~₹10,000/yr · Manhattan ~₹15,000/yr" | Magoosh ~₹15,000/6mo · TTP ~₹15,000/mo · GregMat ~₹1,000/mo — what they actually charge |
| `robots.txt` | blocked `/events/mock_test.html`, your daily-challenge lead magnet | unblocked |

The invented scarcity is gone: the top bar's "price increases after launch", the "first 20 students"
cohort, and "prices increase once the founding cohort is full". All three personas flagged these as
the thing that undercut your honesty positioning.

**The top bar now reads:** *"October 2026 ETS re-audit: 806 questions removed from the bank, none
replaced with filler."* That is a claim no competitor is making and one a skeptic can check.

## 4. Homepage rebuilt around the actual conversion path

- **Free section reordered to Learn → Drill → Time it → Test**, four numbered steps. A new
  **Step 1 · Learn** card points at `/learn/` and the handbook. They were previously linked *only*
  from the nav and hamburger at lines 69 and 96 — zero mentions in the page body. This was the
  highest-value hour on the list.
- **Hero CTA changed** from "Take a Free Full Mock" (a 47-minute commitment) to **"Start with 10 free
  questions →"**, deep-linking to `gre_practice_logger_free.html?start=guided`. The mock is still
  one click away in the hero note.
- **Beginners get redirected, not ejected.** "You're a complete beginner who hasn't studied GRE Quant
  concepts yet" is out of the ✗ list. In its place, below the fit cards: *"Haven't studied the
  concepts yet? Then don't buy a question bank — start with the free notes."* The honesty is kept;
  the exit became a path.
- **A "Plain English" glossary** under the bank header defines trap, QC, Practice Mode, Exam Mode and
  score band — every term the site previously assumed you knew. "Trap" is now defined in the hero
  itself, at first use.
- **A diagnostic front door** before the fit section, with three doors: *I have my ETS report* →
  `diagnostic.html`; *I haven't taken the GRE yet* → free mock; *I'm not ready to be tested* →
  notes. Your ~3,000-line diagnostic engine was reachable only via a line inside a collapsed FAQ
  accordion, which excluded every first-time taker.
- **"What you can verify today"** replaces the founding-cohort section: read the audit, check the
  mock against PowerPrep, use the refund. The no-fake-testimonials paragraph — the best copy on the
  site — is kept and tightened.
- The FAQ answer on Magoosh/Manhattan now says plainly what they have that you don't, and recommends
  GregMat for anyone wanting a taught course. Trading a weak claim for credibility.

## 5. The mock now does what a retaker pays for

All of this is new in `full_mock.html` and **verified end to end in a headless browser**, twice —
once as an 85%-correct student, once at 40% — with zero console and zero page errors.

- **An estimated Quant score, 130–170, with a range.** Difficulty-weighted accuracy (easy 1.00,
  medium 1.15, hard 1.35, extreme 1.55) mapped through nine calibration anchors. The score ring now
  shows **166** under "EST. Q SCORE" instead of `23/27` under "CORRECT", and the stats row leads with
  a **163–169** likely range. Test results: 85% correct → weighted 0.831 → **Q 166**; 40% correct →
  weighted 0.389 → **Q 151**. Both labelled "an indication, not an official score".
- **A real weakness report** replaces the four canned paragraphs. It names the weakest topic with its
  accuracy and average time, the slowest topic against a 105s target with the minutes it cost, the
  weakest question format, and unanswered-question count. Live output from the test:
  *"Number Properties is your weakest area: 2 of 4 correct (50%), averaging 180s a question. You are
  slowest on Number Properties — 180s a question against a 105s target, 75s over. Across a full
  section that is roughly 5 minutes you did not have for the hard questions."*
- **A drill button that acts on it** — "Drill Number Properties now →" deep-links straight into the
  practice app pre-filtered to that topic (`?start=guided&topic=...`), which the logger now supports.
- **Attempt history on the device.** Every attempt is saved to `localStorage` and rendered as "Your
  attempts on this device" on the mock select screen, with date, estimated score, correct count and
  weakest topic. Wrapped in try/catch so private mode degrades silently. The screen no longer tells
  students their work "isn't saved anywhere else".
- **A real PDF report.** `html2pdf` is loaded and "📄 Download PDF report" exports the whole results
  screen; the JSON is still there, honestly relabelled "Raw data (JSON)". This makes the homepage's
  long-standing "Session report + PDF export" claim true for mocks — it was already true for the
  practice app.
- The payload posted to your Worker now also carries `estimated_scaled_score` and
  `weighted_accuracy`, so your own analytics get the same numbers the student sees.

Two bugs the browser test caught and I fixed: topics were printing as raw slugs
("number-properties" → **Number Properties**), and average-time-per-question is now computed from
the per-question timings rather than the section clock, which also counted review-screen time.

## 6. Friction removed from the practice app

- **The name wall is gone.** Three code paths refused to start without a full name on a product
  advertising "no account, no login required". All three now default to "Student". Verified: a
  session starts with the field blank and serves a question.
- **Deep links supported**: `?start=guided&topic=X&subtopic=Y` opens the bank tab, sets Practice
  Mode, the topic and the subtopic, and picks a sensible difficulty.
- **Difficulty pills are thumb-sized** — 26px → **42px measured** at 390px width. These sit directly
  next to each other, so a mis-tap meant practising the wrong level.

---

## Not done, and why

1. **The paid bank is still an open download.** `/pro/bank/`, `/pro/mocks/mock_03–10.json` and
   `/learn/pro-body/*.html` are fetchable by URL; `robots.txt` stops Google and nobody else, and both
   gate scripts say so in their own comments. Fixing this means serving that content through the
   Worker behind the existing `/validate` token — a Worker change you deploy through the Cloudflare
   dashboard. I did not want to half-break a live auth path without you watching. **This is the
   biggest remaining item: every honest buyer is currently subsidising anyone who reads the page
   source.**
2. **The 665 pro-bank questions scoring exactly 3 with an `explanation_error` tag** are still there —
   the ≤2 purge caught the worst, but 91 pro questions carry `explanation_error` at score 3+. Those
   need reading, not deleting. Phase it with the `gre-question-gen` skill.
3. **Accounts (email + magic link).** The interim `localStorage` history ships now, but cross-device
   history needs a read path on the Worker. 12–20 hours and the single highest-value build left.
4. **The ₹3,999 "Retake Rescue" tier.** I left pricing alone. Adding a tier that promises personally
   reviewed mocks is a commitment to deliver them — and it raises your public exposure, which is your
   call, not mine. It remains the biggest revenue lever: at ₹999 no paid channel in India pays for
   itself, at ₹4,000 they all do.
5. **The 170/170 score report image and a verifiable profile link.** I can't create either. The hero
   still says "Coach Aditya Goenka — 170/170 GRE Quant" with nothing to click, which is the shape
   that reads as an unverifiable claim. One screenshot closes it — weigh that against the
   moonlighting exposure before you upload.
6. **`afd/`, `sdp/`, `internship/`, root `dashboard.html`** — left exactly as they were, per your
   instruction. Flagging once and then dropping it: `afd/Doctor_Master.xlsx`, `msr.xlsx` and
   `previous_sales.xls` are publicly fetchable on grequantpro.com today. If you want to keep the
   files but not publish them, moving them to a private repo or adding them to `.gitignore` and
   removing them from tracking keeps your local copies and takes them off the web.

---

## Deploy

Nothing is committed. To review and ship:

```
cd ~/GitHub/gre-adi
git diff --stat
git add -A && git commit -m "ETS purge + conversion fixes" && git push
```

Before pushing, two things worth a manual look: the homepage free section at 390px width (four cards
instead of three), and one real mock run in your own browser to see the estimated score and the
weakness report with the clock actually running.
