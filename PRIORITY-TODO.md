# AfroTools — Priority TODO (Top 20)
**Ranked by severity and user impact**

---

### 🔴 CRITICAL (Fix immediately)

1. **Missing og-default.png** — 358 pages reference `/assets/img/og-default.png` but file doesn't exist. Social media previews broken site-wide.
   - **Action**: Create a 1200x630 OG image with AfroTools branding

2. **Netlify Nigeria PAYE CRA bug** — `netlify/functions/_engines/ng-paye.js` line 42: CRA formula uses `200000 + gross * 0.01` instead of `Math.max(200000, gross * 0.01) + gross * 0.20`. Produces wrong tax for all Nigerian PAYE API users.
   - **File**: `netlify/functions/_engines/ng-paye.js`

3. **Netlify Nigeria NTA bands out of sync** — `netlify/functions/_engines/ng-paye.js` line 6: NTA bands completely different from frontend engine.
   - **File**: `netlify/functions/_engines/ng-paye.js`

4. **Netlify Kenya band off by 111** — `netlify/functions/_engines/ke-paye.js` line 4: Third band width is 467,778 instead of 467,667.
   - **File**: `netlify/functions/_engines/ke-paye.js`

### 🟠 HIGH (Fix this week)

5. **Missing /car/index.html** — Sitemap references Central African Republic page but file doesn't exist (404).
   - **Action**: Create the file or remove from sitemap

6. **16 crypto pages missing from sitemap.xml** — scam-checker, address-validator, exchange-ratings, contract-scanner, quiz + 5 blog posts not indexed.
   - **File**: `sitemap.xml`

7. **robots.txt missing /admin/ block** — Admin dashboard at `/admin/dashboard.html` is exposed to crawlers.
   - **File**: `robots.txt`

8. **Tanzania PAYE bands 3-4 each 10K short** — 30% threshold kicks in at TZS 1,000,000 instead of 1,020,000.
   - **File**: `assets/js/engines/tz-paye.js`

9. **Ghana PAYE 30% band off by GHS 6,240** — Band width is 360,000 instead of 366,240.
   - **File**: `assets/js/engines/gh-paye.js`

10. **Chart.js loaded render-blocking on 110+ pages** — Loaded in `<head>` without `defer` or `async` on all PAYE/VAT pages.
    - **Action**: Add `defer` attribute to all Chart.js script tags

### 🟡 MEDIUM (Fix this month)

11. **Instrument Serif font not loaded on 97% of pages** — Only 11/342 pages load it. Headings fall back to Georgia on 331 pages.
    - **Action**: Add font link to `global.css` or self-host the font

12. **7 property tools not in registry or sitemap** — first-home-buyer, home-loan-eligibility, home-renovation-cost, mortgage-affordability, property-roi, property-transfer-cost, rent-vs-buy exist but are invisible.
    - **Action**: Add to `tool-registry.js` and `sitemap.xml`

13. **Country page meta descriptions are templated** — 50 country landing pages use near-identical meta descriptions. Search engines may view as thin content.
    - **Action**: Write unique descriptions mentioning specific tools, rates, currencies per country

14. **Missing pages from sitemap** — `/about/`, `/contact/`, `/faq/`, `/api/`, `/api/docs/`, `/privacy/`, `/terms/`
    - **File**: `sitemap.xml`

15. **Only 7 pages use lazy loading** — 330+ pages have images without `loading="lazy"`, risking CLS issues.
    - **Action**: Add `loading="lazy"` to all below-fold images

### 🔵 LOW (Backlog)

16. **Hardcoded colors in CSS files** — `#444`, `#f5f5f5`, `#1a1a2e` used instead of design tokens in auth-modal.css, currency-converter.css, vat-calculator.css, api-docs.css.

17. **Border-radius off-scale values** — 3px, 4px, 5px, 7px, 14px, 20px found in tool-layout.css, vat-calculator.css, blog.css. Token scale is 6/10/16/24/100px.

18. **Netlify Kenya NSSF cap differs from frontend** — API uses KES 2,160 max, frontend uses KES 4,320.
    - **Files**: `netlify/functions/_engines/ke-paye.js` vs `assets/js/engines/ke-paye.js`

19. **PAYE pages inline CSS duplication** — ~53 country PAYE pages duplicate ~100 lines of CSS that already exists in `paye-tool.css`.

20. **Shadow inconsistencies** — Many files use one-off `box-shadow` values instead of token variables (`--shadow-sm`, `--shadow-md`, etc.).
