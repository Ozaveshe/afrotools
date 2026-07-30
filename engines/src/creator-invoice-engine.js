(function (window) {
  'use strict';

  var TAX_RATES = {
    NG: { rate: 7.5, name: 'VAT', required: false },
    KE: { rate: 16, name: 'VAT', required: true },
    ZA: { rate: 15, name: 'VAT', required: false },
    GH: { rate: 15, name: 'VAT', required: false },
    TZ: { rate: 18, name: 'VAT', required: false },
    EG: { rate: 14, name: 'VAT', required: false },
    RW: { rate: 18, name: 'VAT', required: false },
    UG: { rate: 18, name: 'VAT', required: false },
    ET: { rate: 15, name: 'VAT', required: false },
    SN: { rate: 18, name: 'TVA', required: false },
    CI: { rate: 18, name: 'TVA', required: false },
    CM: { rate: 19.25, name: 'TVA', required: false },
    MA: { rate: 20, name: 'TVA', required: false },
    TN: { rate: 19, name: 'TVA', required: false },
    DZ: { rate: 19, name: 'TVA', required: false },
    MG: { rate: 20, name: 'TVA', required: false },
    CD: { rate: 16, name: 'TVA', required: false },
    CG: { rate: 18.9, name: 'TVA', required: false },
    GA: { rate: 18, name: 'TVA', required: false },
    BF: { rate: 18, name: 'TVA', required: false },
    ML: { rate: 18, name: 'TVA', required: false },
    NE: { rate: 19, name: 'TVA', required: false },
    TD: { rate: 18, name: 'TVA', required: false },
    BJ: { rate: 18, name: 'TVA', required: false },
    TG: { rate: 18, name: 'TVA', required: false },
    GN: { rate: 18, name: 'TVA', required: false },
    DJ: { rate: 10, name: 'TVA', required: false },
    KM: { rate: 10, name: 'TVA', required: false }
  };

  var CURRENCIES = {
    NGN: { symbol: '₦', locale: 'en-NG', decimals: 2 },
    KES: { symbol: 'KES ', locale: 'en-KE', decimals: 2 },
    ZAR: { symbol: 'R', locale: 'en-ZA', decimals: 2 },
    GHS: { symbol: 'GH₵', locale: 'en-GH', decimals: 2 },
    XOF: { symbol: 'CFA ', locale: 'fr-SN', decimals: 0 },
    XAF: { symbol: 'FCFA ', locale: 'fr-CM', decimals: 0 },
    MAD: { symbol: 'MAD ', locale: 'fr-MA', decimals: 2 },
    USD: { symbol: '$', locale: 'en-US', decimals: 2 },
    EUR: { symbol: '€', locale: 'fr-FR', decimals: 2 },
    GBP: { symbol: '£', locale: 'en-GB', decimals: 2 }
  };

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, number(value)));
  }

  function cents(value) {
    return Math.round(Math.max(0, number(value)) * 100);
  }

  function formatCurrency(amountCents, currency, locale) {
    var code = CURRENCIES[currency] ? currency : 'USD';
    var config = CURRENCIES[code];
    var value = number(amountCents) / 100;
    try {
      return new Intl.NumberFormat(locale || config.locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
      }).format(value);
    } catch (_) {
      return config.symbol + value.toFixed(config.decimals);
    }
  }

  function calculateTotals(items, options) {
    var subtotal = (items || []).reduce(function (sum, item) {
      if (!item) return sum;
      return sum + Math.round(number(item.quantity) * number(item.unitPrice));
    }, 0);
    var opts = options || {};
    var discountValue = Math.max(0, number(opts.discountValue));
    var discount = opts.discountType === 'percentage'
      ? Math.round(subtotal * clamp(discountValue, 0, 100) / 100)
      : Math.min(subtotal, cents(discountValue));
    var taxable = Math.max(0, subtotal - discount);
    var taxRate = clamp(opts.taxRate, 0, 100);
    var tax = Math.round(taxable * taxRate / 100);
    return {
      subtotal: subtotal,
      discount: discount,
      taxable: taxable,
      taxRate: taxRate,
      tax: tax,
      total: taxable + tax
    };
  }

  function createInvoice(input) {
    var source = input || {};
    var items = (source.items || []).map(function (item, index) {
      var description = clean(item && item.description);
      var quantity = Math.max(0, number(item && item.quantity));
      var unitPrice = item && Number.isFinite(Number(item.unitPriceCents))
        ? Math.max(0, Math.round(Number(item.unitPriceCents)))
        : cents(item && item.unitPrice);
      return {
        id: index + 1,
        description: description,
        quantity: quantity,
        unitPrice: unitPrice,
        total: Math.round(quantity * unitPrice)
      };
    }).filter(function (item) {
      return item.description && item.quantity > 0;
    });

    var errors = [];
    var issuerName = clean(source.issuerName);
    var clientName = clean(source.clientName);
    var invoiceNumber = clean(source.invoiceNumber);
    if (!issuerName) errors.push('issuer');
    if (!clientName) errors.push('client');
    if (!invoiceNumber) errors.push('invoice-number');
    if (!items.length) errors.push('items');

    var totals = calculateTotals(items, {
      discountType: source.discountType,
      discountValue: source.discountValue,
      taxRate: source.taxRate
    });
    var currency = CURRENCIES[source.currency] ? source.currency : 'USD';

    return {
      valid: errors.length === 0,
      errors: errors,
      invoiceNumber: invoiceNumber,
      issuedDate: clean(source.issuedDate),
      dueDate: clean(source.dueDate),
      issuer: {
        name: issuerName,
        email: clean(source.issuerEmail)
      },
      client: {
        name: clientName,
        email: clean(source.clientEmail)
      },
      currency: currency,
      taxLabel: clean(source.taxLabel) || 'VAT / TVA',
      items: items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxable: totals.taxable,
      taxRate: totals.taxRate,
      tax: totals.tax,
      total: totals.total,
      notes: clean(source.notes),
      createdAt: new Date().toISOString()
    };
  }

  function serializeText(invoice, locale) {
    var fr = String(locale || '').toLowerCase().indexOf('fr') === 0;
    var labels = fr
      ? { title: 'FACTURE', from: 'Émetteur', client: 'Client', issued: 'Émise le', due: 'Échéance', subtotal: 'Sous-total', discount: 'Remise', tax: 'Taxe', total: 'Total', notes: 'Notes' }
      : { title: 'INVOICE', from: 'From', client: 'Client', issued: 'Issued', due: 'Due', subtotal: 'Subtotal', discount: 'Discount', tax: 'Tax', total: 'Total', notes: 'Notes' };
    var lines = [
      labels.title + ' ' + invoice.invoiceNumber,
      labels.from + ': ' + invoice.issuer.name + (invoice.issuer.email ? ' <' + invoice.issuer.email + '>' : ''),
      labels.client + ': ' + invoice.client.name + (invoice.client.email ? ' <' + invoice.client.email + '>' : ''),
      labels.issued + ': ' + invoice.issuedDate,
      labels.due + ': ' + invoice.dueDate,
      ''
    ];
    invoice.items.forEach(function (item) {
      lines.push(item.description + ' — ' + item.quantity + ' × ' + formatCurrency(item.unitPrice, invoice.currency, locale) + ' = ' + formatCurrency(item.total, invoice.currency, locale));
    });
    lines.push('');
    lines.push(labels.subtotal + ': ' + formatCurrency(invoice.subtotal, invoice.currency, locale));
    if (invoice.discount) lines.push(labels.discount + ': -' + formatCurrency(invoice.discount, invoice.currency, locale));
    if (invoice.tax) lines.push(invoice.taxLabel + ' (' + invoice.taxRate + '%): ' + formatCurrency(invoice.tax, invoice.currency, locale));
    lines.push(labels.total + ': ' + formatCurrency(invoice.total, invoice.currency, locale));
    if (invoice.notes) lines.push('', labels.notes + ': ' + invoice.notes);
    return lines.join('\n');
  }

  function getNextInvoiceNumber(existing) {
    var max = 0;
    (existing || []).forEach(function (value) {
      var match = String(value || '').match(/(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    });
    return 'INV-' + String(max + 1).padStart(3, '0');
  }

  function generateWhatsAppMessage(input) {
    var data = input || {};
    var total = formatCurrency(data.total || 0, data.currency || 'USD', data.locale || 'en');
    if (String(data.locale || '').indexOf('fr') === 0) {
      return 'Bonjour ' + (data.client_name || '') + ', voici la facture ' + (data.invoice_number || '') + ' de ' + total + ', à régler avant le ' + (data.due_date || 'la date convenue') + '. Merci.';
    }
    return 'Hi ' + (data.client_name || '') + ', here is invoice ' + (data.invoice_number || '') + ' for ' + total + ', due by ' + (data.due_date || 'the agreed date') + '. Thank you.';
  }

  function getPaymentTemplate(countryCode) {
    var templates = {
      NG: 'Bank transfer\nBank: [Bank]\nAccount number: [Number]\nAccount name: [Name]\nReference: [Invoice number]',
      KE: 'M-Pesa or bank transfer\nPaybill/account: [Details]\nReference: [Invoice number]',
      SN: 'Virement bancaire ou mobile money\nCoordonnées: [Détails]\nRéférence: [Numéro de facture]',
      CI: 'Virement bancaire ou mobile money\nCoordonnées: [Détails]\nRéférence: [Numéro de facture]',
      CM: 'Virement bancaire ou mobile money\nCoordonnées: [Détails]\nRéférence: [Numéro de facture]'
    };
    return templates[countryCode] || templates.NG;
  }

  function getDefaultNotes(countryCode) {
    return getPaymentTemplate(countryCode) + '\n\nPlease use the invoice number as the payment reference.';
  }

  function getOverdueInvoices(invoices) {
    var now = new Date();
    return (invoices || []).filter(function (invoice) {
      return invoice && !/^(paid|cancelled|draft)$/.test(invoice.status || '') && invoice.due_date && new Date(invoice.due_date) < now;
    });
  }

  async function generatePDF(invoiceInput, itemOverride) {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('PDF_LIBRARY_UNAVAILABLE');
    var invoice = invoiceInput && invoiceInput.valid !== undefined
      ? invoiceInput
      : createInvoice(Object.assign({}, invoiceInput || {}, { items: itemOverride || (invoiceInput && invoiceInput.items) || [] }));
    if (!invoice.valid) throw new Error('INVALID_INVOICE');
    var locale = invoice.locale || (window.document && window.document.documentElement.lang) || 'en';
    var fr = String(locale).toLowerCase().indexOf('fr') === 0;
    var decimals = CURRENCIES[invoice.currency] ? CURRENCIES[invoice.currency].decimals : 2;
    function pdfMoney(amountCents) {
      return invoice.currency + ' ' + (number(amountCents) / 100).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }
    var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var y = 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text(fr ? 'FACTURE' : 'INVOICE', 190, y, { align: 'right' });
    pdf.setFontSize(12);
    pdf.text(invoice.issuer.name, 20, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    if (invoice.issuer.email) pdf.text(invoice.issuer.email, 20, y + 6);
    y += 22;
    pdf.setFont('helvetica', 'bold');
    pdf.text((fr ? 'Client: ' : 'Bill to: ') + invoice.client.name, 20, y);
    pdf.text(invoice.invoiceNumber, 190, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    y += 6;
    pdf.text((fr ? 'Émise le: ' : 'Issued: ') + invoice.issuedDate, 190, y, { align: 'right' });
    y += 5;
    pdf.text((fr ? 'Échéance: ' : 'Due: ') + invoice.dueDate, 190, y, { align: 'right' });
    y += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.text(fr ? 'Description' : 'Description', 20, y);
    pdf.text(fr ? 'Qté' : 'Qty', 125, y, { align: 'right' });
    pdf.text(fr ? 'Prix' : 'Rate', 155, y, { align: 'right' });
    pdf.text('Total', 190, y, { align: 'right' });
    y += 5;
    pdf.line(20, y, 190, y);
    pdf.setFont('helvetica', 'normal');
    invoice.items.forEach(function (item) {
      y += 8;
      pdf.text(pdf.splitTextToSize(item.description, 85), 20, y);
      pdf.text(String(item.quantity), 125, y, { align: 'right' });
      pdf.text(pdfMoney(item.unitPrice), 155, y, { align: 'right' });
      pdf.text(pdfMoney(item.total), 190, y, { align: 'right' });
    });
    y += 12;
    pdf.line(115, y, 190, y);
    y += 7;
    pdf.text((fr ? 'Sous-total: ' : 'Subtotal: ') + pdfMoney(invoice.subtotal), 190, y, { align: 'right' });
    if (invoice.discount) {
      y += 6;
      pdf.text((fr ? 'Remise: -' : 'Discount: -') + pdfMoney(invoice.discount), 190, y, { align: 'right' });
    }
    if (invoice.tax) {
      y += 6;
      pdf.text(invoice.taxLabel + ' (' + invoice.taxRate + '%): ' + pdfMoney(invoice.tax), 190, y, { align: 'right' });
    }
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('TOTAL: ' + pdfMoney(invoice.total), 190, y, { align: 'right' });
    if (invoice.notes) {
      y += 14;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(pdf.splitTextToSize((fr ? 'Notes: ' : 'Notes: ') + invoice.notes, 170), 20, y);
    }
    pdf.setFontSize(7);
    pdf.text(fr ? 'Brouillon généré localement avec AfroTools.' : 'Draft generated locally with AfroTools.', 105, 286, { align: 'center' });
    return pdf.output('blob');
  }

  var engine = {
    id: 'creator-invoice',
    version: '2.0.0',
    TAX_RATES: TAX_RATES,
    CURRENCIES: CURRENCIES,
    formatCurrency: formatCurrency,
    calculateTotals: calculateTotals,
    createInvoice: createInvoice,
    serializeText: serializeText,
    getNextInvoiceNumber: getNextInvoiceNumber,
    generateWhatsAppMessage: generateWhatsAppMessage,
    getPaymentTemplate: getPaymentTemplate,
    getDefaultNotes: getDefaultNotes,
    getOverdueInvoices: getOverdueInvoices,
    generatePDF: generatePDF
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorInvoice = engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
})(typeof window !== 'undefined' ? window : globalThis);
