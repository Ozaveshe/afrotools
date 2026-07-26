(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.dueDateRangeEngine;
  var form = document.getElementById('date-range-form');
  var dateInput = document.getElementById('estimate-date');
  var cycleInput = document.getElementById('cycle-length');
  var embryoInput = document.getElementById('embryo-age');
  var cycleField = document.getElementById('cycle-length-field');
  var embryoField = document.getElementById('embryo-age-field');
  var dateLabel = document.getElementById('estimate-date-label');
  var errorBox = document.getElementById('form-error');
  var results = document.getElementById('date-range-results');
  var lastResult = null;

  function todayIso() {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    var parts = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  function method() {
    return form.elements.method.value;
  }

  function syncMethod() {
    var isLmp = method() === 'lmp';
    cycleField.hidden = !isLmp;
    cycleInput.disabled = !isLmp;
    embryoField.hidden = isLmp;
    embryoInput.disabled = isLmp;
    dateLabel.textContent = isLmp
      ? 'First day of your last menstrual period'
      : 'Embryo transfer date from your fertility clinic';
    errorBox.textContent = '';
    results.hidden = true;
    lastResult = null;
    setStatus('');
  }

  function focusInvalidField(field) {
    if (field === 'cycleLength') return cycleInput.focus();
    if (field === 'embryoAge') return embryoInput.focus();
    if (field === 'method') {
      var methodInput = form.querySelector('input[name="method"]');
      if (methodInput) return methodInput.focus();
    }
    dateInput.focus();
  }

  function render(result) {
    lastResult = result;
    document.getElementById('estimated-due-date').textContent = formatDate(result.dueDate);
    document.getElementById('week-37-date').textContent = formatDate(result.week37Date);
    document.getElementById('week-42-date').textContent = formatDate(result.week42Date);
    document.getElementById('method-summary').textContent = result.methodSummary;
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function calculate(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The date engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.calculate({
      method: method(),
      date: dateInput.value,
      cycleLength: cycleInput.value,
      embryoAge: embryoInput.value,
      asOf: todayIso()
    });
    if (!result.valid) {
      results.hidden = true;
      lastResult = null;
      setStatus('');
      errorBox.textContent = result.error;
      focusInvalidField(result.field);
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function resultText(result) {
    return [
      'AFROTOOLS PREGNANCY DATE RANGE ESTIMATE',
      '',
      'Entered date: ' + formatDate(result.inputDate),
      'Conventional estimated due date: ' + formatDate(result.dueDate),
      '37-week date: ' + formatDate(result.week37Date),
      '42-week date: ' + formatDate(result.week42Date),
      '',
      'Method: ' + result.methodSummary,
      '',
      'This is a date estimate, not confirmation of pregnancy, clinical dating, or a prediction that waiting is safe.',
      'Review the estimate and any symptoms with a maternity or fertility professional.',
      'Sources: NHS due-date calculator; ACOG Methods for Estimating the Due Date.',
      'Sources checked: 26 July 2026.',
      'Created locally. No account, email, upload, analytics or saved browser record.'
    ].join('\n');
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
    if (!lastResult) return setStatus('Calculate a range before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools pregnancy date range estimate' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(resultText(lastResult), 500);
      var y = 54;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 54;
        }
        pdf.text(line, 48, y);
        y += 14;
      });
      pdf.save('afrotools-pregnancy-date-range.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', calculate);
  form.querySelectorAll('input[name="method"]').forEach(function (radio) {
    radio.addEventListener('change', syncMethod);
  });
  dateInput.max = todayIso();

  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Calculate a range before exporting.');
    downloadBlob(
      'afrotools-pregnancy-date-range.txt',
      'text/plain;charset=utf-8',
      resultText(lastResult)
    );
    setStatus('TXT downloaded locally.');
  });

  document.getElementById('download-pdf').addEventListener('click', downloadPdf);

  document.getElementById('clear-result').addEventListener('click', function () {
    form.reset();
    syncMethod();
    dateInput.value = '';
    results.hidden = true;
    lastResult = null;
    setStatus('Entered date and current result cleared.');
    dateInput.focus();
  });

  window.AfroDueDateRange = {
    getResult: function () { return lastResult; },
    getOverflowDetails: function () {
      return Array.from(document.querySelectorAll('main *')).filter(function (element) {
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

  syncMethod();
})();
