# AfroStream Tracking

AfroStream has three scheduled data lanes.

## Creator Counts

`netlify/functions/afrostream-sync.js` runs from `netlify.toml` every two hours.
It updates creator platform counts, recomputes AfroScore, and writes daily rows to `public.as_creator_snapshots`.

Scheduled invocations use the database-side `public.refresh_afrostream_creator_snapshots()` RPC so the daily snapshot set can be refreshed inside Netlify's scheduled-function execution window. Manual admin sync can still run the platform API refresh first, then call the same RPC. If the RPC is changed, keep `supabase/migrations/040-afrostream-snapshot-refresh-rpc.sql` and the public snapshot endpoint validation in sync.

Manual `POST /api/afrostream/sync` requests now return `202 Accepted` and hand the heavy Twitch, Kick, and YouTube refresh work to `netlify/functions/afrostream-sync-background.js`. This keeps manual admin runs from timing out at the browser or CDN layer while preserving the existing scheduled snapshot refresh path. Use `?mode=inline` only when you explicitly want the request to wait for the full sync result for debugging.

The YouTube lane now uses cached `yt_channel_id` values and defaults to `200` creators per run. Override with:

```text
AFROSTREAM_YOUTUBE_SYNC_BATCH_SIZE=200
```

## Live Streams

`netlify/functions/afrostream-livecheck.js` runs every 30 minutes.
It checks Twitch, Kick, and YouTube live status and writes current stream rows to `public.as_streams`.
Future scheduled streams can also be stored in `public.as_streams` with a future `stream_date`.
When a live check records a positive `viewer_count`, it should also raise `public.as_creators.peak_viewers` without lowering an existing peak. The public creators endpoint additionally derives `stream_count_30d`, current viewers, last stream time, and peak viewers from recent `as_streams` rows so rankings stay useful even before the next full score sync.
The public streams endpoint enriches stream rows with creator avatar, cover, slug, country, and follower context from `public.as_creators`. Calendar cards, live streamer ranking previews, and other stream surfaces should use these fields before falling back to generated preview art.

Live stream thumbnails are user-facing media and must pass the same display policy in code and audits:

- `tools/afrostream/afrostream-media-policy.js` is the shared browser and Node policy for sensitive thumbnail categories or titles.
- `tools/afrostream/rankings-live-media.js` uses raw Twitch, YouTube, or Kick thumbnails only when the policy allows them.
- Policy-hidden or broken thumbnails fall back to generated AfroStream preview art, not a blank card.
- Offline Twitch `live_user_...` preview URLs often resolve to a generic camera placeholder, so recent non-live Twitch rows use generated preview art instead of the stale preview URL.
- Run `npm run afrostream:media:audit` during Live Streamer QA to report missing, broken, or policy-hidden thumbnails. Use `-- --strict` only when you want missing or broken images to fail the command.

## News Mentions

`netlify/functions/afrostream-news-monitor.js` runs daily.
It reads active rows from `public.as_news_sources`, fetches RSS or Atom feeds, matches published AfroStream creator names, writes matching stories into `public.as_news`, and links them through `public.as_news_creator_mentions`.

Ops workflow:

- Maintain sources in the AfroStream admin under the `Ops` tab, or through `GET/POST/PUT/DELETE /api/admin/afrostream/news-sources`.
- Run the monitor manually through the AfroStream admin `Run News Monitor` action, or `POST /api/admin/afrostream/ops/news-monitor`.
- Creator pages should read linked mention rows from `public.as_news_creator_mentions`, not a loose text search over `public.as_news`.
- Manual article creates or updates through `netlify/functions/afrostream-admin.js` now also upsert matching `public.as_news_creator_mentions` rows, so direct AfroStream news publishes do not stay thin by default.

Manual review runs can use dry-run mode before allowing writes:

```text
/.netlify/functions/afrostream-news-monitor?dry_run=1
```

Dry-run mode still fetches active sources and checks published creator names, but it reports matched items, existing news rows, would-insert counts, and skipped weak matches without writing news or mention rows. The monitor uses normalized whole-word or whole-phrase creator matching, ignores very short single-token names, and applies a lightweight editorial relevance gate so generic celebrity or birthday items do not become automated AfroStream news.

RSS sources can also be supplied through:

```text
AFROSTREAM_NEWS_RSS_FEEDS=[{"name":"Source name","feed_url":"https://example.com/feed.xml","category":"creator-news"}]
```

## Community Submissions

Public creator, stream, news-tip, and correction submissions should route through `/tools/afrostream/community`.
`netlify/functions/afrostream-community.js` accepts either common African country names or ISO-style two-letter country codes and normalizes them to the code form used by `public.as_creators` and `public.as_streams`.
Keep `/tools/afrostream/submit` as a simple creator-only legacy route, but prefer the Community Hub in nav and CTAs so users can submit stream schedules and news tips too.

## Supporters And Gifters

Verified supporter rows live in `public.as_creator_supporters`.
The creator page reads this table through `/api/afrostream/creator`.
Do not invent gifter rows from aggregate revenue. Only write rows when a source identifies supporter names or public gift totals.

Aggregate supporter rows are allowed only when the source identifies a public gift total, creator, donor group, and event. Record the aggregate as a source-backed row with a clear `supporter_name`, not as individual named gifters.

Ops workflow:

- Add verified supporter rows in the AfroStream admin `Ops` tab, or through `GET/POST/PUT/DELETE /api/admin/afrostream/supporters`.
- Every supporter row should include the creator, amount, currency, and a source label. Add a source URL whenever one exists.
- If there is no verified supporter evidence, leave the row count at zero. The product should show the empty state, not synthetic gifters.

## Creator Profile Link Audits

Profile links must be source-backed. Do not invent Kick or Twitch URLs from creator names, because handles can point to unrelated people.

Use the audit helper when a profile link looks suspicious:

```text
node scripts/audit-afrostream-creator-links.js --out tmp/afrostream-link-audit/latest.json
```

The script checks public AfroStream creator rows, compares handles against names, slugs, tags, and repeated handles, and flags likely wrong-person URLs. Review flagged rows with public sources before applying Supabase changes.

The May 1, 2026 audit initially checked 408 published creators and 842 profile URLs. It found the Noor Stars Kick URL pointed to `noorgamer`, a separate PUBG/Kick creator, and also surfaced corrected handles for Zain Asaad, Peller, 7amoda Gaming, Mthandeni Mahlaba, Ibn Hattuta Travels, Burna Boy, P-Square, Sabinus, Spice Diana, Zuchu, Titica, Chiraz English, Dr. Hala Samir, Fally Ipupa, Mbosso, L7or, and Angelique Kidjo. After the corrections, the repeat audit checked 837 live profile URLs with zero high-risk or suspect links.
