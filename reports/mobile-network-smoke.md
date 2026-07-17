# Mobile Network Smoke

Generated: 2026-05-19T20:50:40.700Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 7944ms | 9884ms | 536ms | 847.5 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 2809ms | 8627ms | 2772ms | 641.9 KB | 18 | 0px | 0 | PASS |
| `/salary-tax/` | 200 | 419ms | 1446ms | 1456ms | 88.3 KB | 9 | 0px | 0 | PASS |
| `/nigeria/ng-salary-tax` | 200 | 6101ms | 6104ms | 1736ms | 644.7 KB | 14 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 11886ms | 12149ms | 2372ms | 1.05 MB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 7585ms | 7941ms | 2092ms | 544.8 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 7944ms; CLS 0.473
- `/nigeria/ng-salary-tax`: DCL 6101ms
- `/tools/mobile-money-fees/`: DCL 11886ms; load 12149ms
- `/telecom/airtime-value/`: DCL 7585ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
