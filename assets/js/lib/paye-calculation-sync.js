(function (window, document) {
  'use strict';

  var CONFIG = window.PAYE_CALC_SYNC_CONFIG || {};
  var STORAGE_SLUG = CONFIG.storageSlug || 'ng-salary-tax';
  var STORAGE_KEY = 'afrotools-saved-' + STORAGE_SLUG;
  var TOOL_SLUG = CONFIG.toolSlug || 'ng-paye';
  var TOOL_NAME = CONFIG.toolName || 'Nigeria PAYE Calculator';
  var TOOL_HREF = CONFIG.toolHref || '/nigeria/ng-salary-tax/';
  var WORKSPACE_ITEM_TYPE = CONFIG.workspaceItemType || 'saved-calculation';
  var CURRENCY = CONFIG.currency || 'NGN';
  var COUNTRY_CODE = CONFIG.countryCode || 'NG';
  var LOCALE = CONFIG.locale || 'en-US';
  var SAVED_CALCULATIONS_EVENT = 'afro-saved-calculations-change';

  var saveStateInstance = null;
  var remoteItemsById = Object.create(null);
  var lastHistoryFingerprint = '';
  var lastHistorySavedAt = 0;
  var syncLifecyclePromise = null;
  var lifecycleRefreshTimer = null;
  var pendingRestoreId = '';
  var pendingHistoryPayload = null;

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value || '';
    return node.innerHTML;
  }

  function parseNumber(value) {
    return parseFloat(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
  }

  function getTimestamp(value) {
    if (!value) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getAdapter() {
    return window.PAYE_CALC_SYNC_ADAPTER || {};
  }

  function normalizeRateValue(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    if (numeric > 0 && numeric <= 1) {
      return numeric * 100;
    }
    return numeric;
  }

  function normalizeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;

    var normalized = Object.assign({}, snapshot);
    var effectiveRate = normalizeRateValue(normalized.effectiveRate);
    var marginalRate = normalizeRateValue(normalized.marginalRate);

    if (effectiveRate !== null) {
      normalized.effectiveRate = effectiveRate;
    }

    if (marginalRate !== null) {
      normalized.marginalRate = marginalRate;
    }

    if (normalized.grossAnnual === undefined || normalized.grossAnnual === null) {
      if (typeof normalized.gross === 'number' && Number.isFinite(normalized.gross)) {
        normalized.grossAnnual = normalized.gross;
      } else if (typeof normalized.grossMonthly === 'number' && Number.isFinite(normalized.grossMonthly)) {
        normalized.grossAnnual = normalized.grossMonthly * 12;
      }
    }

    if (normalized.gross === undefined || normalized.gross === null) {
      if (typeof normalized.grossAnnual === 'number' && Number.isFinite(normalized.grossAnnual)) {
        normalized.gross = normalized.grossAnnual;
      }
    }

    if (normalized.grossMonthly === undefined || normalized.grossMonthly === null) {
      if (typeof normalized.grossAnnual === 'number' && Number.isFinite(normalized.grossAnnual)) {
        normalized.grossMonthly = normalized.grossAnnual / 12;
      }
    }

    if (normalized.netAnnual === undefined || normalized.netAnnual === null) {
      if (typeof normalized.netMonthly === 'number' && Number.isFinite(normalized.netMonthly)) {
        normalized.netAnnual = normalized.netMonthly * 12;
      }
    }

    if (normalized.netMonthly === undefined || normalized.netMonthly === null) {
      if (typeof normalized.netAnnual === 'number' && Number.isFinite(normalized.netAnnual)) {
        normalized.netMonthly = normalized.netAnnual / 12;
      }
    }

    if (normalized.taxAnnual === undefined || normalized.taxAnnual === null) {
      if (typeof normalized.tax === 'number' && Number.isFinite(normalized.tax)) {
        normalized.taxAnnual = normalized.tax;
      } else if (typeof normalized.taxMonthly === 'number' && Number.isFinite(normalized.taxMonthly)) {
        normalized.taxAnnual = normalized.taxMonthly * 12;
      }
    }

    if (normalized.tax === undefined || normalized.tax === null) {
      if (typeof normalized.taxAnnual === 'number' && Number.isFinite(normalized.taxAnnual)) {
        normalized.tax = normalized.taxAnnual;
      }
    }

    if (normalized.taxMonthly === undefined || normalized.taxMonthly === null) {
      if (typeof normalized.taxAnnual === 'number' && Number.isFinite(normalized.taxAnnual)) {
        normalized.taxMonthly = normalized.taxAnnual / 12;
      }
    }

    return normalized;
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    var normalized = Object.assign({}, payload);
    normalized.version = normalized.version || 2;
    normalized.toolSlug = normalized.toolSlug || TOOL_SLUG;
    normalized.toolName = normalized.toolName || TOOL_NAME;
    normalized.countryCode = normalized.countryCode || COUNTRY_CODE;
    normalized.currency = normalized.currency || CURRENCY;

    if (normalized.snapshot) {
      normalized.snapshot = normalizeSnapshot(normalized.snapshot);
    }

    return normalized;
  }

  function hasCalculationResult() {
    var adapter = getAdapter();
    if (adapter && typeof adapter.hasResult === 'function') {
      try {
        return !!adapter.hasResult();
      } catch (error) {
        console.warn('[PayeCalculationSync] hasResult adapter failed:', error);
      }
    }

    return !!window.RESULT;
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

  function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return '--';

    try {
      return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: CURRENCY,
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    } catch (error) {
      return (CURRENCY || 'USD') + ' ' + Math.round(Number(value) || 0).toLocaleString(LOCALE);
    }
  }

  function formatPercent(value) {
    if (value === null || value === undefined || value === '') return '--';
    var numeric = normalizeRateValue(value);
    if (numeric === null) return '--';
    return numeric.toFixed(1) + '%';
  }

  function getSaveState() {
    if (!window.SaveState) return null;

    if (!saveStateInstance) {
      saveStateInstance = new window.SaveState(STORAGE_SLUG, { maxFree: 20 });
    }

    return saveStateInstance;
  }

  function isSignedIn() {
    if (window.AfroAuth) {
      try {
        if (typeof window.AfroAuth.isLoggedIn === 'function' && window.AfroAuth.isLoggedIn()) {
          return true;
        }
      } catch (error) {
        console.warn('[PayeCalculationSync] isLoggedIn check failed:', error);
      }

      try {
        if (typeof window.AfroAuth.getUser === 'function') {
          var user = window.AfroAuth.getUser();
          if (user && user.id) return true;
        }
      } catch (error) {
        console.warn('[PayeCalculationSync] getUser fallback failed:', error);
      }

      try {
        if (typeof window.AfroAuth.getCachedProfile === 'function') {
          var cachedProfile = window.AfroAuth.getCachedProfile();
          if (cachedProfile && cachedProfile.id) return true;
        }
      } catch (error) {
        console.warn('[PayeCalculationSync] getCachedProfile fallback failed:', error);
      }
    }

    return !!(window.AfroWorkspace && typeof window.AfroWorkspace.isSignedIn === 'function' && window.AfroWorkspace.isSignedIn());
  }

  function canUseWorkspace() {
    return !!(
      window.AfroWorkspace &&
      typeof window.AfroWorkspace.list === 'function' &&
      typeof window.AfroWorkspace.upsert === 'function' &&
      typeof window.AfroWorkspace.remove === 'function'
    );
  }

  function whenAuthReady(callback) {
    if (!window.AfroAuth || typeof window.AfroAuth.onReady !== 'function') {
      return false;
    }

    window.AfroAuth.onReady(function () {
      callback();
    });

    return true;
  }

  function dispatchSavedCalculationsChange(action, itemId) {
    try {
      window.dispatchEvent(new CustomEvent(SAVED_CALCULATIONS_EVENT, {
        detail: {
          action: action || 'refresh',
          toolSlug: TOOL_SLUG,
          itemId: itemId || '',
          count: getMergedSavedItems().length
        }
      }));
    } catch (error) {
      // Ignore custom event failures.
    }
  }

  function getResultSnapshot() {
    var adapter = getAdapter();
    if (adapter && typeof adapter.getResultSnapshot === 'function') {
      try {
        return normalizeSnapshot(adapter.getResultSnapshot());
      } catch (error) {
        console.warn('[PayeCalculationSync] getResultSnapshot adapter failed:', error);
      }
    }

    if (!window.RESULT) return null;

    return normalizeSnapshot({
      gross: window.RESULT.gross || 0,
      tax: window.RESULT.tax || 0,
      netAnnual: window.RESULT.netAnnual || 0,
      netMonthly: window.RESULT.netMonthly || 0,
      effectiveRate: window.RESULT.effectiveRate || 0,
      marginalRate: window.RESULT.marginalRate || 0,
      taxable: window.RESULT.taxable || 0,
      cra: window.RESULT.cra || 0,
      rentRelief: window.RESULT.rentRelief || 0,
      pension: window.RESULT.pension || 0,
      nhf: window.RESULT.nhf || 0,
      nhis: window.RESULT.nhis || 0,
      life: window.RESULT.life || 0,
      homeloan: window.RESULT.homeloan || 0,
      statutory: window.RESULT.statutory || 0,
      regime: window.RESULT.regime || window.REGIME || 'pita',
      isExempt: !!window.RESULT.isExempt,
      minTaxApplied: !!window.RESULT.minTaxApplied
    });
  }

  function isToggleOn(toggleName) {
    var node = document.querySelector('[data-tog="' + toggleName + '"]');
    return !!(node && node.classList.contains('on'));
  }

  function getCurrentInputs() {
    var adapter = getAdapter();
    if (adapter && typeof adapter.getCurrentInputs === 'function') {
      try {
        return adapter.getCurrentInputs();
      } catch (error) {
        console.warn('[PayeCalculationSync] getCurrentInputs adapter failed:', error);
      }
    }

    var rawSalary = parseNumber(document.getElementById('grossSalary').value);

    return {
      salaryValue: rawSalary,
      salaryPeriod: window.SALARY_PERIOD || 'annual',
      calcMode: window.CALC_MODE || 'gross',
      regime: window.REGIME || 'pita',
      period: window.PERIOD || 'monthly',
      toggles: {
        pension: isToggleOn('pension'),
        nhf: isToggleOn('nhf'),
        nhis: isToggleOn('nhis'),
        life: isToggleOn('life'),
        homeloan: isToggleOn('homeloan')
      },
      nhisRate: Number.isFinite(parseFloat(document.getElementById('nhisRate').value))
        ? parseFloat(document.getElementById('nhisRate').value)
        : 5,
      lifeAmt: parseNumber(document.getElementById('lifeAmt').value),
      homeloanAmt: parseNumber(document.getElementById('homeloanAmt').value),
      pensionableAmt: parseNumber(document.getElementById('pensionableAmt').value),
      annualRent: parseNumber(document.getElementById('annualRent').value)
    };
  }

  function buildCurrentPayload() {
    var adapter = getAdapter();
    if (adapter && typeof adapter.buildPayload === 'function') {
      try {
        return normalizePayload(adapter.buildPayload());
      } catch (error) {
        console.warn('[PayeCalculationSync] buildPayload adapter failed:', error);
      }
    }

    return normalizePayload({
      version: 2,
      toolSlug: TOOL_SLUG,
      toolName: TOOL_NAME,
      countryCode: COUNTRY_CODE,
      currency: CURRENCY,
      inputs: getCurrentInputs(),
      snapshot: getResultSnapshot()
    });
  }

  function getDefaultTitle(payload) {
    var adapter = getAdapter();
    if (adapter && typeof adapter.getDefaultTitle === 'function') {
      try {
        var adapterTitle = adapter.getDefaultTitle(payload);
        if (adapterTitle) return String(adapterTitle);
      } catch (error) {
        console.warn('[PayeCalculationSync] getDefaultTitle adapter failed:', error);
      }
    }

    var normalized = normalizePayload(payload) || {};
    var snapshot = normalized.snapshot || null;

    if (!snapshot) {
      return TOOL_NAME + ' scenario';
    }

    var prefix = snapshot.regime === 'nta'
      ? 'NTA 2026'
      : snapshot.regime === 'pita'
        ? 'PITA 2025'
        : 'Take-home';

    if (typeof snapshot.netMonthly === 'number' && Number.isFinite(snapshot.netMonthly)) {
      return prefix + ' - ' + formatCurrency(snapshot.netMonthly) + '/mo';
    }

    if (typeof snapshot.netAnnual === 'number' && Number.isFinite(snapshot.netAnnual)) {
      return prefix + ' - ' + formatCurrency(snapshot.netAnnual) + '/yr';
    }

    return TOOL_NAME + ' scenario';
  }

  function getPayloadSummary(payload) {
    var adapter = getAdapter();
    if (adapter && typeof adapter.getPayloadSummary === 'function') {
      try {
        var adapterSummary = adapter.getPayloadSummary(payload);
        if (adapterSummary) return String(adapterSummary);
      } catch (error) {
        console.warn('[PayeCalculationSync] getPayloadSummary adapter failed:', error);
      }
    }

    if (!payload || typeof payload !== 'object') return 'Saved calculation';

    if (typeof payload.summary === 'string' && payload.summary.trim()) {
      return payload.summary.trim();
    }

    if (payload.fields && payload.fields.summary) {
      return String(payload.fields.summary);
    }

    var normalized = normalizePayload(payload);
    if (normalized && normalized.snapshot) {
      var snapshot = normalized.snapshot;
      var pieces = [];

      if (snapshot.regime === 'nta') {
        pieces.push('NTA 2026');
      } else if (snapshot.regime === 'pita') {
        pieces.push('PITA 2025');
      }

      if (typeof snapshot.netMonthly === 'number' && Number.isFinite(snapshot.netMonthly)) {
        pieces.push('Take-home ' + formatCurrency(snapshot.netMonthly) + '/mo');
      } else if (typeof snapshot.netAnnual === 'number' && Number.isFinite(snapshot.netAnnual)) {
        pieces.push('Net ' + formatCurrency(snapshot.netAnnual) + '/yr');
      } else if (typeof snapshot.tax === 'number' && Number.isFinite(snapshot.tax)) {
        pieces.push('Tax ' + formatCurrency(snapshot.tax));
      }

      if (snapshot.effectiveRate !== undefined && snapshot.effectiveRate !== null) {
        pieces.push('Rate ' + formatPercent(snapshot.effectiveRate));
      }

      if (pieces.length) {
        return pieces.join(' | ');
      }
    }

    return 'Saved calculation';
  }

  function normalizeForWorkspace(item) {
    var payload = item && item.data ? item.data : {};

    if (!payload || payload.version !== 2) {
      payload = {
        version: 1,
        legacy: true,
        fields: item && item.data && typeof item.data === 'object' ? item.data : {},
        summary: item && item.data && item.data.summary ? item.data.summary : ''
      };
    }

    return payload.version === 2 ? normalizePayload(payload) : payload;
  }

  function normalizeLocalItem(item) {
    if (!item) return null;

    var payload = normalizeForWorkspace(item);

    return {
      id: item.id,
      title: item.title || getDefaultTitle(payload),
      summary: getPayloadSummary(payload),
      updatedAt: item.updatedAt || item.createdAt || Date.now(),
      payload: payload,
      synced: !!remoteItemsById[item.id],
      href: TOOL_HREF + '?saved_calc=' + encodeURIComponent(item.id)
    };
  }

  function normalizeRemoteItem(item) {
    if (!item || !item.item_key) return null;

    return {
      id: item.item_key,
      title: item.title || 'Saved calculation',
      summary: item.summary || getPayloadSummary(item.payload || {}),
      updatedAt: item.updated_at || item.created_at || Date.now(),
      payload: item.payload || {},
      synced: true,
      href: item.href || (TOOL_HREF + '?saved_calc=' + encodeURIComponent(item.item_key))
    };
  }

  function getMergedSavedItems() {
    var itemsById = Object.create(null);
    var saveState = getSaveState();
    var localItems = saveState ? saveState.getAll() : [];

    localItems.forEach(function (item) {
      var normalized = normalizeLocalItem(item);
      if (!normalized) return;
      itemsById[normalized.id] = normalized;
    });

    Object.keys(remoteItemsById).forEach(function (itemId) {
      var normalized = normalizeRemoteItem(remoteItemsById[itemId]);
      if (!normalized) return;

      if (!itemsById[itemId] || getTimestamp(normalized.updatedAt) >= getTimestamp(itemsById[itemId].updatedAt)) {
        itemsById[itemId] = normalized;
      } else {
        itemsById[itemId].synced = true;
      }
    });

    return Object.keys(itemsById).map(function (itemId) {
      return itemsById[itemId];
    }).sort(function (left, right) {
      return getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt);
    });
  }

  function setStatus(message, tone) {
    var statusNode = document.getElementById('calcSaveStatus');
    if (!statusNode) return;

    statusNode.textContent = message || '';
    statusNode.setAttribute('data-tone', tone || 'muted');
  }

  function updateSaveButtonState() {
    var button = document.getElementById('calcSaveBtn');
    if (!button) return;

    button.disabled = !hasCalculationResult();
    button.textContent = hasCalculationResult() ? 'Save to Dashboard' : 'Run a Calculation First';
  }

  function renderSavedCalculations() {
    var container = document.getElementById('calcSavedList');
    if (!container) return;

    var items = getMergedSavedItems();

    if (!items.length) {
      container.innerHTML =
        '<div class="calc-save-empty">' +
          '<strong>No saved scenarios yet.</strong>' +
          '<span>Save a named result here and it will appear in your dashboard calculations tab.</span>' +
        '</div>';
      return;
    }

    container.innerHTML = items.map(function (item) {
      return '' +
        '<article class="calc-save-card" data-save-id="' + escapeHtml(item.id) + '">' +
          '<div class="calc-save-card-head">' +
            '<div>' +
              '<h3>' + escapeHtml(item.title) + '</h3>' +
              '<p>' + escapeHtml(item.summary) + '</p>' +
            '</div>' +
            '<span class="calc-save-badge" data-synced="' + (item.synced ? 'true' : 'false') + '">' +
              (item.synced ? 'Dashboard' : 'This device') +
            '</span>' +
          '</div>' +
          '<div class="calc-save-card-meta">' +
            '<span>' + escapeHtml(formatRelativeTime(item.updatedAt)) + '</span>' +
            '<a href="' + escapeHtml(item.href) + '">Open link</a>' +
          '</div>' +
          '<div class="calc-save-card-actions">' +
            '<button type="button" data-action="load" data-save-id="' + escapeHtml(item.id) + '">Load</button>' +
            '<button type="button" data-action="delete" data-save-id="' + escapeHtml(item.id) + '">Delete</button>' +
          '</div>' +
        '</article>';
    }).join('');

    Array.prototype.forEach.call(container.querySelectorAll('[data-action="load"]'), function (button) {
      button.addEventListener('click', function () {
        restoreSavedCalculation(button.getAttribute('data-save-id'));
      });
    });

    Array.prototype.forEach.call(container.querySelectorAll('[data-action="delete"]'), function (button) {
      button.addEventListener('click', function () {
        removeSavedCalculation(button.getAttribute('data-save-id'));
      });
    });
  }

  function setToggleState(toggleName, enabled) {
    var toggle = document.querySelector('[data-tog="' + toggleName + '"]');
    if (!toggle) return;

    toggle.classList.toggle('on', !!enabled);
    toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');

    if (toggleName === 'life') {
      document.getElementById('lifeField').classList.toggle('on', !!enabled);
    }
    if (toggleName === 'homeloan') {
      document.getElementById('homeloanField').classList.toggle('on', !!enabled);
    }
    if (toggleName === 'nhis') {
      document.getElementById('nhisField').classList.toggle('on', !!enabled);
    }
  }

  function applySavedValue(fieldId, value) {
    var input = document.getElementById(fieldId);
    if (!input) return;

    if (value === null || value === undefined || value === '') {
      input.value = '';
      return;
    }

    if (fieldId === 'nhisRate') {
      input.value = value;
      document.getElementById('nhisRateLabel').textContent = value + '%';
      return;
    }

    input.value = Math.round(Number(value) || 0).toLocaleString('en-NG');
  }

  function restoreModernPayload(payload, title) {
    if (!payload || !payload.inputs) return false;

    var inputs = payload.inputs;
    var salaryValue = Number(inputs.salaryValue || 0);
    var annualEquivalent = inputs.salaryPeriod === 'monthly' ? salaryValue * 12 : salaryValue;
    var calcModeButtons = document.querySelectorAll('.mode-toggle')[0].querySelectorAll('.mode-btn');
    var periodButtons = document.querySelectorAll('.per-btn');

    if (typeof window.setCalcMode === 'function') {
      window.setCalcMode(inputs.calcMode === 'net' ? 'net' : 'gross', inputs.calcMode === 'net' ? calcModeButtons[1] : calcModeButtons[0]);
    }

    if (typeof window.setSalaryPeriod === 'function') {
      window.setSalaryPeriod(
        inputs.salaryPeriod === 'monthly' ? 'monthly' : 'annual',
        document.getElementById(inputs.salaryPeriod === 'monthly' ? 'periodMonthly' : 'periodAnnual')
      );
    }

    if (typeof window.setRegime === 'function') {
      window.setRegime(inputs.regime === 'nta' ? 'nta' : 'pita', document.getElementById(inputs.regime === 'nta' ? 'tabNta' : 'tabPita'));
    }

    document.getElementById('grossSalary').value = Math.round(salaryValue).toLocaleString('en-NG');
    document.getElementById('salarySlider').value = Math.min(Math.max(annualEquivalent, 500000), 50000000);
    document.getElementById('sliderVal').textContent = formatCurrency(annualEquivalent);

    if (typeof window.updateSliderFill === 'function') {
      window.updateSliderFill(document.getElementById('salarySlider'));
    }

    setToggleState('pension', !!(inputs.toggles && inputs.toggles.pension));
    setToggleState('nhf', !!(inputs.toggles && inputs.toggles.nhf));
    setToggleState('nhis', !!(inputs.toggles && inputs.toggles.nhis));
    setToggleState('life', !!(inputs.toggles && inputs.toggles.life));
    setToggleState('homeloan', !!(inputs.toggles && inputs.toggles.homeloan));

    applySavedValue('nhisRate', inputs.nhisRate !== undefined && inputs.nhisRate !== null ? inputs.nhisRate : 5);
    applySavedValue('lifeAmt', inputs.lifeAmt);
    applySavedValue('homeloanAmt', inputs.homeloanAmt);
    applySavedValue('pensionableAmt', inputs.pensionableAmt);
    applySavedValue('annualRent', inputs.annualRent);

    if (typeof window.calculate === 'function') {
      window.calculate();
    }

    if (typeof window.setPeriod === 'function') {
      window.setPeriod(inputs.period === 'annual' ? 'annual' : 'monthly', inputs.period === 'annual' ? periodButtons[1] : periodButtons[0]);
    }

    if (document.getElementById('calcSaveName')) {
      document.getElementById('calcSaveName').value = title || '';
    }

    return true;
  }

  function restorePayloadWithAdapter(payload, title) {
    var adapter = getAdapter();
    if (adapter && typeof adapter.restorePayload === 'function') {
      try {
        return adapter.restorePayload(payload, title) === true;
      } catch (error) {
        console.warn('[PayeCalculationSync] restorePayload adapter failed:', error);
      }
    }

    return payload && payload.version === 2
      ? restoreModernPayload(payload, title)
      : restoreLegacyPayload(payload, title);
  }

  function restoreLegacyPayload(payload, title) {
    var legacy = payload && payload.fields ? payload.fields : payload;
    if (!legacy || typeof legacy !== 'object') return false;

    Object.keys(legacy).forEach(function (fieldId) {
      if (fieldId === '_mode' || fieldId === 'summary') return;
      if (document.getElementById(fieldId)) {
        document.getElementById(fieldId).value = legacy[fieldId];
      }
    });

    if (legacy.grossSalary) {
      var annualEquivalent = parseNumber(legacy.grossSalary);
      document.getElementById('salarySlider').value = Math.min(Math.max(annualEquivalent, 500000), 50000000);
      document.getElementById('sliderVal').textContent = formatCurrency(annualEquivalent);
      if (typeof window.updateSliderFill === 'function') {
        window.updateSliderFill(document.getElementById('salarySlider'));
      }
    }

    if (legacy._mode && typeof window.setCalcMode === 'function') {
      var calcModeButtons = document.querySelectorAll('.mode-toggle')[0].querySelectorAll('.mode-btn');
      var wantsNet = String(legacy._mode).toLowerCase().indexOf('net') !== -1;
      window.setCalcMode(wantsNet ? 'net' : 'gross', wantsNet ? calcModeButtons[1] : calcModeButtons[0]);
    }

    if (typeof window.calculate === 'function') {
      window.calculate();
    }

    if (document.getElementById('calcSaveName')) {
      document.getElementById('calcSaveName').value = title || '';
    }

    return true;
  }

  function loadLocalItem(itemId) {
    var saveState = getSaveState();
    return saveState ? saveState.load(itemId) : null;
  }

  function restoreSavedCalculation(itemId, options) {
    var settings = options || {};
    var localItem = loadLocalItem(itemId);
    var restored = false;

    if (localItem) {
      var payload = normalizeForWorkspace(localItem);
      restored = restorePayloadWithAdapter(payload, localItem.title);
    } else if (remoteItemsById[itemId]) {
      var remoteItem = remoteItemsById[itemId];
      restored = restorePayloadWithAdapter(remoteItem.payload || {}, remoteItem.title);
    }

    if (!restored) {
      if (settings.deferIfMissing) {
        pendingRestoreId = itemId;
        return false;
      }

      if (!settings.suppressMissingWarning) {
        setStatus('That saved scenario could not be restored on this device.', 'warning');
      }
      return false;
    }

    pendingRestoreId = '';

    if (!settings.suppressSuccessStatus) {
      setStatus('Loaded saved scenario.', 'info');
    }

    if (!settings.suppressScroll) {
      var resultsCard = document.getElementById('resultsCard');
      if (resultsCard) {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    return true;
  }

  function tryRestorePendingSavedCalculation() {
    if (!pendingRestoreId) return false;

    var restored = restoreSavedCalculation(pendingRestoreId, {
      suppressMissingWarning: !isSignedIn()
    });

    if (!restored && !isSignedIn()) {
      setStatus('Sign in to reopen this saved scenario on this device.', 'info');
    }

    return restored;
  }

  function scheduleSavedCalculationRefresh(reason, delayMs) {
    if (lifecycleRefreshTimer) {
      clearTimeout(lifecycleRefreshTimer);
    }

    lifecycleRefreshTimer = window.setTimeout(function () {
      refreshSavedCalculationLifecycle(reason);
    }, typeof delayMs === 'number' ? delayMs : 120);
  }

  function attachLifecycleListeners() {
    window.__payeSavedCalculationLifecycleAttached = window.__payeSavedCalculationLifecycleAttached || {};
    if (window.__payeSavedCalculationLifecycleAttached[STORAGE_KEY]) return;
    window.__payeSavedCalculationLifecycleAttached[STORAGE_KEY] = true;

    window.addEventListener('afro-auth-change', function () {
      scheduleSavedCalculationRefresh('auth-change', 150);
    });

    window.addEventListener('afro-workspace-change', function (event) {
      var detail = event && event.detail ? event.detail : {};
      if (!detail.itemType || detail.itemType === WORKSPACE_ITEM_TYPE) {
        scheduleSavedCalculationRefresh('workspace-change', 120);
      }
    });

    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) {
        scheduleSavedCalculationRefresh('storage', 0);
      }
    });

    window.addEventListener('focus', function () {
      scheduleSavedCalculationRefresh('focus', 0);
    });

    if (!whenAuthReady(function () {
      scheduleSavedCalculationRefresh('auth-ready', 0);
    })) {
      setTimeout(function () {
        scheduleSavedCalculationRefresh('auth-delay-400', 0);
      }, 400);
      setTimeout(function () {
        scheduleSavedCalculationRefresh('auth-delay-1200', 0);
      }, 1200);
    }
  }

  async function refreshSavedCalculationLifecycle(reason) {
    if (syncLifecyclePromise) {
      return syncLifecyclePromise;
    }

    syncLifecyclePromise = (async function () {
      var remoteItems = await refreshRemoteSavedItems();
      mergeRemoteItemsIntoLocal(remoteItems);
      await syncAllLocalItemsToWorkspace();
      await refreshRemoteSavedItems();
      await retryPendingHistorySync();
      renderSavedCalculations();
      tryRestorePendingSavedCalculation();
      dispatchSavedCalculationsChange(reason || 'refresh');
    })();

    try {
      return await syncLifecyclePromise;
    } finally {
      syncLifecyclePromise = null;
    }
  }

  function buildWorkspaceRecord(item) {
    var payload = normalizeForWorkspace(item);
    var summary = getPayloadSummary(payload);
    var snapshot = payload && payload.snapshot ? normalizeSnapshot(payload.snapshot) : null;
    var baseMeta = {
      country: COUNTRY_CODE,
      currency: CURRENCY,
      summary: summary,
      netMonthly: snapshot && typeof snapshot.netMonthly === 'number' ? snapshot.netMonthly : null,
      effectiveRate: snapshot && snapshot.effectiveRate !== undefined && snapshot.effectiveRate !== null
        ? normalizeRateValue(snapshot.effectiveRate)
        : null
    };

    if (snapshot && snapshot.regime) {
      baseMeta.regime = snapshot.regime;
    }

    var adapter = getAdapter();
    if (adapter && typeof adapter.buildWorkspaceMeta === 'function') {
      try {
        baseMeta = Object.assign(baseMeta, adapter.buildWorkspaceMeta(payload, summary, baseMeta) || {});
      } catch (error) {
        console.warn('[PayeCalculationSync] buildWorkspaceMeta adapter failed:', error);
      }
    }

    return {
      itemType: WORKSPACE_ITEM_TYPE,
      itemKey: item.id,
      toolSlug: TOOL_SLUG,
      title: item.title || getDefaultTitle(payload),
      summary: summary,
      href: TOOL_HREF + '?saved_calc=' + encodeURIComponent(item.id),
      payload: payload,
      meta: baseMeta
    };
  }

  async function refreshRemoteSavedItems() {
    remoteItemsById = Object.create(null);

    if (!canUseWorkspace()) return [];

    try {
      var items = await window.AfroWorkspace.list({
        itemType: WORKSPACE_ITEM_TYPE,
        limit: 60
      });

      (items || []).forEach(function (item) {
        if (item && item.item_key) {
          remoteItemsById[item.item_key] = item;
        }
      });

      return items || [];
    } catch (error) {
      console.warn('[PayeCalculationSync] Could not load saved calculations from workspace:', error.message || error);
      return [];
    }
  }

  function mergeRemoteItemsIntoLocal(items) {
    var saveState = getSaveState();
    if (!saveState) return;

    (items || []).forEach(function (item) {
      if (!item || !item.item_key) return;

      var localItem = saveState.load(item.item_key);
      var remoteTimestamp = getTimestamp(item.updated_at || item.created_at);
      var localTimestamp = localItem ? getTimestamp(localItem.updatedAt || localItem.createdAt) : 0;

      if (!localItem || remoteTimestamp > localTimestamp) {
        saveState.save({
          id: item.item_key,
          title: item.title || 'Saved calculation',
          data: item.payload || {
            version: 1,
            legacy: true,
            summary: item.summary || ''
          }
        });
      }
    });
  }

  async function syncLocalItemToWorkspace(item) {
    if (!canUseWorkspace()) return false;

    try {
      var saved = await window.AfroWorkspace.upsert(buildWorkspaceRecord(item));
      if (saved && saved.item_key) {
        remoteItemsById[saved.item_key] = saved;
      }
      return true;
    } catch (error) {
      console.warn('[PayeCalculationSync] Workspace upsert failed:', error.message || error);
      return false;
    }
  }

  async function syncAllLocalItemsToWorkspace() {
    var saveState = getSaveState();
    if (!saveState || !canUseWorkspace()) return;

    var items = saveState.getAll();

    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      var remoteItem = remoteItemsById[item.id];
      var localUpdated = getTimestamp(item.updatedAt || item.createdAt);
      var remoteUpdated = remoteItem ? getTimestamp(remoteItem.updated_at || remoteItem.created_at) : 0;

      if (remoteUpdated >= localUpdated && remoteItem) {
        continue;
      }

      await syncLocalItemToWorkspace(item);
    }
  }

  async function saveCurrentCalculation() {
    if (!hasCalculationResult()) {
      setStatus('Run a calculation before saving it.', 'warning');
      return;
    }

    var saveState = getSaveState();
    if (!saveState) {
      setStatus('Save support is not available on this page right now.', 'warning');
      return;
    }

    var payload = buildCurrentPayload();
    if (!payload || !payload.snapshot) {
      setStatus('We could not read this calculation state yet. Please run it again.', 'warning');
      return;
    }

    var titleInput = document.getElementById('calcSaveName');
    var title = titleInput && titleInput.value.trim()
      ? titleInput.value.trim()
      : getDefaultTitle(payload);

    payload.savedAt = new Date().toISOString();

    var savedItem = saveState.save({
      title: title,
      data: payload
    });

    if (titleInput) {
      titleInput.value = title;
    }

    var synced = await syncLocalItemToWorkspace(savedItem);
    renderSavedCalculations();

    if (synced) {
      setStatus('Saved to your dashboard and this device.', 'success');
    } else if (isSignedIn()) {
      setStatus('Saved on this device. We could not sync it just now.', 'warning');
      scheduleSavedCalculationRefresh('save-retry', 800);
    } else {
      setStatus('Saved on this device. Sign in to sync it to your dashboard.', 'info');
    }

    dispatchSavedCalculationsChange('save', savedItem.id);
  }

  async function removeSavedCalculation(itemId) {
    if (!itemId) return;

    if (!window.confirm('Delete this saved calculation?')) return;

    var saveState = getSaveState();
    if (saveState) {
      saveState.delete(itemId);
    }

    var remoteDeleteFailed = false;

    if (remoteItemsById[itemId] && canUseWorkspace()) {
      try {
        await window.AfroWorkspace.remove({
          itemType: WORKSPACE_ITEM_TYPE,
          itemKey: itemId
        });
      } catch (error) {
        remoteDeleteFailed = true;
        console.warn('[PayeCalculationSync] Workspace delete failed:', error.message || error);
      }
    }

    if (remoteDeleteFailed) {
      renderSavedCalculations();
      setStatus('Removed on this device. We could not delete the dashboard copy just now.', 'warning');
      scheduleSavedCalculationRefresh('delete-retry', 800);
      dispatchSavedCalculationsChange('delete-pending', itemId);
      return;
    }

    delete remoteItemsById[itemId];
    renderSavedCalculations();
    setStatus('Saved calculation deleted.', 'info');
    dispatchSavedCalculationsChange('delete', itemId);
  }

  function buildHistoryFingerprint(payload) {
    var adapter = getAdapter();
    if (adapter && typeof adapter.buildHistoryFingerprint === 'function') {
      try {
        var adapterFingerprint = adapter.buildHistoryFingerprint(payload);
        if (adapterFingerprint) return String(adapterFingerprint);
      } catch (error) {
        console.warn('[PayeCalculationSync] buildHistoryFingerprint adapter failed:', error);
      }
    }

    var normalized = normalizePayload(payload) || {};
    var inputs = normalized.inputs || {};
    var snapshot = normalized.snapshot || {};

    return JSON.stringify({
      inputs: inputs,
      snapshot: {
        grossAnnual: snapshot.grossAnnual || snapshot.gross || null,
        netAnnual: snapshot.netAnnual || null,
        netMonthly: snapshot.netMonthly || null,
        taxAnnual: snapshot.taxAnnual || snapshot.tax || null,
        effectiveRate: snapshot.effectiveRate || null,
        regime: snapshot.regime || null
      }
    });
  }

  async function syncRecentHistory(payload) {
    if (!isSignedIn() || !window.AfroHistory || typeof window.AfroHistory.save !== 'function') return;

    var normalizedPayload = normalizePayload(payload);
    if (!normalizedPayload || !normalizedPayload.snapshot) return;

    var fingerprint = buildHistoryFingerprint(normalizedPayload);
    var now = Date.now();

    if (fingerprint === lastHistoryFingerprint && now - lastHistorySavedAt < 30000) {
      return;
    }

    try {
      var adapter = getAdapter();
      var historyOutputs = normalizedPayload.snapshot;

      if (adapter && typeof adapter.getHistoryOutputs === 'function') {
        try {
          historyOutputs = adapter.getHistoryOutputs(normalizedPayload) || normalizedPayload.snapshot;
        } catch (error) {
          console.warn('[PayeCalculationSync] getHistoryOutputs adapter failed:', error);
        }
      }

      if (historyOutputs && typeof historyOutputs === 'object') {
        historyOutputs = normalizeSnapshot(historyOutputs) || historyOutputs;
      }

      var result = await window.AfroHistory.save({
        toolSlug: TOOL_SLUG,
        toolName: TOOL_NAME,
        countryCode: COUNTRY_CODE,
        currency: CURRENCY,
        inputs: normalizedPayload.inputs,
        outputs: historyOutputs
      });

      if (result && result.saved) {
        lastHistoryFingerprint = fingerprint;
        lastHistorySavedAt = now;
        pendingHistoryPayload = null;
        return;
      }

      if (isSignedIn()) {
        pendingHistoryPayload = payload;
      }
    } catch (error) {
      pendingHistoryPayload = payload;
      console.warn('[PayeCalculationSync] History save failed:', error.message || error);
    }
  }

  async function retryPendingHistorySync() {
    if (!pendingHistoryPayload || !isSignedIn()) return;
    await syncRecentHistory(pendingHistoryPayload);
  }

  function saveDeviceHistory(payload) {
    if (!window.AfroData) return;

    if (typeof window.AfroData.logToolUse === 'function') {
      window.AfroData.logToolUse(TOOL_SLUG, TOOL_NAME);
    }

    var adapter = getAdapter();
    if (adapter && typeof adapter.saveDeviceHistory === 'function') {
      try {
        adapter.saveDeviceHistory(payload, window.AfroData);
        return;
      } catch (error) {
        console.warn('[PayeCalculationSync] saveDeviceHistory adapter failed:', error);
      }
    }

    var normalized = normalizePayload(payload);
    var snapshot = normalized && normalized.snapshot ? normalized.snapshot : null;

    if (typeof window.AfroData.save === 'function' && snapshot) {
      window.AfroData.save(STORAGE_SLUG, {
        gross: snapshot.grossAnnual || snapshot.gross || null,
        grossAnnual: snapshot.grossAnnual || snapshot.gross || null,
        grossMonthly: snapshot.grossMonthly || null,
        netAnnual: snapshot.netAnnual || null,
        netMonthly: snapshot.netMonthly || null,
        tax: snapshot.taxAnnual || snapshot.tax || null,
        taxAnnual: snapshot.taxAnnual || snapshot.tax || null,
        taxMonthly: snapshot.taxMonthly || null,
        effectiveRate: snapshot.effectiveRate,
        regime: snapshot.regime || null,
        summary: getPayloadSummary(normalized)
      });
    }
  }

  async function handleCalculationComplete() {
    if (!hasCalculationResult()) return;

    updateSaveButtonState();

    var payload = buildCurrentPayload();
    if (!payload || !payload.snapshot) return;
    saveDeviceHistory(payload);
    await syncRecentHistory(payload);
  }

  function attachCalculationHook() {
    window.__payeCalculationHookAttached = window.__payeCalculationHookAttached || {};
    if (window.__payeCalculationHookAttached[STORAGE_KEY] || typeof window.calculate !== 'function') return;

    var originalCalculate = window.calculate;
    window.calculate = function () {
      var result = originalCalculate.apply(this, arguments);
      handleCalculationComplete();
      return result;
    };

    window.__payeCalculationHookAttached[STORAGE_KEY] = true;
  }

  function bindUi() {
    var button = document.getElementById('calcSaveBtn');
    var input = document.getElementById('calcSaveName');

    if (button && !button.dataset.bound) {
      button.dataset.bound = 'true';
      button.addEventListener('click', function () {
        saveCurrentCalculation();
      });
    }

    if (input && !input.dataset.bound) {
      input.dataset.bound = 'true';
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveCurrentCalculation();
        }
      });
    }
  }

  async function restoreFromQueryParam() {
    var params = new URLSearchParams(window.location.search);
    var savedId = params.get('saved_calc');
    if (!savedId) return;

    pendingRestoreId = savedId;
    tryRestorePendingSavedCalculation();
  }

  async function initializeSavedCalculations() {
    attachCalculationHook();
    bindUi();
    attachLifecycleListeners();
    updateSaveButtonState();
    setStatus('Name a scenario to reuse it later and see it in your dashboard.', 'muted');
    renderSavedCalculations();
    await restoreFromQueryParam();
    await refreshSavedCalculationLifecycle('init');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSavedCalculations);
  } else {
    initializeSavedCalculations();
  }
})(window, document);
