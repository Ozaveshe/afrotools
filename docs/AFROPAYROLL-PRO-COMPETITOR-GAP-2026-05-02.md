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

## Current Readiness Audit - 2026-05-09

This audit reflects the current repo state after the setup, employee master, import, close-room approval, recurring run, statutory review pack, payment/accounting handoff, QA fixture, role-boundary, browser regression, language, employee portal, reminder center, and country-pack support workflow passes. It is a repo and local-smoke audit only; no live Supabase test data was inserted.

Current readiness score: **84 / 100**

Previous score before prompts 11-19 and the final controller pass: **78 / 100**

The product now reads as a serious Africa-first payroll operations workspace, but it is not yet a fully paid-ready payroll SaaS. The strongest areas are setup, employee master, imports, approval workflow, recurring runs, statutory review packs, payment/accounting handoff drafts, role documentation, local QA harnesses, browser regression coverage, audit intent, and compliance honesty. The weaker areas are live end-to-end signed-in QA, employee self-service depth, actual payslip delivery, live RLS proof across multiple users, provider-specific export formats, and real integrations.

| Area | Score | Current state |
| --- | ---: | --- |
| Onboarding | 8/10 | Guided setup, completion score, create-first-run action, local/account labels. |
| Employee master | 8/10 | Durable local records, account save/list API, readiness badges, link-to-run actions. |
| Payroll run creation | 8/10 | Workspace supports clean run header, rows, locks, history, and first-month setup. |
| Payroll calculations | 6/10 | Launch-country preview engines and estimate fallback; still requires current statutory/rate review before reliance. |
| Imports | 8/10 | CSV/TSV/browser-Excel mapper, templates, validation, preview, apply-valid-only, error report, undo. |
| Recurring runs | 7/10 | Start-from-previous-run and variance review exist; needs broader signed-in smoke. |
| Approvals | 8/10 | Draft, review, approved, finalized, exported, reopened flow with comments/checklist/audit hooks. |
| Employee portal | 7/10 | Token route supports assigned payslip packet viewing/print, profile confirmation state, safe invalid-token states, and admin visibility; it is still not a full employee app. |
| Payslips | 7/10 | Payslip packets and synced records exist; delivery/email/WhatsApp are not implemented. |
| Statutory review packs | 8/10 | NG/KE/GH/ZA differentiated review packs with source links, dates, warnings, and CSV/Markdown/HTML. |
| Payment handoff | 7/10 | Bank/mobile-money/grouped drafts and exception report exist; no provider integration or payout confirmation. |
| Accounting handoff | 8/10 | Editable chart-of-accounts mapping, balanced journal preview, and generic/Xero/QuickBooks/Sage-style import-ready CSV labels; no API posting. |
| Audit trail | 7/10 | Account-saved actions write audit records; live proof depends on a safe signed-in test account. |
| Roles/permissions | 8/10 | RBAC model, API checks, verifier guards, and role-boundary smoke harness exist; needs full live RLS policy proof with QA users. |
| Dashboard | 8/10 | Pro dashboard and workspace metrics reflect setup/readiness/workflow/reminders; needs more production data examples. |
| Mobile usability | 7/10 | Main pages have responsive layouts and browser regression coverage; still needs more real-device review. |
| Localization | 8/10 | EN/FR/SW language helper coverage exists for core Payroll Pro sections; some data-driven labels remain intentionally sourced from country packs. |
| Compliance honesty | 9/10 | UI consistently says review/draft/handoff and avoids filing, payment, remittance, and certification claims. |
| Security posture | 7/10 | Service-role stays server-side, tokens are hashed server-side, signed-out API returns 401; needs live RLS smoke. |
| Support/admin pack health | 8/10 | Pro-gated support console shows pack health and review metadata; no live admin update workflow yet. |

Blocking gaps:

- No safe live test user was used in this pass, so account save/load, RLS, and audit persistence were not live-tested against live data.
- Employee portal is token-based and scoped to assigned payroll packets; it is not a complete employee self-service product.
- Statutory rates/source dates were not changed in this pass and still require scheduled expert review before paid reliance.

Paid-ready gaps:

- Live signed-in QA run with seeded non-sensitive test data and cleanup, using the existing dry-run-safe harness.
- Live role-boundary proof for owner, admin, payroll_admin, accountant, approver, and viewer.
- Provider-verified bank/mobile-money layout profiles and validation rules, still without moving money.
- Payslip delivery workflow with email/WhatsApp claims kept off until actually implemented.
- Production demo fixture or demo account that uses fake data and does not touch customer records.

Nice-to-have gaps:

- Accountant bureau mode with client folders and client-level reporting.
- Employee document attachments and leave/default benefit settings.
- Dashboard demo data mode for first-time Pro buyers.
- Account-saved reminder acknowledgements if a scoped schema path is approved.
- Export package bundling by client, country, and period.

Top 10 next backlog items to reach 85-90%:

1. Run the safe QA fixture against a dedicated test user and archive the live evidence separately from repo validation.
2. Run the role-boundary smoke with dedicated QA users for owner, admin, payroll_admin, accountant, approver, and viewer.
3. Add a demo-safe company/run fixture for founder reviews and buyer screenshots, using fake people and fake pay data only.
4. Add account-saved reminder acknowledgements if a scoped schema path is approved.
5. Add provider-specific bank/mobile-money/accounting export profiles only after official, current format documentation is verified.
6. Promote payslip output from HTML/print packet to PDF-grade generation if customer interviews require PDFs.
7. Run current official-source review for NG/KE/GH/ZA and keep South Africa engine-year warnings honest.
8. Add real-device mobile review for the workspace and employee portal beyond automated viewport checks.
9. Add CI wiring so `npm run pro:verify` and the payroll browser regression run before Pro deploys.
10. Add client-facing onboarding/demo copy for the parts that remain local-only until signed in.

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
