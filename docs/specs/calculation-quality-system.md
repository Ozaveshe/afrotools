# Spec: Calculator and Jurisdictional Data Quality System

**Author:** Codex with AfroTools repository evidence
**Date:** 2026-07-12
**Status:** Approved
**Reviewers:** AfroTools owner
**Related contracts:** `docs/COUNTRY-IDENTITY-CONTRACT.md`, `docs/source-confidence-model.md`, `docs/PAYE-STANDARD.md`, `data/tool-verification.schema.json`

## Context

AfroTools contains calculator implementations in browser engines, server PAYE
engines, inline country pages, and data-backed utility families. Existing
controls cover portions of the problem: 119 PAYE and VAT route records have
source-review metadata, 53 server PAYE engines expose a fixed country and
currency, the source-confidence registry discloses stale datasets, and the
country-identity audit checks route/currency/jurisdiction invariants. These
controls do not yet form one release gate that traces every high-risk result to
a versioned formula artifact, exercises boundary fixtures, and rejects
incompatible external data.

The current checkout also contains more than ten thousand unrelated changed
paths. This quality-system work therefore adds narrow source-of-truth artifacts
and validators. It must not rewrite statutory rates merely to make a new test
pass. Existing output changes are permitted only when separately sourced,
reviewed, and documented fixture by fixture.

## Functional Requirements

- FR-1: The system MUST inventory calculation artifacts from `engines/`, `assets/js/engines/`, `netlify/functions/_engines/`, and registered high-risk PAYE/VAT route implementations.
- FR-2: Every inventory record MUST use one risk domain: `tax_payroll`, `pensions_benefits`, `loans_financial`, `utilities_meters`, `exchange_rates`, `health`, `agriculture`, `legal_regulatory`, or `general_utility`.
- FR-3: Every inventory record MUST use one risk level: `high`, `medium`, or `low`, with a machine-readable rationale.
- FR-4: Every high- and medium-risk formula record MUST document jurisdiction, applicable population, formula version, authoritative or reviewed source, effective start and end state, thresholds/bands/rates/caps, rounding policy, currency/unit assumptions, known exclusions, last verification, owner, and user-facing disclaimer.
- FR-5: Formula versions MUST be immutable identifiers tied to a SHA-256 digest of the executable formula artifact and its declared parameter snapshot.
- FR-6: The system MUST map every high-risk PAYE/VAT route in `data/tool-verification.json` to exactly one versioned formula record and at least one source URL.
- FR-7: The system MUST NOT silently resolve an unknown jurisdiction or a date outside a formula's declared effective interval to another formula.
- FR-8: The system MUST provide data-driven golden fixtures for high-risk shared engines and representative medium-risk engines.
- FR-9: Golden fixtures MUST cover zero, negative, exact boundaries, very large values, decimal precision, leap/date boundaries, missing optional input, unsupported jurisdiction/date, changed tax year, and legally relevant rounding stages where applicable.
- FR-10: Every fixture MUST cite its formula version and evidence basis and MUST record an expected-result change note when its expected output changes.
- FR-11: Duplicated formula constants MUST move to schema-validated version records when the runtime can consume them without changing results.
- FR-12: When immediate centralization would change a legacy public runtime, the duplicate MUST be registered as protected debt and covered by a digest or parameter-drift test.
- FR-13: Every externally refreshed calculation dataset MUST declare source, retrieval timestamp, schema version, freshness limit, compatibility validator, last-known-good strategy, and public stale-label policy.
- FR-14: An incompatible external payload MUST be rejected before persistence so the prior valid value remains available.
- FR-15: Stale external data MUST be labeled `stale` or `estimate` and MUST NOT be labeled `live`, `current`, or `official verified` solely because a fetch succeeded.
- FR-16: The quality gate MUST cross-check formula jurisdiction, mapped route country, canonical currency, units, source jurisdiction, and effective dates against the country identity registry.
- FR-17: A protected high-risk formula change MUST require a formula-version update, provenance review record, fixture coverage, fixture-delta notes, and code-owner review.
- FR-18: The quality gate MUST emit a deterministic JSON and Markdown report with inventory counts, traceability gaps, stale datasets, fixture results, and protected-change findings.
- FR-19: The quality gate MUST operate without live network or Supabase access.
- FR-20: Existing calculator outputs MUST remain unchanged unless a fixture-by-fixture delta document explicitly records the change and its source basis.

## Non-Functional Requirements

- NFR-1: The offline quality gate MUST finish within 30 seconds on the repository's supported Node.js runtime.
- NFR-2: Generated reports MUST be deterministic for the same checkout and explicit `--as-of` date.
- NFR-3: Validation errors MUST identify the formula or dataset id, field, and owning path.
- NFR-4: The quality gate MUST use only committed repository inputs and MUST NOT log secrets or user data.
- NFR-5: New JSON contracts MUST reject unknown top-level fields unless the schema explicitly allows them.
- NFR-6: Formula resolution MUST be case-insensitive for ISO country codes and MUST return structured unsupported errors rather than a fallback value.
- NFR-7: No automated command in this workflow may rewrite formula rates, thresholds, caps, or expected fixture values without an explicit `--write` operation.

## Acceptance Criteria

### AC-1: Complete engine-domain inventory (FR-1, FR-2, FR-3)
Given the current repository checkout
When the calculation-quality inventory check runs
Then every JavaScript artifact in the configured engine roots appears exactly once in the inventory
And each record has a valid risk domain, risk level, and rationale

### AC-2: High/medium metadata completeness (FR-4, FR-5)
Given an inventory record classified high or medium risk
When the formula registry is validated
Then all required provenance, applicability, effective-period, parameter, rounding, assumption, exclusion, owner, disclaimer, and version fields are present
And the formula digest matches the current executable artifact

### AC-3: High-risk route traceability (FR-6)
Given the high-risk PAYE and VAT entries in `data/tool-verification.json`
When traceability is checked
Then every route maps to exactly one formula record
And that record maps to at least one non-AfroTools source URL

### AC-4: Unsupported jurisdiction is explicit (FR-7, NFR-6)
Given no formula exists for ISO code `XX`
When the resolver is asked for `XX`
Then it returns `UNSUPPORTED_JURISDICTION`
And it does not return a formula from any supported country

### AC-5: Unsupported date is explicit (FR-7, NFR-6)
Given a versioned formula with a closed effective interval
When the resolver is asked for the day after its effective end
Then it returns `UNSUPPORTED_DATE`
And it does not return the nearest or newest formula automatically

### AC-6: Golden boundary fixtures (FR-8, FR-9, FR-10)
Given the committed golden-fixture set
When the fixture runner executes
Then every required edge-case class is represented
And every expected value matches the current registered formula version within its declared tolerance

### AC-7: Formula change requires review artifacts (FR-17, FR-20)
Given a protected formula artifact differs from its registered digest
When the review gate runs
Then the gate fails with `FORMULA_DIGEST_MISMATCH`
And it names the required version, provenance, fixture, and fixture-delta updates

### AC-8: Compatible external refresh (FR-13, FR-14)
Given a valid external payload with source, retrieval timestamp, and matching schema
When it is validated before persistence
Then validation succeeds
And the payload is eligible to replace the last-known-good value

### AC-9: Incompatible external refresh (FR-13, FR-14)
Given a payload missing a required field or using an incompatible schema version
When it is validated before persistence
Then validation fails with `INCOMPATIBLE_EXTERNAL_DATA`
And the persistence function is not called

### AC-10: Stale disclosure (FR-15)
Given an otherwise valid external payload older than its freshness limit
When freshness is evaluated
Then its public state is `stale`
And its public labels do not contain `live`, `current`, or `official verified`

### AC-11: Country identity invariants (FR-16)
Given a formula route for one country
When the quality gate compares it with `data/registry/countries.json`
Then formula jurisdiction, route country, currency, source jurisdiction, and declared units agree
And any mismatch fails with a record-level diagnostic

### AC-12: Deterministic report (FR-18, FR-19, NFR-2)
Given the same checkout and explicit as-of date
When the quality report is generated twice
Then both JSON reports are byte-identical
And no network or Supabase access occurs

### AC-13: No silent expected-output changes (FR-10, FR-20)
Given a golden fixture's actual result changes
When no fixture-delta note references that fixture id
Then the gate fails
And the prior expected result remains unchanged

### AC-14: Existing output preservation (FR-20)
Given the baseline golden fixtures captured before implementation
When the new quality system is enabled
Then all baseline fixture outputs remain unchanged
And the fixture-delta report states that there are zero result changes

### AC-15: Centralized constants or protected duplication (FR-11, FR-12)
Given a high- or medium-risk artifact contains formula constants also present in another runtime
When the quality gate inspects the formula record
Then the constants are loaded from a schema-validated version record where the runtime supports it without result changes
And every remaining legacy copy is named in `protectedDuplicates` and covered by a digest or parameter-drift assertion

## Edge Cases and Error Scenarios

- EC-1: An engine file is added without an inventory entry -> fail with `UNINVENTORIED_ENGINE`.
- EC-2: A high-risk record has an empty source list -> fail with `MISSING_AUTHORITATIVE_SOURCE`.
- EC-3: A source URL points to AfroTools itself -> do not count it as authoritative evidence.
- EC-4: An effective end precedes the effective start -> fail with `INVALID_EFFECTIVE_PERIOD`.
- EC-5: Two formula versions overlap for the same jurisdiction and formula family -> fail with `AMBIGUOUS_FORMULA_VERSION`.
- EC-6: A fixture uses `NaN`, `Infinity`, or an absent expected selector -> fail with a fixture-level diagnostic.
- EC-7: A formula uses no currency -> require explicit `currency: null` and non-currency unit assumptions.
- EC-8: A pan-African general utility uses no jurisdiction -> require `jurisdictions: ["ALL"]` and forbid statutory claims.
- EC-9: A live-data key has no registered compatibility validator -> reject writes for that protected key.
- EC-10: A stale payload is valid -> retain it as last-known-good but expose `stale`, never `live`.
- EC-11: An external fetch fails -> keep the prior valid payload and record the failed attempt separately from retrieval time.
- EC-12: The current date is a leap day -> formula resolution compares ISO calendar dates without rolling into another tax period.
- EC-13: A localized route maps to its canonical formula -> locale may differ, but jurisdiction and currency must not.
- EC-14: A formula file changes only formatting -> digest normalization may preserve the version only if the executable AST/parameter snapshot is unchanged.
- EC-15: The repository has unrelated dirty files -> the gate reports only protected calculation-quality paths and does not mutate unrelated work.

## API Contracts

Validation notation only: `POST /_repository/formula-resolve` represents the
request/response shape for test extraction. It MUST NOT be exposed as a public
or Netlify HTTP endpoint; implementation is a repository-local function call.

```typescript
type RiskLevel = "high" | "medium" | "low";
type RiskDomain =
  | "tax_payroll"
  | "pensions_benefits"
  | "loans_financial"
  | "utilities_meters"
  | "exchange_rates"
  | "health"
  | "agriculture"
  | "legal_regulatory"
  | "general_utility";

interface FormulaResolveRequest {
  formulaFamily: string;
  jurisdiction: string; // ISO alpha-2 or ALL
  effectiveOn: string;  // YYYY-MM-DD
}

interface FormulaResolveSuccess {
  ok: true;
  formulaId: string;
  formulaVersion: string;
  artifactPath: string;
  jurisdiction: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

interface FormulaResolveFailure {
  ok: false;
  error: "UNSUPPORTED_JURISDICTION" | "UNSUPPORTED_DATE" | "AMBIGUOUS_FORMULA_VERSION";
  formulaFamily: string;
  jurisdiction: string;
  effectiveOn: string;
}

interface ExternalDataValidationResult {
  valid: boolean;
  code: "OK" | "INCOMPATIBLE_EXTERNAL_DATA" | "STALE_EXTERNAL_DATA";
  publicState: "fresh" | "acceptable" | "stale" | "unavailable";
  errors: string[];
  retrievedAt: string | null;
  preserveLastKnownGood: boolean;
}

interface QualityReport {
  schemaVersion: number;
  asOf: string;
  inventory: { total: number; high: number; medium: number; low: number };
  traceability: { protectedRoutes: number; mappedRoutes: number; gaps: string[] };
  fixtures: { total: number; passed: number; failed: number; changes: string[] };
  externalData: { total: number; stale: string[]; incompatible: string[] };
  findings: Array<{ code: string; severity: "error" | "warning"; id: string; path: string; message: string }>;
}
```

No new HTTP endpoint is required. These contracts are repository-local Node.js
APIs and build artifacts.

## Data Models

### EngineInventoryRecord

| Field | Type | Constraints |
|---|---|---|
| id | string | Stable, unique, kebab-case |
| artifactPath | string | Existing repository-relative JS or HTML path |
| formulaFamily | string | Stable family id |
| riskLevel | RiskLevel | Required |
| riskDomain | RiskDomain | Required |
| rationale | string | Required, at least 20 characters |
| formulaIds | string[] | Required for high/medium; may be empty for low |
| routeIds | string[] | Canonical tool ids or route ids using the engine |
| owner | string | Required |

### FormulaRecord

| Field | Type | Constraints |
|---|---|---|
| id | string | Stable, unique |
| formulaFamily | string | Required |
| formulaVersion | string | Semantic label plus SHA-256 digest |
| artifactPath | string | Existing protected artifact |
| artifactDigest | string | `sha256:` plus 64 lowercase hex characters |
| jurisdictions | string[] | ISO alpha-2 values or `ALL` |
| sourceJurisdictions | string[] | ISO alpha-2 values or `ALL` |
| applicablePopulation | string | Required |
| sources | SourceReference[] | At least one for high/medium |
| effectiveFrom | date or null | Null only with explicit `effectiveDateStatus` |
| effectiveTo | date or null | Null means open-ended only when status is `declared` |
| effectiveDateStatus | string | `declared`, `not-applicable`, or `review-required` |
| parameters | object | Exact bands/rates/thresholds/caps or protected parameter reference |
| rounding | object | Method, precision, and stages |
| currency | string or null | ISO currency, `MULTI`, or null when non-monetary |
| units | string[] | Required, may contain `currency` |
| knownExclusions | string[] | At least one for high/medium |
| lastVerified | date | Required for high/medium |
| owner | string | Required |
| disclaimer | string | Required for high/medium |
| protectedDuplicates | string[] | Legacy copies guarded by drift checks |

### GoldenFixture

| Field | Type | Constraints |
|---|---|---|
| id | string | Stable, unique |
| formulaId | string | Must exist |
| formulaVersion | string | Must match referenced formula |
| caseClasses | string[] | One or more required edge-case classes |
| operation | string | `calculate`, `validate`, or `resolve` |
| input | object | JSON-serializable |
| expected | object | Selector-to-value assertions |
| tolerance | number | Non-negative |
| evidence | SourceReference | Required |
| changeNote | string | `baseline-no-change` or sourced delta note |

### ExternalDataContract

| Field | Type | Constraints |
|---|---|---|
| id | string | Stable, unique |
| storageKey | string | Runtime key |
| staticFallbackPath | string or null | Existing safe fallback when applicable |
| sourceRegistryId | string | Must exist in source registry |
| schemaVersion | integer | Positive |
| requiredPaths | string[] | Required payload fields |
| retrievedAtPath | string | Required |
| sourcePath | string | Required |
| maxAgeHours | integer | Positive |
| lastKnownGoodStrategy | string | `retain-existing`, `static-fallback`, or `reject-unavailable` |
| incompatibleAction | string | Must be `reject-before-write` |
| publicStaleLabel | string | Must contain `stale` or `estimate` |
| forbiddenStaleLabels | string[] | Must include `live` and `current` |

### FixtureDelta

| Field | Type | Constraints |
|---|---|---|
| fixtureId | string | Must exist |
| previousExpected | object | Required when changed |
| nextExpected | object | Required when changed |
| reason | string | Required |
| sourceUrl | URI | Required for statutory/result changes |
| reviewedBy | string | Required |
| reviewedAt | date | Required |

## Out of Scope

- OS-1: Changing any tax, payroll, pension, benefit, tariff, health, agriculture, legal, loan, or utility formula value without separately verified authoritative evidence.
- OS-2: Claiming every legacy formula is substantively correct; this work proves traceability and exposes review-required records.
- OS-3: Live source refreshes, live Supabase writes, or production deployment.
- OS-4: Rewriting all legacy inline calculators to one runtime in this change; protected duplicates receive drift coverage first.
- OS-5: Medical diagnosis, legal certification, tax filing, investment advice, or guaranteed-result claims.
- OS-6: Changing public routes, canonicals, locale coverage, analytics events, or monetization behavior.
