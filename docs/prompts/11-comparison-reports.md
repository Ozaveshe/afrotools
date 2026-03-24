# Prompt 11: Cross-Country Comparison Reports (Pro Feature)

## Context

Read these files first:
- `assets/js/engines/` (all PAYE engine files — ng-paye.js, ke-paye.js, gh-paye.js, etc.)
- `assets/js/lib/currency.js` (currency data for all 54 countries)
- `assets/js/components/pro-gate.js` (pro feature gating)
- `pricing/index.html` (current pro features list)
- `netlify/functions/api-forex.js` (forex rate lookups)
- `assets/css/design-system.css` (design tokens)

Users frequently need to compare tax obligations across countries — diaspora considering relocation, companies expanding to new markets, remote workers choosing tax residency. This is a high-value pro feature.

## Objective

Build a **Country Tax Comparison** tool that lets users input a salary and see a side-by-side breakdown across 2-4 selected African countries. This is a PRO-ONLY feature.

### URL: `/tools/tax-comparison/index.html`

### Features

1. **Input**: Single gross salary amount + currency
2. **Country Selector**: Pick 2-4 countries from the 54 available (searchable dropdown)
3. **Auto-conversion**: Convert the input salary to each country's local currency using live forex rates
4. **Side-by-side Results**: Show for each country:
   - Gross salary (local currency)
   - Income tax amount
   - Social security / pension deductions
   - Net take-home pay
   - Effective tax rate %
5. **Chart**: Grouped bar chart comparing net pay across countries (Chart.js)
6. **Winner Badge**: Highlight which country gives the highest net pay
7. **PDF Export**: Comparison report with all countries (pro-gated)
8. **Share**: Shareable URL with selected countries and salary

### Pro Gating

- Free users can compare 2 countries
- Pro users can compare up to 4 countries
- Show upsell CTA when free user tries to add 3rd country

## Constraints

- PAYE engines are pure functions: `calcTax(grossAnnual)` → `{ tax, bands[], deductions }`. Import them dynamically based on selected countries.
- Use `<script>` tag injection for engine loading (no ES modules): `const script = document.createElement('script'); script.src = '/assets/js/engines/${code}-paye.js'`
- Forex conversion via `/api/forex?base=USD&target=${currency}` endpoint
- Follow design system: use `.calc-card`, `.result-hero`, `.breakdown-card` patterns
- Chart.js loaded from jsdelivr CDN (already in use on other pages)
- PDF export follows existing report standard from PLATFORM_STANDARDS.md
- URL state (from Prompt 09): `?g=500000&c=USD&countries=NG,KE,GH,ZA`
- Mobile responsive: side-by-side becomes stacked cards on `< 768px`
- Add to tool-registry.js with `category: 'financial'`, `tier: 'pro'`, `status: 'live'`

## Implementation Steps

1. Create `tools/tax-comparison/index.html`:
   - Standard AfroTools page structure (navbar, breadcrumb, footer)
   - Hero section: "Compare Your Tax Across Africa"
   - Input section: salary input + currency selector + country multi-select
   - Results section: grid of comparison cards
   - Chart section: grouped bar chart canvas
   - Pro gate: upsell banner between 2nd and 3rd country card
2. Create `tools/tax-comparison/comparison.js`:
   - Country selector with search (reuse or create simple searchable multi-select)
   - Dynamic engine loading: load only selected countries' engines
   - Forex conversion for salary normalization
   - Render comparison cards with standardized data format
   - Chart.js grouped bar chart
   - URL state encoding/decoding
   - PDF generation
3. Create `tools/tax-comparison/comparison.css`:
   - Comparison grid layout
   - Winner badge styling
   - Responsive breakpoints
4. Add Schema.org structured data (WebApplication type)
5. Add OG image and meta tags
6. Add to `tool-registry.js` AFRO_TOOLS array
7. Add to navigation/category pages
8. Add redirect if needed in `_redirects`
9. Run `npm run minify` and `npm run sitemap`

## Verification

- Navigate to `/tools/tax-comparison/`
- Enter $50,000 USD salary
- Select Nigeria + Kenya → see side-by-side comparison
- Try adding 3rd country as free user → pro upsell should appear
- Login as pro → add Ghana + South Africa → 4-country comparison renders
- Chart should show grouped bars for all countries
- Click PDF → email gate → PDF generates with comparison table
- Share URL → recipient sees same comparison (URL state working)
- Mobile: cards stack vertically, chart resizes
