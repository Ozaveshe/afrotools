(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.matchdayStandings = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var FINAL_STATUSES = { full_time: true };

  function teamName(team) {
    return team && team.name ? team.name : 'Team pending';
  }

  function byId(items, idField) {
    var map = {};
    (items || []).forEach(function (item) {
      if (item && item[idField]) map[item[idField]] = item;
    });
    return map;
  }

  function baseRow(team, seedOrder) {
    return {
      teamId: team ? team.teamId : null,
      teamName: teamName(team),
      shortLabel: team && team.shortLabel ? team.shortLabel : 'TBD',
      isAfricanTeam: Boolean(team && team.isAfricanTeam),
      primaryColor: team && team.primaryColor ? team.primaryColor : '#64748B',
      secondaryColor: team && team.secondaryColor ? team.secondaryColor : '#E2E8F0',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      form: [],
      position: null,
      qualificationLabel: 'Pending scores',
      meaning: 'No verified final scores are available for this group yet.',
      seedOrder: seedOrder
    };
  }

  function isCountableFixture(fixture) {
    return Boolean(
      fixture &&
      fixture.resultFinal === true &&
      FINAL_STATUSES[fixture.status] &&
      Number.isFinite(fixture.homeScore) &&
      Number.isFinite(fixture.awayScore) &&
      fixture.homeTeamId &&
      fixture.awayTeamId
    );
  }

  function addResult(row, goalsFor, goalsAgainst) {
    row.played += 1;
    row.goalsFor += goalsFor;
    row.goalsAgainst += goalsAgainst;
    row.goalDiff = row.goalsFor - row.goalsAgainst;

    if (goalsFor > goalsAgainst) {
      row.won += 1;
      row.points += 3;
      row.form.push('W');
    } else if (goalsFor === goalsAgainst) {
      row.drawn += 1;
      row.points += 1;
      row.form.push('D');
    } else {
      row.lost += 1;
      row.form.push('L');
    }

    if (row.form.length > 5) row.form = row.form.slice(row.form.length - 5);
  }

  function compareRows(a, b) {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // Official tournament tie-breakers can include head-to-head and fair-play criteria.
    // Matchday OS deliberately leaves those as a documented placeholder until verified rules
    // and complete final data are available.
    var nameCompare = String(a.teamName).localeCompare(String(b.teamName));
    if (nameCompare !== 0) return nameCompare;
    return a.seedOrder - b.seedOrder;
  }

  function labelRow(row, groupSize, hasResults) {
    if (!hasResults || row.played === 0) {
      row.qualificationLabel = 'Pending scores';
      row.meaning = row.isAfricanTeam
        ? 'Waiting for verified final scores before judging progress.'
        : 'Opponent slot is not settled from verified data yet.';
      return row;
    }

    if (row.position <= 2) {
      row.qualificationLabel = 'Top-two position';
      row.meaning = row.isAfricanTeam
        ? 'Currently in a provisional advancement position based on verified finals counted here.'
        : 'Currently in a provisional top-two position.';
    } else if (row.position === 3) {
      row.qualificationLabel = 'At risk';
      row.meaning = row.isAfricanTeam
        ? 'Needs help from later results or stronger goal difference to improve the position.'
        : 'Outside the top two on current verified results.';
    } else if (row.position === groupSize) {
      row.qualificationLabel = 'Elimination risk';
      row.meaning = row.isAfricanTeam
        ? 'Bottom of this table on verified results, but final status still depends on completed group data.'
        : 'Bottom of this table on verified results.';
    } else {
      row.qualificationLabel = 'Chasing';
      row.meaning = 'Outside the current top positions on verified results.';
    }

    return row;
  }

  function calculateGroupStandings(data, group) {
    var teams = byId(data.teams || [], 'teamId');
    var rawTeamIds = group.teamIds || [];
    var teamIds = rawTeamIds.length ? rawTeamIds : (group.tableRows || []).map(function (row) { return row.teamId; });
    var rows = {};

    teamIds.forEach(function (teamId, index) {
      var key = teamId || '__placeholder_' + index;
      rows[key] = baseRow(teamId ? teams[teamId] : null, index);
    });

    var groupFixtures = (data.fixtures || []).filter(function (fixture) {
      return fixture.group === group.groupId;
    });
    var countable = groupFixtures.filter(isCountableFixture);

    countable.forEach(function (fixture) {
      if (!rows[fixture.homeTeamId]) rows[fixture.homeTeamId] = baseRow(teams[fixture.homeTeamId], teamIds.length);
      if (!rows[fixture.awayTeamId]) rows[fixture.awayTeamId] = baseRow(teams[fixture.awayTeamId], teamIds.length + 1);

      addResult(rows[fixture.homeTeamId], fixture.homeScore, fixture.awayScore);
      addResult(rows[fixture.awayTeamId], fixture.awayScore, fixture.homeScore);
    });

    var standings = Object.keys(rows).map(function (teamId) { return rows[teamId]; }).sort(compareRows);
    var hasResults = countable.length > 0;
    standings.forEach(function (row, index) {
      row.position = index + 1;
      labelRow(row, standings.length, hasResults);
    });

    return {
      groupId: group.groupId,
      name: group.name,
      status: group.status,
      updatedAt: group.updatedAt || data.lastReviewed || null,
      hasResults: hasResults,
      tieBreakNote: 'Sort order: points, goal difference, goals scored, head-to-head placeholder, then stable team name/order fallback.',
      rows: standings
    };
  }

  function buildAllStandings(data) {
    return (data.groups || []).map(function (group) {
      return calculateGroupStandings(data, group);
    });
  }

  function buildBracket(data, standings) {
    var byGroup = {};
    (standings || buildAllStandings(data)).forEach(function (group) {
      byGroup[group.groupId] = group;
    });

    return {
      status: data.knockoutBracket && data.knockoutBracket.status ? data.knockoutBracket.status : 'placeholder',
      rounds: ((data.knockoutBracket && data.knockoutBracket.rounds) || []).map(function (round) {
        var slots = round.slots || [];
        if (!slots.length && round.matchIds && round.matchIds.length) {
          slots = round.matchIds.map(function (matchId) {
            return { slotId: matchId, label: matchId, source: 'match', teamId: null };
          });
        }
        if (!slots.length && round.roundId === 'round_of_32') {
          slots = Object.keys(byGroup).slice(0, 8).map(function (groupId) {
            return [
              { slotId: groupId + '-winner', label: byGroup[groupId].name + ' winner', source: 'group_position', groupId: groupId, position: 1 },
              { slotId: groupId + '-runner-up', label: byGroup[groupId].name + ' runner-up', source: 'group_position', groupId: groupId, position: 2 }
            ];
          }).reduce(function (acc, pair) { return acc.concat(pair); }, []);
        }

        return {
          roundId: round.roundId,
          label: round.label,
          slots: slots.map(function (slot) {
            var team = null;
            var sourceGroup = slot.groupId ? byGroup[slot.groupId] : null;
            if (slot.teamId) {
              team = (data.teams || []).find(function (item) { return item.teamId === slot.teamId; }) || null;
            } else if (sourceGroup && slot.position && sourceGroup.hasResults) {
              var row = sourceGroup.rows[slot.position - 1];
              team = row ? { teamId: row.teamId, name: row.teamName, shortLabel: row.shortLabel, isAfricanTeam: row.isAfricanTeam } : null;
            }
            return {
              slotId: slot.slotId,
              label: slot.label,
              source: slot.source,
              teamId: team ? team.teamId : null,
              teamName: team ? team.name : slot.label,
              shortLabel: team && team.shortLabel ? team.shortLabel : 'TBD',
              isAfricanTeam: Boolean(team && team.isAfricanTeam),
              isPlaceholder: !team
            };
          })
        };
      })
    };
  }

  return {
    isCountableFixture: isCountableFixture,
    calculateGroupStandings: calculateGroupStandings,
    buildAllStandings: buildAllStandings,
    buildBracket: buildBracket,
    compareRows: compareRows
  };
});
