(function (root) {
  'use strict';

  var namedEntities = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
    '\u00a0': '&nbsp;',
    '\u00a9': '&copy;',
    '\u00ae': '&reg;',
    '\u2122': '&trade;',
    '\u20ac': '&euro;',
    '\u00a3': '&pound;',
    '\u2014': '&mdash;'
  });

  function encodeRfc3986(value) {
    return encodeURIComponent(String(value)).replace(/[!'()*]/g, function (character) {
      return '%' + character.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  function encodeFormValue(value) {
    return encodeURIComponent(String(value)).replace(/%20/g, '+');
  }

  function decodeFormValue(value) {
    return decodeURIComponent(String(value).replace(/\+/g, ' '));
  }

  function encodeHtml(value, style) {
    var selectedStyle = style || 'named';
    return Array.from(String(value)).map(function (character) {
      var code = character.codePointAt(0);
      var mustEncode = /[&<>"']/.test(character);
      var common = Object.prototype.hasOwnProperty.call(namedEntities, character);
      if (selectedStyle === 'named') return common ? namedEntities[character] : character;
      if (selectedStyle === 'decimal') return (mustEncode || code > 127) ? '&#' + code + ';' : character;
      if (selectedStyle === 'hex') return (mustEncode || code > 127) ? '&#x' + code.toString(16).toUpperCase() + ';' : character;
      throw new Error('Unsupported HTML entity style: ' + selectedStyle);
    }).join('');
  }

  function decodeHtml(value, documentRef) {
    var doc = documentRef || root.document;
    if (!doc || typeof doc.createElement !== 'function') throw new Error('A browser document is required to decode HTML entities.');
    var textarea = doc.createElement('textarea');
    textarea.innerHTML = String(value);
    return textarea.value;
  }

  root.AfroToolsWebTextCodecs = Object.freeze({
    url: Object.freeze({
      encodeUri: function (value) { return encodeURI(String(value)); },
      encodeComponent: function (value) { return encodeURIComponent(String(value)); },
      encodeRfc3986: encodeRfc3986,
      encodeFormValue: encodeFormValue,
      decodeFormValue: decodeFormValue
    }),
    html: Object.freeze({
      namedEntities: namedEntities,
      encode: encodeHtml,
      decode: decodeHtml
    })
  });
})(window);
