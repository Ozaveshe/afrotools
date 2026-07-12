# AfroTools Country and Jurisdiction Identity Contract

## Canonical source

`data/registry/countries.json` is the only editable source for African country
identity. Every record has a stable ISO alpha-2 `id`, localized display names,
flag, ISO currency, region, source jurisdiction, canonical country-hub route
and slug, supported tool categories, locale coverage, languages, and
publication state.

The record separates three concepts:

- `id` and `sourceJurisdiction` identify the rules and source jurisdiction.
- `route` and `routeSlug` identify the canonical country hub.
- `localeCoverage` describes actual language routes. It does not mean that a
  language selects that country or that every tool exists in that language.

`ALL` remains a regional tool-registry sentinel and never becomes a country.

## Data flow

| Surface | Canonical flow | Build check |
|---|---|---|
| Country membership, names, flags, currency, region | `countries.json` → `scripts/lib/canonical-registry.js` → `data/registry/canonical-registry.json` | `npm run registry:check` |
| Browser country selector | canonical registry → `scripts/build-canonical-registry.js` → `assets/js/data/african-countries.js` → `country-selector.js` | selector is forbidden from owning a second country array |
| Route generation | country ID resolves through `countries.json`; family-specific profiles may own only family route aliases and content assumptions | generator rejects missing country IDs and data files |
| Title, description, H1, breadcrumb, flag | page generator resolves the country record and writes the country name/flag | country-identity audit compares the identity blocks to the route country |
| Field defaults, currency, and units | page loads a country data or formula record; the projected currency must equal the canonical country currency | data country code and currency are compared before output is written |
| Formula jurisdiction | generated `afrotools-formula-jurisdiction` metadata identifies the rule pack used | mismatch fails `country:check` |
| Source jurisdiction and citations | generated `afrotools-source-jurisdiction` identifies the cited jurisdiction; page citations remain family-owned | mismatch fails `country:check` |
| Structured data | application JSON-LD names the country or declares `spatialCoverage` | parsed WebApplication/WebPage identity is compared to the route |
| Related-tool links | links remain family-owned but country slugs must resolve to a canonical country ID | link checks plus the route identity audit cover generated country filenames |
| Localized country routes | `localeCoverage` and the route graph describe native, localized-shell, fallback, and unavailable states | English fallbacks cannot be indexable, sitemap members, or hreflang equivalents |

## Build invariants

`npm run country:build` regenerates the crop-yield and fertilizer families,
projects machine-readable identity metadata over generated country pages, and
scans every recognized country-specific HTML route. `npm run country:check`
performs the same validation without changing sources.

The build fails with a record-level file and field when any of these disagree:

- filename/route country;
- title, description, or primary heading;
- stable country ID and ISO code;
- flag, currency, region, or route slug;
- formula or data jurisdiction;
- source jurisdiction;
- structured-data identity;
- country data file currency;
- declared supported tool categories;
- localized country destination.

The complete generated result is written to
`reports/country-identity-report.json` and
`reports/country-identity-report.md`. A clean report still lists every scanned
route so absence of findings is auditable.

## Country and language controls

Language changes interface/content language. Country changes jurisdiction,
currency/data context, and tool applicability. Neither control changes the
other silently. In particular, Hausa has Nigeria-first editorial coverage but
no default country or currency; a saved, route-derived, or explicit country is
required before country-specific personalization.

## Adding or changing a country

1. Update `data/registry/countries.json`.
2. Update family-specific data or route aliases using the stable country ID.
3. Run `npm run registry:build` and `npm run country:build`.
4. Review the country identity report, generated route diff, and any formula
   fixture changes.
5. Run link, route, locale, and browser checks before release.

Do not restore a country array inside a component or clone another country's
page and rely on partial string replacement.
