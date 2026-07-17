# BNPL Cost Calculator — Audit

Live: https://afrotools.com/tools/bnpl-calc/
File: `tools/bnpl-calc/index.html`

## What it does
Estimates the true cost of Buy Now Pay Later vs paying upfront for African
providers (M-Pesa Kashem, Flutterwave, Carbon, PayFlex, Zip SA, Lipa Later).
User picks a provider (auto-fills fee rate + installment count) or overrides
item price / installments / fee %. Outputs total fee, total payable, per-
installment amount, an installment schedule, and an "Effective APR". A separate
"planning summary" df-upgrade form + df-faq block sits below (generated — not
touched).

## Gaps found
1. **Effective APR was materially understated (math bug).** The old formula
   `(1+feeRate)^(12/n)-1` treated the one-time flat fee as a per-period
   compounding rate and ignored that principal amortises across installments.
   Default case (8.5% fee, 4 installments) showed **28%** when the true IRR-based
   effective APR is **~48%** — and it contradicted the page's own "APRs are often
   100-200%" warning. Verified in Node across 7 cases.
2. Meta description was 163 chars (over the 160 limit).
3. Results panel had no live-region, so screen readers weren't notified when
   values updated after "Calculate".
4. No explicit "not financial advice" disclaimer inside the calculator's own
   warning box (only the generated df block carried one).

## Math verification (Node, P=50,000)
| Provider case | Old APR | Corrected effective APR |
|---|---|---|
| Kashem 8.5% / 4 | 27.7% | **48%** |
| Flutterwave 3% / 3 | 12.6% | **19%** |
| PayFlex 0% / 4 | 0% | **0% (free!)** |
| Lipa 2% / 6 | 4.0% | **7%** |
| High 15% / 4 | 52.1% | **97%** |

Corrected method: solve monthly IRR `i` on the amortising cash flows
(`price = A·(1−(1+i)^−n)/i`, `A = price(1+fee)/n`, one payment ~every 30 days),
then compound to an annual effective rate `(1+i)^12−1`. Bisection, 100 iters.

## SEO
- Title good, has keyword + African intent: "BNPL Cost Calculator — Buy Now Pay
  Later Africa | AfroTools". Kept.
- H1 "BNPL Cost Calculator" — single, unique, keyworded. Kept.
- JSON-LD: WebApplication (FinanceApplication) + BreadcrumbList + FAQPage. All 3
  parse. FAQPage mirrors the 6 visible FAQ entries (3 df-faq + 3 custom). Valid.

## UX / a11y
- Input→result flow clear; inputs have associated `<label for>`. Mobile grid
  collapses at 680px (fine at 375px).
- Added `role="region"` + `aria-live="polite"` to results panel.

## Fixes applied 2026-07-14
- Replaced flawed effective-APR formula with an IRR/bisection solver on the
  amortising cash flows (annualised). Verified against reference solver in Node.
- Trimmed meta description 163→159 chars (within 120–160).
- Added `role="region"` + `aria-live="polite"` to `#bnpl-results`.
- Appended an "educational estimate, not financial advice" disclaimer to the
  calculator warning box.
- Verified all 3 ld+json blocks parse (3/3).

## Deferred
- HowTo schema (optional; steps exist but kept surgical).
- Provider fee rates are hardcoded defaults — not validated against live
  provider terms (out of scope; data-freshness task).
