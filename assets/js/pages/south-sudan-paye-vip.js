(function () {
  'use strict';

  var copy = window.SouthSudanPayePage || {};
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.southSudanPaye;
  var gross = document.getElementById('grossSalary');
  var resultCard = document.getElementById('resultsCard');
  var status = document.getElementById('status');
  var result = null;

  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  function money(value) {
    return 'SSP ' + Number(value || 0).toLocaleString(copy.numberLocale || 'en', { maximumFractionDigits: 2 });
  }

  function set(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function announce(message, error) {
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(error));
  }

  function reset(message, error) {
    result = null;
    resultCard.classList.remove('on');
    announce(message, error);
  }

  function calculate() {
    if (!engine || typeof engine.calculate !== 'function') return reset(copy.engineError, true);
    if (gross.value.trim() === '') {
      gross.setAttribute('aria-invalid', 'true');
      gross.focus();
      return reset(copy.validationError, true);
    }
    var grossValue = Number(gross.value);
    if (!Number.isFinite(grossValue) || grossValue <= 0) {
      gross.setAttribute('aria-invalid', 'true');
      gross.focus();
      return reset(copy.validationError, true);
    }
    var value;
    try {
      value = engine.calculate({ gross: grossValue });
    } catch (error) {
      return reset(copy.engineError, true);
    }
    if (!value || value.ok === false) return reset(copy.validationError, true);
    gross.removeAttribute('aria-invalid');
    result = value;
    set('netMonthly', money(value.net));
    set('grossResult', money(value.gross));
    set('employeeNsif', money(value.employeeNsif));
    set('taxableIncome', money(value.taxableIncome));
    set('pit', money(value.pit));
    set('surtax', money(value.surtax));
    set('totalTax', money(value.totalTax));
    set('employerNsif', money(value.employerNsif));
    set('employerCost', money(value.employerCost));
    set('effectiveRate', (Number(value.effectiveDeductionRate || 0) * 100).toFixed(1) + '%');
    set('annualSummary', copy.annualSummary(money(value.net * 12), money(value.totalTax * 12), money(value.employeeNsif * 12), money(value.employerNsif * 12)));
    resultCard.classList.add('on');
    announce(copy.success, false);
  }

  async function clipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }

  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('clearBtn').addEventListener('click', function () {
    gross.value = '';
    gross.removeAttribute('aria-invalid');
    reset(copy.cleared, false);
    gross.focus();
  });
  gross.addEventListener('input', function () {
    gross.removeAttribute('aria-invalid');
    if (result) reset(copy.changed, false);
  });
  gross.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') calculate();
  });

  document.getElementById('copyBtn').addEventListener('click', async function () {
    if (!result) return;
    try {
      await clipboard(copy.summary({
        gross: money(result.gross),
        employeeNsif: money(result.employeeNsif),
        pit: money(result.pit),
        surtax: money(result.surtax),
        totalTax: money(result.totalTax),
        net: money(result.net),
        employerCost: money(result.employerCost)
      }));
      announce(copy.copied, false);
    } catch (error) {
      announce(copy.copyError || copy.engineError, true);
    }
  });

  document.getElementById('shareBtn').addEventListener('click', async function () {
    var payload = { title: copy.shareTitle, url: copy.canonical };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await clipboard(payload.url);
        announce(copy.linkCopied, false);
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      announce(copy.shareError || copy.copyError || copy.engineError, true);
    }
  });

  document.getElementById('pdfBtn').addEventListener('click', async function () {
    if (!result) return;
    if (!(window.AfroTools && window.AfroTools.pdf)) return announce(copy.pdfLoading, false);
    try {
      await window.AfroTools.pdf.generate({
        filename: copy.pdfFilename,
        title: copy.pdfTitle,
        subtitle: copy.pdfSubtitle,
        country: 'South Sudan',
        currency: 'SSP',
        summary: [
          { label: copy.labels.net, value: money(result.net) },
          { label: copy.labels.gross, value: money(result.gross) },
          { label: copy.labels.employeeNsif, value: money(result.employeeNsif) },
          { label: copy.labels.totalTax, value: money(result.totalTax) }
        ],
        sections: [
          { heading: copy.labels.taxBuild, rows: [
            [copy.labels.taxable, money(result.taxableIncome)],
            [copy.labels.pit, money(result.pit)],
            [copy.labels.surtax, money(result.surtax)],
            [copy.labels.effective, (Number(result.effectiveDeductionRate || 0) * 100).toFixed(1) + '%']
          ] },
          { heading: copy.labels.employer, rows: [
            [copy.labels.employerNsif, money(result.employerNsif)],
            [copy.labels.employerCost, money(result.employerCost)]
          ] },
          { heading: copy.labels.source, rows: [
            [copy.labels.checked, copy.sourceSummary],
            [copy.labels.use, copy.planningDisclaimer]
          ] }
        ],
        skipGate: true
      });
      announce(copy.pdfReady, false);
    } catch (error) {
      announce(copy.pdfError || copy.engineError, true);
    }
  });
}());
