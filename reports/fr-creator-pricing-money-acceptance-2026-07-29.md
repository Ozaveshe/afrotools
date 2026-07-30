# French CreatorPricing and CreatorMoney acceptance

Foundation commit: `8ce5cac175e42201968b1f7540752d6acf92d4ca`

Scope is exactly two Creative Economy owners:

- `creator-pricing`
- `creator-money`

## Accepted product behavior

### CreatorPricing

- English and French launcher/workspace pairs use the same DOM-free
  `CreatorPricingEngine`.
- The native French workflow covers craft, specialty, market, city, experience,
  and output currency.
- The result exposes daily, hourly, and project ranges plus five
  craft-specific deliverable examples.
- JSON and UTF-8 TXT downloads were reopened and parsed in the browser suite.
- Copy has a visible fallback.
- The output states that the result is a planning benchmark and that built-in
  conversions are fixed assumptions, not live FX or an official tariff.
- Unsupported AI, live-market, quarterly-refresh, anonymous-data, and Pro
  advisor claims were removed from the English owner.

### CreatorMoney

- English and French launcher/workspace pairs use the same deterministic
  `calculatePlan` engine function.
- The native French workflow calculates operating profit, margin, effective
  profit per hour, an explicitly user-supplied tax reserve, creator pay,
  reinvestment, and remaining cash.
- Allocations above 100 percent fail closed.
- JSON and UTF-8 TXT downloads were reopened and parsed in the browser suite.
- Copy has a visible fallback.
- The accepted surface makes no bank, account, Supabase, AI, or automatic tax
  claim. The app loads no auth or profile script and sends no financial input.
- Unsupported sync, encryption, offline-sync, AI-advisor, PDF, CSV, and
  jurisdiction-specific tax claims were removed from the English owner.

## Search, discovery, and artwork

- Launcher canonicals and reciprocal English/French hreflang are present.
- App routes keep the existing `noindex, follow` expanded-app contract while
  retaining canonical and reciprocal app hreflang.
- French launchers/apps have French metadata, Africa GEO metadata, schema,
  locale-correct Open Graph URLs, and the owner artwork.
- Registry discovery, the French AI route map, and the AI catalog include both
  owners.
- `creator-pricing.webp` and `creator-money.webp` are present and non-empty.

## Browser evidence

`tests/e2e/fr-creator-pricing-money-native.spec.js`: 4/4 passed.

- 320px launcher and workspace overflow checks.
- 375px French-copy and workflow checks.
- 640px at 200% zoom, equivalent to a 320px reflow viewport.
- System dark, system light, and explicit dark theme.
- Keyboard focus visibility.
- Console and page-error collection.
- Sensitive-network request collection.
- Parsed JSON and reopened UTF-8 TXT exports.
- Copy status/fallback.

## Other validation

- `node tests/fr-creator-pricing-money-native.test.js`: passed.
- Focused Day 9 canonical contracts: 2/2 passed.
- Focused Day 9 expanded-app contracts: 2/2 passed.
- `node -c` for both controllers: passed.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `git diff --check`: passed.
- `git diff --diff-filter=D --summary`: zero deleted files.

## Boundaries

- No commit, push, PR, build, sitemap, master-ledger, service-worker, merge,
  deployment, or live Supabase action was performed.
- Broad Day 9 expanded and frozen-structure suites contain concurrent failures
  from other Creative owners. The focused `creator-pricing` and
  `creator-money` Day 9 contracts pass.
