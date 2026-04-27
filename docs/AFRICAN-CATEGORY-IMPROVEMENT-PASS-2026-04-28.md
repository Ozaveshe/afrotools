# African Category Improvement Pass - 2026-04-28

## Scope

This pass upgrades the African category hub and the registry-backed African tools surfaced through `assets/js/components/tool-registry.js`. The visible hub was treated as the starting page, but coverage followed the registry so the pass did not stop at featured cards only.

## Product Changes

- Added a connected African workflow layer in `assets/js/african-workflow.js` and `assets/css/african-workflow.css`.
- Wired the workflow layer into the African hub and every African-category tool page.
- Added email-gated print/PDF export actions for category plans and tool workflow plans through the existing `/api/capture-lead` lead endpoint.
- Added local dashboard continuity through `localStorage.african_workflow_items`.
- Added signed-in workspace persistence through `AfroWorkspace.upsert` when the account workspace API is available.
- Added African workflow rendering in `dashboard/index.html` under My Workspace.
- Added a second-pass competitor/source playbook for every African app. Each playbook records the competitor or official source checked, the gap found, the AfroTools upgrade, a short checklist, and the PDF handoff label.
- Added form email capture for African tools that already include an email input, so form submissions can feed the same lead source without forcing unrelated forms into a new flow.
- Added saveable route plans on the hub, so users can save relocation, money movement, household budget, community finance, market intelligence, or creative economy journeys before opening the first tool.
- Expanded dashboard payloads with source links, upgrade notes, check counts, and next-tool links.

## App Upgrade Pattern

Each app received or retained a specific workflow upgrade, not a generic copy pass. The upgrades focused on the next user decision after the calculation, such as relocation readiness, remittance routing, savings-group governance, market buying decisions, production quoting, or cultural-use notes.

Late-pass examples:

- `tools/nollywood-pitch/index.html` now builds a pitch and finance readiness brief.
- `tools/okada-income/index.html` now includes rainy-day, permit, savings, bike-goal, and reserve planning.
- `tools/market-days/index.html` now builds an Igbo market trip brief.
- `tools/ajo-chama/index.html` now adds reserve, grace-period, default, and reminder rules for group governance.
- `tools/african-proverbs/index.html` now turns selected proverbs into respectful usage notes.
- `tools/afroprices/index.html` now adds a buyer decision desk with budget, urgency, warranty, and channel checks.
- `tools/ankara-kente-cost/index.html` now adds production quote building for designers and tailors.
- `tools/fabric-cost/index.html` now adds garment yardage estimation and tailor quote planning.

Second-pass workflow examples:

- The hub now exposes saveable route plans rather than only a grid of tools.
- Each app-level workflow panel shows a competitor-informed gap and a three-step checklist.
- PDF/export buttons are now specific to the tool workflow, such as relocation readiness, trader spread, textile quote, or situation brief.
- Dashboard cards now show the saved upgrade note and suggested next tools, not just the original tool link.

## Validation Notes

Run these checks after future edits to this package:

```bash
npm run audit
```

For narrow syntax proof on this package, parse inline scripts on the African pages and parse `assets/js/african-workflow.js` with `new Function(...)`. Browser smoke should cover the hub plus at least one tool from money movement, household, community finance, market intelligence, culture, and creative economy.
