# AfroTax Compliance OS Brief

Created: 2026-05-02
Updated: 2026-05-10

## Purpose

AfroTax Compliance OS is the Pro tax and statutory review workspace at:

- `/pro/apps/tax-compliance/`

It should feel like paid workflow software for accountants, payroll admins, founders, NGOs, schools, clinics, and multi-country operators. It is not a calculator page and must not present itself as filing, remittance, salary payment, or guaranteed compliance software.

## Current Scope

The first workspace includes:

- First-run setup for a company, accountant client, NGO, school, clinic, seller, or multi-country operator.
- Manual Save to account and Pull from account controls.
- Create account workspace, choose saved client/company, Download backup, and Last saved controls.
- Conflict review before replacing account or device data.
- Tax calendar.
- Deadline reminder calendar views: this month, next 30 days, overdue, by country, and by obligation.
- Per-deadline actions: mark collecting data, mark ready for accountant, mark exported, and reopen for review.
- Deadline reminder exports: deadline calendar CSV, overdue items CSV, and obligation summary Markdown.
- Starter country packs.
- Deadline queue.
- Evidence pack list with document detail checklists, reviewer assignment, status, and unresolved warnings.
- Source review queue with official source title, URL, source checked on, next review date, confidence, reviewer, notes, and stale source warnings.
- Evidence and source exports: Evidence pack Markdown, Evidence item CSV, and Source review CSV.
- Manual import review data panels for Payroll evidence, Books evidence, and Seller evidence via Books.
- Cross-app import log with source app, source period, imported at, row count, and warnings.
- Cross-app import exports: import summary CSV and evidence source note Markdown.
- Accountant packet builder with preview before download.
- Accountant packet exports: accountant packet Markdown, obligations CSV, deadlines CSV, evidence CSV, source reviews CSV, and unresolved warnings CSV.
- Export history with export date, exported by, packet type, period, warning count, and file manifest.
- Readiness guard warnings for missing evidence, stale source review, overdue deadlines, and missing reviewer.
- Client or company selector.
- Review checklist.
- Reviewer handoff notes.
- Accountant handoff area.
- Links to existing salary tax, VAT, social security, minimum wage, and AfroPayroll tools.

First-run setup fields:

- Client or company name.
- Country.
- Tax period.
- Business type.
- Accountant or reviewer.
- Tax contact.
- Default currency.
- Obligations to track: PAYE, VAT, income tax, social security, withholding, annual return, business levy, and other.
- Source review preference.

Setup score items:

- Company profile.
- Country lane.
- Obligations selected.
- Reviewer added.
- First deadline created.
- First Evidence pack started.

Primary workflow:

- Set up client.
- Choose obligations.
- Review calendar.
- Review deadline reminders.
- Gather evidence.
- Import review data from Payroll or Books where source work is saved.
- Review source dates.
- Complete checklist.
- Add reviewer handoff notes.
- Preview and export Accountant handoff packet.
- Save to account.
- Pull from account only after review.

Starter country lanes:

- Nigeria
- Kenya
- Ghana
- South Africa
- Rwanda
- Senegal
- Cameroon
- Egypt

Workflow states:

- `not started`
- `collecting data`
- `needs review`
- `ready for accountant`
- `exported`

Deadline reminder states:

- `upcoming`
- `due soon`
- `overdue`
- `ready`
- `exported`

## Product Truth Baseline

Works on this device:

- `afrotax_compliance_os_demo_v1`

The route exists at `/pro/apps/tax-compliance/`, is Pro-gated, and can show first-run setup, setup score, Tax calendar, deadline reminder views, country lanes, deadline queue, Evidence pack, Source review, Review checklist, and Accountant handoff areas.

Final output works on this device:

- Prepare an Accountant packet preview before download.
- Build packet contents from client/company, country, period, obligations, deadlines, Evidence packs, Source reviews, Review checklist state, reviewer handoff notes, and unresolved warnings.
- Download accountant packet Markdown.
- Download obligations CSV, deadlines CSV, evidence CSV, source reviews CSV, and unresolved warnings CSV.
- Save export history with export date, exported by, packet type, period, warning count, and file manifest.
- Record export metadata to account when an account workspace exists and the user has already created or selected it.
- Show readiness guard warnings before export when evidence is missing, source review is stale, a deadline is overdue, or no reviewer is set.

The Accountant packet is a review pack and handoff note only. It is not a tax return, proof of filing, proof of payment, government portal submission, or official compliance confirmation.

The route now loads `assets/js/lib/afrotax-sync.js` for manual account save and pull. Signed-out users can keep working with the device copy. Signed-in users can create an account workspace, choose a saved client/company, Save to account, Pull from account, Download backup, and review conflicts before replacing either copy.

Reads from Payroll today:

- `afropayroll_pro_saved_runs`
- `afropayroll_pro_workspace_preview`

These keys are source signals only. AfroTax reads them only as import review data when the user triggers an import. They do not prove account save, submitted returns, tax payment, salary fund movement, payroll filing, remittance, or compliance.

Reads from Books today:

- `afrobooks_finance_os_demo_v1`
- Close period and close pack summaries.
- Tax review labels and draft report summaries.
- VAT or sales review rows from invoice records.
- Expense category and withholding review rows from expense records.
- Payroll journal imports.
- Accountant packet manifests.
- Seller daily close imports only when they already appear inside Books import records.

Books data is source review input only. AfroTax does not treat Books records as audited, bank-reconciled, tax-submitted, or payment-verified records.

Not built:

- Live production apply of the `tax_*` account records in this pass.
- Verified live deadline or rate refresh.
- Live source review queue.
- Accountant team review.
- Filing workflow.
- Tax remittance workflow.
- Salary fund movement.
- No official compliance confirmation.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroTax may prepare draft Tax calendar items, Evidence packs, Review checklists, Source reviews, and Accountant handoff packets.
- AfroTax does not file returns.
- AfroTax does not remit tax.
- AfroTax does not move salary funds.
- AfroTax does not provide official compliance confirmation.
- Evidence pack is not filing.
- Evidence pack is not proof of tax payment.
- Source review is not legal advice or official confirmation.
- Document details and references are allowed; do not claim file upload unless upload storage and review have actually been built.
- Source dates, rates, and sample deadlines must be verified before production use.
- Deadline reminders are review prompts unless official current sources are checked by a qualified reviewer.
- Use `source checked on` only when the source has actually been reviewed.
- Use `import review data`, `evidence draft`, and `accountant review` for cross-app imports.
- Do not claim automatic sync. Payroll, Books, and Seller evidence imports are manual and user-triggered.

## Front-Facing Language Rules

Use these words in visible product copy:

- Tax calendar.
- Evidence pack.
- Review checklist.
- Source review.
- Accountant handoff.
- Deadline reminder.
- Review needed.
- Source checked on.
- Saved on this device.
- Save to account.
- Pull from account.
- Create account workspace.
- Choose saved client/company.
- Download backup.
- Last saved.
- Review before replacing.

Avoid visible product copy that sounds like an internal build label, engineering note, or government action. Do not say that AfroTax files, pays, submits, auto-connects to authority portals, verifies current rates, or provides official compliance confirmation unless that action has been built, reviewed, and proven.

Empty states should stay operational:

- No obligations: ask the user to choose the first obligations to track.
- No deadlines: explain that Tax calendar items appear after obligations are selected.
- No official source linked: show review needed and ask for source checking.
- No Evidence pack: invite the user to start the first Evidence pack.
- No Source review: ask the user to choose a source review preference.
- Missing evidence: show which Evidence pack still has requested or review-needed document details.
- Stale source review: show review needed until an official source URL and source checked on date are recorded.
- Missing reviewer: show reviewer needed before accountant handoff.
- Unresolved warning: show open pack-level or document-level warning before export.
- No Accountant packet: point the user toward the Review checklist and Accountant handoff packet.
- No Accountant packet preview: point the user toward Prepare packet preview before any download.
- Packet readiness warnings: show missing evidence, stale source review, overdue deadline, and missing reviewer before exporting.

Deadline calendar behavior:

- This month shows deadline reminders due in the current browser month.
- Next 30 days shows upcoming deadline reminders due within 30 days.
- Overdue shows deadline reminders past their due date unless already ready or exported.
- By country sorts current reminder records by country.
- By obligation sorts current reminder records by obligation type.
- Each reminder shows due date, review date, source link, source checked on, status, responsible person, and reminder note.
- Warnings appear for no official source linked, source review due, overdue, missing evidence, and missing reviewer.
- Calendar exports are review files only: deadline calendar CSV, overdue items CSV, and obligation summary Markdown.
- No deadline reminder should be treated as an official current deadline until the official source link and source checked on fields are reviewed.

Evidence pack behavior:

- Each Evidence pack has a title, country, obligation, period, status, reviewer, document detail checklist, and unresolved warnings.
- Evidence item details include document type, source app, period, amount, currency, status, note, and file or reference placeholder.
- Source app values are Payroll, Books, Seller, and manual.
- Evidence item statuses are requested, received, needs review, accepted for review, and replaced.
- The checklist can mark document details accepted for review, but this remains accountant review work only.
- Readiness warnings appear for missing evidence, stale source review, missing reviewer, and unresolved warning.
- Evidence pack Markdown and Evidence item CSV are review exports. They do not file, pay, submit, or provide official compliance confirmation.

Source review behavior:

- Source review records track official source title, URL, source checked on, next review date, confidence, reviewer, and notes.
- The Source review queue shows stale source warnings when the next review date has passed, no source URL exists, source checked on is missing, confidence is low, or reviewer is missing.
- Source review CSV is a review export only. It is not legal advice or official confirmation.
- Official or primary sources must be checked before changing source facts, rates, deadlines, or production guidance.

Cross-app import behavior:

- Payroll evidence reads saved runs and workspace previews from the device, then creates PAYE/payroll tax and social security/pension evidence drafts.
- Books evidence reads close packs, tax review summaries, VAT/sales review, expense categories, payroll journal imports, and Accountant packet manifests from the device.
- Seller evidence reaches AfroTax through Books imports. AfroTax does not directly import Seller data into tax review.
- Import validation flags source not closed or finalized, missing period, currency mismatch, duplicate import, and source warnings.
- Import log rows show source app, source period, imported at, row count, and warnings.
- Cross-app import summary CSV and evidence source note Markdown are review exports only.
- Account save should persist only import log entries the user created in AfroTax. It should not silently import Payroll or Books source records during Save to account.

Accountant packet behavior:

- The packet builder is manual and preview-first.
- Accountant packet Markdown includes the client/company, country, period, obligations, deadlines, Evidence packs, Source reviews, Review checklist state, review comments, unresolved warnings, and a handoff note.
- Supporting CSV files split the packet into obligations, deadlines, evidence, Source reviews, and unresolved warnings.
- The export history stores export date, exported by, packet type, period, warning count, and file manifest.
- Account save can persist export metadata through `tax_export_packets` when the account workspace exists.
- Packet files are review packs only. They do not prove filed returns, paid tax, government submission, tax remittance, salary payment, or official compliance confirmation.

## Future Account Records Needed

A production build needs account-backed records before any live readiness claims:

- `tax_clients`
- `tax_company_profiles`
- `tax_team_members`
- `tax_country_packs`
- `tax_obligations`
- `tax_deadlines`
- `tax_workflow_items`
- `tax_evidence_packs`
- `tax_evidence_documents`
- `tax_source_reviews`
- `tax_review_checklists`
- `tax_review_comments`
- `tax_export_packets`
- `tax_cross_app_imports`
- `tax_audit_events`

Recommended joins and ownership:

- `tax_clients.owner_id` should link to the signed-in account.
- `tax_company_profiles.client_id` should separate legal entity details from client metadata.
- `tax_team_members.client_id` should grant owner, admin, tax admin, accountant, reviewer, and viewer access inside one client workspace.
- `tax_country_packs.country_code` should hold support level, currency, languages, source URLs, and review cadence.
- `tax_obligations.client_id` and `tax_obligations.country_pack_id` should track PAYE, VAT, income tax, social security, withholding, annual return, and other obligations.
- `tax_deadlines.country_pack_id` should store deadline type, period, due date, and verification status.
- `tax_evidence_packs.client_id` and `tax_evidence_packs.period` should group evidence for accountant review.
- `tax_cross_app_imports` should receive AfroPayroll and AfroBooks review imports as review records, not as government action records.
- `tax_audit_events` should record state changes, exports, reviewer actions, and source review updates.

Repo-only account record design:

- `supabase/migrations/next-afrotax-compliance-schema.sql`
- `docs/AFROTAX-SUPABASE-SCHEMA.md`

This design stores preparation and review work only. It does not prove filed returns, paid tax, official compliance confirmation, government portal submission, tax remittance, or salary fund movement.

## Account Save Bridge

The browser bridge lives at:

- `assets/js/lib/afrotax-sync.js`

It exposes:

- `isCloudAvailable()`
- `loadWorkspaces()`
- `createWorkspaceFromLocalSnapshot()`
- `saveLocalSnapshot()`
- `loadWorkspaceSnapshot()`
- `recordExport()`
- `recordAuditEvent()`

Save to account covers:

- Client/company profile.
- Obligations.
- Tax calendar deadlines.
- Workflow items.
- Evidence packs.
- Evidence document metadata.
- Source reviews.
- Review checklists.
- Review comments.
- Accountant handoff packets.
- Cross-app import records.

Browser-first behavior:

- Signed-out users keep working with the copy saved on this device.
- Account actions run only when the user clicks them.
- Pull from account downloads a backup before replacing the device copy.
- Save to account and Pull from account show Review before replacing when the device copy is newer, the account copy is newer, deadline counts differ, Evidence pack counts differ, or Accountant handoff packet counts differ.

## QA Fixture

The safe fixture lives at:

- `scripts/afrotax-qa-fixture.js`

Default behavior is dry-run. Live writes require `AFROTAX_QA_CONFIRM=1`, a fixture tag, a safe QA email, a signed-in QA user token, and a publishable key. Cleanup only targets matching fixture-tagged records.

The fixture plans fake client, company, team member, country lane, obligation, deadline, workflow item, Evidence pack, evidence document metadata, Source review, Review checklist, review comment, cross-app import, Accountant handoff packet, and audit event records. If account records are not available, the live run reports planned objects only and inserts nothing.

## Validation

After changing this workspace, run:

```bash
node --check assets/js/lib/afrotax-sync.js
node --check scripts/afrotax-qa-fixture.js
node --check scripts/verify-afrotax-pro.js
npm run afrotax:verify
npm run pro:verify
npm run audit
npm run check-links
git diff --check -- assets/js/lib/afrotax-sync.js scripts/afrotax-qa-fixture.js scripts/verify-afrotax-pro.js docs/AFROTAX-QA.md docs/AFROTAX-COMPLIANCE-OS-BRIEF.md docs/AFROTAX-SUPABASE-SCHEMA.md supabase/migrations/next-afrotax-compliance-schema.sql package.json pro/apps/tax-compliance/index.html
```
