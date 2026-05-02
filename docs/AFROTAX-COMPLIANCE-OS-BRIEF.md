# AfroTax Compliance OS Brief

Created: 2026-05-02

## Purpose

AfroTax Compliance OS is the Pro tax and statutory review workspace shell at:

- `/pro/apps/tax-compliance/`

It should feel like paid workflow software for accountants, payroll admins, founders, NGOs, schools, clinics, and multi-country operators. It is not a calculator page and must not present itself as filing, remittance, or guaranteed compliance software.

## Current Scope

The first shell includes:

- Tax calendar.
- Starter country packs.
- Deadline queue.
- Evidence packs.
- Source review status.
- Client or company selector placeholder.
- Filing checklist.
- Export packet area.
- Links to existing salary tax, VAT, social security, minimum wage, and AfroPayroll tools.

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

## Data Boundary

Current demo state is browser-only and uses:

- `afrotax_compliance_os_demo_v1`

The shell also reads existing AfroPayroll local state as a signal only:

- `afropayroll_pro_saved_runs`
- `afropayroll_pro_workspace_preview`

These keys do not prove account sync, statutory filing, tax payment, or compliance.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroTax may prepare draft checklists, evidence summaries, and accountant handoff packets.
- AfroTax does not file statutory returns.
- AfroTax does not remit tax or salary funds.
- AfroTax does not certify compliance.
- Source dates and demo deadlines must be verified before production use.

## Future Supabase Tables Needed

A production build needs account-backed tables before any live compliance claims:

- `tax_clients`
- `tax_company_profiles`
- `tax_country_packs`
- `tax_deadlines`
- `tax_obligations`
- `tax_workflow_items`
- `tax_evidence_packs`
- `tax_evidence_documents`
- `tax_source_reviews`
- `tax_filing_checklists`
- `tax_export_packets`
- `tax_review_comments`
- `tax_audit_events`

Recommended joins and ownership:

- `tax_clients.owner_id` should link to the signed-in account.
- `tax_company_profiles.client_id` should separate legal entity details from client metadata.
- `tax_country_packs.country_code` should hold support level, currency, languages, source URLs, and review cadence.
- `tax_deadlines.country_pack_id` should store deadline type, period, due date, and verification status.
- `tax_evidence_packs.client_id` and `tax_evidence_packs.period` should group evidence for accountant review.
- `tax_audit_events` should record state changes, exports, reviewer actions, and source review updates.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/tax-compliance/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
