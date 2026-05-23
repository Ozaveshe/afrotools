const { corsHeaders, reply } = require('./_shared/matchday-api');

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'GET, OPTIONS');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);

  return reply(401, {
    error: 'Sign in to load saved Matchday predictions.',
    data: []
  }, headers);
};
