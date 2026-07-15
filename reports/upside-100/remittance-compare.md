# Remittance Comparator — Audit (upside-100)

- Tool: African Remittance Comparator
- Live: https://afrotools.com/tools/remittance-compare/
- File: `tools/remittance-compare/index.html`
- Audited: 2026-07-14

## What it does
Client-side comparator. User enters send amount + currency, origin country, destination
(16 African markets), transfers/year, recipient access, and urgency, then presses
"Compare Providers". It models 9 providers (Wise, WorldRemit, Remitly, Western Union,
MoneyGram, LemFi, Sendwave, Afriex, Chipper Cash), computing total fee, provider FX rate,
"true cost %", and recipient-gets. Outputs a decision plan, provider cards, a savings
callout, and a bar chart. Fee math is sound: fees subtracted in send currency before
converting (`recipientGets = (sendAmount - totalFee) * midRate * (1 - margin)`).

## CRITICAL trust finding — data is STATIC, not live
- **All exchange rates are hardcoded** in the inline `MID_MARKET` table (USD/GBP/EUR/CAD/AED
  → 16 African currencies). **All provider fees and FX margins are hardcoded** in the
  `PROVIDERS` object (flat/pct fee functions + fixed `margin` per provider).
- **There is NO live-rate fetch anywhere in the code.** A code comment previously claimed
  the table is "Overridden by live API when available" — this was false/misleading; no
  fetch call exists. Comment corrected during fixes.
- The rates are stale-dated: `article:modified_time` = 2026-03-28; page reviewed 2026-05-04.
  For a money tool this is a real trust risk — e.g. `USD-NGN: 1535` is a fixed snapshot that
  drifts materially from a real market months later.
- Mitigation present: the tool already labels itself "reference estimates / not a live quote
  feed" and tells users to confirm in the provider app. That honesty is good; the gap is the
  absence of any as-of/source stamp near the numbers (now added) and no live wiring.

## Competitors & gaps
- **Monito** — real-time comparison engine across providers with live quotes; the category
  benchmark. AfroTools is static by comparison.
- **Wise compare / Sendwave / Remitly blog comparisons** — provider-published corridor guides.
- **SendMoneyCompare, compareremittancerates.com** — live/near-live rate tables.
- Gap vs. all: AfroTools shows *modelled* numbers, not live quotes. Strengths vs. them:
  Africa-corridor focus (16 markets, mobile-money/cash-pickup awareness), true-cost (fee +
  FX markup) framing, annual-upside planner. To be competitive on trust it needs a live FX
  feed (`/api/forex?base=USD` already exists elsewhere) and periodically-refreshed provider
  fee snapshots, plus contributor quotes (AfroPoints link already on page).

## SEO
- Title (pre-fix): "Remittance Calculator 2026 | Compare Fees, FX and Landed Amount" — good
  keyword/year but no African intent. Fixed → prefixed "African".
- Meta description: 153 chars, has African corridor intent + planning framing. Good, kept.
- H1: "African Remittance Comparator" — single, unique, keyworded. Good.
- JSON-LD: WebApplication (FinanceApplication), WebPage, BreadcrumbList, FAQPage — all valid.
  **Defect found:** FAQPage questions AND answers did NOT match the 6 visible FAQ items
  (different wording on all 6). Rewritten to mirror visible FAQ exactly (Google requires
  parity). All 4 blocks re-validated with node.
- Good corridor internal content (SEO section), hreflang en/fr/sw/ha present.

## UX / a11y
- Input → results flow is clear; corridor pills prefill and auto-run. Mobile 375px handled
  (stacked corridor row, 2-col provider grid, shorter chart). Selects have labels; currency
  select has aria-label.
- a11y gaps fixed: results container had no live region (added `role=region` +
  `aria-live=polite`); decorative arrow now `aria-hidden`.
- Bar chart is div-based (acceptable; values are in provider cards too).

## Disclaimer
- Present (amber box) and honest. Was missing an explicit "may be out of date" line and any
  as-of/source stamp. Strengthened with a bold indicative-rates warning + source + as-of.

## Fixes applied 2026-07-14
- `<title>`, `og:title`, `twitter:title` → added "African" intent (keyword + African corridor).
- FAQPage JSON-LD rewritten to mirror the 6 visible FAQ Q&As verbatim (was mismatched). All
  4 ld+json blocks validated with node — parse OK.
- Disclaimer: added bold "rates/fees are indicative and may be out of date — confirm on the
  provider's site" line + source ("provider public pricing pages, as of March 2026").
- a11y: `#rcResults` given `role="region"` + `aria-live="polite"` + label; corridor arrow
  `aria-hidden="true"`.
- Corrected misleading `MID_MARKET` code comment (falsely claimed live-API override); added a
  "wire to /api/forex" pointer for future live sourcing.

## Deferred (out of surgical scope)
- Wire `MID_MARKET` to the live FX source (`/api/forex?base=USD`, `/data/forex/latest.json`
  fallback) so rates stop drifting — biggest trust upgrade.
- Refresh/date-stamp the provider fee & margin snapshots on a schedule; surface an on-page
  "rates as of" date next to the results, ideally driven by the FX/snapshot timestamp.
- Consider contributor-sourced live quotes via the existing AfroPoints remittance_quote flow.
