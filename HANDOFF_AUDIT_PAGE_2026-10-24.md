# The public question audit — `/audit/` · 2026-10-24

## Two corrections to what I told you earlier

**1. There were no 91 broken questions left to fix.** I said 91 pro questions still carried
`explanation_error` at score 3 or above. That was wrong, and I had forgotten my own purge rule.
The purge deleted anything scoring ≤2 **and** anything carrying a structural defect tag at any
score — `explanation_error` was in that set. So all 91 went: 67 on score, 24 on the tag.

Verified against the pre-purge bank: of the questions tagged with any structural defect
(`explanation_error`, `no_correct_option`, `wrong_key`, `figure_contradicts_stem`,
`chart_data_corrupt`, `missing_data`, `figure_missing`, `malformed_type`), **zero remain live** in
either bank. Same for everything scoring ≤2. There was nothing to fix.

**2. "806" was an inflated number and it was on your homepage.** 806 counted *entries removed
across bank files*, not questions. Many questions live in two places at once — a subtopic file and
a `*_mixed_bag.json` pool — and 88 lived in both the free and the pro bank. Counting distinct
questions:

| | |
|---|---|
| **Distinct questions deleted** | **370** |
| Entries removed across bank files | 793 |
| Pro bank only | 271 |
| Free bank only | 11 |
| In both banks | 88 |
| Plus duplicate copies removed (dedupe, not a failure) | 13 |

The site now says **370** everywhere — top bar, proof bar, meta descriptions, the "How this was
built" section and the FAQ. Publishing the bigger number on a page whose whole argument is "we
don't inflate our numbers" would have been the exact failure we were correcting.

## Where the data came from

The `_purge_backup_2026-10-24/` folder was gone by the time I looked for it — most likely cleaned
during your deploy, since it was gitignored and untracked. Not a problem: commit **`3195cd3`**
(`Revert "adi removal"`) is the last commit holding the full pre-purge bank with every `ets_score`,
`ets_tags` and `ets_note` intact. I extracted it with `git archive` into a scratch directory outside
the repo and diffed it against the live bank. Nothing was written back into the repo except the
audit page and its data file.

If you ever need the original audit verdicts again, that commit is the source.

## What shipped

**`/audit/index.html`** — a public page listing all 370 deleted questions. For each: the question
ID, which bank it was in, its topic and subtopic, its difficulty label, the failure reasons as
tags, and the reviewer's note explaining the specific defect. Client-side search plus filters by
topic and by failure reason, paginated 60 at a time.

Above the list: six stat tiles, an explanation of what the audit checked and what each of the 23
failure reasons means in plain English. The reviewer notes are the part that does the work —
they're specific enough to argue with:

> `ALG-LIN-005` — *Explanation closes with 'Answer: B' though it derives x=2 and the key is D;
> contradicts itself.*
>
> `ARI-FRC-074` — *Key is right but explanation marks E true, contradicting the key; theory-style
> stem labelled extreme_hard is really medium.*

**`/audit/removed.json`** — 97 KB, the data the page reads. No question text, options or answers
are published: just the ID, where it lived, and why it failed. Nothing paid leaks.

**Wired in from three places on the homepage:** the top bar ("See every one →"), the "How this was
built" bullet, and the FAQ answer about the question count. Added to `sitemap.xml`.

## Verified

Rendered at 1440px and 390px: 370 rows load, stat tiles read 370 / 793 / 271 / 11 / 88 / 23,
filtering by `explanation_error` returns 48, searching "GEO-" returns 91, the empty state shows,
"Show more" pages correctly, no console or page errors, no sideways scroll on a phone, and the
table collapses to stacked cards at mobile width. The ID-merge removed the duplicate rows the first
build had (the same question listed once per bank).

## Worth knowing

The failure-reason distribution is itself the content roadmap. The three biggest reasons were
`filler_distractors` (138), `trap_mismatch` (114) and `textbook_phrasing` (88) — all three are
"the maths was fine, the item wasn't ETS". That is the standard the `gre-question-gen` skill now
enforces at generation time, so new questions shouldn't reproduce them.

Geometry (91) and Data Interpretation (67) lost the most. Those two are also where figures matter
most, and where `figure_missing` / `figure_contradicts_stem` / `chart_data_corrupt` concentrate.
If you rebuild anything, rebuild DI first — 67 deletions out of a topic that only had 569 pro
questions left is the thinnest part of the bank now.

Nothing is committed or pushed.
