(function (global, document) {
  'use strict';

  function printable(value) {
    var text = value == null ? '' : String(value);
    if (text.normalize) text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return text.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  async function download(config) {
    if (!global.AfroTools || !global.AfroTools.pdf || typeof global.AfroTools.pdf.loadJsPDF !== 'function') {
      throw new Error('PDF Exporter is unavailable');
    }
    await global.AfroTools.pdf.loadJsPDF();
    var doc = new global.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var y = 18;
    function ensureSpace(height) {
      if (y + height <= 280) return;
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(printable(config.title || 'AfroTools Ingénierie Report'), 18, y);
    y += 8;
    if (config.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(printable(config.subtitle), 174), 18, y);
      y += 10;
    }
    (config.heroStats || []).forEach(function (stat) {
      ensureSpace(9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(printable(stat.label) + ':', 18, y);
      doc.setFont('helvetica', 'normal');
      doc.text(printable(stat.value), 74, y);
      y += 7;
    });
    (config.sections || []).forEach(function (section) {
      ensureSpace(14);
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(printable(section.title), 18, y);
      y += 7;
      (section.rows || []).forEach(function (row) {
        var labelLines = doc.splitTextToSize(printable(row.label), 108);
        var valueLines = doc.splitTextToSize(printable(row.value), 58);
        var lineCount = Math.max(labelLines.length, valueLines.length);
        ensureSpace(Math.max(7, lineCount * 4 + 2));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(labelLines, 18, y);
        doc.text(valueLines, 190, y, { align: 'right' });
        y += Math.max(7, lineCount * 4 + 2);
      });
    });
    ensureSpace(20);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(printable(
      config.disclaimer || 'Estimation indicative only. Verify before construction or purchase.'
    ), 174), 18, y);

    var filename = String(config.filename || 'afrotools-engineering-report.pdf')
      .replace(/[\\/:*?"<>|]+/g, '-');
    var blob = doc.output('blob');
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.dataset.noPdfGate = 'true';
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 10_000);
    return { fileName: filename, blob: blob };
  }

  global.AfroToolsEngineeringPdf = { download: download };
}(window, document));
