const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const SUPABASE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
const DEFAULT_CAMPAIGN_ID = 'matchday-os-2026';

function getAllowedOrigin(event) {
  const origin = event && event.headers ? event.headers.origin || '' : '';
  const allowed = origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return allowed ? origin : 'https://afrotools.com';
}

function corsHeaders(event, methods) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': methods || 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Origin, Authorization'
  };
}

function reply(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function getHeader(headers, name) {
  headers = headers || {};
  const wanted = String(name || '').toLowerCase();
  const key = Object.keys(headers).find(function (item) {
    return item.toLowerCase() === wanted;
  });
  return key ? headers[key] : '';
}

function parseCookies(cookieHeader) {
  const cookies = {};
  String(cookieHeader || '').split(';').forEach(function (part) {
    const pieces = part.trim().split('=');
    if (pieces.length < 2) return;
    cookies[pieces[0].trim()] = decodeURIComponent(pieces.slice(1).join('='));
  });
  return cookies;
}

function getBearerToken(event) {
  const auth = String(getHeader(event && event.headers, 'authorization') || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1].trim();
  const cookies = parseCookies(getHeader(event && event.headers, 'cookie'));
  return cookies.afro_session || '';
}

function normalizeSupabaseUser(user) {
  const metadata = user && user.user_metadata || {};
  const provider = user && user.app_metadata && user.app_metadata.provider;
  return {
    id: user && user.id,
    email: user && user.email || '',
    displayName: metadata.name || metadata.full_name || (user && user.email ? String(user.email).split('@')[0] : 'Matchday fan'),
    countryCode: metadata.country || metadata.country_code || null,
    emailVerified: Boolean(user && (user.email_confirmed_at || user.confirmed_at || user.email_verified || (provider && provider !== 'email'))),
    raw: user || null
  };
}

async function requireMatchdayUser(event) {
  const token = getBearerToken(event);
  if (!token) {
    return {
      status: 401,
      error: 'Sign in to save Matchday OS predictions.'
    };
  }
  if (!SUPABASE_ANON_KEY) {
    return {
      status: 503,
      error: 'Matchday account verification is not configured.'
    };
  }

  const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + token
    }
  });
  if (!response.ok) {
    return {
      status: 401,
      error: 'Your Matchday OS session expired. Sign in again.'
    };
  }

  const user = normalizeSupabaseUser(await response.json());
  if (!user.id) {
    return {
      status: 401,
      error: 'Your Matchday OS session could not be verified.'
    };
  }
  return { user, token };
}

function parseLimit(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function cleanText(value, maxLength) {
  return String(value == null ? '' : value)
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, maxLength || 200);
}

async function supabaseRest(path, options) {
  if (!SUPABASE_KEY) {
    const error = new Error('Supabase service key is not configured.');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }

  const config = { ...(options || {}) };
  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...config,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(config && config.headers ? config.headers : {})
    }
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const error = new Error('Supabase request failed.');
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function loadTournamentData() {
  const dataPath = path.resolve(__dirname, '..', '..', '..', 'data', 'matchday-os', 'tournament-full.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function buildFixtureMap(tournament) {
  const map = new Map();
  (tournament && Array.isArray(tournament.fixtures) ? tournament.fixtures : []).forEach(function (fixture) {
    if (fixture && fixture.matchId) map.set(fixture.matchId, fixture);
  });
  return map;
}

function toIso(value) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function isFixtureLocked(fixture, nowIso) {
  if (!fixture) return { locked: true, reason: 'unknown_fixture' };
  if (fixture.isPlaceholder || fixture.status === 'placeholder') {
    return { locked: true, reason: 'placeholder_fixture' };
  }
  if (!fixture.kickoffUtc) {
    return { locked: true, reason: 'missing_kickoff' };
  }
  if (['live', 'halftime', 'full_time', 'cancelled'].includes(fixture.status)) {
    return { locked: true, reason: 'fixture_not_open' };
  }
  const lockAt = new Date(fixture.kickoffUtc).getTime();
  const now = new Date(nowIso || new Date().toISOString()).getTime();
  if (!Number.isFinite(lockAt) || !Number.isFinite(now)) {
    return { locked: true, reason: 'invalid_lock_deadline' };
  }
  if (now >= lockAt) {
    return { locked: true, reason: 'locked_before_kickoff' };
  }
  return { locked: false, reason: 'open', lockDeadlineUtc: new Date(lockAt).toISOString() };
}

function cleanId(value, maxLength) {
  return cleanText(value, maxLength || 120).replace(/[^a-zA-Z0-9_.:-]/g, '');
}

function scoreValue(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 20) return null;
  return parsed;
}

function normalizeResultPick(value, fixture) {
  const pick = cleanId(value, 120);
  if (pick === 'draw') return pick;
  if (fixture && (pick === fixture.homeTeamId || pick === fixture.awayTeamId)) return pick;
  return '';
}

function normalizeTeamList(value, max) {
  const seen = new Set();
  const output = [];
  (Array.isArray(value) ? value : []).forEach(function (item) {
    const id = cleanId(item, 120);
    if (!id || seen.has(id)) return;
    seen.add(id);
    output.push(id);
  });
  return output.slice(0, max || 12);
}

function normalizePredictionRequest(body, tournament, nowIso) {
  const input = body && typeof body === 'object' ? body : {};
  const fixtureMap = buildFixtureMap(tournament);
  const lockedFixtures = [];
  const rejectedFixtures = [];
  const fixturePredictions = [];
  const seen = new Set();

  (Array.isArray(input.fixturePredictions) ? input.fixturePredictions : []).forEach(function (item) {
    const matchId = cleanId(item && (item.matchId || item.match_id), 140);
    if (!matchId || seen.has(matchId)) return;
    seen.add(matchId);

    const fixture = fixtureMap.get(matchId);
    if (!fixture) {
      rejectedFixtures.push({ matchId, reason: 'unknown_fixture' });
      return;
    }

    const lock = isFixtureLocked(fixture, nowIso);
    if (lock.locked) {
      lockedFixtures.push({ matchId, reason: lock.reason, lockDeadlineUtc: fixture.kickoffUtc || null });
      return;
    }

    const resultPick = normalizeResultPick(item && (item.resultPick || item.result_pick), fixture);
    if (!resultPick) {
      rejectedFixtures.push({ matchId, reason: 'invalid_result_pick' });
      return;
    }

    fixturePredictions.push({
      matchId,
      fixture,
      resultPick,
      homeScore: scoreValue(item && (item.homeScore ?? item.home_score)),
      awayScore: scoreValue(item && (item.awayScore ?? item.away_score)),
      lockDeadlineUtc: lock.lockDeadlineUtc
    });
  });

  const status = cleanId(input.status, 30) === 'draft' ? 'draft' : 'submitted';
  const groupQualifiers = input.groupQualifiers || {};
  const tournamentPicks = input.tournamentPicks || {};

  return {
    campaignId: cleanId(input.campaignId || input.campaign_id, 80) || DEFAULT_CAMPAIGN_ID,
    status,
    termsAccepted: input.termsAccepted === true || input.termsAccepted === 'true' || input.termsAccepted === 'on',
    clientVersion: cleanText(input.clientVersion || input.client_version, 80),
    profile: {
      displayName: cleanText(input.displayName, 80),
      countryCode: cleanId(input.countryCode, 12).toUpperCase() || null,
      preferredTimezone: cleanText(input.timeZone || input.preferredTimezone, 80) || 'Africa/Lagos',
      preferredTeamId: cleanId(input.preferredTeamId, 120) || null,
      teamWatchlist: normalizeTeamList(input.teamWatchlist, 16)
    },
    fixturePredictions,
    lockedFixtures,
    rejectedFixtures,
    groupQualifiers: {
      groupId: cleanId(groupQualifiers.groupId || groupQualifiers.group_id, 80),
      teamIds: normalizeTeamList(groupQualifiers.teamIds || groupQualifiers.team_ids, 2)
    },
    tournamentPicks: {
      bestAfricanTeamId: cleanId(tournamentPicks.bestAfricanTeamId || tournamentPicks.best_african_team_id, 120),
      semiFinalistTeamIds: normalizeTeamList(tournamentPicks.semiFinalistTeamIds || tournamentPicks.semi_finalist_team_ids, 4),
      finalistTeamIds: normalizeTeamList(tournamentPicks.finalistTeamIds || tournamentPicks.finalist_team_ids, 2),
      championTeamId: cleanId(tournamentPicks.championTeamId || tournamentPicks.champion_team_id, 120)
    }
  };
}

function predictionPayloadForStorage(request) {
  return {
    clientVersion: request.clientVersion || null,
    fixturePredictions: request.fixturePredictions.map(function (prediction) {
      return {
        matchId: prediction.matchId,
        resultPick: prediction.resultPick,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        lockDeadlineUtc: prediction.lockDeadlineUtc
      };
    }),
    groupQualifiers: request.groupQualifiers,
    tournamentPicks: request.tournamentPicks,
    lockedFixtures: request.lockedFixtures,
    rejectedFixtures: request.rejectedFixtures
  };
}

module.exports = {
  DEFAULT_CAMPAIGN_ID,
  SUPABASE_KEY,
  cleanText,
  corsHeaders,
  isFixtureLocked,
  loadTournamentData,
  normalizePredictionRequest,
  predictionPayloadForStorage,
  parseLimit,
  requireMatchdayUser,
  reply,
  supabaseRest
};
