(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.birthOptionsEngine;
  var form = document.getElementById('birth-options-form');
  var errorBox = document.getElementById('form-error');
  var results = document.getElementById('birth-options-results');
  var lastResult = null;

  function checkedTopics() {
    return Array.from(form.querySelectorAll('input[name="topic"]:checked'))
      .map(function (input) { return input.value; });
  }

  function fillList(id, items) {
    var list = document.getElementById(id);
    list.replaceChildren();
    items.forEach(function (question) {
      var item = document.createElement('li');
      item.textContent = question;
      list.appendChild(item);
    });
  }

  function render(result) {
    lastResult = result;
    document.getElementById('context-label').textContent = result.contextLabel;
    fillList('question-list', result.questions);
    fillList('cost-questions', result.costQuestions);
    document.getElementById('cost-box').hidden = result.costQuestions.length === 0;
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local question engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.build({
      context: document.getElementById('discussion-context').value,
      topics: checkedTopics(),
      costStatus: document.getElementById('cost-status').value
    });
    if (!result.valid) {
      errorBox.textContent = result.error;
      form.querySelector('input[name="topic"]').focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function exportText(result) {
    return [
      'AFROTOOLS BIRTH OPTIONS QUESTION CARD',
      '',
      'Conversation context: ' + result.contextLabel,
      '',
      'Questions for the maternity team:',
      result.questions.map(function (question, index) { return (index + 1) + '. ' + question; }).join('\n'),
      result.costQuestions.length ? '\nSeparate cost questions:\n' +
        result.costQuestions.map(function (question) { return '- ' + question; }).join('\n') : '',
      '',
      result.boundary,
      'Both vaginal and caesarean birth can have benefits and risks. Individual circumstances and informed preferences matter.',
      'Do not delay urgent maternity care to complete a worksheet or compare costs.',
      'Sources: WHO recommendations on unnecessary caesarean sections; NICE caesarean birth recommendations and public information.',
      'Sources checked: 26 July 2026.',
      'Created locally. No account, email, health-history upload, analytics or saved browser record.'
    ].filter(Boolean).join('\n');
  }

  function setStatus(message) {
    document.getElementById('export-status').textContent = message;
  }

  function downloadBlob(filename, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function ensurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.dataset.localJspdf = 'true';
      script.onload = function () { resolve(window.jspdf.jsPDF); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function downloadPdf() {
    if (!lastResult) return setStatus('Build a question card before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools birth options question card' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(exportText(lastResult), 500);
      var y = 54;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 54;
        }
        pdf.text(line, 48, y);
        y += 14;
      });
      pdf.save('afrotools-birth-options-question-card.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', submit);
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Build a question card before exporting.');
    downloadBlob('afrotools-birth-options-question-card.txt', 'text/plain;charset=utf-8', exportText(lastResult));
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-card').addEventListener('click', function () {
    form.reset();
    results.hidden = true;
    lastResult = null;
    setStatus('Selections and current card cleared.');
    document.getElementById('discussion-context').focus();
  });

  window.AfroBirthOptions = {
    getResult: function () { return lastResult; },
    getOverflowDetails: function () {
      return Array.from(document.querySelectorAll('body *')).filter(function (element) {
        var rect = element.getBoundingClientRect();
        return rect.width > document.documentElement.clientWidth + 1 ||
          rect.right > document.documentElement.clientWidth + 1 ||
          rect.left < -1;
      }).map(function (element) {
        var rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id,
          className: String(element.className || ''),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      }).slice(0, 12);
    }
  };
})();
