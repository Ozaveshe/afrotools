# tbill-calc — Treasury Bill Yield Calculator

- Live: https://afrotools.com/tools/tbill-calc/
- File: `tools/tbill-calc/index.html`

## What it does
Client-side T-bill calculator. Pick country (10 seeded incl. NG/KE/ZA/GH/EG/TZ/UG/ZM/RW/MA),
tenor (91/182/364-day), face value, rate, withholding tax. Returns purchase price (discounted),
gross return, tax withheld, net return, actual yield, annualized return, and net maturity value.
Country select auto-fills seeded rates + tax via `fillTBRates()`.

## Yield math verification
Original formula: `price = Face / (1 + rate·days/365)`, `actualYield = (Face−price)/price·365/days`.
- This is the **true/investment-yield** convention and is internally consistent: because
  `price = Face/(1+y·t)`, `actualYield` always resolves back to the input rate exactly.
- Verified in node (face 1,000,000):
  - 364-day @ 27%: pay 787,860, gross 212,140, actual yield 27.00% ✓
  - 91-day @ 25%: pay 941,328, gross 58,672, actual yield 25.00% ✓
  - Kenya 91-day @ 13%, 15% WHT: net 2,668, annualized net 11.05% ✓

**Defect found:** the input was labeled "Yield / Discount Rate" — conflating two distinct
conventions. A T-bill discount rate quotes return against **face value**
(`price = Face·(1 − d·t)`); a true yield quotes return against **price paid**. The tool only
ever applied the yield formula, so the "Actual Yield" output was mathematically forced to equal
the input, and the FAQ claim "Our calculator shows both [discount rate and yield]" was false —
there was no way to enter an auction/stop discount rate and see the higher true yield.

## Gaps
- No discount-vs-yield distinction despite FAQ promising it (fixed).
- No disclaimer near the live calculator that rates are set at auction / not advice (fixed).
- Results region not announced to screen readers (fixed).
- Meta description was ~167 chars, no country intent (fixed).
- Title/H1 generic (fixed).
- Seeded rates are illustrative, not live despite "Live Rates Pre-filled" badge (deferred — data/UX, not math).

## Changes applied (surgical, only `tools/tbill-calc/`)
1. Added **Rate Type** selector (True/Investment Yield vs Discount Rate). Discount mode uses
   `price = Face·(1 − d·t)` so "Actual Yield" now correctly exceeds the discount rate
   (e.g. 27% discount, 364-day → 36.95% true yield), making the FAQ statement accurate.
2. Renamed rate field to "Quoted Rate (%)"; branched `calcTBill()` JS on rate type; removed
   stale `discountRate` var.
3. Title → country intent; meta/OG/Twitter description rewritten to 120–160 chars with NG/KE/GH intent.
4. H1 → "African Treasury Bill (T-Bill) Yield Calculator" (unique vs title).
5. Info-box disclaimer: "Estimate only — not financial advice… rates are set at central-bank auctions."
6. `aria-live="polite"` on results container.

## JSON-LD
WebApplication (FinanceApplication), BreadcrumbList, FAQPage all parse (node-validated).
FAQPage mirrors the 7 visible questions (3 df-faq + 4 main FAQ) — left unchanged, no touch to df blocks.

## Deferred
- Wire seeded rates to a live source or soften the "Live Rates Pre-filled" badge.
- Consider adding an in-page note explaining discount vs yield beside the new selector.

## Fixes applied 2026-07-14
All six changes above landed in `tools/tbill-calc/index.html`. Math re-verified in node for both
yield and discount modes across 91-day and 364-day cases. No shared files edited.
