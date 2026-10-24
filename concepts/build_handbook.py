#!/usr/bin/env python3
"""
Build the /handbook/ final-revision handbook from concepts/handbook/HANDBOOK.md

    python3 concepts/build_handbook.py            # from the workspace root
    python3 concepts/build_handbook.py --pdf      # also render the print PDF

Reads   concepts/handbook/HANDBOOK.md     the single source of truth
Writes  handbook/index.html               the public page (free, indexable)
        handbook/handbook.css             page + print stylesheet
        sitemap.xml                       adds/refreshes the /handbook/ entry

HANDBOOK.md is the ONLY place to edit content. Never hand-edit
handbook/index.html — it is overwritten on every build.

The page is deliberately free and crawlable: it is the top-of-funnel asset.
The PDF download is behind a one-field email gate (see GATE in the template),
which POSTs to the Worker's /lead endpoint. If that call fails the download is
still released — a broken lead-capture must never cost a student the handbook.

--pdf needs Chromium via Playwright, which is not installed on the Mac by
default. If it is missing the HTML still builds and the step is skipped with a
message; the committed PDF stays as it was.
"""

import os
import re
import sys
from datetime import date

import markdown

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'concepts', 'handbook', 'HANDBOOK.md')
OUTDIR = os.path.join(ROOT, 'handbook')
ORIGIN = 'https://grequantpro.com'

PDF_NAME = 'gre-quant-formula-handbook.pdf'
TITLE = 'GRE Quant Formula & Revision Handbook'
DESCRIPTION = ('Every GRE Quant formula, rule and trap on one page: arithmetic, number properties, '
               'algebra, word problems, geometry, coordinate geometry, statistics, probability and '
               'data interpretation. Free to read, free to print.')


# --------------------------------------------------------------------------
# Pro conversion layer
#
# Every figure below is copied from pricing.html (the single place prices and
# bank sizes live). If pricing.html changes, change these. Nothing here is
# invented: no countdowns, no fake scarcity, no "students enrolled" claims.
# --------------------------------------------------------------------------

PRO_URL = '/pricing.html#plans'
FREE_URL = '/gre_practice_logger_free.html'
PRO_TRUST = 'One payment &middot; 1-year access &middot; 7-day money-back guarantee &middot; all future questions included'

# handbook section number -> (Pro topic name, questions in that topic, example subtopics)
BANK = {
    '1': ('Arithmetic', 1537, 'Percentages, Ratios &amp; Proportions, Rates &amp; Unit Conversions'),
    '2': ('Number Properties', 1286, 'GCD &amp; LCM, Divisibility Rules, Consecutive Integers'),
    '3': ('Algebra', 1438, 'Inequalities, Quadratic Equations, Functions'),
    '4': ('Word Problems', 559, 'Work &amp; Rate, Mixtures, Distance-Speed-Time'),
    '5': ('Geometry', 1893, 'Circles, Triangles, Special Triangles'),
    '6': ('Coordinate Geometry', 839, 'Slope &amp; Intercepts, Distance Between Points, Quadratic Graphs'),
    '7': ('Statistics &amp; Probability', 1420, 'Mean, Median &amp; Mode, Basic Probability, Combinations'),
    '8': ('Data Interpretation', 569, 'Bar Graphs, Pie Charts, Percentage Change from Graphs'),
}


def pro_link(slot, label, cls='btn btn-primary'):
    return (f'<a class="{cls}" href="{PRO_URL}" data-track="handbook_pro_clicked" '
            f'data-track-from="{slot}">{label}</a>')


def free_link(slot, label='Try the free app first'):
    return (f'<a class="hb-free" href="{FREE_URL}" data-track="handbook_free_app_clicked" '
            f'data-track-from="{slot}">{label}</a>')


def section_callout(num):
    """The 'practice this' box at the end of a section. Screen only."""
    if num == '9':
        title = 'Drill these 25 traps until they stop working on you'
        body = ('Every one of the 9,629 Pro questions is trap-tagged, and every wrong answer names '
                'the exact trap you fell into &mdash; the same traps this section lists.')
    else:
        topic, count, subs = BANK[num]
        title = f'Practice this section: {count:,} {topic} questions'
        body = (f'In Pro: {subs}, and more &mdash; every difficulty level. '
                'Every wrong answer shows the exact trap you fell into.')
    return (f'<aside class="hb-pro" aria-label="Practice this section">'
            f'<div class="hb-pro-text"><b>{title}</b><span>{body}</span></div>'
            f'<div class="hb-pro-act">{pro_link("section_" + num, "See Pro plans")}'
            f'{free_link("section_" + num, "Try free first")}</div></aside>')


def inject_section_callouts(html):
    """Insert a callout at the end of Sections 1-9 (just before the next h2)."""
    heads = [(m.start(), re.sub(r'<[^>]+>', '', m.group(1)))
             for m in re.finditer(r'<h2 id="[^"]*"[^>]*>(.*?)</h2>', html, flags=re.S)]
    inserts = []
    for i, (pos, label) in enumerate(heads):
        m = re.match(r'Section (\d)\b', label)
        if not m:
            continue
        end = heads[i + 1][0] if i + 1 < len(heads) else len(html)
        inserts.append((end, section_callout(m.group(1))))
    for pos, block in sorted(inserts, reverse=True):
        html = html[:pos] + block + '\n' + html[pos:]
    return html


BRIDGE = f"""
    <section class="hb-bridge" id="pro" aria-labelledby="hbBridgeTitle">
      <div class="hb-bridge-eyebrow">After you revise</div>
      <h2 id="hbBridgeTitle">This handbook tells you what to remember. Pro makes sure you can use it on the clock.</h2>
      <p class="hb-bridge-sub">Knowing a formula and applying it in ninety seconds, with a trap sitting in
      the answer choices, are two different skills. The question bank is where the second one is built.</p>
      <div class="hb-bridge-grid">
        <div><b>9,629 trap-tagged questions</b>
          <span>All 95 subtopics, every difficulty level. A wrong answer shows the exact trap you fell
          into &mdash; the same ones named in Section 9.</span></div>
        <div><b>10 full-length mocks</b>
          <span>In the real GRE interface, from Balanced up to Expert (170). Score, diagnosis and trap
          review after each one.</span></div>
        <div><b>Sectional tests with real timing</b>
          <span>One topic, exam-timed sets, so you find the weak section before the exam does.</span></div>
      </div>
      <div class="hb-bridge-act">
        {pro_link('bridge', 'See Pro plans &mdash; from &#8377;399')}
        {free_link('bridge')}
      </div>
      <p class="hb-bridge-trust">{PRO_TRUST}.</p>
    </section>
"""

RAIL_CARD = f"""
        <div class="hb-rail-pro">
          <b>Done revising?</b>
          <span>Practice it with 9,629 trap-tagged questions.</span>
          {pro_link('rail', 'See Pro plans', 'btn btn-primary btn-sm')}
        </div>
"""

ENDCARD = f"""
        <section class="hb-end" aria-labelledby="hbEndTitle">
          <div class="hb-end-eyebrow">What to do next</div>
          <h2 id="hbEndTitle">You have the formulas. Now build the speed.</h2>
          <p>The marks lost on test day are rarely missing formulas. They are traps recognized a second
          too late. Pro is where you practice until you recognize them in time.</p>
          <div class="hb-end-plans">
            <div><b>Topic-wise Practice</b><span>All 95 subtopics, unlimited questions</span><em>&#8377;499</em></div>
            <div><b>Sectional Tests</b><span>Every topic, exam timing</span><em>&#8377;399</em></div>
            <div><b>Full-Length Mocks</b><span>All 10, Balanced to Expert (170)</span><em>&#8377;599</em></div>
            <div class="is-best"><b>The full bundle</b><span>Everything above, one payment</span><em>&#8377;999 <s>&#8377;1,497</s></em></div>
          </div>
          <div class="hb-end-act">
            {pro_link('endcard', 'Get Pro &mdash; see plans')}
            {free_link('endcard', 'Or start with the free app')}
          </div>
          <p class="hb-end-trust">{PRO_TRUST}.</p>
          <p class="hb-print-only">grequantpro.com/pricing.html</p>
        </section>
"""

MOBILE_BAR = f"""
<div class="hb-bar" id="hbBar" hidden>
  <span>Done revising? Practice it in Pro.</span>
  {pro_link('mobile_bar', 'See plans', 'btn btn-primary btn-sm')}
  <button type="button" id="hbBarX" aria-label="Dismiss">&times;</button>
</div>
<script>
(function(){{
  var bar=document.getElementById('hbBar'); if(!bar) return;
  try{{ if(sessionStorage.getItem('gqp_hb_bar')==='x') return; }}catch(e){{}}
  function show(){{ if(window.scrollY>1400){{ bar.hidden=false; window.removeEventListener('scroll',show); }} }}
  window.addEventListener('scroll',show,{{passive:true}}); show();
  document.getElementById('hbBarX').addEventListener('click',function(){{
    bar.hidden=true; try{{ sessionStorage.setItem('gqp_hb_bar','x'); }}catch(e){{}}
  }});
}})();
</script>
"""


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def slugify(text):
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', 'and')
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text).strip().lower()
    return re.sub(r'[\s-]+', '-', text)[:60] or 'section'


def render(md_text):
    """Markdown -> HTML, with the same extension set the /learn/ build uses."""
    return markdown.markdown(md_text, extensions=[
        'tables', 'md_in_html', 'attr_list', 'sane_lists', 'fenced_code',
    ])


def add_ids_and_toc(html):
    """Give every h2/h3 a stable id and build the jump list.

    The h1 and the 'How to use' block are navigation furniture, not content
    sections, so the contents list starts at 'Section A'.
    """
    toc, seen = [], set()

    def tag(m):
        level, attrs, inner = m.group(1), m.group(2), m.group(3)
        base = slugify(inner)
        sid, n = base, 2
        while sid in seen:
            sid, n = f'{base}-{n}', n + 1
        seen.add(sid)
        toc.append((level, sid, inner))
        return f'<h{level} id="{sid}"{attrs}>{inner}</h{level}>'

    html = re.sub(r'<h([23])([^>]*)>(.*?)</h\1>', tag, html, flags=re.S)

    items = []
    for level, sid, inner in toc:
        label = re.sub(r'<[^>]+>', '', inner)
        if label.startswith('How to use'):
            continue
        cls = 'hb-toc-2' if level == '2' else 'hb-toc-3'
        items.append(f'<li class="{cls}"><a href="#{sid}">{esc(label)}</a></li>')
    return html, '\n'.join(items)


# --------------------------------------------------------------------------
# the page
# --------------------------------------------------------------------------

def shell(body, extra_head=''):
    canonical = f'{ORIGIN}/handbook/'
    # assembled as a plain string so the JSON braces survive the f-string below
    jsonld = ('{"@context":"https://schema.org","@type":"LearningResource",'
              f'"name":"{TITLE}","description":"{DESCRIPTION}",'
              f'"url":"{canonical}","inLanguage":"en",'
              '"learningResourceType":"Reference handbook",'
              '"educationalLevel":"Graduate admissions test preparation",'
              '"teaches":"GRE Quantitative Reasoning",'
              '"isAccessibleForFree":true,'
              '"author":{"@type":"Organization","name":"GRE Quant Pro"},'
              '"provider":{"@type":"Organization","name":"GRE Quant Pro",'
              f'"url":"{ORIGIN}"}}}}')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(TITLE)} · GRE Quant Pro</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
<link rel="canonical" href="{canonical}">
<meta name="description" content="{esc(DESCRIPTION)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="GRE Quant Pro">
<meta property="og:title" content="{esc(TITLE)}">
<meta property="og:description" content="{esc(DESCRIPTION)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{ORIGIN}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,450..700;1,9..144,450..700&family=Source+Sans+3:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site.css">
<link rel="stylesheet" href="/handbook/handbook.css">
<script type="application/ld+json">{jsonld}</script>
{extra_head}</head>
<body>
<div class="glow-1"></div><div class="glow-2"></div>

<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">GRE Quant <em>Pro</em></a>
    <div class="nav-links">
      <a href="/index.html#how">How it works</a>
      <div class="nav-dropdown">
        <a href="/handbook/" class="is-current">Study Material <span class="nav-caret">▾</span></a>
        <div class="nav-dropdown-menu">
          <a href="/learn/">Concept Notes</a>
          <a href="/handbook/" class="is-current">Handbook</a>
        </div>
      </div>
      <a href="/diagnostic.html">Diagnostic</a>
      <div class="nav-dropdown">
        <a href="/index.html#free">Free Practice <span class="nav-caret">▾</span></a>
        <div class="nav-dropdown-menu">
          <a href="/full_mock.html">Full Mock</a>
          <a href="/gre_practice_logger_free.html">Topic-wise Practice</a>
          <a href="/sectional.html">Sectional Tests</a>
          <a href="/events/mock_test.html">Daily Challenge</a>
        </div>
      </div>
      <a href="/pricing.html">Pricing</a>
      <a href="#" class="nav-cta-ghost" data-gqp-login>Log in</a>
      <a href="/pricing.html" class="nav-cta-solid" data-track="buy_pro_clicked" data-track-from="nav">Get Pro — from ₹399</a>
    </div>
    <button class="hamburger" onclick="toggleMenu()" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="/index.html#how">How it works</a>
  <a href="/handbook/">Study Material</a>
  <div class="mobile-submenu">
    <a href="/learn/">Concept Notes</a>
    <a href="/handbook/">Handbook</a>
  </div>
  <a href="/diagnostic.html">Analyse My Diagnostic</a>
  <a href="/index.html#free">Free Practice</a>
  <div class="mobile-submenu">
    <a href="/full_mock.html">Full Mock</a>
    <a href="/gre_practice_logger_free.html">Topic-wise Practice</a>
    <a href="/sectional.html">Sectional Tests</a>
    <a href="/events/mock_test.html">Daily Challenge</a>
  </div>
  <a href="/pricing.html">Pricing</a>
  <a href="#" data-gqp-login>Log in to Pro</a>
  <a href="/pricing.html" style="color:var(--accent);font-weight:800">Get Pro — from ₹399 →</a>
</div>

{body}

<footer>
  <div class="footer-inner">
    <div class="footer-logo">GRE Quant <em>Pro</em></div>
    <div class="footer-links">
      <a href="/learn/">Concept Notes</a>
      <a href="/handbook/">Handbook</a>
      <a href="/diagnostic.html">Diagnostic</a>
      <a href="/pricing.html">Pricing</a>
      <a href="mailto:goenka.aditya.kol@gmail.com">Contact</a>
    </div>
    <div class="footer-copy">Built and maintained by the GRE Quant Pro team · <a href="mailto:goenka.aditya.kol@gmail.com">Contact us</a></div>
  </div>
</footer>

<script>
function toggleMenu(){{
  var m=document.getElementById('mobileMenu');
  var b=document.querySelector('.hamburger');
  var open=m.classList.toggle('is-open');
  if(b) b.setAttribute('aria-expanded', open?'true':'false');
}}
</script>
<script defer src="/analytics.js"></script>
<script defer src="/learn/login-popup.js"></script>
</body>
</html>
"""


HERO = """
      <div class="hb-eyebrow">Free revision handbook</div>
      <h1>Every GRE Quant formula, rule and trap. One document.</h1>
      <p class="hb-lede">Nine sections, every formula worth memorizing, the traps that actually cost
      marks, and an appendix of the values you should never have to work out. Free to read, free to
      print, and built from the same notes my students use all year.</p>

      <div class="hb-modes">
        <div class="hb-mode">
          <b>90 minutes</b>
          <span>The full pass, front to back. Do this the day before a mock.</span>
        </div>
        <div class="hb-mode">
          <b>25 minutes</b>
          <span>Formula boxes only, skipping traps and speed notes. The morning of a mock.</span>
        </div>
        <div class="hb-mode">
          <b>10 minutes</b>
          <span>The test section, the 25 costly traps, the appendix. The night before.</span>
        </div>
      </div>

      <div class="hb-cta" id="pdfGate">
        <div class="hb-cta-copy">
          <b>Printable PDF</b>
          <span>The whole handbook, laid out for paper. Put your email in and it downloads
          right away.</span>
        </div>
        <form class="hb-form" id="pdfForm" novalidate>
          <input type="email" id="pdfEmail" name="email" required autocomplete="email"
                 placeholder="you@example.com" aria-label="Your email address">
          <button type="submit" class="btn btn-primary" id="pdfBtn">Get the PDF</button>
        </form>
        <p class="hb-form-note" id="pdfNote">One email, no list, no spam. Just the handbook.</p>
      </div>
      <div class="hb-print-hint">Or press <kbd>Ctrl</kbd>+<kbd>P</kbd> &mdash; this page is
      styled to print cleanly as it is.</div>
"""

GATE_JS = """
<script>
(function(){
  var WORKER = 'https://gre-auth.goenka-aditya-kol.workers.dev';
  var PDF = '/handbook/%PDF%';
  var form = document.getElementById('pdfForm');
  var input = document.getElementById('pdfEmail');
  var btn = document.getElementById('pdfBtn');
  var note = document.getElementById('pdfNote');
  if(!form) return;

  function release(msg){
    form.innerHTML = '<a class="btn btn-primary hb-dl" href="' + PDF + '" download>' +
                     'Download the PDF</a>' +
                     '<a class="btn btn-secondary" href="' + PDF + '" target="_blank" rel="noopener">' +
                     'Open in a new tab</a>';
    note.textContent = msg || 'Done — the download has started.';
    note.classList.add('is-ok');
    if(!document.getElementById('hbAfter')){
      var nx = document.createElement('p');
      nx.id = 'hbAfter'; nx.className = 'hb-after';
      nx.innerHTML = 'Next step: <a href="/pricing.html#plans" data-track="handbook_pro_clicked" ' +
                     'data-track-from="after_pdf">practice what you just revised with Pro &rarr;</a>';
      note.parentNode.appendChild(nx);
    }
    var a = document.createElement('a');
    a.href = PDF; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
  }

  // Someone who already gave an email never sees the gate again.
  try{
    if(localStorage.getItem('gqp_handbook_pdf') === 'yes'){
      form.innerHTML = '<a class="btn btn-primary hb-dl" href="' + PDF + '" download>' +
                       'Download the PDF</a>';
      note.textContent = 'You already have access to this — download away.';
      var rx = document.createElement('p');
      rx.className = 'hb-after';
      rx.innerHTML = 'Next step: <a href="/pricing.html#plans" data-track="handbook_pro_clicked" ' +
                     'data-track-from="after_pdf_return">practice what you revise with Pro &rarr;</a>';
      note.parentNode.appendChild(rx);
      return;
    }
  }catch(e){}

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var email = (input.value || '').trim();
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)){
      note.textContent = 'That email does not look right — check it and try again.';
      note.classList.add('is-err');
      input.focus();
      return;
    }
    note.classList.remove('is-err');
    btn.disabled = true;
    btn.textContent = 'One moment...';

    try{ localStorage.setItem('gqp_handbook_pdf', 'yes'); }catch(e){}

    // The download is released whatever the Worker says. A lead-capture
    // outage must never stop a student getting the handbook.
    var done = false;
    function finish(msg){ if(done) return; done = true; release(msg); }
    setTimeout(function(){ finish(); }, 4000);

    fetch(WORKER + '/lead', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, source: 'handbook_pdf', site: 'grequantpro'})
    }).then(function(){ finish(); }).catch(function(){ finish(); });

    if(window.gqpTrack) window.gqpTrack('handbook_pdf_requested', {from: 'handbook'});
  });
})();
</script>
"""


def build_css():
    return """/* ============================================================
   GRE Quant Pro — /handbook/ final revision handbook
   Extends site.css (tokens, nav, footer, .btn, .glow-*).
   Two jobs: a readable long-form screen layout with a sticky
   contents rail, and a print stylesheet good enough that
   Ctrl+P is a real alternative to the PDF.
   ============================================================ */

.hb-main{position:relative;z-index:1;padding:44px 0 100px}
.hb-wrap{max-width:1180px;margin:0 auto;padding:0 24px}

/* ---------- hero ---------- */
.hb-hero{max-width:760px;padding-bottom:34px;margin-bottom:34px;border-bottom:1px solid var(--line)}
.hb-eyebrow{font-family:var(--fm);font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:14px}
.hb-hero h1{font-family:var(--fd);font-weight:640;font-size:clamp(28px,4.2vw,42px);color:var(--navy);letter-spacing:-.5px;line-height:1.12;margin-bottom:16px}
.hb-lede{font-size:17px;color:var(--ink2);line-height:1.7}

.hb-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:26px 0}
.hb-mode{background:var(--card);border:1px solid var(--line);border-radius:var(--radius-sm);padding:15px 17px}
.hb-mode b{display:block;font-family:var(--fm);font-size:13px;color:var(--accent);font-weight:700;margin-bottom:5px}
.hb-mode span{font-size:14px;color:var(--ink2);line-height:1.55}

/* ---------- pdf gate ---------- */
.hb-cta{background:var(--blue-soft);border:1px solid #cfe0f0;border-radius:var(--radius);padding:22px 24px;margin-top:28px}
.hb-cta-copy b{display:block;font-family:var(--fd);font-weight:640;font-size:18px;color:var(--navy);margin-bottom:5px}
.hb-cta-copy span{display:block;font-size:14.5px;color:var(--ink2);line-height:1.6;max-width:520px}
.hb-form{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.hb-form input[type=email]{flex:1 1 240px;min-width:0;font-family:var(--ff);font-size:15px;color:var(--ink);background:#fff;border:1px solid var(--line2);border-radius:var(--radius-sm);padding:11px 14px}
.hb-form input[type=email]:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,93,166,.13)}
.hb-form .btn{white-space:nowrap;padding:0 24px;min-height:46px;font-size:15px}
.hb-form .hb-dl{text-decoration:none}
.hb-form-note{font-size:13px;color:var(--ink3);margin:10px 0 0}
.hb-form-note.is-ok{color:var(--green);font-weight:600}
.hb-form-note.is-err{color:var(--red);font-weight:600}
.hb-print-hint{font-size:13.5px;color:var(--ink3);margin-top:14px}
.hb-print-hint kbd{font-family:var(--fm);font-size:11.5px;background:var(--paper2);border:1px solid var(--line2);border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:var(--ink2)}

/* ---------- layout: contents rail + document ---------- */
.hb-layout{display:grid;grid-template-columns:252px minmax(0,1fr);gap:40px;align-items:start}

.hb-toc{position:sticky;top:86px;max-height:calc(100vh - 110px);overflow-y:auto;padding-right:8px;border-right:1px solid var(--line)}
.hb-toc h2{font-family:var(--fm);font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink3);font-weight:700;margin:0 0 12px}
.hb-toc ul{list-style:none;margin:0;padding:0}
.hb-toc li{margin:0}
.hb-toc a{display:block;text-decoration:none;line-height:1.4;padding:4px 0;color:var(--ink2)}
.hb-toc a:hover{color:var(--blue)}
.hb-toc-2{margin-top:12px}
.hb-toc-2>a{font-family:var(--fd);font-size:14.5px;font-weight:640;color:var(--navy)}
.hb-toc-3>a{font-size:13px;padding-left:11px;border-left:1px solid var(--line)}
.hb-toc-3>a.is-active,.hb-toc-2>a.is-active{color:var(--blue);border-left-color:var(--blue);font-weight:700}

.hb-toc-mobile{display:none}

/* ---------- the document itself ---------- */
.hb-doc{background:var(--card);border:1px solid var(--line);border-radius:var(--radius-lg);padding:42px 46px;box-shadow:var(--shadow);font-size:16px;line-height:1.72;color:var(--ink)}
.hb-doc>*:first-child{margin-top:0}

.hb-doc h1{font-family:var(--fd);font-weight:640;font-size:30px;color:var(--navy);letter-spacing:-.3px;line-height:1.18;margin:0 0 6px}
.hb-doc h2{font-family:var(--fd);font-weight:640;font-size:25px;color:var(--navy);letter-spacing:-.25px;margin:46px 0 16px;padding-bottom:11px;border-bottom:2px solid var(--accent);scroll-margin-top:86px}
.hb-doc h3{font-family:var(--fd);font-weight:640;font-size:19px;color:var(--navy);margin:32px 0 12px;scroll-margin-top:86px}
.hb-doc p{margin:0 0 13px}
.hb-doc strong{color:var(--navy);font-weight:700}
.hb-doc em{color:var(--ink2)}
.hb-doc ul,.hb-doc ol{margin:0 0 16px;padding-left:24px}
.hb-doc li{margin-bottom:7px}
.hb-doc li:last-child{margin-bottom:0}
.hb-doc hr{border:none;border-top:1px solid var(--line);margin:30px 0}

.hb-doc code{font-family:var(--fm);font-size:.9em;background:var(--paper2);border-radius:5px;padding:2px 6px;color:var(--blue-dark);white-space:nowrap}
.hb-doc pre{background:var(--navy-deep);color:#e9eef3;border-radius:var(--radius-sm);padding:16px 19px;overflow-x:auto;margin:0 0 18px}
.hb-doc pre code{font-family:var(--fm);font-size:13.5px;line-height:1.65;background:none;color:inherit;padding:0;white-space:pre}

.hb-doc blockquote{margin:0 0 16px;padding:13px 19px;background:var(--blue-soft);border-left:3px solid var(--blue);border-radius:0 var(--radius-sm) var(--radius-sm) 0;color:var(--blue-dark)}
.hb-doc blockquote p{margin:0;color:inherit}

.hb-doc table{width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14.5px}
.hb-doc th,.hb-doc td{text-align:left;padding:9px 13px;border-bottom:1px solid var(--line);vertical-align:top}
.hb-doc th{font-family:var(--fm);font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink3);font-weight:600;border-bottom:1.5px solid var(--line2)}
.hb-doc td{font-size:14.5px}
.hb-doc td code{font-size:.92em;white-space:nowrap}
.hb-doc tbody tr:last-child td{border-bottom:none}
.hb-doc tbody tr:nth-child(even){background:#fcfbf8}

.hb-tablewrap{overflow-x:auto;margin:0 0 20px}
.hb-tablewrap table{margin:0}

/* ---------- Pro conversion layer ---------- */
.btn-sm{padding:0 16px;min-height:38px;font-size:14px;white-space:nowrap}
.hb-free{font-size:14.5px;font-weight:600;color:var(--blue);text-decoration:none;border-bottom:1px solid rgba(26,93,166,.35)}
.hb-free:hover{border-bottom-color:var(--blue)}
.hb-print-only{display:none}
.hb-after{font-size:14px;margin:10px 0 0;color:var(--ink2)}
.hb-after a{font-weight:700;color:var(--accent);text-decoration:none}
.hb-after a:hover{text-decoration:underline}

/* bridge band: right under the hero */
.hb-bridge{background:var(--navy-deep);color:#e9eef3;border-radius:var(--radius-lg);padding:38px 42px;margin:0 0 40px;box-shadow:var(--shadow)}
.hb-bridge-eyebrow{font-family:var(--fm);font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#f0a878;font-weight:700;margin-bottom:12px}
.hb-bridge h2{font-family:var(--fd);font-weight:640;font-size:clamp(23px,3vw,31px);line-height:1.2;letter-spacing:-.3px;color:#fff;margin:0 0 12px;max-width:780px}
.hb-bridge-sub{font-size:16px;line-height:1.65;color:#c9d4de;max-width:700px;margin:0 0 24px}
.hb-bridge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:26px}
.hb-bridge-grid>div{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius-sm);padding:16px 18px}
.hb-bridge-grid b{display:block;font-family:var(--fd);font-weight:640;font-size:16.5px;color:#fff;margin-bottom:6px}
.hb-bridge-grid span{display:block;font-size:14px;line-height:1.55;color:#b9c6d2}
.hb-bridge-act{display:flex;flex-wrap:wrap;align-items:center;gap:18px}
.hb-bridge-act .btn{min-height:48px;padding:0 26px;font-size:15.5px}
.hb-bridge .hb-free{color:#fff;border-bottom-color:rgba(255,255,255,.45)}
.hb-bridge .hb-free:hover{border-bottom-color:#fff}
.hb-bridge-trust{font-size:13px;color:#93a3b3;margin:16px 0 0}

/* contents-rail card */
.hb-rail-pro{background:var(--accent-soft);border:1px solid #f0d3bd;border-radius:var(--radius-sm);padding:13px 14px;margin:0 10px 18px 0}
.hb-rail-pro b{display:block;font-family:var(--fd);font-weight:640;font-size:15px;color:var(--navy);margin-bottom:3px}
.hb-rail-pro span{display:block;font-size:13px;line-height:1.45;color:var(--ink2);margin-bottom:10px}
.hb-rail-pro .btn.btn-primary{display:flex;align-items:center;justify-content:center;width:100%;padding:0 12px;color:#fff;line-height:1}

/* end-of-section prompt */
.hb-pro{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px 24px;background:var(--accent-soft);border:1px solid #f0d3bd;border-left:4px solid var(--accent);border-radius:var(--radius-sm);padding:16px 20px;margin:34px 0 0}
.hb-pro-text{flex:1 1 320px;min-width:0}
.hb-pro-text b{display:block;font-family:var(--fd);font-weight:640;font-size:16.5px;color:var(--navy);margin-bottom:3px;line-height:1.3}
.hb-pro-text span{display:block;font-size:14px;line-height:1.55;color:var(--ink2)}
.hb-pro-act{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.hb-pro-act .btn{min-height:42px;padding:0 20px;font-size:14.5px;white-space:nowrap}

/* end-of-handbook offer */
.hb-end{margin-top:34px;background:var(--navy-deep);color:#e9eef3;border-radius:var(--radius-lg);padding:36px 42px;box-shadow:var(--shadow)}
.hb-end-eyebrow{font-family:var(--fm);font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#f0a878;font-weight:700;margin-bottom:10px}
.hb-end h2{font-family:var(--fd);font-weight:640;font-size:clamp(23px,3vw,30px);line-height:1.2;color:#fff;margin:0 0 10px;letter-spacing:-.3px}
.hb-end>p{font-size:15.5px;line-height:1.65;color:#c9d4de;max-width:640px;margin:0 0 22px}
.hb-end-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:12px;margin-bottom:24px}
.hb-end-plans>div{position:relative;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius-sm);padding:14px 16px 40px}
.hb-end-plans b{display:block;font-family:var(--fd);font-weight:640;font-size:15.5px;color:#fff;margin-bottom:4px}
.hb-end-plans span{display:block;font-size:13px;line-height:1.5;color:#b9c6d2}
.hb-end-plans em{position:absolute;left:16px;bottom:12px;font-style:normal;font-family:var(--fm);font-weight:700;font-size:16px;color:#fff}
.hb-end-plans s{font-family:var(--ff);font-weight:400;font-size:13px;color:#8fa0b0;margin-left:6px}
.hb-end-plans .is-best{background:rgba(198,93,33,.18);border-color:#d9763b}
.hb-end-act{display:flex;flex-wrap:wrap;align-items:center;gap:18px}
.hb-end-act .btn{min-height:48px;padding:0 26px;font-size:15.5px}
.hb-end .hb-free{color:#fff;border-bottom-color:rgba(255,255,255,.45)}
.hb-end-trust{font-size:13px;color:#93a3b3;margin:16px 0 0!important}

/* mobile bar */
.hb-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;display:none;align-items:center;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:var(--navy-deep);color:#fff;box-shadow:0 -6px 20px rgba(0,0,0,.18);font-size:14px}
.hb-bar span{flex:1 1 auto;min-width:0;line-height:1.3}
.hb-bar .btn{flex:0 0 auto;width:auto}
.hb-bar button{background:none;border:none;color:#9fb0c0;font-size:24px;line-height:1;padding:4px 8px;cursor:pointer}
.hb-bar[hidden]{display:none!important}

/* ---------- responsive ---------- */
@media(max-width:1040px){
  .hb-bar:not([hidden]){display:flex}
  .hb-layout{grid-template-columns:1fr;gap:0}
  .hb-toc{display:none}
  .hb-toc-mobile{display:block;margin-bottom:26px;background:var(--card);border:1px solid var(--line);border-radius:var(--radius-sm)}
  .hb-toc-mobile summary{cursor:pointer;list-style:none;font-family:var(--fd);font-weight:640;font-size:16px;color:var(--navy);padding:14px 18px}
  .hb-toc-mobile summary::-webkit-details-marker{display:none}
  .hb-toc-mobile summary::after{content:"▾";float:right;color:var(--ink3)}
  .hb-toc-mobile[open] summary::after{content:"▴"}
  .hb-toc-mobile ul{list-style:none;margin:0;padding:0 18px 16px}
  .hb-toc-mobile a{display:block;padding:5px 0;font-size:14px;color:var(--ink2);text-decoration:none}
  .hb-toc-mobile .hb-toc-2>a{font-weight:700;color:var(--navy);margin-top:9px}
  .hb-toc-mobile .hb-toc-3>a{padding-left:12px;font-size:13.5px}
}
@media(max-width:640px){
  .hb-doc{padding:26px 20px;border-radius:var(--radius);font-size:15.5px}
  .hb-doc h2{font-size:21px;margin-top:38px}
  .hb-doc h3{font-size:17.5px}
  .hb-doc table{font-size:13.5px}
  .hb-doc th,.hb-doc td{padding:7px 9px}
  .hb-cta{padding:18px}
  .hb-bridge,.hb-end{padding:26px 20px}
  .hb-bridge-act,.hb-end-act{flex-direction:column;align-items:stretch;gap:14px;text-align:center}
  .hb-pro{padding:15px 16px}
  .hb-pro-act{width:100%}
  .hb-pro-act .btn{flex:1}
}

/* ============================================================
   PRINT — this is a deliverable, not an afterthought.
   Ctrl+P should produce something a student is happy to carry.
   ============================================================ */
@media print{
  @page{margin:12mm 12mm}

  nav,.mobile-menu,footer,.glow-1,.glow-2,
  .hb-toc,.hb-toc-mobile,.hb-cta,.hb-print-hint,.hb-modes,
  .hb-bridge,.hb-pro,.hb-rail-pro,.hb-bar,.hb-after{display:none!important}

  html,body{background:#fff!important;color:#000!important}

  /* Print fonts are pinned to families that exist on any machine, so the PDF
     is identical whether or not the webfonts loaded. A workhorse serif for
     headings prints better than a display face anyway. */
  body,.hb-doc,.hb-doc p,.hb-doc li,.hb-doc td,.hb-doc th{
    font-family:"Source Sans 3",Helvetica,Arial,sans-serif}
  .hb-hero h1,.hb-doc h1,.hb-doc h2,.hb-doc h3{
    font-family:Fraunces,Georgia,"Times New Roman",serif}
  .hb-doc code,.hb-doc pre,.hb-doc pre code,.hb-eyebrow{
    font-family:"DM Mono","Courier New",monospace}

  .hb-main{padding:0}
  .hb-wrap{max-width:none;padding:0}
  .hb-layout{display:block}

  .hb-hero{border-bottom:2px solid #000;padding-bottom:6mm;margin-bottom:6mm;max-width:none}
  .hb-hero h1{font-size:21pt;color:#000;line-height:1.1}
  .hb-eyebrow{color:#000;font-size:8.5pt}
  .hb-lede{font-size:10pt;color:#222;line-height:1.45}

  .hb-doc{background:#fff;border:none;border-radius:0;box-shadow:none;padding:0;
          font-size:9.3pt;line-height:1.42;color:#000}

  .hb-doc h1{font-size:18pt;color:#000}
  .hb-doc h2{font-size:13.5pt;color:#000;border-bottom:1.5pt solid #000;
             margin:0 0 3.4mm;padding-bottom:1.4mm;
             break-before:page;page-break-before:always;
             break-after:avoid;page-break-after:avoid}
  .hb-doc h2:first-of-type{break-before:auto;page-break-before:auto}
  .hb-doc h3{font-size:10.6pt;color:#000;margin:4.2mm 0 1.7mm;
             break-after:avoid;page-break-after:avoid}
  .hb-doc p{margin:0 0 1.7mm;orphans:3;widows:3}
  .hb-doc strong{color:#000}
  .hb-doc ul,.hb-doc ol{margin:0 0 2.4mm;padding-left:5mm}
  .hb-doc li{margin-bottom:.85mm}
  .hb-doc hr{display:none}

  .hb-doc code{background:#f2f2f2;color:#000;padding:0 2px;font-size:.93em}
  .hb-doc pre{background:#f6f6f6;color:#000;border:.5pt solid #bbb;
              padding:2.4mm 3mm;margin:0 0 3mm;
              break-inside:avoid;page-break-inside:avoid}
  .hb-doc pre code{font-size:8.6pt;line-height:1.5}

  .hb-doc blockquote{background:#f4f4f4;border-left:2pt solid #000;color:#000;
                     padding:2mm 3mm;margin:0 0 3mm;
                     break-inside:avoid;page-break-inside:avoid}

  .hb-doc table,.hb-tablewrap{font-size:8.5pt;margin:0 0 2.8mm;overflow:visible;
                              break-inside:avoid;page-break-inside:avoid}
  .hb-doc th,.hb-doc td{padding:.9mm 1.8mm;border-bottom:.5pt solid #999;font-size:8.5pt}
  .hb-doc th{color:#000;font-size:7.2pt;border-bottom:1pt solid #000}
  .hb-doc tbody tr:nth-child(even){background:#f7f7f7}
  .hb-doc tr{break-inside:avoid;page-break-inside:avoid}

  a{color:#000!important;text-decoration:none}

  /* The one place the PDF mentions Pro: a compact box on the last page. */
  .hb-end{background:#fff;color:#000;border:1pt solid #000;border-radius:0;box-shadow:none;
          padding:4mm 5mm;margin-top:6mm;break-inside:avoid;page-break-inside:avoid}
  .hb-end-eyebrow{color:#000;font-size:7.5pt;margin-bottom:1mm}
  .hb-end h2{font-size:12pt;color:#000;margin:0 0 1.5mm;border:none;padding:0;break-before:auto;page-break-before:auto}
  .hb-end>p{font-size:9pt;color:#000;margin:0 0 2.5mm;max-width:none}
  .hb-end-plans{display:block;margin:0 0 2.5mm}
  .hb-end-plans>div{display:block;background:none;border:none;border-bottom:.5pt solid #999;border-radius:0;padding:.9mm 0}
  .hb-end-plans b{display:inline;color:#000;font-size:8.8pt}
  .hb-end-plans span{display:inline;color:#000;font-size:8.3pt}
  .hb-end-plans span::before{content:" \\2014\\00a0"}
  .hb-end-plans em{position:static;color:#000;font-size:8.8pt;float:right}
  .hb-end-plans s{color:#000}
  .hb-end-plans .is-best{background:none;border-color:#999}
  .hb-end-plans .is-best b{text-decoration:underline}
  .hb-end-act,.hb-end-trust{display:none!important}
  .hb-print-only{display:block;font-family:"DM Mono","Courier New",monospace;font-size:9pt;margin:0}
}
"""


def main():
    want_pdf = '--pdf' in sys.argv

    if not os.path.isfile(SRC):
        sys.exit(f'source not found: {SRC}')

    md_text = open(SRC, encoding='utf-8').read()
    html = render(md_text)

    # The h1 and the 'How to use' table are rebuilt as the hero, so they are
    # stripped from the document body to avoid saying it all twice.
    html = re.sub(r'^<h1>.*?</h1>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'^<p><strong>Every formula.*?</p>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'^<p>The GRE Quant Pro team.*?</p>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'^<hr\s*/?>\s*', '', html, count=1)

    html, toc = add_ids_and_toc(html)
    html = inject_section_callouts(html)

    # Wide reference tables need to scroll rather than overflow on a phone.
    html = re.sub(r'(<table>.*?</table>)',
                  r'<div class="hb-tablewrap">\1</div>', html, flags=re.S)

    body = f"""
<main class="hb-main">
  <div class="hb-wrap">

    <header class="hb-hero">{HERO}</header>
{BRIDGE}
    <div class="hb-layout">
      <aside class="hb-toc" aria-label="Contents">
{RAIL_CARD}
        <h2>Contents</h2>
        <ul>
{toc}
        </ul>
      </aside>

      <div>
        <details class="hb-toc-mobile">
          <summary>Contents</summary>
          <ul>
{toc}
          </ul>
        </details>

        <article class="hb-doc">
{html}
        </article>
{ENDCARD}
      </div>
    </div>

  </div>
</main>
"""

    gate = GATE_JS.replace('%PDF%', PDF_NAME)
    scroll_js = """
<script>
(function(){
  var links=[].slice.call(document.querySelectorAll('.hb-toc a'));
  if(!links.length||!('IntersectionObserver' in window))return;
  var map={};
  links.forEach(function(a){var t=document.getElementById(a.hash.slice(1));if(t)map[t.id]=a;});
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      links.forEach(function(a){a.classList.remove('is-active');});
      var a=map[e.target.id];
      if(a){a.classList.add('is-active');}
    });
  },{rootMargin:'-86px 0px -72% 0px'});
  Object.keys(map).forEach(function(id){io.observe(document.getElementById(id));});
})();
</script>
"""

    os.makedirs(OUTDIR, exist_ok=True)
    page = shell(body).replace('</body>', gate + scroll_js + MOBILE_BAR + '</body>')
    with open(os.path.join(OUTDIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page)
    with open(os.path.join(OUTDIR, 'handbook.css'), 'w', encoding='utf-8') as f:
        f.write(build_css())

    print(f'wrote handbook/index.html   ({len(page) // 1024} KB)')
    print('wrote handbook/handbook.css')

    update_sitemap()

    if want_pdf:
        render_pdf()


def update_sitemap():
    """Add or refresh the /handbook/ entry. Leaves every other entry alone."""
    path = os.path.join(ROOT, 'sitemap.xml')
    if not os.path.isfile(path):
        print('sitemap.xml not found — skipped')
        return
    xml = open(path, encoding='utf-8').read()
    today = date.today().isoformat()
    entry = (f'  <url>\n    <loc>{ORIGIN}/handbook/</loc>\n'
             f'    <lastmod>{today}</lastmod>\n'
             f'    <changefreq>monthly</changefreq>\n'
             f'    <priority>0.9</priority>\n  </url>\n')

    if f'{ORIGIN}/handbook/' in xml:
        xml = re.sub(
            r'  <url>\s*<loc>' + re.escape(f'{ORIGIN}/handbook/') + r'</loc>.*?</url>\s*',
            entry, xml, flags=re.S)
        print('sitemap.xml — refreshed the /handbook/ entry')
    else:
        xml = xml.replace('</urlset>', entry + '</urlset>')
        print('sitemap.xml — added the /handbook/ entry')
    open(path, 'w', encoding='utf-8').write(xml)


def render_pdf():
    """Print the built page to PDF with headless Chromium."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('--pdf skipped: playwright is not installed here.\n'
              '    pip3 install playwright && python3 -m playwright install chromium')
        return

    src = 'file://' + os.path.join(OUTDIR, 'index.html')
    out = os.path.join(OUTDIR, PDF_NAME)
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page()
        page.goto(src, wait_until='networkidle')
        page.emulate_media(media='print')
        page.pdf(path=out, format='A4', print_background=True,
                 display_header_footer=True,
                 header_template='<div></div>',
                 footer_template=(
                     '<div style="width:100%;font-family:Helvetica,Arial,sans-serif;'
                     'font-size:7.5pt;color:#777;padding:0 13mm;display:flex;'
                     'justify-content:space-between;">'
                     '<span>GRE Quant Formula &amp; Revision Handbook &nbsp;&middot;&nbsp; '
                     'grequantpro.com</span>'
                     '<span class="pageNumber"></span></div>'),
                 margin={'top': '14mm', 'bottom': '16mm', 'left': '13mm', 'right': '13mm'})
        b.close()
    print(f'wrote handbook/{PDF_NAME}   ({os.path.getsize(out) // 1024} KB)')


if __name__ == '__main__':
    main()
