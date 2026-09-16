(function (root) {
  'use strict';
  var fontsPromise;
  var libraryPromise;
  var fontPaths = ['/assets/fonts/noto-sans/NotoSans-Regular.ttf', '/assets/fonts/noto-sans/NotoSans-Bold.ttf'];
  function error(code) { var result = new Error(code); result.code = code; return result; }
  function normalize(text) { return String(text || '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').normalize('NFC'); }
  function base64(bytes) {
    var binary = '';
    for (var offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 8192));
    return root.btoa(binary);
  }
  function loadFonts() {
    if (!fontsPromise) fontsPromise = Promise.all(fontPaths.map(async function (url) {
      var response = await root.fetch(url, {credentials: 'omit', referrerPolicy: 'no-referrer'});
      if (!response.ok) throw error('CAREER_PDF_FONT_LOAD');
      return base64(new Uint8Array(await response.arrayBuffer()));
    })).catch(function (failure) { fontsPromise = null; throw failure; });
    return fontsPromise;
  }
  function loadLibrary() {
    if (root.jspdf && root.jspdf.jsPDF) return Promise.resolve(root.jspdf.jsPDF);
    if (!libraryPromise) libraryPromise = new Promise(function (resolve, reject) {
      var script = root.document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.onload = function () { root.jspdf && root.jspdf.jsPDF ? resolve(root.jspdf.jsPDF) : reject(error('CAREER_PDF_LIBRARY_LOAD')); };
      script.onerror = function () { reject(error('CAREER_PDF_LIBRARY_LOAD')); };
      root.document.head.appendChild(script);
    }).catch(function (failure) { libraryPromise = null; throw failure; });
    return libraryPromise;
  }
  function buildDocument(JsPDF, fonts, text, kind) {
    text = normalize(text);
    var pdf = new JsPDF({orientation: 'portrait', unit: 'pt', format: 'a4', putOnlyUsedFonts: true, compress: true});
    ['normal', 'bold'].forEach(function (style, index) {
      var filename = index ? 'NotoSans-Bold.ttf' : 'NotoSans-Regular.ttf';
      pdf.addFileToVFS(filename, fonts[index]);
      pdf.addFont(filename, 'CareerNotoSans', style);
      pdf.setFont('CareerNotoSans', style);
      var metadata = pdf.getFont().metadata;
      if (!metadata || typeof metadata.characterToGlyph !== 'function') throw error('CAREER_PDF_FONT_LOAD');
      for (var character of text) {
        if (character === '\n') continue;
        if (!metadata.characterToGlyph(character.codePointAt(0))) throw error('CAREER_PDF_UNSUPPORTED_CHARACTER');
      }
    });
    var margin = 54, bottom = pdf.internal.pageSize.getHeight() - margin;
    var availableWidth = pdf.internal.pageSize.getWidth() - margin * 2, y = margin, first = true;
    text.split('\n').forEach(function (line) {
      var heading = first && !!line.trim() || kind === 'cv' && !!line.trim() && line === line.toLocaleUpperCase() && line.length < 44;
      if (line.trim()) first = false;
      pdf.setFont('CareerNotoSans', heading ? 'bold' : 'normal');
      pdf.setFontSize(heading ? 11 : 10);
      var height = heading ? 17 : 14;
      if (!line) { y += 8; return; }
      // jsPDF measures the embedded font, including breaking an overlong word.
      pdf.splitTextToSize(line, availableWidth).forEach(function (wrapped) {
        if (y + height > bottom) { pdf.addPage(); y = margin; }
        pdf.text(wrapped, margin, y);
        y += height;
      });
    });
    pdf.setProperties({title: kind === 'cv' ? 'CV' : 'Cover letter', creator: 'AfroTools'});
    return pdf;
  }
  async function buildPdf(text, kind) {
    var loaded = await Promise.all([loadLibrary(), loadFonts()]);
    return new Uint8Array(buildDocument(loaded[0], loaded[1], text, kind).output('arraybuffer'));
  }
  function message(failure, locale, kind) {
    var lang = String(locale || 'en').split('-')[0];
    var unsupported = failure && failure.code === 'CAREER_PDF_UNSUPPORTED_CHARACTER';
    var word = kind === 'cv' ? 'DOCX' : 'Word';
    if (lang === 'fr') return unsupported ? 'La police du PDF ne prend pas en charge certains caractères. Exportez en ' + word + ' ou TXT pour conserver tout votre texte.' : 'Le PDF n’a pas pu être créé. Réessayez ou exportez en ' + word + ' ou TXT.';
    if (lang === 'sw') return unsupported ? 'Fonti ya PDF haiauni baadhi ya herufi. Hamisha kama ' + word + ' au TXT ili kuhifadhi maandishi yako yote.' : 'PDF haikuweza kutengenezwa. Jaribu tena au hamisha kama ' + word + ' au TXT.';
    return unsupported ? 'The PDF font does not support some characters. Export ' + word + ' or TXT to preserve all your text.' : 'The PDF could not be created. Try again or export ' + word + ' or TXT.';
  }
  var api = {buildPdf: buildPdf, buildDocument: buildDocument, normalize: normalize, message: message};
  root.CareerDocumentPdf = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
