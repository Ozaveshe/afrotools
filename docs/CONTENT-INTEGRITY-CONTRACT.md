# Content integrity contract

AfroTools blocks a release when public content contains source fragments, internal implementation notes, unfinished placeholders, unresolved template syntax, duplicate primary headings or metadata, repeated long paragraphs, unannounced foreign-language blocks, or incomplete generated-page provenance.

## Commands

- `npm run content-integrity:build` applies declared language fallbacks, removes later copies of exact repeated paragraphs, synchronizes blog locale metadata, and writes the report.
- `npm run content-integrity:check` is the non-mutating release gate.
- `npm run test:content-integrity` runs deliberately malformed fixtures.

The report is written to `reports/content-integrity-report.json` and `reports/content-integrity-report.md`. Every finding includes the route, exact semantic block, content hash, stable content ID when present, and editable source owner.

## Generated content provenance

Generated HTML must declare:

- `afrotools-content-id`: a stable identifier that does not depend on build time;
- `afrotools-source-owner`: an existing editable registry, data file, or generator source.

The same content ID cannot identify two outputs. A generated HTML file cannot name itself as its only editable source.

## Language contamination and fallbacks

Native and localized-shell pages are checked block by block using locale stop words and the UI catalog. Code, citations, URLs, brands, statutory names, and short technical labels are not treated as contamination by themselves.

An English block is allowed only when its page is declared in `data/localization/explicit-language-fallbacks.json`, the block has `lang="en"`, and the page contains both a machine-readable fallback marker and a visible localized notice. Adding `lang="en"` alone does not bypass the gate.

## Reviewed exceptions

Exceptions live in `data/quality/content-integrity-exceptions.json`. Each exception is tied to a rule, path, exact content hash, owner, review date, expiry date, and reason. Editing the content invalidates the exception automatically. Intentional merge-tag syntax in template editors is the normal use case; ordinary unfinished interpolation is not.

## Blog locale ownership

`data/content/blog-article-manifest.json` owns the locale, stable ID, category, and publication state for every English and French article source. Feeds and locale listings must consume this manifest rather than inferring language from a route prefix. Article HTML receives matching `content-language` and stable content-ID metadata.
