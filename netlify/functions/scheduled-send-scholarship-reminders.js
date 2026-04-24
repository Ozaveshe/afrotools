const { buildReminderSchedule, getAuthClient } = require('./_shared/scholarship-platform');
const { isEmailConfigured, sendEmail } = require('./_shared/email-adapter');

const FINDER_URL = 'https://afrotools.com/tools/scholarship-finder/';
const HUB_URL = 'https://afrotools.com/tools/education-hub/';

function offsetLabel(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'in 1 day';
  return 'in ' + days + ' days';
}

function buildReminderEmail(job, scholarship, days) {
  const officialUrl = scholarship.official_url || scholarship.source_url || FINDER_URL;
  const deadlineLabel = scholarship.deadline_date || scholarship.deadline_text || 'the listed deadline';
  const confidence = scholarship.confidence_mode || 'curated';
  const provider = scholarship.provider || 'Scholarship provider';
  const subject = scholarship.title + ' deadline reminder - ' + offsetLabel(days);

  const html = '<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">' +
    '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">' +
    '<div style="padding:24px 24px 16px;background:#0f172a;color:#ffffff;">' +
    '<div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#93c5fd;">AfroTools scholarship reminder</div>' +
    '<h1 style="margin:10px 0 0;font-size:26px;line-height:1.15;">' + escapeHtml(scholarship.title) + '</h1>' +
    '<p style="margin:10px 0 0;color:#cbd5e1;font-size:14px;">' + escapeHtml(provider) + '</p>' +
    '</div>' +
    '<div style="padding:24px;">' +
    '<p style="font-size:15px;line-height:1.7;margin:0 0 14px;">This is your AfroTools reminder that <strong>' + escapeHtml(scholarship.title) + '</strong> is due <strong>' + escapeHtml(offsetLabel(days)) + '</strong>.</p>' +
    '<p style="font-size:14px;line-height:1.7;margin:0 0 14px;"><strong>Deadline:</strong> ' + escapeHtml(deadlineLabel) + '<br><strong>Feed trust:</strong> ' + escapeHtml(confidence) + '</p>' +
    '<p style="font-size:14px;line-height:1.7;margin:0 0 18px;">Use Scholarship Finder to review your saved route, and Education Hub to keep the wider plan moving.</p>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px;">' +
    '<a href="' + escapeHtml(officialUrl) + '" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">Open official details</a>' +
    '<a href="' + FINDER_URL + '" style="display:inline-block;padding:12px 18px;background:#eff6ff;color:#1d4ed8;text-decoration:none;border-radius:10px;font-weight:700;">Open Scholarship Finder</a>' +
    '<a href="' + HUB_URL + '" style="display:inline-block;padding:12px 18px;background:#f8fafc;color:#0f172a;text-decoration:none;border-radius:10px;font-weight:700;border:1px solid #cbd5e1;">Open Education Hub</a>' +
    '</div>' +
    '<p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">You are receiving this because reminders are enabled for this saved scholarship inside AfroTools.</p>' +
    '</div></div></body></html>';

  const text = [
    'AfroTools scholarship reminder',
    '',
    scholarship.title + ' is due ' + offsetLabel(days) + '.',
    'Provider: ' + provider,
    'Deadline: ' + deadlineLabel,
    'Feed trust: ' + confidence,
    '',
    'Official details: ' + officialUrl,
    'Scholarship Finder: ' + FINDER_URL,
    'Education Hub: ' + HUB_URL
  ].join('\n');

  return {
    subject: subject,
    html: html,
    text: text
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

async function skipJob(client, job, reason) {
  await client
    .from('scholarship_notification_jobs')
    .update({
      status: 'skipped',
      processed_at: new Date().toISOString()
    })
    .eq('id', job.id);
  await client
    .from('scholarship_notification_log')
    .insert({
      job_id: job.id,
      provider_status: 'skipped',
      error_summary: reason,
      payload: job.payload || {}
    });
}

exports.handler = async function () {
  const client = getAuthClient();
  if (!client) {
    return { statusCode: 500, body: 'Scholarship auth client not configured' };
  }

  if (!isEmailConfigured()) {
    console.log('[scholarship-reminders] RESEND_API_KEY not set - leaving queued jobs untouched');
    return { statusCode: 200, body: 'Skipped: no email provider configured' };
  }

  const nowIso = new Date().toISOString();
  const { data: jobs, error } = await client
    .from('scholarship_notification_jobs')
    .select('id, user_id, scholarship_id, reminder_id, scheduled_for, payload')
    .eq('status', 'queued')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (error) {
    console.error('[scholarship-reminders] Failed to load jobs:', error.message);
    return { statusCode: 500, body: error.message };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of (jobs || [])) {
    const { data: processingRows } = await client
      .from('scholarship_notification_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id)
      .eq('status', 'queued')
      .select('id');

    if (!processingRows || !processingRows.length) continue;

    try {
      const { data: scholarship, error: scholarshipError } = await client
        .from('scholarships')
        .select('*')
        .eq('id', job.scholarship_id)
        .maybeSingle();
      if (scholarshipError) throw scholarshipError;

      const { data: reminder, error: reminderError } = await client
        .from('user_scholarship_reminders')
        .select('id, enabled, offsets')
        .eq('id', job.reminder_id)
        .maybeSingle();
      if (reminderError) throw reminderError;

      const { data: saveRow, error: saveError } = await client
        .from('user_saved_scholarships')
        .select('id, archived')
        .eq('user_id', job.user_id)
        .eq('scholarship_id', job.scholarship_id)
        .maybeSingle();
      if (saveError) throw saveError;

      if (!scholarship || !scholarship.is_active || scholarship.status === 'closed' || !scholarship.deadline_date || !saveRow || saveRow.archived || !reminder || !reminder.enabled) {
        skipped += 1;
        await skipJob(client, job, 'Scholarship, save, or reminder was inactive at send time');
        continue;
      }

      const expectedSchedule = buildReminderSchedule(scholarship.deadline_date, reminder.offsets, {
        includePast: true
      });
      const expectedTimestamps = new Set(expectedSchedule.map(function (entry) {
        return toTimestamp(entry.scheduledFor);
      }).filter(function (timestamp) {
        return timestamp !== null;
      }));
      const scheduledTimestamp = toTimestamp(job.scheduled_for);

      if (!scheduledTimestamp || !expectedTimestamps.has(scheduledTimestamp)) {
        skipped += 1;
        await skipJob(client, job, 'Reminder job schedule no longer matches the scholarship deadline state');
        continue;
      }

      const authResult = await client.auth.admin.getUserById(job.user_id);
      const email = authResult && authResult.data && authResult.data.user ? authResult.data.user.email : null;
      if (!email) {
        throw new Error('No email found for reminder user');
      }

      const days = Number(job.payload && job.payload.offsetDays);
      const emailMessage = buildReminderEmail(job, scholarship, Number.isInteger(days) ? days : 0);
      const sendResult = await sendEmail({
        to: email,
        subject: emailMessage.subject,
        html: emailMessage.html,
        text: emailMessage.text
      });

      if (!sendResult.ok) {
        throw new Error(sendResult.error || 'Reminder email failed');
      }

      sent += 1;
      await client
        .from('scholarship_notification_jobs')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id);
      await client
        .from('user_scholarship_reminders')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', reminder.id);
      await client
        .from('scholarship_notification_log')
        .insert({
          job_id: job.id,
          provider_status: 'sent',
          payload: job.payload || {}
        });
    } catch (jobError) {
      failed += 1;
      await client
        .from('scholarship_notification_jobs')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id);
      await client
        .from('scholarship_notification_log')
        .insert({
          job_id: job.id,
          provider_status: 'failed',
          error_summary: jobError.message,
          payload: job.payload || {}
        });
    }
  }

  const summary = 'Scholarship reminders: sent=' + sent + ', failed=' + failed + ', skipped=' + skipped;
  console.log('[scholarship-reminders]', summary);
  return { statusCode: 200, body: summary };
};
