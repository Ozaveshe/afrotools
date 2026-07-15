# Diaspora Property Investment Calculator — Audit

URL: https://afrotools.com/tools/diaspora-property/
File: tools/diaspora-property/index.html

## What it does
Helps African-diaspora buyers convert foreign savings (USD/GBP/EUR/CAD/AUD) into local
buying power across 7 markets (NG, KE, GH, ZA, EG, RW, TZ), then shows:
- Buying power in local currency and an affordability check vs. property price
- Local rental yield, annual rental in foreign currency, and foreign-currency ("USD") yield
- Bull/Base/Bear FX scenarios projecting how depreciation erodes foreign-currency yield over the hold period
- Country-specific government mortgage schemes, diaspora checklist, and considerations
35 currency corridors are pre-seeded with FX rates and default depreciation assumptions.

## Math verification (node, defaults 50000 USD → NG)
- Buying power = budget × FX = 50,000 × 1,660 = ₦83,000,000; affordable ✓
- Local yield = (350,000×12) / 83,000,000 = 5.06% ✓
- Annual rental (USD) = 4,200,000 / 1,660 = $2,530 ✓
- USD yield = 2,530 / 50,000 = 5.06% ✓
- FX scenarios: depr 0% → rate 1,660, yield 5.06%; depr 10% → rate 2,673, yield 3.14%;
  depr 20% → rate 4,131, yield 2.03%. Depreciation correctly raises the future rate and
  shrinks foreign-currency yield ✓
All formulas internally consistent and correct.

## Gaps / observations
- Meta description was 201 chars (over the 160 limit) — FIXED.
- No visible FAQ on page, so no FAQPage schema is warranted (correctly absent).
- No financial disclaimer near the results (legal sections only say "not legal advice") — FIXED.
- Definitional subtlety (DEFERRED, not a bug): "USD Yield" divides annual foreign rental by
  the user's *budget*, not by the property's foreign-currency value. At defaults these coincide
  (budget = price/FX), but if budget ≠ price the figure reads as "yield on cash deployed" rather
  than property yield. Label is defensible; leaving as-is to avoid changing tool behavior.
- SEO: title already strong (keyword + "for Africa" + 2026 intent); single H1; valid
  WebApplication (FinanceApplication) + BreadcrumbList JSON-LD. Breadcrumb labels the parent
  "Mortgage & Property" while related-tools SSR uses category "legal" — cosmetic mismatch, deferred.

## Fixes applied 2026-07-14
1. Meta description rewritten to 157 chars, keeps African intent + core keywords:
   "Diaspora property investment calculator for Africa. Convert USD, GBP or EUR earnings to
   local buying power and check rental yield after FX depreciation risk."
2. Added a financial disclaimer below the considerations list: estimate for planning only,
   not financial or investment advice; verify current FX/yield/tax figures with a licensed
   advisor and local professionals before buying.

## Validation
- JSON-LD: 1 block, parses cleanly (node JSON.parse) ✓
- H1 count: 1 ✓
- Meta description length: 157 (in 120–160 range) ✓
- Math re-run in node, all results match rendered logic ✓
- Scope: only tools/diaspora-property/index.html edited; no shared files touched.
