# Rental Yield Calculator — Audit

Live: https://afrotools.com/tools/rental-yield/
File: `tools/rental-yield/index.html`

## What it does
Client-side rental-investment calculator for 15 African markets. From property purchase price, monthly rent, purchase costs, annual expenses (rates/tax, insurance, maintenance, management, other), vacancy rate, optional mortgage, and rent-escalation/appreciation assumptions it outputs six metrics: gross yield, net yield, cap rate, cash-on-cash, monthly cash flow, and 10-year IRR. Adds a yield-quality meter, verdict, market benchmark, real-vs-nominal (inflation) view, income/expense breakdown, a 10-year projection chart + table, up-to-3-property comparison, and an optional AI advisor.

## Yield math verification (node)
- Gross = `annualGrossRent / propVal * 100` (line 1177). Verified: value 1,000,000 / rent 10,000/mo → 12.00%. Correct.
- Net = `noi / propVal * 100` where `noi = effectiveRent − totalExpenses` and `effectiveRent = grossRent − vacancyLoss` (1155-1157, 1178). Verified: 1,500,000 / 12,000 / 30,000 exp / 5% vac → gross 9.60%, net 7.12%. Correct — net properly subtracts vacancy + operating costs.
- Cap rate = `noi / propVal * 100` (1179): equals net yield because NOI excludes financing. Conceptually sound (cap rate is unlevered); acceptable.
- IRR via Newton-Raphson over 10-year cash flows + sale proceeds (calcIRR). Reasonable.
Math is sound. No calculation defects found.

## Gaps found
- Meta description was ~190 chars (over the 160 limit).
- H1 was generic "Rental Yield Calculator" — not unique/keyword-differentiated.
- FAQPage JSON-LD was polluted: 14 entries, 7 of them with a literal " +" appended to the question name (the toggle icon baked into the schema), plus fabricated duplicate questions ("good rental yield", "IRR") not matching the answer text shown. Invalid mirror of visible FAQ.
- No investment-advice disclaimer on results (only a "not legal advice" line inside the unrelated legal-workflow block).

## SEO / UX / trust notes
- Title already keyword + African intent ("Rental Yield Calculator Africa | AfroTools") — kept.
- Two visible FAQ blocks (sidebar "Common Questions" ×8, bottom "Frequently Asked Questions" ×5); JSON-LD now mirrors the unique visible set.
- Inputs carry aria-labels; responsive breakpoints at 900/600/420px present. Sidebar FAQ toggles are `div onclick` (not keyboard-focusable) — minor a11y gap, deferred (shared pattern, low priority).

## Fixes applied 2026-07-14
- Meta description rewritten to 160 chars, keyword-led (gross/net yield, cap rate, IRR) + African market intent + "Free investment estimate".
- H1 → "Africa Rental Yield Calculator" (unique, keyword + intent).
- FAQPage JSON-LD rebuilt to 11 entries mirroring only the visible FAQ; removed all " +" text pollution and the fabricated duplicate questions. All answer text verbatim from the page.
- Added an "estimate for guidance only… not investment or financial advice" disclaimer beneath the results/AI-insight block.
- Verified gross & net yield math via node (cases above) — correct.
- All 4 JSON-LD blocks (WebApplication/FinanceApplication, WebPage, FAQPage 11Q, BreadcrumbList) parse.

Deferred: sidebar FAQ keyboard a11y (shared div-onclick pattern). No shared files edited.
