# CHANGELOG - Phase 3: Component System Upgrade

**Date:** March 2026
**Goal:** Upgrade existing web components and create new reusable components to reduce per-page boilerplate.

---

## Files Created

### `/assets/js/components/breadcrumb.js`
Web component `<afro-breadcrumb>` with Shadow DOM:
- **Auto-generates** breadcrumb trail from `window.location.pathname`
- **`SLUG_OVERRIDES`** map with 40+ pretty names for tools, countries, categories
- **`dark`** attribute for light text on dark hero sections
- **`home`** attribute for custom home label
- **`labels`** attribute for JSON slug overrides
- **Schema.org BreadcrumbList** structured data injection via `<script type="application/ld+json">`

### `/assets/js/components/faq.js`
Web component `<afro-faq>` with Shadow DOM:
- **Accessible accordion**: `aria-expanded`, `aria-controls`, `role="region"`
- **Two data modes**: `items` JSON attribute or `<div data-q="...">` child elements
- **Plus → X icon** animation (45° rotation on open)
- **Schema.org FAQPage** structured data injection
- **Attributes**: `title`, `cols` ("1" or "2"), `schema` ("false" to disable)
- **Dark mode** via `@media (prefers-color-scheme: dark)`
- **Responsive**: collapses to 1 column at 700px

### `/assets/js/components/country-tools.js`
Web component `<afro-country-tools>` with Shadow DOM:
- **Reads from `AFRO_TOOLS` registry** — single source of truth
- **Country filtering**: shows tools matching a country code + optional pan-African tools
- **Category filter pills**: interactive pills to filter by tool category (auto-generated)
- **Smart sorting**: country-specific tools first, then by priority descending
- **Status filtering**: defaults to 'live' tools only, `status="all"` shows everything
- **Attributes**: `country`, `category`, `max`, `show-pan`, `title`, `cols`, `status`
- **Responsive grid**: 3→2→1 columns at breakpoints
- **Dark mode** support
- Graceful empty state when no tools match

---

## Files Updated

### `/assets/js/components/navbar.js`
- **Active page indicator**: `.lnk.active` CSS with green underline dot
- **Recently used tools**: tracks last 5 tools via localStorage (`aft_recent_tools`)
- Active page detection by matching `window.location.pathname` against nav link hrefs
- Recent tools displayed in search overlay when search input is empty
- CSS for `.search-section-label`, `.recent-clear`

### `/assets/js/components/footer.js`
- **4th column**: Legal links (Privacy Policy, Terms of Use, Sitemap)
- **Grid expanded** from `repeat(3, 1fr)` to `repeat(4, 1fr)`
- **Social links section**: Twitter, LinkedIn, GitHub with hover styles
- **"Built with ♥ for Africa"** tagline
- CSS for `.social a` and `.built-with`

---

## Component Summary

| Component | Tag | Purpose |
|-----------|-----|---------|
| Navbar | `<afro-navbar>` | Updated: active page + recent tools |
| Footer | `<afro-footer>` | Updated: 4-col + social + legal |
| Breadcrumb | `<afro-breadcrumb>` | New: auto path-based breadcrumbs + Schema.org |
| FAQ | `<afro-faq>` | New: accessible accordion + Schema.org |
| Country Tools | `<afro-country-tools>` | New: registry-powered tool cards by country |

---

## Usage Examples

### Breadcrumb
```html
<afro-breadcrumb></afro-breadcrumb>
<!-- Auto-generates from URL: Home > Nigeria > PAYE Calculator -->

<afro-breadcrumb dark home="AfroTools"></afro-breadcrumb>
<!-- Light text for dark hero sections -->
```

### FAQ
```html
<afro-faq items='[{"q":"What is PAYE?","a":"Pay As You Earn..."}]'></afro-faq>

<afro-faq cols="1" title="Tax Questions">
  <div data-q="How is tax calculated?">Tax is calculated using progressive bands...</div>
</afro-faq>
```

### Country Tools
```html
<afro-country-tools country="NG"></afro-country-tools>
<!-- Shows all live Nigeria tools + pan-African tools -->

<afro-country-tools country="KE" category="financial" max="6"></afro-country-tools>
<!-- Kenya financial tools only, max 6 cards -->

<afro-country-tools country="GH" show-pan="false"></afro-country-tools>
<!-- Ghana-specific tools only, no pan-African -->
```
