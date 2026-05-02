# AfroBooks Finance OS Brief

Created: 2026-05-02

## Purpose

AfroBooks Finance OS is the Pro finance workspace shell at:

- `/pro/apps/books/`

It is for African SMEs, freelancers, accountants, schools, clinics, NGOs, and small importers that need practical books workflow before a full accounting backend exists.

The product should feel like paid workflow software, not a calculator page.

## Current Scope

The first shell includes:

- Cashflow snapshot.
- Invoices.
- Expenses.
- Payroll journal imports.
- Tax-ready reports.
- Receivables and payables.
- Accountant handoff.
- Currency view.

Starter workflows:

- Create invoice batch.
- Import expenses CSV.
- Record payroll journal.
- Prepare monthly close pack.
- Export accountant packet.

Linked existing tools:

- `/tools/invoice-generator/`
- `/tools/proforma-invoice/`
- `/tools/freelance-invoice/`
- `/tools/staff-cost/`
- `/tools/afropayroll-os/workspace.html`
- `/tools/vat-calculator/`
- `/tools/business-planner/`
- `/tools/mobile-money-fees/`
- `/tools/bank-charges/`
- `/tools/payment-gateway/`

## Africa-First Operating Details

The shell should preserve:

- Multi-currency labels for NGN, KES, GHS, ZAR, XOF, XAF, EGP, and USD.
- Payment rail labels for mobile money, bank transfer, cash, card, and supplier credit.
- Informal cash expense review paths.
- Payroll journals from AfroPayroll as a separate review source.
- Accountant review as the final operating handoff.

## Data Boundary

Current demo state is browser-only and uses:

- `afrobooks_finance_os_demo_v1`

The shell also reads existing AfroPayroll local state as a signal for payroll journal creation:

- `afropayroll_pro_saved_runs`
- `afropayroll_pro_workspace_preview`

The CSV import runs in the browser with `FileReader`; it does not upload the file.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroBooks may prepare local draft invoices, expenses, journals, report manifests, and accountant handoff packets.
- AfroBooks does not sync bank feeds.
- AfroBooks does not connect to live accounting systems yet.
- AfroBooks does not file tax returns or remit tax.
- Local demo rows are not account-backed books.

## Backend Schema Needed Next

A production build needs account-backed tables before any live accounting claims:

- `books_clients`
- `books_entities`
- `books_accounts`
- `books_contacts`
- `books_invoices`
- `books_invoice_lines`
- `books_payments`
- `books_expenses`
- `books_expense_documents`
- `books_journals`
- `books_journal_lines`
- `books_payroll_journal_imports`
- `books_tax_reports`
- `books_close_packs`
- `books_accountant_packets`
- `books_currency_rates`
- `books_audit_events`

Recommended boundaries:

- `books_clients.owner_id` should link to the signed-in account.
- `books_entities.client_id` should hold business, school, clinic, NGO, freelancer, or importer profile data.
- `books_accounts` should define the chart of accounts and payment rails.
- `books_invoices` and `books_invoice_lines` should separate invoice headers from billable lines.
- `books_expenses` should track rail, receipt status, review status, and tax category.
- `books_payroll_journal_imports` should reference AfroPayroll runs only when a synced run id exists.
- `books_tax_reports` should remain report-preparation metadata, not tax filing proof.
- `books_accountant_packets` should group exports and reviewer notes.
- `books_audit_events` should record imports, edits, report creation, packet exports, and reviewer status changes.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/books/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
