(function () {
  'use strict';

  var TOURNAMENT_URL = '/data/matchday-os/tournament.json';
  var CONTENT_URL = '/data/matchday-os/content.json';
  var state = { tournament: null, content: null, teamId: null };

  function $(selector, root) {
    return (root || document).querySelector(selector);
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

  function getTeam(teamId) {
    return (state.tournament.teams || []).find(function (team) {
      return team.teamId === teamId;
    }) || null;
  }

  function getRoom(teamId) {
    return (state.content.countryRooms || []).find(function (room) {
      return room.teamId === teamId;
    }) || null;
  }

  function getPoll(pollId) {
    return (state.content.fanPolls || []).find(function (poll) {
      return poll.pollId === pollId;
    }) || null;
  }

  function getPost(postId) {
    return (state.content.dailyMatchPreviews || []).find(function (post) {
      return post.postId === postId;
    }) || null;
  }

  function teamName(teamId) {
    var team = getTeam(teamId);
    return team ? team.name : 'Team pending';
  }

  function teamShort(teamId) {
    var team = getTeam(teamId);
    return team ? team.shortLabel : 'TBD';
  }

  function africanTeams() {
    return (state.tournament.teams || []).filter(function (team) {
      return team.isAfricanTeam;
    });
  }

  function fixturesForTeam(teamId) {
    return (state.tournament.fixtures || []).filter(function (fixture) {
      return fixture.homeTeamId === teamId || fixture.awayTeamId === teamId;
    });
  }

  function groupForTeam(teamId) {
    return (state.tournament.groups || []).find(function (group) {
      return (group.teamIds || []).indexOf(teamId) !== -1;
    }) || null;
  }

  function standingsRow(teamId) {
    var engine = window.AfroTools && window.AfroTools.matchdayStandings;
    if (!engine) return null;
    var groups = engine.buildAllStandings(state.tournament);
    for (var i = 0; i < groups.length; i += 1) {
      var row = (groups[i].rows || []).find(function (item) {
        return item.teamId === teamId;
      });
      if (row) return row;
    }
    return null;
  }

  function selectedTeamId() {
    var params = new URLSearchParams(window.location.search);
    var requested = params.get('team') || window.location.hash.replace('#', '');
    if (requested && getTeam(requested)) return requested;
    var first = africanTeams()[0];
    return first ? first.teamId : null;
  }

  function renderSwitcher() {
    var el = $('[data-room-switcher]');
    if (!el) return;
    el.innerHTML = africanTeams().map(function (team) {
      var active = team.teamId === state.teamId;
      return '<a class="room-switch-link' + (active ? ' is-active' : '') + '" href="/matchday-os/rooms/?team=' + escapeHtml(team.teamId) + '">' +
        '<span style="--team-primary:' + escapeHtml(team.primaryColor) + ';--team-secondary:' + escapeHtml(team.secondaryColor) + '">' + escapeHtml(team.shortLabel) + '</span>' +
        '<strong>' + escapeHtml(team.name) + '</strong>' +
        '</a>';
    }).join('');
  }

  function renderHero() {
    var team = getTeam(state.teamId);
    var room = getRoom(state.teamId);
    var title = $('[data-room-title]');
    var copy = $('[data-room-copy]');
    var identity = $('[data-room-identity]');
    if (title) title.textContent = team ? team.name + ' matchday room' : 'Matchday OS country room';
    if (copy) copy.textContent = room ? room.discussionPrompt : 'Room prompt pending editorial update.';
    if (identity && team) {
      identity.innerHTML = '<span class="team-code" style="--team-primary:' + escapeHtml(team.primaryColor) + ';--team-secondary:' + escapeHtml(team.secondaryColor) + '">' + escapeHtml(team.shortLabel) + '</span>' +
        '<h2>' + escapeHtml(team.name) + '</h2>' +
        '<p>' + escapeHtml(team.seedStory || 'Team story pending editorial update.') + '</p>' +
        '<dl>' +
          '<div><dt>Region</dt><dd>' + escapeHtml(team.region || 'Africa') + '</dd></div>' +
          '<div><dt>Status</dt><dd>' + escapeHtml(team.qualificationStatus || 'pending') + '</dd></div>' +
          '<div><dt>Room mode</dt><dd>Seed shell, no fake live discussion</dd></div>' +
        '</dl>';
    }
  }

  function renderFixtureList(fixtures) {
    if (!fixtures.length) return '<p class="matchday-empty-note">Fixtures pending verified schedule data.</p>';
    return fixtures.map(function (fixture) {
      return '<div class="room-mini-row">' +
        '<strong>' + escapeHtml(teamShort(fixture.homeTeamId)) + ' vs ' + escapeHtml(teamShort(fixture.awayTeamId)) + '</strong>' +
        '<span>' + escapeHtml(fixture.status === 'placeholder' ? 'Fixture placeholder' : fixture.status) + '</span>' +
      '</div>';
    }).join('');
  }

  function renderPoll(poll) {
    if (!poll) return '<p class="matchday-empty-note">Fan poll prompt pending.</p>';
    return '<h3>' + escapeHtml(poll.question) + '</h3>' +
      '<div class="poll-options">' +
        (poll.options || []).map(function (option) {
          return '<button type="button" data-poll-option>' + escapeHtml(option) + '</button>';
        }).join('') +
      '</div>' +
      '<p class="matchday-note">' + escapeHtml(poll.note || 'Poll shell only.') + '</p>';
  }

  function renderDashboard() {
    var el = $('[data-room-dashboard]');
    if (!el) return;
    var room = getRoom(state.teamId) || {};
    var group = groupForTeam(state.teamId);
    var row = standingsRow(state.teamId);
    var poll = getPoll(room.pollId);
    el.innerHTML =
      '<article class="room-panel"><span class="matchday-pill">Fixtures</span><h3>' + escapeHtml(teamName(state.teamId)) + ' fixtures</h3>' + renderFixtureList(fixturesForTeam(state.teamId)) + '</article>' +
      '<article class="room-panel"><span class="matchday-pill">Group table</span><h3>Current position</h3>' +
        '<p>' + escapeHtml(group ? group.name : 'Group pending') + '</p>' +
        '<div class="room-mini-row"><strong>' + escapeHtml(row ? row.qualificationLabel : 'No verified scores') + '</strong><span>' + escapeHtml(row ? row.points + ' pts' : '0 pts') + '</span></div>' +
        '<p class="matchday-note">Tables count verified final scores only.</p></article>' +
      '<article class="room-panel"><span class="matchday-pill">Prediction CTA</span><h3>Make your call</h3><p>Pick the best African team, champion path, and match calls in the free skill challenge draft.</p><a class="btn btn-primary" href="/matchday-os/prediction-challenge/">Open challenge</a></article>' +
      '<article class="room-panel"><span class="matchday-pill">Fan poll</span>' + renderPoll(poll) + '</article>' +
      '<article class="room-panel"><span class="matchday-pill">Sponsor slot</span><h3>Room sponsor</h3><p>' + escapeHtml(room.sponsorSlot || 'Sponsor slot pending review.') + '</p><a class="btn btn-secondary" href="/business-enquiry/?offer=sponsored_tool&amp;source_route=matchday-os-room&amp;prospect_segment=sports_media&amp;cta_type=room_sponsor">Request slot</a></article>' +
      '<article class="room-panel"><span class="matchday-pill">Discussion prompt</span><h3>Strategy board</h3><p>' + escapeHtml(room.discussionPrompt || 'Prompt pending editorial update.') + '</p><p class="matchday-note">No user comments are stored here yet.</p></article>';
  }

  function renderPosts() {
    var el = $('[data-room-posts]');
    if (!el) return;
    var room = getRoom(state.teamId) || {};
    var posts = (room.latestPostIds || []).map(getPost).filter(Boolean);
    if (!posts.length) {
      posts = (state.content.strategyPrompts || []).filter(function (prompt) {
        return (prompt.teamIds || []).indexOf(state.teamId) !== -1;
      }).slice(0, 3);
    }
    el.innerHTML = posts.length ? posts.map(function (post) {
      return '<article class="room-post-card">' +
        '<span class="matchday-pill">' + escapeHtml(post.label || post.type || 'Prompt') + '</span>' +
        '<h3>' + escapeHtml(post.title) + '</h3>' +
        '<p>' + escapeHtml(post.summary || post.body || '') + '</p>' +
      '</article>';
    }).join('') : '<article class="room-post-card"><h3>Editorial prompt pending</h3><p>This room is ready for preview, reaction, strategy, and viewing-guide posts.</p></article>';
  }

  function initPollShell() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-poll-option]');
      if (!button) return;
      var panel = button.closest('.room-panel');
      if (!panel) return;
      panel.querySelectorAll('[data-poll-option]').forEach(function (item) {
        item.classList.remove('is-selected');
      });
      button.classList.add('is-selected');
      var note = panel.querySelector('.matchday-note');
      if (note) note.textContent = 'Local selection only. Vote totals need a backend before launch.';
    });
  }

  function initShare() {
    var button = $('[data-room-share]');
    if (!button) return;
    button.addEventListener('click', function () {
      var room = getRoom(state.teamId) || {};
      var text = room.shareCopy || 'I am following an African team in Matchday OS.';
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' https://afrotools.com/matchday-os/rooms/?team=' + state.teamId), '_blank', 'noopener,noreferrer');
    });
  }

  function render() {
    state.teamId = selectedTeamId();
    renderHero();
    renderSwitcher();
    renderDashboard();
    renderPosts();
  }

  function boot() {
    initPollShell();
    initShare();
    Promise.all([
      fetch(TOURNAMENT_URL, { headers: { Accept: 'application/json' } }).then(function (response) { return response.json(); }),
      fetch(CONTENT_URL, { headers: { Accept: 'application/json' } }).then(function (response) { return response.json(); })
    ]).then(function (payload) {
      state.tournament = payload[0];
      state.content = payload[1];
      render();
    }).catch(function () {
      var copy = $('[data-room-copy]');
      if (copy) copy.textContent = 'Room data could not load. The shell is still available.';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
