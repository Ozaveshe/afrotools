# PAYE Page Standard

## Purpose

This is the internal reference standard for all country PAYE pages.

Nigeria PAYE is the current reference implementation:

- `nigeria/ng-salary-tax.html`
- `assets/css/paye-calculation-sync.css`
- `assets/js/lib/paye-tool-save-cta.js`
- `assets/js/lib/paye-calculation-sync.js`
- `dashboard/dashboard-sync.js`
- `dashboard/dashboard-app.js`

Use this document when upgrading an existing PAYE page or creating a new one.

## Minimum Product Standard

Every PAYE page should provide:

1. Accurate local tax logic through the country engine.
2. Rich result output with breakdowns, charting, and export.
3. `Save to My Tools` through the shared favorites layer.
4. Named scenario saving on the page itself.
5. Signed-in calculation activity written to dashboard history.
6. Signed-in saved scenarios synced into the dashboard workspace.
7. Reopen support from dashboard back into the calculator state.

## Required Data Flows

### 1. Favorites

- Use the shared favorites system in `assets/js/lib/saved-tools.js`.
- Use `assets/js/lib/paye-tool-save-cta.js` for the page CTA so auth and favorites state stay aligned with the navbar.
- Do not create PAYE-specific favorites storage keys.
- Save CTA state must refresh from shared auth and favorites events, not only from initial page load.

### 2. Named saved scenarios

- Device-local scenarios use `SaveState` with key pattern `afrotools-saved-<page-slug>`.
- Synced scenarios must upsert into `workspace_items` through `/api/workspace`.
- Use `item_type = 'saved-calculation'`.
- Use `item_key = local SaveState id`.
- Each saved scenario must have a stable reopen URL:
  - `/<country>/<page>/?saved_calc=<item_key>`

### 3. Recent activity

- Signed-in runs must save to `calculation_history` through `window.AfroHistory.save(...)`.
- Device activity can still write through `AfroData` for local recents and suggestions.
- History is for recent activity only.
- Named saves belong in `workspace_items`, not `calculation_history`.

## Payload Contract

Saved scenario payloads should follow the Nigeria v2 shape:

```js
{
  version: 2,
  toolSlug: 'ng-paye',
  toolName: 'Nigeria PAYE Calculator',
  countryCode: 'NG',
  currency: 'NGN',
  inputs: {
    salaryValue,
    salaryPeriod,
    calcMode,
    regime,
    period,
    toggles,
    // page-specific numeric inputs
  },
  snapshot: {
    gross,
    tax,
    netAnnual,
    netMonthly,
    effectiveRate,
    marginalRate,
    taxable,
    // page-specific outputs
  }
}
```

Pages should define:

- `window.PAYE_CALC_SYNC_CONFIG`
- `window.PAYE_TOOL_SAVE_META`
- `window.PAYE_CALC_SYNC_ADAPTER`

`PAYE_CALC_SYNC_CONFIG` is the page-level identity contract:

- `storageSlug`
- `toolSlug`
- `toolName`
- `toolHref`
- `currency`
- `countryCode`
- `locale`

`PAYE_CALC_SYNC_ADAPTER` is the page bridge into the shared sync system:

- `hasResult()`
- `buildPayload()`
- `restorePayload(payload, title)`

Use the shared save shell styles from `assets/css/paye-calculation-sync.css` instead of re-implementing the scenario card on each country page.

Workspace records should include:

- `toolSlug`
- `title`
- `summary`
- `href`
- `payload`
- `meta.country`
- `meta.currency`
- `meta.regime` when relevant
- `meta.netMonthly` and `meta.effectiveRate` when relevant

## Auth And Sync Rules

Do not rely only on `AfroAuth.isLoggedIn()`.

PAYE save and history flows must tolerate auth hydration delays by using broad signed-in detection:

- `AfroAuth.isLoggedIn()`
- `AfroAuth.getUser()`
- `AfroAuth.getCachedProfile()`
- `AfroWorkspace.isSignedIn()` where applicable

The page must retry sync after:

- `AfroAuth.onReady(...)`
- `afro-auth-change`
- `afro-workspace-change`
- `focus`

This avoids the failure mode where the navbar knows the user is signed in but the calculator still behaves like a guest.

Shared browser sync clients must also support both auth paths:

- bearer-token auth when `AfroAuth` has a live session token
- secure cookie auth when the browser has an `afro_session` or `afro_refresh` session but no fresh local bearer token yet

For `/api/favorites`, `/api/history`, and `/api/workspace`:

- send requests with `credentials: 'same-origin'`
- include `Authorization: Bearer ...` only when a token is actually available
- accept server-side cookie-session refresh so dashboard sync does not fail just because local token hydration lags behind navbar auth state

## Dashboard Contract

The dashboard should treat PAYE pages as first-class data sources.

### Calculations tab

Must show:

- named saved scenarios from `workspace_items`
- recent signed-in activity from `calculation_history`
- delete actions for both

### Dashboard summary surfaces

Should be able to derive from saved scenarios and history:

- latest take-home pay
- latest effective rate
- saved calculation count
- recent tools used

### Refresh events

Dashboard surfaces should refresh on:

- `afro-workspace-change`
- `afro-history-change`
- `afro-saved-calculations-change`
- `afro-auth-change`
- `focus`

For storage listeners, prefer prefix-based checks such as `afrotools-saved-` instead of Nigeria-only keys.

## UX Standard

Each PAYE page should have two save layers:

1. `Save to My Tools`
   - bookmarks the tool itself
   - should never be confused with saving a calculation result

2. `Save this scenario`
   - names and stores a concrete result state
   - must explain that it saves locally and syncs to dashboard when signed in

Use distinct copy so users understand the difference between bookmarking a tool and saving a result.

## Rollout Checklist

When upgrading another PAYE page to this standard:

1. Keep the country engine logic intact.
2. Add `assets/css/paye-calculation-sync.css` and the page-level scenario save shell.
3. Define `window.PAYE_CALC_SYNC_CONFIG`, `window.PAYE_TOOL_SAVE_META`, and `window.PAYE_CALC_SYNC_ADAPTER`.
4. Verify `Save to My Tools` uses the shared favorites path.
5. Load `assets/js/lib/paye-calculation-sync.js` and `assets/js/lib/paye-tool-save-cta.js`.
6. Verify history writes through `AfroHistory`.
7. Verify dashboard reopen links restore state through `?saved_calc=...`.
8. Verify delete works for saved scenarios and history.
9. Verify auth hydration does not leave the page in a false signed-out state.

## Current Scope

Right now, Nigeria is the reference implementation.

Other PAYE pages can remain on their existing tax logic and UI, but when we upgrade them they should match this behavioral standard for:

- auth-safe save state
- named scenario persistence
- dashboard sync
- recent activity tracking
