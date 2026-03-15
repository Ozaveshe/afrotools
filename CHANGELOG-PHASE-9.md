# CHANGELOG - Phase 9: Analytics, Monitoring & Growth

**Date:** March 2026
**Goal:** Know exactly how the platform is being used and where to invest.

---

## New Files Created

### `/admin/dashboard.html`
Internal admin dashboard (noindex, nofollow):
- **Registry stats**: total tools, live count, pipeline count, categories, estimated revenue
- **Tools by Phase**: table showing distribution across LIVE, Phase 1-5
- **Tools by Category**: table with live/pipeline/total counts per category
- **Quick Links**: GA4, Search Console, Netlify, Semrush, GitHub, Style Guide
- **Run Audit**: client-side registry validator checking duplicate IDs, missing fields, empty hrefs, short descriptions, country assignments
- Uses `onRegistryReady` pattern for guaranteed rendering

### `/scripts/validate-registry.js`
Node.js registry validation script:
- **Duplicate ID detection** — found 14 duplicate IDs in Phase 5 tool entries
- **Required field check** — id, name, href, category, status, countries
- **File existence check** — verifies live tool hrefs resolve to actual files
- **Description length check** — live tools need 20+ char descriptions
- **Category validation** — checks against AFRO_CATEGORIES definitions
- Run: `node scripts/validate-registry.js`
- Exit code 1 if errors found

---

## Files Updated

### `/scripts/generate-sitemap.js`
- Fixed `CustomEvent` stub for Node.js execution environment

---

## Registry Audit Results

The validator found real issues:

**14 Duplicate IDs (in Phase 5 section):**
calorie-counter, malaria-risk, student-loan, rental-yield, vat-calculator,
color-contrast, api-tester, swahili-translator, yoruba-translator,
igbo-translator, zulu-translator, amharic-translator, flyer-maker, borehole-cost

**2 Unknown Categories:**
- market-stall-profit → "agriculture" (not in AFRO_CATEGORIES)
- agric-profit → "agriculture" (not in AFRO_CATEGORIES)

These are non-blocking warnings for planned tools (Phase 5). Live tools pass all checks.

---

## Existing Analytics State

### Already implemented ✅
- `lib/analytics.js` — GA4 custom event tracking (Phase 2)
- `trackCalculation()`, `trackPDFDownload()`, `trackAIQuery()`, `trackToolView()`, `trackShare()`, etc.
- Event queue with flush mechanism
- Salary bucketing for privacy

### Footer newsletter ✅
- `<form name="newsletter" data-netlify="true">` already in footer component
- Netlify form submission collects emails (zero config)
