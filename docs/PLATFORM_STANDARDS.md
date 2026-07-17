# AfroTools Platform Standards
## Version 1.0 — March 2026

---

## 1. Netlify Form Schema

Every tool uses exactly two forms. Field names are canonical and immutable.

### 1a. `pdf-leads` — PDF download lead capture
```
form-name    = "pdf-leads"          (hidden, always present)
email        = user@email.com       (required, email input)
country      = "Nigeria"            (hidden, full country name — e.g. "Nigeria", "Kenya")
country_code = "NG"                 (hidden, ISO 3166-1 alpha-2)
tool         = "paye"               (hidden, tool type slug — "paye", "vat", "mortgage")
tool_id      = "ng-salary-tax"      (hidden, full tool page slug)
gross_salary = 3000000              (hidden, populated on submit — annual gross in local currency)
currency     = "NGN"                (hidden, ISO 4217 currency code)
tax_regime   = "pita"               (hidden, optional — only for tools with regime toggle)
```

### 1b. `newsletter` — homepage + footer email list
```
form-name    = "newsletter"         (hidden, always present)
email        = user@email.com       (required, email input)
source       = "homepage"           (hidden, where form appears — "homepage", "footer", "tool-page")
```

---

## 2. JavaScript Naming Conventions

### Global state — always these exact names, no country prefixes
```js
let RESULT = null;          // current calculation result object
let PERIOD = 'monthly';     // 'monthly' | 'annual'
let CHART = null;           // Chart.js instance
let CHAT_HISTORY = [];      // AI advisor message history (Tier 1 tools only)
```

### Function names — canonical across all tools
```js
// Calculation
function calculate()        // main calculation, populates RESULT, updates DOM
function calcTax(taxable)   // returns { tax, bands[] } — pure, no side effects

// UI
function syncSlider(val)    // slider → input sync + recalculate
function syncInput(val)     // input → slider sync + recalculate
function setPeriod(p, btn)  // toggle monthly/annual

// PDF
function openPdfModal()     // show modal, reset to form state
function closePdfModal()    // hide modal
async function submitPdf(e) // handle form submit → Netlify → generatePdf()
function generatePdf()      // build HTML report, open new tab, trigger print

// Share
function shareResult()      // native share API → clipboard fallback

// AI (Tier 1 only)
async function runAI()      // call /.netlify/functions/ai-advisor
async function sendChat()   // handle chat follow-up message
```

### Utility functions — identical across all tools
```js
// Currency formatting — localised per country
const fmt = n => '[CURRENCY] ' + Math.round(Math.abs(n)).toLocaleString('[LOCALE]');

// Smart percentage — no trailing zeros
const pct = r => {
  const v = r * 100;
  return (v % 1 === 0 ? v.toFixed(0) : parseFloat(v.toFixed(2)).toString()) + '%';
};

// PDF reference number
const refNo = () => 'AFT-[ISO2]-[TOOL]-' + Date.now().toString(36).toUpperCase().slice(-6);
```

---

## 3. Meta Tag Standard — Required on Every Tool Page

```html
<!-- Primary -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Country] [Tool Name] Calculator [Tax Year] — [Authority] | AfroTools</title>
<meta name="description" content="[150 chars max. Lead with the accuracy differentiator.]">
<link rel="canonical" href="https://afrotools.com/[country-slug]/[tool-id]">
<meta name="robots" content="index, follow">
<meta name="author" content="AfroTools">

<!-- Open Graph -->
<meta property="og:type"        content="website">
<meta property="og:url"         content="https://afrotools.com/[country-slug]/[tool-id]">
<meta property="og:title"       content="[Country] [Tool] Calculator [Year] | AfroTools">
<meta property="og:description" content="[Same as meta description]">
<meta property="og:image"       content="https://afrotools.com/assets/img/og-[tool-id].png">
<meta property="og:locale"      content="en_[ISO2]">
<meta property="og:site_name"   content="AfroTools">

<!-- Twitter / X -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:site"        content="@afrotools">
<meta name="twitter:title"       content="[Country] [Tool] Calculator [Year] | AfroTools">
<meta name="twitter:description" content="[Same as meta description]">
<meta name="twitter:image"       content="https://afrotools.com/assets/img/og-[tool-id].png">
```

---

## 4. Schema.org Standard — Required on Every Tool Page

Three JSON-LD blocks always present:

### 4a. WebApplication
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "[Country] [Tool] Calculator [Year]",
  "url": "https://afrotools.com/[country-slug]/[tool-id]",
  "description": "[Description]",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "inLanguage": "en",
  "dateModified": "[YYYY-MM-DD of last rate update]",
  "isAccessibleForFree": true,
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "[ISO4217]" },
  "provider": { "@type": "Organization", "name": "AfroTools", "url": "https://afrotools.com" }
}
```

### 4b. BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "AfroTools", "item": "https://afrotools.com" },
    { "@type": "ListItem", "position": 2, "name": "[Country]", "item": "https://afrotools.com/[country-slug]" },
    { "@type": "ListItem", "position": 3, "name": "[Tool Name]", "item": "https://afrotools.com/[country-slug]/[tool-id]" }
  ]
}
```

### 4c. FAQPage — minimum 3 questions, country-specific
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
```

---

## 5. PDF Report Standard

### Reference number format
```
AFT-[ISO2]-[TOOL]-[6-char base36 timestamp]
Examples: AFT-NG-PAYE-X7K2M1 | AFT-KE-PAYE-R3P9Q2 | AFT-GH-VAT-T1L8N4
```

### 5-section structure (all PAYE tools)
1. Full PAYE Computation
2. Band-by-Band Tax
3. Net Pay Summary
4. Employer Costs
5. Legal Basis & Sources

### PDF header colour
- PAYE tools: `#1a2420` (dark forest) header
- VAT tools: `#1a1a2e` (dark navy) header
- Mortgage tools: `#1a1a2e` header

---

## 6. Error Handling Standard

```js
// All async operations follow this pattern
try {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // handle success
} catch (err) {
  console.error('[AfroTools][tool-id]', err.message);
  // show user-facing fallback — never leave UI broken
}
```

---

## 7. URL & File Structure
```
/[country-slug]/[country-code]-[tool-type].html
/nigeria/ng-salary-tax.html   → afrotools.com/nigeria/ng-salary-tax
/kenya/ke-paye.html           → afrotools.com/kenya/ke-paye
/ghana/gh-paye.html           → afrotools.com/ghana/gh-paye
/south-africa/sa-income-tax.html
/egypt/eg-income-tax.html
```

---

## 8. CSS Class Naming
Prefix all tool-specific classes with tool abbreviation:
```
.paye-[element]   — PAYE tool classes
.vat-[element]    — VAT tool classes  
Shared/layout:    no prefix (e.g. .calc-card, .result-hero, .breakdown-card)
```

---
*This document is the single source of truth for all AfroTools tool development.*
*Update dateModified and version when rates or standards change.*
