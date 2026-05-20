# Free Apps Product Backbone

This backbone gives AfroTools free tools a shared product layer without forcing every page into one full framework. It is designed for the Study Abroad Cost Tool and Scholarship Finder first, then the next 100 free apps.

## Added Assets

- `assets/js/components/product-backbone.js`
- `assets/css/product-backbone.css`

The JavaScript exports `window.AfroProductBackbone` and `window.ProductBackbone`.

## Components

- `resultCard` / `renderResultCard`: title, subtitle, value, secondary value, status, badge, CTA, and metadata.
- `riskIndicator` / `renderRiskIndicator`: `low`, `medium`, `high`, and `unknown` with strong text, border, dot, and accessible labels.
- `currencyDisplay` / `renderCurrencyDisplay`: main amount, destination currency, USD equivalent, local currency, and estimate labeling. Missing FX rates show a visible fallback instead of blank output.
- `saveResult` / `renderSaveResult`: localStorage-first saved results with name, timestamp, tool ID, and payload.
- `shareResult` / `renderShareResult`: copy-link first, with optional Web Share API button where the browser supports it.
- `renderEmailCapture`: optional, non-blocking email capture with tool context.
- `renderLoadingSkeleton`: card/list loading placeholders.
- `renderEmptyState`: icon, title, message, and optional action.
- `renderLoadMore`: offset/limit-friendly pagination for list tools.
- `renderLastUpdatedSourceInfo`: last checked, source link, and confidence/status display.
- `renderProductCTAGroup`: primary CTA, secondary CTA, and clearly labeled sponsored CTA.
- `ProductAnalytics`: wrapper around existing AfroTools analytics.

## New Free App Usage

1. Add the shared CSS and JS to the page:

```html
<link rel="stylesheet" href="/assets/css/product-backbone.css">
<script src="/assets/js/components/product-backbone.js" defer></script>
```

2. Keep the app's calculation, matching, API, or data loading logic local.
3. Render the shared components only at stable seams: result panels, save/share rows, list loading states, empty states, trust/source blocks, and sponsored CTA groups.
4. Use `toolId` consistently. It must match the route/tool registry ID where practical.

## Analytics Events

The helper reuses `window.AfroTools.analytics.track` when present, and falls back to `gtag` when available.

- `result_generated`
- `share_clicked`
- `save_clicked`
- `sponsor_clicked`
- `email_capture_submitted`

Use:

```js
window.AfroProductBackbone.ProductAnalytics.trackResultGenerated('tool-id', {
  result_count: 12
});
```

## LocalStorage

Saved results use:

```text
afrotools:free-app-results:v1
```

Shape:

```json
{
  "version": 1,
  "updatedAt": "ISO timestamp",
  "items": [
    {
      "id": "generated id",
      "toolId": "study-abroad-cost",
      "name": "Saved result name",
      "savedAt": "ISO timestamp",
      "payload": {}
    }
  ]
}
```

Email captures use:

```text
afrotools:free-app-email-captures:v1
```

Email capture is optional and must never block tool use.

## Accessibility Rules

- Risk states must include text labels. Do not rely on color alone.
- Interactive controls need visible focus states.
- Empty and loading states must be announced through normal page structure, not hidden-only text.
- Sponsored CTAs must include a visible `Sponsored` label.
- Links that leave the page or open sources should use clear labels and `rel="noopener"` when opening in a new tab.

## Mobile Rules

- Components are mobile-first and stack by default.
- Buttons wrap and become full-width on narrow screens.
- No component should require horizontal scrolling.
- Currency, source, and CTA blocks must tolerate missing or long labels without shrinking controls below tap-friendly sizes.

## Current Wiring

Study Abroad Cost uses the backbone through `tools/study-abroad-cost/study-abroad-backbone.js` for:

- `RiskIndicator`
- `CurrencyDisplay`
- `SaveResult`
- `ShareResult`
- `ProductAnalytics`

Scholarship Finder uses the backbone in `tools/scholarship-finder/index.html` for:

- `LoadingSkeleton`
- `EmptyState`
- `LastUpdatedSourceInfo`
- `LoadMore`
- `SaveResult`
- `ProductAnalytics`

These integrations are intentionally light. They do not change Study Abroad formulas, Scholarship Finder matching, scholarship APIs, or feed behavior.

## 100 Free Apps Plan

This backbone creates a repeatable product shell for calculators, finders, checkers, and data tools:

- every app can save locally before account sync exists
- every app can share a result without custom clipboard code
- every app can expose trust/source metadata
- every app can use the same analytics event names
- list tools can share pagination and empty/loading states
- monetization CTAs can be labeled consistently and measured without hiding sponsorship

Future apps should add domain-specific logic locally and use this backbone only for repeated product behavior.
