-- Keep AfroStream daily snapshot refresh inside Postgres so scheduled functions
-- can finish within Netlify's short cron execution window.

CREATE OR REPLACE FUNCTION public.refresh_afrostream_creator_snapshots(
  p_snapshot_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scored integer := 0;
  v_snapshots integer := 0;
BEGIN
  CREATE TEMP TABLE tmp_afrostream_snapshot_refresh ON COMMIT DROP AS
  WITH stream_counts AS (
    SELECT
      lower(trim(creator_name)) AS creator_key,
      count(*)::integer AS stream_count_30d
    FROM public.as_streams
    WHERE is_published = true
      AND stream_date >= (now() - interval '30 days')
    GROUP BY lower(trim(creator_name))
  ),
  previous_snapshots AS (
    SELECT creator_id, total_followers
    FROM public.as_creator_snapshots
    WHERE snapshot_date = (p_snapshot_date - interval '7 days')::date
  ),
  base AS (
    SELECT
      c.id AS creator_id,
      c.name,
      greatest(
        coalesce(c.subscribers, 0),
        coalesce(c.yt_subscribers, 0)
          + coalesce(c.twitch_followers, 0)
          + coalesce(c.kick_followers, 0)
          + coalesce(c.tiktok_followers, 0)
          + coalesce(c.ig_followers, 0)
          + coalesce(c.fb_followers, 0)
      )::bigint AS total_followers,
      coalesce(c.yt_subscribers, 0)::bigint AS yt_subscribers,
      coalesce(c.twitch_followers, 0)::bigint AS twitch_followers,
      coalesce(c.kick_followers, 0)::bigint AS kick_followers,
      coalesce(c.tiktok_followers, 0)::bigint AS tiktok_followers,
      coalesce(c.ig_followers, 0)::bigint AS ig_followers,
      greatest(coalesce(c.total_views, 0), coalesce(c.yt_views, 0))::bigint AS total_views,
      c.net_worth,
      coalesce(c.frequency, '') AS stream_cadence,
      coalesce(sc.stream_count_30d, 0)::integer AS stream_count_30d,
      coalesce(ps.total_followers, 0)::numeric AS previous_followers,
      (
        (CASE WHEN c.youtube_url IS NOT NULL AND c.youtube_url <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN c.twitch_url IS NOT NULL AND c.twitch_url <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN c.kick_url IS NOT NULL AND c.kick_url <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN c.tiktok_url IS NOT NULL AND c.tiktok_url <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN c.instagram_url IS NOT NULL AND c.instagram_url <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN c.twitter_url IS NOT NULL AND c.twitter_url <> '' THEN 1 ELSE 0 END)
      )::numeric AS platform_count
    FROM public.as_creators c
    LEFT JOIN stream_counts sc ON sc.creator_key = lower(trim(c.name))
    LEFT JOIN previous_snapshots ps ON ps.creator_id = c.id
    WHERE c.is_published = true
  ),
  parsed AS (
    SELECT
      b.*,
      CASE
        WHEN b.previous_followers > 0 AND b.total_followers > 0
          THEN greatest(-100, least(500, ((b.total_followers::numeric - b.previous_followers) / b.previous_followers) * 100))
        ELSE 0
      END AS growth_pct,
      CASE
        WHEN nullif(regexp_replace(lower(coalesce(b.net_worth, '')), '[$,\s]', '', 'g'), '') ~ '^[0-9]+(\.[0-9]+)?[bmk]?$'
          THEN regexp_replace(regexp_replace(lower(coalesce(b.net_worth, '')), '[$,\s]', '', 'g'), '[bmk]$', '', 'g')::numeric
            * CASE
                WHEN regexp_replace(lower(coalesce(b.net_worth, '')), '[$,\s]', '', 'g') LIKE '%b' THEN 1000000000
                WHEN regexp_replace(lower(coalesce(b.net_worth, '')), '[$,\s]', '', 'g') LIKE '%m' THEN 1000000
                WHEN regexp_replace(lower(coalesce(b.net_worth, '')), '[$,\s]', '', 'g') LIKE '%k' THEN 1000
                ELSE 1
              END
        ELSE NULL
      END AS net_worth_value
    FROM base b
  ),
  scored AS (
    SELECT
      p.*,
      greatest(0, least(100, round(
        (CASE WHEN p.total_followers > 0 THEN least(100, round((ln(p.total_followers::numeric) / ln(200000000::numeric)) * 100)) ELSE 0 END) * 0.25
        + (CASE WHEN p.total_views > 0 THEN least(100, round((ln(p.total_views::numeric) / ln(10000000000::numeric)) * 100)) ELSE 0 END) * 0.20
        + least(100, greatest(0, p.growth_pct * 5)) * 0.20
        + least(100, p.stream_count_30d * 10) * 0.15
        + (CASE
            WHEN p.total_followers > 0 AND p.total_views > 0
              THEN greatest(0, least(100, round((ln((p.total_views::numeric / p.total_followers::numeric)) / ln(100::numeric)) * 100)))
            ELSE 0
          END) * 0.10
        + least(100, round((p.platform_count / 4) * 100)) * 0.10
      )))::smallint AS afro_score
    FROM parsed p
  )
  SELECT
    creator_id,
    name,
    total_followers,
    yt_subscribers,
    twitch_followers,
    kick_followers,
    tiktok_followers,
    ig_followers,
    total_views,
    round(growth_pct, 2)::numeric AS growth_pct,
    net_worth_value,
    stream_cadence,
    stream_count_30d,
    afro_score,
    CASE
      WHEN afro_score >= 80 THEN 'legend'
      WHEN afro_score >= 60 THEN 'elite'
      WHEN afro_score >= 40 THEN 'established'
      WHEN afro_score >= 20 THEN 'trending'
      ELSE 'rising'
    END AS afro_tier,
    CASE WHEN total_followers > 0 OR total_views > 0 THEN 80 ELSE 50 END::smallint AS source_quality
  FROM scored;

  UPDATE public.as_creators c
  SET
    total_followers = r.total_followers,
    afro_score = r.afro_score,
    afro_tier = r.afro_tier,
    growth_pct = r.growth_pct,
    updated_at = now()
  FROM tmp_afrostream_snapshot_refresh r
  WHERE c.id = r.creator_id;

  GET DIAGNOSTICS v_scored = ROW_COUNT;

  INSERT INTO public.as_creator_snapshots (
    creator_id,
    total_followers,
    yt_subscribers,
    twitch_followers,
    kick_followers,
    tiktok_followers,
    ig_followers,
    total_views,
    afro_score,
    snapshot_date,
    net_worth_value,
    stream_cadence,
    stream_count_30d,
    source_status,
    source_quality
  )
  SELECT
    creator_id,
    total_followers,
    yt_subscribers,
    twitch_followers,
    kick_followers,
    tiktok_followers,
    ig_followers,
    total_views,
    afro_score,
    p_snapshot_date,
    net_worth_value,
    stream_cadence,
    stream_count_30d,
    'automated',
    source_quality
  FROM tmp_afrostream_snapshot_refresh
  ON CONFLICT (creator_id, snapshot_date) DO UPDATE SET
    total_followers = EXCLUDED.total_followers,
    yt_subscribers = EXCLUDED.yt_subscribers,
    twitch_followers = EXCLUDED.twitch_followers,
    kick_followers = EXCLUDED.kick_followers,
    tiktok_followers = EXCLUDED.tiktok_followers,
    ig_followers = EXCLUDED.ig_followers,
    total_views = EXCLUDED.total_views,
    afro_score = EXCLUDED.afro_score,
    net_worth_value = EXCLUDED.net_worth_value,
    stream_cadence = EXCLUDED.stream_cadence,
    stream_count_30d = EXCLUDED.stream_count_30d,
    source_status = EXCLUDED.source_status,
    source_quality = EXCLUDED.source_quality;

  GET DIAGNOSTICS v_snapshots = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'snapshot_date', p_snapshot_date,
    'scored', v_scored,
    'snapshots', v_snapshots
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_afrostream_creator_snapshots(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_afrostream_creator_snapshots(date) TO service_role;
