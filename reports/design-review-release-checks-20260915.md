# Design review: release-check findings

## Confirmed repairs

- The final shared stylesheet cache version caused 45 protected HTML formula fingerprints to differ. Comparing all 45 against base `e2a41182ab087e2c540207049fbfc1fa1571d9e8` showed the base matched every recorded digest. Replacing only `top-level-page-ui-refresh.css?v=f1530a1b` with its reviewed baseline cache key restored every digest. Formula registry values and golden fixtures were not refreshed.
- `scripts/lib/calculation-quality.js` now normalizes that specific presentation asset's eight-character cache key, following the existing shared-CSS normalization. Tests retain protection for formula rates, changed asset paths, and additional query fields.
- `build:seo` now stamps the service worker after final cachebusting. Previously its precache retained the prior navbar version even though the final homepage referenced the new version.

## Validation

- Initial `npm run build:checks`: failed at calculation-quality due to the 45 cache-key-only mismatches; preceding checks passed, with automation evidence warnings.
- `node --test tests/calculation-quality.test.js`: passed, including the new positive and negative digest checks.
- `npm run calculation-quality:check`: passed; 789 artifacts, 307/307 fixtures, one stale dataset warning.
- All commands following calculation-quality in `build:checks` were run in their original order and passed. Search snippets: 9,874 indexable pages, zero error pages, 653 review candidates.
- `npm run security:scan`: passed after these source changes.
- Final `npm run build:deploy` is being rerun; its terminal result and artifact audit must be recorded before release readiness is claimed.

## Browser confirmation on the first complete build

Built artifact served at local port 4187. Homepage at 320px passed light and dark layout checks: document client and scroll width both 314px, no broken completed images. Menu opened, theme switched, and menu closed while preserving dark mode. Save/sync notice dismissed. Nigeria salary example populated the input, updated the recommendation link, and announced the changed recommendation.

This is representative browser coverage, not a claim that every route or browser engine was exercised. Download completion remains unverified because the in-app browser cancelled the image download. No production deployment occurred.

## Local evidence

Ignored artifacts under `artifacts/design-tool-review-20260915/`: `formula-baseline-comparison.json`, `calculation-quality-tests.log`, `release-check-tail.log`, `final-security-scan.log`, and `final-build-deploy.log`.
