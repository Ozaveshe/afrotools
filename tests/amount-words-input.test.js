const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const engine = require('../assets/js/engines/amount-words-input');
const maximum = '999999999999999';

test('decimal rounding is exact, including carry and large minor units', () => {
  for (const [input, output] of [
    ['0', '0.00'], ['.01', '0.01'], ['0001.2', '1.20'], ['1,250.75', '1250.75'],
    ['1.005', '1.01'], ['2.675', '2.68'], ['999.995', '1000.00'],
    ['0.004', '0.00'], ['0.005', '0.01'], ['1.999', '2.00'],
    ['999999999999999.99', '999999999999999.99'],
    ['999999999999999.994', '999999999999999.99']
  ]) assert.equal(engine.parse(input, maximum).canonical, output, input);
});
test('malformed input and overflow never produce an amount', () => {
  for (const input of ['-1', '+1', '1e3', '12,34', '1.2.3', 'NGN 1', 'Infinity', '.', '1000000000000000', '999999999999999.995']) {
    assert.equal(engine.parse(input, maximum).valid, false, input);
  }
  assert.equal(engine.parse('', maximum).empty, true);
  assert.equal(engine.parse('999999999999.995', '999999999999').valid, false);
});

for (const slug of ['amount-words-gh', 'naira-to-words']) {
  test(`${slug}: real page wording retains exact major/minor units`, () => {
    const html = fs.readFileSync(`tools/${slug}/index.html`, 'utf8');
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function amountToWords('));
    const sandbox = { window: { AfroTools: { engines: { amountWordsInput: engine } } } };
    vm.runInNewContext(inline, sandbox);
    const curr = { dataset: { main: 'Naira', sub: 'Kobo' } };
    const max = slug === 'amount-words-gh' ? '999999999999' : maximum;
    const wording = raw => sandbox.amountToWords(engine.parse(raw, max), curr);
    assert.match(wording('0'), /Zero.*Only/);
    assert.match(wording('0.01'), /(?:Pesewas One|One Kobo) Only/);
    assert.match(wording('1.005'), /(?:Pesewas One|One Kobo) Only/);
    assert.match(wording('999.995'), /One Thousand/);
    assert.match(wording(max + '.99'), /Ninety-Nine/);
    if (slug === 'naira-to-words') assert.match(wording(max + '.99'), /Trillion/);
    assert.doesNotMatch(wording(max + '.99'), /undefined|NaN/);
  });
}
