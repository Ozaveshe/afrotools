(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.romanNumerals;
  if (!engine) return;

  var currentResult = null;
  var batchRows = [];
  var quiz = { number: 0, direction: 'toRoman', score: 0, total: 0, streak: 0, answered: false };

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(id, message, isError) {
    var element = byId(id);
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('is-error', Boolean(isError));
  }

  function writeClipboard(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      return;
    }
    fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'clipboard-fallback';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      if (document.execCommand('copy') && done) done();
    } catch (error) {
      setStatus('resultStatus', 'Copy was blocked. Select the conversion and copy it manually.', true);
    }
    textarea.remove();
  }

  function downloadText(filename, text) {
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function formatSteps(result) {
    if (!result || !result.ok || !result.steps.length) return '';
    return result.steps.map(function (step) {
      return step.value + ' \u2192 ' + step.symbols;
    }).join('  +  ');
  }

  function resultReport() {
    if (!currentResult || !currentResult.ok) return '';
    return [
      'Roman numeral conversion - AfroTools',
      currentResult.equation,
      'Working: ' + formatSteps(currentResult),
      '',
      'Convention: modern conventional Roman numerals from 1 to 3999.',
      'Not supported: zero, negatives, fractions, non-canonical variants or overline notation.'
    ].join('\n');
  }

  function renderConversion() {
    var raw = byId('input').value;
    var result = engine.convert(raw);
    var resultBox = byId('resultBox');
    var label = byId('detectLabel');
    var working = byId('resultWorking');
    currentResult = result.ok ? result : null;

    if (result.empty) {
      resultBox.hidden = true;
      label.hidden = true;
      setStatus('resultStatus', '', false);
      return;
    }

    resultBox.hidden = false;
    label.hidden = false;
    label.textContent = result.inputType === 'roman' ? 'Roman numeral detected' :
      result.inputType === 'decimal' ? 'Whole number detected' : 'Input needs attention';
    byId('resultValue').textContent = result.ok ? result.output : 'Not converted';
    byId('resultSub').textContent = result.ok ? result.equation : result.message;
    working.textContent = result.ok ? 'Working: ' + formatSteps(result) : '';
    setStatus('resultStatus', result.ok ? '' : result.message, !result.ok);
  }

  function switchTab(tabName) {
    ['convert', 'batch', 'quiz'].forEach(function (name) {
      var selected = name === tabName;
      var button = byId(name + 'TabButton');
      var panel = byId(name + 'Tab');
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
    if (tabName === 'quiz' && !quiz.number) newQuiz();
  }

  function copyResult() {
    if (!currentResult) {
      setStatus('resultStatus', 'Convert a valid value first.', true);
      return;
    }
    writeClipboard(currentResult.equation, function () {
      setStatus('resultStatus', 'Conversion copied.', false);
    });
  }

  function swapResult() {
    if (!currentResult) {
      setStatus('resultStatus', 'Convert a valid value first.', true);
      return;
    }
    byId('input').value = currentResult.output;
    renderConversion();
    byId('input').focus();
  }

  function downloadResult() {
    var report = resultReport();
    if (!report) {
      setStatus('resultStatus', 'Convert a valid value first.', true);
      return;
    }
    downloadText('roman-numeral-conversion.txt', report);
    setStatus('resultStatus', 'TXT worksheet downloaded.', false);
  }

  function printResult() {
    if (!currentResult) {
      setStatus('resultStatus', 'Convert a valid value first.', true);
      return;
    }
    document.body.classList.add('roman-print-result');
    window.print();
    setTimeout(function () { document.body.classList.remove('roman-print-result'); }, 100);
    setStatus('resultStatus', 'Print dialog opened. Choose Save as PDF to make a PDF.', false);
  }

  function renderBatch() {
    var batch = engine.convertBatch(byId('batchInput').value);
    var container = byId('batchResults');
    container.replaceChildren();
    batchRows = batch.rows;

    batch.rows.forEach(function (row) {
      var item = document.createElement('div');
      var input = document.createElement('span');
      var output = document.createElement('strong');
      item.className = 'batch-row';
      input.textContent = row.input;
      output.textContent = row.result.ok ? row.result.output : 'Invalid';
      if (!row.result.ok) output.className = 'batch-error';
      item.append(input, output);
      container.appendChild(item);
    });

    var invalid = batch.rows.filter(function (row) { return !row.result.ok; }).length;
    var message = batch.rows.length
      ? batch.rows.length + ' row' + (batch.rows.length === 1 ? '' : 's') + ' checked; ' + invalid + ' invalid.'
      : 'Add one value per line first.';
    if (batch.truncated) message += ' Only the first ' + batch.limit + ' non-empty rows were processed.';
    setStatus('batchStatus', message, invalid > 0 || batch.truncated);
  }

  function batchText() {
    return batchRows.map(function (row) {
      return row.input + ' = ' + (row.result.ok ? row.result.output : 'Invalid');
    }).join('\n');
  }

  function copyBatch() {
    var text = batchText();
    if (!text) {
      setStatus('batchStatus', 'Convert the batch first.', true);
      return;
    }
    writeClipboard(text, function () { setStatus('batchStatus', 'Batch results copied.', false); });
  }

  function downloadBatch() {
    var text = batchText();
    if (!text) {
      setStatus('batchStatus', 'Convert the batch first.', true);
      return;
    }
    downloadText('roman-numeral-batch-results.txt', text);
    setStatus('batchStatus', 'Batch TXT downloaded.', false);
  }

  function quizRange() {
    var difficulty = byId('quizDifficulty').value;
    if (difficulty === 'easy') return [1, 99];
    if (difficulty === 'medium') return [1, 499];
    if (difficulty === 'large') return [1000, 3999];
    return [1, 3999];
  }

  function newQuiz() {
    var range = quizRange();
    quiz.number = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    quiz.direction = Math.random() >= 0.5 ? 'toRoman' : 'toDecimal';
    quiz.answered = false;
    byId('quizDirection').textContent = quiz.direction === 'toRoman' ? 'Convert to Roman' : 'Convert to a whole number';
    byId('quizPrompt').textContent = quiz.direction === 'toRoman' ? String(quiz.number) : engine.toRoman(quiz.number);
    byId('quizAnswer').value = '';
    byId('quizAnswer').disabled = false;
    byId('checkQuizButton').disabled = false;
    byId('nextQuizButton').hidden = true;
    byId('quizFeedback').textContent = '';
    byId('quizFeedback').className = 'quiz-feedback';
    byId('quizAnswer').focus();
  }

  function checkQuiz() {
    var answer = byId('quizAnswer').value.trim();
    if (!answer || quiz.answered) return;
    quiz.answered = true;
    quiz.total += 1;
    var correct = engine.checkQuizAnswer(quiz.direction, quiz.number, answer);
    if (correct) {
      quiz.score += 1;
      quiz.streak += 1;
    } else {
      quiz.streak = 0;
    }

    var feedback = byId('quizFeedback');
    var expected = quiz.direction === 'toRoman' ? engine.toRoman(quiz.number) : String(quiz.number);
    feedback.textContent = correct ? 'Correct.' : 'Not quite. The answer is ' + expected + '.';
    feedback.className = 'quiz-feedback ' + (correct ? 'correct' : 'wrong');
    byId('quizScore').textContent = quiz.score;
    byId('quizTotal').textContent = quiz.total;
    byId('quizStreak').textContent = quiz.streak;
    byId('quizAnswer').disabled = true;
    byId('checkQuizButton').disabled = true;
    byId('nextQuizButton').hidden = false;
    byId('nextQuizButton').focus();
  }

  function bindTabs() {
    document.querySelectorAll('[role="tab"]').forEach(function (button) {
      button.addEventListener('click', function () { switchTab(button.dataset.tab); });
      button.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        var tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        var index = tabs.indexOf(button);
        var next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
        tabs[next].focus();
        switchTab(tabs[next].dataset.tab);
      });
    });
  }

  function bindFaq() {
    document.querySelectorAll('.faq-item[role="button"]').forEach(function (item) {
      function toggle() {
        var isOpen = item.classList.toggle('open');
        item.setAttribute('aria-expanded', String(isOpen));
      }
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle();
      });
    });
  }

  function init() {
    bindTabs();
    bindFaq();
    byId('input').addEventListener('input', renderConversion);
    byId('copyResultButton').addEventListener('click', copyResult);
    byId('swapResultButton').addEventListener('click', swapResult);
    byId('downloadResultButton').addEventListener('click', downloadResult);
    byId('printResultButton').addEventListener('click', printResult);
    byId('batchConvertButton').addEventListener('click', renderBatch);
    byId('copyBatchButton').addEventListener('click', copyBatch);
    byId('downloadBatchButton').addEventListener('click', downloadBatch);
    byId('quizDifficulty').addEventListener('change', newQuiz);
    byId('checkQuizButton').addEventListener('click', checkQuiz);
    byId('nextQuizButton').addEventListener('click', newQuiz);
    byId('skipQuizButton').addEventListener('click', newQuiz);
    byId('quizAnswer').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') checkQuiz();
    });
    window.AFROTOOLS_ROMAN_NUMERALS_VIP = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
