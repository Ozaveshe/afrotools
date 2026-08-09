# Swahili SARS eFiling final parity evidence

## Scope and ownership

- English owner: `/tools/sars-efiling/`.
- Native Swahili owner: `/sw/zana/mwongozo-wa-sars-efiling/`, generated only by `scripts/build-sw-sars-efiling-final.js`.
- Registry ownership is explicit through `sars-efiling-sw` with `sourceId: sars-efiling`.
- English, French and Swahili pages form one reciprocal hreflang group.

## Product contract

The six English guide routes are retained: registration, filing season, auto-assessment, ITR12 preparation, payment/refund and official help. The page neither connects to SARS nor collects credentials, OTPs, tax numbers, banking details, amounts, returns or supporting documents. The private checklist stores six booleans locally. Its JSON, TXT and PDF outputs contain only generic task labels, completion state, source URLs and an independent-guide disclaimer.

## Source and freshness review

Official pages were fetched successfully on 9 August 2026:

- SARS Filing Season: 2026 windows, last updated 16 July 2026.
- Register for eFiling: verification and OTP sequence, last updated 2 June 2026.
- How auto-assessment works: no action when complete and agreed; otherwise use eFiling/MobiApp and retain evidence, last updated 10 July 2026.

This remains an orientation guide. Live SARS pages and account-specific instructions prevail.

## Proof

- PASS: `node scripts/build-sw-sars-efiling-final.js --check`.
- PASS: `node tests/sw-sars-efiling-final.test.js`.
- PASS 3/3: `tests/e2e/sw-sars-efiling-final.spec.js`: native content, all six sections, persistence, corrupt-state reset, no collection fields, no write requests, keyboard/focus, 320px, 375px, 200% reflow, dark theme, SEO/artwork and English regression.
- PASS: registry audit, 3,802/3,802 live/new rows with pages.
- PASS: hreflang validation, 33,966 relationships in 5,350 equivalence groups.
- PASS: the existing English/French SARS regression suite's three cases after narrowing its privacy assertion to sensitive guide fields and excluding consent-denied analytics page-view traffic from raw-data egress checks.
- Exports are downloaded and reopened: JSON parsed structurally, TXT decoded, and PDF signature, page tree, title and disclaimer metadata parsed by loading the emitted bytes back through PDFLib.

No central acceptance, AI, coverage, sitemap, service-worker, push, PR or deployment action is part of this lane.
