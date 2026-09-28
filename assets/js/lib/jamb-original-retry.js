(function (root) {
  'use strict';

  var BANK_ID = 'afrotools-original-jamb-practice-v1';
  var HEX = /^[a-f0-9]{64}$/;

  function queue(items) {
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

  function create(reviewItems) {
    return queue(Array.isArray(reviewItems) ? reviewItems.filter(function (item) {
      return item && item.graded && !item.correct && (item.wrong || item.skipped);
    }) : []);
  }

  function resolveRevision(revision, pool) {
    var prefix = revision && revision.subject === 'mathematics' ? 'math' :
      revision && revision.subject === 'english' ? 'english' : null;
    if (!prefix || revision.bankId !== BANK_ID || revision.locale !== 'en' ||
        !HEX.test(revision.reviewRevision || '') || !Array.isArray(revision.ids) ||
        !revision.ids.length || revision.ids.length > 12 || new Set(revision.ids).size !== revision.ids.length ||
        !Array.isArray(revision.contentHashes) || revision.contentHashes.length !== revision.ids.length ||
        !pool || pool.kind !== 'original-practice' || pool.collection_id !== BANK_ID ||
        !HEX.test(pool.review_revision || '') || !Array.isArray(pool.questions)) {
      throw new Error('This saved JAMB revision is not supported. Your study task and practice drafts are kept.');
    }
    return revision.ids.map(function (id, index) {
      var match = typeof id === 'string' && new RegExp('^ato-' + prefix + '-v1-([0-9]{2})$').exec(id);
      var question = pool.questions.find(function (item) { return item.id === id; });
      if (!match || Number(match[1]) < 1 || !HEX.test(revision.contentHashes[index] || '') ||
          !question || question.subject !== revision.subject || question.year !== null || question.num !== null ||
          !question.review || question.review.status !== 'reviewed' ||
          question.review.content_sha256 !== revision.contentHashes[index]) {
        throw new Error('This saved revision no longer matches the current question set. Your study task and practice drafts are kept.');
      }
      return question;
    });
  }

  function createRevision(questions) {
    if (!Array.isArray(questions) || !questions.length || questions.length > 12 ||
        new Set(questions.map(function (question) { return question && question.id; })).size !== questions.length) {
      throw new Error('This saved JAMB revision is not supported.');
    }
    return queue(questions.map(function (question, index) {
      if (!question || !question.options || !Object.prototype.hasOwnProperty.call(question.options, question.answer) ||
          typeof question.explanation !== 'string' || !question.explanation.trim() ||
          typeof question.question !== 'string' || !question.question.trim() ||
          !question.review || question.review.status !== 'reviewed' || !HEX.test(question.review.content_sha256 || '')) {
        throw new Error('This saved JAMB revision is not supported.');
      }
      return { id: question.id, subject: question.subject, index: index, question: question.question,
        passage: question.passage || '', options: question.options, correctAnswer: question.answer,
        explanation: question.explanation };
    }));
  }

  root.AfroJAMB = root.AfroJAMB || {};
  var api = { create: create, createRevision: createRevision, resolveRevision: resolveRevision };
  root.AfroJAMB.OriginalRetry = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
