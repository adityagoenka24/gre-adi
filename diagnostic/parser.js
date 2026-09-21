/* ============================================================
   GRE Quant Pro — ETS Diagnostic Report parser
   Phase 0. Client-side only. No network, no API, no cost.

   Pipeline:  PDF/image -> canvas (>=220 DPI) -> Tesseract OCR
              -> token snapping -> row model -> validation

   The ETS report uses a closed vocabulary (4 question types,
   2 settings, Right/Wrong, difficulty 1-5, mm:ss), so OCR only
   has to get CLOSE: every token is snapped to its nearest legal
   value. That is what makes free OCR accurate enough to trust.

   Exports split in two:
     - pure functions (no DOM) — unit-testable in Node
     - browser pipeline — needs canvas + pdf.js + tesseract.js
   ============================================================ */

/* ---------- constants ---------- */

export const SECTION_SIZES = { 1: 12, 2: 15 };          // current short GRE
export const SECTION_BUDGETS = { 1: 21 * 60, 2: 26 * 60 };

export const QUESTION_TYPES = [
  // longest first — belt and braces alongside min-distance scoring
  { key: 'MCM', label: 'Multiple-choice--Select One or More' },
  { key: 'MC1', label: 'Multiple-choice--Select One' },
  { key: 'QC',  label: 'Quantitative Comparison' },
  { key: 'NE',  label: 'Numeric Entry' },
];

export const SETTINGS = [
  { key: 'Pure', label: 'Pure math' },
  { key: 'Real', label: 'Real-life' },
];

export const AREAS = [
  { key: 'Arithmetic',   label: 'Arithmetic' },
  { key: 'Algebra',      label: 'Algebra' },
  { key: 'Geometry',     label: 'Geometry' },
  { key: 'DataAnalysis', label: 'Data Analysis' },
];

/* ---------- string helpers ---------- */

/** Normalise for fuzzy comparison: lowercase, letters only.
 *  This is what absorbs OCR noise like "Real-life" -> "Realiife"
 *  (both normalise to near-identical letter strings). */
export function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z]/g, '');
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Snap a noisy string to the closest member of `candidates`.
 *  Returns {key,label,distance,confident} or null if nothing is close. */
export function snap(raw, candidates, maxRatio = 0.34) {
  const n = norm(raw);
  if (!n) return null;
  let best = null;
  for (const c of candidates) {
    const d = levenshtein(n, norm(c.label));
    if (!best || d < best.distance) best = { ...c, distance: d };
  }
  if (!best) return null;
  const tol = Math.max(2, Math.ceil(norm(best.label).length * maxRatio));
  return best.distance <= tol
    ? { ...best, confident: best.distance <= 2 }
    : null;
}

export const snapQuestionType = (s) => snap(s, QUESTION_TYPES);
export const snapSetting      = (s) => snap(s, SETTINGS);

/** Right/Wrong. The two words share no leading character, so this
 *  is the most reliable field in the whole report. */
export function snapVerdict(raw) {
  const n = norm(raw);
  if (!n) return null;
  const dR = levenshtein(n, 'right'), dW = levenshtein(n, 'wrong');
  if (Math.min(dR, dW) > 2) return null;
  return dR < dW ? 'R' : 'W';
}

/** Digits 1-5 and the glyphs OCR most often mistakes them for.
 *  Measured on a real low-resolution screenshot: difficulty "5" came
 *  back once as "S" and once as nothing at all. Only high-confidence
 *  confusions are mapped; anything else returns null so the field is
 *  flagged for the student to confirm rather than guessed at. */
const DIGIT_CONFUSIONS = {
  '1': '1', 'l': '1', 'I': '1', '|': '1', '!': '1',
  '2': '2', 'z': '2', 'Z': '2',
  '3': '3',
  '4': '4', 'a': '4', 'A': '4',
  '5': '5', 's': '5', 'S': '5', '§': '5',
};

export function snapDifficulty(ch) {
  const d = DIGIT_CONFUSIONS[String(ch || '').trim()];
  return d ? +d : null;
}

/** "01:43" -> 103. Tolerates ; . and , for the colon (OCR drift). */
export function parseClock(raw) {
  const m = String(raw || '').match(/^(\d{1,2})[:;.,](\d{2})$/);
  if (!m) return null;
  const mm = +m[1], ss = +m[2];
  if (ss > 59) return null;
  return mm * 60 + ss;
}

/* ---------- line classification ---------- */

const RE_SECTION = /\b(first|second)\s+section\b/i;
const RE_CLOCK_END = /(\d{1,2}[:;.,]\d{2})\s*$/;

export function matchSectionHeader(line) {
  const m = line.match(RE_SECTION);
  if (!m) return null;
  return /first/i.test(m[1]) ? 1 : 2;
}

export function matchAreaHeader(line) {
  const t = line.trim();
  // area headers are short standalone lines, never data rows
  if (!t || t.length > 24 || /\d/.test(t)) return null;
  const hit = snap(t, AREAS, 0.25);
  return hit ? hit.key : null;
}

export function matchSubHeader(line) {
  const n = norm(line);
  if (!n || n.length > 24) return null;
  if (levenshtein(n, 'discretequestions') <= 3) return 'discrete';
  if (levenshtein(n, 'setmembers') <= 2) return 'set';
  return null;
}

/**
 * Parse one data row by scanning from the RIGHT, where the fields are
 * unambiguous (clock, then single digit, then Right/Wrong), and treating
 * whatever remains as type + setting.
 * Returns {ok:true,row} or {ok:false,reason,raw}.
 */
export function parseRow(line) {
  // Trailing punctuation after the reference number is a table-border
  // artefact from OCR ("2." / "2]" / "2|") — seen on real screenshots.
  const lead = line.match(/^\s*(\d{1,2})\s*[.)\]:,|]?\s+(.+?)\s*$/);
  if (!lead) return { ok: false, reason: 'no-reference-number', raw: line };
  const ref = +lead[1];
  let rest = lead[2];

  const clockM = rest.match(RE_CLOCK_END);
  if (!clockM) return { ok: false, reason: 'no-time', raw: line };
  const seconds = parseClock(clockM[1]);
  if (seconds === null) return { ok: false, reason: 'bad-time', raw: line };
  rest = rest.slice(0, clockM.index).trim();

  // Difficulty is a single glyph and the most OCR-fragile field on the
  // row. A row missing only this is still a usable row: keep it, mark it
  // for review, and let the confirm grid collect the one missing value.
  let difficulty = null, needsReview = [];
  const diffM = rest.match(/(\S)\s*$/);
  if (diffM) {
    difficulty = snapDifficulty(diffM[1]);
    if (difficulty !== null) rest = rest.slice(0, diffM.index).trim();
  }
  if (difficulty === null) {
    needsReview.push('difficulty');
    // the glyph may be absent entirely, so only consume it if it was junk
    const junk = rest.match(/(?:^|\s)([^\s\d])\s*$/);
    if (junk && !snapVerdict(junk[1])) rest = rest.slice(0, junk.index).trim();
  }

  const tokens = rest.split(/\s+/);
  const verdict = snapVerdict(tokens[tokens.length - 1]);
  if (!verdict) return { ok: false, reason: 'no-verdict', raw: line };
  tokens.pop();

  // Setting is one or two trailing tokens ("Pure math" / "Real-life").
  let setting = null, consumed = 0;
  for (const take of [2, 1]) {
    if (tokens.length < take) continue;
    const cand = tokens.slice(-take).join(' ');
    const hit = snapSetting(cand);
    if (hit && (!setting || hit.distance < setting.distance)) {
      setting = hit; consumed = take;
    }
  }
  if (!setting) return { ok: false, reason: 'no-setting', raw: line };
  const typeRaw = tokens.slice(0, tokens.length - consumed).join(' ');

  const qtype = snapQuestionType(typeRaw);
  if (!qtype) return { ok: false, reason: 'no-question-type', raw: line };

  return {
    ok: true,
    row: {
      ref, difficulty, seconds, verdict,
      qtype: qtype.key, qtypeLabel: qtype.label,
      setting: setting.key, settingLabel: setting.label,
      confident: qtype.confident && setting.confident && !needsReview.length,
      needsReview,
      raw: line,
    },
  };
}

/* ---------- whole-report parse ---------- */

/**
 * Turn raw OCR text (all pages concatenated) into rows.
 * Everything before "First Section" is ignored — the ETS preamble
 * lists the area names as bullets and would otherwise be mistaken
 * for area headers.
 */
export function parseOcrText(text) {
  const lines = String(text || '').split(/\r?\n/);

  // A full report carries "First Section" / "Second Section" headings, and
  // everything before the first one is ETS preamble that lists the area
  // names as bullets — which would otherwise be read as area headers.
  // A cropped screenshot may carry no heading at all, so only gate on the
  // preamble when a heading actually exists.
  const hasSectionHeader = lines.some((l) => matchSectionHeader(l));

  const rows = [], issues = [];
  let section = null, area = null, sub = null, started = !hasSectionHeader;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
    if (!line) continue;

    const sec = matchSectionHeader(line);
    if (sec) { section = sec; area = null; sub = null; started = true; continue; }
    if (!started) continue;                       // skip ETS preamble

    const ar = matchAreaHeader(line);
    if (ar) { area = ar; sub = null; continue; }

    const sh = matchSubHeader(line);
    if (sh) { sub = sh; continue; }

    if (/reference/i.test(line) && /question/i.test(line)) continue;  // table head
    if (!/^\s*\d/.test(line)) continue;           // prose / footer

    const r = parseRow(line);
    if (r.ok) {
      if (!area) { issues.push({ type: 'orphan-row', raw: line }); continue; }
      rows.push({ ...r.row, section, area, sub: area === 'DataAnalysis' ? sub : null });
    } else {
      issues.push({ type: r.reason, raw: r.raw });
    }
  }
  return { rows, issues, hasSectionHeader };
}

/**
 * Assign sections to rows that arrived without a heading.
 * Students who upload screenshots often crop the "Second Section"
 * title away, so fall back to the one unambiguous signal the format
 * gives: section 1 holds 12 questions and section 2 holds 15.
 * `parts` is one entry per uploaded file, in upload order.
 */
export function assignSections(parts) {
  const known = new Set(
    parts.flatMap((p) => p.rows.filter((r) => r.section).map((r) => r.section))
  );
  const out = [];
  for (const part of parts) {
    const unknown = part.rows.filter((r) => !r.section);
    if (unknown.length) {
      let inferred = null;
      if (unknown.length === SECTION_SIZES[1] && !known.has(1)) inferred = 1;
      else if (unknown.length === SECTION_SIZES[2] && !known.has(2)) inferred = 2;
      if (inferred) {
        known.add(inferred);
        for (const r of unknown) { r.section = inferred; r.sectionInferred = true; }
      }
    }
    out.push(...part.rows);
  }
  return out;
}

/**
 * The free integrity check. Section 1 must hold 12 questions and
 * section 2 must hold 15; each section's time must fit its budget.
 * A parse that fails this is routed to the correction grid instead
 * of being shown to the student as analysis.
 */
export function validate(rows) {
  const errors = [], warnings = [];
  for (const s of [1, 2]) {
    const got = rows.filter((r) => r.section === s);
    if (got.length !== SECTION_SIZES[s]) {
      errors.push({
        code: 'section-count',
        message: `Section ${s}: expected ${SECTION_SIZES[s]} questions, found ${got.length}`,
        section: s, expected: SECTION_SIZES[s], found: got.length,
      });
    }
    const spent = got.reduce((a, r) => a + r.seconds, 0);
    if (spent > SECTION_BUDGETS[s]) {
      errors.push({
        code: 'section-overtime',
        message: `Section ${s}: ${spent}s exceeds the ${SECTION_BUDGETS[s]}s limit — a time was misread`,
        section: s,
      });
    }
  }
  for (const r of rows) {
    if (r.needsReview?.length) {
      warnings.push({
        code: 'needs-review', fields: r.needsReview,
        message: `S${r.section} ${r.area} #${r.ref}: confirm ${r.needsReview.join(', ')}`, row: r,
      });
    } else if (!r.confident) {
      warnings.push({ code: 'low-confidence', message: `S${r.section} ${r.area} #${r.ref}`, row: r });
    }
  }
  return {
    ok: errors.length === 0,                 // structure is sound
    clean: errors.length === 0 && warnings.length === 0,  // nothing to confirm
    errors, warnings,
  };
}

/** Did the student upload the Verbal report by mistake? */
export function looksLikeVerbal(text) {
  const n = norm(text).slice(0, 4000);
  return n.includes('verbalreasoning') && !n.includes('quantitativereasoning');
}

/* ============================================================
   Browser pipeline
   ============================================================ */

export const MIN_DPI = 220;          // 150 DPI silently drops rows — do not lower
export const MAX_CANVAS_PIXELS = 40e6;

/** Tesseract page-segmentation mode. 4 = "single column of text of
 *  variable sizes", which is exactly what the cropped ETS content
 *  column is. Measured on the real report: PSM 3 (the tesseract.js
 *  default) and PSM 6 both return ZERO usable rows — 3 interleaves the
 *  left nav column into the tables, 6 assumes one uniform block and the
 *  varying header sizes defeat it. PSM 4 returns every row exactly.
 *  Do not change this without re-running the fixture suite. */
export const PSM = '4';

/** Fraction of page width to drop from the left. The ETS report puts a
 *  navigation sidebar there; leaving it in is what makes PSM 3 fail.
 *  Screenshots are already cropped, so they use 0. */
export const PDF_CROP_LEFT = 0.18;

/** Drop the left `frac` of a canvas, returning a new one. */
export function cropLeft(canvas, frac) {
  if (!frac) return canvas;
  const x0 = Math.floor(canvas.width * frac);
  const out = document.createElement('canvas');
  out.width = canvas.width - x0;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, x0, 0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Render every page of a PDF to canvases at >= MIN_DPI. */
export async function pdfToCanvases(arrayBuffer, pdfjsLib, onProgress) {
  const task = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await task.promise;
  const canvases = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    let scale = MIN_DPI / 72;
    if (base.width * base.height * scale * scale > MAX_CANVAS_PIXELS) {
      scale = Math.sqrt(MAX_CANVAS_PIXELS / (base.width * base.height));
    }
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
    onProgress?.({ stage: 'render', page: i, pages: pdf.numPages });
  }
  return canvases;
}

/** Load an image file (screenshot path) to a canvas, upscaling small ones. */
export async function imageToCanvas(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.max(1, Math.min(3, 1600 / bitmap.width));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** OCR one canvas with a warm Tesseract worker. */
export async function ocrCanvas(canvas, worker) {
  await worker.setParameters?.({ tessedit_pageseg_mode: PSM });
  const { data } = await worker.recognize(canvas);
  return data.text;
}

/**
 * Full run. Accepts one file or several (students commonly upload the
 * two sections as separate screenshots). `deps` supplies
 * { pdfjsLib, createWorker } so this module stays testable and never
 * hard-codes a CDN.
 */
export async function parseDiagnostic(input, deps, onProgress) {
  const files = Array.isArray(input) ? input : [input];
  onProgress?.({ stage: 'start', files: files.length });

  const worker = await deps.createWorker();
  const parts = [];
  let allText = '';
  try {
    for (let f = 0; f < files.length; f++) {
      const file = files[f];
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      const canvases = isPdf
        ? (await pdfToCanvases(await file.arrayBuffer(), deps.pdfjsLib, onProgress))
            .map((c) => cropLeft(c, PDF_CROP_LEFT))
        : [await imageToCanvas(file)];

      let text = '';
      for (let i = 0; i < canvases.length; i++) {
        onProgress?.({ stage: 'ocr', file: f + 1, files: files.length, page: i + 1, pages: canvases.length });
        text += (await ocrCanvas(canvases[i], worker)) + '\n';
      }
      allText += text + '\n';
      parts.push({ name: file.name, ...parseOcrText(text) });
    }
  } finally {
    await worker.terminate?.();
  }

  if (looksLikeVerbal(allText)) {
    return { ok: false, kind: 'verbal-report', text: allText };
  }

  onProgress?.({ stage: 'parse' });
  const rows = assignSections(parts);
  const issues = parts.flatMap((p) => p.issues.map((i) => ({ ...i, file: p.name })));
  const validation = validate(rows);
  return { ok: validation.ok, kind: 'quant', rows, issues, validation, parts, text: allText };
}
