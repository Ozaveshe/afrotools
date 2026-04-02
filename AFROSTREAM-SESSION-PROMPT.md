# AfroStream — Continuation Session Prompt

Copy everything below this line into a new Claude Code session.

---

## Context

AfroStream is a streaming discovery hub for African creators at `afrotools.com/tools/afrostream/`. It's part of the AfroTools platform (1,300+ free tools). The codebase is plain HTML/CSS/vanilla JS — NO frameworks. Backend is Supabase PostgreSQL (project ID: `zpclagtgczsygrgztlts`), hosted on Netlify with serverless functions.

## CRITICAL: Uncommitted Changes — Deploy First

There are **49 modified files and 20+ new untracked files** that have NOT been committed or deployed. The new Netlify functions are returning 404 on production because they only exist locally.

### Step 1: Commit and deploy all changes

```
# Key new files to stage:
netlify/functions/afrostream-creators.js
netlify/functions/afrostream-news.js
netlify/functions/afrostream-streams.js
netlify/functions/afrostream-featured.js
netlify/functions/afrostream-creator.js
netlify/functions/afrostream-feed.js
netlify/functions/afrostream-og.js
netlify/functions/afrostream-sync.js
netlify/functions/afrostream-community.js
tools/afrostream/article.html
tools/afrostream/HANDOFF.md
engines/afropoints-engine.js
netlify/functions/afropoints-*.js
supabase/afropoints-schema.sql
supabase/afrostream-community-schema.sql
tools/afropoints/
```

Plus all modified files (afrostream pages, creator-* tools, _redirects, sitemap.xml, netlify.toml, etc.)

Commit with a message like: "feat: AfroStream API endpoints, YouTube sync, article page, admin sync tab"

Then verify the deploy succeeds on Netlify.

### Step 2: Verify APIs work after deploy

Test these endpoints on the live site and confirm they return data:
- `GET https://afrotools.com/api/afrostream/creators?limit=5` — should return creators array
- `GET https://afrotools.com/api/afrostream/news?limit=3` — should return news articles
- `GET https://afrotools.com/api/afrostream/streams?live=true` — should return live streams
- `GET https://afrotools.com/api/afrostream/featured` — should return featured creators
- `GET https://afrotools.com/api/afrostream/creator?slug=carter-efe` — should return single creator + streams + similar
- `GET https://afrotools.com/tools/afrostream/feed.xml` — should return RSS XML
- `GET https://afrotools.com/api/afrostream/og?name=TestCreator&subs=100K&country=Nigeria&category=Gaming` — should return SVG image

If any fail, check `_redirects` file has the correct routing rules and the function names match.

### Step 3: Test YouTube sync

Trigger a manual sync via admin panel or API:
```
POST https://afrotools.com/api/afrostream/sync
Authorization: Bearer {ADMIN_SECRET}
```

The `YOUTUBE_API_KEY` env var is already set on Netlify. There are 8 creators with YouTube URLs in the database. The sync should:
- Resolve YouTube handles (e.g., `@MarkAngelComedy`) to channel IDs
- Fetch subscriber counts via YouTube Data API v3
- Update `as_creators.subscribers` if YouTube count is higher than current
- Update avatars from YouTube thumbnails (replacing ui-avatars.com placeholders)
- Check live status per channel

Verify after sync by querying: `SELECT name, subscribers, avatar FROM as_creators WHERE youtube_url IS NOT NULL;`

## Pending Feature: Automated News Generation

When the sync function detects milestones, it should auto-create news articles in `as_news`. Examples:
- Creator crosses 1M / 5M / 10M subscribers
- Creator goes live for the first time in 30+ days
- New creator added to the platform

Implementation approach:
1. In `afrostream-sync.js`, after updating subscriber counts, compare old vs new values
2. If a milestone threshold is crossed, INSERT a row into `as_news` with:
   - `title`: e.g., "Mark Angel Comedy Hits 10M Subscribers!"
   - `category`: "Milestone"
   - `slug`: auto-generated from title
   - `excerpt`: brief description
   - `body`: longer description with context
   - `is_published`: true
   - `is_featured`: true for major milestones (1M+)
   - `published_at`: now
3. Add a `as_milestones` tracking table to avoid duplicate news:
   ```sql
   CREATE TABLE as_milestones (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     creator_id uuid REFERENCES as_creators(id),
     milestone_type text NOT NULL,
     milestone_value bigint,
     created_at timestamptz DEFAULT now()
   );
   ```

## Pending Feature: Admin Analytics Tab

Add an analytics dashboard tab to `tools/afrostream/admin.html`. Options:
- Track page views via a simple `as_page_views` table (log creator profile visits)
- Show: most viewed creators, trending creators (view growth), top countries, platform breakdown
- Chart library: use lightweight vanilla JS (no Chart.js) — SVG bar charts or CSS-only charts
- Time filters: 7d, 30d, 90d

This requires a tracking pixel or lightweight JS snippet on creator.html that POSTs to a new Netlify function `afrostream-track.js`.

## Pending Feature: Community Page

A `tools/afrostream/community.html` page exists as a Netlify function (`afrostream-community.js`) and schema (`supabase/afrostream-community-schema.sql`). These need to be verified and the frontend page built. The community features include:
- Discussion threads about African streaming
- Creator spotlights (community-nominated)
- Upvoting system (uses `as_upvotes` table which already exists)

## Database State (verified Apr 2, 2026)

| Table | Status |
|-------|--------|
| `as_creators` | 30 published creators, all have subscribers/growth_rate/gift_revenue/avatar |
| `as_streams` | Populated with upcoming streams (Apr 2-19, 2026) |
| `as_news` | 15 published articles |
| `as_featured` | Populated |
| `as_submissions` | Exists (for submit.html form) |
| `as_badges` | Exists (AfroPoints system) |
| `as_points_ledger` | Exists (AfroPoints system) |
| `as_points_profiles` | Exists (AfroPoints system) |
| `as_upvotes` | Exists (community voting) |
| `as_settings` | Exists |

Platform URL coverage: 8 YouTube, 11 Twitch, 3 Kick out of 30 creators.
8 creators have NO platform URLs (manual-only: Khaby Lame, Princess Sachiko, Sabinus, etc.)

## Environment Variables (all set on Netlify)

- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — Twitch Helix API
- `KICK_CLIENT_ID` / `KICK_CLIENT_SECRET` — Kick API
- `YOUTUBE_API_KEY` — YouTube Data API v3
- `SUPABASE_SERVICE_ROLE_KEY` — Database writes
- `ADMIN_SECRET` — Admin panel + sync auth

## Key Files Reference

| File | Purpose |
|------|---------|
| `tools/afrostream/index.html` | Homepage — live directory, hero stats, news, calendar preview |
| `tools/afrostream/rankings.html` | Rankings with filters, podium, pagination, URL sync |
| `tools/afrostream/news.html` | News feed with category filters |
| `tools/afrostream/article.html` | Individual article page (reads `?slug=` param) |
| `tools/afrostream/calendar.html` | Stream calendar with month/week/list views, reminders |
| `tools/afrostream/creator.html` | Creator profile — stats, streams, similar creators |
| `tools/afrostream/submit.html` | Creator submission form |
| `tools/afrostream/admin.html` | Admin panel — creators, news, streams, sync, settings tabs |
| `tools/afrostream/style.css` | Shared styles (blue theme, `--as-primary: #007AFF`) |
| `engines/afrostream-engine.js` | Client-side engine — loads data, formats, renders |
| `netlify/functions/afrostream-sync.js` | Twitch + Kick + YouTube sync (cron every 6h) |
| `netlify/functions/afrostream-*.js` | 9 API functions total |
| `tools/afrostream/HANDOFF.md` | Contractor handoff guide |

## Tech Rules (MUST follow)

- Plain HTML + CSS + vanilla JS only. NO React, NO frameworks, NO build tools
- Use `var` not `let`/`const` (project convention for browser compat)
- Brand color: `#007AFF` (blue), fonts: DM Sans (body) + Syne (headings)
- Supabase project: `zpclagtgczsygrgztlts`
- Netlify site: `afrotools` (site ID: `8aa543db-b4bd-4631-98f8-221440055c41`)
- AfroTools has **1,300+ free tools** (never say 600 or 850)
- CORS headers on all Netlify functions (allow afrotools.com, netlify.app, localhost)

## Priority Order

1. **Commit + Deploy** (blocking everything else)
2. **Verify all 7 API endpoints work** on production
3. **Test YouTube sync** — trigger manually, verify subscriber updates
4. **Automated news generation** from milestone detection
5. **Community page** frontend
6. **Admin analytics tab**
