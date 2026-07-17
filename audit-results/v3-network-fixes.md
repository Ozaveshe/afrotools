# V3 Africa Mobile Network Fixes

## Before

Evidence: `audit-results/v3-mobile-network-before.txt`, `audit-results/v3-mobile-network-before.md`, and `audit-results/v3-mobile-network-resource-breakdown.md`.

Before v3 network work, all sampled routes returned WARN under the Africa mobile 3G/low 4G profile:

- `/`: 865 KB transfer, 101 resources, DCL 9111ms, CLS 0.442.
- `/search/`: 1.53 MB transfer, DCL 15872ms.
- `/salary-tax/`: 1.05 MB transfer, DCL 9526ms.
- `/nigeria/ng-salary-tax`: 652 KB transfer, DCL 6017ms.
- `/tools/mobile-money-fees/`: 1.10 MB transfer, DCL 12065ms.
- `/telecom/airtime-value/`: 555 KB transfer, DCL 7598ms, static function warnings.

Main causes:

- Full `tool-registry.min.js` loaded on lightweight index pages.
- `navbar.min.js` around 278 KB loaded broadly.
- `related-tools-data.min.js` around 384 KB loaded on some calculators.
- Chart.js CDN on mobile-money.
- Large homepage HTML/CSS/image bundle and CLS.
- Static smoke cannot call Netlify functions on telecom pages.

## Fixes

- Removed full `tool-registry.min.js` from `search/index.html` and `salary-tax/index.html`.
- Made that removal build-survivable in `scripts/update-html-bundles.js` and `scripts/prune-unused-registry.js`.
- Added retry-safe file writing to search/salary index generation and registry pruning so `build:deploy` can complete reliably on Windows.
- Verified that final built `search/index.html` and `salary-tax/index.html` do not regain the full registry script.

## After

Evidence: `audit-results/v3-final-mobile-network.txt`, `audit-results/v3-final-mobile-network.md`, and `audit-results/v3-final-mobile-network-breakdown.md`.

- Verdict: WARN
- Routes audited: 6
- PASS: 2
- WARN: 4
- FAIL: 0

After route results:

- `/search/`: PASS, 641.9 KB transfer, DCL 2934ms, no overflow, no sub-16 controls.
- `/salary-tax/`: PASS, 88.3 KB transfer, DCL 441ms, no overflow, no sub-16 controls.
- `/`: WARN, 847.5 KB transfer, DCL 8212ms, CLS 0.473.
- `/nigeria/ng-salary-tax`: WARN, 644.7 KB transfer, DCL 6081ms.
- `/tools/mobile-money-fees/`: WARN, 1.05 MB transfer, DCL 11724ms.
- `/telecom/airtime-value/`: WARN, 544.8 KB transfer, DCL 7235ms, static function warnings.

## Remaining WARN Explanation

The remaining WARN is fully explained and does not hide a broken core flow:

- Homepage: mainly `navbar.min.js`, homepage HTML/CSS/image weight, and CLS.
- Nigeria salary: `related-tools-data.min.js`, `navbar.min.js`, and large inline HTML.
- Mobile money: `related-tools-data.min.js`, `navbar.min.js`, Chart.js, and page HTML.
- Telecom: `navbar.min.js`, `theme-dark.min.css`, `telecom-toolkit.js`, plus static-only function availability warnings.

Release status: non-blocking only if the team accepts the documented constrained-network debt and prioritizes navbar/data splitting next.
