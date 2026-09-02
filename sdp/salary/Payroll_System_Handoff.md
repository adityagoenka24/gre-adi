# Payroll System Handoff

**S.D. Pharmaceuticals — prepared 2 July 2026 (updated 2 September 2026: added public holidays and yearly bonus)**

## 1. Overview

This document summarizes the payroll and attendance system built for S.D. Pharmaceuticals: what exists, where it lives, the business rules it enforces, and what's still outstanding. The system covers 6 employees, tracks daily attendance, applies a prorated annual leave quota, records public holidays, generates printable monthly payslips, and generates yearly bonus slips.

The active, day-to-day tool is the offline webpage described in Section 3 (`Payroll_App.html`). An earlier Excel-based version and two scheduled Claude chat automations were built first and have since been superseded — see Section 2 for that history.

## 2. How We Got Here

**Phase 1 — Excel template**
`Payroll_Template.xlsx` was built first: an Employee Master sheet, a Monthly Working Days sheet, an Attendance Log, an FY Opening Leaves sheet, and a formula-driven Monthly Payslip Summary. All calculations (present days, leave quota, Basic deduction, total payout) were done with live Excel formulas, verified to zero formula errors.

**Phase 2 — Scheduled Claude chat automations**
Two recurring Cowork scheduled tasks were created to reduce manual work: a daily Monday–Saturday 1pm chat prompt asking who was absent, and a monthly prompt (first working day of the month) that asked for the prior month's working-day count and generated payslips. These have since been removed in favor of the self-serve webpage — no recurring Claude chat prompts are active for this workflow anymore.

**Phase 3 — Offline webpage (current)**
To remove day-to-day dependence on Claude, everything was rebuilt as a single self-contained HTML file (`Payroll_App.html`) that runs entirely offline in a browser: mark attendance, add/remove employees, and generate a one-page, 6-up printable payslip sheet. This is now the system of record.

## 3. The Active Tool — Payroll_App.html

A single HTML file with six tabs. Double-click it to open in any browser; no install or internet connection required.

### Employees tab
- Add, edit, or remove employees (Name, Basic, Daily Allowance, Date of Joining, Opening Leaves, Notes).
- "Remove" deactivates an employee (keeps their history intact for past payslips) rather than deleting them; a separate "Delete" permanently erases a record if truly added by mistake.
- Shows each employee's leave balance used and remaining for the current financial year at a glance.

### Attendance tab
- Pick a date, tick anyone who was ABSENT, and save — everyone left unchecked is treated as present.
- Saving auto-advances the date picker to the next working day (Sundays **and public holidays** are skipped), so consecutive days can be logged quickly.
- If the selected date is a public holiday (from the Holidays tab), a banner says so and reminds you no attendance is expected that day.
- A "Missed Attendance Days" panel lists any working day since 1 July 2026 with no attendance saved at all (distinct from a day confirmed as "everyone present"), with one-click "Fill In" links and a bulk "Mark all as present" option. Public holidays are excluded from this list.
- A "Recent Absences" list shows the last 15 dates with logged absences, editable in one click.

### Holidays tab (new — September 2026)
- Add each public holiday for the financial year: a date and a name (e.g. "Diwali", "Independence Day"). A financial year normally has 11–12 public holidays; the list shows a count per FY and flags if it's outside that usual range.
- Once added, a holiday date is excluded everywhere it matters: it's subtracted from the suggested "Total Working Days" on the Payslips tab, it's skipped when Attendance auto-advances, and it never counts as a leave/absence in the payslip math even if something was accidentally marked on that date.
- Remove a holiday with one click if added by mistake.

### Payslips tab
- Pick a month; "Total Working Days" is pre-filled as calendar days minus Sundays minus any public holidays that month (edit it if the actual figure differed), then click Generate.
- A note above the field lists any public holidays falling in the selected month, for transparency.
- Produces a printable A4 page with all employees' payslips laid out 6-up (2 columns × 3 rows); more than 6 employees simply adds another page.
- Each slip shows: firm name, employee name, days present / working days, FY leave taken vs. quota and remaining, total payout, and — only when relevant — a note on any leave-related Basic deduction that month.
- "Download PDF" builds the PDF directly in-browser (via a bundled offline PDF library), so it works identically across Chrome/Safari/Firefox without relying on the browser's print dialog.

### Bonus tab (new — September 2026)
- Set the Financial Year (its April start year, e.g. 2026 for FY2026). The table lists every active employee employed at some point in that FY, with their Basic and a Default Bonus of 1.5 × Basic (1.5 months' salary).
- Type an amount in the Override column to set a specific employee's bonus manually — e.g. for someone who joined partway through the year and shouldn't get the full 1.5×. Leave it blank to use the default; overrides are remembered per employee per FY.
- Employees who joined after the selected FY ended are left out of the table entirely; anyone who joined mid-FY is flagged with a note suggesting an override.
- "Generate Bonus Slips" produces the same 6-up printable card layout as payslips (firm name, employee name, Basic, the bonus amount and how it was calculated), and "Download PDF" saves it the same offline-PDF way as payslips.

### Backup tab
- All data auto-saves in the browser's local storage as you work.
- Export downloads a full JSON backup; Restore loads one back in (replacing current data).
- If a browser ever blocks local storage entirely (some Safari/private-browsing setups), the app detects this and shows a warning banner recommending Export before closing the tab.

## 4. Business Rules Baked Into the Calculations

1. Basic is a fixed monthly amount, paid in full every month by default.
2. Daily Allowance is variable: paid only for days the employee was actually present that month (Daily Allowance × Days Present).
3. Every employee gets an annual leave quota of 30 days for the financial year (1 April – 31 March).
4. Employees who join partway through the FY get a prorated quota: 2.5 days per full month remaining in the FY from their joining month, rounded UP to the next whole day (e.g. joining in July → 22.5 → 23 days).
5. Attendance only records absences — an employee is assumed present unless marked absent on a given date.
6. If cumulative leave in the FY crosses the quota, the excess days are deducted from that month's Basic at a daily rate of Basic ÷ that month's total working days. The deduction is applied once, in the month the quota is actually crossed — not repeated in every later month.
7. "Opening Leaves" on each employee record captures any leave already taken before this system started tracking (currently 0 for all six employees for FY2026, since tracking begins 1 July 2026).
8. Total Payout = (Basic − any leave-quota deduction) + (Daily Allowance × Days Present).
9. Public holidays (Holidays tab) are never treated as a working day: they're subtracted from the suggested Total Working Days for a month, and a date marked as a holiday never counts as a leave/absence in the leave-quota or deduction math, even if attendance was accidentally marked on it.
10. Yearly bonus defaults to 1.5 months' salary (1.5 × Basic) per employee for the financial year, editable per employee via an override on the Bonus tab (e.g. for someone who joined partway through the year). An employee who joined after the selected FY ended is not offered a bonus for that year.

## 5. Current Employee Data (as seeded)

*This reflects the data set up during development. Since the webpage stores live data in the browser, treat this table as a starting snapshot — use Backup → Export in the app for the current authoritative figures.*

| Employee | Basic (₹/mo) | Daily Allowance (₹/day) | Joined | Notes |
|---|---|---|---|---|
| Samir Das | 12,000 | 525 | — (pre-FY2026) | |
| Sujit Das | 7,000 | 255 | — (pre-FY2026) | |
| Bishnu Das | 5,000 | 250 | — (pre-FY2026) | |
| Soumen Roy | 6,000 | 270 | — (pre-FY2026) | |
| Mangal Bannerjee | 5,000 | 215 | — (pre-FY2026) | |
| Partha Das | 0 (TBD) | 0 (TBD) | 1-Jul-2026 | Basic/Allowance still need to be filled in |

## 6. File Inventory

All files live in the "Salary SD" folder that was connected for this project.

| File | Status | Purpose |
|---|---|---|
| `Payroll_App.html` | ACTIVE — primary tool | Offline webpage: mark attendance, manage employees, record public holidays, generate & print payslips, generate & print yearly bonus slips. Open this directly in a browser. |
| `Payroll_Template.xlsx` | Superseded | Original Excel-based tracker built before the webpage. Kept for reference / as a manual fallback; no longer the primary tool. |
| `calc.js` | Reference | Standalone copy of the payroll/leave calculation logic used inside `Payroll_App.html`, for review or reuse outside the browser. |
| `test_app.js` | Reference | Automated test script (Node + jsdom) that verifies the webpage's math. Not needed for daily use. |
| `build_payroll_template.py` | Reference | Python script that generated `Payroll_Template.xlsx`. Only needed if the Excel version is ever regenerated. |

## 7. Day-to-Day Workflow

1. At the start of the financial year (or whenever a new holiday is announced), open the Holidays tab and add that date and name — do this once per holiday, not every month.
2. Each working day (ideally around end of day), open `Payroll_App.html` → Attendance tab → tick anyone absent → Save. The date auto-advances for the next entry, skipping Sundays and any holiday already entered.
3. Periodically check the "Missed Attendance Days" panel to catch any days that were skipped.
4. On or after the 1st of the new month, go to the Payslips tab, select last month (Total Working Days is pre-filled from calendar days minus Sundays minus holidays — adjust if needed), click Generate, review the summary, then Download PDF.
5. When someone joins or leaves, update the Employees tab (add a new employee with their Date of Joining, or Remove a departing employee to deactivate them without losing history).
6. When bonus season arrives, go to the Bonus tab, set the financial year, review the default 1.5×-Basic amounts, type an override for anyone who needs a different figure, then Generate Bonus Slips and Download PDF.
7. Export a backup from the Backup tab periodically, and especially before switching computers or browsers.

## 8. Outstanding Items

- Fill in Partha Das's Basic and Daily Allowance in the Employees tab (currently ₹0 placeholders).
- Confirm Opening Leaves for FY2026 are correct for all employees (currently set to 0 across the board).
- Generate and file the June 2026 payslips if not already done (working days for June still needs to be entered once, when generating that month).
- Add FY2026's public holiday dates in the new Holidays tab (none are entered yet — a typical FY has 11–12).
- Decide on any bonus overrides needed for FY2026 before generating slips (e.g. Partha Das, who joined 1 July 2026 partway through the year).
- Consider a periodic (e.g. weekly) habit of exporting a Backup JSON file, since data lives only in the browser used to open the file.

## 9. Data Safety Notes

`Payroll_App.html` stores everything in that browser's local storage — it is tied to the specific browser and computer used to open the file. It will **not** sync automatically to another device or browser. Use Export Backup / Restore from Backup in the Backup tab to move data between machines or to recover from a cleared browser cache.
