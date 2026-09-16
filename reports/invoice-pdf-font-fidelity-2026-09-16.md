# Invoice PDF font fidelity repair — 2026-09-16

## Confirmed defect
The prior built-in PDF font corrupted synthetic seller `Adéjọkẹ́ Ọlá` and buyer `Kɔfi Ŋku` into control sequences; French Latin-1 text survived. Actual downloaded PDF parsing established the difference. This follows pagination candidate `66710bbb` and changes no monetary calculations.

## Source change
`assets/js/pages/invoice-generator-enhancements.js` embeds the existing licensed Noto Sans regular/bold assets when exporting. Text is normalized to Unicode NFC consistently for measurement and drawing. Unsupported characters stop PDF creation with native EN/FR/SW guidance to Print or export JSON. Failed font loads can retry. An invoice edited while fonts load cannot produce a stale PDF; review must be confirmed again. Font fetches are same-origin static GETs with credentials omitted and no referrer, query, or invoice payload.

Dependency: coordinator already committed `assets/fonts/noto-sans/` in `50bc82d7dc26c7361fd7cf78825e7eaa677ac528`; those assets were copied only for isolated local testing and are deliberately excluded from this candidate.

## Evidence
- `invoice-generator-font-fidelity.spec.js` and `invoice-generator-long-pdf.spec.js`: 8 Chromium tests passed in 46.3 seconds. Exact extended Latin text survives actual downloaded PDF parsing in all three locales; all three PDFs were rasterized and visually reviewed. Long documents retain item markers, totals, payment instructions and notes with no detected text-box overlaps or page-bound clipping.
- Strengthened failure test: 1 pass in 13.5 seconds, including reopened JSON preserving unsupported emoji after PDF was correctly blocked, plus font failure/retry.
- Standard invoice workflow regression: all 3 Chromium locale cases passed (saved-state, sharing consent, invoice/estimate/receipt PDFs, adjustment totals, precise unit rates, currency codes and mobile controls).
- `node --check assets/js/pages/invoice-generator-enhancements.js`, `git diff --check`: passed.
- Existing `h()` and `y()` numeric owners compare byte-identical with the previous committed candidate.

Evidence directories outside product source: `../invoice-font-proof`, `../invoice-font-backup-proof`, `../invoice-font-standard-proof`; baseline `../invoice-unicode-before.pdf`, repaired `../invoice-unicode-after.pdf`.

## Limits
No tax rules, currency minor-unit policies, source freshness, public claims, routes, SEO, analytics, or acceptance ledger changed. This does not certify every script or glyph, logo combination, extreme numeric width, or every invoice template. Unsupported scripts still require Print/JSON rather than a corrupted PDF. No deployment or production verification performed by this lane.
