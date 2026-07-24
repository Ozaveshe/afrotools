(function () {
  'use strict';
  var copy = window.SomaliaPayePage || {};
  var engine = window.AfroTools && window.AfroTools.somaliaPaye;
  var income = document.getElementById('grossSalary');
  var category = document.getElementById('taxpayerCategory');
  var resultCard = document.getElementById('resultsCard');
  var status = document.getElementById('status');
  var result = null;

  function money(value) { return 'USD ' + Number(value || 0).toLocaleString(copy.numberLocale || 'en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function set(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }
  function reset(message, error) { result = null; resultCard.classList.remove('on'); status.textContent = message; status.classList.toggle('error', Boolean(error)); }
  function calculate() {
    if (!engine) return reset(copy.engineError, true);
    var value = Number(income.value);
    if (!Number.isFinite(value) || value <= 0) return reset(copy.validationError, true);
    result = engine.calculate({ grossMonthly: value, category: category.value });
    set('netMonthly', money(result.netMonthly));
    set('grossResult', money(result.grossMonthly));
    set('taxMonthly', money(result.taxMonthly));
    set('effectiveRate', (result.effectiveRate * 100).toFixed(1) + '%');
    set('annualGross', money(result.grossAnnual));
    set('annualTax', money(result.taxAnnual));
    set('annualNet', money(result.netAnnual));
    set('categoryResult', copy.categoryLabels[result.category]);
    resultCard.classList.add('on'); status.classList.remove('error'); status.textContent = copy.success;
  }
  async function clipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var field = document.createElement('textarea'); field.value = text; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select(); document.execCommand('copy'); field.remove();
  }

  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('clearBtn').addEventListener('click', function () { income.value = ''; category.value = 'resident-adult'; reset(copy.cleared, false); income.focus(); });
  [income, category].forEach(function (node) { node.addEventListener('input', function () { if (result) reset(copy.changed, false); }); node.addEventListener('keydown', function (event) { if (event.key === 'Enter') calculate(); }); });
  document.getElementById('copyBtn').addEventListener('click', async function () { if (!result) return; await clipboard(copy.summary({ gross: money(result.grossMonthly), tax: money(result.taxMonthly), net: money(result.netMonthly), category: copy.categoryLabels[result.category] })); status.textContent = copy.copied; });
  document.getElementById('shareBtn').addEventListener('click', async function () { var payload = { title: copy.shareTitle, url: copy.canonical }; if (navigator.share) await navigator.share(payload); else { await clipboard(payload.url); status.textContent = copy.linkCopied; } });
  document.getElementById('pdfBtn').addEventListener('click', async function () {
    if (!result) return;
    if (!(window.AfroTools && window.AfroTools.pdf)) { status.textContent = copy.pdfLoading; return; }
    await window.AfroTools.pdf.generate({ filename: copy.pdfFilename, title: copy.pdfTitle, subtitle: copy.pdfSubtitle, country: 'Somalia', currency: 'USD', summary: [{ label: copy.labels.net, value: money(result.netMonthly) }, { label: copy.labels.gross, value: money(result.grossMonthly) }, { label: copy.labels.tax, value: money(result.taxMonthly) }, { label: copy.labels.category, value: copy.categoryLabels[result.category] }], sections: [{ heading: copy.labels.annual, rows: [[copy.labels.annualGross, money(result.grossAnnual)], [copy.labels.annualTax, money(result.taxAnnual)], [copy.labels.annualNet, money(result.netAnnual)]] }, { heading: copy.labels.source, rows: [[copy.labels.checked, 'Somalia Income Tax Law and Regulations 2025; MoF Income Tax Manual - 22 July 2026'], [copy.labels.use, copy.planningDisclaimer]] }], skipGate: true });
    status.textContent = copy.pdfReady;
  });
}());
