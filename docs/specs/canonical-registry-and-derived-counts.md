# Spec: Canonical Registry and Derived Counts

**Author:** Codex with product direction from the repository owner
**Date:** 2026-07-11
**Status:** Approved
**Reviewers:** Repository owner
**Related specs:** [Architecture](../ARCHITECTURE.md), [AfroTools AI transformation map](../afrotools-ai-transformation-map.md)

---

## Context

AfroTools currently has useful domain registries, but public totals are calculated or typed independently in multiple HTML pages and scripts. The tool registry contains 3,263 localized rows and expands English tool families into 2,606 public tool experiences; the widget registry contains 223 embeddable records; the category registry contains 32 category identifiers; and the country data contains 54 jurisdictions. Those numbers describe different sets, but several pages label them generically as “tools,” retain old rounded claims, or ship `0` and `--` until JavaScript runs.

The build also has overlapping owners: `tool-registry.js`, `WIDGET-REGISTRY.js`, country data, locale constants, Pro app metadata, pricing modules, page-local category metadata, and build scripts. Existing validators treat many destination and reference failures as warnings and do not explain duplicate canonical routes or alias-count behavior. The result is semantic count drift and weak failure signals.

This change introduces one normalized, validated build model over the existing source owners. It defines stable count semantics, emits canonical JSON and a discrepancy report, and synchronizes initial HTML through named selectors. It does not replace working calculators or routes; it makes their catalog metadata and public totals auditable.

---

## Functional Requirements

- FR-1: The build MUST inventory every repository source and consumer that owns or derives tools, widgets, categories, countries, locales, supported catalog features, publication state, plans, or public headline counts.
- FR-2: The build MUST normalize every tool into a canonical record with explicit `id`, `route`, `canonicalRoute`, `title`, `description`, `categoryId`, `applicability`, `currencies`, `units`, `publicationStatus`, `localeCoverage`, `calculatorVersion`, `sourceVersion`, `dataFreshness`, `widgetEligibility`, `availability`, `deprecated`, and `redirectTarget` fields.
- FR-3: The build MUST expose stable normalized records for widgets, categories, countries, locales, API plans, product subscription plans, Pro apps, and named supported-feature collections.
- FR-4: The validator MUST fail with record-level errors for duplicate IDs, duplicate canonical routes among non-alias records, unknown category/country/locale references, invalid locale states, missing published destinations, normalized route collisions without an explicit alias, invalid alias targets, and count inclusion of redirects or unpublished records without an explicit policy.
- FR-5: The canonical model MUST explicitly classify the four known legacy duplicate-route tool rows as redirect aliases, identify one canonical tool ID for each destination, and exclude the alias rows from published semantic counts.
- FR-6: The canonical model MUST define named selectors for raw tool rows, canonical published tool records, expanded live tool experiences, localized tool records, indexable destinations, published widgets, widget categories, country PAYE widgets, country tax widgets, categories, countries, public site languages, API plans, product subscription options, Pro apps, and category-specific published records.
- FR-7: Each selector MUST include a human-readable label and definition; selectors with different membership rules MUST NOT share the same label.
- FR-8: Build-time count synchronization MUST replace public headline totals through explicit selector markers or target mappings and MUST NOT perform broad numeric regular-expression replacement.
- FR-9: `/widgets/`, `/widgets/demo/`, `/categories/`, and `/developer-tools/` MUST contain correct non-placeholder initial count values before client JavaScript executes.
- FR-10: Client-side enhancement on the required pages MUST use the same membership rules as the build selectors and MUST NOT fall back to fake rounded values.
- FR-11: The build MUST emit a deterministic canonical registry artifact and a deterministic report that compares raw, canonical, published, localized, widget-enabled, redirected, indexable, and expanded records.
- FR-12: The normal `npm run build` path and the focused `counts:sync` path MUST run canonical registry validation before generating or synchronizing downstream count consumers.
- FR-13: The system MUST preserve existing public routes, canonicals, redirects, calculator behavior, widget embed IDs, and plan pricing behavior.
- FR-14: A check mode MUST verify that generated registry artifacts and synchronized HTML are current without writing files.
- FR-15: Page-local presentation metadata MAY remain local, but its category, route, feature, and count references MUST be validated against the canonical model.

---

## Non-Functional Requirements

### Performance

- NFR-P1: Canonical registry load, normalization, validation, report generation, and count synchronization SHOULD complete in under 10 seconds on the repository’s normal local Node.js runtime.
- NFR-P2: The public pages MUST NOT add a blocking network request to obtain registry counts.

### Security and Privacy

- NFR-S1: Registry generation MUST be repository-local and MUST NOT read or write live Supabase data.
- NFR-S2: Generated artifacts MUST NOT contain secrets, private user content, or raw sensitive tool input.

### Accessibility

- NFR-A1: Initial counts MUST remain visible text within the existing accessible labels and headings.
- NFR-A2: Client enhancement MUST NOT replace count labels with ambiguous or unlabeled values.

### Maintainability

- NFR-M1: Selector definitions and count-surface mappings MUST be centralized in a CommonJS build module with no DOM dependency.
- NFR-M2: Generated JSON and Markdown MUST be deterministic for identical repository inputs and MUST NOT include a generation timestamp that creates date-only diffs.
- NFR-M3: Validation errors MUST identify the record type, stable ID, offending field, and expected correction when one is known.

### Reliability

- NFR-R1: A failed validation MUST stop the build before count synchronization or downstream generated-output mutation.
- NFR-R2: The canonical loader MUST not silently substitute an empty array when an authoritative source cannot be parsed.

---

## Acceptance Criteria

### AC-1: Canonical schema is explicit (FR-2, FR-3)

Given the current repository registries
When the canonical registry build runs
Then every normalized tool contains every field required by FR-2
And widgets, categories, countries, locales, plans, Pro apps, and feature collections have stable IDs.

### AC-2: Invalid references fail usefully (FR-4, NFR-M3, NFR-R1)

Given a fixture with an unknown category, country, or locale reference
When validation runs
Then it exits non-zero before synchronization
And the error names the record ID and invalid field.

### AC-3: Route aliases are explicit (FR-4, FR-5)

Given the current four duplicate normalized tool destinations
When normalization runs
Then each non-canonical row is marked deprecated with a redirect target
And no two non-alias published records share a canonical route.

### AC-4: Count semantics are stable (FR-6, FR-7)

Given the generated selector catalog
When a consumer requests a count
Then membership is computed by the named selector definition
And semantically distinct selectors have distinct labels and documented definitions.

### AC-5: Required pages have server-first values (FR-8, FR-9, FR-10, NFR-P2)

Given JavaScript is disabled
When `/widgets/`, `/widgets/demo/`, `/categories/`, and `/developer-tools/` are loaded from the built static files
Then their headline counts equal the corresponding named selector values
And no registry-backed headline counter displays `0`, `--`, or a rounded fallback.

### AC-6: Same semantic count is identical (FR-8, FR-10, FR-14)

Given two HTML surfaces marked with the same selector name
When check mode runs
Then both values equal the generated selector value
And a stale or manually changed value causes a non-zero result.

### AC-7: Reports explain discrepancies (FR-11, NFR-M2)

Given the current catalog
When registry generation completes
Then the JSON and Markdown reports state raw, alias, canonical published, localized, expanded, indexable, widget-enabled, category, country, language, and plan counts
And they list record-level route aliases and any non-fatal coverage gaps.

### AC-8: Build integration is fail-fast (FR-12, NFR-R1)

Given an inconsistent registry
When `npm run build` or `npm run counts:sync` starts
Then canonical validation fails before existing directory, search, minification, SEO, sitemap, or dist generation runs.

### AC-9: Existing behavior remains compatible (FR-13)

Given a valid current checkout
When focused registry tests, link checks, widget tests, lint, type checks, and the relevant browser smoke tests run
Then existing routes, widget IDs, plan APIs, and tool registry globals remain compatible.

### AC-10: No unowned headline totals remain (FR-1, FR-8, FR-15)

Given the tracked set of registry-backed headline count surfaces
When the ownership audit runs
Then each surface is either synchronized by a named selector or documented as a distinct non-registry metric
And the required pages contain no manually maintained registry headline totals.

---

## Edge Cases

- EC-1: An authoritative JavaScript registry fails to parse -> abort with the source path and parser error; do not emit empty output.
- EC-2: Routes differ only by trailing slash, `/index.html`, query string, fragment, repeated slash, or case -> normalize to one collision key and require an explicit alias.
- EC-3: A published destination is an extensionless file, `.html` file, or directory index -> accept the first matching repository destination; otherwise fail with the tool or widget ID.
- EC-4: A tool applies to `ALL` -> validate `ALL` as the sole regional sentinel and derive currencies from all canonical countries without treating it as a 55th country.
- EC-5: A localized route has no English row with the same source ID -> keep it as a valid localized tool if its own destination and locale are valid; report the missing cross-locale linkage as coverage information rather than inventing a route.
- EC-6: A widget points to a category hub instead of a one-to-one tool route -> validate the hub destination and retain `widgetEligibility` linkage by route where possible; report it as unlinked rather than dropping it.
- EC-7: A plan has an unlimited quota represented by `-1` -> retain the value and label it unlimited; do not include it in arithmetic totals.
- EC-8: A synchronized page marker is missing, duplicated, or malformed -> check/write mode fails with the file and selector name.
- EC-9: Identical input produces already-current artifacts -> write mode performs no content change and check mode passes.
- EC-10: The working tree contains unrelated changes -> generators touch only declared artifacts and count surfaces.

---

## API Contracts

No new HTTP endpoint is introduced. In particular, there is no `GET /registry` or other network contract; the build-time CommonJS contract is:

```typescript
interface CanonicalRegistryApi {
  loadSources(): RegistrySources;
  buildCanonicalRegistry(sources?: RegistrySources): CanonicalRegistry;
  validateCanonicalRegistry(registry: CanonicalRegistry): ValidationResult;
  getSelector(registry: CanonicalRegistry, selectorId: string): CountSelector;
  generateArtifacts(options: { write: boolean }): GenerationResult;
  syncCountSurfaces(options: { write: boolean }): SyncResult;
}

interface ValidationResult {
  ok: boolean;
  errors: RegistryIssue[];
  warnings: RegistryIssue[];
}

interface RegistryIssue {
  code: string;
  recordType: string;
  recordId: string;
  field: string;
  message: string;
}
```

Errors are returned for tests and rendered one per line by the CLI as:

```text
[CODE] recordType:recordId field=fieldName - actionable message
```

---

## Data Models

### Canonical Tool

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Stable, unique, non-empty |
| route | string | Normalized public route |
| canonicalRoute | string | Unique among non-alias canonical records |
| title | string | Non-empty |
| description | string | Non-empty for published records |
| categoryId | string | References canonical category |
| applicability | `{scope, countryIds, regionIds}` | `ALL` is normalized to `scope: pan-african` |
| currencies | string[] | ISO-like codes derived from applicability when available |
| units | string[] | Explicit array; empty when unitless or unknown |
| publicationStatus | enum | `published`, `draft`, `unpublished`, `redirect`, `retired` |
| localeCoverage | string[] | References canonical locale IDs |
| calculatorVersion | string or null | Explicit, may be unknown |
| sourceVersion | string or null | Explicit, may be unknown |
| dataFreshness | `{status, asOf}` | Status is `current`, `stale`, `static`, or `unknown` |
| widgetEligibility | `{eligible, widgetIds}` | Derived from widget registry links |
| availability | enum | `free`, `free-and-pro`, `pro`, `internal` |
| deprecated | boolean | True for alias or retired records |
| redirectTarget | `{toolId, route}` or null | Required for redirects |
| indexable | boolean | False for redirects and unpublished records |
| source | object | Original owner and legacy status fields |

### Count Selector

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Stable dotted identifier |
| label | string | User-facing semantic label |
| definition | string | Exact inclusion/exclusion rule |
| value | integer | Non-negative |
| recordIds | string[] | Sorted membership proof, omitted only for expanded synthetic instances |

### Supporting Records

Category, country, locale, widget, plan, Pro app, and feature-collection records each require a stable `id`, publication state, source owner, and their domain-specific route or state fields. A locale state is one of `default`, `published`, `partial`, `build-only`, or `unsupported`. Plan IDs are namespaced as `api:*` or `product:*` so API quota tiers are never conflated with paid subscription price options.

### Source Ownership Inventory

| Domain | Current owner(s) | Canonical treatment |
|--------|------------------|---------------------|
| Tools, categories, tool status, tool families | `assets/js/components/tool-registry.js` | Parsed, normalized, alias-overlaid, validated |
| Widgets, widget categories, iframe destinations | `widgets/WIDGET-REGISTRY.js`, generated by `widgets/build-widget-product.js` from core registry and lite specs | Parsed and validated; count selectors use published destinations |
| Countries, currencies | `assets/js/data/african-countries.js` | Parsed as 54 canonical jurisdictions; `ALL` remains a regional sentinel |
| Locales | `data/registry/locales.json` introduced by this change; existing `build-i18n.js` and hreflang validation become consumers | One explicit site-locale state model; AI-only locale support stays separately labeled |
| API plans | `netlify/functions/_shared/api-plans.js` | Parsed into `api:*` records without changing runtime behavior |
| Product subscription options | `assets/js/lib/pro-plan.js` | Parsed into `product:*` records without changing runtime behavior |
| Pro apps and support routes | `assets/js/lib/pro-app-registry.js` | Parsed and destination-validated |
| Supported page collections | `data/registry/catalog-policy.json` introduced by this change plus existing page presentation metadata | Stable collection IDs; membership validated against tool IDs |
| Generated tool directory/search/AI manifests | `scripts/build-tool-directory.js`, `data/tool-directory.json`, search builders, `assets/js/ai/tool-manifest.js` | Downstream projections; not independent count owners |
| Public UI totals | `scripts/update-counts.js` and page-local JavaScript/HTML | Replaced by canonical selector synchronization and check mode |
| Live database queries | No live query supplies the catalog totals in scope | Explicitly reported as none; no Supabase action |

---

## Out of Scope

- OS-1: Rewriting the 3,263-row browser registry by hand into a new format — normalization provides the migration boundary without risking every public route.
- OS-2: Changing calculator formulas, tax rates, data-source ledgers, or source freshness research — this work records available versions/freshness but does not invent them.
- OS-3: Changing prices, API quotas, Pro entitlement enforcement, or payment providers — plan data is normalized and validated only.
- OS-4: Adding a database-backed CMS or moving catalog ownership to Supabase — the static build remains authoritative.
- OS-5: Regenerating all translated pages or changing translation copy — locale states and coverage are validated without a translation campaign.
- OS-6: Deploying, committing, pushing, or modifying production state — implementation and proof remain local unless separately requested.

---

## Open Questions

None. The repository owner’s goal and acceptance criteria approve the semantic model and local implementation scope above.
