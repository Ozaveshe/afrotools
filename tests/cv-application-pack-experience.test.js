'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../tools/cv-builder/js/src/cv-application-pack.js'), 'utf8');

function generator(code) {
  const ctx = { document: { readyState: 'loading', addEventListener() {} }, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  vm.runInNewContext(code, ctx);
  return ctx.CVApplicationPack.generatePack;
}

test('missing past employment cannot turn the profile or target role into claimed experience', () => {
  const generate = generator(source);
  for (const exps of [[], [{ t: '', c: 'Synthetic Project', d: 'Authored evidence' }], [{ t: '   ' }]]) {
    const data = { title: 'Target CFO', exps };
    const before = JSON.stringify(data);
    for (const tone of ['formal', 'confident', 'graduate', 'executive', 'diaspora']) {
      const result = generate(data, { role: 'Target Director', tone });
      assert.ok(result.coverLetter.includes('My background includes [add a role or project from your CV] experience'));
      assert.doesNotMatch(result.coverLetter, /My background includes Target (CFO|Director) experience/);
    }
    assert.equal(JSON.stringify(data), before);
  }
});

test('recorded role and achievement remain literal and separate from a target role', () => {
  const generate = generator(source);
  const data = { title: 'Target CFO', exps: [{ t: 'Ɗ Analyst "Saved"', c: 'Synthetic & Co', d: 'Authored result: 12%.' }] };
  const result = generate(data, { role: 'Target Director' });
  assert.ok(result.coverLetter.includes('My background includes Ɗ Analyst "Saved" experience with Synthetic & Co'));
  assert.ok(result.coverLetter.includes(data.exps[0].d));
});
