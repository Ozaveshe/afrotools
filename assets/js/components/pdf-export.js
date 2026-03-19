/**
 * <pdf-export-button> — Professional PDF summary generator using jsPDF
 *
 * Usage:
 *   <pdf-export-button tool-name="Nigeria PAYE Calculator" tool-slug="ng-paye" file-name="nigeria-paye-summary.pdf"></pdf-export-button>
 *   btn.setData({ title, subtitle, sections: [{ heading, rows: [{ label, value, bold }] }] });
 *
 * Requires jsPDF loaded via CDN before this script:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js" defer></script>
 */
(function () {
  'use strict';

  var STYLE = '\
    :host{display:inline-block}\
    .pdf-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border:none;border-radius:10px;\
      background:#007AFF;color:#fff;font-family:"DM Sans",system-ui,sans-serif;font-size:.82rem;font-weight:600;\
      cursor:pointer;transition:background .2s,transform .15s}\
    .pdf-btn:hover{background:#0063D1}\
    .pdf-btn:active{transform:scale(.97)}\
    .pdf-btn svg{flex-shrink:0}\
    .pdf-btn:disabled{opacity:.5;cursor:not-allowed}\
  ';

  function PdfExport() {
    var el = Reflect.construct(HTMLElement, [], PdfExport);
    el._pdfData = null;
    return el;
  }
  PdfExport.prototype = Object.create(HTMLElement.prototype);
  PdfExport.prototype.constructor = PdfExport;

  PdfExport.observedAttributes = ['tool-name', 'tool-slug', 'file-name'];

  PdfExport.prototype.connectedCallback = function () {
    var shadow = this.attachShadow({ mode: 'open' });

    var style = document.createElement('style');
    style.textContent = STYLE;
    shadow.appendChild(style);

    var btn = document.createElement('button');
    btn.className = 'pdf-btn';
    btn.type = 'button';
    btn.disabled = true;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/></svg> Download PDF';
    shadow.appendChild(btn);
    this._btn = btn;

    var self = this;
    btn.addEventListener('click', function () { self._handleClick(); });
  };

  PdfExport.prototype.setData = function (data) {
    this._pdfData = data;
    if (this._btn) this._btn.disabled = false;
  };

  PdfExport.prototype._handleClick = function () {
    if (!this._pdfData) return;

    // Check email gate: logged-in users or returning users skip
    var hasEmail = false;
    try {
      var auth = localStorage.getItem('afrotools-auth');
      if (auth) { var u = JSON.parse(auth); if (u && u.email) hasEmail = true; }
      if (!hasEmail && localStorage.getItem('afrotools-email-gate')) hasEmail = true;
      if (!hasEmail && localStorage.getItem('afrotools_lead_email')) hasEmail = true;
    } catch (e) {}

    if (hasEmail) {
      this._generatePdf();
      return;
    }

    // Trigger email gate modal
    var gate = document.querySelector('email-gate-modal');
    if (gate && typeof gate.show === 'function') {
      var self = this;
      gate.show(function () { self._generatePdf(); });
    } else {
      // No gate found, just download
      this._generatePdf();
    }
  };

  PdfExport.prototype._generatePdf = function () {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) {
      console.warn('jsPDF not loaded. Add <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js" defer></script>');
      return;
    }

    var data = this._pdfData;
    var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var W = 210, margin = 20, contentW = W - margin * 2;
    var y = margin;

    // Colors
    var blue = [0, 122, 255];
    var darkText = [30, 41, 59];
    var grayText = [107, 114, 128];
    var lineColor = [229, 231, 235];

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text('AFROTOOLS', margin, y);
    y += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title || 'Calculation Summary', margin, y);
    y += 6;

    if (data.subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(data.subtitle, margin, y);
      y += 4;
    }

    // Divider
    y += 4;
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    y += 8;

    // Sections
    var sections = data.sections || [];
    for (var s = 0; s < sections.length; s++) {
      var section = sections[s];

      // Section heading
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(blue[0], blue[1], blue[2]);
      doc.text(section.heading.toUpperCase(), margin, y);
      y += 7;

      // Rows
      var rows = section.rows || [];
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var fontSize = row.bold ? 11 : 10;
        var fontStyle = row.bold ? 'bold' : 'normal';

        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);

        doc.text(row.label, margin, y);
        doc.text(row.value, W - margin, y, { align: 'right' });
        y += 6;
      }

      // Section divider
      y += 3;
      if (s < sections.length - 1) {
        doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
        doc.line(margin, y, W - margin, y);
        y += 8;
      }
    }

    // Footer
    y = 275;
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.line(margin, y, W - margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    var footer = data.footer || 'Generated by AfroTools \u2014 afrotools.com';
    doc.text(footer, W / 2, y, { align: 'center' });
    y += 4;
    var dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text('Date: ' + dateStr, W / 2, y, { align: 'center' });

    // Save
    var fileName = this.getAttribute('file-name') || 'afrotools-summary.pdf';
    doc.save(fileName);

    // GA4 tracking
    if (typeof gtag === 'function') {
      gtag('event', 'pdf_download', {
        tool_name: this.getAttribute('tool-name') || '',
        tool_slug: this.getAttribute('tool-slug') || '',
        method: 'pdf-export-button'
      });
    }

    // Offer save to vault
    this._offerVaultSave(doc, fileName);
  };

  PdfExport.prototype._offerVaultSave = function (doc, fileName) {
    try {
      var auth = localStorage.getItem('afrotools-auth');
      if (!auth) return;
      var u = JSON.parse(auth);
      if (!u || !u.email) return;

      if (typeof window.AfroVault !== 'undefined' && typeof window.AfroVault.uploadBlob === 'function') {
        var blob = doc.output('blob');
        window.AfroVault.uploadBlob(blob, fileName, 'application/pdf');
      }
    } catch (e) {}
  };

  if (!customElements.get('pdf-export-button')) {
    customElements.define('pdf-export-button', PdfExport);
  }
})();
