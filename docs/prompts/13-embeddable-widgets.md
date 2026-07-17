# Prompt 13: Embeddable Calculator Widgets

## Context

Read these files first:
- Any PAYE calculator page (e.g., `nigeria/ng-salary-tax.html`)
- `assets/css/design-system.css` (design tokens)
- `assets/js/engines/ng-paye.js` (example engine)
- `netlify.toml` (headers, including X-Frame-Options)
- `_headers` (CORS and frame policy)

AfroTools calculators are embedded gold for African business blogs, HR portals, fintech sites, and news sites writing about tax changes. But currently there's no embed mode and `X-Frame-Options: SAMEORIGIN` blocks iframes.

## Objective

Create an **embed mode** for all calculator tools that strips chrome (navbar, footer, CTAs) and renders a clean, compact calculator suitable for `<iframe>` embedding. Provide embed code snippets for publishers.

### Embed URL Format

```
https://afrotools.com/nigeria/ng-salary-tax?embed=true&theme=light
```

Query params:
- `embed=true` — Activates embed mode
- `theme=light|dark` — Force light or dark theme
- `accent=#007AFF` — Custom accent color (hex)
- `lang=en|fr` — Language
- All existing tool params work too (e.g., `g=500000` for prefill)

### Embed Code Generator

Each tool page gets an "Embed This Tool" button (in the share menu or footer) that shows:

```html
<iframe
  src="https://afrotools.com/nigeria/ng-salary-tax?embed=true"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #e0e0e0;"
  title="Nigeria Salary Tax Calculator — AfroTools"
></iframe>
```

### Embed Mode Changes

When `?embed=true`:
- Hide: navbar, footer, breadcrumb, newsletter CTA, related tools, AI chat, cookie banner
- Show: calculator form + results only
- Add: Small "Powered by AfroTools" badge at bottom with link to full tool
- Add: `postMessage` API for parent page to listen for calculation events
- Resize: iframe auto-resizes height via `postMessage` to parent

### PostMessage API (for advanced integrations)

```js
// Parent page listens for results
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://afrotools.com') return;
  if (e.data.type === 'afrotools:calculation') {
    console.log(e.data.result); // { gross, net, tax, effectiveRate, ... }
  }
  if (e.data.type === 'afrotools:resize') {
    iframe.style.height = e.data.height + 'px';
  }
});
```

## Constraints

- Update `_headers` to allow framing ONLY for embed URLs: `X-Frame-Options` should be `DENY` for non-embed pages but absent for embed pages (use Netlify header rules with path matching)
- Add `Content-Security-Policy: frame-ancestors *` for embed URLs
- Embed mode CSS must be inline or bundled (external stylesheet may be blocked by embedder's CSP)
- "Powered by AfroTools" badge must be always visible and not removable via CSS override (use Shadow DOM or positioned overlay)
- Track embed usage: fire `tool_embedded` GA4 event with `referrer_domain` as param
- Follow design system tokens for the calculator UI within embed
- Embed height: auto-resize via `ResizeObserver` on the content container
- Max embed width: 100% (responsive within container)
- Min embed width: 320px (mobile-friendly)
- No cookies or localStorage in embed mode (avoid third-party cookie issues)
- Use `sessionStorage` or in-memory state only in embed mode
- Add `sandbox="allow-scripts allow-same-origin"` recommendation in embed code docs

## Implementation Steps

1. Create `assets/js/lib/embed-mode.js`:
   - Detect `?embed=true` URL param
   - If embed mode: hide chrome elements, add "Powered by" badge, setup postMessage, setup ResizeObserver
   - Apply custom theme/accent if provided
   - Disable cookie consent, newsletter CTA, chat panel
   - Override localStorage usage with in-memory fallback
   - Fire `tool_embedded` event with referrer info
2. Update `_headers` file:
   ```
   # Allow framing for embed URLs
   /*?embed=true
     X-Frame-Options: !ALLOWALL
     Content-Security-Policy: frame-ancestors *
   ```
   Note: Netlify doesn't support query-param matching in `_headers`. Instead, handle this in the embed-mode.js by removing the X-Frame-Options header via a Netlify function, or use a dedicated `/embed/` path.
3. Alternative approach — dedicated embed path:
   - Add redirect: `/embed/nigeria/ng-salary-tax → /nigeria/ng-salary-tax?embed=true 200`
   - Set `X-Frame-Options` header only for non-`/embed/` paths
4. Create `assets/js/components/embed-code-generator.js`:
   - Web component `<afro-embed-code>` that renders the code snippet
   - Copy-to-clipboard button
   - Preview iframe
   - Options: theme, accent color, language
5. Add "Embed" option to share button menu on each tool page
6. Create `/embed/docs/` page with integration documentation for publishers
7. Add `<afro-embed-code>` component to each tool page (inside share dropdown)
8. Run `npm run minify`

## Verification

- Add `?embed=true` to any tool URL → navbar, footer, CTAs should be hidden
- Only calculator + results + "Powered by AfroTools" badge visible
- Create test HTML with `<iframe>` → calculator should render inside iframe without X-Frame-Options error
- Calculate in iframe → check parent page receives `postMessage` with result data
- Resize browser → iframe content should be responsive
- Check that "Powered by AfroTools" badge is not removable via DevTools CSS
- Click "Embed" in share menu → copy code → paste in HTML file → should render correctly
- GA4 should show `tool_embedded` event with referrer domain
