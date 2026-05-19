# Mobile Network Smoke

Generated: 2026-05-19T06:21:28.451Z
Profile: Africa mobile 3G/low 4G
Network: 900 Kbps down, 350 Kbps up, 220ms RTT, 4x CPU throttle

Verdict: WARN

| Route | Status | DCL | Load | LCP | Transfer | Resources | Overflow | Controls <16px | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 200 | 9111ms | 10861ms | 528ms | 845.0 KB | 101 | 0px | 0 | WARN |
| `/search/` | 200 | 15872ms | 15894ms | 2748ms | 1.46 MB | 16 | 0px | 0 | WARN |
| `/salary-tax/` | 200 | 9526ms | 9529ms | 1544ms | 1.00 MB | 10 | 0px | 0 | WARN |
| `/nigeria/ng-salary-tax` | 200 | 6017ms | 6020ms | 1568ms | 636.8 KB | 14 | 0px | 0 | WARN |
| `/tools/mobile-money-fees/` | 200 | 12065ms | 12461ms | 2284ms | 1.05 MB | 21 | 0px | 0 | WARN |
| `/telecom/airtime-value/` | 200 | 7598ms | 7940ms | 2012ms | 542.3 KB | 19 | 0px | 0 | WARN |

## Warnings

- `/`: DCL 9111ms; CLS 0.442
- `/search/`: DCL 15872ms; load 15894ms
- `/salary-tax/`: DCL 9526ms
- `/nigeria/ng-salary-tax`: DCL 6017ms; CLS 0.182
- `/tools/mobile-money-fees/`: DCL 12065ms; load 12461ms
- `/telecom/airtime-value/`: DCL 7598ms; function unavailable in static smoke: /.netlify/functions/api-telecom; function unavailable in static smoke: /.netlify/functions/api-data-freshness

## Assumptions

- This is a local static-site smoke test with browser network and CPU throttling.
- It models constrained mobile access for target African users, but it is not a carrier field measurement.
- Use it with scripts/mobile-audit.js and seo:report rather than as a replacement for real analytics.
