(function (root) {
  'use strict';
  var fontPromise;
  function loadFont() {
    if (!fontPromise) fontPromise = root.fetch('/assets/fonts/noto-sans/NotoSans-Regular.ttf', {
      credentials: 'omit', referrerPolicy: 'no-referrer'
    }).then(function (response) {
      if (!response.ok) throw new Error('FONT_UNAVAILABLE');
      return response.arrayBuffer();
    }).then(function (buffer) {
      var bytes = new Uint8Array(buffer), binary = '';
      for (var offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 8192));
      }
      return root.btoa(binary);
    }).catch(function (error) { fontPromise = null; throw error; });
    return fontPromise;
  }
  async function build(text, title, subject) {
    if (!root.jspdf || !root.jspdf.jsPDF) throw new Error('PDF_UNAVAILABLE');
    var font = await loadFont();
    var pdf = new root.jspdf.jsPDF({ unit: 'pt', format: 'a4', putOnlyUsedFonts: true, compress: true });
    pdf.addFileToVFS('NotoSans-Regular.ttf', font);
    pdf.addFont('NotoSans-Regular.ttf', 'HausaNoto', 'normal');
    pdf.setFont('HausaNoto', 'normal');
    pdf.setFontSize(11);
    var metadata = pdf.getFont().metadata;
    text = String(text).normalize('NFC');
    if (!metadata || typeof metadata.characterToGlyph !== 'function') throw new Error('FONT_UNAVAILABLE');
    for (var character of text) {
      if (character !== '\n' && !metadata.characterToGlyph(character.codePointAt(0))) throw new Error('UNSUPPORTED_CHARACTER');
    }
    var margin = 48, y = margin;
    var width = pdf.internal.pageSize.getWidth() - margin * 2;
    var bottom = pdf.internal.pageSize.getHeight() - margin;
    text.split('\n').forEach(function (line) {
      pdf.splitTextToSize(line, width).forEach(function (wrapped) {
        if (y + 16 > bottom) { pdf.addPage(); y = margin; }
        pdf.text(wrapped, margin, y); y += 16;
      });
    });
    pdf.setProperties({ title: title, subject: subject, creator: 'AfroTools' });
    return pdf;
  }
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.HausaProfitMarginPdf = { build: build };
})(window);
