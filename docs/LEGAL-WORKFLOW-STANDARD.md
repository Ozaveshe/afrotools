# Legal Workflow Standard

The Legal category has two workflow layers:

- The hub planner on `/legal/` saves category-level matter packs under `afro_category_workflow_packs_v1` with item type `category-workflow-pack`.
- The per-tool legal copilot on hub-linked legal apps saves app-level workflows under `afro_legal_workflows` with item type `legal-workflow`.

## Required Coverage

- `/legal/` must expose 69 unique legal app cards and JSON-LD `numberOfItems: 69`.
- Every hub-linked legal app must include `assets/js/legal-workflow-copilot.js`.
- Every hub-linked legal app must include a `leg-workflow-copilot` panel with evidence checks, risk flags, save, load, copy, gated checklist unlock, and print/save PDF actions.
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
