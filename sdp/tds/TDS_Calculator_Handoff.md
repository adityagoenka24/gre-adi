# TDS Calculator Handoff

**S.D. Pharmaceuticals — updated 19 November 2026**

## 1. Purpose

The TDS Calculator records supplier payments in a working session. It derives taxable value from the final invoice amount less GST, deducts TDS at 0.1% rounded to the nearest rupee, and produces the final amount paid to the supplier.

At the end of a session, it creates a WhatsApp-ready accountant summary and retains the payment records in the browser for later Excel export.

## 2. Main Files

| File | Status | Purpose |
|---|---|---|
| `tds_calculator.html` | Active | The supplier payment session tool. |
| `xlsx.full.min.js` | Required local library | Creates and reads Excel payment-record files without uploading data. Keep beside the HTML file. |
| `TDS_Calculator_Handoff.md` | Reference | This handoff document. |
| `../index.html` | Updated launcher | Contains the TDS Calculator card. |

Open the calculator from the Control Center or open `tds_calculator.html` directly.

## 3. Payment Session Workflow

1. Opening the page starts a new supplier-payment session.
2. Paste a copied invoice screenshot into the **Paste invoice screenshot here** box, read an invoice image/PDF, or fill the fields manually.
3. Enter or confirm:
   - Supplier name
   - Invoice number
   - Invoice date
   - Final bill amount including GST
   - GST amount
   - Payment date
4. The page calculates:
   - Taxable amount = final bill amount − GST amount
   - TDS = 0.1% of taxable amount, rounded to the nearest rupee
   - Final payable = final bill amount − rounded TDS
5. Click **Paid** after the bank payment is made.
6. Repeat for the remaining suppliers.
7. Click **All payments done**. The session closes and displays a WhatsApp-ready payment message for the accountant.

Completed sessions remain in browser storage and appear in the Excel export.

## 4. Supplier Master

The Supplier name field searches names already used in the browser.

If a typed supplier does not already exist, clicking **Paid** adds that name to the local supplier master. The name is available the next time the tool is opened on the same browser and computer.

## 5. Invoice Reader

The tool accepts pasted invoice screenshots, invoice images, and PDFs.

- To read a copied screenshot, click the paste box and press Command-V on Mac or Ctrl-V on Windows.
- A PDF with selectable text is read directly in the browser.
- A scanned PDF or image is processed with browser-based OCR.
- The reader attempts to fill supplier name, invoice number, invoice date, final bill amount, and GST amount.
- The user must review every field before clicking **Paid**. Supplier layouts vary, so OCR may select an incorrect value or fail to find a value.

The OCR does **not** upload the invoice to an OCR API or retain the source file. The invoice is processed in the browser memory and the file selector is cleared afterward.

Internet is required when using invoice reading because the page loads free PDF-reading and OCR code from public content delivery networks. The page can still be used manually without internet.

## 6. Storage and Privacy

The page uses browser local storage under:

`sdpharma_supplier_payments_v1`

This stores:

- Supplier names
- Sessions
- Payment records
- The confirmed amounts and dates needed for the accountant summary

It does not store invoice images or PDFs.

Browser storage is specific to the browser and computer. Clearing browser data removes the locally stored supplier master and payment sessions. Export the records to Excel before clearing data or changing computers.

## 7. Excel Export and Import

**Export Excel** downloads all payment records, including open and completed sessions, as an `.xlsx` file.

The exported columns are:

- Payment ID
- Session
- Session status
- Supplier name
- Invoice number
- Invoice date
- Payment date
- Final bill amount
- GST amount
- Taxable amount
- TDS amount
- Final paid amount

**Import Excel** reads an Excel file previously exported by the tool. It restores suppliers and payment records, keeps payments with the same session together, and skips a payment that has the same Payment ID already in the browser.

## 8. WhatsApp Summary

After **All payments done**, the message lists every payment with:

- Supplier
- Invoice number
- Bill amount
- GST amount
- Taxable amount
- TDS amount
- Final paid amount
- Payment date

It then provides total bill, GST, taxable value, TDS, and amount paid. Use **Copy message** to place the summary on the clipboard for WhatsApp.

## 9. Current Limitations and Next Work

- OCR is heuristic. It should be treated as field-filling assistance, not an accounting approval.
- The current OCR checks up to the first three PDF pages and runs scanned-PDF OCR on the first page.
- The original invoice file is intentionally not retained or attached to payment records.
- The page has not yet been published to a web host. Hosting it as a static page on GitHub Pages or Cloudflare Pages would make the free browser OCR available through a normal HTTPS link.
- No server account, database, or paid OCR API is required for the current design.

