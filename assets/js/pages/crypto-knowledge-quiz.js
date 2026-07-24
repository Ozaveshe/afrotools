(function () {
  'use strict';
  var bank = window.AfroToolsCryptoQuizBank;
  var engine = window.AfroToolsCryptoQuizEngine;
  var locale = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  var text = locale === 'fr' ? {
    question: 'Question', of: 'sur', next: 'Question suivante', finish: 'Voir le résultat',
    correct: 'Bonne réponse.', wrong: 'Pas tout à fait.', source: 'Source', reviewed: 'révisé le',
    result: 'Votre résultat', exact: 'Score exact', topics: 'Détail par thème',
    review: 'Révision des réponses', yours: 'Votre réponse', answer: 'Bonne réponse',
    downloadText: 'Télécharger le compte rendu TXT', downloadPdf: 'Télécharger le compte rendu PDF',
    sharePreview: 'Aperçu partagé', copy: 'Copier le résultat', share: 'Partager',
    copied: 'Résultat copié.', shared: 'Partage ouvert.', unavailable: 'Cette fonction de partage n’est pas disponible ici.',
    failed: 'Impossible de terminer cette action. Vous pouvez télécharger le compte rendu.',
    restart: 'Choisir un autre questionnaire', questions: '6 questions', noTimer: 'Sans chronomètre',
    unavailableQuiz: 'Le questionnaire est indisponible car ses données n’ont pas passé la validation.',
    topicNames: {}
  } : {
    question: 'Question', of: 'of', next: 'Next question', finish: 'View result',
    correct: 'Correct.', wrong: 'Not quite.', source: 'Source', reviewed: 'reviewed',
    result: 'Your result', exact: 'Exact score', topics: 'Topic breakdown',
    review: 'Answer review', yours: 'Your answer', answer: 'Correct answer',
    downloadText: 'Download TXT review', downloadPdf: 'Download PDF review',
    sharePreview: 'Share preview', copy: 'Copy score', share: 'Share',
    copied: 'Score copied.', shared: 'Share sheet opened.', unavailable: 'Sharing is not available in this browser.',
    failed: 'That action could not be completed. You can download the review instead.',
    restart: 'Choose another set', questions: '6 questions', noTimer: 'Untimed',
    unavailableQuiz: 'The quiz is unavailable because its data did not pass validation.',
    topicNames: {}
  };
  function byId(id) { return document.getElementById(id); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function el(tag, value, className) {
    var node = document.createElement(tag);
    if (value !== undefined && value !== null) node.textContent = value;
    if (className) node.className = className;
    return node;
  }
  function setStatus(message) { byId('quizStatus').textContent = message || ''; }
  function safeFileName(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  var validation = engine && bank ? engine.validateBank(bank) : { ok: false };
  var state = { set: null, index: 0, answers: [], result: null };
  var intro = byId('quizIntro');
  var stage = byId('quizStage');
  var resultPanel = byId('quizResult');

  if (!validation.ok) {
    clear(intro);
    intro.appendChild(el('p', text.unavailableQuiz));
    return;
  }

  bank.sets.forEach(function (set) {
    var button = el('button', null, 'quiz-set');
    button.type = 'button';
    button.dataset.quizSet = set.id;
    button.appendChild(el('strong', set.name[locale]));
    button.appendChild(el('span', set.description[locale]));
    var meta = el('span', null, 'quiz-meta');
    meta.appendChild(el('span', text.questions));
    meta.appendChild(el('span', text.noTimer));
    button.appendChild(meta);
    button.addEventListener('click', function () { start(set); });
    byId('quizSets').appendChild(button);
  });

  function start(set) {
    state = { set: set, index: 0, answers: [], result: null };
    intro.hidden = true;
    resultPanel.hidden = true;
    stage.hidden = false;
    renderQuestion();
    byId('questionTitle').focus();
  }

  function renderQuestion() {
    var q = state.set.questions[state.index];
    var count = state.index + 1;
    byId('questionCount').textContent = text.question + ' ' + count + ' ' + text.of + ' ' + state.set.questions.length;
    byId('quizProgress').setAttribute('aria-valuenow', String(count));
    byId('quizProgress').setAttribute('aria-valuemax', String(state.set.questions.length));
    byId('quizProgressBar').style.width = ((count / state.set.questions.length) * 100) + '%';
    byId('questionTitle').textContent = q.prompt[locale];
    var options = byId('quizOptions');
    clear(options);
    q.options[locale].forEach(function (option, index) {
      var button = el('button', option, 'quiz-option');
      button.type = 'button';
      button.addEventListener('click', function () { choose(index); });
      options.appendChild(button);
    });
    byId('quizFeedback').hidden = true;
    clear(byId('quizFeedback'));
    byId('nextQuestion').disabled = true;
    byId('nextQuestion').textContent = count === state.set.questions.length ? text.finish : text.next;
  }

  function choose(selected) {
    var q = state.set.questions[state.index];
    state.answers[state.index] = selected;
    var options = byId('quizOptions').querySelectorAll('button');
    options.forEach(function (button, index) {
      button.disabled = true;
      if (index === q.answer) button.dataset.state = 'correct';
      else if (index === selected) button.dataset.state = 'wrong';
    });
    var feedback = byId('quizFeedback');
    feedback.appendChild(el('strong', selected === q.answer ? text.correct : text.wrong));
    feedback.appendChild(el('p', q.explanation[locale]));
    var cite = el('a', text.source + ': ' + q.source.publisher + ' · ' + text.reviewed + ' ' + q.source.reviewedAt, 'quiz-source');
    cite.href = q.source.url;
    cite.target = '_blank';
    cite.rel = 'noopener noreferrer';
    feedback.appendChild(cite);
    feedback.hidden = false;
    byId('nextQuestion').disabled = false;
    byId('nextQuestion').focus();
  }

  byId('nextQuestion').addEventListener('click', function () {
    if (!Number.isInteger(state.answers[state.index])) return;
    if (state.index < state.set.questions.length - 1) {
      state.index += 1;
      renderQuestion();
      byId('questionTitle').focus();
    } else showResult();
  });

  function showResult() {
    state.result = engine.score(state.set, state.answers);
    stage.hidden = true;
    resultPanel.hidden = false;
    byId('resultTitle').textContent = text.result + ': ' + state.set.name[locale];
    byId('scoreValue').textContent = state.result.correct + ' / ' + state.result.total;
    byId('topicHeading').textContent = text.topics;
    var topics = byId('topicList');
    clear(topics);
    Object.keys(state.result.topics).forEach(function (topic) {
      var li = el('li');
      li.appendChild(el('span', state.result.topics[topic].label[locale]));
      li.appendChild(el('strong', state.result.topics[topic].correct + ' / ' + state.result.topics[topic].total));
      topics.appendChild(li);
    });
    byId('reviewHeading').textContent = text.review;
    var review = byId('answerReview');
    clear(review);
    state.result.review.forEach(function (item, index) {
      var details = el('details');
      details.appendChild(el('summary', (index + 1) + '. ' + item.question.prompt[locale]));
      details.appendChild(el('p', text.yours + ': ' + item.question.options[locale][item.selected]));
      details.appendChild(el('p', text.answer + ': ' + item.question.options[locale][item.question.answer]));
      details.appendChild(el('p', item.question.explanation[locale]));
      var cite = el('a', text.source + ': ' + item.question.source.publisher + ' · ' + text.reviewed + ' ' + item.question.source.reviewedAt);
      cite.href = item.question.source.url; cite.target = '_blank'; cite.rel = 'noopener noreferrer';
      details.appendChild(cite);
      review.appendChild(details);
    });
    var payload = state.result.correct + ' / ' + state.result.total + ' — ' + window.location.origin + window.location.pathname;
    byId('sharePreview').textContent = payload;
    byId('downloadText').disabled = false;
    byId('downloadPdf').disabled = false;
    byId('resultTitle').focus();
  }

  function exportText() { return engine.toText(state.result, locale, bank.boundary); }
  byId('downloadText').addEventListener('click', function () {
    if (!state.result) return;
    var blob = new Blob([exportText()], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'crypto-quiz-' + safeFileName(state.set.id) + '-' + locale + '.txt';
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
  });
  byId('downloadPdf').addEventListener('click', function () {
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return setStatus(text.failed);
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    var parserSafeText = exportText().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").replace(/[—–]/g, '-');
    var lines = doc.splitTextToSize(parserSafeText, 495);
    var y = 54;
    lines.forEach(function (line) {
      if (y > 790) { doc.addPage(); y = 54; }
      doc.text(line, 50, y); y += 14;
    });
    doc.save('crypto-quiz-' + safeFileName(state.set.id) + '-' + locale + '.pdf');
  });
  byId('copyScore').addEventListener('click', function () {
    if (!state.result || !navigator.clipboard) return setStatus(text.unavailable);
    navigator.clipboard.writeText(byId('sharePreview').textContent).then(function () { setStatus(text.copied); }, function () { setStatus(text.failed); });
  });
  byId('shareScore').addEventListener('click', function () {
    if (!state.result || !navigator.share) return setStatus(text.unavailable);
    navigator.share({ title: document.title, text: state.result.correct + ' / ' + state.result.total, url: window.location.origin + window.location.pathname })
      .then(function () { setStatus(text.shared); }, function (error) { if (!error || error.name !== 'AbortError') setStatus(text.failed); });
  });
  byId('restartQuiz').addEventListener('click', function () {
    state = { set: null, index: 0, answers: [], result: null };
    resultPanel.hidden = true; intro.hidden = false; setStatus('');
    var first = byId('quizSets').querySelector('button'); if (first) first.focus();
  });
})();
