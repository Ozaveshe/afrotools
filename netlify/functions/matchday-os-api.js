const {
  corsHeaders,
  reply
} = require('./_shared/matchday-api');

const ENDPOINTS = [
  '/api/matchday/leaderboard',
  '/api/matchday/fixtures-sync-status',
  '/api/matchday/submit-prediction',
  '/api/matchday/my-predictions',
  '/api/matchday/submit-referral',
  '/api/matchday/track-event',
  '/api/matchday/fan-action',
  '/api/matchday/score-engine',
  '/api/matchday/anti-cheat-review'
];

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'GET, OPTIONS');

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  return reply(200, {
    name: 'Matchday OS API',
    status: 'partial',
    message: 'Use the concrete Matchday OS endpoints for leaderboard and fixture sync status. Prediction writes require authenticated function routes.',
    endpoints: ENDPOINTS
  }, headers);
};
