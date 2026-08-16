# Wave 4 — Import and landed-cost demand capture

Implementation date: 2026-08-15
Canonical route: `/tools/import-duty/`
Working branch: `feat/gsc-import-landed-cost-journey`
Production deployment: not performed by this task

## 1. GSC demand reviewed

The repository's GSC program records 8,452 impressions in the supplied 28-day headline for the import-duty and landed-cost family. Granular query, click, CTR, position, country and device exports were not available, so those values remain `null` in the cohort rather than being invented. The target family includes generic duty, customs duty, landed cost, CIF, country-calculator, Japan-origin and vehicle-import intent.

There is no granular GSC evidence proving a Japan-specific baseline. Japan is therefore an origin option and a vehicle-workflow handoff, not a new SEO landing page.

## 2. Existing import architecture found

- `/tools/import-duty/` was the GSC-selected canonical but its runtime was a safe Nigeria-only worksheet.
- `/tools/landed-cost/` duplicated the transactional intent with a generic formula, legacy planning packs and dated FX assumptions.
- `/tools/car-import-cost/` already owns vehicle-specific age, engine, valuation, steering and environmental logic for supported destinations and source markets including Japan.
- The Nigeria, Kenya, Ghana and South Africa guides link to the canonical calculator and remain explanatory assets. Kenya's guide was aligned to the current 2.5% general IDF and 2% RDL law, its unsupported flat vehicle example was removed, and Kenya/Ghana headings were made explicitly explanatory rather than duplicate calculator owners.

## 3. Canonical ownership decision

`/tools/import-duty/` now owns import-duty, customs-tax, CIF and landed-cost transactional intent. `/tools/landed-cost/` redirects permanently to it. French ownership is consolidated at `/fr/tools/cout-rendu/`; Swahili ownership is consolidated at `/sw/zana/gharama-bidhaa/`. The older Nigeria-only localized routes redirect to those broader locale owners.

No query-synonym, purchase-value, origin-country, currency or vehicle-model landing pages were added.

## 4. Supported destination markets

- Nigeria
- Kenya
- Ghana
- South Africa

Other destinations fail visibly instead of borrowing another country's formula.

## 5. Supported goods types

General goods are supported with a user-confirmed ad-valorem duty rate and optional confirmed excise. Vehicle selection routes to `/tools/car-import-cost/`; vehicle logic is not approximated in the general-goods engine.

## 6. Government charge components

| Market | Automatic components | User-confirmed components |
| --- | --- | --- |
| Nigeria | CISS, ETLS levy, import surcharge, VAT | duty rate, product excise, assessed other charges |
| Kenya | IDF, RDL, VAT | duty rate, product excise, assessed other charges |
| Ghana | NHIL, GETFund levy, VAT | duty rate, product excise, assessed other charges |
| South Africa | import VAT and documented customs-value uplift | duty rate, product excise, assessed other charges |

The South Africa origin selector only controls the documented VAT-uplift exception for Botswana, Eswatini, Lesotho and Namibia. Origin never silently changes customs duty.

## 7. User-entered assumption components

Clearing agent, port/terminal, storage, inland haulage, inspection, documentation, bank/remittance and miscellaneous costs are separate from government charges. Every optional line defaults to zero and is labeled as the user's assumption.

## 8. FX handling

Supplier, freight and insurance values are converted from the selected source currency using `data/forex/latest.json`. The result and every export expose the rate, provider, timestamp and explicit fresh/stale state against the platform's 24-hour FX maintenance window. The bundled 2026-08-09 snapshot is stale as of this validation and is visibly labeled as such. A custom rate is allowed, labeled as an override and compared with the snapshot to show FX impact. Customs and declaration rates remain the user's responsibility.

## 9. Source and freshness model

`data/trade/import-rules.json` is the statutory rule source of truth. Each market records authority, version, effective date, verification date, official sources, formula bases, limitations, confidence, status and a 45-day maintenance window. Volatile FX and optional cost assumptions remain separate datasets/input layers.

Primary authority basis:

- Nigeria Customs Service tariff/Trade Portal and Nigeria Tax Act 2025
- current Kenya Miscellaneous Fees and Levies Act, VAT Act and KRA customs guidance
- Ghana Revenue Authority customs and 2026 VAT-reform guidance
- South African Revenue Service customs valuation and import-VAT guidance

## 10. Routes changed or created

- Strengthened: `/tools/import-duty/`
- Consolidated by redirect: `/tools/landed-cost/`
- Vehicle handoff: `/tools/car-import-cost/`
- Locale alternates: `/fr/tools/cout-rendu/`, `/sw/zana/gharama-bidhaa/`
- Locale duplicates redirected: `/fr/tools/droits-douane/`, `/sw/zana/ushuru-forodha/`

## 11. Examples

The canonical page includes server-rendered USD-neutral examples for USD 1,000, 5,000 and 10,000 purchase values in each supported market. Each uses freight at 10%, insurance at 1%, confirmed duty at 20%, one unit and zero optional/excise/other charges. FX is fixed at one only to compare formula order; the examples are explicitly not local-currency quotes.

## 12. Export support

Print, local PDF and copy-summary exports include destination, origin, supplier/shipping inputs, customs value, tax components, landed cost, unit cost, FX source/timestamp/freshness, customs authority, rule dates, official source titles and URLs, and the planning disclaimer. No account or network calculation is required. The browser test reopens and parses the generated PDF to verify this content rather than checking only that a download occurred.

## 13. Tests

Coverage includes all supported-country fixtures, calculation order, pure customs-base/ad-valorem/fixed/tiered-duty helpers, levies, excise, fixed charges, totals, unit cost, FX and override impact, zero shipping fields, boundary rates, unsupported goods/markets, stale rules, stale FX and scenario comparison. Browser coverage includes basic/advanced completion, 360 px overflow, every form control's label, keyboard submit, accessible result/source state, unsupported vehicle/market behavior, stale rule/FX warnings, scenario comparison, parsed PDF content and runtime errors.

Final validation on 2026-08-15:

- `npm test`: PASS — 738/738 files, 1,924/1,924 assertions and 7/7 bundled audits; no quarantined tests.
- `npm run lint`: PASS.
- `npm run type-check`: PASS.
- `npm run check-links`: PASS — 11,722 HTML files and 141,564 internal links checked.
- `npm run audit`: PASS — 3,804 registry rows, 3,799 canonical published tools and zero missing pages.
- `npm run tools:quality`: PASS — 3,804 rows and 2,612 expanded tools scored.
- `npm run validate:hreflang`: PASS — 11,500 pages, 33,814 relationships and 5,278 groups.
- `npm run sitemap`: PASS — 8,773 unique URLs across 12 sub-sitemaps.
- `npm run seo:report`: PASS — zero missing canonicals, titles, descriptions or hreflang values.
- `npx playwright test tests/e2e/import-landed-cost.spec.js --project=chromium --workers=1`: PASS — 3/3.
- `npm run trade:sources:check`: PASS — 21 sources and no errors; nine wider-market source gaps remain recorded as advisory warnings.
- `npm run transport:sources:check`: PASS — 41 sources, five changed, 11 blocked/manual-review and zero broken.
- `npm run build:deploy`: PASS — 17,864-file publish artifact.
- `npm run audit:dist`: PASS.
- `npm run security:scan`: PASS.
- `npm run registry:check`: PASS.
- `npm run calculation-quality:check`: PASS — 785 artifacts and 307/307 fixtures; one stale FX snapshot warning remains and is surfaced by the calculator.
- `git diff --check`: PASS.
- `git diff --diff-filter=D --summary`: PASS — no deleted files.

These are local worktree and deploy-artifact checks only. No commit, push, merge, production deploy or live-route verification was performed.

## 14. SEO and canonical strategy

The title, description, H1, WebApplication/FAQ schema, canonical and reciprocal hreflang identify one English transactional owner. Country guides retain process and explanatory intent and link back to the calculator. The legacy landed-cost route is removed from the registry and redirected. Canonical markup prevents parameter variants from becoming separate indexed owners.

## 15. Unsupported vehicle and origin cases

The general calculator does not model vehicle age, engine size, depreciation, destination valuation, specific duty, environmental levy or steering restrictions. Those cases route to the existing car workflow. Preferential origin, rebates, safeguards, anti-dumping and rules-of-origin treatment are not inferred.

## 16. GSC cohort

`gsc-demand-capture-2026-08-import-landed-cost` records the supplied impression baseline, target families, competing routes, Japan evidence limitation and cannibalization set. Deployment and 7/28/90-day dates remain null until a verified production deployment exists; the cohort records the exact date-derivation rule.

## 17. Three strongest future expansion opportunities

1. Add a maintained HS-classification assist that narrows candidates but still requires official confirmation; never auto-select a legal tariff line.
2. Expand the existing car-import engine only where destination valuation, age, engine and environmental rules have dated official packs and golden fixtures, then surface a richer Japan-to-supported-country handoff.
3. Add a declaration-quote reconciliation workflow that imports a redacted broker/customs assessment locally and explains line-by-line differences without uploading invoice or identity data.
