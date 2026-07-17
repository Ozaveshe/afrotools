# Multi-Country Tool Expansion — 5 Tools x 54 Countries = 270 Pages

## Architecture

Each tool follows the **hub-and-spoke** pattern already used by `car-insurance`, `health-contribution`, `motor-third-party`, and `workers-comp`:

```
/tools/{tool-name}/index.html          ← Hub page (ALREADY EXISTS — do not recreate)
/tools/{tool-name}/{country-slug}.html  ← 54 country pages (TO BE CREATED)
/engines/{tool-name}-engine.js          ← Shared calculation engine
/data/{category}/{tool-name}-data.js    ← Country data index
```

**Hub page** = "Select Your Country" grid → links to 54 country pages.
**Country page** = Full interactive tool with country-specific data, SEO, schema.org markup.

---

## 54 Country Slugs (canonical)

```
algeria, angola, benin, botswana, burkina-faso, burundi, cabo-verde, cameroon,
central-african-republic, chad, comoros, congo-brazzaville, cote-d-ivoire,
djibouti, dr-congo, egypt, equatorial-guinea, eritrea, eswatini, ethiopia,
gabon, gambia, ghana, guinea, guinea-bissau, kenya, lesotho, liberia, libya,
madagascar, malawi, mali, mauritania, mauritius, morocco, mozambique, namibia,
niger, nigeria, rwanda, sao-tome-and-principe, senegal, seychelles,
sierra-leone, somalia, south-africa, south-sudan, sudan, tanzania, togo,
tunisia, uganda, zambia, zimbabwe
```

---

## Country Page HTML Pattern (template reference)

Every country page follows this exact structure (from `/tools/car-insurance/nigeria.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{Country} {Tool Name} — {Subtitle} | AfroTools</title>
<meta name="description" content="{Country-specific meta description}">
<link rel="canonical" href="https://afrotools.com/tools/{tool-slug}/{country-slug}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="https://afrotools.com/tools/{tool-slug}/{country-slug}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{WebApplication schema}</script>
<script type="application/ld+json">{BreadcrumbList: Home > Category > Hub > Country}</script>
<!-- fonts, CSS, navbar/footer scripts -->
</head>
<body>
<afro-navbar theme="dark" active="{category}"></afro-navbar>
<!-- Hero with breadcrumb, flag emoji, h1, subtitle -->
<!-- Main tool UI (form inputs, results area) -->
<!-- SEO section with country-specific content -->
<afro-footer></afro-footer>
<!-- Data script + Engine script -->
<script>
!function(){
"use strict";
var CC='{ISO_CODE}';
// Wire up form → engine → results
}();
</script>
</body>
</html>
```

---

## PROMPT 1: Employment Contract Generator (54 country pages)

### Context

The hub page already exists at `/tools/employment-contract/index.html`. It is a pan-African employment contract builder where users select a country, fill in employer/employee details, and generate a contract preview with PDF export. The hub currently handles all countries in a single dropdown.

**Task:** Create 54 individual country pages at `/tools/employment-contract/{country-slug}.html` that extend the hub. Each country page is a standalone employment contract generator pre-configured for that country's specific labour law.

### What each country page must include

1. **Form inputs:**
   - Employer name, address, registration number
   - Employee name, ID/passport number, job title, department
   - Start date, contract type (permanent / fixed-term / probationary)
   - Gross salary (in local currency), payment frequency
   - Working hours per week
   - Optional clauses checkboxes (non-compete, confidentiality, IP assignment, relocation, housing allowance)

2. **Country-specific legal data (hardcoded per page):**
   - Governing labour law name and year (e.g., Nigeria: Labour Act Cap L1 LFN 2004; Kenya: Employment Act 2007; South Africa: BCEA 1997)
   - Minimum wage (local currency, per month/hour)
   - Maximum probation period (months)
   - Standard working hours per week
   - Overtime rate multiplier
   - Minimum annual leave days
   - Maternity leave (weeks, paid/unpaid)
   - Paternity leave (if applicable)
   - Notice period by tenure (e.g., 1 week <6 months, 1 month 6-24 months, etc.)
   - Mandatory deductions (pension, social security, health insurance — name + employee rate + employer rate)
   - Severance/gratuity formula
   - Dispute resolution body (e.g., NICN for Nigeria, Employment & Labour Relations Court for Kenya)

3. **Generated contract preview:**
   - Formatted legal document with numbered clauses
   - Preamble citing the governing law
   - Clauses: Commencement, Duties, Remuneration, Deductions, Working Hours, Leave, Termination & Notice, Confidentiality, Governing Law, Signatures
   - All values populated from form + country data
   - Print-friendly CSS

4. **SEO section:**
   - H2: "{Country} Employment Contract — What the Law Requires"
   - 2-3 paragraphs about that country's labour law highlights
   - Name of the relevant ministry/authority
   - Disclaimer: "Not legal advice. Consult a qualified labour lawyer."

5. **Technical:**
   - Load shared engine: `/engines/employment-contract-engine.js`
   - Load country data: `/data/legal/employment-contract-data.js`
   - Set `var CC='{ISO_CODE}';` for country context
   - Use CSS from hub page (inline styles matching the hub's `:root` vars)
   - Breadcrumb: Home > Legal & Compliance > Employment Contract Builder > {Country}
   - Schema.org: WebApplication + BreadcrumbList

### Hub page update

Add a "Select Your Country" grid section to the existing `/tools/employment-contract/index.html` with 54 country cards linking to `/tools/employment-contract/{country-slug}`. Follow the exact grid pattern from `/tools/electricity-tariff/index.html`.

---

## PROMPT 2: TIN Registration Guide (54 country pages)

### Context

The hub page already exists at `/tools/tin-guide/index.html`. It currently covers 16 countries via a dropdown with inline data. It uses `legal.css` styles with the `leg-` prefix.

**Task:** Create 54 individual country pages at `/tools/tin-guide/{country-slug}.html`. Each is a comprehensive, standalone TIN registration guide for that country.

### What each country page must include

1. **Quick-reference info cards (top of page):**
   - Tax authority name + abbreviation (e.g., FIRS, KRA, GRA, SARS, ETA)
   - Tax authority website URL
   - TIN format (e.g., "10-digit numeric" for Nigeria, "P0xxxxxxxxX" for Kenya PIN)
   - Cost (free or amount)
   - Processing time (e.g., "Instant online" or "3-5 business days")
   - TIN name in local terminology (e.g., "TIN" in Nigeria, "KRA PIN" in Kenya, "NIF" in francophone countries, "Tax Reference Number" in South Africa)

2. **Required documents section — split by entity type:**
   - Individual: National ID/passport, proof of address, passport photo, etc.
   - Business/Corporate: Certificate of incorporation, Memorandum of association, Director IDs, registered address proof, etc.
   - Non-resident: Passport, letter of appointment/contract, etc.

3. **Step-by-step registration process:**
   - Numbered steps list (use the existing `tin-steps-list` CSS class)
   - Online vs in-person paths
   - Direct link to the online registration portal (if available)
   - Processing time per step

4. **Verification section:**
   - How to verify a TIN (online portal, USSD code, SMS)
   - What to do if TIN is lost

5. **Penalties section:**
   - Penalty for not registering
   - Penalty for filing without TIN

6. **Related registrations callout:**
   - Link to VAT registration tool for that country (if exists)
   - Link to business registration tool
   - Link to social security registration

7. **SEO section:**
   - H2: "TIN Registration in {Country} — Complete Guide"
   - Country-specific paragraphs about tax compliance
   - Reference to relevant tax act/law
   - Disclaimer

8. **Technical:**
   - Use `legal.css` + `leg-` prefix classes (matching hub)
   - Breadcrumb: Home > Legal & Compliance > TIN Registration Guide > {Country}
   - Schema.org: WebPage + BreadcrumbList + FAQPage (for common questions)
   - `<afro-navbar theme="dark" active="legal">`

### Hub page update

Expand the dropdown from 16 to 54 countries. Add a "Select Your Country" grid below the dropdown (same pattern as electricity-tariff hub) linking to all 54 country pages.

---

## PROMPT 3: Visa Requirement Checker (54 country pages)

### Context

The hub page already exists at `/tools/visa-checker/index.html`. It is a "From → To" visa requirement checker for intra-African travel. It uses a two-column layout with selector cards.

**Task:** Create 54 **destination** country pages at `/tools/visa-checker/{country-slug}.html`. Each page answers: "Do I need a visa to visit {Country}?" from any of the other 53 African countries.

### What each country page must include

1. **Destination country hero:**
   - Flag emoji + "{Country} Visa Requirements for African Travelers"
   - Key stats: Visa-free countries count, Visa-on-arrival count, E-visa count, Visa required count

2. **Interactive "Check Your Nationality" section:**
   - Dropdown: "I am a citizen of..." (53 other African countries)
   - On select → show result card:
     - Status badge: VISA FREE (green) / VISA ON ARRIVAL (blue) / E-VISA (amber) / VISA REQUIRED (red)
     - Duration of stay allowed (e.g., "90 days")
     - Applicable treaty/agreement (e.g., "ECOWAS Protocol", "EAC Common Market", "Bilateral agreement")
     - Required documents
     - Estimated visa fee (if applicable)
     - Processing time
     - Link to apply (embassy or e-visa portal)

3. **Full visa matrix table:**
   - All 53 source countries listed
   - Columns: Country | Status | Duration | Treaty | Fee
   - Color-coded status badges
   - Sortable/filterable

4. **General entry requirements section:**
   - Passport validity requirement (e.g., "6 months beyond stay")
   - Yellow fever certificate requirement
   - COVID requirements (if any still active)
   - Customs declaration
   - Currency import/export limits
   - Prohibited items

5. **Useful info section:**
   - Capital city, time zone
   - Official language(s)
   - Currency + current exchange rate (link to currency converter)
   - Emergency numbers (police, ambulance, fire)
   - Nearest embassies for countries requiring visa

6. **SEO section:**
   - H2: "Traveling to {Country} — Visa Requirements for African Citizens"
   - Paragraphs about that country's visa policy, AU visa openness ranking
   - Mention free movement protocols the country participates in
   - Disclaimer

7. **Technical:**
   - Load visa data: `/data/travel/visa-matrix.js`
   - Load engine: `/engines/visa-checker-engine.js`
   - Set `var DEST='{ISO_CODE}';`
   - Breadcrumb: Home > Government & Civic > Visa Requirement Checker > {Country}
   - Schema.org: WebApplication + BreadcrumbList
   - `<afro-navbar theme="dark" active="government">`

### Hub page update

Add a "Select Your Destination" country grid linking to all 54 country pages. Keep the existing "From → To" checker as the primary UI on the hub.

---

## PROMPT 4: Tenancy Agreement Generator (54 country pages)

### Context

The hub page already exists at `/tools/tenancy-agreement/index.html`. It is a tenancy/rental agreement generator where users fill in landlord/tenant details and generate a legal document. The hub currently handles 8 countries via dropdown.

**Task:** Create 54 individual country pages at `/tools/tenancy-agreement/{country-slug}.html`. Each generates a legally structured tenancy agreement compliant with that country's rental/tenancy law.

### What each country page must include

1. **Form inputs:**
   - **Property:** Address, property type (apartment/house/commercial/land), furnished (yes/no), number of bedrooms
   - **Landlord:** Full name, ID number, address, phone, agent name (optional)
   - **Tenant:** Full name, ID number, address, phone, occupation
   - **Terms:** Rent amount (local currency), payment frequency (monthly/quarterly/annually), security deposit amount, lease start date, lease duration, rent review clause (annual increase %)
   - **Utilities:** Who pays for electricity, water, waste, internet (landlord/tenant checkboxes)
   - **Optional clauses:** Subletting allowed, pets allowed, renovation consent, right of first refusal, diplomatic/break clause

2. **Country-specific legal data (hardcoded per page):**
   - Governing tenancy law name and year (e.g., Nigeria Lagos: Tenancy Law of Lagos State 2011; Kenya: Rent Restriction Act Cap 296; South Africa: Rental Housing Act 50 of 1999; Egypt: Civil Code + Rent Law 4/1996)
   - Maximum security deposit (e.g., 1 month in Kenya, 2 months in South Africa, varies in Nigeria by state)
   - Minimum notice period for termination (by landlord and by tenant)
   - Rent increase cap/rules (if regulated)
   - Tenant protection rights (e.g., no eviction without court order)
   - Stamp duty / registration requirement (yes/no, rate)
   - Dispute resolution body (e.g., Rent Tribunal, Magistrate Court)
   - Local currency code and symbol
   - Language of legal proceedings

3. **Generated agreement preview:**
   - Formal document with numbered clauses
   - Preamble citing governing law
   - Clauses: Parties, Property Description, Term, Rent & Payment, Security Deposit, Utilities, Maintenance & Repairs, Use of Premises, Landlord Access, Termination & Notice, Dispute Resolution, Governing Law, Signatures & Witnesses
   - All values populated from form + country data
   - Print-friendly CSS (hide UI, show document only)

4. **Action buttons:**
   - Download as PDF
   - Print
   - Copy to clipboard
   - Share

5. **SEO section:**
   - H2: "{Country} Tenancy Agreement — Legal Requirements"
   - Key tenancy rights and obligations
   - Reference to specific law
   - Disclaimer: "This is a template. Consult a qualified property lawyer."

6. **Technical:**
   - Load engine: `/engines/tenancy-agreement-engine.js`
   - Load data: `/data/legal/tenancy-data.js`
   - Set `var CC='{ISO_CODE}';`
   - Reuse CSS pattern from hub page (`:root{--blue:#1d4ed8}` etc.)
   - Breadcrumb: Home > Legal & Compliance > Tenancy Agreement Generator > {Country}
   - Schema.org: WebApplication + BreadcrumbList

### Hub page update

Expand the country dropdown from 8 to 54. Add a "Select Your Country" grid linking to all 54 country pages.

---

## PROMPT 5: Business License & Permit Directory (54 country pages)

### Context

The hub page already exists at `/tools/business-license/index.html`. It covers 12 industries across 16 countries via two dropdowns. Uses `legal.css` with `leg-` prefix classes and a `lic-` grid for license cards.

**Task:** Create 54 individual country pages at `/tools/business-license/{country-slug}.html`. Each is a comprehensive, interactive directory of all business licenses and permits required in that country, organized by industry.

### What each country page must include

1. **Industry selector:**
   - Dropdown or tab bar with 12+ industries: Retail/Trading, Food & Beverage, Construction, Healthcare/Pharmacy, Financial Services, Education, Manufacturing, Transport/Logistics, Technology/Telecom, Mining & Extractives, Agriculture, Hotel/Hospitality, Real Estate, Import/Export, Creative/Media

2. **For each industry, show a grid of license cards (`lic-item` class):**
   - **License name** (e.g., "Food Handler's Certificate", "NAFDAC Registration", "Environmental Impact Assessment")
   - **Issuing authority** (full name + abbreviation)
   - **Badge:** Mandatory (red) / Conditional (amber) / Optional (green)
   - **Cost range** (local currency)
   - **Validity/renewal period** (e.g., "Annual", "3 years", "One-time")
   - **Processing time** (e.g., "2-4 weeks")
   - **Brief description** (1-2 sentences on what it covers)
   - **Link to apply** (government portal URL if available)

3. **Universal licenses section (applies to ALL industries):**
   - Business registration certificate (link to business-registration tool)
   - TIN registration (link to tin-guide tool)
   - VAT registration (if above threshold — link to VAT tool)
   - Local government trade license
   - Fire safety certificate
   - Environmental permit (if applicable)

4. **Compliance timeline visualization:**
   - Recommended order for obtaining licenses
   - Which can be applied for in parallel vs sequentially
   - Total estimated time from start to fully licensed

5. **Penalties section:**
   - Penalties for operating without required licenses
   - Inspection/enforcement agencies

6. **SEO section:**
   - H2: "Business Licenses & Permits in {Country} — Complete Guide"
   - Paragraphs about the regulatory environment
   - Ease of doing business ranking
   - Key regulatory bodies
   - Disclaimer

7. **Technical:**
   - Load data: `/data/legal/business-license-data.js`
   - Load engine: `/engines/business-license-engine.js`
   - Set `var CC='{ISO_CODE}';`
   - Use `legal.css` + `leg-` and `lic-` prefix classes
   - Breadcrumb: Home > Legal & Compliance > Business License Requirements > {Country}
   - Schema.org: WebApplication + BreadcrumbList
   - `<afro-navbar theme="dark" active="legal">`

### Hub page update

Expand from 16 to 54 countries in the dropdown. Add a "Select Your Country" grid linking to all 54 country pages. Keep the industry selector on the hub for quick lookups.

---

## Execution Order (recommended)

| Phase | Tool | Pages | Priority | Why first |
|-------|------|-------|----------|-----------|
| 1 | TIN Registration Guide | 54 | Highest | Simplest (reference content, no calculation engine needed). Hub already has 16 countries of data to pattern from. |
| 2 | Business License Directory | 54 | High | Also reference content. Hub has 16 countries + 12 industries of data. |
| 3 | Visa Requirement Checker | 54 | High | Data-driven lookup. Visa matrix data can be sourced from AU/IATA. |
| 4 | Employment Contract Generator | 54 | Medium | Document generator. Requires per-country labour law research. |
| 5 | Tenancy Agreement Generator | 54 | Medium | Document generator. Requires per-country tenancy law research. |

**Total: 270 new country pages**

---

## Data Files to Create

| File | Purpose |
|------|---------|
| `/data/legal/employment-contract-data.js` | Labour law data for 54 countries |
| `/data/legal/tin-guide-data.js` | Tax authority + registration data for 54 countries |
| `/data/travel/visa-matrix.js` | 54x54 visa requirement matrix |
| `/data/legal/tenancy-data.js` | Tenancy/rental law data for 54 countries |
| `/data/legal/business-license-data.js` | License requirements by country + industry |

## Engines to Create

| File | Purpose |
|------|---------|
| `/engines/employment-contract-engine.js` | Generate contract document from form + country data |
| `/engines/tin-guide-engine.js` | Render TIN guide from country data (may be simple, mostly display) |
| `/engines/visa-checker-engine.js` | Lookup visa status from matrix by origin + destination |
| `/engines/tenancy-agreement-engine.js` | Generate tenancy agreement from form + country data |
| `/engines/business-license-engine.js` | Filter + display licenses by country + industry |

## Tool Registry Entries to Add

Each of the 270 country pages needs an entry in `tool-registry.js` following:

```javascript
{
  id: '{cc}-{tool-type}',
  name: '{Country} {Tool Name}',
  icon: '{flag_emoji}',
  desc: '{Country-specific description}',
  href: '/tools/{tool-slug}/{country-slug}',
  category: 'legal',      // or 'government' for visa-checker
  tier: 'T2',
  status: 'new',
  phase: 'LIVE',
  countries: ['{CC}'],
  revenue: 'Premium PDF',
  estTraffic: 1500,
  estRevenue: 30,
  priority: 60
}
```
