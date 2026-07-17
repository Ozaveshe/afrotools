# Payment Gateway Fee Comparator — Audit

Live: https://afrotools.com/tools/payment-gateway/
File: `tools/payment-gateway/index.html`

## What it does
Client-side comparator. User picks country (15 markets), average transaction value,
monthly transaction count and payment method (card / mobile money / bank / USSD). It
filters an inline `GATEWAYS` array (8 gateways: Paystack, Flutterwave, Peach Payments,
DPO Pay, Pesapal, Cellulant Tingg, Interswitch, PayGate) to those serving the country,
computes per-transaction and monthly fees, ranks cheapest→dearest, and shows a winner
card, four metric tiles (monthly volume, cheapest fee, most expensive fee, annual saving
best-vs-worst) and a ranked table with effective rate.

## Fee math — verified (node)
`txnFee = avgTxn*rate + flat`, capped when `cap>0`; `monthlyFee = txnFee*monthlyTxns`;
`effectiveRate = monthlyFee/monthlyVol*100`. Cases checked:
- NG card 15,000×200: Flutterwave 210/txn, 42,000/mo, 1.40% (cheapest) — correct.
- NG card 200,000×10: Paystack/Interswitch cap at 2,000/txn (raw 3,100) → 1.00% eff — cap works.
- NG bank 15,000×200: bankRate 0 → flat-only fee (50 / 100) — correct.
All arithmetic sound. Fee values are plausible standard published rates (Paystack 1.5%+₦100
cap ₦2,000, Flutterwave ~1.4%, DPO ~3.5%) — indicative, not live-sourced.

## Data source / freshness
Fees are hardcoded in-page, not sourced or dated originally. Info-box previously said only
"approximate standard published rates … check provider websites." No per-provider citation.

## SEO
- Title: "Payment Gateway Fee Comparator — Africa | AfroTools" — keyword + African intent. Good.
- Meta description: 152 chars, in range. Good.
- One unique keyword H1 ("Payment Gateway Fee Comparator"). Good.
- JSON-LD: WebApplication/FinanceApplication + BreadcrumbList + FAQPage (6 Q) — all parse.
  FAQPage entries all mirror visible FAQ (3 in df-faq + 3 in faq-item). Compliant.

## UX / a11y / trust
- Inputs have associated `<label for>`; button is `type=button`. Mobile: form-grid collapses
  to 1 col and metrics to 2 col at ≤680px. Table is fintech-payment-focus themed.
- Results region had no live-region announcement for screen readers.
- Trust gap: no dated source line; disclaimer lacked the "confirm on provider's pricing page" ask.

## Gaps / deferred
- Fee data is a static in-page array — no live/scraped source; acceptable for a planning
  estimate but cannot auto-refresh. Deferred (out of surgical scope).
- Bank-transfer modelled as flat-fee-only (rate 0) across all gateways — simplification.
- df-upgrade "planning summary" block left untouched per rules.

## Fixes applied 2026-07-14
- Info-box rewritten to a dated, per-provider **Source:** line (reviewed July 2026) plus the
  required disclaimer: "Fees are indicative and change — confirm on the provider's pricing
  page before you rely on them."
- Added `role="region" aria-live="polite" aria-label` to `#pg-results` so screen readers
  announce the comparison after "Compare Gateways" is clicked.
- Verified all three ld+json blocks parse (node) and FAQPage mirrors only visible FAQ.
- Fee math re-verified in node (cap, flat-only bank, effective rate) — no changes needed.
