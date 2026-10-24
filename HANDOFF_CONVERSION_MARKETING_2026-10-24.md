# GRE Quant Pro — Why nobody converts, and how to market it
**Date:** 2026-10-24 · **Method:** three independent student personas walked the deployed site (`$HOME/mnt/gre-adi`, clean tree, in sync with `origin/main`), plus competitor and channel research. Every claim below was re-verified against the files before being written down.

---

## 0. The headline: you do not have a conversion problem

You reported **under 100 unique visitors in the last 30 days** and **1–5 Pro purchases in total**.

That is the whole story, and it changes the question you asked.

- At 100 visitors/month, a 2% conversion rate equals **2 sales**. A 5% rate equals 5. You are roughly where the maths says you should be.
- Conversion rate on fewer than ~1,000 visitors is statistically meaningless. One extra sale moves it by a full percentage point. **You cannot learn anything about your funnel from this sample size.**
- A branded search for `grequantpro.com` returns nothing about your site. The domain has effectively zero search visibility, despite 43 `/learn/` pages and the SEO plumbing shipped in September.

**So: the site has real conversion defects — the personas found severe ones, listed in §2 and §3 — but they are not why you have no revenue. You have no revenue because almost nobody is seeing the site.** Fixing the page without fixing traffic gets you from 2 sales a month to 4. Fixing traffic without fixing the page means paying to show strangers the problems in §2.

Do both, in the order given in §3.

---

## 1. The three students

Three personas were run independently, with no knowledge of each other.

| | **Sneha**, 23, Bangalore | **Rohit**, 21, Patna | **Meera**, 29, Pune |
|---|---|---|---|
| Situation | Q162 → needs 168, exam in 11 weeks | Q152, first-timer, exam not booked | Q159 retake, exam in 5 weeks |
| Budget | ₹999 is nothing if content is accurate | "₹2,000 for everything", no credit card | Would pay ₹5,000 to save hours |
| Came from | Google: "GRE quant practice questions free" | Instagram reel → WhatsApp link | Google: "GRE quant full length mock test free" |
| **Would she/he pay ₹999?** | **No** | **No** | **No** |
| Killed by | The bank ships its own failing QA report | The site told him to leave | Her work vanishes when the tab closes |

### Sneha — the skeptic who opened DevTools

She liked the writing. She quoted your no-fake-testimonials paragraph back as *"the single best thing on the site — nobody faking it writes that."* Then she opened the network tab, because she is a CS grad and that is what they do.

**Every question your site sends to the browser carries your own internal QA verdict on itself.** Verified:

| | Free bank (`bank/`) | Pro bank (`pro/bank/`) |
|---|---|---|
| Questions | **963** | **10,318** |
| Carrying a self-critical `ets_note` | **563 (58%)** | **4,710 (45%)** |
| Scoring ≤2 on your own 1–5 ETS scale | **100** | **665** |
| Tagged `explanation_error` | 11 | 91 |
| Tagged `difficulty_mislabelled` | 112 | 980 |

5,390 `ets_note` strings across 158 live JSON files. Samples she pulled, verbatim from the payload:

- `ARI-PCT-001` → `"Options form an arithmetic progression around the key; mostly filler. Trap text is also muddled."`
- `ALG-LIN-005` → `"Explanation closes with 'Answer: B' though it derives x=2 and the key is D; contradicts itself."`
- `STA-CMB-060` → `no_correct_option`, `malformed_type`, `ambiguous_stem`; own note: `"Incoherent stem; schedule is determined; 'all of the above' not allowed in MCQ."` Still live in the free bank.

Her verdict: *"I didn't have to trust or distrust the 'ETS-accurate' claim. The product audited itself, failed itself, published the failing grades in the payload, and then sold me the headline."*

She also worked through questions by hand. The hard tier is genuinely good — she called `STA-PRM-061`'s explanation *"better than Magoosh"*. The broken ones are in the free sample a first visitor sees: `DAT-TBL-015` plots a Sophomore series against a Freshmen stem with a total of 3.0 instead of 3,150; `DAT-TBL-035` is unanswerable because the row its own explanation uses isn't in the table.

And: **the paid product is an open download.** `/pro/bank/` (10,318 questions, ~22 MB), `/pro/mocks/mock_03–10.json` and `/learn/pro-body/*.html` are all fetchable by URL. `robots.txt` disallows them, which stops Google and nobody else. `pro/pro-gate.js` is a client-side localStorage check — its own header comment says so.

### Rohit — the beginner the site ejects

He understood nothing. "Trap" appears dozens of times and is never defined. Nor are "QC", "Exam Mode", "trap-tagged", "adaptive Section 2". The first worked example on the homepage uses *harmonic mean*.

Then he found your honesty box: *"This is NOT for you if… ✗ You're a complete beginner who hasn't studied GRE Quant concepts yet."*

*"So the site told me to leave. Thank you for being honest, but I closed the tab feeling stupid."*

The cruel part: **you own exactly what he would have paid for, and it is invisible.** `learn/` and the free handbook appear in `index.html` only at **lines 69 and 96 — both inside the nav and the hamburger menu. Zero mentions in the page body.** The homepage's "practice for free" section offers four things and all four are *tests*. 75 concept notes and a 63-page handbook exist and a scrolling phone visitor will never meet them.

He also caught two contradictions in under a minute:
- `pricing.html` promises Free gets **"All 4 difficulty levels"** (line 115, and again in the comparison table at line 233). The app does `btn.title = 'Hard & Extreme questions are Pro only'` (line 2303). **Your pricing page makes a claim the product visibly breaks in 30 seconds.**
- The nav says "Get Pro — from ₹399" on `/`, **"Get Pro — ₹499" on `/learn/`**, and the page sells ₹999 against ₹1,497 struck through. Four prices.

His exit: download the free handbook PDF, put it in Downloads with the other eleven he never opened, go back to the Telegram group. *"A lower price alone would not have done it. Paying for 8,390 questions when I can't solve 10 is paying to be told I'm bad 8,390 times."*

What he said he **would** buy, today: *"₹299: 4-week Quant Basics track. Percentages, ratios, number properties. Lesson, then 10 questions, then the next lesson. 152 to 158."*

### Meera — the one with money, lost to a missing database

She is the most valuable visitor on the site and she got closest to buying. The diagnostic block nearly closed her: *"Drop the official Quant report here… a week-by-week plan"* — that is exactly what she came for.

Then she took the free mock and hit three walls.

1. **No score.** There is no scaled-score function anywhere in the codebase. The results ring shows `correct/total` under the word **CORRECT**. `renderDiagnosis()` maps a raw percentage to a hardcoded band string — *"You're in the 158–165 band."* For a retaker at 159 targeting 166, a 7-point band after 47 minutes has zero decision value.
2. **The download is a `.json` file.** `index.html` lines 250 and 445 promise "Session reports + PDF export". `downloadResult()` emits raw JSON.
3. **The product tells her the work doesn't persist.** `full_mock.html` line 200, in your own words: *"It goes into the result file you download and **isn't saved anywhere else.**"*

Verified: `full_mock.html`, `sectional.html`, `diagnostic.html` and `gre_practice_logger_free.html` use **zero** `localStorage` / `sessionStorage` / `indexedDB` for student work. Nothing stores an answer, a score or an error tag.

But the data is not lost — it is redirected. `full_mock.html:275` POSTs the full payload (name, email, per-question correctness, `time_taken_seconds`, topic, subtopic, difficulty) to your Worker. **She hands over her complete diagnostic profile and her email, and receives a JSON file.** Her words: *"That is the exact inverse of the value exchange the homepage promises."*

Two things she rated higher than you do:

- **Section 2 adaptivity is real.** `mock_01.json` carries a `forms` object and `full_mock.html:743` branches on `correct >= ADAPTIVE_THRESHOLD` (7). Section times are `21 × 60` and `26 × 60` against 12 and 15 questions — the short GRE, exactly. This is the most defensible engineering on the site and the homepage barely mentions it.
- **`diagnostic/` is a serious product**: ~2,990 lines across `parser.js`, `analysis.js`, `plan.js`, `ui.js`, `charts.js` plus a 39 KB taxonomy. It sorts weaknesses, builds evidence strings, and even guards against *"a tidy plan that quietly assumes a perfect paper."* It is gated behind owning an ETS report and buried below the hero — **unreachable for 100% of first-time takers except via a line inside a collapsed FAQ accordion.**

Her price: *"₹999 for a question bank, no. 'Retake Rescue — 5 weeks, two mocks reviewed personally by a 170/170 scorer, drill plan rebuilt weekly' at ₹4,999 — I buy that in one click."*

### What all three independently said

1. **"8,390+" hurts you.** All three distrusted it. Meera: *"That number tells me volume, which is the metric I care least about."* And it is wrong in four directions: marketing says 8,390+, `pro/bank/index.json` says 10,318, the files hold 10,738, the comparison table says Free = 160 when the free bank actually holds **963** — you are understating your own free tier by 6×.
2. **The "Coach Aditya Goenka — 170/170" credential is your biggest asset and it is set in small grey text.** Sneha: *"A real 170 scorer screenshots that report. Nobody who scored 170 hides it."* There is not a single outbound profile link in the entire codebase.
3. **The fake-urgency bar contradicts your honesty.** "Early Access Pricing — price increases after launch", "first 20 students", no counter, no date. It sits 200px above the no-fake-testimonials paragraph and Sneha called strike one on it before reading a word of the product.
4. **Nothing ever answers "what should I drill tonight."**

### One thing to fix today, unrelated to conversion

`afd/` is tracked and deployed on `grequantpro.com`, including **`Doctor_Master.xlsx`, `msr.xlsx`, `previous_sales.xls`, `roi_register.xlsx`, `sales.xls`** — real pharma commercial data. The site root also serves `dashboard.html` titled `PharmaBoard · Presentation Mode · AFD Hospicare`, plus `sdp/salary/Payroll_App.html`, `sdp/invoicing/`, `internship/`, and four deployed backup files (`index.html.bak_pre_study_2026-10-24`, `index_original_backup.html`, `previous.html`, `diagnostic.html.bak_pre_study_2026-10-24`).

Third-party client data on a public domain is a different category of problem from a weak CTA. Given the moonlighting situation, it is also the kind of thing that is hard to explain. Remove it before anything else on this list.

---

## 2. Consolidated fix list, with effort

Ranked by **revenue impact ÷ effort**. P0 before you spend one rupee on traffic.

### P0 — Do this week (total ≈ 4–6 hours, plus the question repair)

| # | Fix | Effort | Why |
|---|---|---|---|
| 1 | Delete `afd/`, `sdp/`, `internship/`, root `dashboard.html`, `previous.html`, `index_original_backup.html`, both `.bak_pre_study_2026-10-24` files from the deployed site | **30 min** | Client data exposure. Not negotiable. |
| 2 | Strip every `ets_score` / `ets_tags` / `ets_note` / `ets_rescore` / `ets_difficulty_recal` field from the JSON the browser receives (keep them in a private audit copy) | **1–2 h** (script + rebuild) | Removes a machine-readable confession from 5,390 places |
| 3 | Fix the "Free = All 4 difficulty levels" claim on `pricing.html` lines 115 and 233 to match the app | **15 min** | A provable lie on the pricing page ends the sale |
| 4 | One question count, everywhere. Reconcile 8,390+ / 10,318 / 10,738 / 160 / 963. Drop the "+" | **1 h** | Then replace the headline number with the audit line in #8 |
| 5 | Harmonize the price in the nav across all pages (`/learn/` says ₹499) | **30 min** | |
| 6 | Remove the fake-urgency bar, or give it a real counter and date | **20 min** | It costs you the honesty positioning that is your only edge |
| 7 | `robots.txt`: un-disallow `/events/mock_test.html` — the Daily Challenge is promoted in every nav as a lead magnet and blocked from Google | **5 min** | |
| 8 | Add the 170/170 ETS score report as an image + one verifiable profile link. Then the audit line: *"Every question re-audited against the ETS rubric, Oct 2026 — N removed, N explanations corrected."* | **30 min** + see below | Sneha: worth more than the entire comparison table |
| 9 | Pull or repair the **100** free-bank questions scoring ≤2 and the **11** `explanation_error` items. Start: `STA-CMB-060`, `DAT-TBL-015`, `DAT-TBL-035`, `ALG-LIN-005`, `NUM-DIV-005`, `ARI-FRC-008` | **6–10 h** with the `gre-question-gen` skill in batches | These are in the free sample every visitor tastes |
| 10 | Deploy the Cloudflare Worker — lead capture currently records nothing | **you know this one** | Spending ad money before this is spending it into a void |

Note on #8: there is a real tension here. Sneha needs a named, checkable human; the moonlighting constraint pushes the other way. The git log shows `adi removal` and then `Revert "adi removal"`, so the name is a deliberate choice. If it stays, commit to it properly — the half-measure (a name with nothing to verify) gets the risk without the trust. If it goes, the trust gap has to be filled another way: a public audit log, or a visible refund count.

### P1 — Close the revenue hole (≈ 8–16 hours)

| # | Fix | Effort |
|---|---|---|
| 11 | Serve `pro/bank/`, `pro/mocks/mock_03–10.json` and `learn/pro-body/*.html` through the Worker with the existing `/validate` token instead of `robots.txt`. The KV store and endpoint already exist | **8–16 h** |
| 12 | Repair the 665 pro-bank questions scoring ≤2 and 91 `explanation_error` items | **20–30 h**, phase over a month |

### P2 — The machinery that actually earns money (≈ 30–50 hours)

| # | Fix | Effort | Who it wins |
|---|---|---|---|
| 13 | Email + magic-link accounts, attempt history readable back by the student. The POST pipe already carries full per-question telemetry — this is a read path and a render, not a data-collection project | **12–20 h** | Meera. Without it nothing compounds |
| 13b | Interim that ships tonight: write every attempt to `localStorage` and render "Your attempts" on the mock and sectional pages | **2–3 h** | Ends the "my work vanished" moment |
| 14 | Scaled score with a band ("162 ± 3"), and replace `renderDiagnosis()`'s canned paragraphs with a computed weakness report using the `time_taken_seconds` you already capture — *"QC at 54%, 2:38 avg vs 1:45 target, ≈4 points on the table"* | **6–10 h** | Meera |
| 15 | Promote `diagnostic/` to the front door; make each plan row a button that builds the timed drill set it names | **4–6 h** | Meera. 3,000 lines of finished product, currently unreachable |
| 16 | A 10-question, 8-minute placement quiz as the hero's free CTA, replacing the 47-minute mock. Output: *"You're around 152 — start here"* + first lesson. Also the only way a first-timer can reach the plan engine | **6–8 h** | Rohit + Meera |
| 17 | Link `learn/` and the handbook from the homepage **body**, and reorder the free section to **Learn → Practice → Test** | **2 h** | Rohit. Highest impact per hour on the list |
| 18 | Rewrite "NOT for you if… complete beginner" into a fork: *"New to GRE Quant? Start with the free Concept Notes track →"*. Keep the honesty, redirect instead of ejecting | **1 h** | Rohit |
| 19 | Define "trap" in one sentence at first use; add a 6-term glossary | **1 h** | Rohit |
| 20 | Drop the mandatory name field on free practice (and the "Practice Source — e.g. Manhattan Prep, ETS OG" field from the first screen) | **30 min** | Contradicts "no login required" |
| 21 | Replace the JSON download with a one-page PDF, or stop claiming "PDF export" | **4–6 h** / 10 min | Meera |
| 22 | Mobile: raise the difficulty-pill tap targets (currently ~26 px) and fix the 10 `grid-template-columns:1fr 1fr` rules in the free logger against only 4 breakpoints; DI charts are unreadable at 360 px and DI is a free topic | **3–4 h** | All three |
| 23 | Rewrite 8–10 `/learn/` pages out of lecture-script voice ("Class length: ~75 min", "Teaching note. Open by asking the room") into student self-study voice | **6–10 h** | Rohit, and SEO (§4) |

### Packaging — the single biggest revenue lever, and it costs no engineering

You have one SKU at ₹999 aimed at a student who is between Rohit and Meera and may not exist. Three personas wanted three products:

| Tier | Price | What it is | For |
|---|---|---|---|
| Basics | **₹299–399** | A taught 4-week track with a named outcome: "Percentages → Ratios → Number Properties. Lesson, 10 questions, next lesson. 152 → 158." Built from assets you already have | Rohit |
| Pro | **₹999** | Today's bank, unchanged | Self-serve |
| **Retake Rescue** | **₹3,999–4,999** | 5 weeks. Two mocks reviewed personally by a 170/170 scorer. Drill plan rebuilt weekly. Capped at 5–8 students a month | **Meera** |

The top tier is the one that matters. §3 shows why: **at a ₹999 ticket, no paid channel in India can profitably acquire a customer.** At ₹4,000 they all can. And personal review is the one thing Gregmat and TTP structurally cannot offer — though it is also the tier that raises your exposure most, so decide that deliberately.

---

## 3. Marketing blueprint for ₹10,000–20,000

### The competitive reality

| Product | Price | What Indian aspirants say about it |
|---|---|---|
| **GregMat+** | **$11.99/mo** (~₹1,000) | The default recommendation in every r/GRE thread. Named instructor on video, Verbal included, vocab system. **This is your real competitor.** |
| PrepScholar | $38 (~₹3,200), 12 months | 2,100 questions, adaptive |
| Magoosh Premium | $179 / 6 mo (~₹15,000) | 1,600 questions, 6 tests, score guarantee |
| Target Test Prep | $179/mo, or $449 / 4 mo | 4,000 questions, score guarantee. The quant-depth benchmark |
| Manhattan Prep | $299–599 | Live classes, tutoring |
| Jamboree (India) | **₹4,700 / ₹8,999 / ₹14,850** | 100+ hours of live webinars, sectionals, mocks |
| GREedge (India) | ~₹1,300 entry | 3,000+ questions, live seminars, 1-on-1 feedback |
| PrepAiro (India) | not published | AI-explained questions. **Ranks for your exact keywords** — see below |
| ETS PowerPrep + OG | Free | Definitionally ETS-accurate. The benchmark Sneha measures you against |
| Telegram | Free (pirated) | Where Rohit actually goes |

**The strategic read:** being 1/12 of GregMat's price is a liability, not an advantage. ₹999/year for 8,390 questions reads as *implausible* to Meera and *still worse than free* to Rohit. **Price is not your lever. Proof is.** Your defensible assets are the named-trap taxonomy (genuinely better than Magoosh when it's right), real Section-2 adaptivity, the diagnostic engine, and a 170/170 human who will look at a student's paper. None of those are in your headline.

**The SEO lesson from PrepAiro:** they rank for "free GRE quant practice" with a *single long blog post* containing 18 free worked questions, a keyword-led H1, anchored table of contents, FAQ section and schema tags. You have 43 `/learn/` pages written as teacher lecture scripts and you rank nowhere. Format beats volume here.

### Why paid ads cannot work at ₹999 — the arithmetic

India education benchmarks: Google Search CPC averages **₹28** (range ₹15–55), CPL ₹400–1,000. Meta blended CPC ~**₹6** (₹3–15), CPM ~₹120, education CPL ₹150–400, and the algorithm needs ~₹300–500/day to leave the learning phase.

| Channel | ₹15,000 buys | At 1–2% purchase | Revenue @ ₹999 | Verdict |
|---|---|---|---|---|
| Google Search (head terms) | ~535 clicks @ ₹28 | 5–11 sales | ₹5,000–11,000 | **Loses money** |
| Google Search (long-tail @ ₹15) | ~1,000 clicks | 10–20 sales | ₹10,000–20,000 | Break-even at best |
| Meta broad | ~2,500 clicks @ ₹6 | lower intent, 0.3–0.8% | ₹7,500–20,000 | Volatile, unproven |

**CAC lands at ₹1,400–2,800 against a ₹999 ticket.** This is why nothing you do to the ad account will fix this. The fix is in the packaging table above: at a ₹4,000 average order value, a ₹1,400 CAC is a healthy business.

So the ₹15,000 is not an acquisition budget. **It is a learning budget** — you are buying the answer to "which channel sends intent-qualified GRE students, and at what cost per email?" Protect it accordingly.

### The 90-day plan

**Phase 0 — Weeks 0–1. ₹0. Non-negotiable gate.**
Ship P0 (§2 items 1–10). Deploy the Worker. Until the `ets_note` fields are out of the payload and the ₹999 content is behind the Worker, every rupee of traffic spend is buying strangers a tour of your own QA failures and a free download of the paid product.

**Phase 1 — Weeks 1–4. ₹0. Earn the first 800 visitors.**
This is where Indian GRE aspirants actually are, and it costs nothing but your evenings.

- **myprepclub GRE forum** (`gre.myprepclub.com`) — the highest-intent GRE audience on the open web. Post 3 genuinely hard questions a week with your named-trap explanation and a signature link. Your hard tier is good enough to earn respect there; Sneha rated `STA-PRM-061` above Magoosh. Target: 30 posts.
- **r/GRE** — answer questions for two weeks without linking anything. Then one post: *"I wrote a free 63-page GRE Quant handbook, no email required."* Check the subreddit's self-promotion rule and DM the mods first; an unapproved promo post gets you removed and remembered.
- **Quora** — 10 answers on "how to improve GRE quant from 155 to 165" type questions. Quora answers rank in Google for years.
- **Telegram GRE groups** — share the handbook PDF as a gift, not a pitch. This is Rohit's habitat.
- **Kolkata / Bengal engineering colleges** — offer placement and study-abroad cells a free 90-minute quant workshop plus a free mock for their batch. This is the one channel where you have an unfair advantage: you teach for a living, locally, and nobody else in this market will show up in person.
- **Lead magnet:** the handbook, gated on email only — and rewrite the gate line first. It currently promises *"One email, no list, no spam. Just the handbook,"* which forbids you from ever emailing those leads about Pro.

Target: 500–800 visitors, 100+ emails, at ₹0. If this phase produces nothing, no amount of ad money will.

**Phase 2 — Weeks 3–8. ₹6,000. Google Search, long-tail only.**
₹200/day for 30 days. Exact and phrase match only — never broad.

- **Bid on:** `gre quant practice questions`, `gre quantitative comparison practice`, `free gre quant mock test`, `gre diagnostic report analysis`, `gre quant 170`, plus `[topic] gre practice questions` long-tails (percentages, ratios, number properties, data interpretation).
- **Never bid on:** `gre coaching`, `gre preparation`, `gre classes` — head terms owned by Jamboree, Yocket and the aggregators at ₹50+ a click.
- **Conversion action:** `mock_started` (already configured in `ads-config.js` as "Mock Lead", AW-18184272300). Optimize to that, not to purchase — at this volume you will never get enough purchases to train the algorithm.
- **Kill criteria:** pause any keyword over **₹100 cost per email**. Pause the whole campaign at ₹6,000 spent regardless of result, and read the search-terms report before deciding anything.

**Phase 3 — Weeks 5–10. ₹5,000. Nano creators, not ads.**
Nano Instagram reels (1k–10k followers) price at **₹1,000–12,000**. Target 4–5 study-abroad / GRE creators at the bottom of that range — ₹1,000–1,500 each, sweetened with free Pro access. Brief each one: one trap question, 20 seconds, "here's the answer most people pick and why it's wrong," link in bio. You already make reels for another account, so you can write the brief and judge the cut yourself. Buy the reel *plus* a story link — the story is where the clicks come from.

**Phase 4 — ₹4,000 held in reserve.** Do not allocate this in advance. Spend it on whichever of Phase 1, 2 or 3 produced the cheapest email, and nothing else.

### What to measure

You have conversion tracking wired (AW-18184272300: `mock_started`, `buy_pro_clicked`, `purchase_completed`) but the Worker is undeployed, so leads currently record nowhere. Fix that first, then watch exactly four numbers weekly:

1. Visitors (target: 100 → 1,000/month by day 90)
2. Cost per email, by channel (target: under ₹60)
3. Email → `mock_started` rate (target: 25%+)
4. `mock_started` → purchase rate — **do not look at this before you have 500 mock starts.** Before that it is noise, and reacting to it is how you end up rebuilding a page that was fine.

### What I would not do

- **Meta broad-interest ads.** ₹300–500/day minimum to exit the learning phase eats the whole budget in a month, and "interested in higher education" targeting in India delivers volume, not GRE intent.
- **A second lead magnet.** You have a 63-page handbook and 75 concept notes. The problem is nobody can find them (§2 item 17), not that they don't exist.
- **Discounting below ₹999.** Three personas all said no at ₹999 and none of them said price was the reason. Rohit at ₹299 wanted a *different product*, not a cheaper one.
- **SEO as a 90-day channel.** It is your best long-term asset and your worst short-term one: a new domain takes 4–8 months. Keep publishing (in PrepAiro's question-post format, not lecture-script format) and expect nothing from it this quarter.

---

## 4. The one-line version

Fix the self-incriminating QA data and the open paid bank this week, put a ₹3,999 personally-reviewed tier on the pricing page, then earn your first 800 visitors from GRE forums and Kolkata campuses for free before you spend a rupee on ads — because at ₹999 a sale, no ad channel in India pays for itself.

---

### Sources
- [PPC benchmarks India 2026 — CPC, CTR, CPL by industry](https://owlclaw.com/benchmarks/ppc-benchmarks-india/)
- [Meta ads cost in India 2026 — price list & CPL](https://www.vgraple.com/blog/facebook-ads-cost-india-2026/)
- [Best GRE prep courses 2026 — pricing comparison](https://katalystprep.com/gre/guides/best-prep-courses/)
- [GRE online courses — Indian provider fees](https://collegedunia.com/exams/gre/gre-prep-courses)
- [Influencer marketing cost in India 2026 — rate card by tier](https://www.grynow.in/blog/influencer-marketing-cost-in-india.html)
- [GRE myPrepClub forum](https://gre.myprepclub.com/forum/)
- [PrepAiro — free GRE quant practice post (competitor SEO format)](https://prepairo.ai/gre/blogs/free-gre-quant-practice-2026-ai-explained-questions)
