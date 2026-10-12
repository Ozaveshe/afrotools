(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroFlashcardEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function parseDelimitedLine(line, delimiter) {
    var fields = [], value = '', quoted = false;
    for (var index = 0; index < line.length; index += 1) {
      var character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
        else quoted = !quoted;
      } else if (character === delimiter && !quoted) { fields.push(value); value = ''; }
      else value += character;
    }
    fields.push(value);
    return quoted ? [] : fields;
  }

  function parseCards(text) {
    if (typeof text !== 'string') return [];
    text = text.replace(/^\uFEFF/, '');
    var records = [], record = '', quoted = false, hasTab = false;
    for (var index = 0; index < text.length; index += 1) {
      var character = text[index];
      if (character === '"') {
        record += character;
        if (quoted && text[index + 1] === '"') { record += text[++index]; }
        else quoted = !quoted;
      } else if ((character === '\n' || character === '\r') && !quoted) {
        if (record.trim()) records.push({ text: record, delimiter: hasTab ? '\t' : ',' });
        record = ''; hasTab = false;
        if (character === '\r' && text[index + 1] === '\n') index += 1;
      } else {
        if (character === '\t' && !quoted) hasTab = true;
        record += character;
      }
    }
    // Reject incomplete quoted input without silently importing a partial backup.
    if (quoted) return [];
    if (record.trim()) records.push({ text: record, delimiter: hasTab ? '\t' : ',' });
    var backup = records.length && records[0].delimiter === ',' &&
      JSON.stringify(parseDelimitedLine(records[0].text, ',')) === JSON.stringify(['Front','Back','Status','Review marks']);
    if (backup) records.shift();
    var cards = [], invalidBackup = false;
    records.forEach(function (row) {
      var fields = parseDelimitedLine(row.text, row.delimiter);
      if (backup) {
        var count = Number(fields[3]);
        if (row.delimiter !== ',' || fields.length !== 4 || !fields[0].trim() || !fields[1].trim() ||
            ['Got it','Review','New'].indexOf(fields[2]) < 0 || !fields[3].trim() ||
            !Number.isSafeInteger(count) || count < 0) { invalidBackup = true; return; }
        cards.push({ front: fields[0], back: fields[1], mastered: fields[2] === 'Got it', reviewCount: count });
      } else {
        if (fields.length < 2) return;
        var front = fields.shift().trim(), back = fields.join(row.delimiter).trim();
        if (front && back) cards.push({ front: front, back: back });
      }
    });
    return invalidBackup ? [] : cards;
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
