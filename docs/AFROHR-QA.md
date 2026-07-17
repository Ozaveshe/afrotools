# AfroHR QA Fixture

Updated: 2026-05-10

## Purpose

`scripts/afrohr-qa-fixture.js` creates a safe AfroHR People OS controller baseline before deeper HR feature work. The default run is a dry-run plan. No live People records are written unless a safe QA user, a fixture tag, and explicit confirmation are provided.

Use this for `/pro/apps/hr/` validation while AfroHR moves toward a real Pro people workspace.

## Safety Rules

- Default mode is dry-run.
- No live writes run unless `AFROHR_QA_CONFIRM=1` and `--live` are both present.
- Live writes require `AFROHR_QA_TAG` or `--tag` so cleanup can target only the fixture.
- Live writes require `AFROHR_QA_ACCESS_TOKEN` for the signed-in QA user.
- Live writes require `AFROHR_QA_EMAIL` or `AFROHR_QA_USER_ID` for a clearly safe QA user.
- QA email must look like QA, test, fixture, sandbox, or `example.com`.
- Live writes require a publishable key through `SUPABASE_AUTH_ANON_KEY`, `SUPABASE_ANON_KEY`, or `SUPABASE_PUBLISHABLE_KEY`.
- Cleanup refuses to run without an explicit fixture tag.
- Cleanup deletes only records whose fixture tag matches the requested tag.
- If People account records are not available yet, the script reports planned records only.
- The fixture uses only fake organization, employee, contact, Payroll readiness, Onboarding, Leave, Documents, Payroll handoff draft, and audit content.

## Product Truth Baseline

Works on this device:

- `/pro/apps/hr/` exists and is Pro-gated.
- The current device save key is `afrohr_people_os_demo_v1`.
- Employee records, Onboarding, Leave, Documents metadata, missing-detail requests, letter drafts, Payroll handoff draft notes, and People reports are saved on this device first.
- The route reads Payroll employee records from `afropayroll_pro_employee_master` when present.
- The Payroll read key is read-only for AfroHR.

Save to account:

- The browser bridge for Save to account exists, but it depends on the AfroHR account record set being available.
- Do not claim cloud HR storage or shared HR records until the People account record set exists and a safe QA user proves row creation and cleanup.

Payroll readiness:

- Payroll readiness is a review aid.
- Payroll handoff draft means a handoff note for review, not automatic Payroll sync.
- Review needed remains the default state for records that could affect employee, document, leave, or Payroll readiness decisions.

Not implemented:

- Cloud HR storage.
- Labor-law compliance.
- Contract certification.
- Statutory HR filing.
- Employee consent proof.
- Automatic Payroll sync.
- Document upload or stored employee files.

Must not be claimed:

- Shared HR records.
- Certified contracts.
- Filed HR or statutory reports.
- Proved employee consent.
- Payroll records changed automatically.
- Employee files uploaded or stored.

## Planned Fixture Records

The dry-run plan covers:

- Fake client in `hr_clients`.
- Fake organization in `hr_organizations`.
- Fake employees in `hr_employees`.
- Fake contacts in `hr_employee_contacts`.
- Fake payroll profiles in `hr_employee_payroll_profiles`.
- Fake contract metadata in `hr_contracts`.
- Fake Onboarding tasks in `hr_onboarding_tasks`.
- Fake Leave requests in `hr_leave_requests`.
- Fake attendance events in `hr_attendance_events`.
- Fake letter drafts in `hr_letters`.
- Fake document metadata in `hr_document_vault_items`.
- Fake missing-detail requests in `hr_missing_detail_requests`.
- Fake Payroll handoff draft in `hr_payroll_handoffs`.
- Fake People report snapshot in `hr_people_reports`.
- Fake audit events in `hr_audit_events`.

## Commands

Dry-run plan:

```powershell
npm run afrohr:qa -- --dry-run
```

Dry-run baseline only:

```powershell
npm run afrohr:qa -- --baseline --dry-run
```

Dry-run cleanup plan for a known tag:

```powershell
npm run afrohr:qa -- --cleanup --tag=qa_hr_YYYYMMDDHHMMSS_xxxxxx --dry-run
```

Live fixture smoke, only after a safe QA user is selected and the People account record set exists:

```powershell
$env:AFROHR_QA_CONFIRM = "1"
$env:AFROHR_QA_TAG = "qa_hr_20260510_safe_smoke"
$env:AFROHR_QA_EMAIL = "qa.hr+safe-smoke@example.com"
$env:AFROHR_QA_USER_ID = "<safe QA auth user id>"
$env:AFROHR_QA_ACCESS_TOKEN = "<signed-in QA user access token>"
$env:SUPABASE_AUTH_ANON_KEY = "<publishable anon key>"
npm run afrohr:qa -- --live
```

Live cleanup for the exact fixture tag:

```powershell
$env:AFROHR_QA_CONFIRM = "1"
$env:AFROHR_QA_TAG = "qa_hr_20260510_safe_smoke"
$env:AFROHR_QA_EMAIL = "qa.hr+safe-smoke@example.com"
$env:AFROHR_QA_USER_ID = "<safe QA auth user id>"
$env:AFROHR_QA_ACCESS_TOKEN = "<signed-in QA user access token>"
$env:SUPABASE_AUTH_ANON_KEY = "<publishable anon key>"
npm run afrohr:qa -- --cleanup --live
```

## Validation

Run these checks after AfroHR fixture or controller changes:

```powershell
node --check scripts/afrohr-qa-fixture.js
node --check scripts/verify-afrohr-pro.js
npm run afrohr:verify
npm run pro:verify
npm run audit
npm run check-links
git diff --check -- scripts/afrohr-qa-fixture.js scripts/verify-afrohr-pro.js docs/AFROHR-QA.md docs/AFROHR-PEOPLE-OS-BRIEF.md package.json
```

## Live Inspection Note

Live project inspection was not used for this QA fixture pass.

- Repo change: the fixture and docs now plan safe AfroHR People records without claiming cloud HR storage is proven.
- Live data inserted: none for this baseline.
- Next live step: inspect People account records with the configured project tools before running any live fixture.
