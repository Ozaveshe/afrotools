'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const JSZip = require('jszip');
const { PDFDocument } = require('../assets/vendor/pdf-lib/pdf-lib.min.js');

for (const owner of ['tools/cv-builder/js/cv-application-pack-export.js', 'fr/tools/generateur-cv/js/cv-application-pack-export.js']) {
  test(`${owner}: ZIP stores resolved, parseable ATS and cover-letter PDF bytes`, async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 400]);
    const bytes = await pdf.save();
    class DesignedPdf {
      constructor() { this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } }; }
      addImage() {}
      addPage() {}
      output() { return new Blob([bytes], { type: 'application/pdf' }); }
    }
    const state = { data: { fn: 'Test', ln: 'Fixture', title: 'Poste test' }, country: 'GH', template: 'global-compact' };
    const window = {
      CVApp: { getState: () => state },
      CVExportUpgrade: { buildAtsPlainText: () => 'CV synthétique' },
      CVExportPdfQuality: { renderPreviewCanvas: async () => ({ width: 595, height: 841, toDataURL: () => 'data:image/jpeg;base64,fixture' }) },
      CVExportAtsPlainPdf: { buildPdf: async () => { await Promise.resolve(); return bytes; } },
      CVDocxExport: { isAvailable: () => true, buildBlob: () => new Blob(['DOCX fixture']) },
      CVApplicationPack: { generatePack: () => ({ coverLetter: 'Lettre synthétique' }) },
      jspdf: { jsPDF: DesignedPdf }, loadPdfLibs: async () => {}, Blob, URL, TextEncoder
    };
    const document = { readyState: 'loading', addEventListener() {}, querySelector: () => null };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', owner), 'utf8'), {
      window, document, Blob, Uint8Array, TextEncoder, URL,
      localStorage: { getItem: () => null }, setTimeout() {}, console
    });
    const output = await window.CVApplicationPackExport.buildApplicationPack();
    const zip = await JSZip.loadAsync(await output.blob.arrayBuffer());
    const documents = Object.values(zip.files).filter(file => /\.pdf$/.test(file.name));
    assert.equal(documents.length, 3);
    for (const file of documents) {
      const content = await file.async('uint8array');
      assert.equal(Buffer.from(content.subarray(0, 5)).toString(), '%PDF-');
      assert.equal((await PDFDocument.load(content)).getPageCount(), 1);
    }
  });
}
