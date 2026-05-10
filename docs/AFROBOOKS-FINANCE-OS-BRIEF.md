# AfroBooks Finance OS Brief

Created: 2026-05-02

## Purpose

AfroBooks Finance OS is the Pro finance workspace at:

- `/pro/apps/books/`

It is for African SMEs, freelancers, accountants, schools, clinics, NGOs, traders, and importers that need practical books workflow before deeper account-backed features and accountant collaboration are complete.

The product should feel like paid workflow software, not a calculator page.

## Current Scope

The current workspace includes:

- First-run Business setup.
- Cashflow snapshot.
- Invoices.
- Invoice lines, due dates, payment records, customer balances, receipt notes, and ageing buckets.
- Expenses.
- Expense records, vendors, supplier balances, due dates, receipt notes, tax review labels, and payables ageing.
- Customers.
- Vendors.
- Payroll cost review from saved AfroPayroll signals.
- Payroll journal Import draft from saved AfroPayroll runs or the current payroll draft.
- Seller daily close, seller receivables, and inventory/COGS review Import draft from AfroSeller device records.
- Draft report labels.
- Month close review board.
- Variance notes and unresolved items.
- Receivables and payables.
- Accountant handoff.
- Currency view.

Starter workflows:

- Set up business.
- Add invoice.
- Record payment.
- Add expense or import expenses CSV.
- Review Cashflow.
- Import draft from AfroPayroll or AfroSeller when source records exist.
- Close month.
- Export Accountant packet.

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

The workspace should preserve:

- Multi-currency labels for NGN, KES, GHS, ZAR, XOF, XAF, EGP, and USD.
- Payment rail labels for mobile money, bank transfer, cash, card, and supplier credit.
- Informal cash expense review paths.
- Payroll costs from AfroPayroll as a separate review source.
- Seller daily close and receivables from AfroSeller as separate review sources.
- Accountant review as the final operating handoff.

## Cross-App Finance Handoff

AfroBooks is now the manual finance connector between AfroPayroll and AfroSeller. The route reads source records saved on this device and creates review-only journal drafts.

AfroPayroll source signals:

- Saved payroll runs.
- Current payroll draft.
- Payment and accounting handoff export counts where the payroll workspace has recorded them.

AfroSeller source signals:

- Orders.
- Payment records on orders.
- Saved daily close history.
- Daily close finance handoff notes.
- Product cost and stock records where available for inventory/COGS review.

Import panels:

- Payroll journals.
- Seller daily close.
- Seller receivables.
- Seller inventory/COGS summary.

Journal mappings:

- Payroll expense -> payroll payable.
- Payroll deductions payable.
- Employer contributions.
- Seller revenue.
- Discounts/refunds.
- Payment rail clearing.
- Delivery fees.
- Inventory/COGS review.

Validation checks:

- Source data missing.
- Already imported.
- Currency mismatch.
- Unbalanced journal.
- Source not finalized/closed.

Import log:

- Source app.
- Source date.
- Import date.
- Journal line count.
- Warnings.

Exports:

- `afrobooks-import-journal.csv`: source app, import draft, source date, journal line, debit account, debit amount, credit account, credit amount, currency, warnings, and review note.
- `afrobooks-import-review-note.md`: Finance handoff review note with source limitations.

Account save boundary:

- Import drafts stay saved on this device.
- Import export metadata is added to the AfroBooks export list and can be saved through Save to account when the account workspace exists.
- If an account workspace is selected and review history is available, AfroBooks attempts to record an import audit event through the signed-in session and RLS.
- No service-role key is used in the browser.

Limitations:

- Imports happen only when the user clicks Import draft.
- AfroBooks does not run automatic background sync between apps.
- AfroBooks does not send entries to another finance system.
- AfroBooks does not verify Seller payment settlement.
- AfroBooks does not verify Payroll payment completion.
- Source app rows can be imported while still in review, but the Imports log keeps Review needed warnings visible.

## Month Close Workspace

AfroBooks now includes a Month close workspace for owner, bookkeeper, or accountant review. It is a preparation layer, not filed statements, tax filing, audit assurance, or certified financial statements.

Close period model:

- Month.
- Entity.
- Currency.
- Status: open, review, ready, exported, or reopened.
- Reviewer.
- Notes.
- Readiness state: ready, needs review, or blocked.

Close checklist:

- Invoices reviewed.
- Payments reviewed.
- Expenses reviewed.
- Receipts checked.
- Payroll journal imported.
- Seller daily close imported.
- Cash/mobile-money reviewed.
- Receivables reviewed.
- Payables reviewed.
- Tax review labels checked.
- Accountant packet exported.

Draft reports:

- Profit and loss draft.
- Cashflow review.
- Receivables ageing.
- Payables ageing.
- Expense category summary.
- Payment rail summary.
- Tax review summary.

Variance review:

- Month-over-month revenue.
- Expenses.
- Net cashflow.
- Unpaid balances.
- Missing receipts.

Unresolved items:

- Open close checklist items.
- Receivables warnings.
- Payables warnings.
- Cash review or journal mapping warnings.
- Source app import warnings.

Accountant packet exports:

- Manifest JSON.
- Unresolved items CSV.
- Markdown close note.
- Source app imports summary.
- Draft report list.
- Local close history record.

The Accountant packet manifest lists CSV exports the owner or accountant may also download separately, including customer statement, expense register, import journal, and unresolved items. Packet export records are saved on this device and can be included in Save to account when the account workspace is available.

## Receivables Workflow

AfroBooks invoices now use a receivables workflow instead of a flat invoice tracker.

Customer/contact model:

- Name.
- Phone or email.
- Country.
- Currency.
- Optional Tax/VAT ID review field.
- Notes.

Invoice model:

- Invoice number.
- Customer.
- Issue date.
- Due date.
- Currency.
- Invoice lines.
- Discount.
- Tax review label.
- Status: invoice draft, sent, part-paid, paid, overdue, or cancelled.

Invoice lines:

- Item/service.
- Quantity.
- Unit price.
- Account/category.
- Tax review label.

Payment records:

- Date.
- Amount.
- Rail.
- Reference/proof note.
- Receipt note.
- Partial payment flag.
- Overpayment warning when payment records exceed the invoice amount.

Receivables dashboard:

- Total invoiced.
- Paid.
- Unpaid.
- Overdue.
- Ageing buckets: current, 1-30, 31-60, 61-90, and 90+ days.

Warnings:

- Missing customer contact.
- Overdue invoice.
- Unpaid invoice.
- Payment exceeds invoice.
- Missing category/account.

Receivables exports:

- `afrobooks-customer-statement.csv`: invoice list, payment records, customer balance, status, ageing, and receipt note.
- `afrobooks-receipt-notes.csv`: payment record, invoice number, date, amount, rail, reference/proof note, receipt note, and partial payment flag.

Limitations:

- Payment records are user-entered review records.
- AfroBooks does not collect payment.
- AfroBooks does not verify bank settlement.
- AfroBooks does not claim tax invoice compliance.

## Payables And Spending Workflow

AfroBooks expenses now support a payables workflow for cash, mobile money, bank transfer, card/POS, and supplier credit spending.

Vendor/contact model:

- Vendor name.
- Optional phone or email.
- Country.
- Currency.
- Vendor category.
- Notes.

Expense model:

- Expense record id.
- Date.
- Vendor.
- Category/account.
- Amount.
- Currency.
- Payment rail.
- Paid or unpaid status.
- Due date.
- Receipt status.
- Receipt/proof note.
- Tax review label.

CSV import stays local on the user's device and supports these fields in order:

- Date.
- Vendor.
- Category.
- Amount.
- Rail.
- Receipt status.
- Notes.
- Due date.

Payables dashboard:

- Paid expenses.
- Unpaid expenses.
- Supplier credit.
- Overdue payables.
- Missing receipts.
- Payables ageing: current, 1-30, 31-60, 61-90, and 90+ days.

Validation rules:

- Missing vendor.
- Missing amount.
- Missing category.
- Missing receipt.
- Due date passed.
- Currency mismatch.

Payables exports:

- `afrobooks-expense-register.csv`: expense record, date, vendor, category/account, amount, currency, rail, paid/unpaid, due date, receipt status, receipt note, and tax review label.
- `afrobooks-vendor-balances.csv`: vendor, phone/email, country, category, paid expenses, supplier balance, missing receipts, and overdue payables.
- `afrobooks-missing-receipts.csv`: expense record, date, vendor, amount, rail, receipt status, and receipt note.
- `afrobooks-payables-ageing.csv`: expense record, vendor, due date, ageing bucket, supplier balance, currency, rail, and review note.

Limitations:

- Receipt notes are user-entered. AfroBooks does not claim receipt OCR.
- CSV import is local unless the user later chooses Save to account.
- AfroBooks does not import bank feeds.
- AfroBooks does not claim tax deductibility.

## Product Truth Baseline

Works on this device:

- Business setup, setup completion score, Cashflow snapshot, invoice batch creation, payment recording, expense entry, CSV expense import, customer/vendor lists, payroll cost review, Draft report labels, receivables/payables, currency view, close month, and Accountant packet manifest.
- Saved on this device under `afrobooks_finance_os_demo_v1`.

The workspace also reads existing AfroPayroll saved device signals as a source for payroll cost review:

- `afropayroll_pro_saved_runs`
- `afropayroll_pro_workspace_preview`

The CSV import runs on the user's device; it does not upload the file.

Save to account:

- `/pro/apps/books/` now loads `assets/js/lib/afrobooks-sync.js` as the account save bridge.
- Signed-out users can keep working with Saved on this device.
- Signed-in users can create an account workspace, choose a saved business, Save to account, and Pull from account when the `books_*` tables are available.
- Live inspection on 2026-05-10 found Payroll and Seller account tables, but no live `books_*` tables yet. The bridge must therefore fail gracefully until the migration is applied.
- Account save success must not be claimed unless the signed-in browser session inserts or loads rows through RLS.
- Pull from account exports a device backup first and then replaces the device copy only after Review before replacing is cleared.

## Honest Copy Rules

Keep these rules visible in future iterations:

- Use customer-facing categories: Business setup, Money in, Money out, Invoices, Expenses, Customers, Vendors, Cashflow, Reports, and Accountant packet.
- Avoid internal customer-facing terms such as schema, Supabase actions, shell, debug, localStorage, API posting, and demo state.
- AfroBooks may prepare draft invoices, expenses, payroll cost entries, Draft report manifests, and Accountant packet handoffs.
- AfroBooks does not sync bank feeds.
- AfroBooks does not post to accounting systems yet.
- AfroBooks does not file tax returns or remit tax.
- AfroBooks does not show a verified bank balance.
- Saved on this device is not the same as Save to account.
- Save to account is manual. Do not imply automatic background sync.
- Use Review needed for rows that still require an owner or accountant check.

## First-Run Setup

The `/pro/apps/books/` route now asks for:

- Business or entity name.
- Business type: business, school, clinic, NGO, freelancer, trader, or importer.
- Country.
- Default currency.
- Reporting month.
- Owner or accountant email.
- Default payment rails: mobile money, bank transfer, cash, card, and supplier credit.
- Tax/VAT tracking preference as a review label, not filing.
- Accounting basis: cash, accrual, or simple review mode.

The setup completion score checks:

- Business profile complete.
- Default currency selected.
- Payment rails selected.
- First invoice added.
- First expense added.
- Accountant contact added.
- Close month started.

## Finance Backbone

The route now includes a customer-facing finance backbone so the workspace behaves like simple accounting software while staying approachable for small businesses.

Starter account sets:

- Small retail/shop.
- Freelancer/services.
- School/academy.
- Clinic.
- NGO/project.
- Importer/trader.

Each chart of accounts row carries:

- Account code.
- Account name.
- Account type: income, expense, asset, liability, or equity.
- Default tax review label.
- Active or inactive status.

Money rails:

- Cash.
- Mobile money.
- Bank transfer.
- Card/POS.
- Supplier credit.
- Customer credit.

Category mapping:

- Invoice income category.
- Expense category.
- Payroll liability and expense category.
- Seller daily close category for later AfroSeller close import work.

Journal preview:

- Shows debit and credit accounts.
- Marks each row as Balanced or Review needed.
- Keeps accountant-friendly account codes visible without making them the main workflow.

Validation rules:

- Missing account code.
- Inactive account used.
- Unbalanced journal.
- Currency mismatch.

Exports:

- `afrobooks-chart-of-accounts.csv`: account code, account name, account type, tax review label, status.
- `afrobooks-money-rails.csv`: money rail, account code, account name, status.
- `afrobooks-journal-mapping.csv`: source, debit account, debit amount, credit account, credit amount, status, review note.

These exports are local downloads. They do not post to an accounting system and do not verify bank balances.

### AfroTax Import Review Contract

AfroTax may read `afrobooks_finance_os_demo_v1` when the user manually chooses Import review data inside AfroTax. The handoff is review metadata only:

- Close period and close pack status.
- Accountant packet manifest counts.
- Tax review summaries and draft report labels.
- VAT or sales review rows from invoices.
- Expense category and withholding review rows from expenses.
- Payroll journal imports.
- Seller daily close imports only when they are already recorded in Books imports.
- Source warnings, source period, row count, and currency.

This contract does not mean automatic sync. AfroBooks records are not audited, bank-verified, tax-submitted, or payment-verified records.

## Account Record Set Needed Next

AfroBooks needs account-backed records before any account-save or live accounting claims:

- `books_clients`
- `books_entities`
- `books_team_members`
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
- `books_seller_daily_close_imports`
- `books_tax_reports`
- `books_close_packs`
- `books_accountant_packets`
- `books_currency_rates`
- `books_exports`
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

Schema baseline:

- `supabase/migrations/next-afrobooks-finance-schema.sql` defines the repo-only account-backed baseline.
- `docs/AFROBOOKS-SUPABASE-SCHEMA.md` documents table purpose, local key mapping, RLS role matrix, and apply steps.
- Live Supabase inspection on 2026-05-10 found no `books_*` tables yet. The migration was not applied live in that pass.

## Account Save Bridge

The bridge methods are:

- `isCloudAvailable()`
- `loadWorkspaces()`
- `createWorkspaceFromLocalSnapshot()`
- `saveLocalSnapshot()`
- `loadWorkspaceSnapshot()`
- `recordExport()`
- `recordAuditEvent()`

What saves to account:

- Business/entity profile.
- Chart of accounts starter rows.
- Customers, vendors, and accountant contacts.
- Invoices and invoice lines.
- Payments recorded by the user.
- Expenses.
- Payroll review journals and journal lines.
- Close packs.
- Accountant packets.
- Export records.

What remains browser-first:

- Working while signed out.
- CSV parsing on the user's device.
- Backup export before pulling account data.
- Free calculator and document tool links.
- User-entered currency, rail, expense, and balance review labels.

Conflict behavior:

- Device copy newer.
- Account copy newer.
- Record count mismatch.
- Currency mismatch.

The route must show Review before replacing and require another deliberate click before replacing either side.

## QA Baseline

Use `docs/AFROBOOKS-QA.md` and `scripts/afrobooks-qa-fixture.js` before deeper feature work.

Default fixture mode is dry-run. Live fixture mode requires a safe QA email, a fixture tag, explicit confirmation, and an existing AfroBooks account record set. Cleanup deletes only records matching the fixture tag.

## Validation

After changing this workspace, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/books/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
node --check scripts/afrobooks-qa-fixture.js
node --check scripts/verify-afrobooks-pro.js
npm run pro:verify
```
