# Education discovery and tool journeys

The English Education category is generated from `scripts/build-education-discovery.js` and `assets/js/components/education-taxonomy.js`. The registry supplies each tool's name, description, route and country scope. The taxonomy assigns every English Education tool to exactly one directory group.

`scripts/build-education-tool-journeys.js` maintains the static next-step section and main landmark on every registry-backed English Education tool page. Its `journeys` map holds a tool-specific preparation note and a related next tool. Keep that map complete when adding or removing an Education tool. The generated links use ordinary HTML anchors so the navigation works without JavaScript and remains crawlable.

Run `npm run education:build` after changing the registry, taxonomy, hub design, or journey map. Run `npm run education:check` to verify generated pages, complete route coverage, canonical links, and journey panels. For SEO changes, follow with `npm run check-links`, `npm run seo:report`, and `npm run validate:hreflang`; do not hand-edit sitemaps.

The hub's search filters are an enhancement to the static directory. Each group remains in the HTML inside a native `details` element. The first group opens by default; searching opens matching groups and the clear action restores the default view. A new Education subhub path should point to actual tools, describe user-entered evidence, and avoid admission, eligibility, award or cost guarantees.
