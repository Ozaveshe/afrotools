(function (window, document) {
  'use strict';

  var STORAGE_SLUG = 'ng-salary-tax';
  var STORAGE_KEY = 'afrotools-saved-' + STORAGE_SLUG;
  var TOOL_SLUG = 'ng-paye';
  var TOOL_NAME = 'Nigeria PAYE Calculator';
  var TOOL_HREF = '/nigeria/ng-salary-tax/';
  var WORKSPACE_ITEM_TYPE = 'saved-calculation';
  var CURRENCY = 'NGN';
  var COUNTRY_CODE = 'NG';

  var saveStateInstance = null;
  var remoteItemsById = Object.create(null);
  var lastHistoryFingerprint = '';
  var lastHistorySavedAt = 0;

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
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: CURRENCY,
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    } catch (error) {
      return '\u20A6' + Math.round(Number(value) || 0).toLocaleString('en-NG');
    }
  }

  function formatPercent(value) {
    if (value === null || value === undefined || value === '') return '--';
    return Number(value).toFixed(1) + '%';
  }

  function getSaveState() {
    if (!window.SaveState) return null;

    if (!saveStateInstance) {
      saveStateInstance = new window.SaveState(STORAGE_SLUG, { maxFree: 20 });
    }

    return saveStateInstance;
  }

  function isSignedIn() {
    return !!(window.AfroAuth && typeof window.AfroAuth.isLoggedIn === 'function' && window.AfroAuth.isLoggedIn());
  }

  function isWorkspaceReady() {
    return !!(window.AfroWorkspace && typeof window.AfroWorkspace.isSignedIn === 'function' && window.AfroWorkspace.isSignedIn());
  }

  function getResultSnapshot() {
    if (!window.RESULT) return null;

    return {
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
    };
  }

  function isToggleOn(toggleName) {
    var node = document.querySelector('[data-tog="' + toggleName + '"]');
    return !!(node && node.classList.contains('on'));
  }

  function getCurrentInputs() {
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
    return {
      version: 2,
      toolSlug: TOOL_SLUG,
      toolName: TOOL_NAME,
      countryCode: COUNTRY_CODE,
      currency: CURRENCY,
      inputs: getCurrentInputs(),
      snapshot: getResultSnapshot()
    };
  }

  function getDefaultTitle(payload) {
    var snapshot = payload && payload.snapshot ? payload.snapshot : null;
    var inputs = payload && payload.inputs ? payload.inputs : {};
    var regime = inputs.regime === 'nta' ? 'NTA 2026' : 'PITA 2025';

    if (!snapshot) {
      return regime + ' Scenario';
    }

    return regime + ' - ' + formatCurrency(snapshot.netMonthly) + '/mo';
  }

  function getPayloadSummary(payload) {
    if (!payload || typeof payload !== 'object') return 'Saved calculation';

    if (payload.version === 2 && payload.snapshot) {
      var regime = payload.snapshot.regime === 'nta' ? 'NTA 2026' : 'PITA 2025';
      return regime + ' | ' + formatCurrency(payload.snapshot.netMonthly) + '/mo | Tax ' + formatPercent(payload.snapshot.effectiveRate);
    }

    if (payload.summary) return String(payload.summary);
    if (payload.fields && payload.fields.summary) return String(payload.fields.summary);

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

    return payload;
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

    button.disabled = !window.RESULT;
    button.textContent = window.RESULT ? 'Save to Dashboard' : 'Run a Calculation First';
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

  function restoreSavedCalculation(itemId) {
    var localItem = loadLocalItem(itemId);
    var restored = false;

    if (localItem) {
      var payload = normalizeForWorkspace(localItem);
      restored = payload.version === 2
        ? restoreModernPayload(payload, localItem.title)
        : restoreLegacyPayload(payload, localItem.title);
    } else if (remoteItemsById[itemId]) {
      var remoteItem = remoteItemsById[itemId];
      restored = remoteItem.payload && remoteItem.payload.version === 2
        ? restoreModernPayload(remoteItem.payload, remoteItem.title)
        : restoreLegacyPayload(remoteItem.payload || {}, remoteItem.title);
    }

    if (!restored) {
      setStatus('That saved scenario could not be restored on this device.', 'warning');
      return;
    }

    setStatus('Loaded saved scenario.', 'info');

    var resultsCard = document.getElementById('resultsCard');
    if (resultsCard) {
      resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function buildWorkspaceRecord(item) {
    var payload = normalizeForWorkspace(item);
    var summary = getPayloadSummary(payload);

    return {
      itemType: WORKSPACE_ITEM_TYPE,
      itemKey: item.id,
      toolSlug: TOOL_SLUG,
      title: item.title || getDefaultTitle(payload),
      summary: summary,
      href: TOOL_HREF + '?saved_calc=' + encodeURIComponent(item.id),
      payload: payload,
      meta: {
        country: COUNTRY_CODE,
        currency: CURRENCY,
        summary: summary,
        netMonthly: payload.snapshot ? payload.snapshot.netMonthly || 0 : null,
        effectiveRate: payload.snapshot ? payload.snapshot.effectiveRate || 0 : null,
        regime: payload.snapshot ? payload.snapshot.regime || 'pita' : (payload.inputs ? payload.inputs.regime || 'pita' : 'pita')
      }
    };
  }

  async function refreshRemoteSavedItems() {
    remoteItemsById = Object.create(null);

    if (!isWorkspaceReady()) return [];

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
    if (!isWorkspaceReady()) return false;

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
    if (!saveState || !isWorkspaceReady()) return;

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
    if (!window.RESULT) {
      setStatus('Run a calculation before saving it.', 'warning');
      return;
    }

    var saveState = getSaveState();
    if (!saveState) {
      setStatus('Save support is not available on this page right now.', 'warning');
      return;
    }

    var payload = buildCurrentPayload();
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
    } else {
      setStatus('Saved on this device. Sign in to sync it to your dashboard.', 'info');
    }
  }

  async function removeSavedCalculation(itemId) {
    if (!itemId) return;

    if (!window.confirm('Delete this saved calculation?')) return;

    var saveState = getSaveState();
    if (saveState) {
      saveState.delete(itemId);
    }

    if (remoteItemsById[itemId] && isWorkspaceReady()) {
      try {
        await window.AfroWorkspace.remove({
          itemType: WORKSPACE_ITEM_TYPE,
          itemKey: itemId
        });
      } catch (error) {
        console.warn('[PayeCalculationSync] Workspace delete failed:', error.message || error);
      }
    }

    delete remoteItemsById[itemId];
    renderSavedCalculations();
    setStatus('Saved calculation deleted.', 'info');
  }

  function buildHistoryFingerprint(inputs, snapshot) {
    return JSON.stringify({
      salaryValue: inputs.salaryValue,
      salaryPeriod: inputs.salaryPeriod,
      calcMode: inputs.calcMode,
      regime: inputs.regime,
      toggles: inputs.toggles,
      nhisRate: inputs.nhisRate,
      lifeAmt: inputs.lifeAmt,
      homeloanAmt: inputs.homeloanAmt,
      pensionableAmt: inputs.pensionableAmt,
      annualRent: inputs.annualRent,
      gross: snapshot.gross,
      tax: snapshot.tax,
      netMonthly: snapshot.netMonthly
    });
  }

  async function syncRecentHistory(payload) {
    if (!isSignedIn() || !window.AfroHistory || typeof window.AfroHistory.save !== 'function') return;

    var fingerprint = buildHistoryFingerprint(payload.inputs, payload.snapshot);
    var now = Date.now();

    if (fingerprint === lastHistoryFingerprint && now - lastHistorySavedAt < 30000) {
      return;
    }

    lastHistoryFingerprint = fingerprint;
    lastHistorySavedAt = now;

    try {
      await window.AfroHistory.save({
        toolSlug: TOOL_SLUG,
        toolName: TOOL_NAME,
        countryCode: COUNTRY_CODE,
        currency: CURRENCY,
        inputs: payload.inputs,
        outputs: payload.snapshot
      });
    } catch (error) {
      console.warn('[PayeCalculationSync] History save failed:', error.message || error);
    }
  }

  function saveDeviceHistory(payload) {
    if (!window.AfroData) return;

    if (typeof window.AfroData.logToolUse === 'function') {
      window.AfroData.logToolUse(TOOL_SLUG, TOOL_NAME);
    }

    if (typeof window.AfroData.save === 'function' && payload.snapshot) {
      window.AfroData.save(STORAGE_SLUG, {
        gross: payload.snapshot.gross,
        grossAnnual: payload.snapshot.gross,
        netAnnual: payload.snapshot.netAnnual,
        netMonthly: payload.snapshot.netMonthly,
        tax: payload.snapshot.tax,
        effectiveRate: payload.snapshot.effectiveRate,
        regime: payload.snapshot.regime
      });
    }
  }

  async function handleCalculationComplete() {
    if (!window.RESULT) return;

    updateSaveButtonState();

    var payload = buildCurrentPayload();
    saveDeviceHistory(payload);
    await syncRecentHistory(payload);
  }

  function attachCalculationHook() {
    if (window._ngPayeCalculationHookAttached || typeof window.calculate !== 'function') return;

    var originalCalculate = window.calculate;
    window.calculate = function () {
      var result = originalCalculate.apply(this, arguments);
      handleCalculationComplete();
      return result;
    };

    window._ngPayeCalculationHookAttached = true;
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

    restoreSavedCalculation(savedId);
  }

  async function initializeSavedCalculations() {
    attachCalculationHook();
    bindUi();
    updateSaveButtonState();
    setStatus('Name a scenario to reuse it later and see it in your dashboard.', 'muted');

    var remoteItems = await refreshRemoteSavedItems();
    mergeRemoteItemsIntoLocal(remoteItems);
    await syncAllLocalItemsToWorkspace();
    await refreshRemoteSavedItems();

    renderSavedCalculations();
    await restoreFromQueryParam();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSavedCalculations);
  } else {
    initializeSavedCalculations();
  }
})(window, document);
