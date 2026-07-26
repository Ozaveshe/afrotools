(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.fractionEngine;
  if (!engine) return;

  var history = [];
  var current = null;
  var ids = {
    'First whole number': 'w1',
    'First numerator': 'n1',
    'First denominator': 'd1',
    'Second whole number': 'w2',
    'Second numerator': 'n2',
    'Second denominator': 'd2',
    'Operation': 'op'
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message, isError) {
    var status = byId('fractionStatus');
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function readInput() {
    return {
      left: { whole: byId('w1').value, numerator: byId('n1').value, denominator: byId('d1').value },
      right: { whole: byId('w2').value, numerator: byId('n2').value, denominator: byId('d2').value },
      operation: byId('op').value
    };
  }

  function clearInvalid() {
    document.querySelectorAll('.fraction-row [aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
  }

  function markInvalid(fieldName) {
    var field = byId(ids[fieldName]);
    if (!field) return;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }

  function fractionNode(fraction, mixed) {
    var span = document.createElement('span');
    span.className = 'result-fraction-text';
    span.textContent = mixed || fraction.text;
    return span;
  }

  function renderResult(result) {
    byId('resFrac').replaceChildren(fractionNode(result.raw));
    byId('resSimp').replaceChildren(fractionNode(result.simplified));
    byId('resMixed').replaceChildren(fractionNode(result.simplified, result.mixed));
    byId('resDec').textContent = (result.decimal.approximate ? '\u2248 ' : '') + result.decimal.text;
    byId('resPct').textContent = (result.percentage.approximate ? '\u2248 ' : '') + result.percentage.text;

    var steps = byId('stepsContent');
    steps.replaceChildren();
    result.steps.forEach(function (text, index) {
      var item = document.createElement('li');
      var marker = document.createElement('span');
      marker.className = 'step-num';
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = String(index + 1);
      item.append(marker, document.createTextNode(text));
      steps.appendChild(item);
    });

    byId('resultBox').hidden = false;
    byId('stepsBox').hidden = false;
  }

  function renderHistory() {
    var list = byId('histList');
    list.replaceChildren();
    if (!history.length) {
      var empty = document.createElement('p');
      empty.className = 'empty-hist';
      empty.textContent = 'Calculations from this browser tab will appear here.';
      list.appendChild(empty);
      return;
    }
    history.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'hist-item';
      var expression = document.createElement('span');
      expression.className = 'hist-expr';
      expression.textContent = entry.expression;
      var result = document.createElement('span');
      result.className = 'hist-result';
      result.textContent = entry.result;
      row.append(expression, result);
      list.appendChild(row);
    });
  }

  function calculate() {
    clearInvalid();
    var result = engine.calculate(readInput());
    if (!result.ok) {
      current = null;
      byId('resultBox').hidden = true;
      byId('stepsBox').hidden = true;
      setStatus(result.error, true);
      markInvalid(result.field);
      return;
    }
    current = result;
    renderResult(result);
    history.unshift({ expression: result.expression, result: result.simplified.text });
    history = history.slice(0, 20);
    renderHistory();
    setStatus('Solution calculated. Exact fractions are shown before rounded decimal forms.', false);
  }

  function reportText() {
    if (!current) return '';
    return [
      'Fraction solution - AfroTools',
      '',
      'Expression: ' + current.expression,
      'Unsimplified result: ' + current.raw.text,
      'Simplified result: ' + current.simplified.text,
      'Mixed number: ' + current.mixed,
      'Decimal: ' + (current.decimal.approximate ? 'approximately ' : '') + current.decimal.text,
      'Percentage: ' + (current.percentage.approximate ? 'approximately ' : '') + current.percentage.text,
      '',
      'Working:',
      current.steps.map(function (step, index) { return String(index + 1) + '. ' + step; }).join('\n'),
      '',
      'Method note: decimal and percentage displays are rounded when the exact value repeats.',
      'Check the format your teacher, exam board, or assignment requires.'
    ].join('\n');
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'copy-fallback';
    document.body.appendChild(textarea);
    textarea.select();
    var copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  function copyReport() {
    var text = reportText();
    if (!text) {
      setStatus('Calculate a fraction before copying.', true);
      return;
    }
    var copy = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.resolve(fallbackCopy(text));
    copy.then(function (value) {
      setStatus(value === false ? 'Copy failed. Download the TXT solution instead.' : 'Solution copied.', value === false);
    }).catch(function () {
      var copied = fallbackCopy(text);
      setStatus(copied ? 'Solution copied.' : 'Copy failed. Download the TXT solution instead.', !copied);
    });
  }

  function downloadReport() {
    var text = reportText();
    if (!text) {
      setStatus('Calculate a fraction before downloading.', true);
      return;
    }
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'fraction-solution-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('TXT solution downloaded.', false);
  }

  function printReport() {
    if (!current) {
      setStatus('Calculate a fraction before printing or saving a PDF.', true);
      return;
    }
    setStatus('Opening the print dialog. Choose Save as PDF to create a PDF.', false);
    window.print();
  }

  function clearInputs() {
    ['w1', 'n1', 'd1', 'w2', 'n2', 'd2'].forEach(function (id) { byId(id).value = ''; });
    clearInvalid();
    current = null;
    byId('resultBox').hidden = true;
    byId('stepsBox').hidden = true;
    setStatus('Inputs and visible result cleared. Session history is unchanged.', false);
    byId('n1').focus();
  }

  byId('calculateFraction').addEventListener('click', calculate);
  byId('copyFractionReport').addEventListener('click', copyReport);
  byId('downloadFractionReport').addEventListener('click', downloadReport);
  byId('printFractionReport').addEventListener('click', printReport);
  byId('clearFractionInputs').addEventListener('click', clearInputs);
  byId('clearFractionHistory').addEventListener('click', function () {
    history = [];
    renderHistory();
    setStatus('Session history cleared.', false);
  });
  document.querySelectorAll('.fraction-row input').forEach(function (input) {
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') calculate();
    });
  });
  window.AFROTOOLS_FRACTION_VIP = true;
})();
