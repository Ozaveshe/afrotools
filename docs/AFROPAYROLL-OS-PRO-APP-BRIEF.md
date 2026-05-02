# AfroPayroll OS Pro App Brief

Created: 2026-05-02

## Purpose

`/pro/apps/payroll/` is the Pro app home for AfroPayroll OS. It is not the payroll calculator and it is not the run editor. It is the command layer above the existing payroll workspace.

The page should answer:

- Who is signed in and whether Pro access is active.
- Which payroll runs, clients, and employees need attention.
- Which workflows are ready, which are review-only, and which are local-only.
- Where the operator should go next.

## Current Route

- App home: `pro/apps/payroll/index.html`
- Run workspace: `tools/afropayroll-os/workspace.html`
- Employee portal route: `tools/afropayroll-os/employee.html`
- Shared Pro workspace: `pro/workspace/index.html`

## Data Sources

Live account-backed sources:

- Pro entitlement: `window.AfroProGate.getStatus({ fresh: true })`
- Payroll dashboard: `/api/afropayroll?action=dashboard&limit=100`

Browser-local sources:

- Saved payroll runs: `afropayroll_pro_saved_runs`
- Current draft: `afropayroll_pro_workspace_preview`
- Employee master records: `afropayroll_pro_employee_master`

The page must label local state honestly. Browser-local salary data is not account sync.

## Product Lanes

1. Run workspace
   - Monthly pay inputs
   - Calculation preview
   - Saved runs
   - Export packets

2. Employee master
   - Payment route
   - Statutory IDs
   - Employee readiness
   - Portal invite preparation

3. Client board
   - Accountant-facing client and company context
   - Monthly run status
   - Review counts

4. Compliance pack
   - Statutory review prompts
   - Source-linked evidence
   - Human reviewer fields

5. Payment handoff
   - Bank CSV
   - Mobile money CSV
   - Missing payment details
   - Accounting journal

6. Employee portal
   - Tokenized payslip viewing
   - Profile confirmation
   - Missing detail requests

7. Month close control
   - Capture, review, approve, and handoff stages
   - Readiness score
   - Close checklist
   - Browser-local queue visibility

8. Support operations
   - Country pack support console
   - Pack health and source review
   - Engine and statutory calendar coverage

## Guardrails

- AfroPayroll does not file statutory returns.
- AfroPayroll does not remit taxes, pension, social security, or salary payments.
- Payment exports are instruction drafts.
- Engine-backed previews still need review before payroll sign-off.
- Estimate and next-pack country rows must remain visibly marked.
- Local salary data must not be described as cloud-synced.

## Readiness Model

The app home now computes a payroll close score from the data it can safely see:

- active employee records
- missing payment routes
- missing statutory identifiers
- cloud run warning rows
- pending approvals
- approved or exported cloud runs
- unsynced browser drafts and saved runs

This score is an operational triage signal only. It is not a compliance score.

## Month Close Stages

The close board is intentionally simple and accountant-friendly:

1. Capture
   - payroll rows, local drafts, saved runs, and employee records
2. Review
   - warning rows and employee data gaps
3. Approve
   - pending and approved cloud run states
4. Handoff
   - exported runs and local-only items that still need sync

The page should continue to make local-only state obvious.

## Next Depth To Add

1. Add a true `/api/afropayroll?action=work_queue` endpoint.
2. Add run deep links from the Pro app table into the workspace loader.
3. Add client filter and period filter to the app home.
4. Add pack-health summary from country pack metadata.
5. Pull pack health from `tools/afropayroll-os/support.html` or a future support API.
6. Add notification rollups for:
   - missing employee payment route
   - missing statutory ID
   - pending approval
   - exported but not finalized
   - source review due
7. Add a proper shared Pro app shell CSS helper once all app shells stabilize.

## Validation Pattern

For edits to this route:

```powershell
node --check assets/js/pro-gate.js
# Parse inline scripts for pro/apps/payroll/index.html
npm run audit
npm run check-links
```
