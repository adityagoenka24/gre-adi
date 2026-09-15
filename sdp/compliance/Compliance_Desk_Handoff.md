# Compliance Desk Handoff

**S.D. Pharmaceuticals - prepared 15 September 2026**

## 1. Overview

This document summarizes the Compliance Desk added to the S.D. Pharmaceuticals Control Center. The tool is a single offline webpage (`compliance_links.html`) for monthly compliance navigation and tracking: TDS, GST, Professional Tax, bank logins, and any additional links Adi wants to save locally.

The tool is not a filing engine and does not compute tax amounts. It is a practical launchpad and checklist so Adi does not have to search for recurring government payment portals or bank login pages every month.

## 2. How We Got Here

**Phase 1 - Third Control Center card**
A third card, **Compliance Desk**, was added to the main `index.html` launcher alongside Invoice Generator and Payroll & Attendance. It opens `compliance/compliance_links.html` in a new tab, matching the existing offline-tool pattern.

**Phase 2 - Compliance portal quick links**
The first draft included government and compliance links for:
- Income Tax e-Filing Portal
- TRACES
- GST Portal
- e-Way Bill Portal
- West Bengal Profession Tax
- WB Commercial Taxes

Two reference-only links were later removed at Adi's request:
- e-Pay Tax Reference
- GST Payment Guide

**Phase 3 - Bank URLs section**
Bank links were separated from government payment portals into their own **Bank URLs** section. The current default bank login links are:
- Kotak Netbanking: `https://netbanking.kotak.bank.in/knb2/`
- PNB Internet Banking: `https://iretail.pnb.bank.in/corp/AuthenticationController?FORMSGROUP_ID__=AuthenticationFG&START_TRAN_FLAG=Y&FG_BUTTONS=LOAD&ACTION.LOAD=Y&AuthenticationFG.LOGIN_FLAG=1&BANK_ID=024`

**Phase 4 - Saved custom links**
An **Add Link** form was added so Adi can save his own recurring links, grouped under Direct Tax, GST, State Tax, Banking, or Other. Saved links are stored in browser localStorage and can be opened, edited, or deleted from the Saved Links section.

**Phase 5 - Monthly checklist**
A monthly checklist was added with default items:
- TDS payment, due day 7
- GSTR-1, due day 11
- Professional Tax, due day 15
- GSTR-3B, due day 20

Each selected month keeps its own Done/Pending status. The current month defaults to the browser's current month on page load.

**Phase 6 - Checklist customization and visual cleanup**
The checklist was upgraded so Adi can add new checklist items with a due day, task name, and optional note. The visible **Remove** button was removed from individual checklist rows. Pending items sort above completed ones, completed items become quieter visually, and a progress summary shows the percentage complete plus the count of completed items.

A **Restore Defaults** button exists for the checklist. It resets the checklist definition back to the original default items and removes custom checklist items from the checklist definition.

## 3. Active Tool - compliance_links.html

Open `compliance/compliance_links.html` directly in any browser, or open it from the Control Center (`index.html`). No install or internet connection is needed to open the page itself. Internet is only needed when clicking through to a government portal or bank website.

### Payment Portals
- Shows fixed default cards for core compliance portals.
- Each card opens in a new tab.
- These links are hardcoded in the `defaultPortals` array inside the page script.

### Bank URLs
- Shows fixed bank login cards for Kotak and PNB.
- These links are hardcoded in the `bankPortals` array.
- Bank URLs are deliberately separated from tax/compliance portals for faster scanning.

### Monthly Checklist
- Uses the selected month field at the top of the page.
- Tracks completion separately for each month.
- Pending rows are shown first.
- Completed rows are still visible but muted so the user's attention stays on pending items.
- Shows a progress bar and completion count.
- Custom checklist items can be added from the form below the checklist.

### Saved Links
- User-added links are stored locally in the browser.
- Saved links support open, edit, and delete.
- These links are for convenience only; they do not sync across browsers or computers.

## 4. Data Stored in Browser

The page uses browser localStorage with these keys:

| Key | Purpose |
|---|---|
| `sdpharma_compliance_links_v1` | User-added saved links |
| `sdpharma_compliance_status_v1` | Per-month Done/Pending checklist status |
| `sdpharma_compliance_checklist_v1` | Current checklist item definitions |

No passwords, bank credentials, OTPs, tax amounts, or sensitive account data are stored by this tool.

## 5. File Inventory

| File | Status | Purpose |
|---|---|---|
| `compliance_links.html` | ACTIVE - primary tool | Offline compliance portal launcher, bank URL page, saved links manager, and monthly checklist. |
| `Compliance_Desk_Handoff.md` | Reference | This document. |
| `../index.html` | Updated launcher | Includes the Compliance Desk card. |

## 6. Day-to-Day Workflow

1. Open the Control Center (`index.html`).
2. Click **Compliance Desk**.
3. Confirm the month at the top of the page.
4. Use the Payment Portals or Bank URLs section to open the relevant site.
5. Mark checklist items Done after payment/filing is completed.
6. Add any recurring custom compliance item using **Add Checklist Item**.
7. Add any frequently used custom portal or bank link using **Add Link**.

## 7. Password Vault Discussion

Adi asked whether this system could store bank and login credentials in a local JSON file with password or biometric protection.

Current decision: no password vault has been built into the Compliance Desk.

Reason: the current offline tools are simple browser-local HTML apps. They use localStorage for non-sensitive data such as links and checklist status. That is not appropriate for bank credentials.

The strongest possible browser-based approach would be a separate local encrypted vault:
- Store only encrypted JSON, never plaintext credentials.
- Use Web Crypto AES-GCM for encryption.
- Derive the encryption key from a strong master password using PBKDF2 or a stronger available KDF.
- Optionally use WebAuthn/passkeys/biometrics as an unlock factor where secure browser context support exists.
- Auto-lock, clear clipboard, hide passwords by default, and require re-unlock before reveal/copy.

Even then, this would not be equivalent to Apple Passwords/iCloud Keychain or a mature password manager, because browser-based local tools cannot fully defend against malware, malicious browser extensions, clipboard loggers, screen recording, or a compromised operating system. For real bank credentials, Apple Passwords/iCloud Keychain or a mature password manager remains the recommended path.

## 8. Outstanding Items

- Decide whether the Compliance Desk should have JSON export/import for saved links and checklist status, similar to the invoice and payroll tools.
- Confirm whether the default due days should remain 7/11/15/20 or be tailored to the business's actual filing calendar.
- Decide whether to add additional recurring compliance items such as TDS return filing, GST PMT-06 (if applicable), PF/ESI (if ever needed), CA review, or bank statement download.
- If a password vault is pursued, build it as a separate security-focused tool rather than mixing credentials into the Compliance Desk.

## 9. Data Safety Notes

All Compliance Desk saved links and checklist states live only in the browser used to open the file. They do not sync automatically to another browser or computer. Clearing browser data may erase them.

Do not store passwords or bank credentials in this tool's notes or saved links.
