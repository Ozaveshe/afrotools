# Prompt 08: Next Step Engine (Post-Calculation Workflow)

## Context

Read these files first:
- `assets/js/components/related-tools.js` (current related tools component)
- `assets/js/components/tool-registry.js` (AFRO_TOOLS array — the complete tool catalog)
- Any PAYE calculator page (e.g., `nigeria/ng-salary-tax.html`) to see how results display
- `docs/PLATFORM_STANDARDS.md` (naming conventions, `RESULT` global variable)
- `assets/css/design-system.css` (design tokens)

Currently after a calculation completes, the user sees results + a generic "Related Tools" section that shows tools from the same category. There's no contextual workflow — no "Now do X with these numbers."

## Objective

Build a **Next Step Engine** — a smart post-calculation component that suggests the logical next action based on the current tool and result. It pre-fills data from the current calculation into the suggested tool's URL.

### Workflow Map

Define these tool-to-tool workflows:

```js
const WORKFLOWS = {
  // PAYE → Budget Planner (with net salary pre-filled)
  'ng-salary-tax': [
    { tool: 'budget-planner', label: 'Plan your monthly budget', prefill: { income: 'RESULT.net.monthly' } },
    { tool: 'loan-calculator', label: 'See how much you can borrow', prefill: { income: 'RESULT.net.monthly' } },
    { tool: 'ng-vat', label: 'Calculate VAT on purchases', prefill: {} },
    { tool: 'investment-calculator', label: 'Invest your savings', prefill: { monthly_amount: 'RESULT.net.monthly * 0.1' } }
  ],
  // VAT → Profit Margin (with VAT-inclusive price)
  'ng-vat': [
    { tool: 'profit-margin', label: 'Calculate your profit margin', prefill: { cost: 'RESULT.vatAmount' } },
    { tool: 'break-even', label: 'Find your break-even point', prefill: {} },
    { tool: 'business-roi', label: 'Calculate business ROI', prefill: {} }
  ],
  // Forex → Send Money comparison
  'forex-converter': [
    { tool: 'remittance-calculator', label: 'Compare remittance fees', prefill: { amount: 'RESULT.amount', from: 'RESULT.fromCurrency', to: 'RESULT.toCurrency' } }
  ],
  // Apply same pattern for all major tool types...
  // Use '_default' for tools without specific workflows
  '_default': [
    { tool: 'ai-advisor', label: 'Ask AI for advice on this result', prefill: {} }
  ]
};
```

### UI Component: `<afro-next-steps>`

A web component that renders after the result card, showing 2-3 contextual next steps as clickable cards with icons and pre-filled links.

```html
<afro-next-steps tool="ng-salary-tax"></afro-next-steps>
```

Visual design:
- Appears below the result breakdown, above the existing related-tools section
- Header: "What's Next?" with a → arrow icon
- 2-3 horizontal cards (flex row, wrap on mobile)
- Each card: icon + label + "Calculate →" link
- Cards link to the suggested tool with query params for pre-fill
- Subtle entry animation (fade up, staggered)

## Constraints

- Web Component pattern matching existing components (navbar, footer, breadcrumb)
- Follow IIFE + `window.AfroTools.*` pattern
- Must read from the global `RESULT` variable (set by each tool's `calculate()` function)
- Pre-fill via URL query params: `?prefill_income=500000&prefill_period=monthly`
- Each target tool must check for `prefill_*` params on load and populate inputs
- The component must work even if `RESULT` is null (show generic suggestions)
- Use design system tokens: `--color-surface`, `--color-text`, `--radius-lg`, etc.
- Max 3 suggestions shown (even if more defined in WORKFLOWS)
- Cards must be keyboard accessible (focusable, Enter to navigate)
- Mobile: stack vertically
- Do NOT replace `related-tools.js` — this sits ABOVE it as a separate section

## Implementation Steps

1. Create `assets/js/components/next-steps.js`:
   - Define WORKFLOWS mapping object
   - Web Component `<afro-next-steps>` with `tool` attribute
   - In `connectedCallback()`: read `RESULT` global, look up tool in WORKFLOWS
   - Render 2-3 card elements with pre-fill links
   - Listen for `afrotools:calculation-complete` custom event to re-render with fresh RESULT
2. Create styles (inline in component or add to `tool-layout.css`):
   - Follow design system tokens
   - Responsive: flex row → column at `max-width: 640px`
   - Card hover state: slight lift + shadow
3. Add prefill reader to each target tool:
   - In each tool's `DOMContentLoaded` handler, check `URLSearchParams` for `prefill_*` params
   - If found, populate corresponding input fields and auto-calculate
   - Add a banner: "Pre-filled from your [Source Tool] calculation" with dismiss
4. Add `<afro-next-steps tool="[tool-id]">` to every calculator page HTML, after the result section
5. Run `npm run minify`

## Verification

- Open Nigeria PAYE calculator → enter salary → calculate
- Below results, "What's Next?" section should appear with 2-3 contextual suggestions
- Click "Plan your monthly budget" → should navigate to budget planner with net salary pre-filled in the input
- On the budget planner, banner should show "Pre-filled from your Nigeria PAYE calculation"
- Test on mobile → cards should stack vertically
- Test with no calculation (page load) → should show generic suggestions or be hidden
- Keyboard: Tab to cards, Enter to navigate
