(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.childbirthBudgetEngine;
  var form = document.getElementById('childbirth-budget-form');
  var results = document.getElementById('childbirth-budget-results');
  var errorBox = document.getElementById('form-error');
  var lastResult = null;
  var fieldIds = {
    plannedCare: 'planned-care',
    professionalFees: 'professional-fees',
    medicinesSupplies: 'medicines-supplies',
    testsCare: 'tests-care',
    transportStay: 'transport-stay',
    contingency: 'contingency'
  };

  function todayIso() {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function formatMoney(cents, currency) {
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cents / 100);
    } catch (error) {
      return currency + ' ' + (cents / 100).toFixed(2);
    }
  }

  function formatDate(iso) {
    var date = new Date(iso + 'T00:00:00Z');
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }

  function freshnessText(result) {
    if (result.freshness === 'recent') return 'Dated ' + result.ageDays + ' day(s) ago';
    if (result.freshness === 'review-soon') return 'Reconfirm: ' + result.ageDays + ' days old';
    return 'Refresh required: ' + result.ageDays + ' days old';
  }

  function render(result) {
    lastResult = result;
    document.getElementById('gross-total').textContent = formatMoney(result.grossCents, result.currency);
    document.getElementById('contribution-total').textContent = formatMoney(result.contributionCents, result.currency);
    document.getElementById('household-total').textContent = formatMoney(result.householdCents, result.currency);
    document.getElementById('freshness-badge').textContent = freshnessText(result);
    document.getElementById('freshness-badge').dataset.freshness = result.freshness;
    document.getElementById('source-summary').textContent =
      result.sourceLabel + ', dated ' + formatDate(result.quoteDate) + '.';
    var list = document.getElementById('breakdown-list');
    list.replaceChildren();
    result.lineItems.forEach(function (item) {
      var li = document.createElement('li');
      var label = document.createElement('span');
      var amount = document.createElement('strong');
      label.textContent = item.label;
      amount.textContent = formatMoney(item.cents, result.currency);
      li.append(label, amount);
      list.appendChild(li);
    });
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local budget engine did not load. Refresh and try again.';
      return;
    }
    var input = {
      currency: document.getElementById('currency-code').value,
      quoteDate: document.getElementById('quote-date').value,
      sourceType: document.getElementById('source-type').value,
      confirmedContribution: document.getElementById('confirmed-contribution').value,
      asOf: todayIso()
    };
    Object.keys(fieldIds).forEach(function (key) {
      input[key] = document.getElementById(fieldIds[key]).value;
    });
    var result = engine.calculate(input);
    if (!result.valid) {
      errorBox.textContent = result.error;
      document.getElementById('currency-code').focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function exportText(result) {
    return [
      'AFROTOOLS PROVIDER-QUOTE CHILDBIRTH BUDGET',
      '',
      'Figure source: ' + result.sourceLabel,
      'Quote or assumption date: ' + formatDate(result.quoteDate),
      'Figure age when calculated: ' + result.ageDays + ' day(s)',
      'Currency: ' + result.currency,
      '',
      'Entered line items:',
      result.lineItems.map(function (item) {
        return '- ' + item.label + ': ' + formatMoney(item.cents, result.currency);
      }).join('\n'),
      '',
      'User-entered cost total: ' + formatMoney(result.grossCents, result.currency),
      'Confirmed payer contribution: ' + formatMoney(result.contributionCents, result.currency),
      'Household amount to plan: ' + formatMoney(result.householdCents, result.currency),
      '',
      result.boundary,
      'A zero field means no amount entered, not free care.',
      'Confirm the clinical plan, quote validity, included items and coverage directly. Unexpected care can change costs.',
      'Cost planning must not delay needed or urgent maternity care.',
      'Sources: WHO universal health coverage; WHO financial protection; WHO maternal mortality.',
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
    if (!lastResult) return setStatus('Calculate a budget before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools provider-quote childbirth budget' });
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
      pdf.save('afrotools-provider-quote-childbirth-budget.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', submit);
  document.getElementById('quote-date').max = todayIso();
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Calculate a budget before exporting.');
    downloadBlob('afrotools-provider-quote-childbirth-budget.txt', 'text/plain;charset=utf-8', exportText(lastResult));
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-budget').addEventListener('click', function () {
    form.reset();
    document.getElementById('currency-code').value = 'NGN';
    results.hidden = true;
    lastResult = null;
    setStatus('Amounts, date and current budget cleared.');
    document.getElementById('currency-code').focus();
  });

  window.AfroChildbirthBudget = {
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
