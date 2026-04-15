# Category Taxonomy Layer

Use `assets/js/components/category-taxonomy.js` when a category page grows too large for hand-maintained cards or one-off grouping logic.

## Current Scope

- English Agriculture taxonomy
- Shared across:
  - `agriculture/index.html`
  - Agriculture bucket hubs under `agriculture/*/index.html`
  - `scripts/agriculture-taxonomy-report.js`

## Design Rules

- Count registry-backed English `live` and `new` tools unless a page explicitly needs another scope.
- Map by stable tool family prefixes first, not by enumerating hundreds of individual tools.
- Keep one primary bucket per tool so counts remain explainable.
- Use a small fallback keyword layer only for outliers such as `/tools/...` entries.

## Reporting

Run:

```bash
npm run agriculture:taxonomy
# or
node scripts/agriculture-taxonomy-report.js
```

This prints:

- total registry-backed Agriculture tools
- count per bucket
- duplicate assignment count
- missing assignment count

## Extending To Other Categories

If another category needs the same treatment:

1. Add a new bucket config in `category-taxonomy.js`
2. Prefer family-level mapping over tool-level mapping
3. Add a matching report script if validation needs to be repeatable
4. Reuse the shared page shell before creating more custom hub logic
