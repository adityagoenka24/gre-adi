#!/usr/bin/env python3
"""Render a practice patch's figure and chart exhibits to PNG assets.

Usage:  render_assets.py <patch.json> <assets_dir> [--force]

For every question in the patch:
  * `svg`        -> <assets_dir>/<ID>.png   (cairosvg, 2x scale, white background)
  * `chart`      -> <assets_dir>/<ID>.png   (matplotlib, ETS-plain house style)
  * `table_data` -> nothing; build_practice_md.py prints it as a markdown table
  * `figure_description` with no svg -> reported as a DEFECT (the skill bans
    shipping a prose figure box in place of a drawn figure)

Charts are drawn to read in grayscale print: distinct fill shades plus hatching,
light gridlines so a value can actually be read off, legend only when there is
more than one series.
"""
import json, os, sys, re, textwrap

SCALE = 2.0          # svg raster scale; 2x keeps labels crisp at print size
DPI = 150

SHADES = ["#4a4a4a", "#9a9a9a", "#d0d0d0", "#6f6f6f", "#b8b8b8", "#ececec"]
HATCH = ["", "///", "...", "\\\\\\", "xxx", "---"]


def _mpl():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({
        "font.family": "serif",
        "font.serif": ["DejaVu Serif"],
        "font.size": 10,
        "axes.edgecolor": "#222222",
        "axes.linewidth": 0.8,
        "axes.grid": True,
        "grid.color": "#cccccc",
        "grid.linewidth": 0.5,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "savefig.facecolor": "white",
    })
    return plt


def render_svg(svg, out):
    import cairosvg
    # bank svgs use currentColor; cairosvg needs an explicit colour to inherit
    s = svg
    if "currentColor" in s:
        s = s.replace("currentColor", "#111111")
    if "<svg" in s and "style=" not in s.split(">", 1)[0]:
        s = s.replace("<svg", '<svg style="color:#111111"', 1)
    cairosvg.svg2png(bytestring=s.encode("utf-8"), write_to=out,
                     scale=SCALE, background_color="white")


def _int_ticks(ax, dsets):
    """ETS labels whole numbers when the data are whole numbers."""
    from matplotlib.ticker import MaxNLocator
    vals = [float(v) for d in dsets for v in d["data"]]
    if vals and all(abs(v - round(v)) < 1e-9 for v in vals):
        ax.yaxis.set_major_locator(MaxNLocator(integer=True, nbins=8))


def render_chart(chart, out):
    plt = _mpl()
    kind = chart.get("type", "bar")
    labels = chart.get("labels") or []
    dsets = chart.get("datasets") or []
    title = (chart.get("title") or "").strip()
    multi = len([d for d in dsets if d.get("label")]) > 1 or len(dsets) > 1

    if kind == "pie":
        data = [float(x) for x in dsets[0]["data"]]
        crowded = len(data) > 6
        fig, ax = plt.subplots(figsize=(7.0, 4.4) if crowded else (5.6, 4.2), dpi=DPI)
        wedges, texts, autotexts = ax.pie(
            data, labels=None if crowded else labels, autopct="%1.0f%%", startangle=90,
            counterclock=False, pctdistance=0.68 if crowded else 0.62,
            labeldistance=1.06,
            colors=[SHADES[i % len(SHADES)] for i in range(len(data))],
            wedgeprops={"edgecolor": "#222222", "linewidth": 0.8},
            textprops={"color": "#111111"},
        )
        if crowded:
            total = sum(data) or 1.0
            ax.legend(wedges, ["{} - {:.0f}%".format(l, 100.0 * v / total)
                               for l, v in zip(labels, data)],
                      loc="center left", bbox_to_anchor=(1.0, 0.5),
                      frameon=False, fontsize=9)
        for i, w in enumerate(wedges):
            w.set_hatch(HATCH[i % len(HATCH)])
        for t in autotexts:
            t.set_color("#000000")
            t.set_fontsize(9)
            # white pad so a percentage stays readable over a hatched wedge
            t.set_bbox(dict(facecolor="white", edgecolor="none", pad=1.5, alpha=0.85))
        ax.set_aspect("equal")
        ax.grid(False)
    elif kind == "line":
        fig, ax = plt.subplots(figsize=(6.0, 3.6), dpi=DPI)
        marks = ["o", "s", "^", "D", "v", "P"]
        for i, d in enumerate(dsets):
            ax.plot(labels, [float(x) for x in d["data"]],
                    marker=marks[i % len(marks)], markersize=5,
                    color=SHADES[i % len(SHADES)], linewidth=1.6,
                    label=d.get("label") or None)
        ax.set_axisbelow(True)
        _int_ticks(ax, dsets)
        if multi:
            ax.legend(frameon=False, fontsize=9)
    else:  # bar (grouped, or stacked when flagged)
        import numpy as np
        fig, ax = plt.subplots(figsize=(6.0, 3.6), dpi=DPI)
        n = len(dsets)
        x = np.arange(len(labels))
        if chart.get("stacked"):
            bottom = np.zeros(len(labels))
            for i, d in enumerate(dsets):
                vals = np.array([float(v) for v in d["data"]])
                ax.bar(x, vals, 0.6, bottom=bottom,
                       color=SHADES[i % len(SHADES)], hatch=HATCH[i % len(HATCH)],
                       edgecolor="#222222", linewidth=0.7, label=d.get("label") or None)
                bottom += vals
        else:
            w = min(0.8 / max(n, 1), 0.35)
            for i, d in enumerate(dsets):
                ax.bar(x + (i - (n - 1) / 2) * w, [float(v) for v in d["data"]], w,
                       color=SHADES[i % len(SHADES)], hatch=HATCH[i % len(HATCH)],
                       edgecolor="#222222", linewidth=0.7, label=d.get("label") or None)
        ax.set_xticks(x)
        ax.set_xticklabels(labels)
        ax.set_axisbelow(True)
        ax.grid(axis="x", visible=False)
        _int_ticks(ax, dsets)
        if multi:
            ax.legend(frameon=False, fontsize=9)

    if title:
        ax.set_title("\n".join(textwrap.wrap(title.upper(), 58)),
                     fontsize=9.5, color="#111111", pad=10)
    for sp in ("top", "right"):
        ax.spines[sp].set_visible(False)
    fig.tight_layout()
    fig.savefig(out, dpi=DPI, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def run(patch_path, assets_dir, force=False):
    data = json.load(open(patch_path))
    qs = data["questions"]
    os.makedirs(assets_dir, exist_ok=True)
    made, skipped, defects = [], [], []
    for q in qs:
        qid = q["id"]
        out = os.path.join(assets_dir, qid + ".png")
        has = None
        if q.get("svg"):
            has = "svg"
        elif q.get("chart"):
            has = "chart"
        if has is None:
            if q.get("figure_description") and not q.get("table_data"):
                defects.append(qid)
            continue
        if os.path.exists(out) and not force:
            skipped.append(qid)
            continue
        try:
            if has == "svg":
                render_svg(q["svg"], out)
            else:
                render_chart(q["chart"], out)
            made.append((qid, has))
        except Exception as e:
            defects.append("{} RENDER-FAILED {}: {}".format(qid, type(e).__name__, e))
    print("rendered {} · skipped {} (already present) · {}".format(
        len(made), len(skipped), assets_dir))
    for qid, kind in made:
        print("  {:22s} {}".format(qid, kind))
    if defects:
        print("DEFECTS — fix before shipping:")
        for d in defects:
            print("  " + (d if " " in d else d + " has figure_description but no drawn figure"))
    return 1 if any("RENDER-FAILED" in d for d in defects) else 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sys.exit(run(args[0], args[1], force="--force" in sys.argv))
