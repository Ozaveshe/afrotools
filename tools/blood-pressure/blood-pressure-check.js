(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.bloodPressureCheckEngine;
  var form = document.getElementById('blood-pressure-form');
  var results = document.getElementById('blood-pressure-results');
  var errorBox = document.getElementById('form-error');
  var lastResult = null;
  var themeButton = document.getElementById('afro-theme-fallback-toggle');

  function syncThemePressedState() {
    if (!themeButton || !window.AfroTools || !window.AfroTools.darkMode) return;
    themeButton.setAttribute('aria-pressed', String(window.AfroTools.darkMode.isDark()));
  }

  if (themeButton && window.AfroTools && window.AfroTools.darkMode) {
    themeButton.addEventListener('click', function () {
      window.AfroTools.darkMode.toggle();
      syncThemePressedState();
    });
    document.addEventListener('afrotools:theme-change', syncThemePressedState);
    syncThemePressedState();
  }

  function readInput() {
    return {
      context: document.getElementById('health-context').value,
      systolic1: document.getElementById('systolic-1').value,
      diastolic1: document.getElementById('diastolic-1').value,
      systolic2: document.getElementById('systolic-2').value,
      diastolic2: document.getElementById('diastolic-2').value,
      rested: document.getElementById('rested').checked,
      positioned: document.getElementById('positioned').checked,
      cuff: document.getElementById('cuff').checked,
      quiet: document.getElementById('quiet').checked,
      urgentSymptoms: document.getElementById('urgent-symptoms').checked
    };
  }

  function formatReading(reading) {
    return reading.systolic + '/' + reading.diastolic + ' mmHg';
  }

  function render(result) {
    lastResult = result;
    document.getElementById('reading-one').textContent = formatReading(result.first);
    document.getElementById('reading-two').textContent = formatReading(result.second);
    document.getElementById('reading-average').textContent = formatReading(result.average);
    document.getElementById('result-priority').textContent = result.priority;
    document.getElementById('result-priority').dataset.band = result.band;
    document.getElementById('result-action').dataset.band = result.band;
    document.getElementById('action-title').textContent = result.title;
    document.getElementById('action-text').textContent = result.action;
    document.getElementById('technique-note').textContent = result.techniqueComplete
      ? 'All four measurement-setup checks were confirmed.'
      : result.techniqueCount + ' of 4 measurement-setup checks were confirmed. Technique can affect a reading, but it must not be used to dismiss warning symptoms or a high result.';
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local reading engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.evaluate(readInput());
    if (!result.valid) {
      errorBox.textContent = result.error;
      document.getElementById('systolic-1').focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function exportText(result) {
    return [
      'AFROTOOLS BLOOD PRESSURE MEASUREMENT CHECK',
      '',
      'Context: ' + result.contextLabel,
      'Reading 1: ' + formatReading(result.first),
      'Reading 2: ' + formatReading(result.second),
      'Arithmetic average: ' + formatReading(result.average),
      'Measurement setup confirmed: ' + result.techniqueCount + ' of 4 checks',
      'Urgent symptoms selected: ' + (result.urgentSymptoms ? 'Yes' : 'No'),
      '',
      'Review priority: ' + result.priority,
      result.title,
      result.action,
      '',
      result.boundary,
      'An arithmetic average must not hide a single high reading. The card uses the highest reading for most safety prompts.',
      'General adult context: WHO diagnosis requires qualifying measurements on two different days.',
      'Pregnancy or first 6 weeks after birth: 140/90 prompts maternity contact; 160/110 is a severe boundary needing urgent assessment.',
      'Symptoms can require emergency help at any number. Follow your clinician or maternity team plan.',
      '',
      'Sources: WHO hypertension; American Heart Association home monitoring; NICE NG133; ACOG postpartum preeclampsia; NHS pre-eclampsia.',
      'Sources checked: 26 July 2026.',
      'Created locally. No account, email, upload, analytics or saved browser history.',
      'This export contains sensitive health data. Review it before sharing.'
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
    if (!lastResult) return setStatus('Review readings before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools blood pressure measurement check' });
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
      pdf.save('afrotools-blood-pressure-measurement-check.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', submit);
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Review readings before exporting.');
    downloadBlob('afrotools-blood-pressure-measurement-check.txt', 'text/plain;charset=utf-8', exportText(lastResult));
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-check').addEventListener('click', function () {
    form.reset();
    results.hidden = true;
    lastResult = null;
    errorBox.textContent = '';
    setStatus('Readings and current result cleared.');
    document.getElementById('health-context').focus();
  });

  window.AfroBloodPressureCheck = {
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
