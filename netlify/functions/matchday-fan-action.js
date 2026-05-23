const { corsHeaders, reply } = require('./_shared/matchday-api');

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);

  return reply(501, {
    error: 'Fan Point awards require the authenticated server ledger.',
    action: 'server_fan_points_pending'
  }, headers);
};
