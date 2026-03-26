# AfroTools — Daily SEO Diagnostic Checklist

> Based on SEMrush Site Audit logic (March 2026 report).
> Run this top-to-bottom. Each section maps to a real SEMrush issue category.
> Mark ✅ pass / ❌ fail / ⚠️ needs attention.

---

## 0. Quick-glance site health numbers (log these daily)

| Metric | Today | Yesterday | Target |
|--------|-------|-----------|--------|
| Google Search Console — Coverage errors | | | 0 |
| Google Search Console — Valid pages | | | > 600 |
| Netlify deploy status | | | ✅ |
| Google PageSpeed mobile score (homepage) | | | > 80 |

---

## 1. ERRORS — Fix immediately, Google penalises these

### 1.1 Broken internal links
**What SEMrush flagged:** 491 broken links (all from `/fr/` homepage to non-existent French pages)
**Status after fix:** Fallback 302 redirects added in `_redirects`

Run check:
```bash
# From project root — find any anchor whose href is a /fr/ path with no matching file or redirect
python3 - <<'EOF'
import os, re
root = os.getcwd()
fr_index = os.path.join(root, 'fr', 'index.html')
content = open(fr_index, encoding='utf-8').read()
links = sorted(set(re.findall(r'href="(/fr/[^"#?]+)"', content)))
broken = []
for link in links:
    rel = link.lstrip('/')
    exists = (
        os.path.exists(os.path.join(root, rel, 'index.html')) or
        os.path.exists(os.path.join(root, rel.rstrip('/') + '.html'))
    )
    if not exists:
        broken.append(link)
print(f"Broken /fr/ links (no static file — check _redirects covers these): {len(broken)}")
for b in broken:
    print(f"  {b}")
EOF
```
**Pass condition:** 0 links (or all covered by `_redirects`)

---

### 1.2 Pages returning 4xx status
**What SEMrush flagged:** 156 pages not found
**Root cause:** The 67 unique /fr/ pages above × multiple links each = same source

Check: In Google Search Console → **Coverage → Not Found (404)**
**Pass condition:** < 5 pages (some transient 404s are normal)

---

### 1.3 Hreflang redirect errors
**What SEMrush flagged:** ~300 pages with hreflang links pointing to redirecting URLs
**Root cause:** hreflang `en`/`x-default` had trailing slashes on `.html`-backed pages
**Status after fix:** Bulk-fixed across 236 files

Run check:
```bash
python3 - <<'EOF'
import os, re

root = os.getcwd()
html_urls = set()
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets']]
    for f in files:
        if f.endswith('.html') and f != 'index.html':
            rel = os.path.relpath(os.path.join(dp, f), root).replace(os.sep, '/')
            html_urls.add('https://afrotools.com/' + rel[:-5])

violations = []
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets']]
    for f in files:
        if not f.endswith('.html'):
            continue
        fpath = os.path.join(dp, f)
        content = open(fpath, encoding='utf-8').read()
        for m in re.finditer(r'hreflang="[^"]+" href="(https://afrotools\.com/[^"]+/)"', content):
            url = m.group(1)
            if url[:-1] in html_urls:
                violations.append((fpath.replace(root, ''), url))

print(f"Hreflang trailing-slash violations: {len(violations)}")
for v in violations[:10]:
    print(f"  {v[0]} → {v[1]}")
EOF
```
**Pass condition:** 0 violations

---

### 1.4 Hreflang conflicts (no self-referencing tag)
**What SEMrush flagged:** ~150 pages missing self-referencing hreflang
**Root cause:** Same as 1.3 — trailing slash made the self-reference a redirect

Run check (sample 5 pages):
```bash
python3 - <<'EOF'
import os, re, random

root = os.getcwd()
issues = []
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets']]
    for f in files:
        if f == 'index.html' or not f.endswith('.html'):
            continue
        fpath = os.path.join(dp, f)
        content = open(fpath, encoding='utf-8').read()
        if 'hreflang' not in content:
            continue
        canon_m = re.search(r'<link rel="canonical" href="([^"]+)"', content)
        if not canon_m:
            continue
        canon = canon_m.group(1)
        # Self-referencing hreflang must exist with exact canonical URL
        if f'href="{canon}"' not in content.split('hreflang')[0] + ''.join(
            m.group(0) for m in re.finditer(r'hreflang="[^"]+" href="[^"]+"', content)
            if m.group(0).split('href="')[1].rstrip('"') == canon
        ):
            has_self = any(
                m.group(0).__contains__(canon)
                for m in re.finditer(r'hreflang="(?:en|x-default)" href="([^"]+)"', content)
                if m.group(1) == canon
            )
            if not has_self:
                issues.append(fpath.replace(root, ''))

sample = random.sample(issues, min(5, len(issues)))
print(f"Pages missing self-referencing hreflang: {len(issues)}")
for s in sample:
    print(f"  {s}")
EOF
```
**Pass condition:** 0 (or < 5 edge-case pages)

---

### 1.5 Incorrect pages in sitemap.xml
**What SEMrush flagged:** ~300 sitemap entries pointing to redirect URLs
**Root cause:** sitemap used trailing-slash URLs for `.html`-backed pages
**Status after fix:** 538 entries corrected in `sitemap.xml`, 227 in `sitemap-i18n.xml`

Run check:
```bash
python3 - <<'EOF'
import os, re

root = os.getcwd()
html_urls = set()
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets']]
    for f in files:
        if f.endswith('.html') and f != 'index.html':
            rel = os.path.relpath(os.path.join(dp, f), root).replace(os.sep, '/')
            html_urls.add('https://afrotools.com/' + rel[:-5])

for sm in ['sitemap.xml', 'sitemap-i18n.xml']:
    content = open(os.path.join(root, sm), encoding='utf-8').read()
    locs = re.findall(r'<loc>(https://afrotools\.com/[^<]+)</loc>', content)
    bad = [l for l in locs if l.endswith('/') and l[:-1] in html_urls]
    print(f"{sm}: {len(bad)} trailing-slash locs pointing to .html pages")
    for b in bad[:5]:
        print(f"  {b}")
EOF
```
**Pass condition:** 0 bad entries

---

### 1.6 Invalid structured data (WebApplication schema)
**What SEMrush flagged:** ~300 pages — `aggregateRating` and `review` fields absent
**SEMrush severity:** Error (but Google's spec marks these as "Recommended", not "Required")
**Action:** Add real `aggregateRating` once a user review system is live. Until then this is cosmetic in Google's eyes — they still index the page and the `offers` field satisfies minimum requirements.

Manual spot-check with Google's Rich Results Test:
`https://search.google.com/test/rich-results?url=https://afrotools.com/algeria/dz-paye`

**Longer-term fix:** When implementing a star-rating widget, add to each page's schema:
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "<real_average>",
  "ratingCount": "<real_count>",
  "bestRating": "5",
  "worstRating": "1"
}
```

---

## 2. WARNINGS — Fix within a week

### 2.1 robots.txt blocking /assets/
**What SEMrush flagged:** ~1,000 resources (CSS/JS/images) blocked from crawling
**Status after fix:** `Disallow: /assets/` removed; specific allow rules added for css/js/img
**Pass condition:** `curl https://afrotools.com/robots.txt` must NOT show `Disallow: /assets/`

### 2.2 Low text-to-HTML ratio
**What SEMrush flagged:** Many pages have < 10% text content vs HTML markup
**Root cause:** Tool pages have large JS/CSS inline + minimal visible text
**Fix:** Move inline `<style>` blocks to external CSS files; add descriptive content sections
**Check:** Open DevTools → Elements → estimate text nodes vs total markup

### 2.3 Low word count (< 200 words)
**What SEMrush flagged:** Most calculator/tool pages
**Fix strategy:**
- Add a "How to use" section (3–5 sentences)
- Add a "Why this matters" or "About [Country] tax system" paragraph
- FAQ sections (already present on PAYE/VAT pages) count toward word count ✓

### 2.4 Missing H1 tags
Run check:
```bash
python3 - <<'EOF'
import os, re
root = os.getcwd()
missing = []
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets', 'fr', 'sw']]
    for f in files:
        if not f.endswith('.html'):
            continue
        fpath = os.path.join(dp, f)
        content = open(fpath, encoding='utf-8').read()
        if not re.search(r'<h1[\s>]', content, re.IGNORECASE):
            missing.append(fpath.replace(root, ''))
print(f"Pages missing <h1>: {len(missing)}")
for m in missing[:10]:
    print(f"  {m}")
EOF
```

---

## 3. NOTICES — Fix within a month

### 3.1 Orphaned pages in sitemap (1,127 pages)
**Definition:** Pages in `sitemap.xml` / `sitemap-i18n.xml` but with no internal links pointing to them
**Risk:** Wastes crawl budget
**Fix strategy:**
- Agriculture country pages (`/agriculture/crop-yield/angola/` etc.) — already in category hubs? Check nav.
- Add "Related tools" cross-links on country pages

### 3.2 Pages needing > 3 clicks to reach (321 pages)
**Root cause:** Agriculture country sub-pages (54 countries × multiple tools) are deeply nested
**Fix:**
- Ensure category pages (`/agriculture/`) link to sub-tools
- Sub-tool hub pages link to all 54 country variants
- Consider a "Quick jump" country selector on tool pages

### 3.3 Crawl depth > 3 clicks
Same as 3.2. Rule of thumb: Homepage → Category → Country should be max depth.

### 3.4 URLs with permanent redirects (248 pages)
**Check:** Review `_redirects` for chains (A→B→C = bad; should be A→C directly)
```bash
# Spot-check for redirect chains in _redirects
grep "301\|302" _redirects | awk '{print $2}' | sort | uniq -d
```

### 3.5 llms.txt missing / formatting issues
Google and AI crawlers (ChatGPT, Perplexity) check `/llms.txt` to understand the site.
Create `/llms.txt` with a brief site description and key page list if not present:
```bash
ls llms.txt 2>/dev/null || echo "MISSING"
```

---

## 4. Weekly checks (not in SEMrush report but critical)

### 4.1 Canonical consistency
Every page must have a `<link rel="canonical">` that exactly matches:
- No trailing slash on `.html`-backed pages
- Trailing slash on directory (`index.html`) pages
```bash
python3 - <<'EOF'
import os, re
root = os.getcwd()
issues = []
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets']]
    for f in files:
        if not f.endswith('.html'):
            continue
        fpath = os.path.join(dp, f)
        content = open(fpath, encoding='utf-8').read()
        if '<link rel="canonical"' not in content:
            issues.append(('NO_CANONICAL', fpath.replace(root, '')))
            continue
        m = re.search(r'<link rel="canonical" href="([^"]+)"', content)
        if not m:
            continue
        canon = m.group(1)
        rel = os.path.relpath(fpath, root).replace(os.sep, '/')
        if f == 'index.html':
            expected_suffix = rel[:-len('/index.html')] + '/'
        else:
            expected_suffix = rel[:-5]  # remove .html
        expected = 'https://afrotools.com/' + expected_suffix
        if canon != expected and canon.rstrip('/') != expected.rstrip('/'):
            issues.append(('MISMATCH', fpath.replace(root, ''), f'canonical={canon}', f'expected={expected}'))
print(f"Canonical issues: {len(issues)}")
for i in issues[:10]:
    print(i)
EOF
```

### 4.2 OG/meta tags present on all key pages
```bash
python3 - <<'EOF'
import os, re
root = os.getcwd()
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets', 'fr', 'sw', 'blog']]
    for f in files:
        if f != 'index.html':
            continue
        fpath = os.path.join(dp, f)
        content = open(fpath, encoding='utf-8').read()
        rel = os.path.relpath(fpath, root).replace(os.sep, '/')
        missing = []
        if '<title>' not in content:
            missing.append('title')
        if 'name="description"' not in content:
            missing.append('meta-desc')
        if 'og:title' not in content:
            missing.append('og:title')
        if missing:
            print(f"  {rel}: missing {missing}")
EOF
```

### 4.3 New pages added to sitemap
After adding any new HTML file, verify it appears in the correct sitemap:
```bash
grep -c "<url>" sitemap.xml sitemap-i18n.xml
```

### 4.4 Dead redirects in _redirects
```bash
# Count total redirect rules
grep -cE "301|302|200" _redirects
# Check for obvious loops (destination = source)
awk 'NF>=2 && $1==$2' _redirects
```

---

## 5. Monthly deep checks

### 5.1 Sitemap coverage vs actual pages
```bash
python3 - <<'EOF'
import os, re
root = os.getcwd()
# Count all indexable pages
all_pages = []
for dp, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'assets', 'scripts']]
    for f in files:
        if f.endswith('.html'):
            all_pages.append(os.path.join(dp, f))

sm_content = open(os.path.join(root, 'sitemap.xml'), encoding='utf-8').read()
sm_i18n = open(os.path.join(root, 'sitemap-i18n.xml'), encoding='utf-8').read()
sm_locs = set(re.findall(r'<loc>([^<]+)</loc>', sm_content + sm_i18n))

print(f"Total HTML files on disk: {len(all_pages)}")
print(f"Unique sitemap entries: {len(sm_locs)}")
EOF
```

### 5.2 hreflang completeness check
Every page with a French equivalent should cross-reference each other:
- English page → hreflang `en` (self) + hreflang `fr` (French counterpart)
- French page → hreflang `fr` (self) + hreflang `en` (English counterpart)

### 5.3 Structured data validation
For a sample of 10 pages, run Google's Rich Results Test manually:
`https://search.google.com/test/rich-results`
Look for: ✅ FAQPage, ✅ BreadcrumbList, ⚠️ SoftwareApplication (expected until ratings added)

### 5.4 Core Web Vitals (PageSpeed Insights)
Check 3 key pages:
- Homepage: `https://pagespeed.web.dev/report?url=https://afrotools.com/`
- Top PAYE page: `https://pagespeed.web.dev/report?url=https://afrotools.com/nigeria/ng-paye`
- Top VAT page: `https://pagespeed.web.dev/report?url=https://afrotools.com/south-africa/za-vat`
**Target:** LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile

---

## 6. Known deferred fixes (requires build-out)

| Issue | SEMrush Count | Fix Required | Effort |
|-------|-------------|--------------|--------|
| SoftwareApplication missing `aggregateRating` | ~786 pages | Implement star-rating widget + real data | High |
| French country pages don't exist | 67 URLs | Build out full /fr/ country hub pages | Very High |
| Pages need > 3 clicks to reach | 321 pages | Improve internal linking / cross-links on category pages | Medium |
| Orphaned pages in sitemap | 1,127 | Add internal links from category pages to all country variants | Medium |
| Low word count on tool pages | many | Add content sections (How it works, About the tax system) | Medium |
| `llms.txt` missing/formatting issues | 1 | Create `/llms.txt` | Low |
| Duplicate H1 and title tags | some | Audit and differentiate | Low |

---

## 7. Fixed issues log (do not re-introduce)

| Date | Fix | Files Changed |
|------|-----|---------------|
| 2026-03-26 | robots.txt: removed `Disallow: /assets/`, added specific allows | `robots.txt` |
| 2026-03-26 | Hreflang trailing slashes removed on `.html`-backed pages | 236 HTML files |
| 2026-03-26 | sitemap.xml: fixed 538 trailing-slash locs for `.html` pages | `sitemap.xml` |
| 2026-03-26 | sitemap-i18n.xml: fixed 227 trailing-slash locs | `sitemap-i18n.xml` |
| 2026-03-26 | sitemap: removed `nigeria/index_old` and `_country-template` entries | both sitemaps |
| 2026-03-26 | `_redirects`: added 11 /fr/* fallback rules → English equivalents | `_redirects` |

---

## Quick reference — SEMrush error → root cause map

```
Hreflang redirect error
└── hreflang href has trailing slash on a .html-backed page
    → Fix: strip trailing slash from hreflang href

No self-referencing hreflang
└── Same root cause (self-ref URL is a redirect)
    → Fix: same

Incorrect pages in sitemap.xml
└── <loc> URL has trailing slash but file is a .html (not directory)
    → Fix: strip trailing slash in <loc>

Broken internal links
└── /fr/ homepage links to French pages that don't exist
    → Fix: _redirects fallback rules OR build French pages

156 pages returned 4xx
└── Same pages as above (the linked-to /fr/ pages)

robots.txt blocking resources
└── Disallow: /assets/ prevents Google rendering CSS/JS
    → Fix: remove or scope to specific non-public paths only

WebApplication schema missing aggregateRating
└── Google marks as "Recommended" but SEMrush marks as error
    → Real fix: implement user rating system + add real data
```
