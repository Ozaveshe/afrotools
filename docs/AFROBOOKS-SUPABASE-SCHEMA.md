# AfroBooks Supabase Schema

Updated: 2026-05-10

## Purpose

`supabase/migrations/next-afrobooks-finance-schema.sql` defines the account-backed data model for AfroBooks Finance OS. It is the next step after the current device-saved route at `/pro/apps/books/`.

This is a repo migration only until a live apply is explicitly approved.

## Live Project Baseline

Live Supabase was inspected first on 2026-05-10. The project has Payroll and Seller account tables, but no `books_*` tables yet.

The migration was not applied live in this pass.

## Tenancy Model

AfroBooks uses a client/workspace model:

- `books_clients` is the tenant root. It owns the workspace and stores the signed-in owner.
- `books_entities` are the business, school, clinic, NGO, freelancer, trader, importer, or project finance files inside a client.
- `books_team_members` grants user access to a client.
- Every finance table carries `client_id`; entity-scoped tables also carry `entity_id`.
- Validation triggers reject cross-client links such as an invoice line attached to an invoice from another client.

## Local Key Mapping

Current device-saved route data maps into the schema like this:

- `afrobooks_finance_os_demo_v1` -> `books_clients`, `books_entities`, `books_accounts`, `books_contacts`, `books_invoices`, `books_invoice_lines`, `books_payments`, `books_expenses`, `books_journals`, `books_tax_reports`, `books_close_packs`, `books_accountant_packets`, `books_currency_rates`, and `books_exports`.
- `afropayroll_pro_saved_runs` -> `books_payroll_journal_imports` and draft `books_journals`.
- `afropayroll_pro_workspace_preview` -> `books_payroll_journal_imports` and draft `books_journals`.
- `afroseller_social_commerce_os_v1` daily close history -> `books_seller_daily_close_imports` and draft `books_journals`.

The mapping must stay explicit in the browser sync layer. No service-role key belongs in browser code.

## Account Save Bridge

`assets/js/lib/afrobooks-sync.js` is the browser bridge between the device-saved workspace and the account-backed tables documented here.

The bridge exposes:

- `isCloudAvailable()`
- `loadWorkspaces()`
- `createWorkspaceFromLocalSnapshot()`
- `saveLocalSnapshot()`
- `loadWorkspaceSnapshot()`
- `recordExport()`
- `recordAuditEvent()`

The route at `/pro/apps/books/` stays browser-first:

- Signed-out users can keep using the workspace saved on this device.
- Save to account runs only after the user clicks an account action.
- Pull from account exports a device backup before replacing the device copy.
- Save and pull both surface Review before replacing when the device copy is newer, the account copy is newer, record counts differ, or the currency differs.
- The bridge uses the signed-in browser session and RLS policies. It does not use elevated credentials in browser code.

What Save to account covers:

- Business/entity profile.
- Chart of accounts starter rows, account type, tax review label, and active/inactive metadata.
- Customers, vendors, and accountant contacts.
- Invoices and invoice lines.
- Recorded payments.
- Expenses.
- Payroll review journals and journal lines.
- Close packs.
- Accountant packets.
- Export records.

Finance backbone mapping:

- `books_accounts` receives the active chart of accounts selected in the route.
- Account metadata stores the tax review label and active/inactive flag.
- `books_clients.settings` carries the selected starter account set, money rail mapping, and category mapping.
- Invoice metadata carries the income account code used by the simple journal preview.
- Expense metadata carries the expense account code used by the simple journal preview.
- Payroll journal lines use the payroll expense and payroll payable account codes from the device workspace.
- Money rails remain user-entered or imported review labels. They are not verified bank balances.

Receivables mapping:

- Customer contacts save to `books_contacts` with phone, email, country, optional Tax/VAT ID review label, and notes metadata.
- Invoice drafts save to `books_invoices` with invoice number, customer, issue date, due date, currency, discount, tax review label metadata, and status.
- Invoice lines save to `books_invoice_lines` with item/service description, quantity, unit price, account/category metadata, and tax review label metadata.
- Payment records save to `books_payments` with date, amount, rail, reference/proof note, receipt note metadata, and partial-payment metadata.
- Customer statements and receipt note exports are local CSV downloads and optional `books_exports` metadata when the user chooses Save to account.

Still browser-first:

- CSV import parsing.
- Device backup exports.
- Free tool links and calculators.
- User-entered payment, expense, and balance review labels.
- Any work created while signed out.

The bridge is intentionally not automatic sync. Users choose when to save or pull.

## Tables

- `books_clients`: workspace root and owner.
- `books_entities`: business or entity finance file.
- `books_team_members`: roles and invitations for a workspace.
- `books_accounts`: chart of accounts and user-entered or imported balance review records.
- `books_contacts`: customers, vendors, accountants, and other trade contacts.
- `books_invoices`: invoice headers.
- `books_invoice_lines`: invoice billable lines.
- `books_payments`: manual or imported payment records. These are not verified settlement records.
- `books_expenses`: expense rows, including cash and supplier credit review.
- `books_expense_documents`: receipt/document metadata only. No storage bucket is created yet.
- `books_journals`: draft finance journals for review.
- `books_journal_lines`: debit and credit rows for draft journals.
- `books_payroll_journal_imports`: AfroPayroll review imports.
- `books_seller_daily_close_imports`: AfroSeller daily close review imports.
- `books_tax_reports`: Draft report metadata for tax/VAT review. Not filing proof.
- `books_close_packs`: close month checklist and review state.
- `books_accountant_packets`: Accountant packet manifests.
- `books_currency_rates`: manual, imported, or review-adjusted currency rates.
- `books_exports`: export metadata for CSV, JSON, PDF, Markdown, or XLSX outputs.
- `books_audit_events`: audit trail for create, update, delete, import, export, review, status, and close-month actions.

## Roles

The schema supports:

- `owner`
- `admin`
- `bookkeeper`
- `accountant`
- `reviewer`
- `viewer`

## RLS Helpers

Helper functions live in the private schema:

- `private.books_user_role(client_id)`
- `private.books_can_access(client_id)`
- `private.books_can_edit(client_id)`
- `private.books_can_review(client_id)`
- `private.books_can_manage(client_id)`

RLS is enabled on every `books_*` table.

## RLS Role Matrix

| Role | Read | Edit records | Review reports/close | Manage team/client | Delete |
| --- | --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes | Yes |
| bookkeeper | Yes | Yes | No by default | No | No |
| accountant | Yes | Yes | Yes | No | No |
| reviewer | Yes | No | Yes | No | No |
| viewer | Yes | No | No | No | No |

Notes:

- `books_clients` can be created only by the signed-in owner.
- Owner membership is inserted automatically after client creation.
- Managers can invite or disable team members.
- Editors can insert and update working finance records.
- Reviewers can update Reports, close packs, Accountant packets, exports, and other review-safe surfaces.
- Only managers can delete records through browser-user RLS.

## Audit Strategy

The migration creates `public.books_audit_row_change()` and attaches it to account-backed tables. The trigger writes:

- client id
- optional entity id
- actor id from the signed-in user
- event type
- table name
- row id
- old row JSON for update/delete
- new row JSON for insert/update

`books_audit_events` is append-oriented from product code. Users can read audit events for clients they can access.

## Constraints and Statuses

The migration uses check constraints instead of broad free-text states:

- Invoice status: `draft`, `sent`, `partial`, `paid`, `overdue`, `void`, `archived`.
- Payment status: `pending`, `recorded`, `matched`, `void`, `refunded`.
- Expense status: `Draft`, `Review needed`, `Ready`, `Reimbursed`, `Archived`.
- Close pack status: `Draft`, `Review needed`, `Ready`, `Closed`, `Archived`.
- Export type: invoice, expense, cashflow, journal, tax review report, Accountant packet, close pack, or audit log.

Tax reports stay in `Draft report`, `Review needed`, `Ready`, or `Archived` states and include `filing_status = not_filed_by_afrobooks` by default.

## What This Schema Does Not Prove

- No bank sync.
- No verified bank balances.
- No accounting API posting.
- No tax filing.
- No tax remittance.
- No payment settlement verification.
- No receipt/document storage bucket yet.
- No generated types are committed yet.
- No browser use of service-role credentials.

## Apply Steps

Do not apply this migration to live production until the user explicitly approves it.

Recommended live apply flow:

```powershell
# 1. Review the migration text.
node scripts/verify-afrobooks-pro.js

# 2. Apply through the approved Supabase workflow.
# Use Supabase MCP apply_migration or the Supabase CLI from a clean release branch.

# 3. Re-run advisors after apply.
# Supabase MCP: get_advisors(security), get_advisors(performance)

# 4. Re-run repo checks.
npm run pro:verify
npm run audit
```

## Later Phases

- Generated Supabase types.
- Receipt/document upload bucket and storage policies.
- Import conflict handling.
- Accountant invite flow.
- Dashboard views or RPCs after the base RLS model has been exercised.
