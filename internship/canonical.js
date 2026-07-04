// Shared canonicalization + grader.
// MUST stay byte-for-byte compatible with the Python pre-compute used to
// generate answer hashes (see build notes). Any change here requires
// regenerating every ticket's answerHash.

export function canonCell(v, rnd) {
  if (v === null || v === undefined) return "∅"; // ∅
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "bigint") return Number(v).toFixed(rnd);
  if (typeof v === "number") return Number(v).toFixed(rnd);
  return String(v).trim();
}

// rows: array of arrays (values in column order)
export function canonicalize(rows, grader) {
  const rnd = grader.round ?? 2;
  const type = grader.type;
  if (type === "scalar") {
    return canonCell(rows[0][0], rnd);
  }
  if (type === "id-set") {
    const vals = rows.map((r) => canonCell(r[0], rnd)).sort();
    return vals.join("\n");
  }
  if (type === "result-set") {
    let lines = rows.map((r) => r.map((c) => canonCell(c, rnd)).join("|"));
    if (!grader.ordered) lines = lines.slice().sort();
    return lines.join("\n");
  }
  throw new Error("unknown grader type: " + type);
}

async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Returns { pass, canon, hash }
export async function grade(rows, grader) {
  if (!rows || rows.length === 0) {
    return { pass: false, canon: "", hash: "", empty: true };
  }
  const canon = canonicalize(rows, grader);
  const hash = await sha256Hex(grader.salt + "::" + canon);
  return { pass: hash === grader.answerHash, canon, hash };
}
