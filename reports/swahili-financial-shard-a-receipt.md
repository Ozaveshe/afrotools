# Swahili Finance, Tax & Market Data — shard A candidate receipt

- Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Derivation: `categoryKey=financial`, coordinator-accepted IDs removed, `englishId` ascending, positions 1–46.
- Partition proof: 92 unaccepted financial rows = shard A 46 + shard B 46; overlap 0.
- Outcome: **20 accepted candidate / 26 blocked / 46 denominator**.
- Coordinator-owned acceptance, inventory, AI route-map, coverage, sitemap, redirect and service-worker outputs were not edited.
- Missing `.claude/rules/i18n.md` was recorded at the pinned baseline and was not treated as a blocker, per coordinator direction.

## Per-app result

| # | English ID | English route | Swahili route | Result | Source / blocker |
|---:|---|---|---|---|---|
| 1 | `afrorates` | `/tools/afrorates` | `/sw/zana/viwango-benki` | ACCEPTED | `sw/zana/viwango-benki/index.html` |
| 2 | `backup-power-costs` | `/tools/backup-power-costs` | `/sw/zana/gharama-ya-nishati-ya-dharura` | ACCEPTED | `sw/zana/gharama-ya-nishati-ya-dharura/index.html` |
| 3 | `bj-paye` | `/benin/bj-paye` | `/sw/benin/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/benin/kikokotoo-kodi-mshahara/index.html` |
| 4 | `business-planner` | `/tools/business-planner` | `/sw/zana/mpangaji-wa-biashara-ai` | BLOCKED | The physical route labels deterministic template output as AI and advertises an unwired copy-summary action; accepting it would violate the AI-truth and working-export contracts. |
| 5 | `cd-paye` | `/dr-congo/cd-paye` | `/sw/dr-congo/kikokotoo-kodi-mshahara` | BLOCKED | The legacy inline page sends raw salary/chat content to an advisor endpoint without explicit content consent, gates print/PDF behind email capture, and has no maintained shared formula owner suitable for safe parity proof. |
| 6 | `cg-paye` | `/congo/cg-paye` | `/sw/congo/kikokotoo-kodi-mshahara` | BLOCKED | The legacy inline page sends raw salary/chat content to an advisor endpoint without explicit content consent, gates print/PDF behind email capture, and has no maintained shared formula owner suitable for safe parity proof. |
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
| 17 | `crypto-profit` | `/crypto/profit-calculator` | `/sw/zana/kikokotoo-faida-crypto` | ACCEPTED | `sw/zana/kikokotoo-faida-crypto/index.html` |
| 18 | `crypto-quiz` | `/crypto/quiz` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 19 | `crypto-remittance` | `/crypto/remittance` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 20 | `crypto-scam` | `/crypto/scam-checker` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 21 | `crypto-stablecoins` | `/crypto/stablecoins` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 22 | `currency-converter` | `/tools/currency-converter` | `/sw/zana/kibadilishaji-sarafu` | ACCEPTED | `sw/zana/kibadilishaji-sarafu/index.html` |
| 23 | `cv-paye` | `/cape-verde/cv-paye` | `/sw/cape-verde/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/cape-verde/kikokotoo-kodi-mshahara/index.html` |
| 24 | `dj-paye` | `/djibouti/dj-paye` | `/sw/djibouti/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/djibouti/kikokotoo-kodi-mshahara/index.html` |
| 25 | `dz-paye` | `/algeria/dz-paye` | `/sw/algeria/kikokotoo-kodi-mshahara` | BLOCKED | The legacy inline page sends raw salary/chat content to an advisor endpoint without explicit content consent, gates print/PDF behind email capture, and has no maintained shared formula owner suitable for safe parity proof. |
| 26 | `er-paye` | `/eritrea/er-paye` | `/sw/eritrea/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/eritrea/kikokotoo-kodi-mshahara/index.html` |
| 27 | `er-vat` | `/eritrea/er-vat` | `/sw/eritrea/kikokotoo-vat` | ACCEPTED | `sw/eritrea/kikokotoo-vat/index.html` |
| 28 | `etims-guide` | `/tools/etims-guide` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 29 | `first-home-buyer` | `/tools/first-home-buyer` | `/sw/zana/mnunuzi-wa-kwanza-wa-nyumba` | ACCEPTED | `sw/zana/mnunuzi-wa-kwanza-wa-nyumba/index.html` |
| 30 | `fuel-tracker` | `/tools/fuel-tracker` | `/sw/zana/ufuatiliaji-bei-za-mafuta` | ACCEPTED | `sw/zana/ufuatiliaji-bei-za-mafuta/index.html` |
| 31 | `gh-paye` | `/ghana/gh-paye` | `/sw/ghana/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/ghana/kikokotoo-kodi-mshahara/index.html` |
| 32 | `gh-paye-2` | `/tools/gh-wht` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 33 | `gh-ssnit` | `/tools/gh-ssnit` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 34 | `gm-paye` | `/gambia/gm-paye` | `/sw/gambia/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/gambia/kikokotoo-kodi-mshahara/index.html` |
| 35 | `gw-paye` | `/guinea-bissau/gw-paye` | `/sw/guinea-bissau/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/guinea-bissau/kikokotoo-kodi-mshahara/index.html` |
| 36 | `home-loan-eligibility` | `/tools/home-loan-eligibility` | `/sw/zana/ustahiki-wa-mkopo-wa-nyumba` | ACCEPTED | `sw/zana/ustahiki-wa-mkopo-wa-nyumba/index.html` |
| 37 | `import-duty` | `/tools/import-duty` | `/sw/zana/ushuru-forodha` | ACCEPTED | `sw/zana/ushuru-forodha/index.html` |
| 38 | `interest-rate-ref` | `/tools/interest-rate-ref` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 39 | `itax-guide` | `/tools/itax-guide` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 40 | `job-offer-evaluator` | `/tools/job-offer-evaluator` | `/sw/zana/tathmini-ya-ofa-ya-kazi` | ACCEPTED | `sw/zana/tathmini-ya-ofa-ya-kazi/index.html` |
| 41 | `ke-cgt` | `/tools/ke-cgt` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 42 | `ke-nssf` | `/tools/ke-nssf` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 43 | `ke-stamp-duty` | `/tools/ke-stamp-duty` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 44 | `ke-wht` | `/tools/ke-wht` | — | BLOCKED | No physical native Swahili application route exists on the pinned coordinator baseline. |
| 45 | `km-paye` | `/comoros/km-paye` | `/sw/comoros/kikokotoo-kodi-mshahara` | ACCEPTED | `sw/comoros/kikokotoo-kodi-mshahara/index.html` |
| 46 | `loan-compare` | `/tools/loan-compare` | `/sw/zana/kilinganisha-mikopo` | ACCEPTED | `sw/zana/kilinganisha-mikopo/index.html` |

## Proof boundary

Accepted candidates have physical native/localized Swahili documents, no iframe or English-document fetch transplantation, self-canonical metadata, Swahili and English alternates, structured data, dedicated artwork, and focused static/browser coverage. Existing shared deterministic engines remain the formula/data owners; this lane does not change tax rates, market data, country semantics, currencies, or source claims.

Blocked rows are not accepted by implication. Missing routes require native controllers and per-app formula/export/browser proof. `crypto-prices` is blocked because its inventory candidate is only a category hub. `cnps-guide` is blocked until dedicated artwork exists. `business-planner` is blocked for unsupported AI labeling and an unwired advertised action. The legacy `cd-paye`, `cg-paye`, and `dz-paye` pages are blocked for unconsented raw-input sends, email-gated print/PDF, and the absence of a maintained shared formula owner suitable for safe parity proof.

## Browser matrix and exports

The focused Playwright suite checks each accepted route at 320px or 375px, 200% text zoom, explicit dark theme, keyboard focus, horizontal reflow, console/page errors, iframe absence, and non-GET network requests. It exercises a safe visible control when present. Export parsing is fail-closed: this receipt does not claim a format unless a route-specific existing test is named; generic buttons alone are not treated as proof.

## Artwork

See `reports/swahili-financial-shard-a-missing-artwork.json` (3 queued IDs).

## Commands

- PASS — `node scripts/build-sw-financial-shard-a-receipt.js --check`.
- PASS 3/3 — `node tests/swahili-financial-shard-a.test.js`.
- PASS 20/20 — `npx playwright test tests/e2e/swahili-financial-shard-a.spec.js --config=playwright.sw-financial-shard-a.config.js --project=chromium --workers=1`.
- PASS 4/4 — `tests/e2e/swahili-financial-shard-a-paye.spec.js` downloaded and parsed each Swahili PAYE PDF with `pdf-parse`, and exercised valid, invalid, reset, 200% reflow, dark-mode and raw-input privacy contracts.
- PASS 7/7 — `tests/e2e/swahili-financial-shard-a-deterministic.spec.js` parsed the Swahili converter CSV, first-home TXT, job-offer CSV/JSON, and all advertised PDFs/print output; it exercised exact results, invalid/reset behavior, evidence-gated Eritrea historical sales tax, 200% reflow, dark mode, focus, runtime errors, raw-input network privacy, and EN/FR parity for the shared job-offer clear fix.
- PASS — `tests/engines/{bj,cv,dj,gm}-paye.test.js` preserves browser/server formula parity for the four newly accepted PAYE routes.
- PASS — `tests/engines/import-duty-nigeria-engine.test.js` and `tests/import-duty-data-trust.test.js` preserve the reviewed Nigeria import-duty engine and source contract.
- PASS — `tests/first-home-readiness.test.js` and `tests/job-offer-engine.test.js` preserve the deterministic first-home and job-offer source engines.
- PASS 5/5 — `tests/engines/er-vat.test.js` preserves the historical Eritrea sales-tax evidence gate and its matching API validation contract.
- PASS — `tests/crypto-profit-engine.test.js` and `tests/crypto-profit-vip.test.js` preserve bounded engine arithmetic, native EN/FR/SW product structure, local-only exports and reciprocal metadata.
- PASS 1/1 — `tests/e2e/swahili-financial-shard-a-crypto-profit.spec.js` matches the DOM-free engine oracle, parses CSV/JSON/PDF/print PDF, and proves invalid/reset, keyboard/a11y, dark mode, 320px at 200% and raw-input privacy.
- CARRIED BROAD-SUITE DEBT — the combined legacy `first-home-readiness.spec.js` / `job-offer-evaluator-vip.spec.js` run had 4/8 pass: its French first-home assertion expects an older TXT shape, job-offer external-request filtering hard-codes port 4173 instead of this lane's isolated port, and the French PDF filename assertion conflicts with the localized export owner. The focused six-case suite proves the scoped Swahili contracts and shared-controller parity independently.
- CARRIED BROAD-SUITE DEBT — `tests/e2e/crypto-profit-vip.spec.js` passed 3/4; the only failure is its pre-existing English cookie-banner overlap assertion on inline English page CSS not changed by this increment. Engine, French invalid handling, English CSV/JSON/PDF/print exports and widget checks passed; the focused Swahili case independently proves the new route.
- PASS — `npm run validate:hreflang` (33,422 relationships; reciprocal EN/FR/SW crypto-profit metadata included).
- PASS — `npm run check-links` (138,247 links; zero broken).
- PASS — `npm run audit` (3,768 live/new rows; zero missing pages).
- PASS — `npm run type-check`.
- PASS — `npm run test:privacy-ai-consent` (server contract plus 3/3 browser cases).
- PASS — `git diff --check`, changed-script syntax checks, and deletion review.
- BLOCKED BY COORDINATOR-OWNED OUTPUT — `npm run build:i18n:validate` reports stale `data/registry/locale-page-coverage.json`; this lane is prohibited from regenerating it.
- PASS — `npm run lint` (49 JavaScript files checked).
