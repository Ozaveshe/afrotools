(function () {
  'use strict';

  var engine = window.MatricPointsEngine;
  var rows = [];
  var lastResult = null;
  var subjects = window.MATRIC_SUBJECTS || [];

  function byId(id) { return document.getElementById(id); }
  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function setStatus(message, type) {
    var node = byId('matricFormStatus');
    node.textContent = message || '';
    node.classList.toggle('is-error', type === 'error');
    node.classList.toggle('is-ok', type === 'ok');
  }
  function refreshLanguageOptions() {
    var selectedSubjects = rows.map(function (row) { return row.subject; });
    ['homeLanguage', 'learningLanguage'].forEach(function (id) {
      var select = byId(id);
      var current = select.value;
      select.innerHTML = '<option value="">Select entered subject</option>' + selectedSubjects.map(function (subject) {
        return '<option value="' + escape(subject) + '">' + escape(subject) + '</option>';
      }).join('');
      if (selectedSubjects.indexOf(current) !== -1) select.value = current;
    });
  }
  function renderRows() {
    var container = byId('subjects');
    container.innerHTML = rows.map(function (row, index) {
      return '<div class="subj-row" data-index="' + index + '">' +
        '<div><label class="sr-only" for="sub-' + index + '">Subject ' + (index + 1) + '</label>' +
        '<select id="sub-' + index + '" data-field="subject">' + subjects.map(function (subject) {
          return '<option value="' + escape(subject) + '"' + (subject === row.subject ? ' selected' : '') + '>' + escape(subject) + '</option>';
        }).join('') + '</select></div>' +
        '<div><label class="sr-only" for="pct-' + index + '">Final percentage for ' + escape(row.subject) + '</label>' +
        '<input id="pct-' + index + '" data-field="percentage" type="number" min="0" max="100" inputmode="decimal" value="' + row.percentage + '" aria-label="Final percentage for ' + escape(row.subject) + '"></div>' +
        '<div class="pts" id="pts-' + index + '">' + (engine.levelFromPercentage(row.percentage) || '—') + '</div>' +
        '</div>';
    }).join('');
    container.querySelectorAll('[data-field]').forEach(function (control) {
      control.addEventListener('change', function () {
        var index = Number(control.closest('[data-index]').dataset.index);
        rows[index][control.dataset.field] = control.dataset.field === 'percentage' ? control.value : control.value;
        if (control.dataset.field === 'subject') refreshLanguageOptions();
        byId('pts-' + index).textContent = engine.levelFromPercentage(rows[index].percentage) || '—';
      });
      control.addEventListener('input', function () {
        if (control.dataset.field === 'percentage') {
          var index = Number(control.closest('[data-index]').dataset.index);
          rows[index].percentage = control.value;
          byId('pts-' + index).textContent = engine.levelFromPercentage(control.value) || '—';
        }
      });
    });
    refreshLanguageOptions();
  }
  function sampleRows() {
    return [
      { subject: 'English First Additional Language', percentage: 68 },
      { subject: 'Afrikaans Home Language', percentage: 72 },
      { subject: 'Mathematics', percentage: 65 },
      { subject: 'Physical Sciences', percentage: 58 },
      { subject: 'Life Sciences', percentage: 64 },
      { subject: 'Accounting', percentage: 55 },
      { subject: 'Life Orientation', percentage: 78 }
    ];
  }
  function input() {
    return {
      results: rows,
      homeLanguage: byId('homeLanguage').value,
      learningLanguage: byId('learningLanguage').value
    };
  }
  function items(result) {
    return [
      {
        title: 'DBE study-admission route',
        detail: result.route + '. This is a minimum-route check, not an admission offer.'
      },
      {
        title: 'Institution scoring',
        detail: 'Use the chosen university and programme guide. UCT, Wits and other institutions do not share one APS formula.'
      },
      {
        title: 'Language checks',
        detail: result.homeLanguage + ': ' + result.homeLanguagePercentage + '%. ' + result.learningLanguage + ' (LoLT): ' + result.learningLanguagePercentage + '%.'
      }
    ];
  }
  function text() {
    if (!lastResult) return 'No NSC result check yet.';
    var lines = [
      'AfroTools NSC study-admission planning worksheet',
      'DBE route: ' + lastResult.route,
      'Best-six level planning index: ' + lastResult.planningIndex + ' (not a universal university APS)',
      'Home Language: ' + lastResult.homeLanguage + ' - ' + lastResult.homeLanguagePercentage + '%',
      'Institution LoLT: ' + lastResult.learningLanguage + ' - ' + lastResult.learningLanguagePercentage + '%',
      '',
      'Counted planning subjects'
    ];
    lastResult.counted.forEach(function (row) {
      lines.push('- ' + row.subject + ': ' + row.percentage + '% (Level ' + row.level + ')');
    });
    lines.push('', 'Required official checks');
    items(lastResult).forEach(function (item) { lines.push('- ' + item.title + ': ' + item.detail); });
    lines.push('', 'DBE NSC FAQ: https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/FAQsonExams.aspx');
    lines.push('UCT eligibility and APS: https://undergrad.uct.ac.za/students/applications-admission-requirements/eligibility-admission');
    lines.push('Wits entry requirements: https://www.wits.ac.za/undergraduate/entry-requirements/');
    return lines.join('\n');
  }
  function renderResult(result) {
    byId('apsScore').textContent = result.planningIndex;
    byId('passType').textContent = result.route;
    byId('passType').className = 'pass ' + (result.route.indexOf("Bachelor") === 0 ? 'bach' : result.route.indexOf('Diploma') === 0 ? 'dip' : 'hc');
    byId('uniCheck').innerHTML = '<div class="matric-source-grid">' +
      '<a href="https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/FAQsonExams.aspx" target="_blank" rel="noopener"><b>DBE NSC requirements</b><span>Verify the national certificate and study-admission minimums.</span></a>' +
      '<a href="https://undergrad.uct.ac.za/students/applications-admission-requirements/eligibility-admission" target="_blank" rel="noopener"><b>UCT scoring rules</b><span>UCT uses its own six-subject APS/FPS rules.</span></a>' +
      '<a href="https://www.wits.ac.za/undergraduate/entry-requirements/" target="_blank" rel="noopener"><b>Wits scoring rules</b><span>Wits uses a different best-seven contract that includes Life Orientation.</span></a>' +
      '</div>';
    byId('matricActionGrid').innerHTML = [
      ['Planning index', result.planningIndex],
      ['DBE route', result.route],
      ['40%+ subjects', result.passed40]
    ].map(function (entry) {
      return '<div class="matric-action-cell"><strong>' + escape(entry[1]) + '</strong><span>' + escape(entry[0]) + '</span></div>';
    }).join('');
    byId('matricActionList').innerHTML = items(result).map(function (item) {
      return '<div class="matric-action-item"><i class="matric-action-dot"></i><div><b>' + escape(item.title) + '</b><small>' + escape(item.detail) + '</small></div></div>';
    }).join('');
    byId('resultCard').style.display = 'block';
  }

  window.loadMatricSample = function () {
    rows = sampleRows();
    renderRows();
    byId('homeLanguage').value = 'Afrikaans Home Language';
    byId('learningLanguage').value = 'English First Additional Language';
    byId('resultCard').style.display = 'none';
    lastResult = null;
    setStatus('Sample percentages loaded. Replace them with the official statement of results.', 'ok');
  };
  window.resetMatricInputs = function () {
    rows = sampleRows().map(function (row) { return { subject: row.subject, percentage: 50 }; });
    renderRows();
    byId('homeLanguage').value = '';
    byId('learningLanguage').value = '';
    byId('resultCard').style.display = 'none';
    lastResult = null;
    setStatus('Inputs reset.', '');
  };
  window.addSubject = function () {
    var unused = subjects.find(function (subject) {
      return rows.every(function (row) { return row.subject !== subject; });
    });
    if (!unused) return;
    rows.push({ subject: unused, percentage: 50 });
    renderRows();
  };
  window.calculate = function () {
    var result = engine.calculate(input());
    if (!result.ok) {
      setStatus(result.error, 'error');
      return;
    }
    lastResult = result;
    renderResult(result);
    setStatus('NSC study-admission route and planning index calculated. Verify the university-specific scoring guide next.', 'ok');
    byId('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  window.copyMatricActionPack = function () {
    navigator.clipboard.writeText(text()).then(function () {
      byId('matricActionStatus').textContent = 'Worksheet copied.';
    }).catch(function () {
      byId('matricActionStatus').textContent = 'Copy failed. Download the TXT worksheet instead.';
    });
  };
  window.downloadMatricActionPack = function () {
    if (!lastResult) return;
    var blob = new Blob([text()], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nsc-study-admission-worksheet.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    byId('matricActionStatus').textContent = 'Worksheet downloaded.';
  };
  window.saveMatricActionPack = function () {
    if (!lastResult) return;
    localStorage.setItem('afrotools_matric_action_pack', JSON.stringify({
      savedAt: new Date().toISOString(),
      result: lastResult,
      text: text()
    }));
    byId('matricActionStatus').textContent = 'Worksheet saved on this device.';
  };
  window.printMatricWorksheet = function () {
    if (!lastResult) return;
    window.print();
    byId('matricActionStatus').textContent = 'Print dialog opened. Choose Save as PDF for a PDF copy.';
  };

  window.MATRIC_SUBJECTS = window.SUBJECTS || subjects;
  subjects = window.MATRIC_SUBJECTS;
  rows = sampleRows();
  renderRows();
  byId('homeLanguage').value = 'Afrikaans Home Language';
  byId('learningLanguage').value = 'English First Additional Language';
}());
