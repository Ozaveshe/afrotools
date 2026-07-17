/**
 * Inactivity/sign-in reminders for AfroTools accounts.
 *
 * Sends at most once every 21 days, skips users who just received the welcome
 * email, and uses Supabase Auth last_sign_in_at as the activity source.
 */
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { isEmailConfigured, sendEmail } = require('./_shared/email-adapter');
const { withScheduledProof } = require('./_shared/scheduled-proof');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;
const SITE_URL = 'https://afrotools.com';
const BATCH_SIZE = 100;
const INACTIVE_DAYS = 14;
const REMINDER_COOLDOWN_DAYS = 21;
const WELCOME_GRACE_DAYS = 6;

exports.handler = withScheduledProof('send-signin-reminders', async function () {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[signin-reminders] Supabase service key missing - skipping');
    return { statusCode: 200, body: 'Skipped: no Supabase service key' };
  }
  if (!isEmailConfigured()) {
    console.log('[signin-reminders] RESEND_API_KEY missing - skipping');
    return { statusCode: 200, body: 'Skipped: no email provider configured' };
  }

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  var now = new Date();
  var { data: profiles, error } = await sb
    .from('profiles')
    .select('id,email,name,email_unsubscribe_token,email_welcome_sent_at,email_last_signin_reminder_at')
    .eq('email_digest_enabled', true)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[signin-reminders] profile fetch failed:', error.message);
    return { statusCode: 500, body: 'Profile fetch failed' };
  }

  var sent = 0;
  var skipped = 0;
  var failed = 0;

  for (var i = 0; i < (profiles || []).length; i++) {
    var profile = profiles[i];
    try {
      if (!eligibleByProfile(profile, now)) {
        skipped++;
        continue;
      }

      var authResult = await sb.auth.admin.getUserById(profile.id);
      var authUser = authResult && authResult.data && authResult.data.user ? authResult.data.user : null;
      if (!authUser || !eligibleByAuthUser(authUser, now)) {
        skipped++;
        continue;
      }

      var token = profile.email_unsubscribe_token || '';
      var unsubscribeUrl = token ? SITE_URL + '/api/email/unsubscribe?token=' + encodeURIComponent(token) : '';
      var message = buildSigninReminder(profile, authUser, unsubscribeUrl);
      var result = await sendEmail(message);
      if (!result.ok) {
        failed++;
        console.error('[signin-reminders] send failed for profile ' + profile.id + ':', result.providerStatus || result.error || 'unknown');
        continue;
      }

      await sb
        .from('profiles')
        .update({ email_last_signin_reminder_at: now.toISOString() })
        .eq('id', profile.id);
      sent++;
      await wait(150);
    } catch (err) {
      failed++;
      console.error('[signin-reminders] error for profile ' + profile.id + ':', err && err.message ? err.message : err);
    }
  }

  var summary = 'Sign-in reminders: sent=' + sent + ', skipped=' + skipped + ', failed=' + failed;
  console.log('[signin-reminders]', summary);
  return { statusCode: 200, body: summary };
});

function eligibleByProfile(profile, now) {
  if (isWithinDays(profile.email_welcome_sent_at, now, WELCOME_GRACE_DAYS)) return false;
  if (isWithinDays(profile.email_last_signin_reminder_at, now, REMINDER_COOLDOWN_DAYS)) return false;
  return true;
}

function eligibleByAuthUser(user, now) {
  var lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  var createdAt = user.created_at ? new Date(user.created_at) : null;
  if (lastSignIn && daysBetween(lastSignIn, now) < INACTIVE_DAYS) return false;
  if (!lastSignIn && createdAt && daysBetween(createdAt, now) < INACTIVE_DAYS) return false;
  return true;
}

function isWithinDays(value, now, days) {
  if (!value) return false;
  var date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  return daysBetween(date, now) < days;
}

function daysBetween(start, end) {
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function firstName(profile) {
  var base = String((profile && profile.name) || '').trim() || String((profile && profile.email) || '').split('@')[0] || 'there';
  return base.split(/\s+/)[0] || 'there';
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSigninReminder(profile, user, unsubscribeUrl) {
  var name = firstName(profile);
  var dashboardUrl = SITE_URL + '/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=signin_reminder';
  var searchUrl = SITE_URL + '/search/?utm_source=resend&utm_medium=email&utm_campaign=signin_reminder';
  var subject = 'Your AfroTools workspace is waiting';
  var lastSeen = user.last_sign_in_at ? 'It has been a little while since your last sign-in.' : 'Your account is ready whenever you want to start.';
  var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#152238;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e3eaf4;border-radius:8px;overflow:hidden;">' +
    '<tr><td style="padding:24px;background:#0f172a;color:#ffffff;">' +
    '<div style="font-size:20px;font-weight:800;">AfroTools</div>' +
    '<div style="font-size:13px;color:#b6c2d6;margin-top:4px;">Your saved tools, reports, and calculations are easier when you sign in.</div>' +
    '</td></tr>' +
    '<tr><td style="padding:24px;font-size:15px;line-height:1.65;color:#24324a;">' +
    '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
    '<p style="margin:0 0 14px;">' + esc(lastSeen) + '</p>' +
    '<p style="margin:0 0 14px;">A good next step is simple: open the dashboard, save the tools you use most, and keep your report trails in one place instead of starting over each time.</p>' +
    '<p style="margin:0 0 14px;">You can also search the full tool directory when you need a calculator, PDF helper, scholarship route, business tool, or country-specific page.</p>' +
    '<p style="margin:24px 0 6px;"><a href="' + esc(dashboardUrl) + '" style="display:inline-block;background:#0f6ddf;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:8px;">Open your dashboard</a></p>' +
    '<p style="margin:12px 0 0;font-size:14px;">Or ' +
    '<a href="' + esc(searchUrl) + '" style="color:#0f6ddf;text-decoration:none;font-weight:700;">find a tool</a>.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e3eaf4;font-size:12px;line-height:1.55;color:#64748b;">' +
    '<div>You are receiving this because AfroTools emails are enabled for your account.</div>' +
    (unsubscribeUrl ? '<div style="margin-top:8px;"><a href="' + esc(unsubscribeUrl) + '" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> from AfroTools emails.</div>' : '') +
    '</td></tr></table></td></tr></table></body></html>';

  var text = [
    subject,
    '',
    'Hi ' + name + ',',
    '',
    lastSeen,
    '',
    'Open the dashboard, save the tools you use most, and keep your report trails in one place instead of starting over each time.',
    '',
    'Dashboard: ' + dashboardUrl,
    'Find a tool: ' + searchUrl,
  ];
  if (unsubscribeUrl) text.push('', 'Unsubscribe: ' + unsubscribeUrl);

  return { to: profile.email, subject: subject, html: html, text: text.join('\n') };
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
