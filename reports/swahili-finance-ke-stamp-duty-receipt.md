# Swahili Kenya Stamp Duty candidate receipt — 2026-08-09

Status: **IMPLEMENTED AND LOCALLY VERIFIED; COORDINATOR ACCEPTANCE PENDING**

This receipt covers one English free-app row only:

- English ID: `ke-stamp-duty`
- English owner: `/tools/ke-stamp-duty/`
- French equivalent: `/fr/tools/ke-droits-timbre/`
- Swahili candidate: `/sw/zana/kikokotoo-ushuru-wa-stampu-kenya/`
- Base SHA: `25cb4c8f41ce0316caa92da2131538d986a8041c`

## Product and source boundary

- The DOM-free formula owner remains `engines/src/ke-stamp-duty-engine.js`; its calculation logic was not changed.
- The browser owner remains `assets/js/pages/ke-stamp-duty-vip.js`; it now supports native Swahili validation, results, copy, CSV, JSON and PDF presentation.
- The statutory boundary remains the Kenya Stamp Duty Act (Cap. 480), consolidated from 1 July 2025 and `verifiedThrough: 2026-07-23`.
- Kenya Law is visibly identified as the primary-law boundary. KRA sources are retained for instrument assessment, exemptions and payment context.
- The route fails closed outside the verified date range and does not decide municipality status, valuation, exemption eligibility, penalties or payment proof.

## Verified oracles

- Transfer: KES 15,000,000, municipality, sale -> dutiable value KES 15,000,000; transfer duty and payable KES 600,000.
- Lease: two years, annual rent KES 1,200,000, premium KES 1,000,000 -> rent duty KES 12,000; premium duty KES 40,000; payable KES 52,000.
- Unsupported date: 2026-07-24 -> `unsupported_date`, with no stale result left visible.

## Browser and export proof

- Swahili Chromium suite: `5/5` passed.
- Existing English/French Kenya stamp-duty suite: `5/5` passed after the shared-controller change.
- CSV was downloaded and parsed; Swahili headers and the KES 600,000 transfer result were verified.
- JSON was downloaded, parsed and matched against localized mode, location, rate/boundary text and numeric results.
- PDF was downloaded and parsed with `pdf-parse`; title, KES 600,000 result, item 12A and Kenya Law source text were present.
- No raw values appeared in request URLs or bodies, no non-GET request occurred, and the app created no stamp-duty local-storage record.
- App-owned controls have programmatic labels; stale results clear on changes; validation and status regions are announced.
- 320px and 375px system-dark layouts, 200% reflow, manual dark theme, reduced motion and keyboard focus passed without horizontal overflow.
- Visual evidence was inspected at `artifacts/sw-finance-ke-stamp-duty/375-light-transfer.png` and `artifacts/sw-finance-ke-stamp-duty/320-dark-transfer.png` (ignored local artifacts).

## Route and repository gates

- `node tests/ke-stamp-duty-engine.test.js`: PASS, 28 checks.
- `node tests/sw-finance-ke-stamp-duty.test.js`: PASS.
- `node scripts/build-i18n.js --validate`: PASS for French, Swahili, Yoruba and Hausa key parity.
- `npm run validate:hreflang`: PASS across 11,323 pages, 33,624 relationships and 5,351 groups.
- `npm run audit`: completed; retained two frozen-base missing registry pages unrelated to this row.
- `npm run lint`: PASS.
- `npm run type-check`: PASS.
- AI consent server check and Chromium privacy suite: PASS, `3/3` browser tests.
- `git diff --check`: PASS.
- Deletion audit: zero deleted files.

## Explicit carried/protected boundaries

- `npm run build:i18n:validate` stops at the expected generated-artifact freshness gate because this new route is not yet in `data/registry/locale-page-coverage.json` and its generated reports. Those files are coordinator-owned and were not changed here.
- `npm run check-links` found one frozen-base broken link from `sw/zana/kikokotoo-cgt-kenya/index.html` to `/sw/kayan-aiki/`. The new stamp-duty route is not involved; all four internal links added by this candidate resolve.
- Central Swahili acceptance, AI routing, registry promotion, coverage artifacts, sitemaps and service-worker output were not changed.
- No push, PR, merge, deployment or live-system action was performed.

## Finance frontier after this row

The remaining exact Finance rows are already recorded as 21 fail-closed blockers in `reports/sw-finance-exact-remainder-blockers-2026-08-09.json`. There is no further eligible Finance row on this clean frontier without first repairing an English formula/source/product boundary. This candidate therefore stops after `ke-stamp-duty` and returns to the coordinator for independent review and acceptance promotion.
