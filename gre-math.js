/* ============================================================
   GREMath — plain-text math → typeset math
   Converts the notation used across Adi's GRE question bank
   (x^2, 13², √194, 2ab/(a+b), (3+7)/5, ×, −, π, ≤ …) into
   properly typeset math. Uses KaTeX when available, with a
   pure-HTML fallback (stacked fractions, sup exponents).

   Usage:  GREMath.renderIn(element)
   Safe to call repeatedly; already-rendered nodes are skipped.
   ============================================================ */
(function () {
  'use strict';

  var SUP_MAP = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-' };

  // Operand for fractions: (…), 12, 3.5, x, 2ab, x², 4800 …
  var OPERAND = '(?:\\([^()]{1,60}\\)|\\d+(?:\\.\\d+)?[a-zA-Z]{0,3}|[a-zA-Z]{1,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]?|\\d+(?:\\.\\d+)?)';

  // Patterns that count as "math worth typesetting", tried in order.
  var PATTERNS = [
    // √(expr) or √expr   e.g. √194, √(a²+b²), √2x
    { re: new RegExp('√\\s*(\\([^()]{1,60}\\)|[0-9a-zA-Z.]{1,20}[⁰¹²³⁴⁵⁶⁷⁸⁹]?)', 'g'), type: 'sqrt' },
    // fraction: operand / operand  (both sides tight, no spaces around slash → avoids "and/or" via operand shape)
    { re: new RegExp('(' + OPERAND + ')\\s*/\\s*(' + OPERAND + ')', 'g'), type: 'frac' },
    // caret exponent: x^2, 2^(10), (a+b)^2, x^-1
    { re: /(\([^()]{1,40}\)|[0-9a-zA-Z.]{1,12})\^(\(?-?[0-9a-zA-Z.]{1,8}\)?)/g, type: 'caret' },
    // unicode superscript exponent: 13², x³, (a+b)²
    { re: /(\([^()]{1,40}\)|[0-9a-zA-Z.]{1,12})([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, type: 'usup' }
  ];

  var WORDY = /^(and|or|per|km|mph|hr|min|sec|[A-Z]{2,})$/; // guard rails

  function stripParens(s) {
    s = s.trim();
    if (s[0] === '(' && s[s.length - 1] === ')') {
      // only strip if balanced single wrap
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
    // nested caret: a^2 → a^{2}
    s = s.replace(/\^(\(?-?[0-9a-zA-Z.]+\)?)/g, function (_, e) { return '^{' + stripParens(e) + '}'; });
    // nested sqrt
    s = s.replace(/√\s*(\([^()]*\)|[0-9a-zA-Z.]+)/g, function (_, a) { return '\\sqrt{' + stripParens(a) + '}'; });
    // symbols
    s = s.replace(/×/g, '\\times ').replace(/÷/g, '\\div ').replace(/−/g, '-')
         .replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ').replace(/≠/g, '\\ne ')
         .replace(/≈/g, '\\approx ').replace(/π/g, '\\pi ').replace(/°/g, '^{\\circ}')
         .replace(/%/g, '\\%').replace(/\$/g, '\\$');
    return s;
  }

  function toTex(match, type) {
    if (type === 'sqrt') return '\\sqrt{' + innerTex(stripParens(match[1])) + '}';
    if (type === 'frac') return '\\dfrac{' + innerTex(stripParens(match[1])) + '}{' + innerTex(stripParens(match[2])) + '}';
    if (type === 'caret') return innerTex(stripParens(match[1])) + '^{' + innerTex(stripParens(match[2])) + '}';
    if (type === 'usup') return innerTex(match[1]) + '^{' + unicodeSupToNum(match[2]) + '}';
    return null;
  }

  // -------- HTML fallback (no KaTeX) --------
  function fallbackHtml(match, type) {
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function expify(s) { // a^2 / a² → a<sup>2</sup>
      return esc(s)
        .replace(/\^\((-?[0-9a-zA-Z.]+)\)/g, '<sup class="mexp">$1</sup>')
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
        // guard: don't treat "Q 1 / 27"-style or dd/mm/yyyy — require not surrounded by more slashes
        if (p.type === 'frac') {
          var after = text.slice(m.index + m[0].length);
          if (after.charAt(0) === '/' || text.charAt(m.index - 1) === '/') continue;
        }
        segs.push({ start: m.index, end: m.index + m[0].length, match: m, type: p.type, prio: pi });
      }
    });
    // sort by start, prefer earlier pattern priority & longer match on overlap
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
    var text = node.nodeValue;
    if (!text || text.length < 3) return;
    var segs = findSegments(text);
    if (!segs.length) return;
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

  window.GREMath = { renderIn: renderIn };
})();
