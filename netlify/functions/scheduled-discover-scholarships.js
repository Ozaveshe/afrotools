const { discoverScholarshipSources } = require('./_shared/scholarship-platform');

exports.handler = async function () {
  try {
    const result = await discoverScholarshipSources();
    const summary = {
      ok: true,
      checked_at: result.checked_at,
      source_count: result.source_count,
      active_source_count: result.active_source_count,
      manual_review_source_count: result.manual_review_source_count,
      parsable_source_count: result.parsable_source_count
    };
    console.log('[scholarship-discovery]', JSON.stringify(summary));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    };
  } catch (error) {
    console.error('[scholarship-discovery] Failed:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: error.message })
    };
  }
};
