# Prompt 16: Blog Inline Calculators

## Context

Read these files first:
- `blog/index.html` (blog hub — 130+ articles)
- Any blog article HTML (find one about Nigeria PAYE or tax changes)
- `assets/js/engines/ng-paye.js` (example engine)
- `assets/js/components/tool-registry.js` (tool catalog)
- `docs/ARCHITECTURE.md` (web component pattern)

The blog has 130+ articles about African tax, finance, and business. But articles about "Nigeria PAYE 2026 changes" don't embed the actual calculator. The reader has to navigate away to use the tool. Inline calculators within blog posts would dramatically increase tool usage and conversion.

## Objective

Create a **lightweight inline calculator web component** that can be dropped into any blog article with a single HTML tag. It renders a compact version of the full calculator directly within the article content flow.

### Usage in Blog Articles

```html
<p>The new Nigeria PAYE rates for 2026 changed the 24% band threshold. Let's see how this affects your salary:</p>

<afro-inline-calc tool="ng-salary-tax" country="NG"></afro-inline-calc>

<p>As you can see, employees earning above ₦3.2 million annually will notice the biggest change.</p>
```

### Component Behavior

- Renders a compact calculator card inline with blog content
- Input: salary field + Calculate button (minimal inputs)
- Output: net salary + effective tax rate (compact result)
- "See Full Breakdown →" link to the full tool page
- Width: 100% of blog content column
- Max height: 400px (expandable on click)
- Self-contained: loads its own engine script dynamically

### Component API

```html
<afro-inline-calc
  tool="ng-salary-tax"     <!-- required: tool slug -->
  country="NG"              <!-- required: country code -->
  prefill="500000"          <!-- optional: pre-filled salary -->
  period="monthly"          <!-- optional: default period -->
  compact="true"            <!-- optional: minimal result view -->
></afro-inline-calc>
```

## Constraints

- Web Component using Shadow DOM (styles must not leak into blog content and vice versa)
- IIFE pattern for component registration
- Dynamically load the required PAYE engine based on `country` attribute
- Must work even if the main design system CSS is not loaded (self-contained styles within Shadow DOM)
- Component script should be small (<5KB minified) — load engine lazily
- Follow existing web component patterns (navbar, footer use `connectedCallback`)
- Track: fire `inline_calc_used` GA4 event with tool slug and blog article URL
- The "See Full Breakdown" link should carry the calculation inputs as URL params (Prompt 09)
- Must not interfere with article reading flow — no modals, no full-page takeovers
- Mobile: full-width card, touch-friendly inputs
- Loading state: skeleton placeholder while engine loads

## Implementation Steps

1. Create `assets/js/components/inline-calc.js`:
   - Define `<afro-inline-calc>` custom element
   - `connectedCallback()`: read attributes, create Shadow DOM, render skeleton
   - Load engine script dynamically: `const script = document.createElement('script')`
   - Once engine loaded: render input form + Calculate button
   - On calculate: run engine, show compact result (net pay + effective rate)
   - "See Full Breakdown →" link with URL params
   - Self-contained CSS within Shadow DOM
2. Style the component (within Shadow DOM):
   - Card with subtle border, rounded corners
   - Input field + button on same row
   - Result: large net pay number + effective rate badge
   - "See Full Breakdown →" link styled as text link
   - Responsive: stack input/button vertically on mobile
   - Color scheme: inherit from `prefers-color-scheme` for dark mode compat
3. Add the component script to blog article template:
   - Add `<script src="/assets/js/components/inline-calc.min.js" defer></script>` to blog article pages
4. Add `<afro-inline-calc>` tags to relevant existing blog articles:
   - Find all blog articles about specific country tax topics
   - Add inline calculator with appropriate tool and country attributes
5. Run `npm run minify`

## Verification

- Open a blog article with inline calculator → compact calculator renders within article flow
- Enter salary → click Calculate → see net pay result inline
- Click "See Full Breakdown →" → navigates to full tool with inputs pre-filled
- Check GA4 → `inline_calc_used` event fires with correct params
- Test in dark mode → component should respect `prefers-color-scheme`
- Resize to mobile → card is full-width, inputs stack
- Inspect Shadow DOM → styles are encapsulated, no leaks
- Test with invalid tool slug → graceful error, no broken UI
