# Pension Projection Calculator — Audit

Tool: https://afrotools.com/tools/pension-proj/
File: `tools/pension-proj/index.html`

## What it does
Client-side retirement calculator. From current age, retirement age, salary, salary
growth, employee/employer contribution %, expected fund return, current balance,
voluntary contribution and inflation, it projects the pension pot at retirement.
Contributions compound monthly with annual salary growth. Extras: 3-scenario band
(±2% return), 500-path Monte Carlo probability + fan chart, real (inflation-adjusted)
toggle, lump-sum vs annuity vs programmed-withdrawal, what-if scenario table,
year-by-year table, AVC optimizer, drawdown/longevity calculator, death benefit,
Nigeria PFA comparison. Covers all 54 African countries with statutory rates,
currency symbols, retirement ages, CSV/print/share export.

## Math check (verified in Node against closed-form)
- FV of contributions = ordinary-annuity FV to the unit: 30y @ 18% of 100k, 10%/12
  → 40,688,783 vs closed-form 40,688,783 (diff 0).
- Initial-balance compounding + annuity combined: exact (diff 0).
- Identity totalContrib + totalReturns == balance holds.
- Annuity payment `pot·i/(1−(1+i)^−240)` inverts back to pot exactly.
- Drawdown longevity `n = −ln(1−fund·mr/W)/ln(1+mr)` is the correct depletion
  formula; real return via Fisher `(1+nom)/(1+infl)−1`. Sound.
- Convention note (not a bug): monthly rate = annualReturn/12 (nominal, not
  effective) and end-of-month contributions — standard, slightly conservative.

## Gaps
- `<title>` lacked African intent; meta description was 241 chars (over 160).
- No visible "not financial advice / growth not guaranteed" disclaimer in the
  results area (only in the lower verification panel).
- JSON-LD WebApplication/WebPage descriptions + sidebar card said "15 countries"
  though the tool now ships all 54 (stale count / SEO inaccuracy).
- Est. Monthly Pension uses a flat pot/(20·12) divide (ignores in-drawdown growth);
  acceptable simplification, left as-is.

## SEO / UX / trust
- H1 "Pension Projection Calculator" — unique, keyword-led, single H1. Good.
- FAQPage JSON-LD (8 Q) mirrors the 8 visible FAQ `<details>` exactly. Valid.
- WebApplication is FinanceApplication, price 0. Breadcrumb + WebPage present.
- a11y already solid: aria-labels on all inputs, focus-visible, reduced-motion,
  role/labels; left as-is. Mobile: grid collapses at 900/768/480px, tables scroll.

## Fixes applied 2026-07-14
- `<title>` → "Pension Projection Calculator for Africa (54 Countries) | AfroTools" (African intent + keyword).
- Meta description rewritten to 157 chars (in 120–160 range).
- Added a visible results-area disclaimer: estimate only, not financial advice, growth not guaranteed, verify with provider/adviser (`role="note"`).
- Corrected stale "15 African countries" → "54" in WebApplication + WebPage JSON-LD descriptions, and sidebar "Pension Rates — 54 Countries" (table already renders all 54).
- Re-validated: all 4 JSON-LD blocks parse; FAQPage mirrors visible FAQ (8/8).
- Deferred: none requiring shared-file edits. Only cosmetic residue is a JS
  header comment still reading "15 African countries" (harmless).
