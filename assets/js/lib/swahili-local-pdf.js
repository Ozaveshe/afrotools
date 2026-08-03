(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../vendor/pdf-lib/pdf-lib.min.js'));
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.SwahiliLocalPdf = factory(root.PDFLib);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (pdfLib) {
  'use strict';

  var PAGE_WIDTH = 595;
  var PAGE_HEIGHT = 842;
  var MARGIN = 48;
  var FONT_WIDTHS = {
    ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667,
    "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333,
    '.': 278, '/': 278, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584,
    '?': 556, '@': 1015, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556,
    '`': 333, '{': 334, '|': 260, '}': 334, '~': 584
  };
  var UPPER_WIDTHS = [
    667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
    722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611
  ];
  var LOWER_WIDTHS = [
    556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833,
    556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500
  ];

  function ascii(value) {
    return String(value == null ? '' : value)
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u00d7/g, 'x')
      .replace(/\u00a0/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e]/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function glyphWidth(character) {
    var code = character.charCodeAt(0);
    if (code >= 48 && code <= 57) return 556;
    if (code >= 65 && code <= 90) return UPPER_WIDTHS[code - 65];
    if (code >= 97 && code <= 122) return LOWER_WIDTHS[code - 97];
    return FONT_WIDTHS[character] || 556;
  }

  function measureText(value, fontSize) {
    return ascii(value).split('').reduce(function (total, character) {
      return total + glyphWidth(character);
    }, 0) * fontSize / 1000;
  }

  function splitLongWord(word, maxWidth, fontSize) {
    var chunks = [];
    var current = '';
    word.split('').forEach(function (character) {
      var candidate = current + character;
      if (current && measureText(candidate, fontSize) > maxWidth) {
        chunks.push(current);
        current = character;
      } else {
        current = candidate;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  }

  function wrapText(value, maxWidth, fontSize) {
    var words = ascii(value).split(/\s+/).filter(Boolean);
    var lines = [];
    var current = '';
    words.forEach(function (word) {
      var pieces = measureText(word, fontSize) <= maxWidth
        ? [word]
        : splitLongWord(word, maxWidth, fontSize);
      pieces.forEach(function (piece) {
        var candidate = current ? current + ' ' + piece : piece;
        if (current && measureText(candidate, fontSize) > maxWidth) {
          lines.push(current);
          current = piece;
        } else {
          current = candidate;
        }
      });
    });
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  function layout(title, lines) {
    var maxWidth = PAGE_WIDTH - MARGIN * 2;
    var rows = [];
    var y = PAGE_HEIGHT - 52;
    wrapText(title, maxWidth, 14).forEach(function (line) {
      rows.push({ text: line, x: MARGIN, y: y, fontSize: 14 });
      y -= 18;
    });
    y -= 8;
    (lines || []).forEach(function (line) {
      wrapText(line, maxWidth, 10).forEach(function (wrapped) {
        if (y < MARGIN) throw new Error('PDF content exceeds one bounded page.');
        rows.push({ text: wrapped, x: MARGIN, y: y, fontSize: 10 });
        y -= 14;
      });
    });
    return {
      page: { width: PAGE_WIDTH, height: PAGE_HEIGHT, margin: MARGIN },
      rows: rows
    };
  }

  async function create(title, lines) {
    if (!pdfLib || !pdfLib.PDFDocument) throw new Error('Local PDF library is unavailable.');
    var plan = layout(title, lines);
    var document = await pdfLib.PDFDocument.create();
    var page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    var font = await document.embedFont(pdfLib.StandardFonts.Helvetica);
    plan.rows.forEach(function (row) {
      var measured = font.widthOfTextAtSize(row.text, row.fontSize);
      if (row.x + measured > PAGE_WIDTH - MARGIN + 0.01) {
        throw new Error('PDF text exceeded the bounded layout.');
      }
      page.drawText(row.text, {
        x: row.x,
        y: row.y,
        size: row.fontSize,
        font: font,
        color: pdfLib.rgb(23 / 255, 32 / 255, 51 / 255)
      });
    });
    document.setTitle(ascii(title));
    document.setCreator('AfroTools');
    document.setProducer('AfroTools local browser export');
    return new Uint8Array(await document.save({ useObjectStreams: false, addDefaultPage: false }));
  }

  return {
    create: create,
    layout: layout,
    measureText: measureText,
    wrapText: wrapText
  };
}));
