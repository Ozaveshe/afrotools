# AfroHR People OS Brief

Created: 2026-05-02

## Purpose

AfroHR People OS is the Pro HR companion workspace for AfroPayroll at:

- `/pro/apps/hr/`

It is for founders, payroll admins, accountants, schools, clinics, NGOs, and small teams that need employee records, onboarding, leave, documents, and payroll-readiness workflows before a full HR backend exists.

The product should feel like paid people-operations software, not a calculator page.

## Current Scope

The first shell includes:

- Employee records.
- Contracts and letters.
- Leave and attendance.
- Onboarding checklist.
- Document vault.
- Payroll readiness.
- Missing employee details.
- HR compliance notes.
- Links to AfroPayroll workspace and the leave calculator.

Starter workflows:

- Onboard employee.
- Request missing payroll details.
- Generate employment letter.
- Track leave.
- Send to payroll.

## Payroll Read Boundary

The shell reads existing AfroPayroll local employee-master state when it is available:

- `afropayroll_pro_employee_master`

This read is used only to display employee count, payroll readiness, and missing-detail signals. AfroHR must not mutate this Payroll key during automatic page load.

The current "Send to payroll" action creates an AfroHR-local handoff record only. It does not write to Payroll storage or submit employee data to an API.

## Data Boundary

Current demo state is browser-only and uses:

- `afrohr_people_os_demo_v1`

Sensitive HR data, document metadata, missing-detail requests, leave rows, and letter drafts stay local-only in this shell unless a future supported API clearly exists.

No document upload occurs in the current shell. The document vault stores demo metadata only.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroHR may prepare local employee records, onboarding tasks, missing-detail requests, document manifests, leave rows, and payroll handoff drafts.
- AfroHR does not currently provide cloud HR storage.
- AfroHR does not submit statutory HR filings.
- AfroHR does not guarantee labor-law compliance.
- AfroHR does not mutate AfroPayroll employee-master data unless a user explicitly triggers a future supported action.
- Local demo rows are not account-backed HR records.

## Backend Schema Needed Next

A production build needs account-backed tables before any live HR or payroll-readiness claims:

- `hr_clients`
- `hr_organizations`
- `hr_employees`
- `hr_employee_contacts`
- `hr_employee_payroll_profiles`
- `hr_contracts`
- `hr_letters`
- `hr_leave_requests`
- `hr_attendance_events`
- `hr_onboarding_tasks`
- `hr_document_vault_items`
- `hr_missing_detail_requests`
- `hr_payroll_handoffs`
- `hr_compliance_notes`
- `hr_audit_events`

Recommended boundaries:

- `hr_clients.owner_id` should link to the signed-in account.
- `hr_organizations.client_id` should separate employer or branch details from account metadata.
- `hr_employees.organization_id` should hold worker identity, role, country, employment type, and status.
- `hr_employee_contacts` should isolate personal contact and emergency-contact fields.
- `hr_employee_payroll_profiles.employee_id` should store Payroll readiness fields and reference Payroll only when a synced Payroll employee id exists.
- `hr_contracts` and `hr_letters` should store template metadata, reviewer status, generated-at timestamps, and document status.
- `hr_leave_requests` and `hr_attendance_events` should keep leave, attendance, approval, and period metadata separate.
- `hr_document_vault_items` should store file metadata and storage references only after a storage policy exists.
- `hr_missing_detail_requests` should record requested fields, delivery channel, status, and resolved-at timestamps.
- `hr_payroll_handoffs` should group employees and readiness checks sent toward AfroPayroll.
- `hr_audit_events` should record imports, field edits, letter generation, leave changes, requests, document changes, and payroll handoff actions.

## API Needed Next

Recommended API surface after schema and RLS exist:

- `GET /api/hr?action=dashboard`
- `GET /api/hr?action=employees`
- `POST /api/hr?action=save_employee`
- `POST /api/hr?action=request_details`
- `POST /api/hr?action=generate_letter`
- `POST /api/hr?action=record_leave`
- `POST /api/hr?action=create_payroll_handoff`

These APIs should require an authenticated Pro account, organization-level authorization, field-level validation for sensitive employee data, and audit-event writes for every mutation.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/hr/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
