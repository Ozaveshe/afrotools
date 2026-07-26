(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroFlashcardEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function parseDelimitedLine(line, delimiter) {
    var fields = [];
    var value = '';
    var quoted = false;

    for (var index = 0; index < line.length; index += 1) {
      var character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === delimiter && !quoted) {
        fields.push(value.trim());
        value = '';
      } else {
        value += character;
      }
    }

    fields.push(value.trim());
    return quoted ? [] : fields;
  }

  function parseCards(text) {
    if (typeof text !== 'string') return [];
    return text.split(/\r?\n/).map(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return null;
      var delimiter = trimmed.indexOf('\t') >= 0 ? '\t' : ',';
      var fields = parseDelimitedLine(trimmed, delimiter);
      if (fields.length < 2) return null;
      var front = fields.shift().trim();
      var back = fields.join(delimiter === '\t' ? '\t' : ',').trim();
      return front && back ? { front: front, back: back } : null;
    }).filter(Boolean);
  }

  function normaliseAnswer(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function answersMatch(actual, expected) {
    return normaliseAnswer(actual) === normaliseAnswer(expected);
  }

  function buildReviewOrder(cards) {
    if (!Array.isArray(cards)) return [];
    return cards.map(function (card, index) {
      return {
        index: index,
        reviewCount: Math.max(0, Number(card.reviewCount) || 0),
        mastered: Boolean(card.mastered)
      };
    }).sort(function (left, right) {
      if (left.mastered !== right.mastered) return left.mastered ? 1 : -1;
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
      return left.index - right.index;
    }).map(function (item) {
      return item.index;
    });
  }

  function escapeCsv(value) {
    return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
  }

  function exportCsv(deck) {
    var cards = deck && Array.isArray(deck.cards) ? deck.cards : [];
    return '\uFEFFFront,Back,Status,Review marks\n' + cards.map(function (card) {
      return [
        escapeCsv(card.front),
        escapeCsv(card.back),
        escapeCsv(card.mastered ? 'Got it' : card.reviewCount > 0 ? 'Review' : 'New'),
        escapeCsv(Math.max(0, Number(card.reviewCount) || 0))
      ].join(',');
    }).join('\n');
  }

  return {
    parseCards: parseCards,
    normaliseAnswer: normaliseAnswer,
    answersMatch: answersMatch,
    buildReviewOrder: buildReviewOrder,
    exportCsv: exportCsv
  };
});
