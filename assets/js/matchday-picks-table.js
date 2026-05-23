!function(window, document) {
  "use strict";

  var STORAGE_KEY = "matchday_os_fixture_picks_v1";
  var LEGACY_PREDICTION_KEY = "matchday_os_prediction_game";
  var state = {
    data: null,
    fixtures: [],
    teams: [],
    groups: [],
    picks: {},
    filter: "all",
    group: "all",
    sort: "group",
    timezone: "Africa/Lagos"
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function loadStorage(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function getTeam(teamId) {
    return state.teams.find(function(team) { return team.teamId === teamId; }) || null;
  }

  function teamName(teamId) {
    var team = getTeam(teamId);
    return team ? team.name : "Team pending";
  }

  function teamCode(teamId) {
    var team = getTeam(teamId);
    return team ? team.shortLabel || team.countryCode || team.name : "TBD";
  }

  function teamFlag(teamId) {
    var team = getTeam(teamId);
    var code = String(team && team.countryCode ? team.countryCode : "").trim().toLowerCase();
    var label = escapeHtml(teamCode(teamId));
    if (!/^[a-z]{2}(-[a-z]{3})?$/.test(code)) {
      return '<span class="pick-team-flag is-fallback" data-fallback="' + label + '" aria-hidden="true"></span>';
    }
    return [
      '<span class="pick-team-flag" data-fallback="' + label + '" aria-hidden="true">',
      '<img src="/assets/img/matchday/flags/' + escapeHtml(code) + '.png" alt="" width="32" height="32" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'is-fallback\');this.remove();">',
      '</span>'
    ].join("");
  }

  function teamMarkup(teamId) {
    return [
      '<span class="pick-team">',
      teamFlag(teamId),
      '<span><strong>' + escapeHtml(teamName(teamId)) + '</strong><small>' + escapeHtml(teamCode(teamId)) + '</small></span>',
      '</span>'
    ].join("");
  }

  function groupLabel(groupId) {
    var group = state.groups.find(function(item) { return item.groupId === groupId; });
    return group && (group.shortName || group.name) || groupId || "Group pending";
  }

  function groupSortIndex(groupId) {
    var index = state.groups.findIndex(function(group) { return group.groupId === groupId; });
    return index < 0 ? 999 : index;
  }

  function isAfricaFixture(fixture) {
    var home = getTeam(fixture.homeTeamId);
    var away = getTeam(fixture.awayTeamId);
    return Boolean(fixture.isAfricaFocus || home && home.isAfricanTeam || away && away.isAfricanTeam);
  }

  function isLocked(fixture) {
    if (!fixture || !fixture.kickoffUtc) return false;
    var kickoff = Date.parse(fixture.kickoffUtc);
    return Number.isFinite(kickoff) && Date.now() >= kickoff;
  }

  function kickoffTime(kickoffUtc) {
    if (!kickoffUtc) return "Kickoff pending";
    try {
      return new Intl.DateTimeFormat("en", {
        timeZone: state.timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short"
      }).format(new Date(kickoffUtc));
    } catch (error) {
      return "Time pending";
    }
  }

  function kickoffStamp(fixture) {
    var stamp = Date.parse(fixture && fixture.kickoffUtc || "");
    return Number.isFinite(stamp) ? stamp : Number.MAX_SAFE_INTEGER;
  }

  function scoreValue(value) {
    if (value === "" || value == null) return null;
    var number = Number(value);
    return Number.isInteger(number) && number >= 0 && number <= 20 ? number : null;
  }

  function hasPick(pick) {
    return Boolean(pick && (pick.resultPick || pick.homeScore != null || pick.awayScore != null));
  }

  function pickSummary(pick) {
    if (!hasPick(pick)) return "No pick yet";
    var result = pick.resultPick === "draw" ? "Draw" : teamName(pick.resultPick);
    if (pick.homeScore != null && pick.awayScore != null) {
      return result + " " + pick.homeScore + "-" + pick.awayScore;
    }
    return result;
  }

  function finalResult(fixture) {
    if (!fixture || !fixture.resultFinal) return "Awaiting result";
    return teamCode(fixture.homeTeamId) + " " + fixture.homeScore + "-" + fixture.awayScore + " " + teamCode(fixture.awayTeamId);
  }

  function pointsWon(fixture, pick) {
    if (!fixture || !fixture.resultFinal) return "Pending";
    if (!hasPick(pick)) return "0";
    var engine = window.AfroTools && window.AfroTools.matchdayPrediction;
    if (!engine || !engine.scoreMatchPick) return "Ready after scoring";
    var scoring = state.data && state.data.predictionGame && state.data.predictionGame.scoring;
    var score = engine.scoreMatchPick(pick, fixture, scoring, state.teams);
    return String(score.total || 0);
  }

  function resultOptions(fixture, selected) {
    return [
      { value: "", label: "Choose result" },
      { value: "draw", label: "Draw" },
      { value: fixture.homeTeamId, label: teamName(fixture.homeTeamId) + " win" },
      { value: fixture.awayTeamId, label: teamName(fixture.awayTeamId) + " win" }
    ].map(function(option) {
      return '<option value="' + escapeHtml(option.value) + '"' + (option.value === selected ? " selected" : "") + ">" + escapeHtml(option.label) + "</option>";
    }).join("");
  }

  function getVisibleFixtures() {
    var filtered = state.fixtures.filter(function(fixture) {
      if (state.filter === "africa" && !isAfricaFixture(fixture)) return false;
      if (state.filter === "picked" && !hasPick(state.picks[fixture.matchId])) return false;
      if (state.filter === "open" && isLocked(fixture)) return false;
      if (state.group !== "all" && fixture.group !== state.group) return false;
      return true;
    });

    return filtered.sort(function(a, b) {
      if (state.sort === "time") return kickoffStamp(a) - kickoffStamp(b);
      if (state.sort === "africa") {
        var africaDiff = Number(isAfricaFixture(b)) - Number(isAfricaFixture(a));
        if (africaDiff) return africaDiff;
      }
      var groupDiff = groupSortIndex(a.group) - groupSortIndex(b.group);
      return groupDiff || kickoffStamp(a) - kickoffStamp(b);
    });
  }

  function renderGroups() {
    var select = $("[data-pick-group]");
    if (!select) return;
    var current = select.value || state.group || "all";
    select.innerHTML = '<option value="all">All groups</option>' + state.groups.map(function(group) {
      var label = group.shortName || group.name || group.groupId;
      return '<option value="' + escapeHtml(group.groupId) + '">' + escapeHtml(label) + "</option>";
    }).join("");
    select.value = current;
    if (!select.value) select.value = "all";
  }

  function renderStats() {
    var target = $("[data-pick-stats]");
    if (!target) return;
    var saved = state.fixtures.filter(function(fixture) { return hasPick(state.picks[fixture.matchId]); }).length;
    var africa = state.fixtures.filter(isAfricaFixture).length;
    var groupSlots = state.groups.length * 2;
    target.innerHTML = [
      '<article><strong>' + escapeHtml(state.fixtures.length) + '</strong><span>Fixture picks</span></article>',
      '<article><strong>' + escapeHtml(groupSlots) + '</strong><span>Group qualifier slots</span></article>',
      '<article><strong>8</strong><span>Tournament path picks</span></article>',
      '<article><strong>' + escapeHtml(saved) + '</strong><span>Saved fixture picks</span></article>',
      '<article><strong>' + escapeHtml(africa) + '</strong><span>African-team fixtures</span></article>'
    ].join("");
  }

  function renderTable() {
    var body = $("[data-picks-table-body]");
    var status = $("[data-picks-desk-status]");
    if (!body) return;
    var fixtures = getVisibleFixtures();
    if (status) {
      var groupText = state.group === "all" ? "" : " in " + groupLabel(state.group);
      status.textContent = fixtures.length + " fixture" + (fixtures.length === 1 ? "" : "s") + " shown" + groupText + ".";
    }
    if (!fixtures.length) {
      body.innerHTML = '<tr><td colspan="6">No fixtures match this view yet.</td></tr>';
      return;
    }
    body.innerHTML = fixtures.map(function(fixture) {
      var pick = state.picks[fixture.matchId] || {};
      var locked = isLocked(fixture);
      var africaClass = isAfricaFixture(fixture) ? " is-africa-fixture" : "";
      var statusClass = locked ? " is-locked" : " is-open";
      return [
        '<tr data-match-id="' + escapeHtml(fixture.matchId) + '" class="' + africaClass.trim() + '">',
        '<td>',
        '<div class="pick-fixture-cell">',
        teamMarkup(fixture.homeTeamId),
        '<span class="pick-vs">vs</span>',
        teamMarkup(fixture.awayTeamId),
        '</div>',
        '</td>',
        '<td><div class="pick-meta-cell"><span class="pick-group-pill">' + escapeHtml(groupLabel(fixture.group)) + '</span><strong>' + escapeHtml(kickoffTime(fixture.kickoffUtc)) + '</strong><small class="pick-lock' + statusClass + '">' + escapeHtml(locked ? "Locked" : "Open") + '</small></div></td>',
        '<td><div class="pick-entry-cell"><select data-pick-result aria-label="Result pick for ' + escapeHtml(teamName(fixture.homeTeamId) + " vs " + teamName(fixture.awayTeamId)) + '"' + (locked ? " disabled" : "") + ">" + resultOptions(fixture, pick.resultPick || "") + '</select><div class="pick-score-inputs"><input data-pick-home type="number" min="0" max="20" value="' + escapeHtml(pick.homeScore == null ? "" : pick.homeScore) + '" aria-label="Home score pick"' + (locked ? " disabled" : "") + '><span>-</span><input data-pick-away type="number" min="0" max="20" value="' + escapeHtml(pick.awayScore == null ? "" : pick.awayScore) + '" aria-label="Away score pick"' + (locked ? " disabled" : "") + '></div><small>' + escapeHtml(pickSummary(pick)) + '</small></div></td>',
        '<td><div class="pick-actions"><button class="btn btn-secondary" type="button" data-save-pick' + (locked ? " disabled" : "") + ">" + escapeHtml(hasPick(pick) ? "Update" : "Save") + '</button><button class="btn btn-ghost" type="button" data-edit-in-form>Open form</button></div></td>',
        '<td><span class="pick-result">' + escapeHtml(finalResult(fixture)) + '</span></td>',
        '<td><strong class="pick-points">' + escapeHtml(pointsWon(fixture, pick)) + '</strong></td>',
        '</tr>'
      ].join("");
    }).join("");
  }

  function render() {
    renderStats();
    renderTable();
  }

  function syncResultOptions(form, fixture) {
    var select = $('select[name="matchResultPick"]', form);
    if (!select || !fixture) return;
    var current = select.value;
    select.innerHTML = resultOptions(fixture, current);
    if (!select.value && current) select.value = "draw";
  }

  function syncPredictionForm(matchId) {
    var form = $("[data-prediction-form]");
    if (!form || !state.fixtures.length) return;
    var select = $('select[name="matchId"]', form);
    if (!select) return;
    var selected = matchId || select.value || state.fixtures[0].matchId;
    select.innerHTML = state.fixtures.map(function(fixture) {
      return '<option value="' + escapeHtml(fixture.matchId) + '"' + (fixture.matchId === selected ? " selected" : "") + ">" + escapeHtml(teamCode(fixture.homeTeamId) + " vs " + teamCode(fixture.awayTeamId) + " - " + groupLabel(fixture.group)) + "</option>";
    }).join("");
    if (!select.value) select.value = state.fixtures[0].matchId;
    syncResultOptions(form, state.fixtures.find(function(fixture) { return fixture.matchId === select.value; }));
  }

  function savePickFromForm() {
    var form = $("[data-prediction-form]");
    if (!form) return;
    var fixtureSelect = $('select[name="matchId"]', form);
    if (!fixtureSelect || !fixtureSelect.value) return;
    var pick = {
      matchId: fixtureSelect.value,
      resultPick: ($('select[name="matchResultPick"]', form) || {}).value || "",
      homeScore: scoreValue(($('input[name="matchHomeScore"]', form) || {}).value),
      awayScore: scoreValue(($('input[name="matchAwayScore"]', form) || {}).value),
      updatedAt: (new Date()).toISOString()
    };
    if (hasPick(pick)) state.picks[fixtureSelect.value] = pick;
    else delete state.picks[fixtureSelect.value];
    saveStorage(STORAGE_KEY, state.picks);
    render();
    var row = $('[data-match-id="' + cssEscape(fixtureSelect.value) + '"]');
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function cssEscape(value) {
    return window.CSS && typeof window.CSS.escape === "function" ? window.CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&");
  }

  function bindEvents() {
    var filter = $("[data-pick-filter]");
    var group = $("[data-pick-group]");
    var sort = $("[data-pick-sort]");
    if (filter) filter.addEventListener("change", function() {
      state.filter = filter.value || "all";
      render();
    });
    if (group) group.addEventListener("change", function() {
      state.group = group.value || "all";
      render();
    });
    if (sort) sort.addEventListener("change", function() {
      state.sort = sort.value || "group";
      render();
    });

    var timezone = $("[data-timezone-select]");
    if (timezone) {
      state.timezone = timezone.value || state.timezone;
      timezone.addEventListener("change", function() {
        state.timezone = timezone.value || state.timezone;
        renderTable();
      });
    }

    document.addEventListener("click", function(event) {
      var saveButton = event.target.closest("[data-save-pick]");
      if (saveButton) {
        savePickFromRow(saveButton.closest("[data-match-id]"));
      }
      var formButton = event.target.closest("[data-edit-in-form]");
      if (formButton) {
        openInForm(formButton.closest("[data-match-id]"));
      }
    });

    document.addEventListener("change", function(event) {
      if (event.target && event.target.matches('select[name="matchId"]')) {
        var fixture = state.fixtures.find(function(item) { return item.matchId === event.target.value; });
        syncResultOptions(event.target.closest("form"), fixture);
      }
    });

    var form = $("[data-prediction-form]");
    if (form) {
      form.addEventListener("submit", function() {
        window.setTimeout(savePickFromForm, 0);
      });
    }
  }

  function savePickFromRow(row) {
    if (!row) return;
    var matchId = row.getAttribute("data-match-id");
    var fixture = state.fixtures.find(function(item) { return item.matchId === matchId; });
    if (!fixture || isLocked(fixture)) return;
    var pick = {
      matchId: matchId,
      resultPick: ($("[data-pick-result]", row) || {}).value || "",
      homeScore: scoreValue(($("[data-pick-home]", row) || {}).value),
      awayScore: scoreValue(($("[data-pick-away]", row) || {}).value),
      updatedAt: (new Date()).toISOString()
    };
    if (hasPick(pick)) state.picks[matchId] = pick;
    else delete state.picks[matchId];
    saveStorage(STORAGE_KEY, state.picks);
    render();
    syncPredictionForm(matchId);
  }

  function openInForm(row) {
    if (!row) return;
    var matchId = row.getAttribute("data-match-id");
    var fixture = state.fixtures.find(function(item) { return item.matchId === matchId; });
    var form = $("[data-prediction-form]");
    if (!fixture || !form) return;
    syncPredictionForm(matchId);
    var pick = state.picks[matchId] || {};
    var result = $('select[name="matchResultPick"]', form);
    var home = $('input[name="matchHomeScore"]', form);
    var away = $('input[name="matchAwayScore"]', form);
    if (result) result.value = pick.resultPick || "";
    if (home) home.value = pick.homeScore == null ? "" : pick.homeScore;
    if (away) away.value = pick.awayScore == null ? "" : pick.awayScore;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    if (result) result.focus();
  }

  function importLegacyPick() {
    var legacy = loadStorage(LEGACY_PREDICTION_KEY, null);
    if (legacy && legacy.matchPick && legacy.matchPick.matchId && !state.picks[legacy.matchPick.matchId]) {
      state.picks[legacy.matchPick.matchId] = legacy.matchPick;
      saveStorage(STORAGE_KEY, state.picks);
    }
  }

  function loadData() {
    if (!$("[data-picks-table-body]")) return;
    fetch("/data/matchday-os/tournament-full.json", { headers: { Accept: "application/json" } })
      .then(function(response) {
        if (!response.ok) throw new Error("Full tournament data unavailable");
        return response.json();
      })
      .catch(function() {
        return fetch("/data/matchday-os/tournament.json", { headers: { Accept: "application/json" } }).then(function(response) {
          if (!response.ok) throw new Error("Tournament data unavailable");
          return response.json();
        });
      })
      .then(function(data) {
        state.data = data || {};
        state.fixtures = Array.isArray(state.data.fixtures) ? state.data.fixtures.filter(function(fixture) { return fixture.stage === "group_stage"; }) : [];
        state.teams = Array.isArray(state.data.teams) ? state.data.teams : [];
        state.groups = Array.isArray(state.data.groups) ? state.data.groups : [];
        state.picks = loadStorage(STORAGE_KEY, {});
        importLegacyPick();
        renderGroups();
        bindEvents();
        render();
        syncPredictionForm();
        window.setTimeout(syncPredictionForm, 500);
        if (window.location.hash === "#leaderboard" || window.location.hash === "#my-picks") {
          var target = $(window.location.hash);
          if (target) {
            window.setTimeout(function() { target.scrollIntoView({ behavior: "auto", block: "start" }); }, 300);
            window.setTimeout(function() { target.scrollIntoView({ behavior: "auto", block: "start" }); }, 1100);
          }
        }
      })
      .catch(function(error) {
        var body = $("[data-picks-table-body]");
        var status = $("[data-picks-desk-status]");
        if (body) body.innerHTML = '<tr><td colspan="6">Fixture desk could not load.</td></tr>';
        if (status) status.textContent = error.message || "Fixture desk could not load.";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadData);
  else loadData();
}(window, document);
