'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../tools/cv-builder/js/src/cv-import-assistant.js'), 'utf8');
const helpers = source.slice(source.indexOf('    var pdfParserPromise;'), source.indexOf('    var docxParserPromise;'));

function load(parser, lang = 'en') {
  const scripts = [];
  const window = parser ? { pdfjsLib: parser } : {};
  const document = {
    documentElement: { lang },
    createElement: () => ({ remove() { this.removed = true; } }),
    head: { appendChild(script) { scripts.push(script); } }
  };
  const context = { e: window, t: document };
  vm.createContext(context);
  vm.runInContext(helpers + ';this.api={ensureImportPdfParser,importPdfPageText,readImportPdf};', context);
  return { api: context.api, window, scripts };
}

const item = (str, y, hasEOL = false) => ({ str, transform: [1, 0, 0, 1, 0, y], hasEOL });
const file = { async arrayBuffer() { return new ArrayBuffer(1); } };

test('PDF text retains explicit lines, page order and supplied column reading order', () => {
  const { api } = load();
  assert.equal(api.importPdfPageText([item('Name', 30, true), item('Summary', 30)]), 'Name\nSummary');
  assert.equal(api.importPdfPageText([item('First', 30), item('line', 29), item('Second', 10)]), 'First line \nSecond');
  assert.equal(api.importPdfPageText([{ type: 'beginMarkedContent' }, item('É Ɗ ƙ', 20, true)]), 'É Ɗ ƙ');
  assert.equal(api.importPdfPageText([{ str: 'No coordinates' }, { str: 'still retained', hasEOL: true }]), 'No coordinates still retained');
  // Retain the PDF's content order; this is not an arbitrary-column reconstruction claim.
  assert.equal(api.importPdfPageText([item('Left heading', 90, true), item('Left body', 70, true), item('Right heading', 90, true), item('Right body', 70)]), 'Left heading\nLeft body\nRight heading\nRight body');
  assert.equal(api.importPdfPageText([]), '');
});

test('PDF parser shares concurrent loads and retries a failed local script', async () => {
  const fixture = load();
  const first = fixture.api.ensureImportPdfParser();
  assert.equal(first, fixture.api.ensureImportPdfParser());
  assert.equal(fixture.scripts.length, 1);
  assert.equal(fixture.scripts[0].src, '/assets/vendor/pdfjs/pdf.min.js');
  fixture.scripts[0].onerror();
  await assert.rejects(first, /CV_PDF_PARSER_UNAVAILABLE/);
  assert.equal(fixture.scripts[0].removed, true);
  const retry = fixture.api.ensureImportPdfParser();
  fixture.window.pdfjsLib = { GlobalWorkerOptions: {} };
  fixture.scripts[1].onload();
  assert.equal(await retry, fixture.window.pdfjsLib);
  assert.equal(fixture.window.pdfjsLib.GlobalWorkerOptions.workerSrc, '/assets/vendor/pdfjs/pdf.worker.min.js');
  await fixture.api.ensureImportPdfParser();
  assert.equal(fixture.scripts.length, 2);
});

test('a script without a PDF parser rejects and remains retryable', async () => {
  const fixture = load();
  const first = fixture.api.ensureImportPdfParser();
  fixture.scripts[0].onload();
  await assert.rejects(first, /CV_PDF_PARSER_UNAVAILABLE/);
  const retry = fixture.api.ensureImportPdfParser();
  fixture.scripts[1].onerror();
  await assert.rejects(retry, /CV_PDF_PARSER_UNAVAILABLE/);
});

test('PDF extraction releases pages and document after a successful multipage read', async () => {
  let pagesCleaned = 0, destroyed = 0;
  const parser = { GlobalWorkerOptions: {}, getDocument() { return { promise: Promise.resolve({
    numPages: 2,
    async getPage(n) { return { async getTextContent() { return { items: [item('Page ' + n, 20, true)] }; }, cleanup() { pagesCleaned++; } }; },
    async destroy() { destroyed++; }
  }) }; } };
  const result = await load(parser).api.readImportPdf(file);
  assert.equal(result.ok, true);
  assert.equal(result.text, 'Page 1\n\nPage 2');
  assert.equal(pagesCleaned, 2);
  assert.equal(destroyed, 1);
});

test('invalid documents and failed page extraction release their parser resources', async () => {
  let taskDestroyed = 0, documentDestroyed = 0;
  const parser = { GlobalWorkerOptions: {}, getDocument() { return {
    promise: Promise.reject(new Error('synthetic invalid PDF')), async destroy() { taskDestroyed++; }
  }; } };
  await assert.rejects(load(parser).api.readImportPdf(file), /synthetic invalid PDF/);
  assert.equal(taskDestroyed, 1);
  parser.getDocument = () => ({ promise: Promise.resolve({ numPages: 1,
    async getPage() { return { async getTextContent() { throw new Error('synthetic page error'); } }; },
    async destroy() { documentDestroyed++; }
  }) });
  await assert.rejects(load(parser).api.readImportPdf(file), /synthetic page error/);
  assert.equal(documentDestroyed, 1);
});

for (const [lang, message] of [['en', 'No selectable text'], ['fr', 'Aucun texte sélectionnable'], ['sw', 'Hakuna maandishi']]) {
  test('empty PDFs offer a paste fallback and release resources: ' + lang, async () => {
    let destroyed = 0;
    const parser = { GlobalWorkerOptions: {}, getDocument() { return { promise: Promise.resolve({ numPages: 1,
      async getPage() { return { async getTextContent() { return { items: [] }; }, cleanup() {} }; },
      async destroy() { destroyed++; }
    }) }; } };
    const result = await load(parser, lang).api.readImportPdf(file);
    assert.equal(result.ok, false);
    assert.equal(result.text, '');
    assert.ok(result.message.startsWith(message));
    assert.equal(destroyed, 1);
  });
}
