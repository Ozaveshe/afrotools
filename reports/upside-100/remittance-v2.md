# Remittance Comparator Pro — Audit (`tools/remittance-v2/index.html`)

Live: https://afrotools.com/tools/remittance-v2/

## What it does
Corridor cost comparator. User picks sending country (9 options), receiving country (15 African markets), amount, plus a "Pro" row (own fee, FX margin %, payout method, annual transfer count, priority). On Compare it ranks 11 hardcoded providers (Wise, Lemfi, Remitly, WorldRemit, Western Union, MoneyGram, Chipper Cash, Sendwave, OFX, Flutterwave Send, Azimo) plus the user-entered scenario by estimated total cost, showing fee, effective rate, recipient-gets, cost %, an action plan (shortlist/lowest/fastest/annual upside), a savings note, and copy/save/share. 4 corridor presets, an AI advisor (`ai-advisor`, tool key `remittance-v2`), World Bank RPW benchmark card.

## Data freshness — CRITICAL finding
Provider fees, FX margins, and FX rates are ALL static/hardcoded, not live. `RATES`/`FROM_RATES` (USD-base FX) are "manually maintained estimates, updated Mar 2026"; `PROVIDERS[]` fee functions and `rateMargin` are hardcoded tiers. No provider API is called. To the tool's credit, this is already handled with unusual honesty: a "Not a live quote. Estimates only." note by the button, and a full "Provider freshness" panel (static estimates / manually maintained / not live verified) in results. Gap before fix: no ALWAYS-visible indicative/as-of disclaimer (freshness panel only renders after Compare) and no visible source/date on load. FX rates will drift materially (e.g. NGN 1535, likely stale for Jul 2026).

## Fee math — verified correct
`totalCost = fee + (amount-fee)*rateMargin` (derived from mid-market vs received). Sound: explicit fee plus FX-margin cost on post-fee principal. `received=(amount-fee)*baseRate*(1-margin)`; % = cost/amount. No math defects.

## SEO
- Title/desc/keywords/OG/Twitter/canonical/hreflang all present; desc ~159 chars (in range).
- JSON-LD: WebApplication (FinanceApplication), WebPage, FAQPage, BreadcrumbList — all valid, FAQPage mirrors the 4 visible FAQ items exactly. Good.
- H1 was brand-only ("Remittance Comparator Pro") — no keyword. Fixed.
- Solid unique body copy (why costs vary, corridor recs, speed vs cost) + RPW benchmark.

## UX / a11y
- Input→comparison flow clear; presets auto-run Compare; results scroll into view.
- Mobile: form-grid and provider-card collapse to 1–2 cols at 700/480px; OK at 375px.
- a11y gaps: results region not announced (added aria-live); labels present; corridor group labelled. `alert()` used for unsupported corridor (acceptable).

## Gaps / deferred
- FX rates static and likely stale (NGN especially). No live FX; could reuse `/api/forex?base=USD` (shared infra) — deferred, not in-scope for this surgical pass.
- Provider fee tables have no per-provider "verified" date; annual-upside figure assumes identical repeat transfer.
- `--green` CSS var already holds brand blue #0062CC (naming legacy only; no non-brand accent to fix).

## Fixes applied 2026-07-14
- `<title>` → added African intent: "…Compare Money Transfer Costs to Africa".
- H1 → unique keyword H1: "Remittance Comparator Pro: Send Money to Africa Cost Comparison" (distinct from SEO `<h2>` "Compare Remittance Costs to Africa").
- Added always-visible `.rate-disclaimer` note: fees/rates indicative, manually maintained (as of March 2026), may be out of date, confirm on provider site, with World Bank RPW source link + scoped CSS.
- a11y: `aria-live="polite"` on `#results` so screen readers announce the ranking.
- Meta description left unchanged (already 120–160). No JSON-LD change needed; all 4 blocks re-validated OK via node.
- Deferred (shared infra): wiring live FX via `/api/forex` — logged only; not edited.
