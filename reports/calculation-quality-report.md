# Calculation Quality Report

As of: 2026-07-12

## Inventory

- Total artifacts: 407
- High risk: 306
- Medium risk: 57
- Low risk: 44

## Traceability

- Protected PAYE/VAT records: 119
- Formula-mapped records: 119
- Gaps: 0

## Review backlog

- High-risk effective dates requiring review: 171
- Medium-risk effective dates requiring review: 0
- High-risk sources requiring review: 0
- Medium-risk sources requiring review: 18
- Currency overrides requiring review: 1
- Legacy protected formula records: 119

## Golden fixtures

- Passed: 167/167
- Documented result changes: 0

## External data

- Registered datasets: 3
- Stale: forex-live-rates, fuel-live-prices, policy-live-rates
- Incompatible: none

## Findings

- WARNING CURRENCY_OVERRIDE_REVIEW_REQUIRED formula-registry: 1 formula currency override remains explicitly review-required.
- WARNING EFFECTIVE_DATE_REVIEW_REQUIRED formula-registry: 171 high-risk and 0 medium-risk formula records have unknown statutory effective dates; they remain explicitly review-required.
- WARNING SOURCE_REVIEW_REQUIRED formula-registry: 0 high-risk and 18 medium-risk formula records still require authoritative-source review.
- WARNING STALE_EXTERNAL_DATA forex-live-rates: Stale exchange-rate estimate
- WARNING STALE_EXTERNAL_DATA fuel-live-prices: Stale fuel-price estimate
- WARNING STALE_EXTERNAL_DATA policy-live-rates: Stale policy-rate reference
