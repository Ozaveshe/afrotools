# Mobile Network Smoke

Generated: 2026-05-18T18:33:25.626Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 7880ms | 10016ms | 600ms | 831.2 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 16231ms | 16244ms | 2612ms | 1.50 MB | 19 | 0px | 0 | WARN |
| `/salary-tax/` | 200 | 9404ms | 9408ms | 1496ms | 1017.9 KB | 10 | 0px | 0 | WARN |
| `/nigeria/ng-salary-tax` | 200 | 5839ms | 5840ms | 1476ms | 621.3 KB | 14 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 11616ms | 11845ms | 1816ms | 1.03 MB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 7115ms | 7817ms | 1620ms | 528.4 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 7880ms; CLS 0.422
- `/search/`: DCL 16231ms; load 16244ms
- `/salary-tax/`: DCL 9404ms
- `/nigeria/ng-salary-tax`: CLS 0.146
- `/tools/mobile-money-fees/`: DCL 11616ms
- `/telecom/airtime-value/`: DCL 7115ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
