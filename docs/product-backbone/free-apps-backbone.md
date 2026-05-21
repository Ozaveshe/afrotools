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

## FX Labels

CurrencyDisplay callers that show converted values should pass FX metadata when it is available:

```js
window.AfroProductBackbone.renderCurrencyDisplay(node, {
  amount: 12000,
  currency: 'GBP',
  usdAmount: 15240,
  localAmount: 20500000,
  localCurrency: 'NGN',
  estimate: true,
  fxRates: [
    {
      baseCurrency: 'GBP',
      quoteCurrency: 'USD',
      rate: 1.27,
      provider: 'AfroTools static planning-rate table',
      lastUpdated: null,
      mode: 'static_estimate',
      refreshPolicy: 'Manual review only',
      confidence: 'estimate'
    }
  ],
  fxMissing: []
});
```

Allowed FX modes are `live`, `cached`, and `static_estimate`. Only show `Live rate` when the value came from a live request. Cached rates need a timestamp. Static estimates must say `Static estimate`, and missing local FX should keep the destination currency visible while showing local currency as unavailable.

## Data Confidence Gates

Free apps that mix official fields with broad estimates should add an app-level confidence gate before showing high-precision results. Study Abroad now uses:

- `Hero verified`: the original hero destination model with stronger source metadata.
- `Ready for planning estimate`: useful regional planning estimate with complete model coverage, but not an official cost database.
- `Partial source coverage`: broad estimates where some important country-specific sources are still missing.
- `Needs verification`: weak coverage that should show ranges, source gaps, and a `Planning estimate only` badge.

Low-confidence results should soften dangerous precision by showing ranges instead of exact-looking totals. Every confidence gate should expose a feedback loop for `Suggest an update`, `Report outdated cost`, and `Submit official source`.

Study Abroad source feedback is stored locally first at:

```text
afrotools:study-abroad-source-feedback:v1
```

Study Abroad also exports an internal source-gap queue:

```text
audit-results/study-abroad-source-gap-report.json
audit-results/study-abroad-source-gap-report.csv
```

Run:

```bash
npm run study-abroad:source-gaps
```

Additional Study Abroad confidence events:

- `study_abroad_started`
- `study_abroad_confidence_status_viewed`
- `study_abroad_source_panel_opened`
- `study_abroad_summary_copied`
- `study_abroad_report_outdated_clicked`
- `study_abroad_source_suggested`
- `study_abroad_feedback_opened`
- `study_abroad_feedback_submitted`
- `study_abroad_low_confidence_result_viewed`

## Confidence-Gated Result Layouts

Tools that mix official fields with broad estimates should show the result in a trust-first order:

1. Destination or result summary.
2. Confidence status.
3. Primary estimate.
4. Upfront or near-term pressure.
5. Gap or action metric.
6. Cost or result breakdown.
7. Source and confidence panel.
8. Next steps.

Weak data must not look more precise than the source coverage allows. Use ranges, confidence badges, and visible warnings such as `Planning estimate only`. Stronger destinations can show the full breakdown, but official-source fields should still be separated from planning estimates.

## Interpretation Cards

Every high-value calculator should explain the result in plain language after the numeric output. The interpretation should answer:

- whether the user's budget or input clears the main threshold
- what gap remains
- which category is driving the result
- what the user should verify next
- which linked tool should be opened next

Interpretation cards must not add new claims. They should summarize the already calculated result and point users toward verification or the next AfroTools workflow.

## Feedback Loops

Confidence-gated tools should reuse the source feedback pattern:

- `Suggest an update`
- `Report outdated cost`
- `Submit official source`

The first implementation can be localStorage-first. Capture the tool ID, country or item, field, issue type, optional source URL, optional note, confidence status, and timestamp. The UI should confirm that feedback was saved locally and that tool use is not blocked.

## Sponsor Placement Rules

Sponsor placements belong after the result, not inside the core calculation form. A sponsor card must:

- be visibly labeled `Sponsored`, `Partner opportunity`, or `Sponsored placement available`
- avoid fake partner names
- avoid implying official endorsement
- track `sponsor_clicked` or the tool-specific sponsor event
- preserve the user's ability to save, share, verify sources, and continue without clicking an ad

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
