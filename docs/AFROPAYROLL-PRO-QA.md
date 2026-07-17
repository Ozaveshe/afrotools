# AfroPayroll Pro QA Fixture Harness

This document separates repo validation from live Supabase validation.

Repo validation checks source files, routes, API action coverage, wording guardrails, and package wiring. It does not prove a signed-in customer workflow.

Live QA uses `scripts/afropayroll-pro-qa-fixture.js` to create a tagged fake payroll company, employees, run, comments, approvals, payslip records, statutory review packs, export records, audit events, and an employee portal invite through the real `/api/afropayroll` endpoint. The script defaults to dry-run and must never use real employee names, real salary data, or real customer companies.

## Safety Model

- Default mode is dry-run. Running the script without confirmation does not write data.
- Live API workflow requires `AFROPAYROLL_QA_CONFIRM=1`, `--live`, `AFROPAYROLL_QA_ACCESS_TOKEN`, and either `AFROPAYROLL_QA_USER_ID` or `AFROPAYROLL_QA_EMAIL`.
- The QA identity must clearly be a test identity. Emails must look like QA, test, fixture, sandbox, or `example.com` addresses.
- Cleanup refuses to run in cleanup mode unless `AFROPAYROLL_QA_BATCH_ID` or `--batch` is supplied.
- Cleanup uses only QA fixture tags and related IDs derived from those tags.
- Cleanup is stricter than creation and requires a Supabase service key in the environment for live deletes.
- No service-role key belongs in browser code or committed files.

## Dry-Run

```powershell
npm run afropayroll:qa -- --mode=cycle --dry-run
```

Dry-run prints the intended stages and the generated `qa_batch_id`. It validates the local API contract but does not call the live API or delete rows.

## Live Fixture

Use only a safe QA account. Do not run this against a real customer account.

```powershell
$env:AFROPAYROLL_QA_CONFIRM="1"
$env:AFROPAYROLL_QA_BASE_URL="https://afrotools.com"
$env:AFROPAYROLL_QA_ACCESS_TOKEN="<qa-user-access-token>"
$env:AFROPAYROLL_QA_EMAIL="qa-payroll@example.com"
$env:AFROPAYROLL_QA_BATCH_ID="qa_20260509_manual_001"
npm run afropayroll:qa -- --mode=create --live
```

The live fixture calls the real `/api/afropayroll` endpoint for:

- Schema/API contract presence from local source.
- `save_client`.
- `save_employee`.
- `save_run`.
- `load`.
- `add_comment`.
- `request_approval`.
- `approve_run`.
- `finalize_run`.
- `generate_payslips`.
- `generate_statutory_packs`.
- `record_export` for payment handoff.
- `record_export` for accounting handoff.
- `create_employee_portal_invite`.
- `employee_portal` with the returned invite token.
- `employee_confirm_profile` with a short fake employee note.
- `employee_portal_audit` for payslip viewed/downloaded/printed events.
- `audit`.

Accounting handoff QA should verify the local mapping profile before any live fixture write:

- Default profiles are available: Simple small business, Accountant handoff, and Department summary.
- Mapping fields remain editable for salary expense, allowance expense, overtime expense, employer contribution expense, tax payable, pension/social security payable, net salary payable, and department/cost center.
- Generic, Xero-style, QuickBooks-style, and Sage-style CSV drafts preview debit total, credit total, imbalance, line count, and currency groups before download.
- Missing account codes, required department/cost center gaps, and journal imbalance are visible before export.
- Export records may store accounting profile metadata for a synced run, but no journal is posted and no direct accounting software sync is performed.

Employee portal QA should verify:

- No-token, invalid-token, expired-token, already-confirmed, payslip-not-generated, and loaded states use safe employee-facing wording.
- The portal payload contains only the invited employee, their linked run rows, and their payslip packets.
- Payslip detail view shows company, pay period, pay date, gross, allowances, deductions, net pay, and review note.
- Payslip download is HTML or print view only. Do not call it PDF unless a real PDF renderer is added.
- Profile confirmation can include a short employee note and returns confirmation history after reload.
- Portal load, profile confirmation, payslip view, payslip download, and print view are recorded as token-scoped audit events.

## Cleanup

Dry-run cleanup:

```powershell
$env:AFROPAYROLL_QA_BATCH_ID="qa_20260509_manual_001"
npm run afropayroll:qa -- --mode=cleanup --dry-run
```

Live cleanup:

```powershell
$env:AFROPAYROLL_QA_CONFIRM="1"
$env:AFROPAYROLL_QA_BATCH_ID="qa_20260509_manual_001"
$env:SUPABASE_AUTH_SERVICE_KEY="<service-role-key-from-secret-store>"
npm run afropayroll:qa -- --mode=cleanup --live
```

Cleanup deletes only rows linked to the QA batch tag. It derives tagged client, company, run, and employee IDs first, then removes dependent rows before parent rows:

- Employee portal invites.
- Payroll exports tagged with `metadata.qa_batch_id`.
- Statutory packs for tagged runs.
- Payslips for tagged runs.
- Workspace comments for tagged runs.
- Approvals for tagged runs.
- Run rows for tagged runs.
- Runs with the tagged run key.
- Audit events for tagged clients.
- Employees with tagged external references.
- Companies derived from tagged runs or employees.
- Clients with the tagged QA name.

## Data Created

The fixture uses obviously fake data:

- Company: `[AFROPAYROLL_QA:<qa_batch_id>] Payroll Sandbox Ltd`.
- Employees: `QA Employee One` and `QA Employee Two`.
- Emails: `example.com` QA addresses.
- Payment routes: `QA-ROUTE-*` placeholders.
- Tax and pension IDs: `QA-TAX-*`, `QA-PEN-*`, and `QA-NSSF-*`.
- Payroll period: May 2026.
- Salary numbers are synthetic QA figures only.

No statutory filing, salary payment, bank upload, mobile-money transfer, accounting-system posting, or direct Xero/QuickBooks/Sage sync is performed.

## What This Does Not Test

- Real bank or mobile-money integrations.
- Real statutory filing or remittance.
- Real accounting software posting or direct accounting API sync.
- Real email delivery.
- Employee self-service beyond the v1 invite portal: there is no employee account login, no employee document vault, no email or WhatsApp delivery, and no payment-status confirmation.
- Legal correctness of statutory calculations.
- Cross-user RLS access denial unless a second QA identity is supplied and a separate negative test is added.

## Validation Commands

```powershell
node --check scripts/afropayroll-pro-qa-fixture.js
node --check scripts/afropayroll-role-boundary-smoke.js
npm run test:afropayroll-pro
npm run pro:verify
npm run audit
git diff --check
```

## Browser Regression Pack

The no-login browser regression pack lives at `tests/e2e/afropayroll-pro.spec.js` and runs through the local Playwright static server. It does not require a production login and does not use real salary or employee data.

```powershell
npm run test:afropayroll-pro
```

The pack covers:

- Payroll Pro dashboard, run workspace, employee portal, and support console.
- Desktop and mobile viewport rendering.
- Mocked `/api/afropayroll` states for empty account, saved run, approval pending, finalized/exported run, and audit events.
- Customer-facing labels for saved runs, employee records, payroll imports, approval history, review packs, payment file drafts, accounting journals, and secure invite links.
- Front-facing wording guards so phrases like `Supabase actions`, `account-backed`, `token route`, `service role`, and `internal tool` do not leak into visible UI.
- Basic interactions for local setup save, import mapper opening, employee record creation, payroll row creation, disabled approval actions, and invalid employee invite handling.
- Mobile overflow checks so page bodies do not horizontally scroll and wide tables stay inside scroll containers.

The tests stub `afro-auth.js`, `pro-gate.js`, and `/api/afropayroll` at the browser boundary. They are regression tests for product workflow and wording, not live Supabase tests. Use the QA fixture harness above for live signed-in validation.

## Optional Role Boundary Smoke

The role smoke is local/dry-run by default and checks the API role constants against the expected matrix.

```powershell
node scripts/afropayroll-role-boundary-smoke.js
```

Live role smoke is optional and must use QA fixture users only. It does not create fixture data itself. Create a QA fixture first, invite separate QA users into the fixture client with the target roles, sign in as those users, and provide their access tokens.

```powershell
$env:AFROPAYROLL_QA_BASE_URL="https://afrotools.com"
$env:AFROPAYROLL_QA_RUN_ID="<qa-fixture-run-id>"
$env:AFROPAYROLL_ROLE_SMOKE_LIVE="1"
$env:AFROPAYROLL_QA_TOKEN_VIEWER="<viewer-qa-access-token>"
$env:AFROPAYROLL_QA_TOKEN_APPROVER="<approver-qa-access-token>"
$env:AFROPAYROLL_QA_TOKEN_PAYROLL_ADMIN="<payroll-admin-qa-access-token>"
node scripts/afropayroll-role-boundary-smoke.js
```

Expected boundaries:

- Viewer should not load salary rows or audit data through the workspace API.
- Approver should not save employee or payroll row changes.
- Payroll admin should not invite members.
- Employee portal invite-token access is tested separately from workspace member roles.
