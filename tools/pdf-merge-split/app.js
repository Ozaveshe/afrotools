(function () {
  'use strict';

  var PDFJS_WORKER = '/assets/vendor/pdfjs/pdf.worker.min.js';
  var MAX_THUMBNAILS = 80;

  var state = {
    currentMode: 'merge',
    mergeFiles: [],
    mergedPdf: null,
    splitFile: null,
    splitBytes: null,
    splitPdfDoc: null,
    splitThumbnails: {},
    splitCuts: {},
    splitSelectedPages: {},
    splitMode: 'cuts',
    lastDownload: null,
    busy: false
  };

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function getPDFLib() {
    if (!window.PDFLib) throw new Error('PDF library failed to load. Please refresh the page.');
    return window.PDFLib;
  }

  function getPdfJs() {
    if (!window.pdfjsLib) return null;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    return window.pdfjsLib;
  }

  function isPdfFile(file) {
    return !!(file && ((file.type && file.type === 'application/pdf') || /\.pdf$/i.test(file.name || '')));
  }

  function fileKey(file) {
    return [file.name, file.size, file.lastModified || 0].join(':');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function cleanBaseName(name) {
    return (name || 'document')
      .replace(/\.pdf$/i, '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'document';
  }

  function showResult(message, isError) {
    els.resultText.textContent = message;
    els.resultText.style.color = isError ? '#b91c1c' : '#1e293b';
    els.resultCard.classList.add('on');
  }

  function setProgress(value) {
    els.progressBar.style.display = 'block';
    els.progressFill.style.width = Math.max(0, Math.min(100, value)) + '%';
  }

  function hideProgress() {
    els.progressBar.style.display = 'none';
    els.progressFill.style.width = '0%';
  }

  function setBusy(button, label) {
    state.busy = true;
    button.disabled = true;
    button.dataset.idleText = button.dataset.idleText || button.textContent;
    button.textContent = label;
  }

  function clearBusy(button) {
    state.busy = false;
    button.textContent = button.dataset.idleText || button.textContent;
    syncMergeButton();
    syncSplitButton();
  }

  function downloadBlob(blob, filename) {
    function runDownload() {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }
    var gate = document.querySelector('email-gate-modal');
    if (gate && typeof gate.show === 'function') gate.show(runDownload);
    else runDownload();
  }

  function setDownloadAction(label, blob, filename) {
    state.lastDownload = { blob: blob, filename: filename };
    els.actionRow.innerHTML = '';
    var button = document.createElement('button');
    button.className = 'act-btn act-download';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', function () {
      downloadBlob(blob, filename);
    });
    els.actionRow.appendChild(button);
    els.actionRow.style.display = 'grid';
  }

  async function readPdfInfo(file) {
    var bytes = await file.arrayBuffer();
    var pdf = await getPDFLib().PDFDocument.load(bytes, { ignoreEncryption: true });
    return { pageCount: pdf.getPageCount() };
  }

  function activateMode(mode) {
    state.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(function (button) {
      button.classList.toggle('on', button.dataset.mode === mode);
    });
    els.mergeCard.style.display = mode === 'merge' ? 'block' : 'none';
    els.splitCard.style.display = mode === 'split' ? 'block' : 'none';
    els.resultCard.classList.remove('on');
  }

  function addMergeFiles(files) {
    var existing = {};
    state.mergeFiles.forEach(function (item) { existing[item.id] = true; });
    var rejected = 0;
    Array.from(files || []).forEach(function (file) {
      if (!isPdfFile(file)) {
        rejected++;
        return;
      }
      var id = fileKey(file);
      if (existing[id]) return;
      existing[id] = true;
      state.mergeFiles.push({ id: id, file: file, pageCount: null, pageSpec: '', error: null, loading: true });
      analyzeMergeFile(id);
    });
    renderMergeFileList();
    if (rejected) showResult('Skipped ' + rejected + ' non-PDF file' + (rejected === 1 ? '.' : 's.'), true);
  }

  async function analyzeMergeFile(id) {
    var item = state.mergeFiles.find(function (entry) { return entry.id === id; });
    if (!item) return;
    try {
      var info = await readPdfInfo(item.file);
      item.pageCount = info.pageCount;
      item.error = null;
    } catch (err) {
      item.error = err.message || 'Could not read this PDF.';
    } finally {
      item.loading = false;
      renderMergeFileList();
    }
  }

  function moveMergeFile(from, to) {
    if (to < 0 || to >= state.mergeFiles.length || from === to) return;
    var item = state.mergeFiles.splice(from, 1)[0];
    state.mergeFiles.splice(to, 0, item);
    renderMergeFileList();
  }

  function renderMergeFileList() {
    els.mergeFileList.innerHTML = '';
    state.mergeFiles.forEach(function (entry, index) {
      var item = document.createElement('div');
      item.className = 'file-item';
      item.draggable = true;
      item.dataset.index = index;

      var number = document.createElement('span');
      number.style.cssText = 'color:#64748b;font-size:.78rem;font-weight:800;';
      number.textContent = index + 1;

      var name = document.createElement('span');
      name.className = 'file-item-name';
      name.textContent = entry.file.name;

      var meta = document.createElement('span');
      meta.className = 'file-item-meta';
      var pageText = entry.loading ? 'reading pages...' : (entry.error ? 'PDF error' : entry.pageCount + ' page' + (entry.pageCount === 1 ? '' : 's'));
      meta.textContent = formatSize(entry.file.size) + ' | ' + pageText;
      if (entry.error) meta.classList.add('err');

      var pageField = document.createElement('label');
      pageField.className = 'merge-pages-field';
      var pageLabel = document.createElement('span');
      pageLabel.textContent = 'Pages';
      var pageInput = document.createElement('input');
      pageInput.type = 'text';
      pageInput.value = entry.pageSpec || '';
      pageInput.placeholder = entry.pageCount ? 'All / 1-' + entry.pageCount : 'All pages';
      pageInput.dataset.action = 'pages';
      pageInput.setAttribute('aria-label', 'Pages from ' + entry.file.name + ' to include');
      pageInput.disabled = state.busy || entry.loading || !!entry.error;
      pageField.append(pageLabel, pageInput);

      var controls = document.createElement('span');
      controls.className = 'file-item-controls';
      controls.innerHTML =
        '<button class="mini-btn" type="button" data-action="up" aria-label="Move up">Up</button>' +
        '<button class="mini-btn" type="button" data-action="down" aria-label="Move down">Down</button>' +
        '<button class="mini-btn" type="button" data-action="remove" aria-label="Remove">Remove</button>';

      item.append(number, name, meta, pageField, controls);
      els.mergeFileList.appendChild(item);
    });

    setupDragReorder();
    syncMergeButton();
  }

  function syncMergeButton() {
    var valid = state.mergeFiles.filter(function (entry) { return !entry.error && !entry.loading; });
    var hasErrors = state.mergeFiles.some(function (entry) { return !!entry.error; });
    var rangeError = false;
    var rangeMessage = '';
    var totalPages = 0;
    valid.forEach(function (entry) {
      if (!entry.pageCount) return;
      var parsed = parsePageSelection(entry.pageSpec, entry.pageCount);
      if (!parsed.valid) {
        rangeError = true;
        if (!rangeMessage) rangeMessage = entry.file.name + ': ' + parsed.error;
      } else {
        totalPages += parsed.pages.length;
      }
    });
    els.mergeBtn.disabled = state.busy || valid.length < 2 || hasErrors || rangeError;
    els.clearMergeBtn.disabled = state.mergeFiles.length === 0 || state.busy;
    if (!state.mergeFiles.length) els.mergeSummary.textContent = 'Add at least two PDFs to merge.';
    else if (hasErrors) els.mergeSummary.textContent = 'Remove unreadable PDFs before merging.';
    else if (rangeError) els.mergeSummary.textContent = rangeMessage;
    else els.mergeSummary.textContent = valid.length + ' PDF' + (valid.length === 1 ? '' : 's') + ' ready' + (totalPages ? ' | ' + totalPages + ' pages' : '') + '.';
  }

  function setupDragReorder() {
    var draggedIndex = null;
    els.mergeFileList.querySelectorAll('.file-item').forEach(function (item) {
      item.addEventListener('dragstart', function () {
        draggedIndex = Number(item.dataset.index);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', function () {
        item.classList.remove('dragging');
        draggedIndex = null;
      });
      item.addEventListener('dragover', function (event) {
        event.preventDefault();
        var targetIndex = Number(item.dataset.index);
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
          moveMergeFile(draggedIndex, targetIndex);
          draggedIndex = targetIndex;
        }
      });
    });
  }

  async function mergePdfs() {
    var items = state.mergeFiles.filter(function (entry) { return !entry.error && !entry.loading; });
    if (items.length < 2) return;
    setBusy(els.mergeBtn, 'Merging...');
    setProgress(0);
    els.actionRow.style.display = 'none';
    showResult('Merging PDFs...', false);
    try {
      var mergedDoc = await getPDFLib().PDFDocument.create();
      for (var i = 0; i < items.length; i++) {
        var ab = await items[i].file.arrayBuffer();
        var pdf = await getPDFLib().PDFDocument.load(ab, { ignoreEncryption: true });
        var selection = parsePageSelection(items[i].pageSpec, pdf.getPageCount());
        if (!selection.valid) throw new Error(items[i].file.name + ': ' + selection.error);
        var pages = await mergedDoc.copyPages(pdf, selection.pages);
        pages.forEach(function (page) { mergedDoc.addPage(page); });
        setProgress(((i + 1) / items.length) * 95);
      }
      var bytes = await mergedDoc.save({ useObjectStreams: false });
      state.mergedPdf = bytes;
      setProgress(100);
      var pageCount = mergedDoc.getPageCount();
      showResult('Merged ' + items.length + ' PDFs into one ' + pageCount + '-page document.', false);
      var filename = cleanBaseName(items[0].file.name) + '_merged.pdf';
      setDownloadAction('Download merged PDF', new Blob([bytes], { type: 'application/pdf' }), filename);
    } catch (err) {
      showResult('Error merging: ' + (err.message || 'Unknown error'), true);
      els.actionRow.style.display = 'none';
    } finally {
      hideProgress();
      clearBusy(els.mergeBtn);
    }
  }

  async function loadSplitFile(file) {
    if (!isPdfFile(file)) {
      showResult('Please choose a PDF file.', true);
      return;
    }
    state.splitFile = file;
    state.splitBytes = null;
    state.splitPdfDoc = null;
    state.splitCuts = {};
    state.splitSelectedPages = {};
    state.splitThumbnails = {};
    els.splitInfo.style.display = 'none';
    els.actionRow.style.display = 'none';
    showResult('Reading PDF...', false);
    setProgress(12);
    try {
      var arrayBuffer = await file.arrayBuffer();
      state.splitBytes = arrayBuffer.slice(0);
      state.splitPdfDoc = await getPDFLib().PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
      var pageCount = state.splitPdfDoc.getPageCount();
      els.splitFileName.textContent = file.name;
      els.splitPageCount.textContent = pageCount;
      els.splitInfo.style.display = 'block';
      setProgress(35);
      await generateThumbnails(arrayBuffer.slice(0), pageCount);
      renderSplitGrid();
      syncSplitButton();
      hideProgress();
      els.resultCard.classList.remove('on');
    } catch (err) {
      hideProgress();
      showResult('Error loading PDF: ' + (err.message || 'Unknown error'), true);
      syncSplitButton();
    }
  }

  async function generateThumbnails(bytes, pageCount) {
    var pdfjs = getPdfJs();
    if (!pdfjs) return;
    try {
      var pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
      var limit = Math.min(pdf.numPages, MAX_THUMBNAILS);
      for (var i = 0; i < limit; i++) {
        try {
          var page = await pdf.getPage(i + 1);
          var viewport = page.getViewport({ scale: 0.32 });
          var canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          var ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: viewport }).promise;
          state.splitThumbnails[i] = canvas.toDataURL('image/jpeg', 0.68);
        } catch (_) {}
        setProgress(35 + ((i + 1) / Math.max(1, limit)) * 55);
      }
    } catch (_) {}
  }

  function setSplitMode(mode) {
    state.splitMode = mode;
    document.querySelectorAll('.split-mode-btn').forEach(function (button) {
      button.classList.toggle('on', button.dataset.splitMode === mode);
    });
    document.querySelectorAll('.split-panel').forEach(function (panel) { panel.classList.remove('on'); });
    $(mode + 'Panel').classList.add('on');
    renderSplitGrid();
    syncSplitButton();
  }

  function pageCount() {
    return state.splitPdfDoc ? state.splitPdfDoc.getPageCount() : 0;
  }

  function renderSplitGrid() {
    var total = pageCount();
    els.splitGrid.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var cell = document.createElement('div');
      var selectable = state.splitMode === 'extract';
      cell.className = 'sp-cell' + (selectable ? ' selectable' : '') + (state.splitSelectedPages[i] ? ' selected' : '');
      cell.dataset.pageIndex = i;
      var thumb = state.splitThumbnails[i]
        ? '<img src="' + state.splitThumbnails[i] + '" alt="Page ' + (i + 1) + '">'
        : '<div class="sp-ph">Page ' + (i + 1) + '</div>';
      cell.innerHTML = '<div class="sp-cell-thumb">' + thumb + '</div><div class="sp-cell-label">Page ' + (i + 1) + '</div>';
      if (state.splitMode === 'cuts' && i < total - 1) {
        var cut = document.createElement('button');
        cut.type = 'button';
        cut.className = 'sp-cut' + (state.splitCuts[i] ? ' on' : '');
        cut.setAttribute('aria-label', 'Split after page ' + (i + 1));
        cut.innerHTML = '<div class="sc-icon">+</div>';
        cut.addEventListener('click', function (event) {
          event.stopPropagation();
          var idx = Number(event.currentTarget.parentElement.dataset.pageIndex);
          if (state.splitCuts[idx]) delete state.splitCuts[idx];
          else state.splitCuts[idx] = true;
          renderSplitGrid();
          syncSplitButton();
        });
        cell.appendChild(cut);
      }
      if (selectable) {
        cell.addEventListener('click', function (event) {
          var idx = Number(event.currentTarget.dataset.pageIndex);
          if (state.splitSelectedPages[idx]) delete state.splitSelectedPages[idx];
          else state.splitSelectedPages[idx] = true;
          els.extractInput.value = pagesToSpec(Object.keys(state.splitSelectedPages).map(Number).sort(function (a, b) { return a - b; }));
          renderSplitGrid();
          syncSplitButton();
        });
      }
      els.splitGrid.appendChild(cell);
    }
  }

  function parsePageSelection(text, total) {
    var value = String(text || '').trim();
    if (!value || /^all$/i.test(value)) {
      var allPages = [];
      for (var i = 0; i < total; i++) allPages.push(i);
      return { valid: true, pages: allPages };
    }
    var parsed = parseRangeGroups(value, total);
    if (!parsed.valid) return parsed;
    return { valid: true, pages: expandGroups(parsed.groups) };
  }

  function parseRangeGroups(text, total) {
    var raw = String(text || '').trim();
    if (!raw) return { valid: false, error: 'Enter at least one page or range.', groups: [] };
    var groups = [];
    var parts = raw.split(',');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (!part) continue;
      var match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) return { valid: false, error: 'Use page numbers and ranges like 1-3, 5.', groups: [] };
      var start = Number(match[1]);
      var end = match[2] ? Number(match[2]) : start;
      if (start < 1 || end < 1 || start > total || end > total) {
        return { valid: false, error: 'Pages must be between 1 and ' + total + '.', groups: [] };
      }
      if (end < start) return { valid: false, error: 'Range ' + part + ' ends before it starts.', groups: [] };
      groups.push([start - 1, end - 1]);
    }
    if (!groups.length) return { valid: false, error: 'Enter at least one page or range.', groups: [] };
    return { valid: true, groups: groups };
  }

  function expandGroups(groups) {
    var pages = [];
    var seen = {};
    groups.forEach(function (range) {
      for (var page = range[0]; page <= range[1]; page++) {
        if (!seen[page]) {
          seen[page] = true;
          pages.push(page);
        }
      }
    });
    return pages;
  }

  function pagesToSpec(pages) {
    if (!pages.length) return '';
    var ranges = [];
    var start = pages[0];
    var prev = pages[0];
    for (var i = 1; i <= pages.length; i++) {
      var current = pages[i];
      if (current === prev + 1) {
        prev = current;
        continue;
      }
      ranges.push(start === prev ? String(start + 1) : (start + 1) + '-' + (prev + 1));
      start = current;
      prev = current;
    }
    return ranges.join(', ');
  }

  function getCutRanges() {
    var total = pageCount();
    var points = Object.keys(state.splitCuts).map(Number).sort(function (a, b) { return a - b; });
    var ranges = [];
    var start = 0;
    points.forEach(function (point) {
      ranges.push([start, point]);
      start = point + 1;
    });
    ranges.push([start, total - 1]);
    return ranges;
  }

  function syncSplitButton() {
    var total = pageCount();
    var summary = '';
    var enabled = false;
    var label = 'Upload a PDF first';
    if (state.splitPdfDoc && state.splitMode === 'cuts') {
      var cutCount = Object.keys(state.splitCuts).length;
      enabled = cutCount > 0;
      label = enabled ? 'Split into ' + (cutCount + 1) + ' files -> ZIP' : 'Select split points first';
      if (enabled) summary = 'Will create: ' + getCutRanges().map(formatRange).join(' | ');
    } else if (state.splitPdfDoc && state.splitMode === 'ranges') {
      var parsedRanges = parseRangeGroups(els.rangeInput.value, total);
      enabled = parsedRanges.valid;
      label = els.rangeCombine.checked ? 'Extract ranges into one PDF' : 'Split ranges -> ZIP';
      summary = parsedRanges.valid ? 'Ranges: ' + parsedRanges.groups.map(formatRange).join(' | ') : parsedRanges.error;
    } else if (state.splitPdfDoc && state.splitMode === 'extract') {
      var parsedPages = parseRangeGroups(els.extractInput.value, total);
      enabled = parsedPages.valid;
      var pageTotal = parsedPages.valid ? expandGroups(parsedPages.groups).length : 0;
      label = enabled ? 'Extract ' + pageTotal + ' page' + (pageTotal === 1 ? '' : 's') + ' as PDF' : 'Select pages to extract';
      summary = parsedPages.valid ? 'Selected pages: ' + pagesToSpec(expandGroups(parsedPages.groups)) : parsedPages.error;
    } else if (state.splitPdfDoc && state.splitMode === 'every') {
      enabled = total > 0;
      label = 'Export ' + total + ' page' + (total === 1 ? '' : 's') + ' -> ZIP';
      summary = 'Each page will become its own PDF.';
    }
    els.splitBtn.disabled = state.busy || !enabled;
    els.splitBtn.textContent = label;
    els.splitSummary.textContent = state.splitPdfDoc ? summary : '';
  }

  function formatRange(range) {
    return range[0] === range[1] ? 'Page ' + (range[0] + 1) : 'Pages ' + (range[0] + 1) + '-' + (range[1] + 1);
  }

  async function makePdfFromPages(pageIndexes) {
    var doc = await getPDFLib().PDFDocument.create();
    var pages = await doc.copyPages(state.splitPdfDoc, pageIndexes);
    pages.forEach(function (page) { doc.addPage(page); });
    return new Uint8Array(await doc.save({ useObjectStreams: false }));
  }

  async function makeFilesFromRanges(ranges, baseName) {
    var files = [];
    for (var i = 0; i < ranges.length; i++) {
      var indexes = [];
      for (var p = ranges[i][0]; p <= ranges[i][1]; p++) indexes.push(p);
      var bytes = await makePdfFromPages(indexes);
      var suffix = ranges[i][0] === ranges[i][1]
        ? 'page_' + (ranges[i][0] + 1)
        : 'pages_' + (ranges[i][0] + 1) + '-' + (ranges[i][1] + 1);
      files.push({ name: baseName + '_' + suffix + '.pdf', data: bytes });
      setProgress(((i + 1) / ranges.length) * 82);
    }
    return files;
  }

  function crc32(data) {
    var c = 0xFFFFFFFF;
    if (!crc32.t) {
      crc32.t = new Uint32Array(256);
      for (var i = 0; i < 256; i++) {
        var v = i;
        for (var j = 0; j < 8; j++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
        crc32.t[i] = v;
      }
    }
    for (var k = 0; k < data.length; k++) c = crc32.t[(c ^ data[k]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function buildZip(files) {
    var parts = [];
    var central = [];
    var offset = 0;
    files.forEach(function (file) {
      var name = new TextEncoder().encode(file.name);
      var data = file.data;
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

  async function performSplit() {
    if (!state.splitPdfDoc) return;
    var baseName = cleanBaseName(state.splitFile.name);
    setBusy(els.splitBtn, 'Working...');
    setProgress(0);
    els.actionRow.style.display = 'none';
    showResult('Preparing output...', false);
    try {
      if (state.splitMode === 'cuts') {
        var cutFiles = await makeFilesFromRanges(getCutRanges(), baseName);
        setProgress(92);
        var cutZip = buildZip(cutFiles);
        showResult('Split into ' + cutFiles.length + ' PDF files.', false);
        setDownloadAction('Download ZIP', cutZip, baseName + '_split.zip');
        downloadBlob(cutZip, baseName + '_split.zip');
      } else if (state.splitMode === 'ranges') {
        var parsedRanges = parseRangeGroups(els.rangeInput.value, pageCount());
        if (!parsedRanges.valid) throw new Error(parsedRanges.error);
        if (els.rangeCombine.checked) {
          var pages = expandGroups(parsedRanges.groups);
          var combined = await makePdfFromPages(pages);
          var combinedBlob = new Blob([combined], { type: 'application/pdf' });
          showResult('Extracted ' + pages.length + ' pages into one PDF.', false);
          setDownloadAction('Download extracted PDF', combinedBlob, baseName + '_ranges.pdf');
          downloadBlob(combinedBlob, baseName + '_ranges.pdf');
        } else {
          var rangeFiles = await makeFilesFromRanges(parsedRanges.groups, baseName);
          var rangeZip = buildZip(rangeFiles);
          showResult('Created ' + rangeFiles.length + ' range PDF files.', false);
          setDownloadAction('Download ranges ZIP', rangeZip, baseName + '_ranges.zip');
          downloadBlob(rangeZip, baseName + '_ranges.zip');
        }
      } else if (state.splitMode === 'extract') {
        var parsedPages = parseRangeGroups(els.extractInput.value, pageCount());
        if (!parsedPages.valid) throw new Error(parsedPages.error);
        var selected = expandGroups(parsedPages.groups);
        var extracted = await makePdfFromPages(selected);
        var extractedBlob = new Blob([extracted], { type: 'application/pdf' });
        showResult('Extracted ' + selected.length + ' selected pages into one PDF.', false);
        setDownloadAction('Download selected pages PDF', extractedBlob, baseName + '_selected_pages.pdf');
        downloadBlob(extractedBlob, baseName + '_selected_pages.pdf');
      } else if (state.splitMode === 'every') {
        var ranges = [];
        for (var i = 0; i < pageCount(); i++) ranges.push([i, i]);
        var everyFiles = await makeFilesFromRanges(ranges, baseName);
        var everyZip = buildZip(everyFiles);
        showResult('Exported every page as ' + everyFiles.length + ' separate PDFs.', false);
        setDownloadAction('Download every page ZIP', everyZip, baseName + '_every_page.zip');
        downloadBlob(everyZip, baseName + '_every_page.zip');
      }
      setProgress(100);
    } catch (err) {
      showResult('Error splitting: ' + (err.message || 'Unknown error'), true);
      els.actionRow.style.display = 'none';
    } finally {
      hideProgress();
      clearBusy(els.splitBtn);
    }
  }

  function bindEvents() {
    document.querySelectorAll('.mode-btn').forEach(function (button) {
      button.addEventListener('click', function () { activateMode(button.dataset.mode); });
    });
    document.querySelectorAll('.split-mode-btn').forEach(function (button) {
      button.addEventListener('click', function () { setSplitMode(button.dataset.splitMode); });
    });

    els.mergeFileInput.addEventListener('change', function (event) {
      addMergeFiles(event.target.files);
      event.target.value = '';
    });
    els.splitFileInput.addEventListener('change', function (event) {
      if (event.target.files[0]) loadSplitFile(event.target.files[0]);
      event.target.value = '';
    });

    var mergeLabel = document.querySelector('#merge-card .file-input-label');
    var splitLabel = document.querySelector('#split-card .file-input-label');
    [mergeLabel, splitLabel].forEach(function (label) {
      label.addEventListener('dragover', function (event) {
        event.preventDefault();
        label.classList.add('dragover');
      });
      label.addEventListener('dragleave', function () { label.classList.remove('dragover'); });
    });
    mergeLabel.addEventListener('drop', function (event) {
      event.preventDefault();
      mergeLabel.classList.remove('dragover');
      addMergeFiles(event.dataTransfer.files);
    });
    splitLabel.addEventListener('drop', function (event) {
      event.preventDefault();
      splitLabel.classList.remove('dragover');
      if (event.dataTransfer.files[0]) loadSplitFile(event.dataTransfer.files[0]);
    });

    els.mergeFileList.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-action]');
      if (!button) return;
      var index = Number(button.closest('.file-item').dataset.index);
      if (button.dataset.action === 'remove') state.mergeFiles.splice(index, 1);
      if (button.dataset.action === 'up') moveMergeFile(index, index - 1);
      if (button.dataset.action === 'down') moveMergeFile(index, index + 1);
      renderMergeFileList();
    });

    els.mergeFileList.addEventListener('input', function (event) {
      if (event.target.dataset.action !== 'pages') return;
      var item = event.target.closest('.file-item');
      if (!item) return;
      var index = Number(item.dataset.index);
      if (!state.mergeFiles[index]) return;
      state.mergeFiles[index].pageSpec = event.target.value;
      syncMergeButton();
    });

    els.clearMergeBtn.addEventListener('click', function () {
      state.mergeFiles = [];
      state.mergedPdf = null;
      renderMergeFileList();
      els.resultCard.classList.remove('on');
    });
    els.mergeBtn.addEventListener('click', mergePdfs);
    els.splitBtn.addEventListener('click', performSplit);
    els.rangeInput.addEventListener('input', syncSplitButton);
    els.rangeCombine.addEventListener('change', syncSplitButton);
    els.extractInput.addEventListener('input', function () {
      var parsed = parseRangeGroups(els.extractInput.value, pageCount());
      state.splitSelectedPages = {};
      if (parsed.valid) {
        expandGroups(parsed.groups).forEach(function (page) { state.splitSelectedPages[page] = true; });
      }
      renderSplitGrid();
      syncSplitButton();
    });
  }

  function init() {
    els.mergeCard = $('merge-card');
    els.splitCard = $('split-card');
    els.mergeFileInput = $('mergeFileInput');
    els.splitFileInput = $('splitFileInput');
    els.mergeFileList = $('mergeFileList');
    els.mergeBtn = $('mergeBtn');
    els.clearMergeBtn = $('clearMergeBtn');
    els.mergeSummary = $('mergeSummary');
    els.splitBtn = $('splitBtn');
    els.splitInfo = $('splitInfo');
    els.splitFileName = $('splitFileName');
    els.splitPageCount = $('splitPageCount');
    els.splitGrid = $('splitGrid');
    els.splitSummary = $('splitSummary');
    els.rangeInput = $('rangeInput');
    els.rangeCombine = $('rangeCombine');
    els.extractInput = $('extractInput');
    els.resultCard = $('resultCard');
    els.resultText = $('resultText');
    els.actionRow = $('actionRow');
    els.progressBar = $('progressBar');
    els.progressFill = $('progressFill');

    getPdfJs();
    bindEvents();
    renderMergeFileList();
    syncSplitButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
