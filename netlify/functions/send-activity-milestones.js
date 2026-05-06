/**
 * First meaningful activity milestone email.
 *
 * Daily scheduled function. It watches real activity tables and sends one
 * encouragement email after the user creates a calculation, favorite, saved
 * tool, workspace item, saved calculation, or contribution.
 */
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { isEmailConfigured } = require('./_shared/email-adapter');
const { sendLifecycleEmail } = require('./_shared/lifecycle-email');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;
const SITE_URL = 'https://afrotools.com';
const BATCH_SIZE = 100;
const ACTION_LOOKBACK_DAYS = 10;
const MIN_ACTIVITY_AGE_HOURS = 1;
const WELCOME_GRACE_DAYS = 1;

exports.handler = async function () {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[activity-milestones] Supabase service key missing - skipping');
    return { statusCode: 200, body: 'Skipped: no Supabase service key' };
  }
  if (!isEmailConfigured()) {
    console.log('[activity-milestones] RESEND_API_KEY missing - skipping');
    return { statusCode: 200, body: 'Skipped: no email provider configured' };
  }

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  var now = new Date();

  var { data: profiles, error } = await sb
    .from('profiles')
    .select('id,email,name,email_unsubscribe_token,email_welcome_sent_at,email_activity_milestone_sent_at')
    .eq('email_digest_enabled', true)
    .is('email_activity_milestone_sent_at', null)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[activity-milestones] profile fetch failed:', error.message);
    return { statusCode: 500, body: 'Profile fetch failed' };
  }

  var sent = 0;
  var skipped = 0;
  var failed = 0;

  for (var i = 0; i < (profiles || []).length; i++) {
    var profile = profiles[i];
    try {
      if (isWithinDays(profile.email_welcome_sent_at, now, WELCOME_GRACE_DAYS)) {
        skipped++;
        continue;
      }

      var activity = await latestMeaningfulActivity(sb, profile.id, now);
      if (!activity) {
        skipped++;
        continue;
      }

      var token = profile.email_unsubscribe_token || '';
      var unsubscribeUrl = token ? SITE_URL + '/api/email/unsubscribe?token=' + encodeURIComponent(token) : '';
      var result = await sendLifecycleEmail('activity_milestone', {
        email: profile.email,
        name: profile.name || '',
        activityType: activity.type,
        activityTitle: activity.title,
        toolSlug: activity.toolSlug,
        unsubscribeUrl: unsubscribeUrl,
      });

      if (!result.ok) {
        failed++;
        console.error('[activity-milestones] send failed for profile ' + profile.id + ':', result.providerStatus || result.error || 'unknown');
        continue;
      }

      await sb
        .from('profiles')
        .update({ email_activity_milestone_sent_at: now.toISOString() })
        .eq('id', profile.id);
      sent++;
      await wait(150);
    } catch (err) {
      failed++;
      console.error('[activity-milestones] error for profile ' + profile.id + ':', err && err.message ? err.message : err);
    }
  }

  var summary = 'Activity milestones: sent=' + sent + ', skipped=' + skipped + ', failed=' + failed;
  console.log('[activity-milestones]', summary);
  return { statusCode: 200, body: summary };
};

async function latestMeaningfulActivity(sb, userId, now) {
  var since = new Date(now.getTime() - ACTION_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  var maxTime = new Date(now.getTime() - MIN_ACTIVITY_AGE_HOURS * 60 * 60 * 1000).toISOString();
  var sources = [
    {
      table: 'calculation_history',
      dateColumn: 'created_at',
      select: 'tool_slug,tool_name,created_at',
      map: function (row) {
        return { type: 'calculation', title: row.tool_name || row.tool_slug || 'a calculation', toolSlug: row.tool_slug, at: row.created_at };
      },
    },
    {
      table: 'favorites',
      dateColumn: 'created_at',
      select: 'tool_id,created_at',
      map: function (row) {
        return { type: 'favorite', title: row.tool_id || 'a saved favorite', toolSlug: row.tool_id, at: row.created_at };
      },
    },
    {
      table: 'saved_calculations',
      dateColumn: 'created_at',
      select: 'tool_id,created_at',
      map: function (row) {
        return { type: 'saved_calculation', title: row.tool_id || 'a saved calculation', toolSlug: row.tool_id, at: row.created_at };
      },
    },
    {
      table: 'saved_tools',
      dateColumn: 'saved_at',
      select: 'tool_slug,tool_name,saved_at',
      map: function (row) {
        return { type: 'saved_tool', title: row.tool_name || row.tool_slug || 'a saved tool', toolSlug: row.tool_slug, at: row.saved_at };
      },
    },
    {
      table: 'workspace_items',
      dateColumn: 'updated_at',
      select: 'item_type,tool_slug,title,updated_at',
      map: function (row) {
        return { type: row.item_type || 'workspace_item', title: row.title || row.tool_slug || 'a workspace item', toolSlug: row.tool_slug, at: row.updated_at };
      },
    },
    {
      table: 'contributions',
      dateColumn: 'submitted_at',
      select: 'data_category,country_code,submitted_at',
      map: function (row) {
        return { type: 'contribution', title: (row.data_category || 'local data') + (row.country_code ? ' in ' + row.country_code : ''), toolSlug: 'afropoints', at: row.submitted_at };
      },
    },
  ];

  var latest = null;
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    var result = await sb
      .from(source.table)
      .select(source.select)
      .eq('user_id', userId)
      .gte(source.dateColumn, since)
      .lte(source.dateColumn, maxTime)
      .order(source.dateColumn, { ascending: false })
      .limit(1);

    if (result.error || !result.data || !result.data[0]) continue;
    var mapped = source.map(result.data[0]);
    if (!latest || new Date(mapped.at) > new Date(latest.at)) latest = mapped;
  }
  return latest;
}

function isWithinDays(value, now, days) {
  if (!value) return false;
  var date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)) < days;
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
