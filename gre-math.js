/* ============================================================
   GREMath — plain-text math → typeset math
   Converts the notation used across Adi's GRE question bank
   (x^2, 13², √194, 2ab/(a+b), y^(3/4), 1/x^4, (y^3)^(1/4) …)
   into properly typeset math. Uses KaTeX when available, with a
   pure-HTML fallback (stacked fractions, sup exponents).

   Usage:  GREMath.renderIn(element)
   Safe to call repeatedly; already-rendered nodes are skipped.
   ============================================================ */
(function () {
  'use strict';

  var SUP_MAP = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-' };

  // exponent chunk: ^2, ^-2, ^(10), ^(3/4), ^(-1/2), ^(n+1)
  var EXP = '\\^(?:\\([^()]{1,16}\\)|-?[0-9a-zA-Z.]{1,8})';
  // Operand for fractions — order matters: exponentiated forms first so
  // "x^4" isn't consumed as just "x".
  var OPERAND = '(?:' + [
    '\\([^()]{1,60}\\)(?:' + EXP + ')?',                 // (…), (…)^k
    '\\d+(?:\\.\\d+)?[a-zA-Z]{0,3}(?:' + EXP + ')?',     // 12, 3.5, 2ab, 2x^3
    '[a-zA-Z]{1,3}(?:' + EXP + '|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?'        // x, ab, x^4, x²
  ].join('|') + ')';

  // Patterns that count as "math worth typesetting", tried in order.
  var PATTERNS = [
    // √(expr) or √expr   e.g. √194, √(a²+b²), √2x
    { re: new RegExp('√\\s*(\\([^()]{1,60}\\)|[0-9a-zA-Z.]{1,20}[⁰¹²³⁴⁵⁶⁷⁸⁹]?)', 'g'), type: 'sqrt' },
    // fraction: operand / operand
    { re: new RegExp('(' + OPERAND + ')\\s*/\\s*(' + OPERAND + ')', 'g'), type: 'frac' },
    // caret exponent: x^2, 2^(10), (a+b)^2, y^(3/4), (y^3)^(1/4)
    { re: new RegExp('(\\([^()]{1,40}\\)|\\|[^|]{1,20}\\||[0-9a-zA-Z.]{1,12})\\^(\\([^()]{1,16}\\)|-?[0-9a-zA-Z.]{1,8})', 'g'), type: 'caret' },
    // unicode superscript exponent: 13², x³, (a+b)²
    { re: /(\([^()]{1,40}\)|[0-9a-zA-Z.]{1,12})([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, type: 'usup' }
  ];

  var WORDY = /^(and|or|per|km|mph|hr|min|sec|[A-Z]{2,})$/; // guard rails
  var HAS_OP = /[+\-−*/^√×÷]/; // operator presence → operand is compound

  function stripParens(s) {
    s = String(s).trim();
    if (s[0] === '(' && s[s.length - 1] === ')') {
      var depth = 0, ok = true;
      for (var i = 0; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') { depth--; if (depth === 0 && i < s.length - 1) { ok = false; break; } }
      }
      if (ok) return s.slice(1, -1);
    }
    return s;
  }

  function unicodeSupToNum(s) {
    return s.split('').map(function (c) { return SUP_MAP[c] !== undefined ? SUP_MAP[c] : c; }).join('');
  }

  // Convert an inner expression (already known to be math) to LaTeX-ish
  function innerTex(s) {
    s = String(s);
    // nested unicode superscripts inside operands: a² → a^{2}
    s = s.replace(/([0-9a-zA-Z)])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (_, base, sup) {
      return base + '^{' + unicodeSupToNum(sup) + '}';
    });
    // nested caret: a^2 / a^(2) / a^(3/4) → a^{…}
    s = s.replace(/\^(\([^()]{1,16}\)|-?[0-9a-zA-Z.]{1,8})/g, function (_, e) {
      var inner = stripParens(e);
      // fraction inside an exponent: 3/4 → \frac{3}{4}
      inner = inner.replace(/(\d+(?:\.\d+)?|[a-zA-Z])\s*\/\s*(\d+(?:\.\d+)?|[a-zA-Z])/g, '\\frac{$1}{$2}');
      return '^{' + inner + '}';
    });
    // nested sqrt
    s = s.replace(/√\s*(\([^()]*\)|[0-9a-zA-Z.]+)/g, function (_, a) { return '\\sqrt{' + stripParens(a) + '}'; });
    // nested simple fraction (only single simple operands — larger ones are
    // handled by the top-level frac pattern): 1/x inside (1/x)^4 etc.
    s = s.replace(/(^|[(\s=+\-−])(\d+(?:\.\d+)?|[a-zA-Z](?:\^\{[^{}]+\})?)\s*\/\s*(\d+(?:\.\d+)?|[a-zA-Z](?:\^\{[^{}]+\})?)(?=$|[)\s=+\-−])/g,
      function (_, pre, a, b) { return pre + '\\frac{' + a + '}{' + b + '}'; });
    // symbols
    s = s.replace(/×/g, '\\times ').replace(/÷/g, '\\div ').replace(/−/g, '-')
         .replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ').replace(/≠/g, '\\ne ')
         .replace(/≈/g, '\\approx ').replace(/π/g, '\\pi ').replace(/°/g, '^{\\circ}')
         .replace(/%/g, '\\%').replace(/\$/g, '\\$');
    return s;
  }

  // base for an exponent: keep parentheses when the base is compound,
  // otherwise KaTeX would produce y^{3}^{1/4} (double superscript error)
  function texBase(raw) {
    raw = String(raw).trim();
    if (raw[0] === '|' && raw[raw.length - 1] === '|') {
      return '\\left|' + innerTex(raw.slice(1, -1)) + '\\right|';
    }
    if (raw[0] === '(') {
      var inner = stripParens(raw);
      if (HAS_OP.test(inner)) return '\\left(' + innerTex(inner) + '\\right)';
      return innerTex(inner);
    }
    return innerTex(raw);
  }

  function texExp(raw) {
    var inner = stripParens(raw);
    inner = inner.replace(/(\d+(?:\.\d+)?|[a-zA-Z])\s*\/\s*(\d+(?:\.\d+)?|[a-zA-Z])/g, '\\frac{$1}{$2}');
    return innerTex(inner);
  }

  function toTex(match, type) {
    if (type === 'sqrt') return '\\sqrt{' + innerTex(stripParens(match[1])) + '}';
    if (type === 'frac') return '\\dfrac{' + innerTex(stripParens(match[1])) + '}{' + innerTex(stripParens(match[2])) + '}';
    if (type === 'caret') return texBase(match[1]) + '^{' + texExp(match[2]) + '}';
    if (type === 'usup') return texBase(match[1]) + '^{' + unicodeSupToNum(match[2]) + '}';
    return null;
  }

  // -------- HTML fallback (no KaTeX) --------
  function fallbackHtml(match, type) {
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function expify(s) { // a^2 / a^(3/4) / a² → a<sup>…</sup>
      return esc(s)
        .replace(/\^\(([^()]{1,16})\)/g, '<sup class="mexp">$1</sup>')
        .replace(/\^(-?[0-9a-zA-Z.]+)/g, '<sup class="mexp">$1</sup>')
        .replace(/([0-9a-zA-Z)])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (_, b, s2) { return b + '<sup class="mexp">' + unicodeSupToNum(s2) + '</sup>'; });
    }
    if (type === 'sqrt') return '<span class="msqrt"><span class="rad">√</span><span class="arg">' + expify(stripParens(match[1])) + '</span></span>';
    if (type === 'frac') return '<span class="mfrac"><span class="mnum">' + expify(stripParens(match[1])) + '</span><span class="mden">' + expify(stripParens(match[2])) + '</span></span>';
    if (type === 'caret') return expify(match[1]) + '<sup class="mexp">' + esc(stripParens(match[2])) + '</sup>';
    if (type === 'usup') return expify(match[1] + match[2]);
    return null;
  }

  // Find all pattern matches in a string → sorted, non-overlapping segments
  function findSegments(text) {
    var segs = [];
    PATTERNS.forEach(function (p, pi) {
      p.re.lastIndex = 0;
      var m;
      while ((m = p.re.exec(text)) !== null) {
        // guard: fraction where either side is a "word" like and/or
        if (p.type === 'frac' && (WORDY.test(m[1]) || WORDY.test(m[2]))) continue;
        // guard: don't treat dd/mm/yyyy-style chains
        if (p.type === 'frac') {
          var after = text.slice(m.index + m[0].length);
          if (after.charAt(0) === '/' || text.charAt(m.index - 1) === '/') continue;
        }
        segs.push({ start: m.index, end: m.index + m[0].length, match: m, type: p.type, prio: pi });
      }
    });
    // sort by start; on tie prefer earlier pattern priority, then longer match
    segs.sort(function (a, b) { return a.start - b.start || a.prio - b.prio || (b.end - b.start) - (a.end - a.start); });
    var out = [], lastEnd = -1;
    segs.forEach(function (s) { if (s.start >= lastEnd) { out.push(s); lastEnd = s.end; } });
    return out;
  }

  function renderSeg(seg) {
    var span = document.createElement('span');
    span.className = 'gre-math';
    var tex = toTex(seg.match, seg.type);
    if (window.katex && tex) {
      try {
        window.katex.render(tex, span, { throwOnError: true, output: 'html' });
        return span;
      } catch (e) { /* fall through */ }
    }
    var html = fallbackHtml(seg.match, seg.type);
    if (html) { span.innerHTML = html; return span; }
    span.textContent = seg.match[0];
    return span;
  }

  function processTextNode(node) {
    var raw = node.nodeValue;
    if (!raw || raw.length < 2) return;
    var text = normalizeSymbols(raw);
    var segs = findSegments(text);
    if (!segs.length) {
      // No expression to typeset, but the symbols may still have changed
      // ("x <= 5" → "x ≤ 5"), and that is half the point of this pass.
      if (text !== raw) node.nodeValue = text;
      return;
    }
    var frag = document.createDocumentFragment();
    var pos = 0;
    segs.forEach(function (seg) {
      if (seg.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, seg.start)));
      frag.appendChild(renderSeg(seg));
      pos = seg.end;
    });
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    node.parentNode.replaceChild(frag, node);
  }

  /** sqrt( … ) → √( … ), counting brackets so nested radicals survive.
   *  Works inside-out by scanning left to right and matching each
   *  "sqrt(" to its own closing bracket. */
  function replaceSqrtWord(s) {
    var out = '', i = 0;
    var re = /\bsqrt\s*\(/gi, m;
    while ((m = re.exec(s)) !== null) {
      var open = m.index + m[0].length - 1;   // index of the '('
      var depth = 0, close = -1;
      for (var j = open; j < s.length; j++) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') { depth--; if (depth === 0) { close = j; break; } }
      }
      if (close === -1) break;                // unbalanced — leave it alone
      out += s.slice(i, m.index) + '√(' + replaceSqrtWord(s.slice(open + 1, close)) + ')';
      i = close + 1;
      re.lastIndex = i;
    }
    return out + s.slice(i);
  }

  /* ------------------------------------------------------------
     Notation normaliser

     The bank was written over many months and is genuinely mixed:
     11,568 caret exponents against 10,771 unicode superscripts,
     4,851 "√" against 998 "sqrt(", 701 "≤" against 531 "<=". The
     same inequality therefore looked different from one question to
     the next depending on which batch wrote it.

     Rather than rewrite 8,462 questions — which risks the content
     itself — every ASCII form is folded into the unicode form the
     typesetter below already understands. One pass, at display time,
     and every surface that calls renderIn() gets identical output.
     The JSON on disk is never touched, so the practice sheets stay
     plain ASCII for WhatsApp and print, which is what they need.
     ------------------------------------------------------------ */
  function normalizeSymbols(text) {
    var s = text;

    // sqrt(…) → √(…). A plain regex cannot do this: the bank contains
    // nested radicals like sqrt(6 + sqrt(6 + √6)), where [^()] can never
    // match the outer argument. So walk to the matching bracket instead.
    s = replaceSqrtWord(s);
    s = s.replace(/\bsqrt\s*(\d+(?:\.\d+)?|[a-zA-Z])\b/gi, function (_, a) { return '√' + a; });

    // relational operators
    s = s.replace(/<=/g, '≤').replace(/>=/g, '≥')
         .replace(/!=/g, '≠').replace(/<>/g, '≠')
         .replace(/\+\/-/g, '±');

    // pi → π, both standalone and attached to a coefficient (2pi → 2π).
    // Case-sensitive: "PI" can be an abbreviation, "pi" in GRE quant is not.
    s = s.replace(/(^|[^A-Za-z0-9_])pi\b/g, function (_, pre) { return pre + 'π'; });
    s = s.replace(/(\d)\s*pi\b/g, function (_, d) { return d + 'π'; });

    /* Explicit multiplication — the one rule here that can do real damage,
       because the bank writes products as "12 x 5" while also using x as
       its commonest variable. Counted across the bank: 4,121 "digit x
       digit", 144 ") x (", 132 "digit x (" — all unambiguously products —
       against 1,337 "letter x letter", which is overwhelmingly prose such
       as "compute x from an equation". Turning that into "compute × from"
       would corrupt a sentence the student reads, so the left side must be
       a digit, a closing bracket or π, and the right side must open a new
       operand. The ~178 "pi x 3" cases are caught because pi has already
       become π by this point. A missed × costs nothing; a wrong one does. */
    s = s.replace(/(\d)\s*\*\s*(?=[\d(a-zA-Z])/g, function (_, d) { return d + ' × '; });
    s = s.replace(/([\d)π])\s+x\s+(?=[\d(√π])/g, function (_, a) { return a + ' × '; });
    // "2x2 table" — a dimension, never algebra (you would write 2x² for that)
    s = s.replace(/\b(\d)x(\d)\b/g, function (_, a, b) { return a + '×' + b; });

    return s;
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1, SVG: 1, BUTTON: 0 };

  function renderIn(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        while (p && p !== root) {
          if (p.nodeType === 1) {
            if (SKIP_TAGS[p.tagName] === 1) return NodeFilter.FILTER_REJECT;
            if (p.classList && (p.classList.contains('gre-math') || p.classList.contains('katex'))) return NodeFilter.FILTER_REJECT;
          }
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(processTextNode);
  }

  /* ------------------------------------------------------------
     Fallback styles, injected by the renderer itself.

     When KaTeX is unavailable — a slow connection, a blocked CDN, an
     offline tab — renderSeg() falls back to .mfrac/.msqrt/sup.mexp
     markup. Those rules previously lived only in gre-exam-theme.css,
     so the mocks styled them and nothing else did: on the practice
     loggers and all 111 /learn/ pages a fraction collapsed to its
     two digits run together, turning "1/3 of 90" into "13 of 90".
     That is a wrong question, not an ugly one.

     The renderer emits this markup, so the renderer ships its styles.
     Every surface that includes this file is now correct by default,
     including any added later.
     ------------------------------------------------------------ */
  function injectFallbackStyles() {
    if (!document.head || document.getElementById('gre-math-fallback')) return;
    var st = document.createElement('style');
    st.id = 'gre-math-fallback';
    st.textContent = [
      '.gre-math{white-space:normal}',
      '.mfrac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;line-height:1.15;font-size:.92em}',
      '.mfrac .mnum{padding:0 4px;border-bottom:1.2px solid currentColor}',
      '.mfrac .mden{padding:0 4px}',
      '.msqrt{display:inline-flex;align-items:stretch;vertical-align:middle}',
      '.msqrt .rad{font-size:1.1em;line-height:1;align-self:flex-end}',
      '.msqrt .arg{border-top:1.2px solid currentColor;padding:0 3px}',
      'sup.mexp{font-size:.72em;vertical-align:super;line-height:0}'
    ].join('');
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFallbackStyles);
  } else {
    injectFallbackStyles();
  }

  window.GREMath = { renderIn: renderIn, normalize: normalizeSymbols };
})();
