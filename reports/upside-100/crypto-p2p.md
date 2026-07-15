# P2P Crypto Rate Comparator — Audit

- **Tool:** https://afrotools.com/crypto/p2p-rates/
- **File:** `crypto/p2p-rates/index.html`
- **Backend:** `netlify/functions/crypto-p2p.js`
- **Date:** 2026-07-14

## What it does
Compares peer-to-peer crypto buy/sell rates across platforms for African currencies.
User picks side (BUY/SELL), asset (USDT/BTC/ETH/BNB/USDC), local currency (NGN, KES,
ZAR, GHS, EGP, TZS, UGX, XOF, ETB, RWF) and an amount. It returns per-platform price
cards sorted best-first, a spread-vs-mid bar chart, a USD price ticker, and a
browser-local price-alert feature (localStorage, checked on load).

## Data source & freshness
Genuinely **live**, not static. The Netlify function queries the Binance P2P and
Bybit P2P order-book APIs in parallel (real ads, both sides), merges admin-reviewed
rows from Supabase `p2p_rates`, and falls back to CoinGecko spot only if all fail.
Server caches 2 min; the client auto-refreshes every 60s and exposes a "Refresh Now"
button. Each card already renders a LIVE/UPDATED/SPOT source badge and a relative
"Xm ago" from the API `lastUpdated`.

## Gaps found
1. **No visible source attribution or as-of near the tool** — badges existed per card
   but there was no plain-language "where these come from" line or absolute timestamp;
   the indicative-rate/not-financial-advice disclaimer lived only in the df/verification
   blocks lower down. (Fixed.)
2. **Meta description 165 chars** (over 160) and light on African-currency intent. (Fixed.)
3. **a11y:** BUY/SELL toggle was a bare div with no group role or pressed state; result
   count not announced. (Fixed.)
4. **"8+ platforms" marketing claim** depends on the Supabase `p2p_rates` seed; live feed
   is Binance + Bybit only. If the manual table is sparse, results can under-deliver the
   headline. Not a code bug — content/data-seed watch item. (Deferred — no edit.)
5. Alert feature is browser-local only (no real push) — copy already says "checked every
   time this page loads," so honest; noted, not changed.

## SEO
- Title already keyword-rich with African intent ("Compare 8+ Platforms in Africa") — kept.
- H1 "P2P Crypto Rate Comparator" — unique, kept.
- JSON-LD: WebApplication (applicationCategory FinanceApplication), WebPage, BreadcrumbList,
  FAQPage. FAQPage mirrors the visible df-faq 1:1. All 4 validated via node — all parse.
- Deep SEO body copy + verification panel already strong.

## Fixes applied 2026-07-14
- Meta description rewritten to 155 chars with USDT/BTC/ETH + NGN/KES/ZAR intent.
- Added a visible **Source + freshness + disclaimer** line under the results:
  cites live Binance/Bybit order books + admin reference rates (CoinGecko fallback),
  a JS-populated "Rates as of HH:MM" absolute timestamp (`#p2pAsOf`, from API `timestamp`),
  and "Rates are indicative and move fast — confirm the final executable price, fees and
  merchant reputation on the platform before trading. This is not financial advice."
- a11y: `role="group"` + `aria-label` on the BUY/SELL toggle, `aria-pressed` state toggled
  in JS, `aria-live="polite"` on the result count.
- Did **not** touch df-upgrade block, planning summary, verification panel, rate data,
  or the Netlify function. JSON-LD unchanged and re-validated (4/4 parse).
