// Pure calculation logic for payroll app (tested standalone, then inlined into the HTML file)

function pad2(n) { return String(n).padStart(2, "0"); }

function toDateStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }

function parseMonthStr(monthStr) {
  // "YYYY-MM" -> {year, month(1-12)}
  const [y, m] = monthStr.split("-").map(Number);
  return { year: y, month: m };
}

function monthStartDate(monthStr) {
  const { year, month } = parseMonthStr(monthStr);
  return new Date(year, month - 1, 1);
}

function monthEndDate(monthStr) {
  const { year, month } = parseMonthStr(monthStr);
  return new Date(year, month, 0); // day 0 of next month = last day of this month
}

function prevMonthEndDate(monthStr) {
  const start = monthStartDate(monthStr);
  return new Date(start.getFullYear(), start.getMonth(), 0);
}

function fyStartForMonth(monthStr) {
  const { year, month } = parseMonthStr(monthStr);
  const fyStartYear = month >= 4 ? year : year - 1;
  return new Date(fyStartYear, 3, 1); // April 1
}

function fyLabelForMonth(monthStr) {
  const fyStart = fyStartForMonth(monthStr);
  return "FY" + fyStart.getFullYear();
}

function monthLabelPretty(monthStr) {
  const { year, month } = parseMonthStr(monthStr);
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return names[month - 1] + " " + year;
}

// attendance: { "YYYY-MM-DD": Set/Array of employeeIds absent that day }
// holidays: { "YYYY-MM-DD": "Holiday Name" } — a date in here is never counted as an absence.
// countAbsences(employeeId, attendance, fromDate, toDate, holidays) inclusive
function countAbsences(employeeId, attendance, fromDate, toDate, holidays) {
  holidays = holidays || {};
  let count = 0;
  for (const dateStr in attendance) {
    if (holidays[dateStr]) continue;
    const d = new Date(dateStr + "T00:00:00");
    if (d >= fromDate && d <= toDate) {
      const list = attendance[dateStr];
      if (list && list.indexOf(employeeId) !== -1) count++;
    }
  }
  return count;
}

// A financial year normally has 11-12 public holidays. fyLabelForDate/fyBounds let callers
// group a flat { date: name } holiday map by FY, and workingDaysInMonth/holidaysInMonth (below)
// turn that map into a suggested "total working days" figure for the Payslips tab.
function fyLabelForDate(dateStr) { return fyLabelForMonth(dateStr.slice(0, 7)); }
function fyBounds(fyLabel) {
  const y = parseInt(String(fyLabel).replace("FY", ""), 10);
  return { start: new Date(y, 3, 1), end: new Date(y + 1, 2, 31) };
}
function workingDaysInMonth(monthStr, holidays) {
  holidays = holidays || {};
  const start = monthStartDate(monthStr), end = monthEndDate(monthStr);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue;
    if (holidays[toDateStr(d)]) continue;
    count++;
  }
  return count;
}

// Yearly bonus default: 1.5 x Basic. Callers may override this per employee per FY.
function defaultBonusAmount(employee, multiplier) {
  return (Number(employee.basic) || 0) * (multiplier || 1.5);
}

function openingLeavesFor(employee, fyLabel) {
  if (employee.openingLeavesFY === fyLabel) return Number(employee.openingLeaves) || 0;
  return 0;
}

// Full annual quota is 30 days (Apr-Mar). If the employee joined mid-FY, prorate at
// 2.5 days per full month remaining in that FY (30/12), counting the join month as a full
// month, then round UP to the next whole day (e.g. 22.5 -> 23).
function leaveQuotaForFY(employee, fyStart) {
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31); // March 31 following year
  let effectiveStart = fyStart;
  if (employee.joiningDate) {
    const jd = new Date(employee.joiningDate + "T00:00:00");
    if (jd > fyEnd) return 0; // hasn't joined yet as of this FY
    if (jd > fyStart) effectiveStart = jd;
  }
  const monthIndexInFY = (effectiveStart.getMonth() - 3 + 12) % 12; // April=0 ... March=11
  const monthsRemaining = 12 - monthIndexInFY;
  return Math.ceil(2.5 * monthsRemaining);
}

// Compute one employee's payslip row for a given month
function computePayslipRow(employee, monthStr, attendance, workingDays, holidays) {
  holidays = holidays || {};
  const fyStart = fyStartForMonth(monthStr);
  const fyLabel = fyLabelForMonth(monthStr);
  const monthEnd = monthEndDate(monthStr);
  const prevEnd = prevMonthEndDate(monthStr);

  const opening = openingLeavesFor(employee, fyLabel);
  const quota = leaveQuotaForFY(employee, fyStart);

  const leavesBefore = opening + countAbsences(employee.id, attendance, fyStart, prevEnd, holidays);
  const daysAbsent = countAbsences(employee.id, attendance, monthStartDate(monthStr), monthEnd, holidays);
  const leavesIncl = leavesBefore + daysAbsent;

  const excessLeaves = Math.max(0, leavesIncl - quota) - Math.max(0, leavesBefore - quota);

  const basic = Number(employee.basic) || 0;
  const dailyAllowance = Number(employee.dailyAllowance) || 0;
  const wd = Number(workingDays) || 0;
  const daysPresent = wd - daysAbsent;
  const variablePayout = dailyAllowance * daysPresent;
  const basicDeduction = wd > 0 ? excessLeaves * (basic / wd) : 0;
  const adjustedBasic = basic - basicDeduction;
  const totalPayout = adjustedBasic + variablePayout;

  return {
    employee, monthStr, workingDays: wd, daysAbsent, daysPresent,
    variablePayout, leavesBefore, leavesIncl, quota, excessLeaves,
    basicDeduction, adjustedBasic, totalPayout
  };
}

module.exports = {
  pad2, toDateStr, parseMonthStr, monthStartDate, monthEndDate, prevMonthEndDate,
  fyStartForMonth, fyLabelForMonth, monthLabelPretty, countAbsences, openingLeavesFor,
  leaveQuotaForFY, computePayslipRow,
  fyLabelForDate, fyBounds, workingDaysInMonth, defaultBonusAmount
};
