(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.cycleWindowEngine;
  var form = document.getElementById('cycle-window-form');
  var dateInput = document.getElementById('last-period-date');
  var shortestInput = document.getElementById('shortest-cycle');
  var longestInput = document.getElementById('longest-cycle');
  var errorBox = document.getElementById('form-error');
  var results = document.getElementById('cycle-window-results');
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

  function rangeText(start, end) {
    return formatDate(start) + ' to ' + formatDate(end);
  }

  function render(result) {
    lastResult = result;
    document.getElementById('next-period-window').textContent =
      rangeText(result.nextPeriodStart, result.nextPeriodEnd);
    document.getElementById('ovulation-window').textContent =
      rangeText(result.ovulationStart, result.ovulationEnd);
    document.getElementById('pregnancy-possible-window').textContent =
      rangeText(result.pregnancyPossibleStart, result.pregnancyPossibleEnd);
    document.getElementById('uncertainty-copy').textContent = result.uncertaintyCopy;
    document.getElementById('uncertainty-badge').textContent =
      result.uncertainty === 'low' ? 'Low-confidence estimate' :
        result.uncertainty === 'very-low' ? 'Very low-confidence estimate' :
          'Extremely uncertain estimate';
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function calculate(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The cycle engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.calculate({
      lastPeriodDate: dateInput.value,
      shortestCycle: shortestInput.value,
      longestCycle: longestInput.value,
      asOf: todayIso()
    });
    if (!result.valid) {
      errorBox.textContent = result.error;
      var target = result.field === 'shortestCycle' ? shortestInput :
        result.field === 'longestCycle' ? longestInput : dateInput;
      target.focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function exportText(result) {
    return [
      'AFROTOOLS CYCLE WINDOW ESTIMATE',
      '',
      'Most recent period started: ' + formatDate(result.inputDate),
      'Entered cycle range: ' + result.shortestCycle + ' to ' + result.longestCycle + ' days',
      'Next-period estimate: ' + rangeText(result.nextPeriodStart, result.nextPeriodEnd),
      'Possible ovulation estimate: ' + rangeText(result.ovulationStart, result.ovulationEnd),
      'Pregnancy may be possible within this wider span: ' +
        rangeText(result.pregnancyPossibleStart, result.pregnancyPossibleEnd),
      '',
      result.uncertaintyCopy,
      'Calendar dates cannot confirm ovulation, fertility, infertility, pregnancy, or contraceptive safety.',
      'Do not treat dates outside the span as safe for unprotected sex.',
      'Sources: ACOG fertility awareness methods; NHS periods guidance; CDC contraception methods.',
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
    if (!lastResult) return setStatus('Build an estimate before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools cycle window estimate' });
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
      pdf.save('afrotools-cycle-window-estimate.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', calculate);
  dateInput.max = todayIso();

  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Build an estimate before exporting.');
    downloadBlob(
      'afrotools-cycle-window-estimate.txt',
      'text/plain;charset=utf-8',
      exportText(lastResult)
    );
    setStatus('TXT downloaded locally.');
  });

  document.getElementById('download-pdf').addEventListener('click', downloadPdf);

  document.getElementById('clear-result').addEventListener('click', function () {
    form.reset();
    dateInput.value = '';
    results.hidden = true;
    lastResult = null;
    setStatus('Entered dates and current estimate cleared.');
    dateInput.focus();
  });

  window.AfroCycleWindow = {
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
})();
