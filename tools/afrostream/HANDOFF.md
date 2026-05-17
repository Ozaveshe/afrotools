# AfroStream - Contractor Handoff Guide

## Overview
AfroStream is a discovery hub for African creators and live streamers at `afrotools.com/tools/afrostream/`. It aggregates creator data from Twitch, Kick, YouTube, TikTok, Instagram, Rumble, streams, rankings, and news.

## Product Lanes
- **Creator Reach**: all published creators ranked by AfroScore, cross-platform followers, views, growth, consistency, engagement, and platform presence.
- **Live Streamers**: creators with recent stream activity or Twitch/Kick focus ranked by stream count, live status, peak viewers, and live-platform focus.
- **Live Now**: current live streams from `as_streams`.
- **Creator News**: AfroStream editorial and milestone coverage.

Keep these lanes separate in copy, UI, and ranking logic. Do not treat a mega-creator follower ranking as the same product as a live-streamer activity ranking.

## Daily Tasks
- Check **Admin Panel** (`/tools/afrostream/admin.html`) — review pending submissions, approve or reject
- Review any auto-flagged milestone news (when implemented)
- Check the Sync tab - verify last sync ran successfully
- Confirm `/api/afrostream/snapshots` has a new row set after sync. Creator week/month ranking needs at least two snapshot dates before it can show period movement honestly.

## Weekly Tasks
- Write 2-3 **news articles** about the African streaming scene (Milestones, Platform Updates, Collabs, Rising Stars, Business, Drama)
- Update **TikTok and Instagram** follower counts manually (no API available)
- Add any **upcoming streams** to the calendar via admin
- Check for new creators to add (see sources below)

## Monthly Tasks
- Add newly discovered creators via Admin > Creators tab
- Review and update **net worth estimates**
- Check for API changes (Twitch/Kick deprecations)
- Review rankings accuracy - are scores reflecting reality?
- Check whether Creator Reach and Live Streamer leaders are diverging in a useful way. If not, inspect stream linkage and follower fields before changing the UI.

## Key URLs
| Page | URL |
|------|-----|
| Homepage | `/tools/afrostream/` |
| Rankings | `/tools/afrostream/rankings.html` |
| News | `/tools/afrostream/news.html` |
| Calendar | `/tools/afrostream/calendar.html` |
| Creator Profiles | `/tools/afrostream/creator.html?id={slug}` |
| Submit Form | `/tools/afrostream/submit.html` |
| Admin Panel | `/tools/afrostream/admin.html` |
| RSS Feed | `/tools/afrostream/feed.xml` |

## API Sync
- **Automatic**: Full sync runs every 2 hours via Netlify Scheduled Function (`afrostream-sync.js`)
- **Live checks**: `afrostream-livecheck.js` runs every 30 minutes to refresh Twitch, Kick, and YouTube live status
- **Manual**: Admin Panel > Sync tab > "Sync Now" button
- **Direct API**: `POST /api/afrostream/sync` with `Authorization: Bearer {ADMIN_SECRET}`
- Syncs: Twitch follower counts + live status, Kick follower counts + live status, YouTube subscriber counts + live status
- YouTube sync uses YouTube Data API v3 (configured)
- Sync writes `as_creator_snapshots` daily with `on_conflict=creator_id,snapshot_date`. If a Supabase write fails, the sync must report the error in `results.errors`; do not silently pass partial writes.
- `afrostream-sync.js` and `afrostream-livecheck.js` must write first-party health rows to `public.scraper_runs` with `scraper_id` values `afrostream-sync` and `afrostream-livecheck` so automation can distinguish stale cron runs from stale product data.
- When recomputing totals, preserve the larger of platform follower totals and the existing `subscribers` count so incomplete platform fields do not overwrite rankings to zero.

## Live Media QA

- `public.as_streams.thumbnail` is the first source of truth for Live Streamers imagery.
- `tools/afrostream/afrostream-media-policy.js` is shared by the browser and Node audit. Update it when a new sensitive stream category or title pattern should use generated preview art.
- The rankings page should never show a blank live media well. If a thumbnail is missing, broken, or policy-hidden, `rankings-live-media.js` must render generated AfroStream preview art.
- Recent non-live Twitch `live_user_...` thumbnails should also render generated art because Twitch commonly swaps them to a generic camera placeholder after the stream ends.
- Run `npm run afrostream:media:audit` before calling live media QA done. Add `-- --endpoint=<url>` to point it at another preview, and `-- --strict` when missing or broken thumbnails should fail.

## Public API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/afrostream/creators?country=&category=&platform=&sort=&limit=` | List creators |
| `GET /api/afrostream/snapshots?period=&limit=` | Creator ranking snapshots for period-aware ranking |
| `GET /api/afrostream/news?category=&featured=&limit=&slug=` | List/get news |
| `GET /api/afrostream/streams?live=&platform=&limit=` | List streams |
| `GET /api/afrostream/featured` | Featured creators |
| `GET /api/afrostream/creator?slug={slug}` | Single creator profile + streams + similar |
| `GET /api/afrostream/og?name=&subs=&country=&category=` | Dynamic OG image |

## Database
- **Supabase project**: `zpclagtgczsygrgztlts`
- Tables: `as_creators`, `as_streams`, `as_news`, `as_featured`, `as_creator_snapshots`
- RLS enabled: public read for `is_published=true`, writes need service role key
- `as_creator_snapshots` should have one row per creator per date, a unique `(creator_id, snapshot_date)` index, public read policy, and service-role write policy.
- `as_featured` currently does not include an `is_active` column. Do not filter `/api/afrostream/featured` with `is_active=eq.true` unless the column is added in a migration.

## Environment Variables (Netlify)
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — Twitch Helix API
- `KICK_CLIENT_ID` / `KICK_CLIENT_SECRET` — Kick API
- `YOUTUBE_API_KEY` — YouTube Data API v3
- `SUPABASE_SERVICE_ROLE_KEY` — For database writes
- `ADMIN_SECRET` — Admin panel + sync auth token

## Where to Find News
- Twitter/X: @carterefe, @shankcomics, @paboranking, African gaming/streaming accounts
- Pulse Nigeria, TechPoint Africa, TechCabal, Guardian NG
- CNN Africa, BBC Africa (streaming/creator stories)
- r/africanstreamers, Twitch Africa Discord
- Kick.com trending African creators

## Tech Stack
- Plain HTML/CSS/vanilla JS (no frameworks)
- Netlify hosting + functions
- Supabase PostgreSQL
- Brand color: #007AFF (Apple Blue)
- Fonts: DM Sans throughout
