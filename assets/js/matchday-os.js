(function () {
  'use strict';

  var DATA_URL = '/data/matchday-os/tournament.json';
  var CONTENT_URL = '/data/matchday-os/content.json';
  var PREDICTION_STORAGE_KEY = 'matchday_os_prediction_game';
  var FAN_POINTS_STORAGE_KEY = 'matchday_os_fan_points';
  var FAN_PROFILE_STORAGE_KEY = 'matchday_os_fan_profile';
  var state = {
    data: null,
    content: null,
    timezone: 'Africa/Lagos',
    watchlist: loadJson('matchday_os_watchlist', []),
    prediction: loadJson(PREDICTION_STORAGE_KEY, null),
    fanPoints: loadJson(FAN_POINTS_STORAGE_KEY, { events: [] })
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function loadJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore private browsing storage errors. The UI still works for the session.
    }
  }

  function escapeHtml(value) {
    return String(value === null || typeof value === 'undefined' ? '' : value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function formatKickoff(isoString) {
    if (!isoString) return 'Kickoff pending';
    try {
      return new Intl.DateTimeFormat('en', {
        timeZone: state.timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      }).format(new Date(isoString));
    } catch (error) {
      return 'Time pending';
    }
  }

  function getTeam(teamId) {
    if (!teamId || !state.data || !Array.isArray(state.data.teams)) return null;
    return state.data.teams.find(function (team) {
      return team.teamId === teamId;
    }) || null;
  }

  function getVenue(venueId) {
    if (!venueId || !state.data || !Array.isArray(state.data.stadiums)) return null;
    return state.data.stadiums.find(function (venue) {
      return venue.venueId === venueId;
    }) || null;
  }

  function getStatusLabel(status) {
    var entry = state.data && Array.isArray(state.data.matchStatuses)
      ? state.data.matchStatuses.find(function (item) { return item.status === status; })
      : null;
    return entry ? entry.label : status;
  }

  function getStageLabel(stage) {
    var entry = state.data && Array.isArray(state.data.tournamentPhases)
      ? state.data.tournamentPhases.find(function (item) { return item.phaseId === stage; })
      : null;
    return entry ? entry.label : stage;
  }

  function teamName(teamId) {
    var team = getTeam(teamId);
    return team ? team.name : 'Team pending';
  }

  function teamShort(teamId) {
    var team = getTeam(teamId);
    return team ? team.shortLabel : 'TBD';
  }

  function getAfricanTeams() {
    return (state.data && state.data.teams ? state.data.teams : []).filter(function (team) {
      return team.isAfricanTeam;
    });
  }

  function getPickableTeams() {
    return (state.data && state.data.teams ? state.data.teams : []).filter(function (team) {
      return team.teamId && team.teamId.indexOf('tbd-') !== 0;
    });
  }

  function getFixture(matchId) {
    return (state.data && state.data.fixtures ? state.data.fixtures : []).find(function (fixture) {
      return fixture.matchId === matchId;
    }) || null;
  }

  function getGroup(groupId) {
    return (state.data && state.data.groups ? state.data.groups : []).find(function (group) {
      return group.groupId === groupId;
    }) || null;
  }

  function getPredictionGame() {
    return state.data && state.data.predictionGame ? state.data.predictionGame : {};
  }

  function getPredictionEngine() {
    return window.AfroTools && window.AfroTools.matchdayPrediction;
  }

  function getSafetyEngine() {
    return window.AfroTools && window.AfroTools.matchdayContestSafety;
  }

  function getFanPointsEngine() {
    return window.AfroTools && window.AfroTools.matchdayFanPoints;
  }

  function getFanPointsConfig() {
    return getPredictionGame().fanPoints || {};
  }

  function getFanProfile() {
    var profile = loadJson(FAN_PROFILE_STORAGE_KEY, null);
    if (profile && profile.localFanId) return profile;
    profile = {
      localFanId: 'fan-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      mode: 'local-demo'
    };
    saveJson(FAN_PROFILE_STORAGE_KEY, profile);
    return profile;
  }

  function getReferralLink() {
    var profile = getFanProfile();
    return window.location.origin + '/matchday-os/?ref=' + encodeURIComponent(profile.localFanId);
  }

  function trackFanEvent(type, detail) {
    var payload = detail || {};
    var events = Array.isArray(state.fanPoints.events) ? state.fanPoints.events.slice() : [];
    events.push(Object.assign({
      eventId: 'fan-event-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      type: type,
      timestamp: new Date().toISOString(),
      source: 'matchday-os-public',
      localOnly: true
    }, payload));
    state.fanPoints = { mode: 'local-demo', updatedAt: new Date().toISOString(), events: events.slice(-100) };
    saveJson(FAN_POINTS_STORAGE_KEY, state.fanPoints);
    renderFanPointsSystem();
  }

  function recordReferralVisit() {
    var params = new URLSearchParams(window.location.search);
    var referrerId = params.get('ref');
    if (!referrerId) return;
    var profile = getFanProfile();
    trackFanEvent('referral_visit', {
      referrerId: referrerId,
      referredUserId: profile.localFanId,
      referralSource: 'url_ref',
      selfReferral: referrerId === profile.localFanId
    });
  }

  function renderTeamOptions(teams, selectedValue, includeBlank) {
    var options = includeBlank ? '<option value="">Select team</option>' : '';
    return options + (teams || []).map(function (team) {
      return '<option value="' + escapeHtml(team.teamId) + '"' + (team.teamId === selectedValue ? ' selected' : '') + '>' +
        escapeHtml(team.name) +
        '</option>';
    }).join('');
  }

  function isFixtureToday(fixture) {
    if (!fixture.kickoffUtc) return false;
    try {
      var nowKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: state.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
      var fixtureKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: state.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(fixture.kickoffUtc));
      return nowKey === fixtureKey;
    } catch (error) {
      return false;
    }
  }

  function fixtureSortValue(fixture) {
    return fixture.kickoffUtc ? new Date(fixture.kickoffUtc).getTime() : Number.MAX_SAFE_INTEGER;
  }

  function renderEmpty(title, copy) {
    return '<article class="matchday-empty">' +
      '<h3>' + escapeHtml(title) + '</h3>' +
      '<p>' + escapeHtml(copy) + '</p>' +
      '</article>';
  }

  function render() {
    if (!state.data) return;
    state.timezone = state.timezone || (state.data.timeZones && state.data.timeZones.defaultTimeZone) || 'Africa/Lagos';
    renderNotice();
    renderTimezone();
    renderToday();
    renderTeams();
    renderFixtures();
    renderGroups();
    renderBracket();
    renderContent();
    renderLiveDesk();
    renderCommunityDesk();
    renderCountryRooms();
    renderPredictionGame();
  }

  function renderNotice() {
    var el = $('[data-matchday-notice]');
    if (el) {
      el.textContent = (state.data.updatePolicy && state.data.updatePolicy.placeholderPolicy) || state.data.rightsNotice || '';
    }
    var reviewed = $('[data-matchday-reviewed]');
    if (reviewed) {
      reviewed.textContent = 'Data reviewed ' + (state.data.lastReviewed || 'pending');
    }
  }

  function renderTimezone() {
    var select = $('[data-timezone-select]');
    if (!select || select.dataset.ready) return;

    var cities = state.data.timeZones && state.data.timeZones.displayCities ? state.data.timeZones.displayCities : [];
    select.innerHTML = cities.map(function (zone) {
      return '<option value="' + escapeHtml(zone.timeZone) + '">' +
        escapeHtml(zone.city + ' - ' + zone.offsetHint) +
        '</option>';
    }).join('');
    state.timezone = (state.data.timeZones && state.data.timeZones.defaultTimeZone) || state.timezone;
    select.value = state.timezone;
    select.dataset.ready = 'true';
    select.addEventListener('change', function () {
      state.timezone = select.value || 'Africa/Lagos';
      renderToday();
      renderFixtures();
    });
  }

  function renderToday() {
    var grid = $('[data-today-panel]');
    if (!grid) return;
    var today = (state.data.fixtures || []).filter(isFixtureToday);
    if (!today.length) {
      grid.innerHTML = renderEmpty(
        'No verified matches for today yet',
        'When a verified fixture lands on today in your selected African time zone, it will appear here. Placeholder fixtures stay out of this live-style panel.'
      );
      return;
    }

    grid.innerHTML = today.map(renderFixtureCard).join('');
  }

  function renderTeams() {
    var grid = $('[data-team-grid]');
    if (!grid) return;

    grid.innerHTML = (state.data.teams || []).filter(function (team) {
      return team.isAfricanTeam;
    }).map(function (team) {
      var active = state.watchlist.indexOf(team.teamId) !== -1;
      return '<article class="team-card" data-team-card="' + escapeHtml(team.teamId) + '">' +
        '<div class="team-card__top">' +
        '<span class="team-code" style="--team-primary:' + escapeHtml(team.primaryColor) + ';--team-secondary:' + escapeHtml(team.secondaryColor) + '">' + escapeHtml(team.shortLabel) + '</span>' +
        '<span class="team-status">' + escapeHtml(team.qualificationStatus) + '</span>' +
        '</div>' +
        '<h3>' + escapeHtml(team.name) + '</h3>' +
        '<p>' + escapeHtml(team.seedStory || 'Team context pending verified editorial update.') + '</p>' +
        '<div class="team-card__actions">' +
        '<button type="button" class="team-watch" data-watch-team="' + escapeHtml(team.teamId) + '">' + (active ? 'Pinned' : 'Pin') + '</button>' +
        '<a href="' + escapeHtml(team.roomHref) + '">Country room</a>' +
        '</div>' +
        '</article>';
    }).join('');

    $all('[data-watch-team]', grid).forEach(function (button) {
      button.addEventListener('click', function () {
        var code = button.getAttribute('data-watch-team');
        var index = state.watchlist.indexOf(code);
        if (index === -1) {
          state.watchlist.push(code);
        } else {
          state.watchlist.splice(index, 1);
        }
        saveJson('matchday_os_watchlist', state.watchlist);
        renderTeams();
        renderWatchlistCount();
      });
    });

    renderWatchlistCount();
  }

  function renderWatchlistCount() {
    var count = $('[data-watchlist-count]');
    if (count) count.textContent = String(state.watchlist.length);
  }

  function renderFixtures() {
    var grid = $('[data-fixture-grid]');
    if (!grid) return;
    var fixtures = (state.data.fixtures || [])
      .filter(function (fixture) { return fixture.isAfricaFocus; })
      .sort(function (a, b) { return fixtureSortValue(a) - fixtureSortValue(b); });

    if (!fixtures.length) {
      grid.innerHTML = renderEmpty(
        'No African-team fixtures loaded',
        'Add verified fixture records to data/matchday-os/tournament.json and rerun the validator.'
      );
      return;
    }

    grid.innerHTML = fixtures.map(renderFixtureCard).join('');
  }

  function renderFixtureCard(fixture) {
    var venue = getVenue(fixture.venue);
    var venueLabel = venue ? venue.name + (venue.city ? ', ' + venue.city : '') : 'Venue pending';
    var markets = (fixture.featuredMarkets || []).slice(0, 4).join(' | ');
    return '<article class="fixture-card' + (fixture.isPlaceholder ? ' fixture-card--placeholder' : '') + '">' +
      '<div class="fixture-card__meta">' +
      '<span>' + escapeHtml(getStageLabel(fixture.stage)) + '</span>' +
      '<span>' + escapeHtml(getStatusLabel(fixture.status)) + '</span>' +
      '</div>' +
      '<div class="fixture-card__teams">' +
      '<strong><em>' + escapeHtml(teamShort(fixture.homeTeamId)) + '</em>' + escapeHtml(teamName(fixture.homeTeamId)) + '</strong>' +
      '<span>vs</span>' +
      '<strong><em>' + escapeHtml(teamShort(fixture.awayTeamId)) + '</em>' + escapeHtml(teamName(fixture.awayTeamId)) + '</strong>' +
      '</div>' +
      '<p>' + escapeHtml(formatKickoff(fixture.kickoffUtc)) + '</p>' +
      '<small>' + escapeHtml(venueLabel) + '</small>' +
      (markets ? '<small>Markets: ' + escapeHtml(markets) + '</small>' : '') +
      '</article>';
  }

  function renderGroups() {
    var grid = $('[data-group-grid]');
    if (!grid) return;

    var engine = window.AfroTools && window.AfroTools.matchdayStandings;
    var groups = engine ? engine.buildAllStandings(state.data) : [];

    if (!groups.length) {
      grid.innerHTML = renderEmpty(
        'No group tables loaded',
        'Add group records to data/matchday-os/tournament.json before standings can render.'
      );
      return;
    }

    grid.innerHTML = groups.map(function (group) {
      var rows = (group.rows || []).map(function (row) {
        var form = row.form && row.form.length
          ? row.form.map(function (item) { return '<span>' + escapeHtml(item) + '</span>'; }).join('')
          : '<em>Pending</em>';
        return '<tr class="' + (row.isAfricanTeam ? 'is-african-team' : '') + '">' +
          '<td data-label="Team"><strong>' + escapeHtml(row.teamName) + '</strong><small>' + escapeHtml(row.qualificationLabel) + '</small></td>' +
          '<td data-label="P">' + escapeHtml(row.played) + '</td>' +
          '<td data-label="W">' + escapeHtml(row.won) + '</td>' +
          '<td data-label="D">' + escapeHtml(row.drawn) + '</td>' +
          '<td data-label="L">' + escapeHtml(row.lost) + '</td>' +
          '<td data-label="GF">' + escapeHtml(row.goalsFor) + '</td>' +
          '<td data-label="GA">' + escapeHtml(row.goalsAgainst) + '</td>' +
          '<td data-label="GD">' + escapeHtml(row.goalDiff) + '</td>' +
          '<td data-label="Pts"><strong>' + escapeHtml(row.points) + '</strong></td>' +
          '<td data-label="Form"><span class="form-strip">' + form + '</span></td>' +
          '</tr>' +
          (row.isAfricanTeam ? '<tr class="team-meaning-row"><td colspan="10"><span>What this means:</span> ' + escapeHtml(row.meaning) + '</td></tr>' : '');
      }).join('');
      return '<article class="group-card">' +
        '<div class="group-card__head"><h3>' + escapeHtml(group.name) + '</h3><span>' + escapeHtml(group.hasResults ? 'Updated ' + group.updatedAt : 'No verified scores') + '</span></div>' +
        (!group.hasResults ? '<div class="group-empty-note">No final scores counted yet. Placeholder or scheduled fixtures do not change the table.</div>' : '') +
        '<table><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Form</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p class="group-tiebreak-note">' + escapeHtml(group.tieBreakNote) + '</p>' +
        '</article>';
    }).join('');
  }

  function renderBracket() {
    var grid = $('[data-bracket-grid]');
    if (!grid) return;

    var engine = window.AfroTools && window.AfroTools.matchdayStandings;
    if (!engine) {
      grid.innerHTML = renderEmpty('Bracket engine unavailable', 'The standings engine did not load, so bracket slots cannot be calculated.');
      return;
    }

    var standings = engine.buildAllStandings(state.data);
    var bracket = engine.buildBracket(state.data, standings);
    if (!bracket.rounds || !bracket.rounds.length) {
      grid.innerHTML = renderEmpty('No bracket rounds configured', 'Add knockoutBracket.rounds to the Matchday OS data file.');
      return;
    }

    grid.innerHTML = bracket.rounds.map(function (round) {
      var slots = (round.slots || []).length ? round.slots : [{ slotId: round.roundId + '-placeholder', teamName: 'Teams pending', shortLabel: 'TBD', isPlaceholder: true }];
      return '<article class="bracket-round">' +
        '<h3>' + escapeHtml(round.label) + '</h3>' +
        '<div class="bracket-slots">' +
        slots.map(function (slot) {
          return '<div class="bracket-slot' + (slot.isAfricanTeam ? ' is-african-team' : '') + (slot.isPlaceholder ? ' is-placeholder' : '') + '">' +
            '<span>' + escapeHtml(slot.shortLabel || 'TBD') + '</span>' +
            '<strong>' + escapeHtml(slot.teamName || slot.label || 'Team pending') + '</strong>' +
            '</div>';
        }).join('') +
        '</div>' +
        '</article>';
    }).join('');
  }

  function renderContent() {
    var grid = $('[data-content-grid]');
    if (!grid) return;
    var contentPosts = state.content && Array.isArray(state.content.dailyMatchPreviews) ? state.content.dailyMatchPreviews : [];
    var cards = contentPosts.length ? contentPosts.map(function (post) {
      return {
        href: post.href || '/blog/',
        type: post.label || post.type,
        title: post.title,
        copy: post.summary
      };
    }) : (state.data.contextModules || []);
    grid.innerHTML = cards.map(function (item) {
      return '<a class="matchday-card matchday-card--link" href="' + escapeHtml(item.href) + '">' +
        '<span class="matchday-pill">' + escapeHtml(item.type) + '</span>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.copy) + '</p>' +
        '</a>';
    }).join('');
  }

  function renderLiveDesk() {
    var grid = $('[data-live-desk]');
    if (!grid || !state.content) return;
    var featured = state.content.featuredSlots || {};
    var tomorrow = (state.content.tomorrowInAfricanFootball || [])[0];
    var watch = (state.content.africanTeamWatch || [])[0];
    var reaction = (state.content.postMatchReactions || [])[0];
    var meaning = (state.content.resultMeaningTemplates || [])[0];
    var cards = [
      featured.matchOfTheDay,
      featured.playerToWatch,
      featured.groupPressureMeter,
      tomorrow,
      watch,
      reaction,
      meaning
    ].filter(Boolean);
    grid.innerHTML = cards.map(function (card) {
      return '<article class="desk-card">' +
        '<span class="matchday-pill">' + escapeHtml(card.label || card.type || 'Desk') + '</span>' +
        '<h3>' + escapeHtml(card.title) + '</h3>' +
        '<p>' + escapeHtml(card.summary) + '</p>' +
        renderTeamTags(card.teamIds) +
      '</article>';
    }).join('');
  }

  function renderTeamTags(teamIds) {
    var ids = (teamIds || []).filter(Boolean).slice(0, 5);
    if (!ids.length) return '';
    return '<div class="team-tag-row">' + ids.map(function (teamId) {
      return '<span>' + escapeHtml(teamShort(teamId)) + '</span>';
    }).join('') + '</div>';
  }

  function renderCommunityDesk() {
    var strategyGrid = $('[data-strategy-grid]');
    var pollGrid = $('[data-poll-grid]');
    if (!state.content) return;
    if (strategyGrid) {
      strategyGrid.innerHTML = (state.content.strategyPrompts || []).map(function (prompt) {
        return '<article class="strategy-card">' +
          '<span class="matchday-pill">' + escapeHtml(prompt.type || 'Strategy') + '</span>' +
          '<h3>' + escapeHtml(prompt.title) + '</h3>' +
          '<p>' + escapeHtml(prompt.body) + '</p>' +
          renderTeamTags(prompt.teamIds) +
          '<small>Editorial prompt, not a user comment thread.</small>' +
        '</article>';
      }).join('');
    }
    if (pollGrid) {
      pollGrid.innerHTML = (state.content.fanPolls || []).map(function (poll) {
        return '<article class="poll-card" data-poll-card>' +
          '<span class="matchday-pill">' + escapeHtml(poll.label || 'Fan poll') + '</span>' +
          '<h3>' + escapeHtml(poll.question) + '</h3>' +
          '<div class="poll-options">' + (poll.options || []).map(function (option) {
            return '<button type="button" data-poll-option>' + escapeHtml(option) + '</button>';
          }).join('') + '</div>' +
          '<p class="matchday-note">' + escapeHtml(poll.note || 'Poll shell only.') + '</p>' +
        '</article>';
      }).join('');
    }
  }

  function renderCountryRooms() {
    var grid = $('[data-room-grid]');
    if (!grid || !state.content) return;
    grid.innerHTML = (state.content.countryRooms || []).map(function (room) {
      var team = getTeam(room.teamId);
      if (!team) return '';
      return '<a class="room-card" href="/matchday-os/rooms/?team=' + escapeHtml(team.teamId) + '">' +
        '<span class="team-code" style="--team-primary:' + escapeHtml(team.primaryColor) + ';--team-secondary:' + escapeHtml(team.secondaryColor) + '">' + escapeHtml(team.shortLabel) + '</span>' +
        '<div><h3>' + escapeHtml(team.name) + '</h3><p>' + escapeHtml(room.discussionPrompt) + '</p></div>' +
        '<strong>Open room</strong>' +
      '</a>';
    }).join('');
  }

  function renderPredictionGame() {
    renderPredictionLock();
    renderPredictionCards();
    renderPointsExplainer();
    renderPicksSummary();
    renderLeaderboardShell();
    renderFanPointsSystem();
    renderTrustCopy();
    renderOperatorShell();
    renderResponsiblePlayNote();
  }

  function renderPredictionLock() {
    var lock = $('[data-prediction-lock]');
    if (!lock) return;
    var game = getPredictionGame();
    var engine = getPredictionEngine();
    var nextFixture = (state.data.fixtures || []).filter(function (fixture) {
      return fixture.isAfricaFocus;
    }).sort(function (a, b) {
      return fixtureSortValue(a) - fixtureSortValue(b);
    })[0];
    var locked = Boolean(nextFixture && nextFixture.kickoffUtc && engine && engine.isLocked(nextFixture.kickoffUtc));
    var lockCopy = nextFixture && nextFixture.kickoffUtc
      ? (locked ? 'Locked for first fixture: ' : 'Open until first fixture: ') + formatKickoff(nextFixture.kickoffUtc)
      : (game.lockPolicy && game.lockPolicy.placeholderLockCopy) || 'Lock deadline appears after verified kickoff data is loaded.';
    lock.innerHTML = '<strong>' + escapeHtml((game.lockPolicy && game.lockPolicy.label) || 'Predictions lock before kickoff') + '</strong>' +
      '<span>' + escapeHtml(lockCopy) + '</span>';
  }

  function renderPredictionCards() {
    var grid = $('[data-prediction-entry-cards]');
    if (!grid || !state.data) return;
    var fixtures = (state.data.fixtures || []).filter(function (fixture) { return fixture.isAfricaFocus; });
    var groups = state.data.groups || [];
    var africanTeams = getAfricanTeams();
    var teams = getPickableTeams();
    var pick = state.prediction || {};
    var matchPick = pick.matchPick || {};
    var groupPick = pick.groupQualifiers || {};
    var tournamentPick = pick.tournamentPicks || {};
    var selectedFixture = getFixture(matchPick.matchId) || fixtures[0] || {};
    var selectedGroup = getGroup(groupPick.groupId) || groups[0] || {};
    var fixtureOptions = fixtures.map(function (fixture) {
      var label = teamShort(fixture.homeTeamId) + ' vs ' + teamShort(fixture.awayTeamId) + ' - ' + getStatusLabel(fixture.status);
      return '<option value="' + escapeHtml(fixture.matchId) + '"' + (fixture.matchId === selectedFixture.matchId ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
    var groupOptions = groups.map(function (group) {
      return '<option value="' + escapeHtml(group.groupId) + '"' + (group.groupId === selectedGroup.groupId ? ' selected' : '') + '>' + escapeHtml(group.name) + '</option>';
    }).join('');

    grid.innerHTML =
      '<article class="prediction-entry-card">' +
        '<div class="prediction-entry-card__head"><span class="matchday-pill">Fixture pick</span><strong>Match call</strong></div>' +
        '<p>Choose a result, draw, and exact score for one Africa-focused fixture. Seed fixtures are labeled until verified kickoff data arrives.</p>' +
        '<label>Fixture<select name="matchId">' + fixtureOptions + '</select></label>' +
        '<label>Result pick<select name="matchResultPick">' +
          '<option value="draw"' + (matchPick.resultPick === 'draw' ? ' selected' : '') + '>Draw</option>' +
          renderTeamOptions([getTeam(selectedFixture.homeTeamId), getTeam(selectedFixture.awayTeamId)].filter(Boolean), matchPick.resultPick, false) +
        '</select></label>' +
        '<div class="score-pair">' +
          '<label>Home score<input name="matchHomeScore" type="number" min="0" max="20" value="' + escapeHtml(matchPick.homeScore === 0 || matchPick.homeScore ? matchPick.homeScore : '') + '" placeholder="0"></label>' +
          '<label>Away score<input name="matchAwayScore" type="number" min="0" max="20" value="' + escapeHtml(matchPick.awayScore === 0 || matchPick.awayScore ? matchPick.awayScore : '') + '" placeholder="0"></label>' +
        '</div>' +
        '<small>Predictions lock before kickoff. Placeholder fixtures stay local/demo only.</small>' +
      '</article>' +
      '<article class="prediction-entry-card">' +
        '<div class="prediction-entry-card__head"><span class="matchday-pill">Group race</span><strong>Group qualifiers</strong></div>' +
        '<p>Pick two teams to qualify from the selected group. Current groups are placeholders, so this is a local planning state.</p>' +
        '<label>Group<select name="groupId">' + groupOptions + '</select></label>' +
        '<label>Qualifier 1<select name="groupQualifier1">' + renderTeamOptions(teams, (groupPick.teamIds || [])[0], true) + '</select></label>' +
        '<label>Qualifier 2<select name="groupQualifier2">' + renderTeamOptions(teams, (groupPick.teamIds || [])[1], true) + '</select></label>' +
        '<small>Qualifier scoring starts only after verified group results are available.</small>' +
      '</article>' +
      '<article class="prediction-entry-card prediction-entry-card--path">' +
        '<div class="prediction-entry-card__head"><span class="matchday-pill">Tournament path</span><strong>Africa progress</strong></div>' +
        '<p>Build the full path: best African team, semi-finalists, finalists, and champion.</p>' +
        '<label>Best African team<select name="bestAfricanTeamId">' + renderTeamOptions(africanTeams, tournamentPick.bestAfricanTeamId, true) + '</select></label>' +
        '<div class="path-grid">' +
          '<label>Semi-finalist 1<select name="semiFinalist1">' + renderTeamOptions(teams, (tournamentPick.semiFinalistTeamIds || [])[0], true) + '</select></label>' +
          '<label>Semi-finalist 2<select name="semiFinalist2">' + renderTeamOptions(teams, (tournamentPick.semiFinalistTeamIds || [])[1], true) + '</select></label>' +
          '<label>Semi-finalist 3<select name="semiFinalist3">' + renderTeamOptions(teams, (tournamentPick.semiFinalistTeamIds || [])[2], true) + '</select></label>' +
          '<label>Semi-finalist 4<select name="semiFinalist4">' + renderTeamOptions(teams, (tournamentPick.semiFinalistTeamIds || [])[3], true) + '</select></label>' +
          '<label>Finalist 1<select name="finalist1">' + renderTeamOptions(teams, (tournamentPick.finalistTeamIds || [])[0], true) + '</select></label>' +
          '<label>Finalist 2<select name="finalist2">' + renderTeamOptions(teams, (tournamentPick.finalistTeamIds || [])[1], true) + '</select></label>' +
        '</div>' +
        '<label>Champion<select name="championTeamId">' + renderTeamOptions(teams, tournamentPick.championTeamId, true) + '</select></label>' +
      '</article>';
  }

  function renderPointsExplainer() {
    var el = $('[data-points-explainer]');
    if (!el) return;
    var scoring = getPredictionGame().scoring || {};
    var rows = [
      ['Correct winner', scoring.correctWinner],
      ['Correct draw', scoring.correctDraw],
      ['Exact score', scoring.exactScore],
      ['Correct group qualifier', scoring.correctGroupQualifier],
      ['Correct champion', scoring.correctChampion],
      ['African team bonus', scoring.africanTeamBonus]
    ];
    el.innerHTML = '<h3>Points explainer</h3><ul>' + rows.map(function (row) {
      return '<li><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></li>';
    }).join('') + '</ul>';
  }

  function predictionResultLabel(value) {
    if (!value) return 'Pending';
    if (value === 'draw') return 'Draw';
    return teamName(value);
  }

  function scoreLabel(value) {
    return value === 0 || value ? String(value) : 'pending';
  }

  function renderPicksSummary() {
    var el = $('[data-picks-summary]');
    if (!el) return;
    if (!state.prediction) {
      el.innerHTML = '<h3>My picks</h3><p>No picks saved on this device yet. Choose your calls and save locally.</p>';
      return;
    }
    var termsInput = $('[name="termsAccepted"]');
    if (termsInput && state.prediction.safety && state.prediction.safety.termsAcceptedAt) {
      termsInput.checked = true;
    }
    var matchPick = state.prediction.matchPick || {};
    var groupPick = state.prediction.groupQualifiers || {};
    var tournamentPick = state.prediction.tournamentPicks || {};
    var score = getPredictionEngine()
      ? getPredictionEngine().calculateUserScore(state.prediction, {}, getPredictionGame().scoring, state.data.teams, state.data.fixtures)
      : { total: 0 };
    var groupTeams = (groupPick.teamIds || []).map(teamName).join(', ') || 'Pending';
    var semis = (tournamentPick.semiFinalistTeamIds || []).filter(Boolean).map(teamName).join(', ') || 'Pending';
    var finalists = (tournamentPick.finalistTeamIds || []).filter(Boolean).map(teamName).join(', ') || 'Pending';
    el.innerHTML = '<h3>My picks</h3>' +
      '<dl>' +
        '<div><dt>Match</dt><dd>' + escapeHtml(predictionResultLabel(matchPick.resultPick)) + ' ' + escapeHtml(scoreLabel(matchPick.homeScore)) + '-' + escapeHtml(scoreLabel(matchPick.awayScore)) + '</dd></div>' +
        '<div><dt>Group qualifiers</dt><dd>' + escapeHtml(groupTeams) + '</dd></div>' +
        '<div><dt>Best African team</dt><dd>' + escapeHtml(teamName(tournamentPick.bestAfricanTeamId)) + '</dd></div>' +
        '<div><dt>Semi-finalists</dt><dd>' + escapeHtml(semis) + '</dd></div>' +
        '<div><dt>Finalists</dt><dd>' + escapeHtml(finalists) + '</dd></div>' +
        '<div><dt>Champion</dt><dd>' + escapeHtml(teamName(tournamentPick.championTeamId)) + '</dd></div>' +
      '</dl>' +
      '<p class="prediction-status">Provisional local score: ' + escapeHtml(score.total) + '. Scores remain zero until verified final results exist.</p>' +
      '<p class="prediction-status">Leaderboard eligibility is not active: email verification, server-side locks, duplicate checks, and manual winner verification are not connected.</p>';
  }

  function renderLeaderboardShell() {
    var el = $('[data-leaderboard-shell]');
    if (!el) return;
    var leaderboard = getPredictionGame().leaderboard || {};
    el.innerHTML = '<h3>Leaderboard</h3>' +
      '<div class="leaderboard-empty">' +
        '<strong>No live rows yet</strong>' +
        '<p>' + escapeHtml(leaderboard.copy || 'Leaderboard opens after backend persistence and verified scoring are connected.') + '</p>' +
        '<a class="btn btn-secondary" href="/matchday-os/prizes/">Prize and payout rules</a>' +
      '</div>';
  }

  function renderFanPointsSystem() {
    var display = $('[data-fan-points-display]');
    var topFans = $('[data-top-fans-shell]');
    var flagsEl = $('[data-referral-flags]');
    var linkInput = $('[data-referral-link]');
    if (linkInput) linkInput.value = getReferralLink();

    var engine = getFanPointsEngine();
    var config = getFanPointsConfig();
    var events = Array.isArray(state.fanPoints.events) ? state.fanPoints.events : [];
    var score = engine ? engine.calculateFanScore(events, config.scoring) : { fanPoints: 0, pendingReferralPoints: 0, referralPoints: 0, maxReferralReward: 25 };
    var predictionPoints = getPredictionEngine() && state.prediction && state.data
      ? getPredictionEngine().calculateUserScore(state.prediction, {}, getPredictionGame().scoring, state.data.teams, state.data.fixtures).total
      : 0;

    if (display) {
      display.innerHTML = '<h4>Fan Points</h4>' +
        '<strong>' + escapeHtml(score.fanPoints) + '</strong>' +
        '<p>Local demo score. Prediction Points: ' + escapeHtml(predictionPoints) + '. Referral points confirmed: ' + escapeHtml(score.referralPoints) + '/' + escapeHtml(score.maxReferralReward) + '.</p>' +
        '<p>Pending referral points: ' + escapeHtml(score.pendingReferralPoints) + '. Backend verification is required before any referred-friend reward is awarded.</p>';
    }

    if (topFans) {
      topFans.innerHTML = '<h4>Top Fans</h4>' +
        '<ol class="top-fans-list">' +
          '<li><span>You</span><strong>' + escapeHtml(score.fanPoints) + ' FP</strong></li>' +
          '<li><span>Live Top Fans board</span><strong>Backend required</strong></li>' +
        '</ol>' +
        '<p>Top Fans is for badges, shoutouts, sponsor perks, and non-cash recognition. It is not the $1,200 prize leaderboard.</p>';
    }

    if (flagsEl && engine) {
      var flags = engine.findReferralFlags(events);
      var configText = config && config.abuseProtection ? config.abuseProtection.copy : 'Self-referrals, duplicate/device matches, repeated IP clusters, and rapid signups require backend review.';
      flagsEl.innerHTML = '<h4>Referral safeguards</h4>' +
        '<p>' + escapeHtml(configText) + '</p>' +
        '<p class="fan-flag-status">' + escapeHtml(flags.length ? flags.length + ' local demo flag(s) detected.' : 'No local referral flags in this browser session.') + '</p>';
    }
  }

  function renderTrustCopy() {
    var el = $('[data-trust-copy]');
    if (!el) return;
    var antiCheat = getPredictionGame().antiCheat || {};
    var items = antiCheat.publicTrustCopy || [];
    el.innerHTML = '<h3>Contest trust rules</h3>' +
      '<ul>' + items.map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>';
      }).join('') + '</ul>' +
      '<p>Prize launch is blocked until server-side anti-cheat, email verification, lock enforcement, and legal review are complete.</p>';
  }

  function renderOperatorShell() {
    var el = $('[data-operator-shell]');
    if (!el) return;
    var antiCheat = getPredictionGame().antiCheat || {};
    var shell = antiCheat.operatorShell || {};
    var launchGate = getSafetyEngine()
      ? getSafetyEngine().buildLaunchGate(antiCheat)
      : { blocked: true, blockers: ['safety-helper-not-loaded'] };
    var queues = [
      ['Flagged entries', shell.flaggedEntries],
      ['Duplicate signals', shell.duplicateSignals],
      ['Late entry attempts', shell.lateEntryAttempts],
      ['Manual verification status', shell.manualVerification]
    ];
    el.innerHTML = '<div class="matchday-section__head">' +
        '<div>' +
          '<span class="matchday-pill">Operator safety shell</span>' +
          '<h3 id="operatorSafetyTitle">Prize contest review queue</h3>' +
          '<p>' + escapeHtml(shell.copy || 'Operator review requires authenticated backend tooling and audit logs.') + '</p>' +
        '</div>' +
        '<button class="btn btn-secondary" type="button" disabled>Export leaderboard disabled</button>' +
      '</div>' +
      '<div class="operator-safety-grid">' +
        queues.map(function (queue) {
          var count = Array.isArray(queue[1]) ? queue[1].length : 0;
          return '<article class="operator-safety-card">' +
            '<strong>' + escapeHtml(count) + '</strong>' +
            '<span>' + escapeHtml(queue[0]) + '</span>' +
            '<p>Waiting for server-side signals and authenticated admin review.</p>' +
          '</article>';
        }).join('') +
      '</div>' +
      '<div class="operator-launch-gate">' +
        '<strong>' + escapeHtml(launchGate.blocked ? 'Prize launch blocked' : 'Prize launch review needed') + '</strong>' +
        '<span>' + escapeHtml((launchGate.blockers || []).join(', ')) + '</span>' +
      '</div>';
  }

  function renderResponsiblePlayNote() {
    var el = $('[data-responsible-play-note]');
    if (!el) return;
    el.textContent = getPredictionGame().responsiblePlayNote || el.textContent;
  }

  function compactTeamIds(ids) {
    var seen = [];
    (ids || []).forEach(function (teamId) {
      if (teamId && seen.indexOf(teamId) === -1) seen.push(teamId);
    });
    return seen;
  }

  function initPredictionForm() {
    var form = $('[data-prediction-form]');
    if (!form) return;

    form.addEventListener('change', function (event) {
      if (event.target && (event.target.name === 'matchId' || event.target.name === 'groupId')) {
        savePredictionFromForm(form, false);
        renderPredictionCards();
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      savePredictionFromForm(form, true);
    });
  }

  function initPollShell() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-poll-option]');
      if (!button) return;
      var card = button.closest('[data-poll-card], .room-panel');
      if (!card) return;
      $all('[data-poll-option]', card).forEach(function (item) {
        item.classList.remove('is-selected');
      });
      button.classList.add('is-selected');
      var note = $('.matchday-note', card);
      if (note) note.textContent = 'Local selection only. Vote totals need a backend before launch.';
    });
  }

  function savePredictionFromForm(form, showStatus) {
    var data = new FormData(form);
    var matchId = String(data.get('matchId') || '');
    var fixture = getFixture(matchId);
    var lockDeadlineUtc = fixture && fixture.kickoffUtc ? fixture.kickoffUtc : null;
    var safetyEngine = getSafetyEngine();
    var editCheck = safetyEngine ? safetyEngine.canEditPrediction({
      lockDeadlineUtc: lockDeadlineUtc,
      lockedAt: state.prediction && state.prediction.safety ? state.prediction.safety.lockedAt : null
    }) : { allowed: true };
    if (!editCheck.allowed) {
      var lockStatus = $('[data-prediction-status]');
      if (lockStatus) lockStatus.textContent = 'This fixture is locked. No edits are allowed after kickoff.';
      return;
    }
    var resultPick = String(data.get('matchResultPick') || 'draw');
    if (resultPick !== 'draw' && fixture && resultPick !== fixture.homeTeamId && resultPick !== fixture.awayTeamId) {
      resultPick = fixture.homeTeamId || 'draw';
    }
    var nowIso = new Date().toISOString();
    var termsAccepted = data.get('termsAccepted') === 'on';
    var existingTermsAcceptedAt = state.prediction && state.prediction.safety ? state.prediction.safety.termsAcceptedAt : null;
    state.prediction = {
      campaignId: getPredictionGame().campaignId || 'matchday-os-2026-skill-prize',
      entryMode: 'local-demo',
      matchPick: {
        matchId: matchId,
        resultPick: resultPick,
        homeScore: data.get('matchHomeScore') === '' ? null : Number(data.get('matchHomeScore')),
        awayScore: data.get('matchAwayScore') === '' ? null : Number(data.get('matchAwayScore'))
      },
      groupQualifiers: {
        groupId: String(data.get('groupId') || ''),
        teamIds: compactTeamIds([String(data.get('groupQualifier1') || ''), String(data.get('groupQualifier2') || '')])
      },
      tournamentPicks: {
        bestAfricanTeamId: String(data.get('bestAfricanTeamId') || ''),
        semiFinalistTeamIds: compactTeamIds([
          String(data.get('semiFinalist1') || ''),
          String(data.get('semiFinalist2') || ''),
          String(data.get('semiFinalist3') || ''),
          String(data.get('semiFinalist4') || '')
        ]),
        finalistTeamIds: compactTeamIds([String(data.get('finalist1') || ''), String(data.get('finalist2') || '')]),
        championTeamId: String(data.get('championTeamId') || '')
      },
      safety: {
        serverEnforced: false,
        emailVerified: false,
        eligibleForLeaderboard: false,
        lockDeadlineUtc: lockDeadlineUtc,
        lockedAt: null,
        submittedAt: nowIso,
        termsAcceptedAt: termsAccepted ? (existingTermsAcceptedAt || nowIso) : null,
        safetyMode: 'local-demo-no-prize-eligibility'
      },
      savedAt: nowIso
    };
    saveJson(PREDICTION_STORAGE_KEY, state.prediction);
    if (showStatus) {
      trackFanEvent('prediction_saved', { predictionSource: 'local-demo' });
    }
    renderPicksSummary();
    var status = $('[data-prediction-status]');
    if (status) {
      status.textContent = showStatus
        ? 'Picks saved locally on this device. Backend entries are not connected yet.'
        : 'Draft saved locally for this session.';
    }
  }

  function initShareButtons() {
    $all('[data-share-card]').forEach(function (button) {
      button.addEventListener('click', function () {
        var text = button.getAttribute('data-share-card') || 'I am building my Africa matchday watchlist on Matchday OS.';
        if (state.watchlist.length && state.data) {
          var firstTeam = getTeam(state.watchlist[0]);
          var template = state.data.shareCards && state.data.shareCards[0] ? state.data.shareCards[0].template : '';
          if (firstTeam && template) text = template.replace('{teamName}', firstTeam.name);
        }
        trackFanEvent('whatsapp_share', { shareSurface: button.getAttribute('data-share-card') || 'matchday-share' });
        var url = 'https://wa.me/?text=' + encodeURIComponent(text + ' https://afrotools.com/matchday-os/');
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    });
  }

  function initFanPointsActions() {
    document.addEventListener('click', function (event) {
      var copy = event.target.closest('[data-referral-copy]');
      if (copy) {
        var link = getReferralLink();
        trackFanEvent('referral_link_copied', { referrerId: getFanProfile().localFanId, referralSource: 'copy_link' });
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).then(function () {
            copy.textContent = 'Referral link copied';
          }).catch(function () {
            copy.textContent = 'Copy blocked';
          });
        } else {
          var input = $('[data-referral-link]');
          if (input) {
            input.focus();
            input.select();
          }
          copy.textContent = 'Link selected';
        }
      }

      var whatsapp = event.target.closest('[data-referral-whatsapp]');
      if (whatsapp) {
        trackFanEvent('whatsapp_share', { shareSurface: 'referral_invite', referrerId: getFanProfile().localFanId });
        var text = 'Bring your friends into Matchday OS. Earn Fan Points, climb the Top Fans board, and unlock badges. Cash-prize winners are decided by Prediction Points only.';
        window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + getReferralLink()), '_blank', 'noopener,noreferrer');
      }

      var shareCard = event.target.closest('[data-share-card-cta]');
      if (shareCard) {
        trackFanEvent('share_card_cta', { shareSurface: 'fan_points_panel' });
      }
    });
  }

  function boot() {
    initPredictionForm();
    initShareButtons();
    initFanPointsActions();
    initPollShell();
    recordReferralVisit();
    Promise.all([
      fetch(DATA_URL, { headers: { Accept: 'application/json' } }).then(function (response) {
        if (!response.ok) throw new Error('Could not load tournament data');
        return response.json();
      }),
      fetch(CONTENT_URL, { headers: { Accept: 'application/json' } }).then(function (response) {
        if (!response.ok) throw new Error('Could not load content data');
        return response.json();
      }).catch(function () {
        return null;
      })
    ])
      .then(function (payload) {
        state.data = payload[0];
        state.content = payload[1];
        render();
      })
      .catch(function () {
        var notice = $('[data-matchday-notice]');
        if (notice) notice.textContent = 'Seed data could not load. The page shell is still available.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
