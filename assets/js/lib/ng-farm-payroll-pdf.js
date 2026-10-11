(function (root) {
  'use strict';
  function printable(text) {
    return String(text).replace(/\u20a6/g, 'NGN ').replace(/[\u00a0\u202f\u2007]/g, ' ')
      .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"').replace(/\u0153/g, 'oe').replace(/\u0152/g, 'OE')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\r\n?/g, '\n');
  }
  function create(JsPDF, text) {
    var pdf = new JsPDF({ unit: 'pt', format: 'a4' });
    var width = pdf.internal.pageSize.getWidth(), height = pdf.internal.pageSize.getHeight();
    var margin = 48, y = 56, lineHeight = 15;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
    printable(text).split('\n').forEach(function (paragraph) {
      // Leave room for small differences between jsPDF and reader font metrics.
      var lines = paragraph ? pdf.splitTextToSize(paragraph, width - margin * 2 - 12) : [''];
      lines.forEach(function (line) {
        if (y > height - margin) { pdf.addPage(); y = 56; }
        if (line) pdf.text(line, margin, y);
        y += lineHeight;
      });
    });
    var pages = pdf.getNumberOfPages();
    for (var page = 1; page <= pages; page++) {
      pdf.setPage(page); pdf.setFontSize(8);
      pdf.text('AfroTools | ' + page + ' / ' + pages, margin, height - 24);
    }
    return pdf;
  }
  root.AfroTools = root.AfroTools || {}; root.AfroTools.NigeriaPayrollPDF = { create: create };
})(window);
