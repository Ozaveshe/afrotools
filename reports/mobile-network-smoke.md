# Mobile Network Smoke

Generated: 2026-10-02T02:16:48.674Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 13148ms | 16708ms | 6292ms | 1.49 MB | 121 | 0px | 0 | WARN |
| `/search/` | 200 | 3497ms | 9051ms | 4076ms | 729.6 KB | 40 | 0px | 0 | WARN |
| `/salary-tax/` | 200 | 3441ms | 5219ms | 3444ms | 314.8 KB | 23 | 0px | 0 | PASS |
| `/nigeria/ng-salary-tax` | 200 | 6791ms | 9349ms | 4500ms | 856.1 KB | 33 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 4992ms | 8669ms | 2176ms | 657.6 KB | 35 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 5664ms | 9999ms | 4664ms | 782.1 KB | 48 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 13148ms; load 16708ms; LCP 6292ms; 121 resources
- `/search/`: CLS 1.485
- `/nigeria/ng-salary-tax`: DCL 6791ms; CLS 0.118
- `/tools/mobile-money-fees/`: CLS 1.943
- `/telecom/airtime-value/`: LCP 4664ms; CLS 0.941; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
