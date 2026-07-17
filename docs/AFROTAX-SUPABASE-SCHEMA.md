# AfroTax Supabase Schema

Updated: 2026-05-10

## Purpose

`supabase/migrations/next-afrotax-compliance-schema.sql` defines the account-backed data model for AfroTax Compliance OS. It is the next step after the current device-saved route at `/pro/apps/tax-compliance/`.

This is a repo migration only until a live apply is explicitly approved.

`assets/js/lib/afrotax-sync.js` is the browser bridge between the device-saved workspace and the account-backed tables documented here.

## Live Project Baseline

Live Supabase was inspected first on 2026-05-10. The project already has account-backed Payroll and Seller tables, and no `tax_*` tables were present in the inspected public table list.

The migration was not applied live in this pass.

## Tenancy Model

AfroTax uses a client/workspace model:

- `tax_clients` is the tenant root. It stores the signed-in owner, default country, default currency, tax period preference, and source review preference.
- `tax_company_profiles` stores the company, accountant client, NGO, school, clinic, seller, or multi-country operator profile inside a client.
- `tax_team_members` grants user access to a client.
- Every working table carries `client_id`.
- Validation triggers reject cross-client links such as an Evidence pack attached to an obligation from another client.

## Local Key Mapping

Current device-saved route data maps into account records like this:

- `afrotax_compliance_os_demo_v1` -> `tax_clients`, `tax_company_profiles`, `tax_country_packs`, `tax_obligations`, `tax_deadlines`, `tax_workflow_items`, `tax_evidence_packs`, `tax_evidence_documents`, `tax_source_reviews`, `tax_review_checklists`, `tax_review_comments`, `tax_export_packets`, and `tax_audit_events`.
- `afropayroll_pro_saved_runs` -> `tax_cross_app_imports`, draft `tax_obligations`, draft `tax_deadlines`, and source review notes.
- `afropayroll_pro_workspace_preview` -> `tax_cross_app_imports`, draft Evidence pack summaries, and source review notes.
- `afrobooks_finance_os_demo_v1` close packs -> `tax_cross_app_imports` and `tax_evidence_packs` when manually imported for review.
- `afrobooks_finance_os_demo_v1` tax review summaries -> `tax_cross_app_imports`, `tax_review_checklists`, and `tax_export_packets` when manually imported for review.
- `afrobooks_finance_os_demo_v1` payroll journals -> `tax_cross_app_imports` and review notes when manually imported for review.
- AfroSeller daily close summaries should reach AfroTax through AfroBooks review imports, then land in `tax_cross_app_imports`.

The mapping must stay explicit in product code. No service-role key belongs in browser code.

## Account Save Bridge

`assets/js/lib/afrotax-sync.js` exposes:

- `isCloudAvailable()`
- `loadWorkspaces()`
- `createWorkspaceFromLocalSnapshot()`
- `saveLocalSnapshot()`
- `loadWorkspaceSnapshot()`
- `recordExport()`
- `recordAuditEvent()`

The route at `/pro/apps/tax-compliance/` stays browser-first:

- Signed-out users can keep using the workspace saved on this device.
- Save to account runs only after the user clicks an account action.
- Pull from account downloads a device backup before replacing the device copy.
- Save and pull both surface Review before replacing when the device copy is newer, the account copy is newer, deadline counts differ, Evidence pack counts differ, or Accountant handoff packet counts differ.
- The bridge uses the signed-in browser session and RLS policies. It does not use elevated credentials in browser code.

What Save to account covers:

- Client/company profile.
- Selected obligations.
- Tax calendar deadlines.
- Workflow items.
- Evidence packs.
- Evidence document metadata.
- Source reviews.
- Review checklists.
- Review comments.
- Accountant handoff export packets.
- Cross-app import records from AfroPayroll, AfroBooks, and AfroSeller-through-Books flows.

Still browser-first:

- First-run setup while signed out.
- Tax calendar preview generation.
- Evidence pack notes and backup downloads.
- Review checklist toggles.
- Source review notes.
- Accountant handoff packet preparation.
- AfroPayroll source-signal reads from the device.

The bridge is intentionally not automatic sync. Users choose when to save or pull.

## Tables

- `tax_clients`: workspace root and owner.
- `tax_company_profiles`: company or client profile for the tax workspace.
- `tax_team_members`: roles and invitations for a workspace.
- `tax_country_packs`: country lane metadata, source review cadence, and support status.
- `tax_obligations`: PAYE, VAT, income tax, social security, withholding, annual return, or other tracked obligations.
- `tax_deadlines`: Tax calendar items for preparation and review.
- `tax_workflow_items`: setup, calendar, evidence, source review, checklist, and Accountant handoff tasks.
- `tax_evidence_packs`: Evidence pack grouping by period, country, and obligation.
- `tax_evidence_documents`: evidence document metadata only. No storage bucket is created yet.
- `tax_source_reviews`: source date, rate, and authority reference review records.
- `tax_review_checklists`: Review checklist items.
- `tax_review_comments`: reviewer and accountant comments.
- `tax_export_packets`: Accountant handoff packet manifests.
- `tax_cross_app_imports`: review imports from AfroPayroll, AfroBooks, AfroSeller through AfroBooks, or manual notes.
- `tax_audit_events`: audit trail for create, update, delete, import, export, review, and status changes.

## Roles

The model supports:

- `owner`
- `admin`
- `tax_admin`
- `accountant`
- `reviewer`
- `viewer`

## RLS Helpers

Helper functions live in the private schema:

- `private.tax_user_role(client_id)`
- `private.tax_can_access(client_id)`
- `private.tax_can_edit(client_id)`
- `private.tax_can_review(client_id)`
- `private.tax_can_manage(client_id)`

RLS is enabled on every `tax_*` table.

## RLS Role Matrix

| Role | Read | Edit prep records | Review records | Manage team/client | Delete |
| --- | --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes | Yes |
| tax_admin | Yes | Yes | Yes | No | No |
| accountant | Yes | Yes | Yes | No | No |
| reviewer | Yes | No | Yes | No | No |
| viewer | Yes | No | No | No | No |

Notes:

- `tax_clients` can be created only by the signed-in owner.
- Owner membership is inserted automatically after client creation.
- Managers can invite or disable team members.
- Editors can insert and update working preparation records.
- Reviewers can update Source review, Review checklist, review comment, and Accountant handoff packet records.
- Only managers can delete records through browser-user RLS.

## Constraints and Statuses

The migration uses check constraints instead of broad free-text states:

- Obligation status: `draft`, `tracking`, `needs_review`, `ready_for_accountant`, `paused`, `archived`.
- Deadline status: `draft`, `scheduled`, `needs_review`, `ready_for_accountant`, `completed`, `overdue`, `deferred`, `archived`.
- Evidence status: `not_started`, `collecting`, `needs_review`, `ready_for_accountant`, `exported`, `archived`.
- Review checklist status: `open`, `in_progress`, `needs_review`, `done`, `waived`.
- Export type: `accountant_handoff`, `evidence_summary`, `review_checklist`, `source_review`, `tax_calendar`, `audit_trail`.
- Source review status: `not_started`, `current`, `review_due`, `expired`, `blocked`, `replaced`.
- Cross-app import status: `draft`, `imported`, `needs_review`, `rejected`, `archived`.

## Index Strategy

The migration adds indexes for:

- Client ownership and client status.
- Team member lookup by client, role, status, and signed-in user.
- Country lane lookup by client, country, support status, and source review status.
- Obligation lookup by client, country, period, type, and status.
- Deadline lookup by client, country, period, due date, obligation, and status.
- Evidence pack lookup by client, period, obligation, and status.
- Source review lookup by client, country, status, and next review date.
- Export packet lookup by client, type, period, and status.
- Cross-app import lookup by client, source app, import type, period, and status.
- Audit lookup by client, actor, table, row, and event date.

## Audit Strategy

The migration creates `public.tax_audit_row_change()` and attaches it to account-backed tables except `tax_audit_events`. The trigger writes:

- client id
- actor id from the signed-in user
- event type
- table name
- row id
- old row JSON for update/delete
- new row JSON for insert/update

`tax_audit_events` is append-oriented from product code. Users can read audit events only for clients they can access.

## What This Schema Does Not Prove

- No filed returns.
- No paid tax.
- No official compliance confirmation.
- No government portal submission.
- No tax remittance.
- No salary fund movement.
- No verified live rates or deadlines.
- No document storage bucket yet.
- No generated types are committed yet.
- No browser use of service-role credentials.

## Apply Steps

Do not apply this migration to live production until the user explicitly approves it.

Recommended live apply flow:

```powershell
# 1. Review the migration text.
node scripts/verify-afrotax-pro.js

# 2. Apply through the approved Supabase workflow.
# Use Supabase MCP apply_migration or the Supabase CLI from a clean release branch.

# 3. Re-run advisors after apply.
# Supabase MCP: get_advisors(security), get_advisors(performance)
```

## Verification

```powershell
node --check assets/js/lib/afrotax-sync.js
node --check scripts/verify-afrotax-pro.js
npm run afrotax:verify
```
