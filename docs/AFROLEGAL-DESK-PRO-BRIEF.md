# AfroLegal Desk Pro Brief

Created: 2026-05-02

## Purpose

AfroLegal Desk Pro is the Pro document drafting workspace at:

- `/pro/apps/legal/`

It is for SMEs, landlords, founders, HR teams, NGOs, accountants, creators, and operators who need a central place to prepare draft contracts, track renewals, organize client or entity records, queue documents for review, and export a handoff packet.

The product should feel like paid legal operations workflow software, not a single document generator page.

## Current Scope

The first shell includes:

- Contract workspace.
- Document templates.
- Renewal reminders.
- Client and entity records.
- Review queue.
- Export packet.

Starter workflows:

- Generate NDA.
- Employment letter.
- Rental agreement.
- Contractor agreement.
- Compliance document checklist.

## Linked Existing Tools

The shell links to existing public legal and document tools:

- `/tools/nda-generator/`
- `/tools/employment-contract/`
- `/tools/rental-agreement/`
- `/tools/tenancy-agreement/`
- `/tools/freelance-contract/`
- `/tools/contract-generator/`
- `/tools/contractor-vs-employee/`
- `/tools/partnership-agreement/`
- `/tools/shareholder-agreement/`
- `/tools/affidavit-generator/`
- `/tools/power-of-attorney/`
- `/tools/will-generator/`
- `/tools/privacy-policy-gen/`
- `/tools/legal-aid/`
- `/tools/compliance-calendar/`
- `/tools/document-pdf/`
- `/tools/pdf-sign/`
- `/tools/pdf-redact/`

These tools remain the detailed drafting surfaces. AfroLegal Desk is the operating shell that organizes the work, reminders, and local handoff packet.

## Data Boundary

Current demo state is browser-only and uses:

- `afrolegal_desk_pro_demo_v1`

The shell stores draft contract rows, template lanes, client or entity records, checklist state, renewal reminders, review items, packet count, and packet history in localStorage.

The export packet is a browser-generated JSON file. It is not uploaded, account-backed, e-signed, filed, or sent to any lawyer or court.

## Legal Disclaimer

The shell must keep this boundary visible:

- AfroLegal Desk provides document drafting support only.
- AfroLegal Desk is not legal advice.
- AfroLegal Desk does not create lawyer-client privilege.
- AfroLegal Desk does not guarantee enforceability, suitability, compliance, filing success, or dispute outcome.
- Users should consult a qualified lawyer in the relevant jurisdiction before relying on or signing legal documents.

## Future Schema and API Needed

A production build needs account-backed tables before any live legal-operations claims:

- `legal_clients`
- `legal_workspaces`
- `legal_entities`
- `legal_counterparties`
- `legal_document_templates`
- `legal_documents`
- `legal_document_versions`
- `legal_document_checklists`
- `legal_renewal_reminders`
- `legal_review_items`
- `legal_review_comments`
- `legal_export_packets`
- `legal_document_vault_items`
- `legal_audit_events`

Recommended boundaries:

- `legal_clients.owner_id` should link to the signed-in account.
- `legal_workspaces.client_id` should separate SME, landlord, founder, HR, NGO, or advisor workspaces.
- `legal_entities.workspace_id` should store parties, counterparties, signatories, property records, and company references.
- `legal_documents.template_id` should separate template lane from specific draft instance.
- `legal_document_versions.document_id` should preserve draft versions and reviewer changes.
- `legal_document_checklists.document_id` should track required attachments and review readiness.
- `legal_renewal_reminders.document_id` should track dates, notice windows, and reminder state.
- `legal_review_items.document_id` should track owner, severity, blocker reason, and resolution.
- `legal_document_vault_items` should store file metadata and storage references only after a storage policy exists.
- `legal_audit_events` should record draft creation, edits, checklist changes, review actions, export packet generation, and reminder changes.

Recommended API surface after schema and RLS exist:

- `GET /api/legal?action=dashboard`
- `GET /api/legal?action=documents`
- `POST /api/legal?action=create_document`
- `POST /api/legal?action=save_document_version`
- `POST /api/legal?action=save_entity`
- `POST /api/legal?action=update_checklist`
- `POST /api/legal?action=create_review_item`
- `POST /api/legal?action=create_export_packet`

These APIs should require an authenticated Pro account, workspace-level authorization, validation for sensitive party and document fields, document-version audit trails, and visible legal-disclaimer acknowledgement before export.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/legal/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
