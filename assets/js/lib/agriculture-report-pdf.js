(function (root) {
  'use strict';
  var fontPromise;
  function failure(code) { var error = new Error(code); error.code = code; return error; }
  function prepareText(value) {
    return String(value || '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, '    ')
      .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, function (flag) {
        return '[' + Array.from(flag).map(function (letter) { return String.fromCharCode(letter.codePointAt(0) - 0x1F1E6 + 65); }).join('') + ']';
      })
      .replace(/🌽/gu, '[mahindi]').replace(/🥜/gu, '[karanga]')
      .replace(/🟤/gu, '[kahawia]').replace(/✅/gu, '[alama ya tiki]').replace(/≈/g, '(takriban)');
  }
  function loadFont() {
    if (!fontPromise) fontPromise = root.fetch('/assets/fonts/noto-sans/NotoSans-Regular.ttf', {credentials: 'omit', referrerPolicy: 'no-referrer'})
      .then(function (response) { if (!response.ok) throw failure('AGRI_PDF_FONT'); return response.arrayBuffer(); })
      .then(function (buffer) {
        var bytes = new Uint8Array(buffer), binary = '';
        for (var offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 8192));
        return root.btoa(binary);
      }).catch(function (error) { fontPromise = null; throw error; });
    return fontPromise;
  }
  function buildDocument(JsPDF, font, value) {
    var text = prepareText(value);
    var pdf = new JsPDF({unit: 'pt', format: 'a4', putOnlyUsedFonts: true, compress: true});
    pdf.addFileToVFS('NotoSans-Regular.ttf', font);
    pdf.addFont('NotoSans-Regular.ttf', 'AgricultureNotoSans', 'normal');
    pdf.setFont('AgricultureNotoSans', 'normal');
    var metadata = pdf.getFont().metadata;
    if (!metadata || typeof metadata.characterToGlyph !== 'function') throw failure('AGRI_PDF_FONT');
    for (var character of text) {
      if (character !== '\n' && !metadata.characterToGlyph(character.codePointAt(0))) throw failure('AGRI_PDF_UNSUPPORTED_CHARACTER');
    }
    var margin = 48, y = 58, lineHeight = 15;
    var width = pdf.internal.pageSize.getWidth() - margin * 2;
    var bottom = pdf.internal.pageSize.getHeight() - 58;
    pdf.setFontSize(11);
    text.split('\n').forEach(function (line) {
      var lines = line ? pdf.splitTextToSize(line, width) : [''];
      lines.forEach(function (wrapped) {
        if (y + lineHeight > bottom) { pdf.addPage(); y = 58; }
        if (wrapped) pdf.text(wrapped, margin, y);
        y += lineHeight;
      });
    });
    var pages = pdf.getNumberOfPages();
    for (var index = 1; index <= pages; index++) {
      pdf.setPage(index);pdf.setFontSize(9);
      pdf.text(index + ' / ' + pages, margin, pdf.internal.pageSize.getHeight() - 32);
    }
    pdf.setProperties({title: 'AfroTools - Ripoti ya kilimo', creator: 'AfroTools'});
    return pdf;
  }
  async function buildPdf(text) {
    if (!root.jspdf || !root.jspdf.jsPDF) throw failure('AGRI_PDF_LIBRARY');
    return buildDocument(root.jspdf.jsPDF, await loadFont(), text);
  }
  var api = {prepareText: prepareText, buildDocument: buildDocument, buildPdf: buildPdf};
  root.AgroReportPdf = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
