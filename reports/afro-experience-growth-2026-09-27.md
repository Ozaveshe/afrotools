# AfroStream, AfroAtlas, AfroKitchen: deeper-use growth goal

Status: first source change set prepared in `codex/afro-experience-growth`; production effect has not been measured.

## Goal and measurement

Increase the share of organic visitors who complete a useful product action on each surface. Use a 28-day pre-release baseline and a comparable 28-day post-release window; aim for a 20% relative lift in each product's organic deeper-use rate within eight weeks. Report both numerator and denominator so a traffic mix change is visible. Search Console clicks, impressions, CTR, and indexed URL coverage are separate SEO measures. No traffic or conversion baseline was available in this checkout, so the target is a hypothesis until the baseline is captured.

| Product | Primary deeper-use action | Current event added | Next action to measure |
| --- | --- | --- | --- |
| AfroStream | Open a stream, creator platform, or copy a creator brief | `afrostream_stream_opened`, `afrostream_platform_opened`, `afrostream_creator_brief_copied` | Measure creator profile opens and any verified follow flow |
| AfroAtlas | Open a completed two-country comparison | `afroatlas_comparison_viewed` | Measure brief export after data provenance is added |
| AfroKitchen | Generate and use a recipe plan | `afrokitchen_plan_created`, `afrokitchen_plan_exported` | Add a local "cooked this" completion action |

All new event parameters are non-personal metadata. The existing `assets/js/lib/analytics.js` wrapper sends product events only after analytics consent.

## Evidence at audit time

- On 2026-09-27, read-only AfroTools Supabase aggregate queries returned 407 published, unflagged creators; 1,211 published news items; and 410 verified recipes. These are live database counts, not proof of indexation or page reach.
- The public AfroStream page loaded 50 creators into its hero while health reported 407 published creators. Its visible live feed showed 0 while the health check marked 8 live. The views use different requests, so the status is now shown as a mismatch instead of asserting a single live count.
- AfroAtlas had 54 generated country URLs but almost no profile body until JavaScript ran. The country pages also exposed numeric GDP and trade claims in metadata without a source year in that view.
- AfroKitchen had 410 generated recipe pages and a working planner, but its browser fallback contained only 8 seed recipes. The new compact index is generated from the verified public route manifest and includes ingredients for all 410.
- Repository search found no product-specific Search Console or GA4 baseline for these three surfaces. These structural findings do not establish a ranking or conversion lift.

## First change set

- AfroAtlas: 54 crawlable country profiles, a 54-link static directory, visible comparison paths, safer snippets and FAQ answers, and an explicit reference-data limitation. Country content dates and sitemap lastmod were updated because these profiles materially changed.
- AfroKitchen: planner and discovery use the generated 410-recipe public index before live database/seed fallback. Plan creation and export are measurable.
- AfroKitchen SEO audit: corrected its rolling-date expectation so old unchanged recipes retain their real content dates. The indexability audit now reports 0 lastmod mismatches for 410 published recipes.
- AfroStream: hero labels describe loaded rows, stream source contradictions are surfaced, premature "Preview mode" text is removed, and the landing cards/table focus on creator discovery instead of unverified net-worth estimates.

## Next work, in priority order

1. Build source-dated, reviewed country indicators for Atlas. Do not increase numeric search copy until the data has source, year, unit, and confidence per value.
2. Produce indexable AfroStream creator/news discovery from a reviewed public snapshot with canonical routes and source dates. Keep live status separate from historical creator data.
3. Add a local recipe completion/save action in Kitchen and track its use without account capture.
4. Capture Search Console and GA4 baselines per route group, then compare organic deeper-use rates and search metrics after release. Investigate pages with impressions but weak CTR and pages with clicks but weak action completion.

## Validation boundary

Static and browser checks in the isolated checkout passed for Atlas profile discovery and mobile comparison, Kitchen search/planner/export/mobile, Stream count/status/mobile, recipe-index parity, links, route metadata, and sitemap generation. A production deployment, Search Console crawl, and post-release conversion lift remain unverified.
