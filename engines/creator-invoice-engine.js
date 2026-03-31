/**
 * CreatorInvoice Engine — Invoice & Quote Builder
 * Handles calculations, formatting, PDF generation, and WhatsApp messaging
 */
(function() {
  'use strict';

  var CreatorInvoice = {
    id: 'creator-invoice',
    version: '1.0.0',

    // Tax rates by country code
    TAX_RATES: {
      NG: { rate: 7.5, name: 'VAT', required: false },
      KE: { rate: 16, name: 'VAT', required: true },
      ZA: { rate: 15, name: 'VAT', required: false },
      GH: { rate: 15, name: 'VAT', required: false },
      TZ: { rate: 18, name: 'VAT', required: false },
      EG: { rate: 14, name: 'VAT', required: false },
      RW: { rate: 18, name: 'VAT', required: false },
      UG: { rate: 18, name: 'VAT', required: false },
      ET: { rate: 15, name: 'VAT', required: false },
      SN: { rate: 18, name: 'VAT', required: false },
      CI: { rate: 18, name: 'VAT', required: false },
      CM: { rate: 19.25, name: 'VAT', required: false },
      MA: { rate: 20, name: 'TVA', required: false },
      TN: { rate: 19, name: 'TVA', required: false },
      DZ: { rate: 19, name: 'TVA', required: false },
      AO: { rate: 14, name: 'IVA', required: false },
      MZ: { rate: 17, name: 'IVA', required: false },
      ZM: { rate: 16, name: 'VAT', required: false },
      ZW: { rate: 15, name: 'VAT', required: false },
      BW: { rate: 14, name: 'VAT', required: false },
      NA: { rate: 15, name: 'VAT', required: false },
      MW: { rate: 16.5, name: 'VAT', required: false },
      MU: { rate: 15, name: 'VAT', required: false },
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
      SL: { rate: 15, name: 'GST', required: false },
      LR: { rate: 10, name: 'GST', required: false },
      GM: { rate: 15, name: 'VAT', required: false },
      GW: { rate: 17, name: 'IGV', required: false },
      CV: { rate: 15, name: 'IVA', required: false },
      ST: { rate: 15, name: 'IVA', required: false },
      GQ: { rate: 15, name: 'IVA', required: false },
      ER: { rate: 5, name: 'Sales Tax', required: false },
      DJ: { rate: 10, name: 'TVA', required: false },
      KM: { rate: 10, name: 'TVA', required: false },
      SC: { rate: 15, name: 'VAT', required: false },
      SO: { rate: 5, name: 'Sales Tax', required: false },
      SS: { rate: 18, name: 'VAT', required: false },
      SD: { rate: 17, name: 'VAT', required: false },
      LY: { rate: 0, name: 'None', required: false },
      LS: { rate: 15, name: 'VAT', required: false },
      SZ: { rate: 15, name: 'VAT', required: false },
      CF: { rate: 19, name: 'TVA', required: false },
      BI: { rate: 18, name: 'TVA', required: false }
    },

    // Currency symbols and formatting
    CURRENCIES: {
      NGN: { symbol: '\u20A6', locale: 'en-NG', decimals: 2 },
      KES: { symbol: 'KES', locale: 'en-KE', decimals: 2 },
      ZAR: { symbol: 'R', locale: 'en-ZA', decimals: 2 },
      GHS: { symbol: 'GH\u20B5', locale: 'en-GH', decimals: 2 },
      EGP: { symbol: 'E\u00A3', locale: 'en-EG', decimals: 2 },
      TZS: { symbol: 'TSh', locale: 'en-TZ', decimals: 0 },
      UGX: { symbol: 'USh', locale: 'en-UG', decimals: 0 },
      RWF: { symbol: 'FRw', locale: 'en-RW', decimals: 0 },
      ETB: { symbol: 'Br', locale: 'en-ET', decimals: 2 },
      XOF: { symbol: 'CFA', locale: 'fr-SN', decimals: 0 },
      XAF: { symbol: 'FCFA', locale: 'fr-CM', decimals: 0 },
      MAD: { symbol: 'MAD', locale: 'fr-MA', decimals: 2 },
      USD: { symbol: '$', locale: 'en-US', decimals: 2 },
      EUR: { symbol: '\u20AC', locale: 'en-IE', decimals: 2 },
      GBP: { symbol: '\u00A3', locale: 'en-GB', decimals: 2 }
    },

    /**
     * Format currency amount (stored in smallest unit, e.g. kobo/cents)
     * @param {number} amount - Amount in smallest currency unit
     * @param {string} currencyCode - ISO currency code
     * @returns {string} Formatted string e.g. "₦85,000.00"
     */
    formatCurrency: function(amount, currencyCode) {
      var config = this.CURRENCIES[currencyCode] || { symbol: currencyCode, decimals: 2 };
      var value = (amount || 0) / 100;
      var formatted = value.toLocaleString('en', {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
      });
      return config.symbol + formatted;
    },

    /**
     * Calculate invoice totals
     * @param {Array} items - [{description, quantity, unitPrice}] unitPrice in smallest unit
     * @param {Object} options - {discountType, discountValue, taxRate}
     * @returns {Object} {subtotal, discount, taxable, tax, total} all in smallest unit
     */
    calculateTotals: function(items, options) {
      options = options || {};
      var subtotal = 0;
      (items || []).forEach(function(item) {
        if (item) subtotal += Math.round((item.quantity || 0) * (item.unitPrice || 0));
      });

      var discount = 0;
      if (options.discountValue > 0) {
        discount = options.discountType === 'percentage'
          ? Math.round(subtotal * options.discountValue / 100)
          : Math.round(options.discountValue * 100);
      }

      var taxable = subtotal - discount;
      var tax = options.taxRate > 0 ? Math.round(taxable * options.taxRate / 100) : 0;
      var total = taxable + tax;

      return { subtotal: subtotal, discount: discount, taxable: taxable, tax: tax, total: total };
    },

    /**
     * Generate next invoice number
     * @param {Array} existingNumbers - Array of existing invoice number strings
     * @returns {string} Next invoice number e.g. "INV-007"
     */
    getNextInvoiceNumber: function(existingNumbers) {
      var maxNum = 0;
      (existingNumbers || []).forEach(function(n) {
        var match = (n || '').match(/(\d+)$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
      });
      return 'INV-' + String(maxNum + 1).padStart(3, '0');
    },

    /**
     * Generate WhatsApp share message
     * @param {Object} invoice - Invoice data object
     * @returns {string} Formatted WhatsApp message
     */
    generateWhatsAppMessage: function(invoice) {
      var name = invoice.client_name || 'there';
      var num = invoice.invoice_number || '';
      var total = this.formatCurrency(invoice.total || 0, invoice.currency || 'NGN');
      var due = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'on receipt';
      var link = invoice.share_token ? 'https://afrotools.com/tools/creator-invoice/view.html?token=' + invoice.share_token : '';

      var msg = 'Hi ' + name + ', here\'s invoice ' + num + ' for ' + total + ' due by ' + due + '.';
      if (link) msg += '\n\nView invoice: ' + link;
      msg += '\n\nThank you for your business!';
      return msg;
    },

    /**
     * Get overdue invoices from a list
     * @param {Array} invoices - Array of invoice objects
     * @returns {Array} Overdue invoices
     */
    getOverdueInvoices: function(invoices) {
      var now = new Date();
      return (invoices || []).filter(function(inv) {
        return inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft' &&
               inv.due_date && new Date(inv.due_date) < now;
      });
    },

    /**
     * Get payment instructions template by country
     * @param {string} countryCode - 2-letter ISO country code
     * @returns {string} Payment instructions template
     */
    getPaymentTemplate: function(countryCode) {
      var templates = {
        NG: 'Bank Transfer:\nBank: [Your Bank Name]\nAccount Number: [Your Account Number]\nAccount Name: [Your Full Name]\n\nPlease use the invoice number as payment reference.',
        KE: 'M-Pesa:\nPaybill Number: [Your Paybill]\nAccount Number: [Invoice Number]\n\nOr Bank Transfer:\nBank: [Your Bank]\nAccount: [Your Account]\nBranch: [Branch Name]',
        ZA: 'EFT Payment:\nBank: [Your Bank]\nAccount Number: [Your Account Number]\nBranch Code: [Branch Code]\nAccount Type: [Cheque/Savings]\nReference: [Invoice Number]',
        GH: 'Mobile Money:\nMoMo Number: [Your MoMo Number]\nName: [Your Full Name]\nReference: [Invoice Number]\n\nOr Bank Transfer:\nBank: [Your Bank]\nAccount: [Your Account]',
        EG: 'Bank Transfer:\nBank: [Your Bank]\nAccount Number: [Your Account Number]\nIBAN: [Your IBAN]\nSWIFT: [SWIFT Code]',
        TZ: 'M-Pesa / Tigo Pesa:\nNumber: [Your Mobile Money Number]\nName: [Your Full Name]\n\nOr Bank Transfer:\nBank: [Your Bank]\nAccount: [Your Account]',
        RW: 'MTN Mobile Money:\nNumber: [Your MoMo Number]\nName: [Your Full Name]\n\nOr Bank Transfer:\nBank: [Your Bank]\nAccount: [Your Account]',
        UG: 'Mobile Money:\nMTN MoMo / Airtel Money: [Your Number]\nName: [Your Full Name]\nReference: [Invoice Number]'
      };
      return templates[countryCode] || templates['NG'];
    },

    /**
     * Get default thank-you notes
     * @param {string} countryCode - 2-letter ISO country code
     * @returns {string} Default notes text
     */
    getDefaultNotes: function(countryCode) {
      return this.getPaymentTemplate(countryCode) + '\n\nThank you for your business! Please don\'t hesitate to reach out if you have any questions.';
    },

    /**
     * Generate PDF (client-side fallback using print)
     * Lazy-loads jsPDF if available, otherwise falls back to window.print()
     * @param {Object} invoiceData - Full invoice data
     * @param {Array} items - Line items
     * @returns {Promise<Blob>} PDF blob
     */
    generatePDF: async function(invoiceData, items) {
      // Try to use jsPDF if loaded
      if (typeof jspdf !== 'undefined' || typeof jsPDF !== 'undefined') {
        var PDF = (typeof jspdf !== 'undefined') ? jspdf.jsPDF : jsPDF;
        var doc = new PDF();
        var y = 20;
        var pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129);
        doc.text('INVOICE', pageWidth - 20, y, { align: 'right' });

        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text(invoiceData.clientName || invoiceData.client_name || '', 20, y);
        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(invoiceData.clientEmail || invoiceData.client_email || '', 20, y);

        y += 20;

        // Invoice details
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('Invoice #: ' + (invoiceData.invoiceNumber || invoiceData.invoice_number || ''), 20, y);
        doc.text('Date: ' + (invoiceData.issuedDate || invoiceData.issued_date || ''), pageWidth - 20, y, { align: 'right' });
        y += 6;
        doc.text('Due: ' + (invoiceData.dueDate || invoiceData.due_date || ''), pageWidth - 20, y, { align: 'right' });
        y += 12;

        // Line
        doc.setDrawColor(229, 231, 235);
        doc.line(20, y, pageWidth - 20, y);
        y += 8;

        // Table header
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('DESCRIPTION', 20, y);
        doc.text('QTY', 110, y, { align: 'center' });
        doc.text('RATE', 140, y, { align: 'right' });
        doc.text('TOTAL', pageWidth - 20, y, { align: 'right' });
        y += 6;
        doc.line(20, y, pageWidth - 20, y);
        y += 8;

        // Items
        var currency = invoiceData.currency || 'NGN';
        var self = this;
        (items || invoiceData.items || []).forEach(function(item) {
          doc.setFontSize(9);
          doc.setTextColor(17, 24, 39);
          doc.text(item.description || '', 20, y, { maxWidth: 80 });
          doc.text(String(item.quantity || 1), 110, y, { align: 'center' });
          doc.text(self.formatCurrency(item.unitPrice || item.unit_price || 0, currency), 140, y, { align: 'right' });
          doc.text(self.formatCurrency(item.total || 0, currency), pageWidth - 20, y, { align: 'right' });
          y += 10;
        });

        y += 4;
        doc.line(20, y, pageWidth - 20, y);
        y += 10;

        // Totals
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('Subtotal', 130, y, { align: 'right' });
        doc.setTextColor(17, 24, 39);
        doc.text(this.formatCurrency(invoiceData.subtotal || 0, currency), pageWidth - 20, y, { align: 'right' });
        y += 8;

        if (invoiceData.taxRate || invoiceData.tax_rate) {
          var rate = invoiceData.taxRate || invoiceData.tax_rate;
          doc.setTextColor(107, 114, 128);
          doc.text('VAT (' + rate + '%)', 130, y, { align: 'right' });
          doc.setTextColor(17, 24, 39);
          doc.text(this.formatCurrency(invoiceData.tax || 0, currency), pageWidth - 20, y, { align: 'right' });
          y += 8;
        }

        // Grand total
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text('Total', 130, y + 4, { align: 'right' });
        doc.text(this.formatCurrency(invoiceData.total || 0, currency), pageWidth - 20, y + 4, { align: 'right' });
        y += 16;

        // Notes
        if (invoiceData.notes || invoiceData.payment_instructions) {
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text('Notes:', 20, y);
          y += 5;
          doc.setFontSize(8);
          var noteLines = doc.splitTextToSize(invoiceData.notes || invoiceData.payment_instructions || '', pageWidth - 40);
          doc.text(noteLines, 20, y);
          y += noteLines.length * 4 + 10;
        }

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text('Created with AfroTools CreatorInvoice', pageWidth / 2, 285, { align: 'center' });

        return doc.output('blob');
      }

      // Fallback: trigger print
      window.print();
      return new Blob([''], { type: 'application/pdf' });
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorInvoice = CreatorInvoice;
})();
