# Mobile Network Smoke

Generated: 2026-05-19T08:19:45.980Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 8212ms | 10256ms | 564ms | 847.5 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 2934ms | 8600ms | 2892ms | 641.9 KB | 18 | 0px | 0 | PASS |
| `/salary-tax/` | 200 | 441ms | 1391ms | 1396ms | 88.3 KB | 9 | 0px | 0 | PASS |
| `/nigeria/ng-salary-tax` | 200 | 6081ms | 6084ms | 1704ms | 644.7 KB | 14 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 11724ms | 11945ms | 2332ms | 1.05 MB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 7235ms | 7972ms | 2100ms | 544.8 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 8212ms; CLS 0.473
- `/nigeria/ng-salary-tax`: DCL 6081ms
- `/tools/mobile-money-fees/`: DCL 11724ms
- `/telecom/airtime-value/`: DCL 7235ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
