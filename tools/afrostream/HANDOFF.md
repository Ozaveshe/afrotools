# AfroStream — Contractor Handoff Guide

## Overview
AfroStream is a discovery hub for African live streamers at `afrotools.com/tools/afrostream/`. It aggregates creator data from Twitch, Kick, and YouTube (manual for TikTok/Instagram).

## Daily Tasks
- Check **Admin Panel** (`/tools/afrostream/admin.html`) — review pending submissions, approve or reject
- Review any auto-flagged milestone news (when implemented)
- Check the Sync tab — verify last sync ran successfully

## Weekly Tasks
- Write 2-3 **news articles** about the African streaming scene (Milestones, Platform Updates, Collabs, Rising Stars, Business, Drama)
- Update **TikTok and Instagram** follower counts manually (no API available)
- Add any **upcoming streams** to the calendar via admin
- Check for new creators to add (see sources below)

## Monthly Tasks
- Add newly discovered creators via Admin > Creators tab
- Review and update **net worth estimates**
- Check for API changes (Twitch/Kick deprecations)
- Review rankings accuracy — are scores reflecting reality?

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

## Public API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/afrostream/creators?country=&category=&platform=&sort=&limit=` | List creators |
| `GET /api/afrostream/news?category=&featured=&limit=&slug=` | List/get news |
| `GET /api/afrostream/streams?live=&platform=&limit=` | List streams |
| `GET /api/afrostream/featured` | Featured creators |
| `GET /api/afrostream/creator?slug={slug}` | Single creator profile + streams + similar |
| `GET /api/afrostream/og?name=&subs=&country=&category=` | Dynamic OG image |

## Database
- **Supabase project**: `zpclagtgczsygrgztlts`
- Tables: `as_creators`, `as_streams`, `as_news`, `as_featured`
- RLS enabled: public read for `is_published=true`, writes need service role key

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
- Fonts: DM Sans (body), Syne (headings)
