/**
 * PDF/report lead follow-up.
 *
 * Daily scheduled function. Sends once to opted-in report/download leads after
 * the immediate lead welcome has had time to land.
 */
const { createClient } = require('@supabase/supabase-js');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { isEmailConfigured } = require('./_shared/email-adapter');
const { sendLifecycleEmail } = require('./_shared/lifecycle-email');
const { withScheduledProof } = require('./_shared/scheduled-proof');

const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const SUPABASE_URL = MARKETING_SUPABASE.url;
const SUPABASE_SERVICE_KEY = MARKETING_SUPABASE.serviceKey;
const SITE_URL = 'https://afrotools.com';
const BATCH_SIZE = 100;
const FOLLOWUP_DELAY_DAYS = 2;

exports.handler = withScheduledProof('send-lead-followups', async function () {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[lead-followups] Supabase service key missing - skipping');
    return { statusCode: 200, body: 'Skipped: no Supabase service key' };
  }
  if (!isEmailConfigured()) {
    console.log('[lead-followups] RESEND_API_KEY missing - skipping');
    return { statusCode: 200, body: 'Skipped: no email provider configured' };
  }

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  var now = new Date();
  var cutoff = new Date(now.getTime() - FOLLOWUP_DELAY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  var { data: leads, error } = await sb
    .from('email_leads')
    .select('id,email,name,tool_slug,email_unsubscribe_token,first_email_sent_at,email_followup_sent_at,email_status')
    .eq('opt_in_digest', true)
    .is('email_followup_sent_at', null)
    .not('first_email_sent_at', 'is', null)
    .lte('first_email_sent_at', cutoff)
    .order('first_email_sent_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[lead-followups] lead fetch failed:', error.message);
    return { statusCode: 500, body: 'Lead fetch failed' };
  }

  var sent = 0;
  var skipped = 0;
  var failed = 0;

  for (var i = 0; i < (leads || []).length; i++) {
    var lead = leads[i];
    try {
      if (lead.email_status === 'unsubscribed') {
        skipped++;
        continue;
      }
      if (await hasAccountProfile(sb, lead.email)) {
        skipped++;
        continue;
      }

      var token = lead.email_unsubscribe_token || '';
      var unsubscribeUrl = token ? SITE_URL + '/api/email/unsubscribe?lead_token=' + encodeURIComponent(token) : '';
      var result = await sendLifecycleEmail('pdf_lead_followup', {
        email: lead.email,
        name: lead.name || '',
        toolSlug: lead.tool_slug || '',
        unsubscribeUrl: unsubscribeUrl,
      });

      if (!result.ok) {
        failed++;
        await markLead(sb, lead.id, {
          email_status: result.providerStatus || 'followup_not_sent',
          email_error: String(result.error || '').slice(0, 500),
        });
        console.error('[lead-followups] send failed for lead ' + lead.id + ':', result.providerStatus || result.error || 'unknown');
        continue;
      }

      await markLead(sb, lead.id, {
        email_followup_sent_at: now.toISOString(),
        last_email_sent_at: now.toISOString(),
        email_status: 'followup_sent',
        email_error: null,
      });
      sent++;
      await wait(150);
    } catch (err) {
      failed++;
      console.error('[lead-followups] error for lead ' + lead.id + ':', err && err.message ? err.message : err);
    }
  }

  var summary = 'Lead follow-ups: sent=' + sent + ', skipped=' + skipped + ', failed=' + failed;
  console.log('[lead-followups]', summary);
  return { statusCode: 200, body: summary };
});

async function hasAccountProfile(sb, email) {
  var result = await sb
    .from('profiles')
    .select('id,email_digest_enabled,email_welcome_sent_at')
    .eq('email', String(email || '').toLowerCase())
    .limit(1);
  return !!(result && result.data && result.data[0]);
}

async function markLead(sb, leadId, patch) {
  return sb
    .from('email_leads')
    .update(Object.assign({ updated_at: new Date().toISOString() }, patch))
    .eq('id', leadId);
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
