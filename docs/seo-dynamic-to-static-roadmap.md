# SEO Dynamic-to-Static Roadmap

## Purpose

This roadmap covers the next SEO phase for the two data-driven tool surfaces that still rely on thin query templates:

- `tools/afrokitchen`
- `tools/africa-conflict`

The goal is not a broad refactor. The goal is to turn the highest-value dynamic detail pages into crawlable static pages with clean URLs, while keeping live widgets, sync jobs, and utility templates intact.

## Current State

### AfroKitchen

- `tools/afrokitchen/index.html` is already a public, indexable landing page.
- `tools/afrokitchen/recipe.html`, `collection.html`, and `country.html` are utility/query templates that currently read `?slug=` or `?country=` and are correctly `noindex, follow`.
- The static SEO generator now uses a repo-side manifest export at `tools/afrokitchen/seo-manifest.json`.
- The current implementation path is:
  - `scripts/export-afrokitchen-seo-manifest.js`
  - `scripts/generate-afrokitchen-static-pages.js`
  - generated route helper `tools/afrokitchen/static-routes.js`
- The runtime data layer lives in `engines/afrokitchen-engine.js`.
- Live recipe data comes from:
  - `netlify/functions/afrokitchen-recipes.js`
  - Supabase tables defined in `supabase/afrokitchen-schema.sql`
  - `AfroKitchenEngine.SEED_RECIPES` and `SEED_COLLECTIONS` as fallback inventory
- Costing is dynamic and country-sensitive through `netlify/functions/afrokitchen-costs.js`.

### Africa Conflict

- `tools/africa-conflict/index.html` plus `conflicts.html`, `actors.html`, `displacement.html`, `economy.html`, `forecasts.html`, `map.html`, and `methodology.html` are already stable public pages.
- `tools/africa-conflict/detail.html` is still a thin query/detail template driven by `?id=`.
- The runtime data layer lives in `engines/africa-conflict-engine.js`.
- Public conflict data comes from:
  - `netlify/functions/conflict-data.js`
  - sync/freshness pipeline in `conflict-sync.js`, `conflict-acled.js`, `conflict-unhcr.js`, and `conflict-worldbank.js`
  - local schema and seed contract in `supabase/africa-conflict-seed.sql`

### Existing SEO Build Behavior

- `scripts/generate-sitemaps.js` excludes pages that are `noindex` or canonically mismatched.
- `scripts/seo-daily-fix.js` reports missing canonicals and descriptions, but does not generate them.
- `scripts/inject-internal-links.js` is the repo pattern for adding crawlable HTML links where JS-only rendering would otherwise hide discovery.
- `scripts/build-seo-system.js` is the existing metadata/content-layer post-processor for broader SEO surfaces.

## What Should Become Static

| Current template | Should become | Why |
| --- | --- | --- |
| `tools/afrokitchen/recipe.html?slug=<slug>` | Static recipe detail pages | Highest-intent long-tail traffic, strongest schema fit, already has rich structured content |
| `tools/afrokitchen/country.html?country=<code>` | Static country cuisine hub pages | Strong browse intent, supports recipe clustering and internal links |
| `tools/afrokitchen/collection.html?slug=<slug>` | Static themed collection pages | Good cluster pages for recipe discovery and internal linking |
| `tools/africa-conflict/detail.html?id=<slug>` | Static conflict dossier pages | Replaces thin query page with real indexable dossiers and unlocks clean links from map/list views |

## What Should Stay Dynamic Inside Static Pages

These should remain hydrated client-side even after the main page becomes static:

- AfroKitchen cost estimates by country
- AfroKitchen reviews, timers, servings scaling, share/print helpers
- Africa Conflict live charts, latest-event refreshes, and any near-real-time metrics blocks

The page shell, title, description, canonical, primary body copy, breadcrumb trail, and core links should be build-time static. The live utilities can layer on top.

## Ideal Clean URL Patterns

Use directory-style URLs with `index.html` outputs where possible. That keeps routing clean and avoids leaning on canonical-only normalization.

### AfroKitchen

- `/tools/afrokitchen/recipes/<recipe-slug>/`
- `/tools/afrokitchen/countries/<country-slug>/`
- `/tools/afrokitchen/collections/<collection-slug>/`

Recommended examples:

- `/tools/afrokitchen/recipes/nigerian-jollof-rice/`
- `/tools/afrokitchen/countries/nigeria/`
- `/tools/afrokitchen/collections/great-jollof-tour/`

Notes:

- Use country slugs, not raw codes, in public URLs.
- Keep the existing query templates as fallbacks, not as the primary indexed routes.

### Africa Conflict

- `/tools/africa-conflict/conflicts/<conflict-slug>/`

Recommended examples:

- `/tools/africa-conflict/conflicts/sudan-civil-war/`
- `/tools/africa-conflict/conflicts/drc-eastern-conflict/`

Notes:

- Keep the existing public hubs exactly where they are:
  - `/tools/africa-conflict/`
  - `/tools/africa-conflict/conflicts/`
  - `/tools/africa-conflict/actors/`
  - `/tools/africa-conflict/displacement/`
  - `/tools/africa-conflict/economy/`
  - `/tools/africa-conflict/forecasts/`
  - `/tools/africa-conflict/map/`
  - `/tools/africa-conflict/methodology/`

## Canonical Strategy

### Indexable public pages

- Every new static page should self-canonicalize to its clean extensionless URL.
- Existing stable public hubs should keep self-canonicals.

### Thin query templates

Keep these templates `noindex, follow`:

- `tools/afrokitchen/recipe.html`
- `tools/afrokitchen/country.html`
- `tools/afrokitchen/collection.html`
- `tools/africa-conflict/detail.html`

Canonical behavior for those templates:

- Before a static equivalent exists: canonicalize to the parent landing page, as they do now.
- After a static equivalent exists: canonicalize the query template to the matching clean static route when the identifier is valid.

Examples:

- `recipe.html?slug=nigerian-jollof-rice` -> canonical `/tools/afrokitchen/recipes/nigerian-jollof-rice/`
- `detail.html?id=sudan-civil-war` -> canonical `/tools/africa-conflict/conflicts/sudan-civil-war/`

### Parameterized states

Search, filters, tabs, serving counts, map state, and cost-country variants should not create new canonicals. They should inherit the page canonical and stay out of indexation.

## Metadata Strategy

### AfroKitchen recipe pages

- Title format: `<Recipe Name> Recipe | <Country> | AfroKitchen`
- Description source:
  - primary: `recipes.description`
  - secondary: trimmed story or best-served-with copy if the description is too thin
- OG/Twitter image source:
  - primary: recipe `image_url`
  - fallback: `tools/afrokitchen/recipe-images.json` and override/progress files
- Include visible summary content in HTML, not only client-side DOM updates

### AfroKitchen country pages

- Title format: `<Country> Recipes & Traditional Dishes | AfroKitchen`
- Description source:
  - generated from country name, region, and the top recipes in that country hub
- OG/Twitter:
  - use a stable tool-level or country-level image until dedicated country cards exist

### AfroKitchen collection pages

- Title format: `<Collection Name> | AfroKitchen`
- Description source:
  - `collections.description`
  - plus a short generated sentence naming the dominant countries or dish types in the set

### Africa Conflict dossier pages

- Title format: `<Conflict Name> | Timeline, Actors, Displacement & Outlook | AfroTools`
- Description source:
  - primary: `ac_conflicts.summary`
  - append current status and primary geography where helpful
- OG/Twitter:
  - start with a stable Africa Conflict default image
  - later phase: generate conflict-specific social cards from slug, country, and status

## Schema Strategy

### AfroKitchen recipe pages

Use:

- `Recipe`
- `BreadcrumbList`

Populate from existing data already assembled in `AfroKitchenEngine.getStructuredData()`:

- ingredients
- steps
- nutrition
- prep/cook/total time
- yield
- aggregate rating when reviews exist

Avoid relying on client-side schema injection as the primary implementation. The JSON-LD should ship in the built HTML.

### AfroKitchen country and collection pages

Use:

- `CollectionPage`
- `ItemList`
- `BreadcrumbList`

Optional later phase:

- `FAQPage`, but only if there is authored FAQ content on the page

### Africa Conflict dossier pages

Use:

- `WebPage`
- `BreadcrumbList`

Optional later phase, only if the page gets a clearly structured data-methodology block:

- `Dataset`

Do not use `NewsArticle` or `Article` as the default conflict schema. These pages are evergreen dossiers with live data, not one-off reported stories.

## Internal Linking Strategy

### AfroKitchen

Update source links so the static routes become the default everywhere:

- `tools/afrokitchen/index.html`
- `tools/afrokitchen/recipe.html`
- `tools/afrokitchen/country.html`
- `tools/afrokitchen/collection.html`
- `engines/afrokitchen-engine.js`

Linking rules:

- Landing page links to:
  - top recipes
  - top country hubs
  - top collections
- Every recipe page links to:
  - its country hub
  - 3 to 6 related recipes
  - 1 relevant collection when available
- Every country hub links to:
  - all featured recipes for that country
  - adjacent countries or regional collections when helpful
- Every collection page links to:
  - each recipe in the collection
  - country hubs represented in the collection

Important:

- Add crawlable HTML anchors in source output.
- Do not depend only on client-rendered cards for discovery.
- `scripts/inject-internal-links.js` is the existing repo pattern to borrow from if a helper is needed.

### Africa Conflict

Update source links so all discovery points land on dossier URLs instead of `detail.html?id=...`:

- `tools/africa-conflict/index.html`
- `tools/africa-conflict/conflicts.html`
- `tools/africa-conflict/map.html`
- `tools/africa-conflict/dashboard.js`
- `engines/africa-conflict-engine.js`

Linking rules:

- Landing and list pages link to top dossier pages.
- Map popups link to dossier pages.
- Every dossier page links back to:
  - `conflicts/`
  - `map/`
  - `actors/`
  - `displacement/`
  - `economy/`
  - `forecasts/`
  - `methodology/`
- Dossiers should also cross-link to 2 to 4 related conflicts by region, type, or spillover relevance.

## Sitemap Strategy

### Phase 1

- Generate real static HTML files for the new routes.
- Let `scripts/generate-sitemaps.js` discover them automatically.
- Keep query templates `noindex` so they remain excluded from sitemaps.

### Phase 2

- If generators emit directory routes with `index.html`, no `_redirects` work should be required for clean URLs.
- If generators emit flat `.html` files instead, the current sitemap generator can normalize extensionless canonicals, but directory output is still the cleaner long-term pattern.

### Phase 3

After page generation, run:

- `node scripts/generate-sitemaps.js`
- `npm run seo:report`

Do not hand-edit `sitemap*.xml` as part of this migration.

## What Should Remain Noindex

- `tools/afrokitchen/recipe.html`
- `tools/afrokitchen/country.html`
- `tools/afrokitchen/collection.html`
- `tools/africa-conflict/detail.html`
- Query and filter states such as:
  - `?slug=`
  - `?country=`
  - `?id=`
  - map/filter/search variants
  - serving-count or costing variants

Outside this roadmap:

- `tools/afrokitchen/submit.html` is not part of the dynamic-to-static SEO push. Leave its current treatment unchanged until there is a separate decision about whether it should stay a public acquisition page or become conversion-only.
- Widget iframes should continue following the existing repo rule: `noindex, follow` with canonicals back to the full tool route.

## First 10 Routes To Ship

This first batch mixes high-intent recipe demand with high-recognition conflict dossiers.

1. `/tools/afrokitchen/recipes/nigerian-jollof-rice/`
2. `/tools/afrokitchen/recipes/ethiopian-doro-wat/`
3. `/tools/afrokitchen/recipes/egyptian-koshari/`
4. `/tools/afrokitchen/recipes/moroccan-chicken-tagine/`
5. `/tools/afrokitchen/recipes/ghanaian-waakye/`
6. `/tools/afrokitchen/recipes/ugali-sukuma-wiki/`
7. `/tools/africa-conflict/conflicts/sudan-civil-war/`
8. `/tools/africa-conflict/conflicts/drc-eastern-conflict/`
9. `/tools/africa-conflict/conflicts/nigeria-boko-haram/`
10. `/tools/africa-conflict/conflicts/somalia-al-shabaab/`

Why this batch:

- The six recipes are already present in `AfroKitchenEngine.SEED_RECIPES`, have strong consumer search intent, and cover multiple African regions.
- The four conflict dossiers are already present in `supabase/africa-conflict-seed.sql`, have strong recognition/search demand, and are linked to active map/list discovery surfaces.

## Exact File And Script Touch Points

### AfroKitchen

Source pages and runtime:

- `tools/afrokitchen/index.html`
- `tools/afrokitchen/recipe.html`
- `tools/afrokitchen/country.html`
- `tools/afrokitchen/collection.html`
- `engines/afrokitchen-engine.js`

Data and image sources:

- `netlify/functions/afrokitchen-recipes.js`
- `netlify/functions/afrokitchen-costs.js`
- `supabase/afrokitchen-schema.sql`
- `tools/afrokitchen/recipe-images.json`
- `tools/afrokitchen/recipe-images-override.json`
- `tools/afrokitchen/recipe-images-progress.json`

New implementation scripts recommended:

- `scripts/generate-afrokitchen-static-pages.js`
- optional: `scripts/export-afrokitchen-seo-manifest.js`

Recommended implementation behavior:

- Export a stable build manifest of recipes, collections, and country groupings.
- Generate directory-based static pages from that manifest.
- Leave pricing and reviews dynamic.

### Africa Conflict

Source pages and runtime:

- `tools/africa-conflict/index.html`
- `tools/africa-conflict/conflicts.html`
- `tools/africa-conflict/map.html`
- `tools/africa-conflict/detail.html`
- `tools/africa-conflict/dashboard.js`
- `engines/africa-conflict-engine.js`

Data and sync sources:

- `netlify/functions/conflict-data.js`
- `netlify/functions/conflict-sync.js`
- `netlify/functions/conflict-acled.js`
- `netlify/functions/conflict-unhcr.js`
- `netlify/functions/conflict-worldbank.js`
- `supabase/africa-conflict-seed.sql`

New implementation scripts recommended:

- `scripts/generate-africa-conflict-static-pages.js`
- optional: `scripts/export-africa-conflict-seo-manifest.js`

Recommended implementation behavior:

- Build dossier pages from a normalized manifest of published conflicts.
- Regenerate after the sync pipeline updates conflict data.
- Keep live charts and recent-event modules hydrated client-side.

### Shared SEO and build layer

- `scripts/generate-sitemaps.js`
- `scripts/build-seo-system.js`
- `scripts/inject-internal-links.js`
- `scripts/seo-daily-fix.js`

Likely later-phase follow-ons:

- `fr/tools/afrokitchen/recipe.html`
- `fr/tools/afrokitchen/country.html`
- `fr/tools/afrokitchen/collection.html`
- `fr/tools/africa-conflict/detail.html`
- `scripts/build-i18n.js`
- `scripts/validate-hreflang.js`

Recommendation:

- Ship English static routes first.
- Mirror the pattern into translated surfaces only after the English route and manifest model is stable.

## Execution Order

1. Lock the public URL model and canonical rules.
2. Build export manifests from the existing Supabase/function data contracts.
3. Generate the first 10 static pages as directory routes.
4. Rewire all source links from query URLs to clean routes.
5. Add static HTML internal-link sections where discovery currently depends on JS.
6. Regenerate sitemaps and run SEO report validation.
7. Expand from the first 10 routes to the full recipe, country, collection, and conflict-dossier inventories.

## Recommended Non-Goals For This Phase

- Do not redesign the tools.
- Do not rewrite the live engines from scratch.
- Do not hand-edit sitemap XML.
- Do not make translated mirrors part of the first implementation wave.
- Do not index utility states, query templates, or widget iframes.
