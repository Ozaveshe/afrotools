# Crypto Prices — Audit (upside-100)

- Live: https://afrotools.com/crypto/prices/
- File: `crypto/prices/index.html`
- Data layer: `assets/js/lib/crypto-data.js` (shared — not edited)

## What it does

Live crypto price table for the top ~100 coins from the CoinGecko API (`getMarkets`, per_page 100, sparkline + 24h/7d change). Values are converted into 19 African currencies (NGN, KES, ZAR, GHS, EGP, TZS, UGX, XOF, XAF, ETB, RWF, MZN, ZMW, MWK, BWP, NAD, MAD, TND, DZD). Features: currency selector, search, sortable columns, quick-stats bar (BTC/ETH/USDT/total mcap), 7d sparklines, expandable per-coin 30-day chart + supply/ATH/ATL stats, and a 60-second auto-refresh with countdown/progress bar. Results are cached in localStorage (60s markets, 300s history/detail) so stale data survives API failure.

## Competitors & gaps

Real competitors: CoinGecko, CoinMarketCap, Binance, plus African-facing Luno / Yellow Card / Quidax. Those show USD/global-fiat first. AfroTools' genuine edge is **local-currency-first pricing across 19 African currencies + P2P-relevance framing**. Gaps vs competitors: no explicit source attribution or "as-of" freshness on the data (weakens trust vs CoinGecko), no per-coin deep pages, no fiat on/off-ramp or P2P-spread context, and the boilerplate "Create summary" df-upgrade widget (amounts/rates/dates) does not fit a live-price tool and dilutes topical focus.

## SEO

- Title: `Crypto Live Prices in African Currencies | AfroTools` — strong, contains keyword + currency framing.
- Meta description: WAS ~190 chars and claimed "100+" while hero says "50+". Tightened to 158 chars, keeps Naira/Cedi/Rand/Shilling.
- H1: `Crypto Prices in African Currencies` — single, unique, keyworded. Good.
- Canonical + hreflang (en/fr/x-default) present and correct.
- JSON-LD: BreadcrumbList + FAQPage present. **Was missing** a WebApplication/FinanceApplication entity — added.
- FAQPage JSON-LD mirrors the visible `df-faq` block (3 Q&A) — kept as-is (df-faq is off-limits and it does mirror visible content). Note: the df-faq copy is generic ("amounts, rates and dates") and does not describe a live-price tool well; flagged, not changed per rules.

## UX / data-trust

- Result clarity good; loading skeleton, empty/error state ("Unable to load data"), and mobile column-hiding (mcap/vol hidden <768px) all present.
- **Main data-trust gap:** no source citation, no "as-of"/freshness, and no "not financial advice / indicative" note anywhere near the price table (the only disclaimer lived far down in the df-upgrade note). Added a source + disclaimer line directly under the table.
- a11y: currency select and search have `<label for>`; price table had no accessible name — added `aria-label`. Sort headers are `<th>` with click handlers (not keyboard-focusable) — noted, deferred (shared CSS/JS pattern).

## Fixes applied 2026-07-14

- Meta description rewritten to 158 chars; removed the "100+" vs "50+" contradiction; kept Naira/Cedi/Rand/Shilling keywords.
- Added `WebApplication`/`FinanceApplication` JSON-LD (name, url, applicationCategory, free Offer, featureList, provider). Valid.
- Added a source + as-of + disclaimer line under the price table: cites CoinGecko live data, "refreshed every 60 seconds", "indicative estimates … can differ from exchange, bank or P2P rates", "not financial advice".
- Added `aria-label` to the `#priceTable` for screen-reader context.
- Verified all 3 ld+json blocks parse with Node (BreadcrumbList, WebApplication+FinanceApplication, FAQPage).

### Deferred (not done)

- df-upgrade "Create summary" widget + df-faq copy are generic/off-topic for a live-price tool but are off-limits per rules.
- Sort `<th>` headers are not keyboard-operable (shared pattern) — would need JS/role changes.
- Hero still says "50+ coins" while the tool loads up to 100 — left as-is (defensible, surgical).
