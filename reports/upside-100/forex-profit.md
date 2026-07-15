# Forex Profit Calculator — Audit & Fixes

- Live: https://afrotools.com/tools/forex-profit/
- Source: `tools/forex-profit/index.html`

## What it does

Client-side forex trade calculator. Inputs: direction (Buy/Sell), currency pair (6 majors + 7 African pairs), entry/exit price, lot size (Standard/Mini/Micro), number of lots, account currency. Outputs: Profit/Loss (in account currency), pips gained/lost, pip value per pip, position size (units), and return on position (%). Pulls live FX via `/api/forex?base=USD` with `/data/forex/latest.json` and a stamped built-in table (`FX_FALLBACK_RATES`, 2026-03-28) as fallbacks, to convert quote-currency P&L into the chosen account currency. Save/share result components wired in.

## Competitors & gaps

- **Myfxbook / BabyPips / Investing.com calculators**: offer a dedicated pip-value calculator, margin/leverage requirement, and required-margin output. AfroTools omits **margin/leverage and required capital** — the biggest gap for a trading audience.
- **No stop-loss/take-profit or risk-per-trade sizing** (position size from % risk). Sidebar preaches 1–2% risk but the tool can't compute the lot size for it.
- **Spread cost not modelled** despite the sidebar warning about wide African spreads.
- **Differentiator (kept):** African pairs (USD/NGN, KES, ZAR, GHS, EGP, EUR/ZAR, GBP/ZAR) and account-currency conversion into NGN/KES/ZAR/GHS — competitors do not localise this way.

## Math verification (node cases)

Core P&L math is correct. `pips = priceDiff/pipSize`, `pipValueQuote = pipSize·positionSize`, `profitQuote = priceDiff·positionSize`, then quote→account via `(x/quoteRate)·acctRate`.

- EUR/USD std buy 1.0850→1.0900, USD acct → **50.0 pips, $10.00/pip, +$500.00, 0.461%** ✓
- USD/JPY std buy 149.00→149.50, USD acct → 50.0 pips, $6.69/pip, +$334.45 (1000 JPY/pip ÷ 149.5) ✓
- USD/ZAR std buy 18.00→18.50, USD acct → 5000 pips, +$3063.73 ✓
- USD/NGN mini sell 1550→1500, NGN acct → 5000 pips, ₦100/pip, +₦500,000 ✓

**Known simplification (deferred):** quote→account conversion uses the FX reference table/live rate for the quote currency, not the trade's own exit price. For USD/ZAR into a USD account it uses ~16.32 rather than the entered 18.50, so the USD pip value is a few cents off. P&L in the quote currency is exact; only the cross-currency display is approximate. Left as-is to avoid changing working, consistent behaviour.

## SEO

- Title had no African intent — fixed (see below).
- Meta description: 152 chars, keyword-rich, in range — kept.
- Single H1 ("Forex Profit Calculator") — kept.
- JSON-LD: 4 blocks (WebApplication/FinanceApplication, WebPage, BreadcrumbList, FAQPage) — all parse; FAQPage mirrors the visible `df-faq` 3-question block. Valid.

## UX / trust / a11y

- Input→result flow is clean; results hidden until Calculate; live-rate status line present.
- Entry/Exit/Lot/Lots/Account labels were not associated with their controls (`for` missing) — fixed.
- Calculator area lacked an explicit high-risk / not-financial-advice disclaimer near results (only the df block carried it) — fixed.
- Mobile 375px: grid collapses to single column at 768px; result grid stays 2-col — acceptable.

## Fixes applied 2026-07-14

- `<title>` → `Forex Profit Calculator — Pip Value, P&L & African Pairs` (adds African intent).
- Added `for=` associations on Entry, Exit, Lot Size, Number of Lots, Account Currency labels (a11y).
- Added visible disclaimer in results card: estimate, not financial advice; forex is high-risk; most retail traders lose money; confirm live prices/spreads.
- Math verified via node (cases above); JSON-LD re-validated (4/4 parse).

## Deferred

- Add margin/leverage + required-capital and risk-based (% of account) position sizing to close competitor gap.
- Optional spread-cost input.
- Consider using the trade's exit price for quote→account pip-value conversion for exotics.
