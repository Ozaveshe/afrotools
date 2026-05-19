# Africa Mobile Network Before V2

Generated during the v2 sprint with `npm run mobile:network`.

Profile:

- Africa mobile 3G/low 4G
- 900 Kbps down
- 350 Kbps up
- 220ms RTT
- 4x CPU throttle

Baseline verdict: WARN

## Baseline Warnings

| Route | Baseline warning |
|---|---|
| `/` | DCL 9,469ms; CLS 0.422 |
| `/search/` | DCL 16,552ms; load 16,597ms |
| `/salary-tax/` | DCL 9,530ms |
| `/tools/mobile-money-fees/` | DCL 13,077ms; load 13,884ms |
| `/telecom/airtime-value/` | DCL 8,816ms; static function unavailable in local smoke |

## Main Risk

The warnings are not cosmetic. Under constrained mobile network simulation, important routes remain slow to become ready. This matters for everyday African users on unstable or expensive mobile data.

## Follow-Up Artifact

The detailed current network run is in `audit-results/africa-mobile-network-after-v2.md` and `audit-results/africa-mobile-network-after-v2.json`.
