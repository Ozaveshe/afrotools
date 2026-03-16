/**
 * AfroTools Live Translation Widget
 *
 * Adds a live translation section above the phrasebook on translator pages.
 * Uses the /api/translate endpoint (MyMemory + LibreTranslate).
 * Caches translations in localStorage (5-min TTL) to reduce API calls.
 * Falls back gracefully if API is unavailable.
 *
 * Usage: Include this script on any translator page that has:
 *   - window.TRANSLATOR_CONFIG = { source: 'en', target: 'sw', langName: 'Swahili', langCode: 'sw' }
 *   - A container with class "container" (widget injects at top)
 */
(function () {
  'use strict';

  var cfg = window.TRANSLATOR_CONFIG;
  if (!cfg) return;

  var CACHE_KEY = 'afro_translate_cache_' + cfg.target;
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Inject the live translation UI
  function injectWidget() {
    var container = document.querySelector('.container');
    if (!container) return;

    var widget = document.createElement('div');
    widget.className = 'card';
    widget.id = 'liveTranslateCard';
    widget.style.borderColor = '#c4b5fd';
    widget.style.borderWidth = '2px';
    widget.innerHTML =
      '<h2 style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;">' +
        '<span style="font-size:1.3rem;">🌍</span> Live Translator' +
        '<span style="font-size:.7rem;font-weight:600;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;margin-left:auto;">API-Powered</span>' +
      '</h2>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;" id="translateGrid">' +
        '<div>' +
          '<label style="font-size:.78rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px;">English</label>' +
          '<textarea id="translateInput" rows="3" placeholder="Type any English text to translate..." style="width:100%;padding:.65rem 1rem;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.95rem;font-family:inherit;resize:vertical;background:#f8fafc;"></textarea>' +
        '</div>' +
        '<div>' +
          '<label style="font-size:.78rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px;">' + escHtml(cfg.langName) + '</label>' +
          '<div id="translateOutput" style="width:100%;min-height:82px;padding:.65rem 1rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.95rem;background:#f5f3ff;color:#4c1d95;font-weight:600;line-height:1.6;display:flex;align-items:center;">Translation appears here...</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:.75rem;align-items:center;">' +
        '<button id="translateBtn" style="padding:.5rem 1.25rem;background:#7c3aed;color:#fff;border:none;border-radius:7px;font-weight:700;font-size:.88rem;cursor:pointer;font-family:inherit;transition:background .15s;">Translate →</button>' +
        '<button id="swapBtn" style="padding:.5rem .75rem;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.95rem;cursor:pointer;" title="Swap languages">⇄</button>' +
        '<span id="translateStatus" style="font-size:.78rem;color:#94a3b8;margin-left:auto;"></span>' +
      '</div>' +
      '<p style="font-size:.72rem;color:#94a3b8;margin-top:.75rem;">Powered by MyMemory Translation API · Results may vary for informal/slang text · <a href="#" onclick="document.getElementById(\'liveTranslateCard\').nextElementSibling.scrollIntoView({behavior:\'smooth\'});return false;" style="color:#7c3aed;">Browse curated phrasebook below ↓</a></p>';

    // Insert before the first card (the phrasebook search)
    container.insertBefore(widget, container.firstChild);

    // Event listeners
    document.getElementById('translateBtn').addEventListener('click', doTranslate);
    document.getElementById('translateInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doTranslate(); }
    });

    var swapped = false;
    document.getElementById('swapBtn').addEventListener('click', function () {
      swapped = !swapped;
      var labels = widget.querySelectorAll('label');
      if (swapped) {
        labels[0].textContent = cfg.langName;
        labels[1].textContent = 'English';
        document.getElementById('translateInput').placeholder = 'Type ' + cfg.langName + ' text to translate...';
      } else {
        labels[0].textContent = 'English';
        labels[1].textContent = cfg.langName;
        document.getElementById('translateInput').placeholder = 'Type any English text to translate...';
      }
    });

    // Store swap state for translate function
    widget._swapped = function () { return swapped; };
  }

  function doTranslate() {
    var widget = document.getElementById('liveTranslateCard');
    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    var status = document.getElementById('translateStatus');
    var btn = document.getElementById('translateBtn');
    var text = input.value.trim();

    if (!text) { output.textContent = 'Enter text above to translate.'; return; }
    if (text.length > 2000) { output.textContent = 'Text too long (max 2000 characters).'; return; }

    var swapped = widget._swapped();
    var source = swapped ? cfg.target : (cfg.source || 'en');
    var target = swapped ? (cfg.source || 'en') : cfg.target;

    // Check cache first
    var cacheKey = source + '|' + target + '|' + text;
    var cached = getCache(cacheKey);
    if (cached) {
      output.textContent = cached.translatedText;
      status.textContent = 'Cached · ' + cached.provider;
      return;
    }

    // Show loading state
    btn.disabled = true;
    btn.textContent = 'Translating...';
    output.innerHTML = '<span style="color:#94a3b8;">Translating...</span>';
    status.textContent = '';

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, source: source, target: target })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      btn.disabled = false;
      btn.textContent = 'Translate →';

      if (data.error) {
        output.textContent = 'Translation unavailable. Try the phrasebook below.';
        status.textContent = data.error;
        return;
      }

      output.textContent = data.translatedText;
      status.textContent = data.provider + ' · ' + data.characters + ' chars';

      // Cache the result
      setCache(cacheKey, data);
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Translate →';
      output.textContent = 'Connection error. Try the phrasebook below.';
      status.textContent = err.message;
    });
  }

  function getCache(key) {
    try {
      var store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      var entry = store[key];
      if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    } catch (e) {}
    return null;
  }

  function setCache(key, data) {
    try {
      var store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      // Keep cache size manageable — max 50 entries
      var keys = Object.keys(store);
      if (keys.length > 50) {
        keys.sort(function (a, b) { return store[a].ts - store[b].ts; });
        keys.slice(0, 20).forEach(function (k) { delete store[k]; });
      }
      store[key] = { ts: Date.now(), data: data };
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch (e) {}
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();
