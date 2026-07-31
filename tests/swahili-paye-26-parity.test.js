const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/localization/sw-paye-26-parity.json'), 'utf8'),
);

function extractFunction(source, start) {
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let templateExpressionDepth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (char === '\\') escaped = true;
      else if (char === quote && !(quote === '`' && templateExpressionDepth > 0)) quote = '';
      else if (quote === '`' && char === '$' && next === '{') {
        templateExpressionDepth += 1;
        index += 1;
      } else if (quote === '`' && char === '}' && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error('Unbalanced function source');
}

function formulaHash(html) {
  const functions = [];
  const matcher = /function\s+(calc[\w]*)\s*\(/g;
  for (let match = matcher.exec(html); match; match = matcher.exec(html)) {
    functions.push(extractFunction(html, match.index));
  }
  assert.ok(functions.length >= 1, 'Expected at least one calculation function');
  return crypto.createHash('sha256').update(functions.join('\n')).digest('hex');
}

const blocked = [];
for (const entry of CONTRACT.entries) {
  const english = fs.readFileSync(path.join(ROOT, entry.englishFile), 'utf8');
  const swahili = fs.readFileSync(path.join(ROOT, entry.swahiliFile), 'utf8');
  const swCanonical = `https://afrotools.com/sw/${entry.countrySlug}/kikokotoo-kodi-mshahara/`;
  for (const script of swahili.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    if (script[1].includes('function calculate')) {
      assert.doesNotThrow(
        () => new Function(script[1]), // eslint-disable-line no-new-func
        `${entry.englishId} inline calculation controller must parse`,
      );
    }
  }

  assert.strictEqual(
    formulaHash(english),
    CONTRACT.englishFormulaHashes[entry.englishId],
    `${entry.englishId} English formula owner drifted`,
  );
  assert.strictEqual(
    formulaHash(swahili),
    CONTRACT.swahiliFormulaHashes[entry.englishId],
    `${entry.englishId} Swahili formula owner drifted`,
  );
  assert.match(swahili, /<html\b[^>]*\blang="sw"/i, `${entry.englishId} must be native Swahili`);
  assert.doesNotMatch(
    swahili,
    /data-explicit-language-fallback="true"/i,
    `${entry.englishId} must not retain a resolved English fallback marker`,
  );
  assert.ok(
    english.includes(`hreflang="sw" href="${swCanonical}"`),
    `${entry.englishId} English owner must reciprocate its Swahili route`,
  );
  assert.ok(
    swahili.includes(`hreflang="sw" href="${swCanonical}"`),
    `${entry.englishId} Swahili owner must self-reference`,
  );
  const runtimeCopy = swahili
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(
    runtimeCopy,
    /My Mshahara Halisi|Tax \(|Tax Before Rebate|Tax Rebate|PAYE analysis|IUTS analysis|IRPP analysis|ITS analysis|Family parts|Family status|Dependent children|chargeable income estimate|data-explicit-language-fallback/i,
    `${entry.englishId} must not retain the known runtime English fallback phrases`,
  );

  if (!entry.englishParity) blocked.push(entry.englishId);
}

assert.deepStrictEqual(
  blocked.sort(),
  ['bi-paye', 'rw-paye', 'ug-paye'],
  'Only the three documented formula-parity routes may remain blocked',
);
assert.strictEqual(CONTRACT.entries.length, 26, 'The PAYE completion scope must remain exact');
assert.strictEqual(
  CONTRACT.entries.filter((entry) => entry.englishParity).length,
  23,
  'Exactly 23 PAYE routes have English-output parity',
);

console.log('Verified exact English formula hashes, native runtime copy, reciprocal hreflang and 23/26 PAYE parity.');
