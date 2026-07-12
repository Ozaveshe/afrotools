# Spec: Progressive Directory Rendering and Honest Degradation

**Author:** Codex
**Date:** 2026-07-12
**Status:** Approved
**Reviewer:** AfroTools owner (approved through the `/goal` requirements in this task)
**Related:** `docs/TECHNICAL-RISK-REGISTER.md` R4, R5, R8, R9; `docs/specs/canonical-registry-and-derived-counts.md`

## Context

AfroTools is static-first, but several high-value directory routes currently create their useful item lists only after registry JavaScript executes. The verified risk register records `/all-tools/` rendering zero tool cards with JavaScript disabled even though the page shell and canonical registry counts are present. The same client-only pattern exists in the English category, developer, and widget-demo grids and in equivalent French directory routes. A registry asset failure, malformed response, unsupported browser, or swallowed exception can therefore make a published directory look empty.

The canonical registry already owns published tool, category, locale, country, and widget counts. `/tools/` already proves that build-generated HTML can expose registry-backed navigation before hydration. This change extends that static-first contract to the named directory surfaces while keeping JavaScript responsible for search, filtering, sorting, pagination, previews, and retryable enhancement.

## Functional Requirements

- FR-1: Every target directory route that exists in the public route manifest MUST contain canonical counts and useful published links in its initial HTML.
- FR-2: Initial counts MUST be sourced from named canonical-registry selectors or the validated widget registry and MUST NOT use unresolved placeholders such as `--`.
- FR-3: JavaScript MUST enhance existing initial content with search, filtering, sorting, pagination, or previews without first replacing valid counts with zero.
- FR-4: Hydration MUST preserve the relative order of initial records and MUST NOT duplicate their canonical routes.
- FR-5: A user filter with no matches MUST render a dedicated `no-results` state and MUST NOT be described as a data-load failure.
- FR-6: A valid empty registry MUST render a dedicated `no-published-records` state and MUST NOT render a generic load failure.
- FR-7: A missing, blocked, malformed, or throwing registry/data dependency MUST preserve the static links and render an actionable `failed-load` state with a retry control.
- FR-8: When the browser is offline during a failed enhancement, the page MUST render an `offline` state while preserving static links.
- FR-9: When required platform features are unavailable, the page MUST render an `unsupported-browser` state while preserving static links.
- FR-10: Loading UI MUST be shown only while an asynchronous load or retry is genuinely pending.
- FR-11: Directory links MUST remain ordinary anchors usable without JavaScript.
- FR-12: Search/filter query strings MUST retain the route's unfiltered canonical URL and MUST be `noindex, follow` when a query-state URL is loaded.
- FR-13: Existing static-first localized directories MUST remain static-first; localized client-rendered equivalents MUST receive the same initial-content and honest-state contract in their own language where practical.
- FR-14: Build/check commands MUST fail when a managed target is missing markers, contains stale generated fallback HTML, exposes an unresolved placeholder, or has a count that disagrees with its canonical source.

## Non-Functional Requirements

- NFR-A1: Search fields, filter controls, retry controls, and preview controls MUST be keyboard reachable and expose stable accessible names.
- NFR-A2: Dynamic status changes MUST be announced through a polite or assertive live region appropriate to the state.
- NFR-A3: At 390 CSS pixels wide, managed directory cards and controls MUST not cause horizontal document overflow.
- NFR-P1: Initial navigation MUST be available from the HTML response without waiting for JavaScript, registry parsing, or network-idle.
- NFR-R1: A dependency failure MUST NOT remove or disable initial static anchors.
- NFR-R2: Hydration MUST complete without uncaught page errors for normal, empty-valid, and handled-failure fixtures.
- NFR-SEO1: Canonical URLs MUST exclude filter/search query parameters; query-state pages MUST expose `noindex, follow` at runtime without changing the canonical.
- NFR-M1: Generated fallbacks MUST be deterministic for the same canonical registry input.

## Acceptance Criteria

### AC-1: Initial HTML is useful (FR-1, FR-2, FR-11, NFR-P1)
Given a target route is requested without executing JavaScript
When the HTML response is parsed
Then it contains non-placeholder canonical counts
And it contains ordinary links to published tools, categories, or widgets appropriate to that route.

### AC-2: Normal hydration preserves truth (FR-3, FR-4, NFR-R2)
Given a target route contains generated initial records
When its registry enhancement completes normally
Then no canonical route is duplicated
And the initial records keep their relative order
And no correct count is temporarily or finally replaced with zero.

### AC-3: Filter no-results is distinct (FR-5, NFR-A2)
Given a normally hydrated directory
When a user enters a query that matches no published record
Then a `no-results` state is announced
And the state explains that the filter can be cleared
And it does not claim that loading failed or that no records are published.

### AC-4: Empty valid registry is honest (FR-6, NFR-R1)
Given the enhancement dependency returns a valid empty collection
When hydration completes
Then the page renders `no-published-records`
And any build-rendered navigation remains available
And the page does not report a network failure.

### AC-5: Blocked or failed dependency is actionable (FR-7, NFR-R1, NFR-A2)
Given a registry or data request is blocked, missing, malformed, or throws during parsing
When enhancement cannot complete
Then the page renders `failed-load`
And a keyboard-reachable retry control is available
And the initial static anchors remain available
And headline counts do not become zero.

### AC-6: Offline failure is explicit (FR-8, NFR-R1)
Given the browser reports it is offline
When enhancement fails
Then the page renders `offline`
And it tells the user to reconnect and retry
And the initial static anchors remain available.

### AC-7: Unsupported browser is explicit (FR-9, NFR-R1)
Given a required browser primitive is unavailable
When the enhancement bootstrap runs
Then the page renders `unsupported-browser`
And the initial static anchors remain available.

### AC-8: Loading reflects real work (FR-10)
Given a registry dependency is deliberately delayed
When the request is pending
Then a loading state is visible
And when the request resolves or fails the loading state is removed.

### AC-9: Query-state indexing is controlled (FR-12, NFR-SEO1)
Given a directory route is opened with a non-empty search or filter query parameter
When the document initializes
Then its canonical remains the clean directory URL
And its robots directive is `noindex, follow`.

### AC-10: Keyboard and mobile behavior remain usable (NFR-A1, NFR-A3)
Given a user at a 390-pixel viewport uses only the keyboard
When they traverse search, filters, directory links, and retry controls
Then each control receives visible focus and can be activated
And the document has no horizontal overflow.

### AC-11: Locale variants preserve the contract (FR-13)
Given representative English, French, Swahili, Hausa, and Yoruba directory routes that exist
When they are loaded with JavaScript disabled
Then each retains useful localized navigation
And client-rendered locale equivalents do not expose `--`, fake zero, or an empty primary directory.

### AC-12: Build drift is detected (FR-14, NFR-M1)
Given a managed generated fallback or canonical count is stale
When the progressive-directory check command runs
Then it exits non-zero and names the stale surface.

## Edge Cases and Error Scenarios

- EC-1: Registry script request is aborted or returns 404 -> preserve initial HTML and show `failed-load` with retry.
- EC-2: Registry script loads after a slow delay -> show `loading` only during the pending interval, then hydrate once.
- EC-3: Registry payload is syntactically malformed -> catch the parse/bootstrap error and show `failed-load`; do not clear initial HTML.
- EC-4: Registry payload is valid but empty -> show `no-published-records`; do not label it a failure.
- EC-5: Browser is offline when the dependency fails -> show `offline` rather than generic failure.
- EC-6: `Promise`, `fetch`, or another declared required primitive is unavailable -> show `unsupported-browser`.
- EC-7: A selector or target container is missing -> fail the build/check for managed source; runtime failure is caught and exposed as `failed-load`.
- EC-8: Hydration callback fires twice -> subsequent runs are idempotent and do not duplicate records or listeners.
- EC-9: A query contains markup or special characters -> treat it as text and never interpolate it as HTML.
- EC-10: Canonical registry and committed fallback disagree -> check mode fails before release.
- EC-11: A localized route has no equivalent -> do not invent a route; validate only equivalents declared by the route/localization contracts.
- EC-12: Cache is disabled -> behavior matches a first uncached load and initial HTML remains useful.

## API Contracts

There is no new JSON API. Existing static routes retain this HTTP contract:

- `GET /widgets/`, `GET /widgets/demo/`, `GET /categories/`, `GET /developer-tools/`, `GET /tools/`, `GET /all-tools/`, and declared localized equivalents return `200 text/html` with canonical counts and useful anchors in the response body.
- Query-state requests return the same static document and clean canonical URL; runtime enhancement adds `noindex, follow` for a non-empty supported filter/search query.

Managed pages use this DOM enhancement contract:

```ts
type DirectoryState =
  | "ready"
  | "loading"
  | "no-results"
  | "no-published-records"
  | "failed-load"
  | "offline"
  | "unsupported-browser";

interface DirectoryStateDetail {
  state: DirectoryState;
  source: "initial-html" | "registry" | "retry";
  retryable: boolean;
  message: string;
}

interface ProgressiveDirectoryElement extends HTMLElement {
  dataset: {
    directoryState?: DirectoryState;
    directorySource?: "initial-html" | "registry";
  };
}
```

Managed fallback blocks use stable build markers and ordinary anchors. Runtime code may enhance or replace a managed block only after validating a non-empty dependency; failure and empty-valid paths preserve the initial anchors.

## Data Models

### InitialDirectoryRecord

| Field | Type | Constraints |
| --- | --- | --- |
| id | string | Stable registry/widget id; non-empty |
| title | string | Escaped visible label |
| route | string | Canonical same-site public route |
| categoryId | string | Existing canonical category/widget category id |
| locale | string | Existing published site locale |
| description | string | Escaped plain text; may be shortened for initial set |
| priority | number | Deterministic ordering input |
| publicationStatus | `published` | Unpublished records are excluded |

### DirectoryBuildSurface

| Field | Type | Constraints |
| --- | --- | --- |
| path | string | Existing public HTML route source |
| kind | `tools` \| `categories` \| `developer` \| `widgets` | Determines record source/card renderer |
| locale | string | Must exist in locale manifest for localized output |
| countSelector | string | Named canonical selector when applicable |
| initialLimit | number | Positive deterministic useful-set size, or all categories |
| startMarker | string | Unique managed marker in source HTML |
| endMarker | string | Matching managed marker in source HTML |

## Out of Scope

- OS-1: Converting AfroTools to a server framework or adding runtime SSR; the existing static build is sufficient.
- OS-2: Creating localized routes that are not declared by the locale/route contracts.
- OS-3: Changing canonical registry membership, tool publication status, or category taxonomy except to fix a proven source defect.
- OS-4: Replacing existing search/filter designs with a new framework or component library.
- OS-5: Live Supabase access; these directories are built from repository-owned registries.
- OS-6: Service-worker production parity beyond confirming that cache-disabled loads preserve the initial HTML contract.
