# AfroTools — Fixes Applied Log
**Date:** 2026-03-16

---

## VAT Calculator (`tools/vat-calculator/index.html` + `assets/css/vat-calculator.css`)
- **Banner fix**: H1 was invisible (dark text `#0f172a` on dark navy bg). Global CSS `h1 { color: var(--color-text) }` overrode parent `.vat-hero { color: #fff }`. Fixed with `color: #ffffff !important` and `text-transform: none`.
- **Hero upgrade**: Added radial gradient orb `::before`, larger font size, green-accent badge borders
- **Quick-access strip**: 6 popular country buttons below hero (NG, KE, ZA, GH, EG, MA)
- **Country detail card**: Shows standard rate, reduced rate, registration threshold, filing frequency, revenue authority
- **Rate notices**: Ghana composite rate breakdown, country-specific notes in yellow alert
- **Calculation history**: Last 20 calcs saved to localStorage, clickable to re-run, time-ago display
- **Rates search**: Filter the 54-country rates table by country name
- **Copy button**: Copies formatted result text to clipboard
- **Keyboard shortcut**: Enter key triggers calculation
- **Dynamic stats**: Sidebar computes actual average/highest rate from DB
- **Updated**: All references from "50+" to "54" countries
- **Dark mode**: Full dark mode support for all new elements

## Crypto Contrast Fixes (6 files)
- `crypto/contract-scanner/index.html` — Replaced 6 `[data-theme="dark"]` selectors with `@media (prefers-color-scheme: dark)`
- `crypto/address-validator/index.html` — Dark mode overrides for status banners (valid/scam/invalid)
- `crypto/mining-calculator/index.html` — Dark mode overrides for comparison boxes (better/worse)
- `crypto/exchange-ratings/index.html` — Dark mode override for `.tag-yes` color
- `crypto/scam-checker/index.html` — Dark mode overrides for result cards, badges, report success
- `crypto/quiz/index.html` — Replaced 2 `[data-theme="dark"]` blocks with `@media (prefers-color-scheme: dark)`

## CV Builder Fix (`tools/cv-builder/index.html`)
- **Root cause**: `</script>` literal inside a `<script type="text/babel">` block killed HTML parsing — entire React app never rendered
- **Fix**: Escaped closing tag using string concatenation: `'<scr'+'ipt ...><\/scr'+'ipt>'`
- **Secondary fix**: `save-state.js` ES module export was breaking when loaded as regular `<script>`. Converted to `<script type="module">` with proper import.

## Invoice Generator (`tools/invoice-generator/index.html` + `assets/css/invoice-generator.css`)
- **CSS rewrite**: Increased input padding (10px→14px), border-radius (7px→9px), field spacing (14px→18px)
- **Box-sizing**: Added `box-sizing: border-box` to prevent overflow/cutoff
- **Input states**: Hover, focus, disabled, invalid, valid styles
- **Line items table**: Increased padding, horizontal scrolling on mobile
- **Mobile responsive**: Added 600px breakpoint, stacking layout, full-width buttons
- **Event delegation**: Replaced inline `onclick` with proper delegation via `.js-remove-item`
- **ARIA**: Added labels to all inputs, role attributes, aria-live region
- **Form validation**: `validateForm()` checks required fields before PDF export
- **Dark mode**: Extended to cover labels, table cells, buttons, template bar

## Remittance Compare — Full Rewrite (`tools/remittance-compare/index.html`)
- **Critical bug fixed**: Old code subtracted USD fees from NGN amounts (meaningless). Corrected to `(sendAmount - totalFee) * providerRate`
- **Removed**: CashApp (doesn't support Africa transfers)
- **Added**: 9 real providers (Wise, WorldRemit, Remitly, Western Union, MoneyGram, LemFi, Sendwave, Afriex, Chipper Cash)
- **20+ corridors**: USD/GBP/EUR/CAD/AED to 16 African destinations
- **True Cost metric**: Shows total % cost (fees + margin)
- **Sorting**: Best Value, Lowest Fee, Best Rate, Fastest
- **Filtering**: Bank Transfer, Mobile Money, Cash Pickup
- **Charts**: Bar chart showing recipient amounts by provider
- **Full SEO**: JSON-LD schemas, GA4, canonical URL, OG/Twitter meta
