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
  function isFrenchReport(){return /^fr(?:-|$)/i.test(document.documentElement.lang||'')||/^\/fr\//.test(location.pathname);}
  function invalidateResult(){lastResult=null;results.hidden=true;errorBox.textContent='';setStatus('');}
  form.addEventListener('input',invalidateResult);
  form.addEventListener('change',invalidateResult);
  function frenchDateRangeReport(result) {
  function date(iso) {
    var parts=iso.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(parts[0],parts[1]-1,parts[2]));
  }
  var method=result.method==='lmp'
    ? 'Calcul à partir du premier jour des dernières règles sur une base de 280 jours, ajustée de '+(result.cycleLength-28)+' jour(s) pour le cycle de '+result.cycleLength+' jours saisi.'
    : 'Calcul à partir d’un transfert documenté d’embryon à J'+result.embryoAge+', avec le décalage ACOG de '+(result.embryoAge===3?263:261)+' jours.';
  return [
    'AFROTOOLS — ESTIMATION D’UNE PLAGE DE DATES DE GROSSESSE','',
    'Date saisie : '+date(result.inputDate),
    'Date prévue d’accouchement selon la convention : '+date(result.dueDate),
    'Date à 37 semaines : '+date(result.week37Date),
    'Date à 42 semaines : '+date(result.week42Date),'',
    'Méthode : '+method,'',
    'Il s’agit d’une estimation de dates, pas d’une confirmation de grossesse, d’une datation clinique ni d’une indication qu’il est sans danger d’attendre.',
    'Discutez de cette estimation et de tout symptôme avec un professionnel de la maternité ou de la fertilité.',
    'Sources : calculateur de date prévue d’accouchement du NHS ; ACOG, Methods for Estimating the Due Date.',
    'Sources vérifiées le 26 juillet 2026.',
    'Créé sur cet appareil. Aucun compte, aucune adresse e-mail ni aucun téléversement ne sont nécessaires pour créer ce rapport.'
  ].join('\n');
}


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
    setStatus('');
    render(result);
  }

  function resultText(result) {
    if(isFrenchReport())return frenchDateRangeReport(result);
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
      'Created on this device. No account, email address or upload is required to create this report.'
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
    if (!lastResult) return setStatus(isFrenchReport()?"Calculez une plage de dates avant d’exporter.":"Calculate a range before exporting.");
    var exportResult=lastResult;
    setStatus(isFrenchReport()?"Préparation du PDF sur cet appareil…":"Preparing local PDF...");
    ensurePdfLibrary().then(function (JsPdf) {
      if(lastResult!==exportResult)return;
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: isFrenchReport()?'AfroTools — Estimation des dates de grossesse':'AfroTools pregnancy date range estimate' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(resultText(exportResult).replace(/\u202f/g,' '), 500);
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
      setStatus(isFrenchReport()?"PDF téléchargé sur cet appareil.":"PDF downloaded locally.");
    }).catch(function () {
      if(lastResult!==exportResult)return;
      setStatus(isFrenchReport()?"Impossible de créer le PDF. Utilisez l’export TXT.":"PDF could not be created. Use the TXT export instead.");
    });
  }

  form.addEventListener('submit', calculate);
  form.querySelectorAll('input[name="method"]').forEach(function (radio) {
    radio.addEventListener('change', syncMethod);
  });
  dateInput.max = todayIso();

  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus(isFrenchReport()?"Calculez une plage de dates avant d’exporter.":"Calculate a range before exporting.");
    downloadBlob(
      'afrotools-pregnancy-date-range.txt',
      'text/plain;charset=utf-8',
      resultText(lastResult)
    );
    setStatus(isFrenchReport()?"TXT téléchargé sur cet appareil.":"TXT downloaded locally.");
  });

  document.getElementById('download-pdf').addEventListener('click', downloadPdf);

  document.getElementById('clear-result').addEventListener('click', function () {
    form.reset();
    syncMethod();
    dateInput.value = '';
    results.hidden = true;
    lastResult = null;
    setStatus(isFrenchReport()?"Date saisie et résultat actuel effacés.":"Entered date and current result cleared.");
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
