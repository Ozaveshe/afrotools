(function (root) {
  'use strict';

  function create(reviewItems) {
    var items = Array.isArray(reviewItems) ? reviewItems.filter(function (item) {
      return item && item.graded && !item.correct && (item.wrong || item.skipped);
    }) : [];
    var index = 0;
    var checked = false;

    return {
      count: items.length,
      position: function () { return index + 1; },
      current: function () { return items[index] || null; },
      check: function (choice) {
        var item = items[index];
        if (!item || checked || !item.options ||
            !Object.prototype.hasOwnProperty.call(item.options, choice)) return null;
        checked = true;
        return { correct: choice === item.correctAnswer, correctAnswer: item.correctAnswer,
          explanation: item.explanation };
      },
      next: function () {
        if (!checked) return false;
        index++;
        checked = false;
        return true;
      }
    };
  }

  root.AfroJAMB = root.AfroJAMB || {};
  root.AfroJAMB.OriginalRetry = { create: create };
  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create };
}(typeof window !== 'undefined' ? window : globalThis));
