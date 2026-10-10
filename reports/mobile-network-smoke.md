# Mobile Network Smoke

Generated: 2026-10-10T00:08:58.862Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 13657ms | 17643ms | 6896ms | 1.51 MB | 121 | 0px | 0 | WARN |
| `/search/` | 200 | 3557ms | 9407ms | 4108ms | 733.8 KB | 40 | 0px | 0 | WARN |
| `/salary-tax/` | 200 | 3656ms | 5513ms | 3652ms | 317.2 KB | 23 | 0px | 0 | PASS |
| `/nigeria/ng-salary-tax` | 200 | 7470ms | 10192ms | 4940ms | 956.9 KB | 34 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 5428ms | 9657ms | 2476ms | 660.9 KB | 39 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 6911ms | 10938ms | 5080ms | 786.2 KB | 48 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 13657ms; load 17643ms; LCP 6896ms; 121 resources
- `/search/`: CLS 1.485
- `/nigeria/ng-salary-tax`: DCL 7470ms; LCP 4940ms
- `/tools/mobile-money-fees/`: CLS 1.943
- `/telecom/airtime-value/`: DCL 6911ms; LCP 5080ms; CLS 0.941; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
