(function () {
  'use strict';

  var copy = window.GhanaWhtPage || {};
  var engine = window.AfroTools && window.AfroTools.ghanaWht;
  var ids = ['payerContext', 'residence', 'recipientType', 'hasGhanaPe', 'category', 'grossAmount', 'yearToDateBefore', 'paymentDate', 'useApprovedTreatyRate', 'approvedTreatyRate', 'beneficialOwner', 'graApproval'];
  var fields = {};
  ids.forEach(function (id) { fields[id] = document.getElementById(id); });
  var calculateButton = document.getElementById('calculateBtn');
  var clearButton = document.getElementById('clearBtn');
  var copyButton = document.getElementById('copyBtn');
  var shareButton = document.getElementById('shareBtn');
  var pdfButton = document.getElementById('pdfBtn');
  var status = document.getElementById('status');
  var results = document.getElementById('resultsCard');
  var nonResidentPanel = document.getElementById('nonResidentPanel');
  var treatyPanel = document.getElementById('treatyPanel');
  var current = null;

  if (!calculateButton || !clearButton || !copyButton || !shareButton || !pdfButton || !status || !results) return;

  function money(value) {
    return Number(value || 0).toLocaleString(copy.numberLocale || 'en-GH', {
      style: 'currency', currency: 'GHS', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
  function percentage(value) { return Number(value || 0).toLocaleString(copy.numberLocale || 'en-GH', { maximumFractionDigits: 2 }) + '%'; }
  function date(value) {
    if (!value) return copy.notAvailable;
    return new Intl.DateTimeFormat(copy.numberLocale || 'en-GH', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  }
  function set(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }
  function actionState(enabled) { copyButton.disabled = !enabled; pdfButton.disabled = !enabled; }
  function stale(message, error) {
    current = null;
    results.classList.remove('on');
    status.textContent = message || copy.ready;
    status.classList.toggle('error', Boolean(error));
    actionState(false);
  }
  function syncConditional() {
    var nonResident = fields.residence.value === 'non-resident';
    nonResidentPanel.classList.toggle('on', nonResident);
    if (!nonResident) {
      fields.hasGhanaPe.checked = false;
      fields.useApprovedTreatyRate.checked = false;
    }
    treatyPanel.classList.toggle('on', nonResident && fields.useApprovedTreatyRate.checked);
  }
  function input() {
    return {
      payerContext: fields.payerContext.value,
      residence: fields.residence.value,
      recipientType: fields.recipientType.value,
      hasGhanaPe: fields.hasGhanaPe.checked,
      category: fields.category.value,
      grossAmount: fields.grossAmount.value,
      yearToDateBefore: fields.yearToDateBefore.value || 0,
      paymentDate: fields.paymentDate.value,
      useApprovedTreatyRate: fields.useApprovedTreatyRate.checked,
      approvedTreatyRate: fields.approvedTreatyRate.value,
      beneficialOwner: fields.beneficialOwner.checked,
      graApproval: fields.graApproval.checked
    };
  }
  function selectedLabel(field) { return field.options[field.selectedIndex].textContent.trim(); }
  function caveatsFor(value) {
    var caveats = (value.caveats || []).slice();
    if (value.reason) caveats.unshift(value.reason);
    if (!caveats.length) caveats.push(copy.defaultCaveat);
    return caveats;
  }
  function render(value) {
    var monetary = value.withheld !== null && value.withheld !== undefined;
    set('resultStatus', copy.statuses[value.status] || value.status);
    set('withheldResult', monetary ? money(value.withheld) : copy.needsReview);
    set('grossResult', money(value.grossAmount));
    set('netResult', value.netPayment !== null && value.netPayment !== undefined ? money(value.netPayment) : copy.needsReview);
    set('categoryResult', value.categoryLabel || selectedLabel(fields.category));
    set('domesticRateResult', value.domesticRate !== undefined ? percentage(value.domesticRate) : copy.notAvailable);
    set('appliedRateResult', value.appliedRate !== null && value.appliedRate !== undefined ? percentage(value.appliedRate) : copy.needsReview);
    set('annualTotalResult', value.annualContractTotal !== undefined ? money(value.annualContractTotal) : copy.notAvailable);
    set('thresholdResult', value.thresholdApplies ? (value.thresholdMet ? copy.thresholdMet : copy.thresholdNotMet) : copy.notApplicable);
    set('treatmentResult', copy.treatments[value.treatment] || copy.notAvailable);
    set('remittanceResult', date(value.remittanceDate));
    document.getElementById('resultCaveats').innerHTML = caveatsFor(value).map(function (item) { var li = document.createElement('li'); li.textContent = item; return li.outerHTML; }).join('');
    results.classList.add('on');
    results.focus({ preventScroll: true });
    status.classList.remove('error');
    status.textContent = copy.success;
    actionState(true);
  }
  function calculate() {
    if (!engine || typeof engine.calculate !== 'function') return stale(copy.engineError, true);
    if (fields.grossAmount.value.trim() === '') return stale(copy.grossError, true);
    try {
      current = engine.calculate(input());
      render(current);
    } catch (error) {
      stale((copy.errors && copy.errors[error.message]) || error.message || copy.validationError, true);
    }
  }
  function summary() {
    return copy.summary({
      status: copy.statuses[current.status] || current.status,
      category: current.categoryLabel || selectedLabel(fields.category),
      gross: money(current.grossAmount),
      domesticRate: current.domesticRate !== undefined ? percentage(current.domesticRate) : copy.notAvailable,
      appliedRate: current.appliedRate !== null && current.appliedRate !== undefined ? percentage(current.appliedRate) : copy.needsReview,
      withheld: current.withheld !== null && current.withheld !== undefined ? money(current.withheld) : copy.needsReview,
      net: current.netPayment !== null && current.netPayment !== undefined ? money(current.netPayment) : copy.needsReview,
      remittance: date(current.remittanceDate)
    });
  }
  async function clipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var node = document.createElement('textarea');
    node.value = text; node.setAttribute('readonly', ''); node.style.position = 'fixed'; node.style.opacity = '0';
    document.body.appendChild(node); node.select(); document.execCommand('copy'); node.remove();
  }

  calculateButton.addEventListener('click', calculate);
  clearButton.addEventListener('click', function () {
    document.getElementById('whtForm').reset();
    fields.paymentDate.value = copy.defaultDate;
    syncConditional(); stale(copy.cleared, false); fields.payerContext.focus();
  });
  ids.forEach(function (id) {
    fields[id].addEventListener('change', function () { syncConditional(); if (current) stale(copy.changed, false); });
    fields[id].addEventListener('input', function () { if (current) stale(copy.changed, false); });
  });
  document.getElementById('whtForm').addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  copyButton.addEventListener('click', async function () {
    if (!current) return;
    try { await clipboard(summary()); status.textContent = copy.copied; } catch (error) { stale(copy.copyError, true); }
  });
  shareButton.addEventListener('click', async function () {
    var payload = { title: copy.shareTitle, url: copy.canonical };
    try {
      if (navigator.share) await navigator.share(payload);
      else { await clipboard(payload.url); status.textContent = copy.linkCopied; }
    } catch (error) { if (!error || error.name !== 'AbortError') { status.textContent = copy.shareError; status.classList.add('error'); } }
  });
  pdfButton.addEventListener('click', async function () {
    if (!current) return;
    if (!(window.AfroTools && window.AfroTools.pdf && typeof window.AfroTools.pdf.generate === 'function')) { status.textContent = copy.pdfLoading; return; }
    try {
      await window.AfroTools.pdf.generate({
        filename: copy.pdfFilename, title: copy.pdfTitle, subtitle: copy.pdfSubtitle, country: 'Ghana', currency: 'GHS', skipGate: true,
        summary: [
          { label: copy.labels.status, value: copy.statuses[current.status] || current.status },
          { label: copy.labels.withheld, value: current.withheld !== null && current.withheld !== undefined ? money(current.withheld) : copy.needsReview },
          { label: copy.labels.gross, value: money(current.grossAmount) },
          { label: copy.labels.net, value: current.netPayment !== null && current.netPayment !== undefined ? money(current.netPayment) : copy.needsReview }
        ],
        sections: [
          { heading: copy.labels.classification, rows: [[copy.labels.category, current.categoryLabel || selectedLabel(fields.category)], [copy.labels.residence, selectedLabel(fields.residence)], [copy.labels.recipient, selectedLabel(fields.recipientType)], [copy.labels.rate, current.appliedRate !== null && current.appliedRate !== undefined ? percentage(current.appliedRate) : copy.needsReview], [copy.labels.remittance, date(current.remittanceDate)]] },
          { heading: copy.labels.sources, rows: [[copy.labels.reviewed, '22 July 2026'], [copy.labels.authority, engine.metadata.sourceUrl], [copy.labels.law, engine.metadata.lawUrl], [copy.labels.limitations, caveatsFor(current).join(' ')]] }
        ]
      });
      status.classList.remove('error'); status.textContent = copy.pdfReady;
    } catch (error) { status.textContent = copy.pdfError; status.classList.add('error'); }
  });

  syncConditional();
  actionState(false);
}());
