# AfroTools Content Publishing Workflow

Use this guide when the task is to create or maintain editorial content on AfroTools.

AfroTools has two different publishing surfaces that look similar from the outside but work very differently in the repo:

1. The main blog is static and repo-backed.
2. AfroStream creator news is dynamic and Supabase-backed.

Treat them as separate systems.

## Surface Map

### Main blog

- Hub page: `blog/index.html`
- Article pattern: `blog/<slug>/index.html`
- Shared styles: `blog/assets/css/blog.css`
- Canonical pattern: `https://afrotools.com/blog/<slug>/`

### Creative news

- Marketing hub: `creative/index.html`
- Actual news feed: `tools/afrostream/news.html`
- Article shell: `tools/afrostream/article.html`
- Route rewrite: `/tools/afrostream/news/:slug`
- Data source: `as_news` in Supabase through the AfroStream API layer

## Read First

- `AGENTS.md`
- `docs/codex-playbook.md`
- `docs/design-doctrine.md`
- `tools/afrostream/HANDOFF.md` when working on creator news

## Core Rule

Do not treat AfroStream news like the static blog.

If the task is a normal blog article, edit repo files.
If the task is a creator news item, use the live content path first.

Quality beats cadence.

If a post cannot be made fresh, well-sourced, and substantial, skip it and report the blocker instead of shipping thin filler.

## Main Blog Workflow

Use this for finance, tax, business, tool, and country guides that should live under `/blog/`.

1. Pick a slug in the existing style: lowercase, hyphenated, keyword-first.
2. Create `blog/<slug>/index.html` from the nearest matching article pattern.
3. Include complete metadata:
   - `<title>`
   - meta description
   - canonical
   - OG tags
   - article timestamps
   - JSON-LD article schema
   - breadcrumb schema
   - FAQ schema when the page genuinely includes FAQs
4. Keep the body tool-led where possible:
   - explain the problem
   - give practical steps or examples
   - link to the relevant AfroTools calculator or tool
   - add related articles
5. Add the new card to `blog/index.html`.
6. Update or regenerate `blog/feed.xml` so RSS contains the new article. Use `npm run blog:feed` for this instead of hand-editing RSS.
7. Put the newest articles near the top of the article grid.
8. Only add to the featured row when the topic is strategically important.

### Main blog content standards

- Prefer practical and current topics over generic thought pieces.
- For time-sensitive rules, rates, deadlines, or legal guidance, verify against official sources before writing.
- Use concrete dates inside the article when "current" matters.
- Default to substantial long-form coverage for competitive evergreen topics. A normal target is 1,800 to 2,800 words when the topic supports it.
- Do not pad for length. Add depth through real sections, source-backed detail, tables, FAQs, comparisons, and tool-linked next steps.
- No em dashes in titles, headings, body copy, meta descriptions, or CTA text.
- No invented user stories, fictional mini-case-studies, fake scenarios, or made-up examples.
- If an example is needed, use a formula walkthrough based on real published thresholds or an official worked example from a cited source.
- Avoid thin content. Match the depth of neighboring high-quality blog posts.
- Link back to relevant tools, country pages, or other blog guides.

### Main blog validation

- Confirm `blog/feed.xml` contains the new article slug when the post is meant to be discoverable through RSS.
- Run `npm run blog:feed:check` to catch feed drift without writing files.
- Run `npm run blog:verify` for the static blog backend checks: hub count, duplicate cards, canonical routes, JSON-LD validity, RSS item links, and latest-post feed coverage.
- `npm run check-links` for new article paths and hub links
- `npm test` when the change is broader than one article card

## AfroStream News Workflow

Use this for creator bites, platform updates, milestones, collaborations, business moves, and rising-star coverage that should appear on `/tools/afrostream/news/`.

### Publishing path

Preferred order:

1. Use the configured `supabase` MCP server first for live inspection and publishing.
2. If MCP is unavailable, use the AfroStream admin/API path only when the required credentials are available.
3. If neither live path is available, prepare publish-ready payloads and stop before pretending the item is live.

### Automation note for Windows worktrees

- Worktree automations should rely on the global Codex Supabase config, not an untracked repo-local `.codex/config.toml`.
- On Windows, a required fallback secret can exist in the user environment store even when it is missing from the current process environment.
- Before treating `ADMIN_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_DATA_SERVICE_ROLE_KEY` as missing during an automation run, check the Windows user environment store as well.

### Repo files that explain the system

- `tools/afrostream/news.html`
- `tools/afrostream/article.html`
- `netlify/functions/afrostream-news.js`
- `netlify/functions/afrostream-admin.js`
- `netlify/functions/afrostream-feed.js`
- `tools/afrostream/HANDOFF.md`

### Minimum article payload

The admin function requires:

- `title`
- `excerpt`
- `body`

Recommended fields:

- `slug`
- `category`
- `published_at`
- `image_url`
- `is_featured` for direct Supabase writes
- `is_published`

Fallback admin payload caveat: the live `as_news` table uses `is_featured`.
Do not send a `featured` field through the fallback admin or REST publish path unless that field has been re-confirmed against the live API.

### Recommended AfroStream categories

- `milestones`
- `platform`
- `collabs`
- `business`
- `rising`
- `drama`

### AfroStream editorial standards

- Focus on African creators, platforms, business moves, rankings, audience growth, or monetization.
- Keep stories tighter than the main blog.
- Use specific names, dates, platforms, and countries.
- No em dashes anywhere in publishable copy.
- No invented milestones, fake creator stories, synthetic drama, or placeholder events.
- If a story cannot be tied to a real verified source, do not publish it.
- Avoid unverified gossip. If a claim is not verified, do not present it as fact.
- Favor clean, skimmable structure over long-form essay writing.

### AfroStream verification

After publishing, verify:

1. `GET /api/afrostream/news?slug=<slug>` returns the article
2. `/tools/afrostream/news/<slug>` resolves through the article shell
3. The feed page shows the item in the latest set
4. RSS includes it when appropriate via `/tools/afrostream/feed.xml`

## Daily Cadence

For the current content operating model, the default cadence is:

- 2 main blog posts per day
- 2 AfroStream news posts per day
- creative/news can exceed the baseline when the creator cycle is active

A safe operating pattern is two batches per day:

1. Morning batch: 1 main blog post + 1 AfroStream news post
2. Evening batch: 1 main blog post + 1 AfroStream news post

## Topic Selection Guardrails

### Main blog

- Prioritize tool-adjacent topics that can link into existing calculators and hubs.
- Avoid publishing two posts that cannibalize the same keyword unless one is clearly an update or a different intent.
- Favor country-specific or rules-based topics when they create search entry points for tools.

### AfroStream news

- Prioritize freshness and relevance over volume.
- Prefer notable milestones, launches, rankings changes, creator business moves, and creator-economy shifts.
- If there is no credible story, skip publication rather than forcing filler.

## Escalation Rules

Pause and call it out when:

- a "current" topic cannot be verified
- the source set is too weak to support a substantial article
- a live publish path is blocked by missing auth
- the new post would obviously duplicate an existing slug or keyword target
- the change needs both repo edits and live database publishing but only one side is available

## Deliverables For Recurring Runs

Each batch should leave behind:

- the published URL or file path
- the chosen slug
- the topic and angle
- source notes for time-sensitive claims
- RSS/feed inclusion for static main-blog posts
- any blocker for items that could not be published live
