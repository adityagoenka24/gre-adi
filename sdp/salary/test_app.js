const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("Payroll_App.html", "utf8");

const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "file:///payroll/Payroll_App.html" });
const { window } = dom;
window.print = () => { console.log("[print called]"); };

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await wait(50);
  const doc = window.document;

  // 1. Check default employees rendered
  const rows = doc.querySelectorAll("#employee-table-body tr");
  console.log("Employee rows:", rows.length);
  console.log("First employee name:", rows[0].querySelector("td").textContent.trim());

  // 2. Switch to Attendance tab, mark Samir Das (first emp) absent on 2026-07-01..08 to test excess leave path
  // First, set an opening leave balance of 25 for Samir Das via state directly (simulate edit) then mark 8 absences in July.
  const state = window.state;
  const samir = state.employees.find(e => e.name === "Samir Das");
  samir.openingLeaves = 25;
  samir.openingLeavesFY = "FY2026";
  window.saveState();

  for (let i = 1; i <= 8; i++) {
    const d = "2026-07-" + String(i).padStart(2, "0");
    state.attendance[d] = [samir.id];
  }
  window.saveState();

  // 3. Generate payslip for 2026-07 with working days 26
  doc.getElementById("ps-month").value = "2026-07";
  doc.getElementById("ps-workingdays").value = "26";
  doc.getElementById("btn-generate").dispatchEvent(new window.Event("click"));
  await wait(50);

  const summaryRows = doc.querySelectorAll("#ps-summary-body tr");
  console.log("\nPayslip summary rows:", summaryRows.length);
  summaryRows.forEach(tr => {
    const cells = [...tr.querySelectorAll("td")].map(td => td.textContent.trim());
    console.log(cells.join(" | "));
  });

  // 4. Check print area has payslip cards
  const cards = doc.querySelectorAll(".payslip-card");
  console.log("\nPayslip cards rendered:", cards.length);
  console.log("Sample card text:", cards[0].textContent.replace(/\s+/g, " ").trim());
  // find Samir's card (should have leave deduction note)
  const samirCard = [...cards].find(c => c.textContent.includes("Samir Das"));
  console.log("\nSamir card:", samirCard.textContent.replace(/\s+/g, " ").trim());

  // 5. Test add employee
  doc.getElementById("f-name").value = "Test New Emp";
  doc.getElementById("f-basic").value = "8000";
  doc.getElementById("f-allowance").value = "300";
  doc.getElementById("btn-save-emp").dispatchEvent(new window.Event("click"));
  await wait(20);
  console.log("\nEmployees after add:", state.employees.length, "-> last:", state.employees[state.employees.length-1].name);

  // 6. Test deactivate
  const lastId = state.employees[state.employees.length-1].id;
  window.setEmployeeActive(lastId, false);
  await wait(20);
  console.log("Active employees after deactivate:", state.employees.filter(e=>e.active).length);

  // 7. Test attendance checklist excludes inactive
  doc.getElementById("tab-attendance").style.display = "block";
  window.renderAttendanceChecklist();
  const checklistNames = [...doc.querySelectorAll("#att-checklist .check-item")].map(x=>x.textContent);
  console.log("Attendance checklist has Test New Emp?", checklistNames.some(n=>n.includes("Test New Emp")));

  // 8. Sanity: leavesUsedTillDate for Samir as of Aug 1 2026 (should be 25+8=33)
  console.log("\nSamir leaves used till 2026-08-01:", window.leavesUsedTillDate(samir, state.attendance, new Date(2026,7,1)));

  // 9. Holidays: add one, confirm it's excluded from working-day count and never counts as a leave
  state.holidays["2026-08-15"] = "Independence Day";
  window.saveState();
  console.log("\nWorking days suggested for Aug 2026 (excludes the holiday + Sundays):", window.workingDaysInMonth("2026-08"));
  state.attendance["2026-08-15"] = [samir.id]; // stray absence on a holiday should never count
  const strayCount = window.countAbsences(samir.id, state.attendance, new Date(2026,7,1), new Date(2026,7,31), state.holidays);
  console.log("Absences counted in Aug with 1 stray holiday-absence (should be 0):", strayCount);
  delete state.attendance["2026-08-15"];
  window.saveState();

  // 10. Bonus: default is 1.5x Basic, overridable per employee per FY
  console.log("\nDefault bonus for Samir (basic 12000, expect 18000):", window.defaultBonusAmount(samir));
  state.bonus.overrides["FY2026"] = { [samir.id]: 20000 };
  window.saveState();
  console.log("Bonus override stored:", state.bonus.overrides["FY2026"][samir.id]);

  console.log("\nALL CHECKS RAN");
})().catch(e => { console.error("TEST FAILED:", e); process.exit(1); });
