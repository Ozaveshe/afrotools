(function () {
  'use strict';

  var engine;
  var elements;
  var selected = null;
  var lastFocused = null;
  var quiz = { type: 'sym2name', correct: 0, total: 0, answered: false, target: null, timer: null };

  function byId(id) { return document.getElementById(id); }

  function init() {
    engine = window.AfroTools && window.AfroTools.periodicTableEngine;
    elements = window.PERIODIC_ELEMENTS;
    if (!engine || !Array.isArray(elements)) return;
    var validation = engine.validateElements(elements);
    if (!validation.valid) {
      byId('tableStatus').textContent = 'The element dataset did not pass its integrity check.';
      return;
    }
    bind();
    renderTable(elements);
    updateStatus(elements.length);
  }

  function bind() {
    ['search', 'categoryFilter', 'periodFilter', 'groupFilter'].forEach(function (id) {
      byId(id).addEventListener(id === 'search' ? 'input' : 'change', applyFilters);
    });
    byId('clearFilters').addEventListener('click', clearFilters);
    byId('copyElement').addEventListener('click', copyElement);
    byId('downloadElement').addEventListener('click', downloadElement);
    byId('printElement').addEventListener('click', printElement);
    byId('openQuiz').addEventListener('click', openQuiz);
    byId('quizClose').addEventListener('click', closeQuiz);
    document.querySelectorAll('[data-quiz-type]').forEach(function (button) {
      button.addEventListener('click', function () { setQuizType(button.dataset.quizType, button); });
    });
    byId('quizModal').addEventListener('click', function (event) {
      if (event.target === byId('quizModal')) closeQuiz();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && byId('quizModal').classList.contains('show')) closeQuiz();
      if (event.key === 'Tab' && byId('quizModal').classList.contains('show')) trapQuizFocus(event);
    });
  }

  function criteria() {
    return {
      query: byId('search').value,
      category: byId('categoryFilter').value,
      period: byId('periodFilter').value,
      group: byId('groupFilter').value
    };
  }

  function applyFilters() {
    var matches = engine.filter(elements, criteria());
    var ids = new Set(matches.map(function (element) { return element.z; }));
    document.querySelectorAll('.periodic-element').forEach(function (button) {
      var visible = ids.has(Number(button.dataset.z));
      button.hidden = !visible;
      button.setAttribute('aria-hidden', String(!visible));
    });
    updateStatus(matches.length);
  }

  function clearFilters() {
    byId('search').value = '';
    byId('categoryFilter').value = '';
    byId('periodFilter').value = '';
    byId('groupFilter').value = '';
    applyFilters();
    byId('search').focus();
  }

  function updateStatus(count) {
    byId('tableStatus').textContent = count + (count === 1 ? ' element shown.' : ' elements shown.');
  }

  function renderTable(list) {
    var grid = byId('ptable');
    grid.replaceChildren();
    list.forEach(function (element) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'periodic-element cat-' + element.c;
      button.dataset.z = element.z;
      button.style.gridColumn = String(element.c === 'lanthanide' || element.c === 'actinide' ? element.z - (element.c === 'lanthanide' ? 54 : 86) : element.g);
      button.style.gridRow = String(element.c === 'lanthanide' ? 8 : element.c === 'actinide' ? 9 : element.p);
      button.setAttribute('aria-label', element.n + ', symbol ' + element.s + ', atomic number ' + element.z);
      var number = document.createElement('span');
      number.className = 'num';
      number.textContent = element.z;
      var symbol = document.createElement('strong');
      symbol.className = 'sym';
      symbol.textContent = element.s;
      var name = document.createElement('span');
      name.className = 'name';
      name.textContent = element.n;
      button.append(number, symbol, name);
      button.addEventListener('click', function () { showElement(element, button); });
      grid.appendChild(button);
    });
  }

  function detailItem(label, value) {
    var item = document.createElement('div');
    item.className = 'detail-item';
    var val = document.createElement('div');
    val.className = 'val';
    val.textContent = value;
    var lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.textContent = label;
    item.append(val, lbl);
    return item;
  }

  function showElement(element, button) {
    selected = element;
    document.querySelectorAll('.periodic-element[aria-pressed="true"]').forEach(function (item) { item.removeAttribute('aria-pressed'); });
    button.setAttribute('aria-pressed', 'true');
    byId('detailSym').textContent = element.s;
    byId('detailName').textContent = element.n;
    byId('detailMeta').textContent = 'Atomic number ' + element.z + ' · Period ' + element.p + ' · Group ' + element.g;
    byId('detailBadges').replaceChildren();
    var badge = document.createElement('span');
    badge.className = 'state-badge';
    badge.textContent = engine.categoryLabel(element.c);
    byId('detailBadges').appendChild(badge);
    var weight = engine.atomicWeight(element);
    var grid = byId('detailGrid');
    grid.replaceChildren(
      detailItem('Atomic number', String(element.z)),
      detailItem('Abridged atomic weight', weight.value),
      detailItem('Period', String(element.p)),
      detailItem('Group', String(element.g)),
      detailItem('Category', engine.categoryLabel(element.c)),
      detailItem('State at 25 °C', engine.stateAt25C(element))
    );
    byId('weightNote').textContent = weight.kind + '. Source: CIAAW 2024. Elements without a standard atomic weight are labelled instead of being given an unqualified isotope mass number.';
    byId('detailCard').classList.add('show');
    byId('detailStatus').textContent = '';
    byId('detailName').focus();
  }

  function currentReport() {
    return selected ? engine.report(selected) : '';
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    area.remove();
    return ok;
  }

  function copyElement() {
    var text = currentReport();
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        byId('detailStatus').textContent = 'Element notes copied.';
      }).catch(function () {
        byId('detailStatus').textContent = fallbackCopy(text) ? 'Element notes copied.' : 'Copy failed. Download TXT instead.';
      });
    } else {
      byId('detailStatus').textContent = fallbackCopy(text) ? 'Element notes copied.' : 'Copy failed. Download TXT instead.';
    }
  }

  function downloadElement() {
    var text = currentReport();
    if (!text) return;
    var blob = new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'periodic-table-' + selected.n.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    byId('detailStatus').textContent = 'Element notes downloaded.';
  }

  function printElement() {
    if (!selected) return;
    window.print();
  }

  function openQuiz() {
    lastFocused = document.activeElement;
    quiz.correct = 0;
    quiz.total = 0;
    quiz.answered = false;
    byId('quizScore').textContent = '0 / 0 correct';
    byId('quizModal').classList.add('show');
    byId('quizModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    nextQuestion();
    byId('quizClose').focus();
  }

  function closeQuiz() {
    clearTimeout(quiz.timer);
    byId('quizModal').classList.remove('show');
    byId('quizModal').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function setQuizType(type, button) {
    quiz.type = type;
    quiz.correct = 0;
    quiz.total = 0;
    document.querySelectorAll('[data-quiz-type]').forEach(function (item) {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    byId('quizScore').textContent = '0 / 0 correct';
    nextQuestion();
  }

  function nextQuestion() {
    quiz.answered = false;
    quiz.target = elements[Math.floor(Math.random() * elements.length)];
    var prompt = byId('quizPrompt');
    var big = byId('quizBig');
    if (quiz.type === 'sym2name') {
      prompt.textContent = 'Which element has this symbol?';
      big.textContent = quiz.target.s;
    } else if (quiz.type === 'name2sym') {
      prompt.textContent = 'What is this element’s symbol?';
      big.textContent = quiz.target.n;
    } else {
      prompt.textContent = 'Which element has this atomic number?';
      big.textContent = String(quiz.target.z);
    }
    byId('quizHint').textContent = quiz.type === 'name2sym' ? 'Atomic number ' + quiz.target.z : 'Period ' + quiz.target.p + ', group ' + quiz.target.g;
    var options = [quiz.target];
    while (options.length < 4) {
      var candidate = elements[Math.floor(Math.random() * elements.length)];
      if (!options.some(function (item) { return item.z === candidate.z; })) options.push(candidate);
    }
    options.sort(function () { return Math.random() - .5; });
    var wrapper = byId('quizOptions');
    wrapper.replaceChildren();
    options.forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-opt';
      button.textContent = quiz.type === 'name2sym' ? option.s : option.n;
      button.addEventListener('click', function () { answer(button, option.z === quiz.target.z); });
      wrapper.appendChild(button);
    });
  }

  function answer(button, correct) {
    if (quiz.answered) return;
    quiz.answered = true;
    quiz.total += 1;
    if (correct) quiz.correct += 1;
    button.classList.add(correct ? 'correct' : 'wrong');
    byId('quizOptions').querySelectorAll('button').forEach(function (option) {
      option.disabled = true;
      var expected = quiz.type === 'name2sym' ? quiz.target.s : quiz.target.n;
      if (option.textContent === expected) option.classList.add('correct');
    });
    byId('quizScore').textContent = quiz.correct + ' / ' + quiz.total + ' correct';
    quiz.timer = setTimeout(nextQuestion, 900);
  }

  function trapQuizFocus(event) {
    var focusable = Array.from(byId('quizModal').querySelectorAll('button:not([disabled])'));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
