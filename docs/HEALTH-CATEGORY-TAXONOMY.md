# Health Category Taxonomy

The English health category now uses one shared mapping source:

- `assets/js/components/health-taxonomy.js`

That file is the source of truth for:

- The 6 exclusive Health registry buckets
- Which registry-backed health tools belong to each bucket
- Which tools are featured on `/health/`
- Which flagship surfaces are shown separately near the top
- Which focused routes power `/health/costs/` and `/health/insurance/`
- Which legacy URLs are only aliases and should not be implied as standalone hubs

## Standard Buckets

1. `Vitals & Body Metrics`
2. `Lab Reports & Medical Interpretation`
3. `Nutrition & Fitness`
4. `Women's & Family Health`
5. `Health Costs & Insurance`
6. `Clinical / Professional Utilities`

## Flagship Surface Rule

- The Health hub now treats flagship surfaces as a separate layer from the bucket taxonomy.
- Registry-backed flagships are still part of the Health registry total.
- Connected cross-category surfaces can be shown for navigation, but must be labeled as outside the Health registry count.

Current flagship handling:

- `Medical Report Interpreter`, `BMI Calculator for Africans`, `Calorie Counter (African Foods)`, and `Pregnancy Due Date Calculator` are registry-backed flagship health surfaces.
- `Health Insurance Comparator` is a connected insurance surface shown for navigation and is not part of the Health registry count.

This separation is intentional: forcing a `Health Products / Platforms` bucket into the exclusive taxonomy would duplicate tools and break count consistency.

## Sub-Hub Rule

- `/health/costs/` and `/health/insurance/` are now real focused routes backed by the shared taxonomy.
- `/health/medical-aid/` and `/health/nhif/` are legacy alias URLs and should redirect to the real insurance route instead of pretending to be standalone destination pages.

## Count Rule

- The Health registry total is the number of English registry entries where `category === 'health'`.
- Connected insurance surfaces must never be silently folded into that total.
- When updating copy or schema counts, update the shared taxonomy first and then make the page copy match it.

## Audit Rule

- `AfroHealth.auditTaxonomy()` should return zero duplicate assignments and zero missing Health registry IDs.
- If counts drift, fix the taxonomy mapping instead of hardcoding a new number into the page first.
