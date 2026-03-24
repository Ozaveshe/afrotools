# Prompt 01: Enhanced Analytics Events

## Context

Read these files first to understand current state:
- `assets/js/lib/analytics.js` (current GA4 event tracking)
- `assets/js/components/tool-registry.js` (tool catalog)
- `docs/ARCHITECTURE.md` (IIFE pattern, no frameworks)
- `docs/PLATFORM_STANDARDS.md` (naming conventions)

Currently AfroTools tracks: `calculation_complete`, `pdf_download`, `ai_advisor_query`, `tool_view`, `share_result`, `feature_used`, `tool_error`, `newsletter_signup`, `pro_upsell`, `affiliate_click`, `article_read`.

## Objective

Add the following **missing analytics events** to capture user behavior gaps. All events must go through the existing `AfroTools.analytics.track()` method which wraps GA4's `gtag()`.

### New Events to Add

1. **`calculation_started`** — Fires when user begins interacting with a calculator (first input focus or slider move). Captures: `tool_slug`, `country_code`, `entry_method` (typed|slider|prefilled).

2. **`calculation_abandoned`** — Fires on page unload if `calculation_started` fired but `calculation_complete` did not. Captures: `tool_slug`, `country_code`, `time_spent_seconds`, `fields_filled_count`, `last_field_touched`.

3. **`search_query`** — Fires on every search in the tool registry search bar. Captures: `query`, `results_count`, `source` (navbar|category-page|404-page|all-tools).

4. **`search_no_results`** — Fires when a search returns 0 results. Captures: `query`, `source`. This is critical for understanding what tools users want but don't exist yet.

5. **`scroll_depth`** — Fires at 25%, 50%, 75%, 100% scroll milestones on tool pages. Captures: `tool_slug`, `depth_percent`, `time_to_reach_seconds`. Use IntersectionObserver, not scroll listeners.

6. **`time_on_tool`** — Fires on page visibility change (tab switch or close) for tool pages. Captures: `tool_slug`, `country_code`, `duration_seconds`, `did_calculate` (boolean).

7. **`result_interaction`** — Fires when user interacts with a result (copy value, expand breakdown, switch period toggle). Captures: `tool_slug`, `action` (copy|expand|toggle_period|view_chart).

8. **`cta_impression`** — Fires when a CTA becomes visible (newsletter bar, pro upsell, email gate). Captures: `cta_type`, `tool_slug`, `position` (inline|sticky|modal).

9. **`cta_dismissed`** — Fires when user dismisses a CTA. Captures: `cta_type`, `tool_slug`, `time_visible_seconds`.

10. **`referral_source`** — Fires on first page load, capturing cleaned UTM params. Captures: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `referrer_domain`.

## Constraints

- Follow the IIFE + `window.AfroTools.*` pattern from ARCHITECTURE.md
- Add events to `assets/js/lib/analytics.js` — do NOT create a new file
- All events must respect cookie consent: check `localStorage.getItem('afrotools_cookie_consent') === 'accepted'` before firing
- Use `requestIdleCallback` or `setTimeout(fn, 0)` for non-critical events to avoid blocking UI
- No external dependencies — vanilla JS only
- `scroll_depth` must use IntersectionObserver with sentinel divs, not scroll event listeners
- `calculation_abandoned` must use `visibilitychange` event, NOT `beforeunload` (unreliable on mobile)
- All event names must be snake_case, all parameter names must be snake_case
- Keep the minified version updated: after editing `analytics.js`, remind user to run `npm run minify`

## Implementation Steps

1. Read `assets/js/lib/analytics.js` to understand current `track()` method signature
2. Add each new event as a method on `AfroTools.analytics`:
   - `trackCalculationStart(toolSlug, countryCode, entryMethod)`
   - `trackCalculationAbandon(toolSlug, countryCode, data)`
   - `trackSearch(query, resultsCount, source)`
   - `trackSearchNoResults(query, source)`
   - `trackScrollDepth(toolSlug, depthPercent)`
   - `trackTimeOnTool(toolSlug, countryCode, durationSec, didCalculate)`
   - `trackResultInteraction(toolSlug, action)`
   - `trackCtaImpression(ctaType, toolSlug, position)`
   - `trackCtaDismiss(ctaType, toolSlug, timeVisibleSec)`
   - `trackReferralSource()`
3. Add auto-initialization in the IIFE's init block:
   - `trackReferralSource()` on DOMContentLoaded (once per session, use sessionStorage flag)
   - `trackScrollDepth()` setup via IntersectionObserver on tool pages (detect via `document.querySelector('.calc-card')`)
   - `trackTimeOnTool()` timer start on tool pages
4. Integrate `trackSearch` into `tool-registry.js` search handler
5. Integrate `trackCalculationStart` into the standard `calculate()` function pattern (first call only, use a flag)
6. Integrate `trackCalculationAbandon` via `visibilitychange` on tool pages
7. Run `npm run minify` to update minified version

## Verification

- Open browser DevTools → Network tab → filter by `google-analytics`
- Interact with a calculator → confirm `calculation_started` fires on first input
- Search for a nonsense term in navbar → confirm `search_no_results` fires
- Scroll a tool page → confirm `scroll_depth` fires at 25/50/75/100%
- Switch tabs → confirm `time_on_tool` fires with correct duration
- Check GA4 Realtime → Events tab should show new events appearing
