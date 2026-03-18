/**
 * PdfUtils — Shared utilities for AfroTools PDF tools
 * Provides text extraction, rendering, download, drag-drop helpers
 */
(function() {
  'use strict';

  var PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
  var PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
  var JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

  var pdfjsLib = null;

  window.PdfUtils = {

    /** Load pdf.js ESM module (cached after first call) */
    async ensurePdfJs() {
      if (pdfjsLib) return pdfjsLib;
      var mod = await import(PDFJS_CDN);
      pdfjsLib = mod;
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return pdfjsLib;
    },

    /** Get the cached pdfjsLib reference */
    getPdfJs() {
      return pdfjsLib;
    },

    /** Load a PDF file and return { arrayBuffer, pdfDoc (pdf.js), pageCount } */
    async loadPdf(file) {
      if (!file) throw new Error('No file provided');
      var ab = await file.arrayBuffer();
      var pdfjs = await this.ensurePdfJs();
      var doc = await pdfjs.getDocument({ data: ab.slice(0) }).promise;
      return { arrayBuffer: ab, pdfDoc: doc, pageCount: doc.numPages, fileName: file.name, fileSize: file.size };
    },

    /** Extract text from all pages: returns [{page, text, items}] */
    async extractText(pdfDoc) {
      var results = [];
      for (var i = 1; i <= pdfDoc.numPages; i++) {
        var page = await pdfDoc.getPage(i);
        var content = await page.getTextContent();
        var items = content.items.map(function(item) {
          return {
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            fontName: item.fontName
          };
        });
        var text = content.items.map(function(item) { return item.str; }).join(' ');
        results.push({ page: i, text: text, items: items });
      }
      return results;
    },

    /** Render a single page to canvas, returns canvas element */
    async renderPage(pdfDoc, pageNum, scale) {
      scale = scale || 1.5;
      var page = await pdfDoc.getPage(pageNum);
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      return canvas;
    },

    /** Render a page thumbnail (low-res) */
    async renderThumb(pdfDoc, pageNum) {
      return this.renderPage(pdfDoc, pageNum, 0.4);
    },

    /** Generate thumbnails for all pages, returns {0: dataURL, 1: dataURL, ...} */
    async generateThumbnails(pdfDoc, onProgress) {
      var thumbs = {};
      for (var i = 1; i <= pdfDoc.numPages; i++) {
        try {
          var canvas = await this.renderThumb(pdfDoc, i);
          thumbs[i - 1] = canvas.toDataURL('image/jpeg', 0.6);
        } catch (e) { /* skip failed thumb */ }
        if (onProgress) onProgress(i, pdfDoc.numPages);
      }
      return thumbs;
    },

    /** Download a Blob as a file */
    downloadBlob(blob, filename) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    },

    /** Download PDF bytes */
    downloadPdf(bytes, filename) {
      this.downloadBlob(new Blob([bytes], { type: 'application/pdf' }), filename);
    },

    /** Download multiple files as ZIP */
    async downloadZip(files, zipName) {
      if (!window.JSZip) {
        var s = document.createElement('script');
        s.src = JSZIP_CDN;
        document.head.appendChild(s);
        await new Promise(function(r) { s.onload = r; });
      }
      var zip = new JSZip();
      files.forEach(function(f) { zip.file(f.name, f.data); });
      var blob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(blob, zipName || 'download.zip');
    },

    /** Format bytes to human-readable string */
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    /** Initialize drag-drop on an element */
    initDragDrop(element, options) {
      var accept = options.accept || '.pdf';
      var multiple = options.multiple || false;
      var onFiles = options.onFiles;
      var dropClass = options.dropClass || 'dragover';

      element.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.add(dropClass);
      });
      element.addEventListener('dragleave', function(e) {
        e.preventDefault();
        element.classList.remove(dropClass);
      });
      element.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove(dropClass);
        var files = Array.from(e.dataTransfer.files);
        if (!multiple) files = files.slice(0, 1);
        if (onFiles) onFiles(files);
      });
    },

    /** Create standard tool page boilerplate elements */
    showToast(message, isError) {
      var existing = document.getElementById('pu-toast');
      if (existing) existing.remove();
      var t = document.createElement('div');
      t.id = 'pu-toast';
      t.textContent = message;
      t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:' + (isError ? '#dc2626' : '#111') + ';color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:9999;font-family:DM Sans,sans-serif;max-width:350px;animation:toastIn .3s ease';
      document.body.appendChild(t);
      setTimeout(function() { t.remove(); }, 3500);
    }
  };

  // Add toast animation
  var style = document.createElement('style');
  style.textContent = '@keyframes toastIn{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}';
  document.head.appendChild(style);
})();
