# Floor Plan / Building Cost Estimator — Audit

**Tool:** Building Cost Estimator (Floor Plan)
**Live:** https://afrotools.com/tools/floor-plan/
**File:** `tools/floor-plan/index.html`
**Audited:** 2026-07-14

## What it does
Client-side construction budget estimator. User picks building type (bungalow → commercial), finish tier (economy/standard/premium/luxury), and one of 10 African cities (NGN, KES, ZAR, GHS, TZS, EGP). Rooms are added to derive measured floor area, which is grossed up (default +18%) for walls/circulation. It applies a per-m² local rate × type multiplier × site-difficulty factor, then layers separate allowances (preliminaries, external works, professional fees, contingency, escalation) — a genuinely NRM-style cost-plan structure with an estimate-stage confidence band, breakdown table, phased timeline, PDF export, and share.

## Competitors & gaps
- Real competitors: BuildPass/QS spreadsheets, local QS firms, Nigerian "cost to build a house" blog calculators, buildingcostkenya-type pages. Most rivals give a single flat ₦/m² × area with no allowance discipline.
- **Edge:** this tool's separation of measured works vs. allowances and its stage-confidence framing is more honest than nearly all African rivals.
- **Gaps:** only 10 cities / 6 countries (no Uganda, Rwanda, Ethiopia, Morocco, Senegal, DRC); rates are static (no dated "prices as of" line or FX/inflation source per city); no per-country storey-count input for real high-rise; no export of assumptions inputs into the PDF beyond summary.

## Cost math — verified (node)
Lagos, standard bungalow, default allowances: measured 90.75 m² → gross 107.1 m²; direct ₦280,000/m²; building works ₦29.98M; total **₦45.43M**; blended **₦424,267/m²**. Breakdown percentages sum to **1.00**. Allowance chain (prelims → ext works & fees on works+prelims → contingency on subtotal → escalation on top) is internally consistent and matches the page's own "₦25–45M" copy. No math errors found.

## Data source / freshness
Rates hardcoded in `COSTS`; SEO copy cites "2024 prices" but no machine-readable freshness/source per city. Method notes correctly reference RICS NRM / Cost Prediction. Deferred: add a dated source line and a country-rate refresh path.

## SEO
- Title/meta/H1 present; FAQPage JSON-LD (6 Q) mirrors the 6 visible `<details>` verbatim; WebApplication + WebPage + BreadcrumbList all valid; hreflang en/fr/sw + canonical present.
- **Fixed:** title lacked African intent; meta description was 180 chars (over 160).

## UX / a11y / trust
- Input→result flow is clear; mobile grids collapse at 768px; room add-inputs have aria-labels.
- **Critical bug found:** working-tree copy had a `<script src=related-tools.min.js>` injected *inside* the `exportPDF` `document.write('…')` single-quoted string, spanning literal newlines → JavaScript SyntaxError that killed the ENTIRE inline script (calculate/addRoom/suggestRooms all dead → tool non-functional). Deployed production file (line 652) is clean, so this was an **uncommitted local regression**.
- Trust: method notes + PDF footer disclaim BOQ status, but no concise "estimate only" line by the headline number.

## Fixes applied 2026-07-14
- **Restored broken `exportPDF` closing write** (`w.document.write('</body></html>');`) and relocated the `related-tools.min.js` tag to a valid body-script position → inline script now parses (node `--check` OK); tool functional again.
- **Title** → `Building Cost Estimator Africa - Construction Cost per m2` (57 chars, African intent).
- **Meta description** → 153 chars (was 180), keyword + city intent, within 120–160.
- **Disclaimer** added under the total card: "Estimate only - local material and labour prices vary…".
- **a11y:** `aria-live="polite"` on `#results` so the computed total is announced.
- Verified: cost math (node), 4/4 JSON-LD parse, FAQPage mirrors 6 visible FAQs, inline-script syntax.

### Deferred (out of scope / not touched)
- Expand city/country coverage; add dated per-city rate source + refresh script; storey-count input for real high-rise; feed input assumptions into the PDF. `df`/planning-summary blocks untouched.
