# AfroTools Architecture

## System Overview

AfroTools is a plain HTML/CSS/JS web application with no build tools, no frameworks, and no bundler. It deploys automatically to Netlify from the GitHub `main` branch.

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ HTML Page │  │ Design   │  │ Tool     │  │ Web      │   │
│  │           │  │ System   │  │ Registry │  │ Component│   │
│  │ (per tool)│  │ CSS      │  │ (global) │  │ (navbar/ │   │
│  │           │  │          │  │          │  │  footer) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │              │             │              │         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   JS Libraries                       │   │
│  │  currency │ formatters │ validators │ analytics      │   │
│  │  storage  │ a11y       │ seo        │ interactions   │   │
│  │  error-boundary │ dark-mode │ toast │ share-state    │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Calculation Engines                      │   │
│  │  ng-paye │ ke-paye │ gh-paye │ za-paye              │   │
│  │  eg-paye │ tz-paye │ (pure functions, no DOM)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │   Netlify     │
                    │  Functions    │
                    │  (ai-advisor) │
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │  Anthropic    │
                    │  Claude API   │
                    └───────────────┘
```

## File Structure

```
afrotools/
├── index.html                       # Homepage
├── 404.html                         # Custom 404 page
├── offline.html                     # Service worker offline fallback
├── robots.txt                       # Search engine directives
├── sitemap.xml                      # Auto-generated from registry
├── service-worker.js                # Cache-first for assets, network-first for HTML
├── _redirects                       # Netlify URL rewrites and redirects
│
├── assets/
│   ├── css/
│   │   ├── design-system.css        # THE design system (tokens, typography, components)
│   │   ├── skeleton.css             # Loading state animations
│   │   ├── tool-layout.css          # Shared calculator page layout
│   │   ├── calculator.css           # Calculator-specific styles
│   │   └── [tool-specific].css      # Per-tool overrides (minimal)
│   │
│   ├── js/
│   │   ├── components/
│   │   │   ├── tool-registry.js     # Single source of truth for all 366+ tools
│   │   │   ├── navbar.js            # <afro-navbar> web component
│   │   │   ├── footer.js            # <afro-footer> web component
│   │   │   ├── breadcrumb.js        # <afro-breadcrumb> (auto path-based)
│   │   │   ├── faq.js               # <afro-faq> (accessible accordion)
│   │   │   └── country-tools.js     # <afro-country-tools> (registry-powered)
│   │   │
│   │   ├── lib/
│   │   │   ├── currency.js          # AfroTools.currency — 54 African currencies
│   │   │   ├── formatters.js        # AfroTools.fmt — numbers, dates, compact
│   │   │   ├── validators.js        # AfroTools.validate — salary, email, range
│   │   │   ├── analytics.js         # AfroTools.analytics — GA4 event tracking
│   │   │   ├── storage.js           # AfroTools.store — localStorage with TTL
│   │   │   ├── a11y.js              # AfroTools.a11y — focus trap, live regions
│   │   │   ├── seo.js               # AfroTools.seo — auto meta tag injection
│   │   │   ├── interactions.js      # AfroTools.ux — animations, debounce, haptics
│   │   │   ├── dark-mode.js         # AfroTools.darkMode — manual toggle
│   │   │   ├── error-boundary.js    # AfroTools.errors — global error handlers
│   │   │   ├── toast.js             # AfroTools.toast — notification system
│   │   │   ├── share-state.js       # AfroTools.shareState — URL encoding
│   │   │   ├── pdf-template.js      # AfroTools.pdf — jsPDF templates
│   │   │   └── calculate-animation.js # AfroTools.anim — calc animations
│   │   │
│   │   ├── engines/
│   │   │   ├── ng-paye.js           # Nigeria PAYE (PITA + NTA)
│   │   │   ├── ke-paye.js           # Kenya PAYE (NSSF, SHIF, AHL)
│   │   │   ├── gh-paye.js           # Ghana PAYE (SSNIT, GRA bands)
│   │   │   ├── za-paye.js           # South Africa PAYE (SARS 2025/26)
│   │   │   ├── eg-paye.js           # Egypt PAYE (bracket exclusion)
│   │   │   └── tz-paye.js           # Tanzania PAYE (TRA, NSSF/PSSSF)
│   │   │
│   │   └── utils.js                 # Backward-compat delegation layer
│   │
│   └── img/                         # Images, icons, OG images
│
├── nigeria/                         # Country: PAYE calculator + hub page
│   ├── index.html                   # Country hub
│   └── ng-salary-tax.html           # PAYE calculator
├── kenya/                           # Same pattern...
├── [50+ country directories]/
│
├── tools/                           # Non-country tools
│   ├── pdf-workspace/
│   ├── japa-calculator/
│   ├── medical-report/
│   └── [other tools]/
│
├── salary-tax/                      # Category pages
├── document-pdf/
├── [other categories]/
│
├── admin/
│   └── dashboard.html               # Internal admin dashboard
│
├── netlify/
│   └── functions/
│       └── ai-advisor.js            # Anthropic API proxy with rate limiting
│
├── tests/
│   ├── run.js                       # Test runner (214 tests)
│   └── engines/                     # Per-engine test files
│
├── scripts/
│   ├── generate-sitemap.js          # Auto-generates sitemap.xml
│   ├── validate-registry.js         # Checks registry integrity
│   └── perf-audit.js                # Performance budget checks
│
├── docs/
│   ├── ARCHITECTURE.md              # This file
│   ├── ADDING-A-TOOL.md             # Step-by-step guide
│   ├── ADDING-A-COUNTRY.md          # Step-by-step guide
│   └── tax-sources.md               # Legislation references
│
└── CHANGELOG-PHASE-[1-10].md        # Phase documentation
```

## Module Pattern

All JS modules use the IIFE + `window.AfroTools.*` pattern:
```js
(function () {
  'use strict';
  // Module code...
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.moduleName = { /* exports */ };
})();
```

**Why not ES modules?** The codebase predates any build step. IIFEs are load-order tolerant, work in all browsers, and can be loaded with `<script>` tags without `type="module"`.

## Registry-Ready Pattern

All pages that consume `AFRO_TOOLS` use the guaranteed rendering pattern:
```js
function _initPageName() { /* rendering code */ }
if (typeof onRegistryReady === 'function') {
  onRegistryReady(_initPageName);
} else {
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof AFRO_TOOLS !== 'undefined') _initPageName();
    else document.addEventListener('afrotools:registry-ready', _initPageName);
  });
}
```

## Data Flow

1. **tool-registry.js** loads synchronously → defines `AFRO_TOOLS` global array
2. **tool-registry.js** dispatches `afrotools:registry-ready` CustomEvent
3. **Page JS** listens for event or checks `onRegistryReady()` → renders tool cards, stats
4. **Web components** (`<afro-navbar>`, `<afro-country-tools>`) read from `AFRO_TOOLS` in their `connectedCallback()`, re-render on registry-ready if needed

## Deployment

```
Local edit → git add → git commit → git push → Netlify auto-deploy (< 60s)
```

Netlify builds are instant (no build step). The `_redirects` file handles URL routing.
