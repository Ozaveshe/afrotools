'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/plagiarism-pct/draft-repetition-engine.js');

const draft = [
  'Alpha beta gamma delta helps students.',
  'Alpha beta gamma delta helps teachers.',
  'This sentence repeats exactly.',
  'This sentence repeats exactly.',
  '',
  'More text completes this local draft with distinct words and enough material for a useful repetition check.'
].join('\n');

const result = engine.analyze(draft, { phraseSize: 4, minimumCount: 2 });
assert.equal(result.ok, true);
assert.ok(result.wordCount >= 20);
assert.ok(result.uniqueWords > 10);
assert.equal(result.sentenceCount, 5);
assert.equal(result.paragraphCount, 2);
assert.ok(result.averageSentenceWords > 0);
assert.equal(result.longSentences, 0);
assert.equal(result.phraseSize, 4);
assert.equal(result.minimumCount, 2);
assert.deepEqual(result.repeatedPhrases.find((item) => item.phrase === 'alpha beta gamma delta'), { phrase: 'alpha beta gamma delta', count: 2 });
assert.deepEqual(result.repeatedPhrases.find((item) => item.phrase === 'this sentence repeats exactly'), { phrase: 'this sentence repeats exactly', count: 2 });
assert.deepEqual(result.repeatedSentences, [{ sentence: 'this sentence repeats exactly', count: 2 }]);
assert.equal(result.lexicalVarietyPercent, result.uniqueWords / result.wordCount * 100);

assert.deepEqual(engine.words('École déjà, STUDENT’S work 2026.'), ['école', 'déjà', 'student’s', 'work', '2026']);
assert.deepEqual(engine.sentences('One sentence. Two questions? Three!'), ['One sentence', 'Two questions', 'Three']);
assert.equal(engine.repeatedPhrases(engine.sentences('red blue. green yellow red blue.'), 3, 2).length, 0);
assert.deepEqual(engine.repeatedSentences(engine.sentences('Same words! same, words.')), [{ sentence: 'same words', count: 2 }]);

const longSentence = Array.from({ length: 36 }, (_, index) => `word${index}`).join(' ') + '. Short sentence adds enough words.';
assert.equal(engine.analyze(longSentence, { phraseSize: 4, minimumCount: 2 }).longSentences, 1);

assert.equal(engine.analyze('too short', { phraseSize: 4, minimumCount: 2 }).ok, false);
assert.equal(engine.analyze(draft, { phraseSize: 2, minimumCount: 2 }).ok, false);
assert.equal(engine.analyze(draft, { phraseSize: 9, minimumCount: 2 }).ok, false);
assert.equal(engine.analyze(draft, { phraseSize: 4, minimumCount: 1 }).ok, false);
assert.equal(engine.analyze(draft, { phraseSize: 4, minimumCount: 11 }).ok, false);

console.log('plagiarism-pct VIP engine tests: 23 assertions passed');
