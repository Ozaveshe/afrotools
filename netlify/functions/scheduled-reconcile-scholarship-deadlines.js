const { reconcileAllScholarshipDeadlines } = require('./_shared/scholarship-platform');
const { withScheduledProof } = require('./_shared/scheduled-proof');

exports.handler = withScheduledProof('scheduled-reconcile-scholarship-deadlines', async function () {
  try {
    const result = await reconcileAllScholarshipDeadlines();
    const summary = {
      ok: true,
      checked_at: result.checked_at,
      scholarship_count: result.scholarshipCount,
      reminder_count: result.reminderCount,
      queued_jobs: result.queuedJobs,
      cancelled_reminders: result.cancelledReminders
    };
    console.log('[scholarship-deadline-reconcile]', JSON.stringify(summary));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    };
  } catch (error) {
    console.error('[scholarship-deadline-reconcile] Failed:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: error.message })
    };
  }
});
