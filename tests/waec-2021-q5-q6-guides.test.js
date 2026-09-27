'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bank = require('../assets/js/lib/ssce-written-bank');
const manifest = require('../ops/nigeria-exams/selected-waec-components.json');
const candidates = require('../ops/nigeria-exams/source-candidates.json');
const { writtenBank } = require('../scripts/build-ssce-practice-locales');

const ids = [5, 6].flatMap(number => ['a', 'b'].map(part => `waec-2021-mathematics-p2-q${number}${part}`));
const guide = id => bank.items.find(item => item.id === id);

test('WAEC 2021 Q5/Q6 guides retain official source links and a rights-safe selected scope', () => {
  const selected = manifest.components.find(row => row.id === 'waec-2021-maths-q5-q6');
  const candidate = candidates.candidates.find(row => row.id === 'waec-2021-mathematics-p2-selected');
  assert.deepEqual(selected.expectedIds, ids);
  assert.equal(selected.complete_selected_prompts, true);
  assert.equal(selected.complete_paper, false);
  assert.match(selected.rights_basis, /not the question or worked images/i);
  assert.deepEqual(selected.official_worked_images.map(image => image.question_number), [5, 6]);
  assert.ok(selected.official_worked_images.every(image => image.url.includes('waeconline.org.ng') && /^[a-f0-9]{64}$/.test(image.sha256)));
  assert.equal(candidate.imported_past_questions, 0);
  assert.ok(candidate.question_audit.some(row => row.numbers.includes(4) && row.state === 'held-source-incomplete'));

  for (const id of ids) {
    const item = guide(id);
    const source = manifest.sources.find(row => row.id === id);
    assert.ok(item && source, id);
    assert.equal(item.year, 2021);
    assert.equal(item.exam, 'WAEC');
    assert.equal(item.paper, '2');
    assert.equal(item.source, `https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq${item.number}.html`);
    assert.equal(item.source, source.url);
    assert.match(item.sourceUse, /Not a complete paper/);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.match(source.fingerprint_scope, /prompt image PNG/);
    assert.equal(source.questionBriefSha256, crypto.createHash('sha256').update(item.prompt).digest('hex'));
    assert.ok(item.steps.length >= 3 && item.checks.length >= 2);
  }
  assert.equal(bank.items.length, 117);
  assert.equal(bank.items.filter(item => item.exam === 'WAEC' && item.subject === 'Mathematics').length, 35);
  assert.equal(bank.items.filter(item => item.exam === 'NECO' && item.subject === 'Mathematics').length, 48);
  assert.ok(!bank.items.some(item => item.exam === 'WAEC' && item.year === 2021 && item.number === 4));
});

test('Q5/Q6 guide answers follow independently computed geometry, probability, sets and area costs', () => {
  const sectors = [5, 15, 10, 45, 25].map(share => 360 * share / 100);
  assert.deepEqual(sectors, [18, 54, 36, 162, 90]);
  assert.equal(sectors.reduce((sum, angle) => sum + angle, 0), 360);
  assert.match(guide(ids[0]).answer, /18°.*54°.*36°.*162°.*90°/);

  const redPairs = (5 / 12) * (4 / 11);
  assert.equal(redPairs, 5 / 33);
  assert.match(guide(ids[1]).answer, /5\/33/);

  const classSize = 80, biology = classSize * 3 / 4, physics = classSize * 3 / 5;
  const both = biology + physics - classSize, biologyOnly = biology - both, physicsOnly = physics - both;
  assert.deepEqual([biology, physics, both, biologyOnly, physicsOnly], [60, 48, 28, 32, 20]);
  assert.equal(biologyOnly / classSize, 2 / 5);
  assert.match(guide(ids[2]).answer, /28.*2\/5/);

  const area = 15 * 8, carpet = area * 890, painting = 216120 - carpet;
  assert.deepEqual([area, carpet, painting], [120, 106800, 109320]);
  assert.match(guide(ids[3]).answer, /109,320/);
  assert.match(guide(ids[3]).steps.join(' '), /106,800.*109,320/);
});

test('authored French and Swahili guidance keeps the four results and draft identities', () => {
  for (const locale of ['fr', 'sw']) {
    const localized = writtenBank(locale);
    assert.equal(localized.items.length, bank.items.length);
    for (const id of ids) {
      const original = guide(id);
      const item = localized.items.find(row => row.id === id);
      assert.ok(item, `${locale} ${id}`);
      assert.equal(item.source, original.source);
      assert.equal(item.number, original.number);
      assert.equal(item.subpart, original.subpart);
      assert.equal(item.checks.length, original.checks.length);
      assert.notEqual(item.prompt, original.prompt);
      assert.equal(item.questionLanguage, locale);
    }
    const answer = id => localized.items.find(item => item.id === id).answer;
    assert.match(answer(ids[0]), /18°.*54°.*36°.*162°.*90°/);
    assert.match(answer(ids[1]), /5\/33/);
    assert.match(answer(ids[2]), /28.*2\/5/);
    assert.match(answer(ids[3]), /109[ ,]?320/);
  }
});
