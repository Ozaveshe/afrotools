# Spec: Public Claims and Data-Flow Contract

**Author:** Codex with AfroTools product evidence owners
**Date:** 2026-07-11
**Status:** Approved
**Reviewers:** AfroTools product, privacy, localization, data, Pro, and release owners
**Related contracts:** `docs/ARCHITECTURE.md`, `docs/PRO-FENCE.md`, `docs/PRO-APP-READINESS.md`, `docs/ai-privacy-and-safety.md`, `docs/source-confidence-model.md`, `docs/specs/localization-platform-and-coverage-contract.md`

## Context

AfroTools already has a public-claim audit, source-confidence metadata, Pro readiness documentation, privacy notices, locale catalogs, and live-data status components. They do not yet form one enforceable contract. The existing audit has thirteen coarse rows, scans selected directories, and accepts a phrase when any broad owner pattern matches an allowed directory. It does not define approved wording, prohibited absolutes, verification/expiry dates, exceptions, localized wording, feature data flows, or point-of-use disclosure requirements.

Repository and browser evidence shows material contradictions. `/about/` says public tools are free forever. `/pricing/` promises unlimited cloud history, tax-law email alerts, immediate one-click cancellation, universally browser-run calculations, end-to-end encrypted medical reports, and permanent non-storage. Pro readiness says Payroll is the only active Pro app and most other Pro apps are local or blocked shells. The dashboard labels fallback market values as a live snapshot when API requests fail. Privacy copy is more nuanced, but still contains absolute third-party-sharing and instant-unsubscribe wording that is not fully demonstrated by the implementation.

The actual system has multiple data boundaries: browser-only calculators and PDF operations; optional Anthropic-backed AI through AfroTools functions after consent; Supabase authentication and RLS-backed workspace/history/vault records; Paystack and legacy Stripe checkout adapters; consent-gated GA4 product analytics plus a current unconditional lazy GA4 loader; local and cloud document paths; Netlify forms/email workflows; and server-backed data lookups with source-specific freshness. Live read-only verification on 2026-07-11 confirmed the active AfroTools Supabase URL `https://zpclagtgczsygrgztlts.supabase.co`, RLS-enabled `workspace_items`, `calculation_history`, `vault_documents`, and a private `vault` bucket with a 10 MB limit. The legacy vault browser fallback still embeds a different project URL, so public vault claims must remain conditional until that fallback is removed or proven harmless.

This feature creates a canonical public-claims registry, a feature data-flow registry, a deterministic linter/report, build-time claim projection, and precise copy on the highest-risk shared surfaces. It does not weaken real browser-local protections; it scopes them to the features that actually have those protections.

## Functional Requirements

- FR-1: The system MUST define one versioned claims registry for public product claims.
- FR-2: Every claim record MUST contain a stable key, category, approved meaning, permitted wording, prohibited absolute wording, evidence sources, evidence owner, last-verified date, review/expiry date, applicable surfaces, exceptions, and localized translations.
- FR-3: Claim translations MUST be keyed by public locale and MUST NOT introduce a stronger semantic promise than the English approved meaning.
- FR-4: Planned/component-only locales MUST NOT be treated as launched public claim translations.
- FR-5: The system MUST define a versioned feature data-flow registry.
- FR-6: Every data-flow record MUST contain data entered, browser processing, network destination, storage location, retention, account association, third-party processor, consent/disclosure, deletion behavior, export behavior, evidence sources, and point-of-use surfaces.
- FR-7: Data flows MUST distinguish static calculators, optional AI requests, authenticated synchronization, payment processing, analytics, local document/file processing, cloud vault processing, forms/email, and server-backed data lookups.
- FR-8: Static calculator copy MUST state browser-local behavior only for routes whose normal calculation path does not transmit the entered calculation payload.
- FR-9: AI copy MUST state that deterministic routing can work without model consent and that optional AI content may be sent to AfroTools servers and the configured provider after consent.
- FR-10: Provider-specific copy MUST identify Anthropic only as the currently supported configured provider and MUST preserve an unavailable/fallback state when no key/provider is configured.
- FR-11: Account sync copy MUST distinguish device-local state from RLS-backed account records and MUST condition cloud claims on sign-in, supported item types, and successful sync.
- FR-12: Vault copy MUST distinguish local downloads from explicit authenticated uploads and MUST state the current supported file types/size limit only when sourced from verified configuration.
- FR-13: Payment copy MUST distinguish checkout initialization, provider processing, subscription state, cancellation request, and confirmed provider-side cancellation.
- FR-14: Analytics copy MUST distinguish consent-gated product events, third-party script loading, session/local diagnostics, and prohibited raw sensitive payloads.
- FR-15: Document processing copy MUST distinguish local PDF/image processing, optional TTS/API processing, explicit vault upload, AI content consent, and downloaded files retained by the user.
- FR-16: Server-backed lookup copy MUST name or link the source/freshness owner and MUST expose loading, current/cached, stale, and unavailable states.
- FR-17: `live` and `real-time` MUST be treated as service-level claims requiring a source, valid observation timestamp, maximum live age, failure state, and stale/unavailable downgrade.
- FR-18: A missing timestamp, failed request, expired observation, static fallback, or unknown source MUST NOT render a `live` or `real-time` label.
- FR-19: `official`, `verified`, `accurate`, `compliant`, and equivalent localized authority claims MUST require evidence metadata that supports the exact scope.
- FR-20: `guaranteed`, government-approved, regulator-approved, and outcome-guarantee wording MUST be prohibited unless a claim record explicitly names the legal evidence and surface.
- FR-21: Tax-year, effective-date, statutory-source, and rate claims MUST identify jurisdiction, effective period or review date, and source owner.
- FR-22: Performance, page-size, offline, 2G, and device-support claims MUST include a reproducible measurement/compatibility method and review date.
- FR-23: The free-core claim MUST preserve guest access to public calculators and results without implying every current or future feature is permanently free.
- FR-24: Free account creation MUST be distinct from free guest use and from permanently free product promises.
- FR-25: Pro copy MUST be derived from current readiness and entitlement evidence and MUST NOT advertise shell/pending capabilities as active.
- FR-26: Pricing MUST NOT advertise unlimited cloud history, tax-law email alerts, instant one-click cancellation, medical-report encryption, or other capabilities without passing evidence records.
- FR-27: Homepage, About, Privacy, Pricing, Dashboard, and localized landing claims MUST use approved registry wording or generated selectors instead of independent stronger promises.
- FR-28: Build-time initial HTML MUST contain the correct claim wording; JavaScript MUST NOT be required to correct a false absolute.
- FR-29: The linter MUST scan every public HTML page plus shared public JavaScript/JSON claim sources, excluding disposable/generated evidence directories and non-public operational files.
- FR-30: Every detected sensitive public claim MUST map to exactly one applicable claim record or produce a record-level build error.
- FR-31: The linter MUST reject prohibited variants even when a broader claim record exists for that surface.
- FR-32: The linter MUST reject missing/invalid dates, expired claims, missing evidence files, unknown locales, missing public-locale translations, duplicate keys, invalid regexes, and orphan selectors.
- FR-33: The linter MUST report claim hits by claim, category, locale, surface, wording variant, expiry state, and evidence owner.
- FR-34: The build MUST generate deterministic JSON and Markdown claim reports and a deterministic data-flow report.
- FR-35: Existing specialist audits MAY remain evidence sources, but broad directory allowance MUST NOT substitute for exact claim validation.
- FR-36: The platform MUST provide a build-time selector mechanism for named claim variants and localized wording.
- FR-37: Selector projection MUST preserve HTML escaping and valid Unicode and MUST fail on unknown claim/variant/locale combinations.
- FR-38: Point-of-use disclosures MUST be present for AI, account sync, payments, analytics consent, cloud vault upload, document network processing, and server-backed lookup states.
- FR-39: Claim evidence MUST be repository-backed or explicitly marked as live-read evidence with project, date, and read-only query scope.
- FR-40: The implementation MUST NOT transmit user inputs, add analytics, or add a network dependency to enforce claims.

## Non-Functional Requirements

- NFR-P1: `npm run claims:check` MUST finish within 60 seconds on the current repository on the baseline development machine.
- NFR-P2: Generated selector text MUST be present in source HTML and `dist`; it MUST not add client-side hydration work.
- NFR-S1: Claims validation MUST run without secrets and MUST NOT query live services during ordinary builds.
- NFR-S2: Reports MUST contain file paths and claim metadata only; they MUST NOT contain raw user data, secrets, tokens, or live row contents.
- NFR-S3: Registry patterns and selectors MUST be treated as configuration, not executable code.
- NFR-A1: Repaired point-of-use disclosures MUST remain visible, readable, keyboard reachable where interactive, and associated with the affected control or status.
- NFR-A2: Live/stale/unavailable status changes MUST use an accessible status element and must not rely on color alone.
- NFR-R1: The build MUST fail deterministically with claim key, owner file, field, and offending phrase for every inconsistency.
- NFR-R2: Registry/report generation MUST be idempotent: write followed by check produces no changes.
- NFR-L1: All claim wording MUST be UTF-8 NFC and public-locale translations MUST pass the localization manifest contract.
- NFR-SEO1: Repaired claims MUST remain in initial HTML and metadata; localized pages MUST not gain false equivalents or stronger translated promises.
- NFR-BW1: The platform MUST add no runtime request and no third-party library.

## Acceptance Criteria

### AC-1: Complete claim schema (FR-1, FR-2, FR-32, FR-39)
Given the canonical claims registry
When `npm run claims:check` validates it
Then every record has all required fields, unique stable keys, valid evidence, current review dates, applicable surfaces, exceptions, and translations.

### AC-2: Complete data-flow schema (FR-5, FR-6, FR-7)
Given the feature data-flow registry
When claims validation runs
Then every required feature class has a complete behavior/evidence record and every point-of-use claim references a valid flow.

### AC-3: Unsupported absolute fails (FR-20, FR-31)
Given a fixture page containing `All calculations run in your browser`
When the claims linter scans it
Then validation fails with the prohibited wording, claim key, file, and line.

### AC-4: Unregistered sensitive claim fails (FR-29, FR-30)
Given a fixture page containing a new sensitive live/privacy/free/authority claim with no applicable record
When validation runs
Then the build fails at that record-level location.

### AC-5: Expired evidence fails (FR-2, FR-32)
Given a claim whose review date is earlier than the build date
When validation runs
Then the build fails and identifies the expired claim and evidence owner.

### AC-6: Localized strengthening fails (FR-3, FR-4)
Given a public-locale translation containing a prohibited absolute not present in the approved meaning
When validation runs
Then validation fails for that locale and claim key.

### AC-7: Named copy projection (FR-27, FR-28, FR-36, FR-37)
Given a page with a named claim selector
When claims generation runs
Then initial HTML contains the registered localized wording and check mode is idempotent.

### AC-8: Free/Pro consistency (FR-23, FR-24, FR-25, FR-26)
Given Homepage, About, Pricing, Privacy, and Pro readiness sources
When the claims audit runs
Then guest-free wording is consistent and unsupported active Pro promises are absent.

### AC-9: Browser-local scope (FR-8, FR-12, FR-15)
Given a local calculator or local PDF flow
When its approved privacy claim is rendered
Then it scopes no-upload wording to that flow and names AI, sync, TTS, vault, or other network exceptions.

### AC-10: AI point-of-use disclosure (FR-9, FR-10, FR-38)
Given a model-assisted action
When the user has not consented
Then the request is not sent and the UI states what may be sent and to whom before consent.

### AC-11: Sync point-of-use disclosure (FR-11, FR-38)
Given device-local work and an account-sync control
When sync is unavailable, pending, failed, or signed out
Then the UI does not label the item cloud-synced and shows the accurate state.

### AC-12: Payment point-of-use disclosure (FR-13, FR-38)
Given a Pro checkout/cancellation surface
When provider confirmation is not available
Then copy describes initiation or support review and does not claim completed cancellation or subscription change.

### AC-13: Analytics disclosure (FR-14, FR-38)
Given analytics consent is not accepted
When a page loads
Then product events are not sent and public copy does not describe the session as anonymous when third-party script/request metadata may exist.

### AC-14: Freshness downgrade (FR-16, FR-17, FR-18)
Given a failed lookup, missing timestamp, static fallback, or expired observation
When the status UI renders
Then it uses cached/static/stale/unavailable wording and never `live` or `real-time`.

### AC-15: Authority/effective-date evidence (FR-19, FR-20, FR-21)
Given a tax/legal/regulatory claim
When validation runs
Then official/verified wording is allowed only with matching jurisdiction, effective/review dates, and source evidence.

### AC-16: Claims report (FR-33, FR-34, FR-35, FR-39)
Given a complete repository scan
When generation runs
Then JSON and Markdown reports explain raw hits, approved hits, prohibited hits, unmatched hits, locales, surfaces, owners, and upcoming/expired reviews.

### AC-17: Representative initial HTML (FR-27, FR-28, NFR-SEO1)
Given JavaScript is disabled on About, Privacy, and Pricing
When the pages load
Then unsupported absolutes are absent and precise approved copy is visible.

### AC-18: Publish artifact parity (FR-28, NFR-P2)
Given a successful deploy build
When source and `dist` representative claim surfaces are compared
Then claim selectors, prohibited-wording absence, and data-flow disclosures match.

### AC-19: Performance and compatibility evidence (FR-22)
Given a public performance, offline, 2G, page-size, or device-support phrase
When the claims linter validates it
Then the matching claim record names a reproducible measurement or compatibility check and a current review date.

### AC-20: Zero runtime enforcement cost (FR-40, NFR-S1, NFR-BW1)
Given claims generation and validation are complete
When representative pages load
Then claim enforcement adds no runtime request, user-data transmission, third-party dependency, or client hydration step.

## Edge Cases and Error Scenarios

- EC-1: Duplicate claim key -> fail with both owner locations.
- EC-2: Missing translation for any public locale -> fail; planned locales remain optional and non-public.
- EC-3: Translation has different interpolation variables -> fail with locale/key.
- EC-4: Evidence path is missing -> fail; a URL-only evidence note is insufficient for repository-build approval.
- EC-5: `lastVerifiedAt` or `reviewAfter` is malformed -> fail.
- EC-6: `reviewAfter` precedes `lastVerifiedAt` -> fail.
- EC-7: Current date exceeds `reviewAfter` -> fail even if wording was previously allowed.
- EC-8: Prohibited pattern overlaps permitted wording -> prohibited pattern wins.
- EC-9: Claim selector appears inside a generated page with no source owner -> report the generated owner and source-policy gap; do not silently rewrite unknown output.
- EC-10: Locale route is an English fallback/unavailable page -> do not treat its English copy as a native translation.
- EC-11: Data API returns 200 without a timestamp/source -> state is unavailable or static, never live.
- EC-12: Data API returns stale cached data -> show cached/stale with timestamp and source.
- EC-13: Account sync request fails -> preserve device copy and display sync failure; do not relabel as cloud.
- EC-14: AI provider key is absent or provider times out -> deterministic fallback remains available and provider availability claims downgrade.
- EC-15: Payment provider redirects but webhook/profile update is unconfirmed -> show pending/provider confirmation state.
- EC-16: Vault client cannot obtain the configured AfroTools client -> do not promise upload/storage; keep local download path.
- EC-17: Analytics script exists but consent is absent -> no claim of anonymous analytics is allowed solely because event payloads omit PII.
- EC-18: File tool uses TTS, AI, email, cloud sharing, or vault upload -> local-only claim must name that exception before transfer.
- EC-19: Educational article uses `official` descriptively about a government source -> map to an educational/source-context claim or report for review; do not grant platform endorsement.
- EC-20: Build scans minified/generated assets -> avoid duplicate source/generated hit inflation while still scanning public initial HTML.

## API Contracts

No new network endpoint is introduced. The claim/data-flow inventory describes these existing network contracts without changing them:

- `POST /.netlify/functions/ai-advisor` and `POST /api/ai-advisor` - optional consent-gated AI request.
- `POST /.netlify/functions/ai-route-intent` - deterministic routing with optional model consent.
- `GET|POST|DELETE /api/workspace` - authenticated RLS-backed workspace items.
- `POST /.netlify/functions/create-subscription` - Paystack checkout initialization.
- `POST /.netlify/functions/create-checkout` - legacy Stripe checkout initialization where configured.
- `GET|POST /api/pro/billing` - authenticated billing status/actions routed to provider APIs.
- Feature-specific `GET /api/*` routes - server-backed data lookup with source/freshness-specific responses.

The build-time module exposes these CommonJS contracts:

```ts
interface ClaimValidationIssue {
  code: string;
  claimKey?: string;
  flowKey?: string;
  locale?: "en" | "fr" | "sw" | "yo" | "ha";
  file: string;
  line?: number;
  field: string;
  phrase?: string;
  message: string;
}

interface ClaimsBuildResult {
  ok: boolean;
  errors: ClaimValidationIssue[];
  warnings: ClaimValidationIssue[];
  scannedFiles: number;
  rawHits: number;
  approvedHits: number;
  generatedFiles: string[];
}

interface PublicClaimsModule {
  loadClaimsRegistry(): ClaimsRegistry;
  loadDataFlows(): DataFlowRegistry;
  validateRegistries(options?: { today?: string }): ClaimsBuildResult;
  scanPublicClaims(options?: { roots?: string[]; fixtureFiles?: string[] }): ClaimsBuildResult;
  projectClaimSelectors(options?: { write?: boolean }): ClaimsBuildResult;
  buildReports(options?: { write?: boolean }): ClaimsBuildResult;
}
```

Errors are build errors, not HTTP responses. Each error MUST contain a stable code and a record/file-level owner.

## Data Models

### ClaimRecord

| Field | Type | Constraints |
|---|---|---|
| key | string | Stable kebab/dot key; unique; immutable |
| category | enum | counts, free-pro, privacy, ai, freshness, authority, performance, statutory, account, payment, analytics, documents |
| approvedMeaning | string | Precise semantic contract; NFC |
| detectionPatterns | string[] | Valid regex strings; at least one |
| permittedWording | object | Named variants; English required |
| prohibitedAbsoluteWording | string[] | Valid regex strings; at least one for sensitive categories |
| evidenceSources | string[] | Existing repository paths or explicit live-read evidence IDs |
| evidenceOwner | string | Named accountable owner |
| lastVerifiedAt | date | ISO date; not future |
| reviewAfter | date | ISO date; after/equal verification; build must not exceed |
| applicableSurfaces | string[] | Route/file globs or named surfaces |
| exceptions | string[] | Explicit non-covered flows/surfaces |
| dataFlowRefs | string[] | Existing flow keys |
| sourceSelector | string/null | Optional canonical registry selector |
| translations | object | `en`, `fr`, `sw`, `yo`, `ha`; same named variants |

### DataFlowRecord

| Field | Type | Constraints |
|---|---|---|
| key | string | Stable unique key |
| featureClass | enum | calculator, ai, account-sync, payment, analytics, document-local, document-network, vault, form-email, server-lookup |
| dataEntered | string[] | Field/content classes, not real user values |
| browserProcessing | string | Required |
| networkDestinations | object[] | Destination, purpose, trigger; empty allowed only for local flow |
| storageLocations | object[] | Location, payload class, account association |
| retention | string | Current behavior or provider-controlled caveat |
| accountAssociation | string | none, optional, required, provider-only |
| thirdPartyProcessors | string[] | Explicit; empty for local |
| consentOrDisclosure | string | Required point-of-use rule |
| deletionBehavior | string | User action and limitations |
| exportBehavior | string | Local/download/account behavior |
| evidenceSources | string[] | Existing repository paths |
| pointOfUseSurfaces | string[] | Route/file globs |
| claimRefs | string[] | Existing claim keys |
| exceptions | string[] | Explicit caveats |

### ClaimHit

| Field | Type | Constraints |
|---|---|---|
| claimKey | string | Existing claim key |
| file | string | Normalized repository path |
| route | string/null | Public route where derivable |
| locale | string | Public locale or `en` |
| line | integer | >= 1 |
| phrase | string | Bounded public phrase, no user data |
| variant | string | Named wording variant or detected-pattern label |
| status | enum | approved, prohibited, unmatched, expired, warning |
| evidenceOwner | string | Copied from claim |

### ClaimsReport

| Field | Type | Constraints |
|---|---|---|
| schemaVersion | string | Semver |
| generatedAt | date | Date only for deterministic daily review |
| summary | object | Scanned files/raw/approved/prohibited/unmatched/expired counts |
| byClaim | object | Stable sorted keys |
| byLocale | object | Public locales |
| bySurface | object | Named surface groups |
| hits | ClaimHit[] | Stable sorted, bounded phrases |
| discrepancies | object[] | Actionable record-level explanation |

## Out of Scope

- OS-1: Changing calculator formulas, tax rates, legal rules, or regulatory data; this goal validates claims around them only.
- OS-2: Adding or replacing analytics, AI, auth, payment, email, storage, or live-data vendors.
- OS-3: Modifying live Supabase schema, policies, rows, buckets, or secrets. Live access is read-only evidence.
- OS-4: Promoting Pro shell apps or implementing promised alerts/history/cancellation features; unsupported promises are removed or downgraded.
- OS-5: Translating every article or tool body. The contract prevents stronger localized sensitive claims and repairs shared/high-risk surfaces.
- OS-6: Removing high-value public routes because their claims are wrong; copy and state are repaired in place.
- OS-7: Guaranteeing third-party retention/deletion beyond documented/provider-controlled behavior.
- OS-8: A framework migration, runtime claims API, client hydration layer, new dependency, visual redesign, commit, push, deploy, or production mutation.

## Implementation Sequence

1. Add red contract fixtures for schema, prohibited variants, expiry, localized strengthening, data flows, selectors, and freshness downgrade.
2. Evolve the existing claim registry into the canonical schema and add the feature data-flow registry.
3. Replace the broad audit with a shared claims module, deterministic generator/checker, selector projection, and reports.
4. Integrate claims generation/checks into package scripts, `npm test`, and the full build.
5. Repair unsupported absolute copy on Homepage/About/Privacy/Pricing/Dashboard and representative localized landing/shared strings using named selectors where reusable.
6. Enforce live-state downgrade in shared freshness components and the dashboard fallback surface.
7. Add browser tests for JavaScript-disabled initial HTML, failed data requests, point-of-use disclosure, localized semantic parity, and `dist` parity.
8. Run the full release proof without committing, pushing, deploying, or mutating production data.
