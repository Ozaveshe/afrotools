const {
  corsHeaders,
  parseLimit,
  reply,
  supabaseRest
} = require('./_shared/matchday-api');

function normalizeRow(row, index) {
  const predictionPoints = Number(row.prediction_points || 0);
  const fanPoints = Number(row.fan_points || 0);
  const total = Number(row.total_matchday_points || predictionPoints + fanPoints);
  const rank = Number(row.rank_position || index + 1);
  const previous = row.previous_rank_position == null ? null : Number(row.previous_rank_position);

  return {
    id: row.id,
    rank_position: rank,
    previous_rank_position: previous,
    rank_delta: Number(row.rank_delta || 0),
    rank_movement: row.rank_movement || (previous ? (previous > rank ? 'up' : previous < rank ? 'down' : 'same') : 'new'),
    public_display_name: row.public_display_name || 'Matchday fan',
    public_country_code: row.public_country_code || null,
    public_team_id: row.public_team_id || null,
    prediction_points: predictionPoints,
    fan_points: fanPoints,
    total_matchday_points: total,
    exact_scores_count: Number(row.exact_scores_count || 0),
    correct_outcomes_count: Number(row.correct_outcomes_count || 0),
    african_team_predictions_count: Number(row.african_team_predictions_count || 0),
    provisional: row.provisional !== false,
    verification_status: row.verification_status || 'provisional',
    is_prize_rank: row.is_prize_rank === true,
    prize_rank: row.prize_rank == null ? null : Number(row.prize_rank),
    prize_amount_usd: row.prize_amount_usd == null ? null : Number(row.prize_amount_usd),
    score_updated_at: row.score_updated_at || row.updated_at || null
  };
}

async function getLeaderboard(params) {
  const limit = parseLimit(params.limit, 20, 50);
  const campaignId = params.campaign_id || 'matchday-os-2026';
  const period = params.period || 'all_time';

  const query = [
    'matchday_public_leaderboard?select=id,campaign_id,period,rank_position,previous_rank_position,rank_delta,rank_movement,public_display_name,public_country_code,public_team_id,prediction_points,fan_points,total_matchday_points,exact_scores_count,correct_outcomes_count,african_team_predictions_count,provisional,verification_status,is_prize_rank,prize_rank,prize_amount_usd,score_updated_at,updated_at',
    'campaign_id=eq.' + encodeURIComponent(campaignId),
    'period=eq.' + encodeURIComponent(period),
    'order=total_matchday_points.desc,rank_position.asc',
    'limit=' + limit
  ].join('&');

  const rows = await supabaseRest(query, { method: 'GET' });
  return Array.isArray(rows) ? rows.map(normalizeRow) : [];
}

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'GET, OPTIONS');

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);

  try {
    const rows = await getLeaderboard(event.queryStringParameters || {});
    return reply(200, {
      data: rows,
      meta: {
        source: 'supabase',
        provisional: true,
        prizeNotice: 'Public leaderboard rows are provisional until anti-cheat and eligibility review.'
      }
    }, headers);
  } catch (error) {
    if (error.code === 'SUPABASE_NOT_CONFIGURED') {
      return reply(200, {
        data: [],
        meta: {
          source: 'not-configured',
          provisional: true,
          message: 'Leaderboard is waiting for server configuration.'
        }
      }, headers);
    }

    console.error('Matchday leaderboard error:', error.body || error.message);
    return reply(500, {
      error: 'Leaderboard is unavailable right now.',
      data: []
    }, headers);
  }
};
