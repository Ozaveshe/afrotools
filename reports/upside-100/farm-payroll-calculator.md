# Farm Worker Payroll Calculator — Audit

URL: https://afrotools.com/agriculture/farm-payroll/
File: `agriculture/farm-payroll/index.html`
Audited: 2026-07-14

## What it does
Hub/index page for a pan-African farm payroll tool. It lists 54 African
countries (grouped by region) each linking to a country-specific calculator,
plus an inline `df-upgrade` quick estimator (currency, workers, daily wage,
workdays → planning summary). The real per-country payroll math — gross pay,
deductions (pension, health, housing levy), PAYE cross-link, employer cost,
in-kind, and agricultural minimum-wage compliance — lives on the country pages
and the shared `df` engine, not on this index. Four worker types: permanent,
casual/daily, seasonal, piece-rate.

## Correctness of payroll/tax math + statutory rates
- No live calculation math runs on this index page itself (df engine + country
  pages own it), so nothing to recompute here.
- The SEO copy makes point-in-time statutory claims that should be verified
  against current gazettes:
  - "Kenya sets a specific gazetted agricultural minimum (KSh 7,997/month in
    2024, vs. KSh 15,201 for general workers in Nairobi)". The 2022 wage order +
    2024 Labour-Day 6% raise likely puts the unskilled agricultural figure
    slightly higher (~KSh 8,100). **Flag: verify against the current Regulation
    of Wages (Agricultural Industry) Order before relying on it.** Not changed —
    would be fabrication to "correct" without the gazette.
  - Kenya deductions cited (NSSF 6% tiered, Housing Levy 1.5%, SHIF replacing
    NHIF Oct 2024, SA 2022 equalization, Ethiopia has no statutory minimum wage)
    are broadly current for Jul 2026.
- Statutory rate tables are generated/shared data (df engine + country-index),
  outside this file's edit scope. No concrete numeric defect confirmed here; see
  `_shared-fixes.md` note.

## Competitors / analogues + gaps
1. **Deel / Papaya Global / Remote.com** — global payroll/EOR; broad country
   coverage but not agriculture-specific, paywalled, enterprise-oriented.
2. **PaySpace / Sage Payroll (South Africa)** — real payroll SaaS honouring
   BCEA sectoral (farm) determinations; SA-centric, paid.
3. **Workpay / Wingubox (Kenya)** — Kenya payroll incl. NSSF/SHIF/PAYE; SaaS,
   not farm-specific, single-country.
4. **WageIndicator / Mywage.org** — free minimum-wage reference incl.
   agriculture by country, but a lookup table, not a payroll calculator.
5. **National gazettes / ILO wage tables** — authoritative reference only, no
   calculation.
Gap: no free tool offers a pan-African, farm-specific payroll estimator with
worker-type logic + in-kind + minimum-wage compliance. AfroTools' niche is
defensible. AfroTools own gaps: no downloadable payslip, hub form lacks an
overtime input, and no visible "rates as-of" date for statutory figures.

## SEO
- **Title** (original) "Farm Worker Payroll Calculator — 54 African Countries |
  AfroTools" — serviceable but omits high-intent benefit keywords (wages,
  deductions, take-home). Strengthened.
- **Meta description** (original) ~200 chars — over the ~160 limit, truncates in
  SERP. Trimmed to 120-160.
- **H1** "Farm Worker Payroll Calculator" — generic, no geo/unique keyword;
  identical to title stem. Added "for Africa".
- **JSON-LD** — had CollectionPage + FAQPage + BreadcrumbList. Missing the
  WebApplication/FinanceApplication entity expected for a calculator. FAQPage
  answers did not exactly mirror the visible `.faq` text (Google wants parity).
- **FAQ match** — visible page has TWO FAQ blocks: the `df-faq` (3 Qs, off-limits
  df block) and the richer `.faq` (5 Qs). JSON-LD FAQPage aligned to the visible
  `.faq` set verbatim.

## UX
- Country-card grid is `minmax(200px,1fr)` → collapses to one column at 375px;
  cards, tap targets and hover states are fine on mobile.
- df quick-estimator form has `aria-label`s and `aria-live` output. a11y ok.
- The index has no result breakdown of its own (by design — depth is on country
  pages); acceptable for a hub.

## Trust / disclaimer
- The df block carries a payroll disclaimer (off-limits to edit). The
  `seo-content` narrative section had NO "estimate, not advice / confirm current
  statutory rates" disclaimer. Added one near the content/result area.

## Business CTA
- Audit flag confirmed: high-intent money tool with no conversion path. The FAQ
  already references a PAYE cross-link but there was no actual link. Added a
  subtle internal CTA to the real PAYE Calculator (`/salary-tax/paye/`).

## Fixes applied 2026-07-14
- **Title** → `Farm Worker Payroll Calculator 2026 — Wages, Deductions &
  Take-Home | Africa` (adds benefit keywords + freshness year).
- **Meta description** → trimmed to ~142 chars within the 120-160 window.
- **H1** → `Farm Worker Payroll Calculator for Africa` (unique geo keyword,
  distinct from title).
- **JSON-LD** → added a valid `WebApplication` / `applicationCategory:
  FinanceApplication` block (free offer, publisher). Existing CollectionPage,
  BreadcrumbList untouched. FAQPage `mainEntity` rewritten to mirror the visible
  `.faq` (5 Qs) verbatim. All JSON-LD re-validated with `node` (parses clean).
- **Disclaimer** → added an estimate/not-legal-advice + "confirm current
  statutory rates" note in `seo-content`, near the result/FAQ area.
- **CTA** → added a subtle internal link to the PAYE Calculator
  (`/salary-tax/paye/`) in `seo-content`.
- **Not touched (deferred):** df quick-estimator + df-faq blocks (per
  constraint); statutory rate data (shared/generated — Kenya KSh 7,997 figure
  flagged for gazette verification); no overtime input / payslip export /
  rates-as-of date (product backlog). Shared-data note added to `_shared-fixes.md`.
