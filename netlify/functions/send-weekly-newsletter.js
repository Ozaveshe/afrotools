/**
 * Weekly AfroTools email brief.
 *
 * Scheduled from netlify.toml. Sends once per week to opted-in profiles and
 * records profiles.email_last_weekly_at after Resend accepts the message.
 */
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { isEmailConfigured, sendEmail } = require('./_shared/email-adapter');
const { buildEmailShell } = require('./_shared/lifecycle-email');
const { withScheduledProof } = require('./_shared/scheduled-proof');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;
const SITE_URL = 'https://afrotools.com';
const BATCH_SIZE = 100;
const WELCOME_GRACE_DAYS = 3;

exports.handler = withScheduledProof('send-weekly-newsletter', async function () {
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
  var recentWelcomeCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  var { data: profiles, error } = await sb
    .from('profiles')
    .select('id,email,name,email_unsubscribe_token,email_last_weekly_at,email_welcome_sent_at,email_activity_milestone_sent_at,country_code,currency')
    .eq('email_digest_enabled', true)
    .eq('email_weekly_enabled', true)
    .or('email_activity_milestone_sent_at.not.is.null,email_welcome_sent_at.gte.' + recentWelcomeCutoff)
    .not('email', 'is', null)
    .order('email_last_weekly_at', { ascending: true, nullsFirst: true })
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
});

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

function isoWeekNumber(date) {
  var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  var day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function weeklyEdition(profile, date) {
  var dashboardUrl = SITE_URL + '/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief&utm_content=saved_work';
  var searchUrl = SITE_URL + '/search/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief&utm_content=tool_discovery';
  var pdfUrl = SITE_URL + '/pdf/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief&utm_content=report_workflow';
  var countriesUrl = SITE_URL + '/countries/?utm_source=resend&utm_medium=email&utm_campaign=weekly_brief&utm_content=country_context';
  var countryCode = String(profile && profile.country_code || '').trim().toUpperCase();
  var editions = [
    {
      id: 'saved_work',
      subject: 'One useful AfroTools habit for this week',
      preview: 'Save one tool you expect to use again and keep the work trail together.',
      heading: 'Make one useful tool easy to return to',
      body: 'Choose one calculator, report, checklist, or workspace you genuinely expect to reuse. Saving that path now means your next visit starts with context instead of another search.',
      note: 'One saved path is enough. This is about continuity, not building a crowded dashboard.',
      cta: 'Review your saved work',
      url: dashboardUrl,
    },
    {
      id: 'country_context',
      subject: countryCode ? 'Start with tools for ' + countryCode : 'Start with your local context',
      preview: 'Country and currency context make practical calculations less generic.',
      heading: 'Use the local version before the generic one',
      body: countryCode
        ? 'Your profile is set to ' + countryCode + '. Start from the country directory when tax, salary, business, education, transport, or cost assumptions depend on where you are.'
        : 'Set your country and currency before using tools where tax, salary, business, education, transport, or cost assumptions depend on location.',
      note: 'Always confirm changing rates, rules, and deadlines from the source shown on the tool.',
      cta: 'Explore country tools',
      url: countriesUrl,
    },
    {
      id: 'report_workflow',
      subject: 'Turn one-off downloads into a work trail',
      preview: 'Keep the reason, inputs, and next step connected to the report.',
      heading: 'A report is more useful when its context survives',
      body: 'When you create a PDF or report, keep the source tool, assumptions, and next action together. That makes review, comparison, and handoff much easier than storing an unexplained file.',
      note: 'Sensitive document content stays local unless a workflow clearly asks for consent to send it.',
      cta: 'Open the PDF workspace',
      url: pdfUrl,
    },
    {
      id: 'tool_discovery',
      subject: 'Find the right AfroTools workflow faster',
      preview: 'Start with the job you need done, then choose the most specific tool.',
      heading: 'Search by the job, not the feature list',
      body: 'Describe the practical outcome first: check take-home pay, compare a cost, prepare a document, plan a deadline, or understand a local rule. The most specific tool is usually better than a broad calculator.',
      note: 'If a tool depends on changing data, check its source date and confidence note before relying on the result.',
      cta: 'Find a tool',
      url: searchUrl,
    },
  ];
  return editions[isoWeekNumber(date) % editions.length];
}

function buildWeeklyMessage(profile, unsubscribeUrl, now) {
  var name = firstName(profile);
  var edition = weeklyEdition(profile, now || new Date());
  var bodyHtml =
    '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
    '<p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f6ddf;">This week&apos;s practical brief</p>' +
    '<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#152238;">' + esc(edition.heading) + '</h1>' +
    '<p style="margin:0 0 14px;">' + esc(edition.body) + '</p>' +
    '<p style="margin:0;color:#64748b;font-size:13px;">' + esc(edition.note) + '</p>';
  var html = buildEmailShell(
    edition.subject,
    edition.preview,
    bodyHtml,
    edition.cta,
    edition.url,
    unsubscribeUrl
  );

  var text = [
    edition.subject,
    '',
    'Hi ' + name + ',',
    '',
    edition.heading,
    '',
    edition.body,
    '',
    edition.note,
    '',
    edition.cta + ': ' + edition.url,
  ];
  if (unsubscribeUrl) text.push('', 'Unsubscribe: ' + unsubscribeUrl);

  return {
    to: profile.email,
    subject: edition.subject,
    html: html,
    text: text.join('\n'),
    marketing: true,
    unsubscribeUrl: unsubscribeUrl,
    tags: [
      { name: 'email_type', value: 'weekly_brief' },
      { name: 'email_stream', value: 'newsletter' },
      { name: 'email_edition', value: edition.id },
    ],
  };
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

module.exports.buildWeeklyMessage = buildWeeklyMessage;
module.exports.isoWeekNumber = isoWeekNumber;
module.exports.weeklyEdition = weeklyEdition;
