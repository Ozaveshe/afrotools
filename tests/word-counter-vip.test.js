const assert = require('node:assert/strict');
const engine = require('../tools/word-counter/word-counter-engine.js');

function run() {
  const unicode = engine.analyse('L’étudiant écrit un résumé. Ọmọ-ilé learns 2 languages.', {
    readingWpm: 200,
    speakingWpm: 130,
    wordsPerPage: 275,
  });
  assert.equal(unicode.words, 8, 'Unicode, apostrophised, and hyphenated words should count predictably');
  assert.equal(unicode.sentences, 2);
  assert.equal(unicode.paragraphs, 1);

  const whitespace = engine.analyse('One\ttwo\nthree', {});
  assert.equal(whitespace.characters, 13);
  assert.equal(whitespace.charactersNoWhitespace, 11);
  assert.equal(whitespace.words, 3);

  const paragraphs = engine.analyse('First paragraph.\nStill first.\n\nSecond paragraph.', {});
  assert.equal(paragraphs.paragraphs, 2);
  assert.equal(paragraphs.sentences, 3);

  const timings = engine.analyse(Array(100).fill('word').join(' '), {
    readingWpm: 200,
    speakingWpm: 100,
    wordsPerPage: 50,
  });
  assert.equal(timings.readingTime.label, '30 sec');
  assert.equal(timings.speakingTime.label, '1 min');
  assert.equal(timings.pageEstimate, 2);

  const under = engine.evaluateLimits(timings, {
    minimumWords: 120,
    maximumWords: 150,
    maximumCharacters: 1000,
  });
  assert.equal(under.state, 'under');
  assert.match(under.messages.join(' '), /20 words needed/);

  const over = engine.evaluateLimits(timings, {
    maximumWords: 90,
    maximumCharacters: 400,
  });
  assert.equal(over.state, 'over');
  assert.match(over.messages.join(' '), /10 words over/);

  const invalid = engine.evaluateLimits(timings, {
    minimumWords: 200,
    maximumWords: 100,
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.issues[0], /minimum word target/);

  const fractional = engine.evaluateLimits(timings, { maximumWords: 1.5 });
  assert.equal(fractional.valid, false);
  assert.match(fractional.issues[0], /whole number/);

  const short = engine.analyse('Very short.', {});
  assert.equal(short.readability.available, false);
  const unstableSample = engine.analyse('This brief sample has more than ten words. It is still too short for a useful readability estimate.', {});
  assert.equal(unstableSample.readability.available, false);

  const nonEnglish = engine.analyse('Ẹ kú àárọ̀ gbogbo eniyan. Mo dúpẹ́ lọwọ yin fun iranlọwọ yii gan-an.', {});
  assert.equal(nonEnglish.readability.available, false);

  const phrases = engine.ngrams(
    ['study', 'plan', 'study', 'plan', 'today'],
    2,
    false,
    new Set(),
  );
  assert.deepEqual(phrases[0], { phrase: 'study plan', count: 2 });

  console.log('word-counter-vip: 12 checks passed');
}

run();
