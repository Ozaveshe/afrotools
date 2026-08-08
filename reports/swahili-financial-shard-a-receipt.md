# Swahili Finance, Tax & Market Data — shard A candidate receipt

- Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Derivation: `categoryKey=financial`, coordinator-accepted IDs removed, `englishId` ascending, positions 1–46.
- Partition proof: 92 unaccepted financial rows = shard A 46 + shard B 46; overlap 0.
- Outcome: **10 accepted candidate / 36 blocked / 46 denominator**.
- Coordinator-owned acceptance, inventory, AI route-map, coverage, sitemap, redirect and service-worker outputs were not edited.
- Missing `.claude/rules/i18n.md` was recorded at the pinned baseline and was not treated as a blocker, per coordinator direction.

## Per-app result

| # | English ID | English route | Swahili route | Result | Source / blocker |
|---:|---|---|---|---|---|
| 1 | `afrorates` | `/tools/afrorates` | `/sw/zana/viwango-benki` | ACCEPTED | `sw/zana/viwango-benki/index.html` |
| 2 | `backup-power-costs` | `/tools/backup-power-costs` | `/sw/zana/gharama-ya-nishati-ya-dharura` | ACCEPTED | `sw/zana/gharama-ya-nishati-ya-dharura/index.html` |
| 3 | `bj-paye` | `/benin/bj-paye` | `/sw/benin/kikokotoo-kodi-mshahara` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 4 | `business-planner` | `/tools/business-planner` | `/sw/zana/mpangaji-wa-biashara-ai` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 5 | `cd-paye` | `/dr-congo/cd-paye` | `/sw/dr-congo/kikokotoo-kodi-mshahara` | BLOCKED | The physical Swahili candidate fails one or more fail-closed static product contracts. |
| 6 | `cg-paye` | `/congo/cg-paye` | `/sw/congo/kikokotoo-kodi-mshahara` | BLOCKED | The physical Swahili candidate fails one or more fail-closed static product contracts. |
| 7 | `cnps-guide` | `/tools/cnps-guide` | `/sw/zana/mwongozo-wa-cnps` | BLOCKED | Dedicated tool artwork is missing; queued explicitly rather than accepting with a generic image. |
| 8 | `crypto-arbitrage` | `/crypto/arbitrage` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 9 | `crypto-cgt` | `/tools/crypto-tax` | `/sw/zana/kodi-ya-sarafu-za-kidijitali` | ACCEPTED | `sw/zana/kodi-ya-sarafu-za-kidijitali/index.html` |
| 10 | `crypto-contract` | `/crypto/contract-scanner` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 11 | `crypto-dca` | `/crypto/dca-calculator` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 12 | `crypto-exchange` | `/crypto/exchange-ratings` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 13 | `crypto-mining` | `/crypto/mining-calculator` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 14 | `crypto-p2p` | `/crypto/p2p-rates` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 15 | `crypto-portfolio` | `/crypto/portfolio` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 16 | `crypto-prices` | `/crypto/prices` | `/sw/mshahara-na-kodi/crypto` | BLOCKED | Inventory candidate is a Swahili crypto category hub, not native parity for the English crypto price application. |
| 17 | `crypto-profit` | `/crypto/profit-calculator` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 18 | `crypto-quiz` | `/crypto/quiz` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 19 | `crypto-remittance` | `/crypto/remittance` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 20 | `crypto-scam` | `/crypto/scam-checker` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 21 | `crypto-stablecoins` | `/crypto/stablecoins` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 22 | `currency-converter` | `/tools/currency-converter` | `/sw/zana/kibadilishaji-sarafu` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 23 | `cv-paye` | `/cape-verde/cv-paye` | `/sw/cape-verde/kikokotoo-kodi-mshahara` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 24 | `dj-paye` | `/djibouti/dj-paye` | `/sw/djibouti/kikokotoo-kodi-mshahara` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 25 | `dz-paye` | `/algeria/dz-paye` | `/sw/algeria/kikokotoo-kodi-mshahara` | BLOCKED | The physical Swahili candidate fails one or more fail-closed static product contracts. |
| 26 | `er-paye` | `/eritrea/er-paye` | `/sw/eritrea/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/eritrea/kikokotoo-kodi-mshahara/index.html` |
| 27 | `er-vat` | `/eritrea/er-vat` | `/sw/eritrea/kikokotoo-vat` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 28 | `etims-guide` | `/tools/etims-guide` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 29 | `first-home-buyer` | `/tools/first-home-buyer` | `/sw/zana/mnunuzi-wa-kwanza-wa-nyumba` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 30 | `fuel-tracker` | `/tools/fuel-tracker` | `/sw/zana/ufuatiliaji-bei-za-mafuta` | ACCEPTED | `sw/zana/ufuatiliaji-bei-za-mafuta/index.html` |
| 31 | `gh-paye` | `/ghana/gh-paye` | `/sw/ghana/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/ghana/kikokotoo-kodi-mshahara/index.html` |
| 32 | `gh-paye-2` | `/tools/gh-wht` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 33 | `gh-ssnit` | `/tools/gh-ssnit` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 34 | `gm-paye` | `/gambia/gm-paye` | `/sw/gambia/kikokotoo-kodi-mshahara` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 35 | `gw-paye` | `/guinea-bissau/gw-paye` | `/sw/guinea-bissau/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/guinea-bissau/kikokotoo-kodi-mshahara/index.html` |
| 36 | `home-loan-eligibility` | `/tools/home-loan-eligibility` | `/sw/zana/ustahiki-wa-mkopo-wa-nyumba` | ACCEPTED | `sw/zana/ustahiki-wa-mkopo-wa-nyumba/index.html` |
| 37 | `import-duty` | `/tools/import-duty` | `/sw/zana/ushuru-forodha` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 38 | `interest-rate-ref` | `/tools/interest-rate-ref` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 39 | `itax-guide` | `/tools/itax-guide` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 40 | `job-offer-evaluator` | `/tools/job-offer-evaluator` | `/sw/zana/tathmini-ya-ofa-ya-kazi` | BLOCKED | Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair. |
| 41 | `ke-cgt` | `/tools/ke-cgt` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 42 | `ke-nssf` | `/tools/ke-nssf` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 43 | `ke-stamp-duty` | `/tools/ke-stamp-duty` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 44 | `ke-wht` | `/tools/ke-wht` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 45 | `km-paye` | `/comoros/km-paye` | `/sw/comoros/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/comoros/kikokotoo-kodi-mshahara/index.html` |
| 46 | `loan-compare` | `/tools/loan-compare` | `/sw/zana/kilinganisha-mikopo` | ACCEPTED | `sw/zana/kilinganisha-mikopo/index.html` |

## Proof boundary

Accepted candidates have physical native/localized Swahili documents, no iframe or English-document fetch transplantation, self-canonical metadata, Swahili and English alternates, structured data, dedicated artwork, and focused static/browser coverage. Existing shared deterministic engines remain the formula/data owners; this lane does not change tax rates, market data, country semantics, currencies, or source claims.

Blocked rows are not accepted by implication. Missing routes require native controllers and per-app formula/export/browser proof. `crypto-prices` is blocked because its inventory candidate is only a category hub. `cnps-guide` is blocked until dedicated artwork exists.

## Browser matrix and exports

The focused Playwright suite checks each accepted route at 320px or 375px, 200% text zoom, explicit dark theme, keyboard focus, horizontal reflow, console/page errors, iframe absence, and non-GET network requests. It exercises a safe visible control when present. Export parsing is fail-closed: this receipt does not claim a format unless a route-specific existing test is named; generic buttons alone are not treated as proof.

## Artwork

See `reports/swahili-financial-shard-a-missing-artwork.json` (3 queued IDs).

## Commands

- PASS — `node scripts/build-sw-financial-shard-a-receipt.js --check`.
- PASS 3/3 — `node tests/swahili-financial-shard-a.test.js`.
- PASS 10/10 — `npx playwright test tests/e2e/swahili-financial-shard-a.spec.js --config=playwright.sw-financial-shard-a.config.js --project=chromium --workers=1`.
- PASS — `npm run validate:hreflang` (33,416 relationships; reciprocal EN/FR/SW job-offer metadata repaired).
- PASS — `npm run check-links` (138,238 links; zero broken).
- PASS — `npm run audit` (3,767 live/new rows; zero missing pages after two scoped registry URL repairs).
- PASS — `npm run type-check`.
- PASS — `npm run test:privacy-ai-consent` (server contract plus 3/3 browser cases).
- PASS — `git diff --check`, changed-script syntax checks, and deletion review.
- BLOCKED BY COORDINATOR-OWNED OUTPUT — `npm run build:i18n:validate` reports stale `data/registry/locale-page-coverage.json`; this lane is prohibited from regenerating it.
- CARRIED BASELINE FAILURE — `npm run lint` reports the existing AI source allowlist; no listed file is changed by this lane.
