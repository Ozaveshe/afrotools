(function (root, factory) {
  'use strict';

  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.wordCounter = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var WORD_PATTERN = /[\p{L}\p{M}\p{N}]+(?:[’'][\p{L}\p{M}\p{N}]+)*(?:-[\p{L}\p{M}\p{N}]+(?:[’'][\p{L}\p{M}\p{N}]+)*)*/gu;

  function wordsFrom(text) {
    return String(text || '').match(WORD_PATTERN) || [];
  }

  function sentenceCount(text) {
    var value = String(text || '').trim();
    if (!value) return 0;

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        var segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
        return Array.from(segmenter.segment(value)).filter(function (part) {
          return wordsFrom(part.segment).length > 0;
        }).length;
      } catch (error) {
        // Use the deterministic fallback below.
      }
    }

    var segments = value.split(/[.!?]+(?:["'’”)\]]*)?(?:\s+|$)/u).filter(function (part) {
      return wordsFrom(part).length > 0;
    });
    return Math.max(1, segments.length);
  }

  function paragraphCount(text) {
    var value = String(text || '').trim();
    if (!value) return 0;
    return value.split(/\n\s*\n/u).filter(function (part) {
      return wordsFrom(part).length > 0;
    }).length;
  }

  function countEnglishSyllables(word) {
    var value = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!value) return 0;
    if (value.length <= 3) return 1;
    value = value
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, '')
      .replace(/^y/u, '');
    var groups = value.match(/[aeiouy]{1,2}/g);
    return groups ? groups.length : 1;
  }

  function timeEstimate(wordCount, wordsPerMinute) {
    var rate = Number(wordsPerMinute);
    if (!Number.isFinite(rate) || rate <= 0 || wordCount <= 0) {
      return { minutes: 0, seconds: 0, label: '0 min' };
    }
    var seconds = Math.max(1, Math.round((wordCount / rate) * 60));
    var minutes = Math.floor(seconds / 60);
    var remainder = seconds % 60;
    var label = minutes > 0
      ? minutes + ' min' + (remainder ? ' ' + remainder + ' sec' : '')
      : remainder + ' sec';
    return { minutes: minutes, seconds: remainder, label: label };
  }

  function readability(words, sentences) {
    if (words.length < 30 || sentences < 2) {
      return {
        available: false,
        reason: 'Add at least 30 English words across two complete sentences for a less fragile estimate.'
      };
    }

    var latinWords = words.filter(function (word) {
      return /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/u.test(word);
    });
    if (latinWords.length / words.length < 0.8) {
      return {
        available: false,
        reason: 'English readability is hidden because this text is not mostly English words.'
      };
    }

    var syllables = latinWords.reduce(function (total, word) {
      return total + countEnglishSyllables(word);
    }, 0);
    var sentenceLength = latinWords.length / sentences;
    var syllablesPerWord = syllables / latinWords.length;
    var ease = Math.max(0, Math.min(100, Math.round(
      206.835 - (1.015 * sentenceLength) - (84.6 * syllablesPerWord)
    )));
    var grade = Math.max(0, (0.39 * sentenceLength) + (11.8 * syllablesPerWord) - 15.59);

    return {
      available: true,
      ease: ease,
      grade: Number(grade.toFixed(1)),
      note: 'English-only estimate; names, abbreviations and specialist terms can change the score.'
    };
  }

  function analyse(text, assumptions) {
    var value = String(text || '');
    var options = assumptions || {};
    var words = wordsFrom(value);
    var normalised = words.map(function (word) {
      return word.toLocaleLowerCase('en');
    });
    var lettersAndNumbers = words.reduce(function (total, word) {
      return total + Array.from(word.replace(/[’'-]/gu, '')).length;
    }, 0);
    var sentences = sentenceCount(value);
    var paragraphs = paragraphCount(value);
    var reading = timeEstimate(words.length, options.readingWpm || 200);
    var speaking = timeEstimate(words.length, options.speakingWpm || 130);
    var pageWords = Number(options.wordsPerPage) > 0 ? Number(options.wordsPerPage) : 275;

    return {
      words: words.length,
      characters: Array.from(value).length,
      charactersNoWhitespace: Array.from(value.replace(/\s/gu, '')).length,
      sentences: sentences,
      paragraphs: paragraphs,
      uniqueWords: new Set(normalised).size,
      averageWordLength: words.length ? Number((lettersAndNumbers / words.length).toFixed(1)) : 0,
      readingTime: reading,
      speakingTime: speaking,
      pageEstimate: words.length ? Number((words.length / pageWords).toFixed(1)) : 0,
      readability: readability(words, sentences),
      normalisedWords: normalised
    };
  }

  function evaluateLimits(stats, limits) {
    var input = limits || {};
    var minimum = parseLimit(input.minimumWords, 'Minimum words');
    var maximum = parseLimit(input.maximumWords, 'Maximum words');
    var characters = parseLimit(input.maximumCharacters, 'Maximum characters');
    var minimumWords = minimum.value;
    var maximumWords = maximum.value;
    var maximumCharacters = characters.value;
    var issues = [];
    var messages = [];

    [minimum, maximum, characters].forEach(function (limit) {
      if (limit.error) issues.push(limit.error);
    });
    if (minimumWords && maximumWords && minimumWords > maximumWords) {
      issues.push('The minimum word target cannot be greater than the maximum.');
    }
    if (issues.length) {
      return { valid: false, issues: issues, messages: [], state: 'invalid' };
    }

    if (minimumWords) {
      var remaining = minimumWords - stats.words;
      messages.push(remaining > 0
        ? remaining + ' words needed to reach the minimum.'
        : 'Minimum word target reached.');
    }
    if (maximumWords) {
      var wordRoom = maximumWords - stats.words;
      messages.push(wordRoom >= 0
        ? wordRoom + ' words available before the maximum.'
        : Math.abs(wordRoom) + ' words over the maximum.');
    }
    if (maximumCharacters) {
      var characterRoom = maximumCharacters - stats.characters;
      messages.push(characterRoom >= 0
        ? characterRoom + ' characters available before the maximum.'
        : Math.abs(characterRoom) + ' characters over the maximum.');
    }

    var over = (maximumWords && stats.words > maximumWords)
      || (maximumCharacters && stats.characters > maximumCharacters);
    var under = minimumWords && stats.words < minimumWords;

    return {
      valid: true,
      issues: [],
      messages: messages,
      state: over ? 'over' : under ? 'under' : messages.length ? 'met' : 'unset'
    };
  }

  function parseLimit(value, label) {
    if (value === '' || value === null || typeof value === 'undefined') {
      return { value: null, error: null };
    }
    var number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
      return { value: null, error: label + ' must be a whole number greater than zero.' };
    }
    return { value: number, error: null };
  }

  function ngrams(words, size, excludeStopWords, stopWords) {
    var n = Number(size);
    if (![1, 2, 3].includes(n)) n = 1;
    var stops = stopWords || new Set();
    var counts = new Map();

    for (var index = 0; index <= words.length - n; index += 1) {
      var gram = words.slice(index, index + n);
      if (excludeStopWords && gram.some(function (word) { return stops.has(word); })) continue;
      var key = gram.join(' ');
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(function (entry) { return { phrase: entry[0], count: entry[1] }; })
      .filter(function (entry) { return n === 1 || entry.count > 1; })
      .sort(function (a, b) {
        return b.count - a.count || a.phrase.localeCompare(b.phrase);
      })
      .slice(0, 15);
  }

  return {
    analyse: analyse,
    evaluateLimits: evaluateLimits,
    ngrams: ngrams,
    wordsFrom: wordsFrom,
    sentenceCount: sentenceCount,
    paragraphCount: paragraphCount,
    countEnglishSyllables: countEnglishSyllables
  };
});
