!function () {
  'use strict';

  var state = {
    valuesByKey: {},
    valuesReady: false,
    rates: null,
    localCurrency: '',
    profileReady: false
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readJson(key, fallback) {
    try {
      var value = window.localStorage && window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function normalizeCurrency(value) {
    var currency = String(value || '').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(currency) ? currency : '';
  }

  function numberOrNull(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function resolveProfileCurrency() {
    var profile = null;
    try {
      if (window.AfroAuth && typeof window.AfroAuth.getCachedProfile === 'function') {
        profile = window.AfroAuth.getCachedProfile();
      }
    } catch (error) {
      profile = null;
    }
    if (!profile) {
      var cached = readJson('afro_profile_cache', null);
      profile = cached && cached.user ? cached.user : null;
    }
    profile = profile || readJson('afro_auth_v2', null) || {};

    var currency = normalizeCurrency(profile.currency || profile.local_currency || profile.preferred_currency);
    if (currency) return currency;

    var country = String(profile.country_code || profile.countryCode || profile.country || '').trim().toUpperCase();
    if (country && window.AfroTools && window.AfroTools.currency && typeof window.AfroTools.currency.fromCountry === 'function') {
      return normalizeCurrency(window.AfroTools.currency.fromCountry(country)) || 'USD';
    }
    return 'USD';
  }

  function refreshLocalCurrency() {
    state.localCurrency = resolveProfileCurrency();
    state.profileReady = true;
    renderAll();
  }

  function scholarshipKey(item) {
    if (window.AfroScholarshipFeed && typeof window.AfroScholarshipFeed.getScholarshipKey === 'function') {
      try {
        return String(window.AfroScholarshipFeed.getScholarshipKey(item) || '').trim().toLowerCase();
      } catch (error) {
        return '';
      }
    }
    return String(item && (item.application_url || item.info_url || item.source_url || item.official_url || item.name || item.title || item.slug) || '').trim().toLowerCase();
  }

  function cardKey(card) {
    var key = card && card.getAttribute('data-sch-key') || '';
    try {
      return decodeURIComponent(key).trim().toLowerCase();
    } catch (error) {
      return key.trim().toLowerCase();
    }
  }

  function formatMoney(currency, amount) {
    currency = normalizeCurrency(currency);
    var value = Number(amount);
    if (!currency || !Number.isFinite(value)) return '';
    var compact = Math.abs(value) >= 100000;
    if (window.AfroTools && window.AfroTools.currency && typeof window.AfroTools.currency.format === 'function') {
      return window.AfroTools.currency.format(currency, value, { compact: compact });
    }
    try {
      return new Intl.NumberFormat(void 0, {
        style: 'currency',
        currency: currency,
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 0
      }).format(value);
    } catch (error) {
      return currency + ' ' + Math.round(value).toLocaleString();
    }
  }

  function averageAward(record) {
    var min = numberOrNull(record.award_value_min);
    var max = numberOrNull(record.award_value_max);
    if (min == null && max == null) return numberOrNull(record.award_value_amount);
    if (min == null) return max;
    if (max == null) return min;
    return (min + max) / 2;
  }

  function convertToUsd(amount, currency) {
    currency = normalizeCurrency(currency);
    if (amount == null || !currency) return null;
    if (currency === 'USD') return amount;
    return state.rates && state.rates[currency] ? amount / Number(state.rates[currency]) : null;
  }

  function convertFromUsd(amount, currency) {
    currency = normalizeCurrency(currency);
    if (amount == null || !currency) return null;
    if (currency === 'USD') return amount;
    return state.rates && state.rates[currency] ? amount * Number(state.rates[currency]) : null;
  }

  function sourceValueText(record, currency, amount) {
    if (record.award_value_text) return String(record.award_value_text).trim();
    if (amount != null && currency) return formatMoney(currency, amount);
    return '';
  }

  function renderValue(record) {
    var sourceCurrency = normalizeCurrency(record.award_value_currency);
    var sourceAmount = averageAward(record);
    var sourceText = sourceValueText(record, sourceCurrency, sourceAmount);
    var fundingType = String(record.funding_type || record.funding || '').toLowerCase();

    if (sourceAmount == null && !sourceText) {
      if (fundingType.indexOf('fully') !== -1) sourceText = 'Fully funded';
      else if (/varies|various|variable/.test(fundingType)) sourceText = 'Funding varies';
    }
    if (!sourceText && sourceAmount == null) return '';

    var localCurrency = normalizeCurrency(record.local_value_currency) || state.localCurrency || sourceCurrency || 'USD';
    var usdAmount = numberOrNull(record.award_value_usd);
    if (usdAmount == null) usdAmount = convertToUsd(sourceAmount, sourceCurrency);

    var localAmount = numberOrNull(record.local_value_amount);
    if (localAmount == null && localCurrency === sourceCurrency) localAmount = sourceAmount;
    if (localAmount == null) localAmount = convertFromUsd(usdAmount, localCurrency);

    var primary = localAmount != null ? formatMoney(localCurrency, localAmount) : sourceText;
    var usd = usdAmount != null && primary !== formatMoney('USD', usdAmount) ? formatMoney('USD', usdAmount) : '';
    var checked = record.award_value_last_checked_at ? new Date(record.award_value_last_checked_at) : null;
    var checkedLabel = checked && !Number.isNaN(checked.getTime())
      ? checked.toLocaleDateString(void 0, { year: 'numeric', month: 'short', day: 'numeric' })
      : '';
    var tooltip = [
      sourceText ? 'Source value: ' + sourceText : '',
      checkedLabel ? 'Checked ' + checkedLabel : ''
    ].filter(Boolean).join(' | ');

    return [
      '<div class="sch-award-value" data-sch-award-value' + (tooltip ? ' title="' + esc(tooltip) + '"' : '') + '>',
      '<span class="sch-award-value__label">Award</span>',
      '<strong class="sch-award-value__primary">' + esc(primary) + (usd ? '<span class="sch-award-value__usd">≈ ' + esc(usd) + '</span>' : '') + '</strong>',
      '<span class="sch-award-value__verified" aria-label="Verified value"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Verified</span>',
      '</div>'
    ].join('');
  }

  function renderCard(card) {
    if (!card || !state.valuesReady) return;
    var key = cardKey(card);
    var record = state.valuesByKey[key];
    var existing = card.querySelector('[data-sch-award-value]');
    if (!record) {
      if (existing) existing.remove();
      return;
    }

    var html = renderValue(record);
    if (!html) {
      if (existing) existing.remove();
      return;
    }

    if (existing) {
      existing.outerHTML = html;
      return;
    }
    var anchor = card.querySelector('.deadline-card') || card.querySelector('.details') || card.querySelector('h3');
    if (anchor && anchor.parentNode) anchor.insertAdjacentHTML('afterend', html);
  }

  function renderAll() {
    var grid = document.getElementById('scholarshipGrid');
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.sch-upgrade-card[data-sch-key]'), renderCard);
  }

  function observeGrid() {
    var grid = document.getElementById('scholarshipGrid');
    if (!grid || !window.MutationObserver) return;
    new MutationObserver(function () {
      window.clearTimeout(observeGrid.timer);
      observeGrid.timer = window.setTimeout(renderAll, 40);
    }).observe(grid, { childList: true, subtree: true });
  }

  function collectKeys(record) {
    var values = [record && record.key, scholarshipKey(record)];
    ['application_url', 'info_url', 'source_url', 'official_url', 'name', 'title', 'slug'].forEach(function (field) {
      if (record && record[field]) values.push(String(record[field]).trim().toLowerCase());
    });
    var seen = {};
    return values.map(function (value) {
      return String(value || '').trim().toLowerCase();
    }).filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function loadAwardValues() {
    fetch('/api/scholarship-values?limit=600', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Scholarship values returned ' + response.status);
        return response.json();
      })
      .then(function (payload) {
        var map = {};
        (payload.items || []).forEach(function (record) {
          collectKeys(record).forEach(function (key) {
            map[key] = record;
          });
        });
        state.valuesByKey = map;
        state.valuesReady = true;
        renderAll();
      })
      .catch(function () {
        state.valuesReady = true;
      });
  }

  function loadFx() {
    fetch('/api/forex?base=USD', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Forex returned ' + response.status);
        return response.json();
      })
      .then(function (payload) {
        state.rates = payload && payload.rates ? payload.rates : null;
        renderAll();
      })
      .catch(function () {
        return fetch('/data/forex/latest.json')
          .then(function (response) {
            if (!response.ok) throw new Error('Forex fallback returned ' + response.status);
            return response.json();
          })
          .then(function (payload) {
            state.rates = payload && payload.rates ? payload.rates : null;
            renderAll();
          })
          .catch(function () {
            state.rates = null;
          });
      });
  }

  function init() {
    refreshLocalCurrency();
    loadAwardValues();
    loadFx();
    observeGrid();
    window.addEventListener('afro-auth-change', refreshLocalCurrency);
    window.addEventListener('afroedu:profile-updated', refreshLocalCurrency);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}();
