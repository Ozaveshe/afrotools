# AfroStream, AfroAtlas, AfroKitchen: deeper-use growth goal

Status: first source change set is committed on `codex/afro-experience-growth`; a second scoped follow-up is prepared on `codex/afro-experience-growth-followup`. The publisher controls integration and deployment. Production effect has not been measured.

## Goal and measurement

Increase the share of organic visitors who complete a useful product action on each surface. Use a 28-day pre-release baseline and a comparable 28-day post-release window; aim for a 20% relative lift in each product's organic deeper-use rate within eight weeks. Report both numerator and denominator so a traffic mix change is visible. Search Console clicks, impressions, CTR, and indexed URL coverage are separate SEO measures. No traffic or conversion baseline was available in this checkout, so the target is a hypothesis until the baseline is captured.

| Product | Primary deeper-use action | Current event added | Next action to measure |
| --- | --- | --- | --- |
| AfroStream | Open a stream, creator platform, or copy a creator brief | `afrostream_stream_opened`, `afrostream_platform_opened`, `afrostream_creator_brief_copied`, `afrostream_follow_platform_opened` | Measure creator profile opens and verified platform follows where the platform allows attribution |
| AfroAtlas | Open a completed two-country comparison | `afroatlas_comparison_viewed` | Measure brief export after data provenance is added |
| AfroKitchen | Generate and use a recipe plan | `afrokitchen_plan_created`, `afrokitchen_plan_exported`, `afrokitchen_plan_saved`, `afrokitchen_plan_restored` | Add a local "cooked this" completion action |

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

1. Source-date Atlas resource, trade, HDI, and other indicators before treating them as current figures. The follow-up only adds World Bank GDP, population, and GDP/person.
2. Produce indexable AfroStream creator/news discovery from a reviewed public snapshot with canonical routes and source dates. Only 78 of 407 published creators had bios of at least 60 characters, so avoid bulk thin profiles.
3. Add a local "cooked this" completion action in Kitchen and track its use without account capture. Plan save and restore are complete in the follow-up.
4. Capture Search Console and GA4 baselines per route group, then compare organic deeper-use rates and search metrics after release. Investigate pages with impressions but weak CTR and pages with clicks but weak action completion.

## Follow-up change set

- AfroAtlas: fetched a dated snapshot from the official World Bank WDI API on 2026-09-27. GDP and GDP/person cover 52 of 54 countries; population covers all 54. Eritrea and South Sudan show unavailable GDP and GDP/person where the selected 2016–2025 WDI window has no observation. The snapshot records source URL, indicator, unit, year, and retrieval date. The generated browser overlay and 54 static country profiles show these figures and source links consistently; comparison and brief views use the same values. A missing value no longer receives a false "higher" comparison badge. Legacy resource and trade fields are explicitly identified as undated.
- AfroKitchen: regeneration rotates through eligible recipes, a plan can be saved and restored on the same device, and malformed saved settings are rejected. Storage contains recipe slugs and planner settings, not ingredient text. The plan creation event no longer carries a diet filter.
- AfroStream: a creator profile offers a direct link to a validated HTTPS creator platform instead of a local "Follow" toggle that did not follow on any platform. Missing creator IDs render an unavailable page and `noindex` rather than silently displaying the first listed creator. The old local `as_following` state is no longer shown; it was not used by a follow service.

## Follow-up validation

- Snapshot validation: 54 expected country records; GDP 52, population 54, GDP/person 52.
- Static Atlas country search pages: 54 passed. Playwright Chromium: Atlas 3 passed, Kitchen 2 passed, Stream 2 passed on fresh isolated ports. Checks include mobile overflow, no-JavaScript Atlas content, source gaps, Kitchen save/restore/clear, and Stream link validation.
- `npm run seo:report`: 0 missing canonical/title/description/hreflang issues. `npm run check-links`: 0 broken internal links across 142,255 links.
- `npm run build:deploy`, `npm run audit:dist`, `npm run security:scan`, and `git diff --check`: passed. The full build generated unrelated cache-hash and localization/report changes; those were reviewed and restored before a scoped `dist` rebuild and repeat artifact audit.
- No production, Search Console, GA4 uplift, platform follow completion, or user retention result is claimed. The publisher's next intake must integrate the follow-up branch and verify its exact SHA in production.

## Validation boundary

Static and browser checks in the isolated checkout passed for Atlas profile discovery and mobile comparison, Kitchen search/planner/export/mobile, Stream count/status/mobile, recipe-index parity, links, route metadata, and sitemap generation. A production deployment, Search Console crawl, and post-release conversion lift remain unverified.
