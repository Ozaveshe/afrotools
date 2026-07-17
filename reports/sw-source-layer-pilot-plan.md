# Swahili Source-Layer Pilot Plan

Generated: 2026-05-16

## Verdict

Design-only. I did not create a `lang/pages/**/sw.json` pilot because the repo has page-pack mechanics, but not a route-safe Swahili output path for the families that matter. A premature pack could create duplicate English-slug Swahili pages or overwrite curated hand-authored bridge pages during a future full i18n build.

## Best Pilot Family

Country PAYE metadata/source packs, after route-alias output support is added. PAYE has English source pages, explicit Swahili mappings in `SW_SLUG_TO_EN`, an active cleanup owner (`scripts/fix-sw-paye-custom-ui.js`), and already-exposed country routes. VAT and TIN are weaker first pilots because the Prompt 71 ledger found VAT pages are static patterned pages with no tracked generator, and no matching English country VAT source pages were confirmed.

## Findings

- Page-pack support: present. build-i18n.js loads lang/pages/<pagePath>/<lang>.json and supports page.title, page.metaDescription, page.ogTitle, page.ogDescription and page.h1 overrides plus <lang>.body.html for article-body pages.
- Build output path: not route-safe for Swahili aliases. buildOutputPath(pagePath, sw) writes to /sw/<English pagePath>/; getSwahiliUrl only affects hreflang URL generation, not where generated HTML is written.
- Swahili route mapping: partial. SW_SLUG_TO_EN maps major hubs, PAYE pages and agriculture pages, but not VAT/TIN/HR country subpages.
- Country VAT family: not safe as first pilot. Prompt 71 ledger found 54 VAT pages already exposed but no tracked generator; local inspection did not find matching English /<country>/kikokotoo-vat/ source pages.
- Country PAYE family: best candidate after support patch. English sources like ghana/gh-paye.html exist, Swahili routes like /sw/ghana/kikokotoo-kodi-mshahara/ exist, and fix-sw-paye-custom-ui.js owns cleanup.
- Same-slug bridge pages: unsafe for pilot without overwrite policy. A pack like lang/pages/api/sw.json would make future build-i18n --all treat sw/api/index.html as generated output and overwrite the curated API bridge.

## Recommended Pilot Steps

1. Add a route-alias aware output resolver for Swahili page packs, using SW_SLUG_TO_EN in reverse or an explicit SW_EN_TO_ROUTE map.
2. Add a dry-run mode that reports the exact output file for a given page pack before writing.
3. Create one metadata-only pack for ghana/gh-paye -> /sw/ghana/kikokotoo-kodi-mshahara/ after the resolver can target the existing canonical Swahili route.
4. Run node scripts/build-i18n.js --lang sw --page ghana/gh-paye --dry-run, then a targeted build only if the output path is the canonical Swahili route and diff is metadata-only.
5. Follow with npm run build:i18n:validate, npm run validate:hreflang, and targeted link check for /sw/ghana/kikokotoo-kodi-mshahara/.

## Actions Intentionally Not Taken

- Did not create lang/pages/ghana/gh-paye/sw.json because current output would not target the canonical Swahili route.
- Did not create lang/pages/api/sw.json because it would make a future full i18n build overwrite a curated hand-authored bridge.
- Did not attempt VAT/TIN page packs because no source generator or English source family is confirmed.

## Validation

Design-only report. No source HTML or build-i18n script changed, so no build was required.
