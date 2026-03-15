# CHANGELOG - Phase 1: Design System Foundation

**Date:** March 2026
**Goal:** Create a single source of truth for all visual design so every page looks like it belongs to the same product.

---

## New Files Created

### `/assets/css/design-system.css`
The comprehensive design system file — the ONE file new pages should import. Contains:
- **CSS Custom Properties (tokens):** All colors, typography, spacing, layout, radius, shadows, transitions, z-index
- **Base Reset & Typography:** Box-sizing, smooth scrolling, font rendering, heading/paragraph defaults
- **Layout Utilities:** `.container`, `.container--narrow`, `.container--wide`, `.container--tool`, `.section`, `.grid-2/3/4`, `.flex-center`, `.flex-between`, `.sr-only`, text utilities
- **Component Classes:** `.btn` (6 variants + 3 sizes), `.input`, `.select`, `.card`, `.card-hover`, `.badge` (5 colors), `.chip`, `.alert` (4 types), `.tooltip`, `.modal`, `.drawer`, `.skeleton`, `.divider`, `.tier-badge` (3 tiers)
- **Animation Classes:** `.fade-in`, `.slide-up`, `.rv` (legacy), `.pulse`, `.skeleton-loading`, `.spin`
- **Dark Mode:** Automatic via `prefers-color-scheme: dark`
- **Responsive Breakpoints:** Mobile-first with 640px, 768px, 1024px, 1280px
- **Reduced Motion:** Respects `prefers-reduced-motion: reduce`

### `/assets/css/tool-layout.css`
Standard layout system for ALL tool pages. Contains:
- **Page Structure:** `.tool-page`, `.tool-hero`, `.tool-main`, `.tool-grid`, `.two-col`
- **Breadcrumb:** `.breadcrumb` with on-dark styling
- **Form Components:** `.field`, `.f-label`, `.f-input`, `.f-prefix`, `.f-suffix`, `.presets`, `.mode-toggle`, `.toggles`, `.slider-wrap`, `.calc-btn`
- **Results Display:** `.results-card`, `.res-hero`, `.res-body`, `.res-row`, `.rate-bar-wrap`, `.rates-grid`, `.rate-card`
- **AI Advisor:** `.ai-card`, `.ai-head`, `.ai-body`, `.ai-chat`, `.ai-btn`
- **Bands/Tables:** `.bands-card`, `.band-row`, `.waterfall-bar`, `.band-detail-table`
- **Supporting:** `.compare-strip`, `.delta-box`, `.exempt-box`, `.disclaimer`, `.faq-sec`, `.legal-sources`
- **Actions:** `.action-row`, `.act-btn`, `.chart-section`, `.chart-tab`
- **Print & Responsive:** Print media query, breakpoints at 880px, 700px, 480px

### `/style-guide.html`
Living style guide that renders every design system component:
- Color swatches (Brand, Background, Text, Status, Accent)
- Typography scale with all 3 font families
- Spacing scale visualization
- Shadow & radius demos
- All button variants and sizes
- Input & select demos
- Card variants
- Badge, chip, and tier badge demos
- Alert types
- Skeleton loading demo
- Animation class reference
- Utility class reference

---

## Files Updated

### Brand Color Migration: Blue (#0071E3) to Green (#5ddb9e)

The entire codebase was migrated from an incorrectly-set blue brand (#0071E3) to the correct AfroTools green (#5ddb9e):

- **286 HTML files:** All `#0071E3` replaced with `#5ddb9e`
- **46 HTML files:** All `#60B5FF` (lighter blue) replaced with `#5ddb9e`
- **9 CSS files:** All blue references replaced with green
- **22 JS files:** All blue color references replaced with green
- **RGB values:** `0,113,227` replaced with `93,219,158` across all files

### `/assets/css/tokens.css`
- Brand color corrected: `--_green-600: #5ddb9e` (was `#0071E3`)
- Added design system aliases: `--color-primary`, `--color-primary-rgb`, `--color-secondary`
- Added new tokens: `--color-bg-dark-alt`, `--color-bg-card`, `--color-border-subtle`, `--color-warning`, `--color-info`
- Added font tokens: `--font-heading` (Instrument Serif), `--font-mono` (JetBrains Mono)
- Updated spacing: Added `--space-xs/sm/md/lg/xl/2xl/3xl` named aliases
- Updated radii: Increased from 3/5/8/12px to 6/10/16/24px
- Updated shadows: Aligned with design-system.css values
- Updated transitions: Changed to `150ms/250ms/350ms` format
- Added dark mode media query
- Added `--ease-out-expo` and `--ease-spring` easing tokens

### `/assets/css/tokens.min.css`
- Regenerated from updated tokens.css

### `/assets/css/global.css`
- Updated header comment noting backward compatibility role

### `/assets/css/global.min.css`
- Regenerated from updated global.css

### `/assets/css/calculator.css`
- All `#0071E3` fallback values replaced with `#5ddb9e`
- All `0,113,227` RGB values replaced with `93,219,158`

### `/assets/css/calculator.min.css`
- Regenerated from updated calculator.css

### `/assets/css/paye-tool.css`
- All `#0071E3` fallback values replaced with `#5ddb9e`
- All `0,113,227` RGB values replaced with `93,219,158`
- Fixed `.calc-btn:hover` background from `#005bb5` (blue) to `#4cc98a` (green)

### `/assets/css/currency-converter.css`
- All `#0071E3` replaced with `#5ddb9e`

### `/assets/css/vat-calculator.css`
- All `#0071E3` replaced with `#5ddb9e`

### `/assets/css/import-duty.css`
- All `#0071E3` replaced with `#5ddb9e`

### `/assets/css/invoice-generator.css`
- All `#0071E3` replaced with `#5ddb9e`

### `/assets/css/japa-calculator.css`
- All `#0071E3` replaced with `#5ddb9e`

### `/assets/css/dashboard.css`
- All `#0071E3` replaced with `#5ddb9e`

### `/assets/js/lib/pdf-template.js`
- Brand color RGB array corrected: `[93, 219, 158]` (was `[0, 113, 227]`)

---

## Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#5ddb9e` | Primary brand green |
| `--color-secondary` | `#008751` | Secondary dark green |
| `--color-bg-dark` | `#0c1a10` | Dark backgrounds |
| `--color-bg` | `#FAFAF8` | Page background |
| `--color-text` | `#0f172a` | Body text |
| `--color-text-muted` | `#64748b` | Secondary text |
| `--font-heading` | Instrument Serif | Display/headings |
| `--font-body` | DM Sans | Body text |
| `--font-mono` | JetBrains Mono | Code/numbers |

---

## Architecture Decision

Rather than forcing all 254+ pages to change their `<link>` tags, we:
1. Created `design-system.css` as the comprehensive new-page standard
2. Updated `tokens.css` + `global.css` as backward-compatible thin files that provide the same tokens
3. Future pages import `design-system.css` directly
4. Existing pages continue working through `tokens.css` + `global.css` (now aligned)
