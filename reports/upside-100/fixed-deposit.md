# Fixed Deposit Rate Comparator — Audit

- Live: https://afrotools.com/tools/fixed-deposit/
- File: `tools/fixed-deposit/index.html`

## What it does
Client-side calculator: pick country (pre-fills an indicative annual rate), tenor (1–24 mo),
principal, rate, withholding tax, and simple vs monthly-compound interest. Outputs maturity
value, gross/net interest, tax withheld, monthly equivalent, EAR and net (after-tax) annual
rate, plus a month-by-month schedule table. "Comparator" is aspirational — it does not rank
multiple banks; it computes one deposit and pre-loads one benchmark rate per country.

## Math verification (node)
All correct:
- Simple: `P·r·(m/12)`; 500k@20%/12mo → gross 100,000, tax 10,000, net 90,000, total 590,000, net EAR 18%.
- Compound (monthly): `P·(1+r/12)^m`; 100k@12%/24mo → 26,973. EAR `(1+r/12)^12−1` = 12.68%.
- Schedule opening/closing balances reconcile for both modes.

## Data source / freshness
Weakest area. 19 hard-coded `data-rate` values inline in the `<select>` (not a shared data
file); no source, no as-of date. "54 Countries" badge overstates a 19-country pre-fill list
(the calc works for any country since the rate is editable). Rates are volatile — this read as
undated/unsourced before the fix.

## Gaps
- No provenance/date on pre-filled rates (fixed: added indicative + reviewed-date note).
- FAQ factual error: claimed 12-mo simple == compound, but the tool compounds *monthly* (12% → 12,683 vs 12,000). Fixed.
- Not a true multi-bank comparator despite the name (product gap, deferred).
- `.df-upgrade` block is a generic "payment comparison / POS fee" form mismatched to a savings tool (df-owned, not touched).

## SEO / UX / a11y / trust
- Title good, African intent present; meta 153 chars (in range); WebApplication+FinanceApplication + BreadcrumbList + FAQPage all valid; FAQPage mirrors the 8 visible FAQs (3 df-faq + 5 detailed).
- Inputs have `for`/`id` labels; button `type=button`. Added `aria-live` to results region.
- Responsive grid collapses at 680px (mobile OK).

## Fixes applied 2026-07-14
- Added visible `.fd-source` note in the main tool card: pre-filled rates are indicative
  benchmarks (reviewed Jul 2026), "rates are indicative and change often — confirm with the
  bank," and "planning estimate, not financial advice."
- Corrected the simple-vs-compound FAQ (visible + mirrored FAQPage JSON-LD) to reflect the
  tool's monthly compounding, with a worked 500k@12% example (60,000 vs ~63,412).
- Added `aria-live="polite"` to `#fd-results` for screen-reader announcement.
- Verified all 3 JSON-LD blocks parse (node).

### Deferred
- Make it a real multi-bank comparator; move the 19 inline rates to a dated shared data file
  with a source and expand toward the "54 countries" claim.
