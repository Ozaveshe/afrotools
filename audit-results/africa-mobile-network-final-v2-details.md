# Mobile Network Smoke

Generated: 2026-05-19T04:49:02.408Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 8074ms | 9930ms | 544ms | 841.5 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 16553ms | 16584ms | 2936ms | 1.53 MB | 19 | 0px | 0 | WARN |
| `/salary-tax/` | 200 | 9513ms | 9519ms | 1664ms | 1021.6 KB | 10 | 0px | 0 | WARN |
| `/nigeria/ng-salary-tax` | 200 | 5956ms | 5958ms | 1532ms | 629.8 KB | 14 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 11880ms | 12325ms | 2176ms | 1.04 MB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 7654ms | 8014ms | 2040ms | 538.8 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 8074ms; CLS 0.422
- `/search/`: DCL 16553ms; load 16584ms
- `/salary-tax/`: DCL 9513ms
- `/nigeria/ng-salary-tax`: CLS 0.182
- `/tools/mobile-money-fees/`: DCL 11880ms; load 12325ms
- `/telecom/airtime-value/`: DCL 7654ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
