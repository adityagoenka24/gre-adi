/* ============================================================
   GRE CALCULATOR — ETS-style on-screen calculator
   Shared by every exam screen (mocks, sectionals, practice logger).

   Mirrors the calculator on the real GRE Quant section:
   - basic operations with correct order of operations
   - square root, +/- (sign), parentheses
   - memory keys (MR, MC, M+)
   - "Transfer Display" copies the result into a numeric-entry answer box
   - a floating window you can drag, opened/closed from the test bar

   No dependencies, injects its own CSS, uses no eval().

   Usage:
     <script src="gre-calculator.js"></script>
     <button onclick="GRECalc.toggle()">Calculator</button>
     GRECalc.close();   // call when leaving the exam screen
   ============================================================ */
(function () {
  'use strict';

  // Inputs the "Transfer Display" key may fill. First visible, enabled match wins.
  var NUMERIC_TARGETS = '#ne-input, #pq-numeric-input, input[data-gre-numeric]';
  var MAX_DIGITS = 14;

  var css = [
    '.grecalc{position:fixed;z-index:250;width:252px;background:#d9dee3;border:1px solid #6b7782;border-radius:6px;',
    'box-shadow:0 10px 36px rgba(0,0,0,.35);font-family:Arial,Helvetica,sans-serif;display:none;user-select:none;-webkit-user-select:none;touch-action:none;}',
    '.grecalc.open{display:block;}',
    '.grecalc-head{background:linear-gradient(180deg,#28455e,#1e3549);color:#fff;font-size:13px;font-weight:700;padding:8px 10px;',
    'border-radius:5px 5px 0 0;cursor:move;display:flex;align-items:center;justify-content:space-between;}',
    '.grecalc-x{background:none;border:none;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:0 4px;min-width:28px;min-height:24px;}',
    '.grecalc-x:hover{color:#ffce7a;}',
    '.grecalc-body{padding:10px;}',
    '.grecalc-screen{background:#eef3e6;border:2px inset #9aa3ab;border-radius:3px;padding:4px 8px 6px;margin-bottom:8px;text-align:right;overflow:hidden;}',
    '.grecalc-expr{font-family:"Courier New",Consolas,monospace;font-size:11px;color:#55606a;height:15px;line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:rtl;}',
    '.grecalc-expr span{direction:ltr;unicode-bidi:plaintext;}',
    '.grecalc-disp{font-family:"Courier New",Consolas,monospace;font-size:26px;font-weight:700;color:#16191d;height:34px;line-height:34px;white-space:nowrap;overflow:hidden;}',
    '.grecalc-disp.sm{font-size:19px;}',
    '.grecalc-mem{font-size:10px;font-weight:700;color:#1a5da6;height:11px;line-height:11px;text-align:left;visibility:hidden;}',
    '.grecalc-mem.on{visibility:visible;}',
    '.grecalc-xfer{width:100%;margin-bottom:6px;padding:7px;font-size:12px;font-weight:700;background:#1a5da6;color:#fff;border:1px solid #124a87;border-radius:3px;cursor:pointer;}',
    '.grecalc-xfer:hover:not(:disabled){background:#124a87;}',
    '.grecalc-xfer:disabled{background:#9db3c9;border-color:#8aa2ba;cursor:not-allowed;}',
    '.grecalc-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;}',
    '.grecalc-k{padding:0;height:38px;font-size:16px;font-weight:700;background:#f7f9fb;color:#16191d;border:1px solid #8b96a1;border-radius:3px;cursor:pointer;font-family:Arial,Helvetica,sans-serif;}',
    '.grecalc-k:hover{background:#fff;border-color:#1a5da6;}',
    '.grecalc-k:active{background:#dbe7f3;}',
    '.grecalc-k.op{background:#e3e9ef;}',
    '.grecalc-k.mem{background:#e3e9ef;font-size:13px;}',
    '.grecalc-k.clr{background:#f3d9d5;color:#8e2a1f;font-size:14px;}',
    '.grecalc-k.eq{background:#1a5da6;color:#fff;border-color:#124a87;}',
    '.grecalc-k.eq:hover{background:#124a87;}',
    '.grecalc-k:focus-visible,.grecalc-x:focus-visible,.grecalc-xfer:focus-visible{outline:3px solid #7fb2e5;outline-offset:1px;}',
    '@media(max-width:480px){.grecalc{width:236px}.grecalc-k{height:42px}}'
  ].join('');

  // ---- state ---------------------------------------------------------------
  var tokens = [];          // e.g. [3, '+', '(', 4, '×', 2, ')']  (numbers are JS numbers)
  var cur = '';             // number currently being typed, as text
  var curExact = null;      // full-precision value behind cur when it came from √ / MR (display is rounded)
  var shown = '0';          // what the display shows when cur is empty
  var shownExact = 0;       // full-precision value behind `shown`
  var memory = 0;
  var hasMemory = false;
  var justEvaluated = false;
  var replaceNext = false;  // next digit replaces a value that came from √ / MR
  var errored = false;
  var root = null, dispEl, exprEl, memEl, xferBtn, watch = null;

  function openParens() {
    var n = 0;
    for (var i = 0; i < tokens.length; i++) { if (tokens[i] === '(') n++; else if (tokens[i] === ')') n--; }
    return n;
  }
  function isOp(t) { return t === '+' || t === '-' || t === '×' || t === '÷'; }

  // ---- number formatting ---------------------------------------------------
  function fmt(n) {
    if (!isFinite(n)) return 'Error';
    if (n === 0) return '0';
    var abs = Math.abs(n);
    var s;
    if (abs >= 1e12 || abs < 1e-9) {
      s = n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e');
    } else {
      // 12 significant digits hides binary float noise (0.1+0.2 -> 0.3)
      s = String(parseFloat(n.toPrecision(12)));
      if (s.length > MAX_DIGITS + 1) s = String(parseFloat(n.toPrecision(10)));
    }
    return s;
  }

  // ---- evaluation: + - × ÷ with precedence, parentheses, no eval() ---------
  function evaluate(list) {
    var pos = 0;
    function peek() { return list[pos]; }
    function expr() {
      var v = term();
      while (peek() === '+' || peek() === '-') {
        var op = list[pos++];
        var r = term();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }
    function term() {
      var v = unary();
      while (peek() === '×' || peek() === '÷') {
        var op = list[pos++];
        var r = unary();
        if (op === '÷' && r === 0) throw new Error('div0');
        v = op === '×' ? v * r : v / r;
      }
      return v;
    }
    function unary() {
      if (peek() === '-') { pos++; return -unary(); }
      return primary();
    }
    function primary() {
      var t = list[pos++];
      if (typeof t === 'number') return t;
      if (t === '(') {
        var v = expr();
        if (list[pos] === ')') pos++;
        return v;
      }
      throw new Error('syntax');
    }
    var out = expr();
    if (pos < list.length) throw new Error('syntax');
    return out;
  }

  // ---- display -------------------------------------------------------------
  function exprText() {
    var parts = tokens.map(function (t) { return typeof t === 'number' ? fmt(t) : t; });
    if (cur !== '') parts.push(cur);
    return parts.join(' ');
  }
  function render() {
    if (!root) return;
    var text = errored ? 'Error' : (cur !== '' ? cur : shown);
    dispEl.textContent = text;
    dispEl.className = 'grecalc-disp' + (text.length > 11 ? ' sm' : '');
    exprEl.firstChild.textContent = exprText();
    memEl.className = 'grecalc-mem' + (hasMemory ? ' on' : '');
    memEl.textContent = hasMemory ? 'M' : '';
    xferBtn.disabled = !transferTarget() || errored;
  }
  function clearAll() {
    tokens = []; cur = ''; curExact = null; shown = '0'; shownExact = 0; justEvaluated = false; replaceNext = false; errored = false;
  }
  function displayValue() {
    if (errored) return NaN;
    if (cur !== '') {
      if (curExact !== null) return curExact;
      var v = parseFloat(cur);
      return isNaN(v) ? 0 : v;
    }
    return shownExact;
  }

  // ---- key handling --------------------------------------------------------
  function pushCur() {
    if (cur !== '') {
      tokens.push(curExact !== null ? curExact : parseFloat(cur));
      cur = ''; curExact = null;
    }
  }
  function press(k) {
    if (errored && k !== 'C') clearAll();
    if (/^[0-9]$/.test(k)) {
      if (justEvaluated) clearAll();
      if (replaceNext) { cur = ''; replaceNext = false; }
      curExact = null;
      if (cur === '0') cur = k;
      else if (cur.replace(/[-.]/g, '').length < MAX_DIGITS) cur += k;
    } else if (k === '.') {
      if (justEvaluated) clearAll();
      if (replaceNext) { cur = ''; replaceNext = false; }
      curExact = null;
      if (cur.indexOf('.') < 0) cur = (cur === '' || cur === '-') ? (cur + '0.') : cur + '.';
    } else if (isOp(k)) {
      replaceNext = false;
      if (cur !== '') pushCur();
      else if (!tokens.length) tokens.push(shownExact);
      var last = tokens[tokens.length - 1];
      if (isOp(last)) tokens[tokens.length - 1] = k;
      else if (last === '(' ) { /* an operator right after "(" is ignored */ }
      else tokens.push(k);
      justEvaluated = false;
    } else if (k === '(') {
      replaceNext = false;
      if (justEvaluated) clearAll();
      if (cur !== '') { pushCur(); tokens.push('×'); }
      else {
        var l = tokens[tokens.length - 1];
        if (typeof l === 'number' || l === ')') tokens.push('×');
      }
      tokens.push('(');
    } else if (k === ')') {
      replaceNext = false;
      if (openParens() > 0) {
        var l2 = tokens[tokens.length - 1];
        if (cur !== '' || typeof l2 === 'number' || l2 === ')') {
          pushCur();
          tokens.push(')');
        }
      }
    } else if (k === '±') {
      if (cur !== '') {
        cur = cur.charAt(0) === '-' ? cur.slice(1) : '-' + cur;
        if (curExact !== null) curExact = -curExact;
      } else if (!tokens.length || justEvaluated) {
        shownExact = -shownExact;
        shown = fmt(shownExact);
      }
    } else if (k === '√') {
      var v = displayValue();
      if (v < 0) { errored = true; }
      else {
        var root2 = Math.sqrt(v);
        cur = fmt(root2);
        curExact = root2;
        justEvaluated = false;
        replaceNext = true;
      }
    } else if (k === '=') {
      pushCur();
      if (!tokens.length) { render(); return; }
      var open = openParens();
      while (open-- > 0) tokens.push(')');
      while (isOp(tokens[tokens.length - 1])) tokens.pop();
      try {
        var res = evaluate(tokens);
        shown = fmt(res);
        shownExact = res;
        errored = shown === 'Error';
      } catch (e) { errored = true; }
      tokens = []; cur = ''; justEvaluated = true;
    } else if (k === 'C') {
      clearAll();
    } else if (k === '⌫') {
      if (cur !== '') { cur = cur.slice(0, -1); curExact = null; }
      if (cur === '-') cur = '';
    } else if (k === 'MR') {
      if (hasMemory) { if (justEvaluated) clearAll(); cur = fmt(memory); curExact = memory; replaceNext = true; }
    } else if (k === 'MC') {
      memory = 0; hasMemory = false;
    } else if (k === 'M+') {
      var mv = displayValue();
      if (!isNaN(mv)) { memory += mv; memory = parseFloat(memory.toPrecision(12)); hasMemory = true; }
    }
    render();
  }

  // ---- Transfer Display ----------------------------------------------------
  function transferTarget() {
    var list = document.querySelectorAll(NUMERIC_TARGETS);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.disabled && !el.readOnly && el.offsetParent !== null) return el;
    }
    return null;
  }
  function transfer() {
    var target = transferTarget();
    if (!target || errored) return;
    var v = displayValue();
    if (isNaN(v)) return;
    target.value = fmt(v);
    // fire the page's own handlers (oninput saves the answer in the mocks)
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ---- DOM -----------------------------------------------------------------
  var KEYS = [
    ['MR', 'mem'], ['MC', 'mem'], ['M+', 'mem'], ['C', 'clr'],
    ['7'], ['8'], ['9'], ['÷', 'op'],
    ['4'], ['5'], ['6'], ['×', 'op'],
    ['1'], ['2'], ['3'], ['-', 'op'],
    ['0'], ['.'], ['±', 'op'], ['+', 'op'],
    ['√', 'op'], ['(', 'op'], [')', 'op'], ['=', 'eq']
  ];

  function build() {
    if (root) return;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.className = 'grecalc';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Calculator');
    root.innerHTML =
      '<div class="grecalc-head" id="grecalc-drag"><span>Calculator</span>' +
      '<button class="grecalc-x" type="button" aria-label="Close calculator">&times;</button></div>' +
      '<div class="grecalc-body">' +
      '<div class="grecalc-screen"><div class="grecalc-mem"></div><div class="grecalc-expr"><span></span></div><div class="grecalc-disp">0</div></div>' +
      '<button class="grecalc-xfer" type="button">Transfer Display</button>' +
      '<div class="grecalc-keys"></div></div>';
    document.body.appendChild(root);

    dispEl = root.querySelector('.grecalc-disp');
    exprEl = root.querySelector('.grecalc-expr');
    memEl = root.querySelector('.grecalc-mem');
    xferBtn = root.querySelector('.grecalc-xfer');

    var keys = root.querySelector('.grecalc-keys');
    KEYS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'grecalc-k' + (k[1] ? ' ' + k[1] : '');
      b.textContent = k[0];
      b.setAttribute('data-k', k[0]);
      // keep focus where it was (e.g. the numeric answer box)
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { press(k[0]); });
      keys.appendChild(b);
    });
    xferBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    xferBtn.addEventListener('click', transfer);
    root.querySelector('.grecalc-x').addEventListener('click', close);

    // drag by the title bar
    var head = root.querySelector('.grecalc-head');
    head.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.grecalc-x')) return;
      var r = root.getBoundingClientRect();
      var dx = e.clientX - r.left, dy = e.clientY - r.top;
      function move(ev) { place(ev.clientX - dx, ev.clientY - dy); }
      function up() {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      e.preventDefault();
    });

    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', function () {
      if (!root.classList.contains('open')) return;
      var r = root.getBoundingClientRect(); place(r.left, r.top);
    });
  }

  function place(x, y) {
    var w = root.offsetWidth || 252, h = root.offsetHeight || 360;
    x = Math.max(4, Math.min(x, window.innerWidth - w - 4));
    y = Math.max(4, Math.min(y, window.innerHeight - h - 4));
    root.style.left = x + 'px';
    root.style.top = y + 'px';
  }

  var KEYMAP = {
    '+': '+', '-': '-', '*': '×', 'x': '×', 'X': '×', '/': '÷', '(': '(', ')': ')',
    '.': '.', ',': '.', '=': '=', 'Enter': '=', 'Backspace': '⌫', 'Delete': 'C', 'c': 'C', 'C': 'C'
  };
  function onKey(e) {
    if (!root || !root.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // never steal keystrokes from a text box, unless focus is inside the calculator
    var a = document.activeElement;
    var typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || (a && a.isContentEditable);
    if (typing && !root.contains(a)) return;
    // a focused calculator button handles Enter/Space itself
    if (a && root.contains(a) && a.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    var k = null;
    if (/^[0-9]$/.test(e.key)) k = e.key;
    else if (KEYMAP.hasOwnProperty(e.key)) k = KEYMAP[e.key];
    if (k === null) return;
    e.preventDefault();
    e.stopPropagation();
    press(k);
  }

  // ---- public API ----------------------------------------------------------
  function open() {
    build();
    if (!root.classList.contains('open')) {
      root.classList.add('open');
      if (!root.style.left) place(window.innerWidth - 252 - 24, 84);
    }
    render();
    setBtnState(true);
    // the question underneath changes (Next/Back): re-check whether Transfer Display has a box to fill
    if (!watch) watch = setInterval(function () { if (xferBtn) xferBtn.disabled = !transferTarget() || errored; }, 400);
  }
  function close() {
    if (!root) return;
    root.classList.remove('open');
    setBtnState(false);
    if (watch) { clearInterval(watch); watch = null; }
  }
  function toggle() {
    if (root && root.classList.contains('open')) close(); else open();
  }
  function isOpen() { return !!(root && root.classList.contains('open')); }
  function setBtnState(on) {
    var btns = document.querySelectorAll('[data-gre-calc-btn]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  window.GRECalc = { open: open, close: close, toggle: toggle, isOpen: isOpen, clear: function () { clearAll(); render(); } };
})();
