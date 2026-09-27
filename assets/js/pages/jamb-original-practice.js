(function (root) {
  'use strict';

  var HISTORY_KEY = 'afrojamb-original-history-v1';
  var POOL_URL = '/data/jamb/pools/original-practice.json';
  var INDEX_URL = '/data/jamb/pools/original-practice-index.json';
  var LABELS = { mathematics: 'Mathematics', english: 'Use of English' };
  var pool = null;
  var config = null;
  var submitted = false;
  var cbt = root.AfroJAMB && root.AfroJAMB.CBT;
  var trust = root.AfroJAMB && root.AfroJAMB.QuestionTrust;
  var $ = function (id) { return document.getElementById(id); };

  function track(event, subject, count) {
    var analytics = root.AfroTools && root.AfroTools.analytics;
    if (analytics && typeof analytics.track === 'function') {
      analytics.track(event, { subject: subject, question_count: count, practice_kind: 'afrotools-original' });
    }
    var action = event === 'education_jamb_original_start' ? 'start' :
      event === 'education_jamb_original_resume' ? 'resume' : null;
    if (action && analytics && typeof analytics.trackEducationPractice === 'function') {
      analytics.trackEducationPractice('jamb', subject, action);
    }
  }
  function show(screen) {
    ['setup', 'quiz', 'result'].forEach(function (name) { $(name + '-screen').hidden = name !== screen; });
    root.scrollTo(0, 0);
  }
  function selectedSubject() { return $('subject').value === 'english' ? 'english' : 'mathematics'; }
  function makeConfig(subject) {
    return { pool: pool.questions, poolRevision: pool.review_revision, subjects: [subject],
      mode: 'original-practice', questionsPerSubject: 12, durationMinutes: 20, answeredOnly: true,
      onTick: updateTimer, onTimeout: function () { if (!submitted) finish(true); } };
  }
  function updateTimer(seconds) {
    var mins = Math.floor(seconds / 60);
    $('timer').textContent = String(mins).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function renderNav() {
    var grid = $('nav-grid');
    grid.replaceChildren();
    cbt.getNavGrid().forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(item.num);
      button.setAttribute('aria-label', 'Question ' + item.num + (item.answered ? ', answered' : ', unanswered') + (item.marked ? ', marked for review' : ''));
      if (item.current) { button.classList.add('is-current'); button.setAttribute('aria-current', 'step'); }
      if (item.answered) button.classList.add('is-answered');
      if (item.marked) button.classList.add('is-marked');
      button.addEventListener('click', function () { cbt.goto(item.index); renderQuestion(true); });
      grid.appendChild(button);
    });
  }
  function renderQuestion(focus) {
    var view = cbt.getCurrentQuestion();
    if (!view) return;
    var q = view.question;
    var answered = cbt.getNavGrid().filter(function (item) { return item.answered; }).length;
    $('quiz-heading').textContent = LABELS[q.subject];
    $('progress').textContent = answered + ' of ' + view.total + ' answered';
    $('question-position').textContent = 'Question ' + (view.index + 1) + ' of ' + view.total + ' · ' + q.topic;
    $('question').textContent = q.question;
    $('passage').hidden = !q.passage;
    $('passage').textContent = q.passage || '';
    var options = $('options');
    options.querySelectorAll('label').forEach(function (label) { label.remove(); });
    Object.keys(q.options).sort().forEach(function (key) {
      var label = document.createElement('label');
      label.className = 'original-option';
      var input = document.createElement('input');
      input.type = 'radio'; input.name = 'answer'; input.value = key;
      input.checked = view.selectedAnswer === key;
      input.addEventListener('change', function () {
        cbt.selectAnswer(key);
        $('progress').textContent = cbt.getNavGrid().filter(function (item) { return item.answered; }).length + ' of ' + view.total + ' answered';
        renderNav();
      });
      var copy = document.createElement('span');
      var letter = document.createElement('strong'); letter.textContent = key + '.';
      copy.append(letter, document.createTextNode(q.options[key]));
      label.append(input, copy);
      options.appendChild(label);
    });
    $('prev-btn').disabled = view.index === 0;
    $('next-btn').disabled = view.index === view.total - 1;
    $('mark-btn').setAttribute('aria-pressed', String(view.isMarked));
    $('mark-btn').textContent = view.isMarked ? 'Remove review mark' : 'Mark for review';
    renderNav();
    updateTimer(cbt.timeRemainingSeconds());
    if (focus) $('question').focus();
  }
  function readHistory() {
    try {
      var rows = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(rows) ? rows.filter(function (row) { return LABELS[row.subject] && Number.isInteger(row.correct) && Number.isInteger(row.total); }).slice(0, 10) : [];
    } catch (error) { return []; }
  }
  function renderHistory() {
    var box = $('history');
    box.replaceChildren();
    var rows = readHistory();
    if (!rows.length) return;
    var title = document.createElement('h2'); title.textContent = 'Recent original practice';
    var list = document.createElement('ul');
    rows.forEach(function (row) {
      var item = document.createElement('li');
      var date = new Date(row.at);
      item.textContent = LABELS[row.subject] + ' · ' + row.correct + '/' + row.total + ' · ' +
        (Number.isNaN(date.getTime()) ? 'Saved session' : date.toLocaleDateString());
      list.appendChild(item);
    });
    box.append(title, list);
  }
  function saveHistory(subject, score) {
    try {
      var rows = readHistory();
      rows.unshift({ subject: subject, correct: score.total, total: score.outOf, at: new Date().toISOString() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, 10)));
    } catch (error) { /* Practice remains usable when browser storage is unavailable. */ }
  }
  function reviewCard(item) {
    var card = document.createElement('article'); card.className = 'original-review';
    var meta = document.createElement('small');
    meta.textContent = 'Question ' + (item.index + 1) + ' · ' + (item.correct ? 'Correct' : item.skipped ? 'Skipped' : 'Incorrect');
    var heading = document.createElement('h3'); heading.textContent = item.question;
    card.append(meta);
    if (item.passage) {
      var passage = document.createElement('blockquote'); passage.className = 'original-passage'; passage.textContent = item.passage;
      card.appendChild(passage);
    }
    card.appendChild(heading);
    var picked = document.createElement('p');
    picked.textContent = 'Your answer: ' + (item.pickedAnswer ? item.pickedAnswer + '. ' + item.options[item.pickedAnswer] : 'No answer');
    card.appendChild(picked);
    var details = document.createElement('details');
    var summary = document.createElement('summary'); summary.textContent = 'Show answer and explanation';
    var correct = document.createElement('p');
    correct.textContent = 'Correct answer: ' + item.correctAnswer + '. ' + item.options[item.correctAnswer];
    var explanation = document.createElement('p'); explanation.textContent = item.explanation;
    details.append(summary, correct, explanation);
    card.appendChild(details);
    return card;
  }
  function finish(timedOut) {
    if (submitted) return;
    var state = cbt.getState();
    if (!state || state.mode !== 'original-practice') return;
    if (!timedOut && !root.confirm('Submit this original practice session? You can review answers afterward.')) return;
    try {
      var score = cbt.submit();
      submitted = true;
      $('raw-score').textContent = score.total + ' / ' + score.outOf;
      $('score-context').textContent = score.pctCorrect + '% correct · ' + LABELS[state.subjects[0]];
      $('result-note').textContent = (timedOut ? 'Time is up. ' : '') + 'This is a practice result, not a JAMB aggregate or predicted UTME score.';
      var review = $('review-list'); review.replaceChildren();
      score.reviewItems.forEach(function (item) { review.appendChild(reviewCard(item)); });
      saveHistory(state.subjects[0], score);
      track('education_jamb_original_submit', state.subjects[0], score.outOf);
      renderHistory();
      show('result');
      $('result-heading').focus();
    } catch (error) {
      $('setup-status').textContent = 'The reviewed set changed. Reload this page before practising again.';
      show('setup');
    }
  }
  function start() {
    if (!pool) return;
    var subject = selectedSubject();
    try {
      config = makeConfig(subject);
      var selected = cbt.selectQuestions(config);
      if (selected.length !== 12) throw new Error('Incomplete subject set');
      cbt.init(config);
      submitted = false;
      track('education_jamb_original_start', subject, 12);
      show('quiz'); renderQuestion(true);
    } catch (error) { $('setup-status').textContent = 'This subject set is unavailable. Please reload and try again.'; }
  }
  function resume() {
    var saved = cbt.tryRestore('original-practice');
    if (!saved || saved.mode !== 'original-practice' || !Array.isArray(saved.subjects) || saved.subjects.length !== 1 || !LABELS[saved.subjects[0]]) return;
    try {
      $('subject').value = saved.subjects[0];
      config = makeConfig(saved.subjects[0]);
      cbt.restore(config, saved);
      if (cbt.getState().questions.length !== 12) throw new Error('Incomplete saved subject set');
      submitted = false;
      track('education_jamb_original_resume', saved.subjects[0], 12);
      show('quiz'); renderQuestion(true);
    } catch (error) {
      cbt.clearSession();
      $('resume-btn').hidden = true;
      $('setup-status').textContent = 'The saved session is out of date. Start a new practice session.';
    }
  }
  async function ready() {
    if (!cbt || !trust) { $('setup-status').textContent = 'The practice engine could not load. Refresh this page.'; return; }
    var requested = new URLSearchParams(root.location.search).get('subject');
    if (LABELS[requested]) $('subject').value = requested;
    try {
      pool = await trust.loadPool(POOL_URL, INDEX_URL);
      if (pool.kind !== 'original-practice' || pool.collection_id !== 'afrotools-original-jamb-practice-v1' ||
          pool.questions.length !== pool.count ||
          pool.questions.some(function (q) { return q.year !== null || q.num !== null || !LABELS[q.subject]; }) ||
          ['mathematics', 'english'].some(function (subject) { return pool.questions.filter(function (q) { return q.subject === subject; }).length < 12; })) {
        throw new Error('Unexpected original-practice publication');
      }
      $('setup-status').textContent = pool.count + ' reviewed original questions are ready.';
      $('start-btn').disabled = false;
      var saved = cbt.tryRestore('original-practice');
      $('resume-btn').hidden = !(saved && saved.mode === 'original-practice' && saved.poolRevision === pool.review_revision);
      renderHistory();
    } catch (error) { $('setup-status').textContent = 'The reviewed question set could not be verified. Please try again later.'; }
  }

  $('start-btn').addEventListener('click', start);
  $('resume-btn').addEventListener('click', resume);
  $('prev-btn').addEventListener('click', function () { cbt.prev(); renderQuestion(true); });
  $('next-btn').addEventListener('click', function () { cbt.next(); renderQuestion(true); });
  $('mark-btn').addEventListener('click', function () { cbt.markForReview(); renderQuestion(false); });
  $('submit-btn').addEventListener('click', function () { finish(false); });
  $('again-btn').addEventListener('click', function () { $('resume-btn').hidden = true; show('setup'); });
  ready();
}(window));
