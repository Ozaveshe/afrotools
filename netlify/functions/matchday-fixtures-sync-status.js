const fs = require('fs');
const path = require('path');
const {
  corsHeaders,
  reply
} = require('./_shared/matchday-api');

function readTournamentStatus() {
  const dataPath = path.resolve(__dirname, '..', '..', 'data', 'matchday-os', 'tournament-full.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const fixtures = Array.isArray(data.fixtures) ? data.fixtures : [];
  const placeholders = fixtures.filter(function (fixture) {
    return fixture.isPlaceholder || fixture.status === 'placeholder';
  }).length;

  return {
    dataMode: data.dataMode || 'static',
    lastReviewed: data.lastReviewed || null,
    sourceNotes: data.sourceNotes || [],
    fixtureCount: fixtures.length,
    placeholderCount: placeholders,
    groupCount: Array.isArray(data.groups) ? data.groups.length : 0,
    teamCount: Array.isArray(data.teams) ? data.teams.length : 0,
    resultFinalCount: fixtures.filter(function (fixture) { return fixture.resultFinal === true; }).length,
    scorePolicy: data.updatePolicy && data.updatePolicy.scorePolicy || null
  };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event, 'GET, OPTIONS');

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);

  try {
    return reply(200, {
      data: readTournamentStatus()
    }, headers);
  } catch (error) {
    console.error('Matchday fixture sync status error:', error.message);
    return reply(500, { error: 'Fixture sync status is unavailable right now.' }, headers);
  }
};
