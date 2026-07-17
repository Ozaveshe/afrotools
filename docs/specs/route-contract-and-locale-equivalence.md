# Spec: Public Route Contract and Locale Equivalence

**Author:** Codex with product direction from the repository owner
**Date:** 2026-07-11
**Status:** Approved
**Reviewers:** Repository owner
**Related specs:** [Canonical registry and derived counts](canonical-registry-and-derived-counts.md), [Architecture](../ARCHITECTURE.md), [Release checklist](../release-checklist.md)

---

## Context

AfroTools currently derives routing state from HTML file shape, `_redirects`, `netlify.toml`, page-local canonical and hreflang tags, locale generators, sitemap inference, and hand-maintained language-switcher maps. The existing focused validators pass, but they do not model those sources as one graph. The current checkout therefore passes `seo:report`, `check-links`, and `validate:hreflang` while still containing 15 exact permanent redirect chains, 53 hreflang references to redirect sources, three sitemap URLs that redirect, and indexable files whose intended redirects may be shadowed because the rule is not forced.

Several high-value surfaces overlap. `/tools/` and `/all-tools/` are both indexable self-canonical files even though the redirect file intends `/all-tools/` to move to `/tools/`. `/terms-of-use.html` currently routes through `/terms-of-use` before `/terms/`. Locale-prefixed aliases can lead to English pages while still appearing in hreflang or the language switcher as native equivalents. Sitemap hreflang generation only recognizes prefix-identical French and Swahili paths, so translated slugs and partial Hausa or Yoruba coverage have no authoritative shared model.

This change establishes one generated route graph over all static pages, redirect and rewrite rules, locale relationships, and sitemap policy. It preserves valuable legacy URLs with deliberate direct redirects, distinguishes genuine localized equivalents from labelled English fallbacks, and makes build-time graph validation the release gate. It does not delete public content merely because two routes overlap.

---

## Functional Requirements

- FR-1: The build MUST generate one deterministic route graph containing every public HTML route, exact redirect or rewrite source, supported dynamic route pattern, canonical destination, locale, page type, indexability, sitemap membership, equivalent-language relationship, fallback behavior, and deprecation state.
- FR-2: Each route record MUST have a stable ID and MUST identify its source owner: HTML file, `_redirects`, `netlify.toml`, canonical registry, locale generator, or explicit route policy.
- FR-3: The graph MUST distinguish `page`, `redirect`, `rewrite`, `conditional-redirect`, `gone`, and `pattern` route states; a route MUST NOT be both indexable and a redirect source.
- FR-4: `/tools/` MUST be the canonical English all-tools directory. `/all-tools/` and its historical variants MUST redirect permanently and directly to `/tools/`. Genuine localized all-tools directories MAY remain native equivalents of `/tools/`.
- FR-5: `/terms/` MUST be the canonical English terms route. `/terms-of-use`, `/terms-of-use.html`, and non-native localized terms aliases MUST redirect permanently and directly to `/terms/`.
- FR-6: `/fr/tools/` MUST redirect to the genuine French directory `/fr/all-tools/`, not to English `/tools/`.
- FR-7: A permanent redirect MUST resolve to its final replacement in one hop. Redirect loops, normalized self-redirects, and permanent chains MUST fail validation.
- FR-8: Existing high-value legacy routes MUST be retained as redirect records unless the policy explicitly marks them `gone`; source files MAY remain for rollback but MUST NOT shadow an intended replacement.
- FR-9: Every indexable page MUST emit exactly one self-referencing canonical URL with no query string or fragment.
- FR-10: Directory-backed canonical routes MUST use their served trailing-slash form. Flat HTML routes MUST use their extensionless served form. Netlify Pretty URLs MUST own slash normalization; the route contract MUST NOT generate forced slash-only redirects that normalize to the same route.
- FR-11: Canonical routes MUST be lowercase. Known mixed-case legacy paths MAY be explicit aliases; undeclared case variants MUST NOT become additional indexable destinations.
- FR-12: Query parameters and fragments MUST be excluded from canonical and sitemap identities. Functional query links MAY remain on canonical routes, while alias links with query strings or fragments MUST be rewritten to the final canonical route without discarding the suffix.
- FR-13: Hreflang relationships MUST contain only indexable, self-canonical pages whose declared locale matches the relationship and whose reciprocal relationship points back to the source.
- FR-14: Every hreflang group MUST include each genuine equivalent once and MUST include `x-default` pointing to the English equivalent when one exists, otherwise to the group’s explicit default route.
- FR-15: A localized-looking redirect to English MUST be classified as `english-fallback`, MUST NOT be emitted as a native hreflang equivalent, and MUST NOT appear in a locale sitemap.
- FR-16: The language switcher MUST preserve the equivalent route when a genuine target-locale page exists. Otherwise it MUST link to the documented fallback and visibly label the option as an English fallback or locale home rather than a native translation.
- FR-17: Locale-aware sitemap generation MUST consume the route graph and MUST exclude redirects, rewrites, conditional routes, gone routes, noindex pages, non-native English fallbacks, query/filter duplicates, and non-canonical aliases.
- FR-18: No sitemap `<loc>` or sitemap hreflang target MAY resolve through a redirect or to a non-indexable route.
- FR-19: Internal-link normalization MUST consume the route graph and rewrite links to permanent aliases onto their final canonical destination while preserving query strings and fragments.
- FR-20: The route validator MUST fail with record-level errors for redirect loops, redirect chains, normalized self-redirects, canonical loops, missing or multiple canonicals, non-self canonicals on indexable pages, duplicate indexable canonical claims, missing reciprocal hreflang, hreflang redirects, locale mismatches, sitemap redirects, sitemap noindex entries, and internal links to permanent aliases.
- FR-21: The normal build MUST generate and validate the route contract before sitemap generation and MUST re-check generated sitemap, canonical, hreflang, redirect, and internal-link artifacts after generation.
- FR-22: The build MUST emit deterministic JSON and Markdown reports describing route states, redirect migrations, page-type and locale coverage, sitemap membership, equivalence groups, fallback routes, and discrepancies.
- FR-23: Conditional language redirects in `netlify.toml` MUST be represented separately from canonical route identity and MUST NOT make the destination the canonical state of the source route.

---

## Non-Functional Requirements

### Performance

- NFR-P1: Route discovery, graph construction, validation, report generation, and focused synchronization SHOULD complete in under 30 seconds for the current repository.
- NFR-P2: The language switcher MUST NOT require a remote network request; any generated client projection MUST be a local static asset.

### Reliability

- NFR-R1: Graph validation MUST run before route-owned generated files are mutated when invoked in check mode.
- NFR-R2: Identical repository inputs MUST produce byte-identical JSON, Markdown, redirect, sitemap, and client route-map outputs.
- NFR-R3: A parser failure in any authoritative routing source MUST abort generation instead of silently omitting routes.

### Security and Privacy

- NFR-S1: Route generation MUST be repository-local and MUST NOT read or write live Supabase data.
- NFR-S2: Redirect destinations MUST be static repository policy or verified internal routes; this work MUST NOT introduce user-controlled redirect targets.
- NFR-S3: Generated public route assets MUST NOT expose internal, administrative, test, report, migration, prompt, or secret-bearing paths.

### Accessibility and Localization

- NFR-A1: Fallback labels in desktop and mobile language pickers MUST be visible text and accessible names, not color-only distinctions.
- NFR-L1: Locale identity MUST be derived from explicit locale policy and page metadata, not solely from path prefix, because native French and Swahili articles may live under non-prefixed content collections.
- NFR-L2: English fallback behavior MUST remain usable when JavaScript fails; existing canonical English links and page content MUST not depend on the client route projection.

### Maintainability

- NFR-M1: Route normalization, redirect parsing, graph construction, and validation MUST live in a shared CommonJS module used by tests and build scripts.
- NFR-M2: Explicit product decisions and exceptional route relationships MUST live in a reviewable JSON policy rather than duplicated script constants.
- NFR-M3: Every validation error MUST name its code, route ID, field, source owner, and actionable target when known.

---

## Acceptance Criteria

### AC-1: Every public route has one state (FR-1, FR-2, FR-3)

Given the repository’s HTML files and Netlify routing sources
When the route graph is generated
Then every discovered public route or route pattern has exactly one documented state
And every record identifies its owner and final canonical destination.

### AC-2: High-value overlaps are deliberate (FR-4, FR-5, FR-6, FR-8)

Given requests for `/all-tools/`, `/terms-of-use`, `/terms-of-use.html`, and `/fr/tools/`
When redirect policy is evaluated
Then they resolve in one permanent hop to `/tools/`, `/terms/`, `/terms/`, and `/fr/all-tools/` respectively
And their legacy records remain documented for equity and rollback.

### AC-3: Redirect graph is acyclic and direct (FR-7, FR-10, FR-20)

Given all permanent exact and pattern redirects
When graph validation runs
Then there are zero loops, zero normalized self-redirects, and zero permanent redirect chains.

### AC-4: Canonicals are singular and self-referencing (FR-9, FR-10, FR-11, FR-12, FR-20)

Given an indexable page
When its HTML and graph record are validated
Then it has exactly one lowercase self-referencing canonical with the contract’s served route shape
And the canonical contains no query string or fragment.

### AC-5: Genuine equivalents are reciprocal (FR-13, FR-14, FR-20)

Given a route graph equivalence group
When hreflang validation runs
Then every member is indexable, self-canonical, locale-correct, and reciprocal
And the group contains one `x-default` destination selected by policy.

### AC-6: English fallbacks are not translations (FR-15, FR-16, NFR-A1)

Given a page with no genuine equivalent in a requested locale
When the language switcher renders that locale option
Then it uses the documented English or locale-home fallback with a visible fallback label
And no hreflang or locale sitemap advertises that fallback as a native translation.

### AC-7: Sitemaps contain only canonical indexable routes (FR-17, FR-18, FR-20)

Given all generated sitemap `<loc>` and `xhtml:link` URLs
When graph validation runs
Then none are redirects, rewrites, conditional routes, noindex pages, query variants, fallbacks, or aliases
And every locale URL belongs to its declared locale sitemap.

### AC-8: Internal links bypass aliases (FR-19, FR-20)

Given an internal link to a permanent alias with a query string or fragment
When link normalization runs
Then the path is replaced with the final canonical destination in one step
And the original query string and fragment are preserved.

### AC-9: Graph errors fail the build usefully (FR-20, FR-21, NFR-M3)

Given fixtures containing a loop, chain, canonical duplicate, bad hreflang, sitemap redirect, or alias link
When the focused validator or normal build runs
Then it exits non-zero before release completion
And each error names the offending route and source field.

### AC-10: Generated reporting explains the migration (FR-22, NFR-R2)

Given a valid checkout
When route generation completes
Then JSON and Markdown reports summarize pages, redirects, rewrites, locale groups, fallbacks, sitemap membership, deprecated aliases, and page types
And identical input produces no content diff.

### AC-11: Conditional redirects do not corrupt canonical identity (FR-23)

Given the browser-language redirects for `/`
When the graph is built
Then `/` remains the canonical English homepage
And the language conditions are represented as conditional edges rather than unconditional replacements.

### AC-12: Existing route behavior remains available (FR-8, FR-21)

Given the migrated route contract
When link, locale, SEO, build, dist, and representative browser checks run
Then canonical destinations render successfully
And every replaced high-value URL retains a deliberate permanent redirect.

---

## Edge Cases and Error Scenarios

- EC-1: `_redirects` and `netlify.toml` declare the same source differently -> apply Netlify’s documented precedence, report the shadowed rule, and fail if effective permanent destinations conflict.
- EC-2: A route has a static file and a non-forced replacement redirect -> fail as `REDIRECT_SHADOWED_BY_FILE`; do not assume the replacement is effective.
- EC-3: Source and target differ only by trailing slash -> treat them as one normalized identity and reject a forced permanent rule; rely on Pretty URLs.
- EC-4: A redirect target is itself a redirect -> resolve the intended final target for reporting but fail until the source rule is changed to that final target.
- EC-5: A redirect pattern contains splats or placeholders -> validate static prefix safety and pattern-to-pattern chains conservatively; do not expand an infinite route set.
- EC-6: A `netlify.toml` redirect has `Language`, `Country`, `Role`, or cookie conditions -> retain it as a conditional edge and exclude it from canonical replacement traversal.
- EC-7: A route has multiple canonical tags or a canonical outside `https://afrotools.com` -> fail with the file and all discovered values.
- EC-8: A native-language article lives outside `/fr/`, `/sw/`, `/yo/`, or `/ha/` -> trust valid page locale metadata and explicit equivalence policy rather than path-prefix inference.
- EC-9: Hreflang points to a redirect, non-indexable page, mismatched locale, query URL, or missing route -> exclude it from the generated group and fail until source metadata is corrected.
- EC-10: A localized route exists but is an English wrapper or explicit fallback -> classify it as fallback/redirect, not native; omit it from hreflang and locale sitemaps.
- EC-11: An English page has no translated equivalent -> keep its self canonical and English sitemap membership; the switcher uses a labelled fallback without inventing a prefixed URL.
- EC-12: An alias link contains `?` or `#` -> rewrite only the path component and retain the suffix byte-for-byte.
- EC-13: A sitemap contains an external URL or an internal URL not represented in the graph -> fail with sitemap filename and `<loc>`.
- EC-14: The working tree contains unrelated changes -> generators touch only declared route-contract artifacts, explicit metadata surfaces, and route-owned generated outputs.

---

## API Contracts

No new HTTP endpoint or database contract is introduced. In particular, `GET /route-contract` MUST NOT be introduced; the graph remains a build artifact and local static client projection. The build-time CommonJS contract is:

```typescript
interface RouteContractApi {
  loadRouteSources(): RouteSources;
  buildRouteGraph(sources?: RouteSources): RouteGraph;
  validateRouteGraph(graph: RouteGraph, artifacts?: GeneratedArtifacts): RouteValidationResult;
  resolveFinalRoute(graph: RouteGraph, route: string): RouteResolution;
  getLocaleDestination(graph: RouteGraph, route: string, locale: LocaleId): LocaleDestination;
  syncRouteMetadata(graph: RouteGraph, options: { write: boolean }): SyncResult;
  syncInternalLinks(graph: RouteGraph, options: { write: boolean }): SyncResult;
  generateRouteArtifacts(graph: RouteGraph, options: { write: boolean }): GenerationResult;
}

interface RouteValidationIssue {
  code: string;
  routeId: string;
  field: string;
  owner: string;
  message: string;
}
```

CLI errors use one record per line:

```text
[CODE] route:route-id field=field owner=source-file - actionable message
```

---

## Data Models

### Route Record

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Stable unique ID derived from route state and normalized route |
| route | string | Exact public path or documented route pattern |
| normalizedRoute | string | Lowercase collision key without query, fragment, `.html`, or slash-only variation |
| state | enum | `page`, `redirect`, `rewrite`, `conditional-redirect`, `gone`, `pattern` |
| canonicalRoute | string or null | Final canonical public destination |
| redirectTarget | string or null | Required for permanent/temporary redirect records |
| statusCode | integer or null | `200`, `301`, `302`, `307`, `308`, `404`, or `410` where applicable |
| force | boolean | Whether rule overrides a matching static file |
| conditions | object | Language/country/role/cookie/query conditions; empty for unconditional routes |
| locale | enum | `en`, `fr`, `sw`, `yo`, `ha`, or `neutral` |
| pageType | string | Stable page-type classifier such as `tool`, `category`, `country`, `article`, `legal`, `auth`, `widget`, `api`, or `utility` |
| indexability | enum | `indexable`, `noindex`, `redirect`, `rewrite`, `conditional`, `gone` |
| sitemap | object | `{included, sitemapId, reasons[]}` |
| equivalenceGroup | string or null | Stable group ID for genuine language equivalents only |
| equivalents | object | Locale-to-route map generated from the group |
| fallback | object | `{type, route, label, advertisedAsEquivalent}` |
| deprecated | boolean | True for legacy aliases and gone routes |
| source | object | File/config owner and line or record identity |

### Route Policy

| Field | Type | Constraints |
|-------|------|-------------|
| schemaVersion | string | Required |
| canonicalDecisions | object[] | Explicit high-value source, destination, rationale, and preservation policy |
| equivalenceGroups | object[] | Genuine locale route mappings and `x-default` policy |
| fallbackRules | object[] | Locale fallback destination and visible label policy |
| pageTypeRules | object[] | Ordered route/file patterns |
| sitemapRules | object[] | Locale/page-type membership policy |
| queryPolicy | object | Canonical query exclusions and functional-query allowances |
| routeNormalization | object | Lowercase, `.html`, trailing slash, repeated slash, query, and fragment rules |

### Locale Destination

| Field | Type | Constraints |
|-------|------|-------------|
| requestedLocale | LocaleId | Published locale from catalog policy |
| route | string | Genuine equivalent or documented fallback |
| relationship | enum | `equivalent`, `english-fallback`, `locale-home` |
| label | string | Visible fallback text when relationship is not `equivalent` |
| advertisedAsEquivalent | boolean | True only for genuine equivalents |

---

## Out of Scope

- OS-1: Deleting legacy HTML files solely because redirects replace them — files may remain as rollback artifacts while effective public routing is canonical.
- OS-2: Translating English pages or rewriting localized editorial content — this work classifies native pages and fallbacks but does not create translations.
- OS-3: Changing calculator engines, API behavior, authentication, payment logic, or user data handling — only static route ownership and navigation metadata are in scope.
- OS-4: Replacing Netlify or disabling Pretty URLs — the contract models the deployed platform’s documented routing behavior.
- OS-5: Redirecting arbitrary unknown mixed-case requests — declared routes are lowercase and known legacy case variants may be retained explicitly; unknown variants remain non-canonical or 404.
- OS-6: Removing functional query parameters from calculators, filters, shared views, auth, or tracking links — their base route is canonical and they remain excluded from sitemaps.
- OS-7: Committing, pushing, deploying, or modifying production state — implementation and proof remain local unless separately authorized.

---

## Open Questions

None. The repository owner explicitly authorized the route migration, redirect preservation, locale fallback distinction, and build-failing graph tests described above.
