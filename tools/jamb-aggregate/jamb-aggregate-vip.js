(function () {
  'use strict';

  var engine = window.JambAggregateEngine;
  var lastResult = null;

  function field(id) {
    return document.getElementById(id);
  }

  function value(id) {
    return field(id) ? field(id).value : '';
  }

  function setStatus(message, type) {
    var status = field('jambFormStatus');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-error', type === 'error');
    status.classList.toggle('is-ok', type === 'ok');
  }

  function resultInput() {
    return {
      utme: value('utme'),
      postUtme: value('postUtme'),
      utmeWeight: value('utmeWeight'),
      postUtmeWeight: value('postUtmeWeight'),
      benchmark: value('publishedBenchmark')
    };
  }

  function identityText() {
    var institution = value('institutionName').trim() || 'Not entered';
    var programme = value('programmeName').trim() || 'Not entered';
    return { institution: institution, programme: programme };
  }

  function formulaLines(result) {
    return [
      'UTME normalized: ' + result.utme + ' / 4 = ' + result.normalizedUtme.toFixed(2),
      'UTME contribution: ' + result.normalizedUtme.toFixed(2) + ' × ' + result.utmeWeight + '% = ' + result.utmeContribution.toFixed(2),
      'Post-UTME contribution: ' + result.postUtme.toFixed(2) + ' × ' + result.postUtmeWeight + '% = ' + result.postUtmeContribution.toFixed(2),
      'Planning aggregate: ' + result.aggregate.toFixed(2) + ' / 100'
    ];
  }

  function checks(result) {
    var items = [];
    if (result.benchmark === null) {
      items.push({
        title: 'Add only a published benchmark',
        detail: 'Leave the benchmark blank until your institution publishes one for the current admission cycle.'
      });
    } else {
      var gap = result.difference;
      items.push({
        title: 'Benchmark comparison',
        detail: gap >= 0
          ? 'The planning result is ' + gap.toFixed(2) + ' points above the benchmark you entered. This is not an admission prediction.'
          : 'The planning result is ' + Math.abs(gap).toFixed(2) + ' points below the benchmark you entered.'
      });
    }
    items.push({
      title: 'Eligibility check',
      detail: 'Confirm O-Level credits, UTME subjects and programme requirements in JAMB IBASS.'
    });
    items.push({
      title: 'Institution check',
      detail: 'Confirm the current formula, screening notice, benchmark and deadline on the institution admission portal.'
    });
    return items;
  }

  function actionText() {
    if (!lastResult) return 'No planning result yet. Enter the scores and published weights first.';
    var identity = identityText();
    var lines = [
      'AfroTools JAMB screening calculation worksheet',
      'Institution: ' + identity.institution,
      'Programme: ' + identity.programme,
      'UTME: ' + lastResult.utme + ' / 400',
      'Post-UTME: ' + lastResult.postUtme + ' / 100',
      'Weights: UTME ' + lastResult.utmeWeight + '%, Post-UTME ' + lastResult.postUtmeWeight + '%',
      'Planning aggregate: ' + lastResult.aggregate.toFixed(2) + ' / 100'
    ];
    if (lastResult.benchmark !== null) {
      lines.push('Published benchmark entered by user: ' + lastResult.benchmark);
      lines.push('Difference: ' + lastResult.difference.toFixed(2));
    }
    lines.push('', 'Calculation');
    formulaLines(lastResult).forEach(function (line) { lines.push('- ' + line); });
    lines.push('', 'Required official checks');
    checks(lastResult).forEach(function (item) { lines.push('- ' + item.title + ': ' + item.detail); });
    lines.push('', 'Official links');
    lines.push('JAMB IBASS: https://eligibility.jamb.gov.ng/');
    lines.push('JAMB website: https://www.jamb.gov.ng/');
    lines.push('');
    lines.push('Planning worksheet only. AfroTools does not supply or predict institutional formulas, departmental cutoffs, admission eligibility or admission decisions.');
    return lines.join('\n');
  }

  function renderActionPack() {
    var summary = field('jambActionSummary');
    var list = field('jambActionChecks');
    if (!summary || !list || !lastResult) return;
    var benchmark = lastResult.benchmark === null ? 'Not entered' : lastResult.benchmark.toFixed(2);
    var comparison = lastResult.benchmark === null
      ? 'Verify officially'
      : (lastResult.difference >= 0 ? 'Above entered benchmark' : 'Below entered benchmark');
    summary.innerHTML = [
      ['Planning aggregate', lastResult.aggregate.toFixed(2)],
      ['Published benchmark', benchmark],
      ['Worksheet status', comparison]
    ].map(function (item) {
      return '<div><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div>';
    }).join('');
    list.innerHTML = checks(lastResult).map(function (item) {
      return '<div class="jamb-action-check"><i></i><div><b>' + item.title + '</b><small>' + item.detail + '</small></div></div>';
    }).join('');
  }

  window.calculate = function () {
    var result = engine.calculate(resultInput());
    if (!result.ok) {
      setStatus(result.error, 'error');
      field(result.error.indexOf('UTME score') === 0 ? 'utme' : 'postUtme')?.focus();
      return;
    }
    lastResult = result;
    field('resultCard').classList.remove('hidden');
    field('cutoffResult').classList.add('hidden');
    field('aggregateScore').textContent = result.aggregate.toFixed(2);
    field('formulaUsed').textContent = 'User-entered weights: UTME ' + result.utmeWeight + '% + Post-UTME ' + result.postUtmeWeight + '%';
    field('breakdown').textContent = formulaLines(result).join('\n');
    renderActionPack();
    setStatus('Planning aggregate calculated. Complete both official checks before acting.', 'ok');
    field('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof window.EduProfileSync !== 'undefined') {
      window.EduProfileSync.update({ jamb_score: Math.round(result.utme) });
    }
    if (window.AfroEdu && typeof window.AfroEdu.recordRealJambScore === 'function') {
      try { window.AfroEdu.recordRealJambScore(Math.round(result.utme)); } catch (error) {}
    }
  };

  window.loadJambSample = function () {
    field('utme').value = '280';
    field('postUtme').value = '68';
    field('utmeWeight').value = '50';
    field('postUtmeWeight').value = '50';
    field('institutionName').value = 'Example University';
    field('programmeName').value = 'Example Programme';
    field('publishedBenchmark').value = '65';
    setStatus('Sample planning values loaded. Replace them with your institution-published details.', 'ok');
  };

  window.clearJambSample = window.resetForm = function () {
    ['utme', 'postUtme', 'institutionName', 'programmeName', 'publishedBenchmark'].forEach(function (id) {
      field(id).value = '';
    });
    field('utmeWeight').value = '50';
    field('postUtmeWeight').value = '50';
    field('resultCard').classList.add('hidden');
    lastResult = null;
    setStatus('Inputs cleared.', '');
    field('jambActionStatus').textContent = '';
  };

  window.copyJambActionPack = function () {
    var text = actionText();
    var done = function () { field('jambActionStatus').textContent = 'Worksheet copied.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        field('jambActionStatus').textContent = 'Copy failed. Download the TXT worksheet instead.';
      });
    }
  };

  window.downloadJambActionPack = function () {
    if (!lastResult) {
      field('jambActionStatus').textContent = 'Calculate a planning aggregate first.';
      return;
    }
    var blob = new Blob([actionText()], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jamb-screening-calculation-worksheet.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    field('jambActionStatus').textContent = 'Worksheet downloaded.';
  };

  window.printJambWorksheet = function () {
    if (!lastResult) {
      field('jambActionStatus').textContent = 'Calculate a planning aggregate first.';
      return;
    }
    window.print();
    field('jambActionStatus').textContent = 'Print dialog opened. Choose Save as PDF to keep a PDF copy.';
  };

  window.saveJambActionPack = function () {
    if (!lastResult) {
      field('jambActionStatus').textContent = 'Calculate a planning aggregate first.';
      return;
    }
    try {
      localStorage.setItem('afrotools_jamb_action_pack', JSON.stringify({
        savedAt: new Date().toISOString(),
        result: lastResult,
        identity: identityText(),
        text: actionText()
      }));
      field('jambActionStatus').textContent = 'Worksheet saved on this device.';
    } catch (error) {
      field('jambActionStatus').textContent = 'Could not save locally in this browser.';
    }
  };

  window.CUTOFFS = [];
  window.FORMULAS = {
    planning: {
      name: 'Published-weight worksheet',
      desc: 'Enter the weights published by the institution for the current cycle.',
      needsOlevel: false
    }
  };
}());
