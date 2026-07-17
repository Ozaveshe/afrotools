# Poultry Farm ROI Calculator — Audit

- Live: https://afrotools.com/agriculture/poultry-roi/
- File: `agriculture/poultry-roi/index.html`

## What it does

This is a **country-hub / directory page** for the Poultry ROI tool, listing 15 African countries (grouped West/East/North/Southern) that each link to a country calculator subpage. The real broiler/layer/indigenous ROI, payback, cash-flow, and break-even calculators live on the country subpages (out of scope here). The hub itself carries: an "About" SEO block, a rich 4-question FAQ (FCR, broiler cycles, layer point-of-lay, data sources), and a `df-upgrade` mini "planning summary" form (currency, birds, feed cost, sale price, mortality).

## Gaps found

1. **CRITICAL — df form does no math.** The `poultry-roi-calculator` df-form has no compute branch in the shared `assets/js/pages/english-df-app-upgrades.js`. It falls through to the generic fallback that only echoes inputs; the "revenue, feed cost, mortality, cycle margin" output is static text. No ROI/revenue/margin/break-even is ever computed. Fix requires the shared JS + df block, both off-limits to this agent → logged to `_shared-fixes.md`.
2. Meta description was 212 chars (over the 160 limit).
3. No `WebApplication` structured data (only CollectionPage + BreadcrumbList).
4. FAQPage JSON-LD mirrored only the 3 generic df-faq questions; the 4 richer, more valuable visible FAQs (FCR, cycles, layers, data sources) had no schema.
5. No plain-language "estimate" disclaimer outside the df block.

## Math verification

The hub page performs no ROI/break-even math itself (it only renders country cards and echoes df inputs). The correct broiler formulas the df widget *should* use were derived and included in the shared-fixes entry: surviving = birds*(1-mortality/100); revenue = surviving*salePrice; grossProfit = revenue - feedCost; ROI% = grossProfit/feedCost*100; break-even price = feedCost/surviving. Country-subpage calculators were not in scope and not re-verified here.

## SEO / UX / Trust

- Title: good — keyword + African intent ("15 African Countries"). Left as-is.
- H1: unique, keyword-bearing ("Poultry Farm ROI Calculator"). Left as-is.
- Hreflang en/fr/sw + canonical present and correct.
- Mobile: country grid uses `minmax(200px,1fr)`; df inputs use tokens/global responsive layer — no overflow expected at 375px.
- a11y: df inputs carry aria-labels; `aria-live="polite"` on output; breadcrumb labelled. No blocking issues.

## Fixes applied 2026-07-14

- Meta description rewritten to 151 chars (broiler/layer profit, payback, ROI, local prices).
- Added `WebApplication` JSON-LD (BusinessApplication, free offer, publisher).
- Expanded `FAQPage` JSON-LD from 3 → 7 entries, mirroring the visible rich FAQ (FCR, cycles, layers, data sources) + existing df-faq trio. All answer text matches on-page content.
- Added a plain-language "planning estimate; prices/mortality/disease vary" disclaimer paragraph in the About section (outside the df block).
- Did NOT touch the df-upgrade block or the "planning summary" per rules.
- All 4 JSON-LD blocks validated via node — parse OK (CollectionPage, WebApplication, BreadcrumbList, FAQPage/7 Qs).
