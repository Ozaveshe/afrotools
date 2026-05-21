(function () {
  'use strict';

  var DATA_URL = '/data/matchday-os/tournament.json';
  var CONTENT_URL = '/data/matchday-os/content.json';
  var PREDICTION_STORAGE_KEY = 'matchday_os_prediction_game';
  var FORMAT_SIZES = {
    square: { width: 1080, height: 1080, label: '1080 x 1080 PNG' },
    story: { width: 1080, height: 1920, label: '1080 x 1920 PNG' }
  };
  var STYLE_PALETTES = {
    broadcast: { bg: '#06111f', bg2: '#10263c', text: '#f8fafc', muted: '#cbd5e1', accent: '#ffdf72', red: '#d62828', green: '#0f8f4d' },
    sunrise: { bg: '#fff7e6', bg2: '#f8fafc', text: '#102033', muted: '#475569', accent: '#d97706', red: '#d62828', green: '#0f8f4d' },
    electric: { bg: '#082f49', bg2: '#163c23', text: '#ffffff', muted: '#dbeafe', accent: '#facc15', red: '#ef4444', green: '#22c55e' }
  };
  var FALLBACK_TEMPLATES = [
    { templateId: 'today-african-matches', label: "Today's African matches", status: 'data_driven' },
    { templateId: 'my-predictions-today', label: 'My predictions today', status: 'frontend_local' },
    { templateId: 'leaderboard-rank', label: 'My leaderboard rank', status: 'shell_only' },
    { templateId: 'country-room-support', label: 'Country room support', status: 'data_driven' },
    { templateId: 'viewing-center-flyer', label: 'Viewing-center flyer', status: 'operator_shell' },
    { templateId: 'group-table-snapshot', label: 'Group table snapshot', status: 'data_driven' },
    { templateId: 'knockout-path', label: 'Knockout path', status: 'placeholder_shell' },
    { templateId: 'match-result-reaction', label: 'Match result reaction', status: 'template_only' },
    { templateId: 'prize-challenge-invite', label: 'Prize challenge invite', status: 'campaign_draft' },
    { templateId: 'sponsor-daily-card', label: 'Sponsor-branded daily card', status: 'sponsor_shell' }
  ];

  var state = {
    data: null,
    content: null,
    prediction: loadJson(PREDICTION_STORAGE_KEY, null),
    selectedType: 'today-african-matches',
    selectedFormat: 'square',
    selectedTeamId: '',
    selectedMatchId: '',
    selectedTimeZone: 'Africa/Lagos',
    selectedStyle: 'broadcast',
    includePrediction: true,
    includeSponsor: false,
    sponsorLabel: 'Sponsor badge'
  };
  var refs = {};

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

  function loadJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function status(message) {
    if (refs.status) refs.status.textContent = message;
  }

  function getTemplates() {
    return state.content && Array.isArray(state.content.shareCardTemplates)
      ? state.content.shareCardTemplates
      : FALLBACK_TEMPLATES;
  }

  function getAfricanTeams() {
    return (state.data && state.data.teams ? state.data.teams : []).filter(function (team) {
      return team.isAfricanTeam;
    });
  }

  function getTeam(teamId) {
    return (state.data && state.data.teams ? state.data.teams : []).find(function (team) {
      return team.teamId === teamId;
    }) || getAfricanTeams()[0] || null;
  }

  function getFixture(matchId) {
    return (state.data && state.data.fixtures ? state.data.fixtures : []).find(function (fixture) {
      return fixture.matchId === matchId;
    }) || (state.data && state.data.fixtures ? state.data.fixtures[0] : null);
  }

  function getVenue(venueId) {
    return (state.data && state.data.stadiums ? state.data.stadiums : []).find(function (venue) {
      return venue.venueId === venueId;
    }) || null;
  }

  function teamLabel(teamId, fallback) {
    var team = getTeam(teamId);
    return team && team.teamId === teamId ? team.name : (fallback || 'Team pending');
  }

  function shortLabel(teamId) {
    var team = getTeam(teamId);
    return team && team.teamId === teamId ? team.shortLabel : 'TBD';
  }

  function selectedTeam() {
    return getTeam(state.selectedTeamId);
  }

  function selectedFixture() {
    return getFixture(state.selectedMatchId);
  }

  function formatKickoff(fixture) {
    if (!fixture || !fixture.kickoffUtc) return 'Kickoff pending';
    try {
      return new Intl.DateTimeFormat('en', {
        timeZone: state.selectedTimeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      }).format(new Date(fixture.kickoffUtc));
    } catch (error) {
      return 'Time pending';
    }
  }

  function fixtureLabel(fixture) {
    if (!fixture) return 'Fixture pending';
    return shortLabel(fixture.homeTeamId) + ' vs ' + shortLabel(fixture.awayTeamId) + ' - ' + formatKickoff(fixture);
  }

  function cityLabel() {
    var cities = state.data && state.data.timeZones ? state.data.timeZones.displayCities || [] : [];
    var city = cities.find(function (item) {
      return item.timeZone === state.selectedTimeZone;
    });
    return city ? city.city + ' time' : 'Local time';
  }

  function predictionSummary(team) {
    if (!state.includePrediction) return 'Prediction hidden';
    if (!state.prediction || !state.prediction.picks) return 'Local picks not saved yet';
    var picks = state.prediction.picks;
    if (picks.bestAfricanTeamId) return 'Best African team pick: ' + teamLabel(picks.bestAfricanTeamId, team ? team.name : 'pending');
    if (picks.championId) return 'Champion pick: ' + teamLabel(picks.championId, 'pending');
    if (picks.matchWinner) return 'Match winner pick saved locally';
    return 'Local picks saved on this device';
  }

  function hexToRgb(hex) {
    var value = String(hex || '').replace('#', '').trim();
    if (value.length === 3) value = value.split('').map(function (char) { return char + char; }).join('');
    var parsed = parseInt(value, 16);
    if (!Number.isFinite(parsed)) return { r: 15, g: 23, b: 42 };
    return { r: parsed >> 16 & 255, g: parsed >> 8 & 255, b: parsed & 255 };
  }

  function rgba(hex, alpha) {
    var rgb = hexToRgb(hex);
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
  }

  function roundRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines, align) {
    var words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    var lines = [];
    var line = '';
    ctx.textAlign = align || 'left';
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      while (ctx.measureText(lines[lines.length - 1] + '...').width > maxWidth && lines[lines.length - 1].length > 8) {
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      }
      lines[lines.length - 1] = lines[lines.length - 1].replace(/\s+$/, '') + '...';
    }
    lines.forEach(function (item, index) {
      ctx.fillText(item, x, y + index * lineHeight);
    });
    return lines.length * lineHeight;
  }

  function drawBackground(ctx, width, height, palette, team) {
    var gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.bg);
    gradient.addColorStop(0.58, palette.bg2);
    gradient.addColorStop(1, team ? team.primaryColor : palette.green);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = team ? team.secondaryColor : palette.accent;
    for (var i = 0; i < 18; i += 1) {
      var x = (i * 191) % width;
      var y = (i * 277) % height;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(20, width * 0.025), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = rgba(palette.accent, 0.24);
    ctx.lineWidth = Math.max(4, width * 0.005);
    var gap = Math.max(92, width * 0.1);
    for (var line = -height; line < width + height; line += gap) {
      ctx.beginPath();
      ctx.moveTo(line, height + gap);
      ctx.lineTo(line + height + gap, -gap);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBadge(ctx, text, x, y, palette, fill) {
    var value = String(text || '').toUpperCase();
    var fontSize = 24;
    ctx.font = '900 ' + fontSize + 'px "DM Sans", Arial, sans-serif';
    var width = ctx.measureText(value).width + 36;
    var height = 42;
    roundRect(ctx, x, y, width, height, 21);
    ctx.fillStyle = fill || palette.accent;
    ctx.fill();
    ctx.fillStyle = '#06111f';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(value, x + 18, y + height / 2 + 1);
    return width;
  }

  function drawHeader(ctx, width, margin, palette, team) {
    ctx.save();
    drawBadge(ctx, 'Matchday OS', margin, margin, palette, palette.accent);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = palette.text;
    ctx.font = '900 28px "DM Sans", Arial, sans-serif';
    ctx.fillText(team ? team.shortLabel : 'AFRICA', width - margin, margin + 4);
    ctx.fillStyle = palette.muted;
    ctx.font = '800 18px "DM Sans", Arial, sans-serif';
    ctx.fillText('Independent football hub', width - margin, margin + 40);
    ctx.restore();
  }

  function drawFooter(ctx, width, height, margin, palette) {
    ctx.save();
    ctx.fillStyle = palette.muted;
    ctx.font = '800 24px "DM Sans", Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('afrotools.com/matchday-os', margin, height - margin);
    ctx.textAlign = 'right';
    ctx.fillText('No official tournament marks', width - margin, height - margin);
    ctx.restore();
  }

  function drawSponsor(ctx, width, margin, palette) {
    if (!state.includeSponsor) return;
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = '900 20px "DM Sans", Arial, sans-serif';
    var label = (state.sponsorLabel || 'Sponsor badge').slice(0, 34);
    var badgeWidth = ctx.measureText(label.toUpperCase()).width + 32;
    roundRect(ctx, width - margin - badgeWidth, margin + 78, badgeWidth, 38, 19);
    ctx.fillStyle = rgba('#ffffff', 0.9);
    ctx.fill();
    ctx.fillStyle = '#102033';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.toUpperCase(), width - margin - 16, margin + 97);
    ctx.restore();
  }

  function drawTeamLockup(ctx, x, y, team, palette, scale) {
    var size = 126 * scale;
    roundRect(ctx, x, y, size, size, 28 * scale);
    ctx.fillStyle = team ? team.primaryColor : palette.green;
    ctx.fill();
    ctx.fillStyle = team ? team.secondaryColor : palette.accent;
    ctx.fillRect(x, y + size * 0.62, size, size * 0.38);
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(42 * scale) + 'px "DM Sans", Arial, sans-serif';
    ctx.fillText(team ? team.shortLabel : 'AFR', x + size / 2, y + size / 2);
  }

  function drawTitleBlock(ctx, title, subtitle, x, y, maxWidth, palette, compact) {
    ctx.save();
    ctx.fillStyle = palette.text;
    ctx.font = '900 ' + (compact ? 62 : 76) + 'px "DM Sans", Arial, sans-serif';
    var used = drawWrapped(ctx, title, x, y, maxWidth, compact ? 68 : 82, compact ? 4 : 5);
    ctx.fillStyle = palette.muted;
    ctx.font = '750 ' + (compact ? 30 : 34) + 'px "DM Sans", Arial, sans-serif';
    drawWrapped(ctx, subtitle, x, y + used + 22, maxWidth, compact ? 39 : 44, compact ? 4 : 5);
    ctx.restore();
  }

  function drawMatchStrip(ctx, x, y, width, fixture, palette) {
    ctx.save();
    roundRect(ctx, x, y, width, 150, 18);
    ctx.fillStyle = rgba('#ffffff', palette.bg === '#fff7e6' ? 0.82 : 0.12);
    ctx.fill();
    ctx.fillStyle = palette.text;
    ctx.font = '900 40px "DM Sans", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(shortLabel(fixture && fixture.homeTeamId), x + 28, y + 62);
    ctx.textAlign = 'center';
    ctx.font = '900 28px "DM Sans", Arial, sans-serif';
    ctx.fillText('VS', x + width / 2, y + 62);
    ctx.textAlign = 'right';
    ctx.font = '900 40px "DM Sans", Arial, sans-serif';
    ctx.fillText(shortLabel(fixture && fixture.awayTeamId), x + width - 28, y + 62);
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'center';
    ctx.font = '800 26px "DM Sans", Arial, sans-serif';
    ctx.fillText(formatKickoff(fixture) + ' - ' + cityLabel(), x + width / 2, y + 112);
    ctx.restore();
  }

  function groupRowsForTeam(team) {
    var engine = window.AfroTools && window.AfroTools.matchdayStandings;
    var groups = engine && state.data ? engine.buildAllStandings(state.data) : [];
    var group = groups.find(function (item) {
      return (item.rows || []).some(function (row) { return row.teamId === team.teamId; });
    }) || groups[0];
    if (group) return { name: group.name, rows: group.rows || [], hasResults: group.hasResults };
    var dataGroup = state.data && state.data.groups ? state.data.groups[0] : null;
    return {
      name: dataGroup ? dataGroup.name : 'Group pending',
      rows: dataGroup ? dataGroup.tableRows || [] : [],
      hasResults: false
    };
  }

  function templateCopy(type, team, fixture) {
    var teamName = team ? team.name : 'Africa';
    var match = fixtureLabel(fixture);
    var venue = fixture ? getVenue(fixture.venue) : null;
    var venueLabel = venue ? venue.name + ', ' + venue.city : 'Venue pending';
    var map = {
      'today-african-matches': {
        eyebrow: 'Today in African football',
        title: 'African matchday watch',
        subtitle: match + '. Verified fixtures appear here; placeholders stay labeled.'
      },
      'my-predictions-today': {
        eyebrow: 'My picks',
        title: 'My Matchday OS predictions',
        subtitle: predictionSummary(team) + '. Local-device demo until backend scoring is live.'
      },
      'leaderboard-rank': {
        eyebrow: 'Leaderboard shell',
        title: 'Rank pending',
        subtitle: 'Verified leaderboard ranks require backend entries, email verification, scoring jobs, and review.'
      },
      'country-room-support': {
        eyebrow: teamName + ' room',
        title: 'I am backing ' + teamName,
        subtitle: 'Join the country room for fixtures, table watch, predictions, polls, and sponsor-safe matchday tools.'
      },
      'viewing-center-flyer': {
        eyebrow: 'Viewing-center flyer',
        title: teamName + ' watch party',
        subtitle: formatKickoff(fixture) + ' - ' + venueLabel + '. Confirm final venue and screening rights before sharing.'
      },
      'group-table-snapshot': {
        eyebrow: 'Group snapshot',
        title: teamName + ' table watch',
        subtitle: 'Provisional group card from static data. No final scores are counted until verified.'
      },
      'knockout-path': {
        eyebrow: 'Knockout path',
        title: teamName + ' road ahead',
        subtitle: 'Round slots stay as placeholders until verified group positions and knockout teams are known.'
      },
      'match-result-reaction': {
        eyebrow: 'Reaction template',
        title: 'After the whistle: ' + teamName,
        subtitle: 'Use after verified final scores only: one tactical note, one player note, one group-table implication.'
      },
      'prize-challenge-invite': {
        eyebrow: 'Free skill challenge',
        title: 'Predict Africa\'s World Cup story',
        subtitle: '$1,200 prize pool. Top 10 verified players win, first place receives $500. Free to enter, no purchase required.'
      },
      'sponsor-daily-card': {
        eyebrow: 'Daily matchday card',
        title: teamName + ' daily football desk',
        subtitle: 'Sponsor-safe card shell for clearly labeled placements. No official association is implied.'
      }
    };
    return map[type] || map['today-african-matches'];
  }

  function drawGroupTable(ctx, x, y, width, palette, team) {
    var group = groupRowsForTeam(team);
    ctx.save();
    roundRect(ctx, x, y, width, 270, 18);
    ctx.fillStyle = rgba('#ffffff', palette.bg === '#fff7e6' ? 0.78 : 0.11);
    ctx.fill();
    ctx.fillStyle = palette.text;
    ctx.font = '900 28px "DM Sans", Arial, sans-serif';
    ctx.fillText(group.name, x + 26, y + 42);
    ctx.font = '800 20px "DM Sans", Arial, sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.fillText(group.hasResults ? 'Verified scores counted' : 'No verified scores counted yet', x + 26, y + 76);
    var rows = (group.rows || []).slice(0, 4);
    rows.forEach(function (row, index) {
      var rowY = y + 118 + index * 36;
      var isTeam = row.teamId === team.teamId;
      if (isTeam) {
        roundRect(ctx, x + 18, rowY - 24, width - 36, 32, 12);
        ctx.fillStyle = rgba(team.primaryColor, 0.52);
        ctx.fill();
      }
      ctx.fillStyle = palette.text;
      ctx.font = '850 22px "DM Sans", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((index + 1) + '. ' + teamLabel(row.teamId, 'Team pending'), x + 30, rowY);
      ctx.textAlign = 'right';
      ctx.fillText((row.points || 0) + ' pts', x + width - 30, rowY);
    });
    ctx.restore();
  }

  function drawKnockoutPath(ctx, x, y, width, palette, team) {
    var rounds = state.data && state.data.knockoutBracket ? state.data.knockoutBracket.rounds || [] : [];
    ctx.save();
    ctx.font = '900 24px "DM Sans", Arial, sans-serif';
    rounds.slice(0, 6).forEach(function (round, index) {
      var rowY = y + index * 58;
      roundRect(ctx, x, rowY, width, 42, 14);
      ctx.fillStyle = index === 0 ? rgba(team.primaryColor, 0.56) : rgba('#ffffff', palette.bg === '#fff7e6' ? 0.78 : 0.1);
      ctx.fill();
      ctx.fillStyle = palette.text;
      ctx.textAlign = 'left';
      ctx.fillText(round.label, x + 20, rowY + 28);
      ctx.textAlign = 'right';
      ctx.fillStyle = palette.muted;
      ctx.fillText(index === 0 ? 'Starts from group finish' : 'TBD', x + width - 20, rowY + 28);
    });
    ctx.restore();
  }

  function drawCard() {
    if (!refs.canvas || !state.data) return;
    var size = FORMAT_SIZES[state.selectedFormat] || FORMAT_SIZES.square;
    var palette = STYLE_PALETTES[state.selectedStyle] || STYLE_PALETTES.broadcast;
    var team = selectedTeam();
    var fixture = selectedFixture();
    var copy = templateCopy(state.selectedType, team, fixture);
    var ctx = refs.canvas.getContext('2d');
    refs.canvas.width = size.width;
    refs.canvas.height = size.height;
    var width = refs.canvas.width;
    var height = refs.canvas.height;
    var margin = state.selectedFormat === 'story' ? 82 : 64;
    var compact = state.selectedFormat !== 'story';

    drawBackground(ctx, width, height, palette, team);
    drawHeader(ctx, width, margin, palette, team);
    drawSponsor(ctx, width, margin, palette);

    var titleY = state.selectedFormat === 'story' ? 280 : 212;
    drawTeamLockup(ctx, margin, titleY, team, palette, 1);
    ctx.save();
    ctx.fillStyle = palette.muted;
    ctx.font = '900 24px "DM Sans", Arial, sans-serif';
    ctx.fillText(copy.eyebrow.toUpperCase(), margin + 156, titleY + 38);
    ctx.restore();
    drawTitleBlock(ctx, copy.title, copy.subtitle, margin + 156, titleY + 94, width - margin * 2 - 156, palette, compact);

    if (state.selectedType === 'group-table-snapshot') {
      drawGroupTable(ctx, margin, state.selectedFormat === 'story' ? 740 : 650, width - margin * 2, palette, team);
    } else if (state.selectedType === 'knockout-path') {
      drawKnockoutPath(ctx, margin, state.selectedFormat === 'story' ? 760 : 620, width - margin * 2, palette, team);
    } else {
      drawMatchStrip(ctx, margin, state.selectedFormat === 'story' ? 760 : 650, width - margin * 2, fixture, palette);
    }

    if (state.selectedType === 'prize-challenge-invite') {
      ctx.save();
      var prizeY = state.selectedFormat === 'story' ? 1050 : 830;
      ctx.fillStyle = palette.accent;
      ctx.font = '900 100px "DM Sans", Arial, sans-serif';
      ctx.fillText('$1,200', margin, prizeY);
      ctx.fillStyle = palette.text;
      ctx.font = '900 30px "DM Sans", Arial, sans-serif';
      ctx.fillText('Top 10 verified players - Skill-based - Terms apply - Void where restricted', margin, prizeY + 52);
      ctx.restore();
    } else if (state.selectedType === 'leaderboard-rank') {
      ctx.save();
      var rankY = state.selectedFormat === 'story' ? 1080 : 850;
      ctx.fillStyle = palette.accent;
      ctx.font = '900 78px "DM Sans", Arial, sans-serif';
      ctx.fillText('Rank pending', margin, rankY);
      ctx.fillStyle = palette.muted;
      ctx.font = '800 30px "DM Sans", Arial, sans-serif';
      ctx.fillText('Leaderboard opens after verified scoring and review.', margin, rankY + 46);
      ctx.restore();
    } else if (state.includePrediction) {
      ctx.save();
      var pickY = state.selectedFormat === 'story' ? 1040 : 840;
      ctx.fillStyle = palette.text;
      ctx.font = '900 30px "DM Sans", Arial, sans-serif';
      drawWrapped(ctx, predictionSummary(team), margin, pickY, width - margin * 2, 38, 2);
      ctx.restore();
    }

    drawFooter(ctx, width, height, margin, palette);
    updateMeta();
  }

  function updateFromControls() {
    state.selectedType = refs.type ? refs.type.value : state.selectedType;
    state.selectedFormat = refs.format ? refs.format.value : state.selectedFormat;
    state.selectedTeamId = refs.team ? refs.team.value : state.selectedTeamId;
    state.selectedMatchId = refs.match ? refs.match.value : state.selectedMatchId;
    state.selectedTimeZone = refs.city ? refs.city.value : state.selectedTimeZone;
    state.selectedStyle = refs.style ? refs.style.value : state.selectedStyle;
    state.includePrediction = refs.prediction ? refs.prediction.checked : state.includePrediction;
    state.includeSponsor = refs.sponsor ? refs.sponsor.checked : state.includeSponsor;
    state.sponsorLabel = refs.sponsorLabel ? refs.sponsorLabel.value : state.sponsorLabel;
  }

  function populateControls() {
    var params = new URLSearchParams(window.location.search);
    var templates = getTemplates();
    var requestedType = params.get('type') || params.get('template');
    if (requestedType && templates.some(function (template) { return template.templateId === requestedType; })) {
      state.selectedType = requestedType;
    }
    refs.type.innerHTML = templates.map(function (template) {
      return '<option value="' + escapeHtml(template.templateId) + '"' + (template.templateId === state.selectedType ? ' selected' : '') + '>' + escapeHtml(template.label) + '</option>';
    }).join('');

    var teams = getAfricanTeams();
    var requestedTeam = params.get('team');
    if (requestedTeam && teams.some(function (team) { return team.teamId === requestedTeam; })) {
      state.selectedTeamId = requestedTeam;
    }
    state.selectedTeamId = state.selectedTeamId || (teams[0] && teams[0].teamId) || '';
    refs.team.innerHTML = teams.map(function (team) {
      return '<option value="' + escapeHtml(team.teamId) + '">' + escapeHtml(team.name) + '</option>';
    }).join('');
    refs.team.value = state.selectedTeamId;

    var fixtures = state.data.fixtures || [];
    var requestedMatch = params.get('match');
    if (requestedMatch && fixtures.some(function (fixture) { return fixture.matchId === requestedMatch; })) {
      state.selectedMatchId = requestedMatch;
    }
    state.selectedMatchId = state.selectedMatchId || (fixtures[0] && fixtures[0].matchId) || '';
    refs.match.innerHTML = fixtures.map(function (fixture) {
      return '<option value="' + escapeHtml(fixture.matchId) + '">' + escapeHtml(fixtureLabel(fixture)) + '</option>';
    }).join('');
    refs.match.value = state.selectedMatchId;

    var zones = state.data.timeZones && state.data.timeZones.displayCities ? state.data.timeZones.displayCities : [];
    state.selectedTimeZone = state.data.timeZones && state.data.timeZones.defaultTimeZone ? state.data.timeZones.defaultTimeZone : state.selectedTimeZone;
    refs.city.innerHTML = zones.map(function (zone) {
      return '<option value="' + escapeHtml(zone.timeZone) + '">' + escapeHtml(zone.city + ' - ' + zone.offsetHint) + '</option>';
    }).join('');
    refs.city.value = state.selectedTimeZone;

    renderTemplateList();
  }

  function renderTemplateList() {
    if (!refs.templateList) return;
    refs.templateList.innerHTML = getTemplates().map(function (template) {
      return '<article class="share-template-card">' +
        '<span>' + escapeHtml(template.status) + '</span>' +
        '<h3>' + escapeHtml(template.label) + '</h3>' +
        '<p>' + escapeHtml(template.description || 'Matchday OS share-card template.') + '</p>' +
        '</article>';
    }).join('');
  }

  function updateMeta() {
    if (!refs.meta) return;
    var size = FORMAT_SIZES[state.selectedFormat] || FORMAT_SIZES.square;
    var template = getTemplates().find(function (item) { return item.templateId === state.selectedType; });
    refs.meta.innerHTML = '<div><span>Template</span><strong>' + escapeHtml(template ? template.label : state.selectedType) + '</strong></div>' +
      '<div><span>Export</span><strong>' + escapeHtml(size.label) + '</strong></div>' +
      '<div><span>Data mode</span><strong>Static seed, no fake live data</strong></div>';
  }

  function canvasBlob() {
    return new Promise(function (resolve) {
      refs.canvas.toBlob(function (blob) {
        resolve(blob);
      }, 'image/png', 0.94);
    });
  }

  async function downloadCard() {
    updateFromControls();
    drawCard();
    var blob = await canvasBlob();
    if (!blob) {
      status('PNG export failed');
      return;
    }
    var template = state.selectedType.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'matchday-os-' + template + '-' + state.selectedFormat + '.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
    }, 1000);
    status('PNG downloaded');
  }

  async function shareCard() {
    updateFromControls();
    drawCard();
    var blob = await canvasBlob();
    var file = blob ? new File([blob], 'matchday-os-card.png', { type: 'image/png' }) : null;
    var shareData = {
      title: 'Matchday OS share card',
      text: 'I made a Matchday OS card for African football.',
      url: window.location.href
    };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      shareData.files = [file];
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        status('Share sheet opened');
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') {
          status('Share cancelled');
          return;
        }
      }
    }
    if (navigator.clipboard && blob && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        status('PNG copied to clipboard');
        return;
      } catch (error) {
        // Fall back to the visible manual guidance below.
      }
    }
    status('Native share unavailable. Download the PNG and post it manually.');
  }

  function bindEvents() {
    [refs.type, refs.format, refs.team, refs.match, refs.city, refs.style, refs.prediction, refs.sponsor, refs.sponsorLabel].forEach(function (control) {
      if (!control) return;
      var eventName = control.type === 'checkbox' ? 'change' : 'input';
      control.addEventListener(eventName, function () {
        updateFromControls();
        drawCard();
      });
      if (control.tagName === 'SELECT') {
        control.addEventListener('change', function () {
          updateFromControls();
          drawCard();
        });
      }
    });
    if (refs.render) refs.render.addEventListener('click', function () {
      updateFromControls();
      drawCard();
      status('Card rendered locally');
    });
    if (refs.download) refs.download.addEventListener('click', downloadCard);
    if (refs.nativeShare) refs.nativeShare.addEventListener('click', shareCard);
  }

  async function init() {
    refs = {
      status: $('#shareCardStatus'),
      type: $('#shareCardType'),
      format: $('#shareCardFormat'),
      team: $('#shareCardTeam'),
      match: $('#shareCardMatch'),
      city: $('#shareCardCity'),
      style: $('#shareCardStyle'),
      prediction: $('#shareCardPrediction'),
      sponsor: $('#shareCardSponsor'),
      sponsorLabel: $('#shareCardSponsorLabel'),
      render: $('#shareCardRender'),
      download: $('#shareCardDownload'),
      nativeShare: $('#shareCardNative'),
      canvas: $('#shareCardCanvas'),
      meta: $('#shareCardMeta'),
      templateList: $('#shareCardTemplateList')
    };
    if (!refs.canvas) return;

    try {
      var responses = await Promise.all([fetch(DATA_URL), fetch(CONTENT_URL)]);
      state.data = await responses[0].json();
      state.content = await responses[1].json();
      populateControls();
      bindEvents();
      drawCard();
      status('Ready');
    } catch (error) {
      status('Card data could not load');
      if (refs.meta) {
        refs.meta.innerHTML = '<div><span>Status</span><strong>Data load failed. Try again from the local site server.</strong></div>';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
