# Prompt 04: JavaScript Bundle Strategy

## Context

Read these files first:
- `docs/ARCHITECTURE.md` (current IIFE pattern, no build tools)
- `assets/js/components/` (list all files — currently 36+ separate JS files)
- `assets/js/lib/` (list all utility files)
- Any tool page HTML (e.g., `nigeria/ng-salary-tax.html`) to see current `<script>` loading
- `package.json` (existing build scripts)
- `scripts/minify.js` (current minification process)

Currently every page loads 15-25+ individual `<script>` tags for components and libraries. Each is a separate HTTP request even with HTTP/2 multiplexing. The minified versions exist but aren't bundled.

## Objective

Create a smart bundling strategy that combines critical JS into 2-3 bundles while maintaining the no-framework, IIFE architecture. Do NOT introduce webpack, vite, or any framework bundler. Use simple concatenation with the existing minification pipeline.

### Bundle Architecture

```
assets/js/bundles/
├── core.min.js          (~15KB) — loads on EVERY page
│   ├── storage.js
│   ├── analytics.js
│   ├── currency.js
│   ├── formatters.js
│   ├── validators.js
│   ├── error-boundary.js
│   ├── toast.js
│   ├── dark-mode.js
│   ├── a11y.js
│   └── cookie-consent.js
│
├── tool-page.min.js     (~20KB) — loads on calculator pages only
│   ├── share-state.js
│   ├── share-button.js (share-result-button component)
│   ├── pdf-template.js (pdf-export)
│   ├── email-gate.js
│   ├── calculate-animation.js
│   ├── interactions.js
│   ├── newsletter-cta.js
│   ├── related-tools.js
│   └── save-result-button.js
│
├── dashboard.min.js     (~12KB) — loads on dashboard pages only
│   ├── afro-auth.js
│   ├── afro-history.js
│   ├── afro-vault.js
│   └── pro-gate.js
│
└── chat.min.js          (~8KB) — lazy-loaded when AI chat opened
    ├── chat-panel.js
    └── site-assistant.js
```

### Loading Strategy

```html
<!-- Every page -->
<script src="/assets/js/bundles/core.min.js" defer></script>
<script src="/assets/js/components/navbar.min.js?v=e84bb500" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/components/tool-registry.min.js" defer></script>

<!-- Tool pages only -->
<script src="/assets/js/bundles/tool-page.min.js" defer></script>

<!-- Dashboard pages only -->
<script src="/assets/js/bundles/dashboard.min.js" defer></script>

<!-- AI chat (lazy loaded on demand) -->
<!-- loaded via dynamic import when chat icon clicked -->
```

## Constraints

- NO new build tools or bundlers — use Node.js script that concatenates + minifies
- Maintain the IIFE pattern — each file's IIFE must remain intact within the bundle
- Maintain `window.AfroTools.*` namespace — bundling must not break module references
- Order matters: `storage.js` before `analytics.js` (analytics depends on storage)
- Individual minified files must STILL exist for pages that only need one component
- The bundle script must be added to `package.json` scripts as `npm run bundle`
- `npm run build` must call `npm run bundle` after `npm run minify`
- Cache busting: append content hash to bundle filename (e.g., `core.a1b2c3.min.js`)
- The service worker (`service-worker.js`) must be updated to precache bundles instead of individual files
- Web components (`navbar.js`, `footer.js`, `breadcrumb.js`) stay as individual files since they define custom elements and must load independently

## Implementation Steps

1. Create `scripts/bundle.js`:
   - Read bundle definitions (which files go in which bundle)
   - For each bundle: read source files in order, concatenate, minify with esbuild or terser
   - Generate content hash from output
   - Write to `assets/js/bundles/[name].[hash].min.js`
   - Write a manifest JSON (`assets/js/bundles/manifest.json`) mapping bundle names to hashed filenames
2. Create `scripts/update-html-bundles.js`:
   - Read manifest.json
   - Find all HTML files that reference individual component scripts
   - Replace individual `<script>` tags with bundle `<script>` tags
   - Keep page-specific engine scripts (e.g., `ng-paye.js`) as individual loads
3. Update `package.json`:
   - Add `"bundle": "node scripts/bundle.js && node scripts/update-html-bundles.js"`
   - Update `"build"` to include bundle step
4. Update `service-worker.js`:
   - Replace individual file paths in precache list with bundle paths
   - Read from manifest.json for cache busting
5. Add lazy loading for chat bundle:
   - In the chat trigger button's click handler, dynamically load `chat.min.js`
   - `const script = document.createElement('script'); script.src = '/assets/js/bundles/chat.[hash].min.js';`

## Verification

- Run `npm run bundle` → confirm bundles created in `assets/js/bundles/`
- Open any tool page → DevTools Network → confirm 2-3 bundle requests instead of 15+
- Verify all `window.AfroTools.*` modules are accessible in console
- Test calculator functionality → confirm calculations still work
- Test PDF export → confirm email gate + PDF generation works
- Test AI chat → confirm lazy loading triggers on chat icon click
- Run Lighthouse → confirm improved Performance score (fewer requests, smaller total JS)
- Test service worker → confirm offline capability still works with bundles
