# AfroAtlas research workflow

AfroAtlas helps a visitor open a dated country profile, shortlist countries, compare equivalent observation years, and export a cited research brief. Deeper use is measured through country opens, shortlist additions, completed comparisons and brief/data exports. None of these actions requires an account.

## Maintained sources and generated output

- `engines/src/afroatlas-engine.js` owns country names, slugs, capitals, currencies, resource/product reference lists and world reference countries. Its old quantitative resource and trade fields are not used by the research interface.
- `data/registry/countries.json` owns African region identity.
- `data/afroatlas/research-indicators.json` owns nine World Bank WDI measures and their 2016–2025 annual series, observation years, provider update dates, retrieval date, units and source URLs.
- `assets/js/lib/afroatlas-research.js` contains DOM-free discovery, shared-year comparison, shortlist validation, brief and CSV logic.
- `tools/afroatlas/research-workbench.js` enhances static pages. Country profiles retain their source-dated content when JavaScript runs.
- `tools/afroatlas/_country-template.html` and `scripts/lib/afroatlas-research-pages.js` own the generated country HTML. `scripts/build-afroatlas.js` also owns `research-data.js`, the landing directory, static GDP rankings and source coverage table.
- `assets/img/flags/afroatlas/` contains unmodified local Twemoji SVGs. `data/afroatlas/flag-assets.json` pins release, source, license and hashes. The sources page provides public attribution. The importer is an explicit maintenance action, never a build-time network dependency.

## Refresh and validation

```powershell
npm run afroatlas:data:refresh
npm run afroatlas:data:check
npm run afroatlas:build
npm run test:afroatlas
npm run test:afroatlas:browser
```

Only `data:refresh` calls the World Bank API. Review changed values, coverage and dates before publishing. Normal builds use the checked-in snapshot and regenerate the owned pages before assets, SEO and artifact generation. Missing observations stay N/A. Zero and negative real growth are valid observations. Country CSVs export all nine measures with their dates and source links; comparison CSVs export exactly the observations used by the selected year mode.

Use `npm run afroatlas:flags:import` only to deliberately refresh the pinned official Twemoji assets. Review SVG safety checks, manifest hashes and the graphics license. No flag CDN is called by the product.

The dedicated browser configuration starts a fresh server on port 43824 (`AFROATLAS_TEST_PORT` can override it). It refuses to reuse an existing server, so another checkout cannot supply false passing evidence. Release checks additionally require `npm run build:deploy`, `npm run build:checks`, `npm run security:scan`, `npm run audit:dist`, links and relevant SEO validation.

## Product and evidence boundaries

Latest shared year is selected independently for each comparison indicator. Latest-for-each mode explicitly labels year mismatch and computes no difference for mismatched years. Resource and product lists are undated research references: no production ranking, business suitability score, resource curse score or current goods-only totals are inferred from them. UN Comtrade, WITS and USGS links are verification paths, not imported evidence.

Shortlists persist at most four allowlisted African country codes in `afroatlas_shortlist_v1`. Research notes remain in page memory until the visitor copies or downloads them and are labeled unverified. Analytics use the existing privacy-aware analytics API and country codes, counts, purpose, format, indicator and year mode only. They never receive search terms or notes.

SEO proof is separate from product proof. Country profiles expose headings, dated observations, annual tables, FAQ text and country links in the initial HTML, with self canonicals and matching Dataset/FAQ schemas. Search Console baseline and later outcomes must identify date range and route filter. A generated page or passing browser test does not prove indexing, ranking improvement, conversion lift or deployment. The AfroTools publisher owns integration and exact-SHA production proof.
