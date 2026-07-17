# AfroTools Source Registry and Confidence Model

AfroTools data tools should make the source state visible before users rely on a result. The shared model lives in:

- `data/source-registry.json`
- `data/source-registry.schema.json`
- `assets/js/lib/source-confidence.js`
- `tests/source-confidence.test.js`

## DataSourceMeta

Each registry entry uses the shared `DataSourceMeta` contract.

Required fields:

- `id`: stable source id used by tools, AI workflow cards, and tests.
- `sourceName`: user-readable source label.
- `sourceType`: one of `official`, `regulator`, `central_bank`, `university`, `foundation`, `reviewed_dataset`, `third_party_snapshot`, `user_input`, or `estimate`.
- `countryCodes`: ISO-style country codes, or `ALL` for pan-African/general metadata.
- `appliesTo`: one or more scopes such as `tax`, `fuel`, `fx`, `import_duty`, `scholarships`, `education`, `salary`, `business`, `energy`, `country_profile`, `documents`, or `other`.
- `lastCheckedAt`: the last automated/manual source check date, or `null` when not applicable.
- `lastReviewedAt`: the last human/product review date, or `null` when not applicable.
- `freshnessStatus`: `fresh`, `acceptable`, `stale`, `unknown`, or `unavailable`.
- `confidence`: `official_verified`, `reviewed`, `estimated`, `low_confidence`, or `user_entered`.
- `notes`: internal-facing context for reviewers.
- `displayDisclaimer`: short user-facing caution copy.

Optional fields:

- `sourceUrl`
- `effectiveFrom`
- `effectiveTo`
- `reviewCadenceDays`
- `toolIds`: canonical tool-registry ids covered by the source entry.
- `routes`: public routes that should render this source entry.

## Confidence Rules

- `official_verified`: only when a stable official/regulator/central-bank/university/foundation source backs the claim and the data has been reviewed recently enough for that tool.
- `reviewed`: AfroTools reviewed the dataset or source pack, but it remains a planning aid.
- `estimated`: modeled, benchmarked, third-party snapshot, or partially inferred data.
- `low_confidence`: incomplete, stale, ambiguous, blocked, or awaiting review.
- `user_entered`: supplied by the user; AfroTools did not verify it.

Do not add new public confidence values. Unknown or unmigrated data should normalize to `low_confidence`.

## Freshness Rules

`calculateFreshnessStatus(sourceMeta, today)` uses `lastCheckedAt`, then `lastReviewedAt`, then `effectiveFrom`.

When `reviewCadenceDays` is present:

- Age up to `reviewCadenceDays`: `fresh`
- Age up to double the cadence: `acceptable`
- Older than double the cadence: `stale`

If no usable date exists, the helper falls back to the explicit registry `freshnessStatus` or `unknown`. `unavailable` stays unavailable.

## Existing Patterns Inspected

- PAYE: country engines and high-risk pages carry tax authority source panels and planning disclaimers; the pan-African index now references `paye-tax-engine-country-packs`.
- Fuel: `data/fuel/latest.json` is a static third-party snapshot with `source_state`, `official_verified_count`, `source_reviewed_at`, and row-level official-source hints; Fuel Tracker now references `afrofuel-static-snapshot`.
- FX: `data/_meta.json` marks `forex` from `exchangerate-api`; the shared registry marks it stale until refreshed.
- Rates: `data/rates/latest.json` plus `data/_meta.json` combine official policy pages, manual official overrides, and World Bank inflation context; the shared registry uses `afrorates-policy-rate-pack`.
- Scholarships: `data/scholarships/official-sources.json` requires row-level source URL, confidence mode, last seen, and last verified metadata; the shared registry uses `scholarship-provider-feed`.
- Country profiles: country hubs and AfroAtlas pages use reviewed country/profile data; the shared registry starts with `country-profile-reviewed-dataset`.
- Import duty: `assets/js/lib/import-duty-data-trust.js` already separates official, estimate, and user-input fields; the public calculator now references `import-duty-planning-rates`.
- VAT: country VAT pages have high-risk source-verification panels; the shared registry starts with `vat-country-rate-packs`.

## Rendering Source UI

Add this near the relevant result, selected data card, or page-level trust area:

```html
<div class="afro-source-meta" data-source-meta-id="example-source-id" data-source-meta-compact="true"></div>
<script src="/assets/js/lib/source-confidence.js" defer></script>
```

The helper renders source, freshness, confidence, and stale-data warnings. It does not make any data official by itself.

## Current Migrations

- Fuel Tracker: `tools/fuel-tracker/index.html` uses `afrofuel-static-snapshot`.
- Import Duty Calculator: `tools/import-duty/index.html` uses `import-duty-planning-rates`.
- PAYE Calculator index: `tools/paye-calculator/index.html` uses `paye-tax-engine-country-packs`.

## Migration Steps For Remaining Tools

1. Identify the authoritative source pattern already used by the tool: official source panel, `_meta` freshness, row-level source fields, source ledger, or user-entered data.
2. Add a cautious entry to `data/source-registry.json`; use `estimated` or `low_confidence` when official verification is incomplete.
3. Include `lastCheckedAt` and `lastReviewedAt` explicitly. Use `null` only for user-entered or unavailable source states.
4. Add the `data-source-meta-id` UI hook on the page or result surface.
5. Keep existing tool-specific warnings, filing disclaimers, and field-level trust labels unless the shared helper fully replaces them.
6. Add or update tests for schema validity, freshness calculation, stale warnings, and the page hook.
7. Run `npm run test:source-confidence`, then the narrow workflow verifier for the touched tool.

## Claims Not Allowed

- Do not call data official, verified, real-time, regulator-approved, or government-approved unless the metadata supports `official_verified`.
- Do not imply payment, filing, admission, visa, tax, customs, fuel, salary, legal, or investment outcomes are guaranteed.
- Do not hide stale or unknown source states behind optimistic copy.
- Do not send source-sensitive user content to AI endpoints without the relevant consent boundary.
