(function (window, document) {
  'use strict';

  var FOREX_ENDPOINT = '/api/forex';
  var REQUEST_TIMEOUT_MS = 6000;

  var COUNTRY_TO_CODE = {
    nigeria: 'NG',
    kenya: 'KE',
    'south africa': 'ZA',
    ghana: 'GH',
    egypt: 'EG',
    tanzania: 'TZ',
    uganda: 'UG',
    rwanda: 'RW',
    ethiopia: 'ET',
    senegal: 'SN',
    cameroon: 'CM',
    morocco: 'MA',
    algeria: 'DZ',
    tunisia: 'TN',
    zambia: 'ZM',
    zimbabwe: 'ZW',
    botswana: 'BW',
    mozambique: 'MZ',
    angola: 'AO',
    namibia: 'NA',
    mauritius: 'MU'
  };

  var COUNTRY_CURRENCIES = {
    NG: 'NGN',
    KE: 'KES',
    ZA: 'ZAR',
    GH: 'GHS',
    EG: 'EGP',
    TZ: 'TZS',
    UG: 'UGX',
    RW: 'RWF',
    ET: 'ETB',
    SN: 'XOF',
    CM: 'XAF',
    MA: 'MAD',
    DZ: 'DZD',
    TN: 'TND',
    ZM: 'ZMW',
    ZW: 'ZWL',
    BW: 'BWP',
    MZ: 'MZN',
    AO: 'AOA',
    NA: 'NAD',
    MU: 'MUR'
  };

  var PAYE_TOOL_BY_COUNTRY = {
    NG: '/nigeria/ng-salary-tax/',
    KE: '/kenya/ke-paye/',
    ZA: '/south-africa/za-paye/',
    GH: '/ghana/gh-paye/',
    TZ: '/tanzania/tz-paye/',
    UG: '/uganda/ug-paye/',
    RW: '/rwanda/rw-paye/',
    ET: '/ethiopia/et-paye/',
    SN: '/senegal/sn-paye/',
    CM: '/cameroon/cm-paye/',
    EG: '/egypt/eg-paye/'
  };

  var currentUser = null;
  var extendedProfile = {};
  var recentHistory = [];
  var recentToolUses = [];
  var savedCalculationItems = [];
  var forexData = null;
  var SAVED_CALCULATIONS_EVENT = 'afro-saved-calculations-change';
  var LOCAL_SAVED_CALC_KEY_PREFIX = 'afrotools-saved-';
  var LEGACY_LOCAL_CALC_KEYS = {
    'afrotools-saved-ng-salary-tax': {
      toolSlug: 'ng-paye',
      href: '/nigeria/ng-salary-tax/',
      currency: 'NGN'
    }
  };

  function withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error('timeout'));
        }, timeoutMs || REQUEST_TIMEOUT_MS);
      })
    ]);
  }

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value || '';
    return node.innerHTML;
  }

  function getTimestamp(value) {
    if (!value) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatRelativeTime(value) {
    var timestamp = getTimestamp(value);
    if (!timestamp) return 'recently';

    var seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';

    var days = Math.floor(seconds / 86400);
    if (days === 1) return 'yesterday';
    if (days < 7) return days + 'd ago';

    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrency(value, currency) {
    if (value === null || value === undefined || value === '') return '--';

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    } catch (error) {
      return (currency || 'USD') + ' ' + Math.round(Number(value) || 0).toLocaleString();
    }
  }

  function formatPercent(value) {
    if (value === null || value === undefined || value === '') return '--';
    var numeric = normalizeRateValue(value);
    if (numeric === null) return '--';
    return numeric.toFixed(1) + '%';
  }

  function normalizeRateValue(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    if (numeric > 0 && numeric <= 1) return numeric * 100;
    return numeric;
  }

  function summarizeSavedCalculationPayload(payload, currency, fallbackSummary) {
    if (typeof fallbackSummary === 'string' && fallbackSummary.trim()) {
      return fallbackSummary.trim();
    }

    var data = payload && typeof payload === 'object' ? payload : {};
    if (typeof data.summary === 'string' && data.summary.trim()) {
      return data.summary.trim();
    }

    if (data.fields && data.fields.summary) {
      return String(data.fields.summary);
    }

    var snapshot = data && data.snapshot ? data.snapshot : {};
    var parts = [];

    if (snapshot.regime === 'nta') {
      parts.push('NTA 2026');
    } else if (snapshot.regime === 'pita') {
      parts.push('PITA 2025');
    }

    if (typeof snapshot.netMonthly === 'number' && Number.isFinite(snapshot.netMonthly)) {
      parts.push('Take-home ' + formatCurrency(snapshot.netMonthly, currency) + '/mo');
    } else if (typeof snapshot.netAnnual === 'number' && Number.isFinite(snapshot.netAnnual)) {
      parts.push('Net ' + formatCurrency(snapshot.netAnnual, currency) + '/yr');
    } else if (typeof snapshot.tax === 'number' && Number.isFinite(snapshot.tax)) {
      parts.push('Tax ' + formatCurrency(snapshot.tax, currency));
    }

    var rate = normalizeRateValue(snapshot.effectiveRate);
    if (rate !== null) {
      parts.push('Rate ' + rate.toFixed(1) + '%');
    }

    return parts.length ? parts.join(' | ') : 'Saved calculation';
  }

  function firstFiniteNumber() {
    for (var index = 0; index < arguments.length; index += 1) {
      var value = arguments[index];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }
    return null;
  }

  function getCountryCode() {
    var rawCountry = (currentUser && currentUser.country) || extendedProfile.country || '';
    if (!rawCountry) return 'NG';

    if (rawCountry.length === 2 && rawCountry.toUpperCase() === rawCountry) {
      return rawCountry;
    }

    return COUNTRY_TO_CODE[String(rawCountry).toLowerCase()] || 'NG';
  }

  function getCountryCurrency() {
    return COUNTRY_CURRENCIES[getCountryCode()] || 'NGN';
  }

  function titleCase(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function getCountryName() {
    var rawCountry = (extendedProfile && (extendedProfile.country_name || extendedProfile.country)) || (currentUser && currentUser.country) || '';
    var countryCode = getCountryCode();

    if (typeof AFRICAN_COUNTRIES !== 'undefined' && Array.isArray(AFRICAN_COUNTRIES)) {
      var countryMatch = AFRICAN_COUNTRIES.find(function (entry) {
        return entry && entry.code === countryCode;
      });

      if (countryMatch && countryMatch.name) {
        return countryMatch.name;
      }
    }

    if (rawCountry && rawCountry.length > 2) {
      return titleCase(rawCountry);
    }

    return countryCode || 'Your market';
  }

  function getUserDisplayName() {
    var rawName = (currentUser && currentUser.name) || extendedProfile.full_name || extendedProfile.name || '';

    if (!rawName && currentUser && currentUser.email) {
      rawName = currentUser.email.split('@')[0];
    }

    if (!rawName) return 'there';
    return titleCase(String(rawName).split(/\s+/)[0]);
  }

  function getUserInitial() {
    var rawName = (currentUser && currentUser.name) || extendedProfile.full_name || extendedProfile.name || (currentUser && currentUser.email) || 'A';
    return String(rawName).trim().charAt(0).toUpperCase() || 'A';
  }

  function getTimeGreeting() {
    var hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function getProfileCompletion() {
    if (typeof calculateCompleteness === 'function') {
      try {
        return calculateCompleteness(currentUser || {}, extendedProfile || {});
      } catch (error) {
        // Fall through to the lightweight heuristic below.
      }
    }

    var fields = [
      currentUser && currentUser.name,
      currentUser && currentUser.country,
      extendedProfile && extendedProfile.bio,
      extendedProfile && extendedProfile.job_title,
      extendedProfile && extendedProfile.company,
      extendedProfile && extendedProfile.phone,
      extendedProfile && extendedProfile.city
    ];

    var completed = fields.filter(Boolean).length;
    return Math.round(completed / fields.length * 100);
  }

  function formatShortDate(value) {
    var timestamp = getTimestamp(value);
    if (!timestamp) return 'soon';

    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function getToolHref(toolId) {
    if (typeof AFRO_TOOLS !== 'undefined') {
      var tool = AFRO_TOOLS.find(function (entry) {
        return entry.id === toolId;
      });
      if (tool && tool.href) return tool.href;
    }

    return '/tools/' + toolId + '/';
  }

  function getToolMeta(toolId, fallbackName) {
    if (typeof AFRO_TOOLS !== 'undefined') {
      var tool = AFRO_TOOLS.find(function (entry) {
        return entry.id === toolId;
      });
      if (tool) {
        return {
          id: tool.id,
          name: tool.name,
          icon: tool.icon || '&#128736;',
          href: tool.href || getToolHref(tool.id)
        };
      }
    }

    return {
      id: toolId,
      name: fallbackName || toolId || 'Tool',
      icon: '&#128736;',
      href: getToolHref(toolId || '')
    };
  }

  function buildLocalSavedCalculationItem(storageKey, item) {
    if (!item || !item.id) return null;

    var payload = item.data || {};
    var legacyConfig = LEGACY_LOCAL_CALC_KEYS[storageKey] || null;
    var hasStructuredPayload = payload && payload.version === 2 && payload.toolSlug && payload.snapshot;
    if (!hasStructuredPayload && !legacyConfig) return null;

    var toolSlug = payload.toolSlug || (legacyConfig ? legacyConfig.toolSlug : '');
    if (!toolSlug) return null;

    var toolMeta = getToolMeta(toolSlug, payload.toolName || 'Saved calculation');
    var currency = payload.currency || (legacyConfig ? legacyConfig.currency : getCountryCurrency());
    var summary = summarizeSavedCalculationPayload(payload, currency, item.data && item.data.summary ? item.data.summary : '');

    return {
      item_key: item.id,
      tool_slug: toolSlug,
      title: item.title || payload.toolName || toolMeta.name || 'Saved calculation',
      summary: summary,
      payload: payload,
      updated_at: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
      created_at: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      href: ((legacyConfig && legacyConfig.href) || toolMeta.href) + '?saved_calc=' + encodeURIComponent(item.id),
      local_only: true,
      meta: {
        currency: currency
      }
    };
  }

  function readLocalSavedCalculations() {
    var items = [];

    for (var index = 0; index < localStorage.length; index += 1) {
      var storageKey = localStorage.key(index);
      if (!storageKey || storageKey.indexOf(LOCAL_SAVED_CALC_KEY_PREFIX) !== 0) continue;

      var rawItems = [];
      try {
        rawItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch (error) {
        rawItems = [];
      }

      if (!Array.isArray(rawItems)) continue;

      rawItems.forEach(function (item) {
        var normalized = buildLocalSavedCalculationItem(storageKey, item);
        if (normalized) {
          items.push(normalized);
        }
      });
    }

    return items;
  }

  function mergeSavedCalculationItems(remoteItems) {
    var merged = Object.create(null);

    (remoteItems || []).forEach(function (item) {
      if (!item || !item.item_key) return;
      merged[item.item_key] = item;
    });

    readLocalSavedCalculations().forEach(function (item) {
      var existing = merged[item.item_key];
      if (!existing || getTimestamp(item.updated_at) > getTimestamp(existing.updated_at || existing.created_at)) {
        merged[item.item_key] = item;
      }
    });

    return Object.keys(merged).map(function (itemKey) {
      return merged[itemKey];
    }).sort(function (left, right) {
      return getTimestamp(right.updated_at || right.created_at) - getTimestamp(left.updated_at || left.created_at);
    });
  }

  function summarizeHistoryItem(item) {
    var outputs = item && item.outputs ? item.outputs : {};
    var numericValue = firstFiniteNumber(
      outputs.net_monthly,
      outputs.netMonthly,
      outputs.net_pay,
      outputs.takeHome,
      outputs.total,
      outputs.result
    );

    if (typeof numericValue === 'number' && Number.isFinite(numericValue)) {
      return formatCurrency(numericValue, item.currency || getCountryCurrency());
    }

    var rate = normalizeRateValue(outputs.effective_rate);
    if (rate === null) {
      rate = normalizeRateValue(outputs.effectiveRate);
    }

    if (rate !== null) {
      return rate.toFixed(1) + '%';
    }

    return 'Open tool';
  }

  function getLatestPayeSnapshot() {
    var historyItem = recentHistory.find(function (item) {
      return item && item.tool_slug && (item.tool_slug.indexOf('paye') !== -1 || item.tool_slug.indexOf('salary-tax') !== -1);
    });

    if (historyItem && historyItem.outputs) {
      return {
        source: 'history',
        updatedAt: historyItem.created_at,
        currency: historyItem.currency || getCountryCurrency(),
        snapshot: {
          netMonthly: firstFiniteNumber(
            historyItem.outputs.net_monthly,
            historyItem.outputs.netMonthly,
            historyItem.outputs.net_pay,
            historyItem.outputs.takeHome
          ),
          effectiveRate: normalizeRateValue(firstFiniteNumber(
            historyItem.outputs.effective_rate,
            historyItem.outputs.effectiveRate,
            historyItem.outputs.tax_rate
          ))
        }
      };
    }

    var savedItem = savedCalculationItems.find(function (item) {
      var payload = item && item.payload ? item.payload : {};
      var toolSlug = (item && item.tool_slug) || payload.toolSlug || '';
      var isPayeTool = toolSlug.indexOf('paye') !== -1 || toolSlug.indexOf('salary-tax') !== -1;
      return isPayeTool && payload.snapshot && typeof payload.snapshot.netMonthly === 'number';
    });

    if (savedItem && savedItem.payload && savedItem.payload.snapshot) {
      return {
        source: 'saved',
        updatedAt: savedItem.updated_at || savedItem.created_at,
        currency: (savedItem.meta && savedItem.meta.currency) || savedItem.payload.currency || getCountryCurrency(),
        snapshot: {
          netMonthly: savedItem.payload.snapshot.netMonthly,
          effectiveRate: normalizeRateValue(savedItem.payload.snapshot.effectiveRate)
        }
      };
    }

    return null;
  }

  function getCombinedActivity() {
    var activity = [];

    recentHistory.forEach(function (item) {
      if (!item) return;
      activity.push({
        kind: 'history',
        id: 'history-' + (item.id || item.created_at || Math.random()),
        toolId: item.tool_slug || '',
        title: item.tool_name || item.tool_slug || 'Calculation',
        href: getToolHref(item.tool_slug || ''),
        icon: getToolMeta(item.tool_slug || '', item.tool_name).icon,
        value: summarizeHistoryItem(item),
        timestamp: item.created_at
      });
    });

    recentToolUses.forEach(function (item) {
      if (!item || !item.toolId) return;

      var toolMeta = getToolMeta(item.toolId, item.name || item.toolId);
      activity.push({
        kind: 'usage',
        id: 'usage-' + item.toolId + '-' + (item.date || ''),
        toolId: item.toolId,
        title: toolMeta.name,
        href: toolMeta.href,
        icon: toolMeta.icon,
        value: 'Opened tool',
        timestamp: item.date
      });
    });

    var seen = Object.create(null);
    return activity.sort(function (left, right) {
      return getTimestamp(right.timestamp) - getTimestamp(left.timestamp);
    }).filter(function (item) {
      var dedupeKey = item.kind === 'history' ? item.id : item.toolId + '-' + item.kind;
      if (seen[dedupeKey]) return false;
      seen[dedupeKey] = true;
      return true;
    });
  }

  function getUsedToolCount() {
    var seen = Object.create(null);

    getCombinedActivity().forEach(function (item) {
      if (item.toolId) {
        seen[item.toolId] = true;
      }
    });

    return Object.keys(seen).length;
  }

  function getNextDeadline() {
    if (!window.AfroTaxCalendar || typeof window.AfroTaxCalendar.getUpcomingDeadlines !== 'function') {
      return null;
    }

    try {
      var deadlines = window.AfroTaxCalendar.getUpcomingDeadlines(getCountryCode(), 60) || [];
      return deadlines.length ? deadlines[0] : null;
    } catch (error) {
      console.warn('[DashboardApp] Could not load deadlines:', error.message || error);
      return null;
    }
  }

  function getFxWatch() {
    var currency = getCountryCurrency();
    var rate = forexData && forexData.rates ? Number(forexData.rates[currency]) : NaN;

    if (!Number.isFinite(rate) || rate <= 0) {
      return null;
    }

    return {
      currency: currency,
      rate: rate,
      updatedAt: forexData.updated_at || forexData.timestamp || null
    };
  }

  function getHeaderFocus(payeHref) {
    var latestPaye = getLatestPayeSnapshot();
    var latestActivity = getCombinedActivity()[0] || null;
    var nextDeadline = getNextDeadline();

    if (savedCalculationItems.length > 0) {
      return {
        label: 'Focus today',
        title: 'Review ' + savedCalculationItems.length + ' saved scenario' + (savedCalculationItems.length === 1 ? '' : 's'),
        meta: latestPaye && latestPaye.snapshot && latestPaye.snapshot.netMonthly !== null
          ? 'Latest take-home: ' + formatCurrency(latestPaye.snapshot.netMonthly, latestPaye.currency || getCountryCurrency()) + '/mo'
          : 'Open your workspace and continue from a saved calculator state.',
        href: '#myWorkspace'
      };
    }

    if (nextDeadline && typeof nextDeadline.daysUntil === 'number' && nextDeadline.daysUntil <= 14) {
      return {
        label: 'Up next',
        title: nextDeadline.name || 'Prepare your next filing',
        meta: (nextDeadline.daysUntil === 0
          ? 'Due today'
          : nextDeadline.daysUntil === 1
            ? 'Due tomorrow'
            : 'Due in ' + nextDeadline.daysUntil + ' days') + ' | ' + formatShortDate(nextDeadline.nextDate),
        href: '#taxCalendar'
      };
    }

    if (latestActivity) {
      return {
        label: 'Continue',
        title: latestActivity.title,
        meta: latestActivity.kind === 'history'
          ? 'Latest result: ' + latestActivity.value
          : 'Resume the last tool you opened.',
        href: latestActivity.href
      };
    }

    return {
      label: 'Get started',
      title: 'Run your first PAYE calculation',
      meta: 'Your numbers, saved scenarios, and recent activity will start filling in automatically.',
      href: payeHref
    };
  }

  function getActivityMeta(item) {
    if (!item) return '';

    if (item.kind === 'history') {
      return item.value && item.value !== 'Open tool'
        ? 'Latest result: ' + item.value
        : 'Saved calculator activity';
    }

    return 'Tool opened recently';
  }

  function renderHeader() {
    var container = document.getElementById('mnHeader');
    if (!container || !currentUser) return;

    var countryCode = getCountryCode();
    var countryName = getCountryName();
    var currency = getCountryCurrency();
    var usedToolCount = getUsedToolCount();
    var savedCount = savedCalculationItems.length;
    var profileCompletion = getProfileCompletion();
    var payeHref = PAYE_TOOL_BY_COUNTRY[countryCode] || '/salary-tax/';
    var focus = getHeaderFocus(payeHref);
    var avatarUrl = (currentUser && currentUser.avatar_url) || extendedProfile.avatar_url || '';
    var avatarHtml = avatarUrl
      ? '<img src="' + escapeHtml(avatarUrl) + '" alt="' + escapeHtml(getUserDisplayName()) + '" class="mn-avatar-img">'
      : '<div class="mn-avatar-initial" style="background:linear-gradient(135deg,#007AFF,#4DA3FF);">' + escapeHtml(getUserInitial()) + '</div>';

    container.style.display = '';
    container.innerHTML =
      '<div class="mn-header-left">' +
        '<div class="mn-avatar">' + avatarHtml + '</div>' +
        '<div class="mn-header-copy">' +
          '<div class="mn-greeting">' + escapeHtml(getTimeGreeting() + ', ' + getUserDisplayName()) + '</div>' +
          '<div class="mn-header-meta">' +
            '<span>' + escapeHtml(countryName + ' workspace') + '</span>' +
            '<span class="mn-header-sep">&middot;</span>' +
            '<span>' + escapeHtml(profileCompletion + '% profile ready') + '</span>' +
            '<span class="mn-header-sep">&middot;</span>' +
            '<span>' + escapeHtml(currency + ' context') + '</span>' +
          '</div>' +
          '<div class="mn-header-pills">' +
            '<span class="mn-currency-badge">' + escapeHtml(countryCode + ' / ' + currency) + '</span>' +
            '<span class="mn-header-pill">' + escapeHtml(savedCount + ' saved calc' + (savedCount === 1 ? '' : 's')) + '</span>' +
            '<span class="mn-header-pill">' + escapeHtml(usedToolCount + ' tool' + (usedToolCount === 1 ? '' : 's') + ' used') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mn-header-actions">' +
        '<a href="' + focus.href + '" class="mn-header-focus">' +
          '<span class="mn-header-focus-kicker">' + escapeHtml(focus.label) + '</span>' +
          '<span class="mn-header-focus-title">' + escapeHtml(focus.title) + '</span>' +
          '<span class="mn-header-focus-meta">' + escapeHtml(focus.meta) + '</span>' +
        '</a>' +
        '<button type="button" class="mn-header-action" id="mnEditProfileBtn">Edit Profile</button>' +
      '</div>';

    var editProfileButton = document.getElementById('mnEditProfileBtn');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', function () {
        if (typeof openProfileEditor === 'function') {
          openProfileEditor();
        }
      });
    }
  }

  function renderCountrySnapshot() {
    var container = document.getElementById('countrySnapshot');
    if (!container || !currentUser) return;

    var countryCode = getCountryCode();
    var countryName = getCountryName();
    var currency = getCountryCurrency();
    var payeHref = PAYE_TOOL_BY_COUNTRY[countryCode] || '/salary-tax/';
    var latestPaye = getLatestPayeSnapshot();
    var latestActivity = getCombinedActivity()[0] || null;
    var nextDeadline = getNextDeadline();
    var fxWatch = getFxWatch();
    var cards = [];

    cards.push(
      '<div class="snapshot-card">' +
        '<div class="snapshot-card-label">Home Market</div>' +
        '<div class="snapshot-card-value">' + escapeHtml(countryName) + '</div>' +
        '<div class="snapshot-card-meta">' + escapeHtml(countryCode + ' / ' + currency + ' workspace') + '</div>' +
      '</div>'
    );

    if (latestPaye && latestPaye.snapshot && latestPaye.snapshot.netMonthly !== null) {
      cards.push(
        '<a href="' + payeHref + '" class="snapshot-card snapshot-card-link">' +
          '<div class="snapshot-card-label">Latest PAYE</div>' +
          '<div class="snapshot-card-value">' + escapeHtml(formatCurrency(latestPaye.snapshot.netMonthly, latestPaye.currency || currency)) + '/mo</div>' +
          '<div class="snapshot-card-meta">Updated ' + escapeHtml(formatRelativeTime(latestPaye.updatedAt)) + '</div>' +
        '</a>'
      );
    } else {
      cards.push(
        '<a href="' + payeHref + '" class="snapshot-card snapshot-card-link">' +
          '<div class="snapshot-card-label">Latest PAYE</div>' +
          '<div class="snapshot-card-value">Run calculator</div>' +
          '<div class="snapshot-card-meta">Start filling your dashboard with salary and tax data.</div>' +
        '</a>'
      );
    }

    if (nextDeadline) {
      cards.push(
        '<a href="#taxCalendar" class="snapshot-card snapshot-card-link">' +
          '<div class="snapshot-card-label">Next Tax Deadline</div>' +
          '<div class="snapshot-card-value">' + escapeHtml(formatShortDate(nextDeadline.nextDate)) + '</div>' +
          '<div class="snapshot-card-meta">' + escapeHtml(
            (nextDeadline.daysUntil === 0
              ? 'Due today'
              : nextDeadline.daysUntil === 1
                ? 'Due tomorrow'
                : 'Due in ' + nextDeadline.daysUntil + ' days') + ' | ' + (nextDeadline.name || 'Upcoming deadline')
          ) + '</div>' +
        '</a>'
      );
    } else {
      cards.push(
        '<a href="#taxCalendar" class="snapshot-card snapshot-card-link">' +
          '<div class="snapshot-card-label">Next Tax Deadline</div>' +
          '<div class="snapshot-card-value">All clear</div>' +
          '<div class="snapshot-card-meta">No major deadlines surfaced in the next 60 days.</div>' +
        '</a>'
      );
    }

    if (fxWatch) {
      cards.push(
        '<a href="/tools/currency-converter/" class="snapshot-card snapshot-card-link">' +
          '<div class="snapshot-card-label">FX Watch</div>' +
          '<div class="snapshot-card-value">1 USD = ' + escapeHtml(fxWatch.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })) + ' ' + escapeHtml(fxWatch.currency) + '</div>' +
          '<div class="snapshot-card-meta">' + escapeHtml(fxWatch.updatedAt ? 'Updated ' + formatRelativeTime(fxWatch.updatedAt) : 'Latest rate available') + '</div>' +
        '</a>'
      );
    } else {
      cards.push(
        '<a href="/tools/currency-converter/" class="snapshot-card snapshot-card-link">' +
          '<div class="snapshot-card-label">FX Watch</div>' +
          '<div class="snapshot-card-value">Open converter</div>' +
          '<div class="snapshot-card-meta">Track live currency movement for your market.</div>' +
        '</a>'
      );
    }

    cards.push(
      '<a href="' + (latestActivity ? latestActivity.href : '#myWorkspace') + '" class="snapshot-card snapshot-card-link">' +
        '<div class="snapshot-card-label">' + escapeHtml(savedCalculationItems.length ? 'Saved Workspace' : 'Resume Activity') + '</div>' +
        '<div class="snapshot-card-value">' + escapeHtml(
          savedCalculationItems.length
            ? savedCalculationItems.length + ' scenario' + (savedCalculationItems.length === 1 ? '' : 's')
            : (latestActivity ? latestActivity.title : 'Start using tools')
        ) + '</div>' +
        '<div class="snapshot-card-meta">' + escapeHtml(
          savedCalculationItems.length
            ? 'Open your dashboard workspace and continue from a saved state.'
            : latestActivity
              ? getActivityMeta(latestActivity)
              : 'Recent tools and saved calculations will appear here automatically.'
        ) + '</div>' +
      '</a>'
    );

    container.innerHTML =
      '<div class="dash-widget snapshot-shell">' +
        '<div class="snapshot-header">' +
          '<div class="dash-widget-title">' +
            '<span class="widget-icon widget-icon--chart">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>' +
            '</span>' +
            'Country Snapshot' +
          '</div>' +
          '<div class="snapshot-hint">Signals for your market, latest salary activity, and the next useful action.</div>' +
        '</div>' +
        '<div class="snapshot-grid">' + cards.join('') + '</div>' +
      '</div>';
  }

  function renderLoadingState() {
    var summary = document.getElementById('mnSummaryCards');
    if (summary) {
      summary.innerHTML = [1, 2, 3, 4].map(function () {
        return '' +
          '<div class="mn-summary-card">' +
            '<div class="mn-skeleton" style="width:60%;height:14px;"></div>' +
            '<div class="mn-skeleton" style="width:80%;height:28px;margin-top:10px;"></div>' +
            '<div class="mn-skeleton" style="width:42%;height:12px;margin-top:10px;"></div>' +
          '</div>';
      }).join('');
    }

    var activity = document.getElementById('mnRecentActivity');
    if (activity) {
      activity.innerHTML = [1, 2, 3, 4].map(function () {
        return '' +
          '<div class="mn-activity-row" style="pointer-events:none;">' +
            '<div class="mn-skeleton" style="width:24px;height:24px;"></div>' +
            '<div class="mn-skeleton" style="width:50%;height:14px;"></div>' +
            '<div class="mn-skeleton" style="width:18%;height:14px;"></div>' +
            '<div class="mn-skeleton" style="width:16%;height:12px;"></div>' +
          '</div>';
      }).join('');
    }
  }

  function renderSummaryCards() {
    var container = document.getElementById('mnSummaryCards');
    if (!container) return;

    var countryCode = getCountryCode();
    var payeHref = PAYE_TOOL_BY_COUNTRY[countryCode] || '/salary-tax/';
    var latestPaye = getLatestPayeSnapshot();
    var usedToolCount = getUsedToolCount();
    var currency = latestPaye ? latestPaye.currency : getCountryCurrency();

    var cards = [];

    if (latestPaye && latestPaye.snapshot && latestPaye.snapshot.netMonthly !== null) {
      cards.push(
        '<div class="mn-summary-card">' +
          '<div class="mn-card-label">Take-Home Pay</div>' +
          '<div class="mn-card-value">' + escapeHtml(formatCurrency(latestPaye.snapshot.netMonthly, currency)) + '<span class="mn-card-period">/mo</span></div>' +
          '<div class="mn-card-sub">Updated ' + escapeHtml(formatRelativeTime(latestPaye.updatedAt)) + '</div>' +
        '</div>'
      );
    } else {
      cards.push(
        '<div class="mn-summary-card mn-card-empty">' +
          '<div class="mn-card-label">Take-Home Pay</div>' +
          '<a href="' + payeHref + '" class="mn-card-cta">Run a PAYE calculation &rarr;</a>' +
        '</div>'
      );
    }

    if (latestPaye && latestPaye.snapshot && latestPaye.snapshot.effectiveRate !== null) {
      cards.push(
        '<div class="mn-summary-card">' +
          '<div class="mn-card-label">Tax Rate</div>' +
          '<div class="mn-card-value-row">' +
            '<div class="mn-card-value">' + escapeHtml(formatPercent(latestPaye.snapshot.effectiveRate)) + '</div>' +
            '<div class="mn-donut" data-pct="' + escapeHtml(String(latestPaye.snapshot.effectiveRate || 0)) + '"></div>' +
          '</div>' +
          '<div class="mn-card-sub">Effective rate from your latest PAYE result</div>' +
        '</div>'
      );
    } else {
      cards.push(
        '<div class="mn-summary-card mn-card-empty">' +
          '<div class="mn-card-label">Tax Rate</div>' +
          '<div class="mn-card-value" style="color:#CBD5E1;">--%</div>' +
          '<div class="mn-card-sub">Run a calculator to see your rate</div>' +
        '</div>'
      );
    }

    if (savedCalculationItems.length > 0) {
      cards.push(
        '<div class="mn-summary-card">' +
          '<div class="mn-card-label">Saved Calculations</div>' +
          '<div class="mn-card-value">' + savedCalculationItems.length + '</div>' +
          '<div class="mn-card-sub"><a href="#myWorkspace" class="mn-link">Open saved scenarios &rarr;</a></div>' +
        '</div>'
      );
    } else {
      cards.push(
        '<div class="mn-summary-card mn-card-empty">' +
          '<div class="mn-card-label">Saved Calculations</div>' +
          '<a href="' + payeHref + '" class="mn-card-cta">Save a scenario &rarr;</a>' +
        '</div>'
      );
    }

    if (usedToolCount > 0) {
      cards.push(
        '<div class="mn-summary-card">' +
          '<div class="mn-card-label">Tools Used</div>' +
          '<div class="mn-card-value">' + usedToolCount + '</div>' +
          '<div class="mn-card-sub">Recent tools from this account and device</div>' +
        '</div>'
      );
    } else {
      cards.push(
        '<div class="mn-summary-card mn-card-empty">' +
          '<div class="mn-card-label">Tools Used</div>' +
          '<div class="mn-card-value" style="color:#CBD5E1;">0</div>' +
          '<div class="mn-card-sub">Use a tool and it will show up here</div>' +
        '</div>'
      );
    }

    if (forexData && forexData.rates && forexData.rates[currency]) {
      var rate = Number(forexData.rates[currency]);
      var updatedAt = forexData.updated_at || forexData.timestamp;

      cards.push(
        '<div class="mn-summary-card">' +
          '<div class="mn-card-label">FX Watch</div>' +
          '<div class="mn-card-value">1 USD = ' + escapeHtml(rate.toLocaleString(undefined, { maximumFractionDigits: 2 })) + ' ' + escapeHtml(currency) + '</div>' +
          '<div class="mn-card-sub">' + escapeHtml(updatedAt ? 'Updated ' + formatRelativeTime(updatedAt) : 'Latest market rate') + '</div>' +
        '</div>'
      );
    } else {
      cards.push(
        '<div class="mn-summary-card mn-card-empty">' +
          '<div class="mn-card-label">FX Watch</div>' +
          '<a href="/tools/currency-converter/" class="mn-card-cta">Check rates &rarr;</a>' +
        '</div>'
      );
    }

    container.innerHTML = cards.join('');

    Array.prototype.forEach.call(container.querySelectorAll('.mn-donut'), function (node) {
      var percent = parseFloat(node.getAttribute('data-pct') || '0') || 0;
      var circumference = 2 * Math.PI * 16;
      var dashOffset = circumference - Math.min(percent, 100) / 100 * circumference;
      node.innerHTML =
        '<svg width="40" height="40" viewBox="0 0 40 40">' +
          '<circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" stroke-width="4"></circle>' +
          '<circle cx="20" cy="20" r="16" fill="none" stroke="#007AFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + dashOffset + '" transform="rotate(-90 20 20)"></circle>' +
        '</svg>';
    });
  }

  function renderRecentActivity() {
    var container = document.getElementById('mnRecentActivity');
    if (!container) return;

    var activity = getCombinedActivity();

    if (activity.length === 0) {
      var suggestions = [];

      if (typeof AFRO_TOOLS !== 'undefined') {
        suggestions = AFRO_TOOLS.filter(function (tool) {
          return tool.status === 'live' || tool.status === 'new';
        }).sort(function (left, right) {
          return (right.priority || 0) - (left.priority || 0);
        }).slice(0, 3);
      }

      container.innerHTML =
        '<div class="mn-empty-state">' +
          '<div class="mn-empty-icon">&#128202;</div>' +
          '<div class="mn-empty-text">No activity yet.</div>' +
          '<div class="mn-empty-suggest">Use a calculator or save a scenario and it will appear here automatically.</div>' +
          (suggestions.length
            ? '<div class="mn-suggest-row">' + suggestions.map(function (tool) {
              return '<a href="' + tool.href + '" class="mn-suggest-chip">' + escapeHtml(tool.icon || '&#128736;') + ' ' + escapeHtml(tool.name) + '</a>';
            }).join('') + '</div>'
            : '') +
        '</div>';
      return;
    }

    container.innerHTML = activity.slice(0, 8).map(function (item) {
      var kindLabel = item.kind === 'history' ? 'Calculation' : 'Tool';
      var ctaLabel = item.kind === 'history' ? 'Reopen' : 'Open';

      return '' +
        '<a href="' + item.href + '" class="mn-activity-row">' +
          '<span class="mn-activity-icon">' + escapeHtml(item.icon) + '</span>' +
          '<span class="mn-activity-main">' +
            '<span class="mn-activity-topline">' +
              '<span class="mn-activity-name">' + escapeHtml(item.title) + '</span>' +
              '<span class="mn-activity-kind">' + escapeHtml(kindLabel) + '</span>' +
            '</span>' +
            '<span class="mn-activity-meta">' + escapeHtml(getActivityMeta(item)) + '</span>' +
          '</span>' +
          '<span class="mn-activity-cta">' + escapeHtml(ctaLabel) + '</span>' +
          '<span class="mn-activity-time">' + escapeHtml(formatRelativeTime(item.timestamp)) + '</span>' +
        '</a>';
    }).join('') + (activity.length > 4
      ? '<a href="#myWorkspace" class="mn-view-all">Open full workspace history &rarr;</a>'
      : '');
  }

  function renderRecommendations() {
    var container = document.getElementById('mnRecommendations');
    if (!container || typeof AFRO_TOOLS === 'undefined') return;

    var recentToolIds = getCombinedActivity().map(function (item) {
      return item.toolId;
    }).filter(Boolean);

    var usageStats = window.AfroData && typeof window.AfroData.getUsageStats === 'function'
      ? window.AfroData.getUsageStats()
      : { topCategory: '', toolCounts: {} };

    var scoredTools = AFRO_TOOLS.filter(function (tool) {
      return tool.status === 'live' || tool.status === 'new';
    }).map(function (tool) {
      var score = 0;
      var reason = '';

      if (recentToolIds.indexOf(tool.id) !== -1) {
        score -= 20;
      }

      if (usageStats.topCategory && tool.category === usageStats.topCategory) {
        score += 12;
        reason = 'Matches the category you use most';
      }

      if (!currentUser || !currentUser.country || tool.countries.indexOf('ALL') !== -1 || tool.countries.indexOf(currentUser.country) !== -1) {
        score += 6;
      }

      if (tool.status === 'new') {
        score += 3;
        reason = reason || 'New on AfroTools';
      }

      score += (tool.priority || 0) / 10;

      return {
        tool: tool,
        score: score,
        reason: reason || 'Recommended next'
      };
    }).sort(function (left, right) {
      return right.score - left.score;
    }).slice(0, 3);

    if (!scoredTools.length || scoredTools[0].score <= 0) {
      scoredTools = AFRO_TOOLS.filter(function (tool) {
        return tool.status === 'live' || tool.status === 'new';
      }).sort(function (left, right) {
        return (right.priority || 0) - (left.priority || 0);
      }).slice(0, 3).map(function (tool) {
        return {
          tool: tool,
          score: 0,
          reason: 'Popular tool'
        };
      });
    }

    var hint = scoredTools[0] ? scoredTools[0].reason : 'Recommended for you';

    container.innerHTML =
      '<div class="mn-rec-hint">' + escapeHtml(hint) + '</div>' +
      '<div class="mn-rec-row">' + scoredTools.map(function (entry) {
        return '' +
          '<a href="' + entry.tool.href + '" class="mn-rec-card">' +
            '<span class="mn-rec-icon">' + escapeHtml(entry.tool.icon || '&#128736;') + '</span>' +
            '<span class="mn-rec-name">' + escapeHtml(entry.tool.name) + '</span>' +
          '</a>';
      }).join('') + '</div>';
  }

  function renderQuickActions() {
    var container = document.getElementById('mnQuickActions');
    if (!container) return;

    var countryCode = getCountryCode();
    var payeHref = PAYE_TOOL_BY_COUNTRY[countryCode] || '/salary-tax/';
    var latestActivity = getCombinedActivity()[0] || null;
    var nextDeadline = getNextDeadline();
    var actions = [
      { icon: latestActivity ? '&#10227;' : '&#128176;', label: latestActivity ? 'Resume Latest' : 'Calculate Pay', href: latestActivity ? latestActivity.href : payeHref },
      { icon: '&#128202;', label: 'Saved Scenarios', href: '#myWorkspace' },
      { icon: '&#128197;', label: nextDeadline ? 'Tax Calendar' : 'Deadlines', href: '#taxCalendar' },
      { icon: '&#128193;', label: 'My Tools', href: '#myWorkspace' },
      { icon: '&#128177;', label: 'Convert Currency', href: '/tools/currency-converter/' }
    ];

    if (currentUser && currentUser.tier === 'pro') {
      actions.push({ icon: '&#9881;&#65039;', label: 'Manage Plan', href: '/pro/' });
    } else {
      actions.push({ icon: '&#11088;', label: 'Upgrade to Pro', href: '/pro/', cls: 'mn-qa-pro' });
    }

    container.innerHTML = actions.map(function (action) {
      return '' +
        '<a href="' + action.href + '" class="mn-qa-btn' + (action.cls ? ' ' + action.cls : '') + '">' +
          '<span class="mn-qa-icon">' + action.icon + '</span>' +
          '<span class="mn-qa-label">' + escapeHtml(action.label) + '</span>' +
        '</a>';
    }).join('');
  }

  function renderDashboardSurface() {
    renderHeader();
    renderSummaryCards();
    renderRecentActivity();
    renderCountrySnapshot();
    renderRecommendations();
    renderQuickActions();
  }

  async function refreshSavedCalculations() {
    var hasWorkspaceApi = window.AfroWorkspace && typeof window.AfroWorkspace.list === 'function';
    var workspaceReady = hasWorkspaceApi && typeof window.AfroWorkspace.isSignedIn === 'function' && window.AfroWorkspace.isSignedIn();

    if (hasWorkspaceApi && (workspaceReady || currentUser)) {
      try {
        var remoteItems = await withTimeout(window.AfroWorkspace.list({
          itemType: 'saved-calculation',
          limit: 60
        }), REQUEST_TIMEOUT_MS);

        savedCalculationItems = mergeSavedCalculationItems(remoteItems || []);
        return;
      } catch (error) {
        console.warn('[DashboardApp] Could not load saved calculations:', error.message || error);
      }
    }

    savedCalculationItems = mergeSavedCalculationItems([]);
  }

  async function refreshDashboardData() {
    recentToolUses = window.AfroData && typeof window.AfroData.getRecentTools === 'function'
      ? window.AfroData.getRecentTools()
      : [];

    try {
      var cachedProfile = localStorage.getItem('afro_profile_extended');
      if (cachedProfile) {
        extendedProfile = JSON.parse(cachedProfile) || {};
      }
    } catch (error) {
      extendedProfile = {};
    }

    var profilePromise = typeof fetchFullProfile === 'function'
      ? withTimeout(fetchFullProfile(), REQUEST_TIMEOUT_MS).catch(function () { return null; })
      : Promise.resolve(null);

    var historyPromise = window.AfroHistory && typeof window.AfroHistory.getRecent === 'function'
      ? withTimeout(window.AfroHistory.getRecent(12), REQUEST_TIMEOUT_MS).catch(function () { return []; })
      : Promise.resolve([]);

    var forexPromise = withTimeout(fetch(FOREX_ENDPOINT).then(function (response) {
      return response.json();
    }), REQUEST_TIMEOUT_MS).catch(function () { return null; });

    var results = await Promise.all([profilePromise, historyPromise, forexPromise, refreshSavedCalculations()]);

    if (results[0]) {
      extendedProfile = Object.assign({}, extendedProfile, results[0]);
      try {
        localStorage.setItem('afro_profile_extended', JSON.stringify(extendedProfile));
      } catch (error) {
        // Ignore cache write failures.
      }
    }

    recentHistory = Array.isArray(results[1]) ? results[1] : [];
    forexData = results[2];
  }

  function attachListeners() {
    if (window._dashboardAppListenersAttached) return;
    window._dashboardAppListenersAttached = true;

    function refreshAndRenderDashboard() {
      currentUser = window.AfroAuth && typeof window.AfroAuth.getUser === 'function'
        ? window.AfroAuth.getUser()
        : currentUser;

      if (!currentUser) return;

      refreshDashboardData()
        .then(function () {
          renderDashboardSurface();
        })
        .catch(function (error) {
          console.warn('[DashboardApp] Listener refresh failed:', error.message || error);
          renderDashboardSurface();
        });
    }

    window.addEventListener('afro-workspace-change', function () {
      refreshAndRenderDashboard();
    });

    window.addEventListener('storage', function (event) {
      var isSavedCalculationKey = event.key && event.key.indexOf('afrotools-saved-') === 0;
      var isRecentActivityKey = event.key && event.key.indexOf('afro_recent_v2') === 0;

      if (isSavedCalculationKey || isRecentActivityKey) {
        refreshAndRenderDashboard();
      }
    });

    window.addEventListener(SAVED_CALCULATIONS_EVENT, refreshAndRenderDashboard);
    window.addEventListener('afro-history-change', refreshAndRenderDashboard);
    window.addEventListener('focus', refreshAndRenderDashboard);
    window.addEventListener('afro-auth-change', refreshAndRenderDashboard);
  }

  window.DashboardApp = {
    init: async function () {
      currentUser = window.AfroAuth && typeof window.AfroAuth.getUser === 'function'
        ? window.AfroAuth.getUser()
        : null;

      if (!currentUser) return;

      attachListeners();
      renderLoadingState();
      renderQuickActions();

      try {
        await refreshDashboardData();
      } catch (error) {
        console.warn('[DashboardApp] Data refresh failed:', error.message || error);
      }

      renderDashboardSurface();
    },
    renderHeader: renderHeader,
    renderSummaryCards: renderSummaryCards,
    renderRecentActivity: renderRecentActivity,
    renderCountrySnapshot: renderCountrySnapshot,
    renderRecommendations: renderRecommendations,
    renderQuickActions: renderQuickActions
  };
})(window, document);
