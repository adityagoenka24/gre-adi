/* ============================================================
   GREExhibit — the charts and tables a question hangs off.

   WHY

     The bank has 460 questions with a `chart` and 216 with a
     `table_data`, nearly all of them Data Interpretation. The practice
     logger renders those; the mocks and sectionals never did, so every
     DI question was unusable there — which is why the mocks had no DI
     set at all, where the real GRE has one in Section 1.

     Rather than pull Chart.js onto five more pages, this draws static
     SVG. It needs no network, it prints, it survives being dropped
     into the question review, the PDF report and the coach view, and
     a flat SVG with gridlines and value labels is closer to an ETS
     exhibit than an animated canvas is.

   WHAT IT DRAWS

     chart        { type: 'bar' | 'line' | 'pie', title?, labels: [],
                    datasets: [{ label, data: [] }] }
     table_data   { headers: [], rows: [[]] }
     svg          a raw SVG string, passed through
     figure_description  text, for a figure described rather than drawn

     A question may carry more than one (29 of the imported KMF items
     have a chart and a table). They stack, in that order.

   READING OFF THE EXHIBIT

     Some DI questions need an exact value, not an impression, so bars
     and points are labelled and the axis is gridded. Where a chart is
     meant to be read approximately that does no harm; where it is
     meant to be read exactly it is the difference between a fair
     question and a guess.

   USE

     <script src="gre-exhibit.js"></script>   (../gre-exhibit.js from
                                               pro/ or events/)
       container.innerHTML = GREExhibit.html(question) + questionHtml;

     Guard with `if (window.GREExhibit)`. html() returns '' for a
     question with nothing to draw and never throws: a chart that
     cannot be drawn must not take the question down with it.
   ============================================================ */
(function () {
  'use strict';

  var INK = '#16191d', MUTE = '#5a6672', LINE = '#c9d2da', SOFT = '#e2e8ee';
  /* Distinguishable in grey-scale and to the common colour deficiencies,
     because a DI question can turn on telling two series apart. */
  var SERIES = ['#1a5da6', '#b06000', '#1e7e46', '#7b4397', '#2a7f93', '#a33b3b'];
  var FONT = 'Arial, Helvetica, sans-serif';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function num(v) { var n = Number(v); return Number.isFinite(n) ? n : 0; }

  /* Axis ticks a person would actually choose: 1, 2, 2.5 or 5 times a
     power of ten, about five of them across the range. */
  function niceStep(span, want) {
    if (!(span > 0)) return 1;
    var raw = span / (want || 5);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  function axis(min, max) {
    // Bars are read against zero; a line chart of a narrow range is not.
    var lo = Math.min(0, min), hi = Math.max(0, max);
    if (lo === hi) hi = lo + 1;
    var step = niceStep(hi - lo, 5);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    var ticks = [];
    for (var v = lo; v <= hi + step / 1000; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    return { lo: lo, hi: hi, ticks: ticks };
  }
  function fmt(v) {
    var n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    if (Math.abs(n) >= 1000) return n.toLocaleString('en-US');
    return String(Math.round(n * 100) / 100);
  }

  function datasetsOf(chart) {
    var ds = Array.isArray(chart.datasets) ? chart.datasets : [];
    return ds.filter(function (d) { return d && Array.isArray(d.data); });
  }

  function legend(ds) {
    if (ds.length < 2) return '';
    return '<div class="gex-legend">' + ds.map(function (d, i) {
      return '<span class="gex-key"><i style="background:' + SERIES[i % SERIES.length] + '"></i>' +
        esc(d.label || ('Series ' + (i + 1))) + '</span>';
    }).join('') + '</div>';
  }

  /* Category labels are the thing most likely to collide. Past a handful
     they tilt rather than overlap or disappear. */
  function catLabels(labels, x0, bandW, yBase, tilt) {
    return labels.map(function (l, i) {
      var cx = x0 + bandW * (i + 0.5);
      return tilt
        ? '<text x="' + cx + '" y="' + (yBase + 14) + '" transform="rotate(-38 ' + cx + ' ' + (yBase + 14) + ')" ' +
          'text-anchor="end" font-size="11" fill="' + MUTE + '">' + esc(l) + '</text>'
        : '<text x="' + cx + '" y="' + (yBase + 16) + '" text-anchor="middle" font-size="11.5" fill="' + MUTE + '">' + esc(l) + '</text>';
    }).join('');
  }

  function frame(w, h, title, inner, desc) {
    return '<figure class="gex-fig">' +
      (title ? '<figcaption class="gex-title">' + esc(title) + '</figcaption>' : '') +
      '<svg class="gex-svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%" preserveAspectRatio="xMidYMid meet" ' +
      'role="img" aria-label="' + esc(desc || title || 'Chart') + '" font-family="' + FONT + '">' + inner + '</svg>' +
      '</figure>';
  }

  function gridAndAxes(x0, y0, plotW, plotH, ax) {
    var out = '';
    ax.ticks.forEach(function (t) {
      var y = y0 + plotH - ((t - ax.lo) / (ax.hi - ax.lo)) * plotH;
      out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + plotW) + '" y2="' + y + '" ' +
        'stroke="' + (t === 0 ? LINE : SOFT) + '" stroke-width="1"/>' +
        '<text x="' + (x0 - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="' + MUTE + '">' + esc(fmt(t)) + '</text>';
    });
    out += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + (y0 + plotH) + '" stroke="' + LINE + '" stroke-width="1"/>';
    return out;
  }

  function barChart(chart) {
    var labels = (chart.labels || []).map(String);
    var ds = datasetsOf(chart);
    if (!labels.length || !ds.length) return '';
    var all = [];
    ds.forEach(function (d) { labels.forEach(function (_, i) { all.push(num(d.data[i])); }); });
    var ax = axis(Math.min.apply(null, all), Math.max.apply(null, all));

    var tilt = labels.length > 7 || labels.some(function (l) { return l.length > 9; });
    var W = 680, padL = 58, padR = 16, padT = 14, padB = tilt ? 72 : 42;
    var H = 300 + (tilt ? 26 : 0);
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var bandW = plotW / labels.length;
    var groupW = bandW * 0.68, barW = groupW / ds.length;
    var zeroY = padT + plotH - ((0 - ax.lo) / (ax.hi - ax.lo)) * plotH;

    var body = gridAndAxes(padL, padT, plotW, plotH, ax);
    ds.forEach(function (d, si) {
      labels.forEach(function (_, i) {
        var v = num(d.data[i]);
        var y = padT + plotH - ((v - ax.lo) / (ax.hi - ax.lo)) * plotH;
        var x = padL + bandW * i + (bandW - groupW) / 2 + barW * si;
        var top = Math.min(y, zeroY), hgt = Math.max(Math.abs(zeroY - y), 1);
        body += '<rect x="' + x + '" y="' + top + '" width="' + Math.max(barW - 2, 2) + '" height="' + hgt + '" ' +
          'fill="' + SERIES[si % SERIES.length] + '"/>';
        // The exact value, because some questions need reading not estimating.
        if (bandW / ds.length > 26) {
          body += '<text x="' + (x + Math.max(barW - 2, 2) / 2) + '" y="' + (top - 4) + '" text-anchor="middle" ' +
            'font-size="10.5" fill="' + INK + '">' + esc(fmt(v)) + '</text>';
        }
      });
    });
    body += catLabels(labels, padL, bandW, padT + plotH, tilt);
    return frame(W, H, chart.title, body, (chart.title || 'Bar chart') + ': ' +
      labels.map(function (l, i) { return l + ' ' + fmt(num(ds[0].data[i])); }).join(', ')) + legend(ds);
  }

  function lineChart(chart) {
    var labels = (chart.labels || []).map(String);
    var ds = datasetsOf(chart);
    if (!labels.length || !ds.length) return '';
    var all = [];
    ds.forEach(function (d) { labels.forEach(function (_, i) { all.push(num(d.data[i])); }); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    // A line chart is about change, so it does not have to start at zero —
    // but it must not look like it does. Pad instead of stretching.
    var pad = (hi - lo) * 0.12 || 1;
    var ax = axis(lo - pad > 0 ? lo - pad : Math.min(0, lo), hi + pad);

    var tilt = labels.length > 8 || labels.some(function (l) { return l.length > 9; });
    var W = 680, padL = 58, padR = 16, padT = 14, padB = tilt ? 72 : 42;
    var H = 300 + (tilt ? 26 : 0);
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var bandW = plotW / labels.length;
    var at = function (i, v) {
      return [padL + bandW * (i + 0.5), padT + plotH - ((v - ax.lo) / (ax.hi - ax.lo)) * plotH];
    };

    var body = gridAndAxes(padL, padT, plotW, plotH, ax);
    ds.forEach(function (d, si) {
      var col = SERIES[si % SERIES.length];
      var pts = labels.map(function (_, i) { return at(i, num(d.data[i])); });
      body += '<polyline fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round" points="' +
        pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/>';
      pts.forEach(function (p, i) {
        body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.4" fill="#fff" stroke="' + col + '" stroke-width="2"/>';
        if (ds.length === 1 && bandW > 34) {
          body += '<text x="' + p[0] + '" y="' + (p[1] - 10) + '" text-anchor="middle" font-size="10.5" fill="' + INK + '">' +
            esc(fmt(num(d.data[i]))) + '</text>';
        }
      });
    });
    body += catLabels(labels, padL, bandW, padT + plotH, tilt);
    return frame(W, H, chart.title, body, (chart.title || 'Line chart') + ': ' +
      labels.map(function (l, i) { return l + ' ' + fmt(num(ds[0].data[i])); }).join(', ')) + legend(ds);
  }

  function pieChart(chart) {
    var labels = (chart.labels || []).map(String);
    var ds = datasetsOf(chart);
    if (!labels.length || !ds.length) return '';
    var data = labels.map(function (_, i) { return Math.max(num(ds[0].data[i]), 0); });
    var total = data.reduce(function (a, b) { return a + b; }, 0);
    if (!total) return '';

    var W = 680, H = 300, cx = 170, cy = 150, r = 118;
    var body = '', a0 = -Math.PI / 2;
    data.forEach(function (v, i) {
      var sweep = (v / total) * Math.PI * 2, a1 = a0 + sweep;
      var col = SERIES[i % SERIES.length];
      if (v === total) {
        body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + col + '"/>';
      } else {
        var p = function (a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
        var s = p(a0), e = p(a1);
        body += '<path d="M ' + cx + ' ' + cy + ' L ' + s[0].toFixed(2) + ' ' + s[1].toFixed(2) +
          ' A ' + r + ' ' + r + ' 0 ' + (sweep > Math.PI ? 1 : 0) + ' 1 ' + e[0].toFixed(2) + ' ' + e[1].toFixed(2) +
          ' Z" fill="' + col + '" stroke="#fff" stroke-width="1.5"/>';
      }
      a0 = a1;
    });
    // A labelled key beside the pie, not labels crammed into the slices.
    var ly = 44;
    labels.forEach(function (l, i) {
      var pct = Math.round((data[i] / total) * 1000) / 10;
      body += '<rect x="330" y="' + (ly - 10) + '" width="12" height="12" fill="' + SERIES[i % SERIES.length] + '"/>' +
        '<text x="350" y="' + ly + '" font-size="12.5" fill="' + INK + '">' + esc(l) +
        ' — ' + esc(fmt(data[i])) + ' (' + pct + '%)</text>';
      ly += 24;
    });
    return frame(W, Math.max(H, ly + 16), chart.title, body,
      (chart.title || 'Pie chart') + ': ' + labels.map(function (l, i) { return l + ' ' + fmt(data[i]); }).join(', '));
  }

  function chartHtml(chart) {
    if (!chart || typeof chart !== 'object') return '';
    var t = String(chart.type || 'bar').toLowerCase();
    if (t === 'pie' || t === 'doughnut') return pieChart(chart);
    if (t === 'line' || t === 'area') return lineChart(chart);
    return barChart(chart);
  }

  function tableHtml(td) {
    if (!td || !Array.isArray(td.rows)) return '';
    var head = Array.isArray(td.headers) && td.headers.length
      ? '<thead><tr>' + td.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' : '';
    var body = td.rows.map(function (r) {
      return '<tr>' + (Array.isArray(r) ? r : [r]).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<div class="gex-tablewrap">' +
      (td.title ? '<div class="gex-title">' + esc(td.title) + '</div>' : '') +
      '<table class="gex-table">' + head + '<tbody>' + body + '</tbody></table></div>';
  }

  var CSS = [
    '.gex{margin:0 0 16px;}',
    '.gex-fig{margin:0 0 6px;padding:12px 10px 8px;border:1px solid ' + LINE + ';border-radius:4px;background:#fff;}',
    '.gex-title{font-size:13px;font-weight:700;color:' + INK + ';margin:0 0 8px;text-align:center;}',
    '.gex-svg{display:block;max-width:680px;margin:0 auto;height:auto;}',
    '.gex-legend{display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:center;margin:0 0 12px;font-size:12px;color:' + INK + ';}',
    '.gex-key{display:inline-flex;align-items:center;gap:6px;}',
    '.gex-key i{width:11px;height:11px;border-radius:2px;display:inline-block;}',
    '.gex-tablewrap{margin:0 0 14px;overflow-x:auto;}',
    '.gex-table{border-collapse:collapse;margin:0 auto;font-size:13.5px;background:#fff;}',
    '.gex-table th,.gex-table td{border:1px solid ' + LINE + ';padding:7px 13px;text-align:center;color:' + INK + ';}',
    '.gex-table th{background:#f2f5f8;font-weight:700;}',
    '.gex-table td:first-child{text-align:left;}',
    '.gex-figdesc{font-size:13px;color:' + MUTE + ';font-style:italic;margin:0 0 12px;text-align:center;}',
    '.gex-svgraw{text-align:center;margin:0 0 14px;}',
    '.gex-svgraw svg{max-width:100%;height:auto;}',
    '@media print{.gex-fig{break-inside:avoid;} .gex-tablewrap{break-inside:avoid;}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('gre-exhibit-css')) return;
    var s = document.createElement('style');
    s.id = 'gre-exhibit-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* Everything a question carries, stacked in reading order. A question with
     both a chart and a table gets both: 29 of the imported items need that,
     and showing only the first silently removes half the data. */
  function html(q) {
    if (!q) return '';
    try {
      injectCss();
      var out = '';
      if (q.chart) out += chartHtml(q.chart);
      if (q.table_data) out += tableHtml(q.table_data);
      if (q.svg) out += '<div class="gex-svgraw">' + q.svg + '</div>';
      if (q.figure_description && !q.svg) out += '<p class="gex-figdesc">' + esc(q.figure_description) + '</p>';
      return out ? '<div class="gex">' + out + '</div>' : '';
    } catch (e) {
      if (window.console) console.warn('exhibit', e);
      return '';
    }
  }

  window.GREExhibit = { html: html, chart: chartHtml, table: tableHtml };
})();
