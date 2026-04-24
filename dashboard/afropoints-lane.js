(function (window, document) {
  'use strict';

  var CACHE_KEY = 'afropoints_dashboard_lane_cache';
  var API_BASE = '/.netlify/functions';
  var CASHOUT_MIN = 2000;

  function $(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('timeout')); }, ms || 7000);
      })
    ]);
  }

  function getToken() {
    if (window.AfroAuth && typeof window.AfroAuth.getSessionToken === 'function') {
      return window.AfroAuth.getSessionToken();
    }
    return null;
  }

  function authHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  function isSignedIn() {
    return Boolean(window.AfroAuth && typeof window.AfroAuth.isLoggedIn === 'function' && window.AfroAuth.isLoggedIn());
  }

  async function apiGet(path) {
    var response = await withTimeout(fetch(API_BASE + path, { headers: authHeaders() }), 7000);
    var data = await response.json().catch(function () { return null; });
    if (!response.ok) {
      var error = new Error(data && data.error ? data.error : 'Endpoint unavailable');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function formatPoints(value) {
    var AP = window.AfroPointsEngine;
    if (AP && typeof AP.formatPoints === 'function') return AP.formatPoints(value);
    return Number(value || 0).toLocaleString();
  }

  function formatDate(value) {
    if (!value) return 'recently';
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'recently';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function titleCase(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function getCategoryLabel(categoryId) {
    var AP = window.AfroPointsEngine;
    var category = AP && typeof AP.getCategoryById === 'function' ? AP.getCategoryById(categoryId) : null;
    return category ? category.label : titleCase(categoryId || 'Market data');
  }

  function profileCompletion(profile) {
    var checks = [
      profile && profile.contributor_persona,
      profile && Array.isArray(profile.regular_countries) && profile.regular_countries.length,
      profile && Array.isArray(profile.regular_cities) && profile.regular_cities.length,
      profile && Array.isArray(profile.coverage_categories) && profile.coverage_categories.length,
      profile && profile.payout_preference,
      profile && profile.proof_comfort
    ];
    var complete = checks.filter(Boolean).length;
    return Math.round((complete / checks.length) * 100);
  }

  function chooseNextAction(profile, contributions, cashouts) {
    var completion = profileCompletion(profile);
    var balance = Number(profile && profile.current_balance || 0);
    var pendingContribution = (contributions || []).find(function (item) {
      return ['pending', 'pending_review'].indexOf(item.status) !== -1 || item.review_required;
    });
    var pendingCashout = (cashouts || []).find(function (item) {
      return item.status === 'pending' || item.status === 'processing';
    });

    if (completion < 70) {
      return {
        title: 'Verify your contributor profile',
        meta: 'Save coverage areas, payout preference, and proof comfort so review has enough context.',
        href: '/tools/afropoints/contributor-playbook.html',
        label: 'Verify profile'
      };
    }

    if (pendingCashout) {
      return {
        title: 'Track your cashout review',
        meta: 'Your payout request is queued. Fiat and crypto cashouts stay review-based before release.',
        href: '/tools/afropoints/cashout.html',
        label: 'View cashout'
      };
    }

    if (balance >= CASHOUT_MIN) {
      return {
        title: 'Cashout is ready',
        meta: 'You have reached the 2,000 point threshold for mobile money, bank transfer, or reviewed crypto payout.',
        href: '/tools/afropoints/cashout.html',
        label: 'Open cashout'
      };
    }

    if (pendingContribution) {
      return {
        title: 'Track review and add proof where useful',
        meta: getCategoryLabel(pendingContribution.subtype || pendingContribution.data_category) + ' is still in review or waiting for confirmation.',
        href: '/tools/afropoints/verification.html',
        label: 'Review status'
      };
    }

    if (!profile || Number(profile.contributions_count || 0) === 0) {
      return {
        title: 'Submit your first market observation',
        meta: 'Start with a category you can verify: a fare, price, fee, salary, rent ask, or remittance quote.',
        href: '/tools/afropoints/contribute.html',
        label: 'Submit data'
      };
    }

    return {
      title: 'Add another useful observation',
      meta: 'Repeatable local coverage builds trust faster than one-off reports.',
      href: '/tools/afropoints/contribute.html',
      label: 'Submit data'
    };
  }

  function buildActivityRows(activity, contributions) {
    var rows = [];
    (contributions || []).slice(0, 3).forEach(function (item) {
      rows.push({
        name: getCategoryLabel(item.subtype || item.data_category),
        meta: [item.city, item.country_code, item.status || 'pending'].filter(Boolean).join(' | '),
        chip: item.review_required ? 'Review' : titleCase(item.status || 'Pending'),
        chipClass: item.status === 'confirmed' ? 'good' : 'warn',
        date: item.submitted_at || item.observed_at || item.created_at
      });
    });
    (activity || []).slice(0, 3).forEach(function (item) {
      rows.push({
        name: item.description || titleCase(item.reason || 'Points activity'),
        meta: formatDate(item.created_at),
        chip: (Number(item.amount || 0) > 0 ? '+' : '') + formatPoints(item.amount || 0),
        chipClass: Number(item.amount || 0) >= 0 ? 'good' : 'warn',
        date: item.created_at
      });
    });

    rows.sort(function (left, right) {
      return new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime();
    });

    return rows.slice(0, 4);
  }

  function saveCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        saved_at: new Date().toISOString(),
        data: data
      }));
    } catch (error) {}
  }

  function readCache() {
    try {
      var parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return parsed && parsed.data ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function renderState(message, actionHtml) {
    var container = $('dashboardAfroPointsLane');
    if (!container) return;
    container.innerHTML = '<div class="afropoints-state">' + message + (actionHtml || '') + '</div>';
  }

  function renderSignedOut() {
    renderState(
      'Sign in to connect AfroPoints with your saved tools, history, and workspace items.',
      '<div class="afropoints-chip-row" style="justify-content:center;"><a class="afropoints-action" href="/tools/afropoints/">Open AfroPoints</a></div>'
    );
  }

  function renderLane(data, staleLabel) {
    var container = $('dashboardAfroPointsLane');
    if (!container) return;

    var profile = data.profile || {};
    var activity = Array.isArray(data.activity) ? data.activity : [];
    var contributions = Array.isArray(data.contributions) ? data.contributions : [];
    var cashouts = Array.isArray(data.cashouts) ? data.cashouts : [];
    var balance = Number(profile.current_balance || 0);
    var completion = profileCompletion(profile);
    var trustScore = Math.round(Number(profile.trust_score || 50));
    var cashoutPct = Math.min(100, Math.round((balance / CASHOUT_MIN) * 100));
    var pendingReviews = contributions.filter(function (item) {
      return item.review_required || ['pending', 'pending_review'].indexOf(item.status) !== -1;
    }).length;
    var pendingCashout = cashouts.find(function (item) {
      return item.status === 'pending' || item.status === 'processing';
    });
    var next = chooseNextAction(profile, contributions, cashouts);
    var rows = buildActivityRows(activity, contributions);
    var empty = Number(profile.contributions_count || 0) === 0 && rows.length === 0;
    var chips = [
      '<span class="afropoints-chip info">' + escapeHtml(staleLabel || 'Synced account data') + '</span>',
      '<span class="afropoints-chip ' + (pendingReviews ? 'warn' : 'good') + '">' + (pendingReviews ? pendingReviews + ' in review' : 'No unresolved reviews') + '</span>',
      '<span class="afropoints-chip ' + (pendingCashout ? 'warn' : 'info') + '">' + (pendingCashout ? 'Cashout pending' : 'No pending payout') + '</span>'
    ];

    container.innerHTML =
      '<div class="afropoints-lane-head">' +
        '<div>' +
          '<div class="afropoints-lane-kicker">Contributor data network</div>' +
          '<h3 class="afropoints-lane-title">Your AfroPoints lane</h3>' +
          '<div class="afropoints-lane-copy">Points, review state, profile readiness, and cashout progress live here so AfroPoints feels like part of your account instead of a separate tool page.</div>' +
        '</div>' +
        '<div class="afropoints-lane-actions">' +
          '<a class="afropoints-action" href="' + next.href + '">' + escapeHtml(next.label) + '</a>' +
          '<a class="afropoints-action secondary" href="/tools/afropoints/">Cockpit</a>' +
        '</div>' +
      '</div>' +
      '<div class="afropoints-lane-body">' +
        '<div class="afropoints-metrics">' +
          '<div class="afropoints-metric"><div class="afropoints-metric-label">Points</div><div class="afropoints-metric-value">' + formatPoints(balance) + '</div><div class="afropoints-metric-note">' + formatPoints(Math.max(0, CASHOUT_MIN - balance)) + ' pts to cashout threshold</div></div>' +
          '<div class="afropoints-metric"><div class="afropoints-metric-label">Cashout</div><div class="afropoints-metric-value">' + cashoutPct + '%</div><div class="afropoints-progress"><div class="afropoints-progress-fill" style="width:' + cashoutPct + '%"></div></div><div class="afropoints-metric-note">2,000 pts minimum for reviewed cash payouts</div></div>' +
          '<div class="afropoints-metric"><div class="afropoints-metric-label">Trust</div><div class="afropoints-metric-value">' + trustScore + '</div><div class="afropoints-metric-note">' + escapeHtml(titleCase(profile.rank || 'newcomer')) + ' contributor status</div></div>' +
          '<div class="afropoints-metric"><div class="afropoints-metric-label">Profile</div><div class="afropoints-metric-value">' + completion + '%</div><div class="afropoints-metric-note">Coverage and payout setup readiness</div></div>' +
        '</div>' +
        '<div class="afropoints-workflow">' +
          '<div class="afropoints-panel"><div class="afropoints-panel-title">Next action</div><div class="afropoints-next-title">' + escapeHtml(next.title) + '</div><div class="afropoints-next-meta">' + escapeHtml(next.meta) + '</div><div class="afropoints-chip-row">' + chips.join('') + '</div></div>' +
          '<div class="afropoints-panel"><div class="afropoints-panel-title">Recent AfroPoints activity</div>' +
            (empty
              ? '<div class="afropoints-next-meta">No submissions yet. Use AfroPoints to submit local data, then review and payout states will appear here.</div>'
              : '<div class="afropoints-activity-list">' + rows.map(function (row) {
                  return '<div class="afropoints-activity-row"><span class="afropoints-activity-main"><span class="afropoints-activity-name">' + escapeHtml(row.name) + '</span><span class="afropoints-activity-meta">' + escapeHtml(row.meta || '') + '</span></span><span class="afropoints-chip ' + row.chipClass + '">' + escapeHtml(row.chip) + '</span></div>';
                }).join('') + '</div>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  async function fetchLaneData() {
    var AP = window.AfroPointsEngine;
    var profilePromise = AP && typeof AP.getProfile === 'function'
      ? AP.getProfile()
      : apiGet('/afropoints-profile');
    var activityPromise = AP && typeof AP.getActivity === 'function'
      ? AP.getActivity(6)
      : apiGet('/afropoints-profile?action=activity&limit=6');
    var cashoutPromise = AP && typeof AP.getCashoutHistory === 'function'
      ? AP.getCashoutHistory()
      : apiGet('/afropoints-cashout?action=history');

    var results = await Promise.allSettled([
      profilePromise,
      activityPromise,
      apiGet('/afropoints-profile?action=contributions&limit=6'),
      cashoutPromise
    ]);

    if (results[0].status !== 'fulfilled' || (results[0].value && results[0].value.error)) {
      throw results[0].reason || new Error(results[0].value && results[0].value.error || 'Profile unavailable');
    }

    return {
      profile: results[0].value || {},
      activity: results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [],
      contributions: results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : [],
      cashouts: results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : []
    };
  }

  async function refresh() {
    var container = $('dashboardAfroPointsLane');
    if (!container) return;

    if (!isSignedIn()) {
      renderSignedOut();
      return;
    }

    if (navigator && navigator.onLine === false) {
      var offlineCache = readCache();
      if (offlineCache) {
        renderLane(offlineCache.data, 'Offline cache from ' + formatDate(offlineCache.saved_at));
      } else {
        renderState('You are offline. AfroPoints account data will appear here when the dashboard can reconnect.');
      }
      return;
    }

    renderState('Loading AfroPoints account data...');

    try {
      var data = await fetchLaneData();
      saveCache(data);
      renderLane(data);
    } catch (error) {
      var cached = readCache();
      if (cached) {
        renderLane(cached.data, 'Cached from ' + formatDate(cached.saved_at));
        return;
      }
      renderState(
        'AfroPoints account data is unavailable right now. Saved tools and workspace items still work.',
        '<div class="afropoints-chip-row" style="justify-content:center;"><a class="afropoints-action secondary" href="/tools/afropoints/contribute.html">Submit data</a><a class="afropoints-action secondary" href="/tools/afropoints/cashout.html">Cashout</a></div>'
      );
    }
  }

  window.DashboardAfroPointsLane = { refresh: refresh };

  window.addEventListener('afro-auth-change', refresh);
  window.addEventListener('online', refresh);
  window.addEventListener('offline', refresh);
  window.addEventListener('focus', refresh);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(refresh, 400);
  });
})(window, document);
