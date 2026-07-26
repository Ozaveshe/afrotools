(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof globalThis !== 'undefined' ? globalThis : {});
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ExternalTranslationConsent = factory(root);
  }
}(typeof window !== 'undefined' ? window : this, function (root) {
  'use strict';

  var ACCEPTED = 'accepted';
  var CONSENT_HEADER = 'X-AfroTools-External-Translation-Consent';
  var FALLBACK_CONSENT_HEADER = 'X-AfroTools-Translation-Fallback-Consent';
  var LEGACY_CACHE_KEYS = [
    'afro_translate_cache_sw',
    'afro_translate_cache_yo',
    'afro_translate_cache_ha',
    'afro_translate_cache_ig',
    'afro_translate_cache_am',
    'afro_translate_cache_zu',
    'afro_translate_cache_fr'
  ];
  var state = Object.create(null);

  function safeToolId(value) {
    return String(value || 'translation').replace(/[^a-z0-9_-]/gi, '-').slice(0, 80);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function cleanupLegacyCaches(storage) {
    var local = storage;
    if (!local) {
      try {
        local = root.localStorage || null;
      } catch (_) {
        local = null;
      }
    }
    if (!local || typeof local.removeItem !== 'function') return false;
    LEGACY_CACHE_KEYS.forEach(function (key) {
      try {
        local.removeItem(key);
      } catch (_) {
        // Storage can be blocked. The translation UI must remain usable locally.
      }
    });
    return true;
  }

  function ensureStyle() {
    if (!root.document || root.document.getElementById('external-translation-consent-style')) return;
    var style = root.document.createElement('style');
    style.id = 'external-translation-consent-style';
    style.textContent = [
      '.external-translation-notice{border:1px solid #bfdbfe;border-radius:12px;background:#f8fbff;padding:12px 14px;margin:12px 0;display:grid;gap:8px;color:#334155;font-family:inherit}',
      '.external-translation-notice h3{margin:0;color:#0f172a;font-size:.92rem;line-height:1.3}',
      '.external-translation-notice p{margin:0;color:#475569;font-size:.8rem;line-height:1.5}',
      '.external-translation-choice{display:flex;align-items:flex-start;gap:9px;font-size:.8rem;line-height:1.45;color:#1e293b;cursor:pointer}',
      '.external-translation-choice input{margin-top:3px;flex:0 0 auto;width:18px;height:18px}',
      '.external-translation-status{min-height:1.25em;color:#475569;font-size:.78rem;font-weight:700}',
      '.external-translation-notice a{color:#0057b8;font-weight:700}',
      '@media(max-width:600px){.external-translation-notice{padding:12px}.external-translation-choice{font-size:.82rem}}',
      '@media(prefers-color-scheme:dark){.external-translation-notice{background:#0f1d32;border-color:#34547a;color:#dbeafe}.external-translation-notice h3,.external-translation-choice{color:#f8fafc}.external-translation-notice p,.external-translation-status{color:#cbd5e1}}'
    ].join('');
    root.document.head.appendChild(style);
  }

  function getState(toolId) {
    var id = safeToolId(toolId);
    if (!state[id]) state[id] = { accepted: false, fallbackAccepted: false, input: null, fallbackInput: null, status: null };
    return state[id];
  }

  function render(container, options) {
    if (!container) return null;
    ensureStyle();
    var config = options || {};
    var toolId = safeToolId(config.toolId || container.getAttribute('data-tool-id'));
    var current = getState(toolId);
    var primary = config.primaryProvider || 'the configured translation provider';
    var fallback = config.fallbackProvider || '';
    var checkboxId = 'external-translation-consent-' + toolId;
    var fallbackId = checkboxId + '-fallback';
    var statusId = checkboxId + '-status';

    container.classList.add('external-translation-notice');
    container.setAttribute('data-external-translation-notice', '');
    container.setAttribute('data-tool-id', toolId);
    container.innerHTML = [
      '<h3>Local phrasebook first; cloud translation is optional</h3>',
      '<p>The built-in phrasebook stays in this browser. Cloud translation sends the exact text you enter to AfroTools and ',
      escapeHtml(primary),
      '. Do not enter private IDs, health, legal, financial, school, employment, client, account, or confidential text.</p>',
      '<label class="external-translation-choice" for="', checkboxId, '">',
      '<input type="checkbox" id="', checkboxId, '" data-external-translation-accept>',
      '<span>I choose to send this text for external machine translation.</span></label>',
      fallback ? [
        '<label class="external-translation-choice" for="', fallbackId, '">',
        '<input type="checkbox" id="', fallbackId, '" data-external-translation-fallback disabled>',
        '<span>If ', escapeHtml(primary), ' is unavailable, also allow one request to ', escapeHtml(fallback), '.</span></label>'
      ].join('') : '',
      '<p>Important or public wording should be checked by a qualified translator. ',
      '<a href="/privacy/">Privacy details</a>.</p>',
      '<div class="external-translation-status" id="', statusId, '" data-external-translation-status role="status" aria-live="polite"></div>'
    ].join('');

    current.input = container.querySelector('[data-external-translation-accept]');
    current.fallbackInput = container.querySelector('[data-external-translation-fallback]');
    current.status = container.querySelector('[data-external-translation-status]');
    current.accepted = false;
    current.fallbackAccepted = false;

    current.input.addEventListener('change', function () {
      current.accepted = Boolean(current.input.checked);
      if (current.fallbackInput) {
        current.fallbackInput.disabled = !current.accepted;
        if (!current.accepted) current.fallbackInput.checked = false;
      }
      current.fallbackAccepted = Boolean(current.accepted && current.fallbackInput && current.fallbackInput.checked);
      current.status.textContent = current.accepted
        ? 'Cloud translation is enabled for this page session.'
        : 'Cloud translation is off. The local phrasebook remains available.';
      container.dispatchEvent(new CustomEvent('afrotools:external-translation-consent-change', {
        bubbles: true,
        detail: { toolId: toolId, accepted: current.accepted, fallbackAccepted: current.fallbackAccepted }
      }));
    });

    if (current.fallbackInput) {
      current.fallbackInput.addEventListener('change', function () {
        current.fallbackAccepted = Boolean(current.accepted && current.fallbackInput.checked);
      });
    }
    current.status.textContent = 'Cloud translation is off. The local phrasebook remains available.';
    return container;
  }

  function hasConsent(toolId) {
    return getState(toolId).accepted === true;
  }

  function allowsFallback(toolId) {
    return getState(toolId).accepted === true && getState(toolId).fallbackAccepted === true;
  }

  function headers(toolId) {
    var result = {};
    if (hasConsent(toolId)) result[CONSENT_HEADER] = ACCEPTED;
    if (allowsFallback(toolId)) result[FALLBACK_CONSENT_HEADER] = ACCEPTED;
    return result;
  }

  function requireConsent(toolId, message) {
    var current = getState(toolId);
    if (current.accepted) return true;
    if (current.status) current.status.textContent = message || 'Cloud translation is off. Review the notice and opt in first.';
    if (current.input && typeof current.input.focus === 'function') current.input.focus();
    return false;
  }

  function reset(toolId) {
    var current = getState(toolId);
    current.accepted = false;
    current.fallbackAccepted = false;
    if (current.input) current.input.checked = false;
    if (current.fallbackInput) {
      current.fallbackInput.checked = false;
      current.fallbackInput.disabled = true;
    }
    if (current.status) current.status.textContent = 'Cloud translation is off. The local phrasebook remains available.';
  }

  cleanupLegacyCaches();

  return {
    ACCEPTED: ACCEPTED,
    CONSENT_HEADER: CONSENT_HEADER,
    FALLBACK_CONSENT_HEADER: FALLBACK_CONSENT_HEADER,
    LEGACY_CACHE_KEYS: LEGACY_CACHE_KEYS.slice(),
    render: render,
    hasConsent: hasConsent,
    allowsFallback: allowsFallback,
    headers: headers,
    requireConsent: requireConsent,
    reset: reset,
    cleanupLegacyCaches: cleanupLegacyCaches
  };
}));
