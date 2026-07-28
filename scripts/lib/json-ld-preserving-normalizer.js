'use strict';

const JSON_STRING_TOKEN = /"(?:\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|[^"\\\u0000-\u001F])*"/g;

function normalizeJsonLdStringValues(jsonText, normalizeValue) {
  if (typeof normalizeValue !== 'function') {
    throw new TypeError('normalizeValue must be a function');
  }

  JSON.parse(String(jsonText).trim());

  let valuesChanged = 0;
  const content = String(jsonText).replace(JSON_STRING_TOKEN, (token) => {
    const value = JSON.parse(token);
    const normalized = normalizeValue(value);
    if (typeof normalized !== 'string' || normalized === value) return token;
    valuesChanged += 1;
    return JSON.stringify(normalized);
  });

  JSON.parse(content.trim());
  return { content, valuesChanged };
}

module.exports = { normalizeJsonLdStringValues };
