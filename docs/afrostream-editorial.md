# AfroStream: The Scene

AfroStream is an Africa-first creator and culture publication with a discovery layer. The front page leads with releases, collaborations, gaming and public creator developments. Live listings, rankings and the Creator Playbook give readers a reason to explore after a story.

## Editorial lanes

- **AfroStream reports:** original explanation, interviews, reported features and clearly labelled analysis. Give a reader context that the source feed does not already supply. Credit the editorial team in `author` and the primary source in `source_name` / `source_url`.
- **Newswire briefs:** short publisher feed excerpts with a visible publisher, publication date and link to the full report. The article page limits the displayed brief to 65 words. These remain browsable and shareable but use `noindex,follow`; they are excluded from the original-report sitemap.
- **What happened:** confirmed announcements and attributable public statements. Distinguish allegation, response and established fact. Never invent private relationships, quotes, audience reactions or popularity rankings.

Keep the coverage recognisably about creators and entertainment. A health startup award, general payments announcement or mining story is not a culture story merely because it mentions Africa, an award or a platform.

## A useful publishing rhythm

This is an operating plan, not a newly scheduled automation or a promise of publishing volume.

1. Review the current active-source health and recent published archive before selecting stories. Do not create duplicates or overwrite editorial moderation.
2. Select up to three useful daily briefs across different countries or scenes, when sources support them. Prioritise releases, creator collaborations, meaningful platform changes, gaming and public responses.
3. Produce two original reports each week: one fan-facing culture feature and one practical creator development. A starting range of 350–700 words is an editorial target, not a search ranking requirement.
4. Give each report an accurate title, a specific opening, dated primary sources, an image from the actual story and useful internal links. Separate observed facts from interpretation. Check availability rather than assuming an announcement applies in every African country.
5. Refresh evergreen guides when their facts change. Preserve the original publication date; change `updated_at` only for a real edit.

RSS supplies leads and brief excerpts. It does not by itself create original reporting. Avoid cloned articles, unsupported gossip and fabricated “trending” tags.

## Images and live signals

- News images use `/api/afrostream/image?id=<published-row-id>`. The server selects the saved source URL, checks HTTPS, approved hosts, public DNS, redirects, raster signatures and a 3 MB limit. Readers never supply an arbitrary remote URL.
- If a source image cannot be retrieved, a category tile keeps the card readable. A fallback tile is not proof that a thumbnail works.
- The RSS monitor retains thumbnail, media-image, image-enclosure and embedded image metadata on new inserts. Repair old images only after matching the exact source story and verifying the image response.
- YouTube live detection reads the selected player response. `isLiveContent`, recommendation badges and an ended replay do not prove a current broadcast.
- Both the live API and client apply a 90-minute freshness limit and deduplicate current URLs. Provider failure has a separate unavailable state; an empty checked feed does not imply every creator is offline.
- TikTok and Instagram listings remain curated; other providers depend on configured access. Do not describe every platform as comprehensively monitored.

## Search and engagement

Original permalinks return readable HTML, canonical URLs, source attribution, real publication/modification dates and `NewsArticle` data before JavaScript runs. Original-report sitemap: `/tools/afrostream/sitemap.xml`. The root sitemap index includes it. Newswire pages return `WebPage` data and `noindex,follow` on the initial response.

The existing `/university/` route now presents the Creator Playbook. Keep those established lesson URLs. Readers choose first-stream, clips or brand-pitch goals, save progress locally and download a text plan without an account.

Use the existing consent-aware analytics wrapper. New events cover story filters/opens and Playbook goal selection, lessons, step changes, checklist completion and plan saves. They contain fixed goal/module labels, not search terms, contact information or account details. These events cannot prove historical University traffic or organic growth.

After production publication, measure Search Console impressions/clicks for the hub, originals and existing lessons; measure consented story-to-lesson visits, first checklist action and plan saves. Compare equivalent 28-day windows. Investigate crawl/index status before interpreting traffic. Do not promise a ranking increase from deployment alone.

## Verification and recovery

Use `supabase_afrotools` MCP first and verify project ref `zpclagtgczsygrgztlts` before live operations. Repository, draft deploy, production browser, provider and database proof are separate.

Run the scoped AfroStream regression tests, `security:scan`, `build:deploy`, `audit:dist`, sitemap/route checks and internal link checks. On the deployed preview verify initial HTML, original/wire robots tags, images, source links, real 404s, RSS and article sitemap, and Playbook progress on desktop and mobile.

Keep live-content corrections reversible. Record row IDs and before-state evidence. Restore publication or source flags explicitly if required; never delete the archive to repair a presentation problem.
