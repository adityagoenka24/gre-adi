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
              '"author":{"@type":"Person","name":"Aditya Goenka"},'
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
      <a href="/learn/">Concept Notes</a>
      <a href="/handbook/" class="is-current">Handbook</a>
      <a href="/diagnostic.html">Diagnostic</a>
      <a href="/index.html#free">Free Practice</a>
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
  <a href="/handbook/">Handbook</a>
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
      <a href="/handbook/">Handbook</a>
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
    var a = document.createElement('a');
    a.href = PDF; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
  }

  // Someone who already gave an email never sees the gate again.
  try{
    if(localStorage.getItem('gqp_handbook_pdf') === 'yes'){
      form.innerHTML = '<a class="btn btn-primary hb-dl" href="' + PDF + '" download>' +
                       'Download the PDF</a>';
      note.textContent = 'You already have access to this — download away.';
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

/* ---------- responsive ---------- */
@media(max-width:1040px){
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
}

/* ============================================================
   PRINT — this is a deliverable, not an afterthought.
   Ctrl+P should produce something a student is happy to carry.
   ============================================================ */
@media print{
  @page{margin:12mm 12mm}

  nav,.mobile-menu,footer,.glow-1,.glow-2,
  .hb-toc,.hb-toc-mobile,.hb-cta,.hb-print-hint,.hb-modes{display:none!important}

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
    html = re.sub(r'^<p>Coach Aditya Goenka.*?</p>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'^<hr\s*/?>\s*', '', html, count=1)

    html, toc = add_ids_and_toc(html)

    # Wide reference tables need to scroll rather than overflow on a phone.
    html = re.sub(r'(<table>.*?</table>)',
                  r'<div class="hb-tablewrap">\1</div>', html, flags=re.S)

    body = f"""
<main class="hb-main">
  <div class="hb-wrap">

    <header class="hb-hero">{HERO}</header>

    <div class="hb-layout">
      <aside class="hb-toc" aria-label="Contents">
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
    page = shell(body).replace('</body>', gate + scroll_js + '</body>')
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
