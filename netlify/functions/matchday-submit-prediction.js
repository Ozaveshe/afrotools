const {
  corsHeaders,
  loadTournamentData,
  normalizePredictionRequest,
  predictionPayloadForStorage,
  requireMatchdayUser,
  reply,
  supabaseRest
} = require('./_shared/matchday-api');

function parseJsonBody(event) {
  try {
    return event && event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    const err = new Error('Prediction request body must be valid JSON.');
    err.status = 400;
    throw err;
  }
}

function profilePayload(user, request, nowIso) {
  const profile = request.profile || {};
  const payload = {
    user_id: user.id,
    display_name: profile.displayName || user.displayName || 'Matchday fan',
    country_code: profile.countryCode || user.countryCode || null,
    preferred_timezone: profile.preferredTimezone || 'Africa/Lagos',
    preferred_team_id: profile.preferredTeamId || null,
    team_watchlist: profile.teamWatchlist || [],
    contest_terms_version: 'matchday-os-2026-baseline',
    updated_at: nowIso
  };
  if (user.emailVerified) payload.email_verified_at = nowIso;
  if (request.termsAccepted) payload.terms_accepted_at = nowIso;
  return payload;
}

async function upsertProfile(user, request, nowIso) {
  await supabaseRest('matchday_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: [profilePayload(user, request, nowIso)]
  });
}

async function fetchLatestEntry(userId, campaignId) {
  const query = [
    'matchday_prediction_entries?select=id,campaign_id,user_id,entry_status,lock_status,terms_accepted_at,submitted_at,last_saved_at,locked_at,created_at,updated_at',
    'user_id=eq.' + encodeURIComponent(userId),
    'campaign_id=eq.' + encodeURIComponent(campaignId),
    'order=created_at.desc',
    'limit=1'
  ].join('&');
  const rows = await supabaseRest(query, { method: 'GET' });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function createEntry(user, request, nowIso) {
  const rows = await supabaseRest('matchday_prediction_entries?select=id,campaign_id,user_id,entry_status,lock_status,terms_accepted_at,submitted_at,last_saved_at,locked_at,created_at,updated_at', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation'
    },
    body: [{
      campaign_id: request.campaignId,
      user_id: user.id,
      entry_status: 'active',
      lock_status: 'open',
      terms_accepted_at: request.termsAccepted ? nowIso : null,
      prediction_payload: predictionPayloadForStorage(request),
      submitted_at: nowIso,
      last_saved_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso
    }]
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function updateEntry(entryId, request, nowIso) {
  const rows = await supabaseRest('matchday_prediction_entries?id=eq.' + encodeURIComponent(entryId) + '&select=id,campaign_id,user_id,entry_status,lock_status,terms_accepted_at,submitted_at,last_saved_at,locked_at,created_at,updated_at', {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation'
    },
    body: {
      terms_accepted_at: request.termsAccepted ? nowIso : undefined,
      prediction_payload: predictionPayloadForStorage(request),
      last_saved_at: nowIso,
      updated_at: nowIso
    }
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function getOrCreateEntry(user, request, nowIso) {
  const existing = await fetchLatestEntry(user.id, request.campaignId);
  if (existing && existing.locked_at) {
    const error = new Error('This Matchday OS entry is locked and cannot be edited.');
    error.status = 409;
    throw error;
  }
  if (existing) return updateEntry(existing.id, request, nowIso);
  return createEntry(user, request, nowIso);
}

async function fetchExistingFixtureRows(entryId) {
  const rows = await supabaseRest('matchday_fixture_predictions?select=id,match_id,locked_at&entry_id=eq.' + encodeURIComponent(entryId), {
    method: 'GET'
  });
  const map = new Map();
  (Array.isArray(rows) ? rows : []).forEach(function (row) {
    if (row && row.match_id) map.set(row.match_id, row);
  });
  return map;
}

function fixtureRow(entry, user, request, prediction, nowIso) {
  const fixture = prediction.fixture;
  return {
    entry_id: entry.id,
    campaign_id: request.campaignId,
    user_id: user.id,
    match_id: prediction.matchId,
    stage: fixture.stage || null,
    group_id: fixture.group || null,
    home_team_id: fixture.homeTeamId || null,
    away_team_id: fixture.awayTeamId || null,
    kickoff_utc: fixture.kickoffUtc || null,
    lock_deadline_utc: prediction.lockDeadlineUtc || fixture.kickoffUtc || null,
    prediction_type: 'fixture_result',
    result_pick: prediction.resultPick,
    home_score: prediction.homeScore,
    away_score: prediction.awayScore,
    last_saved_at: nowIso,
    updated_at: nowIso
  };
}

async function saveFixturePredictions(entry, user, request, nowIso) {
  const existingRows = await fetchExistingFixtureRows(entry.id);
  const saved = [];
  const lockedRows = [];

  for (const prediction of request.fixturePredictions) {
    const existing = existingRows.get(prediction.matchId);
    if (existing && existing.locked_at) {
      lockedRows.push({ matchId: prediction.matchId, reason: 'server_locked', lockedAt: existing.locked_at });
      continue;
    }

    if (existing) {
      const rows = await supabaseRest('matchday_fixture_predictions?id=eq.' + encodeURIComponent(existing.id) + '&select=id,match_id,result_pick,home_score,away_score,lock_deadline_utc,last_saved_at', {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation'
        },
        body: fixtureRow(entry, user, request, prediction, nowIso)
      });
      saved.push(Array.isArray(rows) ? rows[0] : rows);
    } else {
      const rows = await supabaseRest('matchday_fixture_predictions?select=id,match_id,result_pick,home_score,away_score,lock_deadline_utc,last_saved_at', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation'
        },
        body: [Object.assign(fixtureRow(entry, user, request, prediction, nowIso), {
          submitted_at: nowIso,
          created_at: nowIso
        })]
      });
      saved.push(Array.isArray(rows) ? rows[0] : rows);
    }
  }

  return { saved, lockedRows };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);

  try {
    const auth = await requireMatchdayUser(event);
    if (auth.error) return reply(auth.status, { error: auth.error }, headers);

    const nowIso = new Date().toISOString();
    const request = normalizePredictionRequest(parseJsonBody(event), loadTournamentData(), nowIso);

    if (request.status !== 'draft' && !request.termsAccepted) {
      return reply(400, {
        error: 'Accept the Matchday OS challenge rules before submitting predictions.'
      }, headers);
    }

    if (!request.fixturePredictions.length) {
      return reply(request.lockedFixtures.length ? 409 : 400, {
        error: request.lockedFixtures.length
          ? 'Those fixture predictions are locked and were not saved.'
          : 'Choose at least one valid fixture prediction before saving.',
        lockedFixtures: request.lockedFixtures,
        rejectedFixtures: request.rejectedFixtures
      }, headers);
    }

    await upsertProfile(auth.user, request, nowIso);
    const entry = await getOrCreateEntry(auth.user, request, nowIso);
    const fixtureSave = await saveFixturePredictions(entry, auth.user, request, nowIso);
    const lockedFixtures = request.lockedFixtures.concat(fixtureSave.lockedRows);

    return reply(200, {
      ok: true,
      entry: {
        id: entry.id,
        campaign_id: entry.campaign_id,
        entry_status: entry.entry_status,
        lock_status: entry.lock_status,
        terms_accepted_at: entry.terms_accepted_at,
        submitted_at: entry.submitted_at,
        last_saved_at: entry.last_saved_at,
        locked_at: entry.locked_at,
        eligible_for_leaderboard: Boolean(auth.user.emailVerified && request.termsAccepted),
        lock_deadline_utc: request.fixturePredictions[0] && request.fixturePredictions[0].lockDeadlineUtc || null
      },
      fixturePredictions: fixtureSave.saved,
      fixturePredictionCount: fixtureSave.saved.length,
      lockedFixtures,
      rejectedFixtures: request.rejectedFixtures,
      prizeEligibility: auth.user.emailVerified && request.termsAccepted ? 'provisional_review_required' : 'email_or_terms_review_required',
      leaderboard: {
        provisional: true,
        message: 'Saved picks can appear on public leaderboards only after verified scoring, anti-cheat review, and eligibility checks.'
      },
      stillDisabled: ['score-engine', 'fan-point-awards', 'referral-rewards', 'winner-payout']
    }, headers);
  } catch (error) {
    if (error.code === 'SUPABASE_NOT_CONFIGURED') {
      return reply(503, {
        error: 'Prediction saving is not configured. No live write was attempted.'
      }, headers);
    }
    const status = error.status || 500;
    if (status >= 500) {
      console.error('Matchday submit prediction error:', error.body || error.message);
    }
    return reply(status, {
      error: error.message || 'Prediction saving is unavailable right now.'
    }, headers);
  }
};
