/* ============================================================
   GRE Quant Pro — diagnostic charts
   Phase 3.  Hand-written inline SVG. No chart library: four small
   charts do not justify 200KB on a page that must load fast on
   Indian mobile data.

   COLOUR — decided by measurement, not taste.

   Right/wrong is a series that MEANS good/bad, so it wears status
   tokens rather than categorical hues. The obvious green/red pair
   (--green #1e7e46 / --red #b3402e) was run through the palette
   validator and FAILED: ΔE 4.5 under deuteranopia, below even the
   floor of 6. Red-green is the classic colour-vision collapse and
   no amount of re-stepping fixes it at similar lightness.

   The shipped pair is the site's own navy + accent:
     #16324f (correct) / #c65d21 (wrong)
     CVD ΔE 25.9 · normal-vision ΔE 35.6 · both PASS
   Those are Adi's two signature brand colours, so the chart reads
   as part of the site rather than as a bolted-on widget, and orange
   pulls the eye to the errors — which is the point of a diagnostic.

   Shape carries identity as well as hue: correct is a filled dot,
   wrong is a hollow ring. So the chart survives greyscale printing
   and full-severity CVD.
   ============================================================ */

export const C = {
  ink: '#152a3d', ink2: '#46586a', ink3: '#7c8b99',
  line: '#e6dfd3', line2: '#d5ccbc',
  surface: '#ffffff', paper: '#faf8f4',
  correct: '#16324f',     // navy   — validated pair, see header
  wrong: '#c65d21',       // accent — validated pair, see header
  bar: '#1a5da6',         // single-series magnitude hue
  barTrack: '#e8f0f8',    // lighter step of the same hue
  gold: '#a97b12',
};

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, children = []) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) n.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) if (c) n.appendChild(c);
  return n;
};
const txt = (s, attrs = {}) => {
  const n = el('text', attrs);
  n.textContent = s;
  return n;
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ---------- shared tooltip ---------- */

let tip;
function tooltip() {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'dx-tip';
    tip.setAttribute('role', 'status');
    document.body.appendChild(tip);
  }
  return tip;
}
function showTip(html, ev) {
  const t = tooltip();
  t.innerHTML = html;
  t.style.display = 'block';
  const pad = 14;
  const r = t.getBoundingClientRect();
  let x = ev.clientX + pad, y = ev.clientY - r.height - pad;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y < 8) y = ev.clientY + pad;
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
}
export function hideTip() { if (tip) tip.style.display = 'none'; }

function hoverable(node, html) {
  const on = (e) => showTip(html, e);
  node.addEventListener('mouseenter', on);
  node.addEventListener('mousemove', on);
  node.addEventListener('mouseleave', hideTip);
  node.addEventListener('focus', (e) => {
    const b = node.getBoundingClientRect();
    showTip(html, { clientX: b.left + b.width / 2, clientY: b.top });
  });
  node.addEventListener('blur', hideTip);
  node.setAttribute('tabindex', '0');
  return node;
}

/* ============================================================
   1. Gap meter — how far from target, in questions
   A meter, not a chart: one number with a track behind it.
   ============================================================ */

export function gapMeter(analysis) {
  const { have, need, target } = analysis.gap;
  const total = analysis.overall.n;
  const W = 720, H = 92, x0 = 0, w = W;
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'dx-svg', role: 'img',
    'aria-label': `${have} of ${total} correct. About ${need} needed for a ${target}.`,
  });
  const trackY = 46, trackH = 18;
  svg.appendChild(el('rect', { x: x0, y: trackY, width: w, height: trackH, rx: 9, fill: C.barTrack }));

  const pHave = have / total, pNeed = need / total;
  svg.appendChild(el('rect', {
    x: x0, y: trackY, width: Math.max(9, w * pHave), height: trackH, rx: 9, fill: C.bar,
  }));

  // target marker — a rule plus a label above it
  const tx = x0 + w * pNeed;
  svg.appendChild(el('line', {
    x1: tx, y1: trackY - 12, x2: tx, y2: trackY + trackH + 8,
    stroke: C.wrong, 'stroke-width': 2.5, 'stroke-linecap': 'round',
  }));
  const anchor = pNeed > 0.86 ? 'end' : 'start';
  const lx = pNeed > 0.86 ? tx - 8 : tx + 8;
  svg.appendChild(txt(`${target} ≈ ${need} correct`, {
    x: lx, y: trackY - 18, 'text-anchor': anchor, class: 'dx-lbl-strong', fill: C.wrong,
  }));
  svg.appendChild(txt(`You: ${have} of ${total}`, {
    x: x0, y: trackY + trackH + 26, class: 'dx-lbl', fill: C.ink2,
  }));
  return svg;
}

/* ============================================================
   2. Area bars — accuracy per ETS content area
   Nominal categorical, so every bar takes the SAME hue. Colouring
   bars by their value would spend the identity channel re-encoding
   what bar length already shows. The weakest area leads because the
   rows are sorted, not because it is painted differently.
   ============================================================ */

export function areaBars(analysis) {
  const rows = analysis.areas;
  const rowH = 46, padT = 8, padB = 26, labelW = 132, valueW = 58;
  const W = 720, H = padT + rows.length * rowH + padB;
  const plotX = labelW, plotW = W - labelW - valueW;
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'dx-svg', role: 'img',
    'aria-label': 'Accuracy by content area, weakest first.',
  });

  // recessive gridlines at 0/25/50/75/100
  for (let p = 0; p <= 100; p += 25) {
    const x = plotX + (plotW * p) / 100;
    svg.appendChild(el('line', {
      x1: x, y1: padT, x2: x, y2: padT + rows.length * rowH,
      stroke: C.line, 'stroke-width': 1,
    }));
    svg.appendChild(txt(`${p}%`, {
      x, y: H - 8, 'text-anchor': 'middle', class: 'dx-tick', fill: C.ink3,
    }));
  }

  rows.forEach((r, i) => {
    const y = padT + i * rowH;
    const barH = 20, by = y + (rowH - barH) / 2;
    svg.appendChild(txt(r.label, { x: labelW - 14, y: by + barH - 5, 'text-anchor': 'end', class: 'dx-lbl', fill: C.ink }));
    svg.appendChild(el('rect', { x: plotX, y: by, width: plotW, height: barH, rx: 4, fill: C.paper }));
    const w = Math.max(3, (plotW * r.pct) / 100);
    const bar = el('rect', { x: plotX, y: by, width: w, height: barH, rx: 4, fill: C.bar, class: 'dx-grow' });
    bar.style.setProperty('--w', `${w}px`);
    svg.appendChild(hoverable(bar,
      `<b>${r.label}</b><br>${r.correct} of ${r.n} correct · ${r.pct}%` +
      (r.avgErrorSeconds ? `<br>errors averaged ${r.avgErrorSeconds}s${r.tempo === 'fast' ? ' — fast, so a knowledge gap' : r.tempo === 'slow' ? ' — slow, so a method problem' : ''}` : '')));
    // Value rides the bar tip. Only move it inside when there is no
    // room outside — and then it wears white so it clears contrast.
    const label = `${r.correct}/${r.n}`;
    const outside = plotX + w + 10 + label.length * 9 < W;
    svg.appendChild(txt(label, {
      x: outside ? plotX + w + 10 : plotX + w - 10,
      y: by + barH - 5,
      'text-anchor': outside ? 'start' : 'end',
      class: 'dx-lbl-strong', fill: outside ? C.ink : '#fff',
    }));
  });
  return svg;
}

/* ============================================================
   3. Timing map — the centrepiece
   x = seconds spent, y = difficulty, filled navy = correct,
   hollow orange ring = wrong. Two shaded zones name the two
   failure modes the engine separates.
   ============================================================ */

export function timingMap(analysis, opts = {}) {
  const pts = analysis.timing.points.filter((p) => p.difficulty);
  const cfg = analysis.config;
  const W = 720, H = 380;
  const m = { t: 34, r: 18, b: 46, l: 52 };
  const plotW = W - m.l - m.r, plotH = H - m.t - m.b;
  const maxS = Math.max(300, Math.ceil(Math.max(...pts.map((p) => p.seconds)) / 60) * 60);
  const sx = (s) => m.l + (plotW * Math.min(s, maxS)) / maxS;
  const sy = (d) => m.t + plotH - (plotH * (d - 0.5)) / 5;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'dx-svg', role: 'img',
    'aria-label': 'Every question plotted by time spent against difficulty, showing which were right and wrong.',
  });

  // zones — a wash, never a saturated block
  const zr = sx(cfg.RUSHED_SECONDS);
  svg.appendChild(el('rect', { x: m.l, y: m.t, width: zr - m.l, height: plotH, fill: C.wrong, opacity: 0.06 }));
  svg.appendChild(txt('Gave up too fast', { x: m.l + 8, y: m.t - 12, class: 'dx-zone', fill: C.wrong }));
  const zs = sx(cfg.SUNK_SECONDS);
  svg.appendChild(el('rect', { x: zs, y: m.t, width: m.l + plotW - zs, height: plotH, fill: C.wrong, opacity: 0.06 }));
  svg.appendChild(txt('Sunk cost', { x: zs + 8, y: m.t - 12, class: 'dx-zone', fill: C.wrong }));

  // axes — hairline, solid, recessive
  for (let d = 1; d <= 5; d++) {
    svg.appendChild(el('line', { x1: m.l, y1: sy(d), x2: m.l + plotW, y2: sy(d), stroke: C.line, 'stroke-width': 1 }));
    svg.appendChild(txt(`L${d}`, { x: m.l - 12, y: sy(d) + 4, 'text-anchor': 'end', class: 'dx-tick', fill: C.ink3 }));
  }
  for (let s = 0; s <= maxS; s += 60) {
    svg.appendChild(txt(s === 0 ? '0' : `${s / 60}m`, {
      x: sx(s), y: H - m.b + 22, 'text-anchor': 'middle', class: 'dx-tick', fill: C.ink3,
    }));
  }
  svg.appendChild(txt('time spent →', { x: m.l + plotW, y: H - 8, 'text-anchor': 'end', class: 'dx-tick', fill: C.ink3 }));
  svg.appendChild(txt('harder →', { x: 14, y: m.t + 6, class: 'dx-tick', fill: C.ink3, transform: `rotate(-90 14 ${m.t + 6})` }));

  // jitter identical coordinates so overlapping marks stay countable
  const seen = new Map();
  const marks = el('g');
  for (const p of pts) {
    const key = `${Math.round(p.seconds / 8)}:${p.difficulty}`;
    const n = seen.get(key) || 0; seen.set(key, n + 1);
    const dy = n === 0 ? 0 : (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 9;
    const cx = sx(p.seconds), cy = sy(p.difficulty) + dy;
    const right = p.verdict === 'R';
    // surface ring keeps overlapping marks legible
    const g = el('g', { class: 'dx-pt' });
    g.appendChild(el('circle', { cx, cy, r: 7, fill: 'none', stroke: C.surface, 'stroke-width': 2 }));
    g.appendChild(right
      ? el('circle', { cx, cy, r: 5, fill: C.correct })
      : el('circle', { cx, cy, r: 5, fill: C.paper, stroke: C.wrong, 'stroke-width': 2.5 }));
    const zone = p.zone === 'sunk' ? ' · sunk cost'
      : p.zone === 'rushed' ? ' · gave up fast' : '';
    marks.appendChild(hoverable(g,
      `<b>${right ? 'Correct' : 'Wrong'}</b> · ${AREA[p.area] || p.area}<br>` +
      `level ${p.difficulty} · ${mmss(p.seconds)} · section ${p.section}${zone}`));
  }
  svg.appendChild(marks);
  return svg;
}

const AREA = {
  Arithmetic: 'Arithmetic', Algebra: 'Algebra',
  Geometry: 'Geometry', DataAnalysis: 'Data Analysis',
};

/** Legend for the timing map. Two series, so a legend is mandatory —
 *  identity is never colour alone. */
export function timingLegend() {
  const d = document.createElement('div');
  d.className = 'dx-legend';
  d.innerHTML = `
    <span class="dx-key"><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="${C.correct}"/></svg>Correct</span>
    <span class="dx-key"><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="${C.paper}" stroke="${C.wrong}" stroke-width="2.5"/></svg>Wrong</span>
    <span class="dx-key-note">each dot is one question — hover for detail</span>`;
  return d;
}

/** The table view. A chart is never the only way to reach the numbers. */
export function timingTable(analysis) {
  const t = document.createElement('table');
  t.className = 'dx-table';
  t.innerHTML = `<caption class="dx-cap">Every question, as data</caption>
    <thead><tr><th>Section</th><th>Area</th><th>Type</th><th>Setting</th>
    <th>Result</th><th>Level</th><th>Time</th></tr></thead><tbody>${
      analysis.timing.points.map((p) => `<tr>
        <td>${p.section}</td><td>${AREA[p.area] || p.area}</td><td>${p.qtype}</td>
        <td>${p.setting === 'Pure' ? 'Pure math' : 'Real-life'}</td>
        <td>${p.verdict === 'R' ? 'Right' : 'Wrong'}</td>
        <td>${p.difficulty ?? '—'}</td><td>${mmss(p.seconds)}</td></tr>`).join('')
    }</tbody>`;
  return t;
}

/* ============================================================
   5. Paper grid — your 27 questions, priced
   The hero of the upgraded report: one cell per question, coloured
   by what it would cost to own it. A student sees their whole test
   in one glance and, more to the point, sees how much of the orange
   is the cheap kind.

   COLOUR — same discipline as the rest of the file. Three solid
   fills, all existing brand tokens, well separated in hue AND
   lightness: navy (correct) / gold (already yours) / accent (sunk).
   The two remaining buckets are drawn EMPTY with different strokes
   rather than given two more hues, because five solid fills would
   collapse under CVD and in greyscale print. Fill-vs-outline is a
   second, independent channel — the same trick the timing map uses
   with filled dots and hollow rings.
   ============================================================ */

export const BUCKETS = {
  correct:  { label: 'Right',                fill: C.correct, stroke: C.correct, text: '#fff' },
  careless: { label: 'Already yours',        fill: C.gold,    stroke: C.gold,    text: '#fff' },
  sunk:     { label: 'Lost to the clock',    fill: C.wrong,   stroke: C.wrong,   text: '#fff' },
  areaGap:  { label: 'Named gap',            fill: '#fff',    stroke: C.wrong,   text: C.wrong },
  other:    { label: 'Everything else',      fill: C.paper,   stroke: C.line2,   text: C.ink3 },
};

export function paperGrid(analysis) {
  const cells = analysis.ledger.cells;
  const cw = 38, gap = 6, x0 = 6;
  const blocks = [1, 2].map((s) => ({ section: s, cells: cells.filter((c) => c.section === s) }));
  const blockH = 22 + cw + 20;
  const W = 720, H = blocks.length * blockH + 6;
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'dx-svg', role: 'img',
    'aria-label': `Your ${cells.length} questions, coloured by what it would take to get each one right.`,
  });

  blocks.forEach((b, bi) => {
    const top = bi * blockH;
    svg.appendChild(txt(`Section ${b.section}`, {
      x: x0, y: top + 14, class: 'dx-tick', fill: C.ink3,
    }));
    b.cells.forEach((c, i) => {
      const st = BUCKETS[c.bucket] || BUCKETS.other;
      const x = x0 + i * (cw + gap), y = top + 22;
      const g = el('g');
      g.appendChild(el('rect', {
        x, y, width: cw, height: cw, rx: 7,
        fill: st.fill, stroke: st.stroke, 'stroke-width': 1.6,
      }));
      // The difficulty level rides inside the cell: it is the single
      // most useful thing to know about a question at a glance.
      if (c.difficulty) {
        g.appendChild(txt(String(c.difficulty), {
          x: x + cw / 2, y: y + cw / 2 + 5, 'text-anchor': 'middle',
          class: 'dx-lbl-strong', fill: st.text,
        }));
      }
      const t = `${Math.floor(c.seconds / 60)}:${String(c.seconds % 60).padStart(2, '0')}`;
      svg.appendChild(hoverable(g,
        `<b>${st.label}</b><br>${c.area} · level ${c.difficulty || '?'} · ${t}<br>` +
        (c.bucket === 'careless' ? 'Wrong in under a minute, at a level you hold. This one is already yours.'
         : c.bucket === 'sunk' ? 'Over two minutes and still wrong — the clock, not the concept.'
         : c.bucket === 'areaGap' ? 'In your weakest area. The plan works on these first.'
         : c.bucket === 'correct' ? 'Correct.' : 'Wrong, with no single pattern behind it.')));
    });
  });
  return svg;
}

/** Legend for the paper grid — HTML, not SVG, so it wraps on a phone. */
export function paperLegend(analysis) {
  const c = analysis.ledger.counts;
  const wrap = document.createElement('div');
  wrap.className = 'dx-legend';
  wrap.innerHTML = Object.entries(BUCKETS)
    .filter(([k]) => (c[k] || 0) > 0)
    .map(([k, s]) => `<span class="dx-key"><i style="background:${s.fill};border-color:${s.stroke}"></i>${s.label} · <b>${c[k]}</b></span>`)
    .join('');
  return wrap;
}

/* ============================================================
   6. Difficulty ladder — where the wall actually is
   The chart every student wants and almost no prep tool draws:
   accuracy at each of ETS's five levels, with the highest level
   they hold reliably marked. Levels with too small a sample are
   drawn recessive rather than hidden, so the thin evidence is
   visible as thin rather than silently dropped.
   ============================================================ */

export function difficultyLadder(analysis) {
  const rows = [...analysis.difficulty.levels].reverse();   // hardest at the top
  const proven = analysis.ledger.provenLevel;
  const rowH = 44, padT = 8, padB = 26, labelW = 92, valueW = 58;
  const W = 720, H = padT + rows.length * rowH + padB;
  const plotX = labelW, plotW = W - labelW - valueW;
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'dx-svg', role: 'img',
    'aria-label': 'Accuracy at each difficulty level, hardest first.',
  });

  for (let p = 0; p <= 100; p += 25) {
    const x = plotX + (plotW * p) / 100;
    svg.appendChild(el('line', {
      x1: x, y1: padT, x2: x, y2: padT + rows.length * rowH, stroke: C.line, 'stroke-width': 1,
    }));
    svg.appendChild(txt(`${p}%`, { x, y: H - 8, 'text-anchor': 'middle', class: 'dx-tick', fill: C.ink3 }));
  }

  rows.forEach((r, i) => {
    const y = padT + i * rowH, barH = 20, by = y + (rowH - barH) / 2;
    const thin = r.n < 2;
    const held = !thin && r.pct >= analysis.config.CEILING_PCT;
    svg.appendChild(txt(`Level ${r.level}`, {
      x: labelW - 14, y: by + barH - 5, 'text-anchor': 'end',
      class: r.level === proven ? 'dx-lbl-strong' : 'dx-lbl', fill: r.level === proven ? C.ink : C.ink2,
    }));
    svg.appendChild(el('rect', { x: plotX, y: by, width: plotW, height: barH, rx: 4, fill: C.paper }));
    const w = Math.max(3, (plotW * r.pct) / 100);
    // A level with one question behind it is unknown, not failed. Painting
    // it in the "wrong" hue would show a 1-for-1 level as a weakness.
    const bar = el('rect', {
      x: plotX, y: by, width: w, height: barH, rx: 4,
      fill: thin ? C.line2 : (held ? C.correct : C.wrong),
      opacity: thin ? 0.55 : 1, class: 'dx-grow',
    });
    bar.style.setProperty('--w', `${w}px`);
    svg.appendChild(hoverable(bar,
      `<b>Level ${r.level}</b><br>${r.correct} of ${r.n} correct · ${r.pct}%` +
      (thin ? '<br>only one question at this level — too thin to read'
            : held ? '<br>you hold this level' : '<br>below the reliable line')));
    const label = `${r.correct}/${r.n}`;
    const outside = plotX + w + 10 + label.length * 9 < W;
    svg.appendChild(txt(label, {
      x: outside ? plotX + w + 10 : plotX + w - 10, y: by + barH - 5,
      'text-anchor': outside ? 'start' : 'end',
      class: 'dx-lbl-strong', fill: outside ? C.ink : '#fff',
    }));
  });

  // The reliable line, drawn once and labelled — it is the rule the
  // whole "proven level" claim rests on, so the student can see it.
  const cx = plotX + (plotW * analysis.config.CEILING_PCT) / 100;
  svg.appendChild(el('line', {
    x1: cx, y1: padT, x2: cx, y2: padT + rows.length * rowH,
    stroke: C.ink3, 'stroke-width': 1.5, 'stroke-dasharray': '4 4',
  }));
  return svg;
}

/* ============================================================
   7. Type bars — accuracy by question format
   Quantitative Comparison is about a third of the section and is a
   different skill from the algebra underneath it. A student who is
   fine on multiple choice and lost on QC cannot see that anywhere
   in the ETS report; it falls straight out of this one.
   The dashed rule is their own overall accuracy, so each bar reads
   as better or worse than their own average, not against a stranger.
   ============================================================ */

export function typeBars(analysis) {
  const rows = [...analysis.types].sort((a, b) => a.pct - b.pct);
  const overall = analysis.overall.pct;
  const rowH = 46, padT = 8, padB = 30, labelW = 178, valueW = 58;
  const W = 720, H = padT + rows.length * rowH + padB;
  const plotX = labelW, plotW = W - labelW - valueW;
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'dx-svg', role: 'img',
    'aria-label': 'Accuracy by question format, weakest first.',
  });

  for (let p = 0; p <= 100; p += 25) {
    const x = plotX + (plotW * p) / 100;
    svg.appendChild(el('line', { x1: x, y1: padT, x2: x, y2: padT + rows.length * rowH, stroke: C.line, 'stroke-width': 1 }));
    svg.appendChild(txt(`${p}%`, { x, y: H - 14, 'text-anchor': 'middle', class: 'dx-tick', fill: C.ink3 }));
  }

  rows.forEach((r, i) => {
    const y = padT + i * rowH, barH = 20, by = y + (rowH - barH) / 2;
    svg.appendChild(txt(r.label, { x: labelW - 14, y: by + barH - 5, 'text-anchor': 'end', class: 'dx-lbl', fill: C.ink }));
    svg.appendChild(el('rect', { x: plotX, y: by, width: plotW, height: barH, rx: 4, fill: C.paper }));
    const w = Math.max(3, (plotW * r.pct) / 100);
    // Only a MATERIAL shortfall is painted as one: a bar two points under
    // the student's own average is noise, and colouring it as a problem
    // would contradict the sentence above the chart.
    const bar = el('rect', {
      x: plotX, y: by, width: w, height: barH, rx: 4,
      fill: (!r.thin && r.pct < overall - analysis.config.TYPE_MATERIAL_GAP) ? C.wrong : C.bar,
      opacity: r.thin ? 0.4 : 1, class: 'dx-grow',
    });
    bar.style.setProperty('--w', `${w}px`);
    svg.appendChild(hoverable(bar,
      `<b>${r.label}</b><br>${r.correct} of ${r.n} correct · ${r.pct}%` +
      (r.avgSeconds ? `<br>averaging ${r.avgSeconds}s each` : '') +
      (r.thin ? '<br>too few to read as a weakness' : '')));
    const label = `${r.correct}/${r.n}`;
    const outside = plotX + w + 10 + label.length * 9 < W;
    svg.appendChild(txt(label, {
      x: outside ? plotX + w + 10 : plotX + w - 10, y: by + barH - 5,
      'text-anchor': outside ? 'start' : 'end', class: 'dx-lbl-strong', fill: outside ? C.ink : '#fff',
    }));
  });

  const ox = plotX + (plotW * overall) / 100;
  svg.appendChild(el('line', {
    x1: ox, y1: padT, x2: ox, y2: padT + rows.length * rowH,
    stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '4 4',
  }));
  svg.appendChild(txt(`your overall ${overall}%`, {
    x: ox, y: H - 1, 'text-anchor': 'middle', class: 'dx-tick', fill: C.ink,
  }));
  return svg;
}
