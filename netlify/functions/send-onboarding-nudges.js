/**
 * Account activation nudges for users who signed up but have not started.
 *
 * Daily scheduled function. Sends once per profile after a short welcome grace
 * period, only when the account has no meaningful workspace activity.
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
const ACCOUNT_AGE_DAYS = 3;
const WELCOME_GRACE_DAYS = 3;

exports.handler = async function () {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[onboarding-nudges] Supabase service key missing - skipping');
    return { statusCode: 200, body: 'Skipped: no Supabase service key' };
  }
  if (!isEmailConfigured()) {
    console.log('[onboarding-nudges] RESEND_API_KEY missing - skipping');
    return { statusCode: 200, body: 'Skipped: no email provider configured' };
  }

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  var now = new Date();
  var accountCutoff = daysAgo(now, ACCOUNT_AGE_DAYS).toISOString();

  var { data: profiles, error } = await sb
    .from('profiles')
    .select('id,email,name,created_at,onboarding_completed,country_code,currency,email_unsubscribe_token,email_welcome_sent_at,email_onboarding_nudge_sent_at')
    .eq('email_digest_enabled', true)
    .is('email_onboarding_nudge_sent_at', null)
    .not('email', 'is', null)
    .lte('created_at', accountCutoff)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[onboarding-nudges] profile fetch failed:', error.message);
    return { statusCode: 500, body: 'Profile fetch failed' };
  }

  var sent = 0;
  var skipped = 0;
  var failed = 0;

  for (var i = 0; i < (profiles || []).length; i++) {
    var profile = profiles[i];
    try {
      if (profile.onboarding_completed || isWithinDays(profile.email_welcome_sent_at, now, WELCOME_GRACE_DAYS)) {
        skipped++;
        continue;
      }

      var active = await hasMeaningfulActivity(sb, profile.id);
      if (active) {
        skipped++;
        continue;
      }

      var token = profile.email_unsubscribe_token || '';
      var unsubscribeUrl = token ? SITE_URL + '/api/email/unsubscribe?token=' + encodeURIComponent(token) : '';
      var result = await sendLifecycleEmail('onboarding_nudge', {
        email: profile.email,
        name: profile.name || '',
        unsubscribeUrl: unsubscribeUrl,
      });

      if (!result.ok) {
        failed++;
        console.error('[onboarding-nudges] send failed for profile ' + profile.id + ':', result.providerStatus || result.error || 'unknown');
        continue;
      }

      await sb
        .from('profiles')
        .update({ email_onboarding_nudge_sent_at: now.toISOString() })
        .eq('id', profile.id);
      sent++;
      await wait(150);
    } catch (err) {
      failed++;
      console.error('[onboarding-nudges] error for profile ' + profile.id + ':', err && err.message ? err.message : err);
    }
  }

  var summary = 'Onboarding nudges: sent=' + sent + ', skipped=' + skipped + ', failed=' + failed;
  console.log('[onboarding-nudges]', summary);
  return { statusCode: 200, body: summary };
};

async function hasMeaningfulActivity(sb, userId) {
  var checks = [
    { table: 'calculation_history', column: 'user_id' },
    { table: 'favorites', column: 'user_id' },
    { table: 'saved_calculations', column: 'user_id' },
    { table: 'saved_tools', column: 'user_id' },
    { table: 'workspace_items', column: 'user_id' },
    { table: 'contributions', column: 'user_id' },
  ];

  for (var i = 0; i < checks.length; i++) {
    var check = checks[i];
    var result = await sb
      .from(check.table)
      .select('id', { count: 'exact', head: true })
      .eq(check.column, userId);
    if (result && result.count > 0) return true;
  }
  return false;
}

function daysAgo(now, days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
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
