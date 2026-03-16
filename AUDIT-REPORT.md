# AfroTools Full Site Audit Report
**Date:** 2026-03-16 | **Audited by:** Claude (Senior Software Engineer)

---

## PHASE 1 — FULL SITE INVENTORY

### Totals
- **580 HTML files** across the repo
- **196 unique tools** in the tool registry
- **470 URLs** in sitemap.xml
- **All 196 registry hrefs resolve** to real HTML files — zero broken registry links

### Missing Files
| Item | Issue |
|------|-------|
| `/car/index.html` | Sitemap references it but file does not exist (Central African Republic landing page) |

### Missing from Sitemap (exist but not indexed)
- 16 crypto tool pages + 5 crypto blog posts
- `/about/`, `/contact/`, `/faq/` — high-priority pages
- `/api/`, `/api/docs/`, `/api/pricing.html` — developer pages
- `/privacy/`, `/terms/` — trust signal pages
- `/categories/`, `/advertise/`

### Orphan HTML Files (exist but not in registry)
- 7 property tool pages: `first-home-buyer`, `home-loan-eligibility`, `home-renovation-cost`, `mortgage-affordability`, `property-roi`, `property-transfer-cost`, `rent-vs-buy`

---

## PHASE 2 — PAGE-BY-PAGE QUALITY AUDIT (579 pages)

### Critical Finding
**`/assets/img/og-default.png` does not exist** — referenced by 358 pages for og:image. Social media sharing previews are broken site-wide.

### Meta Tags
- All tool pages have unique `<title>`, meta description, og:title, canonical URL ✅
- Country landing pages use templated meta descriptions (50 near-identical descriptions)

### Structured Data (JSON-LD)
- All tool pages have WebApplication + BreadcrumbList schema ✅
- FAQPage schema on most tool pages ✅
- No fake ratings or fake review counts found ✅

### H1 Tags
- Every page has exactly one H1 ✅

### GA4 Tracking
- All pages include `G-D859CGF391` ✅

### Navbar/Footer
- All pages load `<afro-navbar>` and `<afro-footer>` ✅

### Viewport Meta
- All pages have viewport meta tag ✅

### Images
- Most images are SVG or dynamically generated (JS)
- `og-default.png` is the only missing image file

---

## PHASE 3 — CRYPTO SECTION CONTRAST FIXES

### Files Fixed (6)
| File | Issues | Fix Applied |
|------|--------|-------------|
| `crypto/contract-scanner/index.html` | 6 `[data-theme="dark"]` selectors never matched (site uses prefers-color-scheme) | Replaced all with `@media (prefers-color-scheme: dark)` blocks |
| `crypto/address-validator/index.html` | `.status-banner` text colors too dark on dark bg | Added dark mode overrides for valid/scam/invalid banners |
| `crypto/mining-calculator/index.html` | `.comparison-box` dark green/red text unreadable | Added dark mode overrides for better/worse states |
| `crypto/exchange-ratings/index.html` | `.tag-yes` dark green unreadable | Changed to `#5ddb9e` in dark mode |
| `crypto/scam-checker/index.html` | Multiple result/badge elements too dark | Added dark mode overrides for safe/danger results, badges, report success |
| `crypto/quiz/index.html` | 2 `[data-theme="dark"]` blocks never applied | Replaced with `@media (prefers-color-scheme: dark)` |

### Files Confirmed Clean (10)
crypto/index.html, crypto/prices, crypto/p2p-rates, crypto/stablecoins, crypto/remittance, crypto/arbitrage, crypto/dca-calculator, crypto/tax-calculator, crypto/portfolio, crypto/profit-calculator — all use CSS variables that properly adapt.

---

## PHASE 4 — CSS & DESIGN CONSISTENCY

### Design Token System
- Primary: `#007AFF` (blue) — NOT the green palette (`#5ddb9e`) as originally expected
- Dark BG: `#0A1628`, Light BG: `#F8FAFD`, Body text: `#0f172a`

### Hardcoded Colors Violating Tokens
| File | Color | Should Use |
|------|-------|-----------|
| `auth-modal.css` | `#f5f5f5` | `var(--color-bg-subtle)` |
| `currency-converter.css` | `#444` | `var(--color-text)` |
| `vat-calculator.css` | `#444` | `var(--color-text)` |
| Multiple PAYE files | `#1a1a2e` | `var(--color-bg-dark)` |
| `api-docs.css` | `#1a1a2e` | `var(--color-text)` |

### Font Loading — CRITICAL
- **Only 11 of 342 pages load Instrument Serif** (the heading font)
- 331 pages fall back to Georgia for headings
- **DM Sans** loaded on ~332 pages ✅

### Border-Radius Inconsistencies
- Off-scale values found: 3px, 4px, 5px, 7px, 14px, 20px
- Token scale: 6px, 10px, 16px, 24px, 100px

---

## PHASE 5 — PAYE CALCULATION LOGIC

### Summary
| Country | Frontend Brackets | Deductions | Netlify API Sync |
|---------|------------------|------------|-----------------|
| **Nigeria** | PITA ✅ | CRA ✅, Pension ✅ | **BROKEN** — CRA formula wrong, NTA bands differ |
| **Kenya** | ✅ | SHIF ✅, Personal Relief ✅ | **BROKEN** — Band 3 off by 111, NSSF cap differs |
| **South Africa** | ✅ | All ✅ | N/A |
| **Ghana** | 30% band off by GHS 6,240 | SSNIT ✅ | N/A |
| **Egypt** | Bands 4-6 differ from reference | Exemption + NOSI ✅ | N/A |
| **Tanzania** | Bands 3-4 each TZS 10K short | NSSF ✅ | N/A |

### Critical Bugs
1. **Netlify `ng-paye.js` line 42**: CRA formula missing `Math.max` and 20% component
2. **Netlify `ng-paye.js` line 6**: NTA bands completely different from frontend
3. **Netlify `ke-paye.js` line 4**: Third band width off by 111
4. **Tanzania `tz-paye.js`**: 30% threshold 20K too low
5. **Ghana `gh-paye.js`**: 30% band 6,240 GHS short

---

## PHASE 6 — PERFORMANCE & SEO

### Sitemap
- 470 URLs indexed
- Missing: `/about/`, `/contact/`, `/faq/`, `/api/`, crypto tools/blog

### robots.txt
- Dashboard blocked ✅
- `.netlify/` blocked ✅
- **Missing**: `/admin/` not blocked

### Performance Issues
| Issue | Impact | Pages Affected |
|-------|--------|---------------|
| Chart.js loaded eagerly without `defer` | Render-blocking | 110+ PAYE/VAT pages |
| Only 7 pages use `loading="lazy"` on images | CLS risk | 330+ pages |
| Instrument Serif not loaded on 97% of pages | Visual inconsistency | 331 pages |

### Duplicate Content
- 50 country landing pages use near-identical meta descriptions (template pattern)
