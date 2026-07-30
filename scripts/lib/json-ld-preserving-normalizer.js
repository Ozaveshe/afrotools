'use strict';

const JSON_STRING_TOKEN = /"(?:\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|[^"\\\u0000-\u001F])*"/g;
const JSON_STRING_SOURCE = String.raw`"(?:\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|[^"\\\u0000-\u001F])*"`;
const IN_LANGUAGE_VALUE = new RegExp(
  String.raw`("inLanguage"\s*:\s*)(${JSON_STRING_SOURCE}|\[(?:\s*${JSON_STRING_SOURCE}\s*,?)*\s*\])`,
  'g'
);
const CONTENT_SCHEMA_TYPES = new Set([
  'AboutPage',
  'Article',
  'BlogPosting',
  'CollectionPage',
  'ContactPage',
  'Dataset',
  'LearningResource',
  'SoftwareApplication',
  'WebApplication',
  'WebPage',
  'WebSite',
]);

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

function canonicalSchemaLanguage(locale) {
  const value = String(locale || '').trim();
  if (!value) return '';
  if (/^fr(?:-fr)?$/i.test(value)) return value.includes('-') ? 'fr-FR' : 'fr';
  if (/^[a-z]{2}(?:-[a-z]{2})?$/i.test(value)) {
    const [language, region] = value.split('-');
    return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
  }
  return '';
}

function ownSchemaTypes(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Array.isArray(value['@type']) ? value['@type'] : [value['@type']].filter(Boolean);
}

function rootNeedsLanguage(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !Object.prototype.hasOwnProperty.call(value, 'inLanguage') &&
    ownSchemaTypes(value).some((type) => CONTENT_SCHEMA_TYPES.has(type))
  );
}

function insertRootLanguage(jsonText, language) {
  const typePattern = /("@type"\s*:\s*)("(?:\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|[^"\\\u0000-\u001F])*")/;
  const match = typePattern.exec(jsonText);
  if (!match) return jsonText;

  const insertionPoint = match.index + match[0].length;
  const lineStart = jsonText.lastIndexOf('\n', match.index) + 1;
  const indentation = (jsonText.slice(lineStart, match.index).match(/^\s*/) || [''])[0];
  const multiline = jsonText.includes('\n');
  const addition = multiline
    ? `,\n${indentation}"inLanguage": ${JSON.stringify(language)}`
    : `,"inLanguage":${JSON.stringify(language)}`;

  return `${jsonText.slice(0, insertionPoint)}${addition}${jsonText.slice(insertionPoint)}`;
}

function graphLanguageOwners(value) {
  if (Array.isArray(value)) return value.filter(rootNeedsLanguage);
  if (!value || typeof value !== 'object' || !Array.isArray(value['@graph'])) return [];
  return value['@graph'].filter(rootNeedsLanguage);
}

function normalizeJsonLdLanguageValues(jsonText, locale) {
  const language = canonicalSchemaLanguage(locale);
  if (!language) throw new TypeError(`Unsupported schema language: ${locale}`);

  const source = String(jsonText);
  JSON.parse(source.trim());

  let valuesChanged = 0;
  let content = source.replace(IN_LANGUAGE_VALUE, (match, prefix, token) => {
    const current = JSON.parse(token);
    const isAcceptedFrench = language === 'fr' && (current === 'fr' || current === 'fr-FR');
    if (current === language || isAcceptedFrench) return match;
    valuesChanged += 1;
    return `${prefix}${JSON.stringify(language)}`;
  });

  let valuesAdded = 0;
  const parsed = JSON.parse(content.trim());
  if (rootNeedsLanguage(parsed)) {
    content = insertRootLanguage(content, language);
    valuesAdded = 1;
  } else {
    const owners = graphLanguageOwners(parsed);
    if (owners.length) {
      owners.forEach((owner) => {
        owner.inLanguage = language;
      });
      content = JSON.stringify(parsed);
      valuesAdded = owners.length;
    }
  }

  JSON.parse(content.trim());
  return { content, valuesChanged, valuesAdded };
}

module.exports = {
  canonicalSchemaLanguage,
  normalizeJsonLdLanguageValues,
  normalizeJsonLdStringValues,
};
