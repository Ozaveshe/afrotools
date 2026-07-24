(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroToolsCryptoQuizEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var LOCALES = ['en', 'fr'];
  function fail(message) { return { ok: false, errors: [message] }; }
  function isText(value) { return typeof value === 'string' && value.trim().length > 0; }
  function localized(value) { return value && LOCALES.every(function (locale) { return isText(value[locale]); }); }
  function validDate(value, asOf) {
    if (!isText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parsed = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= asOf;
  }
  function validSource(value, asOf) {
    if (!value || !isText(value.publisher) || !validDate(value.reviewedAt, asOf)) return false;
    try {
      var url = new URL(value.url);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch (_) { return false; }
  }

  function validateBank(bank, options) {
    var asOf = (options && options.asOf) || new Date().toISOString().slice(0, 10);
    if (!bank || bank.schemaVersion !== 1 || !validDate(bank.reviewedAt, asOf) || !localized(bank.boundary) || !Array.isArray(bank.sets) || !bank.sets.length) return fail('Quiz bank schema is invalid.');
    var ids = new Set();
    for (var s = 0; s < bank.sets.length; s += 1) {
      var set = bank.sets[s];
      if (!set || !isText(set.id) || ids.has(set.id) || !localized(set.name) || !localized(set.description) || !Array.isArray(set.questions) || !set.questions.length) return fail('Quiz set schema is invalid.');
      ids.add(set.id);
      for (var i = 0; i < set.questions.length; i += 1) {
        var question = set.questions[i];
        if (!question || !isText(question.id) || ids.has(question.id) || !localized(question.topic) || question.status !== 'durable') return fail('Quiz question schema is invalid.');
        ids.add(question.id);
        if (!localized(question.prompt) || !localized(question.explanation)) return fail('Quiz translation is incomplete.');
        if (!question.options || !LOCALES.every(function (locale) {
          return Array.isArray(question.options[locale]) && question.options[locale].length >= 3 &&
            question.options[locale].length <= 5 && question.options[locale].every(isText);
        }) || question.options.en.length !== question.options.fr.length) return fail('Quiz options are invalid.');
        if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.en.length) return fail('Quiz answer index is invalid.');
        if (!validSource(question.source, asOf)) return fail('Quiz source is invalid.');
      }
    }
    return { ok: true, errors: [] };
  }

  function score(set, answers) {
    if (!set || !Array.isArray(set.questions) || !Array.isArray(answers) || answers.length !== set.questions.length) throw new Error('A complete answer set is required.');
    var total = set.questions.length;
    var correct = 0;
    var topics = {};
    var review = set.questions.map(function (question, index) {
      var selected = answers[index];
      if (!Number.isInteger(selected) || selected < 0 || selected >= question.options.en.length) throw new Error('An answer is invalid.');
      var isCorrect = selected === question.answer;
      if (isCorrect) correct += 1;
      var topicKey = question.topic.en;
      if (!topics[topicKey]) topics[topicKey] = { label: question.topic, correct: 0, total: 0 };
      topics[topicKey].total += 1;
      if (isCorrect) topics[topicKey].correct += 1;
      return { question: question, selected: selected, correct: isCorrect };
    });
    return { set: set, answers: answers.slice(), correct: correct, total: total, topics: topics, review: review };
  }

  function toText(result, locale, boundary) {
    if (!result || !result.review || result.review.length !== result.total) throw new Error('A completed result is required.');
    locale = LOCALES.indexOf(locale) >= 0 ? locale : 'en';
    var labels = locale === 'fr'
      ? { score: 'Score exact', breakdown: 'Détail par thème', review: 'Révision des réponses', yours: 'Votre réponse', correct: 'Bonne réponse', source: 'Source', reviewed: 'Révisé le' }
      : { score: 'Exact score', breakdown: 'Topic breakdown', review: 'Answer review', yours: 'Your answer', correct: 'Correct answer', source: 'Source', reviewed: 'Reviewed' };
    var lines = [result.set.name[locale], labels.score + ': ' + result.correct + ' / ' + result.total, '', labels.breakdown];
    Object.keys(result.topics).forEach(function (topic) {
      lines.push('- ' + result.topics[topic].label[locale] + ': ' + result.topics[topic].correct + ' / ' + result.topics[topic].total);
    });
    lines.push('', labels.review);
    result.review.forEach(function (item, index) {
      var q = item.question;
      lines.push('', (index + 1) + '. ' + q.prompt[locale], labels.yours + ': ' + q.options[locale][item.selected], labels.correct + ': ' + q.options[locale][q.answer], q.explanation[locale], labels.source + ': ' + q.source.publisher + ' — ' + q.source.url, labels.reviewed + ': ' + q.source.reviewedAt);
    });
    lines.push('', boundary[locale]);
    return lines.join('\n');
  }

  return { validateBank: validateBank, score: score, toText: toText };
});
