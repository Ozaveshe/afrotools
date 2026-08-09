(function () {
  'use strict';

  var root = document.querySelector('[data-creator-invoice-app]');
  if (!root) return;
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorInvoice;
  if (!engine) return;
  var fr = document.documentElement.lang.toLowerCase().indexOf('fr') === 0;
  var sw = document.documentElement.lang.toLowerCase().indexOf('sw') === 0;
  var locale = fr ? 'fr-FR' : sw ? 'sw-KE' : 'en';
  var storageKey = 'afrotools.creatorInvoice.local.v2';
  var lastResult = null;
  var text = sw ? {
    missing: 'Jaza mtoa huduma, mteja, namba ya ankara na angalau huduma moja halali.',
    ready: 'Ankara imekokotolewa. Thibitisha masharti ya eneo lako kabla ya kuituma.',
    saved: 'Rasimu imehifadhiwa kwenye kivinjari hiki.', loaded: 'Rasimu ya ndani imerejeshwa.',
    noDraft: 'Hakuna rasimu ya ndani iliyohifadhiwa.', copied: 'Muhtasari umenakiliwa.',
    downloaded: 'Faili imepakuliwa.', pdfError: 'PDF haikuweza kutengenezwa.', items: 'Huduma',
    subtotal: 'Jumla ndogo', discount: 'Punguzo', tax: 'Kodi', total: 'Jumla'
  } : fr ? {
    missing: 'Complétez le nom de l’émetteur, le client, le numéro et au moins une ligne valide.',
    ready: 'Facture calculée. Vérifiez les mentions obligatoires avant de l’envoyer.',
    saved: 'Brouillon enregistré dans ce navigateur.',
    loaded: 'Brouillon local restauré.',
    noDraft: 'Aucun brouillon local enregistré.',
    copied: 'Résumé copié.',
    downloaded: 'Export téléchargé.',
    pdfError: 'Le PDF n’a pas pu être généré.',
    items: 'Prestations',
    subtotal: 'Sous-total',
    discount: 'Remise',
    tax: 'Taxe',
    total: 'Total'
  } : {
    missing: 'Complete the issuer, client, invoice number and at least one valid line item.',
    ready: 'Invoice calculated. Check required local invoice details before sending.',
    saved: 'Draft saved in this browser.',
    loaded: 'Local draft restored.',
    noDraft: 'No local draft is saved.',
    copied: 'Summary copied.',
    downloaded: 'Export downloaded.',
    pdfError: 'The PDF could not be generated.',
    items: 'Services',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    total: 'Total'
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function value(id) {
    var element = byId(id);
    return element ? element.value : '';
  }

  function collect() {
    var items = Array.prototype.map.call(root.querySelectorAll('[data-invoice-line]'), function (line) {
      return {
        description: line.querySelector('[data-line-description]').value,
        quantity: line.querySelector('[data-line-quantity]').value,
        unitPrice: line.querySelector('[data-line-price]').value
      };
    });
    return {
      issuerName: value('ciIssuerName'),
      issuerEmail: value('ciIssuerEmail'),
      clientName: value('ciClientName'),
      clientEmail: value('ciClientEmail'),
      invoiceNumber: value('ciNumber'),
      issuedDate: value('ciIssuedDate'),
      dueDate: value('ciDueDate'),
      currency: value('ciCurrency'),
      taxLabel: value('ciTaxLabel'),
      taxRate: value('ciTaxRate'),
      discountType: value('ciDiscountType'),
      discountValue: value('ciDiscountValue'),
      notes: value('ciNotes'),
      items: items
    };
  }

  function money(valueInCents, currency) {
    return engine.formatCurrency(valueInCents, currency, locale);
  }

  function setStatus(message, error) {
    byId('ciError').textContent = error ? message : '';
    byId('ciStatus').textContent = error ? '' : message;
  }

  function render(invoice) {
    byId('ciPreviewNumber').textContent = invoice.invoiceNumber;
    byId('ciPreviewParties').textContent = invoice.issuer.name + ' → ' + invoice.client.name;
    byId('ciPreviewItems').innerHTML = invoice.items.map(function (item) {
      return '<div class="cb-preview-item"><span>' + escapeHtml(item.description) + ' × ' + item.quantity + '</span><strong>' + escapeHtml(money(item.total, invoice.currency)) + '</strong></div>';
    }).join('');
    byId('ciPreviewSubtotal').textContent = money(invoice.subtotal, invoice.currency);
    byId('ciPreviewDiscountRow').hidden = !invoice.discount;
    byId('ciPreviewDiscount').textContent = invoice.discount ? '-' + money(invoice.discount, invoice.currency) : '—';
    byId('ciPreviewTaxRow').hidden = !invoice.tax;
    byId('ciPreviewTaxLabel').textContent = invoice.taxLabel + ' (' + invoice.taxRate + '%)';
    byId('ciPreviewTax').textContent = money(invoice.tax, invoice.currency);
    byId('ciPreviewTotal').textContent = money(invoice.total, invoice.currency);
    byId('ciPreview').hidden = false;
    root.querySelectorAll('[data-needs-invoice]').forEach(function (button) {
      button.disabled = false;
    });
  }

  function calculate(event) {
    if (event) event.preventDefault();
    var invoice = engine.createInvoice(collect());
    if (!invoice.valid) {
      lastResult = null;
      byId('ciPreview').hidden = true;
      root.querySelectorAll('[data-needs-invoice]').forEach(function (button) {
        button.disabled = true;
      });
      setStatus(text.missing, true);
      return null;
    }
    invoice.locale = locale;
    lastResult = invoice;
    window.__creatorInvoiceLastResult = invoice;
    render(invoice);
    setStatus(text.ready, false);
    return invoice;
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function safeFilename(extension) {
    var base = (lastResult && lastResult.invoiceNumber || 'invoice').replace(/[^a-z0-9_-]+/gi, '-');
    return base + '.' + extension;
  }

  root.querySelector('form').addEventListener('submit', calculate);
  byId('ciSave').addEventListener('click', function () {
    localStorage.setItem(storageKey, JSON.stringify(collect()));
    setStatus(text.saved, false);
  });
  byId('ciLoad').addEventListener('click', function () {
    var raw = localStorage.getItem(storageKey);
    if (!raw) return setStatus(text.noDraft, true);
    try {
      var data = JSON.parse(raw);
      Object.keys({
        ciIssuerName: 'issuerName', ciIssuerEmail: 'issuerEmail', ciClientName: 'clientName',
        ciClientEmail: 'clientEmail', ciNumber: 'invoiceNumber', ciIssuedDate: 'issuedDate',
        ciDueDate: 'dueDate', ciCurrency: 'currency', ciTaxLabel: 'taxLabel',
        ciTaxRate: 'taxRate', ciDiscountType: 'discountType', ciDiscountValue: 'discountValue',
        ciNotes: 'notes'
      }).forEach(function (id) {
        var key = {
          ciIssuerName: 'issuerName', ciIssuerEmail: 'issuerEmail', ciClientName: 'clientName',
          ciClientEmail: 'clientEmail', ciNumber: 'invoiceNumber', ciIssuedDate: 'issuedDate',
          ciDueDate: 'dueDate', ciCurrency: 'currency', ciTaxLabel: 'taxLabel',
          ciTaxRate: 'taxRate', ciDiscountType: 'discountType', ciDiscountValue: 'discountValue',
          ciNotes: 'notes'
        }[id];
        if (byId(id) && data[key] != null) byId(id).value = data[key];
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-invoice-line]'), function (line, index) {
        var item = data.items && data.items[index] || {};
        line.querySelector('[data-line-description]').value = item.description || '';
        line.querySelector('[data-line-quantity]').value = item.quantity || 1;
        line.querySelector('[data-line-price]').value = item.unitPrice || '';
      });
      calculate();
      setStatus(text.loaded, false);
    } catch (_) {
      setStatus(text.noDraft, true);
    }
  });
  byId('ciCopy').addEventListener('click', async function () {
    if (!lastResult) return;
    var summary = engine.serializeText(lastResult, locale);
    try {
      await navigator.clipboard.writeText(summary);
    } catch (_) {
      var area = document.createElement('textarea');
      area.value = summary;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setStatus(text.copied, false);
  });
  byId('ciJson').addEventListener('click', function () {
    if (!lastResult) return;
    download(new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json;charset=utf-8' }), safeFilename('json'));
    setStatus(text.downloaded, false);
  });
  byId('ciText').addEventListener('click', function () {
    if (!lastResult) return;
    download(new Blob([engine.serializeText(lastResult, locale)], { type: 'text/plain;charset=utf-8' }), safeFilename('txt'));
    setStatus(text.downloaded, false);
  });
  async function generateSwPDF(invoice) {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('PDF_LIBRARY_UNAVAILABLE');
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var y = 20;
    function line(label, value) { doc.text(label + ': ' + value, 20, y); y += 7; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('ANKARA ' + invoice.invoiceNumber, 20, y); y += 12;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    line('Mtoa huduma', invoice.issuer.name + (invoice.issuer.email ? ' <' + invoice.issuer.email + '>' : ''));
    line('Mteja', invoice.client.name + (invoice.client.email ? ' <' + invoice.client.email + '>' : ''));
    line('Imetolewa', invoice.issuedDate); line('Mwisho', invoice.dueDate); y += 3;
    invoice.items.forEach(function (item) { line(item.description, item.quantity + ' x ' + money(item.unitPrice, invoice.currency) + ' = ' + money(item.total, invoice.currency)); });
    y += 3; line('Jumla ndogo', money(invoice.subtotal, invoice.currency));
    if (invoice.discount) line('Punguzo', '-' + money(invoice.discount, invoice.currency));
    if (invoice.tax) line(invoice.taxLabel + ' (' + invoice.taxRate + '%)', money(invoice.tax, invoice.currency));
    doc.setFont('helvetica', 'bold'); line('Jumla', money(invoice.total, invoice.currency)); doc.setFont('helvetica', 'normal');
    if (invoice.notes) { y += 3; line('Maelezo', invoice.notes); }
    doc.setFontSize(7); doc.text('Rasimu imetengenezwa ndani kwa AfroTools.', 105, 286, { align: 'center' });
    return doc.output('blob');
  }
  byId('ciPdf').addEventListener('click', async function () {
    if (!lastResult) return;
    try {
      var blob = sw ? await generateSwPDF(lastResult) : await engine.generatePDF(lastResult);
      download(blob, safeFilename('pdf'));
      setStatus(text.downloaded, false);
    } catch (_) {
      setStatus(text.pdfError, true);
    }
  });

  (function setDates() {
    var today = new Date();
    var due = new Date(today.getTime());
    due.setDate(due.getDate() + 14);
    if (!byId('ciIssuedDate').value) byId('ciIssuedDate').value = today.toISOString().slice(0, 10);
    if (!byId('ciDueDate').value) byId('ciDueDate').value = due.toISOString().slice(0, 10);
  })();

  function escapeHtml(valueToEscape) {
    var node = document.createElement('div');
    node.textContent = valueToEscape == null ? '' : String(valueToEscape);
    return node.innerHTML;
  }
})();
