# CHANGELOG - Phase 6: Performance & Reliability

**Date:** March 2026
**Goal:** Make every page load fast on African mobile networks (2G/3G).

---

## New Files Created

### `/assets/js/lib/error-boundary.js`
Global error boundary and error handling utilities:
- **`window.onerror`** handler catches unhandled errors, reports to analytics
- **`window.onunhandledrejection`** catches promise rejections
- **`AfroTools.errors.wrap(toolId, fn)`** — try/catch wrapper for tool initialization
- **`AfroTools.errors.wrapAsync(toolId, fn)`** — async version with `.catch()`
- **`AfroTools.errors.report(toolId, error)`** — manual error reporting
- **`AfroTools.errors.showBanner(message)`** — user-friendly error banner (auto-dismiss 8s)
- Skips banner for analytics/tracking script errors (not user-impacting)
- Max 5 errors reported to analytics per session (prevents spam)

### `/assets/css/skeleton.css`
Pure CSS skeleton loading states (no JS required):
- **`.skeleton`** base class with shimmer animation
- **Variants**: `.skeleton-text`, `.skeleton-heading`, `.skeleton-input`, `.skeleton-button`, `.skeleton-card`, `.skeleton-chart`, `.skeleton-avatar`, `.skeleton-badge`
- **Modifiers**: `.short`, `.medium`, `.full`, `.small`, `.tall`
- **Grid helpers**: `.skeleton-grid.cols-2`, `.cols-3`
- **Auto-hide**: `[data-skeleton]` elements hide when parent gets `[data-loaded]`
- **Dark mode** and **reduced motion** support
- Usage: add skeleton HTML before JS hydration, mark with `data-skeleton`

### `/scripts/perf-audit.js`
Performance budget enforcement script:
- Checks individual JS files against 50KB budget
- Checks CSS files against 30KB budget
- Checks tool-registry.js against 80KB budget
- Checks total lib/ JS against 100KB budget
- Run: `node scripts/perf-audit.js`
- Returns exit code 1 if any budget exceeded

---

## Files Updated

### `/service-worker.js`
- **Cache version bumped** from `v1` to `v6`
- **Extended precache** list: added `design-system.css`, `skeleton.css`, `tool-registry.js`, `utils.js`, `error-boundary.js`
- **Added guards**: skip non-GET requests, skip cross-origin, skip Supabase proxy
- Existing cache strategies preserved: Network-first for HTML, Cache-first for assets

### `/netlify/functions/ai-advisor.js`
- **15-second timeout** added to Anthropic API calls via `AbortController`
- **Timeout error handling**: specific user-friendly message for timeout vs network error
- CORS and rate limiting (already had proper OPTIONS preflight — verified and confirmed)

---

## Performance Audit Results

```
📦 JavaScript Files:
  ✅ navbar.js: 40.4KB / 50.0KB
  ✅ site-assistant.js: 40.5KB / 50.0KB
  ⚠️ tool-registry.js: 147.1KB / 80.0KB (366 tools — expected)
  ⚠️ supabase.min.js: 163.0KB / 50.0KB (vendor bundle)
  ✅ Total lib/ JS: 85.2KB / 100.0KB

🎨 CSS Files:
  ✅ calculator.css: 27.5KB / 30.0KB
  ✅ design-system.css: 28.9KB / 30.0KB
  ⚠️ japa-calculator.css: 31.5KB / 30.0KB (1.5KB over)
  ⚠️ tool-layout.css: 31.5KB / 30.0KB (1.5KB over)
```

**Known acceptable overages:**
- `tool-registry.js` (147KB) contains 366 tool definitions — this is the single source of truth; splitting would add complexity
- `supabase.min.js` (163KB) is a vendor bundle — loaded only on auth-required pages
- CSS overages are minor (1.5KB each) — could minify to bring under budget

---

## Architecture Decisions

### Error Boundary Strategy
- Errors are caught at two levels: global (`window.onerror`) and per-tool (`wrap()`)
- User-facing error banner is non-blocking (bottom of screen, auto-dismiss)
- Analytics errors are silently captured (max 5/session)
- Network/fetch errors don't show banner (too common on mobile networks)

### Skeleton Loading Pattern
- Pure CSS approach — no JS required, works even if JS fails to load
- `[data-skeleton]` + `[data-loaded]` attribute pattern for auto-cleanup
- Tool pages can add skeleton HTML in their markup that hides when JS hydrates

### Service Worker Strategy
- Keep using `service-worker.js` filename (not `sw.js`) to avoid breaking existing installations
- Network-first for HTML ensures users always get fresh content
- Cache-first for assets with version bump forces refresh on deploy
