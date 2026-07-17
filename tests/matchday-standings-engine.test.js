const assert = require('assert');
const Engine = require('../assets/js/lib/matchday-standings-engine.js');

const data = {
  lastReviewed: '2026-05-21',
  teams: [
    { teamId: 'ghana', name: 'Ghana', shortLabel: 'GHA', isAfricanTeam: true, primaryColor: '#FCD116', secondaryColor: '#006B3F' },
    { teamId: 'senegal', name: 'Senegal', shortLabel: 'SEN', isAfricanTeam: true, primaryColor: '#00853F', secondaryColor: '#FDEF42' },
    { teamId: 'team-c', name: 'Team C', shortLabel: 'TMC', isAfricanTeam: false, primaryColor: '#111111', secondaryColor: '#EEEEEE' },
    { teamId: 'team-d', name: 'Team D', shortLabel: 'TMD', isAfricanTeam: false, primaryColor: '#111111', secondaryColor: '#EEEEEE' }
  ],
  groups: [
    {
      groupId: 'group-a',
      name: 'Group A',
      status: 'scheduled',
      teamIds: ['ghana', 'senegal', 'team-c', 'team-d']
    }
  ],
  fixtures: [
    { matchId: 'm1', group: 'group-a', homeTeamId: 'ghana', awayTeamId: 'team-c', status: 'full_time', resultFinal: true, homeScore: 2, awayScore: 0 },
    { matchId: 'm2', group: 'group-a', homeTeamId: 'senegal', awayTeamId: 'team-d', status: 'full_time', resultFinal: true, homeScore: 1, awayScore: 1 },
    { matchId: 'm3', group: 'group-a', homeTeamId: 'ghana', awayTeamId: 'senegal', status: 'full_time', resultFinal: true, homeScore: 0, awayScore: 1 },
    { matchId: 'm4', group: 'group-a', homeTeamId: 'team-c', awayTeamId: 'team-d', status: 'scheduled', resultFinal: false, homeScore: null, awayScore: null }
  ],
  knockoutBracket: {
    status: 'placeholder',
    rounds: [
      { roundId: 'round_of_32', label: 'Round of 32', slots: [{ slotId: 'a1', label: 'Group A winner', source: 'group_position', groupId: 'group-a', position: 1 }] }
    ]
  }
};

const group = Engine.calculateGroupStandings(data, data.groups[0]);
const rows = group.rows;

assert.strictEqual(group.hasResults, true, 'group has countable final scores');
const senegal = rows.find((row) => row.teamId === 'senegal');
assert.strictEqual(senegal.played, 2, 'draw plus win counted');
assert.strictEqual(senegal.won, 1, 'Senegal win counted');
assert.strictEqual(senegal.drawn, 1, 'Senegal draw counted');
assert.strictEqual(senegal.points, 4, 'Senegal has four points');
assert.strictEqual(rows[0].teamId, 'senegal', 'points sort beats goal difference');

const ghana = rows.find((row) => row.teamId === 'ghana');
assert.strictEqual(ghana.played, 2, 'played counts final matches only');
assert.strictEqual(ghana.won, 1, 'win count');
assert.strictEqual(ghana.lost, 1, 'loss count');
assert.strictEqual(ghana.points, 3, 'points calculation');
assert.strictEqual(ghana.goalsFor, 2, 'goals for calculation');
assert.strictEqual(ghana.goalsAgainst, 1, 'goals against calculation');
assert.strictEqual(ghana.goalDiff, 1, 'goal difference calculation');
assert.deepStrictEqual(ghana.form, ['W', 'L'], 'form tracks final results in fixture order');
assert.strictEqual(ghana.isAfricanTeam, true, 'African-team metadata survives standings calculation');
assert.strictEqual(ghana.qualificationLabel, 'Top-two position', 'African top-two row gets progression label');

const empty = Engine.calculateGroupStandings(
  { teams: data.teams, groups: data.groups, fixtures: [] },
  data.groups[0]
);
assert.strictEqual(empty.hasResults, false, 'empty group has no results');
assert.ok(empty.rows.every((row) => row.qualificationLabel === 'Pending scores'), 'empty rows avoid overclaiming');

const bracket = Engine.buildBracket(data, [group]);
assert.strictEqual(bracket.rounds[0].slots[0].teamId, 'senegal', 'bracket resolves group position when results exist');
assert.strictEqual(bracket.rounds[0].slots[0].isAfricanTeam, true, 'bracket carries African-team flag');

console.log('matchday-standings-engine.test.js passed');
