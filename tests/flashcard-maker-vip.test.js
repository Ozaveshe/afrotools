const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const engine = require('../tools/flashcard-maker/flashcard-engine.js');
const html = fs.readFileSync(path.join(__dirname, '../tools/flashcard-maker/index.html'), 'utf8');

test('bulk import accepts quoted CSV values and tab-separated cards', () => {
  assert.deepEqual(engine.parseCards('"Term, with comma","Answer, with comma"\nForce\tMass × acceleration'), [
    { front: 'Term, with comma', back: 'Answer, with comma' },
    { front: 'Force', back: 'Mass × acceleration' }
  ]);
});

test('answer matching ignores case, accents, and punctuation but not missing words', () => {
  assert.equal(engine.answersMatch('Déjà-vu!', 'deja vu'), true);
  assert.equal(engine.answersMatch('mass acceleration', 'mass times acceleration'), false);
});

test('review order puts missed cards ahead of new and got-it cards', () => {
  assert.deepEqual(engine.buildReviewOrder([
    { mastered: true, reviewCount: 0 },
    { mastered: false, reviewCount: 0 },
    { mastered: false, reviewCount: 3 },
    { mastered: false, reviewCount: 1 }
  ]), [2, 3, 1, 0]);
});

test('CSV export includes status and escapes quotes', () => {
  const csv = engine.exportCsv({
    cards: [{ front: 'What is "force"?', back: 'mass × acceleration', mastered: false, reviewCount: 2 }]
  });
  assert.match(csv, /"What is ""force""\?"/);
  assert.match(csv, /"Review","2"/);
});

test('page makes storage optional and removes silent cloud and chart dependencies', () => {
  assert.match(html, /id="rememberDecks"/);
  assert.match(html, /Off by default/);
  assert.match(html, /function clearSavedDecks\(\)/);
  assert.doesNotMatch(html, /edu-cloud-sync|EduCloudSync|cdn\.jsdelivr\.net\/npm\/chart\.js/);
  assert.doesNotMatch(html, /if \(key\) loadPreset\(key\)/);
});

test('SEO and visible copy describe the real adaptive queue and starter-deck limits', () => {
  assert.match(html, /simple adaptive queue, not a calendar-based spaced-repetition algorithm/);
  assert.match(html, /Starter prompts, not an official syllabus/);
  assert.match(html, /Print \/ PDF/);
  assert.match(html, /https:\/\/afrotools\.com\/tools\/flashcard-maker\//);
  const jsonLd = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
  assert.equal(jsonLd.length, 4);
  jsonLd.forEach((match) => assert.doesNotThrow(() => JSON.parse(match[1])));
});
