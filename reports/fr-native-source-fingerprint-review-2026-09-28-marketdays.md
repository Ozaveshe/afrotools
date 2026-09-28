# MarketDay native source fingerprint review — 28 September 2026

Reviewed the complete set of 20 bridge and 14 native English source owners and their dependency fingerprints against the cumulative release based on 298f65a3e85d3ec415a96350060fee356335e450. Only the MarketDay HTML fingerprint changed. The exact four-file source patch is producer commit 4e050e5e8422c59c627f89662f52b96e6b1bbecc.

The patch improves invalid-date handling, stale trip state, clipboard recovery and focus feedback. Calculation owners assets/js/engines/igbo-market-days.js and assets/js/pages/market-days.js are unchanged. Calendar source data, fixture inputs, expected outputs, normalizer and parity thresholds are unchanged. Trip controls remain local-only.

The clean baseline passes the native engine check; applying only the MarketDay candidate reproduces the fingerprint failure. After review, the native MarketDay source fingerprint is c3557fde95fe33264a1d7033b3fb1fa63e691aedc21decb9c88b9710062bf5fe. This updates source identity, not expected calculation results.

The existing French/English MarketDay browser comparison passed on the cumulative source using all original calculation, export, mutation and active-checkout assertions. The private harness changed only module paths and the evidence directory. The artifact workflow checks also pass. This repair changes only the private test fixture and this review record; public artifact bytes are unchanged.

Operational evidence: daily-5pm-publish-deploy-gate/runs/2026-09-28-01a0e3b6-ready-batch/market-oracle-isolation.json, market-oracle-complete-drift-review.json, native2-extra-results.json and unit-reconciliation.json.
