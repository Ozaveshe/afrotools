# Audit — African Diaspora Tax Guide

- Live: https://afrotools.com/tools/diaspora-guide/
- File: `tools/diaspora-guide/index.html`
- Category: Uniquely African
- Date: 2026-07-14

## What it does

A country-corridor tax guide for Africans in the diaspora. User picks a home
country (8 African: NG, KE, GH, ZA, TZ, UG, SN, ET) and a country of residence
(US, UK, CA, AE, DE); the page renders residency rules, DTA status, home-country
and residence-country obligations, and country tips from a client-side `DATA`
map. A secondary "cross-border compliance checklist" (tax-planner) takes
days-in-country, home income, foreign assets, and remittance level and outputs
practical next steps plus official-source links (IRS, HMRC, CRA, FTA, BZSt).
Also includes a static SEO explainer, a 5-item FAQ, a "Did You Know" remittance
stat, an optional AI Tax Advisor (3 exchanges), and SSR related tools.

Real analogues: this is a genuinely useful, differentiated tool. Close cousins
on-site are the Remittance Comparator(s), PAYE Calculator, VAT/Property/Crypto
tax calculators. External analogues: Nomad Capitalist / expat-tax firm guides,
gov.uk SRT pages — but few pan-African diaspora-corridor guides exist, so this
has upside.

## Gaps found

### Content accuracy / freshness (tax = high care)
- SEO section hardcodes the US gift exclusion at "$17,000 per year" (a 2023
  figure; 2024=$18k, 2025=$19k). The visible FAQ already avoids this by saying
  "verify the current IRS amount," but the prose contradicts it. Softened.
- `RES_DATA`/`DATA` figures are static; page relies on the checklist's "use
  official pages for current-year thresholds" nudge, which is good. Left intact
  (df/planning data not in scope).

### SEO
- **FAQPage JSON-LD did NOT mirror the visible FAQ.** 3 of 5 questions and most
  answers differed from the on-page `<details>` text (e.g. JSON-LD "What is a
  Double Taxation Agreement (DTA)?" vs visible "What is a Double Taxation
  Agreement?"; JSON-LD "How do I know if I am still a tax resident…" vs visible
  "Do I lose my tax residency when I move abroad?"). This is a Google
  rich-results policy violation (FAQ markup must match visible content).
  Rewritten to mirror the visible FAQ exactly.
- Title acceptable but tightened toward diaspora + remittance intent.
- Meta description was ~185 chars (over the 120–160 window). Trimmed.
- H1 is unique and keyword-bearing ("African Diaspora Tax Guide") — OK. The two
  other large headings are correctly `<h2>` (WebFetch misreported them as H1).
- No internal links to sibling tax tools (only nav + auto related-tools).

### UX / a11y
- The only disclaimer lived inside JS-rendered `.guide-block` output, so it was
  absent on first paint / before "Get Guide". Added a prominent always-visible
  disclaimer near the top.
- Home Country `<select>` had an `id` + `<label for>`; residence + planner
  selects used only `aria-label`. Fine, but hero em color used a non-issue.
- Mobile: form grids collapse to 1col at 700/520px — OK at 375px.

## Recommendations (deferred / not in scope)
- Consider server-rendering a default corridor (NG→US) so crawlers see guide
  content, not just the empty state.
- Periodic review of static `DATA` rates against authority pages.

## Fixes applied 2026-07-14

- Title -> "African Diaspora Tax Guide 2026 | Residency, DTA & Remittances" (keyword + African diaspora intent).
- Meta description rewritten to 158 chars (was ~185), within 120-160.
- FAQPage JSON-LD rewritten to mirror the 5 visible FAQ questions AND answers verbatim (fixes rich-results content-mismatch violation).
- Added a prominent always-visible disclaimer at top of container ("general information, not tax or legal advice"), with links to FIRS/KRA/SARS/IRS/HMRC. Previously the only disclaimer was inside JS-rendered output.
- Softened hardcoded US gift exclusion "$17,000" in SEO prose to "the IRS annual exclusion (which changes each tax year)" to avoid stale tax figure.
- Added contextual internal links to sibling tax tools: PAYE, Property Tax, Crypto Tax, VAT, Remittance Comparator.
- All 4 ld+json blocks parse (WebApplication, WebPage, FAQPage, BreadcrumbList) — verified with node.
- Untouched: tax-planner/checklist logic, DATA/RES_DATA rate tables, H1 (already unique/keyworded).
- No shared files edited.
