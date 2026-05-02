# AfroProperty & Project OS Brief

## Route

- `/pro/apps/property-projects/`
- Pro gate: `<meta name="pro-required" content="afrotools-pro">` plus `/assets/js/pro-gate.js`
- Current storage: browser-only demo state under `afroproperty_project_os_demo_v1`

## Product Purpose

AfroProperty & Project OS is the AfroTools Pro operations shell for construction, rental, procurement, BOQ, and contractor-tracking work. It is designed for property owners, project managers, small builders, rental managers, diaspora owners, schools, clinics, NGOs, and SMEs that need one workspace before work moves to accountants, quantity surveyors, legal reviewers, contractors, or property managers.

This is not a marketing page and not a public calculator. It is a SaaS dashboard surface where a Pro user starts and coordinates work.

## Current Shell Scope

- Project pipeline for construction, renovation, fit-out, rental upgrade, and procurement work
- BOQ and budget workspace with starter budget lines
- Contractor payment notes and milestone review status
- Procurement list with quote, supplier, needed date, and readiness tracking
- Lease and rent tracker for agreements, deposits, arrears, and rent review
- Inspection notes for site observations, defects, handover, and follow-up
- Cost variance watch for budget creep and approvals
- Document pack checklist and JSON packet export
- Linked property and construction tools from the existing AfroTools catalogue

## Starter Workflows

- Create project
- Build BOQ or budget line
- Add procurement item
- Log contractor payment note
- Add inspection note
- Export document packet

## Linked Existing Tools

- `/tools/building-materials/`
- `/tools/construction-budget/`
- `/tools/floor-plan/`
- `/tools/boq-builder/`
- `/tools/rental-agreement/`
- `/tools/rent-affordability/`
- `/tools/property-valuation/`
- `/tools/property-mgmt-fees/`
- `/tools/building-permit/`
- `/tools/lease-risk-check/`
- `/tools/rent-intelligence/`
- `/tools/property-roi/`
- `/tools/tenant-screening/`
- `/tools/land-title-check/`

## Honest Product Boundaries

The shell must stay clear about what it does not do yet:

- No escrow
- No title verification
- No official property valuation
- No contractor payment processing
- No statutory permit filing
- No official inspection approval
- No legal advice
- No bank sync or accounting sync

The property valuation link is an estimator only. The land title link is a checklist only. Permit and lease tools support preparation and review, not official approval.

## Local State

The first shell stores demo records only in localStorage:

- Key: `afroproperty_project_os_demo_v1`
- Contents: projects, budget lines, procurement items, contractor payment notes, lease records, inspection notes, variance items, document checklist, and export history
- Export format: JSON download from the browser

No project, lease, title, tenant, contractor, or payment data is uploaded by this shell.

## Future Backend Schema

Account-backed Pro storage will need tenant-aware tables with RLS:

- `property_clients`
- `property_workspaces`
- `property_projects`
- `property_project_stages`
- `property_boqs`
- `property_boq_lines`
- `property_budgets`
- `property_budget_variances`
- `property_procurement_items`
- `property_suppliers`
- `property_contractors`
- `property_contractor_payments`
- `property_leases`
- `property_rent_records`
- `property_inspection_notes`
- `property_document_checklists`
- `property_document_vault_items`
- `property_export_packs`
- `property_audit_events`

## Future API Surface

Suggested endpoint family once schema exists:

- `GET /api/property-projects?action=dashboard`
- `GET /api/property-projects?action=projects`
- `POST /api/property-projects?action=save_project`
- `POST /api/property-projects?action=save_boq`
- `POST /api/property-projects?action=save_procurement_item`
- `POST /api/property-projects?action=record_contractor_payment`
- `POST /api/property-projects?action=save_lease_record`
- `POST /api/property-projects?action=save_inspection_note`
- `POST /api/property-projects?action=create_document_pack`

## Next Build Layer

The next real Pro layer should connect this shell to account-backed workspaces, document vault records, project-specific permissions, contractor/vendor records, and export-pack audit events. Payment and title flows should remain external or clearly labelled until AfroTools has a verified provider and compliance model.
