# Spec: Localization Platform and Page Coverage Contract

**Author:** Codex with product direction from the repository owner
**Date:** 2026-07-11
**Status:** Approved
**Reviewers:** Repository owner
**Related specs:** [Public route contract](route-contract-and-locale-equivalence.md), [Canonical registry and derived counts](canonical-registry-and-derived-counts.md), [French localization strategy](../FRENCH-LOCALIZATION-STRATEGY.md), [Swahili localization strategy](../SWAHILI-LOCALIZATION-STRATEGY.md), [Yoruba localization strategy](../YORUBA-LOCALIZATION-STRATEGY.md), [Hausa localization strategy](../HAUSA-LOCALIZATION-STRATEGY.md)

---

## Context

AfroTools currently has five public route locales: English, French, Swahili, Yoruba, and Hausa. English is the default; French and Swahili are launched; Yoruba and Hausa have partial coverage. Igbo is discoverable as tool content, while Portuguese and Arabic are discoverable only inside the AI component catalog. None has a complete public route, global catalog, and page-coverage contract, so all three are planned rather than launched site locales.

Localization is split across `lang/*.json`, French page packs under `lang/pages/**`, hand-authored localized HTML, the broad `scripts/build-i18n.js` generator, route maps, page-local replacements, inline component dictionaries, AI-only translations, and hard-coded language names and formatting behavior. The existing translation validator checks only exact key parity for 116 shared strings. It does not validate interpolation, unsafe HTML, duplicate keys, fallback use, page coverage, Unicode normalization, route-language consistency, or whether country codes are mistaken for locales.

The current route contract reports 5,845 English pages, 3,423 French pages, 855 Swahili pages, 45 Yoruba pages, and 92 Hausa pages. All 4,332 indexable non-English pages are currently eligible for equivalence groups even though strategy documents and visible page copy identify explicit English fallbacks and localized shells. Current localized HTML also contains mojibake and decomposed Unicode that existing checks accept. Shared formatting hard-codes English behavior, while navigation, validation, account, consent, export, sharing, AI, and accessibility strings are duplicated across components.

This change establishes one canonical locale manifest, one generated page-coverage registry, one shared UI catalog contract, and one build-time validator. It distinguishes native content, localized shells around language-neutral engines, explicit English fallbacks, unavailable content, and deprecated pages. Hreflang and language-switcher behavior consume the same coverage truth. It preserves the static-first, local-first product and does not introduce a network translation service or framework migration.

---

## Functional Requirements

- FR-1: The repository MUST contain one canonical locale manifest whose entries define locale code, English display name, native name, text direction, route prefix, formatting locale, number/date/currency defaults, supported country references or market focus, launch status, content owner, fallback locale, and minimum coverage required for indexability.
- FR-2: The manifest MUST model `en`, `fr`, `sw`, `yo`, and `ha` from repository configuration. It MUST model `ig`, plus component-only `pt` and `ar`, as `planned` while no complete public route and coverage contract exists. Planned locales MUST NOT appear in public language selectors, hreflang, or locale sitemaps.
- FR-3: Locale codes MUST be BCP 47 language identifiers, not country codes. Country applicability MUST use canonical ISO country references from `data/registry/countries.json` and MUST remain separate from locale identity.
- FR-4: Launch status MUST distinguish `default`, `launched`, `partial`, `planned`, and `retired`. Only `default`, `launched`, and `partial` locales with a public route contract MAY appear in the selector.
- FR-5: Page-level coverage MUST use exactly these states: `native`, `localized-shell`, `english-fallback`, `unavailable`, and `deprecated`.
- FR-6: `native` means user-visible page content and required shared UI states are authored in the declared locale. A language-neutral calculation engine MAY be reused, but a page whose primary instructions or results remain English MUST NOT be classified as native.
- FR-7: `localized-shell` means navigation, form labels, validation, status, result labels, disclosures, and export actions are localized while the underlying deterministic engine, numeric rules, or language-neutral data are shared. It MAY be indexable only when its locale manifest permits that state and all required UI keys resolve natively.
- FR-8: `english-fallback` means the destination intentionally uses English because no genuine localized equivalent exists. It MUST be visibly labelled, MUST NOT be indexable as a native localized page, MUST NOT emit target-locale hreflang, and MUST NOT appear in a locale sitemap.
- FR-9: `unavailable` means no usable destination is offered in that locale. It MUST NOT be generated as an empty or English-shaped route.
- FR-10: `deprecated` means a former localized destination has a deliberate replacement or retired state. Its record MUST include a redirect target or retirement rationale and MUST NOT be indexable.
- FR-11: Every public page route in the route graph MUST receive one machine-readable coverage record with route, locale, coverage state, source owner, evidence, required UI domains, native key coverage, fallback key count, indexability eligibility, and equivalent-route relationship.
- FR-12: Coverage MAY be derived from reviewable rules for homogeneous generated families, but route-level overrides MUST win. Generated output MUST materialize one explicit record per route so discrepancies are auditable.
- FR-13: Coverage classification MUST use authoritative evidence: page pack ownership, hand-authored source ownership, page type, shared-engine declaration, explicit fallback policy, deprecation policy, and route metadata. Path prefix or `<html lang>` alone MUST NOT prove native translation.
- FR-14: Known Hausa and Yoruba English-fallback routes documented in their strategy files MUST be represented explicitly. A localized page that merely links to an English fallback elsewhere MUST NOT be misclassified as an English fallback itself.
- FR-15: Shared UI catalogs MUST centralize required strings for navigation; forms and validation; loading, empty, success, and error states; retry actions; account and consent flows; export and sharing; pricing and plan labels; AI disclosures; accessibility labels; footer; and legal navigation.
- FR-16: Every launched or partial locale MUST contain every required shared UI key. Planned locale catalogs MAY be absent, but their absence MUST be reported and MUST prevent launch.
- FR-17: Indexable `native` and `localized-shell` pages MUST NOT resolve required UI keys through another locale. A missing key on such a page MUST fail the build with the route, locale, key, and source owner.
- FR-18: Catalog validation MUST detect missing required keys, duplicate keys, orphaned keys, mismatched or malformed interpolation variables, unsafe HTML, invalid value types, decomposed user-facing strings, replacement characters, and common UTF-8 mojibake signatures.
- FR-19: Translation values MUST be plain text by default. Any key allowed to contain markup MUST be declared in a narrow allowlist and sanitized before DOM insertion; event handlers, scripts, styles, JavaScript URLs, and unapproved elements or attributes MUST fail validation.
- FR-20: Runtime translation lookup MUST expose whether a value was native, an explicit fallback, or missing. It MUST NOT silently return English on an indexable native page.
- FR-21: Shared formatting MUST use the selected locale through `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.PluralRules`, and `Intl.ListFormat`, with manifest-owned defaults for numbers, currencies, percentages, dates, units, plural categories, and lists.
- FR-22: Currency formatting MUST accept an explicit ISO currency or a manifest/country-derived default. It MUST NOT infer locale from a country code or silently force English grouping and decimal separators.
- FR-23: Shared `AfroTools.fmt` APIs MUST remain backward compatible while gaining an optional locale/options contract. Existing calculation values MUST NOT change; only presentation MAY change.
- FR-24: User-facing strings from catalogs, input display, clipboard operations, CSV cells, PDF text, image text, and search-index text MUST be valid UTF-8 and normalized to NFC at the user-facing boundary.
- FR-25: Normalization MUST operate on display strings and catalog values. It MUST NOT blindly normalize route IDs, slugs, hashes, signatures, tokens, cache keys, or signed payloads.
- FR-26: JSON generation and parsing MUST use UTF-8 explicitly. CSV exports MUST preserve Unicode and spreadsheet interoperability, including a UTF-8 BOM where the existing download contract permits it. Clipboard, PDF, and image exporters MUST receive NFC strings.
- FR-27: Search-index generation MUST preserve localized Unicode and MUST fail on replacement characters or known mojibake in indexed display fields.
- FR-28: The language selector MUST derive its locale list, display names, native names, direction, launch status, and partial-coverage label from the generated manifest projection rather than a hard-coded array.
- FR-29: The selector MUST preserve the current genuine equivalent route when one exists. For an `english-fallback`, it MUST show a visible fallback label and warn before navigation. For `unavailable`, it MUST disable or omit the destination without inventing a route. For `deprecated`, it MUST use the replacement contract.
- FR-30: The fallback warning MUST be keyboard operable, screen-reader labelled, focus contained while open, dismissible with Escape and an explicit cancel control, and translated in the current UI locale.
- FR-31: The selector MUST communicate partial locale coverage in visible text and accessible names. Planned or retired locales MUST NOT appear as launched choices.
- FR-32: Hreflang equivalence groups MUST consume page coverage. Only indexable `native` and eligible `localized-shell` records MAY be genuine equivalents. `english-fallback`, `unavailable`, and `deprecated` records MUST be excluded.
- FR-33: Hreflang MUST be reciprocal among genuine equivalents and use the route contract's `x-default` policy. A localized-looking English fallback MUST never be emitted as a translated equivalent.
- FR-34: Locale sitemap membership MUST consume the same coverage and route contracts. A page that fails locale coverage MUST be excluded before sitemap generation.
- FR-35: The normal build MUST generate and validate locale artifacts before route-equivalence and sitemap generation, then revalidate the final route graph and generated HTML.
- FR-36: The build MUST emit deterministic JSON and Markdown reports showing, by locale and page type, raw localized files, native pages, localized shells, English fallbacks, unavailable/deprecated records, indexable records, sitemap records, catalog coverage, fallback-key use, Unicode issues, and discrepancies.
- FR-37: Validation errors MUST be record-level and actionable, including code, locale, route or catalog key, owner file, field, and remediation hint.
- FR-38: Existing French page packs and hand-authored routes, Swahili hand-authored/generator outputs, and Yoruba/Hausa route-first source ownership MUST remain identifiable. The platform MUST NOT rewrite those sources into a single generic generated template.
- FR-39: AI response-language support that has no public route locale MUST remain a separate capability from public UI locale launch. Portuguese or Arabic AI response support MUST NOT make `pt` or `ar` appear as launched site locales.
- FR-40: Generated locale projections used in the browser MUST be local static assets and MUST contain no personal data, secrets, private route inventory, or network dependency.

---

## Non-Functional Requirements

### Performance

- NFR-P1: Manifest/catalog validation and page-coverage generation SHOULD complete in under 30 seconds for the current repository.
- NFR-P2: Runtime catalog lookup and formatting MUST be synchronous after local script load and MUST not fetch translations over the network.
- NFR-P3: The generated browser manifest and shared UI catalog projection SHOULD remain small enough for low-bandwidth use; page-specific content MUST not be bundled into every page.

### Reliability

- NFR-R1: Check mode MUST validate authoritative source files without mutating them.
- NFR-R2: Identical locale inputs and route sources MUST produce byte-identical JSON, Markdown, and browser projections.
- NFR-R3: Invalid UTF-8, JSON parse failure, duplicate catalog key, unknown locale, unknown country, or unknown coverage state MUST abort generation rather than be skipped.
- NFR-R4: The runtime MUST use the default English catalog only when the page coverage contract explicitly permits fallback; missing runtime globals MUST leave the initial HTML usable.

### Security and Privacy

- NFR-S1: Localization MUST remain repository-local and MUST not send page content, user input, documents, or catalog text to a translation API.
- NFR-S2: Translation rendering MUST use text insertion by default. HTML catalogs MUST not create an XSS path.
- NFR-S3: Normalization and export helpers MUST not log raw user-entered sensitive content.
- NFR-S4: Locale selection MAY be stored locally but MUST not require authentication, analytics consent, or server synchronization.

### Accessibility

- NFR-A1: Locale direction MUST set `lang` and `dir` correctly on the document and selector controls.
- NFR-A2: The language selector, fallback warning, and partial-coverage labels MUST meet keyboard, focus, name/role/value, and screen-reader requirements.
- NFR-A3: Loading, validation, consent, export, clipboard, and error messages localized by the platform MUST preserve existing live-region semantics.

### Maintainability

- NFR-M1: Manifest loading, catalog validation, coverage classification, formatting metadata, and report generation MUST live in one shared CommonJS library usable by build scripts and tests.
- NFR-M2: Browser localization MUST expose one stable `window.AfroTools.i18n` API and one backward-compatible `window.AfroTools.fmt` facade.
- NFR-M3: Exceptional route coverage decisions MUST live in reviewable JSON policy, not comments or duplicated component arrays.
- NFR-M4: Locale and coverage schemas MUST be versioned, and generated artifacts MUST identify their source schema version.

---

## Acceptance Criteria

### AC-1: Canonical locale manifest is complete (FR-1 through FR-4)

Given the canonical country registry and repository locale configuration
When locale validation runs
Then English, French, Swahili, Yoruba, and Hausa have complete manifest entries and valid country references
And Igbo is present only as planned until its route, catalog, and coverage contract is complete
And no country code is accepted as a locale code.

### AC-2: Every route has one coverage state (FR-5 through FR-14)

Given every public page in the route graph
When page coverage is generated
Then each page has exactly one of `native`, `localized-shell`, `english-fallback`, `unavailable`, or `deprecated`
And each record names its source owner and classification evidence
And known explicit fallbacks are not counted as native equivalents.

### AC-3: Missing translations cannot create mixed-language indexable pages (FR-15 through FR-20)

Given an indexable native or localized-shell fixture that references a missing locale key
When localization validation runs
Then the build exits non-zero with the route, locale, missing key, and owner
And the fixture is not emitted as an indexable mixed-language page.

### AC-4: Required shared states follow the selected locale (FR-15, FR-16, FR-20)

Given representative English, French, Swahili, Yoruba, and Hausa pages
When navigation, validation, loading, empty, error, retry, account, consent, export, sharing, pricing, AI disclosure, accessibility, footer, and legal labels render
Then their required keys resolve from the selected locale catalog
And no launched locale silently substitutes English on an indexable native page.

### AC-5: Catalog validation rejects unsafe or inconsistent data (FR-18, FR-19, FR-37)

Given fixtures with a duplicate key, orphan key, malformed interpolation, mismatched variable, unsafe HTML, replacement character, decomposed text, and mojibake
When the catalog validator runs
Then each fixture fails with a distinct actionable error code and record owner.

### AC-6: Formatting is locale-aware without changing calculations (FR-21 through FR-23)

Given the same numeric value, date, percentage, unit, plural count, and list in each launched locale
When shared formatters render them
Then output follows each locale manifest's `Intl` configuration and explicit currency
And the underlying numeric and date values remain unchanged.

### AC-7: Unicode round-trips through user-facing boundaries (FR-24 through FR-27)

Given French accents, Swahili text, Yoruba combining-mark fixtures, Hausa text, currency symbols, and emoji
When values are parsed from JSON, normalized for display, inserted into the DOM, copied, indexed, and exported to CSV and the shared PDF/image text boundary
Then the values round-trip as valid NFC Unicode with no replacement characters or mojibake
And route IDs and signed values remain byte-identical.

### AC-8: Language selector is honest and accessible (FR-28 through FR-31)

Given a route with a genuine French equivalent, partial Yoruba coverage, an English-only Hausa fallback, and no launched Igbo destination
When the selector opens with keyboard or pointer input
Then it lists only launched locales from the manifest, marks partial coverage visibly, preserves the French equivalent, warns before the Hausa fallback, and does not advertise Igbo as launched
And focus, Escape, accessible names, and confirm/cancel behavior work.

### AC-9: Hreflang and sitemaps use coverage truth (FR-32 through FR-35)

Given native, localized-shell, English-fallback, unavailable, and deprecated route fixtures
When route equivalence and sitemap artifacts are built
Then only eligible native and localized-shell pages appear as reciprocal equivalents and locale sitemap entries
And no fallback, unavailable, deprecated, redirect, or non-indexable page appears.

### AC-10: Reports explain actual coverage (FR-11, FR-36)

Given the current repository
When localization artifacts are generated
Then JSON and Markdown reports show distinct raw, native, shell, fallback, unavailable, deprecated, indexable, localized-key, and sitemap counts by locale and page type
And discrepancies identify their route or catalog owner.

### AC-11: Existing localization ownership survives migration (FR-38)

Given French page packs, hand-authored French routes, Swahili generated and manual routes, and route-first Yoruba/Hausa pages
When the platform is introduced
Then their ownership remains traceable in coverage records
And no broad generic regeneration overwrites hand-authored localized content.

### AC-12: Build failures are useful and deterministic (FR-35 through FR-37, NFR-R2)

Given an invalid locale manifest or page coverage record
When check mode and the normal build run
Then they exit non-zero before sitemap release with code, locale, route/key, owner, and remediation
And two valid runs produce identical artifacts.

---

## Edge Cases and Error Scenarios

- EC-1: A locale ID is also present in the country registry -> reject unless it is independently declared as a valid language code and never infer it from the country record.
- EC-2: An HTML path begins with `/fr/` but `<html lang="en">` -> fail `LOCALE_ROUTE_MISMATCH`; do not silently rewrite content.
- EC-3: A localized page contains one related English fallback link -> preserve the page's own native/shell classification; fallback links do not classify the whole page.
- EC-4: A page claims native coverage but a required shared component key falls back to English -> fail and exclude it from equivalence/sitemap output.
- EC-5: A language-neutral calculator engine returns labels -> those labels are UI, not engine data, and must be localized before the page can be a localized shell.
- EC-6: A translation contains `{amount}` while English contains `{value}` -> fail variable parity even if both strings parse.
- EC-7: A translation contains literal braces for prose -> require escaped braces or an explicitly non-interpolated key declaration.
- EC-8: A catalog contains `<strong>` -> reject unless the key and element are on the narrow rich-text allowlist; render all other strings as text.
- EC-9: A string is canonically equivalent but decomposed -> report and normalize the user-facing value to NFC; do not rewrite route/hash fields.
- EC-10: A source contains a common double-decoded sequence such as `FranÃ§ais` -> fail with the owner file even if the browser might display something plausible.
- EC-11: A CSV is opened by spreadsheet software -> emit valid UTF-8 with BOM and quoted NFC fields without changing numeric calculation values.
- EC-12: PDF font support cannot render a localized glyph -> preserve source text, report the font/export limitation, and do not transliterate silently.
- EC-13: A target locale is partial but the current route has no equivalent -> show translated warning copy before the documented English fallback or locale home.
- EC-14: JavaScript is disabled -> the localized page's initial HTML remains useful, correctly labelled, and covered by build-time canonical/hreflang state; the selector enhancement may be unavailable but must not expose a false equivalent.
- EC-15: The manifest asset fails to load -> keep the current page usable and show only a conservative current-locale/English fallback path; do not synthesize locale-prefixed URLs.
- EC-16: An AI response locale such as Portuguese has no public route locale -> preserve AI capability without adding it to the site selector, hreflang, or sitemap.
- EC-17: A planned Igbo catalog is added without routes or coverage -> keep launch status planned and fail any attempt to mark it launched.
- EC-18: A deprecated localized route has link equity -> preserve a single-hop redirect and remove it from hreflang/sitemap while retaining the coverage record.
- EC-19: A route has multiple candidate source owners -> require one primary owner and list secondary evidence; conflicting explicit states fail validation.
- EC-20: The working tree contains unrelated changes -> generators touch only declared localization, route-contract, catalog, shared-component, test, documentation, and report artifacts.

---

## API Contracts

No network API or database migration is introduced. The build-time CommonJS contract is:

```typescript
interface LocalizationPlatformApi {
  loadLocaleManifest(): LocaleManifest;
  loadCatalog(locale: LocaleId): TranslationCatalog;
  validateLocaleManifest(manifest: LocaleManifest): ValidationResult;
  validateCatalogs(manifest: LocaleManifest): ValidationResult;
  classifyPage(input: PageCoverageInput): PageCoverageRecord;
  buildPageCoverage(routeGraph?: RouteGraph): PageCoverageRegistry;
  validatePageCoverage(registry: PageCoverageRegistry): ValidationResult;
  generateLocalizationArtifacts(options: { write: boolean }): GenerationResult;
  normalizeDisplayString(value: string): string;
}

interface LocalizationIssue {
  code: string;
  locale?: string;
  route?: string;
  key?: string;
  field: string;
  owner: string;
  message: string;
}
```

The browser contract is:

```typescript
interface AfroToolsLocalizationRuntime {
  locale(): LocaleId;
  t(key: string, variables?: Record<string, string | number>, options?: { allowFallback?: boolean }): TranslationResult;
  apply(root?: ParentNode): ApplyResult;
  normalizeDisplay(value: string): string;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatCurrency(value: number, currency?: string, options?: Intl.NumberFormatOptions): string;
  formatDate(value: Date | string | number, options?: Intl.DateTimeFormatOptions): string;
  formatPercent(value: number, options?: Intl.NumberFormatOptions & { alreadyPercent?: boolean }): string;
  formatUnit(value: number, unit: string, options?: Intl.NumberFormatOptions): string;
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string;
  formatList(values: string[], options?: Intl.ListFormatOptions): string;
  pluralCategory(value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule;
}

interface TranslationResult {
  value: string;
  locale: LocaleId;
  sourceLocale: LocaleId | null;
  state: "native" | "explicit-fallback" | "missing";
  key: string;
}
```

CLI issues use one record per line:

```text
[CODE] locale=fr route=/fr/example/ key=forms.required owner=lang/fr.json field=value - actionable message
```

---

## Data Models

### Locale Manifest Entry

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Lowercase BCP 47 language code; stable and unique |
| displayName | string | English product name, NFC |
| nativeName | string | Native-language name, NFC |
| direction | enum | `ltr` or `rtl` |
| routePrefix | string or null | Empty for default; unique for public locales; null for planned locales |
| launchStatus | enum | `default`, `launched`, `partial`, `planned`, `retired` |
| contentOwner | string | Named team/workflow owner |
| fallbackLocale | string or null | Existing manifest locale; null for default |
| marketFocus | string | Honest product scope statement |
| countryRefs | string[] | Valid IDs from canonical country registry or `ALL` |
| formatting.localeTag | string | Valid `Intl` locale tag |
| formatting.number | object | Grouping, numbering system, default fraction policy |
| formatting.date | object | Default date style and time-zone policy |
| formatting.currency | object | Default ISO currency or explicit multi-market policy |
| formatting.percent | object | Scale and fraction policy |
| formatting.units | object | Unit system and supported unit labels |
| minimumIndexableCoverage | object | Eligible states, required UI domains, native-key ratio, max fallback keys |

### Page Coverage Record

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | Stable ID from normalized route and locale |
| route | string | Public canonical route |
| locale | string | Manifest locale |
| pageType | string | Route-contract page type |
| state | enum | `native`, `localized-shell`, `english-fallback`, `unavailable`, `deprecated` |
| sourceOwner | string | Page pack, manual file, generator family, or policy owner |
| evidence | string[] | Deterministic classification evidence |
| engineLocaleNeutral | boolean | True only when shared engine contains no visible language strings |
| requiredUiDomains | string[] | Catalog domains required by page/component use |
| nativeKeyRatio | number | 0 through 1 |
| fallbackKeys | string[] | Explicitly resolved fallback keys |
| indexableEligible | boolean | Derived from manifest threshold and route state |
| equivalentRoute | string or null | Genuine English/base equivalent, not fallback destination |
| fallbackRoute | string or null | Documented fallback destination |
| redirectTarget | string or null | Required when deprecated replacement exists |
| ownerFile | string | Reviewable source path |

### Coverage Policy

The source policy contains ordered route-family rules and exact overrides. Exact overrides win. A family rule declares locale, path pattern, page types, state, source owner, engine neutrality, and evidence. Conflicting exact or equal-priority rules fail. Generated coverage registry records every page explicitly and is not hand-edited.

### Shared Catalog Domains

Required top-level domains are `_meta`, `navigation`, `forms`, `validation`, `states`, `account`, `consent`, `export`, `sharing`, `pricing`, `ai`, `accessibility`, `footer`, `legal`, `common`, `categories`, and `seo`. Compatibility aliases for current `nav`, `cookie`, `cta`, `blog`, and `tools` keys MAY remain during migration but MUST be documented and validated.

---

## Dependencies and Integration Points

- `data/registry/locale-manifest.json` is the source of current public and planned locale launch facts; `data/registry/catalog-policy.json` only points to that manifest for compatibility.
- `data/registry/countries.json` supplies country references and currency defaults; its user-facing Unicode must pass the same source validation.
- `scripts/lib/route-contract.js` consumes page coverage when constructing equivalence groups and sitemap eligibility.
- `scripts/build-route-contract.js`, `scripts/generate-sitemaps.js`, and `scripts/validate-hreflang.js` run after localization generation/checks.
- `scripts/build-i18n.js` consumes the manifest, shared catalogs, and coverage policy; it no longer owns independent supported-locale or hreflang truth.
- `assets/js/components/navbar.js`, `footer.js`, `auth-modal.js`, `cookie-consent.js`, `ai-consent.js`, shared export/share helpers, and AI disclosure surfaces consume the runtime catalog contract.
- `assets/js/lib/formatters.js` becomes a compatibility facade over locale-aware `Intl` formatting.
- Existing French/Swahili/Yoruba/Hausa strategy validators remain focused quality checks and complement the platform validator.
- No Supabase, payment, authentication schema, or external translation service is required.

---

## Out of Scope

- Translating every tool's domain-specific long-form prose in this change.
- Launching Igbo, Portuguese, Arabic, or any locale without a complete public route and coverage contract.
- Replacing deterministic calculation engines or changing formulas, rates, currencies, or jurisdiction logic.
- Framework migration, server-side rendering migration, or introducing a translation management SaaS.
- Machine-translating sensitive user input or documents.
- Transliteration as a substitute for missing glyph/font support.
- Deleting valuable localized or legacy routes without an explicit redirect/deprecation decision.

---

## Implementation Plan

1. Add the locale manifest and page-coverage policy with schema versions, public launch facts, Igbo planned status, source owners, formatting defaults, and explicit fallback/deprecation overrides.
2. Add the shared localization build library and CLI with manifest, catalog, interpolation, HTML-safety, Unicode, route-language, country/locale, coverage, and report validation.
3. Expand the five launched-locale catalogs to the required shared UI domains and produce local browser projections.
4. Add red unit fixtures for every manifest, catalog, coverage, Unicode, formatting, and hreflang failure before implementation.
5. Add the browser runtime and migrate shared formatter, navigation selector, footer, consent/account, export/share, and AI disclosure integration points without changing calculation logic.
6. Integrate page coverage into route equivalence, hreflang, sitemap eligibility, and the normal build order.
7. Repair source-owned mojibake and NFC defects, regenerate only declared outputs, and produce deterministic coverage/discrepancy reports.
8. Run catalog/coverage tests, route tests, i18n validation, hreflang validation, visible-copy audits, broad tests, build/deploy checks, security/audit checks, and representative desktop/mobile/JavaScript-disabled browser verification.

---

## Test Strategy

- Unit fixtures validate all manifest, catalog, interpolation, unsafe HTML, duplicate/orphan, Unicode, locale/country, page-state, and indexability rules.
- Formatter tests use exact `Intl` outputs or capability assertions for `en`, `fr`, `sw`, `yo`, and `ha`, including explicit African currencies and invalid inputs.
- Coverage tests assert each state, rule precedence, required evidence, exact known fallbacks, and route-level materialization.
- Route tests prove fallbacks are excluded from equivalence groups and sitemaps while native/shell equivalents remain reciprocal.
- Runtime DOM tests prove translation provenance, NFC insertion, clipboard/CSV boundaries, and backward-compatible formatter APIs.
- Playwright covers desktop and mobile selector behavior, partial labels, equivalent preservation, fallback warning focus/Escape/confirm/cancel, and representative shared loading/error/consent/account states.
- Static HTML checks verify correct `lang`, `dir`, canonical, hreflang, initial content, and no false mixed-language indexability with JavaScript disabled.
- Existing `npm test`, French/Swahili/Yoruba/Hausa audits, build, deploy-artifact audit, security scan, and `git diff --check` remain release gates.
