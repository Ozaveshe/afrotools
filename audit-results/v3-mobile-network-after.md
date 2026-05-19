# Mobile Network Smoke

Generated: 2026-05-19T06:44:51.735Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 9189ms | 10973ms | 812ms | 821.7 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 3617ms | 10166ms | 3404ms | 555.0 KB | 15 | 0px | 0 | PASS |
| `/salary-tax/` | 200 | 451ms | 2261ms | 2276ms | 88.3 KB | 9 | 0px | 0 | PASS |
| `/nigeria/ng-salary-tax` | 200 | 6050ms | 6053ms | 2152ms | 639.3 KB | 14 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 12889ms | 13630ms | 3240ms | 1.05 MB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 8238ms | 8733ms | 2424ms | 544.8 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 9189ms; CLS 0.468
- `/nigeria/ng-salary-tax`: DCL 6050ms
- `/tools/mobile-money-fees/`: DCL 12889ms; load 13630ms
- `/telecom/airtime-value/`: DCL 8238ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
