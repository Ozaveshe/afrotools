# African Property Tax Calculator — Audit

URL: https://afrotools.com/tools/property-tax/
File: `tools/property-tax/index.html`
Date: 2026-07-14

## What it does
Five-tab property-tax suite covering 15 African countries: (1) Annual property
tax by country/city/use/value; (2) Total buyer/acquisition costs (transfer duty,
stamp duty, consent, registration, legal, agent) with donut chart; (3) Rental
income tax with net-yield calc; (4) Capital gains tax with primary-residence
exemption, exclusions and inclusion rates; (5) Cross-country comparison + a
low-tax-destinations card. Country data lives inline in a `COUNTRIES` object.

## Math verification (node)
All representative cases reproduced correctly:
- Annual: Lagos residential 50M x 0.000394 = NGN 19,700. Correct.
- Buyer: ZA progressive transfer duty on R3M = R127,600 (bracket-by-bracket). Correct.
- Rental: Kenya flat 7.5% of 6M gross = KES 450,000; Egypt 10% after 30% deduction = EGP 420,000. Correct.
- CGT: ZA gain R1,650,000 fully wiped by R2M exclusion -> tax 0. Correct.
- Morocco CGT minimum-tax (3% of sale price) floor applied correctly.

Engine logic (progressive slicing, exclusions, inclusion rates, EG/ZM sale-price
basis) is sound.

## Gaps / data notes (not fixed — surgical scope / shared rate data)
- Compare tab applies each country's **local-currency** thresholds (e.g. ZA's
  ZAR transfer brackets) directly to the entered **USD** value, so ZA transfer %
  is understated for a $100k input. It is flagged in-page as an approximation,
  but the cross-currency mismatch is a real inaccuracy worth a future FX pass.
- Kenya simplified rental regime upper bound (KES 15M) is not modelled; only the
  lower KES 288k threshold is applied.
- Rates are inline and undated beyond a "2025/2026 Rates" badge; no live source
  freshness. Property/transfer rates change with annual budgets — periodic review
  needed. Rate data is shared/product-wide, so not edited here.

## SEO
- Title: "African Property Tax Calculator | AfroTools" — keyword + African intent. Good, kept.
- Meta description: was 185 chars (truncates). Trimmed to 153. Fixed.
- H1: "African Property Tax Calculator" — single, unique, keyword-rich. Good.
- JSON-LD: WebApplication (FinanceApplication), WebPage, BreadcrumbList, FAQPage.
  All 4 parse. FAQPage mirrors the 6 visible FAQ items exactly. Good.
- hreflang en/fr/sw + x-default present, canonical present.

## UX / a11y / trust
- Inputs and selects carry aria-labels; tabs are real buttons.
- Per-tab disclaimers already present ("Estimates only... Consult your local tax
  authority"). Deep-improvement section cites SARS / SA deeds registry / Ghana
  Lands Commission as official sources. Trust layer adequate.
- Mobile: responsive grid collapses at 900/600/400px; result grid and haven grid
  reflow; tabs scroll horizontally. No overflow issues expected at 375px.

## Fixes applied 2026-07-14
- Trimmed `<meta name="description">` from 185 -> 153 chars (keyword-first,
  within 120-160 target). No other changes; math verified, all JSON-LD re-validated.
