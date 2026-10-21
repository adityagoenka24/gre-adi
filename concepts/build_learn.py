#!/usr/bin/env python3
"""
Build the /learn/ concept-notes section from concepts/*.md

    python3 concepts/build_learn.py            # from the workspace root

Reads   concepts/**/*.md          (75 capsules, excluding practice/ and READMEs)
        gre-free/diagnostic/taxonomy.json      (free/Pro split, bank codes, sheets)
Writes  gre-free/learn/<topic>/<slug>.html     one page per capsule
        gre-free/learn/pro-body/<slug>.html       Pro bodies, fetched after auth
        gre-free/learn/index.html              the concept map
        gre-free/diagnostic/taxonomy.json      adds a `url` field per subtopic
        gre-free/sitemap.xml                   free pages only

GATING — a capsule is free if and only if its subtopic is free in the question
bank. The three exam-strategy capsules are always free: plan.js puts Time
Management in week 1 of EVERY plan, free or paid, and week 1 is the "you can
genuinely start" promise.

A capsule file shared by a free and a Pro subtopic resolves to FREE. That is a
deliberate, accepted leak of 4 files (see HANDOFF_2026-09-19.md §2.3).

The Pro gate is soft — the same posture as the existing Pro app, whose bank
JSON is already publicly fetchable. Pro bodies live in pro-body/ so they are at
least out of the page source and out of Google's index.
"""

import json
import os
import re
import sys
from datetime import date

import markdown

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONCEPTS = os.path.join(ROOT, 'concepts')
SITE = os.path.join(ROOT, 'gre-free')
OUT = os.path.join(SITE, 'learn')
TAXONOMY = os.path.join(SITE, 'diagnostic', 'taxonomy.json')
ORIGIN = 'https://grequantpro.com'

# capsules that are free regardless of the bank split
ALWAYS_FREE_DIRS = {'09-exam-strategy'}

TOPIC_TITLES = {
    'arithmetic': 'Arithmetic',
    'number-properties': 'Number Properties',
    'algebra': 'Algebra',
    'word-problems': 'Word Problems',
    'geometry': 'Geometry',
    'coordinate-geometry': 'Coordinate Geometry',
    'statistics-probability': 'Statistics & Probability',
    'data-interpretation': 'Data Interpretation',
    'exam-strategy': 'Exam Strategy',
}

# ----------------------------------------------------------------- helpers

def slug(name):
    """'05-geometry' -> 'geometry';  '10-circles.md' -> 'circles'"""
    name = re.sub(r'\.md$', '', name)
    return re.sub(r'^\d+-', '', name)


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def render_markdown(text):
    """Capsule markdown -> HTML.

    `md_in_html` needs an explicit marker to process markdown inside a raw
    HTML block, and every capsule wraps its self-check answers in <details>.
    Without this the answers render as literal ** asterisks.
    """
    text = text.replace('<details>', '<details markdown="1">')
    html = markdown.markdown(text, extensions=[
        'tables', 'md_in_html', 'attr_list', 'sane_lists', 'fenced_code',
    ])
    # the title and the meta line are rebuilt by the template
    html = re.sub(r'^<h1>.*?</h1>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'^<p><strong>Section:</strong>.*?</p>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'^<hr\s*/?>\s*', '', html, count=1)
    return html.strip()


def parse_capsule(path):
    raw = open(path, encoding='utf-8').read()
    # Practice-sheet sources carry a "Lecture capsule: [x.md](../relative.md)"
    # line — a repo-internal cross-reference written before /learn/ existed.
    # It renders as a clickable link to nowhere on the web. The correct link
    # is already added separately (see `back` in build_practice, built from
    # taxonomy's real /learn/ URL), so this line is just dropped.
    raw = re.sub(r'^\*\*Lecture capsule:\*\*.*$\n?', '', raw, flags=re.M)
    m = re.search(r'^#\s+(.+)$', raw, re.M)
    title = m.group(1).strip() if m else slug(os.path.basename(path)).replace('-', ' ').title()
    meta = {}
    mm = re.search(r'^\*\*Section:\*\*(.+)$', raw, re.M)
    if mm:
        for part in mm.group(1).split('|'):
            if ':' in part:
                k, v = part.split(':', 1)
                meta[k.replace('*', '').strip()] = v.replace('*', '').strip()
            elif part.strip():
                meta.setdefault('Section', part.strip())
    if mm and 'Section' not in meta:
        meta['Section'] = mm.group(1).split('|')[0].replace('*', '').strip()
    return title, meta, render_markdown(raw)


def split_teaser(html):
    """Everything up to the second <h2> is the free teaser."""
    parts = re.split(r'(?=<h2>)', html)
    if len(parts) <= 2:
        return html, ''
    return ''.join(parts[:2]), ''.join(parts[2:])


# ----------------------------------------------------------------- template

def shell(title, description, canonical, body, extra_head='', extra_js=''):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
<link rel="canonical" href="{canonical}">
<meta name="description" content="{esc(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="GRE Quant Pro">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{ORIGIN}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,450..700;1,9..144,450..700&family=Source+Sans+3:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site.css">
<link rel="stylesheet" href="/learn/learn.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="/gre-math.js"></script>
<script defer src="/learn/login-popup.js"></script>
<style>.gre-math{{white-space:normal}}.katex{{font-size:1.06em!important}}</style>
{extra_head}</head>
<body>
<div class="glow-1"></div><div class="glow-2"></div>

<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">GRE Quant <em>Pro</em></a>
    <div class="nav-links">
      <a href="/index.html#how">How it works</a>
      <a href="/learn/">Concept Notes</a>
      <a href="/diagnostic.html">Diagnostic</a>
      <a href="/index.html#free">Free Practice</a>
      <a href="/sectional.html">Sectionals</a>
      <a href="/pricing.html">Pricing</a>
      <a href="#" class="nav-cta-ghost" data-gqp-login>Log in</a>
      <a href="/pricing.html" class="nav-cta-solid" data-track="buy_pro_clicked" data-track-from="nav">Get Pro — ₹499</a>
    </div>
    <button class="hamburger" onclick="toggleMenu()" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="/index.html#how">How it works</a>
  <a href="/learn/">Concept Notes</a>
  <a href="/diagnostic.html">Diagnostic</a>
  <a href="/index.html#free">Free Practice</a>
  <a href="/sectional.html">Sectional Tests</a>
  <a href="/pricing.html">Pricing</a>
  <a href="#" data-gqp-login>Log in to Pro</a>
  <a href="/pricing.html" style="color:var(--accent);font-weight:800">Get Pro — ₹499 →</a>
</div>

{body}

<footer>
  <div class="footer-inner">
    <div class="footer-logo">GRE Quant <em>Pro</em></div>
    <div class="footer-links">
      <a href="/learn/">Concept Notes</a>
      <a href="/diagnostic.html">Diagnostic</a>
      <a href="/pricing.html">Pricing</a>
      <a href="mailto:goenka.aditya.kol@gmail.com">Contact</a>
    </div>
    <div class="footer-copy">Built by Coach Aditya Goenka · <a href="mailto:goenka.aditya.kol@gmail.com">goenka.aditya.kol@gmail.com</a></div>
  </div>
</footer>

<script>
function toggleMenu(){{
  var m=document.getElementById('mobileMenu');
  var o=m.classList.toggle('open');
  var h=document.querySelector('.hamburger'); if(h) h.setAttribute('aria-expanded',String(o));
}}
document.addEventListener('click',function(e){{
  var m=document.getElementById('mobileMenu');
  if(m.classList.contains('open')&&!m.contains(e.target)&&!e.target.closest('.hamburger')) m.classList.remove('open');
}});
</script>
<script src="/analytics.js"></script>
<script>
/* The capsules are written in plain ASCII deliberately: they are also read
   in WhatsApp, in print and in plain markdown viewers, where no renderer
   exists. So the maths is typeset here, at display time, from the same
   source — nothing in the .md files has to change. */
(function () {{
  function typeset() {{
    if (!window.GREMath) return;
    var main = document.querySelector('main') || document.body;
    window.GREMath.renderIn(main);
  }}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () {{ setTimeout(typeset, 0); }});
  else setTimeout(typeset, 0);
  // KaTeX is deferred, so run again once it has actually landed.
  window.addEventListener('load', typeset);
}})();
</script>
{extra_js}</body>
</html>
"""


def capsule_page(c, prev_c, next_c):
    chips = ''.join(
        f'<span class="lrn-chip">{esc(k)}: <b>{esc(v)}</b></span>'
        for k, v in c['meta'].items() if k in ('Section', 'Bank code', 'GRE frequency'))

    resources = []
    if c['practice']:
        resources.append(
            f'<a class="lrn-res" href="{c["practice_url"]}">'
            f'<span class="lrn-res-k">Practice sheet</span>'
            f'<span class="lrn-res-t">30 questions, level-wise, full solutions</span></a>')
    if c['codes']:
        code = c['codes'][0]
        resources.append(
            f'<a class="lrn-res" href="/gre_practice_logger_free.html?topic={code}">'
            f'<span class="lrn-res-k">Drill this subtopic</span>'
            f'<span class="lrn-res-t">{code} — timed practice with named traps</span></a>')
    res_html = (f'<div class="lrn-res-row">{"".join(resources)}</div>' if resources else '')

    nav = []
    if prev_c:
        nav.append(f'<a class="lrn-pn" href="{prev_c["url"]}"><span>← Previous</span><b>{esc(prev_c["title"])}</b></a>')
    if next_c:
        nav.append(f'<a class="lrn-pn lrn-pn-next" href="{next_c["url"]}"><span>Next →</span><b>{esc(next_c["title"])}</b></a>')
    nav_html = f'<div class="lrn-pn-row">{"".join(nav)}</div>' if nav else ''

    if c['free']:
        content = f'<div class="lrn-body">{c["html"]}</div>'
        extra_js = ''
    else:
        teaser, _ = c['teaser'], c['rest']
        content = (
            f'<div class="lrn-body" id="lrnBody">{teaser}</div>'
            f'<div class="lrn-gate" id="lrnGate">'
            f'<div class="lrn-lock" aria-hidden="true">'
            f'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'
            f'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>'
            f'<h2>The rest of this note is part of Pro</h2>'
            f'<p>Must-know rules, three worked examples, the GRE traps, speed tricks and a '
            f'self-check — plus every one of the 75 concept notes and all 8,390 questions.</p>'
            f'<div class="lrn-gate-btns">'
            f'<a class="btn btn-primary" href="/pricing.html" data-track="buy_pro_clicked" data-track-from="learn_gate">Get Pro — ₹499 for the year</a>'
            f'<button class="btn btn-secondary" id="lrnLogin">I already have Pro</button>'
            f'</div>'
            f'<p class="lrn-gate-free">Reading free? <a href="/learn/">{FREE_COUNT} notes are free</a>, '
            f'including every exam-strategy note.</p>'
            f'</div>')
        extra_js = f'<script src="/learn/gate.js" data-slug="{c["slug"]}"></script>\n'

    body = f"""<main class="lrn-main">
  <div class="lrn-wrap">
    <nav class="lrn-crumb" aria-label="Breadcrumb">
      <a href="/learn/">Concept Notes</a> <span>/</span>
      <a href="/learn/#{c['topic']}">{esc(c['topic_title'])}</a>
    </nav>
    <article class="lrn-doc">
      <header class="lrn-head">
        <h1>{esc(c['title'])}</h1>
        <div class="lrn-chips">{chips}{'' if c['free'] else '<span class="lrn-chip lrn-chip-pro">Pro</span>'}</div>
      </header>
      {content}
      {res_html}
      {nav_html}
    </article>
  </div>
</main>"""

    desc = f"{c['title']} — GRE Quant concept note: core idea, must-know rules, worked examples, the traps and speed tricks."
    return shell(f"{c['title']} · GRE Quant Concept Notes", desc, c['canonical'], body, extra_js=extra_js)


# ----------------------------------------------------------------- build

def main():
    taxonomy = json.load(open(TAXONOMY, encoding='utf-8'))

    # capsule path -> the subtopic codes that use it
    by_path = {}
    for code, v in taxonomy.items():
        if v.get('capsule'):
            by_path.setdefault(v['capsule'], []).append(code)

    capsules = []
    for dirpath, _, files in sorted(os.walk(CONCEPTS)):
        if 'practice' in dirpath:
            continue
        topic_dir = os.path.basename(dirpath)
        if topic_dir == 'concepts':
            continue
        for fn in sorted(files):
            if not fn.endswith('.md') or fn == 'README.md':
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT).replace(os.sep, '/')
            topic, s = slug(topic_dir), slug(fn)
            codes = by_path.get(rel, [])
            free = bool(topic_dir in ALWAYS_FREE_DIRS or
                        any(taxonomy[c].get('free') for c in codes))
            title, meta, html = parse_capsule(os.path.join(dirpath, fn))
            teaser, rest = split_teaser(html)
            practice = next((taxonomy[c].get('practice') for c in codes
                             if taxonomy[c].get('practice')), None)
            capsules.append({
                'rel': rel, 'topic': topic, 'slug': s, 'codes': codes, 'free': free,
                'title': title, 'meta': meta, 'html': html, 'teaser': teaser, 'rest': rest,
                'practice': practice,
                'practice_url': f'/learn/practice/{s}.html' if practice else None,
                'topic_title': TOPIC_TITLES.get(topic, topic.replace('-', ' ').title()),
                'url': f'/learn/{topic}/{s}.html',
                'canonical': f'{ORIGIN}/learn/{topic}/{s}.html',
            })

    global FREE_COUNT
    FREE_COUNT = sum(1 for c in capsules if c['free'])

    # ---- write pages
    os.makedirs(os.path.join(OUT, 'pro-body'), exist_ok=True)
    for i, c in enumerate(capsules):
        same = [x for x in capsules if x['topic'] == c['topic']]
        j = same.index(c)
        prev_c = same[j - 1] if j > 0 else None
        next_c = same[j + 1] if j + 1 < len(same) else None
        d = os.path.join(OUT, c['topic'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, c['slug'] + '.html'), 'w', encoding='utf-8').write(
            capsule_page(c, prev_c, next_c))
        if not c['free']:
            open(os.path.join(OUT, 'pro-body', c['slug'] + '.html'), 'w', encoding='utf-8').write(c['rest'])

    # ---- practice sheets: same gating, same template
    sheets = build_practice(taxonomy, capsules)

    # ---- the concept map
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index_page(capsules))

    # ---- taxonomy gets the web path, so plan.js links resolve
    url_for = {}
    for c in capsules:
        for code in c['codes']:
            url_for[code] = c['url']
    changed = 0
    for code, v in taxonomy.items():
        if code in url_for and v.get('url') != url_for[code]:
            v['url'] = url_for[code]
            changed += 1
        if v.get('practice'):
            # must match the slug build_practice() writes, which drops the
            # redundant '-practice' suffix
            pu = ('/learn/practice/'
                  + slug(os.path.basename(v['practice'])).replace('-practice', '')
                  + '.html')
            if v.get('practiceUrl') != pu:
                v['practiceUrl'] = pu
                changed += 1
    json.dump(taxonomy, open(TAXONOMY, 'w', encoding='utf-8'), indent=1)

    # ---- sitemap: free pages only
    write_sitemap([c for c in capsules if c['free']] + [x for x in sheets if x['free']])

    free = FREE_COUNT
    print(f'practice sheets   : {len(sheets)}  ({sum(1 for x in sheets if x["free"])} free, '
          f'{sum(1 for x in sheets if not x["free"])} Pro)')
    print(f'capsules rendered : {len(capsules)}  ({free} free, {len(capsules)-free} Pro)')
    print(f'pro bodies        : {len(capsules)-free} in learn/pro-body/')
    print(f'taxonomy urls set : {changed}')
    print(f'topics            : {len(set(c["topic"] for c in capsules))}')


def build_practice(taxonomy, capsules):
    """Render the practice sheets to /learn/practice/.

    Gated exactly like the capsules — free when the subtopic is free in the
    bank — because a sheet is 30 questions with full solutions, which is the
    same asset the Pro bank sells.
    """
    d = os.path.join(OUT, 'practice')
    os.makedirs(d, exist_ok=True)
    by_capsule = {c['rel']: c for c in capsules}

    seen, out = set(), []
    for code, v in taxonomy.items():
        rel = v.get('practice')
        if not rel or rel in seen:
            continue
        seen.add(rel)
        src = os.path.join(ROOT, rel)
        if not os.path.exists(src):
            continue
        s = slug(os.path.basename(rel)).replace('-practice', '')
        free = bool(v.get('free'))
        title, _meta, html = parse_capsule(src)
        note = by_capsule.get(v.get('capsule'))

        back = (f'<div class="lrn-res-row"><a class="lrn-res" href="{note["url"]}">'
                f'<span class="lrn-res-k">Concept note</span>'
                f'<span class="lrn-res-t">{esc(note["title"])}</span></a></div>') if note else ''

        if free:
            content = f'<div class="lrn-body">{html}</div>'
            extra_js = ''
        else:
            teaser, rest = split_teaser(html)
            open(os.path.join(OUT, 'pro-body', 'practice-' + s + '.html'), 'w',
                 encoding='utf-8').write(rest)
            content = (
                f'<div class="lrn-body" id="lrnBody">{teaser}</div>'
                f'<div class="lrn-gate" id="lrnGate">'
                f'<div class="lrn-lock" aria-hidden="true">'
                f'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'
                f'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>'
                f'<h2>The rest of this sheet is part of Pro</h2>'
                f'<p>All 30 questions, the answer key and full worked solutions with '
                f'every trap named — plus 75 concept notes and 8,390 questions.</p>'
                f'<div class="lrn-gate-btns">'
                f'<a class="btn btn-primary" href="/pricing.html" data-track="buy_pro_clicked" data-track-from="learn_gate">Get Pro — \u20b9499 for the year</a>'
                f'<button class="btn btn-secondary" id="lrnLogin">I already have Pro</button>'
                f'</div></div>')
            extra_js = f'<script src="/learn/gate.js" data-slug="practice-{s}"></script>\n'

        url = f'/learn/practice/{s}.html'
        body = f"""<main class="lrn-main">
  <div class="lrn-wrap">
    <nav class="lrn-crumb" aria-label="Breadcrumb">
      <a href="/learn/">Concept Notes</a> <span>/</span> <span>Practice</span>
    </nav>
    <article class="lrn-doc">
      <header class="lrn-head">
        <h1>{esc(title)}</h1>
        <div class="lrn-chips"><span class="lrn-chip">Bank code: <b>{esc(code)}</b></span>
        <span class="lrn-chip">30 questions</span>
        {'' if free else '<span class="lrn-chip lrn-chip-pro">Pro</span>'}</div>
      </header>
      {content}
      {back}
    </article>
  </div>
</main>"""
        open(os.path.join(d, s + '.html'), 'w', encoding='utf-8').write(shell(
            f'{title} · GRE Quant Practice',
            f'{title} — 30 level-wise GRE Quant practice questions with full worked solutions.',
            ORIGIN + url, body, extra_js=extra_js))
        out.append({'url': url, 'free': free, 'title': title})
    return out


def index_page(capsules):
    groups = {}
    for c in capsules:
        groups.setdefault(c['topic'], []).append(c)
    order = [t for t in TOPIC_TITLES if t in groups]
    free = sum(1 for c in capsules if c['free'])

    sections = []
    for t in order:
        items = groups[t]
        nfree = sum(1 for c in items if c['free'])
        # built outside the f-string: Python < 3.12 rejects backslashes
        # inside f-string expressions
        PRO_TAG = '<span class="lrn-pro-tag">Pro</span>'
        def row(c):
            codes = ''.join('<code>%s</code>' % esc(x) for x in c['codes'][:2])
            return ('<li class="lrn-item%s"><a href="%s">%s</a>%s%s</li>' % (
                '' if c['free'] else ' is-pro', c['url'], esc(c['title']),
                codes, '' if c['free'] else PRO_TAG))
        rows = ''.join(row(c) for c in items)
        sections.append(
            f'<section class="lrn-group" id="{t}">'
            f'<h2>{esc(TOPIC_TITLES.get(t, t))}<span class="lrn-count">{len(items)} notes · {nfree} free</span></h2>'
            f'<ul class="lrn-list">{rows}</ul></section>')

    body = f"""<main class="lrn-main">
  <div class="lrn-wrap lrn-wide">
    <header class="lrn-hero">
      <div class="lrn-eyebrow">Concept Notes</div>
      <h1>Every GRE Quant idea, in one place.</h1>
      <p>{len(capsules)} concept notes across {len(order)} topics. Each one is the same handout:
      the core idea, the must-know rules, three worked examples, the traps the GRE actually sets,
      speed tricks and a self-check.</p>
      <p class="lrn-hero-free"><b>{free} are free</b>, including every exam-strategy note.
      The rest come with <a href="/pricing.html">Pro — ₹499 for the year</a>.</p>
    </header>
    {''.join(sections)}
  </div>
</main>"""
    return shell(
        'GRE Quant Concept Notes — all 75 topics · GRE Quant Pro',
        f'{len(capsules)} GRE Quant concept notes across {len(order)} topics — core ideas, '
        f'must-know rules, worked examples, traps and speed tricks. {free} free.',
        f'{ORIGIN}/learn/', body)


def write_sitemap(free_capsules):
    path = os.path.join(SITE, 'sitemap.xml')
    xml = open(path, encoding='utf-8').read()
    xml = re.sub(r'\s*<url>\s*<loc>[^<]*/learn/[^<]*</loc>.*?</url>', '', xml, flags=re.S)
    today = date.today().isoformat()
    entries = [f"""  <url>
    <loc>{ORIGIN}/learn/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
"""]
    for c in sorted(free_capsules, key=lambda x: x['url']):
        entries.append(f"""  <url>
    <loc>{ORIGIN}{c['url']}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
""")
    xml = xml.replace('</urlset>', ''.join(entries) + '</urlset>')
    open(path, 'w', encoding='utf-8').write(xml)
    print(f'sitemap           : +{len(entries)} urls (free only)')


FREE_COUNT = 0

if __name__ == '__main__':
    main()
