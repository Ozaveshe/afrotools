# AfroSEO Studio: evidence to action

**Author:** Codex
**Date:** 2026-09-08
**Status:** Approved direction; implementation specification under the owner's instruction to start the agreed AfroSEO plan.
**Reviewers:** Owner (product direction); Codex (implementation review)

## Context

The owner approved the AfroTools growth plan and asked to start a product that can compete with Ahrefs, Semrush and Ubersuggest. Existing Studio routes provide individual HTML audits, snippet previews and schema generation. The missing first workflow is keeping a website project, comparing actual search exports, prioritizing fixes and showing verified changes.

This release establishes that workflow without buying external data. It uses the existing single-page audit endpoint and Pro gate. It does not promise enterprise database parity. Project data stays on the device; backups are explicit downloads. Search Console exports are observations with user-declared periods and filters, not global keyword or competitor estimates.

## Functional Requirements

- FR-1: Studio MUST create, select and delete device projects with unique HTTP(S) origins, names and stable ids; at most five projects.
- FR-2: A project MUST save up to 25 distinct page audits and retain the last five observations per URL. Re-audits MUST compare stable check ids; a manual done status MUST remain distinct from a verified absent issue. Recurrence MUST reopen a previously verified issue.
- FR-3: A project MUST maintain a fix queue ordered by observed failure severity, then page impressions where available. Users MUST be able to mark open, in-progress or done. These statuses MUST NOT change audit scores.
- FR-4: Studio MUST import two English GSC Pages or Queries CSV exports locally, with explicit inclusive dates and matching filter description. It MUST require equal-length non-overlapping periods and matching dimensions. It MUST calculate CTR from counts, weighted position from impressions and signed changes only for rows present in both exports. Unmatched rows MUST be labelled missing/new in export, never zero traffic or proven ranking loss. Pages imports MUST match the project origin.
- FR-5: Studio MUST export and restore versioned project JSON backups and export escaped standalone printable HTML reports, including date ranges, scope limitations, observed findings and manual statuses. Restore MUST validate the entire document before replacing state and MUST require explicit confirmation in the UI.
- FR-6: Audit reports MUST expose an audit-method version and score caveat, stable issue ids and evidence type. llms.txt presence MUST NOT affect score. Content-length guidance MUST state it is a heuristic with no minimum ranking word count. Decorative empty alt attributes and plain HTTP navigation links MUST NOT be classified as missing alt or mixed resources. Relative canonicals and protocol-relative links MUST resolve correctly. Comments and script body text MUST NOT be interpreted as page metadata; repeated robots directives and the none alias MUST be considered.
- FR-8: The audit transport MUST pin a public DNS address at connection time, reject private and reserved destinations on every redirect, bound total response reading to 10 seconds per request and decoded body size to 2 MB, and fail rather than score truncated HTML. Companion fetches MUST use the same boundary with a 64 KB limit.
- FR-7: Existing audit, history, preview and schema generator controls MUST remain available at their current routes. Copy MUST describe approximate previews and HTML checks rather than ranking guarantees or unlimited service. New project controls MUST use the existing Pro gate. Individual audit actions MUST require explicit user submission.

## Non-Functional Requirements

- NFR-1: GSC import MUST be bounded to 2 MB UTF-8 and 10,000 rows per file; invalid quoting, duplicate keys, missing columns, negative or nonfinite metrics and inconsistent counts MUST fail with an actionable message before modifying state.
- NFR-2: Browser storage MUST be bounded to 4 MB serialized state. Storage failures MUST be visible and MUST preserve the last successful state. Imported text MUST never execute as markup and MUST NOT be sent to analytics, AI, cloud storage or audit requests.
- NFR-3: New controls MUST have visible labels, keyboard focus and live status feedback. The workspace MUST have no horizontal document overflow at 390px or 1440px; tables MAY scroll in labelled containers.
- NFR-4: Existing public URLs, canonicals, noindex boundaries, prices, subscription contracts and authentication MUST remain unchanged. No new external runtime dependencies or providers are required.

## Acceptance Criteria

### AC-1: (FR-1)

Given a clean workspace, When a valid origin is created twice, Then the first project persists and the duplicate is rejected; selecting and deleting a project update only that project.
### AC-2: (FR-2, FR-3)

Given an audit with a failing check, When it is marked done and re-audited with that check passing, Then it becomes verified resolved; When the failure recurs, Then it reopens. A different URL or method version MUST NOT create a misleading score delta.
### AC-3: (FR-4, NFR-1)

Given valid equal-period CSVs, When they are compared, Then CTR is recomputed, matched deltas are correct and absent rows are distinguished from zero. Incompatible dimensions, periods, domains, duplicates and malformed metrics are rejected.
### AC-4: (FR-5, NFR-2)

Given saved projects, When exported and restored, Then state round-trips and hostile markup is escaped in printable reports. Invalid backups and unavailable storage do not erase existing state.
### AC-5: (FR-6)

Given synthetic HTML, When analyzed with and without llms.txt, Then scores are equal; decorative alt and navigation links have no false failures; relative URLs resolve and stable issue ids are present.
### AC-6: (FR-7, NFR-3, NFR-4)

Given the gated workspace in an authenticated Pro test session, When a project is created, a page audited and a comparison imported, Then the queue and reports are usable at mobile and desktop widths while legacy preview and schema actions still work.

### AC-7: (FR-8)

Given reserved addresses, redirects, oversized bodies and stalled responses, When an audit fetch is attempted, Then the request fails without a partial report; the connection lookup uses validated public addresses only.

## Edge Cases

- EC-1: Invalid protocols, credentials, duplicate origins and page URLs outside the selected origin are rejected.
- EC-2: CSV BOM, CRLF, quoted delimiters, escaped quotes and quoted multiline cells are supported; unclosed quotes and ambiguous dimensions are rejected.
- EC-3: Missing rows mean absence from the export, not zero. Zero prior clicks produce an absolute delta but no percentage-growth claim. No joins between separately aggregated Pages and Queries exports.
- EC-4: A failed audit leaves saved observations unchanged; incomplete or incompatible reports cannot verify resolution. Scores from different audit-method versions are not compared.
- EC-5: Corrupt local storage, quota errors and malformed or oversized backups show recoverable errors without automatic deletion.
- EC-7: DNS answers can change, include IPv4-mapped IPv6, or combine public/private records; deny unsafe sets at connection time. Redirect, decompression, timeout and body-size failures return an actionable audit error.
- EC-6: A supplied label or query containing HTML or spreadsheet formulas stays inert text. Reports contain no executable scripts or embedded remote assets.

## API Contracts

The network API remains POST /api/seo-audit. No new server endpoint is introduced.

```typescript
interface AuditRequest { url: string }
interface AuditReport { url: string; finalUrl?: string; fetchedAt: string; methodologyVersion: string; score: number; grade: string; categories: Category[]; issues: Issue[]; page: object; limitations: string[] }
interface AuditError { error: string; code: 'invalid_url' | 'bad_request' | 'fetch_failed' | 'rate_limited' | 'method_not_allowed' }
// Existing responses: 200 success; 400 validation; 422 upstream failure; 429 throttle; 405 method.
interface Period { start: string; end: string; filters: string }
interface SearchRow { key: string; clicks: number; impressions: number; position: number }
interface SearchExport { dimension: 'page' | 'query'; period: Period; rows: SearchRow[] }
interface Check { id: string; label: string; status: 'pass' | 'warn' | 'fail' | 'info'; detail: string; fix: string; evidence: string }
interface Category { id: string; label: string; grade: string; score: number; checks: Check[] }
interface Issue extends Check { category: string }
interface Observation { url: string; fetchedAt: string; methodologyVersion: string; score: number; title: string; checks: (Check & { rule: string; category: string })[] }
interface Fix { key: string; url: string; rule: string; label: string; category: string; severity: 'fail' | 'warn'; detail: string; fix: string; evidence: string; status: 'open' | 'in-progress' | 'done'; firstSeen: string; lastSeen: string; verifiedAt: string | null }
interface Project { id: string; name: string; origin: string; audits: Observation[]; fixes: Record<string, Fix>; search: { previous: SearchExport; current: SearchExport } | null }
interface StudioState { version: 2; selectedId: string | null; projects: Project[] }
interface OperationError { message: string } // thrown locally, displayed via textContent
```

## Data Models

| Entity | Field | Type | Constraints |
|---|---|---|---|
| Project | id / name / origin | string | unique id and origin; name 1–80 characters |
| Project | audits | observation[] | max 25 URLs, max five reports each; bounded report snapshots |
| Project | fixes | record | key = URL + stable check id; manual state and verification provenance |
| Project | search | comparison or null | two exports with declared periods and filter scope; max 10,000 rows each |
| Observation | url / time / method / score / checks | fields | HTTP(S) same-origin, finite score 0–100, stable ids |
| Fix | status / verifiedAt / lastSeen | fields | open, in-progress, done; verified state derived from observations |
| Search row | key / clicks / impressions / position | fields | unique dimension key, finite nonnegative metrics, clicks <= impressions |
| State | version / selectedId / projects | fields | version 2, valid selection, max five projects; 4 MB UTF-8 |

## Out of Scope

- OS-1: Backlink index, keyword-volume estimates and competitor traffic database: require licensed data and budget decisions.
- OS-2: Automated batch crawling, scheduled jobs, rank tracking and unlimited audits: require durable quotas and operating-cost validation first.
- OS-3: GSC OAuth, cloud sync and team permissions: require separate consent and live integration validation. Explicit local JSON backup provides portability now.
- OS-4: Price changes, new subscriptions, payment repair and publishing/deployment: preserve existing commercial contracts for this release candidate.
- OS-5: Rendering target-page JavaScript, Core Web Vitals measurement, schema eligibility certification or proving Google indexability: outside a fetched-HTML auditor.

## Competitive direction and sources

Ahrefs and Semrush provide site-wide issue discovery; this first release focuses on the useful sequence from evidence to prioritized work to recheck. Extend to bounded crawling and search-provider integrations after this foundation has pilot usage and operating measurements.

- https://ahrefs.com/site-audit
- https://www.semrush.com/siteaudit/
- https://neilpatel.com/ubersuggest/
- https://developers.google.com/search/updates
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
