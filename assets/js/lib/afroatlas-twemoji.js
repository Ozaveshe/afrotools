(function (window) {
  'use strict';

  var regionalA = 127462;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[character];
    });
  }

  function normalizeCode(value) {
    var code = String(value || '').trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : '';
  }

  function codeFromEmoji(value) {
    var characters = Array.from(String(value || '').trim());
    if (characters.length < 2) return '';
    var first = characters[0].codePointAt(0);
    var second = characters[1].codePointAt(0);
    if (
      first < regionalA || first > 127487
      || second < regionalA || second > 127487
    ) return '';
    return String.fromCharCode(first - regionalA + 65)
      + String.fromCharCode(second - regionalA + 65);
  }

  function codeForCountry(country) {
    if (!country || !window.AfroAtlas) return '';
    var registries = [window.AfroAtlas.COUNTRIES || {}, window.AfroAtlas.WORLD_REF || {}];
    for (var registryIndex = 0; registryIndex < registries.length; registryIndex += 1) {
      var keys = Object.keys(registries[registryIndex]);
      for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        if (registries[registryIndex][keys[keyIndex]] === country) return keys[keyIndex];
      }
    }
    return codeFromEmoji(country.flag);
  }

  function flagHtml(code, label, className) {
    var normalized = normalizeCode(code) || '??';
    var name = (label ? label + ' flag' : normalized + ' flag').trim();
    var classes = className ? 'aa-twemoji-flag ' + className : 'aa-twemoji-flag';
    return '<span class="' + escapeHtml(classes)
      + ' aa-twemoji-flag--fallback" role="img" aria-label="' + escapeHtml(name)
      + '">' + escapeHtml(normalized) + '</span>';
  }

  var api = {
    version: 'native-fallback',
    flagUrl: function () { return ''; },
    flagHtml: flagHtml,
    countryFlagHtml: function (country, className, code) {
      var resolvedCode = code || codeForCountry(country);
      return flagHtml(resolvedCode, country && country.name ? country.name : resolvedCode, className);
    },
    optionLabel: function (code, country) {
      var label = country && country.name ? country.name : String(code || '');
      var normalized = normalizeCode(code);
      return normalized ? label + ' (' + normalized + ')' : label;
    },
    codeFromEmoji: codeFromEmoji,
    codeForCountry: codeForCountry,
    hydrate: function (root) {
      var scope = root && root.querySelectorAll ? root : document;
      scope.querySelectorAll('[data-aa-flag-emoji]:not([data-aa-flag-ready])').forEach(function (element) {
        var code = element.getAttribute('data-aa-flag-code') || codeFromEmoji(element.textContent);
        var label = element.getAttribute('data-aa-flag-label') || element.getAttribute('aria-label') || code;
        element.innerHTML = flagHtml(code, label, element.getAttribute('data-aa-flag-class') || '');
        element.setAttribute('data-aa-flag-ready', 'true');
      });
    },
  };

  window.AfroAtlasFlags = api;
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.AfroAtlasFlags = api;
}(window));
