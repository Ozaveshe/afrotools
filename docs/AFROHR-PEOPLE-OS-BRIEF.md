# AfroHR People OS Brief

Updated: 2026-05-10

## Purpose

AfroHR People OS is the Pro people workspace at `/pro/apps/hr/`.

It is for founders, payroll admins, accountants, schools, clinics, NGOs, and small teams that need Employee records, Onboarding, Leave, Documents, Payroll readiness, and People reports before deeper HR features are built.

The product should feel like paid people-operations software. It should not sound like a calculator page, a legal service, or a Payroll system pretending to move data automatically.

## Current Truth

Works now:

- `/pro/apps/hr/` exists and is Pro-gated.
- The current device save key is `afrohr_people_os_demo_v1`.
- The route can keep first-run organization setup, Employee records, Onboarding tasks, Leave items, Documents metadata, letter drafts, missing-detail requests, Payroll handoff draft notes, and people packet exports on this device.
- The route reads Payroll employee records from `afropayroll_pro_employee_master` when present.
- The Payroll read key is read-only in AfroHR. The route must not write to it during load, refresh, or draft handoff.

Save to account:

- The AfroHR Save to account bridge exists at `assets/js/lib/afrohr-sync.js`.
- The route keeps working when signed out and saved on this device.
- Save to account and Pull from account require a signed-in AfroTools account and the AfroHR account record set.
- Save to account runs only after a user clicks an account action.
- Pull from account downloads a device backup before replacing the device copy.
- Do not claim shared HR records or team history until the account record set is applied and a safe QA user proves row creation and cleanup.

Payroll handoff draft:

- AfroHR can prepare a Payroll handoff draft for review.
- A Payroll handoff draft does not change Payroll records.
- A future user-approved handoff must be explicit, reviewable, and reversible before it can write toward Payroll.

## Customer Language

Use these customer-facing labels:

- Employee records.
- Onboarding.
- Leave.
- Documents.
- Payroll readiness.
- People reports.
- Organization setup.
- First employee.
- Leave settings.
- Document checklist.
- Saved on this device.
- Save to account.
- Payroll handoff draft.
- Review needed.

Avoid language that exposes implementation details to customers. Do not use implementation words in visible UI or generated exports. Write like paid people-operations software for small employers, schools, clinics, NGOs, freelancer teams, agencies, and accountant-managed clients.

## First-Run Setup

The first-run setup captures:

- Organization name.
- Organization type: small employer, school, clinic, NGO, freelancer team, agency, or accountant-managed client.
- Country.
- Default currency.
- HR contact.
- Payroll contact.
- Leave year start.
- Default work week.
- Review month.
- Payroll handoff preference.

Setup completion is scored from six checks:

- Organization profile.
- First employee.
- HR contact.
- Payroll contact.
- Leave settings.
- Document checklist.

The setup score should route users into the primary workflow:

1. Set up organization.
2. Add employee.
3. Complete onboarding.
4. Track Leave.
5. Prepare Documents.
6. Review Payroll readiness.
7. Export people packet.

The people packet is a device-generated summary. It must not claim file storage, signatures, labor-law review, Payroll changes, or account save success.

## Employee Record Baseline

AfroHR Employee records now capture the practical fields a small employer, school, clinic, NGO, agency, freelancer team, or accountant needs before payroll review:

- Identity: employee code, full name, preferred name, email, phone, and country.
- Work role: department, role/title, manager, employment type, start date, probation end date, and status.
- Contact: address/location, emergency contact name, emergency contact phone, and next-of-kin note.
- Payroll readiness: tax ID, pension/social security ID, bank or mobile-money route, pay schedule, default currency, and optional linked Payroll employee ID.

Sensitive tax, pension/social security, and payment-route fields are HR and payroll operations data. They do not prove employee consent, statutory compliance, Payroll filing, or account-backed storage by themselves.

Employee actions:

- Add employee.
- Edit employee.
- Mark inactive.
- Request missing details.
- Add to Payroll handoff draft.

Payroll readiness badges:

- Ready for payroll: tax ID, pension/social security ID, payment route, emergency contact, and Onboarding are complete.
- Review needed: required identity, role, status, or start-date details are missing.
- Missing tax ID.
- Missing social/security ID.
- Missing payment route.
- Missing emergency contact.
- Onboarding incomplete.

Exports:

- Employee register CSV: employee code, full name, preferred name, email, phone, country, department, role/title, manager, employment type, start date, probation end date, status, address/location, emergency contact name, emergency contact phone, and next-of-kin note.
- Payroll readiness CSV: employee code, full name, pay schedule, default currency, tax ID status, pension/social security status, payment route status, optional linked Payroll employee ID, readiness score, and readiness badges.
- Missing details CSV: employee code, full name, email, phone, missing fields, readiness badges, and status.

## Onboarding And Draft Documents

AfroHR onboarding is employee-scoped and saved on this device. Each employee can carry these onboarding tasks:

- Profile details.
- Emergency contact.
- Payroll details.
- ID/document metadata.
- Contract/letter prepared.
- Policy acknowledgement.
- Manager intro.
- First-day tasks.

Supported onboarding statuses:

- not started.
- in progress.
- waiting on employee.
- ready for review.
- completed.

Letters and contracts are draft records for review. A draft can include employee, role, start date, optional salary/pay note, probation, reviewer, status, generated-at time, reviewer notes, and review warnings.

Review warnings should call out:

- missing role.
- missing start date.
- missing pay details.
- legal review needed.

Document preparation remains metadata-only. Contract checklist, policy acknowledgement, ID/document metadata, and reviewer notes can be prepared, but AfroHR does not upload files, store documents, collect signatures, or certify legal terms.

Onboarding outputs:

- Employment letter Markdown.
- Onboarding packet Markdown.
- Onboarding checklist CSV.

Useful links can point users to the existing Employment Contract tool and Document tools, but those links do not change AfroHR into a legal certification, e-signature, or file-storage system.

## Document Metadata Vault And People Reports

AfroHR document records are metadata-only. The route can track:

- Employee.
- Document type.
- Title.
- Review status.
- Issue date.
- Expiry date.
- Reviewer.
- Note.
- File reference placeholder.

Supported document record types:

- ID.
- Contract.
- Appointment letter.
- Policy acknowledgement.
- Certificate.
- Work permit.
- Payroll detail proof.
- Medical/admin note.
- Other.

Expiry reminder queue labels:

- expires soon.
- expired.
- missing.
- needs review.

Customer-facing vault copy must include:

- Records document metadata only.
- No file is uploaded from this workspace yet.

AfroHR must not claim document authenticity, file storage, e-signature, or legal compliance from document metadata. Sensitive document metadata should be treated as HR operations data and kept to the signed-in/account flow only when account save is available and verified.

People reports should summarize:

- Headcount by country.
- Headcount by department.
- Onboarding status.
- Payroll readiness.
- Leave and attendance summary.
- Missing documents.
- Expiring documents.

Report outputs:

- Document register CSV.
- Expiring documents CSV.
- People summary CSV.
- HR review packet Markdown.

## Leave Tracker And Attendance Records

AfroHR leave tracker records should be review-first and saved on this device unless a user chooses Save to account. A leave tracker item can include:

- Employee.
- Leave type.
- Start date.
- End date.
- Days.
- Status.
- Approver.
- Note.
- Payroll review note.

Supported leave tracker statuses:

- requested.
- approved.
- rejected.
- cancelled.
- payroll review.

AfroHR attendance record items can include:

- Employee.
- Date.
- Event type: present, absent, late, remote, overtime, or unpaid absence.
- Hours.
- Note.
- Payroll review note when the item may affect pay review.

Leave and attendance dashboards should show Leave pending, Approved leave, Unpaid absence, Overtime, and Payroll-impact items. Exports should include Leave register CSV, Attendance CSV, and Payroll impact CSV.

Warnings should stay practical and review-focused:

- overlapping leave.
- missing employee.
- unpaid absence needs payroll review.
- overtime needs approval.

The public `/tools/leave-calculator/` route can be linked for estimates. AfroHR must not claim legal leave entitlement accuracy unless the relevant country rules have been verified. It must not claim biometric attendance, device integration, automatic payroll deduction, or automatic Payroll record changes.

## Payroll Handoff Draft Workflow

AfroHR can feed AfroPayroll through a manual payroll handoff draft. The handoff is a review package, not a Payroll write:

- Selected employees.
- Payroll-ready employees.
- Missing-detail employees.
- Leave/payroll-impact items.
- Unpaid absence and overtime notes.
- Reviewer note.

Handoff outputs:

- Payroll-ready CSV.
- Missing-detail CSV.
- Payroll impact CSV.
- Markdown handoff note.

The optional AfroPayroll import contract is:

- Employee code.
- Name.
- Email.
- Phone.
- Country.
- Department.
- Role.
- Tax ID.
- Social/security ID.
- Bank/mobile-money route.
- Pay schedule.
- Payroll impact notes.

The customer action should say download handoff, open AfroPayroll, and review before import. AfroHR must not automatically write into Payroll storage during page load, handoff build, or export. Any Payroll import must be explicit and user-triggered inside AfroPayroll.

## Must Not Claim

AfroHR must not claim:

- Cloud HR storage.
- Labor-law compliance.
- Contract certification.
- Statutory HR filing.
- Employee consent proof.
- Automatic Payroll sync.
- Automatic payroll deduction.
- Salary payment.
- Payroll filing.
- Document upload or file storage.
- Payroll record changes unless a future user-approved flow is built and verified.
- E-signature or signed employee documents.
- Document authenticity.
- Legal leave entitlement accuracy unless the relevant country rules are verified.
- Biometric attendance or attendance device integration.

## Planned Account Record Set

`supabase/migrations/next-afrohr-people-schema.sql` is the account-backed baseline for Save to account work. It is a repo-only migration until a live apply is explicitly approved. The browser bridge can use these records when they exist, but the route must keep the signed-out device workflow intact:

- `hr_clients`
- `hr_organizations`
- `hr_team_members`
- `hr_employees`
- `hr_employee_contacts`
- `hr_employee_payroll_profiles`
- `hr_contracts`
- `hr_letters`
- `hr_onboarding_tasks`
- `hr_leave_requests`
- `hr_attendance_events`
- `hr_document_vault_items`
- `hr_missing_detail_requests`
- `hr_payroll_handoffs`
- `hr_people_reports`
- `hr_audit_events`

Recommended boundaries:

- `hr_clients` keeps the People OS workspace owner and account boundary.
- `hr_organizations` keeps the employer, school, clinic, NGO, freelancer team, agency, or accountant-managed client.
- `hr_team_members` keeps workspace roles: owner, admin, hr_admin, payroll_admin, accountant, reviewer, and viewer.
- `hr_employees` keeps worker identity, role, country, department, employment type, and status.
- `hr_employee_contacts` keeps emergency and contact records.
- `hr_employee_payroll_profiles` keeps Payroll readiness fields and optional Payroll employee references.
- `hr_contracts` keeps contract metadata and review state.
- `hr_letters` keeps letter draft titles, status, and review notes.
- `hr_onboarding_tasks` keeps task status and due dates.
- `hr_leave_requests` keeps leave tracker requests, review state, approver, and payroll review notes.
- `hr_attendance_events` keeps attendance record dates, event types, hours, notes, and payroll review notes.
- `hr_document_vault_items` keeps document metadata, review status, expiry reminder fields, reviewer notes, and optional storage references only until a real upload and access-control flow exists.
- `hr_missing_detail_requests` keeps requested fields and review status.
- `hr_payroll_handoffs` keeps Payroll handoff draft summaries.
- `hr_people_reports` keeps People report snapshots and export metadata.
- `hr_audit_events` keeps People OS action history for imports, edits, requests, letters, Leave, Documents, and Payroll handoff draft actions.

Account security baseline:

- Every People record is scoped by `client_id`.
- Organization and employee links use same-client constraints.
- RLS helpers are `private.hr_can_access`, `private.hr_can_edit_people`, `private.hr_can_review`, and `private.hr_can_manage`.
- RLS is enabled and forced for every `hr_*` table in the migration.
- Browser code must use the signed-in user session and must not use a service-role key.

Payroll relationship:

- AfroHR reads the local Payroll key `afropayroll_pro_employee_master` today.
- Future `payroll_employee_id` and `payroll_run_id` fields are references only.
- A Payroll handoff draft does not write to Payroll automatically.
- Handoff files are downloaded from AfroHR and imported into AfroPayroll only when a user explicitly chooses an import action.
- Any future Payroll write path must be explicit, user-approved, reviewable, and audited.

## Feature Direction

The next AfroHR build should move in this order:

1. Keep current route copy customer-facing: Employee records, Onboarding, Leave, Documents, Payroll readiness, People reports, Saved on this device, Save to account, Payroll handoff draft, and Review needed.
2. Keep the Save to account surface manual: Create account organization, Save to account, Pull from account, Download backup, Last saved, and Review before replacing.
3. Keep Payroll read-only until a user chooses a Payroll handoff draft and confirms what will be sent.
4. Add richer People reports from existing Employee records, Leave, Documents, and Payroll readiness state.
5. Add document upload only after file access, retention, and deletion behavior are designed.

## QA Baseline

Use `scripts/afrohr-qa-fixture.js` for repeatable QA planning. It creates a dry-run plan with:

- Fake organization setup.
- Fake organization.
- Fake employees.
- Fake contacts.
- Fake payroll profiles.
- Fake Onboarding tasks.
- Fake Leave requests.
- Fake attendance events.
- Fake letter drafts.
- Fake document metadata.
- Fake missing-detail requests.
- Fake Payroll handoff draft.
- Fake audit events.

The fixture defaults to dry-run. No live rows are written unless `AFROHR_QA_CONFIRM=1`, a safe QA user, and a fixture tag are provided.

## Validation

After AfroHR baseline changes, run:

```powershell
node --check scripts/afrohr-qa-fixture.js
node --check scripts/verify-afrohr-pro.js
npm run pro:verify
npm run audit
npm run check-links
git diff --check -- supabase/migrations/next-afrohr-people-schema.sql docs/AFROHR-SUPABASE-SCHEMA.md docs/AFROHR-PEOPLE-OS-BRIEF.md scripts/verify-afrohr-pro.js scripts/afrohr-qa-fixture.js docs/AFROHR-QA.md package.json
```
