# AfroHR Supabase Schema

Updated: 2026-05-10

## Purpose

`supabase/migrations/next-afrohr-people-schema.sql` defines the account-backed record model for AfroHR People OS. It is the next step after the current device-saved route at `/pro/apps/hr/`.

This is a repo migration only until a live apply is explicitly approved.

## Live Project Baseline

Live Supabase was inspected first on 2026-05-10 with the configured Supabase MCP tools. The project has existing Payroll tables such as `payroll_employees` and `payroll_runs`, but no `hr_*` tables were present during inspection.

The migration was not applied live in this pass.

## Tenancy Model

AfroHR uses a client/workspace model:

- `hr_clients` is the tenant root. It owns the People OS workspace and stores the signed-in owner.
- `hr_organizations` are employers, schools, clinics, NGOs, freelancer teams, agencies, or accountant-managed clients inside a workspace.
- `hr_team_members` grants user access to a client.
- Every People table carries `client_id`; organization-scoped tables also carry `organization_id`; employee-scoped tables carry `employee_id`.
- Composite foreign keys keep organization and employee links inside the same `client_id`.
- Payroll links are optional references only. They do not create Payroll writes.

## Local Key Mapping

Current device-saved route data maps into the future account-backed tables like this:

- `afrohr_people_os_demo_v1` organization setup -> `hr_clients` and `hr_organizations`.
- Employee identity and role fields -> `hr_employees`: employee code, full name, preferred name, email, phone, country, department, role/title, manager, employment type, start date, probation end date in profile, and status.
- Emergency, personal, next-of-kin, and work contacts -> `hr_employee_contacts`.
- Payroll readiness fields -> `hr_employee_payroll_profiles`: tax ID status, pension/social security status, payment route status, pay schedule, default currency, optional linked Payroll employee ID, readiness score, and readiness snapshot.
- Contract records and metadata -> `hr_contracts`.
- Letter drafts -> `hr_letters`.
- Leave items -> `hr_leave_requests`.
- Attendance notes -> `hr_attendance_events`.
- Onboarding checklist items -> `hr_onboarding_tasks`.
- Document checklist metadata and storage references -> `hr_document_vault_items`.
- Missing-detail requests -> `hr_missing_detail_requests`.
- Payroll handoff draft summaries -> `hr_payroll_handoffs`.
- People packet and setup reports -> `hr_people_reports`.
- Create, update, delete, review, export, and handoff activity -> `hr_audit_events`.

The mapping must stay explicit in the future browser save layer. No service-role key belongs in browser code.

## Account Save Bridge

`assets/js/lib/afrohr-sync.js` is the browser bridge between the device-saved People OS workspace and the account-backed tables documented here.

The bridge exposes:

- `isCloudAvailable()`
- `loadOrganizations()`
- `createOrganizationFromLocalSnapshot()`
- `saveLocalSnapshot()`
- `loadOrganizationSnapshot()`
- `recordAuditEvent()`

The route at `/pro/apps/hr/` stays browser-first:

- Signed-out users can keep using the workspace saved on this device.
- Save to account runs only after the user clicks an account action.
- Pull from account downloads a device backup before replacing the device copy.
- Save and pull both surface Review before replacing when the device copy is newer, the account copy is newer, employee counts differ, Payroll readiness differs, or document checklist counts differ.
- The bridge uses the signed-in browser session and RLS policies. It does not use elevated credentials in browser code.

What Save to account covers:

- Organization profile.
- Employee identity, contact, role, manager, employment status, start date, and probation review details.
- Employee contact records.
- Payroll readiness profiles and review snapshots, including pay schedule, default currency, payment-route status, and optional linked Payroll employee ID.
- Onboarding tasks.
- Leave requests.
- Attendance events.
- Letter drafts.
- Document metadata and optional storage references.
- Missing-detail requests.
- Payroll handoff drafts.
- People reports and packet export metadata.
- Review history when an audit row can be recorded safely.

Still browser-first:

- Employee data created while signed out.
- Payroll employee records read from `afropayroll_pro_employee_master`.
- People packet downloads.
- Device backup downloads.
- Document checklist entries and file references until upload storage is designed.

The bridge is intentionally not automatic sync. Users choose when to save or pull.

## Payroll Relationship

AfroHR reads Payroll employee records from the current device key `afropayroll_pro_employee_master` today.

The account-backed schema keeps Payroll relationships as references:

- `hr_employee_payroll_profiles.payroll_employee_id` can point to `payroll_employees.id`.
- `hr_payroll_handoffs.payroll_run_id` can point to `payroll_runs.id`.
- `payroll_reference_label`, readiness snapshots, and handoff notes store review context.
- The optional linked Payroll employee ID in the browser workspace is saved as reference context only unless a future reviewed Payroll handoff flow maps it to `payroll_employee_id`.

These references do not mean automatic Payroll sync. A future Payroll handoff must be a user-approved action with review, confirmation, and audit history before any Payroll write path is built.

## Tables

- `hr_clients`: workspace root and owner.
- `hr_organizations`: employer, school, clinic, NGO, freelancer team, agency, or accountant-managed client profile.
- `hr_team_members`: roles and invitations for a workspace.
- `hr_employees`: Employee records and employment status.
- `hr_employee_contacts`: emergency, personal, next-of-kin, and work contact records.
- `hr_employee_payroll_profiles`: Payroll readiness and optional Payroll employee reference.
- `hr_contracts`: contract metadata and review state.
- `hr_letters`: letter drafts and review state.
- `hr_leave_requests`: Leave requests, review decisions, and date ranges.
- `hr_attendance_events`: attendance notes and event dates.
- `hr_onboarding_tasks`: Onboarding checklist items.
- `hr_document_vault_items`: document metadata and optional storage references only.
- `hr_missing_detail_requests`: fields requested from an employee or manager.
- `hr_payroll_handoffs`: Payroll handoff draft summaries for review.
- `hr_people_reports`: People reports and export snapshots.
- `hr_audit_events`: tenant-scoped action history.

## Roles

The schema supports:

- `owner`
- `admin`
- `hr_admin`
- `payroll_admin`
- `accountant`
- `reviewer`
- `viewer`

## RLS Helpers

Helper functions live in the private schema:

- `private.hr_user_role(client_id)`
- `private.hr_can_access(client_id)`
- `private.hr_can_edit_people(client_id)`
- `private.hr_can_review(client_id)`
- `private.hr_can_manage(client_id)`

RLS is enabled and forced on every `hr_*` table in this migration.

## RLS Role Matrix

| Role | Read | Edit people records | Review reports and handoffs | Manage workspace/team | Delete |
| --- | --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes | Yes |
| hr_admin | Yes | Yes | Yes | No | No |
| payroll_admin | Yes | No | Yes | No | No |
| accountant | Yes | No | Yes | No | No |
| reviewer | Yes | No | Yes | No | No |
| viewer | Yes | No | No | No | No |

Notes:

- A client can be created only by its signed-in owner.
- Owner access is derived from `hr_clients.owner_id`.
- Team access is derived from active rows in `hr_team_members`.
- All row policies check `client_id`, so employee data is not exposed across tenants.
- People editors can insert and update Employee records, contacts, Onboarding, and document metadata.
- Review roles can work on Payroll readiness, contracts, letters, Leave, attendance, missing-detail requests, handoff drafts, and People reports.
- Only workspace managers can delete through browser-user RLS.

## Constraints and Statuses

The migration uses check constraints for high-risk states:

- Employee status: `draft`, `onboarding`, `active`, `on_leave`, `inactive`, `terminated`, `archived`.
- Employment type: `employee`, `contractor`, `casual`, `intern`, `director`, `volunteer`, `freelancer`, `consultant`, `other`.
- Leave status: `draft`, `requested`, `Review needed`, `approved`, `rejected`, `cancelled`, `taken`, `archived`.
- Letter and contract status: `draft`, `Review needed`, `Ready`, `sent`, `accepted`, `void`, `archived`.
- Handoff status: `draft`, `Review needed`, `Payroll handoff draft`, `Ready`, `exported`, `accepted`, `cancelled`, `archived`.
- Document status: `requested`, `Review needed`, `received`, `verified`, `expired`, `archived`.

Leave requests also require `end_date >= start_date`, and readiness scores must stay between 0 and 100.

## Indexing

The migration adds indexes for:

- owner and client status lookup.
- team role and status lookup.
- organization status and country lookup.
- employee organization, employee code, and status lookup.
- employee contacts and Payroll readiness lookup.
- Leave, attendance, onboarding, document, and missing-detail review queues.
- Payroll handoff period/status queries.
- People report period/status queries.
- audit queries by client, record, employee, and created time.

## Audit Strategy

`public.hr_audit_row_change()` writes an audit event after insert, update, or delete on the mutable People tables.

The audit event records:

- client id
- optional organization id
- optional employee id
- actor id from the signed-in session
- event type
- table name
- record id
- action
- source metadata

`hr_audit_events` is append-oriented for product and database activity. Review-capable roles can read audit events for clients they can access.

## Document Storage References

`hr_document_vault_items` stores document metadata plus optional `storage_bucket`, `storage_path`, and `checksum` references.

This migration does not create a storage bucket, upload UI, retention policy, or file deletion flow. The product must not claim file upload or cloud document storage until that is built and verified.

## What This Schema Does Not Prove

- No live migration was applied by this documentation.
- No automatic Payroll record changes.
- No document upload or storage bucket.
- No e-signature.
- No labor-law compliance guarantee.
- No contract certification.
- No statutory HR filing.
- No employee consent proof.
- No generated Supabase types are committed yet.
- No browser use of service-role credentials.

## Apply Steps

Do not apply this migration to live production until the user explicitly approves it.

Recommended live apply flow:

```powershell
# 1. Review the migration text.
node scripts/verify-afrohr-pro.js

# 2. Apply through the approved Supabase workflow only after approval.
# Use Supabase MCP apply_migration or the Supabase CLI from a clean release branch.

# 3. Re-run advisors after apply.
# Supabase MCP: get_advisors(security), get_advisors(performance)

# 4. Re-run repo checks.
npm run pro:verify
npm run audit
```

## Later Phases

- Generated Supabase types.
- Safe QA fixture live smoke with a safe QA user after the account record set is applied.
- Document upload storage design and policies.
- Payroll handoff confirmation flow.
- Team invite flow.
- People report views or RPCs after the base RLS model is exercised.
