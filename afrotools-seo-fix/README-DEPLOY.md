# AfroTools SEO Fix Package — March 12, 2026
# Fixes 46 errors + 231 redirect notices from Semrush audit
# ============================================================

## DEPLOYMENT ORDER (do these in sequence)

### Step 1: Fix trailing slashes in all HTML files
This is the biggest fix — eliminates ~231 unnecessary 301 redirects.

```powershell
cd C:\Users\Oza\Documents\afrotools
.\fix-trailing-slashes.ps1
git diff                    # Review changes look sane
git add -A
git commit -m "SEO: Add trailing slashes to all internal links"
git push
```

### Step 2: Replace sitemap.xml
Drop the new `sitemap.xml` into repo root, replacing the old one.
Key changes:
- Removed `/tools/vat-calculator/` (redirect page, not content)
- Removed duplicate category pages (`/mortgage-property/`, `/health/`)
- PAYE/VAT tool URLs correctly have NO trailing slash (file-based canonical)
- Updated all lastmod dates

```powershell
# sitemap.xml goes in repo root: C:\Users\Oza\Documents\afrotools\sitemap.xml
git add sitemap.xml
git commit -m "SEO: Fix sitemap.xml - remove redirect URLs, correct canonicals"
git push
```

### Step 3: Fix VAT calculator meta refresh
Replace: `tools/vat-calculator/index.html`
Also add the redirect rules to `_redirects`:

```powershell
# 1. Replace the VAT calculator stub page
# Copy tools-vat-calculator-index.html to:
#   C:\Users\Oza\Documents\afrotools\tools\vat-calculator\index.html

# 2. Add these lines to the TOP of your _redirects file:
#    /tools/vat-calculator    /tools/vat-calculator/vat-calc    301
#    /tools/vat-calculator/   /tools/vat-calculator/vat-calc    301

git add -A
git commit -m "SEO: Replace meta refresh with Netlify redirect for VAT calculator"
git push
```

### Step 4: Fix structured data on Import Duty + WAEC Calculator
Open each file and replace the `<script type="application/ld+json">` block:

**Import Duty** (`tools/import-duty/index.html`):
- Find the existing JSON-LD script block
- Replace with the content from `STRUCTURED-DATA-import-duty.html`
- Key change: Added `"offers": {"@type":"Offer","price":"0","priceCurrency":"USD"}`
- Also changed `applicationCategory` to `"FinanceApplication"`

**WAEC Calculator** (`tools/waec-calculator/index.html`):
- Same process — replace JSON-LD block
- Content from `STRUCTURED-DATA-waec-calculator.html`
- Key change: Added `"offers"` field + `applicationCategory: "EducationalApplication"`

```powershell
git add -A
git commit -m "SEO: Fix structured data - add required offers field to Import Duty + WAEC"
git push
```

## EXPECTED RESULTS (next Semrush crawl)
- Errors: 46 → ~0 (sitemap fixed, structured data fixed, meta refresh removed)
- Warnings: 442 → ~250 (unminified JS/CSS still flagged but harmless on Netlify)
- Notices: 231 redirects → ~10 (trailing slash links fixed across all pages)
- 115 orphaned pages → will decrease as PAYE tools get linked from hub pages
- Site Health: 81% → estimated 90%+

## FILES IN THIS PACKAGE
- sitemap.xml                          → Replace at repo root
- fix-trailing-slashes.ps1            → Run from repo root in PowerShell
- tools-vat-calculator-index.html     → Replace tools/vat-calculator/index.html
- REDIRECTS-ADD.txt                   → Add these lines to top of _redirects
- STRUCTURED-DATA-import-duty.html    → Replace JSON-LD in tools/import-duty/index.html
- STRUCTURED-DATA-waec-calculator.html → Replace JSON-LD in tools/waec-calculator/index.html
