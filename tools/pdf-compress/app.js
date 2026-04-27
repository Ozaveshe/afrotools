(function () {
  'use strict';

  var MAX_CANVAS_PIXELS = 16000000;
  var ZIP_NAME = 'compressed_pdfs.zip';
  var state = {
    files: [],
    preset: 'screen',
    busy: false,
    results: [],
    download: null
  };
  var els = {};

  var PRESETS = {
    screen: { label: 'Clean', mode: 'clean' },
    web: { label: 'Balanced', mode: 'raster', dpi: 110, quality: 0.72, grayscale: false, cleanFirst: true },
    ebook: { label: 'Strong', mode: 'raster', dpi: 96, quality: 0.58, grayscale: false, cleanFirst: false },
    print: { label: 'High quality', mode: 'raster', dpi: 150, quality: 0.82, grayscale: false, cleanFirst: true },
    custom: { label: 'Custom', mode: 'raster', dpi: 110, quality: 0.7, grayscale: false, cleanFirst: false }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function getPdfLib() {
    if (!window.PDFLib || !window.PDFLib.PDFDocument) {
      throw new Error('PDF library failed to load. Please refresh the page.');
    }
    return window.PDFLib;
  }

  function getPdfJs() {
    if (!window.pdfjsLib) return null;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';
    return window.pdfjsLib;
  }

  function isPdfFile(file) {
    return !!(file && ((file.type && file.type === 'application/pdf') || /\.pdf$/i.test(file.name || '')));
  }

  function fileKey(file) {
    return [file.name, file.size, file.lastModified].join(':');
  }

  function cleanBaseName(name) {
    return String(name || 'document').replace(/\.pdf$/i, '').replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '') || 'document';
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var value = bytes;
    var unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return (unit === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)) + ' ' + units[unit];
  }

  function savingsText(original, compressed) {
    var saved = original - compressed;
    if (saved <= 0) return '0% saved';
    return Math.round((saved / original) * 100) + '% saved';
  }

  function showResult(message, isError) {
    els.resultCard.classList.add('on');
    els.resultContent.style.display = 'none';
    els.processingText.style.display = 'block';
    var label = els.processingText.querySelector('div:first-child');
    if (label) label.textContent = message;
    if (isError) label.style.color = '#b91c1c';
    else label.style.color = '#334155';
  }

  function setProgress(percent) {
    els.progressFill.style.width = Math.max(0, Math.min(100, percent)) + '%';
  }

  function hideProcessing() {
    els.processingText.style.display = 'none';
  }

  function setBusy(value) {
    state.busy = value;
    els.compressBtn.disabled = value || state.files.length === 0;
    els.compressBtn.textContent = value ? 'Compressing...' : 'Compress PDF';
    document.querySelectorAll('.preset-btn').forEach(function (button) {
      button.disabled = value;
    });
  }

  function addFiles(fileList) {
    var next = [];
    var seen = {};
    var rejected = 0;
    Array.from(fileList || []).forEach(function (file) {
      if (!isPdfFile(file)) {
        rejected++;
        return;
      }
      var key = fileKey(file);
      if (seen[key]) return;
      seen[key] = true;
      next.push(file);
    });
    state.files = next;
    state.results = [];
    state.download = null;
    renderFiles();
    resetResult(rejected ? 'Skipped ' + rejected + ' non-PDF file' + (rejected === 1 ? '.' : 's.') : '');
  }

  function renderFiles() {
    els.batchBadge.style.display = state.files.length > 1 ? 'inline' : 'none';
    els.fileInfo.style.display = state.files.length ? 'block' : 'none';
    els.batchFileList.style.display = state.files.length ? 'grid' : 'none';
    els.compressBtn.disabled = state.busy || state.files.length === 0;
    if (!state.files.length) {
      els.fileName.textContent = '';
      els.fileSize.textContent = '';
      els.batchFileList.innerHTML = '';
      return;
    }
    var total = state.files.reduce(function (sum, file) { return sum + file.size; }, 0);
    els.fileName.textContent = state.files.length === 1 ? state.files[0].name : state.files.length + ' PDFs selected';
    els.fileSize.textContent = formatBytes(total);
    els.batchFileList.innerHTML = '';
    state.files.forEach(function (file) {
      var row = document.createElement('div');
      row.className = 'file-row';
      row.innerHTML = '<div class="file-row-name"></div><div class="file-row-meta"></div>';
      row.querySelector('.file-row-name').textContent = file.name;
      row.querySelector('.file-row-meta').textContent = formatBytes(file.size);
      els.batchFileList.appendChild(row);
    });
  }

  function resetResult(note) {
    els.resultCard.classList.remove('on');
    els.resultContent.style.display = 'none';
    els.processingText.style.display = 'none';
    els.resultRows.innerHTML = '';
    els.resultNote.style.display = note ? 'block' : 'none';
    els.resultNote.textContent = note || '';
  }

  function activeSettings() {
    var base = Object.assign({}, PRESETS[state.preset] || PRESETS.screen);
    if (state.preset === 'custom') {
      base.dpi = Number(els.dpiSlider.value) || 110;
      base.quality = (Number(els.qualitySlider.value) || 70) / 100;
      base.grayscale = !!els.grayscaleToggle.checked;
      base.cleanFirst = !!els.keepTextToggle.checked;
      var targetKb = Number(els.targetSizeInput.value);
      base.targetBytes = targetKb > 0 ? targetKb * 1024 : 0;
    }
    return base;
  }

  async function cleanPdf(sourceBytes) {
    var PDFDocument = getPdfLib().PDFDocument;
    var pdf = await PDFDocument.load(sourceBytes.slice(0), { ignoreEncryption: true, updateMetadata: false });
    return {
      bytes: await pdf.save({ useObjectStreams: true, addDefaultPage: false }),
      pageCount: pdf.getPageCount()
    };
  }

  function fitScale(width, height, scale) {
    var pixels = width * scale * height * scale;
    if (pixels <= MAX_CANVAS_PIXELS) return scale;
    return Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  }

  function blobFromCanvas(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('Could not encode a page image.'));
          return;
        }
        blob.arrayBuffer().then(function (buffer) {
          resolve(buffer);
        }, reject);
      }, 'image/jpeg', quality);
    });
  }

  function applyGrayscale(canvas) {
    var ctx = canvas.getContext('2d');
    var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = image.data;
    for (var i = 0; i < data.length; i += 4) {
      var gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    ctx.putImageData(image, 0, 0);
  }

  async function rasterizePdf(sourceBytes, settings, progressStart, progressSpan) {
    var pdfjs = getPdfJs();
    if (!pdfjs) throw new Error('PDF rendering library failed to load. Please refresh the page.');
    var PDFDocument = getPdfLib().PDFDocument;
    var pdf = await pdfjs.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) }).promise;
    var output = await PDFDocument.create();
    for (var i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
      var baseViewport = page.getViewport({ scale: 1 });
      var scale = fitScale(baseViewport.width, baseViewport.height, (settings.dpi || 110) / 72);
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      var ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not create a canvas for page ' + i + '.');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: viewport, background: 'white' }).promise;
      if (settings.grayscale) applyGrayscale(canvas);
      var jpgBytes = await blobFromCanvas(canvas, settings.quality || 0.7);
      var image = await output.embedJpg(jpgBytes);
      var newPage = output.addPage([baseViewport.width, baseViewport.height]);
      newPage.drawImage(image, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
      canvas.width = 1;
      canvas.height = 1;
      setProgress(progressStart + (i / pdf.numPages) * progressSpan);
    }
    return {
      bytes: await output.save({ useObjectStreams: true, addDefaultPage: false }),
      pageCount: pdf.numPages
    };
  }

  async function compressOne(file, settings, fileIndex, fileCount) {
    var sourceBytes = await file.arrayBuffer();
    var originalSize = file.size;
    var progressBase = (fileIndex / fileCount) * 92;
    var progressSpan = 92 / fileCount;
    var clean = await cleanPdf(sourceBytes);
    var warnings = [];

    if (settings.mode === 'clean') {
      if (clean.bytes.length <= originalSize) {
        return resultFor(file, clean.bytes, originalSize, clean.pageCount, 'Clean', warnings);
      }
      warnings.push('Already optimized; original kept because clean rewrite was larger.');
      return resultFor(file, new Uint8Array(sourceBytes), originalSize, clean.pageCount, 'Original kept', warnings);
    }

    if (settings.cleanFirst && clean.bytes.length <= originalSize * 0.97 && (!settings.targetBytes || clean.bytes.length <= settings.targetBytes)) {
      warnings.push('Clean rewrite was enough, so selectable text was preserved.');
      return resultFor(file, clean.bytes, originalSize, clean.pageCount, 'Clean', warnings);
    }

    var attempt = Object.assign({}, settings);
    var best = null;
    var attempts = settings.targetBytes ? 4 : 1;
    for (var i = 0; i < attempts; i++) {
      var raster = await rasterizePdf(sourceBytes, attempt, progressBase + (i / attempts) * progressSpan, progressSpan / attempts);
      if (!best || raster.bytes.length < best.bytes.length) {
        best = raster;
      }
      if (!settings.targetBytes || raster.bytes.length <= settings.targetBytes) break;
      attempt = Object.assign({}, attempt, {
        dpi: Math.max(60, Math.round((attempt.dpi || 110) * 0.84)),
        quality: Math.max(0.25, (attempt.quality || 0.7) * 0.78)
      });
    }

    if (!best) throw new Error('Compression failed before output was created.');
    if (best.bytes.length >= originalSize && clean.bytes.length < best.bytes.length) {
      best = clean;
      warnings.push('Raster output was larger; clean PDF output used instead.');
      return resultFor(file, best.bytes, originalSize, best.pageCount, 'Clean fallback', warnings);
    }
    if (best.bytes.length >= originalSize) {
      warnings.push('File was already compact; output may not be smaller.');
    }
    if (settings.targetBytes && best.bytes.length > settings.targetBytes) {
      warnings.push('Target size could not be reached without going below safe quality limits.');
    }
    if (settings.mode === 'raster') {
      warnings.push('Raster mode keeps the page appearance but may remove selectable text.');
    }
    return resultFor(file, best.bytes, originalSize, best.pageCount, settings.label || 'Compressed', warnings);
  }

  function resultFor(file, bytes, originalSize, pageCount, mode, warnings) {
    return {
      name: cleanBaseName(file.name) + '_compressed.pdf',
      sourceName: file.name,
      bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
      originalSize: originalSize,
      compressedSize: bytes.length,
      pageCount: pageCount,
      mode: mode,
      warnings: warnings || []
    };
  }

  function renderResults() {
    var totalOriginal = state.results.reduce(function (sum, item) { return sum + item.originalSize; }, 0);
    var totalCompressed = state.results.reduce(function (sum, item) { return sum + item.compressedSize; }, 0);
    els.originalSize.textContent = formatBytes(totalOriginal);
    els.compressedSize.textContent = formatBytes(totalCompressed);
    els.savingsBadge.textContent = savingsText(totalOriginal, totalCompressed);
    els.savingsBadge.style.background = totalCompressed < totalOriginal ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.16)';
    els.savingsBadge.style.color = totalCompressed < totalOriginal ? '#047857' : '#92400e';
    els.resultRows.innerHTML = '';
    var notes = [];
    state.results.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML = '<div><div class="result-row-name"></div><div class="result-row-meta"></div></div><div class="result-row-meta"></div>';
      row.querySelector('.result-row-name').textContent = item.sourceName;
      row.querySelectorAll('.result-row-meta')[0].textContent = item.mode + ' | ' + item.pageCount + ' page' + (item.pageCount === 1 ? '' : 's');
      row.querySelectorAll('.result-row-meta')[1].textContent = formatBytes(item.originalSize) + ' -> ' + formatBytes(item.compressedSize);
      els.resultRows.appendChild(row);
      item.warnings.forEach(function (warning) {
        notes.push(item.sourceName + ': ' + warning);
      });
    });
    els.resultNote.style.display = notes.length ? 'block' : 'none';
    els.resultNote.textContent = notes.join(' ');
    els.processingText.style.display = 'none';
    els.resultContent.style.display = 'block';
    els.resultCard.classList.add('on');
    var single = state.results.length === 1;
    var blob = single
      ? new Blob([state.results[0].bytes], { type: 'application/pdf' })
      : buildZip(state.results.map(function (item) { return { name: item.name, data: item.bytes }; }));
    state.download = {
      blob: blob,
      filename: single ? state.results[0].name : ZIP_NAME
    };
    els.downloadBtn.textContent = single ? 'Download compressed PDF' : 'Download ZIP';
  }

  async function compressSelected() {
    if (!state.files.length || state.busy) return;
    setBusy(true);
    state.results = [];
    state.download = null;
    setProgress(0);
    showResult('Preparing compression...', false);
    var settings = activeSettings();
    try {
      for (var i = 0; i < state.files.length; i++) {
        showResult('Compressing ' + (i + 1) + '/' + state.files.length + ': ' + state.files[i].name, false);
        state.results.push(await compressOne(state.files[i], settings, i, state.files.length));
      }
      setProgress(100);
      renderResults();
    } catch (err) {
      showResult('Error: ' + (err.message || 'Compression failed.'), true);
      els.resultContent.style.display = 'none';
    } finally {
      setBusy(false);
    }
  }

  function downloadBlob(blob, filename) {
    function runDownload() {
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }
    var gate = document.querySelector('email-gate-modal');
    if (gate && typeof gate.show === 'function') gate.show(runDownload);
    else runDownload();
  }

  function crc32(data) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
      }
    }
    var value = 0xffffffff;
    for (var i = 0; i < data.length; i++) value = table[(value ^ data[i]) & 0xff] ^ (value >>> 8);
    return (value ^ 0xffffffff) >>> 0;
  }

  function buildZip(files) {
    var encoder = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;
    files.forEach(function (file) {
      var name = encoder.encode(file.name);
      var data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      var local = new Uint8Array(30 + name.length);
      var localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint32(14, crc32(data), true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      local.set(name, 30);

      var entry = new Uint8Array(46 + name.length);
      var entryView = new DataView(entry.buffer);
      entryView.setUint32(0, 0x02014b50, true);
      entryView.setUint16(4, 20, true);
      entryView.setUint16(6, 20, true);
      entryView.setUint32(16, crc32(data), true);
      entryView.setUint32(20, data.length, true);
      entryView.setUint32(24, data.length, true);
      entryView.setUint16(28, name.length, true);
      entryView.setUint32(38, 32, true);
      entryView.setUint32(42, offset, true);
      entry.set(name, 46);

      central.push(entry);
      parts.push(local, data);
      offset += local.length + data.length;
    });
    var centralOffset = offset;
    var centralSize = 0;
    central.forEach(function (entry) {
      parts.push(entry);
      centralSize += entry.length;
    });
    var end = new Uint8Array(22);
    var endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, centralOffset, true);
    parts.push(end);
    return new Blob(parts, { type: 'application/zip' });
  }

  function bindEvents() {
    document.querySelectorAll('.preset-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        state.preset = button.dataset.preset;
        document.querySelectorAll('.preset-btn').forEach(function (item) { item.classList.remove('on'); });
        button.classList.add('on');
        els.customPanel.style.display = state.preset === 'custom' ? 'block' : 'none';
        resetResult('');
      });
    });

    els.pdfFileInput.addEventListener('change', function (event) {
      addFiles(event.target.files);
      event.target.value = '';
    });

    var label = document.querySelector('.file-input-label');
    label.addEventListener('dragover', function (event) {
      event.preventDefault();
      label.classList.add('dragover');
    });
    label.addEventListener('dragleave', function () {
      label.classList.remove('dragover');
    });
    label.addEventListener('drop', function (event) {
      event.preventDefault();
      label.classList.remove('dragover');
      addFiles(event.dataTransfer.files);
    });

    els.dpiSlider.addEventListener('input', function () {
      els.dpiVal.textContent = els.dpiSlider.value;
    });
    els.qualitySlider.addEventListener('input', function () {
      els.qualityVal.textContent = els.qualitySlider.value;
    });
    els.compressBtn.addEventListener('click', compressSelected);
    els.downloadBtn.addEventListener('click', function () {
      if (state.download) downloadBlob(state.download.blob, state.download.filename);
    });
  }

  function init() {
    els.pdfFileInput = $('pdfFileInput');
    els.fileInfo = $('fileInfo');
    els.fileName = $('fileName');
    els.fileSize = $('fileSize');
    els.batchFileList = $('batchFileList');
    els.batchBadge = $('batchBadge');
    els.compressBtn = $('compressBtn');
    els.resultCard = $('resultCard');
    els.resultContent = $('resultContent');
    els.processingText = $('processingText');
    els.progressFill = $('progressFill');
    els.originalSize = $('originalSize');
    els.compressedSize = $('compressedSize');
    els.savingsBadge = $('savingsBadge');
    els.resultRows = $('resultRows');
    els.resultNote = $('resultNote');
    els.downloadBtn = $('downloadBtn');
    els.customPanel = $('customPanel');
    els.dpiSlider = $('dpiSlider');
    els.qualitySlider = $('qualitySlider');
    els.dpiVal = $('dpiVal');
    els.qualityVal = $('qualityVal');
    els.targetSizeInput = $('targetSizeInput');
    els.grayscaleToggle = $('grayscaleToggle');
    els.keepTextToggle = $('keepTextToggle');
    getPdfJs();
    bindEvents();
    renderFiles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
