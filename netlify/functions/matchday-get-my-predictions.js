const {
  DEFAULT_CAMPAIGN_ID,
  corsHeaders,
  isFixtureLocked,
  loadTournamentData,
  parseLimit,
  requireMatchdayUser,
  reply,
  supabaseRest
} = require('./_shared/matchday-api');

function fixtureMap(tournament) {
  const map = new Map();
  (tournament && Array.isArray(tournament.fixtures) ? tournament.fixtures : []).forEach(function (fixture) {
    if (fixture && fixture.matchId) map.set(fixture.matchId, fixture);
  });
  return map;
}

async function fetchEntries(userId, campaignId, limit) {
  const query = [
    'matchday_prediction_entries?select=id,campaign_id,user_id,entry_status,lock_status,terms_accepted_at,prediction_payload,submitted_at,last_saved_at,locked_at,created_at,updated_at',
    'user_id=eq.' + encodeURIComponent(userId),
    'campaign_id=eq.' + encodeURIComponent(campaignId),
    'order=created_at.desc',
    'limit=' + limit
  ].join('&');
  const rows = await supabaseRest(query, { method: 'GET' });
  return Array.isArray(rows) ? rows : [];
}

async function fetchFixturePredictions(userId, campaignId) {
  const query = [
    'matchday_fixture_predictions?select=id,entry_id,campaign_id,match_id,stage,group_id,home_team_id,away_team_id,kickoff_utc,lock_deadline_utc,locked_at,prediction_type,result_pick,home_score,away_score,submitted_at,last_saved_at,score_status,prediction_points,scoring_details',
    'user_id=eq.' + encodeURIComponent(userId),
    'campaign_id=eq.' + encodeURIComponent(campaignId),
    'order=kickoff_utc.asc'
  ].join('&');
  const rows = await supabaseRest(query, { method: 'GET' });
  return Array.isArray(rows) ? rows : [];
}

function normalizeEntry(entry, user, fixtures) {
  const payload = entry.prediction_payload || {};
  const firstFixture = fixtures[0] || null;
  return {
    id: entry.id,
    campaign_id: entry.campaign_id,
    entry_status: entry.entry_status,
    lock_status: entry.lock_status,
    terms_accepted_at: entry.terms_accepted_at,
    submitted_at: entry.submitted_at,
    last_saved_at: entry.last_saved_at,
    locked_at: entry.locked_at,
    eligible_for_leaderboard: Boolean(user.emailVerified && entry.terms_accepted_at),
    lock_deadline_utc: firstFixture && firstFixture.lock_deadline_utc || null,
    groupQualifiers: payload.groupQualifiers || {},
    tournamentPicks: payload.tournamentPicks || {}
  };
}

function normalizeFixture(row, map, nowIso) {
  const fixture = map.get(row.match_id);
  const lock = row.locked_at
    ? { locked: true, reason: 'server_locked' }
    : isFixtureLocked(fixture || {
      matchId: row.match_id,
      kickoffUtc: row.lock_deadline_utc || row.kickoff_utc,
      status: 'scheduled'
    }, nowIso);

  return {
    id: row.id,
    entry_id: row.entry_id,
    matchId: row.match_id,
    match_id: row.match_id,
    stage: row.stage,
    group_id: row.group_id,
    home_team_id: row.home_team_id,
    away_team_id: row.away_team_id,
    kickoff_utc: row.kickoff_utc,
    lock_deadline_utc: row.lock_deadline_utc,
    locked_at: row.locked_at,
    lock_status: lock.locked ? 'locked' : 'open',
    lock_reason: lock.reason,
    resultPick: row.result_pick,
    result_pick: row.result_pick,
    homeScore: row.home_score,
    home_score: row.home_score,
    awayScore: row.away_score,
    away_score: row.away_score,
    submitted_at: row.submitted_at,
    last_saved_at: row.last_saved_at,
    score_status: row.score_status,
    prediction_points: row.prediction_points,
    scoring_details: row.scoring_details || {}
  };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'GET, OPTIONS');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);

  try {
    const auth = await requireMatchdayUser(event);
    if (auth.error) {
      return reply(auth.status, {
        error: auth.error,
        data: []
      }, headers);
    }

    const params = event.queryStringParameters || {};
    const campaignId = params.campaign_id || DEFAULT_CAMPAIGN_ID;
    const limit = parseLimit(params.limit, 3, 10);
    const nowIso = new Date().toISOString();
    const tournament = loadTournamentData();
    const map = fixtureMap(tournament);
    const entries = await fetchEntries(auth.user.id, campaignId, limit);
    const fixtureRows = await fetchFixturePredictions(auth.user.id, campaignId);
    const fixturePredictions = fixtureRows.map(function (row) {
      return normalizeFixture(row, map, nowIso);
    });
    const currentEntryId = entries[0] && entries[0].id;
    const currentFixtures = currentEntryId
      ? fixtureRows.filter(function (row) { return row.entry_id === currentEntryId; })
      : [];

    return reply(200, {
      ok: true,
      data: entries.map(function (entry) {
        const rows = fixtureRows.filter(function (row) { return row.entry_id === entry.id; });
        return normalizeEntry(entry, auth.user, rows);
      }),
      entry: entries[0] ? normalizeEntry(entries[0], auth.user, currentFixtures) : null,
      entries: entries.map(function (entry) {
        const rows = fixtureRows.filter(function (row) { return row.entry_id === entry.id; });
        return normalizeEntry(entry, auth.user, rows);
      }),
      fixturePredictions,
      fixturePredictionCount: fixturePredictions.length,
      meta: {
        source: 'supabase',
        campaign_id: campaignId,
        provisional: true,
        message: 'Saved predictions remain provisional until verified results, scoring jobs, anti-cheat review, and eligibility checks run.'
      }
    }, headers);
  } catch (error) {
    if (error.code === 'SUPABASE_NOT_CONFIGURED') {
      return reply(503, {
        error: 'Saved prediction loading is not configured.',
        data: []
      }, headers);
    }
    console.error('Matchday get predictions error:', error.body || error.message);
    return reply(error.status || 500, {
      error: 'Saved Matchday OS predictions are unavailable right now.',
      data: []
    }, headers);
  }
};
