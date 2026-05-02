# AfroGrant Tender OS Brief

Created: 2026-05-02

## Purpose

AfroGrant Tender OS is the Pro application workspace at:

- `/pro/apps/grants-tenders/`

It is for SMEs, NGOs, schools, students, founders, proposal writers, accountants, and operators preparing grants, tenders, scholarships, NGO funding applications, business-plan applications, and government support packets.

The product should feel like paid application workflow software, not a single scholarship or business-plan page.

## Current Scope

The first shell includes:

- Opportunity tracker.
- Application stages.
- Document readiness.
- Deadlines.
- Budget attachments.
- Reviewer notes.
- Submission packet.

Starter workflows:

- Add opportunity.
- Checklist documents.
- Draft application answers.
- Build budget pack.
- Export submission packet.

## Linked Existing Tools

The shell links to existing public scholarship, government, business, budget, and document tools:

- `/tools/scholarship-finder/`
- `/tools/gov-scholarship/`
- `/tools/sports-scholarship/`
- `/tools/business-plan/`
- `/tools/business-plan-builder/`
- `/tools/business-planner/`
- `/tools/business-registration/`
- `/tools/business-license/`
- `/tools/budget-planner/`
- `/tools/document-pdf/`
- `/tools/pdf-merge-split/`
- `/tools/pdf-sign/`
- `/tools/cv-builder/`
- `/tools/cover-letter-generator/`
- `/tools/meeting-minutes/`
- `/tools/invoice-generator/`

There is no dedicated grant, tender, NGO funding, or proposal-writing tool route in this pass. AfroGrant Tender OS is the Pro operating shell that organizes applications and links to the closest existing supporting tools.

## Data Boundary

Current demo state is browser-only and uses:

- `afrogrant_tender_os_demo_v1`

The shell stores opportunity rows, application stages, document checklist state, budget attachment rows, deadline reminders, reviewer notes, draft answer prompts, packet count, and packet history in localStorage.

The export packet is a browser-generated JSON file. It is not uploaded, account-backed, submitted to a funder, submitted to a procurement portal, or sent to a scholarship provider.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroGrant Tender OS may prepare local opportunity trackers, document checklists, draft answer notes, budget rows, reviewer notes, and handoff packets.
- AfroGrant Tender OS does not submit applications.
- AfroGrant Tender OS does not verify eligibility.
- AfroGrant Tender OS does not certify compliance.
- AfroGrant Tender OS does not guarantee funding, admission, tender award, shortlist, approval, or payment.
- Source portal requirements, deadlines, file formats, eligibility criteria, and closing time zones must be verified against the official opportunity source.
- Local demo rows are not account-backed application records.

## Future Schema and API Needed

A production build needs account-backed tables before any live grants, tenders, scholarship, or NGO funding workflow claims:

- `application_clients`
- `application_workspaces`
- `application_opportunities`
- `application_sources`
- `application_stage_events`
- `application_documents`
- `application_document_checklists`
- `application_answers`
- `application_answer_versions`
- `application_budget_packs`
- `application_budget_lines`
- `application_budget_attachments`
- `application_review_notes`
- `application_deadlines`
- `application_submission_packets`
- `application_submission_receipts`
- `application_audit_events`

Recommended boundaries:

- `application_clients.owner_id` should link to the signed-in account.
- `application_workspaces.client_id` should separate NGO, SME, student, school, founder, or advisor workspaces.
- `application_opportunities.workspace_id` should hold opportunity type, funder, source URL, amount, currency, country, deadline, stage, and eligibility status.
- `application_sources.opportunity_id` should record official source URLs, checked-at timestamps, and source-review notes.
- `application_stage_events.opportunity_id` should preserve stage changes and owners.
- `application_documents.opportunity_id` should track required documents without storing file blobs directly.
- `application_budget_packs.opportunity_id` and `application_budget_lines.budget_pack_id` should separate budget header from individual line items.
- `application_budget_attachments` should store quote or invoice metadata only after storage policy exists.
- `application_answer_versions` should keep answer drafts, character limits, and reviewer changes.
- `application_submission_receipts` should only exist after the user records proof from an external portal.
- `application_audit_events` should record opportunity creation, stage movement, checklist changes, answer edits, budget edits, review notes, packet exports, and receipt capture.

Recommended API surface after schema and RLS exist:

- `GET /api/applications?action=dashboard`
- `GET /api/applications?action=opportunities`
- `POST /api/applications?action=save_opportunity`
- `POST /api/applications?action=update_stage`
- `POST /api/applications?action=update_document_checklist`
- `POST /api/applications?action=save_answer_version`
- `POST /api/applications?action=save_budget_pack`
- `POST /api/applications?action=create_review_note`
- `POST /api/applications?action=create_submission_packet`
- `POST /api/applications?action=record_submission_receipt`

These APIs should require an authenticated Pro account, workspace-level authorization, source URL validation, deadline and timezone handling, file/storage policy checks, and audit-event writes for every mutation.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/grants-tenders/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
