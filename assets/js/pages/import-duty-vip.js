(function () {
  'use strict';
  var engine = window.AfroImportDutyNigeriaEngine;
  var form = document.getElementById('importDutyForm');
  var result = document.getElementById('importDutyResult');
  var status = document.getElementById('importDutyStatus');
  var copyButton = document.getElementById('copyImportDuty');
  var shareButton = document.getElementById('shareImportDuty');
  var pdfButton = document.getElementById('pdfImportDuty');
  var clearButton = document.getElementById('clearImportDuty');
  var locale = window.ImportDutyLocale || {};
  var current = null;
  if (!engine || !form || !result || !status) return;

  function value(id) { return document.getElementById(id).value; }
  function checked(id) { return document.getElementById(id).checked; }
  function usd(value) { return new Intl.NumberFormat(locale.numberLocale || 'en-NG', { style: 'currency', currency: 'USD' }).format(value); }
  function ngn(value) { return new Intl.NumberFormat(locale.numberLocale || 'en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value); }
  function escape(value) { return String(value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function line(label, value, note) { return '<div class="idv-line"><span>' + escape(label) + (note ? '<small>' + escape(note) + '</small>' : '') + '</span><strong>' + escape(value) + '</strong></div>'; }
  function setActions(enabled) { copyButton.disabled = !enabled; shareButton.disabled = !enabled; pdfButton.disabled = !enabled; }

  function input() {
    return {
      itemType: value('itemType'), itemName: value('itemName'), hsCode: value('hsCode'),
      fob: value('fob'), freight: value('freight'), insurance: value('insurance'),
      customsValue: value('customsValue'), dutyRate: value('dutyRate'),
      otherImportCharges: value('otherImportCharges'), vatRate: value('vatRate'),
      portCharges: value('portCharges'), clearingFee: value('clearingFee'), fxRate: value('fxRate'),
      classificationConfirmed: checked('classificationConfirmed'), quoteConfirmed: checked('quoteConfirmed')
    };
  }

  function summary(data) {
    return [
      locale.pdfTitle || 'Nigeria import-duty planning worksheet',
      (locale.item || 'Item') + ': ' + (data.itemName || data.itemType),
      'HS: ' + (data.hsCode || (locale.notEntered || 'not entered')),
      (locale.cif || 'CIF') + ': ' + usd(data.cif),
      (locale.customsValue || 'Customs value') + ': ' + usd(data.customsValue),
      (locale.duty || 'Duty') + ' (' + data.dutyRate + '%): ' + usd(data.duty),
      (locale.otherCharges || 'Other import charges') + ': ' + usd(data.otherImportCharges),
      'VAT (' + data.vatRate + '%): ' + usd(data.vat),
      (locale.portClearing || 'Port and clearing') + ': ' + usd(data.portCharges + data.clearingFee),
      (locale.total || 'Planning total') + ': ' + usd(data.totalUsd) + (data.totalNgn !== null ? ' / ' + ngn(data.totalNgn) : ''),
      (locale.reviewed || 'Sources reviewed') + ': 22 July 2026',
      locale.disclaimer || 'Planning estimate only. Confirm the HS classification, customs value, charges and declaration with Nigeria Customs Service or a licensed customs professional.'
    ].join('\n');
  }

  function render(data) {
    var state = data.reviewRequired ? (locale.review || 'Needs verification') : (locale.ready || 'Inputs confirmed');
    result.innerHTML = '<div class="idv-result-head"><span>' + escape(state) + '</span><p>' + escape(locale.total || 'Planning landed cost') + '</p><strong>' + escape(usd(data.totalUsd)) + '</strong>' +
      (data.totalNgn !== null ? '<small>' + escape(ngn(data.totalNgn)) + '</small>' : '<small>' + escape(locale.fxPrompt || 'Add your declaration FX rate for an NGN view.') + '</small>') + '</div>' +
      '<div class="idv-lines">' +
      line(locale.fob || 'Invoice / FOB value', usd(data.fob)) +
      line(locale.freightInsurance || 'Freight and insurance', usd(data.freight + data.insurance)) +
      line(locale.cif || 'CIF', usd(data.cif), locale.derived || 'Derived from your inputs') +
      line(locale.customsValue || 'Customs value used', usd(data.customsValue), data.customsValueSource === 'user' ? (locale.userEntered || 'User entered') : (locale.cifFallback || 'CIF fallback')) +
      line((locale.duty || 'Customs duty') + ' · ' + data.dutyRate + '%', usd(data.duty)) +
      line(locale.otherCharges || 'Other import charges', usd(data.otherImportCharges), locale.userEntered || 'User entered') +
      line('VAT · ' + data.vatRate + '%', usd(data.vat), (locale.vatBase || 'VAT base') + ': ' + usd(data.vatBase)) +
      line(locale.portClearing || 'Port and clearing', usd(data.portCharges + data.clearingFee), locale.userEntered || 'User entered') + '</div>' +
      '<div class="idv-result-note"><strong>' + escape(locale.beforePaying || 'Before paying') + '</strong><p>' + escape(data.reviewRequired ? (locale.reviewNote || 'Confirm the HS code, rate and current quotes before relying on this estimate.') : (locale.confirmedNote || 'You confirmed the classification and quote inputs. Final assessment still belongs to NCS.')) + '</p></div>';
    result.hidden = false;
    setActions(true);
    status.textContent = locale.calculated || 'Estimate updated locally. Nothing was sent or stored.';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var output = engine.calculate(input());
    if (!output.valid) { status.textContent = locale.invalid || 'Review the highlighted values.'; return; }
    current = output; render(output);
  });

  form.addEventListener('input', function () {
    if (current) status.textContent = locale.changed || 'Inputs changed. Calculate again to refresh the estimate.';
  });

  clearButton.addEventListener('click', function () {
    form.reset(); document.getElementById('vatRate').value = '7.5'; current = null;
    result.hidden = true; result.innerHTML = ''; setActions(false);
    status.textContent = locale.cleared || 'Cleared. Nothing was stored or sent.';
  });

  copyButton.addEventListener('click', function () {
    if (!current) return;
    navigator.clipboard.writeText(summary(current)).then(function () { status.textContent = locale.copied || 'Summary copied.'; });
  });

  shareButton.addEventListener('click', function () {
    var payload = { title: locale.shareTitle || document.title, url: location.origin + location.pathname };
    if (navigator.share) navigator.share(payload).catch(function () {});
    else navigator.clipboard.writeText(payload.url).then(function () { status.textContent = locale.linkCopied || 'Calculator link copied without amounts.'; });
  });

  pdfButton.addEventListener('click', function () {
    if (!current || !window.jspdf || !window.jspdf.jsPDF) { status.textContent = locale.pdfError || 'PDF support is unavailable.'; return; }
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    var pdfText = [
      'Nigeria import-duty planning worksheet',
      'Item: ' + (current.itemName || current.itemType),
      'HS: ' + (current.hsCode || 'not entered'),
      'CIF value: USD ' + current.cif.toFixed(2),
      'Customs value: USD ' + current.customsValue.toFixed(2),
      'Customs duty (' + current.dutyRate + '%): USD ' + current.duty.toFixed(2),
      'Other import charges: USD ' + current.otherImportCharges.toFixed(2),
      'VAT (' + current.vatRate + '%): USD ' + current.vat.toFixed(2),
      'Port and clearing: USD ' + (current.portCharges + current.clearingFee).toFixed(2),
      'Planning landed cost: USD ' + current.totalUsd.toFixed(2),
      current.totalNgn !== null ? 'Planning landed cost: NGN ' + current.totalNgn.toFixed(2) : 'NGN view: no declaration FX rate entered',
      'Sources reviewed: 22 July 2026',
      'Planning estimate only. Confirm the HS classification, customs value, charges and declaration with Nigeria Customs Service or a licensed customs professional.'
    ];
    var lines = doc.splitTextToSize(pdfText.join('\n'), 500);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(locale.pdfTitle || 'Nigeria import-duty planning worksheet', 48, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(lines.slice(1), 48, 86, { lineHeightFactor: 1.5 });
    doc.save('afrotools-nigeria-import-duty-plan.pdf');
    status.textContent = locale.pdfReady || 'Private PDF downloaded locally.';
  });

  setActions(false);
}());
