const { syncScholarshipMirror } = require('./_shared/scholarship-platform');
const { withScheduledProof } = require('./_shared/scheduled-proof');

exports.handler = withScheduledProof('scheduled-verify-scholarships', async function (event) {
  try {
    const result = await syncScholarshipMirror({ scheduledEvent: event });
    const count = Array.isArray(result.scholarships) ? result.scholarships.length : 0;
    const mode = result.meta && result.meta.mode ? result.meta.mode : 'unknown';
    const summary = 'Scholarship sync complete: ' + count + ' items (' + mode + ')';
    console.log('[scholarship-sync]', summary);
    return { statusCode: 200, body: summary };
  } catch (error) {
    console.error('[scholarship-sync] Failed:', error.message);
    return { statusCode: 500, body: error.message };
  }
});
