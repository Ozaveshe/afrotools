# Swahili Fintech + SME candidate receipt

- Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Denominator: **57** (Fintech 29 + Small Business 28)
- Candidate accepted: **57**
- Blocked: **0**
- Coordinator-owned acceptance ledger: unchanged

## Exact English IDs

- Fintech (29): mobile-vs-bank, fixed-deposit, tbill-calc, real-return, loan-shark-compare, microfinance-loan, digital-lending, sacco-calc, payment-gateway, bnpl-calc, emergency-fund, asset-finance, bond-yield, credit-score, dca-calc, debt-snowball, dividend-yield, fire-calc, invoice-factoring, loan-consolidation, merchant-fees, money-market, net-worth, pos-fees, property-vs-stocks, qr-payment, stock-portfolio, thrift-calc, trade-credit
- Small Business (28): startup-runway, tam-sam-som, unit-economics, churn-rate, burn-rate, cash-flow-forecast, pos-agent, mini-importation, mama-put, marketplace-fees, brand-collab-roi, business-continuity, event-decoration-cost, factory-setup-cost, fashion-brand-startup, freelance-contract, freelancer-rate, graphic-design-pricing, guard-service-cost, influencer-rate, made-in-africa-label, nafdac-registration, oee-calculator, packaging-cost, production-cost, quality-sampling, tailoring-pricing, youtube-revenue

## Product and source decisions

Every route is native Kiswahili with a maintained family generator or controller. SME apps use the DOM-free `assets/js/engines/small-business-parity.js` engine and show an app-specific formula. Fintech families load their maintained English calculation owners and prove output equality through focused oracle tests. Rates, fees, rules, sources and currencies are never invented: user-entered values, dated evidence, freshness/confidence and explicit fallback states remain visible.

## Browser, export, privacy and artwork proof

The assigned suites ran with one worker on isolated ports in Chrome: 320px, 375px, 200% reflow, light/dark, keyboard/focus, invalid/reset, stale-output clearing, console/page/resource checks. All advertised TXT/CSV/JSON/print/copy actions were exercised; downloads were parsed or reopened. Unexpected external hosts and non-telemetry writes fail the tests. Consent Mode may send sanitized cookieless page metadata, but raw financial/form values are neither included nor sent; optional AI links contain only the tool ID. Dedicated artwork is present for 57/57 apps; the missing-artwork queue is empty.

## Reciprocal metadata-only changes

English and French paired owners received only the Swahili reciprocal hreflang where missing. The mobile-vs-bank family also preserves the existing Hausa reciprocal owner metadata. No other locale UI/copy was intentionally changed.

## Commands

- `node tests/sw-small-business-engine-parity.test.js`
- Focused Fintech source/oracle tests listed in the JSON receipt
- `playwright test --config tests/sw-small-business.playwright.config.js --workers=1`
- Focused Fintech Playwright configs listed in the JSON receipt
- `node scripts/build-sw-small-business-parity.js`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run check-links`
- `npm run audit`
- `npm run lint`
- `npm run type-check`
- `npm run test:privacy-ai-consent`
- `git diff --check`

## Reference note

`.claude/rules/i18n.md` is absent at the verified baseline. This was an authorized non-blocker; AGENTS.md, the Swahili strategy, playbook and coordinator skill governed the work.
