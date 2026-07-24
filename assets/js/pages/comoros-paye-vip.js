(function () {
  'use strict';

  var copy = window.ComorosPayePage || {};
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.comorosPaye;
  var gross = document.getElementById('grossSalary');
  var contributionRate = document.getElementById('employeeContributionRate');
  var resultCard = document.getElementById('resultsCard');
  var status = document.getElementById('status');
  var calculateButton = document.getElementById('calculateBtn');
  var clearButton = document.getElementById('clearBtn');
  var copyButton = document.getElementById('copyBtn');
  var shareButton = document.getElementById('shareBtn');
  var pdfButton = document.getElementById('pdfBtn');
  var result = null;

  if (!gross || !contributionRate || !resultCard || !status || !calculateButton || !clearButton || !copyButton || !shareButton || !pdfButton) return;

  function money(value) {
    return Number(value || 0).toLocaleString(copy.numberLocale || 'fr-KM', {
      style: 'currency',
      currency: 'KMF',
      currencyDisplay: 'code',
      maximumFractionDigits: 0
    });
  }

  function percentage(value) {
    return (Number(value || 0) * 100).toLocaleString(copy.numberLocale || 'fr-KM', { maximumFractionDigits: 1 }) + '%';
  }

  function set(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function setActionState(enabled) {
    copyButton.disabled = !enabled;
    pdfButton.disabled = !enabled;
  }

  function reset(message, error) {
    result = null;
    resultCard.classList.remove('on');
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(error));
    setActionState(false);
  }

  function calculate() {
    if (!engine || typeof engine.calculate !== 'function') return reset(copy.engineError, true);
    if (gross.value.trim() === '') return reset(copy.validationError, true);

    var grossValue = Number(gross.value);
    var ratePercent = contributionRate.value.trim() === '' ? 0 : Number(contributionRate.value);
    var value = engine.calculate({
      grossMonthly: grossValue,
      employeeContributionRate: ratePercent / 100
    });
    if (!value.ok) return reset(copy.contributionValidation || copy.validationError, true);

    result = value;
    set('netMonthly', money(value.netMonthly));
    set('grossResult', money(value.grossMonthly));
    set('employeeContribution', money(value.employeeContributionAnnual));
    set('professionalExpense', money(value.professionalExpenseDeductionAnnual));
    set('taxableAnnual', money(value.taxableAnnual));
    set('incomeTaxAnnual', money(value.incomeTaxAnnual));
    set('incomeTaxMonthly', money(value.incomeTaxMonthlyEquivalent));
    set('netAnnual', money(value.netAnnual));
    set('effectiveRate', percentage(value.effectiveDeductionRate));
    resultCard.classList.add('on');
    status.classList.remove('error');
    status.textContent = copy.success;
    setActionState(true);
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

  calculateButton.addEventListener('click', calculate);
  clearButton.addEventListener('click', function () {
    gross.value = '';
    contributionRate.value = '0';
    reset(copy.cleared, false);
    gross.focus();
  });
  [gross, contributionRate].forEach(function (node) {
    node.addEventListener('input', function () { if (result) reset(copy.changed, false); });
    node.addEventListener('keydown', function (event) { if (event.key === 'Enter') calculate(); });
  });
  copyButton.addEventListener('click', async function () {
    if (!result) return;
    try {
      await clipboard(copy.summary({
        gross: money(result.grossMonthly),
        contribution: money(result.employeeContributionAnnual),
        professionalExpense: money(result.professionalExpenseDeductionAnnual),
        taxable: money(result.taxableAnnual),
        taxAnnual: money(result.incomeTaxAnnual),
        taxMonthly: money(result.incomeTaxMonthlyEquivalent),
        netMonthly: money(result.netMonthly),
        netAnnual: money(result.netAnnual)
      }));
      status.textContent = copy.copied;
    } catch (error) {
      status.textContent = copy.copyError || copy.validationError;
      status.classList.add('error');
    }
  });
  shareButton.addEventListener('click', async function () {
    var payload = { title: copy.shareTitle, url: copy.canonical };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await clipboard(payload.url);
        status.textContent = copy.linkCopied;
      }
    } catch (error) {
      if (!error || error.name !== 'AbortError') {
        status.textContent = copy.shareError || copy.copyError || copy.validationError;
        status.classList.add('error');
      }
    }
  });
  pdfButton.addEventListener('click', async function () {
    if (!result) return;
    if (!(window.AfroTools && window.AfroTools.pdf && typeof window.AfroTools.pdf.generate === 'function')) {
      status.textContent = copy.pdfLoading;
      return;
    }
    try {
      await window.AfroTools.pdf.generate({
        filename: copy.pdfFilename,
        title: copy.pdfTitle,
        subtitle: copy.pdfSubtitle,
        country: 'Comoros',
        currency: 'KMF',
        summary: [
          { label: copy.labels.netMonthly, value: money(result.netMonthly) },
          { label: copy.labels.grossMonthly, value: money(result.grossMonthly) },
          { label: copy.labels.taxAnnual, value: money(result.incomeTaxAnnual) },
          { label: copy.labels.contributionAnnual, value: money(result.employeeContributionAnnual) }
        ],
        sections: [
          {
            heading: copy.labels.taxBuild,
            rows: [
              [copy.labels.professionalExpense, money(result.professionalExpenseDeductionAnnual)],
              [copy.labels.taxableAnnual, money(result.taxableAnnual)],
              [copy.labels.taxMonthly, money(result.incomeTaxMonthlyEquivalent)],
              [copy.labels.effective, percentage(result.effectiveDeductionRate)]
            ]
          },
          {
            heading: copy.labels.source,
            rows: [
              [copy.labels.checked, 'Comoros Code general des impots 2023, articles 47, 55-60, 97 and 104-106 - checked 22 July 2026'],
              [copy.labels.contributionLimit, copy.contributionLimitation],
              [copy.labels.use, copy.planningDisclaimer]
            ]
          }
        ],
        skipGate: true
      });
      status.classList.remove('error');
      status.textContent = copy.pdfReady;
    } catch (error) {
      status.textContent = copy.pdfError || copy.validationError;
      status.classList.add('error');
    }
  });

  setActionState(false);
}());
