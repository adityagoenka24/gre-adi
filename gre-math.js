/* ============================================================
   GREMath — plain-text math → typeset math
   Converts the notation used across the GRE Quant Pro question bank
   (x^2, 13², √194, 2ab/(a+b), y^(3/4), 1/x^4, (y^3)^(1/4) …)
   into properly typeset math. Uses KaTeX when available, with a
   pure-HTML fallback (stacked fractions, sup exponents).

   Usage:  GREMath.renderIn(element)
   Safe to call repeatedly; already-rendered nodes are skipped.
   ============================================================ */
(function () {
  'use strict';

  var SUP_MAP = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-' };
  var SUB_MAP = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };

  /* Balanced parenthesised group, up to 3 levels deep.
     A plain `\([^()]{1,N}\)` (the shape every one of these patterns used
     to use) breaks the moment its content contains its own parens — which
     normalizeSymbols() now produces routinely: "sqrt(5)" becomes "√(5)",
     so what used to be "(sqrt(5) - sqrt(3))^2" — content with no parens —
     is now "(√(5) - √(3))^2", where the exponent's base has one. Same for
     naturally-authored forms like "(9^n)^(1/(2n))". Three levels covers
     every case seen in the bank while staying a bounded, non-backtracking
     pattern (each level is itself bounded, so there's no blow-up risk). */
  var PGROUP1 = '\\([^()]{0,40}\\)';
  var PGROUP2 = '\\((?:[^()]|' + PGROUP1 + '){0,80}\\)';
  var PGROUP = '\\((?:[^()]|' + PGROUP2 + '){0,120}\\)';

  // exponent chunk: ^2, ^-2, ^(10), ^(3/4), ^(-1/2), ^(n+1), ^(1/(2n))
  var EXP = '\\^(?:' + PGROUP + '|-?[0-9a-zA-Z.]{1,8})';
  /* A coefficient written against a bracket — the "3" of "3(x + 2)", the "π"
     of "π(3r)²" — multiplies that bracket and belongs to the same operand.
     Left out of the pattern it stayed behind as page text while the bracket
     beside it was typeset, so the coefficient sat at a different size and
     baseline from the term it belongs to and read as though it had drifted
     away from it. This is the shape behind most of what looked like a stray
     π: "π(4√2)²", "π(s/2)²", "2π(3r) / (2πr)". */
  var COEF = '(?:\\d+(?:\\.\\d+)?|π)?';
  // Operand for fractions — order matters: exponentiated forms first so
  // "x^4" isn't consumed as just "x".
  var OPERAND = '(?:' + [
    COEF + PGROUP + '(?:' + EXP + ')?',                   // (…), 3(…), π(…)^k
    '\\d+(?:\\.\\d+)?[a-zA-Zπ]{0,3}(?:' + EXP + ')?',     // 12, 3.5, 2ab, 2π, 2x^3
    '[a-zA-Zπ]{1,3}(?:' + EXP + '|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?'        // x, ab, π, πr, x^4, x²
  ].join('|') + ')';

  // Patterns that count as "math worth typesetting", tried in order.
  var PATTERNS = [
    // ∛(expr) or ∛expr — cube root. KaTeX has no glyph and no metrics for the
    // "∛" character itself, so passing it through produces a radical with no
    // bar over its argument; it has to become \sqrt[3]{…}. Listed before the
    // square root so "∛" is never read as a bare "√".
    { re: new RegExp('∛\\s*(' + PGROUP + '|[0-9a-zA-Zπ.]{1,20}[⁰¹²³⁴⁵⁶⁷⁸⁹]?)', 'g'), type: 'cbrt' },
    // √(expr) or √expr   e.g. √194, √(a²+b²), √2x, √π, √(6 + √6)
    { re: new RegExp('√\\s*(' + PGROUP + '|[0-9a-zA-Zπ.]{1,20}[⁰¹²³⁴⁵⁶⁷⁸⁹]?)', 'g'), type: 'sqrt' },
    // fraction: operand / operand
    { re: new RegExp('(' + OPERAND + ')\\s*/\\s*(' + OPERAND + ')', 'g'), type: 'frac' },
    // caret exponent: x^2, 2^(10), (a+b)^2, y^(3/4), (y^3)^(1/4), (9^n)^(1/(2n))
    { re: new RegExp('(' + COEF + PGROUP + '|\\|[^|]{1,20}\\||[0-9a-zA-Zπ.]{1,12})\\^(' + PGROUP + '|-?[0-9a-zA-Z.]{1,8})', 'g'), type: 'caret' },
    // unicode superscript exponent: 13², x³, πr², (a+b)²
    { re: new RegExp('(' + COEF + PGROUP + '|[0-9a-zA-Zπ.]{1,12}[₀₁₂₃₄₅₆₇₈₉]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)', 'g'), type: 'usup' },
    /* A bare π, with any numeric coefficient. π is not an operand of any
       pattern above on its own, so it used to be the one symbol left behind:
       in "πr²" the "r²" was typeset by KaTeX and the π stayed in the page's
       serif at the page's size, half a line off the baseline beside it, and
       in "10π / 2π" nothing was typeset at all while the expression next to
       it was. Typesetting π itself puts the whole run in one font. Last in
       the list, so any larger expression containing π still wins the overlap. */
    { re: new RegExp('(\\d+(?:\\.\\d+)?)?π(' + PGROUP + '|[a-zA-Z]{1,3})?', 'g'), type: 'pi' }
  ];

  var WORDY = /^(and|or|per|km|mph|hr|min|sec|[A-Z]{2,})$/; // guard rails
  /* A base keeps its brackets unless it is a single atom. The old test asked
     whether the base contained an operator, which answered "no" for "(ab)^2"
     and for "(2³)^2": the first then rendered as ab², a different quantity,
     and the second reached KaTeX as 2^{3}^{2} — a double superscript, which
     KaTeX refuses outright, dropping the expression to the plain-HTML
     fallback mid-sentence. */
  var SINGLE_ATOM = /^(?:\d+(?:\.\d+)?|[a-zA-Zπ])$/;

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

  /* Subscripted variables (r₁, r₂) appeared in no character class, so an
     expression containing one typeset around it and left the subscript — and
     whatever sat beside it — as page text. 59 questions use them. */
  function unicodeSubs(s) {
    return s.replace(/([0-9a-zA-Zπ)])([₀₁₂₃₄₅₆₇₈₉]+)/g, function (_, base, sub) {
      return base + '_{' + sub.split('').map(function (c) { return SUB_MAP[c] || c; }).join('') + '}';
    });
  }

  // Radical signs, innermost included, converted to \sqrt / \sqrt[3].
  function radicals(str) {
    return str.replace(new RegExp('(∛|√)\\s*(' + PGROUP + '|[0-9a-zA-Zπ.]+)', 'g'), function (_, sign, a) {
      return (sign === '∛' ? '\\sqrt[3]{' : '\\sqrt{') + radicals(stripParens(a)) + '}';
    });
  }

  // Convert an inner expression (already known to be math) to LaTeX-ish
  function innerTex(s) {
    s = unicodeSubs(String(s));
    // nested unicode superscripts inside operands: a² → a^{2}
    s = s.replace(/([0-9a-zA-Z)])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (_, base, sup) {
      return base + '^{' + unicodeSupToNum(sup) + '}';
    });
    // nested caret: a^2 / a^(2) / a^(3/4) / a^(1/(2n)) → a^{…}
    s = s.replace(new RegExp('\\^(' + PGROUP + '|-?[0-9a-zA-Z.]{1,8})', 'g'), function (_, e) {
      var inner = stripParens(e);
      // fraction inside an exponent: 3/4 → \frac{3}{4}
      inner = inner.replace(/(\d+(?:\.\d+)?|[a-zA-Z])\s*\/\s*(\d+(?:\.\d+)?|[a-zA-Z])/g, '\\frac{$1}{$2}');
      return '^{' + inner + '}';
    });
    /* nested radicals. "\\([^()]*\\)" can never match an argument that holds
       its own bracket, so "√(x × √(x))" left the outer √ in place as a raw
       unicode character — which KaTeX has no glyph for, so the radical sign
       silently disappeared. Match a balanced group instead, and recurse into
       the argument so radicals nested any depth are all converted. */
    s = radicals(s);
    // nested simple fraction (only single simple operands — larger ones are
    // handled by the top-level frac pattern): 1/x inside (1/x)^4 etc.
    s = s.replace(/(^|[(\s=+\-−])(\d+(?:\.\d+)?|[a-zA-Z](?:\^\{[^{}]+\})?)\s*\/\s*(\d+(?:\.\d+)?|[a-zA-Z](?:\^\{[^{}]+\})?)(?=$|[)\s=+\-−])/g,
      function (_, pre, a, b) { return pre + '\\frac{' + a + '}{' + b + '}'; });
    // symbols
    s = s.replace(/×/g, '\\times ').replace(/\*/g, '\\times ').replace(/÷/g, '\\div ').replace(/−/g, '-')
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
      if (!SINGLE_ATOM.test(inner)) return '\\left(' + innerTex(inner) + '\\right)';
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
    if (type === 'cbrt') return '\\sqrt[3]{' + innerTex(stripParens(match[1])) + '}';
    // the trailing space matters: "2\\pi" + "r" would be the control sequence
    // \\pir, not 2πr.
    if (type === 'pi') return (match[1] || '') + '\\pi ' + (match[2] ? innerTex(match[2]) : '');
    if (type === 'sqrt') return '\\sqrt{' + innerTex(stripParens(match[1])) + '}';
    if (type === 'frac') return '\\dfrac{' + innerTex(stripParens(match[1])) + '}{' + innerTex(stripParens(match[2])) + '}';
    if (type === 'caret') return texBase(match[1]) + '^{' + texExp(match[2]) + '}';
    if (type === 'usup') return texBase(match[1]) + '^{' + unicodeSupToNum(match[2]) + '}';
    return null;
  }

  // -------- HTML fallback (no KaTeX) --------
  function fallbackHtml(match, type) {
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function expify(s) { // a^2 / a^(3/4) / a^(1/(2n)) / a² → a<sup>…</sup>
      return esc(s)
        .replace(new RegExp('\\^\\(((?:[^()]|' + PGROUP1 + '){0,80})\\)', 'g'), '<sup class="mexp">$1</sup>')
        .replace(/\^(-?[0-9a-zA-Z.]+)/g, '<sup class="mexp">$1</sup>')
        .replace(/([0-9a-zA-Z)])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (_, b, s2) { return b + '<sup class="mexp">' + unicodeSupToNum(s2) + '</sup>'; });
    }
    if (type === 'cbrt') return '<span class="msqrt"><span class="rad">&#8731;</span><span class="arg">' + expify(stripParens(match[1])) + '</span></span>';
    if (type === 'pi') return esc((match[1] || '') + 'π' + (match[2] || ''));
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
        /* guard: a fraction may not begin or end part-way through a word or a
           number. Every operand class is bounded — [a-zA-Z]{1,3}, \d+ — and the
           pattern is unanchored, so it was free to take the tail of one word
           and the head of the next. "Profit/Unit" came out as "Pro", a stacked
           fraction of "fit" over "Uni", then "t"; "salt/solution" as "s", a
           fraction of "alt" over "sol", then "ution". Worse on numbers: in
           "$4,000 / 20 = $200" the thousands separator stopped the operand, so
           the student was shown "$4," followed by a fraction of 000 over 20 —
           a different number from the one the question is about.

           WORDY above was meant to catch this but compares whole operands
           against a short list, and the operand here is only ever the last
           three letters of a word, which never equals "per" or "km".

           The test fires only when the match starts or ends with the same kind
           of character as the one sitting next to it, so a bracketed operand
           after a letter — "f(x)/2", real notation — still typesets. */
        if (p.type === 'frac') {
          var prev = text.charAt(m.index - 1), next = text.charAt(m.index + m[0].length);
          if (/[A-Za-z]/.test(prev) && /^[A-Za-z]/.test(m[0])) continue;
          if (/[0-9,]/.test(prev) && /^[0-9]/.test(m[0])) continue;
          if (/[A-Za-z]/.test(next) && /[A-Za-z]$/.test(m[0])) continue;
          if (/[0-9]/.test(next) && /[0-9]$/.test(m[0])) continue;
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

    /* En dash standing in for a minus sign. KaTeX has no glyph and no metrics
       for U+2013, so wherever one reached the typesetter the subtraction sign
       came out in a fallback font at the wrong length and with none of the
       spacing an operator gets — which is what a reader reports as a sign
       being missing or in the wrong place.

       The bank uses the character both ways: "n² – n" and "–4" are minus,
       but "Groups 1–3" and "$30K–$60K" are ranges. The two senses are told
       apart by spacing — a range is always set tight — so only a spaced dash
       and a leading sign are converted. Em dashes are prose in this bank
       ("Step 1 — sort first", 10,414 of them) and are never touched. */
    s = s.replace(/(\s)–(\s)/g, '$1-$2');
    s = s.replace(/(^|[\s(=+\-×÷,:])–(?=[0-9a-zA-Zπ(])/g, '$1-');
    // and between two standalone variables, "a–b", which is subtraction.
    // "$30K–$60K" and "1–3" are untouched: neither side stands alone there.
    s = s.replace(/(^|[^A-Za-z0-9])([a-zA-Z])–([a-zA-Z])(?![A-Za-z0-9])/g, '$1$2-$3');

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
    // π counts on both sides here: "2*pi*(r + w)" has already become
    // "2*π*(r + w)" by this point, and without π in the classes the second
    // asterisk stayed an asterisk next to a typeset π.
    s = s.replace(/([\d)π])\s*\*\s*(?=[\d(a-zA-Zπ√])/g, function (_, d) { return d + ' × '; });
    s = s.replace(/([\d)π])\s+x\s+(?=[\d(√π])/g, function (_, a) { return a + ' × '; });
    // "2x2 table" — a dimension, never algebra (you would write 2x² for that)
    s = s.replace(/\b(\d)x(\d)\b/g, function (_, a, b) { return a + '×' + b; });

    return s;
  }

  /* Subtrees the typesetter must not enter. Looked up in upper case on
     purpose: HTML elements report an upper-case tagName, but SVG elements
     keep their own case and report "svg", so SKIP_TAGS.SVG never matched and
     the walker went straight into the geometry figures. There it replaced
     each label's text node with the HTML <span> markup KaTeX emits — and an
     HTML span inside an SVG has no rendering at all, so the label was not
     mis-drawn, it measured zero pixels wide and vanished. Any figure label
     holding a radical, an exponent or a fraction disappeared from the
     diagram, which for a geometry question removes the given. */
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1, SVG: 1, BUTTON: 0 };

  function renderIn(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        while (p && p !== root) {
          if (p.nodeType === 1) {
            if (SKIP_TAGS[String(p.tagName).toUpperCase()] === 1) return NodeFilter.FILTER_REJECT;
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
