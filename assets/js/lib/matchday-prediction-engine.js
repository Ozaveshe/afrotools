(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.matchdayPrediction = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  var DEFAULT_SCORING = {
    correctWinner: 3,
    correctDraw: 4,
    exactScore: 8,
    correctGroupQualifier: 10,
    correctChampion: 25,
    africanTeamBonus: 2
  };

  function numberOrNull(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeScoring(scoring) {
    return Object.assign({}, DEFAULT_SCORING, scoring || {});
  }

  function getTeam(teams, teamId) {
    return (teams || []).find(function (team) {
      return team.teamId === teamId;
    }) || null;
  }

  function isAfricanTeam(teams, teamId) {
    var team = getTeam(teams, teamId);
    return Boolean(team && team.isAfricanTeam);
  }

  function actualFixtureOutcome(fixture) {
    if (!fixture || fixture.status !== 'full_time' || fixture.resultFinal !== true) return null;
    var homeScore = numberOrNull(fixture.homeScore);
    var awayScore = numberOrNull(fixture.awayScore);
    if (homeScore === null || awayScore === null) return null;
    if (homeScore === awayScore) return 'draw';
    return homeScore > awayScore ? fixture.homeTeamId : fixture.awayTeamId;
  }

  function hasAfricanFixtureBonus(teams, fixture, pick) {
    if (!fixture || !pick) return false;
    if (pick.resultPick === 'draw') {
      return isAfricanTeam(teams, fixture.homeTeamId) || isAfricanTeam(teams, fixture.awayTeamId);
    }
    return isAfricanTeam(teams, pick.resultPick);
  }

  function scoreMatchPick(pick, fixture, config, teams) {
    var scoring = normalizeScoring(config);
    var actualOutcome = actualFixtureOutcome(fixture);
    var breakdown = [];
    if (!actualOutcome || !pick) return { total: 0, breakdown: breakdown, locked: false, scoreable: false };

    var predictedHome = numberOrNull(pick.homeScore);
    var predictedAway = numberOrNull(pick.awayScore);
    var exactScore = predictedHome === numberOrNull(fixture.homeScore) && predictedAway === numberOrNull(fixture.awayScore);

    if (exactScore) {
      breakdown.push({ rule: 'exactScore', points: scoring.exactScore });
    } else if (pick.resultPick === 'draw' && actualOutcome === 'draw') {
      breakdown.push({ rule: 'correctDraw', points: scoring.correctDraw });
    } else if (pick.resultPick && pick.resultPick === actualOutcome) {
      breakdown.push({ rule: 'correctWinner', points: scoring.correctWinner });
    }

    if (breakdown.length && hasAfricanFixtureBonus(teams, fixture, pick)) {
      breakdown.push({ rule: 'africanTeamBonus', points: scoring.africanTeamBonus });
    }

    return {
      total: breakdown.reduce(function (sum, item) { return sum + item.points; }, 0),
      breakdown: breakdown,
      locked: false,
      scoreable: true
    };
  }

  function scoreGroupQualifiersPick(pick, truth, config, teams) {
    var scoring = normalizeScoring(config);
    var actual = truth && Array.isArray(truth.groupQualifiers) ? truth.groupQualifiers : [];
    var predicted = pick && Array.isArray(pick.teamIds) ? pick.teamIds : [];
    var breakdown = [];
    predicted.forEach(function (teamId) {
      if (teamId && actual.indexOf(teamId) !== -1) {
        breakdown.push({ rule: 'correctGroupQualifier', teamId: teamId, points: scoring.correctGroupQualifier });
        if (isAfricanTeam(teams, teamId)) {
          breakdown.push({ rule: 'africanTeamBonus', teamId: teamId, points: scoring.africanTeamBonus });
        }
      }
    });
    return {
      total: breakdown.reduce(function (sum, item) { return sum + item.points; }, 0),
      breakdown: breakdown,
      scoreable: actual.length > 0
    };
  }

  function scoreChampionPick(teamId, truth, config, teams) {
    var scoring = normalizeScoring(config);
    var breakdown = [];
    if (teamId && truth && truth.championTeamId && teamId === truth.championTeamId) {
      breakdown.push({ rule: 'correctChampion', points: scoring.correctChampion });
      if (isAfricanTeam(teams, teamId)) {
        breakdown.push({ rule: 'africanTeamBonus', points: scoring.africanTeamBonus });
      }
    }
    return {
      total: breakdown.reduce(function (sum, item) { return sum + item.points; }, 0),
      breakdown: breakdown,
      scoreable: Boolean(truth && truth.championTeamId)
    };
  }

  function isLocked(lockDeadlineUtc, nowUtc) {
    if (!lockDeadlineUtc) return false;
    var deadline = new Date(lockDeadlineUtc).getTime();
    var now = nowUtc ? new Date(nowUtc).getTime() : Date.now();
    if (Number.isNaN(deadline) || Number.isNaN(now)) return false;
    return now >= deadline;
  }

  function calculateUserScore(userPrediction, truth, config, teams, fixtures) {
    var scoring = normalizeScoring(config);
    var total = 0;
    var sections = {};
    if (!userPrediction) return { total: 0, sections: sections, scoring: scoring };

    if (userPrediction.matchPick) {
      var fixture = (fixtures || []).find(function (item) {
        return item.matchId === userPrediction.matchPick.matchId;
      });
      sections.matchPick = scoreMatchPick(userPrediction.matchPick, fixture, scoring, teams);
      total += sections.matchPick.total;
    }

    if (userPrediction.groupQualifiers) {
      sections.groupQualifiers = scoreGroupQualifiersPick(userPrediction.groupQualifiers, truth, scoring, teams);
      total += sections.groupQualifiers.total;
    }

    if (userPrediction.tournamentPicks && userPrediction.tournamentPicks.championTeamId) {
      sections.champion = scoreChampionPick(userPrediction.tournamentPicks.championTeamId, truth, scoring, teams);
      total += sections.champion.total;
    }

    return { total: total, sections: sections, scoring: scoring };
  }

  return {
    DEFAULT_SCORING: DEFAULT_SCORING,
    normalizeScoring: normalizeScoring,
    isLocked: isLocked,
    scoreMatchPick: scoreMatchPick,
    scoreGroupQualifiersPick: scoreGroupQualifiersPick,
    scoreChampionPick: scoreChampionPick,
    calculateUserScore: calculateUserScore
  };
});
