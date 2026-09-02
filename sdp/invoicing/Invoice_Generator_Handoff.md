# Invoice Generator Handoff

**S.D. Pharmaceuticals — prepared 2 July 2026**

## 1. Overview

This document summarizes the invoice generator built for S.D. Pharmaceuticals: a single offline webpage (`invoice_generator.html`) that produces GST tax invoices for three fixed clients — Sidmark Sales Enterprise, Mankind Pharma, and Panacea Biotec — each using a different billing formula.

The active tool lives in the `invoicing` folder and is fully self-contained: open it by double-clicking, no install and no internet connection needed. Everything — entering numbers, calculating GST, viewing, and printing/saving as PDF — works completely offline in any browser.

## 2. How We Got Here

**Phase 1 — Single client (Sidmark), mimicking `bill.xlsx`**
Started by reading an existing invoice (`bill.xlsx`) raised to Sidmark Sales Enterprise, then built a form-driven generator that reproduced it exactly: provider details fixed, a client directory (add/edit/delete clients), auto-incrementing invoice numbers, flexible line items, and live GST (CGST/SGST/IGST) calculation.

**Phase 2 — Generalized to three clients after `bill_3.xlsx`**
You uploaded a workbook with three real invoices in one file (Sidmark, Mankind Pharma, Panacea Biotec), each computed completely differently:
- **Sidmark** — flat, manually-entered line items (unchanged from Phase 1).
- **Mankind Pharma** — a commission on net sales after returns.
- **Panacea Biotec** — a two-tier commission with a guaranteed monthly minimum.

Since there are only ever these three clients, the client directory (add/edit/delete) was removed and replaced with three fixed tabs, each with its own purpose-built calculator. All three formulas were verified against the source workbook's exact figures.

**Phase 3 — Formatting fixes**
Invoice date now defaults to the last day of the previous month (with billing month following automatically); invoice numbers were split into a fixed "SD" prefix, an editable running number, and an auto-computed financial-year suffix; print output was switched to landscape; extra blank space and a smaller font were added below the "Certified..." declaration for a signature; and all invoice text colors were locked to pure black.

**Phase 4 — PDF auto-save, tried and rolled back**
Briefly added a feature to auto-save PDFs directly into per-client subfolders using a browser permission API, which only worked in Chrome/Edge and needed an internet connection to load supporting libraries. This was removed in favor of staying fully offline — see Phase 5.

**Phase 5 — Fully offline again, print header/footer removed**
Removed the auto-save feature entirely; the tool has no internet dependency of any kind. Also fixed an issue where Chrome/Firefox were adding their own header and footer (URL, date, page number) to the printed/saved PDF — the print stylesheet now sets the page margin to zero, which suppresses that browser-added header/footer, while the invoice itself keeps its own internal margin so nothing touches the edge of the page. The invoice number and billing month are still used to pre-fill the browser tab's title before printing, so the "Save as PDF" dialog still suggests the correct filename by default.

**Phase 6 — Browser print replaced with direct PDF download (2 September 2026)**
The **Print / Save as PDF** button (and the browser's native print-to-PDF path behind it) had started producing a blank PDF on save/print. Rather than patch the print stylesheet again, the fix follows the same approach already used for the payroll app's payslips: the button is now **Download PDF**, and clicking it builds the PDF directly in-browser with a vendored, fully offline copy of jsPDF — drawing the invoice's exact layout (parties block, item table, GST totals, bank details, declaration, footnote) with precise coordinates, instead of asking the browser's print engine to render the on-screen HTML. There's no browser print dialog anymore and no dependency on how any particular browser (or macOS's PDF-printing pipeline) handles `@media print` — the file downloads straight to your Downloads folder (or wherever your browser sends downloads) using the same auto-generated filename as before. Everything else about generating and reviewing the invoice on-screen is unchanged. One small visible side-effect: the Panacea invoice's "Balance of Minimum ₹50,000 guarantee" style line-item text now reads "Rs." instead of "₹" — jsPDF's built-in font can't render the ₹ glyph (the payslip PDF uses "Rs." for the same reason), so this only affects that one line of text inside the PDF's item table, nothing else.

**Phase 7 — Invoice History added (2 September 2026, current)**
You asked for a way to retrieve any past invoice without digging through the `invoicing/<Client>/` folders. Added an **Invoice History** tab (button next to the title) that keeps a running log, entirely inside the browser — no new files, no setup. Every time you click **Download PDF**, that invoice's full details (invoice number, date, client, billing month, amounts, and every line item) are saved automatically. The History tab lists them newest-first with a search box (matches invoice number, client, or billing month) and a client filter, and each row has its own **Download PDF** button that regenerates and re-downloads that exact PDF again — handy if a file got moved, renamed, or accidentally deleted from the `invoicing/<Client>/` folders. A **Delete** button removes an entry from this list only (it never touches any PDF you already saved to disk). Re-downloading the same invoice number just refreshes its history entry rather than creating a duplicate row. Like the invoice-number counter, this log lives in the browser's local storage on this specific computer — see the updated Data Safety Notes in Section 8.

## 3. The Three Clients & Their Formulas

| Client | GSTIN | Formula |
|---|---|---|
| Sidmark Sales Enterprise Pvt Ltd | 19AAJCS2307L1Z3 | Flat, manually-entered line items (e.g. "Service Charges", "Reimbursement of Expenses") — add/remove rows freely, each with its own taxable value and GST rate. |
| Mankind Pharma Ltd | 19AAACM9401C1ZS | Service Charge = **8%** × (Net Sales for the period − Sales Return). You enter Net Sales and Sales Return; the 8% rate is fixed. |
| Panacea Biotec Limited | 19AAACP5335J1Z9 | Service Charge = (**1.5%** × Sale of "EASY-6 & EASY-4 POL") + (**5%** × Sale of other products), with a guaranteed minimum of **₹50,000/month** — a top-up line is added automatically only if the calculated commission falls short. If the calculated commission already exceeds ₹50,000, the actual amount is used (the minimum is a floor, not a cap). |

GST is 18% for all three (split into CGST 9% + SGST 9% since all three clients share S.D. Pharmaceuticals' state code, 19 — West Bengal). Rates and the Panacea minimum are fixed in the code, not editable from the form, per your instruction.

**Unresolved data question:** in the source workbook, both Sidmark's and Panacea's receiver address are listed identically to S.D. Pharmaceuticals' own address (14, Watkins Lane, Howrah). This was carried through as-is. If that's a copy-paste artifact rather than their real registered address, send the correct addresses and they can be updated in the `CLIENTS` object near the top of the script.

## 4. Invoice Numbering, Dates & Filenames

- **Invoice number** format is `SD/[running number]/[financial year]`. "SD" and the financial year are fixed and computed automatically from the invoice date (FY runs April–March); only the running number is editable, and it auto-suggests the next number in sequence (stored in the browser's local storage) but can be typed over freely.
- **Invoice date** defaults to the last day of the previous month; **billing month** (used in line-item descriptions like "Service Charges for JUNE-26") follows automatically from the invoice date, but both remain editable.
- **Suggested filename** pattern: `Client_InvoiceNo_MONTH_YEAR`, e.g. `Sidmark_SD-07-26-27_JUNE_2026`. Built automatically from the client, the invoice number, and the billing month field the moment you click Generate, and used to pre-fill the browser tab's title — most browsers then suggest this as the default filename in the "Save as PDF" dialog.

## 5. Generating & Downloading the PDF

Clicking **Generate Invoice** builds and displays the invoice on-screen, in landscape, exactly as it will appear in the PDF. To get the file:

1. Click **Download PDF**.
2. Your browser saves the file immediately (no print dialog) — typically straight to your Downloads folder, using the auto-generated filename described in Section 4.
3. Move (or save-as, depending on your browser's download settings) the file into the right `invoicing/<Client>/` subfolder.

This is still a fully offline step — no internet dependency, no browser-specific permissions, and no automatic folder-saving. You'll need to create the `Sidmark`, `Mankind`, and `Panacea` subfolders inside `invoicing/` yourself the first time, if they don't already exist.

**PDF fix note (Phase 6):** the old **Print / Save as PDF** button relied on the browser's print engine and had started producing a blank PDF. **Download PDF** avoids that entirely by drawing the invoice directly with a bundled copy of jsPDF, so there's no print dialog, no `@media print` CSS to disagree with, and no browser/OS quirk that can produce a blank page.

## 6. File Inventory

| File | Status | Purpose |
|---|---|---|
| `invoice_generator.html` | ACTIVE — primary tool | Open directly in a browser to generate, view, and download invoices as PDF. |
| `Sidmark/`, `Mankind/`, `Panacea/` | Create as needed | Subfolders under `invoicing/` where you save each client's PDFs — create manually or let the save dialog create them. |
| `Invoice_Generator_Handoff.md` | Reference | This document. |

## 7. Day-to-Day Workflow

1. Open `invoice_generator.html`.
2. Pick the client tab (Sidmark / Mankind / Panacea).
3. Check the invoice date, billing month, and invoice number (all pre-filled — adjust if needed).
4. Enter that month's numbers (line-item amounts for Sidmark; Net Sales & Sales Return for Mankind; the two sale-amount tiers for Panacea).
5. Click **Generate Invoice**. Review the on-screen invoice.
6. Click **Download PDF**, then move the downloaded file into `invoicing/<Client>/`.

## 8. Data Safety Notes

- The invoice-number counter and the Invoice History log are both stored in that specific browser's local storage — tied to the browser/computer used. If you switch browsers or clear site data, the running number will reset to 01 for the current financial year (just type over it manually if so — nothing else breaks), and the History tab will come up empty.
- The `invoicing/<Client>/` folders (where you move each downloaded PDF) remain the actual, portable record of every invoice — the in-browser History tab is a convenience for quickly finding and re-downloading a past invoice from this computer, not a replacement for those folders. If you ever need the invoice history somewhere more durable or shareable, say so and a one-click "export to file" can be added.
