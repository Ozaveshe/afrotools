# Legal Workflow Standard

The Legal category uses the current source-owned workflow for each route:

- The public `/legal/` hub links to tools and dashboard continuation; it does not mount the category planner. Dashboard category packs use `afro_category_workflow_packs_v1` with item type `category-workflow-pack`.
- The 48 remaining per-tool legal copilots save workflows under `afro_legal_workflows` with item type `legal-workflow`.
- Twenty property tools use the assumption-only property engine and page owner. Kenya DPA uses the government evidence planner. These 21 replacements intentionally do not collect or persist workflow facts through the generic copilot.

## Required Coverage

- `/legal/` must expose 69 unique legal app cards and JSON-LD `numberOfItems: 69`.
- The 48 copilot routes must include `assets/js/legal-workflow-copilot.js`. The exact 21 replacement routes are checked by `scripts/verify-legal-workflow.js`, which also runs their existing input, calculation and privacy contracts. Unknown routes do not receive an exemption.
- Every copilot route must include a `leg-workflow-copilot` panel with evidence checks, risk flags, save, load, copy, gated checklist unlock, and print/save PDF actions.
- The hub planner must cover company, privacy, contracts, property, labour, personal legal/court help, and travel/visa records.
- Saved packs must remain metadata-only. Do not store legal facts, source documents, uploaded files, raw affidavits, client documents, IDs, or contract contents in the category pack.
- Guests and free users can keep three active legal category packs; Pro users can keep unlimited packs.

## Verification

Run:

```bash
npm run legal-workflow:verify
```

For a broader category regression pass, also run:

```bash
npm run category-workflow:verify
npm run check-links
npm run audit
```
