const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const routing = require('../assets/js/ai/amount-words-routing.js');

test('amount-to-words phrasing and word order route to the existing currency tool', () => {
  const cases = [
    ['Ghana amount to words', 'GHS', '/tools/amount-words-gh/'],
    ['Write 12345.67 Ghana cedis in words', 'GHS', '/tools/amount-words-gh/'],
    ['Words for a cedi amount', 'GHS', '/tools/amount-words-gh/'],
    ['Ghana amount words converter', 'GHS', '/tools/amount-words-gh/'],
    ['Spell out the NGN sum', 'NGN', '/tools/naira-to-words/'],
    ['Naira to words for a cheque', 'NGN', '/tools/naira-to-words/'],
    ['Convert ₦250.50 to letters', 'NGN', '/tools/naira-to-words/'],
    ['In words, my Kenyan shilling amount', 'KES', '/tools/amount-words-ke/'],
    ['Number to words in Kenya', 'KES', '/tools/amount-words-ke/'],
    ['KES 500 spelled out', 'KES', '/tools/amount-words-ke/'],
    ['South Africa amount to words', 'ZAR', '/tools/naira-to-words/'],
    ['USD amount in words', 'USD', '/tools/naira-to-words/'],
    ['Euros to words', 'EUR', '/tools/naira-to-words/'],
    ['Uganda number to words', 'UGX', '/tools/naira-to-words/']
  ];
  for (const [query, code, route] of cases) {
    const result = routing.detect(query);
    assert.equal(result?.status, 'matched', query);
    assert.equal(result.currency.code, code, query);
    assert.equal(result.currency.route, route, query);
  }
});

test('missing, ambiguous, unsupported and conflicting cues never guess a currency', () => {
  for (const query of [
    'Convert amount to words', 'Spell out 500', 'Shillings in words', 'Dollars to words',
    'Ghana and Kenya amount to words', 'Ghana naira amount to words',
    'Ghana USD amount to words', 'Kenya CAD number to words',
    'Ghana amount to words in Canada', 'Atlantis amount to words', 'GHC amount to words',
    "Ghana and Côte d'Ivoire amount to words", 'CAD in words',
    'Compare cedis versus rand in words'
  ]) {
    const result = routing.detect(query);
    assert.equal(result?.status, 'choose_currency', query);
    assert.equal(result.currency, null, query);
  }
});

test('other task intents and malformed input retain the normal discovery fallback', () => {
  for (const query of [
    'Convert a Word document to PDF', 'Write a 500 word CV for Ghana',
    'Create a Word invoice with an amount', 'Count words in my resume',
    'Translate Ghana words into English', 'How many words are in this essay?',
    'Number of words in a letter', 'Spell Ghana', 'Calculate Ghana VAT',
    'Write 500 words about Ghana', 'Ghana in 500 words', 'Write 500 letters to Nigeria',
    'Kenya has 500 numbers in this report', 'Spelling Ghana in 500 words',
    'Write 500 words about naira', 'Write 500 letters about Ghana cedis',
    'Write letters about naira', 'Explain the words Nigerian naira',
    'Spell naira', 'Spell out Ghana cedi', 'Naira spelling', 'Naira spelled out',
    '', null, undefined, {}, 'amount to words '.repeat(120)
  ]) assert.equal(routing.detect(query), null, String(query));
});

test('ordinary prose never interprets the adjective mad as Moroccan currency', () => {
  assert.equal(routing.detect('Convert my number to words; this makes me mad').status, 'choose_currency');
  assert.equal(routing.detect('MAD 500 in words').currency.code, 'MAD');
});

test('currency choices and canonical routes agree with the actual converter and registry', () => {
  const page = fs.readFileSync('tools/naira-to-words/index.html', 'utf8');
  const selector = page.match(/<select id="currency"[\s\S]*?<\/select>/)[0];
  const codes = Array.from(selector.matchAll(/<option value="([A-Z]{3})"/g), match => match[1]);
  assert.deepEqual(routing.getCurrencies().map(currency => currency.code), codes);
  const registry = fs.readFileSync('assets/js/components/tool-registry.js', 'utf8');
  for (const currency of routing.getCurrencies()) {
    assert.equal(routing.detect(`${currency.code} amount to words`).currency.code, currency.code);
    assert.ok(registry.includes(`id: '${currency.toolId}'`));
    assert.ok(registry.includes(`href: '${currency.route}'`));
    assert.ok(fs.existsSync(currency.route.slice(1) + 'index.html'));
  }
});

test('local discovery output contains neither prompt text, amounts nor a prefill payload', () => {
  const result = routing.detect('Write Ghana amount 173890.67 to words for private payment');
  assert.equal(result.status, 'matched');
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('173890'));
  assert.ok(!serialized.includes('private payment'));
  assert.ok(!serialized.includes('prefill'));
  assert.ok(!serialized.includes('query'));
});
