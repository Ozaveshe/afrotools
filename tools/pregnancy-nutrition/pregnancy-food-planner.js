(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.pregnancyFoodEngine;
  var form = document.getElementById('pregnancy-food-form');
  var errorBox = document.getElementById('form-error');
  var results = document.getElementById('pregnancy-food-results');
  var lastResult = null;

  function checkedValues(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (input) { return input.value; });
  }

  function fillList(id, items, emptyText) {
    var list = document.getElementById(id);
    list.replaceChildren();
    var values = items.length ? items : [emptyText];
    values.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function render(result) {
    lastResult = result;
    fillList('selected-groups', result.selectedGroups, 'No groups recorded.');
    fillList('variety-questions', result.varietyQuestions, 'All listed groups were selected. This still does not establish dietary adequacy.');
    fillList('safety-questions', result.safetyQuestions, 'All listed safety checks were selected. Follow current local food-safety guidance as well.');
    document.getElementById('supplement-copy').textContent = result.supplementCopy;
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    var reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function submit(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local planning engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.build({
      groups: checkedValues('food-group'),
      safetyChecks: checkedValues('safety-check'),
      supplementStatus: document.getElementById('supplement-status').value
    });
    if (!result.valid) {
      errorBox.textContent = result.error;
      form.querySelector('input[name="food-group"]').focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function exportText(result) {
    return [
      'AFROTOOLS PREGNANCY FOOD VARIETY DISCUSSION CARD',
      '',
      'Food groups selected:',
      result.selectedGroups.map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Questions about variety:',
      (result.varietyQuestions.length ? result.varietyQuestions : ['All listed groups were selected; adequacy is still not established.'])
        .map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Food-safety checks to confirm:',
      (result.safetyQuestions.length ? result.safetyQuestions : ['All listed checks were selected; follow current local guidance as well.'])
        .map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Supplement boundary: ' + result.supplementCopy,
      result.boundary,
      'If food access, nausea, symptoms, weight change or a medical condition affects eating, tell the maternity team.',
      '',
      'Sources: WHO nutrition counselling during pregnancy; WHO healthy diet; NHS foods to avoid in pregnancy; NHS pregnancy vitamins and supplements.',
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
    if (!lastResult) return setStatus('Build a discussion card before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools pregnancy food variety discussion card' });
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
      pdf.save('afrotools-pregnancy-food-discussion-card.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', submit);
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Build a discussion card before exporting.');
    downloadBlob('afrotools-pregnancy-food-discussion-card.txt', 'text/plain;charset=utf-8', exportText(lastResult));
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-result').addEventListener('click', function () {
    form.reset();
    results.hidden = true;
    lastResult = null;
    setStatus('Selections and current card cleared.');
    form.querySelector('input[name="food-group"]').focus();
  });

  window.AfroPregnancyFoodPlanner = {
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
