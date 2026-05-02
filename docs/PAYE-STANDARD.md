# PAYE Page Standard

## Purpose

This is the internal reference standard for all country PAYE pages.

Nigeria PAYE is the current reference implementation:

- `nigeria/ng-salary-tax.html`
- `assets/css/paye-calculation-sync.css`
- `assets/js/lib/paye-tool-save-cta.js`
- `assets/js/lib/paye-calculation-sync.js`
- `assets/js/lib/paye-report-sync.js`
- `dashboard/dashboard-sync.js`
- `dashboard/dashboard-app.js`

Use this document when upgrading an existing PAYE page or creating a new one.

## Salary And PAYE Category Workflow

The `/salary-tax/` category is a workflow surface, not only a list of PAYE calculators. It should guide users through:

1. Choose the right calculator family.
2. Run a salary, payroll, tax, property, savings, crypto, FX, or Francophone calculation.
3. Save a named scenario locally.
4. Sync the scenario to the dashboard workspace when signed in.
5. Generate a report, source note, PDF, payslip-style summary, or payroll review item.
6. Continue employer work in `/tools/afropayroll-os/workspace.html` when a single calculator result becomes a payroll run draft.
7. Use the Salary hub planner to choose a country/job route and create a metadata-only handoff brief when the user is ready to continue.
8. Review a local readiness board with approval status, exception queue, and audit-packet export before payroll handoff.

The category count should come from the curated hub map in `assets/js/salary-tax-index.js`, not from a plain `category === 'financial'` registry filter. As of this standard, the expected curated total is `188` unique tools across:

- PAYE calculators
- Payroll and HR
- Business and capital tax
- Property and loans
- Savings and investment
- Crypto suite
- Currency and FX
- Francophone tools

Some Francophone tools are real local routes even when their French display IDs are not standalone registry IDs. Keep those route-only tools in the category search through the `staticTools` fallback map in `assets/js/salary-tax-index.js`, and verify the routes exist before changing the total.

The Francophone hub link should point directly to `/fr/salary-tax/francophone/`. The legacy `/salary-tax/francophone/` route can remain as a redirect, but category cards and related links should use the canonical French hub.

Suggested banner direction for this category:

```text
Create a premium horizontal website banner for AfroTools Salary and PAYE. Show an Africa-first payroll and tax workspace with payslip cards, salary calculators, tax brackets, report exports, and dashboard-style saved scenarios. Include subtle African map geometry, professional finance colors, clean data tables, soft daylight, high trust, modern SaaS UI, no text, no logos, 16:9 wide composition.
```

## Minimum Product Standard

Every PAYE page should provide:

1. Accurate local tax logic through the country engine.
2. Rich result output with breakdowns, charting, and export.
3. `Save to My Tools` through the shared favorites layer.
4. Named scenario saving on the page itself.
5. Signed-in calculation activity written to dashboard history.
6. Signed-in saved scenarios synced into the dashboard workspace.
7. Reopen support from dashboard back into the calculator state.
8. Account-gated PDF/report downloads with report metadata saved for later follow-up.
9. Category-level planner and handoff briefs that connect a single calculation to employer, advisory, and dashboard workflows.
10. Payroll-style readiness workflow with approval status, exception queue, and metadata-only audit packets.

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

### 4. PDF reports and report workspace

- Use `window.AfroTools.pdf.generate(...)` for generated PAYE PDF reports where possible.
- The shared PDF template must call `window.AfroPdfDownloadGate.guardPromise(...)` before saving a generated report.
- Guests can calculate freely, but must create or sign into a free account before downloading a generated PDF/report file.
- Signed-in users should bypass the modal automatically through the same broad auth checks used by PAYE sync.
- After a PDF is generated, `pdf-template.js` dispatches `afro-pdf-generated` with report metadata.
- Upgraded PAYE pages should load `assets/js/lib/paye-report-sync.js` after `paye-calculation-sync.js`.
- Device report metadata is saved to `localStorage` key `afro_salary_reports_v1`.
- Signed-in report metadata syncs to the dashboard workspace as `item_type = 'salary-report'`.
- Store metadata only for salary reports: title, summary, file name, ref, country, currency, tool URL, and gate context. Do not upload the generated PDF blob or raw salary inputs unless a future backend contract explicitly allows it.

### 5. Category planner and payroll handoff briefs

- The main `/salary-tax/` hub loads `assets/js/lib/salary-tax-workflow.js` and `assets/css/salary-tax-workflow.css`.
- Planner state is saved locally under `afro_salary_workflow_plan_v1`.
- Handoff briefs are saved locally under `afro_salary_handoff_briefs_v1`.
- Signed-in handoff metadata syncs to the dashboard workspace as `item_type = 'salary-handoff'`.
- Handoff briefs are metadata-only: selected country, work type, recommended route, source report title/ref, and next-step links.
- Handoff downloads use the same account gate before generating the JSON brief.
- The dashboard Salary Workspace should show both `salary-report` trails and `salary-handoff` briefs.
- The planner must route users only to verified local routes and must not invent tax deductions, filings, or compliance status.

### 6. Readiness board, approvals, exceptions, and audit packets

- Readiness boards are saved locally under `afro_salary_run_readiness_v1`.
- Audit packets are saved locally under `afro_salary_audit_packets_v1`.
- Signed-in audit packet metadata syncs to the dashboard workspace as `item_type = 'salary-audit-packet'`.
- The readiness board is a workflow checklist, not an official compliance verdict.
- Readiness score can use local evidence such as generated report presence, handoff presence, payroll-ready country support, checklist completion, and approval status.
- The exception queue should surface missing report, missing handoff, estimate-only country support, employee/client review pending, approver missing, and funding note missing.
- Audit packet exports must remain metadata-only and should be account-gated before download.
- Do not save raw salary inputs, generated PDF blobs, employee records, payment details, or filing claims in the category-level audit packet.
- Dashboard Salary Workspace should show readiness boards, audit packets, handoff briefs, and report trails in one place.

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
10. Load `assets/js/lib/paye-report-sync.js` after `paye-calculation-sync.js` when the page can generate a PDF/report.
11. Verify guest report download opens the account gate, signed-in report download bypasses it, and the dashboard shows the saved salary report metadata.
12. Verify the Salary hub planner can save a route, create a handoff brief, gate the brief download, and show the handoff in the dashboard Salary Workspace.
13. Verify the readiness board, approval status, exception queue, gated audit packet download, and dashboard Salary Workspace audit section.

## Current Scope

Right now, Nigeria is the reference implementation.

Other PAYE pages can remain on their existing tax logic and UI, but when we upgrade them they should match this behavioral standard for:

- auth-safe save state
- named scenario persistence
- dashboard sync
- recent activity tracking
