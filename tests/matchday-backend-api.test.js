#!/usr/bin/env node
'use strict';

const assert = require('assert');
const {
  isFixtureLocked,
  loadTournamentData,
  normalizePredictionRequest,
  predictionPayloadForStorage
} = require('../netlify/functions/_shared/matchday-api');

const tournament = loadTournamentData();
const firstFixture = tournament.fixtures[0];
assert.ok(firstFixture && firstFixture.matchId, 'fixture seed should load');

let lock = isFixtureLocked(firstFixture, '2026-05-23T00:00:00Z');
assert.strictEqual(lock.locked, false, 'future scheduled fixture should be open');
assert.strictEqual(Date.parse(lock.lockDeadlineUtc), Date.parse(firstFixture.kickoffUtc), 'kickoff should be the lock deadline');

lock = isFixtureLocked(firstFixture, '2026-06-11T19:00:00Z');
assert.strictEqual(lock.locked, true, 'fixture should lock at kickoff');
assert.strictEqual(lock.reason, 'locked_before_kickoff');

let request = normalizePredictionRequest({
  status: 'submitted',
  termsAccepted: true,
  displayName: '  Matchday Fan  ',
  countryCode: 'ng',
  fixturePredictions: [{
    matchId: firstFixture.matchId,
    resultPick: firstFixture.homeTeamId,
    homeScore: 2,
    awayScore: 1
  }],
  groupQualifiers: { groupId: 'group-a', teamIds: ['mexico', 'south-africa', 'mexico'] },
  tournamentPicks: { championTeamId: 'morocco' },
  ipAddress: 'must-not-persist'
}, tournament, '2026-05-23T00:00:00Z');

assert.strictEqual(request.fixturePredictions.length, 1, 'valid open fixture prediction should pass');
assert.strictEqual(request.lockedFixtures.length, 0);
assert.strictEqual(request.rejectedFixtures.length, 0);
assert.strictEqual(request.profile.countryCode, 'NG');
assert.deepStrictEqual(request.groupQualifiers.teamIds, ['mexico', 'south-africa']);

const stored = predictionPayloadForStorage(request);
assert.strictEqual(stored.fixturePredictions[0].matchId, firstFixture.matchId);
assert.strictEqual(Object.prototype.hasOwnProperty.call(stored, 'ipAddress'), false, 'raw sensitive request fields must not be stored');

request = normalizePredictionRequest({
  termsAccepted: true,
  fixturePredictions: [{
    matchId: firstFixture.matchId,
    resultPick: firstFixture.homeTeamId,
    homeScore: 2,
    awayScore: 1
  }]
}, tournament, '2026-06-12T00:00:00Z');
assert.strictEqual(request.fixturePredictions.length, 0, 'locked fixture should not be writable');
assert.strictEqual(request.lockedFixtures[0].reason, 'locked_before_kickoff');

request = normalizePredictionRequest({
  termsAccepted: true,
  fixturePredictions: [{
    matchId: firstFixture.matchId,
    resultPick: 'not-a-team',
    homeScore: 2,
    awayScore: 1
  }]
}, tournament, '2026-05-23T00:00:00Z');
assert.strictEqual(request.fixturePredictions.length, 0, 'invalid result pick should not be writable');
assert.strictEqual(request.rejectedFixtures[0].reason, 'invalid_result_pick');

request = normalizePredictionRequest({
  termsAccepted: true,
  fixturePredictions: [{
    matchId: 'placeholder-1',
    resultPick: 'draw'
  }]
}, {
  fixtures: [{
    matchId: 'placeholder-1',
    status: 'placeholder',
    isPlaceholder: true,
    kickoffUtc: '2026-06-11T19:00:00Z',
    homeTeamId: 'tbd-1',
    awayTeamId: 'tbd-2'
  }]
}, '2026-05-23T00:00:00Z');
assert.strictEqual(request.fixturePredictions.length, 0, 'placeholder fixture should not be writable');
assert.strictEqual(request.lockedFixtures[0].reason, 'placeholder_fixture');

console.log('matchday-backend-api.test.js passed');
