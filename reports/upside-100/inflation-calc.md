# African Inflation Calculator — Upside Audit

- Live: https://afrotools.com/tools/inflation-calc/
- Source: `tools/inflation-calc/index.html`
- Category: financial
- Audited: 2026-07-14

## 1. What it does
A four-mode inflation tool for 54 African countries + USD/GBP/EUR:
- **Future Cost** — compound-inflate a present amount forward N years.
- **Past Value** — deflate a past amount to today's purchasing power.
- **Salary Check** — does a raise beat inflation in real terms?
- **Remittance** — how much buying power a fixed USD transfer has lost since the year sent.

Plus: Rule-of-72 mini-calc, 2–3 country comparison (cards + Chart.js line), year-by-year nominal/real/loss table, purchasing-power bar, regional rate sidebar, an "AI Inflation Advisor" (ai-advisor function), and an optional **Fetch Live Rates** button that pulls the World Bank CPI series (`FP.CPI.TOTL.ZG`, 2015–2025) and can render a historical bar chart. Feature-rich versus Western single-country calculators.

## 2. Calculation review
Core math is correct and consistent:
- Future: `FV = amount·(1+r)^years`; real value `= amount/(1+r)^years` (line 813–816).
- Past: symmetric inverse (line 818–821).
- Salary: `needed = old·(1+r)^years`, real change `= new/needed − 1` (line 916–919). Sound.
- Remittance: `pp = usd/(1+r)^years` (line 979–981). Sound.
- Rule of 72 and doubling-time (`ln2/ln(1+r)`) both present and correct.

### Red flags / caveats
1. **Preset rates are stale (main data issue).** The `COUNTRIES` array (line 582+) hardcodes single-point annual rates labelled **"African Inflation Rates (2024)"** — e.g. Nigeria 33.4%, Ghana 23.2%, Egypt 28.3%, Angola 25%. As of mid-2026 these are ~2-year-old figures; several have moved materially (Nigeria/Ghana/Egypt all cooled through 2025). Data is inline in this file — there is no shared data source or ledger, so accuracy lives only here.
2. **Freshness is opt-in and undated.** Live World Bank data only loads if the user clicks *Fetch Live Rates*; the default experience silently uses 2024 presets with no "as of" caption near the calculator/results.
3. **Hardcoded `currentYear = 2026`** in remittance (line 974) — correct today, but silently wrong from Jan 2027. Made dynamic (fix below).
4. **World Bank annual CPI lags ~1 year** and is period-average, not the monthly headline print users may expect — worth a caveat but acceptable for a planning tool.

## 3. Competitors + gaps
Real competitors:
1. **US BLS CPI Inflation Calculator** (bls.gov) — authoritative, monthly CPI, US-only.
2. **in2013dollars.com** (Official Data Foundation) — deep historical series, US/UK/global, strong SEO incumbent for "inflation calculator".
3. **Bank of England inflation calculator** — official, UK, long historical range.
4. **RBA inflation calculator** (Australia) — official.
5. **National bureaus / central banks** — Stats SA, Nigeria NBS, Ghana Statistical Service, Central Bank of Kenya — the authoritative country sources.

**AfroTools gaps vs them:** those calculators use official *monthly* CPI index series and carry institutional authority; AfroTools uses stale 2024 annual presets with optional WB annual data — weaker on freshness/authority.
**AfroTools advantages:** the only pan-African (54-country) option, plus remittance-erosion and salary-erosion modes and local-currency output that none of the single-country incumbents offer. That is the defensible niche — but it must be paired with visible sourcing/dating to earn trust.

## 4. SEO audit
- **Title** (was) "Inflation Calculator for Africa | AfroTools" — thin, no differentiator. Strengthened (fix below).
- **Meta description** (was) ~205 chars — over the ~160 truncation point. Trimmed.
- **H1** "Africa Inflation **Calculator**" — single, unique, keyworded. Kept.
- **JSON-LD:** WebApplication (`FinanceApplication` ✓) + WebPage + BreadcrumbList + FAQPage — good coverage, all valid.
  - **FAQPage / visible-FAQ mismatch (defect):** 3 of 6 JSON-LD question names drifted from the visible `.faq` text ("relate"→"apply", "many"→"some", extra "in Africa"), and several answer bodies differed. Google requires FAQ markup to mirror on-page text. Realigned JSON-LD to mirror the visible `.faq` section exactly (fix below).
  - Note: a *separate* `df-faq` block (3 different Qs) is generated/owned elsewhere and is **not** mirrored by JSON-LD — left untouched.
- Canonical + hreflang (en/fr/x-default) present and correct.
- Related-tools SSR block present (do not hand-edit — regenerate via SEO scripts).

## 5. UI/UX & trust
- Strong input→result flow: auto-calc on input (debounced), comma formatting on blur, animated result values, purchasing-power bar, chart, comparison, table. No empty-state confusion.
- **No visible source/"as of" date or "estimate, not official" disclaimer near the calculator/results** — flagged and confirmed. Only the sidebar carries a terse "Source: National statistics bureaus, World Bank. Annual averages." with no year. Added a disclaimer under the calc buttons (fix below).
- Mobile: responsive grid collapses at 768/480px, result grid reflows, table scrolls (`table-wrap` overflow), remittance arrow rotates. Looks sound at 375px (verify live).
- a11y: inputs carry `aria-label`s; FAQ uses `<details>`; mode tabs are real `<button>`s. Reasonable. `escHtml` escapes user AI input (good); AI *reply* is markdown→innerHTML (backend-trusted, shared surface — not touched here).
- Brand: hero uses dark-navy + blue `#0062CC` accents; tabs/buttons already standardized blue. Compliant. No top/left border accent bars on cards (compliant).

## 6. Prioritized fixes
### A. Applied here (this file only)
1. Stronger `<title>`.
2. Meta description trimmed to ≤160 chars.
3. FAQPage JSON-LD realigned to mirror the visible `.faq` questions/answers.
4. Visible source + "as of 2024" + "planning estimate, not official / not financial advice" disclaimer added under the calc buttons.
5. Remittance `currentYear` made dynamic (`new Date().getFullYear()`).

### B. Deferred (shared / out of scope)
- **Rate freshness (shared-data concern):** the 2024 presets should be sourced from a dated, maintained data file (or default to the World Bank fetch) rather than inline constants. No shared file exists yet — logged to `_shared-fixes.md`.
- Consider defaulting/auto-running the World Bank fetch (or caching latest per country server-side) so the first paint shows current data.
- `df-upgrade` / `df-faq` blocks and the related-tools SSR + sitemap are generated surfaces — leave to their generators.

## Fixes applied 2026-07-14
1. `<title>` → "Africa Inflation Calculator — 54 Countries, Live CPI | AfroTools" (64 chars, differentiator + keyword).
2. Meta description trimmed to 156 chars (was ~205, over the truncation point).
3. FAQPage JSON-LD realigned to mirror the visible `.faq` section — 3 question names and 6 answer bodies now match on-page text exactly. All 4 JSON-LD blocks validate (WebApplication/FinanceApplication, WebPage, BreadcrumbList, FAQPage).
4. Visible caveat added under the calc buttons: source ("national statistics bureaus & the World Bank"), "as of 2024" date, Fetch-Live-Rates pointer, and "planning estimates, not official figures or financial advice" disclaimer.
5. Remittance `currentYear` made dynamic (`new Date().getFullYear()`) so results stay correct past 2026.

Deferred (logged to `_shared-fixes.md`): stale inline 2024 preset rates need a dated, maintained data source (or a default World Bank fetch) rather than hardcoded constants.
