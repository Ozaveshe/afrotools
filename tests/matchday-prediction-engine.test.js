#!/usr/bin/env node
'use strict';

const assert = require('assert');
const Engine = require('../assets/js/lib/matchday-prediction-engine.js');

const teams = [
  { teamId: 'morocco', name: 'Morocco', isAfricanTeam: true },
  { teamId: 'senegal', name: 'Senegal', isAfricanTeam: true },
  { teamId: 'brazil', name: 'Brazil', isAfricanTeam: false },
  { teamId: 'japan', name: 'Japan', isAfricanTeam: false }
];

const scoring = {
  correctResult: 4,
  correctDraw: 4,
  correctGoalDifference: 3,
  correctTeamGoal: 1,
  exactScore: 10,
  correctGroupQualifier: 10,
  correctChampion: 25,
  africanFixtureBonusMultiplier: 0.25,
  africanTeamWinBonus: 3,
  africanTeamCleanSheetBonus: 2,
  maxAfricanFixtureBonus: 8
};

const moroccoWin = {
  matchId: 'm1',
  status: 'full_time',
  resultFinal: true,
  homeTeamId: 'morocco',
  awayTeamId: 'brazil',
  homeScore: 2,
  awayScore: 1
};

const draw = {
  matchId: 'm2',
  status: 'full_time',
  resultFinal: true,
  homeTeamId: 'japan',
  awayTeamId: 'senegal',
  homeScore: 1,
  awayScore: 1
};

const pending = {
  matchId: 'm3',
  status: 'scheduled',
  resultFinal: false,
  homeTeamId: 'senegal',
  awayTeamId: 'brazil',
  homeScore: null,
  awayScore: null
};

let result = Engine.scoreMatchPick({ matchId: 'm1', resultPick: 'morocco', homeScore: 1, awayScore: 0 }, moroccoWin, scoring, teams);
assert.strictEqual(result.total, 12, 'result, goal difference, and African win bonus should score 12');
assert.deepStrictEqual(result.breakdown.map((item) => item.rule), ['correctResult', 'correctGoalDifference', 'africanFixtureBonus25Percent', 'correctAfricanTeamWin']);

result = Engine.scoreMatchPick({ matchId: 'm1', resultPick: 'morocco', homeScore: 2, awayScore: 1 }, moroccoWin, scoring, teams);
assert.strictEqual(result.total, 16, 'exact score plus African fixture and win bonuses should score 16');
assert.deepStrictEqual(result.breakdown.map((item) => item.rule), ['exactScore', 'africanFixtureBonus25Percent', 'correctAfricanTeamWin']);

result = Engine.scoreMatchPick({ matchId: 'm2', resultPick: 'draw', homeScore: 0, awayScore: 0 }, draw, scoring, teams);
assert.strictEqual(result.total, 9, 'draw with correct goal difference in an African fixture should score 9');
assert.deepStrictEqual(result.breakdown.map((item) => item.rule), ['correctResult', 'correctGoalDifference', 'africanFixtureBonus25Percent']);

result = Engine.scoreMatchPick({ matchId: 'm3', resultPick: 'senegal', homeScore: 2, awayScore: 0 }, pending, scoring, teams);
assert.strictEqual(result.total, 0, 'pending fixtures should not score');
assert.strictEqual(result.scoreable, false, 'pending fixtures should be marked unscoreable');

result = Engine.scoreGroupQualifiersPick({ teamIds: ['morocco', 'brazil'] }, { groupQualifiers: ['morocco', 'japan'] }, scoring, teams);
assert.strictEqual(result.total, 10, 'group qualifier scoring should not apply fixture bonuses');

result = Engine.scoreChampionPick('morocco', { championTeamId: 'morocco' }, scoring, teams);
assert.strictEqual(result.total, 25, 'champion scoring should not apply fixture bonuses');

result = Engine.calculateUserScore({
  matchPick: { matchId: 'm1', resultPick: 'morocco', homeScore: 2, awayScore: 1 },
  groupQualifiers: { groupId: 'g1', teamIds: ['morocco', 'brazil'] },
  tournamentPicks: { championTeamId: 'morocco' }
}, {
  groupQualifiers: ['morocco'],
  championTeamId: 'morocco'
}, scoring, teams, [moroccoWin]);
assert.strictEqual(result.total, 51, 'combined scoring should add match, qualifier, and champion sections');

assert.strictEqual(Engine.isLocked('2026-06-11T12:00:00Z', '2026-06-11T12:01:00Z'), true, 'deadline should lock after cutoff');
assert.strictEqual(Engine.isLocked('2026-06-11T12:00:00Z', '2026-06-11T11:59:00Z'), false, 'deadline should stay open before cutoff');

console.log('matchday-prediction-engine.test.js passed');
