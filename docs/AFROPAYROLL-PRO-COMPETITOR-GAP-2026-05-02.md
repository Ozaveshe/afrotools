# AfroPayroll Pro Competitor Gap Review

Created: 2026-05-02

## Why This Exists

AfroPayroll Pro is not paid-ready if it remains a stronger payslip calculator. Direct African payroll SaaS competitors sell workflow, compliance confidence, employee self-service, payment handoff, reporting, and support. This note turns that competitor review into build priorities.

## Sources Checked

Official product and support pages:

- Workpay homepage and pricing pages: https://www.myworkpay.com/ and https://www.myworkpay.com/pricing
- Workpay payroll help: https://learn.myworkpay.com/en/articles/12002091-all-about-navigating-payroll-on-workpay
- SeamlessHR payroll page: https://seamlesshr.com/payroll-software-for-businesses/
- PaySpace product pages: https://www.payspace.com/ and https://www.payspace.com/payroll-large-business/
- SimplePay features and accountant pages: https://www.simplepay.co.za/features and https://www.simplepay.co.za/for-accountants
- PaidHR payroll support pages: https://support.paidhr.com/en/articles/9019778-payment-configuration and https://support.paidhr.com/en/articles/9018519-how-to-run-payroll-step-1-submit

Forum and voice-of-customer pages:

- Reddit payroll feature discussion: https://www.reddit.com/r/payrollsystem/comments/1mxg0hn/what_payroll_software_features_are_actually_worth/
- Reddit South Africa payroll system question: https://www.reddit.com/r/Payroll/comments/1t0jkqh/can_you_recommend_a_payroll_system_in_south/
- Reddit multi-country payroll discussion: https://www.reddit.com/r/Payroll/comments/1sfd8a1/what_does_your_multi_country_payroll_setup/

## Direct Competitor Feature Baseline

| Competitor | Useful features buyers see |
| --- | --- |
| Workpay | HR plus payroll, employee self-service apps, branded payslips, statutory reports, salary/statutory disbursement, accounting integrations, time and attendance, leave, multi-entity Africa support, outsourced payroll option. |
| SeamlessHR | Payroll computation, multiple payroll runs, tax computation, direct payments, payroll financing, ERP integrations, enterprise security, company and employee management across several locations. |
| PaySpace | Multi-country payroll, statutory reports, employee and manager self-service, APIs, automatic legislative updates, country-specific compliance reporting, multi-currency and multi-language support. |
| SimplePay | Payroll processing, statutory calculations and filing, bank payment files, employee self-service, leave, employee database, accounting integrations, accountant multi-company dashboard. |
| PaidHR | Configurable payroll runs, pay schedules, payroll changes, approvals, automatic payroll submission, proration rules, direct payment narration and payroll processing controls. |

## Forum Painpoints To Build Against

- Users hate double entry between HR, payroll, accounting, and spreadsheets.
- Employee self-service is repeatedly seen as real value because staff can download payslips, update details, and get tax forms without asking payroll admins.
- Multi-country payroll is painful because compliance checks, employee changes, and reporting spread across many systems.
- Small businesses still need simple setup, but they pay when the tool removes repeat monthly admin.
- Accountant and bureau workflows matter because one operator may manage many clients.

## Gap Between Current AfroPayroll Pro And Paid SaaS Expectations

Current AfroPayroll Pro now has a valuable base:

- Run draft workspace.
- Country pack confidence.
- Saved local runs and account sync.
- CSV import.
- Payslip packet generation.
- Statutory draft CSVs.
- Approval request and approve actions.
- Role invite UI.
- Cloud audit trail.
- Dashboard state counts.
- Pro access gate.

But the paid gap is still large:

1. Employee self-service portal.
2. Employee master records with bank, tax, pension, and document fields.
3. Company/client onboarding wizard for recurring runs.
4. Accountant multi-client dashboard.
5. Filing calendar and statutory checklist per country.
6. Payment file and bank/mobile-money handoff.
7. Accounting journal exports and integrations.
8. Email/WhatsApp payslip delivery.
9. Reviewer comments and approval chain by role.
10. Compliance evidence pack with source date, reviewer, and pack version.
11. Run lock/finalize/reopen lifecycle.
12. Notification center for missing employee data, expiring source reviews, and unapproved runs.
13. Import mapping templates and error resolution.
14. Support/admin console for country pack status.

## Moats To Build

1. Africa-first country pack engine: every country has source links, review dates, confidence, language lanes, and clear compliance warnings.
2. Accountant operating mode: multi-client dashboard, roles, approvals, branded packets, and monthly status tracking.
3. Low-bandwidth workflow: CSV-first, local-first draft mode, lightweight exports, and no heavy enterprise setup.
4. Afri-lingual payroll UX: English, French, Swahili, and country-lane terminology without translating official acronyms incorrectly.
5. Compliance evidence trail: every preview result, pack, warning, approval, export, and source review becomes auditable.

## Next Build Commands For Programmer Agents

### Agent 1 - Employee Master Records And Onboarding

Own files:

- `tools/afropayroll-os/workspace.html`
- `assets/js/lib/afropayroll-pro-architecture.js`
- `docs/AFROPAYROLL-PRO-ARCHITECTURE.md`

Build:

- Add an employee master drawer or section with employee ID, email, phone, tax ID, pension/social security number, bank/mobile-money route, employment type, start date, and active/inactive status.
- Let payroll rows link to employee records.
- Add validation badges for missing statutory/payment details.
- Keep sensitive data local unless synced through the existing cloud API.

Validation:

- Workspace inline script parse.
- `node --check assets/js/lib/afropayroll-pro-architecture.js`
- `node scripts/verify-afropayroll-pro-architecture.js`
- `npm run audit`

### Agent 2 - Accountant Multi-Client Dashboard

Own files:

- `tools/afropayroll-os/workspace.html`
- `netlify/functions/api-afropayroll.js`
- `supabase/migrations/036-afropayroll-client-dashboard.sql`

Build:

- Add client selector, client status board, and per-client run list.
- Show ready, needs review, approval, approved, exported, and overdue counts.
- Persist client status through Supabase with RLS and API role checks.

Validation:

- `node --check netlify/functions/api-afropayroll.js`
- Supabase migration syntax review.
- Workspace inline script parse.
- `npm run audit`

### Agent 3 - Filing Calendar And Compliance Pack

Own files:

- `tools/afropayroll-os/workspace.html`
- `data/hr/afropayroll-country-packs.js`
- `assets/js/lib/afropayroll-country-packs.js`

Build:

- Add statutory calendar metadata per full-pack country.
- Render due-date checklist cards by country and pay period.
- Generate a compliance evidence note with pack version, source URLs, review date, warnings, and reviewer fields.

Validation:

- `node --check data/hr/afropayroll-country-packs.js`
- `node --check assets/js/lib/afropayroll-country-packs.js`
- Workspace inline script parse.
- `npm run audit`

### Agent 4 - Payment And Accounting Handoff

Own files:

- `tools/afropayroll-os/workspace.html`
- `assets/js/lib/afropayroll-language-packs.js`

Build:

- Add bank/mobile-money payment file drafts per currency.
- Add accounting journal CSV export by currency, department, allowance, deduction, employer cost, and net pay.
- Add review warnings when employee payment route is missing.

Validation:

- Workspace inline script parse.
- `node --check assets/js/lib/afropayroll-language-packs.js`
- Export smoke check for CSV headers.
- `npm run audit`

### Agent 5 - Employee Self-Service Prototype

Own files:

- `tools/afropayroll-os/employee.html`
- `tools/afropayroll-os/workspace.html`
- `netlify/functions/api-afropayroll.js`

Build:

- Add a lightweight employee portal route for payslip viewing, profile confirmation, and missing-details request.
- Keep access tokenized or account-authenticated. Do not expose another employee's salary data.
- Add workspace action to create employee portal invites for synced runs.

Validation:

- New route HTTP 200.
- Inline script parse for both routes.
- `node --check netlify/functions/api-afropayroll.js`
- `npm run audit`
