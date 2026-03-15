# CHANGELOG - Phase 4: Tool Registry & Routing Fix

**Date:** March 2026
**Goal:** Make the tool registry bulletproof and fix all dynamic rendering failures.

---

## Root Cause Analysis

The "Loading…" and "—" placeholders on category pages, country hubs, and the all-tools page were caused by a **race condition** between `tool-registry.js` loading and page-specific rendering code:

1. **Category pages** used `if(typeof AFRO_TOOLS==='undefined')return;` — a silent failure with no retry
2. **All-tools page** used `setTimeout(initAllTools, 50)` polling — inefficient and unreliable
3. **Country hubs** had `defer` on `tool-registry.js` but `DOMContentLoaded` handlers assumed it was loaded

The registry defined `AFRO_TOOLS` as a global variable but **never signaled** when it was ready.

---

## Fix: Registry-Ready Event Pattern

### `tool-registry.js` — New Event Dispatch

Added at the end of tool-registry.js:

```js
// Global helper: guaranteed rendering regardless of load order
function onRegistryReady(callback) {
  if (typeof AFRO_TOOLS !== 'undefined' && AFRO_TOOLS.length > 0) {
    callback(AFRO_TOOLS);
  } else {
    document.addEventListener('afrotools:registry-ready', function handler(e) {
      document.removeEventListener('afrotools:registry-ready', handler);
      callback(e.detail.tools);
    });
  }
}

// Dispatch event when registry is ready
document.dispatchEvent(new CustomEvent('afrotools:registry-ready', {
  detail: { tools: AFRO_TOOLS, categories: AFRO_CATEGORIES }
}));
```

Works regardless of load order:
- If registry already loaded → `onRegistryReady(cb)` fires immediately
- If registry loads later → callback fires on `afrotools:registry-ready` event

---

## Files Updated

### `assets/js/components/tool-registry.js`
- Added `onRegistryReady(callback)` global helper function
- Added `afrotools:registry-ready` CustomEvent dispatch
- Event fires on DOMContentLoaded or immediately if DOM already parsed

### `assets/js/components/country-tools.js`
- Added registry-ready event listener in `connectedCallback()`
- Component re-renders when registry becomes available (handles load-order race)

### `all-tools/index.html`
- **Before:** `setTimeout(initAllTools, 50)` polling loop
- **After:** `onRegistryReady(renderTools)` with fallback

### Category Pages (9 files fixed)
All converted from silent-return pattern to `onRegistryReady` pattern:

| File | Init Function |
|------|---------------|
| `salary-tax/index.html` | `_initSalaryTax` |
| `document-pdf/index.html` | `_initDocPdf` |
| `image-design/index.html` | `_initImageDesign` |
| `developer-tools/index.html` | `_initDeveloper` |
| `education/index.html` | `_initEducation` |
| `health/index.html` | `_initHealth` |
| `vat-business-tax/index.html` | `_initVatBusiness` |
| `business-roi/index.html` | `_initBusinessRoi` |
| `language/index.html` | `_initLanguage` |
| `engineering/index.html` | `_initEngineering` |

### Country Hub Pages (6 files fixed)
All converted from fragile `typeof` checks to `onRegistryReady` pattern:

| File | Init Function |
|------|---------------|
| `nigeria/index.html` | `_initNgHub` |
| `kenya/index.html` | `_initKeHub` |
| `ghana/index.html` | `_initGhHub` |
| `south-africa/index.html` | `_initZaHub` |
| `egypt/index.html` | `_initEgHub` |
| `tanzania/index.html` | `_initTzHub` |

Country hubs also had `defer` removed from `tool-registry.js` script tag for faster synchronous loading.

---

## Trailing Slash Audit

### Registry URLs ✅
- All 54 PAYE calculator hrefs: NO trailing slash (correct for file-based pages)
- All 12 category hrefs in AFRO_CATEGORIES: trailing slash (correct for directory pages)
- All `/tools/*` directory entries: trailing slash (correct)
- All `/tools/*` file entries: no trailing slash (correct)

### Netlify `_redirects` ✅
- All category pages already handle both with/without trailing slash (200 rewrites)
- SEO redirects in place for old URL patterns (301)

---

## Architecture Decision

### Three-Way Init Pattern
Every consuming page now uses this standardized pattern:

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

This handles all timing scenarios:
1. **Registry loaded first** → `onRegistryReady` fires callback immediately
2. **DOM ready, registry pending** → listens for `afrotools:registry-ready` event
3. **Both loaded** → `onRegistryReady` fires immediately (most common case)
4. **`onRegistryReady` not available** → falls back to event-based pattern
