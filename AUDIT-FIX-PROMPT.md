# AfroTools Comprehensive Audit — Fix Prompt for Claude Code

> **Generated:** 2026-03-22 | **Scope:** Full repo survey — 724 HTML pages, 43 CSS files, 80+ JS files, all Netlify functions, config files
> **Instructions:** Feed this entire document to Claude Code as a prompt. Work through sections in priority order (P0 → P4). Each issue has a specific file path and description of what to fix.

---

## TABLE OF CONTENTS

1. [P0 — Critical / Site-Breaking](#p0--critical--site-breaking)
2. [P1 — High Priority Bugs & SEO](#p1--high-priority-bugs--seo)
3. [P2 — Calculator Logic Bugs](#p2--calculator-logic-bugs)
4. [P3 — Security Issues](#p3--security-issues)
5. [P4 — SEO & Meta Tags](#p4--seo--meta-tags)
6. [P5 — CSS & Design Consistency](#p5--css--design-consistency)
7. [P6 — JavaScript Errors & Code Quality](#p6--javascript-errors--code-quality)
8. [P7 — Workflow & Config](#p7--workflow--config)
9. [P8 — Accessibility](#p8--accessibility)
10. [P9 — Low Priority / Nice-to-Have](#p9--low-priority--nice-to-have)

---

## P0 — Critical / Site-Breaking

### P0-01: Service Worker install fails — precache references `.png` icons that don't exist
- **File:** `service-worker.js` (lines 19–20)
- **Issue:** Precache list includes `/assets/img/icon-192.png` and `/assets/img/icon-512.png` but only `.svg` versions exist. This causes `cache.addAll()` to fail, meaning the SW never installs and the entire PWA offline experience is broken.
- **Fix:** Change `.png` to `.svg` in the precache array to match the actual files (`icon-192.svg`, `icon-512.svg`).

### P0-02: `_engines/index` module missing — public tax API returns 500
- **Files:** `netlify/functions/api-tax.js` (line 7), `netlify/functions/api-gateway.js` (line 109)
- **Issue:** Both files `require('./_engines/index')` but `netlify/functions/_engines/` directory does not exist in the repo. Every request to `/api/v1/tax/*` and the API gateway crashes with `MODULE_NOT_FOUND`.
- **Fix:** Either create the `_engines/index.js` module that re-exports the engine functions, or update the require paths to point to the actual engine files in `assets/js/engines/` or `engines/`.

### P0-03: Paystack webhook writes to wrong table — Pro subscriptions never activate
- **File:** `netlify/functions/paystack-webhook.js` (lines 58–72)
- **Issue:** The webhook upserts to `user_profiles` table, but the auth system (`supabase-auth.js`) reads from `profiles` table. When a user pays for Pro, the subscription status is saved to a table the app never reads.
- **Fix:** Change `user_profiles` to `profiles` in the webhook function (or whichever table is the canonical one used by `supabase-auth.js`).

### P0-04: Scheduled function file missing
- **File:** `netlify.toml` (line 31)
- **Issue:** `netlify.toml` declares a schedule for `scheduled-fetch-crypto-p2p` but the file `netlify/functions/scheduled-fetch-crypto-p2p.js` does not exist. Only `crypto-p2p.js` exists (on-demand).
- **Fix:** Either create `scheduled-fetch-crypto-p2p.js` that wraps `crypto-p2p.js`, or remove the schedule declaration from `netlify.toml`.

---

## P1 — High Priority Bugs & SEO

### P1-01: Wrong country name in print title on 8 PAYE pages
- **Issue:** The print window title says "AfroTools Tanzania PAYE" on non-Tanzania pages. Users printing payslips see the wrong country.
- **Files to fix (change "Tanzania" to correct country):**
  - `cape-verde/cv-paye.html` (line 782) → "Cape Verde"
  - `chad/td-paye.html` (line 782) → "Chad"
  - `gabon/ga-paye.html` (line 782) → "Gabon"
  - `gambia/gm-paye.html` (line 782) → "Gambia"
  - `guinea-bissau/gw-paye.html` (line 791) → "Guinea-Bissau"
  - `liberia/lr-paye.html` (line 782) → "Liberia"
  - `mauritania/mr-paye.html` (line 783) → "Mauritania"
  - `sierra-leone/sl-paye.html` (line 783) → "Sierra Leone"

### P1-02: Broken link on 404 page
- **File:** `404.html` (line 108)
- **Issue:** Links to `/tools/vat-calculator/vat-calc` which itself 404s. Should be `/tools/vat-calculator/`.
- **Fix:** Change the href to `/tools/vat-calculator/`.

### P1-03: Duplicate Privacy Policy and Terms of Use pages
- **Issue:** Two versions of each exist with different canonicals:
  - `privacy/index.html` (canonical: `/privacy/`) AND `privacy-policy.html` (canonical: `/privacy-policy`)
  - `terms/index.html` (canonical: `/terms/`) AND `terms-of-use.html` (canonical: `/terms-of-use`)
- **Fix:** Pick one canonical URL for each. Add 301 redirects in `_redirects` from the deprecated URL to the canonical one. Delete or hollow out the deprecated HTML file.

### P1-04: CSP `connect-src` missing Supabase data domain
- **File:** `_headers` (line ~21)
- **Issue:** `connect-src` doesn't include `https://jbmhfpkzbgyeodsqhprx.supabase.co`. This blocks `afro-vault.js` and `edu-cloud-sync.js` from making direct Supabase calls in browsers that enforce CSP.
- **Fix:** Add `https://jbmhfpkzbgyeodsqhprx.supabase.co` to the `connect-src` directive.

### P1-05: 30+ tools missing from `sitemap.xml`
- **Issue:** These live tool pages have no sitemap entry, hurting SEO discoverability:
  - `/tools/business-planner/` (T1 tool, priority 92 in registry)
  - `/tools/afroprices/`
  - `/tools/ajo-chama/`
  - `/tools/home-loan-eligibility/`
  - `/tools/mortgage-affordability/`
  - `/tools/property-roi/`
  - `/tools/rent-vs-buy/`
  - `/tools/pdf-bates/`, `/tools/pdf-chat/`, `/tools/pdf-compare/`, `/tools/pdf-convert/`, `/tools/pdf-editor/`, `/tools/pdf-reorder/`, `/tools/pdf-repair/`, `/tools/pdf-to-audio/`, `/tools/pdf-translate/`, `/tools/pdf-workflow/`, `/tools/pdf-find-replace/`
  - `/tools/sitemap-generator/`
  - `/tools/tithe-offering-calculator/`
  - `/tools/html-to-pdf/`, `/tools/idea-board/`, `/tools/image-tools/`, `/tools/education-hub/`, `/tools/first-home-buyer/`
- **Fix:** Add `<url>` entries for each with appropriate `<priority>` and `<changefreq>`.

### P1-06: French (`/fr/`) pages entirely absent from sitemap
- **Issue:** The `/fr/` hub and all `/fr/{country}/calculateur-*` pages have zero sitemap entries. Francophone SEO is dead.
- **Fix:** Add all `/fr/` pages to `sitemap.xml`.

### P1-07: Redirect aliases in sitemap (should be canonical URLs)
- **Issue:** `/car/`, `/car/cf-paye`, `/car/cf-vat`, `/eq-guinea/`, `/eq-guinea/gq-paye`, `/eq-guinea/gq-vat` are 301 redirects but appear in sitemap. Also `/pro` redirects to `/pricing` but is in sitemap.
- **Fix:** Replace with canonical target URLs or remove from sitemap.

### P1-08: NHF employer rate shows 2.5% (should be 0%)
- **File:** `assets/js/engines/ng-paye.js` (line 119)
- **Issue:** `employerNHF: opts.nhf ? gross * 0.025 : 0` — employer NHF contribution is 0% under the NHF Act, only employees contribute 2.5%.
- **Fix:** Change to `employerNHF: 0`.

### P1-09: `api-profile.js` returns `ok: true` on failed save
- **File:** `netlify/functions/api-profile.js` (line 142)
- **Issue:** When profile upsert fails, response is `{ ok: true, synced: false }`. Client code checking `result.ok` treats this as success, silently losing data.
- **Fix:** Change to `{ ok: false, synced: false, error: errText }`.

---

## P2 — Calculator Logic Bugs

### P2-01: ZA PAYE off-by-one in `calcTax()`
- **File:** `assets/js/engines/za-paye.js` (line 54)
- **Issue:** `const incomeInBand = Math.min(taxableIncome, upper) - (b.from - 1);` produces a R1 error at every tax bracket boundary that compounds across bands.
- **Fix:** Use `Math.min(taxableIncome, upper) - b.from + 1` or restructure to use band width directly.

### P2-02: KE PAYE SHIF charges KSh 300 when salary is 0
- **File:** `assets/js/engines/ke-paye.js` (line 104)
- **Issue:** `Math.max(300, gross * 0.0275)` returns 300 even when `gross = 0`.
- **Fix:** `gross > 0 ? Math.max(300, gross * 0.0275) : 0`

### P2-03: GH PAYE SSNIT cap uses monthly value against annual input
- **File:** `assets/js/engines/gh-paye.js` (lines 34, 86)
- **Issue:** `SSNIT_CAP = 61000` is monthly but compared against annual `basic`. Anyone earning above GHS 61k/year gets understated SSNIT.
- **Fix:** Either multiply cap by 12 (`SSNIT_CAP = 61000 * 12`) or convert `basic` to monthly before comparison.

### P2-04: Francophone PAYE band computation off by 1 CFA franc
- **File:** `engines/francophone-paye-engine.js` (lines 404–408)
- **Issue:** `taxableInBand = top - band.min` should be `top - band.min + 1` for inclusive bands. Compounds across brackets.
- **Fix:** Add `+ 1` to the computation, or adjust band definitions to use exclusive upper bounds.

### P2-05: Agric Profit division by zero when yield = 0
- **File:** `tools/agric-profit/index.html` (~line 264)
- **Issue:** `costPerKg = totalCost / (yield * area)` — when yield is 0, displays "Infinity" in UI.
- **Fix:** Guard with `if (yield === 0) { costPerKg = 0; /* show N/A */ }`.

### P2-06: Car Loan `totalPaid` wrong when rate = 0% with balloon
- **File:** `tools/car-loan/index.html` (lines 917–920)
- **Issue:** When `r === 0`, `totalPaid = loanForCalc` excludes the balloon payment amount.
- **Fix:** `totalPaid = loanForCalc + balloonAmt`

### P2-07: Forex Profit return % multiplier does nothing
- **File:** `tools/forex-profit/index.html` (line 300)
- **Issue:** `(direction==='buy'?1:1)` always equals 1 — sell case is identical to buy.
- **Fix:** Verify the intended formula for sell direction and correct the ternary.

### P2-08: Loan Comparison `loanCount` never decremented — can't add loan after removing one
- **File:** `tools/loan-compare/index.html` (line 206)
- **Issue:** After removing a loan, `loanCount` stays at max, so the "Add Loan" button remains hidden.
- **Fix:** Decrement `loanCount` in `removeLoan()`, or count actual visible loan forms instead.

### P2-09: Break-even sensitivity analysis division by zero
- **File:** `tools/break-even/index.html` (line 929)
- **Issue:** `newBe = Math.ceil(fc / (newPrice - vc))` — when `newPrice <= vc`, shows Infinity.
- **Fix:** Guard: `if (newPrice <= vc) { newBe = '∞'; }`.

### P2-10: Investment Return CAGR undefined when initial = 0
- **File:** `tools/investment-return/index.html` (line 365)
- **Issue:** Pure monthly-contribution scenario shows 0% CAGR which is misleading.
- **Fix:** Show "N/A" or compute modified CAGR that accounts for periodic contributions.

### P2-11: BMI Calculator displays "Infinity" when height = 0
- **File:** `tools/bmi-calculator/index.html` (line 1463)
- **Issue:** `bmi = weightKg / (heightM * heightM)` — no guard for zero height.
- **Fix:** `if (heightM <= 0) return;` before calculation.

### P2-12: GH PAYE Tier 3 cap annual/monthly mismatch
- **File:** `assets/js/engines/gh-paye.js` (lines 90–92)
- **Issue:** `tier3Cap = basic * 0.165` uses annual `basic`, but `tier3Amount` is documented as monthly. Cap is meaningless.
- **Fix:** Either divide cap by 12, or document/expect annual `tier3Amount`.

### P2-13: EG PAYE exclusion extra-tax may double-count
- **File:** `assets/js/engines/eg-paye.js` (lines 74–88)
- **Issue:** `exclusionExtra += rule.extraTax` stacks all exclusion amounts cumulatively. Verify against Egyptian tax authority whether values are marginal additions or standalone replacements.
- **Fix:** Verify against official source; if standalone values, use `exclusionExtra = rule.extraTax` (assign, not add).

---

## P3 — Security Issues

### P3-01: Paystack webhook `JSON.parse` outside try/catch
- **File:** `netlify/functions/paystack-webhook.js` (line 35)
- **Issue:** `JSON.parse(event.body)` is before the try/catch. Malformed JSON crashes with unhandled exception.
- **Fix:** Move inside try/catch or wrap in its own try/catch.

### P3-02: `afroprices-search.js` SQL injection risk via `ilike`
- **File:** `netlify/functions/afroprices-search.js` (line 64)
- **Issue:** `.or(\`name.ilike.%${query}%,...\`)` — `query` from user input is interpolated into PostgREST filter without sanitization.
- **Fix:** Sanitize `query`: strip PostgREST operators `(),.`, limit length to 100 chars, allow only alphanumeric + spaces.

### P3-03: `afrokitchen-recipes.js` unsanitized params
- **File:** `netlify/functions/afrokitchen-recipes.js` (lines 43–44)
- **Issue:** `params.slug` and `params.limit` are interpolated into URL without sanitization.
- **Fix:** `parseInt(params.limit, 10)` for limit; validate slug as `/^[a-z0-9-]+$/`.

### P3-04: `supabase-auth.js` XSS risk via innerHTML
- **File:** `assets/js/supabase-auth.js` (line 189)
- **Issue:** User name from profile (`first`) is inserted via `innerHTML`. If name contains HTML tags, they execute.
- **Fix:** Use `textContent` for the name, build `<img>` with `createElement`.

### P3-05: Auth function allows 4-character passwords
- **File:** `netlify/functions/auth.js` (line 69)
- **Issue:** Minimum password length is 4. NIST/OWASP recommends 8.
- **Fix:** Change to `password.length < 8` and update error message.

### P3-06: Rate limit counter consumed before AI call succeeds
- **File:** `netlify/functions/ai-advisor.js` (line 67)
- **Issue:** Daily rate limit incremented before the Anthropic API call. If the call fails, user loses a quota slot.
- **Fix:** Increment counter only after successful response, or decrement on failure.

### P3-07: In-memory rate limit resets on cold start
- **Files:** `netlify/functions/translate.js` (line 24), `netlify/functions/afroprices-submit.js`
- **Issue:** `rateLimitMap = new Map()` resets on every cold start. Rate limiting is ineffective.
- **Fix:** Use Netlify Blobs (like `ai-advisor.js` does) for persistent rate limiting.

### P3-08: Supabase client created at module load — crashes if env vars missing
- **File:** `netlify/functions/paystack-webhook.js` (lines 14–17)
- **Issue:** `createClient(undefined, undefined)` at cold start causes all invocations to fail.
- **Fix:** Move client creation inside the handler or guard with existence check.

---

## P4 — SEO & Meta Tags

### P4-01: All OG image PNGs missing (454+ pages affected)
- **Issue:** Every `og:image` pointing to `/assets/img/og-default.png`, `og-home.png`, `og-ke-paye.png` etc. — none of these files exist. Social shares show no preview image.
- **Fix:** Generate OG images (1200x630 PNG/JPG) for all referenced paths, OR update all `og:image` meta tags to point to existing `.webp` files.

### P4-02: SVG files used as `og:image` (34 pages)
- **Issue:** Social media crawlers don't render SVG for OG previews.
- **Fix:** Replace SVG `og:image` references with PNG/JPG equivalents.

### P4-03: Favicon missing on 716 of 724 pages
- **Issue:** No `<link rel="icon">` on most pages. Two pages reference `/assets/img/favicon.ico` which doesn't exist.
- **Fix:** Add `<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">` to all pages (ideally via the `<afro-navbar>` component or a shared head include).

### P4-04: UTF-8 BOM on 200+ HTML files
- **Issue:** BOM characters cause rendering issues. Affected: all country pages, VAT pages, many tool pages.
- **Fix:** Strip BOM from all files (batch command: `sed -i '1s/^\xEF\xBB\xBF//' **/*.html` or equivalent).

### P4-05: `twitter:title` missing on all 127 blog posts
- **Fix:** Add `<meta name="twitter:title" content="...">` to all blog post templates.

### P4-06: `og:title` missing on 84 pages (public pages only)
- **Notable:** `api/pricing.html`, `categories/index.html`, `tools/solar-calculator/`, `tools/boq-generator/`, AfroKitchen sub-pages, all `app.html` pages.
- **Fix:** Add `og:title` to each.

### P4-07: `rel="canonical"` missing on 28 pages
- **Notable:** `mortgage-property/index.html`, AfroKitchen dynamic pages, `solar-calculator/`, `boq-generator/`, all `app.html` pages.
- **Fix:** Add absolute canonical URLs.

### P4-08: `meta description` missing on 50+ pages
- **Notable:** `404.html`, `offline.html`, `style-guide.html`, all `app.html` pages, `pro/success/`.
- **Fix:** Add descriptions.

### P4-09: Canonical/OG URL trailing slash mismatch
- **Example:** `tools/pdf-workspace/index.html` has canonical without slash but og:url with slash.
- **Fix:** Make canonical and og:url consistent across all pages.

### P4-10: `offline.html` missing `noindex`
- **Fix:** Add `<meta name="robots" content="noindex">`.

### P4-11: `nigeria/index_old.html` stale backup in production
- **Fix:** Delete file or add to `.gitignore` and `robots.txt` Disallow.

---

## P5 — CSS & Design Consistency

### P5-01: Green colors in global/dashboard CSS (brand is BLUE)
- **Files & fixes:**
  - `assets/css/global.css` line 62: Change `color: #3a5a45` → `color: var(--color-text-muted)`
  - `assets/css/paye-tool.css` line 46: Change `background: #141c18` → `background: var(--color-bg-dark)`
  - `assets/css/dashboard.css` lines 155–179: Replace green nudge card (`#ECFDF5`, `#A7F3D0`, `#065F46`, `#047857`) with blue brand tokens (`var(--color-primary-pale)`, `var(--color-primary-light)`, `var(--color-primary-dark)`)
  - `assets/css/dashboard.css` `.whatsnew-badge`: Replace `#ECFDF5`/`#059669` with blue tokens
  - `assets/css/vat-calculator.css` line 17: Replace green radial gradient glow `rgba(93,219,158,0.08)` with blue `rgba(0,122,255,0.08)`

### P5-02: `--color-success` mapped to blue (should be green)
- **Files:** `assets/css/tokens.css`, `assets/css/design-system.css`
- **Fix:** Change `--color-success: #3B82F6` to an actual green like `--color-success: #22c55e`.

### P5-03: Token value mismatches between `tokens.css` and `design-system.css`
- **Conflicts:** `--nav-height` (62px vs 64px), `--radius-sm` (6px vs 8px), `--radius-md` (10px vs 12px), `--radius-xl` (24px vs 20px), `--color-text` (`#0f172a` vs `#1E293B`)
- **Fix:** Align values. `tokens.css` should be the source of truth; update `design-system.css` to match.

### P5-04: AfroKitchen overrides global `--font-display`/`--font-body` on `:root`
- **File:** `tools/afrokitchen/style.css`
- **Fix:** Scope the variable overrides to `.ak-page` instead of `:root`.

### P5-05: Missing mobile breakpoints
- **Files:**
  - `tools/flashcard-maker/flashcard-maker.css` — zero `@media` queries. Add breakpoints for `.fc-match-grid`, `.fc-stats`, `.fc-study-controls`.
  - `tools/education-hub/education-hub.css` — `.eh-grid` and `.eh-profile-grid` need mobile single-column fallback.

### P5-06: Widespread hardcoded colors bypassing tokens
- **Issue:** Nearly all tool CSS files use hardcoded `#fff`, `#E2E8F0`, `#1E293B`, `#111827` etc. instead of `var(--color-bg-card)`, `var(--color-border)`, `var(--color-text)`.
- **Fix:** Gradually migrate to CSS variables. Priority files: `calculator.css`, `dashboard.css`, `tool-landing.css`.

### P5-07: Dark mode not supported on 10+ tool files
- **Files:** `afrokitchen/style.css`, `flashcard-maker.css`, `gpa-calculator.css`, `ielts-calculator.css`, `jamb-aggregate.css`, `waec-calculator.css`, `education-hub.css`, `blog.css`, `tool-landing.css`
- **Fix:** Use CSS variables from `tokens.css` (which has dark mode overrides) instead of hardcoded colors.

---

## P6 — JavaScript Errors & Code Quality

### P6-01: `setPreset()` uses implicit `window.event` global
- **File:** `tools/investment-return/index.html` (line 315)
- **Fix:** Pass `event` explicitly: `onclick="setPreset(500000,25000,12,5,event)"` and update function signature.

### P6-02: `net-to-gross.js` hook wrapper can be overwritten
- **File:** `assets/js/lib/net-to-gross.js` (lines 76–114)
- **Issue:** If any script loaded after defines `window.calculate`, the hook is lost.
- **Fix:** Use `Object.defineProperty` with configurable:false, or hook at call time rather than wrapping.

### P6-03: `supabase-auth.js` console.log left in production
- **File:** `assets/js/supabase-auth.js` (line 121)
- **Issue:** `console.log('[AfroAuth] Event:', event, ...)` leaks auth events in DevTools.
- **Fix:** Remove or wrap in `if (DEBUG)` check.

### P6-04: `break-even/index.html` — `beChart` undeclared global
- **File:** `tools/break-even/index.html` (line 824)
- **Fix:** Add `var beChart;` at the top of the script.

### P6-05: KE NSSF and GH SSNIT calculators — no input validation
- **Files:** `tools/ke-nssf/index.html` (line 160), `tools/gh-ssnit/index.html` (line 130)
- **Fix:** Add guards for zero/negative values with user-facing messages.

### P6-06: `supabase-auth.js` — apikey appended to URL query string
- **File:** `assets/js/supabase-auth.js` (lines 33–40)
- **Issue:** Anon key visible in server logs, browser history, referrer headers.
- **Fix:** Pass via header instead of URL parameter.

### P6-07: Navbar `NAV_ITEMS` has empty `tools: []` for 9 of 12 categories
- **File:** `assets/js/components/navbar.js` (lines 12–65)
- **Issue:** Mega-menu tool lists are empty if `tool-registry.min.js` fails to load.
- **Fix:** Add fallback tool entries or graceful empty state message.

---

## P7 — Workflow & Config

### P7-01: Duplicate security headers in `netlify.toml` and `_headers`
- **Fix:** Remove the `[[headers]]` block from `netlify.toml`. `_headers` is the canonical source.

### P7-02: HSTS mismatch (`preload` in `_headers` but not in `netlify.toml`)
- **Fix:** Covered by P7-01 — removing toml headers resolves the inconsistency.

### P7-03: `robots.txt` missing disallow entries
- **Fix:** Add:
  ```
  Disallow: /admin/
  Disallow: /afrotools-mission-control.html
  Disallow: /style-guide.html
  ```
  Remove: `Disallow: /assets/js/supabase-auth.js` (has no effect on bots).

### P7-04: `style-guide.html` in sitemap
- **Fix:** Remove from `sitemap.xml`.

### P7-05: `.gitignore` too sparse
- **Fix:** Add entries:
  ```
  *.docx
  *.env
  .env.*
  .env.local
  deploy.bat
  tools/flashcard-maker/test-import.csv
  ```

### P7-06: `package.json` has wrong `main` field
- **Fix:** Remove `"main": "inject-og-tags.js"` from `package.json`.

### P7-07: `tokens.css` non-minified loaded on 2 pages
- **Files:** `tools/boq-generator/index.html`, `tools/solar-calculator/index.html`
- **Fix:** Change `href="/assets/css/tokens.css"` to `href="/assets/css/tokens.min.css"`.

### P7-08: Public developer API CORS locked to afrotools.com only
- **File:** `_headers`
- **Issue:** `/api/v1/*` has `Access-Control-Allow-Origin: https://afrotools.com`. External developers can't call the API.
- **Fix:** Change to `Access-Control-Allow-Origin: *` or implement dynamic origin in the function.

### P7-09: `supabase.min.js` cached immutably without version in filename
- **Issue:** 167KB file with `max-age=31536000, immutable`. If updated, old version is stuck in caches.
- **Fix:** Add version hash to filename (e.g., `supabase.2.49.0.min.js`) or use `stale-while-revalidate`.

---

## P8 — Accessibility

### P8-01: `user-scalable=no` on 3 pages (WCAG 2.1 AA violation)
- **Files:**
  - `engineering/afrodraft/app.html`
  - `engineering/floor-planner/index.html`
  - `tools/pdf-editor/index.html`
- **Fix:** Remove `user-scalable=no` and `maximum-scale=1.0` from viewport meta.

### P8-02: `outline: none` on inputs without focus ring replacement
- **Files:** `calculator.css`, `japa-calculator.css`, `vat-calculator.css`, `afrokitchen/style.css`
- **Fix:** Add `box-shadow: 0 0 0 3px rgba(0,122,255,0.15)` on `:focus-visible` for all inputs with `outline: none`.

### P8-03: `img` tags missing `alt` attributes (10 instances in JS templates)
- **Files:** `tools/image-filters/index.html`, `tools/medical-report/index.html`, `tools/pdf-sign/index.html`, `tools/pdf-watermark/index.html`
- **Fix:** Add `alt=""` (decorative) or descriptive alt text to dynamically created `<img>` elements.

### P8-04: 589 pages missing `<main>` landmark element
- **Issue:** Most pages use `<div>` instead of `<main>`. Screen readers can't identify the primary content area.
- **Fix:** This is a sitewide structural issue. Lowest priority accessibility fix — tackle when doing page-level refactors.

---

## P9 — Low Priority / Nice-to-Have

### P9-01: `about/index.html` missing global CSS (`tokens.min.css`, `global.min.css`)
- **Fix:** Add standard CSS links.

### P9-02: Docs pages canonical URLs use `.html` extension
- **Fix:** Remove `.html` from canonicals if Netlify serves clean URLs.

### P9-03: `pro/index.html` CTA buttons have `href="#"`
- **Fix:** Add proper fallback URLs or `role="button"` with JS-only behavior.

### P9-04: Manifest missing `maskable` icon with safe-zone padding
- **Fix:** Create a padded version of logo-mark for Android adaptive icons.

### P9-05: `formatters.js` `parseNum` doesn't handle European number format
- **File:** `assets/js/lib/formatters.js` (line 186)
- **Note:** Low priority since all tools target African markets using English number format.

### P9-06: `scholarship-matcher.js` silently swallows JSON parse errors
- **File:** `engines/scholarship-matcher.js` (line 243)
- **Fix:** Log error in catch block for debugging.

### P9-07: Loan Comparison all-equal highlighting
- **File:** `tools/loan-compare/index.html` (line 271)
- **Issue:** When all values are equal, all cells show green "best" — misleading.
- **Fix:** Skip highlighting when `minVal === maxVal`.

### P9-08: `ng-paye.js` redundant `isExempt` condition
- **File:** `assets/js/engines/ng-paye.js` (line 141)
- **Issue:** `&& tax === 0` is always true when `taxable <= 800000`. Redundant but harmless.
- **Fix:** Simplify to `const isExempt = taxable <= 800000;`.

### P9-09: Crypto Tax Nigeria uses `Math.min` (lower tax) instead of CGT rate
- **File:** `tools/crypto-tax/index.html` (lines 271–272)
- **Issue:** Shows lower of CGT vs income tax. Nigerian crypto gains are typically taxed at CGT rate (25%).
- **Fix:** Use `Math.max(cgtTax, incomeTax)` or always use CGT for Nigeria.

### P9-10: Senegal IPRES has no ceiling in francophone engine
- **File:** `engines/francophone-paye-engine.js` (line 65)
- **Issue:** `ceiling: 0` means no cap. IPRES general regime has a ceiling.
- **Fix:** Research and set the correct IPRES ceiling.

### P9-11: `!important` overrides fighting `global.css` typography
- **Files:** `auth-modal.css`, `japa-calculator.css`
- **Fix:** Remove `text-transform: uppercase` from `global.css` headings default, eliminating the need for `!important` overrides.

### P9-12: Multiple `<h1>` tags on 8 pages (print templates)
- **Fix:** Use `<h2>` or `<div class="print-title">` in print templates instead of `<h1>`.

---

## EXECUTION NOTES

1. **Work in priority order** (P0 first). Each section is independent.
2. **Test after each section** — especially P2 calculator fixes (verify with known tax figures).
3. **Batch operations** — P1-01 (wrong country names) and P4-04 (BOM stripping) can be done as batch find-and-replace.
4. **Don't create new files** unless absolutely necessary (P0-02 may require creating `_engines/index.js`).
5. **Verify PAYE math** against official tax authority publications before changing calculator formulas.
6. **Commit after each priority level** with descriptive messages.

---

*Total issues found: **95** across 10 categories*
*Estimated scope: P0–P1 (15 issues, critical), P2–P3 (21 issues, important), P4–P9 (59 issues, incremental)*
