# Adding a New Tool to AfroTools

## Quick Reference

1. Create the engine (if calculator)
2. Create the HTML page
3. Add to tool registry
4. Test
5. Deploy

---

## Step 1: Create the Calculation Engine (optional)

If your tool involves calculations, create a pure function engine:

```
/assets/js/engines/{country-code}-{type}.js
```

**Template:**
```js
(function (window) {
  'use strict';

  function calculate(input, opts) {
    // Pure function: no DOM, no side effects
    return {
      input,
      result: /* ... */,
      breakdown: [],
    };
  }

  function validate(input) {
    if (!input || isNaN(input) || input <= 0) {
      return { valid: false, error: 'Please enter a valid amount' };
    }
    return { valid: true, error: null };
  }

  const engine = {
    calculate,
    validate,
    country: 'CountryName',
    currency: 'CUR',
    id: 'xx-type',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.xxType = engine;
})(window);
```

**Add tests** in `/tests/engines/xx-type.test.js`.

---

## Step 2: Create the HTML Page

**For country-specific tools:**
```
/{country-slug}/{tool-id}.html
```

**For pan-African tools:**
```
/tools/{tool-slug}/index.html
```

**Required `<head>` elements:**
```html
<title>{Tool Name} — AfroTools</title>
<meta name="description" content="{150-160 char unique description}">
<link rel="canonical" href="https://afrotools.com/{path}">
<meta property="og:title" content="{Tool Name} — AfroTools">
<meta property="og:description" content="{description}">
<meta property="og:image" content="https://afrotools.com/assets/img/og/og-default.png">
<link rel="stylesheet" href="/assets/css/design-system.css">
```

**Required scripts (in `<head>`):**
```html
<script src="/assets/js/components/tool-registry.js"></script>
<script src="/assets/js/components/navbar.min.js?v=e84bb500" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/lib/seo.js" defer></script>
<script src="/assets/js/lib/error-boundary.js"></script>
```

**Required components (in `<body>`):**
```html
<afro-navbar></afro-navbar>
<afro-breadcrumb></afro-breadcrumb>
<!-- Tool content -->
<afro-footer></afro-footer>
```

**Priority money tool commercial CTA:**

For high-intent salary, tax, invoice, payroll, import, remittance, employer-cost, and other money tools, load the shared business CTA component and place it near the end of the page before related tools or the footer:

```html
<script src="/assets/js/components/business-cta.js" defer></script>
```

```html
<afro-business-cta
  tool-name="Nigeria PAYE Calculator"
  save-note="Save named salary scenarios or use the PDF report action after calculating."></afro-business-cta>
```

Use the shared component instead of writing one-off CTA blocks. The component routes commercial actions to `/widgets/`, `/sponsored-tools/`, `/api/`, and `/custom-calculators/`.

---

## Step 3: Add to Tool Registry

Edit `/assets/js/components/tool-registry.js`:

```js
{ id: 'xx-tool', name: 'Tool Name', icon: '🔧',
  desc: 'Description (50-100 chars for card display).',
  href: '/path/to/tool',
  category: 'financial',  // Must be in AFRO_CATEGORIES
  tier: 'T2',             // T1 (AI), T2 (standard), T3 (simple)
  status: 'live',         // live, new, queued, planned
  phase: 'LIVE',
  countries: ['NG'],      // ISO codes, or ['ALL'] for pan-African
  revenue: 'Freemium',
  estTraffic: 1000,
  estRevenue: 30,
  priority: 75 },
```

---

## Step 4: Test

```bash
# Run calculation engine tests
node tests/run.js

# Validate registry integrity
node scripts/validate-registry.js

# Regenerate sitemap
node scripts/generate-sitemap.js

# Check performance budgets
node scripts/perf-audit.js
```

---

## Step 5: Deploy

```bash
git add .
git commit -m "feat(tools): add {tool-name}"
git push
# Netlify auto-deploys from main (< 60s)
```

---

## Checklist

- [ ] Engine created (if calculator) with `calculate()` and `validate()`
- [ ] Tests written and passing
- [ ] HTML page created with proper `<head>` meta tags
- [ ] `<afro-navbar>`, `<afro-breadcrumb>`, `<afro-footer>` included
- [ ] Tool added to registry with all required fields
- [ ] Registry validation passes (`node scripts/validate-registry.js`)
- [ ] Sitemap regenerated (`node scripts/generate-sitemap.js`)
- [ ] Page renders correctly in browser
- [ ] Console has no errors
