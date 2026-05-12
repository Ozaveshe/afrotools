# Blog Refresh Audit - May 12, 2026

## Scope

This pass checked the static `/blog/` surface, refreshed the blog hub structure, and updated the highest-risk stale public article found during the first sweep: `blog/tax-updates-2026/index.html`.

The repo was already dirty before this pass, including nearly every file under `blog/`. This report separates the current audit findings from the pre-existing dirty tree.

## What Changed In This Pass

- Updated `blog/index.html` metadata, hero language, freshness framing, and "Start here" topic lanes for tax, trade, money movement, business setup, tool workflows, and lifestyle data.
- Updated `blog/tax-updates-2026/index.html` with current South Africa 2026/27 SARS tax brackets, rebates, thresholds, medical credits, VAT status, and VAT registration thresholds.
- Changed the tax update page modified date to `2026-05-12` in JSON-LD and `article:modified_time`.
- Added an official-source refresh note inside the tax update article.
- Regenerated and checked `blog/feed.xml`; the generated output was already current, so it did not remain as a file diff.

## Online Sources Checked

- SARS Budget 2026 Tax Guide: individual rates for 1 March 2026 to 28 February 2027, VAT rate of 15%, compulsory VAT registration above R2.3 million, and voluntary registration above R120,000.
- National Treasury media statement dated April 27, 2025: VAT increase proposal withdrawn and legislation to maintain VAT at 15% from May 1, 2025.
- KRA PAYE guidance: SHIF listed as an allowable deduction against taxable employment income.
- Kenya Social Health Insurance Regulations, 2024: salaried household contribution at 2.75% of gross salary or wage, minimum KES 300, remitted by the ninth day.
- Public official communication on Nigeria fiscal tax laws: new signed tax laws to commence January 1, 2026.

## Blog Inventory Snapshot

- Article folders under `blog/`: 178
- Hub article cards: 177
- Missing hub targets: 0
- Uncarded blog folder: 1, `francophone-africa-tax-guide-2026`, which is a noindex redirect to `/fr/blog/francophone-africa-tax-guide-2026/`
- Hub category counts:
  - Tax and PAYE: 36
  - Business and Legal: 42
  - Tools and Guides: 37
  - Currency and Forex: 23
  - Francais: 10
  - Africa Data: 29
- Time-sensitive slugs flagged by the audit heuristic: 102
- Pages with `dateModified` before April 1, 2026: 124
- Thin public candidates under 900 visible words: the car-import country guides, plus two noindex French redirect wrappers

## Critical Missing Items

1. There is no durable freshness ledger for blog articles.
   The blog has many 2026 titles, but 102 slugs are rate, tax, salary, import, remittance, crypto, or fee-sensitive. Those need a source-reviewed date, source-owner category, and next review month.

2. Several "current" pages are likely too broad to trust without a second source pass.
   Highest-risk clusters are rates and fees, salary averages, data-plan costs, construction prices, fuel prices, savings rates, treasury bills, crypto platform availability, and remittance provider pricing.

3. Some thin guides need expansion or noindex treatment.
   The car-import country guides are useful routing pages, but several are under 800 visible words. They should either become deeper source-backed guides or be treated as support pages to the stronger comparison article.

4. The hub still uses hand-authored article cards.
   `blog:verify` catches card drift, but category assignment, featured choices, and freshness status are manual. A generated blog index would reduce drift and make future refreshes faster.

5. Language quality is uneven across older March articles.
   The highest-quality recent articles use verification dates and source notes. Older articles often sound confident without the same evidence layer. The next editorial pass should add source notes before rewriting tone.

6. French static-blog handling needs clearer separation.
   The English `/blog/` tree includes noindex redirect wrappers for French canonical routes. That is structurally acceptable, but future reports should avoid counting those as thin English articles.

## Recommended Next Batch

1. Build `scripts/audit-blog-freshness.js` to output `reports/blog-freshness-ledger.json` and `.md`.
2. Refresh the top 20 time-sensitive guides by risk:
   `best-high-yield-savings-africa-2026`, `central-bank-interest-rates-africa`, `inflation-rates-africa-2026-guide`, `fuel-prices-africa`, `cheapest-data-plans-nigeria`, `construction-material-prices-nigeria`, `car-loan-rates-africa-2026`, `mortgage-rates-africa-2026`, the four "rate today" FX articles, the Nigeria/Kenya/South Africa salary articles, and the high-volume remittance/mobile-money guides.
3. Expand or consolidate the five thin car-import country guides after checking current official customs and port sources.
4. Add visible "verified on" blocks to rate-sensitive posts only after the source pass, not as cosmetic copy.
5. Consider generating the blog hub from article metadata once the freshness ledger exists.

## Validation Notes

Run after this pass:

```powershell
npm run blog:feed
npm run blog:feed:check
npm run blog:verify
git diff --check -- blog/index.html blog/tax-updates-2026/index.html blog/feed.xml reports/blog-refresh-audit-2026-05-12.md
```
