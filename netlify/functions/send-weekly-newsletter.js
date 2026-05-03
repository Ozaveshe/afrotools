/**
 * Weekly AfroTools email brief.
 *
 * Scheduled from netlify.toml. Sends once per week to opted-in profiles and
 * records profiles.email_last_weekly_at after Resend accepts the message.
 */
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { isEmailConfigured, sendEmail } = require('./_shared/email-adapter');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;
const SITE_URL = 'https://afrotools.com';
const BATCH_SIZE = 100;
const WELCOME_GRACE_DAYS = 3;

exports.handler = async function () {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[weekly-newsletter] Supabase service key missing - skipping');
    return { statusCode: 200, body: 'Skipped: no Supabase service key' };
  }
  if (!isEmailConfigured()) {
    console.log('[weekly-newsletter] RESEND_API_KEY missing - skipping');
    return { statusCode: 200, body: 'Skipped: no email provider configured' };
  }

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  var now = new Date();
  var weekStart = startOfUtcWeek(now);
  var { data: profiles, error } = await sb
    .from('profiles')
    .select('id,email,name,email_unsubscribe_token,email_last_weekly_at,email_welcome_sent_at,country_code,currency')
    .eq('email_digest_enabled', true)
    .eq('email_weekly_enabled', true)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[weekly-newsletter] profile fetch failed:', error.message);
    return { statusCode: 500, body: 'Profile fetch failed' };
  }

  var sent = 0;
  var skipped = 0;
  var failed = 0;

  for (var i = 0; i < (profiles || []).length; i++) {
    var profile = profiles[i];
    if (isWithinDays(profile.email_welcome_sent_at, now, WELCOME_GRACE_DAYS)) {
      skipped++;
      continue;
    }
    if (profile.email_last_weekly_at && new Date(profile.email_last_weekly_at) >= weekStart) {
      skipped++;
      continue;
    }

    try {
      var token = profile.email_unsubscribe_token || '';
      var unsubscribeUrl = token ? SITE_URL + '/api/email/unsubscribe?token=' + encodeURIComponent(token) : '';
      var message = buildWeeklyMessage(profile, unsubscribeUrl);
      var result = await sendEmail(message);
      if (!result.ok) {
        failed++;
        console.error('[weekly-newsletter] send failed for profile ' + profile.id + ':', result.providerStatus || result.error || 'unknown');
        continue;
      }

      await sb
        .from('profiles')
        .update({ email_last_weekly_at: now.toISOString() })
        .eq('id', profile.id);
      sent++;
      await wait(150);
    } catch (err) {
      failed++;
      console.error('[weekly-newsletter] error for profile ' + profile.id + ':', err && err.message ? err.message : err);
    }
  }

  var summary = 'Weekly newsletter: sent=' + sent + ', skipped=' + skipped + ', failed=' + failed;
  console.log('[weekly-newsletter]', summary);
  return { statusCode: 200, body: summary };
};

function startOfUtcWeek(date) {
  var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  var day = d.getUTCDay();
  var diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function isWithinDays(value, now, days) {
  if (!value) return false;
  var date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)) < days;
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

function link(url, label) {
  return '<a href="' + esc(url) + '" style="color:#0f6ddf;text-decoration:none;font-weight:700;">' + esc(label) + '</a>';
}

function buildWeeklyMessage(profile, unsubscribeUrl) {
  var name = firstName(profile);
  var subject = 'This week on AfroTools: tools worth saving';
  var dashboardUrl = SITE_URL + '/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief';
  var searchUrl = SITE_URL + '/search/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief';
  var pdfUrl = SITE_URL + '/pdf/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief';
  var scholarshipUrl = SITE_URL + '/tools/scholarship-finder/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief';
  var kitchenUrl = SITE_URL + '/tools/afrokitchen/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief';

  var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#152238;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #e3eaf4;border-radius:8px;overflow:hidden;">' +
    '<tr><td style="padding:24px;background:#0f172a;color:#ffffff;">' +
    '<div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#93c5fd;font-weight:800;">AfroTools weekly brief</div>' +
    '<div style="font-size:24px;line-height:1.2;font-weight:800;margin-top:8px;">A few useful places to start this week</div>' +
    '</td></tr>' +
    '<tr><td style="padding:24px;font-size:15px;line-height:1.65;color:#24324a;">' +
    '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
    '<p style="margin:0 0 18px;">Here are a few useful AfroTools paths for the week. Pick one job, save it, and let the dashboard keep the thread for you.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    bullet('Return to your workspace', 'Review saved tools, report trails, and recent account work.', dashboardUrl, 'Open dashboard') +
    bullet('Find the right tool faster', 'Search salary, tax, PDF, education, business, travel, food, and country tools.', searchUrl, 'Search tools') +
    bullet('Keep PDF/report downloads connected', 'Use the PDF workspace when you need a repeatable report trail.', pdfUrl, 'Open PDF workspace') +
    bullet('Plan education moves', 'Scholarship Finder helps you keep opportunities and reminders in one place.', scholarshipUrl, 'Open Scholarship Finder') +
    bullet('Cook with local context', 'AfroKitchen brings African recipes, ingredients, and planning tools together.', kitchenUrl, 'Open AfroKitchen') +
    '</table>' +
    '<p style="margin:18px 0 0;color:#475569;">Short, useful, and practical. That is the lane for this weekly email.</p>' +
    '<p style="margin:24px 0 4px;"><a href="' + esc(dashboardUrl) + '" style="display:inline-block;background:#0f6ddf;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:8px;">Open AfroTools</a></p>' +
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
    'Here are a few useful AfroTools paths for the week. Pick one job, save it, and let the dashboard keep the thread for you.',
    '',
    '1. Return to your workspace - ' + dashboardUrl,
    '2. Find the right tool faster - ' + searchUrl,
    '3. Keep PDF/report downloads connected - ' + pdfUrl,
    '4. Plan education moves - ' + scholarshipUrl,
    '5. Cook with local context - ' + kitchenUrl,
    '',
    'Short, useful, and practical. That is the lane for this weekly email.',
  ];
  if (unsubscribeUrl) text.push('', 'Unsubscribe: ' + unsubscribeUrl);

  return { to: profile.email, subject: subject, html: html, text: text.join('\n') };
}

function bullet(title, text, url, cta) {
  return '<tr><td style="padding:14px 0;border-top:1px solid #e3eaf4;">' +
    '<div style="font-size:15px;font-weight:800;color:#152238;margin-bottom:4px;">' + esc(title) + '</div>' +
    '<div style="font-size:14px;line-height:1.55;color:#475569;margin-bottom:6px;">' + esc(text) + '</div>' +
    link(url, cta) +
    '</td></tr>';
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
