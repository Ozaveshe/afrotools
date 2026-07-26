(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.draftRepetitionEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function words(text) {
    return String(text || '').toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
  }

  function sentences(text) {
    return String(text || '').split(/[.!?]+(?:\s+|$)/).map(function (sentence) {
      return sentence.trim();
    }).filter(Boolean);
  }

  function repeatedPhrases(sentenceList, phraseSize, minimumCount) {
    var counts = new Map();
    sentenceList.forEach(function (sentence) {
      var tokens = words(sentence);
      for (var index = 0; index <= tokens.length - phraseSize; index += 1) {
        var phrase = tokens.slice(index, index + phraseSize).join(' ');
        counts.set(phrase, (counts.get(phrase) || 0) + 1);
      }
    });
    return Array.from(counts.entries()).filter(function (entry) {
      return entry[1] >= minimumCount;
    }).map(function (entry) {
      return { phrase: entry[0], count: entry[1] };
    }).sort(function (a, b) {
      return b.count - a.count || a.phrase.localeCompare(b.phrase);
    });
  }

  function repeatedSentences(sentenceList) {
    var counts = new Map();
    sentenceList.forEach(function (sentence) {
      var normalized = words(sentence).join(' ');
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
    return Array.from(counts.entries()).filter(function (entry) {
      return entry[1] >= 2;
    }).map(function (entry) {
      return { sentence: entry[0], count: entry[1] };
    }).sort(function (a, b) {
      return b.count - a.count || a.sentence.localeCompare(b.sentence);
    });
  }

  function analyze(text, options) {
    options = options || {};
    var phraseSize = Number(options.phraseSize || 4);
    var minimumCount = Number(options.minimumCount || 2);
    var errors = [];
    if (!Number.isInteger(phraseSize) || phraseSize < 3 || phraseSize > 8) {
      errors.push('Phrase length must be a whole number from 3 to 8 words.');
    }
    if (!Number.isInteger(minimumCount) || minimumCount < 2 || minimumCount > 10) {
      errors.push('Minimum repetitions must be a whole number from 2 to 10.');
    }
    var tokenList = words(text);
    if (tokenList.length < 20) errors.push('Enter at least 20 words for a useful local repetition check.');
    if (errors.length) return { ok: false, errors: errors };

    var sentenceList = sentences(text);
    var phraseRepeats = repeatedPhrases(sentenceList, phraseSize, minimumCount);
    var sentenceRepeats = repeatedSentences(sentenceList);
    var sentenceWordCounts = sentenceList.map(function (sentence) { return words(sentence).length; });
    var longSentences = sentenceWordCounts.filter(function (count) { return count > 35; }).length;
    var paragraphs = String(text || '').trim().split(/\n\s*\n+/).filter(function (paragraph) { return paragraph.trim(); }).length;
    var uniqueWords = new Set(tokenList).size;
    return {
      ok: true,
      wordCount: tokenList.length,
      uniqueWords: uniqueWords,
      lexicalVarietyPercent: tokenList.length ? uniqueWords / tokenList.length * 100 : 0,
      sentenceCount: sentenceList.length,
      paragraphCount: paragraphs,
      averageSentenceWords: sentenceList.length ? tokenList.length / sentenceList.length : 0,
      longSentences: longSentences,
      phraseSize: phraseSize,
      minimumCount: minimumCount,
      repeatedPhrases: phraseRepeats,
      repeatedSentences: sentenceRepeats
    };
  }

  return {
    analyze: analyze,
    words: words,
    sentences: sentences,
    repeatedPhrases: repeatedPhrases,
    repeatedSentences: repeatedSentences
  };
});
