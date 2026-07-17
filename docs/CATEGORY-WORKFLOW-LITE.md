# Category Workflow Lite

This shared layer gives AfroTools a consistent saved-workflow pattern without rebuilding every category into a custom app.

## Current Categories

- Legal & Compliance at `/legal/`
- Agriculture at `/agriculture/`
- Education at `/education/`

## What It Adds

- A category planner with lane and destination selectors for dashboard or explicit workspace contexts.
- Metadata-only workflow packs saved under `afro_category_workflow_packs_v1`.
- Dashboard continuation through the `category-workflow-pack` workspace item type.
- Free vs Pro distinction: free and guest users keep three active packs per category, Pro users keep unlimited packs.
- Gated export through `assets/js/lib/pdf-download-gate.js` before downloading the generated pack.

## Public Hub Boundary

Public category hubs must not auto-mount this layer. The helper, CSS, and saved-pack renderer belong in dashboard continuation surfaces or explicit workspace entry points, not on the public `/legal/`, `/agriculture/`, or `/education/` category pages. Public hubs should stay focused on discovery, tool routing, and user-facing category guidance.

Do not expose checklist, open-items, saved-pack, export-pack, or workspace readiness UI on public category hubs unless the page is explicitly designed as a public planner and has a verifier that hides saved workspace state.

## Privacy Boundary

Workflow packs store route metadata only: category, lane, destination, readiness score, risk label, next steps, and timestamps. They must not store uploaded documents, legal facts, farm files, student essays, or personally sensitive source data.

## Implementation Files

- `assets/js/lib/category-workflow-lite.js`
- `assets/css/category-workflow-lite.css`
- `assets/css/workflow-tightening.css`
- `dashboard/index.html`
- `scripts/verify-category-workflow-lite.js`

## Validation

Run:

```bash
npm run category-workflow:verify
```

For category work that also touches Salary, Document & PDF, or VAT, keep the three existing workflow verifiers green:

```bash
npm run salary-tax:verify
npm run document-pdf:verify
npm run vat-business-tax:verify
```
