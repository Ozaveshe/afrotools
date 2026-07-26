(function () {
  'use strict';

  var engine = window.IELTSVipEngine;
  var componentNames = ['listening', 'reading', 'writing', 'speaking'];

  function byId(id) {
    return document.getElementById(id);
  }

  function mode() {
    return byId('modeGeneral') && byId('modeGeneral').classList.contains('is-active') ? 'general' : 'academic';
  }

  function status(message, type) {
    var node = byId('ieltsFormStatus');
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', type === 'error');
    node.classList.toggle('is-ok', type === 'ok');
  }

  function values() {
    var output = {};
    componentNames.forEach(function (name) { output[name] = byId(name).value; });
    return output;
  }

  function fillTargets() {
    var select = byId('planningTarget');
    if (!select || select.dataset.vipReady) return;
    select.dataset.vipReady = 'true';
    var current = select.value;
    select.innerHTML = '<option value="">Choose a target</option>';
    for (var band = 4; band <= 9; band += 0.5) {
      var option = document.createElement('option');
      option.value = band.toFixed(1);
      option.textContent = band.toFixed(1) + ' overall';
      select.appendChild(option);
    }
    if (current && Array.from(select.options).some(function (option) { return option.value === current; })) {
      select.value = current;
    }
  }

  function updateBoundary() {
    var target = byId('planningTarget').value;
    byId('pathSummaryTitle').textContent = target ? 'Your overall target: ' + Number(target).toFixed(1) : 'Choose your own overall target';
    byId('pathSummaryText').textContent = target
      ? 'The result will be compared with ' + Number(target).toFixed(1) + ' overall. Component minimums and accepted test type are not inferred.'
      : 'Enter the score published by your receiving organisation. This tool does not infer component minimums or eligibility.';
  }

  function updateRawPreview() {
    var currentMode = mode();
    var listening = engine.rawEstimate(byId('rawListening').value, 'listening', currentMode);
    var reading = engine.rawEstimate(byId('rawReading').value, 'reading', currentMode);
    byId('rawListeningBand').textContent = listening.display;
    byId('rawReadingBand').textContent = reading.display;
    byId('readingEstimateLabel').textContent = 'Reading estimate (' + (currentMode === 'general' ? 'General Training' : 'Academic') + ')';
  }

  function renderExportSummary(result, comparison) {
    var summary = byId('ieltsExportSummary');
    var list = byId('ieltsExportList');
    if (summary) {
      summary.innerHTML = [
        ['Overall', result.overall.toFixed(1)],
        ['Target', comparison.target.toFixed(1)],
        ['Mode', mode() === 'general' ? 'General Training' : 'Academic']
      ].map(function (item) {
        return '<div class="ielts-export-cell"><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div>';
      }).join('');
    }
    if (list) {
      list.innerHTML = [
        ['Rounding', 'Section average ' + result.average.toFixed(3) + ' rounds to ' + result.overall.toFixed(1) + '.'],
        ['Lowest section', result.weakest.map(function (name) { return name.charAt(0).toUpperCase() + name.slice(1); }).join(', ') + '.'],
        ['Official check', 'Confirm test type, overall target, component floors and validity period with the receiving organisation.']
      ].map(function (item) {
        return '<div class="ielts-export-item"><i class="ielts-export-dot"></i><div><b>' + item[0] + '</b><small>' + item[1] + '</small></div></div>';
      }).join('');
    }
  }

  function renderResult() {
    var target = byId('planningTarget').value;
    if (!target) {
      status('Choose the overall target published by your receiving organisation before calculating.', 'error');
      byId('planningTarget').focus();
      return;
    }

    var result;
    var comparison;
    try {
      result = engine.calculateOverall(values());
      comparison = engine.compare(result.overall, target);
    } catch (error) {
      status(error.message, 'error');
      return;
    }

    byId('overallScore').textContent = result.overall.toFixed(1);
    byId('levelDesc').textContent = 'Section average ' + result.average.toFixed(3) + ', reported to the nearest whole or half band.';
    byId('componentScores').innerHTML = componentNames.map(function (name) {
      return '<div class="ielts-comp"><div class="ielts-comp-val">' + result.scores[name].toFixed(1) + '</div><div class="ielts-comp-name">' + name + '</div></div>';
    }).join('');

    var labels = {
      'at-or-above': ['At or above target', 'status-meets'],
      'within-half-band': ['Within 0.5 band', 'status-close'],
      below: ['Below target', 'status-below']
    };
    var label = labels[comparison.status];
    byId('verdictStatus').textContent = label[0];
    byId('verdictStatus').className = 'ielts-status-badge ' + label[1];
    byId('verdictMeta').textContent = 'User-entered overall target';
    byId('verdictTitle').textContent = result.overall.toFixed(1) + ' compared with ' + comparison.target.toFixed(1);
    byId('verdictSummary').textContent = comparison.gap
      ? 'Your calculated overall band is ' + comparison.gap.toFixed(1) + ' below your chosen target. This does not evaluate component minimums or eligibility.'
      : 'Your calculated overall band is at or above your chosen target. This does not prove that you satisfy component minimums or eligibility rules.';
    byId('gapList').innerHTML =
      '<div class="ielts-gap-item"><strong>Overall comparison:</strong> ' +
      (comparison.gap ? comparison.gap.toFixed(1) + ' band below target.' : 'At or above target.') +
      '</div><div class="ielts-gap-item"><strong>Lowest section:</strong> ' +
      result.weakest.join(', ') +
      ' at ' + result.scores[result.weakest[0]].toFixed(1) +
      '.</div><div class="ielts-gap-item"><strong>Not checked:</strong> Component floors, test validity, one-skill retake acceptance, visa, admission, scholarship and professional-registration rules.</div>';

    byId('studyTipsContent').innerHTML =
      '<div class="ielts-tip-item"><strong>Review your lowest section:</strong> Use an official practice test, time the full section, and review error types rather than relying on the estimated band alone.</div>' +
      '<div class="ielts-tip-item"><strong>Confirm the route:</strong> Check the receiving organisation’s current page for accepted IELTS type, overall score, component minimums and validity period.</div>' +
      '<div class="ielts-tip-item"><strong>Keep the evidence:</strong> Only an official IELTS Test Report Form proves a test result.</div>';

    byId('resultsPanel').classList.remove('hidden');
    byId('qualificationCard').classList.add('hidden');
    byId('actionPlanCard').classList.remove('hidden');
    renderExportSummary(result, comparison);
    status('Overall band calculated. The target comparison is a planning check, not an eligibility decision.', 'ok');
  }

  function applyRaw(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var currentMode = mode();
    var listening = engine.rawEstimate(byId('rawListening').value, 'listening', currentMode);
    var reading = engine.rawEstimate(byId('rawReading').value, 'reading', currentMode);
    if (!listening.valid || !reading.valid) {
      status('Enter whole-number practice scores from 0 to 40 for both Listening and Reading.', 'error');
      return;
    }
    if (listening.band === null || reading.band === null) {
      status('At least one estimate is below band 4.0, so it cannot be applied to the band selectors.', 'error');
      return;
    }
    byId('listening').value = listening.band.toFixed(1);
    byId('reading').value = reading.band.toFixed(1);
    status('Estimated bands applied. Choose your own overall target, add Writing and Speaking bands, then calculate.', 'ok');
  }

  function reset(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    componentNames.forEach(function (name) { byId(name).value = '6.5'; });
    byId('rawListening').value = '';
    byId('rawReading').value = '';
    byId('planningTarget').value = '';
    byId('resultsPanel').classList.add('hidden');
    byId('qualificationCard').classList.add('hidden');
    byId('actionPlanCard').classList.add('hidden');
    updateBoundary();
    updateRawPreview();
    status('Inputs reset. Choose a target before calculating.', '');
  }

  function bind() {
    fillTargets();
    updateBoundary();
    updateRawPreview();
    byId('qualificationCard').classList.add('hidden');
    if (!byId('planningTarget').value) {
      byId('resultsPanel').classList.add('hidden');
      byId('actionPlanCard').classList.add('hidden');
    }
    byId('calculateBtn').addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderResult();
    }, true);
    byId('applyRawBtn').addEventListener('click', applyRaw, true);
    byId('resetBtn').addEventListener('click', reset, true);
    ['planningTarget', 'targetDestination', 'targetPathway'].forEach(function (id) {
      byId(id).addEventListener('change', function () { window.setTimeout(updateBoundary, 0); });
    });
    ['rawListening', 'rawReading'].forEach(function (id) {
      byId(id).addEventListener('input', function (event) {
        event.stopImmediatePropagation();
        updateRawPreview();
      }, true);
    });
    ['modeAcademic', 'modeGeneral'].forEach(function (id) {
      byId(id).addEventListener('click', function () {
        window.setTimeout(function () {
          updateRawPreview();
          if (!byId('resultsPanel').classList.contains('hidden')) renderResult();
        }, 0);
      });
    });
    byId('printIELTSActionPack').addEventListener('click', function () {
      document.documentElement.classList.add('ielts-pack-printing');
      window.print();
      window.setTimeout(function () { document.documentElement.classList.remove('ielts-pack-printing'); }, 500);
      byId('ieltsExportStatus').textContent = 'Print dialog opened. Choose Save as PDF to export.';
    });
    window.addEventListener('afterprint', function () {
      document.documentElement.classList.remove('ielts-pack-printing');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
}());
