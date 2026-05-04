# VAT & Business Tax Workflow

This workflow turns `/vat-business-tax/` from a static category list into a planning surface for VAT quotes, invoices, withholding, monthly filing, cross-border expansion, and source-audit work.

## Surfaces

- Hub: `vat-business-tax/index.html`
- Planner UI: `assets/js/lib/vat-business-tax-workflow.js`
- Planner styles: `assets/css/vat-business-tax-workflow.css`
- Report sync: `assets/js/lib/vat-business-tax-report-sync.js`
- Main calculator: `tools/vat-calculator/index.html`
- Dashboard continuation: `dashboard/index.html`
- Verification: `scripts/verify-vat-business-tax-workflow.js`

## Workflow Lanes

- Pricing and margin check: VAT calculator, profit margin, markup, break-even.
- VAT invoice pack: VAT calculator invoice mode, invoice generator, receipt generator, dashboard.
- Withholding and remittance: VAT withholding mode, Nigeria WHT, Kenya WHT, import duty.
- Monthly filing pack: VAT report trail, inventory, cash-flow forecast, dashboard.
- Cross-border expansion: VAT comparison, import duty, transfer pricing, trade handoff.
- Rate source audit: Pan-African VAT calculator plus Ghana, Kenya, and South Africa country VAT pages.

## Local Stores

- `afro_vat_business_tax_reports_v1`: metadata-only report trails captured from gated VAT/business tax PDF exports.
- `afro_vat_business_tax_plan_v1`: selected workflow and next category.
- `afro_vat_business_tax_filing_packs_v1`: metadata-only filing pack route records.
- `afro_vat_business_tax_readiness_v1`: readiness boards, checklist state, score, and exception queue.
- `afro_vat_business_tax_audit_packets_v1`: exported metadata audit packet records.

The workflow must never store invoice line items, customer names, generated PDF bytes, raw tax calculations, uploaded files, or source tax documents. Store only metadata needed to continue the task.

## Workspace Item Types

- `vat-business-tax-report`
- `vat-business-tax-filing-pack`
- `vat-business-tax-readiness`
- `vat-business-tax-audit-packet`

Each item uses `meta.category = "vat-business-tax"` when synced through `AfroWorkspace`.

## Free vs Pro Gates

Core calculators remain usable. Guests and free users can plan locally and generate basic report trails. Exported workflow packets use the shared PDF download gate. Free workspace limits:

- 20 report trails
- 3 active filing packs
- 3 audit packets per month
- 3 readiness boards

Pro removes recurring, multi-country, team-history, filing-pack, and audit-packet limits.

## Advanced Workflow Features

- Smart workflow profile shows risk level, focus, next action, destination impact, and Pro posture.
- Readiness boards calculate a score from report trails, filing packs, checklist state, account sync, and open exceptions.
- Metadata audit packets export a JSON trail through the shared account gate without storing tax files or invoice detail.
- Cross-category handoffs connect VAT work to Document & PDF, Salary & PAYE, Trade, Legal, AfroPayroll, and Dashboard workspaces.
- Continue work from the dashboard when a report trail, filing pack, readiness board, or audit packet exists.

## Source Anchors

Use official authority pages before changing current VAT facts:

- Ghana Revenue Authority VAT: https://gra.gov.gh/domestic-tax/tax-types/vat/
- Kenya Revenue Authority VAT: https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax
- South African Revenue Service VAT: https://www.sars.gov.za/types-of-tax/value-added-tax/

Current 3 May 2026 fixes landed in this batch:

- Ghana effective standard charge is 20%: 15% VAT, 2.5% NHIL, and 2.5% GETFund. GRA also lists the goods registration threshold at GHS 750,000.
- Kenya's current VAT rates are 16% standard and 0% zero-rated supplies. The old 8% petroleum rate is not a current calculator option.
- South Africa remains at 15%; the calculator uses the R2.3 million compulsory registration threshold effective from 1 April 2026.

## Verification

Run:

```bash
npm run vat-business-tax:verify
```

For broader release work, also run the normal category/registry checks:

```bash
npm run check-links
npm run audit
```
