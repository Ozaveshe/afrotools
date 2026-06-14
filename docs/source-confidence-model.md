# AfroTools Source Registry and Confidence Model

AfroTools AI should route users into practical tools, but the trust layer comes from source-aware local data. This model gives calculators, workflow cards, exports, and future AI explanations one shared way to describe where data came from, how fresh it is, and how much confidence users should place in it.

## DataSourceMeta Schema

Registry file: `data/source-registry.json`

Schema file: `data/source-registry.schema.json`

Reusable helper: `assets/js/lib/source-confidence.js`

Required fields:

- `id`: stable source id used by tools and AI workflow cards.
- `sourceName`: human-readable source label.
- `sourceType`: one of `official`, `regulator`, `central_bank`, `tax_authority`, `university`, `foundation`, `government`, `reviewed_dataset`, `third_party_snapshot`, `partner`, `user_input`, `estimate`, or `unknown`. The core public contract is official/regulator/central-bank/university/foundation/reviewed-dataset/third-party/user-input/estimate; `tax_authority`, `government`, `partner`, and `unknown` are repo-specific refinements or fallbacks.
- `countryCodes`: ISO-style country codes, or `ALL` for pan-African/general metadata.
- `appliesTo`: one or more of `tax`, `fuel`, `fx`, `import_duty`, `scholarships`, `education`, `salary`, `business`, `energy`, `country_profile`, `documents`, or `other`.
- `freshnessStatus`: `fresh`, `acceptable`, `stale`, `unknown`, or `unavailable`.
- `confidence`: `official_verified`, `reviewed`, `estimated`, `low_confidence`, `user_entered`, or `unavailable`. `unavailable` is an internal fallback for unknown or unmigrated data.

Optional fields:

- `sourceUrl`
- `effectiveFrom`
- `effectiveTo`
- `lastCheckedAt`
- `lastReviewedAt`
- `reviewCadenceDays`
- `notes`
- `displayDisclaimer`

## Confidence Definitions

- `official_verified`: use only when the registry entry has a source URL or documented official backing and the data has been reviewed recently enough for the tool. Do not infer this from a government-like topic.
- `reviewed`: AfroTools has reviewed the dataset or source pack, but it is still a planning aid.
- `estimated`: values are modeled, benchmarked, snapshot-based, or partially inferred.
- `low_confidence`: data is incomplete, old, ambiguous, or awaiting review.
- `user_entered`: the user supplied the value; AfroTools did not verify it.
- `unavailable`: no usable source metadata exists yet.

## Freshness Policy

`calculateFreshnessStatus(sourceMeta)` uses `lastCheckedAt`, then `lastReviewedAt`, then `effectiveFrom`. If a review cadence is present:

- age up to `reviewCadenceDays`: `fresh`
- age up to double the cadence: `acceptable`
- older than double the cadence: `stale`

If no usable date exists, the helper falls back to the registry's explicit status or `unknown`. `unavailable` always stays unavailable.

## How To Add Source Metadata

1. Add one entry to `data/source-registry.json`.
2. Use the most cautious truthful confidence value.
3. Add `sourceUrl` only when it is stable and relevant.
4. Add `displayDisclaimer` in plain user language.
5. Reference the id from the tool page with:

```html
<div class="afro-source-meta" data-source-meta-id="example-source-id" data-source-meta-compact="true"></div>
<script src="/assets/js/lib/source-confidence.js" defer></script>
```

6. Add or update tests for schema validation, freshness behavior, and UI rendering.

## Claims Not Allowed

- Do not call data official, verified, real-time, regulator-approved, or government-approved unless the metadata supports `official_verified`.
- Do not imply payment, filing, admission, visa, tax, customs, fuel, salary, or legal outcomes are guaranteed.
- Do not hide stale or unknown source states behind optimistic copy.
- Do not send source-sensitive user content to AI endpoints without the relevant consent boundary.

## Current Migrations

- Import Duty Calculator: `import-duty-planning-rates`, confidence `reviewed`.
- Scholarship Finder: `scholarship-provider-feed`, confidence `reviewed`.
- AfroFuel/Fuel Tracker: `afrofuel-static-snapshot`, confidence `estimated`.
- PAYE Calculator: `paye-tax-engine-country-packs`, confidence `reviewed`.
- `/ai/` workflow cards: cautious source hints for import duty, scholarships, fuel/energy, and PAYE workflows.

## Migration Checklist

- [ ] Existing tool disclaimer preserved.
- [ ] Registry entry uses cautious confidence.
- [ ] UI shows source, freshness, confidence, and plain disclaimer without crowding the form.
- [ ] AI card hint does not overclaim official verification.
- [ ] Tests cover schema, freshness, stale warnings, unknown source copy, and affected routes.
