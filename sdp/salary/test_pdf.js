const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("Payroll_App.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "file:///payroll/Payroll_App.html" });
const { window } = dom;
window.print = () => {};

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await wait(50);
  const doc = window.document;

  console.log("jsPDF loaded?", typeof window.jspdf, typeof window.jspdf?.jsPDF);

  // Generate payslips for July 2026 with default 6 employees (some have leave data from prior test scenario, keep simple: default seed state)
  doc.getElementById("ps-month").value = "2026-07";
  doc.getElementById("ps-workingdays").value = "26";
  doc.getElementById("btn-generate").dispatchEvent(new window.Event("click"));
  await wait(50);

  console.log("lastPayslipRows count:", window.lastPayslipRows ? window.lastPayslipRows.length : "undefined");

  // Intercept jsPDF save() to avoid real download, capture output bytes instead
  let capturedBytes = null;
  let capturedFilename = null;
  const origSave = window.jspdf.jsPDF.prototype.save;
  window.jspdf.jsPDF.prototype.save = function(filename) {
    capturedFilename = filename;
    capturedBytes = this.output("arraybuffer");
  };

  let threw = null;
  try {
    window.downloadPayslipsPDF();
  } catch (e) {
    threw = e;
  }

  console.log("Threw:", threw ? threw.stack : "no");
  console.log("Filename:", capturedFilename);
  console.log("Bytes length:", capturedBytes ? capturedBytes.byteLength : "null");
  if (capturedBytes) {
    const head = Buffer.from(capturedBytes.slice(0, 8)).toString("utf8");
    console.log("PDF header:", JSON.stringify(head));
  }

  // Check page count via jsPDF instance internal (re-derive doc separately for getNumberOfPages check is tricky since instance is local);
  // Instead infer from bytes: count occurrences of "/Type /Page" (not "/Pages") in the raw PDF stream (works for uncompressed jsPDF output).
  if (capturedBytes) {
    const text = Buffer.from(capturedBytes).toString("latin1");
    const pageMatches = text.match(/\/Type\s*\/Page[^s]/g) || [];
    console.log("Approx page count (regex):", pageMatches.length);
  }
})();
