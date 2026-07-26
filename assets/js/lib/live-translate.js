(function () {
  'use strict';

  var config = window.TRANSLATOR_CONFIG;
  if (!config) return;

  var toolId = String(config.toolId || config.langCode || config.target || 'language-translator');
  var memoryCache = new Map();
  var activeController = null;

  function consentApi() {
    return window.AfroTools && window.AfroTools.ExternalTranslationConsent;
  }

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = String(value || '');
    return node.innerHTML;
  }

  function setStatus(text) {
    var status = document.getElementById('translateStatus');
    if (status) status.textContent = text || '';
  }

  function setBusy(busy) {
    var button = document.getElementById('translateBtn');
    if (!button) return;
    button.dataset.busy = busy ? 'true' : 'false';
    button.disabled = busy || !(consentApi() && consentApi().hasConsent(toolId));
    button.textContent = busy ? 'Translating…' : 'Translate →';
  }

  function cacheKey(source, target, text) {
    return source + '|' + target + '|' + text;
  }

  function remember(key, value) {
    if (memoryCache.size >= 20) {
      memoryCache.delete(memoryCache.keys().next().value);
    }
    memoryCache.set(key, value);
  }

  function clearTranslation() {
    if (activeController) activeController.abort();
    activeController = null;
    memoryCache.clear();
    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    if (input) input.value = '';
    if (output) output.textContent = 'Cloud translation appears here after you opt in.';
    setStatus('Text and temporary translation state cleared.');
    if (input) input.focus();
  }

  function render() {
    var container = document.querySelector('.container');
    var consent = consentApi();
    if (!container || !consent) return;

    var card = document.createElement('section');
    card.className = 'card';
    card.id = 'liveTranslateCard';
    card.setAttribute('aria-labelledby', 'liveTranslateTitle');
    card.style.borderColor = '#bfdbfe';
    card.innerHTML = [
      '<h2 id="liveTranslateTitle" style="display:flex;align-items:center;gap:8px;margin-bottom:.35rem;">',
      '<span aria-hidden="true">🌍</span> Optional cloud translation',
      '<span style="font-size:.7rem;font-weight:700;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;margin-left:auto;">External service</span>',
      '</h2>',
      '<p style="font-size:.82rem;color:#475569;margin:0 0 .75rem;">The local phrasebook above works without a network request. Use this separate service only for text you choose to send.</p>',
      '<div data-external-translation-consent-host></div>',
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1rem;margin-bottom:1rem;" id="translateGrid">',
      '<div><label for="translateInput" style="font-size:.78rem;font-weight:700;color:#475569;display:block;margin-bottom:4px;">Source text</label>',
      '<textarea id="translateInput" rows="3" maxlength="2000" placeholder="Enter non-sensitive text…" style="width:100%;padding:.65rem 1rem;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.95rem;font-family:inherit;resize:vertical;background:var(--surface,#fff);"></textarea></div>',
      '<div><div id="translateOutputLabel" style="font-size:.78rem;font-weight:700;color:#475569;margin-bottom:4px;">',
      escapeHtml(config.langName || config.target),
      ' output</div><div id="translateOutput" role="region" aria-labelledby="translateOutputLabel" style="width:100%;min-height:82px;padding:.65rem 1rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.95rem;background:var(--surface-subtle,#f8fafc);color:inherit;line-height:1.6;">Cloud translation appears here after you opt in.</div></div>',
      '</div>',
      '<div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;">',
      '<button type="button" id="translateBtn" disabled style="min-height:44px;padding:.5rem 1.25rem;background:#0057b8;color:#fff;border:none;border-radius:8px;font-weight:800;font-family:inherit;cursor:pointer;">Translate →</button>',
      '<button type="button" id="swapBtn" style="min-height:44px;padding:.5rem .85rem;background:#fff;border:1.5px solid #cbd5e1;border-radius:8px;font-weight:800;cursor:pointer;" aria-label="Swap source and target languages">Swap</button>',
      '<button type="button" id="clearTranslateBtn" style="min-height:44px;padding:.5rem .85rem;background:#fff;border:1.5px solid #cbd5e1;border-radius:8px;font-weight:800;cursor:pointer;">Clear</button>',
      '<span id="translateStatus" role="status" aria-live="polite" style="font-size:.78rem;color:#475569;margin-left:auto;"></span>',
      '</div>',
      '<style>@media(max-width:640px){#translateGrid{grid-template-columns:1fr!important}}@media(prefers-reduced-motion:reduce){#liveTranslateCard *{scroll-behavior:auto!important}}</style>'
    ].join('');

    container.appendChild(card);
    consent.render(card.querySelector('[data-external-translation-consent-host]'), {
      toolId: toolId,
      primaryProvider: 'MyMemory'
    });

    var swapped = false;
    var input = document.getElementById('translateInput');
    var outputLabel = document.getElementById('translateOutputLabel');
    var button = document.getElementById('translateBtn');

    card.addEventListener('afrotools:external-translation-consent-change', function () {
      setBusy(false);
    });
    button.addEventListener('click', runTranslation);
    document.getElementById('clearTranslateBtn').addEventListener('click', clearTranslation);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        runTranslation();
      }
    });
    document.getElementById('swapBtn').addEventListener('click', function () {
      swapped = !swapped;
      input.placeholder = swapped
        ? 'Enter non-sensitive ' + (config.langName || 'target-language') + ' text…'
        : 'Enter non-sensitive source text…';
      outputLabel.textContent = swapped ? 'English output' : (config.langName || config.target) + ' output';
      document.getElementById('translateOutput').textContent = 'Cloud translation appears here after you opt in.';
      setStatus('');
    });
    card._isSwapped = function () { return swapped; };
  }

  async function runTranslation() {
    var consent = consentApi();
    var card = document.getElementById('liveTranslateCard');
    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    if (!consent || !card || !input || !output) return;
    if (!consent.requireConsent(toolId, 'Cloud translation is off. Review the notice and opt in first.')) {
      setStatus('No text was sent. Cloud translation needs your explicit opt-in.');
      return;
    }

    var text = input.value.trim();
    if (!text) {
      output.textContent = 'Enter text above to translate.';
      return;
    }
    if (Array.from(text).length > 2000) {
      output.textContent = 'Text is too long. Use 2,000 characters or fewer.';
      return;
    }

    var swapped = card._isSwapped();
    var source = swapped ? config.target : (config.source || 'en');
    var target = swapped ? (config.source || 'en') : config.target;
    var key = cacheKey(source, target, text);
    if (memoryCache.has(key)) {
      var cached = memoryCache.get(key);
      output.textContent = cached.translatedText;
      setStatus('Temporary in-page result · ' + cached.provider);
      return;
    }

    if (activeController) activeController.abort();
    activeController = typeof AbortController === 'function' ? new AbortController() : null;
    setBusy(true);
    output.textContent = 'Translating…';
    setStatus('Sending the text you selected to the external translation service.');

    var requestHeaders = Object.assign({ 'Content-Type': 'application/json' }, consent.headers(toolId));
    try {
      var response = await fetch('/api/translate', {
        method: 'POST',
        headers: requestHeaders,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: activeController ? activeController.signal : undefined,
        body: JSON.stringify({
          text: text,
          source: source,
          target: target,
          allowFallback: consent.allowsFallback(toolId)
        })
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.translatedText) {
        if (response.status === 428) consent.reset(toolId);
        output.textContent = 'Cloud translation is unavailable. The local phrasebook above still works.';
        setStatus(data.message || data.error || 'No external translation was returned.');
        return;
      }
      output.textContent = data.translatedText;
      setStatus((data.provider || 'External provider') + (data.unchanged ? ' · unchanged; verify this result' : '') + ' · temporary in-page result');
      remember(key, {
        translatedText: data.translatedText,
        provider: data.provider || 'external provider'
      });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        setStatus('Cloud translation request cancelled.');
      } else {
        output.textContent = 'Cloud translation is unavailable. The local phrasebook above still works.';
        setStatus('Connection error. No result was stored.');
      }
    } finally {
      activeController = null;
      setBusy(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
}());
