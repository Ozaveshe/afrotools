# AfroStream Tracking Methodology

Last updated: May 1, 2026

## Public Product Position

AfroStream should be transparent about the categories and weights behind AfroScore. It should not publish exact anti-gaming thresholds, source reliability penalties, anomaly triggers, or manual-review rules.

## Daily Tracking Model

- `afrostream-sync` runs every two hours and updates `public.as_creators`.
- The same sync job upserts one `public.as_creator_snapshots` row per creator per `snapshot_date`.
- Profile stat arrows compare the current creator value with the previous daily snapshot when one exists.
- When only one snapshot exists, the UI should show an honest flat tracking state such as `Needs next snapshot` or `Tracking daily`.
- `afrostream-livecheck` runs every 30 minutes for stream status.
- `afrostream-news-monitor` runs daily for RSS-style creator mentions.

## Snapshot Fields

`public.as_creator_snapshots` is the source of truth for daily movement:

- `total_followers`
- `yt_subscribers`
- `twitch_followers`
- `kick_followers`
- `tiktok_followers`
- `ig_followers`
- `total_views`
- `afro_score`
- `net_worth_value`
- `stream_cadence`
- `stream_count_30d`
- `source_status`
- `source_quality`

## AfroScore Weights

- Total followers: 25%
- Total views: 20%
- Growth: 20%
- Streaming consistency: 15%
- Engagement: 10%
- Multi-platform presence: 10%

## Source Pages

- `/tools/afrostream/methodology/`
- `/tools/afrostream/afroscore/`
