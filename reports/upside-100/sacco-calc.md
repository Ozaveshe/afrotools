# sacco-calc — Audit

Live: https://afrotools.com/tools/sacco-calc/
File: tools/sacco-calc/index.html

## What it does
Client-side SACCO / credit-union model for 8 African markets (KE, UG, TZ, RW, GH, NG, ZA, ET). Inputs: country (auto-fills dividend %, bank rate, loan multiplier + currency symbol), monthly contribution, membership years, dividend rate, bank savings rate, loan multiplier, SACCO loan rate, bank loan rate. Outputs: total savings at maturity, total contributions, dividends earned, loan capacity, equivalent bank savings, SACCO advantage, loan interest savings. Six-item FAQ.

## Math check (node, verified)
- Contributions accrue monthly; annual dividend applied on year-end balance (`m%12===0`), then compounded — internally consistent.
- Bank comparison = simple interest on average balance: `principal + (principal/2)*rate*years`.
- Loan capacity = savings × multiplier. Loan savings = sampleLoan × (bankRate − saccoRate), sampleLoan = 50% of capacity.
- KE default (5000/mo, 3yr, 12%/4%, 3x, 12%/18%): savings KSh 226,760; dividends 46,760; loan cap 680,279; bank 190,800; advantage 35,960; loan savings 20,408. Correct.
- Minor model simplification (year-end vs average-share dividend base slightly overstates dividends) — acceptable for an estimate; noted, not changed.

## Gaps found
- Meta description 174 chars (over 160).
- Title lacked the high-intent "dividend / loan" keyword.
- Results region not announced to screen readers (no aria-live).
- No estimate/disclaimer in the calculator result area (only in the untouchable df block).
- Hero badge claimed "15 Countries" but dropdown lists 8 (trust/accuracy mismatch).

## Verified OK
- All 3 JSON-LD blocks (WebApplication/FinanceApplication, BreadcrumbList, FAQPage) parse.
- FAQPage mirrors the 6 locally-visible questions exactly (df 3 + native 3).
- Inputs all label-associated; canonical + hreflang (en/fr/sw/x-default) present; brand-blue tokens used.

## Fixes applied 2026-07-14
- Title → "SACCO / Credit Union Savings, Dividend & Loan Calculator — Africa | AfroTools".
- Meta/OG/Twitter description rewritten to 155 chars with African intent.
- Added `aria-live="polite"` to `#sc-results`.
- Added estimate disclaimer to results info-box: "This is an estimate. Dividend rates, loan multipliers and interest terms vary by SACCO and year — confirm the current figures with your own society before you rely on them."
- Hero badge "15 Countries" → "8 Countries" (matches dropdown).
- Math re-verified after edits; all JSON-LD re-parsed OK.

## Deferred
- Live df-FAQ is an older generated variant ("How should I use this?" etc.) vs local ("How do I use the SACCO/Credit Union Calculator?"); df blocks are generated outputs — left untouched.
- Dividend base refinement (average-share) deferred — model is a defensible estimate.
