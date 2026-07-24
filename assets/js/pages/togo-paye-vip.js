(function () {
  'use strict';
  var config = window.TogoPayePage || {};
  var engine = window.AfroTools && window.AfroTools.togoPaye;
  var grossInput = document.getElementById('grossSalary');
  var dependentsInput = document.getElementById('dependents');
  var results = document.getElementById('resultsCard');
  var status = document.getElementById('status');
  var lastResult = null;
  var locale = config.locale || 'en';

  function format(value) {
    return 'XOF ' + Math.round(Number(value || 0)).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en');
  }
  function setText(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }
  function clearResult(message, error) {
    lastResult = null;
    results.classList.remove('on');
    status.textContent = message;
    status.classList.toggle('error', Boolean(error));
  }
  function calculate() {
    var monthlyGross = Number(grossInput.value);
    if (!engine) return clearResult(config.engineError, true);
    if (!Number.isFinite(monthlyGross) || monthlyGross <= 0) return clearResult(config.validationError, true);
    lastResult = engine.calculate({ grossAnnual: monthlyGross * 12, dependents: dependentsInput.value });
    if (!lastResult.ok) return clearResult(lastResult.error, true);
    setText('netMonthly', format(lastResult.netMonthly));
    setText('grossResult', format(lastResult.grossMonthly));
    setText('employeeCnss', format(lastResult.employeeCnssMonthly));
    setText('professionalDeduction', format(lastResult.professionalDeduction));
    setText('dependentRelief', format(lastResult.dependentRelief));
    setText('taxableIncome', format(lastResult.taxableIncome));
    setText('payeMonthly', format(lastResult.payeMonthly));
    setText('employerCnss', format(lastResult.employerCnssMonthly));
    setText('employerCost', format(lastResult.employerCostMonthly));
    setText('effectiveRate', (lastResult.effectiveDeductionRate * 100).toFixed(1) + '%');
    setText('annualSummary', config.annualSummary(format(lastResult.netAnnual), format(lastResult.payeAnnual), format(lastResult.employeeCnssAnnual)));
    results.classList.add('on');
    status.classList.remove('error');
    status.textContent = config.success;
  }
  function summaryText() {
    return config.summary({
      gross: format(lastResult.grossMonthly),
      cnss: format(lastResult.employeeCnssMonthly),
      paye: format(lastResult.payeMonthly),
      net: format(lastResult.netMonthly),
      employerCnss: format(lastResult.employerCnssMonthly),
      employerCost: format(lastResult.employerCostMonthly)
    });
  }
  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var area = document.createElement('textarea'); area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
  }
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('clearBtn').addEventListener('click', function () {
    grossInput.value = ''; dependentsInput.value = '0'; clearResult(config.cleared, false); grossInput.focus();
  });
  [grossInput, dependentsInput].forEach(function (input) {
    input.addEventListener('input', function () { if (lastResult) clearResult(config.changed, false); });
    input.addEventListener('keydown', function (event) { if (event.key === 'Enter') calculate(); });
  });
  document.getElementById('copyBtn').addEventListener('click', async function () {
    if (!lastResult) return; await copyText(summaryText()); status.textContent = config.copied;
  });
  document.getElementById('shareBtn').addEventListener('click', async function () {
    var data = { title: config.shareTitle, url: config.canonical };
    if (navigator.share) await navigator.share(data); else { await copyText(data.url); status.textContent = config.linkCopied; }
  });
  document.getElementById('pdfBtn').addEventListener('click', async function () {
    if (!lastResult) return;
    if (!window.AfroTools || !window.AfroTools.pdf) { status.textContent = config.pdfLoading; return; }
    await window.AfroTools.pdf.generate({
      filename: config.pdfFilename,
      title: config.pdfTitle,
      subtitle: config.pdfSubtitle,
      country: 'Togo', currency: 'XOF',
      summary: [
        { label: config.labels.gross, value: format(lastResult.grossMonthly) },
        { label: config.labels.cnss, value: format(lastResult.employeeCnssMonthly) },
        { label: config.labels.paye, value: format(lastResult.payeMonthly) },
        { label: config.labels.net, value: format(lastResult.netMonthly) }
      ],
      sections: [
        { heading: config.labels.taxBuild, rows: [[config.labels.professional, format(lastResult.professionalDeduction)], [config.labels.dependents, format(lastResult.dependentRelief)], [config.labels.taxable, format(lastResult.taxableIncome)]] },
        { heading: config.labels.employer, rows: [[config.labels.employerCnss, format(lastResult.employerCnssMonthly)], [config.labels.employerCost, format(lastResult.employerCostMonthly)]] },
        { heading: config.labels.source, rows: [[config.labels.checked, 'OTR consolidated CGI Articles 26 and 72-74; CNSS Togo contribution rules - 22 July 2026'], [config.labels.use, config.planningDisclaimer]] }
      ],
      skipGate: true
    });
    status.textContent = config.pdfReady;
  });
}());
