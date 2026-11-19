# TDS Calculator Handoff

**S.D. Pharmaceuticals — updated 19 November 2026**

## Purpose

The TDS Calculator records supplier payments in a working session. Enter the final bill amount and GST amount manually. Choose whether TDS applies. The page calculates 0.1% TDS rounded to the nearest rupee when applicable, and the final amount paid to the supplier.

No invoice image, PDF, invoice number, invoice date, OCR, or external AI service is part of this tool.

## Main Files

| File | Status | Purpose |
|---|---|---|
| `tds_calculator.html` | Active | Supplier-payment session tool. |
| `xlsx.full.min.js` | Required local library | Creates and reads Excel payment-record files. Keep it beside the HTML file. |
| `TDS_Calculator_Handoff.md` | Reference | This handoff document. |
| `../index.html` | Updated launcher | Contains the TDS Calculator card. |

## Payment Session Workflow

1. Open the TDS Calculator. A new supplier-payment session begins.
2. Select or type the supplier name.
3. Enter the final bill amount including GST, the GST amount, and payment date.
4. Choose **Yes** or **No** for TDS deduction. Yes is selected by default.
5. Review the calculated rounded TDS and final payable amount.
6. Click **Paid** after making the bank payment.
7. Repeat for every supplier.
8. Click **All payments done** to close the session and create a WhatsApp-ready summary for the accountant.

## Calculation

- When TDS is Yes: TDS = 0.1% of the final bill amount less GST, rounded to the nearest rupee.
- When TDS is No: TDS = ₹0 and final payable amount = final bill amount.
- When TDS is Yes: final payable amount = final bill amount − rounded TDS.

## Supplier Master and Storage

The supplier field searches supplier names previously used in the same browser. A newly typed name is saved automatically when the payment is marked Paid.

The page stores suppliers, sessions, and confirmed payment records in browser local storage under:

`sdpharma_supplier_payments_v1`

The data stays on that browser and computer. Clearing browser data removes it. Export the records to Excel before moving computers or clearing browser storage.

## Excel Export and Import

**Export Excel** downloads all payment records as an `.xlsx` file.

Exported columns:

- Payment ID
- Session
- Session status
- Supplier name
- Payment date
- TDS amount
- Final paid amount

**Import Excel** restores a spreadsheet previously exported by the tool. It restores suppliers, keeps payments from one session together, and skips a payment that already has the same Payment ID in browser storage.

## WhatsApp Summary

After a session is closed, **Copy message** copies a summary listing each supplier’s TDS deducted, final paid amount, and payment date, followed by session totals.

## Privacy

The tool does not upload or process invoice files. It has no OCR, no API calls, no server, and no invoice-file storage.
