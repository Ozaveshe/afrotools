(function () {
  'use strict';

  var engine = window.AfroPercentageEngine;
  if (!engine) return;

  var activeMode = 1;
  var history = [];
  var lastReports = {};
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.mode-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.mode-content'));
  var status = document.getElementById('percentageStatus');

  function format(value) {
    if (!Number.isFinite(value)) return 'Not defined';
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value);
  }

  function percent(value) {
    return Number.isFinite(value) ? format(value) + '%' : 'Not defined';
  }

  function setText(id, text) {
    var element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function setPanelState(mode, report) {
    var panel = document.getElementById('mode-' + mode);
    if (!panel) return;
    panel.classList.toggle('has-error', !report.ok);
    var errorElement = panel.querySelector('.mode-error');
    if (errorElement) {
      errorElement.textContent = report.ok ? '' : report.error;
      errorElement.hidden = report.ok;
    }
    var actions = panel.querySelectorAll('.result-action');
    actions.forEach(function (button) { button.disabled = !report.ok; });
  }

  function input(id) {
    return document.getElementById(id).value;
  }

  function calculate(mode) {
    var report;
    if (mode === 1) {
      report = engine.percentOf(input('p1_pct'), input('p1_val'));
      if (report.ok) {
        report.summary = input('p1_pct') + '% of ' + input('p1_val') + ' = ' + format(report.result);
        setText('r1', format(report.result));
        setText('r1_sub', report.summary);
      }
    } else if (mode === 2) {
      report = engine.percentageOf(input('p2_x'), input('p2_y'));
      if (report.ok) {
        report.summary = input('p2_x') + ' is ' + percent(report.percentage) + ' of ' + input('p2_y');
        setText('r2', percent(report.percentage));
        setText('r2_sub', report.summary);
      }
    } else if (mode === 3) {
      report = engine.percentageChange(input('p3_orig'), input('p3_new'));
      if (report.ok) {
        var direction = report.difference > 0 ? 'Increase' : report.difference < 0 ? 'Decrease' : 'No change';
        var signed = report.percentage > 0 ? '+' + percent(report.percentage) : percent(report.percentage);
        report.summary = direction + ': ' + format(Math.abs(report.difference)) + ' (' + percent(Math.abs(report.percentage)) + ')';
        setText('r3', signed);
        setText('r3_sub', report.summary);
      }
    } else if (mode === 4) {
      report = engine.discount(input('p4_price'), input('p4_disc'));
      if (report.ok) {
        report.summary = 'Final price ' + format(report.finalPrice) + '; saving ' + format(report.saving) + ' at ' + percent(report.percentage);
        setText('r4', format(report.finalPrice));
        setText('r4_save', format(report.saving));
        setText('r4_pct', percent(report.percentage));
      }
    } else if (mode === 5) {
      report = engine.tipSplit(input('p5_bill'), input('p5_tip'), input('p5_split'));
      if (report.ok) {
        report.summary = 'Total ' + format(report.total) + '; tip ' + format(report.tip) + '; per person ' + format(report.perPerson);
        setText('r5', format(report.total));
        setText('r5_tip', format(report.tip));
        setText('r5_per', format(report.perPerson));
      }
    } else {
      report = engine.margin(input('p6_cost'), input('p6_sell'));
      if (report.ok) {
        report.summary = 'Profit ' + format(report.profit) + '; margin ' + percent(report.margin) + '; markup ' + (report.markup === null ? 'not defined when cost is zero' : percent(report.markup));
        setText('r6_margin', percent(report.margin));
        setText('r6_markup', report.markup === null ? 'Not defined' : percent(report.markup));
        setText('r6_profit', format(report.profit));
        setText('r6_gm', format(report.marginRatio));
      }
    }
    lastReports[mode] = report;
    setPanelState(mode, report);
    return report;
  }

  function reportText(mode) {
    var names = {
      1: 'Percentage of a number',
      2: 'What percentage?',
      3: 'Percentage change',
      4: 'Discount',
      5: 'Tip split',
      6: 'Margin and markup'
    };
    var report = lastReports[mode] || calculate(mode);
    if (!report.ok) return '';
    return [
      'AfroTools Percentage Calculator',
      names[mode],
      report.summary,
      '',
      'Method: deterministic browser calculation. Review the displayed formula and reference base.',
      'Privacy: values stay in this browser and are not saved automatically.'
    ].join('\n');
  }

  function announce(message) {
    if (status) status.textContent = message;
  }

  function copy(mode) {
    var text = reportText(mode);
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
      announce('Result copied. Your inputs were not included beyond the calculation summary.');
    }).catch(function () {
      announce('Copy was unavailable. Select the visible result instead.');
    });
  }

  function download(mode) {
    var text = reportText(mode);
    if (!text) return;
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'percentage-calculation.txt';
    link.click();
    URL.revokeObjectURL(url);
    announce('Text summary downloaded.');
  }

  function printResult(mode) {
    document.body.dataset.printMode = String(mode);
    window.print();
    window.setTimeout(function () { delete document.body.dataset.printMode; }, 0);
    announce('Print dialog opened. Choose Save as PDF to create a PDF.');
  }

  function renderHistory() {
    var list = document.getElementById('histList');
    list.textContent = '';
    if (!history.length) {
      var empty = document.createElement('div');
      empty.className = 'empty-hist';
      empty.textContent = 'Completed calculations from this tab will appear here.';
      list.appendChild(empty);
      return;
    }
    history.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'hist-item';
      var label = document.createElement('span');
      label.className = 'hist-expr';
      label.textContent = item.label;
      var result = document.createElement('span');
      result.className = 'hist-result';
      result.textContent = item.summary;
      row.append(label, result);
      list.appendChild(row);
    });
  }

  function addHistory(mode) {
    var report = calculate(mode);
    if (!report.ok) return;
    var item = { label: 'Mode ' + mode, summary: report.summary };
    if (history[0] && history[0].summary === item.summary) return;
    history.unshift(item);
    history = history.slice(0, 10);
    renderHistory();
  }

  function selectTab(tab, moveFocus) {
    activeMode = Number(tab.dataset.mode);
    tabs.forEach(function (item) {
      var selected = item === tab;
      item.classList.toggle('on', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== 'mode-' + activeMode;
    });
    calculate(activeMode);
    if (moveFocus) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        selectTab(tabs[next], true);
      }
    });
  });

  document.querySelectorAll('[data-calculate-mode]').forEach(function (inputElement) {
    var mode = Number(inputElement.dataset.calculateMode);
    inputElement.addEventListener('input', function () { calculate(mode); });
    inputElement.addEventListener('change', function () { addHistory(mode); });
  });

  document.querySelectorAll('.tip-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.tip-btn').forEach(function (item) {
        var selected = item === button;
        item.classList.toggle('on', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      document.getElementById('p5_tip').value = button.dataset.tip;
      calculate(5);
      addHistory(5);
    });
  });

  document.querySelectorAll('[data-copy-mode]').forEach(function (button) {
    button.addEventListener('click', function () { copy(Number(button.dataset.copyMode)); });
  });
  document.querySelectorAll('[data-download-mode]').forEach(function (button) {
    button.addEventListener('click', function () { download(Number(button.dataset.downloadMode)); });
  });
  document.querySelectorAll('[data-print-mode]').forEach(function (button) {
    button.addEventListener('click', function () { printResult(Number(button.dataset.printMode)); });
  });

  document.getElementById('clearHistory').addEventListener('click', function () {
    history = [];
    renderHistory();
    announce('Session history cleared.');
  });

  for (var mode = 1; mode <= 6; mode += 1) calculate(mode);
  selectTab(tabs[0], false);
  renderHistory();
}());
