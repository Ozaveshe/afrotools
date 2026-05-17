# Mobile Network Smoke

Generated: 2026-05-16T13:03:27.952Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 7954ms | 10215ms | 712ms | 809.6 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 1622ms | 8730ms | 1528ms | 576.1 KB | 18 | 0px | 0 | PASS |
| `/salary-tax/` | 200 | 429ms | 1596ms | 1596ms | 86.3 KB | 10 | 0px | 0 | PASS |
| `/nigeria/ng-salary-tax` | 200 | 3374ms | 3614ms | 2056ms | 238.4 KB | 13 | 0px | 0 | PASS |
| `/tools/mobile-money-fees/` | 200 | 13389ms | 13883ms | 1692ms | 937.2 KB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 9494ms | 10628ms | 1196ms | 506.8 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 7954ms; CLS 0.422
- `/tools/mobile-money-fees/`: DCL 13389ms; load 13883ms
- `/telecom/airtime-value/`: DCL 9494ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
