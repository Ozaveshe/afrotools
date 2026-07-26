(function () {
  'use strict';
  var engine = window.HaemoglobinResultVerificationEngine;
  var form = document.getElementById('verification-form');
  if (!engine || !form) return;

  var results = document.getElementById('verification-results');
  var title = document.getElementById('verification-title');
  var error = document.getElementById('form-error');
  var status = document.getElementById('action-status');
  var currentResult = null;

  function text(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderList(id, items) {
    var list = document.getElementById(id);
    list.replaceChildren();
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function render(result) {
    currentResult = result;
    text('notation-label', result.notationLabel);
    text('notation-explanation', result.explanation);
    text('method-value', result.testMethodLabel);
    text('date-value', result.testDate);
    text('confirmation-value', result.confirmationStatusLabel);
    var flagsPanel = document.getElementById('flags-panel');
    flagsPanel.hidden = result.flags.length === 0;
    renderList('flags-list', result.flags);
    renderList('questions-list', result.questions);
    results.hidden = false;
    title.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    error.hidden = true;
    status.textContent = '';
    var result = engine.verify({
      reportedResult: document.getElementById('reported-result').value,
      testMethod: document.getElementById('test-method').value,
      testDate: document.getElementById('test-date').value,
      confirmationStatus: document.getElementById('confirmation-status').value
    });
    if (!result.ok) {
      error.textContent = result.error;
      error.hidden = false;
      results.hidden = true;
      currentResult = null;
      error.focus();
      return;
    }
    render(result);
  });

  document.getElementById('download-result').addEventListener('click', function () {
    if (!currentResult) return;
    var blob = new Blob([engine.toText(currentResult)], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'haemoglobin-result-verification-checklist.txt';
    link.dataset.noPdfGate = 'true';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = 'Verification checklist downloaded locally.';
  });

  document.getElementById('print-result').addEventListener('click', function () {
    if (!currentResult) return;
    status.textContent = 'Opening your browser print dialog. Choose Save as PDF for a local PDF.';
    window.print();
  });

  document.getElementById('reset-result').addEventListener('click', function () {
    form.reset();
    results.hidden = true;
    currentResult = null;
    error.hidden = true;
    status.textContent = '';
    document.getElementById('reported-result').focus();
  });
}());
