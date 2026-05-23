const { corsHeaders, reply } = require('./_shared/matchday-api');

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'GET, POST, OPTIONS');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  return reply(501, {
    error: 'Admin anti-cheat review requires authenticated operator tooling.',
    action: 'admin_review_pending'
  }, headers);
};
